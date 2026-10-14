import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTimerEngine } from "./engine";
import { isInsideMenu, isTypingTarget } from "./keyboard";
import type { TimerPhase } from "./types";

interface UseTimerOptions {
  holdToReady: boolean;
  canStart: () => boolean;
  onSolve: (rawTimeMs: number) => void;
  onNewScramble: () => void;
  onToggleDnf: () => void;
}

export function useTimer(options: UseTimerOptions) {
  const { holdToReady } = options;
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

  const toggle = useCallback(() => {
    if (engine.phase === "running") {
      const ms = engine.stop();
      if (ms !== null) onSolveRef.current(ms);
    } else if (canStartRef.current()) {
      engine.start();
    }
  }, [engine]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (isInsideMenu(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();
        if (engine.holdToReady && engine.phase !== "running") {
          if (canStartRef.current()) engine.arm();
        } else {
          toggle();
        }
        return;
      }
      if (event.key === "n" || event.key === "N") {
        if (engine.phase === "idle" || engine.phase === "stopped") {
          onNewScrambleRef.current();
        }
        return;
      }
      if (event.key === "d" || event.key === "D") {
        if (engine.phase === "stopped") onToggleDnfRef.current();
        return;
      }
      if (event.key === "Escape") {
        engine.cancel();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (isTypingTarget(event.target)) return;
      if (engine.holdToReady) engine.release();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [engine, toggle]);

  return { engine, phase, toggle };
}
