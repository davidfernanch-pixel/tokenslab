import { BarChart3, Lock, ShieldCheck, Zap } from "lucide-react";

import { MODELS } from "@/lib/models.config";

/**
 * Hero de la portada: mensaje de privacidad, titular con gradiente de marca
 * en la palabra clave, chips de confianza con tiles de icono y un
 * resplandor violeta flotante detrás del contenido. La zona de subida la
 * coloca la página debajo.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-24 text-center sm:pt-28">
      <div
        className="grid-pattern absolute inset-0 opacity-70"
        aria-hidden="true"
      />
      {/* Resplandor violeta flotante tras la insignia y el titular */}
      <div
        aria-hidden="true"
        className="animate-float-y pointer-events-none absolute inset-x-0 top-14 mx-auto h-56 w-80 rounded-full bg-primary/10 blur-3xl sm:top-16 sm:h-64 sm:w-[30rem]"
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
          ¿Cuántos{" "}
          <span className="bg-gradient-to-r from-primary via-[#9479FF] to-primary bg-clip-text text-transparent">
            tokens
          </span>{" "}
          es tu texto{" "}
          <br className="hidden sm:block" />
          en cada modelo de IA?
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Sube un archivo o pega texto y compara tokens, uso de la ventana de
          contexto y coste estimado entre GPT, Claude, Gemini, Llama, Mistral,
          DeepSeek, Grok y Qwen. Todo el procesamiento ocurre en tu navegador,
          sin subidas ni registro.
        </p>

        {/* Chips de confianza */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10"
              aria-hidden="true"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </span>
            Procesamiento 100 % local
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10"
              aria-hidden="true"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
            </span>
            Resultados al instante
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10"
              aria-hidden="true"
            >
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </span>
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
