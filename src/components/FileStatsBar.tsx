"use client";

import { FileText } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { selectActiveResults, useTokenLens } from "@/lib/store";
import { formatBytes, formatNumber } from "@/lib/format";

export function FileStatsBar() {
  const fileName = useTokenLens((s) => s.fileName);
  const fileSize = useTokenLens((s) => s.fileSize);
  const stats = useTokenLens((s) => s.stats);
  const results = useTokenLens((s) => s.results);
  const activeModels = useTokenLens((s) => s.activeModels);

  if (!stats) return null;

  const active = selectActiveResults(results, activeModels);
  let charsPerToken = "—";
  if (active.length > 0) {
    const avgTokens =
      active.reduce((sum, r) => sum + r.tokens, 0) / active.length;
    if (avgTokens > 0) {
      charsPerToken = (stats.chars / avgTokens).toLocaleString("es-ES", {
        maximumFractionDigits: 1,
      });
    }
  }

  const items: Array<{ label: string; value: string }> = [
    { label: "Caracteres", value: formatNumber(stats.chars) },
    { label: "Palabras", value: formatNumber(stats.words) },
    { label: "Líneas", value: formatNumber(stats.lines) },
    { label: "Páginas ≈", value: formatNumber(stats.pages) },
    { label: "Caracteres/token", value: charsPerToken },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="max-w-[200px] truncate text-sm font-medium sm:max-w-xs">
              {fileName ?? "—"}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatBytes(fileSize ?? 0)}
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-10! sm:block" />

        <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-center">
          {items.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
