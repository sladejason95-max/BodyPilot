import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { foodServingMassGrams, type FoodDiaryFood } from "../food_diary";
import {
  createSavedFoodRecipe, foodMealItems, foodRecipeAmount,
  type FoodMealItem, type FoodRecipeYieldUnit, type SavedFoodMeal,
} from "../food_meals";

export type MealRecipeBuilderProps = {
  /** Food nutrition must describe its declared serving, with an original base when already resized. */
  foodOptions: readonly FoodDiaryFood[];
  onSearch?: (query: string, signal: AbortSignal) => Promise<readonly FoodDiaryFood[]>;
  existingMeals?: readonly SavedFoodMeal[];
  initialMeal?: SavedFoodMeal | null;
  /** Upsert by meal.id. This callback must not add diary entries. */
  onSave: (meal: SavedFoodMeal) => void | Promise<void>;
  onCancel?: () => void;
};

type IngredientDraft = { key: string; food: FoodMealItem; amount: string; unit: "servings" | "grams" };
const newId = () => `food-recipe:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const pretty = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
const nameKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const draftsFor = (meal?: SavedFoodMeal | null): IngredientDraft[] =>
  (foodMealItems(meal?.recipe?.ingredients ?? meal?.items) ?? []).map((food, index) => ({
    key: `saved-ingredient-${index}`, food, amount: String(food.servings), unit: "servings",
  }));
const readableFoods = (foods: readonly FoodDiaryFood[]): FoodMealItem[] =>
  foods.flatMap(food => foodMealItems([food]) ?? []);
const nutrientsFor = (foods: readonly FoodMealItem[]) => foods.reduce((sum, food) => ({
  calories: sum.calories + food.calories, protein: sum.protein + food.protein,
  carbs: sum.carbs + food.carbs, fat: sum.fat + food.fat,
}), { calories: 0, protein: 0, carbs: 0, fat: 0 });

/** A recipe draft is completely separate from food logging, including while editing an existing recipe. */
export function MealRecipeBuilder({ foodOptions, onSearch, existingMeals = [], initialMeal, onSave, onCancel }: MealRecipeBuilderProps) {
  const [draftId, setDraftId] = useState(() => initialMeal?.id ?? newId());
  const [name, setName] = useState(initialMeal?.name ?? "");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(() => draftsFor(initialMeal));
  const [yieldUnit, setYieldUnit] = useState<FoodRecipeYieldUnit>(initialMeal?.recipe?.yieldUnit ?? "servings");
  const [yieldAmount, setYieldAmount] = useState(String(initialMeal?.recipe?.yieldAmount ?? 1));
  const [portionAmount, setPortionAmount] = useState(String(initialMeal?.recipe?.portionAmount ?? 1));
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<FoodMealItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [notice, setNotice] = useState("");
  const searchRequest = useRef<AbortController | null>(null);
  const requestNumber = useRef(0);
  const ingredientNumber = useRef(0);

  useEffect(() => {
    setDraftId(initialMeal?.id ?? newId());
    setName(initialMeal?.name ?? "");
    setIngredients(draftsFor(initialMeal));
    setYieldUnit(initialMeal?.recipe?.yieldUnit ?? "servings");
    setYieldAmount(String(initialMeal?.recipe?.yieldAmount ?? 1));
    setPortionAmount(String(initialMeal?.recipe?.portionAmount ?? 1));
    setShowValidation(false);
    setNotice("");
  }, [initialMeal?.id]);
  useEffect(() => () => searchRequest.current?.abort(), []);

  const localFoods = useMemo(() => readableFoods(foodOptions), [foodOptions]);
  const localMatches = localFoods.filter(food =>
    `${food.label} ${food.brand ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const displayedFoods = (remoteResults ?? localMatches).slice(0, 12);
  const yieldValue = foodRecipeAmount(yieldAmount);
  const portionValue = foodRecipeAmount(portionAmount);
  const duplicateName = existingMeals.some(meal => meal.id !== draftId && nameKey(meal.name) === nameKey(name));
  const resolvedIngredients = useMemo((): FoodMealItem[] | null => {
    if (!ingredients.length) return null;
    const foods: FoodMealItem[] = [];
    for (const ingredient of ingredients) {
      const amount = foodRecipeAmount(ingredient.amount);
      const grams = foodServingMassGrams(ingredient.food.servingLabel, ingredient.food.servingGrams);
      if (amount === null || (ingredient.unit === "grams" && grams === null)) return null;
      const servings = ingredient.unit === "grams" ? amount / grams! : amount;
      const item = foodMealItems([{ ...ingredient.food, servings }])?.[0];
      if (!item) return null;
      foods.push(item);
    }
    return foods;
  }, [ingredients]);
  const preview = yieldValue !== null && portionValue !== null && resolvedIngredients
    ? createSavedFoodRecipe({ id: draftId, name: name.trim() || "Recipe preview", ingredients: resolvedIngredients,
      yieldAmount: yieldValue, yieldUnit, portionAmount: portionValue, createdAt: initialMeal?.createdAt ?? null })
    : null;
  const batchTotals = resolvedIngredients ? nutrientsFor(resolvedIngredients) : null;
  const portionTotals = preview ? nutrientsFor(preview.items) : null;
  const canSave = Boolean(name.trim() && name.trim().length <= 80 && !duplicateName && preview);
  const unitLabel = yieldUnit === "cooked-grams" ? "cooked g" : "servings";

  const changeQuery = (value: string) => {
    setQuery(value);
    setRemoteResults(null);
    setSearchError("");
    setSearching(false);
    searchRequest.current?.abort();
    requestNumber.current++;
  };
  const search = async () => {
    if (!onSearch || !query.trim()) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    const request = ++requestNumber.current;
    setSearching(true);
    setSearchError("");
    try {
      const foods = await onSearch(query.trim(), controller.signal);
      if (request === requestNumber.current && !controller.signal.aborted) setRemoteResults(readableFoods(foods));
    } catch {
      if (request === requestNumber.current && !controller.signal.aborted) setSearchError("Food search could not load. Try again or use an available food below.");
    } finally {
      if (request === requestNumber.current) setSearching(false);
    }
  };
  const addIngredient = (food: FoodMealItem) => {
    const snapshot = foodMealItems([{ ...food, servings: 1 }])?.[0];
    if (!snapshot) return;
    setIngredients(current => [...current, { key: `ingredient-${++ingredientNumber.current}`, food: snapshot, amount: "1", unit: "servings" }]);
    setNotice("");
  };
  const setIngredientUnit = (key: string, unit: IngredientDraft["unit"]) => setIngredients(current => current.map(item => {
    if (item.key !== key || item.unit === unit) return item;
    const grams = foodServingMassGrams(item.food.servingLabel, item.food.servingGrams);
    if (unit === "grams" && grams === null) return item;
    const value = foodRecipeAmount(item.amount);
    return { ...item, unit, amount: value === null ? "" : String(unit === "grams" ? value * grams! : value / grams!) };
  }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowValidation(true);
    setNotice("");
    if (saving || !canSave || !resolvedIngredients || yieldValue === null || portionValue === null) return;
    const meal = createSavedFoodRecipe({ id: draftId, name, ingredients: resolvedIngredients,
      yieldAmount: yieldValue, yieldUnit, portionAmount: portionValue,
      createdAt: initialMeal?.createdAt ?? new Date().toISOString() });
    if (!meal) return;
    setSaving(true);
    try {
      await onSave(meal);
      setNotice("Recipe added to saved meals. Nothing was logged; past food entries are unchanged.");
    } catch {
      setNotice("The recipe could not be saved. Your draft is still here; try again.");
    } finally { setSaving(false); }
  };

  return <Card><CardContent className="p-4">
    <form onSubmit={save} className="grid gap-4" aria-label={initialMeal ? "Edit meal recipe" : "Build meal recipe"}>
      <div>
        <h2 className="core-section-title">{initialMeal ? "Edit meal / recipe" : "Build a meal / recipe"}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add ingredients first, then set the finished yield. Saving never adds food to your diary.</p>
      </div>
      <fieldset disabled={saving} className="grid min-w-0 gap-4">
        <label className="grid gap-1 text-xs font-medium">Recipe name
          <Input value={name} maxLength={80} onChange={event => setName(event.target.value)} placeholder="Chicken rice bowls" aria-invalid={showValidation && (!name.trim() || duplicateName)} />
          {duplicateName ? <span role="alert" className="text-rose-300">A saved meal already has that name. Choose another name or edit that meal.</span> : null}
          {showValidation && !name.trim() ? <span className="text-rose-300">Enter a recipe name.</span> : null}
        </label>

        <section className="grid gap-2" aria-label="Find recipe ingredients">
          <div className="flex gap-2">
            <Input value={query} onChange={event => changeQuery(event.target.value)} placeholder="Search ingredients" aria-label="Search recipe ingredients"
              onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} />
            {onSearch ? <Button type="button" variant="outline" disabled={searching || !query.trim()} onClick={() => void search()} aria-label="Search food database for recipe">
              <Search className="h-4 w-4" aria-hidden="true" /><span className="ml-1">{searching ? "Searching" : "Search"}</span>
            </Button> : null}
          </div>
          {searchError ? <p role="alert" className="text-xs text-amber-200">{searchError}</p> : null}
          <ul className="max-h-64 overflow-y-auto divide-y divide-white/10 rounded-xl border border-white/10">
            {displayedFoods.map((food, index) => <li key={`${food.foodId ?? food.label}-${index}`} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm font-medium">{food.label}{food.brand ? ` · ${food.brand}` : ""}</div>
                <div className="text-xs text-slate-400">{food.servingLabel} · {pretty(food.baseNutrients.calories)} kcal{food.source ? ` · ${food.source}` : ""}</div>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => addIngredient(food)} aria-label={`Add ${food.label} to recipe`}><Plus className="h-4 w-4" aria-hidden="true" /> Add</Button>
            </li>)}
            {!displayedFoods.length ? <li className="p-3 text-sm text-slate-400">{searching ? "Searching foods…" : "No matching foods. Try another search."}</li> : null}
          </ul>
        </section>

        <section aria-label="Recipe ingredient amounts" className="grid gap-2">
          <h3 className="text-sm font-semibold">Batch ingredients · {ingredients.length}</h3>
          {ingredients.map((ingredient, index) => {
            const grams = foodServingMassGrams(ingredient.food.servingLabel, ingredient.food.servingGrams);
            const invalid = foodRecipeAmount(ingredient.amount) === null;
            return <div key={ingredient.key} className="grid gap-2 rounded-xl border border-white/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0"><div className="break-words text-sm font-medium">{ingredient.food.label}</div><div className="text-xs text-slate-400">1 serving = {ingredient.food.servingLabel}</div></div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove recipe ingredient ${index + 1}: ${ingredient.food.label}`} onClick={() => setIngredients(current => current.filter(item => item.key !== ingredient.key))}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs">Amount
                  <Input type="number" min="0.000001" step="any" inputMode="decimal" value={ingredient.amount} aria-label={`${ingredient.food.label} ingredient ${index + 1} amount`} aria-invalid={invalid}
                    onChange={event => setIngredients(current => current.map(item => item.key === ingredient.key ? { ...item, amount: event.target.value } : item))} />
                </label>
                <label className="grid gap-1 text-xs">Measure
                  <select className="premium-input px-2" value={ingredient.unit} aria-label={`${ingredient.food.label} ingredient ${index + 1} measure`} onChange={event => setIngredientUnit(ingredient.key, event.target.value as IngredientDraft["unit"])}>
                    <option value="servings">Servings</option>{grams !== null ? <option value="grams">Grams</option> : null}
                  </select>
                </label>
              </div>
              {invalid ? <p className="text-xs text-rose-300">Enter an ingredient amount greater than zero.</p> : null}
            </div>;
          })}
          {!ingredients.length ? <p className={`text-sm ${showValidation ? "text-rose-300" : "text-slate-400"}`}>Add at least one ingredient above.</p> : null}
        </section>

        <div className="grid gap-3 rounded-xl border border-white/10 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs">Finished yield
              <Input type="number" min="0.000001" step="any" inputMode="decimal" value={yieldAmount} aria-label="Recipe finished yield" aria-invalid={yieldValue === null} onChange={event => setYieldAmount(event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs">Yield measure
              <select className="premium-input px-2" value={yieldUnit} aria-label="Recipe yield measure" onChange={event => {
                setYieldUnit(event.target.value as FoodRecipeYieldUnit);
                setYieldAmount("");
                setPortionAmount(event.target.value === "cooked-grams" ? "100" : "1");
              }}><option value="servings">Servings</option><option value="cooked-grams">Cooked grams</option></select>
            </label>
          </div>
          {yieldValue === null ? <p className="text-xs text-rose-300">Enter a finished yield greater than zero.</p> : null}
          <p className="text-xs text-slate-400">{yieldUnit === "cooked-grams" ? "Weigh the entire finished batch. Cooking changes weight; the app does not guess it." : "Enter how many servings the entire batch makes."}</p>
          <label className="grid gap-1 text-xs">Default saved portion · {unitLabel}
            <Input type="number" min="0.000001" step="any" inputMode="decimal" value={portionAmount} aria-label="Recipe default portion" aria-invalid={portionValue === null} onChange={event => setPortionAmount(event.target.value)} />
          </label>
          {portionValue === null ? <p className="text-xs text-rose-300">Enter a portion greater than zero.</p> : null}
          {portionValue !== null && yieldValue !== null && portionValue > yieldValue ? <p className="text-xs text-amber-200">This portion is larger than one full batch. Check the yield and amount.</p> : null}
          <div className="border-t border-white/10 pt-3 text-sm tabular-nums">
            <div className="flex justify-between gap-2 text-slate-400"><span>Whole batch</span><span>{batchTotals ? `${pretty(batchTotals.calories)} kcal` : "—"}</span></div>
            <div className="mt-1 flex justify-between gap-2 font-semibold"><span>{portionValue ?? "—"} {unitLabel}</span><span>{portionTotals ? `${pretty(portionTotals.calories)} kcal` : "—"}</span></div>
            <div className="mt-1 text-xs text-slate-400">{portionTotals ? `${pretty(portionTotals.protein)} g protein · ${pretty(portionTotals.carbs)} g carbs · ${pretty(portionTotals.fat)} g fat` : "Complete every ingredient and yield to preview nutrition."}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : initialMeal ? "Save recipe changes" : "Save recipe"}</Button>
          {onCancel ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button> : null}
        </div>
      </fieldset>
      {showValidation && !canSave ? <p role="alert" className="text-sm text-rose-300">Check the recipe name, every ingredient amount, finished yield, and portion before saving.</p> : null}
      {notice ? <p role="status" className="text-sm text-slate-300">{notice}</p> : null}
    </form>
  </CardContent></Card>;
}
