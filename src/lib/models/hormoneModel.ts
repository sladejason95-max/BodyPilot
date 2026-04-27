import { clamp } from "@/lib/utils/math";
import type { Compound } from "@/lib/types";

export type HormoneDeltas = {
  testosterone: number;
  estrogen: number;
  cortisolShift: number;
  thyroidShift: number;
  insulinSensitivity: number;
  waterRetentionBias: number;
};

export type CompoundModelInput = {
  androgen: number;
  estrogen: number;
  cortisol: number;
  insulinSensitivity: number;
  water: number;
  thyroid: number;
};

export type HormoneModel = {
  insulin: number;
  cortisol: number;
  gh_signal: number;
  androgen_tone: number;
  aldosterone_water: number;
  thyroid_drive: number;
  estrogen_load: number;
};

export type HormoneModelInput = {
  intraCarbs: number;
  trainingDay: boolean;
  hormoneDeltas: HormoneDeltas;
  sleepQuality: number;
  avgIntensity: number;
  enabledCompounds: Compound[];
  compoundModel: CompoundModelInput;
  saltTsp: number;
  waterLiters: number;
  dryness: number;
  steps: number;
  weightTrend: number;
};

export function buildHormoneModel(input: HormoneModelInput): HormoneModel {
  const {
    intraCarbs,
    trainingDay,
    hormoneDeltas,
    sleepQuality,
    avgIntensity,
    enabledCompounds,
    compoundModel,
    saltTsp,
    waterLiters,
    dryness,
    steps,
    weightTrend,
  } = input;

  const ghSignal = clamp(
    enabledCompounds.find((c) => c.name === "Growth Hormone")?.dose || 0,
    0,
    10
  );

  const insulin = clamp(
    2 +
      intraCarbs / 12 +
      (trainingDay ? 1.5 : 0) +
      hormoneDeltas.insulinSensitivity / 2 -
      compoundModel.insulinSensitivity / 3,
    0,
    10
  );

  const cortisol = clamp(
    8 -
      sleepQuality / 1.6 +
      (trainingDay ? 1 : 0) +
      hormoneDeltas.cortisolShift / 1.5 +
      avgIntensity / 8 +
      compoundModel.cortisol / 4,
    0,
    10
  );

  const androgenTone = clamp(
    4 + hormoneDeltas.testosterone / 1.5 + compoundModel.androgen / 3,
    0,
    10
  );

  const estrogenLoad = clamp(
    3 + hormoneDeltas.estrogen / 1.5 + compoundModel.estrogen / 3,
    0,
    10
  );

  const aldosteroneWater = clamp(
    saltTsp * 2.4 +
      waterLiters / 1.2 -
      dryness / 5 +
      hormoneDeltas.waterRetentionBias / 1.2 +
      estrogenLoad / 5 +
      compoundModel.water / 4,
    0,
    10
  );

  const thyroidDrive = clamp(
    6 +
      (steps - 8000) / 1500 +
      (weightTrend < -1.2 ? -1 : 0) +
      hormoneDeltas.thyroidShift / 1.5 +
      compoundModel.thyroid / 4,
    0,
    10
  );

  return {
    insulin,
    cortisol,
    gh_signal: ghSignal,
    androgen_tone: androgenTone,
    aldosterone_water: aldosteroneWater,
    thyroid_drive: thyroidDrive,
    estrogen_load: estrogenLoad,
  };
}
