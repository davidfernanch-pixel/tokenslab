"use client";

import { motion } from "framer-motion";
import { Check, Image as ImageIcon, ImageOff, Info, Type, X } from "lucide-react";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { getModel, isNewRelease, PROVIDERS } from "@/lib/models.config";
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
import { useT } from "@/lib/i18n";
import type { ModelResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResultCard({
  result,
  index = 0,
}: {
  result: ModelResult;
  /** posición en la rejilla (escalona la animación de entrada) */
  index?: number;
}) {
  const t = useT();
  const outputTokens = useTokenLens((s) => s.outputTokens);
  const currency = useTokenLens((s) => s.currency);
  const hasImages = useTokenLens((s) =>
    s.files.some((f) => f.kind === "image"),
  );
  const animated = useAnimatedNumber(result.tokens);

  const model = getModel(result.modelId);
  if (!model) return null;

  // desglose texto/imagen: presente cuando el análisis incluye imágenes y el
  // modelo tiene visión (el número grande sigue siendo el TOTAL)
  const { imageTokens } = result;
  const textTokens = result.textTokens ?? 0;

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
      aria-label={t("result.aria", {
        name: model.name,
        tokens: result.tokens,
      })}
      className="h-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
        delay: Math.min(index * 0.045, 0.4),
      }}
    >
      <div
        className={cn(
          "group relative h-full overflow-hidden rounded-xl border bg-card p-5",
          "motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg",
          fit.fits
            ? "border-border hover:border-primary/40 motion-safe:hover:shadow-primary/10"
            : "border-destructive/50 hover:border-destructive motion-safe:hover:shadow-destructive/10",
          // conteo oficial (BYOK): acento azul permanente
          result.precision === "official" &&
            "border-google/30 motion-safe:hover:shadow-google/10",
        )}
      >
        {result.precision === "official" && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-google"
            aria-hidden
          />
        )}
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
              <h3 className="flex items-center gap-1.5 truncate text-sm font-semibold leading-tight">
                <span className="truncate">{model.name}</span>
                {isNewRelease(model) && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    {t("common.new")}
                  </span>
                )}
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
          <span className="text-sm text-muted-foreground">{t("common.tokens")}</span>
        </div>

        {/* Desglose texto · imagen (solo con imágenes y modelo con visión) */}
        {imageTokens != null && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <Type className="h-3 w-3 shrink-0" aria-hidden />
            <span>
              {t("result.text")}{" "}
              <span className="font-mono font-medium tabular-nums">
                {formatNumber(textTokens)}
              </span>
            </span>
            <span aria-hidden>·</span>
            <ImageIcon className="h-3 w-3 shrink-0" aria-hidden />
            <span className="inline-flex items-center gap-1">
              {t("result.image")}{" "}
              <span className="font-mono font-medium tabular-nums">
                {formatNumber(imageTokens)}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full bg-warning"
                title={t("result.image.estimateHint")}
              />
            </span>
          </div>
        )}

        {/* Barra de uso de la ventana */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("result.contextWindow")}</span>
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
            <p className="text-muted-foreground">{t("result.window")}</p>
            <p className="font-mono font-medium tabular-nums">
              {formatWindow(model.contextWindow)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {fit.fits ? t("result.remaining") : t("result.overflow")}
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
              {t("result.cost", { n: formatNumber(outputTokens) })}
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
                  {t("result.price.todo")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {fit.fits ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <Check className="h-3 w-3" />
                {t("result.fits")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <X className="h-3 w-3" />
                {t("result.noFits", { n: formatCompact(fit.overflow) })}
              </span>
            )}
            {hasImages && !model.vision && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                title={t("result.noVisionHint")}
              >
                <ImageOff className="h-3 w-3" aria-hidden />
                {t("result.noVision")}
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {formatMs(result.ms)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
