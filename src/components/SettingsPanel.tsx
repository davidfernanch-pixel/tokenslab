"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Info,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CURRENCIES,
  DEFAULT_ACTIVE_MODELS,
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  isNewRelease,
} from "@/lib/models.config";
import { PRECISION_META } from "@/lib/types";
import { formatWindowCompact } from "@/lib/format";
import { useTokenLens } from "@/lib/store";
import { useByok, type ByokProvider } from "@/lib/byok";
import { cn } from "@/lib/utils";

/** Campo de API key con revelar/ocultar y borrado rápido. */
function ApiKeyField({
  provider,
  label,
  color,
  disabled,
}: {
  provider: ByokProvider;
  label: string;
  color: string;
  disabled: boolean;
}) {
  const value = useByok((s) => s.keys[provider]);
  const setKey = useByok((s) => s.setKey);
  const clearKey = useByok((s) => s.clearKey);
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label
        htmlFor={`byok-${provider}`}
        className="flex items-center gap-2 text-muted-foreground"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        {label}
      </Label>
      <div className="relative">
        <KeyRound
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={`byok-${provider}`}
          type={visible ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          placeholder={disabled ? "Desactivado" : `sk-ant-… / AIza…`}
          value={value}
          disabled={disabled}
          onChange={(e) => setKey(provider, e.target.value)}
          className="pr-20 pl-9 font-mono text-xs"
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={visible ? "Ocultar key" : "Mostrar key"}
              onClick={() => setVisible((v) => !v)}
              disabled={disabled}
            >
              {visible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label="Borrar key"
              onClick={() => clearKey(provider)}
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const activeModels = useTokenLens((s) => s.activeModels);
  const currency = useTokenLens((s) => s.currency);
  const toggleModel = useTokenLens((s) => s.toggleModel);
  const setActiveModels = useTokenLens((s) => s.setActiveModels);
  const setCurrency = useTokenLens((s) => s.setCurrency);

  const byokEnabled = useByok((s) => s.enabled);
  const byokSetEnabled = useByok((s) => s.setEnabled);
  const byokKeys = useByok((s) => s.keys);

  const groups = PROVIDER_ORDER.map((provider) => ({
    provider,
    models: MODELS.filter((m) => m.provider === provider),
  })).filter((g) => g.models.length > 0);

  // Modelos activos que recibirían conteo oficial con la configuración actual
  const upgradeable = MODELS.filter(
    (m) =>
      activeModels.includes(m.id) &&
      m.tokenizer === "estimate" &&
      (m.provider === "anthropic" || m.provider === "google"),
  );
  const byokReady = upgradeable.filter(
    (m) => byokKeys[m.provider as "anthropic" | "google"]?.trim(),
  ).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" aria-label="Abrir ajustes">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Ajustes</span>
          <Badge className="ml-1.5 rounded-full bg-primary/10 px-1.5 font-mono text-[10px] text-primary">
            {activeModels.length}/{MODELS.length}
          </Badge>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="custom-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-6 pr-12 pb-4">
          <SheetTitle>Ajustes</SheetTitle>
          <SheetDescription>
            Tus preferencias se guardan en este navegador (localStorage).
          </SheetDescription>
        </SheetHeader>

        {/* Modelos visibles */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Label>Modelos visibles</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setActiveModels(DEFAULT_ACTIVE_MODELS)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar
            </Button>
          </div>

          <div>
            {groups.map((group) => {
              const activeInGroup = group.models.filter((m) =>
                activeModels.includes(m.id),
              ).length;
              return (
                <section key={group.provider} className="mt-4 first:mt-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: PROVIDERS[group.provider].color,
                      }}
                      aria-hidden
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {PROVIDERS[group.provider].label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {activeInGroup}/{group.models.length}
                    </span>
                  </div>
                  {group.models.map((model) => (
                    <label
                      key={model.id}
                      htmlFor={`model-${model.id}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-elevated"
                    >
                      <Checkbox
                        id={`model-${model.id}`}
                        checked={activeModels.includes(model.id)}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          <span className="truncate">{model.name}</span>
                          {isNewRelease(model) && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                              nuevo
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          ventana {formatWindowCompact(model.contextWindow)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          PRECISION_META[model.precision].dotClass,
                        )}
                        title={PRECISION_META[model.precision].description}
                        aria-label={PRECISION_META[model.precision].label}
                      />
                    </label>
                  ))}
                </section>
              );
            })}
          </div>
        </div>

        {/* Conteo oficial (BYOK) */}
        <div className="border-t border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label
                htmlFor="byok-switch"
                className="flex items-center gap-2"
              >
                Conteo oficial (BYOK)
                {byokEnabled && byokReady > 0 && (
                  <span className="inline-flex items-center rounded-full border border-google/30 bg-google/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-google">
                    activo
                  </span>
                )}
              </Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Añade tus API keys de Anthropic y Google para sustituir la
                estimación 🟡 por el conteo oficial 🔵 de sus APIs en cada
                análisis.
              </p>
            </div>
            <Switch
              id="byok-switch"
              checked={byokEnabled}
              onCheckedChange={byokSetEnabled}
              aria-label="Activar conteo oficial con tus API keys"
            />
          </div>

          <div className="mt-4 space-y-4">
            <ApiKeyField
              provider="anthropic"
              label="Anthropic API key"
              color={PROVIDERS.anthropic.color}
              disabled={!byokEnabled}
            />
            <ApiKeyField
              provider="google"
              label="Google AI Studio key"
              color={PROVIDERS.google.color}
              disabled={!byokEnabled}
            />
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-elevated p-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
              aria-hidden
            />
            <p>
              Las keys se guardan solo en este navegador y se envían
              únicamente al proveedor a través de un proxy sin estado
              (<code className="font-mono text-[10px]">/api/count</code>).
              Nunca se almacenan ni se registran en el servidor.
              {byokEnabled && (
                <>
                  {" "}
                  <span className="text-foreground">
                    {byokReady} de {upgradeable.length} modelos activos
                    recibirán conteo oficial.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Moneda */}
        <div className="border-t border-border p-6">
          <Label htmlFor="currency-select">Moneda para los costes</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as "USD" | "EUR")}
          >
            <SelectTrigger id="currency-select" className="mt-2 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($ dólar)</SelectItem>
              <SelectItem value="EUR">EUR (€ euro)</SelectItem>
            </SelectContent>
          </Select>
          {CURRENCIES.EUR.rate == null && currency === "EUR" && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-elevated p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                El tipo de cambio del euro está pendiente (TODO en
                models.config.ts). Los costes se mostrarán como «—» hasta
                configurarlo.
              </p>
            </div>
          )}
        </div>

        <p className="px-6 pb-8 text-xs leading-relaxed text-muted-foreground">
          Los tokens se calculan siempre para todos los modelos; aquí solo
          eliges cuáles se muestran.
        </p>
      </SheetContent>
    </Sheet>
  );
}
