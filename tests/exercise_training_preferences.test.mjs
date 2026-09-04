import assert from "node:assert/strict";
import test from "node:test";
import {
  exerciseHistoryMatches,
  exercisePermitsZeroLoad,
  exercisePreferenceKey,
  clearExercisePainFlags,
  hasExercisePainFlag,
  normalizeExerciseLoadIncrements,
  preserveExercisePainOnRename,
  recordExercisePainFlag,
} from "../src/app/exercise_training_preferences.ts";

test("known bodyweight catalog movements allow zero added load without broad core inference", () => {
  for (const name of [
    "Hanging knee raise", "Hanging leg raise", "Captain's chair knee raise",
    "Reverse crunch", "Ab wheel rollout", "Plank", "Side plank", "Dead bug",
    "Decline sit-up", "Chin-up", "Assisted triceps dip",
  ]) {
    assert.equal(exercisePermitsZeroLoad({ name, pattern: "Hip flexion" }), true, name);
  }
  assert.equal(exercisePermitsZeroLoad({ name: "Decline sit-up", pattern: "Loaded flexion" }), true);
  assert.equal(exercisePermitsZeroLoad({ name: "  HANGING   KNEE RAISE  " }), true);
  assert.equal(exercisePermitsZeroLoad({ name: "Captain’s chair knee raise" }), true);
  assert.equal(exercisePermitsZeroLoad({ name: "Decline sit–up" }), true);
});

test("push-up and pull-up zero-load behavior is preserved for existing variants", () => {
  for (const name of ["Push-up", "Deficit push-up", "Pull-up", "Neutral-grip pull-up", "Assisted pull-up", "Weighted pull-up", "Push up", "Pull ups"]) {
    assert.equal(exercisePermitsZeroLoad({ name }), true, name);
  }
  assert.equal(exercisePermitsZeroLoad({ name: "Custom movement", pattern: "Bodyweight press" }), true);
});

test("loaded and unknown movements remain load-required unless explicit metadata says otherwise", () => {
  for (const name of ["Cable crunch", "Machine crunch", "Weighted dip", "Machine dip", "Pallof press", "Weighted plank", "Dumbbell squat", "Cable pulldown", "Custom core exercise", "Hanging knee raise machine"]) {
    assert.equal(exercisePermitsZeroLoad({ name, pattern: "Hip flexion" }), false, name);
  }
  assert.equal(exercisePermitsZeroLoad({ name: "Weighted core hold", pattern: "Bodyweight" }), false);
  assert.equal(exercisePermitsZeroLoad({ name: "", pattern: "" }), false);
});

test("explicit load metadata wins without changing frozen exercise requirements", () => {
  assert.equal(exercisePermitsZeroLoad({ name: "Hanging knee raise", loadRequired: true }), false);
  assert.equal(exercisePermitsZeroLoad({ name: "Pull-up", loadRequired: true }), false);
  assert.equal(exercisePermitsZeroLoad({ name: "Unknown rehab movement", loadRequired: false }), true);
  const frozen = Object.freeze({ name: "Hanging knee raise", pattern: "Hip flexion", loadRequired: true });
  assert.equal(exercisePermitsZeroLoad(frozen), false);
  assert.equal(frozen.loadRequired, true);
});

test("history never transfers between different explicit exercise IDs even when names and slots match", () => {
  const lift = { exerciseId: "new-machine", name: "Machine Press", id: "same-slot" };
  assert.equal(exerciseHistoryMatches(lift, {
    exerciseId: "old-machine", liftName: "Machine Press", liftId: "same-slot",
  }), false);
  assert.equal(exerciseHistoryMatches(lift, {
    exerciseId: "NEW-MACHINE", liftName: "Renamed press", liftId: "different-slot",
  }), true);
  assert.equal(exerciseHistoryMatches({ ...lift, exerciseId: " DB   PRESS " }, {
    exerciseId: "db press", liftName: "Different label",
  }), true);
});

test("legacy history with one missing exercise ID falls back only to the normalized exact name", () => {
  assert.equal(exerciseHistoryMatches({ exerciseId: "press", name: " Bench   Press " }, {
    liftName: "BENCH\tPRESS",
  }), true);
  assert.equal(exerciseHistoryMatches({ name: "Bench Press" }, {
    exerciseId: "press", liftName: " Bench Press ",
  }), true);
  assert.equal(exerciseHistoryMatches({ exerciseId: "press", name: "Bench Press", id: "slot" }, {
    liftName: "Incline Bench Press", liftId: "slot",
  }), false);
  assert.equal(exerciseHistoryMatches({ name: "Bench Press", id: "slot" }, {
    exerciseId: "press", liftName: "Incline Bench Press", liftId: "slot",
  }), false);
  assert.equal(exerciseHistoryMatches({ exerciseId: "press", name: "Bench Press" }, {
    liftName: "bench-press",
  }), false);
});

test("both missing exercise IDs permit a nonempty matching legacy slot without matching empty identities", () => {
  assert.equal(exerciseHistoryMatches({ name: "New label", id: " OLD-SLOT " }, {
    liftName: "Old label", liftId: "old-slot",
  }), true);
  assert.equal(exerciseHistoryMatches({ name: "Row" }, { liftName: "Row" }), true);
  assert.equal(exerciseHistoryMatches({ exerciseId: " ", name: "Row", id: "slot" }, {
    exerciseId: "", liftName: "Renamed row", liftId: "slot",
  }), true);
  assert.equal(exerciseHistoryMatches({ name: "Row" }, { liftName: "Press" }), false);
  assert.equal(exerciseHistoryMatches({ name: " " }, { liftName: " " }), false);
  assert.equal(exerciseHistoryMatches({ name: "Row", id: "slot-a" }, { liftName: "Press", liftId: "slot-b" }), false);
});

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

test("recording pain upgrades matching aliases to stable identity and current name without mutating unrelated flags", () => {
  const lift = { exerciseId: " PRESS-ID ", name: "Bench Press" };
  const original = Object.freeze(["bench-press", " BENCH   PRESS ", "press-id", "name:bench press", " Incline press ", "id:row"]);
  const recorded = recordExercisePainFlag(lift, original);
  assert.deepEqual(recorded, [" Incline press ", "id:row", "id:press-id", "bench press"]);
  assert.equal(hasExercisePainFlag({ ...lift, name: "Renamed press" }, recorded), true);
  assert.deepEqual(recordExercisePainFlag(lift, recorded), recorded);
  assert.equal(original.length, 6);
});

test("explicit pain-free clearing removes all current ID/name/slug aliases but no related or unrelated exercise", () => {
  const lift = { exerciseId: "press-id", name: "Bench Press" };
  const original = Object.freeze([
    " PRESS-ID ", "id: PRESS-ID", " Bench  Press ", "name: BENCH PRESS", "bench-press",
    "incline bench press", "id:press-id-2", "id:row", "bench",
  ]);
  assert.deepEqual(clearExercisePainFlags(lift, original), [
    "incline bench press", "id:press-id-2", "id:row", "bench",
  ]);
  assert.equal(original.length, 9);
});

test("renaming an ID-backed exercise migrates legacy name-only pain and removes superseded aliases", () => {
  const previous = { exerciseId: "press-id", id: "slot", name: "Bench Press" };
  const renamed = { ...previous, name: "Flat Bench Press" };
  const flags = Object.freeze([" BENCH PRESS ", "bench-press", "Row"]);
  const migrated = preserveExercisePainOnRename(previous, renamed, flags);
  assert.deepEqual(migrated, ["Row", "id:press-id", "flat bench press"]);
  assert.equal(hasExercisePainFlag(renamed, migrated), true);
  assert.deepEqual(clearExercisePainFlags(renamed, migrated), ["Row"]);
  assert.deepEqual(flags, [" BENCH PRESS ", "bench-press", "Row"]);
});

test("a legacy rename can retain pain by unchanged slot while gaining a stable exercise ID", () => {
  const previous = { id: "same-slot", name: "Old custom row" };
  const renamed = { id: " SAME-SLOT ", exerciseId: "custom-row", name: "New custom row" };
  const flags = preserveExercisePainOnRename(previous, renamed, ["old-custom-row", "Squat"]);
  assert.deepEqual(flags, ["Squat", "id:custom-row", "new custom row"]);
  assert.equal(hasExercisePainFlag(renamed, flags), true);
  assert.deepEqual(clearExercisePainFlags(renamed, flags), ["Squat"]);
});

test("name-only legacy rename preserves pain through an explicit rename action", () => {
  const renamed = { name: "Renamed cable row" };
  const flags = preserveExercisePainOnRename({ name: "Custom row" }, renamed, ["custom row", "squat"]);
  assert.deepEqual(flags, ["squat", "name:renamed cable row", "renamed cable row"]);
  assert.equal(hasExercisePainFlag(renamed, flags), true);
});

test("rename migration never transfers pain across conflicting stable IDs or unrelated legacy slots", () => {
  const flags = Object.freeze(["Bench Press", "id:old-machine", "Row"]);
  assert.deepEqual(preserveExercisePainOnRename(
    { exerciseId: "old-machine", id: "same-slot", name: "Bench Press" },
    { exerciseId: "new-machine", id: "same-slot", name: "Bench Press" }, flags,
  ), flags);
  assert.deepEqual(preserveExercisePainOnRename(
    { id: "old-slot", name: "Bench Press" },
    { id: "new-slot", name: "Different movement" }, flags,
  ), flags);
  assert.deepEqual(preserveExercisePainOnRename(
    { exerciseId: "old-machine", name: "Bench Press" },
    { name: "Different movement" }, flags,
  ), flags);
});

test("absent pain and invalid empty identities never create new flags", () => {
  const flags = ["Row"];
  assert.deepEqual(preserveExercisePainOnRename({ name: "Press" }, { name: "Renamed press" }, flags), flags);
  assert.deepEqual(preserveExercisePainOnRename({ name: "Row" }, { name: "  " }, flags), flags);
  assert.deepEqual(recordExercisePainFlag({ name: "  " }, flags), flags);
  assert.deepEqual(clearExercisePainFlags({ name: "Press" }, flags), flags);
  assert.deepEqual(clearExercisePainFlags({ name: "Press" }, null), []);
});
