/**
 * Texto de ejemplo para probar TokenLens sin archivo.
 * Mezcla deliberada de prosa, código y JSON para exhibir el ajuste del
 * estimador por tipo de contenido. Disponible en ES y EN (i18n).
 */

export const SAMPLE_ES = `# Guía rápida de tokens

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
  "modelos": ["gpt-6-astra", "claude-opus-5-5", "gemini-3.1-pro", "grok-4-7"],
  "ventanas": {"gpt-6-astra": 1050000, "claude-opus-5-5": 1000000},
  "precios": "TODO: rellenar desde las páginas oficiales"
}
\`\`\`

Conclusión: antes de enviar un documento a una API, pasa por TokenLens y sabrás
si cabe, cuánto ocupa y qué modelo te conviene. Sin subir nada a ningún servidor.
`;

export const SAMPLE_EN = `# Quick guide to tokens

Language models split text into **tokens**: chunks that may be a word, part of
a word, or a punctuation mark. English is usually the most token-efficient
language, while Spanish needs a few more for the same message because words
are longer and carry accents.

## Why it matters

- The cost of every request depends on the number of tokens.
- Each model has a limited context window.
- Tokenizers differ across providers: the same words do not always produce
  the same tokens in GPT, Claude, or Gemini.

## Code example

\`\`\`python
def count_words(text: str) -> int:
    """Count the words in a text."""
    return len(text.split())

def estimate_cost(tokens: int, price_per_m: float) -> float:
    return tokens / 1_000_000 * price_per_m
\`\`\`

## JSON example

\`\`\`json
{
  "models": ["gpt-6-astra", "claude-opus-5-5", "gemini-3.1-pro", "grok-4-7"],
  "windows": {"gpt-6-astra": 1050000, "claude-opus-5-5": 1000000},
  "prices": "TODO: fill in from the official pricing pages"
}
\`\`\`

Conclusion: before sending a document to an API, run it through TokenLens and
you will know whether it fits, how big it is, and which model suits you best.
Without uploading anything to any server.
`;

/** @deprecated usa useSampleText() de lib/i18n (elige el idioma activo) */
export const SAMPLE_TEXT = SAMPLE_ES;
