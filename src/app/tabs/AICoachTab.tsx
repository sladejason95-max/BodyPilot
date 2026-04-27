import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Footprints,
  Gauge,
  Moon,
  Target,
  Utensils,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { BODY_PILOT_BRAND, BodyPilotLogo } from "../brand";
import { clamp } from "../constants";
import type { DecisionBrief, DecisionSignalGate, DecisionSignalGateItem } from "../types";
import { SectionCard, SignalTile, type AccentTone } from "../workspace_ui";
import {
  BulletChart,
  ComparisonBars,
  DonutChart,
  GaugeChart,
  MiniLineChart,
  StatusLineChart,
} from "../visual_storytelling";

type UserMode = "athlete" | "coach";

type SignalModel = {
  title: string;
  detail: string;
  tone?: string;
  status?: string;
  score?: number;
  weeklyChangeLb?: number | null;
  weeklyChangePct?: number | null;
  currentWeightLb?: number | null;
  sampleCount?: number;
  daySpan?: number;
};

type TodayFuelSummary = {
  caloriesConsumed: number;
  calorieTarget: number;
  calorieRemaining: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbTarget: number;
  fatsConsumed: number;
  fatTarget: number;
  mealsLogged: number;
  foodEntriesLogged: number;
};

type MacroProgressionWeek = {
  id: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  deltaCalories: number;
  deltaCarbs: number;
  steps: number;
  cardioMinutes: number;
  adjustmentLabel: string;
  adjustmentDetail: string;
  trainingAdjustment: string;
};

type TodayCompletionItem = {
  label: string;
  title: string;
  detail: string;
  cta: string;
  tab: string;
  tone?: AccentTone;
  done: boolean;
};

type AICoachAction = {
  id: string;
  label: string;
  title: string;
  detail: string;
  cta: string;
  tone: AccentTone;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

type FocusCard = {
  label: string;
  title: string;
  detail: string;
  tone: AccentTone;
  Icon: React.ComponentType<{ className?: string }>;
  cta: string;
  onClick: () => void;
};

type AICoachTabProps = {
  userMode: UserMode;
  selfManagedAthlete: boolean;
  goalFocus: string;
  phaseBadge: string;
  timelineSummary: string;
  contestDateLabel: string;
  contestCountdownDays: number;
  weeksOut: number;
  bodyWeight: number;
  targetStageWeightLb: number;
  planningTargetWeightLb: number;
  goalOvershootBufferLb: number;
  calorieErrorBufferPct: number;
  plannedDeficitCalories: number;
  maintenanceCalories: number;
  profileBodyFat: number;
  selectedCalendarSessionLabel: string;
  primaryLimiter: string;
  coachRecommendation: { action: string; reason: string };
  nutritionPreset: string;
  trainingSuggestion: string;
  todayFuelSummary: TodayFuelSummary;
  macroProgressionWeeks: MacroProgressionWeek[];
  bodyWeightTrendModel: SignalModel;
  bodyWeightTrendValues: number[];
  dietPressureModel: SignalModel;
  recoveryPressureModel: SignalModel;
  fuelTimingModel: SignalModel;
  hydrationSupportModel: SignalModel;
  proteinSupportModel: SignalModel;
  decisionConfidenceModel: SignalModel & { score: number };
  decisionSignalGate: DecisionSignalGate;
  decisionBrief: DecisionBrief;
  conditioningSnapshot: {
    todayMinutes: number;
    weeklyMinutes: number;
    weeklyPosingRounds: number;
    currentModalityLabel: string;
    preferredModalityLabel: string;
    primaryAction: { title: string; detail: string; tone: string; tab: string };
    flags: string[];
  };
  adaptationPrimaryAction: { title: string; detail: string; tone: string; code: string };
  supportStackPrimaryAction: { title: string; detail: string; tone: string };
  selectedTrackerExecutionScore: number;
  selectedTrackerMissedLifts: number;
  selectedTrackerStepScore: number;
  selectedTrackerMissingFields: string[];
  trackerWeeklyReview: { averageCompletion: number; loggedDays: number };
  recoveryScore: number;
  sleepHours: number;
  sleepQuality: number;
  conditionScore: number;
  drynessScore: number;
  weeklyDensityScore: number;
  activeStepTarget: number;
  athleteCompletionProgress: number;
  complianceConfidence: { label: string; score: number };
  todayCompletionItems: TodayCompletionItem[];
  dashboardQueuedChanges: string[];
  openNutritionSurface: (surface: "log" | "add" | "insights", entryMode?: "search" | "scan" | "custom") => void;
  openTrackerSurface: (surface: "dashboard" | "log" | "insights" | "week") => void;
  goToTab: (tab: string) => void;
  applyMacroPreset: () => void;
  applyTrainingSuggestion: () => void;
  applyAdaptiveWeekPlan: () => void;
};

const toneSet = new Set(["sky", "cyan", "emerald", "amber", "rose", "slate"]);

const normalizeTone = (tone?: string): AccentTone =>
  toneSet.has(tone ?? "") ? (tone as AccentTone) : "slate";

const toneBadgeClass: Record<AccentTone, string> = {
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/50 dark:bg-sky-950/30 dark:text-sky-200",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-950/30 dark:text-cyan-200",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/50 dark:bg-rose-950/30 dark:text-rose-200",
  slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200",
};

const tonePanelClass: Record<AccentTone, string> = {
  sky: "border-sky-200 bg-sky-50/78 dark:border-sky-500/25 dark:bg-sky-950/22",
  cyan: "border-cyan-200 bg-cyan-50/78 dark:border-cyan-500/25 dark:bg-cyan-950/22",
  emerald: "border-emerald-200 bg-emerald-50/78 dark:border-emerald-500/25 dark:bg-emerald-950/22",
  amber: "border-amber-200 bg-amber-50/78 dark:border-amber-500/25 dark:bg-amber-950/22",
  rose: "border-rose-200 bg-rose-50/78 dark:border-rose-500/25 dark:bg-rose-950/22",
  slate: "border-slate-200 bg-slate-50/76 dark:border-white/10 dark:bg-white/[0.04]",
};

const formatGoal = (value: string) =>
  value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const plural = (count: number, singular: string, pluralLabel = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralLabel}`;

const actionKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function AICoachTab(props: AICoachTabProps) {
  const {
    userMode,
    selfManagedAthlete,
    goalFocus,
    phaseBadge,
    timelineSummary,
    contestDateLabel,
    contestCountdownDays,
    weeksOut,
    bodyWeight,
    targetStageWeightLb,
    planningTargetWeightLb,
    goalOvershootBufferLb,
    calorieErrorBufferPct,
    plannedDeficitCalories,
    maintenanceCalories,
    profileBodyFat,
    selectedCalendarSessionLabel,
    primaryLimiter,
    coachRecommendation,
    nutritionPreset,
    trainingSuggestion,
    todayFuelSummary,
    macroProgressionWeeks,
    bodyWeightTrendModel,
    bodyWeightTrendValues,
    dietPressureModel,
    recoveryPressureModel,
    fuelTimingModel,
    hydrationSupportModel,
    proteinSupportModel,
    decisionConfidenceModel,
    decisionSignalGate,
    decisionBrief,
    conditioningSnapshot,
    adaptationPrimaryAction,
    supportStackPrimaryAction,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    selectedTrackerStepScore,
    selectedTrackerMissingFields,
    trackerWeeklyReview,
    recoveryScore,
    sleepHours,
    sleepQuality,
    conditionScore,
    drynessScore,
    weeklyDensityScore,
    activeStepTarget,
    athleteCompletionProgress,
    complianceConfidence,
    todayCompletionItems,
    dashboardQueuedChanges,
    openNutritionSurface,
    openTrackerSurface,
    goToTab,
    applyMacroPreset,
    applyTrainingSuggestion,
    applyAdaptiveWeekPlan,
  } = props;
  const [planChangeNotice, setPlanChangeNotice] = useState("");
  const [showDecisionDetails, setShowDecisionDetails] = useState(userMode === "coach");

  const currentWeight = bodyWeightTrendModel.currentWeightLb ?? bodyWeight;
  const isSelfManagedView = userMode === "athlete" && selfManagedAthlete;
  const weightToGoal = Math.max(0, currentWeight - planningTargetWeightLb);
  const neededWeeklyLoss = weeksOut > 0 ? weightToGoal / weeksOut : weightToGoal;
  const currentWeeklyLoss = bodyWeightTrendModel.weeklyChangeLb == null
    ? null
    : Math.max(0, -bodyWeightTrendModel.weeklyChangeLb);
  const currentWeek = macroProgressionWeeks[0] ?? null;
  const nextWeek = macroProgressionWeeks[1] ?? currentWeek;
  const activeTargetMismatch = Boolean(
    currentWeek &&
      (Math.abs(todayFuelSummary.calorieTarget - currentWeek.calories) > 25 ||
        Math.abs(todayFuelSummary.proteinTarget - currentWeek.protein) >= 5 ||
        Math.abs(todayFuelSummary.carbTarget - currentWeek.carbs) >= 5 ||
        Math.abs(todayFuelSummary.fatTarget - currentWeek.fats) >= 1)
  );
  const activeWeekTargetsApplied = Boolean(
    currentWeek &&
      !activeTargetMismatch &&
      Math.abs(activeStepTarget - currentWeek.steps) <= 100
  );
  const caloriesLoggedPct = clamp(Math.round((todayFuelSummary.caloriesConsumed / Math.max(1, todayFuelSummary.calorieTarget)) * 100), 0, 140);
  const proteinLoggedPct = clamp(Math.round((todayFuelSummary.proteinConsumed / Math.max(1, todayFuelSummary.proteinTarget)) * 100), 0, 140);
  const macroReadiness = clamp(Math.round((caloriesLoggedPct * 0.45 + proteinLoggedPct * 0.55)), 0, 100);
  const stepsGap = Math.max(0, activeStepTarget - selectedTrackerStepScore);
  const proteinGap = Math.max(0, todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed);
  const calorieGap = Math.max(0, todayFuelSummary.calorieTarget - todayFuelSummary.caloriesConsumed);
  const overallStatus = clamp(
    Math.round(
      decisionSignalGate.score * 0.28 +
        selectedTrackerExecutionScore * 0.24 +
        macroReadiness * 0.2 +
        recoveryScore * 10 * 0.16 +
        complianceConfidence.score * 0.12
    ),
    0,
    100
  );
  const timelineConfidence = clamp(
    Math.round(
      decisionConfidenceModel.score * 0.45 +
        complianceConfidence.score * 0.22 +
        selectedTrackerExecutionScore * 0.18 +
        (bodyWeightTrendModel.sampleCount ?? 0) * 5
    ),
    0,
    100
  );

  const paceStatus = useMemo(() => {
    if ((bodyWeightTrendModel.sampleCount ?? 0) < 3 || currentWeeklyLoss == null) {
      return {
        label: "Trend building",
        tone: "slate" as AccentTone,
        detail: `While the scale trend builds, keep the fundamentals steady: hit protein, land near calories, complete training, and keep steps within range.`,
      };
    }

    if (neededWeeklyLoss <= 0.05) {
      return {
        label: "At target range",
        tone: "emerald" as AccentTone,
        detail: `Current weight is ${currentWeight.toFixed(1)} lb against BodyPilot's ${planningTargetWeightLb.toFixed(1)} lb planning target.`,
      };
    }

    if (currentWeeklyLoss < Math.max(0.15, neededWeeklyLoss * 0.72)) {
      return {
        label: "Behind pace",
        tone: "amber" as AccentTone,
        detail: `Current trend is ${currentWeeklyLoss.toFixed(1)} lb/week. Needed pace is ${neededWeeklyLoss.toFixed(1)} lb/week.`,
      };
    }

    if (currentWeeklyLoss > Math.max(neededWeeklyLoss * 1.35, neededWeeklyLoss + 0.7)) {
      return {
        label: "Cutting fast",
        tone: "rose" as AccentTone,
        detail: `Current trend is ${currentWeeklyLoss.toFixed(1)} lb/week. Slow the loss if recovery or performance falls.`,
      };
    }

    return {
      label: "On pace",
      tone: "emerald" as AccentTone,
      detail: `Current trend covers the ${neededWeeklyLoss.toFixed(1)} lb/week target pace.`,
    };
  }, [
    bodyWeightTrendModel.sampleCount,
    currentWeeklyLoss,
    currentWeight,
    neededWeeklyLoss,
    planningTargetWeightLb,
    targetStageWeightLb,
  ]);
  const adaptiveWeekChangeNeeded = Boolean(
    currentWeek &&
      (activeTargetMismatch || (paceStatus.label === "Behind pace" && !activeWeekTargetsApplied))
  );

  const biggestBlocker = useMemo(() => {
    if (todayFuelSummary.foodEntriesLogged === 0) {
      return {
        title: "Food signal is missing",
        detail: `Start with the basics: protein first, simple carbs around training, fats controlled, and no target changes until today's intake is visible.`,
        tone: "amber" as AccentTone,
      };
    }

    if (selectedTrackerMissingFields.length > 0) {
      return {
        title: `Missing ${selectedTrackerMissingFields.join(", ")}`,
        detail: "Finish the basic tracker fields before trusting today's plan read.",
        tone: "amber" as AccentTone,
      };
    }

    if (selectedTrackerMissedLifts > 0) {
      return {
        title: `${plural(selectedTrackerMissedLifts, "lift")} still open`,
        detail: "Complete the scheduled lift log before editing training.",
        tone: "amber" as AccentTone,
      };
    }

    if (recoveryScore < 6) {
      return {
        title: "Recovery is limiting aggression",
        detail: `Recovery is ${recoveryScore.toFixed(1)}/10. Protect training output before pulling more food.`,
        tone: "rose" as AccentTone,
      };
    }

    if (paceStatus.tone !== "emerald") {
      return {
        title: paceStatus.label,
        detail: paceStatus.detail,
        tone: paceStatus.tone,
      };
    }

    return {
      title: primaryLimiter,
      detail: coachRecommendation.reason,
      tone: normalizeTone(decisionConfidenceModel.tone),
    };
  }, [
    coachRecommendation.reason,
    decisionConfidenceModel.tone,
    paceStatus,
    primaryLimiter,
    recoveryScore,
    selectedTrackerMissingFields,
    selectedTrackerMissedLifts,
    todayFuelSummary.foodEntriesLogged,
  ]);

  const gamePlanSummary = useMemo(() => {
    if (todayFuelSummary.foodEntriesLogged === 0) {
      return `Use the default playbook while data builds: hit protein, keep meals simple, finish ${selectedCalendarSessionLabel}, and hold targets until the trend is real.`;
    }

    if (selectedTrackerMissingFields.length > 0) {
      return `Keep the day boring while ${selectedTrackerMissingFields.join(", ")} catches up: land near calories, finish training, keep steps moving, and avoid extra changes.`;
    }

    if (paceStatus.label === "Behind pace" && activeWeekTargetsApplied && currentWeek) {
      return `The ${currentWeek.calories.toLocaleString()} kcal week is already active. Hold it through the next weekly weigh-in before cutting again.`;
    }

    if (paceStatus.label === "Behind pace" && selectedTrackerExecutionScore >= 75) {
      return `Use a small weekly correction: ${currentWeek ? `${currentWeek.calories} kcal, ${currentWeek.steps.toLocaleString()} steps` : "reduce calories by 150 or add 2,000 steps"} and review again after five weigh-ins.`;
    }

    if (activeTargetMismatch && currentWeek) {
      return `Set the active target to ${currentWeek.calories.toLocaleString()} kcal. That keeps the deficit real after tracking error instead of relying on a best-case calorie count.`;
    }

    if (recoveryScore < 6) {
      return `Keep food stable today and reduce training stress before adding more cardio or cutting calories.`;
    }

    return `Hold ${todayFuelSummary.calorieTarget.toLocaleString()} kcal, hit ${todayFuelSummary.proteinTarget}g protein, and drive toward ${planningTargetWeightLb.toFixed(1)} lb before treating ${targetStageWeightLb} lb as safe.`;
  }, [
    currentWeek,
    activeTargetMismatch,
    activeWeekTargetsApplied,
    paceStatus.label,
    recoveryScore,
    selectedCalendarSessionLabel,
    selectedTrackerExecutionScore,
    selectedTrackerMissingFields,
    todayFuelSummary.calorieTarget,
    todayFuelSummary.foodEntriesLogged,
    todayFuelSummary.proteinTarget,
    planningTargetWeightLb,
    targetStageWeightLb,
  ]);

  const openDecisionGateItem = (item: DecisionSignalGateItem) => {
    if (item.tab === "nutrition") {
      openNutritionSurface(item.id === "food-start" ? "add" : "log", "search");
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    goToTab(item.tab);
  };
  const decisionGateIcon = (item: DecisionSignalGateItem) => {
    if (item.tab === "nutrition") return Utensils;
    if (item.id === "training") return Dumbbell;
    if (item.tab === "tracker") return Gauge;
    return AlertTriangle;
  };

  const topActions = useMemo<AICoachAction[]>(() => {
    const actions: AICoachAction[] = [];
    const seen = new Set<string>();
    const add = (action: AICoachAction) => {
      const key = actionKey(action.title);
      if (seen.has(key)) return;
      seen.add(key);
      actions.push(action);
    };

    if (decisionSignalGate.status === "blocked" && decisionSignalGate.missing[0]) {
      const gateItem = decisionSignalGate.missing[0];
      const GateIcon = decisionGateIcon(gateItem);

      add({
        id: `signal-gate-${gateItem.id}`,
        label: "Signal",
        title: gateItem.title,
        detail: gateItem.detail,
        cta: gateItem.actionLabel,
        tone: gateItem.tone,
        Icon: GateIcon,
        onClick: () => openDecisionGateItem(gateItem),
      });
    }

    if (todayFuelSummary.foodEntriesLogged === 0) {
      add({
        id: "add-food-first",
        label: "Food",
        title: "Add the first meal",
        detail: `${todayFuelSummary.calorieTarget.toLocaleString()} kcal and ${todayFuelSummary.proteinTarget}g protein are still unlogged.`,
        cta: "Add Food",
        tone: "amber",
        Icon: Utensils,
        onClick: () => openNutritionSurface("add", "search"),
      });
    } else if (proteinGap > 25 || calorieGap > 350) {
      add({
        id: "close-food-gap",
        label: "Food",
        title: `Close ${proteinGap}g protein`,
        detail: `${calorieGap.toLocaleString()} kcal remain. Add food before changing calories.`,
        cta: "Add Food",
        tone: "amber",
        Icon: Utensils,
        onClick: () => openNutritionSurface("add", "search"),
      });
    }

    if (selectedTrackerMissingFields.length > 0) {
      add({
        id: "log-basics",
        label: "Tracker",
        title: `Log ${selectedTrackerMissingFields.join(", ")}`,
        detail: "Until those fields are in, use the generic plan: calories close, protein hit, steps moving, training completed.",
        cta: "Open Today",
        tone: "sky",
        Icon: Gauge,
        onClick: () => openTrackerSurface("log"),
      });
    }

    if (selectedTrackerMissedLifts > 0) {
      add({
        id: "finish-lifts",
        label: "Training",
        title: `Log ${plural(selectedTrackerMissedLifts, "open lift")}`,
        detail: `${selectedTrackerExecutionScore}% of today's session is logged. Finish the lift entries first.`,
        cta: "Open Today",
        tone: "amber",
        Icon: Dumbbell,
        onClick: () => openTrackerSurface("log"),
      });
    }

    if (stepsGap >= 1500) {
      add({
        id: "steps",
        label: "Activity",
        title: `Add ${stepsGap.toLocaleString()} steps`,
        detail: `Today is at ${selectedTrackerStepScore.toLocaleString()} against a ${activeStepTarget.toLocaleString()} step target.`,
        cta: "Log steps",
        tone: "cyan",
        Icon: Footprints,
        onClick: () => openTrackerSurface("log"),
      });
    }

    if (activeTargetMismatch && currentWeek) {
      add({
        id: "tighten-deficit",
        label: "Plan",
        title: `Sync target to ${currentWeek.calories.toLocaleString()} kcal`,
        detail: `${todayFuelSummary.calorieTarget.toLocaleString()} kcal is active now. Sync to ${currentWeek.protein}P / ${currentWeek.carbs}C / ${currentWeek.fats}F.`,
        cta: "Make change",
        tone: "rose",
        Icon: Target,
        onClick: applyAdaptiveWeekPlan,
      });
    }

    if (
      paceStatus.label === "Behind pace" &&
      !activeWeekTargetsApplied &&
      selectedTrackerExecutionScore >= 75 &&
      decisionConfidenceModel.score >= 70 &&
      currentWeek
    ) {
      add({
        id: "adaptive-week",
        label: "Plan",
        title: `Set this week to ${currentWeek.calories.toLocaleString()} kcal`,
        detail: `${currentWeek.steps.toLocaleString()} daily steps and ${currentWeek.cardioMinutes} cardio minutes for the week.`,
        cta: "Make change",
        tone: "rose",
        Icon: Target,
        onClick: applyAdaptiveWeekPlan,
      });
    }

    if (recoveryScore < 6 && selectedTrackerMissedLifts === 0) {
      add({
        id: "recovery-adjust",
        label: "Recovery",
        title: "Reduce training stress this week",
        detail: "Apply the training adjustment before adding more cardio or cutting food.",
        cta: "Make change",
        tone: "rose",
        Icon: Moon,
        onClick: applyTrainingSuggestion,
      });
    }

    if (actions.length === 0) {
      add({
        id: "hold-plan",
        label: "Plan",
        title: "Keep today's targets unchanged",
        detail: `${todayFuelSummary.calorieTarget.toLocaleString()} kcal, ${todayFuelSummary.proteinTarget}g protein, ${activeStepTarget.toLocaleString()} steps.`,
        cta: "Open Today",
        tone: "emerald",
        Icon: CheckCircle2,
        onClick: () => openTrackerSurface("log"),
      });
    }

    return actions.slice(0, 3);
  }, [
    activeStepTarget,
    activeWeekTargetsApplied,
    applyAdaptiveWeekPlan,
    applyTrainingSuggestion,
    activeTargetMismatch,
    calorieGap,
    currentWeek,
    decisionSignalGate,
    decisionConfidenceModel.score,
    goToTab,
    openNutritionSurface,
    openTrackerSurface,
    paceStatus.label,
    proteinGap,
    recoveryScore,
    selectedTrackerExecutionScore,
    selectedTrackerMissingFields,
    selectedTrackerMissedLifts,
    selectedTrackerStepScore,
    stepsGap,
    todayFuelSummary.calorieTarget,
    todayFuelSummary.carbTarget,
    todayFuelSummary.fatTarget,
    todayFuelSummary.foodEntriesLogged,
    todayFuelSummary.proteinTarget,
  ]);

  const weeklyFocus = useMemo<FocusCard[]>(() => {
    const cards: FocusCard[] = [];

    cards.push({
      label: "Nutrition",
      title:
        todayFuelSummary.foodEntriesLogged === 0
          ? "Build the food signal first"
          : adaptiveWeekChangeNeeded && currentWeek
            ? `Run ${currentWeek.calories.toLocaleString()} kcal this week`
            : activeWeekTargetsApplied && paceStatus.label === "Behind pace" && currentWeek
              ? "Hold the applied weekly cut"
            : nutritionPreset,
      detail:
        todayFuelSummary.foodEntriesLogged === 0
          ? "Add today's meals before interpreting compliance or changing targets."
          : adaptiveWeekChangeNeeded && currentWeek
            ? `${currentWeek.protein}P / ${currentWeek.carbs}C / ${currentWeek.fats}F. This is the tighter target with tracking error included.`
            : activeWeekTargetsApplied && paceStatus.label === "Behind pace" && currentWeek
              ? `${currentWeek.protein}P / ${currentWeek.carbs}C / ${currentWeek.fats}F and ${currentWeek.steps.toLocaleString()} steps are already active. Review after the next weekly weigh-in.`
            : `${todayFuelSummary.proteinTarget}g protein, ${todayFuelSummary.carbTarget}g carbs, ${todayFuelSummary.fatTarget}g fat remain the working targets.`,
      tone: todayFuelSummary.foodEntriesLogged === 0 || adaptiveWeekChangeNeeded ? "amber" : activeWeekTargetsApplied ? "emerald" : normalizeTone(dietPressureModel.tone),
      Icon: Utensils,
      cta: adaptiveWeekChangeNeeded && currentWeek && todayFuelSummary.foodEntriesLogged > 0 ? "Make change" : "Open food",
      onClick:
        adaptiveWeekChangeNeeded && currentWeek && todayFuelSummary.foodEntriesLogged > 0
          ? applyAdaptiveWeekPlan
          : () => openNutritionSurface("add", "search"),
    });

    cards.push({
      label: "Training",
      title:
        selectedTrackerMissedLifts > 0
          ? `Finish ${plural(selectedTrackerMissedLifts, "open lift")}`
          : adaptationPrimaryAction.code === "hold" || adaptationPrimaryAction.code === "progress-ready"
            ? "Hold volume steady"
            : adaptationPrimaryAction.title,
      detail:
        selectedTrackerMissedLifts > 0
          ? "Do not edit the split until today's scheduled lifts are logged."
          : adaptationPrimaryAction.code === "hold" || adaptationPrimaryAction.code === "progress-ready"
            ? trainingSuggestion
            : adaptationPrimaryAction.detail,
      tone: selectedTrackerMissedLifts > 0 ? "amber" : normalizeTone(adaptationPrimaryAction.tone),
      Icon: Dumbbell,
      cta:
        selectedTrackerMissedLifts > 0
          ? "Open Today"
          : adaptationPrimaryAction.code === "hold" || adaptationPrimaryAction.code === "progress-ready"
            ? "Training"
            : "Make change",
      onClick:
        selectedTrackerMissedLifts > 0
          ? () => openTrackerSurface("log")
          : adaptationPrimaryAction.code === "hold" || adaptationPrimaryAction.code === "progress-ready"
            ? () => goToTab("split")
            : applyTrainingSuggestion,
    });

    cards.push({
      label: "Activity",
      title:
        stepsGap > 0
          ? `Finish ${stepsGap.toLocaleString()} steps`
          : conditioningSnapshot.primaryAction.tone === "emerald"
            ? `${conditioningSnapshot.weeklyMinutes} cardio min logged`
            : conditioningSnapshot.primaryAction.title,
      detail:
        stepsGap > 0
          ? `${selectedTrackerStepScore.toLocaleString()} steps are logged. Daily target is ${activeStepTarget.toLocaleString()}.`
          : conditioningSnapshot.primaryAction.tone === "emerald"
            ? `${conditioningSnapshot.currentModalityLabel}; preferred default is ${conditioningSnapshot.preferredModalityLabel}.`
            : conditioningSnapshot.primaryAction.detail,
      tone: stepsGap > 0 ? "cyan" : normalizeTone(conditioningSnapshot.primaryAction.tone),
      Icon: Footprints,
      cta: "Open Today",
      onClick: () => openTrackerSurface("log"),
    });

    const sleepGapMinutes = Math.max(0, Math.round((7.5 - sleepHours) * 60));
    const recoveryChangeReady =
      recoveryScore < 6 && selectedTrackerMissedLifts === 0 && selectedTrackerMissingFields.length === 0;
    cards.push({
      label: "Recovery",
      title:
        recoveryScore < 6
          ? "Protect recovery before adding stress"
          : sleepGapMinutes > 0
            ? `Add ${sleepGapMinutes} minutes in bed tonight`
            : `${sleepHours.toFixed(1)}h sleep is usable`,
      detail:
        recoveryScore < 6
          ? recoveryChangeReady
            ? `${recoveryPressureModel.title}. Apply the training adjustment now, then review tomorrow's recovery.`
            : `${recoveryPressureModel.title}. Finish today's logs before changing the plan so the recovery call is based on real execution.`
          : sleepGapMinutes > 0
            ? `Sleep quality is ${sleepQuality}/10. Keep tomorrow's plan unchanged until sleep is logged.`
            : `Recovery is ${recoveryScore.toFixed(1)}/10. No recovery-driven plan change is needed today.`,
      tone: recoveryScore < 6 ? "rose" : sleepGapMinutes > 0 ? "amber" : "emerald",
      Icon: Moon,
      cta: recoveryChangeReady ? "Make change" : "Open Today",
      onClick: recoveryChangeReady ? applyTrainingSuggestion : () => openTrackerSurface("log"),
    });

    return cards;
  }, [
    activeStepTarget,
    activeWeekTargetsApplied,
    adaptiveWeekChangeNeeded,
    adaptationPrimaryAction.code,
    adaptationPrimaryAction.detail,
    adaptationPrimaryAction.title,
    adaptationPrimaryAction.tone,
    applyAdaptiveWeekPlan,
    applyTrainingSuggestion,
    conditioningSnapshot.currentModalityLabel,
    conditioningSnapshot.preferredModalityLabel,
    conditioningSnapshot.primaryAction,
    conditioningSnapshot.weeklyMinutes,
    currentWeek,
    dietPressureModel.tone,
    goToTab,
    nutritionPreset,
    openNutritionSurface,
    openTrackerSurface,
    paceStatus.label,
    recoveryPressureModel.title,
    recoveryScore,
    selectedTrackerMissingFields,
    selectedTrackerMissedLifts,
    selectedTrackerStepScore,
    sleepHours,
    sleepQuality,
    stepsGap,
    todayFuelSummary,
    trainingSuggestion,
  ]);

  const watchpoints = useMemo(() => {
    const items = [
      {
        label: "Scale read",
        title: bodyWeightTrendModel.title,
        detail:
          (bodyWeightTrendModel.sampleCount ?? 0) < 3
            ? "Use five morning weigh-ins before changing calories from scale noise."
            : bodyWeightTrendModel.detail,
        tone: normalizeTone(bodyWeightTrendModel.tone),
      },
      {
        label: "Food lever",
        title: nutritionPreset,
        detail: proteinSupportModel.detail || "Protein support is part of the next food call.",
        tone: normalizeTone(proteinSupportModel.tone),
      },
      {
        label: "Training lever",
        title: adaptationPrimaryAction.title,
        detail: adaptationPrimaryAction.detail,
        tone: normalizeTone(adaptationPrimaryAction.tone),
      },
      {
        label: "Support",
        title: supportStackPrimaryAction.title,
        detail: supportStackPrimaryAction.detail,
        tone: normalizeTone(supportStackPrimaryAction.tone),
      },
    ];

    return items;
  }, [
    adaptationPrimaryAction,
    bodyWeightTrendModel,
    nutritionPreset,
    proteinSupportModel.detail,
    proteinSupportModel.tone,
    supportStackPrimaryAction,
  ]);

  const macroSegments = [
    { label: "Protein", value: todayFuelSummary.proteinTarget, color: "#10b981" },
    { label: "Carbs", value: todayFuelSummary.carbTarget, color: "#0ea5e9" },
    { label: "Fat", value: todayFuelSummary.fatTarget, color: "#f59e0b" },
  ];
  const bodyWeightLine = bodyWeightTrendValues.length > 0 ? bodyWeightTrendValues : [bodyWeight];
  const directStyle = selfManagedAthlete ? "Direct self-managed plan" : "Coach-supported plan";
  const primaryAction = topActions[0] ?? null;
  const secondaryActions = topActions.slice(1);
  const visibleWeeklyFocus = showDecisionDetails ? weeklyFocus : weeklyFocus.slice(0, 2);
  const runWeeklyFocusAction = (item: FocusCard) => {
    item.onClick();

    if (item.cta === "Make change") {
      setPlanChangeNotice(`${item.label} change applied. Review the plan activity or open the related tab to inspect it.`);
      return;
    }

    setPlanChangeNotice("");
  };

  return (
    <div className="grid gap-3">
      <section className="premium-surface relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_34%)]" />
        <div className="relative grid gap-3 p-3.5 sm:p-4 xl:grid-cols-[1.12fr_0.88fr] xl:items-stretch">
          <div className="grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <BodyPilotLogo size="sm" showWordmark={false} />
                  <Badge variant="outline" className="border-sky-200 bg-white/70 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:border-sky-700/40 dark:bg-white/[0.06] dark:text-sky-200">
                    {BODY_PILOT_BRAND.shortName} Strategy Engine
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-[0.06em]">
                    {directStyle}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${toneBadgeClass[decisionSignalGate.tone]}`}>
                    {decisionSignalGate.score}% signal
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setShowDecisionDetails((value) => !value)}>
                    {showDecisionDetails ? "Hide deep read" : "Deep read"}
                  </Button>
                </div>
                <h2 className="mt-2 text-[1.6rem] font-semibold leading-tight tracking-normal text-slate-950 dark:text-slate-50">
                  {decisionBrief.title}
                </h2>
                <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-700 dark:text-slate-300">
                  {decisionBrief.detail}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-[22rem]">
                <div className="rounded-[18px] border border-slate-200 bg-white/75 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Goal</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{formatGoal(goalFocus)}</div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/75 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Time</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {contestCountdownDays > 0 ? `${contestCountdownDays} days` : timelineSummary}
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/75 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Weight</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {currentWeight.toFixed(1)} to {planningTargetWeightLb.toFixed(1)} lb
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/75 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Deficit</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {plannedDeficitCalories > 0 ? `${plannedDeficitCalories} kcal/day` : phaseBadge}
                  </div>
                </div>
              </div>
            </div>

            <div className={showDecisionDetails ? "grid gap-2 md:grid-cols-3" : "grid gap-2"}>
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className={[
                    "group relative overflow-hidden rounded-[22px] border p-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
                    tonePanelClass[primaryAction.tone],
                    showDecisionDetails ? "" : "md:max-w-2xl",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${toneBadgeClass[primaryAction.tone]}`}>
                      <primaryAction.Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${toneBadgeClass[primaryAction.tone]}`}>
                        Top action
                      </div>
                      <div className="mt-2 text-xl font-semibold leading-6 text-slate-950 dark:text-slate-100">{primaryAction.title}</div>
                      <div className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">{primaryAction.detail}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {primaryAction.cta}
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </button>
              ) : null}

              {showDecisionDetails
                ? secondaryActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onClick}
                      className={`group relative overflow-hidden rounded-[18px] border p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md ${tonePanelClass[action.tone]}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${toneBadgeClass[action.tone]}`}>
                          <action.Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${toneBadgeClass[action.tone]}`}>
                            {action.label}
                          </div>
                          <div className="mt-1.5 text-base font-semibold leading-5 text-slate-950 dark:text-slate-100">{action.title}</div>
                          <div className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{action.detail}</div>
                          <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {action.cta}
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                : null}
              {!showDecisionDetails && secondaryActions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {secondaryActions.map((action) => (
                    <Button key={action.id} size="sm" variant="outline" onClick={action.onClick}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-1">
            <GaugeChart
              label="Overall status"
              value={overallStatus}
              suffix="%"
              helper={`${decisionSignalGate.title}. ${complianceConfidence.label} compliance.`}
              tone={overallStatus >= 80 ? "emerald" : overallStatus >= 60 ? "amber" : "rose"}
            />
            <SignalTile
              label={decisionBrief.eyebrow}
              title={decisionBrief.items[0]?.title ?? biggestBlocker.title}
              detail={decisionBrief.items[0]?.detail ?? biggestBlocker.detail}
              tone={decisionBrief.items[0]?.tone ?? biggestBlocker.tone}
              onClick={
                decisionSignalGate.missing[0]
                  ? () => openDecisionGateItem(decisionSignalGate.missing[0])
                  : todayFuelSummary.foodEntriesLogged === 0
                  ? () => openNutritionSurface("add", "search")
                  : selectedTrackerMissingFields.length > 0 || selectedTrackerMissedLifts > 0
                    ? () => openTrackerSurface("log")
                    : undefined
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="This week's plan"
          right={
            <Badge variant="outline" className={toneBadgeClass[paceStatus.tone]}>
              {paceStatus.label}
            </Badge>
          }
        >
          <div className="grid gap-2 md:grid-cols-2">
            {visibleWeeklyFocus.map((item) => (
              <div key={item.label} className={`relative overflow-hidden rounded-[20px] border p-3.5 shadow-sm ${tonePanelClass[item.tone]}`}>
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${toneBadgeClass[item.tone]}`}>
                    <item.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${toneBadgeClass[item.tone]}`}>
                      {item.label}
                    </div>
                    <div className="mt-2 text-base font-semibold leading-5 text-slate-950 dark:text-slate-100">{item.title}</div>
                    <div className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                    <Button size="sm" variant={item.cta === "Make change" ? "default" : "outline"} className="mt-3" onClick={() => runWeeklyFocusAction(item)}>
                      {item.cta}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {planChangeNotice ? (
            <div className="mt-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-5 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
              {planChangeNotice}
            </div>
          ) : null}
        </SectionCard>

        {showDecisionDetails ? (
        <SectionCard
          title="Path to goal"
          right={
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-[0.06em]">
              {contestDateLabel}
            </Badge>
          }
        >
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-3">
              <SignalTile
                label="Target"
                title={`${planningTargetWeightLb.toFixed(1)} lb`}
                detail={`${goalOvershootBufferLb.toFixed(1)} lb under the stated ${targetStageWeightLb.toFixed(1)} lb goal so the final week has room for scale noise, food error, and water movement.`}
                tone={paceStatus.tone}
              />
              <SignalTile
                label="Deficit"
                title={`${Math.max(0, maintenanceCalories - todayFuelSummary.calorieTarget).toLocaleString()} kcal/day`}
                detail={`${calorieErrorBufferPct}% tracking-error reserve is already inside the target. Do not eat back the buffer unless recovery forces it.`}
                tone={plannedDeficitCalories > 0 ? "emerald" : "slate"}
              />
              <SignalTile
                label="Pace"
                title={`${neededWeeklyLoss.toFixed(1)} lb/week`}
                detail={currentWeeklyLoss == null ? "Trend is not trusted yet. Log five morning bodyweights before making the next calorie cut." : `Current trend is ${currentWeeklyLoss.toFixed(1)} lb/week. ${paceStatus.detail}`}
                tone={paceStatus.tone}
              />
            </div>
            <ComparisonBars
              rows={[
                { label: "Bodyweight", current: currentWeight, next: planningTargetWeightLb, unit: " lb", tone: paceStatus.tone },
                {
                  label: "Calories",
                  current: todayFuelSummary.calorieTarget,
                  next: nextWeek?.calories ?? todayFuelSummary.calorieTarget,
                  unit: " kcal",
                  tone: "emerald",
                },
                {
                  label: "Steps",
                  current: selectedTrackerStepScore,
                  next: nextWeek?.steps ?? activeStepTarget,
                  unit: "",
                  tone: "cyan",
                },
              ]}
            />
          </div>
        </SectionCard>
        ) : null}
      </div>

      {!showDecisionDetails ? (
        <SectionCard
          title="Deep read hidden"
          right={<Button size="sm" variant="outline" onClick={() => setShowDecisionDetails(true)}>Show deep read</Button>}
        >
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            BodyPilot is showing the current mission first. Deeper trend, watchpoint, and closeout analysis is still available when you need to audit the call.
          </div>
        </SectionCard>
      ) : null}

      {showDecisionDetails ? (
      <SectionCard
        title={isSelfManagedView ? "Progress visuals" : userMode === "coach" ? "Coach visuals" : "Plan visuals"}
        right={
          <Badge variant="outline" className={toneBadgeClass[timelineConfidence >= 80 ? "emerald" : timelineConfidence >= 60 ? "amber" : "rose"]}>
            {timelineConfidence}% confidence
          </Badge>
        }
      >
        <div className="grid gap-3 lg:grid-cols-4">
          <DonutChart label="Targets" center={`${todayFuelSummary.calorieTarget.toLocaleString()}`} segments={macroSegments} />
          <div className="grid gap-3 lg:col-span-2">
            <BulletChart label="Calories" value={todayFuelSummary.caloriesConsumed} target={todayFuelSummary.calorieTarget} unit=" kcal" tone="emerald" />
            <BulletChart label="Protein" value={todayFuelSummary.proteinConsumed} target={todayFuelSummary.proteinTarget} unit="g" tone="sky" />
            <BulletChart label="Steps" value={selectedTrackerStepScore} target={activeStepTarget} tone="cyan" />
          </div>
          <GaugeChart
            label="Timeline confidence"
            value={timelineConfidence}
            suffix="%"
            helper={`${bodyWeightTrendModel.sampleCount ?? 0} weigh-ins, ${trackerWeeklyReview.loggedDays} logged days.`}
            tone={timelineConfidence >= 80 ? "emerald" : timelineConfidence >= 60 ? "amber" : "rose"}
          />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <MiniLineChart label="Bodyweight trend" values={bodyWeightLine} tone={paceStatus.tone} unit=" lb" />
          <StatusLineChart
            label="Execution signal"
            values={[trackerWeeklyReview.averageCompletion, selectedTrackerExecutionScore, athleteCompletionProgress]}
            unit="%"
            helper="Week average, today, closeout."
            helpTitle="Raise execution signal"
            helpItems={[
              "Log every planned lift with real sets, reps, weight, and RPE before changing the split.",
              "Finish basics: bodyweight, steps, energy, and daily closeout.",
              "Build a full week of logged days so the coach has signal instead of noise.",
            ]}
            helpNote="Green means the plan is ready to interpret. Red or yellow usually means log execution first."
          />
          <StatusLineChart
            label="Readiness mix"
            values={[Math.round(recoveryScore * 10), complianceConfidence.score, decisionSignalGate.score]}
            unit="%"
            helper="Recovery, compliance, signal gate."
            helpTitle="Raise readiness mix"
            helpItems={[
              "Protect sleep and recovery before adding more training stress or cardio.",
              "Hit food, steps, and training targets closely enough that compliance is believable.",
              "Acknowledge or publish the current direction so the decision layer is not floating.",
            ]}
            helpNote="Readiness improves when recovery, compliance, and decision confidence rise together."
          />
        </div>
      </SectionCard>
      ) : null}

      {showDecisionDetails ? (
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="What needs to change"
          right={<Button size="sm" onClick={applyMacroPreset}>Make food change</Button>}
        >
          <div className="grid gap-2">
            <SignalTile
              label="Nutrition plan"
              title={nutritionPreset}
              detail={fuelTimingModel.detail || `Use ${todayFuelSummary.calorieTarget.toLocaleString()} kcal until the next real signal.`}
              tone={normalizeTone(fuelTimingModel.tone)}
              onClick={applyMacroPreset}
            />
            <SignalTile
              label="Training plan"
              title={trainingSuggestion}
              detail={recoveryPressureModel.detail || adaptationPrimaryAction.detail}
              tone={normalizeTone(recoveryPressureModel.tone)}
              onClick={applyTrainingSuggestion}
            />
            <SignalTile
              label="Hydration"
              title={hydrationSupportModel.title}
              detail={hydrationSupportModel.detail}
              tone={normalizeTone(hydrationSupportModel.tone)}
              onClick={() => openNutritionSurface("log")}
            />
          </div>
        </SectionCard>

        <SectionCard title="Advanced read">
          <div className="grid gap-2 md:grid-cols-2">
            <SignalTile
              label="Risk"
              title={biggestBlocker.title}
              detail={biggestBlocker.detail}
              tone={biggestBlocker.tone}
            />
            <SignalTile
              label="Opportunity"
              title={
                stepsGap >= 1500
                  ? "Use activity before harder dieting"
                  : todayFuelSummary.foodEntriesLogged === 0
                    ? "Food logging unlocks the decision"
                    : "Small changes are enough right now"
              }
              detail={
                stepsGap >= 1500
                  ? `A ${stepsGap.toLocaleString()} step gap is still available today. Fill that before dropping calories.`
                  : todayFuelSummary.foodEntriesLogged === 0
                    ? "One real food entry turns the nutrition read from blank to usable."
                    : dashboardQueuedChanges[0] ?? "No major rewrite is required. Use the smallest change that matches the signal."
              }
              tone={stepsGap >= 1500 ? "cyan" : "emerald"}
            />
            <SignalTile
              label="Condition"
              title={`${conditionScore.toFixed(1)}/10 condition`}
              detail={`${drynessScore.toFixed(1)}/10 dryness, ${profileBodyFat}% estimated body fat.`}
              tone={conditionScore >= 8 ? "emerald" : conditionScore >= 6.5 ? "sky" : "amber"}
            />
            <SignalTile
              label="Weekly load"
              title={`${Math.round(weeklyDensityScore * 10)}% density`}
              detail={`${conditioningSnapshot.weeklyMinutes} conditioning minutes, ${conditioningSnapshot.weeklyPosingRounds} posing rounds logged this week.`}
              tone={weeklyDensityScore >= 7 ? "amber" : "sky"}
            />
          </div>
        </SectionCard>
      </div>
      ) : null}

      {showDecisionDetails ? (
      <SectionCard
        title="Watchpoints"
        right={
          <Button size="sm" variant="outline" onClick={() => goToTab(userMode === "coach" ? "coach" : "dashboard")}>
            {userMode === "coach" ? "Coach desk" : "Dashboard"}
          </Button>
        }
      >
        <div className="grid gap-2 md:grid-cols-4">
          {watchpoints.map((item) => (
            <SignalTile
              key={item.label}
              label={item.label}
              title={item.title}
              detail={item.detail}
              tone={item.tone}
            />
          ))}
        </div>
      </SectionCard>
      ) : null}

      {showDecisionDetails ? (
      <SectionCard title="Closeout logic">
        <div className="grid gap-2 md:grid-cols-3">
          {todayCompletionItems.slice(0, 3).map((item) => (
            <button
              key={`${item.label}-${item.title}`}
              type="button"
              onClick={() =>
                item.tab === "nutrition"
                  ? openNutritionSurface("add", "search")
                  : item.tab === "tracker"
                    ? openTrackerSurface("log")
                    : goToTab(item.tab)
              }
              className={`rounded-[18px] border p-3 text-left shadow-sm transition hover:-translate-y-[1px] ${tonePanelClass[item.done ? "emerald" : normalizeTone(item.tone)]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${toneBadgeClass[item.done ? "emerald" : normalizeTone(item.tone)]}`}>
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                </div>
                {item.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>
      ) : null}
    </div>
  );
}
