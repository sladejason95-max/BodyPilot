import { clamp } from "@/lib/utils/math";

export type OutcomePreview = {
  fullnessDelta: number;
  drynessDelta: number;
  trainingDelta: number;
  warnings: string[];
  confidence: "High" | "Medium" | "Low";
};

export type OutcomePreviewInput = {
  intraSodium: number;
  fullnessScore: number;
  drynessScore: number;
  trainingScore: number;
  digestion: number;
  spillRisk: number;
  sleepQuality: number;
  overreachRisk: number;
  peakWeekEnabled: boolean;
  peakGoal: "dry" | "full" | "balanced";
};

export function buildOutcomePreview(input: OutcomePreviewInput): OutcomePreview {
  const {
    intraSodium,
    fullnessScore,
    drynessScore,
    trainingScore,
    digestion,
    spillRisk,
    sleepQuality,
    overreachRisk,
    peakWeekEnabled,
    peakGoal,
  } = input;

  const fullnessDelta = clamp(
    (1200 - intraSodium > 0 ? 0.15 : 0) +
      (fullnessScore < 6.5 ? 0.12 : 0) +
      (digestion >= 6 ? 0.08 : -0.04),
    -0.4,
    0.6
  );

  const drynessDelta = clamp(
    (spillRisk > 6 ? -0.15 : 0.04) +
      (intraSodium > 1700 ? -0.06 : 0.02) +
      (sleepQuality <= 4 ? -0.06 : 0.03),
    -0.5,
    0.3
  );

  const trainingDelta = clamp(
    (digestion >= 6 ? 0.08 : -0.08) +
      (trainingScore < 7 ? 0.14 : 0.04) +
      (overreachRisk > 7 ? -0.12 : 0.06),
    -0.4,
    0.5
  );

  const warnings: string[] = [];
  if (peakWeekEnabled && peakGoal === "dry" && fullnessScore < 6.5) warnings.push("Flattening risk is elevated.");
  if (spillRisk > 6.5 || (peakWeekEnabled && peakGoal === "full" && drynessScore < 6)) warnings.push("Spill risk is elevated.");
  if (overreachRisk > 7.5) warnings.push("Recovery risk is elevated.");

  let confidence: "High" | "Medium" | "Low" = "High";
  if (digestion <= 4 || sleepQuality <= 4 || warnings.length >= 2) confidence = "Low";
  else if (warnings.length === 1 || overreachRisk > 6.5) confidence = "Medium";

  return {
    fullnessDelta: Math.round(fullnessDelta * 100) / 100,
    drynessDelta: Math.round(drynessDelta * 100) / 100,
    trainingDelta: Math.round(trainingDelta * 100) / 100,
    warnings,
    confidence,
  };
}
