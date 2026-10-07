import {
  CURRENCIES,
  type CurrencyCode,
  type ModelConfig,
} from "@/lib/models.config";
import type { FitInfo } from "@/lib/types";

/**
 * ¿Cabe el texto en la ventana de contexto del modelo?
 */
export function fitsContext(tokens: number, model: ModelConfig): FitInfo {
  const percent = (tokens / model.contextWindow) * 100;
  const overflow = Math.max(0, tokens - model.contextWindow);
  const remaining = Math.max(0, model.contextWindow - tokens);
  return {
    fits: overflow === 0,
    percent,
    overflow,
    remaining,
  };
}

/**
 * Coste estimado de una petición (entrada + salida) en la moneda indicada.
 * Devuelve null si falta el precio (TODO) o el tipo de cambio.
 */
export function calcCost(
  tokensIn: number,
  tokensOut: number,
  model: ModelConfig,
  currency: CurrencyCode,
): number | null {
  if (model.priceInPerM == null || model.priceOutPerM == null) return null;
  const rate = CURRENCIES[currency].rate;
  if (rate == null) return null;
  const usd =
    (tokensIn / 1_000_000) * model.priceInPerM +
    (tokensOut / 1_000_000) * model.priceOutPerM;
  return usd * rate;
}

/** ¿Se puede calcular coste para este modelo? (precios + cambio disponibles) */
export function canCalcCost(
  model: ModelConfig,
  currency: CurrencyCode,
): boolean {
  return (
    model.priceInPerM != null &&
    model.priceOutPerM != null &&
    CURRENCIES[currency].rate != null
  );
}

/** Clase de color según el % de ventana usada */
export function usageTone(percent: number): "ok" | "warn" | "over" {
  if (percent >= 100) return "over";
  if (percent >= 75) return "warn";
  return "ok";
}
