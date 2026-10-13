"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import ScramblePanel from "@/components/scramble-panel";
import SolveHistory from "@/components/solve-history";
import Statistics from "@/components/statistics";
import TimerCard from "@/components/timer-card";
import TopBar, { type ThemeChoice } from "@/components/top-bar";
import {
  SAMPLE_SCRAMBLES,
  aoN,
  bestSingle,
  puzzleLabel,
  sessionsForPuzzle,
  type PuzzleId,
} from "@/lib/sample-data";

const THEME_KEY = "cubetime-theme";
const THEME_EVENT = "cubetime-theme-change";

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
  const [sessionId, setSessionId] = useState("default");
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const theme = useSyncExternalStore<ThemeChoice>(
    subscribeTheme,
    readTheme,
    () => "dark",
  );

  const sessions = useMemo(() => sessionsForPuzzle(puzzleId), [puzzleId]);
  const session =
    sessions.find((candidate) => candidate.id === sessionId) ?? sessions[0];

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

  const handlePuzzleChange = (nextPuzzleId: PuzzleId) => {
    const nextSessions = sessionsForPuzzle(nextPuzzleId);
    setPuzzleId(nextPuzzleId);
    setSessionId(nextSessions[0].id);
    setScrambleIndex(0);
  };

  const handleSessionChange = (nextSessionId: string) => {
    setSessionId(nextSessionId);
    setScrambleIndex(0);
  };

  const scrambles = SAMPLE_SCRAMBLES[puzzleId] ?? [];
  const scramble =
    scrambles.length > 0
      ? scrambles[scrambleIndex % scrambles.length]
      : "No sample scramble for this puzzle.";
  const solves = session.solves;
  const pbMs = bestSingle(solves);
  const ao5 = aoN(solves, 5);

  return (
    <>
      <TopBar
        puzzleId={puzzleId}
        onPuzzleChange={handlePuzzleChange}
        sessions={sessions.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          count: candidate.solves.length,
        }))}
        sessionId={session.id}
        onSessionChange={handleSessionChange}
        theme={theme}
        onThemeChange={writeTheme}
      />
      <div className="border-b border-border bg-muted">
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-muted-foreground sm:px-6">
          Prototype build — sample data only. The timer, saving, and live
          scramble generation are not active yet.
        </p>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-6 sm:space-y-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2 sm:gap-6">
          <TimerCard ao5={ao5} />
          <ScramblePanel
            puzzleId={puzzleId}
            puzzleLabel={puzzleLabel(puzzleId)}
            scramble={scramble}
            onNewScramble={() => setScrambleIndex((index) => index + 1)}
          />
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2 sm:gap-6">
          <SolveHistory
            solves={solves}
            sessionName={session.name}
            pbMs={pbMs}
          />
          <Statistics solves={solves} />
        </div>
      </main>
      <footer className="border-t border-border px-4 py-4 sm:px-6">
        <p className="mx-auto max-w-6xl text-sm text-muted-foreground">
          Data is stored only in this browser — it is never synced. Clearing
          site data removes it.
        </p>
      </footer>
    </>
  );
}
