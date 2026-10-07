/**
 * Núcleo de conteo de tokens. Se ejecuta dentro del Web Worker
 * (src/workers/tokenizer.worker.ts) y, como fallback, en el hilo principal.
 *
 * Los modelos que comparten tokenizador (p. ej. todos los OpenAI modernos con
 * o200k_base) se codifican una sola vez y se reutiliza el conteo.
 */

import type { ModelResult, Precision } from "@/lib/types";
import type { TokenizerKind } from "@/lib/models.config";
import { estimateTokens } from "./estimate";

export interface CountModel {
  id: string;
  name: string;
  tokenizer: TokenizerKind;
  estimateRatio: number;
  /** el archivo analizado es código (pista para el estimador) */
  codeHint?: boolean;
}

export type CountEvent =
  | { type: "loading"; label: string }
  | { type: "model-done"; result: ModelResult }
  | { type: "progress"; percent: number }
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
  const estimateModels: CountModel[] = [];

  for (const m of models) {
    if (m.tokenizer === "tiktoken-o200k" || m.tokenizer === "tiktoken-cl100k") {
      const list = groups.get(m.tokenizer) ?? [];
      list.push(m);
      groups.set(m.tokenizer, list);
    } else {
      // estimate (hf / api-* aún no disponibles en V1 → estimación)
      estimateModels.push(m);
    }
  }

  // 2) Codificar cada grupo una vez
  for (const [kind, group] of groups) {
    emit({ type: "loading", label: `Cargando tokenizador ${ENCODING_LABELS[kind] ?? kind}…` });
    const { tokens, ms } = await encodeWithProgress(text, kind as "tiktoken-o200k", emit);
    const precision: Precision = "exact";
    for (const m of group) {
      emit({ type: "model-done", result: { modelId: m.id, tokens, precision, ms } });
    }
  }

  // 3) Estimaciones (instantáneas)
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
