import type {
  NotificationDeliveryContract,
  NotificationPreferences,
  NotificationReminderScheduleItem,
  ProductionTrustStatus,
} from "./product_infrastructure";

type NotificationDeliveryAdapterInput = {
  preferences: NotificationPreferences;
  reminderSchedule: readonly NotificationReminderScheduleItem[];
  notificationPermission: NotificationPermission | "unsupported";
  userMode: "athlete" | "coach";
  selfManagedAthlete: boolean;
  pendingMembershipInviteCount: number;
  activeMembershipCount: number;
  queuedPlanChangeCount: number;
  latestMembershipEventTitle?: string | null;
};

type BodyPilotNotificationDeliveryAdapter = {
  id: string;
  mode: "local" | "production";
  responsibilities: readonly string[];
  buildDeliveryContracts: (input: NotificationDeliveryAdapterInput) => readonly NotificationDeliveryContract[];
};

const findReminder = (
  reminderSchedule: readonly NotificationReminderScheduleItem[],
  id: string
): NotificationReminderScheduleItem | null => reminderSchedule.find((item) => item.id === id) ?? null;

const resolveChannels = (
  preferences: NotificationPreferences,
  notificationPermission: NotificationPermission | "unsupported"
) => {
  const channels: string[] = [];
  if (preferences.pushEnabled && notificationPermission === "granted") channels.push("push");
  if (preferences.emailEnabled) channels.push("email");
  if (preferences.pushEnabled && notificationPermission !== "granted") channels.push("push pending");
  return channels.length > 0 ? channels.join(" + ") : "none";
};

const statusFromReminder = (reminder: NotificationReminderScheduleItem | null): ProductionTrustStatus => {
  if (!reminder) return "attention";
  if (reminder.status === "blocked") return "blocked";
  if (reminder.status === "off") return "local";
  return "attention";
};

const contractFromReminder = (props: {
  reminder: NotificationReminderScheduleItem | null;
  event: string;
  audience: string;
  productionTrigger: string;
  deliveryWorker: string;
  channels: string;
  receiptPolicy: string;
}): NotificationDeliveryContract => ({
  id: props.reminder?.id ?? props.deliveryWorker,
  event: props.event,
  audience: props.audience,
  currentTrigger: props.reminder?.trigger ?? "No local reminder rule yet.",
  productionTrigger: props.productionTrigger,
  deliveryWorker: props.deliveryWorker,
  channels: props.channels,
  receiptPolicy: props.receiptPolicy,
  status: statusFromReminder(props.reminder),
});

export const localBodyPilotNotificationAdapter: BodyPilotNotificationDeliveryAdapter = {
  id: "bodypilot-local-notifications",
  mode: "local",
  responsibilities: [
    "local reminder status",
    "push permission gating",
    "email fallback intent",
    "quiet-hours handoff",
    "receipt-aware coach updates",
    "membership invite delivery",
  ],
  buildDeliveryContracts: (input) => {
    const channels = resolveChannels(input.preferences, input.notificationPermission);
    const hasProductionChannel =
      input.preferences.emailEnabled || (input.preferences.pushEnabled && input.notificationPermission === "granted");
    const membershipInviteStatus: ProductionTrustStatus =
      input.pendingMembershipInviteCount > 0
        ? hasProductionChannel
          ? "attention"
          : "blocked"
        : "local";
    const coachAudience = input.userMode === "coach" ? "coach clients" : input.selfManagedAthlete ? "self-managed athlete" : "coached athlete";

    return [
      {
        id: "membership-invite",
        event: "Coach invite receipt",
        audience: "invited client",
        currentTrigger:
          input.pendingMembershipInviteCount > 0
            ? `${input.pendingMembershipInviteCount} pending invite${input.pendingMembershipInviteCount === 1 ? "" : "s"} detected locally.`
            : input.latestMembershipEventTitle ?? "No pending membership invite.",
        productionTrigger: "Send an email/deep-link and in-app receipt when a coach invites a client.",
        deliveryWorker: "membership-invite-worker",
        channels,
        receiptPolicy: "Client acceptance or cancellation writes a membership audit event.",
        status: membershipInviteStatus,
      },
      contractFromReminder({
        reminder: findReminder(input.reminderSchedule, "coach-update"),
        event: "Coach update receipt",
        audience: "coached athlete",
        productionTrigger: "Send immediately when a coach publishes a decision or asks for acknowledgement.",
        deliveryWorker: "coach-update-worker",
        channels,
        receiptPolicy: "Requires athlete acknowledgement before the update is considered read.",
      }),
      contractFromReminder({
        reminder: findReminder(input.reminderSchedule, "plan-change"),
        event: "Plan change alert",
        audience: coachAudience,
        productionTrigger: `Send after nutrition, training, schedule, or target changes. ${input.queuedPlanChangeCount} queued locally.`,
        deliveryWorker: "plan-change-worker",
        channels,
        receiptPolicy: "Attach to plan-version or change-log event for traceability.",
      }),
      contractFromReminder({
        reminder: findReminder(input.reminderSchedule, "check-in"),
        event: "Check-in reminder",
        audience: coachAudience,
        productionTrigger: "Send during the configured morning review window when check-in tasks are due.",
        deliveryWorker: "check-in-reminder-worker",
        channels,
        receiptPolicy: "No receipt required; completion is inferred from check-in records.",
      }),
      contractFromReminder({
        reminder: findReminder(input.reminderSchedule, "closeout"),
        event: "Daily closeout nudge",
        audience: coachAudience,
        productionTrigger: "Send before quiet hours only when the selected day is not closed.",
        deliveryWorker: "closeout-reminder-worker",
        channels,
        receiptPolicy: "Dismissed by daily closeout status.",
      }),
      contractFromReminder({
        reminder: findReminder(input.reminderSchedule, "training"),
        event: "Training follow-up",
        audience: coachAudience,
        productionTrigger: "Send before the scheduled session and follow up only if lifts remain open.",
        deliveryWorker: "training-reminder-worker",
        channels,
        receiptPolicy: "Dismissed by completed lift log state.",
      }),
      contractFromReminder({
        reminder: findReminder(input.reminderSchedule, "food-gap"),
        event: "Food gap reminder",
        audience: coachAudience,
        productionTrigger: "Send when meals, calories, or protein remain meaningfully open after planned meal windows.",
        deliveryWorker: "food-gap-worker",
        channels,
        receiptPolicy: "Dismissed by food entries and macro completion.",
      }),
      {
        id: "weekly-summary",
        event: "Weekly coach summary",
        audience: input.activeMembershipCount > 0 ? "coach and active clients" : coachAudience,
        currentTrigger: "Not scheduled locally yet.",
        productionTrigger: "Send adherence, progress, readiness, and plan-change digest at coach cadence.",
        deliveryWorker: "weekly-summary-worker",
        channels,
        receiptPolicy: "No urgent receipt; included in audit trail and message digest.",
        status: input.activeMembershipCount > 0 && hasProductionChannel ? "attention" : "local",
      },
    ];
  },
};
