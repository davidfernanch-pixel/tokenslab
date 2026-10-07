/**
 * Núcleo de conteo de tokens. Se ejecuta dentro del Web Worker
 * (src/workers/tokenizer.worker.ts) y, como fallback, en el hilo principal.
 *
 * Los modelos que comparten tokenizador (p. ej. todos los OpenAI modernos con
 * o200k_base) se codifican una sola vez y se reutiliza el conteo.
 *
 * Modelos "hf" (Muse Glimmer, Mistral, DeepSeek, Qwen): cuando el modo local exacto
 * está activado (CountModel.hf), se descarga el tokenizer.json oficial desde
 * la CDN de Hugging Face (cacheado en Cache API) y se cuenta con el BPE real
 * (insignia 🟢 Exacto). Si la descarga o el conteo fallan, se degrada a
 * estimación (insignia 🟡) y se emite "hf-failed" para avisar en la UI.
 *
 * Nota i18n: el worker no tiene acceso al store de idioma (localStorage no
 * existe en workers), así que los eventos "loading" llevan una CLAVE de
 * diccionario + variables; el consumidor (store.ts) las traduce con tSync.
 */

import type { ModelResult, Precision } from "@/lib/types";
import { HF_TOKENIZERS, type TokenizerKind } from "@/lib/models.config";
import { estimateTokens } from "./estimate";
import { loadHfTokenizer } from "./hf-bpe";

export interface CountModel {
  id: string;
  name: string;
  tokenizer: TokenizerKind;
  estimateRatio: number;
  /** el archivo analizado es código (pista para el estimador) */
  codeHint?: boolean;
  /** repo de HF con el tokenizer.json oficial (modelos tokenizer: "hf") */
  hfRepo?: string;
  /** modo exacto local activo para este modelo (opt-in en Ajustes) */
  hf?: boolean;
}

export type CountEvent =
  | {
      type: "loading";
      /** qué se está cargando (para el chip de estado y la etiqueta) */
      kind: "tiktoken" | "hf";
      /** clave i18n de la etiqueta (se traduce en el consumidor) */
      labelKey: string;
      /** variables de interpolación de la etiqueta */
      vars?: Record<string, string | number>;
      /** progreso de la descarga (0–100), si aplica */
      percent?: number;
    }
  | { type: "model-done"; result: ModelResult }
  | { type: "progress"; percent: number }
  | { type: "hf-failed"; repo: string }
  | { type: "error"; message: string };

type Emit = (event: CountEvent) => void;

/** Tamaño de trozo para textos enormes (progreso sin congelar el worker) */
const CHUNK_SIZE = 500_000;

const encoderCache = new Map<string, { encode: (text: string) => number[] }>();

async function loadTiktoken(
  kind: "tiktoken-o200k" | "tiktoken-cl100k",
): Promise<{ encode: (text: string) => number[] }> {
  const cached = encoderCache.get(kind);
  if (cached) return cached;
  const mod =
    kind === "tiktoken-o200k"
      ? await import("gpt-tokenizer/encoding/o200k_base")
      : await import("gpt-tokenizer/encoding/cl100k_base");
  const encoder = { encode: (text: string) => mod.encode(text) };
  encoderCache.set(kind, encoder);
  return encoder;
}

/**
 * Codifica texto con tiktoken. Para textos muy grandes trocea el texto y
 * reporta progreso (error de frontera ≤ 1 token por trozo: despreciable).
 */
async function encodeWithProgress(
  text: string,
  kind: "tiktoken-o200k" | "tiktoken-cl100k",
  emit: Emit,
): Promise<{ tokens: number; ms: number }> {
  const t0 = performance.now();
  const encoder = await loadTiktoken(kind);
  let tokens = 0;
  if (text.length <= CHUNK_SIZE) {
    tokens = encoder.encode(text).length;
  } else {
    const chunks = Math.ceil(text.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      tokens += encoder
        .encode(text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))
        .length;
      emit({ type: "progress", percent: Math.round(((i + 1) / chunks) * 100) });
    }
  }
  return { tokens, ms: performance.now() - t0 };
}

/**
 * Cuenta con el tokenizador oficial de Hugging Face (BPE byte-level).
 * Trocea como el camino tiktoken: error de frontera ≤ 1 token por trozo.
 */
async function countWithHf(
  text: string,
  repo: string,
  emit: Emit,
): Promise<{ tokens: number; ms: number }> {
  const t0 = performance.now();
  const label = HF_TOKENIZERS[repo]?.label ?? repo;
  // evento inicial SIEMPRE: la fase "running" del chip HF no puede depender
  // de que haya descarga (segundos análisis usan la caché en memoria)
  emit({
    type: "loading",
    kind: "hf",
    labelKey: "store.progress.loadHf",
    vars: { name: label },
  });
  const tokenizer = await loadHfTokenizer(repo, (p) => {
    emit({
      type: "loading",
      kind: "hf",
      labelKey: p.stage === "download" ? "store.progress.downloadHf" : "store.progress.loadHf",
      vars: { name: label, percent: p.percent },
      percent: p.percent,
    });
  });
  let tokens = 0;
  if (text.length <= CHUNK_SIZE) {
    tokens = tokenizer.count(text);
  } else {
    const chunks = Math.ceil(text.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      tokens += tokenizer.count(text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
      emit({ type: "progress", percent: Math.round(((i + 1) / chunks) * 100) });
    }
  }
  return { tokens, ms: performance.now() - t0 };
}

const ENCODING_LABELS: Record<string, string> = {
  "tiktoken-o200k": "o200k_base (GPT-4o, GPT-4.1, o3, GPT-5…)",
  "tiktoken-cl100k": "cl100k_base (GPT-4 Turbo, GPT-3.5…)",
};

export async function countAll(
  text: string,
  models: CountModel[],
  emit: Emit,
): Promise<void> {
  // 1) Agrupar por tokenizador exacto
  const groups = new Map<string, CountModel[]>();
  const hfGroups = new Map<string, CountModel[]>();
  const estimateModels: CountModel[] = [];

  for (const m of models) {
    if (m.tokenizer === "tiktoken-o200k" || m.tokenizer === "tiktoken-cl100k") {
      const list = groups.get(m.tokenizer) ?? [];
      list.push(m);
      groups.set(m.tokenizer, list);
    } else if (m.tokenizer === "hf" && m.hf && m.hfRepo) {
      // modo exacto local activo → agrupar por repo (una descarga por familia)
      const list = hfGroups.get(m.hfRepo) ?? [];
      list.push(m);
      hfGroups.set(m.hfRepo, list);
    } else {
      // estimate + modelos hf sin modo activo + api-* (aún no disponibles)
      estimateModels.push(m);
    }
  }

  // 2) Codificar cada grupo tiktoken una vez
  for (const [kind, group] of groups) {
    emit({
      type: "loading",
      kind: "tiktoken",
      labelKey: "store.progress.loadTokenizer",
      vars: { name: ENCODING_LABELS[kind] ?? kind },
    });
    const { tokens, ms } = await encodeWithProgress(text, kind as "tiktoken-o200k", emit);
    const precision: Precision = "exact";
    for (const m of group) {
      emit({ type: "model-done", result: { modelId: m.id, tokens, precision, ms } });
    }
  }

  // 3) Tokenizadores HF oficiales (una descarga + conteo por familia)
  for (const [repo, group] of hfGroups) {
    try {
      const { tokens, ms } = await countWithHf(text, repo, emit);
      const precision: Precision = "exact";
      for (const m of group) {
        emit({ type: "model-done", result: { modelId: m.id, tokens, precision, ms } });
      }
    } catch {
      // Sin red, repo caído o formato no soportado → estimación honesta
      emit({ type: "hf-failed", repo });
      for (const m of group) {
        const t0 = performance.now();
        const { tokens } = estimateTokens(text, m.estimateRatio, {
          isCode: m.codeHint,
        });
        const precision: Precision = "estimated";
        emit({
          type: "model-done",
          result: { modelId: m.id, tokens, precision, ms: performance.now() - t0 },
        });
      }
    }
  }

  // 4) Estimaciones (instantáneas)
  for (const m of estimateModels) {
    const t0 = performance.now();
    const { tokens } = estimateTokens(text, m.estimateRatio, {
      isCode: m.codeHint,
    });
    const precision: Precision = "estimated";
    emit({
      type: "model-done",
      result: { modelId: m.id, tokens, precision, ms: performance.now() - t0 },
    });
  }
}
