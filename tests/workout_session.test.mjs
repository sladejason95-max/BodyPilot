import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKOUT_SESSION_SCHEMA_VERSION,
  addWorkoutSet,
  completeWorkoutSetFromDraft,
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
  workoutSetDraft,
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

const sessionWithTarget = (options = {}) => startWorkoutSession({
  ...sessionInput(),
  exercises: [{
    ...sessionInput().exercises[0],
    loadRequired: options.loadRequired ?? true,
    sets: [{
      id: "target-set",
      reps: "8-12",
      recommendedWeight: options.weight ?? 105,
      recommendedReps: 11,
      targetRir: 2,
    }],
  }],
}, T0);

test("untouched drafts display frozen targets without recording completed or productive work", () => {
  const session = sessionWithTarget();
  const savedBeforeReading = JSON.stringify(session);
  const draft = workoutSetDraft(session, "target-set");
  assert.deepEqual(draft, {
    id: "target-set", weight: 105, reps: 11, rir: 2, done: false, skipped: false,
  });
  assert.equal(Object.isFrozen(draft), true);
  assert.equal(JSON.stringify(session), savedBeforeReading);
  assert.equal(session.setLogs["target-set"].weight, 0);
  assert.equal(session.setLogs["target-set"].reps, 8);
  assert.equal(session.setLogs["target-set"].inputEdited, false);
  const validation = validateWorkoutSessionCompletion(session);
  assert.equal(validation.productiveSets, 0);
  assert.equal(validation.resolvedSets, 0);
  assert.equal(validation.canComplete, false);
  assert.equal(finishWorkoutSession(session, { now: T1 }).completed, false);
});

test("one confirmation atomically records the entire visible target and is idempotent", () => {
  const session = sessionWithTarget();
  const completed = completeWorkoutSetFromDraft(session, "target-set", T1);
  assert.equal(session.setLogs["target-set"].done, false);
  assert.equal(completed.revision, session.revision + 1);
  assert.deepEqual(workoutSetDraft(completed, "target-set"), {
    id: "target-set", weight: 105, reps: 11, rir: 2, done: true, skipped: false,
  });
  assert.equal(completed.setLogs["target-set"].completedAt, T1);
  assert.equal(completed.setLogs["target-set"].inputEdited, true);
  assert.equal(validateWorkoutSessionCompletion(completed).productiveSets, 1);
  assert.equal(validateWorkoutSessionCompletion(completed).canComplete, true);
  assert.equal(completeWorkoutSetFromDraft(completed, "target-set", T2), completed);
  assert.equal(completed.exercises, session.exercises);
});

test("manual draft edits override the target through reload and one confirmation", () => {
  const session = sessionWithTarget();
  const edited = updateWorkoutSet(session, "target-set", {
    ...workoutSetDraft(session, "target-set"), weight: 95, reps: 9, rir: 3,
  }, T1);
  assert.equal(edited.setLogs["target-set"].inputEdited, true);
  assert.equal(edited.setLogs["target-set"].done, false);
  const restored = normalizeWorkoutSession(JSON.parse(JSON.stringify(edited)), { now: T2 });
  assert.ok(restored);
  assert.deepEqual(workoutSetDraft(restored, "target-set"), {
    id: "target-set", weight: 95, reps: 9, rir: 3, done: false, skipped: false,
  });
  const completed = completeWorkoutSetFromDraft(restored, "target-set", T2);
  assert.equal(completed.setLogs["target-set"].weight, 95);
  assert.equal(completed.setLogs["target-set"].reps, 9);
  assert.equal(completed.setLogs["target-set"].rir, 3);
  assert.equal(completed.setLogs["target-set"].done, true);
});

test("any explicit numeric-field patch marks entry, even when equal to old defaults", () => {
  for (const patch of [{ weight: 0 }, { reps: 8 }, { rir: 2 }]) {
    const edited = updateWorkoutSet(sessionWithTarget(), "target-set", patch, T1);
    assert.equal(edited.setLogs["target-set"].inputEdited, true);
    assert.equal(workoutSetDraft(edited, "target-set").weight, 0);
    const restored = normalizeWorkoutSession(JSON.parse(JSON.stringify(edited)), { now: T2 });
    assert.equal(restored.setLogs["target-set"].inputEdited, true);
    assert.equal(workoutSetDraft(restored, "target-set").weight, 0);
  }
});

test("explicit zero bodyweight edits survive reload even when matching legacy default values", () => {
  const initial = sessionWithTarget({ loadRequired: false, weight: 5 });
  const edited = updateWorkoutSet(initial, "target-set", { weight: 0, reps: 8, rir: 2 }, T1);
  const restored = normalizeWorkoutSession(JSON.parse(JSON.stringify(edited)), { now: T2 });
  assert.ok(restored);
  assert.deepEqual(workoutSetDraft(restored, "target-set"), {
    id: "target-set", weight: 0, reps: 8, rir: 2, done: false, skipped: false,
  });
  const completed = completeWorkoutSetFromDraft(restored, "target-set", T2);
  assert.equal(completed.setLogs["target-set"].weight, 0);
  assert.equal(completed.setLogs["target-set"].reps, 8);
  assert.equal(validateWorkoutSessionCompletion(completed).canComplete, true);
});

test("one confirmation rejects missing required load and zero reps without mutating or completing", () => {
  const noLoad = sessionWithTarget({ weight: 0 });
  assert.equal(completeWorkoutSetFromDraft(noLoad, "target-set", T1), noLoad);
  assert.equal(noLoad.setLogs["target-set"].done, false);
  const invalidReps = updateWorkoutSet(sessionWithTarget(), "target-set", {
    weight: 100, reps: 0, rir: 2,
  }, T1);
  assert.equal(completeWorkoutSetFromDraft(invalidReps, "target-set", T2), invalidReps);
  assert.equal(invalidReps.setLogs["target-set"].completedAt, null);
  const optionalLoad = sessionWithTarget({ loadRequired: false, weight: 0 });
  assert.equal(completeWorkoutSetFromDraft(optionalLoad, "target-set", T1).setLogs["target-set"].done, true);
});

test("one confirmation is unavailable when paused, completed, skipped, or missing", () => {
  const initial = sessionWithTarget();
  const paused = pauseWorkoutSession(initial, T1);
  assert.equal(completeWorkoutSetFromDraft(paused, "target-set", T2), paused);
  const resumed = resumeWorkoutSession(paused, T2);
  assert.equal(completeWorkoutSetFromDraft(resumed, "target-set", T3).setLogs["target-set"].done, true);
  const skipped = skipWorkoutSet(initial, "target-set", T1);
  assert.equal(completeWorkoutSetFromDraft(skipped, "target-set", T2), skipped);
  const completed = finishWorkoutSession(completeWorkoutSetFromDraft(initial, "target-set", T1), { now: T2 }).session;
  assert.equal(completeWorkoutSetFromDraft(completed, "target-set", T3), completed);
  assert.equal(workoutSetDraft(initial, "missing"), null);
  assert.equal(completeWorkoutSetFromDraft(initial, "missing", T1), initial);
});

test("undo and reload preserve confirmed actuals instead of reapplying a prescription", () => {
  const original = sessionWithTarget();
  const edited = updateWorkoutSet(original, "target-set", { weight: 90, reps: 9, rir: 3 }, T1);
  const completed = completeWorkoutSetFromDraft(edited, "target-set", T2);
  const undone = updateWorkoutSet(completed, "target-set", { done: false }, T3);
  assert.equal(undone.setLogs["target-set"].completedAt, null);
  assert.equal(undone.setLogs["target-set"].inputEdited, true);
  const restored = normalizeWorkoutSession(JSON.parse(JSON.stringify(undone)), { now: T3 });
  assert.ok(restored);
  assert.deepEqual(workoutSetDraft(restored, "target-set"), {
    id: "target-set", weight: 90, reps: 9, rir: 3, done: false, skipped: false,
  });
  assert.equal(validateWorkoutSessionCompletion(restored).productiveSets, 0);
});

test("done-only legacy updates never invent target values and undo never reapplies them", () => {
  const original = sessionWithTarget();
  const legacyDone = updateWorkoutSet(original, "target-set", { done: true }, T1);
  assert.equal(legacyDone.setLogs["target-set"].weight, 0);
  assert.equal(legacyDone.setLogs["target-set"].reps, 8);
  assert.equal(legacyDone.setLogs["target-set"].inputEdited, true);
  assert.equal(validateWorkoutSessionCompletion(legacyDone).productiveSets, 0);
  const undone = updateWorkoutSet(legacyDone, "target-set", { done: false }, T2);
  assert.equal(workoutSetDraft(undone, "target-set").weight, 0);
  assert.equal(completeWorkoutSetFromDraft(undone, "target-set", T3), undone);
});

test("legacy normalization distinguishes untouched logs from entered or resolved values", () => {
  const targetSession = sessionWithTarget();
  const source = JSON.parse(JSON.stringify(targetSession));
  delete source.setLogs["target-set"].inputEdited;
  const untouched = normalizeWorkoutSession(source, { now: T1 });
  assert.equal(untouched.setLogs["target-set"].inputEdited, false);
  assert.equal(workoutSetDraft(untouched, "target-set").weight, 105);

  for (const patch of [
    { weight: 90 },
    { reps: 9 },
    { rir: 3 },
    { done: true },
    { skipped: true },
  ]) {
    const changed = JSON.parse(JSON.stringify(source));
    Object.assign(changed.setLogs["target-set"], patch);
    const restored = normalizeWorkoutSession(changed, { now: T1 });
    assert.equal(restored.setLogs["target-set"].inputEdited, true);
    assert.equal(workoutSetDraft(restored, "target-set").weight, patch.weight ?? 0);
  }
});

test("untouched draft targets survive pause and reload without becoming actuals", () => {
  const paused = pauseWorkoutSession(sessionWithTarget(), T1);
  const restored = normalizeWorkoutSession(JSON.parse(JSON.stringify(paused)), { now: T2 });
  assert.ok(restored);
  assert.equal(restored.status, "paused");
  assert.equal(restored.setLogs["target-set"].inputEdited, false);
  assert.equal(restored.setLogs["target-set"].weight, 0);
  assert.equal(workoutSetDraft(restored, "target-set").weight, 105);
  assert.equal(validateWorkoutSessionCompletion(restored).productiveSets, 0);
});

test("new and incompatible replacement sets begin with untouched drafts", () => {
  const initial = sessionWithTarget();
  const added = addWorkoutSet(initial, "machine-press", T1, { id: "added-set", recommendedWeight: 95 });
  assert.equal(added.setLogs["added-set"].inputEdited, false);
  assert.equal(added.setLogs["added-set"].weight, 0);
  assert.equal(workoutSetDraft(added, "added-set").weight, 95);
  const edited = updateWorkoutSet(added, "target-set", { weight: 100 }, T1);
  const replaced = replaceWorkoutExercise(edited, "machine-press", {
    exerciseId: "cable-fly", name: "Cable Fly",
  }, T2, { preserveProgression: false });
  assert.equal(replaced.setLogs["target-set"].inputEdited, false);
  assert.equal(workoutSetDraft(replaced, "target-set").weight, 0);
  assert.equal(workoutSetDraft(replaced, "target-set").done, false);
});
