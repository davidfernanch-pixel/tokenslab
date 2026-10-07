"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Tecla de atajo con estilo de teclado físico. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-surface-elevated px-1.5 font-mono text-[11px] font-semibold text-foreground shadow-[inset_0_-1px_0_var(--border)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

interface Shortcut {
  keys: string[];
  description: string;
}

/**
 * Ayuda de atajos de teclado (botón en la cabecera o tecla «?»).
 * Los atajos en sí se registran en page.tsx (globales) y PasteDialog
 * (Ctrl+Enter dentro del área de texto).
 */
export function ShortcutsHelp() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Tecla «?» muestra u oculta la ayuda (si no se está escribiendo y no
  // hay otro diálogo abierto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const anyOpen = [...document.querySelectorAll("[data-state='open']")].some(
        (el) => !(openRef.current && el.closest("[role='dialog']")),
      );
      if (anyOpen && !openRef.current) return;
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const SHORTCUTS: Shortcut[] = [
    { keys: ["P"], description: t("shortcuts.paste") },
    { keys: ["V"], description: t("shortcuts.viz") },
    { keys: ["Ctrl", "↵"], description: t("shortcuts.ctrlEnter") },
    { keys: ["?"], description: t("shortcuts.help") },
    { keys: ["Esc"], description: t("shortcuts.esc") },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("shortcuts.triggerAria")}
          className="hidden h-9 w-9 text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          <Keyboard className="h-4 w-4" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.desc")}</DialogDescription>
        </DialogHeader>
        <ul className="mt-2 space-y-2.5">
          {SHORTCUTS.map((s) => (
            <li
              key={s.keys.join("+")}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{s.description}</span>
              <span className="flex shrink-0 items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-xs text-muted-foreground" aria-hidden>
                        +
                      </span>
                    )}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {t("shortcuts.note")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
