import type {
  InspectionMode,
  TimerEngine,
  TimerPenalty,
  TimerPhase,
  TimerStop,
} from "./types";

export const HOLD_MS = 300;
// WCA A4d: a start at exactly 15.00s already earns +2, at 17.00s DNF
// (of the ready call; here inspection start plays the role of that call).
export const WCA_PLUS2_MS = 15_000;
export const WCA_DNF_MS = 17_000;

export interface TimerEngineOptions {
  holdToReady?: boolean;
}

export function createTimerEngine(
  options: TimerEngineOptions = {},
): TimerEngine {
  const holdToReady = options.holdToReady === true;
  let phase: TimerPhase = "idle";
  let inspectionMode: InspectionMode = "off";
  let inspStartTs: number | null = null;
  let inspPrevPhase: TimerPhase = "idle";
  let holdPrevPhase: TimerPhase = "idle";
  let startTs: number | null = null;
  let holdStartTs: number | null = null;
  let lastElapsed = 0;
  let lastPenalty: TimerPenalty = "none";
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
    if (inspStartTs !== null) {
      const inspected = now() - inspStartTs;
      lastPenalty =
        inspectionMode === "wca"
          ? inspected >= WCA_DNF_MS
            ? "dnf"
            : inspected >= WCA_PLUS2_MS
              ? "plus2"
              : "none"
          : "none";
      inspStartTs = null;
    } else {
      lastPenalty = "none";
    }
    startTs = now();
    lastElapsed = 0;
    setPhase("running");
  };

  const stop = (): TimerStop | null => {
    if (phase !== "running" || startTs === null) return null;
    lastElapsed = now() - startTs;
    startTs = null;
    setPhase("stopped");
    return { rawTimeMs: lastElapsed, penalty: lastPenalty };
  };

  return {
    get phase() {
      return phase;
    },
    holdToReady,
    setInspection(mode) {
      inspectionMode = mode;
      if (mode === "off" && phase === "inspection") {
        inspStartTs = null;
        setPhase(inspPrevPhase);
      }
    },
    startInspection() {
      if (inspectionMode === "off") return false;
      if (phase !== "idle" && phase !== "stopped") return false;
      inspPrevPhase = phase;
      inspStartTs = now();
      lastPenalty = "none";
      setPhase("inspection");
      return true;
    },
    inspectionElapsedMs() {
      // Live clock also while holding/ready from an inspection, so the
      // +2/DNF cue never disappears at the moment the start is judged.
      if (inspStartTs !== null && phase !== "running") {
        return now() - inspStartTs;
      }
      return 0;
    },
    start,
    stop,

    arm() {
      if (!holdToReady) return;
      if (
        phase !== "idle" &&
        phase !== "stopped" &&
        phase !== "inspection"
      ) {
        return;
      }
      holdPrevPhase = phase;
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
        else setPhase(holdPrevPhase);
        return;
      }
      if (phase === "ready") {
        holdStartTs = null;
        start();
      }
    },

    cancel() {
      if (phase === "holding" || phase === "ready") {
        clearReadyTimer();
        holdStartTs = null;
        setPhase(holdPrevPhase);
        return;
      }
      if (phase === "inspection") {
        inspStartTs = null;
        setPhase(inspPrevPhase);
      }
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
