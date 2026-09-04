import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RECOMMENDED_LOAD_STEP,
  feedbackSetDelta,
  guardRecommendationForExercisePain,
  guardRecommendationForRecovery,
  isProductiveSet,
  isResolvedSet,
  parseRepRange,
  previousSetForRecommendation,
  recommendationForSet,
  resolveExerciseLoadIncrement,
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

test("persisted exercise pain blocks load increases without a recovery questionnaire", () => {
  const last = { weight: 100, reps: 12, rir: 2 };
  const previous = { sets: [last], topSet: last };
  const result = recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5, {
    loadProgressionBlocked: true,
  });

  assert.equal(result.weight, 100);
  assert.equal(result.rir, 3);
  assert.match(result.reason, /unresolved pain flag/);
  assert.deepEqual(previous, { sets: [last], topSet: last });
  assert.equal(recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5).weight, 105);
});

test("persisted pain keeps an easier recommendation and a larger effort buffer", () => {
  const last = { weight: 100, reps: 9, rir: 0 };
  const previous = { sets: [last], topSet: last };
  const result = recommendationForSet({ reps: "8-12" }, 0, previous, 4, 5, {
    loadProgressionBlocked: true,
  });

  assert.equal(result.weight, 95);
  assert.equal(result.rir, 4);
  assert.match(result.reason, /pain flag/);
});

test("pain with no valid history never fabricates a starter load", () => {
  const invalid = { weight: 100, reps: 12, rir: 2, skipped: true };
  for (const previous of [null, { sets: [invalid], topSet: invalid }]) {
    const result = recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5, {
      loadProgressionBlocked: true,
    });
    assert.equal(result.weight, 0);
    assert.equal(result.reps, 8);
    assert.equal(result.rir, 3);
    assert.match(result.reason, /no valid prior load/);
  }
});

test("pain guard respects a zero-added-load bodyweight result", () => {
  const last = { weight: 0, reps: 12, rir: 2 };
  const result = recommendationForSet({ reps: "8-12" }, 0, { sets: [last], topSet: null }, 2, 5, {
    allowZeroLoad: true,
    loadProgressionBlocked: true,
  });

  assert.equal(result.weight, 0);
  assert.equal(result.rir, 3);
  assert.match(result.reason, /Load progression held/);
});

test("pain guard preserves unconstrained recommendations and fails closed on invalid prior loads", () => {
  const recommendation = { weight: 105, reps: 8, rir: 2, reason: "Load increased." };
  assert.equal(guardRecommendationForExercisePain(recommendation, null, false), recommendation);
  for (const last of [
    null,
    { weight: Number.NaN, reps: 12, rir: 2 },
    { weight: -10, reps: 12, rir: 2 },
    { weight: 100, reps: 12, rir: 2, skipped: true },
  ]) {
    const result = guardRecommendationForExercisePain(recommendation, last, true);
    assert.equal(result.weight, 0);
    assert.match(result.reason, /no valid prior load/);
  }
});

test("bodyweight history advances reps without being reset to an unassessed load", () => {
  const last = { weight: 0, reps: 10, rir: 2 };
  const result = recommendationForSet({ reps: "8-12" }, 0, { sets: [last], topSet: null }, 2, 5, {
    allowZeroLoad: true,
  });

  assert.equal(result.weight, 0);
  assert.equal(result.reps, 11);
  assert.match(result.reason, /Add reps/);
  assert.equal(recommendationForSet({ reps: "8-12" }, 0, { sets: [last], topSet: null }, 2, 5).reps, 8);
});

test("bodyweight progression uses an explicit exercise increment and preserves the upper rep target for reps-only", () => {
  const last = { weight: 0, reps: 12, rir: 2 };
  const previous = { sets: [last], topSet: null };
  const weighted = recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5, {
    allowZeroLoad: true,
    exerciseLoadIncrement: 2.5,
  });
  const repsOnly = recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5, {
    allowZeroLoad: true,
    exerciseLoadIncrement: 0,
  });

  assert.equal(weighted.weight, 2.5);
  assert.equal(weighted.reps, 8);
  assert.equal(repsOnly.weight, 0);
  assert.equal(repsOnly.reps, 12);
  assert.match(repsOnly.reason, /automatic load increases are off/);
});

test("zero-load history still reduces reps after an effort miss without recommending negative weight", () => {
  const last = { weight: 0, reps: 10, rir: 0 };
  const result = recommendationForSet({ reps: "8-12" }, 0, { sets: [last], topSet: null }, 2, 5, {
    allowZeroLoad: true,
  });
  assert.equal(result.weight, 0);
  assert.equal(result.reps, 9);
  assert.match(result.reason, /Easier target/);
});

test("exercise increments override the global increment, including explicit zero, and remain bounded", () => {
  assert.equal(resolveExerciseLoadIncrement(5), 5);
  assert.equal(resolveExerciseLoadIncrement(5, null), 5);
  assert.equal(resolveExerciseLoadIncrement(5, 2.5), 2.5);
  assert.equal(resolveExerciseLoadIncrement(5, 0), 0);
  assert.equal(resolveExerciseLoadIncrement(5, 1_000), MAX_RECOMMENDED_LOAD_STEP);
  for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(resolveExerciseLoadIncrement(5, invalid), 0);
    assert.equal(resolveExerciseLoadIncrement(invalid), 0);
  }

  const last = { weight: 100, reps: 12, rir: 2 };
  const previous = { sets: [last], topSet: last };
  assert.equal(recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5, {
    exerciseLoadIncrement: 2.5,
  }).weight, 102.5);
  const repsOnly = recommendationForSet({ reps: "8-12" }, 0, previous, 2, 5, {
    exerciseLoadIncrement: 0,
  });
  assert.equal(repsOnly.weight, 100);
  assert.equal(repsOnly.reps, 12);
});

test("history selection rejects skipped or malformed sets and can reuse valid bodyweight work without a top set", () => {
  const valid = { weight: 80, reps: 9, rir: 2 };
  const bodyweight = { weight: 0, reps: 11, rir: 2 };
  for (const invalid of [
    { weight: 100, reps: 10, rir: 2, skipped: true },
    { weight: -1, reps: 10, rir: 2 },
    { weight: Number.NaN, reps: 10, rir: 2 },
    { weight: 100, reps: 0, rir: 2 },
    { weight: 100, reps: Number.NaN, rir: 2 },
    { weight: 100, reps: 10, rir: Number.NaN },
    { weight: 100, reps: 10, rir: -1 },
    { weight: 100, reps: 10, rir: 6 },
  ]) {
    assert.equal(previousSetForRecommendation({ sets: [invalid], topSet: valid }, 0), valid);
    assert.equal(previousSetForRecommendation({ sets: [invalid], topSet: invalid }, 0), null);
  }
  assert.equal(previousSetForRecommendation({ sets: [bodyweight], topSet: null }, 3), null);
  assert.equal(previousSetForRecommendation({ sets: [bodyweight], topSet: null }, 3, { allowZeroLoad: true }), bodyweight);
  assert.equal(previousSetForRecommendation({ sets: [valid], topSet: null }, Number.NaN), valid);
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

test("recovery guard blocks added load from bodyweight and refuses an invalid load baseline", () => {
  const recommendation = { weight: 5, reps: 8, rir: 2, reason: "Load increased." };
  for (const last of [
    { weight: 0, reps: 12, rir: 2 },
    null,
    { weight: 100, reps: 12, rir: 2, skipped: true },
    { weight: Number.NaN, reps: 12, rir: 2 },
  ]) {
    const result = guardRecommendationForRecovery(recommendation, last, { soreness: 3 });
    assert.equal(result.weight, 0);
    assert.equal(result.rir, 3);
  }
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

test("completion accepts zero external load only for explicitly load-optional exercises", () => {
  const bodyweight = { id: "pull-up", weight: 0, reps: 10, done: true, loadRequired: false };
  assert.equal(isProductiveSet(bodyweight), true);
  assert.equal(isProductiveSet({ ...bodyweight, loadRequired: true }), false);
  assert.equal(isProductiveSet({ ...bodyweight, loadRequired: undefined }), false);
  assert.equal(isProductiveSet({ ...bodyweight, weight: -1 }), false);
  assert.equal(isProductiveSet({ ...bodyweight, skipped: true }), false);
  assert.equal(summarizeWorkoutCompletion([bodyweight]).canComplete, true);
});
