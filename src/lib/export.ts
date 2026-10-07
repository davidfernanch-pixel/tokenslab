import type { CurrencyCode, ModelConfig, Provider } from "@/lib/models.config";
import { PROVIDERS } from "@/lib/models.config";
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

function escCSV(value: string | number | boolean): string {
  const s = String(value);
  // separador ';' → compatible con Excel es-ES
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(p: ExportPayload): string {
  const hasImages = p.rows.some(
    (r) => r.result.imageTokens != null && r.result.imageTokens > 0,
  );
  const header = [
    "modelo",
    "proveedor",
    "tokens",
    ...(hasImages ? ["tokens_texto", "tokens_imagen"] : []),
    "precision",
    "ventana_contexto",
    "uso_ventana_%",
    "cabe",
    "exceso_tokens",
    "coste_total",
    "moneda",
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
        r.percent.toFixed(2).replace(".", ","),
        r.fits ? "sí" : "no",
        r.overflow,
        r.costTotal == null ? "pendiente" : r.costTotal.toFixed(6).replace(".", ","),
        p.currency,
      ].join(";"),
    );
  }
  // BOM para que Excel detecte UTF-8
  return "\uFEFF" + lines.join("\n");
}

export function toJSON(p: ExportPayload): string {
  return JSON.stringify(
    {
      herramienta: "TokenLens",
      generado: new Date().toISOString(),
      archivo: p.meta,
      estadisticas: p.stats,
      tokens_salida_estimados: p.outputTokens,
      moneda: p.currency,
      resultados: p.rows.map((r) => ({
        modelo: r.model.name,
        id: r.model.id,
        proveedor: PROVIDERS[r.model.provider].label as Provider,
        tokens: r.result.tokens,
        ...(r.result.textTokens != null ? { tokens_texto: r.result.textTokens } : {}),
        ...(r.result.imageTokens != null
          ? { tokens_imagen: r.result.imageTokens }
          : {}),
        precision: r.result.precision,
        ventana_contexto: r.model.contextWindow,
        uso_ventana_pct: Number(r.percent.toFixed(2)),
        cabe: r.fits,
        exceso_tokens: r.overflow,
        precio_entrada_usd_1m: r.model.priceInPerM,
        precio_salida_usd_1m: r.model.priceOutPerM,
        coste_total: r.costTotal,
      })),
      aviso:
        "Precios pendientes de configurar (TODO en models.config.ts). Ventanas de contexto según documentación pública: verifica antes de usar.",
    },
    null,
    2,
  );
}

export function toMarkdown(p: ExportPayload): string {
  const hasImages = p.rows.some(
    (r) => r.result.imageTokens != null && r.result.imageTokens > 0,
  );
  const lines: string[] = [];
  lines.push("# TokenLens — Resultados");
  lines.push("");
  lines.push(
    `- **Archivo:** ${p.meta.fileName} (${(p.meta.fileSize / 1024).toFixed(1).replace(".", ",")} KB)`,
  );
  lines.push(`- **Caracteres:** ${p.stats.chars.toLocaleString("es-ES")}`);
  lines.push(`- **Palabras:** ${p.stats.words.toLocaleString("es-ES")}`);
  lines.push(`- **Líneas:** ${p.stats.lines.toLocaleString("es-ES")}`);
  lines.push(
    `- **Tokens de salida estimados:** ${p.outputTokens.toLocaleString("es-ES")}`,
  );
  lines.push("");
  if (hasImages) {
    lines.push(
      "| Modelo | Proveedor | Tokens | Texto | Imagen | Ventana | Uso | ¿Cabe? |",
    );
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | :---: |");
  } else {
    lines.push("| Modelo | Proveedor | Tokens | Ventana | Uso | ¿Cabe? |");
    lines.push("| --- | --- | ---: | ---: | ---: | :---: |");
  }
  for (const r of p.rows) {
    const base = `| ${r.model.name} | ${PROVIDERS[r.model.provider].label} | ${r.result.tokens.toLocaleString("es-ES")} (${r.result.precision})`;
    const tail = ` | ${r.model.contextWindow.toLocaleString("es-ES")} | ${r.percent.toFixed(1).replace(".", ",")} % | ${r.fits ? "Sí" : `No (excede en ${r.overflow.toLocaleString("es-ES")})`} |`;
    if (hasImages) {
      lines.push(
        `${base} | ${(r.result.textTokens ?? r.result.tokens).toLocaleString("es-ES")} | ${(r.result.imageTokens ?? 0).toLocaleString("es-ES")}${tail}`,
      );
    } else {
      lines.push(`${base}${tail}`);
    }
  }
  lines.push("");
  if (hasImages) {
    lines.push(
      "> Los tokens de imagen se estiman con las fórmulas públicas de cada proveedor (🟡 estimado).",
    );
  }
  lines.push(
    "> Precios pendientes de configurar (`TODO` en `models.config.ts`). Generado con TokenLens — procesamiento 100 % local.",
  );
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
