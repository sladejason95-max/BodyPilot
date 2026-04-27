import { clamp } from "@/lib/utils/math";

export type MacroModelInput = {
  trainingDay: boolean;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  estimatedTdee: number;
  waterRetentionBias: number;
};

export type MacroModel = {
  proteinCap: number;
  carbSoftCap: number;
  fatFloor: number;
  proteinEfficiency: number;
  carbEfficiency: number;
  fatEfficiency: number;
  calories: number;
  calorieSurplus: number;
  spillRisk: number;
  recoverySupport: number;
};

export function buildMacroModel(input: MacroModelInput): MacroModel {
  const {
    trainingDay,
    proteinTarget,
    carbTarget,
    fatTarget,
    estimatedTdee,
    waterRetentionBias,
  } = input;

  const proteinCap = 250;
  const carbSoftCap = trainingDay ? 300 : 220;
  const fatFloor = 35;

  const proteinEfficiency = clamp(
    10 - Math.max(0, proteinTarget - 230) / 8,
    4,
    10
  );

  const carbBaseUtility = clamp(carbTarget / 30, 0, 10);
  const carbPenalty = Math.max(0, carbTarget - carbSoftCap) / 18;
  const carbEfficiency = clamp(carbBaseUtility - carbPenalty, 1, 10);

  const fatEfficiency = clamp(
    8 - Math.max(0, fatFloor - fatTarget) / 4 - Math.max(0, fatTarget - 65) / 10,
    1,
    10
  );

  const calories = proteinTarget * 4 + carbTarget * 4 + fatTarget * 9;
  const calorieSurplus = calories - estimatedTdee;

  const spillRisk = clamp(
    4 +
      Math.max(0, calorieSurplus) / 120 +
      Math.max(0, carbTarget - carbSoftCap) / 20 +
      waterRetentionBias / 1.5,
    0,
    10
  );

  const recoverySupport = clamp(
    proteinEfficiency * 0.4 + fatEfficiency * 0.2 + carbEfficiency * 0.4,
    0,
    10
  );

  return {
    proteinCap,
    carbSoftCap,
    fatFloor,
    proteinEfficiency,
    carbEfficiency,
    fatEfficiency,
    calories,
    calorieSurplus,
    spillRisk,
    recoverySupport,
  };
}
