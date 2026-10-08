"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  HardDriveDownload,
  Info,
  KeyRound,
  RotateCcw,
  Search,
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
  HF_TOKENIZERS,
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  isNewRelease,
  type Provider,
} from "@/lib/models.config";
import { useLang, usePrecisionMeta, useT } from "@/lib/i18n";
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
  const t = useT();

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
          placeholder={
            disabled
              ? t("settings.byok.disabledPlaceholder")
              : t("settings.byok.keyPlaceholder")
          }
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
              aria-label={
                visible
                  ? t("settings.byok.hideKey")
                  : t("settings.byok.showKey")
              }
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
              aria-label={t("settings.byok.clearKey")}
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
  const t = useT();
  const lang = useLang((s) => s.lang);
  const META = usePrecisionMeta();
  const activeModels = useTokenLens((s) => s.activeModels);
  const currency = useTokenLens((s) => s.currency);
  const toggleModel = useTokenLens((s) => s.toggleModel);
  const setActiveModels = useTokenLens((s) => s.setActiveModels);
  const setCurrency = useTokenLens((s) => s.setCurrency);

  const byokEnabled = useByok((s) => s.enabled);
  const byokSetEnabled = useByok((s) => s.setEnabled);
  const byokKeys = useByok((s) => s.keys);

  const hfEnabled = useTokenLens((s) => s.hfEnabled);
  const setHfEnabled = useTokenLens((s) => s.setHfEnabled);

  // Búsqueda de modelos (117 en catálogo): insensible a mayúsculas y acentos
  const [query, setQuery] = useState("");
  const normalizedQuery = useMemo(
    () =>
      query
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim(),
    [query],
  );

  const groups = useMemo(
    () =>
      PROVIDER_ORDER.map((provider) => ({
        provider,
        models: MODELS.filter(
          (m) =>
            m.provider === provider &&
            (normalizedQuery.length === 0 ||
              m.id
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .includes(normalizedQuery) ||
              m.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .includes(normalizedQuery) ||
              PROVIDERS[provider].label.toLowerCase().includes(normalizedQuery)),
        ),
      })).filter((g) => g.models.length > 0),
    [normalizedQuery],
  );

  const matchedModels = useMemo(
    () => groups.reduce((sum, g) => sum + g.models.length, 0),
    [groups],
  );

  /** Activa o desactiva de golpe todos los modelos de un proveedor. */
  const toggleProviderModels = (provider: Provider, ids: string[]) => {
    const allActive = ids.every((id) => activeModels.includes(id));
    setActiveModels(
      allActive
        ? activeModels.filter((id) => !ids.includes(id))
        : [...new Set([...activeModels, ...ids])],
    );
  };

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

  // Modelos activos con tokenizador HF disponible (conteo exacto local)
  const hfActive = MODELS.filter(
    (m) => activeModels.includes(m.id) && m.tokenizer === "hf" && m.hfRepo,
  );
  // Familias únicas que se descargarían con la selección activa
  const hfActiveRepos = [
    ...new Set(hfActive.map((m) => m.hfRepo as string)),
  ];
  const hfActiveMB = hfActiveRepos.reduce(
    (sum, repo) => sum + (HF_TOKENIZERS[repo]?.sizeMB ?? 0),
    0,
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" aria-label={t("settings.openAria")}>
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t("settings.trigger")}</span>
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
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription>{t("settings.desc")}</SheetDescription>
        </SheetHeader>

        {/* Modelos visibles */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Label>{t("settings.models.label")}</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setActiveModels(DEFAULT_ACTIVE_MODELS)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("settings.models.restore")}
            </Button>
          </div>

          {/* Búsqueda (catálogo grande) */}
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("settings.models.search")}
              aria-label={t("settings.models.searchAria")}
              className="h-9 pl-9 pr-8 text-sm"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                aria-label={t("settings.models.searchClear")}
                onClick={() => setQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {normalizedQuery.length > 0 && (
            <p
              className="mt-2 font-mono text-[10px] text-muted-foreground"
              aria-live="polite"
            >
              {matchedModels}/{MODELS.length}
            </p>
          )}

          <div className={matchedModels === 0 ? "pt-6" : ""}>
            {matchedModels === 0 && (
              <p className="rounded-lg bg-surface-elevated p-4 text-center text-xs leading-relaxed text-muted-foreground">
                {t("settings.models.searchEmpty", { query })}
              </p>
            )}
            {groups.map((group) => {
              const activeInGroup = group.models.filter((m) =>
                activeModels.includes(m.id),
              ).length;
              const groupIds = MODELS.filter(
                (m) => m.provider === group.provider,
              ).map((m) => m.id);
              const allProviderActive = groupIds.every((id) =>
                activeModels.includes(id),
              );
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 rounded-full px-2 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      aria-label={t("settings.models.toggleProviderAria", {
                        provider: PROVIDERS[group.provider].label,
                      })}
                      onClick={() => toggleProviderModels(group.provider, groupIds)}
                    >
                      {allProviderActive
                        ? t("settings.models.none")
                        : t("settings.models.all")}
                    </Button>
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
                              {t("common.new")}
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {t("settings.models.window")}{" "}
                          {formatWindowCompact(model.contextWindow)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          META[model.precision].dotClass,
                        )}
                        title={META[model.precision].description}
                        aria-label={META[model.precision].label}
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
                {t("settings.byok.title")}
                {byokEnabled && byokReady > 0 && (
                  <span className="inline-flex items-center rounded-full border border-google/30 bg-google/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-google">
                    {t("settings.byok.active")}
                  </span>
                )}
              </Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("settings.byok.desc")}
              </p>
            </div>
            <Switch
              id="byok-switch"
              checked={byokEnabled}
              onCheckedChange={byokSetEnabled}
              aria-label={t("settings.byok.switchAria")}
            />
          </div>

          <div className="mt-4 space-y-4">
            <ApiKeyField
              provider="anthropic"
              label={t("settings.byok.anthropicKey")}
              color={PROVIDERS.anthropic.color}
              disabled={!byokEnabled}
            />
            <ApiKeyField
              provider="google"
              label={t("settings.byok.googleKey")}
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
              {t("settings.byok.security.a")}
              <code className="font-mono text-[10px]">/api/count</code>
              {t("settings.byok.security.b")}
              {byokEnabled && (
                <>
                  {" "}
                  <span className="text-foreground">
                    {t("settings.byok.counter", {
                      ready: byokReady,
                      total: upgradeable.length,
                    })}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Tokenizadores locales exactos (HF) */}
        <div className="border-t border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="hf-switch" className="flex items-center gap-2">
                {t("settings.hf.title")}
                {hfEnabled && hfActive.length > 0 && (
                  <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-success">
                    {t("settings.hf.active")}
                  </span>
                )}
              </Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("settings.hf.desc")}
              </p>
            </div>
            <Switch
              id="hf-switch"
              checked={hfEnabled}
              onCheckedChange={setHfEnabled}
              aria-label={t("settings.hf.switchAria")}
            />
          </div>

          {/* Familias disponibles con su tamaño aproximado */}
          <ul className="mt-4 space-y-1.5">
            {Object.values(HF_TOKENIZERS).map((info) => {
              const used = hfActiveRepos.includes(info.repo);
              return (
                <li
                  key={info.repo}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-surface-elevated"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: info.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {info.label}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    ≈{info.sizeMB} MB
                  </span>
                  {hfEnabled && (
                    <span
                      className={
                        "shrink-0 rounded-full px-1.5 py-px font-mono text-[9px] font-semibold uppercase " +
                        (used
                          ? "bg-success/10 text-success"
                          : "bg-secondary text-muted-foreground")
                      }
                    >
                      {used ? t("settings.hf.inUse") : t("settings.hf.idle")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-elevated p-3 text-xs leading-relaxed text-muted-foreground">
            <HardDriveDownload
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
              aria-hidden
            />
            <p>
              {t("settings.hf.note.a")}
              {hfEnabled && hfActive.length > 0 && (
                <>
                  {" "}
                  <span className="text-foreground">
                    {t("settings.hf.counter", {
                      n: hfActive.length,
                      mb: hfActiveMB,
                      plural: lang === "es" && hfActive.length !== 1 ? "s" : "",
                    })}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Moneda */}
        <div className="border-t border-border p-6">
          <Label htmlFor="currency-select">{t("settings.currency.label")}</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as "USD" | "EUR")}
          >
            <SelectTrigger id="currency-select" className="mt-2 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">{t("settings.currency.usd")}</SelectItem>
              <SelectItem value="EUR">{t("settings.currency.eur")}</SelectItem>
            </SelectContent>
          </Select>
          {CURRENCIES.EUR.rate == null && currency === "EUR" && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-elevated p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{t("settings.currency.eurNote")}</p>
            </div>
          )}
        </div>

        <p className="px-6 pb-8 text-xs leading-relaxed text-muted-foreground">
          {t("settings.footerNote")}
        </p>
      </SheetContent>
    </Sheet>
  );
}
