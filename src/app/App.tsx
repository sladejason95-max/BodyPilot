import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  Gauge,
  History,
  Home,
  Minus,
  Moon,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  Shuffle,
  SkipForward,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { WorkoutSetRow } from "@/components/training/WorkoutSetRow";
import {
  MesocycleBuilder,
  type MesocycleBuilderDraft,
  type MesocyclePreview,
} from "@/components/training/MesocycleBuilder";
import {
  RecoveryCheckinCard,
  type RecoveryCheckinDraft,
} from "@/components/training/RecoveryCheckinCard";
import { lookupFoodBarcode, searchFoodDatabase, searchLocalFoodDatabase } from "./food_connector";
import { exerciseLibrary } from "@/lib/data/exerciseLibrary";
import {
  inferExerciseEquipment,
  inferExerciseMovementPattern,
  rankExerciseSubstitutions,
  type ExerciseSubstitutionCandidate,
} from "@/lib/exerciseSubstitution";
import {
  feedbackSetDelta,
  guardRecommendationForRecovery,
  guardRecommendationForExercisePain,
  previousSetForRecommendation,
  resolveExerciseLoadIncrement,
  recommendationForSet,
  targetRirForWeek,
  workoutLiftLogKey,
  workoutSessionKey,
  type SetRecommendation,
} from "./hypertrophy_engine";
import {
  mergeHistoryWithoutDuplicates,
  migrateLegacyTrackerDays,
  migrateLegacyWorkoutSplit,
} from "./training_migration";
import {
  buildTrainingAnalytics as buildDetailedTrainingAnalytics,
  type TrainingAnalyticsFilter,
} from "./training_analytics";
import {
  addWorkoutExercise as addSessionWorkoutExercise,
  addWorkoutSet as addSessionWorkoutSet,
  completeWorkoutSetFromDraft,
  finishWorkoutSession,
  migrateLegacyWorkoutSession,
  moveWorkoutExercise as moveSessionWorkoutExercise,
  normalizeWorkoutSession,
  pauseWorkoutSession,
  removeWorkoutSet as removeSessionWorkoutSet,
  replaceWorkoutExercise as replaceSessionWorkoutExercise,
  resumeWorkoutSession,
  sessionSetLogsForExercise,
  skipWorkoutSet as skipSessionWorkoutSet,
  updateWorkoutSet as updateSessionWorkoutSet,
  upsertSessionFeedback,
  validateWorkoutSessionCompletion,
  workoutSetDraft,
  type WorkoutSession,
} from "./workout_session";
import {
  buildWorkoutOccurrences,
  creditMesocycleCompletion,
  isWorkoutDate,
  moveWorkoutOccurrence,
  selectNextWorkoutOccurrence,
  undoWorkoutOccurrenceMove,
  workoutWeekStartDate,
  type WorkoutMoveUndo,
  type WorkoutOccurrence,
} from "./workout_schedule";
import {
  cancelRestTimerNotification,
  scheduleRestTimerNotification,
  shouldCancelPendingRestTimerNotification,
} from "./rest_timer_notifications";
import { equipmentAllowsExercise } from "./builder_equipment";
import { constrainSplitDuration, estimatedSplitSessionMinutes } from "./split_constraints";
import { clearExercisePainFlags, exerciseHistoryMatches, exercisePermitsZeroLoad, exercisePreferenceKey, hasExercisePainFlag, normalizeExerciseLoadIncrements, preserveExercisePainOnRename, recordExercisePainFlag } from "./exercise_training_preferences";
import { NutritionDiaryView } from "@/components/nutrition/NutritionDiaryView";
import { foodDiaryDateKey, foodDiaryTotals, normalizeFoodDiary, type FoodDiaryEntry } from "./food_diary";
import { normalizeSavedFoodMeals, type SavedFoodMeal } from "./food_meals";
import { createWeightMacroSettings } from "./weight_macro_engine";
import { acceptedTrackerTarget, buildTrackerProposal, decideTrackerProposal, foodDaySignature, normalizeTrackerProgram, trackerFoodDayComplete, type WeightMacroProgram, type TrackerContext } from "./weight_macro_program";
import { WeightMacroTrackerPanel } from "./components/WeightMacroTrackerPanel";
import { createQueuedStatePersistence, type StateLockManager, type TransactionalStateWriteResult } from "./transactional_state_persistence";
import { backupNormalizationChanges, validateBackupState, type BackupState } from "./local_backup";
import { loadAppStateSafely } from "./app_state_storage";
import { BackupRestorePanel } from "@/components/shared/BackupRestorePanel";
import { normalizeCompletedMesocycleIds, normalizeWorkoutDateOverrides, type WorkoutDateOverrides } from "./workout_schedule";
import {
  bodyweightLocalDateKey,
  mergeBodyweightHistory,
  migrateLegacyTrackerBodyweights,
  normalizeBodyweightHistory,
  summarizeBodyweightHistory,
  upsertBodyweightForLocalDay,
  type BodyweightHistoryEntry,
} from "./bodyweight_history";
import type { FoodCatalogItem, FoodNutrients } from "./types";
import { BODY_PILOT_BRAND, BodyPilotLogo } from "./brand";

type ViewId = "home" | "today" | "food" | "training" | "more";
type Goal = "fat-loss" | "muscle-gain" | "recomposition" | "performance";
type Sex = "male" | "female";
type Theme = "light" | "dark";
type MuscleGroup = "chest" | "back" | "quads" | "hamstrings" | "shoulders" | "arms" | "glutes" | "core";
type MusclePriority = "specialize" | "emphasize" | "grow" | "maintain" | "minimum" | "exclude";
type EquipmentProfile = "full-gym" | "home-gym" | "dumbbells";
type MesoTemplateId = "balanced" | "upper" | "arms-shoulders" | "lower" | "chest-back" | "timesaver";
type FeedbackLimitation = "target" | "supporting" | "conditioning" | "joint" | "focus";
type VolumeAdjustment = "auto" | "add" | "hold";
type WeekdayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type ScheduleItemType = "workout" | "meal" | "supplement" | "medication" | "cardio" | "habit";

type WorkoutLift = {
  id: string;
  exerciseId?: string;
  name: string;
  muscleGroup: MuscleGroup;
  pattern: string;
  target?: string;
  sets: number;
  reps: string;
  progressionKey?: string;
  replacedFrom?: string;
};

type SplitDay = {
  id: string;
  day: string;
  focus: string;
  intent: string;
  lifts: WorkoutLift[];
};

type ProductLogEntry = {
  id: string;
  label: string;
  brand?: string;
  barcode?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutrients?: FoodNutrients;
};

type WorkoutSetLog = {
  id: string;
  weight: number;
  reps: number;
  rir: number;
  done: boolean;
  skipped?: boolean;
};

type MuscleFeedback = {
  stimulus: number;
  pump: number;
  soreness: number;
  workload: number;
  technique: number;
  limitation: FeedbackLimitation;
  jointPain: number;
  moreSets: boolean;
  volumeAdjustment: VolumeAdjustment;
};

type RecoveryCheckin = {
  id: string;
  sessionKey: string;
  muscleGroup: MuscleGroup;
  checkedAt: string;
  soreness: number;
  readiness: number;
  jointPain: number;
  performanceExpectation: "below" | "steady" | "above";
  skipped?: boolean;
};

type RestTimerState = {
  sessionKey: string;
  liftId: string;
  setId: string;
  startedAt: number;
  endsAt: number;
  durationSec: number;
  pausedRemainingSec?: number;
};

type WorkoutHistorySet = {
  weight: number;
  reps: number;
  rir: number;
  skipped?: boolean;
};

type WorkoutHistoryEntry = {
  id: string;
  completedAt: string;
  mesocycleId: string;
  weekNumber: number;
  sessionKey: string;
  dayId: string;
  dayFocus: string;
  liftId: string;
  exerciseId?: string;
  liftName: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutHistorySet[];
  topSet: WorkoutHistorySet | null;
  estimatedOneRepMax: number;
  totalVolume: number;
  sessionStartedAt?: string;
  durationSec?: number;
};

type MesoTemplate = {
  id: MesoTemplateId;
  label: string;
  sessions: number;
  priorities: Record<MuscleGroup, MusclePriority>;
};

type ScheduleItem = {
  id: string;
  day: WeekdayId;
  time: string;
  type: ScheduleItemType;
  title: string;
  detail?: string;
  linkedDayId?: string;
};

type AppState = {
  schemaVersion: 4;
  theme: Theme;
  goal: Goal;
  sex: Sex;
  age: number;
  heightIn: number;
  bodyWeightLb: number;
  bodyWeightHistory: BodyweightHistoryEntry[];
  trackerProgram: WeightMacroProgram | null;
  targetWeightLb: number;
  sessionsPerWeek: number;
  sessionMinutes: number;
  steps: number;
  sleepHours: number;
  energy: number;
  soreness: number;
  foodLog: FoodDiaryEntry[];
  foodDiaryVersion: 1;
  savedFoodMeals: SavedFoodMeal[];
  legacyNutritionTotals?: { calories: number; protein: number; carbs: number; fat: number };
  workoutLog: Record<string, WorkoutSetLog[]>;
  workoutSessions: Record<string, WorkoutSession>;
  workoutHistory: WorkoutHistoryEntry[];
  recoveryCheckins: Record<string, RecoveryCheckin>;
  restTimer: RestTimerState | null;
  workoutPaused: boolean;
  activeDayId: string | null;
  skippedWorkouts: Record<string, boolean>;
  workoutDateOverrides: WorkoutDateOverrides;
  scheduleItems: ScheduleItem[];
  scheduleCheckoffs: Record<string, boolean>;
  selectedScheduleDay: WeekdayId;
  availableTrainingDays: WeekdayId[];
  favoriteExercises: string[];
  restrictedExercises: string[];
  painFreeExercises: string[];
  painfulExercises: string[];
  customExercises: ExerciseOption[];
  mesoPaused: boolean;
  completedMesoCount: number;
  completedMesoIds: string[];
  mesocycleId: string;
  mesoStartedAt: string;
  lastMesoCompletedAt: string | null;
  currentWeek: number;
  mesoLengthWeeks: number;
  deloadMode: boolean;
  equipment: EquipmentProfile;
  weightIncrement: number;
  exerciseLoadIncrements: Record<string, number>;
  activeTemplate: MesoTemplateId;
  musclePriorities: Record<MuscleGroup, MusclePriority>;
  muscleFeedback: Record<MuscleGroup, MuscleFeedback>;
  customSplit: SplitDay[] | null;
};

type MacroPlan = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFats: number;
};

type Suggestion = {
  id: string;
  label: string;
  title: string;
  detail: string;
  action: string;
  view: ViewId;
  tone: "cyan" | "emerald" | "amber" | "rose" | "violet";
  Icon: React.ComponentType<{ className?: string }>;
};

type SplitModel = {
  name: string;
  summary: string;
  days: SplitDay[];
};

type PlanModel = {
  readiness: number | null;
  recoveryEvidenceCount: number;
  maintenanceCalories: number;
  macros: MacroPlan;
  baseSplit: SplitModel;
  split: SplitModel;
  primarySuggestion: Suggestion;
  suggestions: Suggestion[];
  weeklyCardioMinutes: number;
  stepTarget: number;
  trainingLoad: string;
  targetRir: number;
  isDeload: boolean;
  weeklySetTargets: Record<MuscleGroup, number>;
};

type ReplacementTarget = {
  dayId: string;
  liftId: string;
};

type ExerciseOption = {
  name: string;
  muscleGroup: MuscleGroup;
  pattern: string;
  target?: string;
  equipment?: EquipmentProfile[];
  favorite?: boolean;
  jointFriendly?: boolean;
};

type ReplacementCandidate = ExerciseSubstitutionCandidate & {
  id: string;
  name: string;
  muscleGroup?: MuscleGroup;
  pattern?: string;
  target?: string;
  note?: string;
};

type WeekOverview = {
  week: number;
  targetRir: number;
  completed: number;
  skipped: number;
  planned: number;
  status: "done" | "current" | "planned" | "deload";
};

type FoodNutrientTarget = {
  id: keyof FoodNutrients;
  label: string;
  unit: string;
  target: number;
  precision?: number;
  limit?: boolean;
};

const STORAGE_KEY = "bodypilot-ai-v4";
const LEGACY_STORAGE_KEYS = ["bodypilot-ai-v3", "bodypilot-ai-v2", "bodypilot-ai-v1", "bodypilot-v1", "stage-prep-elite-v2"];

const weekdayOptions: Array<{ value: WeekdayId; label: string; short: string }> = [
  { value: "mon", label: "Monday", short: "Mon" },
  { value: "tue", label: "Tuesday", short: "Tue" },
  { value: "wed", label: "Wednesday", short: "Wed" },
  { value: "thu", label: "Thursday", short: "Thu" },
  { value: "fri", label: "Friday", short: "Fri" },
  { value: "sat", label: "Saturday", short: "Sat" },
  { value: "sun", label: "Sunday", short: "Sun" },
];

const scheduleTypeOptions: Array<{ value: ScheduleItemType; label: string }> = [
  { value: "workout", label: "Workout" },
  { value: "meal", label: "Meal" },
  { value: "supplement", label: "Supplement" },
  { value: "medication", label: "Medication" },
  { value: "cardio", label: "Cardio" },
  { value: "habit", label: "Habit" },
];

const scheduleTypeLabels = scheduleTypeOptions.reduce<Record<ScheduleItemType, string>>(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {
    workout: "Workout",
    meal: "Meal",
    supplement: "Supplement",
    medication: "Medication",
    cardio: "Cardio",
    habit: "Habit",
  }
);

const isWeekdayId = (value: unknown): value is WeekdayId =>
  weekdayOptions.some((option) => option.value === value);

const isScheduleItemType = (value: unknown): value is ScheduleItemType =>
  scheduleTypeOptions.some((option) => option.value === value);

function splitScheduleItemId(dayId: string) {
  return `schedule-split-workout-${dayId}`;
}

function isGeneratedSplitScheduleItem(item: ScheduleItem, splitDays: SplitDay[]) {
  return (
    item.type === "workout" &&
    (item.id.startsWith("schedule-split-workout-") ||
      splitDays.some((day) => item.id === `schedule-workout-${day.id}`))
  );
}

const defaultScheduleItems: ScheduleItem[] = [
  { id: splitScheduleItemId("push"), day: "mon", time: "17:30", type: "workout", title: "Push", detail: "Chest, shoulders, arms", linkedDayId: "push" },
  { id: splitScheduleItemId("pull"), day: "tue", time: "17:30", type: "workout", title: "Pull", detail: "Back, shoulders, arms", linkedDayId: "pull" },
  { id: splitScheduleItemId("legs"), day: "wed", time: "17:30", type: "workout", title: "Legs", detail: "Quads, hamstrings", linkedDayId: "legs" },
  { id: splitScheduleItemId("upper"), day: "fri", time: "17:30", type: "workout", title: "Upper", detail: "Upper", linkedDayId: "upper" },
  { id: splitScheduleItemId("lower"), day: "sat", time: "11:00", type: "workout", title: "Lower", detail: "Lower", linkedDayId: "lower" },
  { id: "schedule-meal-breakfast", day: "mon", time: "08:00", type: "meal", title: "Meal 1", detail: "Log breakfast" },
  { id: "schedule-supp-creatine", day: "mon", time: "09:00", type: "supplement", title: "Creatine", detail: "5g" },
  { id: "schedule-meal-pre", day: "mon", time: "15:30", type: "meal", title: "Pre-workout meal", detail: "Protein + carbs" },
];

const scheduleTypeIcons: Record<ScheduleItemType, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  meal: Utensils,
  supplement: Zap,
  medication: Target,
  cardio: Footprints,
  habit: CheckCircle2,
};

const scheduleTypeTone: Record<ScheduleItemType, string> = {
  workout: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100",
  meal: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-100",
  supplement: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/12 dark:text-sky-100",
  medication: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/30 dark:bg-violet-400/12 dark:text-violet-100",
  cardio: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/12 dark:text-amber-100",
  habit: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-200",
};

const defaultMusclePriorities: Record<MuscleGroup, MusclePriority> = {
  chest: "grow",
  back: "grow",
  quads: "grow",
  hamstrings: "grow",
  shoulders: "grow",
  arms: "grow",
  glutes: "grow",
  core: "maintain",
};

const createDefaultMuscleFeedback = (): Record<MuscleGroup, MuscleFeedback> => ({
  chest: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  back: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  quads: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  hamstrings: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  shoulders: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  arms: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  glutes: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
  core: { stimulus: 2, pump: 2, soreness: 1, workload: 2, technique: 2, limitation: "target", jointPain: 0, moreSets: false, volumeAdjustment: "auto" },
});

const mesocycleIdForStart = (startedAt: string) => `meso-${startedAt.replace(/[^a-z0-9]/gi, "")}`;
const defaultMesoStartedAt = new Date().toISOString();

export const defaultState: AppState = {
  schemaVersion: 4,
  theme: "dark",
  goal: "recomposition",
  sex: "male",
  age: 32,
  heightIn: 70,
  bodyWeightLb: 185,
  bodyWeightHistory: [],
  trackerProgram: null,
  targetWeightLb: 178,
  sessionsPerWeek: 5,
  sessionMinutes: 60,
  steps: 8200,
  sleepHours: 7.1,
  energy: 7,
  soreness: 4,
  foodLog: [],
  foodDiaryVersion: 1,
  savedFoodMeals: [],
  workoutLog: {},
  workoutSessions: {},
  workoutHistory: [],
  recoveryCheckins: {},
  restTimer: null,
  workoutPaused: false,
  activeDayId: null,
  skippedWorkouts: {},
  workoutDateOverrides: {},
  scheduleItems: defaultScheduleItems.map((item) => ({ ...item })),
  scheduleCheckoffs: {},
  selectedScheduleDay: "mon",
  availableTrainingDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  favoriteExercises: [],
  restrictedExercises: [],
  painFreeExercises: [],
  painfulExercises: [],
  customExercises: [],
  mesoPaused: false,
  completedMesoCount: 0,
  completedMesoIds: [],
  mesocycleId: mesocycleIdForStart(defaultMesoStartedAt),
  mesoStartedAt: defaultMesoStartedAt,
  lastMesoCompletedAt: null,
  currentWeek: 1,
  mesoLengthWeeks: 5,
  deloadMode: false,
  equipment: "full-gym",
  weightIncrement: 5,
  exerciseLoadIncrements: {},
  activeTemplate: "balanced",
  musclePriorities: { ...defaultMusclePriorities },
  muscleFeedback: createDefaultMuscleFeedback(),
  customSplit: null,
};

const goals: Record<Goal, { label: string; helper: string; calorieShift: number; proteinPerLb: number }> = {
  "fat-loss": {
    label: "Fat loss",
    helper: "-450 calories from maintenance.",
    calorieShift: -450,
    proteinPerLb: 1,
  },
  "muscle-gain": {
    label: "Muscle gain",
    helper: "+260 calories over maintenance.",
    calorieShift: 260,
    proteinPerLb: 0.9,
  },
  recomposition: {
    label: "Recomposition",
    helper: "-140 calories from maintenance.",
    calorieShift: -140,
    proteinPerLb: 0.95,
  },
  performance: {
    label: "Performance",
    helper: "+80 calories over maintenance.",
    calorieShift: 80,
    proteinPerLb: 0.82,
  },
};

const goalOptions: Array<{ value: Goal; label: string }> = [
  { value: "recomposition", label: "Recomposition" },
  { value: "fat-loss", label: "Fat loss" },
  { value: "muscle-gain", label: "Muscle gain" },
  { value: "performance", label: "Performance" },
];

const isGoal = (value: unknown): value is Goal => goalOptions.some((option) => option.value === value);
const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";
const isSex = (value: unknown): value is Sex => value === "male" || value === "female";

const viewItems: Array<{ id: ViewId; label: string; helper: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: "home", label: "Home", helper: "Plan summary", Icon: Home },
  { id: "today", label: "Today", helper: "Workout and logs", Icon: CheckCircle2 },
  { id: "food", label: "Food", helper: "Macros", Icon: Utensils },
  { id: "training", label: "Training", helper: "Split builder", Icon: Dumbbell },
  { id: "more", label: "More", helper: "Schedule + profile", Icon: MoreHorizontal },
];

const exerciseCatalog: ExerciseOption[] = [
  { name: "Barbell bench press", muscleGroup: "chest", pattern: "Horizontal press", target: "mid chest" },
  { name: "Dumbbell bench press", muscleGroup: "chest", pattern: "Horizontal press", target: "mid chest" },
  { name: "Smith machine bench press", muscleGroup: "chest", pattern: "Horizontal press", target: "mid chest" },
  { name: "Machine chest press", muscleGroup: "chest", pattern: "Stable press", target: "mid chest" },
  { name: "Plate-loaded chest press", muscleGroup: "chest", pattern: "Stable press", target: "mid chest" },
  { name: "Push-up", muscleGroup: "chest", pattern: "Bodyweight press", target: "mid chest", equipment: ["home-gym"] },
  { name: "Deficit push-up", muscleGroup: "chest", pattern: "Bodyweight press", target: "mid chest", equipment: ["home-gym"] },
  { name: "Incline dumbbell press", muscleGroup: "chest", pattern: "Incline press", target: "upper chest" },
  { name: "Incline barbell press", muscleGroup: "chest", pattern: "Incline press", target: "upper chest" },
  { name: "Incline machine press", muscleGroup: "chest", pattern: "Incline press", target: "upper chest" },
  { name: "Smith machine incline press", muscleGroup: "chest", pattern: "Incline press", target: "upper chest" },
  { name: "Low-to-high cable fly", muscleGroup: "chest", pattern: "Adduction", target: "upper chest" },
  { name: "Cable fly", muscleGroup: "chest", pattern: "Adduction", target: "chest fly" },
  { name: "Pec deck", muscleGroup: "chest", pattern: "Adduction", target: "chest fly" },
  { name: "Dumbbell fly", muscleGroup: "chest", pattern: "Adduction", target: "chest fly" },
  { name: "Weighted dip", muscleGroup: "chest", pattern: "Decline press", target: "lower chest" },
  { name: "Decline machine press", muscleGroup: "chest", pattern: "Decline press", target: "lower chest" },
  { name: "High-to-low cable fly", muscleGroup: "chest", pattern: "Adduction", target: "lower chest" },

  { name: "Pull-up", muscleGroup: "back", pattern: "Vertical pull", target: "lats" },
  { name: "Neutral-grip pull-up", muscleGroup: "back", pattern: "Vertical pull", target: "lats" },
  { name: "Assisted pull-up", muscleGroup: "back", pattern: "Vertical pull", target: "lats" },
  { name: "Lat pulldown", muscleGroup: "back", pattern: "Vertical pull", target: "lats" },
  { name: "Neutral-grip pulldown", muscleGroup: "back", pattern: "Vertical pull", target: "lats" },
  { name: "Single-arm lat pulldown", muscleGroup: "back", pattern: "Unilateral pulldown", target: "lats" },
  { name: "Straight-arm pulldown", muscleGroup: "back", pattern: "Pullover", target: "lats" },
  { name: "Cable pullover", muscleGroup: "back", pattern: "Pullover", target: "lats" },
  { name: "Chest-supported row", muscleGroup: "back", pattern: "Horizontal pull", target: "mid back" },
  { name: "Seated cable row", muscleGroup: "back", pattern: "Horizontal pull", target: "mid back" },
  { name: "Machine row", muscleGroup: "back", pattern: "Horizontal pull", target: "mid back" },
  { name: "T-bar row", muscleGroup: "back", pattern: "Horizontal pull", target: "mid back" },
  { name: "Seal row", muscleGroup: "back", pattern: "Horizontal pull", target: "mid back" },
  { name: "Barbell row", muscleGroup: "back", pattern: "Horizontal pull", target: "mid back" },
  { name: "One-arm dumbbell row", muscleGroup: "back", pattern: "Unilateral row", target: "mid back" },
  { name: "Single-arm cable row", muscleGroup: "back", pattern: "Unilateral row", target: "mid back" },
  { name: "Meadows row", muscleGroup: "back", pattern: "Unilateral row", target: "mid back" },

  { name: "Back squat", muscleGroup: "quads", pattern: "Squat", target: "quad press" },
  { name: "Front squat", muscleGroup: "quads", pattern: "Squat", target: "quad press" },
  { name: "Safety-bar squat", muscleGroup: "quads", pattern: "Squat", target: "quad press" },
  { name: "Smith machine squat", muscleGroup: "quads", pattern: "Machine squat", target: "quad press" },
  { name: "Hack squat", muscleGroup: "quads", pattern: "Machine squat", target: "quad press" },
  { name: "Pendulum squat", muscleGroup: "quads", pattern: "Machine squat", target: "quad press" },
  { name: "Belt squat", muscleGroup: "quads", pattern: "Machine squat", target: "quad press" },
  { name: "Leg press", muscleGroup: "quads", pattern: "Press", target: "quad press" },
  { name: "Single-leg press", muscleGroup: "quads", pattern: "Single-leg press", target: "single-leg quads" },
  { name: "Bulgarian split squat", muscleGroup: "quads", pattern: "Single-leg", target: "single-leg quads" },
  { name: "Walking lunge", muscleGroup: "quads", pattern: "Single-leg", target: "single-leg quads" },
  { name: "Reverse lunge", muscleGroup: "quads", pattern: "Single-leg", target: "single-leg quads" },
  { name: "Leg extension", muscleGroup: "quads", pattern: "Knee extension", target: "quad isolation" },
  { name: "Single-leg extension", muscleGroup: "quads", pattern: "Knee extension", target: "quad isolation" },
  { name: "Sissy squat", muscleGroup: "quads", pattern: "Knee extension", target: "quad isolation" },

  { name: "Romanian deadlift", muscleGroup: "hamstrings", pattern: "Hinge", target: "hinge" },
  { name: "Dumbbell Romanian deadlift", muscleGroup: "hamstrings", pattern: "Hinge", target: "hinge" },
  { name: "Smith machine Romanian deadlift", muscleGroup: "hamstrings", pattern: "Hinge", target: "hinge" },
  { name: "Stiff-leg deadlift", muscleGroup: "hamstrings", pattern: "Hinge", target: "hinge" },
  { name: "Good morning", muscleGroup: "hamstrings", pattern: "Hinge", target: "hinge" },
  { name: "45-degree back extension", muscleGroup: "hamstrings", pattern: "Hinge", target: "hinge" },
  { name: "Seated leg curl", muscleGroup: "hamstrings", pattern: "Knee flexion", target: "hamstring curl" },
  { name: "Lying leg curl", muscleGroup: "hamstrings", pattern: "Knee flexion", target: "hamstring curl" },
  { name: "Standing leg curl", muscleGroup: "hamstrings", pattern: "Knee flexion", target: "hamstring curl" },
  { name: "Nordic hamstring curl", muscleGroup: "hamstrings", pattern: "Knee flexion", target: "hamstring curl" },
  { name: "Glute-ham raise", muscleGroup: "hamstrings", pattern: "Knee flexion", target: "hamstring curl" },

  { name: "Hip thrust", muscleGroup: "glutes", pattern: "Hip extension", target: "glute extension" },
  { name: "Barbell glute bridge", muscleGroup: "glutes", pattern: "Hip extension", target: "glute extension" },
  { name: "Smith machine hip thrust", muscleGroup: "glutes", pattern: "Hip extension", target: "glute extension" },
  { name: "Cable pull-through", muscleGroup: "glutes", pattern: "Hip extension", target: "glute extension" },
  { name: "Reverse hyperextension", muscleGroup: "glutes", pattern: "Hip extension", target: "glute extension" },
  { name: "Cable kickback", muscleGroup: "glutes", pattern: "Hip extension", target: "glute isolation" },
  { name: "Machine glute kickback", muscleGroup: "glutes", pattern: "Hip extension", target: "glute isolation" },
  { name: "Hip abduction machine", muscleGroup: "glutes", pattern: "Abduction", target: "glute medius" },
  { name: "Cable hip abduction", muscleGroup: "glutes", pattern: "Abduction", target: "glute medius" },
  { name: "Step-up", muscleGroup: "glutes", pattern: "Single-leg", target: "glute extension" },

  { name: "Machine shoulder press", muscleGroup: "shoulders", pattern: "Vertical press", target: "front delts" },
  { name: "Dumbbell shoulder press", muscleGroup: "shoulders", pattern: "Vertical press", target: "front delts" },
  { name: "Smith machine shoulder press", muscleGroup: "shoulders", pattern: "Vertical press", target: "front delts" },
  { name: "Arnold press", muscleGroup: "shoulders", pattern: "Vertical press", target: "front delts" },
  { name: "Cable lateral raise", muscleGroup: "shoulders", pattern: "Lateral delt", target: "side delts" },
  { name: "Dumbbell lateral raise", muscleGroup: "shoulders", pattern: "Lateral delt", target: "side delts" },
  { name: "Machine lateral raise", muscleGroup: "shoulders", pattern: "Lateral delt", target: "side delts" },
  { name: "Leaning cable lateral raise", muscleGroup: "shoulders", pattern: "Lateral delt", target: "side delts" },
  { name: "Cable Y-raise", muscleGroup: "shoulders", pattern: "Lateral delt", target: "side delts" },
  { name: "Rear delt fly", muscleGroup: "shoulders", pattern: "Rear delt", target: "rear delts" },
  { name: "Reverse pec deck", muscleGroup: "shoulders", pattern: "Rear delt", target: "rear delts" },
  { name: "Cable rear delt fly", muscleGroup: "shoulders", pattern: "Rear delt", target: "rear delts" },
  { name: "Face pull", muscleGroup: "shoulders", pattern: "Rear delt", target: "rear delts" },
  { name: "Cable front raise", muscleGroup: "shoulders", pattern: "Front raise", target: "front delts" },

  { name: "EZ-bar curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Barbell curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Cable curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Preacher curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Machine preacher curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Incline dumbbell curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Bayesian cable curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Spider curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Concentration curl", muscleGroup: "arms", pattern: "Elbow flexion", target: "biceps" },
  { name: "Hammer curl", muscleGroup: "arms", pattern: "Neutral curl", target: "forearms" },
  { name: "Reverse curl", muscleGroup: "arms", pattern: "Reverse curl", target: "forearms" },
  { name: "Wrist curl", muscleGroup: "arms", pattern: "Forearm flexion", target: "forearms" },
  { name: "Reverse wrist curl", muscleGroup: "arms", pattern: "Forearm extension", target: "forearms" },
  { name: "Rope pressdown", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "Straight-bar pressdown", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "V-bar pressdown", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "Single-arm cable pressdown", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "Overhead cable extension", muscleGroup: "arms", pattern: "Long-head triceps", target: "triceps" },
  { name: "Dumbbell overhead extension", muscleGroup: "arms", pattern: "Long-head triceps", target: "triceps" },
  { name: "Skull crusher", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "Machine triceps extension", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "Cross-body cable extension", muscleGroup: "arms", pattern: "Elbow extension", target: "triceps" },
  { name: "Close-grip bench press", muscleGroup: "arms", pattern: "Triceps press", target: "triceps" },
  { name: "Assisted triceps dip", muscleGroup: "arms", pattern: "Triceps press", target: "triceps" },

  { name: "Cable crunch", muscleGroup: "core", pattern: "Loaded flexion", target: "loaded abs" },
  { name: "Machine crunch", muscleGroup: "core", pattern: "Loaded flexion", target: "loaded abs" },
  { name: "Decline sit-up", muscleGroup: "core", pattern: "Loaded flexion", target: "loaded abs" },
  { name: "Ab wheel rollout", muscleGroup: "core", pattern: "Anti-extension", target: "anti-movement core" },
  { name: "Plank", muscleGroup: "core", pattern: "Anti-extension", target: "anti-movement core" },
  { name: "Side plank", muscleGroup: "core", pattern: "Anti-lateral flexion", target: "anti-movement core" },
  { name: "Pallof press", muscleGroup: "core", pattern: "Anti-rotation", target: "anti-movement core" },
  { name: "Dead bug", muscleGroup: "core", pattern: "Anti-extension", target: "anti-movement core" },
  { name: "Hanging knee raise", muscleGroup: "core", pattern: "Hip flexion", target: "lower abs" },
  { name: "Hanging leg raise", muscleGroup: "core", pattern: "Hip flexion", target: "lower abs" },
  { name: "Captain's chair knee raise", muscleGroup: "core", pattern: "Hip flexion", target: "lower abs" },
  { name: "Reverse crunch", muscleGroup: "core", pattern: "Hip flexion", target: "lower abs" },
];

const muscleLabels: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  shoulders: "Shoulders",
  arms: "Arms",
  glutes: "Glutes",
  core: "Core",
};

const muscleOptions = Object.keys(muscleLabels) as MuscleGroup[];

const movementTargetFor = (movement: Pick<WorkoutLift | ExerciseOption, "muscleGroup" | "name" | "pattern" | "target">) => {
  if (movement.target) return movement.target;
  const text = `${movement.name} ${movement.pattern}`.toLowerCase();

  if (movement.muscleGroup === "arms") {
    if (/pressdown|extension|skull|triceps|close-grip|dip/.test(text)) return "triceps";
    if (/hammer|reverse curl|forearm|wrist/.test(text)) return "forearms";
    return "biceps";
  }
  if (movement.muscleGroup === "shoulders") {
    if (/rear|face pull|reverse pec/.test(text)) return "rear delts";
    if (/lateral|upright|side/.test(text)) return "side delts";
    if (/front/.test(text)) return "front delts";
    return "front delts";
  }
  if (movement.muscleGroup === "back") {
    if (/pulldown|pull-up|chin|pullover|straight-arm|vertical/.test(text)) return "lats";
    return "mid back";
  }
  if (movement.muscleGroup === "chest") {
    if (/fly|adduction|pec deck/.test(text)) return "chest fly";
    if (/incline|low-to-high/.test(text)) return "upper chest";
    if (/dip|decline/.test(text)) return "lower chest";
    return "mid chest";
  }
  if (movement.muscleGroup === "quads") {
    if (/extension|sissy/.test(text)) return "quad isolation";
    if (/split|lunge|single/.test(text)) return "single-leg quads";
    return "quad press";
  }
  if (movement.muscleGroup === "hamstrings") {
    if (/curl|nordic|glute-ham/.test(text)) return "hamstring curl";
    return "hinge";
  }
  if (movement.muscleGroup === "glutes") {
    if (/abduction|medius/.test(text)) return "glute medius";
    if (/kickback/.test(text)) return "glute isolation";
    return "glute extension";
  }
  if (/anti|pallof|side plank/.test(text)) return "anti-movement core";
  if (/raise|reverse/.test(text)) return "lower abs";
  return "loaded abs";
};

const movementTargetLabel = (movement: Pick<WorkoutLift | ExerciseOption, "muscleGroup" | "name" | "pattern" | "target">) => {
  const target = movementTargetFor(movement);
  return target.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const isMusclePriority = (value: unknown): value is MusclePriority =>
  value === "specialize" ||
  value === "emphasize" ||
  value === "grow" ||
  value === "maintain" ||
  value === "minimum" ||
  value === "exclude";

const priorityLabels: Record<MusclePriority, string> = {
  specialize: "Specialize",
  emphasize: "Emphasize",
  grow: "Grow",
  maintain: "Maintain",
  minimum: "Minimum",
  exclude: "Exclude",
};

const priorityOptions: Array<{ value: MusclePriority; label: string }> = [
  { value: "specialize", label: "Specialize" },
  { value: "emphasize", label: "Emphasize" },
  { value: "grow", label: "Grow" },
  { value: "maintain", label: "Maintain" },
  { value: "minimum", label: "Minimum" },
  { value: "exclude", label: "Exclude" },
];

const prioritySetDelta: Record<MusclePriority, number> = {
  specialize: 2,
  emphasize: 1,
  grow: 0,
  maintain: -1,
  minimum: -2,
  exclude: -99,
};

const feedbackLimitationLabels: Record<FeedbackLimitation, string> = {
  target: "Target muscle",
  supporting: "Other muscle",
  conditioning: "Breathing",
  joint: "Joint",
  focus: "Focus",
};

const volumeAdjustmentOptions: Array<{ value: VolumeAdjustment; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "add", label: "Add set" },
  { value: "hold", label: "Hold volume" },
];

const isVolumeAdjustment = (value: unknown): value is VolumeAdjustment =>
  value === "auto" || value === "add" || value === "hold";

const stimulusLabels = ["Missed", "Low", "Solid", "Strong", "Too much"];
const pumpLabels = ["None", "Mild", "Good", "Strong", "Excessive"];
const sorenessLabels = ["None", "Mild", "Moderate", "High", "Too sore"];
const workloadLabels = ["Easy", "More", "Right", "Hard", "Too much"];
const techniqueLabels = ["Poor", "Fair", "Solid", "Sharp", "Locked"];
const jointPainLabels = ["None", "Minor", "Noticeable", "High", "Stop"];

const priorityClass: Record<MusclePriority, string> = {
  specialize:
    "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-400/30 dark:bg-fuchsia-400/12 dark:text-fuchsia-100",
  emphasize:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100",
  grow:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-100",
  maintain:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-200",
  minimum:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/12 dark:text-sky-100",
  exclude:
    "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-white/15 dark:bg-white/[0.04] dark:text-zinc-200",
};

const equipmentOptions: Array<{ value: EquipmentProfile; label: string }> = [
  { value: "full-gym", label: "Full gym" },
  { value: "home-gym", label: "Home gym" },
  { value: "dumbbells", label: "Dumbbells" },
];

const createPriorityMap = (
  overrides: Partial<Record<MuscleGroup, MusclePriority>> = {}
): Record<MuscleGroup, MusclePriority> => ({
  ...defaultMusclePriorities,
  ...overrides,
});

const mesoTemplates: MesoTemplate[] = [
  { id: "balanced", label: "Balanced growth", sessions: 5, priorities: createPriorityMap() },
  {
    id: "upper",
    label: "Upper emphasis",
    sessions: 5,
    priorities: createPriorityMap({ chest: "emphasize", back: "emphasize", shoulders: "emphasize", arms: "grow", quads: "maintain" }),
  },
  {
    id: "arms-shoulders",
    label: "Arms + delts",
    sessions: 5,
    priorities: createPriorityMap({ shoulders: "emphasize", arms: "emphasize", chest: "grow", back: "grow", quads: "maintain" }),
  },
  {
    id: "lower",
    label: "Lower emphasis",
    sessions: 5,
    priorities: createPriorityMap({ quads: "emphasize", hamstrings: "emphasize", glutes: "emphasize", arms: "maintain" }),
  },
  {
    id: "chest-back",
    label: "Chest + back",
    sessions: 5,
    priorities: createPriorityMap({ chest: "emphasize", back: "emphasize", shoulders: "grow", quads: "maintain" }),
  },
  {
    id: "timesaver",
    label: "4-day efficient",
    sessions: 4,
    priorities: createPriorityMap({ chest: "grow", back: "grow", quads: "grow", hamstrings: "grow", core: "maintain" }),
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const readNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const readClampedNumber = (value: unknown, fallback: number, min: number, max: number) =>
  clamp(readNumber(value, fallback), min, max);
const isEquipmentProfile = (value: unknown): value is EquipmentProfile =>
  equipmentOptions.some((option) => option.value === value);
const isMesoTemplateId = (value: unknown): value is MesoTemplateId =>
  mesoTemplates.some((template) => template.id === value);
const formatRestTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
const formatDateLabel = (iso: string | null) => {
  if (!iso) return "None";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "None";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const weekdayIndex = (day: WeekdayId) => weekdayOptions.findIndex((option) => option.value === day);

const weekdayFromLabel = (value: string): WeekdayId => {
  const normalized = value.toLowerCase().slice(0, 3);
  return weekdayOptions.find((option) => option.short.toLowerCase() === normalized || option.value === normalized)?.value ?? "mon";
};

const sortScheduleItems = (items: ScheduleItem[]) =>
  [...items].sort((left, right) => weekdayIndex(left.day) - weekdayIndex(right.day) || left.time.localeCompare(right.time));

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfCurrentWeek = () => {
  const date = new Date();
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - mondayOffset);
  return date;
};

const dateForWeekday = (weekStart: Date, day: WeekdayId) => {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + Math.max(0, weekdayIndex(day)));
  return date;
};

const scheduleCheckoffKey = (dateKey: string, itemId: string) => `${dateKey}:${itemId}`;

const scheduleDefaultTitle = (type: ScheduleItemType) => {
  const titles: Record<ScheduleItemType, string> = {
    workout: "Workout",
    meal: "Meal",
    supplement: "Supplement",
    medication: "Medication",
    cardio: "Cardio",
    habit: "Habit",
  };
  return titles[type];
};

const formatScheduleTime = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

const lift = (
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  pattern: string,
  sets = 3,
  reps = "8-12",
  target?: string
): WorkoutLift => ({
  id,
  exerciseId: slug(name),
  name,
  muscleGroup,
  pattern,
  target: target ?? movementTargetFor({ name, muscleGroup, pattern }),
  sets,
  reps,
});

const createLiftFromOption = (option: ExerciseOption, index: number): WorkoutLift =>
  lift(`${slug(option.name)}-${Date.now()}-${index}`, option.name, option.muscleGroup, option.pattern, 3, "8-12", option.target);

const generatedSplitFor = (sessionsPerWeek: number): SplitModel => {
  if (sessionsPerWeek <= 3) {
    return {
      name: "Full body",
      summary: "Three full-body sessions for consistent practice without crowding the week.",
      days: [
        {
          id: "full-a",
          day: "Mon",
          focus: "Full body A",
          intent: "Squat, press, row, trunk",
          lifts: [
            lift("full-a-squat", "Back squat", "quads", "Squat", 4, "5-8"),
            lift("full-a-bench", "Barbell bench press", "chest", "Horizontal press", 4, "6-10"),
            lift("full-a-row", "Chest-supported row", "back", "Horizontal pull", 3, "8-12"),
            lift("full-a-crunch", "Cable crunch", "core", "Loaded flexion", 3, "10-15"),
          ],
        },
        {
          id: "full-b",
          day: "Wed",
          focus: "Full body B",
          intent: "Hinge, vertical push, vertical pull",
          lifts: [
            lift("full-b-rdl", "Romanian deadlift", "hamstrings", "Hinge", 4, "6-10"),
            lift("full-b-press", "Machine shoulder press", "shoulders", "Vertical press", 3, "8-12"),
            lift("full-b-pulldown", "Lat pulldown", "back", "Vertical pull", 3, "8-12"),
            lift("full-b-raise", "Cable lateral raise", "shoulders", "Lateral delt", 3, "12-20"),
          ],
        },
        {
          id: "full-c",
          day: "Fri",
          focus: "Full body C",
          intent: "Single-leg, incline, upper back, arms",
          lifts: [
            lift("full-c-split", "Bulgarian split squat", "glutes", "Single-leg", 3, "8-12"),
            lift("full-c-incline", "Incline dumbbell press", "chest", "Incline press", 4, "8-12"),
            lift("full-c-row", "Single-arm cable row", "back", "Unilateral row", 3, "10-14"),
            lift("full-c-curl", "Cable curl", "arms", "Elbow flexion", 3, "10-15"),
          ],
        },
      ],
    };
  }

  if (sessionsPerWeek === 4) {
    return {
      name: "Upper / Lower",
      summary: "Four sessions: Upper A, Lower A, Upper B, Lower B.",
      days: [
        {
          id: "upper-strength",
          day: "Mon",
          focus: "Upper A",
          intent: "Heavy press and row first",
          lifts: [
            lift("upper-strength-bench", "Barbell bench press", "chest", "Horizontal press", 4, "4-8"),
            lift("upper-strength-row", "Chest-supported row", "back", "Horizontal pull", 4, "6-10"),
            lift("upper-strength-press", "Machine shoulder press", "shoulders", "Vertical press", 3, "6-10"),
            lift("upper-strength-pulldown", "Pull-up", "back", "Vertical pull", 3, "6-10"),
          ],
        },
        {
          id: "lower-strength",
          day: "Tue",
          focus: "Lower A",
          intent: "Squat and hinge anchors",
          lifts: [
            lift("lower-strength-squat", "Back squat", "quads", "Squat", 4, "4-8"),
            lift("lower-strength-rdl", "Romanian deadlift", "hamstrings", "Hinge", 4, "6-10"),
            lift("lower-strength-curl", "Seated leg curl", "hamstrings", "Knee flexion", 3, "8-12"),
            lift("lower-strength-calf", "Leg press", "quads", "Press", 3, "10-15"),
          ],
        },
        {
          id: "upper-volume",
          day: "Thu",
          focus: "Upper B",
          intent: "More angles, less joint stress",
          lifts: [
            lift("upper-volume-incline", "Incline dumbbell press", "chest", "Incline press", 3, "8-12"),
            lift("upper-volume-row", "Single-arm cable row", "back", "Unilateral row", 3, "10-14"),
            lift("upper-volume-lateral", "Cable lateral raise", "shoulders", "Lateral delt", 4, "12-20"),
            lift("upper-volume-triceps", "Rope pressdown", "arms", "Elbow extension", 3, "10-15"),
          ],
        },
        {
          id: "lower-volume",
          day: "Fri",
          focus: "Lower B",
          intent: "Leg work without grinding",
          lifts: [
            lift("lower-volume-hack", "Hack squat", "quads", "Machine squat", 3, "8-12"),
            lift("lower-volume-hip", "Hip thrust", "glutes", "Hip extension", 3, "8-12"),
            lift("lower-volume-curl", "Lying leg curl", "hamstrings", "Knee flexion", 3, "10-15"),
            lift("lower-volume-extension", "Leg extension", "quads", "Knee extension", 3, "12-15"),
          ],
        },
      ],
    };
  }

  if (sessionsPerWeek === 5) {
    return {
      name: "PPL + Upper / Lower",
      summary: "Five sessions: push, pull, legs, upper, lower.",
      days: [
        {
          id: "push",
          day: "Mon",
          focus: "Push",
          intent: "Chest, shoulders, triceps",
          lifts: [
            lift("push-incline", "Incline dumbbell press", "chest", "Incline press", 4, "6-10"),
            lift("push-machine", "Machine chest press", "chest", "Stable press", 3, "8-12"),
            lift("push-lateral", "Cable lateral raise", "shoulders", "Lateral delt", 4, "12-20"),
            lift("push-pressdown", "Rope pressdown", "arms", "Elbow extension", 3, "10-15"),
          ],
        },
        {
          id: "pull",
          day: "Tue",
          focus: "Pull",
          intent: "Back width, rows, biceps",
          lifts: [
            lift("pull-pulldown", "Lat pulldown", "back", "Vertical pull", 4, "8-12"),
            lift("pull-row", "Chest-supported row", "back", "Horizontal pull", 4, "8-12"),
            lift("pull-rear-delt", "Rear delt fly", "shoulders", "Rear delt", 3, "12-20"),
            lift("pull-curl", "EZ-bar curl", "arms", "Elbow flexion", 3, "8-12"),
          ],
        },
        {
          id: "legs",
          day: "Wed",
          focus: "Legs",
          intent: "Quads, hamstrings, glutes",
          lifts: [
            lift("legs-hack", "Hack squat", "quads", "Machine squat", 4, "6-10"),
            lift("legs-rdl", "Romanian deadlift", "hamstrings", "Hinge", 4, "6-10"),
            lift("legs-extension", "Leg extension", "quads", "Knee extension", 3, "12-15"),
            lift("legs-curl", "Seated leg curl", "hamstrings", "Knee flexion", 3, "10-15"),
          ],
        },
        {
          id: "upper",
          day: "Fri",
          focus: "Upper",
          intent: "Balanced upper repeat",
          lifts: [
            lift("upper-bench", "Barbell bench press", "chest", "Horizontal press", 3, "6-10"),
            lift("upper-cable-row", "Single-arm cable row", "back", "Unilateral row", 3, "10-14"),
            lift("upper-press", "Machine shoulder press", "shoulders", "Vertical press", 3, "8-12"),
            lift("upper-triceps", "Overhead cable extension", "arms", "Long-head triceps", 3, "10-15"),
          ],
        },
        {
          id: "lower",
          day: "Sat",
          focus: "Lower",
          intent: "Lower-body work with less spinal load",
          lifts: [
            lift("lower-leg-press", "Leg press", "quads", "Press", 4, "10-15"),
            lift("lower-hip", "Hip thrust", "glutes", "Hip extension", 3, "8-12"),
            lift("lower-curl", "Lying leg curl", "hamstrings", "Knee flexion", 3, "10-15"),
            lift("lower-core", "Hanging knee raise", "core", "Hip flexion", 3, "10-15"),
          ],
        },
      ],
    };
  }

  return {
    name: "Push / Pull / Legs x2",
    summary: "Six sessions: push, pull, legs, then A/B repeats.",
    days: [
      {
        id: "push-a",
        day: "Mon",
        focus: "Push A",
        intent: "Pressing strength first",
        lifts: [
          lift("push-a-bench", "Barbell bench press", "chest", "Horizontal press", 4, "4-8"),
          lift("push-a-press", "Machine shoulder press", "shoulders", "Vertical press", 3, "6-10"),
          lift("push-a-fly", "Cable fly", "chest", "Adduction", 3, "10-15"),
          lift("push-a-triceps", "Rope pressdown", "arms", "Elbow extension", 3, "10-15"),
        ],
      },
      {
        id: "pull-a",
        day: "Tue",
        focus: "Pull A",
        intent: "Heavy back work",
        lifts: [
          lift("pull-a-pullup", "Pull-up", "back", "Vertical pull", 4, "5-8"),
          lift("pull-a-row", "Chest-supported row", "back", "Horizontal pull", 4, "6-10"),
          lift("pull-a-rear", "Rear delt fly", "shoulders", "Rear delt", 3, "12-20"),
          lift("pull-a-curl", "EZ-bar curl", "arms", "Elbow flexion", 3, "8-12"),
        ],
      },
      {
        id: "legs-a",
        day: "Wed",
        focus: "Legs A",
        intent: "Squat and hinge",
        lifts: [
          lift("legs-a-squat", "Back squat", "quads", "Squat", 4, "4-8"),
          lift("legs-a-rdl", "Romanian deadlift", "hamstrings", "Hinge", 4, "6-10"),
          lift("legs-a-curl", "Seated leg curl", "hamstrings", "Knee flexion", 3, "8-12"),
          lift("legs-a-core", "Cable crunch", "core", "Loaded flexion", 3, "10-15"),
        ],
      },
      {
        id: "push-b",
        day: "Thu",
        focus: "Push B",
        intent: "Chest and delts",
        lifts: [
          lift("push-b-incline", "Incline dumbbell press", "chest", "Incline press", 3, "8-12"),
          lift("push-b-machine", "Machine chest press", "chest", "Stable press", 3, "10-14"),
          lift("push-b-lateral", "Cable lateral raise", "shoulders", "Lateral delt", 4, "12-20"),
          lift("push-b-overhead", "Overhead cable extension", "arms", "Long-head triceps", 3, "10-15"),
        ],
      },
      {
        id: "pull-b",
        day: "Fri",
        focus: "Pull B",
        intent: "Upper back and lats",
        lifts: [
          lift("pull-b-pulldown", "Lat pulldown", "back", "Vertical pull", 3, "10-14"),
          lift("pull-b-cable-row", "Single-arm cable row", "back", "Unilateral row", 3, "10-14"),
          lift("pull-b-rear", "Rear delt fly", "shoulders", "Rear delt", 3, "12-20"),
          lift("pull-b-curl", "Cable curl", "arms", "Elbow flexion", 3, "10-15"),
        ],
      },
      {
        id: "legs-b",
        day: "Sat",
        focus: "Legs B",
        intent: "Quad, glute, and core accessories",
        lifts: [
          lift("legs-b-leg-press", "Leg press", "quads", "Press", 4, "10-15"),
          lift("legs-b-hip", "Hip thrust", "glutes", "Hip extension", 3, "8-12"),
          lift("legs-b-extension", "Leg extension", "quads", "Knee extension", 3, "12-15"),
          lift("legs-b-core", "Pallof press", "core", "Anti-rotation", 3, "10-12"),
        ],
      },
    ],
  };
};

const estimatedSessionMinutesFor = (lifts: ReadonlyArray<Pick<WorkoutLift, "sets">>) =>
  estimatedSplitSessionMinutes(lifts.map((liftItem) => liftItem.sets));

export const splitFromBuilderDraft = (draft: MesocycleBuilderDraft, state: AppState) => {
  const weekdayLabels: Record<WeekdayId, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  const customOptions: ExerciseOption[] = draft.customExercises.map((exercise) => ({
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    pattern: exercise.pattern,
    target: exercise.target,
    equipment: exercise.equipment,
    favorite: true,
    jointFriendly: true,
  }));
  const candidates = [...customOptions, ...exerciseCatalog];
  const favoriteNames = new Set(draft.favoriteExercises.map((name) => name.toLowerCase()));
  const restrictedNames = new Set(draft.restrictedExercises.map((name) => name.toLowerCase()));

  const eligibleDays = generatedSplitFor(draft.sessionsPerWeek).days.slice(0, draft.sessionsPerWeek).map((day, dayIndex) => {
    const used = new Set<string>();
    const eligibleLifts = day.lifts
      .filter((liftItem) => draft.musclePriorities[liftItem.muscleGroup] !== "exclude")
      .flatMap((liftItem) => {
        const currentAllowed =
          !restrictedNames.has(liftItem.name.toLowerCase()) && equipmentAllowsExercise(draft.equipment, liftItem.name);
        const currentTarget = movementTargetFor(liftItem);
        const alternatives = candidates
          .filter((candidate) => candidate.muscleGroup === liftItem.muscleGroup)
          .filter((candidate) => !restrictedNames.has(candidate.name.toLowerCase()))
          .filter((candidate) => equipmentAllowsExercise(draft.equipment, candidate))
          .filter((candidate) => !used.has(candidate.name.toLowerCase()))
          .sort((left, right) => {
            const score = (candidate: ExerciseOption) =>
              (favoriteNames.has(candidate.name.toLowerCase()) ? 100 : 0) +
              (movementTargetFor(candidate) === currentTarget ? 30 : 0) +
              (candidate.pattern === liftItem.pattern ? 12 : 0) +
              (candidate.jointFriendly ? 2 : 0);
            return score(right) - score(left) || left.name.localeCompare(right.name);
          });
        const preferred = alternatives.find((candidate) => favoriteNames.has(candidate.name.toLowerCase()));
        const requestedName = draft.exerciseReplacements[`${day.id}:${liftItem.id}`]?.toLowerCase();
        const requestedOriginal = requestedName === liftItem.name.toLowerCase() && currentAllowed;
        const requestedReplacement = requestedName && !requestedOriginal
          ? alternatives.find((candidate) => candidate.name.toLowerCase() === requestedName)
          : null;
        const replacement = requestedName
          ? requestedOriginal
            ? null
            : requestedReplacement ?? (!currentAllowed ? alternatives[0] : null)
          : !currentAllowed
            ? alternatives[0]
            : preferred && movementTargetFor(preferred) === currentTarget
              ? preferred
              : null;
        if (!currentAllowed && !replacement) return [];
        const next: WorkoutLift = replacement
          ? {
              ...liftItem,
              exerciseId: slug(replacement.name),
              name: replacement.name,
              muscleGroup: replacement.muscleGroup,
              pattern: replacement.pattern,
              target: replacement.target ?? movementTargetFor(replacement),
              progressionKey: undefined,
              replacedFrom: liftItem.name,
            }
          : liftItem;
        used.add(next.name.toLowerCase());
        return [next];
      });
    return {
      ...day,
      day: weekdayLabels[draft.availableTrainingDays[dayIndex] ?? draft.availableTrainingDays[0] ?? "mon"],
      lifts: eligibleLifts,
    };
  });
  return constrainSplitDuration({
    days: eligibleDays,
    sessionMinutes: draft.sessionMinutes,
    musclePriorities: draft.musclePriorities,
    effectiveSetCount: (liftItem) => mesoAdjustedSetCount(liftItem, {
      musclePriorities: draft.musclePriorities,
      muscleFeedback: state.muscleFeedback,
      currentWeek: 1,
      mesoLengthWeeks: draft.mesoLengthWeeks,
      deloadMode: false,
    }),
  });
};

const normalizeSplit = (split: unknown): SplitDay[] | null => {
  if (!Array.isArray(split) || split.length === 0) return null;

  const normalized = split
    .map((day, dayIndex) => {
      const raw = day as Partial<SplitDay>;
      if (!raw || typeof raw !== "object") return null;
      const lifts = Array.isArray(raw.lifts)
        ? raw.lifts
            .map((item, liftIndex) => {
              const rawLift = item as Partial<WorkoutLift>;
              const muscleGroup = muscleOptions.includes(rawLift.muscleGroup as MuscleGroup)
                ? (rawLift.muscleGroup as MuscleGroup)
                : "chest";
              const setCount = Math.round(readClampedNumber(rawLift.sets, 3, 1, 8));
              const reps = typeof rawLift.reps === "string" && rawLift.reps.trim() ? rawLift.reps.trim() : "8-12";
              const name =
                rawLift.name || exerciseCatalog.find((exercise) => exercise.muscleGroup === muscleGroup)?.name || "Machine chest press";
              const pattern = rawLift.pattern || "Machine";
              return {
                id: rawLift.id || `custom-${dayIndex}-${liftIndex}`,
                exerciseId: rawLift.exerciseId || slug(name),
                name,
                muscleGroup,
                pattern,
                target: rawLift.target ?? movementTargetFor({ name, muscleGroup, pattern }),
                sets: setCount,
                reps,
                progressionKey: rawLift.progressionKey,
                replacedFrom: rawLift.replacedFrom,
              };
            })
            .filter(Boolean)
        : [];

      return {
        id: raw.id || `custom-day-${dayIndex}`,
        day: raw.day || "Mon",
        focus: raw.focus || "Custom day",
        intent: raw.intent || "User-built session",
        lifts,
      } satisfies SplitDay;
    })
    .filter(Boolean) as SplitDay[];

  return normalized.length > 0 ? normalized : null;
};

const normalizeFoodLog = normalizeFoodDiary;

const normalizeMusclePriorities = (priorities: unknown): Record<MuscleGroup, MusclePriority> => {
  if (!priorities || typeof priorities !== "object" || Array.isArray(priorities)) return { ...defaultMusclePriorities };

  return muscleOptions.reduce<Record<MuscleGroup, MusclePriority>>((acc, muscleGroup) => {
    const value = (priorities as Partial<Record<MuscleGroup, MusclePriority>>)[muscleGroup];
    acc[muscleGroup] = isMusclePriority(value) ? value : defaultMusclePriorities[muscleGroup];
    return acc;
  }, { ...defaultMusclePriorities });
};

const normalizeSkippedWorkouts = (value: unknown, mesocycleId: string): Record<string, boolean> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, boolean>>((acc, [key, skipped]) => {
    if (typeof skipped === "boolean") acc[key.split(":").length === 2 ? `${mesocycleId}:${key}` : key] = skipped;
    return acc;
  }, {});
};

const normalizeScheduleItems = (items: unknown): ScheduleItem[] => {
  if (!Array.isArray(items)) return defaultScheduleItems.map((item) => ({ ...item }));

  const normalized = items
    .map((item, index) => {
      const raw = item as Partial<ScheduleItem> & { weekday?: unknown; label?: unknown; notes?: unknown };
      if (!raw || typeof raw !== "object") return null;
      const day = isWeekdayId(raw.day) ? raw.day : isWeekdayId(raw.weekday) ? raw.weekday : "mon";
      const type = isScheduleItemType(raw.type) ? raw.type : "habit";
      const titleValue = typeof raw.title === "string" ? raw.title : typeof raw.label === "string" ? raw.label : "";
      const title = titleValue.trim() || scheduleDefaultTitle(type);
      const detailValue = typeof raw.detail === "string" ? raw.detail : typeof raw.notes === "string" ? raw.notes : "";
      const time = typeof raw.time === "string" && /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : "09:00";

      return {
        id: raw.id || `schedule-${type}-${index}`,
        day,
        time,
        type,
        title,
        detail: detailValue.trim() || undefined,
        linkedDayId: typeof raw.linkedDayId === "string" ? raw.linkedDayId : undefined,
      } satisfies ScheduleItem;
    })
    .filter(Boolean) as ScheduleItem[];

  return normalized;
};

const normalizeScheduleCheckoffs = (value: unknown): Record<string, boolean> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, boolean>>((acc, [key, checked]) => {
    if (typeof checked === "boolean") acc[key] = checked;
    return acc;
  }, {});
};

const normalizeStringList = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      )
    : [];

const normalizeAvailableTrainingDays = (value: unknown): WeekdayId[] => {
  if (!Array.isArray(value)) return [...defaultState.availableTrainingDays];
  const days = Array.from(new Set(value.filter(isWeekdayId)));
  return days.length > 0 ? days : [...defaultState.availableTrainingDays];
};

const normalizeCustomExercises = (value: unknown): ExerciseOption[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const raw = item as Partial<ExerciseOption>;
    if (typeof raw.name !== "string" || !raw.name.trim()) return [];
    const muscleGroup = muscleOptions.includes(raw.muscleGroup as MuscleGroup)
      ? (raw.muscleGroup as MuscleGroup)
      : "chest";
    return [
      {
        name: raw.name.trim(),
        muscleGroup,
        pattern: typeof raw.pattern === "string" && raw.pattern.trim() ? raw.pattern.trim() : "Custom movement",
        target: typeof raw.target === "string" && raw.target.trim() ? raw.target.trim() : undefined,
        equipment: Array.isArray(raw.equipment) ? raw.equipment.filter(isEquipmentProfile) : undefined,
        favorite: Boolean(raw.favorite),
        jointFriendly: raw.jointFriendly !== false,
      } satisfies ExerciseOption,
    ];
  });
};

const normalizeMuscleFeedback = (feedback: unknown): Record<MuscleGroup, MuscleFeedback> => {
  const fallback = createDefaultMuscleFeedback();
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) return fallback;

  return muscleOptions.reduce<Record<MuscleGroup, MuscleFeedback>>((acc, muscleGroup) => {
    const raw = (feedback as Partial<Record<MuscleGroup, Partial<MuscleFeedback>>>)[muscleGroup];
    const limitation = raw?.limitation;
    const volumeAdjustment = isVolumeAdjustment(raw?.volumeAdjustment)
      ? raw.volumeAdjustment
      : raw?.moreSets
        ? "add"
        : "auto";
    acc[muscleGroup] = {
      stimulus: clamp(Number(raw?.stimulus ?? fallback[muscleGroup].stimulus), 0, 4),
      pump: clamp(Number(raw?.pump ?? fallback[muscleGroup].pump), 0, 4),
      soreness: clamp(Number(raw?.soreness ?? fallback[muscleGroup].soreness), 0, 4),
      workload: clamp(Number(raw?.workload ?? fallback[muscleGroup].workload), 1, 4),
      technique: clamp(Number(raw?.technique ?? fallback[muscleGroup].technique), 0, 4),
      limitation:
        limitation === "target" ||
        limitation === "supporting" ||
        limitation === "conditioning" ||
        limitation === "joint" ||
        limitation === "focus"
          ? limitation
          : fallback[muscleGroup].limitation,
      jointPain: clamp(Number(raw?.jointPain ?? fallback[muscleGroup].jointPain), 0, 4),
      moreSets: volumeAdjustment === "add",
      volumeAdjustment,
    };
    return acc;
  }, fallback);
};

const muscleFeedbackForSession = (
  session: WorkoutSession | null,
  muscleGroup: MuscleGroup,
  fallback: MuscleFeedback
): MuscleFeedback => {
  const record = session?.feedbackRecords.find(
    (item) => item.scope === "muscle" && item.muscleGroup === muscleGroup
  );
  if (!record) return fallback;
  const volumeAdjustment = isVolumeAdjustment(record.volumeAdjustment)
    ? record.volumeAdjustment
    : record.moreSets
      ? "add"
      : fallback.volumeAdjustment;
  return {
    stimulus: record.stimulus ?? fallback.stimulus,
    pump: record.pump ?? fallback.pump,
    soreness: record.soreness ?? fallback.soreness,
    workload: record.workload ?? fallback.workload,
    technique: record.technique ?? fallback.technique,
    limitation: record.limitation ?? fallback.limitation,
    jointPain: record.jointPain ?? fallback.jointPain,
    moreSets: record.moreSets ?? volumeAdjustment === "add",
    volumeAdjustment,
  };
};

const normalizeWorkoutLog = (logs: unknown): Record<string, WorkoutSetLog[]> => {
  if (!logs || typeof logs !== "object" || Array.isArray(logs)) return {};

  return Object.entries(logs as Record<string, unknown>).reduce<Record<string, WorkoutSetLog[]>>((acc, [liftId, sets]) => {
    if (!Array.isArray(sets)) return acc;
    const normalized = sets
      .map((setItem, index) => {
        const raw = setItem as Partial<WorkoutSetLog>;
        if (!raw || typeof raw !== "object") return null;
        return {
          id: raw.id || `${liftId}-set-${index + 1}`,
          weight: Number(raw.weight || 0),
          reps: Number(raw.reps || 0),
          rir: clamp(
            Number(raw.rir ?? (typeof (raw as Partial<WorkoutSetLog> & { rpe?: number }).rpe === "number" ? 10 - (raw as { rpe: number }).rpe : 2)),
            0,
            5
          ),
          done: Boolean(raw.done),
          skipped: Boolean(raw.skipped),
        } satisfies WorkoutSetLog;
      })
      .filter(Boolean) as WorkoutSetLog[];
    acc[liftId] = normalized;
    return acc;
  }, {});
};

const normalizeWorkoutHistory = (history: unknown, fallbackMesocycleId: string): WorkoutHistoryEntry[] => {
  if (!Array.isArray(history)) return [];

  return history
    .map((item, index) => {
      const raw = item as Partial<WorkoutHistoryEntry>;
      if (!raw || typeof raw !== "object" || !raw.liftName) return null;
      const muscleGroup = muscleOptions.includes(raw.muscleGroup as MuscleGroup) ? (raw.muscleGroup as MuscleGroup) : "chest";
      const sets = Array.isArray(raw.sets)
        ? raw.sets
            .map((setItem) => {
              const rawSet = setItem as Partial<WorkoutHistorySet>;
              if (!rawSet || typeof rawSet !== "object") return null;
              return {
                weight: Number(rawSet.weight || 0),
                reps: Number(rawSet.reps || 0),
                rir: clamp(Number(rawSet.rir ?? 2), 0, 5),
                skipped: Boolean(rawSet.skipped),
              } satisfies WorkoutHistorySet;
            })
            .filter(Boolean)
        : [];
      const topSet = raw.topSet
        ? {
            weight: Number(raw.topSet.weight || 0),
            reps: Number(raw.topSet.reps || 0),
            rir: clamp(Number(raw.topSet.rir ?? 2), 0, 5),
            skipped: Boolean(raw.topSet.skipped),
          }
        : null;
      const mesocycleId = raw.mesocycleId || fallbackMesocycleId;
      const weekNumber = clamp(Number(raw.weekNumber || 1), 1, 12);
      const dayId = raw.dayId || "unknown";

      return {
        id: raw.id || `workout-history-${index}`,
        completedAt: raw.completedAt || new Date().toISOString(),
        mesocycleId,
        weekNumber,
        sessionKey: raw.mesocycleId && raw.sessionKey ? raw.sessionKey : `${mesocycleId}:${weekNumber}:${dayId}`,
        dayId,
        dayFocus: raw.dayFocus || "Workout",
        liftId: raw.liftId || `history-lift-${index}`,
        exerciseId: raw.exerciseId,
        liftName: raw.liftName,
        muscleGroup,
        sets: sets as WorkoutHistorySet[],
        topSet,
        estimatedOneRepMax: Number(raw.estimatedOneRepMax || 0),
        totalVolume: Number(raw.totalVolume || 0),
        sessionStartedAt: typeof raw.sessionStartedAt === "string" ? raw.sessionStartedAt : undefined,
        durationSec:
          typeof raw.durationSec === "number" && Number.isFinite(raw.durationSec)
            ? Math.max(0, Math.round(raw.durationSec))
            : undefined,
      } satisfies WorkoutHistoryEntry;
    })
    .filter(Boolean) as WorkoutHistoryEntry[];
};

const normalizeWorkoutSessions = (value: unknown): Record<string, WorkoutSession> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const now = new Date().toISOString();
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, WorkoutSession>>((acc, [key, item]) => {
    const session = normalizeWorkoutSession(item, { now });
    if (session) acc[session.sessionKey || key] = session;
    return acc;
  }, {});
};

const recoveryCheckinKey = (sessionKey: string, muscleGroup: MuscleGroup) => `${sessionKey}:${muscleGroup}`;

const normalizeRecoveryCheckins = (value: unknown): Record<string, RecoveryCheckin> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, RecoveryCheckin>>((acc, [key, item]) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return acc;
    const raw = item as Partial<RecoveryCheckin>;
    if (!raw.sessionKey || !muscleOptions.includes(raw.muscleGroup as MuscleGroup)) return acc;
    const muscleGroup = raw.muscleGroup as MuscleGroup;
    const id = raw.id || recoveryCheckinKey(raw.sessionKey, muscleGroup);
    acc[key || id] = {
      id,
      sessionKey: raw.sessionKey,
      muscleGroup,
      checkedAt: typeof raw.checkedAt === "string" ? raw.checkedAt : new Date().toISOString(),
      soreness: clamp(Number(raw.soreness ?? 1), 0, 4),
      readiness: clamp(Number(raw.readiness ?? 2), 0, 4),
      jointPain: clamp(Number(raw.jointPain ?? 0), 0, 4),
      performanceExpectation:
        raw.performanceExpectation === "below" || raw.performanceExpectation === "above"
          ? raw.performanceExpectation
          : "steady",
      skipped: Boolean(raw.skipped),
    };
    return acc;
  }, {});
};

const normalizeRestTimer = (timer: unknown, fallbackSessionKey: string | null = null): RestTimerState | null => {
  if (!timer || typeof timer !== "object" || Array.isArray(timer)) return null;
  const raw = timer as Partial<RestTimerState>;
  const sessionKey = typeof raw.sessionKey === "string" && raw.sessionKey ? raw.sessionKey : fallbackSessionKey;
  if (!sessionKey || !raw.liftId || !raw.setId || !raw.endsAt) return null;
  return {
    sessionKey,
    liftId: raw.liftId,
    setId: raw.setId,
    startedAt: Number(raw.startedAt || Date.now()),
    endsAt: Number(raw.endsAt),
    durationSec: clamp(Number(raw.durationSec || 120), 30, 600),
    pausedRemainingSec:
      raw.pausedRemainingSec === undefined
        ? undefined
        : clamp(Number(raw.pausedRemainingSec || 0), 0, 600),
  };
};

const cloneSplitForEditing = (split: SplitDay[]) =>
  split.map((day) => ({
    ...day,
    lifts: day.lifts.map((item) => ({ ...item })),
  }));

const sameMuscleOptions = (liftToReplace: WorkoutLift, usedNames: Set<string>) =>
  exerciseCatalog
    .filter(
      (exercise) =>
        exercise.muscleGroup === liftToReplace.muscleGroup &&
        movementTargetFor(exercise) === movementTargetFor(liftToReplace) &&
        exercise.name !== liftToReplace.name &&
        !usedNames.has(exercise.name.toLowerCase())
    )
    .sort((left, right) => {
      const leftPatternMatch = left.pattern === liftToReplace.pattern ? 0 : 1;
      const rightPatternMatch = right.pattern === liftToReplace.pattern ? 0 : 1;
      return leftPatternMatch - rightPatternMatch || left.name.localeCompare(right.name);
    });

const techniqueCuesFor = (liftItem: WorkoutLift) => {
  const cues: Record<MuscleGroup, string[]> = {
    chest: ["Set shoulder blades", "Control the lower", "Press with stacked wrists"],
    back: ["Start from a full stretch", "Drive elbows back", "Keep torso angle fixed"],
    quads: ["Use a stable foot position", "Track knees over toes", "Control depth every rep"],
    hamstrings: ["Hips move back first", "Keep tension on the way down", "Stop before back position changes"],
    shoulders: ["Lead with the target delt", "Keep traps quiet", "Use smooth reps"],
    arms: ["Lock upper arm position", "Use full elbow motion", "Pause the squeeze"],
    glutes: ["Brace before the rep", "Drive through midfoot", "Finish with hips, not low back"],
    core: ["Brace before moving", "Use controlled tempo", "Stop before the low back takes over"],
  };

  return cues[liftItem.muscleGroup];
};

const liftPermitsZeroLoad = (liftItem: WorkoutLift) => exercisePermitsZeroLoad(liftItem);

const firstRepTarget = (reps: string) => Number(reps.match(/\d+/)?.[0] ?? 8);

const defaultSetLogsForLift = (liftItem: WorkoutLift, targetRir = 2): WorkoutSetLog[] =>
  Array.from({ length: Math.max(1, liftItem.sets) }, (_, index) => ({
    id: `${liftItem.id}-set-${index + 1}`,
    weight: 0,
    reps: firstRepTarget(liftItem.reps),
    rir: targetRir,
    done: false,
    skipped: false,
  }));

const savedSetsForLift = (
  logs: Record<string, WorkoutSetLog[]>,
  mesocycleId: string,
  weekNumber: number,
  dayId: string,
  liftId: string
) =>
  logs[workoutLiftLogKey(mesocycleId, weekNumber, dayId, liftId)] ??
  logs[`${weekNumber}:${dayId}:${liftId}`] ??
  logs[liftId];

export const workoutOccurrencesForWeek = (state: AppState, days: SplitDay[], week = state.currentWeek) =>
  buildWorkoutOccurrences({
    mesocycleId: state.mesocycleId,
    weekNumber: week,
    days,
    weekStartDate: workoutWeekStartDate(localDateKey(new Date(state.mesoStartedAt)), week),
    dateOverrides: state.workoutDateOverrides,
  });

const allCompletedWorkoutKeys = (state: AppState) => new Set([
  ...state.workoutHistory.map(entry => entry.sessionKey),
  ...Object.values(state.workoutSessions).filter(session => session.status === "completed").map(session => session.sessionKey),
]);

export const nextWorkoutFor = (state: AppState, days: SplitDay[], allowExplicitReview = false) => {
  const occurrences = workoutOccurrencesForWeek(state, days);
  const completedKeys = allCompletedWorkoutKeys(state);
  const next = selectNextWorkoutOccurrence({
    mesocycleId: state.mesocycleId, occurrences, sessions: Object.values(state.workoutSessions),
    completedSessionKeys: completedKeys, skippedWorkouts: state.skippedWorkouts,
    today: localDateKey(new Date()), preferredDayId: state.activeDayId,
  });
  const explicit = allowExplicitReview && state.activeDayId
    ? occurrences.find(item => item.dayId === state.activeDayId && completedKeys.has(item.sessionKey))
    : null;
  if (next.kind !== "resume" && explicit) return {
    kind: "review" as const, occurrence: explicit, session: state.workoutSessions[explicit.sessionKey] ?? null,
  };
  return next;
};

const splitDayFromSession = (session: WorkoutSession, planned?: SplitDay | null): SplitDay => ({
  id: session.dayId, day: session.dayLabel, focus: session.workoutName,
  intent: planned?.intent ?? "Follow the frozen prescription saved when this workout started.",
  lifts: session.exercises.map(exercise => {
    const first = exercise.prescriptions[0];
    const low = first?.repRange.low ?? 8;
    const high = first?.repRange.high ?? low;
    return { id: exercise.id, exerciseId: exercise.exerciseId, name: exercise.name,
      muscleGroup: muscleOptions.includes(exercise.muscleGroup as MuscleGroup) ? exercise.muscleGroup as MuscleGroup : "chest",
      pattern: exercise.pattern, target: exercise.target, sets: exercise.prescriptions.length,
      reps: low === high ? `${low}` : `${low}-${high}` };
  }),
});

const activeSplitDay = (split: SplitDay[], activeDayId: string | null, state?: AppState) => {
  if (!state) return split.find(day => day.id === activeDayId) ?? split[0] ?? null;
  const next = nextWorkoutFor(state, split);
  const planned = split.find(day => day.id === next.occurrence?.dayId) ?? null;
  return next.kind === "resume" ? splitDayFromSession(next.session, planned) : planned;
};

const openWorkoutSessionForMesocycle = (
  sessions: Record<string, WorkoutSession>,
  mesocycleId: string
) => {
  const next = selectNextWorkoutOccurrence({ mesocycleId, occurrences: [], sessions: Object.values(sessions), today: "" });
  return next.kind === "resume" ? next.session : null;
};

const plannedSessionKeysForWeek = (days: SplitDay[], mesocycleId: string, weekNumber: number) =>
  new Set(days.map((day) => workoutSessionKey(mesocycleId, weekNumber, day.id)));

const completedSessionKeysForWeek = (
  history: WorkoutHistoryEntry[],
  mesocycleId: string,
  weekNumber: number,
  plannedSessionKeys?: ReadonlySet<string>
) =>
  new Set(
    history
      .filter(
        (entry) =>
          entry.mesocycleId === mesocycleId &&
          entry.weekNumber === weekNumber &&
          (!plannedSessionKeys || plannedSessionKeys.has(entry.sessionKey))
      )
      .map((entry) => entry.sessionKey)
  );

const skippedSessionCountForWeek = (
  skippedWorkouts: Record<string, boolean>,
  mesocycleId: string,
  weekNumber: number,
  completedKeys: ReadonlySet<string> = new Set(),
  plannedSessionKeys?: ReadonlySet<string>
) =>
  Object.keys(skippedWorkouts).filter(
    (key) =>
      key.startsWith(`${mesocycleId}:${weekNumber}:`) &&
      skippedWorkouts[key] &&
      !completedKeys.has(key) &&
      (!plannedSessionKeys || plannedSessionKeys.has(key))
  ).length;

const dayMuscleSummary = (day: SplitDay) =>
  Array.from(new Set(day.lifts.map((liftItem) => muscleLabels[liftItem.muscleGroup]))).join(", ");

const dayCompletionFor = (
  day: SplitDay,
  state: AppState,
  targetRir: number
) => {
  const sets = day.lifts.flatMap((liftItem) =>
    setsForLift(
      liftItem,
      savedSetsForLift(state.workoutLog, state.mesocycleId, state.currentWeek, day.id, liftItem.id),
      targetRir
    )
  );
  if (sets.length === 0) return 0;
  return Math.round((sets.filter((setItem) => setItem.done || setItem.skipped).length / sets.length) * 100);
};

const buildWeekOverview = (state: AppState, model: PlanModel): WeekOverview[] =>
  Array.from({ length: state.mesoLengthWeeks }, (_, index) => {
    const week = index + 1;
    const plannedSessionKeys = plannedSessionKeysForWeek(model.split.days, state.mesocycleId, week);
    const completedKeys = completedSessionKeysForWeek(
      state.workoutHistory,
      state.mesocycleId,
      week,
      plannedSessionKeys
    );
    const completed = completedKeys.size;
    const skipped = skippedSessionCountForWeek(
      state.skippedWorkouts,
      state.mesocycleId,
      week,
      completedKeys,
      plannedSessionKeys
    );
    const planned = model.split.days.length;
    const weekIsDeload = week === state.mesoLengthWeeks || (week === state.currentWeek && state.deloadMode);
    const targetRir = targetRirForWeek(week, state.mesoLengthWeeks, weekIsDeload);
    const done = completed + skipped >= planned && planned > 0;

    return {
      week,
      targetRir,
      completed,
      skipped,
      planned,
      status: weekIsDeload ? "deload" : done ? "done" : week === state.currentWeek ? "current" : "planned",
    };
  });

const recentRecoveryMuscles = (history: WorkoutHistoryEntry[], fallbackDay: SplitDay | null) => {
  const latestSessions = Array.from(new Set([...history].sort((left, right) => right.completedAt.localeCompare(left.completedAt)).map((entry) => entry.sessionKey))).slice(0, 2);
  const muscles = new Set<MuscleGroup>();
  history.forEach((entry) => {
    if (latestSessions.includes(entry.sessionKey)) muscles.add(entry.muscleGroup);
  });
  if (muscles.size === 0) {
    fallbackDay?.lifts.forEach((liftItem) => muscles.add(liftItem.muscleGroup));
  }
  return Array.from(muscles).slice(0, 4);
};

const estimatedOneRepMax = (setItem: WorkoutSetLog) =>
  setItem.done && !setItem.skipped && setItem.weight > 0 && setItem.reps > 0 ? Math.round(setItem.weight * (1 + setItem.reps / 30)) : 0;

const setsForLift = (liftItem: WorkoutLift, savedSets: WorkoutSetLog[] | undefined, targetRir: number) => {
  if (savedSets?.length) return savedSets;
  return defaultSetLogsForLift(liftItem, targetRir);
};

const latestHistoryForLift = (history: WorkoutHistoryEntry[], liftItem: WorkoutLift) =>
  history.find(
    (entry) =>
      entry.muscleGroup === liftItem.muscleGroup &&
      exerciseHistoryMatches(liftItem, entry)
  ) ?? null;

const guardWorkoutRecommendation = (
  state: AppState, liftItem: WorkoutLift, setIndex: number, sessionKey: string | null,
  recommendation: SetRecommendation
): SetRecommendation => {
  const previousSet = previousSetForRecommendation(latestHistoryForLift(state.workoutHistory, liftItem), setIndex, {
    allowZeroLoad: liftPermitsZeroLoad(liftItem),
  });
  const recovery = Object.values(state.recoveryCheckins).find(checkin =>
    checkin.sessionKey === sessionKey && checkin.muscleGroup === liftItem.muscleGroup && !checkin.skipped
  );
  const recovered = recovery ? guardRecommendationForRecovery(recommendation, previousSet, recovery) : recommendation;
  return guardRecommendationForExercisePain(recovered, previousSet, hasExercisePainFlag(liftItem, state.painfulExercises));
};

const recommendWorkoutSet = (
  state: AppState, liftItem: WorkoutLift, setIndex: number, targetRir: number, sessionKey: string | null
): SetRecommendation => guardWorkoutRecommendation(state, liftItem, setIndex, sessionKey, recommendationForSet(
  liftItem, setIndex, latestHistoryForLift(state.workoutHistory, liftItem), targetRir, state.weightIncrement,
  { allowZeroLoad: liftPermitsZeroLoad(liftItem), exerciseLoadIncrement: state.exerciseLoadIncrements[exercisePreferenceKey(liftItem)] }
));

const isUntouchedSessionSet = (session: WorkoutSession, setId: string) => {
  const log = session.setLogs[setId];
  const prescription = session.exercises.flatMap(exercise => exercise.prescriptions).find(item => item.id === setId);
  return Boolean(log && prescription && !log.inputEdited && !log.done && !log.skipped &&
    log.weight === 0 && log.reps === prescription.repRange.low && log.rir === prescription.targetRir);
};

const visibleSessionSetDraft = (state: AppState, session: WorkoutSession, liftItem: WorkoutLift, setId: string): WorkoutSetLog | null => {
  const draft = workoutSetDraft(session, setId);
  if (!draft) return null;
  if (!isUntouchedSessionSet(session, setId)) return { ...draft };
  const setIndex = session.exercises.find(exercise => exercise.id === liftItem.id)?.prescriptions.findIndex(item => item.id === setId) ?? -1;
  if (setIndex < 0) return null;
  const safe = guardWorkoutRecommendation(state, liftItem, setIndex, session.sessionKey, {
    weight: draft.weight, reps: draft.reps, rir: draft.rir, reason: "Frozen session target.",
  });
  return { ...draft, weight: safe.weight, reps: safe.reps, rir: safe.rir };
};

const topSetFromSets = (sets: WorkoutSetLog[]): WorkoutSetLog | null => {
  const completed = sets.filter((setItem) => setItem.done && !setItem.skipped && setItem.weight > 0 && setItem.reps > 0);
  if (completed.length === 0) return null;
  return completed.reduce((best, setItem) => (estimatedOneRepMax(setItem) > estimatedOneRepMax(best) ? setItem : best), completed[0]);
};

const formatHistorySet = (setItem: WorkoutHistorySet | WorkoutSetLog | null) => {
  if (!setItem || setItem.reps <= 0) return "No prior result";
  return setItem.weight > 0
    ? `${setItem.weight} x ${setItem.reps} @ ${setItem.rir} RIR`
    : `${setItem.reps} reps @ ${setItem.rir} RIR`;
};

const formatRecommendation = (recommendation: SetRecommendation) =>
  recommendation.weight > 0
    ? `${recommendation.weight} x ${recommendation.reps} @ ${recommendation.rir} RIR`
    : `${recommendation.reps} reps @ ${recommendation.rir} RIR`;

const buildWorkoutHistoryEntries = (
  day: SplitDay,
  workoutLog: Record<string, WorkoutSetLog[]>,
  targetRir: number,
  mesocycleId: string,
  weekNumber: number,
  completedAt: string,
  sessionStartedAt?: string,
  durationSec?: number
): WorkoutHistoryEntry[] =>
  day.lifts
    .map((liftItem) => {
      const sets = setsForLift(liftItem, workoutLog[liftItem.id], targetRir);
      const completedSets = sets.filter((setItem) => setItem.done);
      const productiveCompletedSets = completedSets.filter(
        (setItem) =>
          !setItem.skipped &&
          setItem.reps > 0 &&
          (setItem.weight > 0 || (setItem.weight === 0 && liftPermitsZeroLoad(liftItem)))
      );
      if (productiveCompletedSets.length === 0) return null;
      const topSet = topSetFromSets(sets);
      const totalVolume = completedSets.reduce(
        (sum, setItem) => (setItem.skipped ? sum : sum + Math.max(0, setItem.weight) * Math.max(0, setItem.reps)),
        0
      );

      return {
        id: `${liftItem.id}-${Date.now()}`,
        completedAt,
        mesocycleId,
        weekNumber,
        sessionKey: workoutSessionKey(mesocycleId, weekNumber, day.id),
        dayId: day.id,
        dayFocus: day.focus,
        liftId: liftItem.id,
        exerciseId: liftItem.exerciseId ?? slug(liftItem.name),
        liftName: liftItem.name,
        muscleGroup: liftItem.muscleGroup,
        sets: completedSets.map((setItem) => ({
          weight: setItem.weight,
          reps: setItem.reps,
          rir: setItem.rir,
          skipped: Boolean(setItem.skipped),
        })),
        topSet: topSet
          ? {
              weight: topSet.weight,
              reps: topSet.reps,
              rir: topSet.rir,
              skipped: Boolean(topSet.skipped),
            }
          : null,
        estimatedOneRepMax: topSet ? estimatedOneRepMax(topSet) : 0,
        totalVolume,
        sessionStartedAt,
        durationSec,
      } satisfies WorkoutHistoryEntry;
    })
    .filter(Boolean) as WorkoutHistoryEntry[];

const weeklySetTargetsFor = (days: SplitDay[]) =>
  days.reduce<Record<MuscleGroup, number>>(
    (acc, day) => {
      day.lifts.forEach((liftItem) => {
        acc[liftItem.muscleGroup] += liftItem.sets;
      });
      return acc;
    },
    { chest: 0, back: 0, quads: 0, hamstrings: 0, shoulders: 0, arms: 0, glutes: 0, core: 0 }
  );

const mesoAdjustedSetCount = (
  liftItem: WorkoutLift,
  state: Pick<AppState, "deloadMode" | "mesoLengthWeeks" | "currentWeek" | "musclePriorities" | "muscleFeedback">
) => {
  const priority = state.musclePriorities[liftItem.muscleGroup] ?? "grow";
  const feedback = state.muscleFeedback[liftItem.muscleGroup] ?? createDefaultMuscleFeedback()[liftItem.muscleGroup];
  const midpointWeek = Math.ceil(state.mesoLengthWeeks / 2);
  const weekDelta =
    !state.deloadMode && (priority === "specialize" || priority === "emphasize") && state.currentWeek >= midpointWeek
      ? 1
      : 0;
  return state.deloadMode
    ? Math.max(1, Math.ceil(liftItem.sets * 0.55))
    : clamp(liftItem.sets + prioritySetDelta[priority] + feedbackSetDelta(feedback) + weekDelta, 1, priority === "specialize" ? 7 : 6);
};

export const applyMesoSettings = (split: SplitModel, state: AppState, targetRir: number): SplitModel => {
  const isDeload = state.deloadMode;
  const days = split.days.map((day) => ({
    ...day,
    lifts: day.lifts
      .filter((liftItem) => state.musclePriorities[liftItem.muscleGroup] !== "exclude")
      .map((liftItem) => {
        return {
          ...liftItem,
          sets: mesoAdjustedSetCount(liftItem, state),
          reps: isDeload ? "10-15" : liftItem.reps,
        };
      }),
  }));

  return {
    ...split,
    days,
    summary: isDeload
      ? `Week ${state.currentWeek}: deload volume with ${targetRir} RIR targets.`
      : `Week ${state.currentWeek} of ${state.mesoLengthWeeks}: ${targetRir} RIR targets with volume adjusted by muscle feedback.`,
  };
};

const foodTitle = (food: Pick<FoodCatalogItem, "label" | "brand">) =>
  food.brand ? `${food.label} - ${food.brand}` : food.label;

const productLogEntryFromFood = (food: FoodCatalogItem): ProductLogEntry => ({
  id: `food-${food.id}-${Date.now()}`,
  label: food.label,
  brand: food.brand,
  barcode: food.barcode,
  servingLabel: food.servingLabel || "1 serving",
  calories: Math.round(food.nutrients.calories || 0),
  protein: Math.round((food.nutrients.protein || 0) * 10) / 10,
  carbs: Math.round((food.nutrients.carbs || 0) * 10) / 10,
  fat: Math.round((food.nutrients.fat || 0) * 10) / 10,
  nutrients: { ...food.nutrients },
});

const optionalFoodNutrientKeys: Array<Exclude<keyof FoodNutrients, "calories" | "protein" | "carbs" | "fat">> = [
  "fiber",
  "sugar",
  "sodiumMg",
  "potassiumMg",
  "calciumMg",
  "ironMg",
  "magnesiumMg",
  "zincMg",
  "vitaminCMg",
  "vitaminDMcg",
  "vitaminAMcg",
  "vitaminEMg",
  "vitaminKMcg",
  "folateMcg",
  "vitaminB12Mcg",
  "cholesterolMg",
  "saturatedFat",
  "fluidMl",
];

const nutrientsForLogEntry = (entry: ProductLogEntry): FoodNutrients => {
  const nutrients: FoodNutrients = {
    calories: Number(entry.nutrients?.calories ?? entry.calories ?? 0),
    protein: Number(entry.nutrients?.protein ?? entry.protein ?? 0),
    carbs: Number(entry.nutrients?.carbs ?? entry.carbs ?? 0),
    fat: Number(entry.nutrients?.fat ?? entry.fat ?? 0),
  };

  optionalFoodNutrientKeys.forEach((key) => {
    const value = Number(entry.nutrients?.[key] ?? 0);
    if (Number.isFinite(value) && value > 0) nutrients[key] = value;
  });

  return nutrients;
};

const sumFoodNutrients = (entries: ProductLogEntry[]) =>
  entries.reduce<FoodNutrients>(
    (total, entry) => {
      const nutrients = nutrientsForLogEntry(entry);
      total.calories += nutrients.calories;
      total.protein += nutrients.protein;
      total.carbs += nutrients.carbs;
      total.fat += nutrients.fat;
      optionalFoodNutrientKeys.forEach((key) => {
        total[key] = Number(total[key] ?? 0) + Number(nutrients[key] ?? 0);
      });
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

const foodNutrientTargetsFor = (state: AppState, model: PlanModel): FoodNutrientTarget[] => [
  {
    id: "fiber",
    label: "Fiber",
    unit: "g",
    target: Math.max(25, Math.round((model.macros.calories / 1000) * 14)),
  },
  { id: "sodiumMg", label: "Sodium", unit: "mg", target: 2300, limit: true },
  { id: "potassiumMg", label: "Potassium", unit: "mg", target: state.sex === "male" ? 3400 : 2600 },
  { id: "calciumMg", label: "Calcium", unit: "mg", target: 1000 },
  { id: "ironMg", label: "Iron", unit: "mg", target: state.sex === "female" ? 18 : 8, precision: 1 },
  { id: "magnesiumMg", label: "Magnesium", unit: "mg", target: state.sex === "male" ? 420 : 320 },
  { id: "vitaminCMg", label: "Vitamin C", unit: "mg", target: state.sex === "male" ? 90 : 75 },
  { id: "vitaminDMcg", label: "Vitamin D", unit: "mcg", target: 20, precision: 1 },
];

const formatNutrientAmount = (value: number, unit: string, precision = 0) =>
  `${precision > 0 ? value.toFixed(precision) : formatNumber(Math.round(value))}${unit}`;

export const normalizeAppState = (parsed: Record<string, unknown>, storedPayloads: Record<string, unknown>[] = [parsed]): AppState => {
    const mesoLengthWeeks = Math.round(readClampedNumber(parsed.mesoLengthWeeks, defaultState.mesoLengthWeeks, 3, 8));
    const currentWeek = Math.round(readClampedNumber(parsed.currentWeek, defaultState.currentWeek, 1, mesoLengthWeeks));
    const goal = isGoal(parsed.goal) ? parsed.goal : isGoal(parsed.goalFocus) ? parsed.goalFocus : defaultState.goal;
    const theme = isTheme(parsed.theme) ? parsed.theme : isTheme(parsed.appTheme) ? parsed.appTheme : defaultState.theme;
    const mesoStartedAt = typeof parsed.mesoStartedAt === "string" ? parsed.mesoStartedAt : defaultState.mesoStartedAt;
    const mesocycleId =
      typeof parsed.mesocycleId === "string" && parsed.mesocycleId.length > 0
        ? parsed.mesocycleId
        : mesocycleIdForStart(mesoStartedAt);
    const shouldImportLegacyTraining = Number(parsed.schemaVersion || 0) < defaultState.schemaVersion;
    const legacyWorkoutSplit = shouldImportLegacyTraining
      ? storedPayloads.find((payload) => Array.isArray(payload.workoutSplit))?.workoutSplit
      : undefined;
    const legacyTrackerDays = shouldImportLegacyTraining
      ? storedPayloads.find((payload) => Array.isArray(payload.trackerDays))?.trackerDays
      : undefined;
    const currentHistory = normalizeWorkoutHistory(parsed.workoutHistory, mesocycleId);
    const migratedHistory = migrateLegacyTrackerDays(legacyTrackerDays, mesocycleId, mesoStartedAt, exerciseLibrary);
    const workoutHistory = mergeHistoryWithoutDuplicates(currentHistory, migratedHistory);
    const bodyWeightHistory = mergeBodyweightHistory(
      normalizeBodyweightHistory(parsed.bodyWeightHistory),
      migrateLegacyTrackerBodyweights(legacyTrackerDays)
    );
    const customSplit =
      normalizeSplit(parsed.customSplit) ??
      (shouldImportLegacyTraining ? normalizeSplit(migrateLegacyWorkoutSplit(legacyWorkoutSplit, exerciseLibrary)) : null);
    const activeDayId = typeof parsed.activeDayId === "string" ? parsed.activeDayId : defaultState.activeDayId;
    const activeSessionKey = activeDayId ? workoutSessionKey(mesocycleId, currentWeek, activeDayId) : null;
    const legacyRaw = parsed.legacyNutritionTotals && typeof parsed.legacyNutritionTotals === "object"
      ? parsed.legacyNutritionTotals as Record<string, unknown>
      : parsed.foodDiaryVersion !== 1
        ? { calories: parsed.caloriesLogged, protein: parsed.proteinLogged, carbs: parsed.carbsLogged, fat: parsed.fatsLogged }
        : null;
    const legacyTotals = legacyRaw ? {
      calories: readClampedNumber(legacyRaw.calories, 0, 0, Number.MAX_SAFE_INTEGER),
      protein: readClampedNumber(legacyRaw.protein, 0, 0, Number.MAX_SAFE_INTEGER),
      carbs: readClampedNumber(legacyRaw.carbs, 0, 0, Number.MAX_SAFE_INTEGER),
      fat: readClampedNumber(legacyRaw.fat, 0, 0, Number.MAX_SAFE_INTEGER),
    } : undefined;

    return {
      ...defaultState,
      schemaVersion: 4,
      theme,
      goal,
      sex: isSex(parsed.sex) ? parsed.sex : defaultState.sex,
      age: Math.round(readClampedNumber(parsed.age, defaultState.age, 13, 90)),
      heightIn: readClampedNumber(parsed.heightIn, defaultState.heightIn, 48, 90),
      bodyWeightLb: readClampedNumber(parsed.bodyWeight ?? parsed.bodyWeightLb, defaultState.bodyWeightLb, 70, 500),
      bodyWeightHistory,
      trackerProgram: normalizeTrackerProgram(parsed.trackerProgram),
      targetWeightLb: readClampedNumber(parsed.targetWeightLb ?? parsed.targetStageWeightLb, defaultState.targetWeightLb, 70, 500),
      sessionsPerWeek: Math.round(readClampedNumber(parsed.sessionsPerWeek ?? parsed.trainingDaysPerWeek, defaultState.sessionsPerWeek, 3, 6)),
      sessionMinutes: Math.round(readClampedNumber(parsed.sessionMinutes, defaultState.sessionMinutes, 20, 150)),
      steps: Math.round(readClampedNumber(parsed.steps ?? parsed.stepCount, defaultState.steps, 0, 60000)),
      sleepHours: readClampedNumber(parsed.sleepHours, defaultState.sleepHours, 0, 14),
      energy: Math.round(readClampedNumber(parsed.energy, defaultState.energy, 1, 10)),
      soreness: Math.round(readClampedNumber(parsed.soreness, defaultState.soreness, 1, 10)),
      foodLog: normalizeFoodLog(parsed.foodLog),
      foodDiaryVersion: 1,
      savedFoodMeals: normalizeSavedFoodMeals(parsed.savedFoodMeals),
      legacyNutritionTotals: legacyTotals && Object.values(legacyTotals).some(value => value > 0) ? legacyTotals : undefined,
      workoutLog: normalizeWorkoutLog(parsed.workoutLog),
      workoutSessions: normalizeWorkoutSessions(parsed.workoutSessions),
      workoutHistory,
      recoveryCheckins: normalizeRecoveryCheckins(parsed.recoveryCheckins),
      restTimer: normalizeRestTimer(parsed.restTimer, activeSessionKey),
      workoutPaused: Boolean(parsed.workoutPaused),
      activeDayId,
      skippedWorkouts: normalizeSkippedWorkouts(parsed.skippedWorkouts, mesocycleId),
      workoutDateOverrides: normalizeWorkoutDateOverrides(parsed.workoutDateOverrides),
      scheduleItems: normalizeScheduleItems(parsed.scheduleItems ?? parsed.weekSchedule ?? parsed.schedule),
      scheduleCheckoffs: normalizeScheduleCheckoffs(parsed.scheduleCheckoffs),
      selectedScheduleDay: isWeekdayId(parsed.selectedScheduleDay) ? parsed.selectedScheduleDay : defaultState.selectedScheduleDay,
      availableTrainingDays: normalizeAvailableTrainingDays(parsed.availableTrainingDays),
      favoriteExercises: normalizeStringList(parsed.favoriteExercises),
      restrictedExercises: normalizeStringList(parsed.restrictedExercises),
      painFreeExercises: normalizeStringList(parsed.painFreeExercises),
      painfulExercises: normalizeStringList(parsed.painfulExercises),
      customExercises: normalizeCustomExercises(parsed.customExercises),
      mesoPaused: Boolean(parsed.mesoPaused),
      completedMesoCount: Math.round(readClampedNumber(parsed.completedMesoCount, 0, 0, Number.MAX_SAFE_INTEGER)),
      completedMesoIds: normalizeCompletedMesocycleIds(parsed.completedMesoIds ?? (
        Number(parsed.completedMesoCount) > 0 && typeof parsed.lastMesoCompletedAt === "string"
          ? [mesocycleId] : []
      )),
      mesocycleId,
      mesoStartedAt,
      lastMesoCompletedAt:
        typeof parsed.lastMesoCompletedAt === "string" ? parsed.lastMesoCompletedAt : defaultState.lastMesoCompletedAt,
      currentWeek,
      mesoLengthWeeks,
      deloadMode: Boolean(parsed.deloadMode),
      equipment: isEquipmentProfile(parsed.equipment) ? parsed.equipment : defaultState.equipment,
      weightIncrement: readClampedNumber(parsed.weightIncrement, defaultState.weightIncrement, 1, 25),
      exerciseLoadIncrements: normalizeExerciseLoadIncrements(parsed.exerciseLoadIncrements),
      activeTemplate: isMesoTemplateId(parsed.activeTemplate) ? parsed.activeTemplate : defaultState.activeTemplate,
      musclePriorities: normalizeMusclePriorities(parsed.musclePriorities),
      muscleFeedback: normalizeMuscleFeedback(parsed.muscleFeedback),
      customSplit,
    };
};

/** Current canonical data is never repaired destructively during an automatic load. */
export const normalizeSavedAppState = (parsed: BackupState, payloads: BackupState[] = [parsed]): AppState => {
  if (parsed.schemaVersion === 4 && parsed.foodDiaryVersion !== undefined && parsed.foodDiaryVersion !== 1) {
    throw new Error("Saved food records use an unsupported version. Update the app before opening them.");
  }
  const normalized = normalizeAppState(parsed, payloads);
  if (parsed.schemaVersion === 4 && parsed.foodDiaryVersion === 1) {
    validateBackupState(parsed);
    const changed = backupNormalizationChanges(parsed, normalized as unknown as BackupState);
    if (changed.length) {
      throw new Error(`Saved ${changed.slice(0, 3).join(", ")} records need recovery. The original data has been kept unchanged.`);
    }
  }
  return normalized;
};

const initialView = (): ViewId => {
  if (typeof window === "undefined") return "home";
  const value = window.location.hash.replace("#", "");
  return viewItems.some((item) => item.id === value) ? (value as ViewId) : "home";
};

export const builderStartTimestamp = (startDate: string): string | null => {
  if (!isWorkoutDate(startDate)) return null;
  const date = new Date(`${startDate}T12:00:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const readinessTone = (score: number | null) => {
  if (score === null) return "text-slate-300";
  if (score >= 82) return "text-emerald-600 dark:text-emerald-300";
  if (score >= 68) return "text-emerald-600 dark:text-emerald-300";
  if (score >= 52) return "text-amber-600 dark:text-amber-300";
  return "text-rose-600 dark:text-rose-300";
};

const toneClass: Record<Suggestion["tone"], string> = {
  cyan: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  amber:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100",
  rose: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100",
  violet:
    "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100",
};

export const computePlan = (savedState: AppState, diaryDate: string): PlanModel => {
  const intake = foodDiaryTotals(savedState.foodLog, diaryDate);
  // Food advice and the diary share one source of truth: entries for this local day.
  const state = { ...savedState, caloriesLogged: intake.calories, proteinLogged: intake.protein, carbsLogged: intake.carbs, fatsLogged: intake.fat };
  const kg = state.bodyWeightLb * 0.453592;
  const cm = state.heightIn * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * state.age + (state.sex === "male" ? 5 : -161);
  const activityFactor = clamp(1.28 + state.sessionsPerWeek * 0.045 + state.steps / 100000, 1.35, 1.78);
  const maintenanceCalories = roundTo(bmr * activityFactor, 25);
  const goal = goals[state.goal] ?? goals.recomposition;
  const accepted = acceptedTrackerTarget(state.trackerProgram, diaryDate);
  const calories = accepted?.calories ?? roundTo(maintenanceCalories + goal.calorieShift, 25);
  const protein = accepted?.protein ?? roundTo(state.bodyWeightLb * goal.proteinPerLb, 5);
  const fats = accepted?.fat ?? roundTo(clamp(state.bodyWeightLb * 0.32, 45, 95), 5);
  const carbs = accepted?.carbs ?? Math.max(90, roundTo((calories - protein * 4 - fats * 9) / 4, 5));
  const recoveryEvidence = Object.values(state.recoveryCheckins).filter(checkin =>
    !checkin.skipped && Number.isFinite(Date.parse(checkin.checkedAt)) &&
    foodDiaryDateKey(new Date(checkin.checkedAt)) === diaryDate
  );
  const readiness = recoveryEvidence.length
    ? Math.round(recoveryEvidence.reduce((sum, checkin) => sum + checkin.readiness, 0) / recoveryEvidence.length * 25)
    : null;
  const painFlag = recoveryEvidence.some(checkin => checkin.jointPain >= 3) || state.painfulExercises.length > 0;
  const programmedTargetRir = targetRirForWeek(state.currentWeek, state.mesoLengthWeeks, state.deloadMode);
  const targetRir = !state.deloadMode && readiness !== null && readiness < 58 ? Math.max(programmedTargetRir, 2) : programmedTargetRir;
  const baseSplit = state.customSplit
    ? {
        name: "Custom mesocycle",
        summary: `${state.customSplit.length} sessions with editable lifts, days, sets, and rep ranges.`,
        days: state.customSplit,
      }
    : generatedSplitFor(state.sessionsPerWeek);
  const split = applyMesoSettings(baseSplit, state, targetRir);
  const weeklySetTargets = weeklySetTargetsFor(split.days);
  const stepTarget = state.goal === "muscle-gain" ? 7500 : state.goal === "performance" ? 8000 : 9500;
  const weeklyCardioMinutes =
    state.goal === "fat-loss" ? 150 : state.goal === "recomposition" ? 105 : state.goal === "performance" ? 75 : 45;

  const suggestions: Suggestion[] = [];

  if (painFlag) {
    suggestions.push({ id: "pain-constraint", label: "Training", title: "Review flagged movements", detail: "Pain flags take priority over progression. Review affected exercises before adding load.", action: "Review workout", view: "today", tone: "rose", Icon: Activity });
  } else if (state.deloadMode) {
    suggestions.push({
      id: "deload",
      label: "Meso",
      title: "Deload week",
      detail: `${targetRir} RIR target, reduced sets, normal technique.`,
      action: "Start today",
      view: "today",
      tone: "amber",
      Icon: Gauge,
    });
  } else if (readiness !== null && readiness < 58) {
    suggestions.push({
      id: "recover",
      label: "Recovery",
      title: "Reduce effort today",
      detail: `Use ${Math.max(targetRir, 2)} RIR and keep load steady.`,
      action: "Open today",
      view: "today",
      tone: "amber",
      Icon: Moon,
    });
  } else {
    suggestions.push({
      id: "push",
      label: "Training",
      title: `Week ${state.currentWeek}: ${targetRir} RIR`,
      detail: readiness === null ? "Recovery not checked today. Follow the programmed sets; review each lift's evidence before progressing." : "Use each lift's logged performance and recovery check to review its next prescription.",
      action: "Open today",
      view: "today",
      tone: "emerald",
      Icon: Dumbbell,
    });
  }

  if (state.caloriesLogged > calories * 0.82 && state.proteinLogged < protein * 0.75) {
    suggestions.push({
      id: "protein-gap",
      label: "Food",
      title: "Protein is behind",
      detail: `${Math.max(0, protein - state.proteinLogged)}g protein left today.`,
      action: "Open food",
      view: "food",
      tone: "rose",
      Icon: Utensils,
    });
  } else {
    suggestions.push({
      id: "macro-steady",
      label: "Food",
      title: "Macros remaining",
      detail: `${formatNumber(Math.max(0, calories - state.caloriesLogged))} calories and ${Math.max(
        0,
        protein - state.proteinLogged
      )}g protein remain.`,
      action: "Open food",
      view: "food",
      tone: "cyan",
      Icon: Flame,
    });
  }

  const trainingLoad =
    readiness === null ? "Not checked today" : painFlag ? "Review pain flags" : readiness >= 68 ? "Check-in recorded" : "Recovery flagged";

  return {
    readiness,
    recoveryEvidenceCount: recoveryEvidence.length,
    maintenanceCalories,
    macros: {
      calories,
      protein,
      carbs,
      fats,
      remainingCalories: Math.max(0, calories - state.caloriesLogged),
      remainingProtein: Math.max(0, protein - state.proteinLogged),
      remainingCarbs: Math.max(0, carbs - state.carbsLogged),
      remainingFats: Math.max(0, fats - state.fatsLogged),
    },
    baseSplit,
    split,
    primarySuggestion: suggestions[0],
    suggestions,
    weeklyCardioMinutes,
    stepTarget,
    trainingLoad,
    targetRir,
    isDeload: state.deloadMode,
    weeklySetTargets,
  };
};

function updateNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <div className="mt-2">{children}</div>
      {helper ? <span className="mt-1.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</span> : null}
    </label>
  );
}

function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="premium-input h-10 w-full px-3 py-2 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function StatCard({
  label,
  value,
  detail,
  Icon,
}: {
  label: string;
  value: string;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="premium-mini-card">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</div>
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="mt-3 truncate text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  );
}

function SuggestionCard({ item, onAction }: { item: Suggestion; onAction: () => void }) {
  return (
    <div className={`rounded-[22px] border p-4 ${toneClass[item.tone]}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/75 shadow-sm dark:bg-slate-950/40">
          <item.Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase text-current opacity-70">{item.label}</div>
          <div className="mt-1 text-base font-semibold tracking-normal">{item.title}</div>
          {item.detail ? <p className="mt-1.5 text-sm leading-6 opacity-80">{item.detail}</p> : null}
        </div>
      </div>
      <Button variant="secondary" size="sm" className="mt-4 w-full justify-between" onClick={onAction}>
        {item.action}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ReplacementPicker({
  state,
  day,
  liftToReplace,
  onReplace,
  onCancel,
}: {
  state: AppState;
  day: SplitDay;
  liftToReplace: WorkoutLift;
  onReplace: (next: WorkoutLift, canTransferProgressionHistory: boolean) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<"all" | "profile">("profile");
  const [samePatternOnly, setSamePatternOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [previousOnly, setPreviousOnly] = useState(false);
  const [painFreeOnly, setPainFreeOnly] = useState(false);
  const [customOnly, setCustomOnly] = useState(false);
  const usedNames = new Set(
    day.lifts
      .filter((item) => item.id !== liftToReplace.id)
      .map((item) => item.name.toLowerCase())
  );
  const customNames = new Set(state.customExercises.map((exercise) => exercise.name.toLowerCase()));
  const candidates: ReplacementCandidate[] = [
    ...state.customExercises.map((exercise) => ({
      id: `custom-${slug(exercise.name)}`,
      ...exercise,
      custom: true,
      source: "custom",
    })),
    ...exerciseLibrary.map((exercise) => ({ ...exercise, source: "library" })),
    ...exerciseCatalog.map((exercise) => ({
      id: `catalog-${slug(exercise.name)}`,
      ...exercise,
      // App catalog values describe availability profiles, while the ranker
      // expects a concrete modality. Let it infer the modality from the name.
      equipment: undefined,
      source: "workout-catalog",
    })),
  ];
  const query = search.trim().toLowerCase();
  const searchedCandidates = query
    ? candidates.filter((candidate) =>
        [
          candidate.name,
          candidate.pattern,
          candidate.category,
          inferExerciseMovementPattern(candidate),
          inferExerciseEquipment(candidate).join(" "),
          candidate.muscleBias?.map((bias) => bias.muscle).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : candidates;
  const previouslyUsedNames = state.workoutHistory.map((entry) => entry.liftName);
  const ranked = rankExerciseSubstitutions(liftToReplace, searchedCandidates, {
    filters: {
      equipment: equipmentFilter === "profile" ? state.equipment : undefined,
      movementPattern: samePatternOnly ? inferExerciseMovementPattern(liftToReplace) : undefined,
      favourite: favoritesOnly ? true : undefined,
      previouslyUsed: previousOnly ? true : undefined,
      painFree: painFreeOnly ? true : undefined,
      custom: customOnly ? true : undefined,
    },
    signals: {
      favourite: state.favoriteExercises,
      previouslyUsed: previouslyUsedNames,
      painFree: state.painFreeExercises,
      painful: state.painfulExercises,
      custom: [...customNames],
    },
    excludeExerciseKeys: [...usedNames, ...state.restrictedExercises],
    limit: 16,
  });

  const resetFilters = () => {
    setSearch("");
    setEquipmentFilter("all");
    setSamePatternOnly(false);
    setFavoritesOnly(false);
    setPreviousOnly(false);
    setPainFreeOnly(false);
    setCustomOnly(false);
  };

  return (
    <div className="mt-3 rounded-[22px] border border-rose-200 bg-rose-50/78 p-3 dark:border-rose-400/20 dark:bg-rose-400/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-200">
            Ranked {movementTargetLabel(liftToReplace)} swaps
          </div>
          <div className="mt-1 text-sm text-rose-900 dark:text-rose-100">{day.focus} · restricted movements stay hidden</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or pattern"
          aria-label="Search replacement exercises"
        />
        <select
          value={equipmentFilter}
          onChange={(event) => setEquipmentFilter(event.target.value as "all" | "profile")}
          aria-label="Replacement equipment filter"
          className="min-h-11 rounded-[14px] border border-rose-200 bg-white/85 px-3 text-sm text-slate-900 dark:border-rose-300/20 dark:bg-slate-950/55 dark:text-white"
        >
          <option value="profile">My equipment</option>
          <option value="all">All equipment</option>
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Replacement filters">
        {[
          ["Pattern", samePatternOnly, setSamePatternOnly],
          ["Favorites", favoritesOnly, setFavoritesOnly],
          ["Used before", previousOnly, setPreviousOnly],
          ["Pain-free", painFreeOnly, setPainFreeOnly],
          ["Custom", customOnly, setCustomOnly],
        ].map(([label, active, setter]) => (
          <button
            key={String(label)}
            type="button"
            aria-pressed={Boolean(active)}
            onClick={() => (setter as React.Dispatch<React.SetStateAction<boolean>>)((value) => !value)}
            className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
              active
                ? "border-rose-400 bg-rose-600 text-white dark:border-rose-300 dark:bg-rose-400 dark:text-slate-950"
                : "border-rose-200 bg-white/70 text-rose-800 dark:border-rose-300/20 dark:bg-white/[0.04] dark:text-rose-100"
            }`}
          >
            {String(label)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ranked.length > 0 ? (
          ranked.map((result) => {
            const option = result.exercise;
            const pattern = option.pattern || inferExerciseMovementPattern(option);
            const muscleGroup = option.muscleGroup ?? liftToReplace.muscleGroup;
            return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onReplace(
                  {
                    ...liftToReplace,
                    id: liftToReplace.id,
                    exerciseId: option.id,
                    name: option.name,
                    muscleGroup,
                    pattern,
                    target: option.target ?? movementTargetFor({ name: option.name, muscleGroup, pattern }),
                    progressionKey: result.canTransferProgressionHistory
                      ? option.progressionKey ?? option.progressionHistoryKey ?? liftToReplace.progressionKey
                      : option.progressionKey ?? option.progressionHistoryKey,
                    replacedFrom: liftToReplace.name,
                  },
                  result.canTransferProgressionHistory
                )
              }
              className="rounded-[18px] border border-rose-200 bg-white/82 px-3 py-2.5 text-left text-sm transition hover:bg-white dark:border-rose-300/20 dark:bg-slate-950/42 dark:hover:bg-slate-950/70"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-950 dark:text-white">{option.name}</span>
                <Badge variant="outline" className="bg-white/70 text-[10px] dark:bg-white/[0.04]">
                  {result.canTransferProgressionHistory ? "History transfers" : "New history"}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {result.reasons.slice(0, 2).join(" · ") || `${pattern} alternative`}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{result.historyTransferReason}</div>
              {result.warnings[0] ? <div className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{result.warnings[0]}</div> : null}
            </button>
            );
          })
        ) : (
          <div className="rounded-[18px] border border-rose-200 bg-white/75 px-3 py-3 text-sm text-rose-900 dark:border-rose-300/20 dark:bg-slate-950/42 dark:text-rose-100 sm:col-span-2">
            <div>No safe unused matches meet these filters.</div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={resetFilters}>Clear filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LiftRow({
  state,
  day,
  liftItem,
  target,
  setTarget,
  onReplace,
  onRemove,
  onUpdate,
}: {
  state: AppState;
  day: SplitDay;
  liftItem: WorkoutLift;
  target: ReplacementTarget | null;
  setTarget: (target: ReplacementTarget | null) => void;
  onReplace: (next: WorkoutLift, canTransferProgressionHistory: boolean) => void;
  onRemove?: () => void;
  onUpdate?: (updates: Partial<WorkoutLift>) => void;
}) {
  const isReplacing = target?.dayId === day.id && target?.liftId === liftItem.id;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/72 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{liftItem.name}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {movementTargetLabel(liftItem)} · {liftItem.sets} x {liftItem.reps}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setTarget(isReplacing ? null : { dayId: day.id, liftId: liftItem.id })}
          >
            <Shuffle className="h-4 w-4" />
            Replace
          </Button>
          {onRemove ? (
            <Button variant="ghost" size="icon" aria-label={`Remove ${liftItem.name}`} onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      {onUpdate ? (
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1.2fr)_120px_90px_100px]">
          <Input
            aria-label={`${liftItem.name} exercise name`}
            placeholder="Exercise"
            value={liftItem.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
          <SelectField
            value={liftItem.muscleGroup}
            onChange={(muscleGroup) => onUpdate({ muscleGroup })}
            options={muscleOptions.map((value) => ({ value, label: muscleLabels[value] }))}
          />
          <label className="grid gap-1 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Base sets
            <Input
              aria-label={`${liftItem.name} base sets`}
              type="number"
              min={1}
              value={liftItem.sets}
              onChange={(event) => onUpdate({ sets: Math.max(1, updateNumber(event.target.value, liftItem.sets)) })}
            />
          </label>
          <Input
            aria-label={`${liftItem.name} reps`}
            placeholder="Reps"
            value={liftItem.reps}
            onChange={(event) => onUpdate({ reps: event.target.value })}
          />
        </div>
      ) : null}
      {isReplacing ? (
        <ReplacementPicker state={state} day={day} liftToReplace={liftItem} onReplace={onReplace} onCancel={() => setTarget(null)} />
      ) : null}
    </div>
  );
}

function FeedbackSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2 rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={([next]) => onChange(next)} />
    </div>
  );
}

function FeedbackScale({
  label,
  value,
  labels,
  onChange,
}: {
  label: string;
  value: number;
  labels: string[];
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2 rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{labels[value] ?? value}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {labels.map((option, index) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(index)}
            className={[
              "min-h-9 rounded-[12px] border px-1.5 text-[10px] font-semibold transition",
              value === index
                ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100"
                : "border-slate-200 bg-white/60 text-slate-500 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
            ].join(" ")}
            aria-label={`${label}: ${option}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedbackOptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "min-h-9 rounded-[12px] border px-2 text-xs font-semibold transition",
              value === option.value
                ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100"
                : "border-slate-200 bg-white/60 text-slate-500 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function VolumeAdjustmentControl({
  value,
  compact = false,
  onChange,
}: {
  value: VolumeAdjustment;
  compact?: boolean;
  onChange: (value: VolumeAdjustment) => void;
}) {
  return (
    <div className={compact ? "grid gap-1" : "grid gap-2 rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"}>
      {!compact ? (
        <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Next week volume</div>
      ) : null}
      <div className="grid grid-cols-3 gap-1">
        {volumeAdjustmentOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={[
              "min-h-10 rounded-[14px] border px-2 text-xs font-semibold transition",
              value === option.value
                ? option.value === "add"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-100"
                  : option.value === "hold"
                    ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/12 dark:text-sky-100"
                    : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100"
                : "border-slate-200 bg-white/60 text-slate-500 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MuscleFeedbackControls({
  muscleGroup,
  feedback,
  onChange,
}: {
  muscleGroup: MuscleGroup;
  feedback: MuscleFeedback;
  onChange: (feedback: MuscleFeedback) => void;
}) {
  const updateFeedback = (updates: Partial<MuscleFeedback>) => {
    onChange({ ...feedback, ...updates });
  };
  const setVolumeAdjustment = (volumeAdjustment: VolumeAdjustment) =>
    updateFeedback({ volumeAdjustment, moreSets: volumeAdjustment === "add" });

  const nextSetChange = feedbackSetDelta(feedback);
  const jointWarning = feedback.jointPain >= 2 || feedback.limitation === "joint";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-950 dark:text-white">{muscleLabels[muscleGroup]}</div>
        <div className="flex flex-wrap items-center gap-2">
          {jointWarning ? (
            <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100">
              Joint flag
            </Badge>
          ) : null}
          <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
            {nextSetChange > 0 ? "+1 set next" : nextSetChange < 0 ? "-1 set next" : "Hold sets"}
          </Badge>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <FeedbackScale label="Stimulus" value={feedback.stimulus} labels={stimulusLabels} onChange={(stimulus) => updateFeedback({ stimulus })} />
        <FeedbackScale label="Pump" value={feedback.pump} labels={pumpLabels} onChange={(pump) => updateFeedback({ pump })} />
        <FeedbackScale
          label="Soreness"
          value={feedback.soreness}
          labels={sorenessLabels}
          onChange={(soreness) => updateFeedback({ soreness })}
        />
        <FeedbackScale
          label="Workload"
          value={feedback.workload}
          labels={workloadLabels}
          onChange={(workload) => updateFeedback({ workload })}
        />
        <FeedbackScale
          label="Technique"
          value={feedback.technique}
          labels={techniqueLabels}
          onChange={(technique) => updateFeedback({ technique })}
        />
        <FeedbackScale
          label="Joint"
          value={feedback.jointPain}
          labels={jointPainLabels}
          onChange={(jointPain) => updateFeedback({ jointPain })}
        />
        <FeedbackOptionGroup
          label="Limiter"
          value={feedback.limitation}
          options={(Object.keys(feedbackLimitationLabels) as FeedbackLimitation[]).map((value) => ({
            value,
            label: feedbackLimitationLabels[value],
          }))}
          onChange={(limitation) => updateFeedback({ limitation })}
        />
        <VolumeAdjustmentControl value={feedback.volumeAdjustment} onChange={setVolumeAdjustment} />
      </div>
    </div>
  );
}

function RecoverySummaryCard({
  muscleGroup,
  feedback,
  checkin,
}: {
  muscleGroup: MuscleGroup;
  feedback: MuscleFeedback;
  checkin?: RecoveryCheckin;
}) {
  const nextSetChange = feedbackSetDelta(feedback);
  const soreness = checkin?.soreness ?? feedback.soreness;
  const jointPain = checkin?.jointPain ?? feedback.jointPain;

  return (
    <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-950 dark:text-white">{muscleLabels[muscleGroup]}</div>
        <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
          {nextSetChange > 0 ? "+1 set" : nextSetChange < 0 ? "-1 set" : "Hold"}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[14px] border border-slate-200 bg-white/65 px-2 py-2 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Soreness</div>
          <div className="mt-1 text-sm font-semibold">{soreness}/4</div>
        </div>
        <div className="rounded-[14px] border border-slate-200 bg-white/65 px-2 py-2 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Ready</div>
          <div className="mt-1 text-sm font-semibold">{checkin ? `${checkin.readiness}/4` : "—"}</div>
        </div>
        <div className={`rounded-[14px] border px-2 py-2 ${jointPain >= 2 ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100" : "border-slate-200 bg-white/65 dark:border-white/10 dark:bg-white/[0.04]"}`}>
          <div className="text-[10px] font-semibold uppercase opacity-70">Joint</div>
          <div className="mt-1 text-sm font-semibold">{jointPain}/4</div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {checkin ? `Checked ${formatDateLabel(checkin.checkedAt)}` : "Next relevant check-in appears before the workout starts."}
      </div>
    </div>
  );
}

function MesoSetTargets({
  model,
  state,
}: {
  model: PlanModel;
  state: AppState;
}) {
  return (
    <div className="grid gap-2">
      {muscleOptions
        .filter((muscleGroup) => model.weeklySetTargets[muscleGroup] > 0)
        .map((muscleGroup) => (
          <div
            key={muscleGroup}
            className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div>
              <div className="text-sm font-semibold text-slate-950 dark:text-white">{muscleLabels[muscleGroup]}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {priorityLabels[state.musclePriorities[muscleGroup]]}
              </div>
            </div>
            <div className="text-right text-sm font-semibold text-slate-950 dark:text-white">
              {model.weeklySetTargets[muscleGroup]} sets
            </div>
          </div>
        ))}
    </div>
  );
}

function WeeklyScheduler({
  state,
  model,
  setState,
  goTo,
}: {
  state: AppState;
  model: PlanModel;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  goTo: (view: ViewId) => void;
}) {
  const { onMoved, moveNotice } = useWorkoutMoveNotice(state, setState);
  const [draft, setDraft] = useState({
    day: state.selectedScheduleDay,
    type: "meal" as ScheduleItemType,
    time: "12:00",
    title: "",
    detail: "",
    linkedDayId: model.split.days[0]?.id ?? "",
  });
  const weekStart = useMemo(() => startOfCurrentWeek(), []);
  const datedWorkouts = Array.from({ length: state.mesoLengthWeeks }, (_, index) =>
    workoutOccurrencesForWeek(state, model.split.days, index + 1)).flat();
  const completedWorkoutKeys = allCompletedWorkoutKeys(state);
  const datedWorkoutFor = (item: ScheduleItem) => item.id.startsWith("workout-occurrence:")
    ? datedWorkouts.find(occurrence => occurrence.sessionKey === item.id.slice("workout-occurrence:".length)) ?? null
    : null;
  const itemsForDate = (weekday: WeekdayId, dateKey: string): ScheduleItem[] => [
    ...state.scheduleItems.filter(item => item.type !== "workout" && item.day === weekday),
    ...datedWorkouts.filter(occurrence => occurrence.scheduledDate === dateKey).flatMap(occurrence => {
      const day = model.split.days.find(item => item.id === occurrence.dayId);
      if (!day) return [];
      const saved = state.scheduleItems.find(item => item.type === "workout" && item.linkedDayId === day.id);
      return [{ id: `workout-occurrence:${occurrence.sessionKey}`, day: weekday, time: saved?.time ?? "17:30",
        type: "workout" as ScheduleItemType, title: day.focus, detail: dayMuscleSummary(day), linkedDayId: day.id }];
    }),
  ];
  const itemIsDone = (item: ScheduleItem, dateKey: string) => {
    const occurrence = datedWorkoutFor(item);
    return occurrence ? completedWorkoutKeys.has(occurrence.sessionKey)
      : Boolean(state.scheduleCheckoffs[scheduleCheckoffKey(dateKey, item.id)]);
  };
  const workoutOptions = model.split.days.map((day) => ({ value: day.id, label: `${day.day} - ${day.focus}` }));
  const weekDays = weekdayOptions.map((option) => {
    const date = dateForWeekday(weekStart, option.value);
    const dateKey = localDateKey(date);
    const items = itemsForDate(option.value, dateKey);
    const done = items.filter((item) => itemIsDone(item, dateKey)).length;
    return {
      ...option,
      date,
      dateKey,
      items,
      done,
      total: items.length,
    };
  });
  const selectedDay = weekDays.find((day) => day.value === state.selectedScheduleDay) ?? weekDays[0];
  const selectedItems = sortScheduleItems(selectedDay.items);
  const weekTotal = weekDays.reduce((sum, day) => sum + day.total, 0);
  const weekDone = weekDays.reduce((sum, day) => sum + day.done, 0);
  const weekProgress = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
  const nextOpen = weekDays
    .flatMap((day) => sortScheduleItems(day.items).map((item) => ({ day, item })))
    .find(({ day, item }) => !itemIsDone(item, day.dateKey) && !state.skippedWorkouts[datedWorkoutFor(item)?.sessionKey ?? ""]);
  const openMesoSession = openWorkoutSessionForMesocycle(state.workoutSessions, state.mesocycleId);

  const selectDay = (day: WeekdayId) => {
    setState((prev) => ({ ...prev, selectedScheduleDay: day }));
    setDraft((prev) => ({ ...prev, day }));
  };

  const updateItem = (id: string, updates: Partial<ScheduleItem>) => {
    setState((prev) => ({
      ...prev,
      scheduleItems: sortScheduleItems(
        prev.scheduleItems.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                title: updates.title !== undefined ? updates.title : item.title,
                detail: updates.detail !== undefined ? updates.detail : item.detail,
              }
            : item
        )
      ),
    }));
  };

  const moveWorkoutItemToDay = (item: ScheduleItem, day: WeekdayId) => {
    const occurrence = datedWorkoutFor(item);
    if (!occurrence) return;
    const targetDay = weekDays.find((option) => option.value === day);
    if (!targetDay) return;
    setState((prev) => {
      const result = moveWorkoutOccurrence({ occurrence, dateOverrides: prev.workoutDateOverrides,
        targetDate: targetDay.dateKey, completedSessionKeys: allCompletedWorkoutKeys(prev), skippedWorkouts: prev.skippedWorkouts });
      return result.changed ? { ...prev, selectedScheduleDay: day, activeDayId: null, workoutDateOverrides: { ...result.dateOverrides } } : prev;
    });
    setDraft((prev) => ({ ...prev, day }));
  };

  const removeItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      scheduleItems: prev.scheduleItems.filter((item) => item.id !== id),
      scheduleCheckoffs: Object.fromEntries(
        Object.entries(prev.scheduleCheckoffs).filter(([key]) => !key.endsWith(`:${id}`))
      ),
    }));
  };

  const toggleItem = (item: ScheduleItem, dateKey: string) => {
    const key = scheduleCheckoffKey(dateKey, item.id);
    setState((prev) => {
      const scheduleCheckoffs = { ...prev.scheduleCheckoffs };
      if (scheduleCheckoffs[key]) delete scheduleCheckoffs[key];
      else scheduleCheckoffs[key] = true;
      return { ...prev, scheduleCheckoffs };
    });
  };

  const linkedWorkoutFor = (item: ScheduleItem) =>
    model.split.days.find((day) => day.id === item.linkedDayId) ??
    model.split.days.find((day) => weekdayFromLabel(day.day) === item.day) ??
    model.split.days[0] ??
    null;

  const startScheduledWorkout = (item: ScheduleItem) => {
    if (openMesoSession) {
      setState((prev) => ({
        ...prev,
        currentWeek: openMesoSession.weekNumber,
        activeDayId: openMesoSession.dayId,
        deloadMode: openMesoSession.weekNumber >= prev.mesoLengthWeeks,
        mesoPaused: false,
        workoutPaused: openMesoSession.status === "paused",
      }));
      goTo("today");
      return;
    }
    const linked = linkedWorkoutFor(item);
    if (!linked) return;
    const occurrence = datedWorkoutFor(item);
    if (!occurrence || state.skippedWorkouts[occurrence.sessionKey]) return;
    setState((prev) => ({ ...prev, currentWeek: occurrence.weekNumber, activeDayId: linked.id,
      deloadMode: occurrence.weekNumber >= prev.mesoLengthWeeks, mesoPaused: false }));
    goTo("today");
  };

  const addItem = () => {
    const linkedWorkout = draft.type === "workout" ? model.split.days.find((day) => day.id === draft.linkedDayId) ?? null : null;
    const title = draft.title.trim() || linkedWorkout?.focus || scheduleDefaultTitle(draft.type);
    const detail = draft.detail.trim() || (linkedWorkout ? dayMuscleSummary(linkedWorkout) : "");
    const item: ScheduleItem = {
      id: `schedule-${draft.type}-${Date.now()}`,
      day: draft.day,
      time: draft.time,
      type: draft.type,
      title,
      detail: detail || undefined,
      linkedDayId: linkedWorkout?.id,
    };

    setState((prev) => ({
      ...prev,
      selectedScheduleDay: draft.day,
      scheduleItems: sortScheduleItems([...prev.scheduleItems, item]),
    }));
    setDraft((prev) => ({ ...prev, title: "", detail: "" }));
  };

  const syncSplitWorkouts = () => {
    setState((prev) => {
      const existingById = new Map(prev.scheduleItems.map((item) => [item.id, item]));
      const generatedWorkoutItems = model.split.days.map((day) => {
        const id = splitScheduleItemId(day.id);
        const existing = existingById.get(id) ?? existingById.get(`schedule-workout-${day.id}`);
        return {
          id,
          day: existing?.day ?? weekdayFromLabel(day.day),
          time: existing?.time ?? "17:30",
          type: "workout" as ScheduleItemType,
          title: day.focus,
          detail: dayMuscleSummary(day),
          linkedDayId: day.id,
        };
      });

      return {
        ...prev,
        scheduleItems: sortScheduleItems([
          ...prev.scheduleItems.filter((item) => !isGeneratedSplitScheduleItem(item, model.split.days)),
          ...generatedWorkoutItems,
        ]),
      };
    });
  };

  const clearWeek = () => {
    const weekDateKeys = new Set(weekDays.map((day) => day.dateKey));
    setState((prev) => ({
      ...prev,
      scheduleCheckoffs: Object.fromEntries(
        Object.entries(prev.scheduleCheckoffs).filter(([key]) => !weekDateKeys.has(key.slice(0, 10)))
      ),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary">Week planner</Badge>
            <CardTitle className="mt-3 text-3xl">Schedule</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {weekDone}/{weekTotal} items complete this week
              {nextOpen ? ` · next open: ${formatScheduleTime(nextOpen.item.time)} ${nextOpen.item.title}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Workout dates come from your split and one-time moves. Only saved workouts count complete; reminder checkoffs do not log training.</p>
            <div className="mt-3">{moveNotice}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={clearWeek}>
              <RotateCcw className="h-4 w-4" />
              Clear reminder checkoffs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-950 dark:text-white">
              <span>Weekly completion</span>
              <span>{weekProgress}%</span>
            </div>
            <Progress value={weekProgress} className="mt-3" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-[16px] border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                {weekDone} done
              </div>
              <div className="rounded-[16px] border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                {Math.max(0, weekTotal - weekDone)} not completed
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {weekDays.map((day) => {
              const active = day.value === selectedDay.value;
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => selectDay(day.value)}
                  className={[
                    "rounded-[18px] border px-3 py-3 text-left transition",
                    active
                      ? "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100"
                      : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
                  ].join(" ")}
                >
                  <div className="text-xs font-semibold uppercase opacity-70">{day.short}</div>
                  <div className="mt-1 text-sm font-semibold">
                    {day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div className="mt-2 text-xs opacity-75">
                    {day.done}/{day.total || 0} done
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => {
              const done = itemIsDone(item, selectedDay.dateKey);
              const Icon = scheduleTypeIcons[item.type];
              const linkedWorkout = item.type === "workout" ? linkedWorkoutFor(item) : null;
              const occurrence = datedWorkoutFor(item);
              if (occurrence) {
                const skipped = !done && Boolean(state.skippedWorkouts[occurrence.sessionKey]);
                const open = state.workoutSessions[occurrence.sessionKey]?.status;
                return <section key={item.id} className="rounded-[24px] border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">Week {occurrence.weekNumber} · {formatScheduleTime(item.time)}</div>
                      <h3 className="mt-1 font-semibold">{item.title}</h3>
                      <div className="mt-1 text-sm text-slate-500">{done ? "Workout saved" : skipped ? "Skipped — reopen from Split" : open === "paused" ? "Paused — your sets are saved" : open === "active" ? "Workout in progress" : item.detail}</div>
                    </div>
                    <Button variant="outline" className="min-h-11" disabled={skipped} onClick={() => startScheduledWorkout(item)}>
                      {done ? "View workout" : open === "active" || open === "paused" ? "Resume workout" : "Open workout"}
                    </Button>
                  </div>
                  <WorkoutDateControl key={occurrence.sessionKey} state={state} occurrence={occurrence} title={item.title} setState={setState} onMoved={onMoved} />
                </section>;
              }

              return (
                <div
                  key={item.id}
                  className={[
                    "rounded-[24px] border p-3 transition",
                    done
                      ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                      : "border-slate-200 bg-white/72 dark:border-white/10 dark:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <div className="grid gap-3 lg:grid-cols-[46px_88px_140px_minmax(0,1fr)_auto] lg:items-start">
                    <button
                      type="button"
                      onClick={() => toggleItem(item, selectedDay.dateKey)}
                      aria-label={`${done ? "Mark open" : "Mark complete"} ${item.title}`}
                      className={[
                        "grid h-11 w-11 place-items-center rounded-[16px] border text-sm font-semibold transition",
                        done
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-100"
                          : "border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
                      ].join(" ")}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </button>

                    <Input
                      aria-label={`${item.title} time`}
                      type="time"
                      value={item.time}
                      onChange={(event) => updateItem(item.id, { time: event.target.value })}
                    />

                    <SelectField<ScheduleItemType>
                      value={item.type}
                      onChange={(type) =>
                        updateItem(item.id, {
                          type,
                          title: item.title || scheduleDefaultTitle(type),
                          linkedDayId: type === "workout" ? item.linkedDayId || model.split.days[0]?.id : undefined,
                        })
                      }
                      options={scheduleTypeOptions.filter(option => option.value !== "workout")}
                    />

                    <div className="grid gap-2">
                      <Input
                        aria-label={`${item.title} title`}
                        value={item.title}
                        onChange={(event) => updateItem(item.id, { title: event.target.value })}
                      />
                      {item.type === "workout" ? (
                        <Field label="Move workout to">
                          <SelectField<WeekdayId>
                            value={item.day}
                            onChange={(day) => moveWorkoutItemToDay(item, day)}
                            options={weekdayOptions.map((day) => ({ value: day.value, label: day.label }))}
                          />
                        </Field>
                      ) : null}
                      {item.type === "workout" && workoutOptions.length > 0 ? (
                        <SelectField<string>
                          value={linkedWorkout?.id ?? ""}
                          onChange={(linkedDayId) => {
                            const nextWorkout = model.split.days.find((day) => day.id === linkedDayId) ?? null;
                            updateItem(item.id, {
                              linkedDayId: nextWorkout?.id,
                              title: nextWorkout?.focus || item.title,
                              detail: nextWorkout ? dayMuscleSummary(nextWorkout) : item.detail,
                            });
                          }}
                          options={[{ value: "", label: "Match by day" }, ...workoutOptions]}
                        />
                      ) : null}
                      <Input
                        aria-label={`${item.title} details`}
                        placeholder={item.type === "medication" ? "Dose or note you entered" : "Details"}
                        value={item.detail ?? ""}
                        onChange={(event) => updateItem(item.id, { detail: event.target.value })}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Badge variant="outline" className={scheduleTypeTone[item.type]}>
                        {formatScheduleTime(item.time)}
                      </Badge>
                      {item.type === "workout" ? (
                        <Button size="sm" className="gap-2" onClick={() => startScheduledWorkout(item)} disabled={!linkedWorkout}>
                          <PlayCircle className="h-4 w-4" />
                          Start
                        </Button>
                      ) : item.type === "meal" ? (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => goTo("food")}>
                          <Utensils className="h-4 w-4" />
                          Food
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/52 p-5 text-sm text-slate-500 dark:border-white/12 dark:bg-white/[0.025] dark:text-slate-400">
              No items scheduled for {selectedDay.label}.
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-[26px] border border-slate-200 bg-white/64 p-4 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">Add a reminder</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage workout sessions and their dates in Split.</p>
          <div className="grid gap-3 md:grid-cols-[140px_145px_112px_minmax(0,1fr)]">
            <SelectField<WeekdayId>
              value={draft.day}
              onChange={(day) => setDraft((prev) => ({ ...prev, day }))}
              options={weekdayOptions.map((day) => ({ value: day.value, label: day.label }))}
            />
            <SelectField<ScheduleItemType>
              value={draft.type}
              onChange={(type) =>
                setDraft((prev) => ({
                  ...prev,
                  type,
                  title: prev.title || scheduleDefaultTitle(type),
                  linkedDayId: type === "workout" ? prev.linkedDayId || model.split.days[0]?.id || "" : "",
                }))
              }
                options={scheduleTypeOptions.filter(option => option.value !== "workout")}
            />
            <Input
              aria-label="New schedule item time"
              type="time"
              value={draft.time}
              onChange={(event) => setDraft((prev) => ({ ...prev, time: event.target.value }))}
            />
            <Input
              aria-label="New schedule item title"
              placeholder="Title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
          </div>
          {draft.type === "workout" && workoutOptions.length > 0 ? (
            <SelectField<string>
              value={draft.linkedDayId}
              onChange={(linkedDayId) => {
                const linkedWorkout = model.split.days.find((day) => day.id === linkedDayId);
                setDraft((prev) => ({
                  ...prev,
                  linkedDayId,
                  title: linkedWorkout?.focus || prev.title,
                  detail: linkedWorkout ? dayMuscleSummary(linkedWorkout) : prev.detail,
                }));
              }}
              options={workoutOptions}
            />
          ) : null}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              aria-label="New schedule item details"
              placeholder={draft.type === "medication" ? "Dose or note you enter" : "Details"}
              value={draft.detail}
              onChange={(event) => setDraft((prev) => ({ ...prev, detail: event.target.value }))}
            />
            <Button className="gap-2" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useWorkoutMoveNotice(state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>) {
  const [latestMove, setLatestMove] = useState<{ undo: WorkoutMoveUndo; date: string } | null>(null);
  const [notice, setNotice] = useState("");
  const onMoved = (undo: WorkoutMoveUndo, date: string) => {
    setLatestMove({ undo, date });
    setNotice(`Moved to ${date}. Sets, targets, and other weeks are unchanged.`);
  };
  const undoMove = () => {
    if (!latestMove) return;
    const result = undoWorkoutOccurrenceMove({ dateOverrides: state.workoutDateOverrides, undo: latestMove.undo,
      completedSessionKeys: allCompletedWorkoutKeys(state), skippedWorkouts: state.skippedWorkouts });
    if (result.changed) setState(prev => {
      const current = undoWorkoutOccurrenceMove({ dateOverrides: prev.workoutDateOverrides, undo: latestMove.undo,
        completedSessionKeys: allCompletedWorkoutKeys(prev), skippedWorkouts: prev.skippedWorkouts });
      return current.changed ? { ...prev, workoutDateOverrides: { ...current.dateOverrides }, activeDayId: null } : prev;
    });
    setNotice(result.changed ? "Previous workout date restored." : "The workout changed since this move. Its current date was kept.");
    setLatestMove(null);
  };
  const moveNotice = notice ? <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100">
    <span>{notice}</span>
    {latestMove ? <Button variant="outline" size="sm" className="min-h-11" onClick={undoMove}>Undo move</Button> : null}
  </div> : null;
  return { onMoved, moveNotice };
}

function WorkoutDateControl({ state, occurrence, title, setState, onMoved }: {
  state: AppState;
  occurrence: WorkoutOccurrence;
  title: string;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onMoved: (undo: WorkoutMoveUndo, date: string) => void;
}) {
  const [targetDate, setTargetDate] = useState(occurrence.scheduledDate ?? localDateKey(new Date()));
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setTargetDate(occurrence.scheduledDate ?? localDateKey(new Date()));
  }, [occurrence.sessionKey, occurrence.scheduledDate]);
  const resolved = allCompletedWorkoutKeys(state).has(occurrence.sessionKey) || Boolean(state.skippedWorkouts[occurrence.sessionKey]);
  const move = () => {
    const result = moveWorkoutOccurrence({ occurrence, dateOverrides: state.workoutDateOverrides, targetDate,
      completedSessionKeys: allCompletedWorkoutKeys(state), skippedWorkouts: state.skippedWorkouts });
    if (!result.changed) {
      setNotice(result.reason === "unchanged" ? "This workout is already scheduled for that date." : "This workout cannot be moved. Choose a valid date for an unresolved session.");
      return;
    }
    setState(prev => {
      if ((prev.workoutDateOverrides[occurrence.sessionKey] ?? null) !== (state.workoutDateOverrides[occurrence.sessionKey] ?? null)) return prev;
      const current = moveWorkoutOccurrence({ occurrence, dateOverrides: prev.workoutDateOverrides, targetDate,
        completedSessionKeys: allCompletedWorkoutKeys(prev), skippedWorkouts: prev.skippedWorkouts });
      return current.changed ? { ...prev, workoutDateOverrides: { ...current.dateOverrides }, activeDayId: null } : prev;
    });
    if (result.undo) onMoved(result.undo, targetDate);
    setNotice("");
  };
  return <div className="mt-3 rounded-[18px] border border-slate-200 px-3 py-3 text-sm dark:border-white/10">
    <div className="font-medium text-slate-700 dark:text-slate-200">
      Scheduled {occurrence.scheduledDate ?? "date not set"}
      {occurrence.moved ? ` · Moved from ${occurrence.plannedDate ?? "unscheduled"}` : ""}
    </div>
    {!resolved ? <details className="mt-2">
      <summary className="min-h-11 cursor-pointer py-3 font-semibold">Move this workout</summary>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input type="date" aria-label={`New date for ${title}`} value={targetDate}
          onInput={event => setTargetDate(event.currentTarget.value)} onChange={event => setTargetDate(event.currentTarget.value)} />
        <Button variant="outline" className="min-h-11" disabled={!isWorkoutDate(targetDate)} onClick={move}>Move once</Button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Only week {occurrence.weekNumber} changes. Moving does not complete or skip the workout; an open session stays resumable.</p>
    </details> : null}
    {notice ? <div role="status" className="mt-2 text-xs text-slate-600 dark:text-slate-300">{notice}</div> : null}
  </div>;
}

export function trackerContextFor(state: AppState, today: string): TrackerContext {
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - 13 * 86400000).toISOString().slice(0, 10);
  const recent = (timestamp: string) => {
    if (!Number.isFinite(Date.parse(timestamp))) return false;
    const date = foodDiaryDateKey(new Date(timestamp));
    return date >= from && date <= today;
  };
  return {
    completedWorkouts: new Set(state.workoutHistory.filter(h => recent(h.completedAt)).map(h => h.sessionKey)).size,
    recoveryFlags: Object.values(state.recoveryCheckins).filter(c => !c.skipped && recent(c.checkedAt) && (c.jointPain >= 3 || c.readiness <= 1 || c.performanceExpectation === "below")).length,
  };
}

export function applyTrackerProgramUpdate(state: AppState, next: WeightMacroProgram | null): AppState {
  if (next === state.trackerProgram) return state;
  let bodyWeightHistory = state.bodyWeightHistory;
  for (const check of next?.checkins ?? []) {
    if (check.weight == null || check.weight <= 0) continue;
    const previous = state.trackerProgram?.checkins.find(c => c.date === check.date);
    // Unit conversion changes stored units, not the canonical measurement or its timestamp.
    const onlyChangedUnits = previous && state.trackerProgram?.settings.weightUnit !== next.settings.weightUnit && previous.recordedAt === check.recordedAt;
    if (onlyChangedUnits || (previous?.weight === check.weight && previous?.recordedAt === check.recordedAt)) continue;
    bodyWeightHistory = upsertBodyweightForLocalDay(bodyWeightHistory, { date: check.date, weightLb: check.weight * (next.settings.weightUnit === "kg" ? 1 / 0.45359237 : 1), recordedAt: check.recordedAt ?? null });
  }
  return { ...state, trackerProgram: next, bodyWeightHistory };
}

function TrackerAppSection({ state, model, setState, compact = false }: {
  state: AppState; model: PlanModel; setState: React.Dispatch<React.SetStateAction<AppState>>; compact?: boolean;
}) {
  const today = foodDiaryDateKey(new Date());
  return <WeightMacroTrackerPanel program={state.trackerProgram} sources={state} today={today} compact={compact} context={trackerContextFor(state, today)}
    initialSettings={createWeightMacroSettings({ startDate: today, startingWeight: state.bodyWeightLb, goalWeight: state.targetWeightLb,
      startingCalories: model.macros.calories, proteinBasis: "Manual fixed grams", proteinGrams: model.macros.protein, fatGrams: model.macros.fats,
      goalType: state.goal === "fat-loss" ? "Cut" : state.goal === "muscle-gain" ? "Gain" : state.goal === "recomposition" ? "Recomp" : "Maintain",
      manualWeeklyRate: state.goal === "fat-loss" ? 0.005 : state.goal === "muscle-gain" ? 0.0025 : 0,
      trainingDaysPerWeek: state.sessionsPerWeek })}
    onUpdate={update => setState(prev => applyTrackerProgramUpdate(prev, update(prev.trackerProgram, prev)))} />;
}

function HomeView({
  state, model, setState, goTo,
}: {
  state: AppState;
  model: PlanModel;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  goTo: (view: ViewId) => void;
}) {
  const nextWorkout = nextWorkoutFor(state, model.split.days);
  const today = activeSplitDay(model.split.days, state.activeDayId, state);
  const workoutWeek = nextWorkout.session?.weekNumber ?? nextWorkout.occurrence?.weekNumber ?? state.currentWeek;
  const sessionKey = nextWorkout.session?.sessionKey ?? nextWorkout.occurrence?.sessionKey ?? null;
  const session = sessionKey ? state.workoutSessions[sessionKey] : null;
  const completed = completedSessionKeysForWeek(state.workoutHistory, state.mesocycleId, state.currentWeek,
    plannedSessionKeysForWeek(model.split.days, state.mesocycleId, state.currentWeek)).size;
  const startToday = () => {
    if (!today) { goTo("training"); return; }
    setState(prev => ({
      ...prev, currentWeek: workoutWeek, activeDayId: today.id, mesoPaused: false,
      deloadMode: workoutWeek >= prev.mesoLengthWeeks, workoutPaused: session?.status === "paused",
    }));
    goTo("today");
  };
  const latestWeight = summarizeBodyweightHistory(state.bodyWeightHistory).latest;
  return (
    <div className="core-dashboard grid gap-3">
      <div className="core-metric-strip">
        <button type="button" className="text-left" onClick={() => goTo("food")}>
          <span className="block text-xs text-slate-400">Calories remaining</span>
          <strong className="block text-xl">{formatNumber(model.macros.remainingCalories)}</strong>
          <span className="text-xs text-slate-400">of {formatNumber(model.macros.calories)} target</span>
        </button>
        <button type="button" className="text-left" onClick={() => goTo("food")}>
          <span className="block text-xs text-slate-400">Protein remaining</span>
          <strong className="block text-xl">{model.macros.remainingProtein}g</strong>
          <span className="text-xs text-slate-400">{model.macros.protein}g target</span>
        </button>
        <button type="button" className="text-left" onClick={() => goTo("more")}>
          <span className="block text-xs text-slate-400">Latest weigh-in</span>
          <strong className="block text-xl">{latestWeight ? latestWeight.weightLb + " lb" : "—"}</strong>
          <span className="text-xs text-slate-400">{latestWeight?.date ?? "Log your first"}</span>
        </button>
      </div>
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,1fr)]">
        <Card className="core-next-workout">
          <CardContent className="grid gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="core-section-title">{session && session.status !== "completed" ? "Continue workout" : "Next workout"}</h1>
              <span className="text-xs text-slate-400">Week {workoutWeek}/{state.mesoLengthWeeks}</span>
            </div>
            {today ? <>
              <div><h2 className="text-2xl font-semibold">{today.focus}</h2>
                <p className="mt-1 text-sm text-slate-400">{dayMuscleSummary(today)}</p></div>
              <p className="text-sm text-slate-300">{nextWorkout.occurrence?.scheduledDate ?? "Date not scheduled"}
                {nextWorkout.kind === "planned" && nextWorkout.timing === "overdue" ? " · Not completed" : ""}
                {nextWorkout.kind === "planned" && nextWorkout.timing === "upcoming" ? " · Upcoming" : ""}
                {" · "}{today.lifts.length} lifts · {state.sessionMinutes} min</p>
              <Button className="min-h-11 gap-2" onClick={startToday}><Dumbbell className="h-4 w-4" />
                {session && session.status !== "completed" ? "Resume sets" : "Open workout"}</Button>
            </> : <>
              <p className="text-sm text-slate-300">All workouts in this selected week are resolved.</p>
              <Button onClick={() => goTo("training")}>Review next week</Button>
            </>}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
              <span>{completed}/{model.split.days.length} workouts completed this week</span>
              <Button variant="ghost" size="sm" onClick={() => goTo("training")}>Split</Button>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4">
          <details className="text-sm text-slate-400">
            <summary className="min-h-11 cursor-pointer"><span className="font-semibold text-slate-100">{model.primarySuggestion.title}</span><span className="mt-1 block text-xs">{model.trainingLoad} · Why this suggestion?</span></summary>
            <p className="my-3 text-sm text-slate-300">{model.primarySuggestion.detail}</p>
            <p>{model.recoveryEvidenceCount ? model.recoveryEvidenceCount + " muscle check-ins recorded today." : "No dated recovery check-in today; profile defaults are not observations."}
              {" "}Your current training week and saved restrictions determine the programmed effort. Logged set results—not a generic readiness score—determine lift-specific progression.</p>
          </details>
        </CardContent></Card>
      </div>
      <TrackerAppSection state={state} model={model} setState={setState} compact />
    </div>
  );
}

function TodayView({
  state,
  model,
  setState,
  goTo,
}: {
  state: AppState;
  model: PlanModel;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  goTo: (view: ViewId) => void;
}) {
  const { onMoved, moveNotice } = useWorkoutMoveNotice(state, setState);
  const [replacementTarget, setReplacementTarget] = useState<ReplacementTarget | null>(null);
  const [techniqueTarget, setTechniqueTarget] = useState<string | null>(null);
  const [expandedLiftId, setExpandedLiftId] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);
  const [showAbandonPrompt, setShowAbandonPrompt] = useState(false);
  const [editingRecovery, setEditingRecovery] = useState(false);
  const [workoutMessage, setWorkoutMessage] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const [addExerciseMuscle, setAddExerciseMuscle] = useState<MuscleGroup>("chest");
  const [now, setNow] = useState(Date.now());
  const nextWorkout = nextWorkoutFor(state, model.split.days, true);
  const plannedToday = model.split.days.find(day => day.id === (nextWorkout.session?.dayId ?? nextWorkout.occurrence?.dayId)) ?? null;
  const activeSessionKey = nextWorkout.session?.sessionKey ?? nextWorkout.occurrence?.sessionKey ?? null;
  const activeSession = activeSessionKey ? state.workoutSessions[activeSessionKey] ?? null : null;
  const workoutOccurrence = nextWorkout.occurrence ?? (activeSession
    ? workoutOccurrencesForWeek(state, model.split.days, activeSession.weekNumber).find(item => item.sessionKey === activeSession.sessionKey) ?? null
    : null);
  useEffect(() => setEditingRecovery(false), [activeSessionKey]);
  useEffect(() => {
    if (!activeSession || activeSession.status === "completed" || activeSession.weekNumber === state.currentWeek) return;
    setState(prev => prev.mesocycleId === activeSession.mesocycleId && prev.currentWeek !== activeSession.weekNumber
      ? { ...prev, currentWeek: activeSession.weekNumber, deloadMode: activeSession.weekNumber >= prev.mesoLengthWeeks }
      : prev);
  }, [activeSessionKey, activeSession?.status, activeSession?.weekNumber, state.currentWeek, setState]);
  const workoutIsPaused = activeSession?.status === "paused";
  const otherOpenSession = Object.values(state.workoutSessions).find(
    (session) =>
      session.mesocycleId === state.mesocycleId &&
      session.status !== "completed" &&
      session.sessionKey !== activeSessionKey
  ) ?? null;
  const today: SplitDay | null = activeSession ? splitDayFromSession(activeSession, plannedToday) : plannedToday;
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    if (!activeSession || activeSession.status !== "active") return undefined;
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [activeSessionKey, activeSession?.status]);

  useEffect(() => {
    if (
      !state.restTimer ||
      state.restTimer.sessionKey !== activeSessionKey ||
      workoutIsPaused ||
      state.restTimer.endsAt > now
    ) return;
    setState((prev) =>
      prev.restTimer?.sessionKey === activeSessionKey && prev.restTimer.setId === state.restTimer?.setId
        ? { ...prev, restTimer: null }
        : prev
    );
  }, [activeSessionKey, now, setState, state.restTimer, workoutIsPaused]);

  useEffect(() => {
    if (!today?.lifts[0]) return;
    setAddExerciseMuscle((current) =>
      today.lifts.some((liftItem) => liftItem.muscleGroup === current) ? current : today.lifts[0].muscleGroup
    );
  }, [today?.id, today?.lifts]);

  useEffect(() => {
    setExpandedLiftId(null);
    setReplacementTarget(null);
    setTechniqueTarget(null);
  }, [state.mesocycleId, state.currentWeek, today?.id]);

  const replaceLift = (
    dayId: string,
    liftId: string,
    next: WorkoutLift,
    canTransferProgressionHistory: boolean
  ) => {
    const currentExerciseLogs = activeSession ? sessionSetLogsForExercise(activeSession, liftId) : [];
    const hasResolvedWork = currentExerciseLogs.some((setItem) => setItem.done || setItem.skipped);
    const hasUnresolvedInput = currentExerciseLogs.some(
      (setItem) => !setItem.done && !setItem.skipped && Boolean(setItem.inputEdited)
    );
    if (hasUnresolvedInput) {
      setWorkoutMessage({
        tone: "warning",
        text: "Finish, skip, or clear the edited open set before replacing this exercise.",
      });
      return;
    }
    const replacementTimestamp = new Date().toISOString();
    if (hasResolvedWork) {
      const remainingSetCount = currentExerciseLogs.filter((setItem) => !setItem.done && !setItem.skipped).length;
      setState((prev) => {
        const base = prev.customSplit ?? cloneSplitForEditing(model.baseSplit.days);
        const sessionKey = activeSession.sessionKey;
        const currentSession = prev.workoutSessions[sessionKey];
        if (!currentSession || currentSession.status !== "active") return prev;
        let nextSession = currentSession;
        currentExerciseLogs
          .filter((setItem) => !setItem.done && !setItem.skipped)
          .forEach((setItem) => {
            nextSession = removeSessionWorkoutSet(nextSession, setItem.id, replacementTimestamp);
          });
        if (remainingSetCount > 0) {
          const previous = latestHistoryForLift(prev.workoutHistory, next);
          const targetRir = currentSession.exercises
            .find((exercise) => exercise.id === liftId)
            ?.prescriptions[0]?.targetRir ?? workoutTargetRir;
          const replacementSlotId = `${liftId}-replacement-${Date.parse(replacementTimestamp).toString(36)}`;
          nextSession = addSessionWorkoutExercise(
            nextSession,
            {
              ...next,
              id: replacementSlotId,
              slotId: replacementSlotId,
              exerciseId: next.exerciseId ?? slug(next.name),
              loadRequired: !liftPermitsZeroLoad(next),
              targetRir,
              sets: Array.from({ length: remainingSetCount }, (_, setIndex) => {
                const recommendation = recommendWorkoutSet(prev, next, setIndex, targetRir, sessionKey);
                return {
                  id: `${replacementSlotId}-set-${setIndex + 1}`,
                  recommendedWeight: recommendation.weight,
                  recommendedReps: recommendation.reps,
                  recommendationReason: recommendation.reason,
                  reps: next.reps,
                  targetRir: recommendation.rir,
                  previousResult: previousSetForRecommendation(previous, setIndex, { allowZeroLoad: liftPermitsZeroLoad(next) }),
                };
              }),
            },
            replacementTimestamp
          );
          const originalIndex = nextSession.exercises.findIndex((exercise) => exercise.id === liftId);
          let replacementIndex = nextSession.exercises.findIndex((exercise) => exercise.id === replacementSlotId);
          while (replacementIndex > originalIndex + 1) {
            nextSession = moveSessionWorkoutExercise(nextSession, replacementSlotId, -1, replacementTimestamp);
            replacementIndex -= 1;
          }
        }
        const workoutLog = { ...prev.workoutLog };
        nextSession.exercises.forEach((exercise) => {
          workoutLog[workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, exercise.id)] =
            sessionSetLogsForExercise(nextSession, exercise.id).map(({ id, weight, reps, rir, done, skipped }) => ({
              id,
              weight,
              reps,
              rir,
              done,
              skipped,
            }));
        });
        return {
          ...prev,
          restTimer:
            prev.restTimer?.sessionKey === sessionKey && prev.restTimer.liftId === liftId
              ? null
              : prev.restTimer,
          workoutLog,
          workoutSessions: { ...prev.workoutSessions, [sessionKey]: nextSession },
          customSplit: base.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  lifts: day.lifts.map((item) =>
                    item.id === liftId ? { ...next, id: item.id, sets: item.sets } : item
                  ),
                }
              : day
          ),
        };
      });
      setWorkoutMessage({
        tone: "success",
        text:
          remainingSetCount > 0
            ? `Completed sets stay with the original exercise; ${remainingSetCount} open ${remainingSetCount === 1 ? "set moves" : "sets move"} to ${next.name}.`
            : `${next.name} will replace this exercise in future sessions; today’s completed work keeps its original history.`,
      });
      setReplacementTarget(null);
      setTechniqueTarget(null);
      return;
    }
    setState((prev) => {
      const base = prev.customSplit ?? cloneSplitForEditing(model.baseSplit.days);
      const sessionKey = activeSession?.sessionKey ?? activeSessionKey;
      if (!sessionKey || !sessionKey.startsWith(`${prev.mesocycleId}:`)) return prev;
      const currentSession = prev.workoutSessions[sessionKey];
      if (currentSession && currentSession.status !== "active") return prev;
      const nextSession = currentSession
        ? replaceSessionWorkoutExercise(
            currentSession,
            liftId,
            {
              exerciseId: next.exerciseId ?? slug(next.name),
              name: next.name,
              muscleGroup: next.muscleGroup,
              pattern: next.pattern,
              target: next.target,
              loadRequired: !liftPermitsZeroLoad(next),
            },
            replacementTimestamp,
            { preserveProgression: canTransferProgressionHistory }
          )
        : null;
      const workoutLog = { ...prev.workoutLog };
      if (nextSession) {
        workoutLog[workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, liftId)] =
          sessionSetLogsForExercise(nextSession, liftId).map(({ id, weight, reps, rir, done, skipped }) => ({
            id,
            weight,
            reps,
            rir,
            done,
            skipped,
          }));
      }
      return {
        ...prev,
        restTimer:
          prev.restTimer?.sessionKey === sessionKey && prev.restTimer.liftId === liftId
            ? null
            : prev.restTimer,
        workoutLog,
        workoutSessions: nextSession
          ? { ...prev.workoutSessions, [sessionKey]: nextSession }
          : prev.workoutSessions,
        customSplit: base.map((day) =>
          day.id === dayId
            ? {
                ...day,
                lifts: day.lifts.map((item) =>
                  item.id === liftId ? { ...next, id: item.id, sets: item.sets } : item
                ),
              }
            : day
        ),
      };
    });
    setReplacementTarget(null);
    setTechniqueTarget(null);
  };

  if (!today) {
    return (
      <Card>
        <CardContent className="grid min-h-[320px] place-items-center p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]">
              <Dumbbell className="h-5 w-5 text-rose-500" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{model.split.days.length ? "This week is resolved" : "No workout is scheduled"}</h2>
            <div className="mt-3">{moveNotice}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {workoutMessage?.text ?? (model.split.days.length ? "Review a saved workout or choose another week in your training plan." : "Add a training day or choose a template before starting a workout.")}
            </p>
            <Button className="mt-5 gap-2" onClick={() => goTo("training")}>
              <CalendarDays className="h-4 w-4" />
              Open training plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentRecoveryCheckins = Object.values(state.recoveryCheckins).filter(
    (checkin) => checkin.sessionKey === activeSessionKey && !checkin.skipped
  );
  const recoveryRisk = currentRecoveryCheckins.some(
    (checkin) =>
      checkin.soreness >= 3 ||
      checkin.readiness <= 1 ||
      checkin.jointPain >= 2 ||
      checkin.performanceExpectation === "below"
  );
  const recoveryStop = currentRecoveryCheckins.some((checkin) => checkin.jointPain >= 4);
  const frozenSessionTargetRir = activeSession?.exercises
    .flatMap((exercise) => exercise.prescriptions)
    .map((prescription) => prescription.targetRir)[0];
  const workoutTargetRir = frozenSessionTargetRir ?? (recoveryRisk ? Math.min(4, model.targetRir + 1) : model.targetRir);
  const recentExposureSessionKeys = Array.from(
    new Set(
      [...state.workoutHistory]
        .filter((entry) => entry.sessionKey !== activeSessionKey)
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
        .map((entry) => entry.sessionKey)
    )
  ).slice(0, 2);
  const relevantRecoveryMuscles = Array.from(new Set(today.lifts.map((liftItem) => liftItem.muscleGroup))).filter(
    (muscleGroup) =>
      state.workoutHistory.some(
        (entry) => entry.muscleGroup === muscleGroup && recentExposureSessionKeys.includes(entry.sessionKey)
      )
  );
  const missingRecoveryMuscles = relevantRecoveryMuscles.filter(
    (muscleGroup) =>
      !state.recoveryCheckins[recoveryCheckinKey(activeSessionKey ?? "", muscleGroup)]
  );
  const recoveryDraftMuscles =
    missingRecoveryMuscles.length > 0
      ? missingRecoveryMuscles
      : recoveryStop || editingRecovery
        ? Array.from(new Set([...relevantRecoveryMuscles, ...currentRecoveryCheckins.map(checkin => checkin.muscleGroup)]))
        : [];
  const recoveryDrafts: RecoveryCheckinDraft[] = recoveryDraftMuscles.map((muscleGroup) => {
    const existing = state.recoveryCheckins[recoveryCheckinKey(activeSessionKey ?? "", muscleGroup)];
    const feedback = state.muscleFeedback[muscleGroup];
    return {
      muscleGroup,
      label: muscleLabels[muscleGroup],
      soreness: existing?.soreness ?? feedback.soreness,
      readiness: existing?.readiness ?? clamp(4 - feedback.soreness + (feedback.workload <= 2 ? 1 : 0), 0, 4),
      jointPain: existing?.jointPain ?? feedback.jointPain,
      performanceExpectation: existing?.performanceExpectation ?? "steady",
    };
  });

  const saveRecoveryCheckins = (drafts: RecoveryCheckinDraft[], skipped = false) => {
    if (!activeSessionKey) return;
    const checkedAt = new Date().toISOString();
    setState((prev) => {
      const recoveryCheckins = { ...prev.recoveryCheckins };
      drafts.forEach((draft) => {
        if (!muscleOptions.includes(draft.muscleGroup as MuscleGroup)) return;
        const muscleGroup = draft.muscleGroup as MuscleGroup;
        const key = recoveryCheckinKey(activeSessionKey, muscleGroup);
        // Skipping an edit never replaces an already saved recovery assessment.
        if (skipped && recoveryCheckins[key] && !recoveryCheckins[key].skipped) return;
        recoveryCheckins[key] = {
          id: key,
          sessionKey: activeSessionKey,
          muscleGroup,
          checkedAt,
          soreness: clamp(draft.soreness, 0, 4),
          readiness: clamp(draft.readiness, 0, 4),
          jointPain: clamp(draft.jointPain, 0, 4),
          performanceExpectation: draft.performanceExpectation,
          skipped,
        };
      });
      return { ...prev, recoveryCheckins };
    });
    setEditingRecovery(false);
  };

  const startWorkout = () => {
    if (!plannedToday || activeSession || otherOpenSession || recoveryStop || missingRecoveryMuscles.length > 0) return;
    const startedAt = new Date().toISOString();
    setState((prev) => {
      const sessionKey = workoutSessionKey(prev.mesocycleId, prev.currentWeek, plannedToday.id);
      if (sessionKey !== activeSessionKey || allCompletedWorkoutKeys(prev).has(sessionKey) || prev.skippedWorkouts[sessionKey]) return prev;
      if (prev.workoutSessions[sessionKey]) return prev;
      if (Object.values(prev.recoveryCheckins).some(checkin => checkin.sessionKey === sessionKey && !checkin.skipped && checkin.jointPain >= 4)) return prev;
      if (
        Object.values(prev.workoutSessions).some(
          (session) =>
            session.mesocycleId === prev.mesocycleId &&
            session.status !== "completed" &&
            session.sessionKey !== sessionKey
        )
      ) return prev;
      const hasRecoveryRisk = Object.values(prev.recoveryCheckins).some(
        (checkin) =>
          checkin.sessionKey === sessionKey &&
          !checkin.skipped &&
          (checkin.soreness >= 3 ||
            checkin.readiness <= 1 ||
            checkin.jointPain >= 2 ||
            checkin.performanceExpectation === "below")
      );
      const sessionTargetRir = hasRecoveryRisk ? Math.min(4, model.targetRir + 1) : model.targetRir;
      const session = migrateLegacyWorkoutSession(
        {
          mesocycleId: prev.mesocycleId,
          weekNumber: prev.currentWeek,
          dayId: plannedToday.id,
          dayLabel: plannedToday.day,
          workoutName: plannedToday.focus,
          targetRir: sessionTargetRir,
          exercises: plannedToday.lifts.map((liftItem) => {
            const previous = latestHistoryForLift(prev.workoutHistory, liftItem);
            return {
              ...liftItem,
              slotId: liftItem.id,
              exerciseId: liftItem.exerciseId ?? slug(liftItem.name),
              loadRequired: !liftPermitsZeroLoad(liftItem),
              targetRir: sessionTargetRir,
              sets: Array.from({ length: Math.max(1, liftItem.sets) }, (_, setIndex) => {
                const safeRecommendation = recommendWorkoutSet(prev, liftItem, setIndex, sessionTargetRir, sessionKey);
                return {
                  id: `${liftItem.id}-set-${setIndex + 1}`,
                  recommendedWeight: safeRecommendation.weight,
                  recommendedReps: safeRecommendation.reps,
                  recommendationReason: safeRecommendation.reason,
                  reps: liftItem.reps,
                  targetRir: safeRecommendation.rir,
                  previousResult: previousSetForRecommendation(previous, setIndex, { allowZeroLoad: liftPermitsZeroLoad(liftItem) }),
                };
              }),
            };
          }),
          workoutLog: prev.workoutLog,
          workoutPaused: false,
          startedAt,
        },
        startedAt
      );
      const workoutLog = { ...prev.workoutLog };
      session.exercises.forEach((exercise) => {
        workoutLog[workoutLiftLogKey(prev.mesocycleId, prev.currentWeek, plannedToday.id, exercise.id)] =
          sessionSetLogsForExercise(session, exercise.id).map(({ id, weight, reps, rir, done, skipped }) => ({
            id,
            weight,
            reps,
            rir,
            done,
            skipped,
          }));
      });
      return {
        ...prev,
        workoutLog,
        workoutSessions: { ...prev.workoutSessions, [sessionKey]: session },
        workoutPaused: false,
        mesoPaused: false,
      };
    });
    setWorkoutMessage({ tone: "success", text: `${plannedToday.focus} started. Your targets are frozen for this session.` });
  };

  if (nextWorkout.kind === "review" && !activeSession) {
    const history = state.workoutHistory.filter(entry => entry.sessionKey === activeSessionKey);
    return <Card><CardContent className="grid gap-4 p-6">
      <h2 className="text-2xl font-semibold">{today.focus} · Saved workout</h2>
      <p className="text-sm text-slate-500">Week {nextWorkout.occurrence.weekNumber}. These are recorded results, not a new workout.</p>
      {history.map(entry => <div key={entry.id} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <div className="font-semibold">{entry.liftName}</div>
        <div className="mt-1 text-sm">{entry.sets.filter(set => !set.skipped).map(set => `${set.weight} lb × ${set.reps}`).join(" · ") || "No working sets"}</div>
      </div>)}
      <Button variant="outline" onClick={() => goTo("training")}>Back to training plan</Button>
    </CardContent></Card>;
  }

  if (!activeSession) {
    return (
      <div className="grid gap-5 pb-24 lg:pb-0">
        {moveNotice}
        {workoutMessage ? (
          <div role="status" className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100">
            {workoutMessage.text}
          </div>
        ) : null}
        {recoveryDrafts.length > 0 ? (
          <RecoveryCheckinCard
            key={`${activeSessionKey}:${recoveryDrafts.map((item) => item.muscleGroup).join("-")}`}
            items={recoveryDrafts}
            onSave={(drafts) => saveRecoveryCheckins(drafts)}
            onSkip={() => saveRecoveryCheckins(recoveryDrafts, true)}
            allowSkip={!recoveryStop}
            skipLabel={currentRecoveryCheckins.some(item => !item.skipped) ? "Keep saved check-in" : "Skip check-in"}
          />
        ) : null}
        {currentRecoveryCheckins.length > 0 && recoveryDrafts.length === 0 ? (
          <Button variant="outline" className="min-h-11 justify-self-start" onClick={() => setEditingRecovery(true)}>Edit readiness check-in</Button>
        ) : null}
        {recoveryRisk ? (
          <div role="status" className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
            Readiness feedback raised today&apos;s target to {workoutTargetRir} RIR. Load progression will stay conservative.
          </div>
        ) : null}
        {recoveryStop ? (
          <div role="alert" className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100">
            A stop-level joint score is recorded. Review and update the affected muscle&apos;s check-in above before starting. Skipping will not clear this flag.
          </div>
        ) : null}
        {otherOpenSession ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
            <span>{otherOpenSession.workoutName} is still {otherOpenSession.status}. Resume and finish it before starting another workout.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  currentWeek: otherOpenSession.weekNumber,
                  activeDayId: otherOpenSession.dayId,
                  deloadMode: otherOpenSession.weekNumber >= prev.mesoLengthWeeks,
                  workoutPaused: otherOpenSession.status === "paused",
                }))
              }
            >
              Resume workout
            </Button>
          </div>
        ) : null}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Pre-workout</Badge>
              <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">Week {state.currentWeek}</Badge>
              <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">{workoutTargetRir} RIR</Badge>
            </div>
            <CardTitle className="mt-3 text-3xl">{today.focus}</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{today.intent}</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Exercises" value={`${today.lifts.length}`} detail={dayMuscleSummary(today)} Icon={Dumbbell} />
              <StatCard label="Expected" value={`${state.sessionMinutes} min`} detail="Session duration" Icon={Clock3} />
              <StatCard label="Working sets" value={`${today.lifts.reduce((sum, liftItem) => sum + liftItem.sets, 0)}`} detail="Planned today" Icon={Gauge} />
            </div>
            <div className="grid gap-2">
              {today.lifts.map((liftItem) => (
                <div key={liftItem.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white/65 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{liftItem.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{movementTargetLabel(liftItem)}</div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">{liftItem.sets} × {liftItem.reps}</span>
                </div>
              ))}
            </div>
            {workoutOccurrence ? <WorkoutDateControl key={workoutOccurrence.sessionKey} state={state} occurrence={workoutOccurrence} title={today.focus} setState={setState} onMoved={onMoved} /> : null}
            <Button size="lg" className="min-h-12 gap-2" onClick={startWorkout} disabled={missingRecoveryMuscles.length > 0 || recoveryStop || Boolean(otherOpenSession)}>
              <PlayCircle className="h-5 w-5" />
              Start workout
            </Button>
            {missingRecoveryMuscles.length > 0 ? (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">Save or skip the brief recovery check-in before starting.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSession.status === "completed") {
    const completedHistory = state.workoutHistory.filter((entry) => entry.sessionKey === activeSession.sessionKey);
    const completedVolume = completedHistory.reduce((sum, entry) => sum + entry.totalVolume, 0);
    const completedWorkingSets = completedHistory.reduce((sum, entry) => sum + entry.sets.filter((setItem) => !setItem.skipped).length, 0);
    return (
      <Card>
        <CardContent className="grid min-h-[360px] place-items-center p-6 text-center">
          <div className="max-w-md">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">Workout saved</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {activeSession.workoutName} · {completedWorkingSets} working sets · {formatNumber(completedVolume)} lb·reps
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button onClick={() => goTo("home")}>Continue</Button>
              <Button variant="outline" onClick={() => goTo("more")}>View analytics</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSetsForLift = (liftItem: WorkoutLift) =>
    sessionSetLogsForExercise(activeSession, liftItem.id)
      .map(log => visibleSessionSetDraft(state, activeSession, liftItem, log.id))
      .filter((log): log is WorkoutSetLog => Boolean(log));
  const frozenRecommendationForSet = (liftItem: WorkoutLift, setIndex: number): SetRecommendation => {
    const prescription = activeSession.exercises
      .find((exercise) => exercise.id === liftItem.id)
      ?.prescriptions[setIndex];
    if (!prescription) {
      return recommendWorkoutSet(state, liftItem, setIndex, workoutTargetRir, activeSessionKey);
    }
    return guardWorkoutRecommendation(state, liftItem, setIndex, activeSessionKey, {
      weight: prescription.recommendedWeight ?? 0,
      reps: prescription.recommendedReps,
      rir: prescription.targetRir,
      reason: prescription.recommendationReason ?? "Session target saved when the workout started.",
    });
  };
  const allSets = activeSession.exercises.flatMap(exercise => sessionSetLogsForExercise(activeSession, exercise.id));
  const completion = validateWorkoutSessionCompletion(activeSession);
  const completedSets = completion.resolvedSets;
  const productiveSets = completion.productiveSets;
  const totalVolume = allSets.reduce(
    (sum, setItem) => (setItem.done && !setItem.skipped ? sum + setItem.weight * setItem.reps : sum),
    0
  );
  const completedExercises = today.lifts.filter((liftItem) =>
    getSetsForLift(liftItem).every((setItem) => setItem.done || setItem.skipped)
  ).length;
  const sessionProgress = allSets.length > 0 ? Math.round((completedSets / allSets.length) * 100) : 0;
  const remainingSets = completion.incompleteSetIds.length;
  const invalidCompletedSets = completion.invalidCompletedSetIds.length;
  const elapsedEndpoint = workoutIsPaused ? Date.parse(activeSession.pausedAt ?? activeSession.updatedAt) : now;
  const elapsedSeconds = Math.max(0, Math.floor((elapsedEndpoint - Date.parse(activeSession.startedAt)) / 1000) - activeSession.pausedDurationSec);
  const activeRest =
    state.restTimer &&
    state.restTimer.sessionKey === activeSessionKey &&
    (state.restTimer.endsAt > now || (workoutIsPaused && Number(state.restTimer.pausedRemainingSec ?? 0) > 0))
      ? state.restTimer
      : null;
  const restSeconds = activeRest
    ? workoutIsPaused
      ? Math.max(0, Math.round(activeRest.pausedRemainingSec ?? (activeRest.endsAt - now) / 1000))
      : Math.min(activeRest.durationSec, Math.max(0, Math.ceil((activeRest.endsAt - now) / 1000)))
    : 0;
  const todayIndex = Math.max(0, model.split.days.findIndex((day) => day.id === today.id));
  const todayMuscleGroups = Array.from(new Set(today.lifts.map((liftItem) => liftItem.muscleGroup)));
  const addExerciseOptions = exerciseCatalog
    .filter(
      (exercise) =>
        exercise.muscleGroup === addExerciseMuscle && !today.lifts.some((liftItem) => liftItem.name === exercise.name)
    )
    .slice(0, 6);
  const nextOpenSet = today.lifts.reduce<{ lift: WorkoutLift; setItem: WorkoutSetLog; setIndex: number } | null>(
    (next, liftItem) => {
      if (next) return next;
      const setIndex = getSetsForLift(liftItem).findIndex((setItem) => !setItem.done && !setItem.skipped);
      return setIndex >= 0 ? { lift: liftItem, setItem: getSetsForLift(liftItem)[setIndex], setIndex } : null;
    },
    null
  );

  const updateSet = (liftItem: WorkoutLift, setId: string, updates: Partial<WorkoutSetLog>) => {
    setState((prev) => {
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active") return prev;
      const draft = visibleSessionSetDraft(prev, currentSession, liftItem, setId);
      if (!draft) return prev;
      const hasNumericEdit = ["weight", "reps", "rir"].some(key => Object.prototype.hasOwnProperty.call(updates, key));
      const patch = hasNumericEdit ? { weight: draft.weight, reps: draft.reps, rir: draft.rir, ...updates } : updates;
      const nextSession = updateSessionWorkoutSet(currentSession, setId, patch, new Date().toISOString());
      if (nextSession === currentSession) return prev;
      const logKey = workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, liftItem.id);
      return {
        ...prev,
        workoutSessions: { ...prev.workoutSessions, [sessionKey]: nextSession },
        workoutLog: {
          ...prev.workoutLog,
          [logKey]: sessionSetLogsForExercise(nextSession, liftItem.id).map(({ id, weight, reps, rir, done, skipped }) => ({ id, weight, reps, rir, done, skipped })),
        },
      };
    });
  };

  const acceptRecommendation = (liftItem: WorkoutLift, setId: string, recommendation: SetRecommendation) => {
    updateSet(liftItem, setId, {
      weight: recommendation.weight,
      reps: recommendation.reps,
      rir: recommendation.rir,
      skipped: false,
    });
  };

  const updateRestTimer = (deltaSeconds: number) => {
    setState((prev) => {
      if (!prev.restTimer || prev.restTimer.sessionKey !== activeSessionKey) return prev;
      const currentSession = activeSessionKey ? prev.workoutSessions[activeSessionKey] : null;
      const isPaused = currentSession?.status === "paused";
      const currentRemaining = isPaused
        ? prev.restTimer.pausedRemainingSec ?? Math.max(0, Math.ceil((prev.restTimer.endsAt - Date.now()) / 1000))
        : Math.max(0, Math.ceil((prev.restTimer.endsAt - Date.now()) / 1000));
      const durationSec = clamp(currentRemaining + deltaSeconds, 30, 600);
      return {
        ...prev,
        restTimer: {
          ...prev.restTimer,
          durationSec,
          endsAt: Date.now() + durationSec * 1000,
          pausedRemainingSec: isPaused ? durationSec : undefined,
        },
      };
    });
  };

  const dismissRestTimer = () =>
    setState((prev) =>
      prev.restTimer?.sessionKey === activeSessionKey ? { ...prev, restTimer: null } : prev
    );

  const toggleWorkoutPause = () => {
    setState((prev) => {
      const timestamp = new Date().toISOString();
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status === "completed") return prev;
      const isPaused = currentSession.status === "paused";
      const nextSession = isPaused
        ? resumeWorkoutSession(currentSession, timestamp)
        : pauseWorkoutSession(currentSession, timestamp);
      const workoutSessions = { ...prev.workoutSessions, [sessionKey]: nextSession };
      const currentTimer = prev.restTimer?.sessionKey === sessionKey ? prev.restTimer : null;
      if (!currentTimer) return { ...prev, workoutPaused: !isPaused, workoutSessions };

      if (isPaused) {
        const durationSec = clamp(Number(currentTimer.pausedRemainingSec ?? 120), 1, 600);
        return {
          ...prev,
          workoutPaused: false,
          workoutSessions,
          restTimer: {
            ...currentTimer,
            durationSec,
            endsAt: Date.now() + durationSec * 1000,
            pausedRemainingSec: undefined,
          },
        };
      }

      const pausedRemainingSec = Math.max(0, Math.ceil((currentTimer.endsAt - Date.now()) / 1000));
      return {
        ...prev,
        workoutPaused: true,
        workoutSessions,
        restTimer: {
          ...currentTimer,
          pausedRemainingSec,
        },
      };
    });
  };

  const abandonWorkout = () => {
    if (!activeSessionKey) return;
    setState((prev) => {
      const session = prev.workoutSessions[activeSessionKey];
      if (!session || session.status === "completed") return prev;
      const workoutSessions = { ...prev.workoutSessions };
      delete workoutSessions[activeSessionKey];
      const workoutLog = { ...prev.workoutLog };
      session.exercises.forEach((exercise) => {
        delete workoutLog[
          workoutLiftLogKey(session.mesocycleId, session.weekNumber, session.dayId, exercise.id)
        ];
      });
      return {
        ...prev,
        workoutSessions,
        workoutLog,
        workoutPaused: false,
        restTimer: prev.restTimer?.sessionKey === activeSessionKey ? null : prev.restTimer,
      };
    });
    setShowAbandonPrompt(false);
    setWorkoutMessage({ tone: "warning", text: "Workout discarded. The planned session is ready to start again." });
  };

  const moveLift = (dayId: string, liftId: string, direction: -1 | 1) => {
    setState((prev) => {
      const base = prev.customSplit ?? cloneSplitForEditing(model.baseSplit.days);
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active") return prev;
      return {
        ...prev,
        workoutSessions: currentSession
          ? {
              ...prev.workoutSessions,
              [sessionKey]: moveSessionWorkoutExercise(currentSession, liftId, direction, new Date().toISOString()),
            }
          : prev.workoutSessions,
        customSplit: base.map((day) => {
          if (day.id !== dayId) return day;
          const currentIndex = day.lifts.findIndex((liftItem) => liftItem.id === liftId);
          const nextIndex = clamp(currentIndex + direction, 0, day.lifts.length - 1);
          if (currentIndex < 0 || currentIndex === nextIndex) return day;
          const lifts = [...day.lifts];
          const [item] = lifts.splice(currentIndex, 1);
          lifts.splice(nextIndex, 0, item);
          return { ...day, lifts };
        }),
      };
    });
  };

  const toggleSet = (liftItem: WorkoutLift, setId: string) => {
    setState((prev) => {
      const timestamp = Date.now();
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active") return prev;
      const currentSet = currentSession.setLogs[setId];
      const draft = visibleSessionSetDraft(prev, currentSession, liftItem, setId);
      if (!currentSet || !draft) return prev;
      const undo = currentSet.done || currentSet.skipped;
      const isoNow = new Date(timestamp).toISOString();
      // Seed only a temporary session so a stale unsafe prescription cannot be
      // confirmed behind a safer visible target. Failed confirmation persists nothing.
      const seeded = !undo && isUntouchedSessionSet(currentSession, setId)
        ? updateSessionWorkoutSet(currentSession, setId, { weight: draft.weight, reps: draft.reps, rir: draft.rir }, isoNow)
        : currentSession;
      const nextSession = undo
        ? updateSessionWorkoutSet(currentSession, setId, { done: false, skipped: false }, isoNow)
        : completeWorkoutSetFromDraft(seeded, setId, isoNow);
      if (!undo && (!nextSession.setLogs[setId]?.done || nextSession.setLogs[setId]?.skipped)) return prev;
      if (nextSession === currentSession) return prev;
      const logKey = workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, liftItem.id);
      return {
        ...prev,
        workoutSessions: { ...prev.workoutSessions, [sessionKey]: nextSession },
        restTimer: !undo
          ? { sessionKey, liftId: liftItem.id, setId, startedAt: timestamp, endsAt: timestamp + 120_000, durationSec: 120 }
          : prev.restTimer?.sessionKey === sessionKey && prev.restTimer.setId === setId ? null : prev.restTimer,
        workoutLog: {
          ...prev.workoutLog,
          [logKey]: sessionSetLogsForExercise(nextSession, liftItem.id).map(({ id, weight, reps, rir, done, skipped }) => ({ id, weight, reps, rir, done, skipped })),
        },
      };
    });
  };

  const skipSet = (liftItem: WorkoutLift, setId: string) => {
    setState((prev) => {
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active" || currentSession.setLogs[setId]?.done) return prev;
      const nextSession = skipSessionWorkoutSet(currentSession, setId, new Date().toISOString());
      if (nextSession === currentSession) return prev;
      const logKey = workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, liftItem.id);
      return {
        ...prev,
        workoutSessions: { ...prev.workoutSessions, [sessionKey]: nextSession },
        restTimer: prev.restTimer?.sessionKey === sessionKey && prev.restTimer.setId === setId ? null : prev.restTimer,
        workoutLog: {
          ...prev.workoutLog,
          [logKey]: sessionSetLogsForExercise(nextSession, liftItem.id).map(({ id, weight, reps, rir, done, skipped }) => ({ id, weight, reps, rir, done, skipped })),
        },
      };
    });
  };

  const addSet = (liftItem: WorkoutLift) => {
    setState((prev) => {
      const timestamp = new Date().toISOString();
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active") return prev;
      const logKey = workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, liftItem.id);
      const current = setsForLift(
        liftItem,
        sessionSetLogsForExercise(currentSession, liftItem.id),
        workoutTargetRir
      );
      const lastRaw = current[current.length - 1];
      const last = (lastRaw && visibleSessionSetDraft(prev, currentSession, liftItem, lastRaw.id)) ?? defaultSetLogsForLift(liftItem, workoutTargetRir)[0];
      const nextSession = currentSession
        ? addSessionWorkoutSet(currentSession, liftItem.id, timestamp, {
            reps: liftItem.reps,
            targetRir: last.rir,
            recommendedWeight: last.weight,
            recommendedReps: last.reps,
          })
        : null;
      const nextSets = nextSession
        ? sessionSetLogsForExercise(nextSession, liftItem.id).map(({ id, weight, reps, rir, done, skipped }) => ({
            id,
            weight,
            reps,
            rir,
            done,
            skipped,
          }))
        : [
            ...current,
            {
              ...last,
              id: `${liftItem.id}-set-${Date.now()}`,
              done: false,
              skipped: false,
            },
          ];
      return {
        ...prev,
        workoutSessions: nextSession
          ? { ...prev.workoutSessions, [sessionKey]: nextSession }
          : prev.workoutSessions,
        workoutLog: {
          ...prev.workoutLog,
          [logKey]: nextSets,
        },
      };
    });
  };

  const addExerciseToToday = (option: ExerciseOption) => {
    const nextLift = createLiftFromOption(option, today.lifts.length);
    setState((prev) => {
      const base = prev.customSplit ?? cloneSplitForEditing(model.baseSplit.days);
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active") return prev;
      const nextSession = currentSession
        ? addSessionWorkoutExercise(
            currentSession,
            {
              ...nextLift,
              slotId: nextLift.id,
              exerciseId: nextLift.exerciseId ?? slug(nextLift.name),
              targetRir: workoutTargetRir,
              loadRequired: !liftPermitsZeroLoad(nextLift),
            },
            new Date().toISOString()
          )
        : null;
      const workoutLog = { ...prev.workoutLog };
      if (nextSession) {
        workoutLog[workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, nextLift.id)] =
          sessionSetLogsForExercise(nextSession, nextLift.id).map(({ id, weight, reps, rir, done, skipped }) => ({
            id,
            weight,
            reps,
            rir,
            done,
            skipped,
          }));
      }
      return {
        ...prev,
        workoutLog,
        workoutSessions: nextSession
          ? { ...prev.workoutSessions, [sessionKey]: nextSession }
          : prev.workoutSessions,
        customSplit: base.map((day) =>
          day.id === today.id
            ? { ...day, lifts: [...day.lifts, nextLift] }
            : day
        ),
      };
    });
    setShowAddExercise(false);
  };

  const removeSet = (liftItem: WorkoutLift, setId: string) => {
    const exercise = activeSession.exercises.find(item => item.id === liftItem.id);
    if (exercise && exercise.prescriptions.length <= 1) {
      setWorkoutMessage({ tone: "warning", text: "Keep at least one set for this exercise. Use Skip set if you are not doing it today." });
      return;
    }
    setState((prev) => {
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status !== "active") return prev;
      const logKey = workoutLiftLogKey(currentSession.mesocycleId, currentSession.weekNumber, currentSession.dayId, liftItem.id);
      const current = setsForLift(
        liftItem,
        sessionSetLogsForExercise(currentSession, liftItem.id),
        workoutTargetRir
      );
      const nextSession = currentSession
        ? removeSessionWorkoutSet(currentSession, setId, new Date().toISOString())
        : null;
      if (nextSession === currentSession) return prev;
      const nextSets = nextSession
        ? sessionSetLogsForExercise(nextSession, liftItem.id).map(({ id, weight, reps, rir, done, skipped }) => ({
            id,
            weight,
            reps,
            rir,
            done,
            skipped,
          }))
        : current.filter((setItem) => setItem.id !== setId);
      return {
        ...prev,
        workoutSessions: nextSession
          ? { ...prev.workoutSessions, [sessionKey]: nextSession }
          : prev.workoutSessions,
        restTimer:
          prev.restTimer?.sessionKey === sessionKey && prev.restTimer.setId === setId
            ? null
            : prev.restTimer,
        workoutLog: {
          ...prev.workoutLog,
          [logKey]: nextSets.length > 0 ? nextSets : defaultSetLogsForLift(liftItem, workoutTargetRir).slice(0, 1),
        },
      };
    });
  };

  const scrollToNextOpenSet = () => {
    if (!nextOpenSet) return;
    setExpandedLiftId(nextOpenSet.lift.id);
    window.setTimeout(() => {
      const element = document.getElementById(`workout-set-${nextOpenSet.lift.id}-${nextOpenSet.setItem.id}`);
      element?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
      });
    }, 0);
  };

  const requestFinishWorkout = () => {
    setWorkoutMessage(null);
    if (productiveSets === 0) {
      setWorkoutMessage({ tone: "warning", text: "Complete at least one working set before saving this workout." });
      scrollToNextOpenSet();
      return;
    }
    if (invalidCompletedSets > 0) {
      setWorkoutMessage({
        tone: "warning",
        text: `${invalidCompletedSets} completed ${invalidCompletedSets === 1 ? "set is" : "sets are"} missing a valid load or rep count.`,
      });
      return;
    }
    if (remainingSets > 0) {
      setShowFinishPrompt(true);
      return;
    }
    finishWorkout(false);
  };

  const finishWorkout = (skipUnfinished: boolean) => {
    const savedSetCount = productiveSets;
    const savedVolume = totalVolume;
    const completedFocus = today.focus;
    const completedAt = new Date().toISOString();
    const preflight = finishWorkoutSession(activeSession, { now: completedAt, skipIncomplete: skipUnfinished });
    if (!preflight.completed) {
      setWorkoutMessage({
        tone: "warning",
        text: "This workout could not be saved yet. Resolve the highlighted sets or explicitly skip the open sets.",
      });
      return;
    }
    setState((prev) => {
      const nextLog = { ...prev.workoutLog };
      const sessionLog: Record<string, WorkoutSetLog[]> = {};
      const sessionKey = activeSession.sessionKey;
      const currentSession = prev.workoutSessions[sessionKey];
      if (!currentSession || currentSession.status === "completed" || currentSession.mesocycleId !== prev.mesocycleId) return prev;
      const finishedSessionResult = currentSession
        ? finishWorkoutSession(currentSession, { now: completedAt, skipIncomplete: skipUnfinished })
        : null;
      if (!finishedSessionResult?.completed) return prev;
      const completedSession = finishedSessionResult.session;
      const completedDay = splitDayFromSession(completedSession);
      const completedWeek = completedSession.weekNumber;
      const completedMeso = completedSession.mesocycleId;
      const completedTargetRir = completedSession.exercises.flatMap(exercise => exercise.prescriptions)[0]?.targetRir ?? workoutTargetRir;
      completedDay.lifts.forEach((liftItem) => {
        const logKey = workoutLiftLogKey(completedMeso, completedWeek, completedSession.dayId, liftItem.id);
        const sessionSets = completedSession
          ? sessionSetLogsForExercise(completedSession, liftItem.id).map(({ id, weight, reps, rir, done, skipped }) => ({
              id,
              weight,
              reps,
              rir,
              done,
              skipped,
            }))
          : [];
        const finishedSets = sessionSets.length > 0
          ? sessionSets
          : setsForLift(
              liftItem,
              savedSetsForLift(prev.workoutLog, completedMeso, completedWeek, completedSession.dayId, liftItem.id),
              completedTargetRir
            ).map((setItem) =>
              !setItem.done && !setItem.skipped && skipUnfinished
                ? { ...setItem, done: true, skipped: true }
                : setItem
            );
        nextLog[logKey] = finishedSets;
        sessionLog[liftItem.id] = finishedSets;
      });
      const sessionDurationSec = completedSession
        ? Math.max(
            0,
            Math.round((new Date(completedAt).getTime() - new Date(completedSession.startedAt).getTime()) / 1000) -
              completedSession.pausedDurationSec
          )
        : undefined;
      const nextHistory = buildWorkoutHistoryEntries(
        completedDay,
        sessionLog,
        completedTargetRir,
        completedMeso,
        completedWeek,
        completedAt,
        completedSession?.startedAt,
        sessionDurationSec
      );
      const existingHistory = prev.workoutHistory.filter((entry) => entry.sessionKey !== sessionKey);
      const nextWorkoutHistory = [...nextHistory, ...existingHistory];
      const nextSkippedWorkouts = { ...prev.skippedWorkouts };
      delete nextSkippedWorkouts[sessionKey];
      const plannedSessionKeys = plannedSessionKeysForWeek(model.split.days, completedMeso, completedWeek);
      const completedKeys = completedSessionKeysForWeek(
        nextWorkoutHistory,
        completedMeso,
        completedWeek,
        plannedSessionKeys
      );
      const completedThisWeek = completedKeys.size;
      const skippedThisWeek = skippedSessionCountForWeek(
        nextSkippedWorkouts,
        completedMeso,
        completedWeek,
        completedKeys,
        plannedSessionKeys
      );
      const weekDone = model.split.days.length > 0 && completedThisWeek + skippedThisWeek >= model.split.days.length;
      const mesoComplete = weekDone && completedWeek >= prev.mesoLengthWeeks;
      const nextWeek = prev.currentWeek === completedWeek && weekDone && !mesoComplete
        ? Math.min(completedWeek + 1, prev.mesoLengthWeeks) : prev.currentWeek;
      const completionCredit = creditMesocycleCompletion({ mesocycleId: completedMeso,
        completedMesoIds: prev.completedMesoIds, completedMesoCount: prev.completedMesoCount, complete: mesoComplete });
      const nextMuscleFeedback = { ...prev.muscleFeedback };
      let nextPainFreeExercises = [...prev.painFreeExercises];
      let nextPainfulExercises = [...prev.painfulExercises];
      completedSession?.feedbackRecords
        .filter((record) => record.scope === "muscle" && muscleOptions.includes(record.muscleGroup as MuscleGroup))
        .forEach((record) => {
          const muscleGroup = record.muscleGroup as MuscleGroup;
          const feedback = muscleFeedbackForSession(completedSession, muscleGroup, prev.muscleFeedback[muscleGroup]);
          nextMuscleFeedback[muscleGroup] = feedback;
        });
      completedSession.feedbackRecords
        .filter((record) => record.scope === "exercise" && Boolean(record.exerciseSlotId))
        .forEach((record) => {
          const exercise = completedSession.exercises.find((item) => item.id === record.exerciseSlotId);
          if (!exercise) return;
          if ((record.jointPain ?? 0) >= 2 || record.limitation === "joint") {
            nextPainfulExercises = recordExercisePainFlag(exercise, nextPainfulExercises);
            nextPainFreeExercises = clearExercisePainFlags(exercise, nextPainFreeExercises);
          } else if (record.jointPain === 0) {
            nextPainFreeExercises = [...clearExercisePainFlags(exercise, nextPainFreeExercises), exercise.name];
            nextPainfulExercises = clearExercisePainFlags(exercise, nextPainfulExercises);
          }
        });
      return {
        ...prev,
        workoutLog: nextLog,
        workoutSessions: completedSession
          ? { ...prev.workoutSessions, [sessionKey]: completedSession }
          : prev.workoutSessions,
        workoutHistory: nextWorkoutHistory,
        muscleFeedback: nextMuscleFeedback,
        painFreeExercises: [...nextPainFreeExercises],
        painfulExercises: [...nextPainfulExercises],
        skippedWorkouts: nextSkippedWorkouts,
        restTimer: null,
        workoutPaused: false,
        activeDayId: null,
        currentWeek: nextWeek,
        deloadMode: mesoComplete ? prev.deloadMode : nextWeek >= prev.mesoLengthWeeks,
        mesoPaused: mesoComplete ? true : prev.mesoPaused,
        lastMesoCompletedAt: mesoComplete ? prev.lastMesoCompletedAt ?? completedAt : prev.lastMesoCompletedAt,
        completedMesoCount: completionCredit.completedMesoCount,
        completedMesoIds: completionCredit.completedMesoIds,
      };
    });
    setShowFinishPrompt(false);
    setWorkoutMessage({
      tone: "success",
      text: `${completedFocus} saved · ${savedSetCount} working ${savedSetCount === 1 ? "set" : "sets"} · ${formatNumber(savedVolume)} lb·reps`,
    });
  };

  return (
    <div className="grid gap-5 pb-24 lg:pb-0">
      {moveNotice}
      {workoutMessage ? (
        <div
          role={workoutMessage.tone === "warning" ? "alert" : "status"}
          className={[
            "flex items-start justify-between gap-3 rounded-[18px] border px-4 py-3 text-sm",
            workoutMessage.tone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100",
          ].join(" ")}
        >
          <span>{workoutMessage.text}</span>
          <button type="button" className="shrink-0" onClick={() => setWorkoutMessage(null)} aria-label="Dismiss workout message">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {recoveryDrafts.length > 0 ? (
        <RecoveryCheckinCard
          key={`${activeSessionKey}:${recoveryDrafts.map((item) => item.muscleGroup).join("-")}`}
          items={recoveryDrafts}
          onSave={(drafts) => saveRecoveryCheckins(drafts)}
          onSkip={() => saveRecoveryCheckins(recoveryDrafts, true)}
        />
      ) : null}
      {recoveryRisk ? (
        <div role="status" className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
          Recovery check-in raised today&apos;s target to {workoutTargetRir} RIR. Keep load steady and use a pain-free setup.
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Week {activeSession.weekNumber} · Session {todayIndex + 1}/{model.split.days.length}</p>
              <CardTitle className="mt-1 text-2xl">{today.focus}</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{workoutTargetRir} RIR target · {productiveSets} {productiveSets === 1 ? "set" : "sets"} logged</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="min-h-11 gap-2" onClick={toggleWorkoutPause}>
                {workoutIsPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                {workoutIsPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="ghost" size="sm" className="min-h-11 text-rose-700 dark:text-rose-200" onClick={() => setShowAbandonPrompt(true)}>Discard</Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <span>{completedSets}/{allSets.length} sets resolved</span>
              <span>{formatRestTime(elapsedSeconds)} elapsed{workoutIsPaused ? " · paused" : ""}</span>
            </div>
            <Progress value={sessionProgress} className="mt-2" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Planned: {state.sessionMinutes} min · Elapsed excludes pauses.</p>
          </div>
          {workoutOccurrence ? <WorkoutDateControl key={workoutOccurrence.sessionKey} state={state} occurrence={workoutOccurrence} title={today.focus} setState={setState} onMoved={onMoved} /> : null}
          {activeRest ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4" />
                {workoutIsPaused ? "Paused" : "Rest"} {formatRestTime(restSeconds)}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-950 hover:bg-emerald-100/70 dark:text-emerald-100 dark:hover:bg-white/10"
                  onClick={() => updateRestTimer(-30)}
                  aria-label="Remove 30 seconds"
                >
                  <Minus className="h-4 w-4" />
                  30
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-950 hover:bg-emerald-100/70 dark:text-emerald-100 dark:hover:bg-white/10"
                  onClick={() => updateRestTimer(30)}
                  aria-label="Add 30 seconds"
                >
                  <Plus className="h-4 w-4" />
                  30
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-emerald-950 hover:bg-emerald-100/70 dark:text-emerald-100 dark:hover:bg-white/10"
                  onClick={dismissRestTimer}
                  aria-label="Dismiss rest timer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3">
          {today.lifts.map((item, liftIndex) => {
            const sets = getSetsForLift(item);
            const bestEstimate = Math.max(0, ...sets.map(estimatedOneRepMax));
            const completedForLift = sets.filter((setItem) => setItem.done && !setItem.skipped);
            const avgRir =
              completedForLift.length > 0
                ? Math.round((completedForLift.reduce((sum, setItem) => sum + setItem.rir, 0) / completedForLift.length) * 10) / 10
                : null;
            const previous = latestHistoryForLift(state.workoutHistory, item);
            const firstRecommendation = frozenRecommendationForSet(item, 0);
            const exerciseJointPain = activeSession.feedbackRecords.find(
              (record) => record.scope === "exercise" && record.exerciseSlotId === item.id
            )?.jointPain ?? 0;
            const automaticLiftId = nextOpenSet?.lift.id ?? today.lifts[0]?.id ?? null;
            const activeLiftId = expandedLiftId === null ? automaticLiftId : expandedLiftId;
            const isExpanded = activeLiftId === item.id;
            return (
              <div
                key={item.id}
                className="min-w-0 max-w-full rounded-[24px] border border-slate-200 bg-white/72 p-3 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-slate-950 dark:text-white">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {movementTargetLabel(item)} · {sets.length} x {item.reps}
                      {bestEstimate > 0 ? ` · e1RM ${bestEstimate}` : ""} {avgRir !== null ? ` · avg ${avgRir} RIR` : ""}
                    </div>
                  </div>
                  <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${item.name} up`}
                      disabled={workoutIsPaused || liftIndex === 0}
                      onClick={() => moveLift(today.id, item.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${item.name} down`}
                      disabled={workoutIsPaused || liftIndex === today.lifts.length - 1}
                      onClick={() => moveLift(today.id, item.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExpandedLiftId(item.id);
                        setTechniqueTarget(techniqueTarget === item.id ? null : item.id);
                      }}
                    >
                      Cues
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={workoutIsPaused}
                      onClick={() => {
                        setExpandedLiftId(item.id);
                        setReplacementTarget(
                          replacementTarget?.dayId === today.id && replacementTarget?.liftId === item.id
                            ? null
                            : { dayId: today.id, liftId: item.id }
                        );
                      }}
                    >
                      <Shuffle className="h-4 w-4" />
                      Replace
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.name}`}
                      onClick={() => setExpandedLiftId(isExpanded ? "" : item.id)}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <>
                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{firstRecommendation.reason}</p>

                {replacementTarget?.dayId === today.id && replacementTarget?.liftId === item.id ? (
                  <ReplacementPicker
                    state={state}
                    day={today}
                    liftToReplace={item}
                    onReplace={(next, canTransferProgressionHistory) =>
                      replaceLift(today.id, item.id, next, canTransferProgressionHistory)
                    }
                    onCancel={() => setReplacementTarget(null)}
                  />
                ) : null}

                {techniqueTarget === item.id ? (
                  <div className="mt-3 grid gap-2 rounded-[22px] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    {techniqueCuesFor(item).map((cue) => (
                      <div key={cue} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{cue}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 grid gap-2">
                  {sets.map((setItem, setIndex) => {
                    const recommendation = frozenRecommendationForSet(item, setIndex);
                    const previousSet = previousSetForRecommendation(previous, setIndex, { allowZeroLoad: liftPermitsZeroLoad(item) });
                    return (
                      <div key={setItem.id} id={`workout-set-${item.id}-${setItem.id}`}>
                        <WorkoutSetRow
                          exerciseName={item.name}
                          setIndex={setIndex}
                          setItem={setItem}
                          recommendation={recommendation}
                          previous={previousSet}
                          step={resolveExerciseLoadIncrement(state.weightIncrement, state.exerciseLoadIncrements[exercisePreferenceKey(item)])}
                          loadRequired={activeSession.exercises.find(exercise => exercise.id === item.id)?.loadRequired ?? !liftPermitsZeroLoad(item)}
                          draftOnly={isUntouchedSessionSet(activeSession, setItem.id)}
                          disabled={workoutIsPaused}
                          onChange={patch => updateSet(item, setItem.id, patch)}
                          onToggle={() => toggleSet(item, setItem.id)}
                          onUseTarget={() => acceptRecommendation(item, setItem.id, recommendation)}
                          onSkip={() => skipSet(item, setItem.id)}
                          onRemove={() => removeSet(item, setItem.id)}
                        />
                      </div>
                    );
                  })}
                </div>

                    <Button variant="outline" size="sm" className="mt-3 min-h-11 gap-2" disabled={workoutIsPaused} onClick={() => addSet(item)}>
                      <Plus className="h-4 w-4" />
                      Add set
                    </Button>
                    <details className="mt-3 rounded-xl border border-slate-200 px-3 dark:border-white/10">
                      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-slate-600 dark:text-slate-300">Load increments</summary>
                      <div className="grid gap-2 pb-3">
                        <label className="grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.name} · next-session increment
                          <select
                            aria-label={`${item.name} load increment`}
                            className="premium-input min-h-11 px-3 text-base"
                            value={state.exerciseLoadIncrements[exercisePreferenceKey(item)] ?? "default"}
                            onChange={event => {
                              const chosen = event.target.value;
                              setState(prev => {
                                const key = exercisePreferenceKey(item);
                                const increments = { ...prev.exerciseLoadIncrements };
                                if (chosen === "default") delete increments[key];
                                else increments[key] = Number(chosen);
                                return { ...prev, exerciseLoadIncrements: normalizeExerciseLoadIncrements(increments) };
                              });
                            }}
                          >
                            <option value="default">Use global increment ({state.weightIncrement} lb)</option>
                            {Array.from(new Set([0, 0.5, 1, 1.25, 2.5, 5, 10, 25, state.exerciseLoadIncrements[exercisePreferenceKey(item)]]))
                              .filter((value): value is number => value !== undefined).sort((a, b) => a - b)
                              .map(value => <option key={value} value={value}>{value === 0 ? "Reps only · hold load" : `${value} lb`}</option>)}
                          </select>
                        </label>
                        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Saved for the next session. Current targets stay unchanged; you can always edit the load actually used.</p>
                      </div>
                    </details>
                    <fieldset disabled={workoutIsPaused} className="mt-3 rounded-[18px] border border-slate-200 bg-white/58 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <legend className="px-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                        Joint response
                      </legend>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          [0, "None"],
                          [1, "Minor"],
                          [2, "Noticeable"],
                          [4, "Stop"],
                        ] as const).map(([jointPain, label]) => (
                          <button
                            key={jointPain}
                            type="button"
                            aria-pressed={exerciseJointPain === jointPain}
                            onClick={() =>
                              setState((prev) => {
                                if (!activeSessionKey || !prev.workoutSessions[activeSessionKey]) return prev;
                                const session = upsertSessionFeedback(
                                  prev.workoutSessions[activeSessionKey],
                                  {
                                    scope: "exercise",
                                    exerciseSlotId: item.id,
                                    jointPain,
                                    limitation: jointPain >= 2 ? "joint" : undefined,
                                  },
                                  new Date().toISOString()
                                );
                                return { ...prev, workoutSessions: { ...prev.workoutSessions, [activeSessionKey]: session } };
                              })
                            }
                            className={`min-h-10 rounded-[12px] border px-2 text-xs font-semibold ${
                              exerciseJointPain === jointPain
                                ? jointPain >= 2
                                  ? "border-rose-400 bg-rose-600 text-white"
                                  : "border-emerald-400 bg-emerald-600 text-white"
                                : "border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {exerciseJointPain >= 2 ? (
                        <p role="alert" className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                          Use a pain-free setup or replace this exercise; load progression is disabled for its next exposure.
                        </p>
                      ) : null}
                    </fieldset>
                  </>
                ) : (
                  <button
                    type="button"
                    className="mt-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white/58 px-3 py-2 text-left text-xs text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"
                    onClick={() => setExpandedLiftId(item.id)}
                  >
                    <span>
                      {sets.filter((setItem) => setItem.done || setItem.skipped).length}/{sets.length} sets resolved
                    </span>
                    <span className="font-semibold text-slate-950 dark:text-white">
                      {formatRecommendation(firstRecommendation)}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
          <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/52 p-4 dark:border-white/12 dark:bg-white/[0.025]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Add exercise</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add a movement without changing the rest of today’s workout.
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2" disabled={workoutIsPaused} onClick={() => setShowAddExercise((value) => !value)}>
                <Plus className="h-4 w-4" />
                {showAddExercise ? "Close" : "Add"}
              </Button>
            </div>
            {showAddExercise ? (
              <div className="mt-3 grid gap-3">
                <SelectField<MuscleGroup>
                  value={addExerciseMuscle}
                  onChange={(muscleGroup) => setAddExerciseMuscle(muscleGroup)}
                  options={muscleOptions.map((value) => ({ value, label: muscleLabels[value] }))}
                />
                {addExerciseOptions.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {addExerciseOptions.map((option, index) => (
                      <button
                        key={`${option.name}-${index}`}
                        type="button"
                        onClick={() => addExerciseToToday(option)}
                        className="rounded-[18px] border border-slate-200 bg-white/72 px-3 py-2.5 text-left text-sm transition hover:border-rose-200 hover:bg-rose-50/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-rose-400/20 dark:hover:bg-rose-400/10"
                      >
                        <div className="font-semibold text-slate-950 dark:text-white">{option.name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {option.pattern} · {movementTargetLabel(option)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[18px] border border-slate-200 bg-white/60 px-3 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                    Every catalog movement for {muscleLabels[addExerciseMuscle]} is already in today’s workout.
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Session feedback</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Optional · informs the next unstarted session.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                aria-expanded={showFeedback}
                aria-controls="session-feedback-controls"
                onClick={() => setShowFeedback((value) => !value)}
              >
                {showFeedback ? "Hide" : "Add feedback"}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFeedback ? "rotate-180" : ""}`} />
              </Button>
            </div>
            {showFeedback ? (
              <div id="session-feedback-controls" className="grid gap-3">
                {todayMuscleGroups.map((muscleGroup) => (
                  <MuscleFeedbackControls
                    key={muscleGroup}
                    muscleGroup={muscleGroup}
                    feedback={muscleFeedbackForSession(activeSession, muscleGroup, state.muscleFeedback[muscleGroup])}
                    onChange={(feedback) =>
                      setState((prev) => {
                        if (!activeSessionKey || !prev.workoutSessions[activeSessionKey]) return prev;
                        const session = upsertSessionFeedback(
                          prev.workoutSessions[activeSessionKey],
                          { scope: "muscle", muscleGroup, ...feedback },
                          new Date().toISOString()
                        );
                        return { ...prev, workoutSessions: { ...prev.workoutSessions, [activeSessionKey]: session } };
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2" aria-hidden="true">
                {todayMuscleGroups.map((muscleGroup) => (
                  <Badge key={muscleGroup} variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                    {muscleLabels[muscleGroup]}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="workout-action-dock fixed inset-x-0 z-50 mx-auto w-full max-w-[460px] px-3 lg:sticky lg:bottom-4 lg:max-w-none lg:px-0">
        <div className="mobile-control-glass flex items-center gap-2 rounded-[22px] border border-white/70 bg-white/92 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/92">
          <div className="min-w-0 flex-1 px-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              {activeRest ? (
                <>
                  <Clock3 className="h-3.5 w-3.5 text-emerald-500" />
                  <span aria-live="polite">Rest {formatRestTime(restSeconds)}</span>
                </>
              ) : (
                <span>{sessionProgress}% complete</span>
              )}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-white">
              {nextOpenSet
                ? `Next · ${nextOpenSet.lift.name}, set ${nextOpenSet.setIndex + 1}`
                : "All planned sets resolved"}
            </div>
          </div>
          {nextOpenSet ? (
            <Button variant="outline" className="shrink-0 gap-2" onClick={scrollToNextOpenSet}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button className="shrink-0 gap-2" onClick={requestFinishWorkout}>
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Finish</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>

      {showFinishPrompt ? (
        <div className="fixed inset-0 z-[80] grid items-end bg-slate-950/65 p-3 backdrop-blur-sm sm:place-items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="finish-workout-title"
            aria-describedby="finish-workout-description"
            className="w-full max-w-md rounded-[26px] border border-white/15 bg-white p-5 shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-300">Open sets</div>
                <h2 id="finish-workout-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                  Finish this workout?
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowFinishPrompt(false)} aria-label="Close finish workout dialog">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p id="finish-workout-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {remainingSets} planned {remainingSets === 1 ? "set is" : "sets are"} still open. You can keep logging, or mark only those open sets as skipped and save the completed work.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" autoFocus onClick={() => setShowFinishPrompt(false)}>
                Keep logging
              </Button>
              <Button onClick={() => finishWorkout(true)}>
                Skip open sets &amp; save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showAbandonPrompt ? (
        <div className="fixed inset-0 z-[80] grid items-end bg-slate-950/65 p-3 backdrop-blur-sm sm:place-items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-workout-title"
            aria-describedby="discard-workout-description"
            className="w-full max-w-md rounded-[26px] border border-white/15 bg-white p-5 shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-300">Unsaved workout</div>
                <h2 id="discard-workout-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                  Discard this workout?
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAbandonPrompt(false)} aria-label="Close discard workout dialog">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p id="discard-workout-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Entered sets and exercise feedback from this unfinished session will be removed. The workout remains in the plan and can be started again.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" autoFocus onClick={() => setShowAbandonPrompt(false)}>
                Keep workout
              </Button>
              <Button className="bg-rose-600 text-white hover:bg-rose-700" onClick={abandonWorkout}>
                Discard workout
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FoodView({ state, model, setState }: {
  state: AppState;
  model: PlanModel;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}) {
  return <NutritionDiaryView
    entries={state.foodLog}
    savedMeals={state.savedFoodMeals}
    onSavedMealsChange={update => setState(prev => ({ ...prev, savedFoodMeals: update(prev.savedFoodMeals) }))}
    today={foodDiaryDateKey(new Date())}
    targets={{ calories: model.macros.calories, protein: model.macros.protein, carbs: model.macros.carbs, fat: model.macros.fats }}
    targetsForDate={date => {
      const target = acceptedTrackerTarget(state.trackerProgram, date);
      return target ? { calories: target.calories, protein: target.protein, carbs: target.carbs, fat: target.fat } : null;
    }}
    targetDescription="Accepted weight-tracker targets for this date, including your saved training/rest-day cycling settings."
    isDayComplete={date => trackerFoodDayComplete(state.trackerProgram, state.foodLog, date)}
    onDayComplete={state.trackerProgram ? (date, complete) => setState(prev => {
      if (!prev.trackerProgram || date > foodDiaryDateKey(new Date())) return prev;
      const completeFoodDays = { ...prev.trackerProgram.completeFoodDays };
      if (complete) completeFoodDays[date] = foodDaySignature(prev.foodLog, date);
      else delete completeFoodDays[date];
      return { ...prev, trackerProgram: { ...prev.trackerProgram, completeFoodDays } };
    }) : undefined}
    legacyTotals={state.legacyNutritionTotals}
    onEntriesChange={update => setState(prev => ({ ...prev, foodLog: update(prev.foodLog) }))}
  />;
}

function TrainingView({
  state,
  model,
  setState,
  goTo,
}: {
  state: AppState;
  model: PlanModel;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  goTo: (view: ViewId) => void;
}) {
  const { onMoved, moveNotice } = useWorkoutMoveNotice(state, setState);
  const [replacementTarget, setReplacementTarget] = useState<ReplacementTarget | null>(null);
  const [newLiftGroups, setNewLiftGroups] = useState<Record<string, MuscleGroup>>({});
  const [showBuilder, setShowBuilder] = useState(false);
  const [endMesoConfirmationPending, setEndMesoConfirmationPending] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<MesoTemplateId | null>(null);
  const editableSplit = state.customSplit ?? model.split.days;
  const workoutOccurrences = workoutOccurrencesForWeek(state, editableSplit);
  const nextWorkout = nextWorkoutFor(state, model.split.days);
  const openMesoSession = openWorkoutSessionForMesocycle(state.workoutSessions, state.mesocycleId);
  const selectedTemplate = mesoTemplates.find((template) => template.id === state.activeTemplate) ?? mesoTemplates[0];
  const pendingTemplate = mesoTemplates.find((template) => template.id === pendingTemplateId) ?? null;
  const plannedSessionKeys = plannedSessionKeysForWeek(model.split.days, state.mesocycleId, state.currentWeek);
  const completedKeys = completedSessionKeysForWeek(
    state.workoutHistory,
    state.mesocycleId,
    state.currentWeek,
    plannedSessionKeys
  );
  const skippedThisWeek = skippedSessionCountForWeek(
    state.skippedWorkouts,
    state.mesocycleId,
    state.currentWeek,
    completedKeys,
    plannedSessionKeys
  );
  const weekProgress =
    model.split.days.length > 0
      ? Math.round(((completedKeys.size + skippedThisWeek) / model.split.days.length) * 100)
      : 0;
  const weekOverview = buildWeekOverview(state, model);
  const currentMesoHistory = state.workoutHistory.filter((entry) => entry.mesocycleId === state.mesocycleId);
  const currentMesoSessions = new Set(currentMesoHistory.map((entry) => entry.sessionKey)).size;
  const currentMesoVolume = currentMesoHistory.reduce((total, entry) => total + entry.totalVolume, 0);
  const currentMesoBest = currentMesoHistory.reduce<WorkoutHistoryEntry | null>(
    (best, entry) => (!best || entry.estimatedOneRepMax > best.estimatedOneRepMax ? entry : best),
    null
  );
  const builderExercises = [...state.customExercises, ...exerciseCatalog].map((exercise) => ({
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    pattern: exercise.pattern,
    target: exercise.target,
    equipment: exercise.equipment,
    custom: state.customExercises.some((item) => item.name.toLowerCase() === exercise.name.toLowerCase()),
  }));
  const builderInitialDraft: MesocycleBuilderDraft = {
    sessionsPerWeek: state.sessionsPerWeek,
    availableTrainingDays: [...state.availableTrainingDays].slice(0, state.sessionsPerWeek),
    sessionMinutes: state.sessionMinutes,
    equipment: state.equipment,
    musclePriorities: { ...state.musclePriorities },
    favoriteExercises: [...state.favoriteExercises],
    restrictedExercises: [...state.restrictedExercises],
    customExercises: state.customExercises.map((exercise) => ({ ...exercise, custom: true })),
    exerciseReplacements: {},
    mesoLengthWeeks: state.mesoLengthWeeks,
    startDate: localDateKey(new Date()),
    weightIncrement: state.weightIncrement,
  };

  const resumeOpenMesoSession = () => {
    if (!openMesoSession) return false;
    setShowBuilder(false);
    setEndMesoConfirmationPending(false);
    setPendingTemplateId(null);
    setState((prev) => ({
      ...prev,
      currentWeek: openMesoSession.weekNumber,
      activeDayId: openMesoSession.dayId,
      deloadMode: openMesoSession.weekNumber >= prev.mesoLengthWeeks,
      mesoPaused: false,
      workoutPaused: openMesoSession.status === "paused",
    }));
    goTo("today");
    return true;
  };

  const openMesoBuilder = () => {
    if (resumeOpenMesoSession()) return;
    setEndMesoConfirmationPending(false);
    setPendingTemplateId(null);
    setShowBuilder(true);
  };

  const previewForBuilder = (draft: MesocycleBuilderDraft): MesocyclePreview => {
    const constrained = splitFromBuilderDraft(draft, state);
    const baseDays = constrained.days;
    const previewTargetRir = targetRirForWeek(1, draft.mesoLengthWeeks, false);
    const draftBuilderExercises = [...draft.customExercises, ...builderExercises].filter(
      (exercise, index, exercises) =>
        exercises.findIndex((candidate) => candidate.name.toLowerCase() === exercise.name.toLowerCase()) === index
    );
    const days = applyMesoSettings(
      { name: `${draft.sessionsPerWeek}-day hypertrophy mesocycle`, summary: "Builder preview", days: baseDays },
      {
        ...state,
        sessionsPerWeek: draft.sessionsPerWeek,
        sessionMinutes: draft.sessionMinutes,
        equipment: draft.equipment,
        musclePriorities: { ...draft.musclePriorities },
        mesoLengthWeeks: draft.mesoLengthWeeks,
        currentWeek: 1,
        deloadMode: false,
        customSplit: baseDays,
      },
      previewTargetRir
    ).days;
    const weeklySets = weeklySetTargetsFor(days);
    const restrictedNames = new Set(draft.restrictedExercises.map((name) => name.toLowerCase()));
    const favoriteNames = new Set(draft.favoriteExercises.map((name) => name.toLowerCase()));
    const previewDays = days.map((day) => ({
      id: day.id,
      focus: day.focus,
      exerciseCount: day.lifts.length,
      exercises: day.lifts.map((liftItem) => {
        const requestedName = draft.exerciseReplacements[`${day.id}:${liftItem.id}`];
        const replacementOptions = Array.from(
          new Set(
            [
              {
                name: liftItem.name,
                muscleGroup: liftItem.muscleGroup,
                pattern: liftItem.pattern,
                target: liftItem.target,
              },
              ...draftBuilderExercises,
            ]
              .filter((exercise) => exercise.muscleGroup === liftItem.muscleGroup)
              .filter((exercise) => !restrictedNames.has(exercise.name.toLowerCase()))
              .filter((exercise) => equipmentAllowsExercise(draft.equipment, exercise))
              .map((exercise) => exercise.name)
          )
        ).sort((left, right) => {
          if (left === liftItem.name) return -1;
          if (right === liftItem.name) return 1;
          const favoriteDelta = Number(favoriteNames.has(right.toLowerCase())) - Number(favoriteNames.has(left.toLowerCase()));
          return favoriteDelta || left.localeCompare(right);
        });
        return {
          slotId: liftItem.id,
          name: liftItem.name,
          muscleGroup: liftItem.muscleGroup,
          replacementOptions,
          unavailableSelection:
            requestedName && requestedName.toLowerCase() !== liftItem.name.toLowerCase()
              ? requestedName
              : undefined,
        };
      }),
      estimatedMinutes: estimatedSessionMinutesFor(day.lifts),
      muscles: dayMuscleSummary(day) || "Add an eligible exercise",
    }));
    const startTimestamp = builderStartTimestamp(draft.startDate);
    const issues: string[] = [];
    constrained.unmetPriorities.forEach((item) => {
      issues.push(`${muscleLabels[item.muscleGroup as MuscleGroup]} ${priorityLabels[item.priority].toLowerCase()} is not covered. ${item.detail}`);
    });
    constrained.conflicts.forEach((item) => {
      const dayLabel = baseDays.find((day) => day.id === item.dayId)?.focus;
      const issue = `${dayLabel ? `${dayLabel}: ` : ""}${item.reason}`;
      if (!issues.includes(issue)) issues.push(issue);
    });
    if (!startTimestamp) issues.push("Choose a valid starting date.");
    if (draft.availableTrainingDays.length !== draft.sessionsPerWeek) {
      issues.push(`Choose exactly ${draft.sessionsPerWeek} training days.`);
    }
    if (baseDays.some((day) => day.lifts.length === 0)) {
      issues.push("At least one workout has no eligible exercises. Allow an exercise, add a custom option, or change equipment.");
    }
    if (previewDays.some((day) => day.exercises.some((exercise) => exercise.unavailableSelection))) {
      issues.push("A selected replacement is no longer available. Choose another exercise in the review.");
    }
    const oversizedDays = previewDays.filter((day) => day.estimatedMinutes > draft.sessionMinutes);
    if (oversizedDays.length > 0) {
      issues.push(
        `${oversizedDays.map((day) => day.focus).join(", ")} exceed the ${draft.sessionMinutes}-minute session target. Increase the duration or lower a muscle priority.`
      );
    }
    return {
      name: `${draft.sessionsPerWeek}-day hypertrophy mesocycle`,
      days: previewDays,
      weeklySets: muscleOptions
        .filter((muscleGroup) => weeklySets[muscleGroup] > 0)
        .map((muscleGroup) => ({ muscle: muscleLabels[muscleGroup], sets: weeklySets[muscleGroup] })),
      muscleFrequency: muscleOptions
        .map((muscleGroup) => ({
          muscle: muscleLabels[muscleGroup],
          sessions: days.filter((day) => day.lifts.some((liftItem) => liftItem.muscleGroup === muscleGroup)).length,
        }))
        .filter((item) => item.sessions > 0),
      loadingWeeks: Array.from({ length: draft.mesoLengthWeeks }, (_, index) => {
        const week = index + 1;
        const deload = week === draft.mesoLengthWeeks;
        return { week, targetRir: targetRirForWeek(week, draft.mesoLengthWeeks, deload), deload };
      }),
      issues,
      adjustments: baseDays.flatMap((day) => {
        const omitted = constrained.omissions.filter((item) => item.dayId === day.id && item.reason === "duration");
        return omitted.length > 0
          ? [`${day.focus}: left out ${omitted.map((item) => item.lift.name).join(", ")} to fit ${draft.sessionMinutes} minutes while retaining priority-muscle coverage.`]
          : [];
      }),
    };
  };

  const applyBuilderDraft = (draft: MesocycleBuilderDraft) => {
    if (resumeOpenMesoSession()) return;
    const customSplit = splitFromBuilderDraft(draft, state).days;
    if (previewForBuilder(draft).issues.length > 0) return;
    const startTimestamp = builderStartTimestamp(draft.startDate);
    if (!startTimestamp) return;
    const mesocycleId = `${mesocycleIdForStart(startTimestamp)}-${Date.now().toString(36)}`;
    setState((prev) => {
      const generatedWorkoutItems = customSplit.map((day, index) => ({
        id: splitScheduleItemId(day.id),
        day: draft.availableTrainingDays[index] ?? "mon",
        time: "17:30",
        type: "workout" as ScheduleItemType,
        title: day.focus,
        detail: dayMuscleSummary(day),
        linkedDayId: day.id,
      }));
      return {
        ...prev,
        sessionsPerWeek: draft.sessionsPerWeek,
        availableTrainingDays: [...draft.availableTrainingDays],
        sessionMinutes: draft.sessionMinutes,
        equipment: draft.equipment,
        musclePriorities: { ...draft.musclePriorities },
        favoriteExercises: [...draft.favoriteExercises],
        restrictedExercises: [...draft.restrictedExercises],
        customExercises: draft.customExercises.map((exercise) => ({
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          pattern: exercise.pattern,
          target: exercise.target,
          equipment: exercise.equipment ? [...exercise.equipment] : undefined,
          favorite: draft.favoriteExercises.includes(exercise.name),
          jointFriendly: true,
        })),
        mesoLengthWeeks: draft.mesoLengthWeeks,
        weightIncrement: draft.weightIncrement,
        customSplit,
        currentWeek: 1,
        deloadMode: false,
        activeDayId: null,
        skippedWorkouts: {},
        workoutLog: {},
        restTimer: null,
        workoutPaused: false,
        mesoPaused: false,
        mesocycleId,
        mesoStartedAt: startTimestamp,
        lastMesoCompletedAt: null,
        scheduleItems: sortScheduleItems([
          ...prev.scheduleItems.filter((item) => !isGeneratedSplitScheduleItem(item, model.split.days)),
          ...generatedWorkoutItems,
        ]),
        scheduleCheckoffs: Object.fromEntries(
          Object.entries(prev.scheduleCheckoffs).filter(([key]) => !key.includes(":schedule-split-workout-"))
        ),
      };
    });
    setShowBuilder(false);
    setPendingTemplateId(null);
  };

  const applyTemplate = (template: MesoTemplate) => {
    if (resumeOpenMesoSession()) return;
    setState((prev) => {
      const mesoStartedAt = new Date().toISOString();
      const templateDays = generatedSplitFor(template.sessions).days;
      const availableTrainingDays = Array.from(
        new Set([...prev.availableTrainingDays, ...weekdayOptions.map((option) => option.value)])
      ).slice(0, template.sessions);
      const generatedWorkoutItems = templateDays.map((day, index) => ({
        id: splitScheduleItemId(day.id),
        day: availableTrainingDays[index] ?? "mon",
        time: "17:30",
        type: "workout" as ScheduleItemType,
        title: day.focus,
        detail: dayMuscleSummary(day),
        linkedDayId: day.id,
      }));
      return {
        ...prev,
        activeTemplate: template.id,
        sessionsPerWeek: template.sessions,
        availableTrainingDays,
        musclePriorities: { ...template.priorities },
        currentWeek: 1,
        deloadMode: false,
        customSplit: null,
        activeDayId: null,
        skippedWorkouts: {},
        workoutLog: {},
        restTimer: null,
        workoutPaused: false,
        mesoPaused: false,
        mesocycleId: mesocycleIdForStart(mesoStartedAt),
        mesoStartedAt,
        lastMesoCompletedAt: null,
        scheduleItems: sortScheduleItems([
          ...prev.scheduleItems.filter((item) => !isGeneratedSplitScheduleItem(item, model.split.days)),
          ...generatedWorkoutItems,
        ]),
        scheduleCheckoffs: Object.fromEntries(
          Object.entries(prev.scheduleCheckoffs).filter(([key]) => !key.includes(":schedule-split-workout-"))
        ),
      };
    });
    setPendingTemplateId(null);
  };

  const requestTemplate = (template: MesoTemplate) => {
    if (resumeOpenMesoSession()) return;
    setShowBuilder(false);
    setEndMesoConfirmationPending(false);
    setPendingTemplateId(template.id);
  };

  const updateMusclePriority = (muscleGroup: MuscleGroup, priority: MusclePriority) => {
    setState((prev) => ({
      ...prev,
      musclePriorities: {
        ...prev.musclePriorities,
        [muscleGroup]: priority,
      },
    }));
  };

  const ensureCustomSplit = (updater: (split: SplitDay[]) => SplitDay[]) => {
    if (resumeOpenMesoSession()) return false;
    setState((prev) => {
      const base = prev.customSplit ?? cloneSplitForEditing(model.baseSplit.days);
      return { ...prev, customSplit: updater(base) };
    });
    return true;
  };

  const useGeneratedSplit = () => {
    if (resumeOpenMesoSession()) return;
    setState((prev) => ({ ...prev, customSplit: null }));
  };

  const replaceLift = (dayId: string, liftId: string, next: WorkoutLift) => {
    const updated = ensureCustomSplit((split) =>
      split.map((day) =>
        day.id === dayId
          ? {
              ...day,
              lifts: day.lifts.map((item) =>
                item.id === liftId ? { ...next, id: item.id, sets: item.sets } : item
              ),
            }
          : day
      )
    );
    if (!updated) return;
    setReplacementTarget(null);
  };

  const addDay = () => {
    const option = exerciseCatalog.find((exercise) => exercise.muscleGroup === "chest") ?? exerciseCatalog[0];
    ensureCustomSplit((split) => [
      ...split,
      {
        id: `custom-day-${Date.now()}`,
        day: "Sun",
        focus: "Custom day",
        intent: "Choose the muscles and lifts for this session.",
        lifts: [createLiftFromOption(option, split.length)],
      },
    ]);
  };

  const removeDay = (dayId: string) => {
    const updated = ensureCustomSplit((split) => {
      if (split.length <= 1) return split;
      return split.filter((day) => day.id !== dayId);
    });
    if (!updated) return;
    setState((prev) => (prev.activeDayId === dayId ? { ...prev, activeDayId: null } : prev));
  };

  const moveDay = (dayId: string, direction: -1 | 1) => {
    ensureCustomSplit((split) => {
      const currentIndex = split.findIndex((day) => day.id === dayId);
      const nextIndex = clamp(currentIndex + direction, 0, split.length - 1);
      if (currentIndex < 0 || currentIndex === nextIndex) return split;
      const next = [...split];
      const [item] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const updateDay = (dayId: string, updates: Partial<SplitDay>) => {
    ensureCustomSplit((split) => split.map((day) => (day.id === dayId ? { ...day, ...updates } : day)));
  };

  const updateLift = (dayId: string, liftId: string, updates: Partial<WorkoutLift>) => {
    if (resumeOpenMesoSession()) return;
    setState(prev => {
      const split = prev.customSplit ?? cloneSplitForEditing(model.baseSplit.days);
      const previousLift = split.find(day => day.id === dayId)?.lifts.find(item => item.id === liftId);
      if (!previousLift) return prev;
      const renamed = { ...previousLift, ...updates };
      return {
        ...prev,
        painfulExercises: preserveExercisePainOnRename(previousLift, renamed, prev.painfulExercises),
        customSplit: split.map(day => day.id === dayId
          ? { ...day, lifts: day.lifts.map(item => item.id === liftId ? renamed : item) }
          : day),
      };
    });
  };

  const selectMesoWeek = (week: number) => {
    if (week === state.currentWeek) return;
    if (resumeOpenMesoSession()) return;
    setState((prev) => {
      const currentWeek = clamp(week, 1, prev.mesoLengthWeeks);
      return { ...prev, currentWeek, activeDayId: null, deloadMode: currentWeek === prev.mesoLengthWeeks };
    });
  };

  const updateSessionFrequency = (sessionsPerWeek: number) => {
    if (sessionsPerWeek === state.sessionsPerWeek) return;
    if (resumeOpenMesoSession()) return;
    setState((prev) => ({ ...prev, sessionsPerWeek, customSplit: null, activeDayId: null, skippedWorkouts: {} }));
  };

  const updateMesoLength = (value: string) => {
    const mesoLengthWeeks = clamp(updateNumber(value, state.mesoLengthWeeks), 3, 8);
    if (mesoLengthWeeks === state.mesoLengthWeeks) return;
    if (resumeOpenMesoSession()) return;
    setState((prev) => ({
      ...prev,
      mesoLengthWeeks,
      currentWeek: Math.min(prev.currentWeek, mesoLengthWeeks),
    }));
  };

  const startSession = (dayId: string) => {
    if (resumeOpenMesoSession()) return;
    setState((prev) => ({ ...prev, activeDayId: dayId, mesoPaused: false }));
    goTo("today");
  };

  const toggleSkipSession = (dayId: string) => {
    if (resumeOpenMesoSession()) return;
    const key = workoutSessionKey(state.mesocycleId, state.currentWeek, dayId);
    if (completedKeys.has(key)) return;

    setState((prev) => {
      if (key !== workoutSessionKey(prev.mesocycleId, prev.currentWeek, dayId) || allCompletedWorkoutKeys(prev).has(key)) return prev;
      const nextSkippedWorkouts = { ...prev.skippedWorkouts };
      if (nextSkippedWorkouts[key]) {
        delete nextSkippedWorkouts[key];
        return { ...prev, skippedWorkouts: nextSkippedWorkouts, activeDayId: null, mesoPaused: false };
      }

      nextSkippedWorkouts[key] = true;
      const plannedSessionKeys = plannedSessionKeysForWeek(model.split.days, prev.mesocycleId, prev.currentWeek);
      const nextCompletedKeys = completedSessionKeysForWeek(
        prev.workoutHistory,
        prev.mesocycleId,
        prev.currentWeek,
        plannedSessionKeys
      );
      const completedThisWeek = nextCompletedKeys.size;
      const nextSkippedThisWeek = skippedSessionCountForWeek(
        nextSkippedWorkouts,
        prev.mesocycleId,
        prev.currentWeek,
        nextCompletedKeys,
        plannedSessionKeys
      );
      const weekDone = model.split.days.length > 0 && completedThisWeek + nextSkippedThisWeek >= model.split.days.length;
      const mesoComplete = weekDone && prev.currentWeek >= prev.mesoLengthWeeks;
      const nextWeek = weekDone && !mesoComplete ? Math.min(prev.currentWeek + 1, prev.mesoLengthWeeks) : prev.currentWeek;
      const completionCredit = creditMesocycleCompletion({ mesocycleId: prev.mesocycleId,
        completedMesoIds: prev.completedMesoIds, completedMesoCount: prev.completedMesoCount, complete: mesoComplete });

      return {
        ...prev,
        skippedWorkouts: nextSkippedWorkouts,
        currentWeek: nextWeek,
        activeDayId: null,
        deloadMode: mesoComplete ? prev.deloadMode : nextWeek >= prev.mesoLengthWeeks,
        mesoPaused: mesoComplete ? true : prev.mesoPaused,
        lastMesoCompletedAt: mesoComplete ? prev.lastMesoCompletedAt ?? new Date().toISOString() : prev.lastMesoCompletedAt,
        completedMesoCount: completionCredit.completedMesoCount,
        completedMesoIds: completionCredit.completedMesoIds,
      };
    });
  };

  const toggleMesoPause = () => {
    if (resumeOpenMesoSession()) return;
    setState((prev) => ({ ...prev, mesoPaused: !prev.mesoPaused, workoutPaused: prev.mesoPaused ? false : true }));
  };

  const endMeso = () => {
    const completedAt = new Date().toISOString();
    setState((prev) => {
      const completionCredit = creditMesocycleCompletion({ mesocycleId: prev.mesocycleId,
        completedMesoIds: prev.completedMesoIds, completedMesoCount: prev.completedMesoCount, complete: true });
      return { ...prev, mesoPaused: true, workoutPaused: false, restTimer: null, activeDayId: null,
        currentWeek: prev.mesoLengthWeeks, deloadMode: true,
        lastMesoCompletedAt: prev.lastMesoCompletedAt ?? completedAt,
        completedMesoCount: completionCredit.completedMesoCount, completedMesoIds: completionCredit.completedMesoIds };
    });
    setEndMesoConfirmationPending(false);
    setPendingTemplateId(null);
  };

  const requestEndMeso = () => {
    if (resumeOpenMesoSession()) return;
    if (!endMesoConfirmationPending) {
      setPendingTemplateId(null);
      setEndMesoConfirmationPending(true);
      return;
    }
    endMeso();
  };

  const addLiftToDay = (day: SplitDay) => {
    const muscleGroup = newLiftGroups[day.id] ?? day.lifts[0]?.muscleGroup ?? "chest";
    const usedNames = new Set(day.lifts.filter((item) => item.muscleGroup === muscleGroup).map((item) => item.name));
    const option =
      exerciseCatalog.find((exercise) => exercise.muscleGroup === muscleGroup && !usedNames.has(exercise.name)) ??
      exerciseCatalog.find((exercise) => exercise.muscleGroup === muscleGroup) ??
      exerciseCatalog[0];
    ensureCustomSplit((split) =>
      split.map((item) =>
        item.id === day.id ? { ...item, lifts: [...item.lifts, createLiftFromOption(option, item.lifts.length)] } : item
      )
    );
  };

  return (
    <>
      {showBuilder ? (
        <div className="mb-5">
          <MesocycleBuilder
            initialDraft={builderInitialDraft}
            exercises={builderExercises}
            muscleLabels={muscleLabels}
            previewFor={previewForBuilder}
            onApply={applyBuilderDraft}
            onCancel={() => setShowBuilder(false)}
          />
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{state.customSplit ? "Custom meso" : "Meso builder"}</Badge>
                <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                  Week {state.currentWeek}/{state.mesoLengthWeeks}
                </Badge>
                <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                  {model.targetRir} RIR
                </Badge>
                {state.mesoPaused ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/12 dark:text-amber-100">
                    Paused
                  </Badge>
                ) : null}
              </div>
              <CardTitle className="mt-3 text-3xl">{model.split.name}</CardTitle>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {model.split.days.length} sessions · {model.targetRir} RIR · {state.sessionMinutes} min/session
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-2" onClick={openMesoBuilder}>
                <Sparkles className="h-4 w-4" />
                Build next meso
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => ensureCustomSplit((split) => split)}
              >
                Customize split
              </Button>
              {state.customSplit ? (
                <Button variant="ghost" size="sm" onClick={useGeneratedSplit}>
                  Use AI split
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Template" value={selectedTemplate.label} detail={`${state.sessionsPerWeek} sessions`} Icon={Dumbbell} />
            <StatCard label="Week" value={`${weekProgress}%`} detail={`${completedKeys.size} done · ${skippedThisWeek} skipped`} Icon={Gauge} />
            <StatCard label="Progression" value={`+${state.weightIncrement} lb`} detail="After top-range sets" Icon={Activity} />
          </div>

          <div className="grid gap-3 rounded-[26px] border border-slate-200 bg-white/64 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Mesocycle</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {state.completedMesoCount} completed · {state.deloadMode ? "Deload" : "Accumulation"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={toggleMesoPause}>
                  {state.mesoPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                  {state.mesoPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={requestEndMeso}
                >
                  <Flag className="h-4 w-4" />
                  {endMesoConfirmationPending ? "Confirm end" : "End meso"}
                </Button>
                <Button size="sm" className="gap-2" onClick={openMesoBuilder}>
                  <Trophy className="h-4 w-4" />
                  New meso
                </Button>
              </div>
            </div>
            {endMesoConfirmationPending ? (
              <div role="alert" className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                Ending this mesocycle closes the current block. Click Confirm end to continue.
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-5">
              {weekOverview.map((week) => (
                <button
                  key={week.week}
                  type="button"
                  onClick={() => selectMesoWeek(week.week)}
                  className={[
                    "rounded-[18px] border px-3 py-3 text-left transition",
                    week.week === state.currentWeek
                      ? "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100"
                      : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase">Week {week.week}</span>
                    <span className="text-[10px] font-semibold uppercase opacity-70">
                      {week.status === "deload" ? "Deload" : week.status}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-semibold">{week.targetRir} RIR</div>
                  <div className="mt-1 text-xs opacity-75">
                    {week.completed + week.skipped}/{week.planned} sessions
                  </div>
                </button>
              ))}
            </div>
          </div>

          {state.mesoPaused && state.lastMesoCompletedAt ? (
            <section className="rounded-[26px] border border-emerald-200 bg-emerald-50/72 p-4 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100" aria-labelledby="meso-review-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase opacity-70">Program review</div>
                  <h3 id="meso-review-title" className="mt-1 text-xl font-semibold">Mesocycle complete</h3>
                  <p className="mt-1 text-sm opacity-80">Completed {formatDateLabel(state.lastMesoCompletedAt)}. Review actual work before carrying the plan forward.</p>
                </div>
                <Button size="sm" className="gap-2" onClick={openMesoBuilder}>
                  <Sparkles className="h-4 w-4" /> Build next meso
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-[16px] border border-emerald-200/80 bg-white/55 p-3 dark:border-emerald-300/15 dark:bg-slate-950/20"><div className="text-xs opacity-70">Sessions</div><div className="mt-1 text-lg font-semibold">{currentMesoSessions}</div></div>
                <div className="rounded-[16px] border border-emerald-200/80 bg-white/55 p-3 dark:border-emerald-300/15 dark:bg-slate-950/20"><div className="text-xs opacity-70">Working sets</div><div className="mt-1 text-lg font-semibold">{currentMesoHistory.reduce((sum, entry) => sum + entry.sets.filter((setItem) => !setItem.skipped).length, 0)}</div></div>
                <div className="rounded-[16px] border border-emerald-200/80 bg-white/55 p-3 dark:border-emerald-300/15 dark:bg-slate-950/20"><div className="text-xs opacity-70">Volume</div><div className="mt-1 text-lg font-semibold">{formatNumber(currentMesoVolume)} lb</div></div>
                <div className="rounded-[16px] border border-emerald-200/80 bg-white/55 p-3 dark:border-emerald-300/15 dark:bg-slate-950/20"><div className="text-xs opacity-70">Best e1RM</div><div className="mt-1 text-lg font-semibold">{currentMesoBest ? `${currentMesoBest.estimatedOneRepMax} lb` : "—"}</div></div>
              </div>
              <p className="mt-3 text-xs opacity-75">Your previous history stays available; the builder starts from current preferences without modifying this completed block.</p>
            </section>
          ) : null}

          {moveNotice}
          {editableSplit.map((day, dayIndex) => {
            const sessionKey = workoutSessionKey(state.mesocycleId, state.currentWeek, day.id);
            const occurrence = workoutOccurrences.find(item => item.sessionKey === sessionKey);
            const complete = completedKeys.has(sessionKey);
            const skipped = Boolean(state.skippedWorkouts[sessionKey]) && !complete;
            const progress = dayCompletionFor(day, state, model.targetRir);
            const active = nextWorkout.session?.sessionKey === sessionKey || nextWorkout.occurrence?.sessionKey === sessionKey;

            return (
              <motion.section
                key={day.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={[
                  "rounded-[26px] border p-4",
                  active
                    ? "border-rose-300 bg-rose-50/76 dark:border-rose-400/30 dark:bg-rose-400/12"
                    : "border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]",
                ].join(" ")}
              >
              {state.customSplit ? (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={[
                        "bg-white/60 dark:bg-white/[0.04]",
                        complete
                          ? "border-emerald-300 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-200"
                          : skipped
                            ? "border-amber-300 text-amber-700 dark:border-amber-400/30 dark:text-amber-200"
                            : "",
                      ].join(" ")}
                    >
                      {complete ? "Done" : skipped ? "Skipped" : `${progress}%`}
                    </Badge>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="gap-2" onClick={() => startSession(day.id)}>
                        <PlayCircle className="h-4 w-4" />
                        {progress > 0 && !complete ? "Resume" : complete ? "View" : "Start"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={complete}
                        onClick={() => toggleSkipSession(day.id)}
                      >
                        <SkipForward className="h-4 w-4" />
                        {skipped ? "Unskip" : "Skip"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${day.focus} up`}
                        disabled={dayIndex === 0}
                        onClick={() => moveDay(day.id, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${day.focus} down`}
                        disabled={dayIndex === editableSplit.length - 1}
                        onClick={() => moveDay(day.id, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${day.focus}`}
                        disabled={editableSplit.length <= 1}
                        onClick={() => removeDay(day.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={complete || skipped ? 100 : progress} className="h-2" />
                  <div className="grid gap-3 md:grid-cols-[86px_minmax(0,1fr)]">
                    <Field label="Day">
                      <Input value={day.day} onChange={(event) => updateDay(day.id, { day: event.target.value })} />
                    </Field>
                    <Field label="Focus">
                      <Input value={day.focus} onChange={(event) => updateDay(day.id, { focus: event.target.value })} />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{day.day}</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{day.focus}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dayMuscleSummary(day)}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge
                      variant="outline"
                      className={[
                        "bg-white/60 dark:bg-white/[0.04]",
                        complete
                          ? "border-emerald-300 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-200"
                          : skipped
                            ? "border-amber-300 text-amber-700 dark:border-amber-400/30 dark:text-amber-200"
                            : "",
                      ].join(" ")}
                    >
                      {complete ? "Done" : skipped ? "Skipped" : `${progress}%`}
                    </Badge>
                    <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                      {day.lifts.length} lifts
                    </Badge>
                    <Button size="sm" className="gap-2" onClick={() => startSession(day.id)}>
                      <PlayCircle className="h-4 w-4" />
                      {progress > 0 && !complete ? "Resume" : complete ? "View" : "Start"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={complete}
                      onClick={() => toggleSkipSession(day.id)}
                    >
                      <SkipForward className="h-4 w-4" />
                      {skipped ? "Unskip" : "Skip"}
                    </Button>
                  </div>
                </div>
              )}
              {!state.customSplit ? <Progress value={complete || skipped ? 100 : progress} className="mt-3 h-2" /> : null}
              {occurrence ? <WorkoutDateControl key={occurrence.sessionKey} state={state} occurrence={occurrence} title={day.focus} setState={setState} onMoved={onMoved} /> : null}
              <div className="mt-3 grid gap-2">
                {day.lifts.map((item) => (
                  <LiftRow
                    key={item.id}
                    state={state}
                    day={day}
                    liftItem={item}
                    target={replacementTarget}
                    setTarget={setReplacementTarget}
                    onReplace={(next) => replaceLift(day.id, item.id, next)}
                    onUpdate={state.customSplit ? (updates) => updateLift(day.id, item.id, updates) : undefined}
                    onRemove={
                      state.customSplit
                        ? () =>
                            ensureCustomSplit((split) =>
                              split.map((splitDay) =>
                                splitDay.id === day.id
                                  ? { ...splitDay, lifts: splitDay.lifts.filter((liftItem) => liftItem.id !== item.id) }
                                  : splitDay
                              )
                            )
                        : undefined
                    }
                  />
                ))}
              </div>
              {state.customSplit ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <SelectField
                    value={newLiftGroups[day.id] ?? day.lifts[0]?.muscleGroup ?? "chest"}
                    onChange={(muscleGroup) => setNewLiftGroups((prev) => ({ ...prev, [day.id]: muscleGroup }))}
                    options={muscleOptions.map((value) => ({ value, label: muscleLabels[value] }))}
                  />
                  <Button variant="outline" className="gap-2 sm:w-auto" onClick={() => addLiftToDay(day)}>
                    <Plus className="h-4 w-4" />
                    Add lift
                  </Button>
                </div>
              ) : null}
              </motion.section>
            );
          })}
          {state.customSplit ? (
            <Button variant="secondary" className="gap-2" onClick={addDay}>
              <Plus className="h-4 w-4" />
              Add training day
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-lg">Meso controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            {mesoTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                aria-pressed={pendingTemplateId === template.id}
                onClick={() => requestTemplate(template)}
                className={[
                  "rounded-[18px] border px-3 py-3 text-left transition",
                  pendingTemplateId === template.id
                    ? "border-amber-300 bg-amber-50 text-amber-950 ring-2 ring-amber-200/70 dark:border-amber-400/40 dark:bg-amber-400/12 dark:text-amber-100 dark:ring-amber-400/15"
                    : state.activeTemplate === template.id && !state.customSplit
                    ? "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-100"
                    : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{template.label}</span>
                  <span className="text-xs opacity-70">
                    {pendingTemplateId === template.id ? "Selected" : `${template.sessions} days`}
                  </span>
                </div>
              </button>
            ))}
            {pendingTemplate ? (
              <div
                role="alertdialog"
                aria-label="Start a new mesocycle"
                className="grid gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100"
              >
                <div>
                  <p className="font-semibold">Start {pendingTemplate.label}?</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">
                    This starts a new mesocycle and replaces the current plan, schedule, and working logs. Completed workout history stays saved.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" onClick={() => setPendingTemplateId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => applyTemplate(pendingTemplate)}>
                    Start {pendingTemplate.label}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <Field label="Days/week" helper={`${state.sessionsPerWeek} sessions`}>
            <Slider
              value={[state.sessionsPerWeek]}
              min={3}
              max={6}
              step={1}
              onValueChange={([sessionsPerWeek]) => updateSessionFrequency(sessionsPerWeek)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Week">
              <Input
                type="number"
                min={1}
                max={state.mesoLengthWeeks}
                value={state.currentWeek}
                onChange={(event) => selectMesoWeek(updateNumber(event.target.value, state.currentWeek))}
              />
            </Field>
            <Field label="Length">
              <Input
                type="number"
                min={3}
                max={8}
                value={state.mesoLengthWeeks}
                onChange={(event) => updateMesoLength(event.target.value)}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, deloadMode: !prev.deloadMode }))}
            className={[
              "flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3 text-left transition",
              state.deloadMode
                ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/12 dark:text-amber-100"
                : "border-slate-200 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
            ].join(" ")}
          >
            <span className="text-sm font-semibold">Deload mode</span>
            <span className="text-xs font-semibold uppercase">{state.deloadMode ? "On" : "Off"}</span>
          </button>

          <Field label="Equipment">
            <SelectField
              value={state.equipment}
              onChange={(equipment) => setState((prev) => ({ ...prev, equipment }))}
              options={equipmentOptions}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Minutes">
              <Input
                type="number"
                value={state.sessionMinutes}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, sessionMinutes: updateNumber(event.target.value, prev.sessionMinutes) }))
                }
              />
            </Field>
            <Field label="Jump">
              <Input
                type="number"
                min={1}
                max={25}
                value={state.weightIncrement}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    weightIncrement: clamp(updateNumber(event.target.value, prev.weightIncrement), 1, 25),
                  }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-3">
            <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Muscle priorities</div>
            {muscleOptions.map((muscleGroup) => (
              <div key={muscleGroup} className="grid gap-2">
                <div className="text-sm font-semibold text-slate-950 dark:text-white">{muscleLabels[muscleGroup]}</div>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {priorityOptions.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => updateMusclePriority(muscleGroup, priority.value)}
                      className={[
                        "rounded-[14px] border px-2 py-2 text-xs font-semibold transition",
                        state.musclePriorities[muscleGroup] === priority.value
                          ? priorityClass[priority.value]
                          : "border-slate-200 bg-white/60 text-slate-500 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
                      ].join(" ")}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Weekly sets</div>
            <MesoSetTargets model={model} state={state} />
          </div>

          <Field label="Goal">
            <SelectField value={state.goal} onChange={(goal) => setState((prev) => ({ ...prev, goal }))} options={goalOptions} />
          </Field>

          <Field label="Energy" helper={`${state.energy}/10`}>
            <Slider
              value={[state.energy]}
              min={1}
              max={10}
              step={1}
              onValueChange={([energy]) => setState((prev) => ({ ...prev, energy }))}
            />
          </Field>

          <Field label="Soreness" helper={`${state.soreness}/10`}>
            <Slider
              value={[state.soreness]}
              min={1}
              max={10}
              step={1}
              onValueChange={([soreness]) => setState((prev) => ({ ...prev, soreness }))}
            />
          </Field>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

function MoreView({
  state,
  model,
  setState,
  goTo,
}: {
  state: AppState;
  model: PlanModel;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  goTo: (view: ViewId) => void;
}) {
  const [analyticsMeso, setAnalyticsMeso] = useState(() => state.mesocycleId);
  const [analyticsWeek, setAnalyticsWeek] = useState("all");
  const [analyticsMuscle, setAnalyticsMuscle] = useState("all");
  const [analyticsExercise, setAnalyticsExercise] = useState("all");
  const [analyticsWorkout, setAnalyticsWorkout] = useState("all");
  const [bodyweightNotice, setBodyweightNotice] = useState<string | null>(null);
  const stepProgress = clamp((state.steps / model.stepTarget) * 100, 0, 100);
  const sleepProgress = clamp((state.sleepHours / 8) * 100, 0, 100);
  const distanceToTarget = state.bodyWeightLb - state.targetWeightLb;
  const today = activeSplitDay(model.split.days, state.activeDayId);
  const analyticsFilter: TrainingAnalyticsFilter = {
    mesocycleId: analyticsMeso === "all" ? undefined : analyticsMeso,
    weekNumber: analyticsWeek === "all" ? undefined : Number(analyticsWeek),
    muscleGroup: analyticsMuscle === "all" ? undefined : analyticsMuscle,
    exerciseId: analyticsExercise === "all" ? undefined : analyticsExercise,
    workoutId: analyticsWorkout === "all" ? undefined : analyticsWorkout,
  };
  const flattenedFeedback = [
    ...Object.values(state.workoutSessions).flatMap((session) =>
      session.feedbackRecords.map((record) => {
        const exercise = record.scope === "exercise" && record.exerciseSlotId
          ? session.exercises.find((item) => item.id === record.exerciseSlotId)
          : undefined;
        return {
          ...record,
          sessionKey: session.sessionKey,
          workoutId: session.dayId,
          dayId: session.dayId,
          mesocycleId: session.mesocycleId,
          weekNumber: session.weekNumber,
          exerciseId: exercise?.exerciseId,
          exerciseName: exercise?.name,
          muscleGroup: record.muscleGroup ?? exercise?.muscleGroup,
          recordedAt: record.recordedAt,
        };
      })
    ),
    ...Object.values(state.recoveryCheckins)
      .filter((checkin) => !checkin.skipped)
      .map((checkin) => {
        const [mesocycleId = "", weekNumber = "", dayId = ""] = checkin.sessionKey.split(":");
        return {
          id: checkin.id,
          sessionKey: checkin.sessionKey,
          workoutId: dayId,
          dayId,
          mesocycleId,
          weekNumber: Number(weekNumber),
          muscleGroup: checkin.muscleGroup,
          recordedAt: checkin.checkedAt,
          soreness: checkin.soreness,
          jointPain: checkin.jointPain,
          readiness: checkin.readiness,
          performanceExpectation:
            checkin.performanceExpectation === "above" ? 4 : checkin.performanceExpectation === "below" ? 1 : 2,
        };
      }),
  ];
  const plannedWorkouts = Array.from({ length: state.mesoLengthWeeks }, (_, weekIndex) =>
    model.baseSplit.days.map((day) => {
      const weekNumber = weekIndex + 1;
      const sessionKey = workoutSessionKey(state.mesocycleId, weekNumber, day.id);
      return {
        id: sessionKey,
        sessionKey,
        workoutId: day.id,
        dayId: day.id,
        mesocycleId: state.mesocycleId,
        weekNumber,
        status: completedSessionKeysForWeek(state.workoutHistory, state.mesocycleId, weekNumber).has(sessionKey)
          ? "completed"
          : state.skippedWorkouts[sessionKey]
            ? "skipped"
            : "planned",
        exerciseIds: day.lifts.map((liftItem) => liftItem.exerciseId ?? liftItem.id),
        exerciseNames: day.lifts.map((liftItem) => liftItem.name),
        muscleGroups: Array.from(new Set(day.lifts.map((liftItem) => liftItem.muscleGroup))),
      };
    })
  ).flat();
  const detailedHistory = state.workoutHistory.map((entry) => ({
    ...entry,
    startedAt: entry.sessionStartedAt,
    durationSeconds: entry.durationSec,
  }));
  const plannedForAnalytics = analyticsMeso === state.mesocycleId ? plannedWorkouts : undefined;
  const detailedAnalytics = buildDetailedTrainingAnalytics(
    { history: detailedHistory, feedback: flattenedFeedback, plannedWorkouts: plannedForAnalytics, weightUnit: "lb" },
    analyticsFilter
  );
  const recoveryMuscles = recentRecoveryMuscles(state.workoutHistory, today);
  const latestRecoveryCheckins = Object.values(state.recoveryCheckins)
    .filter((checkin) => !checkin.skipped)
    .sort((left, right) => right.checkedAt.localeCompare(left.checkedAt))
    .reduce<Partial<Record<MuscleGroup, RecoveryCheckin>>>((latest, checkin) => {
      if (!latest[checkin.muscleGroup]) latest[checkin.muscleGroup] = checkin;
      return latest;
    }, {});
  const maxMuscleVolume = Math.max(0, ...detailedAnalytics.muscles.map((item) => item.totalVolume));
  const latestWorkout = detailedAnalytics.workouts[0] ?? null;
  const bestEstimatedStrengthRecord = detailedAnalytics.personalRecords
    .filter((record) => record.metric === "estimated-strength")
    .sort((left, right) => right.value - left.value)[0] ?? null;
  const mesocycleOptions = Array.from(
    new Set([state.mesocycleId, ...state.workoutHistory.map((entry) => entry.mesocycleId)])
  );
  const optionHistory = analyticsMeso === "all"
    ? state.workoutHistory
    : state.workoutHistory.filter((entry) => entry.mesocycleId === analyticsMeso);
  const exerciseOptions = Array.from(
    new Map(optionHistory.map((entry) => [entry.exerciseId ?? entry.liftId, entry.liftName])).entries()
  ).sort((left, right) => left[1].localeCompare(right[1]));
  const workoutOptions = Array.from(
    new Map(optionHistory.map((entry) => [entry.dayId, entry.dayFocus])).entries()
  );
  const weekOptions = Array.from(
    new Set([
      ...(analyticsMeso === state.mesocycleId
        ? Array.from({ length: state.mesoLengthWeeks }, (_, index) => index + 1)
        : []),
      ...optionHistory.map((entry) => entry.weekNumber),
    ])
  ).sort((left, right) => left - right);
  const bodyweightSummary = summarizeBodyweightHistory(state.bodyWeightHistory);
  const localBodyweightDate = bodyweightLocalDateKey(new Date());
  const hasTodayBodyweight = Boolean(
    localBodyweightDate && state.bodyWeightHistory.some((entry) => entry.date === localBodyweightDate)
  );
  const formatBodyweightDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const logCurrentBodyweight = () => {
    if (!Number.isFinite(state.bodyWeightLb) || state.bodyWeightLb < 70 || state.bodyWeightLb > 500) {
      setBodyweightNotice("Enter a bodyweight between 70 and 500 lb before saving.");
      return;
    }
    const recordedAt = new Date();
    setState((prev) => ({
      ...prev,
      bodyWeightHistory: upsertBodyweightForLocalDay(prev.bodyWeightHistory, {
        weightLb: prev.bodyWeightLb,
        recordedAt,
      }),
    }));
    setBodyweightNotice(`${hasTodayBodyweight ? "Updated" : "Saved"} ${state.bodyWeightLb.toFixed(1)} lb for today.`);
  };
  const analyticsInsightTone = (insight: string) => {
    if (/joint discomfort rose/i.test(insight)) {
      return "border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100";
    }
    if (/strength fell|no completed|no .*available/i.test(insight)) {
      return "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100";
    }
    return "border-emerald-200 bg-emerald-50/65 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100";
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="xl:col-span-2"><TrackerAppSection state={state} model={model} setState={setState} /></div>
      <div className="xl:col-span-2">
        <WeeklyScheduler state={state} model={model} setState={setState} goTo={goTo} />
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="secondary">Readiness</Badge>
                <CardTitle className="mt-2 text-lg">{model.trainingLoad}</CardTitle>
              </div>
              <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                {model.recoveryEvidenceCount} dated check-ins today
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard label="Profile sleep estimate" value={`${state.sleepHours.toFixed(1)}h`} detail="Undated setting, not today's log" Icon={Moon} />
              <StatCard label="Profile steps estimate" value={formatNumber(state.steps)} detail="Undated activity assumption" Icon={Footprints} />
              <StatCard label="Target gap" value={`${distanceToTarget.toFixed(1)} lb`} detail="Current vs target" Icon={Activity} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-between text-sm font-semibold text-slate-950 dark:text-white">
                  <span>Steps</span>
                  <span>{Math.round(stepProgress)}%</span>
                </div>
                <Progress value={stepProgress} className="mt-4" />
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-between text-sm font-semibold text-slate-950 dark:text-white">
                  <span>Sleep</span>
                  <span>{Math.round(sleepProgress)}%</span>
                </div>
                <Progress value={sleepProgress} className="mt-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-rose-500" />
                Training history
              </CardTitle>
              <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                {latestWorkout
                  ? `${latestWorkout.workoutName}${latestWorkout.weekNumber ? ` · Week ${latestWorkout.weekNumber}` : ""}`
                  : "No matching workouts"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2 rounded-[22px] border border-slate-200 bg-white/64 p-3 dark:border-white/10 dark:bg-white/[0.035] sm:grid-cols-2 xl:grid-cols-5">
              <label className="grid gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mesocycle
                <select
                  className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-2 text-sm text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  value={analyticsMeso}
                  onChange={(event) => {
                    setAnalyticsMeso(event.target.value);
                    setAnalyticsWeek("all");
                    setAnalyticsExercise("all");
                    setAnalyticsWorkout("all");
                  }}
                >
                  <option value="all">All mesocycles</option>
                  {mesocycleOptions.map((mesocycleId, index) => <option key={mesocycleId} value={mesocycleId}>{mesocycleId === state.mesocycleId ? "Current mesocycle" : `Mesocycle ${mesocycleOptions.length - index}`}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Week
                <select className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-2 text-sm text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white" value={analyticsWeek} onChange={(event) => setAnalyticsWeek(event.target.value)}>
                  <option value="all">All weeks</option>
                  {weekOptions.map((weekNumber) => <option key={weekNumber} value={weekNumber}>Week {weekNumber}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Muscle
                <select className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-2 text-sm text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white" value={analyticsMuscle} onChange={(event) => setAnalyticsMuscle(event.target.value)}>
                  <option value="all">All muscles</option>
                  {muscleOptions.map((muscleGroup) => <option key={muscleGroup} value={muscleGroup}>{muscleLabels[muscleGroup]}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Exercise
                <select className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-2 text-sm text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white" value={analyticsExercise} onChange={(event) => setAnalyticsExercise(event.target.value)}>
                  <option value="all">All exercises</option>
                  {exerciseOptions.map(([exerciseId, exerciseName]) => <option key={exerciseId} value={exerciseId}>{exerciseName}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Workout
                <select className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-2 text-sm text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white" value={analyticsWorkout} onChange={(event) => setAnalyticsWorkout(event.target.value)}>
                  <option value="all">All workouts</option>
                  {workoutOptions.map(([dayId, dayFocus]) => <option key={dayId} value={dayId}>{dayFocus}</option>)}
                </select>
              </label>
            </div>

            {detailedAnalytics.insights.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {detailedAnalytics.insights.slice(0, 4).map((insight, index) => {
                  const isWarning = /joint discomfort rose|strength fell/i.test(insight);
                  const InsightIcon = isWarning ? Flag : /no completed|no .*available/i.test(insight) ? History : Sparkles;
                  return (
                    <div key={`${insight}-${index}`} className={`flex gap-2 rounded-[18px] border p-3 text-sm ${analyticsInsightTone(insight)}`}>
                      <InsightIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{insight}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Sessions" value={`${detailedAnalytics.aggregate.workoutCount}`} detail="Matching saved workouts" Icon={CalendarDays} />
              <StatCard label="Volume" value={formatNumber(detailedAnalytics.aggregate.totalVolume)} detail="Load volume (lb · reps)" Icon={Dumbbell} />
              <StatCard label="Sets" value={`${detailedAnalytics.aggregate.completedSetCount}`} detail="Completed work sets" Icon={CheckCircle2} />
              <StatCard label="Avg RIR" value={detailedAnalytics.aggregate.averageRir === null ? "—" : `${detailedAnalytics.aggregate.averageRir}`} detail="Completed-set effort" Icon={Gauge} />
              <StatCard
                label="Avg duration"
                value={detailedAnalytics.aggregate.duration ? `${detailedAnalytics.aggregate.duration.averageMinutes}m` : "—"}
                detail={detailedAnalytics.aggregate.duration ? `${detailedAnalytics.aggregate.duration.observedWorkouts} timed workouts` : "No timed workouts in this view"}
                Icon={Clock3}
              />
              <StatCard
                label="Adherence"
                value={detailedAnalytics.adherence.adherencePercent === null ? "—" : `${detailedAnalytics.adherence.adherencePercent}%`}
                detail={
                  detailedAnalytics.adherence.plannedWorkouts === null
                    ? "Available for the current mesocycle"
                    : detailedAnalytics.adherence.plannedWorkouts > 0
                      ? `${detailedAnalytics.adherence.completedWorkouts} of ${detailedAnalytics.adherence.plannedWorkouts} planned`
                      : "No planned workouts match these filters"
                }
                Icon={Target}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Volume by muscle</div>
                {detailedAnalytics.muscles.length > 0 ? (
                  detailedAnalytics.muscles.map((item) => {
                    const muscleGroup = muscleOptions.includes(item.muscleGroup as MuscleGroup)
                      ? item.muscleGroup as MuscleGroup
                      : null;
                    const soreness = item.feedback.trends.soreness?.latest;
                    const jointPain = item.feedback.trends.jointPain?.latest;
                    return (
                      <div key={item.key} className="grid gap-1.5">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="font-semibold text-slate-950 dark:text-white">
                            {muscleGroup ? muscleLabels[muscleGroup] : item.muscleGroup}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {item.completedSetCount} sets · {formatNumber(item.totalVolume)} lb · reps
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-rose-500"
                            style={{
                              width: item.totalVolume > 0 && maxMuscleVolume > 0
                                ? `${clamp((item.totalVolume / maxMuscleVolume) * 100, 4, 100)}%`
                                : "0%",
                            }}
                          />
                        </div>
                        {item.feedback.recordCount > 0 ? (
                          <div className={`text-xs ${jointPain !== undefined && jointPain >= 2 ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                            Latest feedback · soreness {soreness ?? "—"}/4 · joint {jointPain ?? "—"}/4
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[18px] border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    No muscle training or feedback matches these filters.
                  </div>
                )}
              </div>

              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Best estimated lift</div>
                {bestEstimatedStrengthRecord ? (
                  <>
                    <div className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
                      {formatNumber(bestEstimatedStrengthRecord.value)} {bestEstimatedStrengthRecord.unit ?? "lb"}
                    </div>
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">{bestEstimatedStrengthRecord.exerciseName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {bestEstimatedStrengthRecord.achievedAt
                        ? `Logged ${formatDateLabel(bestEstimatedStrengthRecord.achievedAt)}`
                        : "Saved history record"}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No estimated-strength record matches these filters.</div>
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Exercise progression</div>
                <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                  {detailedAnalytics.exercises.length} matching {detailedAnalytics.exercises.length === 1 ? "exercise" : "exercises"}
                </Badge>
              </div>
              {detailedAnalytics.exercises.length > 0 ? (
                detailedAnalytics.exercises.slice(0, 4).map((exercise) => (
                  <div key={exercise.key} className="grid gap-3 rounded-[18px] border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-slate-950 dark:text-white">{exercise.exerciseName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {exercise.completedSetCount} sets · {formatNumber(exercise.totalVolume)} lb · reps
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {([
                        ["Top load", exercise.loadProgression, " lb"],
                        ["Top reps", exercise.repProgression, " reps"],
                        ["Estimated strength", exercise.estimatedStrengthProgression, " lb"],
                      ] as const).map(([label, progression, unit]) => (
                        <div key={label} className="rounded-[14px] border border-slate-200 bg-white/65 p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</div>
                          {progression ? (
                            <>
                              <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                                {formatNumber(progression.latest)}{unit}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {formatNumber(progression.first)} → {formatNumber(progression.latest)}
                                {progression.percentChange === null
                                  ? ""
                                  : ` · ${progression.percentChange > 0 ? "+" : ""}${progression.percentChange}%`}
                              </div>
                            </>
                          ) : (
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Need two matching sessions.</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  Complete a workout or loosen the filters to see exercise progression.
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Feedback trend</div>
                  <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                    {detailedAnalytics.feedback.recordCount} check-ins
                  </Badge>
                </div>
                {detailedAnalytics.feedback.recordCount > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ["Pump", detailedAnalytics.feedback.trends.pump],
                      ["Soreness", detailedAnalytics.feedback.trends.soreness],
                      ["Joint", detailedAnalytics.feedback.trends.jointPain],
                    ] as const).map(([label, trend]) => {
                      const isJointFlag = label === "Joint" && Boolean(trend && (trend.latest >= 2 || trend.direction === "rising"));
                      return (
                        <div key={label} className={`rounded-[14px] border p-2.5 ${isJointFlag ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100" : "border-slate-200 bg-white/65 dark:border-white/10 dark:bg-white/[0.04]"}`}>
                          <div className="text-[10px] font-semibold uppercase opacity-70">{label}</div>
                          <div className="mt-1 text-lg font-semibold">{trend ? `${trend.latest}/4` : "—"}</div>
                          <div className="text-[10px] opacity-70">
                            {trend ? `${trend.direction}${trend.change ? ` · ${trend.change > 0 ? "+" : ""}${trend.change}` : ""}` : "No entries"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No session or readiness feedback matches these filters.</div>
                )}
              </div>

              <div className="grid gap-2 rounded-[24px] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recent sessions</div>
                {detailedAnalytics.workouts.length > 0 ? (
                  detailedAnalytics.workouts.slice(0, 6).map((workout) => (
                    <div key={workout.key} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white/65 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.035]">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{workout.workoutName}</div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {workout.weekNumber ? `Week ${workout.weekNumber} · ` : ""}{formatDateLabel(workout.completedAt)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                        <div className="font-semibold text-slate-950 dark:text-white">{workout.completedSetCount} sets · {formatNumber(workout.totalVolume)}</div>
                        <div>{workout.duration ? `${workout.duration.averageMinutes} min` : "Duration not recorded"}{workout.averageRir === null ? "" : ` · ${workout.averageRir} RIR`}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    No completed sessions match these filters.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-rose-500" />
                Bodyweight
              </CardTitle>
              <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                {bodyweightSummary.sampleCount} {bodyweightSummary.sampleCount === 1 ? "weigh-in" : "weigh-ins"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="grid gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Current weight (lb)
                <Input
                  type="number"
                  inputMode="decimal"
                  min={70}
                  max={500}
                  step={0.1}
                  value={state.bodyWeightLb}
                  onChange={(event) => {
                    setBodyweightNotice(null);
                    setState((prev) => ({ ...prev, bodyWeightLb: updateNumber(event.target.value, prev.bodyWeightLb) }));
                  }}
                />
              </label>
              <Button className="self-end" onClick={logCurrentBodyweight}>
                {hasTodayBodyweight ? "Update today" : "Log today"}
              </Button>
            </div>
            {bodyweightNotice ? (
              <div
                aria-live="polite"
                className={`rounded-[14px] border px-3 py-2 text-xs ${bodyweightNotice.startsWith("Enter") ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"}`}
              >
                {bodyweightNotice}
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[14px] border border-slate-200 bg-white/65 p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Latest</div>
                <div className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                  {bodyweightSummary.latest ? `${bodyweightSummary.latest.weightLb.toFixed(1)} lb` : "—"}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {bodyweightSummary.latest ? formatBodyweightDate(bodyweightSummary.latest.date) : "No saved weight"}
                </div>
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-white/65 p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Total change</div>
                <div className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                  {bodyweightSummary.changeLb === null
                    ? "—"
                    : `${bodyweightSummary.changeLb > 0 ? "+" : ""}${bodyweightSummary.changeLb.toFixed(1)} lb`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {bodyweightSummary.changeLb === null ? "Need two weigh-ins" : `${bodyweightSummary.daySpan} day span`}
                </div>
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-white/65 p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Weekly trend</div>
                <div className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                  {bodyweightSummary.weeklyTrend
                    ? `${bodyweightSummary.weeklyTrend.weeklyChangeLb > 0 ? "+" : ""}${bodyweightSummary.weeklyTrend.weeklyChangeLb.toFixed(1)} lb`
                    : "—"}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {bodyweightSummary.weeklyTrend
                    ? `${bodyweightSummary.weeklyTrend.weeklyChangePercent > 0 ? "+" : ""}${bodyweightSummary.weeklyTrend.weeklyChangePercent.toFixed(2)}% / week`
                    : "3 weigh-ins across 4+ days"}
                </div>
              </div>
            </div>
            {state.bodyWeightHistory.length > 0 ? (
              <div className="grid gap-1.5">
                {[...state.bodyWeightHistory].slice(-5).reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-[12px] border border-slate-200 bg-white/55 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.03]">
                    <span className="text-slate-500 dark:text-slate-400">{formatBodyweightDate(entry.date)}</span>
                    <span className="font-semibold text-slate-950 dark:text-white">{entry.weightLb.toFixed(1)} lb</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                No weigh-ins saved yet. The profile value is not treated as history until you log it.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Sex">
              <SelectField
                value={state.sex}
                onChange={(sex) => setState((prev) => ({ ...prev, sex }))}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age">
                <Input
                  type="number"
                  value={state.age}
                  onChange={(event) => setState((prev) => ({ ...prev, age: updateNumber(event.target.value, prev.age) }))}
                />
              </Field>
              <Field label="Height">
                <Input
                  type="number"
                  value={state.heightIn}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, heightIn: updateNumber(event.target.value, prev.heightIn) }))
                  }
                />
              </Field>
            </div>
            <Field label="Target weight (lb)">
              <Input
                type="number"
                value={state.targetWeightLb}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, targetWeightLb: updateNumber(event.target.value, prev.targetWeightLb) }))
                }
              />
            </Field>
            <Field label="Goal">
              <SelectField value={state.goal} onChange={(goal) => setState((prev) => ({ ...prev, goal }))} options={goalOptions} />
            </Field>
            <Field label="Sleep" helper={`${state.sleepHours.toFixed(1)} hours`}>
              <Slider
                value={[state.sleepHours]}
                min={4}
                max={9}
                step={0.1}
                onValueChange={([sleepHours]) => setState((prev) => ({ ...prev, sleepHours }))}
              />
            </Field>
            <Field label="Energy" helper={`${state.energy}/10`}>
              <Slider
                value={[state.energy]}
                min={1}
                max={10}
                step={1}
                onValueChange={([energy]) => setState((prev) => ({ ...prev, energy }))}
              />
            </Field>
            <Field label="Steps">
              <Input
                type="number"
                value={state.steps}
                onChange={(event) => setState((prev) => ({ ...prev, steps: updateNumber(event.target.value, prev.steps) }))}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">Recovery</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/60 dark:bg-white/[0.04]">
                  {today ? today.focus : "Next"}
                </Badge>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => goTo("today")}>
                  Today <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recoveryMuscles.length > 0 ? (
              recoveryMuscles.map((muscleGroup) => (
                <RecoverySummaryCard
                  key={muscleGroup}
                  muscleGroup={muscleGroup}
                  feedback={state.muscleFeedback[muscleGroup]}
                  checkin={latestRecoveryCheckins[muscleGroup]}
                />
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Add lifts to your split to track recovery.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  const [initialLoad] = useState(() => loadAppStateSafely({
    storage: { getItem: key => window.localStorage.getItem(key) },
    key: STORAGE_KEY, legacyKeys: LEGACY_STORAGE_KEYS, defaultState, normalize: normalizeSavedAppState,
  }));
  const [state, setAppState] = useState<AppState>(initialLoad.state);
  const [stateLocks] = useState<StateLockManager | null>(() => {
    try {
      const locks = typeof navigator !== "undefined" ? navigator.locks : null;
      return locks && typeof locks.request === "function" ? locks : null;
    }
    catch { return null; }
  });
  const [persistence] = useState(() => initialLoad.baselineRaw === undefined ? null : createQueuedStatePersistence({
    storage: { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) },
    key: STORAGE_KEY, locks: stateLocks, baselineRaw: initialLoad.baselineRaw,
  }));
  const mountedRef = React.useRef(true);
  const restorePendingRef = React.useRef(false);
  const [loadProblem, setLoadProblem] = useState<string | null>(initialLoad.problem);
  const [nutritionDate, setNutritionDate] = useState(() => foodDiaryDateKey(new Date()));
  const [activeView, setActiveView] = useState<ViewId>(() => initialView());
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [storageConflict, setStorageConflict] = useState(false);
  const [persistenceBlocked, setPersistenceBlocked] = useState<string | null>(() => !stateLocks
    ? "Safe saving is unavailable in this browser. Editing and restore are paused; export a copy and reopen in a browser that supports Web Locks."
    : null);
  const [restorePending, setRestorePending] = useState(false);
  const editingBlocked = storageConflict || Boolean(loadProblem) || Boolean(persistenceBlocked) || restorePending;
  const editingBlockedRef = React.useRef(editingBlocked);
  editingBlockedRef.current = editingBlocked;
  const setState = React.useCallback<React.Dispatch<React.SetStateAction<AppState>>>((update) => {
    if (!editingBlockedRef.current) setAppState(update);
  }, []);
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const scrollViewportRef = React.useRef<HTMLDivElement | null>(null);
  const viewScrollPositions = React.useRef<Partial<Record<ViewId, number>>>({});
  const model = useMemo(() => computePlan(state, nutritionDate), [state, nutritionDate]);
  useEffect(() => {
    if (editingBlocked || state.trackerProgram?.settings.adjustmentMode !== "Fully automatic") return;
    const context = trackerContextFor(state, nutritionDate);
    const proposal = buildTrackerProposal(state.trackerProgram, state, nutritionDate, context);
    if (!proposal || proposal.blocked) return;
    setState(prev => {
      if (!prev.trackerProgram || prev.trackerProgram.settings.adjustmentMode !== "Fully automatic") return prev;
      const currentContext = trackerContextFor(prev, nutritionDate);
      try {
        const trackerProgram = decideTrackerProposal(prev.trackerProgram, prev, proposal, "automatic", nutritionDate, new Date().toISOString(), currentContext);
        return { ...prev, trackerProgram };
      } catch { return prev; } // A stale automatic proposal waits for the next render's fresh evidence.
    });
  }, [state.trackerProgram, state.foodLog, state.bodyWeightHistory, state.workoutHistory, state.recoveryCheckins, nutritionDate, editingBlocked, setState]);
  const restTimerSession = state.restTimer
    ? state.workoutSessions[state.restTimer.sessionKey] ?? null
    : null;
  const restTimerExerciseName = restTimerSession?.exercises.find(
    (exercise) => exercise.id === state.restTimer?.liftId
  )?.name;

  useEffect(() => {
    const refreshDate = () => setNutritionDate(foodDiaryDateKey(new Date()));
    const interval = window.setInterval(refreshDate, 30_000);
    window.addEventListener("focus", refreshDate);
    document.addEventListener("visibilitychange", refreshDate);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refreshDate); document.removeEventListener("visibilitychange", refreshDate); };
  }, []);

  const handlePersistenceResult = React.useCallback((result: TransactionalStateWriteResult) => {
    if (!mountedRef.current || result.status === "cancelled") return;
    if (result.status === "saved" || result.status === "unchanged") {
      setPersistenceError(null);
      return;
    }
    editingBlockedRef.current = true;
    if (result.status === "conflict") {
      setStorageConflict(true);
      setPersistenceError("Another tab changed the saved data. Saving is paused here so this tab cannot replace those changes.");
    } else {
      const message = result.status === "unavailable" || (result.status === "error" && result.operation === "lock")
        ? "Safe saving could not acquire a browser lock. Editing and restore are paused. Export this tab's copy, then reload. No unlocked save was attempted."
        : "This device could not save your latest changes. Editing and restore are paused. Export this tab's copy before reloading to avoid losing unsaved edits.";
      setPersistenceBlocked(message);
      setPersistenceError(message);
    }
  }, []);

  const checkForNewerSave = React.useCallback(() => {
    if (!persistence || !mountedRef.current) return false;
    const observation = persistence.observe();
    if (observation.status === "current" || observation.status === "own-write-pending") return true;
    persistence.halt();
    editingBlockedRef.current = true;
    if (observation.status === "conflict") {
      setStorageConflict(true);
      setPersistenceError("Another tab changed the saved data. Saving is paused here so this tab cannot replace those changes.");
    } else {
      const message = "Saved data could not be read. Editing and saving are paused. Export this tab's copy before reloading.";
      setPersistenceBlocked(message);
      setPersistenceError(message);
    }
    return false;
  }, [persistence]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; persistence?.cancelPending(); };
  }, [persistence]);

  useEffect(() => {
    if (editingBlockedRef.current || restorePendingRef.current || !persistence) return;
    try {
      void persistence.autosave(JSON.stringify(state)).then(result => {
        handlePersistenceResult(result);
        if (result.status === "saved" || result.status === "unchanged") checkForNewerSave();
      }).catch(() => {
        if (!mountedRef.current) return;
        persistence.halt();
        editingBlockedRef.current = true;
        setPersistenceBlocked("Saving stopped unexpectedly. Export this tab's copy before reloading.");
      });
    } catch {
      editingBlockedRef.current = true;
      setPersistenceBlocked("This tab's data could not be prepared for saving. Editing is paused; export a copy before reloading.");
    }
  }, [state, persistence, editingBlocked, handlePersistenceResult, checkForNewerSave]);

  useEffect(() => {
    // Keep legacy theme data readable in backups; the interface is dark-only.
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) checkForNewerSave();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", checkForNewerSave);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", checkForNewerSave);
    };
  }, [checkForNewerSave]);

  const downloadTabCopy = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bodypilot-tab-copy-${foodDiaryDateKey(new Date())}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const restoreBackup = async (raw: BackupState): Promise<{ ok: boolean; message?: string }> => {
    if (storageConflict || persistenceBlocked || !persistence || restorePendingRef.current) {
      return { ok: false, message: "Reload the latest saved data before restoring a backup." };
    }
    try {
      const source = validateBackupState(raw);
      const restored = normalizeAppState(source);
      const changes = backupNormalizationChanges(source, restored as unknown as BackupState);
      if (changes.length) {
        return { ok: false, message: `This file cannot be restored without changing its ${changes.slice(0, 3).join(", ")} records. Nothing was replaced. Keep the file for recovery.` };
      }
      restorePendingRef.current = true;
      editingBlockedRef.current = true;
      setRestorePending(true);
      // Invalidates old autosaves; only a successful locked write replaces the UI.
      const result = await persistence.replace(JSON.stringify(restored));
      handlePersistenceResult(result);
      if (result.status !== "saved" && result.status !== "unchanged") {
        return { ok: false, message: result.status === "conflict"
          ? "Another tab changed the saved data. Reload before restoring so those changes are not overwritten."
          : "Restore did not save. Your current data has not been replaced; keep both backup files and reload before trying again." };
      }
      if (!mountedRef.current) return { ok: false, message: "The view closed during restore. Reload to inspect the latest saved data." };
      if (!checkForNewerSave()) {
        return { ok: false, message: "The backup was written, but the latest saved data could not be verified afterward. Keep both backup files and reload to inspect the current saved version." };
      }
      setAppState(restored);
      setLoadProblem(null);
      setPersistenceError(null);
      setShowResetPrompt(false);
      setNotificationNotice(null);
      return { ok: true };
    } catch (cause) {
      return { ok: false, message: cause instanceof Error ? cause.message : "This backup could not be restored. Nothing was replaced." };
    } finally {
      restorePendingRef.current = false;
      if (mountedRef.current) setRestorePending(false);
    }
  };

  useEffect(() => {
    if (editingBlocked) return undefined;
    const timer = state.restTimer;
    if (!timer) return undefined;
    if (!restTimerSession) {
      setState((prev) => (prev.restTimer === timer ? { ...prev, restTimer: null } : prev));
      return undefined;
    }
    if (restTimerSession.status === "paused") return undefined;
    const remainingMs = timer.endsAt - Date.now();
    if (remainingMs <= 0) {
      setState((prev) =>
        prev.restTimer?.sessionKey === timer.sessionKey &&
        prev.restTimer.setId === timer.setId &&
        prev.restTimer.endsAt === timer.endsAt
          ? { ...prev, restTimer: null }
          : prev
      );
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setState((prev) =>
        prev.restTimer?.sessionKey === timer.sessionKey &&
        prev.restTimer.setId === timer.setId &&
        prev.restTimer.endsAt === timer.endsAt
          ? { ...prev, restTimer: null }
          : prev
      );
    }, remainingMs + 50);
    return () => window.clearTimeout(timeout);
  }, [restTimerSession, setState, state.restTimer, editingBlocked]);

  useEffect(() => {
    if (editingBlocked) return undefined;
    const timer = state.restTimer;
    if (!timer || !restTimerSession || restTimerSession.status === "paused" || timer.endsAt <= Date.now()) {
      setNotificationNotice(null);
      return undefined;
    }
    let stale = false;
    void scheduleRestTimerNotification({
      sessionKey: timer.sessionKey,
      setId: timer.setId,
      endsAt: timer.endsAt,
      exerciseName: restTimerExerciseName,
      requestPermission: Date.now() - timer.startedAt < 15_000,
    })
      .then((result) => {
        if (stale) return;
        if (result === "permission-required") {
          setNotificationNotice("Rest alerts need notification permission. The in-app timer will continue to work.");
        } else if (result === "scheduled" || result === "unsupported" || result === "expired") {
          setNotificationNotice(null);
        }
      })
      .catch((error: unknown) => {
        console.warn("Unable to schedule the rest-timer notification.", error);
        if (!stale) setNotificationNotice("The rest alert could not be scheduled. The in-app timer is still active.");
      });
    return () => {
      stale = true;
      // The in-app timer clears just after its deadline. Do not retract a
      // notification that is already due and may still be crossing the OS boundary.
      if (!shouldCancelPendingRestTimerNotification(timer.endsAt)) return;
      void cancelRestTimerNotification(timer).catch((error: unknown) => {
        console.warn("Unable to cancel the rest-timer notification.", error);
      });
    };
  }, [restTimerExerciseName, restTimerSession?.status, state.restTimer, editingBlocked]);

  useEffect(() => {
    const syncViewFromHash = () => {
      if (restorePendingRef.current) return;
      const value = window.location.hash.replace("#", "");
      if (viewItems.some((item) => item.id === value)) setActiveView(value as ViewId);
    };

    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  const goTo = (view: ViewId) => {
    if (restorePendingRef.current) return;
    viewScrollPositions.current[activeView] = window.scrollY || scrollViewportRef.current?.scrollTop || 0;
    setActiveView(view);
    window.history.replaceState(null, "", `#${view}`);
    window.requestAnimationFrame(() => {
      scrollViewportRef.current?.scrollTo({ top: viewScrollPositions.current[view] ?? 0, behavior: "auto" });
      window.scrollTo({ top: viewScrollPositions.current[view] ?? 0, behavior: "auto" });
    });
  };

  const activeMeta = viewItems.find((item) => item.id === activeView) ?? viewItems[0];
  const ActiveIcon = activeMeta.Icon;

  return (
    <main className="ai-app-shell app-shell-mobile-safe min-h-dvh text-slate-950 dark:text-slate-50">
      <div ref={scrollViewportRef} className="mx-auto flex w-full max-w-[1480px] gap-5 px-4 py-4 sm:px-5 lg:px-6 lg:py-6">
        <aside className="hidden w-[188px] shrink-0 lg:block">
          <div className="premium-sidebar sticky top-6 p-4">
            <BodyPilotLogo size="md" showTagline={false} />
            <nav className="mt-5 space-y-2">
              {viewItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.id)}
                  aria-current={activeView === item.id ? "page" : undefined}
                  className={[
                    "core-nav-item flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left transition",
                    activeView === item.id
                      ? "border-rose-200 bg-rose-50 text-rose-950 shadow-sm dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/72 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{item.label}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <section className="ai-content min-w-0 flex-1 lg:pb-0">
          <header className="core-header mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <BodyPilotLogo size="sm" showTagline={false} />
            </div>
            <div className="hidden min-w-0 lg:block">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><ActiveIcon className="h-4 w-4" />{activeMeta.label}</h2>
            </div>
            <div className="flex items-center gap-2">
              {!loadProblem ? <Badge variant="outline" className="hidden bg-white/60 dark:bg-white/[0.04] sm:inline-flex">
                {goals[state.goal].label}
              </Badge> : null}
              {activeView === "more" ? <Button variant="ghost" size="sm" className="gap-2" disabled={editingBlocked} onClick={() => setShowResetPrompt(true)}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button> : null}
            </div>
          </header>

          {persistenceError ? (
            <div
              role="alert"
              className="mb-4 flex items-start justify-between gap-3 rounded-[18px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100"
            >
              <span>{persistenceError}</span>
              {!storageConflict && !persistenceBlocked ? <button type="button" className="shrink-0" onClick={() => setPersistenceError(null)} aria-label="Dismiss save warning">
                <X className="h-4 w-4" />
              </button> : null}
            </div>
          ) : null}

          {notificationNotice ? (
            <div
              role="status"
              className="mb-4 flex items-start justify-between gap-3 rounded-[18px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
            >
              <span>{notificationNotice}</span>
              <button type="button" className="shrink-0" onClick={() => setNotificationNotice(null)} aria-label="Dismiss rest alert notice">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {restorePending ? <p role="status" aria-live="polite" className="mb-3 rounded-xl border border-sky-400/25 bg-sky-400/10 p-3 text-sm text-sky-100">Saving the restored backup… Keep this tab open. Editing is paused until the save finishes.</p> : null}
          <fieldset disabled={restorePending} aria-busy={restorePending} className="m-0 min-w-0 border-0 p-0">
          {storageConflict ? (
            <Card>
              <CardContent className="grid gap-3 p-5">
                <h2 className="text-lg font-semibold">Open the latest saved data</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Reloading replaces this tab's unsaved changes with the saved version. Download this tab's copy first if you need to keep it. The copy is a local JSON record, not a cloud backup.</p>
                <Button variant="outline" className="min-h-11" onClick={downloadTabCopy}>Download this tab's copy</Button>
                <Button className="min-h-11" onClick={() => window.location.reload()}>Reload saved data</Button>
              </CardContent>
            </Card>
          ) : loadProblem ? (
            <div className="grid gap-4">
              <Card><CardContent className="grid gap-3 p-5">
                <h2 className="text-lg font-semibold">Your saved data needs attention</h2>
                <p role="alert" className="text-sm text-rose-700 dark:text-rose-200">{loadProblem}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Nothing has been overwritten. Editing and automatic saving are paused. Keep a copy of the original saved data before restoring a trusted backup.</p>
                <Button variant="outline" className="min-h-11" onClick={() => window.location.reload()}>Try loading saved data again</Button>
              </CardContent></Card>
              {initialLoad.recoveryCopy ? <BackupRestorePanel currentState={state as unknown as BackupState} onRestore={restoreBackup}
                recoveryCopy={initialLoad.recoveryCopy}
                restoreBlockedReason={persistenceBlocked ?? (!persistence ? "Device storage is unavailable. Reload once access is restored." : undefined)} /> : null}
            </div>
          ) : persistenceBlocked ? (
            <div className="grid gap-4">
              <Card><CardContent className="grid gap-3 p-5">
                <h2 className="text-lg font-semibold">Saving is paused</h2>
                <p role="alert" className="text-sm text-amber-200">{persistenceBlocked}</p>
                <p className="text-sm text-slate-300">This tab is read-only. A downloaded copy includes the data currently visible here, including any edits that have not saved.</p>
                <Button variant="outline" className="min-h-11" onClick={downloadTabCopy}>Download this tab's copy</Button>
                <Button className="min-h-11" onClick={() => window.location.reload()}>Reload saved data</Button>
              </CardContent></Card>
            </div>
          ) : <>
          {activeView === "home" ? <HomeView state={state} model={model} setState={setState} goTo={goTo} /> : null}
          {activeView === "today" ? <TodayView state={state} model={model} setState={setState} goTo={goTo} /> : null}
          {activeView === "food" ? <FoodView state={state} model={model} setState={setState} /> : null}
          {activeView === "training" ? <TrainingView state={state} model={model} setState={setState} goTo={goTo} /> : null}
          {activeView === "more" ? <MoreView state={state} model={model} setState={setState} goTo={goTo} /> : null}
          {activeView === "more" ? <div className="mt-5"><BackupRestorePanel currentState={state as unknown as BackupState} onRestore={restoreBackup} /></div> : null}
          </>}
          </fieldset>
        </section>
      </div>

      <nav className="mobile-dock fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 lg:hidden">
        <div className="mobile-control-glass grid w-full max-w-[460px] grid-cols-5 gap-1 rounded-[26px] border border-white/70 bg-white/88 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/88">
          {viewItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              aria-current={activeView === item.id ? "page" : undefined}
              className={[
                "core-nav-item flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-[11px] font-semibold transition",
                activeView === item.id
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <item.Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showResetPrompt && !editingBlocked ? (
        <div className="fixed inset-0 z-[90] grid items-end bg-slate-950/65 p-3 backdrop-blur-sm sm:place-items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-app-title"
            aria-describedby="reset-app-description"
            className="w-full max-w-md rounded-[26px] border border-white/15 bg-white p-5 shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-300">Local data</div>
                <h2 id="reset-app-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                  Reset the app?
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowResetPrompt(false)} aria-label="Close reset dialog">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p id="reset-app-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This removes the local plan, workout history, feedback, food log, schedule, and bodyweight history from this device.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" autoFocus onClick={() => setShowResetPrompt(false)}>
                Keep my data
              </Button>
              <Button
                className="bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => {
                  if (editingBlockedRef.current) return;
                  setState(defaultState);
                  setShowResetPrompt(false);
                  setNotificationNotice(null);
                }}
              >
                Reset local data
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
