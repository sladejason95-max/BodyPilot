import {
  compoundCategoryLibrary,
  supplementLibrary,
  type CompoundCategoryLibraryEntry,
  type SupplementLibraryEntry,
} from "./performance_libraries";
import type {
  HydrationSupportModel,
  ProteinSupportModel,
  RecoveryPressureModel,
  ScienceTone,
} from "./science_model";
import type { Compound, SupplementProtocol } from "./types";

export type SupportProtocolItem = SupplementProtocol &
  SupplementLibraryEntry & {
    categoryLabel: string;
  };

export type SupportProtocolCard = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type SupportProtocolAction = {
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type SupportStackSnapshot = {
  items: SupportProtocolItem[];
  activeItems: SupportProtocolItem[];
  summaryCards: SupportProtocolCard[];
  flags: string[];
  primaryAction: SupportProtocolAction;
};

export type CompoundMonitoringSnapshot = {
  categoryCards: SupportProtocolCard[];
  flags: string[];
};

type SupportStackInput = {
  supplements: SupplementProtocol[];
  trainingDay: boolean;
  sleepHours: number;
  proteinSupportModel: ProteinSupportModel;
  hydrationSupportModel: HydrationSupportModel;
  recoveryPressureModel: RecoveryPressureModel;
};

type CompoundMonitoringInput = {
  compounds: Compound[];
  sleepHours: number;
  hydrationSupportModel: HydrationSupportModel;
  recoveryPressureModel: RecoveryPressureModel;
};

const categoryLabels: Record<SupplementLibraryEntry["category"], string> = {
  performance: "Performance",
  recovery: "Recovery",
  health: "Health",
  hydration: "Hydration",
};

const uniq = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const listSummary = (items: string[], emptyFallback: string) => {
  if (items.length === 0) return emptyFallback;
  if (items.length === 1) return items[0] ?? emptyFallback;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, 2).join(", ")}, +${items.length - 2} more`;
};

const enrichSupportItems = (supplements: SupplementProtocol[]): SupportProtocolItem[] => {
  const libraryById = new Map(supplementLibrary.map((item) => [item.id, item]));

  return supplements
    .map((item) => {
      const libraryEntry = libraryById.get(item.supplementId);
      if (!libraryEntry) return null;
      return {
        ...item,
        ...libraryEntry,
        categoryLabel: categoryLabels[libraryEntry.category],
      };
    })
    .filter(Boolean) as SupportProtocolItem[];
};

const getCategoryTone = (
  entry: CompoundCategoryLibraryEntry,
  sleepHours: number,
  hydrationSupportModel: HydrationSupportModel,
  recoveryPressureModel: RecoveryPressureModel
): ScienceTone => {
  if (entry.category === "Orals") return "rose";
  if (entry.category === "Performance") {
    return sleepHours < 6.5 || recoveryPressureModel.status === "high" || recoveryPressureModel.status === "strained"
      ? "amber"
      : "sky";
  }
  if (entry.category === "Base") {
    return hydrationSupportModel.status === "dilute" ? "amber" : "sky";
  }
  return "slate";
};

export const buildSupportStackSnapshot = (input: SupportStackInput): SupportStackSnapshot => {
  const {
    supplements,
    trainingDay,
    sleepHours,
    proteinSupportModel,
    hydrationSupportModel,
    recoveryPressureModel,
  } = input;
  const items = enrichSupportItems(supplements);
  const activeItems = items.filter((item) => item.enabled);
  const hasSupplement = (supplementId: string) => activeItems.some((item) => item.supplementId === supplementId);
  const strongEvidenceCount = activeItems.filter((item) => item.evidence === "strong").length;
  const moderateEvidenceCount = activeItems.filter((item) => item.evidence === "moderate").length;
  const trackedDomains = uniq(activeItems.flatMap((item) => item.trackedDomains)).slice(0, 5);

  const whey = items.find((item) => item.supplementId === "whey");
  const electrolyteMix = items.find((item) => item.supplementId === "electrolyte-mix");
  const caffeine = items.find((item) => item.supplementId === "caffeine");
  const creatine = items.find((item) => item.supplementId === "creatine-monohydrate");

  let primaryAction: SupportProtocolAction = {
    title: "No supplement change needed",
    detail: "Active support matches the logged day. Keep doses and timing stable.",
    tone: "emerald",
  };

  if (proteinSupportModel.status === "low" && !hasSupplement("whey")) {
    primaryAction = {
      title: "Add a low-volume protein fallback",
      detail: `${proteinSupportModel.detail} ${whey?.timingUse ?? "Use a simple protein fallback when whole-food intake gets harder to hit cleanly."}`,
      tone: "amber",
    };
  } else if (
    trainingDay &&
    (hydrationSupportModel.status === "low" || hydrationSupportModel.status === "dilute") &&
    !hasSupplement("electrolyte-mix")
  ) {
    primaryAction = {
      title: "Add training-day electrolyte support",
      detail: `${hydrationSupportModel.detail} ${electrolyteMix?.timingUse ?? "Use hydration support around training instead of random all-day swings."}`,
      tone: "amber",
    };
  } else if (
    hasSupplement("caffeine") &&
    (sleepHours < 6.5 || recoveryPressureModel.status === "high" || recoveryPressureModel.status === "strained")
  ) {
    primaryAction = {
      title: "Tighten caffeine timing before blaming recovery",
      detail: caffeine?.caution ?? "Caffeine can help output, but that gain is not free if it repeatedly damages sleep or raises stress.",
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
    };
  } else if (activeItems.length === 0) {
    primaryAction = {
      title: "Keep support intentional",
      detail: "No supplements are active right now. Add only the tools that close a real protein, hydration, or performance gap.",
      tone: "slate",
    };
  } else if (!hasSupplement("creatine-monohydrate") && trainingDay) {
    primaryAction = {
      title: "Foundation performance support is light",
      detail: `${creatine?.label ?? "Creatine"} is one of the cleaner evidence-backed support tools for long-horizon training output. ${creatine?.timingUse ?? ""}`.trim(),
      tone: "sky",
    };
  }

  const flags = uniq([
    proteinSupportModel.status === "low" && !hasSupplement("whey")
      ? "Protein support is light and no low-volume protein fallback is logged."
      : "",
    trainingDay && (hydrationSupportModel.status === "low" || hydrationSupportModel.status === "dilute") && !hasSupplement("electrolyte-mix")
      ? "Hydration support is off, but no electrolyte mix is active around training."
      : "",
    hasSupplement("caffeine") && (sleepHours < 6.5 || recoveryPressureModel.status === "high")
      ? "Caffeine is active while sleep or recovery is already under strain."
      : "",
    activeItems.length === 0
      ? "No active supplement protocol is logged right now."
      : "",
  ]).slice(0, 4);

  const summaryCards: SupportProtocolCard[] = [
    {
      label: "Protocol",
      title: activeItems.length > 0 ? `${activeItems.length} active tools` : "No active tools",
      detail:
        activeItems.length > 0
          ? listSummary(activeItems.map((item) => item.label), "No active tools")
          : "Add supplement support only when it closes a real gap.",
      tone: activeItems.length > 0 ? "sky" : "slate",
    },
    {
      label: "Evidence",
      title: `${strongEvidenceCount} strong, ${moderateEvidenceCount} moderate`,
      detail:
        activeItems.length > 0
          ? "Use support tools with the clearest evidence first, then keep the rest contextual."
          : "Nothing is active, so the evidence layer is intentionally quiet.",
      tone: strongEvidenceCount > 0 ? "emerald" : activeItems.length > 0 ? "sky" : "slate",
    },
    {
      label: "Coverage",
      title: trackedDomains.length > 0 ? `${trackedDomains.length} domains covered` : "Coverage not built yet",
      detail:
        trackedDomains.length > 0
          ? listSummary(trackedDomains, "Coverage not built yet")
          : "Performance, recovery, hydration, and protein support are still coming mostly from food and training structure.",
      tone: trackedDomains.length >= 3 ? "emerald" : trackedDomains.length > 0 ? "sky" : "slate",
    },
    {
      label: "Current watch",
      title: primaryAction.title,
      detail: primaryAction.detail,
      tone: primaryAction.tone,
    },
  ];

  return {
    items,
    activeItems,
    summaryCards,
    flags,
    primaryAction,
  };
};

export const buildCompoundMonitoringSnapshot = (input: CompoundMonitoringInput): CompoundMonitoringSnapshot => {
  const { compounds, sleepHours, hydrationSupportModel, recoveryPressureModel } = input;
  const enabledCompounds = compounds.filter((compound) => compound.enabled);
  const enabledCategories = uniq(enabledCompounds.map((compound) => compound.category));
  const categoryEntries = enabledCategories
    .map((category) => compoundCategoryLibrary.find((entry) => entry.category === category))
    .filter(Boolean) as CompoundCategoryLibraryEntry[];

  const categoryCards = categoryEntries.map((entry) => ({
    label: entry.category,
    title: entry.label,
    detail: `${entry.roleDescription} Watch ${listSummary(entry.monitoringFocus, "the main monitoring lanes")} first.`,
    tone: getCategoryTone(entry, sleepHours, hydrationSupportModel, recoveryPressureModel),
  }));

  const hasLiverStress = enabledCompounds.some(
    (compound) => compound.science?.liverStress === "moderate" || compound.science?.liverStress === "high"
  );
  const hasRbcRisk = enabledCompounds.some((compound) => Boolean(compound.science?.rbcRisk));
  const hasCnsStressRisk = enabledCompounds.some((compound) => Boolean(compound.science?.cnsStressRisk));

  const flags = uniq([
    enabledCategories.includes("Base")
      ? "Aromatizable base context affects fullness, water, and blood-pressure read. Do not judge the stack by look alone."
      : "",
    enabledCategories.includes("Performance") &&
    (sleepHours < 6.5 || recoveryPressureModel.status === "high" || recoveryPressureModel.status === "strained")
      ? "Performance / cosmetic exposure is active while sleep or recovery is already strained."
      : "",
    enabledCategories.includes("Orals")
      ? compoundCategoryLibrary.find((entry) => entry.category === "Orals")?.cautionBoundary ?? ""
      : "",
    enabledCategories.includes("Ancillary")
      ? compoundCategoryLibrary.find((entry) => entry.category === "Ancillary")?.cautionBoundary ?? ""
      : "",
    hasLiverStress ? "At least one active compound carries liver-stress context. Real monitoring needs clinical oversight." : "",
    hasRbcRisk ? "At least one active compound carries RBC pressure context. Blood pressure and hematology matter here." : "",
    hasCnsStressRisk && (sleepHours < 6.5 || recoveryPressureModel.status !== "supported")
      ? "A CNS-stress-heavy compound is active while recovery does not look fully supported."
      : "",
  ]).slice(0, 4);

  return {
    categoryCards,
    flags,
  };
};
