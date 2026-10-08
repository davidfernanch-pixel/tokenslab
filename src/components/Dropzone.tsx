"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  FilePlus2,
  Files,
  FileText,
  FileUp,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PasteDialog } from "@/components/PasteDialog";
import { useTokenLens } from "@/lib/store";
import { ACCEPT_ATTRIBUTE, SUPPORTED_FORMATS_HINT } from "@/lib/extractors";
import { useSampleText, useT } from "@/lib/i18n";
import { MAX_FILES } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** cómo tratar los archivos elegidos respecto al análisis actual */
type PickerMode = "replace" | "add";

/**
 * ¿Nació el evento dentro de un portal de Radix (diálogo, popover…)?
 *
 * El contenido de esos portales se monta en document.body, pero React
 * burbujea los eventos sintéticos por el ÁRBOL DE COMPONENTES: sin este
 * filtro, cualquier clic dentro de un diálogo hijo (la «x» de cerrar,
 * «Cancelar», el propio textarea de «Pegar texto»…) acabaría disparando
 * el onClick de la zona y abriría el selector de archivos.
 */
function isFromPortal(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      "[role='dialog'], [data-radix-popper-content-wrapper]",
    ) != null
  );
}

export function Dropzone() {
  const t = useT();
  const sampleText = useSampleText();
  const status = useTokenLens((s) => s.status);
  const error = useTokenLens((s) => s.error);
  const warning = useTokenLens((s) => s.warning);
  const fileName = useTokenLens((s) => s.fileName);
  const fileSize = useTokenLens((s) => s.fileSize);
  const files = useTokenLens((s) => s.files);
  const progress = useTokenLens((s) => s.progress);
  const analyzeFiles = useTokenLens((s) => s.analyzeFiles);
  const analyzeText = useTokenLens((s) => s.analyzeText);
  const reset = useTokenLens((s) => s.reset);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // El mismo input oculto sirve para "Cambiar archivo" y "Añadir más":
  // se recuerda el modo justo antes de abrir el selector.
  const pickerModeRef = useRef<PickerMode>("replace");

  const isBusy = status === "extracting" || status === "counting";
  const isDone = status === "done" && fileName != null;
  const isMulti = isDone && files.length > 1;
  const imageCount = files.filter((f) => f.kind === "image").length;

  function openPicker(mode: PickerMode) {
    pickerModeRef.current = mode;
    fileInputRef.current?.click();
  }

  // Clic en la zona: con un lote ya analizado se añade; en el resto de
  // casos se empieza de cero (coincide con el botón primario visible).
  const zonePickerMode: PickerMode = isMulti ? "add" : "replace";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={t("drop.zone.aria")}
        onClick={(e) => {
          if (isFromPortal(e.target)) return;
          openPicker(zonePickerMode);
        }}
        onKeyDown={(e) => {
          // Solo cuando el foco está en la propia zona (no en botones internos).
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker(zonePickerMode);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isFromPortal(e.target)) setIsDragging(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!isFromPortal(e.target)) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (isFromPortal(e.target)) return;
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (isFromPortal(e.target)) return;
          setIsDragging(false);
          const dropped = Array.from(e.dataTransfer.files);
          // Si ya hay un análisis en curso, lo soltado se añade al lote.
          if (dropped.length > 0) {
            void analyzeFiles(dropped, files.length > 0 ? "add" : "replace");
          }
        }}
        className={cn(
          "group relative flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-12",
          isDone && "min-h-0 border-solid!",
          isDragging
            ? "scale-[1.005] border-primary bg-primary/10 shadow-glow"
            : isBusy
              ? "border-border bg-card"
              : "cursor-pointer border-border bg-card/70 hover:border-primary/60 hover:bg-card",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          aria-hidden
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            if (selected.length > 0) {
              void analyzeFiles(selected, pickerModeRef.current);
            }
            e.target.value = "";
          }}
        />

        <AnimatePresence mode="wait">
          {isBusy ? (
            <motion.div
              key="busy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full max-w-sm flex-col items-center"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium">
                {progress?.label ?? t("drop.busy.fallback")}
              </p>
              <Progress
                value={progress?.percent ?? 0}
                className="mt-3 h-1.5 w-full"
              />
              <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">
                {progress?.percent ?? 0} %
              </p>
            </motion.div>
          ) : isDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full flex-row flex-wrap items-center justify-between gap-4 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {isMulti ? (
                    <Files className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  {isMulti ? (
                    <>
                      <p className="text-sm font-medium">
                        {t("drop.done.files", { n: files.length })}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">
                        {fileSize != null ? formatBytes(fileSize) : ""}
                        {t("drop.done.completed")}
                        {imageCount > 0
                          ? ` · ${t(
                              imageCount === 1
                                ? "drop.done.image"
                                : "drop.done.images",
                              { n: imageCount },
                            )}`
                          : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="truncate text-sm font-medium">{fileName}</p>
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">
                        {fileSize != null ? formatBytes(fileSize) : ""}
                        {status === "done" ? t("drop.done.completed") : ""}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Pegar texto sigue disponible con un lote ya analizado
                    (sustituye el análisis actual), también con la tecla «P». */}
                <PasteDialog size="sm" />
                {isMulti ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPicker("add");
                    }}
                  >
                    <FilePlus2 className="h-4 w-4" />
                    {t("drop.button.addMore")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPicker("replace");
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("drop.button.changeFile")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label={
                    isMulti
                      ? t("drop.button.removeAll")
                      : t("drop.button.remove")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#9479FF] shadow-lg shadow-primary/25 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
                  isDragging
                    ? "animate-pulse-soft rotate-3 scale-125"
                    : "group-hover:scale-110",
                )}
              >
                <FileUp className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-semibold sm:text-2xl">
                {t("drop.title")}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("drop.subtitle")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("drop.maxFiles", { n: MAX_FILES })}
              </p>
              <div className="mt-4 flex max-w-md flex-wrap items-center justify-center gap-1.5">
                {SUPPORTED_FORMATS_HINT.split(" · ").map((format) => (
                  <span
                    key={format}
                    className="rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {format}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <PasteDialog />
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    void analyzeText(sampleText, t("drop.sample.file"));
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  {t("drop.sample")}
                </Button>
              </div>
              <p className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-success" />
                {t("drop.privacy")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle />
          <AlertTitle>{t("drop.error.title")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && warning && (
        <Alert className="mt-4 border-warning/40 bg-warning/5 text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning!" />
          <AlertTitle>{t("drop.warning.title")}</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
