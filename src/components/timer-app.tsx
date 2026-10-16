"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import DataPanel from "@/components/data-panel";
import Dialog from "@/components/dialog";
import ScramblePanel from "@/components/scramble-panel";
import SolveHistory from "@/components/solve-history";
import Statistics from "@/components/statistics";
import TimerCard from "@/components/timer-card";
import TopBar, { type ThemeChoice } from "@/components/top-bar";
import { PUZZLES, puzzleLabel, type PuzzleId } from "@/lib/puzzles";
import { cubingScrambleProvider } from "@/lib/scrambles/adapter";
import type { ScrambleResult } from "@/lib/scrambles/types";
import { aoN, bestSingle } from "@/lib/statistics";
import {
  DEFAULT_SETTINGS,
  deleteSession as deleteSessionRecord,
  deleteSolve as deleteSolveRecord,
  getSettings,
  listSessions,
  listSolves,
  putSession,
  putSettings,
  putSolve,
} from "@/lib/storage/idb";
import type {
  Penalty,
  SessionRecord,
  SettingsRecord,
  SolveRecord,
} from "@/lib/storage/types";
import { useTimer } from "@/lib/timer/use-timer";

const THEME_KEY = "cubetime-theme";
const THEME_EVENT = "cubetime-theme-change";

// Short confirmation beep for a recorded solve (settings.soundEnabled).
// Runs only from a key handler, so the AudioContext has a user gesture.
let audioCtx: AudioContext | null = null;
function playBeep() {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // Audio unavailable — the solve itself is already persisted.
  }
}

type Session = SessionRecord & { solves: SolveRecord[] };

interface ScrambleState {
  status: "ready" | "generating" | "error";
  scramble: string;
  error?: string;
}

function defaultSessionId(puzzleId: PuzzleId): string {
  return `${puzzleId}-default`;
}

// Placeholder for in-memory phantom sessions until hydration or the first
// persisted write stamps a real timestamp (new Date() is unstable at prerender).
const INITIAL_STAMP = "1970-01-01T00:00:00.000Z";

function defaultSession(puzzleId: PuzzleId): Session {
  return {
    id: defaultSessionId(puzzleId),
    name: "Default session",
    puzzleId,
    createdAt: INITIAL_STAMP,
    updatedAt: INITIAL_STAMP,
    solves: [],
  };
}

function toSessionRecord(session: Session): SessionRecord {
  return {
    id: session.id,
    name: session.name,
    puzzleId: session.puzzleId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    ...(session.notes !== undefined ? { notes: session.notes } : {}),
  };
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
    defaultSession("3x3"),
  ]);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [storageOk, setStorageOk] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    "saving" | "saved" | "failed" | null
  >(null);
  const [dataPanelOpen, setDataPanelOpen] = useState(false);
  const hydratedOnceRef = useRef(false);
  // The solve created by the most recent timer stop; manual entries must
  // never steal the pending (+2/DNF) slot from it.
  const [pendingSolveId, setPendingSolveId] = useState<string | null>(null);
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
    ) ?? defaultSession(puzzleId);
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

  const reloadStorage = useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loadedSolves, loadedSessions, loadedSettings] = await Promise.all([
          listSolves(),
          listSessions(),
          getSettings(),
        ]);
        const nextSettings = loadedSettings ?? DEFAULT_SETTINGS;
        if (!loadedSettings) await putSettings(nextSettings);
        if (cancelled) return;
        const bySession = new Map<string, SolveRecord[]>();
        for (const solve of loadedSolves) {
          const list = bySession.get(solve.sessionId) ?? [];
          list.push(solve);
          bySession.set(solve.sessionId, list);
        }
        const loaded: Session[] = loadedSessions.map((record) => ({
          ...record,
          solves: (bySession.get(record.id) ?? []).sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          ),
        }));
        setSessions((prev) => {
          // The raced-merge only exists for the very first hydration (a solve
          // completed before the DB read landed). Later reloads must mirror
          // the DB exactly, or delete-all/replace-import would resurrect
          // deleted rows in the UI.
          if (hydratedOnceRef.current) return loaded;
          const loadedIds = new Set(loaded.map((s) => s.id));
          const raced = prev.filter(
            (s) => !loadedIds.has(s.id) && s.solves.length > 0,
          );
          return [...loaded, ...raced];
        });
        if (!hydratedOnceRef.current) {
          hydratedOnceRef.current = true;
          const defaultId = nextSettings.defaultPuzzleId;
          if (PUZZLES.some((puzzle) => puzzle.id === defaultId)) {
            setPuzzleId(defaultId as PuzzleId);
            setSessionId(defaultSessionId(defaultId as PuzzleId));
          }
        }
        setSettings(nextSettings);
        setStorageOk(true);
        setStorageError(null);
      } catch {
        if (!cancelled) {
          setStorageOk(false);
          setStorageError(
            "Local storage could not be opened. Solves will not survive a refresh.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => reloadStorage(), [reloadStorage]);

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

  const persistFailure = () => {
    setSaveState("failed");
    setSaveNotice(
      "A change could not be saved to local storage. It is kept in memory only — export a backup soon.",
    );
  };

  const persistSolveRecord = (record: SolveRecord, sessionRecord: SessionRecord) => {
    setSaveState("saving");
    Promise.all([putSession(sessionRecord), putSolve(record)])
      .then(() => {
        setSaveState("saved");
        setSaveNotice(null);
      })
      .catch(persistFailure);
  };

  const appendSolve = (record: SolveRecord) => {
    const now = record.createdAt;
    const sessionRecord = toSessionRecord({
      ...session,
      createdAt: session.createdAt === INITIAL_STAMP ? now : session.createdAt,
      updatedAt: now,
    });
    setSessions((prev) => {
      const index = prev.findIndex((candidate) => candidate.id === session.id);
      if (index === -1) {
        return [
          ...prev,
          {
            ...session,
            createdAt: sessionRecord.createdAt,
            updatedAt: now,
            solves: [record],
          },
        ];
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        updatedAt: now,
        solves: [...next[index].solves, record],
      };
      return next;
    });
    persistSolveRecord(record, sessionRecord);
  };

  const handleSolve = (rawTimeMs: number, penalty: Penalty) => {
    const now = new Date().toISOString();
    const record: SolveRecord = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      puzzleId,
      rawTimeMs,
      penalty,
      scramble: scrambleState.scramble,
      createdAt: now,
      source: "timer",
      schemaVersion: 1,
    };
    setPendingSolveId(record.id);
    appendSolve(record);
    if (settings?.soundEnabled) playBeep();
    if (settings?.autoNextScramble !== false) generateFresh(puzzleId);
  };

  const updateSolve = (
    solveId: string,
    transform: (solve: SolveRecord) => SolveRecord,
  ) => {
    const target = solves.find((candidate) => candidate.id === solveId);
    if (!target) return;
    const updated = transform(target);
    const now = new Date().toISOString();
    setSessions((prev) =>
      prev.map((candidate) =>
        candidate.id !== session.id
          ? candidate
          : {
              ...candidate,
              updatedAt: now,
              solves: candidate.solves.map((solve) =>
                solve.id === solveId ? updated : solve,
              ),
            },
      ),
    );
    setSaveState("saving");
    putSolve(updated)
      .then(() => {
        setSaveState("saved");
        setSaveNotice(null);
      })
      .catch(persistFailure);
  };

  const handleSetPenalty = (solveId: string, penalty: Penalty) => {
    updateSolve(solveId, (solve) => ({ ...solve, penalty }));
  };

  const handleToggleDnf = () => {
    const pending = solves.find(
      (candidate) => candidate.id === pendingSolveId,
    );
    if (!pending) return;
    handleSetPenalty(pending.id, pending.penalty === "dnf" ? "none" : "dnf");
  };

  const handleAddManual = (rawTimeMs: number) => {
    const record: SolveRecord = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      puzzleId,
      rawTimeMs,
      penalty: "none",
      scramble: "",
      createdAt: new Date().toISOString(),
      source: "manual",
      schemaVersion: 1,
    };
    appendSolve(record);
  };

  const handleSetNotes = (solveId: string, notes: string) => {
    const trimmed = notes.trim();
    updateSolve(solveId, (solve) => {
      const updated: SolveRecord = { ...solve };
      if (trimmed === "") delete updated.notes;
      else updated.notes = notes;
      return updated;
    });
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
    setSaveState("saving");
    deleteSolveRecord(id)
      .then(() => {
        setSaveState("saved");
        setSaveNotice(null);
      })
      .catch(persistFailure);
  };

  const timer = useTimer({
    holdToReady: settings?.startMode !== "press",
    inspectionMode: settings?.inspectionMode ?? "off",
    canStart: () => scrambleState.status === "ready",
    onSolve: handleSolve,
    onNewScramble: handleNewScramble,
    onToggleDnf: handleToggleDnf,
  });
  const { phase } = timer;

  const handlePuzzleChange = (nextPuzzleId: PuzzleId) => {
    if (phase !== "idle" && phase !== "stopped") return;
    setSaveState(null);
    setScrambleState({ status: "generating", scramble: "" });
    setPuzzleId(nextPuzzleId);
    setSessionId(defaultSessionId(nextPuzzleId));
  };

  const handleSessionChange = (nextSessionId: string) => {
    if (phase !== "idle" && phase !== "stopped") return;
    setSaveState(null);
    setSessionId(nextSessionId);
  };

  const handleNewSession = () => {
    if (phase !== "idle" && phase !== "stopped") return;
    const now = new Date().toISOString();
    const count = sessions.filter(
      (candidate) => candidate.puzzleId === puzzleId,
    ).length;
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      name: `Session ${count + 1}`,
      puzzleId,
      createdAt: now,
      updatedAt: now,
    };
    setSessions((prev) => [...prev, { ...record, solves: [] }]);
    setSessionId(record.id);
    setSaveState(null);
    setSaveNotice(null);
    putSession(record).catch(persistFailure);
  };

  const handleRenameSession = (name: string) => {
    const now = new Date().toISOString();
    const record = toSessionRecord({ ...session, name, updatedAt: now });
    setSessions((prev) =>
      prev.map((candidate) =>
        candidate.id === session.id
          ? { ...candidate, name, updatedAt: now }
          : candidate,
      ),
    );
    setSaveState("saving");
    putSession(record)
      .then(() => {
        setSaveState("saved");
        setSaveNotice(null);
      })
      .catch(persistFailure);
  };

  const handleDeleteSession = () => {
    if (phase !== "idle" && phase !== "stopped") return;
    const remaining = sessions.filter(
      (candidate) =>
        candidate.puzzleId === puzzleId && candidate.id !== session.id,
    );
    if (remaining.length === 0) return;
    setSessions((prev) =>
      prev.filter((candidate) => candidate.id !== session.id),
    );
    setSessionId(remaining[0].id);
    setSaveState(null);
    setSaveNotice(null);
    deleteSessionRecord(session.id).catch(persistFailure);
  };

  const pendingSolve =
    phase === "stopped"
      ? (solves.find((s) => s.id === pendingSolveId) ?? null)
      : null;
  const ao5 = aoN(solves, 5);
  const pbMs = bestSingle(solves);

  // Running focus mode: everything except the timer fades out (300ms).
  const focused = phase === "running";
  const fadeCls = `transition-opacity duration-300 ease-out motion-reduce:transition-none ${
    focused ? "pointer-events-none opacity-0" : "opacity-100"
  }`;

  return (
    <div className="flex flex-col app-shell">
      <div
        className={`sticky top-0 z-20 shrink-0 bg-background lg:relative ${fadeCls}`}
        aria-hidden={focused}
        inert={focused}
      >
        <TopBar
          puzzleId={puzzleId}
          onPuzzleChange={handlePuzzleChange}
          sessions={[
            ...(sessions.some(
              (candidate) =>
                candidate.id === session.id &&
                candidate.puzzleId === puzzleId,
            )
              ? []
              : [{ id: session.id, name: session.name, count: solves.length }]),
            ...sessions
              .filter((candidate) => candidate.puzzleId === puzzleId)
              .map((candidate) => ({
                id: candidate.id,
                name: candidate.name,
                count: candidate.solves.length,
              })),
          ]}
          sessionId={session.id}
          onSessionChange={handleSessionChange}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onOpenDataPanel={() => setDataPanelOpen(true)}
          theme={theme}
          onThemeChange={writeTheme}
          selectionLocked={phase !== "idle" && phase !== "stopped"}
        />
      </div>
      {storageError && (
        <div
          className={`shrink-0 border-b border-border bg-danger ${fadeCls}`}
          aria-hidden={focused}
          inert={focused}
        >
          <p
            role="alert"
            className="mx-auto max-w-6xl px-4 py-2 text-sm text-danger-foreground sm:px-6"
          >
            {storageError}
          </p>
        </div>
      )}
      {saveNotice && (
        <div className="shrink-0 border-b border-border bg-danger">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <p role="alert" className="text-sm text-danger-foreground">
              {saveNotice}
            </p>
            <button
              type="button"
              onClick={() => setSaveNotice(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-danger-foreground hover:bg-danger-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 locked-fill">
        <div className="grid shrink-0 gap-4 lg:grid-cols-2 sm:gap-6">
          <TimerCard
            engine={timer.engine}
            phase={phase}
            ao5={ao5}
            pendingSolve={pendingSolve}
            scrambleReady={scrambleState.status === "ready"}
            holdMode={settings?.startMode !== "press"}
            inspectionMode={settings?.inspectionMode ?? "off"}
            saveState={saveState}
            ao5Dnf={solves.length >= 5 && ao5 === null}
            onSetPenalty={(penalty) => {
              if (pendingSolve) handleSetPenalty(pendingSolve.id, penalty);
            }}
          />
          <div className={`order-first lg:order-none ${fadeCls}`} aria-hidden={focused} inert={focused}>
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
          className={`grid gap-4 sm:gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-2 locked-fill ${fadeCls}`}
          aria-hidden={focused}
          inert={focused}
        >
          <SolveHistory
            solves={solves}
            sessionName={session.name}
            pbMs={pbMs}
            onDelete={handleDeleteSolve}
            onSetPenalty={handleSetPenalty}
            onAddManual={handleAddManual}
            onSetNotes={handleSetNotes}
          />
          <Statistics solves={solves} />
        </div>
      </main>
      {dataPanelOpen && (
        <Dialog title="Data and settings" wide onClose={() => setDataPanelOpen(false)}>
          <div className="max-h-[75vh] overflow-y-auto p-1">
            <DataPanel
              sessions={sessions.map(toSessionRecord)}
              solves={sessions.flatMap((candidate) => candidate.solves)}
              settings={settings}
              storageOk={storageOk}
              storageError={storageError}
              onSettingsSaved={setSettings}
              onLocalDataChanged={reloadStorage}
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
