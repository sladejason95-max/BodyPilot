import { normalizeOpenFoodFactsProduct } from "./food_engine";
import { prepareFoodProviderProduct } from "./food_provider_quality";
import type { FoodCatalogItem } from "./types";
import { coreFoodCatalog } from "@/lib/data/foodCatalog";
import { expandedFoodCatalog } from "@/lib/data/expandedFoodCatalog";

export type FoodConnectorSource = "open-food-facts" | "local-catalog" | "hybrid";

export type FoodConnectorResult = {
  foods: FoodCatalogItem[];
  source: FoodConnectorSource;
  latencyMs: number;
};

export type FoodBarcodeResult = {
  food: FoodCatalogItem | null;
  source: FoodConnectorSource;
  latencyMs: number;
};

export type FoodConnectorStatus = {
  provider: string;
  mode: "live-api";
  supportsSearch: boolean;
  supportsBarcode: boolean;
  supportsServingSizes: boolean;
  swapReady: boolean;
};

const openFoodFactsFields =
  "code,product_name,generic_name,brands,serving_size,serving_quantity,quantity,categories,nutriments,image_front_thumb_url";
const localFoodCatalog = [...coreFoodCatalog, ...expandedFoodCatalog];

const normalizeUsableProviderFood = (product: Record<string, unknown>) => {
  const prepared = prepareFoodProviderProduct(product);
  return prepared ? normalizeOpenFoodFactsProduct(prepared) : null;
};

export const foodConnectorStatus: FoodConnectorStatus = {
  provider: "Open Food Facts",
  mode: "live-api",
  supportsSearch: true,
  supportsBarcode: true,
  supportsServingSizes: true,
  swapReady: true,
};

const readJson = async (url: string, timeoutMs = 8000) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Food database is offline. Local foods and custom foods are still available.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Food provider returned ${response.status}. Try a local food or custom entry.`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Food database timed out. Try again or log a local/custom food.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

const searchableFoodText = (food: FoodCatalogItem) =>
  [food.label, food.brand, food.group, food.servingLabel, ...(food.searchTokens ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const searchLocalFoods = (query: string, limit: number) => {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return [];

  return localFoodCatalog
    .map((food) => {
      const haystack = searchableFoodText(food);
      const score = tokens.reduce((sum, token) => {
        if (food.label.toLowerCase() === token) return sum + 8;
        if (food.label.toLowerCase().includes(token)) return sum + 5;
        if ((food.searchTokens ?? []).some((searchToken) => searchToken.toLowerCase().includes(token))) return sum + 3;
        return haystack.includes(token) ? sum + 1 : sum;
      }, 0);
      return { food, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.food.label.localeCompare(right.food.label))
    .slice(0, limit)
    .map((item) => item.food);
};

const dedupeFoods = (foods: FoodCatalogItem[], limit: number) => {
  const seen = new Set<string>();
  const deduped: FoodCatalogItem[] = [];
  foods.forEach((food) => {
    const key = food.barcode ? `barcode:${food.barcode}` : `food:${food.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(food);
  });
  return deduped.slice(0, limit);
};

export const searchLocalFoodDatabase = (
  query: string,
  options: { limit?: number } = {}
): FoodConnectorResult => {
  const limit = options.limit ?? 30;
  const startedAt = performance.now();
  const trimmed = query.trim();

  return {
    foods: trimmed.length < 2 ? [] : searchLocalFoods(trimmed, limit),
    source: "local-catalog",
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  };
};

export const searchFoodDatabase = async (
  query: string,
  options: { limit?: number } = {}
): Promise<FoodConnectorResult> => {
  const startedAt = performance.now();
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { foods: [], source: "local-catalog", latencyMs: 0 };
  }
  const limit = options.limit ?? 30;
  const localMatches = searchLocalFoods(trimmed, limit);

  try {
    const payload = await readJson(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        trimmed
      )}&search_simple=1&action=process&json=1&page_size=${limit}&fields=${openFoodFactsFields}`
    );

    const liveFoods = ((payload?.products ?? []) as Record<string, unknown>[])
      .map(normalizeUsableProviderFood)
      .filter(Boolean) as FoodCatalogItem[];
    const foods = dedupeFoods([...localMatches, ...liveFoods], limit);

    return {
      foods,
      source: localMatches.length > 0 && liveFoods.length > 0 ? "hybrid" : liveFoods.length > 0 ? "open-food-facts" : "local-catalog",
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
  } catch (error) {
    if (localMatches.length > 0) {
      return {
        foods: localMatches,
        source: "local-catalog",
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    }
    throw error;
  }
};

export const lookupFoodBarcode = async (code: string): Promise<FoodBarcodeResult> => {
  const startedAt = performance.now();
  const trimmed = code.trim();
  if (!trimmed) {
    return { food: null, source: "local-catalog", latencyMs: 0 };
  }
  const localMatch = localFoodCatalog.find((food) => food.barcode === trimmed);
  if (localMatch) {
    return {
      food: localMatch,
      source: "local-catalog",
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
  }

  const payload = await readJson(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      trimmed
    )}?fields=${openFoodFactsFields}`
  );
  const food = normalizeUsableProviderFood({
    ...(payload?.product ?? {}),
    code: payload?.code ?? trimmed,
  });

  return {
    food,
    source: "open-food-facts",
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  };
};
