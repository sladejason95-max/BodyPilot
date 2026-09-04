import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { createServer } from "vite";
import {
  backupNormalizationChanges,
  parseLocalBackup,
  serializeLocalBackup,
  validateBackupState,
} from "../src/app/local_backup.ts";
import {
  createFoodDiaryEntry,
  normalizeFoodDiary,
} from "../src/app/food_diary.ts";
import { createSavedFoodMeal } from "../src/app/food_meals.ts";
import {
  startWorkoutSession,
  updateWorkoutSet,
  pauseWorkoutSession,
  finishWorkoutSession,
} from "../src/app/workout_session.ts";
import { normalizeBodyweightHistory } from "../src/app/bodyweight_history.ts";
import { loadAppStateSafely } from "../src/app/app_state_storage.ts";

let server;
let defaultState;
let normalizeAppState;
let normalizeSavedAppState;
const T0 = "2026-09-03T12:00:00.000Z";
const T1 = "2026-09-03T12:05:00.000Z";
const T2 = "2026-09-03T12:10:00.000Z";
const clone = (state) => JSON.parse(JSON.stringify(state));
const changedPaths = (source, normalized, path = "state") => {
  if (source === normalized || source === undefined) return [];
  if (
    source &&
    normalized &&
    typeof source === "object" &&
    typeof normalized === "object"
  ) {
    if (
      Array.isArray(source) &&
      (!Array.isArray(normalized) || source.length !== normalized.length)
    )
      return [`${path}.length: ${source.length} -> ${normalized.length}`];
    return Object.keys(source).flatMap((key) =>
      changedPaths(source[key], normalized[key], `${path}.${key}`),
    );
  }
  return [
    `${path}: ${JSON.stringify(source)} -> ${JSON.stringify(normalized)}`,
  ];
};

before(async () => {
  // Use the real App module and its own normalizers; no browser, listening port,
  // localStorage, app render or mocked normalization is involved.
  server = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    appType: "custom",
    logLevel: "error",
  });
  ({ defaultState, normalizeAppState, normalizeSavedAppState } =
    await server.ssrLoadModule("/src/app/App.tsx"));
});
after(async () => {
  await server?.close();
});

const currentStateFixture = () => {
  const food = createFoodDiaryEntry(
    {
      label: "Cooked rice",
      servingLabel: "100 g",
      calories: 130,
      protein: 2.7,
      carbs: 28.2,
      fat: 0.3,
    },
    { id: "rice-1", date: "2026-09-03", recordedAt: T0, servings: 1.25 },
  );
  assert.ok(food);
  const meal = createSavedFoodMeal({
    id: "lunch-1",
    name: "Rice lunch",
    items: [food],
    createdAt: T0,
  });
  assert.ok(meal);
  let session = startWorkoutSession(
    {
      mesocycleId: "meso-restore",
      weekNumber: 2,
      dayId: "upper",
      dayLabel: "Thursday",
      workoutName: "Upper body",
      targetRir: 3,
      exercises: [
        {
          id: "press",
          exerciseId: "machine-chest-press",
          name: "Machine chest press",
          muscleGroup: "chest",
          pattern: "Machine",
          sets: [
            {
              id: "press-1",
              recommendedWeight: 65,
              recommendedReps: 8,
              repRange: { low: 6, high: 10 },
              targetRir: 3,
            },
            {
              id: "press-2",
              recommendedWeight: 60,
              recommendedReps: 8,
              repRange: { low: 6, high: 10 },
              targetRir: 3,
            },
          ],
        },
        {
          id: "pull-up",
          exerciseId: "pull-up",
          name: "Pull-up",
          muscleGroup: "back",
          loadRequired: false,
          sets: [
            {
              id: "pull-up-1",
              recommendedWeight: 0,
              recommendedReps: 10,
              targetRir: 3,
            },
          ],
        },
      ],
    },
    T0,
  );
  session = updateWorkoutSet(
    session,
    "press-1",
    { weight: 60, reps: 8, rir: 3, done: true },
    T1,
  );
  session = updateWorkoutSet(
    session,
    "press-2",
    { weight: 52.5, reps: 7, rir: 2 },
    T1,
  );
  session = pauseWorkoutSession(session, T2);
  const history = {
    id: "history-1",
    completedAt: "2026-09-01T12:30:00.000Z",
    mesocycleId: "meso-restore",
    weekNumber: 1,
    sessionKey: "meso-restore:1:upper",
    dayId: "upper",
    dayFocus: "Upper body",
    liftId: "press",
    exerciseId: "machine-chest-press",
    liftName: "Machine chest press",
    muscleGroup: "chest",
    sets: [{ weight: 60, reps: 8, rir: 3, skipped: false }],
    topSet: { weight: 60, reps: 8, rir: 3, skipped: false },
    estimatedOneRepMax: 76,
    totalVolume: 480,
    durationSec: 1800,
    sessionStartedAt: "2026-09-01T12:00:00.000Z",
  };
  return {
    ...clone(defaultState),
    mesocycleId: "meso-restore",
    mesoStartedAt: "2026-09-01T00:00:00.000Z",
    currentWeek: 2,
    foodLog: [
      food,
      ...normalizeFoodDiary([
        {
          id: "undated-food",
          label: "Older rice",
          servingLabel: "100 g",
          calories: 130,
          protein: 2.7,
          carbs: 28.2,
          fat: 0.3,
        },
      ]),
    ],
    savedFoodMeals: [meal],
    workoutSessions: { [session.sessionKey]: session },
    workoutHistory: [history],
    workoutLog: {
      "meso-restore:2:upper:press": [
        {
          id: "press-1",
          weight: 60,
          reps: 8,
          rir: 3,
          done: true,
          skipped: false,
        },
        {
          id: "press-2",
          weight: 52.5,
          reps: 7,
          rir: 2,
          done: false,
          skipped: false,
        },
      ],
    },
    bodyWeightHistory: normalizeBodyweightHistory([
      { id: "weight-1", date: "2026-09-02", weightLb: 185.5, recordedAt: null },
    ]),
    painfulExercises: ["machine-chest-press"],
    exerciseLoadIncrements: { "id:machine-chest-press": 1.25, "id:pull-up": 0 },
    recoveryCheckins: {
      "meso-restore:2:upper:chest": {
        id: "recovery-1",
        sessionKey: "meso-restore:2:upper",
        muscleGroup: "chest",
        checkedAt: T0,
        soreness: 2,
        readiness: 1,
        jointPain: 3,
        performanceExpectation: "below",
        skipped: false,
      },
    },
    activeDayId: "upper",
    workoutPaused: true,
    restTimer: {
      sessionKey: session.sessionKey,
      liftId: "press",
      setId: "press-1",
      startedAt: Date.parse(T1),
      endsAt: Date.parse(T1) + 120_000,
      durationSec: 120,
      pausedRemainingSec: 50,
    },
  };
};

const restoreRoundTrip = (state, legacy = false) => {
  const parsed = parseLocalBackup(
    legacy ? JSON.stringify(state) : serializeLocalBackup(state, T2),
  );
  const normalized = normalizeAppState(parsed.state);
  assert.deepEqual(
    backupNormalizationChanges(parsed.state, normalized),
    [],
    `A valid exported state must restore without changing supplied values: ${changedPaths(parsed.state, normalized).join("; ")}`,
  );
  return normalized;
};

test("fresh current App default state can be exported and restored", () => {
  restoreRoundTrip(defaultState);
});

test("strict saved-state startup accepts legitimate current records without changing supplied values", () => {
  for (const state of [clone(defaultState), clone(currentStateFixture())]) {
    assert.deepEqual(
      backupNormalizationChanges(state, normalizeSavedAppState(state)),
      [],
    );
  }
});

test("released schema-4 food diaries from before saved meals open without changing existing records", () => {
  // Release 801c3932 already used schema 4 / diary 1, but savedFoodMeals
  // was introduced later in bf01267d without a schema-version change.
  const source = clone(currentStateFixture());
  delete source.savedFoodMeals;
  delete source.trackerProgram;
  delete source.completedMesoIds;
  delete source.workoutDateOverrides;
  const raw = JSON.stringify(source);
  const loaded = loadAppStateSafely({
    storage: { getItem: () => raw }, key: "bodypilot-ai-v4",
    defaultState, normalize: normalizeSavedAppState,
  });
  assert.equal(loaded.problem, null);
  assert.deepEqual(loaded.state.savedFoodMeals, []);
  assert.deepEqual(backupNormalizationChanges(source, loaded.state), []);
  assert.deepEqual(loaded.state.foodLog, source.foodLog);
  assert.deepEqual(loaded.state.workoutHistory, source.workoutHistory);
  assert.equal(JSON.stringify(source), raw, "Startup must not mutate the original record");
  assert.throws(() => validateBackupState(source), /savedFoodMeals/,
    "Backup imports still require their declared collections");
  assert.doesNotThrow(() => normalizeSavedAppState(JSON.parse(JSON.stringify(loaded.state))));
});

test("the saved-meals startup migration accepts absence only, not a malformed supplied collection", () => {
  for (const savedFoodMeals of [undefined, null, {}, ""]) {
    const source = { ...clone(defaultState), savedFoodMeals };
    assert.throws(() => normalizeSavedAppState(source), /savedFoodMeals/);
  }
});

test("migrated workout provenance survives saving and repeated real startup loads", () => {
  const migrated = normalizeSavedAppState({
    ...clone(defaultState),
    schemaVersion: 3,
    mesocycleId: "meso-import",
    mesoStartedAt: "2026-08-01T00:00:00.000Z",
    trackerDays: [{
      id: "tracked-one",
      date: "2026-08-05",
      title: "Push",
      closedAt: "2026-08-05T18:00:00.000Z",
      lifts: [{
        id: "bench-row", name: "Barbell Bench Press", completed: true,
        actualSets: "3", actualReps: "10, 9, 8", weight: "225", rpe: "8, 9, 9",
      }],
    }],
  });
  assert.equal(migrated.workoutHistory[0].source, "legacy-tracker");
  let raw = JSON.stringify(migrated);
  for (let reload = 0; reload < 3; reload++) {
    const source = JSON.parse(raw);
    const loaded = loadAppStateSafely({
      storage: { getItem: () => raw }, key: "bodypilot-ai-v4",
      defaultState, normalize: normalizeSavedAppState,
    });
    assert.equal(loaded.problem, null, "The app's own migrated records must open normally");
    assert.deepEqual(backupNormalizationChanges(source, loaded.state), []);
    assert.equal(loaded.state.workoutHistory[0].source, "legacy-tracker");
    assert.equal(loaded.state.workoutHistory[0].totalVolume, 6075);
    assert.equal(loaded.state.workoutHistory.length, 1);
    raw = JSON.stringify(loaded.state);
  }
});

test("workout history preserves JSON metadata on entries, individual sets and top sets", () => {
  const state = clone(currentStateFixture());
  state.workoutHistory[0].source = "legacy-tracker";
  state.workoutHistory[0].importContext = { version: 1, notes: ["Imported workout"] };
  state.workoutHistory[0].sets[0].effortSource = { method: "manual", confidence: null };
  state.workoutHistory[0].topSet.equipmentNote = "Machine stack";
  const normalized = normalizeSavedAppState(state);
  assert.deepEqual(normalized.workoutHistory, state.workoutHistory);
  restoreRoundTrip(state);
});

test("preserving workout metadata does not permit malformed performance values", () => {
  for (const mutate of [
    (h) => { h.sets[0].weight = "invalid"; },
    (h) => { h.sets[0].reps = null; },
    (h) => { h.sets[0].rir = 99; },
    (h) => { h.topSet.weight = "60"; },
    (h) => { h.topSet.reps = { count: 8 }; },
  ]) {
    const state = clone(currentStateFixture());
    state.workoutHistory[0].source = "legacy-tracker";
    mutate(state.workoutHistory[0]);
    const original = JSON.stringify(state);
    assert.throws(() => normalizeSavedAppState(state), /workoutHistory|invalid number/);
    assert.equal(JSON.stringify(state), original);
  }
});

test("strict saved-state startup rejects damaged records rather than silently loading a partial replacement", () => {
  for (const mutate of [
    (state) => {
      state.foodLog[0].date = "2026-02-30";
    },
    (state) => {
      state.workoutHistory[0].liftName = "";
    },
    (state) => {
      state.workoutSessions["meso-restore:2:upper"].exercises = [];
    },
    (state) => {
      state.bodyWeightHistory[0].weightLb = -1;
    },
    (state) => {
      state.savedFoodMeals = null;
    },
  ]) {
    const state = clone(currentStateFixture());
    mutate(state);
    const original = JSON.stringify(state);
    assert.throws(() => normalizeSavedAppState(state));
    assert.equal(
      JSON.stringify(state),
      original,
      "A failed load must not mutate its source",
    );
  }
});

test("editable profile boundaries and supported fractional preferences survive strict startup", () => {
  const state = {
    ...clone(defaultState),
    age: 13,
    heightIn: 48,
    bodyWeightLb: 70,
    targetWeightLb: 500,
    sessionsPerWeek: 3,
    sessionMinutes: 20,
    currentWeek: 1,
    mesoLengthWeeks: 3,
    steps: 0,
    sleepHours: 14,
    energy: 1,
    soreness: 10,
    weightIncrement: 25,
    exerciseLoadIncrements: { "id:press": 0.5, "id:pull-up": 0 },
    availableTrainingDays: ["mon"],
  };
  assert.deepEqual(
    backupNormalizationChanges(state, normalizeSavedAppState(state)),
    [],
  );
  restoreRoundTrip(state);
});

test("real current food, meals, history, paused session, partial draft and safety constraints survive restore", () => {
  const state = currentStateFixture();
  const restored = restoreRoundTrip(state);
  assert.deepEqual(clone(restored.foodLog), clone(state.foodLog));
  assert.deepEqual(clone(restored.savedFoodMeals), clone(state.savedFoodMeals));
  assert.deepEqual(clone(restored.workoutHistory), clone(state.workoutHistory));
  const session = restored.workoutSessions["meso-restore:2:upper"];
  assert.equal(session.status, "paused");
  assert.equal(session.setLogs["press-1"].weight, 60);
  assert.equal(session.exercises[0].prescriptions[0].recommendedWeight, 65);
  assert.equal(session.setLogs["press-2"].weight, 52.5);
  assert.equal(session.setLogs["press-2"].done, false);
  assert.equal(session.setLogs["press-2"].inputEdited, true);
  assert.equal(restored.foodLog[1].date, null);
  assert.equal(
    restored.recoveryCheckins["meso-restore:2:upper:chest"].jointPain,
    3,
  );
});

test("a prior-release schema-4 raw tab copy allows added optional normalization metadata", () => {
  const state = clone(currentStateFixture());
  delete state.workoutSessions["meso-restore:2:upper"].setLogs["press-2"]
    .inputEdited;
  delete state.workoutLog["meso-restore:2:upper:press"][0].skipped;
  const restored = restoreRoundTrip(state, true);
  assert.equal(
    restored.workoutSessions["meso-restore:2:upper"].setLogs["press-2"]
      .inputEdited,
    true,
  );
  assert.equal(
    restored.workoutLog["meso-restore:2:upper:press"][0].skipped,
    false,
  );
});

test("completed workouts retain set-level timestamps, actuals, and skipped resolutions", () => {
  const state = currentStateFixture();
  const key = "meso-restore:2:upper";
  const result = finishWorkoutSession(state.workoutSessions[key], {
    now: "2026-09-03T12:15:00.000Z",
    skipIncomplete: true,
  });
  assert.equal(result.completed, true);
  state.workoutSessions[key] = result.session;
  state.activeDayId = null;
  state.workoutPaused = false;
  state.restTimer = null;
  const restored = restoreRoundTrip(state);
  assert.equal(restored.workoutSessions[key].setLogs["press-1"].updatedAt, T1);
  assert.equal(restored.workoutSessions[key].setLogs["press-2"].skipped, true);
});

test("valid 4.5 and 5 RIR selections survive actual log and history normalization", () => {
  const state = clone(currentStateFixture());
  state.workoutSessions["meso-restore:2:upper"].setLogs["press-1"].rir = 5;
  state.workoutLog["meso-restore:2:upper:press"][0].rir = 5;
  state.workoutHistory[0].sets[0].rir = 4.5;
  state.workoutHistory[0].topSet.rir = 4.5;
  restoreRoundTrip(state);
});

test("restore never truncates current training histories at 480 records", () => {
  const state = currentStateFixture();
  state.workoutHistory = Array.from({ length: 700 }, (_, i) => ({
    ...state.workoutHistory[0],
    id: `history-${i}`,
  }));
  assert.equal(restoreRoundTrip(state).workoutHistory.length, 700);
});

test("an intentionally empty schedule stays empty after backup and restore", () => {
  const state = { ...clone(defaultState), scheduleItems: [] };
  assert.deepEqual(restoreRoundTrip(state).scheduleItems, []);
});

test("explicit unchecked schedule and skipped-workout flags survive restore", () => {
  const state = {
    ...clone(defaultState),
    scheduleCheckoffs: { "2026-09-03:reminder": false },
    skippedWorkouts: { "meso-restore:2:upper": false },
  };
  restoreRoundTrip(state);
});

test("preserved workout metadata does not mask invalid food records", () => {
  const state = clone(currentStateFixture());
  state.workoutHistory[0].futureMetric = 123;
  state.foodLog[0].date = "2026-02-30";
  const parsed = parseLocalBackup(serializeLocalBackup(state, T2));
  assert.deepEqual(
    backupNormalizationChanges(parsed.state, normalizeAppState(parsed.state)),
    ["foodLog"],
  );
  assert.equal(normalizeAppState(parsed.state).workoutHistory[0].futureMetric, 123);
});
