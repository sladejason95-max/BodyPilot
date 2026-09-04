import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { foodMealPortion, foodRecipeAmount, type FoodMealItem, type SavedFoodMeal } from "../../app/food_meals";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";

const amount = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
const portion = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(
    value,
  );

export function SavedMealsPanel({
  meals,
  selectedDate,
  today,
  onLog,
  onDelete,
  onRestore,
  onEdit,
}: {
  meals: SavedFoodMeal[];
  selectedDate: string;
  today: string;
  onLog: (meal: SavedFoodMeal, items?: FoodMealItem[]) => void;
  onDelete: (id: string) => void;
  onRestore: (meal: SavedFoodMeal) => void;
  onEdit?: (meal: SavedFoodMeal) => void;
}) {
  const [removed, setRemoved] = useState<SavedFoodMeal | null>(null);
  const [status, setStatus] = useState("");
  const [portionAmounts, setPortionAmounts] = useState<Record<string, string>>({});
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 sm:p-5">
        <div>
          <h2 className="font-semibold">Saved meals</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Choose a portion, preview its nutrition, then log it. Build a recipe
            without logging first, or save a combination from the diary.
          </p>
        </div>
        {meals.length ? (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {meals.map((meal) => {
              const selectedAmount = portionAmounts[meal.id] ?? String(meal.recipe?.portionAmount ?? 1);
              const selectedValue = foodRecipeAmount(selectedAmount);
              const selectedItems = selectedValue === null ? null : foodMealPortion(meal, selectedValue);
              const unitLabel = meal.recipe?.yieldUnit === "cooked-grams" ? "cooked g" : meal.recipe ? "servings" : "saved portions";
              const selectedTotals = selectedItems?.reduce((totals, item) => ({
                calories: totals.calories + item.calories, protein: totals.protein + item.protein,
                carbs: totals.carbs + item.carbs, fat: totals.fat + item.fat,
              }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
              return (
              <li key={meal.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-start gap-2">
                  <details className="min-w-0 flex-1">
                    <summary className="min-h-11 cursor-pointer break-words text-sm font-medium">
                      {meal.name}
                      <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                        {meal.items.length} foods ·{" "}
                        {selectedTotals ? `${amount(selectedTotals.calories)} kcal` : "Check portion"} · View ingredients
                      </span>
                    </summary>
                    <ul className="my-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {(selectedItems ?? []).map((item, index) => (
                        <li key={index} className="break-words">
                          <span className="font-medium">{item.label}</span>
                          {item.brand ? ` · ${item.brand}` : ""}
                          <span className="block text-slate-500 dark:text-slate-400">
                            {portion(item.servings)} × {item.servingLabel} ·{" "}
                            {amount(item.calories)} kcal
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="my-2 text-xs text-slate-500 dark:text-slate-400">
                      Logging creates new entries. Changing or deleting this
                      meal never changes past food logs.
                    </p>
                  </details>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="!h-11 !w-11 shrink-0"
                    aria-label={`Delete saved meal ${meal.name}`}
                    onClick={() => {
                      setRemoved(meal);
                      setStatus("");
                      onDelete(meal.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                {meal.recipe ? <p className="mt-1 text-xs text-slate-400">
                  Batch yield: {portion(meal.recipe.yieldAmount)} {unitLabel} · Default portion: {portion(meal.recipe.portionAmount)} {unitLabel}
                </p> : null}
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="grid min-w-0 flex-1 gap-1 text-xs text-slate-400">
                    Portion · {unitLabel}
                    <Input type="number" min="0" step="any" inputMode="decimal" value={selectedAmount}
                      aria-label={`Portion for saved meal ${meal.name}`} aria-invalid={!selectedItems}
                      onChange={event => setPortionAmounts(current => ({ ...current, [meal.id]: event.target.value }))} />
                  </label>
                  {onEdit ? <Button type="button" variant="ghost" className="min-h-11" onClick={() => onEdit(meal)} aria-label={`Edit saved meal ${meal.name}`}>Edit recipe</Button> : null}
                </div>
                {selectedTotals ? <p className="mt-2 text-xs tabular-nums text-slate-300">
                  {amount(selectedTotals.protein)} g protein · {amount(selectedTotals.carbs)} g carbs · {amount(selectedTotals.fat)} g fat
                </p> : <p role="alert" className="mt-2 text-xs text-rose-300">Enter a valid portion greater than zero before logging.</p>}
                <Button
                  variant="outline"
                  className="mt-2 min-h-11 !h-auto w-full whitespace-normal py-2"
                  aria-label={`Log saved meal ${meal.name} for ${selectedDate === today ? "today" : selectedDate}`}
                  disabled={!selectedItems}
                  onClick={() => { if (selectedItems) onLog(meal, selectedItems); }}
                >
                  Log {selectedValue === null ? "portion" : `${portion(selectedValue)} ${unitLabel}`} for{" "}
                  {selectedDate === today ? "today" : selectedDate}
                </Button>
              </li>
            );})}
          </ul>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your regular meals will appear here. Saving a meal does not log it
            again.
          </p>
        )}
        {removed ? (
          <div
            role="status"
            className="flex min-w-0 items-center justify-between gap-2 text-xs"
          >
            <span className="min-w-0 break-words">
              Removed {removed.name}. Past logs are unchanged.
            </span>
            <Button
              variant="ghost"
              className="min-h-11 shrink-0 gap-1"
              aria-label={`Undo deletion of saved meal ${removed.name}`}
              onClick={() => {
                onRestore(removed);
                setRemoved(null);
                setStatus(
                  "Saved meal restored. Existing meals and diary entries are unchanged; a conflicting name is labeled as a restored copy.",
                );
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Undo
            </Button>
          </div>
        ) : null}
        {status ? (
          <p
            role="status"
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            {status}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
