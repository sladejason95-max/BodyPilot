// Explicit extension also supports the native Node TypeScript test runner.
// @ts-ignore TS5097: this project type-checks without emitting JavaScript.
import { createFoodDiaryEntry, normalizeFoodDiary } from "./food_diary.ts";
import type { FoodDiaryEntry, FoodDiaryFood } from "./food_diary";

/** A reusable portion snapshot, never a reference to a dated diary entry. */
export type FoodMealItem = Omit<FoodDiaryEntry, "id" | "date" | "recordedAt">;
export type SavedFoodMeal = {
  id: string;
  name: string;
  items: FoodMealItem[];
  createdAt: string | null;
};

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/** Invalid components reject the whole meal; a partial meal would under-report intake. */
export const foodMealItems = (value: unknown): FoodMealItem[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items: FoodMealItem[] = [];
  for (const candidate of value) {
    const raw = record(candidate);
    if (!raw) return null;
    const entry = normalizeFoodDiary([
      { ...raw, id: "meal-item", date: null, recordedAt: null },
    ])[0];
    if (!entry) return null;
    const { id: _id, date: _date, recordedAt: _recordedAt, ...item } = entry;
    items.push({
      ...item,
      nutrients: item.nutrients
        ? Object.freeze({ ...item.nutrients })
        : undefined,
      baseNutrients: Object.freeze({ ...item.baseNutrients }),
    });
  }
  return items;
};

export const createSavedFoodMeal = (input: {
  id: string;
  name: string;
  items: readonly FoodDiaryFood[];
  createdAt: string | null;
}): SavedFoodMeal | null => {
  const id = text(input.id);
  const name = text(input.name);
  const items = foodMealItems(input.items);
  if (!id || !name || name.length > 80 || !items) return null;
  // Reuse the diary's strict timestamp validator; no date is inferred for items.
  const clock = createFoodDiaryEntry(items[0], {
    id: "meal-clock",
    date: "2000-01-01",
    recordedAt: input.createdAt,
  });
  if (!clock) return null;
  return { id, name, items, createdAt: clock.recordedAt };
};

/** Old app states have no meals. Valid meals are retained, not silently truncated. */
export const normalizeSavedFoodMeals = (value: unknown): SavedFoodMeal[] => {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const meals: SavedFoodMeal[] = [];
  value.forEach((candidate, index) => {
    const raw = record(candidate);
    if (!raw || !Array.isArray(raw.items)) return;
    const meal = createSavedFoodMeal({
      id: text(raw.id) ?? `saved-food-meal:${index}`,
      name: typeof raw.name === "string" ? raw.name : "",
      items: raw.items,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : null,
    });
    if (!meal) return;
    const originalId = meal.id;
    let suffix = 2;
    while (ids.has(meal.id)) meal.id = `${originalId}:${suffix++}`;
    ids.add(meal.id);
    meals.push(meal);
  });
  return meals;
};

/** Every component gets the same explicit destination day and a new identity. */
export const instantiateFoodMeal = (
  items: readonly FoodDiaryFood[],
  options: {
    batchId: string;
    date: string;
    recordedAt: string | null;
    existingIds?: readonly string[];
  },
): FoodDiaryEntry[] | null => {
  const snapshot = foodMealItems(items);
  const batchId = text(options.batchId);
  if (!snapshot || !batchId) return null;
  const ids = new Set(options.existingIds ?? []);
  const entries: FoodDiaryEntry[] = [];
  for (const [index, item] of snapshot.entries()) {
    const id = `${batchId}:${index + 1}`;
    if (ids.has(id)) return null;
    const entry = createFoodDiaryEntry(item, {
      id,
      date: options.date,
      recordedAt: options.recordedAt,
      servings: item.servings,
    });
    if (!entry) return null;
    entries.push(entry);
    ids.add(id);
  }
  return entries;
};

/** Restore is additive: a newer meal with the same name or ID is never overwritten. */
export const restoreSavedFoodMeal = (
  meals: readonly SavedFoodMeal[],
  removed: SavedFoodMeal,
): SavedFoodMeal[] => {
  const restored = createSavedFoodMeal(removed);
  if (!restored) return [...meals];
  const nameKey = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();
  const names = new Set(meals.map((meal) => nameKey(meal.name)));
  const ids = new Set(meals.map((meal) => meal.id));
  const originalName = restored.name;
  const originalId = restored.id;
  let nameSuffix = 1;
  while (names.has(nameKey(restored.name))) {
    const suffix =
      nameSuffix === 1 ? " (restored)" : ` (restored ${nameSuffix})`;
    restored.name = `${originalName.slice(0, 80 - suffix.length).trimEnd()}${suffix}`;
    nameSuffix++;
  }
  let idSuffix = 1;
  while (ids.has(restored.id)) {
    restored.id = `${originalId}:restored:${idSuffix++}`;
  }
  return [restored, ...meals];
};

/** Undo logging removes the whole added batch, including subsequently edited portions. */
export const undoFoodDiaryBatch = (
  entries: readonly FoodDiaryEntry[],
  entryIds: readonly string[],
): FoodDiaryEntry[] => {
  const ids = new Set(entryIds);
  return entries.filter((entry) => !ids.has(entry.id));
};
