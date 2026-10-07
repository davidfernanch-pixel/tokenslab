/// <reference lib="webworker" />

import { countAll } from "../lib/tokenizers/count";
import type { CountEvent, CountModel } from "../lib/tokenizers/count";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", async (event: MessageEvent) => {
  const { id, text, models } = event.data as {
    id: number;
    text: string;
    models: CountModel[];
  };
  const post = (e: CountEvent | { type: "done" }) =>
    ctx.postMessage({ id, event: e });
  try {
    await countAll(text, models, post);
    post({ type: "done" });
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
