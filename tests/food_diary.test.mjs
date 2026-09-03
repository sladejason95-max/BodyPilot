import assert from "node:assert/strict";
import test from "node:test";
import {
  createFoodDiaryEntry,
  foodDiaryDateKey,
  foodDiaryTotals,
  foodServingMassGrams,
  normalizeFoodDiary,
  recentFoodDiaryEntries,
  resizeFoodDiaryEntry,
} from "../src/app/food_diary.ts";

const day = "2026-09-03";
const recordedAt = "2026-09-03T15:30:00.000Z";
const food = {
  label: "Oats",
  servingLabel: "70 g dry",
  calories: 265,
  protein: 9,
  carbs: 46,
  fat: 5,
  nutrients: {
    calories: 265,
    protein: 9,
    carbs: 46,
    fat: 5,
    fiber: 7,
    sodiumMg: 3,
  },
  foodId: "oats",
  source: "core",
  servingGrams: 70,
};
const create = (base = food, options = {}) =>
  createFoodDiaryEntry(base, {
    id: "entry",
    date: day,
    recordedAt,
    ...options,
  });

test("serving mass requires an explicit gram label matching the provider's basis", () => {
  assert.equal(foodServingMassGrams("170 g cooked", 170), 170);
  assert.equal(foodServingMassGrams("1 cup (85g)", 85), 85);
  assert.equal(foodServingMassGrams("1 bar (28.5 grams)", 28.5), 28.5);
  assert.equal(foodServingMassGrams("1 gram", 1), 1);
  assert.equal(foodServingMassGrams("0.5 G", 0.5), 0.5);
  assert.equal(foodServingMassGrams(".5 grams"), 0.5);
  assert.equal(foodServingMassGrams("100 g"), 100);
  assert.equal(foodServingMassGrams("0.3 g", 0.1 + 0.2), 0.3);
});

test("serving mass rejects volume, ambiguous or fallback bases and invalid values", () => {
  for (const [label, grams] of [
    ["250 ml", 250],
    ["1 cup (250ml)", 250],
    ["1 serving", 100],
    ["70 g dry", 100],
    ["85 g", 84.99],
    ["100 mg", 100],
    ["100 kg", 100],
    ["0 g", 0],
    ["-10 g", 10],
    ["10 g", Infinity],
    ["10 g", NaN],
    ["10 g", -10],
    ["10 g", 0],
    ["1,000 g", 1000],
    ["1 piece (30 g), serving 60 g", 60],
    ["1 serving", undefined],
    ["", 100],
    [null, 100],
    ["10 g", null],
  ])
    assert.equal(
      foodServingMassGrams(label, grams),
      null,
      `${label} / ${grams}`,
    );
});

test("new food entries require valid explicit dates, quantities and nutrients", () => {
  for (const invalid of [NaN, Infinity, -1, null, "", "10 kcal", true]) {
    assert.equal(create({ ...food, calories: invalid }), null);
  }
  for (const invalid of [NaN, Infinity, -1, 0, null, "", "one", false]) {
    assert.equal(create(food, { servings: invalid }), null);
  }
  for (const invalid of [
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-00-01",
    "2026-04-31",
    "",
    null,
  ]) {
    assert.equal(create(food, { date: invalid }), null);
  }
  assert.ok(create(food, { date: "2024-02-29" }));
  assert.equal(create(food, { recordedAt: "2026-02-30T12:00:00Z" }), null);
  assert.equal(create(food, { recordedAt: "2026-09-03" }), null);
  assert.equal(
    create({ ...food, nutrients: { ...food.nutrients, sodiumMg: NaN } }),
    null,
  );
  assert.equal(
    create(
      { ...food, calories: 1e308, nutrients: undefined },
      { servings: 10 },
    ),
    null,
  );
});

test("genuine zero nutrients are valid and unknown required macros are not zero-filled", () => {
  const water = create({
    label: "Water",
    servingLabel: "250 ml",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  assert.ok(water);
  assert.equal(water.calories, 0);
  assert.equal(create({ ...food, protein: undefined }), null);
  assert.equal(create({ ...food, label: "   " }), null);
});

test("quantity editing scales original nutrients and micros without mutating the original", () => {
  const original = create(food, { servings: 2 });
  assert.equal(original.calories, 530);
  assert.equal(original.nutrients.fiber, 14);
  assert.equal(original.baseNutrients.calories, 265);
  assert.ok(Object.isFrozen(original.baseNutrients));
  const half = resizeFoodDiaryEntry(original, 0.5);
  assert.equal(half.calories, 132.5);
  assert.equal(half.nutrients.sodiumMg, 1.5);
  assert.equal(half.baseNutrients.fiber, 7);
  assert.equal(original.servings, 2);
  assert.equal(original.nutrients.fiber, 14);
  const restored = resizeFoodDiaryEntry(
    resizeFoodDiaryEntry(original, 0.333333),
    1,
  );
  assert.deepEqual(restored.nutrients, food.nutrients);
  assert.equal(resizeFoodDiaryEntry(original, 0), null);
});

test("totals reflect actual dated entries, edit/delete/repeat and never clamp overages", () => {
  const first = create(food, { id: "first", servings: 10 });
  const previous = create(food, { id: "yesterday", date: "2026-09-02" });
  const legacy = normalizeFoodDiary([{ ...food, id: "legacy" }])[0];
  const repeated = create(first, { id: "repeat" });
  assert.equal(repeated.servings, 10);
  assert.equal(repeated.calories, 2650);
  assert.equal(
    foodDiaryTotals([first, previous, legacy, repeated], day).calories,
    5300,
  );
  const edited = resizeFoodDiaryEntry(first, 2);
  assert.equal(foodDiaryTotals([edited, repeated], day).calories, 3180);
  assert.equal(foodDiaryTotals([edited], day).calories, 530);
  assert.deepEqual(foodDiaryTotals([], day), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  assert.equal(foodDiaryTotals([legacy], null).calories, 0);
});

test("local calendar keys roll at local midnight and reject invalid dates", () => {
  assert.equal(
    foodDiaryDateKey(new Date(2026, 8, 3, 23, 59, 59)),
    "2026-09-03",
  );
  assert.equal(foodDiaryDateKey(new Date(2026, 8, 4, 0, 0, 0)), "2026-09-04");
  assert.throws(() => foodDiaryDateKey(new Date(NaN)), RangeError);
});

test("normalization preserves every legacy item without guessing dates or timestamps", () => {
  const legacy = Array.from({ length: 35 }, (_, index) => ({
    ...food,
    id: `old-food-${index}-${Date.parse(recordedAt)}`,
  }));
  const entries = normalizeFoodDiary(legacy);
  assert.equal(entries.length, 35);
  assert.ok(
    entries.every((entry) => entry.date === null && entry.recordedAt === null),
  );
  assert.equal(foodDiaryTotals(entries, day).calories, 0);
  assert.deepEqual(normalizeFoodDiary(entries), entries);
  assert.deepEqual(
    normalizeFoodDiary(JSON.parse(JSON.stringify(entries))),
    entries,
  );
  const preservedTime = normalizeFoodDiary([{ ...food, recordedAt }])[0];
  assert.equal(preservedTime.date, null);
  assert.equal(preservedTime.recordedAt, recordedAt);
});

test("normalization rejects invalid records, preserves duplicates with stable unique IDs, and accepts numeric JSON strings", () => {
  const normalized = normalizeFoodDiary([
    { ...food, id: "duplicate", calories: "265" },
    { ...food, id: "duplicate" },
    { ...food, id: "duplicate:2" },
    { ...food, date: "2026-02-30" },
    { ...food, calories: null },
    { ...food, servings: -2 },
    null,
  ]);
  assert.equal(normalized.length, 3);
  assert.equal(new Set(normalized.map((entry) => entry.id)).size, 3);
  assert.equal(normalized[0].calories, 265);
  assert.deepEqual(normalizeFoodDiary(normalized), normalized);
});

test("dated entries and scaled nutrient bases survive save/reload without double scaling", () => {
  const original = create(food, { servings: 1.5 });
  const restored = normalizeFoodDiary(
    JSON.parse(JSON.stringify([original])),
  )[0];
  assert.deepEqual(restored, original);
  assert.equal(resizeFoodDiaryEntry(restored, 2).calories, 530);
  assert.equal(
    create(restored, { id: "relog", date: "2026-09-04", servings: 0.5 })
      .calories,
    132.5,
  );
});

test("recents prefer latest food portions, deduplicate repeat amounts, and include undated history", () => {
  const older = create(food, { id: "old", date: "2026-09-02" });
  const newest = create(food, { id: "new", servings: 2 });
  const distinctPortion = create(
    { ...food, servingLabel: "100 g", servingGrams: 100 },
    { id: "different-portion" },
  );
  const legacy = normalizeFoodDiary([
    { ...food, id: "legacy", label: "Rice", foodId: "rice" },
  ])[0];
  const recent = recentFoodDiaryEntries([
    older,
    legacy,
    newest,
    distinctPortion,
  ]);
  assert.deepEqual(
    recent.map((entry) => entry.id),
    ["new", "different-portion", "legacy"],
  );
  assert.equal(recent[0].servings, 2);
  assert.equal(recent[2].date, null);
  assert.equal(recentFoodDiaryEntries([older, newest], 1).length, 1);
  assert.deepEqual(recentFoodDiaryEntries([newest], 0), []);
  assert.deepEqual(recentFoodDiaryEntries([newest], 0.5), []);
  assert.deepEqual(recentFoodDiaryEntries([newest], Infinity), []);
});

test("normalization preserves explicit date-only entries without inventing optional details", () => {
  const entries = normalizeFoodDiary([
    { ...food, date: day, recordedAt: undefined, nutrients: undefined },
  ]);
  assert.equal(entries[0].recordedAt, null);
  assert.equal(entries[0].date, day);
  assert.equal(entries[0].nutrients.sodiumMg, undefined);
  assert.deepEqual(normalizeFoodDiary(entries), entries);
  assert.deepEqual(normalizeFoodDiary(null), []);
  assert.deepEqual(normalizeFoodDiary({ foodLog: entries }), []);
});

test("recent fallback identities account for brand, serving and original macros", () => {
  const plain = { ...food, foodId: undefined, source: "custom" };
  const entries = [
    create(plain, { id: "one" }),
    create({ ...plain, label: " oats " }, { id: "same", servings: 2 }),
    create({ ...plain, brand: "Other" }, { id: "brand" }),
    create(
      { ...plain, calories: 300, nutrients: undefined },
      { id: "different-macros" },
    ),
    create({ ...plain, barcode: "123", foodId: "old-id" }, { id: "barcode" }),
    create(
      { ...plain, barcode: "123", foodId: "new-id" },
      { id: "same-barcode" },
    ),
  ];
  assert.equal(recentFoodDiaryEntries(entries, 20).length, 4);
});
