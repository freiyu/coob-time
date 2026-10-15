import { z } from "zod";

export const BACKUP_APP = "cubetime";
export const BACKUP_SCHEMA_VERSION = 1;
// ponytail: generous cap for a local timer's whole history; revisit if real
// users approach it (bulk imports are the only path that hits this).
const MAX_RECORDS = 100_000;

const isoDate = z.string().datetime();

const solveSchema = z.object({
  id: z.string().min(1).max(128),
  sessionId: z.string().min(1).max(128),
  puzzleId: z.string().min(1).max(32),
  rawTimeMs: z.number().finite().nonnegative(),
  penalty: z.enum(["none", "plus2", "dnf"]),
  scramble: z.string().max(4_000),
  createdAt: isoDate,
  source: z.enum(["timer", "manual", "imported"]),
  notes: z.string().max(2_000).optional(),
  schemaVersion: z.number().int().positive(),
});

const sessionSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
  puzzleId: z.string().min(1).max(32),
  createdAt: isoDate,
  updatedAt: isoDate,
  notes: z.string().max(2_000).optional(),
});

const settingsSchema = z
  .object({
    defaultPuzzleId: z.string().min(1).max(32),
    startMode: z.enum(["press", "hold"]),
    // v1 backups store inspectionEnabled: boolean; newer ones store the
    // three-way inspectionMode. Accept both, output only inspectionMode.
    inspectionMode: z.enum(["off", "15s", "wca"]).optional(),
    inspectionEnabled: z.boolean().optional(),
    soundEnabled: z.boolean(),
    theme: z.enum(["dark", "light", "system"]),
    autoNextScramble: z.boolean(),
  })
  .transform(({ inspectionMode, inspectionEnabled, ...rest }) => ({
    ...rest,
    inspectionMode: inspectionMode ?? (inspectionEnabled ? "wca" : "off"),
  }));

const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: isoDate,
  sessions: z.array(sessionSchema).max(MAX_RECORDS),
  solves: z.array(solveSchema).max(MAX_RECORDS),
  settings: settingsSchema,
});

export type BackupFile = z.infer<typeof backupSchema>;
export type BackupSolve = z.infer<typeof solveSchema>;
export type BackupSession = z.infer<typeof sessionSchema>;
export type BackupSettings = z.infer<typeof settingsSchema>;

export type ParseBackupResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

export function parseBackup(data: unknown): ParseBackupResult {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "Not a CubeTime backup file." };
  }
  const envelope = data as { app?: unknown; schemaVersion?: unknown };
  if (envelope.app !== BACKUP_APP) {
    return { ok: false, error: "Not a CubeTime backup file." };
  }
  if (
    typeof envelope.schemaVersion === "number" &&
    envelope.schemaVersion > BACKUP_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      error: "This backup was made by a newer version of CubeTime. Update CubeTime first.",
    };
  }
  const parsed = backupSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Backup file is malformed or incomplete." };
  }
  return { ok: true, backup: parsed.data };
}
