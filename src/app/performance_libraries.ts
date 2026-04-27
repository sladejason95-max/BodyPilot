import type { ExerciseLibraryItem } from "../lib/data/exerciseLibrary";
import type { CompoundCategory, Meal, MealTemplate } from "./types";

export type LibraryTone = "slate" | "sky" | "emerald" | "amber" | "rose";
export type EvidenceTier = "strong" | "moderate" | "limited" | "heuristic";
export type DemandBand = "low" | "moderate" | "high";
export type SupportBand = "light" | "moderate" | "high";

export type MuscleLibraryEntry = {
  id: string;
  label: string;
  region: "upper" | "lower" | "trunk";
  jointActions: string[];
  overlapGroups: string[];
  recoverySensitivity: DemandBand;
  coachingUse: string;
};

export type MovementPatternLibraryEntry = {
  id: string;
  label: string;
  primaryMuscles: string[];
  systemicBias: DemandBand;
  overlapGroups: string[];
  coachingUseCases: string[];
  progressionLanes: string[];
};

export type FoodLibraryEntry = {
  id: string;
  label: string;
  category: "protein" | "carb" | "fat" | "produce" | "hydration" | "mixed";
  serving: string;
  fiberG: number;
  sodiumMg: number;
  potassiumMg: number;
  fluidMl?: number;
  satietyLevel: SupportBand;
  digestionLoad: SupportBand;
  micronutrientDensity: SupportBand;
  timingUse: Array<Meal["type"] | "flexible">;
  coachingUse: string;
  caution?: string;
};

export type HydrationLogicEntry = {
  id: string;
  label: string;
  trigger: string;
  trackedInputs: string[];
  influences: string[];
  coachingUse: string;
};

export type SupplementLibraryEntry = {
  id: string;
  label: string;
  category: "performance" | "recovery" | "health" | "hydration";
  evidence: EvidenceTier;
  primaryOutcomes: string[];
  timingUse: string;
  trackedDomains: string[];
  caution?: string;
};

export type CompoundCategoryLibraryEntry = {
  id: string;
  category: CompoundCategory;
  label: string;
  roleDescription: string;
  monitoringFocus: string[];
  riskDomains: string[];
  cautionBoundary: string;
};

export type BiomarkerLibraryEntry = {
  id: string;
  label: string;
  domain: "recovery" | "health" | "body-comp" | "stress";
  influencedBy: string[];
  mayIndicate: string[];
  coachingUse: string;
  evidence: EvidenceTier;
};

export type BiofeedbackMetricLibraryEntry = {
  id: string;
  label: string;
  influencedBy: string[];
  influences: string[];
  coachingUse: string;
};

export type ConditioningModalityLibraryEntry = {
  id: string;
  label: string;
  intensityLane: "zone-2" | "tempo" | "interval" | "skill";
  impact: DemandBand;
  eccentricLoad: DemandBand;
  lowerBodyInterference: DemandBand;
  coachingUse: string;
};

export type BodyCompositionMetricLibraryEntry = {
  id: string;
  label: string;
  influencedBy: string[];
  bestUse: string;
  caution: string;
};

export type CoachingInterventionLibraryEntry = {
  id: string;
  label: string;
  targetDomains: string[];
  commonTriggers: string[];
  expectedLagDays: string;
  tradeoffs: string[];
  evidence: EvidenceTier;
};

export type AdaptationRuleLibraryEntry = {
  id: string;
  label: string;
  trigger: string;
  adjustment: string;
  rationale: string;
  evidence: EvidenceTier;
};

export type ExerciseScientificProfile = {
  exerciseId: string;
  movementPatternId: string;
  movementPatternLabel: string;
  position: "anchor" | "bridge" | "isolation";
  stabilityProfile: DemandBand;
  fatigueCost: DemandBand;
  recoveryDemand: DemandBand;
  overlapGroups: string[];
  primaryMuscles: string[];
  progressionRoutes: string[];
  limitationConsiderations: string[];
  coachingUseCases: string[];
  explanation: string;
};

export type MealPlanScienceProfile = {
  status: "unscored" | "partial" | "light-fiber" | "electrolyte-light" | "digestive-heavy" | "supported";
  title: string;
  detail: string;
  tone: LibraryTone;
  annotationCoverage: number;
  fiberG: number;
  sodiumMg: number;
  potassiumMg: number;
  fluidMl: number;
};

export type MealTemplateScientificProfile = {
  title: string;
  detail: string;
  chips: string[];
};

export const muscleLibrary: MuscleLibraryEntry[] = [
  {
    id: "quads",
    label: "Quads",
    region: "lower",
    jointActions: ["knee extension"],
    overlapGroups: ["knee-dominant-lower"],
    recoverySensitivity: "moderate",
    coachingUse: "Main knee-dominant lower-body driver and a big contributor to systemic stress when trained hard with compounds.",
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    region: "lower",
    jointActions: ["hip extension", "knee flexion"],
    overlapGroups: ["posterior-chain"],
    recoverySensitivity: "high",
    coachingUse: "Often limited by hinge fatigue and posterior-chain recovery more than by local work tolerance alone.",
  },
  {
    id: "glutes",
    label: "Glutes",
    region: "lower",
    jointActions: ["hip extension", "hip external rotation"],
    overlapGroups: ["posterior-chain", "knee-dominant-lower"],
    recoverySensitivity: "moderate",
    coachingUse: "High-output tissue that overlaps heavily with squatting, hinging, lunging, and machine pressing patterns.",
  },
  {
    id: "chest",
    label: "Chest",
    region: "upper",
    jointActions: ["horizontal adduction", "shoulder flexion"],
    overlapGroups: ["pressing"],
    recoverySensitivity: "moderate",
    coachingUse: "Usually tolerates multiple weekly exposures if shoulder irritation and triceps spillover are controlled.",
  },
  {
    id: "lats",
    label: "Lats",
    region: "upper",
    jointActions: ["shoulder extension", "adduction"],
    overlapGroups: ["pulling"],
    recoverySensitivity: "moderate",
    coachingUse: "Respond well to a mix of supported rows and shoulder-extension work without overloading erectors.",
  },
  {
    id: "upper-back",
    label: "Upper Back",
    region: "upper",
    jointActions: ["scapular retraction", "horizontal abduction"],
    overlapGroups: ["pulling", "scapular-control"],
    recoverySensitivity: "moderate",
    coachingUse: "Dense upper-back work can quietly stack fatigue across rows, rear-delt work, and loaded hinges.",
  },
  {
    id: "delts",
    label: "Delts",
    region: "upper",
    jointActions: ["shoulder abduction", "shoulder flexion"],
    overlapGroups: ["pressing", "scapular-control"],
    recoverySensitivity: "low",
    coachingUse: "Side and rear delts are often efficient volume add-ons when systemic recovery is limited.",
  },
  {
    id: "triceps",
    label: "Triceps",
    region: "upper",
    jointActions: ["elbow extension"],
    overlapGroups: ["pressing", "arm-work"],
    recoverySensitivity: "low",
    coachingUse: "Usually recover quickly, but can become the hidden limiter when pressing volume is already high.",
  },
  {
    id: "biceps",
    label: "Biceps",
    region: "upper",
    jointActions: ["elbow flexion", "supination"],
    overlapGroups: ["pulling", "arm-work"],
    recoverySensitivity: "low",
    coachingUse: "Low-cost direct work is often cleaner than asking rows and pulldowns to do all the arm-building.",
  },
  {
    id: "calves",
    label: "Calves",
    region: "lower",
    jointActions: ["plantar flexion"],
    overlapGroups: ["lower-accessory"],
    recoverySensitivity: "low",
    coachingUse: "Usually tolerate high frequency because the systemic cost of direct work is small.",
  },
  {
    id: "trunk",
    label: "Trunk",
    region: "trunk",
    jointActions: ["spinal flexion", "anti-extension", "rotation control"],
    overlapGroups: ["trunk-control"],
    recoverySensitivity: "low",
    coachingUse: "Best treated as a support domain that should not interfere with bracing quality for main lifts.",
  },
];

export const movementPatternLibrary: MovementPatternLibraryEntry[] = [
  {
    id: "squat-pattern",
    label: "Squat pattern",
    primaryMuscles: ["Quads", "Glutes", "Adductors"],
    systemicBias: "high",
    overlapGroups: ["knee-dominant-lower", "posterior-chain"],
    coachingUseCases: ["Main lower-body tension anchor", "Best when recovery can support heavier compound loading"],
    progressionLanes: ["Add reps inside a stable range", "Add load only when ROM and bracing stay clean"],
  },
  {
    id: "single-leg-squat",
    label: "Single-leg lower",
    primaryMuscles: ["Quads", "Glutes", "Adductors"],
    systemicBias: "moderate",
    overlapGroups: ["knee-dominant-lower", "posterior-chain"],
    coachingUseCases: ["Bias one side without another big axial exposure", "Useful when stable bilateral loading is limited"],
    progressionLanes: ["Own balance and ROM first", "Then add reps before load"],
  },
  {
    id: "hinge-pattern",
    label: "Hip hinge",
    primaryMuscles: ["Hamstrings", "Glutes", "Erectors"],
    systemicBias: "high",
    overlapGroups: ["posterior-chain"],
    coachingUseCases: ["Main posterior-chain anchor", "Use carefully when spinal or systemic fatigue is already high"],
    progressionLanes: ["Keep hinge mechanics fixed", "Use slower load progressions than with supported work"],
  },
  {
    id: "knee-flexion",
    label: "Knee flexion",
    primaryMuscles: ["Hamstrings"],
    systemicBias: "low",
    overlapGroups: ["posterior-chain"],
    coachingUseCases: ["Add hamstring work without another heavy hinge", "Useful for volume when recovery headroom is tight"],
    progressionLanes: ["Drive reps and control first", "Layer small load jumps second"],
  },
  {
    id: "glute-extension",
    label: "Glute extension",
    primaryMuscles: ["Glutes", "Hamstrings"],
    systemicBias: "moderate",
    overlapGroups: ["posterior-chain"],
    coachingUseCases: ["Target glutes without a maximal spinal cost", "Useful as a bridge between anchor and isolation work"],
    progressionLanes: ["Build clean lockout and ROM", "Add reps before chasing load aggressively"],
  },
  {
    id: "plantar-flexion",
    label: "Calf work",
    primaryMuscles: ["Calves"],
    systemicBias: "low",
    overlapGroups: ["lower-accessory"],
    coachingUseCases: ["Easy high-frequency work", "Usually safe to add even when the lower week is crowded"],
    progressionLanes: ["Own bottom-end ROM", "Progress reps and pauses before load"],
  },
  {
    id: "horizontal-press",
    label: "Horizontal press",
    primaryMuscles: ["Chest", "Front Delts", "Triceps"],
    systemicBias: "moderate",
    overlapGroups: ["pressing"],
    coachingUseCases: ["Main chest/triceps anchor", "Use machine variants when stability is the limiter"],
    progressionLanes: ["Keep bar path or machine path repeatable", "Add load only after rep quality holds"],
  },
  {
    id: "incline-press",
    label: "Incline press",
    primaryMuscles: ["Upper Chest", "Front Delts", "Triceps"],
    systemicBias: "moderate",
    overlapGroups: ["pressing"],
    coachingUseCases: ["Bias clavicular chest", "Useful when shoulder position and upper-chest intent matter"],
    progressionLanes: ["Progress reps across the target range", "Use smaller load jumps than flatter stable presses"],
  },
  {
    id: "vertical-press",
    label: "Vertical press",
    primaryMuscles: ["Front Delts", "Triceps", "Upper Chest"],
    systemicBias: "moderate",
    overlapGroups: ["pressing"],
    coachingUseCases: ["Pressing slot with more delt demand", "Good when chest volume is already high"],
    progressionLanes: ["Own ROM and scap control", "Then progress reps before load"],
  },
  {
    id: "chest-fly",
    label: "Chest fly",
    primaryMuscles: ["Chest", "Upper Chest"],
    systemicBias: "low",
    overlapGroups: ["pressing"],
    coachingUseCases: ["Add chest volume with low systemic cost", "Useful after a heavier press anchor"],
    progressionLanes: ["Stretch and control first", "Add reps before load"],
  },
  {
    id: "horizontal-row",
    label: "Horizontal row",
    primaryMuscles: ["Upper Back", "Lats", "Rear Delts", "Biceps"],
    systemicBias: "moderate",
    overlapGroups: ["pulling", "scapular-control"],
    coachingUseCases: ["Main upper-back anchor", "Choose chest-supported options when erectors are already busy"],
    progressionLanes: ["Lock in torso position", "Progress reps before load if setup stability is variable"],
  },
  {
    id: "vertical-pull",
    label: "Vertical pull",
    primaryMuscles: ["Lats", "Upper Back", "Biceps"],
    systemicBias: "moderate",
    overlapGroups: ["pulling"],
    coachingUseCases: ["Lat width and scapular depression slot", "Pairs well with a row instead of replacing it"],
    progressionLanes: ["Clean scap path first", "Then progress load or total reps"],
  },
  {
    id: "shoulder-extension",
    label: "Shoulder extension",
    primaryMuscles: ["Lats"],
    systemicBias: "low",
    overlapGroups: ["pulling"],
    coachingUseCases: ["Lat isolation without more elbow-flexor fatigue", "Useful when rows keep spilling into upper back or biceps"],
    progressionLanes: ["Own path and peak contraction", "Add reps before small load jumps"],
  },
  {
    id: "shoulder-abduction",
    label: "Shoulder abduction",
    primaryMuscles: ["Side Delts"],
    systemicBias: "low",
    overlapGroups: ["scapular-control"],
    coachingUseCases: ["Efficient delt volume", "Useful when pressing is already heavy enough"],
    progressionLanes: ["Bias clean ROM and tempo", "Progress reps before load"],
  },
  {
    id: "scapular-rear-delt",
    label: "Rear delt / scapular control",
    primaryMuscles: ["Rear Delts", "Upper Back", "External Rotators"],
    systemicBias: "low",
    overlapGroups: ["pulling", "scapular-control"],
    coachingUseCases: ["Low-cost upper-back polish", "Useful for shoulder balance and postural support"],
    progressionLanes: ["Bias position and intent", "Use rep quality before load"],
  },
  {
    id: "elbow-extension",
    label: "Elbow extension",
    primaryMuscles: ["Triceps"],
    systemicBias: "low",
    overlapGroups: ["arm-work", "pressing"],
    coachingUseCases: ["Direct triceps work with low system cost", "Useful when presses are not enough or are too joint-costly"],
    progressionLanes: ["Progress reps first", "Rotate implements before forcing painful loading"],
  },
  {
    id: "elbow-flexion",
    label: "Elbow flexion",
    primaryMuscles: ["Biceps", "Brachialis", "Forearms"],
    systemicBias: "low",
    overlapGroups: ["arm-work", "pulling"],
    coachingUseCases: ["Direct arm work with high specificity", "Useful when pulling slots stop progressing the arms"],
    progressionLanes: ["Own the long-length portion", "Add reps before load"],
  },
  {
    id: "trunk",
    label: "Trunk",
    primaryMuscles: ["Abs", "Obliques", "Hip Flexors"],
    systemicBias: "low",
    overlapGroups: ["trunk-control"],
    coachingUseCases: ["Support bracing and trunk control", "Keep it supportive instead of fatigue-dominant"],
    progressionLanes: ["Progress range and control", "Add reps before external load"],
  },
];

export const foodLibrary: FoodLibraryEntry[] = [
  {
    id: "cream-of-rice",
    label: "Cream of Rice",
    category: "carb",
    serving: "50 g dry",
    fiberG: 1,
    sodiumMg: 0,
    potassiumMg: 35,
    satietyLevel: "light",
    digestionLoad: "light",
    micronutrientDensity: "light",
    timingUse: ["pre", "post", "flexible"],
    coachingUse: "Fast-digesting carb base when the goal is fuel without much digestive drag.",
  },
  {
    id: "white-rice",
    label: "White Rice",
    category: "carb",
    serving: "200 g cooked",
    fiberG: 1,
    sodiumMg: 0,
    potassiumMg: 55,
    satietyLevel: "moderate",
    digestionLoad: "light",
    micronutrientDensity: "light",
    timingUse: ["pre", "post", "flexible"],
    coachingUse: "Easy carb base for training days and higher-food phases.",
  },
  {
    id: "potato",
    label: "Potato",
    category: "carb",
    serving: "300 g cooked",
    fiberG: 5,
    sodiumMg: 20,
    potassiumMg: 900,
    satietyLevel: "high",
    digestionLoad: "moderate",
    micronutrientDensity: "high",
    timingUse: ["post", "off", "flexible"],
    coachingUse: "Carb source with useful potassium and more satiety than rice-based options.",
  },
  {
    id: "oats",
    label: "Oats",
    category: "mixed",
    serving: "70 g dry",
    fiberG: 7,
    sodiumMg: 2,
    potassiumMg: 250,
    satietyLevel: "high",
    digestionLoad: "moderate",
    micronutrientDensity: "moderate",
    timingUse: ["off", "flexible"],
    coachingUse: "Useful when the day needs more fiber and satiety than simple training-window carbs provide.",
  },
  {
    id: "whey-isolate",
    label: "Whey Isolate",
    category: "protein",
    serving: "35 g scoop",
    fiberG: 0,
    sodiumMg: 80,
    potassiumMg: 160,
    fluidMl: 350,
    satietyLevel: "moderate",
    digestionLoad: "light",
    micronutrientDensity: "light",
    timingUse: ["pre", "post", "flexible"],
    coachingUse: "Lean protein support when food volume or digestion is limiting.",
  },
  {
    id: "chicken-breast",
    label: "Chicken Breast",
    category: "protein",
    serving: "170 g cooked",
    fiberG: 0,
    sodiumMg: 120,
    potassiumMg: 430,
    satietyLevel: "moderate",
    digestionLoad: "light",
    micronutrientDensity: "moderate",
    timingUse: ["post", "flexible"],
    coachingUse: "High-protein, low-fat backbone for tighter food phases.",
  },
  {
    id: "greek-yogurt",
    label: "Greek Yogurt",
    category: "mixed",
    serving: "250 g",
    fiberG: 0,
    sodiumMg: 85,
    potassiumMg: 300,
    satietyLevel: "moderate",
    digestionLoad: "light",
    micronutrientDensity: "moderate",
    timingUse: ["flexible", "post"],
    coachingUse: "Useful protein anchor when a softer-food texture or easier digestion is preferred.",
  },
  {
    id: "banana",
    label: "Banana",
    category: "produce",
    serving: "1 medium banana",
    fiberG: 3,
    sodiumMg: 1,
    potassiumMg: 420,
    satietyLevel: "moderate",
    digestionLoad: "light",
    micronutrientDensity: "moderate",
    timingUse: ["pre", "post", "flexible"],
    coachingUse: "Adds potassium and digestible carbs around training without much meal complexity.",
  },
  {
    id: "leafy-greens",
    label: "Leafy Greens",
    category: "produce",
    serving: "100 g",
    fiberG: 3,
    sodiumMg: 70,
    potassiumMg: 500,
    satietyLevel: "moderate",
    digestionLoad: "moderate",
    micronutrientDensity: "high",
    timingUse: ["off", "flexible"],
    coachingUse: "Low-calorie micronutrient and potassium support when the plan gets very food-restricted.",
  },
  {
    id: "electrolyte-drink",
    label: "Electrolyte Drink",
    category: "hydration",
    serving: "750 ml",
    fiberG: 0,
    sodiumMg: 700,
    potassiumMg: 120,
    fluidMl: 750,
    satietyLevel: "light",
    digestionLoad: "light",
    micronutrientDensity: "light",
    timingUse: ["intra", "pre"],
    coachingUse: "Most useful when sweating, training demand, or hot environments raise fluid and sodium losses.",
    caution: "Not a substitute for consistent all-day hydration or a coherent meal plan.",
  },
];

export const hydrationElectrolyteLibrary: HydrationLogicEntry[] = [
  {
    id: "training-day-base",
    label: "Training-day hydration base",
    trigger: "Planned resistance training or higher-output day",
    trackedInputs: ["water", "sodium", "potassium", "intra-workout carbs"],
    influences: ["readiness", "pump", "scale noise interpretation"],
    coachingUse: "Keeps hydration decisions anchored to actual training demand instead of random swings.",
  },
  {
    id: "dilution-risk",
    label: "Dilution risk",
    trigger: "Fluid rises while sodium and meal structure stay light",
    trackedInputs: ["water", "sodium", "meal timing"],
    influences: ["look stability", "GI comfort", "session feel"],
    coachingUse: "Flags when more water alone may not improve the day.",
  },
  {
    id: "food-linked-electrolytes",
    label: "Food-linked electrolyte support",
    trigger: "Meal map is the main source of potassium and sodium structure",
    trackedInputs: ["food choices", "meal density", "produce intake"],
    influences: ["muscle function", "hydration support", "cramp risk context"],
    coachingUse: "Connects hydration support to actual food choices, not just water input.",
  },
];

export const supplementLibrary: SupplementLibraryEntry[] = [
  {
    id: "creatine-monohydrate",
    label: "Creatine Monohydrate",
    category: "performance",
    evidence: "strong",
    primaryOutcomes: ["strength", "high-intensity output"],
    timingUse: "Daily.",
    trackedDomains: ["performance", "training output"],
  },
  {
    id: "caffeine",
    label: "Caffeine",
    category: "performance",
    evidence: "strong",
    primaryOutcomes: ["alertness", "acute output"],
    timingUse: "Pre-training or earlier work blocks.",
    trackedDomains: ["training output", "sleep"],
    caution: "Performance gain can be offset if it repeatedly damages sleep or raises stress load.",
  },
  {
    id: "whey",
    label: "Whey / Isolate",
    category: "recovery",
    evidence: "strong",
    primaryOutcomes: ["protein target", "low-volume protein"],
    timingUse: "As needed to hit protein.",
    trackedDomains: ["protein", "digestion"],
  },
  {
    id: "electrolyte-mix",
    label: "Electrolyte Mix",
    category: "hydration",
    evidence: "moderate",
    primaryOutcomes: ["hydration", "sweat loss"],
    timingUse: "Training, cardio, or heat.",
    trackedDomains: ["hydration", "session feel", "cardio tolerance"],
  },
  {
    id: "fish-oil",
    label: "Fish Oil",
    category: "health",
    evidence: "moderate",
    primaryOutcomes: ["EPA/DHA"],
    timingUse: "Daily.",
    trackedDomains: ["omega-3"],
  },
];

export const compoundCategoryLibrary: CompoundCategoryLibraryEntry[] = [
  {
    id: "base",
    category: "Base",
    label: "Aromatizable base layer",
    roleDescription: "Context-setting androgen backbone that affects fullness, estradiol support, and stack stability.",
    monitoringFocus: ["water/fullness read", "libido context", "blood pressure", "hematocrit"],
    riskDomains: ["water pressure", "estrogen balance", "RBC pressure"],
    cautionBoundary: "Track and review; do not automate medical or dosing decisions from app heuristics.",
  },
  {
    id: "performance",
    category: "Performance",
    label: "Performance / cosmetic layer",
    roleDescription: "Changes the look, drive, stress load, and recovery feel relative to the base environment.",
    monitoringFocus: ["sleep", "stress", "digestion", "look stability"],
    riskDomains: ["CNS stress", "digestion strain", "hormonal imbalance context"],
    cautionBoundary: "Use as context only; coaching logic should never become an unsupervised dosing engine.",
  },
  {
    id: "orals",
    category: "Orals",
    label: "Oral exposure layer",
    roleDescription: "Usually shorter-horizon interventions with more liver, appetite, or blood-pressure considerations.",
    monitoringFocus: ["liver markers", "blood pressure", "appetite", "GI tolerance"],
    riskDomains: ["liver stress", "BP strain", "digestion shifts"],
    cautionBoundary: "Requires clinical oversight for real safety monitoring.",
  },
  {
    id: "ancillary",
    category: "Ancillary",
    label: "Ancillary support",
    roleDescription: "Health-management or side-effect-management layer around the main stack context.",
    monitoringFocus: ["symptom response", "lab context", "blood pressure"],
    riskDomains: ["masking symptoms", "false reassurance"],
    cautionBoundary: "The app can track context and prompts, not replace medical care.",
  },
];

export const biomarkerLibrary: BiomarkerLibraryEntry[] = [
  {
    id: "bodyweight-trend",
    label: "Bodyweight Trend",
    domain: "body-comp",
    influencedBy: ["energy intake", "output", "hydration", "digestion"],
    mayIndicate: ["rate of loss", "plan adherence", "water noise context"],
    coachingUse: "Primary objective bridge between food, output, and body-composition change.",
    evidence: "strong",
  },
  {
    id: "blood-pressure",
    label: "Blood Pressure",
    domain: "health",
    influencedBy: ["bodyweight", "stress", "hydration", "pharmacology context"],
    mayIndicate: ["cardiovascular strain", "excessive stack pressure", "recovery strain context"],
    coachingUse: "Health guardrail that can override purely physique-driven decisions.",
    evidence: "strong",
  },
  {
    id: "resting-heart-rate",
    label: "Resting Heart Rate",
    domain: "recovery",
    influencedBy: ["sleep", "stress", "cardio fitness", "illness context", "diet pressure"],
    mayIndicate: ["systemic strain", "poor recovery", "cardio adaptation"],
    coachingUse: "Useful trend variable when interpreted alongside sleep and workload, not alone.",
    evidence: "moderate",
  },
  {
    id: "fasting-glucose",
    label: "Fasting Glucose",
    domain: "health",
    influencedBy: ["carbohydrate intake", "sleep", "stress", "body composition", "pharmacology context"],
    mayIndicate: ["glycemic handling context", "stress burden"],
    coachingUse: "Useful for context, especially when compounds or aggressive dieting may distort appetite and glucose handling.",
    evidence: "moderate",
  },
  {
    id: "hematocrit",
    label: "Hematocrit",
    domain: "health",
    influencedBy: ["hydration", "erythropoietic stimulus", "pharmacology context"],
    mayIndicate: ["RBC pressure", "viscosity risk context"],
    coachingUse: "Important safety marker when androgen exposure is part of the athlete context.",
    evidence: "strong",
  },
  {
    id: "alt-ast",
    label: "ALT / AST",
    domain: "health",
    influencedBy: ["training damage", "oral exposures", "illness", "liver stress"],
    mayIndicate: ["hepatic stress context", "recent heavy training"],
    coachingUse: "Use with context, not as a one-number story.",
    evidence: "strong",
  },
];

export const biofeedbackMetricLibrary: BiofeedbackMetricLibraryEntry[] = [
  {
    id: "sleep-quality",
    label: "Sleep quality",
    influencedBy: ["stress", "caffeine", "late training", "pharmacology context"],
    influences: ["recovery", "readiness", "hunger", "decision confidence"],
    coachingUse: "One of the highest-leverage recovery reads if it is logged honestly and consistently.",
  },
  {
    id: "digestion",
    label: "Digestion",
    influencedBy: ["food volume", "food choice", "stress", "pharmacology context"],
    influences: ["food compliance", "training comfort", "look stability"],
    coachingUse: "Useful when execution looks poor for food-related reasons rather than motivation alone.",
  },
  {
    id: "hunger",
    label: "Hunger",
    influencedBy: ["diet pressure", "sleep", "food composition", "activity"],
    influences: ["compliance", "food decision quality"],
    coachingUse: "Helpful for deciding whether the problem is the target itself or the structure used to reach it.",
  },
  {
    id: "joint-irritation",
    label: "Joint irritation",
    influencedBy: ["exercise selection", "loading style", "recovery support"],
    influences: ["exercise retention", "progression routes", "volume tolerance"],
    coachingUse: "Should push exercise selection toward more repeatable patterns before it turns into missed work.",
  },
  {
    id: "libido-mood",
    label: "Libido / mood stability",
    influencedBy: ["diet pressure", "stress", "sleep", "hormonal context"],
    influences: ["compliance", "recovery context", "pharmacology read"],
    coachingUse: "Contextual read for deeper recovery or hormonal disruption, not a standalone decision maker.",
  },
];

export const conditioningModalityLibrary: ConditioningModalityLibraryEntry[] = [
  {
    id: "incline-walk",
    label: "Incline treadmill walk",
    intensityLane: "zone-2",
    impact: "low",
    eccentricLoad: "low",
    lowerBodyInterference: "low",
    coachingUse: "Default conditioning option when fat loss is needed without much recovery interference.",
  },
  {
    id: "bike",
    label: "Bike",
    intensityLane: "zone-2",
    impact: "low",
    eccentricLoad: "low",
    lowerBodyInterference: "low",
    coachingUse: "Useful when foot impact or step volume is already high.",
  },
  {
    id: "stepmill",
    label: "Stepmill",
    intensityLane: "tempo",
    impact: "moderate",
    eccentricLoad: "moderate",
    lowerBodyInterference: "moderate",
    coachingUse: "Efficient calorie work, but it can collide with lower-body recovery faster than easy incline walking.",
  },
  {
    id: "interval-bike",
    label: "Interval bike",
    intensityLane: "interval",
    impact: "low",
    eccentricLoad: "moderate",
    lowerBodyInterference: "high",
    coachingUse: "High fatigue cost for prep phases; use sparingly and deliberately.",
  },
  {
    id: "posing-rounds",
    label: "Posing rounds",
    intensityLane: "skill",
    impact: "low",
    eccentricLoad: "low",
    lowerBodyInterference: "low",
    coachingUse: "Sport-specific conditioning and presentation work that still counts toward fatigue and readiness context.",
  },
];

export const bodyCompositionMetricLibrary: BodyCompositionMetricLibraryEntry[] = [
  {
    id: "scale-trend",
    label: "Scale trend",
    influencedBy: ["energy balance", "hydration", "digestion", "cycle noise"],
    bestUse: "Primary objective pace read when averaged over time.",
    caution: "Do not interpret single-day changes as true tissue gain or loss.",
  },
  {
    id: "waist-measure",
    label: "Waist measure",
    influencedBy: ["fat loss", "bloat", "GI content"],
    bestUse: "Helpful secondary confirmation for scale trend during a cut.",
    caution: "Sensitive to meal timing, stress, and digestion noise.",
  },
  {
    id: "check-in-photos",
    label: "Check-in photos",
    influencedBy: ["body composition", "hydration", "lighting", "presentation"],
    bestUse: "Best contextual read of where loss is showing up and whether look quality is improving.",
    caution: "Only useful when photo setup is consistent.",
  },
  {
    id: "performance-trend",
    label: "Performance trend",
    influencedBy: ["fueling", "fatigue", "exercise stability", "motivation"],
    bestUse: "Tells you whether the plan is still supportable while body composition is changing.",
    caution: "Needs stable exercise selection and logging to mean much.",
  },
];

export const coachingInterventionLibrary: CoachingInterventionLibraryEntry[] = [
  {
    id: "swap-to-supported-patterns",
    label: "Swap to more supported patterns",
    targetDomains: ["exercise selection", "fatigue", "joint tolerance"],
    commonTriggers: ["high systemic fatigue", "joint irritation", "missed quality on skill-heavy anchors"],
    expectedLagDays: "3-10 days",
    tradeoffs: ["Slightly less absolute loading", "Often better repeatability"],
    evidence: "moderate",
  },
  {
    id: "add-training-window-carbs",
    label: "Add training-window carbs",
    targetDomains: ["fuel timing", "training output", "recovery feel"],
    commonTriggers: ["under-fueled sessions", "high output demand", "digestion is calm but performance is flat"],
    expectedLagDays: "1-5 days",
    tradeoffs: ["May blur the look if total intake is already too high", "Requires adherence elsewhere"],
    evidence: "moderate",
  },
  {
    id: "tighten-meal-composition",
    label: "Tighten meal composition",
    targetDomains: ["digestion", "compliance", "hydration consistency"],
    commonTriggers: ["mixed food execution", "bloat", "poor training-window tolerance"],
    expectedLagDays: "1-7 days",
    tradeoffs: ["Less spontaneity", "Often better execution and cleaner read"],
    evidence: "heuristic",
  },
  {
    id: "pull-volume-from-lower",
    label: "Pull volume from lower body",
    targetDomains: ["recovery", "fatigue", "performance retention"],
    commonTriggers: ["lower-body fatigue spillover", "hinge recovery strain", "cardio interference"],
    expectedLagDays: "3-10 days",
    tradeoffs: ["Less volume", "Often higher quality on remaining work"],
    evidence: "moderate",
  },
  {
    id: "standardize-fluid-sodium",
    label: "Standardize fluid and sodium",
    targetDomains: ["hydration", "look stability", "readiness"],
    commonTriggers: ["look noise", "random food choices", "large day-to-day hydration swings"],
    expectedLagDays: "1-4 days",
    tradeoffs: ["Requires routine", "Improves signal quality"],
    evidence: "moderate",
  },
];

export const adaptationRuleLibrary: AdaptationRuleLibraryEntry[] = [
  {
    id: "anchor-then-fill",
    label: "Anchor then fill",
    trigger: "A day already has one or two high-cost anchor lifts in place.",
    adjustment: "Bias the rest of the day toward bridge and isolation slots instead of piling on more anchors.",
    rationale: "Muscle stimulus usually scales better than recovery when the whole day is built from expensive compounds.",
    evidence: "heuristic",
  },
  {
    id: "reps-before-load-on-isolation",
    label: "Reps before load on isolation work",
    trigger: "Single-joint or very stable movements.",
    adjustment: "Progress reps and control first, then add small load jumps.",
    rationale: "This keeps tension quality cleaner and usually avoids needless joint irritation.",
    evidence: "moderate",
  },
  {
    id: "protect-output-when-cutting-fast",
    label: "Protect output when the cut is fast",
    trigger: "Bodyweight pace and recovery both suggest aggressive diet pressure.",
    adjustment: "Make the smallest possible food or volume change that preserves session quality first.",
    rationale: "Performance usually falls before the look tells you the plan has gone too far.",
    evidence: "moderate",
  },
  {
    id: "reduce-noise-before-cutting-harder",
    label: "Reduce noise before cutting harder",
    trigger: "Trend and plan disagree while adherence or hydration is messy.",
    adjustment: "Improve compliance and consistency before making a bigger diet or cardio move.",
    rationale: "Poor signal quality creates false urgency.",
    evidence: "strong",
  },
];

const bandFromScore = (value: number, moderate = 4, high = 7): DemandBand => {
  if (value >= high) return "high";
  if (value >= moderate) return "moderate";
  return "low";
};

const toneFromBand = (value: DemandBand): LibraryTone => {
  if (value === "high") return "amber";
  if (value === "moderate") return "sky";
  return "emerald";
};

const topMusclesForExercise = (exercise: ExerciseLibraryItem) =>
  [...(exercise.muscleBias ?? [])]
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, 3)
    .map((bias) => bias.muscle);

const inferMovementPatternId = (exercise: ExerciseLibraryItem) => {
  const name = exercise.name.toLowerCase();
  if (/split squat|reverse lunge|walking lunge|step-up/.test(name)) return "single-leg-squat";
  if (/squat|leg press|pendulum|v-squat|belt squat|goblet/.test(name)) return "squat-pattern";
  if (/deadlift|romanian|good morning|back extension/.test(name)) return "hinge-pattern";
  if (/leg curl|glute ham|nordic/.test(name)) return "knee-flexion";
  if (/hip thrust|glute kickback|hip abduction/.test(name)) return "glute-extension";
  if (/calf/.test(name)) return "plantar-flexion";
  if (/shoulder press/.test(name)) return "vertical-press";
  if (/incline/.test(name) && /press|bench/.test(name)) return "incline-press";
  if (/bench|chest press|dip|cable press|decline press/.test(name)) return "horizontal-press";
  if (/fly|pec deck/.test(name)) return "chest-fly";
  if (/rear delt|face pull|y raise/.test(name)) return "scapular-rear-delt";
  if (/lateral raise|upright row/.test(name)) return "shoulder-abduction";
  if (/pullover|straight arm pulldown/.test(name)) return "shoulder-extension";
  if (/pulldown|pull-up/.test(name)) return "vertical-pull";
  if (/row/.test(name)) return "horizontal-row";
  if (/pressdown|extension|skullcrusher/.test(name)) return "elbow-extension";
  if (/curl/.test(name)) return "elbow-flexion";
  if (/crunch|leg raise|sit-up|rollout|woodchop/.test(name)) return "trunk";

  const primaryMuscle = topMusclesForExercise(exercise)[0] ?? "";
  if (["Chest", "Upper Chest"].includes(primaryMuscle)) return "horizontal-press";
  if (["Lats", "Upper Back"].includes(primaryMuscle)) return "horizontal-row";
  if (["Quads"].includes(primaryMuscle)) return "squat-pattern";
  if (["Hamstrings"].includes(primaryMuscle)) return "hinge-pattern";
  if (["Calves"].includes(primaryMuscle)) return "plantar-flexion";
  return "trunk";
};

const inferPosition = (exercise: ExerciseLibraryItem, movementPatternId: string): ExerciseScientificProfile["position"] => {
  const topContribution = topMusclesForExercise(exercise)[0];
  const highestBias = (exercise.muscleBias ?? []).find((bias) => bias.muscle === topContribution)?.contribution ?? 0;
  if (
    movementPatternId === "knee-flexion" ||
    movementPatternId === "plantar-flexion" ||
    movementPatternId === "chest-fly" ||
    movementPatternId === "shoulder-abduction" ||
    movementPatternId === "shoulder-extension" ||
    movementPatternId === "elbow-extension" ||
    movementPatternId === "elbow-flexion" ||
    movementPatternId === "trunk" ||
    highestBias >= 85
  ) {
    return "isolation";
  }

  if (
    Number(exercise.axialLoad ?? 0) >= 4 ||
    Number(exercise.systemicFatigue ?? 0) >= 6 ||
    Number(exercise.skillDemand ?? 0) >= 5
  ) {
    return "anchor";
  }

  return "bridge";
};

const inferProgressionRoutes = (position: ExerciseScientificProfile["position"], movementPatternLabel: string) => {
  if (position === "anchor") {
    return [
      `Keep ${movementPatternLabel.toLowerCase()} execution stable before adding load.`,
      "Add sets only after recovery and performance still look clean.",
    ];
  }

  if (position === "bridge") {
    return [
      "Progress reps inside the range first, then use small load jumps.",
      "Use it to fill the missing slot without creating another main-lift recovery bill.",
    ];
  }

  return [
    "Bias cleaner reps, ROM, and target-muscle control before loading harder.",
    "Use it to add precise volume where the week needs more stimulus, not more chaos.",
  ];
};

const inferLimitations = (exercise: ExerciseLibraryItem, position: ExerciseScientificProfile["position"]) => {
  const limitations: string[] = [];
  if (Number(exercise.axialLoad ?? 0) >= 7) limitations.push("High axial loading can spill fatigue across the whole week.");
  if (Number(exercise.stabilityDemand ?? 0) >= 6) limitations.push("Balance and setup may limit output before the target muscle does.");
  if (Number(exercise.skillDemand ?? 0) >= 6) limitations.push("Progress only if technique is stable enough to keep the signal clean.");
  if (Number(exercise.jointFriendliness ?? 0) <= 5) limitations.push("Tolerance varies more than average, so this should earn its place.");
  if (position === "isolation" && Number(exercise.jointFriendliness ?? 0) >= 7) {
    limitations.push("Usually easy to recover from, so use it to add precision rather than ego load.");
  }
  return limitations.slice(0, 2);
};

const inferCoachingUseCases = (
  exercise: ExerciseLibraryItem,
  movementPattern: MovementPatternLibraryEntry,
  position: ExerciseScientificProfile["position"]
) => {
  const useCases = [...movementPattern.coachingUseCases];
  if (position === "anchor") useCases.push("Use it early in the session when high-quality output matters most.");
  if (position === "bridge") useCases.push("Useful when you need meaningful work without another maximal recovery hit.");
  if (position === "isolation") useCases.push("Useful to target a lagging muscle without forcing the whole day to get more expensive.");
  if (Number(exercise.systemicFatigue ?? 0) <= 3) useCases.push("Repeatable enough to stay in rotation during harder dieting phases.");
  return Array.from(new Set(useCases)).slice(0, 3);
};

export const buildExerciseScientificProfile = (exercise: ExerciseLibraryItem): ExerciseScientificProfile => {
  const movementPatternId = inferMovementPatternId(exercise);
  const movementPattern =
    movementPatternLibrary.find((item) => item.id === movementPatternId) ?? movementPatternLibrary[movementPatternLibrary.length - 1];
  const position = inferPosition(exercise, movementPatternId);
  const stabilityProfile = bandFromScore(Number(exercise.stabilityDemand ?? 0), 3, 6);
  const fatigueCost = bandFromScore(
    Number(exercise.fatigue ?? 0) * 0.55 + Number(exercise.systemicFatigue ?? 0) * 0.45,
    4.2,
    7.1
  );
  const recoveryDemand = bandFromScore(
    Number(exercise.fatigue ?? 0) * 0.45 + Number(exercise.systemicFatigue ?? 0) * 0.4 + Number(exercise.axialLoad ?? 0) * 0.15,
    4.4,
    7.3
  );
  const primaryMuscles = topMusclesForExercise(exercise);
  const overlapGroups = Array.from(
    new Set([
      ...movementPattern.overlapGroups,
      ...primaryMuscles.flatMap((muscle) =>
        muscleLibrary.find((item) => item.label === muscle)?.overlapGroups ?? [muscle.toLowerCase()]
      ),
    ])
  ).slice(0, 4);
  const explanation = `${movementPattern.label} ${position} with ${fatigueCost} fatigue cost and ${recoveryDemand} recovery demand. Primary read: ${primaryMuscles.join(", ")}.`;

  return {
    exerciseId: exercise.id,
    movementPatternId,
    movementPatternLabel: movementPattern.label,
    position,
    stabilityProfile,
    fatigueCost,
    recoveryDemand,
    overlapGroups,
    primaryMuscles,
    progressionRoutes: inferProgressionRoutes(position, movementPattern.label),
    limitationConsiderations: inferLimitations(exercise, position),
    coachingUseCases: inferCoachingUseCases(exercise, movementPattern, position),
    explanation,
  };
};

export const resolveFocusPatternTargets = (focus: string) => {
  const focusLower = focus.toLowerCase();
  if (focusLower.includes("push")) {
    return ["incline-press", "horizontal-press", "chest-fly", "shoulder-abduction", "elbow-extension"];
  }
  if (focusLower.includes("pull")) {
    return ["horizontal-row", "vertical-pull", "scapular-rear-delt", "elbow-flexion"];
  }
  if (focusLower.includes("leg") || focusLower.includes("lower")) {
    return ["squat-pattern", "hinge-pattern", "knee-flexion", "plantar-flexion"];
  }
  if (focusLower.includes("upper")) {
    return ["incline-press", "horizontal-row", "vertical-pull", "shoulder-abduction", "elbow-flexion", "elbow-extension"];
  }
  if (focusLower.includes("arm")) {
    return ["elbow-flexion", "elbow-extension", "shoulder-abduction"];
  }
  return [];
};

export const buildMealTemplateScientificProfile = (meal: Meal | MealTemplate): MealTemplateScientificProfile => {
  const satiety = meal.satietyLevel ?? "moderate";
  const digestion = meal.digestionLoad ?? "moderate";
  const timingUse = meal.timingUse ?? (meal.type ?? "flexible");
  const chips = [
    `${satiety} satiety`,
    `${digestion} digestion`,
    meal.fiberG ? `${meal.fiberG} g fiber` : "low fiber",
    meal.potassiumMg && meal.potassiumMg >= 500 ? "potassium support" : meal.sodiumMg && meal.sodiumMg >= 500 ? "sodium support" : "macro-first",
  ];

  const timingRead =
    timingUse === "flexible"
      ? "Flexible placement."
      : timingUse === "pre"
        ? "Built for the pre-training slot."
        : timingUse === "intra"
          ? "Built for the intra-training slot."
          : timingUse === "post"
            ? "Built for the post-training slot."
            : timingUse === "off"
              ? "Built for lower-output meals."
              : "Flexible placement.";

  const detail = [
    timingRead,
    meal.note,
    meal.sodiumMg || meal.potassiumMg
      ? `${meal.sodiumMg ?? 0} mg sodium, ${meal.potassiumMg ?? 0} mg potassium.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title:
      meal.micronutrientDensity === "high"
        ? "Food quality support"
        : meal.type === "intra"
          ? "Training support"
          : meal.type === "pre" || meal.type === "post"
            ? "Training-window meal"
            : "Meal structure",
    detail,
    chips,
  };
};

export const buildMealPlanScienceProfile = (meals: Meal[], trainingDay: boolean): MealPlanScienceProfile => {
  const annotatedMeals = meals.filter(
    (meal) =>
      meal.fiberG !== undefined ||
      meal.sodiumMg !== undefined ||
      meal.potassiumMg !== undefined ||
      meal.fluidMl !== undefined ||
      meal.digestionLoad !== undefined ||
      meal.micronutrientDensity !== undefined
  );

  if (annotatedMeals.length === 0) {
    return {
      status: "unscored",
      title: "Food context still blank",
      detail: "Use saved meal templates or annotated foods to read fiber, electrolyte, and digestion structure.",
      tone: "slate",
      annotationCoverage: 0,
      fiberG: 0,
      sodiumMg: 0,
      potassiumMg: 0,
      fluidMl: 0,
    };
  }

  const fiberG = annotatedMeals.reduce((sum, meal) => sum + (meal.fiberG ?? 0), 0);
  const sodiumMg = annotatedMeals.reduce((sum, meal) => sum + (meal.sodiumMg ?? 0), 0);
  const potassiumMg = annotatedMeals.reduce((sum, meal) => sum + (meal.potassiumMg ?? 0), 0);
  const fluidMl = annotatedMeals.reduce((sum, meal) => sum + (meal.fluidMl ?? 0), 0);
  const heavyMeals = annotatedMeals.filter((meal) => meal.digestionLoad === "high").length;
  const annotationCoverage = Number((annotatedMeals.length / Math.max(meals.length, 1)).toFixed(2));

  if (annotationCoverage < 0.6) {
    return {
      status: "partial",
      title: `${fiberG} g fiber, partial food map`,
      detail: "Only part of the meal flow is scientifically tagged right now, so food-quality reads are still incomplete.",
      tone: "slate",
      annotationCoverage,
      fiberG,
      sodiumMg,
      potassiumMg,
      fluidMl,
    };
  }

  if (trainingDay && heavyMeals >= 2) {
    return {
      status: "digestive-heavy",
      title: "Food flow looks heavy",
      detail: `${heavyMeals} meal blocks read as heavier digestion. That can cap training output before total macros do.`,
      tone: "amber",
      annotationCoverage,
      fiberG,
      sodiumMg,
      potassiumMg,
      fluidMl,
    };
  }

  if (fiberG < 18) {
    return {
      status: "light-fiber",
      title: `${fiberG} g fiber`,
      detail: "The current meal map is light on fiber-dense food structure, so satiety and food quality support may be thin.",
      tone: "amber",
      annotationCoverage,
      fiberG,
      sodiumMg,
      potassiumMg,
      fluidMl,
    };
  }

  if (trainingDay && sodiumMg < 1400 && potassiumMg < 1800) {
    return {
      status: "electrolyte-light",
      title: "Add electrolytes to training food",
      detail: `Add sodium and potassium today. Current tagged meal flow has ${sodiumMg} mg sodium and ${potassiumMg} mg potassium.`,
      tone: "amber",
      annotationCoverage,
      fiberG,
      sodiumMg,
      potassiumMg,
      fluidMl,
    };
  }

  return {
    status: "supported",
    title: `${fiberG} g fiber, ${potassiumMg} mg K`,
    detail:
      trainingDay
        ? "The meal map has enough fiber and electrolyte density to support a cleaner training-day read."
        : "The meal map carries enough fiber and food quality support to make the off day feel steadier.",
    tone: toneFromBand(trainingDay ? "low" : "moderate"),
    annotationCoverage,
    fiberG,
    sodiumMg,
    potassiumMg,
    fluidMl,
  };
};
