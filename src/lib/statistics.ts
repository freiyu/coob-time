import type { SolveRecord } from "@/lib/storage/types";

export type SolveLike = Pick<SolveRecord, "rawTimeMs" | "penalty">;

export function effectiveMs(solve: SolveLike): number | null {
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

export function bestSingle(solves: SolveLike[]): number | null {
  const times = solves.map(effectiveMs).filter((t): t is number => t !== null);
  return times.length > 0 ? Math.min(...times) : null;
}

export function mean(solves: SolveLike[]): number | null {
  const times = solves.map(effectiveMs).filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

// WCA-style average: drop the fastest and slowest floor(n/5) results.
// DNF counts as infinitely slow; a DNF left inside the counted part makes the average a DNF.
function averageOfWindow(window: SolveLike[]): number | null {
  const values = window
    .map((s) => effectiveMs(s))
    .map((t) => (t === null ? Infinity : t))
    .sort((a, b) => a - b);
  const drop = Math.floor(window.length / 5);
  const counted = values.slice(drop, values.length - drop);
  if (counted.some((v) => !Number.isFinite(v))) return null;
  return counted.reduce((a, b) => a + b, 0) / counted.length;
}

export function aoN(solves: SolveLike[], n: number): number | null {
  if (solves.length < n) return null;
  return averageOfWindow(solves.slice(-n));
}

export function bestAoN(solves: SolveLike[], n: number): number | null {
  if (solves.length < n) return null;
  let best: number | null = null;
  for (let end = n; end <= solves.length; end++) {
    const value = averageOfWindow(solves.slice(end - n, end));
    if (value !== null && (best === null || value < best)) best = value;
  }
  return best;
}
