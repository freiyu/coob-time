import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTimerEngine } from "./engine";
import { isDialogOpen, isInsideMenu, isTypingTarget } from "./keyboard";
import type { InspectionMode, TimerPenalty, TimerPhase } from "./types";

interface UseTimerOptions {
  holdToReady: boolean;
  inspectionMode: InspectionMode;
  canStart: () => boolean;
  onSolve: (rawTimeMs: number, penalty: TimerPenalty) => void;
  onNewScramble: () => void;
  onToggleDnf: () => void;
}

export function useTimer(options: UseTimerOptions) {
  const { holdToReady, inspectionMode } = options;
  const engine = useMemo(
    () => createTimerEngine({ holdToReady }),
    [holdToReady],
  );
  const [phase, setPhase] = useState<TimerPhase>(engine.phase);

  const onSolveRef = useRef(options.onSolve);
  const onNewScrambleRef = useRef(options.onNewScramble);
  const onToggleDnfRef = useRef(options.onToggleDnf);
  const canStartRef = useRef(options.canStart);
  useEffect(() => {
    onSolveRef.current = options.onSolve;
    onNewScrambleRef.current = options.onNewScramble;
    onToggleDnfRef.current = options.onToggleDnf;
    canStartRef.current = options.canStart;
  });

  useEffect(() => engine.subscribe(setPhase), [engine]);
  useEffect(() => engine.setInspection(inspectionMode), [
    engine,
    inspectionMode,
  ]);

  const toggle = useCallback(() => {
    if (engine.phase === "running") {
      const stop = engine.stop();
      if (stop !== null) onSolveRef.current(stop.rawTimeMs, stop.penalty);
    } else if (canStartRef.current()) {
      engine.start();
    }
  }, [engine]);

  // One Space-press action shared by the keyboard and the touch gesture
  // on the timer card (FR-T04): inspection first, then arm (hold mode)
  // or start/stop (press mode).
  const press = useCallback(() => {
    // First press from idle/stopped enters inspection (when enabled);
    // the next hold/press is the actual solve start. Gated by canStart
    // so a broken scramble can't park the user in inspection.
    if (
      (engine.phase === "idle" || engine.phase === "stopped") &&
      canStartRef.current() &&
      engine.startInspection()
    ) {
      return;
    }
    if (engine.holdToReady && engine.phase !== "running") {
      if (canStartRef.current()) engine.arm();
    } else {
      toggle();
    }
  }, [engine, toggle]);

  const release = useCallback(() => {
    if (engine.holdToReady) engine.release();
  }, [engine]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (isInsideMenu(event.target)) return;
      if (isDialogOpen()) return;

      if (event.code === "Space") {
        // Held Space scrolls the page via auto-repeat keydowns, so block
        // every Space (including repeats) before the repeat guard.
        event.preventDefault();
        if (event.repeat) return;
        press();
        return;
      }

      if (event.repeat) return;
      if (event.key === "n" || event.key === "N") {
        if (engine.phase === "idle" || engine.phase === "stopped") {
          onNewScrambleRef.current();
        }
        return;
      }
      if (event.key === "d" || event.key === "D") {
        if (engine.phase === "stopped" || engine.phase === "inspection") {
          onToggleDnfRef.current();
        }
        return;
      }
      if (event.key === "Escape") {
        engine.cancel();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (isTypingTarget(event.target)) return;
      // A dialog opened mid-hold must not let release() start a solve.
      if (isDialogOpen()) return;
      release();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [engine, toggle, press, release]);

  return { engine, phase, toggle, press, release };
}
