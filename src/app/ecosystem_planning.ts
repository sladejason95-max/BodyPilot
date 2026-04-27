import type { ScienceTone } from "./science_model";

export type AthleteLevel = "beginner" | "intermediate" | "advanced";
export type PhaseType = "improvement" | "fat-loss" | "contest-prep" | "peak-week" | "recovery";
export type GoalFocus =
  | "hypertrophy"
  | "stage-readiness"
  | "recomp"
  | "performance-retention"
  | "recovery-capacity";
export type ConditioningPriority = "low" | "moderate" | "high";
export type CheckInCadence = "weekly" | "2x-week" | "3x-week" | "daily";
export type CoachCadence = "weekly" | "2x-week" | "daily";

export type EcosystemPlanSetup = {
  athleteLevel: AthleteLevel;
  phaseType: PhaseType;
  goalFocus: GoalFocus;
  conditioningPriority: ConditioningPriority;
  checkInCadence: CheckInCadence;
  coachCadence: CoachCadence;
  targetStageWeightLb: number;
};

export type EcosystemPlanCard = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type EcosystemPlanSnapshot = {
  phaseBadge: string;
  summary: EcosystemPlanCard;
  cards: EcosystemPlanCard[];
};

export const athleteLevelOptions: { value: AthleteLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const phaseTypeOptions: { value: PhaseType; label: string }[] = [
  { value: "improvement", label: "Improvement" },
  { value: "fat-loss", label: "Fat loss" },
  { value: "contest-prep", label: "Contest prep" },
  { value: "peak-week", label: "Peak week" },
  { value: "recovery", label: "Recovery" },
];

export const goalFocusOptions: { value: GoalFocus; label: string }[] = [
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "stage-readiness", label: "Stage readiness" },
  { value: "recomp", label: "Recomp" },
  { value: "performance-retention", label: "Performance retention" },
  { value: "recovery-capacity", label: "Recovery capacity" },
];

export const conditioningPriorityOptions: { value: ConditioningPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

export const checkInCadenceOptions: { value: CheckInCadence; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "2x-week", label: "2x / week" },
  { value: "3x-week", label: "3x / week" },
  { value: "daily", label: "Daily" },
];

export const coachCadenceOptions: { value: CoachCadence; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "2x-week", label: "2x / week" },
  { value: "daily", label: "Daily" },
];

const phaseLabels: Record<PhaseType, string> = {
  improvement: "Improvement",
  "fat-loss": "Fat loss",
  "contest-prep": "Contest prep",
  "peak-week": "Peak week",
  recovery: "Recovery",
};

const goalLabels: Record<GoalFocus, string> = {
  hypertrophy: "hypertrophy",
  "stage-readiness": "stage readiness",
  recomp: "recomp",
  "performance-retention": "performance retention",
  "recovery-capacity": "recovery capacity",
};

const cadenceLabels: Record<CheckInCadence | CoachCadence, string> = {
  weekly: "weekly",
  "2x-week": "2x / week",
  "3x-week": "3x / week",
  daily: "daily",
};

const conditioningLabels: Record<ConditioningPriority, string> = {
  low: "low-cost output only",
  moderate: "moderate conditioning lane",
  high: "high conditioning emphasis",
};

type EcosystemPlanInput = EcosystemPlanSetup & {
  weeksOut: number;
  bodyWeightLb: number;
  bodyFatPct: number;
};

const getPhaseLevers = (phaseType: PhaseType, goalFocus: GoalFocus, conditioningPriority: ConditioningPriority) => {
  switch (phaseType) {
    case "improvement":
      return `Drive progressive overload, food quality, and a recoverable surplus. Keep conditioning ${conditioningLabels[conditioningPriority]}.`;
    case "fat-loss":
      return `Bias food accuracy, performance retention, and low-cost output. Keep conditioning ${conditioningLabels[conditioningPriority]}.`;
    case "contest-prep":
      return `Keep execution, food consistency, conditioning, and check-in quality synchronized around ${goalLabels[goalFocus]}.`;
    case "peak-week":
      return "Reduce noise, standardize food and fluid structure, and protect look stability instead of chasing extra output.";
    case "recovery":
    default:
      return "Bias sleep, digestion, tissue recovery, and routine rebuilding before pushing harder again.";
  }
};

const getRiskRead = ({
  phaseType,
  athleteLevel,
  conditioningPriority,
  weeksOut,
  bodyWeightLb,
  targetStageWeightLb,
}: Pick<EcosystemPlanInput, "phaseType" | "athleteLevel" | "conditioningPriority" | "weeksOut" | "bodyWeightLb" | "targetStageWeightLb">) => {
  if (phaseType === "peak-week") {
    return {
      title: "Noise control matters more than novelty",
      detail: "Peak-week style phases need fewer moving parts, more consistency, and cleaner read quality.",
      tone: "amber" as const,
    };
  }

  if (phaseType === "contest-prep" && targetStageWeightLb > 0 && weeksOut <= 8 && bodyWeightLb - targetStageWeightLb > 12) {
    return {
      title: "The runway is getting tighter",
      detail: `${Math.round(bodyWeightLb - targetStageWeightLb)} lb still separates current bodyweight from the target stage mark. Use low-cost levers first and avoid panic edits.`,
      tone: "amber" as const,
    };
  }

  if (athleteLevel === "beginner" && (phaseType === "contest-prep" || phaseType === "fat-loss")) {
    return {
      title: "Keep the phase boring enough to follow",
      detail: "Newer athletes usually need fewer levers, tighter routine, and clearer weekly review rather than more complexity.",
      tone: "sky" as const,
    };
  }

  if (phaseType === "improvement" && conditioningPriority === "high") {
    return {
      title: "Conditioning may compete with the main goal",
      detail: "A high-output lane can dilute a growth-focused phase if recovery and food support do not rise with it.",
      tone: "amber" as const,
    };
  }

  return {
    title: "The phase structure is broadly coherent",
    detail: "The setup is simple enough that execution quality should stay more important than constant plan edits.",
    tone: "emerald" as const,
  };
};

export const buildEcosystemPlanSnapshot = (input: EcosystemPlanInput): EcosystemPlanSnapshot => {
  const {
    athleteLevel,
    phaseType,
    goalFocus,
    conditioningPriority,
    checkInCadence,
    coachCadence,
    targetStageWeightLb,
    weeksOut,
    bodyWeightLb,
    bodyFatPct,
  } = input;

  const phaseLabel = phaseLabels[phaseType];
  const urgencyLabel =
    phaseType === "peak-week"
      ? "Peak"
      : phaseType === "contest-prep"
        ? `Prep ${weeksOut > 0 ? `W${weeksOut}` : "Live"}`
        : phaseLabel;

  const primaryLevers = getPhaseLevers(phaseType, goalFocus, conditioningPriority);
  const riskRead = getRiskRead({
    phaseType,
    athleteLevel,
    conditioningPriority,
    weeksOut,
    bodyWeightLb,
    targetStageWeightLb,
  });

  const targetDetail =
    targetStageWeightLb > 0
      ? `${bodyWeightLb.toFixed(1)} lb now, target ${targetStageWeightLb.toFixed(1)} lb.`
      : `${bodyWeightLb.toFixed(1)} lb now at about ${bodyFatPct.toFixed(1)}% body fat.`;

  const cadenceDetail = `Check-ins ${cadenceLabels[checkInCadence]}, coach review ${cadenceLabels[coachCadence]}. Keep photos, scale, and subjective notes on the same rhythm.`;

  const summaryTone: ScienceTone =
    phaseType === "peak-week"
      ? "amber"
      : phaseType === "contest-prep" && weeksOut <= 6
        ? "amber"
        : phaseType === "recovery"
          ? "emerald"
          : "sky";

  const summary: EcosystemPlanCard = {
    label: "Phase plan",
    title: `${phaseLabel} for ${goalLabels[goalFocus]}`,
    detail: `${targetDetail} ${primaryLevers}`,
    tone: summaryTone,
  };

  return {
    phaseBadge: urgencyLabel,
    summary,
    cards: [
      summary,
      {
        label: "Athlete setup",
        title: `${athleteLevel[0].toUpperCase()}${athleteLevel.slice(1)} athlete`,
        detail: `${bodyWeightLb.toFixed(1)} lb, ${bodyFatPct.toFixed(1)}% body fat. Use this as planning context, not false precision.`,
        tone: "slate",
      },
      {
        label: "Cadence",
        title: `${cadenceLabels[checkInCadence]} check-ins`,
        detail: cadenceDetail,
        tone: "sky",
      },
      {
        label: "Risk read",
        title: riskRead.title,
        detail: riskRead.detail,
        tone: riskRead.tone,
      },
    ],
  };
};
