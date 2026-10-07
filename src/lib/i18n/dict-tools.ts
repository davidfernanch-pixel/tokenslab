/**
 * Diccionario de herramientas (Task 16-a): diálogos de pegado, visualizador,
 * optimizador, fragmentador, comparador, historial, ajustes, calculadora
 * mensual y control de tokens de salida.
 * Prefijos: "paste." / "viz." / "opt." / "chunk." / "cmp." / "history." /
 * "settings." / "monthly." / "output."
 * Interpolación: t("clave", { n: 3 }) sustituye {n}; {plural} se usa para
 * plurales (patrón establecido en dict-core "byok.status.done").
 */

export const TOOLS_ES: Record<string, string> = {
  // ── Diálogo de pegado (PasteDialog) ─────────────────────────────────────
  "paste.trigger": "Pegar texto",
  "paste.title": "Pega tu texto",
  "paste.desc": "Se analiza localmente en tu navegador, sin subidas.",
  "paste.placeholder": "Pega aquí tu prompt, documento, código…",
  "paste.aria": "Texto a analizar",
  "paste.chars": "caracteres",
  "paste.words": "palabras",
  "paste.ctrlEnter": "Ctrl + Enter para analizar",
  "paste.analyze": "Analizar",

  // ── Visualizador de tokens (TokenVisualizer) ────────────────────────────
  "viz.trigger": "Visualizar tokens",
  "viz.analyzeFirst": "Analiza un archivo o texto primero",
  "viz.title": "Tokens al detalle",
  "viz.desc":
    "Cada color es un token distinto (tokenizador o200k_base de OpenAI, exacto en tu navegador).",
  "viz.progressAria": "Progreso de tokenización",
  "viz.tokenizing": "Tokenizando…",
  "viz.failed": "No se pudo tokenizar la vista previa.",
  "viz.avgChars": "car./token de media",
  "viz.whitespaceNote":
    "Los espacios y saltos se muestran como · y ⏎ — también cuentan como tokens.",
  "viz.truncated.a": "Vista limitada a los primeros",
  "viz.truncated.b": "tokens (el análisis completo tiene",
  "viz.groupAria": "Vista de tokens",
  "viz.chipTitle": "token {id} · {n} car.",

  // ── Optimizador (OptimizerPanel) ────────────────────────────────────────
  "opt.triggerAria": "Optimizar texto",
  "opt.trigger": "Optimizar",
  "opt.analyzeFirst": "Analiza un archivo o texto primero",
  "opt.title": "Optimizador de tokens",
  "opt.desc.a":
    "Reducciones que no cambian el significado del texto. El ahorro en tokens es estimado",
  "opt.desc.b": "y se recalcula exacto al volver a analizar.",
  "opt.riskSafe": "Seguro",
  "opt.riskReview": "Revisar",
  "opt.charsUnit": "car.",
  "opt.allClear":
    "Tu texto ya está compacto: no hay optimizaciones evidentes.",
  "opt.nothingSelected": "Nada seleccionado",
  "opt.summary.text": "Texto:",
  "opt.summary.chars": "caracteres",
  "opt.summary.savings": "Ahorro ≈",
  "opt.footerNote":
    "El texto optimizado se analiza como texto pegado; se guarda en tu historial local.",
  "opt.apply": "Aplicar y volver a analizar",
  "opt.toast.applied": "Texto optimizado: analizando de nuevo…",
  "opt.fallbackName": "texto",
  "opt.optimizedNameSuffix": "(optimizado)",

  // ── Divisor de fragmentos (ChunkSplitter) ───────────────────────────────
  "chunk.triggerAria": "Dividir en fragmentos",
  "chunk.trigger": "Fragmentar",
  "chunk.analyzeFirst": "Analiza un archivo o texto primero",
  "chunk.title": "Divisor de fragmentos",
  "chunk.desc":
    "Trocea el texto en bloques de N tokens exactos (o200k_base) con solapamiento para RAG y prompts largos.",
  "chunk.limitWarn":
    "El divisor procesa como máximo 1 000 000 caracteres; se fragmentarán solo los primeros.",
  "chunk.tokensPerChunk": "Tokens por fragmento",
  "chunk.overlap": "Solapamiento (tokens)",
  "chunk.overlapAria": "Solapamiento en tokens",
  "chunk.exactNote":
    "Fragmentación exacta con el tokenizador de OpenAI en tu navegador.",
  "chunk.compute": "Calcular fragmentos",
  "chunk.progressAria": "Progreso de fragmentación",
  "chunk.working": "Tokenizando y empaquetando…",
  "chunk.error.compute":
    "No se pudieron calcular los fragmentos. Inténtalo de nuevo o usa un texto más corto.",
  "chunk.error.hint":
    "El texto se procesa íntegramente en tu navegador; si el error persiste, prueba con un texto más corto.",
  "chunk.stat.count": "Fragmentos",
  "chunk.stat.avg": "Media tokens",
  "chunk.stat.min": "Mín. tokens",
  "chunk.stat.max": "Máx. tokens",
  "chunk.copyAria": "Copiar fragmento {n}",
  "chunk.toast.copied": "Fragmento {n} copiado",
  "chunk.toast.copyFailed": "No se pudo copiar el fragmento",
  "chunk.toast.zipFailed": "No se pudo generar el ZIP",
  "chunk.emptyHint": "Ajusta el tamaño y pulsa Calcular fragmentos.",
  "chunk.downloadTxt": "Descargar .txt",
  "chunk.downloadZip": "Descargar ZIP",
  "chunk.file.txtName": "-fragmentos.txt",
  "chunk.file.zipName": "-fragmentos.zip",
  "chunk.file.chunkName": "-fragmento-",
  "chunk.file.header":
    "───── Fragmento {n} ({tokens} tokens) ─────",

  // ── Comparador de análisis (CompareDialog) ──────────────────────────────
  "cmp.title": "Comparar análisis",
  "cmp.desc":
    "Diferencia de tokens por modelo entre los dos análisis seleccionados.",
  "cmp.empty": "Estos análisis no tienen resultados por modelo.",
  "cmp.col.model": "Modelo",
  "cmp.col.tokensA": "Tokens A",
  "cmp.col.tokensB": "Tokens B",
  "cmp.col.diff": "Diferencia",
  "cmp.col.change": "Cambio",
  "cmp.chars": "caracteres",
  "cmp.files": "{n} archivos",
  "cmp.images": "{n} imagen{plural}",
  "cmp.models": "{n} modelo{plural}",
  "cmp.breakdown": "texto {text} + img {img}",
  "cmp.copy": "Copiar comparación",
  "cmp.toast.copied": "Comparación copiada al portapapeles",
  "cmp.toast.copyFailed": "No se pudo copiar la comparación",
  "cmp.md.title": "# TokenLens — Comparación de análisis",
  "cmp.md.entryA": "- **Análisis A:** {name} ({meta})",
  "cmp.md.entryB": "- **Análisis B:** {name} ({meta})",
  "cmp.md.header": "| Modelo | Tokens A | Tokens B | Diferencia | Cambio |",
  "cmp.md.footer":
    "> Diferencia = tokens B − tokens A. Generado con TokenLens — procesamiento 100 % local.",

  // ── Historial local (HistoryPanel) ──────────────────────────────────────
  "history.triggerAria": "Ver historial local",
  "history.trigger": "Historial",
  "history.title": "Historial local",
  "history.desc":
    "Tus últimos análisis, guardados solo en tu navegador. Nunca se envían a ningún servidor.",
  "history.empty":
    "Aún no hay análisis guardados. Analiza un archivo o texto y aparecerá aquí.",
  "history.chars": "caracteres",
  "history.models": "{n} modelo{plural}",
  "history.row.showAria": "Ver resultados por modelo",
  "history.row.hideAria": "Ocultar resultados",
  "history.compare.selectAria": "Seleccionar {name} para comparar",
  "history.compare.select": "Seleccionar para comparar",
  "history.compare.remove": "Quitar de la comparación",
  "history.restoreAria": "Restaurar análisis",
  "history.tooLarge": "El texto era demasiado grande para guardarse (> {kb} KB)",
  "history.deleteAria": "Eliminar del historial",
  "history.more": "+{n} más",
  "history.compare.hint": "Selecciona 2 análisis para comparar",
  "history.compare.clear": "Limpiar",
  "history.compare.go": "Comparar (2)",
  "history.compare.compareN": "Comparar ({n}/2)",
  "history.compare.rotatedToast":
    "Selección actualizada: se comparan los dos últimos análisis",
  "history.toast.restored": "Análisis restaurado",
  "history.toast.cleared": "Historial vaciado",
  "history.footerNote":
    "Máximo {max} análisis · Se guarda el texto solo si pesa menos de {kb} KB · Compara dos análisis",
  "history.clear": "Vaciar historial",
  "history.clearConfirmTitle": "¿Vaciar el historial?",
  "history.clearConfirmDesc": "Esta acción no se puede deshacer.",
  "history.clearConfirmAction": "Vaciar",

  // ── Ajustes (SettingsPanel) ─────────────────────────────────────────────
  "settings.openAria": "Abrir ajustes",
  "settings.trigger": "Ajustes",
  "settings.title": "Ajustes",
  "settings.desc":
    "Tus preferencias se guardan en este navegador (localStorage).",
  "settings.models.label": "Modelos visibles",
  "settings.models.restore": "Restaurar",
  "settings.models.window": "ventana",
  "settings.byok.title": "Conteo oficial (BYOK)",
  "settings.byok.active": "activo",
  "settings.byok.desc":
    "Añade tus API keys de Anthropic y Google para sustituir la estimación 🟡 por el conteo oficial 🔵 de sus APIs en cada análisis.",
  "settings.byok.switchAria": "Activar conteo oficial con tus API keys",
  "settings.byok.anthropicKey": "Anthropic API key",
  "settings.byok.googleKey": "Google AI Studio key",
  "settings.byok.disabledPlaceholder": "Desactivado",
  "settings.byok.keyPlaceholder": "sk-ant-… / AIza…",
  "settings.byok.hideKey": "Ocultar key",
  "settings.byok.showKey": "Mostrar key",
  "settings.byok.clearKey": "Borrar key",
  "settings.byok.security.a":
    "Las keys se guardan solo en este navegador y se envían únicamente al proveedor a través de un proxy sin estado (",
  "settings.byok.security.b":
    "). Nunca se almacenan ni se registran en el servidor.",
  "settings.byok.counter":
    "{ready} de {total} modelos activos recibirán conteo oficial.",
  "settings.currency.label": "Moneda para los costes",
  "settings.currency.usd": "USD ($ dólar)",
  "settings.currency.eur": "EUR (€ euro)",
  "settings.currency.eurNote":
    "El tipo de cambio del euro está pendiente (TODO en models.config.ts). Los costes se mostrarán como «—» hasta configurarlo.",
  "settings.footerNote":
    "Los tokens se calculan siempre para todos los modelos; aquí solo eliges cuáles se muestran.",

  // ── Calculadora mensual (MonthlyCalculator) ─────────────────────────────
  "monthly.triggerAria": "Calcular coste mensual",
  "monthly.trigger": "Coste mensual",
  "monthly.title": "Calculadora de coste mensual",
  "monthly.desc":
    "Proyecta tu uso diario a un mes y estima el coste con los precios configurados.",
  "monthly.model": "Modelo",
  "monthly.modelPlaceholder": "Selecciona un modelo",
  "monthly.requestsPerDay": "Solicitudes por día",
  "monthly.days": "Días al mes",
  "monthly.tokensIn": "Tokens de entrada / solicitud",
  "monthly.tokensOut": "Tokens de salida / solicitud",
  "monthly.tokensInMonth": "Tokens de entrada al mes",
  "monthly.tokensOutMonth": "Tokens de salida al mes",
  "monthly.requestsMonth": "Solicitudes al mes",
  "monthly.costLabel": "Coste estimado al mes",
  "monthly.pricesTitle": "Los precios aún no están configurados",
  "monthly.pricesBody.a": "Rellena",
  "monthly.pricesBody.b": "y",
  "monthly.pricesBody.c": "en",
  "monthly.pricesBody.d":
    "con los valores oficiales. Sin precios no se inventan costes.",
  "monthly.linearNote":
    "Estimación lineal: los proveedores facturan por millón de tokens. El uso real varía con cachés y descuentos.",

  // ── Control de tokens de salida (OutputTokensControl) ───────────────────
  "output.label": "Tokens de respuesta esperados",
  "output.helper":
    "Se suman a la entrada para estimar el coste total por petición.",
};

export const TOOLS_EN: Record<string, string> = {
  // ── Paste dialog (PasteDialog) ──────────────────────────────────────────
  "paste.trigger": "Paste text",
  "paste.title": "Paste your text",
  "paste.desc": "Analyzed locally in your browser, no uploads.",
  "paste.placeholder": "Paste your prompt, document, code here…",
  "paste.aria": "Text to analyze",
  "paste.chars": "characters",
  "paste.words": "words",
  "paste.ctrlEnter": "Ctrl + Enter to analyze",
  "paste.analyze": "Analyze",

  // ── Token visualizer (TokenVisualizer) ──────────────────────────────────
  "viz.trigger": "Visualize tokens",
  "viz.analyzeFirst": "Analyze a file or text first",
  "viz.title": "Tokens up close",
  "viz.desc":
    "Each color is a distinct token (OpenAI's o200k_base tokenizer, exact in your browser).",
  "viz.progressAria": "Tokenization progress",
  "viz.tokenizing": "Tokenizing…",
  "viz.failed": "Could not tokenize the preview.",
  "viz.avgChars": "avg chars/token",
  "viz.whitespaceNote":
    "Spaces and line breaks are shown as · and ⏎ — they count as tokens too.",
  "viz.truncated.a": "Preview limited to the first",
  "viz.truncated.b": "tokens (the full analysis has",
  "viz.groupAria": "Token view",
  "viz.chipTitle": "token {id} · {n} chars",

  // ── Optimizer (OptimizerPanel) ──────────────────────────────────────────
  "opt.triggerAria": "Optimize text",
  "opt.trigger": "Optimize",
  "opt.analyzeFirst": "Analyze a file or text first",
  "opt.title": "Token optimizer",
  "opt.desc.a":
    "Reductions that leave the meaning of your text intact. Token savings are estimated",
  "opt.desc.b": "and are recalculated exactly when you re-analyze.",
  "opt.riskSafe": "Safe",
  "opt.riskReview": "Review",
  "opt.charsUnit": "chars",
  "opt.allClear":
    "Your text is already compact: no obvious optimizations found.",
  "opt.nothingSelected": "Nothing selected",
  "opt.summary.text": "Text:",
  "opt.summary.chars": "characters",
  "opt.summary.savings": "Savings ≈",
  "opt.footerNote":
    "The optimized text is analyzed as pasted text and saved to your local history.",
  "opt.apply": "Apply and re-analyze",
  "opt.toast.applied": "Text optimized: analyzing again…",
  "opt.fallbackName": "text",
  "opt.optimizedNameSuffix": "(optimized)",

  // ── Chunk splitter (ChunkSplitter) ──────────────────────────────────────
  "chunk.triggerAria": "Split into chunks",
  "chunk.trigger": "Split",
  "chunk.analyzeFirst": "Analyze a file or text first",
  "chunk.title": "Chunk splitter",
  "chunk.desc":
    "Splits your text into exact N-token blocks (o200k_base) with overlap for RAG and long prompts.",
  "chunk.limitWarn":
    "The splitter processes at most 1,000,000 characters; only the first ones will be chunked.",
  "chunk.tokensPerChunk": "Tokens per chunk",
  "chunk.overlap": "Overlap (tokens)",
  "chunk.overlapAria": "Overlap in tokens",
  "chunk.exactNote": "Exact chunking with OpenAI's tokenizer in your browser.",
  "chunk.compute": "Compute chunks",
  "chunk.progressAria": "Chunking progress",
  "chunk.working": "Tokenizing and packing…",
  "chunk.error.compute":
    "The chunks could not be computed. Try again or use a shorter text.",
  "chunk.error.hint":
    "The text is processed entirely in your browser; if the error persists, try a shorter text.",
  "chunk.stat.count": "Chunks",
  "chunk.stat.avg": "Avg. tokens",
  "chunk.stat.min": "Min. tokens",
  "chunk.stat.max": "Max. tokens",
  "chunk.copyAria": "Copy chunk {n}",
  "chunk.toast.copied": "Chunk {n} copied",
  "chunk.toast.copyFailed": "Could not copy the chunk",
  "chunk.toast.zipFailed": "Could not generate the ZIP",
  "chunk.emptyHint": "Adjust the size and click Compute chunks.",
  "chunk.downloadTxt": "Download .txt",
  "chunk.downloadZip": "Download ZIP",
  "chunk.file.txtName": "-chunks.txt",
  "chunk.file.zipName": "-chunks.zip",
  "chunk.file.chunkName": "-chunk-",
  "chunk.file.header": "───── Chunk {n} ({tokens} tokens) ─────",

  // ── Analysis comparison (CompareDialog) ─────────────────────────────────
  "cmp.title": "Compare analyses",
  "cmp.desc":
    "Per-model token difference between the two selected analyses.",
  "cmp.empty": "These analyses have no per-model results.",
  "cmp.col.model": "Model",
  "cmp.col.tokensA": "Tokens A",
  "cmp.col.tokensB": "Tokens B",
  "cmp.col.diff": "Difference",
  "cmp.col.change": "Change",
  "cmp.chars": "characters",
  "cmp.files": "{n} files",
  "cmp.images": "{n} image{plural}",
  "cmp.models": "{n} model{plural}",
  "cmp.breakdown": "text {text} + img {img}",
  "cmp.copy": "Copy comparison",
  "cmp.toast.copied": "Comparison copied to clipboard",
  "cmp.toast.copyFailed": "Could not copy the comparison",
  "cmp.md.title": "# TokenLens — Analysis comparison",
  "cmp.md.entryA": "- **Analysis A:** {name} ({meta})",
  "cmp.md.entryB": "- **Analysis B:** {name} ({meta})",
  "cmp.md.header": "| Model | Tokens A | Tokens B | Difference | Change |",
  "cmp.md.footer":
    "> Difference = tokens B − tokens A. Generated with TokenLens — 100% local processing.",

  // ── Local history (HistoryPanel) ────────────────────────────────────────
  "history.triggerAria": "View local history",
  "history.trigger": "History",
  "history.title": "Local history",
  "history.desc":
    "Your latest analyses, stored only in your browser. They are never sent to any server.",
  "history.empty":
    "No saved analyses yet. Analyze a file or some text and it will appear here.",
  "history.chars": "characters",
  "history.models": "{n} model{plural}",
  "history.row.showAria": "Show per-model results",
  "history.row.hideAria": "Hide results",
  "history.compare.selectAria": "Select {name} to compare",
  "history.compare.select": "Select to compare",
  "history.compare.remove": "Remove from comparison",
  "history.restoreAria": "Restore analysis",
  "history.tooLarge": "The text was too large to be stored (> {kb} KB)",
  "history.deleteAria": "Delete from history",
  "history.more": "+{n} more",
  "history.compare.hint": "Select 2 analyses to compare",
  "history.compare.clear": "Clear",
  "history.compare.go": "Compare (2)",
  "history.compare.compareN": "Compare ({n}/2)",
  "history.compare.rotatedToast":
    "Selection updated: the two latest analyses will be compared",
  "history.toast.restored": "Analysis restored",
  "history.toast.cleared": "History cleared",
  "history.footerNote":
    "Up to {max} analyses · Text is stored only if it weighs less than {kb} KB · Compare two analyses",
  "history.clear": "Clear history",
  "history.clearConfirmTitle": "Clear the history?",
  "history.clearConfirmDesc": "This action cannot be undone.",
  "history.clearConfirmAction": "Clear",

  // ── Settings (SettingsPanel) ────────────────────────────────────────────
  "settings.openAria": "Open settings",
  "settings.trigger": "Settings",
  "settings.title": "Settings",
  "settings.desc": "Your preferences are stored in this browser (localStorage).",
  "settings.models.label": "Visible models",
  "settings.models.restore": "Restore",
  "settings.models.window": "window",
  "settings.byok.title": "Official counting (BYOK)",
  "settings.byok.active": "active",
  "settings.byok.desc":
    "Add your Anthropic and Google API keys to replace the 🟡 estimate with the 🔵 official count from their APIs on every analysis.",
  "settings.byok.switchAria": "Enable official counting with your API keys",
  "settings.byok.anthropicKey": "Anthropic API key",
  "settings.byok.googleKey": "Google AI Studio key",
  "settings.byok.disabledPlaceholder": "Disabled",
  "settings.byok.keyPlaceholder": "sk-ant-… / AIza…",
  "settings.byok.hideKey": "Hide key",
  "settings.byok.showKey": "Show key",
  "settings.byok.clearKey": "Clear key",
  "settings.byok.security.a":
    "Keys are stored only in this browser and sent only to the provider through a stateless proxy (",
  "settings.byok.security.b":
    "). They are never stored or logged on the server.",
  "settings.byok.counter":
    "{ready} of {total} active models will get an official count.",
  "settings.currency.label": "Currency for costs",
  "settings.currency.usd": "USD ($ dollar)",
  "settings.currency.eur": "EUR (€ euro)",
  "settings.currency.eurNote":
    'The euro exchange rate is pending (TODO in models.config.ts). Costs will be shown as "—" until it is configured.',
  "settings.footerNote":
    "Tokens are always computed for every model; here you only choose which ones are shown.",

  // ── Monthly calculator (MonthlyCalculator) ──────────────────────────────
  "monthly.triggerAria": "Calculate monthly cost",
  "monthly.trigger": "Monthly cost",
  "monthly.title": "Monthly cost calculator",
  "monthly.desc":
    "Project your daily usage over a month and estimate the cost using the configured prices.",
  "monthly.model": "Model",
  "monthly.modelPlaceholder": "Select a model",
  "monthly.requestsPerDay": "Requests per day",
  "monthly.days": "Days per month",
  "monthly.tokensIn": "Input tokens / request",
  "monthly.tokensOut": "Output tokens / request",
  "monthly.tokensInMonth": "Input tokens per month",
  "monthly.tokensOutMonth": "Output tokens per month",
  "monthly.requestsMonth": "Requests per month",
  "monthly.costLabel": "Estimated monthly cost",
  "monthly.pricesTitle": "Prices are not configured yet",
  "monthly.pricesBody.a": "Fill in",
  "monthly.pricesBody.b": "and",
  "monthly.pricesBody.c": "in",
  "monthly.pricesBody.d":
    "with the official values. No prices, no invented costs.",
  "monthly.linearNote":
    "Linear estimate: providers bill per million tokens. Real-world usage varies with caching and discounts.",

  // ── Output tokens control (OutputTokensControl) ─────────────────────────
  "output.label": "Expected response tokens",
  "output.helper":
    "Added to the input to estimate the total cost per request.",
};
