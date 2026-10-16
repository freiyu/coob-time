"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { backupToCsv, buildBackup, downloadText } from "@/lib/backup/format";
import { parseBackup } from "@/lib/backup/validate";
import { planImport, type ImportMode } from "@/lib/backup/import";
import { PUZZLES, puzzleLabel } from "@/lib/puzzles";
import {
  DEFAULT_SETTINGS,
  clearAll,
  putImported,
  putSettings,
} from "@/lib/storage/idb";
import type { SessionRecord, SettingsRecord, SolveRecord } from "@/lib/storage/types";

interface DataPanelProps {
  sessions: SessionRecord[];
  solves: SolveRecord[];
  settings: SettingsRecord | null;
  storageOk: boolean;
  storageError: string | null;
  onSettingsSaved: (settings: SettingsRecord) => void;
  onLocalDataChanged: () => void;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.name === "StorageError") {
    return "Local storage could not be reached. Changes will not survive a refresh.";
  }
  if (err instanceof DOMException && err.name === "QuotaExceededError") {
    return "Browser storage is full. Export a backup and delete old solves.";
  }
  return "That change could not be written to local storage. Export a backup, then try again.";
}

export const BUTTON_BASE =
  "flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-border bg-secondary text-secondary-foreground hover:bg-muted`;
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-primary text-primary-foreground hover:bg-primary/90`;
export const BUTTON_DESTRUCTIVE = `${BUTTON_BASE} bg-destructive text-destructive-foreground hover:bg-destructive/90`;

export default function DataPanel({
  sessions,
  solves,
  settings,
  storageOk,
  storageError,
  onSettingsSaved,
  onLocalDataChanged,
}: DataPanelProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<{
    sessionCount: number;
    solveCount: number;
    sessions: SessionRecord[];
    solves: SolveRecord[];
    settings: SettingsRecord;
    exportedAt: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const updateSettings = (patch: Partial<SettingsRecord>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setActionError(null);
    putSettings(next)
      .then(() => onSettingsSaved(next))
      .catch((err) => setActionError(errorMessage(err)));
  };

  const handleExportJson = () => {
    const backup = buildBackup({
      sessions,
      solves,
      settings: settings ?? DEFAULT_SETTINGS,
    });
    downloadText(
      `cubetime-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      "application/json",
    );
  };

  const handleExportCsv = () => {
    downloadText(
      `cubetime-solves-${new Date().toISOString().slice(0, 10)}.csv`,
      backupToCsv(solves, sessions),
      "text/csv",
    );
  };

  const handleFile = (file: File | undefined) => {
    setPendingBackup(null);
    setImportStatus(null);
    setActionError(null);
    if (!file) return;
    file
      .text()
      .then((text) => {
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          setActionError("That file is not valid JSON.");
          return;
        }
        const result = parseBackup(data);
        if (!result.ok) {
          setActionError(result.error);
          return;
        }
        setPendingBackup({
          sessionCount: result.backup.sessions.length,
          solveCount: result.backup.solves.length,
          sessions: result.backup.sessions,
          solves: result.backup.solves,
          settings: result.backup.settings,
          exportedAt: result.backup.exportedAt,
        });
      })
      .catch(() => setActionError("The file could not be read."));
  };

  const handleApplyImport = () => {
    if (!pendingBackup || importing) return;
    setActionError(null);
    setImportStatus(null);
    setImporting(true);
    const plan = planImport(
      {
        app: "cubetime",
        schemaVersion: 1,
        exportedAt: pendingBackup.exportedAt,
        sessions: pendingBackup.sessions,
        solves: pendingBackup.solves,
        settings: pendingBackup.settings,
      },
      sessions,
      solves,
      importMode,
    );
    putImported(
      plan.sessionsToAdd,
      plan.solvesToAdd,
      plan.settingsToApply,
      importMode,
    )
      .then(() => {
        if (plan.settingsToApply) onSettingsSaved(plan.settingsToApply);
        setImportStatus(
          `Imported ${plan.solvesToAdd.length} solves and ${plan.sessionsToAdd.length} sessions` +
            (plan.skippedSolves + plan.skippedSessions > 0
              ? `, skipped ${plan.skippedSolves} duplicate or unmatched solves and ${plan.skippedSessions} duplicate sessions.`
              : "."),
        );
        setPendingBackup(null);
        onLocalDataChanged();
      })
      .catch((err) => setActionError(errorMessage(err)))
      .finally(() => setImporting(false));
  };

  const handleDeleteAll = () => {
    setActionError(null);
    clearAll()
      .then(() => {
        setDeleteArmed(false);
        setDeleteText("");
        onLocalDataChanged();
      })
      .catch((err) => setActionError(errorMessage(err)));
  };

  return (
    <section
      aria-label="Data and settings"
      className="space-y-4 rounded-[14px] border border-border bg-card p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Data and settings</h2>
        <p className="text-sm text-muted-foreground">
          {storageError
            ? "Local data unavailable"
            : storageOk
              ? `${solves.length} solves stored in this browser`
              : "Reading local data…"}
        </p>
      </header>
      <p className="text-sm text-muted-foreground">
        Everything is saved only in this browser profile on this device — not
        synced, not uploaded. Local storage is not a backup: export a JSON copy
        regularly.
      </p>
      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {importStatus && (
        <p role="status" className="text-sm text-brand-strong">
          {importStatus}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 sm:gap-6">
        <div className="space-y-4">
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Timer start mode</legend>
            {(
              [
                ["hold", "Hold Space, release to start"],
                ["press", "Press Space to start"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-10 items-center gap-2 py-1.5 text-sm"
              >
                <input
                  type="radio"
                  name="startMode"
                  value={value}
                  checked={settings?.startMode === value}
                  disabled={!settings || !storageOk}
                  onChange={() => updateSettings({ startMode: value })}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Inspection</legend>
            {(
              [
                ["off", "Off — start the solve right away"],
                ["15s", "15 seconds (guidance only, no penalties)"],
                [
                  "wca",
                  "WCA — +2 at 15s, DNF at 17s",
                ],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-10 items-center gap-2 py-1.5 text-sm"
              >
                <input
                  type="radio"
                  name="inspectionMode"
                  value={value}
                  checked={settings?.inspectionMode === value}
                  disabled={!settings || !storageOk}
                  onChange={() => updateSettings({ inspectionMode: value })}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">After each solve</legend>
            {(
              [
                [
                  "soundEnabled",
                  "Beep when a solve is recorded",
                  settings?.soundEnabled === true,
                ],
                [
                  "autoNextScramble",
                  "New scramble automatically",
                  settings?.autoNextScramble !== false,
                ],
              ] as const
            ).map(([key, label, checked]) => (
              <label
                key={key}
                className="flex min-h-10 items-center gap-2 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!settings || !storageOk}
                  onChange={(event) =>
                    updateSettings({ [key]: event.target.checked })
                  }
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Display</legend>
            <label className="flex min-h-10 items-center gap-2 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={settings?.hideTimer === true}
                disabled={!settings || !storageOk}
                onChange={(event) =>
                  updateSettings({ hideTimer: event.target.checked })
                }
                className="size-4 accent-primary"
              />
              Hide timer while solving
            </label>
            <p className="text-sm text-muted-foreground">
              Shows &ldquo;solve&rdquo; instead of the running time.
            </p>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Default puzzle</span>
            <select
              value={
                PUZZLES.some(
                  (puzzle) => puzzle.id === settings?.defaultPuzzleId,
                )
                  ? (settings?.defaultPuzzleId ?? "3x3")
                  : "3x3"
              }
              disabled={!settings || !storageOk}
              onChange={(event) =>
                updateSettings({ defaultPuzzleId: event.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PUZZLES.map((puzzle) => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzleLabel(puzzle.id)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className={BUTTON_SECONDARY}
            >
              <Download aria-hidden className="size-4" />
              Export backup (JSON)
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={solves.length === 0}
              className={BUTTON_SECONDARY}
            >
              <Download aria-hidden className="size-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Import backup (JSON)</span>
              <input
                type="file"
                accept="application/json,.json"
                disabled={!storageOk}
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-muted"
              />
            </label>
            {pendingBackup && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm text-muted-foreground">
                  Backup contains {pendingBackup.solveCount} solves and{" "}
                  {pendingBackup.sessionCount} sessions. Choose how to apply it:
                </p>
                <label className="flex min-h-10 items-start gap-2 py-1.5 text-sm">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>
                    <span className="font-medium">Merge</span> — add new
                    records, keep everything you already have. Duplicates are
                    skipped.
                  </span>
                </label>
                <label className="flex min-h-10 items-start gap-2 py-1.5 text-sm">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>
                    <span className="font-medium">Replace</span> — restore
                    exactly what is in the file.
                    {importMode === "replace" && (
                      <>
                        {" "}
                        This deletes your {solves.length} solves and{" "}
                        {sessions.length} sessions first.
                      </>
                    )}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleApplyImport}
                    disabled={importing}
                    className={
                      importMode === "replace"
                        ? BUTTON_DESTRUCTIVE
                        : BUTTON_PRIMARY
                    }
                  >
                    {importing
                      ? "Applying…"
                      : importMode === "replace"
                        ? "Replace local data"
                        : "Merge into local data"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingBackup(null)}
                    className={BUTTON_SECONDARY}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Delete all local data</p>
            <p className="text-sm text-muted-foreground">
              Permanently deletes {solves.length} solves, {sessions.length}{" "}
              sessions, and your settings from this browser. Export a backup
              first if you might want them back.
            </p>
            {deleteArmed ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={deleteText}
                  onChange={(event) => setDeleteText(event.target.value)}
                  placeholder="Type DELETE to confirm"
                  aria-label="Type DELETE to confirm"
                  className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deleteText !== "DELETE"}
                  className={BUTTON_DESTRUCTIVE}
                >
                  <Trash2 aria-hidden className="size-4" />
                  Delete everything
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteArmed(false);
                    setDeleteText("");
                  }}
                  className={BUTTON_SECONDARY}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteArmed(true)}
                disabled={solves.length === 0 && sessions.length === 0}
                className={`${BUTTON_BASE} border border-border bg-secondary text-secondary-foreground hover:bg-muted hover:text-destructive`}
              >
                <Trash2 aria-hidden className="size-4" />
                Delete all local data…
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
