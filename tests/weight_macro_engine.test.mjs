import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateWeightMacroTracker, createWeightMacroSettings, excelRound, excelRoundDown,
  isWeightMacroDate, nextWeightMacroTargets, weightMacroDailyTarget,
  WEIGHT_MACRO_OPTIONS, WEIGHT_MACRO_SETTING_FIELDS, WEIGHT_MACRO_RULE_VERSION,
} from "../src/app/weight_macro_engine.ts";

// Synthetic athlete and dates only; never the workbook author's personal inputs.
const date = (index) => new Date(Date.UTC(2026, 0, 5 + index)).toISOString().slice(0, 10);
const setup = (changes = {}) => createWeightMacroSettings({
  startDate: date(0), startingWeight: 180, goalWeight: 190, startingCalories: 2500,
  proteinBasis: "Manual fixed grams", proteinGrams: 150, goalType: "Gain",
  manualWeeklyRate: 0.0025, daysToGenerate: 35, ...changes,
});
const logs = (count = 35, change = () => ({})) => Array.from({ length: count }, (_, i) => ({
  id: `synthetic-${i}`, date: date(i), recordedAt: `${date(i)}T08:00:00Z`,
  weight: 180 + 0.01 * i, includeWeight: true, calories: 2500,
  protein: 150, carbs: 340, fat: 60, ...change(i),
}));
const run = (settings = {}, records = logs(), overrides = [], asOf = date(34), options) => calculateWeightMacroTracker(setup(settings), records, overrides, asOf, options);
const close = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);

test("Excel rounding uses half away from zero; ROUNDDOWN uses truncation", () => {
  for (const [value, expected] of [[2.5, 3], [-2.5, -3], [1.5, 2], [-1.5, -2], [0.5, 1], [-0.5, -1]]) assert.equal(excelRound(value), expected);
  assert.equal(excelRound(1.005, 2), 1.01);
  assert.equal(excelRound(-1.005, 2), -1.01);
  assert.equal(excelRound(125, -1), 130);
  assert.equal(excelRoundDown(-1.99), -1);
  assert.equal(excelRoundDown(1.99, 1), 1.9);
  assert.equal(Object.is(excelRound(-0.1), -0), false);
});

test("every editable workbook setting has metadata and the engine is deterministic", () => {
  const inputRefs = [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36].map(n => `B${n}`)
    .concat([3,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(n => `E${n}`), [3,4,5,6,7,8,9].map(n => `H${n}`));
  assert.deepEqual(WEIGHT_MACRO_SETTING_FIELDS.map(f => f.ref), inputRefs);
  assert.equal(new Set(WEIGHT_MACRO_SETTING_FIELDS.map(f => f.key)).size, inputRefs.length);
  assert.deepEqual(run(), run());
  assert.equal(run().ruleVersion, WEIGHT_MACRO_RULE_VERSION);
});

test("blank observations remain null, not fabricated weight, rate, TDEE or adherence", () => {
  const r = run({}, []);
  assert.equal(r.daily.length, 35);
  assert.equal(r.weekly.length, 5);
  for (const d of r.daily) for (const key of ["G", "H", "I", "J", "E", "Q", "U", "V", "AH"]) assert.equal(d.cells[key], null);
  for (const w of r.weekly) {
    assert.equal(w.averageWeight, null); assert.equal(w.activeRate, null); assert.equal(w.fourteenDayRate, null);
    assert.equal(w.estimatedTdee, null); assert.equal(w.nutritionAdherence, null); assert.equal(w.holdRule, "INSUFFICIENT_HISTORY");
    assert.equal(w.cappedAdjustment, 0);
  }
  assert.equal(r.dashboard.latestWeight, null);
  assert.equal(r.dashboard.change7, null);
  assert.ok(r.weekly[1].diagnostics.some(d => d.code === "AQ_BLANK_REGRESSION"));
});

test("all 34 daily and 56 weekly columns plus derived setting cells are exposed", () => {
  const r = run();
  assert.equal(Object.keys(r.daily[0].cells).length, 34);
  assert.equal(Object.keys(r.weekly[0].cells).length, 56);
  for (const ref of ["B37", "B38", "B39", "B40", "B41", "B42", "E4", "E6", "E25", "E26", "E27", "E28", "E29", "E30", "H10", "H11", "H12", "H13", "H14"]) assert.ok(ref in r.settingsDerived.cells);
  assert.ok(r.weekly[0].formulaRefs.includes("AI46:CL46"));
});

test("minimum samples, exclusions, seven calendar days, EW carry-forward", () => {
  const r = run({}, logs(10, i => ({ weight: 100 + i, includeWeight: ![1, 4, 5, 6, 7, 8, 9].includes(i) })));
  assert.equal(r.daily[0].rollingAverage, null);
  assert.equal(r.daily[2].rollingAverage, null);
  close(r.daily[3].rollingAverage, (100 + 102 + 103) / 3);
  assert.equal(r.daily[8].rollingAverage, null);
  assert.equal(r.daily[1].includedWeight, null);
  close(r.daily[0].ewTrend, 100);
  close(r.daily[1].ewTrend, 100);
  close(r.daily[3].ewTrend, 101.125);
  assert.equal(r.daily[3].regressionTrend, null);
  assert.equal(run({}, logs(4)).daily[3].regressionTrend, 180.03);
});

test("regression switches from expanding history to exactly 14 calendar rows at row 60", () => {
  const r = run({}, logs(16, i => ({ weight: i === 0 ? 500 : 180 + i })));
  assert.equal(r.daily[13].row, 59);
  assert.equal(r.daily[14].row, 60);
  assert.notEqual(r.daily[13].regressionTrend, 193);
  close(r.daily[14].regressionTrend, 194);
  close(r.daily[15].regressionTrend, 195);
});

test("all selected trend methods return the corresponding series", () => {
  for (const [trendMethod, property] of WEIGHT_MACRO_OPTIONS.trendMethod.map((m, i) => [m, ["rollingAverage", "ewTrend", "regressionTrend"][i]])) {
    const r = run({ trendMethod });
    assert.equal(r.daily[12].trendWeight, r.daily[12][property]);
    assert.ok(r.daily[12].trendEvidenceDates.length > 0);
  }
});

test("future observations never influence past recommendations, dashboard or coverage", () => {
  const r = run({}, logs(35, i => i > 8 ? { weight: 900, calories: 9999 } : {}), [], date(8));
  assert.equal(r.dashboard.latestWeightDate, date(8));
  assert.equal(r.dashboard.latestTrendDate, date(8));
  assert.equal(r.daily[9].weight, null);
  assert.equal(r.daily[9].ewTrend, null);
  assert.equal(r.daily[9].regressionTrend, null);
  assert.equal(r.weekly[1].validWeighIns, 2);
  assert.equal(r.weekly[1].evidence.isComplete, false);
  assert.equal(r.weekly[2].evidence.through, null);
  assert.ok(r.diagnostics.some(d => d.code === "FUTURE_RECORD_EXCLUDED"));
  assert.equal(r.daily[9].target.calories, 2500); // Plans, unlike observations, may be future-dated.
});

test("partial first week and final week use exact review-day boundaries and denominators", () => {
  const r = calculateWeightMacroTracker(setup({ startDate: "2026-01-08", daysToGenerate: 12 }), logs(20), [], "2026-01-19");
  assert.deepEqual(r.weekly.map(w => [w.startDate, w.endDate, w.evidence.expectedDays]), [["2026-01-08", "2026-01-11", 4], ["2026-01-12", "2026-01-18", 7], ["2026-01-19", "2026-01-19", 1]]);
  assert.equal(r.settingsDerived.firstCheckInDate, "2026-01-11");
  assert.equal(r.settingsDerived.currentProgramWeek, 3);
  assert.equal(r.weekly[0].nutritionAdherence, 1);
  assert.equal(run({ reviewDay: "Monday", daysToGenerate: 365 }, [], [], date(400)).weekly.length, 53);
});

test("target-date, manual percent/weight, maintenance and recomp planning match workbook", () => {
  close(run({ planningMode: "Reach goal weight by target date", goalDate: date(70) }).settingsDerived.targetWeeklyChange, 1);
  close(run().settingsDerived.targetWeeklyChange, 0.45);
  close(run({ manualRateType: "Weight per week", manualWeeklyRate: 0.6 }).settingsDerived.targetWeeklyChange, 0.6);
  close(run({ manualRateType: "Weight per week", manualWeeklyRate: -0.6 }).settingsDerived.targetWeeklyChange, 0.6);
  close(run({ goalType: "Cut", goalWeight: 170, manualRateType: "Weight per week", manualWeeklyRate: 0.6 }).settingsDerived.targetWeeklyChange, -0.6);
  close(run({ goalType: "Recomp", goalWeight: 170 }).settingsDerived.targetWeeklyChange, -0.45);
  assert.equal(run({ goalType: "Maintain", goalWeight: 180 }).settingsDerived.targetWeeklyChange, 0);
  assert.equal(run({ goalType: "Maintain" }).settingsDerived.projectedGoalDate, null);
  assert.equal(run({ manualRateType: "Weight per week", manualWeeklyRate: 1 }).settingsDerived.projectedGoalDate, date(70));
  assert.equal(run({ manualWeeklyRate: 0 }).settingsDerived.projectedGoalDate, null);
});

test("rate limit is an explicit planning warning, not an invented hold rule", () => {
  const r = run({ manualWeeklyRate: 0.02, maximumWeeklyRate: 0.01 });
  assert.ok(r.settingsDerived.planningStatus.startsWith("WARNING"));
  assert.ok(r.diagnostics.some(d => d.code === "RATE_ABOVE_LIMIT"));
  assert.equal(r.weekly[1].holdRule, null);
});

test("all workbook hold rules and their precedence are preserved", () => {
  const cases = [
    [{ goalWeight: 179, holdCalories: true }, logs(), "GOAL_REACHED"],
    [{ planningMode: "Reach goal weight by target date", goalDate: date(8), holdCalories: true }, logs(), "DATE_PASSED"],
    [{ holdCalories: true }, logs(), "USER_HOLD"],
    [{ macroMode: WEIGHT_MACRO_OPTIONS.macroMode[4] }, logs(), "FIXED_MACROS"],
    [{ adjustmentMode: "Manual" }, logs(), "MANUAL_MODE"],
    [{}, logs(14, () => ({ weight: null })), "INSUFFICIENT_HISTORY"],
    [{ observationDays: 30 }, logs(), "OBSERVATION"],
    [{}, logs(14, i => ({ includeWeight: i < 9 })), "LOW_WEIGHINS"],
    [{}, logs(14, i => i >= 7 ? { calories: null } : {}), "POOR_ADHERENCE"],
    [{ dailyChangeThreshold: 1 }, logs(14, i => ({ weight: 180 + (i % 2 ? 4 : -4) })), "NOISY_DATA"],
    [{ variabilityThreshold: 1, dailyChangeThreshold: 0.005 }, logs(14, i => ({ weight: i >= 10 ? 182 : 180 })), "WATER_ANOMALY"],
    [{ goalType: "Maintain", goalWeight: 180 }, logs(), "WITHIN_RANGE"],
    [{ manualRateType: "Weight per week", manualWeeklyRate: 0.07 }, logs(), "WITHIN_DEADBAND"],
  ];
  for (const [settings, records, expected] of cases) {
    const w = run(settings, records).weekly[1];
    assert.equal(w.holdRule, expected, expected);
    assert.equal(w.cappedAdjustment, 0, expected);
    assert.ok(w.reason.length > 15);
  }
});

test("deload and disruption remain context inputs, not invented workbook hold rules", () => {
  const r = run({}, logs(), [{ week: 2, deload: true, disruption: true, notes: "Synthetic context" }]);
  assert.equal(r.weekly[1].holdRule, null);
  assert.equal(r.weekly[1].deload, true);
  assert.equal(r.weekly[1].disruption, true);
  assert.equal(r.weekly[1].cells.CD, "Synthetic context");
});

test("water flag uses explicit sodium/carb context only with sufficient variability", () => {
  const flat = run({}, logs(14, () => ({ weight: 180, highSodiumCarb: true })));
  assert.equal(flat.weekly[1].refeed, true);
  assert.equal(flat.weekly[1].waterAnomaly, false);
  const noisy = run({ dailyChangeThreshold: 1 }, logs(14, i => ({ weight: 180 + (i % 2 ? 1.1 : -1.1), highSodiumCarb: i === 9 })));
  assert.equal(noisy.weekly[1].holdRule, "WATER_ANOMALY");
});

test("adherence includes all expected week days and positive actuals only", () => {
  const r = run({}, logs(14, i => i >= 11 ? { calories: null, protein: 0 } : {}));
  assert.equal(r.weekly[1].calorieDays, 4);
  close(r.weekly[1].nutritionAdherence, 4 / 7);
  assert.equal(r.weekly[1].averages.protein, 150);
  assert.equal(r.daily[11].proteinAdherence, 0); // Explicit zero actual is not blank.
  assert.equal(r.daily[11].calorieAdherence, null);
});

test("TDEE uses 3500 per lb or 7700 per kg and only reliable logged weeks", () => {
  for (const [weightUnit, energy] of [["lb", 3500], ["kg", 7700]]) {
    const r = run({ weightUnit });
    assert.equal(r.weekly[0].estimatedTdee, null);
    close(r.weekly[1].estimatedTdee, 2500 - 0.07 * energy / 7);
    close(r.weekly[2].smoothedTdee, 0.35 * r.weekly[2].estimatedTdee + 0.65 * r.weekly[1].smoothedTdee);
  }
  const r = run({}, logs(35, i => i >= 14 ? { calories: null } : {}));
  assert.equal(r.weekly[2].estimatedTdee, null);
  assert.equal(r.weekly[2].smoothedTdee, r.weekly[1].smoothedTdee);
});

test("trajectory correction requires persistent same-side error and is capped", () => {
  const r = run();
  assert.equal(r.weekly[0].trajectoryCorrection, 0);
  close(r.weekly[2].trajectoryCorrection, 50);
  assert.equal(run({ trajectoryCorrection: false }).weekly[2].trajectoryCorrection, 0);
  assert.equal(run({ maximumTrajectoryCorrection: 12 }).weekly[2].trajectoryCorrection, 12);
});

test("adjustments honor minimum increment, rounding, weekly caps and absolute limits", () => {
  assert.equal(run({ trajectoryCorrection: false }).weekly[1].cappedAdjustment, 100);
  assert.equal(run({ trajectoryCorrection: false, maximumWeeklyIncrease: 60 }).weekly[1].cappedAdjustment, 60);
  assert.equal(run({ trajectoryCorrection: false, manualRateType: "Weight per week", manualWeeklyRate: 0.08, rateDeadband: 0 }).weekly[1].cappedAdjustment, 0);
  const cut = run({ goalType: "Cut", goalWeight: 160, manualWeeklyRate: 0.01, maximumWeeklyDecrease: 75, trajectoryCorrection: false });
  assert.equal(cut.weekly[1].cappedAdjustment, -75);
  assert.equal(run({ maximumCalories: 2550 }).weekly[1].recommendedCalories, 2550);
  assert.equal(run({ goalType: "Cut", goalWeight: 160, manualWeeklyRate: 0.01, minimumCalories: 2475 }).weekly[1].recommendedCalories, 2475);
});

test("recommendation-only does not adopt proposals; automatic chains and manual overrides clamp", () => {
  const recommendation = run();
  assert.equal(recommendation.weekly[1].recommendedCalories, 2650);
  assert.equal(recommendation.weekly[1].next.calories, 2500);
  const automatic = run({ adjustmentMode: "Fully automatic" });
  assert.equal(automatic.weekly[1].next.calories, 2650);
  assert.equal(automatic.weekly[2].current.calories, 2650);
  const manual = run({ adjustmentMode: "Manual", maximumCalories: 3000 }, logs(), [{ week: 2, calories: 8000 }]);
  assert.equal(manual.weekly[1].next.calories, 3000);
  assert.equal(manual.weekly[1].status, "Manual override applied");
  assert.ok(manual.weekly[1].diagnostics.some(d => d.code === "OVERRIDE_CLAMPED"));
  assert.equal(run({}, logs(), [{ week: 2, calories: 0 }]).weekly[1].next.calories, 1200);
});

test("all six macro modes and five protein bases calculate without falling through", () => {
  const expected = [[150, 340, 60], [150, 320, 70], [180, 300, 65], [155, 315, 70], [150, 250, 60], [155, 315, 70]];
  for (const [i, macroMode] of WEIGHT_MACRO_OPTIONS.macroMode.entries()) {
    const r = run({ macroMode });
    assert.deepEqual([r.initialMacros.protein, r.initialMacros.carbs, r.initialMacros.fat], expected[i]);
    assert.ok(r.weekly[0].next.macroCalories > 0);
  }
  for (const [proteinBasis, expectedProtein] of WEIGHT_MACRO_OPTIONS.proteinBasis.map((basis, i) => [basis, [150, 180, 190, 145, 155][i]])) {
    assert.equal(run({ proteinBasis, bodyFatPercent: 0.2 }).initialMacros.protein, expectedProtein);
  }
  assert.equal(run({ proteinBasis: WEIGHT_MACRO_OPTIONS.proteinBasis[3], bodyFatPercent: 0.2, manualLeanMass: 130 }).initialMacros.protein, 130);
  assert.equal(run({ proteinBasis: WEIGHT_MACRO_OPTIONS.proteinBasis[3], bodyFatPercent: null }).initialMacros.protein, null);
});

test("protein hold and recalculation use trend weight; fixed mode ignores calorie override transparently", () => {
  const s = setup({ proteinBasis: WEIGHT_MACRO_OPTIONS.proteinBasis[1], holdProtein: false });
  const current = { calories: 2500, protein: 180, carbs: 300, fat: 65, macroCalories: 2505 };
  assert.equal(nextWeightMacroTargets(s, current, 190, 2700).protein, 190);
  assert.equal(nextWeightMacroTargets({ ...s, holdProtein: true }, current, 190, 2700).protein, 180);
  const fixed = run({ macroMode: WEIGHT_MACRO_OPTIONS.macroMode[4] }, logs(), [{ week: 2, calories: 3500 }]);
  assert.equal(fixed.initialMacros.calories, 2140);
  assert.equal(fixed.weekly[1].next.calories, 2140);
  assert.equal(fixed.weekly[1].status, "Fixed macros—manual");
  assert.ok(fixed.weekly[1].diagnostics.some(d => d.code === "FIXED_MACROS_OVERRIDE_IGNORED"));
  assert.equal(nextWeightMacroTargets(setup({ macroMode: WEIGHT_MACRO_OPTIONS.macroMode[4] }), current, 190, 3500).calories, 2140);
});

test("increase and decrease macro priorities, carb floors and feasibility", () => {
  const current = { calories: 2500, protein: 150, carbs: 340, fat: 60, macroCalories: 2500 };
  for (const increasePriority of WEIGHT_MACRO_OPTIONS.increasePriority) {
    const m = nextWeightMacroTargets(setup({ increasePriority }), current, 180, 2680);
    assert.equal(m.protein, 150);
    if (increasePriority === "Carbohydrates") assert.equal(m.fat, 60);
    if (increasePriority === "Fat") assert.equal(m.fat, 80);
    if (increasePriority === "Proportional split") assert.equal(m.fat, 65);
  }
  for (const decreasePriority of WEIGHT_MACRO_OPTIONS.decreasePriority) {
    const m = nextWeightMacroTargets(setup({ decreasePriority }), current, 180, 2320);
    if (decreasePriority === "Carbohydrates") assert.equal(m.fat, 60);
    if (decreasePriority === "Fat") assert.equal(m.fat, 40);
    if (decreasePriority === "Proportional split") assert.equal(m.fat, 50);
    assert.ok(m.carbs >= 50);
  }
  const impossible = nextWeightMacroTargets(setup({ minimumFat: 60, minimumCarbs: 100 }), current, 180, 1300);
  assert.deepEqual(impossible, { calories: 1300, protein: null, carbs: null, fat: null, macroCalories: null });
  const r = run({ minimumFat: 43 }, logs(), [{ week: 1, calories: 1220 }]);
  assert.equal(r.weekly[0].next.fat, 45); // Still fits after downward rounding.
  const roundingFloor = run({ minimumFat: 43, fatGrams: 43 }, logs(), [{ week: 1, calories: 1200 }]);
  assert.equal(roundingFloor.weekly[0].next.fat, 40);
  assert.ok(roundingFloor.weekly[0].diagnostics.some(d => d.code === "FAT_FLOOR_ROUNDING"));
});

test("percentage setup warnings and daily remainder mismatch are not concealed", () => {
  const r = run({ macroMode: WEIGHT_MACRO_OPTIONS.macroMode[3], proteinPercent: 0.2, fatPercent: 0.2, carbsPercent: 0.2 });
  assert.ok(r.settingsDerived.macroSetupStatus.includes("100%"));
  assert.notEqual(r.daily[0].target.carbs, r.weekly[0].current.carbs);
  assert.ok(r.weekly[0].diagnostics.some(d => d.code === "DAILY_CARBS_REMAINDER"));
  assert.ok(run({ macroMode: WEIGHT_MACRO_OPTIONS.macroMode[5], proteinPercent: 0.8, fatPercent: 0.3 }).settingsDerived.macroSetupStatus.includes("leave no carbohydrate"));
});

test("cycling reconciles weekly average for calories/percent and zero/seven training days", () => {
  for (const cyclingInputType of WEIGHT_MACRO_OPTIONS.cyclingInputType) for (const trainingDaysPerWeek of [0, 2, 7]) {
    const r = run({ cycling: true, trainingDaysPerWeek, cyclingInputType, trainingPremium: cyclingInputType === "Calories" ? 150 : 0.06, restReduction: cyclingInputType === "Calories" ? 75 : 0.03 });
    close(r.settingsDerived.cyclingAverage, 2500);
    close((trainingDaysPerWeek * r.settingsDerived.currentTrainingTarget + (7 - trainingDaysPerWeek) * r.settingsDerived.currentRestTarget) / 7, 2500);
    assert.equal(r.settingsDerived.cyclingStatus, "Weekly average reconciles to target");
  }
});

test("all daily cycling protein/fat branches are explicit and match the reusable helper", () => {
  const current = { calories: 2500, protein: 150, carbs: 340, fat: 60, macroCalories: 2500 };
  for (const sameProteinEveryDay of [true, false]) for (const cycleCarbsOnly of [true, false]) {
    const s = setup({ cycling: true, sameProteinEveryDay, cycleCarbsOnly, trainingDaysPerWeek: 4, trainingPremium: 200, restReduction: 100 });
    const m = weightMacroDailyTarget(s, current, "Training");
    assert.equal(m.protein, sameProteinEveryDay ? 150 : 160);
    assert.equal(m.fat, sameProteinEveryDay && cycleCarbsOnly ? 60 : 65);
    assert.deepEqual(calculateWeightMacroTracker(s, [], [], date(0)).daily[0].target, m);
  }
});

test("accepted weekly targets anchor evidence and proposals without changing logged actuals", () => {
  const accepted = { calories: 2800, protein: 160, carbs: 390, fat: 65, macroCalories: 2785 };
  const records = logs();
  const before = structuredClone(records);
  const r = run({ adjustmentMode: "Fully automatic" }, records, [], date(34), { acceptedWeeklyTargets: { 2: accepted } });
  assert.deepEqual(r.weekly[1].current, accepted);
  assert.equal(r.daily[7].target.calories, 2800);
  close(r.weekly[1].nutritionAdherence, 2500 / 2800);
  assert.equal(r.daily[7].calories, 2500);
  assert.deepEqual(records, before);
  const proposal = nextWeightMacroTargets(setup(), r.weekly[1].current, r.weekly[1].endingTrend, r.weekly[1].recommendedCalories);
  assert.equal(proposal.calories, r.weekly[1].recommendedCalories);
});

test("dashboard exposes numerical series and evidence-based changes without blank coercion", () => {
  const r = run({}, logs(35, i => ({ waist: 34 - i / 100 })));
  assert.equal(r.dashboard.latestWeightDate, date(34));
  close(r.dashboard.totalChange, 0.31);
  close(r.dashboard.change7, 0.07);
  close(r.dashboard.change14, 0.14);
  close(r.dashboard.change28, 0.28);
  close(r.dashboard.waistChange, -0.34);
  assert.equal(r.dashboard.trendSeries.length, 30);
  assert.equal(r.dashboard.adherenceSeries.length, 35);
  assert.equal(r.dashboard.direction, "Rising");
  const short = run({}, logs(8), [], date(7));
  assert.equal(short.dashboard.change7, null); // First day had no selected trend.
});

test("invalid settings/dates fail safely; duplicates and malformed observations do not fabricate values", () => {
  assert.equal(isWeightMacroDate("2026-02-30"), false);
  assert.equal(isWeightMacroDate("2024-02-29"), true);
  for (const settings of [{ startDate: "2026-02-30" }, { calorieRounding: 0 }, { macroRounding: 0 }, { macroRounding: 1e-300 }, { startingWeight: Number.MAX_VALUE }, { minimumCalories: 4000, maximumCalories: 3000 }, { daysToGenerate: 366 }, { ewSmoothing: 1.1 }, { trainingDaysPerWeek: 8 }, { planningMode: "Reach goal weight by target date", goalDate: null }]) {
    const r = run(settings);
    assert.ok(r.validation.some(d => d.severity === "error"));
    assert.equal(r.dashboard, null);
  }
  const r = run({}, [...logs(4), { date: date(0), weight: 999, includeWeight: true }, { date: date(4), weight: Number.NaN, includeWeight: true, calories: -10 }]);
  assert.equal(r.daily[0].weight, null);
  assert.equal(r.daily[4].weight, null);
  assert.equal(r.daily[4].calories, null);
  assert.ok(r.diagnostics.some(d => d.code === "DUPLICATE_DATE"));
  assert.ok(r.diagnostics.some(d => d.code === "INVALID_OBSERVATION"));
  const tinyRate = run({ manualWeeklyRate: 1e-300 });
  assert.equal(tinyRate.settingsDerived.projectedGoalDate, null);
  assert.ok(tinyRate.diagnostics.some(d => d.code === "PROJECTED_DATE_OUT_OF_RANGE"));
});
