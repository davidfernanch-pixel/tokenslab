import { CURRENCIES, type CurrencyCode } from "@/lib/models.config";
import { currentLocale } from "@/lib/i18n";

/** Formateadores por locale (es-ES usa coma decimal, en-US punto). */
const formatters = {
  "es-ES": {
    number: new Intl.NumberFormat("es-ES"),
    compact: new Intl.NumberFormat("es-ES", {
      notation: "compact",
      maximumFractionDigits: 1,
    }),
  },
  "en-US": {
    number: new Intl.NumberFormat("en-US"),
    compact: new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }),
  },
} as const;

export function formatNumber(n: number): string {
  return formatters[currentLocale()].number.format(n);
}

/** 1234567 → "1,2 M" / "1.2 M" (compacto según idioma) */
export function formatCompact(n: number): string {
  return formatters[currentLocale()].compact.format(n);
}

/** 1536 → "1,5 K tokens" / "1.5 K tokens" estilo chip */
export function formatTokensCompact(n: number): string {
  return `${formatCompact(n)} tokens`;
}

export function formatBytes(bytes: number): string {
  const decSep = currentLocale() === "es-ES" ? "," : ".";
  const fmt = (v: number, d: number) => v.toFixed(d).replace(".", decSep);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${fmt(bytes / 1024, 1)} KB`;
  return `${fmt(bytes / (1024 * 1024), 2)} MB`;
}

/** 0.0521 → "0,0521 $" / "0.0521 $" · null → "—" */
export function formatCost(value: number | null, currency: CurrencyCode): string {
  if (value == null) return "—";
  const { symbol } = CURRENCIES[currency];
  const locale = currentLocale();
  const formatted =
    value !== 0 && Math.abs(value) < 0.01
      ? value.toPrecision(3).replace(".", locale === "es-ES" ? "," : ".")
      : formatters[locale].number.format(Math.round(value * 10000) / 10000);
  return `${formatted} ${symbol}`;
}

/** Precio por 1M con "—" si es TODO */
export function formatPricePerM(value: number | null, currency: CurrencyCode): string {
  if (value == null) return "—";
  return `${formatCost(value, currency)} / 1M`;
}

export function formatPercent(p: number): string {
  const capped = Math.min(p, 9999);
  return `${capped.toLocaleString(currentLocale(), { maximumFractionDigits: 1 })} %`;
}

/** 128000 → "128.000" / "128,000" */
export function formatWindow(n: number): string {
  return formatNumber(n);
}

/** 1048576 → "1,05 M" / "1.05 M" para espacios estrechos */
export function formatWindowCompact(n: number): string {
  return formatCompact(n);
}

export function formatMs(ms: number): string {
  if (ms < 1) return "<1 ms";
  return `${Math.round(ms)} ms`;
}
