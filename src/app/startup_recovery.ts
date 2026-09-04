// prettier-ignore
// @ts-ignore TS5097: native Node tests import this dependency without a build step.
import { statePersistenceLockName } from "./transactional_state_persistence.ts";
import type { StateLockManager } from "./transactional_state_persistence";
import type { LocalStateStorage } from "./local_state_persistence";

export const recoveryArchivePrefix = (key: string): string => `bodypilot:recovery:${key}:`;

export type RecoveryArchive = { key: string; archivedAt: string; content: string };

/** Read only this app state's local recovery copies; never restore or repair one. */
export const listRecoveryArchives = ({ storage, key }: {
  storage: Pick<Storage, "length" | "key" | "getItem">;
  key: string;
}): { status: "read"; archives: RecoveryArchive[] } | { status: "error"; archives: []; message: string } => {
  try {
    const prefix = recoveryArchivePrefix(key);
    const archives: RecoveryArchive[] = [];
    const length = storage.length;
    for (let index = 0; index < length; index += 1) {
      const archiveKey = storage.key(index);
      if (!archiveKey?.startsWith(prefix)) continue;
      const content = storage.getItem(archiveKey);
      if (content === null) continue;
      try {
        const archive = JSON.parse(content);
        if (!archive || archive.format !== "bodypilot-storage-recovery" || archive.version !== 1 ||
            archive.primaryKey !== key || typeof archive.archivedAt !== "string" ||
            !Number.isFinite(Date.parse(archive.archivedAt)) || !archive.records ||
            typeof archive.records !== "object" || Array.isArray(archive.records) ||
            !Object.prototype.hasOwnProperty.call(archive.records, key) ||
            Object.entries(archive.records).some(([recordKey, raw]) => !recordKey ||
              (raw !== null && typeof raw !== "string"))) continue;
        archives.push({ key: archiveKey, archivedAt: archive.archivedAt, content });
      } catch { /* An incomplete or foreign archive is not an app recovery copy. */ }
    }
    archives.sort((left, right) => Date.parse(right.archivedAt) - Date.parse(left.archivedAt) || left.key.localeCompare(right.key));
    return { status: "read", archives };
  } catch {
    return { status: "error", archives: [], message: "Recovery copies could not be read from this browser." };
  }
};

export type StartupRecoveryResult =
  | { status: "saved"; baselineRaw: string; archiveKey: string }
  | {
      status: "conflict";
      baselineRaw: string | null;
      changedKey: string;
      currentRaw: string | null;
      message: string;
    }
  | {
      status: "unavailable" | "error";
      baselineRaw: string | null;
      operation: "lock" | "validate" | "read" | "archive" | "write";
      message: string;
      error?: unknown;
      archiveKey?: string;
    };

/**
 * Keep exact damaged data locally before a user-requested fresh start.
 * Snapshots include absent values so a newly appearing legacy record is a conflict.
 * All participating state writers must share this lock; old unlocked writers do not.
 * Nothing is removed, including any archive left by an interrupted attempt.
 */
export const recoverFreshAppState = async ({
  storage,
  key,
  expectedRaw,
  originalRecords,
  nextRaw,
  archiveId,
  archivedAt,
  locks,
}: {
  storage: LocalStateStorage;
  key: string;
  expectedRaw: string | null;
  originalRecords: Readonly<Record<string, string | null>>;
  nextRaw: string;
  archiveId: string;
  archivedAt: string;
  locks: StateLockManager | null | undefined;
}): Promise<StartupRecoveryResult> => {
  const failure = (
    operation: "lock" | "validate" | "read" | "archive" | "write",
    message: string,
    error?: unknown,
    archiveKey?: string,
  ): StartupRecoveryResult => ({ status: "error", baselineRaw: expectedRaw, operation, message, error, archiveKey });
  // Capture caller-owned inputs before waiting for another tab's lock.
  const records = Object.entries(originalRecords ?? {});
  if (!key || !archiveId || !archivedAt || !Number.isFinite(Date.parse(archivedAt)) || typeof nextRaw !== "string" ||
      !Object.prototype.hasOwnProperty.call(originalRecords ?? {}, key) ||
      originalRecords[key] !== expectedRaw ||
      records.some(([recordKey, raw]) => !recordKey || (raw !== null && typeof raw !== "string"))) {
    return failure("validate", "The original saved data could not be verified. Reload before starting fresh.");
  }
  const archiveKey = `${recoveryArchivePrefix(key)}${archiveId}`;
  if (records.some(([recordKey]) => recordKey === archiveKey)) {
    return failure("validate", "The recovery copy needs a new location. Reload and try again.");
  }
  const archiveRaw = JSON.stringify({
    format: "bodypilot-storage-recovery",
    version: 1,
    archivedAt,
    primaryKey: key,
    records: Object.fromEntries(records),
  });
  try {
    if (!locks || typeof locks.request !== "function") {
      return {
        status: "unavailable", baselineRaw: expectedRaw, operation: "lock",
        message: "This browser cannot safely start fresh. Open BodyPilot in an updated browser and try again.",
      };
    }
    const name = statePersistenceLockName(key);
    return await locks.request<StartupRecoveryResult>(name, { mode: "exclusive" }, (lock) => {
      if (!lock || lock.name !== name || lock.mode !== "exclusive") {
        return failure("lock", "A safe save could not be started. Your original saved data has not been replaced.");
      }
      const compareOriginals = (): StartupRecoveryResult | null => {
        for (const [recordKey, raw] of records) {
          let currentRaw: string | null;
          try { currentRaw = storage.getItem(recordKey); }
          catch (error) {
            return failure("read", "Your saved data could not be read. Nothing has been replaced.", error);
          }
          if (currentRaw !== raw) {
            return {
              status: "conflict", baselineRaw: expectedRaw, changedKey: recordKey, currentRaw,
              message: "Saved data changed in another tab. Reload before starting fresh.",
            };
          }
        }
        return null;
      };
      // Synchronous comparison, archive verification, and replacement while locked.
      const initialConflict = compareOriginals();
      if (initialConflict) return initialConflict;
      try {
        if (storage.getItem(archiveKey) !== null) {
          return failure("archive", "A recovery copy already uses this location. Reload and try again; nothing has been replaced.");
        }
      } catch (error) {
        return failure("read", "The recovery copy location could not be checked. Nothing has been replaced.", error);
      }
      try { storage.setItem(archiveKey, archiveRaw); }
      catch (error) {
        return failure("archive", "This browser could not store a recovery copy. Check its available storage and storage access; nothing has been replaced.", error);
      }
      try {
        if (storage.getItem(archiveKey) !== archiveRaw) {
          return failure("archive", "The recovery copy could not be verified. Nothing has been replaced.");
        }
      } catch (error) {
        return failure("read", "The recovery copy could not be verified. Nothing has been replaced.", error);
      }
      const finalConflict = compareOriginals();
      if (finalConflict) return finalConflict;
      try { storage.setItem(key, nextRaw); }
      catch (error) {
        return failure("write", "The fresh start could not be saved. Your original data is kept in a recovery copy on this device.", error, archiveKey);
      }
      return { status: "saved", baselineRaw: nextRaw, archiveKey };
    });
  } catch (error) {
    return failure("lock", "A safe save could not be started. Your original saved data has not been replaced.", error);
  }
};
