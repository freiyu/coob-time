import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOLD_MS, createTimerEngine } from "./engine";

let now = 0;

beforeEach(() => {
  vi.useFakeTimers();
  now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("createTimerEngine", () => {
  it("starts from idle and measures elapsed from timestamps", () => {
    const engine = createTimerEngine();
    engine.start();
    expect(engine.phase).toBe("running");
    now += 1234.5;
    expect(engine.elapsedMs()).toBe(1234.5);
  });

  it("stop returns the raw elapsed ms and freezes it", () => {
    const engine = createTimerEngine();
    engine.start();
    now += 9876.5;
    expect(engine.stop()).toEqual({ rawTimeMs: 9876.5, penalty: "none" });
    expect(engine.phase).toBe("stopped");
    expect(engine.elapsedMs()).toBe(9876.5);
    now += 5000;
    expect(engine.elapsedMs()).toBe(9876.5);
  });

  it("start while running is a no-op (key-repeat safety)", () => {
    const engine = createTimerEngine();
    engine.start();
    now += 100;
    engine.start();
    now += 100;
    expect(engine.stop()).toEqual({ rawTimeMs: 200, penalty: "none" });
  });

  it("stop outside running returns null", () => {
    const engine = createTimerEngine();
    expect(engine.stop()).toBeNull();
    engine.start();
    engine.stop();
    expect(engine.stop()).toBeNull();
  });

  it("start from stopped begins a fresh attempt", () => {
    const engine = createTimerEngine();
    engine.start();
    now += 10_000;
    engine.stop();
    engine.start();
    expect(engine.phase).toBe("running");
    now += 50;
    expect(engine.elapsedMs()).toBe(50);
  });

  it("arm is a no-op without holdToReady", () => {
    const engine = createTimerEngine();
    engine.arm();
    expect(engine.phase).toBe("idle");
  });

  it("hold: release before the threshold returns to idle", () => {
    const engine = createTimerEngine({ holdToReady: true });
    engine.arm();
    expect(engine.phase).toBe("holding");
    now += HOLD_MS - 1;
    engine.release();
    expect(engine.phase).toBe("idle");
  });

  it("hold: holding past the threshold becomes ready and release starts", () => {
    const engine = createTimerEngine({ holdToReady: true });
    engine.arm();
    now += HOLD_MS;
    vi.advanceTimersByTime(HOLD_MS);
    expect(engine.phase).toBe("ready");
    engine.release();
    expect(engine.phase).toBe("running");
    now += 500;
    expect(engine.stop()).toEqual({ rawTimeMs: 500, penalty: "none" });
  });

  it("cancel clears holding and ready states", () => {
    const engine = createTimerEngine({ holdToReady: true });
    engine.arm();
    engine.cancel();
    expect(engine.phase).toBe("idle");
    engine.arm();
    now += HOLD_MS;
    vi.advanceTimersByTime(HOLD_MS);
    expect(engine.phase).toBe("ready");
    engine.cancel();
    expect(engine.phase).toBe("idle");
  });

  it("subscribe notifies phase changes until unsubscribed", () => {
    const engine = createTimerEngine();
    const seen: string[] = [];
    const unsubscribe = engine.subscribe((phase) => seen.push(phase));
    engine.start();
    engine.stop();
    unsubscribe();
    engine.start();
    expect(seen).toEqual(["running", "stopped"]);
  });
});

describe("inspection", () => {
  it("is a no-op while mode is off", () => {
    const engine = createTimerEngine();
    expect(engine.startInspection()).toBe(false);
    expect(engine.phase).toBe("idle");
  });

  it("runs from idle/stopped and Escape returns to the previous phase", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    expect(engine.startInspection()).toBe(true);
    expect(engine.phase).toBe("inspection");
    now += 4_000;
    expect(engine.inspectionElapsedMs()).toBe(4_000);
    engine.cancel();
    expect(engine.phase).toBe("idle");

    engine.start();
    now += 9_000;
    engine.stop();
    expect(engine.startInspection()).toBe(true);
    engine.cancel();
    expect(engine.phase).toBe("stopped");
  });

  it("wca: start before 15s has no penalty", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    engine.startInspection();
    now += 14_999;
    engine.start();
    now += 1_234;
    expect(engine.stop()).toEqual({ rawTimeMs: 1_234, penalty: "none" });
  });

  it("wca: start at exactly 15.000s is +2 (WCA A4d)", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    engine.startInspection();
    now += 15_000;
    engine.start();
    now += 1_000;
    expect(engine.stop()).toEqual({ rawTimeMs: 1_000, penalty: "plus2" });
  });

  it("wca: start at 16.999s is still +2", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    engine.startInspection();
    now += 16_999;
    engine.start();
    now += 1_000;
    expect(engine.stop()).toEqual({ rawTimeMs: 1_000, penalty: "plus2" });
  });

  it("wca: start at exactly 17.000s is DNF", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    engine.startInspection();
    now += 17_000;
    engine.start();
    now += 1_000;
    expect(engine.stop()).toEqual({ rawTimeMs: 1_000, penalty: "dnf" });
  });

  it("15s mode never adds a penalty", () => {
    const engine = createTimerEngine();
    engine.setInspection("15s");
    engine.startInspection();
    now += 60_000;
    engine.start();
    now += 500;
    expect(engine.stop()).toEqual({ rawTimeMs: 500, penalty: "none" });
  });

  it("hold from inspection: early release returns to inspection with the clock running", () => {
    const engine = createTimerEngine({ holdToReady: true });
    engine.setInspection("wca");
    engine.startInspection();
    now += 2_000;
    engine.arm();
    expect(engine.phase).toBe("holding");
    now += HOLD_MS - 1;
    engine.release();
    expect(engine.phase).toBe("inspection");
    now += 14_001;
    expect(engine.inspectionElapsedMs()).toBe(16_300);
    engine.arm();
    now += HOLD_MS;
    vi.advanceTimersByTime(HOLD_MS);
    expect(engine.phase).toBe("ready");
    engine.release();
    expect(engine.phase).toBe("running");
    now += 999;
    expect(engine.stop()).toEqual({ rawTimeMs: 999, penalty: "plus2" });
  });

  it("turning inspection off mid-run returns to the previous phase", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    engine.startInspection();
    now += 1_000;
    engine.setInspection("off");
    expect(engine.phase).toBe("idle");
    expect(engine.inspectionElapsedMs()).toBe(0);
  });

  it("turning inspection off while holding from an inspection drops it", () => {
    const engine = createTimerEngine({ holdToReady: true });
    engine.setInspection("wca");
    engine.startInspection();
    now += 16_000;
    engine.arm();
    expect(engine.phase).toBe("holding");
    engine.setInspection("off");
    expect(engine.phase).toBe("idle");
    expect(engine.inspectionElapsedMs()).toBe(0);
  });

  it("a solve started without inspection records penalty none", () => {
    const engine = createTimerEngine();
    engine.setInspection("wca");
    engine.start();
    now += 800;
    expect(engine.stop()).toEqual({ rawTimeMs: 800, penalty: "none" });
  });
});
