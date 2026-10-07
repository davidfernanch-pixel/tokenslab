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
  /** tokens del texto (sin imágenes); presente cuando el análisis incluye imágenes */
  textTokens?: number;
  /** tokens de imagen estimados por fórmula; presente en modelos con visión si hay imágenes */
  imageTokens?: number;
}

/** Metadatos de una imagen analizada en local */
export interface ImageInfo {
  width: number;
  height: number;
  mime: string;
}

/** Un archivo del análisis en curso (texto extraído o imagen) */
export interface AnalyzedFile {
  id: string;
  name: string;
  sizeBytes: number;
  kind: "text" | "image";
  /** texto extraído (archivos de texto) */
  text?: string;
  /** información de imagen (archivos de imagen) */
  imageInfo?: ImageInfo;
  /** URL de previsualización en memoria (solo imágenes; no se persiste) */
  previewUrl?: string;
  /** conteo exacto o200k del texto (referencia para la lista de archivos) */
  exactTokens?: number;
  /** el archivo parece código (pista para el estimador y el optimizador) */
  code?: boolean;
  /** aviso de extracción no bloqueante */
  warning?: string;
}

/** Máximo de archivos por análisis */
export const MAX_FILES = 10;

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
      "Conteo oficial devuelto por el endpoint del proveedor con tu propia key (modo BYOK).",
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
