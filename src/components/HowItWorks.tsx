import type { LucideIcon } from "lucide-react";
import { BarChart3, Cpu, Info, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

interface PrecisionLevel {
  dotClass: string;
  title: string;
  description: string;
}

/**
 * Sección «Cómo funciona»: tres pasos y explicación de las insignias
 * de precisión (exacto / oficial / estimado).
 */
export function HowItWorks() {
  const t = useT();

  const STEPS: Step[] = [
    {
      number: "01",
      icon: Upload,
      title: t("how.step1.title"),
      description: t("how.step1.desc"),
    },
    {
      number: "02",
      icon: Cpu,
      title: t("how.step2.title"),
      description: t("how.step2.desc"),
    },
    {
      number: "03",
      icon: BarChart3,
      title: t("how.step3.title"),
      description: t("how.step3.desc"),
    },
  ];

  // Etiquetas de precisión reutilizadas de dict-core (única fuente)
  const PRECISION_LEVELS: PrecisionLevel[] = [
    {
      dotClass: "bg-success",
      title: t("precision.exact"),
      description: t("precision.exact.desc"),
    },
    {
      dotClass: "bg-google",
      title: t("precision.official"),
      description: t("precision.official.desc"),
    },
    {
      dotClass: "bg-warning",
      title: t("precision.estimated"),
      description: t("precision.estimated.desc"),
    },
  ];

  return (
    <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Cabecera */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t("how.kicker")}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t("how.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            {t("how.subtitle")}
          </p>
        </div>

        {/* Pasos */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card
              key={step.number}
              className="rounded-xl border-border bg-card motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:border-primary/30"
            >
              <CardContent className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-gradient-violet font-mono text-sm font-semibold tabular-nums">
                    {step.number}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insignias de precisión */}
        <Card className="mt-12 rounded-xl border-border bg-card p-6">
          <div>
            <h3 className="font-semibold">{t("how.badges.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("how.badges.intro")}
            </p>
            <ul className="mt-5 space-y-4">
              {PRECISION_LEVELS.map((level) => (
                <li key={level.title} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      level.dotClass,
                    )}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold">{level.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-surface-elevated p-4 text-xs leading-relaxed text-muted-foreground">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p>{t("how.config.note")}</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
