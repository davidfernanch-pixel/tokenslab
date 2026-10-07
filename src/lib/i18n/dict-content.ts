/**
 * Diccionario de secciones de contenido (Task 16-c): cómo funciona, FAQ,
 * footer y mensajes del store (progreso/errores/rechazos de archivos).
 * Las etiquetas y descripciones de precisión NO viven aquí: se reutilizan
 * las claves "precision.*" de dict-core para tener una única fuente.
 * Interpolación: {name}, {ext}, {size}, {n} se sustituyen vía t()/tSync().
 */

export const CONTENT_ES: Record<string, string> = {
  // ── Cómo funciona ───────────────────────────────────────────────────────
  "how.kicker": "Cómo funciona",
  "how.title": "Tres pasos, cero servidores",
  "how.subtitle":
    "TokenLens cuenta tokens en tu navegador con el tokenizador real cuando es posible, y con una estimación calibrada para el resto.",
  "how.step1.title": "Sube o pega",
  "how.step1.desc":
    "Arrastra un archivo (PDF, DOCX, XLSX, TXT, MD, código…) o pega texto directamente. Nada viaja a ningún servidor.",
  "how.step2.title": "Tokenizamos en local",
  "how.step2.desc":
    "Contamos los tokens con el tokenizador oficial cuando existe versión para navegador (OpenAI: o200k_base y cl100k_base; Llama, Mistral, DeepSeek y Qwen: BPE oficial de Hugging Face, opt-in en Ajustes) y con estimación por ratio para el resto. Web Workers evitan congelar la interfaz.",
  "how.step3.title": "Compara y decide",
  "how.step3.desc":
    "Ventana de contexto usada, coste estimado por petición y qué modelos admiten tu texto, en tarjetas, gráfico y tabla.",
  "how.badges.title": "Las insignias de precisión",
  "how.badges.intro": "Cada resultado muestra cómo se ha calculado:",
  "how.config.note":
    "Modelos, ventanas de contexto y precios viven en un único archivo de configuración (models.config.ts). Los precios están marcados como TODO hasta rellenarlos desde las páginas oficiales de cada proveedor: no se muestra ningún precio inventado.",

  // ── FAQ ─────────────────────────────────────────────────────────────────
  "faq.kicker": "FAQ",
  "faq.title": "Preguntas frecuentes",
  "faq.q1": "¿Mi archivo se sube a algún servidor?",
  "faq.a1":
    "No. La extracción de texto (PDF, DOCX, XLSX…) y el conteo de tokens ocurren íntegramente en tu navegador usando Web Workers. Puedes desactivar la red y la herramienta seguirá funcionando. Única excepción documentada: si activas el modo BYOK, el TEXTO ya extraído se envía a la API del proveedor correspondiente con tu propia key para obtener el conteo oficial — siempre con la insignia azul visible.",
  "faq.q2": "¿Qué es el conteo oficial (modo BYOK)?",
  "faq.a2":
    "BYOK (Bring Your Own Key): activas el modo en Ajustes, pegas tu API key de Anthropic o Google y, tras cada análisis, TokenLens consulta el endpoint público de conteo de tokens (count_tokens / countTokens) y sustituye la estimación 🟡 por el número oficial 🔵. Las keys viven solo en tu navegador (localStorage) y viajan únicamente al proveedor a través de un proxy sin estado que no las guarda. No funciona con imágenes (el conteo oficial solo cubre texto) y si una consulta falla, la tarjeta conserva su estimación.",
  "faq.q3": "¿Qué significa la insignia de cada resultado?",
  "faq.a3":
    "Verde (Exacto): se ha ejecutado el tokenizador real en tu navegador (OpenAI, y Llama/Mistral/DeepSeek/Qwen si activas los tokenizadores HF en Ajustes). Azul (Oficial): conteo devuelto por la API del proveedor con tu key (Anthropic y Google en modo BYOK). Ámbar (Estimado): aproximación por ratio de caracteres ajustada por idioma y tipo de contenido (resto de modelos).",
  "faq.q7": "¿Qué son los tokenizadores locales exactos (HF)?",
  "faq.a7":
    "Los modelos abiertos (Llama 4, Llama 3.3, Mistral Medium/Large 3, DeepSeek V4/V4.1, Qwen 3/3.6/3.8) publican su tokenizador oficial en Hugging Face. Al activar el modo en Ajustes, TokenLens descarga ese tokenizer.json (6–28 MB por familia, una sola vez: queda cacheado en el navegador) y ejecuta el mismo BPE byte-level que el modelo, con los conteos verificados contra la implementación de referencia. El texto nunca se envía a ningún servidor: solo se descarga el archivo del tokenizador desde la CDN de Hugging Face. Si la descarga falla o estás sin conexión, esos modelos vuelven a la estimación 🟡.",
  "faq.q4": "¿Por qué el conteo estimado difiere del real?",
  "faq.a4":
    "Cada proveedor usa su propio tokenizador y no todos son públicos. La estimación divide los caracteres entre un ratio típico del modelo (ajustado por idioma, código o JSON) y lo combina con el recuento de palabras. Suele desviarse menos del 10 %, pero trátalo como orientativo.",
  "faq.q5": "¿Cada cuánto se actualizan precios y ventanas?",
  "faq.a5":
    "El catálogo se actualizó en octubre de 2026 (GPT-5.5, Claude 5.x, Gemini 3.x, Grok 4.5…). Los precios solo se rellenan con datos corroborados por anuncios oficiales — el resto se muestra como «—» hasta verificarlos. Verifica siempre con la documentación oficial de cada proveedor antes de tomar decisiones de coste.",
  "faq.q6": "¿Qué límites tiene la herramienta?",
  "faq.a6":
    "Archivos de hasta 20 MB, con procesamiento por trozos para no congelar el navegador. PDFs escaneados sin capa de texto generan un aviso, y los formatos binarios no soportados muestran un error claro con la lista de formatos admitidos.",

  // ── Footer ──────────────────────────────────────────────────────────────
  "footer.tagline":
    "Calculadora de tokens multi-IA, sin registro y sin subidas.",
  "footer.local": "Procesamiento 100 % local",
  "footer.precision.title": "Precisión",
  "footer.link.how": "Cómo funciona",
  "footer.link.faq": "FAQ",
  "footer.precision.note":
    "Precios y ventanas en models.config.ts (TODO hasta verificar con fuentes oficiales).",
  "footer.providers.title": "Proveedores",
  "footer.providers.note":
    "Sin afiliación con ningún proveedor. Solo colores y nombres.",
  "footer.disclaimer":
    "Los precios y las ventanas de contexto cambian con frecuencia: verifica siempre la documentación oficial.",

  // ── Store (progreso, error de conteo y rechazos de archivos) ────────────
  "store.progress.counting": "Contando tokens…",
  "store.progress.done": "Análisis completado",
  "store.progress.preparing": "Preparando texto…",
  "store.error.count":
    "No se pudieron contar los tokens. Inténtalo de nuevo con un archivo más pequeño.",
  "store.rejected.format": "{name} (formato no admitido: {ext})",
  "store.rejected.size": "{name} (pesa {size}, límite 20 MB)",
  "store.rejected.limit": "{name} (límite de {n} archivos por análisis)",
};

export const CONTENT_EN: Record<string, string> = {
  // ── How it works ────────────────────────────────────────────────────────
  "how.kicker": "How it works",
  "how.title": "Three steps, zero servers",
  "how.subtitle":
    "TokenLens counts tokens in your browser with the real tokenizer whenever possible, and with a calibrated estimate for the rest.",
  "how.step1.title": "Upload or paste",
  "how.step1.desc":
    "Drag in a file (PDF, DOCX, XLSX, TXT, MD, code…) or paste text directly. Nothing ever travels to a server.",
  "how.step2.title": "We tokenize locally",
  "how.step2.desc":
    "We count tokens with the official tokenizer whenever a browser build exists (OpenAI: o200k_base and cl100k_base; Llama, Mistral, DeepSeek and Qwen: official Hugging Face BPE, opt-in in Settings) and with a ratio-based estimate for the rest. Web Workers keep the interface from freezing.",
  "how.step3.title": "Compare and decide",
  "how.step3.desc":
    "Context window usage, estimated cost per request and which models fit your text — in cards, chart and table.",
  "how.badges.title": "The precision badges",
  "how.badges.intro": "Every result shows how it was calculated:",
  "how.config.note":
    "Models, context windows and prices live in a single configuration file (models.config.ts). Prices stay marked as TODO until they are filled in from each provider's official pages: no invented price is ever shown.",

  // ── FAQ ─────────────────────────────────────────────────────────────────
  "faq.kicker": "FAQ",
  "faq.title": "Frequently asked questions",
  "faq.q1": "Is my file uploaded to any server?",
  "faq.a1":
    "No. Text extraction (PDF, DOCX, XLSX…) and token counting happen entirely in your browser using Web Workers. You can go offline and the tool will keep working. One documented exception: if you enable BYOK mode, the already-extracted TEXT is sent to the corresponding provider API with your own key to fetch the official count — always with the blue badge visible.",
  "faq.q2": "What is the official count (BYOK mode)?",
  "faq.a2":
    "BYOK (Bring Your Own Key): you enable the mode in Settings, paste your Anthropic or Google API key and, after every analysis, TokenLens queries the public token-counting endpoint (count_tokens / countTokens) and swaps the 🟡 estimate for the official number 🔵. Keys live only in your browser (localStorage) and travel exclusively to the provider through a stateless proxy that never stores them. It does not work with images (the official count covers text only), and if a query fails the card keeps its estimate.",
  "faq.q3": "What does the badge on each result mean?",
  "faq.a3":
    "Green (Exact): the model's real tokenizer ran in your browser (OpenAI, plus Llama/Mistral/DeepSeek/Qwen if you enable the HF tokenizers in Settings). Blue (Official): count returned by the provider API with your key (Anthropic and Google in BYOK mode). Amber (Estimated): character-ratio approximation adjusted for language and content type (all other models).",
  "faq.q7": "What are the exact local tokenizers (HF)?",
  "faq.a7":
    "Open-weight models (Llama 4, Llama 3.3, Mistral Medium/Large 3, DeepSeek V4/V4.1, Qwen 3/3.6/3.8) publish their official tokenizer on Hugging Face. When you enable the mode in Settings, TokenLens downloads that tokenizer.json (6–28 MB per family, once: cached by the browser) and runs the very same byte-level BPE as the model — with counts verified against the reference implementation. Your text is never sent anywhere: only the tokenizer file is fetched from the Hugging Face CDN. If the download fails or you are offline, those models fall back to the 🟡 estimate.",
  "faq.q4": "Why does the estimated count differ from the real one?",
  "faq.a4":
    "Every provider uses its own tokenizer and not all of them are public. The estimate divides characters by a typical ratio for the model (adjusted for language, code or JSON) and combines it with the word count. It usually deviates by less than 10 %, but treat it as a guideline.",
  "faq.q5": "How often are prices and context windows updated?",
  "faq.a5":
    "The catalog was last updated in October 2026 (GPT-5.5, Claude 5.x, Gemini 3.x, Grok 4.5…). Prices are only filled in with data corroborated by official announcements — everything else shows as “—” until verified. Always double-check each provider's official documentation before making cost decisions.",
  "faq.q6": "What limits does the tool have?",
  "faq.a6":
    "Files up to 20 MB, processed in chunks so the browser never freezes. Scanned PDFs without a text layer raise a warning, and unsupported binary formats show a clear error listing the accepted formats.",

  // ── Footer ──────────────────────────────────────────────────────────────
  "footer.tagline": "The multi-AI token calculator. No sign-up, no uploads.",
  "footer.local": "100 % local processing",
  "footer.precision.title": "Precision",
  "footer.link.how": "How it works",
  "footer.link.faq": "FAQ",
  "footer.precision.note":
    "Prices and context windows live in models.config.ts (TODO until verified against official sources).",
  "footer.providers.title": "Providers",
  "footer.providers.note":
    "Not affiliated with any provider. Just colors and names.",
  "footer.disclaimer":
    "Prices and context windows change frequently: always check the official documentation.",

  // ── Store (progress, counting error and file rejections) ────────────────
  "store.progress.counting": "Counting tokens…",
  "store.progress.done": "Analysis complete",
  "store.progress.preparing": "Preparing text…",
  "store.error.count":
    "The tokens could not be counted. Try again with a smaller file.",
  "store.rejected.format": "{name} (unsupported format: {ext})",
  "store.rejected.size": "{name} (weighs {size}, 20 MB limit)",
  "store.rejected.limit": "{name} (limit of {n} files per analysis)",
};
