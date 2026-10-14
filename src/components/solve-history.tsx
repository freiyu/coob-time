import { Award } from "lucide-react";
import type { SolveRecord } from "@/lib/storage/types";
import { effectiveMs, formatMs } from "@/lib/statistics";

interface SolveHistoryProps {
  solves: SolveRecord[];
  sessionName: string;
  pbMs: number | null;
}

export default function SolveHistory({
  solves,
  sessionName,
  pbMs,
}: SolveHistoryProps) {
  const rows = solves
    .map((solve, index) => ({ solve, number: index + 1 }))
    .reverse();

  return (
    <section
      aria-label="Solve history"
      className="rounded-[14px] border border-border bg-card"
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
            Stop the timer to record your first solve. Data lives only in this
            browser.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-sm font-medium text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 text-left sm:px-6">
                Solve
              </th>
              <th scope="col" className="px-2 py-2.5 text-right">
                Time
              </th>
              <th scope="col" className="px-4 py-2.5 text-right sm:px-6">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ solve, number }) => {
              const effective = effectiveMs(solve);
              const isPb =
                solves.length > 1 &&
                pbMs !== null &&
                effective !== null &&
                effective === pbMs;
              return (
                <tr
                  key={solve.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5 text-muted-foreground sm:px-6">
                    #{number}
                  </td>
                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums">
                    {effective === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatMs(effective)
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right sm:px-6">
                    <span className="inline-flex items-center gap-1">
                      {isPb && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-sm font-semibold text-brand-soft-foreground">
                          <Award aria-hidden className="size-3" />
                          PB
                        </span>
                      )}
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
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
