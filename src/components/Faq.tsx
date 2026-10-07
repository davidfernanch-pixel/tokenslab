import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqEntry {
  value: string;
  question: string;
  answer: string;
}

const FAQS: FaqEntry[] = [
  {
    value: "privacidad",
    question: "¿Mi archivo se sube a algún servidor?",
    answer:
      "No. La extracción de texto (PDF, DOCX, XLSX…) y el conteo de tokens ocurren íntegramente en tu navegador usando Web Workers. Puedes desactivar la red y la herramienta seguirá funcionando. Única excepción documentada: si activas el modo BYOK, el TEXTO ya extraído se envía a la API del proveedor correspondiente con tu propia key para obtener el conteo oficial — siempre con la insignia azul visible.",
  },
  {
    value: "byok",
    question: "¿Qué es el conteo oficial (modo BYOK)?",
    answer:
      "BYOK (Bring Your Own Key): activas el modo en Ajustes, pegas tu API key de Anthropic o Google y, tras cada análisis, TokenLens consulta el endpoint público de conteo de tokens (count_tokens / countTokens) y sustituye la estimación 🟡 por el número oficial 🔵. Las keys viven solo en tu navegador (localStorage) y viajan únicamente al proveedor a través de un proxy sin estado que no las guarda. No funciona con imágenes (el conteo oficial solo cubre texto) y si una consulta falla, la tarjeta conserva su estimación.",
  },
  {
    value: "insignias",
    question: "¿Qué significa la insignia de cada resultado?",
    answer:
      "Verde (Exacto): se ha ejecutado el tokenizador real en tu navegador (OpenAI). Azul (Oficial): conteo devuelto por la API del proveedor con tu key (Anthropic y Google en modo BYOK). Ámbar (Estimado): aproximación por ratio de caracteres ajustada por idioma y tipo de contenido (resto de modelos).",
  },
  {
    value: "precision-estimada",
    question: "¿Por qué el conteo estimado difiere del real?",
    answer:
      "Cada proveedor usa su propio tokenizador y no todos son públicos. La estimación divide los caracteres entre un ratio típico del modelo (ajustado por idioma, código o JSON) y lo combina con el recuento de palabras. Suele desviarse menos del 10 %, pero trátalo como orientativo.",
  },
  {
    value: "precios",
    question: "¿Cada cuánto se actualizan precios y ventanas?",
    answer:
      "El catálogo se actualizó en octubre de 2026 (GPT-5.5, Claude 5.x, Gemini 3.x, Grok 4.5…). Los precios solo se rellenan con datos corroborados por anuncios oficiales — el resto se muestra como «—» hasta verificarlos. Verifica siempre con la documentación oficial de cada proveedor antes de tomar decisiones de coste.",
  },
  {
    value: "limites",
    question: "¿Qué límites tiene la herramienta?",
    answer:
      "Archivos de hasta 20 MB, con procesamiento por trozos para no congelar el navegador. PDFs escaneados sin capa de texto generan un aviso, y los formatos binarios no soportados muestran un error claro con la lista de formatos admitidos.",
  },
];

/**
 * Preguntas frecuentes sobre privacidad, precisión, precios y límites.
 */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 pb-20 sm:pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Preguntas frecuentes
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger className="rounded-lg text-left text-[15px] font-medium transition-colors hover:bg-muted/40">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
