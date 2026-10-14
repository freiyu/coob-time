import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/lib/puzzles";
import { cubingScrambleProvider } from "./adapter";

describe("cubingScrambleProvider", () => {
  it(
    "produces a non-empty scramble for every supported puzzle",
    { timeout: 120_000 },
    async () => {
      for (const puzzle of PUZZLES) {
        const result = await cubingScrambleProvider(puzzle.id);
        expect(result.ok, `${puzzle.id}: ${result.ok ? "" : result.error}`).toBe(
          true,
        );
        if (result.ok) {
          expect(result.scramble.length).toBeGreaterThan(0);
          expect(result.scramble).not.toContain("undefined");
          expect(result.scramble).not.toContain("NaN");
        }
      }
    },
  );

  it("generates different 3x3 scrambles on successive calls", async () => {
    const first = await cubingScrambleProvider("3x3");
    const second = await cubingScrambleProvider("3x3");
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.scramble).not.toBe(second.scramble);
    }
  });
});
