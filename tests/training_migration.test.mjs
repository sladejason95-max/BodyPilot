import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeHistoryWithoutDuplicates,
  migrateLegacyTrackerDays,
  migrateLegacyWorkoutSplit,
} from "../src/app/training_migration.ts";

const catalog = [
  {
    id: "quad-hack-squat",
    name: "Hack Squat",
    category: "Legs",
    muscleBias: [{ muscle: "Quads", contribution: 65 }],
  },
];

test("legacy workout days retain their exercises and prescription", () => {
  const split = migrateLegacyWorkoutSplit(
    [
      {
        id: "day-one",
        day: "Monday",
        focus: "Quads",
        exercises: [{ exerciseId: "quad-hack-squat", sets: 4, repRange: "8-12", rir: 2 }],
      },
    ],
    catalog
  );

  assert.equal(split?.[0].focus, "Quads");
  assert.deepEqual(split?.[0].lifts[0], {
    id: "quad-hack-squat",
    name: "Hack Squat",
    muscleGroup: "quads",
    pattern: "Legs",
    target: "Quads",
    sets: 4,
    reps: "8-12",
  });
});

test("minimal legacy days remain visible for user repair", () => {
  const split = migrateLegacyWorkoutSplit([{ id: "1", day: "Day 1", focus: "Push", intensity: 7 }]);
  assert.equal(split?.[0].focus, "Push");
  assert.deepEqual(split?.[0].lifts, []);
});

test("closed tracker rows migrate to real workout history", () => {
  const history = migrateLegacyTrackerDays(
    [
      {
        id: "tracked-one",
        date: "2026-08-05",
        title: "Push",
        closedAt: "2026-08-05T18:00:00.000Z",
        lifts: [
          {
            id: "bench-row",
            name: "Barbell Bench Press",
            completed: true,
            actualSets: "3",
            actualReps: "10, 9, 8",
            weight: "225",
            rpe: "8, 9, 9",
          },
        ],
      },
    ],
    "meso-import",
    "2026-08-01T00:00:00.000Z"
  );

  assert.equal(history.length, 1);
  assert.equal(history[0].sets.length, 3);
  assert.deepEqual(history[0].sets[0], { weight: 225, reps: 10, rir: 2 });
  assert.equal(history[0].totalVolume, 6075);
  assert.equal(history[0].muscleGroup, "chest");
  assert.equal(history[0].source, "legacy-tracker");
});

test("history merge is idempotent", () => {
  const entry = { id: "one", sessionKey: "m:1:d", liftName: "Bench" };
  assert.deepEqual(mergeHistoryWithoutDuplicates([entry], [entry]), [entry]);
});
