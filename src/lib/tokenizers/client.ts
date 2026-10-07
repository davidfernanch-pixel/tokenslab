/**
 * Cliente del Web Worker de tokenización.
 * Si el worker no puede crearse (entorno sin soporte), degrada automáticamente
 * al hilo principal con la misma lógica (count.ts / segments.ts / chunker.ts).
 */

import type { CountEvent, CountModel } from "./count";
import type { SegmentsResult } from "./segments";
import type { TextChunk, ChunkOptions } from "@/lib/chunker";

type ResultEvent =
  | { type: "segments-done"; result: SegmentsResult }
  | { type: "chunks-done"; chunks: TextChunk[]; result: SegmentsResult };

interface Pending {
  onEvent?: (event: CountEvent) => void;
  resolve: () => void;
  reject: (err: Error) => void;
  resolveResult?: (value: ResultEvent) => void;
}

class TokenizerClient {
  private worker: Worker | null = null;
  private workerFailed = false;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private ensureWorker(): Worker | null {
    if (this.workerFailed) return null;
    if (this.worker) return this.worker;
    try {
      const worker = new Worker(
        new URL("../../workers/tokenizer.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.onmessage = (e: MessageEvent) => {
        const { id, event } = e.data as {
          id: number;
          event: CountEvent | ResultEvent | { type: "done" };
        };
        const entry = this.pending.get(id);
        if (!entry) return;
        if (event.type === "done") {
          this.pending.delete(id);
          entry.resolve();
        } else if (event.type === "error") {
          this.pending.delete(id);
          entry.reject(new Error(event.message));
        } else if (
          event.type === "segments-done" ||
          event.type === "chunks-done"
        ) {
          this.pending.delete(id);
          entry.resolveResult?.(event);
          entry.resolve();
        } else {
          entry.onEvent?.(event);
        }
      };
      worker.onerror = () => {
        // Worker roto: rechazar pendientes y degradar a hilo principal
        for (const [, entry] of this.pending) {
          entry.reject(new Error("worker-error"));
        }
        this.pending.clear();
        this.failWorker();
      };
      this.worker = worker;
      return worker;
    } catch {
      this.workerFailed = true;
      return null;
    }
  }

  private failWorker(): void {
    this.workerFailed = true;
    this.worker?.terminate();
    this.worker = null;
    console.warn("[TokenLens] Web Worker no disponible: se tokeniza en el hilo principal.");
  }

  async count(
    text: string,
    models: CountModel[],
    onEvent?: (event: CountEvent) => void,
  ): Promise<void> {
    const worker = this.ensureWorker();
    if (worker) {
      try {
        await new Promise<void>((resolve, reject) => {
          const id = this.nextId++;
          this.pending.set(id, { onEvent, resolve, reject });
          worker.postMessage({ id, text, models });
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.message !== "worker-error") throw err;
        // worker-error → fallback silencioso
      }
    }
    const { countAll } = await import("./count");
    await countAll(text, models, onEvent ?? (() => {}));
  }

  /** Segmenta texto en tokens con offsets (para el visualizador). */
  async segments(
    text: string,
    maxTokens?: number,
    onProgress?: (percent: number) => void,
  ): Promise<SegmentsResult> {
    const worker = this.ensureWorker();
    if (worker) {
      try {
        const event = await new Promise<ResultEvent>((resolve, reject) => {
          const id = this.nextId++;
          this.pending.set(id, {
            resolve: () => undefined,
            reject,
            resolveResult: resolve,
            onEvent: onProgress
              ? (ev) => {
                  if (ev.type === "progress") onProgress(ev.percent);
                }
              : undefined,
          });
          worker.postMessage({ id, kind: "segments", text, maxTokens });
        });
        if (event.type !== "segments-done") {
          throw new Error("Respuesta inesperada del worker");
        }
        return event.result;
      } catch (err) {
        if (err instanceof Error && err.message !== "worker-error") throw err;
        // worker-error → fallback silencioso
      }
    }
    const { buildTokenSegments } = await import("./segments");
    return buildTokenSegments(text, { maxTokens, onProgress });
  }

  /** Divide el texto en fragmentos por tokens con solapamiento. */
  async chunks(
    text: string,
    options: ChunkOptions,
    maxTokens?: number,
    onProgress?: (percent: number) => void,
  ): Promise<{ chunks: TextChunk[]; segments: SegmentsResult }> {
    const worker = this.ensureWorker();
    if (worker) {
      try {
        const event = await new Promise<ResultEvent>((resolve, reject) => {
          const id = this.nextId++;
          this.pending.set(id, {
            resolve: () => undefined,
            reject,
            resolveResult: resolve,
            onEvent: onProgress
              ? (ev) => {
                  if (ev.type === "progress") onProgress(ev.percent);
                }
              : undefined,
          });
          worker.postMessage({
            id,
            kind: "chunks",
            text,
            options,
            maxTokens,
          });
        });
        if (event.type !== "chunks-done") {
          throw new Error("Respuesta inesperada del worker");
        }
        return { chunks: event.chunks, segments: event.result };
      } catch (err) {
        if (err instanceof Error && err.message !== "worker-error") throw err;
        // worker-error → fallback silencioso
      }
    }
    const { buildTokenSegments } = await import("./segments");
    const { packSegments } = await import("@/lib/chunker");
    const segments = await buildTokenSegments(text, {
      maxTokens,
      onProgress,
    });
    return { chunks: packSegments(segments.segments, options), segments };
  }
}

export const tokenizerClient = new TokenizerClient();
