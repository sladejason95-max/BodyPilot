import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RECOMMENDED_LOAD_STEP,
  feedbackSetDelta,
  guardRecommendationForRecovery,
  isProductiveSet,
  isResolvedSet,
  parseRepRange,
  recommendationForSet,
  summarizeWorkoutCompletion,
  targetRirForWeek,
  workoutLiftLogKey,
  workoutSessionKey,
} from "../src/app/hypertrophy_engine.ts";

const feedback = (overrides = {}) => ({
  stimulus: 2,
  pump: 2,
  soreness: 1,
  workload: 3,
  limitation: "target",
  jointPain: 0,
  moreSets: false,
  volumeAdjustment: "auto",
  ...overrides,
});

test("parseRepRange preserves the current range and fallback behavior", () => {
  assert.deepEqual(parseRepRange("8-12"), { low: 8, high: 12 });
  assert.deepEqual(parseRepRange("10 reps"), { low: 10, high: 10 });
  assert.deepEqual(parseRepRange("12-8"), { low: 12, high: 12 });
  assert.deepEqual(parseRepRange("not set"), { low: 8, high: 8 });
});

test("targetRirForWeek progresses toward failure and returns four for deloads", () => {
  assert.equal(targetRirForWeek(1, 5, false), 3);
  assert.equal(targetRirForWeek(3, 5, false), 1.5);
  assert.equal(targetRirForWeek(5, 5, false), 0);
  assert.equal(targetRirForWeek(99, 5, false), 0);
  assert.equal(targetRirForWeek(3, 5, true), 4);
});

test("recommendationForSet starts at the bottom of the rep range without history", () => {
  assert.deepEqual(recommendationForSet({ reps: "8-12" }, 0, null, 2, 5), {
    weight: 0,
    reps: 8,
    rir: 2,
    reason: "Pick a load you can control in range.",
  });
});

test("recommendationForSet reduces load and reps after an effort miss", () => {
  const previous = {
    sets: [{ weight: 100, reps: 9, rir: 0 }],
    topSet: { weight: 100, reps: 9, rir: 0 },
  };

  assert.deepEqual(recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5), {
    weight: 95,
    reps: 8,
    rir: 2,
    reason: "Easier target after missing effort.",
  });
});

test("recommendationForSet increases load after topping the range", () => {
  const previous = {
    sets: [{ weight: 100, reps: 12, rir: 2 }],
    topSet: { weight: 100, reps: 12, rir: 2 },
  };

  assert.deepEqual(recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5), {
    weight: 105,
    reps: 8,
    rir: 2,
    reason: "Load increased after topping the range.",
  });
});

test("recommendationForSet adds reps and falls back to the top set for a skipped set", () => {
  const previous = {
    sets: [{ weight: 100, reps: 10, rir: 2, skipped: true }],
    topSet: { weight: 90, reps: 9, rir: 2 },
  };

  assert.deepEqual(recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5), {
    weight: 90,
    reps: 10,
    rir: 2,
    reason: "Add reps before increasing load.",
  });
});

test("recommendationForSet caps corrupted load increments", () => {
  const previous = {
    sets: [{ weight: 200, reps: 12, rir: 2 }],
    topSet: { weight: 200, reps: 12, rir: 2 },
  };
  const result = recommendationForSet({ reps: "8-12" }, 0, previous, 2, 1_000);

  assert.equal(result.weight, 200 + MAX_RECOMMENDED_LOAD_STEP);
});

test("recovery guard blocks load progression and raises the effort buffer", () => {
  const recommendation = { weight: 105, reps: 8, rir: 2, reason: "Load increased." };
  assert.deepEqual(
    guardRecommendationForRecovery(
      recommendation,
      { weight: 100, reps: 12, rir: 2 },
      { jointPain: 2, soreness: 1, readiness: 3, performanceExpectation: "steady" }
    ),
    {
      weight: 100,
      reps: 8,
      rir: 3,
      reason: "Load held because joint discomfort was reported.",
    }
  );
  assert.equal(
    guardRecommendationForRecovery(recommendation, { weight: 100, reps: 12, rir: 2 }, { readiness: 4 }),
    recommendation
  );
});

test("feedbackSetDelta gives recovery and pain signals priority", () => {
  assert.equal(feedbackSetDelta(feedback({ jointPain: 2, moreSets: true })), -1);
  assert.equal(feedbackSetDelta(feedback({ limitation: "joint" })), -1);
  assert.equal(feedbackSetDelta(feedback({ soreness: 3 })), -1);
  assert.equal(feedbackSetDelta(feedback({ workload: 4 })), -1);
  assert.equal(feedbackSetDelta(feedback({ volumeAdjustment: "add" })), 1);
  assert.equal(feedbackSetDelta(feedback({ moreSets: true })), 1);
  assert.equal(feedbackSetDelta(feedback({ volumeAdjustment: "hold", moreSets: false })), 0);
  assert.equal(feedbackSetDelta(feedback({ stimulus: 1, pump: 1, soreness: 1, workload: 2 })), 1);
});

test("completion helpers distinguish resolved, productive, incomplete, and invalid sets", () => {
  const productive = { id: "a", weight: 100, reps: 10, done: true, skipped: false };
  const skipped = { id: "b", weight: 0, reps: 0, done: true, skipped: true };
  const incomplete = { id: "c", weight: 100, reps: 8, done: false, skipped: false };
  const invalid = { id: "d", weight: 0, reps: 10, done: true, skipped: false };

  assert.equal(isResolvedSet(skipped), true);
  assert.equal(isResolvedSet(incomplete), false);
  assert.equal(isProductiveSet(productive), true);
  assert.equal(isProductiveSet(skipped), false);

  assert.deepEqual(summarizeWorkoutCompletion([productive, skipped, incomplete, invalid]), {
    totalSets: 4,
    resolvedSets: 3,
    productiveSets: 1,
    incompleteSetIndexes: [2],
    invalidCompletedSetIndexes: [3],
    progressPercent: 75,
    canComplete: false,
  });

  assert.equal(summarizeWorkoutCompletion([productive, skipped]).canComplete, true);
  assert.equal(summarizeWorkoutCompletion([]).canComplete, false);
});

test("workout keys isolate the same week and day across mesocycles", () => {
  assert.equal(workoutSessionKey("meso-a", 1, "push"), "meso-a:1:push");
  assert.equal(workoutLiftLogKey("meso-a", 1, "push", "bench"), "meso-a:1:push:bench");
  assert.notEqual(workoutSessionKey("meso-a", 1, "push"), workoutSessionKey("meso-b", 1, "push"));
});
