/**
 * Optimizador de texto: detecta oportunidades de reducir tokens sin cambiar
 * el significado (espacios finales, líneas en blanco repetidas, JSON sin
 * minificar, comentarios en código, espacios dobles en prosa).
 *
 * Cada sugerencia calcula sus caracteres ahorrados sobre el texto ORIGINAL
 * (medida independiente; al combinar varias, el ahorro real puede ser algo
 * menor). El ahorro en tokens se estima con el estimador por ratio (🟡) y se
 * recalcula exacto al volver a analizar el texto optimizado.
 */

import { estimateTokens } from "@/lib/tokenizers/estimate";

export type SuggestionId =
  | "trim-trailing"
  | "collapse-blank-lines"
  | "collapse-spaces"
  | "strip-comments"
  | "minify-json";

export interface OptimizationSuggestion {
  id: SuggestionId;
  title: string;
  description: string;
  /** safe = sin riesgo semántico; review = revisar el resultado */
  risk: "safe" | "review";
  /** caracteres que ahorraría aplicarla al texto original */
  charsSaved: number;
  /** % del texto que representa el ahorro */
  percent: number;
  /** se puede aplicar (aplica precondición y ahorra algo) */
  applicable: boolean;
}

export interface OptimizerReport {
  suggestions: OptimizationSuggestion[];
  /** caracteres del texto original */
  chars: number;
  /** tokens estimados del texto original */
  estimatedTokens: number;
}

interface SuggestionDef {
  id: SuggestionId;
  title: string;
  description: string;
  risk: "safe" | "review";
  condition: (isCode: boolean, text: string) => boolean;
  apply: (text: string) => string;
}

const trimTrailing = (t: string) =>
  t.replace(/[ \t]+(?=\r?\n)/g, "").replace(/[ \t]+$/, "");

const collapseBlankLines = (t: string) => t.replace(/(?:\r?\n){3,}/g, "\n\n");

const collapseSpaces = (t: string) => t.replace(/[^\S\r\n]{2,}/g, " ");

const stripComments = (t: string) =>
  t
    // comentarios de bloque /* … */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // comentarios de línea completos (// o #) — no toca URLs ni # inline
    .replace(/^[ \t]*(?:\/\/|#)(?:.*)$/gm, "")
    // limpia líneas que quedaron solo con el comentario borrado
    .replace(/^[ \t]+\r?\n/gm, "\n");

const DEFS: SuggestionDef[] = [
  {
    id: "minify-json",
    title: "Minificar JSON",
    description:
      "El texto es JSON válido: se compacta sin espacios ni sangría. Mismo dato, menos tokens.",
    risk: "safe",
    condition: (_isCode, text) => {
      const t = text.trim();
      if (
        !(
          (t.startsWith("{") && t.endsWith("}")) ||
          (t.startsWith("[") && t.endsWith("]"))
        )
      ) {
        return false;
      }
      try {
        JSON.parse(t);
        return true;
      } catch {
        return false;
      }
    },
    apply: (text) => JSON.stringify(JSON.parse(text.trim())),
  },
  {
    id: "strip-comments",
    title: "Quitar comentarios",
    description:
      "Elimina comentarios de bloque (/* … */) y de línea completos (// o #). Revisa el resultado: en algunos formatos un # inicial es contenido.",
    risk: "review",
    condition: (isCode) => isCode,
    apply: stripComments,
  },
  {
    id: "collapse-blank-lines",
    title: "Colapsar líneas en blanco",
    description:
      "Tres o más saltos de línea seguidos se reducen a una línea en blanco.",
    risk: "safe",
    condition: () => true,
    apply: collapseBlankLines,
  },
  {
    id: "trim-trailing",
    title: "Quitar espacios finales",
    description:
      "Espacios y tabulaciones al final de cada línea (y del archivo). No afecta a la sangría inicial.",
    risk: "safe",
    condition: () => true,
    apply: trimTrailing,
  },
  {
    id: "collapse-spaces",
    title: "Colapsar espacios repetidos",
    description:
      "Dos o más espacios seguidos dentro de una línea se reducen a uno. No se aplica a código (alineación) y puede afectar a tablas alineadas.",
    risk: "review",
    condition: (isCode) => !isCode,
    apply: collapseSpaces,
  },
];

/** Ratio de referencia para el ahorro estimado en tokens (🟡 aproximado) */
const REFERENCE_RATIO = 4;

export function buildSuggestions(
  text: string,
  isCode: boolean,
): OptimizerReport {
  const chars = text.length;
  const estimatedTokens = estimateTokens(text, REFERENCE_RATIO).tokens;
  const suggestions: OptimizationSuggestion[] = DEFS.map((def) => {
    const applicable = def.condition(isCode, text);
    const charsSaved = applicable
      ? Math.max(0, text.length - def.apply(text).length)
      : 0;
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      risk: def.risk,
      charsSaved,
      percent: chars > 0 ? (charsSaved / chars) * 100 : 0,
      applicable: applicable && charsSaved > 0,
    };
  });
  return { suggestions, chars, estimatedTokens };
}

/** Aplica las sugerencias seleccionadas (ids desconocidos se ignoran). */
export function applySuggestions(
  text: string,
  ids: SuggestionId[],
  isCode: boolean,
): string {
  let result = text;
  // Orden: primero el minificado de JSON (los demás no aplican después)
  const order: SuggestionId[] = [
    "minify-json",
    "strip-comments",
    "collapse-blank-lines",
    "trim-trailing",
    "collapse-spaces",
  ];
  for (const id of order) {
    if (!ids.includes(id)) continue;
    const def = DEFS.find((d) => d.id === id);
    if (!def || !def.condition(isCode, result)) continue;
    result = def.apply(result);
  }
  return result;
}

/** Estimación de tokens ahorrados (aproximada, insignia 🟡). */
export function estimateSavings(before: string, after: string): {
  tokensBefore: number;
  tokensAfter: number;
  tokensSaved: number;
  percent: number;
} {
  const tokensBefore = estimateTokens(before, REFERENCE_RATIO).tokens;
  const tokensAfter = estimateTokens(after, REFERENCE_RATIO).tokens;
  const tokensSaved = Math.max(0, tokensBefore - tokensAfter);
  return {
    tokensBefore,
    tokensAfter,
    tokensSaved,
    percent: tokensBefore > 0 ? (tokensSaved / tokensBefore) * 100 : 0,
  };
}
