/// <reference lib="webworker" />

import { countAll } from "../lib/tokenizers/count";
import type { CountEvent, CountModel } from "../lib/tokenizers/count";
import { buildTokenSegments } from "../lib/tokenizers/segments";
import type { SegmentsResult } from "../lib/tokenizers/segments";
import { packSegments } from "../lib/chunker";
import type { TextChunk, ChunkOptions } from "../lib/chunker";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

export type WorkerRequest =
  | {
      id: number;
      kind?: "count";
      text: string;
      models: CountModel[];
    }
  | {
      id: number;
      kind: "segments";
      text: string;
      maxTokens?: number;
    }
  | {
      id: number;
      kind: "chunks";
      text: string;
      options: ChunkOptions;
      maxTokens?: number;
    };

export type WorkerEvent =
  | CountEvent
  | { type: "segments-done"; result: SegmentsResult }
  | { type: "chunks-done"; chunks: TextChunk[]; result: SegmentsResult }
  | { type: "done" };

ctx.addEventListener("message", async (event: MessageEvent) => {
  const req = event.data as WorkerRequest;
  const post = (e: WorkerEvent) => ctx.postMessage({ id: req.id, event: e });

  try {
    if (req.kind === "segments" || req.kind === "chunks") {
      const result = await buildTokenSegments(req.text, {
        maxTokens: req.maxTokens,
        onProgress: (percent) => post({ type: "progress", percent }),
      });
      if (req.kind === "segments") {
        post({ type: "segments-done", result });
      } else {
        const chunks = packSegments(result.segments, req.options);
        post({ type: "chunks-done", chunks, result });
      }
      post({ type: "done" });
      return;
    }

    // kind "count" (por defecto) — compatibilidad con mensajes antiguos
    await countAll(req.text, req.models, post);
    post({ type: "done" });
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
