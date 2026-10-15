import { useState } from "react";
import { Award } from "lucide-react";
import type { SolveRecord } from "@/lib/storage/types";
import {
  aoN,
  bestAoN,
  bestSingle,
  effectiveMs,
  formatMs,
  mean,
} from "@/lib/statistics";

interface StatisticsProps {
  solves: SolveRecord[];
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  pb?: boolean;
  danger?: boolean;
}

function StatCard({ label, value, sub, pb, danger }: StatCardProps) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 text-xl font-semibold tabular-nums sm:text-2xl ${
          danger ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
      {pb && (
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-sm font-semibold text-brand-soft-foreground">
          <Award aria-hidden className="size-4" />
          PB
        </span>
      )}
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function notEnough(): { value: string; sub: string } {
  return { value: "—", sub: "Not enough solves" };
}

const TAB_BASE =
  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function TrendChart({ solves }: { solves: SolveRecord[] }) {
  const points = solves
    .map((solve, index) => ({ number: index + 1, ms: effectiveMs(solve) }))
    .filter((point): point is { number: number; ms: number } => point.ms !== null);

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">Not enough solves</p>
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const times = points.map((point) => point.ms / 1000);
  const numbers = points.map((point) => point.number);
  const minNumber = Math.min(...numbers);
  const maxNumber = Math.max(...numbers);
  const rawMin = Math.min(...times);
  const rawMax = Math.max(...times);
  const pad = Math.max(0.4, (rawMax - rawMin) * 0.15);
  const minTime = rawMin - pad;
  const maxTime = rawMax + pad;

  const x = (number: number) =>
    padLeft +
    ((number - minNumber) / Math.max(1, maxNumber - minNumber)) *
      (width - padLeft - padRight);
  const y = (time: number) =>
    padTop +
    (1 - (time - minTime) / Math.max(0.001, maxTime - minTime)) *
      (height - padTop - padBottom);

  const pbMs = bestSingle(solves);
  const polyline = points
    .map((point) => `${x(point.number).toFixed(1)},${y(point.ms / 1000).toFixed(1)}`)
    .join(" ");

  const gridLines = [maxTime, (maxTime + minTime) / 2, minTime];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-3 h-40 w-full sm:h-56"
      role="img"
      aria-label={`Trend of ${points.length} solve times, from ${rawMin.toFixed(2)} to ${rawMax.toFixed(2)} seconds`}
    >
        {gridLines.map((time) => (
          <g key={time}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={y(time)}
              y2={y(time)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={y(time) + 4}
              textAnchor="end"
              fontSize="16"
              fill="var(--muted-foreground)"
            >
              {time.toFixed(1)}
            </text>
          </g>
        ))}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point) => (
          <circle
            key={point.number}
            cx={x(point.number)}
            cy={y(point.ms / 1000)}
            r={pbMs !== null && point.ms === pbMs ? 4.5 : 3}
            fill="var(--chart-1)"
          />
        ))}
        <text
          x={x(minNumber)}
          y={height - 8}
          textAnchor="start"
          fontSize="16"
          fill="var(--muted-foreground)"
        >
          #{minNumber}
        </text>
        <text
          x={x(maxNumber)}
          y={height - 8}
          textAnchor="end"
          fontSize="16"
          fill="var(--muted-foreground)"
        >
          #{maxNumber}
        </text>
        {(() => {
          const pbPoint = points.find((point) => point.ms === pbMs);
          if (!pbPoint) return null;
          return (
            <text
              x={Math.min(x(pbPoint.number) + 8, width - padRight)}
              y={Math.max(y(pbPoint.ms / 1000) - 10, padTop + 14)}
              textAnchor="end"
              fontSize="16"
              fontWeight="600"
              fill="var(--brand-strong)"
            >
              PB {(pbPoint.ms / 1000).toFixed(2)}
            </text>
          );
        })()}
      </svg>
  );
}

export default function Statistics({ solves }: StatisticsProps) {
  const [tab, setTab] = useState<"stats" | "trend">("stats");
  const count = solves.length;
  const best = bestSingle(solves);
  const avg = mean(solves);
  const currentAo5 = aoN(solves, 5);
  const currentAo12 = aoN(solves, 12);
  const topAo5 = bestAoN(solves, 5);
  const topAo12 = bestAoN(solves, 12);

  const cards: StatCardProps[] = [
    { label: "Solves", value: String(count), sub: "in this session" },
    best !== null
      ? { label: "Best single", value: formatMs(best), pb: count > 1 }
      : count > 0
        ? { label: "Best single", value: "DNF", sub: "No valid solves", danger: true }
        : { label: "Best single", ...notEnough() },
    avg !== null
      ? { label: "Mean", value: formatMs(avg), sub: "valid solves" }
      : count > 0
        ? { label: "Mean", value: "DNF", sub: "No valid solves", danger: true }
        : { label: "Mean", ...notEnough() },
    currentAo5 !== null
      ? { label: "Ao5", value: formatMs(currentAo5) }
      : count >= 5
        ? { label: "Ao5", value: "DNF", danger: true }
        : { label: "Ao5", ...notEnough() },
    currentAo12 !== null
      ? { label: "Ao12", value: formatMs(currentAo12) }
      : count >= 12
        ? { label: "Ao12", value: "DNF", danger: true }
        : { label: "Ao12", ...notEnough() },
    topAo5 !== null
      ? { label: "Best Ao5", value: formatMs(topAo5) }
      : count >= 5
        ? { label: "Best Ao5", value: "DNF", danger: true }
        : { label: "Best Ao5", ...notEnough() },
    topAo12 !== null
      ? { label: "Best Ao12", value: formatMs(topAo12) }
      : count >= 12
        ? { label: "Best Ao12", value: "DNF", danger: true }
        : { label: "Best Ao12", ...notEnough() },
  ];

  return (
    <section
      aria-label="Statistics"
      className="flex min-h-0 flex-col rounded-[14px] border border-border bg-card lg:h-full"
    >
      <header
        role="tablist"
        aria-label="Statistics views"
        className="flex shrink-0 items-center gap-1 border-b border-border px-4 py-2 sm:px-6"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "stats"}
          onClick={() => setTab("stats")}
          className={`${TAB_BASE} ${
            tab === "stats"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Statistics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "trend"}
          onClick={() => setTab("trend")}
          className={`${TAB_BASE} ${
            tab === "trend"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Solve trend
        </button>
      </header>
      {tab === "stats" ? (
        <div
          role="tabpanel"
          aria-label="Statistics"
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          aria-label="Solve trend"
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <p className="text-sm text-muted-foreground">
            Solve time in seconds · DNFs not plotted
          </p>
          <TrendChart solves={solves} />
        </div>
      )}
    </section>
  );
}
