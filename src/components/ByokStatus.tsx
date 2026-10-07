"use client";

import { CloudCheck, CloudOff, Loader2 } from "lucide-react";

import { useTokenLens } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Chip de estado del conteo oficial (BYOK) en la cabecera de resultados:
 * - en curso: pulso azul mientras se consultan las APIs
 * - completado: nº de modelos con conteo oficial
 * - fallo: aviso discreto con tooltip del error
 */
export function ByokStatus() {
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
        conteo oficial…
      </span>
    );
  }

  if (byok.phase === "done") {
    if (byok.upgraded > 0) {
      return (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-google/30 bg-google/10 px-2 py-0.5 font-mono text-[11px] text-google"
          title={
            byok.failed > 0
              ? `${byok.failed} modelo(s) no pudieron consultarse: ${byok.error ?? "error desconocido"}`
              : "Conteos oficiales obtenidos de las APIs de Anthropic/Google con tus keys (BYOK)"
          }
        >
          <CloudCheck className="h-3 w-3" aria-hidden />
          {byok.upgraded} oficial{byok.upgraded !== 1 ? "es" : ""}
          {byok.failed > 0 && (
            <span
              className={cn("text-warning")}
              aria-label={`${byok.failed} consultas fallidas`}
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
          title={byok.error ?? "Error desconocido al consultar la API"}
        >
          <CloudOff className="h-3 w-3" aria-hidden />
          API no disponible
        </span>
      );
    }
    return null;
  }

  return null;
}
