export type MigratedMuscleGroup =
  | "chest"
  | "back"
  | "quads"
  | "hamstrings"
  | "shoulders"
  | "arms"
  | "glutes"
  | "core";

export type MigratedWorkoutLift = {
  id: string;
  name: string;
  muscleGroup: MigratedMuscleGroup;
  pattern: string;
  target?: string;
  sets: number;
  reps: string;
};

export type MigratedSplitDay = {
  id: string;
  day: string;
  focus: string;
  intent: string;
  lifts: MigratedWorkoutLift[];
};

export type MigratedHistoryEntry = {
  id: string;
  completedAt: string;
  mesocycleId: string;
  weekNumber: number;
  sessionKey: string;
  dayId: string;
  dayFocus: string;
  liftId: string;
  liftName: string;
  muscleGroup: MigratedMuscleGroup;
  sets: Array<{ weight: number; reps: number; rir: number; skipped?: boolean }>;
  topSet: { weight: number; reps: number; rir: number; skipped?: boolean } | null;
  estimatedOneRepMax: number;
  totalVolume: number;
  sessionStartedAt?: string;
  durationSec?: number;
  source?: "legacy-tracker";
};

type UnknownRecord = Record<string, unknown>;

export type MigrationExerciseCatalogItem = {
  id: string;
  name: string;
  category: string;
  muscleBias: Array<{ muscle: string; contribution: number }>;
};

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;

const numberWithin = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const slug = (value: string, fallback: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return normalized || fallback;
};

const labelFromId = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

const normalizedText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const muscleFromText = (value: string): MigratedMuscleGroup => {
  const text = value.toLowerCase();
  if (/chest|pec/.test(text)) return "chest";
  if (/lat|back|row|trap|erector/.test(text)) return "back";
  if (/quad|squat|leg press|knee extension/.test(text)) return "quads";
  if (/hamstring|leg curl|hinge|deadlift/.test(text)) return "hamstrings";
  if (/glute|hip thrust|abduct/.test(text)) return "glutes";
  if (/shoulder|delt|lateral raise|rear fly/.test(text)) return "shoulders";
  if (/bicep|tricep|curl|pressdown|arm|forearm/.test(text)) return "arms";
  if (/core|ab|crunch|plank|pallof/.test(text)) return "core";
  return "chest";
};

const muscleFromLibraryItem = (item: MigrationExerciseCatalogItem | undefined, fallbackText: string) =>
  muscleFromText(item?.muscleBias[0]?.muscle || fallbackText);

const findLibraryItem = (catalog: readonly MigrationExerciseCatalogItem[], exerciseId: string, name = "") => {
  const normalizedName = name.toLowerCase();
  return catalog.find(
    (item) => item.id === exerciseId || (normalizedName && item.name.toLowerCase() === normalizedName)
  );
};

const normalizeRepRange = (value: unknown) => {
  const text = normalizedText(value);
  const matches = text.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (matches.length >= 2) return `${Math.max(1, Math.round(matches[0]))}-${Math.max(1, Math.round(matches[1]))}`;
  if (matches.length === 1) return `${Math.max(1, Math.round(matches[0]))}`;
  return "8-12";
};

/**
 * Adapts both the older WorkoutDay/exercises model and the current SplitDay/lifts
 * model. Days without exercise detail are retained so the user can repair them.
 */
export const migrateLegacyWorkoutSplit = (
  value: unknown,
  catalog: readonly MigrationExerciseCatalogItem[] = []
): MigratedSplitDay[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;

  const days = value.flatMap((item, dayIndex) => {
    const rawDay = asRecord(item);
    if (!rawDay) return [];
    const rawLifts = Array.isArray(rawDay.lifts)
      ? rawDay.lifts
      : Array.isArray(rawDay.exercises)
        ? rawDay.exercises
        : [];

    const lifts = rawLifts.flatMap((liftValue, liftIndex) => {
      const rawLift = asRecord(liftValue);
      if (!rawLift) return [];
      const exerciseId = normalizedText(rawLift.exerciseId) || normalizedText(rawLift.id);
      const explicitName = normalizedText(rawLift.name);
      const libraryItem = findLibraryItem(catalog, exerciseId, explicitName);
      const name = explicitName || libraryItem?.name || labelFromId(exerciseId);
      if (!name) return [];
      const muscleGroup = muscleFromText(
        normalizedText(rawLift.muscleGroup) || libraryItem?.muscleBias[0]?.muscle || name
      );
      const sets = Math.round(numberWithin(rawLift.sets ?? rawLift.plannedSets, 3, 1, 8));

      return [
        {
          id: normalizedText(rawLift.id) || exerciseId || `legacy-${dayIndex}-${liftIndex}`,
          name,
          muscleGroup,
          pattern: normalizedText(rawLift.pattern) || libraryItem?.category || "Resistance training",
          target: normalizedText(rawLift.target) || libraryItem?.muscleBias[0]?.muscle || undefined,
          sets,
          reps: normalizeRepRange(rawLift.reps ?? rawLift.repRange ?? rawLift.plannedReps),
        } satisfies MigratedWorkoutLift,
      ];
    });

    const focus = normalizedText(rawDay.focus) || normalizedText(rawDay.title) || `Training day ${dayIndex + 1}`;
    return [
      {
        id: normalizedText(rawDay.id) || `legacy-day-${dayIndex + 1}`,
        day: normalizedText(rawDay.day) || `Day ${dayIndex + 1}`,
        focus,
        intent: normalizedText(rawDay.intent) || "Imported from an earlier BodyPilot training plan.",
        lifts,
      } satisfies MigratedSplitDay,
    ];
  });

  return days.length > 0 ? days : null;
};

const parseNumberList = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => numberWithin(item, 0, 0, 10_000));
  if (typeof value === "number") return [Math.max(0, value)];
  if (typeof value !== "string") return [];
  return (value.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number).filter(Number.isFinite).map((item) => Math.max(0, item));
};

const parseIso = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
};

const weekForDate = (completedAt: string, mesoStartedAt: string) => {
  const completed = new Date(completedAt).getTime();
  const started = new Date(mesoStartedAt).getTime();
  if (!Number.isFinite(completed) || !Number.isFinite(started)) return 1;
  return Math.min(12, Math.max(1, Math.floor((completed - started) / (7 * 86_400_000)) + 1));
};

const topSetFor = (sets: Array<{ weight: number; reps: number; rir: number }>) =>
  sets.reduce<(typeof sets)[number] | null>((best, setItem) => {
    const estimate = setItem.weight > 0 ? setItem.weight * (1 + setItem.reps / 30) : setItem.reps;
    if (!best) return setItem;
    const bestEstimate = best.weight > 0 ? best.weight * (1 + best.reps / 30) : best.reps;
    return estimate > bestEstimate ? setItem : best;
  }, null);

/** Converts completed legacy TrackerDay rows into the current per-lift history. */
export const migrateLegacyTrackerDays = (
  value: unknown,
  mesocycleId: string,
  mesoStartedAt: string,
  catalog: readonly MigrationExerciseCatalogItem[] = []
): MigratedHistoryEntry[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((dayValue, dayIndex) => {
    const rawDay = asRecord(dayValue);
    if (!rawDay || !Array.isArray(rawDay.lifts)) return [];
    const fallbackDate = new Date(Date.now() - (value.length - dayIndex) * 86_400_000).toISOString();
    const completedAt = parseIso(rawDay.closedAt ?? rawDay.date, fallbackDate);
    const dayId = normalizedText(rawDay.id) || `legacy-tracker-${slug(normalizedText(rawDay.date), String(dayIndex + 1))}`;
    const sessionKey = `${mesocycleId}:${weekForDate(completedAt, mesoStartedAt)}:${dayId}`;

    return rawDay.lifts.flatMap((liftValue, liftIndex) => {
      const rawLift = asRecord(liftValue);
      if (!rawLift) return [];
      const name = normalizedText(rawLift.name) || labelFromId(normalizedText(rawLift.exerciseId));
      if (!name) return [];
      const completed = Boolean(rawLift.completed) || normalizedText(rawLift.actualReps).length > 0;
      if (!completed) return [];

      const reps = parseNumberList(rawLift.actualReps);
      const weights = parseNumberList(rawLift.weight);
      const setCount = Math.max(
        1,
        Math.round(numberWithin(rawLift.actualSets, Math.max(reps.length, weights.length, 1), 1, 20))
      );
      const rpeValues = parseNumberList(rawLift.rpe);
      const sets = Array.from({ length: setCount }, (_, setIndex) => ({
        weight: weights[setIndex] ?? weights[weights.length - 1] ?? 0,
        reps: Math.round(reps[setIndex] ?? reps[reps.length - 1] ?? 0),
        rir: Math.min(4, Math.max(0, 10 - (rpeValues[setIndex] ?? rpeValues[rpeValues.length - 1] ?? 8))),
      })).filter((setItem) => setItem.reps > 0);
      if (sets.length === 0) return [];

      const libraryItem = findLibraryItem(catalog, normalizedText(rawLift.exerciseId), name);
      const muscleGroup = muscleFromLibraryItem(libraryItem, name);
      const topSet = topSetFor(sets);
      const weekNumber = weekForDate(completedAt, mesoStartedAt);

      return [
        {
          id: `legacy-${slug(dayId, String(dayIndex))}-${slug(normalizedText(rawLift.id) || name, String(liftIndex))}`,
          completedAt,
          mesocycleId,
          weekNumber,
          sessionKey,
          dayId,
          dayFocus: normalizedText(rawDay.title) || "Imported workout",
          liftId: normalizedText(rawLift.id) || normalizedText(rawLift.exerciseId) || `legacy-lift-${liftIndex}`,
          liftName: name,
          muscleGroup,
          sets,
          topSet,
          estimatedOneRepMax: topSet?.weight
            ? Math.round(topSet.weight * (1 + topSet.reps / 30))
            : 0,
          totalVolume: sets.reduce((total, setItem) => total + setItem.weight * setItem.reps, 0),
          sessionStartedAt: parseIso(rawDay.date, completedAt),
          source: "legacy-tracker",
        } satisfies MigratedHistoryEntry,
      ];
    });
  });
};

export const mergeHistoryWithoutDuplicates = <T extends { id: string; sessionKey: string; liftName: string }>(
  primary: T[],
  migrated: T[]
) => {
  const seen = new Set(primary.map((entry) => `${entry.id}|${entry.sessionKey}|${entry.liftName.toLowerCase()}`));
  return [
    ...primary,
    ...migrated.filter((entry) => {
      const key = `${entry.id}|${entry.sessionKey}|${entry.liftName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
};
