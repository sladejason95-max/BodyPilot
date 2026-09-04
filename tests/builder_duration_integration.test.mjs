import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createServer } from "vite";
import { estimatedSplitSessionMinutes } from "../src/app/split_constraints.ts";

let server;
let app;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
  app = await server.ssrLoadModule("/src/app/App.tsx");
});
after(async () => { await server?.close(); });
const clone = (value) => JSON.parse(JSON.stringify(value));
const draftFor = (state) => ({
  sessionsPerWeek: 3,
  sessionMinutes: 30,
  availableTrainingDays: ["mon", "wed", "fri"],
  equipment: "full-gym",
  musclePriorities: { ...state.musclePriorities, arms: "specialize" },
  favoriteExercises: [],
  restrictedExercises: [],
  customExercises: [],
  exerciseReplacements: {},
  mesoLengthWeeks: 5,
  weightIncrement: 5,
  startDate: "2026-09-04",
});

test("real builder and applied first-week sets agree for existing feedback without double adjustment", () => {
  for (const feedback of [
    {},
    { jointPain: 3, soreness: 4, workload: 4, volumeAdjustment: "auto" },
    { jointPain: 0, soreness: 0, workload: 1, volumeAdjustment: "add", moreSets: true },
  ]) {
    const state = clone(app.defaultState);
    state.muscleFeedback.arms = { ...state.muscleFeedback.arms, ...feedback };
    const draft = draftFor(state);
    const result = app.splitFromBuilderDraft(draft, state);
    const accepted = { ...state, ...draft, currentWeek: 1, deloadMode: false, customSplit: result.days };
    const actual = app.applyMesoSettings({ name: "Accepted", summary: "", days: accepted.customSplit }, accepted, 3);
    assert.deepEqual(result.unmetPriorities, []);
    for (const day of actual.days) {
      assert.equal(estimatedSplitSessionMinutes(day.lifts.map((item) => item.sets)), result.estimatedMinutesByDay.find((item) => item.dayId === day.id).minutes);
      assert.ok(estimatedSplitSessionMinutes(day.lifts.map((item) => item.sets)) <= draft.sessionMinutes);
    }
    const storedCurl = accepted.customSplit.flatMap((day) => day.lifts).find((item) => item.muscleGroup === "arms");
    assert.ok(storedCurl);
    assert.equal(storedCurl.sets, 3, "Base template sets are stored, not already-adjusted sets");
    assert.deepEqual(accepted.muscleFeedback, state.muscleFeedback);
  }
});

test("real builder reports missing eligible priority without inventing restricted exercises", () => {
  const state = clone(app.defaultState);
  const draft = { ...draftFor(state), sessionsPerWeek: 4, availableTrainingDays: ["mon", "tue", "thu", "fri"], musclePriorities: { ...state.musclePriorities, core: "specialize" }, equipment: "dumbbells" };
  const result = app.splitFromBuilderDraft(draft, state);
  for (const day of result.days) {
    assert.ok(day.lifts.every((item) => !/barbell|cable|machine|leg press|hack squat/i.test(item.name)));
  }
  assert.ok(result.unmetPriorities.some((item) => item.muscleGroup === "core" && item.reason === "no-eligible-exercise"));
});

test("builder starting dates reject rolled-over calendar dates before preview or acceptance", () => {
  for (const date of ["2026-02-30", "2026-02-29", "2026-04-31", "2026-13-01", "0000-01-01", "", "2026-9-4"]) {
    assert.equal(app.builderStartTimestamp(date), null, date);
  }
  for (const date of ["2024-02-29", "2026-09-04"]) {
    const result = app.builderStartTimestamp(date);
    assert.ok(result);
    const local = new Date(result);
    assert.equal(`${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`, date);
  }
});
