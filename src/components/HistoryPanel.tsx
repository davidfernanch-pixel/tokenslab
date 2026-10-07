"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  History,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  clearHistory,
  loadHistory,
  MAX_HISTORY,
  MAX_STORED_TEXT,
  removeHistoryEntry,
  type HistoryEntry,
} from "@/lib/history";
import { formatBytes, formatCompact, formatNumber } from "@/lib/format";
import { getModel } from "@/lib/models.config";
import { PRECISION_META } from "@/lib/types";
import { useTokenLens } from "@/lib/store";
import { cn } from "@/lib/utils";

const relativeFmt = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** Tiempo relativo en minutos/horas/días frente a `now`. */
function relativeTime(ts: number, now: number): string {
  const diff = ts - now;
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 60) return relativeFmt.format(minutes, "minute");
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) < 24) return relativeFmt.format(hours, "hour");
  return relativeFmt.format(Math.round(diff / 86_400_000), "day");
}

const MAX_VISIBLE_RESULTS = 9;

function HistoryRow({
  entry,
  now,
  expanded,
  onToggle,
  onRestore,
  onDelete,
}: {
  entry: HistoryEntry;
  now: number;
  expanded: boolean;
  onToggle: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const visibleResults = entry.results.slice(0, MAX_VISIBLE_RESULTS);
  const hiddenCount = entry.results.length - visibleResults.length;

  return (
    <article className="rounded-xl border bg-card p-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          {entry.kind === "file" ? (
            <FileText className="h-4 w-4" />
          ) : (
            <Type className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-medium" title={entry.name}>
              {entry.name}
            </p>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={
                expanded ? "Ocultar resultados" : "Ver resultados por modelo"
              }
              className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <span>{relativeTime(entry.ts, now)}</span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">
              {formatBytes(entry.size)}
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="font-mono tabular-nums">
                {formatCompact(entry.chars)}
              </span>{" "}
              caracteres
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] tabular-nums">
              {entry.results.length} modelos
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {entry.hasText ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onRestore}
              aria-label="Restaurar análisis"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span focusable: los botones disabled no disparan hover/focus */}
                  <span tabIndex={0} className="inline-flex rounded-md">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled
                      aria-label="Restaurar análisis"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-52">
                  El texto era demasiado grande para guardarse (&gt;{" "}
                  {MAX_STORED_TEXT / 1024} KB)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Eliminar del historial"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 border-t pt-3 sm:grid-cols-3">
          {visibleResults.map((r) => {
            const model = getModel(r.modelId);
            return (
              <div
                key={r.modelId}
                className="min-w-0 rounded-lg bg-surface-elevated px-2 py-1.5"
              >
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      PRECISION_META[r.precision].dotClass,
                    )}
                    aria-label={PRECISION_META[r.precision].label}
                  />
                  <span className="truncate text-[10px] text-muted-foreground">
                    {model?.name ?? r.modelId}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-xs tabular-nums">
                  {formatNumber(r.tokens)}
                </p>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <div className="flex items-center justify-center rounded-lg border border-dashed px-2 py-1.5 text-[10px] text-muted-foreground">
              +{hiddenCount} más
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function HistoryPanel() {
  const analyzeText = useTokenLens((s) => s.analyzeText);

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Se recarga en cada apertura: el diálogo siempre refleja localStorage.
  useEffect(() => {
    if (open) setEntries(loadHistory());
  }, [open]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setExpandedId(null);
  }

  function handleRestore(entry: HistoryEntry) {
    if (!entry.text) return;
    void analyzeText(entry.text, entry.name);
    toast.success("Análisis restaurado");
    setOpen(false);
  }

  function handleDelete(id: string) {
    setEntries(removeHistoryEntry(id));
    if (expandedId === id) setExpandedId(null);
  }

  function handleClear() {
    setEntries(clearHistory());
    setExpandedId(null);
    toast.success("Historial vaciado");
  }

  const now = Date.now();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" aria-label="Ver historial local">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Historial</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Historial local</DialogTitle>
          <DialogDescription>
            Tus últimos análisis, guardados solo en tu navegador. Nunca se
            envían a ningún servidor.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="rounded-xl bg-surface-elevated p-3 text-muted-foreground">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Aún no hay análisis guardados. Analiza un archivo o texto y
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="custom-scrollbar max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                now={now}
                expanded={expandedId === entry.id}
                onToggle={() =>
                  setExpandedId((prev) =>
                    prev === entry.id ? null : entry.id,
                  )
                }
                onRestore={() => handleRestore(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Máximo {MAX_HISTORY} análisis · Se guarda el texto solo si pesa
            menos de {MAX_STORED_TEXT / 1024} KB.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={entries.length === 0}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Vaciar historial
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Vaciar el historial?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClear}
                  className="bg-destructive text-white shadow-xs hover:bg-destructive/90"
                >
                  Vaciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
