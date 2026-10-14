import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SessionRecord, SettingsRecord, SolveRecord } from "@/lib/storage/types";

export const DB_NAME = "cubetime";
// ponytail: v1 creates every store; real migrations start at v2 — bump
// DB_VERSION and add an upgrade branch there when the schema first changes.
export const DB_VERSION = 1;
const SETTINGS_KEY = "app";

export const DEFAULT_SETTINGS: SettingsRecord = {
  defaultPuzzleId: "3x3",
  startMode: "hold",
  inspectionEnabled: false,
  soundEnabled: false,
  theme: "system",
  autoNextScramble: true,
};

interface CubetimeDB extends DBSchema {
  solves: { key: string; value: SolveRecord; indexes: { sessionId: string } };
  sessions: { key: string; value: SessionRecord };
  settings: { key: string; value: SettingsRecord };
}

export class StorageError extends Error {}

let dbPromise: Promise<IDBPDatabase<CubetimeDB>> | null = null;

const OPEN_TIMEOUT_MS = 5_000;

export function cubetimeDb(): Promise<IDBPDatabase<CubetimeDB>> {
  if (dbPromise === null) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const opened = openDB<CubetimeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("solves")) {
          const solves = db.createObjectStore("solves", { keyPath: "id" });
          solves.createIndex("sessionId", "sessionId");
        }
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      },
      blocked() {
        // Another tab holds an older version open; the timeout below surfaces
        // this instead of hanging the app on "Loading local data…".
      },
    });
    const timedOut = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new StorageError("Local database open timed out"));
      }, OPEN_TIMEOUT_MS);
    });
    dbPromise = Promise.race([opened, timedOut])
      .then((db) => {
        clearTimeout(timeoutId);
        return db;
      })
      .catch((cause) => {
        clearTimeout(timeoutId);
        dbPromise = null;
        throw new StorageError("Local database could not be opened", { cause });
      });
  }
  return dbPromise;
}

export async function listSessions(): Promise<SessionRecord[]> {
  const db = await cubetimeDb();
  return db.getAll("sessions");
}

export async function listSolves(): Promise<SolveRecord[]> {
  const db = await cubetimeDb();
  return db.getAll("solves");
}

export async function putSession(session: SessionRecord): Promise<void> {
  const db = await cubetimeDb();
  await db.put("sessions", session);
}

export async function putSolve(solve: SolveRecord): Promise<void> {
  const db = await cubetimeDb();
  await db.put("solves", solve);
}

export async function deleteSolve(id: string): Promise<void> {
  const db = await cubetimeDb();
  await db.delete("solves", id);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await cubetimeDb();
  const tx = db.transaction(["sessions", "solves"], "readwrite");
  const solveKeys = await tx.objectStore("solves").index("sessionId").getAllKeys(id);
  await Promise.all([
    ...solveKeys.map((key) => tx.objectStore("solves").delete(key)),
    tx.objectStore("sessions").delete(id),
    tx.done,
  ]);
}

export async function getSettings(): Promise<SettingsRecord | null> {
  const db = await cubetimeDb();
  return (await db.get("settings", SETTINGS_KEY)) ?? null;
}

export async function putSettings(settings: SettingsRecord): Promise<void> {
  const db = await cubetimeDb();
  await db.put("settings", settings, SETTINGS_KEY);
}

export async function putImported(
  sessions: SessionRecord[],
  solves: SolveRecord[],
  settings: SettingsRecord | null,
  mode: "merge" | "replace",
): Promise<void> {
  const db = await cubetimeDb();
  const tx = db.transaction(["sessions", "solves", "settings"], "readwrite");
  if (mode === "replace") {
    // Clear inside the same transaction so a crash can never leave the user
    // with an empty database and no restored data.
    await Promise.all([
      tx.objectStore("sessions").clear(),
      tx.objectStore("solves").clear(),
      tx.objectStore("settings").clear(),
    ]);
  }
  await Promise.all([
    ...sessions.map((session) => tx.objectStore("sessions").put(session)),
    ...solves.map((solve) => tx.objectStore("solves").put(solve)),
    settings ? tx.objectStore("settings").put(settings, SETTINGS_KEY) : Promise.resolve(),
    tx.done,
  ]);
}

export async function clearAll(): Promise<void> {
  const db = await cubetimeDb();
  const tx = db.transaction(["sessions", "solves", "settings"], "readwrite");
  await Promise.all([
    tx.objectStore("sessions").clear(),
    tx.objectStore("solves").clear(),
    tx.objectStore("settings").clear(),
    tx.done,
  ]);
}
