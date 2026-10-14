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
  start(): void;
  stop(): void;
  subscribe(listener: (phase: TimerPhase) => void): () => void;
}
