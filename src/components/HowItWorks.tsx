import type { LucideIcon } from "lucide-react";
import { BarChart3, Cpu, Info, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: Upload,
    title: "Sube o pega",
    description:
      "Arrastra un archivo (PDF, DOCX, XLSX, TXT, MD, código…) o pega texto directamente. Nada viaja a ningún servidor.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Tokenizamos en local",
    description:
      "Contamos los tokens con el tokenizador oficial cuando existe versión para navegador (OpenAI: o200k_base y cl100k_base) y con estimación por ratio para el resto. Web Workers evitan congelar la interfaz.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Compara y decide",
    description:
      "Ventana de contexto usada, coste estimado por petición y qué modelos admiten tu texto, en tarjetas, gráfico y tabla.",
  },
];

interface PrecisionLevel {
  dotClass: string;
  title: string;
  description: string;
}

const PRECISION_LEVELS: PrecisionLevel[] = [
  {
    dotClass: "bg-success",
    title: "Exacto",
    description:
      "Tokenizador real del proveedor ejecutado en tu navegador (insignia verde).",
  },
  {
    dotClass: "bg-google",
    title: "Oficial (API)",
    description:
      "Conteo oficial del proveedor vía API con tu propia key — modo BYOK en camino (insignia azul).",
  },
  {
    dotClass: "bg-warning",
    title: "Estimado",
    description:
      "Aproximación por ratio: caracteres ÷ ratio del modelo, ajustada por idioma y contenido (insignia ámbar).",
  },
];

/**
 * Sección «Cómo funciona»: tres pasos y explicación de las insignias
 * de precisión (exacto / oficial / estimado).
 */
export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Cabecera */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Cómo funciona
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Tres pasos, cero servidores
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            TokenLens cuenta tokens en tu navegador con el tokenizador real
            cuando es posible, y con una estimación calibrada para el resto.
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
            <h3 className="font-semibold">Las insignias de precisión</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada resultado muestra cómo se ha calculado:
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
              <p>
                Modelos, ventanas de contexto y precios viven en un único
                archivo de configuración (models.config.ts). Los precios están
                marcados como TODO hasta rellenarlos desde las páginas oficiales
                de cada proveedor: no se muestra ningún precio inventado.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
