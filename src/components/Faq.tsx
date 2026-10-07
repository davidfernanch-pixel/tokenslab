import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/Reveal";
import { useT } from "@/lib/i18n";

interface FaqEntry {
  value: string;
  question: string;
  answer: string;
}

/**
 * Preguntas frecuentes sobre privacidad, precisión, precios y límites.
 */
export function Faq() {
  const t = useT();

  const FAQS: FaqEntry[] = [
    {
      value: "privacidad",
      question: t("faq.q1"),
      answer: t("faq.a1"),
    },
    {
      value: "byok",
      question: t("faq.q2"),
      answer: t("faq.a2"),
    },
    {
      value: "insignias",
      question: t("faq.q3"),
      answer: t("faq.a3"),
    },
    {
      value: "tokenizadores-hf",
      question: t("faq.q7"),
      answer: t("faq.a7"),
    },
    {
      value: "modelos-medio",
      question: t("faq.q8"),
      answer: t("faq.a8"),
    },
    {
      value: "precision-estimada",
      question: t("faq.q4"),
      answer: t("faq.a4"),
    },
    {
      value: "precios",
      question: t("faq.q5"),
      answer: t("faq.a5"),
    },
    {
      value: "limites",
      question: t("faq.q6"),
      answer: t("faq.a6"),
    },
  ];

  return (
    <section id="faq" className="scroll-mt-20 pb-20 sm:pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("faq.kicker")}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {t("faq.title")}
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <Accordion type="single" collapsible>
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
        </Reveal>
      </div>
    </section>
  );
}
