export type TimerPhase =
  | "idle"
  | "holding"
  | "ready"
  | "running"
  | "stopped"
  | "saving"
  | "saved";

export interface TimerEngine {
  readonly phase: TimerPhase;
  readonly holdToReady: boolean;
  start(): void;
  stop(): number | null;
  arm(): void;
  release(): void;
  cancel(): void;
  elapsedMs(): number;
  subscribe(listener: (phase: TimerPhase) => void): () => void;
}
