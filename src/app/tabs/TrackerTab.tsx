import React from "react";
import { ArrowRight, CheckCircle2, Dumbbell, Footprints, NotebookPen, Pause, Play, Scale, TimerReset, Trash2, TrendingUp, Utensils } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { clamp, inputClass } from "../constants";
import { conditioningModalityLibrary } from "../performance_libraries";
import type {
  TrackerDay,
  TrackerLift,
  TrackerTask,
  WearableRecoverySnapshot,
  WeeklySnapshot,
  WorkoutDay,
} from "../types";
import {
  AdvancedEditorCard,
  AnalyticsStat,
  EmptyStatePanel,
  SectionCard,
  WorkspaceSummaryRail,
} from "../workspace_ui";
import {
  BulletChart,
  DonutChart,
  GaugeChart,
  StatusLineChart,
} from "../visual_storytelling";

type UserMode = "athlete" | "coach";

type SummaryItem = {
  label: string;
  title: string;
  detail: string;
};

type ChecklistItem = {
  label: string;
  detail: string;
};

type TrackerPrimaryAction = {
  title: string;
  body: string;
  cta: string;
  tab: string;
};

type TrackerWeeklyReview = {
  averageCompletion: number;
  completedDays: number;
  loggedDays: number;
};

type TrackerSurfaceTab = "dashboard" | "session" | "log" | "insights" | "week";
type MobileCaptureMode = "basics" | "food" | "lift" | "check";
type TrackerSurfaceIntent = {
  surface: TrackerSurfaceTab;
  nonce: number;
};

type ExerciseHistoryEntry = {
  id: string;
  date: string;
  title: string;
  topLoad: number | null;
  loggedSets: number;
  summary: string;
};

type UpdateTrackerDay = <K extends keyof TrackerDay>(
  dayId: string,
  key: K,
  value: TrackerDay[K]
) => void;

type TrackerTabProps = {
  userMode: UserMode;
  selfManagedAthlete: boolean;
  canEditPlan: boolean;
  trackerFocusCards: SummaryItem[];
  trackerPrimaryAction: TrackerPrimaryAction;
  athleteOffTrackFlags: string[];
  goToTab: (tab: string) => void;
  openNutritionSurface: (surface: "log" | "add" | "insights", entryMode?: "search" | "scan" | "custom") => void;
  addCheckIn: () => void;
  selectedTrackerDay: TrackerDay | null;
  selectedTrackerDayId: string;
  setSelectedTrackerDayId: (value: string) => void;
  trackerDays: TrackerDay[];
  trackerTemplateDayId: string;
  setTrackerTemplateDayId: (value: string) => void;
  trackerMonthLabel: string;
  setTrackerMonthLabel: (value: string) => void;
  workoutSplit: WorkoutDay[];
  selectedTrackerCompletedLifts: number;
  selectedTrackerCompletionPct: number;
  selectedTrackerExecutionScore: number;
  selectedTrackerMissedLifts: number;
  selectedTrackerStepScore: number;
  recoveryScore: number;
  sleepHours: number;
  trackerAthleteChecklist: ChecklistItem[];
  trackerCoachReviewCards: ChecklistItem[];
  trackerMissingFields: readonly string[];
  metricsTone: (value: number) => string;
  totalPlannedSets: number;
  addTrackerLift: (dayId: string) => void;
  pushTemplateToTracker: (trackerDayId: string) => void;
  updateTrackerDay: UpdateTrackerDay;
  showAdvancedTracker: boolean;
  toggleAdvancedTracker: () => void;
  athleteNextOpenLift: TrackerLift | null;
  athleteCompletionProgress: number;
  trackerDayCompletionMap: Record<string, number>;
  liveBodyWeight: number;
  expandedAthleteLifts: Record<string, boolean>;
  toggleAthleteLiftExpanded: (liftId: string) => void;
  updateTrackerLift: (dayId: string, liftId: string, updates: Partial<TrackerLift>) => void;
  trackerTasks: TrackerTask[];
  addTrackerTask: () => void;
  updateTrackerTask: (taskId: string, updates: Partial<TrackerTask>) => void;
  removeTrackerTask: (taskId: string) => void;
  trackerWeeklyReview: TrackerWeeklyReview;
  weeklySnapshots: WeeklySnapshot[];
  selectedCalendarDate: string;
  setSelectedCalendarDate: (value: string) => void;
  trackerSurfaceIntent?: TrackerSurfaceIntent;
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
  targetSteps: number;
  wearableSnapshots: WearableRecoverySnapshot[];
  syncWearableSnapshot: (snapshot: Omit<WearableRecoverySnapshot, "id">) => void;
  closeTrackerDay: (dayId: string, note: string) => void;
};

const splitRows = (value: string | undefined, count: number) => {
  const rows = (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter((item, index, all) => item.length > 0 || index < all.length);

  return Array.from({ length: count }, (_, index) => rows[index] ?? "");
};

const joinRows = (rows: string[]) => rows.map((row) => row.trim()).join("|");
const normalizeLiftName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const formatTimerSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};
const resizeRows = (rows: string[], count: number, fallback = "") =>
  Array.from({ length: count }, (_, index) => rows[index] ?? fallback);
const countFilledRows = (value: string | undefined) =>
  (value ?? "")
    .split("|")
    .map((row) => row.trim())
    .filter(Boolean).length;
const parseLiftNumber = (value?: string) => {
  const match = (value ?? "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};
const parseRepTarget = (value?: string) => {
  const matches = (value ?? "").match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const parsed = Number(matches[matches.length - 1]);
  return Number.isFinite(parsed) ? parsed : null;
};
const formatTrainingNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
const getLoadIncrease = (load: number) => {
  if (load >= 225) return 10;
  if (load >= 50) return 5;
  return 2.5;
};
const getSuggestedLoad = (previousWeight?: string) => {
  const previousLoad = parseLiftNumber(previousWeight);
  if (previousLoad === null) return "";
  return formatTrainingNumber(previousLoad + getLoadIncrease(previousLoad));
};
const getLiftSetRows = (lift: TrackerLift) => ({
  reps: splitRows(lift.actualReps, lift.plannedSets),
  weights: splitRows(lift.weight, lift.plannedSets),
  rpes: splitRows(lift.rpe, lift.plannedSets),
});
const resolvePreviousSetValues = (previous: TrackerLift | undefined, index: number) => {
  if (!previous) return { reps: "", weight: "", rpe: "" };
  const previousIndex = Math.min(index, Math.max(previous.plannedSets - 1, 0));
  const previousRows = getLiftSetRows(previous);

  return {
    reps: previousRows.reps[previousIndex] || previous.plannedReps || "",
    weight: previousRows.weights[previousIndex] || "",
    rpe: previousRows.rpes[previousIndex] || "",
  };
};
const resolveSetIncreaseCue = (lift: TrackerLift, previous: TrackerLift | undefined, index: number) => {
  const previousValues = resolvePreviousSetValues(previous, index);
  const suggestedWeight = getSuggestedLoad(previousValues.weight);
  const previousReps = parseLiftNumber(previousValues.reps);
  const targetReps = parseRepTarget(lift.plannedReps);
  const readyToAddLoad =
    suggestedWeight.length > 0 &&
    previousReps !== null &&
    targetReps !== null &&
    previousReps >= targetReps;

  return {
    ...previousValues,
    suggestedWeight,
    readyToAddLoad,
  };
};
const getNextOpenSetIndex = (lift: TrackerLift) => {
  const repsRows = splitRows(lift.actualReps, lift.plannedSets);
  const openIndex = repsRows.findIndex((row) => !row.trim());
  return openIndex >= 0 ? openIndex : Math.max(0, lift.plannedSets - 1);
};
const getLastLoggedSetIndex = (lift: TrackerLift) => {
  const repsRows = splitRows(lift.actualReps, lift.plannedSets);
  const weightRows = splitRows(lift.weight, lift.plannedSets);
  const rpeRows = splitRows(lift.rpe, lift.plannedSets);

  for (let index = lift.plannedSets - 1; index >= 0; index -= 1) {
    if (repsRows[index]?.trim() || weightRows[index]?.trim() || rpeRows[index]?.trim()) {
      return index;
    }
  }

  return -1;
};
const formatSetSummary = (lift: TrackerLift, index: number) => {
  const reps = splitRows(lift.actualReps, lift.plannedSets)[index] ?? "";
  const weight = splitRows(lift.weight, lift.plannedSets)[index] ?? "";
  const rpe = splitRows(lift.rpe, lift.plannedSets)[index] ?? "";

  if (weight && reps) return `${weight}x${reps}`;
  if (reps) return `${reps} reps`;
  if (weight) return `${weight} lb`;
  if (rpe) return `RPE ${rpe}`;
  return "Open";
};
const summarizeLiftProgression = (lift: TrackerLift, previous?: TrackerLift) => {
  const currentWeights = splitRows(lift.weight, lift.plannedSets)
    .map(parseLiftNumber)
    .filter((value): value is number => value !== null);
  const previousWeights = previous
    ? splitRows(previous.weight, previous.plannedSets)
        .map(parseLiftNumber)
        .filter((value): value is number => value !== null)
    : [];

  if (currentWeights.length > 0 && previousWeights.length > 0) {
    const currentTop = Math.max(...currentWeights);
    const previousTop = Math.max(...previousWeights);
    const difference = Number((currentTop - previousTop).toFixed(1));

    if (difference > 0) return `Top load +${difference} lb`;
    if (difference < 0) return `Top load ${difference} lb`;
    return "Top load matched";
  }

  if (previousWeights.length > 0) return `Last top ${Math.max(...previousWeights)} lb`;
  if (countFilledRows(lift.actualReps) > 0) return `${countFilledRows(lift.actualReps)} set${countFilledRows(lift.actualReps) === 1 ? "" : "s"} logged`;
  return "No history yet";
};
const getLiftTopLoad = (lift: TrackerLift) => {
  const loads = splitRows(lift.weight, lift.plannedSets)
    .map(parseLiftNumber)
    .filter((value): value is number => value !== null);

  return loads.length > 0 ? Math.max(...loads) : null;
};
const hasUsefulLiftLog = (lift: TrackerLift) =>
  lift.completed ||
  countFilledRows(lift.actualReps) > 0 ||
  countFilledRows(lift.weight) > 0 ||
  countFilledRows(lift.rpe) > 0;
const summarizeLiftPerformance = (lift: TrackerLift) => {
  const loggedSets = Number(lift.actualSets) || countFilledRows(lift.actualReps);
  const weightRows = splitRows(lift.weight, lift.plannedSets).filter(Boolean);
  const rpeRows = splitRows(lift.rpe, lift.plannedSets).filter(Boolean);
  const weightSummary =
    weightRows.length > 0
      ? weightRows.length === 1
        ? `${weightRows[0]} lb`
        : `${weightRows[0]}-${weightRows[weightRows.length - 1]} lb`
      : "weight open";
  const rpeSummary =
    rpeRows.length > 0 ? `RPE ${rpeRows[rpeRows.length - 1]}` : `RIR ${lift.rir}`;

  return `${loggedSets || lift.plannedSets} sets, ${weightSummary}, ${rpeSummary}`;
};

export default function TrackerTab(props: TrackerTabProps) {
  const {
    userMode,
    selfManagedAthlete,
    canEditPlan,
    trackerFocusCards,
    trackerPrimaryAction,
    athleteOffTrackFlags,
    goToTab,
    openNutritionSurface,
    addCheckIn,
    selectedTrackerDay,
    selectedTrackerDayId,
    setSelectedTrackerDayId,
    trackerDays,
    trackerTemplateDayId,
    setTrackerTemplateDayId,
    trackerMonthLabel,
    setTrackerMonthLabel,
    workoutSplit,
    selectedTrackerCompletedLifts,
    selectedTrackerCompletionPct,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    selectedTrackerStepScore,
    recoveryScore,
    sleepHours,
    trackerAthleteChecklist,
    trackerCoachReviewCards,
    trackerMissingFields,
    metricsTone,
    totalPlannedSets,
    addTrackerLift,
    pushTemplateToTracker,
    updateTrackerDay,
    showAdvancedTracker,
    toggleAdvancedTracker,
    athleteNextOpenLift,
    athleteCompletionProgress,
    trackerDayCompletionMap,
    liveBodyWeight,
    expandedAthleteLifts,
    toggleAthleteLiftExpanded,
    updateTrackerLift,
    trackerTasks,
    addTrackerTask,
    updateTrackerTask,
    removeTrackerTask,
    trackerWeeklyReview,
    weeklySnapshots,
    selectedCalendarDate,
    setSelectedCalendarDate,
    trackerSurfaceIntent,
    todayFuelSummary,
    targetSteps,
    wearableSnapshots,
    syncWearableSnapshot,
    closeTrackerDay,
  } = props;

  const isCoachView = userMode === "coach";
  const [trackerSurfaceTab, setTrackerSurfaceTab] = React.useState<TrackerSurfaceTab>(
    userMode === "coach" ? "dashboard" : "log"
  );
  const [pendingTaskDeleteId, setPendingTaskDeleteId] = React.useState<string | null>(null);
  const [wearableDraft, setWearableDraft] = React.useState({
    source: "Manual" as WearableRecoverySnapshot["source"],
    steps: "",
    sleepHours: "",
    sleepScore: "",
    restingHeartRate: "",
    hrvMs: "",
    bodyBattery: "",
    note: "",
  });
  const [closeoutNote, setCloseoutNote] = React.useState("");
  const [quickEntryMessage, setQuickEntryMessage] = React.useState("");
  const [mobileCaptureMode, setMobileCaptureMode] = React.useState<MobileCaptureMode>("basics");
  const [activeTrainingLiftId, setActiveTrainingLiftId] = React.useState<string | null>(null);
  const [activeTrainingSetIndex, setActiveTrainingSetIndex] = React.useState(0);
  const [restTimer, setRestTimer] = React.useState({
    liftName: "",
    secondsLeft: 0,
    totalSeconds: 90,
    running: false,
  });
  const requestRemoveTrackerTask = (taskId: string) => {
    if (pendingTaskDeleteId !== taskId) {
      setPendingTaskDeleteId(taskId);
      return;
    }

    removeTrackerTask(taskId);
    setPendingTaskDeleteId(null);
  };
  const openTrackerTasks = trackerTasks.filter((task) => !task.done);
  const orderedTrackerDays = [...trackerDays].sort((a, b) => a.date.localeCompare(b.date));
  const liveBodyWeightLabel = Number.isFinite(liveBodyWeight) ? liveBodyWeight.toFixed(1) : "";
  const latestWeeklySnapshot = weeklySnapshots[weeklySnapshots.length - 1] ?? null;
  const latestWearableSnapshot = selectedTrackerDay
    ? wearableSnapshots.find((snapshot) => snapshot.date === selectedTrackerDay.date) ?? null
    : null;
  const weekCompletionAverage =
    orderedTrackerDays.length > 0
      ? Math.round(
          orderedTrackerDays.reduce((sum, day) => sum + Number(day.completion ?? 0), 0) /
            orderedTrackerDays.length
        )
      : 0;
  const weekOpenLiftCount = orderedTrackerDays.reduce(
    (sum, day) => sum + day.lifts.filter((lift) => !lift.completed).length,
    0
  );
  const nextOpenDay = orderedTrackerDays.find((day) => day.lifts.some((lift) => !lift.completed)) ?? null;
  const openLiftCount = selectedTrackerDay
    ? Math.max(selectedTrackerDay.lifts.length - selectedTrackerCompletedLifts, 0)
    : 0;
  const previousLiftPerformance = React.useMemo(() => {
    const history = new Map<string, { day: TrackerDay; lift: TrackerLift }>();
    if (!selectedTrackerDay) return history;

    [...trackerDays]
      .filter((day) => day.date < selectedTrackerDay.date)
      .sort((left, right) => right.date.localeCompare(left.date))
      .forEach((day) => {
        day.lifts.forEach((lift) => {
          const key = normalizeLiftName(lift.name);
          const hasUsefulLog = hasUsefulLiftLog(lift);

          if (!key || history.has(key) || !hasUsefulLog) return;
          history.set(key, { day, lift });
        });
      });

    return history;
  }, [selectedTrackerDay, trackerDays]);
  const exerciseHistoryByName = React.useMemo(() => {
    const history = new Map<string, ExerciseHistoryEntry[]>();

    [...trackerDays]
      .sort((left, right) => right.date.localeCompare(left.date))
      .forEach((day) => {
        day.lifts.forEach((lift) => {
          const key = normalizeLiftName(lift.name);
          if (!key || !hasUsefulLiftLog(lift)) return;

          const entry: ExerciseHistoryEntry = {
            id: `${day.id}:${lift.id}`,
            date: day.date,
            title: day.title,
            topLoad: getLiftTopLoad(lift),
            loggedSets: Number(lift.actualSets) || countFilledRows(lift.actualReps),
            summary: summarizeLiftPerformance(lift),
          };

          history.set(key, [...(history.get(key) ?? []), entry]);
        });
      });

    return history;
  }, [trackerDays]);
  const closeoutStatus = selectedTrackerDay?.closeoutStatus ?? null;
  const closeoutSavedLabel = selectedTrackerDay?.closedAt
    ? new Date(selectedTrackerDay.closedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  const closeoutLoggedSteps = Number(selectedTrackerDay?.steps || 0);
  const closeoutStepsRemaining = Math.max(0, targetSteps - closeoutLoggedSteps);
  const closeoutProteinRemaining = Math.max(
    0,
    todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed
  );
  const foodCloseoutNeeds = [
    todayFuelSummary.foodEntriesLogged === 0 ? "Log food" : "",
    todayFuelSummary.foodEntriesLogged > 0 && todayFuelSummary.calorieRemaining > 250
      ? `${todayFuelSummary.calorieRemaining} kcal still open`
      : "",
    closeoutProteinRemaining > 25 ? `${closeoutProteinRemaining}g protein still open` : "",
  ].filter(Boolean);
  const closeoutNeeds = [
    ...trackerMissingFields.map((field) => `Log ${field}`),
    ...(!trackerMissingFields.includes("steps") && closeoutLoggedSteps > 0 && closeoutStepsRemaining > 0
      ? [`${closeoutStepsRemaining.toLocaleString()} steps remain`]
      : []),
    ...foodCloseoutNeeds,
    ...(openLiftCount > 0 ? [`Review ${openLiftCount} open lift${openLiftCount === 1 ? "" : "s"}`] : []),
    ...(openTrackerTasks.length > 0 ? [`Close ${openTrackerTasks.length} task${openTrackerTasks.length === 1 ? "" : "s"}`] : []),
  ].slice(0, 4);
  const closeoutCompletionRows = [
    {
      label: "Food signal",
      done: foodCloseoutNeeds.length === 0,
      detail:
        foodCloseoutNeeds.length === 0
          ? `${todayFuelSummary.foodEntriesLogged} foods logged and protein is within review range.`
          : foodCloseoutNeeds[0],
    },
    {
      label: "Training",
      done: openLiftCount === 0,
      detail:
        openLiftCount === 0
          ? `${selectedTrackerCompletedLifts}/${selectedTrackerDay?.lifts.length ?? 0} lifts complete.`
          : `${openLiftCount} lift${openLiftCount === 1 ? "" : "s"} still open.`,
    },
    {
      label: "Basics",
      done: trackerMissingFields.length === 0 && closeoutStepsRemaining === 0,
      detail:
        trackerMissingFields.length > 0
          ? `Missing ${trackerMissingFields.join(", ")}.`
          : closeoutStepsRemaining > 0
            ? `${closeoutStepsRemaining.toLocaleString()} steps remain.`
            : `Steps, energy, and bodyweight are logged.`,
    },
    {
      label: "Support",
      done: openTrackerTasks.length === 0,
      detail:
        openTrackerTasks.length === 0
          ? "No open support tasks."
          : `${openTrackerTasks.length} task${openTrackerTasks.length === 1 ? "" : "s"} still open.`,
    },
  ];
  const closeoutDoneForToday = closeoutStatus === "closed";
  const closeoutSavedWithReview = closeoutStatus === "needs-review";
  const closeoutHeroTitle = closeoutDoneForToday
    ? "Done for today"
    : closeoutSavedWithReview
      ? "Saved with review flags"
      : closeoutNeeds.length === 0
        ? "Ready to finish"
        : "Finish the blockers first";
  const closeoutHeroDetail = closeoutDoneForToday
    ? `${selectedTrackerDay?.title ?? "Today"} was closed at ${closeoutSavedLabel}.`
    : closeoutSavedWithReview
      ? "The closeout is saved, but the review list stays visible so nothing gets buried."
      : closeoutNeeds.length === 0
        ? "Food, training, basics, and support are clean enough to close."
        : "Closeout can still be saved, but it will be marked for review.";
  const closeoutVisibilityRows = [
    {
      label: "Saved record",
      value: closeoutStatus ? `Saved ${closeoutSavedLabel}` : "Created when finished",
    },
    {
      label: userMode === "coach" ? "Client visibility" : "Coach visibility",
      value: selfManagedAthlete
        ? "Saved for your review"
        : closeoutStatus
          ? "Visible with today's note"
          : "Visible after finish",
    },
    {
      label: "History",
      value: closeoutStatus ? "Change log updated" : "Adds a timestamped log",
    },
  ];
  const stepPresetOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          [targetSteps, 8000, 10000, 12000].filter((value) => Number.isFinite(value) && value > 0)
        )
      ).slice(0, 4),
    [targetSteps]
  );
  const macroChartSegments = [
    { label: "Protein", value: todayFuelSummary.proteinConsumed, color: "#10b981" },
    { label: "Carbs", value: todayFuelSummary.carbsConsumed, color: "#0ea5e9" },
    { label: "Fat", value: todayFuelSummary.fatsConsumed, color: "#f59e0b" },
  ];
  const trackerStepsLogged = Number(selectedTrackerDay?.steps || 0);
  const trackerReadinessScore = Math.round(
    clamp(
      selectedTrackerCompletionPct * 0.45 +
        Math.min(100, (trackerStepsLogged / Math.max(targetSteps, 1)) * 100) * 0.25 +
        recoveryScore * 10 * 0.2 +
        Math.min(100, (todayFuelSummary.caloriesConsumed / Math.max(todayFuelSummary.calorieTarget, 1)) * 100) * 0.1,
      0,
      100
    )
  );
  const weekCompletionLine = orderedTrackerDays.map((day) => Number(day.completion ?? 0));
  const getAttentionTarget = (flag: string) => {
    if (/digestion|food|meal/i.test(flag)) return "nutrition";
    if (/conditioning|cardio|posing|output/i.test(flag)) return "tracker";
    return "tracker";
  };

  React.useEffect(() => {
    if (!trackerSurfaceIntent || trackerSurfaceIntent.nonce === 0) return;
    setTrackerSurfaceTab(trackerSurfaceIntent.surface);
  }, [trackerSurfaceIntent]);

  React.useEffect(() => {
    if (!restTimer.running) return undefined;

    const intervalId = window.setInterval(() => {
      setRestTimer((current) => {
        if (!current.running) return current;
        if (current.secondsLeft <= 1) {
          return { ...current, secondsLeft: 0, running: false };
        }
        return { ...current, secondsLeft: current.secondsLeft - 1 };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [restTimer.running]);

  React.useEffect(() => {
    if (restTimer.liftName && !restTimer.running && restTimer.secondsLeft === 0) {
      setQuickEntryMessage(`Rest complete for ${restTimer.liftName}. Start the next set.`);
    }
  }, [restTimer.liftName, restTimer.running, restTimer.secondsLeft]);

  React.useEffect(() => {
    setQuickEntryMessage("");
    setActiveTrainingLiftId(null);
    setActiveTrainingSetIndex(0);
  }, [selectedTrackerDayId]);

  const openDayLog = (day: TrackerDay) => {
    setSelectedCalendarDate(day.date);
    setSelectedTrackerDayId(day.id);
    setTrackerSurfaceTab("log");
  };

  const startRestTimer = (liftName: string, seconds = 90, message?: string) => {
    setRestTimer({
      liftName,
      secondsLeft: seconds,
      totalSeconds: seconds,
      running: true,
    });
    setQuickEntryMessage(message ?? `${formatTimerSeconds(seconds)} rest started for ${liftName}.`);
  };

  const toggleRestTimer = () => {
    setRestTimer((current) => {
      if (!current.liftName || current.secondsLeft <= 0) return current;
      return { ...current, running: !current.running };
    });
  };

  const resetRestTimer = () => {
    setRestTimer({
      liftName: "",
      secondsLeft: 0,
      totalSeconds: 90,
      running: false,
    });
  };

  const updateLiftSetField = (
    lift: TrackerLift,
    key: "actualReps" | "weight" | "rpe",
    index: number,
    value: string
  ) => {
    if (!selectedTrackerDay) return;
    const rows = splitRows(lift[key], lift.plannedSets);
    rows[index] = value;
    const repsRows = key === "actualReps" ? rows : splitRows(lift.actualReps, lift.plannedSets);
    const filledSetCount = repsRows.filter((row) => row.trim().length > 0).length;

    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      [key]: joinRows(rows),
      actualSets: filledSetCount > 0 ? `${filledSetCount}` : "",
    });
  };

  const updateLiftSetValues = (
    lift: TrackerLift,
    index: number,
    values: Partial<Record<"reps" | "weight" | "rpe", string>>,
    completeWhenFilled = false
  ) => {
    if (!selectedTrackerDay) return 0;

    const rows = getLiftSetRows(lift);
    if (values.reps !== undefined) rows.reps[index] = values.reps;
    if (values.weight !== undefined) rows.weights[index] = values.weight;
    if (values.rpe !== undefined) rows.rpes[index] = values.rpe;

    const filledSetCount = rows.reps.filter((row) => row.trim().length > 0).length;
    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualReps: joinRows(rows.reps),
      weight: joinRows(rows.weights),
      rpe: joinRows(rows.rpes),
      actualSets: filledSetCount > 0 ? `${filledSetCount}` : "",
      completed: completeWhenFilled ? filledSetCount >= lift.plannedSets : lift.completed,
    });

    return filledSetCount;
  };

  const fillLiftSetFromSource = (lift: TrackerLift, index: number, source: "target" | "previous") => {
    if (!selectedTrackerDay) return;

    const repsRows = splitRows(lift.actualReps, lift.plannedSets);
    const weightRows = splitRows(lift.weight, lift.plannedSets);
    const rpeRows = splitRows(lift.rpe, lift.plannedSets);

    if (source === "previous" && index > 0) {
      repsRows[index] = repsRows[index - 1] || lift.plannedReps;
      weightRows[index] = weightRows[index - 1] || weightRows[index];
      rpeRows[index] = rpeRows[index - 1] || rpeRows[index];
    } else {
      repsRows[index] = lift.plannedReps;
    }

    const filledSetCount = repsRows.filter((row) => row.trim().length > 0).length;
    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualReps: joinRows(repsRows),
      weight: joinRows(weightRows),
      rpe: joinRows(rpeRows),
      actualSets: filledSetCount > 0 ? `${filledSetCount}` : "",
      completed: filledSetCount >= lift.plannedSets,
    });
    setQuickEntryMessage(
      source === "previous" && index > 0
        ? `${lift.name} set ${index + 1} copied from set ${index}.`
        : `${lift.name} set ${index + 1} filled from target reps.`
    );
  };

  const logNextLiftSet = (lift: TrackerLift, source: "target" | "last" | "history" = "target", startRest = false) => {
    if (!selectedTrackerDay) return;

    const repsRows = splitRows(lift.actualReps, lift.plannedSets);
    const weightRows = splitRows(lift.weight, lift.plannedSets);
    const rpeRows = splitRows(lift.rpe, lift.plannedSets);
    const nextSetIndex = getNextOpenSetIndex(lift);
    const lastSetIndex = getLastLoggedSetIndex(lift);
    const previous = previousLiftPerformance.get(normalizeLiftName(lift.name))?.lift ?? null;

    if (source === "last" && lastSetIndex >= 0) {
      repsRows[nextSetIndex] = repsRows[lastSetIndex] || lift.plannedReps;
      weightRows[nextSetIndex] = weightRows[lastSetIndex] || weightRows[nextSetIndex] || "";
      rpeRows[nextSetIndex] = rpeRows[lastSetIndex] || rpeRows[nextSetIndex] || "";
    } else if (source === "history" && previous) {
      const previousSetIndex = Math.min(nextSetIndex, Math.max(previous.plannedSets - 1, 0));
      const previousReps = splitRows(previous.actualReps, previous.plannedSets);
      const previousWeights = splitRows(previous.weight, previous.plannedSets);
      const previousRpes = splitRows(previous.rpe, previous.plannedSets);

      repsRows[nextSetIndex] = previousReps[previousSetIndex] || previous.plannedReps || lift.plannedReps;
      weightRows[nextSetIndex] = previousWeights[previousSetIndex] || weightRows[nextSetIndex] || "";
      rpeRows[nextSetIndex] = previousRpes[previousSetIndex] || rpeRows[nextSetIndex] || "";
    } else {
      repsRows[nextSetIndex] = repsRows[nextSetIndex] || lift.plannedReps;
    }

    const filledSetCount = repsRows.filter((row) => row.trim().length > 0).length;
    const completed = filledSetCount >= lift.plannedSets;
    const actionLabel =
      source === "last" && lastSetIndex >= 0
        ? "copied from the last logged set"
        : source === "history" && previous
          ? "loaded from history"
          : "logged at target";

    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualReps: joinRows(repsRows),
      weight: joinRows(weightRows),
      rpe: joinRows(rpeRows),
      actualSets: filledSetCount > 0 ? `${filledSetCount}` : "",
      completed,
    });

    const message = `${lift.name} set ${nextSetIndex + 1} ${actionLabel}${completed ? "; lift complete" : ""}.`;
    if (startRest && !completed) {
      startRestTimer(lift.name, 90, `${message} Rest started.`);
      return;
    }

    setQuickEntryMessage(message);
  };

  const usePreviousLiftPerformance = (lift: TrackerLift) => {
    if (!selectedTrackerDay) return;

    const previous = previousLiftPerformance.get(normalizeLiftName(lift.name));
    if (!previous) return;

    const previousReps = splitRows(previous.lift.actualReps, previous.lift.plannedSets);
    const previousWeights = splitRows(previous.lift.weight, previous.lift.plannedSets);
    const previousRpes = splitRows(previous.lift.rpe, previous.lift.plannedSets);
    const nextReps = resizeRows(previousReps, lift.plannedSets, lift.plannedReps);
    const nextWeights = resizeRows(previousWeights, lift.plannedSets);
    const nextRpes = resizeRows(previousRpes, lift.plannedSets);
    const filledSetCount = nextReps.filter((row) => row.trim().length > 0).length;

    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualReps: joinRows(nextReps),
      weight: joinRows(nextWeights),
      rpe: joinRows(nextRpes),
      actualSets: filledSetCount > 0 ? `${filledSetCount}` : "",
      completed: false,
    });
    setQuickEntryMessage(`Loaded last ${lift.name} numbers from ${previous.day.date}. Edit anything that changed, then mark done.`);
  };

  const repeatFirstLoggedSet = (lift: TrackerLift) => {
    if (!selectedTrackerDay) return;

    const repsRows = splitRows(lift.actualReps, lift.plannedSets);
    const weightRows = splitRows(lift.weight, lift.plannedSets);
    const rpeRows = splitRows(lift.rpe, lift.plannedSets);
    const firstReps = repsRows[0] || lift.plannedReps;
    const firstWeight = weightRows[0] || "";
    const firstRpe = rpeRows[0] || "";

    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualReps: joinRows(Array.from({ length: lift.plannedSets }, () => firstReps)),
      weight: joinRows(Array.from({ length: lift.plannedSets }, () => firstWeight)),
      rpe: joinRows(Array.from({ length: lift.plannedSets }, () => firstRpe)),
      actualSets: `${lift.plannedSets}`,
      completed: true,
    });
    setQuickEntryMessage(`${lift.name} first set repeated across all planned sets.`);
  };

  const logLiftAtTarget = (lift: TrackerLift) => {
    if (!selectedTrackerDay) return;
    const targetReps = Array.from({ length: lift.plannedSets }, () => lift.plannedReps);

    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualSets: `${lift.plannedSets}`,
      actualReps: joinRows(targetReps),
      completed: true,
    });
    setQuickEntryMessage(`${lift.name} logged at target.`);
  };

  const selectActiveTrainingLift = (lift: TrackerLift) => {
    setActiveTrainingLiftId(lift.id);
    setActiveTrainingSetIndex(getNextOpenSetIndex(lift));
  };

  const selectNextActiveTrainingLift = (currentLift: TrackerLift) => {
    if (!selectedTrackerDay) return;

    const currentIndex = selectedTrackerDay.lifts.findIndex((lift) => lift.id === currentLift.id);
    const nextOpenLift =
      selectedTrackerDay.lifts.slice(currentIndex + 1).find((lift) => !lift.completed) ??
      selectedTrackerDay.lifts.find((lift) => !lift.completed && lift.id !== currentLift.id) ??
      selectedTrackerDay.lifts[currentIndex + 1] ??
      selectedTrackerDay.lifts[0] ??
      null;

    if (nextOpenLift) {
      selectActiveTrainingLift(nextOpenLift);
    }
  };

  const applyActiveTrainingPreset = (
    lift: TrackerLift,
    index: number,
    source: "previous" | "suggested" | "target"
  ) => {
    const previous = previousLiftPerformance.get(normalizeLiftName(lift.name))?.lift;
    const cue = resolveSetIncreaseCue(lift, previous, index);

    if (source === "target") {
      updateLiftSetValues(lift, index, { reps: lift.plannedReps }, false);
      setQuickEntryMessage(`${lift.name} set ${index + 1} filled with target reps.`);
      return;
    }

    const reps = cue.reps || lift.plannedReps;
    const weight = source === "suggested" ? cue.suggestedWeight || cue.weight : cue.weight;
    updateLiftSetValues(lift, index, { reps, weight, rpe: cue.rpe }, false);
    setQuickEntryMessage(
      source === "suggested" && cue.suggestedWeight
        ? `${lift.name} set ${index + 1}: try ${cue.suggestedWeight} lb.`
        : `${lift.name} set ${index + 1} copied from previous.`
    );
  };

  const saveActiveTrainingSet = (lift: TrackerLift, index: number) => {
    const rows = getLiftSetRows(lift);
    const nextReps = rows.reps[index] || lift.plannedReps;
    const filledSetCount = updateLiftSetValues(lift, index, { reps: nextReps }, true);
    const setComplete = filledSetCount >= lift.plannedSets;

    if (!setComplete && index < lift.plannedSets - 1) {
      setActiveTrainingSetIndex(index + 1);
      startRestTimer(lift.name, 90, `${lift.name} set ${index + 1} saved. Rest started.`);
      return;
    }

    if (setComplete) {
      setQuickEntryMessage(`${lift.name} complete.`);
      selectNextActiveTrainingLift(lift);
      return;
    }

    setQuickEntryMessage(`${lift.name} set ${index + 1} saved.`);
  };

  const closeOpenLiftsAtTarget = () => {
    if (!selectedTrackerDay) return;

    const openLifts = selectedTrackerDay.lifts.filter((lift) => !lift.completed);
    openLifts.forEach((lift) => {
        const targetReps = Array.from({ length: lift.plannedSets }, () => lift.plannedReps);
        updateTrackerLift(selectedTrackerDay.id, lift.id, {
          actualSets: `${lift.plannedSets}`,
          actualReps: joinRows(targetReps),
          completed: true,
        });
      });
    setQuickEntryMessage(`${openLifts.length} open lift${openLifts.length === 1 ? "" : "s"} logged at target.`);
  };

  const closeDailyBasics = () => {
    if (!selectedTrackerDay) return;

    if (!String(selectedTrackerDay.steps ?? "").trim() && targetSteps > 0) {
      updateTrackerDay(selectedTrackerDay.id, "steps", `${targetSteps}`);
    }

    if (!String(selectedTrackerDay.energy ?? "").trim()) {
      updateTrackerDay(selectedTrackerDay.id, "energy", "3");
    }

    if (!String(selectedTrackerDay.bodyWeight ?? "").trim() && liveBodyWeightLabel) {
      updateTrackerDay(selectedTrackerDay.id, "bodyWeight", liveBodyWeightLabel);
    }

    setQuickEntryMessage("Daily basics saved.");
  };

  const saveBasicsAndNextLift = () => {
    if (!selectedTrackerDay) return;

    closeDailyBasics();

    if (athleteNextOpenLift) {
      logLiftAtTarget(athleteNextOpenLift);
      setQuickEntryMessage(`Basics saved and ${athleteNextOpenLift.name} logged.`);
    }
  };

  const updateWearableDraft = <K extends keyof typeof wearableDraft>(key: K, value: (typeof wearableDraft)[K]) => {
    setWearableDraft((prev) => ({ ...prev, [key]: value }));
  };

  const importWearableSnapshot = () => {
    if (!selectedTrackerDay) return;

    const parsedSteps = Number(wearableDraft.steps || selectedTrackerDay.steps || targetSteps || 0);
    const parsedSleepHours = Number(wearableDraft.sleepHours || sleepHours || 0);
    const parsedSleepScore = Number(wearableDraft.sleepScore || Math.round(recoveryScore * 10));
    const parsedRestingHeartRate = Number(wearableDraft.restingHeartRate || 58);
    const parsedHrv = Number(wearableDraft.hrvMs || 48);
    const parsedBodyBattery = Number(wearableDraft.bodyBattery);
    const recoveryStatus: WearableRecoverySnapshot["recoveryStatus"] =
      parsedSleepScore >= 78 && parsedHrv >= 45 && parsedRestingHeartRate <= 62
        ? "green"
        : parsedSleepScore < 60 || parsedHrv < 32 || parsedRestingHeartRate >= 72
          ? "red"
          : "yellow";

    syncWearableSnapshot({
      date: selectedTrackerDay.date,
      source: wearableDraft.source,
      steps: Math.max(0, Math.round(parsedSteps || 0)),
      sleepHours: Math.max(0, Number((parsedSleepHours || 0).toFixed(1))),
      sleepScore: Math.max(0, Math.min(100, Math.round(parsedSleepScore || 0))),
      restingHeartRate: Math.max(0, Math.round(parsedRestingHeartRate || 0)),
      hrvMs: Math.max(0, Math.round(parsedHrv || 0)),
      bodyBattery: Number.isFinite(parsedBodyBattery) ? Math.max(0, Math.min(100, Math.round(parsedBodyBattery))) : undefined,
      recoveryStatus,
      note: wearableDraft.note.trim() || undefined,
    });
    if (parsedSteps > 0) {
      updateTrackerDay(selectedTrackerDay.id, "steps", String(Math.max(0, Math.round(parsedSteps))));
    }
    setQuickEntryMessage("Wearable data synced to today.");
  };

  const finishDay = () => {
    if (!selectedTrackerDay) return;
    const savedWithOpenItems = closeoutNeeds.length > 0;
    closeTrackerDay(selectedTrackerDay.id, closeoutNote);
    setQuickEntryMessage(
      savedWithOpenItems
        ? "Closeout saved with review flags. Nothing is hidden."
        : "Done for today. Closeout saved."
    );
  };

  const clearLiftLog = (lift: TrackerLift) => {
    if (!selectedTrackerDay) return;

    updateTrackerLift(selectedTrackerDay.id, lift.id, {
      actualSets: "",
      actualReps: "",
      weight: "",
      rpe: "",
      completed: false,
    });
    setQuickEntryMessage(`${lift.name} log cleared.`);
  };

  const toggleLiftCompletion = (lift: TrackerLift) => {
    if (!selectedTrackerDay) return;

    updateTrackerLift(selectedTrackerDay.id, lift.id, { completed: !lift.completed });
    setQuickEntryMessage(`${lift.name} marked ${lift.completed ? "open" : "done"}.`);
  };

  const openPrimaryTrackerAction = () => {
    if (trackerPrimaryAction.tab === "tracker") {
      setTrackerSurfaceTab("session");
      return;
    }

    if (trackerPrimaryAction.tab === "nutrition") {
      openNutritionSurface("insights");
      return;
    }

    goToTab(trackerPrimaryAction.tab);
  };

  const mobileCaptureLift =
    athleteNextOpenLift ??
    selectedTrackerDay?.lifts.find((lift) => !lift.completed) ??
    selectedTrackerDay?.lifts[0] ??
    null;
  const mobileCaptureLiftLoggedSetCount = mobileCaptureLift ? countFilledRows(mobileCaptureLift.actualReps) : 0;
  const mobileCaptureLiftPrevious = mobileCaptureLift
    ? previousLiftPerformance.get(normalizeLiftName(mobileCaptureLift.name)) ?? null
    : null;
  const mobileCaptureModes: Array<{
    id: MobileCaptureMode;
    label: string;
    helper: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "basics",
      label: "Basics",
      helper: trackerMissingFields.length === 0 ? "Done" : `${trackerMissingFields.length} open`,
      Icon: Scale,
    },
    {
      id: "food",
      label: "Food",
      helper: todayFuelSummary.foodEntriesLogged > 0 ? `${todayFuelSummary.foodEntriesLogged} logged` : "Add",
      Icon: Utensils,
    },
    {
      id: "lift",
      label: "Lift",
      helper: mobileCaptureLift ? `${mobileCaptureLiftLoggedSetCount}/${mobileCaptureLift.plannedSets}` : "Clear",
      Icon: Dumbbell,
    },
    {
      id: "check",
      label: "Check",
      helper: closeoutStatus === "closed" ? "Closed" : "Review",
      Icon: NotebookPen,
    },
  ];

  const mobileCaptureBody = selectedTrackerDay ? (
    <>
      {mobileCaptureMode === "basics" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-[16px] border border-white/80 bg-white/82 p-3 dark:border-white/10 dark:bg-white/[0.05]">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <Scale className="h-3.5 w-3.5" />
                Bodyweight
              </span>
              <Input
                value={selectedTrackerDay.bodyWeight}
                inputMode="decimal"
                placeholder={liveBodyWeightLabel || "0"}
                onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "bodyWeight", event.target.value)}
                className="mt-2 h-10 rounded-xl bg-white text-base dark:bg-slate-950/40"
              />
            </label>

            <label className="rounded-[16px] border border-white/80 bg-white/82 p-3 dark:border-white/10 dark:bg-white/[0.05]">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <Footprints className="h-3.5 w-3.5" />
                Steps
              </span>
              <Input
                value={selectedTrackerDay.steps}
                inputMode="numeric"
                placeholder={`${targetSteps}`}
                onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "steps", event.target.value)}
                className="mt-2 h-10 rounded-xl bg-white text-base dark:bg-slate-950/40"
              />
            </label>
          </div>

          <div className="rounded-[16px] border border-white/80 bg-white/82 p-3 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Energy</div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((energyPreset) => (
                <Button
                  key={`mobile-energy-${energyPreset}`}
                  type="button"
                  size="sm"
                  variant={String(selectedTrackerDay.energy) === String(energyPreset) ? "default" : "outline"}
                  className="h-10 px-0 text-sm"
                  onClick={() => updateTrackerDay(selectedTrackerDay.id, "energy", `${energyPreset}`)}
                >
                  {energyPreset}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11" onClick={closeDailyBasics}>Save basics</Button>
            <Button className="h-11" variant="outline" onClick={saveBasicsAndNextLift}>
              Save + lift
            </Button>
          </div>
        </div>
      ) : null}

      {mobileCaptureMode === "food" ? (
        <div className="space-y-3">
          <div className="rounded-[16px] border border-white/80 bg-white/82 p-3 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Food signal</div>
                <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {todayFuelSummary.calorieRemaining >= 0 ? `${todayFuelSummary.calorieRemaining} kcal left` : `${Math.abs(todayFuelSummary.calorieRemaining)} kcal over`}
                </div>
              </div>
              <Badge variant="outline">{todayFuelSummary.foodEntriesLogged} foods</Badge>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                ["Protein", todayFuelSummary.proteinConsumed, todayFuelSummary.proteinTarget, "bg-emerald-500"],
                ["Carbs", todayFuelSummary.carbsConsumed, todayFuelSummary.carbTarget, "bg-sky-500"],
                ["Fat", todayFuelSummary.fatsConsumed, todayFuelSummary.fatTarget, "bg-amber-500"],
              ].map(([label, consumed, target, fill]) => {
                const consumedNumber = Number(consumed);
                const targetNumber = Number(target);
                const percent = targetNumber > 0 ? Math.min(100, (consumedNumber / targetNumber) * 100) : 0;

                return (
                  <div key={`mobile-food-${label}`} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{label}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                      <div className={`h-full rounded-full ${fill}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">{consumedNumber}/{targetNumber}g</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11" onClick={() => openNutritionSurface("add", "search")}>Add food</Button>
            <Button className="h-11" variant="outline" onClick={() => openNutritionSurface("log")}>Review log</Button>
            <Button className="h-11" variant="outline" onClick={() => openNutritionSurface("add", "scan")}>Scan</Button>
            <Button className="h-11" variant="ghost" onClick={() => openNutritionSurface("add", "custom")}>Custom</Button>
          </div>
        </div>
      ) : null}

      {mobileCaptureMode === "lift" ? (
        <div className="space-y-3">
          {mobileCaptureLift ? (
            <>
              <div className="rounded-[16px] border border-white/80 bg-white/82 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Current lift</div>
                    <div className="mt-1 truncate text-lg font-semibold text-slate-950 dark:text-slate-100">{mobileCaptureLift.name}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {mobileCaptureLiftLoggedSetCount}/{mobileCaptureLift.plannedSets} sets logged. Target {mobileCaptureLift.plannedReps}, RIR {mobileCaptureLift.rir}.
                    </div>
                  </div>
                  <Badge variant="outline">
                    Set {Math.min(getNextOpenSetIndex(mobileCaptureLift) + 1, mobileCaptureLift.plannedSets)}
                  </Badge>
                </div>
                {mobileCaptureLiftPrevious ? (
                  <div className="mt-3 rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                    Last time: {summarizeLiftPerformance(mobileCaptureLiftPrevious.lift)}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button className="h-11" onClick={() => logNextLiftSet(mobileCaptureLift, "target", true)}>
                  Log set + rest
                </Button>
                <Button className="h-11" variant="outline" onClick={() => logNextLiftSet(mobileCaptureLift, "last")}>
                  Repeat last
                </Button>
                <Button className="h-11" variant="outline" onClick={() => logNextLiftSet(mobileCaptureLift, "history")}>
                  Use history
                </Button>
                <Button className="h-11" variant="ghost" onClick={() => setTrackerSurfaceTab("log")}>
                  Details
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
              All planned lifts are logged.
            </div>
          )}
        </div>
      ) : null}

      {mobileCaptureMode === "check" ? (
        <div className="space-y-3">
          <div className="rounded-[16px] border border-white/80 bg-white/82 p-3 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Check-in and closeout</div>
                <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {closeoutStatus === "closed" ? "Day closed" : closeoutNeeds.length === 0 ? "Ready to close" : `${closeoutNeeds.length} open`}
                </div>
              </div>
              <Badge variant="outline">{selectedTrackerCompletionPct}% session</Badge>
            </div>
            <Textarea
              value={closeoutNote}
              onChange={(event) => setCloseoutNote(event.target.value)}
              rows={3}
              placeholder="Closeout note"
              className="mt-3 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11" onClick={addCheckIn}>Add check-in</Button>
            <Button className="h-11" variant="outline" onClick={finishDay}>
              {closeoutStatus === "closed" ? "Update closeout" : "Close day"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  ) : null;

  const mobileQuickCapturePanel = selectedTrackerDay ? (
    <div className="rounded-t-[28px] rounded-b-[22px] border border-sky-200 bg-sky-50/90 p-3 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/20 md:hidden">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-sky-300/80 dark:bg-sky-400/40" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
            Capture sheet
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
            One job at a time
          </div>
        </div>
        <Badge className={trackerMissingFields.length === 0 ? "border-emerald-200 bg-white text-emerald-700" : "border-amber-200 bg-white text-amber-700"}>
          {trackerMissingFields.length === 0 ? "Basics ready" : `${trackerMissingFields.length} missing`}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-[18px] border border-white/80 bg-white/72 p-1.5 dark:border-white/10 dark:bg-white/[0.05]">
        {mobileCaptureModes.map((mode) => {
          const active = mobileCaptureMode === mode.id;

          return (
            <button
              key={`mobile-capture-mode-${mode.id}`}
              type="button"
              onClick={() => setMobileCaptureMode(mode.id)}
              className={[
                "flex min-w-0 flex-col items-center gap-1 rounded-[14px] px-1.5 py-2 text-center transition",
                active
                  ? "bg-slate-950 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <mode.Icon className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em]">{mode.label}</span>
              <span className="max-w-full truncate text-[9px] opacity-75">{mode.helper}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[20px] border border-white/80 bg-white/76 p-3 dark:border-white/10 dark:bg-white/[0.05]">
        {mobileCaptureBody}
      </div>

      {quickEntryMessage ? (
        <div className="mt-2 rounded-[14px] border border-emerald-200 bg-white/86 px-2.5 py-2 text-xs leading-5 text-emerald-700 dark:border-emerald-500/25 dark:bg-white/[0.06] dark:text-emerald-100">
          {quickEntryMessage}
        </div>
      ) : null}
    </div>
  ) : null;

  const commandLift =
    athleteNextOpenLift ??
    selectedTrackerDay?.lifts.find((lift) => !lift.completed) ??
    selectedTrackerDay?.lifts[0] ??
    null;
  const commandLiftLoggedSetCount = commandLift ? countFilledRows(commandLift.actualReps) : 0;
  const commandLiftPrevious = commandLift
    ? previousLiftPerformance.get(normalizeLiftName(commandLift.name)) ?? null
    : null;
  const commandLiftPreviousSummary = commandLiftPrevious
    ? summarizeLiftPerformance(commandLiftPrevious.lift)
    : "";
  const commandLiftNextSetIndex = commandLift ? getNextOpenSetIndex(commandLift) : 0;
  const commandLiftLastSetIndex = commandLift ? getLastLoggedSetIndex(commandLift) : -1;
  const commandLiftNextSetLabel = commandLift
    ? `Set ${Math.min(commandLiftNextSetIndex + 1, commandLift.plannedSets)} of ${commandLift.plannedSets}`
    : "No set selected";
  const commandLiftProgression = commandLift
    ? summarizeLiftProgression(commandLift, commandLiftPrevious?.lift)
    : "";
  const commandLiftHistoryEntries = commandLift
    ? exerciseHistoryByName.get(normalizeLiftName(commandLift.name)) ?? []
    : [];
  const commandLiftPriorHistory = selectedTrackerDay
    ? commandLiftHistoryEntries.filter((entry) => entry.date < selectedTrackerDay.date)
    : [];
  const commandLiftPreviousBestLoad =
    commandLiftPriorHistory
      .map((entry) => entry.topLoad)
      .filter((value): value is number => value !== null)
      .sort((left, right) => right - left)[0] ?? null;
  const commandLiftCurrentTopLoad = commandLift ? getLiftTopLoad(commandLift) : null;
  const commandLiftHistoryBadge =
    commandLiftCurrentTopLoad != null && commandLiftPreviousBestLoad != null && commandLiftCurrentTopLoad > commandLiftPreviousBestLoad
      ? "New best"
      : commandLiftCurrentTopLoad != null && commandLiftPreviousBestLoad != null && commandLiftCurrentTopLoad === commandLiftPreviousBestLoad
        ? "Matched best"
        : commandLiftPreviousBestLoad != null
          ? `Best ${commandLiftPreviousBestLoad} lb`
          : commandLiftHistoryEntries.length > 0
            ? `${commandLiftHistoryEntries.length} log${commandLiftHistoryEntries.length === 1 ? "" : "s"}`
            : "No history";
  const commandLiftExpanded =
    commandLift
      ? expandedAthleteLifts[commandLift.id] ??
        (isCoachView || athleteNextOpenLift?.id === commandLift.id || (!athleteNextOpenLift && !commandLift.completed))
      : false;
  const activeTrainingLift =
    selectedTrackerDay?.lifts.find((lift) => lift.id === activeTrainingLiftId) ??
    commandLift;
  const activeTrainingLiftRows = activeTrainingLift ? getLiftSetRows(activeTrainingLift) : null;
  const activeTrainingSetCount = activeTrainingLift?.plannedSets ?? 0;
  const activeTrainingSetNumber =
    activeTrainingSetCount > 0 ? Math.min(activeTrainingSetIndex, activeTrainingSetCount - 1) : 0;
  const activeTrainingPrevious = activeTrainingLift
    ? previousLiftPerformance.get(normalizeLiftName(activeTrainingLift.name)) ?? null
    : null;
  const activeTrainingCue = activeTrainingLift
    ? resolveSetIncreaseCue(activeTrainingLift, activeTrainingPrevious?.lift, activeTrainingSetNumber)
    : null;
  const activeTrainingProgress = selectedTrackerDay
    ? clamp(selectedTrackerCompletionPct, 0, 100)
    : 0;
  const restProgress = restTimer.totalSeconds > 0
    ? clamp((restTimer.secondsLeft / restTimer.totalSeconds) * 100, 0, 100)
    : 0;
  const activeTrainingSessionPanel = selectedTrackerDay ? (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/78">
      <div className="border-b border-slate-200 bg-slate-950 px-4 py-4 text-white dark:border-white/10 dark:bg-black/40 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-300">
              Active training
            </div>
            <div className="mt-1 truncate text-2xl font-semibold tracking-normal">
              {selectedTrackerDay.title}
            </div>
            <div className="mt-1 text-sm text-white/68">
              {selectedTrackerCompletedLifts}/{selectedTrackerDay.lifts.length} exercises done
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/55">Rest</div>
            <div className="mt-1 text-xl font-semibold">{restTimer.liftName ? formatTimerSeconds(restTimer.secondsLeft) : "Ready"}</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${activeTrainingProgress}%` }} />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/[0.03] lg:border-b-0 lg:border-r">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-2 lg:overflow-visible lg:pb-0">
            {selectedTrackerDay.lifts.map((lift, index) => {
              const active = activeTrainingLift?.id === lift.id;
              const loggedSets = countFilledRows(lift.actualReps);

              return (
                <button
                  key={`active-training-lift-${lift.id}`}
                  type="button"
                  onClick={() => selectActiveTrainingLift(lift)}
                  className={[
                    "min-w-[190px] rounded-[18px] border px-3 py-3 text-left transition lg:min-w-0",
                    active
                      ? "border-slate-950 bg-white shadow-sm dark:border-white/25 dark:bg-white/[0.08]"
                      : lift.completed
                        ? "border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/25 dark:bg-emerald-950/20"
                        : "border-slate-200 bg-white/78 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {index + 1}. {lift.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {loggedSets}/{lift.plannedSets} sets
                      </div>
                    </div>
                    {lift.completed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {activeTrainingLift && activeTrainingLiftRows && activeTrainingCue ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-slate-500" />
                    <h3 className="truncate text-xl font-semibold text-slate-950 dark:text-slate-100">
                      {activeTrainingLift.name}
                    </h3>
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Target {activeTrainingLift.plannedSets} x {activeTrainingLift.plannedReps} at RIR {activeTrainingLift.rir}
                  </div>
                </div>
                <Badge className={activeTrainingLift.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-sky-700"}>
                  {activeTrainingLift.completed ? "Done" : `Set ${activeTrainingSetNumber + 1}`}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: activeTrainingLift.plannedSets }, (_, index) => {
                  const setLogged = activeTrainingLiftRows.reps[index]?.trim().length > 0;
                  const active = index === activeTrainingSetNumber;

                  return (
                    <button
                      key={`active-training-set-${activeTrainingLift.id}-${index}`}
                      type="button"
                      onClick={() => setActiveTrainingSetIndex(index)}
                      className={[
                        "h-14 rounded-[14px] border px-2 text-center text-xs transition",
                        active
                          ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                          : setLogged
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
                      ].join(" ")}
                    >
                      <span className="block font-semibold">Set {index + 1}</span>
                      <span className="mt-0.5 block truncate text-[10px] opacity-75">
                        {setLogged ? formatSetSummary(activeTrainingLift, index) : "Open"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeTrainingPrevious ? (
                <div className="rounded-[18px] border border-sky-200 bg-sky-50/85 px-3 py-3 dark:border-sky-500/25 dark:bg-sky-950/20">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                        Previous on {activeTrainingPrevious.day.date}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Set {activeTrainingSetNumber + 1}: {activeTrainingCue.weight || "weight open"} x {activeTrainingCue.reps || activeTrainingLift.plannedReps}
                        {activeTrainingCue.rpe ? `, RPE ${activeTrainingCue.rpe}` : ""}
                      </div>
                    </div>
                    {activeTrainingCue.suggestedWeight ? (
                      <Badge className="border-emerald-200 bg-white text-emerald-700 dark:border-emerald-500/25 dark:bg-white/[0.08] dark:text-emerald-100">
                        <TrendingUp className="mr-1 h-3.5 w-3.5" />
                        Try {activeTrainingCue.suggestedWeight} lb
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  No previous numbers for this exercise yet.
                </div>
              )}

              <div className="rounded-[20px] border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      <span>Reps</span>
                      <span>Prev {activeTrainingCue.reps || "-"}</span>
                    </div>
                    <Input
                      value={activeTrainingLiftRows.reps[activeTrainingSetNumber] ?? ""}
                      inputMode="numeric"
                      placeholder={activeTrainingCue.reps || activeTrainingLift.plannedReps}
                      onChange={(event) => updateLiftSetField(activeTrainingLift, "actualReps", activeTrainingSetNumber, event.target.value)}
                      className="h-12 bg-white text-lg dark:bg-slate-950/40"
                    />
                  </label>

                  <label>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      <span>Weight</span>
                      <span>{activeTrainingCue.suggestedWeight ? `Try ${activeTrainingCue.suggestedWeight}` : `Prev ${activeTrainingCue.weight || "-"}`}</span>
                    </div>
                    <Input
                      value={activeTrainingLiftRows.weights[activeTrainingSetNumber] ?? ""}
                      inputMode="decimal"
                      placeholder={activeTrainingCue.suggestedWeight || activeTrainingCue.weight || "0"}
                      onChange={(event) => updateLiftSetField(activeTrainingLift, "weight", activeTrainingSetNumber, event.target.value)}
                      className="h-12 bg-white text-lg dark:bg-slate-950/40"
                    />
                  </label>

                  <label>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      <span>RPE</span>
                      <span>Prev {activeTrainingCue.rpe || "-"}</span>
                    </div>
                    <Input
                      value={activeTrainingLiftRows.rpes[activeTrainingSetNumber] ?? ""}
                      inputMode="decimal"
                      placeholder={activeTrainingCue.rpe || ""}
                      onChange={(event) => updateLiftSetField(activeTrainingLift, "rpe", activeTrainingSetNumber, event.target.value)}
                      className="h-12 bg-white text-lg dark:bg-slate-950/40"
                    />
                  </label>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    className="h-11"
                    onClick={() => saveActiveTrainingSet(activeTrainingLift, activeTrainingSetNumber)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save set
                  </Button>
                  <Button
                    className="h-11"
                    variant="outline"
                    onClick={() => applyActiveTrainingPreset(activeTrainingLift, activeTrainingSetNumber, "suggested")}
                    disabled={!activeTrainingCue.suggestedWeight}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Use try
                  </Button>
                  <Button
                    className="h-11"
                    variant="outline"
                    onClick={() => applyActiveTrainingPreset(activeTrainingLift, activeTrainingSetNumber, "previous")}
                    disabled={!activeTrainingPrevious}
                  >
                    Previous
                  </Button>
                  <Button
                    className="h-11"
                    variant="ghost"
                    onClick={() => startRestTimer(activeTrainingLift.name, 90)}
                  >
                    <TimerReset className="mr-2 h-4 w-4" />
                    Rest
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toggleLiftCompletion(activeTrainingLift);
                    if (!activeTrainingLift.completed) selectNextActiveTrainingLift(activeTrainingLift);
                  }}
                >
                  {activeTrainingLift.completed ? "Reopen" : "Exercise done"}
                </Button>
                <Button variant="outline" onClick={() => selectNextActiveTrainingLift(activeTrainingLift)}>
                  Next exercise
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {quickEntryMessage ? (
                <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                  {quickEntryMessage}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
              No lifts are planned for this day.
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <EmptyStatePanel title="No tracker day selected" detail="Pick today or a planned day before starting an active training session." />
  );
  const workoutCommandPanel = selectedTrackerDay ? (
    <div className="overflow-hidden rounded-[24px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm dark:border-sky-500/20 dark:from-sky-950/25 dark:via-slate-950/60 dark:to-emerald-950/20">
      <div className="grid lg:grid-cols-[1.05fr_0.98fr_0.9fr]">
        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
            Workout command
          </div>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-2xl font-semibold text-slate-950 dark:text-slate-100">
                {commandLift && !commandLift.completed ? commandLift.name : "Session ready to close"}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {selectedTrackerDay.title} | {selectedTrackerDay.date}
              </div>
            </div>
            <Badge className={openLiftCount === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-sky-700"}>
              {selectedTrackerCompletionPct}% complete
            </Badge>
          </div>

          {commandLift ? (
            <div className="mt-4 rounded-[18px] border border-white/80 bg-white/76 px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{commandLift.plannedSets} x {commandLift.plannedReps}</Badge>
                <Badge variant="outline">{commandLiftLoggedSetCount}/{commandLift.plannedSets} logged</Badge>
                <Badge variant="outline">RIR {commandLift.rir}</Badge>
                <Badge
                  className={
                    commandLiftHistoryBadge === "New best"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100"
                      : commandLiftHistoryBadge === "Matched best"
                        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/35 dark:text-sky-100"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
                  }
                >
                  {commandLiftHistoryBadge}
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className={commandLift.completed ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-sky-500"}
                  style={{ width: `${clamp((commandLiftLoggedSetCount / Math.max(commandLift.plannedSets, 1)) * 100, 0, 100)}%` }}
                />
              </div>
              {!commandLift.completed ? (
                <div className="mt-3 rounded-[16px] border border-sky-100 bg-sky-50/80 px-3 py-3 dark:border-sky-500/20 dark:bg-sky-950/20">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                        Current set
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {commandLiftNextSetLabel} - planned {commandLift.plannedReps}, RIR {commandLift.rir}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {commandLiftLastSetIndex >= 0
                          ? `Last logged: ${formatSetSummary(commandLift, commandLiftLastSetIndex)}. ${commandLiftProgression}.`
                          : commandLiftProgression}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:justify-end">
                      <Button size="sm" className="h-8 px-2 text-[11px]" onClick={() => logNextLiftSet(commandLift, "target", true)}>
                        Log + rest
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-[11px]"
                        onClick={() => logNextLiftSet(commandLift, "last", true)}
                        disabled={commandLiftLastSetIndex < 0}
                      >
                        Copy last
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-[11px]"
                        onClick={() => logNextLiftSet(commandLift, "history", false)}
                        disabled={!commandLiftPrevious}
                      >
                        History
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100">
              No lifts are planned for this day.
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {commandLift && !commandLift.completed ? (
              <Button size="sm" onClick={() => logLiftAtTarget(commandLift)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Hit target
              </Button>
            ) : null}
            {commandLift ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!commandLiftExpanded) toggleAthleteLiftExpanded(commandLift.id);
                }}
              >
                {commandLiftExpanded ? "Lift open" : "Open lift log"}
              </Button>
            ) : null}
            {openLiftCount > 1 ? (
              <Button size="sm" variant="outline" onClick={closeOpenLiftsAtTarget}>
                Hit all open
              </Button>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-white/10 lg:border-l lg:border-t-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
            Last numbers
          </div>
          {commandLiftPrevious && commandLift ? (
            <>
              <div className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                {commandLiftPreviousSummary}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                From {commandLiftPrevious.day.date}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!commandLift.completed ? (
                  <Button size="sm" variant="outline" onClick={() => usePreviousLiftPerformance(commandLift)}>
                    Use last numbers
                  </Button>
                ) : null}
                {commandLiftLoggedSetCount > 0 && !commandLift.completed ? (
                  <Button size="sm" variant="ghost" onClick={() => repeatFirstLoggedSet(commandLift)}>
                    Repeat first set
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-2 rounded-[18px] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {commandLift ? "No prior log found for this lift yet." : "Rest day or no lift selected."}
            </div>
          )}

          {quickEntryMessage ? (
            <div className="mt-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
              {quickEntryMessage}
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-white/10 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-200">
                Rest and closeout
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                {restTimer.liftName ? formatTimerSeconds(restTimer.secondsLeft) : "Ready"}
              </div>
            </div>
            <Badge
              className={
                closeoutStatus === "closed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : closeoutStatus === "needs-review"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-100 text-slate-700"
              }
            >
              {closeoutStatus === "closed" ? "Closed" : closeoutStatus === "needs-review" ? "Review" : "Open"}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {restTimer.liftName
              ? `${restTimer.liftName} | ${restTimer.running ? "running" : restTimer.secondsLeft > 0 ? "paused" : "done"}`
              : "Start rest after the set you just finished."}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${restProgress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {restTimer.liftName && restTimer.secondsLeft > 0 ? (
              <Button size="sm" variant="outline" onClick={toggleRestTimer}>
                {restTimer.running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {restTimer.running ? "Pause" : "Resume"}
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => startRestTimer(commandLift?.name ?? selectedTrackerDay.title, 90)}>
              <TimerReset className="mr-2 h-4 w-4" />
              Rest 1:30
            </Button>
            <Button size="sm" variant="ghost" onClick={resetRestTimer} disabled={!restTimer.liftName}>
              Reset
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            <Button size="sm" onClick={finishDay} disabled={closeoutDoneForToday}>
              {closeoutDoneForToday ? "Day closed" : closeoutSavedWithReview ? "Update closeout" : "Finish day"}
            </Button>
            {trackerMissingFields.length > 0 ? (
              <Button size="sm" variant="outline" onClick={closeDailyBasics}>
                Close basics
              </Button>
            ) : null}
            {foodCloseoutNeeds.length > 0 ? (
              <Button size="sm" variant="outline" onClick={() => openNutritionSurface("add", "search")}>
                Add food
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {closeoutNeeds.length > 0 ? (
        <div className="border-t border-slate-200 bg-white/58 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-wrap gap-2">
            {closeoutNeeds.map((item) => (
              <Badge key={`command-need-${item}`} variant="outline" className="bg-white/80 dark:bg-white/[0.06]">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  ) : null;

  const advancedDayToolsPanel =
    canEditPlan && selectedTrackerDay ? (
      <AdvancedEditorCard
        title="Advanced day controls"
        description="Change the selected day's structure, template source, or lift list."
        open={showAdvancedTracker}
        onToggle={toggleAdvancedTracker}
        summary="Template syncing and structural lift edits live here."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Day title</div>
              <Input value={selectedTrackerDay.title} onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "title", event.target.value)} />
            </label>
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Template source</div>
              <select className={inputClass} value={trackerTemplateDayId} onChange={(event) => setTrackerTemplateDayId(event.target.value)}>
                {workoutSplit.map((day) => (
                  <option key={day.id} value={day.id}>{day.day} - {day.focus}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Month label</div>
              <Input value={trackerMonthLabel} onChange={(event) => setTrackerMonthLabel(event.target.value)} />
            </label>
            <div className="flex items-end gap-2">
              <Button className="w-full" variant="outline" onClick={() => addTrackerLift(selectedTrackerDayId)}>Add lift</Button>
            </div>
          </div>

          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button variant="outline" onClick={() => pushTemplateToTracker(selectedTrackerDayId)}>Push split day</Button>
          </div>
        </div>
      </AdvancedEditorCard>
    ) : null;

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <Tabs
        value={trackerSurfaceTab}
        onValueChange={(value) => setTrackerSurfaceTab(value as TrackerSurfaceTab)}
        className="space-y-3"
      >
      <SectionCard
        title={userMode === "coach" ? "Daily tracker" : "Today"}
        right={(
          <TabsList className="flex flex-wrap items-center gap-2 rounded-[20px] border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <TabsTrigger value="dashboard">Status</TabsTrigger>
            <TabsTrigger value="session">In Gym</TabsTrigger>
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="insights">Review</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        )}
      >
        <TabsContent value="dashboard" className="space-y-3">
          {!selectedTrackerDay ? (
            <EmptyStatePanel title="No tracker day selected" detail="Pick a day first so the dashboard can show the correct status." />
          ) : (
            <>
              <div className="rounded-[24px] border border-slate-200 bg-white/84 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                      Today status
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                      {closeoutNeeds.length === 0 ? "Ready to close" : closeoutNeeds[0]}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {selectedTrackerDay.title} | {selectedTrackerDay.date}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={trackerReadinessScore >= 80 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : trackerReadinessScore >= 60 ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                      {trackerReadinessScore}% ready
                    </Badge>
                    <Badge variant="outline">{selectedTrackerCompletionPct}% session</Badge>
                    <Badge variant="outline">{trackerStepsLogged.toLocaleString()} steps</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <button
                    type="button"
                    onClick={() =>
                      todayFuelSummary.foodEntriesLogged > 0
                        ? openNutritionSurface("log")
                        : openNutritionSurface("add", "search")
                    }
                    className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4 text-left transition hover:-translate-y-[1px] hover:shadow-md dark:border-emerald-500/20 dark:bg-emerald-950/20"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">Food</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      {todayFuelSummary.calorieRemaining >= 0 ? `${todayFuelSummary.calorieRemaining} kcal left` : `${Math.abs(todayFuelSummary.calorieRemaining)} kcal over`}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {todayFuelSummary.foodEntriesLogged} foods, {todayFuelSummary.mealsLogged} meals
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackerSurfaceTab("session")}
                    className="rounded-[20px] border border-sky-200 bg-sky-50/80 p-4 text-left transition hover:-translate-y-[1px] hover:shadow-md dark:border-sky-500/20 dark:bg-sky-950/20"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">Training</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      {athleteNextOpenLift?.name ?? (openLiftCount > 0 ? `${openLiftCount} lifts open` : "All lifts logged")}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {selectedTrackerCompletedLifts}/{selectedTrackerDay.lifts.length} complete
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackerSurfaceTab("log")}
                    className="rounded-[20px] border border-amber-200 bg-amber-50/80 p-4 text-left transition hover:-translate-y-[1px] hover:shadow-md dark:border-amber-500/20 dark:bg-amber-950/20"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-200">Basics</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      {trackerMissingFields.length > 0 ? `${trackerMissingFields.length} missing` : "Logged"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Steps {selectedTrackerDay.steps || "0"}, energy {selectedTrackerDay.energy || "-"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={
                      closeoutStatus === "closed"
                        ? () => setTrackerSurfaceTab("log")
                        : closeoutNeeds.length === 0
                          ? finishDay
                          : () => setTrackerSurfaceTab("log")
                    }
                    className="rounded-[20px] border border-violet-200 bg-violet-50/80 p-4 text-left transition hover:-translate-y-[1px] hover:shadow-md dark:border-violet-500/20 dark:bg-violet-950/20"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-violet-700 dark:text-violet-200">Closeout</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      {closeoutStatus === "closed" ? "Closed" : closeoutNeeds.length === 0 ? "Finish day" : `${closeoutNeeds.length} left`}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {closeoutStatus === "closed" ? `Saved ${closeoutSavedLabel}` : "End-of-day check"}
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_0.72fr]">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Needs attention</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Only the blockers. Full logging lives in Food and Log.
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setTrackerSurfaceTab("log")}>
                      Open log
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {closeoutNeeds.length === 0 ? (
                      <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100">
                        Nothing is blocking today.
                      </div>
                    ) : (
                      closeoutNeeds.map((item) => (
                        <div key={`status-need-${item}`} className="rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
                          {item}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Week snapshot</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-100">{weekCompletionAverage}%</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {trackerWeeklyReview.completedDays} completed day{trackerWeeklyReview.completedDays === 1 ? "" : "s"}, {weekOpenLiftCount} open lift{weekOpenLiftCount === 1 ? "" : "s"}
                  </div>
                  {latestWeeklySnapshot ? (
                    <div className="mt-3 rounded-[16px] border border-slate-200 bg-white/78 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                      Latest limiter: {latestWeeklySnapshot.limiter}.
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setTrackerSurfaceTab("week")}>Week</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTrackerSurfaceTab("insights")}>Review</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          {!selectedTrackerDay ? (
            <EmptyStatePanel title="No tracker day selected" detail="Pick a day first so the logging flow can open the correct session." />
          ) : trackerMissingFields.length > 0 ? (
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
              Missing today: {trackerMissingFields.join(", ")}.
            </div>
          ) : null}
          {workoutCommandPanel}
        </TabsContent>

        <TabsContent value="session" className="space-y-3">
          {activeTrainingSessionPanel}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {athleteOffTrackFlags.length > 0 ? (
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
              {athleteOffTrackFlags[0]}
            </div>
          ) : (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
              No tracker flags right now.
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Week rhythm</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <AnalyticsStat
                  label="Week"
                  value={`${weekCompletionAverage}%`}
                  helper={`${trackerWeeklyReview.completedDays} completed days`}
                  tone={metricsTone(clamp(weekCompletionAverage / 10, 0, 10))}
                />
                <AnalyticsStat
                  label="Open lifts"
                  value={weekOpenLiftCount}
                  helper={nextOpenDay ? `Next: ${nextOpenDay.title}` : "Week is clean"}
                  tone={metricsTone(weekOpenLiftCount === 0 ? 9 : 5)}
                />
                <AnalyticsStat
                  label="Logged days"
                  value={trackerWeeklyReview.loggedDays}
                  helper={`${orderedTrackerDays.length} loaded days`}
                  tone={metricsTone(clamp(trackerWeeklyReview.loggedDays, 0, 10))}
                />
              </div>
              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                {nextOpenDay ? (
                  <Button onClick={() => openDayLog(nextOpenDay)}>Log next open day</Button>
                ) : null}
                {userMode === "coach" ? (
                  <Button variant="outline" onClick={() => goToTab("schedule")}>Full calendar</Button>
                ) : canEditPlan ? (
                  <Button variant="outline" onClick={() => goToTab("split")}>Training map</Button>
                ) : (
                  <Button variant="outline" onClick={() => setTrackerSurfaceTab("log")}>Back to log</Button>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {orderedTrackerDays.map((day) => {
                const completion = Number(day.completion ?? 0);
                const openLifts = day.lifts.filter((lift) => !lift.completed).length;
                const isSelected = day.id === selectedTrackerDayId;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => openDayLog(day)}
                    className={[
                      "rounded-[22px] border p-4 text-left transition-colors duration-200",
                      isSelected
                        ? "border-sky-200 bg-sky-50 shadow-sm dark:border-sky-800 dark:bg-sky-950/20"
                        : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20 dark:hover:bg-slate-900",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{day.title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{day.date}</div>
                      </div>
                      <Badge
                        className={
                          completion >= 85
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : completion >= 50
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                        }
                      >
                        {completion}%
                      </Badge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={completion >= 85 ? "h-full bg-emerald-500" : completion >= 50 ? "h-full bg-amber-500" : "h-full bg-slate-400"}
                        style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>{day.lifts.length} lifts</div>
                      <div>{openLifts} open</div>
                      <div>Steps {day.steps || "0"}</div>
                      <div>Energy {day.energy || "-"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </SectionCard>

      {trackerSurfaceTab === "insights" ? (
      <WorkspaceSummaryRail
        title={userMode === "coach" ? "Tracker review" : "Today"}
        items={trackerFocusCards}
      />
      ) : null}

      {(trackerSurfaceTab === "log" || trackerSurfaceTab === "insights") ? (
      <div className={trackerSurfaceTab === "log" ? "grid gap-4" : "grid gap-5 xl:grid-cols-[1.04fr_0.96fr]"}>
        {trackerSurfaceTab === "insights" ? (
        <SectionCard title={userMode === "coach" ? "Execution read" : "Today's cue"}>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                {userMode === "coach" ? "Primary action" : "Primary execution cue"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{trackerPrimaryAction.title}</div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{trackerPrimaryAction.body}</p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button onClick={openPrimaryTrackerAction}>{trackerPrimaryAction.cta}</Button>
              <Button variant="outline" onClick={() => openNutritionSurface("insights")}>Food review</Button>
              <Button variant="outline" onClick={() => setTrackerSurfaceTab("week")}>Week</Button>
            </div>

            {selectedTrackerDay && trackerMissingFields.length > 0 ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Missing today: {trackerMissingFields.join(", ")}.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AnalyticsStat label="Execution" value={selectedTrackerExecutionScore} helper="Daily composite" tone={metricsTone(clamp(selectedTrackerExecutionScore / 10, 0, 10))} />
              <AnalyticsStat
                label="Logged lifts"
                value={`${selectedTrackerCompletedLifts}/${selectedTrackerDay?.lifts.length ?? 0}`}
                helper="Today's session"
                tone={metricsTone(clamp((selectedTrackerCompletedLifts / Math.max(selectedTrackerDay?.lifts.length ?? 1, 1)) * 10, 0, 10))}
              />
              <AnalyticsStat label="Steps" value={selectedTrackerStepScore} helper="Day total" tone={metricsTone(clamp(selectedTrackerStepScore / 1000, 0, 10))} />
              <AnalyticsStat label="Recovery" value={recoveryScore.toFixed(1)} helper={`${sleepHours.toFixed(1)}h sleep`} tone={metricsTone(recoveryScore)} />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Coach review points" : "Athlete checklist"}</div>
                <div className="mt-3 space-y-2">
                  {(userMode === "coach" ? trackerCoachReviewCards : trackerAthleteChecklist).map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.label}</div>
                      <div className="mt-1">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">What needs attention</div>
                <div className="mt-3 space-y-2">
                  {athleteOffTrackFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                      Nothing major is off track right now.
                    </div>
                  ) : (
                    athleteOffTrackFlags.map((flag, index) => (
                      <button
                        key={`${flag}-${index}`}
                        type="button"
                        onClick={() => {
                          const target = getAttentionTarget(flag);
                          if (target === "nutrition") {
                            openNutritionSurface("insights");
                            return;
                          }
                          setTrackerSurfaceTab("insights");
                        }}
                        className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-sm text-amber-800 transition hover:-translate-y-[1px] hover:shadow-md"
                      >
                        {flag}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
        ) : null}

        {trackerSurfaceTab === "log" ? (
        <SectionCard title={userMode === "coach" ? "Day entry" : "Training details"}>
          {!selectedTrackerDay ? (
            <EmptyStatePanel title="No tracker day selected" detail="Pick a day first so the tracker can show the correct session and logging surface." />
          ) : (
            <div className="space-y-4">
              {mobileQuickCapturePanel}

              {isCoachView ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Current date</div>
                      <Input
                        type="date"
                        value={selectedCalendarDate}
                        onChange={(event) => {
                          setSelectedCalendarDate(event.target.value);
                          const match = trackerDays.find((day) => day.date === event.target.value);
                          if (match) setSelectedTrackerDayId(match.id);
                        }}
                      />
                    </label>
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Selected day</div>
                      <select
                        className={inputClass}
                        value={selectedTrackerDayId}
                        onChange={(event) => {
                          setSelectedTrackerDayId(event.target.value);
                          const match = trackerDays.find((day) => day.id === event.target.value);
                          if (match) setSelectedCalendarDate(match.date);
                        }}
                      >
                        {orderedTrackerDays.map((day) => (
                          <option key={day.id} value={day.id}>{day.date} - {day.title}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Entry status</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedTrackerDay.title}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {selectedTrackerDay.date} | {selectedTrackerCompletionPct}% complete | {selectedTrackerDay.lifts.length} lifts planned | {openLiftCount > 0 ? `${openLiftCount} still open` : "Session complete"}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-7">
                    {orderedTrackerDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          setSelectedTrackerDayId(day.id);
                          setSelectedCalendarDate(day.date);
                        }}
                        className={[
                          "min-w-[164px] rounded-[18px] border px-4 py-3 text-left transition",
                          day.id === selectedTrackerDayId
                            ? "border-slate-900/15 bg-sky-50 shadow-sm"
                            : "border-slate-200 bg-white/82",
                        ].join(" ")}
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{day.date}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{day.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{trackerDayCompletionMap[day.id] ?? 0}% complete</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="hidden rounded-[22px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05] md:block">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Quick entry</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Steps, energy, bodyweight</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {trackerMissingFields.length > 0 ? (
                      <Button size="sm" variant="outline" onClick={closeDailyBasics}>
                        Close basics
                      </Button>
                    ) : null}
                    {athleteNextOpenLift ? (
                      <Button size="sm" variant="ghost" onClick={saveBasicsAndNextLift}>
                        Basics + next lift
                      </Button>
                    ) : null}
                    <Badge variant="outline">{selectedTrackerCompletionPct}% complete</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
                    <Label className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Steps</Label>
                    <Input
                      value={selectedTrackerDay.steps}
                      inputMode="numeric"
                      onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "steps", event.target.value)}
                      className="mt-2"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {stepPresetOptions.map((stepPreset) => (
                        <Button
                          key={stepPreset}
                          type="button"
                          size="sm"
                          variant={String(selectedTrackerDay.steps) === String(stepPreset) ? "default" : "outline"}
                          onClick={() => updateTrackerDay(selectedTrackerDay.id, "steps", `${stepPreset}`)}
                        >
                          {stepPreset.toLocaleString()}{stepPreset === targetSteps ? " target" : ""}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
                    <Label className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Energy</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((energyPreset) => (
                        <Button
                          key={energyPreset}
                          type="button"
                          size="sm"
                          variant={String(selectedTrackerDay.energy) === String(energyPreset) ? "default" : "outline"}
                          onClick={() => updateTrackerDay(selectedTrackerDay.id, "energy", `${energyPreset}`)}
                        >
                          {energyPreset}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
                    <Label className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Bodyweight</Label>
                    <Input
                      value={selectedTrackerDay.bodyWeight}
                      inputMode="decimal"
                      onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "bodyWeight", event.target.value)}
                      className="mt-2"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateTrackerDay(selectedTrackerDay.id, "bodyWeight", liveBodyWeightLabel)}
                      >
                        Use live {liveBodyWeightLabel}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => updateTrackerDay(selectedTrackerDay.id, "bodyWeight", "")}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Recovery sync</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {latestWearableSnapshot
                        ? `${latestWearableSnapshot.source}: ${latestWearableSnapshot.sleepHours.toFixed(1)}h sleep, ${latestWearableSnapshot.hrvMs}ms HRV`
                        : "Manual import-ready recovery data"}
                    </div>
                  </div>
                  <Badge
                    className={
                      latestWearableSnapshot?.recoveryStatus === "green"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100"
                        : latestWearableSnapshot?.recoveryStatus === "red"
                          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-950/35 dark:text-rose-100"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100"
                    }
                  >
                    {latestWearableSnapshot?.recoveryStatus ?? "ready"}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Source</div>
                    <select
                      className={inputClass}
                      value={wearableDraft.source}
                      onChange={(event) => updateWearableDraft("source", event.target.value as WearableRecoverySnapshot["source"])}
                    >
                      {(["Manual", "Apple Health", "Oura", "Whoop", "Garmin", "CSV"] as WearableRecoverySnapshot["source"][]).map((source) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Steps</div>
                    <Input value={wearableDraft.steps} inputMode="numeric" placeholder={`${targetSteps}`} onChange={(event) => updateWearableDraft("steps", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Sleep</div>
                    <Input value={wearableDraft.sleepHours} inputMode="decimal" placeholder={`${sleepHours.toFixed(1)}`} onChange={(event) => updateWearableDraft("sleepHours", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Sleep score</div>
                    <Input value={wearableDraft.sleepScore} inputMode="numeric" placeholder={`${Math.round(recoveryScore * 10)}`} onChange={(event) => updateWearableDraft("sleepScore", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">RHR</div>
                    <Input value={wearableDraft.restingHeartRate} inputMode="numeric" placeholder="58" onChange={(event) => updateWearableDraft("restingHeartRate", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">HRV</div>
                    <Input value={wearableDraft.hrvMs} inputMode="numeric" placeholder="48" onChange={(event) => updateWearableDraft("hrvMs", event.target.value)} />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={wearableDraft.note}
                    placeholder="Optional recovery note"
                    onChange={(event) => updateWearableDraft("note", event.target.value)}
                  />
                  <Button onClick={importWearableSnapshot}>Sync to today</Button>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Conditioning and posing</div>
                    <Badge variant="outline">{selectedTrackerDay.lifts.length} lifts planned</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 sm:col-span-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Conditioning</div>
                      <select
                        className={inputClass}
                        value={selectedTrackerDay.conditioningModalityId ?? ""}
                        onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "conditioningModalityId", event.target.value)}
                      >
                        <option value="">None logged</option>
                        {conditioningModalityLibrary.map((item) => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Minutes</div>
                      <Input
                        value={selectedTrackerDay.conditioningMinutes ?? ""}
                        onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "conditioningMinutes", event.target.value)}
                        placeholder="0"
                      />
                    </label>
                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Effort / 10</div>
                      <Input
                        value={selectedTrackerDay.conditioningEffort ?? ""}
                        onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "conditioningEffort", event.target.value)}
                        placeholder="0"
                      />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Posing rounds</div>
                      <Input
                        value={selectedTrackerDay.posingRounds ?? ""}
                        onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "posingRounds", event.target.value)}
                        placeholder="0"
                      />
                    </label>
                  </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white/84 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div
                  className={[
                    "p-4",
                    closeoutDoneForToday
                      ? "bg-emerald-50/90 dark:bg-emerald-950/20"
                      : closeoutSavedWithReview
                        ? "bg-amber-50/90 dark:bg-amber-950/20"
                        : "bg-slate-50/90 dark:bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Daily closeout</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                        {closeoutHeroTitle}
                      </div>
                      <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {closeoutHeroDetail}
                      </div>
                    </div>
                    <Badge
                      className={
                        closeoutDoneForToday
                          ? "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100"
                          : closeoutSavedWithReview
                            ? "border-amber-200 bg-white text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100"
                            : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200"
                      }
                    >
                      {closeoutDoneForToday ? "Closed" : closeoutSavedWithReview ? "Review saved" : "Open"}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {closeoutCompletionRows.map((item) => (
                        <div
                          key={`closeout-${item.label}`}
                          className={[
                            "rounded-[18px] border px-3 py-3",
                            item.done
                              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100"
                              : "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">{item.label}</div>
                            <Badge
                              className={
                                item.done
                                  ? "border-emerald-200 bg-white/80 text-emerald-700"
                                  : "border-amber-200 bg-white/80 text-amber-700"
                              }
                            >
                              {item.done ? "Ready" : "Review"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm leading-5 opacity-85">{item.detail}</div>
                        </div>
                      ))}
                    </div>

                    {selectedTrackerDay.closeoutNote ? (
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50/85 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">Saved note:</span>{" "}
                        {selectedTrackerDay.closeoutNote}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-slate-950/40">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">What gets saved</div>
                      <div className="mt-3 grid gap-2">
                        {closeoutVisibilityRows.map((item) => (
                          <div key={`visibility-${item.label}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-white/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                            <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Closeout note</div>
                      <Input
                        value={closeoutNote}
                        onChange={(event) => setCloseoutNote(event.target.value)}
                        placeholder={selfManagedAthlete ? "Optional note for your review" : "Anything coach should know"}
                      />
                    </label>

                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      <Button onClick={finishDay} disabled={closeoutDoneForToday}>
                        {closeoutDoneForToday ? "Done for today" : closeoutSavedWithReview ? "Update closeout" : "Finish day"}
                      </Button>
                      {openLiftCount > 0 ? (
                        <Button variant="outline" onClick={closeOpenLiftsAtTarget}>
                          Hit open targets
                        </Button>
                      ) : null}
                      {trackerMissingFields.length > 0 ? (
                        <Button variant="outline" onClick={closeDailyBasics}>
                          Close basics
                        </Button>
                      ) : null}
                      {foodCloseoutNeeds.length > 0 ? (
                        <Button variant="outline" onClick={() => openNutritionSurface("add", "search")}>
                          Add food
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {canEditPlan ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setTrackerSurfaceTab("insights")}>Advanced edits</Button>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
        ) : null}

        {trackerSurfaceTab === "log" && selectedTrackerDay ? (
          <SectionCard title="Live read">
            <div className="grid gap-3">
              <GaugeChart
                label="Readiness"
                value={trackerReadinessScore}
                helper={`${selectedTrackerCompletionPct}% complete`}
                tone={trackerReadinessScore >= 80 ? "emerald" : trackerReadinessScore >= 60 ? "amber" : "rose"}
              />
              <StatusLineChart
                label="Week line"
                values={weekCompletionLine}
                unit="%"
              />
              <DonutChart
                label="Macros"
                center={`${todayFuelSummary.caloriesConsumed}`}
                segments={macroChartSegments}
              />
              <BulletChart
                label="Steps"
                value={trackerStepsLogged}
                target={targetSteps}
                max={Math.max(targetSteps * 1.15, trackerStepsLogged, 1)}
                tone={trackerStepsLogged >= targetSteps ? "emerald" : "amber"}
              />
            </div>
          </SectionCard>
        ) : null}
      </div>
      ) : null}

      {trackerSurfaceTab === "insights" ? advancedDayToolsPanel : null}

      {trackerSurfaceTab === "log" && selectedTrackerDay ? (
        <SectionCard title="Today's lifts">
          <div className="space-y-4">
            {commandLift ? (
              <div className="sticky top-2 z-20 rounded-[20px] border border-sky-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-sky-500/25 dark:bg-slate-950/92 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                      Current lift
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {commandLift.completed ? "Session ready to close" : commandLift.name}
                    </div>
                    {!commandLift.completed ? (
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {commandLiftNextSetLabel} - {commandLift.plannedReps} reps
                      </div>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {openLiftCount} open
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {!commandLift.completed ? (
                    <Button size="sm" className="h-8 px-2 text-[11px]" onClick={() => logNextLiftSet(commandLift, "target", true)}>
                      Set+rest
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-8 px-2 text-[11px]" onClick={() => toggleLiftCompletion(commandLift)}>
                      Undo
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-[11px]"
                    onClick={() => logNextLiftSet(commandLift, "last", true)}
                    disabled={commandLift.completed || commandLiftLastSetIndex < 0}
                  >
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-[11px]" onClick={() => toggleAthleteLiftExpanded(commandLift.id)}>
                    Details
                  </Button>
                </div>
              </div>
            ) : null}

            {selectedTrackerDay.lifts.map((lift) => {
              const isNextOpenLift = athleteNextOpenLift?.id === lift.id;
              const isExpanded = expandedAthleteLifts[lift.id] ?? isCoachView;
              const repsRows = splitRows(lift.actualReps, lift.plannedSets);
              const weightRows = splitRows(lift.weight, lift.plannedSets);
              const rpeRows = splitRows(lift.rpe, lift.plannedSets);
              const loggedSetCount = repsRows.filter((row) => row.trim().length > 0).length;
              const previousPerformance = previousLiftPerformance.get(normalizeLiftName(lift.name));
              const previousPerformanceSummary = previousPerformance
                ? summarizeLiftPerformance(previousPerformance.lift)
                : "";
              const nextSetIndex = getNextOpenSetIndex(lift);
              const lastLoggedSetIndex = getLastLoggedSetIndex(lift);
              const liftProgression = summarizeLiftProgression(lift, previousPerformance?.lift);
              const exerciseHistoryEntries = exerciseHistoryByName.get(normalizeLiftName(lift.name)) ?? [];
              const priorHistoryEntries = exerciseHistoryEntries.filter((entry) => entry.date < selectedTrackerDay.date);
              const recentHistoryEntries = priorHistoryEntries.slice(0, 3);
              const previousBestLoad =
                priorHistoryEntries
                  .map((entry) => entry.topLoad)
                  .filter((value): value is number => value !== null)
                  .sort((left, right) => right - left)[0] ?? null;
              const currentTopLoad = getLiftTopLoad(lift);
              const isNewBestLoad = currentTopLoad != null && previousBestLoad != null && currentTopLoad > previousBestLoad;
              const isMatchedBestLoad = currentTopLoad != null && previousBestLoad != null && currentTopLoad === previousBestLoad;
              const isFirstRecordedLoad = currentTopLoad != null && previousBestLoad == null && loggedSetCount > 0;

              return (
                <div
                  key={lift.id}
                  className={[
                    "rounded-[20px] border p-3 transition sm:rounded-[24px] sm:p-4",
                    lift.completed
                      ? "border-emerald-200/70 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white/84 dark:border-white/10 dark:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{lift.name}</div>
                        <Badge variant="outline">{lift.plannedSets} x {lift.plannedReps}</Badge>
                        <Badge variant="outline">{loggedSetCount}/{lift.plannedSets} logged</Badge>
                        <Badge className={lift.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-100" : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200"}>
                          {lift.completed ? "Done" : "Open"}
                        </Badge>
                        {isNextOpenLift ? (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/40 dark:text-sky-100">Next</Badge>
                        ) : null}
                        {isNewBestLoad ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-100">
                            New best
                          </Badge>
                        ) : isMatchedBestLoad ? (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/40 dark:text-sky-100">
                            Matched best
                          </Badge>
                        ) : isFirstRecordedLoad ? (
                          <Badge className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-950/40 dark:text-violet-100">
                            First load
                          </Badge>
                        ) : previousBestLoad != null ? (
                          <Badge variant="outline">Best {previousBestLoad} lb</Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Target RIR {lift.rir}</div>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Plan</div>
                          <div className="mt-1 text-xs font-semibold text-slate-950 dark:text-slate-100">
                            {lift.plannedSets} x {lift.plannedReps}
                          </div>
                        </div>
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Actual</div>
                          <div className="mt-1 truncate text-xs font-semibold text-slate-950 dark:text-slate-100">
                            {loggedSetCount > 0 ? summarizeLiftPerformance(lift) : "No sets yet"}
                          </div>
                        </div>
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Progression</div>
                          <div className="mt-1 truncate text-xs font-semibold text-slate-950 dark:text-slate-100">
                            {liftProgression}
                          </div>
                        </div>
                      </div>
                      {previousPerformance ? (
                        <div className="mt-3 hidden flex-col gap-2 rounded-[18px] border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/25 dark:text-sky-100 md:flex md:flex-row md:items-center md:justify-between">
                          <div>
                            <span className="font-semibold">Last time:</span> {previousPerformanceSummary} on {previousPerformance.day.date}.
                          </div>
                          {!lift.completed ? (
                            <Button size="sm" variant="outline" onClick={() => usePreviousLiftPerformance(lift)}>
                              Use last numbers
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                      {recentHistoryEntries.length > 0 ? (
                        <div className="mt-3 hidden rounded-[18px] border border-slate-200 bg-white/72 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04] md:block">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                              Recent history
                            </div>
                            <Badge variant="outline">{priorHistoryEntries.length} prior log{priorHistoryEntries.length === 1 ? "" : "s"}</Badge>
                          </div>
                          <div className="mt-2 grid gap-2 lg:grid-cols-3">
                            {recentHistoryEntries.map((entry) => (
                              <div key={`${lift.id}-history-${entry.id}`} className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-950 dark:text-slate-100">{entry.date}</span>
                                  {entry.topLoad != null ? (
                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{entry.topLoad} lb</span>
                                  ) : null}
                                </div>
                                <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{entry.summary}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="hidden flex-wrap gap-2 md:flex">
                      {!lift.completed ? (
                        <Button size="sm" onClick={() => logNextLiftSet(lift, "target", true)}>
                          Log next set
                        </Button>
                      ) : null}
                      {!lift.completed && lastLoggedSetIndex >= 0 ? (
                        <Button size="sm" variant="outline" onClick={() => logNextLiftSet(lift, "last", true)}>
                          Copy last set
                        </Button>
                      ) : null}
                      {!lift.completed ? (
                        <Button size="sm" variant="outline" onClick={() => logLiftAtTarget(lift)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Hit target
                        </Button>
                      ) : null}
                      {loggedSetCount > 0 && !lift.completed ? (
                        <Button size="sm" variant="outline" onClick={() => repeatFirstLoggedSet(lift)}>
                          Repeat first set
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => startRestTimer(lift.name, 90)}>
                        <TimerReset className="mr-2 h-4 w-4" />
                        Rest 1:30
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => startRestTimer(lift.name, 120)}>
                        Rest 2:00
                      </Button>
                      <Button size="sm" variant={lift.completed ? "outline" : "default"} onClick={() => toggleLiftCompletion(lift)}>
                        {lift.completed ? "Undo" : "Mark done"}
                      </Button>
                      {loggedSetCount > 0 || lift.completed ? (
                        <Button size="sm" variant="ghost" onClick={() => clearLiftLog(lift)}>
                          Clear
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => toggleAthleteLiftExpanded(lift.id)}>
                        {isExpanded ? "Hide log" : "Open log"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 md:hidden">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Array.from({ length: lift.plannedSets }, (_, index) => {
                        const setLogged = repsRows[index]?.trim().length > 0;
                        return (
                          <Button
                            key={`${lift.id}-quick-set-${index}`}
                            type="button"
                            size="sm"
                            variant={setLogged ? "default" : "outline"}
                            className="h-11 min-w-16 shrink-0 flex-col rounded-xl px-2 text-[11px] leading-tight"
                            onClick={() =>
                              fillLiftSetFromSource(
                                lift,
                                index,
                                index > 0 && repsRows[index - 1]?.trim() ? "previous" : "target"
                              )
                            }
                          >
                            <span>S{index + 1}</span>
                            <span className="max-w-14 truncate text-[10px] opacity-75">
                              {setLogged ? formatSetSummary(lift, index) : index === nextSetIndex ? "Next" : "Open"}
                            </span>
                          </Button>
                        );
                      })}
                    </div>

                    {!lift.completed ? (
                      <div className="rounded-[16px] border border-sky-100 bg-sky-50/80 px-3 py-2 dark:border-sky-500/20 dark:bg-sky-950/20">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                              Next set
                            </div>
                            <div className="mt-0.5 truncate text-xs font-semibold text-slate-950 dark:text-slate-100">
                              S{nextSetIndex + 1} - planned {lift.plannedReps}
                            </div>
                          </div>
                          {lastLoggedSetIndex >= 0 ? (
                            <div className="shrink-0 text-right text-[11px] text-slate-600 dark:text-slate-300">
                              Last {formatSetSummary(lift, lastLoggedSetIndex)}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          <Button size="sm" className="h-8 px-2 text-[11px]" onClick={() => logNextLiftSet(lift, "target", true)}>
                            Log+rest
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-[11px]"
                            onClick={() => logNextLiftSet(lift, "last", true)}
                            disabled={lastLoggedSetIndex < 0}
                          >
                            Copy last
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-[11px]"
                            onClick={() => logNextLiftSet(lift, "history", false)}
                            disabled={!previousPerformance}
                          >
                            History
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-3 gap-1.5">
                      {!lift.completed ? (
                        <Button size="sm" className="h-8 px-2 text-[11px]" onClick={() => logLiftAtTarget(lift)}>
                          Hit target
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 px-2 text-[11px]" onClick={() => toggleLiftCompletion(lift)}>
                          Undo
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 px-2 text-[11px]" onClick={() => startRestTimer(lift.name, 90)}>
                        Rest
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-[11px]" onClick={() => toggleAthleteLiftExpanded(lift.id)}>
                        {isExpanded ? "Hide" : "Details"}
                      </Button>
                    </div>

                    {previousPerformance && isExpanded ? (
                      <div className="rounded-[16px] border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/25 dark:text-sky-100">
                        <div>
                          <span className="font-semibold">Last:</span> {previousPerformanceSummary}
                        </div>
                        {!lift.completed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-8 px-2 text-[11px]"
                            onClick={() => usePreviousLiftPerformance(lift)}
                          >
                            Use last numbers
                          </Button>
                        ) : null}
                      </div>
                    ) : null}

                    {recentHistoryEntries.length > 0 && isExpanded ? (
                      <div className="rounded-[16px] border border-slate-200 bg-white/72 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                            History
                          </div>
                          {previousBestLoad != null ? (
                            <Badge variant="outline" className="px-2 py-0.5 text-[10px]">Best {previousBestLoad} lb</Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 grid gap-1.5">
                          {recentHistoryEntries.map((entry) => (
                            <div key={`${lift.id}-mobile-history-${entry.id}`} className="flex items-center justify-between gap-2 rounded-[12px] border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{entry.date}</span>
                              <span className="min-w-0 truncate text-right text-slate-600 dark:text-slate-300">{entry.topLoad != null ? `${entry.topLoad} lb` : entry.summary}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                        {Array.from({ length: lift.plannedSets }, (_, index) => (
                          <div key={`${lift.id}-set-${index}`} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Set {index + 1}</div>
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <Badge variant="outline">{lift.plannedReps}</Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 rounded-xl px-2 text-[11px]"
                                  onClick={() => fillLiftSetFromSource(lift, index, "target")}
                                >
                                  Target
                                </Button>
                                {index > 0 ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 rounded-xl px-2 text-[11px]"
                                    onClick={() => fillLiftSetFromSource(lift, index, "previous")}
                                  >
                                    Copy prev
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              <label className="space-y-1">
                                <div className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">Reps</div>
                                <Input value={repsRows[index]} onChange={(event) => updateLiftSetField(lift, "actualReps", index, event.target.value)} />
                              </label>
                              <label className="space-y-1">
                                <div className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">Weight</div>
                                <Input value={weightRows[index]} onChange={(event) => updateLiftSetField(lift, "weight", index, event.target.value)} />
                              </label>
                              <label className="space-y-1">
                                <div className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">RPE</div>
                                <Input value={rpeRows[index]} onChange={(event) => updateLiftSetField(lift, "rpe", index, event.target.value)} />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>

                      <label className="space-y-2">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Exercise note</div>
                        <Input
                          value={lift.notes ?? ""}
                          onChange={(event) => updateTrackerLift(selectedTrackerDay.id, lift.id, { notes: event.target.value })}
                          placeholder="Quick note if needed"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-4 hidden rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 md:block">
                      {loggedSetCount}/{lift.plannedSets} sets logged.
                    </div>
                  )}
                </div>
              );
            })}

            <label className="space-y-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daily notes</div>
              <Textarea value={selectedTrackerDay.notes} onChange={(event) => updateTrackerDay(selectedTrackerDay.id, "notes", event.target.value)} rows={5} />
            </label>
          </div>
        </SectionCard>
      ) : null}

      {trackerSurfaceTab === "dashboard" ? (
      <div className={isCoachView ? "grid gap-5 lg:hidden" : "max-w-[440px] lg:hidden"}>
        <SectionCard title={userMode === "coach" ? "Coach tasks" : "Open tasks"}>
          {canEditPlan ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button onClick={addTrackerTask}>Add task</Button>
                <Badge variant="outline">{openTrackerTasks.length} open</Badge>
              </div>
              {trackerTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                  {isCoachView ? (
                    <div className="grid gap-3 xl:grid-cols-[1fr_0.8fr_0.7fr_auto_auto]">
                      <Input value={task.label} onChange={(event) => updateTrackerTask(task.id, { label: event.target.value })} />
                      <Input value={task.category} onChange={(event) => updateTrackerTask(task.id, { category: event.target.value })} />
                      <Input value={task.target ?? ""} onChange={(event) => updateTrackerTask(task.id, { target: event.target.value })} />
                      <Button size="sm" variant={task.done ? "default" : "outline"} onClick={() => updateTrackerTask(task.id, { done: !task.done })}>
                        {task.done ? "Done" : "Open"}
                      </Button>
                      <Button
                        size="sm"
                        variant={pendingTaskDeleteId === task.id ? "outline" : "ghost"}
                        onClick={() => requestRemoveTrackerTask(task.id)}
                      >
                        {pendingTaskDeleteId === task.id ? "Confirm" : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input value={task.label} onChange={(event) => updateTrackerTask(task.id, { label: event.target.value })} />
                        <Button size="sm" variant={task.done ? "default" : "outline"} onClick={() => updateTrackerTask(task.id, { done: !task.done })}>
                          {task.done ? "Done" : "Open"}
                        </Button>
                        <Button
                          size="sm"
                          variant={pendingTaskDeleteId === task.id ? "outline" : "ghost"}
                          onClick={() => requestRemoveTrackerTask(task.id)}
                        >
                          {pendingTaskDeleteId === task.id ? "Confirm" : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                        <Input value={task.category} onChange={(event) => updateTrackerTask(task.id, { category: event.target.value })} />
                        <Input value={task.target ?? ""} onChange={(event) => updateTrackerTask(task.id, { target: event.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Open support items</div>
                <Badge variant="outline">{openTrackerTasks.length} open</Badge>
              </div>
              {openTrackerTasks.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">No open support items right now.</div>
              ) : (
                openTrackerTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{task.label}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.category}{task.target ? `, ${task.target}` : ""}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </SectionCard>
      </div>
      ) : null}
      </Tabs>
    </div>
  );
}

