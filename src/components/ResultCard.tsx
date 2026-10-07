"use client";

import { motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { getModel, PROVIDERS } from "@/lib/models.config";
import { calcCost, fitsContext, usageTone } from "@/lib/cost";
import {
  formatCompact,
  formatCost,
  formatMs,
  formatNumber,
  formatPercent,
  formatWindow,
} from "@/lib/format";
import { useTokenLens } from "@/lib/store";
import type { ModelResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRICE_TODO_HINT =
  "Precios pendientes: rellena priceInPerM/priceOutPerM en models.config.ts con valores de las páginas oficiales.";

export function ResultCard({ result }: { result: ModelResult }) {
  const outputTokens = useTokenLens((s) => s.outputTokens);
  const currency = useTokenLens((s) => s.currency);
  const animated = useAnimatedNumber(result.tokens);

  const model = getModel(result.modelId);
  if (!model) return null;

  const fit = fitsContext(result.tokens, model);
  const cost = calcCost(result.tokens, outputTokens, model, currency);
  const tone = usageTone(fit.percent);

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
    <motion.div
      role="article"
      aria-label={`${model.name}: ${result.tokens} tokens`}
      className="h-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div
        className={cn(
          "group relative h-full overflow-hidden rounded-xl border bg-card p-5",
          "motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg",
          fit.fits
            ? "border-border hover:border-primary/40 motion-safe:hover:shadow-primary/10"
            : "border-destructive/50 hover:border-destructive motion-safe:hover:shadow-destructive/10",
        )}
      >
        {!fit.fits && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-destructive"
            aria-hidden
          />
        )}

        {/* Modelo y precisión */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PROVIDERS[model.provider].color }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {PROVIDERS[model.provider].label}
              </p>
              <h3 className="truncate text-sm font-semibold leading-tight">
                {model.name}
              </h3>
            </div>
          </div>
          <PrecisionBadge precision={result.precision} size="sm" />
        </div>

        {/* Número grande */}
        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono text-4xl font-bold tabular-nums tracking-tight",
              !fit.fits && "text-destructive",
            )}
          >
            {formatNumber(animated)}
          </span>
          <span className="text-sm text-muted-foreground">tokens</span>
        </div>

        {/* Barra de uso de la ventana */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Ventana de contexto</span>
          <span className={cn("font-mono font-medium tabular-nums", toneTextClass)}>
            {formatPercent(fit.percent)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700 ease-out",
              toneBgClass,
            )}
            style={{ width: `${Math.min(fit.percent, 100)}%` }}
          />
        </div>

        {/* Meta */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Ventana</p>
            <p className="font-mono font-medium tabular-nums">
              {formatWindow(model.contextWindow)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {fit.fits ? "Restante" : "Exceso"}
            </p>
            <p className="font-mono font-medium tabular-nums">
              {fit.fits ? (
                formatWindow(fit.remaining)
              ) : (
                <span className="text-destructive">
                  +{formatCompact(fit.overflow)}
                </span>
              )}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">
              Coste estimado (entrada + {formatNumber(outputTokens)} de salida)
            </p>
            {cost != null ? (
              <p className="font-mono font-medium tabular-nums">
                {formatCost(cost, currency)}
              </p>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="inline-flex cursor-help items-center gap-1 font-mono text-muted-foreground"
                  >
                    —
                    <Info className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-52 text-xs">
                  {PRICE_TODO_HINT}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          {fit.fits ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <Check className="h-3 w-3" />
              Cabe
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              <X className="h-3 w-3" />
              No cabe · +{formatCompact(fit.overflow)}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatMs(result.ms)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
