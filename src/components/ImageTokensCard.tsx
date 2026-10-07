"use client";

import { useMemo } from "react";
import { Image as ImageIcon, ImageOff, Lock } from "lucide-react";

import { PrecisionBadge } from "@/components/PrecisionBadge";
import {
  IMAGE_FORMULAS,
  imageFormulaForModel,
  type ImageFormulaId,
} from "@/lib/imageTokens";
import { getModel, PROVIDERS, type ModelConfig } from "@/lib/models.config";
import { formatNumber } from "@/lib/format";
import { selectActiveResults, useTokenLens } from "@/lib/store";

interface VisionEstimate {
  model: ModelConfig;
  imageTokens: number;
  formulaId: ImageFormulaId;
}

export function ImageTokensCard() {
  const status = useTokenLens((s) => s.status);
  // `files` es una referencia estable del store: el filtro se deran en el
  // render (un selector con .filter() devolvería un array nuevo en cada
  // notificación y rompería la caché de snapshots de zustand v5).
  const files = useTokenLens((s) => s.files);
  const results = useTokenLens((s) => s.results);
  const activeModels = useTokenLens((s) => s.activeModels);

  const activeResults = useMemo(
    () => selectActiveResults(results, activeModels),
    [results, activeModels],
  );

  const images = files.filter((f) => f.kind === "image");

  if (images.length === 0 || status === "idle" || status === "error") {
    return null;
  }

  // modelos activos con visión e imagen contada (filas de la rejilla)
  const visionEstimates: VisionEstimate[] = activeResults.flatMap((r) => {
    if (r.imageTokens == null) return [];
    const model = getModel(r.modelId);
    if (!model?.vision) return [];
    return [
      {
        model,
        imageTokens: r.imageTokens,
        formulaId: imageFormulaForModel(model),
      },
    ];
  });

  // modelos activos sin visión: una nota colectiva en lugar de filas
  const nonVisionProviders: string[] = [];
  let nonVisionCount = 0;
  for (const r of activeResults) {
    const model = getModel(r.modelId);
    if (!model || model.vision) continue;
    nonVisionCount += 1;
    const label = PROVIDERS[model.provider].label;
    if (!nonVisionProviders.includes(label)) nonVisionProviders.push(label);
  }
  const nonVisionSample = nonVisionProviders.slice(0, 2).join(", ");
  const nonVisionEllipsis = nonVisionProviders.length > 2 ? "…" : "";

  // fórmulas realmente usadas (únicas por id, por orden de aparición)
  const usedFormulaIds: ImageFormulaId[] = [];
  for (const { formulaId } of visionEstimates) {
    if (!usedFormulaIds.includes(formulaId)) usedFormulaIds.push(formulaId);
  }

  return (
    <section
      aria-label="Tokens de imagen"
      className="rounded-xl border border-border bg-card p-5"
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ImageIcon className="h-4.5 w-4.5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight">
              Tokens de imagen
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Estimados con las fórmulas públicas de cada proveedor
            </p>
          </div>
        </div>
        <PrecisionBadge precision="estimated" size="sm" />
      </div>

      {/* Tira de imágenes analizadas */}
      <p className="mt-5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Imágenes ({images.length})
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {images.map((file) => {
          const info = file.imageInfo;
          return (
            <figure key={file.id} className="w-14">
              {file.previewUrl ? (
                <img
                  src={file.previewUrl}
                  alt={
                    info
                      ? `${file.name}, ${info.width} por ${info.height} píxeles`
                      : file.name
                  }
                  className="h-14 w-14 rounded-lg border border-border object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface-elevated"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <figcaption className="mt-1">
                <p
                  className="max-w-14 truncate text-[10px] text-muted-foreground"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {info ? `${info.width}×${info.height} px` : "—"}
                </p>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Estimación por modelo con visión */}
      {visionEstimates.length > 0 && (
        <>
          <p className="mt-5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Por modelo de visión
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visionEstimates.map(({ model, imageTokens, formulaId }) => (
              <div
                key={model.id}
                className="rounded-lg border border-border bg-surface-elevated/50 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: PROVIDERS[model.provider].color,
                      }}
                      aria-hidden
                    />
                    <span className="truncate text-xs font-medium">
                      {model.name}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatNumber(imageTokens)}
                  </span>
                </div>
                <span className="mt-1.5 inline-block max-w-full truncate rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] text-muted-foreground">
                  {IMAGE_FORMULAS[formulaId].label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modelos activos sin soporte de imagen */}
      {nonVisionCount > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <ImageOff className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span>
            {nonVisionCount === 1
              ? `1 modelo sin soporte de imagen no lo cuenta (${nonVisionSample}).`
              : `${nonVisionCount} modelos sin soporte de imagen no los cuentan (${nonVisionSample}${nonVisionEllipsis}).`}
          </span>
        </p>
      )}

      {/* Fórmulas usadas y privacidad */}
      <div className="mt-4 space-y-1 border-t border-border pt-3">
        {usedFormulaIds.map((id) => (
          <p key={id} className="text-[10px] text-muted-foreground">
            · {IMAGE_FORMULAS[id].label}:{" "}
            <span className="font-mono">{IMAGE_FORMULAS[id].expression}</span>
          </p>
        ))}
        <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 shrink-0 text-success" aria-hidden />
          Las imágenes se analizan en tu navegador: nunca salen de tu equipo.
        </p>
      </div>
    </section>
  );
}
