"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
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
import { SAMPLE_TEXT } from "@/lib/sample";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Dropzone() {
  const status = useTokenLens((s) => s.status);
  const error = useTokenLens((s) => s.error);
  const warning = useTokenLens((s) => s.warning);
  const fileName = useTokenLens((s) => s.fileName);
  const fileSize = useTokenLens((s) => s.fileSize);
  const progress = useTokenLens((s) => s.progress);
  const analyzeFile = useTokenLens((s) => s.analyzeFile);
  const analyzeText = useTokenLens((s) => s.analyzeText);
  const reset = useTokenLens((s) => s.reset);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = status === "extracting" || status === "counting";
  const isDone = status === "done" && fileName != null;

  function openPicker() {
    fileInputRef.current?.click();
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir un archivo para analizar sus tokens"
        onClick={() => openPicker()}
        onKeyDown={(e) => {
          // Solo cuando el foco está en la propia zona (no en botones internos).
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void analyzeFile(file);
        }}
        className={cn(
          "relative flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-12",
          isDone && "min-h-0",
          isDragging
            ? "scale-[1.005] border-primary bg-accent/40"
            : isBusy
              ? "border-border bg-card"
              : "cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-surface-elevated/40",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          aria-hidden
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void analyzeFile(file);
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
                {progress?.label ?? "Procesando…"}
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
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fileName}</p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {fileSize != null ? formatBytes(fileSize) : ""}
                    {status === "done" ? " · análisis completado" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPicker();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Cambiar archivo
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Quitar archivo"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#9479FF] shadow-lg shadow-primary/25">
                <FileUp className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-semibold sm:text-2xl">
                Arrastra tu archivo aquí
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                o haz clic para seleccionarlo
              </p>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground/70">
                {SUPPORTED_FORMATS_HINT}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <PasteDialog />
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    void analyzeText(SAMPLE_TEXT, "ejemplo.md");
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Sparkles className="h-4 w-4" />
                  Probar con un ejemplo
                </Button>
              </div>
              <p className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-success" />
                Tu archivo se procesa en local: nunca sale de tu navegador
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle />
          <AlertTitle>No se pudo analizar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && warning && (
        <Alert className="mt-4 border-warning/40 bg-warning/5 text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning!" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
