/**
 * Cliente del Web Worker de tokenización.
 * Si el worker no puede crearse (entorno sin soporte), degrada automáticamente
 * al hilo principal con la misma lógica (lib/tokenizers/count.ts).
 */

import type { CountEvent, CountModel } from "./count";

interface Pending {
  onEvent?: (event: CountEvent) => void;
  resolve: () => void;
  reject: (err: Error) => void;
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
        const { id, event } = e.data as { id: number; event: CountEvent | { type: "done" } };
        const entry = this.pending.get(id);
        if (!entry) return;
        if (event.type === "done") {
          this.pending.delete(id);
          entry.resolve();
        } else if (event.type === "error") {
          this.pending.delete(id);
          entry.reject(new Error(event.message));
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
}

export const tokenizerClient = new TokenizerClient();
