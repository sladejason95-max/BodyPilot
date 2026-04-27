import type {
  FoodCatalogItem,
  FoodGroup,
  FoodNutrients,
  FoodServingOption,
  Meal,
  MealFoodEntry,
  MealTemplate,
  FoodRecipeComponent,
} from "./types";

type MicronutrientKey =
  | "fiber"
  | "sodiumMg"
  | "potassiumMg"
  | "calciumMg"
  | "ironMg"
  | "magnesiumMg"
  | "zincMg"
  | "vitaminCMg"
  | "vitaminDMcg"
  | "vitaminAMcg"
  | "vitaminEMg"
  | "vitaminKMcg"
  | "folateMcg"
  | "vitaminB12Mcg";

export const micronutrientTargets: Array<{
  key: MicronutrientKey;
  label: string;
  target: number;
  unit: "g" | "mg" | "mcg";
}> = [
  { key: "fiber", label: "Fiber", target: 30, unit: "g" },
  { key: "sodiumMg", label: "Sodium", target: 2300, unit: "mg" },
  { key: "potassiumMg", label: "Potassium", target: 4700, unit: "mg" },
  { key: "calciumMg", label: "Calcium", target: 1000, unit: "mg" },
  { key: "ironMg", label: "Iron", target: 18, unit: "mg" },
  { key: "magnesiumMg", label: "Magnesium", target: 420, unit: "mg" },
  { key: "zincMg", label: "Zinc", target: 11, unit: "mg" },
  { key: "vitaminCMg", label: "Vitamin C", target: 90, unit: "mg" },
  { key: "vitaminDMcg", label: "Vitamin D", target: 20, unit: "mcg" },
  { key: "vitaminAMcg", label: "Vitamin A", target: 900, unit: "mcg" },
  { key: "vitaminEMg", label: "Vitamin E", target: 15, unit: "mg" },
  { key: "vitaminKMcg", label: "Vitamin K", target: 120, unit: "mcg" },
  { key: "folateMcg", label: "Folate", target: 400, unit: "mcg" },
  { key: "vitaminB12Mcg", label: "B12", target: 2.4, unit: "mcg" },
];

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cloneFoodNutrients = (nutrients: FoodNutrients): FoodNutrients => ({ ...nutrients });
const cloneRecipeComponents = (items?: FoodRecipeComponent[]) =>
  items?.map((item) => ({ ...item })) ?? [];
const cloneServingOptions = (items?: FoodServingOption[]) =>
  items?.map((item) => ({ ...item })) ?? [];

export const cloneMealFoodEntries = (entries?: MealFoodEntry[]) =>
  entries?.map((entry) => ({
    ...entry,
    nutrients: cloneFoodNutrients(entry.nutrients),
    baseNutrients: entry.baseNutrients ? cloneFoodNutrients(entry.baseNutrients) : undefined,
    servingOptions: cloneServingOptions(entry.servingOptions),
    recipeItems: cloneRecipeComponents(entry.recipeItems),
  })) ?? [];

export const scaleFoodNutrients = (nutrients: FoodNutrients, multiplier: number): FoodNutrients => ({
  calories: nutrients.calories * multiplier,
  protein: nutrients.protein * multiplier,
  carbs: nutrients.carbs * multiplier,
  fat: nutrients.fat * multiplier,
  fiber: (nutrients.fiber ?? 0) * multiplier,
  sugar: (nutrients.sugar ?? 0) * multiplier,
  sodiumMg: (nutrients.sodiumMg ?? 0) * multiplier,
  potassiumMg: (nutrients.potassiumMg ?? 0) * multiplier,
  calciumMg: (nutrients.calciumMg ?? 0) * multiplier,
  ironMg: (nutrients.ironMg ?? 0) * multiplier,
  magnesiumMg: (nutrients.magnesiumMg ?? 0) * multiplier,
  zincMg: (nutrients.zincMg ?? 0) * multiplier,
  vitaminCMg: (nutrients.vitaminCMg ?? 0) * multiplier,
  vitaminDMcg: (nutrients.vitaminDMcg ?? 0) * multiplier,
  vitaminAMcg: (nutrients.vitaminAMcg ?? 0) * multiplier,
  vitaminEMg: (nutrients.vitaminEMg ?? 0) * multiplier,
  vitaminKMcg: (nutrients.vitaminKMcg ?? 0) * multiplier,
  folateMcg: (nutrients.folateMcg ?? 0) * multiplier,
  vitaminB12Mcg: (nutrients.vitaminB12Mcg ?? 0) * multiplier,
  cholesterolMg: (nutrients.cholesterolMg ?? 0) * multiplier,
  saturatedFat: (nutrients.saturatedFat ?? 0) * multiplier,
  fluidMl: (nutrients.fluidMl ?? 0) * multiplier,
});

export const sumFoodNutrients = (items: FoodNutrients[]): FoodNutrients =>
  items.reduce<FoodNutrients>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: (acc.fiber ?? 0) + (item.fiber ?? 0),
      sugar: (acc.sugar ?? 0) + (item.sugar ?? 0),
      sodiumMg: (acc.sodiumMg ?? 0) + (item.sodiumMg ?? 0),
      potassiumMg: (acc.potassiumMg ?? 0) + (item.potassiumMg ?? 0),
      calciumMg: (acc.calciumMg ?? 0) + (item.calciumMg ?? 0),
      ironMg: (acc.ironMg ?? 0) + (item.ironMg ?? 0),
      magnesiumMg: (acc.magnesiumMg ?? 0) + (item.magnesiumMg ?? 0),
      zincMg: (acc.zincMg ?? 0) + (item.zincMg ?? 0),
      vitaminCMg: (acc.vitaminCMg ?? 0) + (item.vitaminCMg ?? 0),
      vitaminDMcg: (acc.vitaminDMcg ?? 0) + (item.vitaminDMcg ?? 0),
      vitaminAMcg: (acc.vitaminAMcg ?? 0) + (item.vitaminAMcg ?? 0),
      vitaminEMg: (acc.vitaminEMg ?? 0) + (item.vitaminEMg ?? 0),
      vitaminKMcg: (acc.vitaminKMcg ?? 0) + (item.vitaminKMcg ?? 0),
      folateMcg: (acc.folateMcg ?? 0) + (item.folateMcg ?? 0),
      vitaminB12Mcg: (acc.vitaminB12Mcg ?? 0) + (item.vitaminB12Mcg ?? 0),
      cholesterolMg: (acc.cholesterolMg ?? 0) + (item.cholesterolMg ?? 0),
      saturatedFat: (acc.saturatedFat ?? 0) + (item.saturatedFat ?? 0),
      fluidMl: (acc.fluidMl ?? 0) + (item.fluidMl ?? 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );

export const summarizeMealFoodEntries = (entries?: MealFoodEntry[]) =>
  sumFoodNutrients(
    (entries ?? []).map((entry) => scaleFoodNutrients(entry.nutrients, Math.max(entry.servings, 0)))
  );

const inferMicronutrientDensity = (totals: FoodNutrients): Meal["micronutrientDensity"] => {
  const score =
    (totals.fiber ?? 0) / 6 +
    (totals.potassiumMg ?? 0) / 700 +
    (totals.calciumMg ?? 0) / 250 +
    (totals.magnesiumMg ?? 0) / 90 +
    (totals.vitaminCMg ?? 0) / 25 +
    (totals.vitaminAMcg ?? 0) / 250;

  if (score >= 4) return "high";
  if (score >= 2) return "moderate";
  return "light";
};

const inferDigestionLoad = (totals: FoodNutrients): Meal["digestionLoad"] => {
  if ((totals.fiber ?? 0) >= 10 || totals.fat >= 20 || totals.protein >= 55) return "high";
  if ((totals.fiber ?? 0) >= 4 || totals.fat >= 10 || totals.protein >= 25) return "moderate";
  return "light";
};

const inferSatietyLevel = (totals: FoodNutrients): Meal["satietyLevel"] => {
  if (totals.protein >= 35 || (totals.fiber ?? 0) >= 7 || totals.fat >= 18) return "high";
  if (totals.protein >= 20 || (totals.fiber ?? 0) >= 3 || totals.fat >= 8) return "moderate";
  return "light";
};

const OUNCES_IN_GRAMS = 28.3495;

const dedupeServingOptions = (options: FoodServingOption[]) => {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getFoodServingOptions = (
  food: Pick<FoodCatalogItem, "servingLabel" | "servingGrams" | "servingOptions">
): FoodServingOption[] => {
  const provided = cloneServingOptions(food.servingOptions);
  const baseGrams = food.servingGrams;
  const defaults: FoodServingOption[] = [
    {
      id: "serving",
      label: food.servingLabel,
      multiplier: 1,
      grams: baseGrams,
    },
  ];

  if (baseGrams && baseGrams > 0) {
    defaults.push(
      {
        id: "grams-100",
        label: "100 g",
        multiplier: 100 / baseGrams,
        grams: 100,
      },
      {
        id: "grams-1",
        label: "1 g",
        multiplier: 1 / baseGrams,
        grams: 1,
      },
      {
        id: "ounces-1",
        label: "1 oz",
        multiplier: OUNCES_IN_GRAMS / baseGrams,
        grams: OUNCES_IN_GRAMS,
      }
    );
  }

  return dedupeServingOptions([...provided, ...defaults]).map((option) => ({
    ...option,
    multiplier: option.multiplier > 0 ? option.multiplier : 1,
  }));
};

const getServingOptionForId = (
  options: FoodServingOption[],
  selectedServingOptionId?: string
) =>
  options.find((option) => option.id === selectedServingOptionId) ??
  options[0] ?? {
    id: "serving",
    label: "1 serving",
    multiplier: 1,
  };

export const resolveFoodServingSelection = (
  food: Pick<FoodCatalogItem, "nutrients" | "servingLabel" | "servingGrams" | "servingOptions">,
  selectedServingOptionId?: string
) => {
  const options = getFoodServingOptions(food);
  const selectedOption = getServingOptionForId(options, selectedServingOptionId);

  return {
    options,
    selectedOption,
    servingLabel: selectedOption.label,
    servingGrams: selectedOption.grams ?? (food.servingGrams ? food.servingGrams * selectedOption.multiplier : undefined),
    nutrients: scaleFoodNutrients(food.nutrients, selectedOption.multiplier),
  };
};

export const createMealFoodEntry = (
  food: FoodCatalogItem,
  servings = 1,
  selectedServingOptionId?: string
): MealFoodEntry => {
  const servingSelection = resolveFoodServingSelection(food, selectedServingOptionId);

  return {
    id: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    foodId: food.id,
    label: food.label,
    brand: food.brand,
    barcode: food.barcode,
    source: food.source,
    group: food.group,
    verified: food.verified,
    servings,
    selectedServingOptionId: servingSelection.selectedOption.id,
    servingLabel: servingSelection.servingLabel,
    servingGrams: servingSelection.servingGrams,
    baseServingLabel: food.servingLabel,
    baseServingGrams: food.servingGrams,
    baseNutrients: cloneFoodNutrients(food.nutrients),
    servingOptions: servingSelection.options,
    imageUrl: food.imageUrl,
    nutrients: cloneFoodNutrients(servingSelection.nutrients),
    note: food.note,
    recipeItems: cloneRecipeComponents(food.recipeItems),
  };
};

type RecipeFoodInput = {
  foodId: string;
  label: string;
  brand?: string;
  source: FoodCatalogItem["source"];
  group: FoodGroup;
  servings: number;
  servingLabel: string;
  servingGrams?: number;
  nutrients: FoodNutrients;
};

export const createRecipeFoodItem = (options: {
  id?: string;
  label: string;
  items: RecipeFoodInput[];
  note?: string;
}): FoodCatalogItem => {
  const { id, label, items, note } = options;
  const totals = sumFoodNutrients(
    items.map((item) => scaleFoodNutrients(item.nutrients, Math.max(item.servings, 0)))
  );

  return {
    id: id ?? `recipe-${slugify(label)}-${Date.now()}`,
    label,
    source: "custom",
    group: "mixed",
    verified: true,
    servingLabel: "1 recipe",
    searchTokens: [
      "recipe",
      ...items.flatMap((item) => [item.label, item.brand ?? ""]),
    ]
      .filter(Boolean)
      .slice(0, 18),
    nutrients: {
      ...totals,
      calories: round(totals.calories, 0),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
    },
    note:
      note ??
      `Recipe with ${items.length} ingredient${items.length === 1 ? "" : "s"}: ${items
        .slice(0, 4)
        .map((item) => item.label)
        .join(", ")}${items.length > 4 ? ", ..." : ""}.`,
    recipeItems: items.map((item) => ({
      foodId: item.foodId,
      label: item.label,
      brand: item.brand,
      source: item.source,
      group: item.group,
      servings: item.servings,
      servingLabel: item.servingLabel,
      servingGrams: item.servingGrams,
    })),
  };
};

export const hydrateMealFromFoodEntries = <T extends Meal | MealTemplate>(meal: T): T => {
  const entries = cloneMealFoodEntries(meal.foodEntries);
  if (entries.length === 0) {
    return { ...meal, foodEntries: entries } as T;
  }

  const totals = summarizeMealFoodEntries(entries);
  return {
    ...meal,
    foodEntries: entries,
    protein: round(totals.protein),
    carbs: round(totals.carbs),
    fats: round(totals.fat),
    fiberG: round(totals.fiber ?? 0),
    sodiumMg: Math.round(totals.sodiumMg ?? 0),
    potassiumMg: Math.round(totals.potassiumMg ?? 0),
    fluidMl: Math.round(totals.fluidMl ?? 0),
    satietyLevel: inferSatietyLevel(totals),
    digestionLoad: inferDigestionLoad(totals),
    micronutrientDensity: inferMicronutrientDensity(totals),
    libraryFoodIds: entries.map((entry) => entry.foodId),
  } as T;
};

export const summarizeDayFoodNutrients = (meals: Meal[]) =>
  meals.reduce<FoodNutrients>(
    (acc, meal) => sumFoodNutrients([acc, summarizeMealFoodEntries(meal.foodEntries)]),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );

export const formatFoodNutrient = (value: number | undefined, unit: "g" | "mg" | "mcg") => {
  const safe = value ?? 0;
  if (unit === "g") return `${round(safe)} g`;
  if (unit === "mg") return `${Math.round(safe)} mg`;
  return `${Math.round(safe)} mcg`;
};

const convertUnit = (value: number, fromUnit: string | undefined, target: "g" | "mg" | "mcg" | "kcal") => {
  const normalized = (fromUnit ?? "").toLowerCase();
  if (target === "kcal") {
    return value;
  }

  if (target === "g") {
    if (normalized === "mg") return value / 1000;
    if (normalized === "mcg" || normalized === "ug" || normalized === "µg" || normalized === "μg") return value / 1000000;
    return value;
  }

  if (target === "mg") {
    if (normalized === "g") return value * 1000;
    if (normalized === "mcg" || normalized === "ug" || normalized === "µg" || normalized === "μg") return value / 1000;
    return value;
  }

  if (normalized === "g") return value * 1000000;
  if (normalized === "mg") return value * 1000;
  return value;
};

const readFromOffNutriments = (
  nutriments: Record<string, unknown>,
  baseKey: string,
  servingScale: number,
  targetUnit: "g" | "mg" | "mcg" | "kcal"
) => {
  const servingValue = nutriments[`${baseKey}_serving`];
  const unit = typeof nutriments[`${baseKey}_unit`] === "string" ? String(nutriments[`${baseKey}_unit`]) : undefined;

  if (Number.isFinite(Number(servingValue))) {
    return convertUnit(Number(servingValue), unit, targetUnit);
  }

  const hundredGramValue = nutriments[`${baseKey}_100g`];
  if (Number.isFinite(Number(hundredGramValue))) {
    return convertUnit(Number(hundredGramValue), unit, targetUnit) * servingScale;
  }

  return 0;
};

const parseServingGrams = (product: Record<string, unknown>) => {
  const servingQuantity = toNumber(product.serving_quantity, 0);
  if (servingQuantity > 0) return servingQuantity;

  const servingSize = typeof product.serving_size === "string" ? product.serving_size : "";
  const match = servingSize.match(/(\d+(?:\.\d+)?)\s*(g|ml)/i);
  if (match) return Number(match[1]);

  return 100;
};

const inferFoodGroup = (product: Record<string, unknown>): FoodGroup => {
  const haystack = [
    typeof product.product_name === "string" ? product.product_name : "",
    typeof product.brands === "string" ? product.brands : "",
    typeof product.categories === "string" ? product.categories : "",
  ]
    .join(" ")
    .toLowerCase();

  if (/protein|creatine|electrolyte|pre-workout|amino|whey|casein|supplement/.test(haystack)) {
    return "supplement";
  }
  return "branded";
};

export const normalizeOpenFoodFactsProduct = (product: Record<string, unknown>) => {
  const code = typeof product.code === "string" ? product.code : "";
  const label =
    (typeof product.product_name === "string" && product.product_name.trim()) ||
    (typeof product.generic_name === "string" && product.generic_name.trim()) ||
    "";
  if (!code || !label) return null;

  const nutriments = (product.nutriments as Record<string, unknown>) ?? {};
  const servingGrams = parseServingGrams(product);
  const servingScale = servingGrams > 0 ? servingGrams / 100 : 1;
  const sodiumValue = readFromOffNutriments(nutriments, "sodium", servingScale, "mg");
  const saltFallback = readFromOffNutriments(nutriments, "salt", servingScale, "g") * 393;

  const servingLabel =
    (typeof product.serving_size === "string" && product.serving_size.trim()) ||
    (servingGrams ? `${round(servingGrams)} g` : "100 g");

  return {
    id: `off-${code}`,
    label,
    brand: typeof product.brands === "string" ? product.brands : undefined,
    barcode: code,
    source: "community" as const,
    group: inferFoodGroup(product),
    verified: false,
    servingLabel,
    servingGrams,
    imageUrl:
      (typeof product.image_front_thumb_url === "string" && product.image_front_thumb_url) ||
      (typeof product.image_url === "string" && product.image_url) ||
      undefined,
    searchTokens: [
      typeof product.brands === "string" ? product.brands : "",
      typeof product.quantity === "string" ? product.quantity : "",
    ].filter(Boolean),
    nutrients: {
      calories: readFromOffNutriments(nutriments, "energy-kcal", servingScale, "kcal"),
      protein: readFromOffNutriments(nutriments, "proteins", servingScale, "g"),
      carbs: readFromOffNutriments(nutriments, "carbohydrates", servingScale, "g"),
      fat: readFromOffNutriments(nutriments, "fat", servingScale, "g"),
      fiber: readFromOffNutriments(nutriments, "fiber", servingScale, "g"),
      sugar: readFromOffNutriments(nutriments, "sugars", servingScale, "g"),
      sodiumMg: sodiumValue || saltFallback,
      potassiumMg: readFromOffNutriments(nutriments, "potassium", servingScale, "mg"),
      calciumMg: readFromOffNutriments(nutriments, "calcium", servingScale, "mg"),
      ironMg: readFromOffNutriments(nutriments, "iron", servingScale, "mg"),
      magnesiumMg: readFromOffNutriments(nutriments, "magnesium", servingScale, "mg"),
      zincMg: readFromOffNutriments(nutriments, "zinc", servingScale, "mg"),
      vitaminCMg: readFromOffNutriments(nutriments, "vitamin-c", servingScale, "mg"),
      vitaminDMcg: readFromOffNutriments(nutriments, "vitamin-d", servingScale, "mcg"),
      vitaminAMcg: readFromOffNutriments(nutriments, "vitamin-a", servingScale, "mcg"),
      vitaminEMg: readFromOffNutriments(nutriments, "vitamin-e", servingScale, "mg"),
      vitaminKMcg: readFromOffNutriments(nutriments, "vitamin-k", servingScale, "mcg"),
      folateMcg: readFromOffNutriments(nutriments, "folates", servingScale, "mcg"),
      vitaminB12Mcg: readFromOffNutriments(nutriments, "vitamin-b12", servingScale, "mcg"),
      cholesterolMg: readFromOffNutriments(nutriments, "cholesterol", servingScale, "mg"),
      saturatedFat: readFromOffNutriments(nutriments, "saturated-fat", servingScale, "g"),
    },
    note: "Community-packaged food from Open Food Facts.",
  } satisfies FoodCatalogItem;
};

const readUploadField = (item: Record<string, unknown>, candidates: string[]) => {
  const match = candidates.find((candidate) => item[candidate] !== undefined);
  return match ? item[match] : undefined;
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const splitDelimitedLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsvFoodUpload = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitDelimitedLine(lines[0]).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const cells = splitDelimitedLine(line);
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = cells[index] ?? "";
      return record;
    }, {});
  });
};

const parseJsonFoodUpload = (text: string) => {
  const raw = JSON.parse(text);
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const nested =
      record.foods ??
      record.items ??
      record.products ??
      record.entries ??
      record.data;

    if (Array.isArray(nested)) return nested;
  }

  return [raw];
};

const parseJsonlFoodUpload = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

const parseUploadedNutrients = (item: Record<string, unknown>): FoodNutrients => {
  const nutrientBlock =
    (item.nutrients as Record<string, unknown>) ??
    (item.macros as Record<string, unknown>) ??
    item;

  return {
    calories: toNumber(readUploadField(nutrientBlock, ["calories", "kcal", "energy", "energykcal"]), 0),
    protein: toNumber(readUploadField(nutrientBlock, ["protein", "proteing"]), 0),
    carbs: toNumber(readUploadField(nutrientBlock, ["carbs", "carbohydrates", "carbohydrateg", "carbohydratesg"]), 0),
    fat: toNumber(readUploadField(nutrientBlock, ["fat", "fats", "fatg"]), 0),
    fiber: toNumber(readUploadField(nutrientBlock, ["fiber", "fibre", "fiberg"]), 0),
    sugar: toNumber(readUploadField(nutrientBlock, ["sugar", "sugars", "sugarg"]), 0),
    sodiumMg: toNumber(readUploadField(nutrientBlock, ["sodiumMg", "sodiummg", "sodium"]), 0),
    potassiumMg: toNumber(readUploadField(nutrientBlock, ["potassiumMg", "potassiummg", "potassium"]), 0),
    calciumMg: toNumber(readUploadField(nutrientBlock, ["calciumMg", "calciummg", "calcium"]), 0),
    ironMg: toNumber(readUploadField(nutrientBlock, ["ironMg", "ironmg", "iron"]), 0),
    magnesiumMg: toNumber(readUploadField(nutrientBlock, ["magnesiumMg", "magnesiummg", "magnesium"]), 0),
    zincMg: toNumber(readUploadField(nutrientBlock, ["zincMg", "zincmg", "zinc"]), 0),
    vitaminCMg: toNumber(readUploadField(nutrientBlock, ["vitaminCMg", "vitamincmg", "vitaminC", "vitaminc"]), 0),
    vitaminDMcg: toNumber(readUploadField(nutrientBlock, ["vitaminDMcg", "vitamindmcg", "vitaminD", "vitamind"]), 0),
    vitaminAMcg: toNumber(readUploadField(nutrientBlock, ["vitaminAMcg", "vitaminamcg", "vitaminA", "vitamina"]), 0),
    vitaminEMg: toNumber(readUploadField(nutrientBlock, ["vitaminEMg", "vitaminemg", "vitaminE", "vitamine"]), 0),
    vitaminKMcg: toNumber(readUploadField(nutrientBlock, ["vitaminKMcg", "vitaminkmcg", "vitaminK", "vitamink"]), 0),
    folateMcg: toNumber(readUploadField(nutrientBlock, ["folateMcg", "folatemcg", "folate"]), 0),
    vitaminB12Mcg: toNumber(readUploadField(nutrientBlock, ["vitaminB12Mcg", "vitaminb12mcg", "vitaminB12", "vitaminb12"]), 0),
    cholesterolMg: toNumber(readUploadField(nutrientBlock, ["cholesterolMg", "cholesterolmg", "cholesterol"]), 0),
    saturatedFat: toNumber(readUploadField(nutrientBlock, ["saturatedFat", "saturatedfat", "satfat"]), 0),
    fluidMl: toNumber(readUploadField(nutrientBlock, ["fluidMl", "fluidml", "fluid"]), 0),
  };
};

export const parseCustomFoodUpload = (jsonText: string) => {
  const sourceText = jsonText.trim();
  const items =
    sourceText.includes("\n") && sourceText.split(/\r?\n/).every((line) => {
      const trimmed = line.trim();
      return !trimmed || trimmed.startsWith("{");
    })
      ? parseJsonlFoodUpload(sourceText)
      : sourceText.startsWith("{") || sourceText.startsWith("[")
        ? parseJsonFoodUpload(sourceText)
        : parseCsvFoodUpload(sourceText);

  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label =
        String(readUploadField(record, ["label", "name", "product_name", "productname", "foodname"]) ?? "").trim();
      if (!label) return null;

      const brandValue = readUploadField(record, ["brand", "brands"]);
      const servingValue = readUploadField(record, ["servingLabel", "servinglabel", "serving", "serving_size", "servingsize"]);
      const groupValue = String(readUploadField(record, ["group", "category", "foodgroup"]) ?? "custom").toLowerCase();
      const group: FoodGroup =
        groupValue === "protein" ||
        groupValue === "carb" ||
        groupValue === "fat" ||
        groupValue === "mixed" ||
        groupValue === "produce" ||
        groupValue === "hydration" ||
        groupValue === "supplement" ||
        groupValue === "branded"
          ? (groupValue as FoodGroup)
          : "common";

      const stableIdParts = [
        "custom",
        typeof record.barcode === "string" && record.barcode.trim()
          ? `barcode-${slugify(record.barcode)}`
          : slugify([label, typeof brandValue === "string" ? brandValue : ""].filter(Boolean).join("-")),
      ].filter(Boolean);

      return {
        id: stableIdParts.join("-") || `custom-food-${index}`,
        label,
        brand: typeof brandValue === "string" ? brandValue : undefined,
        barcode: typeof record.barcode === "string" ? record.barcode : undefined,
        source: "custom" as const,
        group,
        verified: true,
        servingLabel: typeof servingValue === "string" && servingValue.trim() ? servingValue : "1 serving",
        servingGrams: toNumber(readUploadField(record, ["servingGrams", "servinggrams", "serving_grams"]), 0) || undefined,
        nutrients: parseUploadedNutrients(record),
        note: typeof record.note === "string" ? record.note : "Uploaded custom food.",
      } satisfies FoodCatalogItem;
    })
    .filter(Boolean) as FoodCatalogItem[];
};
