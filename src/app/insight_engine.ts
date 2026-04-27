import type { AdaptationSnapshot } from "./adaptation_engine";
import type { MealPlanScienceProfile } from "./performance_libraries";
import type {
  BodyWeightTrendModel,
  DecisionConfidenceModel,
  DietPressureModel,
  FuelTimingModel,
  HydrationSupportModel,
  RecoveryPressureModel,
  ScienceTone,
} from "./science_model";

export type InsightConfidence = "guarded" | "moderate" | "high";
export type InsightActionability = "watch" | "act-soon" | "act-now";
export type InsightTab = "dashboard" | "nutrition" | "compounds" | "split" | "tracker" | "schedule" | "coach";

export type PerformanceInsightId =
  | "foundation-guidance"
  | "recovery-bottleneck"
  | "adherence-vs-physiology"
  | "fatigue-masking-fitness"
  | "signal-distortion"
  | "phase-balance"
  | "compound-context"
  | "stable";

export type PerformanceInsightDefinition = {
  id: PerformanceInsightId;
  label: string;
  requiredInputs: string[];
  logicPath: string;
  displayHint: string;
};

export type PerformanceInsightCard = {
  id: PerformanceInsightId;
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
  confidence: InsightConfidence;
  actionability: InsightActionability;
  tab: InsightTab;
};

export type PerformanceInsightSnapshot = {
  athleteCards: PerformanceInsightCard[];
  coachCards: PerformanceInsightCard[];
  workflowItems: PerformanceInsightCard[];
  topInsight: PerformanceInsightCard | null;
};

type InsightInput = {
  trainingDay: boolean;
  weeksOut: number;
  weeklyDensityScore: number;
  primaryLimiter: string;
  sleepHours: number;
  sleepQuality: number;
  selectedTrackerExecutionScore: number;
  selectedTrackerMissedLifts: number;
  selectedTrackerStepScore: number;
  selectedTrackerMissingFieldsCount: number;
  complianceScore: number;
  enabledCompoundCount: number;
  bodyWeightTrendModel: BodyWeightTrendModel;
  dietPressureModel: DietPressureModel;
  recoveryPressureModel: RecoveryPressureModel;
  fuelTimingModel: FuelTimingModel;
  hydrationSupportModel: HydrationSupportModel;
  mealPlanScienceProfile: MealPlanScienceProfile;
  decisionConfidenceModel: DecisionConfidenceModel;
  adaptationSnapshot: AdaptationSnapshot;
  compoundMonitoringFlags: string[];
};

export const performanceInsightDefinitions: PerformanceInsightDefinition[] = [
  {
    id: "foundation-guidance",
    label: "Low-data playbook",
    requiredInputs: ["current goal", "training day", "basic tracker completion", "food and recovery context"],
    logicPath: "When signal quality is thin, give useful default behaviors instead of only asking for more logs.",
    displayHint: "One tile with practical defaults while the model waits for better data.",
  },
  {
    id: "recovery-bottleneck",
    label: "Recovery bottleneck",
    requiredInputs: ["sleep duration/quality", "recovery pressure", "fuel timing", "hydration support", "training density"],
    logicPath: "Identify the strongest recoverability constraint when strain is present, then point the user to the narrowest useful fix.",
    displayHint: "One tile naming the bottleneck and the next move.",
  },
  {
    id: "adherence-vs-physiology",
    label: "Why progress is off",
    requiredInputs: ["execution", "missed lifts", "missing tracker fields", "compliance", "decision confidence", "weight trend", "diet pressure"],
    logicPath: "Separate low-signal adherence noise from a genuine physiology or recovery problem before changing the plan.",
    displayHint: "One tile that says whether this is mainly a compliance problem or a recovery problem.",
  },
  {
    id: "fatigue-masking-fitness",
    label: "Fatigue masking",
    requiredInputs: ["delivered stimulus", "fatigue hotspot", "weekly log coverage", "recovery pressure", "execution"],
    logicPath: "If useful stimulus is being delivered but fatigue cost is high and execution is falling, assume fatigue may be hiding fitness.",
    displayHint: "One tile that protects the user from adding more work too early.",
  },
  {
    id: "signal-distortion",
    label: "Signal distortion",
    requiredInputs: ["hydration/electrolytes", "meal quality", "trend sample depth", "missing day data", "compound context"],
    logicPath: "Flag when bodyweight, look, or performance is likely being distorted by food, fluid, or thin data rather than a true change in condition.",
    displayHint: "One tile telling the user not to overread noisy inputs.",
  },
  {
    id: "phase-balance",
    label: "Phase balance",
    requiredInputs: ["weight-loss pace", "diet pressure", "recovery pressure", "training delivery", "output/steps", "weeks out"],
    logicPath: "Detect when the current phase is too aggressive, too conservative, or poorly balanced for the current support level.",
    displayHint: "One tile that says whether to protect output or add low-cost pressure.",
  },
  {
    id: "compound-context",
    label: "Compound context",
    requiredInputs: ["active compounds", "compound monitoring flags", "hydration support", "recovery pressure"],
    logicPath: "Keep pharmacology as monitoring context that can distort interpretation, without turning it into an automated dosing engine.",
    displayHint: "One guarded tile that warns when drug context can muddy the read.",
  },
  {
    id: "stable",
    label: "Stable read",
    requiredInputs: ["trend", "recovery", "training delivery", "confidence"],
    logicPath: "When nothing important is off, say that clearly and keep the plan boring.",
    displayHint: "One calm tile that prevents unnecessary over-adjustment.",
  },
];

const definitionById = new Map(performanceInsightDefinitions.map((item) => [item.id, item]));

const toneWeight: Record<ScienceTone, number> = {
  rose: 5,
  amber: 4,
  sky: 3,
  emerald: 2,
  slate: 1,
};

const actionWeight: Record<InsightActionability, number> = {
  "act-now": 3,
  "act-soon": 2,
  watch: 1,
};

const confidenceWeight: Record<InsightConfidence, number> = {
  high: 3,
  moderate: 2,
  guarded: 1,
};

const confidenceRank: Record<InsightConfidence, number> = {
  guarded: 1,
  moderate: 2,
  high: 3,
};

const rankToConfidence: Record<number, InsightConfidence> = {
  1: "guarded",
  2: "moderate",
  3: "high",
};

const adjustConfidence = (
  base: InsightConfidence,
  decisionConfidenceModel: DecisionConfidenceModel,
  selectedTrackerMissingFieldsCount: number,
  adaptationCoveragePct?: number
) => {
  let rank = confidenceRank[base];

  if (decisionConfidenceModel.status === "moderate") rank = Math.max(1, rank - 1);
  if (decisionConfidenceModel.status === "low") rank = Math.max(1, rank - 2);
  if (selectedTrackerMissingFieldsCount > 0) rank = Math.max(1, rank - 1);
  if (typeof adaptationCoveragePct === "number" && adaptationCoveragePct < 55) rank = Math.max(1, rank - 1);

  return rankToConfidence[rank] ?? "guarded";
};

const buildCard = (
  id: PerformanceInsightId,
  config: Omit<PerformanceInsightCard, "id" | "label"> & { detail: string }
): PerformanceInsightCard => {
  const definition = definitionById.get(id);

  return {
    id,
    label: definition?.label ?? "Insight",
    title: config.title,
    detail: config.detail.trim(),
    tone: config.tone,
    confidence: config.confidence,
    actionability: config.actionability,
    tab: config.tab,
  };
};

const buildRecoveryBottleneckInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    trainingDay,
    weeklyDensityScore,
    sleepHours,
    sleepQuality,
    recoveryPressureModel,
    fuelTimingModel,
    hydrationSupportModel,
    decisionConfidenceModel,
    selectedTrackerMissingFieldsCount,
    adaptationSnapshot,
  } = input;

  const sleepLimited = sleepHours < 6.5 || sleepQuality <= 4.5;
  const fuelLimited =
    trainingDay &&
    (fuelTimingModel.status === "underfueled" ||
      fuelTimingModel.status === "digestion-heavy" ||
      fuelTimingModel.status === "light-post");
  const hydrationLimited =
    trainingDay &&
    (hydrationSupportModel.status === "low" ||
      hydrationSupportModel.status === "dilute");
  const densityLimited =
    weeklyDensityScore >= 7 || adaptationSnapshot.primaryAction.code === "reduce-fatigue";

  if (
    recoveryPressureModel.status === "supported" &&
    !sleepLimited &&
    !fuelLimited &&
    !hydrationLimited &&
    !densityLimited
  ) {
    return null;
  }

  if (sleepLimited) {
    const confidence = adjustConfidence("high", decisionConfidenceModel, selectedTrackerMissingFieldsCount);
    return buildCard("recovery-bottleneck", {
      title: "Sleep is the clearest recovery bottleneck",
      detail: `${sleepHours.toFixed(1)}h sleep and quality ${sleepQuality}/10. Do not add training stress today; finish the session as written or lower recovery cost if sleep stays under 6.5h.`,
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
      confidence,
      actionability: "act-now",
      tab: "tracker",
    });
  }

  if (fuelLimited) {
    const confidence = adjustConfidence("moderate", decisionConfidenceModel, selectedTrackerMissingFieldsCount);
    return buildCard("recovery-bottleneck", {
      title:
        fuelTimingModel.status === "digestion-heavy"
          ? "Meal structure is adding recovery cost"
          : "Training window needs carbs before diet changes",
      detail:
        fuelTimingModel.status === "digestion-heavy"
          ? `${fuelTimingModel.detail} Lower fats and food volume around training before changing total calories.`
          : `${fuelTimingModel.detail} Add 20-30g carbs in the pre or post window before changing the whole diet.`,
      tone: "amber",
      confidence,
      actionability: "act-now",
      tab: "nutrition",
    });
  }

  if (hydrationLimited) {
    const confidence = adjustConfidence("moderate", decisionConfidenceModel, selectedTrackerMissingFieldsCount);
    return buildCard("recovery-bottleneck", {
      title: "Pair fluid with sodium before reading recovery",
      detail: `${hydrationSupportModel.detail} Pair fluid with sodium now; do not increase water by itself or blame the split first.`,
      tone: "amber",
      confidence,
      actionability: "act-soon",
      tab: "nutrition",
    });
  }

  if (densityLimited) {
    const hotspot = adaptationSnapshot.fatigueHotspot?.region
      ? `${adaptationSnapshot.fatigueHotspot.region} is carrying the highest fatigue cost`
      : "The current weekly density is making recovery expensive";
    const confidence = adjustConfidence(
      adaptationSnapshot.weeklyCoveragePct >= 65 ? "high" : "moderate",
      decisionConfidenceModel,
      selectedTrackerMissingFieldsCount,
      adaptationSnapshot.weeklyCoveragePct
    );

    return buildCard("recovery-bottleneck", {
      title: "Training density is the main recovery bottleneck",
      detail: `${hotspot}. Pull one high-cost slot or reduce sets before adding output anywhere else.`,
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
      confidence,
      actionability: "act-now",
      tab: "split",
    });
  }

  return null;
};

const buildFoundationGuidanceInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    trainingDay,
    primaryLimiter,
    selectedTrackerMissingFieldsCount,
    decisionConfidenceModel,
    bodyWeightTrendModel,
    hydrationSupportModel,
    mealPlanScienceProfile,
  } = input;

  const lowData =
    selectedTrackerMissingFieldsCount > 0 ||
    decisionConfidenceModel.status === "low" ||
    bodyWeightTrendModel.status === "insufficient" ||
    bodyWeightTrendModel.sampleCount < 3;

  if (!lowData) return null;

  const foodAdvice =
    primaryLimiter === "Digestion" || mealPlanScienceProfile.status === "digestive-heavy"
      ? "keep fats and fiber lower around training"
      : trainingDay
        ? "place most carbs around the session"
        : "keep meals simple and repeatable";
  const hydrationAdvice =
    hydrationSupportModel.status === "low" || hydrationSupportModel.status === "dilute"
      ? "pair water with sodium instead of pushing plain water"
      : "keep water and sodium consistent";

  return buildCard("foundation-guidance", {
    title: "Use the default playbook while the read builds",
    detail: `Hold targets steady, hit protein, ${foodAdvice}, finish the planned session, keep steps moving, and ${hydrationAdvice}. Better logs will make the next insight sharper, but this is still a useful day to execute.`,
    tone: selectedTrackerMissingFieldsCount > 0 ? "amber" : "sky",
    confidence: "guarded",
    actionability: "act-soon",
    tab: trainingDay ? "tracker" : "nutrition",
  });
};

const buildAdherenceVsPhysiologyInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    selectedTrackerMissingFieldsCount,
    complianceScore,
    bodyWeightTrendModel,
    dietPressureModel,
    recoveryPressureModel,
    decisionConfidenceModel,
    adaptationSnapshot,
  } = input;

  const lowSignal =
    decisionConfidenceModel.status === "low" ||
    complianceScore < 65 ||
    selectedTrackerExecutionScore < 70 ||
    selectedTrackerMissedLifts >= 3 ||
    selectedTrackerMissingFieldsCount > 0;

  if (
    lowSignal &&
    (dietPressureModel.mismatchWithPlan ||
      bodyWeightTrendModel.status === "holding" ||
      bodyWeightTrendModel.status === "gaining" ||
      selectedTrackerExecutionScore < 70)
  ) {
    const confidence =
      selectedTrackerExecutionScore < 60 || selectedTrackerMissedLifts >= 3
        ? "high"
        : adjustConfidence("moderate", decisionConfidenceModel, selectedTrackerMissingFieldsCount);

    return buildCard("adherence-vs-physiology", {
      title: "This still looks more like adherence noise than physiology",
      detail: `${selectedTrackerExecutionScore}% execution with ${selectedTrackerMissedLifts} open lifts. For now, use the baseline: hit protein, stay near calories, finish the planned work, keep steps moving, and avoid changing calories, water, or training from a noisy read.`,
      tone: selectedTrackerExecutionScore < 50 ? "rose" : "amber",
      confidence,
      actionability: "act-now",
      tab: "tracker",
    });
  }

  if (
    decisionConfidenceModel.status !== "low" &&
    complianceScore >= 70 &&
    (recoveryPressureModel.status === "strained" || recoveryPressureModel.status === "high") &&
    (adaptationSnapshot.primaryAction.code === "reduce-fatigue" ||
      bodyWeightTrendModel.status === "fast-cut" ||
      bodyWeightTrendModel.status === "aggressive-cut")
  ) {
    const confidence = adjustConfidence(
      adaptationSnapshot.weeklyCoveragePct >= 65 ? "high" : "moderate",
      decisionConfidenceModel,
      selectedTrackerMissingFieldsCount,
      adaptationSnapshot.weeklyCoveragePct
    );

    return buildCard("adherence-vs-physiology", {
      title: "Under-recovery is more likely than poor adherence",
      detail: `Compliance is ${complianceScore}/100, so do not frame this as bad tracking. Fix ${recoveryPressureModel.driver} before pushing the plan harder.`,
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
      confidence,
      actionability: "act-now",
      tab: adaptationSnapshot.primaryAction.code === "reduce-fatigue" ? "split" : "nutrition",
    });
  }

  return null;
};

const buildFatigueMaskingInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    selectedTrackerExecutionScore,
    decisionConfidenceModel,
    selectedTrackerMissingFieldsCount,
    recoveryPressureModel,
    adaptationSnapshot,
  } = input;

  if (
    adaptationSnapshot.weeklyCoveragePct < 55 ||
    !adaptationSnapshot.topSupportedRegion ||
    !adaptationSnapshot.fatigueHotspot ||
    (recoveryPressureModel.status === "supported" && adaptationSnapshot.primaryAction.code !== "reduce-fatigue") ||
    selectedTrackerExecutionScore >= 90
  ) {
    return null;
  }

  const supportedRegion = adaptationSnapshot.topSupportedRegion.region;
  const hotspotRegion = adaptationSnapshot.fatigueHotspot.region;
  const sameRegion = supportedRegion === hotspotRegion;
  const confidence = adjustConfidence(
    adaptationSnapshot.weeklyCoveragePct >= 70 ? "high" : "moderate",
    decisionConfidenceModel,
    selectedTrackerMissingFieldsCount,
    adaptationSnapshot.weeklyCoveragePct
  );

  return buildCard("fatigue-masking-fitness", {
    title: "Fatigue is masking usable fitness",
    detail: sameRegion
      ? `${supportedRegion} is receiving usable work, but it is also the main fatigue hotspot. Reduce cost before deciding it needs more volume.`
      : `${supportedRegion} is being delivered, but ${hotspotRegion} is carrying the highest fatigue cost. Reduce the expensive lane before pushing the whole week harder.`,
    tone: "amber",
    confidence,
    actionability: "act-soon",
    tab: "split",
  });
};

const buildSignalDistortionInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    trainingDay,
    enabledCompoundCount,
    bodyWeightTrendModel,
    hydrationSupportModel,
    mealPlanScienceProfile,
    decisionConfidenceModel,
    selectedTrackerMissingFieldsCount,
    compoundMonitoringFlags,
  } = input;

  const reasons: string[] = [];
  const hydrationOff =
    hydrationSupportModel.status === "low" ||
    hydrationSupportModel.status === "dilute" ||
    hydrationSupportModel.status === "heavy";
  const mealFlowOff =
    mealPlanScienceProfile.status === "digestive-heavy" ||
    mealPlanScienceProfile.status === "electrolyte-light" ||
    mealPlanScienceProfile.status === "partial";
  const trendThin = bodyWeightTrendModel.sampleCount < 5 || bodyWeightTrendModel.daySpan < 7;
  const compoundNoise = enabledCompoundCount > 0 && compoundMonitoringFlags.length > 0;

  if (hydrationOff) reasons.push("fluid/electrolyte support is not stable");
  if (mealFlowOff) reasons.push("the meal map is still noisy");
  if (trendThin) reasons.push("the scale trend is still shallow");
  if (selectedTrackerMissingFieldsCount > 0) reasons.push("today's tracker signal is incomplete");
  if (compoundNoise) reasons.push("compound context can distort look and recovery");

  if (reasons.length < 2 && !(trainingDay && hydrationOff && mealFlowOff)) {
    return null;
  }

  const confidence =
    reasons.length >= 3
      ? adjustConfidence("high", decisionConfidenceModel, selectedTrackerMissingFieldsCount)
      : adjustConfidence("moderate", decisionConfidenceModel, selectedTrackerMissingFieldsCount);

  return buildCard("signal-distortion", {
    title: "Food, fluid, or data noise is distorting the read",
    detail: `${reasons[0]?.charAt(0).toUpperCase()}${reasons[0]?.slice(1) ?? "Signal quality is noisy"}, and ${reasons[1] ?? "today's read is not fully clean"}. Do not change calories from one weigh-in; log food, fluid, and the tracker first.`,
    tone: hydrationOff || mealFlowOff ? "amber" : "sky",
    confidence,
    actionability: "act-soon",
    tab: compoundNoise && !hydrationOff && !mealFlowOff ? "compounds" : "nutrition",
  });
};

const buildPhaseBalanceInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    weeksOut,
    selectedTrackerStepScore,
    complianceScore,
    bodyWeightTrendModel,
    recoveryPressureModel,
    decisionConfidenceModel,
    selectedTrackerMissingFieldsCount,
    adaptationSnapshot,
  } = input;

  if (
    (bodyWeightTrendModel.status === "fast-cut" || bodyWeightTrendModel.status === "aggressive-cut") &&
    (recoveryPressureModel.status !== "supported" || adaptationSnapshot.deliveryPct < 85)
  ) {
    const confidence = adjustConfidence(
      adaptationSnapshot.weeklyCoveragePct >= 60 ? "high" : "moderate",
      decisionConfidenceModel,
      selectedTrackerMissingFieldsCount,
      adaptationSnapshot.weeklyCoveragePct
    );

    return buildCard("phase-balance", {
      title: "The phase is outrunning performance support",
      detail: `Trend pace is ${bodyWeightTrendModel.title} and tracked delivery is ${adaptationSnapshot.deliveryPct}%. Hold the cut pressure and protect output before pulling more food.`,
      tone: bodyWeightTrendModel.status === "aggressive-cut" ? "rose" : "amber",
      confidence,
      actionability: "act-now",
      tab: "nutrition",
    });
  }

  if (
    decisionConfidenceModel.status !== "low" &&
    complianceScore >= 70 &&
    recoveryPressureModel.status === "supported" &&
    (bodyWeightTrendModel.status === "holding" || bodyWeightTrendModel.status === "slow-cut") &&
    selectedTrackerStepScore < 8000 &&
    weeksOut <= 14
  ) {
    const confidence = adjustConfidence("moderate", decisionConfidenceModel, selectedTrackerMissingFieldsCount);
    return buildCard("phase-balance", {
      title: "Add output before cutting food harder",
      detail: `Trend pace is ${bodyWeightTrendModel.title}, recovery is still supported, and output is only ${selectedTrackerStepScore} steps today. Add low-cost output before harsher food cuts.`,
      tone: "sky",
      confidence,
      actionability: "act-soon",
      tab: "tracker",
    });
  }

  return null;
};

const buildCompoundContextInsight = (input: InsightInput): PerformanceInsightCard | null => {
  const {
    enabledCompoundCount,
    hydrationSupportModel,
    recoveryPressureModel,
    decisionConfidenceModel,
    selectedTrackerMissingFieldsCount,
    compoundMonitoringFlags,
  } = input;

  if (
    enabledCompoundCount === 0 ||
    compoundMonitoringFlags.length === 0 ||
    (hydrationSupportModel.status === "aligned" && recoveryPressureModel.status === "supported")
  ) {
    return null;
  }

  const confidence = adjustConfidence("guarded", decisionConfidenceModel, selectedTrackerMissingFieldsCount);

  return buildCard("compound-context", {
    title: "Drug context is muddying the interpretation",
    detail: `${compoundMonitoringFlags[0] ?? "Active compounds can distort look, output, or recovery feel."} Do not change the plan from drug context alone; check BP, sleep, pump, and hydration first.`,
    tone: recoveryPressureModel.status === "high" ? "amber" : "sky",
    confidence,
    actionability: "watch",
    tab: "compounds",
  });
};

const buildStableInsight = (input: InsightInput): PerformanceInsightCard =>
  buildCard("stable", {
    title: "The current signal is coherent enough to stay boring",
    detail: `Trend pace ${input.bodyWeightTrendModel.title}, recovery ${input.recoveryPressureModel.title.toLowerCase()}, and tracked delivery ${input.adaptationSnapshot.deliveryPct}%. Hold targets and execute the next day cleanly.`,
    tone: "emerald",
    confidence: input.decisionConfidenceModel.status === "high" ? "high" : "moderate",
    actionability: "watch",
    tab: "dashboard",
  });

const rankInsights = (items: PerformanceInsightCard[]) =>
  [...items].sort((left, right) => {
    const rightScore =
      toneWeight[right.tone] * 100 +
      actionWeight[right.actionability] * 10 +
      confidenceWeight[right.confidence];
    const leftScore =
      toneWeight[left.tone] * 100 +
      actionWeight[left.actionability] * 10 +
      confidenceWeight[left.confidence];

    return rightScore - leftScore;
  });

export const buildPerformanceInsightSnapshot = (input: InsightInput): PerformanceInsightSnapshot => {
  const candidateInsights = [
    buildFoundationGuidanceInsight(input),
    buildRecoveryBottleneckInsight(input),
    buildAdherenceVsPhysiologyInsight(input),
    buildFatigueMaskingInsight(input),
    buildSignalDistortionInsight(input),
    buildPhaseBalanceInsight(input),
    buildCompoundContextInsight(input),
  ].filter(Boolean) as PerformanceInsightCard[];

  const uniqueInsights = Array.from(
    new Map(candidateInsights.map((item) => [item.id, item])).values()
  );

  const orderedInsights = rankInsights(uniqueInsights);
  const cards = orderedInsights.length > 0 ? orderedInsights.slice(0, 4) : [buildStableInsight(input)];
  const workflowItems = orderedInsights.filter((item) => item.actionability !== "watch").slice(0, 2);

  return {
    athleteCards: cards,
    coachCards: cards,
    workflowItems,
    topInsight: cards[0] ?? null,
  };
};
