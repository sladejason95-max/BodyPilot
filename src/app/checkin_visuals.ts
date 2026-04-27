import type { CheckIn, CheckInPhotoSlot } from "./types";

export const checkInPhotoSlots: CheckInPhotoSlot[] = ["front", "side", "back"];

export const checkInSlotLabel = (slot: CheckInPhotoSlot) =>
  slot.charAt(0).toUpperCase() + slot.slice(1);

export type CheckInVisualTone = "emerald" | "sky" | "amber" | "rose" | "slate";
export type CheckInVisualStatus = "empty" | "needs-photos" | "partial" | "ready";

export type CheckInVisualMetric = {
  label: string;
  title: string;
  detail: string;
  tone: CheckInVisualTone;
};

export type CheckInVisualPhotoSlot = {
  slot: CheckInPhotoSlot;
  label: string;
  latestLabel: string;
  previousLabel: string;
  latestPhoto?: string;
  previousPhoto?: string;
  latestHasPhoto: boolean;
  previousHasPhoto: boolean;
};

export type CheckInVisualTimelineEntry = {
  id: string;
  label: string;
  date: string;
  condition: number;
  photoCount: number;
  conditionDeltaLabel: string;
};

export type CheckInVisualReview = {
  status: CheckInVisualStatus;
  statusLabel: string;
  tone: CheckInVisualTone;
  title: string;
  detail: string;
  decisionCueTitle: string;
  decisionCueDetail: string;
  latest: CheckIn | null;
  previous: CheckIn | null;
  previousPhotoCheckIn: CheckIn | null;
  latestPhotoCount: number;
  previousPhotoCount: number;
  photoCoverageLabel: string;
  photoSlots: CheckInVisualPhotoSlot[];
  metrics: CheckInVisualMetric[];
  timeline: CheckInVisualTimelineEntry[];
};

const countPhotos = (checkIn?: CheckIn | null) =>
  checkIn ? checkInPhotoSlots.filter((slot) => Boolean(checkIn.photos?.[slot])).length : 0;

const formatSigned = (value: number, digits = 1, suffix = "") => {
  if (!Number.isFinite(value)) return `0${suffix}`;
  const rounded = Number(value.toFixed(digits));
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded.toFixed(digits)}${suffix}`;
};

const buildDecisionCue = (
  latest: CheckIn | null,
  previous: CheckIn | null,
  latestPhotoCount: number
) => {
  if (!latest) {
    return {
      title: "No visual baseline exists",
      detail: "Capture the first check-in before letting visual condition drive a coaching change.",
    };
  }

  if (latestPhotoCount === 0) {
    return {
      title: "Measurements are not enough",
      detail: "The latest check-in has numbers, but no progress photos. Add at least one current photo before making an aggressive look-based call.",
    };
  }

  if (!previous) {
    return {
      title: "Baseline is captured",
      detail: "Use this as the starting visual reference, then compare the next check-in before changing the plan off appearance alone.",
    };
  }

  const conditionDelta = latest.condition - previous.condition;
  const waistDelta = latest.waist - previous.waist;
  const recoveryDelta = latest.recovery - previous.recovery;

  if (conditionDelta >= 0.3 && waistDelta <= -0.1) {
    return {
      title: "Visuals support the current direction",
      detail: "Condition is improving while waist is moving down. Do not overcorrect a plan that is already producing the right look.",
    };
  }

  if (conditionDelta <= -0.3 && recoveryDelta <= -0.3) {
    return {
      title: "Visual read is weaker and less supported",
      detail: "Condition and recovery both slipped. Fix execution or recovery signal before pushing more food cuts or training stress.",
    };
  }

  if (waistDelta <= -0.2 && conditionDelta < 0.2) {
    return {
      title: "Leaner, but not clearly better yet",
      detail: "Waist is moving, but the look is not clearly improving. Hold the decision until photos and recovery confirm the next move.",
    };
  }

  return {
    title: "Visuals need one more clean comparison",
    detail: "The latest check-in is usable, but not decisive. Keep the next action focused and avoid stacking extra changes.",
  };
};

export const buildCheckInVisualReview = (checkIns: CheckIn[]): CheckInVisualReview => {
  const sorted = [...checkIns].sort((left, right) => {
    const dateSort = right.date.localeCompare(left.date);
    return dateSort === 0 ? right.id.localeCompare(left.id) : dateSort;
  });
  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;
  const previousPhotoCheckIn = sorted.slice(1).find((checkIn) => countPhotos(checkIn) > 0) ?? previous ?? null;
  const latestPhotoCount = countPhotos(latest);
  const previousPhotoCount = countPhotos(previousPhotoCheckIn);

  const status: CheckInVisualStatus =
    !latest
      ? "empty"
      : latestPhotoCount === 0
        ? "needs-photos"
        : latestPhotoCount < checkInPhotoSlots.length || previousPhotoCount === 0
          ? "partial"
          : "ready";
  const tone: CheckInVisualTone =
    status === "ready" ? "emerald" : status === "partial" ? "sky" : status === "needs-photos" ? "amber" : "slate";
  const statusLabel =
    status === "ready" ? "Ready" : status === "partial" ? "Partial" : status === "needs-photos" ? "Needs photos" : "No baseline";
  const photoCoverageLabel = latest
    ? `${latestPhotoCount}/${checkInPhotoSlots.length} latest photos`
    : "0/3 latest photos";
  const cue = buildDecisionCue(latest, previous, latestPhotoCount);

  const baseReview = {
    status,
    statusLabel,
    tone,
    title: latest
      ? previousPhotoCheckIn && previousPhotoCheckIn.id !== latest.id
        ? `${latest.label} vs ${previousPhotoCheckIn.label}`
        : `${latest.label} visual baseline`
      : "Visual baseline needed",
    detail: latest
      ? status === "ready"
        ? `${latest.date} has a complete photo set and a prior visual reference. Compare photos with waist, condition, and recovery before changing direction.`
        : status === "partial"
          ? `${latest.date} has ${latestPhotoCount}/${checkInPhotoSlots.length} latest photos. Use it cautiously and complete the missing visual angles.`
          : `${latest.date} has measurements but no attached progress photos. Add photos before trusting the visual read.`
      : "No check-in is stored yet. Add a baseline with photos, bodyweight, waist, condition, recovery, and training read.",
    decisionCueTitle: cue.title,
    decisionCueDetail: cue.detail,
    latest,
    previous,
    previousPhotoCheckIn,
    latestPhotoCount,
    previousPhotoCount,
    photoCoverageLabel,
  };

  const photoSlots = checkInPhotoSlots.map((slot) => ({
    slot,
    label: checkInSlotLabel(slot),
    latestLabel: latest?.label ?? "Latest",
    previousLabel: previousPhotoCheckIn?.label ?? "Previous",
    latestPhoto: latest?.photos?.[slot],
    previousPhoto: previousPhotoCheckIn?.photos?.[slot],
    latestHasPhoto: Boolean(latest?.photos?.[slot]),
    previousHasPhoto: Boolean(previousPhotoCheckIn?.photos?.[slot]),
  }));

  const metrics: CheckInVisualMetric[] = latest
    ? previous
      ? [
          {
            label: "Bodyweight",
            title: formatSigned(latest.bodyWeight - previous.bodyWeight, 1, " lb"),
            detail: `${latest.bodyWeight.toFixed(1)} now vs ${previous.bodyWeight.toFixed(1)} prior.`,
            tone: latest.bodyWeight <= previous.bodyWeight ? "emerald" : "amber",
          },
          {
            label: "Waist",
            title: formatSigned(latest.waist - previous.waist, 1, " in"),
            detail: `${latest.waist.toFixed(1)} now vs ${previous.waist.toFixed(1)} prior.`,
            tone: latest.waist <= previous.waist ? "emerald" : "amber",
          },
          {
            label: "Condition",
            title: formatSigned(latest.condition - previous.condition),
            detail: `${latest.condition.toFixed(1)} now, fullness ${latest.fullness.toFixed(1)}, dryness ${latest.dryness.toFixed(1)}.`,
            tone: latest.condition >= previous.condition ? "emerald" : "rose",
          },
          {
            label: "Recovery",
            title: formatSigned(latest.recovery - previous.recovery),
            detail: `Training ${formatSigned(latest.training - previous.training)} since prior check-in.`,
            tone: latest.recovery >= previous.recovery ? "emerald" : "amber",
          },
        ]
      : [
          {
            label: "Bodyweight",
            title: `${latest.bodyWeight.toFixed(1)} lb`,
            detail: "First stored visual baseline.",
            tone: "slate",
          },
          {
            label: "Waist",
            title: `${latest.waist.toFixed(1)} in`,
            detail: "Compare this against the next check-in.",
            tone: "slate",
          },
          {
            label: "Condition",
            title: `${latest.condition.toFixed(1)}/10`,
            detail: `Fullness ${latest.fullness.toFixed(1)}, dryness ${latest.dryness.toFixed(1)}.`,
            tone: "sky",
          },
          {
            label: "Photos",
            title: photoCoverageLabel,
            detail: "Complete front, side, and back for a stronger review.",
            tone,
          },
        ]
    : [];

  const timeline = sorted.slice(0, 5).map((entry) => ({
    id: entry.id,
    label: entry.label,
    date: entry.date,
    condition: entry.condition,
    photoCount: countPhotos(entry),
    conditionDeltaLabel: latest && entry.id !== latest.id
      ? `${formatSigned(latest.condition - entry.condition)} condition`
      : "Latest",
  }));

  return {
    ...baseReview,
    photoSlots,
    metrics,
    timeline,
  };
};
