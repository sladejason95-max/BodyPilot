export type AdjustmentsInput = {
  trainingDay: boolean;
  intraSodium: number;
  pump: number;
  digestion: number;
  sleepQuality: number;
  weightTrend: number;
  waistTrend: number;
  weeksOut: number;
  fullnessScore: number;
  fullness: number;
  overreachRisk: number;
  peakWeekEnabled: boolean;
  daysOut: number;
  peakGoal: "dry" | "full" | "balanced";
  spillRisk: number;
  peakSuggestedCarbs: number;
  peakSuggestedWater: number;
  peakSuggestedSalt: number;
};

export function buildAdjustments(input: AdjustmentsInput): string[] {
  const {
    trainingDay,
    intraSodium,
    pump,
    digestion,
    sleepQuality,
    weightTrend,
    waistTrend,
    weeksOut,
    fullnessScore,
    fullness,
    overreachRisk,
    peakWeekEnabled,
    daysOut,
    peakGoal,
    spillRisk,
    peakSuggestedCarbs,
    peakSuggestedWater,
    peakSuggestedSalt,
  } = input;

  const recs: string[] = [];

  if (trainingDay && intraSodium < 1200) recs.push("Increase training-window sodium. Your intra estimate is below the preferred range.");
  if (trainingDay && intraSodium > 1800) recs.push("Training-window sodium is high. Watch smoothness and facial spill.");
  if (pump <= 6 && digestion >= 6) recs.push("Pump is under target while digestion is acceptable. Consider a small intra carb or sodium increase, not both.");
  if (digestion <= 4) recs.push("Digestion is the bottleneck. Reduce drink volume first, then look at meal size and food choice.");
  if (sleepQuality <= 4) recs.push("Recovery pressure is high. Protect sleep timing before increasing workload.");
  if (weightTrend > -0.4 && waistTrend >= -0.05 && weeksOut <= 10) recs.push("Fat loss may be too slow. Consider a modest carb reduction or small cardio increase.");
  if (weightTrend < -1.5 && fullness <= 6) recs.push("You may be stripping off too fast. Consider adding carbs back before pushing harder.");
  if (overreachRisk >= 7.5) recs.push("Training stress is high relative to recovery. Reduce intensity or volume before look quality slips.");

  if (peakWeekEnabled) {
    if (daysOut <= 3 && peakGoal === "dry" && fullnessScore < 6.5) {
      recs.push("Peak mode is flagging a flattening risk. Do not keep forcing dryness if fullness is slipping.");
    }
    if (daysOut <= 2 && peakGoal === "full" && spillRisk > 6) {
      recs.push("Peak mode is flagging a spill risk. Small carb bumps are safer than large pushes.");
    }
    recs.push(`Peak mode active: use ${peakSuggestedCarbs}g carbs, ${peakSuggestedWater}L water, and ${peakSuggestedSalt} tsp salt as the conservative base.`);
  }

  if (recs.length === 0) {
    recs.push("No major correction flagged. Stay consistent and do not change multiple variables at the same time.");
  }

  return recs;
}
