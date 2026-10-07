/**
 * TokenLens — Extracción de metadatos de imagen (100 % en el navegador).
 *
 * Solo se leen las dimensiones y el tipo MIME: la imagen nunca se envía a
 * ningún servidor. Se usa createImageBitmap (rápido, sin decodificar a canvas)
 * con fallback a HTMLImageElement + object URL para navegadores antiguos.
 */

import type { ImageInfo } from "@/lib/types";

function ext(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "avif",
]);

/** ¿El archivo es una imagen raster admitida? (SVG se trata como texto) */
export function isImageFile(file: File): boolean {
  const extension = ext(file.name);
  if (IMAGE_EXTENSIONS.has(extension)) return true;
  if (file.type.startsWith("image/")) {
    // SVG ya va por la ruta de texto; el resto de image/* se acepta
    return file.type !== "image/svg+xml";
  }
  return false;
}

async function extractWithImageBitmap(file: File): Promise<ImageInfo | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const info: ImageInfo = {
      width: bitmap.width,
      height: bitmap.height,
      mime: file.type || `image/${ext(file.name)}`,
    };
    bitmap.close();
    return info;
  } catch {
    return null;
  }
}

async function extractWithImgElement(file: File): Promise<ImageInfo> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("El navegador no pudo decodificar la imagen."));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      mime: file.type || `image/${ext(file.name)}`,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lee las dimensiones de una imagen en local. */
export async function extractImageInfo(file: File): Promise<ImageInfo> {
  const viaBitmap = await extractWithImageBitmap(file);
  if (viaBitmap && viaBitmap.width > 0 && viaBitmap.height > 0) {
    return viaBitmap;
  }
  const viaImg = await extractWithImgElement(file);
  if (viaImg.width <= 0 || viaImg.height <= 0) {
    throw new Error(
      `No se pudieron leer las dimensiones de “${file.name}” (imagen vacía o corrupta).`,
    );
  }
  return viaImg;
}
