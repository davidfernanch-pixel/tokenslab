import { ShieldCheck } from "lucide-react";

import { PROVIDERS, PROVIDER_ORDER } from "@/lib/models.config";
import { useT } from "@/lib/i18n";

/**
 * Pie de página. La clase `mt-auto` es clave: la página envuelve todo en un
 * flex-col min-h-screen, así el footer queda pegado abajo aunque el contenido
 * sea corto.
 */
export function Footer() {
  const t = useT();

  return (
    <footer className="mt-auto bg-card/50">
      {/* Línea de luz superior con degradado de marca */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5">
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
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("footer.local")}
            </span>
          </div>

          {/* Precisión */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("footer.precision.title")}
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <a
                href="#como-funciona"
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("footer.link.how")}
              </a>
              <a
                href="#faq"
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("footer.link.faq")}
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/70">
              {t("footer.precision.note")}
            </p>
          </div>

          {/* Proveedores */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("footer.providers.title")}
            </h3>
            <ul className="mt-3 space-y-2">
              {PROVIDER_ORDER.map((provider) => (
                <li
                  key={provider}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PROVIDERS[provider].color }}
                    aria-hidden="true"
                  />
                  {PROVIDERS[provider].label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground/70">
              {t("footer.providers.note")}
            </p>
          </div>
        </div>

        {/* Fila inferior */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {t("footer.disclaimer")}
          </p>
          <p className="font-mono text-xs text-muted-foreground/70">
            TokenLens · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
