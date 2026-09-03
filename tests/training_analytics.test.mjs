import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTrainingAnalytics,
  estimateStrength,
  filterTrainingFeedback,
  filterTrainingHistory,
  summarizeTrainingFeedback,
} from "../src/app/training_analytics.ts";

const history = [
  {
    id: "bench-week-1",
    sessionKey: "meso-a:1:push",
    mesocycleId: "meso-a",
    weekNumber: 1,
    dayId: "push",
    dayFocus: "Push",
    liftId: "bench",
    liftName: "Machine chest press",
    muscleGroup: "chest",
    startedAt: "2026-08-01T17:00:00.000Z",
    completedAt: "2026-08-01T18:00:00.000Z",
    sets: [
      { weight: 100, reps: 10, rir: 2 },
      { weight: 100, reps: 9, rir: 2 },
      { weight: 100, reps: 8, rir: 1 },
    ],
  },
  {
    id: "row-week-1",
    sessionKey: "meso-a:1:push",
    mesocycleId: "meso-a",
    weekNumber: 1,
    dayId: "push",
    dayFocus: "Push",
    liftId: "row",
    liftName: "Machine row",
    muscleGroup: "back",
    startedAt: "2026-08-01T17:00:00.000Z",
    completedAt: "2026-08-01T18:00:00.000Z",
    sets: [{ weight: 90, reps: 12, rir: 2 }],
  },
  {
    id: "bench-week-2",
    sessionKey: "meso-a:2:push",
    mesocycleId: "meso-a",
    weekNumber: 2,
    dayId: "push",
    dayFocus: "Push",
    liftId: "bench",
    liftName: "Machine chest press",
    muscleGroup: "chest",
    startedAt: "2026-08-08T17:10:00.000Z",
    endedAt: "2026-08-08T18:00:00.000Z",
    completedAt: "2026-08-08T18:00:00.000Z",
    sets: [
      { weight: 110, reps: 12, rir: 2, done: true },
      { weight: 110, reps: 10, rir: 1, done: true },
      { weight: 0, reps: 0, rir: 2, done: true, skipped: true },
    ],
  },
  {
    id: "bench-next-meso",
    sessionKey: "meso-b:1:push",
    mesocycleId: "meso-b",
    weekNumber: 1,
    dayId: "push",
    dayFocus: "Push",
    liftId: "bench",
    liftName: "Machine chest press",
    muscleGroup: "chest",
    completedAt: "2026-09-01T18:00:00.000Z",
    durationMinutes: 45,
    sets: [{ weight: 115, reps: 9, rpe: 8 }],
  },
];

const feedback = [
  {
    id: "feedback-1",
    sessionKey: "meso-a:1:push",
    mesocycleId: "meso-a",
    weekNumber: 1,
    muscleGroup: "chest",
    recordedAt: "2026-08-01T18:01:00.000Z",
    pump: 2,
    soreness: 1,
    jointPain: 0,
  },
  {
    id: "feedback-2",
    sessionKey: "meso-a:2:push",
    mesocycleId: "meso-a",
    weekNumber: 2,
    muscleGroup: "chest",
    recordedAt: "2026-08-08T18:01:00.000Z",
    pump: 4,
    soreness: 2,
    jointPain: 2,
  },
  {
    id: "feedback-back",
    sessionKey: "meso-a:1:push",
    mesocycleId: "meso-a",
    weekNumber: 1,
    muscleGroup: "back",
    recordedAt: "2026-08-01T18:02:00.000Z",
    pump: 3,
    jointPain: 0,
  },
];

test("empty reports expose unavailable values as null instead of invented metrics", () => {
  const report = buildTrainingAnalytics({ history: [] });

  assert.equal(report.aggregate.workoutCount, 0);
  assert.equal(report.aggregate.averageRir, null);
  assert.equal(report.aggregate.bestEstimatedStrength, null);
  assert.equal(report.aggregate.duration, null);
  assert.equal(report.adherence.plannedWorkouts, null);
  assert.equal(report.adherence.adherencePercent, null);
  assert.deepEqual(report.personalRecords, []);
  assert.deepEqual(report.insights, ["No completed workout data matches this view."]);
});

test("filters current App-shaped lift history by exercise, muscle, week, workout, and mesocycle", () => {
  assert.equal(filterTrainingHistory(history, { exerciseId: "bench" }).length, 3);
  assert.equal(filterTrainingHistory(history, { exerciseName: "machine chest press" }).length, 3);
  assert.equal(filterTrainingHistory(history, { muscleGroup: "CHEST" }).length, 3);
  assert.equal(filterTrainingHistory(history, { workoutId: "push", weekNumber: 1 }).length, 3);
  assert.equal(filterTrainingHistory(history, { mesocycleId: "meso-a", weekNumber: 2 }).length, 1);
  assert.equal(filterTrainingFeedback(feedback, { muscleGroup: "chest", mesocycleId: "meso-a" }).length, 2);
});

test("exercise summaries calculate load, rep, strength, volume, RIR, and PRs from real sets", () => {
  const report = buildTrainingAnalytics(
    { history, feedback, weightUnit: "lb" },
    { exerciseId: "bench", mesocycleId: "meso-a" }
  );
  const exercise = report.exercises[0];

  assert.equal(report.aggregate.workoutCount, 2);
  assert.equal(report.aggregate.completedSetCount, 5);
  assert.equal(report.aggregate.totalReps, 49);
  assert.equal(report.aggregate.totalVolume, 5120);
  assert.equal(report.aggregate.averageRir, 1.6);
  assert.deepEqual(exercise.loadProgression, {
    first: 100,
    latest: 110,
    change: 10,
    percentChange: 10,
    samples: 2,
  });
  assert.deepEqual(exercise.repProgression, {
    first: 10,
    latest: 12,
    change: 2,
    percentChange: 20,
    samples: 2,
  });
  assert.equal(exercise.estimatedStrengthProgression.first, estimateStrength(100, 10));
  assert.equal(exercise.estimatedStrengthProgression.latest, estimateStrength(110, 12));
  assert.equal(exercise.personalRecords.find((record) => record.metric === "load")?.value, 110);
  assert.equal(exercise.personalRecords.find((record) => record.metric === "reps")?.value, 12);
  assert.equal(exercise.personalRecords.find((record) => record.metric === "session-volume")?.value, 2700);
  assert.match(report.insights[0], /estimated strength rose/);
});

test("workout durations are deduplicated across per-exercise history entries", () => {
  const report = buildTrainingAnalytics({ history }, { mesocycleId: "meso-a" });

  assert.equal(report.aggregate.workoutCount, 2);
  assert.deepEqual(report.aggregate.duration, {
    observedWorkouts: 2,
    totalMinutes: 110,
    averageMinutes: 55,
  });
  assert.equal(report.workouts.find((workout) => workout.sessionKey === "meso-a:1:push")?.duration?.totalMinutes, 60);
});

test("adherence is only calculated when planned workout data is supplied", () => {
  const plannedWorkouts = [
    { sessionKey: "meso-a:1:push", mesocycleId: "meso-a", weekNumber: 1, dayId: "push" },
    { sessionKey: "meso-a:2:push", mesocycleId: "meso-a", weekNumber: 2, dayId: "push" },
    { sessionKey: "meso-a:2:legs", mesocycleId: "meso-a", weekNumber: 2, dayId: "legs", skipped: true },
  ];
  const report = buildTrainingAnalytics({ history, plannedWorkouts }, { mesocycleId: "meso-a" });

  assert.deepEqual(report.adherence, {
    completedWorkouts: 2,
    plannedWorkouts: 3,
    skippedWorkouts: 1,
    inProgressWorkouts: 0,
    adherencePercent: 66.7,
    accountedForPercent: 100,
  });
});

test("feedback summaries retain chronological pump and pain trends", () => {
  const summary = summarizeTrainingFeedback(feedback.filter((record) => record.muscleGroup === "chest"));

  assert.deepEqual(summary.trends.pump, {
    samples: 2,
    average: 3,
    first: 2,
    latest: 4,
    change: 2,
    minimum: 2,
    maximum: 4,
    direction: "rising",
  });
  assert.equal(summary.trends.jointPain.direction, "rising");
  assert.equal(summary.peakJointPain, 2);

  const report = buildTrainingAnalytics({ history, feedback }, { muscleGroup: "chest", mesocycleId: "meso-a" });
  assert.equal(report.feedback.trends.jointPain.latest, 2);
  assert.ok(report.insights.some((insight) => insight.includes("Joint discomfort rose")));
});

test("feedback-only muscles remain available without fabricated training totals", () => {
  const report = buildTrainingAnalytics({
    history: [],
    feedback: [
      {
        muscleGroup: "quads",
        recordedAt: "2026-08-10T18:00:00.000Z",
        soreness: 4,
        jointPain: 1,
      },
    ],
  });

  assert.equal(report.muscles.length, 1);
  assert.equal(report.muscles[0].muscleGroup, "quads");
  assert.equal(report.muscles[0].completedSetCount, 0);
  assert.equal(report.muscles[0].totalVolume, 0);
  assert.equal(report.muscles[0].averageRir, null);
  assert.equal(report.muscles[0].feedback.trends.soreness.latest, 4);
});

test("week and mesocycle breakdowns never merge equal weeks across mesocycles", () => {
  const report = buildTrainingAnalytics({ history, feedback });

  assert.equal(report.mesocycles.length, 2);
  assert.equal(report.weeks.length, 3);
  assert.equal(report.weeks.find((week) => week.key === "meso-a:week:1")?.workoutCount, 1);
  assert.equal(report.weeks.find((week) => week.key === "meso-b:week:1")?.workoutCount, 1);
});
