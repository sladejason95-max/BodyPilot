import type { FoodNutrients } from "./types";

export type FoodDiaryEntry = {
  id: string;
  label: string;
  brand?: string;
  barcode?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutrients?: FoodNutrients;
  /** Null means an older entry had no known calendar day. */
  date: string | null;
  recordedAt: string | null;
  servings: number;
  /** Nutrition for exactly one original serving, never rescaled in place. */
  baseNutrients: FoodNutrients;
  source?: string;
  foodId?: string;
  servingGrams?: number;
};

export type FoodDiaryFood = Pick<
  FoodDiaryEntry,
  "label" | "servingLabel" | "calories" | "protein" | "carbs" | "fat"
> &
  Partial<
    Omit<
      FoodDiaryEntry,
      "label" | "servingLabel" | "calories" | "protein" | "carbs" | "fat"
    >
  >;

export type FoodDiaryTotals = Pick<
  FoodNutrients,
  "calories" | "protein" | "carbs" | "fat"
>;

const macroKeys = ["calories", "protein", "carbs", "fat"] as const;
const nutrientKeys: (keyof FoodNutrients)[] = [
  ...macroKeys,
  "fiber",
  "sugar",
  "sodiumMg",
  "potassiumMg",
  "calciumMg",
  "ironMg",
  "magnesiumMg",
  "zincMg",
  "vitaminCMg",
  "vitaminDMcg",
  "vitaminAMcg",
  "vitaminEMg",
  "vitaminKMcg",
  "folateMcg",
  "vitaminB12Mcg",
  "cholesterolMg",
  "saturatedFat",
  "fluidMl",
];
const numberPattern = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const numberValue = (value: unknown): number | null => {
  if (typeof value === "string") {
    if (!numberPattern.test(value.trim())) return null;
    value = Number(value.trim());
  }
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
};

const textValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const validDateKey = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const match = datePattern.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return (
    day <=
    [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  );
};

const timestampValue = (value: unknown): string | null => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    return null;
  if (!validDateKey(value.slice(0, 10))) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
};

const readNutrients = (value: unknown): FoodNutrients | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const nutrients = {} as FoodNutrients;
  for (const key of nutrientKeys) {
    if (
      raw[key] === undefined &&
      !macroKeys.includes(key as (typeof macroKeys)[number])
    )
      continue;
    const amount = numberValue(raw[key]);
    if (amount === null) return null;
    nutrients[key] = amount;
  }
  return nutrients;
};

const scaleNutrients = (
  base: FoodNutrients,
  servings: number,
): FoodNutrients | null => {
  const scaled = {} as FoodNutrients;
  for (const key of nutrientKeys) {
    if (base[key] === undefined) continue;
    const value = base[key]! * servings;
    if (!Number.isFinite(value) || value < 0) return null;
    scaled[key] = value;
  }
  return scaled;
};

const normalizedEntry = (
  value: unknown,
  fallbackId: string,
): FoodDiaryEntry | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const label = textValue(raw.label);
  const servingLabel = textValue(raw.servingLabel) ?? "1 serving";
  const date = raw.date === undefined || raw.date === null ? null : raw.date;
  if (!label || (date !== null && !validDateKey(date))) return null;
  const servings = raw.servings === undefined ? 1 : numberValue(raw.servings);
  if (servings === null || servings <= 0) return null;

  // The visible macros are required even when a nested nutrient object exists.
  const macros = readNutrients(
    Object.fromEntries(macroKeys.map((key) => [key, raw[key]])),
  );
  if (!macros) return null;
  const suppliedNutrients =
    raw.nutrients === undefined ? macros : readNutrients(raw.nutrients);
  if (!suppliedNutrients) return null;
  const combinedNutrients = { ...suppliedNutrients, ...macros };
  const baseNutrients =
    raw.baseNutrients === undefined
      ? scaleNutrients(combinedNutrients, 1 / servings)
      : readNutrients(raw.baseNutrients);
  if (!baseNutrients) return null;
  const nutrients = scaleNutrients(baseNutrients, servings);
  if (!nutrients) return null;
  const servingGrams =
    raw.servingGrams === undefined ? undefined : numberValue(raw.servingGrams);
  if (servingGrams === null || servingGrams === 0) return null;

  return {
    id: textValue(raw.id) ?? fallbackId,
    label,
    ...(textValue(raw.brand) ? { brand: textValue(raw.brand) } : {}),
    ...(textValue(raw.barcode) ? { barcode: textValue(raw.barcode) } : {}),
    servingLabel,
    calories: nutrients.calories,
    protein: nutrients.protein,
    carbs: nutrients.carbs,
    fat: nutrients.fat,
    nutrients: { ...nutrients },
    date: date as string | null,
    recordedAt: timestampValue(raw.recordedAt),
    servings,
    baseNutrients: Object.freeze({ ...baseNutrients }),
    ...(textValue(raw.source) ? { source: textValue(raw.source) } : {}),
    ...(textValue(raw.foodId) ? { foodId: textValue(raw.foodId) } : {}),
    ...(servingGrams !== undefined ? { servingGrams } : {}),
  };
};

/** Restores every valid entry. Legacy dates remain unknown; IDs never supply dates. */
export const normalizeFoodDiary = (value: unknown): FoodDiaryEntry[] => {
  if (!Array.isArray(value)) return [];
  const usedIds = new Set<string>();
  return value.flatMap((raw, index) => {
    const entry = normalizedEntry(raw, `food-diary:${index}`);
    if (!entry) return [];
    const originalId = entry.id;
    let suffix = 2;
    while (usedIds.has(entry.id)) entry.id = `${originalId}:${suffix++}`;
    usedIds.add(entry.id);
    return [entry];
  });
};

/** Calendar dates are local, not UTC dates from toISOString(). */
export const foodDiaryDateKey = (value: Date): string => {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime()))
    throw new RangeError("A valid date is required.");
  const key = `${String(value.getFullYear()).padStart(4, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  if (!validDateKey(key))
    throw new RangeError("Date is outside the supported calendar range.");
  return key;
};

/**
 * Enables weight entry only when the serving label actually states a mass.
 * Provider fields named "servingGrams" can contain millilitres or a 100-unit
 * fallback, so their name alone is not evidence of a gram-based serving.
 */
export const foodServingMassGrams = (
  servingLabel: string,
  servingGrams?: number,
): number | null => {
  if (typeof servingLabel !== "string") return null;
  if (
    servingGrams !== undefined &&
    (!Number.isFinite(servingGrams) || servingGrams <= 0)
  )
    return null;
  const masses = [
    ...servingLabel.matchAll(
      /(?:^|[\s(])([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(?:grams?|g)\b/gi,
    ),
  ];
  // Multiple stated masses may mean "per piece" versus a complete portion.
  if (masses.length !== 1) return null;
  const statedMass = Number(masses[0][1]);
  if (!Number.isFinite(statedMass) || statedMass <= 0) return null;
  if (servingGrams === undefined) return statedMass;
  const tolerance = Number.EPSILON * Math.max(1, statedMass, servingGrams) * 8;
  return Math.abs(statedMass - servingGrams) <= tolerance ? statedMass : null;
};

/** Targets never cap intake; undated legacy foods never become today's foods. */
export const foodDiaryTotals = (
  entries: readonly FoodDiaryEntry[],
  date: string,
): FoodDiaryTotals => {
  const total: FoodDiaryTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!validDateKey(date)) return total;
  for (const entry of entries) {
    if (
      entry.date !== date ||
      macroKeys.some((key) => numberValue(entry[key]) === null)
    )
      continue;
    for (const key of macroKeys) total[key] += Number(entry[key]);
  }
  for (const key of macroKeys) total[key] = Number(total[key].toFixed(6));
  return total;
};

/** Creates a newly dated log entry; caller supplies identity and recording time. */
export const createFoodDiaryEntry = (
  base: FoodDiaryFood,
  options: {
    id: string;
    date: string;
    recordedAt: string | null;
    servings?: number;
  },
): FoodDiaryEntry | null => {
  if (!textValue(options.id) || !validDateKey(options.date)) return null;
  if (options.recordedAt !== null && !timestampValue(options.recordedAt))
    return null;
  const original = normalizedEntry(base, options.id);
  if (!original) return null;
  const servings =
    options.servings === undefined
      ? original.servings
      : numberValue(options.servings);
  if (servings === null || servings <= 0) return null;
  const resized = resizeFoodDiaryEntry(original, servings);
  return resized
    ? {
        ...resized,
        id: options.id.trim(),
        date: options.date,
        recordedAt: timestampValue(options.recordedAt),
      }
    : null;
};

/** Resizing always uses the original serving basis, never the last rounded total. */
export const resizeFoodDiaryEntry = (
  entry: FoodDiaryEntry,
  servings: number,
): FoodDiaryEntry | null => {
  const amount = numberValue(servings);
  if (amount === null || amount <= 0) return null;
  const original = normalizedEntry(entry, entry.id);
  if (!original) return null;
  const nutrients = scaleNutrients(original.baseNutrients, amount);
  return nutrients
    ? {
        ...original,
        servings: amount,
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fat: nutrients.fat,
        nutrients: { ...nutrients },
        baseNutrients: Object.freeze({ ...original.baseNutrients }),
      }
    : null;
};

const recentKey = (entry: FoodDiaryEntry) => {
  const clean = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();
  const identity = entry.barcode
    ? `barcode:${entry.barcode}`
    : entry.foodId
      ? `food:${entry.foodId}`
      : `label:${clean(entry.label)}:${clean(entry.brand ?? "")}`;
  return JSON.stringify([
    identity,
    clean(entry.servingLabel),
    entry.servingGrams ?? null,
    ...macroKeys.map((key) => entry.baseNutrients[key]),
  ]);
};

/** Newest distinct portions first. Undated history remains available for explicit re-log. */
export const recentFoodDiaryEntries = (
  entries: readonly FoodDiaryEntry[],
  limit = 6,
): FoodDiaryEntry[] => {
  if (!Number.isFinite(limit) || Math.floor(limit) < 1) return [];
  const sorted = normalizeFoodDiary(entries)
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        (b.entry.date ?? "").localeCompare(a.entry.date ?? "") ||
        (b.entry.recordedAt ?? "").localeCompare(a.entry.recordedAt ?? "") ||
        a.index - b.index,
    );
  const seen = new Set<string>();
  const result: FoodDiaryEntry[] = [];
  for (const { entry } of sorted) {
    const key = recentKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
    if (result.length >= Math.floor(limit)) break;
  }
  return result;
};
