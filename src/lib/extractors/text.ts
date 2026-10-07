/** Extracción de archivos de texto plano y código. */

const CODE_EXTENSIONS = new Set([
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java",
  "c", "h", "cpp", "hpp", "cc", "cxx", "cs", "php", "swift", "kt", "kts",
  "sql", "sh", "bash", "zsh", "ps1", "css", "scss", "sass", "less", "vue",
  "svelte", "dart", "lua", "r", "m", "scala", "pl", "pm", "ex", "exs",
  "erl", "hs", "jl", "jsonc", "json5",
]);

export function isCodeExtension(ext: string): boolean {
  return CODE_EXTENSIONS.has(ext);
}

/** Ratio de caracteres de control (excl. \n \r \t) para detectar binarios */
function controlRatio(text: string): number {
  let control = 0;
  const sample = text.slice(0, 4096);
  for (const ch of sample) {
    const code = ch.charCodeAt(0);
    if (code < 32 && ch !== "\n" && ch !== "\r" && ch !== "\t") control++;
  }
  return control / Math.max(1, sample.length);
}

/**
 * Lee un archivo como texto con detección de codificación:
 * UTF-8 primero; si produce demasiados caracteres de reemplazo, reintenta
 * con windows-1252 (codificación "rara" típica de ES).
 */
export async function extractTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

  const bad = (text.match(/\uFFFD/g) ?? []).length;
  if (bad > 0 && bad > text.length * 0.0005) {
    try {
      text = new TextDecoder("windows-1252").decode(buffer);
    } catch {
      /* mantener UTF-8 */
    }
  }

  if (text.includes("\u0000") || controlRatio(text) > 0.1) {
    throw new Error(
      "El archivo parece binario o no contiene texto extraíble. Formatos admitidos: .txt, .md, .csv, .json, .xml, .html, .log, código (.js, .ts, .py, .java…), .pdf, .docx y .xlsx.",
    );
  }

  return text;
}
