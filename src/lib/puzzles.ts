export type PuzzleId =
  | "2x2"
  | "3x3"
  | "4x4"
  | "5x5"
  | "6x6"
  | "7x7"
  | "megaminx"
  | "square-1"
  | "pyraminx"
  | "skewb";

export interface Puzzle {
  id: PuzzleId;
  label: string;
}

export const PUZZLES: Puzzle[] = [
  { id: "2x2", label: "2×2×2" },
  { id: "3x3", label: "3×3×3" },
  { id: "4x4", label: "4×4×4" },
  { id: "5x5", label: "5×5×5" },
  { id: "6x6", label: "6×6×6" },
  { id: "7x7", label: "7×7×7" },
  { id: "megaminx", label: "Megaminx" },
  { id: "square-1", label: "Square-1" },
  { id: "pyraminx", label: "Pyraminx" },
  { id: "skewb", label: "Skewb" },
];

export function puzzleLabel(puzzleId: string): string {
  return PUZZLES.find((p) => p.id === puzzleId)?.label ?? puzzleId;
}
