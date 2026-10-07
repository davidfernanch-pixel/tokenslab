"use client";

import { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyToClipboard } from "@/lib/export";
import { formatBytes, formatNumber } from "@/lib/format";
import {
  currentLocale,
  tSync,
  useLang,
  usePrecisionMeta,
  useT,
} from "@/lib/i18n";
import type { HistoryEntry, HistoryResult } from "@/lib/history";
import {
  getModel,
  MODELS,
  PROVIDERS,
  type ModelConfig,
} from "@/lib/models.config";
import { cn } from "@/lib/utils";

/** Tiempo relativo en minutos/horas/días frente a `now` (mismo helper que HistoryPanel). */
function relativeTime(ts: number, now: number): string {
  const fmt = new Intl.RelativeTimeFormat(currentLocale(), {
    numeric: "auto",
  });
  const diff = ts - now;
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 60) return fmt.format(minutes, "minute");
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) < 24) return fmt.format(hours, "hour");
  return fmt.format(Math.round(diff / 86_400_000), "day");
}

/** Diferencia con signo explícito: +1.234 / -1.234 (separadores según idioma). */
function signedFmt(): Intl.NumberFormat {
  return new Intl.NumberFormat(currentLocale(), { signDisplay: "always" });
}
/** Porcentaje con signo y 1 decimal (estilo formatPercent): +12,5 */
function signedPercentFmt(): Intl.NumberFormat {
  return new Intl.NumberFormat(currentLocale(), {
    signDisplay: "always",
    maximumFractionDigits: 1,
  });
}

interface CompareRow {
  modelId: string;
  model: ModelConfig | undefined;
  ra: HistoryResult | undefined;
  rb: HistoryResult | undefined;
  /** B − A (null si el modelo falta en alguno de los dos análisis) */
  diff: number | null;
  /** (B − A) / A × 100 (null si A falta o es 0) */
  change: number | null;
}

/** Tono según el signo: positivo = B usa más tokens (rojo), negativo = B ahorra (verde). */
function diffTone(value: number): string {
  if (value > 0) return "text-destructive";
  if (value < 0) return "text-success";
  return "text-muted-foreground";
}

/** Tarjeta resumen de un análisis (lado A o B) sobre la tabla. */
function SummaryCard({
  side,
  entry,
  now,
}: {
  side: "A" | "B";
  entry: HistoryEntry;
  now: number;
}) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-semibold text-primary"
        >
          {side}
        </span>
        <p className="truncate text-sm font-medium" title={entry.name}>
          {entry.name}
        </p>
      </div>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        <span>{relativeTime(entry.ts, now)}</span>
        <span aria-hidden>·</span>
        <span className="font-mono tabular-nums">
          {formatBytes(entry.size)}
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="font-mono tabular-nums">
            {formatNumber(entry.chars)}
          </span>{" "}
          {t("cmp.chars")}
        </span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {entry.fileCount != null && entry.fileCount > 1 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] tabular-nums">
            {t("cmp.files", { n: entry.fileCount })}
          </span>
        )}
        {entry.imageCount != null && entry.imageCount > 0 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] tabular-nums">
            {t("cmp.images", {
              n: entry.imageCount,
              plural:
                entry.imageCount === 1 ? "" : lang === "es" ? "es" : "s",
            })}
          </span>
        )}
        <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] tabular-nums">
          {t("cmp.models", {
            n: entry.results.length,
            plural: entry.results.length === 1 ? "" : "s",
          })}
        </span>
      </div>
    </div>
  );
}

/** Celda de tokens: dot de precisión, cifra y desglose texto/imagen si lo hay. */
function TokensCell({ result }: { result: HistoryResult | undefined }) {
  const t = useT();
  const META = usePrecisionMeta();
  if (!result) return <span className="text-muted-foreground">—</span>;
  const meta = META[result.precision];
  return (
    <span className="flex flex-col items-end">
      <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)}
          title={meta.label}
          aria-label={meta.label}
        />
        {formatNumber(result.tokens)}
      </span>
      {result.imageTokens != null && (
        <span className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {t("cmp.breakdown", {
            text: formatNumber(
              result.textTokens ?? result.tokens - result.imageTokens,
            ),
            img: formatNumber(result.imageTokens),
          })}
        </span>
      )}
    </span>
  );
}

/** Resumen en Markdown con las mismas columnas que la tabla (para copiar). */
function buildComparisonMarkdown(
  entryA: HistoryEntry,
  entryB: HistoryEntry,
  rows: CompareRow[],
): string {
  const meta = (e: HistoryEntry) =>
    `${new Date(e.ts).toLocaleString(currentLocale())} · ${formatBytes(e.size)} · ${formatNumber(e.chars)} ${tSync("cmp.chars")}`;
  const lines: string[] = [
    tSync("cmp.md.title"),
    "",
    tSync("cmp.md.entryA", { name: entryA.name, meta: meta(entryA) }),
    tSync("cmp.md.entryB", { name: entryB.name, meta: meta(entryB) }),
    "",
    tSync("cmp.md.header"),
    "| --- | ---: | ---: | ---: | ---: |",
  ];
  for (const row of rows) {
    const name = (row.model?.name ?? row.modelId).replace(/\|/g, "\\|");
    const a = row.ra ? formatNumber(row.ra.tokens) : "—";
    const b = row.rb ? formatNumber(row.rb.tokens) : "—";
    const diff =
      row.diff == null
        ? "—"
        : row.diff === 0
          ? "0"
          : signedFmt().format(row.diff);
    const change =
      row.change == null
        ? "—"
        : row.change === 0
          ? "0 %"
          : `${signedPercentFmt().format(row.change)} %`;
    lines.push(`| ${name} | ${a} | ${b} | ${diff} | ${change} |`);
  }
  lines.push("");
  lines.push(tSync("cmp.md.footer"));
  return lines.join("\n");
}

const thClass =
  "sticky top-0 z-10 border-b bg-card py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground";

export function CompareDialog({
  open,
  onOpenChange,
  entryA,
  entryB,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryA: HistoryEntry | null;
  entryB: HistoryEntry | null;
}) {
  const t = useT();
  // Unión de modelos de ambos análisis, ordenada como aparecen en MODELS
  // (ids desconocidos —p. ej. de configs antiguas— al final).
  const rows = useMemo<CompareRow[]>(() => {
    if (!entryA || !entryB) return [];
    const ra = new Map(entryA.results.map((r) => [r.modelId, r]));
    const rb = new Map(entryB.results.map((r) => [r.modelId, r]));
    const ids = new Set([...ra.keys(), ...rb.keys()]);
    const order = new Map(MODELS.map((m, i) => [m.id, i] as const));
    return [...ids]
      .sort(
        (x, y) =>
          (order.get(x) ?? MODELS.length) - (order.get(y) ?? MODELS.length),
      )
      .map((modelId) => {
        const a = ra.get(modelId);
        const b = rb.get(modelId);
        return {
          modelId,
          model: getModel(modelId),
          ra: a,
          rb: b,
          diff: a && b ? b.tokens - a.tokens : null,
          change:
            a && b && a.tokens > 0
              ? ((b.tokens - a.tokens) / a.tokens) * 100
              : null,
        };
      });
  }, [entryA, entryB]);

  // Guard: sin dos entradas no hay nada que comparar (por construcción nunca
  // ocurre con el diálogo abierto, pero se protege igualmente).
  if (!entryA || !entryB) return null;

  const now = Date.now();

  async function handleCopy() {
    if (!entryA || !entryB) return;
    const ok = await copyToClipboard(
      buildComparisonMarkdown(entryA, entryB, rows),
    );
    if (ok) toast.success(t("cmp.toast.copied"));
    else toast.error(t("cmp.toast.copyFailed"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("cmp.title")}</DialogTitle>
          <DialogDescription>{t("cmp.desc")}</DialogDescription>
        </DialogHeader>

        {/* Resumen: tarjeta A · vs · tarjeta B (apiladas en pantallas muy pequeñas) */}
        <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
          <SummaryCard side="A" entry={entryA} now={now} />
          <div
            className="flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              vs
            </span>
          </div>
          <SummaryCard side="B" entry={entryB} now={now} />
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {t("cmp.empty")}
          </p>
        ) : (
          /* Tabla cruda (sin la primitiva ui/table): su wrapper con
             overflow-x-auto rompería el thead sticky dentro de este scroll. */
          <div className="custom-scrollbar max-h-[45vh] overflow-auto rounded-xl border">
            <table className="w-full border-separate border-spacing-0 text-sm [&_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th scope="col" className={cn(thClass, "px-3 text-left")}>
                    {t("cmp.col.model")}
                  </th>
                  <th
                    scope="col"
                    className={cn(
                      thClass,
                      "px-2 text-right whitespace-nowrap sm:px-3",
                    )}
                  >
                    {t("cmp.col.tokensA")}
                  </th>
                  <th
                    scope="col"
                    className={cn(
                      thClass,
                      "px-2 text-right whitespace-nowrap sm:px-3",
                    )}
                  >
                    {t("cmp.col.tokensB")}
                  </th>
                  <th
                    scope="col"
                    className={cn(
                      thClass,
                      "px-2 text-right whitespace-nowrap sm:px-3",
                    )}
                  >
                    {t("cmp.col.diff")}
                  </th>
                  <th
                    scope="col"
                    className={cn(
                      thClass,
                      "hidden px-3 text-right whitespace-nowrap sm:table-cell",
                    )}
                  >
                    {t("cmp.col.change")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.modelId}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {row.model && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                PROVIDERS[row.model.provider].color,
                            }}
                            aria-hidden
                          />
                        )}
                        <span
                          className="truncate text-xs font-medium"
                          title={row.model?.name ?? row.modelId}
                        >
                          {row.model?.name ?? row.modelId}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right sm:px-3">
                      <TokensCell result={row.ra} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right sm:px-3">
                      <TokensCell result={row.rb} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-xs tabular-nums sm:px-3">
                      {row.diff == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={diffTone(row.diff)}>
                          {row.diff === 0
                            ? formatNumber(0)
                            : signedFmt().format(row.diff)}
                        </span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2 text-right font-mono text-xs tabular-nums sm:table-cell">
                      {row.change == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={diffTone(row.change)}>
                          {row.change === 0
                            ? "0 %"
                            : `${signedPercentFmt().format(row.change)} %`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            {t("cmp.copy")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
