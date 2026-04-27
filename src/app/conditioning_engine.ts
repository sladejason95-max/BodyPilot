import { conditioningModalityLibrary } from "./performance_libraries";
import type { AdaptationSnapshot } from "./adaptation_engine";
import type { ConditioningPriority, PhaseType } from "./ecosystem_planning";
import type {
  BodyWeightTrendModel,
  RecoveryPressureModel,
  ScienceTone,
} from "./science_model";
import type { TrackerDay } from "./types";

export type ConditioningCard = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type ConditioningPrimaryAction = {
  title: string;
  detail: string;
  tone: ScienceTone;
  tab: "tracker" | "schedule" | "split";
};

export type ConditioningSnapshot = {
  todayMinutes: number;
  weeklyMinutes: number;
  weeklyPosingRounds: number;
  currentModalityLabel: string;
  interferenceRisk: "low" | "moderate" | "high";
  preferredModalityLabel: string;
  flags: string[];
  cards: ConditioningCard[];
  primaryAction: ConditioningPrimaryAction;
};

type ConditioningInput = {
  trackerDays: TrackerDay[];
  selectedTrackerDay: TrackerDay | null;
  selectedTrackerStepScore: number;
  phaseType: PhaseType;
  conditioningPriority: ConditioningPriority;
  weeksOut: number;
  bodyWeightTrendModel: BodyWeightTrendModel;
  recoveryPressureModel: RecoveryPressureModel;
  adaptationSnapshot: AdaptationSnapshot;
};

const lowerBodyRegions = new Set(["Quads", "Hamstrings", "Glutes", "Calves"]);

const priorityWeeklyTargets: Record<ConditioningPriority, number> = {
  low: 60,
  moderate: 105,
  high: 150,
};

const parsePositive = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toneFromInterference = (value: "low" | "moderate" | "high"): ScienceTone => {
  if (value === "high") return "rose";
  if (value === "moderate") return "amber";
  return "emerald";
};

const getRecentDays = (trackerDays: TrackerDay[]) =>
  [...trackerDays]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-7);

const getCurrentModality = (selectedTrackerDay: TrackerDay | null) =>
  conditioningModalityLibrary.find((item) => item.id === selectedTrackerDay?.conditioningModalityId) ?? null;

const getPreferredModality = (
  adaptationSnapshot: AdaptationSnapshot,
  recoveryPressureModel: RecoveryPressureModel,
  weeksOut: number
) => {
  if (weeksOut <= 8) {
    return conditioningModalityLibrary.find((item) => item.id === "posing-rounds")
      ?? conditioningModalityLibrary[0];
  }

  const lowerBodyStrained =
    adaptationSnapshot.primaryAction.code === "reduce-fatigue" &&
    lowerBodyRegions.has(adaptationSnapshot.fatigueHotspot?.region ?? "");

  if (lowerBodyStrained || recoveryPressureModel.status === "high") {
    return conditioningModalityLibrary.find((item) => item.id === "bike")
      ?? conditioningModalityLibrary[0];
  }

  return conditioningModalityLibrary.find((item) => item.id === "incline-walk")
    ?? conditioningModalityLibrary[0];
};

export const buildConditioningSnapshot = (input: ConditioningInput): ConditioningSnapshot => {
  const {
    trackerDays,
    selectedTrackerDay,
    selectedTrackerStepScore,
    phaseType,
    conditioningPriority,
    weeksOut,
    bodyWeightTrendModel,
    recoveryPressureModel,
    adaptationSnapshot,
  } = input;

  const currentModality = getCurrentModality(selectedTrackerDay);
  const preferredModality = getPreferredModality(adaptationSnapshot, recoveryPressureModel, weeksOut);
  const todayMinutes = parsePositive(selectedTrackerDay?.conditioningMinutes);
  const todayPosingRounds = parsePositive(selectedTrackerDay?.posingRounds);
  const recentDays = getRecentDays(trackerDays);
  const weeklyMinutes = recentDays.reduce((sum, day) => sum + parsePositive(day.conditioningMinutes), 0);
  const weeklyPosingRounds = recentDays.reduce((sum, day) => sum + parsePositive(day.posingRounds), 0);
  const weeklyTarget = priorityWeeklyTargets[conditioningPriority];
  const lowerBodyStrained =
    adaptationSnapshot.primaryAction.code === "reduce-fatigue" &&
    lowerBodyRegions.has(adaptationSnapshot.fatigueHotspot?.region ?? "");

  const interferenceRisk: "low" | "moderate" | "high" =
    currentModality?.lowerBodyInterference === "high" ||
    (lowerBodyStrained && (currentModality?.lowerBodyInterference === "moderate" || todayMinutes >= 35))
      ? "high"
      : currentModality?.lowerBodyInterference === "moderate" || (todayMinutes >= 35 && recoveryPressureModel.status !== "supported")
        ? "moderate"
        : "low";

  let primaryAction: ConditioningPrimaryAction = {
    title: "Conditioning lane is broadly coherent",
    detail: "Current output is not the first place the plan needs a change.",
    tone: "emerald",
    tab: "tracker",
  };

  if (
    (phaseType === "contest-prep" || phaseType === "fat-loss") &&
    conditioningPriority !== "low" &&
    weeklyMinutes < weeklyTarget &&
    selectedTrackerStepScore < 9000 &&
    (bodyWeightTrendModel.status === "holding" || bodyWeightTrendModel.status === "slow-cut") &&
    recoveryPressureModel.status !== "high"
  ) {
    primaryAction = {
      title: `Add a low-cost ${preferredModality.label.toLowerCase()} lane`,
      detail: `Weekly conditioning is only ${weeklyMinutes} min against a ${weeklyTarget} min ${conditioningPriority}-priority lane. Add the lowest-cost output before cutting food harder.`,
      tone: "sky",
      tab: "tracker",
    };
  } else if (
    interferenceRisk === "high" &&
    (lowerBodyStrained || recoveryPressureModel.status === "strained" || recoveryPressureModel.status === "high")
  ) {
    primaryAction = {
      title: "Conditioning is colliding with recovery",
      detail: `${currentModality?.label ?? "Current conditioning"} is expensive for the current lower-body and recovery read. Reduce cost before pushing more output.`,
      tone: "amber",
      tab: "tracker",
    };
  } else if (
    phaseType === "peak-week" &&
    (todayMinutes >= 35 || currentModality?.intensityLane === "interval" || currentModality?.id === "stepmill")
  ) {
    primaryAction = {
      title: "Peak-week output should stay boring",
      detail: "Keep conditioning low-noise and presentation-friendly instead of chasing extra fatigue.",
      tone: "amber",
      tab: "schedule",
    };
  } else if (
    weeksOut <= 8 &&
    weeklyPosingRounds < 4 &&
    (phaseType === "contest-prep" || phaseType === "peak-week")
  ) {
    primaryAction = {
      title: "Posing work is too quiet for the current runway",
      detail: `${weeklyPosingRounds} posing rounds are logged this week. Presentation practice should stay visible close to show.`,
      tone: "sky",
      tab: "tracker",
    };
  }

  const flags = [
    primaryAction.tone !== "emerald" ? primaryAction.detail : "",
    interferenceRisk === "high" ? "Current conditioning choice is too expensive for the lower-body recovery read." : "",
    phaseType === "peak-week" && todayMinutes >= 35 ? "Conditioning volume is high for a peak-week style phase." : "",
    (phaseType === "contest-prep" || phaseType === "fat-loss") && conditioningPriority !== "low" && weeklyMinutes < weeklyTarget
      ? `Only ${weeklyMinutes} conditioning min are logged against a ${weeklyTarget} min lane.`
      : "",
  ].filter(Boolean).slice(0, 4);

  const cards: ConditioningCard[] = [
    {
      label: "Today",
      title: todayMinutes > 0 ? `${todayMinutes} min ${currentModality?.label ?? "conditioning"}` : "No conditioning logged",
      detail:
        todayMinutes > 0
          ? `${selectedTrackerStepScore} steps, effort ${parsePositive(selectedTrackerDay?.conditioningEffort) || 0}/10.`
          : "Log conditioning only when it is actually part of the day.",
      tone: todayMinutes > 0 ? toneFromInterference(interferenceRisk) : "slate",
    },
    {
      label: "Weekly dose",
      title: `${weeklyMinutes} min / ${weeklyTarget} min`,
      detail: `${conditioningPriority[0].toUpperCase()}${conditioningPriority.slice(1)} priority lane with ${weeklyPosingRounds} posing rounds logged.`,
      tone: weeklyMinutes >= weeklyTarget ? "emerald" : weeklyMinutes >= Math.round(weeklyTarget * 0.65) ? "sky" : "amber",
    },
    {
      label: "Interference",
      title:
        interferenceRisk === "high"
          ? "Current output is too fatigue-expensive"
          : interferenceRisk === "moderate"
            ? "Conditioning needs a recoverability check"
            : "Current output cost is manageable",
      detail:
        currentModality
          ? `${currentModality.label} carries ${currentModality.lowerBodyInterference} lower-body interference. ${currentModality.coachingUse}`
          : `${preferredModality.label} is the cleaner default when the app needs more output.`,
      tone: toneFromInterference(interferenceRisk),
    },
    {
      label: "Phase fit",
      title: primaryAction.title,
      detail: primaryAction.detail,
      tone: primaryAction.tone,
    },
  ];

  return {
    todayMinutes,
    weeklyMinutes,
    weeklyPosingRounds,
    currentModalityLabel: currentModality?.label ?? "No conditioning logged",
    interferenceRisk,
    preferredModalityLabel: preferredModality.label,
    flags,
    cards,
    primaryAction,
  };
};
