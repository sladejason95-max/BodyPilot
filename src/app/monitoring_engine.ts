import {
  adaptationRuleLibrary,
  biofeedbackMetricLibrary,
  biomarkerLibrary,
  bodyCompositionMetricLibrary,
  coachingInterventionLibrary,
  conditioningModalityLibrary,
} from "./performance_libraries";
import type {
  BodyWeightTrendModel,
  DecisionConfidenceModel,
  FuelTimingModel,
  HydrationSupportModel,
  RecoveryPressureModel,
  ScienceTone,
} from "./science_model";
import type { CheckIn } from "./types";

export type MonitoringCard = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type InterventionRecommendation = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
  tab: "nutrition" | "tracker" | "split" | "library" | "coach" | "schedule";
  queuedChange: string;
};

export type MonitoringSnapshot = {
  athleteCards: MonitoringCard[];
  coachCards: MonitoringCard[];
  interventions: InterventionRecommendation[];
};

type MonitoringInput = {
  trainingDay: boolean;
  primaryLimiter: string;
  weeksOut: number;
  sleepHours: number;
  sleepQuality: number;
  weeklyDensityScore: number;
  selectedTrackerExecutionScore: number;
  selectedTrackerMissingFieldsCount: number;
  selectedTrackerStepScore: number;
  complianceScore: number;
  splitAnchorCount: number;
  splitHighRecoveryCount: number;
  lowerBodyAnchorCount: number;
  lowerBodyHighRecoveryCount: number;
  checkIns: CheckIn[];
  bodyWeightTrendModel: BodyWeightTrendModel;
  recoveryPressureModel: RecoveryPressureModel;
  hydrationSupportModel: HydrationSupportModel;
  fuelTimingModel: FuelTimingModel;
  mealPlanScienceProfile: {
    status: string;
    title: string;
    detail: string;
    tone: ScienceTone;
    fiberG: number;
    sodiumMg: number;
    potassiumMg: number;
  };
  decisionConfidenceModel: DecisionConfidenceModel;
};

const toneWeight: Record<ScienceTone, number> = {
  rose: 5,
  amber: 4,
  sky: 3,
  emerald: 2,
  slate: 1,
};

const rankedCards = (cards: MonitoringCard[]) =>
  [...cards].sort((left, right) => toneWeight[right.tone] - toneWeight[left.tone]);

const rankedInterventions = (items: InterventionRecommendation[]) =>
  [...items].sort((left, right) => toneWeight[right.tone] - toneWeight[left.tone]);

const formatSigned = (value: number, digits = 1) => {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
};

const buildBodyCompCard = (
  checkIns: CheckIn[],
  bodyWeightTrendModel: BodyWeightTrendModel
): MonitoringCard => {
  const sorted = [...checkIns].sort((left, right) => left.date.localeCompare(right.date)).slice(-3);
  const scaleMetric = bodyCompositionMetricLibrary.find((item) => item.id === "scale-trend");
  const waistMetric = bodyCompositionMetricLibrary.find((item) => item.id === "waist-measure");

  if (sorted.length < 2) {
    return {
      label: "Body comp",
      title: "Check-in trend still building",
      detail: `${scaleMetric?.bestUse ?? "Keep the scale trend consistent."} ${waistMetric?.bestUse ?? ""}`.trim(),
      tone: "slate",
    };
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const waistDelta = Number((last.waist - first.waist).toFixed(1));
  const conditionDelta = Number((last.condition - first.condition).toFixed(1));

  if (waistDelta <= -0.3 && conditionDelta >= 0.3) {
    return {
      label: "Body comp",
      title: "Check-ins confirm the cut",
      detail: `Waist ${formatSigned(waistDelta)} in and condition ${formatSigned(conditionDelta)} across the last ${sorted.length} check-ins. ${scaleMetric?.caution ?? ""}`.trim(),
      tone: "emerald",
    };
  }

  if (waistDelta >= 0.2 && (bodyWeightTrendModel.status === "holding" || bodyWeightTrendModel.status === "gaining")) {
    return {
      label: "Body comp",
      title: "Midsection is not confirming the plan",
      detail: `Waist ${formatSigned(waistDelta)} in while the scale reads ${bodyWeightTrendModel.title}. ${waistMetric?.caution ?? ""}`.trim(),
      tone: "amber",
    };
  }

  return {
    label: "Body comp",
    title: `Waist ${formatSigned(waistDelta)} in, condition ${formatSigned(conditionDelta)}`,
    detail: `${waistMetric?.bestUse ?? "Waist is a secondary confirmation read."} ${scaleMetric?.bestUse ?? ""}`.trim(),
    tone: bodyWeightTrendModel.status === "target-cut" ? "sky" : bodyWeightTrendModel.tone,
  };
};

const buildRecoveryCard = (
  sleepHours: number,
  sleepQuality: number,
  recoveryPressureModel: RecoveryPressureModel,
  primaryLimiter: string
): MonitoringCard => {
  const sleepMetric = biofeedbackMetricLibrary.find((item) => item.id === "sleep-quality");
  const digestionMetric = biofeedbackMetricLibrary.find((item) => item.id === "digestion");

  if (recoveryPressureModel.status === "high" || sleepHours < 6.5 || sleepQuality <= 4) {
    return {
      label: "Recovery signal",
      title: "Recovery biomarkers are under strain",
      detail: `${sleepHours.toFixed(1)}h sleep, quality ${sleepQuality}/10. ${sleepMetric?.coachingUse ?? ""}`.trim(),
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
    };
  }

  if (primaryLimiter === "Digestion") {
    return {
      label: "Recovery signal",
      title: "Digestion is still part of recovery cost",
      detail: `${digestionMetric?.coachingUse ?? "Digestion quality shapes how recoverable the whole day feels."}`,
      tone: "amber",
    };
  }

  return {
    label: "Recovery signal",
    title: recoveryPressureModel.title,
    detail: `${sleepMetric?.label ?? "Sleep quality"} is supportive enough that bigger issues likely live elsewhere right now.`,
    tone: recoveryPressureModel.tone,
  };
};

const buildSignalCard = (
  decisionConfidenceModel: DecisionConfidenceModel,
  bodyWeightTrendModel: BodyWeightTrendModel,
  selectedTrackerMissingFieldsCount: number,
  selectedTrackerExecutionScore: number,
  complianceScore: number
): MonitoringCard => {
  const bodyweightMetric = biomarkerLibrary.find((item) => item.id === "bodyweight-trend");

  if (
    decisionConfidenceModel.status === "low" ||
    selectedTrackerMissingFieldsCount > 0 ||
    selectedTrackerExecutionScore < 70
  ) {
    return {
      label: "Signal quality",
      title: "The decision signal is still fragile",
      detail: `${decisionConfidenceModel.detail} ${bodyweightMetric?.coachingUse ?? ""}`.trim(),
      tone: decisionConfidenceModel.status === "low" ? "amber" : "sky",
    };
  }

  return {
    label: "Signal quality",
    title: decisionConfidenceModel.title,
    detail: `${bodyWeightTrendModel.sampleCount} recent bodyweight samples, compliance ${complianceScore} / 100. The coaching read is usable.`,
    tone: "emerald",
  };
};

const buildConditioningCard = ({
  weeksOut,
  selectedTrackerStepScore,
  bodyWeightTrendModel,
  recoveryPressureModel,
  lowerBodyHighRecoveryCount,
  lowerBodyAnchorCount,
}: Pick<
  MonitoringInput,
  "weeksOut" | "selectedTrackerStepScore" | "bodyWeightTrendModel" | "recoveryPressureModel" | "lowerBodyHighRecoveryCount" | "lowerBodyAnchorCount"
>): MonitoringCard => {
  const inclineWalk = conditioningModalityLibrary.find((item) => item.id === "incline-walk");
  const bike = conditioningModalityLibrary.find((item) => item.id === "bike");
  const stepmill = conditioningModalityLibrary.find((item) => item.id === "stepmill");
  const posing = conditioningModalityLibrary.find((item) => item.id === "posing-rounds");

  if (weeksOut <= 8) {
    return {
      label: "Conditioning",
      title: `${posing?.label ?? "Posing"} counts as prep work`,
      detail: posing?.coachingUse ?? "Sport-specific output should stay visible because it still affects fatigue and readiness.",
      tone: "sky",
    };
  }

  if (recoveryPressureModel.status === "high" || lowerBodyHighRecoveryCount >= 3 || lowerBodyAnchorCount >= 3) {
    return {
      label: "Conditioning",
      title: "If output is added, keep it low impact",
      detail: `${bike?.label ?? "Bike"} or ${inclineWalk?.label ?? "incline walk"} fit better than ${stepmill?.label ?? "stepmill"} when lower-body recovery is already expensive.`,
      tone: "amber",
    };
  }

  if ((bodyWeightTrendModel.status === "holding" || bodyWeightTrendModel.status === "slow-cut") && selectedTrackerStepScore < 8000) {
    return {
      label: "Conditioning",
      title: `${inclineWalk?.label ?? "Incline walk"} is the cleanest next output lever`,
      detail: inclineWalk?.coachingUse ?? "Use the lowest-cost modality first when the trend is moving too slowly.",
      tone: "sky",
    };
  }

  return {
    label: "Conditioning",
    title: "Current output does not need more intensity",
    detail: `${inclineWalk?.label ?? "Incline walk"} stays the default if more output is ever needed. Avoid jumping straight to higher-fatigue conditioning.`,
    tone: "emerald",
  };
};

const pushIntervention = (
  items: InterventionRecommendation[],
  config: {
    interventionId: string;
    title: string;
    detail: string;
    tone: ScienceTone;
    tab: InterventionRecommendation["tab"];
    queuedChange: string;
  }
) => {
  const intervention = coachingInterventionLibrary.find((item) => item.id === config.interventionId);
  if (!intervention) return;

  items.push({
    label: intervention.label,
    title: config.title,
    detail: `${config.detail} Expected readback ${intervention.expectedLagDays}.`,
    tone: config.tone,
    tab: config.tab,
    queuedChange: config.queuedChange,
  });
};

export const buildMonitoringSnapshot = (input: MonitoringInput): MonitoringSnapshot => {
  const {
    trainingDay,
    primaryLimiter,
    weeksOut,
    sleepHours,
    sleepQuality,
    weeklyDensityScore,
    selectedTrackerExecutionScore,
    selectedTrackerMissingFieldsCount,
    selectedTrackerStepScore,
    complianceScore,
    splitAnchorCount,
    splitHighRecoveryCount,
    lowerBodyAnchorCount,
    lowerBodyHighRecoveryCount,
    checkIns,
    bodyWeightTrendModel,
    recoveryPressureModel,
    hydrationSupportModel,
    fuelTimingModel,
    mealPlanScienceProfile,
    decisionConfidenceModel,
  } = input;

  const cards: MonitoringCard[] = [
    buildBodyCompCard(checkIns, bodyWeightTrendModel),
    buildRecoveryCard(sleepHours, sleepQuality, recoveryPressureModel, primaryLimiter),
    buildSignalCard(
      decisionConfidenceModel,
      bodyWeightTrendModel,
      selectedTrackerMissingFieldsCount,
      selectedTrackerExecutionScore,
      complianceScore
    ),
    buildConditioningCard({
      weeksOut,
      selectedTrackerStepScore,
      bodyWeightTrendModel,
      recoveryPressureModel,
      lowerBodyHighRecoveryCount,
      lowerBodyAnchorCount,
    }),
  ];

  const interventions: InterventionRecommendation[] = [];

  if (decisionConfidenceModel.status === "low" || selectedTrackerMissingFieldsCount > 0) {
    const adaptation = adaptationRuleLibrary.find((item) => item.id === "reduce-noise-before-cutting-harder");
    interventions.push({
      label: adaptation?.label ?? "Reduce noise before cutting harder",
      title: "Tighten signal quality before making a bigger change",
      detail: `${adaptation?.adjustment ?? "Clean up adherence and consistency before a bigger move."} ${adaptation?.rationale ?? ""}`.trim(),
      tone: "amber",
      tab: "tracker",
      queuedChange: "Tighten signal quality before making a bigger coaching change.",
    });
  }

  if (primaryLimiter === "Digestion" || mealPlanScienceProfile.status === "digestive-heavy") {
    pushIntervention(interventions, {
      interventionId: "tighten-meal-composition",
      title: "Tighten meal composition",
      detail: "Digestion is expensive enough that the next useful change is usually food composition, not more total pressure.",
      tone: "amber",
      tab: "nutrition",
      queuedChange: "Tighten meal composition and reduce digestive drag.",
    });
  }

  if (trainingDay && fuelTimingModel.status === "underfueled") {
    pushIntervention(interventions, {
      interventionId: "add-training-window-carbs",
      title: "Add training-window support",
      detail: "Session support is too light for the current day, so the app should fix the training window before broad food changes.",
      tone: "emerald",
      tab: "nutrition",
      queuedChange: "Add training-window support before changing total intake.",
    });
  }

  if (
    hydrationSupportModel.status === "low" ||
    hydrationSupportModel.status === "dilute" ||
    mealPlanScienceProfile.status === "electrolyte-light"
  ) {
    pushIntervention(interventions, {
      interventionId: "standardize-fluid-sodium",
      title: "Standardize fluid and sodium",
      detail: "Hydration support is not coherent enough to trust the visual and performance read fully.",
      tone: hydrationSupportModel.status === "low" ? "amber" : "sky",
      tab: "nutrition",
      queuedChange: "Standardize fluid and sodium before chasing sharper adjustments.",
    });
  }

  if (
    (recoveryPressureModel.status === "strained" || recoveryPressureModel.status === "high") &&
    weeklyDensityScore >= 7 &&
    lowerBodyHighRecoveryCount >= 3
  ) {
    pushIntervention(interventions, {
      interventionId: "pull-volume-from-lower",
      title: "Pull lower-body fatigue first",
      detail: "Lower-body work is carrying enough recovery cost that the cleanest structural change is usually subtractive.",
      tone: "amber",
      tab: "split",
      queuedChange: "Pull lower-body fatigue before pushing harder.",
    });
  }

  if (
    splitAnchorCount >= 8 ||
    (splitHighRecoveryCount >= 6 && (primaryLimiter === "Training stress" || recoveryPressureModel.status !== "supported"))
  ) {
    pushIntervention(interventions, {
      interventionId: "swap-to-supported-patterns",
      title: "Swap one slot to a more supported pattern",
      detail: "The split is leaning too hard on expensive anchors, so exercise selection should reduce cost before volume goes up.",
      tone: "sky",
      tab: "library",
      queuedChange: "Swap one expensive slot to a more supported pattern.",
    });
  }

  if (
    (bodyWeightTrendModel.status === "fast-cut" || bodyWeightTrendModel.status === "aggressive-cut") &&
    recoveryPressureModel.status !== "supported"
  ) {
    const adaptation = adaptationRuleLibrary.find((item) => item.id === "protect-output-when-cutting-fast");
    interventions.push({
      label: adaptation?.label ?? "Protect output when the cut is fast",
      title: "Protect output before pushing the cut",
      detail: `${adaptation?.adjustment ?? "Make the smallest possible change that preserves output first."} ${adaptation?.rationale ?? ""}`.trim(),
      tone: "rose",
      tab: "coach",
      queuedChange: "Protect output before pushing the cut harder.",
    });
  }

  if (interventions.length === 0) {
    interventions.push({
      label: "Stable intervention lane",
      title: "No major intervention is needed right now",
      detail: "Current monitoring reads support staying with the existing plan and collecting cleaner signal.",
      tone: "emerald",
      tab: "coach",
      queuedChange: "Hold the current plan and keep collecting clean signal.",
    });
  }

  const orderedCards = rankedCards(cards);
  const orderedInterventions = rankedInterventions(interventions).slice(0, 4);

  return {
    athleteCards: orderedCards.slice(0, 4),
    coachCards: orderedCards.slice(0, 4),
    interventions: orderedInterventions,
  };
};
