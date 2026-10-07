/**
 * Generador de PNG de prueba (RGB sólido) para QA de TokenLens.
 * Uso: bun scripts/genpng.ts
 */
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

function crc32(buf: Buffer): number {
  let c: number;
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crc]);
}

function makePng(w: number, h: number, color: [number, number, number]): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = color[0];
    row[2 + x * 3] = color[1];
    row[3 + x * 3] = color[2];
  }
  const raw = Buffer.concat(Array<Buffer>(h).fill(row));
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("/home/z/my-project/download", { recursive: true });
writeFileSync("/home/z/my-project/download/test-1024x768.png", makePng(1024, 768, [124, 92, 255]));
writeFileSync("/home/z/my-project/download/test-800x600.png", makePng(800, 600, [217, 119, 87]));
writeFileSync("/home/z/my-project/download/test-384x384.png", makePng(384, 384, [16, 163, 127]));
writeFileSync(
  "/home/z/my-project/download/multifile-notas.txt",
  "Notas de la reunión de producto.\n\n- Multiarchivo soportado\n- Tokens de imagen por fórmula\n- Comparación de análisis\n\nFin.",
);
writeFileSync(
  "/home/z/my-project/download/multifile-datos.json",
  '{\n  "proyecto": "TokenLens",\n  "fase": 4,\n  "features": ["multiarchivo", "imagenes", "comparacion"]\n}\n',
);
console.log("PNGs + textos de prueba generados en download/");
