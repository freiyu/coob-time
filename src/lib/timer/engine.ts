import type { TimerEngine, TimerPhase } from "./types";

export const HOLD_MS = 300;

export interface TimerEngineOptions {
  holdToReady?: boolean;
}

export function createTimerEngine(
  options: TimerEngineOptions = {},
): TimerEngine {
  const holdToReady = options.holdToReady === true;
  let phase: TimerPhase = "idle";
  let startTs: number | null = null;
  let holdStartTs: number | null = null;
  let lastElapsed = 0;
  let readyTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(phase: TimerPhase) => void>();

  const now = () => performance.now();

  const notify = () => {
    for (const listener of listeners) listener(phase);
  };

  const setPhase = (next: TimerPhase) => {
    if (phase === next) return;
    phase = next;
    notify();
  };

  const clearReadyTimer = () => {
    if (readyTimer !== null) {
      clearTimeout(readyTimer);
      readyTimer = null;
    }
  };

  const start = () => {
    if (phase === "running") return;
    clearReadyTimer();
    holdStartTs = null;
    startTs = now();
    lastElapsed = 0;
    setPhase("running");
  };

  const stop = (): number | null => {
    if (phase !== "running" || startTs === null) return null;
    lastElapsed = now() - startTs;
    startTs = null;
    setPhase("stopped");
    return lastElapsed;
  };

  return {
    get phase() {
      return phase;
    },
    holdToReady,
    start,
    stop,

    arm() {
      if (!holdToReady) return;
      if (phase !== "idle" && phase !== "stopped") return;
      clearReadyTimer();
      holdStartTs = now();
      lastElapsed = 0;
      setPhase("holding");
      readyTimer = setTimeout(() => {
        readyTimer = null;
        if (phase === "holding") setPhase("ready");
      }, HOLD_MS);
    },

    release() {
      if (phase === "holding") {
        clearReadyTimer();
        const held = holdStartTs === null ? 0 : now() - holdStartTs;
        holdStartTs = null;
        if (held >= HOLD_MS) start();
        else setPhase("idle");
        return;
      }
      if (phase === "ready") {
        holdStartTs = null;
        start();
      }
    },

    cancel() {
      if (phase !== "holding" && phase !== "ready") return;
      clearReadyTimer();
      holdStartTs = null;
      setPhase("idle");
    },

    elapsedMs() {
      if (phase === "running" && startTs !== null) return now() - startTs;
      return lastElapsed;
    },

    subscribe(listener: (phase: TimerPhase) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
