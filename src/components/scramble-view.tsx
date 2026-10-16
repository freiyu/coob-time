"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { ScrambleDisplay as ScrambleDisplayElement } from "scramble-display";
import type { PuzzleId } from "@/lib/puzzles";
import { EVENT_IDS } from "@/lib/scrambles/events";

interface ScrambleViewProps {
  puzzleId: PuzzleId;
  scramble: string;
  /** Small square thumbnail (mobile preview); click opens the wide popup. */
  compact?: boolean;
}

export default function ScrambleView({
  puzzleId,
  scramble,
  compact = false,
}: ScrambleViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let display: ScrambleDisplayElement | undefined;

    (async () => {
      try {
        const { ScrambleDisplay } = await import("scramble-display");
        if (cancelled || !containerRef.current) return;
        display = new ScrambleDisplay();
        display.event = EVENT_IDS[puzzleId];
        display.scramble = scramble;
        display.style.width = "100%";
        display.style.height = "100%";
        display.style.display = "block";
        containerRef.current.appendChild(display);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      display?.remove();
    };
  }, [puzzleId, scramble, attempt]);

  const handleRetry = () => {
    setFailed(false);
    setAttempt((value) => value + 1);
  };

  // In the compact thumbnail there is no room for failure UI — the scramble
  // text next to it stays the authoritative fallback.
  if (failed && compact) return null;

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden
        className={
          failed
            ? "hidden"
            : compact
              ? "h-20 w-20 sm:h-24 sm:w-24"
              : "mt-4 h-44 w-full sm:h-52"
        }
      />
      <p
        role="status"
        className={failed ? "mt-4 text-sm text-muted-foreground" : "sr-only"}
      >
        {failed ? "The scramble graphic didn't load. Use the scramble text above." : ""}
      </p>
      {failed && !compact && (
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw aria-hidden className="size-4" />
          Try again
        </button>
      )}
    </>
  );
}
