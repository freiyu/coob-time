import { describe, expect, it } from "vitest";
import {
  aoN,
  bestAoN,
  bestAoNEnd,
  bestSingle,
  effectiveMs,
  formatMs,
  mean,
  parseMs,
} from "./statistics";

const solve = (rawTimeMs: number, penalty: "none" | "plus2" | "dnf" = "none") => ({
  rawTimeMs,
  penalty,
});

describe("effectiveMs", () => {
  it("returns the raw time when there is no penalty", () => {
    expect(effectiveMs(solve(12345))).toBe(12345);
  });

  it("adds exactly two seconds for +2", () => {
    expect(effectiveMs(solve(13250, "plus2"))).toBe(15250);
  });

  it("returns null for DNF — never zero", () => {
    expect(effectiveMs(solve(10000, "dnf"))).toBeNull();
  });
});

describe("formatMs", () => {
  it("formats seconds and minutes", () => {
    expect(formatMs(1000)).toBe("1.00");
    expect(formatMs(65120)).toBe("1:05.12");
  });
});

describe("bestSingle", () => {
  it("ignores DNFs and applies +2", () => {
    const solves = [solve(9000, "plus2"), solve(8000, "dnf"), solve(9500)];
    expect(bestSingle(solves)).toBe(9500);
  });

  it("returns null when every solve is DNF or there are none", () => {
    expect(bestSingle([solve(1, "dnf")])).toBeNull();
    expect(bestSingle([])).toBeNull();
  });
});

describe("mean", () => {
  it("averages valid solves only, with +2 counted", () => {
    const solves = [solve(10000), solve(20000, "plus2"), solve(30000, "dnf")];
    expect(mean(solves)).toBe(16000);
  });

  it("returns null with no valid solves", () => {
    expect(mean([solve(1, "dnf")])).toBeNull();
  });
});

describe("aoN (WCA-style)", () => {
  it("drops the fastest and slowest of five", () => {
    // sorted: 9000 10000 11000 12000 15000 → drop 9000 & 15000
    const solves = [solve(15000), solve(10000), solve(12000), solve(9000), solve(11000)];
    expect(aoN(solves, 5)).toBe(11000);
  });

  it("drops the two fastest and two slowest of twelve", () => {
    const solves = Array.from({ length: 12 }, (_, i) => solve((i + 1) * 1000));
    // sorted 1000..12000 → counted 3000..10000 → mean 6500
    expect(aoN(solves, 12)).toBe(6500);
  });

  it("counts a single DNF as infinitely slow so it is dropped", () => {
    const solves = [solve(15000, "dnf"), solve(10000), solve(12000), solve(9000), solve(11000)];
    expect(aoN(solves, 5)).toBe(11000);
  });

  it("returns null (DNF average) when a DNF remains in the counted set", () => {
    const solves = [solve(15000, "dnf"), solve(14000, "dnf"), solve(12000), solve(9000), solve(11000)];
    expect(aoN(solves, 5)).toBeNull();
  });

  it("returns null for insufficient solve counts", () => {
    expect(aoN([solve(1000), solve(2000)], 5)).toBeNull();
    expect(aoN([], 5)).toBeNull();
  });

  it("handles ties without dropping both identical extremes wrongly", () => {
    // fastest 8000 appears twice, slowest 20000: drop one 8000 and 20000
    const solves = [solve(8000), solve(8000), solve(10000), solve(12000), solve(20000)];
    expect(aoN(solves, 5)).toBe(10000);
  });
});

describe("bestAoN", () => {
  it("skips DNF windows and picks the best valid window", () => {
    // window ending at 5 has two DNFs → DNF average; window ending at 6 is valid
    const solves = [
      solve(50000, "dnf"),
      solve(40000, "dnf"),
      solve(9000),
      solve(10000),
      solve(11000),
      solve(12000),
    ];
    expect(aoN(solves.slice(0, 5), 5)).toBeNull();
    expect(bestAoN(solves, 5)).toBe(11000);
  });

  it("returns null when every window is DNF or counts are insufficient", () => {
    const allDnf = [solve(1, "dnf"), solve(2, "dnf"), solve(3, "dnf"), solve(4, "dnf"), solve(5, "dnf")];
    expect(bestAoN(allDnf, 5)).toBeNull();
    expect(bestAoN([solve(1000)], 5)).toBeNull();
  });
});

describe("bestAoNEnd", () => {
  it("returns the end index of the first best window (ties keep the earliest)", () => {
    // end5 avg 32000; first window averaging 9000 ends at 9; end10 ties and must not replace it
    const laterWins = [
      solve(30000), solve(31000), solve(32000), solve(33000), solve(34000),
      solve(9000), solve(9000), solve(9000), solve(9000), solve(9000),
    ];
    expect(bestAoNEnd(laterWins, 5)).toBe(9);
    const ties = [solve(9000), solve(9000), solve(9000), solve(9000), solve(9000), solve(9000)];
    expect(bestAoNEnd(ties, 5)).toBe(5);
  });

  it("returns null for insufficient or all-DNF data", () => {
    expect(bestAoNEnd([solve(1000)], 5)).toBeNull();
    const allDnf = [
      solve(1, "dnf"), solve(2, "dnf"), solve(3, "dnf"), solve(4, "dnf"), solve(5, "dnf"),
    ];
    expect(bestAoNEnd(allDnf, 5)).toBeNull();
  });
});

describe("parseMs", () => {
  it("parses seconds and minute formats", () => {
    expect(parseMs("12.34")).toBe(12340);
    expect(parseMs("9")).toBe(9000);
    expect(parseMs("1:05.12")).toBe(65120);
    expect(parseMs(" 0.5 ")).toBe(500);
  });

  it("rejects invalid input", () => {
    expect(parseMs("")).toBeNull();
    expect(parseMs("abc")).toBeNull();
    expect(parseMs("1:2:3:4")).toBeNull();
    expect(parseMs("1:70")).toBeNull(); // non-last part >= 60
    expect(parseMs("0")).toBeNull();
    expect(parseMs("-5")).toBeNull();
    expect(parseMs("25:00:00")).toBeNull(); // over 24h
  });
});
