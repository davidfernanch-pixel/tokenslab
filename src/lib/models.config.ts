/**
 * TokenLens — Configuración central de modelos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 📅 Catálogo actualizado a octubre de 2026 (verificado por búsqueda web contra
 * anuncios oficiales y documentación pública de cada proveedor).
 *
 * ⚠️ PRECIOS: solo se rellenan cuando existen en anuncios oficiales o páginas
 * de pricing corroboradas por varias fuentes (comentario `Fuente:` en cada
 * modelo). El resto sigue a `null` (TODO): rellénalos desde las páginas
 * oficiales antes de usarlos en producción. NO inventar datos de precio.
 * Campos: `priceInPerM` / `priceOutPerM` (USD por 1M de tokens).
 *
 * ⚠️ VENTANAS DE CONTEXTO: tomadas de la documentación pública de cada
 * proveedor en octubre de 2026. Verifícalas al actualizar (cambian con
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
  /** id interno, p. ej. "gpt-5.5" */
  id: string;
  /** nombre visible, p. ej. "GPT-5.5" */
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
  /** año de lanzamiento (se muestra como insignia "nuevo" en la UI) */
  releaseYear?: number;
  /**
   * Repo de Hugging Face con el tokenizer.json OFICIAL del modelo
   * (o su espejo ungated verificado). Solo con tokenizer: "hf".
   * El conteo exacto local se activa desde Ajustes (opt-in: descarga
   * de 6–28 MB por familia, cacheada en el navegador).
   */
  hfRepo?: string;
  enabledByDefault: boolean;
}

/**
 * Familias de tokenizadores abiertos de Hugging Face (verificadas en
 * oct-2026 vía HF API: repos públicos, vocab y ETags comprobados).
 *
 * - Llama 4: tokenizer NUEVO de vocab 202.048 (≠ Llama 3). Scout y Maverick
 *   comparten el MISMO tokenizer.json (ETag idéntico). Espejo ungated de
 *   unsloth (meta-llama exige login).
 * - Llama 3.3: vocab 128.256 (tokenizer de la serie Llama 3.1/3.3).
 * - Mistral Medium 3.5 / Large 3: repos oficiales abiertos (tekken, 131k).
 * - DeepSeek V4 Pro / V4.1 Flash: repos oficiales abiertos (vocab 129.280,
 *   BPE byte-level con pre-split de dígitos y CJK).
 * - Qwen 3.8: vocab 248.320 (nueva generación 3.5+). Los modelos -Max son
 *   API-only: se usa el hermano abierto de la misma generación (ETag
 *   idéntico entre Qwen3.8-2.4T-A95B y Qwen3.8-27B).
 * - Qwen 3.6 Plus / Qwen3 235B: idem, hermano abierto de su generación.
 *
 * Tamaño aproximado del tokenizer.json (medido oct-2026, solo informativo
 * para la UI de Ajustes; la descarga real es la del archivo en HF).
 */
export interface HfTokenizerInfo {
  /** repo completo, p. ej. "mistralai/Mistral-Medium-3.5-128B" */
  repo: string;
  /** etiqueta visible de la familia */
  label: string;
  /** color del proveedor */
  color: string;
  /** tamaño aproximado del tokenizer.json en MB */
  sizeMB: number;
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

export const HF_TOKENIZERS: Record<string, HfTokenizerInfo> = {
  "unsloth/Llama-4-Scout-17B-16E-Instruct": {
    repo: "unsloth/Llama-4-Scout-17B-16E-Instruct",
    label: "Llama 4 (Maverick + Scout)",
    color: PROVIDERS.meta.color,
    sizeMB: 28,
  },
  "unsloth/Llama-3.3-70B-Instruct": {
    repo: "unsloth/Llama-3.3-70B-Instruct",
    label: "Llama 3.3",
    color: PROVIDERS.meta.color,
    sizeMB: 17,
  },
  "mistralai/Mistral-Medium-3.5-128B": {
    repo: "mistralai/Mistral-Medium-3.5-128B",
    label: "Mistral Medium 3.5",
    color: PROVIDERS.mistral.color,
    sizeMB: 17,
  },
  "mistralai/Mistral-Large-3-675B-Instruct-2512": {
    repo: "mistralai/Mistral-Large-3-675B-Instruct-2512",
    label: "Mistral Large 3",
    color: PROVIDERS.mistral.color,
    sizeMB: 17,
  },
  "deepseek-ai/DeepSeek-V4-Pro": {
    repo: "deepseek-ai/DeepSeek-V4-Pro",
    label: "DeepSeek V4 Pro",
    color: PROVIDERS.deepseek.color,
    sizeMB: 6,
  },
  "deepseek-ai/DeepSeek-V4.1-Flash": {
    repo: "deepseek-ai/DeepSeek-V4.1-Flash",
    label: "DeepSeek V4.1 Flash",
    color: PROVIDERS.deepseek.color,
    sizeMB: 6,
  },
  "Qwen/Qwen3.8-2.4T-A95B": {
    repo: "Qwen/Qwen3.8-2.4T-A95B",
    label: "Qwen 3.8 (Max)",
    color: PROVIDERS.qwen.color,
    sizeMB: 13,
  },
  "Qwen/Qwen3.6-27B": {
    repo: "Qwen/Qwen3.6-27B",
    label: "Qwen 3.6 Plus",
    color: PROVIDERS.qwen.color,
    sizeMB: 13,
  },
  "Qwen/Qwen3-235B-A22B": {
    repo: "Qwen/Qwen3-235B-A22B",
    label: "Qwen3 235B",
    color: PROVIDERS.qwen.color,
    sizeMB: 11,
  },
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
  // ── OpenAI (exacto en local con gpt-tokenizer, o200k_base) ────────────────
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // Fuente: anuncio oficial de OpenAI "Introducing GPT-5.5" (23-abr-2026)
    priceInPerM: 5,
    priceOutPerM: 30,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "gpt-5.5-pro",
    name: "GPT-5.5 Pro",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
    // Fuente: página de modelo de la API de OpenAI (verificado oct-2026)
    priceInPerM: 1.75,
    priceOutPerM: 14,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: true,
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
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
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1 (legacy)",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_047_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o (legacy)",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2024,
    enabledByDefault: false,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini (legacy)",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.1,
    vision: true,
    releaseYear: 2024,
    enabledByDefault: false,
  },

  // ── Anthropic (estimado en V1; count_tokens por API en fase 3) ───────────
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: anuncio oficial de Anthropic "Introducing Claude Opus 5.5"
    // (22-sep-2026): $4 entrada / $20 salida por millón.
    priceInPerM: 4,
    priceOutPerM: 20,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "claude-fable-5-1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "claude-mythos-5-1",
    name: "Claude Mythos 5.1",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5 (legacy)",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
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
    releaseYear: 2025,
    enabledByDefault: true,
  },

  // ── Google (estimado en V1; countTokens por API en fase 3) ───────────────
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro (preview)",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: true,
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro (legacy)",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash (legacy)",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── Meta (tokenizador abierto vía transformers.js en fase 2) ─────────────
  // Nota oct-2026: Llama 4 sigue siendo la última generación pública de Meta
  // (Llama 5 aún sin lanzar). Behemoth no tiene ventana documentada → fuera.
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "meta",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    // mismo tokenizer.json que Scout (ETag idéntico verificado en HF)
    hfRepo: "unsloth/Llama-4-Scout-17B-16E-Instruct",
    vision: true,
    releaseYear: 2025,
    enabledByDefault: true,
  },
  {
    id: "llama-4-scout",
    name: "Llama 4 Scout",
    provider: "meta",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 10_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    hfRepo: "unsloth/Llama-4-Scout-17B-16E-Instruct",
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B (legacy)",
    provider: "meta",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    hfRepo: "unsloth/Llama-3.3-70B-Instruct",
    releaseYear: 2024,
    enabledByDefault: false,
  },

  // ── Mistral ───────────────────────────────────────────────────────────────
  {
    id: "mistral-medium-3-5",
    name: "Mistral Medium 3.5",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 262_144,
    // Fuente: pricing API de Mistral corroborado por varios rastreadores
    // (oct-2026). Verificar en mistral.ai/pricing antes de producción.
    priceInPerM: 1.5,
    priceOutPerM: 7.5,
    estimateRatio: 3.8,
    hfRepo: "mistralai/Mistral-Medium-3.5-128B",
    vision: true, // admite entrada de texto e imagen (modelo denso de 128B)
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "mistral-large-3",
    name: "Mistral Large 3",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 262_144,
    priceInPerM: 0.5,
    priceOutPerM: 1.5,
    estimateRatio: 3.8,
    hfRepo: "mistralai/Mistral-Large-3-675B-Instruct-2512",
    releaseYear: 2025,
    enabledByDefault: false,
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
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── DeepSeek ──────────────────────────────────────────────────────────────
  // Nota oct-2026: deepseek-chat / deepseek-reasoner están obsoletos (apuntan
  // a V4-Flash). Se listan los nombres actuales de la API.
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-V4-Pro",
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "deepseek-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-V4.1-Flash",
    vision: true, // multimodal nativo (sep-2026)
    releaseYear: 2026,
    enabledByDefault: true,
  },

  // ── xAI ───────────────────────────────────────────────────────────────────
  // Nota oct-2026: Grok 5 sigue en entrenamiento (sin fecha pública).
  {
    id: "grok-4-5",
    name: "Grok 4.5",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 500_000,
    // Fuente: notas de versión oficiales de xAI (oct-2026)
    priceInPerM: 2,
    priceOutPerM: 6,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "grok-4-1-fast",
    name: "Grok 4.1 Fast",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 2_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "grok-4",
    name: "Grok 4 (legacy)",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 256_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── Qwen ──────────────────────────────────────────────────────────────────
  {
    id: "qwen3.8-max",
    name: "Qwen3.8 Max",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: anuncios de lanzamiento de Alibaba (ago-2026), corroborados
    priceInPerM: 2,
    priceOutPerM: 6,
    estimateRatio: 3.6,
    // Qwen3.8-Max es API-only: tokenizer de la generación 3.8 abierta
    // (ETag idéntico al de Qwen3.8-27B, verificado en HF)
    hfRepo: "Qwen/Qwen3.8-2.4T-A95B",
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "qwen3.6-plus",
    name: "Qwen3.6-Plus",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_000_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    // Qwen3.6-Plus es API-only: tokenizer de la generación 3.6 abierta
    hfRepo: "Qwen/Qwen3.6-27B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3-235b",
    name: "Qwen3 235B (legacy)",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3-235B-A22B",
    releaseYear: 2025,
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

/** Año actual del catálogo (para la insignia "nuevo" en la UI). */
export const CATALOG_YEAR = 2026;

/** Un modelo cuenta como "novedad" si se lanzó en el año actual del catálogo. */
export function isNewRelease(model: ModelConfig): boolean {
  return model.releaseYear != null && model.releaseYear >= CATALOG_YEAR;
}

/** Monedas admitidas. `rate` = unidades de la moneda por 1 USD.
 *  TODO: rellena el tipo de cambio del euro (o el que uses) con un valor
 *  actualizado; hasta entonces los costes en EUR se muestran como pendientes. */
export const CURRENCIES = {
  USD: { symbol: "$", rate: 1 as number | null },
  EUR: { symbol: "€", rate: null },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
