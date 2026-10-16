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

export function bestAoNEnd(solves: SolveLike[], n: number): number | null {
  if (solves.length < n) return null;
  let bestEnd: number | null = null;
  let bestValue: number | null = null;
  for (let end = n; end <= solves.length; end++) {
    const value = averageOfWindow(solves.slice(end - n, end));
    if (value !== null && (bestValue === null || value < bestValue)) {
      bestValue = value;
      bestEnd = end;
    }
  }
  return bestEnd;
}

export function bestAoN(solves: SolveLike[], n: number): number | null {
  const end = bestAoNEnd(solves, n);
  if (end === null) return null;
  return averageOfWindow(solves.slice(end - n, end));
}

// Parse a user-typed time ("12.34", "1:05.12", "0.5") to milliseconds.
// With a colon, every part must be under 60; a single number may exceed 60.
// Rejects empty, non-numeric, zero, and over-24h inputs.
export function parseMs(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const parts = trimmed.split(":");
  if (parts.length > 3) return null;
  let totalSeconds = 0;
  for (const part of parts) {
    if (!/^\d+(\.\d{1,6})?$/.test(part)) return null;
    const value = Number(part);
    if (parts.length > 1 && value >= 60) return null;
    totalSeconds = totalSeconds * 60 + value;
  }
  const ms = Math.round(totalSeconds * 1000);
  if (!Number.isFinite(ms) || ms <= 0 || ms > 24 * 3600 * 1000) return null;
  return ms;
}
