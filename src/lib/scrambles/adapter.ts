import { randomScrambleForEvent } from "cubing/scramble";
import type { PuzzleId } from "@/lib/puzzles";
import { EVENT_IDS } from "./events";
import type { ScrambleProvider } from "./types";

export const cubingScrambleProvider: ScrambleProvider = async (
  puzzleId: PuzzleId,
) => {
  try {
    const alg = await randomScrambleForEvent(EVENT_IDS[puzzleId]);
    const scramble = alg.toString().trim();
    if (!scramble) {
      return { ok: false, error: "Generator returned an empty scramble." };
    }
    return { ok: true, scramble };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown generation error.",
    };
  }
};
