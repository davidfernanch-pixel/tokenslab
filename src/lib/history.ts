/**
 * Historial local de análisis. Se guarda en localStorage (clave propia,
 * separada de los ajustes de Zustand) y NUNCA sale del navegador.
 *
 * Se conservan los metadatos + resultados por modelo de cada análisis y,
 * si el texto es pequeño (≤ 512 KB), también el texto para poder restaurarlo.
 */

import type { Precision } from "@/lib/models.config";
import type { FileStats } from "@/lib/types";

const KEY = "tokenlens-history";

/** Máximo de entradas conservadas */
export const MAX_HISTORY = 24;
/** Textos mayores no se guardan (solo metadatos; no se puede restaurar) */
export const MAX_STORED_TEXT = 512 * 1024;

export interface HistoryResult {
  modelId: string;
  tokens: number;
  precision: Precision;
}

export interface HistoryEntry {
  id: string;
  /** marca de tiempo (epoch ms) */
  ts: number;
  kind: "file" | "text";
  name: string;
  size: number;
  chars: number;
  words: number;
  results: HistoryResult[];
  hasText: boolean;
  text?: string;
}

function isEntry(v: unknown): v is HistoryEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.ts === "number" &&
    (e.kind === "file" || e.kind === "text") &&
    typeof e.name === "string" &&
    typeof e.size === "number" &&
    typeof e.chars === "number" &&
    typeof e.words === "number" &&
    Array.isArray(e.results)
  );
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

function save(list: HistoryEntry[]): HistoryEntry[] {
  if (typeof window === "undefined") return list;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Cuota llena: se ignora silenciosamente (el historial es opcional)
  }
  return list;
}

export interface AddEntryInput {
  kind: "file" | "text";
  name: string;
  size: number;
  stats: FileStats;
  text: string;
  results: HistoryResult[];
}

/** Añade una entrada (la más reciente primero) y recorta a MAX_HISTORY. */
export function addHistoryEntry(input: AddEntryInput): HistoryEntry[] {
  const entry: HistoryEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    kind: input.kind,
    name: input.name,
    size: input.size,
    chars: input.stats.chars,
    words: input.stats.words,
    results: input.results,
    hasText: input.text.length <= MAX_STORED_TEXT,
    ...(input.text.length <= MAX_STORED_TEXT ? { text: input.text } : {}),
  };
  // Deduplicado simple: mismo nombre + mismo tamaño + mismos tokens → reemplaza
  const prev = loadHistory();
  const signature = (e: HistoryEntry) =>
    `${e.name}|${e.size}|${e.results.map((r) => r.tokens).join(",")}`;
  const deduped = prev.filter((e) => signature(e) !== signature(entry));
  return save([entry, ...deduped].slice(0, MAX_HISTORY));
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  return save(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory(): HistoryEntry[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }
  return [];
}
