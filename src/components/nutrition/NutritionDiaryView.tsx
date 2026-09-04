import React, { useEffect, useRef, useState } from "react";
import { Camera, Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { FoodDiaryPanel } from "./FoodDiaryPanel";
import { SavedMealsPanel } from "./SavedMealsPanel";
import {
  createSavedFoodMeal,
  instantiateFoodMeal,
  restoreSavedFoodMeal,
  undoFoodDiaryBatch,
  type SavedFoodMeal,
} from "../../app/food_meals";
import {
  lookupFoodBarcode,
  searchFoodDatabase,
  searchLocalFoodDatabase,
} from "../../app/food_connector";
import {
  createFoodDiaryEntry,
  foodDiaryDateKey,
  foodDiaryTotals,
  foodServingMassGrams,
  recentFoodDiaryEntries,
  resizeFoodDiaryEntry,
  type FoodDiaryEntry,
  type FoodDiaryFood,
} from "../../app/food_diary";
import type { FoodCatalogItem, FoodNutrients } from "../../app/types";

type Macros = { calories: number; protein: number; carbs: number; fat: number };
type Props = {
  entries: FoodDiaryEntry[];
  today: string;
  targets: Macros;
  legacyTotals?: Macros;
  savedMeals: SavedFoodMeal[];
  onSavedMealsChange: (
    update: (meals: SavedFoodMeal[]) => SavedFoodMeal[],
  ) => void;
  onEntriesChange: (
    update: (entries: FoodDiaryEntry[]) => FoodDiaryEntry[],
  ) => void;
};
type FoodDraft = {
  label: string;
  brand?: string;
  barcode?: string;
  foodId?: string;
  source?: string;
  servingLabel: string;
  servingGrams?: number;
  baseNutrients: FoodNutrients;
  servings: number;
} & Macros;
type BarcodeResult = { rawValue?: string };
type Detector = {
  detect(input: HTMLVideoElement | ImageBitmap): Promise<BarcodeResult[]>;
};
type DetectorConstructor = new (options: { formats: string[] }) => Detector;
const amount = (value: number) => Math.round(value * 10) / 10;
const portionAmount = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(
    value,
  );
const titleFor = (food: FoodCatalogItem) =>
  food.brand ? `${food.label} · ${food.brand}` : food.label;

export function NutritionDiaryView({
  entries,
  today,
  targets,
  legacyTotals,
  savedMeals,
  onSavedMealsChange,
  onEntriesChange,
}: Props) {
  const [date, setDate] = useState(today);
  const previousToday = useRef(today);
  const [notice, setNotice] = useState("");
  const [lastAddedIds, setLastAddedIds] = useState<string[]>([]);
  const totals = foodDiaryTotals(entries, date);
  useEffect(() => {
    const priorDate = previousToday.current;
    previousToday.current = today;
    setDate((current) => (current === priorDate ? today : current));
  }, [today]);

  const add = (draft: FoodDraft | FoodDiaryEntry) => {
    const now = new Date();
    const currentDate = foodDiaryDateKey(now);
    const entryDate = date === today ? currentDate : date;
    if (entryDate !== date) setDate(entryDate);
    const entry = createFoodDiaryEntry(draft, {
      id: `food-${crypto.randomUUID()}`,
      date: entryDate,
      recordedAt: now.toISOString(),
      servings: draft.servings,
    });
    if (!entry) {
      setNotice("Check the portion and nutrition values before logging.");
      return;
    }
    onEntriesChange((current) => [entry, ...current]);
    setLastAddedIds([entry.id]);
    setNotice(
      `Logged ${entry.label} for ${entryDate === currentDate ? "today" : entryDate}.`,
    );
  };
  const addBatch = (
    foods: readonly FoodDiaryFood[],
    targetDate?: string,
    mealName?: string,
  ): boolean => {
    const now = new Date();
    const currentDate = foodDiaryDateKey(now);
    // Copy dates are explicit; only the ordinary "today" view follows midnight.
    const entryDate = targetDate ?? (date === today ? currentDate : date);
    if (entryDate > currentDate) {
      setNotice("Choose today or an earlier diary date.");
      return false;
    }
    const batch = instantiateFoodMeal(foods, {
      batchId: `food-meal-${crypto.randomUUID()}`,
      date: entryDate,
      recordedAt: now.toISOString(),
      existingIds: entries.map((entry) => entry.id),
    });
    if (!batch) {
      setNotice(
        "Meal not logged. Check every portion, nutrition value, and destination date.",
      );
      return false;
    }
    onEntriesChange((current) => [...batch, ...current]);
    if (!targetDate && entryDate !== date) setDate(entryDate);
    setLastAddedIds(batch.map((entry) => entry.id));
    setNotice(
      `${targetDate ? "Copied" : "Logged"} ${batch.length} foods${mealName ? ` from ${mealName}` : ""} for ${entryDate === currentDate ? "today" : entryDate}. Original foods and saved portions are unchanged.`,
    );
    return true;
  };
  const saveMeal = (name: string, foods: FoodDiaryEntry[]): boolean => {
    const nameKey = (value: string) =>
      value.trim().replace(/\s+/g, " ").toLowerCase();
    if (savedMeals.some((meal) => nameKey(meal.name) === nameKey(name))) {
      setNotice("A saved meal already has that name. Choose another name.");
      return false;
    }
    const meal = createSavedFoodMeal({
      id: `meal-${crypto.randomUUID()}`,
      name,
      items: foods,
      createdAt: new Date().toISOString(),
    });
    if (!meal) {
      setNotice(
        "Meal not saved. Add a name and select foods with valid portions.",
      );
      return false;
    }
    onSavedMealsChange((current) => [meal, ...current]);
    setLastAddedIds([]);
    setNotice(
      `Saved ${meal.name} with ${meal.items.length} foods. No additional food was logged.`,
    );
    return true;
  };
  const difference = targets.calories - totals.calories;
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold">Food diary</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {date === today ? "Today" : date} · Saved on this device
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold tabular-nums">
                {amount(totals.calories)}{" "}
                <span className="text-sm font-normal">kcal logged</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {amount(Math.abs(difference))}{" "}
                {difference < 0 ? "over" : "remaining"} · {targets.calories}{" "}
                target
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm tabular-nums">
            {(
              [
                ["Protein", totals.protein, targets.protein],
                ["Carbs", totals.carbs, targets.carbs],
                ["Fat", totals.fat, targets.fat],
              ] as const
            ).map(([label, logged, target]) => (
              <div key={label}>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {label}
                </div>
                <div className="font-semibold">
                  {amount(logged)}{" "}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    / {target} g
                  </span>
                </div>
                {logged > target ? (
                  <div className="text-xs">
                    {amount(logged - target)} g over
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <details className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer py-1">
              About these targets
            </summary>
            <p className="mt-2 leading-5">
              Starting estimates from your profile, goal, steps and recovery
              inputs—not expenditure measured from your food and weight history.
              Past dates are compared with your current targets. Incomplete
              logging makes the remaining amounts incomplete too.
            </p>
          </details>
        </CardContent>
      </Card>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="grid gap-3">
          {entries.length ? (
            <div
              className="flex flex-wrap gap-2"
              aria-label="Quick repeat foods"
            >
              {recentFoodDiaryEntries(entries, 3).map((entry) => (
                <Button
                  key={entry.id}
                  variant="outline"
                  className="min-h-11 !h-auto max-w-full whitespace-normal py-2 text-left"
                  onClick={() => add(entry)}
                  aria-label={`Quick log ${entry.label}, same portion`}
                >
                  <span className="min-w-0 break-words">
                    + {entry.label}
                    <span className="block text-xs font-normal opacity-70">
                      {portionAmount(entry.servings)} × {entry.servingLabel}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
          <FoodSearch onAdd={add} date={date} today={today} />
          {notice ? (
            <div
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10"
              role="status"
            >
              <span>{notice}</span>
              {lastAddedIds.length > 0 &&
              entries.some((entry) => lastAddedIds.includes(entry.id)) ? (
                <Button
                  variant="outline"
                  className="min-h-11 shrink-0"
                  onClick={() => {
                    onEntriesChange((current) =>
                      undoFoodDiaryBatch(current, lastAddedIds),
                    );
                    setNotice(
                      lastAddedIds.length === 1
                        ? "Food entry undone."
                        : "The entire food batch was undone. Original entries are unchanged.",
                    );
                    setLastAddedIds([]);
                  }}
                >
                  Undo
                </Button>
              ) : null}
            </div>
          ) : null}
          <SavedMealsPanel
            meals={savedMeals}
            selectedDate={date}
            today={today}
            onLog={(meal) => addBatch(meal.items, undefined, meal.name)}
            onDelete={(id) =>
              onSavedMealsChange((current) =>
                current.filter((meal) => meal.id !== id),
              )
            }
            onRestore={(meal) =>
              onSavedMealsChange((current) =>
                restoreSavedFoodMeal(current, meal),
              )
            }
          />
        </div>
        <FoodDiaryPanel
          entries={entries}
          selectedDate={date}
          today={today}
          onDateChange={setDate}
          legacyTotals={legacyTotals}
          onRepeat={add}
          onSaveMeal={saveMeal}
          onCopyEntries={(foods, targetDate) => addBatch(foods, targetDate)}
          onResize={(id, servings) =>
            onEntriesChange((current) =>
              current.map((entry) =>
                entry.id === id
                  ? (resizeFoodDiaryEntry(entry, servings) ?? entry)
                  : entry,
              ),
            )
          }
          onDelete={(id) =>
            onEntriesChange((current) =>
              current.filter((entry) => entry.id !== id),
            )
          }
          onRestore={(entry) =>
            onEntriesChange((current) =>
              current.some((item) => item.id === entry.id)
                ? current
                : [entry, ...current],
            )
          }
        />
      </div>
    </div>
  );
}

function FoodSearch({
  onAdd,
  date,
  today,
}: {
  onAdd: (entry: FoodDraft) => void;
  date: string;
  today: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodCatalogItem[]>([]);
  const [selected, setSelected] = useState<FoodCatalogItem | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("servings");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [custom, setCustom] = useState({
    label: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const requestId = useRef(0);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const cameraSession = useRef(0);
  const stopCamera = () => {
    cameraSession.current++;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (mounted.current) {
      setCameraOpen(false);
      setCameraStarting(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
      stopCamera();
    };
  }, []);
  useEffect(() => {
    if (!cameraOpen || !video.current || !stream.current) return;
    const session = cameraSession.current;
    video.current.srcObject = stream.current;
    void video.current.play().catch(() => {
      if (mounted.current && session === cameraSession.current) {
        setStatus("Camera preview could not start. Enter the barcode instead.");
        stopCamera();
      }
    });
  }, [cameraOpen]);
  const select = (food: FoodCatalogItem) => {
    requestId.current++;
    setBusy(false);
    setSelected(food);
    setQuantity("1");
    setUnit("servings");
  };
  const search = async () => {
    if (query.trim().length < 2) return;
    stopCamera();
    const request = ++requestId.current;
    const local = searchLocalFoodDatabase(query.trim(), { limit: 8 }).foods;
    setResults(local);
    setSelected(null);
    setBusy(true);
    setStatus(
      local.length
        ? "Local matches ready; checking other sources…"
        : "Searching…",
    );
    try {
      const result = await searchFoodDatabase(query.trim(), { limit: 8 });
      if (request !== requestId.current) return;
      const foods = result.foods.length ? result.foods : local;
      setResults(foods);
      setStatus(
        foods.length
          ? `${foods.length} matches. Check the serving and label.`
          : "No match. Use a label entry below.",
      );
    } catch {
      if (request === requestId.current)
        setStatus(
          local.length
            ? "Using local matches; online search is unavailable."
            : "Search unavailable. You can still enter the label below.",
        );
    } finally {
      if (request === requestId.current) setBusy(false);
    }
  };
  const lookup = async (value = barcode) => {
    if (!value.trim()) return;
    stopCamera();
    const request = ++requestId.current;
    setBusy(true);
    setSelected(null);
    setStatus("Looking up barcode…");
    try {
      const result = await lookupFoodBarcode(value.trim());
      if (request !== requestId.current) return;
      if (result.food) {
        select(result.food);
        setStatus("Product found. Check the package and portion.");
      } else setStatus("No product found. Use a label entry below.");
    } catch {
      if (request === requestId.current)
        setStatus("Barcode lookup unavailable. Use a label entry below.");
    } finally {
      if (request === requestId.current) setBusy(false);
    }
  };
  const detector = (): Detector | null => {
    const Constructor = (
      window as Window & { BarcodeDetector?: DetectorConstructor }
    ).BarcodeDetector;
    return Constructor
      ? new Constructor({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        })
      : null;
  };
  const startCamera = async () => {
    requestId.current++;
    setBusy(false);
    const reader = detector();
    if (!reader) {
      setStatus(
        "Camera scanning is not supported in this browser. Enter a barcode instead.",
      );
      return;
    }
    stopCamera();
    const session = ++cameraSession.current;
    setCameraStarting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      if (!mounted.current || session !== cameraSession.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      setCameraStarting(false);
      setCameraOpen(true);
      setStatus("Point the camera at a barcode.");
      let detecting = false;
      timer.current = setInterval(async () => {
        if (detecting || !video.current || video.current.readyState < 2) return;
        detecting = true;
        try {
          const matches = await reader.detect(video.current);
          const value = matches[0]?.rawValue;
          if (value && stream.current && session === cameraSession.current) {
            stopCamera();
            setBarcode(value);
            void lookup(value);
          }
        } catch {
          /* A moving camera can produce an unreadable frame. */
        } finally {
          detecting = false;
        }
      }, 600);
    } catch {
      if (mounted.current && session === cameraSession.current) {
        stopCamera();
        setStatus("Camera could not start. Enter the barcode instead.");
      }
    }
  };
  const scanImage = async (file?: File) => {
    if (!file) return;
    stopCamera();
    const reader = detector();
    if (!reader) {
      setStatus(
        "Image scanning is not supported here. Enter a barcode instead.",
      );
      return;
    }
    const request = ++requestId.current;
    setBusy(false);
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await createImageBitmap(file);
      const value = (await reader.detect(bitmap))[0]?.rawValue;
      if (!mounted.current || request !== requestId.current) return;
      if (value) {
        setBarcode(value);
        await lookup(value);
      } else setStatus("No barcode found in that image.");
    } catch {
      if (mounted.current && request === requestId.current)
        setStatus("Image could not be read. Enter the barcode instead.");
    } finally {
      bitmap?.close();
    }
  };
  const massBasis = selected
    ? foodServingMassGrams(selected.servingLabel, selected.servingGrams)
    : null;
  const servings = Number(quantity) / (unit === "grams" ? massBasis || 1 : 1);
  const validPortion =
    quantity.trim() !== "" &&
    Number.isFinite(servings) &&
    servings > 0 &&
    servings <= 100;
  const validCustom =
    custom.label.trim() &&
    (["calories", "protein", "carbs", "fat"] as const).every(
      (key) =>
        custom[key].trim() !== "" &&
        Number.isFinite(Number(custom[key])) &&
        Number(custom[key]) >= 0,
    );
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Add food</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Logging for {date === today ? "today" : date}
          </span>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <Input
            aria-label="Search food"
            placeholder="Search food or brand"
            value={query}
            onChange={(event) => {
              requestId.current++;
              setQuery(event.target.value);
              setSelected(null);
              setResults([]);
              setBusy(false);
              setStatus("");
            }}
            className="min-h-11 min-w-0"
          />
          <Button
            variant="outline"
            type="submit"
            className="min-h-11"
            disabled={query.trim().length < 2}
            aria-label="Search foods"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
        {status ? (
          <p
            className="text-xs text-slate-600 dark:text-slate-300"
            role="status"
            aria-busy={busy}
          >
            {status}
          </p>
        ) : null}
        {selected ? (
          <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{titleFor(selected)}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label="Close portion editor"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Basis: {selected.servingLabel}
              {massBasis ? ` · ${massBasis} g` : ""}. Source: {selected.source}.
              Check against your food label.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs">
                Amount
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="mt-1 min-h-11"
                />
              </label>
              <label className="text-xs">
                Unit
                <select
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-transparent px-2 text-sm dark:border-white/10"
                  value={unit}
                  onChange={(event) => {
                    setUnit(event.target.value);
                    setQuantity(
                      event.target.value === "grams" ? String(massBasis) : "1",
                    );
                  }}
                >
                  <option value="servings">Servings</option>
                  {massBasis ? <option value="grams">Grams</option> : null}
                </select>
              </label>
            </div>
            <p className="mt-3 text-sm tabular-nums">
              {validPortion
                ? `${amount(selected.nutrients.calories * servings)} kcal · ${amount(selected.nutrients.protein * servings)} P / ${amount(selected.nutrients.carbs * servings)} C / ${amount(selected.nutrients.fat * servings)} F`
                : "Enter a positive portion (up to 100 base servings)."}
            </p>
            <Button
              className="mt-3 min-h-11 w-full"
              disabled={!validPortion}
              onClick={() => {
                onAdd({
                  label: selected.label,
                  brand: selected.brand,
                  barcode: selected.barcode,
                  foodId: selected.id,
                  source: selected.source,
                  servingLabel: selected.servingLabel,
                  servingGrams: massBasis ?? undefined,
                  baseNutrients: selected.nutrients,
                  servings,
                  ...selected.nutrients,
                });
                setSelected(null);
                setResults([]);
                setQuery("");
                setStatus("");
              }}
            >
              Log this portion
            </Button>
          </div>
        ) : null}
        {results.length ? (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {results.map((food) => (
              <li key={food.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="break-words text-sm font-medium">
                    {titleFor(food)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {food.servingLabel} · {amount(food.nutrients.calories)} kcal
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {food.source} ·{" "}
                    {food.verified
                      ? "Reference entry"
                      : "Community label—check values"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 shrink-0"
                  onClick={() => select(food)}
                  aria-label={`Choose portion for ${food.label}`}
                >
                  Portion
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <details>
          <summary className="cursor-pointer py-2 text-sm font-medium">
            Barcode or camera
          </summary>
          <div className="mt-2 grid gap-2">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void lookup();
              }}
            >
              <Input
                aria-label="Barcode"
                inputMode="numeric"
                value={barcode}
                onChange={(event) => {
                  requestId.current++;
                  setBusy(false);
                  setSelected(null);
                  setBarcode(event.target.value);
                }}
                placeholder="Enter barcode"
                className="min-h-11 min-w-0"
              />
              <Button
                variant="outline"
                type="submit"
                disabled={!barcode.trim()}
                className="min-h-11"
              >
                Lookup
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="min-h-11 gap-2"
                onClick={() => void startCamera()}
                disabled={cameraOpen || cameraStarting}
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <label className="flex min-h-11 cursor-pointer items-center rounded-md border border-slate-200 px-3 text-sm dark:border-white/10">
                Barcode image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void scanImage(event.target.files?.[0])}
                />
              </label>
            </div>
            {cameraOpen ? (
              <div>
                <video
                  ref={video}
                  muted
                  playsInline
                  className="w-full rounded-xl"
                />
                <Button
                  className="mt-2 min-h-11"
                  variant="outline"
                  onClick={stopCamera}
                >
                  Stop camera
                </Button>
              </div>
            ) : null}
          </div>
        </details>
        <details>
          <summary className="cursor-pointer py-2 text-sm font-medium">
            Enter label / quick macros
          </summary>
          <form
            className="mt-2 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validCustom) return;
              const nutrients = {
                calories: Number(custom.calories),
                protein: Number(custom.protein),
                carbs: Number(custom.carbs),
                fat: Number(custom.fat),
              };
              onAdd({
                label: custom.label.trim(),
                servingLabel: "entered portion",
                source: "user label",
                servings: 1,
                baseNutrients: nutrients,
                ...nutrients,
              });
              setCustom({
                label: "",
                calories: "",
                protein: "",
                carbs: "",
                fat: "",
              });
            }}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter values for the amount you ate. Use 0 only when the label
              says zero.
            </p>
            <label className="text-xs">
              Food or meal name
              <Input
                aria-label="Food or meal name"
                value={custom.label}
                onChange={(event) =>
                  setCustom((prev) => ({ ...prev, label: event.target.value }))
                }
                className="mt-1 min-h-11"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["calories", "Calories (kcal)"],
                  ["protein", "Protein (g)"],
                  ["carbs", "Carbs (g)"],
                  ["fat", "Fat (g)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs">
                  {label}
                  <Input
                    aria-label={`Label ${label}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={custom[key]}
                    onChange={(event) =>
                      setCustom((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    className="mt-1 min-h-11"
                    required
                  />
                </label>
              ))}
            </div>
            <Button type="submit" disabled={!validCustom} className="min-h-11">
              Log entered values
            </Button>
          </form>
        </details>
      </CardContent>
    </Card>
  );
}
