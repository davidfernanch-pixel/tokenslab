import type { Precision } from "@/lib/models.config";

export type { Precision };

/** Estado del análisis */
export type Status = "idle" | "extracting" | "counting" | "done" | "error";

export interface Progress {
  phase: "extract" | "load-tokenizer" | "count" | "done";
  label: string;
  percent: number;
}

/** Resultado de contar tokens para un modelo */
export interface ModelResult {
  modelId: string;
  tokens: number;
  precision: Precision;
  /** ms que tardó el conteo */
  ms: number;
}

/** Estadísticas del texto analizado */
export interface FileStats {
  chars: number;
  words: number;
  lines: number;
  pages: number;
  /** contiene CJK (chino/japonés/coreano) */
  cjk: boolean;
}

export interface FitInfo {
  fits: boolean;
  /** % de la ventana usada (puede superar 100) */
  percent: number;
  /** tokens que exceden la ventana (0 si cabe) */
  overflow: number;
  /** tokens restantes de la ventana (0 si no cabe) */
  remaining: number;
}

export interface ExtractResult {
  text: string;
  /** avisos no bloqueantes (p. ej. PDF escaneado) */
  warning?: string;
}

export interface AnalysisMeta {
  fileName: string;
  fileSize: number;
  kind: "file" | "text";
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const PRECISION_META: Record<
  Precision,
  { label: string; short: string; description: string; dotClass: string }
> = {
  exact: {
    label: "Exacto",
    short: "Exacto",
    description:
      "Tokenizador real del proveedor ejecutado en tu navegador (BPE oficial).",
    dotClass: "bg-success",
  },
  official: {
    label: "Oficial (API)",
    short: "Oficial",
    description:
      "Conteo oficial del proveedor vía API con tu propia key (modo BYOK, próximamente).",
    dotClass: "bg-google",
  },
  estimated: {
    label: "Estimado",
    short: "Estimado",
    description:
      "Aproximación por ratio: caracteres ÷ ratio del modelo, ajustada por idioma y contenido.",
    dotClass: "bg-warning",
  },
};
