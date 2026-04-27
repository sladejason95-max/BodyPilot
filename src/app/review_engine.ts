import type { CheckIn } from "./types";
import type { CheckInCadence } from "./ecosystem_planning";

export type ReviewTone = "sky" | "emerald" | "amber" | "rose" | "slate";
export type ReviewStatus = "due" | "soon" | "on-track";

export type CheckInReviewMetric = {
  label: string;
  title: string;
  detail: string;
  tone: ReviewTone;
};

export type CheckInReviewSnapshot = {
  status: ReviewStatus;
  tone: ReviewTone;
  title: string;
  detail: string;
  cadenceLabel: string;
  lastCheckInDate: string | null;
  nextDueDate: string;
  nextDueLabel: string;
  comparisonTitle: string;
  comparisonDetail: string;
  metrics: CheckInReviewMetric[];
};

type CheckInReviewInput = {
  checkIns: CheckIn[];
  checkInCadence: CheckInCadence;
  todayIso: string;
  bodyWeight: number;
  conditionScore: number;
  recoveryScore: number;
  trainingScore: number;
  lookStateLabel: string;
  primaryLimiter: string;
};

const cadenceDayMap: Record<CheckInCadence, number> = {
  weekly: 7,
  "2x-week": 3,
  "3x-week": 2,
  daily: 1,
};

const cadenceLabelMap: Record<CheckInCadence, string> = {
  weekly: "weekly",
  "2x-week": "2x / week",
  "3x-week": "3x / week",
  daily: "daily",
};

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const daysBetween = (fromIso: string, toIso: string) => {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / 86400000);
};

const formatDateLabel = (value: string) =>
  parseIsoDate(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const formatSigned = (value: number, digits = 1, suffix = "") => {
  if (!Number.isFinite(value)) return `0${suffix}`;
  const rounded = Number(value.toFixed(digits));
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded.toFixed(digits)}${suffix}`;
};

const buildComparisonRead = (
  weightDelta: number,
  conditionDelta: number,
  recoveryDelta: number
) => {
  if (conditionDelta >= 0.3 && weightDelta <= -0.4) {
    return {
      title: "Condition is improving with scale support",
      detail: "The look is tightening while bodyweight is still drifting down, so the current direction is probably doing useful work.",
      tone: "emerald" as const,
    };
  }

  if (conditionDelta >= 0.2 && Math.abs(weightDelta) < 0.4) {
    return {
      title: "The look is improving faster than the scale",
      detail: "Visual progress is outpacing bodyweight movement, so avoid cutting harder just because the scale is calmer.",
      tone: "sky" as const,
    };
  }

  if (weightDelta <= -0.6 && recoveryDelta <= -0.4) {
    return {
      title: "The review is getting leaner but less supported",
      detail: "Bodyweight is moving, but recovery is slipping. That usually means the phase is paying a higher cost than it should.",
      tone: "amber" as const,
    };
  }

  if (conditionDelta <= -0.3 && recoveryDelta <= -0.3) {
    return {
      title: "The read is softer than the last review",
      detail: "Look and recovery both slipped from the last checkpoint, so do not escalate the plan until the signal is cleaner.",
      tone: "rose" as const,
    };
  }

  return {
    title: "The review needs another clean checkpoint",
    detail: "Nothing decisive is broken, but the next check-in should confirm whether the current call is really holding.",
    tone: "slate" as const,
  };
};

export const buildCheckInReviewSnapshot = (input: CheckInReviewInput): CheckInReviewSnapshot => {
  const {
    checkIns,
    checkInCadence,
    todayIso,
    bodyWeight,
    conditionScore,
    recoveryScore,
    trainingScore,
    lookStateLabel,
    primaryLimiter,
  } = input;

  const cadenceDays = cadenceDayMap[checkInCadence];
  const cadenceLabel = cadenceLabelMap[checkInCadence];
  const sortedCheckIns = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  const lastCheckIn =
    sortedCheckIns.length > 0
      ? sortedCheckIns[sortedCheckIns.length - 1]
      : null;
  const nextDueDate = lastCheckIn ? toIsoDate(addDays(parseIsoDate(lastCheckIn.date), cadenceDays)) : todayIso;
  const daysSinceLast = lastCheckIn ? daysBetween(lastCheckIn.date, todayIso) : cadenceDays;
  const status: ReviewStatus =
    !lastCheckIn || daysSinceLast >= cadenceDays
      ? "due"
      : daysSinceLast >= Math.max(cadenceDays - 1, 1) && cadenceDays > 1
        ? "soon"
        : "on-track";

  const tone: ReviewTone =
    status === "due" ? "amber" : status === "soon" ? "sky" : "emerald";

  if (!lastCheckIn) {
    return {
      status,
      tone,
      title: "First review is ready",
      detail: `No check-in is logged yet. ${cadenceLabel} cadence works best when the baseline gets captured before more changes stack up.`,
      cadenceLabel,
      lastCheckInDate: null,
      nextDueDate,
      nextDueLabel: "Now",
      comparisonTitle: "No review baseline yet",
      comparisonDetail: "Log the first check-in so the app can compare the live read against an actual checkpoint instead of guesses.",
      metrics: [
        {
          label: "Cadence",
          title: `${cadenceLabel} rhythm`,
          detail: "Start with a clean baseline review today.",
          tone,
        },
        {
          label: "Bodyweight",
          title: `${bodyWeight.toFixed(1)} lb`,
          detail: "Current live scale read.",
          tone: "slate",
        },
        {
          label: "Condition",
          title: `${conditionScore.toFixed(1)} live`,
          detail: `Current look state: ${lookStateLabel}.`,
          tone: "sky",
        },
        {
          label: "Recovery",
          title: `${recoveryScore.toFixed(1)} live`,
          detail: `${primaryLimiter} is the current limiter.`,
          tone: "slate",
        },
      ],
    };
  }

  const weightDelta = bodyWeight - lastCheckIn.bodyWeight;
  const conditionDelta = conditionScore - lastCheckIn.condition;
  const recoveryDelta = recoveryScore - lastCheckIn.recovery;
  const trainingDelta = trainingScore - lastCheckIn.training;
  const nextDueLabel =
    status === "due"
      ? "Now"
      : formatDateLabel(nextDueDate);
  const comparisonRead = buildComparisonRead(weightDelta, conditionDelta, recoveryDelta);

  return {
    status,
    tone,
    title:
      status === "due"
        ? "Check-in is due now"
        : status === "soon"
          ? `Next check-in ${nextDueLabel}`
          : "Check-ins are on rhythm",
    detail:
      status === "due"
        ? `Last review was ${formatDateLabel(lastCheckIn.date)}. ${cadenceLabel} cadence makes the next check-in due now so the plan can be judged on fresh signal.`
        : status === "soon"
          ? `Last review was ${formatDateLabel(lastCheckIn.date)}. The next check-in lands ${nextDueLabel}, so keep photos, scale, and notes aligned.`
          : `Last review was ${formatDateLabel(lastCheckIn.date)}. The next check-in is ${nextDueLabel}, so the day can stay focused on execution instead of extra edits.`,
    cadenceLabel,
    lastCheckInDate: lastCheckIn.date,
    nextDueDate,
    nextDueLabel,
    comparisonTitle: comparisonRead.title,
    comparisonDetail: comparisonRead.detail,
    metrics: [
      {
        label: "Cadence",
        title: status === "due" ? "Due now" : `Next ${nextDueLabel}`,
        detail: `${cadenceLabel} cadence, last review ${formatDateLabel(lastCheckIn.date)}.`,
        tone,
      },
      {
        label: "Bodyweight",
        title: formatSigned(weightDelta, 1, " lb"),
        detail: `${bodyWeight.toFixed(1)} live vs ${lastCheckIn.bodyWeight.toFixed(1)} last review.`,
        tone: Math.abs(weightDelta) < 0.4 ? "sky" : weightDelta < 0 ? "emerald" : "amber",
      },
      {
        label: "Condition",
        title: formatSigned(conditionDelta),
        detail: `${conditionScore.toFixed(1)} live, ${lookStateLabel.toLowerCase()}.`,
        tone: conditionDelta >= 0.2 ? "emerald" : conditionDelta <= -0.2 ? "rose" : "sky",
      },
      {
        label: "Recovery",
        title: formatSigned(recoveryDelta),
        detail: `${recoveryScore.toFixed(1)} live, training ${formatSigned(trainingDelta)} since last review.`,
        tone: recoveryDelta >= 0.2 ? "emerald" : recoveryDelta <= -0.2 ? "amber" : "slate",
      },
    ],
  };
};
