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

---
Task ID: 10 (Fase 3 — núcleo)
Agent: orchestrator (Z.ai Code)
Task: QA baseline + libs core de Fase 3 (segments, chunker, optimizer, history, monthly) + protocolo worker extendido

Work Log:
- QA baseline con agent-browser + VLM (glm-5v): homepage sin errores de consola ni de página; análisis de ejemplo OK (14 tarjetas, gráfico, tabla); solo sugerencias de pulido visual (borde dropzone sutil, jerarquía de botones, contraste de formatos, fade del grid).
- Decisión de foco: MVP estable → avanzar Fase 3 del roadmap del usuario con features 100% cliente: visualizador de tokens, optimizador, divisor de fragmentos, historial local y calculadora mensual.
- lib/tokenizers/segments.ts: buildTokenSegments() — encode o200k + decodificación por id único cacheada + cursor con re-sincronización multi-byte (fusiona tokens si un carácter UTF-8 quedó partido). TokenSegment {id, text, tokens, start, end}. Probado: pérdida cero con acentos/CJK/emoji.
- lib/chunker.ts: packSegments() empaquetado voraz por tokens con overlap (protección de progreso), normalizeChunkOptions, chunkStats, chunkFileBase. Probado: solapamiento correcto.
- lib/optimizer.ts: 5 sugerencias (minify-json, strip-comments solo código/línea completa, collapse-blank-lines, trim-trailing, collapse-spaces solo prosa) con risk safe/review, applySuggestions con orden estable, estimateSavings (ratio 4, 🟡). Probado con JSON y código.
- lib/history.ts: localStorage "tokenlens-history", máx 24 entradas, texto guardado ≤512KB, deduplicado por firma, loadHistory/addHistoryEntry/removeHistoryEntry/clearHistory con validación.
- lib/monthly.ts: MonthlyUsage + calcMonthlyProjection (reusa calcCost → null con precios TODO, sin inventar).
- workers/tokenizer.worker.ts: protocolo extendido con kind "count" (default, retrocompatible) | "segments" | "chunks".
- lib/tokenizers/client.ts: nuevos métodos segments() y chunks() con worker + fallback a hilo principal y progreso.
- store.ts: añadido codeHint al estado (no persistido) y grabación de historial al terminar un análisis (try/catch, opcional).
- tsc --noEmit: 0 errores nuevos (solo preexistentes en examples/ y skills/).

Stage Summary:
- Contrato para los agentes de UI: tokenizerClient.segments(text, maxTokens?, onProgress?) → SegmentsResult{segments,totalTokens,truncated,ms}; tokenizerClient.chunks(text,{chunkTokens,overlapTokens},maxTokens?,onProgress?) → {chunks,segments}; buildSuggestions(text,isCode)/applySuggestions(text,ids,isCode)/estimateSavings(before,after); loadHistory/addHistoryEntry/removeHistoryEntry/clearHistory + HistoryEntry; calcMonthlyProjection(model,usage,currency)/normalizeUsage/DEFAULT_MONTHLY_USAGE; store añade codeHint. Patrones de botón toolbar: Button outline + icono h-4 w-4 + span hidden sm:inline.
- Siguientes: agentes 3-a (TokenVisualizer + OptimizerPanel), 3-b (ChunkSplitter + HistoryPanel + MonthlyCalculator), 3-c (pulido visual de existentes); luego ensamblado en page.tsx y QA final.

Stage Summary:
- MVP V1 completo y verificado en navegador: Fase 1 (dropzone + texto + OpenAI exacto + estimaciones + tarjetas y tabla) Y Fase 2 (PDF/DOCX/XLSX, gráfico, exportar) del roadmap del usuario.
- Puntos fuertes: privacidad real (todo local), worker con fallback, resultados incrementales, badges de precisión, precios TODO sin inventar (la UI lo comunica con claridad).
- Pendiente para próximas fases (cron webDevReview): BYOK con /api/count (Anthropic count_tokens, Gemini countTokens), tokenizadores HF locales (llama/mistral/deepseek/qwen), visualizador de tokens, divisor por chunks, multiarchivo, imágenes, optimizador, calculadora mensual, historial, i18n ES/EN (el toggle EN ya existe con toast).

---
Task ID: 3-a
Agent: frontend-styling-expert
Task: TokenVisualizer + OptimizerPanel

Work Log:
- Leído el worklog (contratos de fases 2-5/2-a/2-b/8-9/10) y los archivos de referencia: globals.css (tokens), PrecisionBadge (patrón TooltipProvider+Tooltip), ExportMenu/PasteDialog (patrón botón toolbar outline + diálogo), store.ts (text/status/codeHint/fileName/analyzeText), tokenizers/client.ts (segments con onProgress), optimizer.ts (buildSuggestions/applySuggestions/estimateSavings/SuggestionId), format.ts, segments.ts (TokenSegment/SegmentsResult), SettingsPanel (patrón label htmlFor + Checkbox) y primitivas dialog/progress/alert/checkbox/tooltip. Verificados los iconos lucide (Eye, WandSparkles, RefreshCw, CircleCheck) en el paquete instalado.
- src/components/TokenVisualizer.tsx ("use client"): trigger outline con Eye + tooltip solo en disabled (span envolvente inline-flex para que el hover funcione con el botón deshabilitado, patrón PrecisionBadge); Dialog sm:max-w-3xl "Tokens al detalle". Al abrir (texto no vacío) llama tokenizerClient.segments(text, 4000) con estado idle|loading|ready|error, Progress desde onProgress y etiqueta "Tokenizando…"; runId (ref) invalida ejecuciones huérfanas al cerrar/cambiar texto y el efecto limpia segments al cerrar (reabrir recalcula). Fila de stats al estar ready: total de tokens (formatNumber mono tabular), media de caracteres por token (suma de longitudes de segmento ÷ tokens de segmento, 1 decimal es-ES), ms (formatMs) y PrecisionBadge exact sm. Chips inline con paleta cíclica de 4 colores (primary/success/warning/rose-500 al 15% con borde al 30%), title "token {id} · {n} car.", espacios · / saltos ⏎ / tabuladores ⇥ visibles, chips de solo espacio en text-muted-foreground; contenedor role="group" aria-label="Vista de tokens" con max-h-[55vh] custom-scrollbar bg-surface-elevated/50. Leyenda bajo los stats, aviso ámbar (border-warning/40 bg-warning/10) si truncated con totales en mono, Alert destructive si falla. useMemo para la lista de chips y la media; hooks antes de cualquier render condicional.
- src/components/OptimizerPanel.tsx ("use client"): trigger outline con WandSparkles + tooltip en disabled igual que arriba; Dialog sm:max-w-2xl "Optimizador de tokens" con descripción que usa la palabra "estimado" + PrecisionBadge estimated sm inline (sin emoji). Informe buildSuggestions(text, codeHint) en useMemo (instantáneo, sin worker) y selección por defecto = todas las aplicables, modelada como estado de desmarcadas (deselected) que se restaura al cerrar → sin flash de "Nada seleccionado" al abrir. Filas label htmlFor+Checkbox (patrón SettingsPanel): título + descripción y columna derecha con "+X car." en text-success mono, formatPercent muted y píldora Seguro (success) / Revisar (warning); no aplicables: checkbox disabled, fila opacity-50 y "—" a la derecha. Resumen en vivo (aria-live) con applySuggestions+estimateSavings: "Texto: X → Y caracteres" y "Ahorro ≈ N tokens (−P %)" en mono tabular + badge estimated, o "Nada seleccionado" en neutro. Estado vacío (sin aplicables) con CircleCheck text-success y "Tu texto ya está compacto…". Botón primario "Aplicar y volver a analizar" (RefreshCw) deshabilitado sin ahorro: analyzeText(optimized, "{fileName ?? 'texto'} (optimizado)") + toast.success de sonner y cierre; el diálogo también se cierra solo si el texto queda vacío. Nota final sobre análisis como texto pegado e historial local. Lista con max-h-[45vh] custom-scrollbar para pantallas bajas.
- Verificación: `bunx tsc --noEmit` → 0 errores de los dos archivos nuevos; solo persisten los 4 preexistentes en examples/ y skills/. No se ha tocado ningún otro archivo, ni dev server, ni lint.

Stage Summary:
- Exports: { TokenVisualizer } desde @/components/TokenVisualizer y { OptimizerPanel } desde @/components/OptimizerPanel, ambos "use client", listos para la toolbar de resultados junto a ExportMenu/SettingsPanel (patrón botón outline + icono h-4 w-4 + texto oculto en móvil).
- Decisiones: (1) report del optimizador se calcula con useMemo gated por `open` (deps [open, text, codeHint]) en vez de solo [text, codeHint]: evita 5 pasadas regex sobre textos de hasta 20 MB en cada análisis con el diálogo cerrado; comportamiento idéntico con el diálogo abierto; (2) selección de sugerencias como "desmarcadas" derivada de las aplicables (default: todas marcadas) para que el primer render tras abrir ya muestre el resumen correcto sin estado intermedio; (3) chips con display inline exacto de la spec (m-0.5, whitespace-pre-wrap, leading-6) y 4º color rose-500 (único hex permitido); (4) runId para cancelar tokenizaciones huérfanas del visualizador.
- Desviaciones menores: (a) el aviso de truncado usa formatNumber(4000) → "4.000" (número es-ES consistente con el resto de la UI) en lugar del literal "4 000"; (b) el pie del OptimizerPanel añade un botón secundario "Cancelar" (patrón de PasteDialog) además del primario exigido; (c) el contenedor de tokens lleva role="group" para que su aria-label sea válido en ARIA; (d) la etiqueta de la media se muestra compacta como "car./token de media".
- Siguientes: agente 3-b (ChunkSplitter + HistoryPanel + MonthlyCalculator) y 3-c (pulido), luego ensamblado en page.tsx (toolbar: Visualizar tokens + Optimizar + Ajustes + Exportar) y QA final.

---
Task ID: 3-c
Agent: frontend-styling-expert
Task: Pulido visual de componentes existentes

Work Log:
- globals.css (SOLO aditivo al final): `.shadow-glow` (resplandor suave de primario vía color-mix oklab), `@keyframes pulse-soft` (opacidad 0.6→1) + `.animate-pulse-soft` (2s ease-in-out infinite alternate) con `animation: none` bajo prefers-reduced-motion. Desviación documentada: se usa `var(--primary)` en lugar de `var(--color-primary)` porque se verificó en el CSS compilado (.next/dev) que `@theme inline` NO emite `--color-primary` como variable CSS real; el token raíz es consciente de tema y produce el mismo valor en oscuro/claro. No se añadió `.card-hover` (solo ResultCard usa lift → sin repetición que reducir).
- Dropzone.tsx: raíz con `group` + presencia mayor (idle `bg-card/70` → hover `bg-card` + `hover:border-primary/60`); drag-over `border-primary bg-primary/10 shadow-glow` (antes `bg-accent/40`); estado done con `border-solid!` (borde sólido en modo compacto, important sufijo v4). Tile del icono con `motion-safe:transition-transform` + `group-hover:scale-110` en idle y `scale-125 rotate-3 animate-pulse-soft` durante el arrastre (ternario exclusivo para que el estado drag gane al group-hover). Lista de formatos: chips mono (`rounded-md border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px]`) generados con `SUPPORTED_FORMATS_HINT.split(" · ")` (mismo texto, presentation distinta; sin cambios de aria). Botón "Probar con un ejemplo" claramente terciario: `text-muted-foreground hover:text-foreground` ("Pegar texto" ya era outline/secondary — archivo intocable).
- Hero.tsx: grid-pattern con `opacity-70` + overlay decorativo `pointer-events-none aria-hidden` de degradado `from-transparent to-background` en la mitad inferior → el grid ya no compite con la dropzone justo debajo (tokens, funciona en ambos temas).
- ResultCard.tsx: hover lift con `motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg` + sombra tintada `motion-safe:hover:shadow-primary/10` (cabe) / `shadow-destructive/10` (no cabe); se conserva el `group` y el `motion.div` de framer-motion intacto; hover de borde preexistente (`hover:border-primary/40`) se mantiene.
- CompareChart.tsx: `radius={[0,6,6,0]}` en Bar (adaptación del [6,6,0,0] pedido a layout vertical: cabezas de barra redondeadas, tipado tupla intacto); `strokeOpacity={0.6}` en CartesianGrid (grid más tenue); cursor del Tooltip con lavado primario `color-mix(in srgb, var(--primary) 7%, transparent)` (feedback de hover claro y de marca).
- ModelTable.tsx: fila de cabecera con `border-b-2!` (importante para ganar al `[&_tr]:border-b` de la base shadcn) + banda `bg-muted/30 hover:bg-muted/30` → separación de cabecera más nítida; filas del cuerpo `hover:bg-muted/40`; aria-sort, orden y th enfocables intactos.
- FileStatsBar.tsx: etiquetas con `font-medium` (ya cumplían uppercase/tracking-wider/text-[10px]/text-muted-foreground; valores ya eran font-mono tabular-nums — hallazgo del VLM ya cubierto, se reforzó la escaneabilidad).
- Header.tsx: enlaces de nav con subrayado de marca creciente vía `::after` (h-0.5 rounded-full bg-primary, `origin-left scale-x-0 → hover:after:scale-x-100`, también `focus-visible:after:scale-x-100` para teclado) con `motion-safe:after:transition-transform`; `after:pointer-events-none`; texto `hover:text-foreground` conservado.
- Verificación: `bunx tsc --noEmit | grep -v "examples/\|skills/"` → vacío (0 errores de los archivos tocados; solo persisten los 4 preexistentes en examples/ y skills/). Sin cambios de lógica, props, handlers, aria existentes ni textos; targets táctiles intactos; foco visible intacto en todos los controles.

Stage Summary:
- Pulido visual aplicado a los 7 componentes + globals.css: dropzone con estados de arrastre/hover tangibles (glow, escala y latido del icono, chips de formatos escaneables, jerarquía outline>ghost), grid del hero atenuado con transición limpia hacia la dropzone, ResultCard con lift + sombra tintada (motion-safe), barras del gráfico con radio mayor y grid tenue + cursor de hover de marca, cabecera de tabla más separada con hover de fila más suave, etiquetas de FileStatsBar más escaneables y nav con micro-subrayado animado.
- Utilidades nuevas: `.shadow-glow`, `.animate-pulse-soft` (+ `@keyframes pulse-soft`, con opt-out de movimiento reducido). Deviaciones: `var(--primary)` en `.shadow-glow` (verificado que `--color-primary` no se emite con `@theme inline`), radio [0,6,6,0] adaptado a barras horizontales, `.card-hover` omitido por falta de repetición, y "Pegar texto" ya era outline (jerarquía completada solo desde el botón del ejemplo).
- Pendiente para el orquestador: recompilar/QA visual (dropzone idle/drag/done, hover de tarjetas, hover de filas, subrayado del nav) y verificar contraste AA en los chips de formatos con el VLM.

---
Task ID: 3-b
Agent: frontend-styling-expert
Task: ChunkSplitter + HistoryPanel + MonthlyCalculator

Work Log:
- Leído worklog (tareas 2-5, 2-a, 2-b, 8-9, 10) y el contrato completo: store (useTokenLens), chunker (TextChunk/chunkStats/chunkFileBase), tokenizers/client (tokenizerClient.chunks con onProgress 0–100), history (loadHistory/removeHistoryEntry/clearHistory/MAX_HISTORY/MAX_STORED_TEXT), monthly (normalizeUsage/calcMonthlyProjection), models.config (MODELS/PROVIDERS/getModel), format (formatNumber/Compact/Bytes/Cost) y export (downloadBlob/copyToClipboard). Revisadas las primitivas shadcn disponibles (dialog, slider, select, input, label, alert, alert-dialog, progress, tooltip) y el patrón de trigger de toolbar de 2-b (Button outline + icono h-4 w-4 + span hidden sm:inline). Verificado jszip 3.10.2 en node_modules (dependencia transitiva de mammoth, con tipos propios index.d.ts, `export =`) y que todos los iconos lucide usados existen en v0.525.
- src/components/ChunkSplitter.tsx ("use client"): trigger outline deshabilitado salvo status==="done" con tooltip "Analiza un archivo o texto primero" (patrón PrecisionBadge: span tabIndex=0 envolviendo el botón disabled para que hover/focus disparen el tooltip; el tooltip solo se renderiza cuando está deshabilitado para no ensuciar el estado activo). Dialog sm:max-w-3xl con sliders Tokens por fragmento (128–4096/128, 1024) y Solapamiento (0–256/16, 64) con valor mono tabular alineado a la derecha (patrón OutputTokensControl: Label htmlFor + aria-label en el Slider); fila PrecisionBadge exact sm + nota; Alert ámbar si text > 1 000 000 caracteres (se trocean solo los primeros); botón Calcular con Scissors/Loader2-spin → tokenizerClient.chunks con runRef para invalidar cálculos huérfanos al cerrar; Progress + "Tokenizando y empaquetando…" + % mono; error → Alert destructive; tira de 4 stats (fragmentos/media/mín/máx con formatNumber) y lista max-h-[45vh] custom-scrollbar con tarjetas por fragmento (chip #001 violeta, tokens mono, rango de caracteres, preview line-clamp-2 con saltos colapsados a "⏎", botón copiar ghost con borde → copyToClipboard + toast); descargas .txt (separadores "───── Fragmento N (M tokens) ─────") y ZIP (import dinámico de jszip, un .txt por fragmento con índice padded a 3, generateAsync {type:"blob"}); vaciado inicial con hint Scissors; reset de resultados al cerrar y al cambiar controles.
- src/components/HistoryPanel.tsx ("use client"): trigger outline con History nunca deshabilitado; Dialog sm:max-w-xl que recarga loadHistory() en cada apertura (effect [open]); estado vacío centrado con FolderOpen; lista max-h-[60vh] custom-scrollbar con filas (tile FileText/Type en bg-primary/10, nombre truncable con title, sub-fila con tiempo relativo Intl.RelativeTimeFormat("es",{numeric:"auto"}) en min/horas/días, formatBytes, formatCompact chars, chip "N modelos"); detalles expandibles con ChevronDown (aria-expanded, rotación) que revela grid 2/3 col de mini-chips (dot de precisión 1.5 de PRECISION_META + nombre text-[10px] + tokens mono, máximo 9 + "+N más"); restaurar con RotateCcw (deshabilitado + tooltip "> 512 KB" si !hasText, mismo patrón de span) → analyzeText(entry.text, entry.name) + toast + cierre; eliminar con Trash2 ghost destructive → removeHistoryEntry + estado; footer con nota de límites (MAX_HISTORY/MAX_STORED_TEXT) y "Vaciar historial" destructive outline con AlertDialog de confirmación → clearHistory + toast.
- src/components/MonthlyCalculator.tsx ("use client"): trigger outline con Calculator; Dialog sm:max-w-lg cuyo cuerpo es un componente interno que se monta al abrir (Radix desmonta el contenido al cerrar) → prefills leídos del store en el momento de la apertura y formulario limpio en cada sesión. Select de los 23 MODELS con dot de proveedor (backgroundColor inline desde PROVIDERS) tanto en ítems como en el trigger (vía SelectValue), default = primer id válido de activeModels con fallback MODELS[0]; grid 1→2 col con 4 Inputs numéricos (solicitudes/día 100, días/mes 30 con max 31, tokens entrada prefill = tokens del resultado del modelo o 2 000, tokens salida prefill = outputTokens con guard Number.isFinite y fallback 1 000), valores como strings y parseo Number() con NaN absorbido por normalizeUsage; al cambiar de modelo se refresca el prefill de entrada desde el handler del Select (sin efectos); proyección en useMemo (calcMonthlyProjection + normalizeUsage) en tarjeta bg-surface-elevated rounded-xl: formatCompact de tokens in/out, formatNumber de solicitudes, coste en text-2xl mono tabular-nums o "—" con caja ámbar (border-warning/30 bg-warning/5, Info text-warning) que pide rellenar priceInPerM/priceOutPerM en src/lib/models.config.ts en code mono ("sin precios no se inventan costes") y nota al pie de estimación lineal.
- Verificación: `bunx tsc --noEmit` (filtrando examples/ y skills/) → 0 errores; el output completo son solo las 4 líneas preexistentes de examples/websocket y skills/. No se ha ejecutado dev/lint ni se ha tocado ningún otro archivo.

Stage Summary:
- 3 componentes creados con exports nombrados { ChunkSplitter }, { HistoryPanel }, { MonthlyCalculator } desde @/components/*, listos para colocarse en la toolbar junto a ExportMenu/SettingsPanel.
- Decisiones de UX documentadas: (1) al cambiar los sliders del divisor se descartan los resultados (en lugar de hint "ajustes cambiados"): nunca se muestran fragmentos calculados con otros parámetros y el recálculo es explícito; (2) el tooltip del trigger Fragmentar solo existe en estado deshabilitado (evita tooltips vacíos/ruido con Radix); (3) la calculadora usa componente interno montado al abrir para prefills frescos sin efectos; el refresh del prefill de entrada al cambiar modelo vive en el handler del Select (sin stale closures).
- Desviación técnica menor: para el ZIP, downloadBlob(blob, name) exigía un cast `as unknown as string` porque @/lib/export solo acepta string y no se podía modificar: en runtime new Blob([blob]) conserva los bytes intactos (Blob acepta Blobs como parte). jszip llega como dependencia transitiva de mammoth — conviene `bun add jszip` para blindar el import dinámico.
- Con precios a null, la calculadora muestra "—" + aviso ámbar (mismo criterio de no inventar del resto de la UI). Historial y divisor 100 % cliente.
- Pendiente para el orquestador: añadir los tres triggers a la toolbar de page.tsx y QA con agent-browser (móvil 390 incluido).

---
Task ID: 11 (Fase 3 — UI, ensamblado y QA final)
Agent: orchestrator (Z.ai Code)
Task: Integrar las 5 herramientas nuevas, pulir y QA end-to-end

Work Log:
- Agentes 3-a/3-b/3-c completados en paralelo: TokenVisualizer + OptimizerPanel, ChunkSplitter + HistoryPanel + MonthlyCalculator, pulido visual de 8 archivos existentes.
- jszip añadido como dependencia directa (bun add jszip@3.10.2; antes era transitorio de mammoth).
- page.tsx ensamblado: fila "Herramientas" (Visualizar tokens / Optimizar / Fragmentar) bajo la barra de resultados; Historial + Coste mensual como utilidades SIEMPRE visibles bajo la dropzone (accesibles sin resultados, p. ej. para restaurar un análisis tras recargar).
- Corregidos 2 errores de lint react-hooks/set-state-in-effect: TokenVisualizer (reset movido a handleOpenChange + estado de carga derivado de result/failed en vez de setState síncrono) y OptimizerPanel (mismo patrón; efecto eliminado).
- PrecisionBadge: TooltipContent con collisionPadding={16} + avoidCollisions (fix recorte de tooltips en bordes de diálogos, detectado por VLM).
- QA agent-browser completo: ejemplo → historial graba entrada (ejemplo.md, 23 modelos) con expand de resultados por modelo y Restaurar (re-analiza y repone panel); Visualizador → 329 tokens exactos, 3,7 car./token, chips coloreados con · y ⏎ visibles, badge Exacto; Optimizador → JSON pegado detecta Minificar +35 car. (28 %) + Colapsar espacios +13 car., "Aplicar y volver a analizar" → texto 125→90 car. re-analizado como "texto pegado (optimizado)"; Fragmentador → 128 tokens/64 overlap → 5 fragmentos (solapamiento correcto: [0–544] + [272–800]), copiar fragmento con toast, ZIP sin errores; Calculadora mensual → 3000 solicitudes, 987 K tokens entrada, coste "—" con aviso de precios TODO (sin inventar).
- QA responsive 390px: sin scroll horizontal en página, diálogos visualizador/historial correctos.
- QA modo claro: homepage, visualizador, historial y calculadora OK (violeta #6A45F0).
- QA VLM final (4 diálogos + luz + panel final): falso positivo de overflow en fragmentos refutado por medición DOM (0 elementos desbordados); segundo "X" era diálogo apilado del flujo de prueba; veredicto final del panel: "Ready for Launch".
- Verificaciones finales: bun run lint = 0 errores; tsc --noEmit = 0 errores nuevos; consola y page errors limpios; dev.log limpio.

Stage Summary:
- FASE 3 COMPLETA: visualizador de tokens, optimizador con vista previa de ahorro, divisor de fragmentos con overlap + descarga ZIP, historial local (24 entradas, restauración), calculadora de coste mensual, todo 100 % cliente y con insignias de precisión.
- Roadmap restante: BYOK (/api/count Anthropic+Gemini), tokenizadores HF locales (Llama/Mistral/DeepSeek/Qwen), multiarchivo, imágenes, comparación de archivos, i18n ES/EN real (el toggle ya existe con toast).
- Riesgos conocidos: el optimizador y el visualizador usan o200k (OpenAI) como referencia exacta — para el resto de proveedores el ahorro/visualización es representativo, no oficial; precios siguen TODO por decisión del usuario (la UI lo comunica).

---
Task ID: 12 (Fase 4 — núcleo multiarchivo + imágenes)
Agent: orchestrator (Z.ai Code)
Task: QA baseline + core de Fase 4: multiarchivo, tokens de imagen y extensión de historial

Work Log:
- QA baseline (agent-browser): página carga sin errores de consola/overlay; ejemplo → 23 tarjetas + tabla + badges (9 Exacto / 17 Estimado); Visualizador (329 tokens exactos), Optimizador, dev.log limpio. Fase 3 estable → se decide avanzar Fase 4 del roadmap del usuario: MULTIARCHIVO + IMÁGENES + COMPARACIÓN (todo 100 % cliente).
- types.ts: añadidos ImageInfo {width,height,mime}, AnalyzedFile {id,name,sizeBytes,kind:"text"|"image",text?,imageInfo?,previewUrl?,exactTokens?,code?,warning?}, ModelResult.textTokens?/imageTokens?, MAX_FILES=10.
- models.config.ts: ModelConfig.vision?:boolean marcado en 14 modelos con visión (gpt-5, gpt-4o, gpt-4o-mini, gpt-4.1, o3, gpt-4-turbo, claude-opus-4-1, claude-sonnet-4-5, claude-haiku-4-5, gemini-2.5-pro, gemini-2.5-flash, llama-4-maverick, llama-4-scout, grok-4). NADA de precios (siguen null).
- NUEVO lib/imageTokens.ts: 5 fórmulas DOCUMENTADAS (openai-750 min 85; openai-tiles-512 = 85+mosaicos×170 para gpt-4-turbo; anthropic-750; google-tiles-768 = máx(258, mosaicos×258); generic-750 para proveedores sin fórmula pública). imageFormulaForModel(model), estimateImageTokensFor(formula,image), estimateImageTokensForModel(model,images), IMAGE_FORMULAS con {label,description,documented,expression}.
- NUEVO lib/extractors/image.ts: isImageFile (png/jpg/jpeg/webp/gif/avif + image/* salvo svg), extractImageInfo vía createImageBitmap con fallback a HTMLImageElement; dimensiones leídas EN LOCAL.
- extractors/index.ts: ACCEPT_ATTRIBUTE + SUPPORTED_FORMATS_HINT ahora incluyen PNG · JPG · WEBP · GIF; isSupportedFile acepta imágenes; re-export isImageFile/IMAGE_EXTENSIONS.
- store.ts REESCRITO: files: AnalyzedFile[]; analyzeFiles(list, mode "replace"|"add") con validaciones por archivo (formato, 20 MB, MAX_FILES 10) y avisos de omitidos; analyzeFile = wrapper; analyzeText crea un AnalyzedFile sintético; removeFile(id) re-cuenta sin re-extraer (revoke de previewUrls); reset revoca previews. runCounting(files): texto = join("\n\n") de los archivos de texto, conteo POR ARCHIVO sumando por modelo (exacto honesto por documento), resultados progresivos durante el ÚLTIMO archivo, tokens de imagen añadidos a modelos vision (textTokens separado), imágenes-only soportado (textTokens 0). Historial graba fileCount/imageCount + textTokens/imageTokens por modelo.
- history.ts: HistoryResult.textTokens?/imageTokens?, HistoryEntry.fileCount?/imageCount? (retrocompatibles con entradas viejas).
- export.ts: CSV/JSON/Markdown incluyen columnas tokens_texto/tokens_imagen cuando hay imágenes; downloadBlob acepta string|Blob.
- Verificado: bunx tsc --noEmit = 0 errores (solo preexistentes examples/skills); bun run lint = 0/0.

Stage Summary:
- CONTRATO PARA AGENTES DE UI (Fase 4):
  * Store: useTokenLens expone files: AnalyzedFile[] (kind "text"|"image", imageInfo {width,height,mime}, previewUrl para <img src>, exactTokens para archivos de texto, code, warning), removeFile(id), analyzeFiles(list, "add"|"replace"), status/progress como antes. text = concatenación; results incluyen textTokens/imageTokens cuando hay imágenes.
  * lib/imageTokens: IMAGE_FORMULAS[id].{label,description,documented,expression}, imageFormulaForModel(model), estimateImageTokensForModel(model, images[]).
  * MODELS: model.vision → boolean | undefined. MAX_FILES = 10 en types.ts.
  * history: entradas con fileCount?/imageCount? y results con textTokens?/imageTokens?.
- Reparto: 4-a Dropzone multiarchivo + FileStatsBar con lista de archivos; 4-b ResultCard desglose texto/imagen + ImageTokensCard; 4-c CompareDialog + HistoryPanel; 4-d pulido visual (Hero, CompareChart, HowItWorks, Faq, Footer, ModelTable, globals.css). Ensamblado final y QA: orquestador (Task 13).

---
Task ID: 4-b
Agent: frontend-styling-expert
Task: ResultCard desglose texto+imagen + ImageTokensCard

Work Log:
- Leído el worklog completo (contratos de 2-b, 3-a, 3-c y 12) y los archivos de referencia: ResultCard y PrecisionBadge actuales (patrón tooltip + chips), store.ts (files/results con textTokens/imageTokens, selectActiveResults, revocación de previewUrls), imageTokens.ts (IMAGE_FORMULAS/imageFormulaForModel), models.config (vision?: boolean, PROVIDERS), types.ts (AnalyzedFile/ImageInfo/ModelResult), format.ts, page.tsx (cómo se consume ResultCard y cuándo se oculta el panel de resultados), globals.css (tokens, surface-elevated, warning/success) y eslint.config (@next/next/no-img-element off). Verificados los iconos lucide Type/Image/ImageOff/Lock en la v0.525 instalada.
- ResultCard.tsx (modificado, resto intacto: dot de proveedor, PrecisionBadge, número animado, barra de contexto, meta, coste, hover lift, aria-label original `${model.name}: ${result.tokens} tokens`):
  * Nueva prop opcional `index?: number` (default 0) usada solo como delay de entrada: `delay: Math.min(index * 0.045, 0.4)` en el transition del motion.div existente (initial opacity 0 / y 14 → animate idéntico). Retrocompatible: page.tsx actual no la pasa.
  * Selector nuevo `hasImages = useTokenLens(s => s.files.some(f => f.kind === "image"))` (booleano, snapshot estable) colocado con el resto de hooks ANTES del early-return de modelo desconocido.
  * Desglose bajo el número grande cuando `result.imageTokens != null`: fila text-xs muted con iconos Type e Image (h-3 w-3, aria-hidden), "Texto {n} · Imagen {n}" (cifras en font-mono tabular-nums) y punto ámbar (h-1.5 w-1.5 rounded-full bg-warning) junto a la cifra de imagen con title "tokens de imagen estimados por fórmula pública". El número grande sigue siendo el TOTAL (tokens).
  * Chip secundario en el pie (junto a Cabe/No cabe, dentro de un contenedor flex-wrap) cuando hay imágenes y el modelo NO tiene visión: ImageOff h-3 w-3 + "No admite imágenes" con rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground y title aclaratorio; la cifra de tokens se queda solo-texto.
  * Desglose guardado en constantes locales (`imageTokens`/`textTokens ?? 0`) tras el early-return para que TS estreche el tipo sin repetir `result.*` en el JSX.
- ImageTokensCard.tsx (NUEVO, "use client", export { ImageTokensCard }): null si no hay archivos de imagen o status idle/error (hooks siempre antes del early-return). Tarjeta rounded-xl border-border bg-card p-5 con role section + aria-label "Tokens de imagen".
  * Cabecera: tile violeta (h-9 w-9 rounded-lg bg-primary/10) con ImageIcon text-primary, título "Tokens de imagen", subtítulo "Estimados con las fórmulas públicas de cada proveedor" y PrecisionBadge estimated sm a la derecha.
  * Tira de imágenes (flex-wrap, gap-3): miniaturas h-14 w-14 rounded-lg object-cover border-border desde previewUrl (alt "{name}, {width} por {height} píxeles"), fallback con tile ImageIcon si falta previewUrl; bajo cada una, nombre truncado (max-w-14, text-[10px], title) y "{width}×{height} px" font-mono text-[10px] tabular-nums; figure/figcaption semánticos.
  * Rejilla de estimaciones (grid gap-3 sm:grid-cols-2 lg:grid-cols-3) para cada resultado ACTIVO (selectActiveResults) con vision && imageTokens != null: dot de proveedor (backgroundColor inline de PROVIDERS), nombre truncado, imageTokens en font-mono text-sm font-semibold tabular-nums y chip de fórmula (rounded-full border-border bg-surface-elevated px-2 py-0.5 text-[10px] text-muted-foreground) con IMAGE_FORMULAS[imageFormulaForModel(model)].label; envuelve de forma natural sin scroll.
  * Nota colectiva para modelos activos sin visión (en lugar de filas), con ImageOff h-3 w-3: "1 modelo sin soporte de imagen no lo cuenta (X)." / "{n} modelos sin soporte de imagen no los cuentan (A, B…)." con hasta 2 etiquetas de proveedor únicas y "…" solo si hay más de 2.
  * Pie: una línea por fórmula realmente usada (únicas por id, orden de aparición) "· {label}: {expresión}" a text-[10px] con la expresión en font-mono, y línea final de privacidad "Las imágenes se analizan en tu navegador: nunca salen de tu equipo." con Lock h-3 w-3 text-success.
  * Sin emojis, sin azules/índigos propios (solo colores de marca de proveedores en los dots), cifras mono tabular-nums y textos es-ES en línea con el sistema de diseño.
- Verificación: `bunx tsc --noEmit` → solo los 4 errores preexistentes de examples/websocket y skills/; 0 errores de los archivos tocados. No se ha ejecutado dev/lint ni se ha tocado ningún otro archivo.

Stage Summary:
- Exports: { ResultCard } (con `index?: number` opcional nuevo) desde @/components/ResultCard y { ImageTokensCard } desde @/components/ImageTokensCard, ambos "use client". El orquestador debe pasar index en page.tsx (`<ResultCard key={...} result={...} index={i} />`) para el escalonado y colocar <ImageTokensCard /> dentro del panel de resultados (p. ej. tras FileStatsBar o bajo la rejilla de tarjetas).
- Decisiones: (1) en ImageTokensCard se selecciona `s.files` (referencia estable) y se filtra kind==="image" en el render en vez del selector literal `s => s.files.filter(...)`: zustand v5 + React 19 exigirían cachear el snapshot (aviso "getSnapshot should be cached"/re-renders) con un array nuevo por notificación; el `.some()` de ResultCard devuelve booleano primitivo y se mantiene literal; (2) etiquetas diminutas de sección ("Imágenes (n)", "Por modelo de visión") en el estilo text-[10px] uppercase tracking-wider de FileStatsBar/page para escaneabilidad; (3) números del desglose y de la rejilla en font-mono tabular-nums (lenguaje de cifras del resto de la UI); (4) la nota de modelos sin visión lista etiquetas de proveedor únicas (máx. 2 + "…"), singular para n=1 y punto final para cerrar la frase como la línea de privacidad; (5) pie de ResultCard envuelto en contenedor flex-wrap con gap-2 y shrink-0 en los ms para que el chip nuevo nunca empuje la cifra (con un solo chip el render es idéntico al anterior); (6) title extra en el chip "No admite imágenes" (la spec solo lo pedía en el punto ámbar).
- Desviaciones menores: (a) selector de imágenes derivado en el render (justificado arriba, comportamiento observacional idéntico); (b) alt de la miniatura cae a solo el nombre si faltara imageInfo (el store siempre lo setea en imágenes válidas); (c) el card asume que vivirá dentro del panel de resultados, que page.tsx ya oculta durante "extracting" (cuando los previewUrl antiguos ya están revocados) — si se colocara fuera, conviene añadir también status "extracting" al null.
- Siguientes (orquestador, Task 13): pasar `index` a ResultCard desde page.tsx, montar ImageTokensCard en el panel y QA visual (desglose en modelos con visión, chip "No admite imágenes" en DeepSeek/Mistral/etc., tira de miniaturas, rejilla con chips de fórmula y pie con expresiones + Lock).

---
Task ID: 4-d
Agent: frontend-styling-expert
Task: Pulido visual Fase 4 (Hero, CompareChart, HowItWorks, Faq, Footer, ModelTable, globals.css)

Work Log:
- Leído el worklog completo (Task 3-c: motion-safe, patrón shadow-glow, var(--primary) en vez de var(--color-primary); Task 12: contrato Fase 4 con ModelResult.textTokens/imageTokens) y los 7 archivos objetivo más ui/accordion.tsx, ui/card.tsx, ui/table.tsx, types.ts, store.ts (textTokens/imageTokens se setean juntos cuando hay imágenes) y format.ts. Verificado en el dist de tailwindcss v4 el orden de registro de variantes: odd se registra antes que hover, por lo que hover:bg-muted/40 pinta después y gana sobre odd:bg-muted/20 al pasar el ratón (componen, no compiten).
- globals.css (SOLO aditivo al final, tras el bloque de pulse-soft): `@keyframes float-y` (0%/100% translateY(0), 50% translateY(-6px)) + `.animate-float-y` (float-y 6s ease-in-out infinite) con `animation: none` bajo prefers-reduced-motion; `.text-gradient-violet` (linear-gradient(90deg, var(--primary), #9479FF) con -webkit-background-clip/background-clip: text y color: transparent — var(--primary) consciente de tema según hallazgo de 3-c). Sin `alternate` porque el ciclo 0→-6→0 ya es simétrico y sin costura (alternate sería redundante).
- Hero.tsx: (1) degradado de marca en la palabra clave «tokens» del h1: `bg-gradient-to-r from-primary via-[#9479FF] to-primary bg-clip-text text-transparent`; se retiró el degradado previo de «en cada modelo de IA?» para dejar un único foco (dos degradados en el mismo titular diluían el énfasis), conservando el <br> y la tipografía. (2) Resplandor violeta flotante tras la insignia de privacidad y el titular: div absolute inset-x-0 top-14 mx-auto h-56 w-80 (sm: top-16 h-64 w-[30rem]) rounded-full bg-primary/10 blur-3xl + `animate-float-y`, pointer-events-none y aria-hidden; centrado con inset-x-0+mx-auto para no mezclar utilidades translate con el transform de la animación. (3) Chips de confianza con tiles de icono (h-6 w-6 shrink-0 rounded-md bg-primary/10, icono h-3.5 w-3.5 text-primary): ShieldCheck/Zap/BarChart3 conservados, aria-hidden movido al tile, gap-1.5→gap-2 por chip y gap-y-2→gap-y-3 en la fila para que respiren al envolver en móvil. Comentario de cabecera del componente actualizado.
- CompareChart.tsx: <defs> dentro del BarChart con un linearGradient por proveedor presente (`grad-{provider}`, x1=0 y1=0 x2=1 y2=0: color del proveedor stopOpacity 0.9 en la base → 0.35 en la punta, fundido a lo largo de la barra horizontal) y Cell fill={`url(#grad-${d.provider})`} (import Cell ya existía); se conservan radius [0,6,6,0], tickFormatter de ambos ejes, grid strokeOpacity 0.6, cursor wash primario, LabelList y leyenda intactos. El Tooltip ya era custom (bg-popover border-border rounded-lg, nombre font-semibold, tokens mono tabular): solo se sube shadow-md→shadow-lg.
- HowItWorks.tsx: tarjetas de paso con lift motion-safe (`motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1` + `hover:border-primary/30`, mismo patrón que ResultCard en 3-c; con movimiento reducido el borde cambia sin transición); número de paso «01/02/03» con `.text-gradient-violet` (degradado primary→#9479FF; conserva font-mono text-sm font-semibold tabular-nums); los iconos ya tenían tile violeta (h-10 w-10 rounded-lg bg-primary/10) → intactos. Tarjeta de insignias y nota informativa intactas.
- Faq.tsx: AccordionTrigger con `rounded-lg transition-colors hover:bg-muted/40` (tailwind-merge sustituye rounded-md y transition-all de la base); la rotación del chevron ya existía en ui/accordion ([&[data-state=open]>svg]:rotate-180 + transition-transform duration-200 en el icono) → no se duplica. Estructura, textos y tipografía intactos.
- Footer.tsx: hairline superior `h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent` (aria-hidden) como primer hijo del footer, SUSTITUYENDO el border-t (la spec permitía ambas; apilar dos líneas sería ruido); mt-auto del sticky footer intacto. Mención de privacidad promovida a chip: párrafo «Calculadora de tokens multi-IA, sin registro y sin subidas.» + chip rounded-full border-success/30 bg-success/10 text-success con ShieldCheck h-3.5 w-3.5 y «Procesamiento 100 % local» (import de ShieldCheck añadido); layout, enlaces, columnas y fila inferior intactos.
- ModelTable.tsx: cebra `odd:bg-muted/20` en las filas del tbody (compone con hover:bg-muted/40 según el orden de variantes verificado); cabecera sticky NO aplicada porque el contenedor solo tiene overflow-x-auto sin max-h (no hay scroll vertical propio — la spec decía «si no scrollea, sáltalo»); celda Tokens reestructurada en flex-col items-end con la fila existente (número + PrecisionBadge intactos) y, cuando `result.imageTokens != null`, línea diminuta «texto X + img Y» (text-[10px] leading-tight text-muted-foreground, mono tabular heredado de la celda, formatNumber; textTokens con fallback defensivo `?? result.tokens - result.imageTokens`). Sin cambios de props, columnas, aria-sort, orden, foco ni a11y.
- Verificación: `bunx tsc --noEmit` → solo los 4 errores preexistentes de examples/websocket y skills/; 0 errores de los 7 archivos tocados. No se ha ejecutado dev/lint, no se han creado archivos de prueba ni se ha tocado ningún archivo ajeno (Dropzone/FileStatsBar/ResultCard/ImageTokensCard/HistoryPanel/CompareDialog/page.tsx/store intactos).

Stage Summary:
- Utilidades nuevas en globals.css (todas aditivas al final del archivo): `@keyframes float-y`, `.animate-float-y` (6s ease-in-out infinite + opt-out prefers-reduced-motion) y `.text-gradient-violet` (90°, var(--primary)→#9479FF, background-clip: text, color transparent).
- Pulido aplicado: hero con foco de gradiente en «tokens» + resplandor violeta flotante + chips de confianza con tiles de icono; barras de la comparativa con degradado por proveedor (base opaca → punta difuminada) y tooltip con más profundidad; tarjetas de «Cómo funciona» con lift motion-safe y números de paso con degradado violeta; FAQ con fila hover suave; footer con hairline de marca y chip de privacidad success; tabla con cebra y desglose «texto X + img Y» en la celda Tokens (compatible con el contrato de la Task 12: imageTokens solo presente cuando el análisis incluyó imágenes).
- Desviaciones documentadas: (1) gradiente del h1 movido de «en cada modelo de IA?» a «tokens» (foco único, <br> conservado); (2) .animate-float-y sin alternate (ciclo simétrico ya sin costura); (3) tooltip del gráfico solo shadow-md→shadow-lg porque ya era custom y cumplía la spec pedida; (4) hairline del footer reemplaza el border-t en vez de apilarse; (5) cabecera sticky omitida porque el contenedor de la tabla no scrollea verticalmente; (6) párrafo de marca del footer reescrito mínimamente para extraer «Procesamiento 100 % local» al chip sin duplicar información.
- Siguientes (orquestador, Task 13): QA visual en ambos temas (glow del hero con y sin prefers-reduced-motion, degradados por proveedor en las barras, cebra + hover de filas, desglose texto/imagen con un análisis mixto, hairline del footer) y verificar que el desvanecido de las barras (0.35 en la punta) mantiene suficiente contraste con el LabelList en modo claro.

---
Task ID: 4-a
Agent: frontend-styling-expert
Task: Dropzone multiarchivo + FileStatsBar con lista de archivos

Work Log:
- Leído el worklog completo (contratos de las tareas 12, 2-b, 8-9, 3-c) y los archivos vivos: store.ts (analyzeFiles/removeFile/files/exactTokens/previewUrl), types.ts (AnalyzedFile, ImageInfo, MAX_FILES=10), extractors/index.ts (SUPPORTED_FORMATS_HINT ya incluye PNG · JPG · WEBP · GIF), format.ts (formatBytes/formatNumber), button.tsx/separator.tsx y globals.css (tokens surface-elevated, success, custom-scrollbar, shadow-glow). Verificados los iconos lucide en el paquete instalado (Files, FilePlus2, Image, Plus…).
- src/components/Dropzone.tsx (reescrito): input con `multiple`; pickerModeRef ("replace" | "add") recuerda el modo porque el mismo input oculto sirve para "Cambiar archivo" y "Añadir más"; onDrop → analyzeFiles(Array.from(e.dataTransfer.files), files.length > 0 ? "add" : "replace"); onChange → analyzeFiles(Array.from(e.target.files ?? []), pickerModeRef.current) con reset de value. openPicker(mode) setea el ref antes del click.
- Idle: copia plural ("Arrastra tus archivos aquí" / "o haz clic para seleccionarlos") + nota text-[11px] muted "Puedes analizar hasta {MAX_FILES} archivos a la vez"; chips de formatos, PasteDialog, botón de ejemplo y nota de privacidad intactos; aria-label de la zona actualizado a plural.
- Done: 1 archivo = layout anterior (icono FileText + nombre + bytes + "análisis completado", "Cambiar archivo" replace + X "Quitar archivo"); >1 archivos = resumen compacto (tile Files violeta + "N archivos" + formatBytes total + "análisis completado" + "· N imagen/es" si las hay) con outline "Añadir más" (FilePlus2 h-4 w-4, modo add) + X ghost 40×40 aria-label "Quitar todos los archivos" → reset(). Todos los botones internos con stopPropagation. Busy/alerts de error y warning sin cambios (el store ya manda mensajes ricos tipo "Archivos omitidos: …").
- src/components/FileStatsBar.tsx (rediseño): fila superior intacta (tile + fileName + bytes + grid cols-3→sm:flex); stat nueva "Imágenes" (formatNumber) solo cuando hay imágenes; "Caracteres/token" ahora se OCULTA cuando stats.chars === 0 (solo imágenes) o avgTokens === 0 (división guardada; antes mostraba "—"/"0"); icono de cabecera pasa a ImageIcon en análisis de solo imágenes.
- Lista de archivos NUEVA bajo la fila superior (visible con files.length > 0): Separator horizontal + ul flex-wrap gap-1.5 (sin overflow horizontal en 390) con un chip por archivo: texto = FileText h-3.5 text-primary + nombre truncado (title, max-w-[120px] sm:max-w-[200px]) + formatBytes mono tabular + dot verde bg-success h-1.5 w-1.5 (title "conteo exacto o200k en tu navegador") + "{formatNumber(exactTokens)} tokens"; imagen = miniatura img h-8 w-8 rounded-md object-cover border (previewUrl, alt, loading lazy, con eslint-disable justificado porque es una URL de objeto blob no optimizable) o ImageIcon de fallback + "W×H px · bytes" mono tabular; "…" mono mientras cuenta y falta exactTokens.
- Botón de quitar por archivo: ghost size icon h-7 w-7 (28 px, aceptable para destructivo secundario), text-muted-foreground hover:text-destructive, aria-label "Quitar {name}", disabled mientras extracting/counting, → removeFile(id) (al quitar el último el store hace reset solo). Animación sutil de chips con framer-motion: AnimatePresence mode="popLayout" + layout + initial/animate/exit de 150 ms, y useReducedMotion degrada a solo-opacidad/sin layout (motion-safe).
- Verificación: `bunx tsc --noEmit` → exactamente los 4 errores preexistentes de examples/ y skills/ (diff nulo respecto al baseline); sin errores en los dos archivos. No se ha tocado ningún otro archivo, ni dev server, ni lint, ni tests.

Stage Summary:
- Exports sin cambios: { Dropzone } y { FileStatsBar }, ambos "use client"; el contrato con page.tsx sigue intacto (mismos selectores del store + files/status/removeFile/analyzeFiles nuevos).
- Decisiones UX: (1) soltar archivos sobre un análisis existente SIEMPRE añade al lote ("add"), mientras que el clic en la zona usa el modo del botón primario visible ("add" en done-multi, "replace" en idle/done-single); (2) "Caracteres/token" se oculta (no "0") cuando chars=0 o avgTokens=0; (3) stat "Imágenes" solo si hay imágenes; (4) el input recuerda el último modo pedido por botón (ref) por si el usuario cancela el selector.
- Desviaciones documentadas: (a) en chips de imagen la miniatura reemplaza al ImageIcon cuando hay previewUrl (el store SIEMPRE crea previewUrl para imágenes → icono+miniatura duplicarían la señal "es una imagen"; ImageIcon queda como fallback sin preview); (b) el tile del resumen multi usa el icono Files en vez de FileText; (c) <img> directo con comentario eslint-disable @next/next/no-img-element porque next/image no optimiza URLs blob:; (d) targets táctiles de quitar por archivo a 28 px (especificado aceptable para destructivo secundario), el X de la dropzone se mantiene a 40 px.
- Pendiente para el orquestador (Task 13): QA con agent-browser — drop multi (texto+imagen), "Añadir más" con límite MAX_FILES (warning "Archivos omitidos"), quitar archivos uno a uno (recuento sin re-extraer), solo-imágenes (stat Imágenes, sin Caracteres/token), móvil 390 sin overflow y prefers-reduced-motion.

---
Task ID: 4-c
Agent: frontend-styling-expert
Task: CompareDialog + integración en HistoryPanel

Work Log:
- Leído el worklog completo (contratos de las tareas 12, 2-b, 3-b y 3-a) y los archivos vivos: HistoryPanel actual (helper relativeTime con Intl.RelativeTimeFormat("es",{numeric:"auto"}), patrón de filas/chips, tooltip del botón disabled, AlertDialog de vaciado), history.ts (HistoryEntry con fileCount?/imageCount? retrocompatibles, HistoryResult con textTokens?/imageTokens?), models.config (MODELS/PROVIDERS/getModel), types.ts (PRECISION_META con dotClass/label), format.ts, export.ts (copyToClipboard), store.ts, ui/dialog + ui/table + ui/button, globals.css (custom-scrollbar, text-success, base border-border) y eslint.config. Verificado con node que lucide-react 0.525 exporta GitCompareArrows.
- src/components/CompareDialog.tsx (NUEVO, "use client", export { CompareDialog }): props { open, onOpenChange, entryA, entryB }; guard return null si falta alguna entrada (useMemo de filas ANTES del early-return, regla de hooks). Dialog sm:max-w-3xl "Comparar análisis" con subtítulo "Diferencia de tokens por modelo entre los dos análisis seleccionados.".
  * Resumen: grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr] con dos tarjetas compactas (badge mono A/B en bg-primary/10, nombre truncate+title, relativeTime · formatBytes · formatNumber(chars) " caracteres", chips bg-secondary "N archivos" si fileCount>1, "N imágenes" si imageCount>0, y "N modelos" extra para explicar los "—" de la tabla) y separador "vs" (text-[10px] uppercase tracking-wider text-muted-foreground, aria-hidden) entre ambas; apiladas en pantallas muy pequeñas.
  * Tabla (núcleo): unión de modelIds de ambas entradas ordenada según MODELS (ids desconocidos de configs antiguas al final, nombre = id y sin dot de proveedor); columnas Modelo (dot de proveedor con backgroundColor inline de PROVIDERS + nombre) | Tokens A | Tokens B | Diferencia | Cambio. Celdas de tokens con formatNumber font-mono tabular-nums + dot de precisión PRECISION_META[precision].dotClass (h-1.5 w-1.5, title/aria-label del label) y, cuando imageTokens != null, línea diminuta "texto X + img Y" (text-[10px] muted mono, fallback textTokens ?? tokens − imageTokens); modelo ausente → "—" muted. Diferencia = B − A con Intl.NumberFormat("es-ES",{signDisplay:"always"}) (+explícito; 0 sin signo); color text-destructive si B gasta más, text-success si ahorra, muted si 0/no disponible. Cambio = (B−A)/A×100 con signDisplay always + maximumFractionDigits 1 (estilo formatPercent), "—" si A es 0 o falta; mismo código de color (diffTone compartido).
  * Contenedor custom-scrollbar max-h-[45vh] overflow-auto rounded-xl border; thead sticky (sticky top-0 z-10 bg-card sobre cada th, cabecera uppercase text-[10px] tracking-wider muted, filas hover:bg-muted/40). TABLA CRUDA sin la primitiva ui/table: su wrapper interno overflow-x-auto se convierte en scroll container (overflow-y computado auto) y rompería el sticky del thead dentro del scroll vertical propio; se usa border-separate border-spacing-0 (el modo collapse pierde los bordes al hacer sticky) con border-b por celda y [&_tr:last-child_td]:border-b-0 para no duplicar con el borde del contenedor.
  * Footer: Button outline "Copiar comparación" (Copy h-4 w-4) → buildComparisonMarkdown (título, ambas entradas con nombre/fecha toLocaleString es-ES/formatBytes/caracteres, tabla markdown con las mismas 5 columnas, pipes de nombres escapados, nota "Diferencia = tokens B − tokens A") → copyToClipboard + toast.success("Comparación copiada al portapapeles") (toast.error de fallback, patrón ChunkSplitter); Button secondary "Cerrar" (onClick → onOpenChange(false), patrón PasteDialog). handleCopy re-estrecha entryA/entryB dentro del closure. Estado vacío defensivo si la unión no tiene modelos.
- src/components/HistoryPanel.tsx (MODIFICADO, todo lo existente intacto): 
  * HistoryRow recibe compareSelected + onToggleCompare y añade un toggle GitCompareArrows (ghost h-8 w-8, border border-transparent permanente para evitar salto de layout; seleccionado → border-primary/30 bg-primary/15 text-primary hover:bg-primary/25; normal → text-muted-foreground hover:text-foreground) como primera acción antes de Restaurar/Eliminar, con aria-pressed, aria-label "Seleccionar {name} para comparar" y title con estado ("Seleccionar para comparar" / "Quitar de la comparación") para descubribilidad con ratón.
  * Panel: estado local selected: string[] (máx. 2, el orden de clics define A y B) + compareOpen. toggleCompare: tercer análisis reemplaza al MÁS ANTIGUO ([prev[último], id]) con toast.info("Selección actualizada: se comparan los dos últimos análisis"); re-seleccionar deselecciona. compareEntries derivado en render (selected ∩ entries, conserva el orden; ids recortados del histórico se ignoran sin efectos) → compareCount/entryA/entryB. Selección persiste al cerrar el diálogo; se limpia en handleClear ("Vaciar historial") y al eliminar una entrada seleccionada (handleDelete filtra el id).
  * Barra de comparación entre la lista y el footer (visible con compareCount>0): icono GitCompareArrows text-primary + "nombreA vs nombreB" (truncate, foreground) cuando hay 2 o "Selecciona 2 análisis para comparar" cuando hay 1; botones "Limpiar" (ghost sm, resetea) y "Comparar (2)" (default sm → setCompareOpen(true)) o "Comparar (1/2)" (outline sm disabled).
  * CompareDialog renderizado como HERMANO del Dialog principal (fragmento en la raíz de HistoryPanel, no dentro del DialogContent): portal Radix propio, capas apiladas sin conflicto de focus-lock. Nota de límites del footer ampliada con "· Compara dos análisis".
- Verificación: `bunx tsc --noEmit` → exactamente los 4 errores preexistentes de examples/websocket y skills/; 0 errores de los dos archivos. No se ha ejecutado dev/lint, no se han creado tests ni se ha tocado ningún otro archivo.

Stage Summary:
- Exports: { CompareDialog } desde @/components/CompareDialog ("use client") y { HistoryPanel } con la funcionalidad anterior 100 % intacta (lista, expandir, restaurar con tooltip >512 KB, eliminar, vaciar con AlertDialog, estado vacío, nota de límites).
- Decisiones: (1) tabla cruda en vez de ui/table porque el wrapper overflow-x-auto de la primitiva captura el contexto sticky y anularía el thead fijo dentro del contenedor con scroll vertical; border-separate + border-spacing-0 es requisito para conservar bordes con sticky; (2) columna "Cambio" oculta por debajo de sm (hidden sm:table-cell) para que las 5 columnas respiren en 390 px — Diferencia (valor absoluto) es la señal principal y el Markdown copiado siempre incluye el %; (3) derivación de selección válida en render (sin setState en efectos, regla react-hooks/set-state-in-effect) tolera entradas recortadas del histórico al reabrir; (4) sub-línea "texto X + img Y" con fallback defensivo para entradas con imageTokens pero sin textTokens; (5) chars del resumen con formatNumber (cifra exacta: es una herramienta de comparación) frente al formatCompact compacto de las filas del historial.
- Desviaciones menores: (a) "N modelos" añadido como tercer chip de las tarjetas resumen (la spec solo pedía archivos/imágenes) para explicar los "—" cuando un modelo falta en un lado; (b) title dinámico en el toggle de fila además del aria-label fijo exigido; (c) overflow-auto (x+y) en el contenedor de la tabla en vez de solo overflow-y-auto, como salvaguarda para cifras muy largas.
- Siguientes (orquestador, Task 13): QA con agent-browser — seleccionar 2 entradas (barra con nombres + "Comparar (2)"), turno de un tercer análisis (shift + toast.info), modelo ausente en un lado ("—"), análisis con imágenes (desglose texto+img y chips), copiar comparación (toast + markdown en portapapeles), móvil 390 (columna Cambio oculta, tarjetas apiladas con "vs"), cierre/reapertura del historial conservando la selección y eliminar/vaciar limpiándola.

---
Task ID: 13 (Fase 4 — ensamblado, QA final y cierre)
Agent: orchestrator (Z.ai Code)
Task: Ensamblar page.tsx con las piezas de 4-a/4-b/4-c/4-d, QA end-to-end con agent-browser y cierre de fase

Work Log:
- page.tsx: ImageTokensCard bajo FileStatsBar (solo con imágenes, oculto durante extracting), ResultCard con index para entrada escalonada (stagger), scroll suave al panel de resultados al pasar a "done" (useEffect + refs, sin setState), scroll-mt-20.
- Corregidos 2 warnings de lint heredados de los agentes: alias Image→ImageIcon en ResultCard (jsx-a11y confundía el icono lucide con <img>) y directiva eslint-disable sobrante en FileStatsBar.
- BUGS detectados y corregidos en QA: (1) faltaba vision:true en gpt-4o (mi edición del config lo saltó — la tarjeta mostraba "No admite imágenes"; corregido y reverificado: GPT-4o = 1750 = 61 texto + 1689 imagen); (2) Caracteres/token mezclaba tokens de imagen (0,2) → ahora usa solo textTokens (3,8 correcto).
- QA agent-browser completo (todo verificado contra la matemática esperada):
  * Multiarchivo 4 archivos (2 textos + 2 PNG 1024×768 y 800×600): chips por archivo (notas 28 tokens, datos 33 tokens, W×H en imágenes con miniatura), total "4 archivos · 5,8 KB", IMÁGENES = 2.
  * Tokens de imagen EXACTOS: OpenAI 1049+640=1689 ✓; Gemini mosaicos 768²: 516+516=1032 ✓; Claude 1689 ✓; genérico (Llama/Grok) 1689 ✓; GPT-4 Turbo legacy 85+2×2×170=765+texto ✓; análisis solo-imagen 384×384: OpenAI 197, Gemini 258, Claude 197 ✓; no-visión (Mistral/DeepSeek) muestran "No admite imágenes" y 0 tokens ✓.
  * Quitar archivo → re-cuento sin re-extraer (GPT-5 1110 = 61+1049) ✓; quitar todos → idle ✓.
  * Comparador: seleccionar 2 entradas → tabla con deltas (GPT-5 A 1110 vs B 1750 → +640 / +57,7 %) ✓, desglose "texto X + img Y" ✓, copiar comparación → toast ✓.
  * Exportar Markdown con columnas Texto/Imagen ✓; pegar texto (ruta nueva del store) → 17 tokens exactos ✓; restaurar entrada multiarchivo del historial → "3 archivos", 61 tokens ✓.
  * Responsive 390px: docScrollWidth 390 = viewport (sin overflow horizontal; la tabla scrollea en su contenedor como diseño) ✓. Modo claro ✓. Gradiente del hero en "tokens" activo (background-clip: text) ✓; 7 gradientes por proveedor en el gráfico ✓.
  * Sin errores de consola, sin overlays de error, dev.log limpio (solo compiles y GET 200).
- Verificaciones finales: bun run lint = 0/0; bunx tsc --noEmit = 0 errores nuevos.
- Artefactos de QA en download/: qa4-multifile-results.png, qa4-compare-dialog.png, qa4-mobile-hero.png, qa4-mobile-results.png, qa4-light-hero.png, qa4-light-mobile.png, qa4-final-dark-hero.png, qa4-final-dark-results.png + PNGs de prueba (test-1024x768/800x600/384x384) y scripts/genpng.ts (regenerable).

Stage Summary — ENTREGA DE FASE 4

■ ESTADO ACTUAL DEL PROYECTO
TokenLens completa las fases 1–4 del roadmap del usuario, todo 100 % cliente (Web Workers, cero subidas):
- Fase 1-2 (MVP + archivos): dropzone, pegado, OpenAI exacto local (o200k/cl100k), estimaciones por ratio, PDF/DOCX/XLSX, gráfico comparativo, tabla, export CSV/JSON/MD.
- Fase 3 (herramientas): visualizador de tokens, optimizador con vista previa, divisor de fragmentos + ZIP, historial local (24 entradas), calculadora mensual.
- Fase 4 (esta entrega): MULTIARCHIVO (hasta 10 archivos con mezcla texto+imágenes, chips por archivo con tokens exactos, quitar/recontar, añadir más), TOKENS DE IMAGEN (5 fórmulas documentadas por proveedor con badge 🟡, miniaturas, desglose texto/imagen en tarjetas, modelos sin visión marcados), COMPARADOR de análisis del historial (deltas absolutos y %, copiar markdown), y pulido visual (gradientes del hero y del gráfico por proveedor, entrada escalonada de tarjetas, scroll a resultados, zebra en tabla, línea degradada del footer, chips con iconos, animaciones motion-safe).
Precios siguen TODO (null) por decisión del usuario — la UI lo comunica siempre.

■ OBJETIVOS, MODIFICACIONES Y VERIFICACIÓN
- Objetivo de la ronda (fijado tras QA estable de Fase 3): cumplir los dos mandatos (más estilo + más features) con el siguiente ítem del roadmap del usuario (multiarchivo + imágenes + comparación).
- Modificaciones: 8 archivos de lib (types, models.config con vision en 14 modelos, imageTokens nuevo, extractors/image nuevo, extractors/index, store reescrito, history, export), 10 componentes (Dropzone, FileStatsBar, ResultCard, ImageTokensCard nuevo, CompareDialog nuevo, HistoryPanel, Hero, CompareChart, HowItWorks, Faq, Footer, ModelTable, globals.css) + page.tsx.
- Verificación: QA end-to-end con agent-browser (matemática de tokens verificada al token exacto en 8 fórmulas/escenarios), lint 0/0, tsc 0, sin errores de consola, responsive 390px OK, modo claro OK, 8 capturas de evidencia en download/.

■ PROBLEMAS SIN RESOLVER, RIESGOS Y PRIORIDADES DE LA PRÓXIMA FASE
- Riesgos conocidos: (1) restaurar una entrada multiarchivo del historial solo recupera el TEXTO concatenado (las imágenes no se guardan en localStorage por tamaño — limitación documentada); (2) el conteo exacto multiarchivo suma por archivo (fronteras de token entre archivos no compartidas — decisión honesta: cada archivo es un documento); (3) fórmulas de imagen dependen del redimensionado real del proveedor (siempre 🟡 estimado); (4) verificación visual con VLM no disponible en este entorno (token 401) — la QA visual se hizo por DOM/capturas.
- Prioridades siguientes (roadmap del usuario): 1) BYOK con /api/count (Anthropic count_tokens, Gemini countTokens) → badges 🔵 Oficial; 2) tokenizadores HF locales vía transformers.js (Llama/Mistral/DeepSeek/Qwen exactos); 3) i18n ES/EN real (el toggle ya existe); 4) rellenar precios en models.config.ts desde páginas oficiales (bloqueante para costes).
- Recomendación: mantener el protocolo de agentes paralelos con worklog + verificación matemática en QA (ha detectado 2 bugs reales esta ronda).

---
Task ID: 14 (actualización de catálogo — octubre 2026)
Agent: orchestrator (Z.ai Code)
Task: El usuario señaló que el catálogo tenía modelos antiguos; renovarlo por completo con los modelos vigentes a 07/10/2026, verificado por búsqueda web, sin inventar precios.

Work Log:
- Búsqueda web (10 consultas) para verificar los modelos vigentes de cada proveedor a octubre 2026 y sus ventanas de contexto: OpenAI (GPT-5.5/5.4/5.2), Anthropic (Opus 5.5, Fable 5.1, Mythos 5.1, Sonnet 5), Google (Gemini 3.1 Pro preview, 3 Pro, 3 Flash), xAI (Grok 4.5, 4.1 Fast; Grok 5 aún en entrenamiento), DeepSeek (V4 Pro, V4.1 Flash; deepseek-chat/reasoner obsoletos), Mistral (Medium 3.5, Large 3), Qwen (3.8 Max, 3.6-Plus), Meta (Llama 4 sigue siendo la última generación).
- models.config.ts reescrito: 34 modelos (antes 24). Nuevos flagships activos por defecto (15): gpt-5.5, gpt-5.2, claude-opus-5-5, claude-fable-5-1, claude-sonnet-5, claude-haiku-4-5, gemini-3.1-pro, gemini-3-pro, gemini-3-flash, llama-4-maverick, mistral-medium-3-5, deepseek-v4-pro, deepseek-flash, grok-4-5, qwen3.8-max. Retirados: gpt-4-turbo, gpt-3.5-turbo, claude-opus-4-1, claude-sonnet-4-5, qwen2.5-72b, deepseek-chat, deepseek-reasoner, grok-3, mistral-large-2 (sustituidos). Los que siguen en API se conservan marcados "(legacy)" y desactivados.
- Precios rellenados SOLO donde hay fuente corroborada (comentario "Fuente:" en cada uno): gpt-5.5 $5/$30 (anuncio oficial OpenAI abr-2026), gpt-5.2 $1.75/$14 (página API OpenAI), claude-opus-5-5 $4/$20 (anuncio oficial Anthropic sep-2026), grok-4-5 $2/$6 (notas de versión xAI), qwen3.8-max $2/$6 (lanzamiento Alibaba), mistral-medium-3-5 $1.5/$7.5 y mistral-large-3 $0.5/$1.5 (rastreadores de pricing oct-2026, marcados para verificar). El resto sigue null — sin inventar.
- Nuevo campo releaseYear + helpers CATALOG_YEAR/isNewRelease; insignia verde "nuevo" en ResultCard, ModelTable y SettingsPanel para modelos de 2026.
- store.ts: persist con version: 2 + migrate — al venir de la v0 (catálogo antiguo) se restauran los nuevos defaults (los ids viejos ya no existen); en v2+ se filtran ids desconocidos. Preferencias (outputTokens, moneda) se conservan.
- sample.ts actualizado con ids modernos; Faq.tsx: respuesta de precios/actualización reescrita (catálogo oct-2026, precios solo corroborados).
- QA con agent-browser: página carga sin errores (portal de Next = solo devtools, no overlay); análisis de ejemplo → 15 tarjetas con los nuevos modelos y badges "nuevo" (10); conteos coherentes (OpenAI 341 exacto, Anthropic 385, Gemini 358, etc.); tabla: GPT-5.5 → 1.050.000 ventana, $5/$30, coste 0,032 $ (341×5/M + 1024×30/M ✓); Opus 5.5 0,022 $ ✓; Grok 4.5 0,00686 $ ✓; Mistral 0,00824 $ ✓; Qwen3.8 0,00691 $ ✓.
- Migración probada inyectando localStorage v0 con ids antiguos → recarga → version 2, activeModels = nuevos defaults, outputTokens 2048 y EUR conservados.
- Calculadora mensual: con EUR (rate TODO) muestra "—" por diseño; con USD → GPT-5.5 = 189,435 $ (1,023M×$5 + 6,144M×$30 ✓).
- VLM sobre capturas dark/light: insignia "nuevo" visible, sin desalineaciones, contraste correcto. lint 0 problemas, tsc 0 errores en src/. Capturas: qa5-new-catalog-dark.png, qa5-new-catalog-light.png, qa5-monthly-gpt55.png.

Stage Summary — ACTUALIZACIÓN DE CATÁLOGO OCT-2026

■ ESTADO ACTUAL DEL PROYECTO
TokenLens mantiene las fases 1-4 completas (multiarchivo, imágenes, comparador, historial, optimizador, chunker, mensual) y ahora el catálogo refleja la generación de modelos vigente a 07/10/2026: 34 modelos, 15 activos por defecto, todos los flagships actuales presentes. El coste por tokens funciona de verdad para 7 modelos con precio verificado.

■ OBJETIVOS, MODIFICACIONES Y VERIFICACIÓN
- Objetivo: responder a la petición del usuario (modelos modernos) sin violar la regla de no inventar precios.
- Modificaciones: models.config.ts (catálogo completo + releaseYear + precios con fuente), store.ts (migración v2), SettingsPanel/ModelTable/ResultCard (badge "nuevo"), sample.ts, Faq.tsx.
- Verificación: QA agent-browser end-to-end con matemática de costes verificada al céntimo, migración localStorage probada, VLM visual OK, lint/tsc limpios.

■ PROBLEMAS SIN RESOLVER, RIESGOS Y PRIORIDADES DE LA PRÓXIMA FASE
- Precios de 27 modelos siguen null (sin fuente oficial corroborada en las búsquedas): gpt-5.5-pro, gpt-5.4, gpt-5.2-codex, todos los Anthropic menos Opus 5.5, todos los Gemini, DeepSeek, Llama, Grok 4.1 Fast, Qwen3.6-Plus, Codestral. Riesgo: ventanas y precios de terceros pueden variar — re-verificar contra páginas oficiales antes de producción.
- EUR sigue sin tipo de cambio (CURRENCIES.EUR.rate = null).
- Prioridades siguientes del roadmap: 1) BYOK /api/count (Anthropic count_tokens, Gemini countTokens) → badges 🔵 Oficial; 2) tokenizadores HF locales (transformers.js) para Claude/Llama/DeepSeek/Qwen; 3) i18n ES/EN real; 4) fórmula de imagen para modelos 2026 (las actuales siguen las fórmulas documentadas de cada proveedor).
