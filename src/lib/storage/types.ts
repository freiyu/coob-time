export type Penalty = "none" | "plus2" | "dnf";

export interface SolveRecord {
  id: string;
  sessionId: string;
  puzzleId: string;
  rawTimeMs: number;
  penalty: Penalty;
  scramble: string;
  createdAt: string;
  source: "timer" | "manual" | "imported";
  notes?: string;
  schemaVersion: number;
}

export interface SessionRecord {
  id: string;
  name: string;
  puzzleId: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SettingsRecord {
  defaultPuzzleId: string;
  startMode: "press" | "hold";
  inspectionEnabled: boolean;
  soundEnabled: boolean;
  theme: "dark" | "light" | "system";
  autoNextScramble: boolean;
}

export interface SolveRepository {
  listBySession(sessionId: string): Promise<SolveRecord[]>;
  add(solve: SolveRecord): Promise<void>;
}

export interface SessionRepository {
  list(): Promise<SessionRecord[]>;
  add(session: SessionRecord): Promise<void>;
}
