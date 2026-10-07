"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ACTIVE_MODELS,
  MODELS,
  getModel,
  type CurrencyCode,
} from "@/lib/models.config";
import {
  MAX_FILE_SIZE,
  MAX_FILES,
  type AnalysisMeta,
  type AnalyzedFile,
  type FileStats,
  type ImageInfo,
  type ModelResult,
  type Progress,
  type Status,
} from "@/lib/types";
import { extractText, isCodeFile, isSupportedFile } from "@/lib/extractors";
import { isImageFile, extractImageInfo } from "@/lib/extractors/image";
import { tokenizerClient } from "@/lib/tokenizers/client";
import { getFileStats } from "@/lib/stats";
import { formatBytes } from "@/lib/format";
import { estimateImageTokensForModel } from "@/lib/imageTokens";
import { addHistoryEntry } from "@/lib/history";
import { tSync } from "@/lib/i18n";
import {
  fetchOfficialCount,
  isByokCandidate,
  byokKeyFor,
  type ByokProvider,
} from "@/lib/byok";

/** Estado del modo BYOK durante un análisis */
export interface ByokStatus {
  phase: "idle" | "running" | "done";
  /** modelos que pasaron de estimado a oficial */
  upgraded: number;
  /** modelos cuyo conteo oficial falló (mantienen la estimación) */
  failed: number;
  /** primer mensaje de error recibido, si lo hay */
  error: string | null;
}

/** Estado de los tokenizadores HF locales durante un análisis */
export interface HfStatus {
  phase: "idle" | "running" | "done" | "failed";
  /** modelos contados con el BPE oficial de HF (🟢 exacto local) */
  upgraded: number;
  /** primer repo cuyo tokenizador no se pudo descargar, si lo hay */
  failedRepo: string | null;
}

interface TokenLensState {
  // estado del análisis
  status: Status;
  error: string | null;
  warning: string | null;
  fileName: string | null;
  fileSize: number | null;
  kind: "file" | "text";
  /** concatenación de los textos extraídos (los tools la usan) */
  text: string;
  /** archivos del análisis en curso (texto e imágenes) */
  files: AnalyzedFile[];
  stats: FileStats | null;
  results: ModelResult[];
  progress: Progress | null;
  /** el texto analizado parece código (pista para el optimizador) */
  codeHint: boolean;

  // conteo oficial BYOK (por análisis)
  byok: ByokStatus;
  /** número de análisis: invalida upgrades BYOK obsoletos */
  byokRun: number;

  // tokenizadores HF locales (por análisis)
  hf: HfStatus;

  // ajustes (persistidos)
  activeModels: string[];
  outputTokens: number;
  currency: CurrencyCode;
  /** tokenizadores locales exactos de Hugging Face (opt-in) */
  hfEnabled: boolean;

  // acciones
  analyzeFiles: (list: File[], mode?: "replace" | "add") => Promise<void>;
  analyzeFile: (file: File) => Promise<void>;
  analyzeText: (text: string, name?: string) => Promise<void>;
  removeFile: (id: string) => Promise<void>;
  reset: () => void;
  toggleModel: (id: string) => void;
  setActiveModels: (ids: string[]) => void;
  setOutputTokens: (n: number) => void;
  setCurrency: (c: CurrencyCode) => void;
  setHfEnabled: (enabled: boolean) => void;
}

function toCountModels(codeHint?: boolean, activeIds?: string[], hfEnabled?: boolean) {
  const active = new Set(activeIds ?? []);
  return MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    tokenizer: m.tokenizer,
    estimateRatio: m.estimateRatio ?? 4,
    codeHint,
    hfRepo: m.hfRepo,
    // solo los modelos ACTIVOS cuentan con tokenizador HF: evita descargar
    // familias (6–28 MB) de modelos que el usuario tiene ocultos
    hf: hfEnabled && m.hfRepo != null && active.has(m.id),
  }));
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileLabel(files: AnalyzedFile[]): string {
  return files.length === 1
    ? files[0].name
    : tSync("store.fileLabel", { n: files.length });
}

function totalSize(files: AnalyzedFile[]): number {
  return files.reduce((sum, f) => sum + f.sizeBytes, 0);
}

function textOf(files: AnalyzedFile[]): string {
  return files
    .filter((f) => f.kind === "text")
    .map((f) => f.text ?? "")
    .join("\n\n");
}

function imagesOf(files: AnalyzedFile[]): ImageInfo[] {
  return files
    .filter((f) => f.kind === "image" && f.imageInfo != null)
    .map((f) => f.imageInfo as ImageInfo);
}

/** revoke de las URLs de previsualización en memoria */
function revokePreviews(files: AnalyzedFile[]): void {
  for (const f of files) {
    if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
  }
}

export const useTokenLens = create<TokenLensState>()(
  persist(
    (set, get) => {
      /**
       * Fase BYOK: tras el conteo local, pide el conteo OFICIAL a los
       * proveedores con endpoint público (Anthropic y Google) cuando el
       * usuario ha activado el modo y configurado su key.
       *
       * Reglas de honestidad:
       * - Solo se aplica a modelos con tokenizer "estimate" de esos 2
       *   proveedores.
       * - Con imágenes en el análisis NO se aplica (el conteo oficial solo
       *   cubre texto; mezclarlo con tokens de imagen estimados sería una
       *   insignia engañosa).
       * - Cada respuesta válida reemplaza el resultado al instante: la
       *   tarjeta pasa de 🟡 Estimado a 🔵 Oficial en directo.
       * - Un runId invalida los updates obsoletos si empieza otro análisis.
       */
      async function upgradeWithOfficialCounts(
        text: string,
        runId: number,
      ): Promise<void> {
        if (!text) return;
        if (get().files.some((f) => f.kind === "image")) return;

        // Solo modelos con resultado en este análisis (activos): evita
        // llamadas API desperdiciadas por modelos ocultos en Ajustes.
        const activeIds = new Set(get().activeModels);
        const targets = MODELS.filter(
          (m) => activeIds.has(m.id) && isByokCandidate(m),
        );
        if (targets.length === 0) {
          set({ byok: { phase: "idle", upgraded: 0, failed: 0, error: null } });
          return;
        }

        set({
          byok: { phase: "running", upgraded: 0, failed: 0, error: null },
        });

        await Promise.all(
          targets.map(async (model) => {
            const provider = model.provider as ByokProvider;
            const key = byokKeyFor(provider);
            if (key == null) return;
            const res = await fetchOfficialCount(
              provider,
              model.id,
              text,
              key,
            );
            set((state) => {
              if (state.byokRun !== runId) return state;
              if (res.ok) {
                return {
                  results: state.results.map((r) =>
                    r.modelId === model.id
                      ? { ...r, tokens: res.tokens, precision: "official" as const }
                      : r,
                  ),
                  byok: { ...state.byok, upgraded: state.byok.upgraded + 1 },
                };
              }
              return {
                byok: {
                  ...state.byok,
                  failed: state.byok.failed + 1,
                  error: state.byok.error ?? res.error,
                },
              };
            });
          }),
        );

        set((state) =>
          state.byokRun === runId && state.byok.phase === "running"
            ? { byok: { ...state.byok, phase: "done" } }
            : state,
        );
      }

      /**
       * Cuenta tokens de todos los archivos (texto por archivo + imágenes por
       * fórmula) y publica resultados progresivos durante el último archivo.
       */
      async function runCounting(
        files: AnalyzedFile[],
        kind: "file" | "text",
        warning?: string,
      ): Promise<void> {
        const textFiles = files.filter((f) => f.kind === "text");
        const images = imagesOf(files);
        const text = textOf(files);
        const stats = getFileStats(text);
        const codeHint = textFiles.some((f) => f.code);

        const runId = get().byokRun + 1;
        const hfActive = get().hfEnabled;

        set({
          text,
          files,
          stats,
          warning: warning ?? null,
          kind,
          fileName: fileLabel(files),
          fileSize: totalSize(files),
          codeHint,
          status: "counting",
          error: null,
          results: [],
          progress: { phase: "count", label: tSync("store.progress.counting"), percent: 0 },
          byok: { phase: "idle", upgraded: 0, failed: 0, error: null },
          byokRun: runId,
          hf: { phase: "idle", upgraded: 0, failedRepo: null },
        });

        const models = toCountModels(codeHint, get().activeModels, hfActive);
        const totals = new Map<
          string,
          { tokens: number; ms: number; precision: ModelResult["precision"] }
        >();

        /** resultados finales de los modelos ya completados */
        const buildResults = (completed: Set<string>): ModelResult[] => {
          const out: ModelResult[] = [];
          for (const m of models) {
            if (!completed.has(m.id)) continue;
            const t = totals.get(m.id);
            if (!t) continue;
            const model = getModel(m.id);
            if (!model) continue;
            const imageTokens =
              model.vision && images.length > 0
                ? estimateImageTokensForModel(model, images)
                : undefined;
            out.push({
              modelId: m.id,
              tokens: t.tokens + (imageTokens ?? 0),
              precision: t.precision,
              ms: t.ms,
              ...(imageTokens != null ? { textTokens: t.tokens } : {}),
              ...(imageTokens != null ? { imageTokens } : {}),
            });
          }
          return out;
        };

        const completedAll = new Set<string>();
        let collected: ModelResult[] = [];

        try {
          if (textFiles.length === 0) {
            // Solo imágenes: los tokens de texto son 0 para todos los modelos
            const precisionOf = (id: string) =>
              getModel(id)?.tokenizer.startsWith("tiktoken")
                ? ("exact" as const)
                : ("estimated" as const);
            for (const m of models) {
              totals.set(m.id, {
                tokens: 0,
                ms: 0,
                precision: precisionOf(m.id),
              });
              completedAll.add(m.id);
            }
            collected = buildResults(completedAll);
            set({ results: collected });
          } else {
            for (let i = 0; i < textFiles.length; i++) {
              const file = textFiles[i];
              const isLast = i === textFiles.length - 1;
              const doneInFile = new Set<string>();
              let exactTokens: number | null = null;

              await tokenizerClient.count(file.text ?? "", models, (ev) => {
                if (ev.type === "loading") {
                  // el worker no tiene acceso al idioma: traduce la CLAVE aquí
                  if (ev.kind === "hf") {
                    set((state) => ({
                      hf:
                        state.hf.phase === "running"
                          ? state.hf
                          : { ...state.hf, phase: "running" },
                    }));
                  }
                  set({
                    progress: {
                      phase: "load-tokenizer",
                      label: tSync(ev.labelKey, ev.vars),
                      percent: ev.percent ?? get().progress?.percent ?? 0,
                    },
                  });
                } else if (ev.type === "hf-failed") {
                  set((state) => ({
                    hf:
                      state.hf.failedRepo == null
                        ? { ...state.hf, failedRepo: ev.repo, phase: "failed" }
                        : state.hf,
                  }));
                } else if (ev.type === "model-done") {
                  doneInFile.add(ev.result.modelId);
                  const prev =
                    totals.get(ev.result.modelId) ??
                    { tokens: 0, ms: 0, precision: ev.result.precision };
                  totals.set(ev.result.modelId, {
                    tokens: prev.tokens + ev.result.tokens,
                    ms: prev.ms + ev.result.ms,
                    precision: ev.result.precision,
                  });
                  // conteo exacto de referencia (primer modelo o200k)
                  const cfg = getModel(ev.result.modelId);
                  if (exactTokens == null && cfg?.tokenizer === "tiktoken-o200k") {
                    exactTokens = ev.result.tokens;
                  }
                  // modelos con conteo exacto vía tokenizador HF local
                  if (cfg?.tokenizer === "hf" && ev.result.precision === "exact") {
                    set((state) => ({
                      hf: { ...state.hf, upgraded: state.hf.upgraded + 1 },
                    }));
                  }

                  if (isLast) {
                    completedAll.add(ev.result.modelId);
                    collected = buildResults(completedAll);
                    set({ results: [...collected] });
                  }

                  const fileProgress =
                    (i + doneInFile.size / models.length) / textFiles.length;
                  set({
                    progress: {
                      phase: "count",
                      label: tSync("store.progress.counting"),
                      percent: Math.round(fileProgress * 100),
                    },
                  });
                }
              });

              // guardar el conteo exacto del archivo en su entrada
              if (exactTokens != null) {
                set({
                  files: get().files.map((f) =>
                    f.id === file.id ? { ...f, exactTokens: exactTokens! } : f,
                  ),
                });
              }
            }
          }

          set({
            status: "done",
            progress: { phase: "done", label: tSync("store.progress.done"), percent: 100 },
          });

          // cerrar el chip HF (fase done) si hubo conteo exacto local
          set((state) =>
            state.hf.phase === "running"
              ? { hf: { ...state.hf, phase: "done" } }
              : state,
          );

          // Fase BYOK: pedir conteos oficiales (Anthropic/Google) si el
          // usuario lo ha activado. Los resultados se actualizan en directo
          // (🟡 → 🔵) y el historial se escribe después, con los números
          // finales.
          await upgradeWithOfficialCounts(text, runId);
          const finalResults = get().byokRun === runId ? get().results : collected;

          // Historial local (nunca sale del navegador)
          try {
            addHistoryEntry({
              kind,
              name: fileLabel(files),
              size: totalSize(files),
              stats,
              text,
              fileCount: files.length,
              imageCount: images.length,
              results: finalResults.map((r) => ({
                modelId: r.modelId,
                tokens: r.tokens,
                precision: r.precision,
                ...(r.textTokens != null ? { textTokens: r.textTokens } : {}),
                ...(r.imageTokens != null
                  ? { imageTokens: r.imageTokens }
                  : {}),
              })),
            });
          } catch {
            // El historial es opcional: si falla el almacenamiento, se ignora
          }
        } catch {
          set({
            status: "error",
            error: tSync("store.error.count"),
            progress: null,
          });
        }
      }

      return {
        status: "idle",
        error: null,
        warning: null,
        fileName: null,
        fileSize: null,
        kind: "file",
        text: "",
        files: [],
        stats: null,
        results: [],
        progress: null,
        codeHint: false,

        byok: { phase: "idle", upgraded: 0, failed: 0, error: null },
        byokRun: 0,

        hf: { phase: "idle", upgraded: 0, failedRepo: null },

        activeModels: DEFAULT_ACTIVE_MODELS,
        outputTokens: 1024,
        currency: "USD",
        hfEnabled: false,

        analyzeFiles: async (list, mode = "replace") => {
          const current = get();
          if (current.status === "extracting" || current.status === "counting") {
            return;
          }

          const existing = mode === "add" ? current.files : [];
          const rejections: string[] = [];
          const accepted: File[] = [];

          for (const file of list) {
            if (!isSupportedFile(file) && !isImageFile(file)) {
              const ext = file.name.includes(".")
                ? `.${file.name.split(".").pop()?.toLowerCase()}`
                : file.type || tSync("store.unknownType");
              rejections.push(tSync("store.rejected.format", { name: file.name, ext }));
              continue;
            }
            if (file.size > MAX_FILE_SIZE) {
              rejections.push(
                tSync("store.rejected.size", {
                  name: file.name,
                  size: formatBytes(file.size),
                }),
              );
              continue;
            }
            if (existing.length + accepted.length + 1 > MAX_FILES) {
              rejections.push(
                tSync("store.rejected.limit", { name: file.name, n: MAX_FILES }),
              );
              continue;
            }
            accepted.push(file);
          }

          if (accepted.length === 0) {
            set({
              status: "error",
              error:
                existing.length > 0
                  ? tSync("store.error.noneAdded", { list: rejections.join(" · ") })
                  : rejections.length > 0
                    ? tSync("store.error.rejected", { list: rejections.join(" · ") })
                    : tSync("store.error.noFiles"),
              progress: null,
            });
            return;
          }

          if (mode === "replace") revokePreviews(existing);

          set({
            status: "extracting",
            error: null,
            warning: null,
            results: [],
            fileName: null,
            fileSize: null,
            progress: {
              phase: "extract",
              label:
                accepted.length === 1
                  ? tSync("store.progress.extractingOne", { name: accepted[0].name })
                  : tSync("store.progress.extractingMany", { n: accepted.length }),
              percent: 0,
            },
          });

          const extracted: AnalyzedFile[] = [];
          const warnings: string[] = rejections.length > 0
            ? [tSync("store.warning.skipped", { list: rejections.join(" · ") })]
            : [];

          try {
            for (let i = 0; i < accepted.length; i++) {
              const file = accepted[i];
              const base = {
                id: newId(),
                name: file.name,
                sizeBytes: file.size,
              };

              if (isImageFile(file)) {
                try {
                  const imageInfo = await extractImageInfo(file);
                  extracted.push({
                    ...base,
                    kind: "image",
                    imageInfo,
                    previewUrl: URL.createObjectURL(file),
                  });
                } catch (err) {
                  warnings.push(
                    `${file.name} (${err instanceof Error ? err.message : tSync("store.error.imageRead")})`,
                  );
                }
              } else {
                const { text, warning } = await extractText(file, (percent) => {
                  set({
                    progress: {
                      phase: "extract",
                      label: tSync("store.progress.extractingStep", { name: file.name, i: i + 1, n: accepted.length }),
                      percent: Math.round(
                        ((i + percent / 100) / accepted.length) * 100,
                      ),
                    },
                  });
                });
                if (!text.trim()) {
                  warnings.push(
                    `${file.name} (${warning ?? tSync("store.error.noTextExtractable")})`,
                  );
                  continue;
                }
                extracted.push({
                  ...base,
                  kind: "text",
                  text,
                  ...(warning ? { warning } : {}),
                  code: isCodeFile(file.name),
                });
                if (warning) warnings.push(`${file.name} (${warning})`);
              }

              set({
                progress: {
                  phase: "extract",
                  label: tSync("store.progress.extractingStep", { name: file.name, i: i + 1, n: accepted.length }),
                  percent: Math.round(((i + 1) / accepted.length) * 100),
                },
              });
            }
          } catch (err) {
            set({
              status: "error",
              error:
                err instanceof Error
                  ? err.message
                  : tSync("store.error.unexpected"),
              progress: null,
            });
            return;
          }

          if (extracted.length === 0) {
            set({
              status: "error",
              error:
                warnings.length > 0
                  ? tSync("store.error.extractMixed", { list: warnings.join(" · ") })
                  : tSync("store.error.extractEmpty"),
              progress: null,
            });
            return;
          }

          const allFiles = mode === "add" ? [...existing, ...extracted] : extracted;
          await runCounting(
            allFiles,
            "file",
            warnings.length > 0 ? warnings.join(" · ") : undefined,
          );
        },

        analyzeFile: async (file) => {
          await get().analyzeFiles([file], "replace");
        },

        analyzeText: async (text, name) => {
          const label = name ?? tSync("store.pastedName");
          if (!text.trim()) {
            set({
              status: "error",
              error: tSync("store.error.emptyText"),
              progress: null,
            });
            return;
          }
          const previous = get().files;
          if (previous.length > 0) revokePreviews(previous);
          set({
            status: "extracting",
            error: null,
            warning: null,
            files: [],
            progress: {
              phase: "extract",
              label: tSync("store.progress.preparing"),
              percent: 100,
            },
          });
          const file: AnalyzedFile = {
            id: newId(),
            name: label,
            sizeBytes: new Blob([text]).size,
            kind: "text",
            text,
            code: false,
          };
          await runCounting([file], "text");
        },

        removeFile: async (id) => {
          const current = get();
          if (current.status === "extracting" || current.status === "counting") {
            return;
          }
          const target = current.files.find((f) => f.id === id);
          if (!target) return;
          if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
          const remaining = current.files.filter((f) => f.id !== id);
          if (remaining.length === 0) {
            get().reset();
            return;
          }
          await runCounting(remaining, current.kind, undefined);
        },

        reset: () => {
          revokePreviews(get().files);
          set({
            status: "idle",
            error: null,
            warning: null,
            fileName: null,
            fileSize: null,
            text: "",
            files: [],
            stats: null,
            results: [],
            progress: null,
            byok: { phase: "idle", upgraded: 0, failed: 0, error: null },
            byokRun: get().byokRun + 1,
            hf: { phase: "idle", upgraded: 0, failedRepo: null },
          });
        },

        toggleModel: (id) => {
          const current = get().activeModels;
          set({
            activeModels: current.includes(id)
              ? current.filter((m) => m !== id)
              : [...current, id],
          });
        },

        setActiveModels: (ids) => set({ activeModels: ids }),

        setOutputTokens: (n) => set({ outputTokens: n }),

        setCurrency: (c) => set({ currency: c }),

        setHfEnabled: (enabled) => set({ hfEnabled: enabled }),
      };
    },
    {
      name: "tokenlens-settings",
      version: 3,
      partialize: (state) => ({
        activeModels: state.activeModels,
        outputTokens: state.outputTokens,
        currency: state.currency,
        hfEnabled: state.hfEnabled,
      }),
      /**
       * Migración: v3 = catálogo de oct-2026 ampliado con la lista completa
       * del usuario (112 modelos: GPT-6, Muse, Ministral 3, Qwen 3.5–3.8…).
       * Muchos ids cambiaron de nombre (p. ej. gpt-5.5 → gpt-5.5-thinking,
       * deepseek-flash → deepseek-v4-flash), así que las selecciones de
       * catálogos anteriores se descartan y se restauran los flagships por
       * defecto. Para versiones posteriores se filtran ids desconocidos por
       * seguridad y, si no queda ninguno, también se restauran.
       */
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as {
          activeModels?: string[];
          outputTokens?: number;
          currency?: CurrencyCode;
        };
        if (version < 3) {
          p.activeModels = DEFAULT_ACTIVE_MODELS;
          return p;
        }
        const known = new Set(MODELS.map((m) => m.id));
        const kept = (p.activeModels ?? []).filter((id) => known.has(id));
        p.activeModels = kept.length > 0 ? kept : DEFAULT_ACTIVE_MODELS;
        return p;
      },
    },
  ),
);

/** Filtra resultados a los modelos activos (ids desconocidos se ignoran) */
export function selectActiveResults(
  results: ModelResult[],
  activeModels: string[],
): ModelResult[] {
  if (activeModels.length === 0) return [];
  return results.filter((r) => activeModels.includes(r.modelId));
}
