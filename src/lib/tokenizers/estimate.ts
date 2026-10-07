/**
 * Estimación de tokens por ratio (insignia 🟡 Estimado).
 *
 * Fórmula: tokens ≈ 0,65 · (caracteres ÷ ratio_efectivo) + 0,35 · (palabras ·
 * tokens_por_palabra), donde ratio_efectivo = ratio_base × factor_idioma ×
 * factor_contenido. Textos CJK se calculan por segmentos (≈ 1,2 car/token).
 *
 * Todo es heurístico y transparente: el objetivo es una aproximación razonable
 * cuando no hay tokenizador local disponible, nunca un conteo oficial.
 */

export interface EstimateBreakdown {
  tokens: number;
  /** ratio final aplicado (caracteres ÷ tokens) */
  effectiveRatio: number;
  contentKind: "prose" | "code" | "json";
  language: "es" | "en" | "other";
  cjk: boolean;
}

const CJK_RE = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
const CYRILLIC_RE = /[\u0400-\u04ff]/;
const GREEK_RE = /[\u0370-\u03ff]/;
const ARABIC_RE = /[\u0600-\u06ff]/;
const HEBREW_RE = /[\u0590-\u05ff]/;

const SPANISH_MARKS_RE = /[áéíóúüñÁÉÍÓÚÜÑ¿¡]/g;
const SPANISH_WORDS = new Set([
  "de", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un",
  "para", "con", "no", "una", "su", "al", "es", "lo", "como", "más", "pero",
  "sus", "le", "ya", "o", "este", "sí", "porque", "esta", "entre", "cuando",
  "muy", "sin", "sobre", "también", "me", "hasta", "hay", "dónde", "quien",
]);

const CODE_HINT_RE =
  /(\bfunction\b|\bconst\b|\blet\b|\bvar\b|\bclass\b|\bimport\b|\bdef\b|\breturn\b|=>|\{\s*\n|;\s*\n|<\/?[a-z]+>)/;

function detectContent(text: string, isCodeHint: boolean): "prose" | "code" | "json" {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* no es JSON válido → seguir */
    }
  }
  if (isCodeHint) return "code";
  const sample = trimmed.slice(0, 5000);
  const codeMatches = sample.match(CODE_HINT_RE);
  if (codeMatches && codeMatches.length >= 2) return "code";
  return "prose";
}

function detectLanguage(text: string): "es" | "en" | "other" {
  const sample = text.slice(0, 20000);
  const marks = sample.match(SPANISH_MARKS_RE);
  if (marks && marks.length > sample.length * 0.004) return "es";
  const words = sample.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean).slice(0, 400);
  if (words.length > 20) {
    let spanish = 0;
    for (const w of words) if (SPANISH_WORDS.has(w)) spanish++;
    if (spanish / words.length > 0.18) return "es";
  }
  return "en";
}

/** Factor sobre el ratio base según idioma (menor factor = más tokens) */
function languageFactor(text: string, language: "es" | "en" | "other"): number {
  if (CYRILLIC_RE.test(text)) return 0.7;
  if (GREEK_RE.test(text)) return 0.75;
  if (ARABIC_RE.test(text) || HEBREW_RE.test(text)) return 0.72;
  if (language === "es") return 0.95;
  return 1;
}

/** Tokens por palabra según contenido (aprox.) */
function tokensPerWord(content: "prose" | "code" | "json", language: "es" | "en" | "other"): number {
  if (content === "code") return 1.7;
  if (content === "json") return 1.1;
  return language === "es" ? 1.45 : 1.32;
}

export function estimateTokens(
  text: string,
  baseRatio: number,
  hint?: { isCode?: boolean },
): EstimateBreakdown {
  if (!text.length) {
    return { tokens: 0, effectiveRatio: baseRatio, contentKind: "prose", language: "en", cjk: false };
  }

  const language = detectLanguage(text);
  const content = detectContent(text, hint?.isCode ?? false);
  const cjkMatches = text.match(CJK_RE);
  const cjkChars = cjkMatches ? cjkMatches.length : 0;
  const isCjk = cjkChars > text.length * 0.05;

  if (isCjk) {
    // Por segmentos: CJK ≈ 1,2 car/token; el resto con el ratio del modelo
    const otherChars = text.length - cjkChars;
    const tokens = Math.ceil(cjkChars / 1.2 + otherChars / (baseRatio * languageFactor(text, language)));
    return { tokens, effectiveRatio: text.length / tokens, contentKind: content, language, cjk: true };
  }

  const factor =
    languageFactor(text, language) *
    (content === "code" ? 0.85 : content === "json" ? 0.8 : 1);
  const effectiveRatio = baseRatio * factor;
  const charTokens = text.length / effectiveRatio;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wordTokens = words * tokensPerWord(content, language);
  const tokens = Math.ceil(0.65 * charTokens + 0.35 * wordTokens);

  return { tokens, effectiveRatio, contentKind: content, language, cjk: false };
}
