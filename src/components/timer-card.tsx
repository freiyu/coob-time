"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Penalty, SolveRecord } from "@/lib/storage/types";
import { effectiveMs, formatMs } from "@/lib/statistics";
import type { TimerEngine, TimerPhase } from "@/lib/timer/types";

interface TimerCardProps {
  engine: TimerEngine;
  phase: TimerPhase;
  ao5: number | null;
  pendingSolve: SolveRecord | null;
  scrambleReady: boolean;
  onSetPenalty: (penalty: Penalty) => void;
}

const STATE_LABEL: Record<TimerPhase, string> = {
  idle: "Hold Space to start",
  holding: "Hold…",
  ready: "Ready",
  running: "Running",
  stopped: "Stopped — not saved yet",
  saving: "Saving…",
  saved: "Saved",
};

export default function TimerCard({
  engine,
  phase,
  ao5,
  pendingSolve,
  scrambleReady,
  onSetPenalty,
}: TimerCardProps) {
  const [elapsed, setElapsed] = useState(0);
  const focused = phase === "running";
  const cardRef = useRef<HTMLElement>(null);
  const [flip, setFlip] = useState<{ dx: number; dy: number } | null>(null);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!focused) {
      setFlip(null);
      return;
    }
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setFlip({
      dx: window.innerWidth / 2 - (rect.left + rect.width / 2),
      dy: window.innerHeight / 2 - (rect.top + rect.height / 2),
    });
  }, [focused]);

  useEffect(() => {
    if (phase !== "running") {
      setElapsed(engine.elapsedMs());
      return;
    }
    let frame = requestAnimationFrame(function tick() {
      setElapsed(engine.elapsedMs());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, engine]);

  let digits: string;
  if (phase === "stopped" && pendingSolve) {
    digits =
      pendingSolve.penalty === "dnf"
        ? "DNF"
        : formatMs(effectiveMs(pendingSolve) ?? pendingSolve.rawTimeMs);
  } else {
    digits = formatMs(elapsed);
  }

  const label =
    phase === "idle" && !scrambleReady ? "Waiting for scramble…" : STATE_LABEL[phase];
  const showPenalties = phase === "stopped" && pendingSolve !== null;
  const penaltyNote =
    phase === "stopped" && pendingSolve && pendingSolve.penalty !== "none"
      ? ` ${pendingSolve.penalty === "plus2" ? "+2 applied" : "DNF applied"}`
      : "";
  const digitColor =
    phase === "holding"
      ? "text-destructive"
      : phase === "ready"
        ? "text-brand-strong"
        : "text-foreground";
  const stateColor =
    phase === "holding"
      ? "text-destructive"
      : phase === "ready"
        ? "text-brand-strong"
        : "text-muted-foreground";
  const ringCls =
    phase === "holding"
      ? "ring-1 ring-destructive"
      : phase === "ready"
        ? "ring-1 ring-brand"
        : "";

  return (
    <section
      ref={cardRef}
      aria-label="Timer"
      className={`transition-transform duration-300 ease-out motion-reduce:transition-none ${
        flip ? "z-10" : ""
      }`}
      style={flip ? { transform: `translate(${flip.dx}px, ${flip.dy}px)` } : undefined}
    >
      <div
        className={`flex h-full min-h-[38vh] flex-col items-center justify-center gap-4 rounded-[14px] border border-border bg-card px-4 py-8 sm:py-10 ${ringCls}`}
      >
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <span
            className={`text-[clamp(3.5rem,14vw,9rem)] leading-none font-bold tabular-nums ${digitColor}`}
          >
            {digits}
          </span>
          {!focused && (
            <span className={`text-sm font-medium ${stateColor}`}>
              {phase === "idle" && scrambleReady ? "Hold Space to start" : label}
            </span>
          )}
        </div>
        {showPenalties && pendingSolve && (
          <div
            role="group"
            aria-label="Penalty for the last solve"
            className="flex gap-2"
          >
            <button
              type="button"
              aria-pressed={pendingSolve.penalty === "plus2"}
              onClick={() =>
                onSetPenalty(pendingSolve.penalty === "plus2" ? "none" : "plus2")
              }
              className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                pendingSolve.penalty === "plus2"
                  ? "border-warning bg-warning text-warning-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              +2
            </button>
            <button
              type="button"
              aria-pressed={pendingSolve.penalty === "dnf"}
              onClick={() =>
                onSetPenalty(pendingSolve.penalty === "dnf" ? "none" : "dnf")
              }
              className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                pendingSolve.penalty === "dnf"
                  ? "border-danger bg-danger text-danger-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              DNF
            </button>
          </div>
        )}
        {!focused && (
          <div className="mt-2 flex w-full max-w-xs items-baseline justify-between border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Average of 5</span>
            <span className="font-semibold tabular-nums text-foreground">
              {ao5 !== null ? formatMs(ao5) : "—"}
            </span>
          </div>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {label + penaltyNote}
      </p>
    </section>
  );
}
