import assert from "node:assert/strict";
import test from "node:test";
import {
  createFoodDiaryEntry,
  foodDiaryTotals,
  resizeFoodDiaryEntry,
} from "../src/app/food_diary.ts";
import {
  createSavedFoodMeal,
  foodMealItems,
  instantiateFoodMeal,
  normalizeSavedFoodMeals,
  restoreSavedFoodMeal,
  undoFoodDiaryBatch,
} from "../src/app/food_meals.ts";

const at = "2026-09-03T15:30:00.000Z";
const food = {
  label: "Oats",
  servingLabel: "70 g dry",
  calories: 265,
  protein: 9,
  carbs: 46,
  fat: 5,
  nutrients: { calories: 265, protein: 9, carbs: 46, fat: 5, fiber: 7 },
  servingGrams: 70,
  foodId: "oats",
  source: "core",
};
const diaryEntry = (id = "old", servings = 1) =>
  createFoodDiaryEntry(food, {
    id,
    servings,
    date: "2026-09-02",
    recordedAt: at,
  });
const save = (overrides = {}) =>
  createSavedFoodMeal({
    id: "breakfast",
    name: "Breakfast",
    items: [diaryEntry()],
    createdAt: at,
    ...overrides,
  });

test("meal snapshots preserve exact portions, provenance, and optional nutrients without diary identity", () => {
  const source = diaryEntry("old", 0.375);
  const meal = save({ items: [source] });
  assert.equal(meal.items[0].servings, 0.375);
  assert.equal(meal.items[0].calories, 99.375);
  assert.equal(meal.items[0].nutrients.fiber, 2.625);
  assert.equal(meal.items[0].baseNutrients.fiber, 7);
  assert.equal(meal.items[0].foodId, "oats");
  assert.equal(meal.items[0].source, "core");
  for (const key of ["id", "date", "recordedAt"])
    assert.equal(key in meal.items[0], false);
  assert.notEqual(meal.items[0].baseNutrients, source.baseNutrients);
  assert.ok(Object.isFrozen(meal.items[0].baseNutrients));
  assert.ok(Object.isFrozen(meal.items[0].nutrients));
});

test("saving or copying meals never changes historical portions", () => {
  const original = diaryEntry("old", 0.5);
  const originalJson = JSON.stringify(original);
  const meal = save({ items: [original] });
  const batch = instantiateFoodMeal(meal.items, {
    batchId: "copy",
    date: "2026-09-03",
    recordedAt: at,
  });
  const edited = resizeFoodDiaryEntry(batch[0], 2);
  assert.equal(edited.calories, 530);
  assert.equal(meal.items[0].calories, 132.5);
  assert.equal(JSON.stringify(original), originalJson);
  assert.equal(original.date, "2026-09-02");
  assert.equal(batch[0].date, "2026-09-03");
});

test("a multi-food copy uses one destination day and fresh unique IDs", () => {
  const sources = [diaryEntry("same", 0.5), diaryEntry("same", 1.25)];
  const batch = instantiateFoodMeal(sources, {
    batchId: "batch",
    date: "2026-08-01",
    recordedAt: at,
  });
  assert.deepEqual(
    batch.map((entry) => entry.id),
    ["batch:1", "batch:2"],
  );
  assert.ok(
    batch.every(
      (entry) => entry.date === "2026-08-01" && entry.recordedAt === at,
    ),
  );
  assert.equal(foodDiaryTotals(batch, "2026-08-01").calories, 463.75);
  assert.equal(foodDiaryTotals(batch, "2026-09-02").calories, 0);
  assert.equal(sources[0].id, "same");
});

test("copy is all-or-nothing for bad components, dates, time, and identity collisions", () => {
  const options = { batchId: "batch", date: "2026-09-03", recordedAt: at };
  assert.equal(instantiateFoodMeal([], options), null);
  assert.equal(
    instantiateFoodMeal([food, { ...food, protein: undefined }], options),
    null,
  );
  assert.equal(
    instantiateFoodMeal([food], { ...options, date: "2026-02-30" }),
    null,
  );
  assert.equal(
    instantiateFoodMeal([food], { ...options, recordedAt: "yesterday" }),
    null,
  );
  assert.equal(
    instantiateFoodMeal([food], { ...options, batchId: "  " }),
    null,
  );
  assert.equal(
    instantiateFoodMeal([food, food], { ...options, existingIds: ["batch:2"] }),
    null,
  );
  assert.ok(
    instantiateFoodMeal([food], { ...options, existingIds: ["other:1"] }),
  );
});

test("restore keeps complete valid meals, repairs duplicate IDs, and never infers food dates", () => {
  const raw = save();
  const restored = normalizeSavedFoodMeals([
    raw,
    raw,
    { ...raw, id: undefined, createdAt: undefined },
  ]);
  assert.deepEqual(
    restored.map((meal) => meal.id),
    ["breakfast", "breakfast:2", "saved-food-meal:2"],
  );
  assert.equal(restored[2].createdAt, null);
  assert.equal("date" in restored[0].items[0], false);
  assert.deepEqual(
    normalizeSavedFoodMeals(JSON.parse(JSON.stringify(restored))),
    restored,
  );
  assert.deepEqual(normalizeSavedFoodMeals(undefined), []);
  assert.deepEqual(normalizeSavedFoodMeals({}), []);
});

test("corrupt saved meals are rejected atomically rather than silently losing a component", () => {
  const valid = save();
  const corrupt = [
    null,
    { ...valid, name: " " },
    { ...valid, name: "x".repeat(81) },
    { ...valid, items: [] },
    { ...valid, items: [food, null] },
    { ...valid, items: [food, { ...food, fat: "" }] },
    { ...valid, items: [{ ...food, servings: -1 }] },
    { ...valid, createdAt: "2026-02-30T12:00:00Z" },
  ];
  assert.deepEqual(normalizeSavedFoodMeals(corrupt), []);
  assert.equal(foodMealItems([food, { ...food, calories: Infinity }]), null);
});

test("genuine zero-nutrient items and unknown historical dates remain usable explicitly", () => {
  const water = {
    label: "Water",
    servingLabel: "250 ml",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    date: null,
  };
  const meal = save({
    name: "  Water break  ",
    items: [water],
    createdAt: null,
  });
  assert.equal(meal.name, "Water break");
  const batch = instantiateFoodMeal(meal.items, {
    batchId: "water",
    date: "2026-09-03",
    recordedAt: null,
  });
  assert.equal(batch[0].calories, 0);
  assert.equal(batch[0].date, "2026-09-03");
  assert.equal(batch[0].recordedAt, null);
});

test("restore retains more than 24 foods and meals, with exact stored serving bases", () => {
  const items = Array.from({ length: 30 }, (_, index) =>
    diaryEntry(String(index), 0.5),
  );
  const meal = save({ items });
  const restored = normalizeSavedFoodMeals(
    Array.from({ length: 30 }, (_, index) => ({
      ...meal,
      id: `meal-${index}`,
    })),
  );
  assert.equal(restored.length, 30);
  assert.equal(restored[0].items.length, 30);
  assert.equal(restored[0].items[29].baseNutrients.calories, 265);
  assert.equal(restored[0].items[29].calories, 132.5);
});

test("undo meal deletion preserves a newly created same-name meal and labels the restored copy", () => {
  const removed = save({ items: [diaryEntry("old", 0.5)] });
  const newer = save({
    id: "new-breakfast",
    name: "  BREAKFAST  ",
    items: [diaryEntry("new", 2)],
  });
  const alreadyRestored = save({
    id: "prior-restore",
    name: "Breakfast (restored)",
  });
  const current = [newer, alreadyRestored];
  const before = JSON.stringify(current);
  const result = restoreSavedFoodMeal(current, removed);
  assert.equal(result[0].name, "Breakfast (restored 2)");
  assert.equal(result[0].items[0].calories, 132.5);
  assert.equal(result[1], newer);
  assert.equal(result[1].items[0].calories, 530);
  assert.equal(JSON.stringify(current), before);
  assert.equal(removed.name, "Breakfast");
});

test("restore resolves identity collisions and respects the stored meal name limit", () => {
  const removed = save({ name: "x".repeat(80) });
  const current = [removed, { ...removed, id: `${removed.id}:restored:1` }];
  const result = restoreSavedFoodMeal(current, removed);
  assert.equal(result[0].id, "breakfast:restored:2");
  assert.equal(result[0].name.length, 80);
  assert.ok(result[0].name.endsWith(" (restored)"));
  assert.equal(result.length, 3);
  assert.equal(normalizeSavedFoodMeals(result).length, 3);
});

test("undo batch logging removes edited batch members but preserves original and unrelated foods", () => {
  const original = diaryEntry("original", 0.5);
  const unrelated = diaryEntry("unrelated", 1.5);
  const batch = instantiateFoodMeal([original, original], {
    batchId: "batch",
    date: "2026-09-03",
    recordedAt: at,
  });
  const edited = resizeFoodDiaryEntry(batch[0], 2);
  const current = [edited, batch[1], original, unrelated];
  const before = JSON.stringify(current);
  const result = undoFoodDiaryBatch(
    current,
    batch.map((entry) => entry.id),
  );
  assert.deepEqual(result, [original, unrelated]);
  assert.equal(result[0], original);
  assert.equal(original.calories, 132.5);
  assert.equal(JSON.stringify(current), before);
  assert.deepEqual(
    undoFoodDiaryBatch(
      [original],
      batch.map((entry) => entry.id),
    ),
    [original],
  );
});
