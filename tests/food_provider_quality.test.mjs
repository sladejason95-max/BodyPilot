import assert from "node:assert/strict";
import test from "node:test";
import { prepareFoodProviderProduct } from "../src/app/food_provider_quality.ts";
import { normalizeOpenFoodFactsProduct } from "../src/app/food_engine.ts";
import { foodServingMassGrams } from "../src/app/food_diary.ts";

const macroNames = ["energy-kcal", "proteins", "carbohydrates", "fat"];
const product = () => ({
  code: "noodles-123",
  product_name: "Noodles",
  serving_size: "100 g",
  nutriments: {
    "energy-kcal_100g": 220,
    proteins_100g: 8,
    carbohydrates_100g: 36,
    fat_100g: 5,
    proteins_unit: "g",
    fiber_100g: 2,
  },
});

test("provider products missing any required macro are not treated as zero-calorie food", () => {
  for (const macro of macroNames) {
    const incomplete = product();
    delete incomplete.nutriments[`${macro}_100g`];
    assert.equal(prepareFoodProviderProduct(incomplete), null, macro);
  }
  assert.equal(prepareFoodProviderProduct({ product_name: "Noodles" }), null);
  assert.equal(prepareFoodProviderProduct({ nutriments: [] }), null);
  assert.equal(prepareFoodProviderProduct({ nutriments: null }), null);
  assert.equal(prepareFoodProviderProduct(null), null);
});

test("explicit zero macros and numeric strings remain valid, including water", () => {
  const water = { product_name: "Water", nutriments: {} };
  macroNames.forEach((macro, index) => {
    water.nutriments[`${macro}_100g`] = index % 2 ? "0" : 0;
  });
  const preparedWater = prepareFoodProviderProduct(water);
  assert.deepEqual(preparedWater.nutriments, water.nutriments);
  assert.equal(preparedWater.serving_size, "100 g");
  const numericStrings = product();
  numericStrings.nutriments["energy-kcal_100g"] = " 2.2e2 ";
  numericStrings.nutriments.proteins_100g = "8.0";
  assert.deepEqual(
    prepareFoodProviderProduct(numericStrings).nutriments,
    numericStrings.nutriments,
  );
});

test("null, blank, boolean, negative and nonfinite fields are unknown rather than zero", () => {
  const invalidValues = [
    undefined,
    null,
    "",
    " ",
    true,
    false,
    -1,
    "-1",
    NaN,
    Infinity,
    "NaN",
    "Infinity",
    "2 g",
    {},
    [],
    "0x10",
  ];
  for (const invalid of invalidValues) {
    for (const macro of macroNames) {
      const incomplete = product();
      incomplete.nutriments[`${macro}_100g`] = invalid;
      incomplete.nutriments[`${macro}_serving`] = invalid;
      assert.equal(
        prepareFoodProviderProduct(incomplete),
        null,
        `${macro}: ${String(invalid)}`,
      );
    }
  }
});

test("different valid serving and 100 g bases can coexist across required macros", () => {
  const mixed = product();
  mixed.nutriments.proteins_serving = "4";
  delete mixed.nutriments.proteins_100g;
  mixed.nutriments.fat_serving = 0;
  delete mixed.nutriments.fat_100g;
  const prepared = prepareFoodProviderProduct(mixed);
  assert.ok(prepared);
  assert.equal(prepared.nutriments.proteins_serving, "4");
  assert.equal(prepared.nutriments.fat_serving, 0);
  assert.equal(prepared.nutriments.carbohydrates_100g, 36);
});

test("invalid serving values are removed so valid 100 g fallback is not masked", () => {
  const input = product();
  input.nutriments["energy-kcal_serving"] = null;
  input.nutriments.proteins_serving = "";
  input.nutriments.carbohydrates_serving = false;
  input.nutriments.fat_serving = NaN;
  const prepared = prepareFoodProviderProduct(input);
  assert.ok(prepared);
  for (const macro of macroNames) {
    assert.equal(Object.hasOwn(prepared.nutriments, `${macro}_serving`), false);
    assert.equal(
      prepared.nutriments[`${macro}_100g`],
      input.nutriments[`${macro}_100g`],
    );
  }
});

test("invalid fallback values are removed while true serving zero stays intact", () => {
  const input = product();
  input.nutriments.fat_serving = 0;
  input.nutriments.fat_100g = null;
  const prepared = prepareFoodProviderProduct(input);
  assert.ok(prepared);
  assert.equal(prepared.nutriments.fat_serving, 0);
  assert.equal(Object.hasOwn(prepared.nutriments, "fat_100g"), false);
});

test("preparation clones without mutating input or altering unrelated values and units", () => {
  const input = product();
  input.nutriments.proteins_serving = null;
  input.nutriments.salt_100g = null;
  Object.freeze(input.nutriments);
  Object.freeze(input);
  const prepared = prepareFoodProviderProduct(input);
  assert.notEqual(prepared, input);
  assert.notEqual(prepared.nutriments, input.nutriments);
  assert.equal(input.nutriments.proteins_serving, null);
  assert.equal(prepared.nutriments.proteins_unit, "g");
  assert.equal(prepared.nutriments.fiber_100g, 2);
  assert.equal(prepared.nutriments.salt_100g, null);
  assert.equal(prepared.code, "noodles-123");
  assert.equal(prepared.serving_size, "100 g");
  assert.deepEqual(prepareFoodProviderProduct(prepared), prepared);
});

const servingProduct = (label) => ({
  code: "serving-only",
  product_name: "Serving food",
  ...(label === undefined ? {} : { serving_size: label }),
  nutriments: {
    "energy-kcal_serving": 180,
    proteins_serving: 12,
    carbohydrates_serving: 18,
    fat_serving: 7,
  },
});

test("unknown serving-only products cannot turn into invented 100 g portions", () => {
  for (const label of [
    undefined,
    "",
    "1 serving",
    "1 portion",
    "serving",
    "portion",
  ]) {
    const input = servingProduct(label);
    // Regression: the unguarded normalizer would invent a gram basis here.
    const unsafe = normalizeOpenFoodFactsProduct(input);
    if (!label)
      assert.equal(
        foodServingMassGrams(unsafe.servingLabel, unsafe.servingGrams),
        100,
      );
    assert.equal(prepareFoodProviderProduct(input), null, String(label));
    assert.equal(
      prepareFoodProviderProduct({ ...input, serving_quantity: 40 }),
      null,
    );
  }
});

test("complete genuine 100 g data replaces ambiguous serving data on a single known basis", () => {
  const input = {
    ...product(),
    serving_size: "1 serving",
    serving_quantity: 40,
  };
  input.nutriments["energy-kcal_serving"] = 88;
  input.nutriments.proteins_serving = 3.2;
  input.nutriments.fiber_serving = 0.8;
  const prepared = prepareFoodProviderProduct(input);
  assert.equal(prepared.serving_size, "100 g");
  assert.equal(prepared.serving_quantity, 100);
  assert.equal(
    Object.hasOwn(prepared.nutriments, "energy-kcal_serving"),
    false,
  );
  assert.equal(Object.hasOwn(prepared.nutriments, "fiber_serving"), false);
  const normalized = normalizeOpenFoodFactsProduct(prepared);
  assert.equal(normalized.nutrients.calories, 220);
  assert.equal(normalized.nutrients.protein, 8);
  assert.equal(normalized.nutrients.fiber, 2);
  assert.equal(
    foodServingMassGrams(normalized.servingLabel, normalized.servingGrams),
    100,
  );
  assert.equal(input.nutriments.fiber_serving, 0.8);
});

test("mixed macros with unknown conversion reject instead of adding unlike portion bases", () => {
  const input = servingProduct(undefined);
  delete input.nutriments.proteins_serving;
  input.nutriments.proteins_100g = 8;
  assert.equal(prepareFoodProviderProduct(input), null);
  input.serving_size = "1 bar";
  assert.equal(prepareFoodProviderProduct(input), null);
});

test("explicit mass permits safe mixed-basis conversion and rejects a conflicting quantity", () => {
  const input = servingProduct("1 bar (50 g)");
  delete input.nutriments.proteins_serving;
  input.nutriments.proteins_100g = 8;
  const prepared = prepareFoodProviderProduct(input);
  const normalized = normalizeOpenFoodFactsProduct(prepared);
  assert.equal(normalized.nutrients.calories, 180);
  assert.equal(normalized.nutrients.protein, 4);
  assert.equal(
    foodServingMassGrams(normalized.servingLabel, normalized.servingGrams),
    50,
  );
  assert.equal(
    prepareFoodProviderProduct({ ...input, serving_quantity: 100 }),
    null,
  );
});

test("count-only descriptors remain loggable as servings but never eligible for grams", () => {
  for (const label of ["1 bar", "2 cookies", "1/2 cup"]) {
    const input = servingProduct(label);
    input.nutriments.fiber_100g = 10;
    input.nutriments.fiber_serving = 2;
    const prepared = prepareFoodProviderProduct(input);
    assert.ok(prepared);
    assert.equal(prepared.serving_size, label);
    assert.equal(Object.hasOwn(prepared.nutriments, "fiber_100g"), false);
    const normalized = normalizeOpenFoodFactsProduct(prepared);
    assert.equal(normalized.nutrients.calories, 180);
    assert.equal(normalized.nutrients.fiber, 2);
    assert.equal(
      foodServingMassGrams(normalized.servingLabel, normalized.servingGrams),
      null,
    );
  }
});

test("liquid portions require complete serving data and never infer grams from ml", () => {
  const input = servingProduct("250 ml");
  input.serving_quantity = 250;
  input.nutriments.fiber_100g = 2;
  const prepared = prepareFoodProviderProduct(input);
  assert.ok(prepared);
  assert.equal(Object.hasOwn(prepared.nutriments, "fiber_100g"), false);
  const normalized = normalizeOpenFoodFactsProduct(prepared);
  assert.equal(normalized.servingLabel, "250 ml");
  assert.equal(normalized.nutrients.calories, 180);
  assert.equal(
    foodServingMassGrams(normalized.servingLabel, normalized.servingGrams),
    null,
  );
  const mixed = {
    ...input,
    nutriments: { ...input.nutriments, proteins_100g: 5 },
  };
  delete mixed.nutriments.proteins_serving;
  assert.equal(prepareFoodProviderProduct(mixed), null);
  assert.equal(
    prepareFoodProviderProduct({ ...product(), serving_size: "250 ml" }),
    null,
  );
  const labeledServing = prepareFoodProviderProduct(
    servingProduct("1 serving (250 ml)"),
  );
  assert.equal(labeledServing.serving_size, "1 serving (250 ml)");
  const normalizedServing = normalizeOpenFoodFactsProduct(labeledServing);
  assert.equal(
    foodServingMassGrams(
      normalizedServing.servingLabel,
      normalizedServing.servingGrams,
    ),
    null,
  );
});
