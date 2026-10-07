/**
 * Diccionario núcleo: cabecera, hero, página de resultados, insignias,
 * chip BYOK y cadenas compartidas. Fuente de verdad de claves comunes.
 * (dominios: tools / data / content viven en sus propios archivos)
 */

export const CORE_ES: Record<string, string> = {
  // ── Cabecera ────────────────────────────────────────────────────────────
  "header.home": "TokenLens, inicio",
  "header.nav.principal": "Principal",
  "header.nav.how": "Cómo funciona",
  "header.nav.faq": "FAQ",
  "header.language": "Idioma",

  // ── Hero ────────────────────────────────────────────────────────────────
  "hero.privacy.chip": "Tu archivo no sale de tu navegador",
  "hero.title.a": "¿Cuántos",
  "hero.title.b": "es tu texto",
  "hero.title.c": "en cada modelo de IA?",
  "hero.subtitle":
    "Sube un archivo o pega texto y compara tokens, uso de la ventana de contexto y coste estimado entre GPT, Claude, Gemini, Llama, Mistral, DeepSeek, Grok y Qwen. Todo el procesamiento ocurre en tu navegador, sin subidas ni registro.",
  "hero.chip.local": "Procesamiento 100 % local",
  "hero.chip.instant": "Resultados al instante",
  "hero.chip.models": "modelos",
  "hero.chip.providers": "proveedores",

  // ── Página / resultados ─────────────────────────────────────────────────
  "page.analysis.section": "Análisis de tokens",
  "page.results.section": "Resultados del análisis",
  "page.results.title": "Resultados",
  "page.results.models": "modelos",
  "page.results.counting": "contando…",
  "page.tools": "Herramientas",
  "page.noModels.title": "No hay modelos visibles",
  "page.noModels.body":
    "El análisis se calculó para {results} modelos, pero tienes todos desactivados. Abre Ajustes y activa los que quieras ver.",
  "page.noModels.settings": "Ajustes",
  "page.priceWarning.title": "Los precios aún no están configurados",
  "page.priceWarning.body":
    "El conteo de tokens y las ventanas de contexto funcionan al 100 %. Para ver costes, rellena priceInPerM y priceOutPerM en src/lib/models.config.ts con los valores de las páginas oficiales de cada proveedor.",

  // ── Insignias de precisión ──────────────────────────────────────────────
  "precision.exact": "Exacto",
  "precision.exact.desc":
    "Tokenizador real del proveedor ejecutado en tu navegador (BPE oficial).",
  "precision.official": "Oficial (API)",
  "precision.official.desc":
    "Conteo oficial devuelto por el endpoint del proveedor con tu propia key (modo BYOK).",
  "precision.estimated": "Estimado",
  "precision.estimated.desc":
    "Aproximación por ratio: caracteres ÷ ratio del modelo, ajustada por idioma y contenido.",

  // ── Común ───────────────────────────────────────────────────────────────
  "common.new": "nuevo",
  "common.close": "Cerrar",
  "common.tokens": "tokens",
  "common.text": "texto",
  "common.image": "imagen",
  "common.cancel": "Cancelar",
  "common.copy": "Copiar",
  "common.copied": "Copiado",

  // ── Chip BYOK (cabecera de resultados) ──────────────────────────────────
  "byok.status.running": "conteo oficial…",
  "byok.status.done": "{n} oficial{plural}",
  "byok.status.done.tip": "Conteos oficiales obtenidos de las APIs de Anthropic/Google con tus keys (BYOK)",
  "byok.status.failed.tip": "{n} modelo(s) no pudieron consultarse: {error}",
  "byok.status.unavailable": "API no disponible",
  "byok.status.unavailable.tip": "Error al consultar la API del proveedor",
  "byok.err.invalidKey": "La API key no es válida o no tiene permisos.",
  "byok.err.modelNotFound": "El modelo no existe en la API del proveedor (¿está publicado el id del modelo?).",
  "byok.err.rateLimit": "Límite de peticiones alcanzado en la API del proveedor. Inténtalo de nuevo en unos segundos.",
  "byok.err.providerDown": "La API del proveedor tiene una incidencia temporal. Inténtalo más tarde.",
  "byok.err.noContact": "No se pudo contactar con la API del proveedor (¿sin conexión?).",
  "byok.err.noProxy": "No se pudo contactar con el proxy local /api/count.",

  // ── Optimizador (títulos/descripciones de sugerencias) ──────────────────
  "optimizer.minify-json.title": "Minificar JSON",
  "optimizer.minify-json.desc": "El texto es JSON válido: se compacta sin espacios ni sangría. Mismo dato, menos tokens.",
  "optimizer.strip-comments.title": "Quitar comentarios",
  "optimizer.strip-comments.desc": "Elimina comentarios de bloque (/* … */) y de línea completos (// o #). Revisa el resultado: en algunos formatos un # inicial es contenido.",
  "optimizer.collapse-blank-lines.title": "Colapsar líneas en blanco",
  "optimizer.collapse-blank-lines.desc": "Tres o más saltos de línea seguidos se reducen a una línea en blanco.",
  "optimizer.trim-trailing.title": "Quitar espacios finales",
  "optimizer.trim-trailing.desc": "Espacios y tabulaciones al final de cada línea (y del archivo). No afecta a la sangría inicial.",
  "optimizer.collapse-spaces.title": "Colapsar espacios repetidos",
  "optimizer.collapse-spaces.desc": "Dos o más espacios seguidos dentro de una línea se reducen a uno. No se aplica a código (alineación) y puede afectar a tablas alineadas.",

  // ── Store (cabos restantes) ─────────────────────────────────────────
  "store.fileLabel": "{n} archivos",
  "store.unknownType": "desconocido",
  "store.error.rejected": "No se pudo analizar. Se omitieron: {list}.",
  "store.error.noneAdded": "No se añadió ningún archivo. Se omitieron: {list}.",
  "store.error.noFiles": "No se recibió ningún archivo.",
  "store.warning.skipped": "Archivos omitidos: {list}.",
  "store.progress.extractingOne": "Extrayendo “{name}”…",
  "store.progress.extractingMany": "Extrayendo {n} archivos…",
  "store.progress.extractingStep": "Extrayendo “{name}” ({i}/{n})…",
  "store.error.extractMixed": "No se pudo extraer contenido de ningún archivo. {list}",
  "store.error.extractEmpty": "No se pudo extraer texto de los archivos (pueden estar vacíos o dañados).",
};

export const CORE_EN: Record<string, string> = {
  // ── Header ──────────────────────────────────────────────────────────────
  "header.home": "TokenLens, home",
  "header.nav.principal": "Main",
  "header.nav.how": "How it works",
  "header.nav.faq": "FAQ",
  "header.language": "Language",

  // ── Hero ────────────────────────────────────────────────────────────────
  "hero.privacy.chip": "Your file never leaves your browser",
  "hero.title.a": "How many",
  "hero.title.b": "is your text",
  "hero.title.c": "in every AI model?",
  "hero.subtitle":
    "Upload a file or paste text and compare tokens, context window usage and estimated cost across GPT, Claude, Gemini, Llama, Mistral, DeepSeek, Grok and Qwen. Everything runs in your browser — no uploads, no sign-up.",
  "hero.chip.local": "100 % local processing",
  "hero.chip.instant": "Instant results",
  "hero.chip.models": "models",
  "hero.chip.providers": "providers",

  // ── Results page ────────────────────────────────────────────────────────
  "page.analysis.section": "Token analysis",
  "page.results.section": "Analysis results",
  "page.results.title": "Results",
  "page.results.models": "models",
  "page.results.counting": "counting…",
  "page.tools": "Tools",
  "page.noModels.title": "No visible models",
  "page.noModels.body":
    "The analysis was computed for {results} models, but all of them are hidden. Open Settings and enable the ones you want to see.",
  "page.noModels.settings": "Settings",
  "page.priceWarning.title": "Prices are not configured yet",
  "page.priceWarning.body":
    "Token counting and context windows work at 100 %. To see costs, fill in priceInPerM and priceOutPerM in src/lib/models.config.ts with the values from each provider's official pricing page.",

  // ── Precision badges ────────────────────────────────────────────────────
  "precision.exact": "Exact",
  "precision.exact.desc":
    "The provider's real tokenizer running in your browser (official BPE).",
  "precision.official": "Official (API)",
  "precision.official.desc":
    "Official count returned by the provider's endpoint using your own key (BYOK mode).",
  "precision.estimated": "Estimated",
  "precision.estimated.desc":
    "Ratio approximation: characters ÷ model ratio, adjusted for language and content.",

  // ── Common ──────────────────────────────────────────────────────────────
  "common.new": "new",
  "common.close": "Close",
  "common.tokens": "tokens",
  "common.text": "text",
  "common.image": "image",
  "common.cancel": "Cancel",
  "common.copy": "Copy",
  "common.copied": "Copied",

  // ── BYOK chip (results header) ──────────────────────────────────────────
  "byok.status.running": "official count…",
  "byok.status.done": "{n} official{plural}",
  "byok.status.done.tip": "Official counts fetched from the Anthropic/Google APIs with your keys (BYOK)",
  "byok.status.failed.tip": "{n} model(s) could not be queried: {error}",
  "byok.status.unavailable": "API unavailable",
  "byok.status.unavailable.tip": "Error querying the provider API",
  "byok.err.invalidKey": "The API key is not valid or lacks permissions.",
  "byok.err.modelNotFound": "The model does not exist in the provider API (is the model id published?).",
  "byok.err.rateLimit": "Provider API rate limit reached. Try again in a few seconds.",
  "byok.err.providerDown": "The provider API is having a temporary incident. Try again later.",
  "byok.err.noContact": "Could not reach the provider API (no connection?).",
  "byok.err.noProxy": "Could not reach the local /api/count proxy.",

  // ── Optimizer (suggestion titles/descriptions) ─────────────────────────
  "optimizer.minify-json.title": "Minify JSON",
  "optimizer.minify-json.desc": "The text is valid JSON: it gets compacted without spaces or indentation. Same data, fewer tokens.",
  "optimizer.strip-comments.title": "Strip comments",
  "optimizer.strip-comments.desc": "Removes block comments (/* … */) and full line comments (// or #). Review the result: in some formats a leading # is content.",
  "optimizer.collapse-blank-lines.title": "Collapse blank lines",
  "optimizer.collapse-blank-lines.desc": "Three or more consecutive line breaks are reduced to a single blank line.",
  "optimizer.trim-trailing.title": "Trim trailing spaces",
  "optimizer.trim-trailing.desc": "Spaces and tabs at the end of each line (and of the file). Leading indentation is untouched.",
  "optimizer.collapse-spaces.title": "Collapse repeated spaces",
  "optimizer.collapse-spaces.desc": "Two or more consecutive spaces within a line are reduced to one. Not applied to code (alignment) and may affect aligned tables.",

  // ── Store (remaining strings) ───────────────────────────────────────
  "store.fileLabel": "{n} files",
  "store.unknownType": "unknown",
  "store.error.rejected": "Could not analyze. Skipped: {list}.",
  "store.error.noneAdded": "No file was added. Skipped: {list}.",
  "store.error.noFiles": "No file was received.",
  "store.warning.skipped": "Skipped files: {list}.",
  "store.progress.extractingOne": "Extracting “{name}”…",
  "store.progress.extractingMany": "Extracting {n} files…",
  "store.progress.extractingStep": "Extracting “{name}” ({i}/{n})…",
  "store.error.extractMixed": "No content could be extracted from any file. {list}",
  "store.error.extractEmpty": "Text could not be extracted from the files (they may be empty or corrupted).",
};
