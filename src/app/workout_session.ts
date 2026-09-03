export const WORKOUT_SESSION_SCHEMA_VERSION = 1 as const;

export type WorkoutSessionStatus = "active" | "paused" | "completed";
export type WorkoutSetType = "warmup" | "working" | "drop" | "myorep" | "other";
export type FeedbackScope = "exercise" | "muscle" | "session";
export type FeedbackLimitation = "target" | "supporting" | "conditioning" | "joint" | "focus";
export type VolumeAdjustment = "auto" | "add" | "hold";

export type RepRangeSnapshot = Readonly<{
  low: number;
  high: number;
}>;

export type PreviousSetSnapshot = Readonly<{
  weight: number;
  reps: number;
  rir: number;
}>;

export type FrozenSetPrescription = Readonly<{
  id: string;
  position: number;
  setType: WorkoutSetType;
  recommendedWeight: number | null;
  recommendedReps: number;
  recommendationReason?: string;
  repRange: RepRangeSnapshot;
  targetRir: number;
  previousResult: PreviousSetSnapshot | null;
}>;

export type FrozenExerciseSlot = Readonly<{
  id: string;
  exerciseId: string;
  position: number;
  name: string;
  muscleGroup: string;
  pattern: string;
  target?: string;
  notes?: string;
  loadRequired: boolean;
  prescriptions: readonly FrozenSetPrescription[];
}>;

/** Matches the existing App.tsx WorkoutSetLog fields. */
export type WorkoutSetLogCompatible = {
  id: string;
  weight: number;
  reps: number;
  rir: number;
  done: boolean;
  skipped?: boolean;
};

export type SessionSetLog = Readonly<
  WorkoutSetLogCompatible & {
    skipped: boolean;
    updatedAt: string;
    completedAt: string | null;
  }
>;

export type SessionFeedbackRecord = Readonly<{
  id: string;
  scope: FeedbackScope;
  exerciseSlotId?: string;
  muscleGroup?: string;
  stimulus?: number;
  pump?: number;
  soreness?: number;
  workload?: number;
  technique?: number;
  limitation?: FeedbackLimitation;
  jointPain?: number;
  moreSets?: boolean;
  volumeAdjustment?: VolumeAdjustment;
  notes?: string;
  recordedAt: string;
  updatedAt: string;
}>;

export type WorkoutSession = Readonly<{
  schemaVersion: typeof WORKOUT_SESSION_SCHEMA_VERSION;
  revision: number;
  id: string;
  sessionKey: string;
  mesocycleId: string;
  weekNumber: number;
  dayId: string;
  dayLabel: string;
  workoutName: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  updatedAt: string;
  pausedAt: string | null;
  pausedDurationSec: number;
  completedAt: string | null;
  exercises: readonly FrozenExerciseSlot[];
  setLogs: Readonly<Record<string, SessionSetLog>>;
  feedbackRecords: readonly SessionFeedbackRecord[];
}>;

export type SetPrescriptionInput = {
  id?: string;
  setType?: WorkoutSetType | string;
  recommendedWeight?: number | null;
  recommendedReps?: number;
  recommendationReason?: string;
  reps?: string;
  repRange?: Partial<RepRangeSnapshot>;
  targetRir?: number;
  previousResult?: Partial<PreviousSetSnapshot> | null;
};

/**
 * Accepts the current WorkoutLift shape (`id`, `sets`, `reps`) while allowing
 * richer prescriptions when the program builder has them.
 */
export type ExerciseSlotInput = {
  id: string;
  slotId?: string;
  exerciseId?: string;
  name: string;
  muscleGroup: string;
  pattern?: string;
  target?: string;
  notes?: string;
  loadRequired?: boolean;
  sets: number | readonly SetPrescriptionInput[];
  reps?: string;
  targetRir?: number;
  recommendedWeight?: number | null;
};

export type StartWorkoutSessionInput = {
  id?: string;
  mesocycleId: string;
  weekNumber: number;
  dayId: string;
  dayLabel?: string;
  workoutName?: string;
  targetRir?: number;
  exercises: readonly ExerciseSlotInput[];
};

export type WorkoutSetPatch = Partial<Pick<WorkoutSetLogCompatible, "weight" | "reps" | "rir" | "done" | "skipped">>;

export type SessionFeedbackInput = Omit<
  Partial<SessionFeedbackRecord>,
  "recordedAt" | "updatedAt"
> & {
  scope: FeedbackScope;
};

export type WorkoutCompletionValidation = Readonly<{
  totalSets: number;
  resolvedSets: number;
  productiveSets: number;
  incompleteSetIds: readonly string[];
  invalidCompletedSetIds: readonly string[];
  progressPercent: number;
  canComplete: boolean;
  canCompleteBySkipping: boolean;
}>;

export type FinishWorkoutSessionOptions = {
  now: string;
  skipIncomplete?: boolean;
};

export type FinishWorkoutSessionResult = Readonly<{
  session: WorkoutSession;
  completed: boolean;
  validation: WorkoutCompletionValidation;
}>;

export type NormalizeWorkoutSessionOptions = {
  now: string;
  fallback?: Partial<Omit<StartWorkoutSessionInput, "exercises">> & {
    exercises?: readonly ExerciseSlotInput[];
  };
};

export type LegacyWorkoutSessionMigrationInput = StartWorkoutSessionInput & {
  workoutLog: unknown;
  workoutPaused?: boolean;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  feedback?: unknown;
};

const MAX_WEEK_NUMBER = 52;
const MAX_SETS_PER_EXERCISE = 20;
const MAX_LOAD = 100_000;
const MAX_REPS = 999;
const RESERVED_IDS = new Set(["__proto__", "constructor", "prototype"]);

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const hasOwn = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);

const finiteNumber = (value: unknown, fallback: number, minimum: number, maximum: number) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? clamp(number, minimum, maximum) : fallback;
};

const integer = (value: unknown, fallback: number, minimum: number, maximum: number) =>
  Math.round(finiteNumber(value, fallback, minimum, maximum));

const safeText = (value: unknown, fallback = "", maximumLength = 240) => {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, maximumLength);
};

const safeId = (value: unknown, fallback: string) => {
  const id = safeText(value, fallback, 200);
  return RESERVED_IDS.has(id) ? `id-${id}` : id;
};

const isoTimestamp = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const requiredTimestamp = (value: unknown, label = "now") => {
  const timestamp = isoTimestamp(value);
  if (!timestamp) throw new RangeError(`${label} must be a valid date or ISO timestamp.`);
  return timestamp;
};

const latestTimestamp = (...values: Array<string | null | undefined>) => {
  const timestamps = values.filter((value): value is string => Boolean(value)).sort();
  return timestamps[timestamps.length - 1] ?? new Date(0).toISOString();
};

const transitionTimestamp = (session: WorkoutSession, now: string) =>
  latestTimestamp(session.startedAt, session.updatedAt, requiredTimestamp(now));

const parseRepRange = (value: unknown): RepRangeSnapshot => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const low = integer(record.low, 8, 1, MAX_REPS);
    const high = integer(record.high, low, low, MAX_REPS);
    return Object.freeze({ low, high });
  }

  const values = typeof value === "string" ? value.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [] : [];
  const low = integer(values[0], 8, 1, MAX_REPS);
  const high = integer(values[1], low, low, MAX_REPS);
  return Object.freeze({ low, high });
};

const workoutSetType = (value: unknown): WorkoutSetType => {
  if (value === "warmup" || value === "drop" || value === "myorep" || value === "other") return value;
  return "working";
};

const feedbackScope = (value: unknown): FeedbackScope => {
  if (value === "exercise" || value === "muscle") return value;
  return "session";
};

const feedbackLimitation = (value: unknown): FeedbackLimitation | undefined => {
  if (
    value === "target" ||
    value === "supporting" ||
    value === "conditioning" ||
    value === "joint" ||
    value === "focus"
  ) {
    return value;
  }
  return undefined;
};

const volumeAdjustment = (value: unknown): VolumeAdjustment | undefined => {
  if (value === "auto" || value === "add" || value === "hold") return value;
  return undefined;
};

const defaultLoadRequired = (name: string, pattern: string) =>
  !/bodyweight|push-up|pull-up/i.test(`${pattern} ${name}`);

const uniqueId = (candidate: string, used: Set<string>) => {
  let id = candidate;
  let suffix = 2;
  while (used.has(id)) {
    id = `${candidate}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
};

const freezePrescription = (prescription: FrozenSetPrescription): FrozenSetPrescription => {
  if (prescription.previousResult) Object.freeze(prescription.previousResult);
  Object.freeze(prescription.repRange);
  return Object.freeze(prescription);
};

const snapshotExerciseSlots = (
  exercises: readonly ExerciseSlotInput[],
  fallbackTargetRir: number
): readonly FrozenExerciseSlot[] => {
  const usedSlotIds = new Set<string>();
  const usedSetIds = new Set<string>();

  const slots = exercises.slice(0, 100).map((exercise, exerciseIndex) => {
    const exerciseId = safeId(exercise.exerciseId ?? exercise.id, `exercise-${exerciseIndex + 1}`);
    const slotId = uniqueId(
      safeId(exercise.slotId ?? exercise.id, `slot-${exerciseIndex + 1}`),
      usedSlotIds
    );
    const name = safeText(exercise.name, `Exercise ${exerciseIndex + 1}`);
    const pattern = safeText(exercise.pattern, "Other");
    const exerciseRepRange = parseRepRange(exercise.reps);
    const exerciseTargetRir = finiteNumber(exercise.targetRir, fallbackTargetRir, 0, 5);
    const requestedSets = Array.isArray(exercise.sets)
      ? exercise.sets
      : Array.from({ length: integer(exercise.sets, 1, 1, MAX_SETS_PER_EXERCISE) }, () => ({}));
    const setInputs = requestedSets.length > 0 ? requestedSets.slice(0, MAX_SETS_PER_EXERCISE) : [{}];

    const prescriptions = setInputs.map((setInput, setIndex) => {
      const repRange = setInput.repRange
        ? parseRepRange(setInput.repRange)
        : parseRepRange(setInput.reps ?? exercise.reps ?? exerciseRepRange);
      const rawPrevious = asRecord(setInput.previousResult);
      const previousResult = rawPrevious
        ? Object.freeze({
            weight: finiteNumber(rawPrevious.weight, 0, 0, MAX_LOAD),
            reps: integer(rawPrevious.reps, 0, 0, MAX_REPS),
            rir: finiteNumber(rawPrevious.rir, exerciseTargetRir, 0, 5),
          })
        : null;
      const prescriptionId = uniqueId(
        safeId(setInput.id, `${slotId}-set-${setIndex + 1}`),
        usedSetIds
      );
      const recommendedWeightValue = setInput.recommendedWeight ?? exercise.recommendedWeight;
      const recommendedWeight =
        recommendedWeightValue === null || recommendedWeightValue === undefined
          ? null
          : finiteNumber(recommendedWeightValue, 0, 0, MAX_LOAD);

      return freezePrescription({
        id: prescriptionId,
        position: setIndex,
        setType: workoutSetType(setInput.setType),
        recommendedWeight,
        recommendedReps: integer(setInput.recommendedReps, repRange.low, repRange.low, repRange.high),
        recommendationReason: safeText(setInput.recommendationReason, "", 240) || undefined,
        repRange,
        targetRir: finiteNumber(setInput.targetRir, exerciseTargetRir, 0, 5),
        previousResult,
      });
    });

    return Object.freeze({
      id: slotId,
      exerciseId,
      position: exerciseIndex,
      name,
      muscleGroup: safeText(exercise.muscleGroup, "other", 80),
      pattern,
      target: safeText(exercise.target, "", 160) || undefined,
      notes: safeText(exercise.notes, "", 2_000) || undefined,
      loadRequired:
        typeof exercise.loadRequired === "boolean"
          ? exercise.loadRequired
          : defaultLoadRequired(name, pattern),
      prescriptions: Object.freeze(prescriptions),
    });
  });

  return Object.freeze(slots);
};

const freezeSetLog = (setLog: SessionSetLog) => Object.freeze(setLog);

const defaultSetLogs = (exercises: readonly FrozenExerciseSlot[], now: string) => {
  const logs: Record<string, SessionSetLog> = Object.create(null) as Record<string, SessionSetLog>;
  exercises.forEach((exercise) => {
    exercise.prescriptions.forEach((prescription) => {
      logs[prescription.id] = freezeSetLog({
        id: prescription.id,
        weight: 0,
        reps: prescription.repRange.low,
        rir: prescription.targetRir,
        done: false,
        skipped: false,
        updatedAt: now,
        completedAt: null,
      });
    });
  });
  return Object.freeze(logs);
};

const freezeFeedbackRecords = (records: readonly SessionFeedbackRecord[]) =>
  Object.freeze(records.map((record) => Object.freeze({ ...record })));

const freezeSetLogRecord = (logs: Readonly<Record<string, SessionSetLog>>) =>
  Object.freeze(Object.assign(Object.create(null) as Record<string, SessionSetLog>, logs));

const sealSession = (session: WorkoutSession): WorkoutSession =>
  Object.freeze({
    ...session,
    exercises: Object.isFrozen(session.exercises) ? session.exercises : Object.freeze([...session.exercises]),
    setLogs: Object.isFrozen(session.setLogs) ? session.setLogs : freezeSetLogRecord(session.setLogs),
    feedbackRecords: Object.isFrozen(session.feedbackRecords)
      ? session.feedbackRecords
      : freezeFeedbackRecords(session.feedbackRecords),
  });

export const createWorkoutSessionKey = (mesocycleId: string, weekNumber: number, dayId: string) =>
  `${safeId(mesocycleId, "mesocycle")}:${integer(weekNumber, 1, 1, MAX_WEEK_NUMBER)}:${safeId(dayId, "day")}`;

export const createWorkoutSessionId = (mesocycleId: string, weekNumber: number, dayId: string) =>
  `workout-session:${createWorkoutSessionKey(mesocycleId, weekNumber, dayId)}`;

export const startWorkoutSession = (input: StartWorkoutSessionInput, now: string): WorkoutSession => {
  const startedAt = requiredTimestamp(now);
  const mesocycleId = safeId(input.mesocycleId, "mesocycle");
  const weekNumber = integer(input.weekNumber, 1, 1, MAX_WEEK_NUMBER);
  const dayId = safeId(input.dayId, "day");
  const sessionKey = createWorkoutSessionKey(mesocycleId, weekNumber, dayId);
  const exercises = snapshotExerciseSlots(input.exercises, finiteNumber(input.targetRir, 2, 0, 5));

  if (exercises.length === 0) throw new RangeError("A workout session requires at least one exercise.");

  return sealSession({
    schemaVersion: WORKOUT_SESSION_SCHEMA_VERSION,
    revision: 0,
    id: safeId(input.id, createWorkoutSessionId(mesocycleId, weekNumber, dayId)),
    sessionKey,
    mesocycleId,
    weekNumber,
    dayId,
    dayLabel: safeText(input.dayLabel, dayId),
    workoutName: safeText(input.workoutName, input.dayLabel || "Workout"),
    status: "active",
    startedAt,
    updatedAt: startedAt,
    pausedAt: null,
    pausedDurationSec: 0,
    completedAt: null,
    exercises,
    setLogs: defaultSetLogs(exercises, startedAt),
    feedbackRecords: Object.freeze([]),
  });
};

const transitionSession = (
  session: WorkoutSession,
  updates: Partial<Pick<WorkoutSession, "status" | "updatedAt" | "pausedAt" | "pausedDurationSec" | "completedAt" | "setLogs" | "feedbackRecords">>
) =>
  sealSession({
    ...session,
    ...updates,
    revision: session.revision + 1,
  });

export const pauseWorkoutSession = (session: WorkoutSession, now: string): WorkoutSession => {
  if (session.status !== "active") return session;
  const timestamp = transitionTimestamp(session, now);
  return transitionSession(session, { status: "paused", pausedAt: timestamp, updatedAt: timestamp });
};

export const resumeWorkoutSession = (session: WorkoutSession, now: string): WorkoutSession => {
  if (session.status !== "paused") return session;
  const timestamp = transitionTimestamp(session, now);
  const pauseStartedAt = session.pausedAt ? new Date(session.pausedAt).getTime() : new Date(timestamp).getTime();
  const pausedDurationSec = session.pausedDurationSec + Math.max(0, Math.round((new Date(timestamp).getTime() - pauseStartedAt) / 1000));
  return transitionSession(session, { status: "active", pausedAt: null, pausedDurationSec, updatedAt: timestamp });
};

const normalizeSetLog = (
  value: unknown,
  prescription: FrozenSetPrescription,
  fallbackUpdatedAt: string,
  forceCompletedAt: string | null = null
): SessionSetLog => {
  const raw = asRecord(value) ?? {};
  const skipped = Boolean(raw.skipped);
  const done = Boolean(raw.done) || skipped || Boolean(forceCompletedAt);
  const updatedAt = latestTimestamp(
    fallbackUpdatedAt,
    isoTimestamp(raw.updatedAt),
    isoTimestamp(raw.completedAt),
    forceCompletedAt
  );
  const completedAt = done
    ? isoTimestamp(raw.completedAt) ?? forceCompletedAt ?? updatedAt
    : null;
  const legacyRpe = typeof raw.rpe === "number" ? 10 - raw.rpe : undefined;

  return freezeSetLog({
    id: prescription.id,
    weight: finiteNumber(raw.weight, 0, 0, MAX_LOAD),
    reps: integer(raw.reps, prescription.repRange.low, 0, MAX_REPS),
    rir: finiteNumber(raw.rir ?? legacyRpe, prescription.targetRir, 0, 5),
    done,
    skipped: forceCompletedAt && !Boolean(raw.done) ? true : skipped,
    updatedAt,
    completedAt,
  });
};

export const updateWorkoutSet = (
  session: WorkoutSession,
  setId: string,
  patch: WorkoutSetPatch,
  now: string
): WorkoutSession => {
  if (session.status === "completed" || !hasOwn(session.setLogs, setId)) return session;
  if (!["weight", "reps", "rir", "done", "skipped"].some((key) => hasOwn(patch, key))) return session;
  const timestamp = transitionTimestamp(session, now);
  const current = session.setLogs[setId];
  const nextSkipped = patch.skipped === undefined ? current.skipped : Boolean(patch.skipped);
  let nextDone = patch.done === undefined ? current.done : Boolean(patch.done);
  if (nextSkipped) nextDone = true;
  if (patch.done === false) nextDone = false;
  const skipped = nextDone ? nextSkipped : false;
  const completedAt = nextDone ? current.completedAt ?? timestamp : null;
  const nextLog = freezeSetLog({
    ...current,
    weight: finiteNumber(patch.weight, current.weight, 0, MAX_LOAD),
    reps: integer(patch.reps, current.reps, 0, MAX_REPS),
    rir: finiteNumber(patch.rir, current.rir, 0, 5),
    done: nextDone,
    skipped,
    updatedAt: timestamp,
    completedAt,
  });

  return transitionSession(session, {
    updatedAt: timestamp,
    setLogs: Object.freeze({ ...session.setLogs, [setId]: nextLog }),
  });
};

export const skipWorkoutSet = (session: WorkoutSession, setId: string, now: string) =>
  updateWorkoutSet(session, setId, { done: true, skipped: true }, now);

export const addWorkoutSet = (
  session: WorkoutSession,
  exerciseSlotId: string,
  now: string,
  input: SetPrescriptionInput = {}
): WorkoutSession => {
  if (session.status === "completed") return session;
  const exerciseIndex = session.exercises.findIndex((exercise) => exercise.id === exerciseSlotId);
  if (exerciseIndex < 0) return session;
  const exercise = session.exercises[exerciseIndex];
  if (exercise.prescriptions.length >= MAX_SETS_PER_EXERCISE) return session;
  const timestamp = transitionTimestamp(session, now);
  const usedSetIds = new Set(Object.keys(session.setLogs));
  const last = exercise.prescriptions[exercise.prescriptions.length - 1];
  const id = uniqueId(
    safeId(input.id, `${exercise.id}-set-${exercise.prescriptions.length + 1}`),
    usedSetIds
  );
  const prescription = freezePrescription({
    id,
    position: exercise.prescriptions.length,
    setType: workoutSetType(input.setType ?? last?.setType),
    recommendedWeight:
      input.recommendedWeight === undefined
        ? last?.recommendedWeight ?? null
        : input.recommendedWeight === null
          ? null
          : finiteNumber(input.recommendedWeight, 0, 0, MAX_LOAD),
    recommendedReps: integer(
      input.recommendedReps,
      last?.recommendedReps ?? parseRepRange(input.repRange ?? input.reps ?? last?.repRange).low,
      1,
      MAX_REPS
    ),
    recommendationReason:
      safeText(input.recommendationReason, last?.recommendationReason ?? "", 240) || undefined,
    repRange: parseRepRange(input.repRange ?? input.reps ?? last?.repRange),
    targetRir: finiteNumber(input.targetRir, last?.targetRir ?? 2, 0, 5),
    previousResult: input.previousResult
      ? Object.freeze({
          weight: finiteNumber(input.previousResult.weight, 0, 0, MAX_LOAD),
          reps: integer(input.previousResult.reps, 0, 0, MAX_REPS),
          rir: finiteNumber(input.previousResult.rir, last?.targetRir ?? 2, 0, 5),
        })
      : last?.previousResult ?? null,
  });
  const nextExercise = Object.freeze({
    ...exercise,
    prescriptions: Object.freeze([...exercise.prescriptions, prescription]),
  });
  const exercises = session.exercises.map((item, index) => (index === exerciseIndex ? nextExercise : item));
  const setLog = freezeSetLog({
    id,
    weight: 0,
    reps: prescription.repRange.low,
    rir: prescription.targetRir,
    done: false,
    skipped: false,
    updatedAt: timestamp,
    completedAt: null,
  });
  return sealSession({
    ...session,
    revision: session.revision + 1,
    updatedAt: timestamp,
    exercises: Object.freeze(exercises),
    setLogs: freezeSetLogRecord({ ...session.setLogs, [id]: setLog }),
  });
};

export const addWorkoutExercise = (
  session: WorkoutSession,
  exercise: ExerciseSlotInput,
  now: string
): WorkoutSession => {
  if (session.status === "completed" || session.exercises.length >= 100) return session;
  const timestamp = transitionTimestamp(session, now);
  const usedSlotIds = new Set(session.exercises.map((item) => item.id));
  const slotId = uniqueId(safeId(exercise.slotId ?? exercise.id, `slot-${session.exercises.length + 1}`), usedSlotIds);
  const [snapshot] = snapshotExerciseSlots(
    [{ ...exercise, id: slotId, slotId }],
    finiteNumber(exercise.targetRir, 2, 0, 5)
  );
  if (!snapshot) return session;
  const positioned = Object.freeze({ ...snapshot, position: session.exercises.length });
  const setLogs = { ...session.setLogs, ...defaultSetLogs([positioned], timestamp) };
  return sealSession({
    ...session,
    revision: session.revision + 1,
    updatedAt: timestamp,
    exercises: Object.freeze([...session.exercises, positioned]),
    setLogs: freezeSetLogRecord(setLogs),
  });
};

export const removeWorkoutSet = (session: WorkoutSession, setId: string, now: string): WorkoutSession => {
  if (session.status === "completed" || !hasOwn(session.setLogs, setId)) return session;
  const exerciseIndex = session.exercises.findIndex((exercise) =>
    exercise.prescriptions.some((prescription) => prescription.id === setId)
  );
  if (exerciseIndex < 0) return session;
  const exercise = session.exercises[exerciseIndex];
  if (exercise.prescriptions.length <= 1) return session;
  const timestamp = transitionTimestamp(session, now);
  const prescriptions = exercise.prescriptions
    .filter((prescription) => prescription.id !== setId)
    .map((prescription, index) => freezePrescription({ ...prescription, position: index }));
  const nextExercise = Object.freeze({ ...exercise, prescriptions: Object.freeze(prescriptions) });
  const exercises = session.exercises.map((item, index) => (index === exerciseIndex ? nextExercise : item));
  const setLogs = { ...session.setLogs };
  delete setLogs[setId];
  return sealSession({
    ...session,
    revision: session.revision + 1,
    updatedAt: timestamp,
    exercises: Object.freeze(exercises),
    setLogs: freezeSetLogRecord(setLogs),
  });
};

export const replaceWorkoutExercise = (
  session: WorkoutSession,
  exerciseSlotId: string,
  updates: Partial<Pick<ExerciseSlotInput, "exerciseId" | "name" | "muscleGroup" | "pattern" | "target" | "notes" | "loadRequired">>,
  now: string,
  options: { preserveProgression?: boolean } = {}
): WorkoutSession => {
  if (session.status === "completed") return session;
  const exerciseIndex = session.exercises.findIndex((exercise) => exercise.id === exerciseSlotId);
  if (exerciseIndex < 0) return session;
  const timestamp = transitionTimestamp(session, now);
  const current = session.exercises[exerciseIndex];
  const name = safeText(updates.name, current.name);
  const pattern = safeText(updates.pattern, current.pattern);
  const preserveProgression = options.preserveProgression !== false;
  const prescriptions = preserveProgression
    ? current.prescriptions
    : Object.freeze(
        current.prescriptions.map((prescription) =>
          freezePrescription({
            ...prescription,
            recommendedWeight: null,
            recommendedReps: prescription.repRange.low,
            recommendationReason: "Start fresh for this exercise.",
            previousResult: null,
          })
        )
      );
  const nextExercise = Object.freeze({
    ...current,
    exerciseId: safeId(updates.exerciseId, current.exerciseId),
    name,
    muscleGroup: safeText(updates.muscleGroup, current.muscleGroup, 80),
    pattern,
    target: safeText(updates.target, current.target ?? "", 160) || undefined,
    notes: safeText(updates.notes, current.notes ?? "", 2_000) || undefined,
    loadRequired:
      typeof updates.loadRequired === "boolean" ? updates.loadRequired : defaultLoadRequired(name, pattern),
    prescriptions,
  });
  const exercises = session.exercises.map((item, index) => (index === exerciseIndex ? nextExercise : item));
  const setLogs = preserveProgression
    ? session.setLogs
    : freezeSetLogRecord({
        ...session.setLogs,
        ...Object.fromEntries(
          prescriptions.map((prescription) => [
            prescription.id,
            freezeSetLog({
              id: prescription.id,
              weight: 0,
              reps: prescription.repRange.low,
              rir: prescription.targetRir,
              done: false,
              skipped: false,
              updatedAt: timestamp,
              completedAt: null,
            }),
          ])
        ),
      });
  return sealSession({
    ...session,
    revision: session.revision + 1,
    updatedAt: timestamp,
    exercises: Object.freeze(exercises),
    setLogs,
    feedbackRecords: preserveProgression
      ? session.feedbackRecords
      : freezeFeedbackRecords(
          session.feedbackRecords.filter(
            (record) => !(record.scope === "exercise" && record.exerciseSlotId === exerciseSlotId)
          )
        ),
  });
};

export const moveWorkoutExercise = (
  session: WorkoutSession,
  exerciseSlotId: string,
  direction: -1 | 1,
  now: string
): WorkoutSession => {
  if (session.status === "completed") return session;
  const currentIndex = session.exercises.findIndex((exercise) => exercise.id === exerciseSlotId);
  const nextIndex = clamp(currentIndex + direction, 0, session.exercises.length - 1);
  if (currentIndex < 0 || currentIndex === nextIndex) return session;
  const timestamp = transitionTimestamp(session, now);
  const ordered = [...session.exercises];
  const [moved] = ordered.splice(currentIndex, 1);
  ordered.splice(nextIndex, 0, moved);
  const exercises = ordered.map((exercise, position) => Object.freeze({ ...exercise, position }));
  return sealSession({
    ...session,
    revision: session.revision + 1,
    updatedAt: timestamp,
    exercises: Object.freeze(exercises),
  });
};

const normalizedFeedbackMetric = (value: unknown, minimum = 0) =>
  value === undefined ? undefined : finiteNumber(value, minimum, minimum, 4);

const normalizeFeedbackRecord = (
  value: unknown,
  index: number,
  fallbackTimestamp: string,
  fallbackScope?: FeedbackScope,
  fallbackMuscleGroup?: string
): SessionFeedbackRecord | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const scope = fallbackScope ?? feedbackScope(raw.scope);
  const exerciseSlotId = safeText(raw.exerciseSlotId, "", 200) || undefined;
  const muscleGroup = safeText(raw.muscleGroup, fallbackMuscleGroup ?? "", 80) || undefined;
  const targetId = scope === "exercise" ? exerciseSlotId : scope === "muscle" ? muscleGroup : "session";
  if (!targetId) return null;
  const recordedAt = isoTimestamp(raw.recordedAt) ?? fallbackTimestamp;
  const updatedAt = latestTimestamp(recordedAt, isoTimestamp(raw.updatedAt));
  const limitation = feedbackLimitation(raw.limitation);
  const adjustment = volumeAdjustment(raw.volumeAdjustment) ?? (raw.moreSets ? "add" : undefined);

  return Object.freeze({
    id: safeId(raw.id, `feedback:${scope}:${targetId || index + 1}`),
    scope,
    exerciseSlotId,
    muscleGroup,
    stimulus: normalizedFeedbackMetric(raw.stimulus),
    pump: normalizedFeedbackMetric(raw.pump),
    soreness: normalizedFeedbackMetric(raw.soreness),
    workload: normalizedFeedbackMetric(raw.workload, 1),
    technique: normalizedFeedbackMetric(raw.technique),
    limitation,
    jointPain: normalizedFeedbackMetric(raw.jointPain),
    moreSets: raw.moreSets === undefined ? undefined : Boolean(raw.moreSets),
    volumeAdjustment: adjustment,
    notes: safeText(raw.notes, "", 2_000) || undefined,
    recordedAt,
    updatedAt,
  });
};

const normalizeFeedbackRecords = (value: unknown, fallbackTimestamp: string) => {
  const records: SessionFeedbackRecord[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const record = normalizeFeedbackRecord(item, index, fallbackTimestamp);
      if (record) records.push(record);
    });
  } else {
    const feedbackMap = asRecord(value);
    if (feedbackMap) {
      Object.entries(feedbackMap).forEach(([muscleGroup, item], index) => {
        const record = normalizeFeedbackRecord(item, index, fallbackTimestamp, "muscle", muscleGroup);
        if (record) records.push(record);
      });
    }
  }

  const deduplicated = new Map(records.map((record) => [record.id, record]));
  return freezeFeedbackRecords([...deduplicated.values()]);
};

export const upsertSessionFeedback = (
  session: WorkoutSession,
  input: SessionFeedbackInput,
  now: string
): WorkoutSession => {
  if (session.status === "completed") return session;
  const timestamp = transitionTimestamp(session, now);
  const scope = feedbackScope(input.scope);
  const exerciseSlotId = safeText(input.exerciseSlotId, "", 200) || undefined;
  const muscleGroup = safeText(input.muscleGroup, "", 80) || undefined;
  const targetId = scope === "exercise" ? exerciseSlotId : scope === "muscle" ? muscleGroup : "session";
  if (!targetId) return session;
  if (scope === "exercise" && !session.exercises.some((exercise) => exercise.id === exerciseSlotId)) return session;
  const id = safeId(input.id, `feedback:${scope}:${targetId}`);
  const existing = session.feedbackRecords.find((record) => record.id === id);
  const normalized = normalizeFeedbackRecord(
    {
      ...existing,
      ...input,
      id,
      scope,
      exerciseSlotId,
      muscleGroup,
      recordedAt: existing?.recordedAt ?? timestamp,
      updatedAt: timestamp,
    },
    session.feedbackRecords.length,
    timestamp
  );
  if (!normalized) return session;
  const records = existing
    ? session.feedbackRecords.map((record) => (record.id === id ? normalized : record))
    : [...session.feedbackRecords, normalized];

  return transitionSession(session, {
    updatedAt: timestamp,
    feedbackRecords: freezeFeedbackRecords(records),
  });
};

const prescriptionIndex = (session: WorkoutSession) => {
  const result = new Map<string, FrozenExerciseSlot>();
  session.exercises.forEach((exercise) => {
    exercise.prescriptions.forEach((prescription) => result.set(prescription.id, exercise));
  });
  return result;
};

export const validateWorkoutSessionCompletion = (session: WorkoutSession): WorkoutCompletionValidation => {
  const exerciseBySetId = prescriptionIndex(session);
  const incompleteSetIds: string[] = [];
  const invalidCompletedSetIds: string[] = [];
  let resolvedSets = 0;
  let productiveSets = 0;

  exerciseBySetId.forEach((exercise, setId) => {
    const setLog = session.setLogs[setId];
    if (!setLog || (!setLog.done && !setLog.skipped)) {
      incompleteSetIds.push(setId);
      return;
    }
    resolvedSets += 1;
    if (setLog.skipped) return;

    const validLoad = exercise.loadRequired ? setLog.weight > 0 : setLog.weight >= 0;
    if (!validLoad || setLog.reps <= 0 || !Number.isFinite(setLog.weight) || !Number.isFinite(setLog.reps)) {
      invalidCompletedSetIds.push(setId);
      return;
    }
    productiveSets += 1;
  });

  const totalSets = exerciseBySetId.size;
  const progressPercent = totalSets > 0 ? Math.round((resolvedSets / totalSets) * 100) : 0;
  const canCompleteBySkipping = productiveSets > 0 && invalidCompletedSetIds.length === 0;

  return Object.freeze({
    totalSets,
    resolvedSets,
    productiveSets,
    incompleteSetIds: Object.freeze(incompleteSetIds),
    invalidCompletedSetIds: Object.freeze(invalidCompletedSetIds),
    progressPercent,
    canComplete: canCompleteBySkipping && incompleteSetIds.length === 0,
    canCompleteBySkipping,
  });
};

export const finishWorkoutSession = (
  session: WorkoutSession,
  options: FinishWorkoutSessionOptions
): FinishWorkoutSessionResult => {
  const validation = validateWorkoutSessionCompletion(session);
  if (session.status === "completed") {
    return Object.freeze({ session, completed: true, validation });
  }
  if (!validation.canCompleteBySkipping || (!validation.canComplete && !options.skipIncomplete)) {
    return Object.freeze({ session, completed: false, validation });
  }

  const timestamp = transitionTimestamp(session, options.now);
  const setLogs: Record<string, SessionSetLog> = { ...session.setLogs };
  validation.incompleteSetIds.forEach((setId) => {
    const current = setLogs[setId];
    if (!current) return;
    setLogs[setId] = freezeSetLog({
      ...current,
      done: true,
      skipped: true,
      updatedAt: timestamp,
      completedAt: timestamp,
    });
  });
  const pauseStartedAt = session.status === "paused" && session.pausedAt
    ? new Date(session.pausedAt).getTime()
    : new Date(timestamp).getTime();
  const pausedDurationSec = session.pausedDurationSec +
    (session.status === "paused"
      ? Math.max(0, Math.round((new Date(timestamp).getTime() - pauseStartedAt) / 1000))
      : 0);
  const completedSession = transitionSession(session, {
    status: "completed",
    pausedAt: null,
    pausedDurationSec,
    completedAt: timestamp,
    updatedAt: timestamp,
    setLogs: Object.freeze(setLogs),
  });

  return Object.freeze({
    session: completedSession,
    completed: true,
    validation: validateWorkoutSessionCompletion(completedSession),
  });
};

const exerciseInputsFromUnknown = (
  value: unknown,
  fallback: readonly ExerciseSlotInput[] | undefined
): readonly ExerciseSlotInput[] => {
  if (!Array.isArray(value)) return fallback ?? [];
  return value.map((item, index) => {
    const raw = asRecord(item) ?? {};
    const rawPrescriptions = Array.isArray(raw.prescriptions) ? raw.prescriptions : undefined;
    const rawSets = rawPrescriptions ?? (Array.isArray(raw.sets) || typeof raw.sets === "number" ? raw.sets : 1);
    const sets: number | SetPrescriptionInput[] = Array.isArray(rawSets)
      ? rawSets.map((setItem, setIndex) => {
          const setRaw = asRecord(setItem) ?? {};
          const rangeRaw = asRecord(setRaw.repRange);
          return {
            id: safeId(setRaw.id, `${safeId(raw.id, `slot-${index + 1}`)}-set-${setIndex + 1}`),
            setType: workoutSetType(setRaw.setType),
            recommendedWeight:
              setRaw.recommendedWeight === null || setRaw.recommendedWeight === undefined
                ? null
                : finiteNumber(setRaw.recommendedWeight, 0, 0, MAX_LOAD),
            recommendedReps: integer(setRaw.recommendedReps, rangeRaw ? integer(rangeRaw.low, 8, 1, MAX_REPS) : 8, 1, MAX_REPS),
            recommendationReason: safeText(setRaw.recommendationReason, "", 240) || undefined,
            reps: typeof setRaw.reps === "string" ? setRaw.reps : undefined,
            repRange: rangeRaw
              ? {
                  low: integer(rangeRaw.low, 8, 1, MAX_REPS),
                  high: integer(rangeRaw.high, 8, 1, MAX_REPS),
                }
              : undefined,
            targetRir: finiteNumber(setRaw.targetRir, 2, 0, 5),
            previousResult: asRecord(setRaw.previousResult) as Partial<PreviousSetSnapshot> | null,
          };
        })
      : integer(rawSets, 1, 1, MAX_SETS_PER_EXERCISE);

    return {
      id: safeId(raw.id ?? raw.exerciseId, `exercise-${index + 1}`),
      slotId: safeId(raw.id ?? raw.slotId, `slot-${index + 1}`),
      exerciseId: safeId(raw.exerciseId ?? raw.id, `exercise-${index + 1}`),
      name: safeText(raw.name, `Exercise ${index + 1}`),
      muscleGroup: safeText(raw.muscleGroup, "other", 80),
      pattern: safeText(raw.pattern, "Other"),
      target: safeText(raw.target, "", 160) || undefined,
      notes: safeText(raw.notes, "", 2_000) || undefined,
      loadRequired: typeof raw.loadRequired === "boolean" ? raw.loadRequired : undefined,
      sets,
      reps: typeof raw.reps === "string" ? raw.reps : undefined,
      targetRir: finiteNumber(raw.targetRir, 2, 0, 5),
      recommendedWeight:
        raw.recommendedWeight === null || raw.recommendedWeight === undefined
          ? null
          : finiteNumber(raw.recommendedWeight, 0, 0, MAX_LOAD),
    };
  });
};

const legacySetArrayForExercise = (
  workoutLog: Record<string, unknown>,
  session: Pick<WorkoutSession, "sessionKey" | "weekNumber" | "dayId">,
  exercise: FrozenExerciseSlot
) => {
  const candidates = [
    `${session.sessionKey}:${exercise.exerciseId}`,
    `${session.sessionKey}:${exercise.id}`,
    `${session.weekNumber}:${session.dayId}:${exercise.exerciseId}`,
    `${session.weekNumber}:${session.dayId}:${exercise.id}`,
    exercise.exerciseId,
    exercise.id,
  ];
  for (const key of candidates) {
    if (hasOwn(workoutLog, key) && Array.isArray(workoutLog[key])) return workoutLog[key] as unknown[];
  }
  return [];
};

export const normalizeWorkoutSession = (
  value: unknown,
  options: NormalizeWorkoutSessionOptions
): WorkoutSession | null => {
  const raw = asRecord(value);
  const now = isoTimestamp(options.now);
  if (!raw || !now) return null;
  const fallback = options.fallback;
  const mesocycleId = safeId(raw.mesocycleId ?? fallback?.mesocycleId, "mesocycle");
  const weekNumber = integer(raw.weekNumber ?? fallback?.weekNumber, 1, 1, MAX_WEEK_NUMBER);
  const dayId = safeId(raw.dayId ?? fallback?.dayId, "day");
  const exercises = exerciseInputsFromUnknown(raw.exercises, fallback?.exercises);
  if (exercises.length === 0) return null;
  const startedAt = isoTimestamp(raw.startedAt) ?? now;
  const base = startWorkoutSession(
    {
      id: safeId(raw.id ?? fallback?.id, createWorkoutSessionId(mesocycleId, weekNumber, dayId)),
      mesocycleId,
      weekNumber,
      dayId,
      dayLabel: safeText(raw.dayLabel ?? fallback?.dayLabel, dayId),
      workoutName: safeText(raw.workoutName ?? fallback?.workoutName, "Workout"),
      targetRir: finiteNumber(raw.targetRir ?? fallback?.targetRir, 2, 0, 5),
      exercises,
    },
    startedAt
  );
  const completedAt = isoTimestamp(raw.completedAt);
  const rawStatus: WorkoutSessionStatus =
    raw.status === "completed" || completedAt
      ? "completed"
      : raw.status === "paused" || raw.workoutPaused
        ? "paused"
        : "active";
  const updatedAt = latestTimestamp(startedAt, isoTimestamp(raw.updatedAt), completedAt);
  const pausedAt = rawStatus === "paused" ? isoTimestamp(raw.pausedAt) ?? updatedAt : null;
  const pausedDurationSec = finiteNumber(raw.pausedDurationSec, 0, 0, 31_536_000);
  const directLogs = asRecord(raw.setLogs) ?? {};
  const workoutLog = asRecord(raw.workoutLog) ?? {};
  const setLogs: Record<string, SessionSetLog> = Object.create(null) as Record<string, SessionSetLog>;

  base.exercises.forEach((exercise) => {
    const legacySets = legacySetArrayForExercise(workoutLog, base, exercise);
    exercise.prescriptions.forEach((prescription, setIndex) => {
      const source = hasOwn(directLogs, prescription.id) ? directLogs[prescription.id] : legacySets[setIndex];
      setLogs[prescription.id] = normalizeSetLog(
        source,
        prescription,
        updatedAt,
        rawStatus === "completed" ? completedAt ?? updatedAt : null
      );
    });
  });
  const feedbackRecords = normalizeFeedbackRecords(raw.feedbackRecords ?? raw.feedback, updatedAt);

  return sealSession({
    ...base,
    revision: integer(raw.revision, 0, 0, Number.MAX_SAFE_INTEGER),
    status: rawStatus,
    startedAt,
    updatedAt,
    pausedAt,
    pausedDurationSec,
    completedAt: rawStatus === "completed" ? completedAt ?? updatedAt : null,
    setLogs: Object.freeze(setLogs),
    feedbackRecords,
  });
};

export const migrateLegacyWorkoutSession = (
  input: LegacyWorkoutSessionMigrationInput,
  now: string
): WorkoutSession => {
  const timestamp = requiredTimestamp(now);
  const sessionKey = createWorkoutSessionKey(input.mesocycleId, input.weekNumber, input.dayId);
  const workoutLog = asRecord(input.workoutLog) ?? {};
  const exercises = input.exercises.map((exercise, exerciseIndex) => {
    const exerciseId = safeId(exercise.exerciseId ?? exercise.id, `exercise-${exerciseIndex + 1}`);
    const slotId = safeId(exercise.slotId ?? exercise.id, `slot-${exerciseIndex + 1}`);
    const candidateKeys = [
      `${sessionKey}:${exerciseId}`,
      `${sessionKey}:${slotId}`,
      `${integer(input.weekNumber, 1, 1, MAX_WEEK_NUMBER)}:${safeId(input.dayId, "day")}:${exerciseId}`,
      exerciseId,
      slotId,
    ];
    const legacySets = candidateKeys.map((key) => workoutLog[key]).find(Array.isArray) as unknown[] | undefined;
    if (!legacySets?.length) return exercise;
    const plannedSetInputs = Array.isArray(exercise.sets)
      ? [...exercise.sets]
      : Array.from(
          { length: integer(exercise.sets, 1, 1, MAX_SETS_PER_EXERCISE) },
          () => ({}) as SetPrescriptionInput
        );
    const setCount = Math.min(MAX_SETS_PER_EXERCISE, Math.max(plannedSetInputs.length, legacySets.length));
    const sets = Array.from({ length: setCount }, (_, setIndex) => {
      const planned = plannedSetInputs[setIndex] ?? {};
      const legacy = asRecord(legacySets[setIndex]);
      return {
        ...planned,
        id: safeId(legacy?.id ?? planned.id, `${slotId}-set-${setIndex + 1}`),
        reps: planned.reps ?? exercise.reps,
        targetRir: planned.targetRir ?? exercise.targetRir ?? 2,
      } satisfies SetPrescriptionInput;
    });
    return { ...exercise, sets };
  });
  const normalized = normalizeWorkoutSession(
    {
      schemaVersion: WORKOUT_SESSION_SCHEMA_VERSION,
      id: input.id,
      mesocycleId: input.mesocycleId,
      weekNumber: input.weekNumber,
      dayId: input.dayId,
      dayLabel: input.dayLabel,
      workoutName: input.workoutName,
      targetRir: input.targetRir,
      exercises,
      workoutLog,
      workoutPaused: input.workoutPaused,
      status: input.completedAt ? "completed" : input.workoutPaused ? "paused" : "active",
      startedAt: input.startedAt,
      updatedAt: input.updatedAt,
      completedAt: input.completedAt,
      feedback: input.feedback,
    },
    { now: timestamp }
  );
  if (!normalized) throw new RangeError("The legacy workout session could not be migrated.");
  return normalized;
};

export const sessionSetLogsForExercise = (session: WorkoutSession, exerciseSlotId: string) => {
  const exercise = session.exercises.find((item) => item.id === exerciseSlotId);
  if (!exercise) return [];
  return exercise.prescriptions
    .map((prescription) => session.setLogs[prescription.id])
    .filter((setLog): setLog is SessionSetLog => Boolean(setLog));
};
