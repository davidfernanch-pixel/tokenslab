# TokenLens — Worklog de desarrollo

Proyecto: calculadora de tokens multi-IA (Next.js 16 + TS + Tailwind 4 + shadcn/ui).
Spec completa del usuario en el primer mensaje (paleta, proveedores, fases MVP).

Decisiones clave:
- Todo el procesamiento de archivos ocurre en el navegador (Web Workers + extractores cliente).
- models.config.ts es la única fuente de verdad: modelos, ventanas de contexto, precios (TODO hasta que el usuario los rellene) y ratios de estimación.
- OpenAI = exacto en local (gpt-tokenizer, o200k_base / cl100k_base). Resto = estimado por ratio ajustado por idioma/contenido en V1.
- PDF worker servido desde /pdf.worker.min.mjs (copiado de pdfjs-dist/build a public/). postinstall lo mantiene sincronizado.

Estado: en construcción (fase inicial).

---
Task ID: 1
Agent: orchestrator (Z.ai Code)
Task: Explorar proyecto, instalar dependencias y crear la fundación de diseño

Work Log:
- Verificado dev server activo en puerto 3000 (HTTP 200).
- Instalados: gpt-tokenizer@4.0.0, pdfjs-dist@6.4.299, mammoth@1.13.0, xlsx@0.18.5.
- Copiado pdf.worker.min.mjs a public/ (worker de pdfjs como asset estático, robusto con Turbopack).
- globals.css: paleta completa dark (#0B0D12 fondo, #12151C tarjetas, #7C5CFF acento violeta) y light (#F7F8FA/#FFF/#6A45F0) según spec del usuario, colores por proveedor (--color-openai…--color-qwen), radius 12px, scrollbar custom, grid-pattern decorativo.
- layout.tsx: fuentes Inter + JetBrains Mono (next/font), ThemeProvider (next-themes, dark por defecto), Toaster (sonner), metadata en español, lang="es".
- Creado theme-provider.tsx e icon.svg (lupa violeta).

Stage Summary:
- Fundación de diseño lista. Siguiente: models.config.ts + tipos + libs core (estimador, coste, stats, export), extractores, worker, store; luego UI por subagentes (2-a chrome/contenido, 2-b análisis), ensamblado page.tsx y QA con agent-browser.

---
Task ID: 2-5
Agent: orchestrator (Z.ai Code)
Task: Fundamentos lógicos completos (config, tipos, libs, tokenizadores, worker, extractores, store)

Work Log:
- models.config.ts: 23 modelos en 8 proveedores. OpenAI exacto (o200k/cl100k), resto estimado con ratio por proveedor. Ventanas de contexto según documentación pública. TODOS los precios a null (TODO) — NO inventar. CURRENCIES con rate EUR null (TODO).
- lib/types.ts: Status, Progress, ModelResult, FileStats, FitInfo, ExtractResult, AnalysisMeta, MAX_FILE_SIZE (20MB), PRECISION_META (etiquetas/dotClasses/descripciones de insignias).
- lib/format.ts: formatNumber/Compact/Bytes/Cost/PricePerM/Percent/Window/Ms en es-ES.
- lib/cost.ts: fitsContext, calcCost (null si precio TODO), canCalcCost, usageTone (ok <75 / warn <100 / over).
- lib/stats.ts: chars/words/lines/pages(≈500 palabras/página)/cjk.
- lib/export.ts: toCSV (';' + BOM), toJSON, toMarkdown, downloadBlob, copyToClipboard con fallback.
- lib/sample.ts: texto de ejemplo mezcla español+código+JSON.
- lib/tokenizers/estimate.ts: estimador con detección de idioma (es/en), contenido (prose/code/json), CJK por segmentos, blend 0.65 chars/ratio + 0.35 palabras·tokensPorPalabra.
- lib/tokenizers/count.ts: núcleo compartido worker/hilo principal. Agrupa modelos por tokenizador (una sola codificación por grupo), carga perezosa gpt-tokenizer, troceado 500k chars con progreso.
- lib/tokenizers/client.ts: TokenizerClient con Web Worker + fallback automático a hilo principal si el worker falla.
- src/workers/tokenizer.worker.ts: worker module con protocolo {id, event}.
- lib/extractors/: text.ts (UTF-8→windows-1252 fallback, detección binario), pdf.ts (pdfjs-dist + worker desde /pdf.worker.min.mjs, aviso PDF escaneado), docx.ts (mammoth.browser), xlsx.ts (SheetJS→csv por hoja), index.ts (dispatcher por extensión + ACCEPT_ATTRIBUTE + mensajes de error ES).
- src/types/mammoth.browser.d.ts: declaración de tipos.
- lib/store.ts: Zustand + persist (activeModels, outputTokens, currency en localStorage). analyzeFile/analyzeText con fases extracting→counting→done, resultados incrementales (model-done), codeHint para estimador, selectActiveResults.

Stage Summary:
- Toda la lógica de negocio lista y tipada. Contrato para la UI: useTokenLens (store), MODELS/PROVIDERS/CURRENCIES, PRECISION_META, calcCost/fitsContext/usageTone, format*, export*, SAMPLE_TEXT, ACCEPT_ATTRIBUTE/SUPPORTED_FORMATS_HINT.
- Se cuentan TODOS los modelos siempre (rápido); activeModels filtra la visualización → toggle instantáneo.
- Pendiente: agentes 2-a (Header/Hero/HowItWorks/Faq/Footer) y 2-b (Dropzone/PasteDialog/FileStatsBar/PrecisionBadge/ResultCard/CompareChart/ModelTable/ExportMenu/SettingsPanel/OutputTokensControl/useAnimatedNumber), luego ensamblado page.tsx.

---
Task ID: 2-a
Agent: frontend-styling-expert
Task: Componentes de chrome y contenido (Header, ThemeToggle, Hero, HowItWorks, Faq, Footer)

Work Log:
- Leído worklog, globals.css, models.config.ts y primitivas shadcn (button, badge, card, accordion) para verificar tokens y API disponibles; comprobado que sonner exporta toast.info y lucide-react BarChart3 (v0.525).
- ThemeToggle.tsx ("use client"): placeholder <span h-9 w-9> hasta montar (evita mismatch de hidratación), Sun/Moon superpuestos con rotate-90/scale-0 + transition-transform duration-300, aria-label y sr-only "Cambiar tema". Iconos con size-4.5 para no chocar con la regla [&_svg]:size-4 del Button.
- Header.tsx ("use client"): sticky top-0 z-50 con backdrop-blur y supports-[backdrop-filter]; logo con SVG de lupa inline sobre tile con gradiente de marca, wordmark TokenLens + Badge "beta" (oculto en móvil); nav ancla a #como-funciona y #faq (solo md+); selector de idioma ES/EN tipo píldora con aria-pressed y toast.info al pulsar EN; ThemeToggle al extremo. Decisión: EN cambia el estado local (se marca activo) y muestra el toast informativo, ya que la UI sigue en español.
- Hero.tsx (server, sin hooks): fondo grid-pattern con máscara radial, chip de privacidad con Lock text-success, H1 con gradiente from-[#7C5CFF] to-[#9479FF] ({" "} tras "texto" para que no se pegue cuando el <br> está oculto en móvil), subtítulo y 3 chips de confianza (ShieldCheck/Zap/BarChart3) con {MODELS.length} y el 8 en font-mono tabular-nums.
- HowItWorks.tsx (server): kicker + h2 "Tres pasos, cero servidores", grid md:grid-cols-3 con Cards numeradas 01/02/03 (font-mono text-primary) e iconos Upload/Cpu/BarChart3 en tile bg-primary/10; subsección "Las insignias de precisión" con dots bg-success / bg-google / bg-warning y nota final sobre models.config.ts y precios TODO en bg-surface-elevated.
- Faq.tsx (server): Accordion single collapsible con 5 preguntas (privacidad, insignias, desviación de la estimación, actualización de precios, límites), triggers text-left text-[15px] font-medium.
- Footer.tsx (server): mt-auto (sticky footer) + border-t bg-card/50; grid 1.5fr/1fr/1fr con marca (mismo tile/SVG del Header), enlaces de precisión y lista de los 8 proveedores en PROVIDER_ORDER con dot de color desde PROVIDERS[p].color; fila inferior con disclaimer y "TokenLens · {año}" en font-mono.
- Verificado con bunx tsc --noEmit: 0 errores en los 6 archivos nuevos (los 7 errores del proyecto son preexistentes en examples/, skills/ y libs de la fase 2-5, sin relación).

Stage Summary:
- 6 componentes de chrome/contenido creados con exports nombrados: { Header }, { ThemeToggle }, { Hero }, { HowItWorks }, { Faq }, { Footer } desde @/components/*. Listos para importar en page.tsx.
- Contrato para el ensamblador: Header arriba (sticky, incluye ThemeToggle), Hero sin dropzone (la página coloca la Dropzone justo debajo), secciones con id="como-funciona" e id="faq" + scroll-mt-20, Footer con mt-auto (requiere wrapper flex-col min-h-screen).
- Sin dark: manuales (todo vía tokens), números en font-mono tabular-nums, todo el texto en español, sin emojis, accesibilidad con aria-label/aria-pressed/sr-only en controles de icono.

---
Task ID: 2-b
Agent: frontend-styling-expert
Task: UI de análisis (Dropzone, PasteDialog, FileStatsBar, PrecisionBadge, ResultCard, CompareChart, ModelTable, ExportMenu, SettingsPanel, OutputTokensControl, useAnimatedNumber)

Work Log:
- Leído el worklog y el contrato completo: store.ts (useTokenLens + selectActiveResults), models.config.ts (MODELS/PROVIDERS/PROVIDER_ORDER/CURRENCIES/getModel), types/format/cost/export/sample/extractors, y los componentes shadcn disponibles (tooltip incluye TooltipProvider interno, sheet, dialog, dropdown-menu, select, slider, checkbox, progress, separator, table, alert, badge, label, textarea). Verificado recharts 2.15.4 y framer-motion 12 en package.json y los tipos de recharts (tickFormatter, Tooltip content/cursor, LabelList formatter: Function) en node_modules.
- src/hooks/useAnimatedNumber.ts: rAF + easeOutExpo, anima 0→target al montar y valor-actual→nuevo si cambia; respeta prefers-reduced-motion (matchMedia dentro del efecto, seguro en SSR); cleanup con cancelAnimationFrame; devuelve Math.round.
- src/components/PrecisionBadge.tsx: chip redondeado con dot (PRECISION_META.dotClass) + label; tonos exact=success / official=google / estimated=warning; tamaños sm/md; TooltipProvider+Tooltip con la descripción de la precisión (max-w-52).
- src/components/PasteDialog.tsx: Dialog controlado (sm:max-w-2xl) con textarea mono rows 14, stats en vivo (caracteres/palabras es-ES), Ctrl/Cmd+Enter para analizar, trigger Button outline con stopPropagation (vive dentro de la dropzone clicable).
- src/components/Dropzone.tsx: zona clicable/dropeable (role=button, tabIndex, Enter/Espacio, foco visible); drag&drop con anti-flicker (relatedTarget/contains); input file oculto con ACCEPT_ATTRIBUTE y reset de value; 3 estados animados con AnimatePresence mode="wait" (idle con tile gradiente violeta + PasteDialog + ejemplo + chip privacidad; extracting/counting con Loader2 + Progress + %; done compacto horizontal con Cambiar archivo / Quitar); Alerts de error (destructive) y warning (border-warning/40) bajo la zona; icono de warning con text-warning! (sintaxis important de Tailwind v4, necesario para ganar al [&>svg]:text-current del Alert).
- src/components/FileStatsBar.tsx: card con bloque de archivo (tile, nombre truncable, bytes), Separator vertical (h-10! importante) y grid-cols-3→sm:flex con Caracteres/Palabras/Líneas/Páginas ≈/Caracteres-token (media de tokens de los modelos activos, "—" sin datos); números font-mono tabular-nums.
- src/components/ResultCard.tsx: motion.div (fade/slide, aria-label "modelo: N tokens", role article) + card con borde por estado (destructive si no cabe + barra roja superior), dot y label de proveedor, PrecisionBadge sm, número 4xl animado con useAnimatedNumber, barra de uso con tone ok/warn/over, meta ventana/restante-exceso/coste (con tooltip "precios pendientes" cuando calcCost devuelve null), pie con chip Cabe/No cabe y ms del conteo.
- src/components/CompareChart.tsx: BarChart vertical de recharts ordenado asc, celdas coloreadas por proveedor (hex de PROVIDERS), LabelList con formatCompact en JetBrains Mono, tooltip custom (bg-popover) y leyenda solo con proveedores presentes (orden PROVIDER_ORDER); altura dinámica max(160, n·38+40).
- src/components/ModelTable.tsx: tabla ordenable por 9 claves (name/provider/tokens/window/usage/priceIn/priceOut/cost/fits) con aria-sort, iconos Chevron/ArrowUpDown y th enfocables (Enter/Espacio); filas con dot de proveedor, tokens+PrecisionBadge, mini-barra de uso, precios "—" con tooltip TODO (null siempre al final al ordenar), coste con tooltip de desglose entrada+salida, chip ¿Cabe?; wrapper overflow-x-auto custom-scrollbar y min-w-[880px].
- src/components/ExportMenu.tsx: DropdownMenu con trigger outline (texto oculto en móvil); construye ExportPayload vía selectActiveResults+getModel+fitsContext+calcCost en useMemo; CSV/JSON con downloadBlob y slug del nombre de archivo; Markdown vía copyToClipboard + toast de sonner; sin resultados muestra items deshabilitados + hint "Analiza algo primero".
- src/components/SettingsPanel.tsx: Sheet lateral (w-full sm:max-w-md, scroll custom, gap-0) con contador activos/total en Badge mono; grupos por PROVIDER_ORDER con checkboxes + dot de precisión (title con descripción) y contador por grupo; botón Restaurar (DEFAULT_ACTIVE_MODELS); Select de moneda USD/EUR con aviso cuando EUR.rate es null y currency=EUR; nota final aclarando que solo se filtra la visualización.
- src/components/OutputTokensControl.tsx: slider 0–32768 step 64 con valor mono a la derecha y presets pill (0/256/1024/4096/16384) con estado activo violeta (variant secondary + overrides) y aria-pressed.
- Revisiones de calidad: hooks siempre antes de cualquier early-return (ResultCard, CompareChart, ModelTable, FileStatsBar, ExportMenu); switch de orden con const local + default para TS estricto; stopPropagation en botones internos de la dropzone y guard e.target!==e.currentTarget en su keydown; verificados imports sin usar y clases tw-merge (border-b en filas para no duplicar separadores con la base de shadcn).
- No se ha ejecutado dev/build/lint ni se han tocado otros archivos (page.tsx, store, libs).

Stage Summary:
- 11 archivos creados (10 componentes + 1 hook), todos "use client", en español y sin emojis, siguiendo el sistema de diseño (mono tabular-nums, radius 12, tokens de color, colores por proveedor).
- Desviaciones menores y justificadas: (1) filas de ModelTable usan border-b en lugar de border-t para no duplicar bordes con la base de TableRow de shadcn (mismo resultado visual); (2) sintaxis important de Tailwind v4 con sufijo (text-warning!, h-10!) en lugar del prefijo v3 de la spec; (3) claves de AnimatePresence semánticas (idle/busy/done) en vez de key={status} para evitar un flash entre extracting→counting; (4) presets de OutputTokensControl usan text-[11px] (la spec mencionaba también text-xs, contradictorio); (5) Dropzone en estado done añade min-h-0 para que el modo compacto no herede los 280 px de altura mínima.
- Costes: como priceInPerM/priceOutPerM y CURRENCIES.EUR.rate están a null, toda la UI muestra "—" con tooltips explicativos (ResultCard, ModelTable, aviso EUR en SettingsPanel), según lo previsto.
- Pendiente para el orquestador: ensamblar page.tsx (Dropzone → FileStatsBar → OutputTokensControl → grid de ResultCard → CompareChart → ModelTable con ExportMenu/SettingsPanel en la barra de acciones) y QA visual con agent-browser.

---
Task ID: 8-9
Agent: orchestrator (Z.ai Code)
Task: Ensamblado de page.tsx, pulido y QA end-to-end con agent-browser

Work Log:
- Agentes 2-a y 2-b completaron 17 componentes siguiendo el contrato (sin tocar archivos ajenos).
- page.tsx ensamblado: Header → Hero → Dropzone (max-w-3xl) → panel de resultados (max-w-6xl): FileStatsBar, toolbar (contador + Ajustes + Exportar), banner de precios TODO (ámbar, solo si ningún modelo activo tiene precios), OutputTokensControl, grid de ResultCards (sm:2 / xl:3) con skeletons durante el conteo, estado "sin modelos visibles", CompareChart, ModelTable → HowItWorks → Faq → Footer. Wrapper flex min-h-screen + footer mt-auto (sticky footer).
- Corregidos errores TS: pdfjs v6 (loadingTask.destroy() en vez de doc.destroy, sin isEvalSupported), re-export de Precision en types.ts.
- Lint: añadidas ignores (public/** con el pdf.worker minificado, download, db, mini-services); ThemeToggle migrado a useSyncExternalStore (sin setState en efecto); useAnimatedNumber aplaza el setValue síncrono a rAF. Resultado: `bun run lint` = 0 errores, 0 warnings.
- next.config.ts: allowedDevOrigins ["*.space-z.ai", "*.z.ai"] (aviso de cross-origin del preview).
- Pulido tras feedback VLM: botón "Quitar archivo" agrandado a 40x40 (touch target), tickFormatter del eje Y del gráfico con espacio no separable ("DeepSeek-V3.1 (chat)").
- QA agent-browser (desktop 1280 + móvil 390): carga OK; ejemplo → 329 tokens exactos (o200k en worker) + estimaciones; subidas reales test.txt (37 tokens exactos), test.pdf (12, pdfjs con worker local), test.docx (22, mammoth), test.xlsx (30, SheetJS); ajustes (checkbox elimina tarjeta al instante, persiste en localStorage); tema claro/oscuro OK; diálogo pegar texto con contador en vivo + Ctrl+Enter; exportar → "Markdown copiado al portapapeles" (toast); móvil 1 columna sin scroll horizontal; consola sin errores ni warnings (worker usado, no fallback); dev.log limpio.
- QA visual con VLM (glm-5v) sobre 6 capturas: homepage impecable, tarjetas/gráfico/tabla consistentes (falsa alarma de mismatch verificada contra DOM: datos idénticos), móvil correcto, modo claro correcto.

Stage Summary:
- MVP V1 completo y verificado en navegador: Fase 1 (dropzone + texto + OpenAI exacto + estimaciones + tarjetas y tabla) Y Fase 2 (PDF/DOCX/XLSX, gráfico, exportar) del roadmap del usuario.
- Puntos fuertes: privacidad real (todo local), worker con fallback, resultados incrementales, badges de precisión, precios TODO sin inventar (la UI lo comunica con claridad).
- Pendiente para próximas fases (cron webDevReview): BYOK con /api/count (Anthropic count_tokens, Gemini countTokens), tokenizadores HF locales (llama/mistral/deepseek/qwen), visualizador de tokens, divisor por chunks, multiarchivo, imágenes, optimizador, calculadora mensual, historial, i18n ES/EN (el toggle EN ya existe con toast).
