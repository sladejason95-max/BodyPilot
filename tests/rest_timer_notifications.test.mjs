import assert from "node:assert/strict";
import test from "node:test";

import {
  isRestTimerNotificationExpired,
  restTimerNotificationId,
  shouldCancelPendingRestTimerNotification,
} from "../src/app/rest_timer_notifications.ts";

test("rest timer notification ids are stable, scoped, and native-safe", () => {
  const first = restTimerNotificationId("meso-a:1:push", "bench-set-1");
  assert.equal(first, restTimerNotificationId("meso-a:1:push", "bench-set-1"));
  assert.notEqual(first, restTimerNotificationId("meso-a:1:pull", "bench-set-1"));
  assert.notEqual(first, restTimerNotificationId("meso-a:1:push", "bench-set-2"));
  assert.ok(first >= 1 && first <= 2_147_483_647);
});

test("rest timer notification expiry is fail-closed at the scheduling boundary", () => {
  const now = 1_700_000_000_000;
  assert.equal(isRestTimerNotificationExpired(now + 1, now), false);
  assert.equal(isRestTimerNotificationExpired(now, now), true);
  assert.equal(isRestTimerNotificationExpired(now - 1, now), true);
  assert.equal(isRestTimerNotificationExpired(Number.NaN, now), true);
  assert.equal(isRestTimerNotificationExpired(Number.POSITIVE_INFINITY, now), true);
  assert.equal(isRestTimerNotificationExpired(now + 1, Number.NaN), true);
});

test("notification cleanup preserves alerts that are already due", () => {
  const now = 1_700_000_000_000;
  assert.equal(shouldCancelPendingRestTimerNotification(now + 1, now), true);
  assert.equal(shouldCancelPendingRestTimerNotification(now, now), false);
  assert.equal(shouldCancelPendingRestTimerNotification(now - 1, now), false);
  assert.equal(shouldCancelPendingRestTimerNotification(Number.NaN, now), false);
});
