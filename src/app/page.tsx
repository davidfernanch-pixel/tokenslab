"use client";

import { useEffect, useMemo, useRef } from "react";
import { Info, Settings2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BackToTop } from "@/components/BackToTop";
import { Dropzone } from "@/components/Dropzone";
import { FileStatsBar } from "@/components/FileStatsBar";
import { ResultCard } from "@/components/ResultCard";
import { ImageTokensCard } from "@/components/ImageTokensCard";
import { CompareChart, type ChartDatum } from "@/components/CompareChart";
import { ModelTable } from "@/components/ModelTable";
import { ExportMenu } from "@/components/ExportMenu";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ByokStatus } from "@/components/ByokStatus";
import { HfStatus } from "@/components/HfStatus";
import { OutputTokensControl } from "@/components/OutputTokensControl";
import { TokenVisualizer } from "@/components/TokenVisualizer";
import { OptimizerPanel } from "@/components/OptimizerPanel";
import { ChunkSplitter } from "@/components/ChunkSplitter";
import { HistoryPanel } from "@/components/HistoryPanel";
import { MonthlyCalculator } from "@/components/MonthlyCalculator";
import { HowItWorks } from "@/components/HowItWorks";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { selectActiveResults, useTokenLens } from "@/lib/store";
import { getModel } from "@/lib/models.config";
import { canCalcCost } from "@/lib/cost";
import { useT } from "@/lib/i18n";

function ResultSkeleton() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-10 w-40" />
      <Skeleton className="mt-5 h-2 w-full rounded-full" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="mt-5 h-6 w-24 rounded-full" />
    </div>
  );
}

export default function Home() {
  const t = useT();
  const status = useTokenLens((s) => s.status);
  const results = useTokenLens((s) => s.results);
  const activeModels = useTokenLens((s) => s.activeModels);
  const currency = useTokenLens((s) => s.currency);
  const hasImageFiles = useTokenLens((s) =>
    s.files.some((f) => f.kind === "image"),
  );

  // Desplazamiento suave al panel de resultados cuando termina un análisis
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "done" && status === "done") {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    prevStatusRef.current = status;
  }, [status]);

  // Atajos de teclado globales: P = pegar texto, V = visualizador de tokens.
  // Solo con modificadores libres, sin foco en campos de texto y sin diálogos
  // abiertos («?» vive en ShortcutsHelp, Ctrl+Enter en PasteDialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== "p" && key !== "v") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (document.querySelector("[data-state='open']")) return;
      if (key === "p") {
        document
          .querySelector<HTMLElement>('[data-shortcut="paste"]')
          ?.click();
      } else {
        document
          .querySelector<HTMLElement>('[data-shortcut="visualizer"]:not(:disabled)')
          ?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeResults = useMemo(
    () => selectActiveResults(results, activeModels),
    [results, activeModels],
  );

  const showResults =
    status === "counting" || status === "done" || results.length > 0;
  const isCounting = status === "counting";

  const validActiveModels = useMemo(
    () =>
      activeModels
        .map((id) => getModel(id))
        .filter((m): m is NonNullable<typeof m> => m != null),
    [activeModels],
  );

  const chartData = useMemo<ChartDatum[]>(
    () =>
      activeResults.flatMap((r) => {
        const model = getModel(r.modelId);
        if (!model) return [];
        return [
          {
            id: r.modelId,
            name: model.name,
            provider: model.provider,
            tokens: r.tokens,
          },
        ];
      }),
    [activeResults],
  );

  const tableData = useMemo(
    () =>
      activeResults.flatMap((r) => {
        const model = getModel(r.modelId);
        return model ? [{ model, result: r }] : [];
      }),
    [activeResults],
  );

  const pendingCount = Math.max(0, activeModels.length - activeResults.length);

  const anyPriceConfigured = validActiveModels.some((m) =>
    canCalcCost(m, currency),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Hero />

        {/* ── Zona de análisis ─────────────────────────────────────────── */}
        <section
          aria-label={t("page.analysis.section")}
          className="mx-auto w-full max-w-3xl px-4 sm:px-6"
        >
          <Dropzone />

          {/* Utilidades siempre disponibles (histórico y planificación) */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <HistoryPanel />
            <MonthlyCalculator />
          </div>
        </section>

        {/* ── Panel de resultados ──────────────────────────────────────── */}
        {showResults && (
          <section
            ref={resultsRef}
            aria-label={t("page.results.section")}
            aria-live="polite"
            className="mx-auto mt-10 w-full max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6"
          >
            <FileStatsBar />

            {/* Desglose de tokens de imagen (solo con imágenes) */}
            {hasImageFiles && status !== "extracting" && (
              <div className="mt-4">
                <ImageTokensCard />
              </div>
            )}

            {/* Barra de acciones */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("page.results.title")}
                </h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {activeResults.length} / {validActiveModels.length || 0}{" "}
                  {t("page.results.models")}
                </span>
                {isCounting && (
                  <span className="animate-pulse font-mono text-xs text-primary">
                    {t("page.results.counting")}
                  </span>
                )}
                <ByokStatus />
                <HfStatus />
              </div>
              <div className="flex items-center gap-2">
                <SettingsPanel />
                <ExportMenu />
              </div>
            </div>

            {/* Herramientas de análisis (Visualizar / Optimizar / Fragmentar) */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("page.tools")}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-border"
              />
              <TokenVisualizer />
              <OptimizerPanel />
              <ChunkSplitter />
            </div>

            {/* Aviso de precios TODO */}
            {!anyPriceConfigured && validActiveModels.length > 0 && (
              <div
                className="mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4"
                role="note"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-medium">
                    {t("page.priceWarning.title")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("page.priceWarning.body")}
                  </p>
                </div>
              </div>
            )}

            {/* Slider de tokens de salida */}
            <div className="mt-4">
              <OutputTokensControl />
            </div>

            {/* Sin modelos visibles */}
            {validActiveModels.length === 0 && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-6">
                <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">
                    {t("page.noModels.title")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("page.noModels.body", { results: results.length })}{" "}
                    <strong className="font-semibold text-foreground">
                      {t("page.noModels.settings")}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Rejilla de tarjetas por modelo */}
            {validActiveModels.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activeResults.map((result, index) => (
                  <ResultCard key={result.modelId} result={result} index={index} />
                ))}
                {isCounting &&
                  Array.from({ length: Math.min(pendingCount, 3) }).map(
                    (_, i) => <ResultSkeleton key={`skeleton-${i}`} />,
                  )}
              </div>
            )}

            {/* Gráfico comparativo */}
            {chartData.length > 0 && (
              <div className="mt-6">
                <CompareChart data={chartData} />
              </div>
            )}

            {/* Tabla detallada */}
            {tableData.length > 0 && (
              <div className="mt-6">
                <ModelTable data={tableData} />
              </div>
            )}
          </section>
        )}

        <HowItWorks />
        <Faq />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
