import { clamp } from "@/lib/utils/math";

export type PeakWeekModel = {
  suggestedCarbs: number;
  suggestedWater: number;
  suggestedSalt: number;
  depletionBias: string;
  riskFlag: string;
};

export type PeakWeekInput = {
  daysOut: number;
  peakGoal: "dry" | "full" | "balanced";
  dailyCarbs: number;
  waterLiters: number;
  saltTsp: number;
  fullnessScore: number;
  spillRisk: number;
};

export function buildPeakWeekModel(input: PeakWeekInput): PeakWeekModel {
  const { daysOut, peakGoal, dailyCarbs, waterLiters, saltTsp, fullnessScore, spillRisk } = input;

  const safeDaysOut = clamp(daysOut, 1, 7);
  const carbMultiplier = peakGoal === "full" ? 1.2 : peakGoal === "dry" ? 0.9 : 1.05;
  const waterMultiplier = safeDaysOut >= 5 ? 1 : safeDaysOut >= 3 ? 0.95 : 0.9;
  const sodiumMultiplier = peakGoal === "dry" ? 0.95 : 1;

  const suggestedCarbs = Math.round(dailyCarbs * carbMultiplier);
  const suggestedWater = Math.round(waterLiters * waterMultiplier * 100) / 100;
  const suggestedSalt = Math.round(saltTsp * sodiumMultiplier * 100) / 100;

  const depletionBias =
    safeDaysOut >= 6
      ? "normal training"
      : safeDaysOut >= 4
        ? "slightly reduced volume"
        : safeDaysOut >= 2
          ? "pump work only"
          : "minimal training";

  const riskFlag =
    peakGoal === "dry" && fullnessScore < 6.5
      ? "High flattening risk"
      : peakGoal === "full" && spillRisk > 6
        ? "High spill risk"
        : "Controlled";

  return {
    suggestedCarbs,
    suggestedWater,
    suggestedSalt,
    depletionBias,
    riskFlag,
  };
}
