import type {
  BodyWeightTrendModel,
  DecisionConfidenceModel,
  DietPressureModel,
  FuelTimingModel,
  HydrationSupportModel,
  ProteinSupportModel,
  RecoveryPressureModel,
  ScienceTone,
} from "./science_model";

export type RelationshipStrength = "strong" | "moderate" | "weak" | "speculative";
export type RelationshipRole = "background" | "dashboard" | "insight";

export type RelationshipCard = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
  strength: RelationshipStrength;
  role: RelationshipRole;
  source: string;
  target: string;
};

export type RelationshipSnapshot = {
  athleteCards: RelationshipCard[];
  coachCards: RelationshipCard[];
};

type RelationshipInput = {
  trainingDay: boolean;
  primaryLimiter: string;
  selectedTrackerExecutionScore: number;
  selectedTrackerMissedLifts: number;
  complianceScore: number;
  weeklyDensityScore: number;
  bodyWeightTrendModel: BodyWeightTrendModel;
  dietPressureModel: DietPressureModel;
  proteinSupportModel: ProteinSupportModel;
  recoveryPressureModel: RecoveryPressureModel;
  fuelTimingModel: FuelTimingModel;
  hydrationSupportModel: HydrationSupportModel;
  decisionConfidenceModel: DecisionConfidenceModel;
};

const strengthWeight: Record<RelationshipStrength, number> = {
  strong: 4,
  moderate: 3,
  weak: 2,
  speculative: 1,
};

const toneWeight: Record<ScienceTone, number> = {
  rose: 5,
  amber: 4,
  sky: 3,
  emerald: 2,
  slate: 1,
};

const ranked = (cards: RelationshipCard[]) =>
  [...cards].sort((left, right) => {
    const rightScore = strengthWeight[right.strength] * 10 + toneWeight[right.tone];
    const leftScore = strengthWeight[left.strength] * 10 + toneWeight[left.tone];
    return rightScore - leftScore;
  });

export const buildRelationshipSnapshot = (input: RelationshipInput): RelationshipSnapshot => {
  const {
    trainingDay,
    primaryLimiter,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    complianceScore,
    weeklyDensityScore,
    bodyWeightTrendModel,
    dietPressureModel,
    proteinSupportModel,
    recoveryPressureModel,
    fuelTimingModel,
    hydrationSupportModel,
    decisionConfidenceModel,
  } = input;

  const cards: RelationshipCard[] = [];

  if (
    (dietPressureModel.status === "aggressive-deficit" || bodyWeightTrendModel.status === "fast-cut" || bodyWeightTrendModel.status === "aggressive-cut") &&
    (recoveryPressureModel.status === "strained" || recoveryPressureModel.status === "high")
  ) {
    cards.push({
      label: "Diet -> Recovery",
      title: "Cut pace is feeding recovery strain",
      detail: `${bodyWeightTrendModel.title} and ${dietPressureModel.title.toLowerCase()} are amplifying ${recoveryPressureModel.driver}.`,
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
      strength: "strong",
      role: "insight",
      source: "Diet pressure",
      target: "Recovery demand",
    });
  }

  if (trainingDay && (fuelTimingModel.status === "underfueled" || fuelTimingModel.status === "digestion-heavy" || fuelTimingModel.status === "light-post")) {
    cards.push({
      label: "Fuel -> Output",
      title:
        fuelTimingModel.status === "digestion-heavy"
          ? "Meal structure is dragging the session"
          : "Session support is coming in too light",
      detail: `${fuelTimingModel.detail} This mostly shows up as reduced readiness and worse session quality.`,
      tone: fuelTimingModel.tone,
      strength: fuelTimingModel.status === "underfueled" ? "strong" : "moderate",
      role: "dashboard",
      source: "Peri-workout fueling",
      target: "Performance readiness",
    });
  }

  if (proteinSupportModel.status === "low" && (dietPressureModel.status === "moderate-deficit" || dietPressureModel.status === "aggressive-deficit")) {
    cards.push({
      label: "Protein -> Tissue",
      title: "Protein support is lagging diet pressure",
      detail: `${proteinSupportModel.detail} In a deficit context, that mainly threatens lean-mass retention rather than short-term scale movement.`,
      tone: "amber",
      strength: "strong",
      role: "background",
      source: "Protein support",
      target: "Body composition retention",
    });
  }

  if (trainingDay && (hydrationSupportModel.status === "low" || hydrationSupportModel.status === "dilute")) {
    cards.push({
      label: "Hydration -> Readiness",
      title:
        hydrationSupportModel.status === "low"
          ? "Fluid support is limiting the day"
          : "Fluid and electrolytes are out of balance",
      detail: `${hydrationSupportModel.detail} That mostly influences pump, session feel, and perceived readiness.`,
      tone: hydrationSupportModel.tone,
      strength: "moderate",
      role: "dashboard",
      source: "Hydration/electrolytes",
      target: "Readiness",
    });
  }

  if (
    decisionConfidenceModel.status === "low" ||
    selectedTrackerExecutionScore < 70 ||
    selectedTrackerMissedLifts >= 3 ||
    complianceScore < 65
  ) {
    cards.push({
      label: "Compliance -> Decisions",
      title: "Low execution is weakening the coaching call",
      detail: `${decisionConfidenceModel.detail} The plan should change less aggressively until adherence and data quality improve.`,
      tone: decisionConfidenceModel.status === "low" ? "amber" : "sky",
      strength: "strong",
      role: "insight",
      source: "Compliance/data quality",
      target: "Coaching decisions",
    });
  }

  if (dietPressureModel.mismatchWithPlan || bodyWeightTrendModel.status === "holding" || bodyWeightTrendModel.status === "gaining") {
    cards.push({
      label: "Adherence -> Trend",
      title: "The scale trend is not matching the plan",
      detail: `${dietPressureModel.detail} Before the app makes the cut harsher, it should verify adherence and food accuracy.`,
      tone: dietPressureModel.mismatchWithPlan ? "amber" : "sky",
      strength: "moderate",
      role: "insight",
      source: "Adherence/intake accuracy",
      target: "Body composition trend",
    });
  }

  if (primaryLimiter === "Digestion") {
    cards.push({
      label: "Digestion -> Output",
      title: "Digestion is still driving the day",
      detail: "When digestion is the active limiter, food structure influences both session quality and the visual read more than adding more load does.",
      tone: "amber",
      strength: "moderate",
      role: "dashboard",
      source: "Digestion tolerance",
      target: "Performance/look quality",
    });
  }

  if (weeklyDensityScore >= 7 && recoveryPressureModel.status !== "supported") {
    cards.push({
      label: "Split -> Recovery",
      title: "Weekly density is magnifying fatigue cost",
      detail: "The split structure is pushing enough weekly stress that weaker sleep, diet support, or hydration now matters more.",
      tone: "amber",
      strength: "moderate",
      role: "background",
      source: "Training split density",
      target: "Recovery demand",
    });
  }

  if (cards.length === 0) {
    cards.push(
      {
        label: "Split -> Recovery",
        title: "Training load and recovery are broadly aligned",
        detail: "The current week looks supportable enough that the next gains should come from clean execution, not from bigger structural changes.",
        tone: "emerald",
        strength: "moderate",
        role: "dashboard",
        source: "Training split",
        target: "Recovery demand",
      },
      {
        label: "Fuel -> Output",
        title: "Food structure is supporting the day",
        detail: "Peri-workout fuel and the broader day structure look coherent enough for the current training demand.",
        tone: "emerald",
        strength: "moderate",
        role: "dashboard",
        source: "Meal structure",
        target: "Performance readiness",
      },
      {
        label: "Compliance -> Decisions",
        title: "Execution signal is usable",
        detail: "The app has enough adherence and trend signal to make a reasonably clean call without overreacting.",
        tone: "sky",
        strength: "moderate",
        role: "insight",
        source: "Compliance/data quality",
        target: "Coaching decisions",
      }
    );
  }

  const ordered = ranked(cards);

  return {
    athleteCards: ordered.slice(0, 4),
    coachCards: ordered.slice(0, 4),
  };
};
