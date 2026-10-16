"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Penalty, SolveRecord } from "@/lib/storage/types";
import { effectiveMs, formatMs } from "@/lib/statistics";
import type {
  InspectionMode,
  TimerEngine,
  TimerPhase,
} from "@/lib/timer/types";

interface TimerCardProps {
  engine: TimerEngine;
  phase: TimerPhase;
  ao5: number | null;
  ao5Dnf: boolean;
  pendingSolve: SolveRecord | null;
  scrambleReady: boolean;
  holdMode: boolean;
  inspectionMode: InspectionMode;
  hideTimer: boolean;
  saveState: "saving" | "saved" | "failed" | null;
  onPress: () => void;
  onRelease: () => void;
  onSetPenalty: (penalty: Penalty) => void;
}

const subscribeTouchPrimary = (onChange: () => void) => {
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readTouchPrimary = () => window.matchMedia("(pointer: coarse)").matches;

function useTouchPrimary() {
  return useSyncExternalStore(
    subscribeTouchPrimary,
    readTouchPrimary,
    () => false,
  );
}

const STATE_LABEL: Record<
  Exclude<TimerPhase, "idle" | "stopped" | "inspection">,
  string
> = {
  holding: "Hold…",
  ready: "Ready",
  running: "Running",
  saving: "Saving…",
  saved: "Saved",
};

export default function TimerCard({
  engine,
  phase,
  ao5,
  ao5Dnf,
  pendingSolve,
  scrambleReady,
  holdMode,
  inspectionMode,
  hideTimer,
  saveState,
  onPress,
  onRelease,
  onSetPenalty,
}: TimerCardProps) {
  const touchPrimary = useTouchPrimary();
  const [elapsed, setElapsed] = useState(0);
  const [insp, setInsp] = useState(0);
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

  // Touch/pen on the timer card mirrors Space (FR-T04): press-and-hold
  // arms, lifting starts; tapping while running stops. A swipe >10px
  // cancels so scrolling the page never starts a solve. Mouse clicks
  // stay inert (owner's desktop decision).
  const pointerRef = useRef<{
    id: number;
    x: number;
    y: number;
    cancelled: boolean;
  } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    if ((event.target as HTMLElement).closest("button")) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events (e2e) have no active pointer to capture.
    }
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      cancelled: false,
    };
    onPress();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = pointerRef.current;
    if (!state || state.id !== event.pointerId || state.cancelled) return;
    if (Math.hypot(event.clientX - state.x, event.clientY - state.y) > 10) {
      state.cancelled = true;
      engine.cancel();
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = pointerRef.current;
    if (!state || state.id !== event.pointerId) return;
    pointerRef.current = null;
    if (state.cancelled) {
      engine.cancel();
      return;
    }
    onRelease();
  };

  const handlePointerCancel = () => {
    if (pointerRef.current === null) return;
    pointerRef.current = null;
    engine.cancel();
  };

  useEffect(() => {
    const live =
      phase === "running" ||
      phase === "inspection" ||
      phase === "holding" ||
      phase === "ready";
    if (!live) {
      setElapsed(engine.elapsedMs());
      setInsp(engine.inspectionElapsedMs());
      return;
    }
    let frame = requestAnimationFrame(function tick() {
      setElapsed(engine.elapsedMs());
      setInsp(engine.inspectionElapsedMs());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, engine]);

  // The inspection clock keeps ticking through the hold, so the +2/DNF cue
  // is still visible when the start actually gets judged.
  const showInspection =
    phase === "inspection" ||
    ((phase === "holding" || phase === "ready") && insp > 0);

  let digits: string;
  if (phase === "stopped") {
    digits = pendingSolve
      ? pendingSolve.penalty === "dnf"
        ? "DNF"
        : formatMs(effectiveMs(pendingSolve) ?? pendingSolve.rawTimeMs)
      : "—";
  } else if (showInspection) {
    // Whole seconds only — a millisecond inspection clock is noise.
    digits = String(Math.floor(insp / 1000));
  } else if (phase === "running" && hideTimer) {
    digits = "solve";
  } else {
    digits = formatMs(elapsed);
  }

  const idleCopy =
    inspectionMode !== "off"
      ? holdMode
        ? touchPrimary
          ? "Hold to inspect"
          : "Hold Space to inspect"
        : touchPrimary
          ? "Tap to inspect"
          : "Press Space to inspect"
      : holdMode
        ? touchPrimary
          ? "Hold to start"
          : "Hold Space to start"
        : touchPrimary
          ? "Tap to start"
          : "Press Space to start";
  // Inspection stays count-up; WCA turns orange at 15s and red at 17s,
  // the 15s mode only warns (no penalties). WCA A4d: 15.00 itself is +2.
  const inspectionDanger = inspectionMode === "wca" && insp >= 17_000;
  const inspectionWarn =
    insp >= 15_000 && (inspectionMode === "wca" || inspectionMode === "15s");
  // Tone line only when the start is actually at stake (WCA / 15s warning).
  // The 15s mode keeps its fuller copy only in the plain inspection label —
  // composed with Hold…/Ready the short "15s up" reads better.
  const cueTone = inspectionDanger
    ? "Start now = DNF"
    : inspectionWarn
      ? inspectionMode === "wca"
        ? "Start now = +2"
        : "15s up"
      : null;

  const label = showInspection
    ? phase === "holding"
      ? cueTone
        ? `Hold… — ${cueTone}`
        : "Hold…"
      : phase === "ready"
        ? cueTone
          ? `Ready — ${cueTone}`
          : "Ready"
        : (inspectionMode === "15s" && insp >= 15_000
            ? "15s up — start whenever"
            : (cueTone ??
              (touchPrimary
                ? `Inspection — ${holdMode ? "hold" : "tap"} the timer`
                : `Inspection — ${holdMode ? "hold" : "press"} Space`)))
    : phase === "idle"
      ? scrambleReady
        ? idleCopy
        : "Waiting for scramble…"
      : phase === "stopped"
        ? saveState === "saving"
          ? "Saving…"
          : saveState === "saved"
            ? "Saved"
            : saveState === "failed"
              ? "Stopped — not saved"
              : "Stopped"
        : STATE_LABEL[phase];
  const showPenalties = phase === "stopped" && pendingSolve !== null;
  const penaltyNote =
    phase === "stopped" && pendingSolve && pendingSolve.penalty !== "none"
      ? ` ${pendingSolve.penalty === "plus2" ? "+2 applied" : "DNF applied"}`
      : "";
  const digitColor = showInspection
    ? inspectionDanger
      ? "text-destructive"
      : inspectionWarn
        ? "text-warning-foreground"
        : "text-foreground"
    : phase === "holding"
      ? "text-destructive"
      : phase === "ready"
        ? "text-brand-strong"
        : "text-foreground";
  const stateColor = showInspection
    ? inspectionDanger
      ? "text-destructive"
      : inspectionWarn
        ? "text-warning-foreground"
        : "text-muted-foreground"
    : phase === "holding"
      ? "text-destructive"
      : phase === "ready"
        ? "text-brand-strong"
        : "text-muted-foreground";
  const ringCls =
    showInspection && inspectionDanger
      ? "ring-1 ring-destructive"
      : phase === "holding"
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`flex h-full min-h-[38vh] select-none flex-col items-center justify-center gap-4 rounded-[14px] border border-border bg-card px-4 py-8 sm:py-10 ${ringCls}`}
      >
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <span
            className={`text-[clamp(3.5rem,14vw,9rem)] leading-none font-bold tabular-nums ${digitColor}`}
          >
            {digits}
          </span>
          {!focused && (
            <span className={`text-sm font-medium ${stateColor}`}>{label}</span>
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
              {ao5 !== null ? (
                formatMs(ao5)
              ) : ao5Dnf ? (
                <span className="text-destructive">DNF</span>
              ) : (
                "—"
              )}
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
