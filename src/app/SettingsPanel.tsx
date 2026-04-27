import React from "react";
import { AlertTriangle, Bell, ChevronDown, Cloud, Download, FileText, LifeBuoy, LogOut, MailCheck, Moon, RotateCcw, ShieldCheck, Sun, Trash2, Upload, UserRound, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BodyPilotLogo } from "./brand";
import type { BodyPilotCreateAccountInput, BodyPilotCredentials } from "./auth_adapter";
import type { LiveBackendConnector } from "./live_backend_connectors";
import type {
  BackupRestorePreview,
  BodyPilotAccount,
  BodyPilotRole,
  LaunchReadinessItem,
  MembershipAdapterCapability,
  NotificationDeliveryContract,
  NotificationPreferences,
  NotificationReminderScheduleItem,
  ProductionAdapterContract,
  ProductionTrustSignal,
  SyncConflictPolicy,
  SyncLedgerEvent,
} from "./product_infrastructure";
import { SectionCard } from "./workspace_ui";
import type {
  AthleteLevel,
  CheckInCadence,
  CoachCadence,
  ConditioningPriority,
  EcosystemPlanCard,
  GoalFocus,
  PhaseType,
} from "./ecosystem_planning";

type ThemeMode = "light" | "dark";
type UserMode = "athlete" | "coach";
type ScheduleViewMode = "week" | "month";
export type SettingsSection = "account" | "workspace" | "setup" | "notifications" | "privacy" | "advanced" | "data";
type AccountStatusTone = "info" | "success" | "warning";
type DataDisclosureKey =
  | "liveBackend"
  | "productionTrust"
  | "syncLedger"
  | "conflictPolicy"
  | "productionAdapters"
  | "membershipAdapter"
  | "notificationDelivery"
  | "readinessContracts";
type AdvancedEditors = {
  nutrition: boolean;
  nutritionControls: boolean;
  compounds: boolean;
  split: boolean;
  tracker: boolean;
  schedule: boolean;
};

type SetupReadinessItem = {
  label: string;
  title: string;
  detail: string;
  complete: boolean;
};

type SettingsPanelProps = {
  appTheme: ThemeMode;
  setAppTheme: (value: ThemeMode) => void;
  userMode: UserMode;
  setUserMode: (value: UserMode) => void;
  selfManagedAthlete: boolean;
  setSelfManagedAthlete: (value: boolean) => void;
  showBuilderTools: boolean;
  setShowBuilderTools: React.Dispatch<React.SetStateAction<boolean>>;
  scheduleViewMode: ScheduleViewMode;
  setScheduleViewMode: (value: ScheduleViewMode) => void;
  showAdvancedEditors: AdvancedEditors;
  updateAdvancedEditor: (key: keyof AdvancedEditors, value: boolean) => void;
  athleteName: string;
  setAthleteName: (value: string) => void;
  profileHeight: number;
  setProfileHeight: (value: number) => void;
  profileBodyFat: number;
  setProfileBodyFat: (value: number) => void;
  athleteLevel: AthleteLevel;
  setAthleteLevel: (value: AthleteLevel) => void;
  phaseType: PhaseType;
  setPhaseType: (value: PhaseType) => void;
  goalFocus: GoalFocus;
  setGoalFocus: (value: GoalFocus) => void;
  conditioningPriority: ConditioningPriority;
  setConditioningPriority: (value: ConditioningPriority) => void;
  checkInCadence: CheckInCadence;
  setCheckInCadence: (value: CheckInCadence) => void;
  coachCadence: CoachCadence;
  setCoachCadence: (value: CoachCadence) => void;
  targetStageWeightLb: number;
  setTargetStageWeightLb: (value: number) => void;
  phasePlanCards: readonly EcosystemPlanCard[];
  setupReadinessItems: readonly SetupReadinessItem[];
  athleteLevelOptions: readonly { value: AthleteLevel; label: string }[];
  phaseTypeOptions: readonly { value: PhaseType; label: string }[];
  goalFocusOptions: readonly { value: GoalFocus; label: string }[];
  conditioningPriorityOptions: readonly { value: ConditioningPriority; label: string }[];
  checkInCadenceOptions: readonly { value: CheckInCadence; label: string }[];
  coachCadenceOptions: readonly { value: CoachCadence; label: string }[];
  accountProfile: BodyPilotAccount;
  accountStatusMessage: string;
  accountStatusTone: AccountStatusTone;
  notificationPreferences: NotificationPreferences;
  notificationReminderSchedule: readonly NotificationReminderScheduleItem[];
  backendReadinessItems: readonly LaunchReadinessItem[];
  foodReadinessItems: readonly LaunchReadinessItem[];
  productionTrustSignals: readonly ProductionTrustSignal[];
  liveBackendConnectors: readonly LiveBackendConnector[];
  productionAdapterContracts: readonly ProductionAdapterContract[];
  membershipAdapterCapabilities: readonly MembershipAdapterCapability[];
  notificationDeliveryContracts: readonly NotificationDeliveryContract[];
  syncLedgerEvents: readonly SyncLedgerEvent[];
  syncConflictPolicies: readonly SyncConflictPolicy[];
  onUpdateAccountProfile: (patch: Partial<BodyPilotAccount>) => void;
  onSignIn: (input: BodyPilotCredentials) => void;
  onCreateAccount: (input: BodyPilotCreateAccountInput) => void;
  onRequestPasswordReset: (email: string) => void;
  onVerifyEmail: () => void;
  onSignOut: () => void;
  onDeleteAccount: (email: string) => void;
  notificationPermission: NotificationPermission | "unsupported";
  notificationStatusMessage: string;
  onRequestNotificationPermission: () => void;
  onUpdateNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
  isOnline: boolean;
  lastSavedAt: string | null;
  lastBackupExportedAt: string | null;
  storageIssue: string | null;
  onExportData: () => void;
  onImportData: (file: File | null) => void;
  backupRestorePreview: BackupRestorePreview | null;
  onConfirmImportData: () => void;
  onCancelImportData: () => void;
  onResetLocalData: () => void;
  sectionIntent?: {
    section: SettingsSection;
    nonce: number;
  };
  onClose: () => void;
};

const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-500/20";

const resourceLinkClass =
  "mt-3 inline-flex h-8 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-3 text-xs font-medium tracking-[0.01em] text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-slate-900";
const accountStatusToneClass: Record<AccountStatusTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100",
};

const reminderStatusClass: Record<NotificationReminderScheduleItem["status"], string> = {
  armed: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100",
  waiting: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-100",
  blocked: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100",
  off: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
};

const reminderStatusLabel: Record<NotificationReminderScheduleItem["status"], string> = {
  armed: "Armed",
  waiting: "Waiting",
  blocked: "Blocked",
  off: "Off",
};

const productionTrustStatusClass: Record<ProductionTrustSignal["status"], string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100",
  local: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100",
  attention: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100",
  blocked: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-100",
};

const productionTrustStatusLabel: Record<ProductionTrustSignal["status"], string> = {
  ready: "Ready",
  local: "Local",
  attention: "Check",
  blocked: "Blocked",
};

const backupRestorePreviewStatusClass: Record<BackupRestorePreview["status"], string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100",
  blocked: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-100",
};

const backupRestorePreviewStatusLabel: Record<BackupRestorePreview["status"], string> = {
  ready: "Ready",
  warning: "Review",
  blocked: "Blocked",
};

const backupRestoreDiffStatusClass: Record<BackupRestorePreview["diffs"][number]["status"], string> = {
  same: "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300",
  gain: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100",
  loss: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-100",
  change: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100",
};

const sectionCopy: Record<SettingsSection, { title: string; description: string }> = {
  account: {
    title: "Account",
    description: "Identity, role, sign-in state, and cloud-readiness controls live here.",
  },
  workspace: {
    title: "Workspace",
    description: "Daily controls live here: mode, shell visibility, theme, and the default weekly view.",
  },
  setup: {
    title: "Athlete setup",
    description: "This is the planning spine: profile details, prep context, and cadence defaults.",
  },
  advanced: {
    title: "Advanced tools",
    description: "Expose deeper editors only when the working flow truly needs them.",
  },
  notifications: {
    title: "Notifications",
    description: "Useful reminders only: food, weight, training, check-ins, plan updates, and schedule alerts.",
  },
  privacy: {
    title: "Privacy",
    description: "Data rights, support, safety scope, permissions, and trust controls.",
  },
  data: {
    title: "Data",
    description: "Backup, import, sync status, food-provider readiness, and local reset controls.",
  },
};

const resolveInitialSettingsSection = (): SettingsSection => {
  if (typeof window === "undefined") return "account";
  const requested = new URLSearchParams(window.location.search).get("settingsSection");
  return requested && requested in sectionCopy ? (requested as SettingsSection) : "account";
};

const formatSettingsSaveTime = (value: string | null): string => {
  if (!value) return "Waiting for first save.";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Saved locally.";
  return `Last saved ${parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
};

const formatSettingsBackupTime = (value: string | null): string => {
  if (!value) return "No backup exported.";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Backup exported.";
  return `Exported ${parsed.toLocaleDateString([], { month: "short", day: "numeric" })} at ${parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}.`;
};

const readinessStatusLabel = (status: LaunchReadinessItem["status"]) => {
  if (status === "adapter-needed") return "Configured";
  if (status === "local-fallback") return "Local";
  return "Ready";
};

const createInitialDataDisclosureState = (): Record<DataDisclosureKey, boolean> => {
  const defaultOpen =
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 768px)").matches;

  return {
    liveBackend: defaultOpen,
    productionTrust: defaultOpen,
    syncLedger: defaultOpen,
    conflictPolicy: defaultOpen,
    productionAdapters: defaultOpen,
    membershipAdapter: defaultOpen,
    notificationDelivery: defaultOpen,
    readinessContracts: defaultOpen,
  };
};

const SettingRow = (props: {
  title: string;
  description: string;
  control: React.ReactNode;
}) => {
  const { title, description, control } = props;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</div>
      </div>
      <div className="sm:shrink-0">{control}</div>
    </div>
  );
};

const SettingsIntro = (props: {
  title: string;
  description: string;
  tone?: "slate" | "amber";
}) => {
  const { title, description, tone = "slate" } = props;
  const className =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100"
      : "border-slate-200 bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{description}</p>
    </div>
  );
};

const DataDisclosureSection = (props: {
  id: string;
  title: string;
  description: string;
  summary: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  const { id, title, description, summary, open, onToggle, children } = props;
  const contentId = `settings-data-${id}`;

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <button
        type="button"
        className="flex w-full flex-col gap-3 px-4 py-4 text-left sm:flex-row sm:items-start sm:justify-between"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {summary}
          <ChevronDown
            className={`h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <div id={contentId} className="border-t border-slate-200 px-4 py-4 dark:border-white/10">
          {children}
        </div>
      ) : null}
    </section>
  );
};

export default function SettingsPanel(props: SettingsPanelProps) {
  const {
    appTheme,
    setAppTheme,
    userMode,
    setUserMode,
    selfManagedAthlete,
    setSelfManagedAthlete,
    showBuilderTools,
    setShowBuilderTools,
    scheduleViewMode,
    setScheduleViewMode,
    showAdvancedEditors,
    updateAdvancedEditor,
    athleteName,
    setAthleteName,
    profileHeight,
    setProfileHeight,
    profileBodyFat,
    setProfileBodyFat,
    athleteLevel,
    setAthleteLevel,
    phaseType,
    setPhaseType,
    goalFocus,
    setGoalFocus,
    conditioningPriority,
    setConditioningPriority,
    checkInCadence,
    setCheckInCadence,
    coachCadence,
    setCoachCadence,
    targetStageWeightLb,
    setTargetStageWeightLb,
    phasePlanCards,
    setupReadinessItems,
    athleteLevelOptions,
    phaseTypeOptions,
    goalFocusOptions,
    conditioningPriorityOptions,
    checkInCadenceOptions,
    coachCadenceOptions,
    accountProfile,
    accountStatusMessage,
    accountStatusTone,
    notificationPreferences,
    notificationReminderSchedule,
    backendReadinessItems,
    foodReadinessItems,
    productionTrustSignals,
    liveBackendConnectors,
    productionAdapterContracts,
    membershipAdapterCapabilities,
    notificationDeliveryContracts,
    syncLedgerEvents,
    syncConflictPolicies,
    onUpdateAccountProfile,
    onSignIn,
    onCreateAccount,
    onRequestPasswordReset,
    onVerifyEmail,
    onSignOut,
    onDeleteAccount,
    notificationPermission,
    notificationStatusMessage,
    onRequestNotificationPermission,
    onUpdateNotificationPreference,
    isOnline,
    lastSavedAt,
    lastBackupExportedAt,
    storageIssue,
    onExportData,
    onImportData,
    backupRestorePreview,
    onConfirmImportData,
    onCancelImportData,
    onResetLocalData,
    sectionIntent,
    onClose,
  } = props;
  const [activeSection, setActiveSection] = React.useState<SettingsSection>(resolveInitialSettingsSection);
  const [resetArmed, setResetArmed] = React.useState(false);
  const [deleteAccountArmed, setDeleteAccountArmed] = React.useState(false);
  const [accountDraft, setAccountDraft] = React.useState({
    email: accountProfile.email,
    displayName: accountProfile.displayName,
    role: accountProfile.role,
    password: "",
    confirmPassword: "",
  });
  const [accountFormMessage, setAccountFormMessage] = React.useState("");
  const [openDataSections, setOpenDataSections] = React.useState(createInitialDataDisclosureState);
  const liveBackendReadyCount = liveBackendConnectors.filter((item) => item.status === "ready").length;
  const liveBackendBlockedCount = liveBackendConnectors.filter((item) => item.status === "blocked").length;
  const liveBackendAttentionCount = liveBackendConnectors.filter((item) => item.status === "attention").length;
  const syncLedgerReadyCount = syncLedgerEvents.filter((item) => item.status === "ready").length;
  const syncLedgerAttentionCount = syncLedgerEvents.filter((item) => item.status === "attention" || item.status === "blocked").length;
  const syncLedgerLocalCount = syncLedgerEvents.filter((item) => item.status === "local").length;
  const syncConflictReadyCount = syncConflictPolicies.filter((item) => item.status === "ready").length;
  const syncConflictAttentionCount = syncConflictPolicies.filter((item) => item.status === "attention" || item.status === "blocked").length;
  const productionAdapterReadyCount = productionAdapterContracts.filter((item) => item.status === "ready").length;
  const productionAdapterAttentionCount = productionAdapterContracts.filter(
    (item) => item.status === "attention" || item.status === "blocked"
  ).length;
  const membershipAdapterLocalCount = membershipAdapterCapabilities.filter((item) => item.status === "local").length;
  const membershipAdapterAttentionCount = membershipAdapterCapabilities.filter(
    (item) => item.status === "attention" || item.status === "blocked"
  ).length;
  const notificationDeliveryAttentionCount = notificationDeliveryContracts.filter(
    (item) => item.status === "attention" || item.status === "blocked"
  ).length;
  const notificationDeliveryLocalCount = notificationDeliveryContracts.filter((item) => item.status === "local").length;

  const toggleDataSection = React.useCallback((key: DataDisclosureKey) => {
    setOpenDataSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  React.useEffect(() => {
    if (activeSection !== "data") setResetArmed(false);
    if (activeSection !== "account" && activeSection !== "privacy") setDeleteAccountArmed(false);
  }, [activeSection]);

  React.useEffect(() => {
    if (!sectionIntent) return;
    setActiveSection(sectionIntent.section);
  }, [sectionIntent?.nonce, sectionIntent?.section]);

  React.useEffect(() => {
    setAccountDraft({
      email: accountProfile.email,
      displayName: accountProfile.displayName,
      role: accountProfile.role,
      password: "",
      confirmPassword: "",
    });
  }, [accountProfile.displayName, accountProfile.email, accountProfile.role]);

  const enabledAdvancedCount = Object.values(showAdvancedEditors).filter(Boolean).length;
  const setupCompleteCount = setupReadinessItems.filter((item) => item.complete).length;
  const activeCopy = sectionCopy[activeSection];
  const ownershipFrame =
    userMode === "coach"
      ? {
          title: "Coach-owned planning",
          description: "Coach mode owns diagnosis, calendar edits, builder depth, and publishing. Athlete-facing surfaces should stay execution-first.",
          chips: ["Diagnose", "Plan", "Publish"],
          tone: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-100",
        }
      : selfManagedAthlete
        ? {
            title: "Self-managed athlete",
            description: "This athlete can edit food and training details, but the default workflow should still start from Today, Food, and Training.",
            chips: ["Execute", "Light edit", "Review"],
            tone: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100",
          }
        : {
            title: "Guided athlete",
            description: "Athlete mode is execution-first. Planning-heavy routes and builder controls stay out of the daily path.",
            chips: ["Execute", "Acknowledge", "Update"],
            tone: "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-500/20 dark:bg-cyan-950/20 dark:text-cyan-100",
          };
  const notificationPermissionLabel =
    notificationPermission === "unsupported"
      ? "Unsupported"
      : notificationPermission === "granted"
        ? "Enabled"
        : notificationPermission === "denied"
          ? "Blocked"
          : "Not enabled";
  const notificationPermissionDetail =
    notificationPermission === "unsupported"
      ? "This browser cannot receive push notifications."
      : notificationPermission === "granted"
        ? selfManagedAthlete
          ? "BodyPilot can send useful reminders for food, weight, training, check-ins, plan updates, and schedule items."
          : "BodyPilot can send useful reminders for food, weight, training, check-ins, coach updates, and schedule items."
        : notificationPermission === "denied"
          ? "Notifications are blocked in browser settings. Keep email enabled as the fallback channel."
          : selfManagedAthlete
            ? "Enable permission only if you want food, weight, training, check-in, plan, and schedule reminders on this device."
            : "Enable permission only if you want food, weight, training, check-in, coach, and schedule reminders on this device.";
  const armedReminderCount = notificationReminderSchedule.filter((item) => item.status === "armed").length;
  const blockedReminderCount = notificationReminderSchedule.filter((item) => item.status === "blocked").length;
  const enabledReminderCount = notificationReminderSchedule.filter((item) => item.status !== "off").length;
  const syncStatusDescription = storageIssue
    ?? `${isOnline ? "Online" : "Offline-ready"} - ${formatSettingsSaveTime(lastSavedAt)}`;
  const backupStatusDescription = formatSettingsBackupTime(lastBackupExportedAt);
  const deletionEmail = accountDraft.email.trim() || accountProfile.email.trim();
  const canRequestAccountDeletion = Boolean(deletionEmail) || accountProfile.status !== "signed-out";
  const legalResourceCards = [
    {
      title: "Privacy policy",
      detail: "What BodyPilot stores, what stays local, and how user data is handled.",
      action: "Open policy",
      href: "/privacy.html",
    },
    {
      title: "Privacy choices",
      detail: "Export, restore, delete, notification consent, and support request paths.",
      action: "Manage choices",
      href: "/privacy-choices.html",
    },
    {
      title: "Terms",
      detail: "Account, coaching, acceptable-use, subscription, and safety terms.",
      action: "Open terms",
      href: "/terms.html",
    },
    {
      title: "Support",
      detail: "Account help, coaching support, recovery IDs, and privacy requests.",
      action: "Contact support",
      href: "/support.html",
    },
  ] as const;
  const privacyDataTypes = [
    {
      label: "Health and fitness",
      detail: "Food, macros, training, check-ins, recovery, bodyweight, photos, and notes are treated as sensitive user-provided fitness data.",
      status: "User controlled",
    },
    {
      label: "Account contact",
      detail: "Email, display name, role, and local sign-in state support account setup, deletion, and coach-client identity.",
      status: accountProfile.email ? "Configured" : "Optional",
    },
    {
      label: "Coaching activity",
      detail: "Plan versions, coach messages, delivery receipts, client invites, and review trails are stored to preserve coaching continuity.",
      status: "Functional",
    },
    {
      label: "Device storage",
      detail: "The current build stores data locally on this device unless the user exports a backup or contacts support.",
      status: lastSavedAt ? "Active" : "Waiting",
    },
  ] as const;
  const trustControls = [
    {
      title: "Export before deleting",
      detail: backupStatusDescription,
      action: "Export backup",
      onClick: onExportData,
      icon: Download,
    },
    {
      title: "Review local data",
      detail: syncStatusDescription,
      action: "Open data",
      onClick: () => setActiveSection("data"),
      icon: Cloud,
    },
    {
      title: "Notification consent",
      detail: notificationStatusMessage || notificationPermissionDetail,
      action: "Open alerts",
      onClick: () => setActiveSection("notifications"),
      icon: Bell,
    },
  ] as const;
  const createAccountFromDraft = () => {
    if (accountDraft.password !== accountDraft.confirmPassword) {
      setAccountFormMessage("Passwords do not match.");
      return;
    }

    setAccountFormMessage("");
    onCreateAccount({
      email: accountDraft.email,
      password: accountDraft.password,
      displayName: accountDraft.displayName,
      role: accountDraft.role,
    });
  };
  const signInFromDraft = () => {
    setAccountFormMessage("");
    onSignIn({
      email: accountDraft.email,
      password: accountDraft.password,
    });
  };
  const requestAccountDeletion = () => {
    if (!canRequestAccountDeletion) {
      setAccountFormMessage("Enter the account email first, then request deletion.");
      return;
    }

    if (!deleteAccountArmed) {
      setDeleteAccountArmed(true);
      setAccountFormMessage("Deletion is permanent. Export a backup first if you want a portable copy.");
      return;
    }

    setAccountFormMessage("");
    onDeleteAccount(deletionEmail);
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[1180px]">
        <SectionCard
          title="Settings"
          description={activeCopy.description}
          right={(
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="mr-1.5 h-4 w-4" />
              Close
            </Button>
          )}
        >
          <div className="space-y-4">
            <div className="hidden gap-3 sm:grid sm:grid-cols-3">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Mode</div>
                <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {userMode === "coach" ? "Coach workspace" : "Athlete workspace"}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {userMode === "coach" ? "Review and publish." : selfManagedAthlete ? "Self-managed editing." : "Guided daily flow."}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Shell</div>
                <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {showBuilderTools ? "Builder tools visible" : "Core shell only"}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Default weekly view: {scheduleViewMode}.
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Advanced</div>
                <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {enabledAdvancedCount} editor{enabledAdvancedCount === 1 ? "" : "s"} enabled
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Stack tools are {showAdvancedEditors.compounds ? "visible" : "hidden"}.
                </div>
              </div>
            </div>

            <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as SettingsSection)}>
              <TabsList className="grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-3 lg:grid-cols-7">
                {(Object.keys(sectionCopy) as SettingsSection[]).map((section) => (
                  <TabsTrigger key={section} value={section} className="w-full">
                    {sectionCopy[section].title}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="account" className="mt-4 space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <BodyPilotLogo size="sm" />
                    <div className="grid gap-2 sm:text-right">
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">
                        {accountProfile.status === "signed-in"
                          ? "Signed in"
                          : accountProfile.status === "email-unverified"
                            ? "Verify email"
                            : "Signed out"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {accountProfile.subscriptionTier.toUpperCase()} plan
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Email</div>
                      <div className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {accountProfile.email || "Not connected"}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Role</div>
                      <div className="mt-1 text-sm font-semibold capitalize leading-5 text-slate-950 dark:text-slate-100">
                        {accountProfile.role.replace(/-/g, " ")}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Sync</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {accountProfile.lastSyncedAt ? "Ready" : "Local first"}
                      </div>
                    </div>
                  </div>

                  {accountStatusMessage ? (
                    <div className={`mt-4 rounded-[18px] border px-3 py-3 text-sm ${accountStatusToneClass[accountStatusTone]}`}>
                      {accountStatusMessage}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</div>
                    <Input
                      value={accountDraft.email}
                      onChange={(event) => setAccountDraft((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="you@bodypilot.app"
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Display name</div>
                    <Input
                      value={accountDraft.displayName}
                      onChange={(event) => setAccountDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                      placeholder="Athlete name"
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</div>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={accountDraft.password}
                      onChange={(event) => setAccountDraft((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="8+ characters"
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirm password</div>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={accountDraft.confirmPassword}
                      onChange={(event) => setAccountDraft((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                      placeholder="For new accounts"
                    />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Account role</div>
                    <select
                      className={fieldClass}
                      value={accountDraft.role}
                      onChange={(event) =>
                        setAccountDraft((prev) => ({ ...prev, role: event.target.value as BodyPilotRole }))
                      }
                    >
                      <option value="self-managed-athlete">Self-managed athlete</option>
                      <option value="coached-athlete">Coached athlete</option>
                      <option value="coach">Coach</option>
                    </select>
                  </label>
                </div>

                {accountFormMessage ? (
                  <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                    {accountFormMessage}
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Button onClick={createAccountFromDraft}>
                    <UserRound className="mr-2 h-4 w-4" />
                    Create
                  </Button>
                  <Button variant="outline" onClick={signInFromDraft}>
                    Sign in
                  </Button>
                  <Button variant="outline" onClick={() => onRequestPasswordReset(accountDraft.email)}>
                    Reset password
                  </Button>
                  <Button
                    variant="outline"
                    disabled={accountProfile.status !== "email-unverified"}
                    onClick={onVerifyEmail}
                  >
                    <MailCheck className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                </div>

                {accountProfile.status !== "signed-out" ? (
                  <SettingRow
                    title="Profile details"
                    description="Keep profile display and role metadata aligned with the current workspace."
                    control={(
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onUpdateAccountProfile({
                              email: accountDraft.email.trim().toLowerCase(),
                              displayName: accountDraft.displayName.trim() || accountProfile.displayName,
                              role: accountDraft.role,
                            })
                          }
                        >
                          Save profile
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onSignOut}>
                          <LogOut className="mr-1.5 h-4 w-4" />
                          Sign out
                        </Button>
                      </div>
                    )}
                  />
                ) : null}

                <div className="rounded-[22px] border border-rose-200 bg-rose-50/80 p-4 shadow-sm dark:border-rose-500/25 dark:bg-rose-950/25">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-rose-950 dark:text-rose-100">
                        <Trash2 className="h-4 w-4" />
                        Delete account and data
                      </div>
                      <p className="mt-1 text-sm leading-6 text-rose-800 dark:text-rose-100/80">
                        Permanently removes the local account record, coach-client links, and saved workspace data from this device.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-rose-700 dark:text-rose-100/70">
                        Account email: {deletionEmail || "enter one above"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <Button size="sm" variant="outline" className="min-h-11 border-rose-300 bg-white text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-100" onClick={requestAccountDeletion}>
                        {deleteAccountArmed ? "Confirm deletion" : "Delete account"}
                      </Button>
                      {deleteAccountArmed ? (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteAccountArmed(false)}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {legalResourceCards.map(({ title, detail, action, href }) => (
                    <div key={title} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{detail}</div>
                      <a className={resourceLinkClass} href={href}>
                        {action}
                      </a>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="workspace" className="mt-4 space-y-4">
                <SettingsIntro
                  title="Workspace controls"
                  description="Keep this area focused on how the app behaves today, not on deeper planning configuration."
                />

                <div className={`rounded-[22px] border px-4 py-4 ${ownershipFrame.tone}`}>
                  <div className="text-sm font-semibold">{ownershipFrame.title}</div>
                  <p className="mt-2 text-sm leading-6">{ownershipFrame.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ownershipFrame.chips.map((chip) => (
                      <span key={chip} className="rounded-full border border-current/20 bg-white/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] dark:bg-white/10">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAppTheme("light")}
                    className={[
                      "rounded-[22px] border p-4 text-left transition-colors duration-200",
                      appTheme === "light"
                        ? "border-slate-900 bg-white shadow-sm dark:border-slate-100"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Bright neutral surfaces for quick review and day-to-day use.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppTheme("dark")}
                    className={[
                      "rounded-[22px] border p-4 text-left transition-colors duration-200",
                      appTheme === "dark"
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-slate-100"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                    <div className={["mt-2 text-sm leading-6", appTheme === "dark" ? "text-white/78" : "text-slate-600 dark:text-slate-300"].join(" ")}>
                      Lower-glare contrast for longer planning or later-night review.
                    </div>
                  </button>
                </div>

                <SettingRow
                  title="Workspace owner"
                  description="Switch the whole app between athlete execution and coach review/publish responsibilities."
                  control={(
                    <div className="flex gap-2">
                      <Button size="sm" variant={userMode === "athlete" ? "default" : "outline"} onClick={() => setUserMode("athlete")}>
                        Athlete
                      </Button>
                      <Button size="sm" variant={userMode === "coach" ? "default" : "outline"} onClick={() => setUserMode("coach")}>
                        Coach
                      </Button>
                    </div>
                  )}
                />

                <SettingRow
                  title="Athlete self-management"
                  description="When this is on, athlete mode can make deliberate food and training edits. When off, athlete mode stays guided and execution-first."
                  control={<Switch checked={selfManagedAthlete} onCheckedChange={setSelfManagedAthlete} />}
                />

                <SettingRow
                  title="Show builder tools"
                  description="Expose deeper design modules for self-managed or coach work. Keep this off when the daily shell should stay minimal."
                  control={<Switch checked={showBuilderTools} onCheckedChange={(value) => setShowBuilderTools(value)} />}
                />

                <SettingRow
                  title="Default weekly view"
                  description="Choose whether the week surface opens in week or month mode."
                  control={(
                    <div className="flex gap-2">
                      <Button size="sm" variant={scheduleViewMode === "week" ? "default" : "outline"} onClick={() => setScheduleViewMode("week")}>
                        Week
                      </Button>
                      <Button size="sm" variant={scheduleViewMode === "month" ? "default" : "outline"} onClick={() => setScheduleViewMode("month")}>
                        Month
                      </Button>
                    </div>
                  )}
                />
              </TabsContent>

              <TabsContent value="setup" className="mt-4 space-y-4">
                <SettingsIntro
                  title="Planning spine"
                  description="Use this section for athlete context and cadence defaults. These settings shape the plan, but they should not compete with the daily shell controls."
                />

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">Setup readiness</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {setupCompleteCount}/{setupReadinessItems.length} essentials complete
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
                      {setupCompleteCount === setupReadinessItems.length ? "Ready" : "Needs input"}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {setupReadinessItems.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                        <div>
                          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                          <div className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.detail}</div>
                        </div>
                        <span className={item.complete ? "text-xs font-semibold text-emerald-600 dark:text-emerald-300" : "text-xs font-semibold text-amber-600 dark:text-amber-300"}>
                          {item.complete ? "Done" : "Set"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {phasePlanCards.map((card) => (
                    <div key={`${card.label}-${card.title}`} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{card.label}</div>
                      <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{card.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.detail}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Athlete name</div>
                    <Input value={athleteName} onChange={(event) => setAthleteName(event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Height (in)</div>
                    <Input type="number" value={profileHeight} onChange={(event) => setProfileHeight(Number(event.target.value) || 0)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Body fat %</div>
                    <Input type="number" value={profileBodyFat} onChange={(event) => setProfileBodyFat(Number(event.target.value) || 0)} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Athlete level</div>
                    <select className={fieldClass} value={athleteLevel} onChange={(event) => setAthleteLevel(event.target.value as AthleteLevel)}>
                      {athleteLevelOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Phase</div>
                    <select className={fieldClass} value={phaseType} onChange={(event) => setPhaseType(event.target.value as PhaseType)}>
                      {phaseTypeOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Goal focus</div>
                    <select className={fieldClass} value={goalFocus} onChange={(event) => setGoalFocus(event.target.value as GoalFocus)}>
                      {goalFocusOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Conditioning priority</div>
                    <select className={fieldClass} value={conditioningPriority} onChange={(event) => setConditioningPriority(event.target.value as ConditioningPriority)}>
                      {conditioningPriorityOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Check-in cadence</div>
                    <select className={fieldClass} value={checkInCadence} onChange={(event) => setCheckInCadence(event.target.value as CheckInCadence)}>
                      {checkInCadenceOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Coach review cadence</div>
                    <select className={fieldClass} value={coachCadence} onChange={(event) => setCoachCadence(event.target.value as CoachCadence)}>
                      {coachCadenceOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Target stage / endpoint weight (lb)</div>
                    <Input type="number" value={targetStageWeightLb} onChange={(event) => setTargetStageWeightLb(Number(event.target.value) || 0)} />
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-4 space-y-4">
                <SettingsIntro
                  title="Reminder strategy"
                  description="BodyPilot should remind users to close the loop, not nag them. Keep push and email useful, quiet, and tied to real plan state."
                />

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        <Bell className="h-4 w-4" />
                        Mobile permission
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {notificationPermissionDetail}
                      </div>
                      {notificationStatusMessage ? (
                        <div className="mt-2 rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                          {notificationStatusMessage}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                        {notificationPermissionLabel}
                      </span>
                      <Button
                        size="sm"
                        disabled={
                          notificationPermission === "granted"
                          || notificationPermission === "unsupported"
                          || notificationPermission === "denied"
                        }
                        onClick={onRequestNotificationPermission}
                      >
                        {notificationPermission === "granted"
                          ? "Enabled"
                          : notificationPermission === "denied"
                            ? "Blocked"
                            : "Enable"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Today's reminder plan
                      </div>
                      <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        These are local rules tied to real gaps. Push or email delivery still depends on the channel state above.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100">
                        {armedReminderCount} armed
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-100">
                        {enabledReminderCount} enabled
                      </span>
                      {blockedReminderCount > 0 ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                          {blockedReminderCount} blocked
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {notificationReminderSchedule.map((item) => (
                      <div key={item.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                {item.label}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${reminderStatusClass[item.status]}`}>
                                {reminderStatusLabel[item.status]}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                              {item.title}
                            </div>
                            <div className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                              {item.detail}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 sm:max-w-[13rem]">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.delivery}</div>
                            <div>{item.trigger}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SettingRow
                    title="Push notifications"
                    description="Mobile push channel for timely food, weight, training, and plan alerts."
                    control={
                      <Switch
                        checked={notificationPreferences.pushEnabled}
                        onCheckedChange={(value) => onUpdateNotificationPreference("pushEnabled", value)}
                      />
                    }
                  />
                  <SettingRow
                    title="Email notifications"
                    description="Email channel for verification, password reset, coach updates, and weekly summaries."
                    control={
                      <Switch
                        checked={notificationPreferences.emailEnabled}
                        onCheckedChange={(value) => onUpdateNotificationPreference("emailEnabled", value)}
                      />
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Quiet hours start</div>
                    <Input
                      type="time"
                      value={notificationPreferences.quietHoursStart}
                      onChange={(event) => onUpdateNotificationPreference("quietHoursStart", event.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Quiet hours end</div>
                    <Input
                      type="time"
                      value={notificationPreferences.quietHoursEnd}
                      onChange={(event) => onUpdateNotificationPreference("quietHoursEnd", event.target.value)}
                    />
                  </label>
                </div>

                <div className="grid gap-3">
                  {([
                    ["logFoodReminder", "Log food", "Reminder if the food log is still empty or a planned meal has not been logged."],
                    ["bodyweightReminder", "Bodyweight", "Morning reminder when trend data needs another weigh-in."],
                    ["trainingReminder", "Training", "Prompt before the scheduled session and follow-up if lifts are still open."],
                    ["closeoutReminder", "Daily closeout", "End-of-day reminder only when the day has not been closed."],
                    ["checkInReminder", "Check-in tasks", selfManagedAthlete ? "Reminder for photos, subjective markers, and review items." : "Reminder for photos, subjective markers, and coach review items."],
                    ...(!selfManagedAthlete ? [["coachUpdateAlert", "Coach updates", "Alert when a coach publishes direction or asks for clarification."] as const] : []),
                    ["planChangeAlert", "Plan changes", "Alert when nutrition, schedule, or training targets are updated."],
                    ["scheduleReminder", "Schedule", "Daily schedule nudge for sessions, cardio, check-ins, and events."],
                  ] as const).map(([key, title, description]) => (
                    <SettingRow
                      key={key}
                      title={title}
                      description={description}
                      control={
                        <Switch
                          checked={Boolean(notificationPreferences[key])}
                          onCheckedChange={(value) => onUpdateNotificationPreference(key, value)}
                        />
                      }
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="mt-4 space-y-4">
                <SettingsIntro
                  title="Trust and safety"
                  description="Privacy policy, support, account deletion, data export, consent, and health-scope boundaries should all be easy to find and act on."
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {legalResourceCards.map(({ title, detail, action, href }) => (
                    <a
                      key={title}
                      href={href}
                      className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-sky-200 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-sky-400/30"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {title === "Support" ? <LifeBuoy className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {title}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{detail}</div>
                      <div className="mt-3 text-xs font-semibold text-sky-700 dark:text-sky-200">{action}</div>
                    </a>
                  ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      <ShieldCheck className="h-4 w-4" />
                      Data collected in this version
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      BodyPilot handles sensitive physique, training, nutrition, and coaching data. The current build is local-first and should not be described as cloud synced until the production adapter is live.
                    </p>
                    <div className="mt-4 grid gap-2">
                      {privacyDataTypes.map((item) => (
                        <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.label}</div>
                              <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                            </div>
                            <span className="w-fit shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        <Cloud className="h-4 w-4" />
                        User controls
                      </div>
                      <div className="mt-3 grid gap-2">
                        {trustControls.map(({ title, detail, action, onClick, icon: Icon }) => (
                          <button
                            key={title}
                            type="button"
                            onClick={onClick}
                            className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-sky-400/30 dark:hover:bg-sky-950/20"
                          >
                            <div className="flex items-start gap-2">
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-200" />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{detail}</div>
                                <div className="mt-2 text-xs font-semibold text-sky-700 dark:text-sky-200">{action}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-rose-200 bg-rose-50/80 p-4 shadow-sm dark:border-rose-500/25 dark:bg-rose-950/25">
                      <div className="flex items-start gap-2 text-sm font-semibold text-rose-950 dark:text-rose-100">
                        <Trash2 className="mt-0.5 h-4 w-4 shrink-0" />
                        Delete account
                      </div>
                      <p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-100/80">
                        Removes the local account record and clears associated BodyPilot data from this device.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-11 border-rose-300 bg-white text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-100"
                          onClick={requestAccountDeletion}
                        >
                          {deleteAccountArmed ? "Confirm deletion" : "Delete account"}
                        </Button>
                        {deleteAccountArmed ? (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteAccountArmed(false)}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/25 dark:bg-amber-950/25">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
                      <AlertTriangle className="h-4 w-4" />
                      Health and coaching scope
                    </div>
                    <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100/80">
                      BodyPilot is for logging, planning, coaching context, and performance review. It is not medical advice, diagnosis, treatment, emergency guidance, or an automated dosing system.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-100/70">
                      Users should consult qualified healthcare professionals before changing training, nutrition, supplement, or compound protocols.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4 shadow-sm dark:border-sky-500/25 dark:bg-sky-950/25">
                    <div className="flex items-center gap-2 text-sm font-semibold text-sky-950 dark:text-sky-100">
                      <ShieldCheck className="h-4 w-4" />
                      Permissions and tracking
                    </div>
                    <div className="mt-3 grid gap-2 text-sm leading-6 text-sky-900 dark:text-sky-100/80">
                      <div>No ads, behavioral tracking, or third-party tracking SDKs are active in this build.</div>
                      <div>Notifications require explicit device permission and can be disabled in Settings.</div>
                      <div>Photo and backup files are selected by the user through file inputs; the app should not request broad photo-library access.</div>
                      <div>No in-app purchases are sold in this build. Any future paid digital coaching tier must disclose billing clearly before purchase.</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-4 space-y-4">
                <SettingsIntro
                  title="Progressive disclosure"
                  description="These toggles control depth, not capability. Hidden editors still exist; this section just keeps them from cluttering the default workflow."
                  tone="amber"
                />

                <div className="space-y-3">
                  {([
                    ["nutrition", "Meal builder"],
                    ["nutritionControls", "Food targets"],
                    ["tracker", "Today editor"],
                    ["schedule", "Calendar editor"],
                    ["split", "Training builder"],
                    ["compounds", "Stack tools"],
                  ] as const).map(([key, label]) => (
                    <SettingRow
                      key={key}
                      title={label}
                      description={
                        key === "compounds"
                          ? "Specialist surface. Leave this off unless the stack workflow genuinely matters."
                          : "Keep this editor available on the working surface when deeper control is needed."
                      }
                      control={<Switch checked={showAdvancedEditors[key]} onCheckedChange={(value) => updateAdvancedEditor(key, value)} />}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="data" className="mt-4 flex flex-col gap-4">
                <div className="order-1">
                  <SettingsIntro
                    title="Persistence and data"
                    description="Saved plans, logs, meals, and settings stay on this device today. Account, sync, notification, and food-provider responsibilities stay explicit."
                  />
                </div>

                <div className="order-3 space-y-4 md:order-2">
                  <DataDisclosureSection
                    id="live-backend"
                    title="Live backend connectors"
                    description="The production systems BodyPilot needs for accounts, sync, email, push, payments, webhooks, background jobs, privacy, and monitoring."
                    summary={(
                      <span className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                          {liveBackendReadyCount} ready
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                          {liveBackendAttentionCount} staged
                        </span>
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-rose-800 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-100">
                          {liveBackendBlockedCount} blocked
                        </span>
                      </span>
                    )}
                    open={openDataSections.liveBackend}
                    onToggle={() => toggleDataSection("liveBackend")}
                  >
                    <div className="grid gap-3 lg:grid-cols-2">
                      {liveBackendConnectors.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                {item.lane} / {item.owner}
                              </div>
                              <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.system}</div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[item.status]}`}>
                              {productionTrustStatusLabel[item.status]}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                            <div>
                              <div className="font-semibold text-slate-950 dark:text-slate-100">Current</div>
                              <div>{item.currentMode}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-950 dark:text-slate-100">Provider</div>
                              <div>{item.productionProvider}</div>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                            <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                              <div className="font-semibold text-slate-950 dark:text-slate-100">Endpoint</div>
                              <div className="break-words">{item.endpoint}</div>
                            </div>
                            <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                              <div className="font-semibold text-slate-950 dark:text-slate-100">Secret</div>
                              <div className="break-words">{item.secretName}</div>
                            </div>
                            <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                              <div className="font-semibold text-slate-950 dark:text-slate-100">Metric</div>
                              <div>{item.metric}</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.events}</div>
                          <div className="mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                            {item.launchRequirement}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DataDisclosureSection>

                  <DataDisclosureSection
                    id="production-trust"
                    title="Production trust"
                    description="What is saved, versioned, exportable, and still local-only."
                    summary={(
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                        {productionTrustSignals.filter((item) => item.status === "ready").length}/{productionTrustSignals.length} ready
                      </span>
                    )}
                    open={openDataSections.productionTrust}
                    onToggle={() => toggleDataSection("productionTrust")}
                  >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {productionTrustSignals.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                {item.label}
                              </div>
                              <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[item.status]}`}>
                              {productionTrustStatusLabel[item.status]}
                            </span>
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{item.metric}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </DataDisclosureSection>

                <DataDisclosureSection
                  id="sync-ledger"
                  title="Sync event ledger"
                  description="Recent saves, plan publishes, coach messages, food history, reviews, recovery imports, and backup actions."
                  summary={(
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                      {syncLedgerEvents.length} recent
                    </span>
                  )}
                  open={openDataSections.syncLedger}
                  onToggle={() => toggleDataSection("syncLedger")}
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{syncLedgerReadyCount}</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Ready</div>
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{syncLedgerLocalCount}</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Local only</div>
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{syncLedgerAttentionCount}</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Needs check</div>
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-[18px] border border-slate-200 dark:divide-white/10 dark:border-white/10">
                    {syncLedgerEvents.length > 0 ? (
                      syncLedgerEvents.map((event) => (
                        <div key={event.id} className="grid gap-3 bg-slate-50 px-3 py-3 dark:bg-white/[0.04] sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-start">
                          <div>
                            <div className="text-xs font-semibold text-slate-950 dark:text-slate-100">{event.occurredAtLabel}</div>
                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {event.source}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{event.title}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{event.detail}</div>
                          </div>
                          <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[event.status]}`}>
                            {event.statusLabel}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 px-3 py-4 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                        No ledger events yet. Save a log, publish a plan, export a backup, or send a coach message to start the audit trail.
                      </div>
                    )}
                  </div>
                </DataDisclosureSection>

                <DataDisclosureSection
                  id="conflict-policy"
                  title="Conflict policy"
                  description="What merges, what appends, and what must be reviewed before cloud sync can safely own it."
                  summary={(
                    <span className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                        {syncConflictReadyCount} ready
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                        {syncConflictAttentionCount} review
                      </span>
                    </span>
                  )}
                  open={openDataSections.conflictPolicy}
                  onToggle={() => toggleDataSection("conflictPolicy")}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    {syncConflictPolicies.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {item.area}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[item.status]}`}>
                            {productionTrustStatusLabel[item.status]}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Owner</div>
                            <div>{item.owner}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Source</div>
                            <div>{item.source}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Policy</div>
                            <div>{item.policy}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                        <div className="mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                          {item.conflictRule}
                        </div>
                      </div>
                    ))}
                  </div>
                </DataDisclosureSection>

                <DataDisclosureSection
                  id="production-adapters"
                  title="Production adapters"
                  description="Concrete backend boundaries for auth, sync, membership, notifications, and billing."
                  summary={(
                    <span className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                        {productionAdapterReadyCount} ready
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                        {productionAdapterAttentionCount} handoff
                      </span>
                    </span>
                  )}
                  open={openDataSections.productionAdapters}
                  onToggle={() => toggleDataSection("productionAdapters")}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    {productionAdapterContracts.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {item.system}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.productionAdapter}</div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[item.status]}`}>
                            {productionTrustStatusLabel[item.status]}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Current</div>
                            <div>{item.currentAdapter}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Metric</div>
                            <div>{item.metric}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.responsibility}</div>
                        <div className="mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                          {item.dataHandoff}
                        </div>
                      </div>
                    ))}
                  </div>
                </DataDisclosureSection>

                <DataDisclosureSection
                  id="membership-adapter"
                  title="Membership adapter"
                  description="Invite, accept, revoke, permission, and roster visibility states for coach-client relationships."
                  summary={(
                    <span className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-800 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100">
                        {membershipAdapterLocalCount} local
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                        {membershipAdapterAttentionCount} handoff
                      </span>
                    </span>
                  )}
                  open={openDataSections.membershipAdapter}
                  onToggle={() => toggleDataSection("membershipAdapter")}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    {membershipAdapterCapabilities.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {item.permissionScope}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.action}</div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[item.status]}`}>
                            {productionTrustStatusLabel[item.status]}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Current path</div>
                            <div>{item.currentPath}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Production path</div>
                            <div>{item.productionPath}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DataDisclosureSection>

                <DataDisclosureSection
                  id="notification-delivery"
                  title="Notification delivery"
                  description="Production handoff paths for invites, coach updates, plan changes, check-ins, closeouts, training, and food gaps."
                  summary={(
                    <span className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                        {notificationDeliveryAttentionCount} handoff
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                        {notificationDeliveryLocalCount} local
                      </span>
                    </span>
                  )}
                  open={openDataSections.notificationDelivery}
                  onToggle={() => toggleDataSection("notificationDelivery")}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    {notificationDeliveryContracts.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {item.audience}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.event}</div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${productionTrustStatusClass[item.status]}`}>
                            {productionTrustStatusLabel[item.status]}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Current trigger</div>
                            <div>{item.currentTrigger}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Production trigger</div>
                            <div>{item.productionTrigger}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Worker</div>
                            <div>{item.deliveryWorker}</div>
                          </div>
                          <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Channels</div>
                            <div>{item.channels}</div>
                          </div>
                        </div>
                        <div className="mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                          {item.receiptPolicy}
                        </div>
                      </div>
                    ))}
                  </div>
                </DataDisclosureSection>

                <DataDisclosureSection
                  id="readiness-contracts"
                  title="Backend and lifecycle contracts"
                  description="Provider boundaries, notification responsibilities, food data, and local fallback behavior."
                  summary={(
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                      {backendReadinessItems.length + foodReadinessItems.length} systems
                    </span>
                  )}
                  open={openDataSections.readinessContracts}
                  onToggle={() => toggleDataSection("readinessContracts")}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      <Cloud className="h-4 w-4" />
                      Backend systems
                    </div>
                    <div className="mt-3 grid gap-2">
                      {backendReadinessItems.map((item) => (
                        <div key={item.system} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.system}</div>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                              {readinessStatusLabel(item.status)}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      <Bell className="h-4 w-4" />
                      Food and lifecycle contracts
                    </div>
                    <div className="mt-3 grid gap-2">
                      {foodReadinessItems.map((item) => (
                        <div key={item.system} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.system}</div>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                              {readinessStatusLabel(item.status)}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>
                </DataDisclosureSection>
                </div>

                <div className="order-2 space-y-4 md:order-3">
                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">Local data controls</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Export a backup, stage a restore, or verify this device before trusting the workspace.
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]",
                        storageIssue
                          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100",
                      ].join(" ")}
                    >
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      {storageIssue ? "Check storage" : "Ready"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Save</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {lastSavedAt ? "Local save active" : "Waiting for save"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{formatSettingsSaveTime(lastSavedAt)}</div>
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Backup</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {lastBackupExportedAt ? "Portable copy exists" : "No export yet"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{backupStatusDescription}</div>
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Storage</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {storageIssue ? "Needs attention" : isOnline ? "Online + local" : "Offline-ready"}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{syncStatusDescription}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button size="sm" className="h-11 w-full sm:w-auto" onClick={onExportData}>
                      <Download className="mr-1.5 h-4 w-4" />
                      Export backup
                    </Button>
                    <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[16px] border border-slate-200 bg-white px-3 text-xs font-medium tracking-[0.01em] text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-within:ring-2 focus-within:ring-sky-300/70 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-slate-900 sm:w-auto">
                      <Upload className="mr-1.5 h-4 w-4" />
                      Import backup
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="sr-only"
                        onChange={(event) => {
                          onImportData(event.currentTarget.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <Button
                      size="sm"
                      variant={resetArmed ? "default" : "outline"}
                      className={[
                        "h-11 w-full sm:w-auto",
                        resetArmed
                          ? "border-rose-600 bg-rose-600 hover:border-rose-700 hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-500 dark:hover:border-rose-400 dark:hover:bg-rose-400"
                          : "",
                      ].join(" ")}
                      onClick={() => {
                        if (resetArmed) {
                          onResetLocalData();
                          return;
                        }
                        setResetArmed(true);
                      }}
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      {resetArmed ? "Reset now" : "Prepare reset"}
                    </Button>
                  </div>
                </div>

                {backupRestorePreview ? (
                  <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {backupRestorePreview.title}
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${backupRestorePreviewStatusClass[backupRestorePreview.status]}`}
                          >
                            {backupRestorePreviewStatusLabel[backupRestorePreview.status]}
                          </span>
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {backupRestorePreview.detail}
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="font-semibold text-slate-950 dark:text-slate-100">{backupRestorePreview.fileName}</div>
                            <div>{backupRestorePreview.fileSizeLabel}</div>
                          </div>
                          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Exported</div>
                            <div>{backupRestorePreview.exportedAtLabel}</div>
                          </div>
                          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Version</div>
                            <div>
                              Backup {backupRestorePreview.backupVersionLabel} / Envelope{" "}
                              {backupRestorePreview.dataEnvelopeVersionLabel}
                            </div>
                          </div>
                          <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="font-semibold text-slate-950 dark:text-slate-100">Sections</div>
                            <div>{backupRestorePreview.knownKeyCount} recognized</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <Button size="sm" variant="outline" onClick={onCancelImportData}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={backupRestorePreview.status === "blocked"}
                          onClick={onConfirmImportData}
                        >
                          Restore backup
                        </Button>
                      </div>
                    </div>

                    {backupRestorePreview.counts.length > 0 ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {backupRestorePreview.counts.map((item) => (
                          <div
                            key={`${item.label}-${item.detail}`}
                            className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                          >
                            <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{item.value}</div>
                            <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {item.label}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {backupRestorePreview.diffs.length > 0 ? (
                      <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">Change preview</div>
                          <div className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                            {backupRestorePreview.diffSummary}
                          </div>
                        </div>
                        <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-[16px] border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-slate-950">
                          {backupRestorePreview.diffs.map((item) => (
                            <div
                              key={`${item.label}-${item.detail}`}
                              className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_auto] sm:items-center"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{item.label}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</div>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold text-slate-950 dark:text-slate-100">{item.currentValue}</span>
                                <span className="ml-1 text-slate-500 dark:text-slate-400">now</span>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold text-slate-950 dark:text-slate-100">{item.backupValue}</span>
                                <span className="ml-1 text-slate-500 dark:text-slate-400">backup</span>
                              </div>
                              <span
                                className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${backupRestoreDiffStatusClass[item.status]}`}
                              >
                                {item.deltaLabel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {backupRestorePreview.warnings.length > 0 ? (
                      <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                        {backupRestorePreview.warnings.map((warning) => (
                          <div key={warning}>{warning}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
