/**
 * TokenLens — Estimación de tokens de imagen por modelo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Las fórmulas provienen de la documentación pública de cada proveedor y se
 * aplican en local sobre las dimensiones de la imagen (que también se leen en
 * local). NO son conteos oficiales → el resultado se muestra siempre con la
 * insignia 🟡 Estimado.
 *
 * Este módulo es NO React y solo expone DATOS (ids + flag `documented`):
 * los textos visibles (label / expression / desc) viven en el diccionario
 * i18n con las claves "img.formula.<id>.label|.expression|.desc"
 * (src/lib/i18n/dict-data.ts) y se traducen en ImageTokensCard con useT().
 *
 * Fuentes de las fórmulas (documentación pública, verificadas al crear el
 * archivo; revisar al actualizar):
 * - OpenAI (GPT-4o / GPT-4.1 / GPT-5 / o3): tokens = (ancho × alto) / 750,
 *   con un mínimo de 85 tokens por imagen.
 * - OpenAI (GPT-4 Turbo, mosaicos legacy): 85 + mosaicos(512×512) × 170.
 * - Anthropic (Claude 3/4): tokens ≈ (ancho × alto) / 750.
 * - Google (Gemini): 258 tokens por mosaico de 768×768 (mínimo 258; las
 *   imágenes ≤ 384 px en ambos ejes cuentan como un único mosaico).
 * - Resto de proveedores: sin fórmula pública conocida → fórmula genérica
 *   (ancho × alto) / 750, marcada explícitamente como genérica.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ModelConfig } from "@/lib/models.config";
import type { ImageInfo } from "@/lib/types";

export type ImageFormulaId =
  | "openai-750"
  | "openai-tiles-512"
  | "anthropic-750"
  | "google-tiles-768"
  | "generic-750";

export interface ImageFormulaInfo {
  /** la fórmula está documentada oficialmente por el proveedor */
  documented: boolean;
}

export const IMAGE_FORMULAS: Record<ImageFormulaId, ImageFormulaInfo> = {
  "openai-750": { documented: true },
  "openai-tiles-512": { documented: true },
  "anthropic-750": { documented: true },
  "google-tiles-768": { documented: true },
  "generic-750": { documented: false },
};

/** Fórmula que aplica a un modelo concreto. */
export function imageFormulaForModel(model: ModelConfig): ImageFormulaId {
  if (model.provider === "openai") {
    return model.id === "gpt-4-turbo"
      ? "openai-tiles-512"
      : "openai-750";
  }
  if (model.provider === "anthropic") return "anthropic-750";
  if (model.provider === "google") return "google-tiles-768";
  return "generic-750";
}

/** Tokens de una imagen según la fórmula (siempre ≥ 1). */
export function estimateImageTokensFor(
  formula: ImageFormulaId,
  image: ImageInfo,
): number {
  const { width, height } = image;
  switch (formula) {
    case "openai-750":
      return Math.max(85, Math.ceil((width * height) / 750));
    case "openai-tiles-512":
      return (
        85 +
        Math.ceil(width / 512) * Math.ceil(height / 512) * 170
      );
    case "anthropic-750":
      return Math.max(1, Math.ceil((width * height) / 750));
    case "google-tiles-768":
      return Math.max(
        258,
        Math.ceil(width / 768) * Math.ceil(height / 768) * 258,
      );
    case "generic-750":
      return Math.max(1, Math.ceil((width * height) / 750));
  }
}

/** Tokens totales de imagen para un modelo (suma de todas las imágenes). */
export function estimateImageTokensForModel(
  model: ModelConfig,
  images: ImageInfo[],
): number {
  if (!model.vision || images.length === 0) return 0;
  const formula = imageFormulaForModel(model);
  return images.reduce(
    (sum, img) => sum + estimateImageTokensFor(formula, img),
    0,
  );
}
