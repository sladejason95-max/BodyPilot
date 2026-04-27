import type { TrackerDay } from "./types";

export type ScienceTone = "slate" | "sky" | "emerald" | "amber" | "rose";

type WeightPoint = {
  date: string;
  dayIndex: number;
  weightLb: number;
};

export type BodyWeightTrendModel = {
  currentWeightLb: number | null;
  weeklyChangeLb: number | null;
  weeklyChangePct: number | null;
  sampleCount: number;
  daySpan: number;
  status: "insufficient" | "gaining" | "holding" | "slow-cut" | "target-cut" | "fast-cut" | "aggressive-cut";
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type ProteinSupportModel = {
  currentWeightLb: number | null;
  proteinPerKgBodyweight: number | null;
  proteinPerKgLeanMass: number | null;
  status: "insufficient" | "low" | "supported" | "high";
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type DietPressureModel = {
  status: "surplus" | "maintenance" | "planned-deficit" | "moderate-deficit" | "aggressive-deficit";
  mismatchWithPlan: boolean;
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type RecoveryPressureModel = {
  status: "supported" | "watch" | "strained" | "high";
  title: string;
  detail: string;
  tone: ScienceTone;
  driver: string;
};

export type FuelTimingModel = {
  status: "off-day" | "underfueled" | "light-post" | "digestion-heavy" | "aligned";
  title: string;
  detail: string;
  tone: ScienceTone;
  periCarbTotal: number;
};

export type HydrationSupportModel = {
  status: "low" | "dilute" | "aligned" | "heavy";
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type DecisionConfidenceModel = {
  status: "low" | "moderate" | "high";
  title: string;
  detail: string;
  tone: ScienceTone;
  score: number;
};

const DAY_MS = 86400000;
const POUNDS_PER_KILOGRAM = 2.20462;

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

const formatSigned = (value: number, digits = 2) => {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
};

const parseWeightPoints = (trackerDays: TrackerDay[]) =>
  trackerDays
    .map((day) => ({
      date: day.date,
      dayIndex: Date.parse(`${day.date}T00:00:00`),
      weightLb: Number(day.bodyWeight),
    }))
    .filter((point) => Number.isFinite(point.dayIndex) && Number.isFinite(point.weightLb) && point.weightLb > 0)
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .slice(-14);

const getSlopePerDay = (points: WeightPoint[]) => {
  if (points.length < 3) return null;

  const baseDay = points[0]?.dayIndex ?? 0;
  const normalized = points.map((point) => ({
    x: (point.dayIndex - baseDay) / DAY_MS,
    y: point.weightLb,
  }));
  const xMean = normalized.reduce((sum, point) => sum + point.x, 0) / normalized.length;
  const yMean = normalized.reduce((sum, point) => sum + point.y, 0) / normalized.length;

  const denominator = normalized.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
  if (denominator === 0) return null;

  const numerator = normalized.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0);
  return numerator / denominator;
};

export const buildBodyWeightTrendModel = (
  trackerDays: TrackerDay[],
  fallbackWeightLb?: number | null
): BodyWeightTrendModel => {
  const points = parseWeightPoints(trackerDays);
  const currentWeightLb = points[points.length - 1]?.weightLb ?? fallbackWeightLb ?? null;
  const daySpan =
    points.length >= 2
      ? Math.round(((points[points.length - 1]?.dayIndex ?? 0) - (points[0]?.dayIndex ?? 0)) / DAY_MS)
      : 0;
  const slopePerDay = getSlopePerDay(points);

  if (!currentWeightLb || slopePerDay === null || daySpan < 4) {
    return {
      currentWeightLb,
      weeklyChangeLb: null,
      weeklyChangePct: null,
      sampleCount: points.length,
      daySpan,
      status: "insufficient",
      title: currentWeightLb ? `${currentWeightLb.toFixed(1)} lb` : "Trend building",
      detail:
        points.length >= 1
          ? "Use the current targets for now: protein first, calories close, steps steady, and at least 3 bodyweights across about 5 days before changing pace."
          : "Start with the default fundamentals: hit protein, keep calories close, complete training, and add bodyweight entries as you go so the app can read the trend.",
      tone: "slate",
    };
  }

  const weeklyChangeLb = slopePerDay * 7;
  const weeklyChangePct = (weeklyChangeLb / currentWeightLb) * 100;

  if (weeklyChangePct > 0.25) {
    return {
      currentWeightLb,
      weeklyChangeLb: round(weeklyChangeLb, 2),
      weeklyChangePct: round(weeklyChangePct, 2),
      sampleCount: points.length,
      daySpan,
      status: "gaining",
      title: `${formatSigned(weeklyChangePct)}% / wk`,
      detail: `${currentWeightLb.toFixed(1)} lb current trend. Bodyweight is drifting up, so the current intake is probably above prep pace.`,
      tone: "amber",
    };
  }

  if (weeklyChangePct >= -0.25) {
    return {
      currentWeightLb,
      weeklyChangeLb: round(weeklyChangeLb, 2),
      weeklyChangePct: round(weeklyChangePct, 2),
      sampleCount: points.length,
      daySpan,
      status: "holding",
      title: `${formatSigned(weeklyChangePct)}% / wk`,
      detail: `${currentWeightLb.toFixed(1)} lb current trend. Bodyweight is basically holding right now.`,
      tone: "sky",
    };
  }

  if (weeklyChangePct > -0.5) {
    return {
      currentWeightLb,
      weeklyChangeLb: round(weeklyChangeLb, 2),
      weeklyChangePct: round(weeklyChangePct, 2),
      sampleCount: points.length,
      daySpan,
      status: "slow-cut",
      title: `${formatSigned(weeklyChangePct)}% / wk`,
      detail: `${currentWeightLb.toFixed(1)} lb current trend. The scale is moving down, but slower than a typical contest-prep pace.`,
      tone: "sky",
    };
  }

  if (weeklyChangePct >= -1.0) {
    return {
      currentWeightLb,
      weeklyChangeLb: round(weeklyChangeLb, 2),
      weeklyChangePct: round(weeklyChangePct, 2),
      sampleCount: points.length,
      daySpan,
      status: "target-cut",
      title: `${formatSigned(weeklyChangePct)}% / wk`,
      detail: `${currentWeightLb.toFixed(1)} lb current trend. The loss pace sits inside a common bodybuilding-prep range.`,
      tone: "emerald",
    };
  }

  if (weeklyChangePct >= -1.25) {
    return {
      currentWeightLb,
      weeklyChangeLb: round(weeklyChangeLb, 2),
      weeklyChangePct: round(weeklyChangePct, 2),
      sampleCount: points.length,
      daySpan,
      status: "fast-cut",
      title: `${formatSigned(weeklyChangePct)}% / wk`,
      detail: `${currentWeightLb.toFixed(1)} lb current trend. The loss pace is faster than the usual lean-mass-friendly prep range.`,
      tone: "amber",
    };
  }

  return {
    currentWeightLb,
    weeklyChangeLb: round(weeklyChangeLb, 2),
    weeklyChangePct: round(weeklyChangePct, 2),
    sampleCount: points.length,
    daySpan,
    status: "aggressive-cut",
    title: `${formatSigned(weeklyChangePct)}% / wk`,
    detail: `${currentWeightLb.toFixed(1)} lb current trend. The current pace is very aggressive for a physique prep.`,
    tone: "rose",
  };
};

export const buildProteinSupportModel = (
  proteinTarget: number,
  currentWeightLb: number | null,
  bodyFatPct: number,
  dietingPhase: boolean
): ProteinSupportModel => {
  if (!currentWeightLb || currentWeightLb <= 0) {
    return {
      currentWeightLb,
      proteinPerKgBodyweight: null,
      proteinPerKgLeanMass: null,
      status: "insufficient",
      title: `${proteinTarget} g protein`,
      detail: "Use this protein target as the floor while bodyweight data builds. Keep meals simple and distribute protein across the day.",
      tone: "slate",
    };
  }

  const bodyweightKg = currentWeightLb / POUNDS_PER_KILOGRAM;
  const proteinPerKgBodyweight = proteinTarget / bodyweightKg;
  const leanMassKg =
    bodyFatPct > 0 && bodyFatPct < 60
      ? bodyweightKg * (1 - bodyFatPct / 100)
      : null;
  const proteinPerKgLeanMass = leanMassKg ? proteinTarget / leanMassKg : null;

  if (dietingPhase && proteinPerKgLeanMass !== null) {
    if (proteinPerKgLeanMass < 2.3) {
      return {
        currentWeightLb,
        proteinPerKgBodyweight: round(proteinPerKgBodyweight, 2),
        proteinPerKgLeanMass: round(proteinPerKgLeanMass, 2),
        status: "low",
        title: `${proteinPerKgLeanMass.toFixed(1)} g/kg LBM`,
        detail: `${proteinTarget} g at about ${bodyFatPct.toFixed(1)}% body fat. That is light for a dieting phase focused on lean-mass retention.`,
        tone: "amber",
      };
    }

    if (proteinPerKgLeanMass <= 3.1) {
      return {
        currentWeightLb,
        proteinPerKgBodyweight: round(proteinPerKgBodyweight, 2),
        proteinPerKgLeanMass: round(proteinPerKgLeanMass, 2),
        status: "supported",
        title: `${proteinPerKgLeanMass.toFixed(1)} g/kg LBM`,
        detail: `${proteinTarget} g at about ${bodyFatPct.toFixed(1)}% body fat. That sits inside a common contest-prep support range.`,
        tone: "emerald",
      };
    }

    return {
      currentWeightLb,
      proteinPerKgBodyweight: round(proteinPerKgBodyweight, 2),
      proteinPerKgLeanMass: round(proteinPerKgLeanMass, 2),
      status: "high",
      title: `${proteinPerKgLeanMass.toFixed(1)} g/kg LBM`,
      detail: `${proteinTarget} g at about ${bodyFatPct.toFixed(1)}% body fat. Protein is already generous for the current dieting context.`,
      tone: "sky",
    };
  }

  if (proteinPerKgBodyweight < 1.6) {
    return {
      currentWeightLb,
      proteinPerKgBodyweight: round(proteinPerKgBodyweight, 2),
      proteinPerKgLeanMass: proteinPerKgLeanMass ? round(proteinPerKgLeanMass, 2) : null,
      status: "low",
      title: `${proteinPerKgBodyweight.toFixed(1)} g/kg BW`,
      detail: `${proteinTarget} g protein is light relative to current bodyweight.`,
      tone: "amber",
    };
  }

  if (proteinPerKgBodyweight <= 2.2) {
    return {
      currentWeightLb,
      proteinPerKgBodyweight: round(proteinPerKgBodyweight, 2),
      proteinPerKgLeanMass: proteinPerKgLeanMass ? round(proteinPerKgLeanMass, 2) : null,
      status: "supported",
      title: `${proteinPerKgBodyweight.toFixed(1)} g/kg BW`,
      detail: `${proteinTarget} g protein sits in a common evidence-based range for resistance-trained athletes.`,
      tone: "emerald",
    };
  }

  return {
    currentWeightLb,
    proteinPerKgBodyweight: round(proteinPerKgBodyweight, 2),
    proteinPerKgLeanMass: proteinPerKgLeanMass ? round(proteinPerKgLeanMass, 2) : null,
    status: "high",
    title: `${proteinPerKgBodyweight.toFixed(1)} g/kg BW`,
    detail: `${proteinTarget} g protein is already robust for the current bodyweight.`,
    tone: "sky",
  };
};

export const buildDietPressureModel = ({
  calorieDelta,
  weeklyChangePct,
  recoveryHeadroom,
  weeklyDensityScore,
}: {
  calorieDelta: number;
  weeklyChangePct: number | null;
  recoveryHeadroom: number;
  weeklyDensityScore: number;
}): DietPressureModel => {
  const mismatchWithPlan =
    weeklyChangePct !== null &&
    Math.abs(weeklyChangePct) <= 0.25 &&
    calorieDelta <= -300;

  if (
    (weeklyChangePct !== null && weeklyChangePct <= -1.0) ||
    (calorieDelta <= -700 && recoveryHeadroom < 4.5) ||
    (calorieDelta <= -550 && recoveryHeadroom < 4 && weeklyDensityScore >= 7)
  ) {
    return {
      status: "aggressive-deficit",
      mismatchWithPlan: false,
      title: "Aggressive deficit",
      detail:
        weeklyChangePct !== null
          ? `Observed pace is ${formatSigned(weeklyChangePct)}% per week. That is a lot of diet pressure for the current recovery profile.`
          : `Planned intake is roughly ${Math.round(Math.abs(calorieDelta))} kcal below estimated demand while recovery headroom is already tight.`,
      tone: "rose",
    };
  }

  if (weeklyChangePct !== null && weeklyChangePct > 0.25) {
    return {
      status: "surplus",
      mismatchWithPlan: false,
      title: "Weight is drifting up",
      detail: `Observed pace is ${formatSigned(weeklyChangePct)}% per week, which reads above a prep-oriented target.`,
      tone: "amber",
    };
  }

  if (mismatchWithPlan) {
    return {
      status: "maintenance",
      mismatchWithPlan: true,
      title: "Flat trend",
      detail: "Macros imply a deficit, but the scale trend is still mostly flat. Confirm adherence before cutting harder.",
      tone: "sky",
    };
  }

  if ((weeklyChangePct !== null && weeklyChangePct < -0.25) || calorieDelta <= -300) {
    return {
      status: weeklyChangePct !== null && weeklyChangePct < -0.25 ? "moderate-deficit" : "planned-deficit",
      mismatchWithPlan: false,
      title: weeklyChangePct !== null && weeklyChangePct < -0.25 ? "Moderate deficit" : "Planned deficit",
      detail:
        weeklyChangePct !== null && weeklyChangePct < -0.25
          ? `Observed pace is ${formatSigned(weeklyChangePct)}% per week, which is workable if recovery stays intact.`
          : `Planned intake is about ${Math.round(Math.abs(calorieDelta))} kcal below estimated demand, but the observed trend still needs time to confirm it.`,
      tone: "emerald",
    };
  }

  if (Math.abs(calorieDelta) < 250) {
    return {
      status: "maintenance",
      mismatchWithPlan: false,
      title: "Near maintenance",
      detail: "The current macro target sits close to estimated demand, so most of the read will come from trend and adherence.",
      tone: "sky",
    };
  }

  return {
    status: "surplus",
    mismatchWithPlan: false,
    title: "Food is running high",
    detail: `Planned intake is about ${Math.round(calorieDelta)} kcal above estimated demand.`,
    tone: "amber",
  };
};

export const buildRecoveryPressureModel = ({
  sleepHours,
  sleepQuality,
  recoveryScore,
  recoveryHeadroom,
  weeklyDensityScore,
  weeklyChangePct,
}: {
  sleepHours: number;
  sleepQuality: number;
  recoveryScore: number;
  recoveryHeadroom: number;
  weeklyDensityScore: number;
  weeklyChangePct: number | null;
}): RecoveryPressureModel => {
  let strain = 0;
  const drivers: string[] = [];

  if (sleepHours < 6.5) {
    strain += 2;
    drivers.push("sleep duration");
  } else if (sleepHours < 7.25) {
    strain += 1;
    drivers.push("sleep duration");
  }

  if (sleepQuality < 4.5) {
    strain += 2;
    drivers.push("sleep quality");
  } else if (sleepQuality < 6) {
    strain += 1;
    drivers.push("sleep quality");
  }

  if (recoveryHeadroom < 4.5) {
    strain += 2;
    drivers.push("training load");
  } else if (recoveryHeadroom < 5.5) {
    strain += 1;
    drivers.push("training load");
  }

  if (weeklyDensityScore >= 7.2) {
    strain += 1;
    drivers.push("weekly density");
  }

  if ((weeklyChangePct ?? 0) <= -1.0) {
    strain += 1;
    drivers.push("diet pace");
  }

  const driver = drivers[0] ?? "overall load";

  if (strain >= 5 || recoveryScore < 5.4) {
    return {
      status: "high",
      title: "Recovery pressure is high",
      detail: `The current setup is leaning hard on ${driver}. This week needs more support before it needs more output.`,
      tone: "rose",
      driver,
    };
  }

  if (strain >= 3 || recoveryScore < 6.4) {
    return {
      status: "strained",
      title: "Recovery is getting tight",
      detail: `The plan is still workable, but ${driver} is starting to eat into recovery margin.`,
      tone: "amber",
      driver,
    };
  }

  if (strain >= 2 || recoveryScore < 7.1) {
    return {
      status: "watch",
      title: "Recovery needs watching",
      detail: `Nothing is broken, but ${driver} is the first place the week could stop feeling supported.`,
      tone: "sky",
      driver,
    };
  }

  return {
    status: "supported",
    title: "Recovery support is holding",
    detail: "Sleep, load, and current pace look broadly aligned enough to keep pushing cleanly.",
    tone: "emerald",
    driver,
  };
};

export const buildFuelTimingModel = ({
  trainingDay,
  preCarbs,
  intraCarbs,
  postCarbs,
  postFats,
  primaryLimiter,
  weeklyDensityScore,
}: {
  trainingDay: boolean;
  preCarbs: number;
  intraCarbs: number;
  postCarbs: number;
  postFats: number;
  primaryLimiter: string;
  weeklyDensityScore: number;
}): FuelTimingModel => {
  const periCarbTotal = preCarbs + intraCarbs + postCarbs;

  if (!trainingDay) {
    return {
      status: "off-day",
      title: "Off day food flow",
      detail: "Peri-workout support is not the main job today. Keep protein and digestion steady instead.",
      tone: "slate",
      periCarbTotal,
    };
  }

  if (primaryLimiter === "Digestion" && postFats >= 15) {
    return {
      status: "digestion-heavy",
      title: "Post-workout food is too heavy",
      detail: "The training window is being followed by more fat load than this digestion read probably wants.",
      tone: "amber",
      periCarbTotal,
    };
  }

  if ((preCarbs < 25 && intraCarbs < 20) || (periCarbTotal < 70 && weeklyDensityScore >= 6.8)) {
    return {
      status: "underfueled",
      title: "Peri-workout support is light",
      detail: "The session window looks under-supported relative to a physique-prep training day.",
      tone: "amber",
      periCarbTotal,
    };
  }

  if (postCarbs < 35) {
    return {
      status: "light-post",
      title: "Post-workout refill is light",
      detail: "The session is getting fuel in, but the post-workout carb block still looks a little thin.",
      tone: "sky",
      periCarbTotal,
    };
  }

  return {
    status: "aligned",
    title: "Peri-workout support is aligned",
    detail: "The pre, intra, and post window looks coherent enough for the current training day.",
    tone: "emerald",
    periCarbTotal,
  };
};

export const buildHydrationSupportModel = ({
  trainingDay,
  waterLiters,
  saltTsp,
  steps,
  intraCarbs,
}: {
  trainingDay: boolean;
  waterLiters: number;
  saltTsp: number;
  steps: number;
  intraCarbs: number;
}): HydrationSupportModel => {
  const highDemandDay = trainingDay || steps >= 10000 || intraCarbs >= 40;

  if ((highDemandDay && waterLiters < 3.5) || (!highDemandDay && waterLiters < 2.5)) {
    const minimumWater = highDemandDay ? 3.5 : 2.5;
    return {
      status: "low",
      title: `${waterLiters.toFixed(1)} L / ${saltTsp.toFixed(2)} tsp`,
      detail: `Drink at least ${minimumWater.toFixed(1)} L today and keep sodium consistent.`,
      tone: "amber",
    };
  }

  if (waterLiters >= 4.5 && saltTsp < 1.25 && highDemandDay) {
    return {
      status: "dilute",
      title: `${waterLiters.toFixed(1)} L / ${saltTsp.toFixed(2)} tsp`,
      detail: "Fluid is high relative to the current electrolyte plan, so the day may read more dilute than supported.",
      tone: "amber",
    };
  }

  if (waterLiters > 5.5 && saltTsp > 2.5) {
    return {
      status: "heavy",
      title: `${waterLiters.toFixed(1)} L / ${saltTsp.toFixed(2)} tsp`,
      detail: "Both fluid and sodium are being pushed fairly hard. Make sure that matches the actual day instead of drift.",
      tone: "sky",
    };
  }

  return {
    status: "aligned",
    title: `${waterLiters.toFixed(1)} L / ${saltTsp.toFixed(2)} tsp`,
    detail: "Fluid and electrolyte support looks broadly reasonable for the current day.",
    tone: "emerald",
  };
};

export const buildDecisionConfidenceModel = ({
  bodyWeightSamples,
  bodyWeightDaySpan,
  trackerLoggedDays,
  trackerAverageCompletion,
  missingFieldsCount,
  complianceScore,
}: {
  bodyWeightSamples: number;
  bodyWeightDaySpan: number;
  trackerLoggedDays: number;
  trackerAverageCompletion: number;
  missingFieldsCount: number;
  complianceScore: number;
}): DecisionConfidenceModel => {
  let score = 30;

  if (bodyWeightSamples >= 5 && bodyWeightDaySpan >= 7) score += 20;
  else if (bodyWeightSamples >= 3 && bodyWeightDaySpan >= 5) score += 12;
  else if (bodyWeightSamples >= 2) score += 6;

  if (trackerLoggedDays >= 5) score += 14;
  else if (trackerLoggedDays >= 3) score += 8;

  score += Math.min(18, trackerAverageCompletion * 0.18);
  score += Math.min(18, complianceScore * 0.18);
  score -= Math.min(24, missingFieldsCount * 8);
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 75) {
    return {
      status: "high",
      title: "High confidence",
      detail: "There is enough adherence and trend signal here to make a cleaner coaching call.",
      tone: "emerald",
      score,
    };
  }

  if (score >= 55) {
    return {
      status: "moderate",
      title: "Moderate confidence",
      detail: "The read is usable, but one or two missing signals could still change the call.",
      tone: "sky",
      score,
    };
  }

  return {
    status: "low",
    title: "Low confidence",
    detail: "The signal is still noisy. Data quality or adherence needs to improve before aggressive adjustments.",
    tone: "amber",
    score,
  };
};
