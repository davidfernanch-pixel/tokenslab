"use client";

import { useEffect, useRef, useState } from "react";

/** easeOutExpo: arranque rápido y frenado largo (0 → 1). */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Anima un número hacia `target` con requestAnimationFrame y easing easeOutExpo.
 * - Al montar anima de 0 a target; si target cambia, anima del valor actual al nuevo.
 * - Respeta `prefers-reduced-motion` (devuelve target directamente).
 * - Limpia el rAF en el cleanup y devuelve siempre un entero (Math.round).
 */
export function useAnimatedNumber(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || duration <= 0 || valueRef.current === target) {
      valueRef.current = target;
      // sin setState síncrono dentro del efecto: se aplaza al siguiente frame
      const raf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf);
    }

    const from = valueRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const next = from + (target - from) * easeOutExpo(progress);
      valueRef.current = next;
      setValue(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [target, duration]);

  return Math.round(value);
}
