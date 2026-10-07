/** Extracción de hojas de cálculo (.xlsx, .xlsm, .xls) y valores con SheetJS. */

export async function extractSpreadsheet(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const parts: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    parts.push(
      workbook.SheetNames.length > 1 ? `# Hoja: ${name}\n${csv}` : csv,
    );
  }
  return parts.join("\n\n").trim();
}
