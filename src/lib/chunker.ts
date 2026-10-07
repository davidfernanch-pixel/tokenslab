/**
 * Divisor de texto en fragmentos (chunks) por número exacto de tokens,
 * con solapamiento (overlap) entre fragmentos consecutivos.
 *
 * Empaqueta los TokenSegment del tokenizador o200k_base (exacto) en bloques
 * de como máximo `chunkTokens` tokens. El overlap re-incluye los últimos
 * tokens del fragmento anterior al inicio del siguiente para no perder
 * contexto en la frontera.
 */

import type { TokenSegment } from "@/lib/tokenizers/segments";

export interface TextChunk {
  /** índice secuencial desde 0 */
  index: number;
  /** texto del fragmento */
  text: string;
  /** tokens exactos (o200k) del fragmento */
  tokens: number;
  /** offset de carácter de inicio en el texto original */
  start: number;
  /** offset de carácter de fin en el texto original */
  end: number;
}

export interface ChunkOptions {
  /** tokens máximos por fragmento (≥ 16) */
  chunkTokens: number;
  /** tokens de solapamiento entre fragmentos (0 ≤ overlap < chunkTokens) */
  overlapTokens: number;
}

export function normalizeChunkOptions(opts: ChunkOptions): ChunkOptions {
  const chunkTokens = Math.max(16, Math.round(opts.chunkTokens));
  const overlapTokens = Math.min(
    Math.max(0, Math.round(opts.overlapTokens)),
    Math.floor(chunkTokens / 2),
  );
  return { chunkTokens, overlapTokens };
}

/** Empaqueta segmentos en fragmentos. Puro y sincrónico (corre en el worker). */
export function packSegments(
  segments: TokenSegment[],
  rawOpts: ChunkOptions,
): TextChunk[] {
  const { chunkTokens, overlapTokens } = normalizeChunkOptions(rawOpts);
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < segments.length) {
    // 1) Extiende el fragmento hasta llenar chunkTokens
    let tokens = 0;
    let end = start;
    while (end < segments.length && tokens + segments[end].tokens <= chunkTokens) {
      tokens += segments[end].tokens;
      end++;
    }
    if (end === start) {
      // Un único segmento más grande que el límite: entra entero.
      tokens = segments[start].tokens;
      end = start + 1;
    }

    // 2) Extrae el texto del fragmento
    let text = "";
    for (let k = start; k < end; k++) text += segments[k].text;
    chunks.push({
      index: index++,
      text,
      tokens,
      start: segments[start].start,
      end: segments[end - 1].end,
    });

    if (end >= segments.length) break;

    // 3) Calcula el inicio del siguiente con solapamiento
    let nextStart = end;
    let overlap = 0;
    while (
      nextStart - 1 > start &&
      overlap + segments[nextStart - 1].tokens <= overlapTokens
    ) {
      nextStart--;
      overlap += segments[nextStart].tokens;
    }
    start = Math.max(nextStart, start + 1);
  }

  return chunks;
}

/** Estadísticas de un conjunto de fragmentos */
export function chunkStats(chunks: TextChunk[]): {
  count: number;
  minTokens: number;
  maxTokens: number;
  avgTokens: number;
} {
  if (chunks.length === 0) {
    return { count: 0, minTokens: 0, maxTokens: 0, avgTokens: 0 };
  }
  let min = Infinity;
  let max = 0;
  let sum = 0;
  for (const c of chunks) {
    min = Math.min(min, c.tokens);
    max = Math.max(max, c.tokens);
    sum += c.tokens;
  }
  return {
    count: chunks.length,
    minTokens: min,
    maxTokens: max,
    avgTokens: Math.round(sum / chunks.length),
  };
}

/** Nombre base seguro para archivos de descarga */
export function chunkFileBase(fileName: string | null): string {
  const base = (fileName ?? "texto")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "texto";
}
