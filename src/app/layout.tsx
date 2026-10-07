import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TokenLens — Calculadora de tokens multi-IA",
  description:
    "Sube un archivo o pega texto y compara cuántos tokens es en GPT, Claude, Gemini, Muse, Mistral, DeepSeek, Grok y Qwen: ventana de contexto usada, coste estimado y si cabe. Todo el procesamiento ocurre en tu navegador: tu archivo no se sube a ningún servidor.",
  keywords: [
    "tokens",
    "calculadora de tokens",
    "tokenizador",
    "GPT",
    "Claude",
    "Gemini",
    "Muse",
    "contexto",
    "coste API",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
