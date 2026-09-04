import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { createSavedFoodMeal, createSavedFoodRecipe } from "../src/app/food_meals.ts";

let server;
let MealRecipeBuilder;
let SavedMealsPanel;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: "custom", logLevel: "error" });
  ({ MealRecipeBuilder } = await server.ssrLoadModule("/src/app/components/MealRecipeBuilder.tsx"));
  ({ SavedMealsPanel } = await server.ssrLoadModule("/src/components/nutrition/SavedMealsPanel.tsx"));
});
after(async () => { await server?.close(); });
const foods = [
  { label: "Oats", servingLabel: "100 g dry", servingGrams: 100, calories: 380, protein: 13, carbs: 68, fat: 7 },
  { label: "Milk", servingLabel: "250 ml", servingGrams: 250, calories: 150, protein: 9, carbs: 12, fat: 8 },
];
const render = props => renderToStaticMarkup(React.createElement(MealRecipeBuilder, { foodOptions: foods, onSave: () => {}, ...props }));

test("recipe editor starts without diary data and never saves or logs during render", () => {
  let saves = 0;
  const html = render({ onSave: () => { saves++; } });
  assert.match(html, /Build a meal \/ recipe/);
  assert.match(html, /Saving never adds food to your diary/);
  assert.match(html, /Search recipe ingredients/);
  assert.match(html, /Add Oats to recipe/);
  assert.match(html, /Save recipe/);
  assert.doesNotMatch(html, /Log meal|Log recipe|Log food/);
  assert.equal(saves, 0);
});

test("existing cooked-yield recipe renders editable batch ingredients and the correct default portion", () => {
  const meal = createSavedFoodRecipe({ id: "recipe", name: "Porridge", ingredients: foods,
    yieldAmount: 800, yieldUnit: "cooked-grams", portionAmount: 200, createdAt: null });
  const html = render({ initialMeal: meal, existingMeals: [meal] });
  assert.match(html, /Edit meal \/ recipe/);
  assert.match(html, /value="800"/);
  assert.match(html, /value="200"/);
  assert.match(html, /132.5 kcal/);
  assert.match(html, /530 kcal/);
  assert.match(html, /Oats ingredient 1 amount/);
  assert.match(html, /Milk ingredient 2 amount/);
  assert.match(html, /Save recipe changes/);
  // The provider's servingGrams=250 cannot turn a 250 ml label into a gram-based measure.
  assert.equal((html.match(/<option value="grams">/g) ?? []).length, 1);
});

test("an older saved combination can enter the recipe editor without changing its original portions", () => {
  const meal = createSavedFoodMeal({ id: "old", name: "Breakfast", items: foods, createdAt: null });
  const before = JSON.stringify(meal);
  const html = render({ initialMeal: meal });
  assert.match(html, /530 kcal/);
  assert.match(html, /Default saved portion/);
  assert.match(html, /servings/);
  assert.equal(JSON.stringify(meal), before);
  assert.equal(meal.recipe, undefined);
});

test("saved recipe panel shows its explicit yield, default portion and selected nutrition without logging", () => {
  const meal = createSavedFoodRecipe({ id: "recipe", name: "Porridge", ingredients: foods,
    yieldAmount: 800, yieldUnit: "cooked-grams", portionAmount: 200, createdAt: null });
  let logs = 0;
  const html = renderToStaticMarkup(React.createElement(SavedMealsPanel, {
    meals: [meal], selectedDate: "2026-09-02", today: "2026-09-03", onLog: () => { logs++; },
    onDelete: () => {}, onRestore: () => {}, onEdit: () => {},
  }));
  assert.match(html, /Batch yield: 800 cooked g/);
  assert.match(html, /Default portion: 200 cooked g/);
  assert.match(html, /132.5 kcal/);
  assert.match(html, /Log 200 cooked g for 2026-09-02/);
  assert.match(html, /Edit saved meal Porridge/);
  assert.match(html, /Portion for saved meal Porridge/);
  assert.equal(logs, 0);
});

test("legacy saved meals retain one complete combination as the default and optional editing stays optional", () => {
  const meal = createSavedFoodMeal({ id: "old", name: "Breakfast", items: foods, createdAt: null });
  const before = JSON.stringify(meal);
  const html = renderToStaticMarkup(React.createElement(SavedMealsPanel, {
    meals: [meal], selectedDate: "2026-09-03", today: "2026-09-03", onLog: () => {},
    onDelete: () => {}, onRestore: () => {},
  }));
  assert.match(html, /530 kcal/);
  assert.match(html, /Log 1 saved portions for today/);
  assert.doesNotMatch(html, /Edit saved meal|Batch yield:/);
  assert.equal(JSON.stringify(meal), before);
});
