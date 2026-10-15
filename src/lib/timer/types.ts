export type TimerPhase =
  | "idle"
  | "inspection"
  | "holding"
  | "ready"
  | "running"
  | "stopped"
  | "saving"
  | "saved";

export type InspectionMode = "off" | "15s" | "wca";

export type TimerPenalty = "none" | "plus2" | "dnf";

export interface TimerStop {
  rawTimeMs: number;
  penalty: TimerPenalty;
}

export interface TimerEngine {
  readonly phase: TimerPhase;
  readonly holdToReady: boolean;
  setInspection(mode: InspectionMode): void;
  startInspection(): boolean;
  inspectionElapsedMs(): number;
  start(): void;
  stop(): TimerStop | null;
  arm(): void;
  release(): void;
  cancel(): void;
  elapsedMs(): number;
  subscribe(listener: (phase: TimerPhase) => void): () => void;
}
