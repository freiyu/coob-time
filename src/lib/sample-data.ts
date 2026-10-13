export type Penalty = "none" | "plus2" | "dnf";

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

export interface Solve {
  id: string;
  number: number;
  rawTimeMs: number;
  penalty: Penalty;
  scramble: string;
  createdAt: string;
}

export interface SessionSample {
  id: string;
  name: string;
  puzzleId: PuzzleId;
  solves: Solve[];
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

// Sample scrambles generated offline with cubing@0.65.1 (randomScrambleForEvent).
// They are static sample data here — the app does not generate scrambles yet.
export const SAMPLE_SCRAMBLES: Record<PuzzleId, string[]> = {
  "2x2": [
    "R2 U' R2 F2 U F' R U2 F' L' U'",
    "U' F2 R U2 L' F L F2 U' F U'",
    "U L F2 U' R U L' F' U' L U'",
  ],
  "3x3": [
    "F U' R2 B R' F L D B F2 U2 L F2 L U2 R' U2 B2 L' B2 R'",
    "L F R' U' L2 U B' D2 L' U2 L2 U' R2 D2 B2 R2 B2 D L2 F2 D'",
    "U2 D R2 D L' D L2 F B2 R2 F2 U B2 D F2 L2 B2 R2 D' L2",
  ],
  "4x4": [
    "R' L' F' L' U L2 D2 R D2 B2 U2 F' U2 R2 B2 L2 F' R2 F' R2 D Uw2 B F2 L Fw2 R Fw2 F2 Uw2 R Fw2 Rw2 F' D' R' Uw D2 Fw F D Rw2 L' Uw Rw2",
    "R2 D2 U2 F U2 F L2 B2 F L2 D2 F D' F2 L' B2 U2 B R2 D' F Fw2 L2 D Rw2 Uw2 B' D' Fw2 U' F2 D2 Rw2 F Rw L2 D' Fw2 L Uw Fw' U' F2 Rw R2 B' Uw",
    "D2 B' L2 B2 R B2 R' U2 B2 R B2 R2 U' L2 B' L2 F2 U' B2 Uw2 L2 B L' Fw2 Rw2 F2 L' Uw2 F Uw U' R2 U' B L2 Uw' Fw Uw U2 Rw2 R' Fw' Rw'",
  ],
  "5x5": [
    "D' R2 F' Uw2 Lw' B2 R' Fw' U' F Fw' Lw2 B2 Uw' R Rw2 U Bw' Dw' L2 R' Rw' D' R' D R F' B R2 U Dw R2 U' Bw' U' Dw R' Bw' L Dw' Fw' Bw Uw2 Rw2 D' Dw Lw2 Bw2 R' F' Uw Bw' U L' F2 Bw Uw Bw R2 Dw",
    "Dw2 L' Bw' Dw R2 F' L' B D' Lw2 Fw2 R Uw2 R B' U Lw2 Rw2 D2 L' Fw U2 F' R2 Fw R' Dw2 Bw Uw2 Bw2 D B' Lw2 R' F Dw R' Rw B Dw Rw Fw' Lw' Bw' Rw F2 B2 Dw Rw2 Fw2 Bw2 Dw2 R2 Fw2 Bw Rw2 F2 Lw' R B2",
    "Lw' U Lw2 D B' Uw2 F' Uw2 Rw Bw2 Uw2 B' Dw2 Bw Uw2 Dw Rw' B' U' B2 Bw' L' Fw2 Uw Bw2 D' F2 D' B' D2 L2 Rw2 U Dw2 Bw' R Fw Rw' D Bw2 D2 R D2 F' Dw2 B D' F2 Bw' Rw' Fw' U Fw Lw2 Bw' D Bw' Uw' Dw2 B'",
  ],
  "6x6": [
    "3Dw2 3Fw' Bw' Rw' 3Uw2 3Fw2 Uw2 R Uw' 3Rw2 Bw' 3Lw2 F 3Lw' Bw2 Dw2 3Bw2 3Uw' Fw' Lw' 3Uw Bw2 3Rw' Bw2 3Bw2 3Dw2 Lw' 3Bw' D' 3Dw B2 3Uw Lw 3Dw Fw2 3Uw2 3Fw2 3Rw2 3Fw' Bw 3Uw' 3Rw' Fw2 B L' Fw2 3Rw' U' Fw' Uw2 R2 Fw' Bw' 3Dw F' 3Bw2 L' R' D2 3Fw2 3Uw2 Dw' R2 3Rw' D' 3Fw' U Fw 3Dw2 L' B2 R' B Uw' 3Dw2 3Fw' B' 3Dw2 Lw 3Dw",
    "3Uw' L' Dw2 B2 Dw' B Uw' R 3Rw' 3Bw' D' Lw' Uw' B 3Lw 3Dw' F' Uw' F 3Bw' L' 3Lw2 Bw Rw 3Dw B' 3Rw2 3Fw2 Rw' Bw' 3Lw' Dw' B' L2 Bw2 3Dw2 Bw2 L' U D2 F B' Uw' B L2 Lw' R Uw Lw' 3Rw 3Fw' Dw2 B2 Uw R' Uw2 Bw' 3Dw 3Fw' 3Rw' 3Fw2 R' 3Bw2 3Lw' B2 3Dw' Rw 3Bw 3Rw' D2 R 3Uw' R2 Fw2 3Dw2 Lw' Bw' 3Dw 3Fw Uw",
    "Rw Uw 3Uw2 F Rw D Fw2 R' F 3Rw Bw' R' 3Rw2 B 3Lw2 3Dw 3Bw 3Lw' Rw Dw' 3Fw2 Bw2 R U 3Rw' 3Bw2 Dw Rw2 D' L2 D2 3Rw U 3Lw' 3Rw' F' U' 3Lw' Bw2 Dw 3Bw2 R 3Rw2 3Uw2 Lw2 Bw 3Uw B2 3Bw2 L' Uw' B2 Dw 3Lw2 3Dw2 Fw2 Uw2 Fw' 3Dw' 3Bw2 D B 3Bw2 3Rw' 3Dw Bw Lw' 3Dw2 3Lw2 3Rw 3Fw L 3Bw 3Uw' 3Bw' 3Uw D2 Bw' 3Lw' R",
  ],
  "7x7": [
    "R U' R2 3Fw2 3Bw 3Lw2 Bw 3Bw' 3Dw' B Lw' U L2 Rw 3Dw' L2 D2 3Dw' Bw' R' 3Rw2 F' U' 3Fw U' D' Lw 3Lw' D R' 3Uw2 F' Rw Dw2 Lw Rw' U Dw' 3Rw D' Rw' 3Rw' 3Uw' Bw 3Lw2 F2 Rw' Uw2 F 3Lw2 3Rw Dw' 3Lw2 Uw' Fw Dw 3Fw2 3Bw2 Rw' Dw' B Uw2 Fw' 3Dw2 F2 Bw 3Uw' Lw' B2 D' Lw' 3Rw2 Uw' Lw F2 Fw 3Lw F' 3Uw' D Rw2 3Rw' Fw Lw' Fw 3Bw 3Lw Rw2 F2 Rw2 3Bw Rw' 3Uw R2 Bw Rw2 Bw2 Lw' Bw Lw",
    "Fw' B' 3Rw' 3Fw2 R' Bw' R Rw2 3Dw F' L' D 3Lw 3Rw2 3Dw' Bw2 R2 Uw2 Fw 3Lw F' 3Lw' 3Fw' 3Uw D2 Rw U' Fw2 3Lw B' 3Uw' R2 Dw Bw2 U Uw2 L 3Bw2 Uw' 3Fw2 Rw 3Bw' 3Dw2 B2 3Rw Dw R Fw 3Bw Dw2 B' 3Uw D2 3Rw' Fw2 3Lw2 B' 3Rw2 D 3Rw' D B' Rw2 U B Rw2 B' Rw' 3Dw 3Rw' 3Dw' L' 3Lw R' Fw U 3Bw Dw2 3Dw2 Lw2 3Dw' L' 3Fw Lw' Rw' 3Bw' 3Dw2 L' R' Uw2 3Bw2 3Rw2 Uw B' U 3Dw B2 3Lw2 Dw 3Lw",
    "3Bw' Lw 3Uw Dw2 3Bw' Rw2 3Rw Bw Rw' Fw' Lw' 3Rw2 F 3Lw2 D' 3Fw' L2 3Fw 3Dw' Bw Dw' 3Rw' 3Uw L R' 3Dw' 3Fw2 Dw' L B2 Uw Lw' Dw2 B' 3Uw2 3Fw2 Bw' Rw 3Fw' 3Uw 3Bw2 U F Fw' Rw Uw 3Rw 3Uw' L2 3Dw' R 3Fw Lw2 Uw' 3Uw2 3Dw' L' Lw 3Bw2 3Dw' L' 3Lw' Fw' Rw2 3Fw 3Dw2 R' U D' Dw 3Fw' Bw2 U2 3Dw2 Fw' 3Dw2 F' D 3Rw B2 Rw' F 3Rw' Dw' Rw' D2 L U 3Bw D' Dw2 F2 Bw' Lw D' B Uw' 3Uw2 D'",
  ],
  megaminx: [
    "R-- D++ R-- D-- R++ D++ R++ D++ R++ D-- U'\nR++ D++ R-- D++ R++ D-- R-- D-- R++ D-- U'\nR-- D++ R-- D-- R-- D++ R-- D-- R-- D-- U'\nR++ D-- R++ D-- R-- D-- R++ D++ R++ D++ U\nR-- D++ R-- D++ R-- D-- R-- D++ R++ D-- U'\nR++ D-- R++ D++ R-- D++ R-- D-- R-- D++ U\nR++ D++ R-- D++ R-- D++ R++ D++ R-- D++ U",
    "R-- D++ R-- D-- R-- D-- R++ D-- R-- D-- U'\nR-- D-- R++ D-- R++ D-- R++ D++ R++ D-- U'\nR++ D++ R++ D-- R++ D-- R-- D++ R++ D++ U\nR++ D++ R-- D-- R-- D-- R-- D++ R++ D++ U\nR++ D++ R-- D-- R-- D++ R-- D-- R-- D-- U'\nR-- D-- R++ D-- R-- D++ R-- D-- R-- D++ U'\nR++ D++ R-- D-- R-- D-- R++ D++ R-- D-- U'",
    "R-- D++ R-- D++ R-- D-- R++ D++ R-- D-- U'\nR++ D++ R-- D++ R++ D-- R-- D-- R++ D-- U'\nR++ D-- R-- D-- R-- D++ R-- D++ R++ D++ U\nR-- D-- R-- D-- R-- D++ R-- D-- R-- D++ U\nR-- D-- R-- D-- R-- D++ R-- D-- R-- D-- U'\nR++ D++ R-- D-- R++ D++ R-- D-- R-- D-- U'\nR++ D-- R-- D++ R-- D++ R-- D++ R-- D++ U",
  ],
  "square-1": [
    "(3, -1) / (4, 1) / (-4, 5) / (-5, 4) / (-4, -1) / (0, 6) / (-2, 0) / (6, 3) / (-2, 0) / (-1, 0) / (-2, 0) / (3, 0)",
    "(4, 3) / (-1, 2) / (-3, 0) / (-2, 1) / (0, -3) / (3, 0) / (-4, 0) / (3, 3) / (-1, 2) / (0, 2) / (0, -2) / (-2, 2) / (0, -2)",
    "(-2, 0) / (2, -4) / (0, 3) / (-3, 0) / (-5, 4) / (0, 3) / (-4, 0) / (-3, 0) / (0, -1) / (2, -2) / (0, 2) / (-4, 0) / (6, -2) / (-1, 0)",
  ],
  pyraminx: [
    "R' U L' R' L B R' L U' l' u",
    "B' L U' B' R L' U' b r l u'",
    "R U B L R' U' L' R U' l' u'",
  ],
  skewb: [
    "U L B' L R L' R U' R L B'",
    "U L U B R U' R L R' U' B'",
    "U L U L' B R' L B' L R L",
  ],
};

const solve = (
  number: number,
  rawTimeMs: number,
  penalty: Penalty,
  day: number,
  hour: number,
  minute: number,
): Solve => ({
  id: `sample-${number}`,
  number,
  rawTimeMs,
  penalty,
  scramble: SAMPLE_SCRAMBLES["3x3"][(number - 1) % 3],
  createdAt: `2026-10-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
});

export const SAMPLE_SESSIONS: SessionSample[] = [
  {
    id: "default",
    name: "Default session",
    puzzleId: "3x3",
    solves: [
      solve(1, 14620, "none", 12, 9, 14),
      solve(2, 13870, "none", 12, 9, 31),
      solve(3, 11450, "plus2", 12, 10, 2),
      solve(4, 12980, "none", 12, 10, 27),
      solve(5, 12100, "dnf", 12, 11, 5),
      solve(6, 15210, "none", 13, 8, 44),
      solve(7, 10760, "none", 13, 9, 1),
      solve(8, 12440, "none", 13, 9, 18),
      solve(9, 11890, "none", 13, 9, 40),
      solve(10, 10520, "plus2", 13, 10, 3),
      solve(11, 13350, "none", 13, 10, 25),
      solve(12, 9870, "none", 13, 11, 2),
      solve(13, 12610, "none", 13, 11, 20),
      solve(14, 14080, "none", 13, 11, 44),
      solve(15, 11330, "none", 13, 12, 1),
    ],
  },
  {
    id: "practice",
    name: "CFOP practice",
    puzzleId: "3x3",
    solves: [
      solve(1, 16420, "none", 13, 14, 10),
      solve(2, 15080, "none", 13, 14, 33),
      solve(3, 13900, "dnf", 13, 14, 55),
      solve(4, 14770, "none", 13, 15, 12),
      solve(5, 12600, "plus2", 13, 15, 30),
      solve(6, 15930, "none", 13, 15, 52),
      solve(7, 13210, "none", 13, 16, 14),
      solve(8, 14050, "none", 13, 16, 31),
    ],
  },
];

export function sessionsForPuzzle(puzzleId: PuzzleId): SessionSample[] {
  const sessions = SAMPLE_SESSIONS.filter((s) => s.puzzleId === puzzleId);
  if (sessions.length > 0) return sessions;
  return [{ id: `${puzzleId}-default`, name: "Default session", puzzleId, solves: [] }];
}

export function puzzleLabel(puzzleId: string): string {
  return PUZZLES.find((p) => p.id === puzzleId)?.label ?? puzzleId;
}

export function effectiveMs(solve: Solve): number | null {
  if (solve.penalty === "dnf") return null;
  return solve.rawTimeMs + (solve.penalty === "plus2" ? 2000 : 0);
}

export function formatMs(ms: number): string {
  if (ms >= 60000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2).padStart(5, "0");
    return `${minutes}:${seconds}`;
  }
  return (ms / 1000).toFixed(2);
}

export function bestSingle(solves: Solve[]): number | null {
  const times = solves.map(effectiveMs).filter((t): t is number => t !== null);
  return times.length > 0 ? Math.min(...times) : null;
}

export function mean(solves: Solve[]): number | null {
  const times = solves.map(effectiveMs).filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

// WCA-style average: drop the fastest and slowest floor(n/5) results.
// DNF counts as infinitely slow; a DNF left inside the counted part makes the average a DNF.
function averageOfWindow(window: Solve[]): number | null {
  const values = window
    .map((s) => effectiveMs(s))
    .map((t) => (t === null ? Infinity : t))
    .sort((a, b) => a - b);
  const drop = Math.floor(window.length / 5);
  const counted = values.slice(drop, values.length - drop);
  if (counted.some((v) => !Number.isFinite(v))) return null;
  return counted.reduce((a, b) => a + b, 0) / counted.length;
}

export function aoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;
  return averageOfWindow(solves.slice(-n));
}

export function bestAoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;
  let best: number | null = null;
  for (let end = n; end <= solves.length; end++) {
    const value = averageOfWindow(solves.slice(end - n, end));
    if (value !== null && (best === null || value < best)) best = value;
  }
  return best;
}
