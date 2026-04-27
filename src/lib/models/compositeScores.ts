import { clamp, diminishing, softCap } from "@/lib/utils/math";

export type CompositeScoresInput = {
  pump: number;
  fullness: number;
  intraCarbs: number;
  sodiumEstimate: { intraTotal: number };
  hormoneModel: {
    androgen_tone: number;
    aldosterone_water: number;
    estrogen_load: number;
    thyroid_drive: number;
    cortisol: number;
  };
  macroModel: {
    carbEfficiency: number;
    proteinEfficiency: number;
    fatEfficiency: number;
    spillRisk: number;
    recoverySupport: number;
  };
  dryness: number;
  sleepQuality: number;
  weeksOut: number;
  weightTrend: number;
  waistTrend: number;
  digestion: number;
  avgIntensity: number;
  compoundModel: {
    fullness: number;
    dryness: number;
    leanness: number;
    performance: number;
    water: number;
    cortisol: number;
    digestion: number;
    sleep: number;
  };
  overreachRisk: number;
};

export type CompositeScores = {
  fullnessScore: number;
  drynessScore: number;
  leannessScore: number;
  recoveryScore: number;
  trainingScore: number;
};

export function buildCompositeScores(input: CompositeScoresInput): CompositeScores {
  const {
    pump,
    fullness,
    intraCarbs,
    sodiumEstimate,
    hormoneModel,
    macroModel,
    dryness,
    sleepQuality,
    weeksOut,
    weightTrend,
    waistTrend,
    digestion,
    avgIntensity,
    compoundModel,
    overreachRisk,
  } = input;

  const fullnessRaw =
    1.8 +
    diminishing(pump, 0.35) * 2.0 +
    diminishing(fullness, 0.32) * 1.6 +
    diminishing(intraCarbs, 0.018) * 2.0 +
    diminishing(Math.max(sodiumEstimate.intraTotal - 800, 0), 0.0015) * 1.2 +
    hormoneModel.androgen_tone * 0.16 +
    macroModel.carbEfficiency * 0.2 +
    compoundModel.fullness * 0.1 -
    hormoneModel.aldosterone_water * 0.12 -
    macroModel.spillRisk * 0.2 -
    Math.max(0, compoundModel.water) * 0.06 -
    Math.max(0, -compoundModel.digestion) * 0.05;

  const drynessRaw =
    2.0 +
    dryness * 0.24 +
    (10 - hormoneModel.aldosterone_water) * 0.3 +
    (10 - hormoneModel.estrogen_load) * 0.16 +
    (10 - macroModel.spillRisk) * 0.24 +
    compoundModel.dryness * 0.12 +
    sleepQuality * 0.05 -
    diminishing(intraCarbs, 0.012) * 0.5 -
    Math.max(0, sodiumEstimate.intraTotal - 1500) * 0.0008;

  const leannessRaw =
    3.6 +
    Math.abs(Math.min(weightTrend, 0)) * 0.85 +
    Math.abs(Math.min(waistTrend, 0)) * 3.4 +
    hormoneModel.thyroid_drive * 0.16 +
    compoundModel.leanness * 0.14 +
    (weeksOut < 8 ? 0.4 : 0) -
    macroModel.spillRisk * 0.14 -
    Math.max(0, compoundModel.water) * 0.06;

  const trainingRaw =
    2.4 +
    diminishing(pump, 0.28) * 1.5 +
    diminishing(intraCarbs, 0.014) * 1.35 +
    hormoneModel.androgen_tone * 0.15 +
    macroModel.carbEfficiency * 0.16 +
    macroModel.proteinEfficiency * 0.08 +
    macroModel.fatEfficiency * 0.06 +
    compoundModel.performance * 0.12 -
    avgIntensity * 0.06 -
    Math.max(0, compoundModel.cortisol) * 0.08 -
    Math.max(0, -compoundModel.digestion) * 0.12 -
    macroModel.spillRisk * 0.08;

  const recoveryRaw =
    4.0 +
    sleepQuality * 0.3 +
    digestion * 0.22 +
    (10 - hormoneModel.cortisol) * 0.18 +
    macroModel.recoverySupport * 0.2 +
    Math.max(0, compoundModel.sleep) * 0.08 +
    Math.max(0, compoundModel.digestion) * 0.06 -
    avgIntensity * 0.1 -
    overreachRisk * 0.12 -
    Math.max(0, -compoundModel.sleep) * 0.16 -
    Math.max(0, -compoundModel.digestion) * 0.18;

  const fullnessScore = clamp(softCap(fullnessRaw, 8.9), 0, 10);
  const drynessScore = clamp(softCap(drynessRaw, 9.0), 0, 10);
  const leannessScore = clamp(softCap(leannessRaw, 9.0), 0, 10);
  const trainingScore = clamp(softCap(trainingRaw, 8.8), 0, 10);
  const recoveryScore = clamp(softCap(recoveryRaw, 8.8), 0, 10);

  return {
    fullnessScore: Math.round(fullnessScore * 10) / 10,
    drynessScore: Math.round(drynessScore * 10) / 10,
    leannessScore: Math.round(leannessScore * 10) / 10,
    recoveryScore: Math.round(recoveryScore * 10) / 10,
    trainingScore: Math.round(trainingScore * 10) / 10,
  };
}
