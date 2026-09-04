/** Deterministic translation of the Weight & Macro Tracker workbook.
 * This is a planning model, not an acceptance policy or a medical prediction.
 * All dates and observations are supplied by the caller; no clock/storage/network reads.
 */
export const WEIGHT_MACRO_RULE_VERSION = "workbook-2026-09-v1";

export const WEIGHT_MACRO_OPTIONS = {
  weightUnit: ["lb", "kg"],
  goalType: ["Gain", "Cut", "Maintain", "Recomp"],
  planningMode: ["Reach goal weight by target date", "Manual weekly rate"],
  manualRateType: ["Percentage of body weight per week", "Weight per week"],
  reviewDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  adjustmentMode: ["Fully automatic", "Recommendation only", "Manual"],
  trendMethod: ["Seven-day rolling average", "Exponentially weighted trend", "Fourteen-day regression trend"],
  proteinBasis: ["Manual fixed grams", "Grams per lb/kg of current trend weight", "Grams per lb/kg of goal weight", "Grams per lb/kg of lean body mass", "Percentage of total calories"],
  macroMode: ["Fixed P + fixed F; carbs receive remainder", "Fixed P + fat %; carbs receive remainder", "Protein and fat in g per lb/kg; carbs receive remainder", "Protein, carbohydrate, and fat percentages", "Fixed grams for all three macros; calories from macros", "Fixed protein % + fixed fat %; carbs receive remainder"],
  increasePriority: ["Carbohydrates", "Fat", "Proportional split"],
  decreasePriority: ["Carbohydrates", "Fat", "Proportional split"],
  cyclingInputType: ["Calories", "Percentage"],
  dayType: ["Training", "Rest"],
} as const;
type Option<K extends keyof typeof WEIGHT_MACRO_OPTIONS> = (typeof WEIGHT_MACRO_OPTIONS)[K][number];
export interface WeightMacroSettings {
  athleteName?: string;
  startDate: string;
  weightUnit: Option<"weightUnit">;
  startingWeight: number;
  goalWeight: number;
  goalType: Option<"goalType">;
  planningMode: Option<"planningMode">;
  goalDate: string | null;
  manualRateType: Option<"manualRateType">;
  manualWeeklyRate: number;
  startingCalories: number;
  minimumCalories: number;
  maximumCalories: number;
  reviewDay: Option<"reviewDay">;
  daysToGenerate: number;
  adjustmentMode: Option<"adjustmentMode">;
  holdCalories: boolean;
  aggressiveness: number;
  maximumWeeklyIncrease: number;
  maximumWeeklyDecrease: number;
  calorieRounding: number;
  minimumWeighIns: number;
  minimumAdherence: number;
  rateDeadband: number;
  observationDays: number;
  trendMethod: Option<"trendMethod">;
  ewSmoothing: number;
  trajectoryCorrection: boolean;
  maximumTrajectoryCorrection: number;
  maximumWeeklyRate: number;
  maintenanceLowerTolerance: number;
  maintenanceUpperTolerance: number;
  variabilityThreshold: number;
  dailyChangeThreshold: number;
  bodyFatPercent: number | null;
  manualLeanMass: number | null;
  proteinBasis: Option<"proteinBasis">;
  proteinGrams: number;
  proteinPerWeight: number;
  proteinPercent: number;
  macroMode: Option<"macroMode">;
  fatGrams: number;
  fatPerWeight: number;
  fatPercent: number;
  carbsGrams: number;
  carbsPercent: number;
  minimumFat: number;
  minimumCarbs: number;
  macroRounding: number;
  holdProtein: boolean;
  increasePriority: Option<"increasePriority">;
  decreasePriority: Option<"decreasePriority">;
  cycling: boolean;
  trainingDaysPerWeek: number;
  cyclingInputType: Option<"cyclingInputType">;
  trainingPremium: number;
  restReduction: number;
  sameProteinEveryDay: boolean;
  cycleCarbsOnly: boolean;
}

/** Non-personal setup defaults. The athlete's actual starting measurements are required. */
export function createWeightMacroSettings(input: Pick<WeightMacroSettings, "startDate" | "startingWeight" | "goalWeight" | "startingCalories"> & Partial<WeightMacroSettings>): WeightMacroSettings {
  return {
    weightUnit: "lb", goalType: "Maintain", planningMode: "Manual weekly rate", goalDate: null,
    manualRateType: "Percentage of body weight per week", manualWeeklyRate: 0,
    minimumCalories: 1200, maximumCalories: 6000, reviewDay: "Sunday", daysToGenerate: 365,
    adjustmentMode: "Recommendation only", holdCalories: false, aggressiveness: 0.5,
    maximumWeeklyIncrease: 200, maximumWeeklyDecrease: 200, calorieRounding: 25,
    minimumWeighIns: 4, minimumAdherence: 0.8, rateDeadband: 0.001, observationDays: 14,
    trendMethod: "Seven-day rolling average", ewSmoothing: 0.25, trajectoryCorrection: true,
    maximumTrajectoryCorrection: 50, maximumWeeklyRate: 0.01, maintenanceLowerTolerance: 1,
    maintenanceUpperTolerance: 1, variabilityThreshold: 0.01, dailyChangeThreshold: 0.025,
    bodyFatPercent: null, manualLeanMass: null, proteinBasis: "Grams per lb/kg of current trend weight",
    proteinGrams: 150, proteinPerWeight: 1, proteinPercent: 0.25,
    macroMode: "Fixed P + fixed F; carbs receive remainder", fatGrams: 60, fatPerWeight: 0.35,
    fatPercent: 0.25, carbsGrams: 250, carbsPercent: 0.5, minimumFat: 40, minimumCarbs: 50,
    macroRounding: 5, holdProtein: true, increasePriority: "Carbohydrates", decreasePriority: "Carbohydrates",
    cycling: false, trainingDaysPerWeek: 4, cyclingInputType: "Calories", trainingPremium: 100,
    restReduction: 100, sameProteinEveryDay: true, cycleCarbsOnly: true, ...input,
  };
}

type Field = { key: keyof WeightMacroSettings; label: string; ref: string; type: "number" | "date" | "text" | "boolean" | "select"; options?: readonly string[]; nullable?: boolean; fraction?: boolean };
const setting = (key: keyof WeightMacroSettings, label: string, ref: string, type: Field["type"] = "number", extra: Partial<Field> = {}): Field => ({ key, label, ref, type, ...extra });
export const WEIGHT_MACRO_SETTING_FIELDS: readonly Field[] = [
  setting("athleteName", "Athlete name", "B3", "text"), setting("startDate", "Start date", "B4", "date"),
  setting("weightUnit", "Weight unit", "B5", "select", { options: WEIGHT_MACRO_OPTIONS.weightUnit }),
  setting("startingWeight", "Starting body weight", "B6"), setting("goalWeight", "Goal weight", "B7"),
  setting("goalType", "Goal type", "B8", "select", { options: WEIGHT_MACRO_OPTIONS.goalType }),
  setting("planningMode", "Goal-planning mode", "B9", "select", { options: WEIGHT_MACRO_OPTIONS.planningMode }),
  setting("goalDate", "Goal date", "B10", "date", { nullable: true }),
  setting("manualRateType", "Manual rate input type", "B11", "select", { options: WEIGHT_MACRO_OPTIONS.manualRateType }),
  setting("manualWeeklyRate", "Manual weekly rate value", "B12"), setting("startingCalories", "Starting daily calorie target", "B13"),
  setting("minimumCalories", "Minimum allowed calories", "B14"), setting("maximumCalories", "Maximum allowed calories", "B15"),
  setting("reviewDay", "Weekly review day", "B16", "select", { options: WEIGHT_MACRO_OPTIONS.reviewDay }),
  setting("daysToGenerate", "Number of days to generate", "B17"),
  setting("adjustmentMode", "Calorie adjustment mode", "B18", "select", { options: WEIGHT_MACRO_OPTIONS.adjustmentMode }),
  setting("holdCalories", "Hold calories", "B19", "boolean"), setting("aggressiveness", "Adjustment aggressiveness", "B20", "number", { fraction: true }),
  setting("maximumWeeklyIncrease", "Maximum weekly increase", "B21"), setting("maximumWeeklyDecrease", "Maximum weekly decrease", "B22"),
  setting("calorieRounding", "Calorie rounding increment", "B23"), setting("minimumWeighIns", "Minimum valid weigh-ins", "B24"),
  setting("minimumAdherence", "Minimum nutrition adherence", "B25", "number", { fraction: true }),
  setting("rateDeadband", "Rate deadband", "B26", "number", { fraction: true }), setting("observationDays", "Initial observation days", "B27"),
  setting("trendMethod", "Trend calculation method", "B28", "select", { options: WEIGHT_MACRO_OPTIONS.trendMethod }),
  setting("ewSmoothing", "EW trend smoothing factor", "B29", "number", { fraction: true }),
  setting("trajectoryCorrection", "Use trajectory correction", "B30", "boolean"), setting("maximumTrajectoryCorrection", "Maximum trajectory correction", "B31"),
  setting("maximumWeeklyRate", "Maximum acceptable weekly rate", "B32", "number", { fraction: true }),
  setting("maintenanceLowerTolerance", "Maintenance lower tolerance", "B33"), setting("maintenanceUpperTolerance", "Maintenance upper tolerance", "B34"),
  setting("variabilityThreshold", "High variability threshold", "B35", "number", { fraction: true }),
  setting("dailyChangeThreshold", "Large daily-change threshold", "B36", "number", { fraction: true }),
  setting("bodyFatPercent", "Estimated body-fat percentage", "E3", "number", { nullable: true, fraction: true }),
  setting("manualLeanMass", "Manual lean-mass override", "E5", "number", { nullable: true }),
  setting("proteinBasis", "Protein calculation basis", "E7", "select", { options: WEIGHT_MACRO_OPTIONS.proteinBasis }),
  setting("proteinGrams", "Protein target (g)", "E8"), setting("proteinPerWeight", "Protein g per lb/kg", "E9"),
  setting("proteinPercent", "Protein percentage of calories", "E10", "number", { fraction: true }),
  setting("macroMode", "Macro allocation mode", "E11", "select", { options: WEIGHT_MACRO_OPTIONS.macroMode }),
  setting("fatGrams", "Fat target (g)", "E12"), setting("fatPerWeight", "Fat g per lb/kg", "E13"),
  setting("fatPercent", "Fat percentage of calories", "E14", "number", { fraction: true }), setting("carbsGrams", "Carbohydrate target (g)", "E15"),
  setting("carbsPercent", "Carbohydrate percentage of calories", "E16", "number", { fraction: true }),
  setting("minimumFat", "Minimum fat (g)", "E17"), setting("minimumCarbs", "Minimum carbohydrate (g)", "E18"),
  setting("macroRounding", "Macro rounding increment", "E19"), setting("holdProtein", "Hold protein when calories change", "E20", "boolean"),
  setting("increasePriority", "Calorie increases go first to", "E21", "select", { options: WEIGHT_MACRO_OPTIONS.increasePriority }),
  setting("decreasePriority", "Calorie reductions come first from", "E22", "select", { options: WEIGHT_MACRO_OPTIONS.decreasePriority }),
  setting("cycling", "Calorie cycling", "H3", "boolean"), setting("trainingDaysPerWeek", "Training days per week", "H4"),
  setting("cyclingInputType", "Premium/reduction entered as", "H5", "select", { options: WEIGHT_MACRO_OPTIONS.cyclingInputType }),
  setting("trainingPremium", "Training-day premium", "H6"), setting("restReduction", "Rest-day reduction", "H7"),
  setting("sameProteinEveryDay", "Keep protein same every day", "H8", "boolean"), setting("cycleCarbsOnly", "Put cycling difference into carbs", "H9", "boolean"),
];

export interface WeightMacroDailyRecord {
  id?: string;
  date: string;
  recordedAt?: string | null;
  weight?: number | null;
  includeWeight?: boolean;
  dayType?: Option<"dayType">;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  waist?: number | null;
  performance?: number | null;
  hunger?: number | null;
  digestion?: number | null;
  highSodiumCarb?: boolean;
  notes?: string;
}
export interface WeightMacroWeeklyOverride {
  week: number;
  calories?: number | null;
  deload?: boolean;
  disruption?: boolean;
  notes?: string;
}
export interface WeightMacroIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  refs: string[];
  date?: string;
  week?: number;
}
export interface TrackerMacros { calories: number | null; protein: number | null; carbs: number | null; fat: number | null; macroCalories: number | null }
export interface TrackerEvidence {
  recordIds: string[]; dates: string[]; from: string; through: string | null;
  trendRecordIds: string[]; trendDates: string[];
  expectedDays: number; validWeighIns: number; calorieDays: number; isComplete: boolean;
}
export type TrackerHoldRule = "GOAL_REACHED" | "DATE_PASSED" | "USER_HOLD" | "FIXED_MACROS" | "MANUAL_MODE" | "INSUFFICIENT_HISTORY" | "OBSERVATION" | "LOW_WEIGHINS" | "POOR_ADHERENCE" | "NOISY_DATA" | "WATER_ANOMALY" | "WITHIN_RANGE" | "WITHIN_DEADBAND" | null;
export interface WeightMacroDailyResult extends WeightMacroDailyRecord {
  row: number; day: string; week: number; dayType: Option<"dayType">;
  includedWeight: number | null; rollingAverage: number | null; ewTrend: number | null; regressionTrend: number | null;
  trendWeight: number | null; trajectoryWeight: number; trendVsTarget: number | null;
  target: TrackerMacros; calorieAdherence: number | null; proteinAdherence: number | null;
  maintenanceLower: number | null; maintenanceUpper: number | null; potentialAnomaly: boolean;
  isFuture: boolean; trendEvidenceDates: string[]; cells: Record<string, string | number | boolean | null>;
}
export interface WeightMacroWeeklyResult {
  row: number; week: number; startDate: string; endDate: string;
  validWeighIns: number; averageWeight: number | null; endingTrend: number | null;
  changeFromPriorWeek: number | null; changeFromPriorWeekPercent: number | null; fourteenDayRate: number | null;
  targetRate: number; actualVsTargetRate: number | null; trajectoryWeight: number; trendVsTrajectory: number | null;
  averageCalories: number | null; calorieDays: number; nutritionAdherence: number | null;
  averages: { protein: number | null; carbs: number | null; fat: number | null; steps: number | null; sleepHours: number | null; waist: number | null; performance: number | null; hunger: number | null; digestion: number | null };
  estimatedTdee: number | null; smoothedTdee: number | null; current: TrackerMacros;
  rawAdjustment: number | null; trajectoryCorrection: number; cappedAdjustment: number;
  recommendedCalories: number; manualOverride: number | null; next: TrackerMacros;
  variability: number | null; waterAnomaly: boolean; deload: boolean; refeed: boolean; disruption: boolean; notes: string;
  status: string; reason: string; activeRate: number | null; rateError: number | null;
  proposedProtein: number | null; nonProteinCalorieDelta: number | null; proposedFat: number | null;
  holdRule: TrackerHoldRule; macroFeasibility: "Impossible" | "OK" | null;
  evidence: TrackerEvidence; formulaRefs: string[]; diagnostics: WeightMacroIssue[];
  cells: Record<string, string | number | boolean | null>;
}
export interface WeightMacroDerivedSettings {
  calculatedLeanMass: number | null; effectiveLeanMass: number | null;
  targetWeeklyChange: number; targetWeeklyChangePercent: number; projectedGoalDate: string | null;
  planningStatus: string; firstCheckInDate: string; currentProgramWeek: number;
  macroSetupStatus: string; allocationNote: string;
  currentAverageTarget: number; currentTrainingTarget: number; currentRestTarget: number; cyclingAverage: number; cyclingStatus: string;
  cells: Record<string, string | number | null>;
}
export interface WeightMacroDashboard {
  latestWeight: number | null; latestWeightDate: string | null; latestTrend: number | null; latestTrendDate: string | null;
  startingWeight: number; goalWeight: number; progress: number | null; status: string;
  totalChange: number | null; remaining: number | null; change7: number | null; change14: number | null; change28: number | null;
  direction: "Rising" | "Falling" | "Stable" | null; actualWeeklyRatePercent: number | null; targetWeeklyRatePercent: number;
  daysAheadOfTrajectory: number | null; current: TrackerMacros; recommendedCalories: number; smoothedTdee: number | null;
  nutritionAdherence: number | null; validWeighIns: number; expectedDays: number; projectedGoalDate: string | null;
  latestWaist: number | null; waistChange: number | null; trendSeries: { date: string; value: number }[];
  adherenceSeries: { date: string; value: number }[]; reason: string; currentWeek: number;
}
export interface WeightMacroTrackerResult {
  ruleVersion: string; asOfDate: string; validation: WeightMacroIssue[]; diagnostics: WeightMacroIssue[];
  settingsDerived: WeightMacroDerivedSettings | null; initialMacros: TrackerMacros | null;
  daily: WeightMacroDailyResult[]; weekly: WeightMacroWeeklyResult[]; dashboard: WeightMacroDashboard | null;
}

const DAY_MS = 86_400_000;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v));
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const average = (values: number[]) => values.length ? sum(values) / values.length : null;
const last = <T>(values: T[]): T | undefined => values[values.length - 1];
const positive = (v: unknown): v is number => finite(v) && v > 0;
export function excelRound(value: number, digits = 0): number {
  const factor = 10 ** digits;
  const scaled = Math.abs(value * factor);
  const result = Math.sign(value) * Math.floor(scaled + 0.5 + Number.EPSILON * Math.max(1, scaled)) / factor;
  return Object.is(result, -0) ? 0 : result;
}
export function excelRoundDown(value: number, digits = 0): number {
  const factor = 10 ** digits;
  const result = Math.trunc(value * factor) / factor;
  return Object.is(result, -0) ? 0 : result;
}
function roundIncrement(value: number, increment: number) { return excelRound(value / increment) * increment; }
export function isWeightMacroDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
function dayNumber(date: string) { return Date.parse(`${date}T00:00:00.000Z`) / DAY_MS; }
function dateAt(day: number) { return new Date(day * DAY_MS).toISOString().slice(0, 10); }
function mondayIndex(day: number) { return (new Date(day * DAY_MS).getUTCDay() + 6) % 7; }
function macroTotal(protein: number | null, carbs: number | null, fat: number | null) {
  return protein === null || carbs === null || fat === null ? null : 4 * protein + 4 * carbs + 9 * fat;
}
function macros(calories: number | null, protein: number | null, carbs: number | null, fat: number | null): TrackerMacros {
  return { calories, protein, carbs, fat, macroCalories: macroTotal(protein, carbs, fat) };
}
const fixedMode = (s: WeightMacroSettings) => s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[4];
const percentageMode = (s: WeightMacroSettings) => s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[3] || s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[5];
function proteinFor(s: WeightMacroSettings, calories: number, weight: number, leanMass: number | null): number | null {
  let value: number | null;
  if (fixedMode(s)) value = s.proteinGrams;
  else if (percentageMode(s)) value = calories * s.proteinPercent / 4;
  else if (s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[2]) value = s.proteinPerWeight * weight;
  else switch (s.proteinBasis) {
    case "Manual fixed grams": value = s.proteinGrams; break;
    case "Grams per lb/kg of current trend weight": value = s.proteinPerWeight * weight; break;
    case "Grams per lb/kg of goal weight": value = s.proteinPerWeight * s.goalWeight; break;
    case "Grams per lb/kg of lean body mass": value = leanMass === null ? null : s.proteinPerWeight * leanMass; break;
    case "Percentage of total calories": value = calories * s.proteinPercent / 4; break;
  }
  return value === null ? null : roundIncrement(value, s.macroRounding);
}
function initialFat(s: WeightMacroSettings): number {
  const value = s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[1] || percentageMode(s) ? s.startingCalories * s.fatPercent / 9
    : s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[2] ? s.fatPerWeight * s.startingWeight : s.fatGrams;
  return roundIncrement(value, s.macroRounding);
}
function cyclingTargets(s: WeightMacroSettings, target: number) {
  if (!s.cycling) return { training: target, rest: target, average: target };
  const premium = s.cyclingInputType === "Calories" ? s.trainingPremium : s.trainingPremium * target;
  const reduction = s.cyclingInputType === "Calories" ? s.restReduction : s.restReduction * target;
  const reconciliation = (s.trainingDaysPerWeek * premium - (7 - s.trainingDaysPerWeek) * reduction) / 7;
  const training = target + premium - reconciliation;
  const rest = target - reduction - reconciliation;
  return { training, rest, average: (s.trainingDaysPerWeek * training + (7 - s.trainingDaysPerWeek) * rest) / 7 };
}

export function validateWeightMacroSettings(s: WeightMacroSettings, asOfDate: string): WeightMacroIssue[] {
  const issues: WeightMacroIssue[] = [];
  const error = (code: string, message: string, refs: string[]) => issues.push({ code, severity: "error", message, refs });
  if (!isWeightMacroDate(asOfDate)) error("INVALID_AS_OF_DATE", "Supply a real YYYY-MM-DD as-of date.", ["B42"]);
  for (const field of WEIGHT_MACRO_SETTING_FIELDS) {
    const value = s[field.key];
    if (field.nullable && (value === null || value === undefined)) continue;
    if (field.type === "date" && !isWeightMacroDate(value)) error("INVALID_DATE", `${field.label} must be a real YYYY-MM-DD date.`, [field.ref]);
    if (field.type === "number" && (!finite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER || (value < 0 && field.key !== "manualWeeklyRate"))) error("INVALID_NUMBER", `${field.label} must be a safely representable ${field.key === "manualWeeklyRate" ? "" : "non-negative "}number.`, [field.ref]);
    if (field.type === "boolean" && typeof value !== "boolean") error("INVALID_BOOLEAN", `${field.label} must be true or false.`, [field.ref]);
    if (field.options && !(field.options as readonly unknown[]).includes(value)) error("INVALID_OPTION", `${field.label} is not a supported option.`, [field.ref]);
    if (field.fraction && finite(value) && value > 1) error("INVALID_FRACTION", `${field.label} must be a fraction from 0 to 1.`, [field.ref]);
  }
  for (const key of ["startingWeight", "goalWeight", "startingCalories", "minimumCalories", "maximumCalories", "calorieRounding", "macroRounding"] as const) {
    if (!positive(s[key])) error("POSITIVE_REQUIRED", `${key} must be greater than zero.`, [WEIGHT_MACRO_SETTING_FIELDS.find(f => f.key === key)!.ref]);
  }
  if (s.maximumCalories < s.minimumCalories) error("REVERSED_LIMITS", "Maximum calories cannot be below minimum calories.", ["B14", "B15"]);
  if (s.calorieRounding > 0 && s.calorieRounding < Number.EPSILON) error("ROUNDING_PRECISION", "Calorie rounding is below supported numerical precision.", ["B23"]);
  if (s.macroRounding > 0 && s.macroRounding < Number.EPSILON) error("ROUNDING_PRECISION", "Macro rounding is below supported numerical precision.", ["E19"]);
  if (isWeightMacroDate(s.startDate) && finite(s.daysToGenerate) && new Date((dayNumber(s.startDate) + s.daysToGenerate - 1) * DAY_MS).getUTCFullYear() > 9999) error("DATE_RANGE_OVERFLOW", "Generated dates must fit the four-digit calendar-year format.", ["B4", "B17"]);
  for (const [key, min, max, ref] of [["daysToGenerate", 1, 365, "B17"], ["minimumWeighIns", 1, 7, "B24"], ["trainingDaysPerWeek", 0, 7, "H4"], ["observationDays", 0, 365, "B27"]] as const) {
    if (!Number.isInteger(s[key]) || s[key] < min || s[key] > max) error("INVALID_INTEGER_RANGE", `${key} must be an integer from ${min} to ${max}.`, [ref]);
  }
  if (s.planningMode === "Reach goal weight by target date" && !isWeightMacroDate(s.goalDate)) error("GOAL_DATE_REQUIRED", "Target-date planning requires a goal date.", ["B9", "B10"]);
  if (s.bodyFatPercent !== null && s.bodyFatPercent !== undefined && s.bodyFatPercent >= 1) error("INVALID_BODY_FAT", "Body-fat fraction must be less than 1.", ["E3"]);
  if (s.manualLeanMass !== null && s.manualLeanMass !== undefined && (!positive(s.manualLeanMass) || s.manualLeanMass > s.startingWeight)) error("INVALID_LEAN_MASS", "Lean mass must be positive and no greater than starting weight.", ["E5", "B6"]);
  if (s.startingCalories < s.minimumCalories || s.startingCalories > s.maximumCalories) issues.push({ code: "START_OUTSIDE_LIMITS", severity: "warning", message: "Starting target is outside the allowed range; the workbook clamps the next recommendation, not the starting target.", refs: ["B13", "BQ46"] });
  return issues;
}

function initialMacroStatus(s: WeightMacroSettings, m: TrackerMacros): string {
  if (s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[3] && Math.abs(s.proteinPercent + s.fatPercent + s.carbsPercent - 1) > 0.001) return "WARNING: macro percentages do not equal 100%";
  if (s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[5] && s.proteinPercent + s.fatPercent >= 1) return "WARNING: protein and fat percentages leave no carbohydrate calories";
  if (m.protein === null || m.carbs === null || m.fat === null) return "WARNING: selected setup is mathematically impossible or a required input is missing";
  if (m.fat < s.minimumFat) return "WARNING: fat is below the minimum";
  if (m.carbs < s.minimumCarbs) return "WARNING: carbohydrates are below the minimum";
  return fixedMode(s) ? "Fixed-grams mode: calories are calculated from macros" : "Ready";
}
function trajectoryAt(s: WeightMacroSettings, day: number, targetRate: number): number {
  const start = dayNumber(s.startDate);
  if (s.goalType === "Maintain") return s.goalWeight;
  if (s.planningMode === "Reach goal weight by target date") return s.startingWeight + (s.goalWeight - s.startingWeight) * clamp((day - start) / Math.max(1, dayNumber(s.goalDate!) - start), 0, 1);
  return targetRate > 0 ? Math.min(s.goalWeight, s.startingWeight + targetRate * (day - start) / 7)
    : targetRate < 0 ? Math.max(s.goalWeight, s.startingWeight + targetRate * (day - start) / 7) : s.startingWeight;
}
function regressionAt(rows: WeightMacroDailyResult[], endIndex: number): number | null {
  const points = rows.slice(Math.max(0, endIndex - 13), endIndex + 1).filter(d => d.includedWeight !== null);
  if (points.length < 4) return null;
  // Calendar offsets preserve Excel date spacing while avoiding large-serial cancellation.
  const endDay = dayNumber(rows[endIndex].date);
  const xs = points.map(d => dayNumber(d.date) - endDay);
  const ys = points.map(d => d.includedWeight!);
  const xMean = average(xs)!;
  const yMean = average(ys)!;
  const variance = sum(xs.map(x => (x - xMean) ** 2));
  if (variance === 0) return null;
  const slope = sum(xs.map((x, i) => (x - xMean) * (ys[i] - yMean))) / variance;
  return yMean - slope * xMean;
}
export function weightMacroDailyTarget(s: WeightMacroSettings, current: TrackerMacros, dayType: Option<"dayType">): TrackerMacros {
  if (current.calories === null) return macros(null, null, null, null);
  const cycle = cyclingTargets(s, current.calories);
  const calories = dayType === "Training" ? cycle.training : cycle.rest;
  const protein = current.protein === null ? null : !s.cycling || s.sameProteinEveryDay ? current.protein : roundIncrement(current.protein * calories / current.calories, s.macroRounding);
  let fat = current.fat;
  if (fat !== null && s.cycling) {
    if (!s.sameProteinEveryDay) fat = Math.max(s.minimumFat, roundIncrement(fat * calories / current.calories, s.macroRounding));
    else if (!s.cycleCarbsOnly && current.carbs !== null) fat = Math.max(s.minimumFat, roundIncrement(fat + (calories - current.calories) * (9 * fat) / Math.max(1, 4 * current.carbs + 9 * fat) / 9, s.macroRounding));
  }
  const remainder = protein === null || fat === null ? null : calories - 4 * protein - 9 * fat;
  const carbs = remainder === null || remainder < 0 ? null : roundIncrement(remainder / 4, s.macroRounding);
  return macros(calories, protein, carbs, fat);
}
function holdRule(s: WeightMacroSettings, w: WeightMacroWeeklyResult, start: number, targetPercent: number): TrackerHoldRule {
  const gaining = s.goalType === "Gain" || (s.goalType === "Recomp" && s.goalWeight >= s.startingWeight);
  if (s.goalType !== "Maintain" && w.endingTrend !== null && (gaining ? w.endingTrend >= s.goalWeight : w.endingTrend <= s.goalWeight)) return "GOAL_REACHED";
  if (s.planningMode === "Reach goal weight by target date" && s.goalDate && w.endDate > s.goalDate) return "DATE_PASSED";
  if (s.holdCalories) return "USER_HOLD";
  if (fixedMode(s)) return "FIXED_MACROS";
  if (s.adjustmentMode === "Manual") return "MANUAL_MODE";
  if (w.endingTrend === null || w.activeRate === null) return "INSUFFICIENT_HISTORY";
  if (dayNumber(w.endDate) < start + s.observationDays - 1) return "OBSERVATION";
  if (w.validWeighIns < s.minimumWeighIns) return "LOW_WEIGHINS";
  if (w.calorieDays === 0 || w.nutritionAdherence === null || w.nutritionAdherence < s.minimumAdherence) return "POOR_ADHERENCE";
  if (w.variability !== null && w.variability > s.variabilityThreshold) return "NOISY_DATA";
  if (w.waterAnomaly) return "WATER_ANOMALY";
  if (s.goalType === "Maintain" && w.endingTrend >= s.goalWeight - s.maintenanceLowerTolerance && w.endingTrend <= s.goalWeight + s.maintenanceUpperTolerance) return "WITHIN_RANGE";
  if (Math.abs(w.activeRate / Math.max(1, w.endingTrend) - targetPercent) <= s.rateDeadband) return "WITHIN_DEADBAND";
  return null;
}
function describeWeek(s: WeightMacroSettings, w: WeightMacroWeeklyResult): { status: string; reason: string } {
  const calories = excelRound(w.current.calories!).toLocaleString("en-US");
  if (w.manualOverride !== null && !fixedMode(s)) return { status: "Manual override applied", reason: `Manual override applied: next week is set to ${excelRound(w.next.calories!).toLocaleString("en-US")} calories.` };
  const byRule: Record<Exclude<TrackerHoldRule, null>, { status: string; reason: string }> = {
    GOAL_REACHED: { status: "Goal reached", reason: "Goal reached. Hold calories and reassess the next phase." },
    DATE_PASSED: { status: "Settings need review", reason: "Target date has passed. Review the goal date, goal weight, and rate settings." },
    USER_HOLD: { status: "Hold calories", reason: `Hold calories at ${calories} because Hold Calories is enabled.` },
    FIXED_MACROS: { status: "Fixed macros—manual", reason: "Fixed-grams mode is active; calories are calculated from the entered macros." },
    MANUAL_MODE: { status: "Manual mode", reason: "Manual mode is active. Enter a calorie override to change next week's target." },
    INSUFFICIENT_HISTORY: { status: "Insufficient data", reason: `Hold calories at ${calories} until enough trend history exists.` },
    OBSERVATION: { status: "Insufficient data", reason: `Hold calories during the initial ${s.observationDays}-day observation period.` },
    LOW_WEIGHINS: { status: "Insufficient data", reason: `Do not adjust calories because only ${w.validWeighIns} valid weigh-ins were recorded.` },
    POOR_ADHERENCE: { status: "Poor adherence—hold calories", reason: "Hold calories and improve nutrition logging/adherence before making another change." },
    NOISY_DATA: { status: "Noisy data—hold calories", reason: "Hold calories because weekly weight variability exceeded the selected threshold." },
    WATER_ANOMALY: { status: "Noisy data—hold calories", reason: "Hold calories because a likely short-term water-weight anomaly was detected." },
    WITHIN_RANGE: { status: "Maintaining successfully", reason: `Hold calories at ${calories}; trend weight is inside the maintenance range.` },
    WITHIN_DEADBAND: { status: "On track", reason: `Hold calories at ${calories} because the current rate is within the target tolerance.` },
  };
  if (w.holdRule) return byRule[w.holdRule];
  const gaining = s.goalType === "Gain" || (s.goalType === "Recomp" && w.targetRate >= 0);
  const status = s.goalType === "Maintain" ? w.endingTrend! < s.goalWeight - s.maintenanceLowerTolerance ? "Below maintenance range" : "Above maintenance range"
    : gaining ? w.activeRate! < w.targetRate ? "Gaining too slowly" : "Gaining too quickly"
    : w.activeRate! > w.targetRate ? "Losing too slowly" : "Losing too quickly";
  if (w.rawAdjustment !== null && Math.abs(w.rawAdjustment + w.trajectoryCorrection) < s.calorieRounding) return { status, reason: `Hold calories at ${calories} because the calculated change is smaller than the rounding increment.` };
  const diff = w.recommendedCalories - w.current.calories!;
  const prefix = s.adjustmentMode === "Recommendation only" ? "Recommendation only: " : "";
  return { status, reason: diff > 0 ? `${prefix}Add ${diff} calories next week, primarily from ${s.increasePriority}.`
    : diff < 0 ? `${prefix}Reduce ${-diff} calories next week, primarily from ${s.decreasePriority}.` : `Hold calories at ${calories}.` };
}
type MacroAllocation = Pick<WeightMacroWeeklyResult, "current" | "endingTrend" | "next" | "proposedProtein" | "nonProteinCalorieDelta" | "proposedFat" | "macroFeasibility">;
function nextMacros(s: WeightMacroSettings, w: MacroAllocation, lean: number | null): TrackerMacros {
  const calories = w.next.calories!;
  w.proposedProtein = fixedMode(s) ? roundIncrement(s.proteinGrams, s.macroRounding)
    : s.holdProtein ? w.current.protein : proteinFor(s, calories, w.endingTrend ?? s.startingWeight, lean);
  w.nonProteinCalorieDelta = w.proposedProtein === null || w.current.protein === null ? null : calories - w.current.calories! - 4 * (w.proposedProtein - w.current.protein);
  if (fixedMode(s)) w.proposedFat = s.fatGrams;
  else if (s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[1] || percentageMode(s)) w.proposedFat = calories * s.fatPercent / 9;
  else if (s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[2]) w.proposedFat = s.fatPerWeight * (w.endingTrend ?? s.startingWeight);
  else if (w.nonProteinCalorieDelta !== null && w.current.fat !== null && w.current.carbs !== null) {
    const delta = w.nonProteinCalorieDelta;
    const fat = w.current.fat;
    const proportion = 9 * fat / Math.max(1, 4 * w.current.carbs + 9 * fat);
    if (delta >= 0) w.proposedFat = s.increasePriority === "Fat" ? fat + delta / 9 : s.increasePriority === "Proportional split" ? fat + delta * proportion / 9 : fat;
    else w.proposedFat = Math.max(s.minimumFat, s.decreasePriority === "Fat" ? fat + delta / 9
      : s.decreasePriority === "Proportional split" ? fat + delta * proportion / 9
      : fat + Math.min(0, delta + Math.max(0, (w.current.carbs - s.minimumCarbs) * 4)) / 9);
  }
  w.macroFeasibility = w.proposedProtein === null ? null : calories < 4 * w.proposedProtein + 9 * s.minimumFat + 4 * s.minimumCarbs ? "Impossible" : "OK";
  if (w.macroFeasibility !== "OK" || w.proposedFat === null) return macros(calories, null, null, null);
  const protein = w.proposedProtein!;
  const fat = fixedMode(s) ? roundIncrement(s.fatGrams, s.macroRounding)
    : excelRoundDown(Math.min(Math.max(s.minimumFat, w.proposedFat), (calories - 4 * protein - 4 * s.minimumCarbs) / 9) / s.macroRounding) * s.macroRounding;
  const carbs = fixedMode(s) ? roundIncrement(s.carbsGrams, s.macroRounding) : Math.max(s.minimumCarbs, roundIncrement((calories - 4 * protein - 9 * fat) / 4, s.macroRounding));
  return macros(calories, protein, carbs, fat);
}

/** Allocate an explicitly selected calorie proposal without applying or accepting it. */
export function nextWeightMacroTargets(s: WeightMacroSettings, current: TrackerMacros, endingTrend: number | null, nextCalories: number): TrackerMacros {
  const lean = s.manualLeanMass ?? (s.bodyFatPercent == null ? null : s.startingWeight * (1 - s.bodyFatPercent));
  const calories = fixedMode(s) ? macroTotal(roundIncrement(s.proteinGrams, s.macroRounding), roundIncrement(s.carbsGrams, s.macroRounding), roundIncrement(s.fatGrams, s.macroRounding))! : nextCalories;
  const allocation: MacroAllocation = { current, endingTrend, next: macros(calories, null, null, null), proposedProtein: null, nonProteinCalorieDelta: null, proposedFat: null, macroFeasibility: null };
  return nextMacros(s, allocation, lean);
}

export interface WeightMacroCalculationOptions {
  /** App acceptance policy may anchor a week to a frozen target instead of workbook forecast chaining. */
  acceptedWeeklyTargets?: Readonly<Record<number, TrackerMacros>>;
}

/** Returns a workbook simulation. "next" is not an accepted target or a logged actual. */
export function calculateWeightMacroTracker(
  s: WeightMacroSettings,
  records: readonly WeightMacroDailyRecord[],
  weeklyOverrides: readonly WeightMacroWeeklyOverride[],
  asOfDate: string,
  options: WeightMacroCalculationOptions = {},
): WeightMacroTrackerResult {
  const validation = validateWeightMacroSettings(s, asOfDate);
  const diagnostics: WeightMacroIssue[] = [];
  const result: WeightMacroTrackerResult = { ruleVersion: WEIGHT_MACRO_RULE_VERSION, asOfDate, validation, diagnostics, settingsDerived: null, initialMacros: null, daily: [], weekly: [], dashboard: null };
  if (validation.some(v => v.severity === "error")) return result;
  const start = dayNumber(s.startDate);
  const end = start + s.daysToGenerate - 1;
  const asOf = dayNumber(asOfDate);
  const firstCheckIn = start + (WEIGHT_MACRO_OPTIONS.reviewDay.indexOf(s.reviewDay) - mondayIndex(start) + 7) % 7;
  const currentWeek = Math.max(1, Math.min(53, asOf <= firstCheckIn ? 1 : 2 + Math.floor((Math.min(asOf, end) - firstCheckIn - 1) / 7)));
  const gaining = s.goalType === "Gain" || (s.goalType === "Recomp" && s.goalWeight >= s.startingWeight);
  const targetRate = s.goalType === "Maintain" ? 0 : s.planningMode === "Reach goal weight by target date"
    ? (s.goalWeight - s.startingWeight) / Math.max(1, (dayNumber(s.goalDate!) - start) / 7)
    : Math.abs(s.manualWeeklyRate) * (s.manualRateType === "Percentage of body weight per week" ? s.startingWeight : 1) * (gaining ? 1 : -1);
  const targetPercent = targetRate / s.startingWeight;
  let projectedGoalDate: string | null = s.goalType === "Maintain" ? null : s.planningMode === "Reach goal weight by target date" ? s.goalDate : null;
  if (s.goalType !== "Maintain" && s.planningMode !== "Reach goal weight by target date" && targetRate !== 0) {
    const projectedDay = start + Math.ceil(Math.abs((s.goalWeight - s.startingWeight) / targetRate) * 7);
    if (Number.isFinite(projectedDay) && projectedDay <= dayNumber("9999-12-31")) projectedGoalDate = dateAt(projectedDay);
    else diagnostics.push({ code: "PROJECTED_DATE_OUT_OF_RANGE", severity: "warning", message: "The entered rate produces a projected date outside the supported four-digit calendar range.", refs: ["B12", "B37", "B39"] });
  }
  const planningStatus = s.goalType === "Maintain" ? `Maintenance range: ${(s.goalWeight - s.maintenanceLowerTolerance).toFixed(1)} to ${(s.goalWeight + s.maintenanceUpperTolerance).toFixed(1)} ${s.weightUnit}`
    : Math.abs(targetPercent) > s.maximumWeeklyRate ? "WARNING: required rate exceeds the selected maximum" : "Planned rate is within the selected limit";
  if (Math.abs(targetPercent) > s.maximumWeeklyRate) diagnostics.push({ code: "RATE_ABOVE_LIMIT", severity: "warning", message: "The required rate exceeds the selected limit. B32 is a planning warning, not a workbook adjustment cap or hold rule.", refs: ["B32", "B38", "B40", "CJ46:CJ98"] });
  if (s.goalDate && dayNumber(s.goalDate) <= start && s.planningMode === "Reach goal weight by target date") diagnostics.push({ code: "GOAL_DATE_NOT_AFTER_START", severity: "warning", message: "The goal date is not after the program start; the workbook protects division with a one-week minimum. Review this goal.", refs: ["B10", "B37"] });
  const calculatedLeanMass = s.bodyFatPercent == null ? null : s.startingWeight * (1 - s.bodyFatPercent);
  const lean = s.manualLeanMass ?? calculatedLeanMass;
  const initialProtein = proteinFor(s, s.startingCalories, s.startingWeight, lean);
  const initialFatGrams = initialFat(s);
  const remainder = initialProtein === null ? null : s.startingCalories - 4 * initialProtein - 9 * initialFatGrams;
  const initialCarbs = initialProtein === null ? null : fixedMode(s) ? roundIncrement(s.carbsGrams, s.macroRounding)
    : s.macroMode === WEIGHT_MACRO_OPTIONS.macroMode[3] ? roundIncrement(s.startingCalories * s.carbsPercent / 4, s.macroRounding)
    : remainder === null || remainder < 0 ? null : roundIncrement(remainder / 4, s.macroRounding);
  const initial = macros(s.startingCalories, initialProtein, initialCarbs, initialFatGrams);
  if (fixedMode(s)) initial.calories = initial.macroCalories;
  result.initialMacros = initial;
  if (fixedMode(s) && initial.calories !== null && (initial.calories < s.minimumCalories || initial.calories > s.maximumCalories)) diagnostics.push({ code: "FIXED_MACROS_OUTSIDE_LIMITS", severity: "warning", message: "Fixed-macro calories are outside the configured calorie limits. The workbook keeps calories derived from macros rather than clamping this mode.", refs: ["E28", "BJ46", "BS46", "B14:B15"] });
  const setupStatus = initialMacroStatus(s, initial);
  if (setupStatus.startsWith("WARNING")) diagnostics.push({ code: "MACRO_SETUP_WARNING", severity: "warning", message: setupStatus, refs: ["E25:E29"] });

  const observations = new Map<string, WeightMacroDailyRecord>();
  const duplicateDates = new Set<string>();
  const numberFields = ["weight", "calories", "protein", "carbs", "fat", "steps", "sleepHours", "waist", "performance", "hunger", "digestion"] as const;
  for (const record of records) {
    if (!isWeightMacroDate(record.date) || dayNumber(record.date) < start || dayNumber(record.date) > end) {
      diagnostics.push({ code: "RECORD_OUTSIDE_PROGRAM", severity: "warning", message: "A record with an invalid date or a date outside the generated program was not used.", refs: ["A46:A410"], date: record.date }); continue;
    }
    if (record.date > asOfDate) {
      diagnostics.push({ code: "FUTURE_RECORD_EXCLUDED", severity: "warning", message: "An observation after the supplied as-of date was not used as evidence.", refs: ["A46:AH410"], date: record.date }); continue;
    }
    if (observations.has(record.date) || duplicateDates.has(record.date)) {
      observations.delete(record.date); duplicateDates.add(record.date);
      diagnostics.push({ code: "DUPLICATE_DATE", severity: "warning", message: "Multiple daily records share this date. None of that date's ambiguous observations were used.", refs: ["A46:AH410"], date: record.date }); continue;
    }
    const clean = { ...record };
    for (const key of numberFields) {
      const value = clean[key];
      if (value == null) clean[key] = null;
      else if (!finite(value) || value > Number.MAX_SAFE_INTEGER || value < 0 || (key === "weight" && value === 0) || (key === "sleepHours" && value > 24) || (["performance", "hunger", "digestion"].includes(key) && (value < 1 || value > 5))) {
        clean[key] = null;
        diagnostics.push({ code: "INVALID_OBSERVATION", severity: "warning", message: `Invalid ${key} was excluded; missing observations are not zero.`, refs: ["E46:AB410"], date: record.date });
      }
    }
    if (clean.dayType && !WEIGHT_MACRO_OPTIONS.dayType.includes(clean.dayType)) delete clean.dayType;
    clean.includeWeight = record.includeWeight === true;
    clean.highSodiumCarb = record.highSodiumCarb === true;
    observations.set(record.date, clean);
  }
  const overrides = new Map<number, WeightMacroWeeklyOverride>();
  const duplicateWeeks = new Set<number>();
  for (const override of weeklyOverrides) {
    if (!Number.isInteger(override.week) || override.week < 1 || override.week > 53 || (override.calories != null && (!finite(override.calories) || override.calories < 0))) {
      diagnostics.push({ code: "INVALID_OVERRIDE", severity: "warning", message: "Invalid weekly override was excluded.", refs: ["BR46:BR98"], week: override.week }); continue;
    }
    if (overrides.has(override.week) || duplicateWeeks.has(override.week)) {
      overrides.delete(override.week); duplicateWeeks.add(override.week);
      diagnostics.push({ code: "DUPLICATE_OVERRIDE", severity: "warning", message: "Ambiguous duplicate weekly overrides were excluded.", refs: ["BR46:BR98"], week: override.week }); continue;
    }
    overrides.set(override.week, override);
  }

  const daily = result.daily;
  if (end > asOf) diagnostics.push({ code: "AS_OF_OBSERVATION_BOUNDARY", severity: "info", message: "Future rows keep planned targets but not projected measurement trends. Unlike the workbook's unbounded LOOKUP display, dashboard observations and trend calculations stop at the supplied as-of date.", refs: ["G46:J410", "M4:X8", "B42"] });
  let ew: number | null = null;
  let previousIncluded: number | null = null;
  for (let day = start; day <= end; day++) {
    const date = dateAt(day);
    const record = observations.get(date);
    const isFuture = day > asOf;
    const weight = record?.weight ?? null;
    const includedWeight = !isFuture && record?.includeWeight && positive(weight) ? weight : null;
    const potentialAnomaly = includedWeight !== null && previousIncluded !== null && Math.abs(includedWeight - previousIncluded) / previousIncluded > s.dailyChangeThreshold;
    if (includedWeight !== null) { ew = ew === null ? includedWeight : s.ewSmoothing * includedWeight + (1 - s.ewSmoothing) * ew; previousIncluded = includedWeight; }
    const row: WeightMacroDailyResult = {
      ...record, date, row: daily.length + 46, day: WEIGHT_MACRO_OPTIONS.reviewDay[mondayIndex(day)].slice(0, 3),
      week: day <= firstCheckIn ? 1 : 2 + Math.floor((day - firstCheckIn - 1) / 7),
      dayType: record?.dayType ?? (mondayIndex(day) < s.trainingDaysPerWeek ? "Training" : "Rest"),
      weight, includeWeight: record?.includeWeight ?? false, includedWeight, rollingAverage: null, ewTrend: isFuture ? null : ew,
      regressionTrend: null, trendWeight: null, trajectoryWeight: trajectoryAt(s, day, targetRate), trendVsTarget: null,
      target: macros(null, null, null, null), calorieAdherence: null, proteinAdherence: null,
      maintenanceLower: s.goalType === "Maintain" ? s.goalWeight - s.maintenanceLowerTolerance : null,
      maintenanceUpper: s.goalType === "Maintain" ? s.goalWeight + s.maintenanceUpperTolerance : null,
      potentialAnomaly, isFuture, trendEvidenceDates: [], cells: {},
    };
    daily.push(row);
    if (!isFuture) {
      const last7 = daily.slice(-7).filter(d => d.includedWeight !== null);
      row.rollingAverage = last7.length < 3 ? null : average(last7.map(d => d.includedWeight!));
      row.regressionTrend = regressionAt(daily, daily.length - 1);
      row.trendWeight = s.trendMethod === WEIGHT_MACRO_OPTIONS.trendMethod[0] ? row.rollingAverage : s.trendMethod === WEIGHT_MACRO_OPTIONS.trendMethod[1] ? row.ewTrend : row.regressionTrend;
      const window = s.trendMethod === WEIGHT_MACRO_OPTIONS.trendMethod[0] ? daily.slice(-7) : s.trendMethod === WEIGHT_MACRO_OPTIONS.trendMethod[2] ? daily.slice(-14) : daily;
      row.trendEvidenceDates = row.trendWeight === null ? [] : window.filter(d => d.includedWeight !== null).map(d => d.date);
      row.trendVsTarget = row.trendWeight === null ? null : row.trendWeight - row.trajectoryWeight;
    }
  }
  const energyPerUnit = s.weightUnit === "lb" ? 3500 : 7700;
  for (let weekStart = start, week = 1; weekStart <= end && week <= 53; week++) {
    const weekEnd = week === 1 ? Math.min(firstCheckIn, end) : Math.min(weekStart + 6, end);
    const rows = daily.filter(d => d.week === week);
    const previous = last(result.weekly);
    const override = overrides.get(week);
    const accepted = options.acceptedWeeklyTargets?.[week];
    const acceptedIsValid = accepted && positive(accepted.calories) && [accepted.protein, accepted.carbs, accepted.fat].every(v => v === null || (finite(v) && v >= 0));
    if (accepted && !acceptedIsValid) diagnostics.push({ code: "INVALID_ACCEPTED_TARGET", severity: "error", message: "A supplied accepted target is invalid; this week uses the workbook forecast instead and must not be accepted automatically.", refs: [`BJ${45 + week}:BM${45 + week}`], week });
    const current = { ...(acceptedIsValid ? accepted : previous?.next ?? initial) };
    const currentCalories = current.calories ?? s.startingCalories;
    current.calories = currentCalories;
    for (const row of rows) {
      row.target = weightMacroDailyTarget(s, current, row.dayType);
      row.calorieAdherence = finite(row.calories) && positive(row.target.calories) ? row.calories / row.target.calories : null;
      row.proteinAdherence = finite(row.protein) && positive(row.target.protein) ? row.protein / row.target.protein : null;
    }
    const includedRows = rows.filter(d => d.includedWeight !== null);
    const weights = includedRows.map(d => d.includedWeight!);
    const averageWeight = average(weights);
    const endingTrendRow = last(rows.filter(d => d.trendWeight !== null));
    const endingTrend = endingTrendRow?.trendWeight ?? null;
    const changeFromPriorWeek = endingTrend !== null && previous?.endingTrend != null ? endingTrend - previous.endingTrend : null;
    const endRow = daily[weekEnd - start];
    const priorRegressionRow = daily[weekEnd - start - 7];
    const fourteenDayRate = endRow.regressionTrend !== null && priorRegressionRow?.regressionTrend != null ? endRow.regressionTrend - priorRegressionRow.regressionTrend : null;
    const localDiagnostics: WeightMacroIssue[] = [];
    if (priorRegressionRow && (endRow.regressionTrend === null || priorRegressionRow.regressionTrend === null)) localDiagnostics.push({ code: "AQ_BLANK_REGRESSION", severity: "info", message: `Workbook AQ would coerce a matched blank regression cell to zero (producing ${(endRow.regressionTrend ?? 0) - (priorRegressionRow.regressionTrend ?? 0)}). This model leaves AQ unknown and uses a valid week-to-week trend change when available.`, refs: [`AQ${45 + week}`, "I46:I410", `CE${45 + week}`], week });
    const activeRate = fourteenDayRate ?? changeFromPriorWeek;
    const regressionDates = (index: number) => daily.slice(Math.max(0, index - 13), index + 1).filter(d => d.includedWeight !== null).map(d => d.date);
    const priorTrendRow = last(daily.filter(d => d.week === week - 1 && d.trendWeight !== null));
    const trendDates = [...new Set([
      ...(endingTrendRow?.trendEvidenceDates ?? []),
      ...(fourteenDayRate !== null ? [...regressionDates(weekEnd - start), ...regressionDates(weekEnd - start - 7)] : priorTrendRow?.trendEvidenceDates ?? []),
    ])].sort();
    const rateError = activeRate === null ? null : targetRate - activeRate;
    const loggedCalories = rows.map(d => d.calories).filter(positive);
    const averageCalories = average(loggedCalories);
    const calorieDays = loggedCalories.length;
    const nutritionAdherence = averageCalories === null ? null : Math.max(0, 1 - Math.abs(averageCalories / currentCalories - 1)) * Math.min(1, calorieDays / Math.max(1, weekEnd - weekStart + 1));
    const variability = weights.length < 2 || averageWeight === null ? null : Math.sqrt(sum(weights.map(w => (w - averageWeight) ** 2)) / (weights.length - 1)) / averageWeight;
    const refeed = rows.some(d => d.highSodiumCarb);
    const waterAnomaly = rows.some(d => d.potentialAnomaly) || (refeed && variability !== null && variability > s.variabilityThreshold / 2);
    const avgField = (key: keyof WeightMacroDailyRecord) => average(rows.map(d => d[key]).filter(positive));
    const estimatedTdee = changeFromPriorWeek === null || averageCalories === null || weights.length < s.minimumWeighIns || calorieDays < 4 || nutritionAdherence === null || nutritionAdherence < s.minimumAdherence ? null : averageCalories - changeFromPriorWeek * energyPerUnit / 7;
    const smoothedTdee = estimatedTdee === null ? previous?.smoothedTdee ?? null : previous?.smoothedTdee == null ? estimatedTdee : 0.35 * estimatedTdee + 0.65 * previous.smoothedTdee;
    const trajectoryWeight = endRow.trajectoryWeight;
    const trendVsTrajectory = endingTrend === null ? null : endingTrend - trajectoryWeight;
    const correction = s.trajectoryCorrection && endingTrend !== null && trendVsTrajectory !== null && previous?.endingTrend != null && previous.trendVsTrajectory !== null && trendVsTrajectory * previous.trendVsTrajectory > 0 && Math.abs(trendVsTrajectory / endingTrend) > s.rateDeadband && Math.abs(previous.trendVsTrajectory / previous.endingTrend) > s.rateDeadband
      ? clamp(-trendVsTrajectory * energyPerUnit / 28 * s.aggressiveness, -s.maximumTrajectoryCorrection, s.maximumTrajectoryCorrection) : 0;
    const w: WeightMacroWeeklyResult = {
      row: week + 45, week, startDate: dateAt(weekStart), endDate: dateAt(weekEnd), validWeighIns: weights.length, averageWeight, endingTrend,
      changeFromPriorWeek, changeFromPriorWeekPercent: changeFromPriorWeek === null || !previous?.endingTrend ? null : changeFromPriorWeek / previous.endingTrend,
      fourteenDayRate, targetRate, actualVsTargetRate: activeRate === null ? null : activeRate - targetRate,
      trajectoryWeight, trendVsTrajectory, averageCalories, calorieDays, nutritionAdherence,
      averages: { protein: avgField("protein"), carbs: avgField("carbs"), fat: avgField("fat"), steps: avgField("steps"), sleepHours: avgField("sleepHours"), waist: avgField("waist"), performance: avgField("performance"), hunger: avgField("hunger"), digestion: avgField("digestion") },
      estimatedTdee, smoothedTdee, current, rawAdjustment: rateError === null ? null : rateError * energyPerUnit / 7 * s.aggressiveness,
      trajectoryCorrection: correction, cappedAdjustment: 0, recommendedCalories: currentCalories, manualOverride: override?.calories ?? null,
      next: macros(currentCalories, null, null, null), variability, waterAnomaly, deload: override?.deload === true, refeed, disruption: override?.disruption === true, notes: override?.notes ?? "",
      status: "", reason: "", activeRate, rateError, proposedProtein: null, nonProteinCalorieDelta: null, proposedFat: null, holdRule: null, macroFeasibility: null,
      evidence: { recordIds: rows.filter(d => observations.has(d.date)).map(d => d.id ?? d.date), dates: rows.filter(d => observations.has(d.date)).map(d => d.date), from: dateAt(weekStart), through: weekStart > asOf ? null : dateAt(Math.min(asOf, weekEnd)), trendDates, trendRecordIds: trendDates.map(date => observations.get(date)?.id ?? date), expectedDays: weekEnd - weekStart + 1, validWeighIns: weights.length, calorieDays, isComplete: weekEnd <= asOf },
      formulaRefs: [`AI${45 + week}:CL${45 + week}`, "B37:B42", "E25:E29", "A46:AH410"], diagnostics: localDiagnostics, cells: {},
    };
    w.holdRule = holdRule(s, w, start, targetPercent);
    const rawCombined = (w.rawAdjustment ?? 0) + correction;
    w.cappedAdjustment = w.rawAdjustment === null || w.holdRule !== null || Math.abs(rawCombined) < s.calorieRounding ? 0 : clamp(roundIncrement(rawCombined, s.calorieRounding), -s.maximumWeeklyDecrease, s.maximumWeeklyIncrease);
    w.recommendedCalories = clamp(currentCalories + w.cappedAdjustment, s.minimumCalories, s.maximumCalories);
    w.next.calories = fixedMode(s) ? initial.macroCalories! : w.manualOverride !== null ? clamp(w.manualOverride, s.minimumCalories, s.maximumCalories) : s.adjustmentMode === "Fully automatic" ? w.recommendedCalories : currentCalories;
    if (w.manualOverride !== null && fixedMode(s)) localDiagnostics.push({ code: "FIXED_MACROS_OVERRIDE_IGNORED", severity: "warning", message: "Fixed-grams mode ignores the calorie override. The workbook's CB/CC override message is misleading here; the displayed status reflects the fixed-macro result.", refs: [`BR${w.row}`, `BS${w.row}`, `CB${w.row}`, `CC${w.row}`], week });
    else if (w.manualOverride !== null && w.manualOverride !== w.next.calories) localDiagnostics.push({ code: "OVERRIDE_CLAMPED", severity: "info", message: "The manual calorie override was clamped to the configured minimum/maximum.", refs: [`BR${w.row}`, `BS${w.row}`, "B14:B15"], week });
    w.next = nextMacros(s, w, lean);
    if (w.macroFeasibility === "Impossible") localDiagnostics.push({ code: "MACROS_IMPOSSIBLE", severity: "warning", message: "The next calorie target cannot fit the proposed protein and configured fat/carbohydrate floors. Next macro values are unknown; do not silently use zero.", refs: [`CL${w.row}`, `BT${w.row}:BV${w.row}`], week });
    if (w.next.fat !== null && w.next.fat < s.minimumFat) localDiagnostics.push({ code: "FAT_FLOOR_ROUNDING", severity: "warning", message: "Workbook ROUNDDOWN leaves fat below the configured floor when the floor is not aligned to the macro increment. Review rounding or floors.", refs: [`BV${w.row}`, "E17", "E19"], week });
    if (rows.some(d => (d.target.fat !== null && d.target.fat < s.minimumFat) || (d.target.carbs !== null && d.target.carbs < s.minimumCarbs))) localDiagnostics.push({ code: "DAILY_MACRO_BELOW_FLOOR", severity: "warning", message: "At least one daily target falls below a configured macro floor. The source daily allocation does not enforce all weekly floors.", refs: [`O${rows[0].row}:P${last(rows)!.row}`, "E17:E18"], week });
    if (rows.some(d => d.target.protein === null || d.target.carbs === null || d.target.fat === null)) localDiagnostics.push({ code: "DAILY_MACROS_UNAVAILABLE", severity: "warning", message: "At least one daily macro target is unavailable or cannot fit its calorie budget. Missing targets must not be interpreted as zero.", refs: [`N${rows[0].row}:P${last(rows)!.row}`], week });
    if (s.cycling && rows.some(d => d.target.calories! < s.minimumCalories || d.target.calories! > s.maximumCalories)) localDiagnostics.push({ code: "CYCLING_OUTSIDE_DAILY_LIMITS", severity: "warning", message: "Cycling preserves the weekly average but can put a daily target outside the weekly calorie limits. The workbook does not clamp individual days.", refs: ["H11:H13", `M${rows[0].row}:M${last(rows)!.row}`, "B14:B15"], week });
    if (rows.some(d => d.target.carbs !== current.carbs) && !s.cycling) localDiagnostics.push({ code: "DAILY_CARBS_REMAINDER", severity: "warning", message: "Daily column O recalculates carbohydrate from remaining calories, while weekly BL stores the macro allocation. Daily and weekly carbohydrate targets differ; both are preserved.", refs: [`BL${w.row}`, `O${rows[0].row}:O${last(rows)!.row}`], week });
    Object.assign(w, describeWeek(s, w));
    w.cells = { AI: week, AJ: w.startDate, AK: w.endDate, AL: w.validWeighIns, AM: averageWeight, AN: endingTrend, AO: changeFromPriorWeek, AP: w.changeFromPriorWeekPercent, AQ: fourteenDayRate, AR: targetRate, AS: w.actualVsTargetRate, AT: trajectoryWeight, AU: trendVsTrajectory, AV: averageCalories, AW: calorieDays, AX: nutritionAdherence, AY: w.averages.protein, AZ: w.averages.carbs, BA: w.averages.fat, BB: w.averages.steps, BC: w.averages.sleepHours, BD: w.averages.waist, BE: w.averages.performance, BF: w.averages.hunger, BG: w.averages.digestion, BH: estimatedTdee, BI: smoothedTdee, BJ: current.calories, BK: current.protein, BL: current.carbs, BM: current.fat, BN: w.rawAdjustment, BO: correction, BP: w.cappedAdjustment, BQ: w.recommendedCalories, BR: w.manualOverride, BS: w.next.calories, BT: w.next.protein, BU: w.next.carbs, BV: w.next.fat, BW: variability, BX: waterAnomaly ? "Yes" : "No", BY: override?.deload == null ? null : w.deload ? "Yes" : "No", BZ: refeed ? "Yes" : "No", CA: override?.disruption == null ? null : w.disruption ? "Yes" : "No", CB: w.status, CC: w.reason, CD: w.notes || null, CE: activeRate, CF: rateError, CG: w.proposedProtein, CH: w.nonProteinCalorieDelta, CI: w.proposedFat, CJ: w.holdRule, CK: w.next.macroCalories, CL: w.macroFeasibility };
    result.weekly.push(w); diagnostics.push(...localDiagnostics);
    weekStart = weekEnd + 1;
  }
  for (const d of daily) d.cells = { A: d.date, B: d.day, C: d.week, D: d.dayType, E: d.weight ?? null, F: d.includeWeight ? "Yes" : "No", G: d.rollingAverage, H: d.ewTrend, I: d.regressionTrend, J: d.trendWeight, K: d.trajectoryWeight, L: d.trendVsTarget, M: d.target.calories, N: d.target.protein, O: d.target.carbs, P: d.target.fat, Q: d.calories ?? null, R: d.protein ?? null, S: d.carbs ?? null, T: d.fat ?? null, U: d.calorieAdherence, V: d.proteinAdherence, W: d.steps ?? null, X: d.sleepHours ?? null, Y: d.waist ?? null, Z: d.performance ?? null, AA: d.hunger ?? null, AB: d.digestion ?? null, AC: d.highSodiumCarb == null ? null : d.highSodiumCarb ? "Yes" : "No", AD: d.notes ?? null, AE: d.maintenanceLower, AF: d.maintenanceUpper, AG: d.potentialAnomaly ? "Potential anomaly" : null, AH: d.includedWeight };
  const current = result.weekly.find(w => w.week === currentWeek) ?? result.weekly[0];
  const cycle = cyclingTargets(s, current.current.calories!);
  const allocationNote = "Increase/reduction priority applies when macros are not locked by percentages, body weight, or fixed grams.";
  const cyclingStatus = !s.cycling ? "Cycling is off" : Math.abs(cycle.average - current.current.calories!) <= 1 ? "Weekly average reconciles to target" : "WARNING: review cycling inputs";
  const derived: WeightMacroDerivedSettings = {
    calculatedLeanMass, effectiveLeanMass: lean, targetWeeklyChange: targetRate, targetWeeklyChangePercent: targetPercent,
    projectedGoalDate, planningStatus, firstCheckInDate: dateAt(firstCheckIn), currentProgramWeek: currentWeek,
    macroSetupStatus: setupStatus, allocationNote, currentAverageTarget: current.current.calories!, currentTrainingTarget: cycle.training,
    currentRestTarget: cycle.rest, cyclingAverage: cycle.average, cyclingStatus, cells: {},
  };
  derived.cells = { B37: targetRate, B38: targetPercent, B39: projectedGoalDate, B40: planningStatus, B41: derived.firstCheckInDate, B42: currentWeek, E4: calculatedLeanMass, E6: lean, E25: initial.protein, E26: initial.fat, E27: initial.carbs, E28: initial.macroCalories, E29: setupStatus, E30: allocationNote, H10: current.current.calories, H11: cycle.training, H12: cycle.rest, H13: cycle.average, H14: cyclingStatus, G17: current.reason };
  result.settingsDerived = derived;
  const past = daily.filter(d => !d.isFuture);
  const lastWeight = last(past.filter(d => d.weight != null));
  const lastTrend = last(past.filter(d => d.trendWeight !== null));
  const lastWaist = last(past.filter(d => d.waist != null));
  const change = (days: number) => {
    if (!lastTrend) return null;
    const prior = daily[dayNumber(lastTrend.date) - start - days]?.trendWeight;
    return prior == null ? null : lastTrend.trendWeight! - prior;
  };
  const change7 = change(7);
  result.dashboard = {
    latestWeight: lastWeight?.weight ?? null, latestWeightDate: lastWeight?.date ?? null,
    latestTrend: lastTrend?.trendWeight ?? null, latestTrendDate: lastTrend?.date ?? null, startingWeight: s.startingWeight, goalWeight: s.goalWeight,
    progress: !lastTrend || s.goalWeight === s.startingWeight ? null : clamp((lastTrend.trendWeight! - s.startingWeight) / (s.goalWeight - s.startingWeight), 0, 1),
    status: current.status, totalChange: lastTrend ? lastTrend.trendWeight! - s.startingWeight : null, remaining: lastTrend ? s.goalWeight - lastTrend.trendWeight! : null,
    change7, change14: change(14), change28: change(28), direction: change7 === null ? null : change7 > 0 ? "Rising" : change7 < 0 ? "Falling" : "Stable",
    actualWeeklyRatePercent: current.activeRate === null || !current.endingTrend ? null : current.activeRate / current.endingTrend,
    targetWeeklyRatePercent: targetPercent, daysAheadOfTrajectory: !lastTrend || targetRate === 0 ? null : (lastTrend.trendWeight! - lastTrend.trajectoryWeight) / (targetRate / 7),
    current: { ...current.current }, recommendedCalories: current.recommendedCalories, smoothedTdee: current.smoothedTdee,
    nutritionAdherence: current.nutritionAdherence, validWeighIns: current.validWeighIns, expectedDays: current.evidence.expectedDays,
    projectedGoalDate, latestWaist: lastWaist?.waist ?? null, waistChange: lastWaist?.waist != null && daily[0].waist != null ? lastWaist.waist - daily[0].waist : null,
    trendSeries: past.filter(d => d.trendWeight !== null && lastTrend && dayNumber(d.date) >= dayNumber(lastTrend.date) - 29).map(d => ({ date: d.date, value: d.trendWeight! })),
    adherenceSeries: past.filter(d => d.calorieAdherence !== null).map(d => ({ date: d.date, value: d.calorieAdherence! })),
    reason: current.reason, currentWeek,
  };
  return result;
}
