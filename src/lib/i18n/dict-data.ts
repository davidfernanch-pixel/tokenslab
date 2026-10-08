/**
 * Diccionario de superficies de datos (Task 16-b): dropzone, barra de
 * estadísticas, tarjetas de resultado, tokens de imagen (incluidas las
 * fórmulas de lib/imageTokens.ts, que solo expone ids), gráfico comparativo,
 * tabla de modelos y exportación (menú + cabeceras CSV/JSON/Markdown).
 * Dominios: "drop." / "stats." / "result." / "img." / "chart." / "table." /
 * "export.".
 */

export const DATA_ES: Record<string, string> = {
  // ── Dropzone ────────────────────────────────────────────────────────────
  "drop.zone.aria": "Subir archivos para analizar sus tokens",
  "drop.busy.fallback": "Procesando…",
  "drop.done.files": "{n} archivos",
  "drop.done.completed": " · análisis completado",
  "drop.done.image": "{n} imagen",
  "drop.done.images": "{n} imágenes",
  "drop.button.addMore": "Añadir más",
  "drop.button.changeFile": "Cambiar archivo",
  "drop.button.removeAll": "Quitar todos los archivos",
  "drop.button.remove": "Quitar archivo",
  "drop.title": "Arrastra tus archivos aquí",
  "drop.subtitle": "o haz clic para seleccionarlos",
  "drop.maxFiles": "Puedes analizar hasta {n} archivos a la vez",
  "drop.sample": "Probar con un ejemplo",
  "drop.sample.file": "ejemplo.md",
  "drop.privacy": "Tu archivo se procesa en local: nunca sale de tu navegador",
  "drop.error.title": "No se pudo analizar",
  "drop.warning.title": "Aviso",

  // ── Barra de estadísticas ───────────────────────────────────────────────
  "stats.chars": "Caracteres",
  "stats.words": "Palabras",
  "stats.lines": "Líneas",
  "stats.pages": "Páginas ≈",
  "stats.images": "Imágenes",
  "stats.charsPerToken": "Caracteres/token",
  "stats.files.aria": "Archivos del análisis",
  "stats.exactTooltip": "conteo exacto o200k en tu navegador",
  "stats.removeFile": "Quitar {name}",

  // ── Tarjeta de resultado ────────────────────────────────────────────────
  "result.aria": "{name}: {tokens} tokens",
  "result.text": "Texto",
  "result.image": "Imagen",
  "result.image.estimateHint": "tokens de imagen estimados por fórmula pública",
  "result.contextWindow": "Ventana de contexto",
  "result.window": "Ventana",
  "result.remaining": "Restante",
  "result.overflow": "Exceso",
  "result.cost": "Coste estimado (entrada + {n} de salida)",
  "result.price.todo":
    "Precios pendientes: rellena priceInPerM/priceOutPerM en models.config.ts con valores de las páginas oficiales.",
  "result.fits": "Cabe",
  "result.noFits": "No cabe · +{n}",
  "result.noVision": "No admite imágenes",
  "result.noVisionHint":
    "Este modelo no admite imágenes: solo se cuentan los tokens del texto.",

  // ── Tokens de imagen ────────────────────────────────────────────────────
  "img.section.aria": "Tokens de imagen",
  "img.title": "Tokens de imagen",
  "img.subtitle": "Estimados con las fórmulas públicas de cada proveedor",
  "img.count": "Imágenes ({n})",
  "img.thumbAlt": "{name}, {w} por {h} píxeles",
  "img.byModel": "Por modelo de visión",
  "img.noVision.single": "1 modelo sin soporte de imagen no lo cuenta ({sample}).",
  "img.noVision.plural":
    "{n} modelos sin soporte de imagen no los cuentan ({sample}).",
  "img.privacy":
    "Las imágenes se analizan en tu navegador: nunca salen de tu equipo.",

  // fórmulas: los ids viven en lib/imageTokens.ts (solo datos, sin texto)
  "img.formula.openai-750.label": "OpenAI (750 px²/token)",
  "img.formula.openai-750.expression": "⌈ancho × alto ÷ 750⌉ (mín. 85)",
  "img.formula.openai-750.desc":
    "Fórmula oficial de OpenAI para modelos de visión modernos (GPT-4o, GPT-4.1, o3, GPT-5).",
  "img.formula.openai-tiles-512.label": "OpenAI (mosaicos 512²)",
  "img.formula.openai-tiles-512.expression":
    "85 + ⌈ancho÷512⌉ × ⌈alto÷512⌉ × 170",
  "img.formula.openai-tiles-512.desc":
    "Fórmula oficial de los modelos legacy con mosaicos (GPT-4 Turbo): base + mosaicos de 512×512.",
  "img.formula.anthropic-750.label": "Anthropic (750 px²/token)",
  "img.formula.anthropic-750.expression": "⌈ancho × alto ÷ 750⌉",
  "img.formula.anthropic-750.desc":
    "Fórmula aproximada que documenta Anthropic para Claude 3/4: área dividida entre 750.",
  "img.formula.google-tiles-768.label": "Google (mosaicos 768²)",
  "img.formula.google-tiles-768.expression":
    "máx(258, ⌈ancho÷768⌉ × ⌈alto÷768⌉ × 258)",
  "img.formula.google-tiles-768.desc":
    "Fórmula oficial de Gemini: 258 tokens por mosaico de 768×768 (mínimo 258).",
  "img.formula.generic-750.label": "Genérica (750 px²/token)",
  "img.formula.generic-750.expression": "⌈ancho × alto ÷ 750⌉",
  "img.formula.generic-750.desc":
    "El proveedor no publica una fórmula de tokens de imagen: se aplica la fórmula genérica de área como aproximación.",

  // ── Gráfico comparativo ─────────────────────────────────────────────────
  "chart.title": "Comparativa de tokens",
  "chart.subtitle": "Ordenado de menos a más tokens",

  // ── Tabla de modelos ────────────────────────────────────────────────────
  "table.col.model": "Modelo",
  "table.col.provider": "Proveedor",
  "table.col.tokens": "Tokens",
  "table.col.window": "Ventana",
  "table.col.usage": "Uso",
  "table.col.priceIn": "Entrada /1M",
  "table.col.priceOut": "Salida /1M",
  "table.col.cost": "Coste total",
  "table.col.fits": "¿Cabe?",
  "table.priceTodo": "TODO: rellenar desde la página oficial de precios",
  "table.breakdown": "texto {text} + img {img}",
  "table.costTooltip": "{in} entrada + {out} salida ({n} tokens)",
  "table.fits": "Cabe",
  "table.noFits": "No cabe",

  // ── Exportación: menú ───────────────────────────────────────────────────
  "export.aria": "Exportar resultados",
  "export.button": "Exportar",
  "export.empty": "Analiza algo primero",
  "export.csv": "Descargar CSV",
  "export.json": "Descargar JSON",
  "export.markdown": "Copiar como Markdown",
  "export.toast.mdCopied": "Markdown copiado al portapapeles",
  "export.toast.copyFailed": "No se pudo copiar",
  "export.defaultSlug": "resultados",

  // ── Exportación: CSV ────────────────────────────────────────────────────
  "export.csv.col.model": "modelo",
  "export.csv.col.provider": "proveedor",
  "export.csv.col.tokens": "tokens",
  "export.csv.col.textTokens": "tokens_texto",
  "export.csv.col.imageTokens": "tokens_imagen",
  "export.csv.col.precision": "precision",
  "export.csv.col.contextWindow": "ventana_contexto",
  "export.csv.col.usage": "uso_ventana_%",
  "export.csv.col.fits": "cabe",
  "export.csv.col.overflow": "exceso_tokens",
  "export.csv.col.cost": "coste_total",
  "export.csv.col.currency": "moneda",
  "export.csv.yes": "sí",
  "export.csv.no": "no",
  "export.csv.pending": "pendiente",

  // ── Exportación: JSON ───────────────────────────────────────────────────
  "export.json.field.tool": "herramienta",
  "export.json.field.generated": "generado",
  "export.json.field.file": "archivo",
  "export.json.field.stats": "estadisticas",
  "export.json.field.outputTokens": "tokens_salida_estimados",
  "export.json.field.currency": "moneda",
  "export.json.field.results": "resultados",
  "export.json.field.model": "modelo",
  "export.json.field.provider": "proveedor",
  "export.json.field.textTokens": "tokens_texto",
  "export.json.field.imageTokens": "tokens_imagen",
  "export.json.field.contextWindow": "ventana_contexto",
  "export.json.field.usage": "uso_ventana_pct",
  "export.json.field.fits": "cabe",
  "export.json.field.overflow": "exceso_tokens",
  "export.json.field.priceIn": "precio_entrada_usd_1m",
  "export.json.field.priceOut": "precio_salida_usd_1m",
  "export.json.field.cost": "coste_total",
  "export.json.field.notice": "aviso",
  "export.json.notice":
    "Precios pendientes de configurar (TODO en models.config.ts). Ventanas de contexto según documentación pública: verifica antes de usar.",

  // ── Exportación: Markdown ───────────────────────────────────────────────
  "export.md.title": "# TokenLens — Resultados",
  "export.md.file": "Archivo",
  "export.md.chars": "Caracteres",
  "export.md.words": "Palabras",
  "export.md.lines": "Líneas",
  "export.md.outputTokens": "Tokens de salida estimados",
  "export.md.head": "Modelo | Proveedor | Tokens | Ventana | Uso | ¿Cabe?",
  "export.md.headImages":
    "Modelo | Proveedor | Tokens | Texto | Imagen | Ventana | Uso | ¿Cabe?",
  "export.md.yes": "Sí",
  "export.md.no": "No (excede en {n})",
  "export.md.imageNote":
    "Los tokens de imagen se estiman con las fórmulas públicas de cada proveedor (🟡 estimado).",
  "export.md.footerNote":
    "Precios pendientes de configurar (`TODO` en `models.config.ts`). Generado con TokenLens — procesamiento 100 % local.",
};

export const DATA_EN: Record<string, string> = {
  // ── Drop zone ───────────────────────────────────────────────────────────
  "drop.zone.aria": "Upload files to analyze their tokens",
  "drop.busy.fallback": "Processing…",
  "drop.done.files": "{n} files",
  "drop.done.completed": " · analysis complete",
  "drop.done.image": "{n} image",
  "drop.done.images": "{n} images",
  "drop.button.addMore": "Add more",
  "drop.button.changeFile": "Change file",
  "drop.button.removeAll": "Remove all files",
  "drop.button.remove": "Remove file",
  "drop.title": "Drag your files here",
  "drop.subtitle": "or click to browse",
  "drop.maxFiles": "You can analyze up to {n} files at once",
  "drop.sample": "Try with an example",
  "drop.sample.file": "example.md",
  "drop.privacy": "Your file is processed locally: it never leaves your browser",
  "drop.error.title": "Could not analyze",
  "drop.warning.title": "Warning",

  // ── File stats bar ──────────────────────────────────────────────────────
  "stats.chars": "Characters",
  "stats.words": "Words",
  "stats.lines": "Lines",
  "stats.pages": "Pages ≈",
  "stats.images": "Images",
  "stats.charsPerToken": "Characters/token",
  "stats.files.aria": "Files in the analysis",
  "stats.exactTooltip": "exact o200k count in your browser",
  "stats.removeFile": "Remove {name}",

  // ── Result card ─────────────────────────────────────────────────────────
  "result.aria": "{name}: {tokens} tokens",
  "result.text": "Text",
  "result.image": "Image",
  "result.image.estimateHint": "image tokens estimated with a public formula",
  "result.contextWindow": "Context window",
  "result.window": "Window",
  "result.remaining": "Remaining",
  "result.overflow": "Overflow",
  "result.cost": "Estimated cost (input + {n} output)",
  "result.price.todo":
    "Prices pending: fill in priceInPerM/priceOutPerM in models.config.ts with values from the official pricing pages.",
  "result.fits": "Fits",
  "result.noFits": "Doesn't fit · +{n}",
  "result.noVision": "No image support",
  "result.noVisionHint":
    "This model does not accept images: only text tokens are counted.",

  // ── Image tokens ────────────────────────────────────────────────────────
  "img.section.aria": "Image tokens",
  "img.title": "Image tokens",
  "img.subtitle": "Estimated with each provider's public formulas",
  "img.count": "Images ({n})",
  "img.thumbAlt": "{name}, {w} by {h} pixels",
  "img.byModel": "By vision model",
  "img.noVision.single": "1 model without image support skips it ({sample}).",
  "img.noVision.plural": "{n} models without image support skip them ({sample}).",
  "img.privacy":
    "Images are analyzed in your browser: they never leave your computer.",

  // formulas: ids live in lib/imageTokens.ts (data only, no prose)
  "img.formula.openai-750.label": "OpenAI (750 px²/token)",
  "img.formula.openai-750.expression": "⌈width × height ÷ 750⌉ (min. 85)",
  "img.formula.openai-750.desc":
    "OpenAI's official formula for modern vision models (GPT-4o, GPT-4.1, o3, GPT-5).",
  "img.formula.openai-tiles-512.label": "OpenAI (512² tiles)",
  "img.formula.openai-tiles-512.expression":
    "85 + ⌈width÷512⌉ × ⌈height÷512⌉ × 170",
  "img.formula.openai-tiles-512.desc":
    "Official formula for legacy tiled models (GPT-4 Turbo): base + 512×512 tiles.",
  "img.formula.anthropic-750.label": "Anthropic (750 px²/token)",
  "img.formula.anthropic-750.expression": "⌈width × height ÷ 750⌉",
  "img.formula.anthropic-750.desc":
    "Approximate formula documented by Anthropic for Claude 3/4: area divided by 750.",
  "img.formula.google-tiles-768.label": "Google (768² tiles)",
  "img.formula.google-tiles-768.expression":
    "max(258, ⌈width÷768⌉ × ⌈height÷768⌉ × 258)",
  "img.formula.google-tiles-768.desc":
    "Gemini's official formula: 258 tokens per 768×768 tile (minimum 258).",
  "img.formula.generic-750.label": "Generic (750 px²/token)",
  "img.formula.generic-750.expression": "⌈width × height ÷ 750⌉",
  "img.formula.generic-750.desc":
    "The provider does not publish an image-token formula: the generic area formula is applied as an approximation.",

  // ── Comparison chart ────────────────────────────────────────────────────
  "chart.title": "Token comparison",
  "chart.subtitle": "Sorted from fewest to most tokens",

  // ── Model table ─────────────────────────────────────────────────────────
  "table.col.model": "Model",
  "table.col.provider": "Provider",
  "table.col.tokens": "Tokens",
  "table.col.window": "Window",
  "table.col.usage": "Usage",
  "table.col.priceIn": "Input /1M",
  "table.col.priceOut": "Output /1M",
  "table.col.cost": "Total cost",
  "table.col.fits": "Fits?",
  "table.priceTodo": "TODO: fill in from the official pricing page",
  "table.breakdown": "text {text} + img {img}",
  "table.costTooltip": "{in} input + {out} output ({n} tokens)",
  "table.fits": "Fits",
  "table.noFits": "Doesn't fit",

  // ── Export: menu ────────────────────────────────────────────────────────
  "export.aria": "Export results",
  "export.button": "Export",
  "export.empty": "Run an analysis first",
  "export.csv": "Download CSV",
  "export.json": "Download JSON",
  "export.markdown": "Copy as Markdown",
  "export.toast.mdCopied": "Markdown copied to clipboard",
  "export.toast.copyFailed": "Could not copy",
  "export.defaultSlug": "results",

  // ── Export: CSV ─────────────────────────────────────────────────────────
  "export.csv.col.model": "model",
  "export.csv.col.provider": "provider",
  "export.csv.col.tokens": "tokens",
  "export.csv.col.textTokens": "text_tokens",
  "export.csv.col.imageTokens": "image_tokens",
  "export.csv.col.precision": "precision",
  "export.csv.col.contextWindow": "context_window",
  "export.csv.col.usage": "window_usage_%",
  "export.csv.col.fits": "fits",
  "export.csv.col.overflow": "overflow_tokens",
  "export.csv.col.cost": "total_cost",
  "export.csv.col.currency": "currency",
  "export.csv.yes": "yes",
  "export.csv.no": "no",
  "export.csv.pending": "pending",

  // ── Export: JSON ────────────────────────────────────────────────────────
  "export.json.field.tool": "tool",
  "export.json.field.generated": "generated",
  "export.json.field.file": "file",
  "export.json.field.stats": "stats",
  "export.json.field.outputTokens": "estimated_output_tokens",
  "export.json.field.currency": "currency",
  "export.json.field.results": "results",
  "export.json.field.model": "model",
  "export.json.field.provider": "provider",
  "export.json.field.textTokens": "text_tokens",
  "export.json.field.imageTokens": "image_tokens",
  "export.json.field.contextWindow": "context_window",
  "export.json.field.usage": "window_usage_pct",
  "export.json.field.fits": "fits",
  "export.json.field.overflow": "overflow_tokens",
  "export.json.field.priceIn": "input_price_usd_1m",
  "export.json.field.priceOut": "output_price_usd_1m",
  "export.json.field.cost": "total_cost",
  "export.json.field.notice": "notice",
  "export.json.notice":
    "Prices not configured yet (TODO in models.config.ts). Context windows come from public documentation: verify before use.",

  // ── Export: Markdown ────────────────────────────────────────────────────
  "export.md.title": "# TokenLens — Results",
  "export.md.file": "File",
  "export.md.chars": "Characters",
  "export.md.words": "Words",
  "export.md.lines": "Lines",
  "export.md.outputTokens": "Estimated output tokens",
  "export.md.head": "Model | Provider | Tokens | Window | Usage | Fits?",
  "export.md.headImages":
    "Model | Provider | Tokens | Text | Image | Window | Usage | Fits?",
  "export.md.yes": "Yes",
  "export.md.no": "No (exceeds by {n})",
  "export.md.imageNote":
    "Image tokens are estimated with each provider's public formulas (🟡 estimated).",
  "export.md.footerNote":
    "Prices not configured yet (`TODO` in `models.config.ts`). Generated with TokenLens — 100 % local processing.",
};
