import React from "react";
import { Clock3, Plus, ScanLine, Search, Star, Trash2, Undo2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent } from "../../components/ui/tabs";
import FoodLibraryPanel from "../../components/nutrition/FoodLibraryPanel";
import {
  createRecipeFoodItem,
  formatFoodNutrient,
  getFoodServingOptions,
  micronutrientTargets,
  summarizeDayFoodNutrients,
} from "../food_engine";
import { foodTrustBadgeClass, resolveFoodTrust } from "../food_trust";
import { clamp, panelHoverClass, softPanelClass } from "../constants";
import { buildMealTemplateScientificProfile } from "../performance_libraries";
import type { SupportProtocolCard, SupportProtocolItem } from "../support_stack_engine";
import type {
  FoodCatalogItem,
  FoodDaySnapshot,
  FoodLogItemInput,
  Meal,
  MealFoodEntry,
  MealTemplate,
  SupplementPattern,
  SupplementProtocol,
} from "../types";
import {
  AdvancedEditorCard,
  AnalyticsStat,
  DecisionSpotlight,
  EmptyStatePanel,
  SectionCard,
  SignalTile,
  WorkspaceSummaryRail,
  type AccentTone,
} from "../workspace_ui";
import {
  BulletChart,
  ComparisonBars,
  DonutChart,
  InfographicPanel,
} from "../visual_storytelling";

type UserMode = "athlete" | "coach";

type SummaryItem = {
  label: string;
  title: string;
  detail: string;
};

type DecisionTile = {
  label: string;
  title: string;
  detail: string;
  tone?: AccentTone;
  onClick?: () => void;
};

type NutritionPrimaryAction = {
  title: string;
  body: string;
  cta: string;
};

type FoodToolsTab = "log" | "add" | "insights";
type FoodEntryMode = "search" | "scan" | "custom";
const foodToolsTabValues: readonly FoodToolsTab[] = ["log", "add", "insights"];
const resolveInitialFoodToolsTab = (): FoodToolsTab => {
  if (typeof window === "undefined") return "log";
  const requested = new URLSearchParams(window.location.search).get("nutritionSurface");
  return foodToolsTabValues.includes(requested as FoodToolsTab) ? (requested as FoodToolsTab) : "log";
};

type MealTotals = {
  protein: number;
  carbs: number;
  fats: number;
};

type MacroGapSuggestion = {
  label: string;
  gap: number;
  food: FoodCatalogItem;
  servings: number;
  macroValue: number;
  calories: number;
};

type FuelingBlock = {
  type?: Meal["type"];
  rows: Meal[];
  totals: MealTotals;
};

type NutritionNavigationIntent = {
  section: "overview" | "targets" | "builder" | "templates";
  templateId: string | null;
  nonce: number;
};

type FoodSurfaceIntent = {
  surface: FoodToolsTab;
  entryMode?: FoodEntryMode;
  nonce: number;
};

type QuickMacroKey = "protein" | "carbs" | "fat";

type NutritionTabProps = {
  userMode: UserMode;
  canEditPlan: boolean;
  nutritionFocusCards: SummaryItem[];
  nutritionPrimaryAction: NutritionPrimaryAction;
  nutritionDecisionTiles: readonly DecisionTile[];
  nutritionWindowSummary: readonly DecisionTile[];
  goToTab: (tab: string) => void;
  openTrackerSurface: (surface: "dashboard" | "log" | "insights" | "week") => void;
  applyMacroPreset: () => void;
  trainingDay: boolean;
  setTrainingDay: React.Dispatch<React.SetStateAction<boolean>>;
  nutritionPreset: string;
  proteinTarget: number;
  setProteinTarget: React.Dispatch<React.SetStateAction<number>>;
  carbTarget: number;
  setCarbTarget: React.Dispatch<React.SetStateAction<number>>;
  fatTarget: number;
  setFatTarget: React.Dispatch<React.SetStateAction<number>>;
  estimatedTdee: number;
  setEstimatedTdee: React.Dispatch<React.SetStateAction<number>>;
  macroCalories: number;
  calorieDelta: number;
  mealTotals: MealTotals;
  intraCarbs: number;
  setIntraCarbs: React.Dispatch<React.SetStateAction<number>>;
  waterLiters: number;
  setWaterLiters: React.Dispatch<React.SetStateAction<number>>;
  saltTsp: number;
  setSaltTsp: React.Dispatch<React.SetStateAction<number>>;
  metricsTone: (value: number) => string;
  nutritionRiskFlags: string[];
  showNutritionControls: boolean;
  toggleNutritionControls: () => void;
  fuelingBlocks: FuelingBlock[];
  mealTypeTone: (type?: Meal["type"]) => string;
  mealMacroGuidance: {
    pre: string;
    intra: string;
    post: string;
    off: string;
  };
  showNutritionEditor: boolean;
  toggleNutritionEditor: () => void;
  navigationIntent: NutritionNavigationIntent;
  foodSurfaceIntent?: FoodSurfaceIntent;
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  todayIso: string;
  foodDayHistory: readonly FoodDaySnapshot[];
  saveFoodDaySnapshot: () => void;
  copyFoodDayToToday: (date: string, mode?: "replace" | "append") => void;
  addMeal: () => string;
  moveMeal: (mealId: string, direction: number) => void;
  duplicateMeal: (mealId: string) => void;
  assignMealTemplate: (mealId: string, mode: Meal["type"]) => void;
  mealTemplates: MealTemplate[];
  saveMealAsTemplate: (mealId: string) => void;
  applyMealTemplate: (mealId: string, templateId: string) => void;
  addMealFromTemplate: (templateId: string) => string | null;
  availableFoods: FoodCatalogItem[];
  favoriteFoodIds: string[];
  recentFoodIds: string[];
  toggleFavoriteFood: (foodId: string) => void;
  addFoodEntriesToMeal: (
    mealId: string,
    items: FoodLogItemInput[]
  ) => void;
  addCustomFoods: (foods: FoodCatalogItem[]) => number;
  updateMealFoodEntryServings: (mealId: string, entryId: string, servings: number) => void;
  updateMealFoodEntryUnit: (mealId: string, entryId: string, servingOptionId: string) => void;
  removeMealFoodEntry: (mealId: string, entryId: string) => void;
  supportStackCards: SupportProtocolCard[];
  supportStackFlags: string[];
  supplementProtocol: SupportProtocolItem[];
  updateSupplementProtocol: (supplementId: string, patch: Partial<SupplementProtocol>) => void;
};

const supplementPatternOptions: Array<{ value: SupplementPattern; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "training", label: "Training days" },
  { value: "off-day", label: "Off days" },
  { value: "as-needed", label: "As needed" },
];

const quickMacroInputs: Array<{ key: QuickMacroKey; label: string; accent: string }> = [
  { key: "protein", label: "Protein", accent: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-950/25" },
  { key: "carbs", label: "Carbs", accent: "border-sky-200 bg-sky-50/80 dark:border-sky-500/20 dark:bg-sky-950/25" },
  { key: "fat", label: "Fat", accent: "border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-950/25" },
];

const evidenceBadgeClass = (evidence: string) => {
  if (evidence === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (evidence === "moderate") return "border-sky-200 bg-sky-50 text-sky-700";
  if (evidence === "limited") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
};

const parseClockMinutes = (value?: string) => {
  const match = (value ?? "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
};

const getLocalClockMinutes = (date = new Date()) => date.getHours() * 60 + date.getMinutes();

const shiftIsoDate = (isoDate: string, offsetDays: number) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const formatShortIsoDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

const circularMinuteDistance = (left: number, right: number) => {
  const difference = Math.abs(left - right);
  return Math.min(difference, 1440 - difference);
};

const resolveClosestMealToClock = (meals: Meal[], clockMinutes: number) => {
  if (meals.length === 0) return null;

  return meals
    .map((meal, index) => ({
      meal,
      distance: circularMinuteDistance(
        clockMinutes,
        parseClockMinutes(meal.timing) ?? ((8 * 60 + index * 240) % 1440)
      ),
    }))
    .sort((left, right) => left.distance - right.distance)[0]?.meal ?? meals[0];
};

const readMacroInput = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Number(parsed.toFixed(1)));
};

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

const summarizeFoodEntryTrust = (entries?: MealFoodEntry[]) => {
  const trustProfiles = (entries ?? []).map((entry) => resolveFoodTrust(entry));

  return {
    trusted: trustProfiles.filter((trust) => !trust.needsCheck).length,
    needsCheck: trustProfiles.filter((trust) => trust.needsCheck).length,
  };
};

export default function NutritionTab(props: NutritionTabProps) {
  const {
    userMode,
    canEditPlan,
    nutritionFocusCards,
    nutritionPrimaryAction,
    nutritionDecisionTiles,
    nutritionWindowSummary,
    goToTab,
    openTrackerSurface,
    applyMacroPreset,
    trainingDay,
    setTrainingDay,
    nutritionPreset,
    proteinTarget,
    setProteinTarget,
    carbTarget,
    setCarbTarget,
    fatTarget,
    setFatTarget,
    estimatedTdee,
    setEstimatedTdee,
    macroCalories,
    calorieDelta,
    mealTotals,
    waterLiters,
    setWaterLiters,
    saltTsp,
    setSaltTsp,
    metricsTone,
    nutritionRiskFlags,
    showNutritionControls,
    toggleNutritionControls,
    fuelingBlocks,
    mealTypeTone,
    mealMacroGuidance,
    showNutritionEditor,
    toggleNutritionEditor,
    navigationIntent,
    foodSurfaceIntent,
    meals,
    setMeals,
    todayIso,
    foodDayHistory,
    saveFoodDaySnapshot,
    copyFoodDayToToday,
    addMeal,
    moveMeal,
    duplicateMeal,
    assignMealTemplate,
    mealTemplates,
    saveMealAsTemplate,
    applyMealTemplate,
    addMealFromTemplate,
    availableFoods,
    favoriteFoodIds,
    recentFoodIds,
    toggleFavoriteFood,
    addFoodEntriesToMeal,
    addCustomFoods,
    updateMealFoodEntryServings,
    updateMealFoodEntryUnit,
    removeMealFoodEntry,
    supportStackCards,
    supportStackFlags,
    supplementProtocol,
    updateSupplementProtocol,
  } = props;

  const [pendingMealDeleteId, setPendingMealDeleteId] = React.useState<string | null>(null);
  const [pendingFoodEntryDeleteId, setPendingFoodEntryDeleteId] = React.useState<string | null>(null);

  const updateMeal = (mealId: string, patch: Partial<Meal>) => {
    setMeals((prev) => prev.map((item) => (item.id === mealId ? { ...item, ...patch } : item)));
    setPendingMealDeleteId(null);
  };

  const removeMeal = (mealId: string) => {
    if (pendingMealDeleteId !== mealId) {
      setPendingMealDeleteId(mealId);
      return;
    }

    setMeals((prev) => prev.filter((item) => item.id !== mealId));
    setPendingMealDeleteId(null);
  };

  const requestRemoveMealFoodEntry = (mealId: string, entryId: string) => {
    const deleteKey = `${mealId}:${entryId}`;
    if (pendingFoodEntryDeleteId !== deleteKey) {
      setPendingFoodEntryDeleteId(deleteKey);
      return;
    }

    removeMealFoodEntry(mealId, entryId);
    setPendingFoodEntryDeleteId(null);
  };

  const isCoachView = userMode === "coach";
  const visibleNutritionDecisionTiles = React.useMemo(() => {
    const hiddenLabels = new Set(["Diet pressure", "Supplement support"]);
    const preferredLabels = [
      "Protein support",
      "Training window",
      "Hydration",
      "Meal quality",
      "Recovery pressure",
    ];

    return preferredLabels
      .map((label) => nutritionDecisionTiles.find((item) => item.label === label))
      .filter((item): item is DecisionTile => Boolean(item) && !hiddenLabels.has(item.label))
      .slice(0, isCoachView ? 4 : 3);
  }, [isCoachView, nutritionDecisionTiles]);
  const visibleNutritionWindowSummary = isCoachView ? nutritionWindowSummary : [];
  const overviewRef = React.useRef<HTMLDivElement | null>(null);
  const controlsRef = React.useRef<HTMLDivElement | null>(null);
  const builderRef = React.useRef<HTMLDivElement | null>(null);
  const templateLibraryRef = React.useRef<HTMLDivElement | null>(null);
  const foodToolsRef = React.useRef<HTMLDivElement | null>(null);
  const [highlightedSection, setHighlightedSection] = React.useState<NutritionNavigationIntent["section"] | null>(null);
  const [foodToolsTab, setFoodToolsTab] = React.useState<FoodToolsTab>(resolveInitialFoodToolsTab);
  const [showFullMealDiary, setShowFullMealDiary] = React.useState(userMode === "coach");
  const [expandedDiaryMeals, setExpandedDiaryMeals] = React.useState<Record<string, boolean>>({});
  const [expandedTemplateInfoIds, setExpandedTemplateInfoIds] = React.useState<Record<string, boolean>>({});
  const [expandedMealInfoIds, setExpandedMealInfoIds] = React.useState<Record<string, boolean>>({});
  const [foodEntryIntent, setFoodEntryIntent] = React.useState<{ mode: FoodEntryMode; nonce: number }>({
    mode: "search",
    nonce: 0,
  });
  const [selectedMealId, setSelectedMealId] = React.useState(meals[0]?.id ?? "");
  const [copySourceMealId, setCopySourceMealId] = React.useState("");
  const [quickMacros, setQuickMacros] = React.useState<Record<QuickMacroKey, string>>({
    protein: "",
    carbs: "",
    fat: "",
  });
  const [quickMacroStatus, setQuickMacroStatus] = React.useState("");
  const [foodActionMessage, setFoodActionMessage] = React.useState("");
  const [quickMacroClockMinute, setQuickMacroClockMinute] = React.useState(() => getLocalClockMinutes());
  const dailyFoodNutrients = React.useMemo(() => summarizeDayFoodNutrients(meals), [meals]);
  const loggedMacroTotals = React.useMemo(
    () => ({
      protein: Math.round(dailyFoodNutrients.protein),
      carbs: Math.round(dailyFoodNutrients.carbs),
      fats: Math.round(dailyFoodNutrients.fat),
    }),
    [dailyFoodNutrients]
  );
  const loggedMealCount = React.useMemo(
    () => meals.filter((meal) => (meal.foodEntries?.length ?? 0) > 0).length,
    [meals]
  );
  const totalLoggedFoodEntries = React.useMemo(
    () => meals.reduce((sum, meal) => sum + (meal.foodEntries?.length ?? 0), 0),
    [meals]
  );
  const loggedFoodTrustSummary = React.useMemo(() => {
    const entries = meals.flatMap((meal) => meal.foodEntries ?? []);
    const trustProfiles = entries.map((entry) => resolveFoodTrust(entry));

    return {
      trusted: trustProfiles.filter((trust) => !trust.needsCheck).length,
      needsCheck: trustProfiles.filter((trust) => trust.needsCheck).length,
      macroOnly: trustProfiles.filter((trust) => trust.tone === "macro").length,
    };
  }, [meals]);
  const lastLoggedFood = React.useMemo(() => {
    const entries = meals.flatMap((meal) =>
      (meal.foodEntries ?? []).map((entry, index) => {
        const timestampMatch = entry.id.match(/-(\d{10,})-[a-z0-9]+$/i);
        const food = foodFromMealEntry(entry);

        return {
          entryId: entry.id,
          mealId: meal.id,
          mealName: meal.name,
          label: entry.brand ? `${entry.label} - ${entry.brand}` : entry.label,
          servings: entry.servings,
          servingOptionId: entry.selectedServingOptionId,
          food,
          loggedAt: timestampMatch ? Number(timestampMatch[1]) : index,
        };
      })
    );

    return entries.sort((a, b) => b.loggedAt - a.loggedAt)[0] ?? null;
  }, [meals]);
  const sortedFoodDayHistory = React.useMemo(
    () => [...foodDayHistory].sort((left, right) => right.date.localeCompare(left.date)),
    [foodDayHistory]
  );
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const yesterdayFoodSnapshot =
    sortedFoodDayHistory.find((item) => item.date === yesterdayIso) ??
    sortedFoodDayHistory.find((item) => item.date < todayIso) ??
    null;
  const selectedMeal = React.useMemo(
    () => meals.find((meal) => meal.id === selectedMealId) ?? meals[0] ?? null,
    [meals, selectedMealId]
  );
  const quickMacroValues = React.useMemo(
    () => ({
      protein: readMacroInput(quickMacros.protein),
      carbs: readMacroInput(quickMacros.carbs),
      fat: readMacroInput(quickMacros.fat),
    }),
    [quickMacros.carbs, quickMacros.fat, quickMacros.protein]
  );
  const quickMacroCalories = Math.round(
    quickMacroValues.protein * 4 + quickMacroValues.carbs * 4 + quickMacroValues.fat * 9
  );
  const quickMacroTargetMeal = React.useMemo(
    () => resolveClosestMealToClock(meals, quickMacroClockMinute),
    [meals, quickMacroClockMinute]
  );
  const userSavedMealTemplates = React.useMemo(
    () => mealTemplates.filter((template) => template.id.startsWith("template-")).slice(0, 4),
    [mealTemplates]
  );
  const foodBackedMealSources = React.useMemo(
    () => meals.filter((meal) => (meal.foodEntries?.length ?? 0) > 0),
    [meals]
  );
  const supportStackWatch = React.useMemo(
    () => supportStackCards.find((item) => item.label === "Current watch") ?? null,
    [supportStackCards]
  );
  const visibleSupplementProtocol = React.useMemo(
    () => canEditPlan ? supplementProtocol : supplementProtocol.filter((item) => item.enabled),
    [canEditPlan, supplementProtocol]
  );
  const activeSupplementCount = supplementProtocol.filter((item) => item.enabled).length;
  const caloriesConsumed = React.useMemo(
    () => Math.round(dailyFoodNutrients.calories),
    [dailyFoodNutrients.calories]
  );
  const calorieBalance = macroCalories - caloriesConsumed;
  const foodWeekDays = React.useMemo(() => {
    const historyByDate = new Map(sortedFoodDayHistory.map((item) => [item.date, item]));

    return Array.from({ length: 7 }, (_, index) => {
      const date = shiftIsoDate(todayIso, -6 + index);
      const snapshot = historyByDate.get(date);
      const isToday = date === todayIso;
      const calories = isToday ? caloriesConsumed : snapshot?.calories ?? 0;
      const protein = isToday ? loggedMacroTotals.protein : snapshot?.protein ?? 0;
      const foodEntries = isToday ? totalLoggedFoodEntries : snapshot?.foodEntries ?? 0;
      const targetCalories = isToday ? macroCalories : snapshot?.targetCalories || macroCalories;
      const targetProtein = isToday ? proteinTarget : snapshot?.targetProtein || proteinTarget;
      const logged = foodEntries > 0;
      const close =
        logged &&
        Math.max(0, targetCalories - calories) <= 250 &&
        Math.max(0, targetProtein - protein) <= 25;

      return {
        date,
        label: isToday ? "Today" : formatShortIsoDate(date),
        logged,
        close,
        calories,
        protein,
        foodEntries,
      };
    });
  }, [
    caloriesConsumed,
    loggedMacroTotals.protein,
    macroCalories,
    proteinTarget,
    sortedFoodDayHistory,
    todayIso,
    totalLoggedFoodEntries,
  ]);
  const foodWeekLoggedCount = foodWeekDays.filter((day) => day.logged).length;
  const foodWeekCloseCount = foodWeekDays.filter((day) => day.close).length;
  const remainingMacros = React.useMemo(
    () => [
      {
        label: "Calories",
        value: calorieBalance >= 0 ? `${calorieBalance} left` : `${Math.abs(calorieBalance)} over`,
        tone: calorieBalance >= 0 ? "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100",
      },
      {
        label: "Protein",
        value: `${Math.max(0, proteinTarget - loggedMacroTotals.protein)}g left`,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100",
      },
      {
        label: "Carbs",
        value: `${Math.max(0, carbTarget - loggedMacroTotals.carbs)}g left`,
        tone: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/30 dark:text-sky-100",
      },
      {
        label: "Fat",
        value: `${Math.max(0, fatTarget - loggedMacroTotals.fats)}g left`,
        tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100",
      },
    ],
    [
      calorieBalance,
      carbTarget,
      fatTarget,
      loggedMacroTotals.carbs,
      loggedMacroTotals.fats,
      loggedMacroTotals.protein,
      proteinTarget,
    ]
  );
  const nutritionReadinessScore = Math.round(
    clamp(
      (totalLoggedFoodEntries > 0 ? 22 : 0) +
        Math.min(28, (loggedMacroTotals.protein / Math.max(proteinTarget, 1)) * 28) +
        Math.min(26, (caloriesConsumed / Math.max(macroCalories, 1)) * 26) +
        Math.min(14, (loggedMealCount / Math.max(meals.length || 1, 1)) * 14) +
        (calorieBalance >= -100 ? 10 : 0),
      0,
      100
    )
  );
  const macroGapSuggestions = React.useMemo<MacroGapSuggestion[]>(() => {
    if (calorieBalance < -50) return [];

    const roundServings = (value: number) => Math.max(0.25, Math.min(3, Math.round(value * 4) / 4));
    const pickFood = (
      group: FoodCatalogItem["group"],
      macroKey: "protein" | "carbs" | "fat"
    ) =>
      availableFoods
        .filter((food) => food.group === group && food.nutrients[macroKey] > 0)
        .sort((left, right) => {
          const leftDensity = left.nutrients[macroKey] / Math.max(left.nutrients.calories, 1);
          const rightDensity = right.nutrients[macroKey] / Math.max(right.nutrients.calories, 1);
          return rightDensity - leftDensity;
        })[0] ?? null;

    const specs = [
      {
        label: "Protein",
        gap: proteinTarget - loggedMacroTotals.protein,
        group: "protein" as FoodCatalogItem["group"],
        macroKey: "protein" as const,
      },
      {
        label: "Carbs",
        gap: carbTarget - loggedMacroTotals.carbs,
        group: "carb" as FoodCatalogItem["group"],
        macroKey: "carbs" as const,
      },
      {
        label: "Fats",
        gap: fatTarget - loggedMacroTotals.fats,
        group: "fat" as FoodCatalogItem["group"],
        macroKey: "fat" as const,
      },
    ];

    return specs
      .filter((spec) => spec.gap >= 8)
      .filter((spec) => {
        if (spec.label === "Fats" && calorieBalance < 180) return false;
        if (spec.label === "Carbs" && calorieBalance < 120) return false;
        return true;
      })
      .map((spec) => {
        const food = pickFood(spec.group, spec.macroKey);
        if (!food) return null;
        const servings = roundServings(spec.gap / Math.max(food.nutrients[spec.macroKey], 1));
        const macroValue = Math.round(food.nutrients[spec.macroKey] * servings);
        const calories = Math.round(food.nutrients.calories * servings);

        return {
          label: spec.label,
          gap: spec.gap,
          food,
          servings,
          macroValue,
          calories,
        };
      })
      .filter(Boolean)
      .slice(0, 3) as MacroGapSuggestion[];
  }, [
    availableFoods,
    carbTarget,
    calorieBalance,
    fatTarget,
    loggedMacroTotals.carbs,
    loggedMacroTotals.fats,
    loggedMacroTotals.protein,
    proteinTarget,
  ]);
  const macroGapSolverEmptyMessage =
    calorieBalance < -50
      ? "Calories are already over target. Do not add gap foods; log only what was actually eaten."
      : calorieBalance < 120
        ? "Calories are tight. Add only lean protein if it was actually eaten."
        : "Macro targets are close enough. Log only real food eaten from here.";
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const intervalId = window.setInterval(() => {
      setQuickMacroClockMinute(getLocalClockMinutes());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  React.useEffect(() => {
    if (navigationIntent.nonce === 0 || typeof window === "undefined") return;

    const target =
      navigationIntent.section === "targets"
        ? controlsRef.current
        : navigationIntent.section === "builder"
          ? builderRef.current
          : navigationIntent.section === "templates"
            ? templateLibraryRef.current ?? builderRef.current
            : overviewRef.current;

    setHighlightedSection(navigationIntent.section);

    const frame = window.requestAnimationFrame(() => {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const timeout = window.setTimeout(() => {
      setHighlightedSection((current) => (current === navigationIntent.section ? null : current));
    }, 1800);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [navigationIntent.nonce, navigationIntent.section, navigationIntent.templateId]);

  React.useEffect(() => {
    if (!meals.some((meal) => meal.id === selectedMealId)) {
      setSelectedMealId(meals[0]?.id ?? "");
    }
  }, [meals, selectedMealId]);

  React.useEffect(() => {
    if (!foodBackedMealSources.some((meal) => meal.id === copySourceMealId)) {
      setCopySourceMealId(foodBackedMealSources[0]?.id ?? "");
    }
  }, [copySourceMealId, foodBackedMealSources]);

  React.useEffect(() => {
    setShowFullMealDiary(userMode === "coach");
  }, [userMode]);

  React.useEffect(() => {
    if (!foodSurfaceIntent || foodSurfaceIntent.nonce === 0) return;

    setFoodToolsTab(foodSurfaceIntent.surface);
    if (foodSurfaceIntent.surface === "add") {
      setFoodEntryIntent({
        mode: foodSurfaceIntent.entryMode ?? "search",
        nonce: foodSurfaceIntent.nonce,
      });
    }

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        foodToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [foodSurfaceIntent]);

  const sectionFocusClass = (section: NutritionNavigationIntent["section"]) =>
    highlightedSection === section
      ? "rounded-[34px] ring-2 ring-sky-300/80 ring-offset-2 ring-offset-transparent transition-shadow dark:ring-sky-400/40"
      : "";

  const openFoodEntry = React.useCallback((mode: FoodEntryMode) => {
    setFoodToolsTab("add");
    setFoodEntryIntent({
      mode,
      nonce: Date.now(),
    });
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        foodToolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const createMealAndSelect = React.useCallback(() => {
    const nextMealId = addMeal();
    setSelectedMealId(nextMealId);
    return nextMealId;
  }, [addMeal]);

  const updateQuickMacro = React.useCallback((key: QuickMacroKey, value: string) => {
    setQuickMacros((prev) => ({ ...prev, [key]: value }));
    setQuickMacroStatus("");
    setFoodActionMessage("");
  }, []);

  const logQuickMacros = React.useCallback(() => {
    if (quickMacroCalories <= 0) return;

    const targetMeal = resolveClosestMealToClock(meals, getLocalClockMinutes());
    const targetMealId = targetMeal?.id ?? createMealAndSelect();
    if (!targetMealId) return;

    const loggedAt = new Date();
    const timeLabel = loggedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const quickMacroFood: FoodCatalogItem = {
      id: `quick-macro-${loggedAt.getTime()}`,
      label: `Quick macros - ${timeLabel}`,
      source: "custom",
      group: "mixed",
      verified: true,
      servingLabel: "1 macro entry",
      searchTokens: ["quick macros", "macro entry", "fast log"],
      nutrients: {
        calories: quickMacroCalories,
        protein: quickMacroValues.protein,
        carbs: quickMacroValues.carbs,
        fat: quickMacroValues.fat,
      },
      note: "Macro-only fast log. Micronutrients are not estimated.",
    };

    addFoodEntriesToMeal(targetMealId, [
      {
        food: quickMacroFood,
        servings: 1,
        persistToCatalog: false,
        addToRecent: false,
      },
    ]);
    setSelectedMealId(targetMealId);
    setQuickMacros({ protein: "", carbs: "", fat: "" });
    setQuickMacroStatus(
      `Logged ${quickMacroValues.protein}P / ${quickMacroValues.carbs}C / ${quickMacroValues.fat}F to ${targetMeal?.name ?? "the new meal"} at ${timeLabel}.`
    );
    setFoodActionMessage("");
  }, [
    addFoodEntriesToMeal,
    createMealAndSelect,
    meals,
    quickMacroCalories,
    quickMacroValues.carbs,
    quickMacroValues.fat,
    quickMacroValues.protein,
  ]);

  const openFoodEntryForSelectedMeal = React.useCallback(
    (mode: FoodEntryMode) => {
      if (!selectedMeal) {
        createMealAndSelect();
      }
      openFoodEntry(mode);
    },
    [createMealAndSelect, openFoodEntry, selectedMeal]
  );

  const openFoodSearchForMeal = React.useCallback((mealId: string) => {
    setSelectedMealId(mealId);
    openFoodEntry("search");
  }, [openFoodEntry]);

  const toggleTemplateInfo = React.useCallback((templateId: string) => {
    setExpandedTemplateInfoIds((prev) => ({ ...prev, [templateId]: !prev[templateId] }));
  }, []);

  const toggleMealInfo = React.useCallback((mealId: string) => {
    setExpandedMealInfoIds((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
  }, []);

  const addSavedMealToToday = React.useCallback(
    (templateId: string) => {
      const template = mealTemplates.find((item) => item.id === templateId);
      const nextMealId = addMealFromTemplate(templateId);
      if (nextMealId) {
        setSelectedMealId(nextMealId);
        setFoodActionMessage(`Added ${template?.name ?? "saved meal"} to today.`);
      }
    },
    [addMealFromTemplate, mealTemplates]
  );

  const addSavedMealsAsDay = React.useCallback(() => {
    if (userSavedMealTemplates.length === 0) {
      setFoodActionMessage("Save a food-backed meal first, then you can copy the saved day.");
      return;
    }

    let firstMealId = "";
    userSavedMealTemplates.forEach((template) => {
      const nextMealId = addMealFromTemplate(template.id);
      if (!firstMealId && nextMealId) firstMealId = nextMealId;
    });

    if (firstMealId) {
      setSelectedMealId(firstMealId);
      setFoodActionMessage(`Copied ${userSavedMealTemplates.length} saved meal${userSavedMealTemplates.length === 1 ? "" : "s"} into today.`);
    }
  }, [addMealFromTemplate, userSavedMealTemplates]);

  const saveTodayFoodDay = React.useCallback(() => {
    saveFoodDaySnapshot();
    if (totalLoggedFoodEntries > 0) {
      setFoodActionMessage("Saved today's food day for weekly review and repeat-day recovery.");
    }
  }, [saveFoodDaySnapshot, totalLoggedFoodEntries]);

  const copyHistoryDayToToday = React.useCallback(
    (date: string, mode: "replace" | "append" = "replace") => {
      copyFoodDayToToday(date, mode);
      const label = date === yesterdayIso ? "yesterday" : formatShortIsoDate(date);
      setFoodActionMessage(`${mode === "append" ? "Added" : "Copied"} ${label}'s food day into today.`);
    },
    [copyFoodDayToToday, yesterdayIso]
  );

  const replaceSelectedMealWithTemplate = React.useCallback(
    (templateId: string) => {
      if (!selectedMeal) return;
      const template = mealTemplates.find((item) => item.id === templateId);
      applyMealTemplate(selectedMeal.id, templateId);
      setSelectedMealId(selectedMeal.id);
      setFoodActionMessage(`Replaced ${selectedMeal.name} with ${template?.name ?? "saved meal"}.`);
    },
    [applyMealTemplate, mealTemplates, selectedMeal]
  );

  const copyMealEntriesToTarget = React.useCallback(
    (sourceMealId: string, mode: "append" | "replace") => {
      const sourceMeal = meals.find((meal) => meal.id === sourceMealId);
      const sourceEntries = sourceMeal?.foodEntries ?? [];
      const targetMealId = selectedMeal?.id ?? createMealAndSelect();
      if (!sourceMeal || sourceEntries.length === 0 || !targetMealId) return;

      const targetMeal = meals.find((meal) => meal.id === targetMealId);

      if (mode === "replace") {
        (targetMeal?.foodEntries ?? []).forEach((entry) => {
          removeMealFoodEntry(targetMealId, entry.id);
        });
      }

      addFoodEntriesToMeal(
        targetMealId,
        sourceEntries.map((entry) => ({
          food: foodFromMealEntry(entry),
          servings: entry.servings,
          servingOptionId: entry.selectedServingOptionId,
        }))
      );
      setSelectedMealId(targetMealId);
      setFoodActionMessage(
        `${mode === "replace" ? "Replaced" : "Copied"} ${targetMeal?.name ?? "selected meal"} with ${sourceMeal.name} foods.`
      );
    },
    [addFoodEntriesToMeal, createMealAndSelect, meals, removeMealFoodEntry, selectedMeal]
  );

  const repeatLastLoggedFood = React.useCallback(() => {
    if (!lastLoggedFood) return;
    const targetMealId = selectedMeal?.id ?? lastLoggedFood.mealId;
    const targetMeal = meals.find((meal) => meal.id === targetMealId);

    addFoodEntriesToMeal(targetMealId, [
      {
        food: lastLoggedFood.food,
        servings: lastLoggedFood.servings,
        servingOptionId: lastLoggedFood.servingOptionId,
      },
    ]);
    setSelectedMealId(targetMealId);
    setFoodActionMessage(`Repeated ${lastLoggedFood.label} to ${targetMeal?.name ?? "selected meal"}.`);
  }, [addFoodEntriesToMeal, lastLoggedFood, meals, selectedMeal]);

  const undoLastLoggedFood = React.useCallback(() => {
    if (!lastLoggedFood) return;
    removeMealFoodEntry(lastLoggedFood.mealId, lastLoggedFood.entryId);
    setFoodActionMessage(`Removed ${lastLoggedFood.label} from ${lastLoggedFood.mealName}.`);
  }, [lastLoggedFood, removeMealFoodEntry]);

  const logMacroGapSuggestion = React.useCallback(
    (suggestion: MacroGapSuggestion) => {
      const targetMealId = selectedMeal?.id ?? createMealAndSelect();
      if (!targetMealId) return;
      const targetMeal = meals.find((meal) => meal.id === targetMealId);

      addFoodEntriesToMeal(targetMealId, [
        {
          food: suggestion.food,
          servings: suggestion.servings,
        },
      ]);
      setSelectedMealId(targetMealId);
      setFoodActionMessage(`Added ${suggestion.food.label} to ${targetMeal?.name ?? "selected meal"}.`);
    },
    [addFoodEntriesToMeal, createMealAndSelect, meals, selectedMeal]
  );

  const saveMealAsRecipe = React.useCallback(
    (meal: Meal) => {
      const entries = meal.foodEntries ?? [];
      if (entries.length === 0) return;

      addCustomFoods([
        createRecipeFoodItem({
          label: meal.name,
          items: entries.map((entry) => ({
            foodId: entry.foodId,
            label: entry.label,
            brand: entry.brand,
            source: entry.source,
            group: entry.group,
            servings: entry.servings,
            servingLabel: entry.servingLabel,
            servingGrams: entry.servingGrams,
            nutrients: entry.nutrients,
          })),
          note: `Saved from ${meal.name} at ${meal.timing}.`,
        }),
      ]);
    },
    [addCustomFoods]
  );

  const plannedMacroCalories = mealTotals.protein * 4 + mealTotals.carbs * 4 + mealTotals.fats * 9;
  const targetCalorieMax = Math.max(macroCalories, plannedMacroCalories, caloriesConsumed, 1);
  const hydrationTarget = trainingDay ? 4 : 3.25;
  const renderFoodControlBarsPanel = () => (
    <InfographicPanel
      title="Target bars"
      right={<Badge variant="outline">{plannedMacroCalories} kcal planned</Badge>}
    >
      <div className="grid gap-3 xl:grid-cols-[1.08fr_0.92fr]">
        <ComparisonBars
          rows={[
            { label: "Protein", current: mealTotals.protein, next: proteinTarget, unit: "g", tone: "emerald" },
            { label: "Carbs", current: mealTotals.carbs, next: carbTarget, unit: "g", tone: "sky" },
            { label: "Fats", current: mealTotals.fats, next: fatTarget, unit: "g", tone: "amber" },
          ]}
        />
        <div className="grid gap-3">
          <BulletChart
            label="Calories"
            value={caloriesConsumed > 0 ? caloriesConsumed : plannedMacroCalories}
            target={macroCalories}
            max={Math.max(targetCalorieMax * 1.12, 1)}
            unit=" kcal"
            tone={calorieBalance >= -100 ? "sky" : "amber"}
          />
          <BulletChart
            label="Hydration"
            value={waterLiters}
            target={hydrationTarget}
            max={Math.max(hydrationTarget * 1.2, waterLiters, 1)}
            unit=" L"
            tone="cyan"
          />
        </div>
      </div>
    </InfographicPanel>
  );

  const mobileFoodCapturePanel = (
    <div className="rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-3 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/25 dark:via-slate-950/55 dark:to-sky-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
            Food capture
          </div>
          <div className="mt-1 truncate text-base font-semibold text-slate-950 dark:text-slate-100">
            {calorieBalance >= 0 ? `${calorieBalance} kcal left` : `${Math.abs(calorieBalance)} kcal over`}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
            {loggedMacroTotals.protein}P / {loggedMacroTotals.carbs}C / {loggedMacroTotals.fats}F logged
          </div>
        </div>
        <Badge
          variant="outline"
          className={[
            "shrink-0",
            loggedFoodTrustSummary.needsCheck > 0
              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100"
              : "",
          ].join(" ")}
        >
          {loggedFoodTrustSummary.needsCheck > 0
            ? `${loggedFoodTrustSummary.needsCheck} check`
            : `${totalLoggedFoodEntries} food${totalLoggedFoodEntries === 1 ? "" : "s"}`}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2">
        <select
          value={selectedMealId}
          onChange={(event) => setSelectedMealId(event.target.value)}
          className="h-10 w-full rounded-[16px] border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
        >
          {meals.length === 0 ? <option value="">New meal</option> : null}
          {meals.map((meal) => (
            <option key={`mobile-target-${meal.id}`} value={meal.id}>
              {meal.name} - {meal.timing}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-4 gap-1.5">
          <Button size="sm" className="h-9 px-2 text-[11px]" onClick={() => openFoodEntryForSelectedMeal("search")}>
            <Search className="mr-1 h-3.5 w-3.5" />
            Search
          </Button>
          <Button size="sm" variant="outline" className="h-9 px-2 text-[11px]" onClick={() => openFoodEntryForSelectedMeal("scan")}>
            <ScanLine className="mr-1 h-3.5 w-3.5" />
            Scan
          </Button>
          <Button size="sm" variant="outline" className="h-9 px-2 text-[11px]" onClick={() => openFoodEntryForSelectedMeal("custom")}>
            Custom
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-2 text-[11px]"
            onClick={repeatLastLoggedFood}
            disabled={!lastLoggedFood}
          >
            Repeat
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-[18px] border border-white/80 bg-white/82 p-2.5 dark:border-white/10 dark:bg-slate-950/45">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
          {quickMacroInputs.map((item) => (
            <label key={`mobile-${item.key}`} className="min-w-0">
              <span className="sr-only">{item.label}</span>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={quickMacros[item.key]}
                onChange={(event) => updateQuickMacro(item.key, event.target.value)}
                className="h-9 rounded-[14px] px-2 text-center text-sm font-semibold"
                placeholder={item.key === "protein" ? "P" : item.key === "carbs" ? "C" : "F"}
              />
            </label>
          ))}
          <Button
            size="sm"
            className="h-9 px-3 text-[11px]"
            onClick={logQuickMacros}
            disabled={quickMacroCalories <= 0}
          >
            Log
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="truncate">
            {quickMacroCalories > 0
              ? `${quickMacroCalories} kcal`
              : quickMacroTargetMeal
                ? `Closest meal: ${quickMacroTargetMeal.name}`
                : "Macro-only fast log"}
          </span>
          <button
            type="button"
            className="font-semibold text-slate-700 dark:text-slate-200"
            onClick={() => setFoodToolsTab(foodToolsTab === "insights" ? "log" : "insights")}
          >
            {foodToolsTab === "insights" ? "Log" : "Review"}
          </button>
        </div>
        {quickMacroStatus ? (
          <div className="mt-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
            {quickMacroStatus}
          </div>
        ) : null}
      </div>

      {lastLoggedFood ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-[16px] border border-slate-200 bg-white/72 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.05]">
          <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
            Last: {lastLoggedFood.label}
          </span>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={undoLastLoggedFood}>
            Undo
          </Button>
        </div>
      ) : null}
    </div>
  );

  const foodModeControls: Array<{ value: FoodToolsTab; label: string; helper: string }> = [
    { value: "log", label: "Log", helper: `${totalLoggedFoodEntries} foods` },
    { value: "add", label: "Add", helper: selectedMeal?.name ?? "Meal" },
    { value: "insights", label: "Targets", helper: `${nutritionReadinessScore}% signal` },
  ];

  const desktopMacroProgressRows = [
    {
      label: "Protein",
      current: loggedMacroTotals.protein,
      target: proteinTarget,
      color: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-200",
    },
    {
      label: "Carbs",
      current: loggedMacroTotals.carbs,
      target: carbTarget,
      color: "bg-sky-500",
      text: "text-sky-700 dark:text-sky-200",
    },
    {
      label: "Fat",
      current: loggedMacroTotals.fats,
      target: fatTarget,
      color: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-200",
    },
  ];

  const desktopFoodCommandPanel = (
    <SectionCard
      title="Food"
      right={(
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{nutritionReadinessScore}% signal</Badge>
          {loggedFoodTrustSummary.needsCheck > 0 ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
              {loggedFoodTrustSummary.needsCheck} labels to check
            </Badge>
          ) : null}
          {loggedFoodTrustSummary.macroOnly > 0 ? (
            <Badge variant="outline">{loggedFoodTrustSummary.macroOnly} macro-only</Badge>
          ) : null}
          <Badge variant="outline">{trainingDay ? "Training" : "Off day"}</Badge>
        </div>
      )}
    >
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white/72 shadow-sm dark:border-white/10 dark:bg-slate-950/28">
        <div className="grid lg:grid-cols-[1.04fr_1fr_0.82fr]">
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
              Today
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-slate-950 dark:text-slate-100">
                  {calorieBalance >= 0 ? `${calorieBalance} kcal left` : `${Math.abs(calorieBalance)} kcal over`}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {caloriesConsumed} / {macroCalories} kcal
                </div>
              </div>
              <Badge className={calorieBalance >= -100 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>
                {loggedMealCount} / {meals.length} meals
              </Badge>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className={calorieBalance >= -100 ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-amber-500"}
                style={{ width: `${clamp((caloriesConsumed / Math.max(macroCalories, 1)) * 100, 0, 100)}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3">
              {desktopMacroProgressRows.map((item) => {
                const progress = clamp((item.current / Math.max(item.target, 1)) * 100, 0, 100);
                return (
                  <div key={`desktop-food-command-${item.label}`} className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <span className={item.text}>{item.label}</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {item.current} / {item.target}g
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-white/10 lg:border-l lg:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">
                  Target meal
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {selectedMeal?.name ?? "No meal selected"}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={createMealAndSelect}>
                <Plus className="mr-2 h-4 w-4" />
                New meal
              </Button>
            </div>

            <select
              value={selectedMealId}
              onChange={(event) => setSelectedMealId(event.target.value)}
              className="mt-3 w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
            >
              {meals.length === 0 ? <option value="">New meal</option> : null}
              {meals.map((meal) => (
                <option key={`desktop-target-${meal.id}`} value={meal.id}>
                  {meal.name} - {meal.timing}
                </option>
              ))}
            </select>

            {selectedMeal ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Meal macros</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {selectedMeal.protein}P / {selectedMeal.carbs}C / {selectedMeal.fats}F
                  </div>
                </div>
                <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Logged here</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {selectedMeal.foodEntries?.length ?? 0} item{(selectedMeal.foodEntries?.length ?? 0) === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={repeatLastLoggedFood} disabled={!lastLoggedFood}>
                Repeat last
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={undoLastLoggedFood}
                disabled={!lastLoggedFood}
                title={lastLoggedFood ? `Remove ${lastLoggedFood.label}` : "No logged food to undo"}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </Button>
            </div>
            {lastLoggedFood ? (
              <div className="mt-3 truncate text-sm text-slate-500 dark:text-slate-400">
                Last: {lastLoggedFood.label}
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-white/10 lg:border-l lg:border-t-0">
            <div className="grid gap-2">
              {foodModeControls.map((item) => (
                <Button
                  key={`food-mode-${item.value}`}
                  type="button"
                  variant={foodToolsTab === item.value ? "default" : "outline"}
                  className="h-auto justify-between gap-3 px-3 py-2.5"
                  onClick={() => setFoodToolsTab(item.value)}
                >
                  <span>{item.label}</span>
                  <span className="text-[11px] font-medium opacity-75">{item.helper}</span>
                </Button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button size="sm" onClick={() => openFoodEntryForSelectedMeal("search")}>
                <Search className="mr-1.5 h-4 w-4" />
                Search
              </Button>
              <Button size="sm" variant="outline" onClick={() => openFoodEntryForSelectedMeal("scan")}>
                <ScanLine className="mr-1.5 h-4 w-4" />
                Scan
              </Button>
              <Button size="sm" variant="outline" onClick={() => openFoodEntryForSelectedMeal("custom")}>
                Custom
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                {loggedFoodTrustSummary.trusted} trusted today
              </div>
              <div
                className={[
                  "rounded-[16px] border px-3 py-2",
                  loggedFoodTrustSummary.needsCheck > 0
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100"
                    : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.04]",
                ].join(" ")}
              >
                {loggedFoodTrustSummary.needsCheck > 0
                  ? `${loggedFoodTrustSummary.needsCheck} check label`
                  : `${availableFoods.length} searchable`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const foodContinuityPanel = (
    <div className="rounded-[24px] border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-3 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/20 dark:via-slate-950/60 dark:to-sky-950/18">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
            Food week
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
            {foodWeekCloseCount}/{foodWeekDays.length} days on target, {foodWeekLoggedCount} logged
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {yesterdayFoodSnapshot
              ? `Fast recovery: copy ${yesterdayFoodSnapshot.date === yesterdayIso ? "yesterday" : formatShortIsoDate(yesterdayFoodSnapshot.date)} instead of rebuilding the day.`
              : "Save one food-backed day to unlock one-tap repeat logging."}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button size="sm" onClick={saveTodayFoodDay} disabled={totalLoggedFoodEntries === 0}>
            Save today
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => yesterdayFoodSnapshot ? copyHistoryDayToToday(yesterdayFoodSnapshot.date, "replace") : setFoodActionMessage("Save a previous food day before using copy yesterday.")}
            disabled={!yesterdayFoodSnapshot}
          >
            Copy yesterday
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => yesterdayFoodSnapshot ? copyHistoryDayToToday(yesterdayFoodSnapshot.date, "append") : setFoodActionMessage("Save a previous food day before adding it to today.")}
            disabled={!yesterdayFoodSnapshot}
          >
            Add to today
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {foodWeekDays.map((day) => (
          <button
            key={`food-week-${day.date}`}
            type="button"
            onClick={() => day.logged && day.date !== todayIso ? copyHistoryDayToToday(day.date, "replace") : undefined}
            disabled={!day.logged || day.date === todayIso}
            className={[
              "min-h-[54px] rounded-[14px] border px-1.5 py-2 text-center transition",
              day.close
                ? "border-emerald-200 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-100"
                : day.logged
                  ? "border-amber-200 bg-amber-100/75 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-100"
                  : "border-rose-100 bg-rose-50/70 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100",
              day.logged && day.date !== todayIso ? "hover:-translate-y-[1px] hover:shadow-sm" : "cursor-default opacity-80",
            ].join(" ")}
            title={day.logged ? `${day.foodEntries} foods, ${day.calories} kcal` : "No food saved"}
          >
            <div className="truncate text-[10px] font-semibold uppercase tracking-[0.04em]">{day.label}</div>
            <div className="mt-1 text-xs font-semibold">{day.logged ? `${day.foodEntries} foods` : "Open"}</div>
          </button>
        ))}
      </div>

      {sortedFoodDayHistory.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {sortedFoodDayHistory.slice(0, 3).map((snapshot) => (
            <div
              key={`food-history-${snapshot.date}`}
              className="rounded-[16px] border border-white/70 bg-white/76 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-950 dark:text-slate-100">
                    {snapshot.date === todayIso ? "Today" : formatShortIsoDate(snapshot.date)}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-300">
                    {snapshot.calories} kcal, {snapshot.protein}P / {snapshot.carbs}C / {snapshot.fats}F
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => copyHistoryDayToToday(snapshot.date, "replace")}>
                  Copy
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  const mealStructurePanel = canEditPlan ? (
    <div className="grid gap-5">
      <div ref={builderRef} className={sectionFocusClass(navigationIntent.section === "templates" ? "templates" : "builder")}>
        <AdvancedEditorCard
          title="Meal builder"
          description="Tune exceptions only. Fueling blocks come first."
          open={showNutritionEditor}
          onToggle={toggleNutritionEditor}
          summary={`${meals.length} meals loaded${loggedMealCount > 0 ? ` - ${loggedMealCount} food-backed` : ""}`}
        >
          <div className="space-y-4 max-h-[720px] overflow-auto pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={addMeal}><Plus className="mr-2 h-4 w-4" />Add meal</Button>
              <Badge variant="outline">{meals.length} meals</Badge>
              <Badge variant="outline">{mealTotals.protein}P / {mealTotals.carbs}C / {mealTotals.fats}F</Badge>
            </div>

            <div ref={templateLibraryRef} className={[navigationIntent.section === "templates" && highlightedSection === "templates" ? "rounded-[28px] ring-2 ring-sky-300/80 ring-offset-2 ring-offset-transparent dark:ring-sky-400/40" : ""].join(" ")}>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Meal templates</div>
                  <Badge variant="outline">{mealTemplates.length} saved</Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {mealTemplates.slice(0, 6).map((template) => {
                const templateProfile = buildMealTemplateScientificProfile(template);
                const isTemplateFocused =
                  highlightedSection === "templates" && navigationIntent.templateId === template.id;
                const showTemplateInfo = Boolean(expandedTemplateInfoIds[template.id]);
                return (
                  <div
                    key={`${template.id}-quick-add`}
                    className={[
                      "rounded-[18px] border bg-white px-3 py-3 transition hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950/40",
                      isTemplateFocused ? "border-sky-300 ring-2 ring-sky-200 dark:border-sky-400/60" : "border-slate-200",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{template.name}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {template.protein}P / {template.carbs}C / {template.fats}F
                        </div>
                      </div>
                      <Badge variant="outline">{template.type ?? "meal"}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => addMealFromTemplate(template.id)}>Add meal</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleTemplateInfo(template.id)}>
                        {showTemplateInfo ? "Hide info" : "Additional info"}
                      </Button>
                    </div>
                    {showTemplateInfo ? (
                      <div className="mt-3 rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">{templateProfile.detail}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {templateProfile.chips.slice(0, 3).map((chip) => (
                            <Badge key={`${template.id}-${chip}`} variant="outline">{chip}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {meals.map((meal, index) => {
                const mealHasFoodEntries = (meal.foodEntries?.length ?? 0) > 0;
                const showMealInfo = Boolean(expandedMealInfoIds[meal.id]);
                const mealTrustSummary = summarizeFoodEntryTrust(meal.foodEntries);

                return (
                  <div key={meal.id} className={[softPanelClass, panelHoverClass, "space-y-4 rounded-[24px] p-4"].join(" ")}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input value={meal.name} onChange={(event) => updateMeal(meal.id, { name: event.target.value })} className="max-w-[220px]" />
                        <Badge className={mealTypeTone(meal.type)}>{meal.type ?? "standard"}</Badge>
                        {mealHasFoodEntries ? <Badge variant="outline">Food-backed</Badge> : null}
                        {mealTrustSummary.needsCheck > 0 ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                            {mealTrustSummary.needsCheck} label check
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openFoodSearchForMeal(meal.id)}>
                          <Search className="mr-2 h-4 w-4" />
                          Log foods
                        </Button>
                        {mealHasFoodEntries ? (
                          <Button size="sm" variant="outline" onClick={() => saveMealAsRecipe(meal)}>
                            <Star className="mr-2 h-4 w-4" />
                            Save recipe
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => moveMeal(meal.id, -1)}>Up</Button>
                        <Button size="sm" variant="outline" onClick={() => moveMeal(meal.id, 1)}>Down</Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateMeal(meal.id)}>Duplicate</Button>
                        <Button
                          size="sm"
                          variant={pendingMealDeleteId === meal.id ? "outline" : "ghost"}
                          onClick={() => removeMeal(meal.id)}
                        >
                          {pendingMealDeleteId === meal.id ? (
                            "Confirm delete"
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                      <div className="space-y-2">
                        <Label>Timing</Label>
                        <Input value={meal.timing} onChange={(event) => updateMeal(meal.id, { timing: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Protein</Label>
                        <Input
                          type="number"
                          value={meal.protein}
                          disabled={mealHasFoodEntries}
                          onChange={(event) => updateMeal(meal.id, { protein: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Carbs</Label>
                        <Input
                          type="number"
                          value={meal.carbs}
                          disabled={mealHasFoodEntries}
                          onChange={(event) => updateMeal(meal.id, { carbs: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fats</Label>
                        <Input
                          type="number"
                          value={meal.fats}
                          disabled={mealHasFoodEntries}
                          onChange={(event) => updateMeal(meal.id, { fats: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2 xl:col-span-2">
                        <Label>Template</Label>
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <select
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                            defaultValue=""
                            onChange={(event) => {
                              if (event.target.value) {
                                applyMealTemplate(meal.id, event.target.value);
                                event.target.value = "";
                              }
                            }}
                          >
                            <option value="">Apply saved template</option>
                            {mealTemplates.map((template) => (
                              <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                          </select>
                          <Button size="sm" variant="outline" onClick={() => saveMealAsTemplate(meal.id)}>Save current</Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["standard", "pre", "intra", "post", "off"] as Meal["type"][]).map((mode) => (
                            <Button key={mode} size="sm" variant="outline" onClick={() => assignMealTemplate(meal.id, mode)}>{mode}</Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleMealInfo(meal.id)}>
                        {showMealInfo ? "Hide info" : "Additional info"}
                      </Button>
                    </div>

                    {showMealInfo ? (
                      <div
                        className={
                          mealHasFoodEntries
                            ? "rounded-[20px] border border-sky-200 bg-sky-50/80 px-3 py-3 text-sm leading-6 text-sky-900"
                            : "rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                        }
                      >
                        <div>
                          {mealHasFoodEntries
                            ? "Calculated from logged foods. Adjust servings below or add another item from the food library."
                            : "Macro-planned only. Use Log foods when you want the meal tied to actual entries."}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/70 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            Calories: {meal.protein * 4 + meal.carbs * 4 + meal.fats * 9}
                          </div>
                          <div className="rounded-2xl border border-white/70 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            Position {index + 1} in meal flow
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {mealHasFoodEntries ? (
                      <div className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Logged foods
                          </div>
                          <Badge variant="outline">
                            {meal.foodEntries?.length ?? 0} item{(meal.foodEntries?.length ?? 0) === 1 ? "" : "s"}
                          </Badge>
                        </div>

                        {meal.foodEntries?.map((entry) => {
                          const trust = resolveFoodTrust(entry);

                          return (
                            <div
                              key={entry.id}
                              className={[
                                "grid gap-3 rounded-[18px] border bg-white px-3 py-3 shadow-sm dark:bg-slate-950/40 sm:grid-cols-[1fr_auto_auto_auto]",
                                trust.needsCheck
                                  ? "border-amber-200 dark:border-amber-500/25"
                                  : "border-slate-200 dark:border-white/10",
                              ].join(" ")}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {entry.brand ? `${entry.label} - ${entry.brand}` : entry.label}
                                  </div>
                                  <Badge className={foodTrustBadgeClass(trust.tone)}>{trust.label}</Badge>
                                </div>
                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                  {entry.servingLabel} - {entry.nutrients.calories} kcal, {entry.nutrients.protein}P / {entry.nutrients.carbs}C / {entry.nutrients.fat}F per serving
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                  {trust.detail}
                                </div>
                                {entry.recipeItems?.length ? (
                                  <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    Recipe with {entry.recipeItems.length} ingredient{entry.recipeItems.length === 1 ? "" : "s"}.
                                  </div>
                                ) : null}
                              </div>
                            <div className="space-y-2">
                              <Label>Unit</Label>
                              <select
                                value={entry.selectedServingOptionId ?? "serving"}
                                onChange={(event) =>
                                  updateMealFoodEntryUnit(meal.id, entry.id, event.target.value)
                                }
                                className="w-[170px] rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                              >
                                {getFoodServingOptions({
                                  servingLabel: entry.baseServingLabel ?? entry.servingLabel,
                                  servingGrams: entry.baseServingGrams ?? entry.servingGrams,
                                  servingOptions: entry.servingOptions,
                                }).map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Servings</Label>
                              <Input
                                type="number"
                                min={0.25}
                                step={0.25}
                                value={entry.servings}
                                onChange={(event) =>
                                  updateMealFoodEntryServings(
                                    meal.id,
                                    entry.id,
                                    Math.max(0.25, Number(event.target.value) || 0.25)
                                  )
                                }
                                className="w-24"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                size="sm"
                                variant={pendingFoodEntryDeleteId === `${meal.id}:${entry.id}` ? "outline" : "ghost"}
                                onClick={() => requestRemoveMealFoodEntry(meal.id, entry.id)}
                              >
                                {pendingFoodEntryDeleteId === `${meal.id}:${entry.id}` ? (
                                  "Confirm"
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                  </div>
                );
              })}
            </div>
          </div>
        </AdvancedEditorCard>
      </div>
    </div>
  ) : null;

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <div ref={foodToolsRef}>
        <div className="md:hidden">
          {mobileFoodCapturePanel}
        </div>
        <div className="hidden md:block">
          {desktopFoodCommandPanel}
        </div>
      </div>

      {foodContinuityPanel}

      {foodToolsTab === "insights" ? (
        <>
      <WorkspaceSummaryRail
        title="Food review"
        items={nutritionFocusCards}
      />

      <div ref={overviewRef} className={sectionFocusClass("overview")}>
        <SectionCard
          title={userMode === "coach" ? "Fueling decision layer" : "Food review"}
        >
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <DecisionSpotlight
                eyebrow={userMode === "coach" ? "Current food decision" : "Insight summary"}
                title={nutritionPrimaryAction.title}
                description={nutritionPrimaryAction.body}
                tone="emerald"
              >
                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Button onClick={applyMacroPreset}>{nutritionPrimaryAction.cta}</Button>
                  <Button
                    variant="outline"
                    onClick={() => openTrackerSurface(userMode === "coach" ? "dashboard" : "log")}
                  >
                    {userMode === "coach" ? "Today dashboard" : "Today log"}
                  </Button>
                  <Button variant="outline" onClick={() => openTrackerSurface("week")}>Week</Button>
                </div>

                {isCoachView ? (
                  <div className="mt-4 rounded-[22px] border border-white/80 bg-white/78 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Operating rule</div>
                    <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      Make the smallest useful change. The day should read cleaner after the adjustment, not more complicated.
                    </div>
                  </div>
                ) : null}
              </DecisionSpotlight>

              <div className="grid gap-3">
                {visibleNutritionDecisionTiles.map((item) => (
                  <SignalTile
                    key={item.label}
                    label={item.label}
                    title={item.title}
                    detail={item.detail}
                    tone={item.tone}
                    onClick={item.onClick}
                  />
                ))}
              </div>
            </div>

            {visibleNutritionWindowSummary.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {visibleNutritionWindowSummary.map((item) => (
                <SignalTile
                  key={item.label}
                  label={item.label}
                  title={item.title}
                  detail={item.detail}
                  tone={item.tone}
                  onClick={item.onClick}
                />
              ))}
            </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <div className={isCoachView ? "grid gap-5 xl:grid-cols-[1.1fr_0.9fr]" : "grid gap-5"}>
        {isCoachView ? (
        <SectionCard title="Food workflow">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Primary action</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{nutritionPrimaryAction.title}</div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{nutritionPrimaryAction.body}</p>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button onClick={applyMacroPreset}>{nutritionPrimaryAction.cta}</Button>
                <Button
                  variant="outline"
                  onClick={() => openTrackerSurface(userMode === "coach" ? "dashboard" : "log")}
                >
                  {userMode === "coach" ? "Today dashboard" : "Today log"}
                </Button>
                <Button variant="outline" onClick={() => openTrackerSurface("week")}>Week</Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Day type</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{trainingDay ? "Training" : "Off"}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{nutritionPreset}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Target macros</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{proteinTarget}P / {carbTarget}C / {fatTarget}F</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{macroCalories} kcal, delta {calorieDelta}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsStat label="Protein" value={loggedMacroTotals.protein} helper={`Target ${proteinTarget}`} tone={metricsTone(clamp((loggedMacroTotals.protein / Math.max(proteinTarget, 1)) * 10, 0, 10))} />
                <AnalyticsStat label="Carbs" value={loggedMacroTotals.carbs} helper={`Target ${carbTarget}`} tone={metricsTone(clamp((loggedMacroTotals.carbs / Math.max(carbTarget, 1)) * 10, 0, 10))} />
                <AnalyticsStat label="Fats" value={loggedMacroTotals.fats} helper={`Target ${fatTarget}`} tone={metricsTone(clamp((loggedMacroTotals.fats / Math.max(fatTarget, 1)) * 10, 0, 10))} />
                <AnalyticsStat label="Hydration" value={`${waterLiters.toFixed(1)}L`} helper={`${saltTsp.toFixed(2)} tsp salt`} tone={metricsTone(trainingDay ? 7 : 6)} />
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Nutrition risks</div>
                <div className="mt-3 space-y-2">
                  {nutritionRiskFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">No major fueling risks right now.</div>
                  ) : (
                    nutritionRiskFlags.map((flag, index) => (
                      <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">{flag}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
        ) : null}

        <div ref={controlsRef} className={sectionFocusClass("targets")}>
          <SectionCard title={isCoachView ? "Food controls" : "Targets"}>
            {isCoachView ? (
              <div className="space-y-4">
                {renderFoodControlBarsPanel()}
                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    ["Protein", proteinTarget, setProteinTarget, 120, 320, 5, "g"],
                    ["Carbs", carbTarget, setCarbTarget, 50, 550, 5, "g"],
                    ["Fats", fatTarget, setFatTarget, 20, 120, 1, "g"],
                    ["Estimated TDEE", estimatedTdee, setEstimatedTdee, 1600, 5000, 25, "kcal"],
                    ["Water", waterLiters, setWaterLiters, 2, 8, 0.25, "L"],
                    ["Salt", saltTsp, setSaltTsp, 0.5, 3.5, 0.25, "tsp"],
                  ] as const).map(([label, value, setter, min, max, step, suffix]) => (
                    <label key={String(label)} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span>{label}</span>
                        <span className="text-slate-500">{value}{suffix}</span>
                      </div>
                      <input
                        type="range"
                        min={Number(min)}
                        max={Number(max)}
                        step={Number(step)}
                        value={Number(value)}
                        onChange={(event) => setter(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 dark:bg-slate-700"
                      />
                    </label>
                  ))}
                </div>
                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Button variant="outline" onClick={applyMacroPreset}>Apply preset</Button>
                  <Button variant={trainingDay ? "default" : "outline"} onClick={() => setTrainingDay(true)}>Training day</Button>
                  <Button variant={!trainingDay ? "default" : "outline"} onClick={() => setTrainingDay(false)}>Off day</Button>
                  <Button variant="outline" onClick={addMeal}>Add meal</Button>
                  <Button variant="outline" onClick={toggleNutritionEditor}>Meal builder</Button>
                </div>
              </div>
            ) : canEditPlan ? (
              <div className="space-y-4">
                {renderFoodControlBarsPanel()}

                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Button variant="outline" onClick={applyMacroPreset}>Apply preset</Button>
                  <Button variant={trainingDay ? "default" : "outline"} onClick={() => setTrainingDay(true)}>Training day</Button>
                  <Button variant={!trainingDay ? "default" : "outline"} onClick={() => setTrainingDay(false)}>Off day</Button>
                  <Badge variant="outline">{trainingDay ? "Training" : "Off"}</Badge>
                  <Badge variant="outline">{meals.length} meals / {loggedMealCount} logged</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Water</div>
                    <Input type="number" step="0.25" value={waterLiters} onChange={(event) => setWaterLiters(Number(event.target.value))} />
                  </label>
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Salt</div>
                    <Input type="number" step="0.25" value={saltTsp} onChange={(event) => setSaltTsp(Number(event.target.value))} />
                  </label>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Nutrition risks</div>
                  <div className="mt-3 space-y-2">
                    {nutritionRiskFlags.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">Meals are aligned with the current target.</div>
                    ) : (
                      nutritionRiskFlags.map((flag, index) => (
                        <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">{flag}</div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Advanced target controls</div>
                    <Button variant="outline" size="sm" onClick={toggleNutritionControls}>
                      {showNutritionControls ? "Hide advanced" : "Show advanced"}
                    </Button>
                  </div>

                  {showNutritionControls ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {([
                        ["Protein", proteinTarget, setProteinTarget, 120, 320, 5, "g"],
                        ["Carbs", carbTarget, setCarbTarget, 50, 550, 5, "g"],
                        ["Fats", fatTarget, setFatTarget, 20, 120, 1, "g"],
                        ["Estimated TDEE", estimatedTdee, setEstimatedTdee, 1600, 5000, 25, "kcal"],
                        ["Water", waterLiters, setWaterLiters, 2, 8, 0.25, "L"],
                        ["Salt", saltTsp, setSaltTsp, 0.5, 3.5, 0.25, "tsp"],
                      ] as const).map(([label, value, setter, min, max, step, suffix]) => (
                        <label key={String(label)} className="space-y-2">
                          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                            <span>{label}</span>
                            <span className="text-slate-500">{value}{suffix}</span>
                          </div>
                          <input
                            type="range"
                            min={Number(min)}
                            max={Number(max)}
                            step={Number(step)}
                            value={Number(value)}
                            onChange={(event) => setter(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 dark:bg-slate-700"
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {renderFoodControlBarsPanel()}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{trainingDay ? "Training" : "Off"}</Badge>
                  <Badge variant="outline">{meals.length} meals / {loggedMealCount} logged</Badge>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Nutrition risks</div>
                  <div className="mt-3 space-y-2">
                    {nutritionRiskFlags.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">Meals are aligned with the current target.</div>
                    ) : (
                      nutritionRiskFlags.map((flag, index) => (
                        <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">{flag}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
        </>
      ) : null}

      <div>
        <Tabs
          value={foodToolsTab}
          onValueChange={(value) => setFoodToolsTab(value as FoodToolsTab)}
          className="space-y-4"
        >
          <SectionCard
            title={foodToolsTab === "add" ? "Capture details" : foodToolsTab === "insights" ? "Target review" : "Log details"}
            description={undefined}
          >
            {foodActionMessage ? (
              <div className="mb-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
                {foodActionMessage}
              </div>
            ) : null}
            <TabsContent value="log" className="space-y-3">
              <div className="grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/15 md:hidden">
                  <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Today
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {caloriesConsumed} / {macroCalories} kcal
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-500/25 dark:bg-white/10 dark:text-emerald-200">
                        {trainingDay ? "Training" : "Off"}
                      </Badge>
                      <Button size="sm" onClick={() => openFoodEntryForSelectedMeal("search")}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="sm:hidden">Add</span>
                        <span className="hidden sm:inline">Add Food</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                    <DonutChart
                      label="Macros"
                      center={`${totalLoggedFoodEntries}`}
                      segments={[
                        { label: "Protein", value: loggedMacroTotals.protein, color: "#10b981" },
                        { label: "Carbs", value: loggedMacroTotals.carbs, color: "#0ea5e9" },
                        { label: "Fat", value: loggedMacroTotals.fats, color: "#f59e0b" },
                      ]}
                    />
                    <div className="grid gap-2">
                      <BulletChart
                        label="Calories"
                        value={caloriesConsumed}
                        target={macroCalories}
                        max={Math.max(macroCalories * 1.15, caloriesConsumed, 1)}
                        unit=" kcal"
                        tone={calorieBalance >= 0 ? "sky" : "amber"}
                      />
                      <BulletChart
                        label="Protein"
                        value={loggedMacroTotals.protein}
                        target={proteinTarget}
                        max={Math.max(proteinTarget * 1.15, loggedMacroTotals.protein, 1)}
                        unit="g"
                        tone="emerald"
                      />
                      <BulletChart
                        label="Carbs"
                        value={loggedMacroTotals.carbs}
                        target={carbTarget}
                        max={Math.max(carbTarget * 1.15, loggedMacroTotals.carbs, 1)}
                        unit="g"
                        tone="sky"
                      />
                      <BulletChart
                        label="Fat"
                        value={loggedMacroTotals.fats}
                        target={fatTarget}
                        max={Math.max(fatTarget * 1.15, loggedMacroTotals.fats, 1)}
                        unit="g"
                        tone="amber"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[16px] border border-white/70 bg-white/72 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.05]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Water</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {waterLiters.toFixed(1)}L / {saltTsp.toFixed(2)} tsp
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-white/70 bg-white/72 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.05]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Meals</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {loggedMealCount} / {meals.length}
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-white/70 bg-white/72 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.05]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Foods</div>
                      <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {totalLoggedFoodEntries}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white/86 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:col-span-full">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Meals</div>
                      {lastLoggedFood ? (
                        <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          Last: {lastLoggedFood.label} in {lastLoggedFood.mealName}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={repeatLastLoggedFood}
                        disabled={!lastLoggedFood}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Repeat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFullMealDiary((value) => !value)}
                      >
                        {showFullMealDiary ? "Hide diary" : "Show diary"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={undoLastLoggedFood}
                        disabled={!lastLoggedFood}
                        title={lastLoggedFood ? `Remove ${lastLoggedFood.label}` : "No logged food to undo"}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Undo
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {meals.slice(0, 4).map((meal) => {
                      const mealFoodEntryCount = meal.foodEntries?.length ?? 0;
                      const mealCalories = Math.round(
                        meal.protein * 4 + meal.carbs * 4 + meal.fats * 9
                      );
                      return (
                        <div
                          key={`${meal.id}-log-snapshot`}
                          className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/35"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                {meal.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                {meal.protein}P / {meal.carbs}C / {meal.fats}F · {mealCalories} kcal
                              </div>
                            </div>
                            <Badge variant="outline">
                              {mealFoodEntryCount}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openFoodSearchForMeal(meal.id)}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalLoggedFoodEntries === 0 ? (
                    <div className="mt-3">
                      <EmptyStatePanel
                        title="No foods logged yet"
                        detail="Add the first food."
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <div className="rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-slate-950/40 dark:to-sky-950/20">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">
                      Fast macro log
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      Add protein, carbs, and fat
                    </div>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200">
                    <Clock3 className="h-3.5 w-3.5 text-sky-500" />
                    {quickMacroTargetMeal
                      ? `Closest now: ${quickMacroTargetMeal.name} ${quickMacroTargetMeal.timing}`
                      : "Creates a meal if needed"}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                  {quickMacroInputs.map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-[18px] border px-3 py-2.5 ${item.accent}`}
                    >
                      <Label
                        htmlFor={`quick-${item.key}`}
                        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300"
                      >
                        {item.label}
                      </Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id={`quick-${item.key}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          value={quickMacros[item.key]}
                          onChange={(event) => updateQuickMacro(item.key, event.target.value)}
                          className="h-9 rounded-[14px] border-white/70 bg-white text-base font-semibold shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                          placeholder="0"
                        />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">g</span>
                      </div>
                    </div>
                  ))}

                  <div className="grid gap-2 sm:grid-cols-[auto_auto] md:grid-cols-1">
                    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                        Calories
                      </div>
                      <div className="mt-0.5 text-lg font-semibold text-slate-950 dark:text-slate-100">
                        {quickMacroCalories}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={logQuickMacros}
                      disabled={quickMacroCalories <= 0}
                      className="h-11 px-5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Log macros
                    </Button>
                  </div>
                </div>

                {quickMacroStatus ? (
                  <div className="mt-3 rounded-[16px] border border-emerald-200 bg-white/80 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/25 dark:text-emerald-100">
                    {quickMacroStatus}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Target meal</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Pick the meal once, then search, scan, repeat, or add a saved meal.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openFoodEntryForSelectedMeal("search")}>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openFoodEntryForSelectedMeal("scan")}>
                        Scan
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select
                      value={selectedMealId}
                      onChange={(event) => setSelectedMealId(event.target.value)}
                      className="w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                    >
                      {meals.length === 0 ? <option value="">New meal</option> : null}
                      {meals.map((meal) => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name} - {meal.timing}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={createMealAndSelect}>
                      <Plus className="mr-2 h-4 w-4" />
                      New meal
                    </Button>
                  </div>

                  {selectedMeal ? (
                    <div className="mt-4 rounded-[20px] border border-sky-200 bg-sky-50/80 px-4 py-4 dark:border-sky-500/20 dark:bg-sky-950/20">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={mealTypeTone(selectedMeal.type)}>{selectedMeal.type ?? "standard"}</Badge>
                        <Badge variant="outline">
                          <Clock3 className="mr-1 h-3.5 w-3.5" />
                          {selectedMeal.timing}
                        </Badge>
                        {(selectedMeal.foodEntries?.length ?? 0) > 0 ? (
                          <Badge variant="outline">
                            {selectedMeal.foodEntries?.length ?? 0} logged item{(selectedMeal.foodEntries?.length ?? 0) === 1 ? "" : "s"}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-3 text-lg font-semibold text-slate-950 dark:text-slate-100">
                        {selectedMeal.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {selectedMeal.protein}P / {selectedMeal.carbs}C / {selectedMeal.fats}F
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        {remainingMacros.map((item) => (
                          <div
                            key={`${item.label}-log-meal-gap`}
                            className={`rounded-[16px] border px-3 py-2 ${item.tone}`}
                          >
                            <div className="text-[10px] font-semibold uppercase tracking-[0.06em]">
                              {item.label}
                            </div>
                            <div className="mt-1 text-sm font-semibold">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <EmptyStatePanel
                        title="No meals yet"
                        detail="Create a meal and the logger will target it."
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={repeatLastLoggedFood}
                      disabled={!lastLoggedFood}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Repeat last
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={undoLastLoggedFood}
                      disabled={!lastLoggedFood}
                      title={lastLoggedFood ? `Remove ${lastLoggedFood.label}` : "No logged food to undo"}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Undo last
                    </Button>
                    {selectedMeal && (selectedMeal.foodEntries?.length ?? 0) > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          saveMealAsTemplate(selectedMeal.id);
                          setFoodActionMessage(`Saved ${selectedMeal.name} for one-tap repeat meals.`);
                        }}
                      >
                        Save meal
                      </Button>
                    ) : null}
                  </div>
                  {lastLoggedFood ? (
                    <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Last logged: {lastLoggedFood.label} in {lastLoggedFood.mealName}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Copy shortcuts</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Repeat a meal without searching food by food.
                        </div>
                      </div>
                      <Badge variant="outline">{foodBackedMealSources.length} source meals</Badge>
                    </div>

                    <div className="mt-3 grid gap-3">
                      <div className="rounded-[18px] border border-white/80 bg-white/82 p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/45">
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                          <select
                            value={copySourceMealId}
                            onChange={(event) => setCopySourceMealId(event.target.value)}
                            className="w-full rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                          >
                            {foodBackedMealSources.length === 0 ? <option value="">No logged meals yet</option> : null}
                            {foodBackedMealSources.map((meal) => (
                              <option key={`copy-source-${meal.id}`} value={meal.id}>
                                {meal.name} - {meal.foodEntries?.length ?? 0} foods
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={foodBackedMealSources.length === 0 || !selectedMeal}
                            onClick={() => copyMealEntriesToTarget(copySourceMealId, "append")}
                          >
                            Append
                          </Button>
                          <Button
                            size="sm"
                            disabled={foodBackedMealSources.length === 0 || !selectedMeal}
                            onClick={() => copyMealEntriesToTarget(copySourceMealId, "replace")}
                          >
                            Replace
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Target: {selectedMeal?.name ?? "create a meal first"}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          Saved-day copy uses your saved food-backed meals.
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addSavedMealsAsDay}
                          disabled={userSavedMealTemplates.length === 0}
                        >
                          Copy saved day
                        </Button>
                      </div>
                    </div>
                  </div>

                  {userSavedMealTemplates.length > 0 ? (
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Saved meals</div>
                        </div>
                        <Badge variant="outline">{userSavedMealTemplates.length} saved</Badge>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {userSavedMealTemplates.map((template) => (
                          <div
                            key={`${template.id}-log-meal-template`}
                            className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{template.name}</div>
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {template.protein}P / {template.carbs}C / {template.fats}F
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => addSavedMealToToday(template.id)}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => replaceSelectedMealWithTemplate(template.id)}
                                disabled={!selectedMeal}
                              >
                                Replace
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Macro gap solver</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Add the cleanest food for what is actually missing.
                        </div>
                      </div>
                      <Badge variant="outline">{macroGapSuggestions.length} option{macroGapSuggestions.length === 1 ? "" : "s"}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {macroGapSuggestions.length === 0 ? (
                        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100">
                          {macroGapSolverEmptyMessage}
                        </div>
                      ) : (
                        macroGapSuggestions.map((suggestion) => (
                          <div
                            key={`${suggestion.label}-${suggestion.food.id}`}
                            className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                                {suggestion.label}: {suggestion.food.label}
                              </div>
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {suggestion.servings} serving{suggestion.servings === 1 ? "" : "s"} covers about {suggestion.macroValue}g of {suggestion.gap}g open, {suggestion.calories} kcal.
                              </div>
                            </div>
                            <Button size="sm" onClick={() => logMacroGapSuggestion(suggestion)}>
                              Add
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <FoodLibraryPanel
                meals={meals}
                availableFoods={availableFoods}
                favoriteFoodIds={favoriteFoodIds}
                recentFoodIds={recentFoodIds}
                targetMealId={selectedMealId}
                onTargetMealIdChange={setSelectedMealId}
                onCreateMeal={createMealAndSelect}
                onFoodLogged={() => setFoodToolsTab("log")}
                entryIntent={foodEntryIntent}
                toggleFavoriteFood={toggleFavoriteFood}
                addFoodEntriesToMeal={addFoodEntriesToMeal}
                addCustomFoods={addCustomFoods}
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{availableFoods.length} searchable foods</Badge>
                <Badge variant="outline">{loggedMealCount} food-backed meals</Badge>
                <Badge variant="outline">{totalLoggedFoodEntries} logged items today</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 text-sm leading-6 text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-100">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-sky-700 dark:text-sky-200">Pre</div>
                  <div className="mt-2">{mealMacroGuidance.pre}</div>
                </div>
                <div className="rounded-[22px] border border-violet-200 bg-violet-50/80 p-4 text-sm leading-6 text-violet-900 dark:border-violet-500/20 dark:bg-violet-950/20 dark:text-violet-100">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-violet-700 dark:text-violet-200">Intra</div>
                  <div className="mt-2">{mealMacroGuidance.intra}</div>
                </div>
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-100">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-200">Post</div>
                  <div className="mt-2">{mealMacroGuidance.post}</div>
                </div>
                <div className="rounded-[22px] border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-200">Off day</div>
                  <div className="mt-2">{mealMacroGuidance.off}</div>
                </div>
              </div>

              {totalLoggedFoodEntries === 0 ? (
                <EmptyStatePanel
                  title="Micronutrients appear once foods are logged"
                  detail="Log foods to populate this board."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {micronutrientTargets.map((target) => {
                    const value = (dailyFoodNutrients[target.key] as number | undefined) ?? 0;
                    const percent = clamp((value / Math.max(target.target, 1)) * 100, 0, 160);

                    return (
                      <div
                        key={target.key}
                        className="rounded-[22px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {target.label}
                            </div>
                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {formatFoodNutrient(value, target.unit)} of{" "}
                              {formatFoodNutrient(target.target, target.unit)}
                            </div>
                          </div>
                          <Badge
                            className={
                              percent >= 100
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : percent >= 70
                                  ? "border-sky-200 bg-sky-50 text-sky-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {Math.round(percent)}%
                          </Badge>
                        </div>
                        <Progress value={percent} className="mt-3" />
                      </div>
                    );
                  })}
                </div>
              )}

            </TabsContent>
          </SectionCard>
        </Tabs>
      </div>

      {foodToolsTab === "insights" ? (
      <SectionCard
        title="Supplement support"
        description={undefined}
        right={<Badge variant="outline">{activeSupplementCount} active</Badge>}
      >
        <div className="space-y-4">
          {supportStackWatch ? (
            <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
              <SignalTile
                label="Current watch"
                title={supportStackWatch.title}
                detail={supportStackWatch.detail}
                tone={supportStackWatch.tone}
              />
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Needs attention</div>
                <div className="mt-3 space-y-2">
                  {supportStackFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                      No supplement issues need action right now.
                    </div>
                  ) : (
                    supportStackFlags.map((flag, index) => (
                      <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                        {flag}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            {visibleSupplementProtocol.length === 0 ? (
              <EmptyStatePanel
                title="No active supplements"
                detail="Add support only when it closes a real food, hydration, or performance gap."
              />
            ) : (
            visibleSupplementProtocol.map((item) => (
              <div key={item.supplementId} className="rounded-[16px] border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <div className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{item.label}</div>
                      <Badge variant="outline" className={`${evidenceBadgeClass(item.evidence)} px-2 py-0.5 text-[10px] tracking-[0.04em]`}>
                        {item.evidence}
                      </Badge>
                      <Badge variant="outline" className="px-2 py-0.5 text-[10px] tracking-[0.04em]">{item.categoryLabel}</Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      {item.enabled ? "Active" : "Off"}
                    </div>
                    {canEditPlan ? (
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(checked) => updateSupplementProtocol(item.supplementId, { enabled: checked })}
                      />
                    ) : (
                      <Badge className={item.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                        {item.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px]">
                  <label className="space-y-1.5">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Dose</div>
                    {canEditPlan ? (
                      <Input className="h-9 rounded-xl px-2.5 py-1.5" value={item.dose} onChange={(event) => updateSupplementProtocol(item.supplementId, { dose: event.target.value })} />
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{item.dose}</div>
                    )}
                  </label>
                  <label className="space-y-1.5">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Pattern</div>
                    {canEditPlan ? (
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                        value={item.pattern}
                        onChange={(event) => updateSupplementProtocol(item.supplementId, { pattern: event.target.value as SupplementPattern })}
                      >
                        {supplementPatternOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        {supplementPatternOptions.find((option) => option.value === item.pattern)?.label ?? item.pattern}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </SectionCard>
      ) : null}

      {foodToolsTab === "insights" ? mealStructurePanel : null}

      {foodToolsTab === "log" ? (
      <div className="space-y-5">
        {showFullMealDiary ? (
        <SectionCard
          title={userMode === "coach" ? "Meal diary" : "Today's meal diary"}
          description={undefined}
          right={userMode === "athlete" ? (
            <Button variant="outline" size="sm" onClick={() => setShowFullMealDiary(false)}>
              Hide diary
            </Button>
          ) : null}
        >
          <div className="space-y-4">
            <div className="space-y-4">
              {fuelingBlocks.map((block) => {
                const blockColors = {
                  pre: "border-sky-200/70 bg-sky-50/80 dark:border-sky-500/20 dark:bg-sky-950/20",
                  intra: "border-violet-200/70 bg-violet-50/80 dark:border-violet-500/20 dark:bg-violet-950/20",
                  post: "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-950/20",
                  off: "border-amber-200/70 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-950/20",
                  standard: "border-slate-200/70 bg-slate-50/80 dark:border-white/15 dark:bg-white/[0.04]",
                } as const;
                const blockColor = blockColors[block.type ?? "standard"] ?? blockColors.standard;

                return (
                  <div key={block.type ?? "standard"} className={`rounded-[24px] border-2 p-4 ${blockColor}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="font-bold capitalize text-slate-900 dark:text-slate-100">{block.type ?? "standard"}</div>
                        <Badge className={mealTypeTone(block.type)}>{block.rows.length} meals</Badge>
                      </div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{block.totals.protein}P / {block.totals.carbs}C / {block.totals.fats}F</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {block.rows.map((meal) => (
                        <div key={meal.id} className="rounded-2xl border border-white/40 bg-white/60 px-3 py-3 dark:border-white/8 dark:bg-white/[0.04]">
                          {(() => {
                            const mealFoodEntryCount = meal.foodEntries?.length ?? 0;
                            const mealEntriesExpanded = userMode === "coach" || expandedDiaryMeals[meal.id];
                            const mealTrustSummary = summarizeFoodEntryTrust(meal.foodEntries);
                            return (
                              <>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-950 dark:text-slate-100">{meal.name}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <span>{meal.protein}P / {meal.carbs}C / {meal.fats}F</span>
                                {mealFoodEntryCount > 0 ? (
                                  <Badge variant="outline">
                                    {mealFoodEntryCount} logged item{mealFoodEntryCount === 1 ? "" : "s"}
                                  </Badge>
                                ) : null}
                                {mealTrustSummary.needsCheck > 0 ? (
                                  <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                                    {mealTrustSummary.needsCheck} label check
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {canEditPlan ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openFoodSearchForMeal(meal.id)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Food
                                </Button>
                              ) : null}
                              {canEditPlan && mealFoodEntryCount > 0 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveMealAsRecipe(meal)}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  Save recipe
                                </Button>
                              ) : null}
                              {mealFoodEntryCount > 0 && userMode === "athlete" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setExpandedDiaryMeals((prev) => ({ ...prev, [meal.id]: !prev[meal.id] }))}
                                >
                                  {mealEntriesExpanded ? "Hide foods" : "Show foods"}
                                </Button>
                              ) : null}
                              <Badge variant="outline" className="border-slate-200/50 bg-slate-50">{meal.timing}</Badge>
                            </div>
                          </div>
                          {mealFoodEntryCount > 0 ? (
                            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              Edit servings or add another item from Add Food.
                            </div>
                          ) : null}
                          {mealFoodEntryCount > 0 && !mealEntriesExpanded ? (
                            <div className="mt-3 rounded-[18px] border border-slate-200/80 bg-white/70 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                              {mealFoodEntryCount} logged food item{mealFoodEntryCount === 1 ? "" : "s"} tucked away for faster scanning.
                            </div>
                          ) : null}
                          {mealFoodEntryCount > 0 && mealEntriesExpanded ? (
                            <div className="mt-3 rounded-[18px] border border-slate-200/80 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Logged foods
                              </div>
                              <div className="mt-3 grid gap-3">
                                {meal.foodEntries?.map((entry) => {
                                  const trust = resolveFoodTrust(entry);

                                  return (
                                    <div
                                      key={entry.id}
                                      className={[
                                        "grid gap-3 rounded-[16px] border bg-white px-3 py-3 dark:bg-slate-950/30 lg:grid-cols-[1fr_auto_auto_auto]",
                                        trust.needsCheck
                                          ? "border-amber-200 dark:border-amber-500/25"
                                          : "border-slate-200 dark:border-white/10",
                                      ].join(" ")}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {entry.recipeItems?.length ? "Recipe: " : ""}
                                            {entry.brand ? `${entry.label} - ${entry.brand}` : entry.label}
                                          </div>
                                          <Badge className={foodTrustBadgeClass(trust.tone)}>{trust.label}</Badge>
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                          {entry.nutrients.calories} kcal, {entry.nutrients.protein}P / {entry.nutrients.carbs}C / {entry.nutrients.fat}F per {entry.servingLabel}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                          {trust.detail}
                                        </div>
                                      </div>

                                    <div className="space-y-2">
                                      <Label>Unit</Label>
                                      {canEditPlan ? (
                                        <select
                                          value={entry.selectedServingOptionId ?? "serving"}
                                          onChange={(event) =>
                                            updateMealFoodEntryUnit(meal.id, entry.id, event.target.value)
                                          }
                                          className="w-[160px] rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                                        >
                                          {getFoodServingOptions({
                                            servingLabel: entry.baseServingLabel ?? entry.servingLabel,
                                            servingGrams: entry.baseServingGrams ?? entry.servingGrams,
                                            servingOptions: entry.servingOptions,
                                          }).map((option) => (
                                            <option key={option.id} value={option.id}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">
                                          {entry.servingLabel}
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Amount</Label>
                                      {canEditPlan ? (
                                        <Input
                                          type="number"
                                          min={0.25}
                                          step={0.25}
                                          value={entry.servings}
                                          onChange={(event) =>
                                            updateMealFoodEntryServings(
                                              meal.id,
                                              entry.id,
                                              Math.max(0.25, Number(event.target.value) || 0.25)
                                            )
                                          }
                                          className="w-24"
                                        />
                                      ) : (
                                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">
                                          {Number(entry.servings.toFixed(2))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-end">
                                      {canEditPlan ? (
                                        <Button
                                          size="sm"
                                          variant={pendingFoodEntryDeleteId === `${meal.id}:${entry.id}` ? "outline" : "ghost"}
                                          onClick={() => requestRemoveMealFoodEntry(meal.id, entry.id)}
                                        >
                                          {pendingFoodEntryDeleteId === `${meal.id}:${entry.id}` ? (
                                            "Confirm"
                                          ) : (
                                            <>
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Remove
                                            </>
                                          )}
                                        </Button>
                                      ) : null}
                                    </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
        ) : null}

        {canEditPlan ? (
        <SectionCard title="Structure tools">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setFoodToolsTab("insights")}>Open review</Button>
            {canEditPlan ? (
              <Button variant="outline" onClick={toggleNutritionEditor}>
                Meal builder
              </Button>
            ) : null}
          </div>
        </SectionCard>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
