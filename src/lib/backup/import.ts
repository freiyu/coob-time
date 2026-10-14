import type { BackupFile } from "@/lib/backup/validate";
import type { SessionRecord, SettingsRecord, SolveRecord } from "@/lib/storage/types";

export type ImportMode = "merge" | "replace";

export interface ImportPlan {
  mode: ImportMode;
  sessionsToAdd: SessionRecord[];
  solvesToAdd: SolveRecord[];
  skippedSessions: number;
  skippedSolves: number;
  settingsToApply: SettingsRecord | null;
}

export function planImport(
  backup: BackupFile,
  existingSessions: SessionRecord[],
  existingSolves: SolveRecord[],
  mode: ImportMode,
): ImportPlan {
  if (mode === "replace") {
    return {
      mode,
      sessionsToAdd: backup.sessions,
      solvesToAdd: backup.solves,
      skippedSessions: 0,
      skippedSolves: 0,
      settingsToApply: backup.settings,
    };
  }

  const existingSessionIds = new Set(existingSessions.map((s) => s.id));
  const existingSolveIds = new Set(existingSolves.map((s) => s.id));
  const incomingSessionIds = new Set(backup.sessions.map((s) => s.id));

  const sessionsToAdd = backup.sessions.filter(
    (s) => !existingSessionIds.has(s.id),
  );
  const skippedSessions = backup.sessions.length - sessionsToAdd.length;

  const knownSessionIds = new Set([...existingSessionIds, ...incomingSessionIds]);
  let skippedSolves = 0;
  const solvesToAdd: SolveRecord[] = [];
  for (const solve of backup.solves) {
    if (existingSolveIds.has(solve.id) || !knownSessionIds.has(solve.sessionId)) {
      skippedSolves += 1;
      continue;
    }
    solvesToAdd.push(solve);
    existingSolveIds.add(solve.id);
  }

  return {
    mode,
    sessionsToAdd,
    solvesToAdd,
    skippedSessions,
    skippedSolves,
    settingsToApply: null,
  };
}
