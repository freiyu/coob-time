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
    expect(engine.stop()).toBe(9876.5);
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
    expect(engine.stop()).toBe(200);
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
    expect(engine.stop()).toBe(500);
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
