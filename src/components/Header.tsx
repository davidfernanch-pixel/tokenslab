"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Language = "ES" | "EN";

/**
 * Cabecera fija de TokenLens: logo, navegación ancla, selector de idioma
 * y conmutador de tema. En móvil solo quedan logo, idioma y tema.
 */
export function Header() {
  const [language, setLanguage] = useState<Language>("ES");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo + wordmark */}
        <a
          href="#"
          aria-label="TokenLens, inicio"
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#9479FF] shadow-lg shadow-primary/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="h-4.5 w-4.5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-3.5-3.5" />
              <path d="M8.5 11h5M8.5 8.5H13" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">
            Token<span className="text-primary">Lens</span>
          </span>
          <Badge
            variant="outline"
            className="ml-1 hidden text-[10px] font-normal text-muted-foreground sm:inline-flex"
          >
            beta
          </Badge>
        </a>

        {/* Navegación (solo escritorio) */}
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Principal"
        >
          <a
            href="#como-funciona"
            className="relative text-sm text-muted-foreground transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:scale-x-0 motion-safe:after:transition-transform motion-safe:after:duration-200 hover:text-foreground hover:after:scale-x-100 focus-visible:after:scale-x-100"
          >
            Cómo funciona
          </a>
          <a
            href="#faq"
            className="relative text-sm text-muted-foreground transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:scale-x-0 motion-safe:after:transition-transform motion-safe:after:duration-200 hover:text-foreground hover:after:scale-x-100 focus-visible:after:scale-x-100"
          >
            FAQ
          </a>
        </nav>

        {/* Idioma + tema */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex items-center rounded-full border border-border p-0.5"
            role="group"
            aria-label="Idioma"
          >
            <button
              type="button"
              aria-pressed={language === "ES"}
              onClick={() => setLanguage("ES")}
              className={cn(
                "cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
                language === "ES"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              ES
            </button>
            <button
              type="button"
              aria-pressed={language === "EN"}
              onClick={() => {
                setLanguage("EN");
                toast.info(
                  "English está en camino. La versión actual está en español.",
                );
              }}
              className={cn(
                "cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
                language === "EN"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              EN
            </button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
