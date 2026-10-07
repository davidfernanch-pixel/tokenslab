/**
 * TokenLens — Configuración central de modelos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 📅 Catálogo actualizado a octubre de 2026 a partir de la lista de modelos
 * facilitada por el usuario (8 proveedores, 112 modelos) y verificado por
 * búsqueda web contra páginas oficiales de pricing cuando ha sido posible:
 *   · OpenAI: developers.openai.com/pricing + anuncios oficiales openai.com
 *   · Google: ai.google.dev/gemini-api/docs/pricing (tabla oficial leída íntegra)
 *   · DeepSeek: api-docs.deepseek.com/quick_start/pricing (oficial)
 *   · xAI: docs.x.ai (grok-4.7) + notas de versión
 *   · Meta: dev.meta.ai (Model API: Models and pricing, Long context)
 *   · Anthropic: anuncios oficiales anthropic.com + platform.claude.com
 *   · Mistral / Qwen: docs y Model Studio + agregadores corroborados
 *
 * ⚠️ PRECIOS: solo se rellenan cuando existen en anuncios oficiales o páginas
 * de pricing corroboradas por varias fuentes (comentario `Fuente:` en cada
 * modelo). El resto sigue a `null` (TODO): rellénalos desde las páginas
 * oficiales antes de usarlos en producción. NO inventar datos de precio.
 * Campos: `priceInPerM` / `priceOutPerM` (USD por 1M de tokens).
 *
 * ⚠️ VENTANAS DE CONTEXTO: tomadas de la documentación pública de cada
 * proveedor en octubre de 2026 cuando fue posible (p. ej. Muse Spark 1.048.576
 * según dev.meta.ai, grok-4.7 500K según docs.x.ai, DeepSeek V4 1M según
 * api-docs.deepseek.com). Las marcadas «por confirmar» son deducciones de
 * familia: verifícalas al actualizar.
 *
 * 🚫 MODELOS DE MEDIO PURO (Muse Image, Muse Video, Muse Voice Transcribe,
 * Grok Imagine): NO se incluyen porque su facturación no es por tokens de
 * texto (p. ej. Muse Image = $0.01 por imagen según dev.meta.ai).
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
  /** id interno, p. ej. "gpt-6-astra" */
  id: string;
  /** nombre visible, p. ej. "GPT-6 Astra" */
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
 * oct-2026 vía HF API: repos públicos, tamaños y ETags comprobados).
 *
 * - Qwen 3.5 (abiertos): 397B-A17B, 122B-A10B, 35B-A3B y 27B comparten el
 *   MISMO tokenizer.json (xet-hash idéntico). Los -Plus/-Max de esa
 *   generación son API-only: se usa el hermano abierto.
 * - Qwen 3.8: 2.4T-A95B, 27B y Flash-Next comparten tokenizer (12,2 MB).
 *   Qwen3.8-Max es API-only: mismo tokenizer de la generación abierta.
 * - Qwen3-Coder-Next: tokenizer propio (6,7 MB, distinto de la serie 3.5).
 * - Devstral 2 / Devstral Small 2 / Ministral 3 (serie 2512): tekken
 *   idéntico (ETag común). Se usa el espejo ungated de unsloth porque el
 *   repo oficial de Ministral-3-14B llegó a devolver 401 (gated intermitente).
 * - DeepSeek V4: V4-Pro y V4-Flash comparten tokenizer (ETag idéntico,
 *   vocab 129.280). V3.2 y V3.2-Speciale comparten el suyo (7,5 MB).
 * - Mistral Medium 3.5 / Large 3: repos oficiales abiertos (tekken, 131k).
 * - Muse Glimmer 30B: repo oficial meta-models (Apache 2.0, ungated).
 * - Mistral Large 4: pesos abiertos prometidos para finales de oct-2026
 *   (aún sin repo público) → estimado por ahora.
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
  "Qwen/Qwen3.5-397B-A17B": {
    repo: "Qwen/Qwen3.5-397B-A17B",
    label: "Qwen 3.5 (familia abierta)",
    color: PROVIDERS.qwen.color,
    sizeMB: 12,
  },
  "Qwen/Qwen3-Coder-Next": {
    repo: "Qwen/Qwen3-Coder-Next",
    label: "Qwen3-Coder-Next",
    color: PROVIDERS.qwen.color,
    sizeMB: 7,
  },
  "Qwen/Qwen3.6-27B": {
    repo: "Qwen/Qwen3.6-27B",
    label: "Qwen 3.6 (Plus)",
    color: PROVIDERS.qwen.color,
    sizeMB: 12,
  },
  "Qwen/Qwen3.8-2.4T-A95B": {
    repo: "Qwen/Qwen3.8-2.4T-A95B",
    label: "Qwen 3.8 (Max · Flash-Next)",
    color: PROVIDERS.qwen.color,
    sizeMB: 12,
  },
  "unsloth/Devstral-2-123B-Instruct-2512": {
    repo: "unsloth/Devstral-2-123B-Instruct-2512",
    label: "Devstral 2 · Ministral 3",
    color: PROVIDERS.mistral.color,
    sizeMB: 16,
  },
  "mistralai/Mistral-Medium-3.5-128B": {
    repo: "mistralai/Mistral-Medium-3.5-128B",
    label: "Mistral Medium 3.5",
    color: PROVIDERS.mistral.color,
    sizeMB: 16,
  },
  "mistralai/Mistral-Large-3-675B-Instruct-2512": {
    repo: "mistralai/Mistral-Large-3-675B-Instruct-2512",
    label: "Mistral Large 3",
    color: PROVIDERS.mistral.color,
    sizeMB: 16,
  },
  "deepseek-ai/DeepSeek-V4-Pro": {
    repo: "deepseek-ai/DeepSeek-V4-Pro",
    label: "DeepSeek V4 (Pro · Flash)",
    color: PROVIDERS.deepseek.color,
    sizeMB: 6,
  },
  "deepseek-ai/DeepSeek-V3.2": {
    repo: "deepseek-ai/DeepSeek-V3.2",
    label: "DeepSeek V3.2 (Speciale)",
    color: PROVIDERS.deepseek.color,
    sizeMB: 8,
  },
  "deepseek-ai/DeepSeek-OCR": {
    repo: "deepseek-ai/DeepSeek-OCR",
    label: "DeepSeek OCR",
    color: PROVIDERS.deepseek.color,
    sizeMB: 10,
  },
  "meta-models/Muse-Glimmer-30B": {
    repo: "meta-models/Muse-Glimmer-30B",
    label: "Muse Glimmer 30B",
    color: PROVIDERS.meta.color,
    sizeMB: 27,
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
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // Fuente: developers.openai.com/pricing ("gpt-6-astra $10.00") + eesel,
    // getdeploying, cloudzero, openrouter, aipricing.guru (sep-2026).
    priceInPerM: 10,
    priceOutPerM: 50,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // Fuente: openai.com "Introducing GPT-6 Sol and Luna" (22-sep-2026):
    // rebaja de $4/$20 (GPT-5.6 Sol) a $2/$10. Corroborado por
    // artificialanalysis, requesty, aitokenprice y rootdata.
    priceInPerM: 2,
    priceOutPerM: 10,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // Fuente: openai.com (22-sep-2026, rebaja del 50%: $0.20/$1.20 →
    // $0.10/$0.50) + developers.openai.com ("gpt-6-luna $0.10") +
    // llm-stats, samprix, artificialanalysis.
    priceInPerM: 0.1,
    priceOutPerM: 0.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-6-pro",
    name: "GPT-6 Pro",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // TODO: sin precio API corroborado (aitokenprice muestra un fragmento
    // ambiguo con $5/$30). Los planes ChatGPT Pro ($100–$200/mes) no son API.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000, // por confirmar (línea GPT-5.5+)
    // Fuente: creditforstartups ("gpt-5.6-sol $4/$20") + artificialanalysis
    // ("Sol drops from $4/$20 to $2/$10" al llegar GPT-6 Sol).
    priceInPerM: 4,
    priceOutPerM: 20,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000, // por confirmar
    // Fuente: creditforstartups ("terra $2/$12"). Coherente con el -20%
    // de Terra anunciado por Microsoft Learn (jul-2026) sobre el $2.50
    // de lanzamiento.
    priceInPerM: 2,
    priceOutPerM: 12,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000, // por confirmar
    // Fuente: creditforstartups ("luna $0.20/$1.20") + openrouter +
    // aigrow. Coherente con el -80% de Luna (Microsoft Learn, jul-2026).
    priceInPerM: 0.2,
    priceOutPerM: 1.2,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.5-thinking",
    name: "GPT-5.5 Thinking",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // Fuente: anuncio oficial de OpenAI "Introducing GPT-5.5" (23-abr-2026)
    // + apidog ("de $2.50/$15 a $5/$30") + inworld.
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
    // TODO: fuentes en conflicto — apidog dice "Pro se mantiene en $30/$180"
    // y anotherwrapper $60/$480. Sin corroboración → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.5-instant",
    name: "GPT-5.5 Instant",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000, // por confirmar (línea Instant)
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.5-cyber",
    name: "GPT-5.5-Cyber",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000, // por confirmar (variante de seguridad)
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.4-thinking",
    name: "GPT-5.4 Thinking",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // Fuente: apidog (23-abr-2026: GPT-5.5 sube "desde $2.50/$15", o sea
    // el precio de GPT-5.4) + implicator ("el modelo completo cuesta $2.50").
    // help.apiyi: 1,05 M de contexto; el precio se dobla pasando 272 K.
    priceInPerM: 2.5,
    priceOutPerM: 15,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.4-pro",
    name: "GPT-5.4 Pro",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 1_050_000,
    // TODO: apidog sugiere que la línea Pro estaba en $30/$180 antes de
    // GPT-5.5, pero no lo confirma para 5.4 Pro → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 mini",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
    // Fuente: anuncio oficial openai.com "Introducing GPT-5.4 mini and nano"
    // (17-mar-2026) + aigrow, aicostcheck, 24aiglobal, aifreeapi, implicator.
    priceInPerM: 0.75,
    priceOutPerM: 4.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 nano",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
    // Fuente: anuncio oficial openai.com (17-mar-2026: "$0.20/$1.25") +
    // inworld, openrouter, implicator.
    priceInPerM: 0.2,
    priceOutPerM: 1.25,
    estimateRatio: 4.1,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3 Codex",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gpt-5.3-instant",
    name: "GPT-5.3 Instant",
    provider: "openai",
    tokenizer: "tiktoken-o200k",
    precision: "exact",
    contextWindow: 400_000,
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
    enabledByDefault: false,
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
    id: "gpt-5.1",
    name: "GPT-5.1",
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
    id: "gpt-5.1-codex-max",
    name: "GPT-5.1-Codex-Max",
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

  // ── Anthropic (estimado en V1; count_tokens por API en fase 3) ───────────
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: anuncio oficial de Anthropic "Introducing Claude Opus 5.5"
    // (22-sep-2026): $4 entrada / $20 salida por millón (-20% vs Opus 5).
    priceInPerM: 4,
    priceOutPerM: 20,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: anuncio oficial de Anthropic (28-sep-2026): "el mismo precio
    // que Sonnet 5: $2/$10" + anthropic.com/models/claude/sonnet +
    // openrouter y growthcab.
    priceInPerM: 2,
    priceOutPerM: 10,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: lanzamiento 7-oct-2026 — Yahoo Finance ("$0.10/$0.50") y
    // VentureBeat ("-90%, igualando a GPT-6 Luna" = $0.10/$0.50).
    // OJO: platform.claude.com indica tarifa superior con prompts >100 K.
    priceInPerM: 0.1,
    priceOutPerM: 0.5,
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
    // Fuente: newscord (2-sep-2026: "sin cambio, $10/$50") + shattered.io
    // + platform.claude.com (cache hit 2,5% = $0.25 → entrada $10) +
    // VentureBeat ("Opus 5.5 con un 150% menos de coste que Fable 5.1").
    priceInPerM: 10,
    priceOutPerM: 50,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-mythos-5-1",
    name: "Claude Mythos 5.1",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: anotherwrapper ("Mythos 5.1 $10/$50") + newscord (2-sep-2026)
    // + platform.claude.com (cache hit 2,5% → entrada $10).
    priceInPerM: 10,
    priceOutPerM: 50,
    estimateRatio: 3.6,
    vision: true,
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
    // Fuente: anuncio oficial de Anthropic (30-jun-2026): "el precio
    // introductorio de $2/$10 se vuelve permanente".
    priceInPerM: 2,
    priceOutPerM: 10,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: benchlm ("Opus 5 $5/$25") + aritmética oficial: Opus 5.5 es
    // "un 20% menos" que Opus y $4/$20 × 1,25 = $5/$25 ✓.
    priceInPerM: 5,
    priceOutPerM: 25,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: openrouter ("Fable 5 $10/$50") + shattered.io ("la misma
    // tarifa que Fable 5").
    priceInPerM: 10,
    priceOutPerM: 50,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-mythos-5",
    name: "Claude Mythos 5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // TODO: finout habla de "hasta $15/$75" (variable) sin cifras fijas
    // corroboradas → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_000_000,
    // Fuente: finout ("Opus 4.8 mantiene $5/$25; Fast Mode -3x").
    priceInPerM: 5,
    priceOutPerM: 25,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
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
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
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
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
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
    id: "claude-mythos-preview",
    name: "Claude Mythos (preview)",
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
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 200_000,
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
    // Fuente: growthcab + benchlm (oct-2026: "$1/$5").
    priceInPerM: 1,
    priceOutPerM: 5,
    estimateRatio: 3.6,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── Google (estimado en V1; countTokens por API en fase 3) ───────────────
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev/gemini-api/docs/pricing (oficial, tabla
    // estándar): $0.75/$3.75 en precio introductorio hasta 31-dic-2026
    // (desde 1-ene-2027: $1.50/$7.50). Corroborado por cloud.google.com,
    // spendline, intuitionlabs y cual.ai.
    priceInPerM: 0.75,
    priceOutPerM: 3.75,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "gemini-3.8-flash-cyber",
    name: "Gemini 3.8 Flash Cyber",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // TODO: no aparece en la página de pricing de la Developer API
    // (probablemente Vertex/enterprise) → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev (oficial: mismo precio introductorio que 3.8)
    // + cloud.google.com ("3.8, 3.7 y 3.6 Flash a $0.75/$3.75").
    priceInPerM: 0.75,
    priceOutPerM: 3.75,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: idem 3.7 (cloud.google.com + ai.google.dev).
    priceInPerM: 0.75,
    priceOutPerM: 3.75,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev (oficial: $1.50/$9.00) + openrouter, metacto
    // y cloud.google.com.
    priceInPerM: 1.5,
    priceOutPerM: 9,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev (oficial: $0.30/$2.50).
    priceInPerM: 0.3,
    priceOutPerM: 2.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.5-flash-cyber",
    name: "Gemini 3.5 Flash Cyber",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // TODO: no está en la Developer API (Vertex/enterprise) → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev (oficial: $2/$12; $4/$18 con contexto >200 K)
    // + openrouter, metacto, ourcodeworld, suprmind, cloudprice, therundown.
    priceInPerM: 2,
    priceOutPerM: 12,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "gemini-3.1-deep-think",
    name: "Gemini 3.1 Deep Think",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // TODO: no está en la Developer API (Vertex/investigación) → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev (oficial: $0.25/$1.50) + metacto y cloudeagle.
    priceInPerM: 0.25,
    priceOutPerM: 1.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: OpenRouter y agregadores (mismo $2/$12 que 3.1 Pro). Ya no
    // está en la página actual de la Developer API → verificar.
    priceInPerM: 2,
    priceOutPerM: 12,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "gemini-3-deep-think",
    name: "Gemini 3 Deep Think",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // TODO: Vertex/investigación → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: ai.google.dev (oficial: "gemini-3-flash-preview", modelo
    // legacy, $0.50/$3.00).
    priceInPerM: 0.5,
    priceOutPerM: 3,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "gemini-2.5-computer-use",
    name: "Gemini 2.5 Computer Use",
    provider: "google",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // TODO: solo Vertex AI → null.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── Meta · Muse (Llama 4 fue la última entrega de Llama, abr-2025;
  //    la familia Muse la sustituye desde abr-2026) ─────────────────────────
  {
    id: "muse-spark-1-3",
    name: "Muse Spark 1.3",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: dev.meta.ai → Models and pricing (oficial): entrada $1.25,
    // cache $0.15, salida $4.25. Corroborado por mindstudio,
    // artificialanalysis y myclaw (2-sep-2026).
    priceInPerM: 1.25,
    priceOutPerM: 4.25,
    estimateRatio: 3.7,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "muse-spark-1-2",
    name: "Muse Spark 1.2",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // TODO: sin precio corroborado (explainx cita "$0.10/$0.20" de un
    // "Contributor API" dudoso; 1.1 y 1.3 están a $1.25/$4.25).
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "muse-spark-1-1",
    name: "Muse Spark 1.1",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: artificialanalysis (10-jul-2026: "precios de Meta $1.25/$4.25").
    priceInPerM: 1.25,
    priceOutPerM: 4.25,
    estimateRatio: 3.7,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "muse-spark",
    name: "Muse Spark",
    provider: "meta",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "muse-glimmer-30b",
    name: "Muse Glimmer 30B",
    provider: "meta",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 131_072, // "Beam 128K" según dev.meta.ai
    // Open-weights Apache 2.0 para agentes locales: sin precio de API.
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    hfRepo: "meta-models/Muse-Glimmer-30B",
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },

  // ── Mistral ───────────────────────────────────────────────────────────────
  {
    id: "mistral-large-4",
    name: "Mistral Large 4",
    provider: "mistral",
    tokenizer: "estimate", // pesos abiertos prometidos a finales de oct-2026
    precision: "estimated",
    contextWindow: 262_144,
    // Fuente: beam.ai (7-oct-2026): lista $1.36/$4.18 (cache $0.14), en
    // preview en Mistral Studio; OpenRouter muestra $0.68/$2.09 (¿tarifa
    // preview?). Pesos abiertos prometidos → verificar al GA.
    priceInPerM: 1.36,
    priceOutPerM: 4.18,
    estimateRatio: 3.8,
    vision: true,
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
    id: "mistral-small-4",
    name: "Mistral Small 4",
    provider: "mistral",
    tokenizer: "estimate", // repo oficial gated
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "ministral-3-14b",
    name: "Ministral 3 14B",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    // tekken de la serie 2512 (ETag idéntico al de Devstral 2)
    hfRepo: "unsloth/Devstral-2-123B-Instruct-2512",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "ministral-3-8b",
    name: "Ministral 3 8B",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    hfRepo: "unsloth/Devstral-2-123B-Instruct-2512",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "ministral-3-3b",
    name: "Ministral 3 3B",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    hfRepo: "unsloth/Devstral-2-123B-Instruct-2512",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "devstral-2",
    name: "Devstral 2",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 256_000,
    // Fuente: spheron (jul-2026: "Devstral 2 $0.40/$2.00") + anotherwrapper
    // (misma tarifa para la familia Devstral).
    priceInPerM: 0.4,
    priceOutPerM: 2,
    estimateRatio: 3.8,
    hfRepo: "unsloth/Devstral-2-123B-Instruct-2512",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "devstral-small-2",
    name: "Devstral Small 2",
    provider: "mistral",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    hfRepo: "unsloth/Devstral-2-123B-Instruct-2512",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "mistral-ocr-4-1",
    name: "Mistral OCR 4.1",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "mistral-ocr-4",
    name: "Mistral OCR 4",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "mistral-ocr-3",
    name: "Mistral OCR 3",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "mistral-moderation-2",
    name: "Mistral Moderation 2",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 8_192,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "leanstral-1-5",
    name: "Leanstral 1.5",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "shieldstral-1-0",
    name: "Shieldstral 1.0",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "robostral-navigate",
    name: "Robostral Navigate",
    provider: "mistral",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 128_000,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.8,
    releaseYear: 2026,
    enabledByDefault: false,
  },

  // ── DeepSeek (precios oficiales con tarifa valle/punta: peak = 2×) ───────
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: api-docs.deepseek.com (oficial, V4-Pro-0813): entrada
    // $0.66 (valle) / $1.32 (punta), salida $1.98 (valle) / $3.96 (punta).
    priceInPerM: 0.66,
    priceOutPerM: 1.98,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-V4-Pro",
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: api-docs.deepseek.com — nombre legacy retirado: las peticiones
    // las sirve DeepSeek-V4.1-Flash "facturadas a precio Flash":
    // $0.15/$0.60 en tarifa valle (punta = 2×).
    priceInPerM: 0.15,
    priceOutPerM: 0.6,
    estimateRatio: 3.7,
    // mismo tokenizer.json que V4-Pro (ETag idéntico)
    hfRepo: "deepseek-ai/DeepSeek-V4-Pro",
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "deepseek-v4-flash-vision-exp",
    name: "DeepSeek V4 Flash Vision (exp)",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: idem — alias retirado servido por V4.1-Flash a precio Flash.
    priceInPerM: 0.15,
    priceOutPerM: 0.6,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-V4-Pro",
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "deepseek-v3-2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 131_072,
    // Fuente: SiliconFlow y llm-stats (dic-2025: $0.27–0.28/$0.42 en la
    // API de DeepSeek). Ya retirado de la API actual → verificar.
    priceInPerM: 0.28,
    priceOutPerM: 0.42,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-V3.2",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "deepseek-v3-2-speciale",
    name: "DeepSeek V3.2-Speciale",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 131_072,
    // Fuente: llm-stats ("$0.28/$0.42 vía DeepSeek", dic-2025; retirado).
    priceInPerM: 0.28,
    priceOutPerM: 0.42,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-V3.2",
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "deepseek-math-v2",
    name: "DeepSeekMath V2",
    provider: "deepseek",
    tokenizer: "estimate", // repo oficial gated
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    releaseYear: 2025,
    enabledByDefault: false,
  },
  {
    id: "deepseek-ocr",
    name: "DeepSeek OCR",
    provider: "deepseek",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 131_072,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.7,
    hfRepo: "deepseek-ai/DeepSeek-OCR",
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── xAI ───────────────────────────────────────────────────────────────────
  {
    id: "grok-4-7",
    name: "Grok 4.7",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 500_000,
    // Fuente: docs.x.ai (oficial: flagship, contexto 500 K, $2/$6) +
    // buttondown, cometapi, smartscope, usagepricing, benchlm.
    // Prompts ≥200 K: $4/$12.
    priceInPerM: 2,
    priceOutPerM: 6,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "grok-4-6",
    name: "Grok 4.6",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 500_000,
    // Fuente: glbgpt ("grok-4.6 $2/$0.50/$6.00") + buttondown ("el mismo
    // precio que Grok 4.6").
    priceInPerM: 2,
    priceOutPerM: 6,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
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
    enabledByDefault: false,
  },
  {
    id: "grok-4-3",
    name: "Grok 4.3",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: amnic, mem0 y secondtalent ("$1.25/$2.50, contexto 1M").
    priceInPerM: 1.25,
    priceOutPerM: 2.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "grok-4-20-reasoning",
    name: "Grok 4.20 Reasoning",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: mem0 ("Grok 4.3 y las tres variantes 4.20 a $1.25/$2.50").
    priceInPerM: 1.25,
    priceOutPerM: 2.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "grok-4-20-non-reasoning",
    name: "Grok 4.20 Non-Reasoning",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: inworld ("$1.25/$2.50") + mem0.
    priceInPerM: 1.25,
    priceOutPerM: 2.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "grok-4-20-multi-agent",
    name: "Grok 4.20 Multi-Agent",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: openrouter (entrada $1.25) + mem0 (las tres variantes).
    priceInPerM: 1.25,
    priceOutPerM: 2.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "grok-build-0-1",
    name: "Grok Build 0.1",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 262_144,
    // Fuente: guptadeepak, whizi y binance ("$1/$2; ≥200 K: $2/$4",
    // contexto 256 K).
    priceInPerM: 1,
    priceOutPerM: 2,
    estimateRatio: 4.0,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "grok-4-1",
    name: "Grok 4.1",
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
    id: "grok-4-1-fast",
    name: "Grok 4.1 Fast",
    provider: "xai",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 2_000_000,
    // Fuente: amnic y secondtalent ("tier económico $0.20/$0.50").
    priceInPerM: 0.2,
    priceOutPerM: 0.5,
    estimateRatio: 4.0,
    vision: true,
    releaseYear: 2025,
    enabledByDefault: false,
  },

  // ── Qwen (Alibaba) ────────────────────────────────────────────────────────
  {
    id: "qwen3.8-max",
    name: "Qwen3.8 Max",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: anuncios de lanzamiento de Alibaba (ago-2026), corroborados.
    // OJO: cometapi (jul-2026) decía que aún no había precio estándar
    // publicado → verificar en la consola de Model Studio.
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
    id: "qwen3.8-flash-next",
    name: "Qwen3.8 Flash-Next",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.8-2.4T-A95B",
    releaseYear: 2026,
    enabledByDefault: true,
  },
  {
    id: "qwen3.8-2.4t-a95b",
    name: "Qwen3.8 2.4T-A95B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null, // pesos abiertos: sin precio de API propio
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.8-2.4T-A95B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.8-27b",
    name: "Qwen3.8 27B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.8-2.4T-A95B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.7-max",
    name: "Qwen3.7 Max",
    provider: "qwen",
    tokenizer: "estimate", // generación sin hermano abierto en HF
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: Alibaba Cloud Model Studio (oficial, snapshot
    // qwen3.7-max-2026-06-08, tramo 0<Token≤1M: $1.65/$4.95).
    priceInPerM: 1.65,
    priceOutPerM: 4.95,
    estimateRatio: 3.6,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.7-plus",
    name: "Qwen3.7 Plus",
    provider: "qwen",
    tokenizer: "estimate",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.6-max-preview",
    name: "Qwen3.6 Max (preview)",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    // API-only: tokenizer de la generación 3.6 abierta
    hfRepo: "Qwen/Qwen3.6-27B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.6-plus",
    name: "Qwen3.6 Plus",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.6-27B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.6-35b-a3b",
    name: "Qwen3.6 35B-A3B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.6-27B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.6-27b",
    name: "Qwen3.6 27B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.6-27B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-max-preview",
    name: "Qwen3.5 Max (preview)",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    // API-only: tokenizer de la generación 3.5 abierta
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-omni-plus",
    name: "Qwen3.5 Omni-Plus",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    vision: true,
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-plus",
    name: "Qwen3.5 Plus",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    // Fuente: mofcloud citando "Alibaba Cloud Official $0.12/$0.71"
    // (los relés lo mueven entre $0.06 y $0.22) → verificar.
    priceInPerM: 0.12,
    priceOutPerM: 0.71,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-flash",
    name: "Qwen3.5 Flash",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-397b-a17b",
    name: "Qwen3.5 397B-A17B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-122b-a10b",
    name: "Qwen3.5 122B-A10B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-35b-a3b",
    name: "Qwen3.5 35B-A3B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-27b",
    name: "Qwen3.5 27B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-9b",
    name: "Qwen3.5 9B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-4b",
    name: "Qwen3.5 4B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-2b",
    name: "Qwen3.5 2B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3.5-0.8b",
    name: "Qwen3.5 0.8B",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 1_048_576,
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    hfRepo: "Qwen/Qwen3.5-397B-A17B",
    releaseYear: 2026,
    enabledByDefault: false,
  },
  {
    id: "qwen3-coder-next",
    name: "Qwen3-Coder-Next",
    provider: "qwen",
    tokenizer: "hf",
    precision: "estimated",
    contextWindow: 262_144, // por confirmar (línea Coder)
    priceInPerM: null,
    priceOutPerM: null,
    estimateRatio: 3.6,
    // tokenizer propio (6,7 MB, distinto de la serie 3.5)
    hfRepo: "Qwen/Qwen3-Coder-Next",
    releaseYear: 2026,
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
