/**
 * TokenLens — Configuración central de modelos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ PRECIOS: están a `null` (TODO) a propósito. Rellénalos desde las páginas
 * oficiales de pricing de cada proveedor antes de usarlos en producción.
 * NO inventar datos de precio. Campos: `priceInPerM` / `priceOutPerM` (USD por
 * 1M de tokens).
 *
 * ⚠️ VENTANAS DE CONTEXTO: tomadas de la documentación pública de cada
 * proveedor en el momento de creación. Verifícalas al actualizar (cambian con
 * frecuencia). Ajústalas aquí sin tocar nada más del código.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "meta"
  | "mistral"
  | "deepseek"
  | "xai"
  | "qwen";

export type TokenizerKind =
  | "tiktoken-o200k"
  | "tiktoken-cl100k"
  | "hf" // tokenizador abierto vía transformers.js (fase 2+)
  | "api-anthropic" // endpoint count_tokens (fase 3, BYOK)
  | "api-gemini" // endpoint countTokens (fase 3, BYOK)
  | "estimate";

export type Precision = "exact" | "official" | "estimated";

export interface ModelConfig {
  /** id interno, p. ej. "gpt-4o" */
  id: string;
  /** nombre visible, p. ej. "GPT-4o" */
  name: string;
  provider: Provider;
  tokenizer: TokenizerKind;
  precision: Precision;
  /** ventana de contexto en tokens */
  contextWindow: number;
  /** TODO: USD por 1M de tokens de entrada (fuentes oficiales) */
  priceInPerM: number | null;
  /** TODO: USD por 1M de tokens de salida (fuentes oficiales) */
  priceOutPerM: number | null;
  /** caracteres por token aprox. para el modo estimado (texto en inglés) */
  estimateRatio?: number;
  /** el modelo admite imágenes (tokens de imagen estimados por fórmula) */
  vision?: boolean;
  enabledByDefault: boolean;
}

export interface ProviderInfo {
  label: string;
  color: string;
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  openai: { label: "OpenAI", color: "#10a37f" },
  anthropic: { label: "Anthropic", color: "#d97757" },
  google: { label: "Google", color: "#4285f4" },
  meta: { label: "Meta", color: "#0866ff" },
  mistral: { label: "Mistral", color: "#fa520f" },
  deepseek: { label: "DeepSeek", color: "#4d6bfe" },
  xai: { label: "xAI", color: "#9ca3af" },
  qwen: { label: "Qwen", color: "#615ced" },
};

export const PROVIDER_ORDER: Provider[] = [
  "openai",
  "anthropic",
  "google",
  "meta",
  "mistral",
  "deepseek",
  "xai",
  "qwen",
];

/**
 * Ratios de estimación aproximados (caracteres por token, texto en inglés).
 * El estimador (lib/tokenizers/estimate.ts) los ajusta por idioma y contenido.
 * Son aproximaciones documentadas, nunca conteos oficiales → insignia 🟡.
 */
export const MODELS: ModelConfig[] = [
  // ── OpenAI (exacto en local con gpt-tokenizer) ───────────────────────────
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.1,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_047_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "o3",
    name: "o3",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 200_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: false,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    tokenizer: "tiktoken-cl100k",
    precision: "exact",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    vision: true,
    enabledByDefault: false,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    tokenizer: "tiktoken-cl100k",
    precision: "exact",
    contextWindow: 16_385,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    enabledByDefault: false,
  },

  // ── Anthropic (estimado en V1; count_tokens por API en fase 3) ───────────
  {
    id: "claude-opus-4-1",
    name: "Claude Opus 4.1",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 200_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    enabledByDefault: false,
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 200_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 200_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    enabledByDefault: true,
  },

  // ── Google (estimado en V1; countTokens por API en fase 3) ───────────────
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: true,
  },

  // ── Meta (tokenizador abierto vía transformers.js en fase 2) ─────────────
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "llama-4-scout",
    name: "Llama 4 Scout",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 10_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    vision: true,
    enabledByDefault: false,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    enabledByDefault: false,
  },

  // ── Mistral ───────────────────────────────────────────────────────────────
  {
    id: "mistral-large-2",
    name: "Mistral Large 2",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    enabledByDefault: true,
  },
  {
    id: "codestral",
    name: "Codestral",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 256_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    enabledByDefault: false,
  },

  // ── DeepSeek ──────────────────────────────────────────────────────────────
  {
    id: "deepseek-chat",
    name: "DeepSeek-V3.1 (chat)",
    provider: "deepseek",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    enabledByDefault: true,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek-R1 (reasoner)",
    provider: "deepseek",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    enabledByDefault: false,
  },

  // ── xAI ───────────────────────────────────────────────────────────────────
  {
    id: "grok-4",
    name: "Grok 4",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 256_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    enabledByDefault: true,
  },
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    enabledByDefault: false,
  },

  // ── Qwen ──────────────────────────────────────────────────────────────────
  {
    id: "qwen3-235b",
    name: "Qwen3 235B",
    provider: "qwen",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    enabledByDefault: false,
  },
  {
    id: "qwen2.5-72b",
    name: "Qwen2.5 72B",
    provider: "qwen",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    enabledByDefault: false,
  },
];

/** Modelos activados por defecto */
export const DEFAULT_ACTIVE_MODELS = MODELS.filter(
  (m) => m.enabledByDefault,
).map((m) => m.id);

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Monedas admitidas. `rate` = unidades de la moneda por 1 USD.
 *  TODO: rellena el tipo de cambio del euro (o el que uses) con un valor
 *  actualizado; hasta entonces los costes en EUR se muestran como pendientes. */
export const CURRENCIES = {
  USD: { symbol: "$", rate: 1 as number | null },
  EUR: { symbol: "€", rate: null },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
