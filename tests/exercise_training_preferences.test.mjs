import assert from "node:assert/strict";
import test from "node:test";
import {
  exercisePreferenceKey,
  hasExercisePainFlag,
  normalizeExerciseLoadIncrements,
} from "../src/app/exercise_training_preferences.ts";

test("exercise preference keys prioritize stable IDs and survive display-name changes", () => {
  const original = { exerciseId: "  DB-Press  ", name: "Dumbbell press" };
  assert.equal(exercisePreferenceKey(original), "id:db-press");
  assert.equal(exercisePreferenceKey({ ...original, name: "Renamed movement" }), "id:db-press");
  assert.equal(exercisePreferenceKey({ exerciseId: "CUSTOM   ROW", name: "Row" }), "id:custom row");
});

test("custom exercise names normalize case and whitespace without losing punctuation or Unicode", () => {
  assert.equal(exercisePreferenceKey({ name: "  Bench\t PRESS  " }), "name:bench press");
  assert.equal(exercisePreferenceKey({ exerciseId: "  ", name: "Élévation" }), "name:élévation");
  assert.notEqual(exercisePreferenceKey({ name: "A/B" }), exercisePreferenceKey({ name: "A B" }));
  assert.notEqual(exercisePreferenceKey({ exerciseId: "row", name: "Row" }), exercisePreferenceKey({ name: "row" }));
  assert.equal(exercisePreferenceKey({ name: " \n " }), "");
  assert.equal(exercisePreferenceKey(null), "");
});

test("increment preferences retain explicit zero, fractional values, and inclusive upper bound", () => {
  assert.deepEqual(normalizeExerciseLoadIncrements({
    " ID: DB-PRESS ": 2.5,
    "name:   Bench   Press": " 1.25 ",
    "name:Pull up": 0,
    "id:machine": 25,
    "id:microload": ".125",
    "id:exponent": "2.5e-1",
    "id:zero": "0",
  }), {
    "id:db-press": 2.5,
    "name:bench press": 1.25,
    "name:pull up": 0,
    "id:machine": 25,
    "id:microload": 0.125,
    "id:exponent": 0.25,
    "id:zero": 0,
  });
});

test("invalid increments are dropped rather than clamped, coerced, or converted to reps-only", () => {
  for (const invalid of [null, undefined, "", "  ", false, true, [], {}, NaN, Infinity, -Infinity, -1, "-1", 25.001, "25.001", "0x10", "2 kg", "NaN", "Infinity"]) {
    assert.deepEqual(normalizeExerciseLoadIncrements({ "id:bench": invalid }), {}, String(invalid));
  }
  assert.deepEqual(normalizeExerciseLoadIncrements(null), {});
  assert.deepEqual(normalizeExerciseLoadIncrements([]), {});
  assert.deepEqual(normalizeExerciseLoadIncrements("2.5"), {});
});

test("increment key normalization rejects empty identities and unsafe keys", () => {
  const input = JSON.parse('{"__proto__":2.5,"constructor":1,"prototype":2,"":3,"  ":4,"id: ":5,"name:":6,"id:valid":2.5}');
  const result = normalizeExerciseLoadIncrements(input);
  assert.deepEqual(result, { "id:valid": 2.5 });
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.hasOwn(result, "__proto__"), false);
});

test("increment normalization is immutable and idempotent, with last valid normalized duplicate winning", () => {
  const input = Object.freeze({ "ID:PRESS": 2.5, "id:press": 5, " id:press ": null, "name:row": -0 });
  const result = normalizeExerciseLoadIncrements(input);
  assert.deepEqual(result, { "id:press": 5, "name:row": 0 });
  assert.equal(Object.is(result["name:row"], -0), false);
  assert.deepEqual(normalizeExerciseLoadIncrements(result), result);
  const inherited = Object.create({ "id:inherited": 10 });
  inherited["id:own"] = 1;
  assert.deepEqual(normalizeExerciseLoadIncrements(inherited), { "id:own": 1 });
});

test("pain flags match full stable IDs, normalized names, name slugs and canonical keys", () => {
  const lift = { exerciseId: "db-flat-press", name: "Dumbbell Bench Press (Flat)" };
  for (const flag of [
    " DB-FLAT-PRESS ",
    "DUMBBELL   BENCH\tPRESS (FLAT)",
    " dumbbell-bench-press-flat ",
    "id: DB-FLAT-PRESS",
    "name: DUMBBELL BENCH PRESS (FLAT)",
  ]) assert.equal(hasExercisePainFlag(lift, [flag]), true, flag);
  assert.equal(hasExercisePainFlag({ ...lift, name: "New display name" }, ["db-flat-press"]), true);
});

test("pain matching never expands arbitrary substrings or related exercise names", () => {
  const lift = { exerciseId: "bench-press", name: "Bench Press" };
  for (const flag of ["bench", "press", "incline bench press", "barbell-bench-press", "bench-press-close-grip", "Bench Press (Machine)", "id:other", "", "   "]) {
    assert.equal(hasExercisePainFlag(lift, [flag]), false, flag);
  }
  assert.equal(hasExercisePainFlag({ name: "Incline Bench Press" }, ["bench-press"]), false);
});

test("custom-name pain flags support whitespace, punctuation slugs, and exact Unicode names", () => {
  assert.equal(hasExercisePainFlag({ name: "  Cable  Fly / Low " }, ["cable-fly-low"]), true);
  assert.equal(hasExercisePainFlag({ name: "Élévation" }, [" ÉLÉVATION "]), true);
  assert.equal(hasExercisePainFlag({ name: "Name: Row" }, ["Name: Row"]), true);
  assert.equal(hasExercisePainFlag({ name: "抬举" }, [" "]), false);
  assert.equal(hasExercisePainFlag({ name: "  " }, [" "]), false);
  assert.equal(hasExercisePainFlag({ name: "Row" }, [null, false, 0]), false);
  assert.equal(hasExercisePainFlag({ name: "Row" }, null), false);
});
