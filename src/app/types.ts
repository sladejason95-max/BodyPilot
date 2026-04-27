export type CompoundCategory = "Base" | "Orals" | "Ancillary" | "Performance";
export type SupplementPattern = "daily" | "training" | "off-day" | "as-needed";
export type FoodSource = "core" | "community" | "custom";
export type FoodGroup =
  | "common"
  | "produce"
  | "protein"
  | "carb"
  | "fat"
  | "mixed"
  | "hydration"
  | "supplement"
  | "branded";

export type FoodNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  magnesiumMg?: number;
  zincMg?: number;
  vitaminCMg?: number;
  vitaminDMcg?: number;
  vitaminAMcg?: number;
  vitaminEMg?: number;
  vitaminKMcg?: number;
  folateMcg?: number;
  vitaminB12Mcg?: number;
  cholesterolMg?: number;
  saturatedFat?: number;
  fluidMl?: number;
};

export type FoodServingOption = {
  id: string;
  label: string;
  multiplier: number;
  grams?: number;
};

export type FoodCatalogItem = {
  id: string;
  label: string;
  brand?: string;
  barcode?: string;
  source: FoodSource;
  group: FoodGroup;
  verified: boolean;
  servingLabel: string;
  servingGrams?: number;
  servingOptions?: FoodServingOption[];
  imageUrl?: string;
  searchTokens?: string[];
  nutrients: FoodNutrients;
  note?: string;
  recipeItems?: FoodRecipeComponent[];
};

export type FoodRecipeComponent = {
  foodId: string;
  label: string;
  brand?: string;
  source: FoodSource;
  group: FoodGroup;
  servings: number;
  servingLabel: string;
  servingGrams?: number;
};

export type MealFoodEntry = {
  id: string;
  foodId: string;
  label: string;
  brand?: string;
  barcode?: string;
  source: FoodSource;
  group: FoodGroup;
  verified?: boolean;
  servings: number;
  selectedServingOptionId?: string;
  servingLabel: string;
  servingGrams?: number;
  baseServingLabel?: string;
  baseServingGrams?: number;
  baseNutrients?: FoodNutrients;
  servingOptions?: FoodServingOption[];
  imageUrl?: string;
  nutrients: FoodNutrients;
  note?: string;
  recipeItems?: FoodRecipeComponent[];
};

export type FoodLogItemInput = {
  food: FoodCatalogItem;
  servings: number;
  servingOptionId?: string;
  persistToCatalog?: boolean;
  addToRecent?: boolean;
};

export type CompoundDoseEntry = {
  id: string;
  day: string;
  amount: number;
};

export type CompoundScienceProfile = {
  receptorTags: string[];
  pathwayTags: string[];
  aromatizes?: boolean;
  dhtLike?: boolean;
  progestogenicContext?: boolean;
  ghIgf1SupportContext?: boolean;
  insulinSynergy?: boolean;
  thyroidSynergy?: boolean;
  digestionLimiter?: boolean;
  waterRisk?: boolean;
  rbcRisk?: boolean;
  cnsStressRisk?: boolean;
  liverStress?: "none" | "low" | "moderate" | "high";
  hormoneText: string;
  interactionText: string;
  synergyText: string;
  cautionText: string;
};

export type Compound = {
  id: string;
  name: string;
  category: CompoundCategory;
  enabled: boolean;
  dose: number;
  unit: string;
  fullness: number;
  dryness: number;
  performance: number;
  recovery: number;
  stress: number;
  digestion: number;
  note: string;
  halfLifeDays?: number;
  anabolicRating?: number;
  androgenicRating?: number;
  schedule?: CompoundDoseEntry[];
  science?: CompoundScienceProfile;
};

export type SupplementProtocol = {
  id: string;
  supplementId: string;
  enabled: boolean;
  dose: string;
  pattern: SupplementPattern;
  note?: string;
};

export type Meal = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  timing: string;
  type?: "standard" | "pre" | "intra" | "post" | "off";
  libraryFoodIds?: string[];
  fiberG?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  fluidMl?: number;
  satietyLevel?: "light" | "moderate" | "high";
  digestionLoad?: "light" | "moderate" | "high";
  micronutrientDensity?: "light" | "moderate" | "high";
  timingUse?: "flexible" | "pre" | "intra" | "post" | "off";
  note?: string;
  foodEntries?: MealFoodEntry[];
};

export type MealTemplate = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  timing: string;
  type?: Meal["type"];
  libraryFoodIds?: string[];
  fiberG?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  fluidMl?: number;
  satietyLevel?: "light" | "moderate" | "high";
  digestionLoad?: "light" | "moderate" | "high";
  micronutrientDensity?: "light" | "moderate" | "high";
  timingUse?: "flexible" | "pre" | "intra" | "post" | "off";
  note?: string;
  foodEntries?: MealFoodEntry[];
};

export type FoodDaySnapshot = {
  id: string;
  date: string;
  savedAt: string;
  meals: Meal[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foodEntries: number;
  loggedMeals: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  note?: string;
};

export type DecisionSignalGateTone = "sky" | "cyan" | "emerald" | "amber" | "rose" | "slate";
export type DecisionSignalGateStatus = "ready" | "caution" | "blocked";
export type DecisionSignalGateTab =
  | "dashboard"
  | "ai-coach"
  | "nutrition"
  | "compounds"
  | "split"
  | "tracker"
  | "library"
  | "schedule"
  | "coach";

export type DecisionSignalGateItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  actionLabel: string;
  tab: DecisionSignalGateTab;
  tone: DecisionSignalGateTone;
  blocking: boolean;
};

export type DecisionSignalGateCheck = {
  id: string;
  label: string;
  score: number;
  status: "ready" | "needs-work";
  title: string;
  detail: string;
  tone: DecisionSignalGateTone;
};

export type DecisionSignalGate = {
  status: DecisionSignalGateStatus;
  score: number;
  title: string;
  detail: string;
  tone: DecisionSignalGateTone;
  primaryActionLabel: string;
  primaryTab: DecisionSignalGateTab;
  missing: DecisionSignalGateItem[];
  checks: DecisionSignalGateCheck[];
};

export type DecisionBriefItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  actionLabel: string;
  tab: DecisionSignalGateTab;
  tone: DecisionSignalGateTone;
};

export type DecisionBrief = {
  eyebrow: string;
  title: string;
  detail: string;
  tone: DecisionSignalGateTone;
  scoreLabel: string;
  sourceLabel: string;
  primaryActionLabel: string;
  primaryTab: DecisionSignalGateTab;
  items: DecisionBriefItem[];
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  repRange: string;
  rir: number;
  note?: string;
};

export type ScheduleEvent = {
  id: string;
  day?: string;
  time: string;
  title: string;
  category: "Meal" | "Training" | "Recovery" | "Check-in" | "PEDs";
  detail: string;
};

export type WorkoutDay = {
  id: string;
  day: string;
  focus: string;
  intensity: number;
  volume: number;
  systemicLoad: number;
  exercises: WorkoutExercise[];
  pickerSearch?: string;
  pickerCategory?: string;
  pickerMuscle?: string;
  pickerFatigue?: string;
};

export type CheckInPhotoSlot = "front" | "side" | "back";

export type CheckIn = {
  id: string;
  label: string;
  date: string;
  bodyWeight: number;
  fullness: number;
  dryness: number;
  condition: number;
  training: number;
  recovery: number;
  waist: number;
  photos?: Partial<Record<CheckInPhotoSlot, string>>;
};

export type PeakWeekGoal = "dry" | "full" | "balanced";

export type PeakWeekDayPlan = {
  id: string;
  date: string;
  label: string;
  daysOut: number;
  emphasis: string;
  carbs: number;
  waterLiters: number;
  saltTsp: number;
  training: string;
  checkIn: string;
  action: string;
  riskFlag: string;
  tone: "slate" | "sky" | "amber" | "rose" | "emerald";
};

export type WearableSource = "Manual" | "Apple Health" | "Oura" | "Whoop" | "Garmin" | "CSV";

export type WearableRecoverySnapshot = {
  id: string;
  date: string;
  source: WearableSource;
  steps: number;
  sleepHours: number;
  sleepScore: number;
  restingHeartRate: number;
  hrvMs: number;
  bodyBattery?: number;
  recoveryStatus: "green" | "yellow" | "red";
  note?: string;
};

export type CoachThreadMessage = {
  id: string;
  createdAt: string;
  athleteId: string;
  athleteName: string;
  author: "coach" | "athlete";
  body: string;
  relatedDecisionId?: string;
  deliveryStatus?: "sent" | "delivered" | "read";
  deliveredAt?: string;
  readAt?: string;
};

export type TrackerTask = {
  id: string;
  label: string;
  done: boolean;
  category: string;
  target?: string;
};

export type TrackerLift = {
  id: string;
  name: string;
  plannedSets: number;
  plannedReps: string;
  rir: string;
  completed: boolean;
  actualSets: string;
  actualReps: string;
  weight: string;
  rpe: string;
  notes: string;
};

export type TrackerDay = {
  id: string;
  date: string;
  title: string;
  completion: number;
  bodyWeight: string;
  steps: string;
  energy: string;
  conditioningModalityId?: string;
  conditioningMinutes?: string;
  conditioningEffort?: string;
  posingRounds?: string;
  notes: string;
  lifts: TrackerLift[];
  closedAt?: string;
  closeoutStatus?: "closed" | "needs-review";
  closeoutNote?: string;
};

export type ChangeLogEntry = {
  id: string;
  date: string;
  category: "Nutrition" | "Training" | "Compounds" | "Recovery" | "Check-in" | "Coach" | "Membership";
  title: string;
  detail: string;
  impact?: string;
};

export type PublishedCoachDecision = {
  id: string;
  version?: number;
  athleteId: string;
  athleteName: string;
  createdAt: string;
  publishedAt: string;
  status: "published" | "acknowledged";
  title: string;
  reason: string;
  instruction: string;
  nextAction: string;
  limiter: string;
  weeksOut: number;
  decisionConfidenceScore: number;
  completionScore: number;
  complianceScore: number;
  checkInStatus: "due" | "soon" | "on-track";
  checkInTitle: string;
  queuedChanges: string[];
  summaryLines: string[];
  acknowledgedAt?: string;
  acknowledgmentNote?: string;
};

export type WeeklySnapshot = {
  id: string;
  weekLabel: string;
  date: string;
  bodyWeight: number;
  condition: number;
  recovery: number;
  completion: number;
  compliance: number;
  limiter: string;
  recommendation: string;
  notes?: string;
};

export type MonthDirection = "prev" | "next";

export type QuoteEntry = {
  text: string;
  tone: string;
};
