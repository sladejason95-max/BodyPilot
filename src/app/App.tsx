import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  Cloud,
  CloudOff,
  Gauge,
  Layers3,
  Sparkles,
  Settings2,
  ShieldCheck,
  LayoutDashboard,
  Utensils,
  Pill,
  Dumbbell,
  ListChecks,
  CalendarRange,
  NotebookPen,
  MailPlus,
  UserMinus,
  X,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs as SharedTabs,
  TabsContent as SharedTabsContent,
  TabsList as SharedTabsList,
  TabsTrigger as SharedTabsTrigger,
} from "../components/ui/tabs";
import {
  exerciseLibrary as exerciseLibraryData,
  type ExerciseLibraryItem,
} from "../lib/data/exerciseLibrary";
import type {
  ChangeLogEntry,
  CheckIn,
  CheckInPhotoSlot,
  CoachThreadMessage,
  Compound,
  CompoundScienceProfile,
  DecisionBrief,
  DecisionSignalGate,
  DecisionSignalGateItem,
  FoodCatalogItem,
  FoodDaySnapshot,
  FoodLogItemInput,
  Meal,
  MealTemplate,
  MonthDirection,
  PeakWeekDayPlan,
  PeakWeekGoal,
  PublishedCoachDecision,
  ScheduleEvent,
  SupplementProtocol,
  TrackerDay,
  TrackerLift,
  TrackerTask,
  WearableRecoverySnapshot,
  WeeklySnapshot,
  WorkoutDay,
} from "./types";
import {
  clamp,
  quoteBank,
  scheduleDayOrder,
} from "./constants";
import {
  initialChangeLog,
  initialCheckIns,
  initialCompounds,
  initialMeals,
  initialMealTemplates,
  initialSchedule,
  initialSupplements,
  initialTrackerDays,
  initialTrackerTasks,
  initialWeeklySnapshots,
} from "./initial_stage_prep_data";
import { compoundLibraryCatalog } from "./compound_library_catalog";
import {
  AnalyticsStat,
  type AccentTone,
  CoachRosterRail,
  HeroPill,
  SectionCard,
} from "./workspace_ui";
import {
  buildCoachTriageFilterOptions,
  buildCoachTriageRows,
  coachTriageBucketLabel,
  coachTriagePriorityLabel,
  filterCoachTriageRows,
  type CoachTriageFilter,
  type CoachTriageRow,
} from "./coach_triage";
import WorkspaceSidebar from "./WorkspaceSidebar";
import type { SettingsSection } from "./SettingsPanel";
import { BODY_PILOT_BRAND, BodyPilotLogo } from "./brand";
import {
  createLocalBodyPilotAccount,
  deleteLocalBodyPilotAccount,
  requestLocalBodyPilotPasswordReset,
  signInLocalBodyPilotAccount,
  updateLocalBodyPilotAccount,
  verifyLocalBodyPilotEmail,
  type BodyPilotCreateAccountInput,
  type BodyPilotCredentials,
} from "./auth_adapter";
import {
  bodyPilotBackendReadiness,
  bodyPilotFoodReadiness,
  defaultBodyPilotAccount,
  defaultNotificationPreferences,
  normalizeBodyPilotAccount,
  normalizeNotificationPreferences,
  type BackupRestorePreview,
  type BodyPilotAccount,
  type MembershipAdapterCapability,
  type NotificationDeliveryContract,
  type NotificationPreferences,
  type NotificationReminderScheduleItem,
  type ProductionAdapterContract,
  type ProductionTrustSignal,
  type SyncConflictPolicy,
  type SyncLedgerEvent,
} from "./product_infrastructure";
import {
  clearLocalBodyPilotMembershipRecords,
  localBodyPilotMembershipAdapter,
  normalizeLocalBodyPilotMembershipRecords,
  readLocalBodyPilotMembershipRecords,
  writeLocalBodyPilotMembershipRecords,
  type BodyPilotMembershipRecord,
} from "./membership_adapter";
import { localBodyPilotNotificationAdapter } from "./notification_adapter";
import {
  buildLiveBackendConnectors,
  type LiveBackendConnector,
} from "./live_backend_connectors";
import {
  buildBodyWeightTrendModel,
  buildDecisionConfidenceModel,
  buildDietPressureModel,
  buildFuelTimingModel,
  buildHydrationSupportModel,
  buildProteinSupportModel,
  buildRecoveryPressureModel,
} from "./science_model";
import {
  buildExerciseScientificProfile,
  buildMealPlanScienceProfile,
  movementPatternLibrary,
  resolveFocusPatternTargets,
  type ExerciseScientificProfile,
} from "./performance_libraries";
import { buildMonitoringSnapshot } from "./monitoring_engine";
import { buildPerformanceInsightSnapshot } from "./insight_engine";
import { buildConditioningSnapshot } from "./conditioning_engine";
import {
  athleteLevelOptions,
  buildEcosystemPlanSnapshot,
  checkInCadenceOptions,
  coachCadenceOptions,
  conditioningPriorityOptions,
  goalFocusOptions,
  phaseTypeOptions,
  type AthleteLevel,
  type CheckInCadence,
  type CoachCadence,
  type ConditioningPriority,
  type GoalFocus,
  type PhaseType,
} from "./ecosystem_planning";
import { buildContestPrepModel, type ContestPrepModel } from "./prep_model";
import { buildPrepSignalSnapshot } from "./prep_signal_engine";
import {
  buildCompoundMonitoringSnapshot,
  buildSupportStackSnapshot,
} from "./support_stack_engine";
import { buildAdaptationSnapshot } from "./adaptation_engine";
import { buildCheckInReviewSnapshot } from "./review_engine";
import { buildCheckInVisualReview } from "./checkin_visuals";
import NutritionTab from "./tabs/NutritionTab";
import { coreFoodCatalog } from "../lib/data/foodCatalog";
import { expandedFoodCatalog } from "../lib/data/expandedFoodCatalog";
import {
  cloneMealFoodEntries,
  createMealFoodEntry,
  hydrateMealFromFoodEntries,
  resolveFoodServingSelection,
  summarizeDayFoodNutrients,
} from "./food_engine";
import { buildPeakWeekModel } from "../lib/models/peakWeekModel";

const DashboardTab = lazy(() => import("./tabs/DashboardTab"));
const CompoundsTab = lazy(() => import("./tabs/CompoundsTab"));
const SplitTab = lazy(() => import("./tabs/SplitTab"));
const TrackerTab = lazy(() => import("./tabs/TrackerTab"));
const ScheduleTab = lazy(() => import("./tabs/ScheduleTab"));
const LibraryTab = lazy(() => import("./tabs/LibraryTab"));
const CoachTab = lazy(() => import("./tabs/CoachTab"));
const AICoachTab = lazy(() => import("./tabs/AICoachTab"));
const SettingsPanel = lazy(() => import("./SettingsPanel"));

const Tabs = (props: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; className?: string; children: React.ReactNode }) => {
  const Component = SharedTabs as React.ComponentType<any>;
  return <Component {...props} />;
};

const TabsList = (props: { className?: string; children: React.ReactNode }) => {
  const Component = SharedTabsList as React.ComponentType<any>;
  return <Component {...props} />;
};

const TabsTrigger = (props: { value: string; className?: string; children: React.ReactNode }) => {
  const Component = SharedTabsTrigger as React.ComponentType<any>;
  return <Component {...props} />;
};

const TabsContent = (props: { value: string; className?: string; children: React.ReactNode }) => {
  const Component = SharedTabsContent as React.ComponentType<any>;
  return <Component {...props} />;
};

const splitTemplateOptions = [
  { id: "ppl6", label: "PPLPPLx" },
  { id: "upperlower", label: "Upper / Lower" },
  { id: "hful", label: "High Frequency U/L" },
  { id: "arnold", label: "Arnold Split" },
  { id: "bro", label: "Bro Split" },
] as const;

const themeOptions = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

const defaultAdvancedEditors = {
  nutrition: true,
  nutritionControls: true,
  compounds: false,
  split: true,
  tracker: true,
  schedule: false,
};

const defaultEstimatedMaxes = {
  bench: 315,
  squat: 405,
  deadlift: 495,
  overheadPress: 185,
} as const;

const compoundExposurePalette = ["#22c55e", "#60a5fa", "#facc15", "#f472b6", "#c084fc", "#fb7185"] as const;

const REST_SESSION_ID = "__rest__" as const;
const STORAGE_KEY = "bodypilot-v1";
const LEGACY_STORAGE_KEY = "stage-prep-elite-v2";
const BODY_PILOT_DATA_ENVELOPE_VERSION = 2;
const BODY_PILOT_BACKUP_KEYS = [
  "accountProfile",
  "membershipRecords",
  "setupGuideDismissed",
  "athleteName",
  "bodyWeight",
  "meals",
  "mealTemplates",
  "customFoods",
  "foodDayHistory",
  "favoriteFoodIds",
  "recentFoodIds",
  "trackerDays",
  "trackerTasks",
  "workoutSplit",
  "schedule",
  "changeLog",
  "publishedCoachDecisions",
  "coachThreadMessages",
  "checkIns",
  "weeklySnapshots",
  "wearableSnapshots",
  "notificationPreferences",
  "selectedCalendarDate",
  "contestDate",
  "appTheme",
  "lastBackupExportedAt",
] as const;
const BODY_PILOT_RESTORE_DIFF_SECTIONS = [
  { key: "membershipRecords", label: "Memberships", detail: "coach-client relationships" },
  { key: "meals", label: "Meals", detail: "current food log" },
  { key: "mealTemplates", label: "Templates", detail: "saved meals" },
  { key: "customFoods", label: "Custom foods", detail: "personal database" },
  { key: "foodDayHistory", label: "Food history", detail: "daily nutrition records" },
  { key: "trackerDays", label: "Tracker days", detail: "daily adherence logs" },
  { key: "workoutSplit", label: "Training days", detail: "split sessions" },
  { key: "schedule", label: "Schedule", detail: "calendar events" },
  { key: "checkIns", label: "Check-ins", detail: "visual and review records" },
  { key: "publishedCoachDecisions", label: "Plan versions", detail: "published coach calls" },
  { key: "coachThreadMessages", label: "Messages", detail: "coach thread items" },
  { key: "weeklySnapshots", label: "Reviews", detail: "weekly snapshots" },
  { key: "wearableSnapshots", label: "Recovery imports", detail: "wearable snapshots" },
  { key: "changeLog", label: "Change log", detail: "local audit items" },
] as const;

type SplitTemplateId = (typeof splitTemplateOptions)[number]["id"];
type AppTab = "dashboard" | "ai-coach" | "nutrition" | "compounds" | "split" | "tracker" | "library" | "schedule" | "coach";
type NotificationPermissionState = NotificationPermission | "unsupported";
type AccountStatusTone = "info" | "success" | "warning";
const appTabValues: readonly AppTab[] = ["dashboard", "ai-coach", "nutrition", "compounds", "split", "tracker", "library", "schedule", "coach"];
const resolveInitialAppTab = (): AppTab => {
  if (typeof window === "undefined") return "dashboard";
  const requested = window.location.hash.replace(/^#/, "");
  return appTabValues.includes(requested as AppTab) ? (requested as AppTab) : "dashboard";
};
const readNotificationPermission = (): NotificationPermissionState => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
};
const formatLocalSaveTime = (value: string | null): string => {
  if (!value) return "Waiting for first save";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Saved locally";
  return `Saved ${parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
};
const formatLedgerTimeLabel = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "Unknown";
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
const truncateLedgerDetail = (value: string, maxLength = 120) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const readBackupNumericVersion = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const getKnownBodyPilotBackupKeyCount = (value: Record<string, unknown>) =>
  BODY_PILOT_BACKUP_KEYS.reduce(
    (count, key) => (Object.prototype.hasOwnProperty.call(value, key) ? count + 1 : count),
    0
  );
const formatBackupVersionLabel = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") return String(value);
  return "Missing";
};
const formatBackupTimestampLabel = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return "Missing";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unreadable";
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
const formatBackupFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const countBackupArrayValue = (value: Record<string, unknown>, key: string) => {
  const candidate = value[key];
  return Array.isArray(candidate) ? candidate.length : 0;
};
const buildBackupRestoreDiffs = (
  backupPayload: Record<string, unknown> | null,
  currentPayload: Record<string, unknown> | null
): BackupRestorePreview["diffs"] => {
  if (!backupPayload) return [];

  return BODY_PILOT_RESTORE_DIFF_SECTIONS.map((section) => {
    const currentCount = currentPayload ? countBackupArrayValue(currentPayload, section.key) : 0;
    const backupCount = countBackupArrayValue(backupPayload, section.key);
    const delta = backupCount - currentCount;
    const status: BackupRestorePreview["diffs"][number]["status"] =
      delta === 0 ? "same" : delta > 0 ? "gain" : "loss";
    const deltaLabel = delta === 0 ? "No change" : delta > 0 ? `+${delta}` : String(delta);

    return {
      label: section.label,
      detail: section.detail,
      currentValue: String(currentCount),
      backupValue: String(backupCount),
      deltaLabel,
      status,
    };
  });
};
const summarizeBackupRestoreDiffs = (diffs: BackupRestorePreview["diffs"]) => {
  if (diffs.length === 0) return "No comparable sections found.";
  const changedCount = diffs.filter((item) => item.status !== "same").length;
  const lossCount = diffs.filter((item) => item.status === "loss").length;

  if (changedCount === 0) return "The tracked sections match the current workspace counts.";
  if (lossCount > 0) {
    return `${changedCount} sections will change; ${lossCount} have fewer records in the backup.`;
  }
  return `${changedCount} sections will change; the backup has equal or more records in changed sections.`;
};
const isValidBodyPilotBackupPayload = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;

  const knownKeyCount = getKnownBodyPilotBackupKeyCount(value);
  const hasBodyPilotVersion = value.backupVersion === 1 || value.backupVersion === "1";
  const dataEnvelopeVersion = readBackupNumericVersion(value.dataEnvelopeVersion);
  const isFutureEnvelope =
    dataEnvelopeVersion !== null && dataEnvelopeVersion > BODY_PILOT_DATA_ENVELOPE_VERSION;

  return !isFutureEnvelope && ((hasBodyPilotVersion && knownKeyCount >= 1) || knownKeyCount >= 3);
};
const buildBackupRestorePreview = (
  value: unknown,
  file: File,
  currentPayload: Record<string, unknown> | null
): BackupRestorePreview => {
  const payload = isRecord(value) ? value : null;
  const knownKeyCount = payload ? getKnownBodyPilotBackupKeyCount(payload) : 0;
  const backupVersion = payload?.backupVersion;
  const dataEnvelopeVersion = payload?.dataEnvelopeVersion;
  const dataEnvelopeVersionNumber = readBackupNumericVersion(dataEnvelopeVersion);
  const exportedAtLabel = formatBackupTimestampLabel(payload?.exportedAt);
  const diffs = buildBackupRestoreDiffs(payload, currentPayload);
  const lossDiffs = diffs.filter((item) => item.status === "loss");
  const warnings: string[] = [];

  if (!payload) {
    warnings.push("This file is not a BodyPilot data object.");
  }

  if (payload && backupVersion !== 1 && backupVersion !== "1") {
    warnings.push("Backup version is missing or legacy.");
  }

  if (payload && exportedAtLabel === "Missing") {
    warnings.push("No export timestamp was found.");
  }

  if (payload && exportedAtLabel === "Unreadable") {
    warnings.push("The export timestamp could not be read.");
  }

  if (
    payload &&
    dataEnvelopeVersionNumber !== null &&
    dataEnvelopeVersionNumber > BODY_PILOT_DATA_ENVELOPE_VERSION
  ) {
    warnings.push("This backup was created by a newer BodyPilot data envelope.");
  }

  if (payload && knownKeyCount < 6) {
    warnings.push("Only a small number of BodyPilot sections were found.");
  }

  if (payload && !isValidBodyPilotBackupPayload(payload)) {
    warnings.push("The file does not contain enough recognizable BodyPilot data to restore.");
  }

  if (lossDiffs.length > 0) {
    warnings.push(
      `Restore will reduce saved records in ${lossDiffs
        .slice(0, 3)
        .map((item) => item.label.toLowerCase())
        .join(", ")}${lossDiffs.length > 3 ? ", and more" : ""}.`
    );
  }

  const blocked = !payload || !isValidBodyPilotBackupPayload(payload);
  const status: BackupRestorePreview["status"] = blocked ? "blocked" : warnings.length > 0 ? "warning" : "ready";

  const counts = payload
    ? [
        {
          label: "Memberships",
          value: String(countBackupArrayValue(payload, "membershipRecords")),
          detail: "coach-client relationships",
        },
        {
          label: "Meals",
          value: String(countBackupArrayValue(payload, "meals")),
          detail: "current food log",
        },
        {
          label: "Templates",
          value: String(countBackupArrayValue(payload, "mealTemplates")),
          detail: "saved meals",
        },
        {
          label: "Food history",
          value: String(countBackupArrayValue(payload, "foodDayHistory")),
          detail: "daily nutrition records",
        },
        {
          label: "Tracker days",
          value: String(countBackupArrayValue(payload, "trackerDays")),
          detail: "daily adherence logs",
        },
        {
          label: "Training days",
          value: String(countBackupArrayValue(payload, "workoutSplit")),
          detail: "split sessions",
        },
        {
          label: "Check-ins",
          value: String(countBackupArrayValue(payload, "checkIns")),
          detail: "visual and review records",
        },
        {
          label: "Plan versions",
          value: String(countBackupArrayValue(payload, "publishedCoachDecisions")),
          detail: "published coach calls",
        },
        {
          label: "Messages",
          value: String(countBackupArrayValue(payload, "coachThreadMessages")),
          detail: "coach thread items",
        },
        {
          label: "Reviews",
          value: String(countBackupArrayValue(payload, "weeklySnapshots")),
          detail: "weekly snapshots",
        },
      ]
    : [];

  return {
    fileName: file.name,
    fileSizeLabel: formatBackupFileSize(file.size),
    status,
    title:
      status === "blocked"
        ? "Backup blocked"
        : status === "warning"
          ? "Review before restoring"
          : "Backup ready to restore",
    detail:
      status === "blocked"
        ? "BodyPilot will not overwrite the workspace with this file."
        : "Confirming will replace the current local workspace and reload the app.",
    exportedAtLabel,
    backupVersionLabel: formatBackupVersionLabel(backupVersion),
    dataEnvelopeVersionLabel: formatBackupVersionLabel(dataEnvelopeVersion),
    knownKeyCount,
    counts,
    diffs,
    diffSummary: summarizeBackupRestoreDiffs(diffs),
    warnings: Array.from(new Set(warnings)),
  };
};
type NutritionSidebarSection = "overview" | "targets" | "builder" | "templates";
type NutritionSurface = "log" | "add" | "insights";
type FoodEntryMode = "search" | "scan" | "custom";
type NutritionSurfaceIntent = {
  surface: NutritionSurface;
  entryMode?: FoodEntryMode;
  nonce: number;
};
type TrackerSurface = "dashboard" | "session" | "log" | "insights" | "week";
type TrackerSurfaceIntent = {
  surface: TrackerSurface;
  nonce: number;
};
type TrainingSurfaceIntent = {
  surface: "exercise-support";
  dayId?: string;
  nonce: number;
};
type ActionReceipt = {
  id: number;
  title: string;
  detail: string;
  tone: "success" | "warning" | "error" | "info";
};
type SettingsSectionIntent = {
  section: SettingsSection;
  nonce: number;
};
const settingsSectionValues: readonly SettingsSection[] = [
  "account",
  "workspace",
  "setup",
  "notifications",
  "privacy",
  "advanced",
  "data",
];
const resolveInitialSettingsSectionIntent = (): SettingsSectionIntent => {
  if (typeof window === "undefined") return { section: "account", nonce: 0 };
  const requested = new URLSearchParams(window.location.search).get("settingsSection");
  return {
    section: settingsSectionValues.includes(requested as SettingsSection)
      ? (requested as SettingsSection)
      : "account",
    nonce: 0,
  };
};

const tabActionLabel: Record<AppTab, string> = {
  dashboard: "Open dashboard",
  "ai-coach": "Open AI Coach",
  nutrition: "Open food",
  compounds: "Open compounds",
  split: "Open split",
  tracker: "Open today",
  library: "Open exercise browser",
  schedule: "Open full calendar",
  coach: "Open coach desk",
};

type WorkflowPriorityItem = {
  label: string;
  title: string;
  detail: string;
  tab: AppTab;
  tone?: AccentTone;
  queueType?: "food" | "training" | "recovery" | "check-in" | "publish" | "data" | "support" | "plan";
};

type TodayCompletionItem = {
  label: string;
  title: string;
  detail: string;
  cta: string;
  tab: AppTab;
  tone?: AccentTone;
  done: boolean;
};

type MobileFastAction = {
  key: string;
  label: string;
  helper?: string;
  Icon: React.ComponentType<any>;
  variant: "default" | "outline" | "ghost";
  active?: boolean;
  onClick: () => void;
};

type ScheduleMacroProgressionWeek = {
  id: string;
  label: string;
  focus: string;
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
  projectedCondition: number;
  projectedRecovery: number;
};

type ChangeDigestItem = {
  id: string;
  date: string;
  category: ChangeLogEntry["category"];
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

type MomentumSignalItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  score: number;
  tone?: AccentTone;
  actionLabel: string;
  tab: AppTab;
};

type WorkspaceNavItem = {
  value: AppTab;
  label: string;
  helper: string;
  stat: string;
  Icon: React.ComponentType<any>;
};

const workflowKey = (item: WorkflowPriorityItem) =>
  `${item.tab}:${item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;

const dedupeWorkflowPriorityItems = (items: WorkflowPriorityItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = workflowKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const coachShellTriageToneClasses = (tone: AccentTone) => {
  if (tone === "rose") {
    return {
      panel: "border-rose-200 bg-rose-50/85 dark:border-rose-500/25 dark:bg-rose-950/20",
      badge: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-950/30 dark:text-rose-100",
    };
  }

  if (tone === "amber") {
    return {
      panel: "border-amber-200 bg-amber-50/85 dark:border-amber-500/25 dark:bg-amber-950/20",
      badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (tone === "emerald") {
    return {
      panel: "border-emerald-200 bg-emerald-50/85 dark:border-emerald-500/25 dark:bg-emerald-950/20",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100",
    };
  }

  if (tone === "cyan") {
    return {
      panel: "border-cyan-200 bg-cyan-50/85 dark:border-cyan-500/25 dark:bg-cyan-950/20",
      badge: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/25 dark:bg-cyan-950/30 dark:text-cyan-100",
    };
  }

  if (tone === "sky") {
    return {
      panel: "border-sky-200 bg-sky-50/85 dark:border-sky-500/25 dark:bg-sky-950/20",
      badge: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/25 dark:bg-sky-950/30 dark:text-sky-100",
    };
  }

  return {
    panel: "border-slate-200 bg-slate-50/85 dark:border-white/10 dark:bg-white/[0.04]",
    badge: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200",
  };
};

const inferPlanChangeTone = (line: string): AccentTone => {
  const normalized = line.toLowerCase();

  if (/food|nutrition|macro|calorie|protein|carb|fat|meal|water|salt/.test(normalized)) {
    return "emerald";
  }

  if (/training|lift|split|sets|volume|session|cardio|steps|conditioning/.test(normalized)) {
    return "cyan";
  }

  if (/recovery|sleep|readiness|check-in|review|stress/.test(normalized)) {
    return "amber";
  }

  if (/risk|missed|low|blocked|caution/.test(normalized)) {
    return "rose";
  }

  return "sky";
};

const inferPlanChangeLabel = (line: string) => {
  const normalized = line.toLowerCase();

  if (/food|nutrition|macro|calorie|protein|carb|fat|meal|water|salt/.test(normalized)) return "Food";
  if (/training|lift|split|sets|volume|session/.test(normalized)) return "Training";
  if (/cardio|steps|conditioning/.test(normalized)) return "Conditioning";
  if (/recovery|sleep|readiness|stress/.test(normalized)) return "Recovery";
  if (/check-in|review/.test(normalized)) return "Review";
  return "Plan";
};

const countLeadingWins = (items: boolean[]) => {
  let count = 0;

  for (const item of items) {
    if (!item) break;
    count += 1;
  }

  return count;
};

const momentumTone = (score: number): AccentTone =>
  score >= 80 ? "emerald" : score >= 55 ? "sky" : score >= 35 ? "amber" : "rose";

const foodIdentityKey = (food: Pick<FoodCatalogItem, "barcode" | "label" | "brand">) =>
  [
    food.barcode?.trim().toLowerCase() ?? "",
    food.label.trim().toLowerCase(),
    food.brand?.trim().toLowerCase() ?? "",
  ].join("::");

const foodSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stableCustomFoodId = (food: Pick<FoodCatalogItem, "barcode" | "label" | "brand">) =>
  food.barcode?.trim()
    ? `custom-barcode-${foodSlug(food.barcode)}`
    : `custom-${foodSlug([food.label, food.brand ?? ""].filter(Boolean).join("-"))}`;

const normalizeFoodNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const WorkspaceNavTrigger = (props: WorkspaceNavItem & { triggerActiveClass: string }) => {
  const { value, label, helper, stat, Icon, triggerActiveClass } = props;

  return (
    <TabsTrigger
      value={value}
      className={[
        "workspace-nav-trigger group min-h-[64px] min-w-[178px] px-3.5 py-3 text-left text-slate-700 transition-all duration-200 hover:-translate-y-[1px] dark:text-slate-100",
        triggerActiveClass,
      ].join(" ")}
    >
      <div className="flex w-full items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-current shadow-sm transition-all group-data-[state=active]:border-white/20 group-data-[state=active]:bg-white/15">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate text-sm font-semibold tracking-normal text-current">{label}</div>
            <div className="inline-flex max-w-[9rem] rounded-full border border-slate-200/80 bg-white/88 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-600 transition-all group-data-[state=active]:border-white/15 group-data-[state=active]:bg-white/15 group-data-[state=active]:text-white/88">
              <span className="truncate">{stat}</span>
            </div>
          </div>
          <div className="mt-1 truncate text-[11px] leading-5 text-current opacity-75">{helper}</div>
        </div>
      </div>
    </TabsTrigger>
  );
};

type ViewMeta = {
  title: string;
  subtitle: string;
  accentClass: string;
  Icon: React.ComponentType<any>;
  chips: string[];
  actions: { label: string; tab: AppTab; variant?: "default" | "outline"; onClick?: () => void }[];
};
type ScheduleEventLocal = ScheduleEvent & { day: string };
type WeeklySnapshotLocal = WeeklySnapshot & { direction?: MonthDirection; summary?: string };
type EstimatedMaxes = typeof defaultEstimatedMaxes;
type CalendarSessionOverrides = Record<string, string>;
type ScheduleViewMode = "week" | "month";

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const truncateSummary = (value: string, max = 150) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;

const countLoggedLiftSets = (lift: TrackerLift) => {
  const rows = (lift.actualReps ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const parsedActualSets = Number(lift.actualSets);
  const actualSetCount = Number.isFinite(parsedActualSets) ? parsedActualSets : rows.length;
  return clamp(actualSetCount, 0, lift.plannedSets);
};

const deriveTrackerDayCompletion = (day: TrackerDay) => {
  const basicsLogged = [day.bodyWeight, day.steps, day.energy].filter((value) => value?.trim()).length;
  const notesLogged = day.notes.trim().length > 0 ? 1 : 0;
  const conditioningLogged =
    Boolean(day.conditioningModalityId) ||
    Boolean(day.conditioningMinutes?.trim()) ||
    Boolean(day.posingRounds?.trim())
      ? 1
      : 0;

  if (day.lifts.length === 0) {
    return Math.round(
      clamp((basicsLogged / 3) * 60 + conditioningLogged * 20 + notesLogged * 20, 0, 100)
    );
  }

  const liftProgress =
    day.lifts.reduce((sum, lift) => {
      if (lift.completed) return sum + 1;
      return sum + countLoggedLiftSets(lift) / Math.max(lift.plannedSets, 1);
    }, 0) / Math.max(day.lifts.length, 1);

  return Math.round(
    clamp(liftProgress * 78 + (basicsLogged / 3) * 14 + notesLogged * 8, 0, 100)
  );
};

const daysBetween = (from: Date, to: Date) => {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / 86400000);
};

const getMondayIndex = (date: Date) => (date.getDay() + 6) % 7;

const getScheduleDayFromDate = (value: string) => scheduleDayOrder[getMondayIndex(parseIsoDate(value))] ?? "Mon";

const roundToNearestFive = (value: number) => Math.round(value / 5) * 5;

const legacyDefaultMealPlan = [
  { name: "Meal 1", protein: 50, carbs: 30, fats: 15, timing: "09:00", type: "standard" },
  { name: "Meal 2", protein: 50, carbs: 30, fats: 15, timing: "12:30", type: "standard" },
  { name: "Pre", protein: 40, carbs: 45, fats: 10, timing: "16:00", type: "pre" },
  { name: "Post", protein: 45, carbs: 60, fats: 5, timing: "19:15", type: "post" },
] as const;

const seededMealPlanVariants = [
  legacyDefaultMealPlan,
  [
    { name: "Meal 1", protein: 55, carbs: 45, fats: 15, timing: "09:00", type: "standard" },
    { name: "Meal 2", protein: 55, carbs: 45, fats: 15, timing: "12:30", type: "standard" },
    { name: "Pre", protein: 55, carbs: 60, fats: 10, timing: "16:00", type: "pre" },
    { name: "Post", protein: 65, carbs: 70, fats: 10, timing: "19:15", type: "post" },
  ] as const,
] as const;

const legacyTemplateNames = ["Breakfast Bowl", "Pre Session", "Intra", "Post Session", "Off Day Meal"] as const;
const legacyTrackerTaskSignatures = [
  { label: "Hit steps", target: "12000" },
  { label: "Macros on plan", target: "100%" },
  { label: "Hydration", target: "4.5L" },
] as const;
const legacyScheduleSignatures = [
  { id: "se1", day: "Mon", time: "09:00", title: "Meal 1", category: "Meal" },
  { id: "se2", day: "Mon", time: "12:30", title: "Meal 2", category: "Meal" },
  { id: "se3", day: "Mon", time: "16:00", title: "Pre-workout", category: "Meal" },
  { id: "se4", day: "Mon", time: "17:30", title: "Push session", category: "Training" },
  { id: "se5", day: "Mon", time: "19:15", title: "Post-workout", category: "Meal" },
  { id: "se6", day: "Mon", time: "22:30", title: "Sleep wind-down", category: "Recovery" },
] as const;
const legacyTrackerDaySignatures = [
  { id: "td1", date: "2026-04-15", title: "Push", bodyWeight: "192.8", steps: "11920", energy: "3" },
  { id: "td2", date: "2026-04-16", title: "Pull", bodyWeight: "192.4", steps: "12100", energy: "3" },
  { id: "td3", date: "2026-04-17", title: "Lower", bodyWeight: "191.9", steps: "12450", energy: "3" },
  { id: "td4", date: "2026-04-18", title: "Rest / recovery", bodyWeight: "191.8", steps: "10120", energy: "4" },
  { id: "td5", date: "2026-04-19", title: "Push", bodyWeight: "191.7", steps: "11340", energy: "3" },
  { id: "td6", date: "2026-04-20", title: "Pull", bodyWeight: "191.6", steps: "10850", energy: "3" },
  { id: "td7", date: "2026-04-21", title: "Pull", bodyWeight: "191.5", steps: "12450", energy: "3" },
] as const;
const seededCheckInDates = ["2026-03-28", "2026-04-04", "2026-04-11"] as const;
const seededWeeklySnapshotDates = ["2026-04-01", "2026-04-08"] as const;

const matchesSeededMeals = (meals: Meal[]) =>
  seededMealPlanVariants.some((plan) =>
    meals.length === plan.length &&
    plan.every((meal, index) => {
      const loaded = meals[index];
      return (
        loaded?.name === meal.name &&
        loaded?.protein === meal.protein &&
        loaded?.carbs === meal.carbs &&
        loaded?.fats === meal.fats &&
        loaded?.timing === meal.timing &&
        loaded?.type === meal.type
      );
    })
  );

const matchesLegacyMealTemplates = (mealTemplates: MealTemplate[]) =>
  mealTemplates.length === legacyTemplateNames.length &&
  legacyTemplateNames.every((templateName, index) => mealTemplates[index]?.name === templateName);

const matchesLegacyTrackerTasks = (tasks: TrackerTask[]) =>
  tasks.length === legacyTrackerTaskSignatures.length &&
  legacyTrackerTaskSignatures.every((task, index) => {
    const loaded = tasks[index];
    return loaded?.label === task.label && loaded?.target === task.target;
  });

const matchesLegacySchedule = (schedule: ScheduleEventLocal[]) =>
  schedule.length === legacyScheduleSignatures.length &&
  schedule.every((event, index) => {
    const legacy = legacyScheduleSignatures[index];
    return (
      legacy &&
      event.id === legacy.id &&
      event.day === legacy.day &&
      event.time === legacy.time &&
      event.title === legacy.title &&
      event.category === legacy.category
    );
  });

const matchesLegacyTrackerDays = (trackerDays: TrackerDay[]) =>
  trackerDays.length === legacyTrackerDaySignatures.length &&
  legacyTrackerDaySignatures.every((signature, index) => {
    const loaded = trackerDays[index];
    return (
      loaded?.id === signature.id &&
      loaded?.date === signature.date &&
      loaded?.title === signature.title &&
      loaded?.bodyWeight === signature.bodyWeight &&
      loaded?.steps === signature.steps &&
      loaded?.energy === signature.energy
    );
  });

const matchesSeededCheckIns = (checkIns: CheckIn[]) =>
  checkIns.length === seededCheckInDates.length &&
  seededCheckInDates.every((date, index) => {
    const loaded = checkIns[index];
    return loaded?.id === `ci${index + 1}` && loaded?.date === date;
  });

const matchesSeededChangeLog = (changeLog: ChangeLogEntry[]) =>
  changeLog.length === 3 &&
  changeLog.every((entry, index) => entry.id === `cl${index + 1}`);

const matchesSeededWeeklySnapshots = (snapshots: WeeklySnapshot[]) =>
  snapshots.length === seededWeeklySnapshotDates.length &&
  seededWeeklySnapshotDates.every((date, index) => {
    const loaded = snapshots[index];
    return loaded?.id === `ws${index + 1}` && loaded?.date === date;
  });

const normalizeLoadedMeals = (meals: Meal[]) =>
  (matchesSeededMeals(meals) ? initialMeals : meals).map((meal) =>
    hydrateMealFromFoodEntries(meal)
  );

const normalizeLoadedCheckIns = (checkIns: CheckIn[]) =>
  matchesSeededCheckIns(checkIns) ? initialCheckIns : checkIns;

const normalizeLoadedChangeLog = (changeLog: ChangeLogEntry[]) =>
  matchesSeededChangeLog(changeLog) ? initialChangeLog : changeLog;

const normalizeLoadedWeeklySnapshots = (snapshots: WeeklySnapshot[]) =>
  matchesSeededWeeklySnapshots(snapshots) ? initialWeeklySnapshots : snapshots;

const normalizeLoadedMealTemplates = (mealTemplates: MealTemplate[]) =>
  (matchesLegacyMealTemplates(mealTemplates) ? initialMealTemplates : mealTemplates).map((meal) =>
    hydrateMealFromFoodEntries(meal)
  );

const validFoodGroups = new Set<FoodCatalogItem["group"]>([
  "common",
  "produce",
  "protein",
  "carb",
  "fat",
  "mixed",
  "hydration",
  "supplement",
  "branded",
]);

const validFoodSources = new Set<FoodCatalogItem["source"]>(["community", "custom"]);

const normalizeLoadedCustomFoods = (foods: unknown): FoodCatalogItem[] => {
  if (!Array.isArray(foods)) return [];

  const normalized: FoodCatalogItem[] = [];
  const seen = new Set<string>();

  foods.forEach((rawFood) => {
    if (!rawFood || typeof rawFood !== "object") return;
    const food = rawFood as Partial<FoodCatalogItem>;
    const label = String(food.label ?? "").trim();
    if (!label) return;

    const brand = typeof food.brand === "string" && food.brand.trim() ? food.brand.trim() : undefined;
    const barcode = typeof food.barcode === "string" && food.barcode.trim() ? food.barcode.trim() : undefined;
    const source = food.source && validFoodSources.has(food.source) ? food.source : "custom";
    const group = food.group && validFoodGroups.has(food.group) ? food.group : "common";
    const normalizedFood: FoodCatalogItem = {
      id: typeof food.id === "string" && food.id.trim()
        ? food.id.trim()
        : stableCustomFoodId({ label, brand, barcode }),
      label,
      brand,
      barcode,
      source,
      group,
      verified: Boolean(food.verified ?? true),
      servingLabel: typeof food.servingLabel === "string" && food.servingLabel.trim()
        ? food.servingLabel.trim()
        : "1 serving",
      servingGrams: food.servingGrams == null ? undefined : normalizeFoodNumber(food.servingGrams, 0) || undefined,
      servingOptions: Array.isArray(food.servingOptions)
        ? food.servingOptions
            .filter((option) => option && typeof option.id === "string" && typeof option.label === "string")
            .map((option) => ({
              id: option.id,
              label: option.label,
              multiplier: normalizeFoodNumber(option.multiplier, 1),
              grams: option.grams == null ? undefined : normalizeFoodNumber(option.grams, 0) || undefined,
            }))
        : undefined,
      imageUrl: typeof food.imageUrl === "string" ? food.imageUrl : undefined,
      searchTokens: Array.isArray(food.searchTokens)
        ? food.searchTokens.filter((token): token is string => typeof token === "string")
        : undefined,
      nutrients: {
        calories: normalizeFoodNumber(food.nutrients?.calories, 0),
        protein: normalizeFoodNumber(food.nutrients?.protein, 0),
        carbs: normalizeFoodNumber(food.nutrients?.carbs, 0),
        fat: normalizeFoodNumber(food.nutrients?.fat, 0),
        fiber: normalizeFoodNumber(food.nutrients?.fiber, 0),
        sugar: normalizeFoodNumber(food.nutrients?.sugar, 0),
        sodiumMg: normalizeFoodNumber(food.nutrients?.sodiumMg, 0),
        potassiumMg: normalizeFoodNumber(food.nutrients?.potassiumMg, 0),
        calciumMg: normalizeFoodNumber(food.nutrients?.calciumMg, 0),
        ironMg: normalizeFoodNumber(food.nutrients?.ironMg, 0),
        magnesiumMg: normalizeFoodNumber(food.nutrients?.magnesiumMg, 0),
        zincMg: normalizeFoodNumber(food.nutrients?.zincMg, 0),
        vitaminCMg: normalizeFoodNumber(food.nutrients?.vitaminCMg, 0),
        vitaminDMcg: normalizeFoodNumber(food.nutrients?.vitaminDMcg, 0),
        vitaminAMcg: normalizeFoodNumber(food.nutrients?.vitaminAMcg, 0),
        vitaminEMg: normalizeFoodNumber(food.nutrients?.vitaminEMg, 0),
        vitaminKMcg: normalizeFoodNumber(food.nutrients?.vitaminKMcg, 0),
        folateMcg: normalizeFoodNumber(food.nutrients?.folateMcg, 0),
        vitaminB12Mcg: normalizeFoodNumber(food.nutrients?.vitaminB12Mcg, 0),
        cholesterolMg: normalizeFoodNumber(food.nutrients?.cholesterolMg, 0),
        saturatedFat: normalizeFoodNumber(food.nutrients?.saturatedFat, 0),
        fluidMl: normalizeFoodNumber(food.nutrients?.fluidMl, 0),
      },
      note: typeof food.note === "string" ? food.note : undefined,
      recipeItems: Array.isArray(food.recipeItems)
        ? food.recipeItems
            .filter((item) => item && typeof item.foodId === "string" && typeof item.label === "string")
            .map((item) => ({
              foodId: item.foodId,
              label: item.label,
              brand: typeof item.brand === "string" ? item.brand : undefined,
              source: item.source ?? "custom",
              group: item.group ?? "common",
              servings: normalizeFoodNumber(item.servings, 1),
              servingLabel: item.servingLabel ?? "1 serving",
              servingGrams: item.servingGrams,
            }))
        : undefined,
    };
    const key = foodIdentityKey(normalizedFood);
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(normalizedFood);
  });

  return normalized;
};

const hasLoggedFoodEntries = (meals: Meal[]) =>
  meals.some((meal) => (meal.foodEntries?.length ?? 0) > 0);

const cloneMealsForFoodDay = (meals: Meal[], stamp = Date.now()) =>
  meals.map((meal, mealIndex) =>
    hydrateMealFromFoodEntries({
      ...meal,
      id: `${meal.id}-food-day-${stamp}-${mealIndex}`,
      foodEntries: cloneMealFoodEntries(meal.foodEntries).map((entry, entryIndex) => ({
        ...entry,
        id: `${entry.foodId}-food-day-${stamp}-${mealIndex}-${entryIndex}`,
      })),
    })
  );

const buildFoodDaySnapshot = ({
  date,
  meals,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFats,
  savedAt = new Date().toISOString(),
}: {
  date: string;
  meals: Meal[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  savedAt?: string;
}): FoodDaySnapshot | null => {
  if (!hasLoggedFoodEntries(meals)) return null;

  const foodMeals = cloneMealsForFoodDay(meals, Date.parse(savedAt) || Date.now());
  const totals = summarizeDayFoodNutrients(foodMeals);
  const foodEntries = foodMeals.reduce((sum, meal) => sum + (meal.foodEntries?.length ?? 0), 0);
  const loggedMeals = foodMeals.filter((meal) => (meal.foodEntries?.length ?? 0) > 0).length;

  return {
    id: `food-day-${date}`,
    date,
    savedAt,
    meals: foodMeals,
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fats: Math.round(totals.fat),
    foodEntries,
    loggedMeals,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
  };
};

const upsertFoodDaySnapshot = (history: FoodDaySnapshot[], snapshot: FoodDaySnapshot) =>
  [snapshot, ...history.filter((item) => item.date !== snapshot.date)]
    .sort((left, right) => right.date.localeCompare(left.date) || right.savedAt.localeCompare(left.savedAt))
    .slice(0, 45);

const normalizeLoadedFoodDayHistory = (history: unknown): FoodDaySnapshot[] => {
  if (!Array.isArray(history)) return [];

  const normalized = history
    .map((rawItem): FoodDaySnapshot | null => {
      if (!rawItem || typeof rawItem !== "object") return null;
      const item = rawItem as Partial<FoodDaySnapshot>;
      const date = typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
        ? item.date
        : "";
      const meals = Array.isArray(item.meals) ? normalizeLoadedMeals(item.meals as Meal[]) : [];
      const snapshot = buildFoodDaySnapshot({
        date,
        meals,
        targetCalories: normalizeFoodNumber(item.targetCalories, 0),
        targetProtein: normalizeFoodNumber(item.targetProtein, 0),
        targetCarbs: normalizeFoodNumber(item.targetCarbs, 0),
        targetFats: normalizeFoodNumber(item.targetFats, 0),
        savedAt: typeof item.savedAt === "string" ? item.savedAt : `${date}T12:00:00.000Z`,
      });

      if (!date || !snapshot) return null;

      return {
        ...snapshot,
        id: typeof item.id === "string" && item.id.trim() ? item.id : snapshot.id,
        note: typeof item.note === "string" ? item.note : undefined,
      };
    })
    .filter((item): item is FoodDaySnapshot => Boolean(item));

  return normalized.reduce<FoodDaySnapshot[]>(upsertFoodDaySnapshot, []);
};

const normalizeLoadedSupplements = (supplements: SupplementProtocol[]) => {
  const seedBySupplementId = new Map(initialSupplements.map((item) => [item.supplementId, item]));
  const loadedBySupplementId = new Map(supplements.map((item) => [item.supplementId, item]));

  const normalized = initialSupplements.map((seed) => {
    const loaded = loadedBySupplementId.get(seed.supplementId);
    return loaded ? { ...seed, ...loaded, supplementId: seed.supplementId } : seed;
  });

  const extras = supplements.filter((item) => !seedBySupplementId.has(item.supplementId));
  return [...normalized, ...extras];
};

const getSeedMealTemplateByType = (mode: NonNullable<Meal["type"]>, intraCarbs: number) => {
  const template = initialMealTemplates.find((item) => item.type === mode);
  if (!template) return null;
  return mode === "intra"
    ? {
        ...template,
        carbs: Math.max(intraCarbs, template.carbs),
      }
    : template;
};

const pruneLegacyCheckInTasks = (tasks: TrackerTask[]) =>
  tasks.filter((task) => !(task.category === "Check-in" && task.label === "Morning check-in"));

const normalizeLoadedTrackerTasks = (tasks: TrackerTask[]) =>
  pruneLegacyCheckInTasks(matchesLegacyTrackerTasks(tasks) ? [] : tasks);

const getDefaultSplitDayForDate = (value: string, workoutSplit: WorkoutDay[]) => {
  const weekdayIndex = scheduleDayOrder.indexOf(getScheduleDayFromDate(value));
  return workoutSplit[weekdayIndex] ?? workoutSplit.find((day) => day.focus.toLowerCase() === "rest") ?? null;
};

const hasTrackerLiftProgress = (day: TrackerDay) =>
  day.lifts.some(
    (lift) =>
      lift.completed ||
      Boolean(lift.actualSets?.trim()) ||
      Boolean(lift.actualReps?.trim()) ||
      Boolean(lift.weight?.trim()) ||
      Boolean(lift.rpe?.trim()) ||
      Boolean(lift.notes?.trim())
  );

const buildTrackerLiftsFromWorkoutDay = (
  trackerDayId: string,
  scheduledDay: WorkoutDay | null,
  library: ExerciseLibraryItem[],
  existingLifts: TrackerLift[] = []
) => {
  if (!scheduledDay) return [] as TrackerLift[];

  return scheduledDay.exercises.map((exercise, index) => {
    const lib = library.find((item) => item.id === exercise.exerciseId);
    const previousLift = existingLifts[index];
    return {
      id: previousLift?.id ?? `${trackerDayId}-${exercise.exerciseId}-${index}`,
      name: lib?.name ?? "Exercise",
      plannedSets: exercise.sets,
      plannedReps: exercise.repRange,
      rir: String(exercise.rir),
      completed: previousLift?.completed ?? false,
      actualSets: previousLift?.actualSets ?? "",
      actualReps: previousLift?.actualReps ?? "",
      weight: previousLift?.weight ?? "",
      rpe: previousLift?.rpe ?? "",
      notes: previousLift?.notes ?? "",
    };
  });
};

const trackerLiftsMatch = (left: TrackerLift[], right: TrackerLift[]) =>
  left.length === right.length &&
  left.every((lift, index) => {
    const other = right[index];
    return (
      other &&
      lift.name === other.name &&
      lift.plannedSets === other.plannedSets &&
      lift.plannedReps === other.plannedReps &&
      lift.rir === other.rir
    );
  });

const withDerivedCompletion = (day: TrackerDay) => {
  const completion = deriveTrackerDayCompletion(day);
  return completion === day.completion ? day : { ...day, completion };
};

const buildBlankTrackerDay = (value: string, workoutSplit: WorkoutDay[], library: ExerciseLibraryItem[]) => {
  const scheduledDay = getDefaultSplitDayForDate(value, workoutSplit);
  return withDerivedCompletion({
    id: `tracker-${value}`,
    date: value,
    title: scheduledDay?.focus ?? "Rest",
    completion: 0,
    bodyWeight: "",
    steps: "",
    energy: "",
    conditioningModalityId: "",
    conditioningMinutes: "",
    conditioningEffort: "",
    posingRounds: "",
    notes: "",
    lifts: buildTrackerLiftsFromWorkoutDay(`tracker-${value}`, scheduledDay, library),
  });
};

const buildTrackerDaysWindow = (anchorDate: Date, workoutSplit: WorkoutDay[], library: ExerciseLibraryItem[]) => {
  const monday = addDays(anchorDate, -getMondayIndex(anchorDate));
  return Array.from({ length: 7 }, (_, index) =>
    buildBlankTrackerDay(toIsoDate(addDays(monday, index)), workoutSplit, library)
  );
};

const buildSelectedTrackerDayId = (trackerDays: TrackerDay[], value: string) =>
  trackerDays.find((day) => day.date === value)?.id ?? trackerDays[0]?.id ?? "";

const normalizeLoadedSchedule = (schedule: ScheduleEventLocal[]) =>
  matchesLegacySchedule(schedule)
    ? []
    : schedule.map((event) => ({
        ...event,
        day: event.day ?? "Mon",
      }));

const normalizeLoadedTrackerDays = (
  trackerDays: TrackerDay[],
  workoutSplit: WorkoutDay[],
  library: ExerciseLibraryItem[],
  anchorIso: string
) => {
  if (trackerDays.length === 0 || matchesLegacyTrackerDays(trackerDays)) {
    return buildTrackerDaysWindow(parseIsoDate(anchorIso), workoutSplit, library);
  }

  return trackerDays.map((day) => withDerivedCompletion(day));
};

const formatMonthLabel = (value: string) =>
  parseIsoDate(value).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const formatFriendlyDate = (value: string) =>
  parseIsoDate(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

const getNextCalendarDateForDay = (anchorIso: string, targetDay: string) => {
  const anchor = parseIsoDate(anchorIso);
  for (let offset = 0; offset < 21; offset += 1) {
    const candidate = addDays(anchor, offset);
    const candidateIso = toIsoDate(candidate);
    if (getScheduleDayFromDate(candidateIso) === targetDay) {
      return candidateIso;
    }
  }
  return anchorIso;
};

const rowAmount = (amount: number, unit?: string, multiplier = 1) =>
  Number(amount || 0) * (unit === "mg/day" ? multiplier : 1);

const isDailyUnit = (unit?: string) => /\/day\b|per day/i.test(unit ?? "");
const isTrainingUnit = (unit?: string) => /training day/i.test(unit ?? "");

const getCompoundFallbackWeeklyTotal = (compound: Compound, trainingDaysPerWeek = 4) => {
  const dose = Number(compound.dose || 0);
  if (isDailyUnit(compound.unit)) return dose * 7;
  if (isTrainingUnit(compound.unit)) return dose * trainingDaysPerWeek;
  return dose;
};

const getCompoundWeeklyTotal = (compound: Compound, trainingDaysPerWeek = 4) => {
  const rows = compound.schedule ?? [];
  if (rows.length === 0) return getCompoundFallbackWeeklyTotal(compound, trainingDaysPerWeek);

  const scheduled = rows.reduce((sum, row) => {
    if (row.day === "Daily") {
      return sum + row.amount * 7;
    }
    if (row.day === "Training") {
      return sum + row.amount * trainingDaysPerWeek;
    }
    return sum + row.amount;
  }, 0);

  return Number(scheduled || 0);
};

const compoundDoseResponse = (dose: number, refDose: number, cap = 1.85, softness = 1.1) => {
  if (dose <= 0) return 0;
  if (refDose <= 0) return 1;

  const ratio = dose / refDose;
  if (ratio <= 1) return ratio;

  const extra = ratio - 1;
  return Math.min(cap, 1 + (cap - 1) * (1 - Math.exp(-extra / softness)));
};

const getCompoundEffectScale = (compound: Compound, trainingDaysPerWeek = 4) => {
  const weeklyTotal = getCompoundWeeklyTotal(compound, trainingDaysPerWeek);
  const referenceDose = getCompoundFallbackWeeklyTotal(compound, trainingDaysPerWeek);
  const responseCap = compound.category === "Orals" ? 1.55 : compound.category === "Performance" ? 1.9 : 1.75;
  const softness = compound.category === "Performance" ? 1.0 : 1.15;

  return compoundDoseResponse(weeklyTotal, referenceDose, responseCap, softness);
};

const getCompoundDoseForWeekday = (compound: Compound, weekdayIndex: number, workoutSplit: WorkoutDay[]) => {
  const rows = compound.schedule ?? [];
  if (rows.length === 0) {
    return getCompoundWeeklyTotal(
      compound,
      workoutSplit.filter((day) => day.focus.toLowerCase() !== "rest").length
    ) / 7;
  }

  return rows.reduce((sum, row) => {
    if (row.day === "Daily") return sum + row.amount;
    if (row.day === "Training") {
      const splitDay = workoutSplit[weekdayIndex % Math.max(workoutSplit.length, 1)];
      return sum + (splitDay && splitDay.focus.toLowerCase() !== "rest" ? row.amount : 0);
    }
    return sum + (row.day === scheduleDayOrder[weekdayIndex] ? row.amount : 0);
  }, 0);
};

const simulateCompoundExposure = (compound: Compound, workoutSplit: WorkoutDay[], totalDays: number) => {
  const halfLife = Math.max(0.5, Number(compound.halfLifeDays ?? 0) || 5);
  const decayFactor = Math.exp(-Math.LN2 / halfLife);
  let level = 0;

  return Array.from({ length: totalDays }, (_, dayIndex) => {
    const weekdayIndex = dayIndex % 7;
    level = level * decayFactor + getCompoundDoseForWeekday(compound, weekdayIndex, workoutSplit);
    return Number(level.toFixed(2));
  });
};


const hasScienceFlag = (
  compounds: Compound[],
  predicate: (science: CompoundScienceProfile | undefined, compound: Compound) => boolean
) => compounds.some((compound) => compound.enabled && predicate(compound.science, compound));

function hasCompoundMatch(compounds: Compound[], pattern: RegExp) {
  return compounds.some((compound) => compound.enabled && pattern.test(compound.name));
}

const tokenizeLookupValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const tokenAliasMap: Record<string, string[]> = {
  db: ["dumbbell"],
  ez: ["bar"],
  rdl: ["romanian", "deadlift"],
  pec: ["deck"],
  mag: ["pulldown"],
  iso: ["isolation"],
};

const expandLookupTokens = (tokens: string[]) => {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    (tokenAliasMap[token] ?? []).forEach((alias) => expanded.add(alias));
  });
  return Array.from(expanded);
};

const scoreExerciseCandidate = (item: ExerciseLibraryItem, candidate: string) => {
  const candidateTokens = expandLookupTokens(tokenizeLookupValue(candidate));
  const idTokens = expandLookupTokens(tokenizeLookupValue(item.id));
  const nameTokens = expandLookupTokens(tokenizeLookupValue(item.name));
  const lookupText = `${item.id} ${item.name}`.toLowerCase();

  let score = 0;
  candidateTokens.forEach((token) => {
    if (lookupText.includes(token)) score += 1.25;
    if (idTokens.includes(token)) score += 1;
    if (nameTokens.includes(token)) score += 1;
  });

  if (candidateTokens.some((token) => lookupText.includes(token))) score += 0.5;
  if (candidate.includes("pull") && /lat|row|rear|bicep|back/.test(lookupText)) score += 0.75;
  if (candidate.includes("press") && /chest|press|delt|tricep/.test(lookupText)) score += 0.75;
  if (candidate.includes("curl") && /curl|bicep|ham/.test(lookupText)) score += 0.75;
  if (candidate.includes("squat") && /squat|quad|leg/.test(lookupText)) score += 0.75;

  return score;
};

const modeledHalfLifeDefaults = [
  { pattern: /testosterone\s+cypionate|test-c/i, halfLifeDays: 8 },
  { pattern: /(masteron|drostanolone)\s+enanthate|mast-e/i, halfLifeDays: 7.5 },
  { pattern: /trenbolone\s+enanthate|tren-e/i, halfLifeDays: 10.5 },
] as const;

const getModeledHalfLifeDefault = (compound: Compound) => {
  const lookup = `${compound.id} ${compound.name}`;
  return modeledHalfLifeDefaults.find((item) => item.pattern.test(lookup))?.halfLifeDays;
};

function hydrateCompoundScience(compounds: Compound[]) {
  return compounds.map((compound) => {
    const exact = compoundLibraryCatalog.find(
      (item) => item.id === compound.id || item.name === compound.name
    );
    const idParts = compound.id.split("-");
    const baseId = idParts.length > 1 ? idParts.slice(0, -1).join("-") : compound.id;
    const byBaseId = compoundLibraryCatalog.find((item) => item.id === baseId);
    const byPrefix = compoundLibraryCatalog.find((item) => compound.id.startsWith(item.id + "-"));
    const matched = exact ?? byBaseId ?? byPrefix;
    const modeledHalfLife = getModeledHalfLifeDefault(compound);
    const currentHalfLife = Number(compound.halfLifeDays ?? 0);
    const shouldMigrateHalfLife =
      modeledHalfLife != null &&
      (!Number.isFinite(currentHalfLife) || currentHalfLife <= 0 || currentHalfLife === 5);

    return {
      ...compound,
      ...(matched?.science ? { science: matched.science } : {}),
      ...(shouldMigrateHalfLife ? { halfLifeDays: modeledHalfLife } : {}),
    };
  });
}

const matchesSeededCompounds = (compounds: Compound[]) =>
  compounds.length === initialCompounds.length &&
  initialCompounds.every((seed, index) => {
    const loaded = compounds[index];
    return loaded?.id === seed.id && loaded?.name === seed.name && loaded?.dose === seed.dose;
  });

const normalizeLoadedCompounds = (compounds: Compound[]) =>
  hydrateCompoundScience(matchesSeededCompounds(compounds) ? initialCompounds : compounds);

function displayCompoundName(compound: Compound) {
  if (/drostan/i.test(compound.name) && /enanthate/i.test(compound.name)) return "Masteron Enanthate";
  if (/drostan/i.test(compound.name) && /propionate/i.test(compound.name)) return "Masteron Propionate";
  return compound.name;
}

function getCompoundMismatchFlags(
  compound: Compound,
  context: {
    hasAromatizableBase: boolean;
    hasGh: boolean;
    hasInsulin: boolean;
    hasFoodLimiter: boolean;
    estrogenValue: number;
    waterValue: number;
  }
) {
  const science = compound.science;
  if (!science) return [] as string[];

  const flags: string[] = [];

  if (science.ghIgf1SupportContext && context.estrogenValue <= 4.2) {
    flags.push("GH is active while estrogen support reads low, which can blunt the look and make GH read flatter or noisier.");
  }

  if (science.dhtLike && context.estrogenValue <= 4.2) {
    flags.push("This dry DHT-like compound is running in a low-estrogen-support environment and may be pushing the stack too hard toward flat / overly dry.");
  }

  if (science.progestogenicContext && !context.hasAromatizableBase) {
    flags.push("A 19-nor / progestogenic compound is active without a strong aromatizable base underneath it.");
  }

  if (science.waterRisk && context.waterValue >= 6.3) {
    flags.push("This compound is contributing to a stack that already reads high on water / spill pressure.");
  }

  if (science.insulinSynergy && context.hasFoodLimiter) {
    flags.push("Insulin-style fullness support is active while another compound is limiting food throughput / digestion.");
  }

  if (science.digestionLimiter && (context.hasGh || context.hasInsulin)) {
    flags.push("This compound is slowing food throughput while the stack also contains GH / insulin-style variables that benefit from better nutrient flow.");
  }

  return flags.slice(0, 3);
}

function getExerciseId(library: ExerciseLibraryItem[], candidates: string[]) {
  const found = candidates.find((id) => library.some((item) => item.id === id));
  if (found) return found;

  const fuzzyMatch = candidates
    .flatMap((candidate) =>
      library.map((item) => ({
        id: item.id,
        score: scoreExerciseCandidate(item, candidate),
      }))
    )
    .sort((a, b) => b.score - a.score)[0];

  return (fuzzyMatch?.score ?? 0) >= 2 ? fuzzyMatch.id : library[0]?.id ?? "";
}

function buildExercise(
  library: ExerciseLibraryItem[],
  candidates: string[],
  sets: number,
  repRange: string,
  rir: number,
  note = ""
) {
  return {
    exerciseId: getExerciseId(library, candidates),
    sets,
    repRange,
    rir,
    note,
  };
}

function buildSplitTemplate(template: SplitTemplateId, library: ExerciseLibraryItem[]): WorkoutDay[] {
  const makeDay = (id: string, day: string, focus: string, exercises: WorkoutDay["exercises"], intensity = 8, volume = 9, systemicLoad = 7): WorkoutDay => ({
    id,
    day,
    focus,
    intensity,
    volume,
    systemicLoad,
    exercises,
    pickerSearch: "",
    pickerCategory: "All",
    pickerMuscle: "All",
    pickerFatigue: "All",
  });

  const pushA = [
    buildExercise(library, ["chest-smith-low-incline-press", "chest-incline-press"], 4, "6-8", 2, "Primary press"),
    buildExercise(library, ["chest-flat-db-press", "chest-machine-press"], 3, "8-10", 1, "Secondary chest press"),
    buildExercise(library, ["chest-cable-fly", "chest-pec-deck"], 3, "12-15", 1, "Chest isolation"),
    buildExercise(library, ["delt-cable-lateral-raise", "delt-db-lateral-raise"], 4, "12-20", 1, "Side delts"),
    buildExercise(library, ["delt-machine-shoulder-press", "delt-smith-shoulder-press"], 3, "8-10", 2, "Shoulder press"),
    buildExercise(library, ["triceps-overhead-extension", "triceps-machine-extension"], 3, "10-15", 1, "Long-head triceps"),
    buildExercise(library, ["triceps-rope-pressdown", "triceps-pressdown"], 3, "12-15", 1, "Pressdown finisher"),
  ];

  const pullA = [
    buildExercise(library, ["back-chest-supported-row", "back-machine-row"], 4, "8-10", 2, "Main row"),
    buildExercise(library, ["lat-mag-grip-pulldown", "lat-pulldown"], 4, "8-12", 1, "Lat-biased vertical pull"),
    buildExercise(library, ["back-low-row-machine", "back-plate-loaded-row"], 3, "10-12", 1, "Second row"),
    buildExercise(library, ["lat-machine-pullover", "lat-single-arm-cable-pulldown"], 3, "10-15", 1, "Lat lengthened slot"),
    buildExercise(library, ["rear-delt-machine-rear-fly", "rear-delt-reverse-pec-deck"], 3, "15-20", 1, "Rear delts"),
    buildExercise(library, ["delt-face-pull", "rear-delt-cable-fly"], 2, "12-20", 1, "Upper-back / rear-delt support"),
    buildExercise(library, ["biceps-bayesian-curl", "biceps-machine-curl"], 3, "10-15", 1, "Lengthened curl"),
    buildExercise(library, ["biceps-hammer-curl", "biceps-ez-bar-curl"], 2, "10-12", 1, "Brachialis / forearms"),
  ];

  const legsA = [
    buildExercise(library, ["quad-hack-squat", "quad-front-squat"], 4, "6-8", 2, "Primary quad pattern"),
    buildExercise(library, ["ham-rdl", "glute-smith-hip-thrust"], 3, "6-8", 2, "Hinge"),
    buildExercise(library, ["quad-belt-squat", "quad-leg-press"], 3, "10-12", 1, "Secondary quad slot"),
    buildExercise(library, ["ham-seated-leg-curl", "ham-single-leg-lying-curl"], 3, "10-15", 1, "Ham curl"),
    buildExercise(library, ["quad-leg-extension", "quad-sissy-squat"], 3, "12-15", 1, "Quad isolation"),
    buildExercise(library, ["calf-standing-calf-raise", "calf-seated-calf-raise"], 4, "10-15", 1, "Calves"),
    buildExercise(library, ["abs-machine-crunch", "abs-ab-wheel"], 3, "10-15", 1, "Core"),
  ];

  const pushB = [
    buildExercise(library, ["chest-hammer-strength-press", "chest-machine-press"], 4, "6-10", 2, "Stable chest press"),
    buildExercise(library, ["chest-iso-lateral-incline-press", "chest-incline-press"], 3, "8-10", 1, "Upper chest"),
    buildExercise(library, ["chest-cable-press", "chest-cable-fly"], 3, "10-15", 1, "Pressing volume"),
    buildExercise(library, ["delt-db-lateral-raise", "delt-cable-lateral-raise"], 4, "12-20", 1, "Side delts"),
    buildExercise(library, ["delt-cable-y-raise", "delt-machine-shoulder-press"], 3, "12-15", 1, "Front / side delts"),
    buildExercise(library, ["triceps-close-grip-bench", "triceps-dip-machine"], 3, "8-10", 1, "Heavy triceps"),
    buildExercise(library, ["triceps-single-arm-pressdown", "triceps-rope-pressdown"], 3, "12-15", 1, "Triceps finisher"),
  ];

  const pullB = [
    buildExercise(library, ["back-plate-loaded-row", "back-chest-supported-row"], 4, "8-10", 2, "Upper-back row"),
    buildExercise(library, ["lat-single-arm-cable-pulldown", "lat-mag-grip-pulldown"], 3, "10-12", 1, "Single-arm lat pull"),
    buildExercise(library, ["back-machine-row", "back-low-row-machine"], 3, "10-12", 1, "Machine row"),
    buildExercise(library, ["lat-machine-pullover", "lat-straight-arm-pulldown"], 3, "12-15", 1, "Lat isolation"),
    buildExercise(library, ["rear-delt-reverse-pec-deck", "rear-delt-machine-rear-fly"], 3, "15-20", 1, "Rear delts"),
    buildExercise(library, ["biceps-machine-preacher-curl", "biceps-preacher-curl"], 3, "10-12", 1, "Biceps"),
    buildExercise(library, ["biceps-hammer-curl", "biceps-machine-curl"], 3, "10-15", 1, "Arm support"),
  ];

  const legsB = [
    buildExercise(library, ["quad-front-squat", "quad-high-bar-squat"], 4, "5-8", 2, "Squat pattern"),
    buildExercise(library, ["ham-seated-leg-curl", "ham-lying-leg-curl"], 3, "10-15", 1, "Warm hamstrings"),
    buildExercise(library, ["glute-smith-hip-thrust", "glute-hip-thrust"], 3, "8-10", 1, "Glute drive"),
    buildExercise(library, ["quad-leg-press", "quad-belt-squat"], 3, "10-12", 1, "Secondary quad slot"),
    buildExercise(library, ["ham-rdl", "ham-good-morning"], 3, "8-10", 2, "Posterior chain"),
    buildExercise(library, ["quad-leg-extension", "quad-heels-elevated-goblet-squat"], 2, "12-20", 1, "Quad finisher"),
    buildExercise(library, ["calf-seated-calf-raise", "calf-standing-calf-raise"], 4, "10-15", 1, "Calves"),
  ];

  if (template === "upperlower") {
    return [
      makeDay("d1", "Day 1", "Upper", [...pushA.slice(0, 4), ...pullA.slice(0, 4)], 8, 8, 7),
      makeDay("d2", "Day 2", "Lower", legsA, 8, 8, 7),
      makeDay("d3", "Day 3", "Upper", [...pushB.slice(0, 4), ...pullB.slice(0, 4)], 8, 8, 7),
      makeDay("d4", "Day 4", "Lower", legsB, 8, 8, 7),
    ];
  }

  if (template === "hful") {
    return [
      makeDay("d1", "Day 1", "Upper A", [...pushA.slice(0, 4), ...pullA.slice(0, 3)], 8, 7, 6),
      makeDay("d2", "Day 2", "Lower A", legsA.slice(0, 6), 8, 7, 6),
      makeDay("d3", "Day 3", "Upper B", [...pushB.slice(0, 4), ...pullB.slice(0, 3)], 8, 7, 6),
      makeDay("d4", "Day 4", "Lower B", legsB.slice(0, 6), 8, 7, 6),
      makeDay("d5", "Day 5", "Upper C", [...pushA.slice(1, 4), ...pullA.slice(3, 7)], 7, 6, 5),
    ];
  }

  if (template === "arnold") {
    return [
      makeDay("d1", "Day 1", "Chest / Back", [...pushA.slice(0, 3), ...pullA.slice(0, 3)], 8, 8, 7),
      makeDay("d2", "Day 2", "Shoulders / Arms", [pushA[3], pushB[4], pushA[5], pushB[5], pullA[6], pullB[5], pullA[7]], 8, 8, 6),
      makeDay("d3", "Day 3", "Legs", legsA, 8, 8, 7),
      makeDay("d4", "Day 4", "Chest / Back", [...pushB.slice(0, 3), ...pullB.slice(0, 3)], 8, 8, 7),
      makeDay("d5", "Day 5", "Shoulders / Arms", [pushB[3], pushA[4], pushB[5], pushA[6], pullB[4], pullA[6], pullB[6]], 8, 8, 6),
      makeDay("d6", "Day 6", "Legs", legsB, 8, 8, 7),
    ];
  }

  if (template === "bro") {
    return [
      makeDay("d1", "Day 1", "Chest", pushA.slice(0, 5), 8, 9, 7),
      makeDay("d2", "Day 2", "Back", pullA.slice(0, 5), 8, 9, 7),
      makeDay("d3", "Day 3", "Shoulders", [pushA[3], pushA[4], pushB[4], pullB[4], pushB[3]], 8, 9, 6),
      makeDay("d4", "Day 4", "Arms", [pushA[5], pushA[6], pushB[5], pullA[6], pullA[7], pullB[6]], 8, 8, 5),
      makeDay("d5", "Day 5", "Legs", legsA, 8, 9, 8),
      makeDay("d6", "Day 6", "Upper Pump", [...pushB.slice(1, 5), ...pullB.slice(1, 5)], 7, 8, 6),
    ];
  }

  return [
    makeDay("d1", "Day 1", "Push", pushA, 8, 9, 7),
    makeDay("d2", "Day 2", "Pull", pullA, 8, 9, 7),
    makeDay("d3", "Day 3", "Legs", legsA, 8, 9, 8),
    makeDay("d4", "Day 4", "Push", pushB, 8, 9, 7),
    makeDay("d5", "Day 5", "Pull", pullB, 8, 9, 7),
    makeDay("d6", "Day 6", "Legs", legsB, 8, 9, 8),
    makeDay("d7", "Day 7", "Rest", [], 2, 1, 1),
  ];
}

const normalizeLoadedWorkoutSplit = (split: WorkoutDay[], template: SplitTemplateId, library: ExerciseLibraryItem[]) => {
  if (template === "ppl6" && split.length === 6) {
    return [
      ...split,
      {
        id: "d7",
        day: "Day 7",
        focus: "Rest",
        intensity: 2,
        volume: 1,
        systemicLoad: 1,
        exercises: [],
        pickerSearch: "",
        pickerCategory: "All",
        pickerMuscle: "All",
        pickerFatigue: "All",
      },
    ];
  }

  return split.map((day) => {
    if (day.focus.toLowerCase() === "rest") {
      return { ...day, exercises: [] };
    }

    const cleanedExercises = day.exercises.filter((exercise) => {
      const libItem = library.find((item) => item.id === exercise.exerciseId);
      return libItem ? scoreExerciseAgainstFocus(libItem, day.focus) >= 25 : true;
    });

    return {
      ...day,
      exercises: cleanedExercises.length > 0 ? cleanedExercises : day.exercises,
    };
  });
};

const defaultContestDateIso = toIsoDate(addDays(new Date(), 70));
const defaultPrepModel = buildContestPrepModel({
  athleteLevel: "intermediate",
  phaseType: "contest-prep",
  goalFocus: "stage-readiness",
  conditioningPriority: "moderate",
  checkInCadence: "3x-week",
  coachCadence: "2x-week",
  weeksOut: Math.max(0, Math.ceil(daysBetween(new Date(), parseIsoDate(defaultContestDateIso)) / 7)),
  bodyWeightLb: 193,
  bodyFatPct: 9,
  targetStageWeightLb: 185,
});
const defaultSplitTemplateId = defaultPrepModel.splitTemplateId as SplitTemplateId;
const defaultWorkoutSplit = buildSplitTemplate(defaultSplitTemplateId, exerciseLibraryData);
const defaultTrackerDays = buildTrackerDaysWindow(new Date(), defaultWorkoutSplit, exerciseLibraryData);
const defaultSelectedTrackerDayId = buildSelectedTrackerDayId(defaultTrackerDays, toIsoDate(new Date()));

const splitPriorityMuscleOptions = [
  "Chest",
  "Upper Chest",
  "Lats",
  "Upper Back",
  "Rear Delts",
  "Front Delts",
  "Side Delts",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
] as const;

const getFocusMuscles = (focus: string) => {
  const focusLower = focus.toLowerCase();
  if (focusLower.includes("push") || focusLower.includes("chest") || focusLower.includes("shoulder")) {
    return ["Chest", "Upper Chest", "Front Delts", "Side Delts", "Triceps"];
  }
  if (focusLower.includes("pull") || focusLower.includes("back")) {
    return ["Lats", "Upper Back", "Rear Delts", "Biceps", "Brachialis", "Forearms", "External Rotators"];
  }
  if (focusLower.includes("leg") || focusLower.includes("lower")) {
    return ["Quads", "Hamstrings", "Glutes", "Calves", "Adductors", "Erectors", "Abs"];
  }
  if (focusLower.includes("upper")) {
    return [
      "Chest",
      "Upper Chest",
      "Front Delts",
      "Side Delts",
      "Triceps",
      "Lats",
      "Upper Back",
      "Rear Delts",
      "Biceps",
      "Forearms",
    ];
  }
  if (focusLower.includes("arm")) {
    return ["Biceps", "Brachialis", "Triceps", "Forearms"];
  }
  return [];
};

const scoreExerciseAgainstFocus = (item: ExerciseLibraryItem, focus: string) => {
  const focusMuscles = new Set(getFocusMuscles(focus));
  const muscleScore = (item.muscleBias ?? []).reduce((sum, bias) => {
    return sum + (focusMuscles.has(bias.muscle) ? bias.contribution : 0);
  }, 0);

  const focusLower = focus.toLowerCase();
  const categoryLower = item.category.toLowerCase();
  const categoryBonus =
    (focusLower.includes("push") && categoryLower === "push") ||
    (focusLower.includes("pull") && categoryLower === "pull") ||
    ((focusLower.includes("leg") || focusLower.includes("lower")) && /legs|posterior|calves|core/.test(categoryLower)) ||
    (focusLower.includes("arm") && categoryLower === "arms")
      ? 20
      : 0;

  return muscleScore + categoryBonus;
};

const isExerciseStrongMatchForFocus = (item: ExerciseLibraryItem, focus: string) => {
  if (!focus) return true;
  const focusMuscles = new Set(getFocusMuscles(focus));
  const directContribution = (item.muscleBias ?? []).reduce((sum, bias) => {
    return sum + (focusMuscles.has(bias.muscle) ? bias.contribution : 0);
  }, 0);
  const score = scoreExerciseAgainstFocus(item, focus);
  const focusLower = focus.toLowerCase();

  if (focusLower.includes("upper")) {
    return score >= 35;
  }

  return directContribution >= 35 || score >= 45;
};

const priorityFocusMatches = (focus: string, muscle: string) => {
  const focusLower = focus.toLowerCase();
  if (["Chest", "Upper Chest", "Front Delts", "Side Delts", "Triceps"].includes(muscle)) {
    return /push|chest|shoulder|arms|upper/.test(focusLower);
  }
  if (["Lats", "Upper Back", "Rear Delts", "Biceps"].includes(muscle)) {
    return /pull|back|arms|upper/.test(focusLower);
  }
  if (["Quads", "Hamstrings", "Glutes", "Calves", "Abs"].includes(muscle)) {
    return /leg|lower/.test(focusLower);
  }
  return focusLower !== "rest";
};

const pickPriorityExercise = (
  library: ExerciseLibraryItem[],
  muscle: string,
  excludeIds: Set<string>,
  preferredFocus?: string
) => {
  const preferred = library
    .filter((item) => !excludeIds.has(item.id))
    .map((item) => ({
      item,
      contribution: (item.muscleBias ?? []).find((bias) => bias.muscle === muscle)?.contribution ?? 0,
      focusMatch: preferredFocus ? Number(priorityFocusMatches(preferredFocus, muscle) && priorityFocusMatches(item.category, muscle)) : 0,
      score:
        ((item.muscleBias ?? []).find((bias) => bias.muscle === muscle)?.contribution ?? 0) +
        (item.stimulusToFatigue ?? 0) * 4 -
        (item.systemicFatigue ?? 0) * 1.4,
    }))
    .filter((entry) => entry.contribution > 0)
    .sort((a, b) => (b.focusMatch - a.focusMatch) || (b.score - a.score));

  return preferred[0]?.item;
};

const buildSplitFromPreferences = (
  template: SplitTemplateId,
  library: ExerciseLibraryItem[],
  preferences: {
    strengthBias: number;
    hypertrophyBias: number;
    volumeBias: number;
    recoveryBias: number;
    frequencyBias: number;
    intensityBias: number;
    priorityMuscles: string[];
  }
) => {
  const base = buildSplitTemplate(template, library);
  const strengthLean = (preferences.strengthBias - 50) / 50;
  const hypertrophyLean = (preferences.hypertrophyBias - 50) / 50;
  const volumeLean = (preferences.volumeBias - 50) / 50;
  const recoveryLean = (preferences.recoveryBias - 50) / 50;
  const frequencyLean = (preferences.frequencyBias - 50) / 50;
  const intensityLean = (preferences.intensityBias - 50) / 50;

  const next = base.map((day) => {
    if (day.focus.toLowerCase() === "rest") return day;

    const exercises = day.exercises.map((exercise) => {
      const lib = library.find((item) => item.id === exercise.exerciseId);
      const compound =
        Number(lib?.axialLoad ?? 0) >= 4 ||
        Number(lib?.systemicFatigue ?? 0) >= 5 ||
        ["Chest", "Back", "Legs", "Posterior"].includes(lib?.category ?? "");

      let sets = exercise.sets;
      if (preferences.volumeBias >= 62) sets += compound ? 1 : 1;
      if (preferences.volumeBias <= 38) sets -= compound ? 1 : 0;
      if (preferences.recoveryBias >= 65) sets -= compound ? 1 : 0;
      if (preferences.recoveryBias <= 35 && !compound) sets += 1;
      if (preferences.frequencyBias >= 65 && compound) sets -= 1;
      if (preferences.frequencyBias <= 35 && compound) sets += 1;
      if (preferences.intensityBias >= 65 && !compound) sets -= 1;
      sets = clamp(Math.round(sets), 2, 6);

      const repRange = compound
        ? preferences.strengthBias >= 65
          ? "4-6"
          : preferences.hypertrophyBias >= 65
            ? "8-12"
            : "6-8"
        : preferences.strengthBias >= 65
          ? "8-12"
          : preferences.hypertrophyBias >= 65
            ? "12-20"
            : "10-15";

      const rir = clamp(
        Math.round(
          compound
            ? exercise.rir + (preferences.strengthBias >= 65 ? 0 : preferences.hypertrophyBias >= 65 ? -1 : 0)
            : exercise.rir + (preferences.hypertrophyBias >= 65 ? -1 : 0) + (preferences.recoveryBias >= 65 ? 1 : 0)
        ),
        0,
        3
      );

      return {
        ...exercise,
        sets,
        repRange,
        rir,
      };
    });

    return {
      ...day,
      intensity: clamp(Math.round(Number(day.intensity) + strengthLean * 1.1 + intensityLean * 1.3 - recoveryLean * 0.6), 5, 10),
      volume: clamp(Math.round(Number(day.volume) + volumeLean * 1.8 + hypertrophyLean * 0.9 - recoveryLean * 1.1 - frequencyLean * 0.5), 4, 10),
      systemicLoad: clamp(Math.round(Number(day.systemicLoad) + intensityLean * 1.5 + strengthLean * 0.7 + volumeLean * 0.4 - recoveryLean * 0.8), 4, 10),
      exercises,
    };
  });

  preferences.priorityMuscles.forEach((muscle) => {
    const targetDay =
      next.find((day) => day.focus.toLowerCase() !== "rest" && priorityFocusMatches(day.focus, muscle)) ??
      next.find((day) => day.focus.toLowerCase() !== "rest");
    if (!targetDay) return;

    const alreadyCovered = targetDay.exercises.some((exercise) => {
      const lib = library.find((item) => item.id === exercise.exerciseId);
      return (lib?.muscleBias ?? []).some((bias) => bias.muscle === muscle && bias.contribution >= 40);
    });

    if (alreadyCovered) return;

    const existingIds = new Set(targetDay.exercises.map((exercise) => exercise.exerciseId));
    const candidate = pickPriorityExercise(library, muscle, existingIds, targetDay.focus);
    if (!candidate) return;

    const priorityRepRange =
      preferences.strengthBias >= 65 && ["Chest", "Quads", "Hamstrings", "Glutes", "Upper Back", "Lats"].includes(muscle)
        ? "6-8"
        : preferences.hypertrophyBias >= 65
          ? "10-15"
          : "8-12";

    targetDay.exercises.push({
      exerciseId: candidate.id,
      sets: preferences.volumeBias >= 55 && preferences.recoveryBias < 65 ? 3 : 2,
      repRange: priorityRepRange,
      rir: preferences.recoveryBias >= 65 ? 2 : preferences.strengthBias >= 60 ? 2 : 1,
      note: `Priority muscle: ${muscle}`,
    });

    targetDay.volume = clamp(Number(targetDay.volume) + 1, 4, 10);
    targetDay.systemicLoad = clamp(
      Number(targetDay.systemicLoad) + (Number(candidate.systemicFatigue ?? 0) >= 5 ? 1 : 0),
      4,
      10
    );
  });

  return next;
};

export default function App() {
  const [bodyWeight, setBodyWeight] = useState(193);
  const [trainingDay, setTrainingDay] = useState(true);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [appTheme, setAppTheme] = useState<"light" | "dark">("light");
  const [selectedAthleteId, setSelectedAthleteId] = useState("athlete-1");
  const [athleteName, setAthleteName] = useState("BodyPilot athlete");
  const [accountProfile, setAccountProfile] = useState<BodyPilotAccount>(() => ({
    ...defaultBodyPilotAccount,
    displayName: "BodyPilot athlete",
  }));
  const [accountStatusMessage, setAccountStatusMessage] = useState("");
  const [accountStatusTone, setAccountStatusTone] = useState<AccountStatusTone>("info");
  const [localMembershipRecords, setLocalMembershipRecords] = useState<BodyPilotMembershipRecord[]>(
    readLocalBodyPilotMembershipRecords
  );
  const [membershipInviteDraft, setMembershipInviteDraft] = useState({
    athleteName: "",
    athleteEmail: "",
  });
  const [membershipInviteMessage, setMembershipInviteMessage] = useState("");
  const [accountSetupPromptDismissed, setAccountSetupPromptDismissed] = useState(false);
  const [setupGuideDismissed, setSetupGuideDismissed] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(
    readNotificationPermission
  );
  const [notificationStatusMessage, setNotificationStatusMessage] = useState("");
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastBackupExportedAt, setLastBackupExportedAt] = useState<string | null>(null);
  const [backupRestorePreview, setBackupRestorePreview] = useState<BackupRestorePreview | null>(null);
  const [pendingBackupRestorePayload, setPendingBackupRestorePayload] = useState<Record<string, unknown> | null>(null);
  const [actionReceipt, setActionReceipt] = useState<ActionReceipt | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(() => resolveInitialAppTab());
  const [userMode, setUserMode] = useState<"athlete" | "coach">("athlete");
  const [selfManagedAthlete, setSelfManagedAthlete] = useState(true);
  const [showAdvancedEditors, setShowAdvancedEditors] = useState(defaultAdvancedEditors);
  const [showBuilderTools, setShowBuilderTools] = useState(true);
  const [showCoachRoster, setShowCoachRoster] = useState(false);
  const [coachTriageFilter, setCoachTriageFilter] = useState<CoachTriageFilter>("all");
  const [showSettingsPanel, setShowSettingsPanel] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("settings") === "1"
  );
  const [settingsSectionIntent, setSettingsSectionIntent] = useState<SettingsSectionIntent>(
    resolveInitialSettingsSectionIntent
  );
  const [scheduleViewMode, setScheduleViewMode] = useState<ScheduleViewMode>("week");
  const [nutritionSidebarIntent, setNutritionSidebarIntent] = useState<{
    section: NutritionSidebarSection;
    templateId: string | null;
    nonce: number;
  }>({
    section: "overview",
    templateId: null,
    nonce: 0,
  });
  const [nutritionSurfaceIntent, setNutritionSurfaceIntent] = useState<NutritionSurfaceIntent>({
    surface: "log",
    entryMode: "search",
    nonce: 0,
  });
  const [trackerSurfaceIntent, setTrackerSurfaceIntent] = useState<TrackerSurfaceIntent>({
    surface: userMode === "coach" ? "dashboard" : "log",
    nonce: 0,
  });
  const [trainingSurfaceIntent, setTrainingSurfaceIntent] = useState<TrainingSurfaceIntent>({
    surface: "exercise-support",
    nonce: 0,
  });

  const [sleepQuality, setSleepQuality] = useState(5);
  const [digestion, setDigestion] = useState(6);
  const [pump, setPump] = useState(7);
  const [dryness, setDryness] = useState(6);
  const [fullness, setFullness] = useState(7);
  const [steps, setSteps] = useState(0);
  const [stepTargetAdjustment, setStepTargetAdjustment] = useState(0);

  const [waterLiters, setWaterLiters] = useState(defaultPrepModel.todayTargets.waterLiters);
  const [saltTsp, setSaltTsp] = useState(defaultPrepModel.todayTargets.saltTsp);
  const [intraCarbs, setIntraCarbs] = useState(defaultPrepModel.todayTargets.intraCarbs);

  const [proteinTarget, setProteinTarget] = useState(defaultPrepModel.todayTargets.protein);
  const [carbTarget, setCarbTarget] = useState(defaultPrepModel.todayTargets.carbs);
  const [fatTarget, setFatTarget] = useState(defaultPrepModel.todayTargets.fats);
  const [estimatedTdee, setEstimatedTdee] = useState(defaultPrepModel.maintenanceCalories);

  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("All");
  const [libraryMuscle, setLibraryMuscle] = useState("All");
  const [libraryPosition, setLibraryPosition] = useState("All");
  const [autoApplySuggestion, setAutoApplySuggestion] = useState(false);
  const [autoApplyDietPreset, setAutoApplyDietPreset] = useState(false);
  const [profileHeight, setProfileHeight] = useState(67);
  const [profileBodyFat, setProfileBodyFat] = useState(9);
  const [athleteLevel, setAthleteLevel] = useState<AthleteLevel>("intermediate");
  const [phaseType, setPhaseType] = useState<PhaseType>("contest-prep");
  const [goalFocus, setGoalFocus] = useState<GoalFocus>("stage-readiness");
  const [conditioningPriority, setConditioningPriority] = useState<ConditioningPriority>("moderate");
  const [checkInCadence, setCheckInCadence] = useState<CheckInCadence>("3x-week");
  const [coachCadence, setCoachCadence] = useState<CoachCadence>("2x-week");
  const [targetStageWeightLb, setTargetStageWeightLb] = useState(185);
  const [compoundLibrarySelection, setCompoundLibrarySelection] = useState("test-c");
  const [customCompoundName, setCustomCompoundName] = useState("");
  const [customCompoundHalfLife, setCustomCompoundHalfLife] = useState(5);
  const [customCompoundAnabolic, setCustomCompoundAnabolic] = useState(100);
  const [customCompoundAndrogenic, setCustomCompoundAndrogenic] = useState(100);
  const [contestDate, setContestDate] = useState(defaultContestDateIso);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => toIsoDate(new Date()));

  const [compounds, setCompounds] = useState<Compound[]>(() => normalizeLoadedCompounds(initialCompounds));
  const [supplements, setSupplements] = useState<SupplementProtocol[]>(() => normalizeLoadedSupplements(initialSupplements));
  const [meals, setMeals] = useState<Meal[]>(() => normalizeLoadedMeals(initialMeals));
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(() =>
    normalizeLoadedMealTemplates(initialMealTemplates)
  );
  const [customFoods, setCustomFoods] = useState<FoodCatalogItem[]>([]);
  const [foodDayHistory, setFoodDayHistory] = useState<FoodDaySnapshot[]>([]);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);
  const [recentFoodIds, setRecentFoodIds] = useState<string[]>([]);
  const [splitTemplate, setSplitTemplate] = useState<SplitTemplateId>(defaultSplitTemplateId);
  const [splitStrengthBias, setSplitStrengthBias] = useState(55);
  const [splitHypertrophyBias, setSplitHypertrophyBias] = useState(70);
  const [splitVolumeBias, setSplitVolumeBias] = useState(55);
  const [splitRecoveryBias, setSplitRecoveryBias] = useState(60);
  const [splitFrequencyBias, setSplitFrequencyBias] = useState(55);
  const [splitIntensityBias, setSplitIntensityBias] = useState(50);
  const [splitPriorityMuscles, setSplitPriorityMuscles] = useState<string[]>(["Quads", "Chest"]);
  const [splitPriorityMuscleDraft, setSplitPriorityMuscleDraft] = useState<string>("Lats");
  const [splitEstimatedMaxes, setSplitEstimatedMaxes] = useState<EstimatedMaxes>({ ...defaultEstimatedMaxes });
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutDay[]>(() => defaultWorkoutSplit);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(initialCheckIns);
  const [trackerTasks, setTrackerTasks] = useState<TrackerTask[]>(() => normalizeLoadedTrackerTasks(initialTrackerTasks));
  const [trackerDays, setTrackerDays] = useState<TrackerDay[]>(() => defaultTrackerDays);
  const [selectedTrackerDayId, setSelectedTrackerDayId] = useState(defaultSelectedTrackerDayId);
  const [trackerMonthLabel, setTrackerMonthLabel] = useState(() => formatMonthLabel(toIsoDate(new Date())));
  const [libraryTargetDayId, setLibraryTargetDayId] = useState("d1");
  const [movementLimitation, setMovementLimitation] = useState("None");
  const [trackerTemplateDayId, setTrackerTemplateDayId] = useState("d1");
  const [calendarSessionOverrides, setCalendarSessionOverrides] = useState<CalendarSessionOverrides>({});
  const [exerciseLibrary] = useState<ExerciseLibraryItem[]>(exerciseLibraryData);
  const [schedule, setSchedule] = useState<ScheduleEventLocal[]>(() => normalizeLoadedSchedule(initialSchedule as ScheduleEventLocal[]));
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>(initialChangeLog);
  const [publishedCoachDecisions, setPublishedCoachDecisions] = useState<PublishedCoachDecision[]>([]);
  const [coachThreadMessages, setCoachThreadMessages] = useState<CoachThreadMessage[]>([]);
  const [wearableSnapshots, setWearableSnapshots] = useState<WearableRecoverySnapshot[]>([]);
  const [weeklySnapshots, setWeeklySnapshots] = useState<WeeklySnapshotLocal[]>(initialWeeklySnapshots as WeeklySnapshotLocal[]);
  const [coachInstruction, setCoachInstruction] = useState("Hold steady today. Prioritize clean execution, digestion, and full completion of the programmed work.");
  const [athleteIssue, setAthleteIssue] = useState("Digestion slightly heavy post-workout. Pump and look are otherwise solid.");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [expandedAthleteLifts, setExpandedAthleteLifts] = useState<Record<string, boolean>>({});
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [savedWorkspaceFound, setSavedWorkspaceFound] = useState(false);
  const [storageIssue, setStorageIssue] = useState<string | null>(null);

  const scrollWorkspaceToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const openSettingsSection = useCallback(
    (section: SettingsSection) => {
      setSettingsSectionIntent({ section, nonce: Date.now() });
      setShowSettingsPanel(true);
      scrollWorkspaceToTop();
    },
    [scrollWorkspaceToTop]
  );

  const openWorkspace = useCallback(
    (tab: AppTab) => {
      let nextTab = tab;

      if (userMode === "athlete") {
        if (tab === "schedule") {
          setTrackerSurfaceIntent({ surface: "week", nonce: Date.now() });
          nextTab = "tracker";
        } else if (tab === "library") {
          setTrainingSurfaceIntent({ surface: "exercise-support", nonce: Date.now() });
          nextTab = "split";
        } else if (!selfManagedAthlete && tab === "compounds") {
          nextTab = "coach";
        }
      }

      setShowSettingsPanel(false);
      setActiveTab(nextTab);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${nextTab}`);
      }
      scrollWorkspaceToTop();
    },
    [scrollWorkspaceToTop, selfManagedAthlete, userMode]
  );

  const goToTab = useCallback(
    (tab: AppTab) => {
      openWorkspace(tab);
    },
    [openWorkspace]
  );

  const openNutritionSurface = useCallback(
    (surface: NutritionSurface, entryMode: FoodEntryMode = "search") => {
      setNutritionSurfaceIntent({
        surface,
        entryMode,
        nonce: Date.now(),
      });
      openWorkspace("nutrition");
    },
    [openWorkspace]
  );

  const openTrackerSurface = useCallback(
    (surface: TrackerSurface) => {
      setTrackerSurfaceIntent({
        surface,
        nonce: Date.now(),
      });
      openWorkspace("tracker");
    },
    [openWorkspace]
  );

  const openTrainingExerciseSupport = useCallback(
    (dayId?: string) => {
      if (dayId) {
        setLibraryTargetDayId(dayId);
      }
      setTrainingSurfaceIntent({
        surface: "exercise-support",
        dayId,
        nonce: Date.now(),
      });
      openWorkspace("split");
    },
    [openWorkspace]
  );

  React.useEffect(() => {
    if (userMode !== "athlete") return;

    if (activeTab === "schedule") {
      openWorkspace("schedule");
    } else if (activeTab === "library") {
      openWorkspace("library");
    } else if (!selfManagedAthlete && activeTab === "compounds") {
      openWorkspace("compounds");
    }
  }, [activeTab, openWorkspace, selfManagedAthlete, userMode]);

  const coachMembershipRecords = useMemo(() => {
    if (userMode !== "coach") return [];
    return localMembershipRecords.filter(
      (membership) => membership.coachId === accountProfile.id && membership.status !== "revoked"
    );
  }, [accountProfile.id, localMembershipRecords, userMode]);
  const activeCoachMemberships = useMemo(
    () => coachMembershipRecords.filter((membership) => membership.status === "active"),
    [coachMembershipRecords]
  );
  const pendingCoachMemberships = useMemo(
    () => coachMembershipRecords.filter((membership) => membership.status === "invited"),
    [coachMembershipRecords]
  );
  const latestMembershipAuditEvent = useMemo(
    () => changeLog.find((entry) => entry.category === "Membership") ?? null,
    [changeLog]
  );
  const normalizedAccountEmail = accountProfile.email.trim().toLowerCase();
  const pendingAthleteMembershipInvites = useMemo(() => {
    if (userMode !== "athlete" || !normalizedAccountEmail) return [];
    return localMembershipRecords.filter(
      (membership) =>
        membership.status === "invited" &&
        membership.athleteEmail.trim().toLowerCase() === normalizedAccountEmail
    );
  }, [localMembershipRecords, normalizedAccountEmail, userMode]);
  const activeAthleteMembershipConnection = useMemo(() => {
    if (userMode !== "athlete") return null;
    return (
      localMembershipRecords.find(
        (membership) =>
          membership.status === "active" &&
          (membership.athleteId === accountProfile.id ||
            (!!normalizedAccountEmail && membership.athleteEmail.trim().toLowerCase() === normalizedAccountEmail))
      ) ?? null
    );
  }, [accountProfile.id, localMembershipRecords, normalizedAccountEmail, userMode]);
  const primaryPendingAthleteInvite = pendingAthleteMembershipInvites[0] ?? null;

  const athleteRoster = useMemo(
    () => {
      const primaryAthlete = {
        id: "athlete-1",
        name: athleteName.trim() || "BodyPilot athlete",
        division: "Classic / MP",
        status: "Setup active",
      };

      if (userMode !== "coach") return [primaryAthlete];

      const membershipAthletes = activeCoachMemberships.map((membership) => ({
        id: membership.athleteId ?? membership.id,
        name: membership.athleteName,
        division: "Remote client",
        status: "Membership active",
      }));

      return [
        primaryAthlete,
        ...membershipAthletes,
        { id: "athlete-2", name: "Maya R.", division: "Wellness", status: "Check-in review" },
        { id: "athlete-3", name: "Dante V.", division: "Classic Physique", status: "Peak push" },
        { id: "athlete-4", name: "Nia S.", division: "Lifestyle", status: "Update waiting" },
      ];
    },
    [activeCoachMemberships, athleteName, userMode]
  );

  const activeAthlete = athleteRoster.find((athlete) => athlete.id === selectedAthleteId) ?? athleteRoster[0];
  const canEditPlan = userMode === "coach" || selfManagedAthlete;
  const availableFoods = useMemo(
    () => [...coreFoodCatalog, ...expandedFoodCatalog, ...customFoods],
    [customFoods]
  );
  const todayIso = toIsoDate(new Date());
  const contestCountdownDays = useMemo(
    () => daysBetween(new Date(), parseIsoDate(contestDate)),
    [contestDate]
  );
  const weeksOut = useMemo(
    () => Math.max(0, Math.ceil(contestCountdownDays / 7)),
    [contestCountdownDays]
  );
  const contestDateLabel = useMemo(
    () =>
      parseIsoDate(contestDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [contestDate]
  );
  const timelineSummary = useMemo(() => {
    if (contestCountdownDays < 0) {
      return `Post show - ${Math.abs(contestCountdownDays)} days since ${contestDateLabel}`;
    }
    if (contestCountdownDays === 0) {
      return `Contest day - ${contestDateLabel}`;
    }
    if (contestCountdownDays <= 7) {
      return `Peak week - ${contestCountdownDays} days to ${contestDateLabel}`;
    }
    return `Week ${weeksOut} out - ${contestCountdownDays} days to ${contestDateLabel}`;
  }, [contestCountdownDays, contestDateLabel, weeksOut]);
  const contestPrepModel = useMemo<ContestPrepModel>(
    () =>
      buildContestPrepModel({
        athleteLevel,
        phaseType,
        goalFocus,
        conditioningPriority,
        checkInCadence,
        coachCadence,
        weeksOut,
        bodyWeightLb: bodyWeight,
        bodyFatPct: profileBodyFat,
        targetStageWeightLb,
      }),
    [
      athleteLevel,
      phaseType,
      goalFocus,
      conditioningPriority,
      checkInCadence,
      coachCadence,
      weeksOut,
      bodyWeight,
      profileBodyFat,
      targetStageWeightLb,
    ]
  );
  const activeStepTarget = useMemo(
    () => Math.max(6000, contestPrepModel.todayTargets.steps + stepTargetAdjustment),
    [contestPrepModel.todayTargets.steps, stepTargetAdjustment]
  );
  const ecosystemPlanSnapshot = useMemo(
    () =>
      buildEcosystemPlanSnapshot({
        athleteLevel,
        phaseType,
        goalFocus,
        conditioningPriority,
        checkInCadence,
        coachCadence,
        targetStageWeightLb,
        weeksOut,
        bodyWeightLb: bodyWeight,
        bodyFatPct: profileBodyFat,
      }),
    [
      athleteLevel,
      phaseType,
      goalFocus,
      conditioningPriority,
      checkInCadence,
      coachCadence,
      targetStageWeightLb,
      weeksOut,
      bodyWeight,
      profileBodyFat,
    ]
  );
  const selectedCalendarDayRule = useMemo(
    () => getScheduleDayFromDate(selectedCalendarDate),
    [selectedCalendarDate]
  );
  const getScheduledSessionIdForDate = useCallback(
    (value: string) => {
      const override = calendarSessionOverrides[value];
      if (override) return override;
      const defaultDay = getDefaultSplitDayForDate(value, workoutSplit);
      if (!defaultDay || defaultDay.focus.toLowerCase() === "rest") return REST_SESSION_ID;
      return defaultDay.id;
    },
    [calendarSessionOverrides, workoutSplit]
  );
  const getScheduledSplitDayForDate = useCallback(
    (value: string) => {
      const scheduledId = getScheduledSessionIdForDate(value);
      if (scheduledId === REST_SESSION_ID) return null;
      return workoutSplit.find((day) => day.id === scheduledId) ?? getDefaultSplitDayForDate(value, workoutSplit);
    },
    [getScheduledSessionIdForDate, workoutSplit]
  );
  const getScheduledSessionLabelForDate = useCallback(
    (value: string) => getScheduledSplitDayForDate(value)?.focus ?? "Rest",
    [getScheduledSplitDayForDate]
  );
  const selectedCalendarSessionLabel = useMemo(
    () => getScheduledSessionLabelForDate(selectedCalendarDate),
    [getScheduledSessionLabelForDate, selectedCalendarDate]
  );
  const selectedScheduledWorkoutDay = useMemo(
    () => getScheduledSplitDayForDate(selectedCalendarDate),
    [getScheduledSplitDayForDate, selectedCalendarDate]
  );
  const selectedCalendarSummary = useMemo(
    () => `${formatFriendlyDate(selectedCalendarDate)} - ${selectedCalendarSessionLabel}`,
    [selectedCalendarDate, selectedCalendarSessionLabel]
  );
  const scheduledSessionOptions = useMemo(
    () => [
      { id: REST_SESSION_ID, label: "Rest / recovery" },
      ...workoutSplit
        .filter((day) => day.focus.toLowerCase() !== "rest")
        .map((day) => ({
        id: day.id,
        label: `${day.day} - ${day.focus}`,
      })),
    ],
    [workoutSplit]
  );
  const syncTrackerDateToSessionId = useCallback(
    (value: string, dayId: string) => {
      const scheduledDay = dayId === REST_SESSION_ID ? null : workoutSplit.find((day) => day.id === dayId) ?? null;

      setTrackerDays((prev) =>
        prev.map((day) => {
          if (day.date !== value) return day;
          return withDerivedCompletion({
            ...day,
            title: scheduledDay?.focus ?? "Rest",
            lifts: buildTrackerLiftsFromWorkoutDay(day.id, scheduledDay, exerciseLibrary, day.lifts),
          });
        })
      );
    },
    [exerciseLibrary, workoutSplit]
  );
  const setScheduledSessionForDate = useCallback(
    (value: string, dayId: string) => {
      setCalendarSessionOverrides((prev) => ({
        ...prev,
        [value]: dayId,
      }));
      syncTrackerDateToSessionId(value, dayId);
    },
    [syncTrackerDateToSessionId]
  );
  const swapScheduledSession = useCallback(
    (value: string, direction: -1 | 1) => {
      const adjacentDate = toIsoDate(addDays(parseIsoDate(value), direction));
      const currentId = getScheduledSessionIdForDate(value);
      const adjacentId = getScheduledSessionIdForDate(adjacentDate);
      setCalendarSessionOverrides((prev) => ({
        ...prev,
        [value]: adjacentId,
        [adjacentDate]: currentId,
      }));
      syncTrackerDateToSessionId(value, adjacentId);
      syncTrackerDateToSessionId(adjacentDate, currentId);
    },
    [getScheduledSessionIdForDate, syncTrackerDateToSessionId]
  );
  useEffect(() => {
    if (userMode !== "coach") {
      setShowCoachRoster(false);
    }
  }, [userMode]);

  useEffect(() => {
    if (userMode === "athlete" && activeTab === "coach") {
      setActiveTab("dashboard");
    }
  }, [activeTab, userMode]);

  useEffect(() => {
    setSplitHypertrophyBias((prev) => (prev === 100 - splitStrengthBias ? prev : 100 - splitStrengthBias));
  }, [splitStrengthBias]);

  useEffect(() => {
    setTrainingDay(selectedCalendarSessionLabel.toLowerCase() !== "rest");
  }, [selectedCalendarSessionLabel]);

  useEffect(() => {
    setSplitVolumeBias((prev) => (prev === 100 - splitRecoveryBias ? prev : 100 - splitRecoveryBias));
  }, [splitRecoveryBias]);

  useEffect(() => {
    setSplitFrequencyBias((prev) => (prev === 100 - splitIntensityBias ? prev : 100 - splitIntensityBias));
  }, [splitIntensityBias]);

  useEffect(() => {
    setTrackerMonthLabel(formatMonthLabel(selectedCalendarDate));
    const matchingTrackerDay = trackerDays.find((day) => day.date === selectedCalendarDate);
    if (matchingTrackerDay && matchingTrackerDay.id !== selectedTrackerDayId) {
      setSelectedTrackerDayId(matchingTrackerDay.id);
    }
  }, [selectedCalendarDate, trackerDays, selectedTrackerDayId]);

  useEffect(() => {
    setTrackerDays((prev) => {
      let changed = false;
      const requiredDates = Array.from(new Set([todayIso, selectedCalendarDate]));
      const ensuredDays = [...prev];

      requiredDates.forEach((date) => {
        if (ensuredDays.some((day) => day.date === date)) return;
        changed = true;
        ensuredDays.push(buildBlankTrackerDay(date, workoutSplit, exerciseLibrary));
      });

      const orderedDays = [...ensuredDays].sort((left, right) => left.date.localeCompare(right.date));
      const next = orderedDays.map((day) => {
        const scheduledDay = getScheduledSplitDayForDate(day.date);
        const nextTitle = scheduledDay?.focus ?? "Rest";
        const nextLifts = hasTrackerLiftProgress(day)
          ? day.lifts
          : buildTrackerLiftsFromWorkoutDay(day.id, scheduledDay, exerciseLibrary, day.lifts);
        const hydratedDay = withDerivedCompletion({
          ...day,
          title: nextTitle,
          lifts: nextLifts,
        });

        if (day.title === hydratedDay.title && trackerLiftsMatch(day.lifts, hydratedDay.lifts) && day.completion === hydratedDay.completion) {
          return day;
        }

        changed = true;
        return hydratedDay;
      });

      return changed ? next : prev;
    });
  }, [exerciseLibrary, getScheduledSplitDayForDate, selectedCalendarDate, todayIso, workoutSplit]);

  const goToPreviousAthlete = () => {
    setSelectedAthleteId((prev) => athleteRoster[(athleteRoster.findIndex((athlete) => athlete.id === prev) - 1 + athleteRoster.length) % athleteRoster.length]?.id ?? prev);
  };

  const goToNextAthlete = () => {
    setSelectedAthleteId((prev) => athleteRoster[(athleteRoster.findIndex((athlete) => athlete.id === prev) + 1) % athleteRoster.length]?.id ?? prev);
  };

  const refreshLocalMembershipRecords = useCallback(() => {
    setLocalMembershipRecords(readLocalBodyPilotMembershipRecords());
  }, []);

  const recordMembershipAuditEvent = useCallback(
    (event: {
      action: "invited" | "accepted" | "cancelled" | "revoked";
      athleteId: string;
      athleteName: string;
      athleteEmail: string;
      coachName: string;
      threadAuthor?: CoachThreadMessage["author"];
      writeThread?: boolean;
    }) => {
      const occurredAt = new Date().toISOString();
      const actionCopy = {
        invited: {
          title: `Invited ${event.athleteName}`,
          detail: `${event.coachName} invited ${event.athleteEmail} to connect as a coached athlete.`,
          impact: "The coach-client relationship is pending and will appear as connected after athlete acceptance.",
          thread: `Coach invite sent to ${event.athleteEmail}.`,
        },
        accepted: {
          title: `${event.athleteName} accepted coach access`,
          detail: `${event.athleteName} accepted the coach connection from ${event.coachName}.`,
          impact: "The athlete workspace is now guided and relationship-scoped coach updates can be trusted.",
          thread: `${event.athleteName} accepted the coach connection from ${event.coachName}.`,
        },
        cancelled: {
          title: `Cancelled invite for ${event.athleteName}`,
          detail: `${event.coachName} cancelled the pending invite for ${event.athleteEmail}.`,
          impact: "The pending relationship was closed before the athlete accepted access.",
          thread: `Pending coach invite cancelled for ${event.athleteEmail}.`,
        },
        revoked: {
          title: `Revoked access for ${event.athleteName}`,
          detail: `${event.coachName} revoked coach-client access for ${event.athleteEmail}.`,
          impact: "The relationship is no longer active, preventing stale coach visibility from looking valid.",
          thread: `${event.coachName} revoked coach-client access for this athlete.`,
        },
      }[event.action];

      setChangeLog((prev) => [
        {
          id: `membership-${event.action}-${Date.now()}`,
          date: occurredAt.slice(0, 10),
          category: "Membership",
          title: actionCopy.title,
          detail: actionCopy.detail,
          impact: actionCopy.impact,
        },
        ...prev,
      ]);

      if (!event.writeThread) return;

      const message: CoachThreadMessage = {
        id: `membership-thread-${event.action}-${Date.now()}`,
        createdAt: occurredAt,
        athleteId: event.athleteId,
        athleteName: event.athleteName,
        author: event.threadAuthor ?? "coach",
        body: actionCopy.thread,
        deliveryStatus: "delivered",
        deliveredAt: occurredAt,
      };

      setCoachThreadMessages((prev) => [message, ...prev].slice(0, 80));
    },
    []
  );

  const inviteCoachClient = useCallback(() => {
    const coachName = accountProfile.displayName.trim() || athleteName.trim() || "BodyPilot coach";
    const result = localBodyPilotMembershipAdapter.inviteClient({
      coachId: accountProfile.id,
      coachName,
      athleteName: membershipInviteDraft.athleteName,
      athleteEmail: membershipInviteDraft.athleteEmail,
    });

    refreshLocalMembershipRecords();
    setMembershipInviteMessage(result.message);
    setActionReceipt({
      id: Date.now(),
      title: result.ok ? "Client invite staged" : "Invite needs attention",
      detail: result.message,
      tone: result.ok ? "success" : "warning",
    });

    if (result.ok) {
      if (result.membership) {
        recordMembershipAuditEvent({
          action: "invited",
          athleteId: result.membership.athleteId ?? result.membership.id,
          athleteName: result.membership.athleteName,
          athleteEmail: result.membership.athleteEmail,
          coachName,
        });
      }
      setMembershipInviteDraft({ athleteName: "", athleteEmail: "" });
      setShowCoachRoster(true);
    }
  }, [
    accountProfile.displayName,
    accountProfile.id,
    athleteName,
    membershipInviteDraft.athleteEmail,
    membershipInviteDraft.athleteName,
    recordMembershipAuditEvent,
    refreshLocalMembershipRecords,
  ]);

  const revokeCoachMembership = useCallback(
    (membership: BodyPilotMembershipRecord) => {
      const revokedBy = accountProfile.displayName.trim() || "BodyPilot coach";
      const result = localBodyPilotMembershipAdapter.revokeMembership(membership.id, revokedBy);
      refreshLocalMembershipRecords();
      setMembershipInviteMessage(result.message);
      setActionReceipt({
        id: Date.now(),
        title: result.ok ? "Membership access revoked" : "Revoke failed",
        detail: result.message,
        tone: result.ok ? "warning" : "error",
      });

      if (result.ok) {
        const wasPendingInvite = membership.status === "invited";
        recordMembershipAuditEvent({
          action: wasPendingInvite ? "cancelled" : "revoked",
          athleteId: membership.athleteId ?? membership.id,
          athleteName: membership.athleteName,
          athleteEmail: membership.athleteEmail,
          coachName: revokedBy,
          threadAuthor: "coach",
          writeThread: !wasPendingInvite,
        });
      }

      const selectedMembershipAthleteId = membership.athleteId ?? membership.id;
      if (selectedAthleteId === selectedMembershipAthleteId) {
        setSelectedAthleteId("athlete-1");
      }
    },
    [accountProfile.displayName, recordMembershipAuditEvent, refreshLocalMembershipRecords, selectedAthleteId]
  );

  const acceptCoachMembershipInvite = useCallback(
    (membership: BodyPilotMembershipRecord) => {
      if (accountProfile.status === "signed-out" || !accountProfile.email.trim()) {
        setMembershipInviteMessage("Create or sign in to the invited client account before accepting.");
        setActionReceipt({
          id: Date.now(),
          title: "Account needed",
          detail: "Use the invited client email in Account settings before accepting the coach invite.",
          tone: "warning",
        });
        openSettingsSection("account");
        return;
      }

      const athleteDisplayName = accountProfile.displayName.trim() || athleteName.trim() || membership.athleteName;
      const result = localBodyPilotMembershipAdapter.acceptInvite(membership.id, {
        id: accountProfile.id,
        displayName: athleteDisplayName,
        email: accountProfile.email,
      });

      refreshLocalMembershipRecords();
      setMembershipInviteMessage(result.message);

      if (result.ok) {
        const profileResult = updateLocalBodyPilotAccount(accountProfile, {
          role: "coached-athlete",
          displayName: athleteDisplayName,
          subscriptionTier: accountProfile.subscriptionTier === "coach" ? "pro" : accountProfile.subscriptionTier,
        });
        if (profileResult.account) {
          setAccountProfile(profileResult.account);
          setAthleteName(profileResult.account.displayName);
        }
        setUserMode("athlete");
        setSelfManagedAthlete(false);
        setAccountStatusMessage(`Connected to ${membership.coachName}.`);
        setAccountStatusTone("success");
        recordMembershipAuditEvent({
          action: "accepted",
          athleteId: accountProfile.id,
          athleteName: athleteDisplayName,
          athleteEmail: accountProfile.email,
          coachName: membership.coachName,
          threadAuthor: "athlete",
          writeThread: true,
        });
      }

      setActionReceipt({
        id: Date.now(),
        title: result.ok ? "Coach connected" : "Invite not accepted",
        detail: result.ok ? `${membership.coachName} can now guide this athlete workspace.` : result.message,
        tone: result.ok ? "success" : "warning",
      });
    },
    [
      accountProfile,
      athleteName,
      openSettingsSection,
      recordMembershipAuditEvent,
      refreshLocalMembershipRecords,
    ]
  );

  const triggerActiveClass = useMemo(() => {
    if (appTheme === "dark") {
      return "data-[state=active]:text-white data-[state=active]:shadow-sm";
    }
    return "data-[state=active]:text-white data-[state=active]:shadow-sm";
  }, [appTheme]);

  const themeClasses = useMemo(() => {
    if (appTheme === "dark") {
      return {
        shell: "bg-transparent text-slate-100",
        hero: "premium-view-header",
        tabs: "premium-tabs-surface",
      };
    }
    return {
      shell: "bg-transparent text-slate-900",
      hero: "premium-view-header",
      tabs: "premium-tabs-surface",
    };
  }, [appTheme]);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = appTheme === "dark";

    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";

    return () => {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    };
  }, [appTheme]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      setSavedWorkspaceFound(Boolean(saved));
      if (!saved) return;
      const parsed = JSON.parse(saved);
      const restoredContestDate = parsed.contestDate ?? defaultContestDateIso;
      const restoredProfileBodyFat = parsed.profileBodyFat ?? 9;
      const restoredAthleteLevel = parsed.athleteLevel ?? "intermediate";
      const restoredPhaseType = parsed.phaseType ?? "contest-prep";
      const restoredGoalFocus = parsed.goalFocus ?? "stage-readiness";
      const restoredConditioningPriority = parsed.conditioningPriority ?? "moderate";
      const restoredCheckInCadence = parsed.checkInCadence ?? "3x-week";
      const restoredCoachCadence = parsed.coachCadence ?? "2x-week";
      const restoredTargetStageWeight = parsed.targetStageWeightLb ?? 185;
      const restoredBodyWeight = parsed.bodyWeight ?? 193;
      const restoredPrepModel = buildContestPrepModel({
        athleteLevel: restoredAthleteLevel,
        phaseType: restoredPhaseType,
        goalFocus: restoredGoalFocus,
        conditioningPriority: restoredConditioningPriority,
        checkInCadence: restoredCheckInCadence,
        coachCadence: restoredCoachCadence,
        weeksOut: Math.max(0, Math.ceil(daysBetween(new Date(), parseIsoDate(restoredContestDate)) / 7)),
        bodyWeightLb: restoredBodyWeight,
        bodyFatPct: restoredProfileBodyFat,
        targetStageWeightLb: restoredTargetStageWeight,
      });
      const restoredSplitTemplate = (parsed.splitTemplate ?? restoredPrepModel.splitTemplateId) as SplitTemplateId;
      const restoredWorkoutSplit = normalizeLoadedWorkoutSplit(
        parsed.workoutSplit ?? buildSplitTemplate(restoredSplitTemplate, exerciseLibraryData),
        restoredSplitTemplate,
        exerciseLibraryData
      );
      const savedSelectedDate = parsed.selectedCalendarDate ?? toIsoDate(new Date());
      const shouldRefreshToToday =
        (parsed.lastOpenedOn == null || parsed.lastOpenedOn !== todayIso) &&
        savedSelectedDate <= todayIso;
      const restoredCalendarDate = shouldRefreshToToday ? todayIso : savedSelectedDate;
      const loadedTrackerDays = normalizeLoadedTrackerDays(
        parsed.trackerDays ?? initialTrackerDays,
        restoredWorkoutSplit,
        exerciseLibraryData,
        restoredCalendarDate
      );
      const restoredTrackerDayId =
        shouldRefreshToToday
          ? buildSelectedTrackerDayId(loadedTrackerDays, todayIso)
          : loadedTrackerDays.find((day: TrackerDay) => day.id === parsed.selectedTrackerDayId)?.id
            ?? buildSelectedTrackerDayId(loadedTrackerDays, restoredCalendarDate);
      const restoredMeals = normalizeLoadedMeals(parsed.meals ?? initialMeals);
      const savedWorkspaceDate =
        typeof parsed.lastOpenedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastOpenedOn)
          ? parsed.lastOpenedOn
          : savedSelectedDate;
      const restoredFoodDayHistory = normalizeLoadedFoodDayHistory(parsed.foodDayHistory);
      const previousFoodDaySnapshot =
        savedWorkspaceDate < todayIso
          ? buildFoodDaySnapshot({
              date: savedWorkspaceDate,
              meals: restoredMeals,
              targetCalories: (parsed.proteinTarget ?? restoredPrepModel.todayTargets.protein) * 4 +
                (parsed.carbTarget ?? restoredPrepModel.todayTargets.carbs) * 4 +
                (parsed.fatTarget ?? restoredPrepModel.todayTargets.fats) * 9,
              targetProtein: parsed.proteinTarget ?? restoredPrepModel.todayTargets.protein,
              targetCarbs: parsed.carbTarget ?? restoredPrepModel.todayTargets.carbs,
              targetFats: parsed.fatTarget ?? restoredPrepModel.todayTargets.fats,
            })
          : null;
      const restoredFoodHistoryWithCarryForward = previousFoodDaySnapshot
        ? upsertFoodDaySnapshot(restoredFoodDayHistory, previousFoodDaySnapshot)
        : restoredFoodDayHistory;
      setBodyWeight(restoredBodyWeight);
      setTrainingDay(parsed.trainingDay ?? true);
      setSleepQuality(parsed.sleepQuality ?? 5);
      setSleepHours(parsed.sleepHours ?? 7.5);
      const loadedTheme = parsed.appTheme ?? "light";
      const normalizedTheme = ["light", "dark"].includes(loadedTheme) ? loadedTheme : "light";
      setAppTheme(normalizedTheme as "light" | "dark");
      setSelectedAthleteId(parsed.selectedAthleteId ?? "athlete-1");
      setAthleteName(parsed.athleteName ?? "BodyPilot athlete");
      setAccountProfile(normalizeBodyPilotAccount(parsed.accountProfile, parsed.athleteName ?? "BodyPilot athlete"));
      const restoredMembershipRecords = Array.isArray(parsed.membershipRecords)
        ? normalizeLocalBodyPilotMembershipRecords(parsed.membershipRecords)
        : readLocalBodyPilotMembershipRecords();
      writeLocalBodyPilotMembershipRecords(restoredMembershipRecords);
      setLocalMembershipRecords(restoredMembershipRecords);
      setAccountSetupPromptDismissed(Boolean(parsed.accountSetupPromptDismissed));
      setSetupGuideDismissed(Boolean(parsed.setupGuideDismissed));
      setNotificationPreferences(normalizeNotificationPreferences(parsed.notificationPreferences));
      setLastSavedAt(typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : null);
      setLastBackupExportedAt(typeof parsed.lastBackupExportedAt === "string" ? parsed.lastBackupExportedAt : null);
      setUserMode(parsed.userMode ?? "athlete");
      setSelfManagedAthlete(parsed.selfManagedAthlete ?? true);
      setShowAdvancedEditors({ ...defaultAdvancedEditors, ...(parsed.showAdvancedEditors ?? {}) });
      setShowBuilderTools(parsed.showBuilderTools ?? true);
      setScheduleViewMode(parsed.scheduleViewMode === "month" ? "month" : "week");
      setDigestion(parsed.digestion ?? 6);
      setPump(parsed.pump ?? 7);
      setDryness(parsed.dryness ?? 6);
      setFullness(parsed.fullness ?? 7);
      setSteps(parsed.steps ?? 0);
      setStepTargetAdjustment(parsed.stepTargetAdjustment ?? 0);
      setWaterLiters(parsed.waterLiters ?? restoredPrepModel.todayTargets.waterLiters);
      setSaltTsp(parsed.saltTsp ?? restoredPrepModel.todayTargets.saltTsp);
      setIntraCarbs(parsed.intraCarbs ?? restoredPrepModel.todayTargets.intraCarbs);
      setProteinTarget(parsed.proteinTarget ?? restoredPrepModel.todayTargets.protein);
      setCarbTarget(parsed.carbTarget ?? restoredPrepModel.todayTargets.carbs);
      setFatTarget(parsed.fatTarget ?? restoredPrepModel.todayTargets.fats);
      setEstimatedTdee(parsed.estimatedTdee ?? restoredPrepModel.maintenanceCalories);
      setLibrarySearch(parsed.librarySearch ?? "");
      setLibraryCategory(parsed.libraryCategory ?? "All");
      setLibraryMuscle(parsed.libraryMuscle ?? "All");
      setLibraryPosition(parsed.libraryPosition ?? "All");
      setAutoApplySuggestion(parsed.autoApplySuggestion ?? false);
      setAutoApplyDietPreset(parsed.autoApplyDietPreset ?? false);
      setProfileHeight(parsed.profileHeight ?? 67);
      setProfileBodyFat(restoredProfileBodyFat);
      setAthleteLevel(restoredAthleteLevel);
      setPhaseType(restoredPhaseType);
      setGoalFocus(restoredGoalFocus);
      setConditioningPriority(restoredConditioningPriority);
      setCheckInCadence(restoredCheckInCadence);
      setCoachCadence(restoredCoachCadence);
      setTargetStageWeightLb(restoredTargetStageWeight);
      setCompoundLibrarySelection(parsed.compoundLibrarySelection ?? "test-c");
      setCustomCompoundName(parsed.customCompoundName ?? "");
      setCustomCompoundHalfLife(parsed.customCompoundHalfLife ?? 5);
      setCustomCompoundAnabolic(parsed.customCompoundAnabolic ?? 100);
      setCustomCompoundAndrogenic(parsed.customCompoundAndrogenic ?? 100);
      setContestDate(restoredContestDate);
      setSelectedCalendarDate(restoredCalendarDate);
      setCompounds(normalizeLoadedCompounds(parsed.compounds ?? initialCompounds));
      setSupplements(normalizeLoadedSupplements(parsed.supplements ?? initialSupplements));
      setMeals(previousFoodDaySnapshot ? normalizeLoadedMeals(initialMeals) : restoredMeals);
      setMealTemplates(normalizeLoadedMealTemplates(parsed.mealTemplates ?? initialMealTemplates));
      setCustomFoods(normalizeLoadedCustomFoods(parsed.customFoods));
      setFoodDayHistory(restoredFoodHistoryWithCarryForward);
      setFavoriteFoodIds(Array.isArray(parsed.favoriteFoodIds) ? parsed.favoriteFoodIds : []);
      setRecentFoodIds(Array.isArray(parsed.recentFoodIds) ? parsed.recentFoodIds : []);
      setSplitTemplate(restoredSplitTemplate);
      setSplitStrengthBias(parsed.splitStrengthBias ?? 55);
      setSplitHypertrophyBias(parsed.splitHypertrophyBias ?? 70);
      setSplitVolumeBias(parsed.splitVolumeBias ?? 55);
      setSplitRecoveryBias(parsed.splitRecoveryBias ?? 60);
      setSplitFrequencyBias(parsed.splitFrequencyBias ?? 55);
      setSplitIntensityBias(parsed.splitIntensityBias ?? 50);
      setSplitPriorityMuscles(parsed.splitPriorityMuscles ?? ["Quads", "Chest"]);
      setSplitPriorityMuscleDraft(parsed.splitPriorityMuscleDraft ?? "Lats");
      setSplitEstimatedMaxes({ ...defaultEstimatedMaxes, ...(parsed.splitEstimatedMaxes ?? {}) });
      setWorkoutSplit(restoredWorkoutSplit);
      setCheckIns(normalizeLoadedCheckIns(parsed.checkIns ?? initialCheckIns));
      setTrackerTasks(normalizeLoadedTrackerTasks(parsed.trackerTasks ?? initialTrackerTasks));
      setTrackerDays(loadedTrackerDays);
      setSelectedTrackerDayId(restoredTrackerDayId);
      setTrackerMonthLabel(parsed.trackerMonthLabel ?? formatMonthLabel(restoredCalendarDate));
      setLibraryTargetDayId(parsed.libraryTargetDayId ?? "d1");
      setTrackerTemplateDayId(parsed.trackerTemplateDayId ?? "d1");
      setCalendarSessionOverrides(parsed.calendarSessionOverrides ?? {});
      setSchedule(normalizeLoadedSchedule((parsed.schedule ?? initialSchedule) as ScheduleEventLocal[]));
      setChangeLog(normalizeLoadedChangeLog(parsed.changeLog ?? initialChangeLog));
      setPublishedCoachDecisions(Array.isArray(parsed.publishedCoachDecisions) ? parsed.publishedCoachDecisions : []);
      setCoachThreadMessages(Array.isArray(parsed.coachThreadMessages) ? parsed.coachThreadMessages : []);
      setWearableSnapshots(Array.isArray(parsed.wearableSnapshots) ? parsed.wearableSnapshots : []);
      setWeeklySnapshots(normalizeLoadedWeeklySnapshots(parsed.weeklySnapshots ?? initialWeeklySnapshots) as WeeklySnapshotLocal[]);
      setCoachInstruction(parsed.coachInstruction ?? "Hold steady today. Prioritize clean execution, digestion, and full completion of the programmed work.");
      setAthleteIssue(parsed.athleteIssue ?? "Digestion slightly heavy post-workout. Pump and look are otherwise solid.");
      setQuoteIndex(parsed.quoteIndex ?? 0);
    } catch {
      setStorageIssue("Saved data could not be restored. The app started from the default plan for this session.");
    } finally {
      setStorageHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineState = () => setIsOnline(window.navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    setCompounds((prev) => hydrateCompoundScience(prev));
  }, []);

  useEffect(() => {
    if (!storageHydrated) return;

    try {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
        dataEnvelopeVersion: BODY_PILOT_DATA_ENVELOPE_VERSION,
        bodyWeight,
        trainingDay,
        sleepQuality,
        sleepHours,
        appTheme,
        accountProfile,
        membershipRecords: localMembershipRecords,
        accountSetupPromptDismissed,
        setupGuideDismissed,
        notificationPreferences,
        selectedAthleteId,
        athleteName,
        userMode,
        selfManagedAthlete,
        showBuilderTools,
        scheduleViewMode,
        digestion,
        pump,
        dryness,
        fullness,
        steps,
        stepTargetAdjustment,
        waterLiters,
        saltTsp,
        intraCarbs,
        proteinTarget,
        carbTarget,
        fatTarget,
        estimatedTdee,
        librarySearch,
        libraryCategory,
        libraryMuscle,
        libraryPosition,
        autoApplySuggestion,
        autoApplyDietPreset,
        profileHeight,
        profileBodyFat,
        athleteLevel,
        phaseType,
        goalFocus,
        conditioningPriority,
        checkInCadence,
        coachCadence,
        targetStageWeightLb,
        compoundLibrarySelection,
        customCompoundName,
        customCompoundHalfLife,
        customCompoundAnabolic,
        customCompoundAndrogenic,
        contestDate,
        selectedCalendarDate,
        compounds,
        supplements,
        meals,
        mealTemplates,
        customFoods,
        foodDayHistory,
        favoriteFoodIds,
        recentFoodIds,
        splitStrengthBias,
        splitHypertrophyBias,
        splitVolumeBias,
        splitRecoveryBias,
        splitFrequencyBias,
        splitIntensityBias,
        splitPriorityMuscles,
        splitPriorityMuscleDraft,
        splitEstimatedMaxes,
        workoutSplit,
        checkIns,
        trackerTasks,
        trackerDays,
        selectedTrackerDayId,
        trackerMonthLabel,
        libraryTargetDayId,
        trackerTemplateDayId,
        calendarSessionOverrides,
        schedule,
        changeLog,
        publishedCoachDecisions,
        coachThreadMessages,
        wearableSnapshots,
        weeklySnapshots,
        lastBackupExportedAt,
        lastOpenedOn: todayIso,
        lastSavedAt: savedAt,
        coachInstruction,
        athleteIssue,
        quoteIndex,
        splitTemplate,
        showAdvancedEditors,
        })
      );
      setLastSavedAt(savedAt);
      setStorageIssue((current) => (current?.startsWith("Local save failed") ? null : current));
    } catch {
      setStorageIssue("Local save failed. Changes may not persist until browser storage is available.");
    }
  }, [
    bodyWeight,
    trainingDay,
    sleepQuality,
    sleepHours,
    appTheme,
    accountProfile,
    localMembershipRecords,
    accountSetupPromptDismissed,
    setupGuideDismissed,
    notificationPreferences,
    selectedAthleteId,
    athleteName,
    userMode,
    selfManagedAthlete,
    showBuilderTools,
    scheduleViewMode,
    digestion,
    pump,
    dryness,
    fullness,
    steps,
    stepTargetAdjustment,
    waterLiters,
    saltTsp,
    intraCarbs,
    proteinTarget,
    carbTarget,
    fatTarget,
    estimatedTdee,
    librarySearch,
    libraryCategory,
    libraryMuscle,
    libraryPosition,
    autoApplySuggestion,
    autoApplyDietPreset,
    profileHeight,
    profileBodyFat,
    athleteLevel,
    phaseType,
    goalFocus,
    conditioningPriority,
    checkInCadence,
    coachCadence,
    targetStageWeightLb,
    compoundLibrarySelection,
    customCompoundName,
    customCompoundHalfLife,
    customCompoundAnabolic,
    customCompoundAndrogenic,
    contestDate,
    selectedCalendarDate,
    compounds,
    supplements,
    meals,
    mealTemplates,
    customFoods,
    foodDayHistory,
    favoriteFoodIds,
    recentFoodIds,
    splitStrengthBias,
    splitHypertrophyBias,
    splitVolumeBias,
    splitRecoveryBias,
    splitFrequencyBias,
    splitIntensityBias,
    splitPriorityMuscles,
    splitPriorityMuscleDraft,
    splitEstimatedMaxes,
    workoutSplit,
    checkIns,
    trackerTasks,
    trackerDays,
    selectedTrackerDayId,
    trackerMonthLabel,
    libraryTargetDayId,
    trackerTemplateDayId,
    calendarSessionOverrides,
    schedule,
    changeLog,
    publishedCoachDecisions,
    coachThreadMessages,
    wearableSnapshots,
    weeklySnapshots,
    lastBackupExportedAt,
    todayIso,
    coachInstruction,
    athleteIssue,
    quoteIndex,
    splitTemplate,
    showAdvancedEditors,
    storageHydrated,
  ]);

  const exportAppDataBackup = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStorageIssue("No saved data is available yet. Make one change, then export again.");
        setActionReceipt({
          id: Date.now(),
          title: "No backup yet",
          detail: "Make one change so BodyPilot can create the first local save, then export again.",
          tone: "warning",
        });
        return;
      }

      const parsed = JSON.parse(raw);
      const exportedAt = new Date().toISOString();
      const storedMembershipRecords = readLocalBodyPilotMembershipRecords();
      const membershipRecords = normalizeLocalBodyPilotMembershipRecords(
        storedMembershipRecords.length > 0 ? storedMembershipRecords : localMembershipRecords
      );
      const payload = JSON.stringify(
        {
          ...parsed,
          membershipRecords,
          dataEnvelopeVersion: BODY_PILOT_DATA_ENVELOPE_VERSION,
          backupVersion: 1,
          exportedAt,
          lastBackupExportedAt: exportedAt,
        },
        null,
        2
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const athleteSlug = activeAthlete.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "athlete";

      anchor.href = url;
      anchor.download = `bodypilot-${athleteSlug}-${todayIso}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setLastBackupExportedAt(exportedAt);
      setStorageIssue(null);
      setActionReceipt({
        id: Date.now(),
        title: "Backup exported",
        detail: `${anchor.download} was downloaded from the current local workspace.`,
        tone: "success",
      });
    } catch {
      setStorageIssue("Backup export failed. Browser storage may be unavailable.");
      setActionReceipt({
        id: Date.now(),
        title: "Export failed",
        detail: "Browser storage blocked the backup. Check storage permissions before relying on this workspace.",
        tone: "error",
      });
    }
  }, [activeAthlete.name, localMembershipRecords, todayIso]);

  const importAppDataBackup = useCallback(async (file: File | null) => {
    if (!file || typeof window === "undefined") return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const backupPayload = isRecord(parsed)
        ? {
            ...parsed,
            membershipRecords: normalizeLocalBodyPilotMembershipRecords(parsed.membershipRecords),
          }
        : parsed;
      let currentPayload: Record<string, unknown> | null = null;

      try {
        const currentRaw = window.localStorage.getItem(STORAGE_KEY);
        const currentParsed = currentRaw ? JSON.parse(currentRaw) : null;
        currentPayload = isRecord(currentParsed)
          ? { ...currentParsed, membershipRecords: readLocalBodyPilotMembershipRecords() }
          : { membershipRecords: readLocalBodyPilotMembershipRecords() };
      } catch {
        currentPayload = { membershipRecords: readLocalBodyPilotMembershipRecords() };
      }

      const preview = buildBackupRestorePreview(backupPayload, file, currentPayload);

      setBackupRestorePreview(preview);

      if (!isValidBodyPilotBackupPayload(backupPayload)) {
        setPendingBackupRestorePayload(null);
        throw new Error("Invalid BodyPilot backup payload.");
      }

      setPendingBackupRestorePayload(backupPayload);
      setStorageIssue("Backup ready to restore. Review the preview before replacing the workspace.");
      setActionReceipt({
        id: Date.now(),
        title: "Backup preview ready",
        detail: `${file.name} passed validation. Confirm restore when the counts look right.`,
        tone: preview.status === "warning" ? "warning" : "success",
      });
    } catch {
      setStorageIssue("Backup import failed. Choose a valid BodyPilot backup JSON file.");
      setActionReceipt({
        id: Date.now(),
        title: "Import blocked",
        detail: "That file did not match a valid BodyPilot backup payload.",
        tone: "error",
      });
    }
  }, []);

  const confirmAppDataBackupImport = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!backupRestorePreview || !pendingBackupRestorePayload || backupRestorePreview.status === "blocked") {
      setStorageIssue("Backup restore is not ready. Choose a valid BodyPilot backup first.");
      setActionReceipt({
        id: Date.now(),
        title: "Restore blocked",
        detail: "There is no validated backup staged for restore.",
        tone: "error",
      });
      return;
    }

    try {
      const restoredMembershipRecords = normalizeLocalBodyPilotMembershipRecords(
        pendingBackupRestorePayload.membershipRecords
      );
      const restoredPayload = {
        ...pendingBackupRestorePayload,
        membershipRecords: restoredMembershipRecords,
        dataEnvelopeVersion: BODY_PILOT_DATA_ENVELOPE_VERSION,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredPayload));
      writeLocalBodyPilotMembershipRecords(restoredMembershipRecords);
      setLocalMembershipRecords(restoredMembershipRecords);
      setBackupRestorePreview(null);
      setPendingBackupRestorePayload(null);
      setStorageIssue("Backup restored. Reloading the workspace now.");
      setActionReceipt({
        id: Date.now(),
        title: "Backup restored",
        detail: "The validated backup replaced the local workspace.",
        tone: "success",
      });
      window.setTimeout(() => window.location.reload(), 250);
    } catch {
      setStorageIssue("Backup restore failed. Browser storage may be unavailable.");
      setActionReceipt({
        id: Date.now(),
        title: "Restore failed",
        detail: "Browser storage blocked the restore action.",
        tone: "error",
      });
    }
  }, [backupRestorePreview, pendingBackupRestorePayload]);

  const cancelAppDataBackupImport = useCallback(() => {
    setBackupRestorePreview(null);
    setPendingBackupRestorePayload(null);
    setStorageIssue(null);
    setActionReceipt({
      id: Date.now(),
      title: "Restore cancelled",
      detail: "The selected backup was cleared without changing local data.",
      tone: "info",
    });
  }, []);

  const resetLocalData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      clearLocalBodyPilotMembershipRecords();
      setStorageIssue("Local data reset. Reloading the default workspace now.");
      setActionReceipt({
        id: Date.now(),
        title: "Local data reset",
        detail: "Saved data was cleared on this device. The default workspace is reloading.",
        tone: "warning",
      });
      window.setTimeout(() => window.location.reload(), 250);
    } catch {
      setStorageIssue("Local reset failed. Browser storage may be unavailable.");
      setActionReceipt({
        id: Date.now(),
        title: "Reset failed",
        detail: "Browser storage blocked the reset action.",
        tone: "error",
      });
    }
  }, []);

  const selectedTrackerDay = useMemo(() => {
    return trackerDays.find((day) => day.id === selectedTrackerDayId) ?? trackerDays[0] ?? null;
  }, [trackerDays, selectedTrackerDayId]);

  const selectedTrackerCompletedLifts = useMemo(() => {
    if (!selectedTrackerDay) return 0;
    return selectedTrackerDay.lifts.filter((lift) => lift.completed).length;
  }, [selectedTrackerDay]);

  const selectedTrackerMissedLifts = useMemo(() => {
    if (!selectedTrackerDay) return 0;
    return selectedTrackerDay.lifts.filter((lift) => !lift.completed).length;
  }, [selectedTrackerDay]);

  const trackerDayCompletionMap = useMemo(
    () =>
      Object.fromEntries(
        trackerDays.map((day) => [day.id, deriveTrackerDayCompletion(day)])
      ) as Record<string, number>,
    [trackerDays]
  );

  const selectedTrackerCompletionPct = useMemo(() => {
    if (!selectedTrackerDay) return 0;
    return trackerDayCompletionMap[selectedTrackerDay.id] ?? 0;
  }, [selectedTrackerDay, trackerDayCompletionMap]);

  const selectedTrackerEnergyScore = useMemo(() => {
    if (!selectedTrackerDay?.energy) return 3;
    const parsed = Number(selectedTrackerDay.energy);
    if (Number.isNaN(parsed)) return 3;
    return clamp(parsed, 1, 5);
  }, [selectedTrackerDay]);

  const selectedTrackerStepScore = useMemo(() => {
    if (!selectedTrackerDay?.steps) return 0;
    const parsed = Number(selectedTrackerDay.steps);
    if (Number.isNaN(parsed)) return 0;
    return parsed;
  }, [selectedTrackerDay]);

  const selectedTrackerExecutionScore = useMemo(() => {
    if (!selectedTrackerDay) return 0;

    const completionPart = selectedTrackerCompletionPct * 0.55;
    const liftPart =
      selectedTrackerDay.lifts.length > 0
        ? (selectedTrackerCompletedLifts / selectedTrackerDay.lifts.length) * 25
        : 15;
    const stepsPart = Math.min(15, (selectedTrackerStepScore / 10000) * 15);
    const energyPart = (selectedTrackerEnergyScore / 5) * 5;

    return Math.round(completionPart + liftPart + stepsPart + energyPart);
  }, [
    selectedTrackerDay,
    selectedTrackerCompletionPct,
    selectedTrackerCompletedLifts,
    selectedTrackerStepScore,
    selectedTrackerEnergyScore,
  ]);

  const enabledCompounds = useMemo(() => compounds.filter((compound) => compound.enabled), [compounds]);
  const compoundTrainingDaysPerWeek = useMemo(
    () => workoutSplit.filter((day) => day.focus.toLowerCase() !== "rest").length,
    [workoutSplit]
  );

  const compoundTotals = useMemo(() => {
    return enabledCompounds.reduce(
      (acc, compound) => {
        const scale = getCompoundEffectScale(compound, compoundTrainingDaysPerWeek);
        acc.fullness += compound.fullness * scale;
        acc.dryness += compound.dryness * scale;
        acc.performance += compound.performance * scale;
        acc.recovery += compound.recovery * scale;
        acc.stress += compound.stress * scale;
        acc.digestion += compound.digestion * scale;
        return acc;
      },
      { fullness: 0, dryness: 0, performance: 0, recovery: 0, stress: 0, digestion: 0 }
    );
  }, [compoundTrainingDaysPerWeek, enabledCompounds]);

  const avgIntensity = useMemo(() => {
    if (workoutSplit.length === 0) return 5;
    return workoutSplit.reduce((sum, day) => sum + day.intensity, 0) / workoutSplit.length;
  }, [workoutSplit]);

  const avgVolume = useMemo(() => {
    if (workoutSplit.length === 0) return 5;
    return workoutSplit.reduce((sum, day) => sum + day.volume, 0) / workoutSplit.length;
  }, [workoutSplit]);

  const avgSystemicLoad = useMemo(() => {
    if (workoutSplit.length === 0) return 5;
    return workoutSplit.reduce((sum, day) => sum + day.systemicLoad, 0) / workoutSplit.length;
  }, [workoutSplit]);

  const fullnessScore = useMemo(() => {
    return clamp(
      3 + pump * 0.22 + fullness * 0.26 + intraCarbs * 0.01 + compoundTotals.fullness * 0.08 - Math.max(0, digestion < 5 ? 0.7 : 0),
      0,
      10
    );
  }, [pump, fullness, intraCarbs, digestion, compoundTotals.fullness]);

  const drynessScore = useMemo(() => {
    return clamp(
      3.2 + dryness * 0.3 + compoundTotals.dryness * 0.08 - Math.max(0, intraCarbs - 110) * 0.01 - Math.max(0, saltTsp - 2) * 0.5,
      0,
      10
    );
  }, [dryness, compoundTotals.dryness, intraCarbs, saltTsp]);

  const conditionScore = useMemo(() => {
    const baseLeanness = 10 - Math.max(0, profileBodyFat - 4.5) * 0.72;
    const timelineAdjustment = Math.max(0, 1.2 - weeksOut * 0.06);
    const visualAdjustment = drynessScore * 0.18 + fullnessScore * 0.04;
    return clamp(baseLeanness + timelineAdjustment + visualAdjustment, 0, 10);
  }, [profileBodyFat, weeksOut, drynessScore, fullnessScore]);

  const trainingScore = useMemo(() => {
    return clamp(
      3 + pump * 0.12 + digestion * 0.18 + sleepQuality * 0.1 + compoundTotals.performance * 0.08 - avgIntensity * 0.04 - avgSystemicLoad * 0.03,
      0,
      10
    );
  }, [pump, digestion, sleepQuality, compoundTotals.performance, avgIntensity, avgSystemicLoad]);

  const recoveryScore = useMemo(() => {
    return clamp(
      1.8 +
        sleepHours * 0.42 +
        sleepQuality * 0.18 +
        digestion * 0.12 +
        compoundTotals.recovery * 0.05 -
        avgIntensity * 0.06 -
        avgSystemicLoad * 0.08 -
        Math.max(0, compoundTotals.stress) * 0.03,
      0,
      10
    );
  }, [sleepHours, sleepQuality, digestion, compoundTotals.recovery, avgIntensity, avgSystemicLoad, compoundTotals.stress]);

  const readinessScore = useMemo(() => Number((recoveryScore * 0.7 + trainingScore * 0.3).toFixed(1)), [trainingScore, recoveryScore]);

  const recoveryHeadroom = useMemo(() => {
    return clamp(Number((recoveryScore - avgSystemicLoad * 0.28).toFixed(1)), 0, 10);
  }, [recoveryScore, avgSystemicLoad]);

  const primaryLimiter = useMemo(() => {
    const sleepSupport = sleepHours * 0.55 + sleepQuality * 0.45;
    const digestionSupport = digestion + compoundTotals.digestion * 0.18;
    const trainingStressPressure = 10 - recoveryHeadroom;
    const options = [
      { key: "Sleep", value: sleepSupport },
      { key: "Digestion", value: digestionSupport },
      { key: "Training stress", value: trainingStressPressure },
      { key: "Fullness", value: fullnessScore },
      { key: "Dryness", value: drynessScore },
    ].sort((a, b) => a.value - b.value);

    if (sleepHours >= 7.5 && sleepQuality >= 5.5 && options[0]?.key === "Sleep") {
      return trainingStressPressure <= digestionSupport ? "Training stress" : "Digestion";
    }

    return options[0]?.key ?? "Balanced";
  }, [sleepHours, sleepQuality, digestion, compoundTotals.digestion, recoveryHeadroom, fullnessScore, drynessScore]);

  const peakWeekGoal = useMemo<PeakWeekGoal>(() => {
    if (primaryLimiter === "Fullness") return "full";
    if (primaryLimiter === "Dryness") return "dry";
    return "balanced";
  }, [primaryLimiter]);

  const peakWeekSpillRisk = useMemo(
    () =>
      clamp(
        10 -
          drynessScore +
          Math.max(0, fullnessScore - 8) * 0.6 +
          Math.max(0, waterLiters - 4.5) * 0.8 +
          Math.max(0, saltTsp - 2) * 0.8,
        0,
        10
      ),
    [drynessScore, fullnessScore, waterLiters, saltTsp]
  );

  const peakWeekPlan = useMemo<PeakWeekDayPlan[]>(() => {
    const contest = parseIsoDate(contestDate);
    const start = addDays(contest, -6);

    return Array.from({ length: 7 }, (_, index) => {
      const date = toIsoDate(addDays(start, index));
      const daysOut = Math.max(0, daysBetween(parseIsoDate(date), contest));
      const model = buildPeakWeekModel({
        daysOut: Math.max(1, daysOut),
        peakGoal: peakWeekGoal,
        dailyCarbs: carbTarget,
        waterLiters,
        saltTsp,
        fullnessScore,
        spillRisk: peakWeekSpillRisk,
      });
      const isContestDay = daysOut === 0;
      const riskTone =
        model.riskFlag === "High flattening risk" || model.riskFlag === "High spill risk"
          ? "amber"
          : isContestDay
            ? "emerald"
            : daysOut <= 2
              ? "sky"
              : "slate";
      const emphasis =
        isContestDay
          ? "Contest day"
          : daysOut >= 5
            ? "Stabilize setup"
            : daysOut >= 3
              ? "Reduce noise"
              : "Hold the look";
      const action =
        model.riskFlag === "High flattening risk"
          ? "Add 25g carbs and do not cut water further."
          : model.riskFlag === "High spill risk"
            ? "Hold carbs and do not increase water."
            : isContestDay
              ? "Hold the practiced intake until the coach changes it."
              : "Use these targets and keep the setup unchanged.";

      return {
        id: `peak-${date}`,
        date,
        label: isContestDay ? "Show day" : `${daysOut} days out`,
        daysOut,
        emphasis,
        carbs: model.suggestedCarbs,
        waterLiters: model.suggestedWater,
        saltTsp: model.suggestedSalt,
        training: model.depletionBias,
        checkIn: daysOut === 6 || daysOut === 3 || daysOut <= 1 ? "Photo check" : "Visual scan",
        action,
        riskFlag: model.riskFlag,
        tone: riskTone,
      };
    });
  }, [carbTarget, contestDate, fullnessScore, peakWeekGoal, peakWeekSpillRisk, saltTsp, waterLiters]);

  const mealTotals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
      },
      { protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals]);
  const loggedFoodTotals = useMemo(() => summarizeDayFoodNutrients(meals), [meals]);
  const loggedMacroTotals = useMemo(
    () => ({
      protein: Math.round(loggedFoodTotals.protein),
      carbs: Math.round(loggedFoodTotals.carbs),
      fats: Math.round(loggedFoodTotals.fat),
    }),
    [loggedFoodTotals]
  );
  const totalLoggedMeals = useMemo(
    () => meals.filter((meal) => (meal.foodEntries?.length ?? 0) > 0).length,
    [meals]
  );
  const totalLoggedFoodEntries = useMemo(
    () => meals.reduce((sum, meal) => sum + (meal.foodEntries?.length ?? 0), 0),
    [meals]
  );
  const mealPlanScienceProfile = useMemo(() => buildMealPlanScienceProfile(meals, trainingDay), [meals, trainingDay]);
  const macroCalories = useMemo(() => proteinTarget * 4 + carbTarget * 4 + fatTarget * 9, [proteinTarget, carbTarget, fatTarget]);
  const consumedCalories = useMemo(
    () => Math.round(loggedFoodTotals.calories),
    [loggedFoodTotals.calories]
  );
  const calorieDelta = macroCalories - estimatedTdee;
  const weeklyDensityScore = useMemo(() => {
    return clamp(
      Number(((avgIntensity * 0.35 + avgVolume * 0.35 + avgSystemicLoad * 0.3)).toFixed(1)),
      0,
      10
    );
  }, [avgIntensity, avgVolume, avgSystemicLoad]);

  const bodyWeightTrendModel = useMemo(
    () => buildBodyWeightTrendModel(trackerDays, bodyWeight),
    [trackerDays, bodyWeight]
  );
  const bodyWeightTrendValues = useMemo(
    () =>
      trackerDays
        .map((day) => Number(day.bodyWeight))
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(-10),
    [trackerDays]
  );

  const dietingPhase = useMemo(
    () => calorieDelta <= -250 || (bodyWeightTrendModel.weeklyChangePct ?? 0) <= -0.25,
    [calorieDelta, bodyWeightTrendModel.weeklyChangePct]
  );

  const proteinSupportModel = useMemo(
    () =>
      buildProteinSupportModel(
        proteinTarget,
        bodyWeightTrendModel.currentWeightLb ?? bodyWeight,
        profileBodyFat,
        dietingPhase
      ),
    [proteinTarget, bodyWeightTrendModel.currentWeightLb, bodyWeight, profileBodyFat, dietingPhase]
  );

  const dietPressureModel = useMemo(
    () =>
      buildDietPressureModel({
        calorieDelta,
        weeklyChangePct: bodyWeightTrendModel.weeklyChangePct,
        recoveryHeadroom,
        weeklyDensityScore,
      }),
    [calorieDelta, bodyWeightTrendModel.weeklyChangePct, recoveryHeadroom, weeklyDensityScore]
  );

  const selfManagedAdaptivePlan = useMemo(() => {
    const actualWeeklyLossPct =
      bodyWeightTrendModel.weeklyChangePct == null
        ? null
        : Math.max(0, -bodyWeightTrendModel.weeklyChangePct);
    const targetWeeklyLossPct = contestPrepModel.weeklyLossTargetPct;
    const triggerFloor = Math.max(0.1, targetWeeklyLossPct - 0.15);
    const isBehind =
      selfManagedAthlete &&
      targetWeeklyLossPct > 0 &&
      actualWeeklyLossPct != null &&
      actualWeeklyLossPct < triggerFloor;
    const desiredSteps = contestPrepModel.todayTargets.steps + (isBehind ? 1000 : 0);
    const carbPullG = isBehind ? 20 : 0;
    const adaptiveMoveApplied =
      isBehind &&
      activeStepTarget >= desiredSteps &&
      carbTarget <= contestPrepModel.todayTargets.carbs - carbPullG;

    return {
      isBehind,
      actualWeeklyLossPct,
      targetWeeklyLossPct,
      carbPullG,
      nextSteps: desiredSteps,
      title: isBehind
        ? adaptiveMoveApplied
          ? "Hold the applied adaptive cut"
          : `Reduce carbs by 20g and set steps to ${desiredSteps.toLocaleString()}`
        : "Adaptive plan is holding",
      detail: isBehind
        ? adaptiveMoveApplied
          ? `Actual loss is ${actualWeeklyLossPct?.toFixed(2)}% / wk against a ${targetWeeklyLossPct.toFixed(2)}% / wk target. Keep this cut active until the next weekly read.`
          : `Actual loss is ${actualWeeklyLossPct?.toFixed(2)}% / wk against a ${targetWeeklyLossPct.toFixed(2)}% / wk target. Pull carbs first and raise output before changing training volume.`
        : actualWeeklyLossPct == null
          ? "Log enough bodyweight data before changing macros from the adaptive model."
          : `Actual loss is ${actualWeeklyLossPct.toFixed(2)}% / wk against a ${targetWeeklyLossPct.toFixed(2)}% / wk target. No extra cut is needed right now.`,
    };
  }, [
    activeStepTarget,
    bodyWeightTrendModel.weeklyChangePct,
    carbTarget,
    contestPrepModel.todayTargets.carbs,
    contestPrepModel.todayTargets.steps,
    contestPrepModel.weeklyLossTargetPct,
    selfManagedAthlete,
  ]);

  const recoveryPressureModel = useMemo(
    () =>
      buildRecoveryPressureModel({
        sleepHours,
        sleepQuality,
        recoveryScore,
        recoveryHeadroom,
        weeklyDensityScore,
        weeklyChangePct: bodyWeightTrendModel.weeklyChangePct,
      }),
    [
      sleepHours,
      sleepQuality,
      recoveryScore,
      recoveryHeadroom,
      weeklyDensityScore,
      bodyWeightTrendModel.weeklyChangePct,
    ]
  );

  const hydrationSupportModel = useMemo(
    () =>
      buildHydrationSupportModel({
        trainingDay,
        waterLiters,
        saltTsp,
        steps: selectedTrackerStepScore || steps,
        intraCarbs,
      }),
    [trainingDay, waterLiters, saltTsp, selectedTrackerStepScore, steps, intraCarbs]
  );

  const mealDistribution = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        const bucket = meal.type ?? "standard";
        if (!acc[bucket]) {
          acc[bucket] = { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
        }
        acc[bucket].protein += meal.protein;
        acc[bucket].carbs += meal.carbs;
        acc[bucket].fats += meal.fats;
        acc[bucket].calories += meal.protein * 4 + meal.carbs * 4 + meal.fats * 9;
        acc[bucket].count += 1;
        return acc;
      },
      {} as Record<string, { protein: number; carbs: number; fats: number; calories: number; count: number }>
    );
  }, [meals]);

  const fuelTimingModel = useMemo(() => {
    const pre = mealDistribution.pre ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const intra = mealDistribution.intra ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const post = mealDistribution.post ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };

    return buildFuelTimingModel({
      trainingDay,
      preCarbs: pre.carbs,
      intraCarbs: intra.count > 0 ? intra.carbs : intraCarbs,
      postCarbs: post.carbs,
      postFats: post.fats,
      primaryLimiter,
      weeklyDensityScore,
    });
  }, [mealDistribution, trainingDay, intraCarbs, primaryLimiter, weeklyDensityScore]);

  const selectedDayLoadedMealPlan = useMemo(() => {
    const isTrainingDay = (selectedScheduledWorkoutDay?.focus ?? "Rest").toLowerCase() !== "rest";
    const relevantMeals = meals.filter((meal) => {
      const mealType = meal.type ?? "standard";
      return (
        mealType === "standard" ||
        (isTrainingDay && ["pre", "intra", "post"].includes(mealType)) ||
        (!isTrainingDay && mealType === "off")
      );
    });

    const totals = relevantMeals.reduce(
      (acc, meal) => {
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
      },
      { protein: 0, carbs: 0, fats: 0 }
    );
    const intraMealCarbs = relevantMeals
      .filter((meal) => meal.type === "intra")
      .reduce((sum, meal) => sum + meal.carbs, 0);

    return {
      ...totals,
      meals: relevantMeals.length,
      intraCarbs: isTrainingDay ? intraMealCarbs : 0,
    };
  }, [meals, selectedScheduledWorkoutDay]);
  const selectedScheduledExercises = useMemo(
    () =>
      (selectedScheduledWorkoutDay?.exercises ?? []).map((exercise, index) => {
        const lib = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
        return {
          id: `${selectedScheduledWorkoutDay?.id ?? "day"}-${exercise.exerciseId}-${index}`,
          name: lib?.name ?? exercise.exerciseId,
          category: lib?.category ?? selectedScheduledWorkoutDay?.focus ?? "Session",
          sets: exercise.sets,
          repRange: exercise.repRange,
          rir: exercise.rir,
          note: exercise.note,
        };
      }),
    [exerciseLibrary, selectedScheduledWorkoutDay]
  );

  const exerciseScientificProfiles = useMemo(
    () =>
      Object.fromEntries(
        exerciseLibrary.map((item) => [item.id, buildExerciseScientificProfile(item)])
      ) as Record<string, ExerciseScientificProfile>,
    [exerciseLibrary]
  );

  const splitScientificSummary = useMemo(() => {
    const lowerBodyMuscles = new Set(["Quads", "Hamstrings", "Glutes", "Calves", "Adductors"]);

    return workoutSplit.reduce(
      (acc, day) => {
        day.exercises.forEach((exercise) => {
          const profile = exerciseScientificProfiles[exercise.exerciseId];
          if (!profile) return;

          const isLowerBodyDay =
            /leg|lower/i.test(day.focus.toLowerCase()) ||
            profile.primaryMuscles.some((muscle) => lowerBodyMuscles.has(muscle));

          if (profile.position === "anchor") acc.anchorCount += 1;
          if (profile.recoveryDemand === "high") acc.highRecoveryCount += 1;

          if (isLowerBodyDay) {
            if (profile.position === "anchor") acc.lowerBodyAnchorCount += 1;
            if (profile.recoveryDemand === "high") acc.lowerBodyHighRecoveryCount += 1;
          }
        });

        return acc;
      },
      {
        anchorCount: 0,
        highRecoveryCount: 0,
        lowerBodyAnchorCount: 0,
        lowerBodyHighRecoveryCount: 0,
      }
    );
  }, [workoutSplit, exerciseScientificProfiles]);

  const totalPlannedSets = useMemo(
    () => workoutSplit.reduce((sum, day) => sum + day.exercises.reduce((inner, exercise) => inner + exercise.sets, 0), 0),
    [workoutSplit]
  );

  const trackerWeeklyReview = useMemo(() => {
    const completionValues = trackerDays.map((day) => trackerDayCompletionMap[day.id] ?? 0);
    const averageCompletion = completionValues.length
      ? Math.round(completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length)
      : 0;
    return {
      averageCompletion,
      completedDays: trackerDays.filter((day) => (trackerDayCompletionMap[day.id] ?? 0) >= 85).length,
      loggedDays: trackerDays.length,
    };
  }, [trackerDays, trackerDayCompletionMap]);

  const coachRecommendation = useMemo(() => {
    if (selectedTrackerExecutionScore < 50) {
      return {
        action:
          selectedTrackerMissedLifts > 0
            ? "Complete today's training log"
            : "Complete today's log",
        reason: "Use the logged day as the source of truth before changing food, training, or support.",
      };
    }
    if (selfManagedAdaptivePlan.isBehind) {
      return {
        action: selfManagedAdaptivePlan.title,
        reason: `${selfManagedAdaptivePlan.detail} Apply the adaptive week, then review the next weekly weigh-in before cutting again.`,
      };
    }
    if (primaryLimiter === "Digestion") {
      return {
        action:
          fuelTimingModel.status === "digestion-heavy"
            ? "Move 15g fat out of the post-workout meal"
            : "Keep fats under 10g in the training window",
        reason: "Digestion is capping output and look quality. Make the meal flow easier before changing total calories.",
      };
    }
    if (primaryLimiter === "Sleep" || primaryLimiter === "Training stress") {
      return {
        action:
          recoveryHeadroom < 4.5
            ? "Remove 2 hard sets from the next session"
            : "Cap the next session at RPE 8",
        reason: "Recovery support is lagging the current weekly stress profile. Lower the fatigue cost before adding output.",
      };
    }
    if (primaryLimiter === "Fullness") {
      return {
        action: "Add 25g carbs to the training window",
        reason: "The athlete looks under-fueled more than over-fatigued. Put the extra carbs around the session before touching the whole day.",
      };
    }
    if (primaryLimiter === "Dryness") {
      const steadyWater = Math.min(Math.max(waterLiters, 3.5), 4.5);
      const nextSalt = Math.max(saltTsp, 1.25);

      if (hydrationSupportModel.status === "dilute") {
        return {
          action: `Hold water at ${steadyWater.toFixed(1)}L and raise salt to ${nextSalt.toFixed(2)} tsp`,
          reason: "Fluid is high relative to electrolyte support. Stabilize water and sodium before making a harsher food change.",
        };
      }

      if (hydrationSupportModel.status === "heavy") {
        return {
          action: "Do not increase water or salt today",
          reason: "Both water and sodium are already being pushed. Hold them steady so the look can be read cleanly.",
        };
      }

      return {
        action: "Hold food steady and stop extra water changes",
        reason: "The athlete is close, but the look needs a cleaner read. Avoid adding more variables today.",
      };
    }
    return {
      action: "Hold the plan today",
      reason: "No major correction is needed right now. Keep execution clean and wait for a stronger signal before changing the plan.",
    };
  }, [
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    primaryLimiter,
    fuelTimingModel.status,
    recoveryHeadroom,
    waterLiters,
    saltTsp,
    hydrationSupportModel.status,
    selfManagedAdaptivePlan.detail,
    selfManagedAdaptivePlan.isBehind,
    selfManagedAdaptivePlan.title,
  ]);

  const complianceConfidence = useMemo(() => {
    const score = clamp(
      Math.round(trackerWeeklyReview.averageCompletion * 0.6 + Math.min(steps / 1000, 10) * 2 + recoveryScore * 2),
      0,
      100
    );
    return {
      score,
      label: score >= 85 ? "High" : score >= 65 ? "Moderate" : "Low",
    };
  }, [trackerWeeklyReview, steps, recoveryScore]);

  const dashboardQueuedChanges = useMemo(() => {
    const items: string[] = [];
    if (selfManagedAdaptivePlan.isBehind) items.push(`${selfManagedAdaptivePlan.title}.`);
    if (recoveryPressureModel.status === "high") items.push("Remove 2 hard sets from the next session.");
    if (primaryLimiter === "Digestion") items.push("Move 15g fat away from the training window.");
    if (primaryLimiter === "Fullness") items.push("Add 25g carbs to the training window.");
    if (trainingDay && fuelTimingModel.status === "underfueled") items.push("Add carbs before or during training before changing the full day.");
    if (hydrationSupportModel.status === "low") items.push(`Raise water to at least ${trainingDay ? "3.5" : "2.5"}L today.`);
    if (hydrationSupportModel.status === "dilute") items.push(`Hold water and bring salt to at least ${Math.max(saltTsp, 1.25).toFixed(2)} tsp.`);
    if (recoveryHeadroom < 4.5) items.push("Cap the next session at RPE 8.");
    if (items.length === 0) items.push(`${coachRecommendation.action}.`);
    return items.slice(0, 3);
  }, [
    selectedTrackerMissedLifts,
    recoveryPressureModel.status,
    primaryLimiter,
    trainingDay,
    fuelTimingModel.status,
    hydrationSupportModel.status,
    saltTsp,
    recoveryHeadroom,
    coachRecommendation.action,
    selfManagedAdaptivePlan.isBehind,
    selfManagedAdaptivePlan.title,
  ]);

  const dashboardPrimaryAction = useMemo(() => {
    if (userMode === "coach") {
      if (selectedTrackerExecutionScore < 50) {
        return {
          eyebrow: "Coach priority",
          title: "Fix adherence before rewriting the plan",
          body: "Execution is too low to trust any bigger programming or nutrition call. Get the athlete finishing the work first.",
          cta: "Review tracker",
          tab: "tracker" as AppTab,
        };
      }

      return {
        eyebrow: "Coach priority",
        title: coachRecommendation.action,
        body: coachRecommendation.reason,
        cta: primaryLimiter === "Digestion" || primaryLimiter === "Fullness" ? "Meals" : primaryLimiter === "Dryness" ? "Review package" : "Training",
        tab: primaryLimiter === "Digestion" || primaryLimiter === "Fullness" ? "nutrition" as AppTab : primaryLimiter === "Dryness" ? "coach" as AppTab : "split" as AppTab,
      };
    }

    if (selectedTrackerMissedLifts >= 3) {
      return {
        eyebrow: "Today's job",
        title: "Close today's log",
        body: "Finish the training entries, then review the next move.",
        cta: "Today",
        tab: "tracker" as AppTab,
      };
    }

    if (selfManagedAthlete) {
      if (selfManagedAdaptivePlan.isBehind) {
        return {
          eyebrow: "Adaptive plan",
          title: selfManagedAdaptivePlan.title,
          body: selfManagedAdaptivePlan.detail,
          cta: "Roadmap",
          tab: "dashboard" as AppTab,
        };
      }

      return {
        eyebrow: "Today's job",
        title: "Execute first, edit only if needed",
        body: "Run the day cleanly first. You can change your own plan, but the app should not turn every check-in into random retuning.",
        cta: "Today",
        tab: "tracker" as AppTab,
      };
    }

    return {
      eyebrow: "Today's job",
      title: "Stay on script",
      body: "Hit the session, hit the food, and keep the day clean. The win is consistency, not random changes.",
      cta: "Today",
      tab: "tracker" as AppTab,
    };
  }, [
    userMode,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    coachRecommendation.action,
    coachRecommendation.reason,
    primaryLimiter,
    selfManagedAthlete,
    selfManagedAdaptivePlan.detail,
    selfManagedAdaptivePlan.isBehind,
    selfManagedAdaptivePlan.title,
  ]);

  const athleteStatusLabel = useMemo(() => {
    if (!selectedTrackerDay) return "No live day selected";

    if (selectedTrackerExecutionScore < 50) {
      return "Daily log is incomplete";
    }

    if (primaryLimiter === "Digestion") {
      return "The athlete is doing the work, but digestion is capping output";
    }

    if (primaryLimiter === "Recovery" || primaryLimiter === "Sleep") {
      return "The athlete is doing the work, but recovery is behind the training demand";
    }

    if (primaryLimiter === "Fullness") {
      return "The athlete is executing well, but the look still needs more fuel / fullness";
    }

    if (primaryLimiter === "Dryness") {
      return "The athlete is executing well, but the look still needs to tighten up";
    }

    return "Execution and plan quality are mostly aligned";
  }, [selectedTrackerDay, selectedTrackerExecutionScore, primaryLimiter]);

  const supportStackSnapshot = useMemo(
    () =>
      buildSupportStackSnapshot({
        supplements,
        trainingDay,
        sleepHours,
        proteinSupportModel,
        hydrationSupportModel,
        recoveryPressureModel,
      }),
    [
      supplements,
      trainingDay,
      sleepHours,
      proteinSupportModel,
      hydrationSupportModel,
      recoveryPressureModel,
    ]
  );

  const compoundMonitoringSnapshot = useMemo(
    () =>
      buildCompoundMonitoringSnapshot({
        compounds: enabledCompounds,
        sleepHours,
        hydrationSupportModel,
        recoveryPressureModel,
      }),
    [enabledCompounds, sleepHours, hydrationSupportModel, recoveryPressureModel]
  );

  const adaptationSnapshot = useMemo(
    () =>
      buildAdaptationSnapshot({
        workoutSplit,
        trackerDays,
        exerciseLibrary,
        recoveryPressureModel,
      }),
    [workoutSplit, trackerDays, exerciseLibrary, recoveryPressureModel]
  );

  const conditioningSnapshot = useMemo(
    () =>
      buildConditioningSnapshot({
        trackerDays,
        selectedTrackerDay,
        selectedTrackerStepScore,
        phaseType,
        conditioningPriority,
        weeksOut,
        bodyWeightTrendModel,
        recoveryPressureModel,
        adaptationSnapshot,
      }),
    [
      trackerDays,
      selectedTrackerDay,
      selectedTrackerStepScore,
      phaseType,
      conditioningPriority,
      weeksOut,
      bodyWeightTrendModel,
      recoveryPressureModel,
      adaptationSnapshot,
    ]
  );

  const residualFatigueByDay = useMemo(() => {
    let carry = 0;
    const recoveryDrag = clamp(1 - recoveryHeadroom / 10, 0.18, 0.82);

    return workoutSplit.map((day) => {
      const exerciseLoad = day.exercises.reduce((sum, exercise) => {
        const lib = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
        const local = Number(lib?.fatigue ?? 5);
        const systemic = Number(lib?.systemicFatigue ?? 4);
        const rirFactor = exercise.rir <= 1 ? 1.12 : exercise.rir === 2 ? 1 : 0.9;
        return sum + exercise.sets * ((local * 0.42 + systemic * 0.58) * rirFactor);
      }, 0);

      const dayLoad = Number((exerciseLoad / 9 + day.systemicLoad * 1.9 + day.intensity * 0.75).toFixed(1));
      const recoveredCarry = carry * (0.42 + recoveryDrag * 0.28);
      carry = Number(clamp(recoveredCarry + dayLoad, 0, 100).toFixed(1));

      return {
        day: day.day,
        load: dayLoad,
        residual: carry,
      };
    });
  }, [workoutSplit, exerciseLibrary, recoveryHeadroom]);

  const lookStateLabel = useMemo(() => {
    if (conditionScore >= 8 && drynessScore >= 7) return "Sharp and on track";
    if (conditionScore >= 7) return "Solid condition trend";
    if (conditionScore >= 6) return "Good, but not peaked";
    return "Needs cleaner execution";
  }, [conditionScore, drynessScore]);

  const topCompoundSignals = useMemo(
    () => [
      { label: "Fullness", value: clamp(5 + compoundTotals.fullness * 0.22, 0, 10) },
      { label: "Dryness", value: clamp(5 + compoundTotals.dryness * 0.22, 0, 10) },
      { label: "Performance", value: clamp(5 + compoundTotals.performance * 0.2, 0, 10) },
      { label: "Stress", value: clamp(4 + compoundTotals.stress * 0.35, 0, 10) },
      { label: "Digestion", value: clamp(7 + compoundTotals.digestion * 0.35, 0, 10) },
    ],
    [compoundTotals]
  );


  const trainingSuggestion = useMemo(() => {
    if (adaptationSnapshot.primaryAction.code === "fix-delivery") return "Finish the planned sets before adding more.";
    if (adaptationSnapshot.primaryAction.code === "reduce-fatigue") return "Lower weekly fatigue before progressing.";
    if (adaptationSnapshot.primaryAction.code === "log-more") return "Log more sessions before changing the week.";
    if (recoveryHeadroom < 4.5) return "Lower systemic load before adding work.";
    if (primaryLimiter === "Fullness") return "Keep performance high and avoid adding random fatigue.";
    if (primaryLimiter === "Digestion") return "Choose easier-to-recover movements and keep sessions shorter.";
    if (splitStrengthBias >= 65) return "Bias the week toward heavier compounds and cleaner low-rep anchors.";
    if (splitHypertrophyBias >= 65) return "Bias the week toward higher-quality hypertrophy slots and longer muscle work.";
    if (splitVolumeBias >= 65) return "Bias the week toward more total work and extra priority-muscle volume.";
    if (splitRecoveryBias >= 65) return "Bias the week toward recoverable output and cleaner session pacing.";
    if (splitFrequencyBias >= 65) return "Spread the work more evenly so the week feels cleaner day to day.";
    if (splitIntensityBias >= 65) return "Bias the week toward higher-intensity days with less accessory noise.";
    return "Current split is workable. Clean up the selected day instead of rebuilding the whole week.";
  }, [adaptationSnapshot.primaryAction.code, recoveryHeadroom, primaryLimiter, splitStrengthBias, splitHypertrophyBias, splitVolumeBias, splitRecoveryBias, splitFrequencyBias, splitIntensityBias]);

  const dashboardActionStack = useMemo(() => {
    const base = userMode === "coach"
      ? [
          {
            label: "Review adherence",
            detail: `${trackerWeeklyReview.averageCompletion}% average completion across ${trackerWeeklyReview.loggedDays} logged days.`,
            tab: "tracker" as AppTab,
          },
          {
            label: "Adjust the weekly lever",
            detail: dashboardQueuedChanges[0] ?? coachRecommendation.action,
            tab: primaryLimiter === "Digestion" || primaryLimiter === "Fullness" ? "nutrition" as AppTab : primaryLimiter === "Dryness" ? "coach" as AppTab : "split" as AppTab,
          },
          {
            label: "Send athlete handoff",
            detail: coachInstruction,
            tab: "coach" as AppTab,
          },
        ]
      : selfManagedAthlete
        ? [
            {
              label: "Complete today first",
              detail: `${selectedTrackerExecutionScore}% execution today.`,
              tab: "tracker" as AppTab,
            },
            {
              label: "Edit food only if needed",
              detail: `${mealTotals.protein}P / ${mealTotals.carbs}C / ${mealTotals.fats}F mapped across ${meals.length} meals. Change it only when the day actually calls for it.`,
              tab: "nutrition" as AppTab,
            },
            {
              label: selfManagedAdaptivePlan.isBehind ? "Apply the adaptive correction" : "Tune the plan deliberately",
              detail: selfManagedAdaptivePlan.isBehind
                ? selfManagedAdaptivePlan.detail
                : primaryLimiter === "Digestion" || primaryLimiter === "Fullness" ? coachRecommendation.reason : trainingSuggestion,
              tab: selfManagedAdaptivePlan.isBehind
                ? "dashboard" as AppTab
                : primaryLimiter === "Digestion" || primaryLimiter === "Fullness" ? "nutrition" as AppTab : "split" as AppTab,
            },
          ]
        : [
            {
              label: "Complete today's session",
              detail: `${selectedTrackerExecutionScore}% execution today.`,
              tab: "tracker" as AppTab,
            },
            {
              label: "Hit the nutrition plan",
              detail: `${mealTotals.protein}P / ${mealTotals.carbs}C / ${mealTotals.fats}F currently mapped across ${meals.length} meals.`,
              tab: "nutrition" as AppTab,
            },
            {
              label: "Know today's focus",
              detail: coachRecommendation.reason,
              tab: "dashboard" as AppTab,
            },
          ];

    return base;
  }, [
    userMode,
    trackerWeeklyReview,
    dashboardQueuedChanges,
    coachRecommendation.action,
    coachInstruction,
    selectedTrackerMissedLifts,
    selectedTrackerExecutionScore,
    mealTotals.protein,
    mealTotals.carbs,
    mealTotals.fats,
    meals.length,
    coachRecommendation.reason,
    primaryLimiter,
    selfManagedAthlete,
    trainingSuggestion,
    selfManagedAdaptivePlan.detail,
    selfManagedAdaptivePlan.isBehind,
  ]);

  const dashboardCoreMetrics = useMemo(() => {
    return [
      { label: "Condition", value: Number(conditionScore.toFixed(1)), helper: lookStateLabel },
      { label: "Execution", value: selectedTrackerExecutionScore, helper: "Daily execution" },
      { label: "Recovery", value: Number(recoveryScore.toFixed(1)), helper: `${sleepHours.toFixed(1)}h sleep, quality ${sleepQuality}/10` },
      { label: "Limiter", value: primaryLimiter, helper: coachRecommendation.action },
    ];
  }, [conditionScore, lookStateLabel, selectedTrackerExecutionScore, selectedTrackerMissedLifts, recoveryScore, sleepHours, sleepQuality, primaryLimiter, coachRecommendation.action]);

  const todayFuelSummary = useMemo(
    () => ({
      caloriesConsumed: consumedCalories,
      calorieTarget: macroCalories,
      calorieRemaining: macroCalories - consumedCalories,
      proteinConsumed: loggedMacroTotals.protein,
      proteinTarget,
      carbsConsumed: loggedMacroTotals.carbs,
      carbTarget,
      fatsConsumed: loggedMacroTotals.fats,
      fatTarget,
      mealsLogged: totalLoggedMeals,
      foodEntriesLogged: totalLoggedFoodEntries,
    }),
    [
      consumedCalories,
      macroCalories,
      loggedMacroTotals.protein,
      proteinTarget,
      loggedMacroTotals.carbs,
      carbTarget,
      loggedMacroTotals.fats,
      fatTarget,
      totalLoggedMeals,
      totalLoggedFoodEntries,
    ]
  );

  const dashboardChangeSummary = useMemo(() => {
    if (changeLog.length === 0) {
      return "No recent changes logged yet.";
    }

    const recent = changeLog.slice(0, 3);
    const text = recent.map((entry) => `${entry.date}: ${entry.title}`).join(". ");
    return text;
  }, [changeLog]);

  const selectedTrackerMissingFields = useMemo(() => {
    if (!selectedTrackerDay) {
      return [] as string[];
    }

    const fields: string[] = [];
    if (!selectedTrackerDay.bodyWeight?.trim()) fields.push("bodyweight");
    if (!selectedTrackerDay.steps?.trim()) fields.push("steps");
    if (!selectedTrackerDay.energy?.trim()) fields.push("energy");
    return fields;
  }, [selectedTrackerDay]);

  const decisionConfidenceModel = useMemo(
    () =>
      buildDecisionConfidenceModel({
        bodyWeightSamples: bodyWeightTrendModel.sampleCount,
        bodyWeightDaySpan: bodyWeightTrendModel.daySpan,
        trackerLoggedDays: trackerWeeklyReview.loggedDays,
        trackerAverageCompletion: trackerWeeklyReview.averageCompletion,
        missingFieldsCount: selectedTrackerMissingFields.length,
        complianceScore: complianceConfidence.score,
      }),
    [
      bodyWeightTrendModel.sampleCount,
      bodyWeightTrendModel.daySpan,
      trackerWeeklyReview.loggedDays,
      trackerWeeklyReview.averageCompletion,
      selectedTrackerMissingFields.length,
      complianceConfidence.score,
    ]
  );

  const monitoringSnapshot = useMemo(
    () =>
      buildMonitoringSnapshot({
        trainingDay,
        primaryLimiter,
        weeksOut,
        sleepHours,
        sleepQuality,
        weeklyDensityScore,
        selectedTrackerExecutionScore,
        selectedTrackerMissingFieldsCount: selectedTrackerMissingFields.length,
        selectedTrackerStepScore,
        complianceScore: complianceConfidence.score,
        splitAnchorCount: splitScientificSummary.anchorCount,
        splitHighRecoveryCount: splitScientificSummary.highRecoveryCount,
        lowerBodyAnchorCount: splitScientificSummary.lowerBodyAnchorCount,
        lowerBodyHighRecoveryCount: splitScientificSummary.lowerBodyHighRecoveryCount,
        checkIns,
        bodyWeightTrendModel,
        recoveryPressureModel,
        hydrationSupportModel,
        fuelTimingModel,
        mealPlanScienceProfile,
        decisionConfidenceModel,
      }),
    [
      trainingDay,
      primaryLimiter,
      weeksOut,
      sleepHours,
      sleepQuality,
      weeklyDensityScore,
      selectedTrackerExecutionScore,
      selectedTrackerMissingFields.length,
      selectedTrackerStepScore,
      complianceConfidence.score,
      splitScientificSummary.anchorCount,
      splitScientificSummary.highRecoveryCount,
      splitScientificSummary.lowerBodyAnchorCount,
      splitScientificSummary.lowerBodyHighRecoveryCount,
      checkIns,
      bodyWeightTrendModel,
      recoveryPressureModel,
      hydrationSupportModel,
      fuelTimingModel,
      mealPlanScienceProfile,
      decisionConfidenceModel,
    ]
  );

  const performanceInsightSnapshot = useMemo(
    () =>
      buildPerformanceInsightSnapshot({
        trainingDay,
        weeksOut,
        weeklyDensityScore,
        primaryLimiter,
        sleepHours,
        sleepQuality,
        selectedTrackerExecutionScore,
        selectedTrackerMissedLifts,
        selectedTrackerStepScore,
        selectedTrackerMissingFieldsCount: selectedTrackerMissingFields.length,
        complianceScore: complianceConfidence.score,
        enabledCompoundCount: enabledCompounds.length,
        bodyWeightTrendModel,
        dietPressureModel,
        recoveryPressureModel,
        fuelTimingModel,
        hydrationSupportModel,
        mealPlanScienceProfile,
        decisionConfidenceModel,
        adaptationSnapshot,
        compoundMonitoringFlags: compoundMonitoringSnapshot.flags,
      }),
    [
      trainingDay,
      weeksOut,
      weeklyDensityScore,
      primaryLimiter,
      sleepHours,
      sleepQuality,
      selectedTrackerExecutionScore,
      selectedTrackerMissedLifts,
      selectedTrackerStepScore,
      selectedTrackerMissingFields.length,
      complianceConfidence.score,
      enabledCompounds.length,
      bodyWeightTrendModel,
      dietPressureModel,
      recoveryPressureModel,
      fuelTimingModel,
      hydrationSupportModel,
      mealPlanScienceProfile,
      decisionConfidenceModel,
      adaptationSnapshot,
      compoundMonitoringSnapshot.flags,
    ]
  );

  const openTrackerTaskCount = useMemo(
    () => trackerTasks.filter((task) => !task.done).length,
    [trackerTasks]
  );
  const openTrackerTasks = useMemo(
    () => trackerTasks.filter((task) => !task.done).slice(0, 6),
    [trackerTasks]
  );

  const workflowChangeDigest = useMemo<ChangeDigestItem[]>(() => {
    const hiddenCoachActions = [
      "copied athlete handoff",
      "exported coach report",
      "snapshot",
    ];

    return changeLog
      .filter((entry) => !hiddenCoachActions.some((phrase) => entry.title.toLowerCase().includes(phrase)))
      .slice(0, 5)
      .map((entry) => ({
        id: entry.id,
        date: entry.date,
        category: entry.category,
        title: entry.title,
        detail: entry.detail,
        impact: entry.impact,
      }));
  }, [changeLog]);

  const latestCoachUpdate = useMemo<ChangeDigestItem>(() => {
    const publishedDecision = workflowChangeDigest.find(
      (entry) => entry.category === "Coach" && entry.title.toLowerCase().includes("published decision")
    );

    if (publishedDecision) {
      return publishedDecision;
    }

    return {
      id: "current-coach-direction",
      date: workflowChangeDigest[0]?.date ?? new Date().toISOString().slice(0, 10),
      category: "Coach",
      title: "Current coaching direction",
      detail: coachInstruction,
      impact: coachRecommendation.reason,
    };
  }, [workflowChangeDigest, coachInstruction, coachRecommendation.reason]);

  const publishedDecisionHistory = useMemo(() => {
    return [...publishedCoachDecisions]
      .filter((decision) => decision.athleteId === activeAthlete.id)
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  }, [publishedCoachDecisions, activeAthlete.id]);

  const latestPublishedDecision = useMemo(
    () => publishedDecisionHistory[0] ?? null,
    [publishedDecisionHistory]
  );
  const publishedPlanDiffs = useMemo<PlanChangeDiffItem[]>(() => {
    if (!latestPublishedDecision) return [];

    const previousDecision = publishedDecisionHistory[1] ?? null;
    const diffs: PlanChangeDiffItem[] = [];

    if (!previousDecision || previousDecision.title !== latestPublishedDecision.title) {
      diffs.push({
        id: "direction",
        label: "Direction",
        title: latestPublishedDecision.title,
        detail: previousDecision
          ? `Previous call: ${previousDecision.title}.`
          : latestPublishedDecision.reason,
        tone: "sky",
      });
    }

    latestPublishedDecision.queuedChanges.slice(0, 3).forEach((line, index) => {
      diffs.push({
        id: `queued-${index}`,
        label: inferPlanChangeLabel(line),
        title: line,
        detail: "Included in the athlete-facing publish package.",
        tone: inferPlanChangeTone(line),
      });
    });

    if (!previousDecision || previousDecision.nextAction !== latestPublishedDecision.nextAction) {
      diffs.push({
        id: "next-action",
        label: "Next action",
        title: latestPublishedDecision.nextAction,
        detail: previousDecision
          ? `Previous next action: ${previousDecision.nextAction}.`
          : "This is the first action the athlete should take after reading the update.",
        tone: "emerald",
      });
    }

    if (
      !previousDecision ||
      previousDecision.decisionConfidenceScore !== latestPublishedDecision.decisionConfidenceScore ||
      previousDecision.complianceScore !== latestPublishedDecision.complianceScore ||
      previousDecision.completionScore !== latestPublishedDecision.completionScore
    ) {
      const confidenceDelta = previousDecision
        ? latestPublishedDecision.decisionConfidenceScore - previousDecision.decisionConfidenceScore
        : 0;
      const confidenceDetail = previousDecision
        ? `${confidenceDelta >= 0 ? "+" : ""}${confidenceDelta} confidence vs last package. ${latestPublishedDecision.completionScore}% completion, ${latestPublishedDecision.complianceScore}/100 compliance.`
        : `${latestPublishedDecision.completionScore}% completion, ${latestPublishedDecision.complianceScore}/100 compliance.`;

      diffs.push({
        id: "signal",
        label: "Signal",
        title: `${latestPublishedDecision.decisionConfidenceScore} / 100 confidence`,
        detail: confidenceDetail,
        tone:
          latestPublishedDecision.decisionConfidenceScore >= 75
            ? "emerald"
            : latestPublishedDecision.decisionConfidenceScore >= 55
              ? "amber"
              : "rose",
      });
    }

    if (diffs.length === 0) {
      diffs.push({
        id: "hold",
        label: "Hold",
        title: "No material plan change",
        detail: "The latest package keeps direction stable and confirms the current execution focus.",
        tone: "slate",
      });
    }

    return diffs.slice(0, 5);
  }, [latestPublishedDecision, publishedDecisionHistory]);

  const todayCompletionItems = useMemo<TodayCompletionItem[]>(() => {
    const stepsTarget = activeStepTarget;
    const stepsLogged = selectedTrackerMissingFields.includes("steps") ? 0 : selectedTrackerStepScore;
    const stepsRemaining = Math.max(0, stepsTarget - stepsLogged);
    const caloriesRemaining = Math.max(0, todayFuelSummary.calorieRemaining);
    const proteinRemaining = Math.max(0, proteinTarget - todayFuelSummary.proteinConsumed);
    const foodDone = todayFuelSummary.foodEntriesLogged > 0 && caloriesRemaining <= 250 && proteinRemaining <= 25;
    const basicsDone = selectedTrackerMissingFields.length === 0;
    const trainingDone = selectedTrackerMissedLifts === 0;
    const supportDone = openTrackerTaskCount === 0;
    const directionDone = !latestPublishedDecision || latestPublishedDecision.status === "acknowledged";
    const closeoutDone = selectedTrackerDay?.closeoutStatus === "closed";

    const items: TodayCompletionItem[] = [
      {
        label: "Food",
        title: foodDone ? "Food is close enough" : `${caloriesRemaining} kcal left`,
        detail: foodDone
          ? `${todayFuelSummary.foodEntriesLogged} foods logged. Review only if intake changes.`
          : `${proteinRemaining}g protein still open. Add the next real food.`,
        cta: foodDone ? "Review" : "Add Food",
        tab: "nutrition",
        tone: foodDone ? "emerald" : "amber",
        done: foodDone,
      },
      {
        label: "Steps",
        title: stepsLogged > 0 ? `${stepsLogged.toLocaleString()} logged` : "Log steps",
        detail:
          stepsLogged > 0
            ? stepsRemaining > 0
              ? `${stepsRemaining.toLocaleString()} steps remain to target.`
              : "Step target is covered for the day."
            : `Target is ${stepsTarget.toLocaleString()} steps.`,
        cta: stepsLogged > 0 ? "Update" : "Log steps",
        tab: "tracker",
        tone: stepsLogged > 0 && stepsRemaining <= 0 ? "emerald" : "sky",
        done: stepsLogged > 0 && stepsRemaining <= 0,
      },
      {
        label: "Basics",
        title: basicsDone ? "Basics logged" : `Log ${selectedTrackerMissingFields.join(", ")}`,
        detail: basicsDone
          ? "Bodyweight, steps, and energy are saved."
          : "Close the simple fields so coaching uses real signal.",
        cta: basicsDone ? "Open" : "Finish",
        tab: "tracker",
        tone: basicsDone ? "emerald" : "amber",
        done: basicsDone,
      },
      {
        label: "Training",
        title: trainingDone ? "Session logged" : `${selectedTrackerMissedLifts} lifts open`,
        detail: trainingDone
          ? "All planned lifts are marked complete."
          : "Finish the open lift logs before changing the plan.",
        cta: trainingDone ? "Review" : "Log lifts",
        tab: "tracker",
        tone: trainingDone ? "emerald" : "amber",
        done: trainingDone,
      },
      ...(!selfManagedAthlete ? [{
        label: "Direction",
        title: directionDone ? "Direction synced" : "Acknowledge update",
        detail: directionDone
          ? "Coach and athlete are aligned on the current call."
          : "Confirm the latest published direction so the handoff is not floating.",
        cta: directionDone ? "Open" : "Acknowledge",
        tab: "dashboard",
        tone: directionDone ? "emerald" : "sky",
        done: directionDone,
      } satisfies TodayCompletionItem] : []),
      {
        label: "Closeout",
        title: closeoutDone ? "Day closed" : supportDone ? "Finish day" : `${openTrackerTaskCount} tasks open`,
        detail: closeoutDone
          ? "The daily closeout is saved."
          : supportDone
            ? "Save the closeout once food, basics, and training are real."
            : "Clear the open support items or leave them visible for review.",
        cta: closeoutDone ? "Open" : "Close",
        tab: "tracker",
        tone: closeoutDone ? "emerald" : supportDone ? "sky" : "amber",
        done: closeoutDone,
      },
    ];

    return items.sort((left, right) => Number(left.done) - Number(right.done));
  }, [
    activeStepTarget,
    selfManagedAthlete,
    latestPublishedDecision,
    openTrackerTaskCount,
    proteinTarget,
    selectedTrackerDay?.closeoutStatus,
    selectedTrackerMissingFields,
    selectedTrackerMissedLifts,
    selectedTrackerStepScore,
    todayFuelSummary,
  ]);

  const checkInReviewSnapshot = useMemo(
    () =>
      buildCheckInReviewSnapshot({
        checkIns,
        checkInCadence,
        todayIso,
        bodyWeight,
        conditionScore,
        recoveryScore,
        trainingScore,
        lookStateLabel,
        primaryLimiter,
      }),
    [
      checkIns,
      checkInCadence,
      todayIso,
      bodyWeight,
      conditionScore,
      recoveryScore,
      trainingScore,
      lookStateLabel,
      primaryLimiter,
    ]
  );

  const checkInVisualReview = useMemo(
    () => buildCheckInVisualReview(checkIns),
    [checkIns]
  );

  const decisionSignalGate = useMemo<DecisionSignalGate>(() => {
    const missing: DecisionSignalGateItem[] = [];
    const addMissing = (item: DecisionSignalGateItem) => {
      missing.push(item);
    };

    const caloriesRemaining = Math.max(0, todayFuelSummary.calorieRemaining);
    const proteinRemaining = Math.max(0, todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed);
    const foodLogged = todayFuelSummary.foodEntriesLogged > 0;
    const foodCloseEnough = foodLogged && caloriesRemaining <= 250 && proteinRemaining <= 25;
    const basicsDone = selectedTrackerMissingFields.length === 0;
    const hasSelectedDay = Boolean(selectedTrackerDay);
    const hasPlannedLifts = (selectedTrackerDay?.lifts.length ?? 0) > 0;
    const trainingDone = hasSelectedDay && (!hasPlannedLifts || selectedTrackerMissedLifts === 0);
    const checkInDone = checkInReviewSnapshot.status !== "due";
    const closeoutDone = selectedTrackerDay?.closeoutStatus === "closed";
    const directionDone =
      selfManagedAthlete ||
      !latestPublishedDecision ||
      latestPublishedDecision.status === "acknowledged";

    if (!hasSelectedDay) {
      addMissing({
        id: "tracker-day",
        label: "Today",
        title: "Pick the live tracker day",
        detail: "The decision layer needs one live day before it can tell what actually happened.",
        actionLabel: "Open Today",
        tab: "tracker",
        tone: "rose",
        blocking: true,
      });
    }

    if (!foodLogged) {
      addMissing({
        id: "food-start",
        label: "Food",
        title: "Log the first food",
        detail: "No food is logged today, so macro compliance, fullness, digestion, and calorie changes are still guesswork.",
        actionLabel: "Add Food",
        tab: "nutrition",
        tone: "rose",
        blocking: true,
      });
    } else if (!foodCloseEnough) {
      addMissing({
        id: "food-close",
        label: "Food",
        title: "Close the food gap",
        detail: `${caloriesRemaining} kcal and ${proteinRemaining}g protein are still open. Finish the food signal before changing targets.`,
        actionLabel: "Review Food",
        tab: "nutrition",
        tone: "amber",
        blocking: false,
      });
    }

    if (!basicsDone) {
      addMissing({
        id: "basics",
        label: "Basics",
        title: `Log ${selectedTrackerMissingFields.join(", ")}`,
        detail: "Bodyweight, steps, and energy are the minimum evidence needed before the app should make a confident call.",
        actionLabel: "Log Basics",
        tab: "tracker",
        tone: "amber",
        blocking: true,
      });
    }

    if (hasPlannedLifts && selectedTrackerMissedLifts > 0) {
      addMissing({
        id: "training",
        label: "Training",
        title: `Finish ${selectedTrackerMissedLifts} open lift${selectedTrackerMissedLifts === 1 ? "" : "s"}`,
        detail: "Training recommendations are not trustworthy until planned work is logged against what actually happened.",
        actionLabel: "Log Lifts",
        tab: "tracker",
        tone: selectedTrackerMissedLifts >= 3 ? "rose" : "amber",
        blocking: true,
      });
    }

    if (!checkInDone) {
      addMissing({
        id: "check-in",
        label: "Check-in",
        title: checkInReviewSnapshot.title,
        detail: "The current visual and recovery read is due. Do not publish a strong plan change from stale check-in evidence.",
        actionLabel: "Add Check-in",
        tab: "dashboard",
        tone: "amber",
        blocking: true,
      });
    }

    if (!closeoutDone) {
      addMissing({
        id: "closeout",
        label: "Closeout",
        title: "Finish the daily closeout",
        detail: "The day has not been closed, so the app should treat the read as provisional instead of final.",
        actionLabel: "Close Day",
        tab: "tracker",
        tone: "amber",
        blocking: true,
      });
    }

    if (!directionDone) {
      addMissing({
        id: "direction",
        label: "Direction",
        title: "Acknowledge the latest update",
        detail: "Coach and athlete are not synced on the current direction yet. Confirm receipt before stacking another decision.",
        actionLabel: "Acknowledge",
        tab: "dashboard",
        tone: "sky",
        blocking: true,
      });
    }

    if (openTrackerTaskCount > 0) {
      addMissing({
        id: "support",
        label: "Support",
        title: `${openTrackerTaskCount} support item${openTrackerTaskCount === 1 ? "" : "s"} open`,
        detail: "This does not block the day, but it should stay visible before the coach sends a package.",
        actionLabel: "Review Tasks",
        tab: "tracker",
        tone: "slate",
        blocking: false,
      });
    }

    const checkInScore =
      checkInReviewSnapshot.status === "on-track"
        ? 100
        : checkInReviewSnapshot.status === "soon"
          ? 68
          : 0;
    const checks = [
      {
        id: "food",
        label: "Food",
        score: foodCloseEnough ? 100 : foodLogged ? 62 : 0,
        status: foodCloseEnough ? "ready" as const : "needs-work" as const,
        title: foodCloseEnough ? "Food is readable" : foodLogged ? "Food is started" : "Food missing",
        detail: foodCloseEnough
          ? `${todayFuelSummary.foodEntriesLogged} foods logged and close enough to target.`
          : foodLogged
            ? `${caloriesRemaining} kcal and ${proteinRemaining}g protein still open.`
            : "No foods logged today.",
        tone: foodCloseEnough ? "emerald" as const : foodLogged ? "amber" as const : "rose" as const,
      },
      {
        id: "training",
        label: "Training",
        score: trainingDone ? 100 : Math.max(0, Math.min(100, selectedTrackerExecutionScore)),
        status: trainingDone ? "ready" as const : "needs-work" as const,
        title: trainingDone ? "Training readable" : "Training incomplete",
        detail: hasPlannedLifts
          ? `${selectedTrackerMissedLifts} lift${selectedTrackerMissedLifts === 1 ? "" : "s"} still open.`
          : hasSelectedDay
            ? "No planned lifts are blocking this day."
            : "No live day selected.",
        tone: trainingDone ? "emerald" as const : selectedTrackerMissedLifts >= 3 ? "rose" as const : "amber" as const,
      },
      {
        id: "basics",
        label: "Basics",
        score: basicsDone ? 100 : Math.max(0, 100 - selectedTrackerMissingFields.length * 34),
        status: basicsDone ? "ready" as const : "needs-work" as const,
        title: basicsDone ? "Basics saved" : "Basics missing",
        detail: basicsDone ? "Bodyweight, steps, and energy are logged." : selectedTrackerMissingFields.join(", "),
        tone: basicsDone ? "emerald" as const : "amber" as const,
      },
      {
        id: "check-in",
        label: "Check-in",
        score: checkInScore,
        status: checkInDone ? "ready" as const : "needs-work" as const,
        title: checkInReviewSnapshot.title,
        detail: checkInReviewSnapshot.detail,
        tone: checkInReviewSnapshot.status === "on-track" ? "emerald" as const : checkInReviewSnapshot.status === "soon" ? "sky" as const : "amber" as const,
      },
      {
        id: "closeout",
        label: "Closeout",
        score: closeoutDone ? 100 : 0,
        status: closeoutDone ? "ready" as const : "needs-work" as const,
        title: closeoutDone ? "Day closed" : "Closeout open",
        detail: closeoutDone ? "The day has a saved closeout." : "Finish the day before treating the read as final.",
        tone: closeoutDone ? "emerald" as const : "amber" as const,
      },
      {
        id: "direction",
        label: "Direction",
        score: directionDone ? 100 : 45,
        status: directionDone ? "ready" as const : "needs-work" as const,
        title: directionDone ? "Direction synced" : "Receipt needed",
        detail: directionDone ? "No athlete receipt is blocking the next read." : "The latest published update still needs acknowledgement.",
        tone: directionDone ? "emerald" as const : "sky" as const,
      },
    ];

    const score = clamp(
      Math.round(
        checks[0].score * 0.2 +
          checks[1].score * 0.22 +
          checks[2].score * 0.16 +
          checks[3].score * 0.16 +
          checks[4].score * 0.16 +
          checks[5].score * 0.1
      ),
      0,
      100
    );
    const blockingMissing = missing.filter((item) => item.blocking);
    const status =
      blockingMissing.length > 0
        ? "blocked"
        : missing.length > 0 || score < 78
          ? "caution"
          : "ready";
    const primaryGap = missing[0] ?? null;
    const title =
      status === "ready"
        ? "Signal ready for one clean decision"
        : status === "blocked"
          ? "Decision blocked until signal is real"
          : "Decision usable, but keep it conservative";
    const detail =
      status === "ready"
        ? "Food, training, basics, check-in, closeout, and direction are aligned enough to make one clear call."
        : primaryGap
          ? `${primaryGap.title}. ${primaryGap.detail}`
          : "The score is usable, but the app should still avoid aggressive edits until the read improves.";

    return {
      status,
      score,
      title,
      detail,
      tone: status === "ready" ? "emerald" : status === "blocked" ? "rose" : "amber",
      primaryActionLabel: primaryGap?.actionLabel ?? "Review signal",
      primaryTab: primaryGap?.tab ?? "coach",
      missing,
      checks,
    };
  }, [
    checkInReviewSnapshot.detail,
    checkInReviewSnapshot.status,
    checkInReviewSnapshot.title,
    latestPublishedDecision,
    openTrackerTaskCount,
    selectedTrackerDay,
    selectedTrackerExecutionScore,
    selectedTrackerMissingFields,
    selectedTrackerMissedLifts,
    selfManagedAthlete,
    todayFuelSummary,
  ]);

  const decisionBrief = useMemo<DecisionBrief>(() => {
    const primaryGap = decisionSignalGate.missing[0] ?? null;
    const caloriesRemaining = Math.max(0, todayFuelSummary.calorieRemaining);
    const proteinRemaining = Math.max(0, todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed);
    const foodReadable =
      todayFuelSummary.foodEntriesLogged > 0 &&
      caloriesRemaining <= 250 &&
      proteinRemaining <= 25;
    const executionTone: DecisionBrief["tone"] =
      selectedTrackerExecutionScore >= 85
        ? "emerald"
        : selectedTrackerExecutionScore >= 60
          ? "amber"
          : "rose";
    const foodTone: DecisionBrief["tone"] =
      foodReadable
        ? "emerald"
        : todayFuelSummary.foodEntriesLogged > 0
          ? "amber"
          : "rose";
    const title =
      decisionSignalGate.status === "blocked"
        ? primaryGap?.title ?? decisionSignalGate.title
        : coachRecommendation.action;
    const detail =
      decisionSignalGate.status === "blocked"
        ? primaryGap?.detail ?? decisionSignalGate.detail
        : decisionSignalGate.status === "caution"
          ? `${coachRecommendation.reason} Keep this conservative because ${decisionSignalGate.detail.toLowerCase()}`
          : coachRecommendation.reason;
    const primaryActionLabel =
      decisionSignalGate.status === "blocked"
        ? decisionSignalGate.primaryActionLabel
        : userMode === "coach"
          ? "Review & Publish"
          : "Open Today";
    const primaryTab =
      decisionSignalGate.status === "blocked"
        ? decisionSignalGate.primaryTab
        : userMode === "coach"
          ? "coach"
          : "tracker";
    const items: DecisionBrief["items"] = [
      {
        id: "signal",
        label: "Signal",
        title: `${decisionSignalGate.score}% ${decisionSignalGate.status}`,
        detail: decisionSignalGate.title,
        actionLabel: decisionSignalGate.primaryActionLabel,
        tab: decisionSignalGate.primaryTab,
        tone: decisionSignalGate.tone,
      },
      {
        id: "execution",
        label: "Execution",
        title: `${selectedTrackerExecutionScore}% today`,
        detail:
          selectedTrackerMissedLifts > 0
            ? `${selectedTrackerMissedLifts} lift${selectedTrackerMissedLifts === 1 ? "" : "s"} still open before the training read is clean.`
            : "Training is not the blocker right now.",
        actionLabel: selectedTrackerMissedLifts > 0 ? "Log Lifts" : "Review Today",
        tab: "tracker",
        tone: executionTone,
      },
      {
        id: "fuel",
        label: "Fuel",
        title: foodReadable
          ? "Food readable"
          : todayFuelSummary.foodEntriesLogged > 0
            ? "Food gap open"
            : "Food missing",
        detail: foodReadable
          ? `${todayFuelSummary.foodEntriesLogged} foods logged close enough to target.`
          : todayFuelSummary.foodEntriesLogged > 0
            ? `${caloriesRemaining} kcal and ${proteinRemaining}g protein still need review.`
            : "Log food before interpreting fullness, digestion, or target changes.",
        actionLabel: foodReadable ? "Review Food" : "Add Food",
        tab: "nutrition",
        tone: foodTone,
      },
    ];

    return {
      eyebrow:
        decisionSignalGate.status === "ready"
          ? "One clean decision"
          : decisionSignalGate.status === "blocked"
            ? "Fix signal first"
            : "Conservative decision",
      title,
      detail,
      tone: decisionSignalGate.tone,
      scoreLabel: `${decisionSignalGate.score}% signal`,
      sourceLabel: `Limiter: ${primaryLimiter}`,
      primaryActionLabel,
      primaryTab,
      items,
    };
  }, [
    coachRecommendation.action,
    coachRecommendation.reason,
    decisionSignalGate,
    primaryLimiter,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    todayFuelSummary,
    userMode,
  ]);

  const momentumSignals = useMemo<MomentumSignalItem[]>(() => {
    const recentTrackerDays = [...trackerDays]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 7);
    const recentWorkingDays = recentTrackerDays.filter((day) => day.lifts.length > 0);
    const trainingStatuses = recentWorkingDays.map((day) =>
      day.lifts.every((lift) => lift.completed)
    );
    const closeoutStatuses = recentTrackerDays.map((day) => day.closeoutStatus === "closed");
    const basicsStatuses = recentTrackerDays.map((day) =>
      Boolean(day.bodyWeight.trim() && day.steps.trim() && day.energy.trim())
    );
    const trainingWins = trainingStatuses.filter(Boolean).length;
    const closeoutWins = closeoutStatuses.filter(Boolean).length;
    const basicsWins = basicsStatuses.filter(Boolean).length;
    const trainingScore = recentWorkingDays.length > 0
      ? Math.round((trainingWins / recentWorkingDays.length) * 100)
      : 100;
    const closeoutScore = recentTrackerDays.length > 0
      ? Math.round((closeoutWins / recentTrackerDays.length) * 100)
      : 0;
    const basicsScore = recentTrackerDays.length > 0
      ? Math.round((basicsWins / recentTrackerDays.length) * 100)
      : 0;
    const caloriesRemaining = Math.max(0, todayFuelSummary.calorieRemaining);
    const proteinRemaining = Math.max(0, proteinTarget - todayFuelSummary.proteinConsumed);
    const foodComplete =
      todayFuelSummary.foodEntriesLogged > 0 &&
      caloriesRemaining <= 250 &&
      proteinRemaining <= 25;
    const recentFoodWindowDates = Array.from({ length: 7 }, (_, index) =>
      toIsoDate(addDays(parseIsoDate(todayIso), -index))
    );
    const foodHistoryByDate = new Map(foodDayHistory.map((item) => [item.date, item]));
    const foodDayStatuses = recentFoodWindowDates
      .map((date) => {
        if (date === todayIso && todayFuelSummary.foodEntriesLogged > 0) {
          return {
            date,
            calories: todayFuelSummary.caloriesConsumed,
            protein: todayFuelSummary.proteinConsumed,
            foodEntries: todayFuelSummary.foodEntriesLogged,
            targetCalories: todayFuelSummary.calorieTarget,
            targetProtein: todayFuelSummary.proteinTarget,
          };
        }

        const snapshot = foodHistoryByDate.get(date);
        if (!snapshot || snapshot.foodEntries <= 0) return null;

        return {
          date: snapshot.date,
          calories: snapshot.calories,
          protein: snapshot.protein,
          foodEntries: snapshot.foodEntries,
          targetCalories: snapshot.targetCalories || macroCalories,
          targetProtein: snapshot.targetProtein || proteinTarget,
        };
      })
      .filter((item): item is {
        date: string;
        calories: number;
        protein: number;
        foodEntries: number;
        targetCalories: number;
        targetProtein: number;
      } => Boolean(item));
    const foodLoggedDays = foodDayStatuses.length;
    const foodAdherentDays = foodDayStatuses.filter((day) =>
      day.foodEntries > 0 &&
      Math.max(0, day.targetCalories - day.calories) <= 250 &&
      Math.max(0, day.targetProtein - day.protein) <= 25
    ).length;
    const foodScore =
      foodLoggedDays >= 2
        ? Math.round((foodAdherentDays / recentFoodWindowDates.length) * 100)
        : foodComplete ? 100 : todayFuelSummary.foodEntriesLogged > 0 ? 62 : 18;
    const checkInScore =
      checkInReviewSnapshot.status === "on-track"
        ? 100
        : checkInReviewSnapshot.status === "soon"
          ? 68
          : 28;
    const trainingStreak = countLeadingWins(trainingStatuses);
    const closeoutStreak = countLeadingWins(closeoutStatuses);

    return [
      {
        id: "food",
        label: "Food",
        title: foodLoggedDays >= 2
          ? `${foodAdherentDays}/${recentFoodWindowDates.length} food days on target`
          : foodComplete
          ? "Food signal is clean today"
          : todayFuelSummary.foodEntriesLogged > 0
            ? "Food day is started"
            : "Start the food signal",
        detail: foodLoggedDays >= 2
          ? `${foodLoggedDays} food day${foodLoggedDays === 1 ? "" : "s"} logged in the last week. Copy a clean day instead of rebuilding from zero.`
          : foodComplete
          ? `${todayFuelSummary.foodEntriesLogged} foods logged and macros are close enough.`
          : todayFuelSummary.foodEntriesLogged > 0
            ? `${caloriesRemaining} kcal and ${proteinRemaining}g protein remain. Finish the next real entry.`
            : "Log one food to restart momentum. Saved food days will carry this into the weekly signal.",
        score: foodScore,
        tone: momentumTone(foodScore),
        actionLabel: foodComplete ? "Review food" : "Add food",
        tab: "nutrition",
      },
      {
        id: "training",
        label: "Training",
        title: trainingStreak > 0 ? `${trainingStreak} working day run` : "Training can recover today",
        detail:
          recentWorkingDays.length === 0
            ? "No working days are in the current tracker window."
            : `${trainingWins}/${recentWorkingDays.length} recent working days are fully logged.`,
        score: trainingScore,
        tone: momentumTone(trainingScore),
        actionLabel: selectedTrackerMissedLifts > 0 ? "Log lifts" : "Review training",
        tab: "tracker",
      },
      {
        id: "closeout",
        label: "Closeout",
        title: closeoutStreak > 0 ? `${closeoutStreak} day closeout run` : "Close today to restart",
        detail: `${closeoutWins}/${recentTrackerDays.length || 1} recent days have a saved closeout.`,
        score: closeoutScore,
        tone: momentumTone(closeoutScore),
        actionLabel: selectedTrackerDay?.closeoutStatus === "closed" ? "Open closeout" : "Finish day",
        tab: "tracker",
      },
      {
        id: "check-in",
        label: "Check-in",
        title:
          checkInReviewSnapshot.status === "on-track"
            ? "Check-in cadence is clean"
            : checkInReviewSnapshot.title,
        detail:
          checkIns.length > 0
            ? `${checkIns.length} check-ins stored. ${checkInReviewSnapshot.detail}`
            : "Log the first check-in so momentum has a real visual baseline.",
        score: checkInScore,
        tone: momentumTone(checkInScore),
        actionLabel: checkInReviewSnapshot.status === "on-track" ? "Review check-ins" : "Add check-in",
        tab: "dashboard",
      },
      {
        id: "basics",
        label: "Basics",
        title: basicsWins >= 5 ? "Basics are dependable" : "Simple fields need rhythm",
        detail: `${basicsWins}/${recentTrackerDays.length || 1} recent days have bodyweight, steps, and energy.`,
        score: basicsScore,
        tone: momentumTone(basicsScore),
        actionLabel: selectedTrackerMissingFields.length > 0 ? "Log basics" : "Review today",
        tab: "tracker",
      },
    ];
  }, [
    checkInReviewSnapshot.detail,
    checkInReviewSnapshot.status,
    checkInReviewSnapshot.title,
    checkIns.length,
    foodDayHistory,
    macroCalories,
    proteinTarget,
    selectedTrackerDay?.closeoutStatus,
    selectedTrackerMissedLifts,
    selectedTrackerMissingFields.length,
    todayFuelSummary.calorieRemaining,
    todayFuelSummary.calorieTarget,
    todayFuelSummary.caloriesConsumed,
    todayFuelSummary.foodEntriesLogged,
    todayFuelSummary.proteinConsumed,
    todayFuelSummary.proteinTarget,
    todayIso,
    trackerDays,
  ]);

  const coachDecisionDraft = useMemo(() => {
    const readinessIssues = decisionSignalGate.missing
      .filter((item) => item.blocking || decisionSignalGate.status !== "ready")
      .slice(0, 4)
      .map((item) => `${item.label}: ${item.title}.`);

    if (decisionSignalGate.status !== "blocked" && decisionConfidenceModel.status === "low") {
      readinessIssues.push("Decision confidence is still low.");
    } else if (decisionSignalGate.status === "ready" && decisionConfidenceModel.status === "moderate") {
      readinessIssues.push("The call is usable, but the signal is still only moderate.");
    }

    const readinessTone: AccentTone = decisionSignalGate.tone;

    const readinessTitle =
      decisionSignalGate.status === "ready" && readinessIssues.length === 0
        ? "Ready to publish"
        : decisionSignalGate.status === "blocked"
          ? "Publish blocked until signal is real"
          : "Publish with caution";

    const readinessDetail =
      decisionSignalGate.status === "ready" && readinessIssues.length === 0
        ? "The package is clean enough to send: the signal is usable, the day is readable, and the athlete can act on one clear direction."
        : readinessIssues.join(" ");
    const primaryGateGap = decisionSignalGate.missing[0] ?? null;
    const draftTitle =
      decisionSignalGate.status === "blocked"
        ? "Finish signal before changing the plan"
        : coachRecommendation.action;
    const draftReason =
      decisionSignalGate.status === "blocked"
        ? decisionSignalGate.detail
        : coachRecommendation.reason;
    const draftNextAction = primaryGateGap
      ? `${primaryGateGap.actionLabel}: ${primaryGateGap.title}`
      : dashboardQueuedChanges[0] ?? "Execute the current direction cleanly before making another change.";
    const draftQueuedChanges =
      decisionSignalGate.status === "blocked"
        ? decisionSignalGate.missing.filter((item) => item.blocking).slice(0, 4).map((item) => `${item.actionLabel}: ${item.title}`)
        : dashboardQueuedChanges.slice(0, 4);

    return {
      title: draftTitle,
      reason: draftReason,
      instruction:
        coachInstruction.trim() || `${draftTitle}. ${draftReason}`,
      nextAction: draftNextAction,
      readinessTone,
      readinessTitle,
      readinessDetail,
      metrics: [
        {
          label: "Confidence",
          value: `${decisionSignalGate.score} / 100`,
          detail: decisionSignalGate.title,
        },
        {
          label: "Execution",
          value: `${selectedTrackerExecutionScore}%`,
          detail: `${selectedTrackerMissedLifts} lifts still open`,
        },
        {
          label: "Check-in",
          value: checkInReviewSnapshot.status === "due" ? "Due now" : checkInReviewSnapshot.title,
          detail: checkInReviewSnapshot.comparisonTitle,
        },
        {
          label: "Limiter",
          value: primaryLimiter,
          detail: `${complianceConfidence.score} / 100 compliance`,
        },
      ],
      summaryLines: [
        `${activeAthlete.name} weekly handoff`,
        `Signal gate: ${decisionSignalGate.title} (${decisionSignalGate.score}/100)`,
        `Focus: ${draftTitle}`,
        `Why: ${draftReason}`,
        ...(draftQueuedChanges.length > 0
          ? [`What changed: ${draftQueuedChanges.slice(0, 3).join(" | ")}`]
          : []),
        `Training: ${workoutSplit.length} planned days, ${totalPlannedSets} total sets`,
      ],
      queuedChanges: draftQueuedChanges,
    };
  }, [
    activeAthlete.name,
    decisionConfidenceModel.status,
    decisionSignalGate,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    checkInReviewSnapshot.title,
    checkInReviewSnapshot.comparisonTitle,
    primaryLimiter,
    complianceConfidence.score,
    coachRecommendation.action,
    coachRecommendation.reason,
    coachInstruction,
    dashboardQueuedChanges,
    workoutSplit.length,
    totalPlannedSets,
  ]);

  const prepSignalSnapshot = useMemo(
    () =>
      buildPrepSignalSnapshot({
        selectedTrackerExecutionScore,
        selectedTrackerMissingFieldsCount: selectedTrackerMissingFields.length,
        complianceScore: complianceConfidence.score,
        decisionConfidenceModel,
        bodyWeightTrendModel,
        dietPressureModel,
        recoveryPressureModel,
        checkInReviewSnapshot,
        topInsight: performanceInsightSnapshot.topInsight,
        topIntervention: monitoringSnapshot.interventions[0] ?? null,
      }),
    [
      selectedTrackerExecutionScore,
      selectedTrackerMissingFields.length,
      complianceConfidence.score,
      decisionConfidenceModel,
      bodyWeightTrendModel,
      dietPressureModel,
      recoveryPressureModel,
      checkInReviewSnapshot,
      performanceInsightSnapshot.topInsight,
      monitoringSnapshot.interventions,
    ]
  );

  const coachWorkflowQueue = useMemo<WorkflowPriorityItem[]>(() => {
    const items: WorkflowPriorityItem[] = [];

    if (decisionSignalGate.status !== "ready") {
      items.push({
        label: "Signal gate",
        title: decisionSignalGate.title,
        detail: decisionSignalGate.detail,
        tab: decisionSignalGate.primaryTab,
        tone: decisionSignalGate.tone,
        queueType: decisionSignalGate.primaryTab === "nutrition" ? "food" : decisionSignalGate.primaryTab === "tracker" ? "data" : "publish",
      });
    }

    if (!selectedTrackerDay) {
      items.push({
        label: "Start here",
        title: "Pick a live tracker day before reviewing the week",
        detail: "The fastest good decision starts with today's actual execution, not the template.",
        tab: "tracker",
        tone: "rose",
        queueType: "data",
      });
    }

    if (todayFuelSummary.foodEntriesLogged === 0) {
      items.push({
        label: "Food gap",
        title: "No food logged today",
        detail: "Do not interpret compliance, fullness, digestion, or macro targets until the first foods are logged.",
        tab: "nutrition",
        tone: "rose",
        queueType: "food",
      });
    } else if (todayFuelSummary.calorieRemaining > 250 || Math.max(0, todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed) > 25) {
      const proteinOpen = Math.max(0, todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed);
      items.push({
        label: "Food gap",
        title: "Food target still needs review",
        detail: `${Math.max(0, todayFuelSummary.calorieRemaining)} kcal and ${proteinOpen}g protein remain open. Resolve this before publishing a diet call.`,
        tab: "nutrition",
        tone: "amber",
        queueType: "food",
      });
    }

    if (selectedTrackerMissedLifts > 0) {
      items.push({
        label: "Missed lifts",
        title: `${selectedTrackerMissedLifts} lift${selectedTrackerMissedLifts === 1 ? "" : "s"} still open`,
        detail: "Close the actual training signal before editing volume, split structure, or recovery support.",
        tab: "tracker",
        tone: selectedTrackerMissedLifts >= 3 ? "rose" : "amber",
        queueType: "training",
      });
    }

    if (selectedTrackerExecutionScore < 85) {
      items.push({
        label: "Execution risk",
        title:
          selectedTrackerExecutionScore < 50
            ? "Adherence is too low to trust the plan"
            : "Execution still needs cleanup before a bigger change",
        detail: `${selectedTrackerExecutionScore}% daily execution. Solve adherence before rewriting the week.`,
        tab: "tracker",
        tone: selectedTrackerExecutionScore < 50 ? "rose" : "amber",
        queueType: "training",
      });
    }

    if (selectedTrackerMissingFields.length > 0) {
      items.push({
        label: "Missing data",
        title: `Log ${selectedTrackerMissingFields.join(", ")}`,
        detail: "The coaching call gets weaker when bodyweight, steps, or energy are still missing from today's tracker.",
        tab: "tracker",
        tone: "amber",
        queueType: "data",
      });
    }

    if (recoveryScore < 6.5) {
      items.push({
        label: "Recovery risk",
        title: "Recovery is low enough to change the coaching call",
        detail: `${recoveryScore.toFixed(1)}/10 recovery. Check sleep, steps, and training load before pushing harder.`,
        tab: "tracker",
        tone: recoveryScore < 5.5 ? "rose" : "amber",
        queueType: "recovery",
      });
    }

    if (checkInReviewSnapshot.status !== "on-track") {
      items.push({
        label: "Review cadence",
        title: checkInReviewSnapshot.title,
        detail: checkInReviewSnapshot.detail,
        tab: "dashboard",
        tone: checkInReviewSnapshot.tone,
        queueType: "check-in",
      });
    }

    if (conditioningSnapshot.primaryAction.tone !== "emerald") {
      items.push({
        label: "Conditioning",
        title: conditioningSnapshot.primaryAction.title,
        detail: conditioningSnapshot.primaryAction.detail,
        tab: conditioningSnapshot.primaryAction.tab,
        tone: conditioningSnapshot.primaryAction.tone,
        queueType: "training",
      });
    }

    performanceInsightSnapshot.workflowItems.slice(0, 1).forEach((insight) => {
      items.push({
        label: "Best insight",
        title: insight.title,
        detail: insight.detail,
        tab: insight.tab,
        tone: insight.tone,
        queueType: insight.tab === "nutrition" ? "food" : insight.tab === "tracker" ? "training" : "plan",
      });
    });

    monitoringSnapshot.interventions.slice(0, 2).forEach((intervention) => {
      items.push({
        label: "Intervention",
        title: intervention.title,
        detail: intervention.detail,
        tab: intervention.tab,
        tone: intervention.tone,
        queueType:
          intervention.tab === "nutrition"
            ? "food"
            : intervention.tab === "tracker"
              ? "training"
              : "plan",
      });
    });

    if (supportStackSnapshot.primaryAction.tone !== "emerald" && supportStackSnapshot.primaryAction.tone !== "slate") {
      items.push({
        label: "Supplement support",
        title: supportStackSnapshot.primaryAction.title,
        detail: supportStackSnapshot.primaryAction.detail,
        tab: "nutrition",
        tone: supportStackSnapshot.primaryAction.tone,
        queueType: "support",
      });
    }

    if (adaptationSnapshot.primaryAction.code !== "hold" && adaptationSnapshot.primaryAction.code !== "progress-ready") {
      items.push({
        label: "Adaptation read",
        title: adaptationSnapshot.primaryAction.title,
        detail: adaptationSnapshot.primaryAction.detail,
        tab: adaptationSnapshot.primaryAction.code === "log-more" ? "tracker" : "split",
        tone: adaptationSnapshot.primaryAction.tone,
        queueType: adaptationSnapshot.primaryAction.code === "log-more" ? "training" : "plan",
      });
    }

    if (dashboardQueuedChanges.length > 0) {
      items.push({
        label: "Ready to publish",
        title: dashboardQueuedChanges[0] ?? "Package the next direction",
        detail:
          dashboardQueuedChanges.length > 1
            ? `${dashboardQueuedChanges.length} coaching adjustments are queued. Condense them into one clean publish package before sending anything.`
            : "Turn the current recommendation into one clear publish package before sending anything.",
        tab: "coach",
        tone: "sky",
        queueType: "publish",
      });
    }

    if (latestPublishedDecision && latestPublishedDecision.status !== "acknowledged") {
      items.push({
        label: "Athlete receipt",
        title: "Latest published direction is still unacknowledged",
        detail: `${latestPublishedDecision.title} was published on ${latestPublishedDecision.publishedAt.slice(0, 10)} and still needs athlete receipt.`,
        tab: "coach",
        tone: "sky",
        queueType: "publish",
      });
    }

    if (openTrackerTaskCount > 0) {
      items.push({
        label: "Follow-through",
        title: `${openTrackerTaskCount} open support items`,
        detail: "Finish open follow-up work so nothing important depends on memory or a separate message thread.",
        tab: "tracker",
        tone: "slate",
        queueType: "support",
      });
    }

    if (items.length === 0) {
      items.push({
        label: "Stable week",
        title: "The athlete is ready for a clean publish",
        detail: "Execution, data, and review checkpoints are all in a usable place. Publish one clear direction and move on.",
        tab: "coach",
        tone: "emerald",
        queueType: "publish",
      });
    }

    return dedupeWorkflowPriorityItems(items).slice(0, 6);
  }, [
    selectedTrackerDay,
    todayFuelSummary,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    selectedTrackerMissingFields,
    recoveryScore,
    checkInReviewSnapshot.status,
    checkInReviewSnapshot.title,
    checkInReviewSnapshot.detail,
    checkInReviewSnapshot.tone,
    conditioningSnapshot.primaryAction,
    decisionSignalGate,
    performanceInsightSnapshot.workflowItems,
    monitoringSnapshot.interventions,
    supportStackSnapshot.primaryAction,
    adaptationSnapshot.primaryAction,
    dashboardQueuedChanges,
    latestPublishedDecision,
    openTrackerTaskCount,
  ]);

  const athleteWorkflowQueue = useMemo<WorkflowPriorityItem[]>(() => {
    const items: WorkflowPriorityItem[] = [
      {
        label: selfManagedAthlete ? "Current plan" : "Latest update",
        title: decisionSignalGate.status === "blocked" ? decisionSignalGate.title : coachRecommendation.action,
        detail: decisionSignalGate.status === "blocked" ? decisionSignalGate.detail : selfManagedAthlete ? coachRecommendation.reason : coachInstruction,
        tab: "dashboard",
        tone: decisionSignalGate.status === "blocked" ? decisionSignalGate.tone : "sky",
      },
    ];

    if (decisionSignalGate.status !== "ready") {
      items.push({
        label: "Signal gate",
        title: decisionSignalGate.missing[0]?.title ?? decisionSignalGate.title,
        detail: decisionSignalGate.missing[0]?.detail ?? decisionSignalGate.detail,
        tab: decisionSignalGate.primaryTab,
        tone: decisionSignalGate.tone,
      });
    }

    if (selfManagedAdaptivePlan.isBehind) {
      items.push({
        label: "Adaptive plan",
        title: selfManagedAdaptivePlan.title,
        detail: selfManagedAdaptivePlan.detail,
        tab: "dashboard",
        tone: "amber",
      });
    }

    if (!selectedTrackerDay) {
      items.push({
        label: "Today",
        title: "Open the tracker before doing anything else",
        detail: "Choose today's session first so the rest of the day stays anchored to real work instead of guesswork.",
        tab: "tracker",
        tone: "amber",
      });
    } else if (selectedTrackerMissedLifts > 0) {
      items.push({
        label: "Today",
        title: `Finish ${selectedTrackerMissedLifts} open lifts`,
        detail: `${selectedTrackerExecutionScore}% of today's work is logged. Finish the session before you start changing the plan.`,
        tab: "tracker",
        tone: selectedTrackerMissedLifts >= 3 ? "amber" : "sky",
      });
    }

    if (selectedTrackerMissingFields.length > 0) {
      items.push({
        label: "Still missing",
        title: `Log ${selectedTrackerMissingFields.join(", ")}`,
        detail: selfManagedAthlete
          ? "Use the basics while the app builds signal: hit protein, land near calories, finish training, and keep steps moving."
          : "Complete the day's basic data so the next coaching call uses real signal instead of guesses.",
        tab: "tracker",
        tone: "amber",
      });
    }

    if (!selfManagedAthlete && latestPublishedDecision && latestPublishedDecision.status !== "acknowledged") {
      items.push({
        label: "Published direction",
        title: "Acknowledge the latest coaching update",
        detail: `${latestPublishedDecision.title} is live. Confirm receipt so the coach and athlete stay synced on the current call.`,
        tab: "dashboard",
        tone: "sky",
      });
    }

    if (checkInReviewSnapshot.status !== "on-track") {
      items.push({
        label: "Check-in",
        title: checkInReviewSnapshot.title,
        detail: checkInReviewSnapshot.detail,
        tab: "dashboard",
        tone: checkInReviewSnapshot.tone,
      });
    }

    if (primaryLimiter === "Digestion" || primaryLimiter === "Fullness") {
      items.push({
        label: "Food focus",
        title: primaryLimiter === "Digestion" ? "Keep food flow smooth today" : "Protect peri-workout fuel",
        detail:
          primaryLimiter === "Digestion"
            ? "Keep meal timing and food volume smooth around training so digestion stops being the limiter."
            : "Bias carbs around the session and do not let the training window go under-fueled.",
        tab: "nutrition",
        tone: primaryLimiter === "Digestion" ? "amber" : "emerald",
      });
    }

    if (conditioningSnapshot.primaryAction.tone !== "emerald") {
      items.push({
        label: "Conditioning",
        title: conditioningSnapshot.primaryAction.title,
        detail: conditioningSnapshot.primaryAction.detail,
        tab: conditioningSnapshot.primaryAction.tab,
        tone: conditioningSnapshot.primaryAction.tone,
      });
    }

    performanceInsightSnapshot.workflowItems.slice(0, 1).forEach((insight) => {
      items.push({
        label: "Best insight",
        title: insight.title,
        detail: insight.detail,
        tab: insight.tab === "coach" ? "dashboard" : insight.tab,
        tone: insight.tone,
      });
    });

    monitoringSnapshot.interventions.slice(0, 2).forEach((intervention) => {
      items.push({
        label: "Best next move",
        title: intervention.title,
        detail: intervention.detail,
        tab: intervention.tab === "coach" ? "dashboard" : intervention.tab,
        tone: intervention.tone,
      });
    });

    if (supportStackSnapshot.primaryAction.tone !== "emerald" && supportStackSnapshot.primaryAction.tone !== "slate") {
      items.push({
        label: "Supplement support",
        title: supportStackSnapshot.primaryAction.title,
        detail: supportStackSnapshot.primaryAction.detail,
        tab: "nutrition",
        tone: supportStackSnapshot.primaryAction.tone,
      });
    }

    if (adaptationSnapshot.primaryAction.code !== "hold" && adaptationSnapshot.primaryAction.code !== "progress-ready") {
      items.push({
        label: "Adaptation read",
        title: adaptationSnapshot.primaryAction.title,
        detail: adaptationSnapshot.primaryAction.detail,
        tab: adaptationSnapshot.primaryAction.code === "log-more" ? "tracker" : "split",
        tone: adaptationSnapshot.primaryAction.tone,
      });
    }

    return dedupeWorkflowPriorityItems(items).slice(0, 4);
  }, [
    coachRecommendation.action,
    coachRecommendation.reason,
    coachInstruction,
    selectedTrackerDay,
    selectedTrackerMissedLifts,
    selectedTrackerExecutionScore,
    selectedTrackerMissingFields,
    checkInReviewSnapshot.status,
    checkInReviewSnapshot.title,
    checkInReviewSnapshot.detail,
    checkInReviewSnapshot.tone,
    latestPublishedDecision,
    primaryLimiter,
    conditioningSnapshot.primaryAction,
    performanceInsightSnapshot.workflowItems,
    monitoringSnapshot.interventions,
    supportStackSnapshot.primaryAction,
    adaptationSnapshot.primaryAction,
    selfManagedAdaptivePlan.detail,
    selfManagedAdaptivePlan.isBehind,
    selfManagedAdaptivePlan.title,
    selfManagedAthlete,
    decisionSignalGate,
  ]);

  const pushChangeLog = (entry: Omit<ChangeLogEntry, "id" | "date">) => {
    setChangeLog((prev) => [
      {
        id: Date.now().toString(),
        date: new Date().toISOString().slice(0, 10),
        ...entry,
      },
      ...prev,
    ]);
  };

  const showActionReceipt = useCallback((receipt: Omit<ActionReceipt, "id">) => {
    setActionReceipt({
      id: Date.now(),
      ...receipt,
    });
  }, []);

  const copyTextToClipboard = useCallback(async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Try the DOM fallback below when browser clipboard permissions are blocked.
      }
    }

    if (typeof document === "undefined") return false;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }, []);

  useEffect(() => {
    if (!actionReceipt) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActionReceipt((current) => (current?.id === actionReceipt.id ? null : current));
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [actionReceipt]);

  const applyAdaptiveWeekPlan = () => {
    const currentWeek = scheduleMacroProgression[0];
    if (!currentWeek) return;

    const previousCalories = macroCalories;
    const previousTargets = `${proteinTarget}P / ${carbTarget}C / ${fatTarget}F`;
    const nextTargets = `${currentWeek.protein}P / ${currentWeek.carbs}C / ${currentWeek.fats}F`;
    const previousStepTarget = activeStepTarget;

    setProteinTarget(currentWeek.protein);
    setCarbTarget(currentWeek.carbs);
    setFatTarget(currentWeek.fats);
    setEstimatedTdee(contestPrepModel.maintenanceCalories);
    setStepTargetAdjustment(currentWeek.steps - contestPrepModel.todayTargets.steps);

    pushChangeLog({
      category: "Nutrition",
      title: previousCalories === currentWeek.calories ? "Reconfirmed current week targets" : "Synced current week targets",
      detail: `${previousCalories} -> ${currentWeek.calories} kcal, ${previousTargets} -> ${nextTargets}, ${previousStepTarget.toLocaleString()} -> ${currentWeek.steps.toLocaleString()} steps.`,
      impact: `${currentWeek.adjustmentDetail} Estimated maintenance synced to ${contestPrepModel.maintenanceCalories} kcal so the displayed deficit matches the roadmap.`,
    });
    showActionReceipt({
      title: "Week targets applied",
      detail: `${nextTargets}, ${currentWeek.steps.toLocaleString()} steps, ${currentWeek.calories} kcal.`,
      tone: "success",
    });
  };

  const applyPeakDayPlan = (planId: string) => {
    const plan = peakWeekPlan.find((item) => item.id === planId);
    if (!plan) return;

    setCarbTarget(plan.carbs);
    setWaterLiters(plan.waterLiters);
    setSaltTsp(plan.saltTsp);

    pushChangeLog({
      category: "Nutrition",
      title: `Applied ${plan.label} peak targets`,
      detail: `${plan.carbs}g carbs, ${plan.waterLiters.toFixed(2)}L water, ${plan.saltTsp.toFixed(2)} tsp salt.`,
      impact: plan.action,
    });
    showActionReceipt({
      title: `${plan.label} applied`,
      detail: `${plan.carbs}g carbs, ${plan.waterLiters.toFixed(2)}L water, ${plan.saltTsp.toFixed(2)} tsp salt.`,
      tone: "success",
    });
  };

  const sendCoachThreadMessage = (author: CoachThreadMessage["author"], body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    const createdAt = new Date().toISOString();
    const message: CoachThreadMessage = {
      id: `thread-${Date.now()}`,
      createdAt,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      author,
      body: trimmed,
      relatedDecisionId: latestPublishedDecision?.id,
      deliveryStatus: "delivered",
      deliveredAt: createdAt,
    };

    setCoachThreadMessages((prev) => [message, ...prev].slice(0, 80));
    pushChangeLog({
      category: "Coach",
      title: author === "coach" ? `Sent note to ${activeAthlete.name}` : `${activeAthlete.name} sent a note`,
      detail: trimmed,
      impact: "Coach and athlete now have a persistent message trail tied to the active direction.",
    });
  };

  const toggleFavoriteFood = useCallback((foodId: string) => {
    setFavoriteFoodIds((prev) =>
      prev.includes(foodId) ? prev.filter((item) => item !== foodId) : [foodId, ...prev]
    );
  }, []);

  const addCustomFoods = useCallback(
    (foods: FoodCatalogItem[]) => {
      const prepared = foods
        .filter((food) => food.label.trim().length > 0)
        .map((food) => ({
          ...food,
          nutrients: { ...food.nutrients },
          recipeItems: food.recipeItems?.map((item) => ({ ...item })),
        }));

      if (prepared.length === 0) return 0;

      let savedCount = 0;
      setCustomFoods((prev) => {
        const next = [...prev];

        prepared.forEach((food) => {
          const key = foodIdentityKey(food);
          const existingIndex = next.findIndex(
            (item) => foodIdentityKey(item) === key
          );

          if (existingIndex >= 0) {
            next[existingIndex] = {
              ...food,
              id: next[existingIndex].id,
            };
          } else {
            next.unshift({
              ...food,
              id: food.id || stableCustomFoodId(food),
            });
          }

          savedCount += 1;
        });

        return next;
      });

      if (savedCount > 0) {
        const firstAdded = prepared[0];
        const isRecipe = (firstAdded?.recipeItems?.length ?? 0) > 0;
        pushChangeLog({
          category: "Nutrition",
          title: savedCount === 1 ? (isRecipe ? "Saved recipe" : "Added custom food") : `Imported ${savedCount} custom foods`,
          detail:
            savedCount === 1
              ? `${firstAdded?.label ?? "Custom food"} is now available inside the food library.`
              : `${savedCount} foods were added to the custom catalog.`,
          impact: "The searchable food library now includes user-defined entries.",
        });
      }

      return savedCount;
    },
    [pushChangeLog]
  );

  const addFoodEntriesToMeal = useCallback(
    (
      mealId: string,
      items: FoodLogItemInput[]
    ) => {
      if (items.length === 0) return;

      const targetMeal = meals.find((meal) => meal.id === mealId);
      const isMacroOnlyItem = (item: FoodLogItemInput) =>
        item.persistToCatalog === false || item.food.id.startsWith("quick-macro-");
      const foodsToPersist = items
        .filter((item) => !isMacroOnlyItem(item))
        .map((item) => item.food)
        .filter((food) => food.source !== "core");

      if (foodsToPersist.length > 0) {
        setCustomFoods((prev) => {
          const next = [...prev];

          foodsToPersist.forEach((food) => {
            const key = foodIdentityKey(food);
            const existingIndex = next.findIndex((item) => foodIdentityKey(item) === key);
            if (existingIndex >= 0) return;
            next.unshift({
              ...food,
              id: food.id || stableCustomFoodId(food),
              nutrients: { ...food.nutrients },
              recipeItems: food.recipeItems?.map((item) => ({ ...item })),
            });
          });

          return next;
        });
      }

      const recentFoodIdsToAdd = items
        .filter((item) => item.addToRecent !== false && !isMacroOnlyItem(item))
        .map((item) => item.food.id);

      if (recentFoodIdsToAdd.length > 0) {
        setRecentFoodIds((prev) => {
          return [
            ...recentFoodIdsToAdd,
            ...prev.filter((id) => !recentFoodIdsToAdd.includes(id)),
          ].slice(0, 16);
        });
      }

      setMeals((prev) =>
        prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          const nextEntries = [
            ...cloneMealFoodEntries(meal.foodEntries),
            ...items.map((item) =>
              createMealFoodEntry(item.food, item.servings, item.servingOptionId)
            ),
          ];
          return hydrateMealFromFoodEntries({
            ...meal,
            foodEntries: nextEntries,
          });
        })
      );

      const addedCalories = items.reduce(
        (sum, item) => sum + item.food.nutrients.calories * item.servings,
        0
      );
      const macroOnlyLog = items.every(isMacroOnlyItem);
      pushChangeLog({
        category: "Nutrition",
        title: macroOnlyLog
          ? `Quick logged macros to ${targetMeal?.name ?? "meal"}`
          : `Added ${items.length} food item${items.length === 1 ? "" : "s"} to ${targetMeal?.name ?? "meal"}`,
        detail: macroOnlyLog
          ? `${Math.round(addedCalories)} kcal was added as a macro-only entry. Micronutrients were not estimated.`
          : `${Math.round(addedCalories)} kcal was added through food entries instead of manual meal macros.`,
        impact: macroOnlyLog
          ? "Daily macro totals now reflect a fast log without creating a library food."
          : "Meal macros and micronutrient support now reflect logged foods directly.",
      });
    },
    [meals, pushChangeLog]
  );

  const updateMealFoodEntryServings = useCallback((mealId: string, entryId: string, servings: number) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== mealId) return meal;
        const nextEntries = cloneMealFoodEntries(meal.foodEntries).map((entry) =>
          entry.id === entryId
            ? { ...entry, servings: Math.max(0.25, Number(Number(servings).toFixed(2))) }
            : entry
        );
        return hydrateMealFromFoodEntries({
          ...meal,
          foodEntries: nextEntries,
        });
      })
    );
  }, []);

  const updateMealFoodEntryUnit = useCallback(
    (mealId: string, entryId: string, servingOptionId: string) => {
      setMeals((prev) =>
        prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          const nextEntries = cloneMealFoodEntries(meal.foodEntries).map((entry) => {
            if (entry.id !== entryId) return entry;

            const servingSelection = resolveFoodServingSelection(
              {
                nutrients: entry.baseNutrients ?? entry.nutrients,
                servingLabel: entry.baseServingLabel ?? entry.servingLabel,
                servingGrams: entry.baseServingGrams ?? entry.servingGrams,
                servingOptions: entry.servingOptions,
              },
              servingOptionId
            );

            return {
              ...entry,
              selectedServingOptionId: servingSelection.selectedOption.id,
              servingLabel: servingSelection.servingLabel,
              servingGrams: servingSelection.servingGrams,
              nutrients: servingSelection.nutrients,
              servingOptions: servingSelection.options,
            };
          });

          return hydrateMealFromFoodEntries({
            ...meal,
            foodEntries: nextEntries,
          });
        })
      );
    },
    []
  );

  const removeMealFoodEntry = useCallback((mealId: string, entryId: string) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== mealId) return meal;
        const nextEntries = cloneMealFoodEntries(meal.foodEntries).filter((entry) => entry.id !== entryId);
        if (nextEntries.length === 0) {
          return {
            ...meal,
            foodEntries: [],
            protein: 0,
            carbs: 0,
            fats: 0,
            fiberG: 0,
            sodiumMg: 0,
            potassiumMg: 0,
            fluidMl: 0,
            libraryFoodIds: [],
            satietyLevel: "light",
            digestionLoad: "light",
            micronutrientDensity: "light",
          };
        }
        return hydrateMealFromFoodEntries({
          ...meal,
          foodEntries: nextEntries,
        });
      })
    );
  }, []);

  const createCurrentFoodDaySnapshot = useCallback(() =>
    buildFoodDaySnapshot({
      date: todayIso,
      meals,
      targetCalories: macroCalories,
      targetProtein: proteinTarget,
      targetCarbs: carbTarget,
      targetFats: fatTarget,
    }),
    [carbTarget, fatTarget, macroCalories, meals, proteinTarget, todayIso]
  );

  const saveFoodDaySnapshot = useCallback(() => {
    const snapshot = createCurrentFoodDaySnapshot();

    if (!snapshot) {
      showActionReceipt({
        title: "No food day to save",
        detail: "Log at least one food before saving today's food history.",
        tone: "warning",
      });
      return;
    }

    setFoodDayHistory((prev) => upsertFoodDaySnapshot(prev, snapshot));
    pushChangeLog({
      category: "Nutrition",
      title: `Saved food day for ${snapshot.date}`,
      detail: `${snapshot.foodEntries} foods across ${snapshot.loggedMeals} meals, ${snapshot.calories} kcal.`,
      impact: "Weekly food adherence now has a dated receipt instead of only today's live state.",
    });
    showActionReceipt({
      title: "Food day saved",
      detail: `${snapshot.foodEntries} foods saved for weekly adherence and repeat-day recovery.`,
      tone: "success",
    });
  }, [createCurrentFoodDaySnapshot, showActionReceipt]);

  const copyFoodDayToToday = useCallback(
    (date: string, mode: "replace" | "append" = "replace") => {
      const source = foodDayHistory.find((item) => item.date === date);

      if (!source) {
        showActionReceipt({
          title: "No food day found",
          detail: "Save a previous food day before trying to copy it forward.",
          tone: "warning",
        });
        return;
      }

      const copiedMeals = cloneMealsForFoodDay(source.meals);
      const copiedFoodIds = copiedMeals.flatMap((meal) =>
        (meal.foodEntries ?? []).map((entry) => entry.foodId)
      );

      setMeals((prev) => (mode === "append" ? [...prev, ...copiedMeals] : copiedMeals));
      if (copiedFoodIds.length > 0) {
        setRecentFoodIds((prev) => [
          ...copiedFoodIds,
          ...prev.filter((id) => !copiedFoodIds.includes(id)),
        ].slice(0, 16));
      }

      pushChangeLog({
        category: "Nutrition",
        title: `${mode === "append" ? "Added" : "Copied"} ${source.date} food day`,
        detail: `${source.foodEntries} foods were ${mode === "append" ? "added to" : "restored into"} today's meal flow.`,
        impact: "Repeat-day logging is now one action instead of rebuilding meals food by food.",
      });
      showActionReceipt({
        title: mode === "append" ? "Food day added" : "Food day copied",
        detail: `${source.date} is now in today's food log. Adjust servings instead of starting from zero.`,
        tone: "success",
      });
    },
    [foodDayHistory, showActionReceipt]
  );

  useEffect(() => {
    if (!storageHydrated) return;

    const snapshot = createCurrentFoodDaySnapshot();
    if (!snapshot) return;

    setFoodDayHistory((prev) => {
      const existing = prev.find((item) => item.date === snapshot.date);
      if (
        existing &&
        existing.foodEntries === snapshot.foodEntries &&
        existing.loggedMeals === snapshot.loggedMeals &&
        existing.calories === snapshot.calories &&
        existing.protein === snapshot.protein &&
        existing.carbs === snapshot.carbs &&
        existing.fats === snapshot.fats &&
        existing.targetCalories === snapshot.targetCalories &&
        existing.targetProtein === snapshot.targetProtein &&
        existing.targetCarbs === snapshot.targetCarbs &&
        existing.targetFats === snapshot.targetFats
      ) {
        return prev;
      }

      return upsertFoodDaySnapshot(prev, snapshot);
    });
  }, [createCurrentFoodDaySnapshot, storageHydrated]);

  const updateSupplementProtocol = (supplementId: string, patch: Partial<SupplementProtocol>) => {
    setSupplements((prev) =>
      normalizeLoadedSupplements(
        prev.map((item) => (item.supplementId === supplementId ? { ...item, ...patch } : item))
      )
    );
  };

  const addCheckIn = () => {
    const next: CheckIn = {
      id: Date.now().toString(),
      label: `Week ${weeksOut}`,
      date: new Date().toISOString().slice(0, 10),
      bodyWeight,
      fullness: Number(fullnessScore.toFixed(1)),
      dryness: Number(drynessScore.toFixed(1)),
      condition: Number(conditionScore.toFixed(1)),
      training: Number(trainingScore.toFixed(1)),
      recovery: Number(recoveryScore.toFixed(1)),
      waist: Number((32 + (10 - conditionScore) * 0.15).toFixed(1)),
    };
    setCheckIns((prev) => [...prev, next]);
    pushChangeLog({
      category: "Check-in",
      title: `Logged check-in for week ${weeksOut}`,
      detail: `BW ${bodyWeight.toFixed(1)} lb, condition ${conditionScore.toFixed(1)}, recovery ${recoveryScore.toFixed(1)}.`,
      impact: `Look state is ${lookStateLabel} with ${primaryLimiter} as the main limiter.`,
    });
  };

  const attachCheckInPhoto = (checkInId: string, slot: CheckInPhotoSlot, dataUrl: string) => {
    setCheckIns((prev) =>
      prev.map((checkIn) =>
        checkIn.id === checkInId
          ? {
              ...checkIn,
              photos: {
                ...(checkIn.photos ?? {}),
                [slot]: dataUrl,
              },
            }
          : checkIn
      )
    );

    pushChangeLog({
      category: "Check-in",
      title: `Added ${slot} progress photo`,
      detail: "Progress photos are now attached to the stored check-in review.",
      impact: "Visual review can compare photos against bodyweight, recovery, and condition data.",
    });
  };

  const removeCheckInPhoto = (checkInId: string, slot: CheckInPhotoSlot) => {
    setCheckIns((prev) =>
      prev.map((checkIn) => {
        if (checkIn.id !== checkInId) return checkIn;
        const nextPhotos = { ...(checkIn.photos ?? {}) };
        delete nextPhotos[slot];
        return {
          ...checkIn,
          photos: nextPhotos,
        };
      })
    );
  };

  const addMeal = () => {
    const nextMealId = `${Date.now()}`;
    setMeals((prev) => [
      ...prev,
      {
        id: nextMealId,
        name: `Meal ${prev.length + 1}`,
        protein: 40,
        carbs: 25,
        fats: 10,
        timing: "13:00",
        type: "standard",
        timingUse: "flexible",
        foodEntries: [],
      },
    ]);
    pushChangeLog({
      category: "Nutrition",
      title: "Added meal",
      detail: `Meal ${meals.length + 1} was added to the current plan.`,
      impact: `Nutrition structure now contains ${meals.length + 1} meals.`,
    });

    return nextMealId;
  };

  const addMealFromTemplate = (templateId: string) => {
    const template = mealTemplates.find((item) => item.id === templateId);
    if (!template) return null;

    const { id: templateKey, ...templateFields } = template;
    const nextMealId = `${templateKey}-${Date.now()}`;
    setMeals((prev) => [
      ...prev,
      hydrateMealFromFoodEntries({
        id: nextMealId,
        ...templateFields,
        type: template.type ?? "standard",
        foodEntries: cloneMealFoodEntries(template.foodEntries),
      }),
    ]);

    pushChangeLog({
      category: "Nutrition",
      title: `Added ${template.name} from templates`,
      detail: `${template.protein}P / ${template.carbs}C / ${template.fats}F was dropped straight into the meal flow.`,
      impact: "Repeated foods can now be inserted without rebuilding the meal by hand.",
    });

    return nextMealId;
  };

  const openNutritionTargets = () => {
    setShowBuilderTools(true);
    updateAdvancedEditor("nutritionControls", true);
    setNutritionSurfaceIntent({ surface: "insights", entryMode: "search", nonce: Date.now() });
    setNutritionSidebarIntent((prev) => ({ section: "targets", templateId: null, nonce: prev.nonce + 1 }));
    goToTab("nutrition");
  };

  const openNutritionOverview = () => {
    setNutritionSurfaceIntent({ surface: "log", entryMode: "search", nonce: Date.now() });
    setNutritionSidebarIntent((prev) => ({ section: "overview", templateId: null, nonce: prev.nonce + 1 }));
    goToTab("nutrition");
  };

  const openMealBuilder = () => {
    setShowBuilderTools(true);
    updateAdvancedEditor("nutrition", true);
    setNutritionSurfaceIntent({ surface: "insights", entryMode: "search", nonce: Date.now() });
    setNutritionSidebarIntent((prev) => ({ section: "builder", templateId: null, nonce: prev.nonce + 1 }));
    goToTab("nutrition");
  };

  const openMealTemplateLibrary = (templateId: string) => {
    setShowBuilderTools(true);
    updateAdvancedEditor("nutrition", true);
    setNutritionSurfaceIntent({ surface: "insights", entryMode: "search", nonce: Date.now() });
    setNutritionSidebarIntent((prev) => ({ section: "templates", templateId, nonce: prev.nonce + 1 }));
    goToTab("nutrition");
  };

  const moveMeal = (mealId: string, direction: -1 | 1) => {
    setMeals((prev) => {
      const index = prev.findIndex((item) => item.id === mealId);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return next;
    });
  };

  const duplicateMeal = (mealId: string) => {
    setMeals((prev) => {
      const index = prev.findIndex((item) => item.id === mealId);
      if (index === -1) return prev;
      const source = prev[index];
      const next = [...prev];
      next.splice(
        index + 1,
        0,
        hydrateMealFromFoodEntries({
          ...source,
          id: `${source.id}-copy-${Date.now()}`,
          name: `${source.name} Copy`,
          type: source.type ?? "standard",
          foodEntries: cloneMealFoodEntries(source.foodEntries),
        })
      );
      return next;
    });
  };

  const saveMealAsTemplate = (mealId: string) => {
    const source = meals.find((meal) => meal.id === mealId);
    if (!source) return;

    setMealTemplates((prev) => {
      const nextTemplate: MealTemplate = {
        id: `template-${Date.now()}`,
        name: source.name,
        protein: source.protein,
        carbs: source.carbs,
        fats: source.fats,
        timing: source.timing,
        type: source.type ?? "standard",
        libraryFoodIds: source.libraryFoodIds,
        fiberG: source.fiberG,
        sodiumMg: source.sodiumMg,
        potassiumMg: source.potassiumMg,
        fluidMl: source.fluidMl,
        satietyLevel: source.satietyLevel,
        digestionLoad: source.digestionLoad,
        micronutrientDensity: source.micronutrientDensity,
        timingUse: source.timingUse,
        note: source.note,
        foodEntries: cloneMealFoodEntries(source.foodEntries),
      };
      return [nextTemplate, ...prev.filter((item) => item.name !== nextTemplate.name)].slice(0, 12);
    });

    pushChangeLog({
      category: "Nutrition",
      title: `Saved ${source.name} as a meal template`,
      detail: `${source.protein}P / ${source.carbs}C / ${source.fats}F at ${source.timing}.`,
      impact: "Reusable meals are now available directly from the builder.",
    });
  };

  const applyMealTemplate = (mealId: string, templateId: string) => {
    const template = mealTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? hydrateMealFromFoodEntries({
              ...meal,
              name: template.name,
              protein: template.protein,
              carbs: template.carbs,
              fats: template.fats,
              timing: template.timing,
              type: template.type ?? meal.type,
              libraryFoodIds: template.libraryFoodIds,
              fiberG: template.fiberG,
              sodiumMg: template.sodiumMg,
              potassiumMg: template.potassiumMg,
              fluidMl: template.fluidMl,
              satietyLevel: template.satietyLevel,
              digestionLoad: template.digestionLoad,
              micronutrientDensity: template.micronutrientDensity,
              timingUse: template.timingUse,
              note: template.note,
              foodEntries: cloneMealFoodEntries(template.foodEntries),
            })
          : meal
      )
    );

    pushChangeLog({
      category: "Nutrition",
      title: `Applied ${template.name} template`,
      detail: `${template.protein}P / ${template.carbs}C / ${template.fats}F replaced the selected meal.`,
      impact: "A repeat meal can now be restored without rebuilding foods or macros.",
    });
  };

  const mealTypeTone = (type?: Meal["type"]) => {
    switch (type) {
      case "pre":
        return "bg-sky-100 text-sky-700 border-sky-200";
      case "intra":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "post":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "off":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const assignMealTemplate = (mealId: string, mode: Meal["type"]) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== mealId) return meal;
        if (mode === "pre" || mode === "intra" || mode === "post" || mode === "off") {
          const template = getSeedMealTemplateByType(mode, intraCarbs);
          if (!template) return meal;
          return hydrateMealFromFoodEntries({
            ...meal,
            name: template.name,
            protein: template.protein,
            carbs: template.carbs,
            fats: template.fats,
            timing: template.timing,
            type: template.type ?? mode,
            libraryFoodIds: template.libraryFoodIds,
            fiberG: template.fiberG,
            sodiumMg: template.sodiumMg,
            potassiumMg: template.potassiumMg,
            fluidMl: template.fluidMl,
            satietyLevel: template.satietyLevel,
            digestionLoad: template.digestionLoad,
            micronutrientDensity: template.micronutrientDensity,
            timingUse: template.timingUse,
            note: template.note,
            foodEntries: cloneMealFoodEntries(template.foodEntries),
          });
        }
        return hydrateMealFromFoodEntries({ ...meal, type: "standard", foodEntries: [] });
      })
    );
  };

  const mealMacroGuidance = useMemo(() => {
    const pre = mealDistribution.pre ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const intra = mealDistribution.intra ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const post = mealDistribution.post ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const off = mealDistribution.off ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };

    return {
      pre: `Keep this meal easy to digest with moderate carbs and low fat. Current: ${pre.protein}P ${pre.carbs}C ${pre.fats}F.`,
      intra: `This should mostly be carbs, fluids, and minimal digestive load. Current: ${intra.protein}P ${intra.carbs}C ${intra.fats}F.`,
      post: `Use this meal to refill and recover without turning it into a digestion bomb. Current: ${post.protein}P ${post.carbs}C ${post.fats}F.`,
      off: `Use standard meals to keep protein high and digestion calm when there is no peri-workout need. Current: ${off.protein}P ${off.carbs}C ${off.fats}F.`,
    };
  }, [mealDistribution]);

  const nutritionPrimaryAction = useMemo(() => {
    if (recoveryPressureModel.status === "high" && dietPressureModel.status === "aggressive-deficit") {
      return {
        title: "Reduce recovery pressure before pushing harder",
        body: "The combination of current loss pace, sleep/recovery context, and weekly load is too expensive to ignore. Support the system before you chase a sharper look.",
        cta: "Support recovery",
      };
    }

    if (trainingDay && mealPlanScienceProfile.status === "digestive-heavy") {
      return {
        title: "Clean up the meal composition before changing totals",
        body: "The meal map looks heavier than the current training day wants. Tighten food composition and digestion burden before assuming total calories are the main problem.",
        cta: "Clean up meals",
      };
    }

    if (trainingDay && mealPlanScienceProfile.status === "electrolyte-light") {
      return {
        title: "Bring food-linked electrolyte support up",
        body: "The meal map is light on sodium and potassium structure for a training day. Tighten the food flow before chasing more aggressive changes.",
        cta: "Tighten meal support",
      };
    }

    if (primaryLimiter === "Digestion") {
      return {
        title: "Reduce food friction, not total support",
        body: "The current issue is not lack of effort. The athlete is getting capped by food flow, post-workout heaviness, and how the day is organized around digestion.",
        cta: "Clean peri-workout meals",
      };
    }

    if (dietPressureModel.status === "aggressive-deficit" && recoveryHeadroom < 5) {
      return {
        title: "Protect recovery before making the cut harsher",
        body: "Bodyweight is dropping fast relative to the current recovery profile. Hold the urge to push harder until the day stops reading stressed.",
        cta: "Ease diet pressure",
      };
    }

    if (dietingPhase && proteinSupportModel.status === "low") {
      return {
        title: "Raise protein support before cutting harder",
        body: "The diet is already in a deficit context, but protein is still light relative to current size and body-fat level.",
        cta: "Raise protein",
      };
    }

    if (trainingDay && fuelTimingModel.status === "underfueled") {
      return {
        title: "Load the training window first",
        body: "The problem is not total calories everywhere. The session window itself is too light for the current training demand.",
        cta: "Load peri-workout meals",
      };
    }

    if (trainingDay && fuelTimingModel.status === "digestion-heavy") {
      return {
        title: "Clean up the post-workout meal",
        body: "The day has enough food, but too much of the wrong kind is landing where digestion is already vulnerable.",
        cta: "Tighten post meal",
      };
    }

    if (trainingDay && (hydrationSupportModel.status === "low" || hydrationSupportModel.status === "dilute")) {
      return {
        title: "Tighten fluid and electrolyte support",
        body: "The current hydration setup does not quite match the logged day. Make the fluid and sodium plan coherent before you chase more exotic changes.",
        cta: "Balance hydration",
      };
    }

    if (primaryLimiter === "Fullness") {
      return {
        title: "Bias the day toward fuller training output",
        body: "The nutrition plan is not aggressive enough around the training window. The main opportunity is cleaner peri-workout support, not random extra calories everywhere.",
        cta: "Increase peri-workout support",
      };
    }

    if (dietPressureModel.mismatchWithPlan && complianceConfidence.score >= 65) {
      return {
        title: "Trend is flatter than the current target",
        body: "Macros imply a meaningful deficit, but the bodyweight trend is still close to flat. Confirm the day is truly clean before making the next cut.",
        cta: "Review macro target",
      };
    }

    if (calorieDelta < -350) {
      return {
        title: "The plan may be too low for the current look",
        body: "Food is trending low relative to the current demand. Before changing training, confirm that the athlete is not simply under-fueled for the desired look.",
        cta: "Review macro target",
      };
    }

    return {
      title: "Keep the food structure stable",
      body: "The main value now is consistent execution. Do not keep changing meals if the current structure is already doing its job.",
      cta: "Hold meal flow",
    };
  }, [
    primaryLimiter,
    dietPressureModel.status,
    dietPressureModel.mismatchWithPlan,
    recoveryHeadroom,
    recoveryPressureModel.status,
    dietingPhase,
    proteinSupportModel.status,
    complianceConfidence.score,
    trainingDay,
    mealPlanScienceProfile.status,
    fuelTimingModel.status,
    hydrationSupportModel.status,
    calorieDelta,
  ]);

  const nutritionRiskFlags = useMemo(() => {
    const flags: string[] = [];
    const usedDomains = new Set<string>();
    const addFlag = (domain: string, message: string) => {
      if (usedDomains.has(domain)) return;
      usedDomains.add(domain);
      flags.push(message);
    };
    const pre = mealDistribution.pre ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const intra = mealDistribution.intra ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const post = mealDistribution.post ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };

    if (dietPressureModel.status === "aggressive-deficit") {
      addFlag("diet-pressure", "Do not cut food further this week; loss pace is already aggressive.");
    }
    if (dietingPhase && proteinSupportModel.status === "low") {
      addFlag("protein", `Raise protein to ${proteinTarget}g before cutting more carbs or fats.`);
    }
    if (dietPressureModel.mismatchWithPlan && complianceConfidence.score >= 65) {
      addFlag("adherence", "Macros imply a deficit, but the weight trend is still flat. Verify adherence before pulling more food.");
    }
    if (recoveryPressureModel.status === "high") {
      addFlag("recovery", "Hold calories today and reduce training stress before adding more output.");
    }
    if (trainingDay && fuelTimingModel.status === "underfueled") {
      addFlag("training-fuel", "Add 25g carbs before or during training today.");
    }
    if (trainingDay && fuelTimingModel.status === "digestion-heavy") {
      addFlag("digestion", "Move 15g fat out of the post-workout meal.");
    }
    if (mealPlanScienceProfile.status === "light-fiber") {
      addFlag("fiber", "Add one fiber-dense food to a standard meal.");
    }
    if (trainingDay && mealPlanScienceProfile.status === "electrolyte-light") {
      addFlag("electrolytes", "Add sodium and potassium to the training-day food plan.");
    }
    if (trainingDay && mealPlanScienceProfile.status === "digestive-heavy") {
      addFlag("digestion", "Use lower-fat, lower-fiber foods around training today.");
    }
    if (hydrationSupportModel.status === "low") {
      addFlag("hydration", `Drink at least ${trainingDay ? "3.5" : "2.5"}L today.`);
    }
    if (hydrationSupportModel.status === "dilute") {
      addFlag("hydration", `Hold water steady and bring salt to ${Math.max(saltTsp, 1.25).toFixed(2)} tsp.`);
    }
    if (primaryLimiter === "Digestion" && post.fats >= 15) {
      addFlag("digestion", "Keep post-workout fats under 10g.");
    }
    if (trainingDay && intra.count === 0 && intraCarbs === 0) {
      addFlag("training-fuel", "Add intra-workout carbs or an easy pre-workout carb source.");
    }
    if (trainingDay && pre.carbs < 25) {
      addFlag("training-fuel", "Raise pre-workout carbs to at least 25g.");
    }
    if (post.carbs < 35 && trainingDay) {
      addFlag("training-fuel", "Raise post-workout carbs to at least 35g.");
    }
    if (mealTotals.protein < proteinTarget - 20) {
      addFlag("protein", `Add ${proteinTarget - mealTotals.protein}g protein to the meal plan.`);
    }

    return flags.slice(0, 4);
  }, [
    mealDistribution,
    dietPressureModel.status,
    dietPressureModel.mismatchWithPlan,
    recoveryPressureModel.status,
    dietingPhase,
    proteinSupportModel.status,
    complianceConfidence.score,
    mealPlanScienceProfile.status,
    proteinTarget,
    primaryLimiter,
    saltTsp,
    trainingDay,
    fuelTimingModel.status,
    hydrationSupportModel.status,
    intraCarbs,
    mealTotals.protein,
  ]);

  const fuelingBlocks = useMemo(() => {
    const order: Meal["type"][] = trainingDay ? ["pre", "intra", "post", "standard", "off"] : ["off", "standard", "pre", "intra", "post"];
    return order
      .map((type) => {
        const rows = meals.filter((meal) => (meal.type ?? "standard") === type);
        if (rows.length === 0) return null;
        return {
          type,
          rows,
          totals: rows.reduce(
            (acc, meal) => {
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fats += meal.fats;
              return acc;
            },
            { protein: 0, carbs: 0, fats: 0 }
          ),
        };
      })
      .filter(Boolean) as { type: Meal["type"]; rows: Meal[]; totals: { protein: number; carbs: number; fats: number } }[];
  }, [meals, trainingDay]);


  const applySplitTemplate = (template: SplitTemplateId) => {
    setSplitTemplate(template);
    setWorkoutSplit(buildSplitTemplate(template, exerciseLibrary));
    pushChangeLog({
      category: "Training",
      title: `Applied ${splitTemplateOptions.find((item) => item.id === template)?.label ?? template} template`,
      detail: "Split template replaced the current builder layout.",
      impact: "Weekly split structure changed substantially.",
    });
  };

  const addSplitPriorityMuscle = () => {
    if (!splitPriorityMuscleDraft) return;
    setSplitPriorityMuscles((prev) => (prev.includes(splitPriorityMuscleDraft) ? prev : [...prev, splitPriorityMuscleDraft].slice(0, 5)));
  };

  const removeSplitPriorityMuscle = (muscle: string) => {
    setSplitPriorityMuscles((prev) => prev.filter((item) => item !== muscle));
  };

  const updateSplitEstimatedMax = (key: keyof EstimatedMaxes, value: number) => {
    setSplitEstimatedMaxes((prev) => ({
      ...prev,
      [key]: Math.max(0, roundToNearestFive(Number.isFinite(value) ? value : 0)),
    }));
  };

  const autoGenerateSplitFromBuilder = () => {
    const generated = buildSplitFromPreferences(splitTemplate, exerciseLibrary, {
      strengthBias: splitStrengthBias,
      hypertrophyBias: splitHypertrophyBias,
      volumeBias: splitVolumeBias,
      recoveryBias: splitRecoveryBias,
      frequencyBias: splitFrequencyBias,
      intensityBias: splitIntensityBias,
      priorityMuscles: splitPriorityMuscles,
    });

    setWorkoutSplit(generated);
    pushChangeLog({
      category: "Training",
      title: "Auto-generated split from builder",
      detail: `Applied ${splitTemplateOptions.find((item) => item.id === splitTemplate)?.label ?? splitTemplate} with ${splitPriorityMuscles.join(", ") || "no"} priority muscles.`,
      impact: "The split now reflects strength, hypertrophy, volume, recovery, frequency, intensity, and priority-muscle preferences.",
    });
  };

  const splitBuilderStats = useMemo(() => {
    const totalExercises = workoutSplit.reduce((sum, day) => sum + day.exercises.length, 0);
    const averageSets =
      totalExercises === 0
        ? 0
        : Number(
            (
              workoutSplit.reduce(
                (sum, day) => sum + day.exercises.reduce((inner, ex) => inner + ex.sets, 0),
                0
              ) / totalExercises
            ).toFixed(1)
          );

    return {
      totalDays: workoutSplit.length,
      totalExercises,
      averageSets,
    };
  }, [workoutSplit]);

  const splitMuscleFrequency = useMemo(() => {
    const counts = new Map<string, number>();

    workoutSplit.forEach((day) => {
      const musclesHit = new Set<string>();
      day.exercises.forEach((exercise) => {
        const libItem = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
        if (!libItem) return;
        const biases = (libItem.muscleBias ?? []).slice(0, 2);
        biases.forEach((bias) => musclesHit.add(bias.muscle));
      });
      musclesHit.forEach((muscle) => {
        counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([muscle, frequency]) => ({ muscle, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);
  }, [workoutSplit, exerciseLibrary]);

  const splitRegionAnalysis = useMemo(() => {
    const buckets = {
      Chest: { hardSets: 0, fatigue: 0 },
      Back: { hardSets: 0, fatigue: 0 },
      Delts: { hardSets: 0, fatigue: 0 },
      Arms: { hardSets: 0, fatigue: 0 },
      Quads: { hardSets: 0, fatigue: 0 },
      Hamstrings: { hardSets: 0, fatigue: 0 },
      Glutes: { hardSets: 0, fatigue: 0 },
      Calves: { hardSets: 0, fatigue: 0 },
    } as Record<string, { hardSets: number; fatigue: number }>;

    workoutSplit.forEach((day) => {
      day.exercises.forEach((exercise) => {
        const libItem = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
        if (!libItem) return;
        const systemic = Number(libItem.systemicFatigue ?? 0);
        const fatigue = Number(libItem.fatigue ?? 0);
        (libItem.muscleBias ?? []).slice(0, 2).forEach((bias) => {
          const muscle = bias.muscle;
          if (!buckets[muscle]) return;
          const contribution = (bias.contribution ?? 0) / 100;
          buckets[muscle].hardSets += exercise.sets * contribution;
          buckets[muscle].fatigue += (fatigue + systemic * 0.7) * contribution;
        });
      });
    });

    return Object.entries(buckets)
      .map(([region, values]) => ({
        region,
        hardSets: Number(values.hardSets.toFixed(1)),
        fatigue: Number(values.fatigue.toFixed(1)),
      }))
      .filter((item) => item.hardSets > 0 || item.fatigue > 0)
      .sort((a, b) => b.hardSets - a.hardSets);
  }, [workoutSplit, exerciseLibrary]);

  const splitUndertrainedPriorities = useMemo(() => {
    return splitRegionAnalysis
      .filter((item) => item.hardSets > 0 && item.hardSets < 6)
      .sort((a, b) => a.hardSets - b.hardSets)
      .slice(0, 4);
  }, [splitRegionAnalysis]);

  const splitDuplicatePatterns = useMemo(() => {
    const counts = new Map<string, number>();
    workoutSplit.forEach((day) => {
      day.exercises.forEach((exercise) => {
        const libItem = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
        const category = libItem?.category ?? "Unknown";
        counts.set(category, (counts.get(category) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));
  }, [workoutSplit, exerciseLibrary]);

  const splitSystemicByDay = useMemo(() => {
    return workoutSplit.map((day) => ({
      day: day.day,
      systemic: Math.round(day.systemicLoad),
      totalSets: day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    }));
  }, [workoutSplit]);

  const residualBodyPartMap = useMemo(() => {
    const regionKeys = ["Chest", "Shoulders", "Back", "Quads", "Hamstrings"];
    const carry: Record<string, number> = Object.fromEntries(regionKeys.map((key) => [key, 0]));

    const normalizeRegion = (muscle: string) => {
      if (["Chest"].includes(muscle)) return "Chest";
      if (["Delts", "Arms"].includes(muscle)) return "Shoulders";
      if (["Back"].includes(muscle)) return "Back";
      if (["Quads"].includes(muscle)) return "Quads";
      if (["Hamstrings", "Glutes"].includes(muscle)) return "Hamstrings";
      return null;
    };

    const sleepFactor = clamp((sleepHours - 5.5) / 3.5, 0, 1);
    const sleepQualityFactor = clamp(sleepQuality / 10, 0, 1);
    const digestionFactor = clamp(digestion / 10, 0, 1);
    const compoundRecoveryFactor = clamp((compoundTotals.recovery + 6) / 12, 0, 1);
    const systemicPenalty = clamp(avgSystemicLoad / 10, 0, 1);

    const recoveryDecayBase = clamp(
      0.5 + sleepFactor * 0.14 + sleepQualityFactor * 0.1 + digestionFactor * 0.08 + compoundRecoveryFactor * 0.08 - systemicPenalty * 0.1,
      0.38,
      0.82
    );

    const regionRecoveryBias: Record<string, number> = {
      Chest: 0.02,
      Shoulders: 0.04,
      Back: -0.04,
      Quads: -0.03,
      Hamstrings: -0.05,
    };

    return regionKeys.map((region) => {
      const days = workoutSplit.map((day) => {
        const daySystemic = clamp(day.systemicLoad / 10, 0, 1);
        const regionDecay = clamp(recoveryDecayBase + (regionRecoveryBias[region] ?? 0) - daySystemic * 0.04, 0.32, 0.88);
        carry[region] = carry[region] * (1 - regionDecay);

        const added = day.exercises.reduce((sum, exercise) => {
          const lib = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
          if (!lib) return sum;
          const biasWeight = ((lib.muscleBias ?? [])
            .map((item) => ({ ...item, region: normalizeRegion(item.muscle) }))
            .filter((item) => item.region === region)
            .reduce((inner, item) => inner + (item.contribution ?? 0), 0)) / 100;
          if (!biasWeight) return sum;

          const local = Number(lib.fatigue ?? 5);
          const systemic = Number(lib.systemicFatigue ?? 4);
          const rirFactor = exercise.rir <= 1 ? 1.14 : exercise.rir === 2 ? 1 : 0.88;
          const setFactor = exercise.sets;
          const stimulus = (local * 0.95 + systemic * 0.42 + day.intensity * 0.18 + day.volume * 0.12) * biasWeight * setFactor * rirFactor;
          return sum + stimulus;
        }, 0);

        carry[region] = clamp(Number((carry[region] + added).toFixed(1)), 0, 100);
        return {
          day: day.day,
          value: carry[region],
          readyIn: carry[region] >= 70 ? "Not ready" : carry[region] >= 40 ? "Borderline" : "Ready",
        };
      });

      return { region, days };
    }).filter((item) => item.days.some((day) => day.value > 0));
  }, [workoutSplit, exerciseLibrary, sleepHours, sleepQuality, digestion, compoundTotals.recovery, avgSystemicLoad]);

  const splitPrioritySummary = useMemo(() => {
    const topPriority = splitUndertrainedPriorities[0];
    const topDuplication = splitDuplicatePatterns[0];
    const highestFatigue = splitRegionAnalysis[0];

    return {
      topPriority: topPriority ? `${topPriority.region} needs one clearer direct slot.` : "No obvious low-volume region.",
      duplication: topDuplication ? `${topDuplication.category} shows up ${topDuplication.count} times.` : "No obvious repeated movement pattern.",
      fatigue: highestFatigue ? `${highestFatigue.region} carries the highest weekly cost.` : "No obvious regional fatigue hotspot.",
    };
  }, [splitUndertrainedPriorities, splitDuplicatePatterns, splitRegionAnalysis]);

  const splitPrimaryAction = useMemo(() => {
    if (adaptationSnapshot.primaryAction.code === "fix-delivery") {
      return {
        title: adaptationSnapshot.primaryAction.title,
        body: adaptationSnapshot.primaryAction.detail,
        cta: "Hold progression",
      };
    }

    if (adaptationSnapshot.primaryAction.code === "reduce-fatigue") {
      return {
        title: adaptationSnapshot.primaryAction.title,
        body: adaptationSnapshot.primaryAction.detail,
        cta: "Reduce fatigue cost",
      };
    }

    if (recoveryHeadroom < 4.5 && avgSystemicLoad >= 7) {
      return {
        title: "Reduce weekly cost before adding work",
        body: "Recovery headroom is too low for the current week. Cut sets or load before you add another exercise or training day.",
        cta: "Lower weekly load",
      };
    }

    if (splitUndertrainedPriorities.length > 0) {
      return {
        title: `Add one direct slot for ${splitUndertrainedPriorities[0].region}`,
        body: "The week is light here. Add or swap one exercise before rebuilding the whole split.",
        cta: "Add one slot",
      };
    }

    if (splitDuplicatePatterns.length > 0) {
      return {
        title: "Swap one repeated movement pattern",
        body: "Too many exercises are solving the same job. Replace one repeated slot before adding more work.",
        cta: "Swap one slot",
      };
    }

    return {
      title: "The week structure is workable",
      body: "The split does not need a rebuild. Edit the selected day or swap one exercise only when you have a clear reason.",
      cta: "Refine selected day",
    };
  }, [adaptationSnapshot.primaryAction, recoveryHeadroom, avgSystemicLoad, splitUndertrainedPriorities, splitDuplicatePatterns]);

  const splitWeekPlanCards = useMemo(() => {
    return workoutSplit.map((day) => ({
      id: day.id,
      day: day.day,
      focus: day.focus,
      sets: day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
      exercises: day.exercises.length,
      systemicLoad: day.systemicLoad,
      intensity: day.intensity,
      volume: day.volume,
      isRest: day.focus.toLowerCase() === "rest",
    }));
  }, [workoutSplit]);

  const splitExecutionRisks = useMemo(() => {
    const flags: string[] = [];
    if (recoveryHeadroom < 4.5 && avgSystemicLoad >= 7) flags.push("Recovery headroom is too low for the current systemic load.");
    if (avgVolume >= 8 && recoveryScore <= 6) flags.push("Average volume is too aggressive for the current recovery state.");
    if (splitUndertrainedPriorities.length > 0) flags.push(`${splitUndertrainedPriorities[0].region} is likely underdosed across the week.`);
    if (splitDuplicatePatterns.length > 0) flags.push(`${splitDuplicatePatterns[0].category} patterns are being repeated too often.`);
    if (workoutSplit.some((day) => day.focus.toLowerCase() !== "rest" && day.exercises.length < 3)) flags.push("At least one active day is too thin to feel like a real session.");
    adaptationSnapshot.flags.forEach((flag) => flags.push(flag));
    return flags.slice(0, 4);
  }, [recoveryHeadroom, avgSystemicLoad, avgVolume, recoveryScore, splitUndertrainedPriorities, splitDuplicatePatterns, workoutSplit, adaptationSnapshot.flags]);


  const totalWeeklyCompoundDose = useMemo(() => {
    return enabledCompounds.reduce((sum, compound) => {
      return sum + getCompoundWeeklyTotal(compound, compoundTrainingDaysPerWeek);
    }, 0);
  }, [compoundTrainingDaysPerWeek, enabledCompounds]);

  const stackAndrogenicRating = useMemo(() => {
    return Math.round(
      enabledCompounds.reduce((sum, compound) => {
        const weeklyTotal = getCompoundWeeklyTotal(compound, compoundTrainingDaysPerWeek);
        return sum + ((compound.androgenicRating ?? 0) * weeklyTotal) / 100;
      }, 0)
    );
  }, [compoundTrainingDaysPerWeek, enabledCompounds]);

  const stackAnabolicRating = useMemo(() => {
    return Math.round(
      enabledCompounds.reduce((sum, compound) => {
        const weeklyTotal = getCompoundWeeklyTotal(compound, compoundTrainingDaysPerWeek);
        return sum + ((compound.anabolicRating ?? 0) * weeklyTotal) / 100;
      }, 0)
    );
  }, [compoundTrainingDaysPerWeek, enabledCompounds]);

  const compoundDailyBurden = useMemo(() => {
    return scheduleDayOrder.map((day) => {
      const row = { day, base: 0, performance: 0, orals: 0, ancillary: 0 };
      enabledCompounds.forEach((compound) => {
        const entries = compound.schedule ?? [];
        const explicit = entries
          .filter((entry) => entry.day === day || entry.day === "Daily" || entry.day === "Training")
          .reduce((sum, entry) => {
            if (entry.day === "Daily") {
              return sum + rowAmount(entry.amount, compound.unit, 1);
            }
            if (entry.day === "Training") {
              const isTrainingDay = workoutSplit[scheduleDayOrder.indexOf(day)]?.focus?.toLowerCase() !== "rest";
              return sum + (isTrainingDay ? rowAmount(entry.amount, compound.unit, 1) : 0);
            }
            return sum + rowAmount(entry.amount, compound.unit, 1);
          }, 0);
        const fallback = entries.length === 0 ? getCompoundWeeklyTotal(compound, compoundTrainingDaysPerWeek) / 7 : 0;
        const amount = explicit || fallback;
        if (compound.category === "Base") row.base += amount;
        if (compound.category === "Performance") row.performance += amount;
        if (compound.category === "Orals") row.orals += amount;
        if (compound.category === "Ancillary") row.ancillary += amount;
      });
      return row;
    });
  }, [compoundTrainingDaysPerWeek, enabledCompounds, workoutSplit]);

  const compoundScheduleGaps = useMemo(() => {
    return enabledCompounds.filter((compound) => (compound.schedule ?? []).length === 0).map((compound) => compound.name);
  }, [enabledCompounds]);

  const compoundsPrimaryAction = useMemo(() => {
    if (compoundScheduleGaps.length > 0) {
      return {
        title: "Clean up unscheduled compounds first",
        body: "Right now part of the stack is still floating on base dose fields instead of a real weekly schedule. That makes the plan harder to trust and harder to review.",
        cta: "Fix schedules",
      };
    }

    if (compoundTotals.stress >= 10 && recoveryScore <= 6.5) {
      return {
        title: "Reduce total stack burden",
        body: "The stack is adding more stress than the current recovery profile can support. This is a burden problem before it is a signal problem.",
        cta: "Reduce burden",
      };
    }

    if (primaryLimiter === "Dryness") {
      return {
        title: "Stop adding more dry signal blindly",
        body: "The current look issue is not solved by stacking more harsh dryness. The job is aligning the stack with food, water, and weekly execution.",
        cta: "Review stack balance",
      };
    }

    if (primaryLimiter === "Fullness") {
      return {
        title: "Bias the stack toward usable support",
        body: "The week likely needs more usable fullness/performance support, not more random compounds or complexity.",
        cta: "Review support",
      };
    }

    return {
      title: "The stack is mostly structured: reduce noise",
      body: "There is no obvious emergency in the compound setup. The next gain comes from cleaner scheduling and fewer unnecessary moving parts.",
      cta: "Refine stack",
    };
  }, [compoundScheduleGaps, compoundTotals.stress, recoveryScore, primaryLimiter]);

  const compoundRiskFlags = useMemo(() => {
    const flags: string[] = [];
    enabledCompounds.forEach((compound) => {
      const mismatchFlags = getCompoundMismatchFlags(compound, {
        hasAromatizableBase: hasCompoundMatch(enabledCompounds, /test|methen|dbol|dianabol|tbol/i),
        hasGh: hasCompoundMatch(enabledCompounds, /gh|somat/i),
        hasInsulin: hasCompoundMatch(enabledCompounds, /insulin|humalog|lantus|novolog/i),
        hasFoodLimiter: hasScienceFlag(enabledCompounds, (science) => Boolean(science?.digestionLimiter)),
        estrogenValue: clamp(4 + fullnessScore * 0.4 - drynessScore * 0.15, 0, 10),
        waterValue: clamp(4 + waterLiters * 0.5 + saltTsp * 0.6 - drynessScore * 0.2, 0, 10),
      });
      mismatchFlags.forEach((flag) => flags.push(flag));
    });
    if (compoundScheduleGaps.length > 0) flags.push(`${compoundScheduleGaps.length} compounds still have no explicit weekly schedule.`);
    if (compoundTotals.stress >= 10 && recoveryScore <= 6.5) flags.push("Stack stress looks too high for the current recovery state.");
    if (compoundTotals.digestion <= -6 && primaryLimiter === "Digestion") flags.push("The stack is contributing meaningful digestive drag while digestion is already the main limiter.");
    if (stackAndrogenicRating > stackAnabolicRating * 0.85 && primaryLimiter !== "Dryness") flags.push("The stack reads very androgenic relative to the current phase goals.");
    if (enabledCompounds.length >= 6) flags.push("The stack is getting crowded. Complexity is becoming a real problem.");
    return Array.from(new Set(flags)).slice(0, 6);
  }, [
    compoundScheduleGaps,
    compoundTotals.stress,
    recoveryScore,
    compoundTotals.digestion,
    primaryLimiter,
    stackAndrogenicRating,
    stackAnabolicRating,
    enabledCompounds,
    fullnessScore,
    drynessScore,
    waterLiters,
    saltTsp,
  ]);

  const drynessLimiterReason = useMemo(() => {
    const reasons: string[] = [];
    if (intraCarbs > 110) reasons.push(`intra carbs are still high at ${intraCarbs}g`);
    if (saltTsp > 2) reasons.push(`salt is still high at ${saltTsp.toFixed(2)} tsp`);
    if (waterLiters > 4.5) reasons.push(`water is still high at ${waterLiters.toFixed(1)} L`);
    if (compoundTotals.dryness <= 0) reasons.push("the stack is not giving much usable dry signal");
    if (fullnessScore < 6.5) reasons.push("fullness is still too soft to let dryness read cleanly");

    if (reasons.length === 0) {
      return "";
    }

    return `Dryness currently reads ${drynessScore.toFixed(1)} out of 10 because ${reasons[0]}${reasons[1] ? ` and ${reasons[1]}` : ""}.`;
  }, [compoundTotals.dryness, drynessScore, fullnessScore, intraCarbs, saltTsp, waterLiters]);

  const compoundSignalSummary = useMemo(() => {
    return [
      { label: "Fullness signal", value: clamp(5 + compoundTotals.fullness * 0.22, 0, 10), helper: "How much the stack pushes fullness" },
      { label: "Dryness signal", value: clamp(5 + compoundTotals.dryness * 0.22, 0, 10), helper: "How hard the stack pushes dryness" },
      { label: "Performance support", value: clamp(5 + compoundTotals.performance * 0.2, 0, 10), helper: "Training support from compounds" },
      { label: "Burden", value: clamp(4 + compoundTotals.stress * 0.35, 0, 10), helper: "Overall stress cost of the stack" },
    ];
  }, [compoundTotals]);

  const compoundWeekBurdenSummary = useMemo(() => {
    const busiest = compoundDailyBurden.reduce(
      (best, current) => ((current.base + current.performance + current.orals + current.ancillary) > (best.base + best.performance + best.orals + best.ancillary) ? current : best),
      compoundDailyBurden[0] ?? { day: "Mon", base: 0, performance: 0, orals: 0, ancillary: 0 }
    );
    return {
      busiestDay: busiest.day,
      busiestTotal: busiest.base + busiest.performance + busiest.orals + busiest.ancillary,
    };
  }, [compoundDailyBurden]);
  const compoundExposureChart = useMemo(() => {
    const lines = enabledCompounds.map((compound, index) => ({
      key: `compound_${index}`,
      label: displayCompoundName(compound),
      color: compoundExposurePalette[index % compoundExposurePalette.length],
      compound,
    }));

    const steadyStateDays = 16 * 7;
    const steadyWeek = scheduleDayOrder.map((day) => ({ label: day, total: 0 })) as Array<Record<string, string | number>>;
    const weekByWeek = Array.from({ length: 16 }, (_, index) => ({
      label: `Week ${index + 1}`,
      total: 0,
    })) as Array<Record<string, string | number>>;

    lines.forEach((line) => {
      const steadyStateSeries = simulateCompoundExposure(line.compound, workoutSplit, steadyStateDays + 7).slice(-7);
      steadyStateSeries.forEach((value, index) => {
        steadyWeek[index][line.key] = Number(value.toFixed(1));
        steadyWeek[index].total = Number((Number(steadyWeek[index].total ?? 0) + value).toFixed(1));
      });

      const buildSeries = simulateCompoundExposure(line.compound, workoutSplit, 16 * 7);
      for (let weekIndex = 0; weekIndex < 16; weekIndex += 1) {
        const weekSlice = buildSeries.slice(weekIndex * 7, weekIndex * 7 + 7);
        const weekAverage =
          weekSlice.length > 0
            ? weekSlice.reduce((sum, value) => sum + value, 0) / weekSlice.length
            : 0;
        weekByWeek[weekIndex][line.key] = Number(weekAverage.toFixed(1));
        weekByWeek[weekIndex].total = Number((Number(weekByWeek[weekIndex].total ?? 0) + weekAverage).toFixed(1));
      }
    });

    return {
      weekly: steadyWeek,
      progression: weekByWeek,
      lines,
      totalColor: "#0f172a",
    };
  }, [enabledCompounds, workoutSplit]);

  const scheduleByCategory = useMemo(() => {
    return schedule.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [schedule]);

  const addTrainingDay = (mode: "training" | "rest" = "training") => {
    setWorkoutSplit((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        day: `Day ${prev.length + 1}`,
        focus: mode === "rest" ? "Rest" : "New Focus",
        intensity: mode === "rest" ? 2 : 7,
        volume: mode === "rest" ? 1 : 7,
        systemicLoad: mode === "rest" ? 1 : 7,
        exercises: [],
        pickerSearch: "",
        pickerCategory: "All",
        pickerMuscle: "All",
        pickerFatigue: "All",
      },
    ]);
    pushChangeLog({
      category: "Training",
      title: mode === "rest" ? "Added rest day" : "Added training day",
      detail: `Split now contains ${workoutSplit.length + 1} total days.`,
      impact: "Training structure changed and may alter weekly load distribution.",
    });
  };

  const addExerciseToDay = (dayId: string) => {
    const fallbackExercise = exerciseLibrary[0];
    if (!fallbackExercise) return;

    setWorkoutSplit((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  exerciseId: fallbackExercise.id,
                  sets: 3,
                  repRange: "8-12",
                  rir: 2,
                  note: "",
                },
              ],
            }
          : day
      )
    );
  };

  const autofillDayByFocus = (dayId: string) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const focus = day.focus.toLowerCase();
        const matched =
          focus.includes("push")
            ? buildSplitTemplate("ppl6", exerciseLibrary)[0]?.exercises ?? []
            : focus.includes("pull")
              ? buildSplitTemplate("ppl6", exerciseLibrary)[1]?.exercises ?? []
              : focus.includes("leg") || focus.includes("lower")
                ? buildSplitTemplate("ppl6", exerciseLibrary)[2]?.exercises ?? []
                : focus.includes("upper")
                  ? buildSplitTemplate("upperlower", exerciseLibrary)[0]?.exercises ?? []
                  : buildSplitTemplate("ppl6", exerciseLibrary)[0]?.exercises ?? [];

        if (matched.length === 0) return day;
        return { ...day, exercises: matched };
      })
    );
  };

  const moveExerciseWithinDay = (dayId: string, index: number, direction: -1 | 1) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= day.exercises.length) return day;
        const nextExercises = [...day.exercises];
        const temp = nextExercises[index];
        nextExercises[index] = nextExercises[nextIndex];
        nextExercises[nextIndex] = temp;
        return { ...day, exercises: nextExercises };
      })
    );
  };

  const duplicateExerciseWithinDay = (dayId: string, index: number) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const target = day.exercises[index];
        if (!target) return day;
        const nextExercises = [...day.exercises];
        nextExercises.splice(index + 1, 0, {
          ...target,
          note: target.note ? `${target.note}, copy` : "Copy",
        });
        return { ...day, exercises: nextExercises };
      })
    );
  };

  const deleteExerciseWithinDay = (dayId: string, index: number) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
        };
      })
    );
  };

  const updateWorkoutDay = <K extends keyof WorkoutDay>(dayId: string, key: K, value: WorkoutDay[K]) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, [key]: value } : day))
    );
  };

  const updateWorkoutExercise = (
    dayId: string,
    index: number,
    key: keyof WorkoutDay["exercises"][number],
    value: WorkoutDay["exercises"][number][keyof WorkoutDay["exercises"][number]]
  ) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const nextExercises = [...day.exercises];
        const current = nextExercises[index];
        if (!current) return day;
        nextExercises[index] = { ...current, [key]: value };
        return { ...day, exercises: nextExercises };
      })
    );
  };

  const updateTrackerDay = <K extends keyof TrackerDay>(dayId: string, key: K, value: TrackerDay[K]) => {
    if (key === "bodyWeight") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) setBodyWeight(parsed);
    }

    if (key === "steps") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) setSteps(parsed);
    }

    setTrackerDays((prev) =>
      prev.map((day) =>
        day.id === dayId ? withDerivedCompletion({ ...day, [key]: value }) : day
      )
    );
  };

  const syncWearableSnapshot = (snapshot: Omit<WearableRecoverySnapshot, "id">) => {
    const nextSnapshot: WearableRecoverySnapshot = {
      ...snapshot,
      id: `wearable-${Date.now()}`,
    };
    const energyFromRecovery =
      snapshot.recoveryStatus === "green" ? "4" : snapshot.recoveryStatus === "red" ? "2" : "3";

    setWearableSnapshots((prev) => [nextSnapshot, ...prev.filter((item) => item.id !== nextSnapshot.id)].slice(0, 45));
    setSleepHours(snapshot.sleepHours);
    setSleepQuality(clamp(Math.round(snapshot.sleepScore / 10), 1, 10));
    setSteps(snapshot.steps);
    setTrackerDays((prev) =>
      prev.map((day) => {
        if (day.date !== snapshot.date) return day;
        const noteLine = `Wearable sync: ${snapshot.source}, sleep ${snapshot.sleepHours.toFixed(1)}h, HRV ${snapshot.hrvMs}ms, RHR ${snapshot.restingHeartRate}.`;
        const nextNotes = day.notes.includes(noteLine)
          ? day.notes
          : [day.notes, noteLine].filter(Boolean).join("\n");

        return withDerivedCompletion({
          ...day,
          steps: String(snapshot.steps),
          energy: day.energy || energyFromRecovery,
          notes: nextNotes,
        });
      })
    );
    pushChangeLog({
      category: "Recovery",
      title: `Synced ${snapshot.source} recovery data`,
      detail: `${snapshot.steps.toLocaleString()} steps, ${snapshot.sleepHours.toFixed(1)}h sleep, recovery ${snapshot.recoveryStatus}.`,
      impact: "Today, recovery score, step status, and coach review now share the same imported recovery context.",
    });
  };

  const closeTrackerDay = (dayId: string, note: string) => {
    const sourceDay = trackerDays.find((day) => day.id === dayId);
    if (!sourceDay) return;

    const targetStepValue = String(activeStepTarget);
    const bodyWeightValue = bodyWeight.toFixed(1);
    const closedAt = new Date().toISOString();
    const openLiftCount = sourceDay.lifts.filter((lift) => !lift.completed).length;
    const openTaskCount = trackerTasks.filter((task) => !task.done).length;
    const proteinOpen = Math.max(0, proteinTarget - todayFuelSummary.proteinConsumed);
    const loggedStepValue = Number(sourceDay.steps || targetStepValue) || 0;
    const stepNeedsReview = loggedStepValue < activeStepTarget;
    const foodNeedsReview =
      todayFuelSummary.foodEntriesLogged === 0 ||
      todayFuelSummary.calorieRemaining > 250 ||
      proteinOpen > 25;

    setTrackerDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;

        const nextSteps = String(day.steps ?? "").trim() || targetStepValue;
        const nextBodyWeight = String(day.bodyWeight ?? "").trim() || bodyWeightValue;
        const nextEnergy = String(day.energy ?? "").trim() || "3";
        const missingAfter = [
          !nextSteps ? "steps" : "",
          !nextBodyWeight ? "bodyweight" : "",
          !nextEnergy ? "energy" : "",
        ].filter(Boolean);
        const closeoutStatus =
          missingAfter.length === 0 && day.lifts.every((lift) => lift.completed)
          && openTaskCount === 0
          && !stepNeedsReview
          && !foodNeedsReview
          ? "closed"
          : "needs-review";

        return withDerivedCompletion({
          ...day,
          steps: nextSteps,
          bodyWeight: nextBodyWeight,
          energy: nextEnergy,
          closedAt,
          closeoutStatus,
          closeoutNote: note.trim(),
        });
      })
    );

    setSteps(Number(sourceDay.steps || targetStepValue) || 0);
    const reviewParts = [
      stepNeedsReview
        ? `${Math.max(0, activeStepTarget - loggedStepValue).toLocaleString()} steps still remain.`
        : "",
      openLiftCount > 0
        ? `${openLiftCount} lift${openLiftCount === 1 ? "" : "s"} still need review.`
        : "",
      openTaskCount > 0
        ? `${openTaskCount} task${openTaskCount === 1 ? "" : "s"} still open.`
        : "",
      foodNeedsReview
        ? todayFuelSummary.foodEntriesLogged === 0
          ? "No food has been logged yet."
          : `${Math.max(0, todayFuelSummary.calorieRemaining)} kcal and ${proteinOpen}g protein still need review.`
        : "",
    ].filter(Boolean);
    pushChangeLog({
      category: "Recovery",
      title: `${sourceDay.title} closeout saved`,
      detail: reviewParts.length > 0 ? reviewParts.join(" ") : "All planned lifts and tasks were already complete.",
      impact: note.trim() || "Daily basics, completion state, and coach review now share a saved closeout.",
    });
  };

  const updateTrackerLift = (dayId: string, liftId: string, updates: Partial<TrackerLift>) => {
    setTrackerDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        return withDerivedCompletion({
          ...day,
          lifts: day.lifts.map((lift) => (lift.id === liftId ? { ...lift, ...updates } : lift)),
        });
      })
    );
  };

  const addTrackerLift = (dayId: string) => {
    setTrackerDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        return withDerivedCompletion({
          ...day,
          lifts: [
            ...day.lifts,
            {
              id: `${dayId}-${Date.now()}`,
              name: "Accessory lift",
              plannedSets: 3,
              plannedReps: "8-12",
              rir: "2",
              completed: false,
              actualSets: "",
              actualReps: "",
              weight: "",
              rpe: "",
              notes: "",
            },
          ],
        });
      })
    );
  };

  const updateTrackerTask = (taskId: string, updates: Partial<TrackerTask>) => {
    setTrackerTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
  };

  const addTrackerTask = () => {
    setTrackerTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: "Review follow-up",
        category: activeAthlete.name,
        target: "Medium",
        done: false,
      },
    ]);
  };

  const removeTrackerTask = (taskId: string) => {
    setTrackerTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const addScheduleEvent = () => {
    setSchedule((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        day: selectedCalendarDayRule,
        time: "08:00",
        title: `${selectedCalendarSessionLabel} detail`,
        category: "Training",
        detail: "Add the exact work, meals, or support needed for this selected day.",
      },
    ]);
  };

  const updateScheduleEvent = <K extends keyof ScheduleEventLocal>(eventId: string, key: K, value: ScheduleEventLocal[K]) => {
    setSchedule((prev) => prev.map((item) => (item.id === eventId ? { ...item, [key]: value } : item)));
  };

  const removeScheduleEvent = (eventId: string) => {
    setSchedule((prev) => prev.filter((item) => item.id !== eventId));
  };

  const addCompoundFromLibrary = () => {
    const match = compoundLibraryCatalog.find((item) => item.id === compoundLibrarySelection);
    if (!match) return;

    const matchMeta = match as typeof match & {
      halfLifeDays?: number;
      halfLife?: number;
      unit?: string;
      note?: string;
      category?: Compound["category"];
      schedule?: Compound["schedule"];
      fullness?: number;
      dryness?: number;
      performance?: number;
      recovery?: number;
      stress?: number;
      digestion?: number;
      anabolicRating?: number;
      androgenicRating?: number;
      science?: CompoundScienceProfile;
      dose?: number;
    };

    const next: Compound = {
      id: `${match.id}-${Date.now()}`,
      name: match.name,
      category: matchMeta.category ?? "Ancillary",
      enabled: true,
      dose: matchMeta.dose ?? 0,
      halfLifeDays: matchMeta.halfLifeDays ?? matchMeta.halfLife ?? 0,
      unit: matchMeta.unit ?? "mg/week",
      note: matchMeta.note ?? "",
      fullness: matchMeta.fullness ?? 0,
      dryness: matchMeta.dryness ?? 0,
      performance: matchMeta.performance ?? 0,
      recovery: matchMeta.recovery ?? 0,
      stress: matchMeta.stress ?? 0,
      digestion: matchMeta.digestion ?? 0,
      anabolicRating: matchMeta.anabolicRating ?? 0,
      androgenicRating: matchMeta.androgenicRating ?? 0,
      science: matchMeta.science,
      schedule: matchMeta.schedule ?? [],
    };
    const nextWeeklyTotal = getCompoundWeeklyTotal(next, compoundTrainingDaysPerWeek);

    setCompounds((prev) => hydrateCompoundScience([...prev, next]));
    pushChangeLog({
      category: "Compounds",
      title: `Added ${match.name}`,
      detail: `${nextWeeklyTotal} ${matchMeta.unit ?? "mg/week"} scheduled weekly`,
      impact: `Stack dose now ${totalWeeklyCompoundDose + nextWeeklyTotal} total scheduled units before adjustments.`,
    });
  };

  const addCustomCompound = () => {
    if (!customCompoundName.trim()) return;

    const next: Compound = {
      id: `custom-${Date.now()}`,
      name: customCompoundName.trim(),
      category: "Ancillary",
      enabled: true,
      dose: 0,
      halfLifeDays: customCompoundHalfLife,
      unit: "mg/week",
      note: "Custom compound entry.",
      fullness: 0,
      dryness: 0,
      performance: 0,
      recovery: 0,
      stress: 0,
      digestion: 0,
      anabolicRating: customCompoundAnabolic,
      androgenicRating: customCompoundAndrogenic,
      schedule: [],
    };

    setCompounds((prev) => hydrateCompoundScience([...prev, next]));
    setCustomCompoundName("");
  };

  const updateCompound = <K extends keyof Compound>(compoundId: string, key: K, value: Compound[K]) => {
    setCompounds((prev) =>
      hydrateCompoundScience(prev.map((compound) => (compound.id === compoundId ? { ...compound, [key]: value } : compound)))
    );
  };

  const removeCompound = (compoundId: string) => {
    setCompounds((prev) => prev.filter((compound) => compound.id !== compoundId));
  };

  const addCompoundScheduleRow = (compoundId: string) => {
    setCompounds((prev) =>
      hydrateCompoundScience(
        prev.map((compound) => {
          if (compound.id !== compoundId) return compound;
          return {
            ...compound,
            schedule: [
              ...(compound.schedule ?? []),
              { id: `${compoundId}-${Date.now()}`, day: "Mon", amount: compound.dose || 0 },
            ],
          };
        })
      )
    );
  };

  const updateCompoundScheduleRow = (
    compoundId: string,
    rowId: string,
    updates: Partial<NonNullable<Compound["schedule"]>[number]>
  ) => {
    setCompounds((prev) =>
      hydrateCompoundScience(
        prev.map((compound) => {
          if (compound.id !== compoundId) return compound;
          return {
            ...compound,
            schedule: (compound.schedule ?? []).map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
          };
        })
      )
    );
  };

  const deleteCompoundScheduleRow = (compoundId: string, rowId: string) => {
    setCompounds((prev) =>
      hydrateCompoundScience(
        prev.map((compound) => {
          if (compound.id !== compoundId) return compound;
          return {
            ...compound,
            schedule: (compound.schedule ?? []).filter((row) => row.id !== rowId),
          };
        })
      )
    );
  };

  const updateFirstMealOfType = (
    type: Meal["type"],
    updater: (meal: Meal) => Meal
  ) => {
    setMeals((prev) => {
      let touched = false;
      return prev.map((meal) => {
        const mealType = meal.type ?? "standard";
        if (touched || mealType !== type || (meal.foodEntries?.length ?? 0) > 0) return meal;
        touched = true;
        return updater(meal);
      });
    });
  };

  const nutritionPreset = useMemo(() => {
    if (dietPressureModel.status === "aggressive-deficit" && recoveryScore < 6.5) {
      return "Ease the deficit slightly and protect recovery";
    }

    if (dietingPhase && proteinSupportModel.status === "low") {
      return "Raise protein before pulling more food";
    }

    if (trainingDay) {
      if (fuelTimingModel.status === "underfueled") return "Load the training window before changing the whole diet";
      if (fuelTimingModel.status === "digestion-heavy") return "Clean up the post-workout meal and keep the window lighter";
      if (hydrationSupportModel.status === "low" || hydrationSupportModel.status === "dilute") {
        return "Tighten fluid and electrolyte support";
      }
      if (primaryLimiter === "Fullness") return "Increase peri-workout carbs slightly";
      if (primaryLimiter === "Digestion") return "Keep carbs but lower food volume around training";
      return "Hold current training-day distribution";
    }

    if (recoveryScore < 6.5) return "Keep off-day food supportive, not overly low";
    return "Run a cleaner off-day macro split";
  }, [
    dietPressureModel.status,
    recoveryScore,
    dietingPhase,
    proteinSupportModel.status,
    trainingDay,
    fuelTimingModel.status,
    hydrationSupportModel.status,
    primaryLimiter,
  ]);

  const applyMacroPreset = () => {
    if (dietPressureModel.status === "aggressive-deficit" && recoveryHeadroom < 5) {
      if (trainingDay) {
        setCarbTarget((prev) => prev + 20);
        setIntraCarbs((prev) => Math.max(prev, 40));
      } else {
        setFatTarget((prev) => prev + 5);
      }
      pushChangeLog({
        category: "Nutrition",
        title: "Eased diet pressure slightly",
        detail: trainingDay ? "+20 carbs and a protected intra floor on the training day." : "+5g fats on the off day.",
        impact: "Should reduce recovery drag without rewriting the whole meal map.",
      });
      return;
    }

    if (dietingPhase && proteinSupportModel.status === "low") {
      setProteinTarget((prev) => prev + 20);
      pushChangeLog({
        category: "Nutrition",
        title: "Raised protein support",
        detail: "+20g protein to better support a dieting phase.",
        impact: "Should improve lean-mass support without changing the whole diet structure.",
      });
      updateFirstMealOfType("standard", (meal) => ({ ...meal, protein: meal.protein + 10 }));
      updateFirstMealOfType("post", (meal) => ({ ...meal, protein: Math.max(meal.protein, 45) }));
      return;
    }

    if (trainingDay) {
      if (fuelTimingModel.status === "underfueled") {
        setCarbTarget((prev) => prev + 20);
        setIntraCarbs((prev) => Math.max(prev, 35));
        updateFirstMealOfType("pre", (meal) => ({ ...meal, carbs: Math.max(meal.carbs, 30), fats: Math.min(meal.fats, 8) }));
        updateFirstMealOfType("post", (meal) => ({ ...meal, carbs: Math.max(meal.carbs, 40), fats: Math.min(meal.fats, 8) }));
        pushChangeLog({
          category: "Nutrition",
          title: "Loaded the training window",
          detail: "Raised peri-workout carbs and tightened the pre/post meal profile.",
          impact: "Should support training output without scattering food across the whole day.",
        });
        return;
      }

      if (fuelTimingModel.status === "digestion-heavy") {
        setFatTarget((prev) => Math.max(30, prev - 5));
        updateFirstMealOfType("post", (meal) => ({ ...meal, fats: Math.min(meal.fats, 8) }));
        pushChangeLog({
          category: "Nutrition",
          title: "Cleaned up the post-workout meal",
          detail: "Capped post-workout fats and trimmed total diet fat slightly.",
          impact: "Should make the training window easier to digest.",
        });
        return;
      }

      if (hydrationSupportModel.status === "low") {
        setWaterLiters((prev) => Math.max(prev, 4.25));
        setSaltTsp((prev) => Math.max(prev, 1.5));
        pushChangeLog({
          category: "Nutrition",
          title: "Raised hydration support",
          detail: "Moved water and electrolyte support up to better match the current day.",
          impact: "Should make the training-day support read more coherent.",
        });
        return;
      }

      if (hydrationSupportModel.status === "dilute") {
        setSaltTsp((prev) => Math.max(prev, 1.5));
        pushChangeLog({
          category: "Nutrition",
          title: "Balanced fluid with electrolytes",
          detail: "Kept fluid steady and brought electrolyte support up to match it.",
          impact: "Should reduce the chance that the day reads more dilute than supported.",
        });
        return;
      }

      if (primaryLimiter === "Fullness") {
        setCarbTarget((prev) => prev + 25);
        setIntraCarbs((prev) => prev + 10);
        updateFirstMealOfType("pre", (meal) => ({ ...meal, carbs: Math.max(meal.carbs, 30) }));
        updateFirstMealOfType("post", (meal) => ({ ...meal, carbs: Math.max(meal.carbs, 45) }));
        pushChangeLog({
          category: "Nutrition",
          title: "Applied fullness-support macro preset",
          detail: "+25 carbs to daily target and +10g intra carbs.",
          impact: "Should raise fullness support without changing the whole diet.",
        });
        return;
      }
      if (primaryLimiter === "Digestion") {
        setFatTarget((prev) => Math.max(30, prev - 5));
        setIntraCarbs((prev) => Math.max(30, prev - 10));
        updateFirstMealOfType("post", (meal) => ({ ...meal, fats: Math.min(meal.fats, 8) }));
        pushChangeLog({
          category: "Nutrition",
          title: "Applied digestion-support macro preset",
          detail: "Pulled fats slightly down and reduced intra burden.",
          impact: "Should make peri-workout digestion easier.",
        });
        return;
      }
    }

    if (trainingDay) {
      setIntraCarbs((prev) => Math.max(prev, 40));
    }
    pushChangeLog({
      category: "Nutrition",
      title: "Held current food structure",
      detail: trainingDay ? "Kept the current macro targets and ensured training support stays loaded." : "Kept the current macro targets in place.",
      impact: "The baseline now stays aligned unless there is a real reason to change it.",
    });
  };

  useEffect(() => {
    if (!autoApplyDietPreset) return;
    applyMacroPreset();
    setAutoApplyDietPreset(false);
  }, [autoApplyDietPreset]);

  const applyTrainingSuggestion = () => {
    const regionMatchesMuscle = (region: string, muscle: string) => {
      if (region === "Chest") return muscle === "Chest";
      if (region === "Back") return ["Lats", "Upper Back", "Erectors", "Forearms"].includes(muscle);
      if (region === "Delts") return muscle === "Delts";
      if (region === "Arms") return ["Triceps", "Biceps"].includes(muscle);
      if (region === "Quads") return muscle === "Quads";
      if (region === "Hamstrings") return muscle === "Hamstrings";
      if (region === "Glutes") return ["Glutes", "Adductors"].includes(muscle);
      if (region === "Calves") return muscle === "Calves";
      if (region === "Trunk") return ["Abs", "Hip Flexors"].includes(muscle);
      return false;
    };

    if (adaptationSnapshot.primaryAction.code === "fix-delivery") {
      pushChangeLog({
        category: "Training",
        title: "Held split progression until delivery improves",
        detail: adaptationSnapshot.primaryAction.detail,
        impact: "The split stayed stable so delivered work can catch up before the next progression move.",
      });
      return;
    }

    if (adaptationSnapshot.primaryAction.code === "reduce-fatigue") {
      const targetRegion = adaptationSnapshot.topConstraint?.region ?? adaptationSnapshot.fatigueHotspot?.region;

      setWorkoutSplit((prev) =>
        prev.map((day) => {
          const hitsTargetRegion =
            targetRegion &&
            day.exercises.some((exercise) => {
              const libItem = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
              return (libItem?.muscleBias ?? []).some((bias) => regionMatchesMuscle(targetRegion, bias.muscle));
            });

          if (!hitsTargetRegion) return day;

          return {
            ...day,
            volume: Math.max(4, day.volume - 1),
            systemicLoad: Math.max(4, day.systemicLoad - 1),
            exercises: day.exercises.map((exercise) => {
              const libItem = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
              const hitsExercise = targetRegion
                ? (libItem?.muscleBias ?? []).some((bias) => regionMatchesMuscle(targetRegion, bias.muscle))
                : false;
              if (!hitsExercise || exercise.sets <= 2) return exercise;
              return { ...exercise, sets: Math.max(2, exercise.sets - 1) };
            }),
          };
        })
      );

      pushChangeLog({
        category: "Training",
        title: `Reduced ${targetRegion?.toLowerCase() ?? "regional"} fatigue cost`,
        detail: adaptationSnapshot.primaryAction.detail,
        impact: "Lowered set and systemic cost on the most fatigue-expensive region.",
      });
      return;
    }

    if (recoveryHeadroom < 4.5) {
      setWorkoutSplit((prev) =>
        prev.map((day) => ({
          ...day,
          intensity: Math.max(5, day.intensity - 1),
          systemicLoad: Math.max(4, day.systemicLoad - 1),
        }))
      );
      pushChangeLog({
        category: "Training",
        title: "Applied recovery protection adjustment",
        detail: "Reduced intensity and systemic load across the week.",
        impact: "Should improve headroom and reduce fatigue accumulation.",
      });
      return;
    }

    if (primaryLimiter === "Digestion") {
      setWorkoutSplit((prev) =>
        prev.map((day) => ({
          ...day,
          volume: Math.max(5, day.volume - 1),
        }))
      );
      pushChangeLog({
        category: "Training",
        title: "Applied digestion-friendly training adjustment",
        detail: "Lowered average training volume slightly.",
        impact: "Should reduce session drag while maintaining output.",
      });
      return;
    }

    pushChangeLog({
      category: "Training",
      title: "No training change needed",
      detail: "Current split is within a workable range.",
      impact: "Execution remains the priority.",
    });
  };

  useEffect(() => {
    if (!autoApplySuggestion) return;
    applyTrainingSuggestion();
    setAutoApplySuggestion(false);
  }, [autoApplySuggestion]);

  const libraryCategoryOptions = useMemo(() => {
    return ["All", ...Array.from(new Set(exerciseLibrary.map((item) => item.category))).sort()];
  }, [exerciseLibrary]);

  const libraryMuscleOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          exerciseLibrary.flatMap((item) => (item.muscleBias ?? []).map((bias) => bias.muscle))
        )
      ).sort(),
    ];
  }, [exerciseLibrary]);

  const libraryPositionOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          exerciseLibrary.map((item) => exerciseScientificProfiles[item.id]?.position ?? "Unknown")
        )
      ).sort(),
    ];
  }, [exerciseLibrary, exerciseScientificProfiles]);

  const filteredExerciseLibrary = useMemo(() => {
    const targetFocus = workoutSplit.find((day) => day.id === libraryTargetDayId)?.focus ?? "";

    return exerciseLibrary
      .filter((item) => {
        const itemProfile = exerciseScientificProfiles[item.id];
        const search = librarySearch.trim().toLowerCase();
        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          (item.muscleBias ?? []).some((bias) => bias.muscle.toLowerCase().includes(search)) ||
          itemProfile?.movementPatternLabel.toLowerCase().includes(search);
        const matchesCategory = libraryCategory === "All" || item.category === libraryCategory;
        const matchesMuscle =
          libraryMuscle === "All" || (item.muscleBias ?? []).some((bias) => bias.muscle === libraryMuscle);
        const matchesPosition = libraryPosition === "All" || (itemProfile?.position ?? "Unknown") === libraryPosition;
        const matchesFocus = !targetFocus || isExerciseStrongMatchForFocus(item, targetFocus);
        return matchesSearch && matchesCategory && matchesMuscle && matchesPosition && matchesFocus;
      })
      .sort((left, right) => {
        const focusDelta = scoreExerciseAgainstFocus(right, targetFocus) - scoreExerciseAgainstFocus(left, targetFocus);
        if (focusDelta !== 0) return focusDelta;
        return Number(left.fatigue ?? 0) - Number(right.fatigue ?? 0);
      });
  }, [exerciseLibrary, exerciseScientificProfiles, librarySearch, libraryCategory, libraryMuscle, libraryPosition, workoutSplit, libraryTargetDayId]);

  const libraryTargetDay = useMemo(() => workoutSplit.find((day) => day.id === libraryTargetDayId) ?? workoutSplit[0], [workoutSplit, libraryTargetDayId]);

  const addLibraryExerciseToDay = (exerciseId: string, dayId: string) => {
    setWorkoutSplit((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: [
            ...day.exercises,
            {
              exerciseId,
              sets: 3,
              repRange: "8-12",
              rir: 2,
              note: "",
            },
          ],
        };
      })
    );
  };

  const trackerTemplateDay = useMemo(() => workoutSplit.find((day) => day.id === trackerTemplateDayId) ?? workoutSplit[0] ?? null, [workoutSplit, trackerTemplateDayId]);

  const pushSplitDayToTracker = (dayId: string) => {
    const sourceDay = workoutSplit.find((day) => day.id === dayId);
    if (!sourceDay || !selectedTrackerDay) return;

    setTrackerTemplateDayId(dayId);
    setTrackerDays((prev) =>
      prev.map((day) => {
        if (day.id !== selectedTrackerDay.id) return day;
        return withDerivedCompletion({
          ...day,
          title: sourceDay.focus,
          lifts: buildTrackerLiftsFromWorkoutDay(day.id, sourceDay, exerciseLibrary),
        });
      })
    );

    pushChangeLog({
      category: "Training",
      title: `Pushed ${sourceDay.day} into the tracker`,
      detail: `${sourceDay.focus} now drives the currently selected tracker day.`,
      impact: "The tracker now reflects the latest workout-day edits.",
    });
  };

  const pushTemplateToTracker = (trackerDayId: string) => {
    if (!trackerTemplateDay) return;

    setTrackerDays((prev) =>
      prev.map((day) => {
        if (day.id !== trackerDayId) return day;
        return withDerivedCompletion({
          ...day,
          title: trackerTemplateDay.focus,
          lifts: buildTrackerLiftsFromWorkoutDay(trackerDayId, trackerTemplateDay, exerciseLibrary),
        });
      })
    );

    pushChangeLog({
      category: "Training",
      title: `Pushed ${trackerTemplateDay.focus} into tracker day`,
      detail: "Tracker lifts were replaced using the selected split day.",
      impact: "Tracker now mirrors the current builder more closely.",
    });
  };

  const metricsTone = (value: number) => {
    if (value >= 7.5) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (value >= 5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const trackerPrimaryAction = useMemo(() => {
    if (!selectedTrackerDay) {
      return {
        title: "Select a day to review",
        body: "Choose a tracker day before trying to update execution or review anything.",
        cta: "Select day",
        tab: "tracker" as AppTab,
      };
    }

    if (recoveryPressureModel.status === "high") {
      return {
        title: "Protect recovery before chasing more output",
        body: "The current recovery picture is too strained to ignore. Tighten the day and get the support variables in line first.",
        cta: trainingDay ? "Review food support" : "Review today",
        tab: trainingDay ? "nutrition" as AppTab : "tracker" as AppTab,
      };
    }

    if (trainingDay && fuelTimingModel.status === "underfueled") {
      return {
        title: "Load the training window",
        body: "The day does not need more random food. It needs better support around the session itself.",
        cta: "Review meals",
        tab: "nutrition" as AppTab,
      };
    }

    if (trainingDay && hydrationSupportModel.status === "low") {
      return {
        title: "Bring fluid support up",
        body: `Drink at least ${trainingDay ? "3.5" : "2.5"}L today and keep salt consistent before changing food.`,
        cta: "Balance hydration",
        tab: "nutrition" as AppTab,
      };
    }

    if (selectedTrackerMissedLifts >= 3) {
      return {
        title: "Close today's log",
        body: "Finish the open training entries before reviewing plan changes.",
        cta: "Complete lifts",
        tab: "tracker" as AppTab,
      };
    }

    if (selectedTrackerCompletionPct < 85) {
      return {
        title: "Push completion above 85%",
        body: `Today's completion is ${selectedTrackerCompletionPct}%. The easiest win is tighter execution, not more changes.`,
        cta: "Close the gaps",
        tab: "tracker" as AppTab,
      };
    }

    if (primaryLimiter === "Digestion") {
      return {
        title: "Keep food flow smooth today",
        body: "Training is not the main issue. The day should feel organized around easier digestion and clean peri-workout intake.",
        cta: "Review meals",
        tab: "nutrition" as AppTab,
      };
    }

    return {
      title: "Stay on script",
      body: "There is no reason to redesign the day. Finish the work, hit the food, and keep the look stable.",
      cta: "Execute plan",
      tab: "tracker" as AppTab,
    };
  }, [
    selectedTrackerDay,
    recoveryPressureModel.status,
    trainingDay,
    fuelTimingModel.status,
    hydrationSupportModel.status,
    selectedTrackerMissedLifts,
    selectedTrackerCompletionPct,
    primaryLimiter,
  ]);

  const trackerAthleteChecklist = useMemo(() => {
    if (!selectedTrackerDay) return [] as { label: string; detail: string }[];
    return [
      {
        label: "Complete the session",
        detail: `${selectedTrackerCompletedLifts}/${selectedTrackerDay.lifts.length} lifts marked done today.`,
      },
      {
        label: "Hit the food plan",
        detail: `${mealTotals.protein}P / ${mealTotals.carbs}C / ${mealTotals.fats}F mapped across ${meals.length} meals. ${fuelTimingModel.title}.`,
      },
      {
        label: "Protect recovery",
        detail: `${selectedTrackerDay.steps} steps, energy ${selectedTrackerDay.energy}, bodyweight ${selectedTrackerDay.bodyWeight}. ${hydrationSupportModel.title}.`,
      },
      {
        label: "Conditioning lane",
        detail: conditioningSnapshot.primaryAction.detail,
      },
      {
        label: "Best system read",
        detail: performanceInsightSnapshot.topInsight?.detail ?? adaptationSnapshot.primaryAction.detail,
      },
    ];
  }, [
    selectedTrackerDay,
    selectedTrackerCompletedLifts,
    mealTotals.protein,
    mealTotals.carbs,
    mealTotals.fats,
    meals.length,
    fuelTimingModel.title,
    hydrationSupportModel.title,
    conditioningSnapshot.primaryAction.detail,
    performanceInsightSnapshot.topInsight,
    adaptationSnapshot.primaryAction.detail,
  ]);

  const trackerCoachReviewCards = useMemo(() => {
    return [
      {
        label: "Execution",
        detail: `${selectedTrackerExecutionScore}% today.`,
      },
      {
        label: "Recovery context",
        detail: `${recoveryPressureModel.title}. Energy ${selectedTrackerDay?.energy ?? "-"}, steps ${selectedTrackerDay?.steps ?? "-"}, recovery ${recoveryScore.toFixed(1)}.`,
      },
      {
        label: "Main limiter",
        detail: `${primaryLimiter} is still the current bottleneck. ${decisionConfidenceModel.title}, ${decisionConfidenceModel.score} / 100.`,
      },
      {
        label: "Conditioning lane",
        detail: `${conditioningSnapshot.weeklyMinutes} min this week, ${conditioningSnapshot.currentModalityLabel}. ${conditioningSnapshot.primaryAction.title}.`,
      },
      {
        label: "Best system read",
        detail: performanceInsightSnapshot.topInsight?.detail ?? `${adaptationSnapshot.weeklyCoveragePct}% weekly log coverage, ${adaptationSnapshot.deliveryPct}% tracked delivery. ${adaptationSnapshot.primaryAction.title}.`,
      },
    ];
  }, [
    selectedTrackerExecutionScore,
    selectedTrackerDay,
    recoveryPressureModel.title,
    recoveryScore,
    primaryLimiter,
    decisionConfidenceModel.title,
    decisionConfidenceModel.score,
    conditioningSnapshot.weeklyMinutes,
    conditioningSnapshot.currentModalityLabel,
    conditioningSnapshot.primaryAction.title,
    performanceInsightSnapshot.topInsight,
    adaptationSnapshot.weeklyCoveragePct,
    adaptationSnapshot.deliveryPct,
    adaptationSnapshot.primaryAction.title,
  ]);

  const athleteTodayMainItems = useMemo(() => {
    if (!selectedTrackerDay) return [] as { label: string; value: string; helper: string }[];
    return [
      {
        label: "Session",
        value: selectedTrackerDay.title || "Today",
        helper: `${selectedTrackerCompletedLifts}/${selectedTrackerDay.lifts.length} lifts done`,
      },
      {
        label: "Food",
        value: `${mealTotals.protein}P / ${mealTotals.carbs}C / ${mealTotals.fats}F`,
        helper: `${meals.length} meals planned`,
      },
      {
        label: "Output",
        value:
          conditioningSnapshot.todayMinutes > 0
            ? `${selectedTrackerDay.steps || 0} steps + ${conditioningSnapshot.todayMinutes} min`
            : `${selectedTrackerDay.steps || 0} steps`,
        helper:
          conditioningSnapshot.todayMinutes > 0
            ? conditioningSnapshot.currentModalityLabel
            : `Energy ${selectedTrackerDay.energy || "-"}`,
      },
      {
        label: "Main cue",
        value: trackerPrimaryAction.title,
        helper: trackerPrimaryAction.cta,
      },
    ];
  }, [
    selectedTrackerDay,
    selectedTrackerCompletedLifts,
    mealTotals.protein,
    mealTotals.carbs,
    mealTotals.fats,
    meals.length,
    conditioningSnapshot.todayMinutes,
    conditioningSnapshot.currentModalityLabel,
    trackerPrimaryAction.title,
    trackerPrimaryAction.cta,
  ]);

  const coachTrackerFocusCards = useMemo(() => {
    return [
      {
        label: "Review day",
        title: selectedTrackerDay?.title ?? "No day selected",
        detail: selectedTrackerDay
          ? `${selectedTrackerDay.date}, ${selectedTrackerCompletedLifts}/${selectedTrackerDay.lifts.length} lifts done`
          : "Choose a live tracker day before reviewing execution.",
      },
      {
        label: "Execution",
        title: `${selectedTrackerExecutionScore}% daily execution`,
        detail: `${trackerWeeklyReview.averageCompletion}% average week completion.`,
      },
      {
        label: "Current cue",
        title: trackerPrimaryAction.title,
        detail: `${trackerPrimaryAction.body} ${recoveryPressureModel.title}.`,
      },
    ];
  }, [
    selectedTrackerDay,
    selectedTrackerCompletedLifts,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    trackerWeeklyReview.averageCompletion,
    trackerPrimaryAction.title,
    trackerPrimaryAction.body,
    recoveryPressureModel.title,
  ]);

  const athleteTrackerFocusCards = useMemo(() => {
    return athleteTodayMainItems.map((item) => ({
      label: item.label,
      title: item.value,
      detail: item.helper,
      onClick:
        item.label === "Food"
          ? () => openNutritionSurface("log")
          : item.label === "Main cue"
            ? () =>
                trackerPrimaryAction.tab === "tracker"
                  ? openTrackerSurface("log")
                  : goToTab(trackerPrimaryAction.tab)
            : () => openTrackerSurface("log"),
    }));
  }, [athleteTodayMainItems, trackerPrimaryAction.tab, goToTab, openNutritionSurface, openTrackerSurface]);

  const athleteOffTrackFlags = useMemo(() => {
    const flags: string[] = [];
    const usedDomains = new Set<string>();
    const addFlag = (domain: string, message: string) => {
      if (usedDomains.has(domain)) return;
      usedDomains.add(domain);
      flags.push(message);
    };

    if (!selectedTrackerDay) return flags;
    if (selectedTrackerMissedLifts >= 3) {
      addFlag("training", `Finish ${selectedTrackerMissedLifts} open lifts before editing the plan.`);
    } else if (selectedTrackerCompletionPct < 85) {
      addFlag("training", `Bring today's completion from ${selectedTrackerCompletionPct}% to at least 85%.`);
    }

    const loggedSteps = Number(selectedTrackerDay.steps) || 0;
    if (loggedSteps < activeStepTarget) {
      addFlag("steps", `${Math.max(0, activeStepTarget - loggedSteps).toLocaleString()} steps remain today.`);
    }

    if ((Number(selectedTrackerDay.energy) || 0) <= 2) {
      addFlag("recovery", "Energy is low; cap the next hard set at RPE 8.");
    }

    if (selfManagedAdaptivePlan.isBehind) {
      addFlag("adaptive", selfManagedAdaptivePlan.title);
    }

    if (dietPressureModel.status === "aggressive-deficit" && recoveryHeadroom < 5) {
      addFlag("diet-pressure", "Hold the cut today; recovery is too compressed to push harder.");
    }
    if (trainingDay && fuelTimingModel.status === "underfueled") {
      addFlag("food", "Add carbs before or during training today.");
    }
    if (hydrationSupportModel.status === "low") {
      addFlag("hydration", `Drink at least ${trainingDay ? "3.5" : "2.5"}L today.`);
    }
    if (primaryLimiter === "Digestion") {
      addFlag("digestion", "Keep fats under 10g in the training window.");
    }
    conditioningSnapshot.flags.forEach((flag) => addFlag("conditioning", flag));
    return flags.slice(0, 4);
  }, [
    activeStepTarget,
    selectedTrackerDay,
    selectedTrackerMissedLifts,
    selectedTrackerCompletionPct,
    selfManagedAdaptivePlan.isBehind,
    selfManagedAdaptivePlan.title,
    dietPressureModel.status,
    recoveryHeadroom,
    trainingDay,
    fuelTimingModel.status,
    hydrationSupportModel.status,
    primaryLimiter,
    conditioningSnapshot.flags,
  ]);

  const athleteCompletionProgress = useMemo(() => {
    if (!selectedTrackerDay || selectedTrackerDay.lifts.length === 0) return 0;
    return Math.round((selectedTrackerCompletedLifts / selectedTrackerDay.lifts.length) * 100);
  }, [selectedTrackerDay, selectedTrackerCompletedLifts]);

  const athleteNextOpenLift = useMemo(() => {
    if (!selectedTrackerDay) return null;
    return selectedTrackerDay.lifts.find((lift) => !lift.completed) ?? selectedTrackerDay.lifts[0] ?? null;
  }, [selectedTrackerDay]);

  const toggleAthleteLiftExpanded = (liftId: string) => {
    setExpandedAthleteLifts((prev) => ({
      ...prev,
      [liftId]: !prev[liftId],
    }));
  };

  const getExerciseSubstitutions = (exercise: ExerciseLibraryItem) => {
    const sourceProfile = exerciseScientificProfiles[exercise.id];
    const primaryMuscles = new Set((exercise.muscleBias ?? []).slice(0, 2).map((bias) => bias.muscle));

    return exerciseLibrary
      .filter((item) => item.id !== exercise.id)
      .filter((item) => {
        const itemProfile = exerciseScientificProfiles[item.id];
        return (
          item.category === exercise.category ||
          itemProfile?.movementPatternId === sourceProfile?.movementPatternId ||
          itemProfile?.position === sourceProfile?.position
        );
      })
      .filter((item) => (item.muscleBias ?? []).some((bias) => primaryMuscles.has(bias.muscle)))
      .sort((left, right) => {
        const leftProfile = exerciseScientificProfiles[left.id];
        const rightProfile = exerciseScientificProfiles[right.id];
        const rightPatternMatch = Number(rightProfile?.movementPatternId === sourceProfile?.movementPatternId);
        const leftPatternMatch = Number(leftProfile?.movementPatternId === sourceProfile?.movementPatternId);
        if (rightPatternMatch !== leftPatternMatch) return rightPatternMatch - leftPatternMatch;
        return Number(left.fatigue ?? 0) - Number(right.fatigue ?? 0);
      })
      .slice(0, 4);
  };

  const addExerciseFromLibraryToDay = (exerciseId: string) => {
    const targetDay =
      workoutSplit.find((day) => day.id === libraryTargetDayId) ??
      workoutSplit.find((day) => day.focus.toLowerCase() !== "rest") ??
      workoutSplit[0];
    if (!targetDay) return;
    addLibraryExerciseToDay(exerciseId, targetDay.id);
    const exercise = exerciseLibrary.find((item) => item.id === exerciseId);
    pushChangeLog({
      category: "Training",
      title: `Added ${exercise?.name ?? "exercise"} from library`,
      detail: `Exercise was sent directly into ${targetDay.day}.`,
      impact: "Exercise library is now tied directly into split-building workflow.",
    });
  };

  const libraryTargetDayPatternSummary = useMemo(() => {
    if (!libraryTargetDay) {
      return {
        targetPatternIds: [] as string[],
        patternCounts: {} as Record<string, number>,
        missingPatternIds: [] as string[],
        missingPatternLabels: [] as string[],
        duplicatePatternId: null as string | null,
        duplicatePatternLabel: null as string | null,
        anchorCount: 0,
        highRecoveryCount: 0,
      };
    }

    const targetPatternIds = resolveFocusPatternTargets(libraryTargetDay.focus);
    const patternCounts = libraryTargetDay.exercises.reduce((acc, exercise) => {
      const patternId = exerciseScientificProfiles[exercise.exerciseId]?.movementPatternId;
      if (!patternId) return acc;
      acc[patternId] = (acc[patternId] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const missingPatternIds = targetPatternIds.filter((patternId) => !patternCounts[patternId]);
    const missingPatternLabels = missingPatternIds.map(
      (patternId) => movementPatternLibrary.find((item) => item.id === patternId)?.label ?? patternId
    );
    const duplicatePatternId =
      Object.entries(patternCounts)
        .filter(([, count]) => count >= 2)
        .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    const duplicatePatternLabel = duplicatePatternId
      ? movementPatternLibrary.find((item) => item.id === duplicatePatternId)?.label ?? duplicatePatternId
      : null;
    const dayProfiles = libraryTargetDay.exercises
      .map((exercise) => exerciseScientificProfiles[exercise.exerciseId])
      .filter(Boolean);

    return {
      targetPatternIds,
      patternCounts,
      missingPatternIds,
      missingPatternLabels,
      duplicatePatternId,
      duplicatePatternLabel,
      anchorCount: dayProfiles.filter((profile) => profile.position === "anchor").length,
      highRecoveryCount: dayProfiles.filter((profile) => profile.recoveryDemand === "high").length,
    };
  }, [libraryTargetDay, exerciseScientificProfiles]);

  const libraryTargetDaySummary = useMemo(() => {
    if (!libraryTargetDay) {
      return {
        title: "No target day selected",
        body: "Choose a target split day before adding movements.",
      };
    }

    const targetSets = libraryTargetDay.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    return {
      title: `${libraryTargetDay.day}, ${libraryTargetDay.focus}`,
      body:
        libraryTargetDayPatternSummary.missingPatternLabels.length > 0
          ? `${libraryTargetDay.exercises.length} exercises, ${targetSets} total sets. Missing: ${libraryTargetDayPatternSummary.missingPatternLabels.slice(0, 2).join(", ")}.`
          : `${libraryTargetDay.exercises.length} exercises, ${targetSets} total sets, intensity ${libraryTargetDay.intensity}, systemic ${libraryTargetDay.systemicLoad}.`,
    };
  }, [libraryTargetDay, libraryTargetDayPatternSummary.missingPatternLabels]);

  const libraryPrimaryAction = useMemo(() => {
    if (!libraryTargetDay) {
      return {
        title: "Select a target day first",
        body: "The library should not feel detached from the program. Pick the day you are building before choosing exercises.",
        cta: "Choose target day",
      };
    }

    if (libraryTargetDay.focus.toLowerCase() === "rest") {
      return {
        title: "Choose a training day, not a rest day",
        body: "The library is most useful when it solves a real session slot. Rest days should not be absorbing random exercise adds.",
        cta: "Pick training day",
      };
    }

    if (libraryTargetDayPatternSummary.missingPatternLabels.length > 0) {
      const missingPatternLabel = libraryTargetDayPatternSummary.missingPatternLabels[0];
      return {
        title: `Fill the ${missingPatternLabel.toLowerCase()} slot`,
        body: `This ${libraryTargetDay.focus.toLowerCase()} day is missing a clear ${missingPatternLabel.toLowerCase()} role. Add the cleanest movement that fills that job without bloating fatigue.`,
        cta: "Fill missing slot",
      };
    }

    if (libraryTargetDay.systemicLoad >= 8 || libraryTargetDayPatternSummary.anchorCount >= 3) {
      return {
        title: "Use a lower-cost filler, not another anchor",
        body: "This day already carries enough anchor work. If you add something, bias a stable bridge or isolation slot that fills a real gap.",
        cta: "Choose lower-cost add",
      };
    }

    return {
      title: "Protect pattern balance while filling the day",
      body: "The big job is not adding more exercises. It is keeping the day's pattern coverage and recovery cost coherent.",
      cta: "Add to current target",
    };
  }, [libraryTargetDay, libraryTargetDayPatternSummary.anchorCount, libraryTargetDayPatternSummary.missingPatternLabels]);

  const libraryRiskFlags = useMemo(() => {
    const flags: string[] = [];
    if (!libraryTargetDay) return ["No target day is selected."];
    if (filteredExerciseLibrary.length === 0) flags.push("Your current filters return no exercises.");
    if (libraryTargetDay.exercises.length >= 8) flags.push("The target day is already crowded. Adding more may just increase noise.");
    if (libraryTargetDay.systemicLoad >= 8) flags.push("The target day already carries high systemic load.");
    if (libraryTargetDayPatternSummary.duplicatePatternLabel) {
      flags.push(`${libraryTargetDayPatternSummary.duplicatePatternLabel} is already repeated on this day. Another similar slot may just duplicate stimulus.`);
    }
    if (libraryTargetDayPatternSummary.highRecoveryCount >= 3) {
      flags.push("Most current movements already carry high recovery demand.");
    }
    if (libraryTargetDay.focus.toLowerCase() === "rest") flags.push("You are targeting a rest day. That is probably the wrong place to add exercises.");
    return flags.slice(0, 4);
  }, [libraryTargetDay, filteredExerciseLibrary.length, libraryTargetDayPatternSummary.duplicatePatternLabel, libraryTargetDayPatternSummary.highRecoveryCount]);

  const libraryRecommendedExercises = useMemo(() => {
    if (!libraryTargetDay) return [] as ExerciseLibraryItem[];
    const existingIds = new Set(libraryTargetDay.exercises.map((exercise) => exercise.exerciseId));
    const priorityPatterns = new Set(
      libraryTargetDayPatternSummary.missingPatternIds.length > 0
        ? libraryTargetDayPatternSummary.missingPatternIds
        : libraryTargetDayPatternSummary.targetPatternIds
    );

    return exerciseLibrary
      .filter((item) => !existingIds.has(item.id))
      .map((item) => ({
        item,
        focusScore: scoreExerciseAgainstFocus(item, libraryTargetDay.focus),
        profile: exerciseScientificProfiles[item.id],
      }))
      .filter((entry) => isExerciseStrongMatchForFocus(entry.item, libraryTargetDay.focus))
      .sort((left, right) => {
        const leftPatternBonus = Number(priorityPatterns.has(left.profile?.movementPatternId ?? "")) * 30;
        const rightPatternBonus = Number(priorityPatterns.has(right.profile?.movementPatternId ?? "")) * 30;
        const leftRecoveryBonus =
          libraryTargetDay.systemicLoad >= 8
            ? left.profile?.recoveryDemand === "low"
              ? 14
              : left.profile?.position === "isolation"
                ? 8
                : 0
            : 0;
        const rightRecoveryBonus =
          libraryTargetDay.systemicLoad >= 8
            ? right.profile?.recoveryDemand === "low"
              ? 14
              : right.profile?.position === "isolation"
                ? 8
                : 0
            : 0;
        const leftDuplicationPenalty =
          left.profile?.movementPatternId === libraryTargetDayPatternSummary.duplicatePatternId ? 12 : 0;
        const rightDuplicationPenalty =
          right.profile?.movementPatternId === libraryTargetDayPatternSummary.duplicatePatternId ? 12 : 0;
        const leftTotal = left.focusScore + leftPatternBonus + leftRecoveryBonus - leftDuplicationPenalty;
        const rightTotal = right.focusScore + rightPatternBonus + rightRecoveryBonus - rightDuplicationPenalty;
        const focusDelta = rightTotal - leftTotal;
        if (focusDelta !== 0) return focusDelta;
        return Number(left.item.fatigue ?? 0) - Number(right.item.fatigue ?? 0);
      })
      .map((entry) => entry.item)
      .slice(0, 6);
  }, [libraryTargetDay, libraryTargetDayPatternSummary.duplicatePatternId, libraryTargetDayPatternSummary.missingPatternIds, libraryTargetDayPatternSummary.targetPatternIds, exerciseLibrary, exerciseScientificProfiles]);

  const exportCoachReport = () => {
    const report = [
      `${activeAthlete.name} coach report`,
      `Bodyweight: ${bodyWeight.toFixed(1)} lb`,
      `Weeks out: ${weeksOut}`,
      `Limiter: ${primaryLimiter}`,
      `Recommendation: ${coachRecommendation.action}`,
      `Reason: ${coachRecommendation.reason}`,
      `Weekly completion: ${trackerWeeklyReview.averageCompletion}%`,
      `Condition: ${conditionScore.toFixed(1)}/10`,
      `Recovery support: ${readinessScore.toFixed(1)}/10`,
      `Recent changes: ${dashboardChangeSummary}`,
    ].join("\n");

    void copyTextToClipboard(report).then((copied) => {
      showActionReceipt({
        title: copied ? "Coach report copied" : "Copy blocked",
        detail: copied
          ? "The weekly coach report is ready to paste."
          : "Clipboard access was blocked by the browser. The report was still recorded in activity.",
        tone: copied ? "success" : "warning",
      });
      pushChangeLog({
        category: "Coach",
        title: copied ? "Copied coach report" : "Prepared coach report",
        detail: copied
          ? "A summary report was copied to the clipboard."
          : "Clipboard access was blocked before the summary could be copied.",
        impact: copied
          ? "A formatted weekly coaching summary is now ready to paste elsewhere."
          : "The export action produced a visible receipt instead of silently failing.",
      });
    });
  };

  const moveTrainingDay = (dayId: string, direction: -1 | 1) => {
    setWorkoutSplit((prev) => {
      const index = prev.findIndex((day) => day.id === dayId);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return next.map((day, orderIndex) => ({
        ...day,
        day: day.day.startsWith("Day ") ? `Day ${orderIndex + 1}` : day.day,
      }));
    });
  };

  const duplicateTrainingDay = (dayId: string) => {
    setWorkoutSplit((prev) => {
      const index = prev.findIndex((day) => day.id === dayId);
      if (index === -1) return prev;
      const source = prev[index];
      const copy: WorkoutDay = {
        ...source,
        id: `${source.id}-copy-${Date.now()}`,
        day: `${source.day} Copy`,
        exercises: source.exercises.map((exercise) => ({ ...exercise })),
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    pushChangeLog({
      category: "Training",
      title: "Duplicated training day",
      detail: "A full training day was copied inside the split builder.",
      impact: "Weekly structure can now be iterated faster from existing sessions.",
    });
  };

  const removeTrainingDay = (dayId: string) => {
    setWorkoutSplit((prev) => prev.filter((day) => day.id !== dayId));
    pushChangeLog({
      category: "Training",
      title: "Removed training day",
      detail: "A day was deleted from the split builder.",
      impact: "Weekly structure and load distribution changed.",
    });
  };

  const saveWeeklySnapshot = () => {
    const snapshot: WeeklySnapshotLocal = {
      id: Date.now().toString(),
      weekLabel: `Week ${weeksOut}`,
      date: new Date().toISOString().slice(0, 10),
      bodyWeight,
      condition: Number(conditionScore.toFixed(1)),
      recovery: Number(recoveryScore.toFixed(1)),
      completion: trackerWeeklyReview.averageCompletion,
      compliance: complianceConfidence.score,
      limiter: primaryLimiter,
      recommendation: coachRecommendation.action,
      notes: coachRecommendation.reason,
    };
    setWeeklySnapshots((prev) => [snapshot, ...prev].slice(0, 16));
    pushChangeLog({
      category: "Coach",
      title: `Saved ${snapshot.weekLabel} snapshot`,
      detail: `Snapshot saved with ${snapshot.completion}% completion and ${snapshot.compliance} compliance.`,
      impact: "Week-over-week review now has a real stored reference point.",
    });
  };

  const scheduleGroupedByDay = useMemo(() => {
    return scheduleDayOrder.map((day) => ({
      day,
      events: schedule
        .filter((item) => item.day === day)
        .sort((a, b) => a.time.localeCompare(b.time)),
    }));
  }, [schedule]);

  const scheduleDensitySummary = useMemo(() => {
    const busiest = scheduleGroupedByDay.reduce<{ day: string; count: number }>(
      (best, item) => (item.events.length > best.count ? { day: item.day, count: item.events.length } : best),
      { day: "Mon", count: 0 }
    );
    return {
      total: schedule.length,
      busiestDay: busiest.day,
      busiestCount: busiest.count,
      categories: Object.keys(scheduleByCategory).length,
    };
  }, [schedule, scheduleByCategory, scheduleGroupedByDay]);

  const athleteChangeSummary = useMemo(() => {
    const lines = [
      `${activeAthlete.name} weekly handoff`,
      `Signal gate: ${decisionSignalGate.title} (${decisionSignalGate.score}/100)`,
      `Focus: ${coachDecisionDraft.title}`,
      `Why: ${coachDecisionDraft.reason}`,
      ...(dashboardQueuedChanges.length > 0
        ? [`What changed: ${dashboardQueuedChanges.slice(0, 3).join(" | ")}`]
        : []),
      `Training: ${workoutSplit.length} planned days, ${totalPlannedSets} total sets`,
      `Nutrition: ${proteinTarget}P / ${carbTarget}C / ${fatTarget}F`,
      `Compounds: ${enabledCompounds.length} active entries`,
      `Main limiter: ${primaryLimiter}`,
      `Coach instruction: ${coachDecisionDraft.instruction}`,
    ];
    return lines;
  }, [activeAthlete.name, decisionSignalGate.title, decisionSignalGate.score, coachDecisionDraft.title, coachDecisionDraft.reason, coachDecisionDraft.instruction, dashboardQueuedChanges, workoutSplit.length, totalPlannedSets, proteinTarget, carbTarget, fatTarget, enabledCompounds.length, primaryLimiter]);

  const publishCoachDecision = () => {
    if (decisionSignalGate.status === "blocked") {
      showActionReceipt({
        title: "Decision blocked",
        detail: decisionSignalGate.detail,
        tone: "warning",
      });
      pushChangeLog({
        category: "Coach",
        title: `Blocked decision for ${activeAthlete.name}`,
        detail: decisionSignalGate.detail,
        impact: "The app refused to publish a plan change while the signal gate was incomplete.",
      });
      return;
    }

    const publishedAt = new Date().toISOString();
    const version = publishedDecisionHistory.length + 1;
    const packageRecord: PublishedCoachDecision = {
      id: `decision-${Date.now()}`,
      version,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      createdAt: publishedAt,
      publishedAt,
      status: "published",
      title: coachDecisionDraft.title,
      reason: coachDecisionDraft.reason,
      instruction: coachDecisionDraft.instruction,
      nextAction: coachDecisionDraft.nextAction,
      limiter: primaryLimiter,
      weeksOut,
      decisionConfidenceScore: decisionConfidenceModel.score,
      completionScore: trackerWeeklyReview.averageCompletion,
      complianceScore: complianceConfidence.score,
      checkInStatus: checkInReviewSnapshot.status,
      checkInTitle: checkInReviewSnapshot.title,
      queuedChanges: coachDecisionDraft.queuedChanges,
      summaryLines: coachDecisionDraft.summaryLines,
    };

    const publishThreadMessage: CoachThreadMessage = {
      id: `thread-${Date.now()}-publish`,
      createdAt: publishedAt,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      author: "coach",
      body: `Published v${version}: ${coachDecisionDraft.title}. ${coachDecisionDraft.nextAction}`,
      relatedDecisionId: packageRecord.id,
      deliveryStatus: "delivered",
      deliveredAt: publishedAt,
    };

    setPublishedCoachDecisions((prev) => [packageRecord, ...prev].slice(0, 24));
    setCoachThreadMessages((prev) => [publishThreadMessage, ...prev].slice(0, 80));
    setCoachInstruction(coachDecisionDraft.instruction);
    pushChangeLog({
      category: "Coach",
      title: `Published decision for ${activeAthlete.name}`,
      detail: coachDecisionDraft.instruction,
      impact: "Coach instruction, athlete handoff, and publish history are now aligned to one versioned decision package.",
    });
    showActionReceipt({
      title: "Decision published",
      detail: `${coachDecisionDraft.title} is now visible in the athlete handoff.`,
      tone: "success",
    });
  };

  const restoreCoachDecisionDraft = (decisionId: string) => {
    const decision = publishedCoachDecisions.find((item) => item.id === decisionId);

    if (!decision) {
      showActionReceipt({
        title: "Version not found",
        detail: "That published package is no longer available in local history.",
        tone: "warning",
      });
      return;
    }

    setSelectedAthleteId(decision.athleteId);
    setCoachInstruction(decision.instruction);
    setAthleteIssue(decision.reason);
    pushChangeLog({
      category: "Coach",
      title: `Reused ${decision.title} as draft`,
      detail: decision.instruction,
      impact: `Version ${decision.version ?? "history"} was copied into the current coach draft fields without republishing.`,
    });
    showActionReceipt({
      title: "Version reused as draft",
      detail: `${decision.title} is now the active coach instruction and issue context.`,
      tone: "success",
    });
    goToTab("coach");
  };

  const acknowledgeLatestCoachDecision = () => {
    if (!latestPublishedDecision || latestPublishedDecision.status === "acknowledged") return;

    const acknowledgedAt = new Date().toISOString();

    setPublishedCoachDecisions((prev) =>
      prev.map((decision) =>
        decision.id === latestPublishedDecision.id
          ? {
              ...decision,
              status: "acknowledged",
              acknowledgedAt,
              acknowledgmentNote: "Athlete confirmed receipt in the app.",
            }
          : decision
      )
    );
    setCoachThreadMessages((prev) =>
      prev.map((message) =>
        message.athleteId === latestPublishedDecision.athleteId &&
        message.author === "coach" &&
        message.relatedDecisionId === latestPublishedDecision.id
          ? {
              ...message,
              deliveryStatus: "read",
              readAt: acknowledgedAt,
            }
          : message
      )
    );

    pushChangeLog({
      category: "Coach",
      title: `${activeAthlete.name} acknowledged the latest direction`,
      detail: `${latestPublishedDecision.title}. Athlete confirmed receipt in the app.`,
      impact: "Coach now has a clear receipt trail on the active published decision.",
    });
    showActionReceipt({
      title: "Athlete receipt saved",
      detail: `${latestPublishedDecision.title} is marked acknowledged.`,
      tone: "success",
    });
  };

  const markCoachThreadMessagesRead = (messageIds?: string[]) => {
    const targetIdSet = messageIds ? new Set(messageIds) : null;
    const targetMessages = coachThreadMessages.filter(
      (message) =>
        message.athleteId === activeAthlete.id &&
        message.author === "athlete" &&
        !message.readAt &&
        (!targetIdSet || targetIdSet.has(message.id))
    );

    if (targetMessages.length === 0) {
      showActionReceipt({
        title: "No unread notes",
        detail: `${activeAthlete.name} does not have unread athlete notes in this thread.`,
        tone: "warning",
      });
      return;
    }

    const readAt = new Date().toISOString();
    const idsToMark = new Set(targetMessages.map((message) => message.id));

    setCoachThreadMessages((prev) =>
      prev.map((message) =>
        idsToMark.has(message.id)
          ? {
              ...message,
              deliveryStatus: "read",
              readAt,
            }
          : message
      )
    );

    pushChangeLog({
      category: "Coach",
      title: `Reviewed ${targetMessages.length} athlete note${targetMessages.length === 1 ? "" : "s"}`,
      detail: targetMessages[0]?.body ?? "Athlete notes were marked reviewed.",
      impact: "Coach thread now has a read trail instead of leaving athlete replies in an ambiguous state.",
    });
    showActionReceipt({
      title: "Athlete notes reviewed",
      detail: `${targetMessages.length} note${targetMessages.length === 1 ? "" : "s"} marked reviewed for ${activeAthlete.name}.`,
      tone: "success",
    });
  };

  const exportAthleteHandoff = () => {
    const payload = athleteChangeSummary.join("\n");
    void copyTextToClipboard(payload).then((copied) => {
      showActionReceipt({
        title: copied ? "Athlete handoff copied" : "Copy blocked",
        detail: copied
          ? "The athlete-facing handoff is ready to paste."
          : "Clipboard access was blocked by the browser. The handoff was still recorded in activity.",
        tone: copied ? "success" : "warning",
      });
      pushChangeLog({
        category: "Coach",
        title: copied ? "Copied athlete handoff" : "Prepared athlete handoff",
        detail: copied
          ? "The athlete-facing weekly handoff was copied to the clipboard."
          : "Clipboard access was blocked before the athlete handoff could be copied.",
        impact: copied
          ? "Coach can now paste the weekly package directly into chat or check-in notes."
          : "The copy action produced a visible receipt instead of silently failing.",
      });
    });
  };

  const weeklyCalendarMatrix = useMemo(() => {
    return scheduleDayOrder.map((day) => {
      const events = schedule
        .filter((item) => item.day === day)
        .sort((a, b) => a.time.localeCompare(b.time));
      return {
        day,
        trainingEvents: events.filter((item) => item.category === "Training").length,
        mealEvents: events.filter((item) => item.category === "Meal").length,
        pedEvents: events.filter((item) => item.category === "PEDs").length,
        recoveryEvents: events.filter((item) => item.category === "Recovery").length,
        checkInEvents: events.filter((item) => item.category === "Check-in").length,
        total: events.length,
      };
    });
  }, [schedule]);

  const weeklyPlanSummary = useMemo(() => {
    const trainingDays = weeklyCalendarMatrix.filter((day) => day.trainingEvents > 0).length;
    const recoveryDays = weeklyCalendarMatrix.filter((day) => day.recoveryEvents > 0).length;
    const highestLoadDay = weeklyCalendarMatrix.reduce(
      (best, current) => (current.total > best.total ? current : best),
      weeklyCalendarMatrix[0] ?? { day: "Mon", total: 0, trainingEvents: 0, mealEvents: 0, pedEvents: 0, recoveryEvents: 0, checkInEvents: 0 }
    );

    return {
      trainingDays,
      recoveryDays,
      highestLoadDay,
      totalEvents: weeklyCalendarMatrix.reduce((sum, day) => sum + day.total, 0),
    };
  }, [weeklyCalendarMatrix]);

  const monthPlannerBlocks = useMemo(() => {
    return Array.from({ length: 4 }, (_, index) => {
      const weekNumber = index + 1;
      const projectedCondition = clamp(Number((conditionScore + weekNumber * 0.18 - (primaryLimiter === "Dryness" ? 0.1 : 0)).toFixed(1)), 0, 10);
      const projectedRecovery = clamp(Number((recoveryScore - weekNumber * (avgSystemicLoad >= 7 ? 0.12 : -0.05)).toFixed(1)), 0, 10);
      const focus =
        weekNumber === 1
          ? coachRecommendation.action
          : weekNumber === 2
            ? primaryLimiter === "Digestion"
              ? "Stabilize digestion and hold output"
              : primaryLimiter === "Fullness"
                ? "Push peri-workout support"
                : "Hold structure and review execution"
            : weekNumber === 3
              ? "Tighten execution and reduce noise"
              : "Review look, deload noise, and finalize next block";

      return {
        id: `month-block-${weekNumber}`,
        label: `Week ${weekNumber}`,
        focus,
        projectedCondition,
        projectedRecovery,
        events: scheduleDayOrder.reduce((sum, day) => sum + (weeklyCalendarMatrix.find((item) => item.day === day)?.total ?? 0), 0),
      };
    });
  }, [conditionScore, recoveryScore, avgSystemicLoad, primaryLimiter, coachRecommendation.action, weeklyCalendarMatrix]);

  const scheduleMacroProgression = useMemo<ScheduleMacroProgressionWeek[]>(() => {
    const intakeBufferPct = contestPrepModel.calorieErrorBufferPct;
    const modelTargets = contestPrepModel.todayTargets;
    const modelProteinTarget = modelTargets.protein;
    const modelCarbTarget = modelTargets.carbs;
    const modelFatTarget = modelTargets.fats;
    const modelCalorieTarget = modelTargets.calories;
    const modelStepTarget = modelTargets.steps;
    const baseBufferedCalories = Math.max(1500, roundToNearestFive(modelCalorieTarget));
    const baseBufferedCarbs = modelCarbTarget;
    const minimumRoadmapDeficit = Math.max(250, contestPrepModel.calorieErrorBufferCalories);
    const maximumRoadmapCalories =
      contestPrepModel.plannedDeficitCalories > 0
        ? Math.max(1500, roundToNearestFive(contestPrepModel.maintenanceCalories - minimumRoadmapDeficit))
        : Number.POSITIVE_INFINITY;
    const actualWeeklyLossPct =
      bodyWeightTrendModel.weeklyChangePct == null
        ? null
        : Math.max(0, -bodyWeightTrendModel.weeklyChangePct);
    const targetWeeklyLossPct = contestPrepModel.weeklyLossTargetPct;
    const lossBehind =
      selfManagedAthlete &&
      targetWeeklyLossPct > 0 &&
      actualWeeklyLossPct != null &&
      actualWeeklyLossPct < Math.max(0.1, targetWeeklyLossPct - 0.15);

    const getWeekShift = (weekIndex: number) => {
      if (lossBehind) {
        const adjustmentStep = weekIndex + 1;
        return { calories: -125 * adjustmentStep, carbs: -30 * adjustmentStep, fats: 0 };
      }

      if (weekIndex === 0) {
        return { calories: 0, carbs: 0, fats: 0 };
      }

      if (dietPressureModel.status === "aggressive-deficit" || recoveryHeadroom < 4.5) {
        return { calories: 75 + (weekIndex - 1) * 25, carbs: 15 + (weekIndex - 1) * 5, fats: 0 };
      }

      if (dietPressureModel.mismatchWithPlan) {
        return { calories: -125 * weekIndex, carbs: -30 * weekIndex, fats: 0 };
      }

      if (primaryLimiter === "Fullness") {
        return { calories: 100 * weekIndex, carbs: 25 * weekIndex, fats: 0 };
      }

      if (primaryLimiter === "Digestion") {
        return { calories: 0, carbs: 10 * weekIndex, fats: -5 };
      }

      if (primaryLimiter === "Dryness") {
        return { calories: -75 * weekIndex, carbs: -15 * weekIndex, fats: 0 };
      }

      return { calories: 0, carbs: 0, fats: 0 };
    };

    let previousCalories = modelCalorieTarget;
    let previousCarbs = modelCarbTarget;

    return monthPlannerBlocks.map((block, index) => {
      const shift = getWeekShift(index);
      const fats = Math.max(20, modelFatTarget + shift.fats);
      const carbs = Math.max(
        30,
        roundToNearestFive(baseBufferedCarbs + shift.carbs + Math.round(shift.calories / 4))
      );
      const rawCalories = Math.max(
        1500,
        roundToNearestFive(modelProteinTarget * 4 + carbs * 4 + fats * 9)
      );
      const calories = Math.min(rawCalories, maximumRoadmapCalories);
      const carbReduction = Math.max(0, modelCarbTarget - carbs);
      const adjustmentStep = index + 1;
      const steps = modelStepTarget + (lossBehind ? Math.min(4000, adjustmentStep * 1500) : 0);
      const cardioMinutes =
        modelTargets.cardioMinutes +
        (lossBehind ? Math.min(25, adjustmentStep * 8) : primaryLimiter === "Training stress" ? -5 : 0);
      const activeMacroCalories = proteinTarget * 4 + carbTarget * 4 + fatTarget * 9;
      const alreadyActive =
        index === 0 &&
        proteinTarget === modelProteinTarget &&
        carbTarget === carbs &&
        fatTarget === fats &&
        activeStepTarget === steps;
      const needsCurrentSync = index === 0 && !alreadyActive;
      const adjustmentLabel =
        lossBehind
          ? alreadyActive
            ? "Active now"
            : index === 0
              ? "Apply now"
              : "Behind pace adjustment"
          : index === 0
            ? alreadyActive
              ? "Active now"
              : "Sync target"
            : shift.calories === 0 && shift.carbs === 0 && shift.fats === 0
              ? "Hold"
              : "Model adjustment";
      const adjustmentDetail =
        lossBehind
          ? `Actual loss ${actualWeeklyLossPct?.toFixed(2)}% is behind the ${targetWeeklyLossPct.toFixed(2)}% target. Reduce carbs by ${carbReduction}g, set steps to ${steps.toLocaleString()}, and keep protein fixed.`
          : index === 0
            ? needsCurrentSync
              ? `Active target is ${activeMacroCalories} kcal. Sync to ${calories} kcal so the ${intakeBufferPct}% tracking-error reserve and ${Math.max(0, contestPrepModel.maintenanceCalories - calories)} kcal deficit are actually active.`
              : `${intakeBufferPct}% tracking-error reserve is built in. This target is ${Math.max(0, contestPrepModel.maintenanceCalories - calories)} kcal below estimated maintenance.`
            : block.focus;
      const trainingAdjustment =
        lossBehind
          ? `Raise steps to ${steps.toLocaleString()} and cardio to ${Math.max(0, cardioMinutes)} min.`
          : `Steps ${steps.toLocaleString()}, cardio ${Math.max(0, cardioMinutes)} min.`;
      const week: ScheduleMacroProgressionWeek = {
        id: block.id,
        label: block.label,
        focus: block.focus,
        calories,
        protein: modelProteinTarget,
        carbs,
        fats,
        deltaCalories: calories - previousCalories,
        deltaCarbs: carbs - previousCarbs,
        steps,
        cardioMinutes: Math.max(0, cardioMinutes),
        intakeBufferPct,
        adjustmentLabel,
        adjustmentDetail,
        trainingAdjustment,
        projectedCondition: block.projectedCondition,
        projectedRecovery: block.projectedRecovery,
      };

      previousCalories = calories;
      previousCarbs = carbs;
      return week;
    });
  }, [
    monthPlannerBlocks,
    proteinTarget,
    carbTarget,
    fatTarget,
    activeStepTarget,
    bodyWeightTrendModel.weeklyChangePct,
    contestPrepModel.calorieErrorBufferCalories,
    contestPrepModel.calorieErrorBufferPct,
    contestPrepModel.maintenanceCalories,
    contestPrepModel.plannedDeficitCalories,
    contestPrepModel.todayTargets,
    contestPrepModel.weeklyLossTargetPct,
    selfManagedAthlete,
    dietPressureModel.status,
    dietPressureModel.mismatchWithPlan,
    recoveryHeadroom,
    primaryLimiter,
  ]);

  const setupReadinessItems = useMemo(
    () => [
      {
        label: "profile",
        title: "Profile locked",
        detail: `${athleteName.trim() || "BodyPilot athlete"}, ${bodyWeight.toFixed(1)} lb, ${profileBodyFat}% body fat, target ${targetStageWeightLb} lb.`,
        complete: Boolean(athleteName.trim()) && bodyWeight > 0 && profileBodyFat > 0 && targetStageWeightLb > 0,
      },
      {
        label: "contest",
        title: "Contest date set",
        detail: timelineSummary,
        complete: Boolean(contestDate),
      },
      {
        label: "food",
        title: "Food targets ready",
        detail: `${proteinTarget}P / ${carbTarget}C / ${fatTarget}F, ${macroCalories} kcal.`,
        complete: proteinTarget > 0 && carbTarget > 0 && fatTarget > 0,
      },
      {
        label: "training",
        title: "Training week built",
        detail: `${workoutSplit.filter((day) => day.focus.toLowerCase() !== "rest").length} sessions, ${totalPlannedSets} sets.`,
        complete: workoutSplit.some((day) => day.exercises.length > 0),
      },
      {
        label: "review",
        title: "Review loop active",
        detail: `${checkIns.length} check-ins, ${weeklySnapshots.length} weekly snapshots.`,
        complete: checkIns.length > 0,
      },
    ],
    [
      bodyWeight,
      athleteName,
      carbTarget,
      checkIns.length,
      contestDate,
      fatTarget,
      macroCalories,
      profileBodyFat,
      proteinTarget,
      targetStageWeightLb,
      timelineSummary,
      totalPlannedSets,
      weeklySnapshots.length,
      workoutSplit,
    ]
  );

  const schedulePrimaryAction = useMemo(() => {
    if (weeklyPlanSummary.totalEvents === 0) {
      return {
        title: "Build the operating week first",
        body: "Right now this is not a usable week. Generate the calendar from training, meals, and compounds before trying to review anything.",
        cta: "Populate from plan",
      };
    }

    if (scheduleDensitySummary.busiestCount >= 8) {
      return {
        title: `Simplify ${scheduleDensitySummary.busiestDay}`,
        body: `That day is overloaded with ${scheduleDensitySummary.busiestCount} events. The week should feel executable, not technically complete but impossible to follow.`,
        cta: "Review busiest day",
      };
    }

    return {
      title: "The week is structured: protect execution",
      body: "The calendar has the right pieces. The next job is reducing collisions, protecting recovery days, and keeping the athlete from missing the flow.",
      cta: "Review week",
    };
  }, [weeklyPlanSummary.totalEvents, scheduleDensitySummary.busiestCount, scheduleDensitySummary.busiestDay]);

  const scheduleRiskFlags = useMemo(() => {
    const flags: string[] = [];
    const busiest = weeklyCalendarMatrix.find((item) => item.day === scheduleDensitySummary.busiestDay);

    if ((scheduleByCategory["Training"] ?? 0) === 0) {
      flags.push("No training sessions are currently on the calendar.");
    }
    if ((scheduleByCategory["Check-in"] ?? 0) === 0) {
      flags.push("No prep check-ins are currently on the calendar.");
    }
    if (busiest && busiest.total >= 8) {
      flags.push(`${busiest.day} is overloaded with ${busiest.total} scheduled items.`);
    }
    if (weeklyPlanSummary.recoveryDays === 0) {
      flags.push("There are no explicit recovery days on the calendar.");
    }

    return flags.slice(0, 4);
  }, [scheduleByCategory, scheduleDensitySummary.busiestDay, weeklyCalendarMatrix, weeklyPlanSummary.recoveryDays]);

  const scheduleExecutionLanes = useMemo(() => {
    return scheduleGroupedByDay.map((bucket) => ({
      ...bucket,
      headline:
        bucket.events.find((event) => event.category === "Training")?.title ??
        bucket.events.find((event) => event.category === "Recovery")?.title ??
        "No main event",
    }));
  }, [scheduleGroupedByDay]);

  const weekDecisionBridge = useMemo(() => {
    return {
      title: coachRecommendation.action,
      body: coachRecommendation.reason,
      support:
        primaryLimiter === "Digestion"
          ? "The calendar should reduce food collisions and protect smoother peri-workout flow."
          : primaryLimiter === "Fullness"
            ? "The calendar should keep training days clearly fed and avoid under-support around the session."
            : primaryLimiter === "Dryness"
              ? "The calendar should reduce randomness and keep the week mechanically clean."
              : "The calendar should support execution and recovery instead of adding more noise.",
    };
  }, [coachRecommendation.action, coachRecommendation.reason, primaryLimiter]);

  const athleteWeekEssentials = useMemo(() => {
    const todayTitle = selectedTrackerDay?.title ?? "No day selected";
    const todayDate = selectedTrackerDay?.date ?? "Pick a day";
    const nextTrainingDay = scheduleExecutionLanes
      .filter((bucket) => bucket.events.some((event) => event.category === "Training"))
      .map((bucket) => ({
        ...bucket,
        nextDate: getNextCalendarDateForDay(selectedCalendarDate, bucket.day),
      }))
      .sort((left, right) => left.nextDate.localeCompare(right.nextDate))[0];

    return {
      today: {
        title: todayTitle,
        date: todayDate,
        detail: `${formatFriendlyDate(todayDate)}, ${selectedTrackerCompletedLifts}/${selectedTrackerDay?.lifts.length ?? 0} lifts done`,
      },
      next: {
        title: nextTrainingDay?.headline ?? "No next anchor loaded",
        date: nextTrainingDay?.nextDate,
        detail: nextTrainingDay
          ? `${formatFriendlyDate(nextTrainingDay.nextDate)}, ${nextTrainingDay.events.length} items on that day`
          : "Build the week so the next main event is obvious.",
      },
      rhythm: {
        title: `${weeklyPlanSummary.trainingDays} training days, ${weeklyPlanSummary.recoveryDays} recovery days`,
        detail: "Keep the week mechanically clean so the next anchor is always obvious.",
      },
    };
  }, [selectedTrackerDay, selectedTrackerCompletedLifts, selectedCalendarDate, scheduleExecutionLanes, weeklyPlanSummary]);

  const coachScheduleFocusCards = useMemo(() => {
    return [
      {
        label: "Selected day",
        title: selectedCalendarSessionLabel,
        detail: selectedCalendarSummary,
        onClick: () => openDateReference(selectedCalendarDate),
      },
      {
        label: "Weekly decision",
        title: weekDecisionBridge.title,
        detail: weekDecisionBridge.body,
        onClick: () => goToTab("coach"),
      },
      {
        label: "Phase plan",
        title: ecosystemPlanSnapshot.summary.title,
        detail: ecosystemPlanSnapshot.summary.detail,
        onClick: () => openTrackerSurface("week"),
      },
    ];
  }, [
    selectedCalendarSessionLabel,
    selectedCalendarSummary,
    selectedCalendarDate,
    weekDecisionBridge.title,
    weekDecisionBridge.body,
    ecosystemPlanSnapshot.summary.title,
    ecosystemPlanSnapshot.summary.detail,
    openTrackerSurface,
  ]);

  const athleteScheduleFocusCards = useMemo(() => {
    return [
      {
        label: "Today",
        title: athleteWeekEssentials.today.title,
        detail: athleteWeekEssentials.today.detail,
        onClick: () =>
          athleteWeekEssentials.today.date
            ? openDateReference(athleteWeekEssentials.today.date)
            : openTrackerSurface("log"),
      },
      {
        label: "Next anchor",
        title: athleteWeekEssentials.next.title,
        detail: athleteWeekEssentials.next.detail,
        onClick: () => athleteWeekEssentials.next.date ? openDateReference(athleteWeekEssentials.next.date) : goToTab("split"),
      },
      {
        label: "Phase plan",
        title: ecosystemPlanSnapshot.summary.title,
        detail: ecosystemPlanSnapshot.summary.detail,
        onClick: () => openTrackerSurface("week"),
      },
    ];
  }, [athleteWeekEssentials, ecosystemPlanSnapshot.summary.title, ecosystemPlanSnapshot.summary.detail, goToTab, openTrackerSurface]);

  const coachScienceCards = useMemo(() => {
    return performanceInsightSnapshot.coachCards;
  }, [performanceInsightSnapshot.coachCards]);

  const athleteScienceCards = useMemo(() => {
    return performanceInsightSnapshot.athleteCards;
  }, [performanceInsightSnapshot.athleteCards]);

  const coachReviewFocusCards = useMemo(() => {
    return [
      {
        label: "Active athlete",
        title: `${activeAthlete.name}, ${weeksOut} weeks out`,
        detail: `${activeAthlete.division}, ${trackerWeeklyReview.averageCompletion}% week completion`,
      },
      {
        label: "Coaching call",
        title: coachRecommendation.action,
        detail: coachInstruction,
      },
      {
        label: "Decision confidence",
        title: decisionConfidenceModel.title,
        detail: `${decisionConfidenceModel.score} / 100, limiter ${primaryLimiter}`,
      },
    ];
  }, [
    activeAthlete.name,
    activeAthlete.division,
    weeksOut,
    trackerWeeklyReview.averageCompletion,
    coachRecommendation.action,
    coachInstruction,
    decisionConfidenceModel.title,
    decisionConfidenceModel.score,
    primaryLimiter,
  ]);

  const athleteCoachFocusCards = useMemo(() => {
    return [
      {
        label: "Current direction",
        title: coachRecommendation.action,
        detail: coachRecommendation.reason,
      },
      {
        label: "Today",
        title: `${selectedTrackerExecutionScore}% execution`,
        detail: "Open Today for the live session.",
      },
      {
        label: "Trend pace",
        title: bodyWeightTrendModel.title,
        detail: bodyWeightTrendModel.detail,
      },
    ];
  }, [coachRecommendation.action, coachRecommendation.reason, selectedTrackerExecutionScore, bodyWeightTrendModel.title, bodyWeightTrendModel.detail]);

  const coachHomeFocusCards = useMemo(() => {
    return [
      {
        label: "Athlete status",
        title: athleteStatusLabel,
        detail: `${activeAthlete.name}, ${activeAthlete.division}, ${activeAthlete.status}`,
      },
      {
        label: "Decision pressure",
        title: coachRecommendation.action,
        detail: coachRecommendation.reason,
      },
      {
        label: "Latest movement",
        title: dashboardChangeSummary,
        detail: `Completion ${trackerWeeklyReview.averageCompletion}%, limiter ${primaryLimiter}`,
      },
    ];
  }, [athleteStatusLabel, activeAthlete.name, activeAthlete.division, activeAthlete.status, coachRecommendation.action, coachRecommendation.reason, dashboardChangeSummary, trackerWeeklyReview.averageCompletion, primaryLimiter]);

  const athleteHomeFocusCards = useMemo(() => {
    return [
      {
        label: "Today's job",
        title: dashboardPrimaryAction.title,
        detail: dashboardPrimaryAction.body,
        onClick: () =>
          dashboardPrimaryAction.tab === "tracker"
            ? openTrackerSurface("log")
            : dashboardPrimaryAction.tab === "nutrition"
              ? openNutritionSurface("log")
              : goToTab(dashboardPrimaryAction.tab),
      },
      {
        label: "Current day",
        title: selectedTrackerDay?.title ?? "No day selected",
        detail: `${selectedTrackerCompletedLifts}/${selectedTrackerDay?.lifts.length ?? 0} lifts done, ${loggedMacroTotals.protein}P / ${loggedMacroTotals.carbs}C / ${loggedMacroTotals.fats}F logged`,
        onClick: () => openTrackerSurface("log"),
      },
      {
        label: "Main risk",
        title: athleteOffTrackFlags[0] ?? "Nothing major is off track right now.",
        detail: `Execution ${selectedTrackerExecutionScore}%, steps ${selectedTrackerStepScore}`,
        onClick: () =>
          primaryLimiter === "Digestion"
            ? openNutritionSurface("insights")
            : openTrackerSurface("insights"),
      },
    ];
  }, [
    dashboardPrimaryAction.title,
    dashboardPrimaryAction.body,
    dashboardPrimaryAction.tab,
    selectedTrackerDay,
    selectedTrackerCompletedLifts,
    loggedMacroTotals.protein,
    loggedMacroTotals.carbs,
    loggedMacroTotals.fats,
    athleteOffTrackFlags,
    selectedTrackerExecutionScore,
    selectedTrackerStepScore,
    primaryLimiter,
    goToTab,
    openNutritionSurface,
    openTrackerSurface,
  ]);

  const coachNutritionFocusCards = useMemo(() => {
    return [
      {
        label: "Decision pressure",
        title: nutritionPrimaryAction.title,
        detail: nutritionPrimaryAction.body,
        onClick: () => openNutritionSurface("insights"),
      },
      {
        label: "Trend pace",
        title: bodyWeightTrendModel.title,
        detail: dietPressureModel.detail,
        onClick: () => openNutritionSurface("insights"),
      },
      {
        label: "Supplement watch",
        title: supportStackSnapshot.primaryAction.title,
        detail: supportStackSnapshot.primaryAction.detail,
        onClick: () => openNutritionSurface("insights"),
      },
    ];
  }, [
    nutritionPrimaryAction.title,
    nutritionPrimaryAction.body,
    bodyWeightTrendModel.title,
    dietPressureModel.detail,
    supportStackSnapshot.primaryAction.title,
    supportStackSnapshot.primaryAction.detail,
    openNutritionSurface,
  ]);

  const athleteNutritionFocusCards = useMemo(() => {
    return [
      {
        label: "Eat today like this",
        title: `${mealTotals.protein}P / ${mealTotals.carbs}C / ${mealTotals.fats}F`,
        detail: `${meals.length} meals planned, ${trainingDay ? "training day" : "off day"}. ${mealPlanScienceProfile.title}.`,
        onClick: () => openNutritionSurface("log"),
      },
      {
        label: "Trend pace",
        title: bodyWeightTrendModel.title,
        detail: bodyWeightTrendModel.detail,
        onClick: () => openNutritionSurface("insights"),
      },
      {
        label: "Supplement watch",
        title: supportStackSnapshot.primaryAction.title,
        detail: supportStackSnapshot.primaryAction.detail,
        onClick: () => openNutritionSurface("insights"),
      },
    ];
  }, [
    mealTotals.protein,
    mealTotals.carbs,
    mealTotals.fats,
    meals.length,
    trainingDay,
    mealPlanScienceProfile.title,
    mealPlanScienceProfile.detail,
    bodyWeightTrendModel.title,
    bodyWeightTrendModel.detail,
    supportStackSnapshot.primaryAction.title,
    supportStackSnapshot.primaryAction.detail,
    openNutritionSurface,
  ]);

  const dashboardDecisionTiles = useMemo(() => {
    if (userMode === "coach") {
      return [
        {
          label: "Execution truth",
          title: `${selectedTrackerExecutionScore}% daily execution`,
          detail: `${trackerWeeklyReview.averageCompletion}% average week completion.`,
          tone: selectedTrackerExecutionScore < 50 ? "amber" : "sky",
          onClick: () => openTrackerSurface("dashboard"),
        },
        {
          label: "Trend pace",
          title: bodyWeightTrendModel.title,
          detail: bodyWeightTrendModel.detail,
          tone: bodyWeightTrendModel.tone,
          onClick: () => openNutritionSurface("insights"),
        },
        {
          label: "Main limiter",
          title: primaryLimiter,
          detail: athleteStatusLabel,
          tone: primaryLimiter === "Digestion" || primaryLimiter === "Training stress" ? "amber" : "slate",
          onClick: () =>
            primaryLimiter === "Digestion"
              ? openNutritionSurface("insights")
              : primaryLimiter === "Dryness"
                ? goToTab("coach")
                : openTrackerSurface("insights"),
        },
      ] as const;
    }

    return [
        {
          label: "Current day",
          title: selectedTrackerDay?.title ?? "No day selected",
          detail: `${selectedTrackerCompletedLifts}/${selectedTrackerDay?.lifts.length ?? 0} lifts done, ${loggedMacroTotals.protein}P / ${loggedMacroTotals.carbs}C / ${loggedMacroTotals.fats}F logged.`,
          tone: "cyan",
          onClick: () => openTrackerSurface("log"),
        },
        {
          label: "Trend pace",
          title: bodyWeightTrendModel.title,
          detail: `${bodyWeightTrendModel.detail} Protein: ${proteinSupportModel.title}.`,
          tone: bodyWeightTrendModel.tone,
          onClick: () => openNutritionSurface("insights"),
        },
        {
          label: "Main risk",
          title: athleteOffTrackFlags[0] ?? "Nothing major is off track right now.",
          detail: `Execution ${selectedTrackerExecutionScore}%, steps ${selectedTrackerStepScore}.`,
          tone: athleteOffTrackFlags.length > 0 ? "amber" : "emerald",
          onClick: () =>
            primaryLimiter === "Digestion"
              ? openNutritionSurface("insights")
              : openTrackerSurface("insights"),
        },
      ] as const;
  }, [
    userMode,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    trackerWeeklyReview.averageCompletion,
    bodyWeightTrendModel.title,
    bodyWeightTrendModel.detail,
    bodyWeightTrendModel.tone,
    primaryLimiter,
    athleteStatusLabel,
    selectedTrackerDay,
    selectedTrackerCompletedLifts,
    loggedMacroTotals.protein,
    loggedMacroTotals.carbs,
    loggedMacroTotals.fats,
    proteinSupportModel.title,
    athleteOffTrackFlags,
    selectedTrackerStepScore,
    goToTab,
    openNutritionSurface,
    openTrackerSurface,
  ]);

  const nutritionDecisionTiles = useMemo(() => {
    return [
      {
        label: "Diet pressure",
        title: dietPressureModel.title,
        detail: dietPressureModel.detail,
        tone: dietPressureModel.tone,
      },
      {
        label: "Protein support",
        title: proteinSupportModel.title,
        detail: proteinSupportModel.detail,
        tone: proteinSupportModel.tone,
      },
      {
        label: "Training window",
        title: fuelTimingModel.title,
        detail: fuelTimingModel.detail,
        tone: fuelTimingModel.tone,
      },
      {
        label: "Hydration",
        title: hydrationSupportModel.title,
        detail: hydrationSupportModel.detail,
        tone: hydrationSupportModel.tone,
      },
      {
        label: "Meal quality",
        title: mealPlanScienceProfile.title,
        detail: mealPlanScienceProfile.detail,
        tone: mealPlanScienceProfile.tone,
      },
      {
        label: "Recovery pressure",
        title: recoveryPressureModel.title,
        detail: recoveryPressureModel.detail,
        tone: recoveryPressureModel.tone,
      },
      {
        label: "Supplement support",
        title: supportStackSnapshot.primaryAction.title,
        detail: supportStackSnapshot.primaryAction.detail,
        tone: supportStackSnapshot.primaryAction.tone,
      },
    ] as const;
  }, [
    dietPressureModel.title,
    dietPressureModel.detail,
    dietPressureModel.tone,
    proteinSupportModel.title,
    proteinSupportModel.detail,
    proteinSupportModel.tone,
    fuelTimingModel.title,
    fuelTimingModel.detail,
    fuelTimingModel.tone,
    hydrationSupportModel.title,
    hydrationSupportModel.detail,
    hydrationSupportModel.tone,
    mealPlanScienceProfile.title,
    mealPlanScienceProfile.detail,
    mealPlanScienceProfile.tone,
    recoveryPressureModel.title,
    recoveryPressureModel.detail,
    recoveryPressureModel.tone,
    supportStackSnapshot.primaryAction.title,
    supportStackSnapshot.primaryAction.detail,
    supportStackSnapshot.primaryAction.tone,
  ]);

  const nutritionWindowSummary = useMemo(() => {
    const pre = mealDistribution.pre ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const intra = mealDistribution.intra ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const post = mealDistribution.post ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const off = mealDistribution.off ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };
    const standard = mealDistribution.standard ?? { protein: 0, carbs: 0, fats: 0, calories: 0, count: 0 };

    if (trainingDay) {
      return [
        {
          label: "Pre",
          title: `${pre.protein}P / ${pre.carbs}C / ${pre.fats}F`,
          detail: pre.count > 0 ? `${pre.count} pre-workout block${pre.count > 1 ? "s" : ""}` : "No dedicated pre-workout block.",
          tone: pre.count > 0 ? "sky" : "amber",
        },
        {
          label: "Intra",
          title: `${intra.protein}P / ${intra.carbs}C / ${intra.fats}F`,
          detail: intra.count > 0 ? `${intra.count} intra block${intra.count > 1 ? "s" : ""}` : "No dedicated intra-workout support.",
          tone: intra.count > 0 ? "rose" : "amber",
        },
        {
          label: "Post",
          title: `${post.protein}P / ${post.carbs}C / ${post.fats}F`,
          detail: post.count > 0 ? `${post.count} post-workout block${post.count > 1 ? "s" : ""}` : "No dedicated post-workout block.",
          tone: post.count > 0 ? "emerald" : "amber",
        },
      ] as const;
    }

    return [
      {
        label: "Off meals",
        title: `${off.protein}P / ${off.carbs}C / ${off.fats}F`,
        detail: off.count > 0 ? `${off.count} off-day meal block${off.count > 1 ? "s" : ""}` : "No explicit off-day meals are tagged.",
        tone: off.count > 0 ? "amber" : "slate",
      },
      {
        label: "Standard meals",
        title: `${standard.protein}P / ${standard.carbs}C / ${standard.fats}F`,
        detail: `${standard.count} standard meal block${standard.count === 1 ? "" : "s"} loaded.`,
        tone: "slate",
      },
      {
        label: "Daily rule",
        title: "Keep digestion calm",
        detail: "Keep protein high, keep meal timing steady, and do not add extra food changes today.",
        tone: "emerald",
      },
    ] as const;
  }, [mealDistribution, trainingDay]);

  const coachStackFocusCards = useMemo(() => {
    return [
      {
        label: "Stack decision",
        title: compoundsPrimaryAction.title,
        detail: compoundsPrimaryAction.body,
        onClick: () => goToTab("compounds"),
      },
      {
        label: "Structure quality",
        title: `${enabledCompounds.length} active, ${totalWeeklyCompoundDose} total units`,
        detail: `${compoundScheduleGaps.length} unscheduled, busiest ${compoundWeekBurdenSummary.busiestDay}`,
        onClick: () => goToTab("compounds"),
      },
      {
        label: "Main stack risk",
        title: compoundRiskFlags[0] ?? "No major stack risks right now.",
        detail: `${coachRecommendation.action}, limiter ${primaryLimiter}`,
        onClick: () => goToTab(primaryLimiter === "Digestion" ? "nutrition" : "compounds"),
      },
    ];
  }, [compoundsPrimaryAction.title, compoundsPrimaryAction.body, enabledCompounds.length, totalWeeklyCompoundDose, compoundScheduleGaps.length, compoundWeekBurdenSummary.busiestDay, compoundRiskFlags, coachRecommendation.action, primaryLimiter]);

  const athleteStackFocusCards = useMemo(() => {
    return [
      {
        label: "What is active",
        title: `${enabledCompounds.length} active compounds`,
        detail: `${totalWeeklyCompoundDose} total scheduled units this week`,
        onClick: () => goToTab("compounds"),
      },
      {
        label: "Main stack cue",
        title: compoundsPrimaryAction.title,
        detail: compoundsPrimaryAction.body,
        onClick: () => goToTab("compounds"),
      },
      {
        label: "What to watch",
        title: compoundRiskFlags[0] ?? "Nothing major looks off right now.",
        detail: `Support ${compoundSignalSummary[0]?.value.toFixed(1) ?? "-"}, burden ${compoundSignalSummary[3]?.value.toFixed(1) ?? "-"}`,
        onClick: () => goToTab(primaryLimiter === "Digestion" ? "nutrition" : "compounds"),
      },
    ];
  }, [enabledCompounds.length, totalWeeklyCompoundDose, compoundsPrimaryAction.title, compoundsPrimaryAction.body, compoundRiskFlags, compoundSignalSummary, primaryLimiter]);

  const coachExerciseFocusCards = useMemo(() => {
    return [
      {
        label: "Selection decision",
        title: libraryPrimaryAction.title,
        detail: libraryPrimaryAction.body,
        onClick: () => goToTab("library"),
      },
      {
        label: "Target day",
        title: libraryTargetDaySummary.title,
        detail: libraryTargetDaySummary.body,
        onClick: () => goToTab("split"),
      },
      {
        label: "Main selection risk",
        title: libraryRiskFlags[0] ?? "No major exercise selection risks right now.",
        detail: `${filteredExerciseLibrary.length} results, ${libraryRecommendedExercises.length} recommended adds`,
        onClick: () => goToTab("library"),
      },
    ];
  }, [libraryPrimaryAction.title, libraryPrimaryAction.body, libraryTargetDaySummary.title, libraryTargetDaySummary.body, libraryRiskFlags, filteredExerciseLibrary.length, libraryRecommendedExercises.length]);

  const athleteExerciseFocusCards = useMemo(() => {
    return [
      {
        label: "Current target",
        title: libraryTargetDay?.focus ?? "No target day selected",
        detail: libraryTargetDay ? `${libraryTargetDay.exercises.length} exercises loaded, ${libraryTargetDay.day}` : "Pick the day you are actually trying to support.",
        onClick: () => goToTab("split"),
      },
      {
        label: "Best next add",
        title: libraryRecommendedExercises[0]?.name ?? "No recommendation right now",
        detail: libraryRecommendedExercises[0] ? `${libraryRecommendedExercises[0].category}, fatigue ${libraryRecommendedExercises[0].fatigue ?? 0}` : "Tighten your filters or choose a different day.",
        onClick: () => openTrainingExerciseSupport(libraryTargetDay?.id),
      },
      {
        label: "Filter rule",
        title: "Stay inside the selected day",
        detail: "This list should only surface movements that actually belong in the session you picked.",
        onClick: () => openTrainingExerciseSupport(libraryTargetDay?.id),
      },
    ];
  }, [libraryTargetDay, libraryRecommendedExercises, openTrainingExerciseSupport]);

  const populateScheduleFromPlan = (sourceSplit: WorkoutDay[] = workoutSplit) => {
    const generated: ScheduleEventLocal[] = [];
    const mappedDays = sourceSplit.map((splitDay, index) => ({
      splitDay,
      calendarDay: scheduleDayOrder[index % scheduleDayOrder.length] ?? "Mon",
      isTraining: splitDay.focus.toLowerCase() !== "rest",
    }));
    const checkInDays =
      checkInCadence === "daily"
        ? [...scheduleDayOrder]
        : checkInCadence === "3x-week"
          ? ["Mon", "Thu", "Sat"]
          : checkInCadence === "2x-week"
            ? ["Wed", "Sat"]
            : ["Sat"];

    mappedDays.forEach(({ splitDay, calendarDay, isTraining }, index) => {
      if (isTraining) {
        generated.push({
          id: `training-${splitDay.id}-${Date.now()}-${index}`,
          day: calendarDay,
          time: "17:30",
          title: `${splitDay.focus} session`,
          category: "Training",
          detail: `${splitDay.exercises.length} exercises, ${splitDay.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} sets`,
        });
      } else {
        generated.push({
          id: `recovery-${splitDay.id}-${Date.now()}-${index}`,
          day: calendarDay,
          time: "09:00",
          title: `${splitDay.focus} / recovery`,
          category: "Recovery",
          detail: "Lower demand day. Keep recovery tasks and compliance tight.",
        });
      }

      if (checkInDays.includes(calendarDay)) {
        generated.push({
          id: `checkin-${calendarDay}-${Date.now()}-${index}`,
          day: calendarDay,
          time: "07:00",
          title: "Prep check-in",
          category: "Check-in",
          detail: "Photos, scale, notes, and body read before the day drifts.",
        });
      }
    });

    enabledCompounds.forEach((compound, index) => {
      const scheduleRows = compound.schedule ?? [];
      if (scheduleRows.length === 0) {
        generated.push({
          id: `compound-${compound.id}-${Date.now()}-${index}`,
          day: "Mon",
          time: "08:00",
          title: displayCompoundName(compound),
          category: "PEDs",
          detail: `${compound.dose} ${compound.unit ?? "mg/week"}`,
        });
        return;
      }

      scheduleRows.forEach((row, rowIndex) => {
        if (row.day === "Daily") {
          scheduleDayOrder.forEach((day, dayIndex) => {
            generated.push({
              id: `compound-${compound.id}-${row.id}-${day}-${dayIndex}`,
              day,
              time: "08:00",
              title: displayCompoundName(compound),
              category: "PEDs",
              detail: `${row.amount} ${compound.unit ?? "mg/week"}`,
            });
          });
          return;
        }

        if (row.day === "Training") {
          mappedDays.filter((item) => item.isTraining).forEach((item, trainingIndex) => {
            generated.push({
              id: `compound-${compound.id}-${row.id}-training-${trainingIndex}`,
              day: item.calendarDay,
              time: "08:00",
              title: displayCompoundName(compound),
              category: "PEDs",
              detail: `${row.amount} ${compound.unit ?? "mg/week"}`,
            });
          });
          return;
        }

        const mappedDay = (scheduleDayOrder as readonly string[]).includes(row.day) ? row.day : "Mon";
        generated.push({
          id: `compound-${compound.id}-${row.id}-${rowIndex}`,
          day: mappedDay,
          time: "08:00",
          title: displayCompoundName(compound),
          category: "PEDs",
          detail: `${row.amount} ${compound.unit ?? "mg/week"}`,
        });
      });
    });

    setSchedule(generated);
    pushChangeLog({
      category: "Coach",
      title: "Rebuilt weekly schedule from plan",
      detail: `Generated ${generated.length} schedule events from training, check-ins, and compounds.`,
      impact: "The schedule now reads like a real prep operating calendar with training, review, and support work in one place.",
    });
  };

  const applyStarterFoodTargets = useCallback(() => {
    const nextTargets = contestPrepModel.todayTargets;

    setProteinTarget(nextTargets.protein);
    setCarbTarget(nextTargets.carbs);
    setFatTarget(nextTargets.fats);
    setWaterLiters(nextTargets.waterLiters);
    setSaltTsp(nextTargets.saltTsp);
    setEstimatedTdee(contestPrepModel.maintenanceCalories);
    setStepTargetAdjustment(0);

    pushChangeLog({
      category: "Nutrition",
      title: "Starter targets synced",
      detail: `${nextTargets.protein}P / ${nextTargets.carbs}C / ${nextTargets.fats}F, ${nextTargets.calories} kcal, ${nextTargets.steps.toLocaleString()} steps.`,
      impact: "The setup guide synced the active food and daily movement targets to the prep model.",
    });
    showActionReceipt({
      title: "Targets ready",
      detail: `${nextTargets.protein}P / ${nextTargets.carbs}C / ${nextTargets.fats}F and ${nextTargets.calories} kcal are active.`,
      tone: "success",
    });
  }, [contestPrepModel.maintenanceCalories, contestPrepModel.todayTargets, showActionReceipt]);

  const buildStarterTrainingWeek = useCallback(() => {
    const nextSplit = buildSplitTemplate(splitTemplate, exerciseLibrary);
    const templateLabel = splitTemplateOptions.find((item) => item.id === splitTemplate)?.label ?? splitTemplate;

    setWorkoutSplit(nextSplit);
    populateScheduleFromPlan(nextSplit);
    setTrackerSurfaceIntent({ surface: "week", nonce: Date.now() });

    showActionReceipt({
      title: "Training week ready",
      detail: `${templateLabel} is loaded and the weekly calendar was rebuilt.`,
      tone: "success",
    });
  }, [exerciseLibrary, populateScheduleFromPlan, showActionReceipt, splitTemplate]);

  const fallbackCueBank = useMemo(
    () => [coachInstruction, coachRecommendation.reason, trainingSuggestion, nutritionPreset].filter(Boolean),
    [coachInstruction, coachRecommendation.reason, trainingSuggestion, nutritionPreset]
  );

  const activeCueBank = quoteBank.length > 1
    ? quoteBank.map((entry) => (typeof entry === "string" ? entry : entry?.text ?? "")).filter(Boolean)
    : fallbackCueBank;

  const currentQuote = activeCueBank[quoteIndex % Math.max(activeCueBank.length, 1)] ?? "Stay on script.";

  const updateAdvancedEditor = useCallback(
    (key: keyof typeof defaultAdvancedEditors, value: boolean) => {
      setShowAdvancedEditors((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateAccountProfile = useCallback((patch: Partial<BodyPilotAccount>) => {
    setAccountProfile((prev) => {
      const result = updateLocalBodyPilotAccount(prev, patch);
      setAccountStatusMessage(result.message);
      setAccountStatusTone(result.ok ? "success" : "warning");
      return result.account ?? prev;
    });
  }, []);

  const updateNotificationPreference = useCallback(
    <K extends keyof NotificationPreferences,>(key: K, value: NotificationPreferences[K]) => {
      setNotificationPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationStatusMessage("This browser does not support mobile push permission.");
      return;
    }

    const result = await window.Notification.requestPermission();
    setNotificationPermission(result);
    setNotificationStatusMessage(
      result === "granted"
        ? "Notifications are enabled on this device."
        : result === "denied"
          ? "Notifications are blocked in browser settings."
          : "Notification permission is still pending."
    );

    if (result === "granted") {
      setNotificationPreferences((prev) => ({ ...prev, pushEnabled: true }));
    }
  }, []);

  const signInBodyPilotAccount = useCallback((credentials: BodyPilotCredentials) => {
    const result = signInLocalBodyPilotAccount(credentials);
    if (result.account) {
      setAccountProfile(result.account);
      setAthleteName(result.account.displayName);
      setUserMode(result.account.role === "coach" ? "coach" : "athlete");
      setSelfManagedAthlete(result.account.role !== "coached-athlete");
      setAccountSetupPromptDismissed(true);
    }
    setAccountStatusMessage(result.message);
    setAccountStatusTone(result.ok ? "success" : "warning");
  }, []);

  const createBodyPilotAccount = useCallback((input: BodyPilotCreateAccountInput) => {
    const result = createLocalBodyPilotAccount(input, athleteName);
    if (result.account) {
      setAccountProfile(result.account);
      setAthleteName(result.account.displayName);
      setUserMode(result.account.role === "coach" ? "coach" : "athlete");
      setSelfManagedAthlete(result.account.role !== "coached-athlete");
      setAccountSetupPromptDismissed(true);
    }
    setAccountStatusMessage(result.message);
    setAccountStatusTone(result.ok ? "success" : "warning");
  }, [athleteName]);

  const requestBodyPilotPasswordReset = useCallback((email: string) => {
    const result = requestLocalBodyPilotPasswordReset(email.trim() || accountProfile.email);
    setAccountStatusMessage(result.message);
    setAccountStatusTone(result.ok ? "info" : "warning");
  }, [accountProfile.email]);

  const verifyBodyPilotEmail = useCallback(() => {
    const result = verifyLocalBodyPilotEmail(accountProfile);
    if (result.account) {
      setAccountProfile(result.account);
    }
    setAccountStatusMessage(result.message);
    setAccountStatusTone(result.ok ? "success" : "warning");
  }, [accountProfile]);

  const signOutBodyPilotAccount = useCallback(() => {
    setAccountProfile((prev) => ({
      ...prev,
      status: "signed-out",
      emailVerified: false,
      lastSyncedAt: new Date().toISOString(),
    }));
    setAccountSetupPromptDismissed(false);
    setAccountStatusMessage("Signed out on this device.");
    setAccountStatusTone("info");
  }, []);

  const deleteBodyPilotAccount = useCallback((email: string) => {
    const result = deleteLocalBodyPilotAccount(accountProfile, email.trim() || accountProfile.email);

    if (!result.ok) {
      setAccountStatusMessage(result.message);
      setAccountStatusTone("warning");
      setActionReceipt({
        id: Date.now(),
        title: "Deletion blocked",
        detail: result.message,
        tone: "warning",
      });
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      clearLocalBodyPilotMembershipRecords();
      setLocalMembershipRecords([]);
      setAccountProfile({
        ...defaultBodyPilotAccount,
        displayName: "BodyPilot athlete",
        createdAt: new Date().toISOString(),
      });
      setAthleteName("BodyPilot athlete");
      setUserMode("athlete");
      setSelfManagedAthlete(true);
      setAccountSetupPromptDismissed(false);
      setBackupRestorePreview(null);
      setPendingBackupRestorePayload(null);
      setStorageIssue("Account and local workspace deleted. Reloading the clean workspace now.");
      setAccountStatusMessage(result.message);
      setAccountStatusTone("success");
      setActionReceipt({
        id: Date.now(),
        title: "Account deleted",
        detail: "The local account record, membership links, and workspace data were removed from this device.",
        tone: "success",
      });
      if (typeof window !== "undefined") {
        window.setTimeout(() => window.location.reload(), 450);
      }
    } catch {
      setAccountStatusMessage("Account deletion could not finish because browser storage was unavailable.");
      setAccountStatusTone("warning");
      setStorageIssue("Account deletion could not finish. Browser storage may be unavailable.");
      setActionReceipt({
        id: Date.now(),
        title: "Deletion failed",
        detail: "Browser storage blocked account deletion. Try again after storage permissions are available.",
        tone: "error",
      });
    }
  }, [accountProfile]);

  const openDateReference = (date: string) => {
    setSelectedCalendarDate(date);
    const trackerMatch = trackerDays.find((day) => day.date === date);
    if (trackerMatch) {
      setSelectedTrackerDayId(trackerMatch.id);
      openTrackerSurface(userMode === "coach" ? "dashboard" : "log");
      return;
    }

    const mappedDay = getScheduledSplitDayForDate(date) ?? workoutSplit.find((day) => day.focus.toLowerCase() !== "rest") ?? workoutSplit[0];
    if (mappedDay) {
      setLibraryTargetDayId(mappedDay.id);
      setTrackerTemplateDayId(mappedDay.id);
    }
    goToTab("split");
  };

  const dailyShellState = useMemo(() => {
    const workflowLead =
      (userMode === "coach" ? coachWorkflowQueue[0] : athleteWorkflowQueue[0]) ?? {
        label: "Today",
        title: "Open the current day",
        detail: "Use the current day as the starting point before you touch anything else.",
        tab: "tracker" as AppTab,
        tone: "sky" as AccentTone,
    };
    const completedLiftTotal = `${selectedTrackerCompletedLifts}/${selectedTrackerDay?.lifts.length ?? 0} lifts`;
    const foodProgress = `${loggedMacroTotals.protein}P / ${loggedMacroTotals.carbs}C / ${loggedMacroTotals.fats}F`;
    const activeDayLabel = selectedCalendarDate === todayIso ? "Today" : formatFriendlyDate(selectedCalendarDate);
    const headline =
      userMode === "coach"
        ? workflowLead.title
        : selectedTrackerMissedLifts > 0
          ? `Finish ${selectedTrackerMissedLifts} open ${selectedTrackerMissedLifts === 1 ? "lift" : "lifts"}`
          : selectedTrackerMissingFields.length > 0
            ? "Close the day cleanly"
            : workflowLead.title;
    const detail =
      userMode === "coach"
        ? workflowLead.detail
        : selectedTrackerMissingFields.length > 0
          ? `Training is mostly in. Log ${selectedTrackerMissingFields.join(", ")} before you call the day done.`
          : workflowLead.detail;
    const primaryTab =
      userMode === "athlete" && (selectedTrackerMissedLifts > 0 || selectedTrackerMissingFields.length > 0)
        ? "tracker"
        : workflowLead.tab;
    const primaryLabel =
      userMode === "athlete" && selectedTrackerMissedLifts > 0
        ? "Log lifts"
        : userMode === "athlete" && selectedTrackerMissingFields.length > 0
          ? "Close day"
          : tabActionLabel[primaryTab];

    return {
      eyebrow: userMode === "coach" ? "Daily command" : "Today in 3 seconds",
      headline,
      detail,
      primaryLabel,
      primaryTab,
      pills: [
        { Icon: CalendarRange, label: "Live day", value: `${activeDayLabel} - ${selectedCalendarSessionLabel}` },
        { Icon: ListChecks, label: "Training", value: completedLiftTotal },
        { Icon: Utensils, label: "Food", value: foodProgress },
        { Icon: Gauge, label: "Recovery", value: `${recoveryScore.toFixed(1)} / 10` },
      ],
      note:
        selectedTrackerMissingFields.length > 0
          ? {
              label: "Still missing",
              detail: `Log ${selectedTrackerMissingFields.join(", ")} so the day closes on real signal instead of memory.`,
            }
          : userMode === "coach"
            ? {
                label: "Latest publish",
                detail: truncateSummary(`${latestCoachUpdate.title}. ${latestCoachUpdate.detail}`),
              }
            : {
                label: "Coach note",
                detail: truncateSummary(latestCoachUpdate.detail || coachInstruction),
              },
      secondary:
        userMode === "coach"
          ? {
              label: "Week rhythm",
              detail: athleteWeekEssentials.rhythm.title,
            }
          : {
              label: "Next anchor",
              detail: athleteWeekEssentials.next.detail,
            },
    };
  }, [
    userMode,
    coachWorkflowQueue,
    athleteWorkflowQueue,
    selectedTrackerCompletedLifts,
    selectedTrackerDay,
    loggedMacroTotals.protein,
    loggedMacroTotals.carbs,
    loggedMacroTotals.fats,
    selectedCalendarDate,
    todayIso,
    selectedCalendarSessionLabel,
    recoveryScore,
    selectedTrackerMissedLifts,
    selectedTrackerMissingFields,
    latestCoachUpdate.title,
    latestCoachUpdate.detail,
    coachInstruction,
    athleteWeekEssentials.rhythm.title,
    athleteWeekEssentials.next.detail,
  ]);

  const dailyShellActions = useMemo(() => {
    const openDailySurface = (tab: AppTab) => {
      if (tab === "tracker") {
        openTrackerSurface(userMode === "coach" ? "dashboard" : "session");
        return;
      }

      if (tab === "nutrition") {
        openNutritionSurface("log");
        return;
      }

      goToTab(tab);
    };

    const items = [
      {
        label: dailyShellState.primaryLabel,
        tab: dailyShellState.primaryTab,
        variant: "default" as const,
        onClick: () => openDailySurface(dailyShellState.primaryTab),
      },
      {
        label: userMode === "coach" ? "Today" : "In Gym",
        tab: "tracker" as AppTab,
        variant: dailyShellState.primaryTab === "tracker" ? "ghost" as const : "outline" as const,
        onClick: () => openTrackerSurface(userMode === "coach" ? "dashboard" : "session"),
      },
      {
        label: "Add food",
        tab: "nutrition" as AppTab,
        variant: dailyShellState.primaryTab === "nutrition" ? "ghost" as const : "outline" as const,
        onClick: () => openNutritionSurface("add", "search"),
      },
      {
        label: userMode === "coach" ? "Coach desk" : workflowChangeDigest.length > 0 ? "Review changes" : "Latest update",
        tab: userMode === "coach" ? "coach" as AppTab : "dashboard" as AppTab,
        variant: "outline" as const,
        onClick: () => goToTab(userMode === "coach" ? "coach" : "dashboard"),
      },
    ];

    return items.filter((item, index, all) => all.findIndex((candidate) => candidate.tab === item.tab) === index);
  }, [
    dailyShellState.primaryLabel,
    dailyShellState.primaryTab,
    goToTab,
    openNutritionSurface,
    openTrackerSurface,
    userMode,
    workflowChangeDigest.length,
  ]);

  const dailyQuickCaptureActions = useMemo(
    () => [
      {
        label: "Food",
        helper:
          todayFuelSummary.foodEntriesLogged > 0
            ? `${todayFuelSummary.foodEntriesLogged} logged`
            : "Add meal",
        Icon: Utensils,
        onClick: () => openNutritionSurface("add", "search"),
      },
      {
        label: "Basics",
        helper:
          selectedTrackerMissingFields.length > 0
            ? selectedTrackerMissingFields.slice(0, 2).join(", ")
            : "Done",
        Icon: Gauge,
        onClick: () => openTrackerSurface("log"),
      },
      {
        label: "Lifts",
        helper: selectedTrackerMissedLifts > 0 ? `${selectedTrackerMissedLifts} open` : "Logged",
        Icon: Dumbbell,
        onClick: () => openTrackerSurface("session"),
      },
      {
        label: "Check-in",
        helper: `${conditionScore.toFixed(1)} condition`,
        Icon: NotebookPen,
        onClick: addCheckIn,
      },
    ],
    [
      addCheckIn,
      conditionScore,
      openNutritionSurface,
      openTrackerSurface,
      selectedTrackerMissedLifts,
      selectedTrackerMissingFields,
      todayFuelSummary.foodEntriesLogged,
    ]
  );

  const dailyShellDeck = (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="premium-surface hidden p-4 md:block"
    >
      <div className="grid gap-4 xl:grid-cols-[1.16fr_0.84fr] xl:items-start">
        <div className="dashboard-command-hero p-5 sm:p-6">
          <div className="dashboard-command-eyebrow inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]">
            {dailyShellState.eyebrow}
          </div>
          <div className="mt-4 text-[2rem] font-semibold leading-tight tracking-normal text-slate-950 dark:text-white">
            {dailyShellState.headline}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 dark:text-white/78">
            {dailyShellState.detail}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {dailyShellActions.map((action) => (
              <Button
                key={`${action.tab}-${action.label}`}
                variant={action.variant}
                className={action.variant === "default" ? "" : "dashboard-command-secondary"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            {dailyShellState.pills.map((pill) => (
              <HeroPill key={pill.label} Icon={pill.Icon} label={pill.label} value={pill.value} />
            ))}
          </div>

          <div className="premium-soft-surface p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                  Fast capture
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  Log first, analyze second.
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Daily
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {dailyQuickCaptureActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="group flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white/78 px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-sky-200 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                >
                  <span className="view-story-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <action.Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {action.label}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {action.helper}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="premium-soft-surface p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                {dailyShellState.note.label}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {dailyShellState.note.detail}
              </div>
            </div>
            <div className="premium-soft-surface p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                {dailyShellState.secondary.label}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {dailyShellState.secondary.detail}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );

  const activeViewMeta = useMemo<ViewMeta>(() => {
    const coach = userMode === "coach";

    switch (activeTab) {
      case "dashboard":
        return {
          title: coach ? "Command Center" : "Dashboard",
          subtitle: coach ? "See the pressure and make the next call fast." : "Direction, progress, and next actions in one place.",
          accentClass: "border-sky-200 bg-sky-50/85 dark:border-sky-800 dark:bg-sky-950/20",
          Icon: LayoutDashboard,
          chips: coach ? ["Command center", "Top signals", "Next call"] : ["Today only", "Execution", "Low friction"],
          actions: [
            { label: coach ? "Today" : "Today log", tab: "tracker" },
            {
              label: coach ? "Review package" : selfManagedAthlete ? "Meals" : "Direction",
              tab: coach ? "coach" : selfManagedAthlete ? "nutrition" : "coach",
              variant: "outline",
            },
          ],
        };
      case "ai-coach":
        return {
          title: "AI Coach",
          subtitle: "BodyPilot turns today's full signal into the next exact move.",
          accentClass: "border-blue-200 bg-blue-50/85 dark:border-blue-800 dark:bg-blue-950/20",
          Icon: Sparkles,
          chips: ["Strategy", "Actions", "Path to goal"],
          actions: [
            { label: "Add Food", tab: "nutrition", onClick: () => openNutritionSurface("add", "search") },
            { label: "Today", tab: "tracker", variant: "outline", onClick: () => openTrackerSurface("log") },
          ],
        };
      case "nutrition":
        return {
          title: coach ? "Food" : "Food log",
          subtitle: coach ? "Find the food issue, then make the smallest useful change." : "Log the day fast, keep totals obvious, and leave analysis for review mode.",
          accentClass: "border-emerald-200 bg-emerald-50/85 dark:border-emerald-800 dark:bg-emerald-950/20",
          Icon: Utensils,
          chips: coach ? ["Meal flow", "Macro pressure", "Fueling decision"] : ["Daily totals", "Fast entry", "Review separate"],
          actions: [
            { label: coach ? "Today" : "Today log", tab: "tracker" },
            {
              label: coach ? "Calendar" : selfManagedAthlete ? "Training" : "Direction",
              tab: coach ? "schedule" : selfManagedAthlete ? "split" : "coach",
              variant: "outline",
            },
          ],
        };
      case "compounds":
        return {
          title: coach ? "Stack" : "Your stack",
          subtitle: coach ? "Read support, burden, and weekly fit before changing anything." : "See what is active, what it is doing, and what to watch.",
          accentClass: "border-violet-200 bg-violet-50/85 dark:border-violet-800 dark:bg-violet-950/20",
          Icon: Pill,
          chips: coach ? ["Support vs burden", "Weekly structure", "Noise control"] : ["What is active", "What to watch", "Do not over-tweak"],
          actions: [
            { label: coach ? "Calendar" : selfManagedAthlete ? "Meals" : "Direction", tab: coach ? "schedule" : selfManagedAthlete ? "nutrition" : "coach" },
            { label: coach ? "Review package" : selfManagedAthlete ? "Today log" : "Direction", tab: coach ? "coach" : selfManagedAthlete ? "tracker" : "coach", variant: "outline" },
          ],
        };
      case "split":
        return {
          title: coach ? "Training" : "Today's session map",
          subtitle: coach ? "Build the week first. Refine the day only where it actually needs it." : "Confirm the session and stop redesigning the day from inside this tab.",
          accentClass: "border-amber-200 bg-amber-50/85 dark:border-amber-800 dark:bg-amber-950/20",
          Icon: Dumbbell,
          chips: coach ? ["Week structure", "Programming risk", "Targeted changes"] : ["Use the session", "Execute cleanly", "No random adds"],
          actions: [
            { label: coach ? "Today" : "Today log", tab: "tracker" },
            {
              label: coach ? "Exercise browser" : selfManagedAthlete ? "Exercise support" : "Today",
              tab: coach ? "library" : selfManagedAthlete ? "split" : "tracker",
              variant: "outline",
              onClick: selfManagedAthlete
                ? () => openTrainingExerciseSupport(trackerTemplateDay?.id ?? libraryTargetDay?.id)
                : undefined,
            },
          ],
        };
      case "tracker":
        return {
          title: coach ? "Today review" : "Today",
          subtitle: coach ? "Daily execution and recovery read." : "Daily execution.",
          accentClass: "border-cyan-200 bg-cyan-50/85 dark:border-cyan-800 dark:bg-cyan-950/20",
          Icon: ListChecks,
          chips: coach ? ["Execution first", "Daily review", "Fast diagnosis"] : ["Execute", "Log it", "Move on"],
          actions: [
            { label: coach ? "Food" : "Meals", tab: "nutrition" },
            {
              label: coach ? "Calendar" : selfManagedAthlete ? "Training" : "Direction",
              tab: coach ? "schedule" : selfManagedAthlete ? "split" : "coach",
              variant: "outline",
            },
          ],
        };
      case "library":
        return {
          title: "Exercise browser",
          subtitle: coach ? "Use the deeper reference only when Training needs a cleaner slot solve." : "Match the selected day cleanly, then return to Training.",
          accentClass: "border-fuchsia-200 bg-fuchsia-50/85 dark:border-fuchsia-800 dark:bg-fuchsia-950/20",
          Icon: Dumbbell,
          chips: coach ? ["Find the slot", "Good fits", "Back to training"] : ["Match the day", "Keep it relevant", "Back to training"],
          actions: [
            { label: coach ? "Training" : "Today log", tab: coach ? "split" : "tracker" },
            {
              label: coach ? "Today execution" : selfManagedAthlete ? "Training map" : "Direction",
              tab: coach ? "tracker" : selfManagedAthlete ? "split" : "coach",
              variant: "outline",
            },
          ],
        };
      case "schedule":
        return {
          title: "Full calendar",
          subtitle: coach ? "Use the deeper planner for date and session edits." : "Review the broader calendar only when Today is not enough.",
          accentClass: "border-indigo-200 bg-indigo-50/85 dark:border-indigo-800 dark:bg-indigo-950/20",
          Icon: CalendarRange,
          chips: coach ? ["Operating calendar", "Collisions", "Mechanical flow"] : ["Calendar context", "Session anchors", "Keep it clean"],
          actions: [
            { label: coach ? "Review package" : "Today log", tab: coach ? "coach" : "tracker" },
            {
              label: coach ? "Today execution" : selfManagedAthlete ? "Meals" : "Dashboard",
              tab: coach ? "tracker" : selfManagedAthlete ? "nutrition" : "dashboard",
              variant: "outline",
            },
          ],
        };
      case "coach":
      default:
        return {
          title: coach ? "Coach" : "Direction",
          subtitle: coach ? "See the athlete, write the update, and publish one clear direction." : "Current direction, latest update, and the fastest path back to today.",
          accentClass: "border-rose-200 bg-rose-50/85 dark:border-rose-800 dark:bg-rose-950/20",
          Icon: NotebookPen,
          chips: coach ? ["Diagnose", "Decide", "Publish"] : ["Current direction", "Latest update", "Back to today"],
          actions: [
            { label: coach ? "Calendar" : "Today log", tab: coach ? "schedule" : "tracker" },
            {
              label: coach ? "Command center" : selfManagedAthlete ? "Meals" : "Dashboard",
              tab: coach ? "dashboard" : selfManagedAthlete ? "nutrition" : "dashboard",
              variant: "outline",
            },
          ],
        };
    }
  }, [
    activeTab,
    libraryTargetDay?.id,
    openNutritionSurface,
    openTrackerSurface,
    openTrainingExerciseSupport,
    selfManagedAthlete,
    trackerTemplateDay?.id,
    userMode,
  ]);

  useEffect(() => {
    document.title = `${BODY_PILOT_BRAND.name} - ${activeViewMeta.title}`;
  }, [activeViewMeta.title]);

  const activeViewSignal = useMemo(() => {
    const macroTargetTotal = Math.max(1, proteinTarget + carbTarget + fatTarget);
    const macroLoggedTotal = mealTotals.protein + mealTotals.carbs + mealTotals.fats;
    const macroProgress = clamp(Math.round((macroLoggedTotal / macroTargetTotal) * 100), 0, 100);
    const scheduleProgress = clamp(Math.round((scheduleDensitySummary.total / Math.max(1, 42)) * 100), 0, 100);
    const libraryProgress = clamp(Math.round((libraryRecommendedExercises.length / Math.max(1, 8)) * 100), 0, 100);
    const compoundProgress = clamp(Math.round((enabledCompounds.length / Math.max(1, 6)) * 100), 0, 100);

    switch (activeTab) {
      case "ai-coach":
        return {
          label: "Plan confidence",
          value: decisionConfidenceModel.score,
          unit: "%",
          detail: `${primaryLimiter}, ${complianceConfidence.label} compliance`,
          metricA: `${weeksOut} weeks out`,
          metricB: `${todayCompletionItems.filter((item) => !item.done).length} open`,
          line: [decisionConfidenceModel.score, complianceConfidence.score, selectedTrackerExecutionScore],
        };
      case "nutrition":
        return {
          label: "Macro line",
          value: macroProgress,
          unit: "%",
          detail: `${mealTotals.protein}/${mealTotals.carbs}/${mealTotals.fats} logged`,
          metricA: `${todayFuelSummary.calorieRemaining >= 0 ? todayFuelSummary.calorieRemaining : 0} kcal left`,
          metricB: `${todayFuelSummary.foodEntriesLogged} foods`,
          line: [proteinTarget, carbTarget, fatTarget].map((target, index) => {
            const logged = [mealTotals.protein, mealTotals.carbs, mealTotals.fats][index] ?? 0;
            return clamp(Math.round((logged / Math.max(1, target)) * 100), 0, 100);
          }),
        };
      case "compounds":
        return {
          label: "Stack clarity",
          value: compoundProgress,
          unit: "%",
          detail: `${enabledCompounds.length} active entries`,
          metricA: `${compoundRiskFlags.length} flags`,
          metricB: `${totalWeeklyCompoundDose} units`,
          line: [enabledCompounds.length * 12, compoundRiskFlags.length * 16, compoundScheduleGaps.length * 18],
        };
      case "split":
        return {
          label: "Week load",
          value: clamp(Math.round(weeklyDensityScore * 10), 0, 100),
          unit: "%",
          detail: `${splitBuilderStats.totalDays} days, ${splitBuilderStats.totalExercises} exercises`,
          metricA: `${totalPlannedSets} sets`,
          metricB: `${adaptationSnapshot.weeklyCoveragePct}% logged`,
          line: [avgVolume * 10, avgIntensity * 10, avgSystemicLoad * 10],
        };
      case "tracker":
        return {
          label: "Today closeout",
          value: selectedTrackerCompletionPct,
          unit: "%",
          detail: `${selectedTrackerMissingFields.length} gap${selectedTrackerMissingFields.length === 1 ? "" : "s"}`,
          metricA: `${selectedTrackerStepScore} steps`,
          metricB: `${selectedTrackerMissingFields.length} gaps`,
          line: [selectedTrackerExecutionScore, athleteCompletionProgress, trackerWeeklyReview.averageCompletion],
        };
      case "library":
        return {
          label: "Match quality",
          value: libraryProgress,
          unit: "%",
          detail: `${libraryRecommendedExercises.length} recommended adds`,
          metricA: `${filteredExerciseLibrary.length} results`,
          metricB: libraryTargetDaySummary.title,
          line: [libraryRecommendedExercises.length * 14, filteredExerciseLibrary.length / 2, libraryRiskFlags.length * 18],
        };
      case "schedule":
        return {
          label: "Calendar density",
          value: scheduleProgress,
          unit: "%",
          detail: `${scheduleDensitySummary.total} events across ${scheduleDensitySummary.categories} lanes`,
          metricA: `${scheduleDensitySummary.busiestDay}: ${scheduleDensitySummary.busiestCount}`,
          metricB: `${weeksOut} weeks out`,
          line: [scheduleDensitySummary.total * 2, scheduleDensitySummary.busiestCount * 12, weeklyPlanSummary.recoveryDays * 18],
        };
      case "coach":
        return {
          label: "Decision signal",
          value: decisionConfidenceModel.score,
          unit: "%",
          detail: `${complianceConfidence.label} compliance, ${primaryLimiter}`,
          metricA: `${dashboardQueuedChanges.length} queued`,
          metricB: latestCoachUpdate.title,
          line: [decisionConfidenceModel.score, complianceConfidence.score, selectedTrackerExecutionScore],
        };
      case "dashboard":
      default:
        return {
          label: "Readiness",
          value: athleteCompletionProgress,
          unit: "%",
          detail: `${selectedTrackerExecutionScore}% execution today`,
          metricA: `${trackerWeeklyReview.averageCompletion}% week`,
          metricB: `${recoveryScore.toFixed(1)} recovery`,
          line: [athleteCompletionProgress, selectedTrackerExecutionScore, trackerWeeklyReview.averageCompletion],
        };
    }
  }, [
    activeTab,
    adaptationSnapshot.weeklyCoveragePct,
    athleteCompletionProgress,
    avgIntensity,
    avgSystemicLoad,
    avgVolume,
    carbTarget,
    complianceConfidence.label,
    complianceConfidence.score,
    compoundRiskFlags.length,
    compoundScheduleGaps.length,
    dashboardQueuedChanges.length,
    decisionConfidenceModel.score,
    enabledCompounds.length,
    fatTarget,
    filteredExerciseLibrary.length,
    latestCoachUpdate.title,
    libraryRecommendedExercises.length,
    libraryRiskFlags.length,
    libraryTargetDaySummary.title,
    mealTotals.carbs,
    mealTotals.fats,
    mealTotals.protein,
    primaryLimiter,
    proteinTarget,
    recoveryScore,
    scheduleDensitySummary.busiestCount,
    scheduleDensitySummary.busiestDay,
    scheduleDensitySummary.categories,
    scheduleDensitySummary.total,
    selectedTrackerCompletedLifts,
    selectedTrackerCompletionPct,
    selectedTrackerDay,
    selectedTrackerExecutionScore,
    selectedTrackerMissingFields.length,
    selectedTrackerStepScore,
    splitBuilderStats.totalDays,
    splitBuilderStats.totalExercises,
    todayCompletionItems,
    todayFuelSummary.calorieRemaining,
    todayFuelSummary.foodEntriesLogged,
    totalPlannedSets,
    totalWeeklyCompoundDose,
    trackerWeeklyReview.averageCompletion,
    weeklyDensityScore,
    weeklyPlanSummary.recoveryDays,
    weeksOut,
  ]);

  const activeViewLinePoints = useMemo(() => {
    const values = activeViewSignal.line.map((value) => clamp(Number(value) || 0, 0, 100));
    const safeValues = values.length > 1 ? values : [0, values[0] ?? 0];
    return safeValues
      .map((value, index) => {
        const x = safeValues.length === 1 ? 50 : (index / (safeValues.length - 1)) * 100;
        const y = 76 - (value / 100) * 54;
        return `${x},${y}`;
      })
      .join(" ");
  }, [activeViewSignal.line]);

  const viewStoryDeck = (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="view-story-deck hidden md:block"
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.72fr)_auto] xl:items-stretch">
        <div className="view-story-hero flex min-w-0 items-start gap-3 p-4">
          <div className="view-story-icon flex h-11 w-11 shrink-0 items-center justify-center">
            {React.createElement(activeViewMeta.Icon, { className: "h-5 w-5" })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                {activeViewMeta.title}
              </div>
              <Badge variant="default" className="text-[10px]">
                {activeViewSignal.label}
              </Badge>
            </div>
            <div className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">
              {activeViewMeta.subtitle}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeViewMeta.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/80 bg-white/72 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="view-story-stat flex items-center gap-2 p-2.5">
            <div
              className="view-meter relative h-12 w-12 shrink-0 rounded-full"
              style={{ "--meter": String(activeViewSignal.value) } as React.CSSProperties}
            >
              <div className="absolute inset-0 z-10 flex items-center justify-center text-sm font-semibold text-slate-950 dark:text-slate-100">
                {Math.round(activeViewSignal.value)}
                {activeViewSignal.unit}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                Signal
              </div>
              <div className="truncate text-xs font-semibold text-slate-950 dark:text-slate-100">
                {activeViewSignal.detail}
              </div>
            </div>
          </div>

          <div className="view-story-stat p-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Current
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
              {activeViewSignal.metricA}
            </div>
          </div>

          <div className="view-story-stat p-2.5">
            <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Next
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
              {activeViewSignal.metricB}
            </div>
          </div>

          <div className="view-story-stat p-2.5 sm:col-span-3">
            <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="metric-sparkline h-9 w-full">
              <rect x="0" y="0" width="100" height="12" fill="#22c55e" opacity="0.1" />
              <rect x="0" y="12" width="100" height="13" fill="#f59e0b" opacity="0.1" />
              <rect x="0" y="25" width="100" height="13" fill="#ef4444" opacity="0.1" />
              <line x1="0" x2="100" y1="31" y2="31" stroke="currentColor" strokeOpacity="0.14" />
              <polyline points={activeViewLinePoints} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:w-[9.5rem] xl:flex-col xl:justify-center">
          {activeViewMeta.actions.map((action) => (
            <Button
              key={`${activeTab}-${action.label}`}
              size="sm"
              className="xl:w-full"
              variant={action.variant ?? "default"}
              onClick={() => action.onClick ? action.onClick() : goToTab(action.tab)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </motion.section>
  );

  const primaryWorkspaceNav = useMemo<WorkspaceNavItem[]>(
    () =>
      [
        {
          value: "dashboard",
          label: "Dashboard",
          helper: "Home",
          stat: userMode === "coach" ? `${trackerWeeklyReview.averageCompletion}% week` : `${athleteCompletionProgress}% complete`,
          Icon: LayoutDashboard,
        },
        {
          value: "ai-coach",
          label: "AI Coach",
          helper: "Strategy",
          stat: `${decisionConfidenceModel.score}% signal`,
          Icon: Sparkles,
        },
        {
          value: "tracker",
          label: "Today",
          helper: "Log",
          stat: `${selectedTrackerExecutionScore}%`,
          Icon: ListChecks,
        },
        userMode === "coach"
          ? {
              value: "coach",
              label: "Coach",
              helper: "Publish",
              stat: `${complianceConfidence.label} signal`,
              Icon: NotebookPen,
            }
          : null,
      ].filter(Boolean) as WorkspaceNavItem[],
    [
      userMode,
      trackerWeeklyReview.averageCompletion,
      athleteCompletionProgress,
      selectedTrackerCompletedLifts,
      selectedTrackerDay,
      selectedTrackerExecutionScore,
      complianceConfidence.label,
      decisionConfidenceModel.score,
    ]
  );

  const builderWorkspaceNav = useMemo<WorkspaceNavItem[]>(
    () => {
      const items: WorkspaceNavItem[] = [
        {
          value: "nutrition",
          label: "Food",
          helper: "Meals",
          stat: `${proteinTarget}/${carbTarget}/${fatTarget}`,
          Icon: Utensils,
        },
        {
          value: "split",
          label: "Training",
          helper: "Plan",
          stat: `${splitBuilderStats.totalDays} days / ${splitBuilderStats.totalExercises} moves`,
          Icon: Dumbbell,
        },
      ];
      
      if (showAdvancedEditors.compounds && (userMode === "coach" || selfManagedAthlete)) {
        items.push({
          value: "compounds",
          label: "Stack",
          helper: "Support",
          stat: `${enabledCompounds.length} active`,
          Icon: Pill,
        });
      }
      
      return items;
    },
    [
      userMode,
      proteinTarget,
      carbTarget,
      fatTarget,
      splitBuilderStats.totalDays,
      splitBuilderStats.totalExercises,
      enabledCompounds.length,
      showAdvancedEditors.compounds,
      selfManagedAthlete,
    ]
  );

  const mobileDockNav = useMemo<MobileFastAction[]>(() => {
    if (userMode === "coach") {
      return [
        {
          key: "queue",
          label: "Queue",
          helper: "Calls",
          Icon: LayoutDashboard,
          variant: activeTab === "dashboard" ? "default" : "ghost",
          active: activeTab === "dashboard",
          onClick: () => goToTab("dashboard"),
        },
        {
          key: "today",
          label: "Today",
          helper: "Review",
          Icon: ListChecks,
          variant: activeTab === "tracker" ? "default" : "ghost",
          active: activeTab === "tracker",
          onClick: () => openTrackerSurface("dashboard"),
        },
        {
          key: "food",
          label: "Food",
          helper: "Fuel",
          Icon: Utensils,
          variant: activeTab === "nutrition" ? "default" : "ghost",
          active: activeTab === "nutrition",
          onClick: () => openNutritionSurface("log", "search"),
        },
        {
          key: "publish",
          label: "Publish",
          helper: "Coach",
          Icon: NotebookPen,
          variant: activeTab === "coach" ? "default" : "outline",
          active: activeTab === "coach",
          onClick: () => goToTab("coach"),
        },
      ];
    }

    const dayHasStarted =
      selectedTrackerCompletionPct > 0 ||
      selectedTrackerStepScore > 0 ||
      todayFuelSummary.foodEntriesLogged > 0 ||
      selectedTrackerMissedLifts < (selectedTrackerDay?.lifts.length ?? 0);
    const needsCoachReceipt = Boolean(latestPublishedDecision && latestPublishedDecision.status !== "acknowledged");
    const commandAction: MobileFastAction =
      needsCoachReceipt
        ? {
            key: "update",
            label: "Update",
            helper: "New",
            Icon: NotebookPen,
            variant: "default",
            onClick: () => {
              goToTab("coach");
            },
          }
        : selectedTrackerDay && selectedTrackerDay.closeoutStatus !== "closed" && dayHasStarted
          ? {
              key: "closeout",
              label: "Close",
              helper: "Done",
              Icon: Sparkles,
              variant: "default",
              onClick: () => {
                closeTrackerDay(selectedTrackerDay.id, "Closed from mobile dock.");
                openTrackerSurface("log");
              },
            }
          : !dayHasStarted
            ? {
                key: "start",
                label: "Start",
                helper: "Gym",
                Icon: Dumbbell,
                variant: "default",
                active: activeTab === "tracker",
                onClick: () => openTrackerSurface("session"),
              }
            : {
                key: selfManagedAthlete ? "week" : "direction",
                label: selfManagedAthlete ? "Week" : "Coach",
                helper: selfManagedAthlete ? "Plan" : "Update",
                Icon: selfManagedAthlete ? CalendarRange : NotebookPen,
                variant: activeTab === (selfManagedAthlete ? "tracker" : "coach") ? "default" : "outline",
                active: activeTab === (selfManagedAthlete ? "tracker" : "coach"),
                onClick: () => (selfManagedAthlete ? openTrackerSurface("week") : goToTab("coach")),
              };

    return [
      {
        key: "home",
        label: "Home",
        helper: "Next",
        Icon: LayoutDashboard,
        variant: activeTab === "dashboard" ? "default" : "ghost",
        active: activeTab === "dashboard",
        onClick: () => goToTab("dashboard"),
      },
      {
        key: "gym",
        label: "Gym",
        helper: selectedTrackerMissedLifts > 0 ? `${selectedTrackerMissedLifts} open` : "Log",
        Icon: Dumbbell,
        variant: activeTab === "tracker" ? "default" : "ghost",
        active: activeTab === "tracker",
        onClick: () => openTrackerSurface("session"),
      },
      {
        key: "food",
        label: "Food",
        helper: todayFuelSummary.foodEntriesLogged > 0 ? `${todayFuelSummary.foodEntriesLogged} logged` : "Add",
        Icon: Utensils,
        variant: activeTab === "nutrition" ? "default" : "ghost",
        active: activeTab === "nutrition",
        onClick: () => openNutritionSurface("add", "search"),
      },
      commandAction,
    ];
  }, [
    activeTab,
    closeTrackerDay,
    goToTab,
    latestPublishedDecision,
    openNutritionSurface,
    openTrackerSurface,
    selectedTrackerCompletionPct,
    selectedTrackerDay,
    selectedTrackerMissedLifts,
    selectedTrackerStepScore,
    selfManagedAthlete,
    todayFuelSummary.foodEntriesLogged,
    userMode,
  ]);

  const workspaceTint = useMemo(() => {
    return "view-ambient-field";
  }, [activeTab]);

  const isBuilderWorkspace = useMemo(
    () => builderWorkspaceNav.some((item) => item.value === activeTab),
    [builderWorkspaceNav, activeTab]
  );

  const coachRosterCards = useMemo(() => {
    return athleteRoster.map((athlete) => {
      const isActive = athlete.id === selectedAthleteId;
      if (athlete.status === "Peak push") {
        return {
          id: athlete.id,
          name: athlete.name,
          division: athlete.division,
          status: athlete.status,
          detail: isActive
            ? `${trackerWeeklyReview.averageCompletion}% week completion, ${primaryLimiter} is the active limiter.`
            : "Peak-week style read: confirm execution, food flow, and the visual before changing anything.",
          tone: "sky" as const,
          active: isActive,
        };
      }

      if (athlete.status === "Check-in review") {
        return {
          id: athlete.id,
          name: athlete.name,
          division: athlete.division,
          status: athlete.status,
          detail: isActive
            ? `${complianceConfidence.label} confidence, publish one clear correction.`
            : "Compare the check-in against last week, confirm adherence, and keep the coaching call simple.",
          tone: "amber" as const,
          active: isActive,
        };
      }

      return {
        id: athlete.id,
        name: athlete.name,
        division: athlete.division,
        status: athlete.status,
        detail: isActive
          ? `${weeklyPlanSummary.trainingDays} training days scheduled. Keep the week mechanically clean before adding more load.`
          : "Shape the week first, reduce redundancy, and only then refine the day-level details.",
        tone: "emerald" as const,
        active: isActive,
      };
    });
  }, [
    athleteRoster,
    selectedAthleteId,
    trackerWeeklyReview.averageCompletion,
    primaryLimiter,
    complianceConfidence.label,
    weeklyPlanSummary.trainingDays,
  ]);

  const activeAthleteReplyCount = useMemo(
    () =>
      coachThreadMessages.filter(
        (message) => message.athleteId === activeAthlete.id && message.author === "athlete" && !message.readAt
      ).length,
    [activeAthlete.id, coachThreadMessages]
  );

  const coachTriageBuildInput = useMemo(
    () => ({
      activeAthlete,
      athleteRoster,
      todayFood: {
        entriesLogged: todayFuelSummary.foodEntriesLogged,
        caloriesRemaining: Math.max(0, todayFuelSummary.calorieRemaining),
        proteinRemaining: Math.max(0, todayFuelSummary.proteinTarget - todayFuelSummary.proteinConsumed),
      },
      selectedTrackerMissedLifts,
      selectedTrackerExecutionScore,
      recoveryScore,
      sleepHours,
      checkInReview: checkInReviewSnapshot,
      latestPublishedDecision,
      dashboardQueuedChanges,
      pendingInvites: pendingCoachMemberships,
      athleteReplyCount: activeAthleteReplyCount,
      trackerWeeklyCompletion: trackerWeeklyReview.averageCompletion,
    }),
    [
      activeAthlete,
      activeAthleteReplyCount,
      athleteRoster,
      checkInReviewSnapshot,
      dashboardQueuedChanges,
      latestPublishedDecision,
      pendingCoachMemberships,
      recoveryScore,
      selectedTrackerExecutionScore,
      selectedTrackerMissedLifts,
      sleepHours,
      todayFuelSummary.calorieRemaining,
      todayFuelSummary.foodEntriesLogged,
      todayFuelSummary.proteinConsumed,
      todayFuelSummary.proteinTarget,
      trackerWeeklyReview.averageCompletion,
    ]
  );

  const coachShellTriageRows = useMemo(
    () =>
      buildCoachTriageRows({
        ...coachTriageBuildInput,
        includeRoutineRows: false,
      }),
    [coachTriageBuildInput]
  );

  const coachWorkspaceTriageRows = useMemo(
    () =>
      buildCoachTriageRows({
        ...coachTriageBuildInput,
        decisionSignalGate,
        includeRoutineRows: true,
      }),
    [coachTriageBuildInput, decisionSignalGate]
  );

  const coachTriageFilterOptions = useMemo(
    () =>
      buildCoachTriageFilterOptions(coachShellTriageRows, [
        "food",
        "training",
        "recovery",
        "check-in",
        "invites",
        "updates",
      ]),
    [coachShellTriageRows]
  );

  const visibleCoachTriageRows = useMemo(
    () => filterCoachTriageRows(coachShellTriageRows, coachTriageFilter),
    [coachShellTriageRows, coachTriageFilter]
  );

  const topCoachTriageRow = coachShellTriageRows[0] ?? null;
  const criticalCoachTriageCount = coachShellTriageRows.filter((item) => item.priority >= 82).length;

  const openCoachTriageItem = useCallback(
    (item: CoachTriageRow) => {
      if (item.athleteId) {
        setSelectedAthleteId(item.athleteId);
      }

      if (item.bucket === "invites") {
        setShowCoachRoster(true);
        return;
      }

      if (item.bucket === "food") {
        openNutritionSurface("add", "search");
        return;
      }

      if (item.bucket === "training" || item.bucket === "recovery" || item.bucket === "data") {
        openTrackerSurface("log");
        return;
      }

      if (item.bucket === "check-in" || item.bucket === "updates" || item.bucket === "publish" || item.bucket === "support") {
        goToTab("coach");
        return;
      }

      goToTab("schedule");
    },
    [goToTab, openNutritionSurface, openTrackerSurface]
  );

  const primaryMobileAction = dailyShellActions[0];
  const mobileCoachUpdateNeedsReceipt = Boolean(
    userMode === "athlete" &&
      !selfManagedAthlete &&
      latestPublishedDecision &&
      latestPublishedDecision.status !== "acknowledged"
  );
  const mobileCoachUpdateDiff = mobileCoachUpdateNeedsReceipt ? publishedPlanDiffs[0] : null;
  const notificationHasUsableChannel =
    notificationPreferences.emailEnabled ||
    (notificationPreferences.pushEnabled && notificationPermission === "granted");
  const notificationDeliveryLabel = (() => {
    if (notificationPreferences.pushEnabled && notificationPermission === "granted" && notificationPreferences.emailEnabled) {
      return "Push + email";
    }

    if (notificationPreferences.pushEnabled && notificationPermission === "granted") {
      return "Push";
    }

    if (notificationPreferences.emailEnabled) {
      return notificationPreferences.pushEnabled ? "Email fallback" : "Email";
    }

    if (notificationPreferences.pushEnabled) {
      return "Push permission needed";
    }

    return "No channel";
  })();
  const notificationReminderSchedule = useMemo<NotificationReminderScheduleItem[]>(() => {
    const reminderStatus = (
      preferenceKey: keyof NotificationPreferences,
      shouldTrigger: boolean
    ): NotificationReminderScheduleItem["status"] => {
      if (!notificationPreferences[preferenceKey]) return "off";
      if (!notificationHasUsableChannel) return "blocked";
      return shouldTrigger ? "armed" : "waiting";
    };
    const proteinRemaining = Math.max(0, proteinTarget - todayFuelSummary.proteinConsumed);
    const foodGapOpen =
      todayFuelSummary.foodEntriesLogged === 0 ||
      Math.max(0, todayFuelSummary.calorieRemaining) > 250 ||
      proteinRemaining > 25;
    const closeoutOpen = selectedTrackerDay?.closeoutStatus !== "closed";
    const basicsOpen = selectedTrackerMissingFields.length > 0;
    const trainingOpen = selectedTrackerMissedLifts > 0;
    const coachUpdateOpen = Boolean(
      !selfManagedAthlete &&
        latestPublishedDecision &&
        latestPublishedDecision.status !== "acknowledged"
    );
    const planChangeOpen = dashboardQueuedChanges.length > 0;
    const checkInOpen = checkInReviewSnapshot.status !== "on-track";

    const items: NotificationReminderScheduleItem[] = [
      {
        id: "food-gap",
        label: "Food gap",
        title: foodGapOpen
          ? todayFuelSummary.foodEntriesLogged === 0
            ? "First food still missing"
            : "Macros still open"
          : "Food reminder is quiet",
        detail: foodGapOpen
          ? `${Math.max(0, todayFuelSummary.calorieRemaining)} kcal and ${proteinRemaining}g protein remain open.`
          : `${todayFuelSummary.foodEntriesLogged} food entries logged and targets are close enough.`,
        trigger: "Checks mid-day and after planned meal windows.",
        delivery: notificationDeliveryLabel,
        status: reminderStatus("logFoodReminder", foodGapOpen),
        preferenceKey: "logFoodReminder",
      },
      {
        id: "closeout",
        label: "Closeout",
        title: closeoutOpen ? "Daily closeout still open" : "Day already closed",
        detail: closeoutOpen
          ? basicsOpen
            ? `Closeout waits on ${selectedTrackerMissingFields.join(", ")}.`
            : "Closeout reminder will nudge only after the day has enough signal."
          : "Closeout is saved for the selected day.",
        trigger: `After quiet prep window, before ${notificationPreferences.quietHoursStart}.`,
        delivery: notificationDeliveryLabel,
        status: reminderStatus("closeoutReminder", closeoutOpen),
        preferenceKey: "closeoutReminder",
      },
      {
        id: "training",
        label: "Training",
        title: trainingOpen ? `${selectedTrackerMissedLifts} lifts still open` : "Training reminder is quiet",
        detail: trainingOpen
          ? "Follow-up stays tied to open lift logs, not a generic workout nudge."
          : "No open lift reminder for the selected day.",
        trigger: `Before ${selectedCalendarSessionLabel}; follows up if lifts remain open.`,
        delivery: notificationDeliveryLabel,
        status: reminderStatus("trainingReminder", trainingOpen),
        preferenceKey: "trainingReminder",
      },
      {
        id: "check-in",
        label: "Check-in",
        title: checkInOpen ? checkInReviewSnapshot.title : "Check-in cadence is current",
        detail: checkInOpen
          ? checkInReviewSnapshot.detail
          : "No check-in reminder is needed right now.",
        trigger: "Morning review window on due or soon check-in days.",
        delivery: notificationDeliveryLabel,
        status: reminderStatus("checkInReminder", checkInOpen),
        preferenceKey: "checkInReminder",
      },
      ...(!selfManagedAthlete
        ? [
            {
              id: "coach-update",
              label: "Coach update",
              title: coachUpdateOpen ? "Coach update needs receipt" : "Coach update reminder is quiet",
              detail: coachUpdateOpen
                ? `${latestPublishedDecision?.title ?? "Latest update"} is waiting for athlete acknowledgement.`
                : "No unacknowledged coach update is waiting.",
              trigger: "Immediately when a coach publishes or asks for receipt.",
              delivery: notificationDeliveryLabel,
              status: reminderStatus("coachUpdateAlert", coachUpdateOpen),
              preferenceKey: "coachUpdateAlert" as keyof NotificationPreferences,
            },
          ]
        : []),
      {
        id: "plan-change",
        label: "Plan change",
        title: planChangeOpen ? "Plan changes are queued" : "Plan change reminder is quiet",
        detail: planChangeOpen
          ? dashboardQueuedChanges[0] ?? "Plan changes are waiting for review."
          : "No unsent plan-change alert is pending.",
        trigger: "When nutrition, training, schedule, or targets are changed.",
        delivery: notificationDeliveryLabel,
        status: reminderStatus("planChangeAlert", planChangeOpen),
        preferenceKey: "planChangeAlert",
      },
    ];

    return items;
  }, [
    checkInReviewSnapshot.detail,
    checkInReviewSnapshot.status,
    checkInReviewSnapshot.title,
    dashboardQueuedChanges,
    latestPublishedDecision,
    notificationDeliveryLabel,
    notificationHasUsableChannel,
    notificationPreferences,
    proteinTarget,
    selectedCalendarSessionLabel,
    selectedTrackerDay?.closeoutStatus,
    selectedTrackerMissedLifts,
    selectedTrackerMissingFields,
    selfManagedAthlete,
    todayFuelSummary.calorieRemaining,
    todayFuelSummary.foodEntriesLogged,
    todayFuelSummary.proteinConsumed,
  ]);
  const armedReminderCount = notificationReminderSchedule.filter((item) => item.status === "armed").length;
  const enabledReminderCount = notificationReminderSchedule.filter((item) => item.status !== "off").length;
  const notificationDeliveryContracts = useMemo<NotificationDeliveryContract[]>(() => {
    return [
      ...localBodyPilotNotificationAdapter.buildDeliveryContracts({
        preferences: notificationPreferences,
        reminderSchedule: notificationReminderSchedule,
        notificationPermission,
        userMode,
        selfManagedAthlete,
        pendingMembershipInviteCount: pendingCoachMemberships.length + pendingAthleteMembershipInvites.length,
        activeMembershipCount: activeCoachMemberships.length + (activeAthleteMembershipConnection ? 1 : 0),
        queuedPlanChangeCount: dashboardQueuedChanges.length,
        latestMembershipEventTitle: latestMembershipAuditEvent?.title ?? null,
      }),
    ];
  }, [
    activeAthleteMembershipConnection,
    activeCoachMemberships.length,
    dashboardQueuedChanges.length,
    latestMembershipAuditEvent?.title,
    notificationPermission,
    notificationPreferences,
    notificationReminderSchedule,
    pendingAthleteMembershipInvites.length,
    pendingCoachMemberships.length,
    selfManagedAthlete,
    userMode,
  ]);
  const liveBackendConnectors = useMemo<readonly LiveBackendConnector[]>(
    () =>
      buildLiveBackendConnectors({
        apiBaseUrl: import.meta.env.VITE_BODYPILOT_API_BASE_URL,
        environmentName: import.meta.env.VITE_BODYPILOT_ENV,
        observabilityDsn: import.meta.env.VITE_BODYPILOT_SENTRY_DSN,
        accountStatus: accountProfile.status,
        accountEmail: accountProfile.email,
        subscriptionTier: accountProfile.subscriptionTier,
        isOnline,
        storageIssue,
        lastSavedAt,
        lastBackupExportedAt,
        notificationPreferences,
        notificationPermission,
        reminderCount: notificationReminderSchedule.length,
        pendingInviteCount: pendingCoachMemberships.length + pendingAthleteMembershipInvites.length,
        activeMembershipCount: activeCoachMemberships.length + (activeAthleteMembershipConnection ? 1 : 0),
        planVersionCount: publishedDecisionHistory.length,
        coachMessageCount: coachThreadMessages.length,
        weeklyReviewCount: weeklySnapshots.length,
        legalPagesReady: true,
      }),
    [
      accountProfile.email,
      accountProfile.status,
      accountProfile.subscriptionTier,
      activeAthleteMembershipConnection,
      activeCoachMemberships.length,
      coachThreadMessages.length,
      isOnline,
      lastBackupExportedAt,
      lastSavedAt,
      notificationPermission,
      notificationPreferences,
      notificationReminderSchedule.length,
      pendingAthleteMembershipInvites.length,
      pendingCoachMemberships.length,
      publishedDecisionHistory.length,
      storageIssue,
      weeklySnapshots.length,
    ]
  );
  const notificationSetupGap = notificationPreferences.pushEnabled && notificationPermission !== "granted";
  const accountSetupGap = accountProfile.status !== "signed-in";
  const firstRunWorkspace = storageHydrated && !savedWorkspaceFound;
  const storageTrustState = useMemo(() => {
    const saveLabel = storageIssue
      ? "Save issue"
      : !isOnline
        ? "Offline ready"
        : formatLocalSaveTime(lastSavedAt);
    const saveDetail = storageIssue
      ?? (firstRunWorkspace
        ? "Starter workspace. Local save starts automatically on this device."
        : isOnline
          ? "Saved on this device."
          : "Keep logging. Changes will stay on this device.");
    const accountLabel =
      accountProfile.status === "signed-in"
        ? "Signed in"
        : accountProfile.status === "email-unverified"
          ? "Verify email"
          : "Local only";
    const notificationLabel =
      armedReminderCount > 0
        ? `${armedReminderCount} armed`
        : notificationHasUsableChannel
          ? `${enabledReminderCount} reminders`
          : notificationPreferences.pushEnabled
          ? "Alerts need permission"
          : "Alerts off";
    const tone: ActionReceipt["tone"] =
      storageIssue ? "warning" : accountSetupGap || notificationSetupGap || firstRunWorkspace ? "info" : "success";

    return {
      saveLabel,
      saveDetail,
      accountLabel,
      notificationLabel,
      tone,
    };
  }, [
    accountProfile.status,
    accountSetupGap,
    firstRunWorkspace,
    isOnline,
    lastSavedAt,
    notificationPermission,
    notificationPreferences.pushEnabled,
    notificationSetupGap,
    armedReminderCount,
    enabledReminderCount,
    notificationHasUsableChannel,
      storageIssue,
  ]);
  const productionTrustSignals = useMemo<ProductionTrustSignal[]>(() => {
    const latestSavedLabel = storageIssue
      ? "Blocked"
      : lastSavedAt
        ? formatLocalSaveTime(lastSavedAt)
        : "Not saved";
    const backupTimestamp = lastBackupExportedAt ? new Date(lastBackupExportedAt) : null;
    const backupIsValid = Boolean(backupTimestamp && !Number.isNaN(backupTimestamp.getTime()));
    const daysSinceBackup = backupIsValid
      ? Math.floor((Date.now() - backupTimestamp!.getTime()) / 86400000)
      : null;
    const backupMetric =
      daysSinceBackup == null
        ? "No export"
        : daysSinceBackup === 0
          ? "Today"
          : `${daysSinceBackup}d ago`;
    const eventLedgerCount =
      changeLog.length +
      publishedDecisionHistory.length +
      coachThreadMessages.length +
      weeklySnapshots.length +
      foodDayHistory.length +
      wearableSnapshots.length;
    const latestDecisionStatus =
      latestPublishedDecision?.status === "acknowledged"
        ? "Receipt saved"
        : latestPublishedDecision
          ? "Awaiting receipt"
          : "No package";

    return [
      {
        id: "local-save",
        label: "Local persistence",
        title: storageIssue ? "Browser save needs attention" : "Workspace saves on this device",
        detail: storageIssue ?? (isOnline ? "Changes are written into the BodyPilot local data envelope." : "Offline changes keep saving locally on this device."),
        metric: latestSavedLabel,
        status: storageIssue ? "blocked" : lastSavedAt ? "ready" : "attention",
      },
      {
        id: "account-scope",
        label: "Account scope",
        title:
          accountProfile.status === "signed-in"
            ? "Account adapter active"
            : accountProfile.status === "email-unverified"
              ? "Email verification pending"
              : "Local-only workspace",
        detail:
          accountProfile.status === "signed-in"
            ? "Identity, role, and sync timestamps are modeled for a backend provider."
            : "The workspace is usable, but coaching data is not cloud-owned yet.",
        metric: accountProfile.status === "signed-in" ? accountProfile.email || "Signed in" : "Local",
        status:
          accountProfile.status === "signed-in"
            ? "ready"
            : accountProfile.status === "email-unverified"
              ? "attention"
              : "local",
      },
      {
        id: "plan-versions",
        label: "Plan versions",
        title: latestPublishedDecision ? latestPublishedDecision.title : "No published decision yet",
        detail: latestPublishedDecision
          ? `${latestDecisionStatus}. Published packages keep the instruction, reason, next action, queued changes, and acknowledgement trail.`
          : "Publish a coach decision to create the first versioned athlete-facing package.",
        metric: publishedDecisionHistory.length > 0 ? `v${publishedDecisionHistory.length}` : "None",
        status: latestPublishedDecision
          ? latestPublishedDecision.status === "acknowledged"
            ? "ready"
            : "attention"
          : "local",
      },
      {
        id: "event-ledger",
        label: "Event ledger",
        title: "Actions have a trace",
        detail: "Change log, published decisions, coach notes, food-day saves, weekly reviews, and wearable syncs contribute to the local audit trail.",
        metric: `${eventLedgerCount} events`,
        status: eventLedgerCount > 0 ? "ready" : "attention",
      },
      {
        id: "backup",
        label: "Backup",
        title: backupIsValid ? "Portable backup exists" : "Export a backup",
        detail: backupIsValid
          ? "A backup JSON was exported from this workspace. Re-export after major plan or coaching changes."
          : "Until cloud sync is real, export a backup before trusting this workspace for serious prep history.",
        metric: backupMetric,
        status: backupIsValid ? (daysSinceBackup !== null && daysSinceBackup <= 7 ? "ready" : "attention") : "attention",
      },
      {
        id: "offline",
        label: "Offline confidence",
        title: isOnline ? "Online with local fallback" : "Offline mode active",
        detail: isOnline
          ? "Network is available, but the current production-safe path is still local save plus export."
          : "Network is unavailable. BodyPilot is still usable because data stays in local storage.",
        metric: isOnline ? "Online" : "Offline",
        status: storageIssue ? "blocked" : isOnline ? "local" : "ready",
      },
    ];
  }, [
    accountProfile.email,
    accountProfile.status,
    changeLog.length,
    coachThreadMessages.length,
    foodDayHistory.length,
    isOnline,
    lastBackupExportedAt,
    lastSavedAt,
    latestPublishedDecision,
    publishedDecisionHistory.length,
    storageIssue,
    wearableSnapshots.length,
    weeklySnapshots.length,
  ]);
  const syncLedgerEvents = useMemo<SyncLedgerEvent[]>(() => {
    const events: SyncLedgerEvent[] = [];

    if (lastSavedAt) {
      events.push({
        id: "local-save-current",
        occurredAt: lastSavedAt,
        occurredAtLabel: formatLedgerTimeLabel(lastSavedAt),
        source: "Local storage",
        title: storageIssue ? "Local save needs attention" : "Workspace saved",
        detail: storageIssue ?? "Current data envelope was written on this device.",
        status: storageIssue ? "blocked" : "ready",
        statusLabel: storageIssue ? "Blocked" : "Saved",
      });
    }

    if (lastBackupExportedAt) {
      events.push({
        id: "backup-export-current",
        occurredAt: lastBackupExportedAt,
        occurredAtLabel: formatLedgerTimeLabel(lastBackupExportedAt),
        source: "Backup",
        title: "Backup exported",
        detail: "Portable JSON backup was created from this local workspace.",
        status: "ready",
        statusLabel: "Exported",
      });
    }

    publishedDecisionHistory.forEach((decision) => {
      const status = decision.status === "acknowledged" ? "ready" : "attention";
      events.push({
        id: `plan-${decision.id}`,
        occurredAt: decision.publishedAt || decision.createdAt,
        occurredAtLabel: formatLedgerTimeLabel(decision.publishedAt || decision.createdAt),
        source: "Plan version",
        title: `Plan v${decision.version ?? "?"} published`,
        detail: truncateLedgerDetail(`${decision.athleteName}: ${decision.nextAction}`),
        status,
        statusLabel: decision.status === "acknowledged" ? "Receipt" : "Needs receipt",
      });
    });

    coachThreadMessages.forEach((message) => {
      const isRead = message.deliveryStatus === "read";
      const isDelivered = message.deliveryStatus === "delivered";
      events.push({
        id: `thread-${message.id}`,
        occurredAt: message.createdAt,
        occurredAtLabel: formatLedgerTimeLabel(message.createdAt),
        source: "Coach thread",
        title: `${message.author === "coach" ? "Coach" : "Athlete"} message`,
        detail: truncateLedgerDetail(message.body),
        status: isRead || isDelivered ? "ready" : "attention",
        statusLabel: isRead ? "Read" : isDelivered ? "Delivered" : "Sent",
      });
    });

    changeLog.forEach((entry) => {
      events.push({
        id: `change-${entry.id}`,
        occurredAt: entry.date,
        occurredAtLabel: formatLedgerTimeLabel(entry.date),
        source: entry.category,
        title: entry.title,
        detail: truncateLedgerDetail(entry.impact ? `${entry.detail} ${entry.impact}` : entry.detail),
        status: "local",
        statusLabel: "Local",
      });
    });

    foodDayHistory.forEach((snapshot) => {
      events.push({
        id: `food-${snapshot.id}`,
        occurredAt: snapshot.savedAt,
        occurredAtLabel: formatLedgerTimeLabel(snapshot.savedAt),
        source: "Nutrition",
        title: "Food day saved",
        detail: `${snapshot.date}: ${snapshot.foodEntries} foods, ${snapshot.calories} kcal, ${snapshot.loggedMeals} meals logged.`,
        status: "local",
        statusLabel: "Local",
      });
    });

    weeklySnapshots.forEach((snapshot) => {
      events.push({
        id: `weekly-${snapshot.id}`,
        occurredAt: snapshot.date,
        occurredAtLabel: formatLedgerTimeLabel(snapshot.date),
        source: "Weekly review",
        title: snapshot.weekLabel,
        detail: truncateLedgerDetail(snapshot.recommendation),
        status: "local",
        statusLabel: "Local",
      });
    });

    wearableSnapshots.forEach((snapshot) => {
      events.push({
        id: `wearable-${snapshot.id}`,
        occurredAt: snapshot.date,
        occurredAtLabel: formatLedgerTimeLabel(snapshot.date),
        source: "Recovery import",
        title: `${snapshot.source} recovery saved`,
        detail: `Sleep ${snapshot.sleepScore}, HRV ${snapshot.hrvMs}ms, recovery ${snapshot.recoveryStatus}.`,
        status: "local",
        statusLabel: "Local",
      });
    });

    return events
      .sort((left, right) => {
        const leftTime = new Date(left.occurredAt).getTime();
        const rightTime = new Date(right.occurredAt).getTime();
        return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
      })
      .slice(0, 12);
  }, [
    changeLog,
    coachThreadMessages,
    foodDayHistory,
    lastBackupExportedAt,
    lastSavedAt,
    publishedDecisionHistory,
    storageIssue,
    wearableSnapshots,
    weeklySnapshots,
  ]);
  const syncConflictPolicies = useMemo<SyncConflictPolicy[]>(() => {
    const openThreadReceipts = coachThreadMessages.filter(
      (message) => message.author === "coach" && message.deliveryStatus !== "read"
    ).length;
    const unsignedPlanVersions = publishedDecisionHistory.filter((decision) => decision.status !== "acknowledged").length;

    return [
      {
        id: "nutrition",
        area: "Nutrition log",
        owner: "Athlete",
        source: "Device + food provider",
        policy: "Merge by day, meal, entry id",
        title: "Food entries merge, targets require review",
        detail: "Meal entries can merge by stable IDs. Macro targets should not be silently overwritten by an older device.",
        conflictRule: "Newest entry edit wins; target conflicts create a review item.",
        status: storageIssue ? "blocked" : "local",
      },
      {
        id: "tracker",
        area: "Daily tracker",
        owner: "Athlete",
        source: "Device + wearable imports",
        policy: "Merge by date and task id",
        title: "Daily logs preserve athlete input",
        detail: "Bodyweight, steps, energy, closeout, and lift logs should merge into the same dated record.",
        conflictRule: "Manual edits beat imports; wearable values keep source labels.",
        status: storageIssue ? "blocked" : wearableSnapshots.length > 0 ? "ready" : "local",
      },
      {
        id: "training",
        area: "Training plan",
        owner: selfManagedAthlete ? "Athlete" : "Coach",
        source: "Plan builder + coach package",
        policy: "Merge sessions by id",
        title: "Plans merge, completed lifts stay locked",
        detail: "Upcoming sessions can merge by session ID, but completed lift logs should stay attached to the athlete record.",
        conflictRule: "Program edits update future work only; logged sets are append-preserved.",
        status: "local",
      },
      {
        id: "plan-versions",
        area: "Plan versions",
        owner: selfManagedAthlete ? "Athlete" : "Coach",
        source: "Published coach decision",
        policy: "Append-only versions",
        title: "Published packages do not get rewritten",
        detail: "Coach calls should create immutable versions so athletes can see what changed and when.",
        conflictRule: "New version appends; rollback creates a new version that references the old one.",
        status: unsignedPlanVersions > 0 ? "attention" : publishedDecisionHistory.length > 0 ? "ready" : "local",
      },
      {
        id: "coach-thread",
        area: "Coach thread",
        owner: "Message author",
        source: "Coach and athlete devices",
        policy: "Append messages, merge receipts",
        title: "Messages are append-only, receipts merge",
        detail: "Thread content should never be overwritten by a stale sync. Delivery and read receipts can update in place.",
        conflictRule: "Message body is immutable after send; receipt timestamps use latest confirmed state.",
        status: openThreadReceipts > 0 ? "attention" : coachThreadMessages.length > 0 ? "ready" : "local",
      },
      {
        id: "schedule",
        area: "Schedule",
        owner: selfManagedAthlete ? "Athlete" : "Coach + athlete",
        source: "Calendar editor",
        policy: "Merge events by id",
        title: "Calendar changes need intent",
        detail: "Training, cardio, check-in, and event changes can sync by event ID, but overlapping edits need review.",
        conflictRule: "Non-overlapping edits merge; same-event time/type conflicts ask the user.",
        status: "local",
      },
      {
        id: "protocol",
        area: "Compounds/protocol",
        owner: selfManagedAthlete ? "Athlete" : "Coach approved",
        source: "Protocol editor",
        policy: "Manual review required",
        title: "Protocol changes are high-impact",
        detail: "Stack and protocol edits should not auto-merge because stale values can create unsafe instructions.",
        conflictRule: "Conflicts block sync until a human chooses the active protocol.",
        status: "attention",
      },
      {
        id: "backup-restore",
        area: "Backup restore",
        owner: "Device owner",
        source: "Imported JSON",
        policy: "Replace after preview",
        title: "Restore is deliberate replacement",
        detail: "Backup import stays outside normal sync and only replaces the workspace after validation, preview, and confirmation.",
        conflictRule: "No silent merge from backup files; restore is all-or-nothing after diff review.",
        status: backupRestorePreview ? "attention" : "ready",
      },
    ];
  }, [
    backupRestorePreview,
    coachThreadMessages,
    publishedDecisionHistory,
    selfManagedAthlete,
    storageIssue,
    wearableSnapshots.length,
  ]);
  const productionAdapterContracts = useMemo<ProductionAdapterContract[]>(() => {
    const accountMetric =
      accountProfile.status === "signed-in"
        ? "Signed in"
        : accountProfile.status === "email-unverified"
          ? "Verify email"
          : "Local profile";
    const membershipMetric =
      accountProfile.role === "coach"
        ? `${coachRosterCards.length} visible, ${pendingCoachMemberships.length} pending`
        : accountProfile.role === "coached-athlete"
          ? "Coach link needed"
          : "Self-owned";
    const notificationBlockedCount = notificationReminderSchedule.filter((item) => item.status === "blocked").length;
    const notificationMetric =
      notificationHasUsableChannel
        ? `${armedReminderCount} armed`
        : notificationBlockedCount > 0
          ? `${notificationBlockedCount} blocked`
          : "No delivery";
    const saveMetric = storageIssue
      ? "Storage blocked"
      : lastSavedAt
        ? formatLocalSaveTime(lastSavedAt)
        : "Not saved";

    return [
      {
        id: "auth-session",
        system: "Auth and session",
        currentAdapter: "Local browser auth",
        productionAdapter: "Managed auth provider",
        responsibility: "Email/password, verification, password reset, session restore, token refresh, and sign-out.",
        dataHandoff: "Map the current account profile to provider user id, email verification, role claim, and subscription tier.",
        metric: accountMetric,
        status:
          accountProfile.status === "signed-in"
            ? "ready"
            : accountProfile.status === "email-unverified"
              ? "attention"
              : "local",
      },
      {
        id: "cloud-sync",
        system: "Cloud sync",
        currentAdapter: "Local data envelope",
        productionAdapter: "Account-scoped sync service",
        responsibility: "Persist meals, tracker days, plan versions, check-ins, messages, settings, and event ledger by account.",
        dataHandoff: "Use the data-envelope version, conflict policy, and sync ledger as the cloud write contract.",
        metric: saveMetric,
        status: storageIssue ? "blocked" : accountProfile.status === "signed-in" ? "attention" : "local",
      },
      {
        id: "coach-membership",
        system: "Coach membership",
        currentAdapter: "Local role and roster",
        productionAdapter: "Coach-client membership service",
        responsibility: "Client invites, accepted relationships, permissions, private coach notes, athlete visibility, and roster switching.",
        dataHandoff: "Promote selected athlete id, role, roster state, plan versions, and thread ownership into membership-scoped records.",
        metric: membershipMetric,
        status: accountProfile.role === "coach" || accountProfile.role === "coached-athlete" ? "attention" : "local",
      },
      {
        id: "notification-delivery",
        system: "Notification delivery",
        currentAdapter: "Browser permission model",
        productionAdapter: "Push and email worker",
        responsibility: "Deliver food-gap, training, closeout, check-in, coach-update, plan-change, and schedule reminders.",
        dataHandoff: "Use notification preferences, quiet hours, reminder status, and coach plan receipts as worker inputs.",
        metric: notificationMetric,
        status: notificationHasUsableChannel ? "attention" : notificationBlockedCount > 0 ? "blocked" : "local",
      },
      {
        id: "billing-subscription",
        system: "Billing and entitlement",
        currentAdapter: "Account tier metadata",
        productionAdapter: "Subscription provider",
        responsibility: "Gate coach mode, multi-client operations, advanced planning, and account-backed data retention by tier.",
        dataHandoff: "Map subscription tier, account role, and coach membership to entitlements before enabling paid workflows.",
        metric: accountProfile.subscriptionTier,
        status: accountProfile.status === "signed-in" ? "attention" : "local",
      },
    ];
  }, [
    accountProfile.role,
    accountProfile.status,
    accountProfile.subscriptionTier,
    armedReminderCount,
    coachRosterCards.length,
    lastSavedAt,
    notificationHasUsableChannel,
    notificationReminderSchedule,
    pendingCoachMemberships.length,
    storageIssue,
  ]);
  const membershipAdapterCapabilities = useMemo<MembershipAdapterCapability[]>(() => {
    const membershipRole = userMode === "coach" ? "coach" : accountProfile.role;
    const localMemberships = localMembershipRecords.filter((membership) => {
      if (membershipRole === "coach") return membership.coachId === accountProfile.id;
      if (membershipRole === "coached-athlete") return membership.athleteId === accountProfile.id;
      return false;
    });
    const activeMembershipCount = localMemberships.filter((membership) => membership.status === "active").length;
    const pendingMembershipCount = localMemberships.filter((membership) => membership.status === "invited").length;
    const revokedMembershipCount = localMemberships.filter((membership) => membership.status === "revoked").length;
    const coachContext =
      membershipRole === "coach"
        ? `${coachRosterCards.length} visible clients, ${pendingMembershipCount} pending invites`
        : membershipRole === "coached-athlete"
          ? `${activeMembershipCount} active coach links`
          : "Self-managed athlete";

    return [
      {
        id: "invite-client",
        action: "Invite client",
        currentPath: membershipRole === "coach" ? coachContext : "Coach-only action hidden from athlete roles",
        productionPath: "Create an invited membership, send email/deep link, and bind the invite to the coach account.",
        permissionScope: "coach:invite-client",
        status: membershipRole === "coach" ? "local" : "attention",
      },
      {
        id: "accept-membership",
        action: "Accept membership",
        currentPath:
          activeMembershipCount > 0
            ? `${activeMembershipCount} accepted local memberships`
            : "Acceptance is modeled locally; no account-backed invite receipt yet",
        productionPath: "Client accepts the invite after sign-in; membership becomes active and gains athlete-scoped visibility.",
        permissionScope: "client:accept-membership",
        status: activeMembershipCount > 0 ? "local" : "attention",
      },
      {
        id: "revoke-access",
        action: "Revoke access",
        currentPath:
          revokedMembershipCount > 0
            ? `${revokedMembershipCount} revoked memberships recorded`
            : "Revocation contract exists; roster UI still needs a dedicated control",
        productionPath: "Revoke coach visibility immediately, write an audit event, and prevent stale plan/message writes.",
        permissionScope: "membership:revoke",
        status: "local",
      },
      {
        id: "permission-scopes",
        action: "Permission scopes",
        currentPath: localBodyPilotMembershipAdapter.responsibilities.join(", "),
        productionPath: "Persist view, edit, publish, message, check-in, and schedule scopes per coach-client relationship.",
        permissionScope: "membership:permissions",
        status: "local",
      },
      {
        id: "roster-visibility",
        action: "Roster visibility",
        currentPath: coachContext,
        productionPath: "Resolve the coach roster from active memberships instead of static local demo athletes.",
        permissionScope: "membership:list",
        status: membershipRole === "coach" || membershipRole === "coached-athlete" ? "attention" : "local",
      },
    ];
  }, [accountProfile.id, accountProfile.role, coachRosterCards.length, localMembershipRecords, userMode]);
  const StorageTrustIcon = storageIssue ? ShieldCheck : isOnline ? Cloud : CloudOff;

  const mobileContextBar = (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={[
        "mobile-context-compact mx-auto w-full max-w-[23rem] min-w-0 overflow-hidden rounded-[22px] border px-3 py-2.5 md:hidden",
        themeClasses.hero,
      ].join(" ")}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <BodyPilotLogo size="sm" showWordmark={false} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-950 dark:text-slate-100">
              {BODY_PILOT_BRAND.name}
            </div>
            <div className="mt-0.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
              {activeViewMeta.title} · {selectedCalendarSessionLabel}
            </div>
          </div>
        </div>
        <Button
          size="icon"
          variant={showSettingsPanel ? "default" : "outline"}
          className="h-9 w-9 shrink-0"
          onClick={() => setShowSettingsPanel((prev) => !prev)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(7.25rem,0.72fr)] items-center gap-2">
        <Input
          type="date"
          value={selectedCalendarDate}
          onChange={(event) => setSelectedCalendarDate(event.target.value)}
          className="h-8 w-full min-w-0 rounded-xl border-slate-200 bg-white text-sm shadow-none dark:border-white/10 dark:bg-slate-950/40"
        />
        <button
          type="button"
          onClick={() => openSettingsSection(storageIssue ? "data" : accountSetupGap ? "account" : notificationSetupGap ? "notifications" : "data")}
          className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/76 px-2 text-left shadow-sm transition hover:border-sky-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
          title={storageTrustState.saveDetail}
        >
          <StorageTrustIcon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-300" />
          <span className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">
            {storageTrustState.saveLabel}
          </span>
        </button>
      </div>

      {mobileCoachUpdateNeedsReceipt && latestPublishedDecision ? (
        <div className="mt-2 rounded-[18px] border border-indigo-200 bg-indigo-50/90 px-3 py-2.5 shadow-sm dark:border-indigo-500/25 dark:bg-indigo-950/25">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-200" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-indigo-700 dark:text-indigo-100">
                  Coach update
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                {latestPublishedDecision.title}
              </div>
              <div className="mt-0.5 truncate text-xs text-indigo-900/78 dark:text-indigo-100/78">
                {mobileCoachUpdateDiff
                  ? `${mobileCoachUpdateDiff.label}: ${mobileCoachUpdateDiff.title}`
                  : latestPublishedDecision.nextAction}
              </div>
            </div>
            <Badge className="shrink-0 border-indigo-200 bg-white/85 text-indigo-700 dark:border-indigo-400/25 dark:bg-white/[0.08] dark:text-indigo-100">
              New
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => goToTab("coach")}>
              Review
            </Button>
            <Button size="sm" className="h-8" onClick={acknowledgeLatestCoachDecision}>
              Acknowledge
            </Button>
          </div>
        </div>
      ) : null}

      {primaryMobileAction ? (
        <div className="mobile-command-strip mt-2 rounded-[18px] px-3 py-2.5">
          <div className="grid gap-2">
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Next
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                {dailyShellState.headline}
              </div>
            </div>
            <Button
              size="sm"
              className="h-8 w-full min-w-0 px-2"
              onClick={primaryMobileAction.onClick}
            >
              <span className="truncate">{primaryMobileAction.label.replace(/^Open /, "")}</span>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {dailyQuickCaptureActions.map((action) => (
          <button
            key={`mobile-capture-${action.label}`}
            type="button"
            onClick={action.onClick}
            className="min-w-0 rounded-[14px] border border-slate-200 bg-white/78 px-1.5 py-2 text-center shadow-sm transition hover:border-sky-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
          >
            <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200">
              <action.Icon className="h-3.5 w-3.5" />
            </span>
            <span className="mt-1 block truncate text-[11px] font-semibold text-slate-950 dark:text-slate-100">
              {action.label}
            </span>
            <span className="mt-0.5 block truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
              {action.helper}
            </span>
          </button>
        ))}
      </div>
    </motion.section>
  );

  const shellTopBar = (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={[
        "relative overflow-hidden rounded-[22px] border px-3 py-2.5 sm:rounded-[24px] sm:px-4 sm:py-3",
        themeClasses.hero,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/50 dark:bg-white/10" />
      <div className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BodyPilotLogo size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold text-slate-950 dark:text-slate-100">
                {activeViewMeta.title}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {ecosystemPlanSnapshot.phaseBadge}
              </Badge>
            </div>
            <div className="mt-1 flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="truncate">{timelineSummary}</span>
              <span className="truncate">{selectedCalendarSessionLabel}</span>
              <span className="hidden truncate 2xl:inline">
                {accountProfile.status === "signed-in" ? accountProfile.email : storageTrustState.accountLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <label className="premium-context-chip inline-flex min-h-9 items-center gap-2 px-2.5 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">Day</span>
            <Input
              type="date"
              value={selectedCalendarDate}
              onChange={(event) => setSelectedCalendarDate(event.target.value)}
              className="h-7 w-[116px] rounded-lg border-slate-200 bg-white/90 text-xs shadow-none dark:border-white/10 dark:bg-slate-950/40"
            />
          </label>
          <label className="premium-context-chip hidden min-h-9 items-center gap-2 px-2.5 py-1 md:inline-flex">
            <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">Show</span>
            <Input
              type="date"
              value={contestDate}
              onChange={(event) => setContestDate(event.target.value)}
              className="h-7 w-[116px] rounded-lg border-slate-200 bg-white/90 text-xs shadow-none dark:border-white/10 dark:bg-slate-950/40"
            />
          </label>
          <div className="premium-context-chip inline-flex min-h-9 items-center gap-1 p-1">
            <Button
              size="sm"
              variant={userMode === "coach" ? "default" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setUserMode("coach")}
            >
              Coach
            </Button>
            <Button
              size="sm"
              variant={userMode === "athlete" ? "default" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setUserMode("athlete")}
            >
              Athlete
            </Button>
          </div>
          <button
            type="button"
            onClick={() => openSettingsSection(storageIssue ? "data" : accountSetupGap ? "account" : notificationSetupGap ? "notifications" : "data")}
            className="premium-context-chip hidden min-h-9 items-center gap-2 px-2.5 py-1 text-left transition hover:border-sky-200 hover:bg-white/80 dark:hover:border-white/20 dark:hover:bg-white/[0.08] xl:inline-flex"
            title={storageTrustState.saveDetail}
          >
            <StorageTrustIcon
              className={[
                "h-3.5 w-3.5 shrink-0",
                storageIssue
                  ? "text-amber-600 dark:text-amber-300"
                  : isOnline
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-sky-600 dark:text-sky-300",
              ].join(" ")}
            />
            <span className="min-w-0">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Save
              </span>
              <span className="block max-w-[9rem] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                {storageTrustState.saveLabel}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => openSettingsSection(notificationSetupGap ? "notifications" : "account")}
            className="premium-context-chip hidden min-h-9 items-center gap-2 px-2.5 py-1 text-left transition hover:border-sky-200 hover:bg-white/80 dark:hover:border-white/20 dark:hover:bg-white/[0.08] 2xl:inline-flex"
          >
            <BellRing className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-300" />
            <span className="min-w-0">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Alerts
              </span>
              <span className="block max-w-[9rem] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                {storageTrustState.notificationLabel}
              </span>
            </span>
          </button>
          <Button
            size="icon"
            variant={showSettingsPanel ? "default" : "outline"}
            className="h-9 w-9 shrink-0"
            onClick={() => setShowSettingsPanel((prev) => !prev)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.section>
  );

  const setLibraryTargetFromDay = (dayId: string) => {
    if (userMode === "coach") {
      setLibraryTargetDayId(dayId);
      goToTab("library");
      return;
    }

    openTrainingExerciseSupport(dayId);
  };

  const desktopSidebarGroups = useMemo(() => {
    const mainItems = primaryWorkspaceNav.map((item) => ({
      id: item.value,
      label: item.label,
      helper: item.helper,
      stat: item.stat,
      Icon: item.Icon,
      active: activeTab === item.value,
      onSelect: () => goToTab(item.value),
    }));

    const foodItems = [
      {
        id: "food-log",
        label: "Food log",
        helper: "Diary",
        stat: `${mealTotals.protein}/${mealTotals.carbs}/${mealTotals.fats}`,
        Icon: Utensils,
        active: activeTab === "nutrition" && nutritionSurfaceIntent.surface === "log",
        onSelect: openNutritionOverview,
      },
      {
        id: "food-add",
        label: "Add food",
        helper: "Search",
        Icon: Sparkles,
        active: activeTab === "nutrition" && nutritionSurfaceIntent.surface === "add",
        onSelect: () => openNutritionSurface("add", "search"),
      },
      {
        id: "food-targets",
        label: "Targets",
        helper: "Macros",
        stat: `${proteinTarget} / ${carbTarget} / ${fatTarget}`,
        Icon: Gauge,
        active: activeTab === "nutrition" && nutritionSidebarIntent.section === "targets",
        onSelect: openNutritionTargets,
      },
    ];

    const builderItems = builderWorkspaceNav
      .filter((item) => item.value !== "nutrition")
      .map((item) => ({
        id: item.value,
        label: item.label,
        helper: item.helper,
        stat: item.stat,
        Icon: item.Icon,
        active: activeTab === item.value,
        onSelect: () => goToTab(item.value),
      }));

    type SidebarNavItem = {
      id: string;
      label: string;
      helper: string;
      stat?: string;
      Icon: React.ComponentType<any>;
      active?: boolean;
      onSelect: () => void;
    };

    type SidebarNavGroup = {
      id: string;
      label: string;
      description?: string;
      items: SidebarNavItem[];
      defaultOpen?: boolean;
    };

    const mainItem = (id: AppTab, patch: Partial<SidebarNavItem> = {}) => {
      const item = mainItems.find((entry) => entry.id === id);
      return item ? { ...item, ...patch } : null;
    };

    const calendarItem: SidebarNavItem = {
      id: "calendar",
      label: "Calendar",
      helper: "Week / month",
      stat: `${weeksOut} weeks`,
      Icon: CalendarRange,
      active: activeTab === "schedule",
      onSelect: () => goToTab("schedule"),
    };

    const foodLogItem: SidebarNavItem = {
      id: "food-flow",
      label: userMode === "coach" ? "Food review" : "Food",
      helper: userMode === "coach" ? "Calories / macros" : "Calories / macros",
      stat: `${mealTotals.protein}/${mealTotals.carbs}/${mealTotals.fats}`,
      Icon: Utensils,
      active: activeTab === "nutrition",
      onSelect: openNutritionOverview,
    };

    const aiReviewItem: SidebarNavItem = {
      id: "ai-review",
      label: "AI review",
      helper: "Deeper signal",
      stat: `${decisionConfidenceModel.score}%`,
      Icon: Sparkles,
      active: activeTab === "ai-coach",
      onSelect: () => goToTab("ai-coach"),
    };

    const directionItem: SidebarNavItem = {
      id: "direction",
      label: userMode === "coach" ? "Publish" : "Direction",
      helper: userMode === "coach" ? "Coach update" : "What changed",
      stat:
        latestPublishedDecision && latestPublishedDecision.status !== "acknowledged"
          ? "New"
          : userMode === "coach"
            ? complianceConfidence.label
            : "Current",
      Icon: NotebookPen,
      active: activeTab === "coach",
      onSelect: () => goToTab("coach"),
    };

    const trainingItems = builderItems.map((item) => ({
      ...item,
      label: item.id === "split" ? "Training" : item.label,
      helper: item.id === "split" ? "Session map" : item.helper,
    }));

    const targetItem = foodItems.find((item) => item.id === "food-targets") ?? null;

    if (userMode === "athlete") {
      return [
        {
          id: "do-now",
          label: "Do now",
          description: "The flows most users need within five seconds.",
          items: [
            mainItem("dashboard", { label: "Home", helper: "Next action" }),
            mainItem("tracker", { label: "Today", helper: "Workout log" }),
            foodLogItem,
            selfManagedAthlete ? null : directionItem,
          ].filter(Boolean) as SidebarNavItem[],
          defaultOpen: true,
        },
        {
          id: "plan",
          label: "Plan",
          description: "Use these after today's blocker is clear.",
          items: [
            ...trainingItems,
            calendarItem,
            targetItem ? { ...targetItem, label: "Macro targets", helper: "Food plan" } : null,
          ].filter(Boolean) as SidebarNavItem[],
          defaultOpen: activeTab === "split" || activeTab === "schedule" || activeTab === "nutrition",
        },
        {
          id: "review",
          label: "Review",
          description: "Deeper analysis when the simple path is not enough.",
          items: [aiReviewItem],
          defaultOpen: activeTab === "ai-coach",
        },
      ];
    }

    return [
      {
        id: "coach-flow",
        label: "Coach flow",
        description: "Move from queue to evidence to one published call.",
        items: [
          mainItem("dashboard", { label: "Queue", helper: "Next calls" }),
          mainItem("tracker", { label: "Today review", helper: "Execution" }),
          foodLogItem,
          directionItem,
        ].filter(Boolean) as SidebarNavItem[],
        defaultOpen: true,
      },
      {
        id: "plan",
        label: "Plan",
        description: "Training, food targets, and calendar structure.",
        items: [
          calendarItem,
          targetItem ? { ...targetItem, label: "Macro targets", helper: "Food plan" } : null,
          ...trainingItems,
        ].filter(Boolean) as SidebarNavItem[],
        defaultOpen: activeTab === "schedule" || activeTab === "split" || activeTab === "nutrition",
      },
      {
        id: "review",
        label: "Review",
        description: "Use after the execution read is clear.",
        items: [aiReviewItem],
        defaultOpen: activeTab === "ai-coach",
      },
    ];
  }, [
    primaryWorkspaceNav,
    activeTab,
    mealTotals.protein,
    mealTotals.carbs,
    mealTotals.fats,
    canEditPlan,
    proteinTarget,
    carbTarget,
    fatTarget,
    nutritionSurfaceIntent.surface,
    nutritionSidebarIntent.section,
    openNutritionOverview,
    openNutritionSurface,
    openNutritionTargets,
    builderWorkspaceNav,
    showBuilderTools,
    showAdvancedEditors.compounds,
    userMode,
    selfManagedAthlete,
    complianceConfidence.label,
    decisionConfidenceModel.score,
    latestPublishedDecision,
    weeksOut,
  ]);

  const setupEssentials = useMemo(() => {
    const rows = setupReadinessItems.filter((item) =>
      ["profile", "contest", "food", "training"].includes(item.label)
    );
    const complete = rows.filter((item) => item.complete).length;

    return {
      rows,
      complete,
      total: rows.length,
      pct: Math.round((complete / Math.max(1, rows.length)) * 100),
      next: rows.find((item) => !item.complete) ?? rows[0] ?? null,
    };
  }, [setupReadinessItems]);

  const showStarterSetupGuide =
    userMode === "athlete" &&
    !showSettingsPanel &&
    !setupGuideDismissed &&
    storageHydrated &&
    activeTab === "dashboard" &&
    (firstRunWorkspace || setupEssentials.complete < setupEssentials.total);

  const starterSetupGuide = showStarterSetupGuide ? (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="premium-surface overflow-hidden p-4 sm:p-5"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.55fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/30 dark:text-sky-200">
                Guided setup
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                Make BodyPilot yours in four steps.
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Lock the athlete context, show date, food targets, and training week before touching advanced builders.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => openSettingsSection("setup")}>
                Full setup
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSetupGuideDismissed(true);
                  setAccountSetupPromptDismissed(true);
                }}
              >
                Skip
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{setupEssentials.complete}/{setupEssentials.total} complete</span>
              <span>{setupEssentials.next?.title ?? "Ready"}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400"
                style={{ width: `${setupEssentials.pct}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Step 1</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">Athlete profile</div>
                </div>
                <Badge variant={setupEssentials.rows.find((item) => item.label === "profile")?.complete ? "default" : "outline"}>
                  Profile
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="space-y-1.5 sm:col-span-3">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Name</span>
                  <Input value={athleteName} onChange={(event) => setAthleteName(event.target.value)} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Weight</span>
                  <Input
                    type="number"
                    value={bodyWeight}
                    onChange={(event) => setBodyWeight(Math.max(0, Number(event.target.value) || 0))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Body fat</span>
                  <Input
                    type="number"
                    value={profileBodyFat}
                    onChange={(event) => setProfileBodyFat(Math.max(0, Number(event.target.value) || 0))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Target</span>
                  <Input
                    type="number"
                    value={targetStageWeightLb}
                    onChange={(event) => setTargetStageWeightLb(Math.max(0, Number(event.target.value) || 0))}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Step 2</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">Show date</div>
                </div>
                <Badge variant={setupEssentials.rows.find((item) => item.label === "contest")?.complete ? "default" : "outline"}>
                  {weeksOut} weeks
                </Badge>
              </div>
              <div className="mt-3 grid gap-2">
                <Input
                  type="date"
                  value={contestDate}
                  onChange={(event) => setContestDate(event.target.value)}
                />
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  {timelineSummary}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Step 3</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">Food targets</div>
                </div>
                <Badge variant={setupEssentials.rows.find((item) => item.label === "food")?.complete ? "default" : "outline"}>
                  {macroCalories} kcal
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                  {proteinTarget}P / {carbTarget}C / {fatTarget}F
                </div>
                <Button size="sm" onClick={applyStarterFoodTargets}>
                  Use model
                </Button>
              </div>
              <div className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Model: {contestPrepModel.todayTargets.protein}P / {contestPrepModel.todayTargets.carbs}C / {contestPrepModel.todayTargets.fats}F, {contestPrepModel.todayTargets.steps.toLocaleString()} steps.
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Step 4</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">Training week</div>
                </div>
                <Badge variant={setupEssentials.rows.find((item) => item.label === "training")?.complete ? "default" : "outline"}>
                  {weeklyPlanSummary.trainingDays} days
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {splitTemplateOptions.slice(0, 4).map((template) => (
                  <Button
                    key={`starter-${template.id}`}
                    size="sm"
                    variant={splitTemplate === template.id ? "default" : "outline"}
                    onClick={() => setSplitTemplate(template.id)}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {totalPlannedSets} planned sets, {workoutSplit.filter((day) => day.focus.toLowerCase() !== "rest").length} working days.
                </div>
                <Button size="sm" onClick={buildStarterTrainingWeek}>
                  Build week
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">Ready path</div>
          <div className="mt-3 grid gap-2">
            {setupEssentials.rows.map((item) => (
              <div key={`starter-status-${item.label}`} className="flex items-start gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950/45">
                <span className={item.complete ? "mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" : "mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-500"} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            <Button
              onClick={() => {
                setSetupGuideDismissed(true);
                setAccountSetupPromptDismissed(true);
                openTrackerSurface("session");
              }}
            >
              Active Training
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSetupGuideDismissed(true);
                setAccountSetupPromptDismissed(true);
                openNutritionSurface("add", "search");
              }}
            >
              Add first food
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  ) : null;

  const showAccountSetupPrompt =
    !showSettingsPanel &&
    !showStarterSetupGuide &&
    !accountSetupPromptDismissed &&
    storageHydrated &&
    activeTab === "dashboard" &&
    (accountSetupGap || notificationSetupGap || firstRunWorkspace);
  const planVersionTrust = productionTrustSignals.find((item) => item.id === "plan-versions");
  const backupTrust = productionTrustSignals.find((item) => item.id === "backup");
  const accountSetupStatusItems = [
    ["Local save", storageIssue ? "Check storage" : isOnline ? formatLocalSaveTime(lastSavedAt) : "Offline-ready"],
    ["Plan", planVersionTrust ? `${planVersionTrust.metric} / ${planVersionTrust.status}` : "No version"],
    ["Backup", backupTrust ? backupTrust.metric : "No export"],
    [
      "Account",
      accountProfile.status === "signed-in"
        ? "Signed in"
        : accountProfile.status === "email-unverified"
          ? "Verify email"
          : "Local-only",
    ],
    [
      "Notifications",
      notificationPermission === "granted"
        ? "Enabled"
        : notificationPreferences.pushEnabled
          ? "Permission needed"
          : "Off",
    ],
  ] as const;
  const accountSetupPrompt = showAccountSetupPrompt ? (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="premium-surface p-3 sm:p-3.5"
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <BodyPilotLogo size="sm" showWordmark={false} />
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-normal text-slate-950 dark:text-slate-100">
              Production trust check
            </div>
            <div className="mt-1 hidden flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:flex">
              {accountSetupStatusItems.map(([label, value]) => (
                <span key={label}>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{label}:</span> {value}
                </span>
              ))}
            </div>
            <div className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:hidden">
              {storageTrustState.saveLabel}. Account sync stays optional.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
          <Button
            size="sm"
            onClick={() => openSettingsSection(accountSetupGap ? "account" : notificationSetupGap ? "notifications" : "data")}
          >
            Protect data
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAccountSetupPromptDismissed(true)}>
            Continue local
          </Button>
        </div>
      </div>
    </motion.section>
  ) : null;
  const athleteMembershipReceiptDeck =
    userMode === "athlete" && (primaryPendingAthleteInvite || activeAthleteMembershipConnection) ? (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className={[
          "premium-surface p-4",
          primaryPendingAthleteInvite
            ? "border-sky-200/80 dark:border-sky-500/25"
            : "border-emerald-200/80 dark:border-emerald-500/25",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
              Coach connection
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
              {primaryPendingAthleteInvite
                ? `${primaryPendingAthleteInvite.coachName} invited you`
                : `Connected to ${activeAthleteMembershipConnection?.coachName ?? "coach"}`}
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">
              {primaryPendingAthleteInvite
                ? "Accept the invite to switch this workspace into guided mode and make coach updates visible."
                : "Guided mode is active. Coach direction, receipts, and plan updates now belong to this relationship."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {primaryPendingAthleteInvite ? (
              <>
                <Button size="sm" onClick={() => acceptCoachMembershipInvite(primaryPendingAthleteInvite)}>
                  Accept invite
                </Button>
                <Button size="sm" variant="outline" onClick={() => openSettingsSection("account")}>
                  Review account
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => goToTab("coach")}>
                  Open direction
                </Button>
                <Button size="sm" variant="outline" onClick={() => openSettingsSection("account")}>
                  Account
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Coach</div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
              {primaryPendingAthleteInvite?.coachName ?? activeAthleteMembershipConnection?.coachName ?? "Not connected"}
            </div>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Status</div>
            <div className="mt-1 text-sm font-semibold capitalize text-slate-950 dark:text-slate-100">
              {primaryPendingAthleteInvite?.status ?? activeAthleteMembershipConnection?.status ?? "local"}
            </div>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Access</div>
            <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
              {(primaryPendingAthleteInvite ?? activeAthleteMembershipConnection)?.permissions.length ?? 0} scopes
            </div>
          </div>
        </div>
      </motion.section>
    ) : null;

  return (
    <div
      data-stage-view={activeTab}
      className={[
        "app-shell-mobile-safe relative min-h-screen w-full overflow-hidden px-3 py-3 pb-40 sm:px-4 sm:py-4 sm:pb-40 lg:px-6 lg:py-4 lg:pb-5 transition-colors duration-300",
        themeClasses.shell,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-x-0 top-0 h-[32rem] transition-colors duration-500 ${workspaceTint}`} />
        <div className="absolute inset-x-0 top-[18rem] h-px bg-slate-200/50 dark:bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-white/10 dark:bg-slate-950/20" />
      </div>
      {actionReceipt ? (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 sm:top-4">
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={[
              "pointer-events-auto mx-auto flex max-w-xl items-start justify-between gap-3 rounded-[22px] border px-4 py-3 text-sm shadow-xl backdrop-blur-xl",
              actionReceipt.tone === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/90 dark:text-emerald-100"
                : actionReceipt.tone === "warning"
                  ? "border-amber-200 bg-amber-50/95 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/90 dark:text-amber-100"
                  : actionReceipt.tone === "error"
                    ? "border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-500/25 dark:bg-rose-950/90 dark:text-rose-100"
                    : "border-sky-200 bg-sky-50/95 text-sky-900 dark:border-sky-500/25 dark:bg-sky-950/90 dark:text-sky-100",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="font-semibold">{actionReceipt.title}</div>
              <div className="mt-0.5 leading-5 opacity-80">{actionReceipt.detail}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setActionReceipt(null)}>
              Dismiss
            </Button>
          </motion.div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 sm:gap-4 lg:gap-4">
        {showSettingsPanel ? null : mobileContextBar}
        <div className="hidden md:block">
          {shellTopBar}
        </div>

        {storageIssue ? (
          <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">Storage</div>
                <div className="mt-1">{storageIssue}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStorageIssue(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        {accountSetupPrompt}
        {starterSetupGuide}

        {showSettingsPanel ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense
              fallback={(
                <SectionCard
                  title="Loading settings"
                  description="Preparing account, setup, notification, backup, and production-readiness controls."
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="h-[120px] animate-pulse rounded-[22px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[120px] animate-pulse rounded-[22px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[120px] animate-pulse rounded-[22px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <SettingsPanel
              appTheme={appTheme}
              setAppTheme={setAppTheme}
              userMode={userMode}
              setUserMode={setUserMode}
              selfManagedAthlete={selfManagedAthlete}
              setSelfManagedAthlete={setSelfManagedAthlete}
              showBuilderTools={showBuilderTools}
              setShowBuilderTools={setShowBuilderTools}
              scheduleViewMode={scheduleViewMode}
              setScheduleViewMode={setScheduleViewMode}
              showAdvancedEditors={showAdvancedEditors}
              updateAdvancedEditor={updateAdvancedEditor}
              athleteName={athleteName}
              setAthleteName={setAthleteName}
              profileHeight={profileHeight}
              setProfileHeight={setProfileHeight}
              profileBodyFat={profileBodyFat}
              setProfileBodyFat={setProfileBodyFat}
              athleteLevel={athleteLevel}
              setAthleteLevel={setAthleteLevel}
              phaseType={phaseType}
              setPhaseType={setPhaseType}
              goalFocus={goalFocus}
              setGoalFocus={setGoalFocus}
              conditioningPriority={conditioningPriority}
              setConditioningPriority={setConditioningPriority}
              checkInCadence={checkInCadence}
              setCheckInCadence={setCheckInCadence}
              coachCadence={coachCadence}
              setCoachCadence={setCoachCadence}
              targetStageWeightLb={targetStageWeightLb}
              setTargetStageWeightLb={setTargetStageWeightLb}
              phasePlanCards={ecosystemPlanSnapshot.cards}
              setupReadinessItems={setupReadinessItems}
              athleteLevelOptions={athleteLevelOptions}
              phaseTypeOptions={phaseTypeOptions}
              goalFocusOptions={goalFocusOptions}
              conditioningPriorityOptions={conditioningPriorityOptions}
              checkInCadenceOptions={checkInCadenceOptions}
              coachCadenceOptions={coachCadenceOptions}
              accountProfile={accountProfile}
              accountStatusMessage={accountStatusMessage}
              accountStatusTone={accountStatusTone}
              notificationPreferences={notificationPreferences}
              notificationReminderSchedule={notificationReminderSchedule}
              backendReadinessItems={bodyPilotBackendReadiness}
              foodReadinessItems={bodyPilotFoodReadiness}
              productionTrustSignals={productionTrustSignals}
              liveBackendConnectors={liveBackendConnectors}
              productionAdapterContracts={productionAdapterContracts}
              membershipAdapterCapabilities={membershipAdapterCapabilities}
              notificationDeliveryContracts={notificationDeliveryContracts}
              syncLedgerEvents={syncLedgerEvents}
              syncConflictPolicies={syncConflictPolicies}
              onUpdateAccountProfile={updateAccountProfile}
              onSignIn={signInBodyPilotAccount}
              onCreateAccount={createBodyPilotAccount}
              onRequestPasswordReset={requestBodyPilotPasswordReset}
              onVerifyEmail={verifyBodyPilotEmail}
              onSignOut={signOutBodyPilotAccount}
              onDeleteAccount={deleteBodyPilotAccount}
              notificationPermission={notificationPermission}
              notificationStatusMessage={notificationStatusMessage}
              onRequestNotificationPermission={requestNotificationPermission}
              onUpdateNotificationPreference={updateNotificationPreference}
              isOnline={isOnline}
              lastSavedAt={lastSavedAt}
              lastBackupExportedAt={lastBackupExportedAt}
              storageIssue={storageIssue}
              onExportData={exportAppDataBackup}
              onImportData={importAppDataBackup}
              backupRestorePreview={backupRestorePreview}
              onConfirmImportData={confirmAppDataBackupImport}
              onCancelImportData={cancelAppDataBackupImport}
              onResetLocalData={resetLocalData}
              sectionIntent={settingsSectionIntent}
              onClose={() => setShowSettingsPanel(false)}
            />
            </Suspense>
          </motion.div>
        ) : null}

        <div className={showSettingsPanel ? "hidden md:block" : ""}>
        {activeTab === "dashboard" ? dailyShellDeck : viewStoryDeck}
        {athleteMembershipReceiptDeck}

        {userMode === "coach" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="space-y-3"
          >
            <div className="premium-surface p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-800 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100">
                    Operational queue
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Coach triage</div>
                  <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">
                    Start with the blocker, not the roster. Food gaps, missed lifts, recovery risk, check-ins, invites, and update receipts stay sorted by urgency.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Critical</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{criticalCoachTriageCount}</div>
                  </div>
                  <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Open</div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{coachShellTriageRows.length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[0.82fr_1.18fr]">
                {topCoachTriageRow ? (
                  <button
                    type="button"
                    onClick={() => openCoachTriageItem(topCoachTriageRow)}
                    className={[
                      "relative min-w-0 overflow-hidden rounded-[22px] border p-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md xl:self-start",
                      coachShellTriageToneClasses(topCoachTriageRow.tone).panel,
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-sky-400 dark:bg-sky-500" />
                    <div className="flex flex-wrap items-center gap-2 pl-3">
                      <Badge className={coachShellTriageToneClasses(topCoachTriageRow.tone).badge}>
                        {coachTriageBucketLabel(topCoachTriageRow.bucket)}
                      </Badge>
                      <Badge variant="outline">{coachTriagePriorityLabel(topCoachTriageRow.priority)}</Badge>
                    </div>
                    <div className="mt-3 pl-3 text-base font-semibold text-slate-950 dark:text-slate-100">
                      {topCoachTriageRow.athleteName}: {topCoachTriageRow.title}
                    </div>
                    <p className="mt-2 pl-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {topCoachTriageRow.detail}
                    </p>
                    <div className="mt-3 pl-3 text-xs font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300">
                      {topCoachTriageRow.actionLabel}
                    </div>
                  </button>
                ) : null}

                <div className="min-w-0 rounded-[22px] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {coachTriageFilterOptions.map((option) => (
                      <Button
                        key={`coach-triage-${option.value}`}
                        size="sm"
                        variant={coachTriageFilter === option.value ? "default" : "outline"}
                        className="shrink-0 text-xs"
                        onClick={() => setCoachTriageFilter(option.value)}
                      >
                        {option.label} {option.count}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {visibleCoachTriageRows.length > 0 ? (
                      visibleCoachTriageRows.slice(0, 4).map((item) => {
                        const styles = coachShellTriageToneClasses(item.tone);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openCoachTriageItem(item)}
                            className={[
                              "min-w-0 rounded-[18px] border bg-white px-3 py-3 text-left transition hover:-translate-y-[1px] hover:shadow-sm dark:bg-slate-950/40",
                              item.priority >= 82 ? styles.panel : "border-slate-200 dark:border-white/10",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{item.athleteName}</div>
                                <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                  {item.athleteMeta}
                                </div>
                              </div>
                              <Badge className={`shrink-0 ${styles.badge}`}>{coachTriagePriorityLabel(item.priority)}</Badge>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                            <div className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{item.actionLabel}</div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
                        No clients match this queue filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-soft-surface p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">This Athlete</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{activeAthlete.name}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {activeAthlete.division}, {activeAthlete.status}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:gap-1.5">
                  <Button size="sm" variant="outline" onClick={goToPreviousAthlete} className="text-xs">Previous</Button>
                  <Button size="sm" variant="outline" onClick={goToNextAthlete} className="text-xs">Next</Button>
                  <Button size="sm" variant={showCoachRoster ? "default" : "outline"} onClick={() => setShowCoachRoster((prev) => !prev)} className="text-xs">
                    {showCoachRoster ? "Hide roster" : "Full roster"}
                  </Button>
                </div>
              </div>
            </div>

            {showCoachRoster ? (
              <>
                <div className="premium-surface p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">Client access</div>
                      <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">
                        Invite clients, see pending relationships, and remove access without leaving the roster.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-800 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100">
                        {pendingCoachMemberships.length} pending
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                        {activeCoachMemberships.length} active
                      </span>
                    </div>
                  </div>

                  <form
                    className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      inviteCoachClient();
                    }}
                  >
                    <Input
                      value={membershipInviteDraft.athleteName}
                      onChange={(event) => setMembershipInviteDraft((prev) => ({ ...prev, athleteName: event.target.value }))}
                      placeholder="Client name"
                    />
                    <Input
                      type="email"
                      value={membershipInviteDraft.athleteEmail}
                      onChange={(event) => setMembershipInviteDraft((prev) => ({ ...prev, athleteEmail: event.target.value }))}
                      placeholder="client@email.com"
                    />
                    <Button type="submit" className="h-10 w-full gap-2 sm:col-span-2 lg:col-span-1 lg:w-auto">
                      <MailPlus className="h-4 w-4" />
                      Send invite
                    </Button>
                  </form>

                  {membershipInviteMessage ? (
                    <div className="mt-3 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                      {membershipInviteMessage}
                    </div>
                  ) : null}

                  {latestMembershipAuditEvent ? (
                    <div className="mt-3 rounded-[16px] border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm leading-5 text-indigo-900 dark:border-indigo-500/25 dark:bg-indigo-950/20 dark:text-indigo-100">
                      <span className="font-semibold">Last access event:</span> {latestMembershipAuditEvent.title}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Pending invites</div>
                      <div className="mt-2 space-y-2">
                        {pendingCoachMemberships.length > 0 ? (
                          pendingCoachMemberships.map((membership) => (
                            <div key={membership.id} className="flex flex-col items-stretch gap-2 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-500/25 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between sm:py-2">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{membership.athleteName}</div>
                                <div className="truncate text-xs text-slate-600 dark:text-slate-300">{membership.athleteEmail}</div>
                              </div>
                              <Button size="sm" variant="outline" className="h-9 w-full justify-center gap-1.5 text-xs sm:w-auto sm:shrink-0" onClick={() => revokeCoachMembership(membership)}>
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                            No pending invites.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Membership access</div>
                      <div className="mt-2 space-y-2">
                        {activeCoachMemberships.length > 0 ? (
                          activeCoachMemberships.map((membership) => (
                            <div key={membership.id} className="flex flex-col items-stretch gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-500/25 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between sm:py-2">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{membership.athleteName}</div>
                                <div className="truncate text-xs text-slate-600 dark:text-slate-300">
                                  Active, {membership.permissions.length} permissions
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="h-9 w-full justify-center gap-1.5 text-xs sm:w-auto sm:shrink-0" onClick={() => revokeCoachMembership(membership)}>
                                <UserMinus className="h-3.5 w-3.5" />
                                Revoke
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                            No membership-backed clients yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <CoachRosterRail
                  title="Coach roster"
                  description={`${pendingCoachMemberships.length} pending invite${pendingCoachMemberships.length === 1 ? "" : "s"}. Switch athletes and keep the queue visible.`}
                  items={coachRosterCards}
                  onSelect={setSelectedAthleteId}
                  onPrevious={goToPreviousAthlete}
                  onNext={goToNextAthlete}
                />
              </>
            ) : null}
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => goToTab(value as AppTab)} className="w-full">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">
                <div className="flex flex-col gap-3 pb-1">
              <WorkspaceSidebar
                title=""
                subtitle=""
                modeLabel={userMode === "coach" ? "Coach" : selfManagedAthlete ? "Athlete / Self" : "Athlete / Guided"}
                groups={desktopSidebarGroups}
              />

              <div className="premium-action-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">To-do</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{openTrackerTaskCount} open</div>
                  </div>
                  {canEditPlan ? (
                    <Button size="sm" variant="outline" onClick={addTrackerTask}>
                      Add task
                    </Button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2.5">
                  {openTrackerTasks.length === 0 ? (
                    <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                      Nothing open.
                    </div>
                  ) : (
                    openTrackerTasks.map((task) => (
                      <div key={task.id} className="rounded-[18px] border border-slate-200 bg-white/88 px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                        <div className="flex items-start gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => updateTrackerTask(task.id, { done: true })}
                          >
                            Done
                          </Button>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.label}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {[task.category, task.target].filter(Boolean).join(" Â· ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <TabsList className={[
                "hidden h-auto w-full flex-wrap items-center gap-1.5 overflow-visible rounded-[18px] border p-2.5 sm:rounded-[22px] sm:p-3 md:flex lg:hidden",
                themeClasses.tabs,
              ].join(" ")}>
                {primaryWorkspaceNav.map((item) => (
                  <WorkspaceNavTrigger key={item.value} {...item} triggerActiveClass={triggerActiveClass} />
                ))}
                {(showBuilderTools || isBuilderWorkspace) && (
                  <>
                    <div className="mx-0.5 hidden h-8 w-px bg-slate-200/70 sm:block dark:bg-white/10" />
                    {builderWorkspaceNav.map((item) => (
                      <WorkspaceNavTrigger key={item.value} {...item} triggerActiveClass={triggerActiveClass} />
                    ))}
                  </>
                )}
              </TabsList>

              <TabsContent value="dashboard" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading coaching home" : "Loading athlete home"}
                  description="Building the decision surface for this workspace."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="grid gap-3">
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    </div>
                  </div>
                </SectionCard>
              )}
            >
              <DashboardTab
                userMode={userMode}
                selfManagedAthlete={selfManagedAthlete}
                dashboardPrimaryAction={dashboardPrimaryAction}
                goToTab={goToTab}
                openNutritionSurface={openNutritionSurface}
                openTrackerSurface={openTrackerSurface}
                exportAthleteHandoff={exportAthleteHandoff}
                coachInstruction={coachInstruction}
                currentQuote={currentQuote}
                dashboardDecisionTiles={dashboardDecisionTiles}
                activeAthlete={activeAthlete}
                athleteStatusLabel={athleteStatusLabel}
                athleteRoster={athleteRoster}
                selectedAthleteId={selectedAthleteId}
                setSelectedAthleteId={setSelectedAthleteId}
                recoveryHeadroom={recoveryHeadroom}
                primaryLimiter={primaryLimiter}
                trainingSuggestion={trainingSuggestion}
                autoApplySuggestion={autoApplySuggestion}
                setAutoApplySuggestion={setAutoApplySuggestion}
                applyTrainingSuggestion={applyTrainingSuggestion}
                autoApplyDietPreset={autoApplyDietPreset}
                setAutoApplyDietPreset={setAutoApplyDietPreset}
                applyMacroPreset={applyMacroPreset}
                coachRecommendation={coachRecommendation}
                dashboardChangeSummary={dashboardChangeSummary}
                selectedTrackerExecutionScore={selectedTrackerExecutionScore}
                selectedTrackerMissedLifts={selectedTrackerMissedLifts}
                lookStateLabel={lookStateLabel}
                conditionScore={conditionScore}
                addCheckIn={addCheckIn}
                checkIns={checkIns}
                attachCheckInPhoto={attachCheckInPhoto}
                removeCheckInPhoto={removeCheckInPhoto}
                checkInReviewSnapshot={checkInReviewSnapshot}
                nutritionPreset={nutritionPreset}
                todayFuelSummary={todayFuelSummary}
                todayCompletionItems={todayCompletionItems}
                momentumSignals={momentumSignals}
                trackerWeeklyReview={trackerWeeklyReview}
                weeklySnapshots={weeklySnapshots}
                saveWeeklySnapshot={saveWeeklySnapshot}
                contestPrepModel={contestPrepModel}
                macroProgressionWeeks={scheduleMacroProgression}
                applyAdaptiveWeekPlan={applyAdaptiveWeekPlan}
                workflowPriorities={userMode === "coach" ? coachWorkflowQueue : athleteWorkflowQueue}
                recentChangeDigest={workflowChangeDigest}
                latestCoachUpdate={latestCoachUpdate}
                prepSignalSnapshot={prepSignalSnapshot}
                decisionSignalGate={decisionSignalGate}
                decisionBrief={decisionBrief}
                latestPublishedDecision={latestPublishedDecision}
                publishedPlanDiffs={publishedPlanDiffs}
                acknowledgeLatestCoachDecision={acknowledgeLatestCoachDecision}
                coachThreadMessages={coachThreadMessages}
                sendCoachThreadMessage={sendCoachThreadMessage}
                markCoachThreadMessagesRead={markCoachThreadMessagesRead}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="ai-coach" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title="Loading AI Coach"
                  description="Reading BodyPilot signals and building the next action plan."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="grid gap-3">
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    </div>
                  </div>
                </SectionCard>
              )}
            >
              <AICoachTab
                userMode={userMode}
                selfManagedAthlete={selfManagedAthlete}
                goalFocus={goalFocus}
                phaseBadge={ecosystemPlanSnapshot.phaseBadge}
                timelineSummary={timelineSummary}
                contestDateLabel={contestDateLabel}
                contestCountdownDays={contestCountdownDays}
                weeksOut={weeksOut}
                bodyWeight={bodyWeight}
                targetStageWeightLb={targetStageWeightLb}
                planningTargetWeightLb={contestPrepModel.planningTargetWeightLb}
                goalOvershootBufferLb={contestPrepModel.goalOvershootBufferLb}
                calorieErrorBufferPct={contestPrepModel.calorieErrorBufferPct}
                plannedDeficitCalories={contestPrepModel.plannedDeficitCalories}
                maintenanceCalories={contestPrepModel.maintenanceCalories}
                profileBodyFat={profileBodyFat}
                selectedCalendarSessionLabel={selectedCalendarSessionLabel}
                primaryLimiter={primaryLimiter}
                coachRecommendation={coachRecommendation}
                nutritionPreset={nutritionPreset}
                trainingSuggestion={trainingSuggestion}
                todayFuelSummary={todayFuelSummary}
                macroProgressionWeeks={scheduleMacroProgression}
                bodyWeightTrendModel={bodyWeightTrendModel}
                bodyWeightTrendValues={bodyWeightTrendValues}
                dietPressureModel={dietPressureModel}
                recoveryPressureModel={recoveryPressureModel}
                fuelTimingModel={fuelTimingModel}
                hydrationSupportModel={hydrationSupportModel}
                proteinSupportModel={proteinSupportModel}
                decisionConfidenceModel={decisionConfidenceModel}
                decisionSignalGate={decisionSignalGate}
                decisionBrief={decisionBrief}
                conditioningSnapshot={conditioningSnapshot}
                adaptationPrimaryAction={adaptationSnapshot.primaryAction}
                supportStackPrimaryAction={supportStackSnapshot.primaryAction}
                selectedTrackerExecutionScore={selectedTrackerExecutionScore}
                selectedTrackerMissedLifts={selectedTrackerMissedLifts}
                selectedTrackerStepScore={selectedTrackerStepScore}
                selectedTrackerMissingFields={selectedTrackerMissingFields}
                trackerWeeklyReview={trackerWeeklyReview}
                recoveryScore={recoveryScore}
                sleepHours={sleepHours}
                sleepQuality={sleepQuality}
                conditionScore={conditionScore}
                drynessScore={drynessScore}
                weeklyDensityScore={weeklyDensityScore}
                activeStepTarget={activeStepTarget}
                athleteCompletionProgress={athleteCompletionProgress}
                complianceConfidence={complianceConfidence}
                todayCompletionItems={todayCompletionItems}
                dashboardQueuedChanges={dashboardQueuedChanges}
                openNutritionSurface={openNutritionSurface}
                openTrackerSurface={openTrackerSurface}
                goToTab={goToTab}
                applyMacroPreset={applyMacroPreset}
                applyTrainingSuggestion={applyTrainingSuggestion}
                applyAdaptiveWeekPlan={applyAdaptiveWeekPlan}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="nutrition" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading food workflow" : "Loading today's food"}
                  description="Building the fueling workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="grid gap-3">
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                      <div className="h-[98px] animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    </div>
                  </div>
                </SectionCard>
              )}
            >
              <NutritionTab
                userMode={userMode}
                canEditPlan={canEditPlan}
                nutritionFocusCards={userMode === "coach" ? coachNutritionFocusCards : athleteNutritionFocusCards}
                nutritionPrimaryAction={nutritionPrimaryAction}
                nutritionDecisionTiles={nutritionDecisionTiles}
                nutritionWindowSummary={nutritionWindowSummary}
                goToTab={goToTab}
                openTrackerSurface={openTrackerSurface}
                applyMacroPreset={applyMacroPreset}
                trainingDay={trainingDay}
                setTrainingDay={setTrainingDay}
                nutritionPreset={nutritionPreset}
                proteinTarget={proteinTarget}
                setProteinTarget={setProteinTarget}
                carbTarget={carbTarget}
                setCarbTarget={setCarbTarget}
                fatTarget={fatTarget}
                setFatTarget={setFatTarget}
                estimatedTdee={estimatedTdee}
                setEstimatedTdee={setEstimatedTdee}
                macroCalories={macroCalories}
                calorieDelta={calorieDelta}
                mealTotals={mealTotals}
                intraCarbs={intraCarbs}
                setIntraCarbs={setIntraCarbs}
                waterLiters={waterLiters}
                setWaterLiters={setWaterLiters}
                saltTsp={saltTsp}
                setSaltTsp={setSaltTsp}
                metricsTone={metricsTone}
                nutritionRiskFlags={nutritionRiskFlags}
                showNutritionControls={showAdvancedEditors.nutritionControls}
                toggleNutritionControls={() => setShowAdvancedEditors((prev) => ({ ...prev, nutritionControls: !prev.nutritionControls }))}
                fuelingBlocks={fuelingBlocks}
                mealTypeTone={mealTypeTone}
                mealMacroGuidance={mealMacroGuidance}
                showNutritionEditor={showAdvancedEditors.nutrition}
                toggleNutritionEditor={() => setShowAdvancedEditors((prev) => ({ ...prev, nutrition: !prev.nutrition }))}
                navigationIntent={nutritionSidebarIntent}
                foodSurfaceIntent={nutritionSurfaceIntent}
                meals={meals}
                setMeals={setMeals}
                todayIso={todayIso}
                foodDayHistory={foodDayHistory}
                saveFoodDaySnapshot={saveFoodDaySnapshot}
                copyFoodDayToToday={copyFoodDayToToday}
                addMeal={addMeal}
                moveMeal={moveMeal}
                duplicateMeal={duplicateMeal}
                assignMealTemplate={assignMealTemplate}
                mealTemplates={mealTemplates}
                saveMealAsTemplate={saveMealAsTemplate}
                applyMealTemplate={applyMealTemplate}
                addMealFromTemplate={addMealFromTemplate}
                availableFoods={availableFoods}
                favoriteFoodIds={favoriteFoodIds}
                recentFoodIds={recentFoodIds}
                toggleFavoriteFood={toggleFavoriteFood}
                addFoodEntriesToMeal={addFoodEntriesToMeal}
                addCustomFoods={addCustomFoods}
                updateMealFoodEntryServings={updateMealFoodEntryServings}
                updateMealFoodEntryUnit={updateMealFoodEntryUnit}
                removeMealFoodEntry={removeMealFoodEntry}
                supportStackCards={supportStackSnapshot.summaryCards}
                supportStackFlags={supportStackSnapshot.flags}
                supplementProtocol={supportStackSnapshot.items}
                updateSupplementProtocol={updateSupplementProtocol}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="compounds" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading stack review" : "Loading stack overview"}
                  description="Building the compounds workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <CompoundsTab
                userMode={userMode}
                canEditPlan={canEditPlan}
                stackFocusCards={userMode === "coach" ? coachStackFocusCards : athleteStackFocusCards}
                compoundsPrimaryAction={compoundsPrimaryAction}
                goToTab={goToTab}
                openTrackerSurface={openTrackerSurface}
                enabledCompounds={enabledCompounds}
                totalWeeklyCompoundDose={totalWeeklyCompoundDose}
                compoundWeekBurdenSummary={compoundWeekBurdenSummary}
                primaryLimiter={primaryLimiter}
                coachRecommendation={coachRecommendation}
                recoveryScore={recoveryScore}
                compoundSignalSummary={compoundSignalSummary}
                metricsTone={metricsTone}
                compoundRiskFlags={compoundRiskFlags}
                compoundMonitoringCards={compoundMonitoringSnapshot.categoryCards}
                compoundMonitoringFlags={compoundMonitoringSnapshot.flags}
                compoundLibrarySelection={compoundLibrarySelection}
                setCompoundLibrarySelection={setCompoundLibrarySelection}
                addCompoundFromLibrary={addCompoundFromLibrary}
                customCompoundName={customCompoundName}
                setCustomCompoundName={setCustomCompoundName}
                customCompoundHalfLife={customCompoundHalfLife}
                setCustomCompoundHalfLife={setCustomCompoundHalfLife}
                customCompoundAnabolic={customCompoundAnabolic}
                setCustomCompoundAnabolic={setCustomCompoundAnabolic}
                customCompoundAndrogenic={customCompoundAndrogenic}
                setCustomCompoundAndrogenic={setCustomCompoundAndrogenic}
                addCustomCompound={addCustomCompound}
                stackAnabolicRating={stackAnabolicRating}
                stackAndrogenicRating={stackAndrogenicRating}
                compoundDailyBurden={compoundDailyBurden}
                compoundTotals={compoundTotals}
                showAdvancedCompounds={showAdvancedEditors.compounds}
                toggleAdvancedCompounds={() => setShowAdvancedEditors((prev) => ({ ...prev, compounds: !prev.compounds }))}
                openAdvancedCompounds={() => setShowAdvancedEditors((prev) => (prev.compounds ? prev : { ...prev, compounds: true }))}
                compounds={compounds}
                getCompoundMismatchFlags={getCompoundMismatchFlags}
                hasCompoundMatch={hasCompoundMatch}
                hasScienceFlag={hasScienceFlag}
                fullnessScore={fullnessScore}
                drynessScore={drynessScore}
                drynessLimiterReason={drynessLimiterReason}
                waterLiters={waterLiters}
                saltTsp={saltTsp}
                intraCarbs={intraCarbs}
                displayCompoundName={displayCompoundName}
                getCompoundWeeklyTotalValue={(compound) => getCompoundWeeklyTotal(compound as Compound, compoundTrainingDaysPerWeek)}
                getCompoundSignalImpactValue={(compound, key) =>
                  Number((Number((compound as Compound)[key] ?? 0) * getCompoundEffectScale(compound as Compound, compoundTrainingDaysPerWeek)).toFixed(1))
                }
                updateCompound={updateCompound}
                removeCompound={removeCompound}
                addCompoundScheduleRow={addCompoundScheduleRow}
                updateCompoundScheduleRow={updateCompoundScheduleRow}
                deleteCompoundScheduleRow={deleteCompoundScheduleRow}
                compoundExposureChart={compoundExposureChart}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="split" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading training design" : "Loading training map"}
                  description="Building the split workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <SplitTab
                userMode={userMode}
                canEditPlan={canEditPlan}
                splitPrimaryAction={splitPrimaryAction}
                trainingSuggestion={trainingSuggestion}
                splitPrioritySummary={splitPrioritySummary}
                applyTrainingSuggestion={applyTrainingSuggestion}
                goToTab={goToTab}
                splitBuilderStats={splitBuilderStats}
                weeklyDensityScore={weeklyDensityScore}
                adaptationCards={adaptationSnapshot.cards}
                metricsTone={metricsTone}
                splitExecutionRisks={splitExecutionRisks}
                splitTemplateOptions={splitTemplateOptions.map((template) => ({ id: template.id, label: template.label }))}
                splitTemplate={splitTemplate}
                applySplitTemplate={applySplitTemplate}
                splitStrengthBias={splitStrengthBias}
                setSplitStrengthBias={setSplitStrengthBias}
                splitHypertrophyBias={splitHypertrophyBias}
                setSplitHypertrophyBias={setSplitHypertrophyBias}
                splitVolumeBias={splitVolumeBias}
                setSplitVolumeBias={setSplitVolumeBias}
                splitRecoveryBias={splitRecoveryBias}
                setSplitRecoveryBias={setSplitRecoveryBias}
                splitFrequencyBias={splitFrequencyBias}
                setSplitFrequencyBias={setSplitFrequencyBias}
                splitIntensityBias={splitIntensityBias}
                setSplitIntensityBias={setSplitIntensityBias}
                splitPriorityMuscles={splitPriorityMuscles}
                splitPriorityMuscleDraft={splitPriorityMuscleDraft}
                setSplitPriorityMuscleDraft={setSplitPriorityMuscleDraft}
                splitPriorityMuscleOptions={splitPriorityMuscleOptions}
                addSplitPriorityMuscle={addSplitPriorityMuscle}
                removeSplitPriorityMuscle={removeSplitPriorityMuscle}
                splitEstimatedMaxes={splitEstimatedMaxes}
                updateSplitEstimatedMax={updateSplitEstimatedMax}
                autoGenerateSplitFromBuilder={autoGenerateSplitFromBuilder}
                addTrainingDay={addTrainingDay}
                splitWeekPlanCards={splitWeekPlanCards}
                libraryTargetDayId={libraryTargetDayId}
                setLibraryTargetDayId={setLibraryTargetDayId}
                setLibraryTargetFromDay={setLibraryTargetFromDay}
                trainingSurfaceIntent={trainingSurfaceIntent}
                libraryRecommendedExercises={libraryRecommendedExercises}
                filteredExerciseLibrary={filteredExerciseLibrary}
                exerciseProfiles={exerciseScientificProfiles}
                libraryRiskFlags={libraryRiskFlags}
                librarySearch={librarySearch}
                setLibrarySearch={setLibrarySearch}
                libraryCategory={libraryCategory}
                setLibraryCategory={setLibraryCategory}
                libraryCategoryOptions={libraryCategoryOptions}
                addExerciseFromLibraryToDay={addExerciseFromLibraryToDay}
                getExerciseSubstitutions={getExerciseSubstitutions}
                moveTrainingDay={moveTrainingDay}
                duplicateTrainingDay={duplicateTrainingDay}
                removeTrainingDay={removeTrainingDay}
                setTrackerTemplateDayId={setTrackerTemplateDayId}
                splitSystemicByDay={splitSystemicByDay}
                splitMuscleFrequency={splitMuscleFrequency}
                showAdvancedSplit={showAdvancedEditors.split}
                toggleAdvancedSplit={() => setShowAdvancedEditors((prev) => ({ ...prev, split: !prev.split }))}
                openAdvancedSplit={() => setShowAdvancedEditors((prev) => (prev.split ? prev : { ...prev, split: true }))}
                pushSplitDayToTracker={pushSplitDayToTracker}
                workoutSplit={workoutSplit}
                autofillDayByFocus={autofillDayByFocus}
                addExerciseToDay={addExerciseToDay}
                updateWorkoutDay={updateWorkoutDay}
                exerciseLibrary={exerciseLibrary}
                updateWorkoutExercise={updateWorkoutExercise}
                moveExerciseWithinDay={moveExerciseWithinDay}
                duplicateExerciseWithinDay={duplicateExerciseWithinDay}
                deleteExerciseWithinDay={deleteExerciseWithinDay}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="tracker" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading tracker review" : "Loading today's tracker"}
                  description="Building the daily execution workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <TrackerTab
                userMode={userMode}
                selfManagedAthlete={selfManagedAthlete}
                canEditPlan={canEditPlan}
                trackerFocusCards={userMode === "coach" ? coachTrackerFocusCards : athleteTrackerFocusCards}
                trackerPrimaryAction={trackerPrimaryAction}
                athleteOffTrackFlags={athleteOffTrackFlags}
                goToTab={goToTab}
                openNutritionSurface={openNutritionSurface}
                addCheckIn={addCheckIn}
                selectedTrackerDay={selectedTrackerDay}
                selectedTrackerDayId={selectedTrackerDayId}
                setSelectedTrackerDayId={setSelectedTrackerDayId}
                trackerDays={trackerDays}
                trackerTemplateDayId={trackerTemplateDayId}
                setTrackerTemplateDayId={setTrackerTemplateDayId}
                trackerMonthLabel={trackerMonthLabel}
                setTrackerMonthLabel={setTrackerMonthLabel}
                workoutSplit={workoutSplit}
                selectedTrackerCompletedLifts={selectedTrackerCompletedLifts}
                selectedTrackerCompletionPct={selectedTrackerCompletionPct}
                selectedTrackerExecutionScore={selectedTrackerExecutionScore}
                selectedTrackerMissedLifts={selectedTrackerMissedLifts}
                selectedTrackerStepScore={selectedTrackerStepScore}
                recoveryScore={recoveryScore}
                sleepHours={sleepHours}
                trackerAthleteChecklist={trackerAthleteChecklist}
                trackerCoachReviewCards={trackerCoachReviewCards}
                trackerMissingFields={selectedTrackerMissingFields}
                metricsTone={metricsTone}
                totalPlannedSets={totalPlannedSets}
                addTrackerLift={addTrackerLift}
                pushTemplateToTracker={pushTemplateToTracker}
                updateTrackerDay={updateTrackerDay}
                showAdvancedTracker={showAdvancedEditors.tracker}
                toggleAdvancedTracker={() => setShowAdvancedEditors((prev) => ({ ...prev, tracker: !prev.tracker }))}
                athleteNextOpenLift={athleteNextOpenLift}
                athleteCompletionProgress={athleteCompletionProgress}
                trackerDayCompletionMap={trackerDayCompletionMap}
                liveBodyWeight={bodyWeight}
                expandedAthleteLifts={expandedAthleteLifts}
                toggleAthleteLiftExpanded={toggleAthleteLiftExpanded}
                updateTrackerLift={updateTrackerLift}
                trackerTasks={trackerTasks}
                addTrackerTask={addTrackerTask}
                updateTrackerTask={updateTrackerTask}
                removeTrackerTask={removeTrackerTask}
                trackerWeeklyReview={trackerWeeklyReview}
                weeklySnapshots={weeklySnapshots}
                selectedCalendarDate={selectedCalendarDate}
                setSelectedCalendarDate={setSelectedCalendarDate}
                trackerSurfaceIntent={trackerSurfaceIntent}
                todayFuelSummary={todayFuelSummary}
                targetSteps={activeStepTarget}
                wearableSnapshots={wearableSnapshots}
                syncWearableSnapshot={syncWearableSnapshot}
                closeTrackerDay={closeTrackerDay}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="library" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading exercise support" : "Loading substitutions"}
                  description="Building the exercise selection workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <LibraryTab
                userMode={userMode}
                libraryFocusCards={userMode === "coach" ? coachExerciseFocusCards : athleteExerciseFocusCards}
                libraryPrimaryAction={libraryPrimaryAction}
                libraryTargetDaySummary={libraryTargetDaySummary}
                goToTab={goToTab}
                openTrackerSurface={openTrackerSurface}
                filteredExerciseLibrary={filteredExerciseLibrary}
                libraryRecommendedExercises={libraryRecommendedExercises}
                exerciseProfiles={exerciseScientificProfiles}
                libraryRiskFlags={libraryRiskFlags}
                metricsTone={metricsTone}
                librarySearch={librarySearch}
                setLibrarySearch={setLibrarySearch}
                libraryCategory={libraryCategory}
                setLibraryCategory={setLibraryCategory}
                libraryCategoryOptions={libraryCategoryOptions}
                libraryMuscle={libraryMuscle}
                setLibraryMuscle={setLibraryMuscle}
                libraryMuscleOptions={libraryMuscleOptions}
                libraryPosition={libraryPosition}
                setLibraryPosition={setLibraryPosition}
                libraryPositionOptions={libraryPositionOptions}
                libraryTargetDayId={libraryTargetDayId}
                setLibraryTargetDayId={setLibraryTargetDayId}
                workoutSplit={workoutSplit}
                libraryTargetDay={libraryTargetDay}
                addExerciseFromLibraryToDay={addExerciseFromLibraryToDay}
                getExerciseSubstitutions={getExerciseSubstitutions}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="schedule" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading full calendar" : "Loading calendar editor"}
                  description="Building the deeper planning workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <ScheduleTab
                userMode={userMode}
                canEditPlan={canEditPlan}
                scheduleViewMode={scheduleViewMode}
                setScheduleViewMode={setScheduleViewMode}
                scheduleFocusCards={userMode === "coach" ? coachScheduleFocusCards : athleteScheduleFocusCards}
                weekDecisionBridge={weekDecisionBridge}
                schedulePrimaryAction={schedulePrimaryAction}
                goToTab={goToTab}
                openTrackerSurface={openTrackerSurface}
                publishCoachDecision={publishCoachDecision}
                populateScheduleFromPlan={populateScheduleFromPlan}
                scheduleRiskFlags={scheduleRiskFlags}
                addScheduleEvent={addScheduleEvent}
                scheduleDensitySummary={scheduleDensitySummary}
                scheduleExecutionLanes={scheduleExecutionLanes}
                showAdvancedSchedule={showAdvancedEditors.schedule}
                toggleAdvancedSchedule={() => setShowAdvancedEditors((prev) => ({ ...prev, schedule: !prev.schedule }))}
                schedule={schedule}
                updateScheduleEvent={updateScheduleEvent}
                removeScheduleEvent={removeScheduleEvent}
                selectedCalendarDate={selectedCalendarDate}
                setSelectedCalendarDate={setSelectedCalendarDate}
                contestDate={contestDate}
                setContestDate={setContestDate}
                openDateReference={openDateReference}
                workoutSplit={workoutSplit}
                trackerDays={trackerDays}
                selectedCalendarSessionLabel={selectedCalendarSessionLabel}
                selectedScheduledWorkoutDay={selectedScheduledWorkoutDay}
                selectedScheduledExercises={selectedScheduledExercises}
                scheduledSessionOptions={scheduledSessionOptions}
                getScheduledSessionLabelForDate={getScheduledSessionLabelForDate}
                getScheduledSessionIdForDate={getScheduledSessionIdForDate}
                setScheduledSessionForDate={setScheduledSessionForDate}
                swapScheduledSession={swapScheduledSession}
                todayIso={todayIso}
                macroTargets={{ protein: proteinTarget, carbs: carbTarget, fats: fatTarget }}
                loadedMealPlan={selectedDayLoadedMealPlan}
                macroProgressionWeeks={scheduleMacroProgression}
                applyAdaptiveWeekPlan={applyAdaptiveWeekPlan}
                peakWeekGoal={peakWeekGoal}
                peakWeekPlan={peakWeekPlan}
                applyPeakDayPlan={applyPeakDayPlan}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="coach" className="mt-3 sm:mt-4">
            <Suspense
              fallback={(
                <SectionCard
                  title={userMode === "coach" ? "Loading coach review" : "Loading direction package"}
                  description="Building the coaching workspace for this athlete."
                >
                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                    <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200/80 bg-slate-100/90 dark:border-white/10 dark:bg-white/[0.05]" />
                  </div>
                </SectionCard>
              )}
            >
              <CoachTab
                userMode={userMode}
                coachFocusCards={userMode === "coach" ? coachReviewFocusCards : athleteCoachFocusCards}
                goToTab={goToTab}
                openTrackerSurface={openTrackerSurface}
                openNutritionSurface={openNutritionSurface}
                coachRecommendation={coachRecommendation}
                primaryLimiter={primaryLimiter}
                selectedTrackerExecutionScore={selectedTrackerExecutionScore}
                selectedTrackerMissedLifts={selectedTrackerMissedLifts}
                lookStateLabel={lookStateLabel}
                conditionScore={conditionScore}
                drynessScore={drynessScore}
                coachInstruction={coachInstruction}
                setCoachInstruction={setCoachInstruction}
                athleteIssue={athleteIssue}
                setAthleteIssue={setAthleteIssue}
                athleteChangeSummary={athleteChangeSummary}
                activeAthlete={activeAthlete}
                athleteRoster={athleteRoster}
                selectedAthleteId={selectedAthleteId}
                setSelectedAthleteId={setSelectedAthleteId}
                weeksOut={weeksOut}
                trackerWeeklyReview={trackerWeeklyReview}
                complianceConfidence={complianceConfidence}
                decisionConfidence={decisionConfidenceModel}
                metricsTone={metricsTone}
                weeklyDensityScore={weeklyDensityScore}
                dashboardQueuedChanges={dashboardQueuedChanges}
                publishCoachDecision={publishCoachDecision}
                exportAthleteHandoff={exportAthleteHandoff}
                saveWeeklySnapshot={saveWeeklySnapshot}
                exportCoachReport={exportCoachReport}
                movementLimitation={movementLimitation}
                setMovementLimitation={setMovementLimitation}
                weeklySnapshots={weeklySnapshots}
                recoveryScore={recoveryScore}
                sleepHours={sleepHours}
                sleepQuality={sleepQuality}
                coachWorkflowQueue={coachWorkflowQueue}
                coachTriageRows={coachWorkspaceTriageRows}
                workflowChangeDigest={workflowChangeDigest}
                latestCoachUpdate={latestCoachUpdate}
                scienceCards={userMode === "coach" ? coachScienceCards : athleteScienceCards}
                prepSignalSnapshot={prepSignalSnapshot}
                decisionSignalGate={decisionSignalGate}
                decisionBrief={decisionBrief}
                coachDecisionDraft={coachDecisionDraft}
                latestPublishedDecision={latestPublishedDecision}
                publishedPlanDiffs={publishedPlanDiffs}
                acknowledgeLatestCoachDecision={acknowledgeLatestCoachDecision}
                publishedDecisionHistory={publishedDecisionHistory}
                restoreCoachDecisionDraft={restoreCoachDecisionDraft}
                checkInVisualReview={checkInVisualReview}
                addCheckIn={addCheckIn}
                coachThreadMessages={coachThreadMessages}
                sendCoachThreadMessage={sendCoachThreadMessage}
                markCoachThreadMessagesRead={markCoachThreadMessagesRead}
              />
            </Suspense>
          </TabsContent>
            </div>
          </div>
        </Tabs>
        </div>

        {!showSettingsPanel ? (
        <div className="mobile-dock pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
          <div className="mobile-control-glass pointer-events-auto mx-auto grid w-full max-w-[calc(100vw-1.5rem)] grid-cols-4 items-stretch gap-1 rounded-[26px] p-2">
            {mobileDockNav.map((item) => {
              const isActive = Boolean(item.active);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className={[
                    "flex min-w-0 flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-center transition",
                    isActive
                      ? "mobile-dock-active"
                      : item.variant === "default"
                        ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : item.variant === "outline"
                          ? "border border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  <item.Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-[10px] font-semibold uppercase tracking-[0.06em]">{item.label}</span>
                  {item.helper ? (
                    <span className="hidden max-w-full truncate text-[9px] font-medium opacity-75 min-[390px]:block">
                      {item.helper}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}
