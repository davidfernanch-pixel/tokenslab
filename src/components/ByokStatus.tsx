"use client";

import { CloudCheck, CloudOff, Loader2 } from "lucide-react";

import { useTokenLens } from "@/lib/store";
import { useLang, useT } from "@/lib/i18n";

/**
 * Chip de estado del conteo oficial (BYOK) en la cabecera de resultados:
 * - en curso: pulso azul mientras se consultan las APIs
 * - completado: nº de modelos con conteo oficial
 * - fallo: aviso discreto con tooltip del error
 */
export function ByokStatus() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const byok = useTokenLens((s) => s.byok);
  const showResults = useTokenLens((s) => s.results.length > 0);
  if (!showResults) return null;

  if (byok.phase === "running") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-google/30 bg-google/10 px-2 py-0.5 font-mono text-[11px] text-google"
        role="status"
      >
        <Loader2
          className="h-3 w-3 animate-spin motion-reduce:animate-none"
          aria-hidden
        />
        {t("byok.status.running")}
      </span>
    );
  }

  if (byok.phase === "done") {
    /** Traduce los mensajes fijos del proxy (siempre en español) al idioma UI. */
    const trError = (raw: string): string => {
      if (raw.includes("no es válida")) return t("byok.err.invalidKey");
      if (raw.includes("no existe en la API")) return t("byok.err.modelNotFound");
      if (raw.includes("Límite de peticiones")) return t("byok.err.rateLimit");
      if (raw.includes("incidencia temporal")) return t("byok.err.providerDown");
      if (raw.includes("No se pudo contactar con la API")) return t("byok.err.noContact");
      if (raw.includes("/api/count")) return t("byok.err.noProxy");
      return raw;
    };

    if (byok.upgraded > 0) {
      return (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-google/30 bg-google/10 px-2 py-0.5 font-mono text-[11px] text-google"
          title={
            byok.failed > 0
              ? t("byok.status.failed.tip", {
                  n: byok.failed,
                  error: trError(byok.error ?? "—"),
                })
              : t("byok.status.done.tip")
          }
        >
          <CloudCheck className="h-3 w-3" aria-hidden />
          {t("byok.status.done", {
            n: byok.upgraded,
            plural:
              lang === "es" && byok.upgraded !== 1 ? "es" : "",
          })}
          {byok.failed > 0 && (
            <span
              className="text-warning"
              aria-label={`${byok.failed} failed`}
            >
              ·{byok.failed}⚠
            </span>
          )}
        </span>
      );
    }
    // Nada upgradeado: si hubo intentos fallidos, aviso discreto
    if (byok.failed > 0) {
      return (
        <span
          className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[11px] text-warning"
          title={byok.error ? trError(byok.error) : t("byok.status.unavailable.tip")}
        >
          <CloudOff className="h-3 w-3" aria-hidden />
          {t("byok.status.unavailable")}
        </span>
      );
    }
    return null;
  }

  return null;
}
