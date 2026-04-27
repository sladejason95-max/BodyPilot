import type { FoodCatalogItem, MealFoodEntry } from "./types";

type TrustableFood = Pick<
  FoodCatalogItem,
  "id" | "source" | "group" | "verified" | "barcode" | "recipeItems"
>;

type TrustableEntry = Pick<
  MealFoodEntry,
  "foodId" | "source" | "group" | "verified" | "barcode" | "recipeItems"
>;

export type FoodTrustTone = "verified" | "barcode" | "custom" | "recipe" | "warning" | "macro";

export type FoodTrustProfile = {
  label: string;
  detail: string;
  tone: FoodTrustTone;
  rank: number;
  needsCheck: boolean;
};

const foodIdentifier = (food: TrustableFood | TrustableEntry) =>
  "id" in food ? food.id : food.foodId;

export const isMacroOnlyFood = (food: TrustableFood | TrustableEntry) =>
  foodIdentifier(food).startsWith("quick-macro-");

export const foodTrustBadgeClass = (tone: FoodTrustTone) => {
  if (tone === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100";
  }
  if (tone === "barcode") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/30 dark:text-sky-100";
  }
  if (tone === "recipe") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-950/30 dark:text-violet-100";
  }
  if (tone === "custom") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-950/30 dark:text-cyan-100";
  }
  if (tone === "macro") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100";
  }
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-950/30 dark:text-rose-100";
};

export const resolveFoodTrust = (food: TrustableFood | TrustableEntry): FoodTrustProfile => {
  if (isMacroOnlyFood(food)) {
    return {
      label: "Macro only",
      detail: "Fast macro entry; micronutrients are not estimated.",
      tone: "macro",
      rank: 7,
      needsCheck: false,
    };
  }

  if (food.recipeItems?.length) {
    return {
      label: "Recipe",
      detail: "Saved recipe built from logged ingredients.",
      tone: "recipe",
      rank: 1,
      needsCheck: false,
    };
  }

  if (food.source === "core") {
    return {
      label: food.verified === false ? "Core" : "Verified",
      detail: food.verified === false ? "Local staple; confirm if precision matters." : "Curated BodyPilot staple.",
      tone: food.verified === false ? "barcode" : "verified",
      rank: food.verified === false ? 3 : 0,
      needsCheck: false,
    };
  }

  if (food.source === "custom") {
    return {
      label: "Custom",
      detail: food.barcode ? "Saved by you with barcode attached." : "Saved by you.",
      tone: "custom",
      rank: 2,
      needsCheck: false,
    };
  }

  if (food.verified) {
    return {
      label: food.barcode ? "Verified barcode" : "Verified live",
      detail: food.barcode ? "Provider-verified packaged match." : "Verified live catalog item.",
      tone: "barcode",
      rank: 3,
      needsCheck: false,
    };
  }

  return {
    label: food.barcode ? "Check barcode" : "Check label",
    detail: food.barcode
      ? "Package match from live catalog; confirm serving and macros."
      : "Community catalog item; confirm serving and macros.",
    tone: "warning",
    rank: 6,
    needsCheck: true,
  };
};
