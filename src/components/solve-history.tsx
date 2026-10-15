import { useState } from "react";
import { Trash2 } from "lucide-react";
import Dialog from "@/components/dialog";
import ScrambleView from "@/components/scramble-view";
import {
  BUTTON_DESTRUCTIVE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
} from "@/components/data-panel";
import { type PuzzleId } from "@/lib/puzzles";
import type { Penalty, SolveRecord } from "@/lib/storage/types";
import { aoN, bestAoN, effectiveMs, formatMs, parseMs } from "@/lib/statistics";

interface SolveHistoryProps {
  solves: SolveRecord[];
  sessionName: string;
  pbMs: number | null;
  onDelete: (id: string) => void;
  onSetPenalty: (id: string, penalty: Penalty) => void;
  onAddManual: (rawTimeMs: number) => void;
  onSetNotes: (id: string, notes: string) => void;
}

interface AoWindow {
  n: number;
  number: number;
  value: number | null;
  window: SolveRecord[];
}

function PenaltyButtons({
  solve,
  onSetPenalty,
  onSettled,
}: {
  solve: SolveRecord;
  onSetPenalty: (id: string, penalty: Penalty) => void;
  onSettled?: () => void;
}) {
  const toggle = (penalty: Penalty) => {
    onSetPenalty(solve.id, solve.penalty === penalty ? "none" : penalty);
    onSettled?.();
  };
  const chip = (active: boolean) =>
    `rounded-lg border px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? "border-transparent"
        : "border-border text-secondary-foreground hover:bg-muted"
    }`;
  return (
    <span className="inline-flex gap-1.5">
      <button
        type="button"
        aria-pressed={solve.penalty === "plus2"}
        aria-label={`Toggle +2 on solve ${solve.id}`}
        onClick={(event) => {
          event.stopPropagation();
          toggle("plus2");
        }}
        className={`${chip(solve.penalty === "plus2")} ${
          solve.penalty === "plus2"
            ? "bg-warning text-warning-foreground"
            : ""
        }`}
      >
        +2
      </button>
      <button
        type="button"
        aria-pressed={solve.penalty === "dnf"}
        aria-label={`Toggle DNF on solve ${solve.id}`}
        onClick={(event) => {
          event.stopPropagation();
          toggle("dnf");
        }}
        className={`${chip(solve.penalty === "dnf")} ${
          solve.penalty === "dnf" ? "bg-danger text-danger-foreground" : ""
        }`}
      >
        DNF
      </button>
    </span>
  );
}

export default function SolveHistory({
  solves,
  sessionName,
  pbMs,
  onDelete,
  onSetPenalty,
  onAddManual,
  onSetNotes,
}: SolveHistoryProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [aoWindow, setAoWindow] = useState<AoWindow | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const rows = solves
    .map((solve, index) => ({
      solve,
      number: index + 1,
      ao5: index >= 4 ? aoN(solves.slice(0, index + 1), 5) : null,
      ao12: index >= 11 ? aoN(solves.slice(0, index + 1), 12) : null,
    }))
    .reverse();
  const best5 = solves.length >= 5 ? bestAoN(solves, 5) : null;
  const best12 = solves.length >= 12 ? bestAoN(solves, 12) : null;

  const detail = rows.find((row) => row.solve.id === detailId) ?? null;

  return (
    <section
      aria-label="Solve history"
      className="flex min-h-0 flex-col rounded-[14px] border border-border bg-card lg:h-full"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <h2 className="text-sm font-semibold">Solve history</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {solves.length} {solves.length === 1 ? "solve" : "solves"} ·{" "}
            {sessionName}
          </p>
          <button
            type="button"
            onClick={() => {
              setManualText("");
              setManualError(null);
              setManualOpen(true);
            }}
            className={BUTTON_SECONDARY}
          >
            + Add solve
          </button>
        </div>
      </header>
      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium">No solves yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Stop the timer to record your first solve, or add one manually with
            Add solve above. Nothing is synced.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-sm font-medium text-muted-foreground">
                <th
                  scope="col"
                  className="border-r border-border px-4 py-2.5 text-left sm:px-6"
                >
                  No.
                </th>
                <th
                  scope="col"
                  className="border-r border-border px-3 py-2.5 text-left"
                >
                  Time
                </th>
                <th
                  scope="col"
                  className="border-r border-border px-3 py-2.5 text-right text-warning-foreground"
                >
                  Ao5
                </th>
                <th
                  scope="col"
                  className="border-r border-border px-3 py-2.5 text-right text-info-foreground"
                >
                  Ao12
                </th>
                <th
                  scope="col"
                  className="border-r border-border px-3 py-2.5 text-right"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-right sm:px-6"
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ solve, number, ao5, ao12 }) => {
                const effective = effectiveMs(solve);
                const isFastest =
                  solves.length > 1 &&
                  pbMs !== null &&
                  effective !== null &&
                  effective === pbMs;
                const isBest5 = ao5 !== null && best5 !== null && ao5 === best5;
                const isBest12 =
                  ao12 !== null && best12 !== null && ao12 === best12;
                return (
                  <tr
                    key={solve.id}
                    onClick={() => {
                      setDetailId(solve.id);
                      setNotesDraft(solve.notes ?? "");
                    }}
                    className="cursor-pointer border-b border-border last:border-b-0"
                  >
                    <td className="border-r border-border px-4 py-2.5 text-muted-foreground sm:px-6">
                      {number}
                    </td>
                    <td className="border-r border-border px-3 py-2.5">
                      <button
                        type="button"
                        className={`rounded px-1 font-semibold tabular-nums hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isFastest ? "text-pb-foreground" : ""
                        }`}
                      >
                        {effective === null ? (
                          <span className="rounded-full bg-danger px-2 py-0.5 text-sm font-semibold text-danger-foreground">
                            DNF
                          </span>
                        ) : (
                          <>
                            {formatMs(effective)}
                            {solve.penalty === "plus2" && "+"}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="border-r border-border px-3 py-2.5 text-right tabular-nums">
                      {number < 5 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setAoWindow({
                              n: 5,
                              number,
                              value: ao5,
                              window: solves.slice(number - 5, number),
                            });
                          }}
                          className={`rounded px-1 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            ao5 === null
                              ? "text-destructive"
                              : isBest5
                                ? "text-pb-foreground"
                                : "text-foreground"
                          }`}
                        >
                          {ao5 !== null ? formatMs(ao5) : "DNF"}
                        </button>
                      )}
                    </td>
                    <td className="border-r border-border px-3 py-2.5 text-right tabular-nums">
                      {number < 12 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setAoWindow({
                              n: 12,
                              number,
                              value: ao12,
                              window: solves.slice(number - 12, number),
                            });
                          }}
                          className={`rounded px-1 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            ao12 === null
                              ? "text-destructive"
                              : isBest12
                                ? "text-pb-foreground"
                                : "text-foreground"
                          }`}
                        >
                          {ao12 !== null ? formatMs(ao12) : "DNF"}
                        </button>
                      )}
                    </td>
                    <td
                      className="border-r border-border px-3 py-2.5 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <PenaltyButtons solve={solve} onSetPenalty={onSetPenalty} />
                    </td>
                    <td
                      className="px-4 py-2.5 text-right sm:px-6"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Delete solve ${number}`}
                        onClick={() => setConfirmId(solve.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Dialog
          title={`Solve #${detail.number}`}
          onClose={() => setDetailId(null)}
        >
          <div className="space-y-4 p-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">
                {effectiveMs(detail.solve) === null
                  ? "DNF"
                  : formatMs(effectiveMs(detail.solve)!)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Raw {formatMs(detail.solve.rawTimeMs)}
                {detail.solve.penalty === "plus2" && " · +2 penalty"}
                {detail.solve.penalty === "dnf" && " · DNF"}
                {detail.solve.source === "manual" && " · manual entry"}
                {" · "}
                {new Date(detail.solve.createdAt).toLocaleString()}
              </p>
            </div>
            <PenaltyButtons
              solve={detail.solve}
              onSetPenalty={onSetPenalty}
            />
            <div>
              <label className="block text-sm font-medium">
                Notes
                <textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  maxLength={2000}
                  rows={2}
                  placeholder="Add a note…"
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={
                    notesDraft.trim() === (detail.solve.notes ?? "").trim()
                  }
                  onClick={() => onSetNotes(detail.solve.id, notesDraft)}
                  className={BUTTON_PRIMARY}
                >
                  Save note
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Scramble</p>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {detail.solve.scramble || "—"}
              </p>
              {detail.solve.scramble && (
                <ScrambleView
                  puzzleId={detail.solve.puzzleId as PuzzleId}
                  scramble={detail.solve.scramble}
                />
              )}
            </div>
          </div>
        </Dialog>
      )}

      {confirmId && (
        <Dialog
          title="Delete solve"
          onClose={() => setConfirmId(null)}
        >
          <div className="space-y-3 p-4">
            <p className="text-sm">
              Are you sure you want to delete this solve?{" "}
              {(() => {
                const target = rows.find((row) => row.solve.id === confirmId);
                if (!target) return null;
                const value = effectiveMs(target.solve);
                return (
                  <span className="font-semibold tabular-nums">
                    #{target.number} ·{" "}
                    {value === null ? "DNF" : formatMs(value)}
                  </span>
                );
              })()}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className={BUTTON_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = rows.find((row) => row.solve.id === confirmId);
                  if (target) {
                    onDelete(target.solve.id);
                  }
                  setConfirmId(null);
                }}
                className={BUTTON_DESTRUCTIVE}
              >
                Delete
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {aoWindow && (
        <Dialog
          title={`Ao${aoWindow.n} of solve #${aoWindow.number}`}
          onClose={() => setAoWindow(null)}
        >
          <div className="p-4">
            <p className="text-2xl font-semibold tabular-nums">
              {aoWindow.value === null ? "DNF" : formatMs(aoWindow.value)}
            </p>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {aoWindow.window.map((solve, index) => {
                const value = effectiveMs(solve);
                const isCurrent = index === aoWindow.window.length - 1;
                return (
                  <span
                    key={solve.id}
                    className={`shrink-0 rounded-lg border border-border px-2 py-1 text-sm tabular-nums ${
                      isCurrent
                        ? "font-semibold text-brand-strong"
                        : "text-muted-foreground"
                    }`}
                  >
                    {value === null ? "DNF" : formatMs(value)}
                  </span>
                );
              })}
            </div>
          </div>
        </Dialog>
      )}
      {manualOpen && (
        <Dialog title="Add solve manually" onClose={() => setManualOpen(false)}>
          <form
            className="space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const ms = parseMs(manualText);
              if (ms === null) {
                setManualError(
                  "Enter a valid time like 12.34, 1:05.12, or 0.5.",
                );
                return;
              }
              onAddManual(ms);
              setManualOpen(false);
            }}
          >
            <label className="block text-sm font-medium">
              Time
              <input
                value={manualText}
                onChange={(event) => {
                  setManualText(event.target.value);
                  setManualError(null);
                }}
                autoFocus
                placeholder="12.34 or 1:05.12"
                aria-invalid={manualError !== null}
                aria-describedby={manualError ? "manual-time-error" : undefined}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            {manualError && (
              <p
                id="manual-time-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {manualError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className={BUTTON_SECONDARY}
              >
                Cancel
              </button>
              <button type="submit" className={BUTTON_PRIMARY}>
                Add solve
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
