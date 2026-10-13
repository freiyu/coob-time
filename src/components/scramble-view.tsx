"use client";

import { useEffect, useRef } from "react";
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
      } catch {
        // The scramble text above stays visible and authoritative.
      }
    })();

    return () => {
      cancelled = true;
      display?.remove();
    };
  }, [puzzleId, scramble]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="mt-4 h-44 w-full sm:h-52"
    />
  );
}
