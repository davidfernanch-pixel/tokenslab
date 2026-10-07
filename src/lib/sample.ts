/**
 * Texto de ejemplo para probar TokenLens sin archivo.
 * Mezcla deliberada de prosa en español, código y JSON para exhibir
 * el ajuste del estimador por tipo de contenido.
 */
export const SAMPLE_TEXT = `# Guía rápida de tokens

Los modelos de lenguaje dividen el texto en **tokens**: trozos que pueden ser
una palabra, parte de una palabra o un signo de puntuación. El español suele
necesitar más tokens que el inglés para el mismo mensaje, porque las palabras
son más largas y llevan acentos: ñ, á, é, í, ó, ú.

## ¿Por qué importa?

- El coste de cada petición depende del número de tokens.
- Cada modelo tiene una ventana de contexto limitada.
- Los tokenizadores difieren entre proveedores: las mismas palabras no siempre
  producen los mismos tokens en GPT, Claude o Gemini.

## Ejemplo de código

\`\`\`python
def count_words(text: str) -> int:
    """Cuenta las palabras de un texto."""
    return len(text.split())

def estimate_cost(tokens: int, price_per_m: float) -> float:
    return tokens / 1_000_000 * price_per_m
\`\`\`

## Ejemplo de JSON

\`\`\`json
{
  "modelos": ["gpt-5", "claude-sonnet-4-5", "gemini-2.5-pro"],
  "ventanas": {"gpt-5": 400000, "claude-sonnet-4-5": 200000},
  "precios": "TODO: rellenar desde las páginas oficiales"
}
\`\`\`

Conclusión: antes de enviar un documento a una API, pasa por TokenLens y sabrás
si cabe, cuánto ocupa y qué modelo te conviene. Sin subir nada a ningún servidor.
`;
