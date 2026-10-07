"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTokenLens } from "@/lib/store";
import { formatCompact, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = [0, 256, 1024, 4096, 16384] as const;

export function OutputTokensControl() {
  const outputTokens = useTokenLens((s) => s.outputTokens);
  const setOutputTokens = useTokenLens((s) => s.setOutputTokens);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="shrink-0 sm:w-64">
          <Label htmlFor="output-tokens-slider">
            Tokens de respuesta esperados
          </Label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Se suman a la entrada para estimar el coste total por petición.
          </p>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Slider
              id="output-tokens-slider"
              value={[outputTokens]}
              min={0}
              max={32768}
              step={64}
              onValueChange={(v) => setOutputTokens(v[0] ?? 0)}
              aria-label="Tokens de respuesta esperados"
              className="flex-1"
            />
            <span className="w-20 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
              {formatNumber(outputTokens)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={outputTokens === preset ? "secondary" : "ghost"}
                aria-pressed={outputTokens === preset}
                onClick={() => setOutputTokens(preset)}
                className={cn(
                  "h-7 rounded-full px-2.5 font-mono text-[11px]",
                  outputTokens === preset &&
                    "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
                )}
              >
                {preset === 0 ? "0" : formatCompact(preset)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
