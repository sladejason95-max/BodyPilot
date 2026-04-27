import React from "react";
import { Dumbbell, MessageSquareText, Utensils } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import PrepSignalPanel from "../../components/shared/PrepSignalPanel";
import { inputClass } from "../constants";
import type { CheckIn, CheckInPhotoSlot, CoachThreadMessage, DecisionBrief, DecisionBriefItem, DecisionSignalGate, DecisionSignalGateItem, PublishedCoachDecision, WeeklySnapshot } from "../types";
import type { ContestPrepModel } from "../prep_model";
import type { PrepSignalSnapshot } from "../prep_signal_engine";
import {
  EmptyStatePanel,
  scoreChipClass,
  SectionCard,
  SignalTile,
  surfaceToneClass,
  type AccentTone,
} from "../workspace_ui";
import {
  DonutChart,
  GaugeChart,
  StatusLineChart,
} from "../visual_storytelling";

type UserMode = "athlete" | "coach";

type DashboardDecisionTile = {
  label: string;
  title: string;
  detail: string;
  tone?: AccentTone;
  onClick?: () => void;
};

type DashboardPrimaryAction = {
  title: string;
  body: string;
  cta: string;
  tab: string;
};

type Athlete = {
  id: string;
  name: string;
  division: string;
  status: string;
};

type WorkflowPriorityItem = {
  label: string;
  title: string;
  detail: string;
  tab: string;
  tone?: AccentTone;
  queueType?: "food" | "training" | "recovery" | "check-in" | "publish" | "data" | "support" | "plan";
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

type MomentumSignalItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  score: number;
  tone?: AccentTone;
  actionLabel: string;
  tab: string;
};

type WeeklyReviewItem = {
  label: string;
  title: string;
  detail: string;
  complete: boolean;
  tone?: AccentTone;
};

type PrepMacroProgressionWeek = {
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
  intakeBufferPct: number;
  adjustmentLabel: string;
  adjustmentDetail: string;
  trainingAdjustment: string;
};

type ChangeDigestItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  detail: string;
  impact?: string;
};

type PlanChangeDiffItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  tone?: AccentTone;
};

type DashboardTabProps = {
  userMode: UserMode;
  selfManagedAthlete: boolean;
  dashboardPrimaryAction: DashboardPrimaryAction;
  goToTab: (tab: string) => void;
  openNutritionSurface: (surface: "log" | "add" | "insights", entryMode?: "search" | "scan" | "custom") => void;
  openTrackerSurface: (surface: "dashboard" | "session" | "log" | "insights" | "week") => void;
  exportAthleteHandoff: () => void;
  coachInstruction: string;
  currentQuote: string;
  dashboardDecisionTiles: readonly DashboardDecisionTile[];
  activeAthlete: Athlete;
  athleteStatusLabel: string;
  athleteRoster: Athlete[];
  selectedAthleteId: string;
  setSelectedAthleteId: (value: string) => void;
  recoveryHeadroom: number;
  primaryLimiter: string;
  trainingSuggestion: string;
  autoApplySuggestion: boolean;
  setAutoApplySuggestion: (value: boolean) => void;
  applyTrainingSuggestion: () => void;
  autoApplyDietPreset: boolean;
  setAutoApplyDietPreset: (value: boolean) => void;
  applyMacroPreset: () => void;
  coachRecommendation: { action: string; reason: string };
  dashboardChangeSummary: string;
  selectedTrackerExecutionScore: number;
  selectedTrackerMissedLifts: number;
  lookStateLabel: string;
  conditionScore: number;
  addCheckIn: () => void;
  checkIns: CheckIn[];
  attachCheckInPhoto: (checkInId: string, slot: CheckInPhotoSlot, dataUrl: string) => void;
  removeCheckInPhoto: (checkInId: string, slot: CheckInPhotoSlot) => void;
  todayFuelSummary: {
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
  todayCompletionItems: readonly TodayCompletionItem[];
  momentumSignals: readonly MomentumSignalItem[];
  trackerWeeklyReview: {
    averageCompletion: number;
    completedDays: number;
    loggedDays: number;
  };
  weeklySnapshots: readonly WeeklySnapshot[];
  saveWeeklySnapshot: () => void;
  contestPrepModel: ContestPrepModel;
  macroProgressionWeeks: PrepMacroProgressionWeek[];
  applyAdaptiveWeekPlan: () => void;
  checkInReviewSnapshot: {
    status: "due" | "soon" | "on-track";
    title: string;
    detail: string;
    comparisonTitle: string;
    comparisonDetail: string;
    metrics: readonly {
      label: string;
      title: string;
      detail: string;
      tone?: AccentTone;
    }[];
  };
  nutritionPreset: string;
  workflowPriorities: readonly WorkflowPriorityItem[];
  recentChangeDigest: readonly ChangeDigestItem[];
  latestCoachUpdate: ChangeDigestItem;
  prepSignalSnapshot: PrepSignalSnapshot;
  decisionSignalGate: DecisionSignalGate;
  decisionBrief: DecisionBrief;
  latestPublishedDecision: PublishedCoachDecision | null;
  publishedPlanDiffs: readonly PlanChangeDiffItem[];
  acknowledgeLatestCoachDecision: () => void;
  coachThreadMessages: CoachThreadMessage[];
  sendCoachThreadMessage: (author: CoachThreadMessage["author"], body: string) => void;
  markCoachThreadMessagesRead: (messageIds?: string[]) => void;
};

const checkInPhotoSlots: CheckInPhotoSlot[] = ["front", "side", "back"];

const slotLabel = (slot: CheckInPhotoSlot) =>
  slot.charAt(0).toUpperCase() + slot.slice(1);

const readProgressPhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Photo could not be processed."));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Photo could not be read."));
    };

    image.src = objectUrl;
  });

const decisionTileTone = (tone?: AccentTone) => {
  switch (tone) {
    case "sky":
      return {
        panel: "border-sky-200 bg-sky-50/80 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/25",
        badge: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-100",
      };
    case "cyan":
      return {
        panel: "border-cyan-200 bg-cyan-50/80 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-950/25",
        badge: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-100",
      };
    case "emerald":
      return {
        panel: "border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/25",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-100",
      };
    case "amber":
      return {
        panel: "border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/25",
        badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100",
      };
    case "rose":
      return {
        panel: "border-rose-200 bg-rose-50/80 shadow-sm dark:border-rose-500/20 dark:bg-rose-950/25",
        badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-100",
      };
    default:
      return {
        panel: "border-slate-200 bg-slate-50/80 shadow-sm dark:border-white/10 dark:bg-white/[0.05]",
        badge: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-100",
      };
  }
};

const formatDecisionDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const publishedStatusBadgeClass = (decision: PublishedCoachDecision, userMode: UserMode) => {
  if (decision.status === "acknowledged") {
    return "border-emerald-200 bg-emerald-100/95 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-100";
  }

  return userMode === "coach"
    ? "border-amber-200 bg-amber-100/95 text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-100"
    : "border-sky-200 bg-sky-100/95 text-sky-800 dark:border-sky-400/25 dark:bg-sky-500/15 dark:text-sky-100";
};

type DashboardFlowLaneTone = "train" | "fuel" | "direction";

const dashboardFlowLaneTone = (tone: DashboardFlowLaneTone) => {
  if (tone === "fuel") {
    return {
      panel: "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-950/18",
      badge: "border-emerald-200 bg-white/78 text-emerald-700 dark:border-emerald-400/20 dark:bg-white/[0.08] dark:text-emerald-100",
      icon: "bg-emerald-500 text-white shadow-emerald-500/20",
      fill: "bg-emerald-500",
    };
  }

  if (tone === "direction") {
    return {
      panel: "border-indigo-200/80 bg-indigo-50/70 dark:border-indigo-500/20 dark:bg-indigo-950/18",
      badge: "border-indigo-200 bg-white/78 text-indigo-700 dark:border-indigo-400/20 dark:bg-white/[0.08] dark:text-indigo-100",
      icon: "bg-indigo-500 text-white shadow-indigo-500/20",
      fill: "bg-indigo-500",
    };
  }

  return {
    panel: "border-cyan-200/85 bg-cyan-50/80 dark:border-cyan-500/20 dark:bg-cyan-950/18",
    badge: "border-cyan-200 bg-white/78 text-cyan-700 dark:border-cyan-400/20 dark:bg-white/[0.08] dark:text-cyan-100",
    icon: "bg-cyan-500 text-white shadow-cyan-500/20",
    fill: "bg-cyan-500",
  };
};

const DashboardFlowLane = (props: {
  tone: DashboardFlowLaneTone;
  label: string;
  title: string;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
  metricLabel: string;
  metricValue: string;
  progress: number;
  actionLabel: string;
  onAction: () => void;
  children?: React.ReactNode;
}) => {
  const {
    tone,
    label,
    title,
    detail,
    Icon,
    metricLabel,
    metricValue,
    progress,
    actionLabel,
    onAction,
    children,
  } = props;
  const styles = dashboardFlowLaneTone(tone);
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`relative overflow-hidden rounded-lg border p-4 shadow-sm ${styles.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge className={styles.badge}>{label}</Badge>
          <div className="mt-3 text-lg font-semibold tracking-normal text-slate-950 dark:text-slate-100">
            {title}
          </div>
          <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">{detail}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-lg ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/72 bg-white/72 px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            {metricLabel}
          </div>
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{metricValue}</div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <div className={`h-full rounded-full transition-all duration-300 ${styles.fill}`} style={{ width: `${clampedProgress}%` }} />
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}

      <Button className="mt-4 w-full" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
};

export default function DashboardTab(props: DashboardTabProps) {
  const {
    userMode,
    selfManagedAthlete,
    dashboardPrimaryAction,
    goToTab,
    openNutritionSurface,
    openTrackerSurface,
    exportAthleteHandoff,
    coachInstruction,
    dashboardDecisionTiles,
    activeAthlete,
    athleteStatusLabel,
    athleteRoster,
    selectedAthleteId,
    setSelectedAthleteId,
    recoveryHeadroom,
    primaryLimiter,
    trainingSuggestion,
    autoApplySuggestion,
    setAutoApplySuggestion,
    applyTrainingSuggestion,
    autoApplyDietPreset,
    setAutoApplyDietPreset,
    applyMacroPreset,
    coachRecommendation,
    dashboardChangeSummary,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    lookStateLabel,
    conditionScore,
    addCheckIn,
    checkIns,
    attachCheckInPhoto,
    removeCheckInPhoto,
    todayFuelSummary,
    todayCompletionItems,
    momentumSignals,
    trackerWeeklyReview,
    weeklySnapshots,
    saveWeeklySnapshot,
    contestPrepModel,
    macroProgressionWeeks,
    applyAdaptiveWeekPlan,
    checkInReviewSnapshot,
    nutritionPreset,
    workflowPriorities,
    recentChangeDigest,
    latestCoachUpdate,
    prepSignalSnapshot,
    decisionSignalGate,
    decisionBrief,
    latestPublishedDecision,
    publishedPlanDiffs,
    acknowledgeLatestCoachDecision,
    coachThreadMessages,
    sendCoachThreadMessage,
    markCoachThreadMessagesRead,
  } = props;

  const decisionGateStyles = decisionTileTone(decisionSignalGate.tone);
  const decisionBriefStyles = decisionTileTone(decisionBrief.tone);
  const [showHomeContext, setShowHomeContext] = React.useState(false);
  const [showCheckInReview, setShowCheckInReview] = React.useState(userMode === "coach");
  const [showPlanActivityHistory, setShowPlanActivityHistory] = React.useState(false);
  const [showPrepSignalBoard, setShowPrepSignalBoard] = React.useState(false);
  const [showPrepRoadmap, setShowPrepRoadmap] = React.useState(userMode === "coach");
  const [showAdvancedPrepTargets, setShowAdvancedPrepTargets] = React.useState(false);
  const [showWorkflowDetails, setShowWorkflowDetails] = React.useState(false);
  const [showDailyBoard, setShowDailyBoard] = React.useState(false);
  const [showDecisionDetails, setShowDecisionDetails] = React.useState(false);
  const [showMomentumDetails, setShowMomentumDetails] = React.useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = React.useState(false);
  const [photoStatus, setPhotoStatus] = React.useState("");
  const [threadDraft, setThreadDraft] = React.useState("");
  const prepSignalBoardExpanded = userMode === "coach" || showPrepSignalBoard;
  const showCoachCommunication = userMode === "coach" || !selfManagedAthlete;
  const currentPrepMacroWeek = macroProgressionWeeks[0] ?? null;
  const activeTargetMismatch = Boolean(
    currentPrepMacroWeek &&
      (Math.abs(todayFuelSummary.calorieTarget - currentPrepMacroWeek.calories) > 25 ||
        Math.abs(todayFuelSummary.proteinTarget - currentPrepMacroWeek.protein) >= 5 ||
        Math.abs(todayFuelSummary.carbTarget - currentPrepMacroWeek.carbs) >= 5 ||
        Math.abs(todayFuelSummary.fatTarget - currentPrepMacroWeek.fats) >= 1)
  );
  const prepNeedsAdjustment =
    activeTargetMismatch ||
    currentPrepMacroWeek?.adjustmentLabel === "Apply now" ||
    currentPrepMacroWeek?.adjustmentLabel === "Sync target";
  const latestCheckIn = checkIns[checkIns.length - 1] ?? null;
  const latestPhotoCount = latestCheckIn
    ? checkInPhotoSlots.filter((slot) => Boolean(latestCheckIn.photos?.[slot])).length
    : 0;
  const recentPlanActivityItems = recentChangeDigest
    .filter((item) => item.id !== latestCoachUpdate.id)
    .slice(0, 3);
  const visibleCoachThreadMessages = coachThreadMessages
    .filter((message) => message.athleteId === activeAthlete.id)
    .slice(0, 3);
  const unreadCoachThreadMessages = coachThreadMessages.filter(
    (message) => message.athleteId === activeAthlete.id && message.author === "athlete" && !message.readAt
  );
  const photoTimelineEntries = checkIns
    .filter((checkIn) => checkInPhotoSlots.some((slot) => Boolean(checkIn.photos?.[slot])))
    .slice(-6)
    .reverse();
  const photoComparisonEntries = photoTimelineEntries.slice(0, 2);
  const dashboardChangeHeadline =
    dashboardChangeSummary?.split(". ")[0] ?? coachRecommendation.action;
  const trainingRecommendationTitle =
    recoveryHeadroom < 4.5
      ? "Reduce load"
      : primaryLimiter === "Digestion"
        ? "Reduce session drag"
        : "Hold training structure";
  const foodRecommendationTitle =
    primaryLimiter === "Digestion"
      ? "Reduce food friction"
      : primaryLimiter === "Fullness"
        ? "Increase peri-workout support"
        : "Hold food structure";
  const checkInReviewPanelClass =
    checkInReviewSnapshot.status === "due"
      ? "border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/25"
      : checkInReviewSnapshot.status === "soon"
        ? "border-sky-200 bg-sky-50/80 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/25"
        : "border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/25";
  const macroProgressRows = [
    {
      label: "Protein",
      consumed: todayFuelSummary.proteinConsumed,
      target: todayFuelSummary.proteinTarget,
      accent: "bg-emerald-500",
    },
    {
      label: "Carbs",
      consumed: todayFuelSummary.carbsConsumed,
      target: todayFuelSummary.carbTarget,
      accent: "bg-sky-500",
    },
    {
      label: "Fat",
      consumed: todayFuelSummary.fatsConsumed,
      target: todayFuelSummary.fatTarget,
      accent: "bg-amber-500",
    },
  ];
  const openCompletionCount = todayCompletionItems.filter((item) => !item.done).length;
  const formatSignedMove = (value: number, unit: string) =>
    value === 0 ? `0 ${unit}` : `${value > 0 ? "+" : ""}${value} ${unit}`;
  const completedTodayCount = todayCompletionItems.filter((item) => item.done).length;
  const dailyCompletionPct =
    todayCompletionItems.length > 0
      ? Math.round((completedTodayCount / todayCompletionItems.length) * 100)
      : 0;
  const dashboardReadinessScore = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        selectedTrackerExecutionScore * 0.45 +
          conditionScore * 10 * 0.25 +
          recoveryHeadroom * 10 * 0.2 +
          dailyCompletionPct * 0.1
      )
    )
  );
  const dashboardTrendLine = [
    Math.max(0, selectedTrackerExecutionScore - 12),
    Math.max(0, selectedTrackerExecutionScore - 7),
    Math.max(0, selectedTrackerExecutionScore - 3),
    selectedTrackerExecutionScore,
    dailyCompletionPct,
  ];
  const macroChartSegments = [
    { label: "Protein", value: todayFuelSummary.proteinConsumed, color: "#10b981" },
    { label: "Carbs", value: todayFuelSummary.carbsConsumed, color: "#0ea5e9" },
    { label: "Fat", value: todayFuelSummary.fatsConsumed, color: "#f59e0b" },
  ];
  const primaryDailyItem =
    userMode === "athlete" && selectedTrackerMissedLifts > 0
      ? todayCompletionItems.find((item) => item.label === "Training") ?? todayCompletionItems.find((item) => !item.done) ?? todayCompletionItems[0]
      : todayCompletionItems.find((item) => !item.done) ?? todayCompletionItems[0];
  const repeatedPriorityPattern = /open lifts|open lift|today's work|actual work|adherence|complete today's training log/i;
  const visibleWorkflowPriorities = workflowPriorities
    .filter((item) => !repeatedPriorityPattern.test(`${item.title} ${item.detail}`))
    .slice(0, 2);
  const openCompletionItem = (item: TodayCompletionItem) => {
    if (item.label === "Direction" && !item.done) {
      if (userMode === "athlete") {
        acknowledgeLatestCoachDecision();
      } else {
        goToTab("coach");
      }
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.done ? "log" : "add", "search");
      return;
    }

    goToTab(item.tab);
  };
  const openDecisionGateItem = (item?: DecisionSignalGateItem) => {
    if (!item) {
      goToTab(decisionSignalGate.primaryTab);
      return;
    }

    if (item.id === "direction" && latestPublishedDecision?.status !== "acknowledged") {
      if (userMode === "athlete") {
        acknowledgeLatestCoachDecision();
      } else {
        goToTab("coach");
      }
      return;
    }

    if (item.id === "check-in") {
      setShowCheckInReview(true);
      if (item.actionLabel === "Add Check-in") {
        addCheckIn();
      }
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.id === "food-start" ? "add" : "log", "search");
      return;
    }

    goToTab(item.tab);
  };
  const openDecisionBriefItem = (item: DecisionBriefItem) => {
    if (item.id === "signal" && decisionSignalGate.missing[0]) {
      openDecisionGateItem(decisionSignalGate.missing[0]);
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.actionLabel === "Add Food" ? "add" : "log", "search");
      return;
    }

    goToTab(item.tab);
  };
  const openDecisionBriefPrimary = () => {
    if (decisionSignalGate.status !== "ready" && decisionSignalGate.missing[0]) {
      openDecisionGateItem(decisionSignalGate.missing[0]);
      return;
    }

    if (decisionBrief.primaryTab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    if (decisionBrief.primaryTab === "nutrition") {
      openNutritionSurface("add", "search");
      return;
    }

    goToTab(decisionBrief.primaryTab);
  };
  const homePrimaryTone: AccentTone =
    userMode === "coach" ? decisionBrief.tone : primaryDailyItem?.tone ?? "sky";
  const homePrimaryStyles = decisionTileTone(homePrimaryTone);
  const homePrimaryProgressClass =
    homePrimaryTone === "emerald"
      ? "bg-emerald-500"
      : homePrimaryTone === "amber"
        ? "bg-amber-500"
        : homePrimaryTone === "rose"
          ? "bg-rose-500"
          : homePrimaryTone === "cyan"
            ? "bg-cyan-500"
            : homePrimaryTone === "sky"
              ? "bg-sky-500"
              : "bg-slate-700 dark:bg-slate-100";
  const homePrimaryLabel =
    userMode === "coach" ? "Coach next move" : primaryDailyItem?.label ?? "Next";
  const homePrimaryTitle =
    userMode === "coach" ? decisionBrief.title : primaryDailyItem?.title ?? dashboardPrimaryAction.title;
  const homePrimaryDetail =
    userMode === "coach" ? decisionBrief.detail : primaryDailyItem?.detail ?? dashboardPrimaryAction.body;
  const homePrimaryCta =
    userMode === "coach" ? decisionBrief.primaryActionLabel : primaryDailyItem?.cta ?? dashboardPrimaryAction.cta;
  const homePrimaryProgress =
    userMode === "coach" ? decisionSignalGate.score : primaryDailyItem?.done ? 100 : dailyCompletionPct;
  const openHomePrimaryAction = () => {
    if (userMode === "coach") {
      openDecisionBriefPrimary();
      return;
    }

    if (primaryDailyItem) {
      openCompletionItem(primaryDailyItem);
      return;
    }

    if (dashboardPrimaryAction.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    if (dashboardPrimaryAction.tab === "nutrition") {
      openNutritionSurface("add", "search");
      return;
    }

    goToTab(dashboardPrimaryAction.tab);
  };
  const trainingCompletionItem =
    todayCompletionItems.find((item) => item.label === "Training") ?? primaryDailyItem;
  const fuelCompletionItem =
    todayCompletionItems.find((item) => item.label === "Food") ?? primaryDailyItem;
  const basicsCompletionItem = todayCompletionItems.find((item) => item.label === "Basics");
  const stepsCompletionItem = todayCompletionItems.find((item) => item.label === "Steps");
  const directionCompletionItem = todayCompletionItems.find((item) => item.label === "Direction");
  const closeoutCompletionItem = todayCompletionItems.find((item) => item.label === "Closeout");
  const fuelProgressPct =
    todayFuelSummary.calorieTarget > 0
      ? Math.min(100, (todayFuelSummary.caloriesConsumed / todayFuelSummary.calorieTarget) * 100)
      : 0;
  const trainingProgressPct = Math.max(0, Math.min(100, selectedTrackerExecutionScore));
  const directionProgressPct =
    userMode === "coach"
      ? decisionSignalGate.score
      : latestPublishedDecision && latestPublishedDecision.status !== "acknowledged"
        ? 42
        : dailyCompletionPct;
  const directionLaneTitle =
    userMode === "coach"
      ? decisionBrief.title
      : latestPublishedDecision
        ? latestPublishedDecision.title
        : selfManagedAthlete
          ? "Plan is yours to steer"
          : directionCompletionItem?.title ?? "Direction synced";
  const directionLaneDetail =
    userMode === "coach"
      ? decisionBrief.detail
      : latestPublishedDecision
        ? latestPublishedDecision.instruction
        : selfManagedAthlete
          ? dashboardChangeSummary || coachRecommendation.reason
          : directionCompletionItem?.detail ?? "No new coach update needs acknowledgement.";
  const flowCloseoutItems = [
    trainingCompletionItem,
    fuelCompletionItem,
    basicsCompletionItem,
    stepsCompletionItem,
    directionCompletionItem,
    closeoutCompletionItem,
  ]
    .filter((item): item is TodayCompletionItem => Boolean(item))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.label === item.label) === index)
    .sort((left, right) => Number(left.done) - Number(right.done))
    .slice(0, 5);
  const steadyMomentumCount = momentumSignals.filter((item) => item.score >= 80).length;
  const momentumAverageScore =
    momentumSignals.length > 0
      ? Math.round(momentumSignals.reduce((total, item) => total + item.score, 0) / momentumSignals.length)
      : 0;
  const foodMomentum = momentumSignals.find((item) => item.id === "food");
  const closeoutMomentum = momentumSignals.find((item) => item.id === "closeout");
  const latestWeeklySnapshot =
    weeklySnapshots
      .slice()
      .sort((left, right) => right.date.localeCompare(left.date))[0] ?? null;
  const weeklyReviewItems: WeeklyReviewItem[] = [
    {
      label: "Evidence",
      title: `${trackerWeeklyReview.averageCompletion}% week`,
      detail: `${trackerWeeklyReview.completedDays} completed days, ${trackerWeeklyReview.loggedDays} logged days.`,
      complete: trackerWeeklyReview.averageCompletion >= 70,
      tone: trackerWeeklyReview.averageCompletion >= 80 ? "emerald" : trackerWeeklyReview.averageCompletion >= 60 ? "amber" : "rose",
    },
    {
      label: "Momentum",
      title: `${steadyMomentumCount}/${momentumSignals.length} steady`,
      detail: `Food ${foodMomentum?.score ?? 0}%, closeout ${closeoutMomentum?.score ?? 0}%.`,
      complete: momentumAverageScore >= 70,
      tone: momentumAverageScore >= 80 ? "emerald" : momentumAverageScore >= 55 ? "amber" : "rose",
    },
    {
      label: "Review",
      title: checkInReviewSnapshot.title,
      detail: checkInReviewSnapshot.detail,
      complete: checkInReviewSnapshot.status !== "due",
      tone: checkInReviewSnapshot.status === "on-track" ? "emerald" : checkInReviewSnapshot.status === "soon" ? "sky" : "amber",
    },
    {
      label: "Next week",
      title: prepNeedsAdjustment
        ? currentPrepMacroWeek?.adjustmentLabel ?? "Sync target"
        : "Plan can hold",
      detail: currentPrepMacroWeek
        ? `${currentPrepMacroWeek.calories} kcal, ${currentPrepMacroWeek.protein}P / ${currentPrepMacroWeek.carbs}C / ${currentPrepMacroWeek.fats}F.`
        : contestPrepModel.headline,
      complete: !prepNeedsAdjustment,
      tone: prepNeedsAdjustment ? "amber" : "emerald",
    },
  ];
  const weeklyReviewReadyCount = weeklyReviewItems.filter((item) => item.complete).length;
  const openTrainingLane = () => {
    if (trainingCompletionItem) {
      openCompletionItem(trainingCompletionItem);
      return;
    }

    openTrackerSurface("log");
  };
  const openFuelLane = () => {
    if (fuelCompletionItem) {
      openCompletionItem(fuelCompletionItem);
      return;
    }

    openNutritionSurface("add", "search");
  };
  const openDirectionLane = () => {
    if (userMode === "coach") {
      openDecisionBriefPrimary();
      return;
    }

    if (directionCompletionItem) {
      openCompletionItem(directionCompletionItem);
      return;
    }

    if (selfManagedAthlete) {
      goToTab("schedule");
      return;
    }

    goToTab("dashboard");
  };
  const openWorkflowPriority = (item: WorkflowPriorityItem) => {
    if (item.tab === "tracker") {
      openTrackerSurface(item.queueType === "plan" ? "week" : "log");
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.queueType === "food" ? "add" : "insights", "search");
      return;
    }

    if (item.queueType === "check-in") {
      setShowCheckInReview(true);
      return;
    }

    goToTab(item.tab);
  };
  const openMomentumSignal = (item: MomentumSignalItem) => {
    if (item.id === "check-in") {
      if (item.actionLabel === "Add check-in") {
        addCheckIn();
        return;
      }

      setShowCheckInReview(true);
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.actionLabel === "Add food" ? "add" : "log", "search");
      return;
    }

    goToTab(item.tab);
  };
  const dashboardWorkflowPriorities =
    userMode === "coach"
      ? showWorkflowDetails
        ? workflowPriorities
        : workflowPriorities.slice(0, 3)
      : visibleWorkflowPriorities;
  const prepPhaseToneClass = (tone: ContestPrepModel["phases"][number]["tone"]) => {
    switch (tone) {
      case "sky":
        return "border-sky-200 bg-sky-50/80 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/25";
      case "emerald":
        return "border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/25";
      case "amber":
        return "border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/25";
      case "rose":
        return "border-rose-200 bg-rose-50/80 shadow-sm dark:border-rose-500/20 dark:bg-rose-950/25";
      default:
        return "border-slate-200 bg-slate-50/80 shadow-sm dark:border-white/10 dark:bg-white/[0.05]";
    }
  };

  const uploadCheckInPhoto = async (checkInId: string, slot: CheckInPhotoSlot, file: File | null) => {
    if (!file) return;

    try {
      const dataUrl = await readProgressPhoto(file);
      attachCheckInPhoto(checkInId, slot, dataUrl);
      setPhotoStatus(`${slotLabel(slot)} photo saved.`);
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "Photo could not be saved.");
    }
  };

  const operatingNotes =
    userMode === "coach"
      ? [
          {
            label: "Current status",
            title:
              selectedTrackerExecutionScore < 50
                ? "Execution is still the real variable"
                : athleteStatusLabel,
            detail:
              selectedTrackerExecutionScore < 50
                ? `${selectedTrackerMissedLifts} lifts are still unchecked, so the week should not be over-edited yet.`
                : `${activeAthlete.name} is currently reading as ${lookStateLabel.toLowerCase()}.`,
          },
          {
            label: "Decision pressure",
            title: dashboardChangeHeadline,
            detail: dashboardChangeSummary || coachRecommendation.reason,
          },
          {
            label: "Publishing rule",
            title: "One clear call beats five partial changes",
            detail:
              "Send one direction, one reason, and one next action. If the package feels noisy, it is not ready.",
          },
        ]
      : [
          {
            label: "Current status",
            title: athleteStatusLabel,
            detail: `${activeAthlete.name} is currently reading as ${lookStateLabel.toLowerCase()}.`,
          },
          {
            label: "Main limiter",
            title: primaryLimiter,
            detail: coachRecommendation.reason,
          },
          {
            label: "Management mode",
            title: selfManagedAthlete ? "Edit deliberately" : "Coach-managed mode is active",
            detail: selfManagedAthlete
              ? "Builder screens are available, but use them only when the signal truly calls for change."
              : "Follow the published direction first. Structural changes live with the coach.",
          },
        ];

  return (
    <div className="dashboard-priority-flow mt-3 flex flex-col gap-3 sm:mt-4 sm:gap-4">
      {showHomeContext ? (
      <div className="dashboard-priority-overview">
      <SectionCard
        title={userMode === "coach" ? "Coach dashboard" : "Dashboard"}
        description={
          userMode === "coach"
            ? "Treat home like a quiet decision desk: one call, one supporting read, then move."
            : "Optional strategy context. The daily path stays above this so execution remains the default."
        }
        right={(
          <Button variant="outline" size="sm" onClick={() => setShowHomeContext(false)}>
            Hide context
          </Button>
        )}
      >
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {userMode === "coach" ? (
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/86">
                <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="space-y-2">
                    <Label>Active athlete</Label>
                    <select
                      className={inputClass}
                      value={selectedAthleteId}
                      onChange={(event) => setSelectedAthleteId(event.target.value)}
                    >
                      {athleteRoster.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.name}, {athlete.division}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                          {activeAthlete.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activeAthlete.division}</div>
                      </div>
                      <Badge variant="outline">{activeAthlete.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {athleteStatusLabel}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/88 sm:p-6">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
                {decisionBrief.eyebrow}
              </div>
              <Badge className={`mt-3 ${decisionBriefStyles.badge}`}>
                {decisionBrief.scoreLabel} - {decisionBrief.sourceLabel}
              </Badge>
              <div className="mt-4 text-[2.2rem] font-bold leading-tight tracking-normal text-slate-950 dark:text-slate-100">
                {decisionBrief.title}
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
                {userMode === "athlete" && !selfManagedAthlete ? dashboardPrimaryAction.body : decisionBrief.detail}
              </p>

              {userMode === "coach" ? (
                <div className="mt-6 rounded-[22px] border border-white/90 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                    What gets published
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {decisionBrief.detail}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                {userMode === "coach" ? (
                  <>
                    <Button size="lg" onClick={openDecisionBriefPrimary}>
                      {decisionBrief.primaryActionLabel}
                    </Button>
                    <Button variant="outline" onClick={exportAthleteHandoff}>
                      Copy Handoff
                    </Button>
                    <Button variant="outline" onClick={() => openTrackerSurface("dashboard")}>
                      Check Today
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" onClick={() => openTrackerSurface("session")}>Active Training</Button>
                    <Button variant="outline" onClick={() => openNutritionSurface("add", "search")}>
                      Add Food
                    </Button>
                    <Button variant="outline" onClick={() => openTrackerSurface("week")}>
                      Week
                    </Button>
                  </>
                )}
              </div>
            </div>

            {showHomeContext ? (
              userMode === "coach" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={["rounded-[24px] border p-4", surfaceToneClass("primary")].join(" ")}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Training recommendation
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {trainingRecommendationTitle}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{trainingSuggestion}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950/50">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                          Auto-apply
                        </div>
                        <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                          Let the app push the training change.
                        </div>
                      </div>
                      <Switch checked={autoApplySuggestion} onCheckedChange={setAutoApplySuggestion} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button className="flex-1" variant="outline" onClick={applyTrainingSuggestion}>
                        Apply now
                      </Button>
                      <Button className="flex-1" variant="ghost" onClick={() => goToTab("split")}>
                        Open training
                      </Button>
                    </div>
                  </div>

                  <div className={["rounded-[24px] border p-4", surfaceToneClass("primary")].join(" ")}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Food recommendation
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {foodRecommendationTitle}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{nutritionPreset}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950/50">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                          Auto-apply
                        </div>
                        <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                          Let the app push the food adjustment.
                        </div>
                      </div>
                      <Switch checked={autoApplyDietPreset} onCheckedChange={setAutoApplyDietPreset} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button className="flex-1" variant="outline" onClick={applyMacroPreset}>
                        Apply now
                      </Button>
                      <Button className="flex-1" variant="ghost" onClick={() => openNutritionSurface("insights")}>
                        Review food
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={["rounded-[24px] border p-4", surfaceToneClass("secondary")].join(" ")}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Main limiter
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {primaryLimiter}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {coachRecommendation.reason}
                    </p>
                  </div>

                  <div className={["rounded-[24px] border p-4", surfaceToneClass("secondary")].join(" ")}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Food direction
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {foodRecommendationTitle}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{nutritionPreset}</p>
                  </div>
                </div>
              )
            ) : null}
          </div>

          <div className="space-y-3">
            {userMode === "athlete" ? (
              <>
                <GaugeChart
                  label="Readiness"
                  value={dashboardReadinessScore}
                  helper={`${dailyCompletionPct}% daily closeout`}
                  tone={dashboardReadinessScore >= 80 ? "emerald" : dashboardReadinessScore >= 60 ? "amber" : "rose"}
                />
                <StatusLineChart
                  label="Execution trend"
                  values={dashboardTrendLine}
                  unit="%"
                  helper="Red, yellow, green read across the current week."
                />
                <DonutChart
                  label="Macros"
                  center={`${todayFuelSummary.caloriesConsumed}`}
                  segments={macroChartSegments}
                />
              </>
            ) : (
              <>
            <div className="grid gap-3">
              {decisionBrief.items.map((item, index) => {
                const styles = decisionTileTone(item.tone);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openDecisionBriefItem(item)}
                    className={`${index === 0 ? "rounded-[28px] p-5 sm:p-6" : "rounded-[22px] p-4"} border text-left transition hover:-translate-y-[1px] hover:shadow-md ${styles.panel}`}
                  >
                    <div className={`inline-flex rounded-full border ${index === 0 ? "px-3 py-1" : "px-2.5 py-1"} text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                      {item.label}
                    </div>
                    <div className={`${index === 0 ? "mt-4 text-[2rem] leading-tight" : "mt-3 text-base"} font-semibold tracking-normal text-slate-950 dark:text-slate-100`}>
                      {item.title}
                    </div>
                    <p className={`${index === 0 ? "mt-3 leading-7 text-slate-700" : "mt-2 leading-6 text-slate-600"} text-sm dark:text-slate-300`}>
                      {item.detail}
                    </p>
                    <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                      {item.actionLabel}
                    </div>
                  </button>
                );
              })}
            </div>
              </>
            )}

            {userMode === "coach" ? (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Supporting context
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {showHomeContext
                      ? "Extra guidance is visible now. Hide it again when you want home to return to a faster, cleaner decision surface."
                      : "Dashboard is intentionally trimmed to the core call first. Open the supporting context only when you need the why, the guardrails, or the publish notes."}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowHomeContext((prev) => !prev)}>
                  {showHomeContext ? "Hide context" : "Show context"}
                </Button>
              </div>
            </div>
            ) : null}
          </div>
        </div>
      </SectionCard>
      </div>
      ) : null}

      <div className="dashboard-priority-today">
      <SectionCard
        title={userMode === "coach" ? "Next coaching action" : "Do next"}
        description={undefined}
      >
        <div className={`rounded-[28px] border p-4 shadow-sm sm:p-5 ${homePrimaryStyles.panel}`}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={homePrimaryStyles.badge}>{homePrimaryLabel}</Badge>
                {userMode === "coach" ? <Badge variant="outline">{activeAthlete.name}</Badge> : null}
                <Badge variant="outline">
                  {openCompletionCount === 0 ? "Day clean" : `${openCompletionCount} open`}
                </Badge>
                <Badge variant="outline">{dashboardReadinessScore}% ready</Badge>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-100 sm:text-3xl">
                {homePrimaryTitle}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                {homePrimaryDetail}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={openHomePrimaryAction}>{homePrimaryCta}</Button>
                <Button variant="outline" onClick={() => setShowDailyBoard((value) => !value)}>
                  {showDailyBoard ? "Hide daily board" : "Show daily board"}
                </Button>
                <Button variant="ghost" onClick={() => setShowDecisionDetails((value) => !value)}>
                  {showDecisionDetails ? "Hide decision" : "Decision details"}
                </Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/75 bg-white/76 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                  Daily loop
                </div>
                <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {completedTodayCount}/{todayCompletionItems.length}
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div className={`h-full rounded-full transition-all duration-300 ${homePrimaryProgressClass}`} style={{ width: `${Math.max(0, Math.min(100, homePrimaryProgress))}%` }} />
              </div>
              <div className="mt-3 grid gap-2">
                {flowCloseoutItems.slice(0, 4).map((item) => {
                  const styles = decisionTileTone(item.tone);

                  return (
                    <button
                      key={`focus-${item.label}`}
                      type="button"
                      onClick={() => openCompletionItem(item)}
                      className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white/80 px-3 py-2 text-left transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/35"
                    >
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                        {item.label}
                      </span>
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.done ? "Done" : item.cta}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            { label: "Daily board", active: showDailyBoard, onClick: () => setShowDailyBoard((value) => !value) },
            { label: "Decision", active: showDecisionDetails, onClick: () => setShowDecisionDetails((value) => !value) },
            { label: "Momentum", active: showMomentumDetails, onClick: () => setShowMomentumDetails((value) => !value) },
            { label: "Weekly review", active: showWeeklyReview, onClick: () => setShowWeeklyReview((value) => !value) },
          ].map((item) => (
            <Button
              key={`dashboard-toggle-${item.label}`}
              size="sm"
              variant={item.active ? "default" : "outline"}
              onClick={item.onClick}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {showDailyBoard ? (
        <>
        <div className="grid gap-3 xl:grid-cols-3">
          <DashboardFlowLane
            tone="train"
            label={userMode === "coach" ? "Training read" : "Train"}
            title={trainingCompletionItem?.title ?? "Open today's training"}
            detail={trainingCompletionItem?.detail ?? "Open the live session and log the work that happened."}
            Icon={Dumbbell}
            metricLabel="Execution"
            metricValue={`${selectedTrackerExecutionScore}%`}
            progress={trainingProgressPct}
            actionLabel={trainingCompletionItem?.cta ?? "Open Today"}
            onAction={openTrainingLane}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/70 bg-white/68 px-3 py-2 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Open lifts</div>
                <div className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{selectedTrackerMissedLifts}</div>
              </div>
              <div className="rounded-lg border border-white/70 bg-white/68 px-3 py-2 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Readiness</div>
                <div className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{dashboardReadinessScore}%</div>
              </div>
            </div>
          </DashboardFlowLane>

          <DashboardFlowLane
            tone="fuel"
            label={userMode === "coach" ? "Fuel read" : "Fuel"}
            title={fuelCompletionItem?.title ?? `${Math.max(0, todayFuelSummary.calorieRemaining)} kcal left`}
            detail={fuelCompletionItem?.detail ?? "Keep food logging close enough to guide the next decision."}
            Icon={Utensils}
            metricLabel="Calories"
            metricValue={`${todayFuelSummary.caloriesConsumed} / ${todayFuelSummary.calorieTarget}`}
            progress={fuelProgressPct}
            actionLabel={fuelCompletionItem?.cta ?? "Add Food"}
            onAction={openFuelLane}
          >
            <div className="grid gap-2">
              {macroProgressRows.map((row) => {
                const percent = row.target > 0 ? Math.min(100, (row.consumed / row.target) * 100) : 0;

                return (
                  <div key={row.label} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/82 dark:bg-white/10">
                      <div className={`h-full rounded-full transition-all duration-300 ${row.accent}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">{row.consumed}/{row.target}g</div>
                  </div>
                );
              })}
            </div>
          </DashboardFlowLane>

          <DashboardFlowLane
            tone="direction"
            label={userMode === "coach" ? "Direction" : selfManagedAthlete ? "Plan" : "Coach"}
            title={directionLaneTitle}
            detail={directionLaneDetail}
            Icon={MessageSquareText}
            metricLabel={userMode === "coach" ? "Signal gate" : "Daily closeout"}
            metricValue={userMode === "coach" ? `${decisionSignalGate.score}%` : `${completedTodayCount}/${todayCompletionItems.length}`}
            progress={directionProgressPct}
            actionLabel={userMode === "coach" ? decisionBrief.primaryActionLabel : directionCompletionItem?.cta ?? (selfManagedAthlete ? "Plan Week" : "Open Direction")}
            onAction={openDirectionLane}
          >
            <div className="space-y-2">
              <div className="rounded-lg border border-white/70 bg-white/68 px-3 py-2 text-sm leading-5 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                {openCompletionCount === 0
                  ? "Nothing is blocking the day."
                  : `${openCompletionCount} daily loop${openCompletionCount === 1 ? "" : "s"} still open.`}
              </div>
              {latestPublishedDecision ? (
                <Badge className={publishedStatusBadgeClass(latestPublishedDecision, userMode)}>
                  {latestPublishedDecision.status === "acknowledged" ? "Acknowledged" : userMode === "coach" ? "Awaiting athlete" : "Needs acknowledgement"}
                </Badge>
              ) : null}
              {userMode === "athlete" && latestPublishedDecision && publishedPlanDiffs[0] ? (
                <div className="rounded-lg border border-white/70 bg-white/68 px-3 py-2 text-xs leading-5 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                  <span className="font-semibold text-slate-950 dark:text-slate-100">
                    Changed:
                  </span>{" "}
                  {publishedPlanDiffs[0].title}
                </div>
              ) : null}
            </div>
          </DashboardFlowLane>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/72 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Daily closeout
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {openCompletionCount === 0 ? "Everything important is closed." : `${openCompletionCount} open item${openCompletionCount === 1 ? "" : "s"} before the day is clean.`}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
              {flowCloseoutItems.map((item) => {
                const styles = decisionTileTone(item.tone);

                return (
                  <button
                    key={`${item.label}-${item.title}`}
                    type="button"
                    onClick={() => openCompletionItem(item)}
                    className={`min-w-0 rounded-lg border px-3 py-2 text-left transition hover:-translate-y-[1px] hover:shadow-md ${styles.panel}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                        {item.label}
                      </span>
                      {item.done ? <span className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-200">Done</span> : null}
                    </div>
                    <div className="mt-1 truncate text-xs font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </>
        ) : null}

        {showDecisionDetails ? (
        <div className={`mt-3 rounded-lg border p-3 shadow-sm ${decisionGateStyles.panel}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${decisionGateStyles.badge}`}>
                Decision brief
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {decisionBrief.title}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {decisionBrief.detail}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={decisionGateStyles.badge}>{decisionBrief.scoreLabel}</Badge>
              <Button size="sm" onClick={openDecisionBriefPrimary}>
                {decisionBrief.primaryActionLabel}
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {decisionBrief.items.map((item) => {
              const styles = decisionTileTone(item.tone);

              return (
                <div key={item.id} className={`rounded-lg border px-3 py-3 ${styles.panel}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                      {item.label}
                    </span>
                    <button type="button" onClick={() => openDecisionBriefItem(item)} className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                      {item.actionLabel}
                    </button>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
        ) : null}

        {showMomentumDetails ? (
        <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/72 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Consistency momentum
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                Build the loop. Missed days are recovered by the next clean action.
              </div>
            </div>
            <Badge variant="outline">
              {steadyMomentumCount}/{momentumSignals.length} steady
            </Badge>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {momentumSignals.map((item) => {
              const styles = decisionTileTone(item.tone);
              const clampedScore = Math.max(0, Math.min(100, item.score));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openMomentumSignal(item)}
                  className={`rounded-lg border px-3 py-3 text-left transition hover:-translate-y-[1px] hover:shadow-md ${styles.panel}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{clampedScore}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80 dark:bg-white/10">
                    <div className="h-full rounded-full bg-current opacity-70 transition-all duration-300" style={{ width: `${clampedScore}%` }} />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    {item.actionLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        ) : null}

        {showWeeklyReview ? (
        <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/78 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Weekly review ritual
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                Close the week from evidence, then set the next target.
              </div>
            </div>
            <Badge variant="outline">{weeklyReviewReadyCount}/{weeklyReviewItems.length} ready</Badge>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {weeklyReviewItems.map((item) => {
              const styles = decisionTileTone(item.tone);

              return (
                <div key={item.label} className={`rounded-lg border px-3 py-3 ${styles.panel}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                      {item.label}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${item.complete ? "text-emerald-700 dark:text-emerald-200" : "text-amber-700 dark:text-amber-200"}`}>
                      {item.complete ? "Ready" : "Needs work"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-slate-200/75 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04] lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Review receipt
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {latestWeeklySnapshot
                  ? `${latestWeeklySnapshot.weekLabel} saved at ${latestWeeklySnapshot.completion}% completion`
                  : "No weekly review saved yet"}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {latestWeeklySnapshot
                  ? `${latestWeeklySnapshot.recommendation} Limiter: ${latestWeeklySnapshot.limiter}.`
                  : "Save once the week has enough food, training, check-in, and closeout evidence."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button size="sm" onClick={saveWeeklySnapshot}>
                Save week review
              </Button>
              {prepNeedsAdjustment ? (
                <Button size="sm" variant="outline" onClick={applyAdaptiveWeekPlan}>
                  Sync next week
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => userMode === "coach" ? goToTab("coach") : openTrackerSurface("week")}
              >
                {userMode === "coach" ? "Review package" : "Open week"}
              </Button>
            </div>
          </div>
        </div>
        ) : null}
        {!showHomeContext ? (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowHomeContext(true)}>
              {userMode === "coach" ? "Show coach context" : "Show plan context"}
            </Button>
          </div>
        ) : null}
      </SectionCard>
      </div>

      <div className={`grid gap-5 ${showHomeContext && userMode === "coach" ? "xl:grid-cols-[0.94fr_1.06fr]" : ""}`}>
        {showHomeContext && userMode === "coach" ? (
          <SectionCard
            title={userMode === "coach" ? "Publishing notes" : "Stay on script"}
            description={
              userMode === "coach"
                ? "These are the notes that keep the package clean before it goes out."
                : "This is the simple context that should keep you from wandering."
            }
          >
            <div className="space-y-3">
              {operatingNotes.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className={[
                    "rounded-[22px] border p-4",
                    index === 0 ? surfaceToneClass("primary") : surfaceToneClass("secondary"),
                  ].join(" ")}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        <SectionCard
          title="Recent check-ins"
          description={showCheckInReview ? "Use the last few check-ins to confirm whether the current call is holding." : "Collapsed by default so the dashboard keeps the daily path light."}
          right={(
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={scoreChipClass(conditionScore)}>
                Condition {conditionScore.toFixed(1)}
              </Badge>
              <Button variant="outline" onClick={() => setShowCheckInReview((value) => !value)}>
                {showCheckInReview ? "Hide review" : "Show review"}
              </Button>
              <Button
                variant="outline"
                onClick={() => userMode === "coach" ? goToTab("coach") : openTrackerSurface("week")}
              >
                {userMode === "coach" ? "Review package" : "Week"}
              </Button>
              <Button onClick={addCheckIn}>Add check-in</Button>
            </div>
          )}
        >
          {showCheckInReview ? (
          <div className="space-y-4">
            <div className={`rounded-[24px] border p-4 sm:p-5 ${checkInReviewPanelClass}`}>
              <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    Review cadence
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                    {checkInReviewSnapshot.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {checkInReviewSnapshot.detail}
                  </p>
                </div>
                <div className={["rounded-[20px] border p-4", surfaceToneClass("primary")].join(" ")}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    Live vs last review
                  </div>
                  <div className="mt-2 text-base font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                    {checkInReviewSnapshot.comparisonTitle}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {checkInReviewSnapshot.comparisonDetail}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {checkInReviewSnapshot.metrics.map((item) => (
                <SignalTile
                  key={`${item.label}-${item.title}`}
                  label={item.label}
                  title={item.title}
                  detail={item.detail}
                  tone={item.tone}
                />
              ))}
            </div>

            {checkIns.length === 0 ? (
              <EmptyStatePanel
                title="No check-ins are stored yet"
                detail="Log the first review so the dashboard can compare the live read against an actual checkpoint."
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-3">
                {checkIns.slice(-3).reverse().map((checkIn) => {
                  const photoCount = checkInPhotoSlots.filter((slot) => Boolean(checkIn.photos?.[slot])).length;

                  return (
                  <div key={checkIn.id} className="rounded-[20px] border border-slate-200 bg-white/88 px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                          {checkIn.label}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {checkIn.date}
                        </div>
                      </div>
                      <Badge className={scoreChipClass(checkIn.condition)}>
                        {checkIn.condition.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Bodyweight</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{checkIn.bodyWeight}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Recovery</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{checkIn.recovery.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Training</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{checkIn.training.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                          Progress photos
                        </div>
                        <Badge variant="outline">{photoCount}/3</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {checkInPhotoSlots.map((slot) => {
                          const photo = checkIn.photos?.[slot];

                          return (
                            <div key={`${checkIn.id}-${slot}`} className="overflow-hidden rounded-[14px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                              {photo ? (
                                <img src={photo} alt={`${checkIn.label} ${slot} progress`} className="aspect-[3/4] w-full object-cover" />
                              ) : (
                                <div className="flex aspect-[3/4] items-center justify-center px-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {slotLabel(slot)}
                                </div>
                              )}
                              <div className="grid gap-1 border-t border-slate-200 p-1.5 dark:border-white/10">
                                <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-[10px] border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      void uploadCheckInPhoto(checkIn.id, slot, event.currentTarget.files?.[0] ?? null);
                                      event.currentTarget.value = "";
                                    }}
                                  />
                                  {photo ? "Replace" : "Upload"}
                                </label>
                                {photo ? (
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-[11px]" onClick={() => removeCheckInPhoto(checkIn.id, slot)}>
                                    Remove
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
            {photoTimelineEntries.length > 0 ? (
              <div className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                      Photo timeline
                    </div>
                    <div className="mt-1.5 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {photoComparisonEntries.length >= 2
                        ? `${photoComparisonEntries[0].label} vs ${photoComparisonEntries[1].label}`
                        : photoTimelineEntries[0].label}
                    </div>
                  </div>
                  <Badge variant="outline">{photoTimelineEntries.length} check-in{photoTimelineEntries.length === 1 ? "" : "s"}</Badge>
                </div>

                {photoComparisonEntries.length >= 2 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {checkInPhotoSlots.map((slot) => {
                      const latestPhoto = photoComparisonEntries[0].photos?.[slot];
                      const previousPhoto = photoComparisonEntries[1].photos?.[slot];

                      return (
                        <div key={`comparison-${slot}`} className="rounded-[18px] border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-950/40">
                          <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                            {slotLabel(slot)}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[photoComparisonEntries[0], photoComparisonEntries[1]].map((entry, index) => {
                              const photo = index === 0 ? latestPhoto : previousPhoto;

                              return (
                                <div key={`${entry.id}-${slot}`} className="overflow-hidden rounded-[14px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                                  {photo ? (
                                    <img src={photo} alt={`${entry.label} ${slot} comparison`} className="aspect-[3/4] w-full object-cover" />
                                  ) : (
                                    <div className="flex aspect-[3/4] items-center justify-center px-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                                      No photo
                                    </div>
                                  )}
                                  <div className="border-t border-slate-200 px-2 py-1 text-center text-[10px] font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
                                    {index === 0 ? "Latest" : "Previous"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2">
                  {photoTimelineEntries.map((entry) => {
                    const photoCount = checkInPhotoSlots.filter((slot) => Boolean(entry.photos?.[slot])).length;
                    const conditionDelta =
                      latestCheckIn && entry.id !== latestCheckIn.id
                        ? Number((latestCheckIn.condition - entry.condition).toFixed(1))
                        : 0;

                    return (
                      <div key={`timeline-${entry.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950/40">
                        <div>
                          <div className="font-semibold text-slate-950 dark:text-slate-100">{entry.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{entry.date}, {photoCount}/3 photos</div>
                        </div>
                        <Badge variant="outline">
                          {entry.id === latestCheckIn?.id ? "Latest" : `${conditionDelta >= 0 ? "+" : ""}${conditionDelta} condition`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {photoStatus ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100">
                {photoStatus}
              </div>
            ) : null}
          </div>
          ) : (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{checkInReviewSnapshot.title}</div>
              <p className="mt-1.5">{checkInReviewSnapshot.detail}</p>
              <div className="mt-3 rounded-[18px] border border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950/50">
                {latestCheckIn
                  ? `Latest stored check-in: ${latestCheckIn.label} on ${latestCheckIn.date}, condition ${latestCheckIn.condition.toFixed(1)}${latestPhotoCount > 0 ? `, ${latestPhotoCount} photo${latestPhotoCount === 1 ? "" : "s"}` : ""}.`
                  : "No check-ins are stored yet."}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {prepSignalBoardExpanded ? (
        <SectionCard
          title="Prep signal board"
          description={
            userMode === "coach"
              ? "Use one system read to see whether the week needs better signal, better support, or a real intervention."
              : "This deeper review layer is available when you need it, but it stays out of the default daily scan."
          }
          right={userMode === "athlete" ? <Button variant="outline" onClick={() => setShowPrepSignalBoard(false)}>Hide signal board</Button> : undefined}
        >
          <PrepSignalPanel snapshot={prepSignalSnapshot} onOpen={goToTab} />
        </SectionCard>
      ) : (
        <SectionCard
          title="Signal board"
          description="The deeper system read is available, but the default athlete dashboard stays focused on today's action."
          right={<Button variant="outline" onClick={() => setShowPrepSignalBoard(true)}>Show signal board</Button>}
        >
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            Current read: {prepSignalSnapshot.posture.title}. Open the board only when you need the full signal breakdown.
          </div>
        </SectionCard>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        {(userMode === "coach" || dashboardWorkflowPriorities.length > 0) ? (
        <SectionCard
          title={userMode === "coach" ? "Needs attention first" : "Next"}
          description={userMode === "coach" ? "Use this queue to work from the highest-value coaching decision down." : undefined}
          right={
            userMode === "coach" && workflowPriorities.length > 3 ? (
              <Button variant="outline" size="sm" onClick={() => setShowWorkflowDetails((value) => !value)}>
                {showWorkflowDetails ? "Show less" : `Show all ${workflowPriorities.length}`}
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {dashboardWorkflowPriorities.map((item) => {
              const styles = decisionTileTone(item.tone);

              return (
                <div key={`${item.label}-${item.title}`} className={`rounded-[22px] border p-4 ${styles.panel}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
                      {item.label}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openWorkflowPriority(item)}>
                      Open
                    </Button>
                  </div>
                  <div className="mt-3 text-base font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
        ) : null}

        <SectionCard
          title={
            selfManagedAthlete && userMode === "athlete"
              ? "Recent plan activity"
              : latestPublishedDecision
                ? (userMode === "coach" ? "Published direction" : "Current direction")
                : userMode === "coach"
                  ? "Recent plan activity"
                  : "Latest update"
          }
          description={
            userMode === "coach"
              ? "Keep the live publish package and the most recent plan moves visible without digging through tabs."
              : undefined
          }
          right={userMode === "coach" && recentPlanActivityItems.length > 0 ? (
            <Button variant="outline" onClick={() => setShowPlanActivityHistory((value) => !value)}>
              {showPlanActivityHistory ? "Hide history" : "Show history"}
            </Button>
          ) : undefined}
        >
          <div className="space-y-3">
            {latestPublishedDecision ? (
              <div className={["rounded-[24px] border p-4", surfaceToneClass("primary")].join(" ")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                      {userMode === "coach" ? "Live published package" : selfManagedAthlete ? "Current plan update" : "Published coaching update"}
                    </div>
                    <div className="mt-1.5 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {latestPublishedDecision.title}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{formatDecisionDate(latestPublishedDecision.publishedAt)}</Badge>
                    <Badge className={publishedStatusBadgeClass(latestPublishedDecision, userMode)}>
                      {latestPublishedDecision.status === "acknowledged"
                        ? "Acknowledged"
                        : userMode === "coach"
                          ? "Awaiting athlete"
                          : "Needs acknowledgement"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {latestPublishedDecision.instruction}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-white/88 px-3 py-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Next action</div>
                    <div className="mt-1.5">{latestPublishedDecision.nextAction}</div>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-white/88 px-3 py-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Signal state</div>
                    <div className="mt-1.5">
                      {latestPublishedDecision.decisionConfidenceScore} / 100 confidence, {latestPublishedDecision.checkInTitle.toLowerCase()}.
                    </div>
                  </div>
                </div>
                {publishedPlanDiffs.length > 0 ? (
                  <div className="mt-3 rounded-[20px] border border-slate-200 bg-white/82 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                        What changed
                      </div>
                      <Badge variant="outline">
                        {latestPublishedDecision.status === "acknowledged" ? "Receipt saved" : "Review before acknowledging"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {publishedPlanDiffs.slice(0, 4).map((item) => {
                        const styles = decisionTileTone(item.tone);

                        return (
                          <div key={item.id} className={`rounded-[16px] border px-3 py-3 ${styles.panel}`}>
                            <Badge className={styles.badge}>{item.label}</Badge>
                            <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {latestPublishedDecision.summaryLines.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {latestPublishedDecision.summaryLines.slice(0, 3).map((line, index) => (
                      <div key={`${line}-${index}`} className="rounded-[18px] border border-slate-200 bg-white/88 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : null}
                {userMode === "athlete" && !selfManagedAthlete && latestPublishedDecision.status !== "acknowledged" ? (
                  <div className="mt-4">
                    <Button onClick={acknowledgeLatestCoachDecision}>Acknowledge direction</Button>
                  </div>
                ) : null}
                {userMode === "coach" && latestPublishedDecision.acknowledgedAt ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Athlete acknowledged on {formatDecisionDate(latestPublishedDecision.acknowledgedAt)}.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className={["rounded-[24px] border p-4", surfaceToneClass("primary")].join(" ")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                      {userMode === "coach" ? "Last athlete-facing update" : selfManagedAthlete ? "Latest plan update" : "Latest coach update"}
                    </div>
                    <div className="mt-1.5 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {latestCoachUpdate.title}
                    </div>
                  </div>
                  <Badge variant="outline">{latestCoachUpdate.date}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {latestCoachUpdate.detail}
                </p>
                {latestCoachUpdate.impact ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {latestCoachUpdate.impact}
                  </p>
                ) : null}
              </div>
            )}

            {showCoachCommunication ? (
              <div className="rounded-[22px] border border-slate-200 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                      Coach thread
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {visibleCoachThreadMessages[0]?.body ?? "No notes yet"}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {unreadCoachThreadMessages.length > 0 ? `${unreadCoachThreadMessages.length} unread` : `${visibleCoachThreadMessages.length} recent`}
                  </Badge>
                </div>

                {visibleCoachThreadMessages.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {visibleCoachThreadMessages.map((message) => (
                      <div key={message.id} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                        <span className="font-semibold text-slate-950 dark:text-slate-100">
                          {message.author === "coach" ? "Coach" : "Athlete"}:
                        </span>{" "}
                        {message.body}
                        {message.author === "athlete" && !message.readAt ? (
                          <Badge className="ml-2 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                            Unread
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {userMode === "coach" && unreadCoachThreadMessages.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => markCoachThreadMessagesRead(unreadCoachThreadMessages.map((message) => message.id))}
                  >
                    Mark thread reviewed
                  </Button>
                ) : null}

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <textarea
                    value={threadDraft}
                    onChange={(event) => setThreadDraft(event.target.value)}
                    rows={2}
                    placeholder={userMode === "coach" ? "Send a short athlete note" : "Send a note to coach"}
                    className="min-h-[72px] rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
                  />
                  <Button
                    className="self-end"
                    onClick={() => {
                      sendCoachThreadMessage(userMode === "coach" ? "coach" : "athlete", threadDraft);
                      setThreadDraft("");
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-slate-200 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                  Local plan notes
                </div>
                <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  Recent changes stay here for your own review.
                </div>
                <div className="mt-3 space-y-2">
                  {recentPlanActivityItems.slice(0, 3).length > 0 ? (
                    recentPlanActivityItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                        <span className="font-semibold text-slate-950 dark:text-slate-100">{item.title}:</span>{" "}
                        {item.detail}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                      Plan edits and daily closeouts will appear here once you make them.
                    </div>
                  )}
                </div>
              </div>
            )}

            {userMode === "coach" && recentPlanActivityItems.length > 0 ? (
              showPlanActivityHistory ? (
                recentPlanActivityItems.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {item.title}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.date}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.detail}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                  {recentPlanActivityItems.length} older plan update{recentPlanActivityItems.length === 1 ? "" : "s"} hidden. Show history only when the coach needs the trail.
                </div>
              )
            ) : null}
          </div>
        </SectionCard>
      </div>

      {!showPrepRoadmap ? (
        <SectionCard
          title="Prep roadmap"
          description="Compact target path. Detailed phase logic stays tucked away until needed."
          right={(
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selfManagedAthlete && prepNeedsAdjustment ? (
                <Button onClick={applyAdaptiveWeekPlan}>Sync current week</Button>
              ) : null}
              <Button variant="outline" onClick={() => setShowPrepRoadmap(true)}>Show roadmap</Button>
            </div>
          )}
        >
          <div className={prepNeedsAdjustment ? "rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100" : "rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"}>
            <div className="font-semibold">
              {activeTargetMismatch ? "Sync target" : prepNeedsAdjustment ? currentPrepMacroWeek?.adjustmentLabel : "Current model"}: {contestPrepModel.headline}
            </div>
            {currentPrepMacroWeek ? (
              <div className="mt-1">
                {activeTargetMismatch
                  ? `Active target is ${todayFuelSummary.calorieTarget} kcal. Sync to ${currentPrepMacroWeek.calories} kcal, ${currentPrepMacroWeek.protein}P / ${currentPrepMacroWeek.carbs}C / ${currentPrepMacroWeek.fats}F.`
                  : `This week: ${currentPrepMacroWeek.calories} kcal, ${currentPrepMacroWeek.protein}P / ${currentPrepMacroWeek.carbs}C / ${currentPrepMacroWeek.fats}F, ${currentPrepMacroWeek.steps.toLocaleString()} steps.`}
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : (
      <SectionCard
        title="Prep roadmap"
        description="Simple path: buffered target weight, real deficit, weekly output, then review."
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdvancedPrepTargets((value) => !value)}>
              {showAdvancedPrepTargets ? "Hide advanced" : "Show advanced"}
            </Button>
            {userMode === "athlete" ? (
              <Button variant="outline" onClick={() => setShowPrepRoadmap(false)}>Hide roadmap</Button>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200/85 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/86">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Automatic contest-prep model</div>
                <div className="mt-2 text-xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">{contestPrepModel.headline}</div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{contestPrepModel.detail}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px] xl:grid-cols-4">
                <div className="rounded-[18px] border border-slate-200 bg-white/88 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Loss pace</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{contestPrepModel.weeklyLossTargetPct.toFixed(2)}% / wk</div>
                </div>
                <div className={prepNeedsAdjustment ? "rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-950/25" : "rounded-[18px] border border-slate-200 bg-white/88 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]"}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">This week</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{currentPrepMacroWeek?.calories ?? 0} kcal</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {currentPrepMacroWeek ? `${currentPrepMacroWeek.carbs}g carbs, ${currentPrepMacroWeek.steps.toLocaleString()} steps` : "No target"}
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/88 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Planning target</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{contestPrepModel.planningTargetWeightLb.toFixed(1)} lb</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {contestPrepModel.goalOvershootBufferLb.toFixed(1)} lb under stated target
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/88 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Tracking reserve</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{contestPrepModel.calorieErrorBufferPct}%</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {contestPrepModel.plannedDeficitCalories} kcal planned deficit
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            {contestPrepModel.phases.map((phase) => (
              <div key={phase.id} className={`rounded-[22px] border p-4 ${prepPhaseToneClass(phase.tone)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{phase.label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{phase.window}</div>
                  </div>
                  <Badge variant="outline">{phase.cardioMinutes} min</Badge>
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{phase.focus}</div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span>Calories</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{phase.calories}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Carbs</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{phase.carbs} g</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Steps</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{phase.steps.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAdvancedPrepTargets ? (
            <div className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    Week-by-week targets
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Targets already include a {macroProgressionWeeks[0]?.intakeBufferPct ?? contestPrepModel.calorieErrorBufferPct}% tracking-error reserve before any pace adjustment.
                  </div>
                </div>
                {selfManagedAthlete ? (
                  <Button size="sm" onClick={applyAdaptiveWeekPlan}>
                    {activeTargetMismatch ? "Sync target" : "Apply current week"}
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[760px] divide-y divide-slate-200 rounded-[18px] border border-slate-200 bg-slate-50/80 dark:divide-white/10 dark:border-white/10 dark:bg-slate-950/45">
                  <div className="grid grid-cols-[0.75fr_0.9fr_1.15fr_1fr_1.35fr] gap-3 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    <div>Week</div>
                    <div>Calories</div>
                    <div>Protein / Carbs / Fat</div>
                    <div>Output</div>
                    <div>Adjustment</div>
                  </div>
                  {macroProgressionWeeks.map((week) => (
                    <div
                      key={week.id}
                      className="grid grid-cols-[0.75fr_0.9fr_1.15fr_1fr_1.35fr] gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <div className="font-semibold text-slate-950 dark:text-slate-100">{week.label}</div>
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-100">{week.calories}</div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatSignedMove(week.deltaCalories, "kcal")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-100">
                          {week.protein}g / {week.carbs}g / {week.fats}g
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatSignedMove(week.deltaCarbs, "g carbs")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-100">
                          {week.steps.toLocaleString()} steps
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {week.cardioMinutes} min cardio
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950 dark:text-slate-100">{week.adjustmentLabel}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {week.adjustmentDetail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-3">
            {contestPrepModel.guardrails.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-[22px] border border-slate-200 bg-white/88 px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Guardrail {index + 1}</div>
                <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
      )}
    </div>
  );
}
