import { describe, expect, it } from "vitest";
import { buildBackup, backupToCsv } from "@/lib/backup/format";
import { parseBackup } from "@/lib/backup/validate";
import { planImport } from "@/lib/backup/import";
import {
  DEFAULT_SETTINGS,
  DB_VERSION,
} from "@/lib/storage/idb";
import type { SessionRecord, SolveRecord } from "@/lib/storage/types";

const session: SessionRecord = {
  id: "3x3-default",
  name: "Default session",
  puzzleId: "3x3",
  createdAt: "2026-10-14T10:00:00.000Z",
  updatedAt: "2026-10-14T10:00:00.000Z",
};

const solve: SolveRecord = {
  id: "solve-1",
  sessionId: "3x3-default",
  puzzleId: "3x3",
  rawTimeMs: 12345,
  penalty: "plus2",
  scramble: "R U R'",
  createdAt: "2026-10-14T10:01:00.000Z",
  source: "timer",
  schemaVersion: 1,
};

function backup() {
  return buildBackup({
    sessions: [session],
    solves: [solve],
    settings: DEFAULT_SETTINGS,
    exportedAt: "2026-10-14T10:02:00.000Z",
  });
}

describe("parseBackup", () => {
  it("accepts a backup this app just built", () => {
    const result = parseBackup(backup());
    expect(result.ok).toBe(true);
  });

  it("rejects non-CubeTime JSON", () => {
    expect(parseBackup({ foo: 1 }).ok).toBe(false);
    expect(parseBackup(null).ok).toBe(false);
    expect(parseBackup("hi").ok).toBe(false);
  });

  it("rejects backups from a newer schema version with a clear message", () => {
    const result = parseBackup({ ...backup(), schemaVersion: 3 });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("newer version");
  });

  it("rejects malformed records", () => {
    const bad = structuredClone(backup());
    // @ts-expect-error deliberately breaking the payload
    bad.solves[0].rawTimeMs = "fast";
    expect(parseBackup(bad).ok).toBe(false);
  });

  it("accepts a legacy v1 backup and maps inspectionEnabled to inspectionMode", () => {
    const legacy = structuredClone(backup()) as Record<string, unknown>;
    legacy.schemaVersion = 1; // files exported before this change
    const settings = legacy.settings as Record<string, unknown>;
    delete settings.inspectionMode;
    settings.inspectionEnabled = true;
    const result = parseBackup(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.settings.inspectionMode).toBe("wca");
      expect(
        (result.backup.settings as Record<string, unknown>)
          .inspectionEnabled,
      ).toBeUndefined();
    }

    settings.inspectionEnabled = false;
    const off = parseBackup(legacy);
    expect(off.ok).toBe(true);
    if (off.ok) expect(off.backup.settings.inspectionMode).toBe("off");
  });
});

describe("backupToCsv", () => {
  it("writes a header and one row per solve, joining the session name", () => {
    const csv = backupToCsv([solve], [session]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("rawTimeMs");
    expect(lines[1]).toContain("Default session");
    expect(lines[1]).toContain('"12345"');
    expect(lines[1]).toContain('"14345"'); // +2 applied
    expect(lines[1]).toContain("plus2");
  });

  it("escapes quotes and commas", () => {
    const noted: SolveRecord = {
      ...solve,
      id: 'weird","id',
      notes: 'said "nice", twice',
    };
    const csv = backupToCsv([noted], [session]);
    expect(csv).toContain('"weird"",""id"');
    expect(csv).toContain('"said ""nice"", twice"');
  });

  it("leaves effectiveTimeMs empty for DNF", () => {
    const dnf: SolveRecord = { ...solve, penalty: "dnf" };
    const csv = backupToCsv([dnf], [session]);
    expect(csv).toContain('""'); // effective cell is the empty quoted field
    expect(csv).not.toContain("12345,"); // raw still present, quoted
  });
});

describe("planImport", () => {
  const incoming = backup();

  it("merge skips duplicate session and solve ids", () => {
    const plan = planImport(incoming, [session], [solve], "merge");
    expect(plan.sessionsToAdd).toHaveLength(0);
    expect(plan.solvesToAdd).toHaveLength(0);
    expect(plan.skippedSessions).toBe(1);
    expect(plan.skippedSolves).toBe(1);
    expect(plan.settingsToApply).toBeNull();
  });

  it("merge adds unknown records and drops orphan solves", () => {
    const orphan: SolveRecord = { ...solve, id: "solve-2", sessionId: "ghost" };
    const withOrphan = {
      ...incoming,
      solves: [{ ...solve, id: "solve-3" }, orphan],
    };
    const plan = planImport(withOrphan, [], [], "merge");
    expect(plan.sessionsToAdd).toHaveLength(1);
    expect(plan.solvesToAdd.map((s) => s.id)).toEqual(["solve-3"]);
    expect(plan.skippedSolves).toBe(1);
  });

  it("replace takes everything and applies settings", () => {
    const plan = planImport(incoming, [session], [solve], "replace");
    expect(plan.sessionsToAdd).toHaveLength(1);
    expect(plan.solvesToAdd).toHaveLength(1);
    expect(plan.skippedSessions).toBe(0);
    expect(plan.skippedSolves).toBe(0);
    expect(plan.settingsToApply).toEqual(DEFAULT_SETTINGS);
  });
});

describe("storage constants", () => {
  it("pins the IndexedDB schema version so upgrades stay intentional", () => {
    expect(DB_VERSION).toBe(2);
    expect(DEFAULT_SETTINGS.startMode).toBe("hold");
    expect(DEFAULT_SETTINGS.inspectionMode).toBe("off");
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(false);
  });
});
