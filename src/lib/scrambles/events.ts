import type { PuzzleId } from "@/lib/puzzles";

// WCA event IDs accepted by cubing.js randomScrambleForEvent and <scramble-display>.
export const EVENT_IDS: Record<PuzzleId, string> = {
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
