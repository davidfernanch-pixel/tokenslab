import { CURRENCIES, type CurrencyCode } from "@/lib/models.config";

const numberFmt = new Intl.NumberFormat("es-ES");
const compactFmt = new Intl.NumberFormat("es-ES", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** 1234567 → "1,2 M" (es-ES compacto) */
export function formatCompact(n: number): string {
  return compactFmt.format(n);
}

/** 1536 → "1,5 K tokens" estilo chip */
export function formatTokensCompact(n: number): string {
  return `${compactFmt.format(n)} tokens`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace(".", ",")} MB`;
}

/** 0.0521 → "0,0521 $" · null → "—" */
export function formatCost(value: number | null, currency: CurrencyCode): string {
  if (value == null) return "—";
  const { symbol } = CURRENCIES[currency];
  const formatted =
    value !== 0 && Math.abs(value) < 0.01
      ? value.toPrecision(3).replace(".", ",")
      : numberFmt.format(Math.round(value * 10000) / 10000);
  return `${formatted} ${symbol}`;
}

/** Precio por 1M con "—" si es TODO */
export function formatPricePerM(value: number | null, currency: CurrencyCode): string {
  if (value == null) return "—";
  return `${formatCost(value, currency)} / 1M`;
}

export function formatPercent(p: number): string {
  const capped = Math.min(p, 9999);
  return `${capped.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`;
}

/** 128000 → "128.000" */
export function formatWindow(n: number): string {
  return numberFmt.format(n);
}

/** 1048576 → "1,05 M" para espacios estrechos */
export function formatWindowCompact(n: number): string {
  return compactFmt.format(n);
}

export function formatMs(ms: number): string {
  if (ms < 1) return "<1 ms";
  return `${Math.round(ms)} ms`;
}
