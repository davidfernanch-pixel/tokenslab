"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye } from "lucide-react";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatMs, formatNumber } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useTokenLens } from "@/lib/store";
import { tokenizerClient } from "@/lib/tokenizers/client";
import type { SegmentsResult } from "@/lib/tokenizers/segments";
import { cn } from "@/lib/utils";

/** Límite de tokens de la vista previa (el resto se trunca). */
const PREVIEW_TOKENS = 4000;

/** Paleta cíclica de 4 colores: fondos de baja intensidad, borde distinguible. */
const CHIP_PALETTE = [
  "bg-primary/15 border-primary/30",
  "bg-success/15 border-success/30",
  "bg-warning/15 border-warning/30",
  "bg-rose-500/15 border-rose-500/30",
] as const;

/** Hace visible el espacio en blanco: · espacio, ⏎ salto de línea, ⇥ tabulador. */
function showWhitespace(text: string): string {
  return text
    .replace(/ /g, "·")
    .replace(/\n/g, "⏎")
    .replace(/\t/g, "⇥");
}

interface TokenChip {
  key: string;
  title: string;
  display: string;
  className: string;
  whitespaceOnly: boolean;
}

export function TokenVisualizer() {
  const t = useT();
  const locale = useLocale();
  const text = useTokenLens((s) => s.text);
  const status = useTokenLens((s) => s.status);

  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SegmentsResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [percent, setPercent] = useState(0);
  const runId = useRef(0);

  /** Abre/cierra: al cerrar se resetea (reabrir recalcula desde cero). */
  function handleOpenChange(next: boolean) {
    if (next && !text) return;
    setOpen(next);
    if (!next) {
      runId.current += 1; // invalida cualquier ejecución en curso
      setResult(null);
      setFailed(false);
      setPercent(0);
    }
  }

  // Segmenta al abrir (texto no vacío). Los setState viven en callbacks
  // asíncronos, nunca en el cuerpo síncrono del efecto.
  useEffect(() => {
    if (!open || !text) return;
    const id = ++runId.current;
    void (async () => {
      try {
        const res = await tokenizerClient.segments(text, PREVIEW_TOKENS, (p) => {
          if (runId.current === id) setPercent(p);
        });
        if (runId.current !== id) return; // diálogo cerrado o texto cambiado
        setResult(res);
        setPercent(100);
      } catch {
        if (runId.current !== id) return;
        setFailed(true);
      }
    })();
    return () => {
      runId.current += 1;
    };
  }, [open, text]);

  /** Lista de render (memorizada): color por posición y espacios visibles. */
  const chips = useMemo<TokenChip[]>(() => {
    if (!result) return [];
    return result.segments.map((segment, i) => ({
      key: `${segment.start}-${i}`,
      title: t("viz.chipTitle", {
        id: segment.id,
        n: segment.text.length,
      }),
      display: showWhitespace(segment.text),
      className: CHIP_PALETTE[i % CHIP_PALETTE.length],
      whitespaceOnly: /^\s+$/.test(segment.text),
    }));
  }, [result, t]);

  /** Media de caracteres por token de los segmentos mostrados (1 decimal). */
  const avgCharsLabel = useMemo(() => {
    if (!result) return "—";
    const chars = result.segments.reduce((acc, s) => acc + s.text.length, 0);
    const tokens = result.segments.reduce((acc, s) => acc + s.tokens, 0);
    if (tokens <= 0) return "—";
    return (chars / tokens).toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }, [result, locale]);

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
                  data-shortcut="visualizer"
                  aria-label={t("viz.trigger")}
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("viz.trigger")}</span>
                </Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
          {disabled && (
            <TooltipContent className="max-w-52 text-xs">
              {t("viz.analyzeFirst")}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("viz.title")}</DialogTitle>
          <DialogDescription>{t("viz.desc")}</DialogDescription>
        </DialogHeader>

        {!result && !failed && (
          <div className="space-y-2" aria-live="polite">
            <Progress value={percent} aria-label={t("viz.progressAria")} />
            <p className="text-xs text-muted-foreground">
              {t("viz.tokenizing")}
            </p>
          </div>
        )}

        {failed && (
          <Alert variant="destructive">
            <AlertTitle>{t("viz.failed")}</AlertTitle>
          </Alert>
        )}

        {result && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span>
                <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                  {formatNumber(result.totalTokens)}
                </span>{" "}
                {t("common.tokens")}
              </span>
              <span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {avgCharsLabel}
                </span>{" "}
                {t("viz.avgChars")}
              </span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {formatMs(result.ms)}
              </span>
              <PrecisionBadge precision="exact" size="sm" />
            </div>

            <p className="text-xs text-muted-foreground">
              {t("viz.whitespaceNote")}
            </p>

            {result.truncated && (
              <div
                className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
                role="note"
              >
                {t("viz.truncated.a")}{" "}
                <span className="font-mono tabular-nums">
                  {formatNumber(PREVIEW_TOKENS)}
                </span>{" "}
                {t("viz.truncated.b")}{" "}
                <span className="font-mono tabular-nums">
                  {formatNumber(result.totalTokens)}
                </span>
                ).
              </div>
            )}

            <div
              role="group"
              aria-label={t("viz.groupAria")}
              className="custom-scrollbar max-h-[55vh] overflow-y-auto rounded-lg border border-border bg-surface-elevated/50 p-4"
            >
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  title={chip.title}
                  className={cn(
                    "m-0.5 inline rounded-md border px-1.5 py-0.5 font-mono text-xs leading-6 whitespace-pre-wrap break-words",
                    chip.className,
                    chip.whitespaceOnly && "text-muted-foreground",
                  )}
                >
                  {chip.display}
                </span>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
