"use client";

import { Cpu, Loader2, TriangleAlert } from "lucide-react";

import { useTokenLens } from "@/lib/store";
import { useLang, useT } from "@/lib/i18n";

/**
 * Chip de estado de los tokenizadores HF locales en la cabecera de
 * resultados (gemini del ByokStatus):
 * - en curso: pulso esmeralda mientras se descarga/cuenta con el BPE oficial
 * - completado: nº de modelos con conteo exacto local (🟢)
 * - fallo: aviso ámbar con el repo que no se pudo descargar
 */
export function HfStatus() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const hf = useTokenLens((s) => s.hf);
  const showResults = useTokenLens((s) => s.results.length > 0);
  if (!showResults) return null;

  if (hf.phase === "running") {
    return (
      <span
        className="inline-flex animate-in fade-in slide-in-from-bottom-1 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[11px] text-success"
        role="status"
      >
        <Loader2
          className="h-3 w-3 animate-spin motion-reduce:animate-none"
          aria-hidden
        />
        {t("hf.status.running")}
      </span>
    );
  }

  if (hf.phase === "done" && hf.upgraded > 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[11px] text-success"
        title={t("hf.status.done.tip")}
      >
        <Cpu className="h-3 w-3" aria-hidden />
        {t("hf.status.done", {
          n: hf.upgraded,
          plural: lang === "es" && hf.upgraded !== 1 ? "s" : "",
        })}
      </span>
    );
  }

  if (hf.phase === "failed") {
    return (
      <span
        className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[11px] text-warning"
        title={t("hf.status.failed.tip", { repo: hf.failedRepo ?? "—" })}
      >
        <TriangleAlert className="h-3 w-3" aria-hidden />
        {t("hf.status.failed")}
      </span>
    );
  }

  return null;
}
