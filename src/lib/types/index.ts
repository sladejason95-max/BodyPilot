export type Compound = {
  name: string;
  category: "Base" | "Orals" | "Ancillary" | "Performance";
  enabled: boolean;
  dose: number;
  doseRef: number;
  minDose?: number;
  maxDose?: number;
  unit: string;
  mode: "signal" | "maintain";
  hormoneEffects: {
    androgen: number;
    estrogen: number;
    cortisol: number;
    insulinSensitivity: number;
    water: number;
    thyroid: number;
  };
  effects: {
    fullness: number;
    dryness: number;
    leanness: number;
    performance: number;
    sleep: number;
    digestion: number;
  };
  notes: string;
};

export type Meal = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
};

export type WorkoutDay = {
  id: string;
  day: string;
  focus: string;
  intensity: number;
};

export type Preset = {
  name: string;
  data: any;
};

export type CheckIn = {
  coachComment?: string;
  clientComment?: string;
  id: string;
  label: string;
  date: string;
  bodyWeight: number;
  weeksOut: number;
  carbTarget: number;
  proteinTarget: number;
  fatTarget: number;
  intraCarbs: number;
  fullnessScore: number;
  drynessScore: number;
  leannessScore: number;
  trainingScore: number;
  recoveryScore: number;
  waistTrend: number;
};

export type HormoneKey =
  | "insulin"
  | "cortisol"
  | "gh_signal"
  | "androgen_tone"
  | "aldosterone_water"
  | "thyroid_drive"
  | "estrogen_load";

export type Athlete = {
  id: string;
  name: string;
  division: string;
  status: string;
  weeksOut: number;
};

export type ChangeRequest = {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "approved" | "applied";
};

export type ChangeLogEntry = {
  id: string;
  actor: "coach" | "client";
  message: string;
};

export type HormoneDeltas = {
  testosterone: number;
  estrogen: number;
  cortisolShift: number;
  thyroidShift: number;
  insulinSensitivity: number;
  waterRetentionBias: number;
};