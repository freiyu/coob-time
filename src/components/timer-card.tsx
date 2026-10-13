export default function TimerCard() {
  return (
    <section aria-label="Timer">
      <div className="flex min-h-[38vh] flex-col items-center justify-center gap-4 rounded-[14px] border border-border bg-card px-4 py-10">
        <p className="text-[clamp(3.5rem,14vw,9rem)] leading-none font-bold tabular-nums text-foreground">
          0.00
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          <span className="hidden [@media(hover:hover)]:inline">
            Press Space to start
          </span>
          <span className="hidden [@media(hover:none)]:inline">Tap to start</span>
        </p>
      </div>
    </section>
  );
}
