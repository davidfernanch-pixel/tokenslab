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

  // ajustes (persistidos)
  activeModels: string[];
  outputTokens: number;
  currency: CurrencyCode;

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
}

function toCountModels(codeHint?: boolean) {
  return MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    tokenizer: m.tokenizer,
    estimateRatio: m.estimateRatio ?? 4,
    codeHint,
  }));
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileLabel(files: AnalyzedFile[]): string {
  return files.length === 1 ? files[0].name : `${files.length} archivos`;
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
          progress: { phase: "count", label: "Contando tokens…", percent: 0 },
        });

        const models = toCountModels(codeHint);
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
                  set({
                    progress: {
                      phase: "load-tokenizer",
                      label: ev.label,
                      percent: get().progress?.percent ?? 0,
                    },
                  });
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
                      label: "Contando tokens…",
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
            progress: { phase: "done", label: "Análisis completado", percent: 100 },
          });

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
              results: collected.map((r) => ({
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
            error:
              "No se pudieron contar los tokens. Inténtalo de nuevo con un archivo más pequeño.",
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

        activeModels: DEFAULT_ACTIVE_MODELS,
        outputTokens: 1024,
        currency: "USD",

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
                : file.type || "desconocido";
              rejections.push(
                `${file.name} (formato no admitido: ${ext})`,
              );
              continue;
            }
            if (file.size > MAX_FILE_SIZE) {
              rejections.push(
                `${file.name} (pesa ${formatBytes(file.size)}, límite 20 MB)`,
              );
              continue;
            }
            if (existing.length + accepted.length + 1 > MAX_FILES) {
              rejections.push(
                `${file.name} (límite de ${MAX_FILES} archivos por análisis)`,
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
                  ? `No se añadió ningún archivo. Se omitieron: ${rejections.join(" · ")}.`
                  : rejections.length > 0
                    ? `No se pudo analizar. Se omitieron: ${rejections.join(" · ")}.`
                    : "No se recibió ningún archivo.",
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
              label: `Extrayendo ${accepted.length === 1 ? `“${accepted[0].name}”` : `${accepted.length} archivos`}…`,
              percent: 0,
            },
          });

          const extracted: AnalyzedFile[] = [];
          const warnings: string[] = rejections.length > 0
            ? [`Archivos omitidos: ${rejections.join(" · ")}.`]
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
                    `${file.name} (${err instanceof Error ? err.message : "no se pudo leer la imagen"})`,
                  );
                }
              } else {
                const { text, warning } = await extractText(file, (percent) => {
                  set({
                    progress: {
                      phase: "extract",
                      label: `Extrayendo “${file.name}” (${i + 1}/${accepted.length})…`,
                      percent: Math.round(
                        ((i + percent / 100) / accepted.length) * 100,
                      ),
                    },
                  });
                });
                if (!text.trim()) {
                  warnings.push(
                    `${file.name} (${warning ?? "sin texto extraíble"})`,
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
                  label: `Extrayendo “${file.name}” (${i + 1}/${accepted.length})…`,
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
                  : "Error inesperado al leer los archivos.",
              progress: null,
            });
            return;
          }

          if (extracted.length === 0) {
            set({
              status: "error",
              error:
                warnings.length > 0
                  ? `No se pudo extraer contenido de ningún archivo. ${warnings.join(" · ")}`
                  : "No se pudo extraer texto de los archivos (pueden estar vacíos o dañados).",
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

        analyzeText: async (text, name = "texto pegado") => {
          if (!text.trim()) {
            set({
              status: "error",
              error: "El texto está vacío: escribe o pega algo de contenido.",
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
              label: "Preparando texto…",
              percent: 100,
            },
          });
          const file: AnalyzedFile = {
            id: newId(),
            name,
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
      };
    },
    {
      name: "tokenlens-settings",
      version: 2,
      partialize: (state) => ({
        activeModels: state.activeModels,
        outputTokens: state.outputTokens,
        currency: state.currency,
      }),
      /**
       * Migración: el catálogo se renovó por completo en oct-2026 (GPT-5.5,
       * Claude 5.x, Gemini 3.x, Grok 4.5…). Los ids del catálogo anterior se
       * descartan y se restauran los activos por defecto (los nuevos
       * flagships). Para versiones posteriores se filtran ids desconocidos
       * por seguridad y, si no queda ninguno, también se restauran.
       */
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as {
          activeModels?: string[];
          outputTokens?: number;
          currency?: CurrencyCode;
        };
        if (version < 2) {
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
