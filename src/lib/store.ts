"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ACTIVE_MODELS,
  MODELS,
  type CurrencyCode,
} from "@/lib/models.config";
import {
  MAX_FILE_SIZE,
  type AnalysisMeta,
  type FileStats,
  type ModelResult,
  type Progress,
  type Status,
} from "@/lib/types";
import { extractText, isCodeFile } from "@/lib/extractors";
import { tokenizerClient } from "@/lib/tokenizers/client";
import { getFileStats } from "@/lib/stats";
import { formatBytes } from "@/lib/format";
import { addHistoryEntry } from "@/lib/history";

interface TokenLensState {
  // estado del análisis
  status: Status;
  error: string | null;
  warning: string | null;
  fileName: string | null;
  fileSize: number | null;
  kind: "file" | "text";
  text: string;
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
  analyzeFile: (file: File) => Promise<void>;
  analyzeText: (text: string, name?: string) => Promise<void>;
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

export const useTokenLens = create<TokenLensState>()(
  persist(
    (set, get) => {
      async function runCounting(
        text: string,
        meta: AnalysisMeta,
        warning?: string,
        codeHint?: boolean,
      ): Promise<void> {
        const stats = getFileStats(text);
        set({
          text,
          stats,
          warning: warning ?? null,
          kind: meta.kind,
          fileName: meta.fileName,
          fileSize: meta.fileSize,
          codeHint: codeHint ?? false,
          status: "counting",
          error: null,
          results: [],
          progress: { phase: "count", label: "Contando tokens…", percent: 0 },
        });

        const models = toCountModels(codeHint);
        const collected: ModelResult[] = [];
        try {
          await tokenizerClient.count(text, models, (ev) => {
            if (ev.type === "loading") {
              set({
                progress: {
                  phase: "load-tokenizer",
                  label: ev.label,
                  percent: get().progress?.percent ?? 0,
                },
              });
            } else if (ev.type === "model-done") {
              collected.push(ev.result);
              set({
                results: [...collected],
                progress: {
                  phase: "count",
                  label: "Contando tokens…",
                  percent: Math.round((collected.length / models.length) * 100),
                },
              });
            }
          });
          set({
            status: "done",
            progress: { phase: "done", label: "Análisis completado", percent: 100 },
          });
          // Historial local (nunca sale del navegador)
          try {
            addHistoryEntry({
              kind: meta.kind,
              name: meta.fileName,
              size: meta.fileSize,
              stats,
              text,
              results: collected.map((r) => ({
                modelId: r.modelId,
                tokens: r.tokens,
                precision: r.precision,
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
        stats: null,
        results: [],
        progress: null,
        codeHint: false,

        activeModels: DEFAULT_ACTIVE_MODELS,
        outputTokens: 1024,
        currency: "USD",

        analyzeFile: async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            set({
              status: "error",
              error: `El archivo pesa ${formatBytes(file.size)} y supera el límite de 20 MB. Divídelo en partes más pequeñas o pega solo el texto que necesites analizar.`,
              progress: null,
            });
            return;
          }
          set({
            status: "extracting",
            error: null,
            warning: null,
            results: [],
            text: "",
            stats: null,
            fileName: file.name,
            fileSize: file.size,
            kind: "file",
            progress: {
              phase: "extract",
              label: `Extrayendo “${file.name}”…`,
              percent: 0,
            },
          });
          try {
            const { text, warning } = await extractText(file, (percent) => {
              set({
                progress: {
                  phase: "extract",
                  label: `Extrayendo “${file.name}”…`,
                  percent: Math.round(percent),
                },
              });
            });
            if (!text.trim()) {
              set({
                status: "error",
                error:
                  warning ??
                  "No se pudo extraer texto del archivo (puede estar vacío o dañado).",
                progress: null,
              });
              return;
            }
            await runCounting(
              text,
              { fileName: file.name, fileSize: file.size, kind: "file" },
              warning,
              isCodeFile(file.name),
            );
          } catch (err) {
            set({
              status: "error",
              error:
                err instanceof Error
                  ? err.message
                  : "Error inesperado al leer el archivo.",
              progress: null,
            });
          }
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
          set({
            status: "extracting",
            error: null,
            warning: null,
            progress: {
              phase: "extract",
              label: "Preparando texto…",
              percent: 100,
            },
          });
          await runCounting(
            text,
            { fileName: name, fileSize: new Blob([text]).size, kind: "text" },
          );
        },

        reset: () =>
          set({
            status: "idle",
            error: null,
            warning: null,
            fileName: null,
            fileSize: null,
            text: "",
            stats: null,
            results: [],
            progress: null,
          }),

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
      partialize: (state) => ({
        activeModels: state.activeModels,
        outputTokens: state.outputTokens,
        currency: state.currency,
      }),
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
