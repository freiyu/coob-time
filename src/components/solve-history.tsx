import { useState } from "react";
import { Trash2 } from "lucide-react";
import Dialog from "@/components/dialog";
import ScrambleView from "@/components/scramble-view";
import { type PuzzleId } from "@/lib/puzzles";
import type { Penalty, SolveRecord } from "@/lib/storage/types";
import { aoN, bestAoN, effectiveMs, formatMs } from "@/lib/statistics";

interface SolveHistoryProps {
  solves: SolveRecord[];
  sessionName: string;
  pbMs: number | null;
  onDelete: (id: string) => void;
  onSetPenalty: (id: string, penalty: Penalty) => void;
}

interface AoWindow {
  n: number;
  number: number;
  value: number;
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
}: SolveHistoryProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [aoWindow, setAoWindow] = useState<AoWindow | null>(null);

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
        <p className="text-sm text-muted-foreground">
          {solves.length} {solves.length === 1 ? "solve" : "solves"} ·{" "}
          {sessionName}
        </p>
      </header>
      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium">No solves yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Stop the timer to record your first solve. Nothing is synced.
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
                    onClick={() => setDetailId(solve.id)}
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
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          formatMs(effective)
                        )}
                      </button>
                    </td>
                    <td className="border-r border-border px-3 py-2.5 text-right tabular-nums">
                      {ao5 === null ? (
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
                            isBest5
                              ? "text-pb-foreground"
                              : "text-warning-foreground"
                          }`}
                        >
                          {formatMs(ao5)}
                        </button>
                      )}
                    </td>
                    <td className="border-r border-border px-3 py-2.5 text-right tabular-nums">
                      {ao12 === null ? (
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
                            isBest12
                              ? "text-pb-foreground"
                              : "text-info-foreground"
                          }`}
                        >
                          {formatMs(ao12)}
                        </button>
                      )}
                    </td>
                    <td
                      className="border-r border-border px-3 py-2.5 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {solve.penalty === "plus2" && (
                          <span className="rounded-full bg-warning px-2 py-0.5 text-sm font-semibold text-warning-foreground">
                            +2
                          </span>
                        )}
                        {solve.penalty === "dnf" && (
                          <span className="rounded-full bg-danger px-2 py-0.5 text-sm font-semibold text-danger-foreground">
                            DNF
                          </span>
                        )}
                        <PenaltyButtons
                          solve={solve}
                          onSetPenalty={onSetPenalty}
                        />
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 text-right sm:px-6"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {confirmId === solve.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(solve.id);
                              setConfirmId(null);
                            }}
                            className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors duration-150 hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete solve ${number}`}
                          onClick={() => setConfirmId(solve.id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      )}
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
                {" · "}
                {new Date(detail.solve.createdAt).toLocaleString()}
              </p>
            </div>
            <PenaltyButtons
              solve={detail.solve}
              onSetPenalty={onSetPenalty}
            />
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

      {aoWindow && (
        <Dialog
          title={`Ao${aoWindow.n} of solve #${aoWindow.number}`}
          onClose={() => setAoWindow(null)}
        >
          <div className="p-4">
            <p className="text-2xl font-semibold tabular-nums">
              {formatMs(aoWindow.value)}
            </p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
    </section>
  );
}
