"use client";

/**
 * TokenLens — Modo BYOK (Bring Your Own Key).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Permite obtener CONTEOS OFICIALES de tokens (insignia 🔵 Oficial) para los
 * proveedores que exponen un endpoint de conteo (Anthropic count_tokens y
 * Google Gemini countTokens), usando las API keys del propio usuario.
 *
 * Seguridad:
 * - Las keys se guardan SOLO en el navegador (localStorage de este dominio).
 * - Se envían únicamente a /api/count, un proxy sin estado que las reenvía
 *   al proveedor y las descarta: nunca se persisten ni se registran.
 * - El modo es opt-in (desactivado por defecto).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelConfig } from "@/lib/models.config";

export type ByokProvider = "anthropic" | "google";

export const BYOK_PROVIDERS: ByokProvider[] = ["anthropic", "google"];

interface ByokState {
  /** interruptor principal del modo BYOK */
  enabled: boolean;
  /** API keys por proveedor (solo en este navegador) */
  keys: Record<ByokProvider, string>;
  setEnabled: (enabled: boolean) => void;
  setKey: (provider: ByokProvider, key: string) => void;
  clearKey: (provider: ByokProvider) => void;
}

export const useByok = create<ByokState>()(
  persist(
    (set) => ({
      enabled: false,
      keys: { anthropic: "", google: "" },
      setEnabled: (enabled) => set({ enabled }),
      setKey: (provider, key) =>
        set((s) => ({ keys: { ...s.keys, [provider]: key } })),
      clearKey: (provider) =>
        set((s) => ({ keys: { ...s.keys, [provider]: "" } })),
    }),
    {
      name: "tokenlens-byok",
      version: 1,
      partialize: (s) => ({ enabled: s.enabled, keys: s.keys }),
    },
  ),
);

/** Key del proveedor (recortada) o null si no hay ninguna. */
export function byokKeyFor(provider: ByokProvider): string | null {
  const key = useByok.getState().keys[provider]?.trim();
  return key ? key : null;
}

/** ¿El modelo puede recibir conteo oficial con la configuración actual? */
export function isByokCandidate(model: ModelConfig): boolean {
  if (model.provider !== "anthropic" && model.provider !== "google")
    return false;
  if (model.tokenizer !== "estimate") return false;
  if (!useByok.getState().enabled) return false;
  return byokKeyFor(model.provider) != null;
}

export type OfficialCountResponse =
  | { ok: true; tokens: number }
  | { ok: false; error: string };

/**
 * Pide el conteo oficial al proxy local /api/count.
 * El proxy reenvía la petición al endpoint público del proveedor con la key
 * del usuario y devuelve el número de tokens sin conservar nada.
 */
export async function fetchOfficialCount(
  provider: ByokProvider,
  modelId: string,
  text: string,
  apiKey: string,
): Promise<OfficialCountResponse> {
  try {
    const res = await fetch("/api/count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, modelId, text, apiKey }),
    });
    const data: unknown = await res.json().catch(() => null);
    if (res.ok && data != null && typeof data === "object") {
      const d = data as { ok?: unknown; tokens?: unknown; error?: unknown };
      if (d.ok === true && typeof d.tokens === "number") {
        return { ok: true, tokens: d.tokens };
      }
      if (typeof d.error === "string") {
        return { ok: false, error: d.error };
      }
    }
    return { ok: false, error: `El servidor respondió HTTP ${res.status}.` };
  } catch {
    return {
      ok: false,
      error: "No se pudo contactar con el proxy local /api/count.",
    };
  }
}
