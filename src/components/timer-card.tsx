import { formatMs } from "@/lib/sample-data";

interface TimerCardProps {
  ao5: number | null;
}

export default function TimerCard({ ao5 }: TimerCardProps) {
  return (
    <section aria-label="Timer">
      <div className="flex h-full min-h-[38vh] flex-col items-center justify-center gap-4 rounded-[14px] border border-border bg-card px-4 py-10">
        <p className="text-[clamp(3.5rem,14vw,9rem)] leading-none font-bold tabular-nums text-foreground">
          0.00
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          <span className="hidden [@media(hover:hover)]:inline">
            Press Space to start
          </span>
          <span className="hidden [@media(hover:none)]:inline">Tap to start</span>
        </p>
        <div className="mt-2 flex w-full max-w-xs items-baseline justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Average of 5</span>
          <span className="font-semibold tabular-nums text-foreground">
            {ao5 !== null ? formatMs(ao5) : "—"}
          </span>
        </div>
      </div>
    </section>
  );
}
