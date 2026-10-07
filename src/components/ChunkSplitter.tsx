"use client";

import { useMemo, useRef, useState } from "react";
import {
  Copy,
  FileArchive,
  FileText,
  Loader2,
  Scissors,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  chunkFileBase,
  chunkStats,
  type TextChunk,
} from "@/lib/chunker";
import { copyToClipboard, downloadBlob } from "@/lib/export";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useTokenLens } from "@/lib/store";
import { tokenizerClient } from "@/lib/tokenizers/client";

/** El divisor procesa como máximo 1 000 000 caracteres (los primeros). */
const MAX_CHUNK_CHARS = 1_000_000;

const DEFAULT_CHUNK_TOKENS = 1024;
const DEFAULT_OVERLAP_TOKENS = 64;

/** Vista previa del fragmento: primeros ~200 caracteres con saltos colapsados. */
function previewOf(text: string): string {
  return text.slice(0, 200).replace(/\r\n|\r|\n/g, "⏎");
}

function chunkTag(index: number): string {
  return `#${String(index + 1).padStart(3, "0")}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface-elevated px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-mono text-sm tabular-nums">{value}</p>
    </div>
  );
}

export function ChunkSplitter() {
  const t = useT();
  const status = useTokenLens((s) => s.status);
  const text = useTokenLens((s) => s.text);
  const fileName = useTokenLens((s) => s.fileName);

  const [open, setOpen] = useState(false);
  const [chunkTokens, setChunkTokens] = useState(DEFAULT_CHUNK_TOKENS);
  const [overlapTokens, setOverlapTokens] = useState(DEFAULT_OVERLAP_TOKENS);
  const [chunks, setChunks] = useState<TextChunk[] | null>(null);
  const [computing, setComputing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** invalida cálculos huérfanos (p. ej. si se cierra el diálogo a mitad) */
  const runRef = useRef(0);

  const stats = useMemo(() => (chunks ? chunkStats(chunks) : null), [chunks]);
  const overLimit = text.length > MAX_CHUNK_CHARS;
  const disabled = status !== "done";

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Al cerrar se descartan los resultados (no se conservan entre sesiones).
      runRef.current++;
      setChunks(null);
      setError(null);
      setProgress(0);
      setComputing(false);
    }
  }

  function updateChunkTokens(value: number[]) {
    setChunkTokens(value[0] ?? DEFAULT_CHUNK_TOKENS);
    // Decisión de UX: al cambiar un ajuste se descartan los resultados previos.
    // Nunca se muestran fragmentos calculados con otros parámetros: el usuario
    // debe pulsar «Calcular fragmentos» de nuevo (acción explícita, sin stale).
    setChunks(null);
    setError(null);
  }

  function updateOverlapTokens(value: number[]) {
    setOverlapTokens(value[0] ?? DEFAULT_OVERLAP_TOKENS);
    setChunks(null);
    setError(null);
  }

  async function handleCompute() {
    if (computing || !text) return;
    const run = ++runRef.current;
    setComputing(true);
    setError(null);
    setChunks(null);
    setProgress(0);
    try {
      const source =
        text.length > MAX_CHUNK_CHARS ? text.slice(0, MAX_CHUNK_CHARS) : text;
      const { chunks: result } = await tokenizerClient.chunks(
        source,
        { chunkTokens, overlapTokens },
        undefined,
        (p) => {
          if (runRef.current === run) setProgress(p);
        },
      );
      if (runRef.current !== run) return;
      setChunks(result);
    } catch {
      if (runRef.current !== run) return;
      setError(t("chunk.error.compute"));
    } finally {
      if (runRef.current === run) setComputing(false);
    }
  }

  async function copyChunk(chunk: TextChunk) {
    const ok = await copyToClipboard(chunk.text);
    if (ok) toast.success(t("chunk.toast.copied", { n: chunk.index + 1 }));
    else toast.error(t("chunk.toast.copyFailed"));
  }

  function handleDownloadTxt() {
    if (!chunks || chunks.length === 0) return;
    const base = chunkFileBase(fileName);
    const content = chunks
      .map(
        (c) =>
          `${t("chunk.file.header", {
            n: String(c.index + 1).padStart(3, "0"),
            tokens: c.tokens,
          })}\n\n${c.text}`,
      )
      .join("\n\n");
    downloadBlob(
      content,
      `${base}${t("chunk.file.txtName")}`,
      "text/plain;charset=utf-8",
    );
  }

  async function handleDownloadZip() {
    if (!chunks || chunks.length === 0 || zipping) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const base = chunkFileBase(fileName);
      const zip = new JSZip();
      chunks.forEach((c, i) => {
        zip.file(
          `${base}${t("chunk.file.chunkName")}${String(i + 1).padStart(3, "0")}.txt`,
          c.text,
        );
      });
      const blob = await zip.generateAsync({ type: "blob" });
      // downloadBlob acepta string, pero Blob([blob]) conserva los bytes tal
      // cual (Blob acepta Blobs como parte), así que el cast es seguro.
      downloadBlob(
        blob as unknown as string,
        `${base}${t("chunk.file.zipName")}`,
        "application/zip",
      );
    } catch {
      toast.error(t("chunk.toast.zipFailed"));
    } finally {
      setZipping(false);
    }
  }

  const triggerButton = (
    <DialogTrigger asChild>
      <Button
        variant="outline"
        disabled={disabled}
        aria-label={t("chunk.triggerAria")}
      >
        <Scissors className="h-4 w-4" />
        <span className="hidden sm:inline">{t("chunk.trigger")}</span>
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {disabled ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span focusable: los botones disabled no disparan hover/focus */}
              <span
                tabIndex={0}
                className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {triggerButton}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-52">
              {t("chunk.analyzeFirst")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        triggerButton
      )}

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("chunk.title")}</DialogTitle>
          <DialogDescription>{t("chunk.desc")}</DialogDescription>
        </DialogHeader>

        {overLimit && (
          <Alert className="border-warning/30 bg-warning/5">
            <TriangleAlert className="text-warning!" />
            <AlertTitle>{t("chunk.limitWarn")}</AlertTitle>
          </Alert>
        )}

        {/* Controles */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="chunk-tokens-slider">
                {t("chunk.tokensPerChunk")}
              </Label>
              <span className="font-mono text-sm tabular-nums">
                {formatNumber(chunkTokens)}
              </span>
            </div>
            <Slider
              id="chunk-tokens-slider"
              aria-label={t("chunk.tokensPerChunk")}
              min={128}
              max={4096}
              step={128}
              value={[chunkTokens]}
              onValueChange={updateChunkTokens}
              disabled={computing}
            />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="overlap-tokens-slider">
                {t("chunk.overlap")}
              </Label>
              <span className="font-mono text-sm tabular-nums">
                {formatNumber(overlapTokens)}
              </span>
            </div>
            <Slider
              id="overlap-tokens-slider"
              aria-label={t("chunk.overlapAria")}
              min={0}
              max={256}
              step={16}
              value={[overlapTokens]}
              onValueChange={updateOverlapTokens}
              disabled={computing}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PrecisionBadge precision="exact" size="sm" />
          <p className="text-xs text-muted-foreground">
            {t("chunk.exactNote")}
          </p>
        </div>

        <Button
          onClick={() => void handleCompute()}
          disabled={computing || !text}
          className="w-full sm:w-auto"
        >
          {computing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Scissors className="h-4 w-4" />
          )}
          {t("chunk.compute")}
        </Button>

        {computing && (
          <div className="space-y-2">
            <Progress value={progress} aria-label={t("chunk.progressAria")} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("chunk.working")}</span>
              <span className="font-mono tabular-nums">{progress} %</span>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{error}</AlertTitle>
            <AlertDescription>{t("chunk.error.hint")}</AlertDescription>
          </Alert>
        )}

        {chunks && stats && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label={t("chunk.stat.count")}
                value={formatNumber(stats.count)}
              />
              <Stat
                label={t("chunk.stat.avg")}
                value={formatNumber(stats.avgTokens)}
              />
              <Stat
                label={t("chunk.stat.min")}
                value={formatNumber(stats.minTokens)}
              />
              <Stat
                label={t("chunk.stat.max")}
                value={formatNumber(stats.maxTokens)}
              />
            </div>

            <div className="custom-scrollbar max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {chunks.map((chunk) => (
                <article
                  key={chunk.index}
                  className="rounded-xl border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
                          {chunkTag(chunk.index)}
                        </span>
                        <span className="font-mono text-xs tabular-nums">
                          {formatNumber(chunk.tokens)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("common.tokens")}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          [{formatNumber(chunk.start)}–{formatNumber(chunk.end)}]
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 break-all font-mono text-xs text-muted-foreground">
                        {previewOf(chunk.text)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-md border"
                      onClick={() => void copyChunk(chunk)}
                      aria-label={t("chunk.copyAria", {
                        n: chunk.index + 1,
                      })}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!chunks && !computing && !error && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-sm text-muted-foreground">
            <Scissors className="h-4 w-4 shrink-0" />
            {t("chunk.emptyHint")}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTxt}
            disabled={!chunks || chunks.length === 0 || computing || zipping}
          >
            <FileText className="h-4 w-4" />
            {t("chunk.downloadTxt")}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDownloadZip()}
            disabled={!chunks || chunks.length === 0 || computing || zipping}
          >
            {zipping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4" />
            )}
            {t("chunk.downloadZip")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
