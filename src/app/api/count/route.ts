/**
 * TokenLens — Proxy de conteo oficial (modo BYOK).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/count
 * Body: { provider: "anthropic" | "google", modelId, text, apiKey }
 *
 * Reenvía la petición al endpoint público de conteo de tokens del proveedor:
 * - Anthropic: POST https://api.anthropic.com/v1/messages/count_tokens
 *   → { input_tokens }
 * - Google:    POST https://generativelanguage.googleapis.com/v1beta/models/{model}:countTokens
 *   → { totalTokens }
 *
 * El proxy NO tiene estado: la API key del usuario se usa solo para esta
 * petición y se descarta. No se registra nada en logs ni en base de datos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/models.config";

/** Límite de texto aceptado (1,5 MB) para evitar abusos del proxy. */
const MAX_TEXT_CHARS = 1_500_000;

const PROVIDERS = new Set(["anthropic", "google"]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Traduce los errores HTTP del proveedor a mensajes claros en español. */
function providerErrorMessage(
  provider: string,
  status: number,
  detail: string | undefined,
): string {
  const name = provider === "anthropic" ? "Anthropic" : "Google";
  if (status === 401 || status === 403) {
    return `La API key de ${name} no es válida o no tiene permisos.`;
  }
  // Google devuelve 400 INVALID_ARGUMENT con "API key not valid" para keys falsas
  if (status === 400 && detail?.includes("API key not valid")) {
    return `La API key de ${name} no es válida o no tiene permisos.`;
  }
  if (status === 404) {
    return `El modelo no existe en la API de ${name} (¿está publicado el id del modelo?).`;
  }
  if (status === 429) {
    return "Límite de peticiones alcanzado en la API del proveedor. Inténtalo de nuevo en unos segundos.";
  }
  if (status >= 500) {
    return "La API del proveedor tiene una incidencia temporal. Inténtalo más tarde.";
  }
  return detail
    ? `Error ${status} de la API del proveedor: ${detail.slice(0, 200)}`
    : `Error ${status} de la API del proveedor.`;
}

export async function POST(req: NextRequest) {
  let body: {
    provider?: unknown;
    modelId?: unknown;
    text?: unknown;
    apiKey?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Cuerpo JSON no válido.", 400);
  }

  const { provider, modelId, text, apiKey } = body ?? {};

  // Validación estricta de la entrada
  if (typeof provider !== "string" || !PROVIDERS.has(provider)) {
    return errorResponse(
      'Proveedor no admitido: se espera "anthropic" o "google".',
      400,
    );
  }
  if (typeof modelId !== "string" || modelId.length === 0) {
    return errorResponse("Falta el identificador del modelo.", 400);
  }
  if (typeof text !== "string" || text.length === 0) {
    return errorResponse("Falta el texto que contar.", 400);
  }
  if (text.length > MAX_TEXT_CHARS) {
    return errorResponse(
      `El texto supera el límite de ${MAX_TEXT_CHARS} caracteres.`,
      413,
    );
  }
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return errorResponse("Falta la API key del usuario.", 400);
  }

  // El modelo debe existir en el catálogo y pertenecer al proveedor indicado
  // (evita usar el proxy con modelos arbitrarios).
  const model = MODELS.find((m) => m.id === modelId);
  if (!model || model.provider !== provider) {
    return errorResponse(
      "El modelo no pertenece al proveedor indicado o no está en el catálogo.",
      400,
    );
  }

  const key = apiKey.trim();

  try {
    if (provider === "anthropic") {
      const res = await fetch(
        "https://api.anthropic.com/v1/messages/count_tokens",
        {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: text }],
          }),
        },
      );
      if (!res.ok) {
        const detail = (await res.text().catch(() => undefined)) ?? undefined;
        return errorResponse(
          providerErrorMessage("anthropic", res.status, detail),
          res.status === 401 || res.status === 403 ? 401 : 502,
        );
      }
      const data = (await res.json().catch(() => null)) as {
        input_tokens?: unknown;
      } | null;
      if (data == null || typeof data.input_tokens !== "number") {
        return errorResponse(
          "Respuesta inesperada de la API de Anthropic.",
          502,
        );
      }
      return NextResponse.json({
        ok: true,
        tokens: data.input_tokens,
        provider,
      });
    }

    // Google Gemini countTokens
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:countTokens`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
      }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => undefined)) ?? undefined;
      return errorResponse(
        providerErrorMessage("google", res.status, detail),
        res.status === 401 || res.status === 403 ? 401 : 502,
      );
    }
    const data = (await res.json().catch(() => null)) as {
      totalTokens?: unknown;
    } | null;
    if (data == null || typeof data.totalTokens !== "number") {
      return errorResponse("Respuesta inesperada de la API de Google.", 502);
    }
    return NextResponse.json({ ok: true, tokens: data.totalTokens, provider });
  } catch {
    return errorResponse(
      "No se pudo contactar con la API del proveedor (¿sin conexión?).",
      502,
    );
  }
}

/** Sin caché: las keys son del usuario y el conteo debe ser fresco. */
export const dynamic = "force-dynamic";
