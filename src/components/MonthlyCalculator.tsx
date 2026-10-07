"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcMonthlyProjection, normalizeUsage } from "@/lib/monthly";
import { MODELS, getModel, PROVIDERS } from "@/lib/models.config";
import { formatCompact, formatCost, formatNumber } from "@/lib/format";
import { useTokenLens } from "@/lib/store";
import type { ModelResult } from "@/lib/types";

const DEFAULT_TOKENS_IN = 2_000;
const DEFAULT_TOKENS_OUT = 1_000;

/** Prefill de entrada: tokens del resultado del modelo en el store, o 2 000. */
function tokensInPrefill(results: ModelResult[], modelId: string): number {
  const found = results.find((r) => r.modelId === modelId);
  return found && Number.isFinite(found.tokens)
    ? found.tokens
    : DEFAULT_TOKENS_IN;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono tabular-nums"
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Cuerpo de la calculadora: se monta al abrir el diálogo (Radix desmonta el
 * contenido al cerrarlo), de modo que los prefills se leen del store en el
 * momento de la apertura y el formulario empieza limpio en cada sesión.
 */
function MonthlyCalculatorBody() {
  const activeModels = useTokenLens((s) => s.activeModels);
  const results = useTokenLens((s) => s.results);
  const outputTokens = useTokenLens((s) => s.outputTokens);
  const currency = useTokenLens((s) => s.currency);

  const [modelId, setModelId] = useState<string>(() => {
    const first = activeModels.find((id) => getModel(id) != null);
    return first ?? MODELS[0].id;
  });
  const [requestsPerDay, setRequestsPerDay] = useState("100");
  const [days, setDays] = useState("30");
  const [tokensIn, setTokensIn] = useState(() =>
    String(tokensInPrefill(results, modelId)),
  );
  const [tokensOut, setTokensOut] = useState(() =>
    String(
      Number.isFinite(outputTokens) && outputTokens >= 0
        ? outputTokens
        : DEFAULT_TOKENS_OUT,
    ),
  );

  const model = getModel(modelId) ?? MODELS[0];

  const projection = useMemo(
    () =>
      calcMonthlyProjection(
        model,
        normalizeUsage({
          requestsPerDay: Number(requestsPerDay),
          days: Number(days),
          tokensIn: Number(tokensIn),
          tokensOut: Number(tokensOut),
        }),
        currency,
      ),
    [model, requestsPerDay, days, tokensIn, tokensOut, currency],
  );

  function handleModelChange(next: string) {
    setModelId(next);
    // El prefill de entrada sigue al modelo seleccionado.
    setTokensIn(String(tokensInPrefill(results, next)));
  }

  return (
    <>
      {/* Modelo */}
      <div className="space-y-2">
        <Label htmlFor="monthly-model">Modelo</Label>
        <Select value={modelId} onValueChange={handleModelChange}>
          <SelectTrigger id="monthly-model" className="w-full">
            <SelectValue placeholder="Selecciona un modelo" />
          </SelectTrigger>
          <SelectContent className="custom-scrollbar">
            {MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: PROVIDERS[m.provider].color,
                    }}
                    aria-hidden
                  />
                  {m.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Uso diario */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          id="monthly-requests"
          label="Solicitudes por día"
          value={requestsPerDay}
          onChange={setRequestsPerDay}
          min={1}
        />
        <NumberField
          id="monthly-days"
          label="Días al mes"
          value={days}
          onChange={setDays}
          min={1}
          max={31}
        />
        <NumberField
          id="monthly-tokens-in"
          label="Tokens de entrada / solicitud"
          value={tokensIn}
          onChange={setTokensIn}
          min={0}
        />
        <NumberField
          id="monthly-tokens-out"
          label="Tokens de salida / solicitud"
          value={tokensOut}
          onChange={setTokensOut}
          min={0}
        />
      </div>

      {/* Proyección en vivo */}
      <div className="space-y-4 rounded-xl border bg-surface-elevated p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric
            label="Tokens de entrada al mes"
            value={formatCompact(projection.tokensIn)}
          />
          <Metric
            label="Tokens de salida al mes"
            value={formatCompact(projection.tokensOut)}
          />
          <Metric
            label="Solicitudes al mes"
            value={formatNumber(projection.requests)}
          />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Coste estimado al mes
          </p>
          {projection.cost != null ? (
            <p className="mt-1 font-mono text-2xl tabular-nums">
              {formatCost(projection.cost, currency)}
            </p>
          ) : (
            <>
              <p className="mt-1 font-mono text-2xl tabular-nums text-muted-foreground">
                —
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <div className="leading-relaxed">
                  <p className="font-medium">
                    Los precios aún no están configurados
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Rellena{" "}
                    <code className="font-mono text-[11px]">priceInPerM</code> y{" "}
                    <code className="font-mono text-[11px]">priceOutPerM</code>{" "}
                    en{" "}
                    <code className="font-mono text-[11px]">
                      src/lib/models.config.ts
                    </code>{" "}
                    con los valores oficiales. Sin precios no se inventan
                    costes.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Estimación lineal: los proveedores facturan por millón de tokens. El
          uso real varía con cachés y descuentos.
        </p>
      </div>
    </>
  );
}

export function MonthlyCalculator() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" aria-label="Calcular coste mensual">
          <Calculator className="h-4 w-4" />
          <span className="hidden sm:inline">Coste mensual</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Calculadora de coste mensual</DialogTitle>
          <DialogDescription>
            Proyecta tu uso diario a un mes y estima el coste con los precios
            configurados.
          </DialogDescription>
        </DialogHeader>
        <MonthlyCalculatorBody />
      </DialogContent>
    </Dialog>
  );
}
