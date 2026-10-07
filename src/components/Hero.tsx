import { BarChart3, Lock, ShieldCheck, Zap } from "lucide-react";

import { MODELS } from "@/lib/models.config";

/**
 * Hero de la portada: mensaje de privacidad, titular con gradiente de marca
 * y chips de confianza. La zona de subida la coloca la página debajo.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-24 text-center sm:pt-28">
      <div
        className="grid-pattern absolute inset-0 opacity-70"
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-background"
      />
      <div className="relative mx-auto max-w-3xl px-4">
        {/* Chip de privacidad */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <Lock className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          Tu archivo no sale de tu navegador
        </div>

        {/* Titular */}
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          ¿Cuántos tokens es tu texto{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#7C5CFF] to-[#9479FF] bg-clip-text text-transparent">
            en cada modelo de IA?
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Sube un archivo o pega texto y compara tokens, uso de la ventana de
          contexto y coste estimado entre GPT, Claude, Gemini, Llama, Mistral,
          DeepSeek, Grok y Qwen. Todo el procesamiento ocurre en tu navegador,
          sin subidas ni registro.
        </p>

        {/* Chips de confianza */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            Procesamiento 100 % local
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Resultados al instante
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BarChart3
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            <span>
              <span className="font-mono tabular-nums">{MODELS.length}</span>{" "}
              modelos ·{" "}
              <span className="font-mono tabular-nums">8</span> proveedores
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
