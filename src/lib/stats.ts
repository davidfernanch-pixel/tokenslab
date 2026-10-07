import type { FileStats } from "@/lib/types";

const CJK_RE = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;

/**
 * Estadísticas básicas del texto.
 * Páginas ≈ palabras ÷ 500 (página estándar de texto).
 */
export function getFileStats(text: string): FileStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = text.length ? text.split("\n").length : 0;
  const pages = words > 0 ? Math.max(1, Math.ceil(words / 500)) : 0;
  const cjkMatches = text.match(CJK_RE);
  return {
    chars: text.length,
    words,
    lines,
    pages,
    cjk: !!cjkMatches && cjkMatches.length > text.length * 0.02,
  };
}
