import { normalizeOpenFoodFactsProduct } from "./food_engine";
import type { FoodCatalogItem } from "./types";

export type FoodConnectorSource = "open-food-facts";

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

export const searchFoodDatabase = async (
  query: string,
  options: { limit?: number } = {}
): Promise<FoodConnectorResult> => {
  const startedAt = performance.now();
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { foods: [], source: "open-food-facts", latencyMs: 0 };
  }

  const payload = await readJson(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      trimmed
    )}&search_simple=1&action=process&json=1&page_size=${options.limit ?? 30}&fields=${openFoodFactsFields}`
  );

  const foods = ((payload?.products ?? []) as Record<string, unknown>[])
    .map((item) => normalizeOpenFoodFactsProduct(item))
    .filter(Boolean) as FoodCatalogItem[];

  return {
    foods,
    source: "open-food-facts",
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  };
};

export const lookupFoodBarcode = async (code: string): Promise<FoodBarcodeResult> => {
  const startedAt = performance.now();
  const trimmed = code.trim();
  if (!trimmed) {
    return { food: null, source: "open-food-facts", latencyMs: 0 };
  }

  const payload = await readJson(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      trimmed
    )}?fields=${openFoodFactsFields}`
  );
  const food = normalizeOpenFoodFactsProduct({
    ...(payload?.product ?? {}),
    code: payload?.code ?? trimmed,
  });

  return {
    food,
    source: "open-food-facts",
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  };
};
