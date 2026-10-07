"use client";

import { useMemo, useState } from "react";
import { CircleCheck, RefreshCw, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  applySuggestions,
  buildSuggestions,
  estimateSavings,
  type SuggestionId,
} from "@/lib/optimizer";
import { formatCompact, formatNumber, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useTokenLens } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Píldora de riesgo: verde = sin riesgo semántico, ámbar = revisar el resultado. */
function RiskPill({ risk }: { risk: "safe" | "review" }) {
  const t = useT();
  return risk === "safe" ? (
    <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
      {t("opt.riskSafe")}
    </span>
  ) : (
    <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
      {t("opt.riskReview")}
    </span>
  );
}

export function OptimizerPanel() {
  const t = useT();
  const text = useTokenLens((s) => s.text);
  const status = useTokenLens((s) => s.status);
  const codeHint = useTokenLens((s) => s.codeHint);
  const fileName = useTokenLens((s) => s.fileName);
  const analyzeText = useTokenLens((s) => s.analyzeText);

  const [open, setOpen] = useState(false);
  /** Desmarcadas por el usuario: por defecto van marcadas todas las aplicables. */
  const [deselected, setDeselected] = useState<SuggestionId[]>([]);

  /** Abre/cierra: al cerrar se restauran los defaults (sin efectos). */
  function handleOpenChange(next: boolean) {
    if (next && !text) return;
    setOpen(next);
    if (!next && deselected.length > 0) setDeselected([]);
  }

  /** Informe instantáneo (sin worker), calculado solo con el diálogo abierto. */
  const report = useMemo(
    () => (open && text ? buildSuggestions(text, codeHint) : null),
    [open, text, codeHint],
  );

  const selectedIds = useMemo(() => {
    if (!report) return [] as SuggestionId[];
    return report.suggestions
      .filter((s) => s.applicable && !deselected.includes(s.id))
      .map((s) => s.id);
  }, [report, deselected]);

  /** Texto resultante de aplicar la selección (resumen en vivo del pie). */
  const optimized = useMemo(
    () => (open && text ? applySuggestions(text, selectedIds, codeHint) : null),
    [open, text, selectedIds, codeHint],
  );

  const savings = useMemo(() => {
    if (!text || optimized == null) return null;
    return estimateSavings(text, optimized);
  }, [text, optimized]);

  const hasApplicable =
    report != null && report.suggestions.some((s) => s.applicable);
  const nothingSelected = selectedIds.length === 0;
  const canApply = savings != null && savings.tokensSaved > 0;

  function toggle(id: SuggestionId, checked: boolean) {
    setDeselected((prev) =>
      checked
        ? prev.filter((x) => x !== id)
        : prev.includes(id)
          ? prev
          : [...prev, id],
    );
  }

  function handleApply() {
    if (!optimized || !canApply) return;
    void analyzeText(
      optimized,
      `${fileName ?? t("opt.fallbackName")} ${t("opt.optimizedNameSuffix")}`,
    );
    toast.success(t("opt.toast.applied"));
    setOpen(false);
  }

  const disabled = status !== "done";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* span envolvente: los botones deshabilitados no reciben hover */}
            <span className="inline-flex">
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  aria-label={t("opt.triggerAria")}
                >
                  <WandSparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("opt.trigger")}</span>
                </Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
          {disabled && (
            <TooltipContent className="max-w-52 text-xs">
              {t("opt.analyzeFirst")}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("opt.title")}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {t("opt.desc.a")}{" "}
            <PrecisionBadge precision="estimated" size="sm" />
            {" "}
            {t("opt.desc.b")}
          </DialogDescription>
        </DialogHeader>

        {report &&
          (hasApplicable ? (
            <div className="custom-scrollbar max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {report.suggestions.map((s) => (
                <label
                  key={s.id}
                  htmlFor={`optimizer-${s.id}`}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-border bg-surface-elevated/50 p-3 transition-colors",
                    s.applicable
                      ? "cursor-pointer hover:border-primary/40"
                      : "cursor-default opacity-50",
                  )}
                >
                  <Checkbox
                    id={`optimizer-${s.id}`}
                    checked={s.applicable && selectedIds.includes(s.id)}
                    disabled={!s.applicable}
                    onCheckedChange={(v) => toggle(s.id, v === true)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    {s.applicable ? (
                      <>
                        <span className="font-mono text-xs text-success">
                          +{formatNumber(s.charsSaved)} {t("opt.charsUnit")}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatPercent(s.percent)}
                        </span>
                        <RiskPill risk={s.risk} />
                      </>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-elevated/30 px-6 py-10 text-center">
              <CircleCheck className="h-5 w-5 text-success" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {t("opt.allClear")}
              </p>
            </div>
          ))}

        <div
          className="rounded-lg border border-border bg-surface-elevated/50 p-3"
          aria-live="polite"
        >
          {!hasApplicable || nothingSelected || optimized == null || savings == null ? (
            <p className="text-xs text-muted-foreground">
              {t("opt.nothingSelected")}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs tabular-nums">
              <span className="text-muted-foreground">
                {t("opt.summary.text")}{" "}
                <span className="font-medium text-foreground">
                  {formatCompact(text.length)}
                </span>{" "}
                →{" "}
                <span className="font-medium text-foreground">
                  {formatCompact(optimized.length)}
                </span>{" "}
                {t("opt.summary.chars")}
              </span>
              <span className="text-muted-foreground">
                {t("opt.summary.savings")}{" "}
                <span className="font-medium text-success">
                  {formatNumber(savings.tokensSaved)}
                </span>{" "}
                {t("common.tokens")} (−{formatPercent(savings.percent)})
              </span>
              <PrecisionBadge precision="estimated" size="sm" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t("opt.footerNote")}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleApply} disabled={!canApply}>
              <RefreshCw className="h-4 w-4" />
              {t("opt.apply")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
