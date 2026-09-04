// prettier-ignore
// @ts-ignore TS5097: explicit extensions support the native Node test runner.
import { calculateWeightMacroTracker, validateWeightMacroSettings, isWeightMacroDate, weightMacroDailyTarget, nextWeightMacroTargets, WEIGHT_MACRO_RULE_VERSION } from "./weight_macro_engine.ts";
import type {
  WeightMacroSettings,
  WeightMacroDailyRecord,
  WeightMacroWeeklyOverride,
  TrackerMacros,
  WeightMacroWeeklyResult,
} from "./weight_macro_engine";
// @ts-ignore TS5097
import { foodDiaryTotals } from "./food_diary.ts";
import type { FoodDiaryEntry } from "./food_diary";
import type { BodyweightHistoryEntry } from "./bodyweight_history";

export type TrackerCheckin = WeightMacroDailyRecord & {
  nutritionSource?: "diary" | "manual";
  foodComplete?: boolean;
};
export type TrackerTargetRevision = {
  id: string;
  effectiveDate: string;
  recordedAt: string;
  decisionId: string;
  settings: WeightMacroSettings;
  target: TrackerMacros;
  /** Accepted day-type overrides; later check-in edits affect analysis, not this target history. */
  dayTypes?: Record<string, "Training" | "Rest">;
};
export type TrackerDecision = {
  id: string;
  suggestionId: string;
  ruleVersion: string;
  inputRevision: string;
  action: "setup" | "accept" | "automatic" | "override" | "dismiss";
  recordedAt: string;
  effectiveDate: string;
  before: TrackerMacros | null;
  after: TrackerMacros | null;
  reasons: string[];
  formulaRefs: string[];
  evidenceDates: string[];
};
export type WeightMacroProgram = {
  version: 1;
  id: string;
  settings: WeightMacroSettings;
  checkins: TrackerCheckin[];
  completeFoodDays: Record<string, string>;
  weeklyOverrides: WeightMacroWeeklyOverride[];
  revisions: TrackerTargetRevision[];
  decisions: TrackerDecision[];
};
export type TrackerSources = {
  foodLog: FoodDiaryEntry[];
  bodyWeightHistory: BodyweightHistoryEntry[];
};
export type TrackerContext = {
  completedWorkouts: number;
  recoveryFlags: number;
};
export type TrackerProposal = {
  id: string;
  inputRevision: string;
  week: WeightMacroWeeklyResult;
  effectiveDate: string;
  before: TrackerMacros;
  after: TrackerMacros;
  reasons: string[];
  blocked: boolean;
  context: TrackerContext;
};
const finite = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const dayAfter = (date: string) =>
  new Date(Date.parse(date + "T00:00:00Z") + 86400000)
    .toISOString()
    .slice(0, 10);
const nutrientKeys = ["calories", "protein", "carbs", "fat"] as const;
const emptyNutrition = () => ({
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
});
const hasCompleteNutrition = (row: TrackerCheckin) =>
  nutrientKeys.every((key) => finite(row[key]) && row[key]! >= 0);
const sameTarget = (a: TrackerMacros, b: TrackerMacros) =>
  [...nutrientKeys, "macroCalories" as const].every((key) => a[key] === b[key]);
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const timestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  isWeightMacroDate(value.slice(0, 10)) &&
  Number.isFinite(Date.parse(value));
const validMacros = (value: unknown): value is TrackerMacros =>
  record(value) &&
  [...nutrientKeys, "macroCalories"].every(
    (key) => finite(value[key]) && (value[key] as number) >= 0,
  ) &&
  (value.calories as number) > 0 &&
  Math.abs(
    (value.macroCalories as number) -
      (4 * (value.protein as number) +
        4 * (value.carbs as number) +
        9 * (value.fat as number)),
  ) < 0.000001;
const validSettings = (value: unknown): value is WeightMacroSettings =>
  record(value) &&
  (value.athleteName === undefined || typeof value.athleteName === "string") &&
  !validateWeightMacroSettings(
    value as unknown as WeightMacroSettings,
    String(value.startDate),
  ).some((i) => i.severity === "error");
/** App acceptance is stricter than workbook forecasts: every selectable day must be usable. */
const usableTarget = (settings: WeightMacroSettings, target: TrackerMacros) => {
  const variants = [
    target,
    weightMacroDailyTarget(settings, target, "Training"),
    weightMacroDailyTarget(settings, target, "Rest"),
  ];
  return variants.every(
    (value) =>
      validMacros(value) &&
      value.calories! >= settings.minimumCalories &&
      value.calories! <= settings.maximumCalories &&
      value.fat! >= settings.minimumFat &&
      value.carbs! >= settings.minimumCarbs,
  );
};
const dayTypeSnapshot = (checkins: TrackerCheckin[]) =>
  Object.fromEntries(
    checkins
      .filter((c) => c.dayType === "Training" || c.dayType === "Rest")
      .map((c) => [c.date, c.dayType!]),
  ) as Record<string, "Training" | "Rest">;
/** A local revision token, not a security primitive. Keep exact source text for stale-decision comparison. */
export const trackerInputRevision = (
  program: WeightMacroProgram,
  sources: TrackerSources,
  asOfDate: string,
  context: TrackerContext,
) => JSON.stringify([program, sources, asOfDate, context]);
const shortId = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
};
export const foodDaySignature = (entries: FoodDiaryEntry[], date: string) =>
  JSON.stringify(
    entries
      .filter((e) => e.date === date)
      .map((e) => [e.id, e.calories, e.protein, e.carbs, e.fat, e.servings])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
export const trackerFoodDayComplete = (
  program: WeightMacroProgram | null,
  entries: FoodDiaryEntry[],
  date: string,
) =>
  Boolean(
    program &&
      program.completeFoodDays[date] === foodDaySignature(entries, date),
  );

/** A blank local weight falls back to the canonical measurement; exclusion remains explicit. */
export function trackerCheckinForDate(
  program: WeightMacroProgram,
  sources: TrackerSources,
  date: string,
): TrackerCheckin {
  if (!isWeightMacroDate(date)) throw new Error("Choose a real calendar date.");
  const time = (value: unknown) =>
    timestamp(value) ? Date.parse(value) : null;
  const latest = sources.bodyWeightHistory
    .filter((w) => w.date === date && finite(w.weightLb) && w.weightLb > 0)
    .sort(
      (a, b) =>
        Number(time(b.recordedAt) !== null) -
          Number(time(a.recordedAt) !== null) ||
        (time(b.recordedAt) ?? 0) - (time(a.recordedAt) ?? 0) ||
        b.id.localeCompare(a.id),
    )[0];
  const check = program.checkins.find((c) => c.date === date);
  const localWeight =
    finite(check?.weight) && check.weight > 0 ? check.weight : null;
  const sourceTime = time(latest?.recordedAt);
  const localTime = time(check?.recordedAt);
  // Canonical corrections made after a local check-in must not be shadowed by
  // its old weight. Known timestamps outrank unknown ones; ties keep the local
  // explicit value. This merges observations without changing either record.
  const useSource =
    latest &&
    (localWeight === null ||
      (sourceTime !== null && (localTime === null || sourceTime > localTime)));
  const weight = useSource
    ? latest.weightLb * (program.settings.weightUnit === "kg" ? 0.45359237 : 1)
    : localWeight;
  return {
    date,
    id: latest?.id ?? `tracker:${date}`,
    recordedAt: latest?.recordedAt ?? null,
    includeWeight: true,
    nutritionSource: "diary",
    ...check,
    weight,
  };
}

/** Convert a settings-editor draft without changing the physical meaning of its quantities. */
export function convertTrackerSettingsWeightUnit(
  settings: WeightMacroSettings,
  weightUnit: WeightMacroSettings["weightUnit"],
): WeightMacroSettings {
  if (weightUnit !== "lb" && weightUnit !== "kg")
    throw new Error("Choose pounds or kilograms.");
  const factor =
    weightUnit === settings.weightUnit
      ? 1
      : weightUnit === "kg"
        ? 0.45359237
        : 1 / 0.45359237;
  return {
    ...settings,
    weightUnit,
    startingWeight: settings.startingWeight * factor,
    goalWeight: settings.goalWeight * factor,
    manualLeanMass:
      settings.manualLeanMass == null
        ? settings.manualLeanMass
        : settings.manualLeanMass * factor,
    maintenanceLowerTolerance: settings.maintenanceLowerTolerance * factor,
    maintenanceUpperTolerance: settings.maintenanceUpperTolerance * factor,
    manualWeeklyRate:
      settings.manualRateType === "Weight per week"
        ? settings.manualWeeklyRate * factor
        : settings.manualWeeklyRate,
    proteinPerWeight: settings.proteinPerWeight / factor,
    fatPerWeight: settings.fatPerWeight / factor,
  };
}

export function prepareTrackerRecords(
  program: WeightMacroProgram,
  sources: TrackerSources,
  asOfDate: string,
): WeightMacroDailyRecord[] {
  if (!isWeightMacroDate(asOfDate))
    throw new Error("Choose a real as-of date.");
  const days = new Map<string, TrackerCheckin>();
  const dates = new Set([
    ...sources.bodyWeightHistory.map((w) => w.date),
    ...program.checkins.map((c) => c.date),
    ...Object.keys(program.completeFoodDays),
    ...sources.foodLog.flatMap((e) => (e.date ? [e.date] : [])),
  ]);
  for (const date of dates) {
    if (!isWeightMacroDate(date) || date > asOfDate) continue;
    const row = trackerCheckinForDate(program, sources, date);
    if (row.nutritionSource === "manual") {
      // A partial manual day must not silently switch to diary totals.
      days.set(
        date,
        row.foodComplete && hasCompleteNutrition(row)
          ? row
          : { ...row, ...emptyNutrition() },
      );
    } else {
      const complete = trackerFoodDayComplete(program, sources.foodLog, date);
      const totals = complete
        ? foodDiaryTotals(sources.foodLog, date)
        : emptyNutrition();
      days.set(date, { ...row, ...totals, id: row.id ?? `tracker:${date}` });
    }
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function trackerRevisionForDate(
  program: WeightMacroProgram | null,
  date: string,
): TrackerTargetRevision | null {
  return (
    program?.revisions
      .filter((r) => r.effectiveDate <= date)
      .sort(
        (a, b) =>
          b.effectiveDate.localeCompare(a.effectiveDate) ||
          b.recordedAt.localeCompare(a.recordedAt),
      )[0] ?? null
  );
}
export function acceptedTrackerTarget(
  program: WeightMacroProgram | null,
  date: string,
): TrackerMacros | null {
  if (!isWeightMacroDate(date)) return null;
  const revision = trackerRevisionForDate(program, date);
  if (
    !revision ||
    !validSettings(revision.settings) ||
    !usableTarget(revision.settings, revision.target)
  )
    return null;
  const dayIndex = (new Date(date + "T00:00:00Z").getUTCDay() + 6) % 7;
  // Older revisions without a snapshot retain the frozen settings' weekly
  // pattern. Never reinterpret accepted targets from mutable check-in day types.
  const dayType =
    revision.dayTypes?.[date] ??
    (dayIndex < revision.settings.trainingDaysPerWeek ? "Training" : "Rest");
  return weightMacroDailyTarget(revision.settings, revision.target, dayType);
}
export function evaluateTrackerProgram(
  program: WeightMacroProgram,
  sources: TrackerSources,
  asOfDate: string,
) {
  const records = prepareTrackerRecords(program, sources, asOfDate);
  // Accepted targets replace only the planner's baseline, never its observations.
  const base = calculateWeightMacroTracker(
    { ...program.settings, adjustmentMode: "Recommendation only" },
    records,
    program.weeklyOverrides,
    asOfDate,
  );
  const acceptedWeeklyTargets: Record<number, TrackerMacros> = {};
  for (const week of base.weekly) {
    const revision = trackerRevisionForDate(program, week.startDate);
    if (revision) acceptedWeeklyTargets[week.week] = revision.target;
  }
  const result = calculateWeightMacroTracker(
    program.settings,
    records,
    program.weeklyOverrides,
    asOfDate,
    { acceptedWeeklyTargets },
  );
  // A later settings revision must not recalculate earlier accepted daily targets
  // with new cycling/protein settings. The workbook remains a forecast elsewhere.
  for (const day of result.daily) {
    const target = acceptedTrackerTarget(program, day.date);
    if (!target) continue;
    day.target = target;
    day.calorieAdherence =
      finite(day.calories) && finite(target.calories) && target.calories > 0
        ? day.calories / target.calories
        : null;
    day.proteinAdherence =
      finite(day.protein) && finite(target.protein) && target.protein > 0
        ? day.protein / target.protein
        : null;
    Object.assign(day.cells, {
      M: target.calories,
      N: target.protein,
      O: target.carbs,
      P: target.fat,
      U: day.calorieAdherence,
      V: day.proteinAdherence,
    });
  }
  return result;
}
export function buildTrackerProposal(
  program: WeightMacroProgram,
  sources: TrackerSources,
  asOfDate: string,
  context: TrackerContext = { completedWorkouts: 0, recoveryFlags: 0 },
): TrackerProposal | null {
  if (
    ![context.completedWorkouts, context.recoveryFlags].every(
      (v) => Number.isInteger(v) && v >= 0,
    )
  )
    throw new Error("Training context must contain non-negative counts.");
  const result = evaluateTrackerProgram(program, sources, asOfDate);
  const week = [...result.weekly].reverse().find((w) => w.endDate < asOfDate);
  if (!week || !result.initialMacros) return null;
  const existing = program.decisions.some((d) =>
    d.suggestionId.startsWith(`${program.id}:week:${week.week}:`),
  );
  if (existing) return null;
  const effectiveDate = dayAfter(asOfDate);
  const before =
    trackerRevisionForDate(program, effectiveDate)?.target ?? week.current;
  const after = nextWeightMacroTargets(
    program.settings,
    before,
    week.endingTrend,
    week.recommendedCalories,
  );
  const reasons = [week.reason];
  const evidenceRevision = trackerRevisionForDate(program, week.startDate);
  const signature = (revision: TrackerTargetRevision | null) =>
    revision
      ? JSON.stringify([
          revision.target,
          revision.settings,
          revision.dayTypes ?? {},
        ])
      : "unaccepted";
  const mixedTargets = result.daily
    .filter((d) => d.week === week.week)
    .some(
      (d) =>
        signature(trackerRevisionForDate(program, d.date)) !==
        signature(evidenceRevision),
    );
  const changedSinceEvidence =
    !evidenceRevision ||
    signature(trackerRevisionForDate(program, effectiveDate)) !==
      signature(evidenceRevision) ||
    JSON.stringify(program.settings) !==
      JSON.stringify(evidenceRevision.settings);
  if (mixedTargets || changedSinceEvidence)
    reasons.push(
      "Hold: the evidence week used mixed targets or settings changed afterward. Wait for a complete week under one accepted target/settings revision; historical targets have not been rewritten.",
    );
  const contextHold =
    week.deload || week.disruption || context.recoveryFlags > 0;
  if (contextHold)
    reasons.push(
      "Training disruption, deload, or recovery flags need a personal review before changing intake.",
    );
  const invalidMacros = !usableTarget(program.settings, after);
  if (invalidMacros)
    reasons.push(
      "The proposed allocation cannot satisfy calorie bounds and macro floors for every training/rest day. Review cycling, floors, and rounding before applying it.",
    );
  const inputRevision = trackerInputRevision(
    program,
    sources,
    asOfDate,
    context,
  );
  return {
    id: `${program.id}:week:${week.week}:${shortId(inputRevision)}`,
    inputRevision,
    week,
    effectiveDate,
    before,
    after,
    reasons,
    blocked: Boolean(
      week.holdRule ||
        invalidMacros ||
        contextHold ||
        mixedTargets ||
        changedSinceEvidence ||
        result.validation.some((i) => i.severity === "error") ||
        result.diagnostics.some((i) => i.severity === "error"),
    ),
    context: { ...context },
  };
}
export function createTrackerProgram(
  settings: WeightMacroSettings,
  asOfDate: string,
  recordedAt: string,
  id: string,
): WeightMacroProgram {
  if (!nonempty(id) || !timestamp(recordedAt))
    throw new Error("Tracker identity or recording date is invalid.");
  const result = calculateWeightMacroTracker(settings, [], [], asOfDate);
  const initial = result.initialMacros;
  if (
    result.validation.some((i) => i.severity === "error") ||
    result.diagnostics.some((i) => i.code === "MACRO_SETUP_WARNING") ||
    !initial ||
    !usableTarget(settings, initial)
  )
    throw new Error(
      "Check the tracker settings, calorie limits, cycling, and macro feasibility before starting.",
    );
  const effectiveDate =
    settings.startDate > asOfDate ? settings.startDate : asOfDate;
  const decision: TrackerDecision = {
    id: `${id}:setup`,
    suggestionId: `${id}:setup`,
    ruleVersion: WEIGHT_MACRO_RULE_VERSION,
    inputRevision: shortId(JSON.stringify(settings)),
    action: "setup",
    recordedAt,
    effectiveDate,
    before: null,
    after: { ...initial },
    reasons: ["Starting targets explicitly confirmed by the user."],
    formulaRefs: ["B13", "E25:E29"],
    evidenceDates: [],
  };
  return {
    version: 1,
    id,
    settings: { ...settings },
    checkins: [],
    completeFoodDays: {},
    weeklyOverrides: [],
    decisions: [decision],
    revisions: [
      {
        id: `${id}:initial`,
        effectiveDate,
        recordedAt,
        decisionId: decision.id,
        settings: { ...settings },
        target: { ...initial },
        dayTypes: {},
      },
    ],
  };
}
export function updateTrackerSettings(
  program: WeightMacroProgram,
  settings: WeightMacroSettings,
  asOfDate: string,
  recordedAt: string,
): WeightMacroProgram {
  // Changing units must convert observations, not relabel their numeric values.
  const factor =
    settings.weightUnit === program.settings.weightUnit
      ? 1
      : settings.weightUnit === "kg"
        ? 0.45359237
        : 1 / 0.45359237;
  if (!isWeightMacroDate(asOfDate))
    throw new Error("Choose a real as-of date.");
  const replacement = createTrackerProgram(
    settings,
    dayAfter(asOfDate),
    recordedAt,
    `${program.id}:settings:${recordedAt}`,
  );
  return {
    ...program,
    settings: { ...settings },
    checkins: program.checkins.map((c) => ({
      ...c,
      ...(c.weight == null ? {} : { weight: c.weight * factor }),
    })),
    revisions: [
      ...program.revisions,
      ...replacement.revisions.map((r) => ({
        ...r,
        dayTypes: dayTypeSnapshot(program.checkins),
      })),
    ],
    decisions: [...program.decisions, ...replacement.decisions],
  };
}
export function decideTrackerProposal(
  program: WeightMacroProgram,
  sources: TrackerSources,
  proposal: TrackerProposal,
  action: "accept" | "automatic" | "dismiss" | "override",
  asOfDate: string,
  recordedAt: string,
  context: TrackerContext,
  overrideCalories?: number,
): WeightMacroProgram {
  if (
    !["accept", "automatic", "dismiss", "override"].includes(action) ||
    !timestamp(recordedAt)
  )
    throw new Error("The tracker decision is invalid.");
  if (
    trackerInputRevision(program, sources, asOfDate, context) !==
    proposal.inputRevision
  )
    throw new Error(
      "Your data changed. Review the refreshed suggestion before applying it.",
    );
  const fresh = buildTrackerProposal(program, sources, asOfDate, context);
  if (!fresh || fresh.id !== proposal.id)
    throw new Error(
      "This review has already been handled or is no longer current.",
    );
  if ((action === "accept" || action === "automatic") && fresh.blocked)
    throw new Error(
      "This adjustment is on hold. Review its evidence and constraints first.",
    );
  if (
    action === "automatic" &&
    program.settings.adjustmentMode !== "Fully automatic"
  )
    throw new Error("Automatic changes are not enabled.");
  let after = fresh.after;
  if (action === "override") {
    if (
      !finite(overrideCalories) ||
      overrideCalories < program.settings.minimumCalories ||
      overrideCalories > program.settings.maximumCalories
    )
      throw new Error("Enter calories within your configured limits.");
    if (
      program.settings.macroMode ===
      "Fixed grams for all three macros; calories from macros"
    )
      throw new Error(
        "Fixed-grams mode derives calories from macros. Update those settings instead of overriding calories.",
      );
    after = nextWeightMacroTargets(
      program.settings,
      fresh.before,
      fresh.week.endingTrend,
      overrideCalories,
    );
  }
  if (action !== "dismiss" && !usableTarget(program.settings, after))
    throw new Error(
      "Those targets cannot satisfy your macro settings, daily calorie limits, or training/rest cycling floors.",
    );
  const id = `${fresh.id}:${action}`;
  // Persist only a compact fingerprint; the stale check above used the complete exact input snapshot.
  const decision: TrackerDecision = {
    id,
    suggestionId: fresh.id,
    inputRevision: shortId(fresh.inputRevision),
    ruleVersion: WEIGHT_MACRO_RULE_VERSION,
    action,
    recordedAt,
    effectiveDate: fresh.effectiveDate,
    before: { ...fresh.before },
    after: action === "dismiss" ? null : { ...after },
    reasons:
      action === "override"
        ? [
            ...fresh.reasons,
            "User-entered calorie override; workbook safeguards were reviewed.",
          ]
        : fresh.reasons,
    formulaRefs: fresh.week.formulaRefs,
    evidenceDates: fresh.week.evidence.dates,
  };
  return {
    ...program,
    decisions: [...program.decisions, decision],
    revisions:
      action === "dismiss"
        ? program.revisions
        : [
            ...program.revisions,
            {
              id,
              decisionId: id,
              effectiveDate: fresh.effectiveDate,
              recordedAt,
              settings: { ...program.settings },
              target: { ...after },
              dayTypes: dayTypeSnapshot(program.checkins),
            },
          ],
  };
}

/** Strict, lossless load: invalid new data enters existing recovery mode instead of being discarded. */
export function normalizeTrackerProgram(
  value: unknown,
): WeightMacroProgram | null {
  if (value === undefined || value === null) return null;
  if (
    !record(value) ||
    value.version !== 1 ||
    !nonempty(value.id) ||
    !validSettings(value.settings) ||
    !Array.isArray(value.checkins) ||
    !Array.isArray(value.weeklyOverrides) ||
    !Array.isArray(value.revisions) ||
    !Array.isArray(value.decisions) ||
    !record(value.completeFoodDays) ||
    !value.revisions.length ||
    !value.decisions.length
  )
    throw new Error(
      "Saved tracker data is not supported. Export a backup before recovery.",
    );
  const program = value as unknown as WeightMacroProgram;
  const checkDates = new Set<string>();
  for (const c of program.checkins) {
    if (!record(c) || !isWeightMacroDate(c.date) || checkDates.has(c.date))
      throw new Error("Saved tracker check-in dates need recovery.");
    checkDates.add(c.date);
    for (const key of [
      "weight",
      "calories",
      "protein",
      "carbs",
      "fat",
      "steps",
      "sleepHours",
      "waist",
      "performance",
      "hunger",
      "digestion",
    ] as const) {
      const v = c[key];
      if (
        v !== undefined &&
        v !== null &&
        (!finite(v) ||
          v < 0 ||
          (key === "weight" && v === 0) ||
          (key === "sleepHours" && v > 24) ||
          (["performance", "hunger", "digestion"].includes(key) &&
            (v < 1 || v > 5)))
      )
        throw new Error("A saved tracker measurement is invalid.");
    }
    for (const key of [
      "includeWeight",
      "highSodiumCarb",
      "foodComplete",
    ] as const)
      if (c[key] !== undefined && typeof c[key] !== "boolean")
        throw new Error("A saved tracker check-in flag is invalid.");
    if (
      (c.id !== undefined && !nonempty(c.id)) ||
      (c.notes !== undefined && typeof c.notes !== "string") ||
      (c.recordedAt != null && !timestamp(c.recordedAt)) ||
      (c.dayType !== undefined &&
        c.dayType !== "Training" &&
        c.dayType !== "Rest") ||
      (c.nutritionSource !== undefined &&
        c.nutritionSource !== "manual" &&
        c.nutritionSource !== "diary") ||
      (c.nutritionSource === "manual" &&
        c.foodComplete &&
        !hasCompleteNutrition(c))
    )
      throw new Error("Saved tracker check-in metadata needs recovery.");
  }
  for (const [date, signature] of Object.entries(program.completeFoodDays)) {
    if (!isWeightMacroDate(date) || typeof signature !== "string")
      throw new Error("Saved complete-food-day evidence needs recovery.");
    let rows: unknown;
    try {
      rows = JSON.parse(signature);
    } catch {
      throw new Error("Saved complete-food-day evidence needs recovery.");
    }
    if (
      !Array.isArray(rows) ||
      rows.some(
        (row) =>
          !Array.isArray(row) ||
          row.length !== 6 ||
          !nonempty(row[0]) ||
          row.slice(1).some((v) => !finite(v) || v < 0) ||
          row[5] <= 0,
      )
    )
      throw new Error("Saved complete-food-day evidence needs recovery.");
  }
  const overrideWeeks = new Set<number>();
  for (const override of program.weeklyOverrides) {
    if (
      !record(override) ||
      !Number.isInteger(override.week) ||
      override.week < 1 ||
      override.week > 53 ||
      overrideWeeks.has(override.week) ||
      (override.calories != null &&
        (!finite(override.calories) || override.calories <= 0)) ||
      (override.deload !== undefined && typeof override.deload !== "boolean") ||
      (override.disruption !== undefined &&
        typeof override.disruption !== "boolean") ||
      (override.notes !== undefined && typeof override.notes !== "string")
    )
      throw new Error("Saved weekly tracker context needs recovery.");
    overrideWeeks.add(override.week);
  }
  const decisionIds = new Set<string>();
  const handledWeeks = new Set<string>();
  const strings = (x: unknown): x is string[] =>
    Array.isArray(x) && x.every((item) => typeof item === "string");
  for (const d of program.decisions) {
    if (
      !record(d) ||
      !nonempty(d.id) ||
      decisionIds.has(d.id) ||
      !nonempty(d.suggestionId) ||
      !nonempty(d.inputRevision) ||
      d.ruleVersion !== WEIGHT_MACRO_RULE_VERSION ||
      !["setup", "accept", "automatic", "override", "dismiss"].includes(
        d.action,
      ) ||
      !isWeightMacroDate(d.effectiveDate) ||
      !timestamp(d.recordedAt) ||
      !strings(d.reasons) ||
      !strings(d.formulaRefs) ||
      !strings(d.evidenceDates) ||
      d.evidenceDates.some(
        (date) => !isWeightMacroDate(date) || date >= d.effectiveDate,
      ) ||
      (d.action === "setup" ? d.before !== null : !validMacros(d.before)) ||
      (d.action === "dismiss" ? d.after !== null : !validMacros(d.after))
    )
      throw new Error("Saved tracker decisions need recovery.");
    decisionIds.add(d.id);
    if (d.action !== "setup") {
      const prefix = `${program.id}:week:`;
      if (
        !d.suggestionId.startsWith(prefix) ||
        !/^\d+:[a-z0-9]+$/.test(d.suggestionId.slice(prefix.length))
      )
        throw new Error("Saved tracker review identity needs recovery.");
      const week = d.suggestionId.slice(prefix.length).split(":")[0];
      if (Number(week) < 1 || Number(week) > 53 || handledWeeks.has(week))
        throw new Error(
          "Duplicate saved tracker week decisions need recovery.",
        );
      handledWeeks.add(week);
    }
  }
  const revisionIds = new Set<string>();
  const revisionDecisions = new Set<string>();
  for (const revision of program.revisions) {
    if (
      !record(revision) ||
      !nonempty(revision.id) ||
      revisionIds.has(revision.id) ||
      !nonempty(revision.decisionId) ||
      revisionDecisions.has(revision.decisionId) ||
      !isWeightMacroDate(revision.effectiveDate) ||
      !validSettings(revision.settings) ||
      !validMacros(revision.target) ||
      !usableTarget(revision.settings, revision.target) ||
      !timestamp(revision.recordedAt)
    )
      throw new Error("Saved tracker targets need recovery.");
    if (
      revision.dayTypes !== undefined &&
      (!record(revision.dayTypes) ||
        Object.entries(revision.dayTypes).some(
          ([date, type]) =>
            !isWeightMacroDate(date) ||
            (type !== "Training" && type !== "Rest"),
        ))
    )
      throw new Error("Saved accepted day-type history needs recovery.");
    const decision = program.decisions.find(
      (d) => d.id === revision.decisionId,
    );
    if (
      !decision ||
      decision.action === "dismiss" ||
      !decision.after ||
      decision.effectiveDate !== revision.effectiveDate ||
      decision.recordedAt !== revision.recordedAt ||
      !sameTarget(decision.after, revision.target) ||
      revision.effectiveDate < revision.settings.startDate
    )
      throw new Error(
        "Saved tracker target history does not match its decision record.",
      );
    revisionIds.add(revision.id);
    revisionDecisions.add(revision.decisionId);
  }
  if (
    !program.decisions.some((d) => d.action === "setup") ||
    program.decisions.some(
      (d) => d.action !== "dismiss" && !revisionDecisions.has(d.id),
    )
  )
    throw new Error("Saved tracker decision history is incomplete.");
  return program;
}
