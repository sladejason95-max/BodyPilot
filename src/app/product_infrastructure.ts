export type BodyPilotRole = "self-managed-athlete" | "coached-athlete" | "coach";
export type BodyPilotAccountStatus = "signed-out" | "email-unverified" | "signed-in";
export type BodyPilotSubscriptionTier = "starter" | "pro" | "coach";

export type BodyPilotAccount = {
  id: string;
  email: string;
  displayName: string;
  role: BodyPilotRole;
  status: BodyPilotAccountStatus;
  emailVerified: boolean;
  subscriptionTier: BodyPilotSubscriptionTier;
  createdAt: string;
  lastSyncedAt?: string;
};

export type NotificationPreferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  logFoodReminder: boolean;
  bodyweightReminder: boolean;
  trainingReminder: boolean;
  closeoutReminder: boolean;
  checkInReminder: boolean;
  coachUpdateAlert: boolean;
  planChangeAlert: boolean;
  scheduleReminder: boolean;
};

export type NotificationReminderStatus = "armed" | "waiting" | "blocked" | "off";

export type NotificationReminderScheduleItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  trigger: string;
  delivery: string;
  status: NotificationReminderStatus;
  preferenceKey: keyof NotificationPreferences;
};

export type LaunchReadinessStatus = "ready" | "adapter-needed" | "local-fallback";

export type LaunchReadinessItem = {
  system: string;
  status: LaunchReadinessStatus;
  detail: string;
};

export type ProductionTrustStatus = "ready" | "local" | "attention" | "blocked";

export type ProductionTrustSignal = {
  id: string;
  label: string;
  title: string;
  detail: string;
  metric: string;
  status: ProductionTrustStatus;
};

export type SyncLedgerEvent = {
  id: string;
  occurredAt: string;
  occurredAtLabel: string;
  source: string;
  title: string;
  detail: string;
  status: ProductionTrustStatus;
  statusLabel: string;
};

export type SyncConflictPolicy = {
  id: string;
  area: string;
  owner: string;
  source: string;
  policy: string;
  title: string;
  detail: string;
  conflictRule: string;
  status: ProductionTrustStatus;
};

export type ProductionAdapterContract = {
  id: string;
  system: string;
  currentAdapter: string;
  productionAdapter: string;
  responsibility: string;
  dataHandoff: string;
  metric: string;
  status: ProductionTrustStatus;
};

export type MembershipAdapterCapability = {
  id: string;
  action: string;
  currentPath: string;
  productionPath: string;
  permissionScope: string;
  status: ProductionTrustStatus;
};

export type NotificationDeliveryContract = {
  id: string;
  event: string;
  audience: string;
  currentTrigger: string;
  productionTrigger: string;
  deliveryWorker: string;
  channels: string;
  receiptPolicy: string;
  status: ProductionTrustStatus;
};

export type BackupRestorePreviewStatus = "ready" | "warning" | "blocked";

export type BackupRestorePreviewCount = {
  label: string;
  value: string;
  detail: string;
};

export type BackupRestoreDiffStatus = "same" | "gain" | "loss" | "change";

export type BackupRestorePreviewDiff = {
  label: string;
  detail: string;
  currentValue: string;
  backupValue: string;
  deltaLabel: string;
  status: BackupRestoreDiffStatus;
};

export type BackupRestorePreview = {
  fileName: string;
  fileSizeLabel: string;
  status: BackupRestorePreviewStatus;
  title: string;
  detail: string;
  exportedAtLabel: string;
  backupVersionLabel: string;
  dataEnvelopeVersionLabel: string;
  knownKeyCount: number;
  counts: BackupRestorePreviewCount[];
  diffs: BackupRestorePreviewDiff[];
  diffSummary: string;
  warnings: string[];
};

export const defaultBodyPilotAccount: BodyPilotAccount = {
  id: "local-athlete",
  email: "",
  displayName: "BodyPilot athlete",
  role: "self-managed-athlete",
  status: "signed-out",
  emailVerified: false,
  subscriptionTier: "pro",
  createdAt: new Date().toISOString(),
};

export const defaultNotificationPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  quietHoursStart: "21:30",
  quietHoursEnd: "07:00",
  logFoodReminder: true,
  bodyweightReminder: true,
  trainingReminder: true,
  closeoutReminder: true,
  checkInReminder: true,
  coachUpdateAlert: true,
  planChangeAlert: true,
  scheduleReminder: true,
};

export const bodyPilotBackendReadiness: LaunchReadinessItem[] = [
  {
    system: "Authentication",
    status: "adapter-needed",
    detail: "Email/password, verification, password reset, account deletion, token refresh, and session restore are modeled and ready for a backend provider.",
  },
  {
    system: "Cloud persistence",
    status: "local-fallback",
    detail: "The app saves locally today. The data envelope is centralized for cloud sync, conflict resolution, and account-scoped ownership.",
  },
  {
    system: "Runtime recovery",
    status: "ready",
    detail: "If a screen fails, BodyPilot keeps saved data intact and shows a branded reload/support path instead of a blank app.",
  },
  {
    system: "Backup validation",
    status: "ready",
    detail: "Imported files must match the BodyPilot data envelope before they can replace the saved workspace.",
  },
  {
    system: "Notifications",
    status: "adapter-needed",
    detail: "Reminder types, quiet hours, push/email channels, and coach-plan alerts are defined for mobile push and email workers.",
  },
  {
    system: "Transactional email",
    status: "adapter-needed",
    detail: "The live API exposes /api/email/send for verification, reset, invite, billing, digest, and deletion receipts through Resend or Postmark.",
  },
  {
    system: "Payments and webhooks",
    status: "adapter-needed",
    detail: "Checkout, subscription events, refund events, webhook signature verification, and entitlement refresh jobs have server endpoints and env contracts.",
  },
  {
    system: "Background workers",
    status: "adapter-needed",
    detail: "The live API defines a queue contract for reminders, weekly summaries, stale invite expiry, billing refresh, backup retention, and account deletion.",
  },
  {
    system: "Food database",
    status: "ready",
    detail: "Food search uses a connector boundary with local staples, recent foods, saved foods, custom foods, barcode lookup, and live catalog fallback.",
  },
  {
    system: "Roles",
    status: "ready",
    detail: "Self-managed athlete, coached athlete, and coach workflows are represented in UI state and account metadata.",
  },
  {
    system: "Subscriptions",
    status: "adapter-needed",
    detail: "Plan tier is modeled at the account layer so StoreKit, Stripe where appropriate, and backend-verified entitlements can gate coaching and advanced planning features.",
  },
  {
    system: "Observability",
    status: "adapter-needed",
    detail: "Health checks, crash monitoring, payment failures, email failures, queue dead letters, and save failures need production error IDs before launch.",
  },
  {
    system: "Legal and support",
    status: "ready",
    detail: "Settings and public pages expose privacy policy, privacy choices, terms, support, data export, account deletion, and health-scope destinations.",
  },
];

export const bodyPilotFoodReadiness: LaunchReadinessItem[] = [
  {
    system: "Search-first logging",
    status: "ready",
    detail: "The log flow prioritizes search, recent foods, frequent foods, saved foods, and one-tap logging into the selected meal.",
  },
  {
    system: "External provider",
    status: "ready",
    detail: "The connector can swap Open Food Facts for a paid nutrition database without rewriting the logging UI.",
  },
  {
    system: "Serving sizes",
    status: "ready",
    detail: "Foods support serving options, gram weights, scaled nutrients, recipes, saved meals, and editable meal entries.",
  },
  {
    system: "Data ownership",
    status: "adapter-needed",
    detail: "Custom foods, recipes, recents, and favorites are modeled for account-scoped cloud ownership.",
  },
];

export const normalizeBodyPilotAccount = (
  value: unknown,
  fallbackName: string
): BodyPilotAccount => {
  if (!value || typeof value !== "object") {
    return { ...defaultBodyPilotAccount, displayName: fallbackName };
  }

  const raw = value as Partial<BodyPilotAccount>;
  const status: BodyPilotAccountStatus =
    raw.status === "email-unverified" || raw.status === "signed-in" || raw.status === "signed-out"
      ? raw.status
      : "signed-out";
  const role: BodyPilotRole =
    raw.role === "coach" || raw.role === "coached-athlete" || raw.role === "self-managed-athlete"
      ? raw.role
      : "self-managed-athlete";
  const subscriptionTier: BodyPilotSubscriptionTier =
    raw.subscriptionTier === "starter" || raw.subscriptionTier === "coach" || raw.subscriptionTier === "pro"
      ? raw.subscriptionTier
      : "pro";

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : "local-athlete",
    email: typeof raw.email === "string" ? raw.email : "",
    displayName: typeof raw.displayName === "string" && raw.displayName.trim() ? raw.displayName : fallbackName,
    role,
    status,
    emailVerified: Boolean(raw.emailVerified),
    subscriptionTier,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    lastSyncedAt: typeof raw.lastSyncedAt === "string" ? raw.lastSyncedAt : undefined,
  };
};

export const normalizeNotificationPreferences = (value: unknown): NotificationPreferences => {
  if (!value || typeof value !== "object") return defaultNotificationPreferences;
  const raw = value as Partial<NotificationPreferences>;

  return {
    ...defaultNotificationPreferences,
    pushEnabled: typeof raw.pushEnabled === "boolean" ? raw.pushEnabled : defaultNotificationPreferences.pushEnabled,
    emailEnabled: typeof raw.emailEnabled === "boolean" ? raw.emailEnabled : defaultNotificationPreferences.emailEnabled,
    quietHoursStart: typeof raw.quietHoursStart === "string" ? raw.quietHoursStart : defaultNotificationPreferences.quietHoursStart,
    quietHoursEnd: typeof raw.quietHoursEnd === "string" ? raw.quietHoursEnd : defaultNotificationPreferences.quietHoursEnd,
    logFoodReminder: typeof raw.logFoodReminder === "boolean" ? raw.logFoodReminder : defaultNotificationPreferences.logFoodReminder,
    bodyweightReminder: typeof raw.bodyweightReminder === "boolean" ? raw.bodyweightReminder : defaultNotificationPreferences.bodyweightReminder,
    trainingReminder: typeof raw.trainingReminder === "boolean" ? raw.trainingReminder : defaultNotificationPreferences.trainingReminder,
    closeoutReminder: typeof raw.closeoutReminder === "boolean" ? raw.closeoutReminder : defaultNotificationPreferences.closeoutReminder,
    checkInReminder: typeof raw.checkInReminder === "boolean" ? raw.checkInReminder : defaultNotificationPreferences.checkInReminder,
    coachUpdateAlert: typeof raw.coachUpdateAlert === "boolean" ? raw.coachUpdateAlert : defaultNotificationPreferences.coachUpdateAlert,
    planChangeAlert: typeof raw.planChangeAlert === "boolean" ? raw.planChangeAlert : defaultNotificationPreferences.planChangeAlert,
    scheduleReminder: typeof raw.scheduleReminder === "boolean" ? raw.scheduleReminder : defaultNotificationPreferences.scheduleReminder,
  };
};
