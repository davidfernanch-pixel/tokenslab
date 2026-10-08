# Task 16-c — subagent (content i18n)

## Task
Convertir al i18n real ES/EN (infraestructura lib/i18n del orquestador, Task 16) las secciones de contenido asignadas: `HowItWorks.tsx`, `Faq.tsx`, `Footer.tsx` y las cadenas de usuario de `src/lib/store.ts`, rellenando `src/lib/i18n/dict-content.ts` (CONTENT_ES/CONTENT_EN).

Alcance estricto acordado con el orquestador: solo mis 5 archivos; claves nuevas solo en dict-content.ts con prefijos `how.` / `faq.` / `footer.` / `store.`; las etiquetas de precisión se REUTILIZAN de dict-core (`precision.exact/official/estimated` + `.desc`), nunca se duplican.

## Work Log
1. Contexto leído: worklog.md (últimas secciones), `lib/i18n/index.ts` (useT/tSync), `dict-core.ts`, `Hero.tsx` (patrón). Comprobado que `store.ts → @/lib/i18n` no crea ciclo (i18n solo importa dict-*, types y sample; ninguno importa store).
2. `src/lib/i18n/dict-content.ts` — 42 claves ES + 42 EN:
   - `how.` (12): kicker, title ("Tres pasos, cero servidores" / "Three steps, zero servers"), subtitle, step1-3 title+desc, badges.title, badges.intro, config.note.
   - `faq.` (14): kicker, title, q1-a6 — privacidad (todo local, Web Workers), BYOK (keys, localStorage, proxy sin estado /api/count, no funciona con imágenes), insignias (Exacto/Oficial/Estimado), precisión de la estimación (<10 % de desviación), precios (catálogo oct-2026, solo corroborados), límites (20 MB, 10 archivos, PDFs escaneados).
   - `footer.` (9): tagline, local, precision.title, link.how, link.faq, precision.note, providers.title, providers.note, disclaimer.
   - `store.` (7): progress.counting/done/preparing, error.count, rejected.format/size/limit con interpolación `{name}`/`{ext}`/`{size}`/`{n}`.
3. `HowItWorks.tsx` — `useT()`; STEPS y PRECISION_LEVELS construidos dentro del componente (interfaces intactas); niveles de precisión usan `t("precision.exact")` etc. de dict-core. JSX/classNames/id="como-funciona" intactos.
4. `Faq.tsx` — `useT()`; FAQS dentro del componente con `t("faq.q1"…"faq.a6")`; values del accordion intactos como ids estables; cabecera → faq.kicker/faq.title.
5. `Footer.tsx` — `useT()`; todo el texto visible traducido; marcas (TokenLens, labels de proveedores) sin traducir; `href="#como-funciona"`/`#faq` intactos.
6. `store.ts` — `import { tSync }`; sustitución exacta de las 7 cadenas de la misión ("Contando tokens…" ×2, "Análisis completado", "Preparando texto…", error de conteo y los 3 rechazos con interpolación de los mismos datos: name, ext, size=formatBytes(file.size), n=MAX_FILES). Lógica, sets y persistencia INTACTAS.
7. Verificación: lint 0 problemas; `bunx tsc --noEmit` 0 errores en src/ (exit 1 solo por 4 errores preexistentes en examples/skills, filtrados según protocolo); paridad ES/EN 42/42 y resolución de todas las claves verificada con script efímero; dev.log compila limpio.

## Stage Summary
- 5 archivos tocados, 84 claves nuevas (42 ES + 42 EN), 0 colisiones con agentes paralelos (16-a/16-b usan dict-tools/dict-data y sus propios componentes).
- Decisiones destacadas: reutilizar `precision.*` de dict-core implica que las descripciones de insignia de HowItWorks adoptan el wording único de dict-core (pierden el matiz "insignia verde/azul/ámbar", que ya comunica el punto de color); claves propias `footer.local`/`footer.link.how` en vez de reusar claves de hero/header para desacoplar superficies; "límite 20 MB" permanece literal como en el original.
- Fuera de alcance (dejar para pasada futura): mensajes resumen de rechazos en analyzeFiles ("No se añadió ningún archivo…"), fallback "desconocido" de ext, `fileLabel` "${n} archivos", labels "Extrayendo…", y metadata de layout.tsx.
