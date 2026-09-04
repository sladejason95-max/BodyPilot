import assert from "node:assert/strict";
import test from "node:test";
import {
  backupNormalizationChanges,
  createLocalBackup,
  LOCAL_BACKUP_FORMAT,
  MAX_LOCAL_BACKUP_BYTES,
  parseLocalBackup,
  serializeLocalBackup,
  validateBackupState,
} from "../src/app/local_backup.ts";

const exportedAt = "2026-09-03T12:34:56.000Z";
const stateFixture = () => ({
  schemaVersion: 4,
  foodDiaryVersion: 1,
  theme: "dark",
  goal: "recomposition",
  sex: "male",
  age: 32,
  heightIn: 70,
  bodyWeightLb: 185.5,
  targetWeightLb: 178,
  sessionsPerWeek: 5,
  sessionMinutes: 60,
  currentWeek: 2,
  mesoLengthWeeks: 5,
  mesocycleId: "meso-2026-09-01",
  foodLog: [
    {
      id: "food-1",
      date: "2026-09-02",
      label: "Rice",
      servings: 0.5,
      calories: 100,
      protein: 2,
      carbs: 23,
      fat: 0,
      baseNutrients: { calories: 200, protein: 4, carbs: 46, fat: 0 },
    },
  ],
  savedFoodMeals: [
    {
      id: "meal-1",
      name: "Regular lunch",
      items: [{ label: "Rice", servings: 0.5, calories: 100 }],
    },
  ],
  workoutHistory: [
    {
      id: "history-1",
      liftId: "lift-1",
      exerciseId: "squat",
      sets: [{ weight: 60, reps: 8, rir: 3 }],
    },
  ],
  bodyWeightHistory: [{ id: "measure-1", date: "2026-09-02", weightLb: 185.5 }],
  workoutLog: {
    "session::lift": [{ id: "set-1", weight: 60, reps: 8, rir: 3, done: true }],
  },
  workoutSessions: {
    "session-1": {
      schemaVersion: 1,
      status: "paused",
      exercises: [
        {
          id: "lift-1",
          prescriptions: [
            { id: "set-1", recommendedWeight: 65, recommendedReps: 8 },
          ],
        },
      ],
      setLogs: {
        "set-1": { weight: 60, reps: 8, rir: 3, done: true, inputEdited: true },
      },
    },
  },
  recoveryCheckins: { "session-1::quads": { jointPain: 3, skipped: false } },
  scheduleItems: [
    { id: "schedule-1", day: "mon", type: "training", title: "Lower" },
  ],
  availableTrainingDays: ["mon", "wed", "fri"],
  musclePriorities: { quads: "high" },
  muscleFeedback: { quads: { soreness: 2 } },
  customSplit: [{ id: "lower", lifts: [{ exerciseId: "squat" }] }],
  exerciseLoadIncrements: { "id:squat": 1.25, "id:pull-up": 0 },
  painfulExercises: ["squat"],
  customDataFromThisVersion: { notes: "Preserve opaque canonical values too" },
  legacyNutritionTotals: undefined,
});

test("versioned backup round-trips every canonical record and setting without changing actuals", () => {
  const state = stateFixture();
  const result = parseLocalBackup(serializeLocalBackup(state, exportedAt));
  assert.deepEqual(result.state, JSON.parse(JSON.stringify(state)));
  assert.equal(result.source, "versioned");
  assert.equal(result.version, 1);
  assert.equal(result.exportedAt, exportedAt);
  assert.deepEqual(
    result.counts.map((row) => row.count),
    [1, 1, 1, 1, 1, 1],
  );
  assert.equal(
    result.state.workoutSessions["session-1"].setLogs["set-1"].weight,
    60,
  );
  assert.equal(
    result.state.workoutSessions["session-1"].exercises[0].prescriptions[0]
      .recommendedWeight,
    65,
  );
});

test("exports are immutable snapshots, not references into live state", () => {
  const state = stateFixture();
  const backup = createLocalBackup(state, exportedAt);
  state.foodLog[0].calories = 999;
  state.exerciseLoadIncrements["id:squat"] = 5;
  assert.equal(backup.state.foodLog[0].calories, 100);
  assert.equal(backup.state.exerciseLoadIncrements["id:squat"], 1.25);
  backup.state.bodyWeightHistory[0].weightLb = 190;
  assert.equal(state.bodyWeightHistory[0].weightLb, 185.5);
});

test("prior-release raw tab copies are recognized without guessing an export date", () => {
  const raw = JSON.stringify(stateFixture());
  const parsed = parseLocalBackup(raw);
  assert.equal(parsed.source, "legacy-tab-copy");
  assert.equal(parsed.exportedAt, null);
  assert.equal(parsed.version, null);
  assert.deepEqual(parsed.state, JSON.parse(raw));
  assert.deepEqual(parseLocalBackup("\uFEFF" + raw).state, parsed.state);
});

test("arbitrary JSON, arrays, malformed JSON and older unrelated app formats are rejected", () => {
  for (const text of [
    "",
    "{",
    "null",
    "[]",
    '"bodypilot"',
    "{}",
    '{"schemaVersion":4}',
    '{"workoutSplit":[],"trackerDays":[]}',
  ]) {
    assert.throws(() => parseLocalBackup(text));
  }
});

test("wrong app, unsupported envelope and future state versions cannot be imported", () => {
  const backup = createLocalBackup(stateFixture(), exportedAt);
  for (const patch of [
    { format: "other-app" },
    { version: 2 },
    { version: 0 },
    { stateSchemaVersion: 5 },
    { state: { ...backup.state, schemaVersion: 5 } },
  ]) {
    assert.throws(() =>
      parseLocalBackup(JSON.stringify({ ...backup, ...patch })),
    );
  }
  assert.throws(
    () => validateBackupState({ ...stateFixture(), schemaVersion: 5 }),
    /newer/,
  );
  assert.equal(backup.format, LOCAL_BACKUP_FORMAT);
});

test("export dates must be valid timestamps, not rolled-over calendar dates", () => {
  for (const date of [
    "not a date",
    "2026-09-03",
    "2026-02-30T12:00:00.000Z",
    "2026-09-03T25:00:00.000Z",
  ]) {
    assert.throws(() => createLocalBackup(stateFixture(), date), /date/);
    const backup = {
      ...createLocalBackup(stateFixture(), exportedAt),
      exportedAt: date,
    };
    assert.throws(() => parseLocalBackup(JSON.stringify(backup)), /date/);
  }
  assert.equal(
    createLocalBackup(stateFixture(), "2026-09-03T12:00:00Z").exportedAt,
    "2026-09-03T12:00:00.000Z",
  );
});

test("missing collections, wrong profile types and malformed records are rejected", () => {
  for (const patch of [
    { foodLog: null },
    { foodLog: [null] },
    { savedFoodMeals: undefined },
    { workoutLog: { lift: "not a set list" } },
    { workoutSessions: [] },
    { workoutSessions: { a: null } },
    { recoveryCheckins: { a: false } },
    { age: "32" },
    { theme: "purple" },
    { foodDiaryVersion: 2 },
  ]) {
    assert.throws(() =>
      parseLocalBackup(JSON.stringify({ ...stateFixture(), ...patch })),
    );
  }
});

test("size checks use UTF-8 bytes and prevent unreadable oversized exports", () => {
  assert.throws(
    () => parseLocalBackup(" ".repeat(MAX_LOCAL_BACKUP_BYTES + 1)),
    /large/,
  );
  assert.throws(
    () =>
      parseLocalBackup(
        JSON.stringify({ text: "🍚".repeat(MAX_LOCAL_BACKUP_BYTES / 4) }),
      ),
    /large/,
  );
  assert.throws(
    () =>
      serializeLocalBackup(
        { ...stateFixture(), notes: "a".repeat(MAX_LOCAL_BACKUP_BYTES) },
        exportedAt,
      ),
    /limit/,
  );
});

test("unsafe keys, nonfinite values and excessive nesting cannot enter a backup", () => {
  const raw = JSON.stringify(stateFixture());
  for (const key of ["__proto__", "constructor", "prototype"]) {
    assert.throws(
      () => parseLocalBackup(raw.replace(/}$/, `,"notes":{"${key}":{}}}`)),
      /unsafe/,
    );
  }
  for (const invalid of [NaN, Infinity, () => {}, 1n, new Date()]) {
    assert.throws(() =>
      createLocalBackup({ ...stateFixture(), invalid }, exportedAt),
    );
  }
  assert.throws(
    () => parseLocalBackup(raw.replace(/}$/, ',"invalid":1e999}')),
    /number/,
  );
  let nested = {};
  for (let i = 0; i < 90; i++) nested = { nested };
  assert.throws(
    () => createLocalBackup({ ...stateFixture(), nested }, exportedAt),
    /deeply/,
  );
});

test("circular references and sparse or undefined array entries are rejected instead of lost", () => {
  const state = stateFixture();
  state.circular = state;
  assert.throws(() => createLocalBackup(state, exportedAt), /circular/);
  assert.throws(
    () =>
      createLocalBackup({ ...stateFixture(), extra: new Array(2) }, exportedAt),
    /incomplete/,
  );
  assert.throws(
    () =>
      createLocalBackup({ ...stateFixture(), extra: [undefined] }, exportedAt),
    /JSON/,
  );
});

test("normalization check detects loss, changed actuals or constraints, not object key order", () => {
  const original = JSON.parse(JSON.stringify(stateFixture()));
  const same = JSON.parse(JSON.stringify(original));
  same.exerciseLoadIncrements = { "id:pull-up": 0, "id:squat": 1.25 };
  same.legacyNutritionTotals = undefined;
  same.foodLog[0].optionalMetadataAddedByCurrentVersion = null;
  same.newDefaultAddedByCurrentVersion = true;
  assert.deepEqual(backupNormalizationChanges(original, same), []);
  same.foodLog = [];
  same.workoutSessions["session-1"].setLogs["set-1"].weight = 65;
  same.painfulExercises = [];
  delete same.customDataFromThisVersion;
  assert.deepEqual(backupNormalizationChanges(original, same), [
    "foodLog",
    "workoutSessions",
    "painfulExercises",
    "customDataFromThisVersion",
  ]);
});

test("large histories are preserved without a hidden record cap", () => {
  const state = stateFixture();
  state.workoutHistory = Array.from({ length: 700 }, (_, i) => ({
    id: `history-${i}`,
    actual: i,
  }));
  assert.equal(
    parseLocalBackup(serializeLocalBackup(state, exportedAt)).state
      .workoutHistory.length,
    700,
  );
});
