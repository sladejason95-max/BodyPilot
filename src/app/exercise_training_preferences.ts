export type ExercisePreferenceIdentity = {
  exerciseId?: string;
  name: string;
};

const normalizedText = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

const exerciseNameSlug = (value: string): string =>
  value.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Stable catalog IDs survive renames; custom names retain punctuation to avoid slug collisions. */
export const exercisePreferenceKey = (lift: ExercisePreferenceIdentity): string => {
  const id = normalizedText(lift?.exerciseId);
  if (id) return `id:${id}`;
  const name = normalizedText(lift?.name);
  return name ? `name:${name}` : "";
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
