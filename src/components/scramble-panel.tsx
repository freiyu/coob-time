"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import ScrambleView from "@/components/scramble-view";
import type { PuzzleId } from "@/lib/puzzles";

interface ScramblePanelProps {
  puzzleId: PuzzleId;
  puzzleLabel: string;
  scramble: string;
  status: "ready" | "generating" | "error";
  error?: string;
  newScrambleDisabled: boolean;
  onNewScramble: () => void;
}

export default function ScramblePanel({
  puzzleId,
  puzzleLabel,
  scramble,
  status,
  error,
  newScrambleDisabled,
  onNewScramble,
}: ScramblePanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scramble);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopyState("idle"), 1500);
  };

  const copyLabel = copyState === "copied" ? "Copied" : "Copy Scramble";

  return (
    <section
      aria-label="Scramble"
      className="rounded-[14px] border border-border bg-card p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{puzzleLabel}</h2>
          {status === "generating" && (
            <span
              role="status"
              className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground"
            >
              Generating…
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNewScramble}
            disabled={newScrambleDisabled}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden className="size-4" />
            New Scramble
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={scramble === ""}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyState === "copied" ? (
              <Check aria-hidden className="size-4" />
            ) : (
              <Copy aria-hidden className="size-4" />
            )}
            {copyLabel}
          </button>
        </div>
      </header>
      {scramble !== "" && (
        <p className="mt-4 font-mono text-base leading-relaxed break-words whitespace-pre-wrap text-foreground sm:text-lg">
          {scramble}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-danger-foreground">
          Scramble generation failed. Use New Scramble to try again.
          {error ? ` (${error})` : ""}
        </p>
      )}
      {scramble !== "" && (
        <ScrambleView puzzleId={puzzleId} scramble={scramble} />
      )}
      {copyState === "failed" && (
        <p className="mt-2 text-sm text-danger-foreground">
          Could not copy — select the scramble text and copy it manually.
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {copyState === "copied" ? "Scramble copied" : ""}
      </p>
    </section>
  );
}
