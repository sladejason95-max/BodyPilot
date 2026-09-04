import assert from "node:assert/strict";
import test from "node:test";
import { constrainSplitDuration, estimatedSplitSessionMinutes } from "../src/app/split_constraints.ts";

const lift = (id, muscleGroup, sets = 3) => ({ id, name: id, muscleGroup, sets, reps: "8-12" });
const fullBody = [
  { id: "a", day: "Mon", lifts: [lift("squat", "quads", 4), lift("bench", "chest", 4), lift("row", "back"), lift("crunch", "core")] },
  { id: "b", day: "Wed", lifts: [lift("hinge", "hamstrings", 4), lift("press", "shoulders"), lift("pulldown", "back"), lift("raise", "shoulders")] },
  { id: "c", day: "Fri", lifts: [lift("split-squat", "glutes"), lift("incline", "chest", 4), lift("cable-row", "back"), lift("curl", "arms")] },
];

test("the duration estimate matches the builder and distinguishes an empty day", () => {
  assert.equal(estimatedSplitSessionMinutes([]), 0);
  assert.equal(estimatedSplitSessionMinutes([3]), 16);
  assert.equal(estimatedSplitSessionMinutes([4, 4]), 26);
  assert.equal(estimatedSplitSessionMinutes([3, 4, 3]), 32);
});

test("a late arms priority survives a 30-minute three-day split", () => {
  for (const priority of ["specialize", "emphasize"]) {
    const result = constrainSplitDuration({ days: fullBody, sessionMinutes: 30, musclePriorities: { arms: priority } });
    assert.ok(result.days[2].lifts.some((item) => item.id === "curl"));
    assert.deepEqual(result.unmetPriorities, []);
    assert.ok(result.estimatedMinutesByDay.every((day) => day.minutes <= 30));
    assert.ok(result.omissions.some((item) => item.dayId === "c" && item.reason === "duration"));
  }
});

test("reserve coverage globally rather than consuming a scarce priority slot", () => {
  const days = [
    { id: "a", lifts: [lift("first-arms", "arms"), lift("only-chest", "chest")] },
    { id: "b", lifts: [lift("other-arms", "arms")] },
  ];
  const result = constrainSplitDuration({ days, sessionMinutes: 16, musclePriorities: { arms: "specialize", chest: "emphasize" } });
  assert.deepEqual(result.days.map((day) => day.lifts[0].id), ["only-chest", "other-arms"]);
  assert.deepEqual(result.unmetPriorities, []);
});

test("effective sets affect estimates without changing source objects or double-applying sets", () => {
  const priorityLift = Object.freeze(lift("curl", "arms", 3));
  const otherLift = Object.freeze(lift("bench", "chest", 4));
  const days = Object.freeze([Object.freeze({ id: "a", day: "Fri", lifts: Object.freeze([otherLift, priorityLift]) })]);
  const result = constrainSplitDuration({ days, sessionMinutes: 28, musclePriorities: { arms: "specialize" }, effectiveSetCount: (item) => item.sets + (item.muscleGroup === "arms" ? 2 : 0) });
  assert.deepEqual(result.days[0].lifts, [otherLift, priorityLift]);
  assert.equal(result.days[0].lifts[1], priorityLift);
  assert.equal(result.days[0].lifts[1].sets, 3);
  assert.equal(result.days[0].day, "Fri");
  assert.equal(result.estimatedMinutesByDay[0].minutes, 28);
});

test("only eligible source exercises can be retained and excluded muscles stay out", () => {
  const days = [{ id: "a", lifts: [lift("bench", "chest"), lift("curl", "arms")] }];
  const result = constrainSplitDuration({ days, sessionMinutes: 60, musclePriorities: { chest: "exclude", arms: "specialize", back: "emphasize" } });
  assert.deepEqual(result.days[0].lifts.map((item) => item.id), ["curl"]);
  assert.deepEqual(result.unmetPriorities.map(({ muscleGroup, reason }) => [muscleGroup, reason]), [["back", "no-eligible-exercise"]]);
  assert.equal(result.omissions[0].reason, "excluded");
});

test("irreconcilable priority and duration requests are explicit instead of forced over budget", () => {
  const days = [{ id: "a", lifts: [lift("bench", "chest"), lift("curl", "arms")] }];
  const result = constrainSplitDuration({ days, sessionMinutes: 16, musclePriorities: { chest: "emphasize", arms: "specialize" } });
  assert.deepEqual(result.days[0].lifts.map((item) => item.id), ["curl"]);
  assert.equal(result.unmetPriorities[0].muscleGroup, "chest");
  assert.equal(result.unmetPriorities[0].reason, "duration");
  const tooShort = constrainSplitDuration({ days, sessionMinutes: 10, musclePriorities: { arms: "specialize" } });
  assert.deepEqual(tooShort.days[0].lifts, []);
  assert.ok(tooShort.conflicts.some((item) => item.code === "over-budget"));
  assert.ok(tooShort.conflicts.some((item) => item.code === "empty-day"));
});

test("no priority preserves list-order behavior while ample time preserves all lifts", () => {
  const compact = constrainSplitDuration({ days: fullBody, sessionMinutes: 30, musclePriorities: {} });
  assert.deepEqual(compact.days[2].lifts.map((item) => item.id), ["split-squat", "incline"]);
  const roomy = constrainSplitDuration({ days: fullBody, sessionMinutes: 90, musclePriorities: { arms: "specialize" } });
  assert.deepEqual(roomy.days, fullBody);
  assert.deepEqual(roomy.omissions, []);
  assert.deepEqual(roomy.conflicts, []);
});

test("invalid estimates and budgets are surfaced without inventing a workout", () => {
  const days = [{ id: "a", lifts: [lift("curl", "arms")] }];
  for (const sessionMinutes of [NaN, Infinity, 0, -5]) {
    const result = constrainSplitDuration({ days, sessionMinutes, musclePriorities: {} });
    assert.deepEqual(result.days[0].lifts, []);
    assert.ok(result.conflicts.some((item) => item.code === "invalid-budget"));
  }
  const result = constrainSplitDuration({ days, sessionMinutes: 30, musclePriorities: { arms: "emphasize" }, effectiveSetCount: () => NaN });
  assert.deepEqual(result.days[0].lifts, []);
  assert.equal(result.omissions[0].reason, "invalid-estimate");
  assert.ok(result.conflicts.some((item) => item.code === "invalid-estimate"));
});

test("ties are deterministic and priority key insertion order does not affect output", () => {
  const first = constrainSplitDuration({ days: fullBody, sessionMinutes: 30, musclePriorities: { arms: "emphasize", shoulders: "emphasize", chest: "emphasize" } });
  const second = constrainSplitDuration({ days: fullBody, sessionMinutes: 30, musclePriorities: { chest: "emphasize", shoulders: "emphasize", arms: "emphasize" } });
  assert.deepEqual(first, second);
  assert.deepEqual(first.days.flatMap((day) => day.lifts).map((item) => item.id), second.days.flatMap((day) => day.lifts).map((item) => item.id));
});

test("empty source days and absent priority muscles remain visible conflicts", () => {
  const result = constrainSplitDuration({ days: [{ id: "empty", lifts: [] }], sessionMinutes: 30, musclePriorities: { arms: "specialize" } });
  assert.equal(result.days.length, 1);
  assert.equal(result.conflicts[0].code, "empty-day");
  assert.equal(result.unmetPriorities[0].reason, "no-eligible-exercise");
  assert.equal(result.estimatedMinutesByDay[0].minutes, 0);
});

test("unexpectedly large imported constraints produce an explicit optimization limit", () => {
  const lifts = Array.from({ length: 9 }, (_, index) => lift(`lift-${index}`, `muscle-${index}`));
  const priorities = Object.fromEntries(lifts.map((item) => [item.muscleGroup, "emphasize"]));
  const result = constrainSplitDuration({ days: [{ id: "a", lifts }], sessionMinutes: 30, musclePriorities: priorities });
  assert.ok(result.conflicts.some((item) => item.code === "optimization-limit"));
  assert.ok(result.estimatedMinutesByDay.every((item) => item.minutes <= 30));
});
