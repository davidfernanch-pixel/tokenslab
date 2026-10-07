"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/**
 * Alterna entre tema claro y oscuro (next-themes, `.dark` en <html>).
 * `mounted` vía useSyncExternalStore: false en servidor, true en cliente,
 * sin setState dentro de efectos (evita mismatch de hidratación).
 */
export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();

  if (!mounted) {
    return <span className="block h-9 w-9" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar tema"
    >
      <span className="sr-only">Cambiar tema</span>
      <Sun
        aria-hidden="true"
        className={cn(
          "size-4.5 transition-transform duration-300",
          isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0",
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-1/2 size-4.5 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300",
          isDark ? "rotate-90 scale-0" : "rotate-0 scale-100",
        )}
      />
    </Button>
  );
}
