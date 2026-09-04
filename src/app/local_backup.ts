export const LOCAL_BACKUP_FORMAT = "bodypilot-local-backup" as const;
export const LOCAL_BACKUP_VERSION = 1 as const;
export const LOCAL_STATE_SCHEMA_VERSION = 4 as const;
export const MAX_LOCAL_BACKUP_BYTES = 8 * 1024 * 1024;

export type BackupState = Record<string, unknown>;
export type LocalBackup = {
  format: typeof LOCAL_BACKUP_FORMAT;
  version: typeof LOCAL_BACKUP_VERSION;
  stateSchemaVersion: typeof LOCAL_STATE_SCHEMA_VERSION;
  exportedAt: string;
  state: BackupState;
};
export type ParsedLocalBackup = {
  state: BackupState;
  source: "versioned" | "legacy-tab-copy";
  exportedAt: string | null;
  version: number | null;
  counts: { label: string; count: number }[];
};

const record = (value: unknown): value is BackupState =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
function fail(message: string): never {
  throw new Error(message);
}
const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const validExportDate = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  )
    return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString() ===
      value.replace(/Z$/, value.includes(".") ? "Z" : ".000Z")
  );
};

/** Reject unsafe/non-JSON values before serializing instead of silently losing them. */
const checkJson = (
  value: unknown,
  depth = 0,
  ancestors = new Set<object>(),
): void => {
  if (depth > 80) fail("This backup is nested too deeply to restore safely.");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      fail("This backup contains an invalid number.");
    return;
  }
  if (typeof value !== "object")
    fail("This backup contains a value that cannot be saved as JSON.");
  if (ancestors.has(value)) fail("This backup contains a circular record.");
  if (Array.isArray(value) && Object.keys(value).length !== value.length)
    fail("This backup contains an incomplete list.");
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    fail("This backup contains a non-JSON record.");
  }
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key))
      fail("This backup contains an unsafe record key.");
    // Optional properties on the in-memory app state are omitted by JSON normally.
    if (child === undefined && !Array.isArray(value)) continue;
    checkJson(child, depth + 1, ancestors);
  }
  ancestors.delete(value);
};

/** Recognition is intentionally limited to this app's canonical schema-4 state. */
export const validateBackupState = (value: unknown): BackupState => {
  if (!record(value))
    fail("Choose a BodyPilot backup or a BodyPilot tab-copy JSON file.");
  if (
    finite(value.schemaVersion) &&
    value.schemaVersion > LOCAL_STATE_SCHEMA_VERSION
  ) {
    fail(
      "This backup was made by a newer BodyPilot version. Update the app before restoring it.",
    );
  }
  if (
    value.schemaVersion !== LOCAL_STATE_SCHEMA_VERSION ||
    value.foodDiaryVersion !== 1 ||
    !["dark", "light"].includes(String(value.theme)) ||
    !["recomposition", "fat-loss", "muscle-gain", "performance"].includes(
      String(value.goal),
    ) ||
    !["male", "female"].includes(String(value.sex)) ||
    !nonempty(value.mesocycleId)
  ) {
    fail(
      "This file is not a recognized BodyPilot core-app backup. Your current data has not changed.",
    );
  }
  for (const key of [
    "age",
    "heightIn",
    "bodyWeightLb",
    "targetWeightLb",
    "sessionsPerWeek",
    "sessionMinutes",
    "currentWeek",
    "mesoLengthWeeks",
  ]) {
    if (!finite(value[key])) fail(`The backup has an invalid ${key} setting.`);
  }
  for (const key of [
    "foodLog",
    "savedFoodMeals",
    "workoutHistory",
    "bodyWeightHistory",
    "scheduleItems",
    "availableTrainingDays",
  ]) {
    if (!Array.isArray(value[key]))
      fail(`The backup is missing its ${key} records.`);
  }
  for (const key of [
    "workoutLog",
    "workoutSessions",
    "recoveryCheckins",
    "musclePriorities",
    "muscleFeedback",
  ]) {
    if (!record(value[key])) fail(`The backup is missing its ${key} records.`);
  }
  for (const key of [
    "foodLog",
    "savedFoodMeals",
    "workoutHistory",
    "bodyWeightHistory",
    "scheduleItems",
  ]) {
    if (!(value[key] as unknown[]).every(record))
      fail(`The backup has malformed ${key} records.`);
  }
  if (
    !Object.values(value.workoutSessions as BackupState).every(record) ||
    !Object.values(value.recoveryCheckins as BackupState).every(record) ||
    !Object.values(value.workoutLog as BackupState).every(
      (sets) => Array.isArray(sets) && sets.every(record),
    )
  ) {
    fail("The backup has malformed workout or recovery records.");
  }
  checkJson(value);
  return value;
};

export const localBackupCounts = (state: BackupState) => [
  { label: "Food entries", count: (state.foodLog as unknown[]).length },
  { label: "Saved meals", count: (state.savedFoodMeals as unknown[]).length },
  {
    label: "Workout sessions",
    count: Object.keys(state.workoutSessions as BackupState).length,
  },
  {
    label: "Exercise history records",
    count: (state.workoutHistory as unknown[]).length,
  },
  {
    label: "Bodyweight measurements",
    count: (state.bodyWeightHistory as unknown[]).length,
  },
  { label: "Schedule items", count: (state.scheduleItems as unknown[]).length },
];

export const createLocalBackup = (
  state: unknown,
  exportedAt: string,
): LocalBackup => {
  const validated = validateBackupState(state);
  if (!validExportDate(exportedAt)) {
    fail("A valid export date is required.");
  }
  const backup: LocalBackup = {
    format: LOCAL_BACKUP_FORMAT,
    version: LOCAL_BACKUP_VERSION,
    stateSchemaVersion: LOCAL_STATE_SCHEMA_VERSION,
    exportedAt: new Date(exportedAt).toISOString(),
    state: JSON.parse(JSON.stringify(validated)),
  };
  if (bytes(JSON.stringify(backup)) > MAX_LOCAL_BACKUP_BYTES)
    fail("This backup exceeds the 8 MB restore limit.");
  return backup;
};

export const serializeLocalBackup = (
  state: unknown,
  exportedAt = new Date().toISOString(),
): string => {
  const serialized = JSON.stringify(
    createLocalBackup(state, exportedAt),
    null,
    2,
  );
  if (bytes(serialized) > MAX_LOCAL_BACKUP_BYTES)
    fail("This backup exceeds the 8 MB restore limit.");
  return serialized;
};

export const parseLocalBackup = (text: string): ParsedLocalBackup => {
  if (bytes(text) > MAX_LOCAL_BACKUP_BYTES)
    fail("This backup is too large. The maximum supported size is 8 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    fail("This file is not valid JSON. Your current data has not changed.");
  }
  if (!record(parsed))
    fail("Choose a BodyPilot backup or a BodyPilot tab-copy JSON file.");
  checkJson(parsed);
  const isEnvelope =
    "format" in parsed || "version" in parsed || "state" in parsed;
  if (isEnvelope) {
    if (parsed.format !== LOCAL_BACKUP_FORMAT)
      fail("This backup belongs to a different app or format.");
    if (
      parsed.version !== LOCAL_BACKUP_VERSION ||
      parsed.stateSchemaVersion !== LOCAL_STATE_SCHEMA_VERSION
    ) {
      fail(
        "This backup version is not supported. Use the BodyPilot version that created it or a newer compatible version.",
      );
    }
    if (!validExportDate(parsed.exportedAt)) {
      fail("This backup has an invalid export date.");
    }
    const state = validateBackupState(parsed.state);
    return {
      state,
      source: "versioned",
      exportedAt: parsed.exportedAt,
      version: parsed.version as number,
      counts: localBackupCounts(state),
    };
  }
  const state = validateBackupState(parsed);
  return {
    state,
    source: "legacy-tab-copy",
    exportedAt: null,
    version: null,
    counts: localBackupCounts(state),
  };
};

const equalJson = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((value, index) => equalJson(value, right[index]))
    );
  if (record(left) && record(right)) {
    const leftKeys = Object.keys(left).filter((key) => left[key] !== undefined);
    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        equalJson(left[key], right[key]),
    );
  }
  return false;
};

/** Restore must not silently discard or reinterpret supplied records in normalization. */
export const backupNormalizationChanges = (
  source: BackupState,
  normalized: BackupState,
): string[] =>
  Object.keys(source).filter(
    (key) =>
      source[key] !== undefined && !equalJson(source[key], normalized[key]),
  );
