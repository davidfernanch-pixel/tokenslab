"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/**
 * Botón flotante «volver arriba»: aparece al bajar más de ~1,2 pantallas,
 * respeta el área segura de iOS y `prefers-reduced-motion`.
 */
export function BackToTop() {
  const t = useT();
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 1.2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed right-5 z-40 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:right-6"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={reduce ? { duration: 0 } : { duration: 0.2 }}
        >
          <Button
            variant="outline"
            size="icon"
            aria-label={t("backTop.aria")}
            onClick={() =>
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
            }
            className="h-10 w-10 rounded-full border-border bg-card/90 shadow-lg backdrop-blur transition-transform motion-safe:hover:-translate-y-0.5"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
