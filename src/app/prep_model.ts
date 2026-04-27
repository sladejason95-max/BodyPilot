import type {
  AthleteLevel,
  CheckInCadence,
  CoachCadence,
  ConditioningPriority,
  GoalFocus,
  PhaseType,
} from "./ecosystem_planning";

export type PrepModelTone = "slate" | "sky" | "emerald" | "amber" | "rose";
export type PrepSplitTemplateId = "ppl6" | "upperlower" | "hful" | "arnold" | "bro";

export type ContestPrepPhase = {
  id: string;
  label: string;
  window: string;
  focus: string;
  calories: number;
  carbs: number;
  cardioMinutes: number;
  steps: number;
  tone: PrepModelTone;
};

export type ContestPrepModel = {
  headline: string;
  detail: string;
  weeklyLossTargetPct: number;
  maintenanceCalories: number;
  plannedDeficitCalories: number;
  calorieErrorBufferPct: number;
  calorieErrorBufferCalories: number;
  targetStageWeightLb: number;
  planningTargetWeightLb: number;
  goalOvershootBufferLb: number;
  splitTemplateId: PrepSplitTemplateId;
  coachingCadenceLabel: string;
  todayTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    steps: number;
    cardioMinutes: number;
    intraCarbs: number;
    waterLiters: number;
    saltTsp: number;
  };
  phases: ContestPrepPhase[];
  guardrails: string[];
};

type ContestPrepModelInput = {
  athleteLevel: AthleteLevel;
  phaseType: PhaseType;
  goalFocus: GoalFocus;
  conditioningPriority: ConditioningPriority;
  checkInCadence: CheckInCadence;
  coachCadence: CoachCadence;
  weeksOut: number;
  bodyWeightLb: number;
  bodyFatPct: number;
  targetStageWeightLb: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const roundToNearestFive = (value: number) => Math.round(value / 5) * 5;
const roundToNearestHalf = (value: number) => Math.round(value * 2) / 2;
const formatWeekWindow = (start: number, end: number) => {
  const safeStart = Math.max(1, Math.min(start, end));
  const safeEnd = Math.max(1, Math.max(start, end));
  return safeStart === safeEnd ? `Week ${safeStart}` : `Weeks ${safeStart}-${safeEnd}`;
};

const cadenceLabelMap: Record<CheckInCadence | CoachCadence, string> = {
  weekly: "weekly",
  "2x-week": "2x / week",
  "3x-week": "3x / week",
  daily: "daily",
};

const conditioningStepBase: Record<ConditioningPriority, number> = {
  low: 8000,
  moderate: 10000,
  high: 12000,
};

const conditioningCardioBase: Record<ConditioningPriority, number> = {
  low: 20,
  moderate: 30,
  high: 40,
};

const chooseSplitTemplate = ({
  athleteLevel,
  phaseType,
  conditioningPriority,
  weeksOut,
  goalFocus,
}: Pick<ContestPrepModelInput, "athleteLevel" | "phaseType" | "conditioningPriority" | "weeksOut" | "goalFocus">): PrepSplitTemplateId => {
  if (phaseType === "peak-week" || phaseType === "recovery") return "upperlower";
  if (phaseType === "improvement") return athleteLevel === "advanced" ? "arnold" : "ppl6";
  if (phaseType === "fat-loss") return conditioningPriority === "high" ? "upperlower" : "hful";
  if (weeksOut <= 6 && conditioningPriority !== "low") return "upperlower";
  if (athleteLevel === "beginner") return "upperlower";
  if (athleteLevel === "intermediate") return conditioningPriority === "high" ? "hful" : "ppl6";
  return goalFocus === "performance-retention" ? "hful" : "ppl6";
};

const getWeeklyLossTargetPct = ({
  athleteLevel,
  phaseType,
  conditioningPriority,
  weeksOut,
  bodyWeightLb,
  targetStageWeightLb,
}: Pick<ContestPrepModelInput, "athleteLevel" | "phaseType" | "conditioningPriority" | "weeksOut" | "bodyWeightLb" | "targetStageWeightLb">) => {
  if (phaseType === "improvement" || phaseType === "recovery") return 0;
  if (phaseType === "peak-week") return 0.2;

  const planningTargetWeightLb = getPlanningTargetWeightLb({ phaseType, weeksOut, bodyWeightLb, targetStageWeightLb });
  const weightGap = Math.max(0, bodyWeightLb - planningTargetWeightLb);
  const requiredLossPerWeek = weeksOut > 0 ? weightGap / weeksOut : weightGap;
  const urgencyBump = requiredLossPerWeek >= 1.45 ? 0.18 : requiredLossPerWeek >= 1.05 ? 0.1 : requiredLossPerWeek >= 0.75 ? 0.04 : 0;
  const athleteAdjustment = athleteLevel === "beginner" ? -0.05 : athleteLevel === "advanced" ? 0.04 : 0;
  const conditioningAdjustment = conditioningPriority === "high" ? 0.05 : conditioningPriority === "low" ? -0.04 : 0;
  const phaseBase = phaseType === "contest-prep" ? 0.68 : 0.52;

  return Number(clamp(phaseBase + urgencyBump + athleteAdjustment + conditioningAdjustment, 0.45, 1.08).toFixed(2));
};

const getGoalOvershootBufferLb = ({
  phaseType,
  weeksOut,
  bodyWeightLb,
  targetStageWeightLb,
}: Pick<ContestPrepModelInput, "phaseType" | "weeksOut" | "bodyWeightLb" | "targetStageWeightLb">) => {
  if ((phaseType !== "contest-prep" && phaseType !== "fat-loss") || targetStageWeightLb <= 0) return 0;

  const baseBuffer = clamp(bodyWeightLb * 0.02, 3, 6);
  const runwayBuffer = weeksOut >= 12 ? 1 : weeksOut <= 4 ? -0.5 : 0;
  const availableGap = Math.max(0, bodyWeightLb - targetStageWeightLb);
  const gapAllowance = availableGap >= 8 ? 1 : availableGap >= 4 ? 0.5 : 0;

  return roundToNearestHalf(clamp(baseBuffer + runwayBuffer + gapAllowance, 2.5, 7));
};

const getPlanningTargetWeightLb = (input: Pick<ContestPrepModelInput, "phaseType" | "weeksOut" | "bodyWeightLb" | "targetStageWeightLb">) =>
  Number(Math.max(0, input.targetStageWeightLb - getGoalOvershootBufferLb(input)).toFixed(1));

const getCalorieErrorBufferPct = (phaseType: PhaseType, weeksOut: number) => {
  if (phaseType === "contest-prep") return weeksOut <= 6 ? 10 : 8;
  if (phaseType === "fat-loss") return 7;
  if (phaseType === "peak-week") return 5;
  return 0;
};

const buildPhaseBlocks = ({
  phaseType,
  weeksOut,
  calories,
  carbs,
  cardioMinutes,
  steps,
}: {
  phaseType: PhaseType;
  weeksOut: number;
  calories: number;
  carbs: number;
  cardioMinutes: number;
  steps: number;
}) => {
  if (phaseType === "improvement") {
    return [
      {
        id: "improve-runway",
        label: "Runway",
        window: weeksOut > 0 ? `Weeks ${Math.max(weeksOut - 5, 1)}-${weeksOut}` : "Current block",
        focus: "Drive training performance, keep food stable, and let conditioning stay background support.",
        calories: calories + 150,
        carbs: carbs + 25,
        cardioMinutes: Math.max(10, cardioMinutes - 10),
        steps: Math.max(7000, steps - 1000),
        tone: "sky" as const,
      },
      {
        id: "improve-build",
        label: "Build",
        window: "Next block",
        focus: "Keep the split recoverable and push load, density, and execution before chasing more complexity.",
        calories: calories + 100,
        carbs,
        cardioMinutes: Math.max(10, cardioMinutes - 5),
        steps,
        tone: "emerald" as const,
      },
    ];
  }

  const peakWindow = weeksOut <= 1 ? "This week" : "Final week";
  return [
    {
      id: "prep-stabilize",
      label: "Stabilize",
      window: weeksOut > 12 ? formatWeekWindow(Math.max(weeksOut - 3, 9), weeksOut) : "Now",
      focus: "Establish a boring, repeatable routine with enough food structure to trust the weekly read.",
      calories: calories + (weeksOut > 12 ? 100 : 0),
      carbs: carbs + (weeksOut > 12 ? 20 : 0),
      cardioMinutes: Math.max(15, cardioMinutes - 10),
      steps: Math.max(7000, steps - 1000),
      tone: "sky" as const,
    },
    {
      id: "prep-push",
      label: "Push",
      window: weeksOut > 7 ? formatWeekWindow(Math.max(weeksOut - 2, 5), Math.max(weeksOut - 1, 5)) : "Current push",
      focus: "Let the deficit do its work, keep cardio progressive, and review weekly without panic edits.",
      calories,
      carbs,
      cardioMinutes,
      steps,
      tone: "emerald" as const,
    },
    {
      id: "prep-refine",
      label: "Refine",
      window: weeksOut > 3 ? formatWeekWindow(Math.max(weeksOut - 4, 2), Math.max(weeksOut - 3, 2)) : "Final refinement",
      focus: "Tighten food flow, protect recovery, and make only the smallest useful adjustments.",
      calories: Math.max(calories - 100, 1700),
      carbs: Math.max(carbs - 20, 80),
      cardioMinutes: cardioMinutes + 10,
      steps: steps + 1000,
      tone: "amber" as const,
    },
    {
      id: "prep-peak",
      label: "Peak-ready",
      window: peakWindow,
      focus: "Remove noise, prioritize look stability, and preserve recovery instead of trying to force more output.",
      calories: Math.max(calories - 50, 1700),
      carbs: Math.max(carbs - 10, 90),
      cardioMinutes: Math.max(15, cardioMinutes - 10),
      steps,
      tone: "rose" as const,
    },
  ];
};

export const buildContestPrepModel = (input: ContestPrepModelInput): ContestPrepModel => {
  const {
    athleteLevel,
    phaseType,
    goalFocus,
    conditioningPriority,
    checkInCadence,
    coachCadence,
    weeksOut,
    bodyWeightLb,
    bodyFatPct,
    targetStageWeightLb,
  } = input;

  const leanMassEstimate = bodyWeightLb * (1 - bodyFatPct / 100);
  const maintenanceMultiplier =
    athleteLevel === "advanced" ? 16.2 : athleteLevel === "intermediate" ? 15.6 : 15.1;
  const maintenanceCalories = roundToNearestFive(
    bodyWeightLb * maintenanceMultiplier +
      (conditioningPriority === "high" ? 160 : conditioningPriority === "moderate" ? 80 : 0)
  );
  const goalOvershootBufferLb = getGoalOvershootBufferLb({
    phaseType,
    weeksOut,
    bodyWeightLb,
    targetStageWeightLb,
  });
  const planningTargetWeightLb = Number((targetStageWeightLb - goalOvershootBufferLb).toFixed(1));
  const calorieErrorBufferPct = getCalorieErrorBufferPct(phaseType, weeksOut);
  const calorieErrorBufferCalories = roundToNearestFive(maintenanceCalories * (calorieErrorBufferPct / 100));
  const weeklyLossTargetPct = getWeeklyLossTargetPct(input);
  const baseDeficitCalories = roundToNearestFive(bodyWeightLb * weeklyLossTargetPct * 4.95);
  const minimumDeficitCalories =
    phaseType === "contest-prep"
      ? weeksOut <= 6
        ? 650
        : 525
      : phaseType === "fat-loss"
        ? 425
        : phaseType === "peak-week"
          ? 250
          : 0;
  const plannedDeficitCalories =
    phaseType === "improvement" || phaseType === "recovery"
      ? 0
      : Math.max(baseDeficitCalories + calorieErrorBufferCalories, minimumDeficitCalories);
  const targetCalories =
    phaseType === "improvement"
      ? maintenanceCalories + 125
      : phaseType === "recovery"
        ? maintenanceCalories
        : Math.max(maintenanceCalories - plannedDeficitCalories, 1600);

  const protein = roundToNearestFive(
    clamp(Math.max(bodyWeightLb * 0.95, leanMassEstimate * 1.22, targetStageWeightLb * 1.05), 160, 320)
  );
  const fats = roundToNearestFive(
    clamp(
      phaseType === "improvement"
        ? bodyWeightLb * 0.32
        : phaseType === "recovery"
          ? bodyWeightLb * 0.3
          : targetStageWeightLb * 0.26,
      45,
      95
    )
  );
  const carbs = roundToNearestFive(
    Math.max(
      Math.round((targetCalories - protein * 4 - fats * 9) / 4),
      phaseType === "improvement" ? 180 : phaseType === "peak-week" ? 110 : 80
    )
  );

  const steps = conditioningStepBase[conditioningPriority] + (weeksOut <= 6 && phaseType === "contest-prep" ? 1000 : 0);
  const cardioMinutes =
    phaseType === "improvement"
      ? Math.max(10, conditioningCardioBase[conditioningPriority] - 15)
      : phaseType === "recovery"
        ? Math.max(15, conditioningCardioBase[conditioningPriority] - 10)
        : phaseType === "peak-week"
          ? Math.max(15, conditioningCardioBase[conditioningPriority] - 10)
          : conditioningCardioBase[conditioningPriority] + (weeksOut <= 8 ? 10 : 0);
  const intraCarbs =
    phaseType === "contest-prep" || goalFocus === "performance-retention"
      ? conditioningPriority === "high"
        ? 40
        : 30
      : 25;
  const waterLiters = Number(clamp(Number((bodyWeightLb / 50).toFixed(1)), 3.0, 6.0).toFixed(1));
  const saltTsp = Number((conditioningPriority === "high" ? 1.75 : 1.5).toFixed(2));
  const splitTemplateId = chooseSplitTemplate({
    athleteLevel,
    phaseType,
    conditioningPriority,
    weeksOut,
    goalFocus,
  });

  const headline =
    phaseType === "contest-prep"
      ? weeksOut <= 1
        ? "Peak-ready contest structure"
        : `${weeksOut} weeks of staged prep direction`
      : phaseType === "fat-loss"
        ? "Fat-loss structure with contest-level discipline"
        : phaseType === "improvement"
          ? "Improvement setup with prep-compatible guardrails"
          : phaseType === "recovery"
            ? "Recovery-first reset block"
            : "Peak-week control block";

  const detail =
    phaseType === "contest-prep"
      ? `${bodyWeightLb.toFixed(1)} lb now. BodyPilot plans to ${planningTargetWeightLb.toFixed(1)} lb, ${goalOvershootBufferLb.toFixed(1)} lb under the stated ${targetStageWeightLb.toFixed(1)} lb target, with an ${calorieErrorBufferPct}% tracking-error reserve built into calories.`
      : `Use ${cadenceLabelMap[checkInCadence]} check-ins and ${cadenceLabelMap[coachCadence]} coaching review to keep the block controlled and recoverable.`;

  return {
    headline,
    detail,
    weeklyLossTargetPct,
    maintenanceCalories,
    plannedDeficitCalories,
    calorieErrorBufferPct,
    calorieErrorBufferCalories,
    targetStageWeightLb,
    planningTargetWeightLb,
    goalOvershootBufferLb,
    splitTemplateId,
    coachingCadenceLabel: `${cadenceLabelMap[checkInCadence]} check-ins, ${cadenceLabelMap[coachCadence]} coach review`,
    todayTargets: {
      calories: targetCalories,
      protein,
      carbs,
      fats,
      steps,
      cardioMinutes,
      intraCarbs,
      waterLiters,
      saltTsp,
    },
    phases: buildPhaseBlocks({
      phaseType,
      weeksOut,
      calories: targetCalories,
      carbs,
      cardioMinutes,
      steps,
    }),
    guardrails: [
      phaseType === "contest-prep"
        ? `Loss pace target ${weeklyLossTargetPct.toFixed(2)}% / week. Only push harder when adherence and recovery are both clean.`
        : "Do not use food changes to solve what is actually a sleep, stress, or routine problem.",
      `Split default: ${splitTemplateId === "ppl6" ? "Push / Pull / Legs" : splitTemplateId === "upperlower" ? "Upper / Lower" : splitTemplateId === "hful" ? "High-frequency upper / lower" : splitTemplateId === "arnold" ? "Arnold-style split" : "Bro split"} with fatigue guardrails built in.`,
      `Progressive output lane: ${steps.toLocaleString()} steps and about ${cardioMinutes} minutes of conditioning on the current setup.`,
    ],
  };
};
