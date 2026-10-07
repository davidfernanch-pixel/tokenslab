"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROVIDERS, type ModelConfig } from "@/lib/models.config";
import { calcCost, fitsContext, usageTone } from "@/lib/cost";
import {
  formatCost,
  formatNumber,
  formatPercent,
  formatWindow,
} from "@/lib/format";
import { useTokenLens } from "@/lib/store";
import type { FitInfo, ModelResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey =
  | "name"
  | "provider"
  | "tokens"
  | "window"
  | "usage"
  | "priceIn"
  | "priceOut"
  | "cost"
  | "fits";

interface SortState {
  key: SortKey;
  dir: 1 | -1;
}

interface TableRowData {
  model: ModelConfig;
  result: ModelResult;
  fit: FitInfo;
  costIn: number | null;
  costOut: number | null;
  costTotal: number | null;
}

const COLUMNS: Array<{ key: SortKey; label: string; align: "left" | "right" }> =
  [
    { key: "name", label: "Modelo", align: "left" },
    { key: "provider", label: "Proveedor", align: "left" },
    { key: "tokens", label: "Tokens", align: "right" },
    { key: "window", label: "Ventana", align: "right" },
    { key: "usage", label: "Uso", align: "right" },
    { key: "priceIn", label: "Entrada /1M", align: "right" },
    { key: "priceOut", label: "Salida /1M", align: "right" },
    { key: "cost", label: "Coste total", align: "right" },
    { key: "fits", label: "¿Cabe?", align: "left" },
  ];

const PRICE_TODO_HINT =
  "TODO: rellenar desde la página oficial de precios";

/** Compara valores numéricos anulables: null siempre al final, sin importar la dirección. */
function compareNullable(
  a: number | null,
  b: number | null,
  dir: 1 | -1,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return dir * (a - b);
}

export function ModelTable({
  data,
}: {
  data: Array<{ model: ModelConfig; result: ModelResult }>;
}) {
  const outputTokens = useTokenLens((s) => s.outputTokens);
  const currency = useTokenLens((s) => s.currency);
  const [sort, setSort] = useState<SortState>({ key: "tokens", dir: 1 });

  const rows = useMemo<TableRowData[]>(() => {
    const mapped = data.map((d) => ({
      model: d.model,
      result: d.result,
      fit: fitsContext(d.result.tokens, d.model),
      costIn: calcCost(d.result.tokens, 0, d.model, currency),
      costOut: calcCost(0, outputTokens, d.model, currency),
      costTotal: calcCost(d.result.tokens, outputTokens, d.model, currency),
    }));

    const dir = sort.dir;
    const key = sort.key;
    mapped.sort((a, b) => {
      switch (key) {
        case "name":
          return dir * a.model.name.localeCompare(b.model.name, "es");
        case "provider":
          return (
            dir *
            PROVIDERS[a.model.provider].label.localeCompare(
              PROVIDERS[b.model.provider].label,
              "es",
            )
          );
        case "tokens":
          return dir * (a.result.tokens - b.result.tokens);
        case "window":
          return dir * (a.model.contextWindow - b.model.contextWindow);
        case "usage":
          return dir * (a.fit.percent - b.fit.percent);
        case "priceIn":
          return compareNullable(a.model.priceInPerM, b.model.priceInPerM, dir);
        case "priceOut":
          return compareNullable(
            a.model.priceOutPerM,
            b.model.priceOutPerM,
            dir,
          );
        case "cost":
          return compareNullable(a.costTotal, b.costTotal, dir);
        case "fits":
          return dir * (Number(a.fit.fits) - Number(b.fit.fits));
        default:
          return 0;
      }
    });
    return mapped;
  }, [data, sort, currency, outputTokens]);

  if (rows.length === 0) return null;

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 1 ? -1 : 1 }
        : { key, dir: 1 },
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="custom-scrollbar overflow-x-auto">
        <Table className="min-w-[880px] text-sm">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => {
                const isActive = sort.key === col.key;
                return (
                  <TableHead
                    key={col.key}
                    aria-sort={
                      isActive
                        ? sort.dir === 1
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    tabIndex={0}
                    onClick={() => handleSort(col.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort(col.key);
                      }
                    }}
                    className={cn(
                      "h-11 cursor-pointer select-none whitespace-nowrap px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      col.align === "right" && "text-right",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.label}
                      {isActive ? (
                        sort.dir === 1 ? (
                          <ChevronUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const tone = usageTone(row.fit.percent);
              const toneTextClass =
                tone === "ok"
                  ? "text-success"
                  : tone === "warn"
                    ? "text-warning"
                    : "text-destructive";
              const toneBgClass =
                tone === "ok"
                  ? "bg-success"
                  : tone === "warn"
                    ? "bg-warning"
                    : "bg-destructive";
              return (
                <TableRow
                  key={row.model.id}
                  className="border-b border-border transition-colors hover:bg-surface-elevated/50"
                >
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            PROVIDERS[row.model.provider].color,
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{row.model.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {row.model.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {PROVIDERS[row.model.provider].label}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span
                        className={cn(
                          !row.fit.fits && "font-semibold text-destructive",
                        )}
                      >
                        {formatNumber(row.result.tokens)}
                      </span>
                      <PrecisionBadge
                        precision={row.result.precision}
                        size="sm"
                      />
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">
                    {formatWindow(row.model.contextWindow)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div
                        className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-elevated"
                        aria-hidden
                      >
                        <div
                          className={cn("h-full rounded-full", toneBgClass)}
                          style={{
                            width: `${Math.min(row.fit.percent, 100)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          "w-14 text-right font-mono text-xs tabular-nums",
                          toneTextClass,
                        )}
                      >
                        {formatPercent(row.fit.percent)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">
                    {row.model.priceInPerM == null ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            className="cursor-help text-muted-foreground/60"
                          >
                            —
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-52 text-xs">
                          {PRICE_TODO_HINT}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      formatNumber(row.model.priceInPerM)
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">
                    {row.model.priceOutPerM == null ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            className="cursor-help text-muted-foreground/60"
                          >
                            —
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-52 text-xs">
                          {PRICE_TODO_HINT}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      formatNumber(row.model.priceOutPerM)
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">
                    {row.costTotal == null ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            className="cursor-help text-muted-foreground/60"
                          >
                            —
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-52 text-xs">
                          {PRICE_TODO_HINT}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="cursor-help">
                            {formatCost(row.costTotal, currency)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-52 text-xs">
                          {formatCost(row.costIn, currency)} entrada +{" "}
                          {formatCost(row.costOut, currency)} salida (
                          {formatNumber(outputTokens)} tokens)
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {row.fit.fits ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                        <Check className="h-3 w-3" />
                        Cabe
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                        <X className="h-3 w-3" />
                        No cabe
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
