import type { CurrencyCode, ModelConfig, Provider } from "@/lib/models.config";
import { PROVIDERS } from "@/lib/models.config";
import { currentLocale, tSync } from "@/lib/i18n";
import type { AnalysisMeta, FileStats, ModelResult } from "@/lib/types";

export interface ExportRow {
  model: ModelConfig;
  result: ModelResult;
  percent: number;
  fits: boolean;
  overflow: number;
  costTotal: number | null;
}

export interface ExportPayload {
  meta: AnalysisMeta;
  stats: FileStats;
  currency: CurrencyCode;
  outputTokens: number;
  rows: ExportRow[];
}

/**
 * Módulo NO React: las cabeceras y textos visibles de CSV/JSON/Markdown se
 * traducen con tSync (usa el idioma activo del store) y los números se
 * formatean según el locale (coma decimal en ES, punto en EN), igual que
 * lib/format.ts.
 */

function escCSV(value: string | number | boolean): string {
  const s = String(value);
  // separador ';' → compatible con Excel es-ES
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(p: ExportPayload): string {
  const hasImages = p.rows.some(
    (r) => r.result.imageTokens != null && r.result.imageTokens > 0,
  );
  const decSep = currentLocale() === "es-ES" ? "," : ".";
  const header = [
    tSync("export.csv.col.model"),
    tSync("export.csv.col.provider"),
    tSync("export.csv.col.tokens"),
    ...(hasImages
      ? [tSync("export.csv.col.textTokens"), tSync("export.csv.col.imageTokens")]
      : []),
    tSync("export.csv.col.precision"),
    tSync("export.csv.col.contextWindow"),
    tSync("export.csv.col.usage"),
    tSync("export.csv.col.fits"),
    tSync("export.csv.col.overflow"),
    tSync("export.csv.col.cost"),
    tSync("export.csv.col.currency"),
  ];
  const lines = [header.join(";")];
  for (const r of p.rows) {
    lines.push(
      [
        escCSV(r.model.name),
        escCSV(PROVIDERS[r.model.provider].label),
        r.result.tokens,
        ...(hasImages
          ? [r.result.textTokens ?? r.result.tokens, r.result.imageTokens ?? 0]
          : []),
        r.result.precision,
        r.model.contextWindow,
        r.percent.toFixed(2).replace(".", decSep),
        r.fits ? tSync("export.csv.yes") : tSync("export.csv.no"),
        r.overflow,
        r.costTotal == null
          ? tSync("export.csv.pending")
          : r.costTotal.toFixed(6).replace(".", decSep),
        p.currency,
      ].join(";"),
    );
  }
  // BOM para que Excel detecte UTF-8
  return "\uFEFF" + lines.join("\n");
}

export function toJSON(p: ExportPayload): string {
  // f → nombre localizado del campo JSON (claves "export.json.field.*")
  const f = (key: string) => tSync(`export.json.field.${key}`);
  return JSON.stringify(
    {
      [f("tool")]: "TokenLens",
      [f("generated")]: new Date().toISOString(),
      [f("file")]: p.meta,
      [f("stats")]: p.stats,
      [f("outputTokens")]: p.outputTokens,
      [f("currency")]: p.currency,
      [f("results")]: p.rows.map((r) => ({
        [f("model")]: r.model.name,
        id: r.model.id,
        [f("provider")]: PROVIDERS[r.model.provider].label as Provider,
        tokens: r.result.tokens,
        ...(r.result.textTokens != null
          ? { [f("textTokens")]: r.result.textTokens }
          : {}),
        ...(r.result.imageTokens != null
          ? { [f("imageTokens")]: r.result.imageTokens }
          : {}),
        precision: r.result.precision,
        [f("contextWindow")]: r.model.contextWindow,
        [f("usage")]: Number(r.percent.toFixed(2)),
        [f("fits")]: r.fits,
        [f("overflow")]: r.overflow,
        [f("priceIn")]: r.model.priceInPerM,
        [f("priceOut")]: r.model.priceOutPerM,
        [f("cost")]: r.costTotal,
      })),
      [f("notice")]: tSync("export.json.notice"),
    },
    null,
    2,
  );
}

export function toMarkdown(p: ExportPayload): string {
  const hasImages = p.rows.some(
    (r) => r.result.imageTokens != null && r.result.imageTokens > 0,
  );
  const locale = currentLocale();
  const decSep = locale === "es-ES" ? "," : ".";
  const n = (v: number) => v.toLocaleString(locale);
  const lines: string[] = [];
  lines.push(tSync("export.md.title"));
  lines.push("");
  lines.push(
    `- **${tSync("export.md.file")}:** ${p.meta.fileName} (${(p.meta.fileSize / 1024).toFixed(1).replace(".", decSep)} KB)`,
  );
  lines.push(`- **${tSync("export.md.chars")}:** ${n(p.stats.chars)}`);
  lines.push(`- **${tSync("export.md.words")}:** ${n(p.stats.words)}`);
  lines.push(`- **${tSync("export.md.lines")}:** ${n(p.stats.lines)}`);
  lines.push(
    `- **${tSync("export.md.outputTokens")}:** ${n(p.outputTokens)}`,
  );
  lines.push("");
  if (hasImages) {
    lines.push(`| ${tSync("export.md.headImages")} |`);
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | :---: |");
  } else {
    lines.push(`| ${tSync("export.md.head")} |`);
    lines.push("| --- | --- | ---: | ---: | ---: | :---: |");
  }
  for (const r of p.rows) {
    const base = `| ${r.model.name} | ${PROVIDERS[r.model.provider].label} | ${n(r.result.tokens)} (${r.result.precision})`;
    const tail = ` | ${n(r.model.contextWindow)} | ${r.percent.toFixed(1).replace(".", decSep)} % | ${
      r.fits
        ? tSync("export.md.yes")
        : tSync("export.md.no", { n: n(r.overflow) })
    } |`;
    if (hasImages) {
      lines.push(
        `${base} | ${n(r.result.textTokens ?? r.result.tokens)} | ${n(r.result.imageTokens ?? 0)}${tail}`,
      );
    } else {
      lines.push(`${base}${tail}`);
    }
  }
  lines.push("");
  if (hasImages) {
    lines.push(`> ${tSync("export.md.imageNote")}`);
  }
  lines.push(`> ${tSync("export.md.footerNote")}`);
  return lines.join("\n");
}

export function downloadBlob(
  content: string | Blob,
  filename: string,
  mime?: string,
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback para contextos sin Clipboard API
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}
