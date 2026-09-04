type StoredRecord = Record<string, unknown>;
type StorageReader = { getItem(key: string): string | null };

export type AppStateLoad<T> = {
  state: T;
  baselineRaw: string | null | undefined;
  problem: string | null;
  recoveryCopy?: { content: string; label: string };
};

const parseStoredRecord = (raw: string): StoredRecord => {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved data is not a recognized app record.");
  }
  const record = parsed as StoredRecord;
  if (typeof record.schemaVersion === "number" && record.schemaVersion > 4) {
    throw new Error("Saved data belongs to a newer app version. Update the app before opening it.");
  }
  if (record.schemaVersion !== undefined && (typeof record.schemaVersion !== "number" ||
      !Number.isInteger(record.schemaVersion) || record.schemaVersion < 1)) {
    throw new Error("Saved data has an unrecognized version. Its original contents have been kept.");
  }
  if (!("goal" in record || "goalFocus" in record) ||
      !("workoutLog" in record || "workoutSplit" in record || "trackerDays" in record || "bodyWeightLb" in record)) {
    throw new Error("Saved data is not a recognized BodyPilot record.");
  }
  return record;
};

/** An unreadable primary record must never become a fresh default save. */
export const loadAppStateSafely = <T>({
  storage, key, legacyKeys = [], defaultState, normalize,
}: {
  storage: StorageReader;
  key: string;
  legacyKeys?: readonly string[];
  defaultState: T;
  normalize: (parsed: StoredRecord, payloads: StoredRecord[]) => T;
}): AppStateLoad<T> => {
  let baselineRaw: string | null | undefined;
  const recoveryRecords: Record<string, string> = {};
  try {
    baselineRaw = storage.getItem(key);
    if (baselineRaw !== null) recoveryRecords[key] = baselineRaw;
    const readLegacyPayloads = () => {
      const payloads: StoredRecord[] = [];
      for (const legacyKey of legacyKeys) {
        const raw = storage.getItem(legacyKey);
        if (raw !== null) {
          recoveryRecords[legacyKey] = raw;
          payloads.push(parseStoredRecord(raw));
        }
      }
      return payloads;
    };
    // A damaged primary never falls back; older valid formats may import supplemental history.
    if (baselineRaw !== null) {
      const parsed = parseStoredRecord(baselineRaw);
      const payloads = parsed.schemaVersion === 4 ? [parsed] : [parsed, ...readLegacyPayloads()];
      return { state: normalize(parsed, payloads), baselineRaw, problem: null };
    }
    const payloads = readLegacyPayloads();
    return {
      state: payloads.length ? normalize(payloads[0], payloads) : defaultState,
      baselineRaw,
      problem: null,
    };
  } catch (cause) {
    return {
      state: defaultState,
      baselineRaw,
      problem: cause instanceof Error ? cause.message : "Saved data could not be read.",
      recoveryCopy: Object.keys(recoveryRecords).length ? {
        content: typeof baselineRaw === "string" ? baselineRaw : JSON.stringify({ format: "bodypilot-storage-recovery", records: recoveryRecords }, null, 2),
        label: typeof baselineRaw === "string" ? "Original saved data" : "Original legacy saved data",
      } : undefined,
    };
  }
};
