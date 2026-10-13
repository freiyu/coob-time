"use client";

import { useEffect, useRef } from "react";
import type { PuzzleID } from "cubing/twisty";
import type { Puzzle } from "@/lib/sample-data";

const PUZZLE_IDS: Record<Puzzle["id"], PuzzleID> = {
  "2x2": "2x2x2",
  "3x3": "3x3x3",
  "4x4": "4x4x4",
  "5x5": "5x5x5",
  "6x6": "6x6x6",
  "7x7": "7x7x7",
  megaminx: "megaminx",
  "square-1": "square1",
  pyraminx: "pyraminx",
  skewb: "skewb",
};

interface ScrambleViewProps {
  puzzleId: Puzzle["id"];
  scramble: string;
}

export default function ScrambleView({ puzzleId, scramble }: ScrambleViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let player: HTMLElement | undefined;

    (async () => {
      try {
        const { TwistyPlayer } = await import("cubing/twisty");
        if (cancelled || !containerRef.current) return;
        player = new TwistyPlayer({
          alg: scramble,
          puzzle: PUZZLE_IDS[puzzleId],
          visualization: "3D",
          background: "none",
          controlPanel: "none",
          viewerLink: "none",
        });
        player.style.width = "100%";
        player.style.height = "100%";
        player.style.display = "block";
        containerRef.current.appendChild(player);
      } catch {
        // The scramble text above stays visible and authoritative.
      }
    })();

    return () => {
      cancelled = true;
      player?.remove();
    };
  }, [puzzleId, scramble]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="mt-4 h-56 w-full sm:h-72"
    />
  );
}
