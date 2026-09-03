import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKOUT_SESSION_SCHEMA_VERSION,
  addWorkoutSet,
  createWorkoutSessionId,
  finishWorkoutSession,
  migrateLegacyWorkoutSession,
  normalizeWorkoutSession,
  pauseWorkoutSession,
  moveWorkoutExercise,
  removeWorkoutSet,
  replaceWorkoutExercise,
  resumeWorkoutSession,
  sessionSetLogsForExercise,
  skipWorkoutSet,
  startWorkoutSession,
  updateWorkoutSet,
  upsertSessionFeedback,
  validateWorkoutSessionCompletion,
} from "../src/app/workout_session.ts";

const T0 = "2026-09-03T12:00:00.000Z";
const T1 = "2026-09-03T12:05:00.000Z";
const T2 = "2026-09-03T12:10:00.000Z";
const T3 = "2026-09-03T12:15:00.000Z";

const sessionInput = () => ({
  mesocycleId: "meso-7",
  weekNumber: 3,
  dayId: "push-a",
  dayLabel: "Thursday",
  workoutName: "Chest and shoulders",
  targetRir: 2,
  exercises: [
    {
      id: "machine-press",
      name: "Machine Chest Press",
      muscleGroup: "chest",
      pattern: "Horizontal press",
      target: "mid chest",
      sets: 2,
      reps: "8-12",
    },
  ],
});

test("startWorkoutSession creates a stable, frozen prescription snapshot", () => {
  const input = sessionInput();
  const session = startWorkoutSession(input, T0);

  assert.equal(session.schemaVersion, WORKOUT_SESSION_SCHEMA_VERSION);
  assert.equal(session.id, createWorkoutSessionId("meso-7", 3, "push-a"));
  assert.equal(session.sessionKey, "meso-7:3:push-a");
  assert.equal(session.status, "active");
  assert.equal(session.startedAt, T0);
  assert.equal(session.updatedAt, T0);
  assert.equal(session.pausedDurationSec, 0);
  assert.equal(session.completedAt, null);
  assert.equal(session.exercises[0].prescriptions.length, 2);
  assert.deepEqual(session.exercises[0].prescriptions[0].repRange, { low: 8, high: 12 });
  assert.equal(session.setLogs["machine-press-set-1"].reps, 8);
  assert.equal(session.setLogs["machine-press-set-1"].done, false);
  assert.equal(Object.isFrozen(session.exercises), true);
  assert.equal(Object.isFrozen(session.exercises[0]), true);
  assert.equal(Object.isFrozen(session.exercises[0].prescriptions[0]), true);

  input.exercises[0].name = "Changed plan name";
  assert.equal(session.exercises[0].name, "Machine Chest Press");
  assert.equal(startWorkoutSession(sessionInput(), T3).id, session.id);
});

test("updateWorkoutSet is immutable, clamps unsafe input, and records completion", () => {
  const original = startWorkoutSession(sessionInput(), T0);
  const updated = updateWorkoutSet(
    original,
    "machine-press-set-1",
    { weight: 105, reps: 10, rir: 9, done: true },
    T1
  );

  assert.notEqual(updated, original);
  assert.equal(original.setLogs["machine-press-set-1"].done, false);
  assert.deepEqual(
    {
      weight: updated.setLogs["machine-press-set-1"].weight,
      reps: updated.setLogs["machine-press-set-1"].reps,
      rir: updated.setLogs["machine-press-set-1"].rir,
      done: updated.setLogs["machine-press-set-1"].done,
      completedAt: updated.setLogs["machine-press-set-1"].completedAt,
    },
    { weight: 105, reps: 10, rir: 5, done: true, completedAt: T1 }
  );
  assert.equal(updated.updatedAt, T1);
  assert.equal(updated.revision, 1);
  assert.equal(updated.exercises, original.exercises);

  const corrected = updateWorkoutSet(updated, "machine-press-set-1", { weight: 110, reps: 11, rir: 2 }, T2);
  assert.equal(corrected.setLogs["machine-press-set-1"].done, true);
  assert.equal(corrected.setLogs["machine-press-set-1"].weight, 110);
  assert.equal(corrected.setLogs["machine-press-set-1"].reps, 11);
  assert.equal(corrected.setLogs["machine-press-set-1"].completedAt, T1);
  assert.equal(corrected.setLogs["machine-press-set-1"].updatedAt, T2);
});

test("pause and resume are monotonic, immutable, and no-op outside valid transitions", () => {
  const active = startWorkoutSession(sessionInput(), T0);
  const paused = pauseWorkoutSession(active, T1);
  const resumed = resumeWorkoutSession(paused, T2);

  assert.equal(paused.status, "paused");
  assert.equal(paused.pausedAt, T1);
  assert.equal(resumed.status, "active");
  assert.equal(resumed.pausedAt, null);
  assert.equal(resumed.pausedDurationSec, 300);
  assert.equal(resumed.updatedAt, T2);
  assert.equal(pauseWorkoutSession(paused, T3), paused);
  assert.equal(resumeWorkoutSession(active, T3), active);
});

test("session feedback is scoped, clamped, and upserted without losing recordedAt", () => {
  const session = startWorkoutSession(sessionInput(), T0);
  const first = upsertSessionFeedback(
    session,
    {
      scope: "exercise",
      exerciseSlotId: "machine-press",
      pump: 9,
      workload: 0,
      notes: "  Strong target-muscle sensation.  ",
    },
    T1
  );
  const second = upsertSessionFeedback(
    first,
    {
      scope: "exercise",
      exerciseSlotId: "machine-press",
      pump: 3,
      jointPain: 2,
    },
    T2
  );

  assert.equal(second.feedbackRecords.length, 1);
  assert.equal(second.feedbackRecords[0].pump, 3);
  assert.equal(second.feedbackRecords[0].workload, 1);
  assert.equal(second.feedbackRecords[0].jointPain, 2);
  assert.equal(second.feedbackRecords[0].recordedAt, T1);
  assert.equal(second.feedbackRecords[0].updatedAt, T2);
  assert.equal(
    upsertSessionFeedback(session, { scope: "exercise", exerciseSlotId: "missing", pump: 3 }, T1),
    session
  );
});

test("finishWorkoutSession blocks empty work and unresolved sets by default", () => {
  const session = startWorkoutSession(sessionInput(), T0);
  const emptyFinish = finishWorkoutSession(session, { now: T1 });
  assert.equal(emptyFinish.completed, false);
  assert.equal(emptyFinish.validation.productiveSets, 0);

  const oneDone = updateWorkoutSet(
    session,
    "machine-press-set-1",
    { weight: 100, reps: 10, rir: 2, done: true },
    T1
  );
  const unresolvedFinish = finishWorkoutSession(oneDone, { now: T2 });
  assert.equal(unresolvedFinish.completed, false);
  assert.equal(unresolvedFinish.validation.canCompleteBySkipping, true);
  assert.deepEqual(unresolvedFinish.validation.incompleteSetIds, ["machine-press-set-2"]);
});

test("finishWorkoutSession can explicitly skip unresolved sets and locks the result", () => {
  const session = updateWorkoutSet(
    startWorkoutSession(sessionInput(), T0),
    "machine-press-set-1",
    { weight: 100, reps: 10, rir: 2, done: true },
    T1
  );
  const result = finishWorkoutSession(session, { now: T2, skipIncomplete: true });

  assert.equal(result.completed, true);
  assert.equal(result.session.status, "completed");
  assert.equal(result.session.completedAt, T2);
  assert.equal(result.session.setLogs["machine-press-set-2"].skipped, true);
  assert.equal(result.validation.canComplete, true);
  assert.equal(updateWorkoutSet(result.session, "machine-press-set-1", { reps: 12 }, T3), result.session);
  assert.equal(finishWorkoutSession(result.session, { now: T3 }).session, result.session);
});

test("finishing a paused workout accounts for the final paused interval", () => {
  const logged = updateWorkoutSet(
    startWorkoutSession(sessionInput(), T0),
    "machine-press-set-1",
    { weight: 100, reps: 10, rir: 2, done: true },
    T1
  );
  const paused = pauseWorkoutSession(logged, T2);
  const result = finishWorkoutSession(paused, { now: T3, skipIncomplete: true });

  assert.equal(result.completed, true);
  assert.equal(result.session.status, "completed");
  assert.equal(result.session.pausedDurationSec, 300);
  assert.equal(result.session.pausedAt, null);
});

test("zero load is valid for bodyweight slots but not external-load slots", () => {
  const bodyweight = startWorkoutSession(
    {
      ...sessionInput(),
      exercises: [
        {
          id: "push-up",
          name: "Push-up",
          muscleGroup: "chest",
          pattern: "Bodyweight press",
          sets: 1,
          reps: "12-20",
        },
      ],
    },
    T0
  );
  const completedBodyweight = updateWorkoutSet(
    bodyweight,
    "push-up-set-1",
    { weight: 0, reps: 15, done: true },
    T1
  );
  assert.equal(validateWorkoutSessionCompletion(completedBodyweight).canComplete, true);

  const external = updateWorkoutSet(
    startWorkoutSession(sessionInput(), T0),
    "machine-press-set-1",
    { weight: 0, reps: 10, done: true },
    T1
  );
  assert.deepEqual(validateWorkoutSessionCompletion(external).invalidCompletedSetIds, ["machine-press-set-1"]);
});

test("normalizeWorkoutSession safely restores a partial persisted session", () => {
  const normalized = normalizeWorkoutSession(
    {
      id: "persisted-session",
      mesocycleId: "meso-7",
      weekNumber: 3,
      dayId: "push-a",
      workoutName: "Persisted push",
      status: "paused",
      startedAt: T0,
      updatedAt: "invalid",
      exercises: [
        {
          id: "machine-press",
          exerciseId: "machine-press",
          name: "Machine Chest Press",
          muscleGroup: "chest",
          pattern: "Horizontal press",
          prescriptions: [
            { id: "machine-press-set-1", repRange: { low: 8, high: 12 }, targetRir: 2 },
          ],
        },
      ],
      setLogs: {
        "machine-press-set-1": { id: "corrupt-id", weight: -50, reps: 10, rpe: 8, done: true },
      },
      feedbackRecords: [{ scope: "session", id: "session-note", notes: "Saved", recordedAt: T0 }],
    },
    { now: T2 }
  );

  assert.ok(normalized);
  assert.equal(normalized.id, "persisted-session");
  assert.equal(normalized.status, "paused");
  assert.equal(normalized.pausedAt, T0);
  assert.equal(normalized.setLogs["machine-press-set-1"].id, "machine-press-set-1");
  assert.equal(normalized.setLogs["machine-press-set-1"].weight, 0);
  assert.equal(normalized.setLogs["machine-press-set-1"].rir, 2);
  assert.equal(normalized.feedbackRecords.length, 1);
  assert.equal(normalizeWorkoutSession(null, { now: T2 }), null);
  assert.equal(normalizeWorkoutSession({}, { now: T2 }), null);
});

test("migrateLegacyWorkoutSession reads current keyed WorkoutSetLog arrays and preserves extra sets", () => {
  const migrated = migrateLegacyWorkoutSession(
    {
      ...sessionInput(),
      workoutPaused: true,
      startedAt: T0,
      updatedAt: T1,
      workoutLog: {
        "meso-7:3:push-a:machine-press": [
          { id: "legacy-set-1", weight: 95, reps: 11, rir: 2, done: true, skipped: false },
          { id: "legacy-set-2", weight: 90, reps: 10, rpe: 8, done: false, skipped: false },
          { id: "legacy-added-set", weight: 85, reps: 9, rir: 3, done: false, skipped: false },
        ],
      },
      feedback: {
        chest: { pump: 3, workload: 3, jointPain: 0, moreSets: true },
      },
    },
    T2
  );

  assert.equal(migrated.status, "paused");
  assert.equal(migrated.exercises[0].prescriptions.length, 3);
  assert.deepEqual(
    sessionSetLogsForExercise(migrated, "machine-press").map(({ id, weight, reps, rir, done }) => ({
      id,
      weight,
      reps,
      rir,
      done,
    })),
    [
      { id: "legacy-set-1", weight: 95, reps: 11, rir: 2, done: true },
      { id: "legacy-set-2", weight: 90, reps: 10, rir: 2, done: false },
      { id: "legacy-added-set", weight: 85, reps: 9, rir: 3, done: false },
    ]
  );
  assert.equal(migrated.feedbackRecords[0].scope, "muscle");
  assert.equal(migrated.feedbackRecords[0].muscleGroup, "chest");
});

test("skipWorkoutSet creates an existing WorkoutSetLog-compatible resolved set", () => {
  const session = startWorkoutSession(sessionInput(), T0);
  const skipped = skipWorkoutSet(session, "machine-press-set-1", T1);
  const log = skipped.setLogs["machine-press-set-1"];

  assert.deepEqual(
    { id: log.id, weight: log.weight, reps: log.reps, rir: log.rir, done: log.done, skipped: log.skipped },
    { id: "machine-press-set-1", weight: 0, reps: 8, rir: 2, done: true, skipped: true }
  );
});

test("session prescriptions support deterministic add and remove operations", () => {
  const session = startWorkoutSession(sessionInput(), T0);
  const added = addWorkoutSet(session, "machine-press", T1, { reps: "10-15", targetRir: 3 });

  assert.equal(added.exercises[0].prescriptions.length, 3);
  assert.deepEqual(added.exercises[0].prescriptions[2].repRange, { low: 10, high: 15 });
  assert.equal(added.setLogs["machine-press-set-3"].rir, 3);

  const removed = removeWorkoutSet(added, "machine-press-set-2", T2);
  assert.equal(removed.exercises[0].prescriptions.length, 2);
  assert.equal(removed.setLogs["machine-press-set-2"], undefined);
  assert.deepEqual(removed.exercises[0].prescriptions.map((item) => item.position), [0, 1]);
});

test("exercise replacement and reordering preserve stable session slots", () => {
  const input = sessionInput();
  input.exercises.push({
    id: "cable-fly",
    name: "Cable Fly",
    muscleGroup: "chest",
    pattern: "Adduction",
    sets: 1,
    reps: "12-15",
  });
  const session = startWorkoutSession(input, T0);
  const replaced = replaceWorkoutExercise(
    session,
    "machine-press",
    { exerciseId: "db-bench", name: "Dumbbell Bench Press", pattern: "Horizontal press" },
    T1
  );

  assert.equal(replaced.exercises[0].id, "machine-press");
  assert.equal(replaced.exercises[0].exerciseId, "db-bench");
  assert.equal(replaced.setLogs["machine-press-set-1"], session.setLogs["machine-press-set-1"]);

  const moved = moveWorkoutExercise(replaced, "cable-fly", -1, T2);
  assert.deepEqual(moved.exercises.map((item) => item.id), ["cable-fly", "machine-press"]);
  assert.deepEqual(moved.exercises.map((item) => item.position), [0, 1]);
});

test("a replacement with incompatible history resets logs and prior prescriptions", () => {
  let session = startWorkoutSession(sessionInput(), T0);
  session = updateWorkoutSet(
    session,
    "machine-press-set-1",
    { weight: 105, reps: 10, rir: 2, done: true },
    T1
  );
  session = upsertSessionFeedback(
    session,
    { scope: "exercise", exerciseSlotId: "machine-press", jointPain: 2 },
    T1
  );

  const replaced = replaceWorkoutExercise(
    session,
    "machine-press",
    { exerciseId: "cable-fly", name: "Cable Fly", pattern: "Adduction" },
    T2,
    { preserveProgression: false }
  );

  assert.equal(replaced.exercises[0].id, "machine-press");
  assert.equal(replaced.exercises[0].exerciseId, "cable-fly");
  assert.equal(replaced.exercises[0].prescriptions[0].recommendedWeight, null);
  assert.equal(replaced.exercises[0].prescriptions[0].previousResult, null);
  assert.deepEqual(
    {
      weight: replaced.setLogs["machine-press-set-1"].weight,
      reps: replaced.setLogs["machine-press-set-1"].reps,
      done: replaced.setLogs["machine-press-set-1"].done,
    },
    { weight: 0, reps: 8, done: false }
  );
  assert.equal(replaced.feedbackRecords.some((record) => record.exerciseSlotId === "machine-press"), false);
});
