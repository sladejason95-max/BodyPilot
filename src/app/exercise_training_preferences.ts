export type ExercisePreferenceIdentity = {
  exerciseId?: string;
  name: string;
};

const normalizedText = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

const exerciseNameSlug = (value: string): string =>
  value.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const zeroAddedLoadNames = new Set([
  "hanging knee raise",
  "hanging leg raise",
  "captain's chair knee raise",
  "reverse crunch",
  "ab wheel rollout",
  "plank",
  "side plank",
  "dead bug",
  "decline sit-up",
  "decline sit up",
  "chin-up",
  "chin up",
  "triceps dip",
  "bench dip",
  "assisted triceps dip",
]);

/**
 * Zero means no added external load, not an unperformed set. Explicit metadata
 * wins; otherwise recognize established bodyweight names without guessing from
 * a broad muscle group or movement pattern such as "Hip flexion".
 */
export const exercisePermitsZeroLoad = (
  exercise: { name: string; pattern?: string; loadRequired?: boolean },
): boolean => {
  if (typeof exercise?.loadRequired === "boolean") return !exercise.loadRequired;
  const name = normalizedText(exercise?.name)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2010-\u2015]/g, "-");
  const pattern = normalizedText(exercise?.pattern);
  // Preserve the app's existing push-up and pull-up zero-added-load behavior,
  // including assisted and weighted variants that can also be done unweighted.
  if (/\b(?:push|pull)[ -]?ups?\b/.test(`${name} ${pattern}`)) return true;
  if (zeroAddedLoadNames.has(name)) return true;
  if (/\b(?:weighted|loaded|cable|machine|barbell|dumbbell)\b/.test(name)) return false;
  return /\bbody[ -]?weight\b/.test(`${name} ${pattern}`);
};

/** Stable catalog IDs survive renames; custom names retain punctuation to avoid slug collisions. */
export const exercisePreferenceKey = (lift: ExercisePreferenceIdentity): string => {
  const id = normalizedText(lift?.exerciseId);
  if (id) return `id:${id}`;
  const name = normalizedText(lift?.name);
  return name ? `name:${name}` : "";
};

/** Explicit exercise IDs take precedence; names and slots only bridge genuinely legacy records. */
export const exerciseHistoryMatches = (
  lift: ExercisePreferenceIdentity & { id?: string },
  entry: { exerciseId?: string; liftName: string; liftId?: string },
): boolean => {
  const liftExerciseId = normalizedText(lift?.exerciseId);
  const entryExerciseId = normalizedText(entry?.exerciseId);
  if (liftExerciseId && entryExerciseId) return liftExerciseId === entryExerciseId;

  const liftName = normalizedText(lift?.name);
  const entryName = normalizedText(entry?.liftName);
  if (liftName && entryName && liftName === entryName) return true;

  if (liftExerciseId || entryExerciseId) return false;
  const liftSlotId = normalizedText(lift?.id);
  const entrySlotId = normalizedText(entry?.liftId);
  return Boolean(liftSlotId && entrySlotId && liftSlotId === entrySlotId);
};

const normalizedStorageKey = (key: string): string => {
  const normalized = normalizedText(key);
  const prefixed = /^(id|name)\s*:\s*(.*)$/.exec(normalized);
  if (!prefixed) return normalized;
  const identity = normalizedText(prefixed[2]);
  return identity ? `${prefixed[1]}:${identity}` : "";
};

const numericPattern = /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const reservedKeys = new Set(["__proto__", "prototype", "constructor"]);

/** A saved zero means reps-only. Invalid preferences are absent, never clamped or zero-filled. */
export const normalizeExerciseLoadIncrements = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries: [string, number][] = [];
  for (const [rawKey, rawIncrement] of Object.entries(value)) {
    const key = normalizedStorageKey(rawKey);
    if (!key || reservedKeys.has(key)) continue;
    const increment = typeof rawIncrement === "number"
      ? rawIncrement
      : typeof rawIncrement === "string" && numericPattern.test(rawIncrement.trim())
        ? Number(rawIncrement.trim())
        : NaN;
    if (!Number.isFinite(increment) || increment < 0 || increment > 25) continue;
    entries.push([key, Object.is(increment, -0) ? 0 : increment]);
  }
  return Object.fromEntries(entries);
};

/** Matches only a full persisted ID, name, name slug, or namespaced preference key. */
export const hasExercisePainFlag = (
  lift: ExercisePreferenceIdentity,
  painful: readonly string[],
): boolean => {
  const id = normalizedText(lift?.exerciseId);
  const name = normalizedText(lift?.name);
  const candidates = new Set([
    id,
    name,
    exerciseNameSlug(name),
    id ? `id:${id}` : "",
    name ? `name:${name}` : "",
  ].filter(Boolean));
  if (!candidates.size || !Array.isArray(painful)) return false;
  return painful.some((flag) => {
    const text = typeof flag === "string" ? flag : "";
    return candidates.has(normalizedText(text)) || candidates.has(normalizedStorageKey(text));
  });
};

/** Remove every current ID/name/slug alias, preserving the order and spelling of unrelated flags. */
export const clearExercisePainFlags = (
  lift: ExercisePreferenceIdentity,
  painful: readonly string[],
): string[] => {
  if (!Array.isArray(painful)) return [];
  return painful.filter((flag) => typeof flag === "string" && !hasExercisePainFlag(lift, [flag]));
};

/** Save stable identity plus the current name, which remains compatible with legacy substitution ranking. */
export const recordExercisePainFlag = (
  lift: ExercisePreferenceIdentity,
  painful: readonly string[],
): string[] => {
  const key = exercisePreferenceKey(lift);
  if (!key) return Array.isArray(painful) ? [...painful] : [];
  const aliases = [key, normalizedText(lift.name)].filter(Boolean);
  return [...clearExercisePainFlags(lift, painful), ...new Set(aliases)];
};

/**
 * Call when renaming the same exercise, not replacing it. Stable IDs or legacy
 * slot IDs prove continuity; a fully name-only legacy item relies on that
 * explicit rename action. Conflicting known identities never inherit pain.
 */
export const preserveExercisePainOnRename = (
  previousLift: ExercisePreferenceIdentity & { id?: string },
  renamedLift: ExercisePreferenceIdentity & { id?: string },
  painful: readonly string[],
): string[] => {
  const unchanged = Array.isArray(painful) ? [...painful] : [];
  if (!hasExercisePainFlag(previousLift, painful) || !exercisePreferenceKey(renamedLift)) return unchanged;

  const previousId = normalizedText(previousLift.exerciseId);
  const renamedId = normalizedText(renamedLift.exerciseId);
  if (previousId && renamedId && previousId !== renamedId) return unchanged;

  const sameStableId = Boolean(previousId && renamedId && previousId === renamedId);
  if (!sameStableId) {
    const previousSlot = normalizedText(previousLift.id);
    const renamedSlot = normalizedText(renamedLift.id);
    const sameSlot = Boolean(previousSlot && renamedSlot && previousSlot === renamedSlot);
    const namesOnly = !previousId && !renamedId && !previousSlot && !renamedSlot;
    if (!sameSlot && !namesOnly) return unchanged;
  }

  return recordExercisePainFlag(renamedLift, clearExercisePainFlags(previousLift, painful));
};
