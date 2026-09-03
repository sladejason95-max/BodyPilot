const requiredMacroNames = [
  "energy-kcal",
  "proteins",
  "carbohydrates",
  "fat",
] as const;
const bases = ["serving", "100g"] as const;
const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

const explicitNonnegativeNumber = (value: unknown): boolean => {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  if (typeof value !== "string" || !numericPattern.test(value.trim()))
    return false;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= 0;
};

const statedMassGrams = (label: string): number | null => {
  const matches = [
    ...label.matchAll(
      /(?:^|[\s(])([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(?:grams?|g)\b/gi,
    ),
  ];
  if (matches.length !== 1) return null;
  const mass = Number(matches[0][1]);
  return Number.isFinite(mass) && mass > 0 ? mass : null;
};

const hasExplicitServingDescriptor = (label: string): boolean => {
  const match =
    /^(\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*(\d+(?:\.\d+)?))?\s*([a-z].*)$/i.exec(
      label,
    );
  if (!match) return false;
  const amount =
    Number(match[1]) / (match[2] === undefined ? 1 : Number(match[2]));
  if (!Number.isFinite(amount) || amount <= 0) return false;
  return !/^(?:servings?|portions?|units?)\b/i.test(match[3].trim());
};

const removeNutrientBasis = (
  nutriments: Record<string, unknown>,
  basis: "serving" | "100g",
) => {
  // Optional nutrients cannot be mixed across an unknown portion conversion either.
  for (const field of Object.keys(nutriments)) {
    if (field.endsWith(`_${basis}`)) delete nutriments[field];
  }
};

/**
 * Open Food Facts may omit macros or supply null/blank serving values.
 * Reject incomplete products and prevent the legacy normalizer from mixing
 * incompatible portion bases or manufacturing 100 g for an unknown serving.
 * Explicit zero remains valid; unknown nutrition is never converted to zero.
 */
export const prepareFoodProviderProduct = (
  product: Record<string, unknown>,
): Record<string, unknown> | null => {
  if (product === null || typeof product !== "object" || Array.isArray(product))
    return null;
  const raw = product.nutriments;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    return null;
  const nutriments = { ...raw } as Record<string, unknown>;

  for (const macro of requiredMacroNames) {
    let hasValidBasis = false;
    for (const basis of bases) {
      const field = `${macro}_${basis}`;
      if (explicitNonnegativeNumber(nutriments[field])) hasValidBasis = true;
      else delete nutriments[field];
    }
    if (!hasValidBasis) return null;
  }

  const label =
    typeof product.serving_size === "string" ? product.serving_size.trim() : "";
  const completeServing = requiredMacroNames.every((macro) =>
    explicitNonnegativeNumber(nutriments[`${macro}_serving`]),
  );
  const completeHundred = requiredMacroNames.every((macro) =>
    explicitNonnegativeNumber(nutriments[`${macro}_100g`]),
  );
  const mass = statedMassGrams(label);
  const suppliedQuantity =
    explicitNonnegativeNumber(product.serving_quantity) &&
    Number(product.serving_quantity) > 0
      ? Number(product.serving_quantity)
      : null;
  const quantityMatchesMass =
    mass !== null &&
    (suppliedQuantity === null ||
      Math.abs(mass - suppliedQuantity) <=
        Number.EPSILON * Math.max(1, mass, suppliedQuantity) * 8);
  const hasVolume =
    /(?:\d|\))\s*(?:ml|millilit(?:er|re)s?|lit(?:er|re)s?|l)\b/i.test(label);
  const volumeAmounts = [
    ...label.matchAll(
      /(?:^|[\s(])([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(?:ml|millilit(?:er|re)s?|lit(?:er|re)s?|l)\b/gi,
    ),
  ];
  const explicitVolume =
    volumeAmounts.length === 1 &&
    Number.isFinite(Number(volumeAmounts[0][1])) &&
    Number(volumeAmounts[0][1]) > 0;

  if (mass !== null && quantityMatchesMass && !hasVolume) {
    // An explicit mass makes serving <-> 100 g conversion meaningful. Set the
    // validated quantity so the old parser cannot prefer a conflicting fallback.
    return {
      ...product,
      serving_size: label,
      serving_quantity: mass,
      nutriments,
    };
  }

  if (
    completeServing &&
    mass === null &&
    (hasExplicitServingDescriptor(label) || explicitVolume)
  ) {
    // Count and liquid servings are useful without claiming a gram conversion.
    // Only the complete serving basis is usable; volume is never treated as mass.
    removeNutrientBasis(nutriments, "100g");
    return { ...product, serving_size: label, nutriments };
  }

  // OFF's *_100g fields can mean per 100 ml for liquids. Do not relabel them
  // as a mass when the product explicitly describes a liquid serving.
  if (hasVolume) return null;

  if (completeHundred) {
    removeNutrientBasis(nutriments, "serving");
    return {
      ...product,
      serving_size: "100 g",
      serving_quantity: 100,
      nutriments,
    };
  }

  return null;
};
