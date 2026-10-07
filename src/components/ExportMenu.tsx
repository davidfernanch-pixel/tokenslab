"use client";

import { useMemo } from "react";
import { ClipboardCopy, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  copyToClipboard,
  downloadBlob,
  toCSV,
  toJSON,
  toMarkdown,
  type ExportPayload,
} from "@/lib/export";
import { getModel } from "@/lib/models.config";
import { calcCost, fitsContext } from "@/lib/cost";
import { selectActiveResults, useTokenLens } from "@/lib/store";

export function ExportMenu() {
  const fileName = useTokenLens((s) => s.fileName);
  const fileSize = useTokenLens((s) => s.fileSize);
  const kind = useTokenLens((s) => s.kind);
  const stats = useTokenLens((s) => s.stats);
  const results = useTokenLens((s) => s.results);
  const activeModels = useTokenLens((s) => s.activeModels);
  const outputTokens = useTokenLens((s) => s.outputTokens);
  const currency = useTokenLens((s) => s.currency);

  const payload = useMemo<ExportPayload | null>(() => {
    if (!stats) return null;
    const rows = selectActiveResults(results, activeModels).flatMap(
      (result) => {
        const model = getModel(result.modelId);
        if (!model) return [];
        const fit = fitsContext(result.tokens, model);
        return [
          {
            model,
            result,
            percent: fit.percent,
            fits: fit.fits,
            overflow: fit.overflow,
            costTotal: calcCost(result.tokens, outputTokens, model, currency),
          },
        ];
      },
    );
    if (rows.length === 0) return null;
    return {
      meta: { fileName: fileName ?? "resultados", fileSize: fileSize ?? 0, kind },
      stats,
      currency,
      outputTokens,
      rows,
    };
  }, [
    stats,
    results,
    activeModels,
    outputTokens,
    currency,
    fileName,
    fileSize,
    kind,
  ]);

  const slug =
    (fileName ?? "resultados")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "resultados";

  function exportCSV() {
    if (!payload) return;
    downloadBlob(toCSV(payload), `tokenlens-${slug}.csv`, "text/csv;charset=utf-8");
  }

  function exportJSON() {
    if (!payload) return;
    downloadBlob(toJSON(payload), `tokenlens-${slug}.json`, "application/json");
  }

  async function exportMarkdown() {
    if (!payload) return;
    const ok = await copyToClipboard(toMarkdown(payload));
    if (ok) toast.success("Markdown copiado al portapapeles");
    else toast.error("No se pudo copiar");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Exportar resultados">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {!payload ? (
          <>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Analiza algo primero
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <FileSpreadsheet />
              Descargar CSV
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <FileJson />
              Descargar JSON
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <ClipboardCopy />
              Copiar como Markdown
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={exportCSV}>
              <FileSpreadsheet />
              Descargar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={exportJSON}>
              <FileJson />
              Descargar JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void exportMarkdown()}>
              <ClipboardCopy />
              Copiar como Markdown
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
