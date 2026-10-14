import type { PuzzleId } from "@/lib/puzzles";

export type ScrambleResult =
  | { ok: true; scramble: string }
  | { ok: false; error: string };

export type ScrambleProvider = (puzzleId: PuzzleId) => Promise<ScrambleResult>;
