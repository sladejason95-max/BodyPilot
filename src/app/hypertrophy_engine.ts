export type FeedbackLimitation = "target" | "supporting" | "conditioning" | "joint" | "focus";

export type VolumeAdjustment = "auto" | "add" | "hold";

export type MuscleFeedbackForProgression = {
  stimulus: number;
  pump: number;
  soreness: number;
  workload: number;
  limitation: FeedbackLimitation;
  jointPain: number;
  moreSets: boolean;
  volumeAdjustment: VolumeAdjustment;
};

export type RepRangeLift = {
  reps: string;
};

export type PreviousSetResult = {
  weight: number;
  reps: number;
  rir: number;
  skipped?: boolean;
};

export type PreviousLiftHistory = {
  sets: PreviousSetResult[];
  topSet: PreviousSetResult | null;
};

export type SetRecommendation = {
  weight: number;
  reps: number;
  rir: number;
  reason: string;
};

export type RecoveryConstraint = {
  soreness?: number;
  readiness?: number;
  jointPain?: number;
  performanceExpectation?: "below" | "steady" | "above";
};

export type RepRange = {
  low: number;
  high: number;
};

export type CompletionSet = {
  id?: string;
  weight: number;
  reps: number;
  done: boolean;
  skipped?: boolean;
};

export type WorkoutCompletionSummary = {
  totalSets: number;
  resolvedSets: number;
  productiveSets: number;
  incompleteSetIndexes: number[];
  invalidCompletedSetIndexes: number[];
  progressPercent: number;
  canComplete: boolean;
};

/**
 * A single recommendation should never add or remove more than this amount,
 * even if corrupted persisted settings reach the engine.
 */
export const MAX_RECOMMENDED_LOAD_STEP = 25;

export const workoutSessionKey = (mesocycleId: string, weekNumber: number, dayId: string) =>
  `${mesocycleId}:${Math.max(1, Math.trunc(weekNumber))}:${dayId}`;

export const workoutLiftLogKey = (
  mesocycleId: string,
  weekNumber: number,
  dayId: string,
  liftId: string
) => `${workoutSessionKey(mesocycleId, weekNumber, dayId)}:${liftId}`;

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const parseRepRange = (reps: string): RepRange => {
  const values = reps.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  const low = values[0] ?? 8;
  const high = values[1] ?? low;
  return { low, high: Math.max(low, high) };
};

export const targetRirForWeek = (currentWeek: number, mesoLengthWeeks: number, isDeload: boolean) => {
  if (isDeload) return 4;
  const progress = clamp((currentWeek - 1) / Math.max(1, mesoLengthWeeks - 1), 0, 1);
  return Math.round((3 - progress * 3) * 2) / 2;
};

const safeLoadStep = (weightIncrement: number) => {
  if (!Number.isFinite(weightIncrement) || weightIncrement <= 0) return 0;
  return Math.min(weightIncrement, MAX_RECOMMENDED_LOAD_STEP);
};

export const recommendationForSet = (
  liftItem: RepRangeLift,
  setIndex: number,
  previous: PreviousLiftHistory | null,
  targetRir: number,
  weightIncrement: number
): SetRecommendation => {
  const { low, high } = parseRepRange(liftItem.reps);
  const indexedSet = previous?.sets[Math.max(0, Math.trunc(setIndex))];
  const previousSet = indexedSet && !indexedSet.skipped ? indexedSet : previous?.topSet ?? null;
  const safeTargetRir = Number.isFinite(targetRir) ? clamp(targetRir, 0, 5) : 2;
  const loadStep = safeLoadStep(weightIncrement);

  if (!previousSet || previousSet.weight <= 0 || previousSet.reps <= 0) {
    return {
      weight: 0,
      reps: low,
      rir: safeTargetRir,
      reason: "Pick a load you can control in range.",
    };
  }

  if (previousSet.rir < safeTargetRir - 0.5) {
    return {
      weight: Math.max(0, previousSet.weight - loadStep),
      reps: Math.max(low, previousSet.reps - 1),
      rir: safeTargetRir,
      reason: "Easier target after missing effort.",
    };
  }

  if (previousSet.reps >= high && previousSet.rir >= safeTargetRir) {
    return {
      weight: previousSet.weight + loadStep,
      reps: low,
      rir: safeTargetRir,
      reason: "Load increased after topping the range.",
    };
  }

  return {
    weight: previousSet.weight,
    reps: Math.min(high, previousSet.reps + 1),
    rir: safeTargetRir,
    reason: "Add reps before increasing load.",
  };
};

export const guardRecommendationForRecovery = (
  recommendation: SetRecommendation,
  previousSet: PreviousSetResult | null,
  constraint: RecoveryConstraint
): SetRecommendation => {
  const jointPain = Number.isFinite(constraint.jointPain) ? Number(constraint.jointPain) : 0;
  const soreness = Number.isFinite(constraint.soreness) ? Number(constraint.soreness) : 0;
  const readiness = Number.isFinite(constraint.readiness) ? Number(constraint.readiness) : 4;
  const constrained =
    jointPain >= 2 || soreness >= 3 || readiness <= 1 || constraint.performanceExpectation === "below";
  if (!constrained) return recommendation;

  const previousWeight = previousSet && previousSet.weight > 0 ? previousSet.weight : recommendation.weight;
  return {
    ...recommendation,
    weight: Math.min(recommendation.weight, previousWeight),
    rir: Math.max(recommendation.rir, jointPain >= 3 ? 4 : 3),
    reason:
      jointPain >= 2
        ? "Load held because joint discomfort was reported."
        : "Load held because today’s recovery check-in was below baseline.",
  };
};

export const feedbackSetDelta = (feedback: MuscleFeedbackForProgression) => {
  if (
    feedback.jointPain >= 2 ||
    feedback.limitation === "joint" ||
    feedback.soreness >= 3 ||
    feedback.workload >= 4
  ) {
    return -1;
  }
  if (feedback.volumeAdjustment === "add" || feedback.moreSets) return 1;
  if (feedback.volumeAdjustment === "hold") return 0;
  if (
    feedback.stimulus <= 1 &&
    feedback.pump <= 1 &&
    feedback.soreness <= 1 &&
    feedback.workload <= 2
  ) {
    return 1;
  }
  return 0;
};

export const isResolvedSet = (setItem: CompletionSet) => setItem.done || Boolean(setItem.skipped);

export const isProductiveSet = (setItem: CompletionSet) =>
  setItem.done &&
  !setItem.skipped &&
  Number.isFinite(setItem.weight) &&
  setItem.weight > 0 &&
  Number.isFinite(setItem.reps) &&
  setItem.reps > 0;

export const summarizeWorkoutCompletion = (sets: CompletionSet[]): WorkoutCompletionSummary => {
  const incompleteSetIndexes: number[] = [];
  const invalidCompletedSetIndexes: number[] = [];
  let resolvedSets = 0;
  let productiveSets = 0;

  sets.forEach((setItem, index) => {
    if (isResolvedSet(setItem)) {
      resolvedSets += 1;
    } else {
      incompleteSetIndexes.push(index);
    }

    if (isProductiveSet(setItem)) {
      productiveSets += 1;
    } else if (setItem.done && !setItem.skipped) {
      invalidCompletedSetIndexes.push(index);
    }
  });

  const totalSets = sets.length;
  const progressPercent = totalSets > 0 ? Math.round((resolvedSets / totalSets) * 100) : 0;

  return {
    totalSets,
    resolvedSets,
    productiveSets,
    incompleteSetIndexes,
    invalidCompletedSetIndexes,
    progressPercent,
    canComplete:
      totalSets > 0 &&
      incompleteSetIndexes.length === 0 &&
      invalidCompletedSetIndexes.length === 0 &&
      productiveSets > 0,
  };
};
