import { clamp } from "@/lib/utils/math";
import type { WorkoutDay } from "@/lib/types";

export type TrainingStressModel = {
  avgIntensity: number;
  weeklyLoad: number;
  recoveryHeadroom: number;
  overreachRisk: number;
  flags: string[];
};

export type TrainingStressInput = {
  workoutSplit: WorkoutDay[];
  sleepQuality: number;
  digestion: number;
  trainingDay: boolean;
  weeksOut: number;
};

export function buildTrainingStressModel(input: TrainingStressInput): TrainingStressModel {
  const { workoutSplit, sleepQuality, digestion, trainingDay, weeksOut } = input;

  const avgIntensity =
    workoutSplit.length === 0
      ? 5
      : workoutSplit.reduce((a, w) => a + w.intensity, 0) / workoutSplit.length;

  const weeklyLoad = avgIntensity * Math.max(workoutSplit.length, 1);

  const recoveryHeadroom = clamp(
    sleepQuality * 0.45 +
      digestion * 0.2 +
      (trainingDay ? 0 : 0.5) -
      weeklyLoad / 10,
    0,
    10
  );

  const overreachRisk = clamp(
    weeklyLoad / 8 +
      (10 - sleepQuality) * 0.45 +
      (10 - digestion) * 0.2 +
      (weeksOut <= 6 ? 0.8 : 0),
    0,
    10
  );

  const flags: string[] = [];
  if (overreachRisk >= 7.5) flags.push("Overreach risk is high. Deload, reduce volume, or drop intensity.");
  if (avgIntensity >= 8 && sleepQuality <= 5) flags.push("Training intensity is high relative to current sleep quality.");
  if (weeklyLoad >= 40 && weeksOut <= 4) flags.push("Weekly training load is aggressive for how close you are to stage.");
  if (recoveryHeadroom <= 3.5) flags.push("Recovery headroom is low. More work may worsen the look.");
  if (flags.length === 0) flags.push("Training stress is currently manageable.");

  return {
    avgIntensity: Math.round(avgIntensity * 10) / 10,
    weeklyLoad: Math.round(weeklyLoad * 10) / 10,
    recoveryHeadroom: Math.round(recoveryHeadroom * 10) / 10,
    overreachRisk: Math.round(overreachRisk * 10) / 10,
    flags,
  };
}
