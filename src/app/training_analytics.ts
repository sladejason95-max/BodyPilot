export type NumericLike = number | string | null | undefined;

/**
 * Structural set shape accepted by the analytics engine. Both the current
 * set logger (`weight`, `rir`, `done`) and older aggregate history records can
 * be adapted without importing UI-owned types.
 */
export type WorkoutSetLike = {
  weight?: NumericLike;
  load?: NumericLike;
  reps?: NumericLike;
  rir?: NumericLike;
  rpe?: NumericLike;
  done?: boolean;
  completed?: boolean;
  skipped?: boolean;
};

/**
 * One exercise result inside a workout. All fields are optional so existing
 * persisted history can be passed directly while newer session envelopes can
 * provide stronger identifiers and timestamps.
 */
export type WorkoutHistoryLike = {
  id?: string;
  sessionKey?: string;
  workoutId?: string;
  dayId?: string;
  workoutName?: string;
  dayFocus?: string;
  mesocycleId?: string;
  mesoId?: string;
  weekNumber?: NumericLike;
  exerciseId?: string;
  liftId?: string;
  exerciseName?: string;
  liftName?: string;
  muscleGroup?: string;
  sets?: readonly WorkoutSetLike[];
  plannedSets?: NumericLike;
  completedSets?: NumericLike;
  totalReps?: NumericLike;
  totalVolume?: NumericLike;
  averageRir?: NumericLike;
  estimatedOneRepMax?: NumericLike;
  topLoad?: NumericLike;
  topReps?: NumericLike;
  startedAt?: string;
  endedAt?: string;
  completedAt?: string;
  date?: string;
  durationSeconds?: NumericLike;
  durationMinutes?: NumericLike;
  weightUnit?: string;
};

export type TrainingFeedbackLike = {
  id?: string;
  sessionKey?: string;
  workoutId?: string;
  dayId?: string;
  mesocycleId?: string;
  mesoId?: string;
  weekNumber?: NumericLike;
  exerciseId?: string;
  liftId?: string;
  exerciseName?: string;
  liftName?: string;
  muscleGroup?: string;
  recordedAt?: string;
  createdAt?: string;
  completedAt?: string;
  date?: string;
  stimulus?: NumericLike;
  pump?: NumericLike;
  soreness?: NumericLike;
  workload?: NumericLike;
  technique?: NumericLike;
  jointPain?: NumericLike;
  pain?: NumericLike;
  readiness?: NumericLike;
  recovery?: NumericLike;
  performanceExpectation?: NumericLike;
};

/** Optional planned-session data makes adherence measurable. */
export type PlannedWorkoutLike = {
  id?: string;
  sessionKey?: string;
  workoutId?: string;
  dayId?: string;
  mesocycleId?: string;
  mesoId?: string;
  weekNumber?: NumericLike;
  scheduledAt?: string;
  date?: string;
  status?: string;
  completed?: boolean;
  skipped?: boolean;
  exerciseIds?: readonly string[];
  exerciseNames?: readonly string[];
  muscleGroups?: readonly string[];
};

export type TrainingAnalyticsFilter = {
  exerciseId?: string;
  exerciseName?: string;
  muscleGroup?: string;
  sessionKey?: string;
  workoutId?: string;
  weekNumber?: number;
  mesocycleId?: string;
  from?: string | Date;
  to?: string | Date;
};

export type TrainingAnalyticsInput = {
  history: readonly WorkoutHistoryLike[];
  feedback?: readonly TrainingFeedbackLike[];
  plannedWorkouts?: readonly PlannedWorkoutLike[];
  weightUnit?: string;
  maxInsights?: number;
};

export type MetricProgression = {
  first: number;
  latest: number;
  change: number;
  percentChange: number | null;
  samples: number;
};

export type FeedbackMetricName =
  | "stimulus"
  | "pump"
  | "soreness"
  | "workload"
  | "technique"
  | "jointPain"
  | "readiness"
  | "recovery"
  | "performanceExpectation";

export type FeedbackTrend = {
  samples: number;
  average: number;
  first: number;
  latest: number;
  change: number;
  minimum: number;
  maximum: number;
  direction: "rising" | "falling" | "flat";
};

export type TrainingFeedbackSummary = {
  recordCount: number;
  firstRecordedAt: string | null;
  lastRecordedAt: string | null;
  trends: Partial<Record<FeedbackMetricName, FeedbackTrend>>;
  peakJointPain: number | null;
};

export type DurationSummary = {
  observedWorkouts: number;
  totalMinutes: number;
  averageMinutes: number;
};

export type TrainingAggregate = {
  entryCount: number;
  workoutCount: number;
  completedSetCount: number;
  totalReps: number;
  totalVolume: number;
  averageRir: number | null;
  bestEstimatedStrength: number | null;
  duration: DurationSummary | null;
  firstCompletedAt: string | null;
  lastCompletedAt: string | null;
};

export type PersonalRecord = {
  exerciseKey: string;
  exerciseId: string | null;
  exerciseName: string;
  metric: "load" | "reps" | "estimated-strength" | "session-volume";
  value: number;
  unit: string | null;
  achievedAt: string | null;
  sessionKey: string;
};

export type ExerciseProgressionSummary = TrainingAggregate & {
  key: string;
  exerciseId: string | null;
  exerciseName: string;
  muscleGroups: string[];
  loadProgression: MetricProgression | null;
  repProgression: MetricProgression | null;
  estimatedStrengthProgression: MetricProgression | null;
  personalRecords: PersonalRecord[];
};

export type MuscleTrainingSummary = TrainingAggregate & {
  key: string;
  muscleGroup: string;
  feedback: TrainingFeedbackSummary;
};

export type WorkoutTrainingSummary = TrainingAggregate & {
  key: string;
  sessionKey: string;
  workoutId: string | null;
  workoutName: string;
  mesocycleId: string | null;
  weekNumber: number | null;
  completedAt: string | null;
  feedback: TrainingFeedbackSummary;
};

export type WeekTrainingSummary = TrainingAggregate & {
  key: string;
  mesocycleId: string | null;
  weekNumber: number;
  feedback: TrainingFeedbackSummary;
};

export type MesocycleTrainingSummary = TrainingAggregate & {
  key: string;
  mesocycleId: string;
  feedback: TrainingFeedbackSummary;
};

export type AdherenceSummary = {
  completedWorkouts: number;
  plannedWorkouts: number | null;
  skippedWorkouts: number | null;
  inProgressWorkouts: number | null;
  adherencePercent: number | null;
  accountedForPercent: number | null;
};

export type TrainingAnalyticsReport = {
  filter: TrainingAnalyticsFilter;
  aggregate: TrainingAggregate;
  adherence: AdherenceSummary;
  feedback: TrainingFeedbackSummary;
  exercises: ExerciseProgressionSummary[];
  muscles: MuscleTrainingSummary[];
  workouts: WorkoutTrainingSummary[];
  weeks: WeekTrainingSummary[];
  mesocycles: MesocycleTrainingSummary[];
  personalRecords: PersonalRecord[];
  insights: string[];
};

type EntryMetric = {
  entry: WorkoutHistoryLike;
  inputIndex: number;
  sessionKey: string;
  workoutId: string | null;
  workoutName: string;
  mesocycleId: string | null;
  weekNumber: number | null;
  exerciseKey: string;
  exerciseId: string | null;
  exerciseName: string;
  muscleGroup: string | null;
  completedAt: string | null;
  completedAtMs: number | null;
  completedSets: number;
  totalReps: number;
  totalVolume: number;
  rirSum: number;
  rirCount: number;
  maxLoad: number | null;
  maxReps: number | null;
  estimatedStrength: number | null;
  weightUnit: string | null;
};

type ExercisePoint = {
  sessionKey: string;
  completedAt: string | null;
  completedAtMs: number | null;
  order: number;
  maxLoad: number | null;
  maxReps: number | null;
  estimatedStrength: number | null;
  totalVolume: number;
};

const feedbackMetricNames: readonly FeedbackMetricName[] = [
  "stimulus",
  "pump",
  "soreness",
  "workload",
  "technique",
  "jointPain",
  "readiness",
  "recovery",
  "performanceExpectation",
];

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const numberOrNull = (value: NumericLike): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const positiveIntegerOrNull = (value: NumericLike) => {
  const parsed = numberOrNull(value);
  return parsed === null ? null : Math.max(0, Math.trunc(parsed));
};

const normalizedText = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

const sameText = (left: string | null | undefined, right: string | null | undefined) =>
  normalizedText(left) === normalizedText(right);

const timestampFor = (value: string | Date | null | undefined): number | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const mesocycleIdFor = (value: { mesocycleId?: string; mesoId?: string }) =>
  value.mesocycleId?.trim() || value.mesoId?.trim() || null;

const weekNumberFor = (value: { weekNumber?: NumericLike }) => {
  const week = positiveIntegerOrNull(value.weekNumber);
  return week !== null && week > 0 ? week : null;
};

const exerciseIdFor = (value: {
  exerciseId?: string;
  liftId?: string;
}) => value.exerciseId?.trim() || value.liftId?.trim() || null;

const exerciseNameFor = (value: {
  exerciseName?: string;
  liftName?: string;
}) => value.exerciseName?.trim() || value.liftName?.trim() || "Unnamed exercise";

const workoutIdFor = (value: { workoutId?: string; dayId?: string }) =>
  value.workoutId?.trim() || value.dayId?.trim() || null;

const workoutNameFor = (value: { workoutName?: string; dayFocus?: string }) =>
  value.workoutName?.trim() || value.dayFocus?.trim() || "Workout";

const recordDateFor = (value: {
  recordedAt?: string;
  createdAt?: string;
  completedAt?: string;
  endedAt?: string;
  startedAt?: string;
  scheduledAt?: string;
  date?: string;
}) =>
  value.recordedAt ||
  value.createdAt ||
  value.completedAt ||
  value.endedAt ||
  value.startedAt ||
  value.scheduledAt ||
  value.date ||
  null;

const sessionKeyFor = (
  value: {
    id?: string;
    sessionKey?: string;
    workoutId?: string;
    dayId?: string;
    mesocycleId?: string;
    mesoId?: string;
    weekNumber?: NumericLike;
    completedAt?: string;
    endedAt?: string;
    startedAt?: string;
    scheduledAt?: string;
    date?: string;
  },
  index: number
) => {
  if (value.sessionKey?.trim()) return value.sessionKey.trim();

  const mesocycleId = mesocycleIdFor(value);
  const weekNumber = weekNumberFor(value);
  const workoutId = workoutIdFor(value);
  const date = recordDateFor(value)?.slice(0, 10) ?? null;
  const parts = [
    mesocycleId ? `meso:${mesocycleId}` : "",
    weekNumber !== null ? `week:${weekNumber}` : "",
    workoutId ? `workout:${workoutId}` : "",
    date ? `date:${date}` : "",
  ].filter(Boolean);

  if (parts.length > 0) return parts.join("|");
  if (value.id?.trim()) return value.id.trim();
  return `unscoped-workout-${index}`;
};

const exerciseKeyFor = (entry: WorkoutHistoryLike, index: number) => {
  const exerciseId = exerciseIdFor(entry);
  if (exerciseId) return `id:${normalizedText(exerciseId)}`;
  const exerciseName = exerciseNameFor(entry);
  return normalizedText(exerciseName) ? `name:${normalizedText(exerciseName)}` : `exercise-${index}`;
};

const withinDateRange = (date: string | null, filter: TrainingAnalyticsFilter) => {
  const recordTime = timestampFor(date);
  const from = timestampFor(filter.from);
  const to = timestampFor(filter.to);
  if (from !== null && (recordTime === null || recordTime < from)) return false;
  if (to !== null && (recordTime === null || recordTime > to)) return false;
  return true;
};

const historyMatchesFilter = (entry: WorkoutHistoryLike, index: number, filter: TrainingAnalyticsFilter) => {
  if (filter.exerciseId && !sameText(exerciseIdFor(entry), filter.exerciseId)) return false;
  if (filter.exerciseName && !sameText(exerciseNameFor(entry), filter.exerciseName)) return false;
  if (filter.muscleGroup && !sameText(entry.muscleGroup, filter.muscleGroup)) return false;
  if (filter.sessionKey && !sameText(sessionKeyFor(entry, index), filter.sessionKey)) return false;
  if (filter.workoutId && !sameText(workoutIdFor(entry), filter.workoutId)) return false;
  if (filter.weekNumber !== undefined && weekNumberFor(entry) !== filter.weekNumber) return false;
  if (filter.mesocycleId && !sameText(mesocycleIdFor(entry), filter.mesocycleId)) return false;
  return withinDateRange(recordDateFor(entry), filter);
};

const feedbackMatchesFilter = (entry: TrainingFeedbackLike, index: number, filter: TrainingAnalyticsFilter) => {
  if (filter.exerciseId && !sameText(exerciseIdFor(entry), filter.exerciseId)) return false;
  if (filter.exerciseName && !sameText(exerciseNameFor(entry), filter.exerciseName)) return false;
  if (filter.muscleGroup && !sameText(entry.muscleGroup, filter.muscleGroup)) return false;
  if (filter.sessionKey && !sameText(sessionKeyFor(entry, index), filter.sessionKey)) return false;
  if (filter.workoutId && !sameText(workoutIdFor(entry), filter.workoutId)) return false;
  if (filter.weekNumber !== undefined && weekNumberFor(entry) !== filter.weekNumber) return false;
  if (filter.mesocycleId && !sameText(mesocycleIdFor(entry), filter.mesocycleId)) return false;
  return withinDateRange(recordDateFor(entry), filter);
};

const plannedWorkoutMatchesFilter = (entry: PlannedWorkoutLike, index: number, filter: TrainingAnalyticsFilter) => {
  if (filter.sessionKey && !sameText(sessionKeyFor(entry, index), filter.sessionKey)) return false;
  if (filter.workoutId && !sameText(workoutIdFor(entry), filter.workoutId)) return false;
  if (filter.weekNumber !== undefined && weekNumberFor(entry) !== filter.weekNumber) return false;
  if (filter.mesocycleId && !sameText(mesocycleIdFor(entry), filter.mesocycleId)) return false;
  if (
    filter.exerciseId &&
    !(entry.exerciseIds ?? []).some((exerciseId) => sameText(exerciseId, filter.exerciseId))
  ) {
    return false;
  }
  if (
    filter.exerciseName &&
    !(entry.exerciseNames ?? []).some((exerciseName) => sameText(exerciseName, filter.exerciseName))
  ) {
    return false;
  }
  if (
    filter.muscleGroup &&
    !(entry.muscleGroups ?? []).some((muscleGroup) => sameText(muscleGroup, filter.muscleGroup))
  ) {
    return false;
  }
  return withinDateRange(recordDateFor(entry), filter);
};

export const filterTrainingHistory = <T extends WorkoutHistoryLike>(
  history: readonly T[],
  filter: TrainingAnalyticsFilter = {}
): T[] => history.filter((entry, index) => historyMatchesFilter(entry, index, filter));

export const filterTrainingFeedback = <T extends TrainingFeedbackLike>(
  feedback: readonly T[],
  filter: TrainingAnalyticsFilter = {}
): T[] => feedback.filter((entry, index) => feedbackMatchesFilter(entry, index, filter));

export const estimateStrength = (weight: number, reps: number) =>
  weight > 0 && reps > 0 ? round(weight * (1 + reps / 30), 2) : null;

const completedSetsFor = (entry: WorkoutHistoryLike) => {
  if (!Array.isArray(entry.sets)) return [];
  return entry.sets
    .map((setItem) => {
      if (setItem.skipped || setItem.done === false || setItem.completed === false) return null;
      const reps = numberOrNull(setItem.reps);
      if (reps === null || reps <= 0) return null;
      const weight = numberOrNull(setItem.weight ?? setItem.load) ?? 0;
      const directRir = numberOrNull(setItem.rir);
      const rpe = numberOrNull(setItem.rpe);
      const rir = directRir ?? (rpe === null ? null : 10 - rpe);
      return {
        weight: Math.max(0, weight),
        reps: Math.max(0, reps),
        rir,
      };
    })
    .filter((setItem): setItem is { weight: number; reps: number; rir: number | null } => Boolean(setItem));
};

const metricForEntry = (entry: WorkoutHistoryLike, inputIndex: number): EntryMetric => {
  const sets = completedSetsFor(entry);
  const fallbackCompletedSets = positiveIntegerOrNull(entry.completedSets) ?? 0;
  const completedSets = sets.length > 0 ? sets.length : fallbackCompletedSets;
  const totalReps =
    sets.length > 0
      ? sets.reduce((sum, setItem) => sum + setItem.reps, 0)
      : Math.max(0, numberOrNull(entry.totalReps) ?? 0);
  const totalVolume =
    sets.length > 0
      ? sets.reduce((sum, setItem) => sum + setItem.weight * setItem.reps, 0)
      : Math.max(0, numberOrNull(entry.totalVolume) ?? 0);
  const rirValues = sets
    .map((setItem) => setItem.rir)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const fallbackAverageRir = numberOrNull(entry.averageRir);
  const rirCount = rirValues.length || (fallbackAverageRir === null ? 0 : Math.max(1, completedSets));
  const rirSum =
    rirValues.length > 0
      ? rirValues.reduce((sum, value) => sum + value, 0)
      : fallbackAverageRir === null
        ? 0
        : fallbackAverageRir * Math.max(1, completedSets);
  const setLoads = sets.map((setItem) => setItem.weight).filter((value) => value > 0);
  const fallbackLoad = numberOrNull(entry.topLoad);
  const maxLoad = setLoads.length > 0 ? Math.max(...setLoads) : fallbackLoad !== null && fallbackLoad > 0 ? fallbackLoad : null;
  const setReps = sets.map((setItem) => setItem.reps).filter((value) => value > 0);
  const fallbackReps = numberOrNull(entry.topReps);
  const maxReps = setReps.length > 0 ? Math.max(...setReps) : fallbackReps !== null && fallbackReps > 0 ? fallbackReps : null;
  const calculatedStrength = sets
    .map((setItem) => estimateStrength(setItem.weight, setItem.reps))
    .filter((value): value is number => value !== null);
  const suppliedStrength = numberOrNull(entry.estimatedOneRepMax);
  const estimatedStrength = Math.max(
    suppliedStrength !== null && suppliedStrength > 0 ? suppliedStrength : 0,
    calculatedStrength.length > 0 ? Math.max(...calculatedStrength) : 0
  );
  const completedAt = recordDateFor(entry);
  const exerciseId = exerciseIdFor(entry);

  return {
    entry,
    inputIndex,
    sessionKey: sessionKeyFor(entry, inputIndex),
    workoutId: workoutIdFor(entry),
    workoutName: workoutNameFor(entry),
    mesocycleId: mesocycleIdFor(entry),
    weekNumber: weekNumberFor(entry),
    exerciseKey: exerciseKeyFor(entry, inputIndex),
    exerciseId,
    exerciseName: exerciseNameFor(entry),
    muscleGroup: entry.muscleGroup?.trim() || null,
    completedAt,
    completedAtMs: timestampFor(completedAt),
    completedSets,
    totalReps,
    totalVolume: round(totalVolume),
    rirSum,
    rirCount,
    maxLoad,
    maxReps,
    estimatedStrength: estimatedStrength > 0 ? round(estimatedStrength) : null,
    weightUnit: entry.weightUnit?.trim() || null,
  };
};

const durationSecondsForEntry = (entry: WorkoutHistoryLike) => {
  const seconds = numberOrNull(entry.durationSeconds);
  if (seconds !== null && seconds >= 0) return seconds;
  const minutes = numberOrNull(entry.durationMinutes);
  if (minutes !== null && minutes >= 0) return minutes * 60;
  return null;
};

const durationForSession = (metrics: readonly EntryMetric[]) => {
  const directDurations = metrics
    .map((metric) => durationSecondsForEntry(metric.entry))
    .filter((value): value is number => value !== null);
  if (directDurations.length > 0) return Math.max(...directDurations);

  const starts = metrics
    .map((metric) => timestampFor(metric.entry.startedAt))
    .filter((value): value is number => value !== null);
  const ends = metrics
    .map((metric) => timestampFor(metric.entry.endedAt || metric.entry.completedAt))
    .filter((value): value is number => value !== null);
  if (starts.length === 0 || ends.length === 0) return null;
  const durationMs = Math.max(...ends) - Math.min(...starts);
  return durationMs >= 0 ? durationMs / 1000 : null;
};

const aggregateMetrics = (metrics: readonly EntryMetric[]): TrainingAggregate => {
  const sessions = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    const group = sessions.get(metric.sessionKey) ?? [];
    group.push(metric);
    sessions.set(metric.sessionKey, group);
  });
  const durations = [...sessions.values()]
    .map(durationForSession)
    .filter((value): value is number => value !== null);
  const timestamps = metrics
    .map((metric) => ({ label: metric.completedAt, value: metric.completedAtMs }))
    .filter((item): item is { label: string; value: number } => item.label !== null && item.value !== null)
    .sort((left, right) => left.value - right.value);
  const rirCount = metrics.reduce((sum, metric) => sum + metric.rirCount, 0);
  const rirSum = metrics.reduce((sum, metric) => sum + metric.rirSum, 0);
  const strengths = metrics
    .map((metric) => metric.estimatedStrength)
    .filter((value): value is number => value !== null);
  const totalDurationMinutes = durations.reduce((sum, value) => sum + value, 0) / 60;

  return {
    entryCount: metrics.length,
    workoutCount: sessions.size,
    completedSetCount: metrics.reduce((sum, metric) => sum + metric.completedSets, 0),
    totalReps: round(metrics.reduce((sum, metric) => sum + metric.totalReps, 0)),
    totalVolume: round(metrics.reduce((sum, metric) => sum + metric.totalVolume, 0)),
    averageRir: rirCount > 0 ? round(rirSum / rirCount) : null,
    bestEstimatedStrength: strengths.length > 0 ? round(Math.max(...strengths)) : null,
    duration:
      durations.length > 0
        ? {
            observedWorkouts: durations.length,
            totalMinutes: round(totalDurationMinutes),
            averageMinutes: round(totalDurationMinutes / durations.length),
          }
        : null,
    firstCompletedAt: timestamps[0]?.label ?? null,
    lastCompletedAt: timestamps[timestamps.length - 1]?.label ?? null,
  };
};

const feedbackValue = (record: TrainingFeedbackLike, metric: FeedbackMetricName) => {
  if (metric === "jointPain") return numberOrNull(record.jointPain ?? record.pain);
  return numberOrNull(record[metric]);
};

export const summarizeTrainingFeedback = (
  records: readonly TrainingFeedbackLike[]
): TrainingFeedbackSummary => {
  const ordered = records
    .map((record, index) => ({ record, index, date: recordDateFor(record), time: timestampFor(recordDateFor(record)) }))
    .sort((left, right) => {
      if (left.time !== null && right.time !== null) return left.time - right.time || left.index - right.index;
      if (left.time !== null) return -1;
      if (right.time !== null) return 1;
      return left.index - right.index;
    });
  const dated = ordered
    .filter((item): item is typeof item & { date: string; time: number } => item.date !== null && item.time !== null)
    .sort((left, right) => left.time - right.time || left.index - right.index);
  const trends: Partial<Record<FeedbackMetricName, FeedbackTrend>> = {};

  feedbackMetricNames.forEach((metric) => {
    const values = ordered
      .map((item) => feedbackValue(item.record, metric))
      .filter((value): value is number => value !== null);
    if (values.length === 0) return;
    const first = values[0];
    const latest = values[values.length - 1];
    const change = round(latest - first);
    trends[metric] = {
      samples: values.length,
      average: round(values.reduce((sum, value) => sum + value, 0) / values.length),
      first,
      latest,
      change,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      direction: change > 0 ? "rising" : change < 0 ? "falling" : "flat",
    };
  });

  return {
    recordCount: records.length,
    firstRecordedAt: dated[0]?.date ?? null,
    lastRecordedAt: dated[dated.length - 1]?.date ?? null,
    trends,
    peakJointPain: trends.jointPain?.maximum ?? null,
  };
};

const progressionFor = (points: readonly ExercisePoint[], select: (point: ExercisePoint) => number | null) => {
  const values = points.map(select).filter((value): value is number => value !== null);
  if (values.length < 2) return null;
  const first = values[0];
  const latest = values[values.length - 1];
  return {
    first,
    latest,
    change: round(latest - first),
    percentChange: first === 0 ? null : round(((latest - first) / Math.abs(first)) * 100, 1),
    samples: values.length,
  } satisfies MetricProgression;
};

const pointOrder = (left: ExercisePoint, right: ExercisePoint) => {
  if (left.completedAtMs !== null && right.completedAtMs !== null) {
    return left.completedAtMs - right.completedAtMs || left.order - right.order;
  }
  if (left.completedAtMs !== null) return -1;
  if (right.completedAtMs !== null) return 1;
  return left.order - right.order;
};

const pointsForExercise = (metrics: readonly EntryMetric[]) => {
  const sessions = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    const group = sessions.get(metric.sessionKey) ?? [];
    group.push(metric);
    sessions.set(metric.sessionKey, group);
  });

  return [...sessions.entries()]
    .map(([sessionKey, sessionMetrics]) => {
      const loads = sessionMetrics.map((metric) => metric.maxLoad).filter((value): value is number => value !== null);
      const reps = sessionMetrics.map((metric) => metric.maxReps).filter((value): value is number => value !== null);
      const strengths = sessionMetrics
        .map((metric) => metric.estimatedStrength)
        .filter((value): value is number => value !== null);
      const dated = sessionMetrics
        .filter((metric) => metric.completedAt !== null && metric.completedAtMs !== null)
        .sort((left, right) => (left.completedAtMs ?? 0) - (right.completedAtMs ?? 0));
      return {
        sessionKey,
        completedAt: dated[dated.length - 1]?.completedAt ?? null,
        completedAtMs: dated[dated.length - 1]?.completedAtMs ?? null,
        order: Math.min(...sessionMetrics.map((metric) => metric.inputIndex)),
        maxLoad: loads.length > 0 ? Math.max(...loads) : null,
        maxReps: reps.length > 0 ? Math.max(...reps) : null,
        estimatedStrength: strengths.length > 0 ? Math.max(...strengths) : null,
        totalVolume: round(sessionMetrics.reduce((sum, metric) => sum + metric.totalVolume, 0)),
      } satisfies ExercisePoint;
    })
    .sort(pointOrder);
};

const recordFromPoint = (
  exercise: Pick<ExerciseProgressionSummary, "key" | "exerciseId" | "exerciseName">,
  points: readonly ExercisePoint[],
  metric: PersonalRecord["metric"],
  select: (point: ExercisePoint) => number | null,
  unit: string | null
): PersonalRecord | null => {
  const candidates = points.filter((point) => {
    const value = select(point);
    return value !== null && value > 0;
  });
  if (candidates.length === 0) return null;
  const best = candidates.reduce((winner, point) => (select(point)! >= select(winner)! ? point : winner));
  return {
    exerciseKey: exercise.key,
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    metric,
    value: round(select(best)!),
    unit,
    achievedAt: best.completedAt,
    sessionKey: best.sessionKey,
  };
};

const buildExerciseSummaries = (metrics: readonly EntryMetric[], defaultWeightUnit: string | null) => {
  const groups = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    const group = groups.get(metric.exerciseKey) ?? [];
    group.push(metric);
    groups.set(metric.exerciseKey, group);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const first = group[0];
      const points = pointsForExercise(group);
      const weightUnit = group.find((metric) => metric.weightUnit)?.weightUnit ?? defaultWeightUnit;
      const identity = {
        key,
        exerciseId: first.exerciseId,
        exerciseName: first.exerciseName,
      };
      const personalRecords = [
        recordFromPoint(identity, points, "load", (point) => point.maxLoad, weightUnit),
        recordFromPoint(identity, points, "reps", (point) => point.maxReps, "reps"),
        recordFromPoint(identity, points, "estimated-strength", (point) => point.estimatedStrength, weightUnit),
        recordFromPoint(
          identity,
          points,
          "session-volume",
          (point) => point.totalVolume,
          weightUnit ? `${weightUnit}·reps` : null
        ),
      ].filter((record): record is PersonalRecord => record !== null);

      return {
        ...aggregateMetrics(group),
        ...identity,
        muscleGroups: Array.from(new Set(group.map((metric) => metric.muscleGroup).filter((value): value is string => Boolean(value)))),
        loadProgression: progressionFor(points, (point) => point.maxLoad),
        repProgression: progressionFor(points, (point) => point.maxReps),
        estimatedStrengthProgression: progressionFor(points, (point) => point.estimatedStrength),
        personalRecords,
      } satisfies ExerciseProgressionSummary;
    })
    .sort((left, right) => right.totalVolume - left.totalVolume || left.exerciseName.localeCompare(right.exerciseName));
};

const buildMuscleSummaries = (
  metrics: readonly EntryMetric[],
  feedback: readonly TrainingFeedbackLike[]
) => {
  const groups = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    if (!metric.muscleGroup) return;
    const key = normalizedText(metric.muscleGroup);
    const group = groups.get(key) ?? [];
    group.push(metric);
    groups.set(key, group);
  });
  feedback.forEach((record) => {
    const muscleGroup = record.muscleGroup?.trim();
    if (!muscleGroup) return;
    const key = normalizedText(muscleGroup);
    if (!groups.has(key)) groups.set(key, []);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const muscleGroup =
        group[0]?.muscleGroup ??
        feedback.find((record) => normalizedText(record.muscleGroup) === key)?.muscleGroup?.trim() ??
        key;
      return {
        ...aggregateMetrics(group),
        key,
        muscleGroup,
        feedback: summarizeTrainingFeedback(
          feedback.filter((record) => sameText(record.muscleGroup, muscleGroup))
        ),
      } satisfies MuscleTrainingSummary;
    })
    .sort((left, right) => right.totalVolume - left.totalVolume || left.muscleGroup.localeCompare(right.muscleGroup));
};

const buildWorkoutSummaries = (
  metrics: readonly EntryMetric[],
  feedback: readonly TrainingFeedbackLike[]
) => {
  const groups = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    const group = groups.get(metric.sessionKey) ?? [];
    group.push(metric);
    groups.set(metric.sessionKey, group);
  });

  return [...groups.entries()]
    .map(([sessionKey, group]) => {
      const first = group[0];
      const completed = group
        .filter((metric) => metric.completedAt !== null && metric.completedAtMs !== null)
        .sort((left, right) => (left.completedAtMs ?? 0) - (right.completedAtMs ?? 0));
      return {
        ...aggregateMetrics(group),
        key: sessionKey,
        sessionKey,
        workoutId: first.workoutId,
        workoutName: first.workoutName,
        mesocycleId: first.mesocycleId,
        weekNumber: first.weekNumber,
        completedAt: completed[completed.length - 1]?.completedAt ?? null,
        feedback: summarizeTrainingFeedback(
          feedback.filter((record, index) => sameText(sessionKeyFor(record, index), sessionKey))
        ),
      } satisfies WorkoutTrainingSummary;
    })
    .sort((left, right) => (timestampFor(right.completedAt) ?? -1) - (timestampFor(left.completedAt) ?? -1));
};

const buildWeekSummaries = (
  metrics: readonly EntryMetric[],
  feedback: readonly TrainingFeedbackLike[]
) => {
  const groups = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    if (metric.weekNumber === null) return;
    const key = `${metric.mesocycleId ?? "unscoped"}:week:${metric.weekNumber}`;
    const group = groups.get(key) ?? [];
    group.push(metric);
    groups.set(key, group);
  });

  return [...groups.entries()]
    .map(([key, group]) => {
      const first = group[0];
      return {
        ...aggregateMetrics(group),
        key,
        mesocycleId: first.mesocycleId,
        weekNumber: first.weekNumber!,
        feedback: summarizeTrainingFeedback(
          feedback.filter(
            (record) =>
              weekNumberFor(record) === first.weekNumber &&
              sameText(mesocycleIdFor(record), first.mesocycleId)
          )
        ),
      } satisfies WeekTrainingSummary;
    })
    .sort((left, right) =>
      normalizedText(left.mesocycleId).localeCompare(normalizedText(right.mesocycleId)) ||
      left.weekNumber - right.weekNumber
    );
};

const buildMesocycleSummaries = (
  metrics: readonly EntryMetric[],
  feedback: readonly TrainingFeedbackLike[]
) => {
  const groups = new Map<string, EntryMetric[]>();
  metrics.forEach((metric) => {
    if (!metric.mesocycleId) return;
    const group = groups.get(metric.mesocycleId) ?? [];
    group.push(metric);
    groups.set(metric.mesocycleId, group);
  });

  return [...groups.entries()]
    .map(([mesocycleId, group]) => ({
      ...aggregateMetrics(group),
      key: mesocycleId,
      mesocycleId,
      feedback: summarizeTrainingFeedback(
        feedback.filter((record) => sameText(mesocycleIdFor(record), mesocycleId))
      ),
    } satisfies MesocycleTrainingSummary))
    .sort((left, right) => (timestampFor(right.lastCompletedAt) ?? -1) - (timestampFor(left.lastCompletedAt) ?? -1));
};

const normalizedStatus = (status: string | undefined) => normalizedText(status).replace(/[_\s]+/g, "-");

const isPlannedWorkoutCompleted = (workout: PlannedWorkoutLike) => {
  const status = normalizedStatus(workout.status);
  return workout.completed === true || status === "completed" || status === "complete" || status === "done" || status === "closed";
};

const isPlannedWorkoutSkipped = (workout: PlannedWorkoutLike) => {
  const status = normalizedStatus(workout.status);
  return workout.skipped === true || status === "skipped" || status === "skip";
};

const summarizeAdherence = (
  metrics: readonly EntryMetric[],
  plannedWorkouts: readonly PlannedWorkoutLike[] | undefined,
  filter: TrainingAnalyticsFilter
): AdherenceSummary => {
  const completedSessionKeys = new Set(metrics.map((metric) => metric.sessionKey));
  if (!plannedWorkouts) {
    return {
      completedWorkouts: completedSessionKeys.size,
      plannedWorkouts: null,
      skippedWorkouts: null,
      inProgressWorkouts: null,
      adherencePercent: null,
      accountedForPercent: null,
    };
  }

  const scoped = plannedWorkouts.filter((workout, index) => plannedWorkoutMatchesFilter(workout, index, filter));
  let completed = 0;
  let skipped = 0;
  let inProgress = 0;
  scoped.forEach((workout, index) => {
    const key = sessionKeyFor(workout, index);
    if (isPlannedWorkoutCompleted(workout) || completedSessionKeys.has(key)) {
      completed += 1;
      return;
    }
    if (isPlannedWorkoutSkipped(workout)) {
      skipped += 1;
      return;
    }
    if (normalizedStatus(workout.status) === "in-progress" || normalizedStatus(workout.status) === "active") {
      inProgress += 1;
    }
  });
  const planned = scoped.length;

  return {
    completedWorkouts: completed,
    plannedWorkouts: planned,
    skippedWorkouts: skipped,
    inProgressWorkouts: inProgress,
    adherencePercent: planned > 0 ? round((completed / planned) * 100, 1) : null,
    accountedForPercent: planned > 0 ? round(((completed + skipped) / planned) * 100, 1) : null,
  };
};

const formatMetric = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: Number.isInteger(value) ? 0 : 1 });

const formatSignedPercent = (value: number) => `${Math.abs(value).toFixed(1)}%`;

const buildInsights = (
  aggregate: TrainingAggregate,
  adherence: AdherenceSummary,
  feedback: TrainingFeedbackSummary,
  exercises: readonly ExerciseProgressionSummary[],
  weightUnit: string | null,
  maxInsights: number
) => {
  const insights: string[] = [];
  const progressing = exercises
    .filter((exercise) => exercise.estimatedStrengthProgression?.percentChange !== null)
    .sort(
      (left, right) =>
        Math.abs(right.estimatedStrengthProgression?.percentChange ?? 0) -
        Math.abs(left.estimatedStrengthProgression?.percentChange ?? 0)
    )[0];
  const strengthChange = progressing?.estimatedStrengthProgression?.percentChange;
  if (progressing && strengthChange !== null && strengthChange !== undefined && strengthChange !== 0) {
    insights.push(
      `${progressing.exerciseName} estimated strength ${strengthChange > 0 ? "rose" : "fell"} ${formatSignedPercent(strengthChange)} across ${progressing.estimatedStrengthProgression!.samples} logged workouts.`
    );
  } else {
    const loadProgressing = exercises.find((exercise) => exercise.loadProgression && exercise.loadProgression.change !== 0);
    if (loadProgressing?.loadProgression) {
      const unit = weightUnit ? ` ${weightUnit}` : "";
      insights.push(
        `${loadProgressing.exerciseName} top load moved from ${formatMetric(loadProgressing.loadProgression.first)}${unit} to ${formatMetric(loadProgressing.loadProgression.latest)}${unit}.`
      );
    }
  }

  const pain = feedback.trends.jointPain;
  if (pain && pain.samples > 1 && pain.change !== 0) {
    insights.push(
      `Joint discomfort ${pain.change > 0 ? "rose" : "fell"} from ${formatMetric(pain.first)} to ${formatMetric(pain.latest)} across ${pain.samples} check-ins.`
    );
  } else if (pain) {
    insights.push(`Latest joint-discomfort score was ${formatMetric(pain.latest)}.`);
  }

  if (aggregate.completedSetCount > 0) {
    const volumeText = aggregate.totalVolume > 0 ? ` and ${formatMetric(aggregate.totalVolume)} total load volume` : "";
    insights.push(
      `${aggregate.completedSetCount} completed sets${volumeText} were logged across ${aggregate.workoutCount} workout${aggregate.workoutCount === 1 ? "" : "s"}.`
    );
  }
  if (aggregate.averageRir !== null) {
    insights.push(`Average completed-set RIR was ${formatMetric(aggregate.averageRir)}.`);
  }
  if (adherence.adherencePercent !== null && adherence.plannedWorkouts !== null) {
    insights.push(
      `${adherence.completedWorkouts} of ${adherence.plannedWorkouts} planned workouts were completed (${formatMetric(adherence.adherencePercent)}% adherence).`
    );
  }
  if (aggregate.duration) {
    insights.push(
      `Average duration was ${formatMetric(aggregate.duration.averageMinutes)} minutes across ${aggregate.duration.observedWorkouts} timed workout${aggregate.duration.observedWorkouts === 1 ? "" : "s"}.`
    );
  }
  if (insights.length === 0) {
    insights.push(
      feedback.recordCount > 0
        ? `${feedback.recordCount} feedback record${feedback.recordCount === 1 ? "" : "s"} match this view; no completed set metrics are available yet.`
        : "No completed workout data matches this view."
    );
  }
  return insights.slice(0, Math.max(1, Math.trunc(maxInsights)));
};

export const buildTrainingAnalytics = (
  input: TrainingAnalyticsInput,
  filter: TrainingAnalyticsFilter = {}
): TrainingAnalyticsReport => {
  const history = filterTrainingHistory(input.history, filter);
  const feedback = filterTrainingFeedback(input.feedback ?? [], filter);
  const metrics = history.map(metricForEntry);
  const aggregate = aggregateMetrics(metrics);
  const feedbackSummary = summarizeTrainingFeedback(feedback);
  const defaultWeightUnit = input.weightUnit?.trim() || null;
  const exercises = buildExerciseSummaries(metrics, defaultWeightUnit);
  const adherence = summarizeAdherence(metrics, input.plannedWorkouts, filter);
  const personalRecords = exercises.flatMap((exercise) => exercise.personalRecords);
  const maxInsights = Number.isFinite(input.maxInsights) ? Math.max(1, Math.trunc(input.maxInsights!)) : 5;

  return {
    filter: { ...filter },
    aggregate,
    adherence,
    feedback: feedbackSummary,
    exercises,
    muscles: buildMuscleSummaries(metrics, feedback),
    workouts: buildWorkoutSummaries(metrics, feedback),
    weeks: buildWeekSummaries(metrics, feedback),
    mesocycles: buildMesocycleSummaries(metrics, feedback),
    personalRecords,
    insights: buildInsights(aggregate, adherence, feedbackSummary, exercises, defaultWeightUnit, maxInsights),
  };
};
