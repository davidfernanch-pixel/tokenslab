/** Extracción de texto de .docx con mammoth (build para navegador). */

export async function extractDocx(file: File): Promise<string> {
  const { default: mammoth } = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.trim();
}
