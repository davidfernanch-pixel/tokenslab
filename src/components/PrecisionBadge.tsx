"use client";

import type { Precision } from "@/lib/models.config";
import { usePrecisionMeta } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Colores por precisión: verde exacto, azul oficial, ámbar estimado. */
const TONE_CLASS: Record<Precision, string> = {
  exact: "border-success/30 bg-success/10 text-success",
  official: "border-google/30 bg-google/10 text-google",
  estimated: "border-warning/30 bg-warning/10 text-warning",
};

export function PrecisionBadge({
  precision,
  size = "md",
}: {
  precision: "exact" | "official" | "estimated";
  size?: "sm" | "md";
}) {
  const META = usePrecisionMeta();
  const meta = META[precision];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium",
              TONE_CLASS[precision],
              size === "sm" ? "gap-1 px-1.5 text-[10px]" : "text-[11px]",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)}
              aria-hidden
            />
            {meta.label}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-52 text-xs"
          collisionPadding={16}
          avoidCollisions
        >
          {meta.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
