/**
 * Segmentación de texto en tokens con posiciones exactas de caracteres.
 *
 * Se usa para el visualizador de tokens y para el divisor de fragmentos.
 * Se ejecuta dentro del Web Worker (y como fallback en el hilo principal),
 * igual que count.ts.
 *
 * Estrategia: `encode(text)` → ids; cada id se decodifica individualmente
 * (con caché por id único) y se recorre el texto original con un cursor.
 * Si un carácter multi-byte quedó partido entre dos tokens, se fusionan los
 * tokens necesarios hasta realinear el cursor.
 */

export interface TokenSegment {
  /** id del primer token BPE del segmente (los fusionados comparten el primero) */
  id: number;
  /** texto exacto del segmento (tal cual aparece en el original) */
  text: string;
  /** nº de tokens BPE que representa (1 salvo fusiones multi-byte) */
  tokens: number;
  /** offset de carácter de inicio (incluyente) */
  start: number;
  /** offset de carácter de fin (excluyente) */
  end: number;
}

export interface SegmentsResult {
  segments: TokenSegment[];
  /** tokens totales del texto completo (aunque se trunque la vista) */
  totalTokens: number;
  /** true si `segments` cubre solo parte del texto */
  truncated: boolean;
  /** ms que tardó la segmentación */
  ms: number;
}

let encoder: {
  encode: (text: string) => number[];
  decode: (ids: number[]) => string;
} | null = null;

async function loadEncoder() {
  if (!encoder) {
    const mod = await import("gpt-tokenizer/encoding/o200k_base");
    encoder = {
      encode: (text: string) => mod.encode(text),
      decode: (ids: number[]) => mod.decode(ids),
    };
  }
  return encoder;
}

/** Nº de tokens entre avisos de progreso */
const PROGRESS_EVERY = 2_000;

export async function buildTokenSegments(
  text: string,
  opts?: {
    /** límite de tokens segmentados (el resto se ignora, totalTokens sigue siendo el real) */
    maxTokens?: number;
    onProgress?: (percent: number) => void;
  },
): Promise<SegmentsResult> {
  const t0 = performance.now();
  const enc = await loadEncoder();
  const ids = enc.encode(text);
  const totalTokens = ids.length;

  const limit =
    opts?.maxTokens != null && opts.maxTokens > 0 && opts.maxTokens < ids.length
      ? opts.maxTokens
      : ids.length;
  const truncated = limit < ids.length;

  // caché de decodificación por id único (los textos repiten mucho vocabulario)
  const cache = new Map<number, string>();
  const pieceOf = (id: number): string => {
    let p = cache.get(id);
    if (p === undefined) {
      p = enc.decode([id]);
      cache.set(id, p);
    }
    return p;
  };

  const segments: TokenSegment[] = [];
  let cursor = 0;
  let i = 0;
  let sinceProgress = 0;

  while (i < limit) {
    const id = ids[i];
    const piece = pieceOf(id);

    if (text.startsWith(piece, cursor)) {
      segments.push({
        id,
        text: piece,
        tokens: 1,
        start: cursor,
        end: cursor + piece.length,
      });
      cursor += piece.length;
      i++;
    } else {
      // Carácter multi-byte partido entre tokens: fusiona hasta realinear.
      let acc = piece;
      let j = i + 1;
      while (
        !text.startsWith(acc, cursor) &&
        j < limit &&
        j - i <= 8
      ) {
        acc += pieceOf(ids[j]);
        j++;
      }
      if (text.startsWith(acc, cursor)) {
        segments.push({
          id,
          text: acc,
          tokens: j - i,
          start: cursor,
          end: cursor + acc.length,
        });
        cursor += acc.length;
        i = j;
      } else {
        // No se pudo realinear (no debería ocurrir): descarta el token.
        i++;
      }
    }

    if (++sinceProgress >= PROGRESS_EVERY) {
      sinceProgress = 0;
      opts?.onProgress?.(Math.round((i / limit) * 100));
    }
  }

  opts?.onProgress?.(100);
  return {
    segments,
    totalTokens,
    truncated,
    ms: performance.now() - t0,
  };
}
