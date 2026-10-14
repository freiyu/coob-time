import type { PuzzleId } from "@/lib/puzzles";
import { EVENT_IDS } from "./events";
import type { ScrambleProvider } from "./types";

interface ScrambleModule {
  randomScrambleForEvent: (eventId: string) => Promise<{ toString(): string }>;
}

// The search worker loads sibling chunks by relative path, so bundling cubing
// breaks it in browsers (cubing/cubing.js#309). Load the static copy from
// public/cubing as native ESM instead; the bundled package import is the
// fallback for Node (unit tests), where /cubing/... does not exist.
const BROWSER_ENTRY = "/cubing/scramble/index.js";
const importByPath = new Function("u", "return import(u)") as (
  url: string,
) => Promise<ScrambleModule>;

async function loadScrambleModule(): Promise<ScrambleModule> {
  try {
    return await importByPath(BROWSER_ENTRY);
  } catch (copyError) {
    console.error("[cubetime] static cubing copy failed to load:", copyError);
    return import("cubing/scramble");
  }
}

export const cubingScrambleProvider: ScrambleProvider = async (
  puzzleId: PuzzleId,
) => {
  try {
    const { randomScrambleForEvent } = await loadScrambleModule();
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
