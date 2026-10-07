"use client";

import { FileText, Image as ImageIcon, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocale, useT } from "@/lib/i18n";
import { selectActiveResults, useTokenLens } from "@/lib/store";
import { formatBytes, formatNumber } from "@/lib/format";
import type { AnalyzedFile } from "@/lib/types";

export function FileStatsBar() {
  const t = useT();
  const locale = useLocale();
  const fileName = useTokenLens((s) => s.fileName);
  const fileSize = useTokenLens((s) => s.fileSize);
  const stats = useTokenLens((s) => s.stats);
  const results = useTokenLens((s) => s.results);
  const activeModels = useTokenLens((s) => s.activeModels);
  const files = useTokenLens((s) => s.files);
  const status = useTokenLens((s) => s.status);
  const removeFile = useTokenLens((s) => s.removeFile);
  const prefersReducedMotion = useReducedMotion() ?? false;

  if (!stats) return null;

  const isBusy = status === "extracting" || status === "counting";
  const active = selectActiveResults(results, activeModels);
  // la media de caracteres/token se calcula solo con tokens de TEXTO:
  // los tokens de imagen dependen de las dimensiones, no de los caracteres
  const avgTextTokens =
    active.length > 0
      ? active.reduce(
          (sum, r) => sum + (r.textTokens ?? (r.imageTokens ? 0 : r.tokens)),
          0,
        ) / active.length
      : 0;
  const imageCount = files.filter((f) => f.kind === "image").length;
  const textCount = files.length - imageCount;

  const items: Array<{ label: string; value: string }> = [
    { label: t("stats.chars"), value: formatNumber(stats.chars) },
    { label: t("stats.words"), value: formatNumber(stats.words) },
    { label: t("stats.lines"), value: formatNumber(stats.lines) },
    { label: t("stats.pages"), value: formatNumber(stats.pages) },
    // solo aparece cuando el análisis incluye imágenes
    ...(imageCount > 0
      ? [{ label: t("stats.images"), value: formatNumber(imageCount) }]
      : []),
    // sin texto (solo imágenes) o sin tokens de referencia la media no
    // aporta nada: se oculta en lugar de mostrar un 0 engañoso.
    ...(stats.chars > 0 && avgTextTokens > 0
      ? [
          {
            label: t("stats.charsPerToken"),
            value: (stats.chars / avgTextTokens).toLocaleString(locale, {
              maximumFractionDigits: 1,
            }),
          },
        ]
      : []),
  ];

  // análisis de solo imágenes: el icono de cabecera pasa a ser de imagen
  const HeadIcon = textCount === 0 && imageCount > 0 ? ImageIcon : FileText;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <HeadIcon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="max-w-[200px] truncate text-sm font-medium sm:max-w-xs">
              {fileName ?? "—"}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatBytes(fileSize ?? 0)}
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-10! sm:block" />

        <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-center">
          {items.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {files.length > 0 && (
        <>
          <Separator className="mt-4" />
          <ul
            aria-label={t("stats.files.aria")}
            className="relative mt-3 flex flex-wrap gap-1.5"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {files.map((file) => (
                <FileChip
                  key={file.id}
                  file={file}
                  busy={isBusy}
                  reducedMotion={prefersReducedMotion}
                  onRemove={(id) => void removeFile(id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}

function FileChip({
  file,
  busy,
  reducedMotion,
  onRemove,
}: {
  file: AnalyzedFile;
  busy: boolean;
  reducedMotion: boolean;
  onRemove: (id: string) => void;
}) {
  const t = useT();
  const isImage = file.kind === "image";

  return (
    <motion.li
      layout={!reducedMotion}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface-elevated/60 py-1 pl-2 pr-1"
    >
      {/* vista previa (URL de objeto local: no pasa por el optimizador de next) */}
      {isImage && file.previewUrl ? (
        <img
          src={file.previewUrl}
          alt={file.name}
          loading="lazy"
          className="h-8 w-8 shrink-0 rounded-md border border-border object-cover"
        />
      ) : isImage ? (
        <ImageIcon
          className="h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden
        />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      )}

      <span
        title={file.name}
        className="max-w-[120px] truncate text-xs sm:max-w-[200px]"
      >
        {file.name}
      </span>

      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
        {isImage && file.imageInfo
          ? `${file.imageInfo.width}×${file.imageInfo.height} px · ${formatBytes(file.sizeBytes)}`
          : formatBytes(file.sizeBytes)}
      </span>

      {!isImage && file.exactTokens != null && (
        <span
          title={t("stats.exactTooltip")}
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] tabular-nums text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          {formatNumber(file.exactTokens)} {t("common.tokens")}
        </span>
      )}
      {!isImage && file.exactTokens == null && busy && (
        <span
          className="shrink-0 font-mono text-[11px] text-muted-foreground"
          aria-hidden
        >
          …
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={t("stats.removeFile", { name: file.name })}
        disabled={busy}
        onClick={() => onRemove(file.id)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </motion.li>
  );
}
