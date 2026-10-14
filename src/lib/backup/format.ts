import { effectiveMs } from "@/lib/statistics";
import type { SessionRecord, SettingsRecord, SolveRecord } from "@/lib/storage/types";
import {
  BACKUP_APP,
  BACKUP_SCHEMA_VERSION,
  type BackupFile,
} from "@/lib/backup/validate";

export function buildBackup(input: {
  sessions: SessionRecord[];
  solves: SolveRecord[];
  settings: SettingsRecord;
  exportedAt?: string;
}): BackupFile {
  return {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    sessions: input.sessions,
    solves: input.solves,
    settings: input.settings,
  };
}

function csvField(value: string): string {
  // Guard against spreadsheet formula injection from imported (untrusted)
  // notes/scrambles: prefix cells that start with a formula trigger.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function backupToCsv(
  solves: SolveRecord[],
  sessions: SessionRecord[],
): string {
  const sessionNames = new Map(sessions.map((s) => [s.id, s.name]));
  const header = [
    "id",
    "session",
    "puzzle",
    "rawTimeMs",
    "effectiveTimeMs",
    "penalty",
    "scramble",
    "createdAt",
    "source",
    "notes",
  ];
  const rows = solves.map((solve) =>
    [
      solve.id,
      sessionNames.get(solve.sessionId) ?? solve.sessionId,
      solve.puzzleId,
      String(solve.rawTimeMs),
      effectiveMs(solve) === null ? "" : String(effectiveMs(solve)),
      solve.penalty,
      solve.scramble,
      solve.createdAt,
      solve.source,
      solve.notes ?? "",
    ]
      .map((cell) => csvField(cell))
      .join(","),
  );
  return [header.map(csvField).join(","), ...rows].join("\r\n");
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
