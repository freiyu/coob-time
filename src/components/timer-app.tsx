"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import ScramblePanel from "@/components/scramble-panel";
import SolveHistory from "@/components/solve-history";
import Statistics from "@/components/statistics";
import TimerCard from "@/components/timer-card";
import TopBar, { type ThemeChoice } from "@/components/top-bar";
import { puzzleLabel, type PuzzleId } from "@/lib/puzzles";
import { cubingScrambleProvider } from "@/lib/scrambles/adapter";
import type { ScrambleResult } from "@/lib/scrambles/types";
import { aoN, bestSingle } from "@/lib/statistics";
import type { Penalty, SolveRecord } from "@/lib/storage/types";
import { useTimer } from "@/lib/timer/use-timer";

// FR-T03: hold Space until ready, release starts the solve (tap still starts
// immediately). Phase 5 settings toggle may make this configurable.
const HOLD_TO_READY = true;

const THEME_KEY = "cubetime-theme";
const THEME_EVENT = "cubetime-theme-change";

interface Session {
  id: string;
  name: string;
  puzzleId: PuzzleId;
  solves: SolveRecord[];
}

interface ScrambleState {
  status: "ready" | "generating" | "error";
  scramble: string;
  error?: string;
}

function defaultSessionId(puzzleId: PuzzleId): string {
  return `${puzzleId}-default`;
}

function readTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable; fall through to the default.
  }
  return "dark";
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function writeTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Preference is applied for this visit even if it cannot be stored.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function TimerApp() {
  const [puzzleId, setPuzzleId] = useState<PuzzleId>("3x3");
  const [sessionId, setSessionId] = useState(() => defaultSessionId("3x3"));
  const [sessions, setSessions] = useState<Session[]>(() => [
    {
      id: defaultSessionId("3x3"),
      name: "Default session",
      puzzleId: "3x3",
      solves: [],
    },
  ]);
  const [scrambleState, setScrambleState] = useState<ScrambleState>({
    status: "generating",
    scramble: "",
  });
  const seqRef = useRef(0);
  const theme = useSyncExternalStore<ThemeChoice>(
    subscribeTheme,
    readTheme,
    () => "dark",
  );

  const session =
    sessions.find(
      (candidate) => candidate.id === sessionId && candidate.puzzleId === puzzleId,
    ) ?? {
      id: defaultSessionId(puzzleId),
      name: "Default session",
      puzzleId,
      solves: [],
    };
  const solves = session.solves;

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.classList.toggle(
        "dark",
        theme === "system" ? media.matches : theme === "dark",
      );
    };
    apply();
    if (theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const applyScrambleResult = useCallback(
    (seq: number, result: ScrambleResult) => {
      if (seq !== seqRef.current) return;
      if (result.ok) {
        setScrambleState({ status: "ready", scramble: result.scramble });
      } else {
        setScrambleState((state) => ({
          status: "error",
          scramble: state.scramble,
          error: result.error,
        }));
      }
    },
    [],
  );

  const generate = useCallback(
    (pid: PuzzleId) => {
      const seq = ++seqRef.current;
      cubingScrambleProvider(pid).then((result) => {
        applyScrambleResult(seq, result);
      });
    },
    [applyScrambleResult],
  );

  const generateFresh = (pid: PuzzleId) => {
    setScrambleState((state) => ({
      status: "generating",
      scramble: state.scramble,
    }));
    generate(pid);
  };

  useEffect(() => {
    const seq = ++seqRef.current;
    cubingScrambleProvider(puzzleId).then((result) => {
      applyScrambleResult(seq, result);
    });
    return () => {
      seqRef.current += 1;
    };
  }, [puzzleId, applyScrambleResult]);

  const handleSolve = (rawTimeMs: number) => {
    const record: SolveRecord = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      puzzleId,
      rawTimeMs,
      penalty: "none",
      scramble: scrambleState.scramble,
      createdAt: new Date().toISOString(),
      source: "timer",
      schemaVersion: 1,
    };
    setSessions((prev) => {
      const index = prev.findIndex((candidate) => candidate.id === session.id);
      if (index === -1) {
        return [...prev, { ...session, solves: [record] }];
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        solves: [...next[index].solves, record],
      };
      return next;
    });
    generateFresh(puzzleId);
  };

  const handleSetPenalty = (penalty: Penalty) => {
    setSessions((prev) =>
      prev.map((candidate) =>
        candidate.id !== session.id
          ? candidate
          : {
              ...candidate,
              solves: candidate.solves.map((solve, index) =>
                index === candidate.solves.length - 1
                  ? { ...solve, penalty }
                  : solve,
              ),
            },
      ),
    );
  };

  const handleToggleDnf = () => {
    const last = solves.at(-1);
    if (!last) return;
    handleSetPenalty(last.penalty === "dnf" ? "none" : "dnf");
  };

  const handleNewScramble = () => {
    generateFresh(puzzleId);
  };

  const handleDeleteSolve = (id: string) => {
    setSessions((prev) =>
      prev.map((candidate) =>
        candidate.id !== session.id
          ? candidate
          : {
              ...candidate,
              solves: candidate.solves.filter((solve) => solve.id !== id),
            },
      ),
    );
  };

  const timer = useTimer({
    holdToReady: HOLD_TO_READY,
    canStart: () => scrambleState.status === "ready",
    onSolve: handleSolve,
    onNewScramble: handleNewScramble,
    onToggleDnf: handleToggleDnf,
  });
  const { phase } = timer;

  const handlePuzzleChange = (nextPuzzleId: PuzzleId) => {
    if (phase !== "idle" && phase !== "stopped") return;
    setScrambleState({ status: "generating", scramble: "" });
    setPuzzleId(nextPuzzleId);
    setSessionId(defaultSessionId(nextPuzzleId));
  };

  const handleSessionChange = (nextSessionId: string) => {
    if (phase !== "idle" && phase !== "stopped") return;
    setSessionId(nextSessionId);
  };

  const pendingSolve =
    phase === "stopped" ? (solves.at(-1) ?? null) : null;
  const ao5 = aoN(solves, 5);
  const pbMs = bestSingle(solves);

  // Running focus mode: everything except the timer fades out (300ms).
  const focused = phase === "running";
  const fadeCls = `transition-opacity duration-300 ease-out motion-reduce:transition-none ${
    focused ? "pointer-events-none opacity-0" : "opacity-100"
  }`;

  return (
    <>
      <div className={fadeCls} aria-hidden={focused} inert={focused}>
        <TopBar
          puzzleId={puzzleId}
          onPuzzleChange={handlePuzzleChange}
          sessions={[
            { id: session.id, name: session.name, count: solves.length },
          ]}
          sessionId={session.id}
          onSessionChange={handleSessionChange}
          theme={theme}
          onThemeChange={writeTheme}
          selectionLocked={phase !== "idle" && phase !== "stopped"}
        />
      </div>
      <div
        className={`border-b border-border bg-muted ${fadeCls}`}
        aria-hidden={focused}
        inert={focused}
      >
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-muted-foreground sm:px-6">
          Timer and scrambles are live. Solves stay in memory only — refreshing
          loses them until local saving ships.
        </p>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2 sm:gap-6">
          <TimerCard
            engine={timer.engine}
            phase={phase}
            ao5={ao5}
            pendingSolve={pendingSolve}
            scrambleReady={scrambleState.status === "ready"}
            onSetPenalty={handleSetPenalty}
          />
          <div className={fadeCls} aria-hidden={focused} inert={focused}>
            <ScramblePanel
              puzzleId={puzzleId}
              puzzleLabel={puzzleLabel(puzzleId)}
              scramble={scrambleState.scramble}
              status={scrambleState.status}
              error={scrambleState.error}
              newScrambleDisabled={
                scrambleState.status === "generating" ||
                (phase !== "idle" && phase !== "stopped")
              }
              onNewScramble={handleNewScramble}
            />
          </div>
        </div>
        <div
          className={`grid items-start gap-4 lg:grid-cols-2 sm:gap-6 ${fadeCls}`}
          aria-hidden={focused}
          inert={focused}
        >
          <SolveHistory
            solves={solves}
            sessionName={session.name}
            pbMs={pbMs}
            onDelete={handleDeleteSolve}
          />
          <Statistics solves={solves} />
        </div>
      </main>
      <footer
        className={`border-t border-border px-4 py-4 sm:px-6 ${fadeCls}`}
        aria-hidden={focused}
        inert={focused}
      >
        <p className="mx-auto max-w-6xl text-sm text-muted-foreground">
          Shortcuts: Space hold, release to start, press to stop · N new
          scramble · D toggle DNF on the last solve.
        </p>
        <p className="mx-auto mt-1 max-w-6xl text-sm text-muted-foreground">
          Solves are kept in memory only until local saving ships. Nothing is
          synced.
        </p>
      </footer>
    </>
  );
}
