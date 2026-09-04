import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import ts from "typescript";
import { createWeightMacroSettings, isWeightMacroDate } from "../src/app/weight_macro_engine.ts";
import { createTrackerProgram, trackerCheckinForDate } from "../src/app/weight_macro_program.ts";

let server, panel;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: "custom", logLevel: "error" });
  panel = await server.ssrLoadModule("/src/app/components/WeightMacroTrackerPanel.tsx");
});
after(async () => { await server?.close(); });

const settings = () => createWeightMacroSettings({ startDate: "2026-01-01", startingWeight: 180, goalWeight: 170,
  startingCalories: 2400, goalType: "Cut", manualWeeklyRate: 0.005, cycling: true, manualLeanMass: 140 });
const fixture = () => ({ program: createTrackerProgram(settings(), "2026-01-01", "2026-01-01T12:00:00Z", "tracker-test"),
  sources: { foodLog: [], bodyWeightHistory: [] }, initialSettings: settings(), today: "2026-09-03", context: { completedWorkouts: 3, recoveryFlags: 0 }, onUpdate: () => {} });
const render = props => renderToStaticMarkup(React.createElement(panel.WeightMacroTrackerPanel, { ...fixture(), ...props }));

test("tracker exposes progress, accepted cycling targets and full history/export access behind collapsed details", () => {
  const html = render();
  for (const label of ["Progress, current macros", "14-day change", "28-day change", "Planned goal date", "Estimated days ahead", "Accepted protein today", "Accepted training-day calories", "Accepted rest-day calories", "Cycling daily average", "All 53 weeks / 365 days", "Daily records", "Export full analysis JSON", "not an app backup"]) assert.ok(html.includes(label), label);
  assert.match(html, /Edit tracker day 2026-09-03/);
  assert.doesNotMatch(html, /NaN|Infinity|<details open/);
});

test("compact tracker keeps useful progress details but omits full history and never mutates during render", () => {
  let writes = 0;
  const html = render({ compact: true, onUpdate: () => writes++ });
  assert.match(html, /Progress, current macros/);
  assert.doesNotMatch(html, /Export full analysis JSON|History range/);
  assert.equal(writes, 0);
});

test("analysis exports every generated calculation cell without converting unavailable data to zero", () => {
  const { program, sources, today } = fixture();
  const before = JSON.stringify([program, sources]);
  const exported = panel.trackerAnalysisExport(program, sources, today);
  const roundTrip = JSON.parse(JSON.stringify(exported));
  assert.equal(roundTrip.analysis.daily.length, 365);
  assert.equal(roundTrip.analysis.weekly.length, 53);
  assert.equal(Object.keys(roundTrip.analysis.daily[0].cells).length, 34);
  assert.ok(Object.keys(roundTrip.analysis.weekly[0].cells).length >= 50);
  assert.equal(roundTrip.analysis.daily[0].cells.E, null);
  assert.equal(roundTrip.analysis.dashboard.latestWeight, null);
  assert.ok(roundTrip.analysis.settingsDerived.cells.B37 != null);
  assert.deepEqual(roundTrip.program.decisions, program.decisions);
  assert.match(roundTrip.note, /not an importable app backup/);
  assert.equal(JSON.stringify([program, sources]), before);
});

test("changing weight units converts physical quantities and inversely converts macro-per-weight coefficients", () => {
  const original = settings();
  const converted = panel.trackerSettingChoice(original, "weightUnit", "kg");
  assert.equal(converted.startingWeight, original.startingWeight * 0.45359237);
  assert.equal(converted.goalWeight, original.goalWeight * 0.45359237);
  assert.equal(converted.manualLeanMass, original.manualLeanMass * 0.45359237);
  assert.equal(converted.maintenanceLowerTolerance, original.maintenanceLowerTolerance * 0.45359237);
  assert.ok(Math.abs(converted.proteinPerWeight * converted.startingWeight - original.proteinPerWeight * original.startingWeight) < 1e-9);
  assert.equal(converted.manualWeeklyRate, original.manualWeeklyRate);
  const back = panel.trackerSettingChoice(converted, "weightUnit", "lb");
  assert.ok(Math.abs(back.startingWeight - original.startingWeight) < 1e-9);
  assert.equal(original.weightUnit, "lb");
});

test("weekly rate and calorie-cycling unit changes preserve numeric meaning and invalid blanks stay invalid", () => {
  const original = settings();
  const weightRate = panel.trackerSettingChoice(original, "manualRateType", "Weight per week");
  assert.equal(weightRate.manualWeeklyRate, 0.9);
  assert.equal(panel.trackerSettingChoice(weightRate, "manualRateType", "Percentage of body weight per week").manualWeeklyRate, 0.005);
  const percentageCycle = panel.trackerSettingChoice(original, "cyclingInputType", "Percentage");
  assert.ok(Math.abs(percentageCycle.trainingPremium - 100 / 2400) < 1e-12);
  assert.ok(Math.abs(panel.trackerSettingChoice(percentageCycle, "cyclingInputType", "Calories").trainingPremium - 100) < 1e-9);
  assert.ok(Number.isNaN(panel.trackerSettingChoice({ ...original, startingWeight: NaN }, "manualRateType", "Weight per week").manualWeeklyRate));
  assert.ok(Number.isNaN(panel.trackerSettingChoice({ ...original, startingCalories: NaN }, "cyclingInputType", "Percentage").trainingPremium));
});

// Execute actual panel callback bodies without browser dependencies, keeping the real program helpers.
const source = ts.createSourceFile("WeightMacroTrackerPanel.tsx", readFileSync(new URL("../src/app/components/WeightMacroTrackerPanel.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map();
const visit = node => { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node); ts.forEachChild(node, visit); };
visit(source);
const callback = (name, context) => {
  const compiled = ts.transpileModule(`const action = ${declarations.get(name).initializer.getText(source)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  return new Function(...Object.keys(context), `${compiled}\nreturn action;`)(...Object.values(context));
};
const checkinRevision = callback("checkinEditRevision", {});
const metricLabels = [["weight", "Morning fasted weight"], ["steps", "Steps"], ["sleepHours", "Sleep hours"], ["waist", "Waist"], ["performance", "Performance", 5], ["hunger", "Hunger", 5], ["digestion", "Digestion", 5]];
const checkinHarness = (date = "2026-09-03") => {
  const { program, sources, today } = fixture();
  program.checkins = [{ date, weight: 178, includeWeight: false, nutritionSource: "diary" }];
  let savedProgram = program, message = "", closed = false;
  const context = { date, today, check: { ...program.checkins[0], weight: null, sleepHours: null },
    isWeightMacroDate, metricLabels, checkinEditRevision: checkinRevision, trackerCheckinForDate,
    checkinBaseline: { current: checkinRevision(program, sources, date) },
    setMessage: text => { message = text; }, setShowCheckin: visible => { closed = !visible; },
    mutate: (fn, success, done) => { savedProgram = fn(savedProgram, sources); message = success; done?.(); },
  };
  return { program, sources, context, saved: () => savedProgram, message: () => message, closed: () => closed, replace: next => { savedProgram = next; } };
};

test("actual save callback keeps an existing weight when blank and preserves explicit exclusion", () => {
  const setup = checkinHarness();
  callback("saveCheckin", setup.context)();
  assert.equal(setup.saved().checkins[0].weight, 178);
  assert.equal(setup.saved().checkins[0].includeWeight, false);
  assert.equal(setup.saved().checkins[0].sleepHours, null);
  assert.equal(setup.closed(), true);
  assert.equal(setup.program.checkins[0].weight, 178);
});

test("actual save callback rejects impossible/future dates and invalid manual totals", () => {
  for (const date of ["2026-02-30", "2026-09-04", ""]) {
    const setup = checkinHarness(date); callback("saveCheckin", setup.context)();
    assert.equal(setup.saved(), setup.program);
    assert.match(setup.message(), /real date/);
    assert.equal(setup.closed(), false);
  }
  const setup = checkinHarness();
  setup.context.check = { ...setup.context.check, nutritionSource: "manual", foodComplete: true, calories: null, protein: 0, carbs: 0, fat: 0 };
  callback("saveCheckin", setup.context)();
  assert.match(setup.message(), /all four/);
  assert.equal(setup.closed(), false);
});

test("sleep validation matches reload limits: 25 hours is refused and genuine zero hours is retained", () => {
  const invalid = checkinHarness();
  invalid.context.check.sleepHours = 25;
  callback("saveCheckin", invalid.context)();
  assert.equal(invalid.saved(), invalid.program);
  assert.match(invalid.message(), /sleep hours/);
  assert.equal(invalid.closed(), false);
  const zero = checkinHarness();
  zero.context.check.sleepHours = 0;
  callback("saveCheckin", zero.context)();
  assert.equal(zero.saved().checkins[0].sleepHours, 0);
  assert.equal(zero.closed(), true);
});

test("switching back to diary mode cannot save invalid hidden manual nutrition values", () => {
  const setup = checkinHarness();
  setup.context.check = { ...setup.context.check, nutritionSource: "diary", calories: -1 };
  callback("saveCheckin", setup.context)();
  assert.equal(setup.saved(), setup.program);
  assert.match(setup.message(), /previously entered manual totals/);
  assert.equal(setup.closed(), false);
});

test("actual save callback refuses stale edits after another writer changes the day's measurement", () => {
  const setup = checkinHarness();
  setup.replace({ ...setup.program, checkins: [{ ...setup.program.checkins[0], weight: 175 }] });
  assert.throws(() => callback("saveCheckin", setup.context)(), /measurement or its units changed/);
  assert.equal(setup.saved().checkins[0].weight, 175);
  assert.equal(setup.closed(), false);
});

test("actual day-open callback hydrates canonical source weights in the tracker unit", () => {
  const { program, sources, today } = fixture();
  program.settings.weightUnit = "kg";
  sources.bodyWeightHistory = [{ id: "canonical", date: today, weightLb: 180, recordedAt: "2026-09-03T08:00:00Z" }];
  let hydrated;
  callback("editCheckin", { program, sources, today, mutationAttempt: { current: 0 }, checkinBaseline: { current: "" },
    isWeightMacroDate, trackerCheckinForDate, checkinEditRevision: checkinRevision, setDate: () => {}, setCheck: check => { hydrated = check; }, setShowCheckin: () => {} })(today);
  assert.equal(hydrated.weight, 180 * 0.45359237);
  assert.equal(hydrated.includeWeight, true);
});

test("mutation feedback never updates an unmounted panel and never lets an older attempt replace newer feedback", async () => {
  const { program, sources } = fixture();
  let message = "", finished = 0;
  const mounted = { current: true }, mutationAttempt = { current: 0 };
  const mutate = callback("mutate", { program, mounted, mutationAttempt, queueMicrotask,
    setMessage: text => { message = text; }, onUpdate: fn => fn(program, sources) });
  mutate(p => ({ ...p }), "old", () => finished++);
  mutate(p => ({ ...p }), "new", () => finished++);
  await Promise.resolve();
  assert.equal(message, "new"); assert.equal(finished, 1);
  mutate(p => ({ ...p }), "after unmount", () => finished++);
  mounted.current = false;
  await Promise.resolve();
  assert.equal(message, "new"); assert.equal(finished, 1);
});
