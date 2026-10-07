/**
 * Extracción de texto de PDF con pdfjs-dist (en el navegador).
 * El worker de pdfjs se sirve desde /pdf.worker.min.mjs (copiado de
 * node_modules/pdfjs-dist/build a public/; ver package.json → postinstall).
 */

export async function extractPdf(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ text: string; warning?: string }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        if ("str" in item) {
          pageText += item.str;
          if (item.hasEOL) pageText += "\n";
        }
      }
      pages.push(pageText);
      page.cleanup();
      onProgress?.((i / doc.numPages) * 100);
    }

    const text = pages.join("\n").replace(/[ \t]+\n/g, "\n").trim();
    const warning = !text
      ? "El PDF no contiene texto extraíble: parece escaneado o solo contiene imágenes."
      : undefined;
    return { text, warning };
  } finally {
    await loadingTask.destroy();
  }
}
