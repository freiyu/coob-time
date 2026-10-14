"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { ScrambleDisplay as ScrambleDisplayElement } from "scramble-display";
import type { PuzzleId } from "@/lib/sample-data";

// WCA event IDs accepted by <scramble-display> (same ids as the Phase 2 spike).
const EVENT_IDS: Record<PuzzleId, string> = {
  "2x2": "222",
  "3x3": "333",
  "4x4": "444",
  "5x5": "555",
  "6x6": "666",
  "7x7": "777",
  megaminx: "minx",
  "square-1": "sq1",
  pyraminx: "pyram",
  skewb: "skewb",
};

interface ScrambleViewProps {
  puzzleId: PuzzleId;
  scramble: string;
}

export default function ScrambleView({ puzzleId, scramble }: ScrambleViewProps) {
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

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden
        className={failed ? "hidden" : "mt-4 h-44 w-full sm:h-52"}
      />
      <p
        role="status"
        className={failed ? "mt-4 text-sm text-muted-foreground" : "sr-only"}
      >
        {failed ? "The scramble graphic didn't load. Use the scramble text above." : ""}
      </p>
      {failed && (
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
