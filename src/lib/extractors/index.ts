/**
 * Dispatcher de extracción de texto según el tipo de archivo.
 * Todo ocurre en el navegador: ningún byte sale del dispositivo.
 */

import type { ExtractResult } from "@/lib/types";
import { extractTextFile, isCodeExtension } from "./text";
import { IMAGE_EXTENSIONS, isImageFile } from "./image";

export { isImageFile };
export { IMAGE_EXTENSIONS };

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "csv", "tsv", "json", "geojson", "xml", "html",
  "htm", "log", "yml", "yaml", "toml", "ini", "env", "cfg", "conf",
  "properties", "svg", "srt", "vtt", "rtf",
  // código
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java",
  "c", "h", "cpp", "hpp", "cc", "cxx", "cs", "php", "swift", "kt", "kts",
  "sql", "sh", "bash", "zsh", "ps1", "css", "scss", "sass", "less", "vue",
  "svelte", "dart", "lua", "r", "m", "scala", "pl", "pm", "ex", "exs",
  "erl", "hs", "jl", "jsonc", "json5",
]);

export const SUPPORTED_EXTENSIONS = [
  ...TEXT_EXTENSIONS,
  "pdf",
  "docx",
  "xlsx",
  "xlsm",
  "xls",
  ...IMAGE_EXTENSIONS,
];

/** valor para el atributo accept del input file */
export const ACCEPT_ATTRIBUTE =
  ".txt,.md,.markdown,.csv,.tsv,.json,.geojson,.xml,.html,.htm,.log,.yml,.yaml,.toml,.ini,.env,.cfg,.conf,.properties,.svg,.srt,.vtt,.js,.mjs,.cjs,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.h,.cpp,.hpp,.cc,.cs,.php,.swift,.kt,.sql,.sh,.bash,.ps1,.css,.scss,.vue,.svelte,.dart,.lua,.r,.scala,.pl,.pdf,.docx,.xlsx,.xlsm,.xls,.png,.jpg,.jpeg,.webp,.gif,.avif";

export const SUPPORTED_FORMATS_HINT =
  "TXT · MD · CSV · JSON · XML · HTML · LOG · código (JS, TS, PY, JAVA…) · PDF · DOCX · XLSX · PNG · JPG · WEBP · GIF";

export function getExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isSupportedFile(file: File): boolean {
  if (isImageFile(file)) return true;
  const ext = getExtension(file.name);
  if (ext === "pdf" || ext === "docx" || ext === "xlsx" || ext === "xlsm" || ext === "xls") {
    return true;
  }
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (file.type.startsWith("text/")) return true;
  if (file.type === "application/json" || file.type === "application/xml") return true;
  return false;
}

/**
 * Extrae el texto de un archivo soportado.
 * @param onProgress progreso de extracción (0–100), p. ej. páginas de PDF
 */
export async function extractText(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ExtractResult> {
  const ext = getExtension(file.name);

  if (!isSupportedFile(file)) {
    throw new Error(
      `Formato no compatible: “.${ext || file.type || "desconocido"}”. Admitidos: ${SUPPORTED_FORMATS_HINT}.`,
    );
  }

  if (ext === "pdf") {
    const { extractPdf } = await import("./pdf");
    return extractPdf(file, onProgress);
  }

  if (ext === "docx") {
    const { extractDocx } = await import("./docx");
    return { text: await extractDocx(file) };
  }

  if (ext === "xlsx" || ext === "xlsm" || ext === "xls") {
    const { extractSpreadsheet } = await import("./xlsx");
    return { text: await extractSpreadsheet(file) };
  }

  onProgress?.(100);
  return { text: await extractTextFile(file) };
}

/** ¿El archivo es código? (pista para el estimador) */
export function isCodeFile(fileName: string): boolean {
  return isCodeExtension(getExtension(fileName));
}
