/**
 * Calculadora de coste mensual: proyecta un uso diario (solicitudes y tokens
 * por solicitud) a un mes y estima el coste con los precios del modelo.
 *
 * Los precios siguen TODO en models.config.ts → el coste se devuelve null y
 * la UI debe mostrar el aviso correspondiente. NO se inventan precios.
 */

import type { CurrencyCode, ModelConfig } from "@/lib/models.config";
import { calcCost } from "@/lib/cost";

export interface MonthlyUsage {
  /** solicitudes por día */
  requestsPerDay: number;
  /** tokens de entrada por solicitud */
  tokensIn: number;
  /** tokens de salida por solicitud */
  tokensOut: number;
  /** días laborables del mes (por defecto 30) */
  days: number;
}

export const DEFAULT_MONTHLY_USAGE: MonthlyUsage = {
  requestsPerDay: 100,
  tokensIn: 2_000,
  tokensOut: 1_000,
  days: 30,
};

export interface MonthlyProjection {
  tokensIn: number;
  tokensOut: number;
  requests: number;
  /** null si el modelo no tiene precios (TODO) o falta el tipo de cambio */
  cost: number | null;
}

export function normalizeUsage(u: Partial<MonthlyUsage>): MonthlyUsage {
  const clampInt = (v: number, min: number, max: number) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min;
  return {
    requestsPerDay: clampInt(u.requestsPerDay ?? 100, 1, 100_000),
    tokensIn: clampInt(u.tokensIn ?? 2_000, 0, 10_000_000),
    tokensOut: clampInt(u.tokensOut ?? 1_000, 0, 10_000_000),
    days: clampInt(u.days ?? 30, 1, 31),
  };
}

export function calcMonthlyProjection(
  model: ModelConfig,
  usage: MonthlyUsage,
  currency: CurrencyCode,
): MonthlyProjection {
  const requests = usage.requestsPerDay * usage.days;
  const tokensIn = usage.tokensIn * requests;
  const tokensOut = usage.tokensOut * requests;
  return {
    requests,
    tokensIn,
    tokensOut,
    cost: calcCost(tokensIn, tokensOut, model, currency),
  };
}
