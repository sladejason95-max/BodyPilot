import type { ExerciseLibraryItem } from "../lib/data/exerciseLibrary";
import type { RecoveryPressureModel, ScienceTone } from "./science_model";
import type { TrackerDay, TrackerLift, WorkoutDay } from "./types";

type RegionKey =
  | "Chest"
  | "Back"
  | "Delts"
  | "Arms"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Trunk";

type RegionAccumulator = {
  plannedSets: number;
  trackedPlannedSets: number;
  deliveredSets: number;
  plannedStimulus: number;
  trackedPlannedStimulus: number;
  deliveredStimulus: number;
  fatigueCost: number;
};

export type AdaptationRegionSummary = {
  region: RegionKey;
  weeklyPlannedSets: number;
  trackedPlannedSets: number;
  deliveredSets: number;
  weeklyCoveragePct: number;
  deliveryPct: number;
  deliveredStimulus: number;
  fatigueCost: number;
  status: "insufficient" | "underdelivered" | "fatigue-limited" | "supported" | "watch";
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type AdaptationCard = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
};

export type AdaptationPrimaryAction = {
  title: string;
  detail: string;
  tone: ScienceTone;
  code: "log-more" | "fix-delivery" | "reduce-fatigue" | "progress-ready" | "hold";
};

export type AdaptationSnapshot = {
  weeklyCoveragePct: number;
  deliveryPct: number;
  regionSummaries: AdaptationRegionSummary[];
  topConstraint: AdaptationRegionSummary | null;
  topSupportedRegion: AdaptationRegionSummary | null;
  fatigueHotspot: AdaptationRegionSummary | null;
  primaryAction: AdaptationPrimaryAction;
  flags: string[];
  cards: AdaptationCard[];
};

type LiftObservation = {
  plannedSets: number;
  deliveredSets: number;
  avgRpe: number | null;
  exercise: ExerciseLibraryItem;
};

const regionOrder: RegionKey[] = [
  "Chest",
  "Back",
  "Delts",
  "Arms",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Trunk",
];

const emptyRegionAccumulator = (): Record<RegionKey, RegionAccumulator> =>
  Object.fromEntries(
    regionOrder.map((region) => [
      region,
      {
        plannedSets: 0,
        trackedPlannedSets: 0,
        deliveredSets: 0,
        plannedStimulus: 0,
        trackedPlannedStimulus: 0,
        deliveredStimulus: 0,
        fatigueCost: 0,
      },
    ])
  ) as Record<RegionKey, RegionAccumulator>;

const normalizeExerciseName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]/g, "");

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const clampPct = (value: number) => Math.max(0, Math.min(100, Number(value.toFixed(0))));

const mapMuscleToRegion = (muscle: string): RegionKey | null => {
  if (muscle === "Chest") return "Chest";
  if (["Lats", "Upper Back", "Erectors", "Forearms"].includes(muscle)) return "Back";
  if (muscle === "Delts") return "Delts";
  if (["Triceps", "Biceps"].includes(muscle)) return "Arms";
  if (muscle === "Quads") return "Quads";
  if (muscle === "Hamstrings") return "Hamstrings";
  if (["Glutes", "Adductors"].includes(muscle)) return "Glutes";
  if (muscle === "Calves") return "Calves";
  if (["Abs", "Hip Flexors"].includes(muscle)) return "Trunk";
  return null;
};

const getExerciseMatch = (liftName: string, exerciseLibrary: ExerciseLibraryItem[]) => {
  const normalized = normalizeExerciseName(liftName);
  const exact = exerciseLibrary.find((item) => normalizeExerciseName(item.name) === normalized);
  if (exact) return exact;

  return (
    exerciseLibrary.find((item) => {
      const itemName = normalizeExerciseName(item.name);
      return normalized.includes(itemName) || itemName.includes(normalized);
    }) ?? null
  );
};

const parseRows = (value?: string) =>
  (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const inferDeliveredSets = (lift: TrackerLift) => {
  const direct = Number(lift.actualSets);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const loggedReps = parseRows(lift.actualReps).length;
  const loggedWeight = parseRows(lift.weight).length;
  const loggedRpe = parseRows(lift.rpe).length;
  const inferred = Math.max(loggedReps, loggedWeight, loggedRpe, lift.completed ? lift.plannedSets : 0);
  return inferred;
};

const getEffortFactor = (avgRpe: number | null) => {
  if (avgRpe === null) return 1;
  if (avgRpe >= 9) return 1.03;
  if (avgRpe >= 8) return 1;
  if (avgRpe >= 7) return 0.96;
  return 0.9;
};

const getPlannedEffortFactor = (rirText: string) => {
  const rir = Number(rirText);
  if (!Number.isFinite(rir)) return 1;
  if (rir <= 1) return 1.04;
  if (rir <= 2) return 1;
  if (rir <= 3) return 0.96;
  return 0.92;
};

const addExerciseContribution = (
  bucket: RegionAccumulator,
  biasContribution: number,
  plannedSets: number,
  deliveredSets: number,
  exercise: ExerciseLibraryItem,
  plannedEffortFactor: number,
  actualEffortFactor: number
) => {
  const contribution = Math.max(0, biasContribution) / 100;
  const fatigueBase = Number(exercise.fatigue ?? 0) * 0.6 + Number(exercise.systemicFatigue ?? 0) * 0.4;
  bucket.plannedSets += plannedSets * contribution;
  bucket.trackedPlannedSets += plannedSets * contribution;
  bucket.deliveredSets += deliveredSets * contribution;
  bucket.plannedStimulus += plannedSets * Number(exercise.stimulus ?? 0) * plannedEffortFactor * contribution;
  bucket.trackedPlannedStimulus += plannedSets * Number(exercise.stimulus ?? 0) * plannedEffortFactor * contribution;
  bucket.deliveredStimulus += deliveredSets * Number(exercise.stimulus ?? 0) * actualEffortFactor * contribution;
  bucket.fatigueCost += deliveredSets * fatigueBase * contribution;
};

const buildPlannedWeeklyMap = (workoutSplit: WorkoutDay[], exerciseLibrary: ExerciseLibraryItem[]) => {
  const buckets = emptyRegionAccumulator();

  workoutSplit.forEach((day) => {
    day.exercises.forEach((exercise) => {
      const libraryItem = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
      if (!libraryItem) return;
      const plannedEffortFactor = getPlannedEffortFactor(String(exercise.rir));

      (libraryItem.muscleBias ?? []).forEach((bias) => {
        const region = mapMuscleToRegion(bias.muscle);
        if (!region) return;
        buckets[region].plannedSets += exercise.sets * (bias.contribution / 100);
        buckets[region].plannedStimulus += exercise.sets * Number(libraryItem.stimulus ?? 0) * plannedEffortFactor * (bias.contribution / 100);
      });
    });
  });

  return buckets;
};

const getRecentTrackedDays = (trackerDays: TrackerDay[]) =>
  [...trackerDays]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-7)
    .filter((day) => day.lifts.length > 0);

const buildTrackedWeeklyMap = (trackerDays: TrackerDay[], exerciseLibrary: ExerciseLibraryItem[]) => {
  const recentDays = getRecentTrackedDays(trackerDays);
  const buckets = emptyRegionAccumulator();
  const liftObservations: LiftObservation[] = [];

  recentDays.forEach((day) => {
    day.lifts.forEach((lift) => {
      const exercise = getExerciseMatch(lift.name, exerciseLibrary);
      if (!exercise) return;
      const plannedSets = Math.max(0, Number(lift.plannedSets) || 0);
      const deliveredSets = Math.max(0, inferDeliveredSets(lift));
      const rpeValues = parseRows(lift.rpe)
        .map((row) => Number(row))
        .filter((value) => Number.isFinite(value) && value > 0 && value <= 10);
      const avgRpe = average(rpeValues);
      const plannedEffortFactor = getPlannedEffortFactor(lift.rir);
      const actualEffortFactor = getEffortFactor(avgRpe);

      liftObservations.push({
        plannedSets,
        deliveredSets,
        avgRpe,
        exercise,
      });

      (exercise.muscleBias ?? []).forEach((bias) => {
        const region = mapMuscleToRegion(bias.muscle);
        if (!region) return;
        addExerciseContribution(
          buckets[region],
          bias.contribution,
          plannedSets,
          deliveredSets,
          exercise,
          plannedEffortFactor,
          actualEffortFactor
        );
      });
    });
  });

  return {
    buckets,
    liftObservations,
  };
};

const getRegionStatus = (
  weeklyCoveragePct: number,
  deliveryPct: number,
  fatigueCost: number,
  maxFatigueCost: number,
  recoveryPressureModel: RecoveryPressureModel
): Pick<AdaptationRegionSummary, "status" | "tone"> => {
  if (weeklyCoveragePct < 35) return { status: "insufficient", tone: "slate" };
  if (deliveryPct < 60) return { status: "underdelivered", tone: "rose" };
  if (deliveryPct < 80) return { status: "underdelivered", tone: "amber" };
  if (
    fatigueCost >= maxFatigueCost * 0.88 &&
    fatigueCost > 0 &&
    (recoveryPressureModel.status === "high" || recoveryPressureModel.status === "strained")
  ) {
    return {
      status: "fatigue-limited",
      tone: recoveryPressureModel.status === "high" ? "rose" : "amber",
    };
  }
  if (deliveryPct >= 90 && weeklyCoveragePct >= 50 && recoveryPressureModel.status !== "high") {
    return { status: "supported", tone: "emerald" };
  }
  return { status: "watch", tone: "sky" };
};

const buildRegionDetail = (
  status: AdaptationRegionSummary["status"],
  region: RegionKey,
  weeklyCoveragePct: number,
  deliveryPct: number,
  deliveredSets: number,
  trackedPlannedSets: number,
  recoveryPressureModel: RecoveryPressureModel
) => {
  if (status === "insufficient") {
    return `${weeklyCoveragePct}% of planned ${region.toLowerCase()} work has exercise-level logs. Do not change volume here from partial data.`;
  }
  if (status === "underdelivered") {
    return `${deliveredSets.toFixed(1)} of ${trackedPlannedSets.toFixed(1)} tracked planned sets were completed for ${region.toLowerCase()}. Finish the planned work before adding more.`;
  }
  if (status === "fatigue-limited") {
    return `${region} work is getting done, but the weighted fatigue cost is high for the current recovery state. Reduce cost before adding more sets.`;
  }
  if (status === "supported") {
    return `${region} is at ${deliveryPct}% delivery with enough logged coverage to keep the current workload steady.`;
  }
  return `${region} is at ${deliveryPct}% delivery with ${weeklyCoveragePct}% weekly coverage. Keep the workload steady and collect more sessions before making a bigger change.`;
};

export const buildAdaptationSnapshot = ({
  workoutSplit,
  trackerDays,
  exerciseLibrary,
  recoveryPressureModel,
}: {
  workoutSplit: WorkoutDay[];
  trackerDays: TrackerDay[];
  exerciseLibrary: ExerciseLibraryItem[];
  recoveryPressureModel: RecoveryPressureModel;
}): AdaptationSnapshot => {
  const plannedWeekly = buildPlannedWeeklyMap(workoutSplit, exerciseLibrary);
  const trackedWeekly = buildTrackedWeeklyMap(trackerDays, exerciseLibrary);

  const weeklyPlannedSets = regionOrder.reduce((sum, region) => sum + plannedWeekly[region].plannedSets, 0);
  const trackedPlannedSets = regionOrder.reduce((sum, region) => sum + trackedWeekly.buckets[region].trackedPlannedSets, 0);
  const deliveredSets = regionOrder.reduce((sum, region) => sum + trackedWeekly.buckets[region].deliveredSets, 0);
  const maxFatigueCost = Math.max(
    ...regionOrder.map((region) => trackedWeekly.buckets[region].fatigueCost),
    0
  );

  const regionSummaries = regionOrder
    .map((region) => {
      const planned = plannedWeekly[region];
      const tracked = trackedWeekly.buckets[region];
      if (planned.plannedSets <= 0 && tracked.trackedPlannedSets <= 0) return null;

      const weeklyCoveragePct =
        planned.plannedSets > 0 ? clampPct((tracked.trackedPlannedSets / planned.plannedSets) * 100) : 0;
      const deliveryPct =
        tracked.trackedPlannedSets > 0 ? clampPct((tracked.deliveredSets / tracked.trackedPlannedSets) * 100) : 0;
      const { status, tone } = getRegionStatus(
        weeklyCoveragePct,
        deliveryPct,
        tracked.fatigueCost,
        maxFatigueCost,
        recoveryPressureModel
      );

      return {
        region,
        weeklyPlannedSets: Number(planned.plannedSets.toFixed(1)),
        trackedPlannedSets: Number(tracked.trackedPlannedSets.toFixed(1)),
        deliveredSets: Number(tracked.deliveredSets.toFixed(1)),
        weeklyCoveragePct,
        deliveryPct,
        deliveredStimulus: Number(tracked.deliveredStimulus.toFixed(1)),
        fatigueCost: Number(tracked.fatigueCost.toFixed(1)),
        status,
        tone,
        title:
          status === "supported"
            ? `${region} delivery is stable`
            : status === "fatigue-limited"
              ? `${region} carries the highest recovery cost`
              : status === "underdelivered"
                ? `${region} work is not being fully completed`
                : status === "insufficient"
                  ? `${region} still needs more logged coverage`
                  : `${region} needs more evidence`,
        detail: buildRegionDetail(
          status,
          region,
          weeklyCoveragePct,
          deliveryPct,
          Number(tracked.deliveredSets.toFixed(1)),
          Number(tracked.trackedPlannedSets.toFixed(1)),
          recoveryPressureModel
        ),
      } satisfies AdaptationRegionSummary;
    })
    .filter(Boolean) as AdaptationRegionSummary[];

  const topConstraint =
    regionSummaries.find((item) => item.status === "underdelivered") ??
    regionSummaries.find((item) => item.status === "fatigue-limited") ??
    null;
  const topSupportedRegion = regionSummaries.find((item) => item.status === "supported") ?? null;
  const fatigueHotspot =
    [...regionSummaries]
      .filter((item) => item.fatigueCost > 0)
      .sort((left, right) => right.fatigueCost - left.fatigueCost)[0] ?? null;

  const overallCoveragePct = weeklyPlannedSets > 0 ? clampPct((trackedPlannedSets / weeklyPlannedSets) * 100) : 0;
  const overallDeliveryPct = trackedPlannedSets > 0 ? clampPct((deliveredSets / trackedPlannedSets) * 100) : 0;

  let primaryAction: AdaptationPrimaryAction = {
    title: "Hold progression and keep logging",
    detail: "The current delivery and recovery picture does not call for a bigger training change yet.",
    tone: "sky",
    code: "hold",
  };

  if (overallCoveragePct < 35) {
    primaryAction = {
      title: "Log more sessions before progressing the week",
      detail: `${overallCoveragePct}% of planned weekly sets have exercise-level logs right now. Build a bigger evidence base before changing load or volume aggressively.`,
      tone: "slate",
      code: "log-more",
    };
  } else if (topConstraint?.status === "underdelivered") {
    primaryAction = {
      title: `Fix ${topConstraint.region.toLowerCase()} delivery before adding more work`,
      detail: topConstraint.detail,
      tone: topConstraint.tone,
      code: "fix-delivery",
    };
  } else if (topConstraint?.status === "fatigue-limited") {
    primaryAction = {
      title: `Reduce ${topConstraint.region.toLowerCase()} fatigue cost before progressing`,
      detail: topConstraint.detail,
      tone: topConstraint.tone,
      code: "reduce-fatigue",
    };
  } else if (topSupportedRegion) {
    primaryAction = {
      title: "Current delivery supports holding the week steady",
      detail: `${topSupportedRegion.region} has the cleanest delivered work right now. Coverage and completion are good enough that the week does not need a large training change.`,
      tone: topSupportedRegion.tone,
      code: "progress-ready",
    };
  }

  const flags = Array.from(
    new Set(
      [
        overallCoveragePct < 35
          ? "Exercise-level log coverage is still too thin to justify aggressive progression decisions."
          : "",
        topConstraint?.status === "underdelivered" ? `${topConstraint.region} is not being fully delivered inside tracked sessions.` : "",
        topConstraint?.status === "fatigue-limited" ? `${topConstraint.region} is carrying high fatigue cost relative to the current recovery state.` : "",
        overallDeliveryPct < 80 && overallCoveragePct >= 35
          ? "Tracked-session set delivery is too low to treat the plan as fully executed."
          : "",
      ].filter(Boolean)
    )
  ).slice(0, 4);

  const cards: AdaptationCard[] = [
    {
      label: "Logged work",
      title: `${overallCoveragePct}% of planned sets have exercise logs`,
      detail:
        overallCoveragePct < 35
          ? "The week still needs more logged sessions before training changes are trustworthy."
          : "Enough of the week is logged to compare delivered work against the plan.",
      tone: overallCoveragePct < 35 ? "slate" : overallCoveragePct < 60 ? "sky" : "emerald",
    },
    {
      label: "Set delivery",
      title: `${overallDeliveryPct}% of tracked sets completed`,
      detail:
        trackedPlannedSets > 0
          ? `${deliveredSets.toFixed(1)} of ${trackedPlannedSets.toFixed(1)} tracked planned sets were completed.`
          : "No exercise-level tracker data is available yet.",
      tone: overallDeliveryPct < 70 ? "amber" : overallDeliveryPct < 90 ? "sky" : "emerald",
    },
    {
      label: "Main issue",
      title: topConstraint?.title ?? "No major delivery constraint yet",
      detail: topConstraint?.detail ?? "Nothing major is flashing red once tracked delivery is separated from the planned split.",
      tone: topConstraint?.tone ?? "emerald",
    },
    {
      label: "Highest cost",
      title: fatigueHotspot ? `${fatigueHotspot.region} carries the highest weighted fatigue cost` : "No weighted fatigue-cost read yet",
      detail:
        fatigueHotspot?.fatigueCost
          ? `${fatigueHotspot.fatigueCost.toFixed(1)} weighted fatigue-cost units across tracked work. This is calculated from logged sets plus exercise fatigue properties, and should be used as programming context rather than as a diagnosis.`
          : "Log more exercise-level work before using fatigue-cost calculations to change the week.",
      tone:
        fatigueHotspot && (recoveryPressureModel.status === "high" || recoveryPressureModel.status === "strained")
          ? "amber"
          : "sky",
    },
  ];

  return {
    weeklyCoveragePct: overallCoveragePct,
    deliveryPct: overallDeliveryPct,
    regionSummaries: regionSummaries.sort((left, right) => {
      const toneWeight: Record<ScienceTone, number> = { rose: 5, amber: 4, sky: 3, emerald: 2, slate: 1 };
      return toneWeight[right.tone] - toneWeight[left.tone];
    }),
    topConstraint,
    topSupportedRegion,
    fatigueHotspot,
    primaryAction,
    flags,
    cards,
  };
};
