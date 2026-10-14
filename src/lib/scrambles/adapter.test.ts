import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { PUZZLES } from "@/lib/puzzles";
import { cubingScrambleProvider } from "./adapter";

// The browser loads cubing unbundled from public/cubing so its search worker
// can resolve sibling chunks (bundling rewrites them — cubing/cubing.js#309).
describe("public/cubing browser copy", () => {
  it("exists and generates a scramble via native ESM with intact sibling imports", { timeout: 120_000 }, async () => {
    const entry = "public/cubing/scramble/index.js";
    expect(existsSync(entry), `${entry} missing — run: node scripts/copy-cubing.mjs`).toBe(true);
    const mod = (await import(/* @vite-ignore */ pathToFileURL(entry).href)) as {
      randomScrambleForEvent: (id: string) => Promise<{ toString(): string }>;
    };
    const alg = await mod.randomScrambleForEvent("333");
    expect(alg.toString().length).toBeGreaterThan(0);
  });
});

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
