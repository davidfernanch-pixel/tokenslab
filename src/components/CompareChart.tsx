"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PROVIDERS, PROVIDER_ORDER, type Provider } from "@/lib/models.config";
import { formatCompact, formatNumber } from "@/lib/format";

export interface ChartDatum {
  id: string;
  name: string;
  provider: Provider;
  tokens: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-md">
      <p className="text-xs font-semibold">{label ?? datum.name}</p>
      <p className="text-[11px] text-muted-foreground">
        {PROVIDERS[datum.provider].label}
      </p>
      <p className="font-mono text-sm font-semibold tabular-nums">
        {formatNumber(datum.tokens)}{" "}
        <span className="font-sans text-xs font-normal text-muted-foreground">
          tokens
        </span>
      </p>
    </div>
  );
}

export function CompareChart({ data }: { data: ChartDatum[] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.tokens - b.tokens),
    [data],
  );

  const legendProviders = useMemo(() => {
    const present = new Set<Provider>(sorted.map((d) => d.provider));
    return PROVIDER_ORDER.filter((p) => present.has(p));
  }, [sorted]);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 p-4 pb-0 sm:p-5 sm:pb-0">
        <div>
          <h3 className="text-sm font-semibold">Comparativa de tokens</h3>
          <p className="text-xs text-muted-foreground">
            Ordenado de menos a más tokens
          </p>
        </div>
        <div className="hidden flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] text-muted-foreground sm:flex">
          {legendProviders.map((provider) => (
            <span key={provider} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PROVIDERS[provider].color }}
                aria-hidden
              />
              {PROVIDERS[provider].label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-2 pb-4 sm:p-4 sm:pb-5">
        <div style={{ height: Math.max(160, sorted.length * 38 + 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sorted}
              margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
              barCategoryGap="24%"
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                type="number"
                tickFormatter={formatCompact}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                stroke="var(--border)"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tickFormatter={(value: string) => value.replace(/ /g, "\u00A0")}
                tick={{ fontSize: 12, fill: "var(--foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{
                  fill: "color-mix(in srgb, var(--foreground) 5%, transparent)",
                }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="tokens" radius={[0, 4, 4, 0]} minPointSize={3}>
                {sorted.map((d) => (
                  <Cell key={d.id} fill={PROVIDERS[d.provider].color} />
                ))}
                <LabelList
                  dataKey="tokens"
                  position="right"
                  formatter={(v: number) => formatCompact(v)}
                  style={{
                    fontSize: 11,
                    fill: "var(--muted-foreground)",
                    fontFamily: "var(--font-jetbrains)",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
