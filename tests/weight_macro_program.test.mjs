import assert from "node:assert/strict";
import test from "node:test";
import {
  createWeightMacroSettings,
  weightMacroDailyTarget,
} from "../src/app/weight_macro_engine.ts";
import {
  acceptedTrackerTarget,
  buildTrackerProposal,
  convertTrackerSettingsWeightUnit,
  createTrackerProgram,
  decideTrackerProposal,
  evaluateTrackerProgram,
  foodDaySignature,
  normalizeTrackerProgram,
  prepareTrackerRecords,
  trackerCheckinForDate,
  trackerFoodDayComplete,
  trackerInputRevision,
  updateTrackerSettings,
} from "../src/app/weight_macro_program.ts";

const clone = (value) => JSON.parse(JSON.stringify(value));
const sources = () => ({ foodLog: [], bodyWeightHistory: [] });
const context = { completedWorkouts: 4, recoveryFlags: 0 };
const asOf = "2026-06-29";
const recordedAt = "2026-06-29T16:00:00.000Z";
const settings = (extra) =>
  createWeightMacroSettings({
    startDate: "2026-06-01",
    startingWeight: 200,
    goalWeight: 180,
    startingCalories: 2400,
    goalType: "Cut",
    manualWeeklyRate: 0.005,
    daysToGenerate: 42,
    observationDays: 0,
    ...extra,
  });
const setup = (extra) =>
  createTrackerProgram(
    settings(extra),
    "2026-06-01",
    "2026-06-01T16:00:00.000Z",
    "program:one",
  );
const completeFixture = (extra) => ({
  ...setup(extra),
  checkins: Array.from({ length: 28 }, (_, index) => ({
    date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    weight: 200,
    includeWeight: true,
    nutritionSource: "manual",
    foodComplete: true,
    calories: 2400,
    protein: 200,
    carbs: 265,
    fat: 60,
  })),
});
const food = (date = "2026-06-01", id = "food:one") => ({
  id,
  date,
  label: "A real diary entry",
  calories: 600,
  protein: 40,
  carbs: 65,
  fat: 20,
  servings: 1,
  servingLabel: "meal",
  recordedAt: null,
  baseNutrients: { calories: 600, protein: 40, carbs: 65, fat: 20 },
});
const decide = (program, action = "accept", extra = {}) => {
  const s = extra.sources ?? sources();
  const c = extra.context ?? context;
  const day = extra.asOf ?? asOf;
  const proposal = extra.proposal ?? buildTrackerProposal(program, s, day, c);
  assert.ok(proposal);
  return decideTrackerProposal(
    program,
    s,
    proposal,
    action,
    day,
    recordedAt,
    c,
    extra.calories,
  );
};

test("strict load preserves valid records and unknown extension fields exactly", () => {
  const program = completeFixture();
  program.extension = { retained: ["future optional metadata", 0, false] };
  program.settings.extension = { owner: "local" };
  program.revisions[0].settings.extension = { old: "frozen" };
  program.decisions[0].extension = "keep";
  program.checkins[0].extension = [null];
  program.weeklyOverrides = [
    {
      week: 2,
      calories: null,
      deload: false,
      disruption: true,
      notes: "travel",
      extension: 3,
    },
  ];
  program.completeFoodDays["2026-06-02"] = foodDaySignature(
    [food("2026-06-02")],
    "2026-06-02",
  );
  const raw = JSON.stringify(program);
  assert.equal(normalizeTrackerProgram(program), program);
  assert.equal(JSON.stringify(normalizeTrackerProgram(JSON.parse(raw))), raw);
  assert.equal(normalizeTrackerProgram(null), null);
  assert.equal(normalizeTrackerProgram(undefined), null);
});

test("strict load rejects corrupt settings, enums, flags, dates and partial completed totals", () => {
  const mutations = [
    (p) => {
      p.version = 2;
    },
    (p) => {
      p.id = "";
    },
    (p) => {
      p.settings.holdCalories = "false";
    },
    (p) => {
      p.settings.athleteName = 7;
    },
    (p) => {
      p.revisions[0].settings.weightUnit = "stone";
    },
    (p) => {
      p.revisions[0].settings.minimumCalories = "1200";
    },
    (p) => {
      p.checkins[0].date = "2026-02-30";
    },
    (p) => {
      p.checkins[0].weight = 0;
    },
    (p) => {
      p.checkins[0].sleepHours = 25;
    },
    (p) => {
      p.checkins[0].performance = 0;
    },
    (p) => {
      p.checkins[0].includeWeight = "yes";
    },
    (p) => {
      p.checkins[0].foodComplete = 1;
    },
    (p) => {
      p.checkins[0].dayType = "Off";
    },
    (p) => {
      p.checkins[0].nutritionSource = "guess";
    },
    (p) => {
      p.checkins[0].recordedAt = "2026-02-30T12:00:00Z";
    },
    (p) => {
      p.checkins[0].notes = {};
    },
    (p) => {
      delete p.checkins[0].calories;
    },
    (p) => {
      p.checkins.push(clone(p.checkins[0]));
    },
  ];
  for (const mutate of mutations) {
    const program = completeFixture();
    mutate(program);
    assert.throws(
      () => normalizeTrackerProgram(program),
      /saved|invalid|recovery/i,
    );
  }
});

test("strict load rejects malformed evidence, overrides, ledger and disconnected targets", () => {
  const mutations = [
    (p) => {
      p.completeFoodDays["not-a-date"] = "[]";
    },
    (p) => {
      p.completeFoodDays["2026-06-01"] = "not-json";
    },
    (p) => {
      p.completeFoodDays["2026-06-01"] = '[["food",600,40,65,20,0]]';
    },
    (p) => {
      p.weeklyOverrides = [{ week: 0 }];
    },
    (p) => {
      p.weeklyOverrides = [{ week: 1.5 }];
    },
    (p) => {
      p.weeklyOverrides = [{ week: 2, deload: "false" }];
    },
    (p) => {
      p.weeklyOverrides = [{ week: 2, calories: "1800" }];
    },
    (p) => {
      p.weeklyOverrides = [{ week: 2 }, { week: 2 }];
    },
    (p) => {
      p.decisions[0].action = "approved";
    },
    (p) => {
      p.decisions[0].ruleVersion = "future-v2";
    },
    (p) => {
      p.decisions[0].inputRevision = null;
    },
    (p) => {
      p.decisions[0].recordedAt = "tomorrow";
    },
    (p) => {
      p.decisions[0].formulaRefs = [4];
    },
    (p) => {
      p.decisions[0].reasons = [{}];
    },
    (p) => {
      p.decisions[0].evidenceDates = ["2026-06-31"];
    },
    (p) => {
      p.decisions[0].after.carbs = 50;
    },
    (p) => {
      p.revisions[0].target.macroCalories = 0;
    },
    (p) => {
      p.revisions[0].decisionId = "missing";
    },
    (p) => {
      p.revisions.push(clone(p.revisions[0]));
    },
    (p) => {
      p.revisions = [];
    },
    (p) => {
      p.decisions = [];
    },
  ];
  for (const mutate of mutations) {
    const program = completeFixture();
    mutate(program);
    assert.throws(
      () => normalizeTrackerProgram(program),
      /saved|invalid|recovery/i,
    );
  }
});

test("diary days remain unknown until complete and any nutrition edit invalidates completion", () => {
  const program = setup();
  const s = { ...sources(), foodLog: [food()] };
  assert.equal(prepareTrackerRecords(program, s, asOf)[0].calories, null);
  program.completeFoodDays["2026-06-01"] = foodDaySignature(
    s.foodLog,
    "2026-06-01",
  );
  assert.equal(trackerFoodDayComplete(program, s.foodLog, "2026-06-01"), true);
  assert.equal(prepareTrackerRecords(program, s, asOf)[0].calories, 600);
  s.foodLog[0].calories = 601;
  assert.equal(trackerFoodDayComplete(program, s.foodLog, "2026-06-01"), false);
  assert.equal(prepareTrackerRecords(program, s, asOf)[0].calories, null);
  assert.equal(program.completeFoodDays["2026-06-01"].includes("600"), true);
});

test("partial manual totals never fall through to a completed diary; complete manual replaces rather than adds", () => {
  const program = setup();
  const s = { ...sources(), foodLog: [food()] };
  program.completeFoodDays["2026-06-01"] = foodDaySignature(
    s.foodLog,
    "2026-06-01",
  );
  program.checkins = [
    {
      date: "2026-06-01",
      nutritionSource: "manual",
      foodComplete: false,
      calories: 1800,
    },
  ];
  assert.equal(prepareTrackerRecords(program, s, asOf)[0].calories, null);
  program.checkins[0].foodComplete = true;
  assert.equal(prepareTrackerRecords(program, s, asOf)[0].calories, null);
  Object.assign(program.checkins[0], { protein: 150, carbs: 165, fat: 60 });
  assert.equal(prepareTrackerRecords(program, s, asOf)[0].calories, 1800);
  assert.equal(s.foodLog[0].calories, 600);
});

test("explicit zero complete day differs from missing and future records are excluded", () => {
  const program = setup();
  program.completeFoodDays["2026-06-02"] = "[]";
  program.checkins = [
    {
      date: "2026-06-03",
      nutritionSource: "manual",
      foodComplete: true,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    { date: "2026-07-01", weight: 200 },
  ];
  const records = prepareTrackerRecords(program, sources(), asOf);
  assert.deepEqual(
    records.map((r) => [r.date, r.calories]),
    [
      ["2026-06-02", 0],
      ["2026-06-03", 0],
    ],
  );
  assert.throws(
    () => prepareTrackerRecords(program, sources(), "2026-02-30"),
    /real/,
  );
});

test("weight merge is deterministic, source-unit aware, and preserves explicit exclusions", () => {
  const program = setup({
    weightUnit: "kg",
    startingWeight: 90,
    goalWeight: 80,
  });
  const a = {
    id: "older",
    date: "2026-06-01",
    weightLb: 180,
    recordedAt: "2026-06-01T09:00:00Z",
  };
  const b = {
    id: "newer",
    date: "2026-06-01",
    weightLb: 190,
    recordedAt: "2026-06-01T11:00:00Z",
  };
  const s = { ...sources(), bodyWeightHistory: [b, a] };
  assert.equal(
    trackerCheckinForDate(program, s, a.date).weight,
    190 * 0.45359237,
  );
  program.checkins = [
    {
      date: a.date,
      includeWeight: false,
      weight: null,
      notes: "Exclude noisy day",
    },
  ];
  const row = prepareTrackerRecords(program, s, asOf)[0];
  assert.equal(row.weight, 190 * 0.45359237);
  assert.equal(row.includeWeight, false);
  program.checkins[0].weight = 84;
  program.checkins[0].recordedAt = "2026-06-01T12:00:00Z";
  assert.equal(trackerCheckinForDate(program, s, a.date).weight, 84);
  assert.deepEqual(s.bodyWeightHistory, [b, a]);
  assert.throws(() => trackerCheckinForDate(program, s, "2026-02-30"), /real/);
});

test("proposal keeps exact input text and rejects every changed source, date, setting or ledger", () => {
  const original = completeFixture();
  const s = sources();
  const proposal = buildTrackerProposal(original, s, asOf, context);
  assert.ok(proposal && !proposal.blocked);
  assert.equal(
    proposal.inputRevision,
    trackerInputRevision(original, s, asOf, context),
  );
  for (const mutate of [
    (p) => {
      p.checkins[0].weight += 0.000001;
    },
    (p) => {
      p.settings.maximumWeeklyDecrease += 1;
    },
    (p) => {
      p.decisions[0].reasons.push("New context");
    },
    (p) => {
      p.extension = { changed: true };
    },
  ]) {
    const program = clone(original);
    mutate(program);
    assert.throws(() => decide(program, "accept", { proposal }), /changed/);
  }
  assert.throws(
    () =>
      decide(original, "accept", {
        proposal,
        sources: { ...s, foodLog: [food()] },
      }),
    /changed/,
  );
  assert.throws(
    () =>
      decide(original, "accept", {
        proposal,
        context: { ...context, completedWorkouts: 5 },
      }),
    /changed/,
  );
  assert.throws(
    () => decide(original, "accept", { proposal, asOf: "2026-06-30" }),
    /changed/,
  );
});

test("acceptance starts tomorrow, recomputes forged proposal values, and never mutates actuals", () => {
  const program = completeFixture();
  const s = sources();
  const before = clone(program);
  const proposal = buildTrackerProposal(program, s, asOf, context);
  proposal.after = {
    calories: 9999,
    protein: 1,
    carbs: 1,
    fat: 1,
    macroCalories: 17,
  };
  const accepted = decide(program, "accept", { proposal, sources: s });
  assert.equal(accepted.revisions.length, 2);
  assert.equal(accepted.revisions[1].effectiveDate, "2026-06-30");
  assert.equal(acceptedTrackerTarget(accepted, asOf).calories, 2400);
  assert.equal(acceptedTrackerTarget(accepted, "2026-06-30").calories, 2200);
  assert.deepEqual(accepted.checkins, before.checkins);
  assert.deepEqual(program, before);
  assert.deepEqual(s, sources());
  assert.ok(accepted.decisions[1].inputRevision.length < 12);
  assert.ok(accepted.decisions[0].inputRevision.length < 12);
  assert.equal(normalizeTrackerProgram(accepted), accepted);
});

test("dismiss and acceptance are one decision per closed week even when evidence changes", () => {
  for (const action of ["accept", "dismiss"]) {
    const program = completeFixture();
    const decided = decide(program, action);
    assert.equal(buildTrackerProposal(decided, sources(), asOf, context), null);
    decided.checkins[0].weight += 0.01;
    assert.equal(buildTrackerProposal(decided, sources(), asOf, context), null);
    assert.equal(decided.revisions.length, action === "dismiss" ? 1 : 2);
    assert.equal(normalizeTrackerProgram(decided), decided);
    const duplicate = clone(decided.decisions[1]);
    duplicate.id += ":duplicate";
    decided.decisions.push(duplicate);
    assert.throws(() => normalizeTrackerProgram(decided), /Duplicate/);
  }
});

test("automatic changes require explicit automatic mode and all evidence/context holds to pass", () => {
  assert.throws(() => decide(completeFixture(), "automatic"), /not enabled/);
  const automatic = completeFixture({ adjustmentMode: "Fully automatic" });
  assert.equal(decide(automatic, "automatic").decisions[1].action, "automatic");
  for (const extra of [
    { context: { completedWorkouts: 4, recoveryFlags: 1 } },
    { context: { completedWorkouts: 0, recoveryFlags: 1 } },
  ])
    assert.throws(() => decide(automatic, "automatic", extra), /on hold/);
  for (const hold of ["deload", "disruption"]) {
    const program = clone(automatic);
    program.weeklyOverrides = [{ week: 4, [hold]: true }];
    assert.throws(() => decide(program, "automatic"), /on hold/);
  }
  const partial = clone(automatic);
  partial.checkins.slice(21).forEach((c) => {
    c.foodComplete = false;
  });
  assert.throws(() => decide(partial, "automatic"), /on hold/);
});

test("manual override enforces calorie limits and feasible macros instead of silently clamping", () => {
  const program = completeFixture();
  for (const calories of [1199, 6001, NaN, Infinity, "2000", undefined]) {
    assert.throws(() => decide(program, "override", { calories }), /limits/);
  }
  assert.throws(
    () => decide(program, "override", { calories: 1200 }),
    /macro settings/,
  );
  const overridden = decide(program, "override", { calories: 2100 });
  assert.equal(overridden.revisions[1].target.calories, 2100);
  assert.equal(normalizeTrackerProgram(overridden), overridden);
  assert.throws(
    () =>
      decide(
        completeFixture({
          macroMode: "Fixed grams for all three macros; calories from macros",
        }),
        "override",
        { calories: 2000 },
      ),
    /Fixed-grams/,
  );
});

test("later settings changes preserve today and earlier accepted targets using frozen cycling settings", () => {
  const original = completeFixture();
  const historical = acceptedTrackerTarget(original, "2026-06-15");
  const updated = updateTrackerSettings(
    original,
    {
      ...original.settings,
      startingCalories: 2600,
      cycling: true,
      trainingPremium: 200,
      restReduction: 150,
    },
    asOf,
    recordedAt,
  );
  assert.equal(updated.revisions[1].effectiveDate, "2026-06-30");
  assert.deepEqual(updated.revisions[0], original.revisions[0]);
  assert.deepEqual(acceptedTrackerTarget(updated, "2026-06-15"), historical);
  assert.equal(acceptedTrackerTarget(updated, asOf).calories, 2400);
  const result = evaluateTrackerProgram(updated, sources(), asOf);
  assert.deepEqual(
    result.daily.find((d) => d.date === "2026-06-15").target,
    historical,
  );
  assert.equal(
    result.daily.find((d) => d.date === "2026-06-15").calorieAdherence,
    1,
  );
  assert.deepEqual(
    acceptedTrackerTarget(updated, "2026-06-30"),
    weightMacroDailyTarget(
      updated.revisions[1].settings,
      updated.revisions[1].target,
      "Training",
    ),
  );
  assert.equal(normalizeTrackerProgram(updated), updated);
});

test("a midweek target/settings revision holds the mixed evidence week without rewriting it", () => {
  const original = completeFixture();
  const updated = updateTrackerSettings(
    original,
    { ...original.settings, startingCalories: 2500 },
    "2026-06-24",
    "2026-06-24T16:00:00.000Z",
  );
  const proposal = buildTrackerProposal(updated, sources(), asOf, context);
  assert.ok(proposal?.blocked);
  assert.match(proposal.reasons.join(" "), /mixed targets/);
  assert.equal(acceptedTrackerTarget(updated, "2026-06-24").calories, 2400);
  assert.equal(acceptedTrackerTarget(updated, "2026-06-25").calories, 2500);
  assert.throws(() => decide(updated), /on hold/);
  const result = evaluateTrackerProgram(updated, sources(), asOf);
  assert.equal(
    result.daily.find((d) => d.date === "2026-06-24").target.calories,
    2400,
  );
  assert.equal(
    result.daily.find((d) => d.date === "2026-06-25").target.calories,
    2500,
  );
});

test("settings-unit conversion changes numbers without relabeling physical observations or old settings", () => {
  const original = completeFixture({
    manualRateType: "Weight per week",
    manualWeeklyRate: 1,
    manualLeanMass: 150,
  });
  const metric = convertTrackerSettingsWeightUnit(original.settings, "kg");
  assert.equal(metric.startingWeight, 200 * 0.45359237);
  assert.equal(metric.goalWeight, 180 * 0.45359237);
  assert.equal(metric.manualLeanMass, 150 * 0.45359237);
  assert.equal(metric.manualWeeklyRate, 0.45359237);
  assert.equal(metric.proteinPerWeight, 1 / 0.45359237);
  assert.equal(metric.maintenanceLowerTolerance, 0.45359237);
  const updated = updateTrackerSettings(original, metric, asOf, recordedAt);
  assert.equal(updated.checkins[0].weight, 200 * 0.45359237);
  assert.equal(updated.revisions[0].settings.weightUnit, "lb");
  assert.equal(updated.revisions[0].settings.startingWeight, 200);
  assert.equal(updated.revisions[1].settings.weightUnit, "kg");
  assert.deepEqual(
    acceptedTrackerTarget(updated, "2026-06-15"),
    acceptedTrackerTarget(original, "2026-06-15"),
  );
  const reverted = convertTrackerSettingsWeightUnit(metric, "lb");
  assert.ok(Math.abs(reverted.startingWeight - 200) < 1e-10);
  assert.ok(Math.abs(reverted.proteinPerWeight - 1) < 1e-10);
  const rate = settings({ manualWeeklyRate: 0.005 });
  assert.equal(
    convertTrackerSettingsWeightUnit(rate, "kg").manualWeeklyRate,
    0.005,
  );
  assert.equal(normalizeTrackerProgram(updated), updated);
});

test("setup refuses warning-level macro inconsistencies and unsafe cycling variants", () => {
  for (const extra of [
    {
      startingCalories: 1200,
      proteinBasis: "Manual fixed grams",
      proteinGrams: 150,
    },
    {
      cycling: true,
      minimumCalories: 2200,
      maximumCalories: 2500,
      trainingPremium: 200,
    },
    { cycling: true, trainingPremium: 5000, restReduction: 5000 },
    {
      macroMode: "Protein, carbohydrate, and fat percentages",
      proteinPercent: 0.3,
      fatPercent: 0.3,
      carbsPercent: 0.3,
    },
    { fatGrams: 40, minimumFat: 43 },
  ])
    assert.throws(() => setup(extra), /limits|cycling|feasibility/);
});

test("automatic and explicit override both reject a safe average with an unsafe rest-day target", () => {
  const program = completeFixture({
    cycling: true,
    trainingPremium: 200,
    restReduction: 100,
    minimumCalories: 2100,
  });
  const proposal = buildTrackerProposal(program, sources(), asOf, context);
  assert.equal(proposal.before.calories, 2400);
  assert.equal(proposal.after.calories, 2200);
  assert.ok(proposal.blocked);
  assert.match(proposal.reasons.join(" "), /every training\/rest day/);
  assert.throws(() => decide(program, "accept"), /on hold/);
  assert.throws(
    () => decide(program, "override", { calories: 2200 }),
    /daily calorie limits/,
  );
});

test("unsafe accepted daily targets return wholly unknown instead of mixing valid and fallback fields", () => {
  const program = setup();
  program.revisions[0].settings.cycling = true;
  program.revisions[0].settings.restReduction = 5000;
  assert.equal(acceptedTrackerTarget(program, "2026-06-01"), null);
  assert.equal(acceptedTrackerTarget(program, "2026-06-07"), null);
  assert.throws(
    () => normalizeTrackerProgram(program),
    /targets need recovery/,
  );
});

test("a newer canonical correction wins over an older check-in without losing check-in metadata", () => {
  const program = setup();
  program.checkins = [
    {
      date: "2026-06-01",
      recordedAt: "2026-06-01T10:00:00Z",
      weight: 180,
      includeWeight: false,
      notes: "Keep this exclusion",
      sleepHours: 8,
    },
  ];
  const s = {
    ...sources(),
    bodyWeightHistory: [
      {
        id: "corrected",
        date: "2026-06-01",
        recordedAt: "2026-06-02T10:00:00Z",
        weightLb: 181,
      },
    ],
  };
  const before = clone([program, s]);
  assert.equal(trackerCheckinForDate(program, s, "2026-06-01").weight, 181);
  const row = prepareTrackerRecords(program, s, asOf)[0];
  assert.equal(row.weight, 181);
  assert.equal(row.includeWeight, false);
  assert.equal(row.sleepHours, 8);
  assert.equal(row.notes, "Keep this exclusion");
  assert.deepEqual([program, s], before);
  program.checkins[0].recordedAt = null;
  assert.equal(trackerCheckinForDate(program, s, "2026-06-01").weight, 181);
  program.checkins[0].recordedAt = "2026-06-01T10:00:00Z";
  s.bodyWeightHistory[0].recordedAt = null;
  assert.equal(trackerCheckinForDate(program, s, "2026-06-01").weight, 180);
  program.checkins[0].recordedAt = null;
  assert.equal(trackerCheckinForDate(program, s, "2026-06-01").weight, 180);
});

test("editing a historical check-in day type changes analysis but never the accepted target", () => {
  const program = setup({
    cycling: true,
    trainingPremium: 200,
    restReduction: 100,
  });
  const accepted = acceptedTrackerTarget(program, "2026-06-01");
  program.checkins = [{ date: "2026-06-01", dayType: "Rest", weight: 200 }];
  assert.deepEqual(acceptedTrackerTarget(program, "2026-06-01"), accepted);
  const daily = evaluateTrackerProgram(program, sources(), asOf).daily[0];
  assert.equal(daily.dayType, "Rest");
  assert.deepEqual(daily.target, accepted);
  const updated = updateTrackerSettings(
    program,
    program.settings,
    asOf,
    recordedAt,
  );
  assert.equal(updated.revisions[1].dayTypes["2026-06-01"], "Rest");
  program.checkins[0].dayType = "Training";
  assert.equal(updated.revisions[1].dayTypes["2026-06-01"], "Rest");
  assert.equal(normalizeTrackerProgram(updated), updated);
});

test("optional legacy day-type snapshot uses frozen weekly settings and corrupt snapshots are rejected", () => {
  const program = setup({ cycling: true });
  delete program.revisions[0].dayTypes;
  const accepted = acceptedTrackerTarget(program, "2026-06-01");
  program.checkins = [{ date: "2026-06-01", dayType: "Rest" }];
  assert.deepEqual(acceptedTrackerTarget(program, "2026-06-01"), accepted);
  assert.equal(normalizeTrackerProgram(program), program);
  program.revisions[0].dayTypes = { "2026-02-30": "Training" };
  assert.throws(() => normalizeTrackerProgram(program), /day-type history/);
  program.revisions[0].dayTypes = { "2026-06-01": "Off" };
  assert.throws(() => normalizeTrackerProgram(program), /day-type history/);
});
