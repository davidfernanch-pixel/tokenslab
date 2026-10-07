"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  GitCompareArrows,
  History,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";

import { CompareDialog } from "@/components/CompareDialog";
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
import { currentLocale, usePrecisionMeta, useT } from "@/lib/i18n";
import { getModel } from "@/lib/models.config";
import { useTokenLens } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Tiempo relativo en minutos/horas/días frente a `now` (idioma activo). */
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

const MAX_VISIBLE_RESULTS = 9;

function HistoryRow({
  entry,
  now,
  expanded,
  compareSelected,
  onToggle,
  onToggleCompare,
  onRestore,
  onDelete,
}: {
  entry: HistoryEntry;
  now: number;
  expanded: boolean;
  compareSelected: boolean;
  onToggle: () => void;
  onToggleCompare: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const META = usePrecisionMeta();
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
                expanded
                  ? t("history.row.hideAria")
                  : t("history.row.showAria")
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
              {t("history.chars")}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] tabular-nums">
              {t("history.models", {
                n: entry.results.length,
                plural: entry.results.length === 1 ? "" : "s",
              })}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 border border-transparent",
              compareSelected
                ? "border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={onToggleCompare}
            aria-pressed={compareSelected}
            aria-label={t("history.compare.selectAria", {
              name: entry.name,
            })}
            title={
              compareSelected
                ? t("history.compare.remove")
                : t("history.compare.select")
            }
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
          </Button>
          {entry.hasText ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onRestore}
              aria-label={t("history.restoreAria")}
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
                      aria-label={t("history.restoreAria")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-52">
                  {t("history.tooLarge", {
                    kb: MAX_STORED_TEXT / 1024,
                  })}
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
            aria-label={t("history.deleteAria")}
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
                      META[r.precision].dotClass,
                    )}
                    aria-label={META[r.precision].label}
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
              {t("history.more", { n: hiddenCount })}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function HistoryPanel() {
  const t = useT();
  const analyzeText = useTokenLens((s) => s.analyzeText);

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Selección para comparar (máx. 2; el orden de selección define A y B)
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Se recarga en cada apertura: el diálogo siempre refleja localStorage.
  useEffect(() => {
    if (open) setEntries(loadHistory());
  }, [open]);

  // Entradas seleccionadas que siguen existiendo (ids recortados del histórico
  // se ignoran sin perder el orden de selección).
  const compareEntries = selected
    .map((id) => entries.find((e) => e.id === id))
    .filter((e): e is HistoryEntry => e !== undefined);
  const compareCount = compareEntries.length;
  const entryA = compareEntries[0] ?? null;
  const entryB = compareEntries[1] ?? null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setExpandedId(null);
  }

  function toggleCompare(id: string) {
    const isSelected = selected.includes(id);
    // Un tercer análisis reemplaza al más antiguo: siempre quedan los 2 últimos
    if (!isSelected && selected.length >= 2) {
      toast.info(t("history.compare.rotatedToast"));
    }
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[prev.length - 1], id];
      return [...prev, id];
    });
  }

  function clearSelection() {
    setSelected([]);
  }

  function handleRestore(entry: HistoryEntry) {
    if (!entry.text) return;
    void analyzeText(entry.text, entry.name);
    toast.success(t("history.toast.restored"));
    setOpen(false);
  }

  function handleDelete(id: string) {
    setEntries(removeHistoryEntry(id));
    if (expandedId === id) setExpandedId(null);
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  function handleClear() {
    setEntries(clearHistory());
    setExpandedId(null);
    setSelected([]);
    toast.success(t("history.toast.cleared"));
  }

  const now = Date.now();

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" aria-label={t("history.triggerAria")}>
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t("history.trigger")}</span>
          </Button>
        </DialogTrigger>
  
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("history.title")}</DialogTitle>
            <DialogDescription>{t("history.desc")}</DialogDescription>
          </DialogHeader>
  
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-xl bg-surface-elevated p-3 text-muted-foreground">
                <FolderOpen className="h-6 w-6" />
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t("history.empty")}
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
                  compareSelected={selected.includes(entry.id)}
                  onToggle={() =>
                    setExpandedId((prev) =>
                      prev === entry.id ? null : entry.id,
                    )
                  }
                  onToggleCompare={() => toggleCompare(entry.id)}
                  onRestore={() => handleRestore(entry)}
                  onDelete={() => handleDelete(entry.id)}
                />
              ))}
            </div>
          )}
  
          {entries.length > 0 && compareCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-surface-elevated/50 px-3 py-2">
              <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <GitCompareArrows
                  className="h-3.5 w-3.5 shrink-0 text-primary"
                  aria-hidden
                />
                {compareCount === 2 ? (
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-foreground">
                      {entryA?.name}
                    </span>
                    {" vs "}
                    <span className="font-medium text-foreground">
                      {entryB?.name}
                    </span>
                  </span>
                ) : (
                  <span className="truncate">
                    {t("history.compare.hint")}
                  </span>
                )}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearSelection}
                >
                  {t("history.compare.clear")}
                </Button>
                {compareCount === 2 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCompareOpen(true)}
                  >
                    {t("history.compare.go")}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled>
                    {t("history.compare.compareN", { n: compareCount })}
                  </Button>
                )}
              </div>
            </div>
          )}
  
          <DialogFooter className="items-center gap-3 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t("history.footerNote", {
                max: MAX_HISTORY,
                kb: MAX_STORED_TEXT / 1024,
              })}
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
                  {t("history.clear")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("history.clearConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("history.clearConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClear}
                    className="bg-destructive text-white shadow-xs hover:bg-destructive/90"
                  >
                    {t("history.clearConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de comparación como hermano del principal (no anidado dentro
          del DialogContent): portal propio de Radix sin conflictos de foco. */}
      <CompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        entryA={entryA}
        entryB={entryB}
      />
    </>
  );
}
