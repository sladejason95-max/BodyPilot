import type {
  BodyPilotAccountStatus,
  BodyPilotSubscriptionTier,
  NotificationPreferences,
  ProductionTrustStatus,
} from "./product_infrastructure";

export type LiveBackendConnectorLane =
  | "API"
  | "Identity"
  | "Data"
  | "Messaging"
  | "Commerce"
  | "Jobs"
  | "Compliance"
  | "Observability";

export type LiveBackendConnector = {
  id: string;
  lane: LiveBackendConnectorLane;
  system: string;
  currentMode: string;
  productionProvider: string;
  endpoint: string;
  secretName: string;
  events: string;
  launchRequirement: string;
  owner: string;
  metric: string;
  status: ProductionTrustStatus;
};

export type LiveBackendConnectorInput = {
  apiBaseUrl?: string;
  environmentName?: string;
  observabilityDsn?: string;
  accountStatus: BodyPilotAccountStatus;
  accountEmail: string;
  subscriptionTier: BodyPilotSubscriptionTier;
  isOnline: boolean;
  storageIssue: string | null;
  lastSavedAt: string | null;
  lastBackupExportedAt: string | null;
  notificationPreferences: NotificationPreferences;
  notificationPermission: NotificationPermission | "unsupported";
  reminderCount: number;
  pendingInviteCount: number;
  activeMembershipCount: number;
  planVersionCount: number;
  coachMessageCount: number;
  weeklyReviewCount: number;
  legalPagesReady: boolean;
};

const configured = (value: string | undefined | null) => Boolean(value && value.trim());

const statusFromConfig = (
  hasConfig: boolean,
  fallback: ProductionTrustStatus = "attention"
): ProductionTrustStatus => (hasConfig ? "ready" : fallback);

const formatSaveMetric = (lastSavedAt: string | null, storageIssue: string | null) => {
  if (storageIssue) return "Blocked";
  if (!lastSavedAt) return "Waiting";
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) return "Saved";
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const buildLiveBackendConnectors = (
  input: LiveBackendConnectorInput
): readonly LiveBackendConnector[] => {
  const apiConfigured = configured(input.apiBaseUrl);
  const observabilityConfigured = configured(input.observabilityDsn);
  const hasAccount = input.accountStatus === "signed-in";
  const emailRequested = input.notificationPreferences.emailEnabled;
  const pushRequested = input.notificationPreferences.pushEnabled;
  const hasAnyReminderNeed = input.reminderCount > 0 || input.pendingInviteCount > 0 || input.planVersionCount > 0;
  const hasCoachingData =
    input.pendingInviteCount > 0 ||
    input.activeMembershipCount > 0 ||
    input.planVersionCount > 0 ||
    input.coachMessageCount > 0 ||
    input.weeklyReviewCount > 0;
  const localDataHealthy = Boolean(input.lastSavedAt && !input.storageIssue);
  const backupMetric = input.lastBackupExportedAt ? "Exported" : "No export";
  const environmentLabel = input.environmentName?.trim() || "local";

  return [
    {
      id: "api-gateway",
      lane: "API",
      system: "API gateway",
      currentMode: apiConfigured ? "Remote API configured" : "Static app only",
      productionProvider: "HTTPS API edge function or app server",
      endpoint: input.apiBaseUrl || "VITE_BODYPILOT_API_BASE_URL",
      secretName: "BODYPILOT_API_INTERNAL_TOKEN",
      events: "auth session, sync, payments, email, webhooks, jobs",
      launchRequirement: "All write operations that must survive device loss go through the API.",
      owner: "Platform",
      metric: environmentLabel,
      status: statusFromConfig(apiConfigured, "blocked"),
    },
    {
      id: "identity-auth",
      lane: "Identity",
      system: "Auth and sessions",
      currentMode:
        input.accountStatus === "signed-in"
          ? "Local account signed in"
          : input.accountStatus === "email-unverified"
            ? "Local email verification pending"
            : "Guest/local workspace",
      productionProvider: "Supabase Auth, Clerk, Firebase Auth, or custom OAuth",
      endpoint: "/api/auth/session",
      secretName: "AUTH_JWT_SECRET",
      events: "create account, verify email, reset password, sign out, delete account",
      launchRequirement: "Session restore, secure password reset, account deletion, and role claims must work server-side.",
      owner: "Account",
      metric: hasAccount ? input.accountEmail || "Signed in" : "Local",
      status: hasAccount ? "attention" : "blocked",
    },
    {
      id: "cloud-database",
      lane: "Data",
      system: "Cloud database",
      currentMode: localDataHealthy ? "Local data envelope healthy" : input.storageIssue || "No saved envelope",
      productionProvider: "Postgres with row-level security",
      endpoint: "/api/sync/events",
      secretName: "DATABASE_URL",
      events: "food days, workouts, check-ins, plan versions, coach thread, membership records",
      launchRequirement: "Account-scoped data must sync, merge, and restore across devices.",
      owner: "Data",
      metric: formatSaveMetric(input.lastSavedAt, input.storageIssue),
      status: input.storageIssue ? "blocked" : localDataHealthy ? "attention" : "blocked",
    },
    {
      id: "object-storage",
      lane: "Data",
      system: "Photo and backup storage",
      currentMode: `${backupMetric}; files remain user-selected locally`,
      productionProvider: "S3, R2, GCS, or Supabase Storage",
      endpoint: "/api/files/sign-upload",
      secretName: "BODYPILOT_STORAGE_BUCKET",
      events: "progress photos, exported reports, coach attachments, backup archives",
      launchRequirement: "Uploads must use signed URLs, content limits, owner scoping, and deletion hooks.",
      owner: "Data",
      metric: backupMetric,
      status: input.lastBackupExportedAt ? "attention" : "blocked",
    },
    {
      id: "email-service",
      lane: "Messaging",
      system: "Transactional email",
      currentMode: emailRequested ? "Email preference enabled locally" : "Email disabled",
      productionProvider: "Resend, Postmark, SendGrid, or SES",
      endpoint: "/api/email/send",
      secretName: "BODYPILOT_EMAIL_API_KEY",
      events: "verify email, reset password, coach invite, weekly digest, privacy request receipt",
      launchRequirement: "Every account, invite, deletion, and billing flow needs a deliverable email path.",
      owner: "Lifecycle",
      metric: emailRequested ? "Enabled" : "Off",
      status: emailRequested ? "blocked" : "local",
    },
    {
      id: "push-service",
      lane: "Messaging",
      system: "Mobile push",
      currentMode:
        pushRequested && input.notificationPermission === "granted"
          ? "Device permission granted"
          : pushRequested
            ? "Permission not granted"
            : "Push disabled",
      productionProvider: "APNs through native wrapper or Expo/Firebase bridge",
      endpoint: "/api/push/register",
      secretName: "APNS_KEY_ID / APNS_TEAM_ID / APNS_PRIVATE_KEY",
      events: "food gaps, closeout, coach update receipt, training reminder, check-in due",
      launchRequirement: "Register device tokens, respect quiet hours, and write delivery receipts.",
      owner: "Lifecycle",
      metric: pushRequested ? input.notificationPermission : "Off",
      status:
        pushRequested && input.notificationPermission === "granted"
          ? "attention"
          : pushRequested
            ? "blocked"
            : "local",
    },
    {
      id: "payment-checkout",
      lane: "Commerce",
      system: "Payments and subscriptions",
      currentMode: `Tier modeled as ${input.subscriptionTier}`,
      productionProvider: "StoreKit for iOS digital subscriptions; Stripe only for web/eligible external services",
      endpoint: "/api/payments/checkout",
      secretName: "STRIPE_SECRET_KEY / STOREKIT_SHARED_SECRET",
      events: "checkout created, subscription changed, invoice paid, refund, entitlement refresh",
      launchRequirement: "Entitlements must be server-verified before gating coach or pro workflows.",
      owner: "Revenue",
      metric: input.subscriptionTier,
      status: input.subscriptionTier === "starter" ? "attention" : "blocked",
    },
    {
      id: "webhook-ingest",
      lane: "Jobs",
      system: "Webhook ingestion",
      currentMode: "No remote webhook receiver in the static app",
      productionProvider: "API route with signature verification",
      endpoint: "/api/webhooks/stripe and /api/webhooks/app-store",
      secretName: "STRIPE_WEBHOOK_SECRET / APP_STORE_CONNECT_KEY",
      events: "payment state, refund, subscription renewal, bounced email, failed delivery",
      launchRequirement: "External state changes must be verified, idempotent, and written into the sync ledger.",
      owner: "Platform",
      metric: "0 receivers",
      status: "blocked",
    },
    {
      id: "background-workers",
      lane: "Jobs",
      system: "Background job queue",
      currentMode: hasAnyReminderNeed ? `${input.reminderCount} reminder rules locally` : "No scheduled worker",
      productionProvider: "BullMQ, Cloud Tasks, QStash, Trigger.dev, or durable cron worker",
      endpoint: "/api/jobs/enqueue",
      secretName: "BODYPILOT_JOB_SIGNING_SECRET",
      events: "reminders, weekly summaries, stale invite expiry, backup retention, deletion completion",
      launchRequirement: "Any delayed or repeated workflow must be queued outside the user's browser.",
      owner: "Lifecycle",
      metric: `${input.reminderCount} rules`,
      status: hasAnyReminderNeed ? "blocked" : "attention",
    },
    {
      id: "coach-operations",
      lane: "Compliance",
      system: "Coach operations audit",
      currentMode: hasCoachingData ? "Local coaching events exist" : "No coaching events yet",
      productionProvider: "Append-only audit table plus immutable plan versions",
      endpoint: "/api/audit/events",
      secretName: "AUDIT_EVENT_SIGNING_SECRET",
      events: "plan publish, client acknowledgement, permission change, support task, deletion request",
      launchRequirement: "Coaches need durable audit trails before this can run as a real client-management business.",
      owner: "Coach ops",
      metric: `${input.planVersionCount} plans / ${input.coachMessageCount} messages`,
      status: hasCoachingData ? "attention" : "local",
    },
    {
      id: "privacy-automation",
      lane: "Compliance",
      system: "Privacy and deletion automation",
      currentMode: input.legalPagesReady ? "In-app and public policy paths exist" : "Policy paths missing",
      productionProvider: "Deletion workflow tied to auth, storage, billing, email, and audit systems",
      endpoint: "/api/privacy/delete",
      secretName: "PRIVACY_REQUEST_SIGNING_SECRET",
      events: "export request, deletion request, revoke consent, support receipt, retention hold",
      launchRequirement: "Account deletion must remove server data, cancel access, and produce a user-visible receipt.",
      owner: "Trust",
      metric: input.legalPagesReady ? "Policy live" : "Missing",
      status: input.legalPagesReady ? "attention" : "blocked",
    },
    {
      id: "observability",
      lane: "Observability",
      system: "Crash and health monitoring",
      currentMode: observabilityConfigured ? "Frontend DSN configured" : "Local error boundary only",
      productionProvider: "Sentry, Datadog, Axiom, Logtail, or OpenTelemetry",
      endpoint: input.observabilityDsn ? "VITE_BODYPILOT_SENTRY_DSN" : "/api/health",
      secretName: "OBSERVABILITY_WRITE_KEY",
      events: "crash, failed save, failed payment, failed email, queue dead-letter, API latency",
      launchRequirement: "Production support needs error IDs, release versions, and dead-letter visibility.",
      owner: "Support",
      metric: observabilityConfigured ? "Configured" : "Local only",
      status: observabilityConfigured ? "ready" : "blocked",
    },
  ];
};
