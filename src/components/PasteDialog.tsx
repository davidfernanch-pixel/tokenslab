"use client";

import { useState } from "react";
import { ClipboardType, ScanSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTokenLens } from "@/lib/store";
import { formatNumber } from "@/lib/format";

export function PasteDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const analyzeText = useTokenLens((s) => s.analyzeText);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  function handleAnalyze() {
    if (!text.trim()) return;
    void analyzeText(text);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ClipboardType className="h-4 w-4" />
          Pegar texto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pega tu texto</DialogTitle>
          <DialogDescription>
            Se analiza localmente en tu navegador, sin subidas.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          rows={14}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleAnalyze();
            }
          }}
          className="min-h-[240px] font-mono text-sm"
          placeholder="Pega aquí tu prompt, documento, código…"
          aria-label="Texto a analizar"
        />

        <p className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {formatNumber(text.length)}
          </span>{" "}
          caracteres ·{" "}
          <span className="font-mono tabular-nums">
            {formatNumber(wordCount)}
          </span>{" "}
          palabras
        </p>

        <DialogFooter className="gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Ctrl + Enter para analizar
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAnalyze} disabled={!text.trim()}>
              <ScanSearch className="h-4 w-4" />
              Analizar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
