import React from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import type { ExerciseLibraryItem } from "../../lib/data/exerciseLibrary";
import type { AdaptationCard } from "../adaptation_engine";
import { inputClass, panelHoverClass, softPanelClass } from "../constants";
import type { ExerciseScientificProfile } from "../performance_libraries";
import { chartAxisProps, chartGridProps, chartPalette, ChartTooltip } from "../stage_prep_shared";
import type { WorkoutDay } from "../types";
import {
  AdvancedEditorCard,
  AnalyticsStat,
  EmptyStatePanel,
  SectionCard,
  SignalTile,
} from "../workspace_ui";

type UserMode = "athlete" | "coach";

type SplitPrimaryAction = {
  title: string;
  body: string;
  cta: string;
};

type SplitPrioritySummary = {
  topPriority: string;
  duplication: string;
};

type SplitBuilderStats = {
  totalDays: number;
  totalExercises: number;
  averageSets: number | string;
};

type SplitTemplateOption = {
  id: string;
  label: string;
};

type SplitWeekPlanCard = {
  id: string;
  day: string;
  focus: string;
  isRest: boolean;
  sets: number;
  exercises: number;
  intensity: number | string;
  volume: number | string;
  systemicLoad: number;
};

type SplitSystemicPoint = {
  day: string;
  systemic: number;
};

type SplitMuscleFrequencyItem = {
  muscle: string;
  frequency: number;
};

type TrainingSurfaceIntent = {
  surface: "exercise-support";
  dayId?: string;
  nonce: number;
};

type SplitTabProps = {
  userMode: UserMode;
  canEditPlan: boolean;
  splitPrimaryAction: SplitPrimaryAction;
  trainingSuggestion: string;
  splitPrioritySummary: SplitPrioritySummary;
  applyTrainingSuggestion: () => void;
  goToTab: (tab: string) => void;
  splitBuilderStats: SplitBuilderStats;
  weeklyDensityScore: number;
  adaptationCards: AdaptationCard[];
  metricsTone: (value: number) => string;
  splitExecutionRisks: string[];
  splitTemplateOptions: SplitTemplateOption[];
  splitTemplate: string;
  applySplitTemplate: (id: string) => void;
  splitStrengthBias: number;
  setSplitStrengthBias: (value: number) => void;
  splitHypertrophyBias: number;
  setSplitHypertrophyBias: (value: number) => void;
  splitVolumeBias: number;
  setSplitVolumeBias: (value: number) => void;
  splitRecoveryBias: number;
  setSplitRecoveryBias: (value: number) => void;
  splitFrequencyBias: number;
  setSplitFrequencyBias: (value: number) => void;
  splitIntensityBias: number;
  setSplitIntensityBias: (value: number) => void;
  splitPriorityMuscles: string[];
  splitPriorityMuscleDraft: string;
  setSplitPriorityMuscleDraft: (value: string) => void;
  splitPriorityMuscleOptions: readonly string[];
  addSplitPriorityMuscle: () => void;
  removeSplitPriorityMuscle: (muscle: string) => void;
  splitEstimatedMaxes: {
    bench: number;
    squat: number;
    deadlift: number;
    overheadPress: number;
  };
  updateSplitEstimatedMax: (key: "bench" | "squat" | "deadlift" | "overheadPress", value: number) => void;
  autoGenerateSplitFromBuilder: () => void;
  addTrainingDay: (kind: string) => void;
  splitWeekPlanCards: SplitWeekPlanCard[];
  libraryTargetDayId: string;
  setLibraryTargetDayId: (dayId: string) => void;
  setLibraryTargetFromDay: (dayId: string) => void;
  trainingSurfaceIntent?: TrainingSurfaceIntent;
  libraryRecommendedExercises: ExerciseLibraryItem[];
  filteredExerciseLibrary: ExerciseLibraryItem[];
  exerciseProfiles: Record<string, ExerciseScientificProfile>;
  libraryRiskFlags: string[];
  librarySearch: string;
  setLibrarySearch: (value: string) => void;
  libraryCategory: string;
  setLibraryCategory: (value: string) => void;
  libraryCategoryOptions: string[];
  addExerciseFromLibraryToDay: (exerciseId: string) => void;
  getExerciseSubstitutions: (exercise: ExerciseLibraryItem) => ExerciseLibraryItem[];
  moveTrainingDay: (dayId: string, direction: number) => void;
  duplicateTrainingDay: (dayId: string) => void;
  removeTrainingDay: (dayId: string) => void;
  setTrackerTemplateDayId: (dayId: string) => void;
  splitSystemicByDay: SplitSystemicPoint[];
  splitMuscleFrequency: SplitMuscleFrequencyItem[];
  showAdvancedSplit: boolean;
  toggleAdvancedSplit: () => void;
  openAdvancedSplit: () => void;
  pushSplitDayToTracker: (dayId: string) => void;
  workoutSplit: WorkoutDay[];
  autofillDayByFocus: (dayId: string) => void;
  addExerciseToDay: (dayId: string) => void;
  updateWorkoutDay: (dayId: string, key: string, value: string | number) => void;
  exerciseLibrary: ExerciseLibraryItem[];
  updateWorkoutExercise: (dayId: string, index: number, key: string, value: string | number) => void;
  moveExerciseWithinDay: (dayId: string, index: number, direction: number) => void;
  duplicateExerciseWithinDay: (dayId: string, index: number) => void;
  deleteExerciseWithinDay: (dayId: string, index: number) => void;
};

const roundToNearestFive = (value: number) => Math.round(value / 5) * 5;

const TradeoffSlider = (props: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  const { leftLabel, rightLabel, value, onChange } = props;
  const dominantLabel = value >= 50 ? rightLabel : leftLabel;
  const dominantValue = value >= 50 ? value : 100 - value;

  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <span>{leftLabel}</span>
        <span className="text-slate-400">{"<->"}</span>
        <span>{rightLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 dark:bg-slate-700"
      />
      <div className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">{dominantLabel} bias {dominantValue}%</div>
    </label>
  );
};

export default function SplitTab(props: SplitTabProps) {
  const {
    userMode,
    canEditPlan,
    splitPrimaryAction,
    trainingSuggestion,
    splitPrioritySummary,
    applyTrainingSuggestion,
    goToTab,
    splitBuilderStats,
    weeklyDensityScore,
    adaptationCards,
    metricsTone,
    splitExecutionRisks,
    splitTemplateOptions,
    splitTemplate,
    applySplitTemplate,
    splitStrengthBias,
    setSplitStrengthBias,
    splitHypertrophyBias,
    setSplitHypertrophyBias,
    splitVolumeBias,
    setSplitVolumeBias,
    splitRecoveryBias,
    setSplitRecoveryBias,
    splitFrequencyBias,
    setSplitFrequencyBias,
    splitIntensityBias,
    setSplitIntensityBias,
    splitPriorityMuscles,
    splitPriorityMuscleDraft,
    setSplitPriorityMuscleDraft,
    splitPriorityMuscleOptions,
    addSplitPriorityMuscle,
    removeSplitPriorityMuscle,
    splitEstimatedMaxes,
    updateSplitEstimatedMax,
    autoGenerateSplitFromBuilder,
    addTrainingDay,
    splitWeekPlanCards,
    libraryTargetDayId,
    setLibraryTargetDayId,
    setLibraryTargetFromDay,
    trainingSurfaceIntent,
    libraryRecommendedExercises,
    filteredExerciseLibrary,
    exerciseProfiles,
    libraryRiskFlags,
    librarySearch,
    setLibrarySearch,
    libraryCategory,
    setLibraryCategory,
    libraryCategoryOptions,
    addExerciseFromLibraryToDay,
    getExerciseSubstitutions,
    moveTrainingDay,
    duplicateTrainingDay,
    removeTrainingDay,
    setTrackerTemplateDayId,
    splitSystemicByDay,
    splitMuscleFrequency,
    showAdvancedSplit,
    toggleAdvancedSplit,
    openAdvancedSplit,
    pushSplitDayToTracker,
    workoutSplit,
    autofillDayByFocus,
    addExerciseToDay,
    updateWorkoutDay,
    exerciseLibrary,
    updateWorkoutExercise,
    moveExerciseWithinDay,
    duplicateExerciseWithinDay,
    deleteExerciseWithinDay,
  } = props;
  const [showExerciseSupport, setShowExerciseSupport] = React.useState(false);
  const [showTrainingReview, setShowTrainingReview] = React.useState(userMode === "coach");
  const [showFullSessionDetail, setShowFullSessionDetail] = React.useState(userMode === "coach");
  const [pendingTrainingDayDeleteId, setPendingTrainingDayDeleteId] = React.useState<string | null>(null);
  const [pendingExerciseDeleteKey, setPendingExerciseDeleteKey] = React.useState<string | null>(null);
  const exerciseSupportRef = React.useRef<HTMLDivElement | null>(null);
  const dayBuilderRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setShowTrainingReview(userMode === "coach");
    setShowFullSessionDetail(userMode === "coach");
  }, [userMode]);

  const requestRemoveTrainingDay = (dayId: string) => {
    if (pendingTrainingDayDeleteId !== dayId) {
      setPendingTrainingDayDeleteId(dayId);
      return;
    }

    removeTrainingDay(dayId);
    setPendingTrainingDayDeleteId(null);
  };

  const requestDeleteExerciseWithinDay = (dayId: string, index: number) => {
    const deleteKey = `${dayId}:${index}`;
    if (pendingExerciseDeleteKey !== deleteKey) {
      setPendingExerciseDeleteKey(deleteKey);
      return;
    }

    deleteExerciseWithinDay(dayId, index);
    setPendingExerciseDeleteKey(null);
  };

  React.useEffect(() => {
    if (!trainingSurfaceIntent || trainingSurfaceIntent.nonce === 0) return;

    if (trainingSurfaceIntent.dayId) {
      setLibraryTargetDayId(trainingSurfaceIntent.dayId);
    }

    setShowExerciseSupport(true);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        exerciseSupportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [setLibraryTargetDayId, trainingSurfaceIntent?.dayId, trainingSurfaceIntent?.nonce]);

  const selectedSessionDay =
    workoutSplit.find((day) => day.id === libraryTargetDayId) ??
    workoutSplit.find((day) => day.focus.toLowerCase() !== "rest") ??
    workoutSplit[0];
  const visibleSessionExercises =
    selectedSessionDay && (showFullSessionDetail || userMode === "coach")
      ? selectedSessionDay.exercises
      : selectedSessionDay?.exercises.slice(0, 4) ?? [];
  const hiddenSessionExerciseCount = Math.max((selectedSessionDay?.exercises.length ?? 0) - visibleSessionExercises.length, 0);
  const inlineExerciseResults = filteredExerciseLibrary.slice(0, 6);
  const openInlineExerciseSupport = (dayId?: string) => {
    if (dayId) {
      setLibraryTargetDayId(dayId);
    }
    setShowExerciseSupport(true);
  };
  const openDayEditor = (dayId?: string) => {
    if (dayId) {
      setLibraryTargetDayId(dayId);
    }
    openAdvancedSplit();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        dayBuilderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };
  const progressionRows = [
    { key: "bench" as const, label: "Bench Press", e1rm: splitEstimatedMaxes.bench },
    { key: "squat" as const, label: "Squat", e1rm: splitEstimatedMaxes.squat },
    { key: "deadlift" as const, label: "Deadlift", e1rm: splitEstimatedMaxes.deadlift },
    { key: "overheadPress" as const, label: "Overhead Press", e1rm: splitEstimatedMaxes.overheadPress },
  ].map((row) => ({
    ...row,
    week1: roundToNearestFive(row.e1rm * 0.72),
    week2: roundToNearestFive(row.e1rm * 0.75),
    week3: roundToNearestFive(row.e1rm * 0.78),
    week4: roundToNearestFive(row.e1rm * 0.8),
  }));

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <div className="premium-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{canEditPlan ? "Self-managed" : "Coach-managed"}</Badge>
            <Badge variant="outline">
              {selectedSessionDay?.focus ?? "Session"}
            </Badge>
            <Badge variant="outline">
              {selectedSessionDay?.exercises.length ?? 0} exercises
            </Badge>
          </div>
          {showExerciseSupport ? (
            <Button variant="ghost" size="sm" onClick={() => setShowExerciseSupport(false)}>
              Hide support
            </Button>
          ) : null}
        </div>
      </div>

      {showTrainingReview ? (
        <SectionCard
          title="Adaptation read"
          right={userMode === "athlete" ? (
            <Button variant="outline" size="sm" onClick={() => setShowTrainingReview(false)}>
              Hide review
            </Button>
          ) : null}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {adaptationCards.map((item) => (
              <SignalTile
                key={`${item.label}-${item.title}`}
                label={item.label}
                title={item.title}
                detail={item.detail}
                tone={item.tone}
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Training review"
          right={(
            <Button variant="outline" size="sm" onClick={() => setShowTrainingReview(true)}>
              Show review
            </Button>
          )}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Adaptation</div>
              <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {adaptationCards[0]?.title ?? "Review ready"}
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Density</div>
              <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{weeklyDensityScore}</div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Risk</div>
              <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {splitExecutionRisks.length === 0 ? "No major risks" : `${splitExecutionRisks.length} flag${splitExecutionRisks.length === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title={userMode === "coach" ? "Weekly programming workflow" : "Today's session workflow"}
        >
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                  {userMode === "coach" ? "Primary action" : "Primary training cue"}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{splitPrimaryAction.title}</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{splitPrimaryAction.body}</p>
              </div>

              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button onClick={applyTrainingSuggestion}>{splitPrimaryAction.cta}</Button>
                <Button variant="outline" onClick={() => goToTab("tracker")}>Today</Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Weekly intent" : "Session intent"}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{trainingSuggestion}</div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Priority gap" : "Main gap"}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{splitPrioritySummary.topPriority}</div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Duplication pressure" : "Do not repeat"}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{splitPrioritySummary.duplication}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Days", value: splitBuilderStats.totalDays, helper: "Current split" },
                  { label: "Exercises", value: splitBuilderStats.totalExercises, helper: "All days" },
                  { label: "Avg sets", value: splitBuilderStats.averageSets, helper: "Per exercise" },
                  { label: "Density", value: weeklyDensityScore, helper: "Weekly load" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{item.label}</div>
                    <div className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">{item.value}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.helper}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Programming risks</div>
                <div className="mt-3 space-y-2">
                  {splitExecutionRisks.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">No major programming risks right now.</div>
                  ) : (
                    splitExecutionRisks.map((flag, index) => (
                      <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">{flag}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={userMode === "coach" ? "Split controls" : "Session controls"}
        >
          {canEditPlan ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Build your split</div>
                <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Set the training profile first, then let the generator clean up the week around it.
                </div>
                <div className="mt-4 grid gap-4">
                  <TradeoffSlider
                    leftLabel="Hypertrophy"
                    rightLabel="Strength"
                    value={splitStrengthBias}
                    onChange={(value) => {
                      setSplitStrengthBias(value);
                      setSplitHypertrophyBias(100 - value);
                    }}
                  />
                  <TradeoffSlider
                    leftLabel="Volume"
                    rightLabel="Recovery"
                    value={splitRecoveryBias}
                    onChange={(value) => {
                      setSplitRecoveryBias(value);
                      setSplitVolumeBias(100 - value);
                    }}
                  />
                  <TradeoffSlider
                    leftLabel="Frequency"
                    rightLabel="Intensity"
                    value={splitIntensityBias}
                    onChange={(value) => {
                      setSplitIntensityBias(value);
                      setSplitFrequencyBias(100 - value);
                    }}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Priority muscles</div>
                  <div className="flex flex-wrap gap-2">
                    {splitPriorityMuscles.map((muscle) => (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => removeSplitPriorityMuscle(muscle)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                      >
                        {muscle} x
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select className={inputClass} value={splitPriorityMuscleDraft} onChange={(event) => setSplitPriorityMuscleDraft(event.target.value)}>
                      {splitPriorityMuscleOptions.map((muscle) => (
                        <option key={muscle} value={muscle}>{muscle}</option>
                      ))}
                    </select>
                    <Button variant="outline" onClick={addSplitPriorityMuscle}>Add priority</Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {splitTemplateOptions.map((template) => (
                    <Button key={template.id} variant={splitTemplate === template.id ? "default" : "outline"} onClick={() => applySplitTemplate(template.id)}>
                      {template.label}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                  <Button onClick={autoGenerateSplitFromBuilder}>Rebuild week</Button>
                  <Button variant="outline" onClick={applyTrainingSuggestion}>Apply suggestion</Button>
                  <Button variant="outline" onClick={() => addTrainingDay("training")}>Add training day</Button>
                  <Button variant="outline" onClick={() => addTrainingDay("rest")}>Add rest day</Button>
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Optional load anchors</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Use estimated maxes only if you actually program from them. Otherwise this section can stay untouched.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {progressionRows.map((row) => (
                    <label key={row.key} className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</div>
                      <Input
                        type="number"
                        value={row.e1rm}
                        onChange={(event) => updateSplitEstimatedMax(row.key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/80 dark:bg-white/[0.04]">
                      <tr className="text-left text-slate-500">
                        <th className="px-3 py-2 font-medium">Lift</th>
                        <th className="px-3 py-2 font-medium">Week 1</th>
                        <th className="px-3 py-2 font-medium">Week 2</th>
                        <th className="px-3 py-2 font-medium">Week 3</th>
                        <th className="px-3 py-2 font-medium">Week 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressionRows.map((row) => (
                        <tr key={`${row.key}-projection`} className="border-t border-slate-200/80 dark:border-white/10">
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{row.label}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.week1}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.week2}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.week3}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.week4}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Editing rule</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Pick the day first. Then change only the exercise order, movement choice, or volume that actually needs fixing.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Athlete rule</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Confirm the day you are running, then execute it cleanly. If you are self-managed, change the session only when there is a real reason.
                </p>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button onClick={() => goToTab("tracker")}>Today</Button>
                <Button variant="outline" onClick={() => openInlineExerciseSupport()}>Exercise support</Button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          title={userMode === "coach" ? "Week structure" : "Session map"}
          description={userMode === "coach" ? "Pick the day here first. Then use the selected-session detail to inspect the actual lift order." : "Pick the day you are actually running, then inspect the full session underneath it."}
        >
          <div className="grid gap-3 xl:grid-cols-2">
            {splitWeekPlanCards.map((day) => (
              <div
                key={day.id}
                onClick={() => setLibraryTargetDayId(day.id)}
                className={[
                  "cursor-pointer rounded-[22px] border p-4 transition hover:-translate-y-[1px] hover:shadow-md dark:border-white/10 dark:bg-white/5",
                  day.id === selectedSessionDay?.id
                    ? "border-slate-900/15 bg-sky-50"
                    : "border-slate-200 bg-slate-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{day.day}</div>
                    <div className="mt-1 text-sm text-slate-500">{day.focus}</div>
                  </div>
                  <Badge className={day.isRest ? "border-slate-200 bg-slate-100 text-slate-700" : metricsTone(day.systemicLoad)}>
                    {day.isRest ? "Rest" : `${day.sets} sets`}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>{day.exercises} exercises</div>
                  <div>Intensity {day.intensity}</div>
                  <div>Volume {day.volume}</div>
                  <div>Systemic {day.systemicLoad}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canEditPlan ? (
                    <>
                      <Button size="sm" onClick={(event) => { event.stopPropagation(); setLibraryTargetDayId(day.id); }}>Select</Button>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); pushSplitDayToTracker(day.id); }}>Push to tracker</Button>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); openInlineExerciseSupport(day.id); }}>Change exercises</Button>
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); openDayEditor(day.id); }}>Open editor</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => setLibraryTargetDayId(day.id)}>Select</Button>
                      <Button size="sm" variant="outline" onClick={() => setTrackerTemplateDayId(day.id)}>Set for today</Button>
                      <Button size="sm" variant="outline" onClick={() => openInlineExerciseSupport(day.id)}>Exercise support</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={selectedSessionDay ? `${selectedSessionDay.day} detail` : "Selected session"}
          description={
            selectedSessionDay
              ? canEditPlan
                ? `${selectedSessionDay.focus} day. Review the lift order here, then open the editor only if the day actually needs a change.`
                : `${selectedSessionDay.focus} session with the planned lift order visible.`
              : "Pick a day from the session map first."
          }
        >
          {selectedSessionDay ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <AnalyticsStat label="Focus" value={selectedSessionDay.focus} helper={selectedSessionDay.day} tone={metricsTone(Number(selectedSessionDay.systemicLoad ?? 0))} />
                <AnalyticsStat label="Exercises" value={selectedSessionDay.exercises.length} helper={`${selectedSessionDay.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} total sets`} tone={metricsTone(6)} />
                <AnalyticsStat label="Systemic" value={selectedSessionDay.systemicLoad} helper={`Intensity ${selectedSessionDay.intensity}, volume ${selectedSessionDay.volume}`} tone={metricsTone(Number(selectedSessionDay.systemicLoad ?? 0))} />
              </div>

              {canEditPlan ? (
                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Button size="sm" onClick={() => pushSplitDayToTracker(selectedSessionDay.id)}>Push to tracker</Button>
                  <Button size="sm" variant="outline" onClick={() => openInlineExerciseSupport(selectedSessionDay.id)}>Change exercises</Button>
                  <Button size="sm" variant="outline" onClick={() => openDayEditor(selectedSessionDay.id)}>Open day editor</Button>
                </div>
              ) : null}

              <div className="space-y-3">
                {visibleSessionExercises.map((exercise, index) => {
                  const lib = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
                  return (
                    <div key={`${selectedSessionDay.id}-${index}-${exercise.exerciseId}`} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{index + 1}. {lib?.name ?? exercise.exerciseId}</div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{exercise.sets} sets - {exercise.repRange} - RIR {exercise.rir}</div>
                        </div>
                        <Badge variant="outline">{lib?.category ?? selectedSessionDay.focus}</Badge>
                      </div>
                      {exercise.note ? (
                        <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{exercise.note}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {hiddenSessionExerciseCount > 0 || (userMode === "athlete" && showFullSessionDetail) ? (
                <div className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {hiddenSessionExerciseCount > 0
                        ? `${hiddenSessionExerciseCount} more lift${hiddenSessionExerciseCount === 1 ? "" : "s"} are tucked away for faster scanning.`
                        : "Full lift order is visible."}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullSessionDetail((prev) => !prev)}
                    >
                      {showFullSessionDetail ? "Show compact" : "Show full order"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyStatePanel title="No session selected" detail="Pick a day from the session map first so the full lift order appears here." />
          )}
        </SectionCard>
      </div>

      {showExerciseSupport ? (
        <div ref={exerciseSupportRef}>
          <SectionCard
            title="Exercise support"
            description={
              selectedSessionDay
                ? `Solve the next exercise slot inside ${selectedSessionDay.day}, ${selectedSessionDay.focus}.`
                : "Pick a session first, then add the cleanest matching movement."
            }
            right={userMode === "coach" ? (
              <Button variant="outline" size="sm" onClick={() => selectedSessionDay ? setLibraryTargetFromDay(selectedSessionDay.id) : goToTab("library")}>
                Full browser
              </Button>
            ) : null}
          >
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search exercises"
                />
                <select
                  className={inputClass}
                  value={libraryCategory}
                  onChange={(event) => setLibraryCategory(event.target.value)}
                >
                  {libraryCategoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <Badge variant="outline">{filteredExerciseLibrary.length} matches</Badge>
            </div>

            {libraryRiskFlags.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {libraryRiskFlags.slice(0, 2).map((flag, index) => (
                  <div key={`${flag}-${index}`} className="rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">
                    {flag}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recommended adds</div>
                <div className="mt-3 space-y-3">
                  {libraryRecommendedExercises.length === 0 ? (
                    <EmptyStatePanel
                      title="No recommended adds yet"
                      detail="Adjust the target day or filters to surface better movement fits."
                    />
                  ) : (
                    libraryRecommendedExercises.slice(0, 4).map((exercise) => {
                      const profile = exerciseProfiles[exercise.id];
                      return (
                        <div key={exercise.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{exercise.name}</div>
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {exercise.category}, {profile?.movementPatternLabel ?? "movement profile pending"}
                              </div>
                            </div>
                            <Badge variant="outline">{profile?.recoveryDemand ?? "moderate"}</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => addExerciseFromLibraryToDay(exercise.id)}>
                              Add to {selectedSessionDay?.day ?? "session"}
                            </Button>
                            {getExerciseSubstitutions(exercise).slice(0, 2).map((option) => (
                              <Button key={option.id} size="sm" variant="outline" onClick={() => addExerciseFromLibraryToDay(option.id)}>
                                {option.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick browser</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {inlineExerciseResults.map((exercise) => {
                    const profile = exerciseProfiles[exercise.id];
                    const ratio = Number((Number(exercise.stimulus ?? 0) / Math.max(Number(exercise.fatigue ?? 1), 1)).toFixed(2));
                    return (
                      <div key={exercise.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{exercise.name}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {profile?.movementPatternLabel ?? exercise.category}
                            </div>
                          </div>
                          <Badge variant="outline">S:F {ratio}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(exercise.muscleBias ?? []).slice(0, 2).map((bias, index) => (
                            <Badge key={`${exercise.id}-${index}`} variant="secondary">{bias.muscle}</Badge>
                          ))}
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="outline" onClick={() => addExerciseFromLibraryToDay(exercise.id)}>
                            Add exercise
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </SectionCard>
        </div>
      ) : null}

      {showTrainingReview ? (
        <SectionCard
          title={userMode === "coach" ? "Weekly load and frequency" : "Session support"}
          description={userMode === "coach" ? "See weekly pressure and which regions are actually getting hit." : "Use this to confirm the week is sensible, not to redesign the whole split every time."}
        >
          <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Systemic load by day</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Session pressure across the week.</div>
                </div>
                <Badge variant="outline">Density {weeklyDensityScore}</Badge>
              </div>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={splitSystemicByDay} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="splitSystemicFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartPalette.split.barStart} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={chartPalette.split.barEnd} stopOpacity={0.82} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis dataKey="day" {...chartAxisProps} />
                    <YAxis width={32} {...chartAxisProps} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(250,204,21,0.08)" }} />
                    <Bar dataKey="systemic" radius={[12, 12, 4, 4]} fill="url(#splitSystemicFill)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Muscle frequency</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Most-hit regions this week.</div>
              <div className="mt-4 space-y-3">
                {splitMuscleFrequency.map((item) => (
                  <div key={item.muscle} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.muscle}</span>
                      <Badge variant="outline">{item.frequency}x / week</Badge>
                    </div>
                    <Progress value={Math.min(100, item.frequency * 20)} className="mt-3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {canEditPlan ? (
        <div ref={dayBuilderRef}>
          <AdvancedEditorCard
            title={selectedSessionDay ? `${selectedSessionDay.day} editor` : userMode === "coach" ? "Training editor" : "Session editor"}
            description="Edit the selected day, swap exercises, and push the updated day into the tracker from one place."
            open={showAdvancedSplit}
            onToggle={toggleAdvancedSplit}
            summary={selectedSessionDay ? `${selectedSessionDay.focus}, ${selectedSessionDay.exercises.length} exercises` : `${workoutSplit.length} days loaded`}
          >
            {selectedSessionDay ? (
              <div className="space-y-4">
                <div className={[softPanelClass, panelHoverClass, "space-y-4 rounded-[24px] p-4"].join(" ")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{selectedSessionDay.day}</Badge>
                      <Badge className={metricsTone(selectedSessionDay.systemicLoad)}>{selectedSessionDay.focus}</Badge>
                      <Badge variant="outline">{selectedSessionDay.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} sets</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => pushSplitDayToTracker(selectedSessionDay.id)}>Push to tracker</Button>
                      <Button size="sm" variant="outline" onClick={() => autofillDayByFocus(selectedSessionDay.id)}>Autofill</Button>
                      <Button size="sm" onClick={() => addExerciseToDay(selectedSessionDay.id)}>Add exercise</Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openInlineExerciseSupport(selectedSessionDay.id)}>Exercise support</Button>
                    <Button size="sm" variant="outline" onClick={() => moveTrainingDay(selectedSessionDay.id, -1)}>Move up</Button>
                    <Button size="sm" variant="outline" onClick={() => moveTrainingDay(selectedSessionDay.id, 1)}>Move down</Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateTrainingDay(selectedSessionDay.id)}>Duplicate day</Button>
                    <Button
                      size="sm"
                      variant={pendingTrainingDayDeleteId === selectedSessionDay.id ? "outline" : "ghost"}
                      onClick={() => requestRemoveTrainingDay(selectedSessionDay.id)}
                    >
                      {pendingTrainingDayDeleteId === selectedSessionDay.id ? "Confirm delete" : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr_0.9fr_0.9fr]">
                    <div className="space-y-1">
                      <Label>Day label</Label>
                      <Input value={selectedSessionDay.day} onChange={(event) => updateWorkoutDay(selectedSessionDay.id, "day", event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Focus</Label>
                      <Input value={selectedSessionDay.focus} onChange={(event) => updateWorkoutDay(selectedSessionDay.id, "focus", event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Intensity</Label>
                      <Input type="number" value={selectedSessionDay.intensity} onChange={(event) => updateWorkoutDay(selectedSessionDay.id, "intensity", Number(event.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Volume</Label>
                      <Input type="number" value={selectedSessionDay.volume} onChange={(event) => updateWorkoutDay(selectedSessionDay.id, "volume", Number(event.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Systemic load</Label>
                      <Input type="number" value={selectedSessionDay.systemicLoad} onChange={(event) => updateWorkoutDay(selectedSessionDay.id, "systemicLoad", Number(event.target.value))} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedSessionDay.exercises.map((exercise, index) => {
                      const lib = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
                      const quickSwaps = lib ? getExerciseSubstitutions(lib).filter((option) => option.id !== exercise.exerciseId).slice(0, 2) : [];

                      return (
                        <div key={`${selectedSessionDay.id}-${index}-${exercise.exerciseId}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="grid gap-3 xl:grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr_1fr_auto]">
                            <div className="space-y-1">
                              <Label>Exercise</Label>
                              <select className={inputClass} value={exercise.exerciseId} onChange={(event) => updateWorkoutExercise(selectedSessionDay.id, index, "exerciseId", event.target.value)}>
                                {exerciseLibrary.map((item) => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label>Sets</Label>
                              <Input type="number" value={exercise.sets} onChange={(event) => updateWorkoutExercise(selectedSessionDay.id, index, "sets", Number(event.target.value))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Rep range</Label>
                              <Input value={exercise.repRange} onChange={(event) => updateWorkoutExercise(selectedSessionDay.id, index, "repRange", event.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label>RIR</Label>
                              <Input type="number" value={exercise.rir} onChange={(event) => updateWorkoutExercise(selectedSessionDay.id, index, "rir", Number(event.target.value))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Slot note</Label>
                              <Input value={exercise.note} onChange={(event) => updateWorkoutExercise(selectedSessionDay.id, index, "note", event.target.value)} placeholder={lib?.category ?? "Note"} />
                            </div>
                            <div className="flex flex-wrap items-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => moveExerciseWithinDay(selectedSessionDay.id, index, -1)}>Up</Button>
                              <Button size="sm" variant="outline" onClick={() => moveExerciseWithinDay(selectedSessionDay.id, index, 1)}>Down</Button>
                              <Button size="sm" variant="outline" onClick={() => duplicateExerciseWithinDay(selectedSessionDay.id, index)}>Copy</Button>
                              <Button
                                size="sm"
                                variant={pendingExerciseDeleteKey === `${selectedSessionDay.id}:${index}` ? "outline" : "ghost"}
                                onClick={() => requestDeleteExerciseWithinDay(selectedSessionDay.id, index)}
                              >
                                {pendingExerciseDeleteKey === `${selectedSessionDay.id}:${index}` ? "Confirm" : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          {lib ? (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>Category: {lib.category}</span>
                              <span>Fatigue: {lib.fatigue ?? 0}</span>
                              <span>Systemic: {lib.systemicFatigue ?? 0}</span>
                            </div>
                          ) : null}
                          {quickSwaps.length > 0 ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium uppercase tracking-[0.06em] text-slate-500">Quick swap</span>
                              {quickSwaps.map((option) => (
                                <Button key={`${selectedSessionDay.id}-${index}-${option.id}`} size="sm" variant="outline" onClick={() => updateWorkoutExercise(selectedSessionDay.id, index, "exerciseId", option.id)}>
                                  {option.name}
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyStatePanel title="No day selected" detail="Pick a day from the session map first so the editor opens on the correct workout." />
            )}
          </AdvancedEditorCard>
        </div>
      ) : null}
    </div>
  );
}
