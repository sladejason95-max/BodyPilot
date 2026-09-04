import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { createWeightMacroSettings } from "../src/app/weight_macro_engine.ts";
import {
  acceptedTrackerTarget, buildTrackerProposal, convertTrackerSettingsWeightUnit, createTrackerProgram, decideTrackerProposal,
  foodDaySignature, updateTrackerSettings,
} from "../src/app/weight_macro_program.ts";
import { createFoodDiaryEntry } from "../src/app/food_diary.ts";
import { createSavedFoodRecipe } from "../src/app/food_meals.ts";
import { backupNormalizationChanges, parseLocalBackup, serializeLocalBackup } from "../src/app/local_backup.ts";

let server;
let app;
const day = i => new Date(Date.UTC(2026, 0, 5 + i)).toISOString().slice(0, 10);
const time = i => `${day(i)}T12:00:00.000Z`;
const clone = value => JSON.parse(JSON.stringify(value));
const settings = changes => createWeightMacroSettings({
  startDate: day(0), startingWeight: 180, goalWeight: 190, startingCalories: 2500,
  goalType: "Gain", manualWeeklyRate: 0.0025, proteinBasis: "Manual fixed grams", proteinGrams: 150,
  daysToGenerate: 70, ...changes,
});
const context = { completedWorkouts: 0, recoveryFlags: 0 };
const sources = { foodLog: [], bodyWeightHistory: [] };

before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
  app = await server.ssrLoadModule("/src/app/App.tsx");
});
after(async () => { await server?.close(); });

function fixtureProgram() {
  const program = createTrackerProgram(settings(), day(0), time(0), "synthetic-app-tracker");
  program.checkins = Array.from({ length: 14 }, (_, i) => ({
    id: `synthetic-check-${i}`, date: day(i), recordedAt: time(i), weight: 180 + i * 0.01,
    includeWeight: true, nutritionSource: "manual", foodComplete: true,
    calories: 2500, protein: 150, carbs: 340, fat: 60,
  }));
  const proposal = buildTrackerProposal(program, sources, day(14), context);
  assert.ok(proposal);
  assert.equal(proposal.blocked, false);
  return decideTrackerProposal(program, sources, proposal, "accept", day(14), time(14), context);
}

test("real App default has unknown readiness, not the old fabricated 76%", () => {
  const state = clone(app.defaultState);
  const model = app.computePlan(state, day(0));
  assert.equal(state.recoveryCheckins && Object.keys(state.recoveryCheckins).length, 0);
  assert.equal(model.readiness, null);
  assert.equal(model.trainingLoad, "Not checked today");
  assert.match(model.primarySuggestion.detail, /not checked today/i);
  assert.doesNotMatch(model.primarySuggestion.detail, /76%|good energy|recovered/i);
});

test("undated profile sleep, energy and soreness do not penalize calories or invent readiness", () => {
  const state = clone(app.defaultState);
  const original = app.computePlan(state, day(0));
  const poor = app.computePlan({ ...state, sleepHours: 2, energy: 1, soreness: 10 }, day(0));
  const rested = app.computePlan({ ...state, sleepHours: 12, energy: 10, soreness: 1 }, day(0));
  assert.deepEqual(poor.macros, original.macros);
  assert.deepEqual(rested.macros, original.macros);
  assert.equal(poor.readiness, null);
  assert.equal(rested.readiness, null);
  assert.equal(poor.targetRir, original.targetRir);
});

test("readiness comes only from non-skipped check-ins for the selected local day", () => {
  const state = clone(app.defaultState);
  const check = { muscleGroup: "chest", checkedAt: time(0), readiness: 1, jointPain: 0, skipped: false, performanceExpectation: "same" };
  state.recoveryCheckins = {
    today: check,
    otherDay: { ...check, checkedAt: time(1), readiness: 4 },
    skipped: { ...check, skipped: true, readiness: 4 },
    invalid: { ...check, checkedAt: "not-a-date", readiness: 4 },
  };
  assert.equal(app.computePlan(state, day(0)).readiness, 25);
  assert.equal(app.computePlan(state, day(1)).readiness, 100);
  assert.equal(app.computePlan(state, day(2)).readiness, null);
});

test("accepted tracker revisions control App macros by date, not current profile edits", () => {
  const state = { ...clone(app.defaultState), trackerProgram: fixtureProgram() };
  const before = clone(state.trackerProgram);
  const old = app.computePlan(state, day(14));
  const next = app.computePlan(state, day(15));
  assert.equal(old.macros.calories, 2500);
  assert.equal(next.macros.calories, 2650);
  const accepted = acceptedTrackerTarget(state.trackerProgram, day(15));
  assert.deepEqual({ calories: next.macros.calories, protein: next.macros.protein, carbs: next.macros.carbs, fats: next.macros.fats }, { calories: accepted.calories, protein: accepted.protein, carbs: accepted.carbs, fats: accepted.fat });
  const edited = app.computePlan({ ...state, bodyWeightLb: 230, targetWeightLb: 170, goal: "fat-loss", age: 60, heightIn: 78, steps: 20000, sessionsPerWeek: 6, sleepHours: 2 }, day(15));
  assert.deepEqual(edited.macros, next.macros);
  assert.deepEqual(state.trackerProgram, before);
  assert.equal(app.computePlan(state, day(14)).macros.calories, 2500);
});

test("later tracker setting edits leave earlier App daily targets unchanged", () => {
  const program = fixtureProgram();
  const revised = updateTrackerSettings(program, { ...program.settings, startingCalories: 2800, cycling: true, trainingPremium: 200, restReduction: 100 }, day(16), time(16));
  const state = { ...clone(app.defaultState), trackerProgram: revised };
  assert.equal(app.computePlan(state, day(14)).macros.calories, 2500);
  assert.equal(app.computePlan(state, day(16)).macros.calories, 2650);
  assert.equal(app.computePlan(state, day(17)).macros.calories, acceptedTrackerTarget(revised, day(17)).calories);
  assert.notEqual(app.computePlan(state, day(17)).macros.calories, 2650);
});

test("App unit-only tracker edits preserve canonical measurement identity, precision and timestamp", () => {
  const program = fixtureProgram();
  const canonical = { id: "canonical-observation", date: day(0), weightLb: 180, recordedAt: time(0) };
  const state = { ...clone(app.defaultState), trackerProgram: program, bodyWeightHistory: [canonical] };
  const converted = updateTrackerSettings(program, convertTrackerSettingsWeightUnit(program.settings, "kg"), day(16), time(16));
  const result = app.applyTrackerProgramUpdate(state, converted);
  assert.equal(result.bodyWeightHistory, state.bodyWeightHistory);
  assert.equal(result.bodyWeightHistory[0], canonical);
  assert.equal(result.trackerProgram.settings.weightUnit, "kg");
  assert.equal(result.trackerProgram.checkins[0].weight, 180 * 0.45359237);
  assert.equal(result.trackerProgram.checkins[0].recordedAt, time(0));
  assert.equal(app.applyTrackerProgramUpdate(result, converted), result);
});

test("App explicit tracker weigh-in update writes only that canonical daily observation", () => {
  const program = fixtureProgram();
  const state = { ...clone(app.defaultState), trackerProgram: program, bodyWeightHistory: [
    { id: "day-zero", date: day(0), weightLb: 180, recordedAt: time(0) },
    { id: "untouched", date: day(1), weightLb: 180.01, recordedAt: time(1) },
  ] };
  const changed = { ...program, checkins: program.checkins.map((c, i) => i === 0 ? { ...c, weight: 181, recordedAt: `${day(0)}T13:00:00.000Z` } : c) };
  const result = app.applyTrackerProgramUpdate(state, changed);
  assert.equal(result.bodyWeightHistory.find(w => w.date === day(0)).weightLb, 181);
  assert.equal(result.bodyWeightHistory.find(w => w.date === day(0)).recordedAt, `${day(0)}T13:00:00.000Z`);
  assert.deepEqual(result.bodyWeightHistory.find(w => w.date === day(1)), state.bodyWeightHistory[1]);
  assert.equal(state.bodyWeightHistory[0].weightLb, 180);
});

test("real App backup normalizer preserves tracker decisions, revisions, check-ins and recipe metadata", () => {
  const food = createFoodDiaryEntry({ label: "Synthetic rice", servingLabel: "100 g", calories: 130, protein: 3, carbs: 28, fat: 0.2, source: "test fixture" }, { id: "synthetic-food", date: day(14), recordedAt: time(14), servings: 2 });
  assert.ok(food);
  const recipe = createSavedFoodRecipe({ id: "synthetic-recipe", name: "Synthetic rice batch", ingredients: [food], yieldAmount: 400, yieldUnit: "cooked-grams", portionAmount: 150, createdAt: time(14) });
  assert.ok(recipe);
  const program = fixtureProgram();
  program.completeFoodDays[day(14)] = foodDaySignature([food], day(14));
  program.weeklyOverrides = [{ week: 3, deload: false, disruption: true, notes: "Synthetic travel context" }];
  const state = clone({ ...app.defaultState, trackerProgram: program, foodLog: [food], savedFoodMeals: [recipe] });
  const parsed = parseLocalBackup(serializeLocalBackup(state, time(16)));
  const normalized = app.normalizeSavedAppState(parsed.state);
  assert.deepEqual(backupNormalizationChanges(state, normalized), []);
  assert.deepEqual(normalized.trackerProgram, state.trackerProgram);
  assert.deepEqual(normalized.savedFoodMeals, state.savedFoodMeals);
  assert.deepEqual(normalized.foodLog, state.foodLog);
  assert.deepEqual(app.computePlan(normalized, day(15)).macros, app.computePlan(state, day(15)).macros);
});

test("legacy light-theme backups remain restorable while the UI enforces dark mode", async () => {
  const state = clone({ ...app.defaultState, theme: "light", trackerProgram: fixtureProgram() });
  const normalized = app.normalizeSavedAppState(parseLocalBackup(serializeLocalBackup(state, time(16))).state);
  assert.equal(normalized.theme, "light"); // Preserve existing saved data, not an unwanted normalization rewrite.
  assert.deepEqual(backupNormalizationChanges(state, normalized), []);
  const source = await readFile(new URL("../src/app/App.tsx", import.meta.url), "utf8");
  assert.match(source, /document\.documentElement\.classList\.add\("dark"\)/);
  assert.doesNotMatch(source, /classList\.toggle\("dark",\s*state\.theme/);
});

test("malformed tracker decisions enter recovery instead of silently disappearing during App load", () => {
  const state = clone({ ...app.defaultState, trackerProgram: fixtureProgram() });
  state.trackerProgram.revisions[1].target.calories += 25;
  assert.throws(() => app.normalizeSavedAppState(state), /tracker|target|decision|recovery/i);
  const missing = clone({ ...app.defaultState, trackerProgram: fixtureProgram() });
  missing.trackerProgram.decisions.pop();
  assert.throws(() => app.normalizeSavedAppState(missing), /tracker|target|decision|recovery/i);
});

test("App training context counts only dated recent non-skipped recovery and completed workouts", () => {
  const state = clone(app.defaultState);
  state.workoutHistory = [
    { sessionKey: "same", completedAt: time(12) }, { sessionKey: "same", completedAt: time(12) },
    { sessionKey: "older", completedAt: time(0) }, { sessionKey: "future", completedAt: time(30) },
  ];
  state.recoveryCheckins = {
    recent: { checkedAt: time(12), readiness: 1, jointPain: 0, performanceExpectation: "same", skipped: false },
    skipped: { checkedAt: time(12), readiness: 0, jointPain: 4, performanceExpectation: "below", skipped: true },
    older: { checkedAt: time(0), readiness: 0, jointPain: 4, performanceExpectation: "below", skipped: false },
    future: { checkedAt: time(30), readiness: 0, jointPain: 4, performanceExpectation: "below", skipped: false },
  };
  assert.deepEqual(app.trackerContextFor(state, day(20)), { completedWorkouts: 1, recoveryFlags: 1 });
});
