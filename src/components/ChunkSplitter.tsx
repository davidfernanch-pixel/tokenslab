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
      setError(
        "No se pudieron calcular los fragmentos. Inténtalo de nuevo o usa un texto más corto.",
      );
    } finally {
      if (runRef.current === run) setComputing(false);
    }
  }

  async function copyChunk(chunk: TextChunk) {
    const ok = await copyToClipboard(chunk.text);
    if (ok) toast.success(`Fragmento ${chunk.index + 1} copiado`);
    else toast.error("No se pudo copiar el fragmento");
  }

  function handleDownloadTxt() {
    if (!chunks || chunks.length === 0) return;
    const base = chunkFileBase(fileName);
    const content = chunks
      .map(
        (c) =>
          `───── Fragmento ${String(c.index + 1).padStart(3, "0")} (${c.tokens} tokens) ─────\n\n${c.text}`,
      )
      .join("\n\n");
    downloadBlob(content, `${base}-fragmentos.txt`, "text/plain;charset=utf-8");
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
          `${base}-fragmento-${String(i + 1).padStart(3, "0")}.txt`,
          c.text,
        );
      });
      const blob = await zip.generateAsync({ type: "blob" });
      // downloadBlob acepta string, pero Blob([blob]) conserva los bytes tal
      // cual (Blob acepta Blobs como parte), así que el cast es seguro.
      downloadBlob(
        blob as unknown as string,
        `${base}-fragmentos.zip`,
        "application/zip",
      );
    } catch {
      toast.error("No se pudo generar el ZIP");
    } finally {
      setZipping(false);
    }
  }

  const triggerButton = (
    <DialogTrigger asChild>
      <Button
        variant="outline"
        disabled={disabled}
        aria-label="Dividir en fragmentos"
      >
        <Scissors className="h-4 w-4" />
        <span className="hidden sm:inline">Fragmentar</span>
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
              Analiza un archivo o texto primero
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        triggerButton
      )}

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Divisor de fragmentos</DialogTitle>
          <DialogDescription>
            Trocea el texto en bloques de N tokens exactos (o200k_base) con
            solapamiento para RAG y prompts largos.
          </DialogDescription>
        </DialogHeader>

        {overLimit && (
          <Alert className="border-warning/30 bg-warning/5">
            <TriangleAlert className="text-warning!" />
            <AlertTitle>
              El divisor procesa como máximo 1 000 000 caracteres; se
              fragmentarán solo los primeros.
            </AlertTitle>
          </Alert>
        )}

        {/* Controles */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="chunk-tokens-slider">Tokens por fragmento</Label>
              <span className="font-mono text-sm tabular-nums">
                {formatNumber(chunkTokens)}
              </span>
            </div>
            <Slider
              id="chunk-tokens-slider"
              aria-label="Tokens por fragmento"
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
                Solapamiento (tokens)
              </Label>
              <span className="font-mono text-sm tabular-nums">
                {formatNumber(overlapTokens)}
              </span>
            </div>
            <Slider
              id="overlap-tokens-slider"
              aria-label="Solapamiento en tokens"
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
            Fragmentación exacta con el tokenizador de OpenAI en tu navegador.
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
          Calcular fragmentos
        </Button>

        {computing && (
          <div className="space-y-2">
            <Progress value={progress} aria-label="Progreso de fragmentación" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tokenizando y empaquetando…</span>
              <span className="font-mono tabular-nums">{progress} %</span>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{error}</AlertTitle>
            <AlertDescription>
              El texto se procesa íntegramente en tu navegador; si el error
              persiste, prueba con un texto más corto.
            </AlertDescription>
          </Alert>
        )}

        {chunks && stats && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Fragmentos" value={formatNumber(stats.count)} />
              <Stat label="Media tokens" value={formatNumber(stats.avgTokens)} />
              <Stat label="Mín. tokens" value={formatNumber(stats.minTokens)} />
              <Stat label="Máx. tokens" value={formatNumber(stats.maxTokens)} />
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
                          tokens
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
                      aria-label={`Copiar fragmento ${chunk.index + 1}`}
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
            Ajusta el tamaño y pulsa Calcular fragmentos.
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTxt}
            disabled={!chunks || chunks.length === 0 || computing || zipping}
          >
            <FileText className="h-4 w-4" />
            Descargar .txt
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
            Descargar ZIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
