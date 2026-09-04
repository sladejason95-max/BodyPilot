import assert from "node:assert/strict";
import test from "node:test";
import {
  createSavedFoodMeal, createSavedFoodRecipe, foodMealPortion, foodRecipeAmount,
  instantiateFoodMeal, normalizeSavedFoodMeals, restoreSavedFoodMeal,
} from "../src/app/food_meals.ts";

const at = "2026-09-03T15:30:00.000Z";
const ingredients = () => [
  { label: "Oats", servingLabel: "100 g dry", servingGrams: 100, servings: 2,
    calories: 760, protein: 26, carbs: 136, fat: 14,
    baseNutrients: { calories: 380, protein: 13, carbs: 68, fat: 7, fiber: 10 }, source: "core", foodId: "oats" },
  { label: "Milk", servingLabel: "250 ml", servings: 2,
    calories: 300, protein: 18, carbs: 24, fat: 16,
    baseNutrients: { calories: 150, protein: 9, carbs: 12, fat: 8, calciumMg: 300 }, source: "label", foodId: "milk" },
];
const make = (overrides = {}) => createSavedFoodRecipe({ id: "porridge", name: "Porridge",
  ingredients: ingredients(), yieldAmount: 4, yieldUnit: "servings", portionAmount: 1, createdAt: at, ...overrides });
const totals = items => items.reduce((sum, item) => sum + item.calories, 0);

test("a recipe can be saved without creating dated food logs", () => {
  const source = ingredients();
  const before = JSON.stringify(source);
  const meal = make({ ingredients: source });
  assert.ok(meal);
  assert.equal(meal.recipe.ingredients.length, 2);
  assert.equal(totals(meal.recipe.ingredients), 1060);
  assert.equal(totals(meal.items), 265);
  assert.equal(meal.recipe.yieldAmount, 4);
  assert.equal(meal.recipe.portionAmount, 1);
  assert.equal(JSON.stringify(source), before);
  for (const item of [...meal.items, ...meal.recipe.ingredients]) {
    assert.equal("date" in item, false);
    assert.equal("id" in item, false);
    assert.equal("recordedAt" in item, false);
  }
});

test("serving yield scales each original ingredient and preserves its nutrient/provenance basis", () => {
  const meal = make();
  const portion = foodMealPortion(meal, 1.5);
  assert.equal(totals(portion), 397.5);
  assert.equal(portion[0].servings, 0.75);
  assert.equal(portion[0].nutrients.fiber, 7.5);
  assert.equal(portion[1].nutrients.calciumMg, 225);
  assert.equal(portion[0].baseNutrients.calories, 380);
  assert.equal(portion[0].source, "core");
  assert.equal(portion[0].foodId, "oats");
  assert.equal(totals(meal.items), 265);
});

test("cooked yield is explicit and scales grams without guessing water loss or ingredient mass", () => {
  const meal = make({ yieldAmount: 800, yieldUnit: "cooked-grams", portionAmount: 200 });
  assert.equal(totals(meal.items), 265);
  assert.equal(totals(foodMealPortion(meal, 100)), 132.5);
  assert.equal(totals(foodMealPortion(meal, 800)), 1060);
  assert.equal(meal.recipe.ingredients[1].servingLabel, "250 ml");
  assert.equal(meal.recipe.ingredients[1].servingGrams, undefined);
});

test("changing yield or ingredients never changes previous recipe instances or already logged foods", () => {
  const oldMeal = make();
  const logged = instantiateFoodMeal(foodMealPortion(oldMeal, 2), { batchId: "lunch", date: "2026-09-03", recordedAt: at });
  const oldJson = JSON.stringify(oldMeal);
  const logJson = JSON.stringify(logged);
  const edited = make({ yieldAmount: 8 });
  assert.equal(totals(edited.items), 132.5);
  assert.equal(JSON.stringify(oldMeal), oldJson);
  assert.equal(JSON.stringify(logged), logJson);
  assert.equal(totals(logged), 530);
  assert.notEqual(edited.recipe.ingredients[0], oldMeal.recipe.ingredients[0]);
  assert.ok(Object.isFrozen(edited.recipe));
  assert.ok(Object.isFrozen(edited.recipe.ingredients));
  assert.ok(Object.isFrozen(edited.recipe.ingredients[0]));
  assert.ok(Object.isFrozen(edited.recipe.ingredients[0].baseNutrients));
});

test("invalid, blank, zero, negative and nonfinite amounts are rejected", () => {
  for (const value of ["", " ", "0", "-1", "NaN", "Infinity", "2g", null, undefined, 0, -1, Infinity, NaN]) {
    assert.equal(foodRecipeAmount(value), null, String(value));
    assert.equal(make({ yieldAmount: value }), null, `yield ${String(value)}`);
    assert.equal(make({ portionAmount: value }), null, `portion ${String(value)}`);
    assert.equal(foodMealPortion(make(), value), null, `log ${String(value)}`);
  }
  assert.equal(foodRecipeAmount(" 1.25 "), 1.25);
  assert.equal(foodRecipeAmount(".5"), 0.5);
  assert.equal(make({ yieldUnit: "grams" }), null);
});

test("blank names, empty recipes, bad ingredients and overflow fail atomically", () => {
  assert.equal(make({ name: " " }), null);
  assert.equal(make({ name: "x".repeat(81) }), null);
  assert.equal(make({ ingredients: [] }), null);
  assert.equal(make({ ingredients: [ingredients()[0], { ...ingredients()[1], protein: "" }] }), null);
  assert.equal(make({ ingredients: [{ ...ingredients()[0], servings: 0 }] }), null);
  assert.equal(make({ portionAmount: Number.MAX_VALUE }), null);
  assert.equal(make({ yieldAmount: Number.MIN_VALUE }), null);
});

test("recipe round trips retain authoritative batch ingredients and default portions", () => {
  const meal = make({ yieldAmount: 800, yieldUnit: "cooked-grams", portionAmount: 150 });
  const restored = normalizeSavedFoodMeals(JSON.parse(JSON.stringify([meal])));
  assert.deepEqual(restored, [meal]);
  assert.equal(totals(restored[0].items), 198.75);
  assert.equal(totals(restored[0].recipe.ingredients), 1060);
  assert.equal(restored[0].recipe.yieldUnit, "cooked-grams");
});

test("corrupt recipe metadata is rejected instead of silently converting into an ordinary meal", () => {
  const meal = make();
  for (const recipe of [null, {}, { ...meal.recipe, version: 2 }, { ...meal.recipe, yieldAmount: 0 },
    { ...meal.recipe, ingredients: [null] }, { ...meal.recipe, portionAmount: "" }]) {
    assert.deepEqual(normalizeSavedFoodMeals([{ ...meal, recipe }]), []);
  }
});

test("older saved meals retain exact portions and allow an explicit saved-meal multiplier", () => {
  const old = createSavedFoodMeal({ id: "old", name: "Original combination", items: ingredients(), createdAt: null });
  const saved = normalizeSavedFoodMeals([old])[0];
  assert.equal(saved.recipe, undefined);
  assert.deepEqual(saved.items, old.items);
  assert.equal(totals(foodMealPortion(saved, 1)), 1060);
  assert.equal(totals(foodMealPortion(saved, 0.5)), 530);
  assert.equal(totals(saved.items), 1060);
});

test("restoring a deleted recipe retains yield metadata and does not overwrite a newer recipe", () => {
  const original = make();
  const newer = make({ portionAmount: 2 });
  const restored = restoreSavedFoodMeal([newer], original);
  assert.equal(restored[0].name, "Porridge (restored)");
  assert.equal(restored[0].recipe.portionAmount, 1);
  assert.equal(restored[1], newer);
  assert.equal(totals(restored[1].items), 530);
});
