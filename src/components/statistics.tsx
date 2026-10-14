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
}

function StatCard({ label, value, sub, pb }: StatCardProps) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </p>
      {pb && (
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-sm font-semibold text-brand-soft-foreground">
          <Award aria-hidden className="size-3" />
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

function TrendChart({ solves }: { solves: SolveRecord[] }) {
  const points = solves
    .map((solve, index) => ({ number: index + 1, ms: effectiveMs(solve) }))
    .filter((point): point is { number: number; ms: number } => point.ms !== null);

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[14px] border border-border bg-card">
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
    <div className="rounded-[14px] border border-border bg-card p-4 sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Solve trend</h3>
        <p className="text-sm text-muted-foreground">
          solve time in seconds · DNFs not plotted
        </p>
      </header>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-40 w-full sm:h-48"
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
    </div>
  );
}

export default function Statistics({ solves }: StatisticsProps) {
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
      : { label: "Best single", ...notEnough() },
    avg !== null
      ? { label: "Mean", value: formatMs(avg), sub: "valid solves" }
      : { label: "Mean", ...notEnough() },
    currentAo5 !== null
      ? { label: "Ao5", value: formatMs(currentAo5) }
      : { label: "Ao5", ...notEnough() },
    currentAo12 !== null
      ? { label: "Ao12", value: formatMs(currentAo12) }
      : { label: "Ao12", ...notEnough() },
    topAo5 !== null
      ? { label: "Best Ao5", value: formatMs(topAo5) }
      : { label: "Best Ao5", ...notEnough() },
    topAo12 !== null
      ? { label: "Best Ao12", value: formatMs(topAo12) }
      : { label: "Best Ao12", ...notEnough() },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Statistics</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
      <TrendChart solves={solves} />
    </div>
  );
}
