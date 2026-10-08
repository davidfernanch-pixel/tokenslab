/**
 * TokenLens — Motor BPE byte-level para tokenizadores abiertos de Hugging Face.
 *
 * Ejecuta el tokenizador REAL de modelos abiertos (Llama 4, Llama 3.3, Mistral
 * Medium/Large 3, DeepSeek V4/V4.1, Qwen 3/3.6/3.8) dentro del Web Worker,
 * sin dependencias externas: descarga el `tokenizer.json` oficial desde la CDN
 * de Hugging Face (con caché en Cache API), lo parsea y replica la semántica
 * del `tokenizers` de HF (Rust):
 *
 *   normalizador (None | NFC) → Split(Regex) aislados en secuencia →
 *   ByteLevel(add_prefix_space=false) → BPE con merges del archivo.
 *
 * Las expresiones regex de HF vienen en sintaxis Rust `fancy-regex`; este
 * módulo las convierte a JS (grupos `(?i: …)` de contracciones, `\s`/`\S`
 * con semántica unicode de Rust). Cualquier construcción no soportada
 * lanza error → el llamante degrada a estimación (nunca cuenta mal).
 *
 * Verificado contra el oráculo de Python `tokenizers` (0.23) con una bateria
 * de 13 textos (español, inglés, CJK, dígitos, código, emoji, espacios,
 * NBSP/BOM/NEL) × 9 tokenizadores: conteos y ids idénticos.
 */

/** Tabla byte↔unicode de GPT-2 (la usan todos los tokenizadores byte-level). */
function bytesToUnicode(): string[] {
  const table = new Array<string>(256);
  const isPrintable = (b: number) =>
    (b >= 33 && b <= 126) || // !..~
    (b >= 161 && b <= 172) || // ¡..¬
    (b >= 174 && b <= 255); // ®..ÿ
  let n = 0;
  for (let b = 0; b < 256; b++) {
    table[b] = isPrintable(b)
      ? String.fromCharCode(b)
      : String.fromCharCode(256 + n++);
  }
  return table;
}

const BYTE_CHARS = bytesToUnicode();

/** Conjunto de espacios en blanco según Rust regex (semántica unicode). */
const RUST_WS_SRC =
  "\\t\\n\\v\\f\\r \\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";

/**
 * Expansión del único grupo inline `(?i: …)` que usan estos tokenizadores:
 * las contracciones inglesas ('s 't 're 've 'm 'll 'd) con cualquier
 * combinación de mayúsculas. JS no soporta `(?i:` → se expanden a mano.
 */
const CONTRACTION_RE = /^\(\?i:'s\|'t\|'re\|'ve\|'m\|'ll\|'d\)$/;
// envuelta en grupo no capturador para que un cuantificador `?` posterior
// (como en Llama-4: `…letras+(?i:'s|…)?`) aplique a TODA la contracción
const CONTRACTION_JS =
  "(?:'(?:[sS]|[tT]|[rR][eE]|[vV][eE]|[mM]|[lL][lL]|[dD]))";

/**
 * Convierte una regex de fancy-regex (Rust) a RegExp de JavaScript.
 * Solo se admiten las construcciones que usan los tokenizadores soportados;
 * ante cualquier duda lanza (honestidad: mejor degradar que contar mal).
 */
export function rustRegexToJs(pattern: string): RegExp {
  let out = "";
  let i = 0;
  let inClass = false;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      if (next === "s") {
        out += inClass
          ? RUST_WS_SRC
          : `(?:[${RUST_WS_SRC}])`;
        i += 2;
        continue;
      }
      if (next === "S") {
        if (inClass) throw new Error(`regex-no-soportada: \\S dentro de clase — ${pattern}`);
        out += `(?:[^${RUST_WS_SRC}])`;
        i += 2;
        continue;
      }
      if (next === "d" || next === "D" || next === "w" || next === "W") {
        // Semántica distinta entre Rust (unicode) y JS (ASCII) → no arriesgar.
        throw new Error(`regex-no-soportada: \\${next} — ${pattern}`);
      }
      out += ch + next;
      i += 2;
      continue;
    }

    if (ch === "[") {
      // `[` no escapado: abre clase (nunca negada con `^` tras `[`? sí puede:
      // `[^…]` — el parser de clases de JS lo maneja igual).
      inClass = true;
      out += ch;
      i++;
      // respetar `^` inicial y `]` literal en primera posición
      if (pattern[i] === "^") {
        out += "^";
        i++;
      }
      if (pattern[i] === "]") {
        out += "]";
        i++;
      }
      continue;
    }
    if (ch === "]" && inClass) {
      inClass = false;
      out += ch;
      i++;
      continue;
    }
    if (!inClass && ch === "(" && pattern.startsWith("(?i:", i)) {
      // grupo inline case-insensitive: solo se admite el literal de contracciones
      const depthEnd = findGroupEnd(pattern, i);
      const group = pattern.slice(i, depthEnd);
      if (!CONTRACTION_RE.test(group)) {
        throw new Error(`regex-no-soportada: ${group}`);
      }
      out += CONTRACTION_JS;
      i = depthEnd;
      continue;
    }

    out += ch;
    i++;
  }

  return new RegExp(out, "ug");
}

/** fin del grupo que empieza en `start` (índice tras el `)` de cierre) */
function findGroupEnd(pattern: string, start: number): number {
  let depth = 0;
  for (let i = start; i < pattern.length; i++) {
    if (pattern[i] === "\\") i++;
    else if (pattern[i] === "(") depth++;
    else if (pattern[i] === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("grupo sin cerrar");
}

// ─── Parseo del tokenizer.json (subconjunto soportado) ─────────────────────

interface RawPreTokenizer {
  type?: string;
  pretokenizers?: RawPreTokenizer[];
  pattern?: { Regex?: string } | string;
  behavior?: string;
  invert?: boolean;
  add_prefix_space?: boolean;
  use_regex?: boolean;
}

interface RawTokenizerJson {
  normalizer?: { type?: string; normalizers?: unknown[] } | null;
  pre_tokenizer?: RawPreTokenizer | null;
  model?: {
    type?: string;
    vocab?: Record<string, number>;
    merges?: (string | [string, string])[];
  };
}

type PreToken = { kind: "split"; re: RegExp } | { kind: "bytelevel" };

class HfTokenizer {
  readonly repo: string;
  private readonly normalizer: (text: string) => string;
  private readonly preTokens: PreToken[];
  private readonly vocab: Set<string>;
  private readonly ranks: Map<string, number>;
  private readonly encoder = new TextEncoder();

  constructor(repo: string, json: RawTokenizerJson) {
    this.repo = repo;

    // ── normalizador: None | NFC | Sequence vacía (todo lo demás lanza) ──
    const norm = json.normalizer;
    if (norm == null || norm.type === null || norm.type === undefined) {
      this.normalizer = (t) => t;
    } else if (norm.type === "NFC") {
      this.normalizer = (t) => t.normalize("NFC");
    } else if (norm.type === "Sequence" && (norm.normalizers ?? []).length === 0) {
      this.normalizer = (t) => t;
    } else {
      throw new Error(`normalizador no soportado: ${norm.type} (${repo})`);
    }

    // ── pre-tokenizador: Sequence de Split(Regex, Isolated) + ByteLevel ──
    this.preTokens = [];
    const walk = (node: RawPreTokenizer | null | undefined): void => {
      if (node == null) return;
      switch (node.type) {
        case "Sequence":
          for (const child of node.pretokenizers ?? []) walk(child);
          return;
        case "Split": {
          if (node.behavior !== "Isolated" || node.invert) {
            throw new Error(`split no soportado: ${node.behavior} invert=${node.invert} (${repo})`);
          }
          const raw = node.pattern;
          const src =
            typeof raw === "string" ? raw : raw?.Regex ?? null;
          if (typeof src !== "string") {
            throw new Error(`split sin regex: ${JSON.stringify(raw)} (${repo})`);
          }
          this.preTokens.push({ kind: "split", re: rustRegexToJs(src) });
          return;
        }
        case "ByteLevel": {
          if (node.add_prefix_space || node.use_regex) {
            throw new Error(
              `bytelevel no soportado: add_prefix_space=${node.add_prefix_space} use_regex=${node.use_regex} (${repo})`,
            );
          }
          this.preTokens.push({ kind: "bytelevel" });
          return;
        }
        default:
          throw new Error(`pre-tokenizador no soportado: ${node.type} (${repo})`);
      }
    };
    walk(json.pre_tokenizer);

    // ── modelo BPE byte-level ──
    const model = json.model;
    if (model?.type !== "BPE" || model.vocab == null || model.merges == null) {
      throw new Error(`modelo no soportado: ${model?.type} (${repo})`);
    }
    this.vocab = new Set(Object.keys(model.vocab));
    this.ranks = new Map();
    let rank = 0;
    for (const merge of model.merges) {
      if (typeof merge === "string") {
        const sp = merge.indexOf(" ");
        if (sp <= 0) throw new Error(`merge inválida: ${merge} (${repo})`);
        const a = merge.slice(0, sp);
        const b = merge.slice(sp + 1);
        if (a.includes(" ") || b.includes(" ")) {
          throw new Error(`merge con espacios ambigua: ${merge} (${repo})`);
        }
        this.ranks.set(pairKey(a, b), rank++);
      } else {
        this.ranks.set(pairKey(merge[0], merge[1]), rank++);
      }
    }
  }

  /** Aplica la pipeline completa y devuelve el número de tokens. */
  count(text: string): number {
    if (!text) return 0;
    const normalized = this.normalizer(text);
    // pre-tokenizar: la primera etapa trabaja sobre el texto completo
    let chunks: string[] = [normalized];
    for (const pre of this.preTokens) {
      if (pre.kind === "split") {
        const next: string[] = [];
        for (const chunk of chunks) next.push(...splitIsolated(chunk, pre.re));
        chunks = next;
      } else {
        // bytelevel: mapear bytes → caracteres unicode
        const next: string[] = [];
        for (const chunk of chunks) next.push(byteEncode(chunk, this.encoder));
        chunks = next;
      }
    }
    let total = 0;
    for (const chunk of chunks) total += this.countWord(chunk);
    return total;
  }

  /** BPE estándar sobre un pre-token ya byte-codificado. */
  private countWord(word: string): number {
    if (word.length === 0) return 0;
    if (this.vocab.has(word)) return 1;

    let parts = Array.from(word);
    while (parts.length > 1) {
      // par con el mejor rank (empate → el más a la izquierda)
      let bestRank = Infinity;
      let bestA = "";
      let bestB = "";
      for (let i = 0; i < parts.length - 1; i++) {
        const rank = this.ranks.get(pairKey(parts[i], parts[i + 1]));
        if (rank != null && rank < bestRank) {
          bestRank = rank;
          bestA = parts[i];
          bestB = parts[i + 1];
        }
      }
      if (bestRank === Infinity) break;

      // fusionar TODAS las apariciones (de izquierda a derecha, sin solapar)
      const merged = bestA + bestB;
      const next: string[] = [];
      let i = 0;
      while (i < parts.length) {
        if (
          i < parts.length - 1 &&
          parts[i] === bestA &&
          parts[i + 1] === bestB
        ) {
          next.push(merged);
          i += 2;
        } else {
          next.push(parts[i]);
          i++;
        }
      }
      parts = next;
    }

    for (const part of parts) {
      if (!this.vocab.has(part)) {
        throw new Error(
          `token fuera de vocabulario en ${this.repo}: ${JSON.stringify(part)}`,
        );
      }
    }
    return parts.length;
  }
}

function pairKey(a: string, b: string): string {
  return a + "\u0001" + b;
}

/** Split con comportamiento Isolated: los matches se aíslan como fragmentos. */
function splitIsolated(text: string, re: RegExp): string[] {
  const out: string[] = [];
  let last = 0;
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** ByteLevel: bytes UTF-8 → caracteres del alfabeto byte-level. */
function byteEncode(text: string, encoder: TextEncoder): string {
  const bytes = encoder.encode(text);
  let out = "";
  for (const b of bytes) out += BYTE_CHARS[b];
  return out;
}

// ─── Carga con caché (Web Worker / hilo principal) ─────────────────────────

export const HF_TOKENIZER_CACHE = "tokenlens-hf-v1";
const HF_CDN_BASE = "https://huggingface.co";

export function hfTokenizerUrl(repo: string): string {
  return `${HF_CDN_BASE}/${repo}/resolve/main/tokenizer.json`;
}

const memoryCache = new Map<string, HfTokenizer>();

export interface HfLoadProgress {
  /** fase de la carga: descarga de red o lectura de caché */
  stage: "download" | "cache";
  percent: number;
}

/**
 * Carga (y cachea) el tokenizador de un repo de HF.
 * Orden: memoria → Cache API → red (la respuesta se guarda en Cache API).
 * Cualquier error se propaga: el llamante degrada a estimación.
 */
export async function loadHfTokenizer(
  repo: string,
  onProgress?: (p: HfLoadProgress) => void,
): Promise<HfTokenizer> {
  const cached = memoryCache.get(repo);
  if (cached) return cached;

  let json: unknown;
  const url = hfTokenizerUrl(repo);

  const fromCache = await readCache(url);
  if (fromCache != null) {
    onProgress?.({ stage: "cache", percent: 100 });
    json = fromCache;
  } else {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HF ${res.status} al descargar ${repo}`);
    }
    const lengthHeader = res.headers.get("content-length");
    const total = lengthHeader ? Number(lengthHeader) : 0;

    if (res.body != null && total > 0 && typeof ReadableStream !== "undefined") {
      // descarga con progreso real (los tokenizer.json pesan 6–28 MB)
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as unknown as BlobPart);
        received += value.length;
        onProgress?.({
          stage: "download",
          percent: Math.min(99, Math.round((received / total) * 100)),
        });
      }
      const blob = new Blob(chunks);
      await writeCache(url, blob);
      json = JSON.parse(await blob.text());
    } else {
      const text = await res.text();
      await writeCache(url, new Blob([text]));
      json = JSON.parse(text);
    }
    onProgress?.({ stage: "download", percent: 100 });
  }

  const tokenizer = new HfTokenizer(repo, json as RawTokenizerJson);
  memoryCache.set(repo, tokenizer);
  return tokenizer;
}

async function readCache(url: string): Promise<unknown | null> {
  try {
    if (typeof caches === "undefined") return null;
    const cache = await caches.open(HF_TOKENIZER_CACHE);
    const hit = await cache.match(url);
    if (!hit) return null;
    return await hit.json();
  } catch {
    return null;
  }
}

async function writeCache(url: string, body: Blob): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(HF_TOKENIZER_CACHE);
    await cache.put(url, new Response(body, { headers: { "Content-Type": "application/json" } }));
  } catch {
    // sin caché persistente: se vuelve a descargar en la próxima sesión
  }
}

/** Parsea un tokenizer.json ya descargado (pruebas y usos sin red). */
export function parseHfTokenizer(repo: string, json: unknown): HfTokenizer {
  return new HfTokenizer(repo, json as RawTokenizerJson);
}

export type { HfTokenizer };
