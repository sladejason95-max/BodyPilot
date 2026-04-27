import React from "react";
import { Camera, CheckCircle2, Database, FileDown, Plus, ScanLine, Search, Star, Trash2, Upload } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  createRecipeFoodItem,
  formatFoodNutrient,
  getFoodServingOptions,
  parseCustomFoodUpload,
  scaleFoodNutrients,
  sumFoodNutrients,
} from "@/app/food_engine";
import { foodConnectorStatus, lookupFoodBarcode, searchFoodDatabase } from "@/app/food_connector";
import { foodTrustBadgeClass, resolveFoodTrust } from "@/app/food_trust";
import type { FoodCatalogItem, FoodLogItemInput, Meal } from "@/app/types";
import { EmptyStatePanel } from "@/app/workspace_ui";

type FoodFilter = "all" | "trusted" | "favorites" | "recent" | "custom" | "supplements";
type FoodEntryMode = "search" | "scan" | "custom";

type ReviewItem = {
  id: string;
  food: FoodCatalogItem;
  servings: number;
  servingOptionId: string;
};

type FoodLibraryPanelProps = {
  meals: Meal[];
  availableFoods: FoodCatalogItem[];
  favoriteFoodIds: string[];
  recentFoodIds: string[];
  entryIntent?: {
    mode: FoodEntryMode;
    nonce: number;
  };
  targetMealId?: string;
  onTargetMealIdChange?: (mealId: string) => void;
  onCreateMeal?: () => string | null;
  onFoodLogged?: () => void;
  toggleFavoriteFood: (foodId: string) => void;
  addFoodEntriesToMeal: (
    mealId: string,
    items: FoodLogItemInput[]
  ) => void;
  addCustomFoods: (foods: FoodCatalogItem[]) => number;
};

const filterOptions: Array<{ id: FoodFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "trusted", label: "Trusted" },
  { id: "recent", label: "Recent" },
  { id: "favorites", label: "Saved" },
  { id: "custom", label: "Custom" },
  { id: "supplements", label: "Supplements" },
];

const coreFoodMatchesFilter = (
  food: FoodCatalogItem,
  filter: FoodFilter,
  favoriteFoodIds: string[],
  recentFoodIds: string[]
) => {
  if (filter === "favorites") return favoriteFoodIds.includes(food.id);
  if (filter === "recent") return recentFoodIds.includes(food.id);
  if (filter === "trusted") return !resolveFoodTrust(food).needsCheck;
  if (filter === "custom") return food.source === "custom";
  if (filter === "supplements") return food.group === "supplement";
  return true;
};

const matchesFoodSearch = (food: FoodCatalogItem, query: string) => {
  const search = query.trim().toLowerCase();
  if (!search) return true;

  const haystack = [
    food.label,
    food.brand,
    food.group,
    food.servingLabel,
    ...(food.searchTokens ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
};

const formatFoodTitle = (food: FoodCatalogItem) =>
  food.brand ? `${food.label} - ${food.brand}` : food.label;

const foodFromMealEntry = (entry: NonNullable<Meal["foodEntries"]>[number]): FoodCatalogItem => ({
  id: entry.foodId,
  label: entry.label,
  brand: entry.brand,
  barcode: entry.barcode,
  source: entry.source,
  group: entry.group,
  verified: entry.verified ?? entry.source !== "community",
  servingLabel: entry.baseServingLabel ?? entry.servingLabel,
  servingGrams: entry.baseServingGrams ?? entry.servingGrams,
  servingOptions: entry.servingOptions?.map((option) => ({ ...option })),
  imageUrl: entry.imageUrl,
  nutrients: { ...(entry.baseNutrients ?? entry.nutrients) },
  note: entry.note,
  recipeItems: entry.recipeItems?.map((item) => ({ ...item })),
});

const groupTone = (group: FoodCatalogItem["group"]) => {
  if (group === "supplement") return "border-violet-200 bg-violet-50 text-violet-700";
  if (group === "protein") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (group === "carb") return "border-sky-200 bg-sky-50 text-sky-700";
  if (group === "fat") return "border-amber-200 bg-amber-50 text-amber-700";
  if (group === "produce") return "border-lime-200 bg-lime-50 text-lime-700";
  if (group === "hydration") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (group === "branded") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
};

const sourceRank = (
  food: FoodCatalogItem,
  favoriteFoodIds: string[],
  recentFoodIds: string[]
) => {
  const trustRank = resolveFoodTrust(food).rank * 10;
  if (favoriteFoodIds.includes(food.id)) return trustRank - 2;
  if (recentFoodIds.includes(food.id)) return trustRank - 1;
  return trustRank;
};

const sourceConfidenceSummary = (foods: FoodCatalogItem[]) => {
  const trustProfiles = foods.map(resolveFoodTrust);
  const trusted = trustProfiles.filter((trust) => !trust.needsCheck).length;
  const personal = foods.filter((food) => food.source === "custom").length;
  const barcode = foods.filter((food) => Boolean(food.barcode)).length;
  const needsCheck = trustProfiles.filter((trust) => trust.needsCheck).length;

  return { trusted, personal, barcode, needsCheck };
};

const reviewPanelClass =
  "sticky bottom-20 z-10 rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-lg dark:border-amber-500/25 dark:bg-amber-950/30 md:bottom-4";
const uploadButtonClass =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium tracking-[0.01em] text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-md";
const foodDatabaseFallbackMessage =
  "Local staples, saved foods, recent foods, and custom logging still work.";

function FoodResultRow(props: {
  food: FoodCatalogItem;
  favoriteFoodIds: string[];
  toggleFavoriteFood: (foodId: string) => void;
  addFoodToReview: (food: FoodCatalogItem, servings: number, servingOptionId: string) => void;
  quickLogFood: (food: FoodCatalogItem, servings: number, servingOptionId: string) => void;
  canQuickLog: boolean;
}) {
  const { food, favoriteFoodIds, toggleFavoriteFood, addFoodToReview, quickLogFood, canQuickLog } = props;
  const servingOptions = React.useMemo(() => getFoodServingOptions(food), [food]);
  const [servings, setServings] = React.useState(1);
  const [servingOptionId, setServingOptionId] = React.useState(servingOptions[0]?.id ?? "serving");
  const selectedServingOption =
    servingOptions.find((option) => option.id === servingOptionId) ?? servingOptions[0];
  const servingMultiplier = selectedServingOption?.multiplier ?? 1;
  const previewNutrients = scaleFoodNutrients(food.nutrients, servings * servingMultiplier);
  const trust = resolveFoodTrust(food);
  const setServingAmount = (value: number) => {
    const next = Number.isFinite(value) ? value : 1;
    setServings(Math.max(0.25, Math.min(12, Number(next.toFixed(2)))));
  };

  return (
    <div
      className={[
        "grid gap-3 rounded-[20px] border bg-white px-3 py-3 shadow-sm dark:bg-slate-950/40 sm:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_minmax(220px,auto)]",
        trust.needsCheck
          ? "border-amber-200 dark:border-amber-500/25"
          : "border-slate-200 dark:border-white/10",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatFoodTitle(food)}
          </div>
          <Badge className={groupTone(food.group)}>{food.group}</Badge>
          <Badge className={foodTrustBadgeClass(trust.tone)}>{trust.label}</Badge>
          <Badge variant="outline">{food.servingLabel}</Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{trust.detail}</span>
        </div>
        {food.note ? (
          <div className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{food.note}</div>
        ) : null}
        {food.barcode ? (
          <div className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Barcode {food.barcode}</div>
        ) : null}
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300 lg:text-right">
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          {Math.round(previewNutrients.calories)} kcal
        </div>
        <div className="mt-1">
          {roundNumber(previewNutrients.protein)}P / {roundNumber(previewNutrients.carbs)}C / {roundNumber(previewNutrients.fat)}F
        </div>
        <div className="mt-2 hidden flex-wrap gap-2 sm:flex lg:justify-end">
          <Badge variant="outline">{formatFoodNutrient(previewNutrients.fiber, "g")} fiber</Badge>
          <Badge variant="outline">{formatFoodNutrient(previewNutrients.sodiumMg, "mg")} sodium</Badge>
        </div>
      </div>

      <div className="grid gap-2 self-start">
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className="flex h-9 items-center overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
            <button
              type="button"
              className="h-full px-3 text-sm font-semibold text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-white/[0.06]"
              onClick={() => setServingAmount(servings - 0.25)}
              aria-label="Decrease serving"
            >
              -
            </button>
            <input
              value={servings}
              inputMode="decimal"
              onChange={(event) => setServingAmount(Number(event.target.value))}
              className="h-full w-12 bg-transparent text-center text-sm font-semibold text-slate-900 outline-none dark:text-slate-100"
              aria-label="Servings"
            />
            <button
              type="button"
              className="h-full px-3 text-sm font-semibold text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-white/[0.06]"
              onClick={() => setServingAmount(servings + 0.25)}
              aria-label="Increase serving"
            >
              +
            </button>
          </div>
          <select
            value={servingOptionId}
            onChange={(event) => setServingOptionId(event.target.value)}
            className="h-9 min-w-0 rounded-[14px] border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
          >
            {servingOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Button
            size="sm"
            className="h-9"
            onClick={() => quickLogFood(food, servings, servingOptionId)}
            disabled={!canQuickLog}
          >
            Log
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3"
            onClick={() => addFoodToReview(food, servings, servingOptionId)}
          >
            Review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 px-2"
            aria-label={favoriteFoodIds.includes(food.id) ? "Unsave food" : "Save food"}
            title={favoriteFoodIds.includes(food.id) ? "Unsave food" : "Save food"}
            onClick={() => toggleFavoriteFood(food.id)}
          >
            <Star
              className={[
                "h-4 w-4",
                favoriteFoodIds.includes(food.id) ? "fill-current text-amber-500" : "",
              ].join(" ")}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

const initialCustomFoodState = {
  label: "",
  brand: "",
  servingLabel: "1 serving",
  servingGrams: "0",
  barcode: "",
  group: "common" as FoodCatalogItem["group"],
  calories: "0",
  protein: "0",
  carbs: "0",
  fat: "0",
  fiber: "0",
  sodiumMg: "0",
  potassiumMg: "0",
  calciumMg: "0",
  ironMg: "0",
  magnesiumMg: "0",
  vitaminCMg: "0",
  vitaminDMcg: "0",
  note: "",
};

export default function FoodLibraryPanel(props: FoodLibraryPanelProps) {
  const {
    meals,
    availableFoods,
    favoriteFoodIds,
    recentFoodIds,
    entryIntent,
    targetMealId,
    onTargetMealIdChange,
    onCreateMeal,
    onFoodLogged,
    toggleFavoriteFood,
    addFoodEntriesToMeal,
    addCustomFoods,
  } = props;

  const [foodFilter, setFoodFilter] = React.useState<FoodFilter>("all");
  const [entryMode, setEntryMode] = React.useState<FoodEntryMode>("search");
  const [foodSearch, setFoodSearch] = React.useState("");
  const [internalTargetMealId, setInternalTargetMealId] = React.useState(targetMealId ?? meals[0]?.id ?? "");
  const [reviewItems, setReviewItems] = React.useState<ReviewItem[]>([]);
  const [pendingReviewDeleteId, setPendingReviewDeleteId] = React.useState<string | null>(null);
  const [communityFoods, setCommunityFoods] = React.useState<FoodCatalogItem[]>([]);
  const [communityStatus, setCommunityStatus] = React.useState<"idle" | "loading" | "error" | "ready">("idle");
  const [communityMessage, setCommunityMessage] = React.useState("");
  const [barcodeValue, setBarcodeValue] = React.useState("");
  const [barcodeStatus, setBarcodeStatus] = React.useState("");
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [customFoodDraft, setCustomFoodDraft] = React.useState(initialCustomFoodState);
  const [importMessage, setImportMessage] = React.useState("");
  const [recipeName, setRecipeName] = React.useState("");
  const [quickLogMessage, setQuickLogMessage] = React.useState("");

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const barcodeInputRef = React.useRef<HTMLInputElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const scanIntervalRef = React.useRef<number | null>(null);
  const searchRequestIdRef = React.useRef(0);

  const resolvedTargetMealId = targetMealId ?? internalTargetMealId;
  const availableFoodsById = React.useMemo(
    () => new Map(availableFoods.map((food) => [food.id, food])),
    [availableFoods]
  );
  const resolvedTargetMeal = React.useMemo(
    () => meals.find((meal) => meal.id === resolvedTargetMealId) ?? null,
    [meals, resolvedTargetMealId]
  );
  const targetMealFoods = React.useMemo(
    () =>
      (resolvedTargetMeal?.foodEntries ?? [])
        .map((entry) => availableFoodsById.get(entry.foodId) ?? foodFromMealEntry(entry))
        .slice(0, 8),
    [availableFoodsById, resolvedTargetMeal]
  );
  const recentFoods = React.useMemo(
    () =>
      recentFoodIds
        .map((foodId) => availableFoodsById.get(foodId))
        .filter(Boolean)
        .slice(0, 12) as FoodCatalogItem[],
    [recentFoodIds, availableFoodsById]
  );
  const favoriteFoods = React.useMemo(
    () =>
      favoriteFoodIds
        .map((foodId) => availableFoodsById.get(foodId))
        .filter(Boolean)
        .slice(0, 12) as FoodCatalogItem[],
    [favoriteFoodIds, availableFoodsById]
  );
  const frequentFoods = React.useMemo(() => {
    const counts = new Map<string, number>();

    meals.forEach((meal) => {
      meal.foodEntries?.forEach((entry) => {
        counts.set(entry.foodId, (counts.get(entry.foodId) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([foodId]) => availableFoodsById.get(foodId))
      .filter(Boolean)
      .slice(0, 8) as FoodCatalogItem[];
  }, [availableFoodsById, meals]);
  const quickFoodSections = React.useMemo(() => {
    const used = new Set<string>();
    const buildSection = (title: string, foods: FoodCatalogItem[]) => {
      const rows = foods.filter((food) => {
        if (used.has(food.id)) return false;
        used.add(food.id);
        return true;
      });

      return rows.length > 0 ? { title, foods: rows } : null;
    };

    return [
      buildSection("This meal", targetMealFoods),
      buildSection("Frequent", frequentFoods),
      buildSection("Recent", recentFoods),
      buildSection("Saved", favoriteFoods),
    ].filter(Boolean) as Array<{ title: string; foods: FoodCatalogItem[] }>;
  }, [favoriteFoods, frequentFoods, recentFoods, targetMealFoods]);
  const speedPickFoods = React.useMemo(() => {
    const used = new Set<string>();

    return [...targetMealFoods, ...frequentFoods, ...recentFoods, ...favoriteFoods]
      .filter((food) => {
        if (used.has(food.id)) return false;
        used.add(food.id);
        return true;
      })
      .slice(0, 8);
  }, [favoriteFoods, frequentFoods, recentFoods, targetMealFoods]);
  const hasSearchQuery = foodSearch.trim().length > 0;
  const canQuickLogToTarget = Boolean(resolvedTargetMeal) || Boolean(onCreateMeal);

  const setResolvedTargetMealId = React.useCallback(
    (mealId: string) => {
      onTargetMealIdChange?.(mealId);
      if (targetMealId === undefined) {
        setInternalTargetMealId(mealId);
      }
    },
    [onTargetMealIdChange, targetMealId]
  );

  const ensureTargetMealId = React.useCallback(() => {
    if (resolvedTargetMealId && meals.some((meal) => meal.id === resolvedTargetMealId)) {
      return resolvedTargetMealId;
    }

    const nextMealId = onCreateMeal?.() ?? "";
    if (nextMealId) {
      setResolvedTargetMealId(nextMealId);
    }

    return nextMealId;
  }, [meals, onCreateMeal, resolvedTargetMealId, setResolvedTargetMealId]);

  React.useEffect(() => {
    if (!meals.some((meal) => meal.id === resolvedTargetMealId)) {
      setResolvedTargetMealId(meals[0]?.id ?? "");
    }
  }, [meals, resolvedTargetMealId, setResolvedTargetMealId]);

  React.useEffect(() => {
    if (entryMode !== "search" && foodFilter !== "all") {
      setFoodFilter("all");
    }
  }, [entryMode, foodFilter]);

  React.useEffect(() => {
    if (!entryIntent || entryIntent.nonce === 0) return;
    setEntryMode(entryIntent.mode);
  }, [entryIntent]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const frame = window.requestAnimationFrame(() => {
      if (entryMode === "search") {
        searchInputRef.current?.focus();
        return;
      }

      if (entryMode === "scan") {
        barcodeInputRef.current?.focus();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [entryMode]);

  const stopCameraScan = React.useCallback(() => {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  React.useEffect(() => () => stopCameraScan(), [stopCameraScan]);

  const addFoodToReview = React.useCallback((food: FoodCatalogItem, servings = 1, servingOptionId?: string) => {
    setPendingReviewDeleteId(null);
    setReviewItems((prev) => {
      const existing = prev.find((item) => item.food.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.food.id === food.id
            ? { ...item, servings: Number((item.servings + servings).toFixed(2)), servingOptionId: servingOptionId ?? item.servingOptionId }
            : item
        );
      }

      const defaultServingOption = getFoodServingOptions(food)[0];

      return [
        ...prev,
        {
          id: `${food.id}-${Date.now()}`,
          food,
          servings,
          servingOptionId: servingOptionId ?? defaultServingOption?.id ?? "serving",
        },
      ];
    });
  }, []);

  const removeReviewItem = (itemId: string) => {
    if (pendingReviewDeleteId !== itemId) {
      setPendingReviewDeleteId(itemId);
      return;
    }

    setReviewItems((prev) => prev.filter((entry) => entry.id !== itemId));
    setPendingReviewDeleteId(null);
  };

  const clearReviewTray = () => {
    if (reviewItems.length === 0) return;
    if (pendingReviewDeleteId !== "__clear__") {
      setPendingReviewDeleteId("__clear__");
      return;
    }

    setReviewItems([]);
    setPendingReviewDeleteId(null);
  };

  const quickLogFood = React.useCallback(
    (food: FoodCatalogItem, servings = 1, servingOptionId?: string) => {
      const targetMealId = ensureTargetMealId();
      if (!targetMealId) {
        setQuickLogMessage("Choose a meal before logging food.");
        return;
      }
      const defaultServingOption = getFoodServingOptions(food)[0];
      addFoodEntriesToMeal(targetMealId, [
        {
          food,
          servings,
          servingOptionId: servingOptionId ?? defaultServingOption?.id ?? "serving",
        },
      ]);
      setFoodSearch("");
      setQuickLogMessage(
        resolvedTargetMeal
          ? `Logged ${servings} ${formatFoodTitle(food)} to ${resolvedTargetMeal.name}.`
          : `Logged ${servings} ${formatFoodTitle(food)}.`
      );
    },
    [addFoodEntriesToMeal, ensureTargetMealId, resolvedTargetMeal]
  );

  const localFoods = React.useMemo(
    () =>
      availableFoods
        .filter(
          (food) =>
            food.source !== "community" ||
            recentFoodIds.includes(food.id) ||
            favoriteFoodIds.includes(food.id)
        )
        .filter((food) => coreFoodMatchesFilter(food, foodFilter, favoriteFoodIds, recentFoodIds))
        .filter((food) => matchesFoodSearch(food, foodSearch))
        .sort((left, right) => {
          const leftRank = sourceRank(left, favoriteFoodIds, recentFoodIds);
          const rightRank = sourceRank(right, favoriteFoodIds, recentFoodIds);

          if (leftRank !== rightRank) return leftRank - rightRank;
          return formatFoodTitle(left).localeCompare(formatFoodTitle(right));
        })
        .slice(0, 20),
    [availableFoods, favoriteFoodIds, recentFoodIds, foodFilter, foodSearch]
  );

  const visibleCommunityFoods = React.useMemo(
    () =>
      communityFoods
        .filter((food) =>
          coreFoodMatchesFilter(food, foodFilter, favoriteFoodIds, recentFoodIds) &&
          !availableFoodsById.has(food.id)
        )
        .sort((left, right) => {
          const leftRank = resolveFoodTrust(left).rank;
          const rightRank = resolveFoodTrust(right).rank;
          if (leftRank !== rightRank) return leftRank - rightRank;
          return formatFoodTitle(left).localeCompare(formatFoodTitle(right));
        }),
    [communityFoods, favoriteFoodIds, recentFoodIds, foodFilter, availableFoodsById]
  );
  const libraryConfidence = React.useMemo(
    () => sourceConfidenceSummary(availableFoods),
    [availableFoods]
  );
  const resultConfidence = React.useMemo(
    () => sourceConfidenceSummary([...localFoods, ...visibleCommunityFoods]),
    [localFoods, visibleCommunityFoods]
  );

  const reviewTotals = React.useMemo(
    () =>
      sumFoodNutrients(
        reviewItems.map((item) => {
          const selectedOption =
            getFoodServingOptions(item.food).find((option) => option.id === item.servingOptionId) ??
            getFoodServingOptions(item.food)[0];

          return scaleFoodNutrients(
            item.food.nutrients,
            item.servings * (selectedOption?.multiplier ?? 1)
          );
        })
      ),
    [reviewItems]
  );

  const barcodeDetectorSupported =
    typeof window !== "undefined" &&
    Boolean((window as Window & { BarcodeDetector?: unknown }).BarcodeDetector);

  const searchCommunityFoods = React.useCallback(async (queryOverride?: string) => {
    const query = (queryOverride ?? foodSearch).trim();
    if (query.length < 2) {
      setCommunityFoods([]);
      setCommunityStatus("idle");
      setCommunityMessage("");
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setCommunityStatus("loading");
    setCommunityMessage("");

    try {
      const result = await searchFoodDatabase(query, { limit: 30 });
      const nextFoods = result.foods;

      if (searchRequestIdRef.current !== requestId) {
        return;
      }

      setCommunityFoods(nextFoods);
      setCommunityStatus("ready");
      setCommunityMessage(
        nextFoods.length > 0
          ? ""
          : `No ${foodConnectorStatus.provider} matches came back for that search.`
      );
    } catch (error) {
      if (searchRequestIdRef.current !== requestId) {
        return;
      }
      setCommunityStatus("error");
      setCommunityMessage(
        `${error instanceof Error ? error.message : "Live food search failed."} ${foodDatabaseFallbackMessage}`
      );
    }
  }, [foodSearch]);

  const startCustomFoodFromSearch = React.useCallback(() => {
    const query = foodSearch.trim();

    setCustomFoodDraft((prev) => ({
      ...prev,
      label: query || prev.label,
      note: prev.note || (query ? `Created after missing search for "${query}".` : prev.note),
    }));
    setImportMessage(
      query
        ? `Custom food started from "${query}". Add serving and macros to save it locally.`
        : "Add serving and macros to save this food locally."
    );
    setEntryMode("custom");
  }, [foodSearch]);

  React.useEffect(() => {
    if (entryMode !== "search") return undefined;
    const query = foodSearch.trim();
    if (query.length < 2) {
      setCommunityFoods([]);
      setCommunityStatus("idle");
      setCommunityMessage("");
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      void searchCommunityFoods(query);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [entryMode, foodSearch, searchCommunityFoods]);

  const lookupBarcode = async (barcodeOverride?: string) => {
    const code = (barcodeOverride ?? barcodeValue).trim();
    if (!code) return;

    setEntryMode("scan");
    setBarcodeStatus("Looking up barcode...");
    try {
      const result = await lookupFoodBarcode(code);
      const normalized = result.food;

      if (!normalized) {
        setCustomFoodDraft((prev) => ({ ...prev, barcode: code }));
        setBarcodeStatus("No product was returned for that barcode. Create a custom food with this barcode and it will be saved locally.");
        return;
      }

      setCommunityFoods((prev) => {
        const withoutMatch = prev.filter((item) => item.id !== normalized.id);
        return [normalized, ...withoutMatch];
      });
      addFoodToReview(normalized);
      setBarcodeStatus(`Added ${formatFoodTitle(normalized)} to the review tray.`);
    } catch (error) {
      setCustomFoodDraft((prev) => ({ ...prev, barcode: code }));
      setBarcodeStatus(
        `${error instanceof Error ? error.message : "Barcode lookup did not succeed."} Create a custom food with this barcode if you need to log it now.`
      );
    }
  };

  const startCameraScan = async () => {
    const Detector = (window as Window & { BarcodeDetector?: any }).BarcodeDetector;
    if (!Detector) {
      setBarcodeStatus("Barcode scanning is not supported in this browser.");
      return;
    }

    try {
      setEntryMode("scan");
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;
      setCameraOpen(true);
      setBarcodeStatus("Point the camera at a barcode.");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          const rawValue = results?.[0]?.rawValue;
          if (!rawValue) return;
          setBarcodeValue(rawValue);
          stopCameraScan();
          lookupBarcode(rawValue);
        } catch {
          // Ignore transient detection misses while the stream is live.
        }
      }, 700);
    } catch (error) {
      stopCameraScan();
      setBarcodeStatus(
        error instanceof Error ? error.message : "Camera barcode scan failed to start."
      );
    }
  };

  const handleBarcodeImageUpload = async (file: File | null) => {
    if (!file) return;
    const Detector = (window as Window & { BarcodeDetector?: any }).BarcodeDetector;
    if (!Detector) {
      setBarcodeStatus("Image barcode detection is not supported in this browser.");
      return;
    }

    try {
      setEntryMode("scan");
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      const rawValue = results?.[0]?.rawValue;
      if (!rawValue) {
        setBarcodeStatus("No barcode was found in that image.");
        return;
      }
      setBarcodeValue(rawValue);
      lookupBarcode(rawValue);
    } catch (error) {
      setBarcodeStatus(
        error instanceof Error ? error.message : "Barcode image scan failed."
      );
    }
  };

  const saveCustomFood = () => {
    const label = customFoodDraft.label.trim();
    if (!label) {
      setImportMessage("A custom food needs a name before it can be saved.");
      return;
    }
    const stableId = [
      "custom",
      customFoodDraft.barcode.trim()
        ? `barcode-${customFoodDraft.barcode.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
        : [label, customFoodDraft.brand.trim()].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    ]
      .filter(Boolean)
      .join("-");

    const count = addCustomFoods([
      {
        id: stableId,
        label,
        brand: customFoodDraft.brand.trim() || undefined,
        barcode: customFoodDraft.barcode.trim() || undefined,
        source: "custom",
        group: customFoodDraft.group,
        verified: true,
        servingLabel: customFoodDraft.servingLabel.trim() || "1 serving",
        servingGrams: Number(customFoodDraft.servingGrams) || undefined,
        nutrients: {
          calories: Number(customFoodDraft.calories) || 0,
          protein: Number(customFoodDraft.protein) || 0,
          carbs: Number(customFoodDraft.carbs) || 0,
          fat: Number(customFoodDraft.fat) || 0,
          fiber: Number(customFoodDraft.fiber) || 0,
          sodiumMg: Number(customFoodDraft.sodiumMg) || 0,
          potassiumMg: Number(customFoodDraft.potassiumMg) || 0,
          calciumMg: Number(customFoodDraft.calciumMg) || 0,
          ironMg: Number(customFoodDraft.ironMg) || 0,
          magnesiumMg: Number(customFoodDraft.magnesiumMg) || 0,
          vitaminCMg: Number(customFoodDraft.vitaminCMg) || 0,
          vitaminDMcg: Number(customFoodDraft.vitaminDMcg) || 0,
        },
        note: customFoodDraft.note.trim() || "Custom food entry.",
      },
    ]);

    if (count > 0) {
      setImportMessage(`${label} is now in the custom food library.`);
      setCustomFoodDraft(initialCustomFoodState);
    }
  };

  const handleCustomFoodImport = async (file: File | null) => {
    if (!file) return;

    try {
      const text = await file.text();
      const foods = parseCustomFoodUpload(text);
      const count = addCustomFoods(foods);
      setImportMessage(
        count > 0
          ? `Imported ${count} custom food${count === 1 ? "" : "s"} from file.`
          : "No new foods were imported from that file."
      );
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "Food import file could not be parsed."
      );
    }
  };

  const downloadImportTemplate = () => {
    const rows = [
      "name,brand,group,servingLabel,servingGrams,calories,protein,carbs,fat,fiber,sodiumMg,potassiumMg,note",
      "Chicken breast cooked,,protein,100 g,100,165,31,0,3.6,0,74,256,Prep staple",
      "Jasmine rice cooked,,carb,100 g,100,130,2.7,28,0.3,0.4,1,35,Repeat carb source",
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "food-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveReviewItemsAsRecipe = () => {
    if (reviewItems.length === 0) return;

    const fallbackLabel =
      meals.find((meal) => meal.id === resolvedTargetMealId)?.name
        ? `${meals.find((meal) => meal.id === resolvedTargetMealId)?.name} recipe`
        : "Custom recipe";
    const label = recipeName.trim() || fallbackLabel;
    const recipe = createRecipeFoodItem({
      label,
      items: reviewItems.map((item) => {
        const options = getFoodServingOptions(item.food);
        const selectedOption =
          options.find((option) => option.id === item.servingOptionId) ?? options[0];

        return {
          foodId: item.food.id,
          label: item.food.label,
          brand: item.food.brand,
          source: item.food.source,
          group: item.food.group,
          servings: item.servings,
          servingLabel: selectedOption?.label ?? item.food.servingLabel,
          servingGrams:
            selectedOption?.grams ??
            (item.food.servingGrams
              ? item.food.servingGrams * (selectedOption?.multiplier ?? 1)
              : undefined),
          nutrients: scaleFoodNutrients(item.food.nutrients, selectedOption?.multiplier ?? 1),
        };
      }),
    });

    const count = addCustomFoods([recipe]);
    setImportMessage(
      count > 0
        ? `${label} was saved as a reusable recipe.`
        : `${label} already exists in the food library.`
    );
    if (count > 0) {
      setRecipeName("");
    }
  };

  const barcodeStatusClass = barcodeStatus.startsWith("Added")
    ? "mt-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100"
    : barcodeStatus.startsWith("Looking") || barcodeStatus.startsWith("Point")
      ? "mt-3 rounded-[18px] border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-800 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-100"
      : "mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100";
  const barcodeNeedsFallback =
    Boolean(barcodeStatus) &&
    !barcodeStatus.startsWith("Added") &&
    !barcodeStatus.startsWith("Looking") &&
    !barcodeStatus.startsWith("Point");
  const createCustomFromBarcode = () => {
    const code = barcodeValue.trim();
    setCustomFoodDraft((prev) => ({ ...prev, barcode: code || prev.barcode }));
    setImportMessage(
      code
        ? `Barcode ${code} is attached. Add the label and macros to save it locally.`
        : "Add the label and macros to save this food locally."
    );
    setEntryMode("custom");
  };
  const customDraftHasContext = Boolean(
    customFoodDraft.label.trim() || customFoodDraft.barcode.trim()
  );

  const commitReviewItems = () => {
    const targetMealId = ensureTargetMealId();
    if (!targetMealId || reviewItems.length === 0) return;
    addFoodEntriesToMeal(
      targetMealId,
      reviewItems.map((item) => ({
        food: item.food,
        servings: item.servings,
        servingOptionId: item.servingOptionId,
      }))
    );
    setReviewItems([]);
    setPendingReviewDeleteId(null);
    setFoodSearch("");
    onFoodLogged?.();
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={entryMode}
        onValueChange={(value) => setEntryMode(value as FoodEntryMode)}
        className="space-y-4"
      >
        <TabsList className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-[20px] border border-slate-200 bg-white/92 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 md:static md:bg-white/80 md:backdrop-blur-none md:dark:bg-white/[0.04]">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label>Search foods</Label>
                <div className="flex items-center gap-2 rounded-[20px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950/40">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    value={foodSearch}
                    onChange={(event) => setFoodSearch(event.target.value)}
                    placeholder="Banana, rice, whey, yogurt..."
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </div>
              <label className="space-y-2">
                <Label>Target meal</Label>
                <select
                  value={resolvedTargetMealId}
                  onChange={(event) => setResolvedTargetMealId(event.target.value)}
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                >
                  {meals.length === 0 ? <option value="">New meal</option> : null}
                  {meals.map((meal) => (
                    <option key={meal.id} value={meal.id}>
                      {meal.name} - {meal.timing}
                    </option>
                  ))}
                </select>
                {meals.length === 0 && onCreateMeal ? (
                  <Button type="button" size="sm" variant="outline" onClick={ensureTargetMealId}>
                    Create meal
                  </Button>
                ) : null}
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.id}
                  size="sm"
                  variant={foodFilter === option.id ? "default" : "outline"}
                  onClick={() => setFoodFilter(option.id)}
                >
                  {option.label}
                </Button>
              ))}
              {communityStatus === "loading" ? <Badge variant="outline">Searching live catalog...</Badge> : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">
                {hasSearchQuery
                  ? `${localFoods.length + visibleCommunityFoods.length} search result${localFoods.length + visibleCommunityFoods.length === 1 ? "" : "s"}`
                  : `${quickFoodSections.reduce((sum, section) => sum + section.foods.length, 0)} quick picks`}
              </Badge>
              <Badge variant="outline">{reviewItems.length} in review tray</Badge>
              <Badge variant="outline">Local staples + {foodConnectorStatus.provider}</Badge>
              <Badge variant="outline">{libraryConfidence.trusted} trusted foods</Badge>
              {libraryConfidence.needsCheck > 0 ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                  {libraryConfidence.needsCheck} need label check
                </Badge>
              ) : null}
              <Badge variant="outline">{foodConnectorStatus.supportsBarcode ? "Barcode ready" : "Search only"}</Badge>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <div className="rounded-[18px] border border-emerald-200 bg-white/80 px-3 py-2 dark:border-emerald-500/20 dark:bg-slate-950/35">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified first
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Curated, saved, and recent foods are ranked above loose live matches.
                </div>
              </div>
              <div className="rounded-[18px] border border-sky-200 bg-white/80 px-3 py-2 dark:border-sky-500/20 dark:bg-slate-950/35">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                  <Database className="h-3.5 w-3.5" />
                  Live backup
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {foodConnectorStatus.provider} expands search without blocking local logging.
                </div>
              </div>
              <button
                type="button"
                onClick={startCustomFoodFromSearch}
                className="rounded-[18px] border border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-left transition hover:-translate-y-[1px] hover:bg-amber-50 dark:border-amber-500/25 dark:bg-amber-950/20"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-amber-800 dark:text-amber-100">
                  Missing food
                </div>
                <div className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
                  Create it once, then reuse it from saved and recent foods.
                </div>
              </button>
            </div>

            {quickLogMessage ? (
              <div className="mt-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100">
                {quickLogMessage}
              </div>
            ) : null}

            {!hasSearchQuery && speedPickFoods.length > 0 ? (
              <div className="mt-4 rounded-[20px] border border-emerald-200 bg-white/78 p-3 shadow-sm dark:border-emerald-500/20 dark:bg-slate-950/35">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
                      Repeat foods
                    </div>
                    <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      Target: {resolvedTargetMeal ? resolvedTargetMeal.name : "new meal"}
                    </div>
                  </div>
                  <Badge variant="outline">{speedPickFoods.length} ready</Badge>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {speedPickFoods.map((food) => {
                    const trust = resolveFoodTrust(food);

                    return (
                      <button
                        key={`speed-pick-${food.id}`}
                        type="button"
                        onClick={() => quickLogFood(food)}
                        disabled={!canQuickLogToTarget}
                        className="min-w-[174px] rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-500/25 dark:hover:bg-emerald-950/25"
                      >
                        <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {formatFoodTitle(food)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          {Math.round(food.nutrients.calories)} kcal | {roundNumber(food.nutrients.protein)}P / {roundNumber(food.nutrients.carbs)}C / {roundNumber(food.nutrients.fat)}F
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge className={foodTrustBadgeClass(trust.tone)}>{trust.label}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {!hasSearchQuery ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick picks</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {resolvedTargetMeal ? `Logging to ${resolvedTargetMeal.name}` : "A new meal will be created"}
                  </div>
                </div>
                <Badge variant="outline">{favoriteFoods.length} saved</Badge>
              </div>
              <div className="mt-3 grid gap-3">
                {quickFoodSections.length === 0 ? (
                  <EmptyStatePanel
                    title="No quick picks yet"
                    detail="Search or create a food once, then it appears here for repeat logging."
                  />
                ) : (
                  quickFoodSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{section.title}</div>
                      <div className="grid gap-3">
                        {section.foods.map((food) => (
                          <FoodResultRow
                            key={`${section.title}-${food.id}`}
                            food={food}
                            favoriteFoodIds={favoriteFoodIds}
                            toggleFavoriteFood={toggleFavoriteFood}
                            addFoodToReview={addFoodToReview}
                            quickLogFood={quickLogFood}
                            canQuickLog={canQuickLogToTarget}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Search results</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Trusted matches sort first. Live catalog matches stay usable but labeled.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{resultConfidence.trusted} trusted</Badge>
                  {resultConfidence.barcode > 0 ? (
                    <Badge variant="outline">{resultConfidence.barcode} barcode</Badge>
                  ) : null}
                  {resultConfidence.personal > 0 ? (
                    <Badge variant="outline">{resultConfidence.personal} custom</Badge>
                  ) : null}
                  {resultConfidence.needsCheck > 0 ? (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      {resultConfidence.needsCheck} check label
                    </Badge>
                  ) : null}
                  {communityStatus === "loading" ? <Badge variant="outline">Searching...</Badge> : null}
                </div>
              </div>

              {localFoods.length === 0 && visibleCommunityFoods.length === 0 && communityStatus !== "loading" ? (
                <div className="mt-3 rounded-[22px] border border-dashed border-amber-300 bg-amber-50/80 p-4 dark:border-amber-500/25 dark:bg-amber-950/20">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                        No trusted match yet
                      </div>
                      <div className="mt-1 max-w-2xl text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
                        {communityStatus === "error"
                          ? foodDatabaseFallbackMessage
                          : `Nothing matched "${foodSearch.trim()}". Log it now as a custom food, scan the package, or retry the live catalog.`}
                      </div>
                    </div>
                    <Badge className="border-amber-200 bg-white text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
                      No dead end
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={startCustomFoodFromSearch}>
                      Create custom
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEntryMode("scan")}>
                      Scan barcode
                    </Button>
                    {foodSearch.trim().length >= 2 ? (
                      <Button size="sm" variant="ghost" onClick={() => searchCommunityFoods()}>
                        Retry live search
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {localFoods.length > 0 ? (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Library foods</div>
                  <div className="mt-3 grid gap-3">
                    {localFoods.map((food) => (
                      <FoodResultRow
                        key={food.id}
                        food={food}
                        favoriteFoodIds={favoriteFoodIds}
                        toggleFavoriteFood={toggleFavoriteFood}
                        addFoodToReview={addFoodToReview}
                        quickLogFood={quickLogFood}
                        canQuickLog={canQuickLogToTarget}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {visibleCommunityFoods.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Live catalog</div>
                  <div className="mt-3 grid gap-3">
                    {visibleCommunityFoods.map((food) => (
                      <FoodResultRow
                        key={food.id}
                        food={food}
                        favoriteFoodIds={favoriteFoodIds}
                        toggleFavoriteFood={toggleFavoriteFood}
                        addFoodToReview={addFoodToReview}
                        quickLogFood={quickLogFood}
                        canQuickLog={canQuickLogToTarget}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {communityMessage ? (
                <div
                  className={
                    communityStatus === "error"
                      ? "mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100"
                      : "mt-3 rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300"
                  }
                >
                  <div>{communityMessage}</div>
                  {communityStatus === "error" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => searchCommunityFoods()}>
                        Retry search
                      </Button>
                      <Button size="sm" variant="outline" onClick={startCustomFoodFromSearch}>
                        Add custom food
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : communityStatus === "loading" && localFoods.length === 0 ? (
                <div className="mt-3 rounded-[18px] border border-dashed border-slate-200 bg-white/70 px-3 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  Pulling more foods into the search results.
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scan" className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-end">
              <label className="space-y-2">
                <Label>Target meal</Label>
                <select
                  value={resolvedTargetMealId}
                  onChange={(event) => setResolvedTargetMealId(event.target.value)}
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                >
                  {meals.length === 0 ? <option value="">New meal</option> : null}
                  {meals.map((meal) => (
                    <option key={meal.id} value={meal.id}>
                      {meal.name} - {meal.timing}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/70 px-3 py-3 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                Packaged-food lookup. Confirm the serving before logging.
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                ref={barcodeInputRef}
                value={barcodeValue}
                onChange={(event) => setBarcodeValue(event.target.value)}
                placeholder="Enter barcode"
                className="w-full rounded-[20px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
              />
              <Button onClick={() => lookupBarcode()}>
                <ScanLine className="mr-2 h-4 w-4" />
                Lookup
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={startCameraScan}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scan camera
              </Button>
              <label className={uploadButtonClass}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleBarcodeImageUpload(event.target.files?.[0] ?? null)}
                />
                <Upload className="mr-2 h-4 w-4" />
                Scan image
              </label>
            </div>

            {!barcodeDetectorSupported ? (
              <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">
                Camera scan is unavailable in this browser. Enter the barcode and tap Lookup.
              </div>
            ) : null}

            {cameraOpen ? (
              <div className="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-950">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-xs text-white/80">
                  <span>Point the barcode at the center of the frame.</span>
                  <Button size="sm" variant="outline" onClick={stopCameraScan}>
                    Stop
                  </Button>
                </div>
              </div>
            ) : null}

            {barcodeStatus ? (
              <div className={barcodeStatusClass}>
                <div>{barcodeStatus}</div>
                {barcodeNeedsFallback ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={createCustomFromBarcode}>
                      Create custom from barcode
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => lookupBarcode()}>
                      Retry lookup
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scan results</div>
              <Badge variant="outline">{communityFoods.length} result{communityFoods.length === 1 ? "" : "s"}</Badge>
            </div>

            {communityFoods.length === 0 ? (
              <div className="mt-3 rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/35">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No barcode results yet
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Scan a package, look up the entered barcode, or create a custom food so the meal can still be logged now.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => lookupBarcode()}
                    disabled={!barcodeValue.trim()}
                  >
                    Lookup barcode
                  </Button>
                  <Button size="sm" variant="outline" onClick={createCustomFromBarcode}>
                    Create custom
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {communityFoods.map((food) => (
                  <FoodResultRow
                    key={food.id}
                    food={food}
                    favoriteFoodIds={favoriteFoodIds}
                    toggleFavoriteFood={toggleFavoriteFood}
                    addFoodToReview={addFoodToReview}
                    quickLogFood={quickLogFood}
                    canQuickLog={canQuickLogToTarget}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Create custom food</div>
            <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Save foods you use often or import a full library from JSON, JSONL, or CSV.
            </div>
            <div className="mt-3 rounded-[20px] border border-sky-200 bg-white/80 px-3 py-3 dark:border-sky-500/20 dark:bg-slate-950/35">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                  {customDraftHasContext ? "Missing food recovery" : "Fast custom minimum"}
                </div>
                <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/35 dark:text-sky-100">
                  Saved locally
                </Badge>
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Name, serving, calories, and macros are enough to log now. Add brand or barcode when you want this food to be easier to find later.
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <Label>Name</Label>
                <Input
                  value={customFoodDraft.label}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Custom chicken bowl"
                />
              </label>
              <label className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={customFoodDraft.brand}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({ ...prev, brand: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>
              <label className="space-y-2">
                <Label>Serving</Label>
                <Input
                  value={customFoodDraft.servingLabel}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({ ...prev, servingLabel: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2">
                <Label>Serving grams</Label>
                <Input
                  type="number"
                  value={customFoodDraft.servingGrams}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({ ...prev, servingGrams: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>
              <label className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={customFoodDraft.barcode}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({ ...prev, barcode: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>
              <label className="space-y-2">
                <Label>Type</Label>
                <select
                  value={customFoodDraft.group}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({
                      ...prev,
                      group: event.target.value as FoodCatalogItem["group"],
                    }))
                  }
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                >
                  {["common", "protein", "carb", "fat", "produce", "hydration", "supplement"].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["Calories", "calories"],
                ["Protein", "protein"],
                ["Carbs", "carbs"],
                ["Fat", "fat"],
                ["Fiber", "fiber"],
                ["Sodium mg", "sodiumMg"],
                ["Potassium mg", "potassiumMg"],
                ["Calcium mg", "calciumMg"],
                ["Iron mg", "ironMg"],
                ["Magnesium mg", "magnesiumMg"],
                ["Vitamin C mg", "vitaminCMg"],
                ["Vitamin D mcg", "vitaminDMcg"],
              ].map(([label, key]) => (
                <label key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    value={customFoodDraft[key as keyof typeof customFoodDraft]}
                    onChange={(event) =>
                      setCustomFoodDraft((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              <label className="space-y-2 sm:col-span-2">
                <Label>Note</Label>
                <Input
                  value={customFoodDraft.note}
                  onChange={(event) =>
                    setCustomFoodDraft((prev) => ({ ...prev, note: event.target.value }))
                  }
                  placeholder="Optional context"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={saveCustomFood}>Save custom food</Button>
              <label className={uploadButtonClass}>
                <input
                  type="file"
                  accept=".json,.jsonl,.csv,application/json,text/csv"
                  className="hidden"
                  onChange={(event) => handleCustomFoodImport(event.target.files?.[0] ?? null)}
                />
                <Upload className="mr-2 h-4 w-4" />
                Import foods
              </label>
              <Button type="button" variant="outline" onClick={downloadImportTemplate}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV template
              </Button>
            </div>

            {importMessage ? (
              <div className="mt-3 rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                {importMessage}
              </div>
            ) : null}
          </div>
        </TabsContent>

        <div className={reviewPanelClass}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-amber-700">Review tray</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-amber-50">
                {reviewItems.length} item{reviewItems.length === 1 ? "" : "s"} ready
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-amber-100/78">
                {Math.round(reviewTotals.calories)} kcal, {roundNumber(reviewTotals.protein)}P / {roundNumber(reviewTotals.carbs)}C / {roundNumber(reviewTotals.fat)}F
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={clearReviewTray} disabled={reviewItems.length === 0}>
                {pendingReviewDeleteId === "__clear__" ? "Confirm clear" : "Clear"}
              </Button>
              <Button variant="outline" onClick={saveReviewItemsAsRecipe} disabled={reviewItems.length === 0}>
                Save recipe
              </Button>
              <Button onClick={commitReviewItems} disabled={reviewItems.length === 0 || (!resolvedTargetMealId && !onCreateMeal)}>
                {resolvedTargetMeal ? `Add to ${resolvedTargetMeal.name}` : "Add to meal"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Recipe name</Label>
              <Input
                value={recipeName}
                onChange={(event) => setRecipeName(event.target.value)}
                placeholder="Save these items as a reusable recipe"
              />
            </div>
            <div className="flex items-end">
              <div className="rounded-[18px] border border-amber-200/70 bg-white/75 px-3 py-3 text-xs leading-5 text-slate-600 dark:border-amber-400/20 dark:bg-white/10 dark:text-amber-100/78">
                {resolvedTargetMeal ? `${resolvedTargetMeal.name} selected` : "Choose a meal"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {reviewItems.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-amber-300 bg-white/70 px-3 py-4 text-sm text-slate-600 dark:border-amber-400/25 dark:bg-white/10 dark:text-amber-100/78">
                Review tray is empty.
              </div>
            ) : (
              reviewItems.map((item) => (
                (() => {
                  const servingOptions = getFoodServingOptions(item.food);
                  const selectedOption =
                    servingOptions.find((option) => option.id === item.servingOptionId) ??
                    servingOptions[0];
                  const selectedCalories = Math.round(
                    item.food.nutrients.calories * (selectedOption?.multiplier ?? 1)
                  );
                  const trust = resolveFoodTrust(item.food);

                  return (
                    <div
                      key={item.id}
                      className={[
                        "rounded-[18px] border bg-white/80 px-3 py-3 shadow-sm dark:bg-slate-950/40",
                        trust.needsCheck
                          ? "border-amber-200 dark:border-amber-500/25"
                          : "border-white/80 dark:border-white/10",
                      ].join(" ")}
                    >
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{formatFoodTitle(item.food)}</div>
                            <Badge className={foodTrustBadgeClass(trust.tone)}>{trust.label}</Badge>
                          </div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {selectedOption?.label ?? item.food.servingLabel} - {selectedCalories} kcal per unit
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{trust.detail}</div>
                        </div>

                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <select
                            value={item.servingOptionId}
                            onChange={(event) =>
                              setReviewItems((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, servingOptionId: event.target.value }
                                    : entry
                                )
                              )
                            }
                            className="w-[160px] rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                          >
                            {servingOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            min={0.25}
                            step={0.25}
                            value={item.servings}
                            onChange={(event) =>
                              setReviewItems((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        servings: Math.max(0.25, Number(event.target.value) || 0.25),
                                      }
                                    : entry
                                )
                              )
                            }
                            className="w-24"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            size="sm"
                            variant={pendingReviewDeleteId === item.id ? "outline" : "ghost"}
                            onClick={() => removeReviewItem(item.id)}
                          >
                            {pendingReviewDeleteId === item.id ? "Confirm" : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ))
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}

const roundNumber = (value: number | undefined) => Number((value ?? 0).toFixed(1));
