"use client";

/**
 * TokenLens — i18n ligero ES/EN.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Diccionarios planos por dominio (dict-core, dict-tools, dict-data,
 * dict-content) fusionados en index.ts. El idioma vive en un store Zustand
 * persistido (localStorage "tokenlens-lang") y todos los componentes se
 * traducen al vuelo.
 *
 * API:
 * - useT()           → hook de componentes: const t = useT(); t("clave")
 * - tSync("clave")   → para módulos NO React (store.ts, imageTokens.ts…)
 * - currentLocale()  → "es-ES" | "en-US" para Intl.NumberFormat
 * - usePrecisionMeta() → etiquetas de insignia localizadas
 * - useSampleText()  → texto de ejemplo en el idioma activo
 *
 * Interpolación: t("saludo", { nombre: "Ana" }) sustituye {nombre}.
 * Si falta una clave en EN, cae a ES; si falta en ambos, devuelve la clave
 * (visible en desarrollo, nunca un crash).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CORE_ES, CORE_EN } from "./dict-core";
import { TOOLS_ES, TOOLS_EN } from "./dict-tools";
import { DATA_ES, DATA_EN } from "./dict-data";
import { CONTENT_ES, CONTENT_EN } from "./dict-content";
import { PRECISION_META, type Precision } from "@/lib/types";
import { SAMPLE_ES, SAMPLE_EN } from "@/lib/sample";

export type Lang = "es" | "en";

const ES: Record<string, string> = {
  ...CORE_ES,
  ...TOOLS_ES,
  ...DATA_ES,
  ...CONTENT_ES,
};
const EN: Record<string, string> = {
  ...CORE_EN,
  ...TOOLS_EN,
  ...DATA_EN,
  ...CONTENT_EN,
};

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLang = create<LangState>()(
  persist(
    (set) => ({
      lang: "es",
      setLang: (lang) => set({ lang }),
    }),
    { name: "tokenlens-lang", version: 1 },
  ),
);

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

/** Hook de traducción para componentes React. */
export function useT() {
  const lang = useLang((s) => s.lang);
  const dict = lang === "es" ? ES : EN;
  return (key: string, vars?: Record<string, string | number>): string => {
    const raw = dict[key] ?? ES[key] ?? key;
    return interpolate(raw, vars);
  };
}

/** Traducción síncrona para módulos no React (usa el idioma actual). */
export function tSync(
  key: string,
  vars?: Record<string, string | number>,
): string {
  const lang = useLang.getState().lang;
  const dict = lang === "es" ? ES : EN;
  const raw = dict[key] ?? ES[key] ?? key;
  return interpolate(raw, vars);
}

/** Locale para Intl (separador decimal y de miles). */
export function currentLocale(): "es-ES" | "en-US" {
  return useLang.getState().lang === "es" ? "es-ES" : "en-US";
}

/** Igual que currentLocale pero reactivo (para formatos en componentes). */
export function useLocale(): "es-ES" | "en-US" {
  const lang = useLang((s) => s.lang);
  return lang === "es" ? "es-ES" : "en-US";
}

/** PRECISION_META con etiquetas y descripciones localizadas. */
export function usePrecisionMeta(): Record<
  Precision,
  { label: string; short: string; description: string; dotClass: string }
> {
  const t = useT();
  return {
    exact: {
      ...PRECISION_META.exact,
      label: t("precision.exact"),
      short: t("precision.exact"),
      description: t("precision.exact.desc"),
    },
    official: {
      ...PRECISION_META.official,
      label: t("precision.official"),
      short: t("precision.official"),
      description: t("precision.official.desc"),
    },
    estimated: {
      ...PRECISION_META.estimated,
      label: t("precision.estimated"),
      short: t("precision.estimated"),
      description: t("precision.estimated.desc"),
    },
  };
}

/** Texto de ejemplo en el idioma activo. */
export function useSampleText(): string {
  const lang = useLang((s) => s.lang);
  return lang === "es" ? SAMPLE_ES : SAMPLE_EN;
}
