import { useEffect, useId, useState } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";

import {
  type FoodDiaryEntry,
  foodDiaryTotals,
  recentFoodDiaryEntries,
} from "../../app/food_diary";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";

type FoodTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodDiaryPanelProps = {
  entries: FoodDiaryEntry[];
  selectedDate: string;
  today: string;
  onDateChange: (date: string) => void;
  onResize: (id: string, servings: number) => void;
  onDelete: (id: string) => void;
  onRestore: (entry: FoodDiaryEntry) => void;
  onRepeat: (entry: FoodDiaryEntry) => void;
  onSaveMeal: (name: string, entries: FoodDiaryEntry[]) => boolean;
  onCopyEntries: (entries: FoodDiaryEntry[], targetDate: string) => boolean;
  legacyTotals?: FoodTotals;
};

const actionClass = "!min-h-11 !h-auto shrink-0";
const numberText = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
const servingNumberText = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(
    value,
  );
const portionText = (entry: FoodDiaryEntry) =>
  `${servingNumberText(entry.servings)} × ${entry.servingLabel}`;

function MacroSummary({ totals }: { totals: FoodTotals }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-slate-600 dark:text-slate-300">
      <span>{numberText(totals.calories)} kcal</span>
      <span>{numberText(totals.protein)} g protein</span>
      <span>{numberText(totals.carbs)} g carbs</span>
      <span>{numberText(totals.fat)} g fat</span>
    </div>
  );
}

export function FoodDiaryPanel({
  entries,
  selectedDate,
  today,
  onDateChange,
  onResize,
  onDelete,
  onRestore,
  onRepeat,
  onSaveMeal,
  onCopyEntries,
  legacyTotals,
}: FoodDiaryPanelProps) {
  const panelId = useId();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [removedEntries, setRemovedEntries] = useState<FoodDiaryEntry[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mealName, setMealName] = useState("");
  const [copyDate, setCopyDate] = useState(today);
  const [selectionError, setSelectionError] = useState("");
  const dayEntries = entries.filter((entry) => entry.date === selectedDate);
  const selectedEntries = dayEntries.filter((entry) =>
    selectedIds.includes(entry.id),
  );
  const totals = foodDiaryTotals(entries, selectedDate);
  const recentEntries = recentFoodDiaryEntries(entries);
  const lastRemoved = removedEntries[removedEntries.length - 1];
  const undatedEntries = entries.filter((entry) => entry.date === null);
  const hasLegacyTotals =
    legacyTotals && Object.values(legacyTotals).some((value) => value > 0);
  const dateLabel =
    selectedDate === today
      ? "today"
      : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  useEffect(() => {
    setEditingId(null);
    setError("");
    setStatus("");
    setSelecting(false);
    setSelectedIds([]);
    setMealName("");
    setSelectionError("");
  }, [selectedDate]);

  useEffect(() => {
    if (editingId && !entries.some((entry) => entry.id === editingId)) {
      setEditingId(null);
      setError("");
    }
  }, [entries, editingId]);

  const closeEditor = (id: string) => {
    setEditingId(null);
    setError("");
    document.getElementById(`${panelId}-edit-button-${id}`)?.focus();
  };

  return (
    <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
      <section aria-labelledby={`${panelId}-title`} className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={`${panelId}-title`}
              className="text-base font-semibold text-slate-950 dark:text-white"
            >
              Food diary
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              What you logged, not your meal plan.
            </p>
          </div>
          <div className="w-full min-w-0 sm:w-44">
            <label
              htmlFor={`${panelId}-date`}
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Diary date
            </label>
            <Input
              id={`${panelId}-date`}
              type="date"
              max={today}
              value={selectedDate}
              className="!h-11 min-w-0 max-w-full"
              onInput={(event) => {
                const nextDate = event.currentTarget.value;
                if (/^\d{4}-\d{2}-\d{2}$/.test(nextDate) && nextDate <= today)
                  onDateChange(nextDate);
              }}
              onChange={(event) => {
                const nextDate = event.target.value;
                if (/^\d{4}-\d{2}-\d{2}$/.test(nextDate) && nextDate <= today)
                  onDateChange(nextDate);
              }}
            />
          </div>
        </div>

        <div className="my-3 border-y border-slate-200 py-3 dark:border-white/10">
          <div className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            Logged for {dateLabel}
          </div>
          <MacroSummary totals={totals} />
        </div>

        {dayEntries.length ? (
          <div className="mb-3">
            <Button
              variant="outline"
              className={actionClass}
              aria-expanded={selecting}
              onClick={() => {
                setSelecting(!selecting);
                setSelectedIds(
                  selecting ? [] : dayEntries.map((entry) => entry.id),
                );
                setEditingId(null);
                setMealName("");
                setCopyDate(today);
                setError("");
                setSelectionError("");
              }}
            >
              {selecting ? "Cancel selection" : "Select / copy foods"}
            </Button>
            {selecting ? (
              <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0"
                    checked={selectedEntries.length === dayEntries.length}
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked
                          ? dayEntries.map((entry) => entry.id)
                          : [],
                      )
                    }
                  />
                  Select all {dayEntries.length} foods from {dateLabel}
                </label>
                <div>
                  <p className="mb-1 text-xs font-medium">
                    {selectedEntries.length} foods selected · exact logged
                    portions
                  </p>
                  <MacroSummary
                    totals={foodDiaryTotals(selectedEntries, selectedDate)}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Uncheck foods below to build a smaller meal.
                  </p>
                </div>
                <form
                  className="grid gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!selectedEntries.length || !mealName.trim()) return;
                    if (onSaveMeal(mealName, selectedEntries)) {
                      setStatus(
                        `Saved ${mealName.trim()}. No additional food was logged.`,
                      );
                      setSelecting(false);
                      setSelectedIds([]);
                      setMealName("");
                      setSelectionError("");
                    } else {
                      setSelectionError(
                        "Meal not saved. Use a unique name and check the selected portions.",
                      );
                    }
                  }}
                >
                  <label className="text-xs">
                    Saved meal name
                    <Input
                      aria-label="Saved meal name"
                      value={mealName}
                      maxLength={80}
                      placeholder="e.g. Usual breakfast"
                      onChange={(event) => {
                        setMealName(event.target.value);
                        setSelectionError("");
                      }}
                      className="mt-1 !h-11"
                    />
                  </label>
                  <Button
                    type="submit"
                    variant="outline"
                    className={actionClass}
                    disabled={!selectedEntries.length || !mealName.trim()}
                  >
                    Save selected as meal
                  </Button>
                </form>
                <form
                  className="grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (
                      !selectedEntries.length ||
                      !copyDate ||
                      copyDate > today
                    )
                      return;
                    if (onCopyEntries(selectedEntries, copyDate)) {
                      setStatus(
                        `Copied ${selectedEntries.length} foods to ${copyDate}. Original entries are unchanged.`,
                      );
                      setSelecting(false);
                      setSelectedIds([]);
                      setSelectionError("");
                    } else {
                      setSelectionError(
                        "Nothing was copied. Check every portion and choose a valid date.",
                      );
                    }
                  }}
                >
                  <label className="text-xs">
                    Copy to date
                    <Input
                      aria-label="Copy foods to date"
                      type="date"
                      max={today}
                      value={copyDate}
                      onInput={(event) =>
                        setCopyDate(event.currentTarget.value)
                      }
                      onChange={(event) => setCopyDate(event.target.value)}
                      className="mt-1 !h-11 min-w-0 max-w-full"
                      required
                    />
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adds new entries to that day; never replaces existing food.
                  </p>
                  <Button
                    type="submit"
                    className={`${actionClass} whitespace-normal py-2`}
                    disabled={
                      !selectedEntries.length || !copyDate || copyDate > today
                    }
                  >
                    Copy {selectedEntries.length} foods to{" "}
                    {copyDate || "chosen date"}
                  </Button>
                </form>
                {selectionError ? (
                  <p
                    role="alert"
                    className="text-xs text-rose-700 dark:text-rose-300"
                  >
                    {selectionError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {dayEntries.length ? (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {dayEntries.map((entry) => (
              <li key={entry.id} className="min-w-0 py-3 first:pt-0">
                <div className="flex min-w-0 items-start gap-2">
                  {selecting ? (
                    <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        aria-label={`Select ${entry.label}, ${portionText(entry)}`}
                        checked={selectedIds.includes(entry.id)}
                        onChange={(event) =>
                          setSelectedIds((current) =>
                            event.target.checked
                              ? [...current, entry.id]
                              : current.filter((id) => id !== entry.id),
                          )
                        }
                      />
                    </label>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-sm font-medium text-slate-950 dark:text-white">
                      {entry.label}
                    </div>
                    {entry.brand ? (
                      <div className="break-words text-xs text-slate-500 dark:text-slate-400">
                        {entry.brand}
                      </div>
                    ) : null}
                    <div className="mb-1 mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                      {portionText(entry)}
                    </div>
                    <MacroSummary totals={entry} />
                  </div>
                  <div
                    className={`shrink-0 gap-1 ${selecting ? "hidden" : "flex"}`}
                  >
                    <Button
                      id={`${panelId}-edit-button-${entry.id}`}
                      variant="ghost"
                      size="icon"
                      className={`${actionClass} !min-w-11`}
                      aria-label={`Edit portion for ${entry.label}`}
                      aria-expanded={editingId === entry.id}
                      aria-controls={
                        editingId === entry.id
                          ? `${panelId}-edit-${entry.id}`
                          : undefined
                      }
                      onClick={() => {
                        setEditingId(entry.id);
                        setQuantity(String(entry.servings));
                        setError("");
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${actionClass} !min-w-11`}
                      aria-label={`Delete ${entry.label} from ${dateLabel}`}
                      onClick={() => {
                        setRemovedEntries((current) => [...current, entry]);
                        onDelete(entry.id);
                        setStatus(
                          `${entry.label} removed. Undo is available below the diary.`,
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {editingId === entry.id ? (
                  <form
                    id={`${panelId}-edit-${entry.id}`}
                    className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      const servings = Number(quantity);
                      if (
                        !quantity.trim() ||
                        !Number.isFinite(servings) ||
                        servings <= 0
                      ) {
                        setError("Enter a serving amount greater than zero.");
                        return;
                      }
                      if (
                        Object.values(entry.baseNutrients).some(
                          (value) =>
                            typeof value === "number" &&
                            !Number.isFinite(value * servings),
                        )
                      ) {
                        setError(
                          "That portion is too large. Enter a smaller serving amount.",
                        );
                        return;
                      }
                      onResize(entry.id, servings);
                      closeEditor(entry.id);
                      setStatus(
                        `Updated ${entry.label} to ${servingNumberText(servings)} servings for ${dateLabel}.`,
                      );
                    }}
                  >
                    <label
                      htmlFor={`${panelId}-quantity`}
                      className="block text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      Servings of {entry.servingLabel}
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input
                        id={`${panelId}-quantity`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={quantity}
                        autoFocus
                        aria-label={`Servings for ${entry.label}`}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          error ? `${panelId}-quantity-error` : undefined
                        }
                        className="!h-11 min-w-0 max-w-28"
                        onChange={(event) => {
                          setQuantity(event.target.value);
                          setError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            closeEditor(entry.id);
                          }
                        }}
                      />
                      <Button type="submit" size="sm" className={actionClass}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={actionClass}
                        onClick={() => closeEditor(entry.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                    {error ? (
                      <p
                        id={`${panelId}-quantity-error`}
                        role="alert"
                        className="mt-2 text-xs text-rose-700 dark:text-rose-300"
                      >
                        {error}
                      </p>
                    ) : null}
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-3 text-sm text-slate-600 dark:text-slate-300">
            No food logged for {dateLabel}. Add food from the food library, or
            log a recent item below.
          </p>
        )}

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-xs text-emerald-700 dark:text-emerald-300"
        >
          {status ? <p className="mt-2">{status}</p> : null}
        </div>
        {lastRemoved ? (
          <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-1 dark:bg-white/5">
            <p className="min-w-0 flex-1 break-words text-xs text-slate-600 dark:text-slate-300">
              Removed {lastRemoved.label}
              {removedEntries.length > 1
                ? ` · ${removedEntries.length} removals can be undone`
                : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className={`${actionClass} gap-1.5`}
              aria-label={`Undo removal of ${lastRemoved.label}`}
              onClick={() => {
                onRestore(lastRemoved);
                setRemovedEntries((current) => current.slice(0, -1));
                setStatus(
                  `${lastRemoved.label} restored to its original diary date.`,
                );
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Undo
            </Button>
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-white/10">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
            Recent foods
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Repeat your last portion for {dateLabel}.
          </p>
          {recentEntries.length ? (
            <ul className="mt-1 divide-y divide-slate-200 dark:divide-white/10">
              {recentEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex min-w-0 items-center gap-2 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-sm text-slate-800 dark:text-slate-100">
                      {entry.label}
                      {entry.brand ? ` · ${entry.brand}` : ""}
                    </div>
                    <div className="break-words text-xs text-slate-500 dark:text-slate-400">
                      {portionText(entry)} · {numberText(entry.calories)} kcal
                      {entry.date === null ? " · date unknown" : ""}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={actionClass}
                    aria-label={`Log ${entry.label} again for ${dateLabel}, ${portionText(entry)}`}
                    onClick={() => {
                      onRepeat(entry);
                      setStatus(`Logged ${entry.label} for ${dateLabel}.`);
                    }}
                  >
                    Log again
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Foods you log will appear here for quick repeat logging.
            </p>
          )}
          {undatedEntries.length ? (
            <details className="mt-3 border-t border-dashed border-slate-200 pt-1 dark:border-white/10">
              <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-slate-200">
                Earlier foods · date unknown ({undatedEntries.length})
              </summary>
              <p className="mb-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                All earlier entries without a date are preserved here, even when
                they no longer appear in Recent foods. They are not counted in
                any day's totals. Log again only when you eat them; this adds a
                new entry for {dateLabel}.
              </p>
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
                {undatedEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex min-w-0 items-center gap-2 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="break-words text-sm text-slate-800 dark:text-slate-100">
                        {entry.label}
                        {entry.brand ? ` · ${entry.brand}` : ""}
                      </div>
                      <div className="mb-1 mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                        {portionText(entry)}
                      </div>
                      <MacroSummary totals={entry} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={actionClass}
                      aria-label={`Log earlier ${entry.label} again for ${dateLabel}, ${portionText(entry)}`}
                      onClick={() => {
                        onRepeat(entry);
                        setStatus(
                          `Logged ${entry.label} for ${dateLabel}. The original undated entry is preserved.`,
                        );
                      }}
                    >
                      Log again
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {hasLegacyTotals && legacyTotals ? (
            <div className="mt-3 border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
              <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Earlier totals · date unknown
              </div>
              <MacroSummary totals={legacyTotals} />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Preserved for reference only; not added to any day's diary
                totals.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </Card>
  );
}
