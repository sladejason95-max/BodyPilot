import { Capacitor } from "@capacitor/core";

export type RestTimerNotificationInput = {
  sessionKey: string;
  setId: string;
  endsAt: number;
  exerciseName?: string;
  requestPermission?: boolean;
};

export type RestTimerNotificationResult = "scheduled" | "cancelled" | "permission-required" | "unsupported" | "expired";

let notificationOperationQueue: Promise<void> = Promise.resolve();

export const isRestTimerNotificationExpired = (endsAt: number, now = Date.now()) =>
  !Number.isFinite(endsAt) || !Number.isFinite(now) || endsAt <= now;

/** Cancel only while an alert is still pending; once due, let the native OS deliver it. */
export const shouldCancelPendingRestTimerNotification = (endsAt: number, now = Date.now()) =>
  !isRestTimerNotificationExpired(endsAt, now);

const serializeNotificationOperation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = notificationOperationQueue.then(operation, operation);
  notificationOperationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
};

export const restTimerNotificationId = (sessionKey: string, setId: string) => {
  const value = `${sessionKey}:${setId}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2_147_483_646) + 1;
};

const scheduleRestTimerNotificationNow = async (
  input: RestTimerNotificationInput
): Promise<RestTimerNotificationResult> => {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  if (isRestTimerNotificationExpired(input.endsAt)) return "expired";
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  let permission = await LocalNotifications.checkPermissions();
  if (
    permission.display !== "granted" &&
    permission.display !== "denied" &&
    input.requestPermission
  ) {
    permission = await LocalNotifications.requestPermissions();
  }
  if (permission.display !== "granted") return "permission-required";
  const id = restTimerNotificationId(input.sessionKey, input.setId);
  await LocalNotifications.cancel({ notifications: [{ id }] });
  // Permission prompts and queued native operations can outlive a short rest period.
  // Recheck at the last possible moment so an elapsed timer never becomes a late alert.
  if (isRestTimerNotificationExpired(input.endsAt)) return "expired";
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: "Rest complete",
        body: input.exerciseName ? `${input.exerciseName}: your next set is ready.` : "Your next working set is ready.",
        schedule: { at: new Date(input.endsAt), allowWhileIdle: true },
        extra: { sessionKey: input.sessionKey, setId: input.setId },
      },
    ],
  });
  return "scheduled";
};

const cancelRestTimerNotificationNow = async (
  input: Pick<RestTimerNotificationInput, "sessionKey" | "setId">
): Promise<RestTimerNotificationResult> => {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({
    notifications: [{ id: restTimerNotificationId(input.sessionKey, input.setId) }],
  });
  return "cancelled";
};

/** Serializes schedule/cancel work so rapid timer edits cannot leave an older alert as the final native state. */
export const scheduleRestTimerNotification = (input: RestTimerNotificationInput) =>
  serializeNotificationOperation(() => scheduleRestTimerNotificationNow(input));

export const cancelRestTimerNotification = (
  input: Pick<RestTimerNotificationInput, "sessionKey" | "setId">
) => serializeNotificationOperation(() => cancelRestTimerNotificationNow(input));
