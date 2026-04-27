import type { AccentTone } from "./workspace_ui";
import type { DecisionSignalGate, DecisionSignalGateItem, PublishedCoachDecision } from "./types";

export type CoachTriageBucket =
  | "food"
  | "training"
  | "recovery"
  | "check-in"
  | "invites"
  | "updates"
  | "publish"
  | "support"
  | "data"
  | "plan";

export type CoachTriageFilter = "all" | "critical" | CoachTriageBucket;

export type CoachTriageAthlete = {
  id: string;
  name: string;
  division: string;
  status: string;
};

export type CoachTriageRow<TAthlete extends CoachTriageAthlete = CoachTriageAthlete> = {
  id: string;
  athlete?: TAthlete;
  athleteId?: string;
  athleteName: string;
  athleteMeta: string;
  bucket: CoachTriageBucket;
  priority: number;
  title: string;
  detail: string;
  actionLabel: string;
  tab: string;
  tone: AccentTone;
  active: boolean;
};

type FoodTriageInput = {
  entriesLogged: number;
  caloriesRemaining: number;
  proteinRemaining: number;
};

type CheckInTriageInput = {
  status: string;
  title: string;
  detail: string;
  tone: AccentTone;
};

type PendingCoachInvite = {
  id: string;
  athleteName: string;
  athleteEmail: string;
};

export type BuildCoachTriageRowsInput<TAthlete extends CoachTriageAthlete = CoachTriageAthlete> = {
  activeAthlete: TAthlete;
  athleteRoster: readonly TAthlete[];
  todayFood?: FoodTriageInput;
  decisionSignalGate?: DecisionSignalGate;
  selectedTrackerMissedLifts?: number;
  selectedTrackerExecutionScore?: number;
  recoveryScore?: number;
  sleepHours?: number;
  checkInReview?: CheckInTriageInput;
  latestPublishedDecision?: PublishedCoachDecision | null;
  dashboardQueuedChanges?: readonly string[];
  pendingInvites?: readonly PendingCoachInvite[];
  athleteReplyCount?: number;
  trackerWeeklyCompletion?: number;
  includeRoutineRows?: boolean;
};

const rowId = (prefix: string, value: string) =>
  `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item"}`;

export const coachTriageBucketLabel = (bucket: CoachTriageBucket) => {
  if (bucket === "food") return "Food gaps";
  if (bucket === "training") return "Missed lifts";
  if (bucket === "recovery") return "Low recovery";
  if (bucket === "check-in") return "Check-ins";
  if (bucket === "invites") return "Invites";
  if (bucket === "updates" || bucket === "publish") return "Updates";
  if (bucket === "support") return "Support";
  if (bucket === "data") return "Data";
  return "Plan";
};

export const coachTriagePriorityLabel = (priority: number) => {
  if (priority >= 92) return "Now";
  if (priority >= 82) return "High";
  if (priority >= 68) return "Next";
  return "Monitor";
};

const inferTriageBucketFromGateItem = (item?: DecisionSignalGateItem): CoachTriageBucket => {
  if (!item) return "data";
  if (item.tab === "nutrition") return "food";
  if (item.tab === "tracker") return item.id.includes("closeout") ? "data" : "training";
  if (item.tab === "coach") return "updates";
  if (item.tab === "schedule" || item.tab === "split") return "plan";
  return "data";
};

const statusDrivenRow = <TAthlete extends CoachTriageAthlete>(
  athlete: TAthlete,
  active: boolean
): CoachTriageRow<TAthlete> | null => {
  const normalizedStatus = athlete.status.toLowerCase();
  const athleteMeta = `${athlete.division}, ${athlete.status}`;

  if (normalizedStatus.includes("check-in")) {
    return {
      id: rowId(`athlete-${athlete.id}`, "check-in"),
      athlete,
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteMeta,
      bucket: "check-in",
      priority: active ? 88 : 84,
      title: "Check-in review due",
      detail: "Compare visuals, adherence, and the last direction before writing anything new.",
      actionLabel: active ? "Open review" : "Switch client",
      tab: "coach",
      tone: "amber",
      active,
    };
  }

  if (normalizedStatus.includes("peak")) {
    return {
      id: rowId(`athlete-${athlete.id}`, "peak"),
      athlete,
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteMeta,
      bucket: "recovery",
      priority: active ? 90 : 82,
      title: "Peak-week support check",
      detail: "Confirm food, water, training stress, and the visual read before any aggressive adjustment.",
      actionLabel: active ? "Review recovery" : "Switch client",
      tab: active ? "tracker" : "coach",
      tone: "rose",
      active,
    };
  }

  if (normalizedStatus.includes("waiting") || normalizedStatus.includes("update")) {
    return {
      id: rowId(`athlete-${athlete.id}`, "update"),
      athlete,
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteMeta,
      bucket: "updates",
      priority: active ? 80 : 76,
      title: "Update waiting",
      detail: "Send one concise receipt or plan-change note so the client is not left guessing.",
      actionLabel: active ? "Open coach desk" : "Switch client",
      tab: "coach",
      tone: "sky",
      active,
    };
  }

  return null;
};

export const buildCoachTriageRows = <TAthlete extends CoachTriageAthlete>(
  input: BuildCoachTriageRowsInput<TAthlete>
) => {
  const rows: Array<CoachTriageRow<TAthlete>> = [];
  const activeMeta = `${input.activeAthlete.division}, ${input.activeAthlete.status}`;
  const missedLifts = input.selectedTrackerMissedLifts ?? 0;
  const dashboardQueuedChanges = input.dashboardQueuedChanges ?? [];
  const foodMissing = input.todayFood ? input.todayFood.entriesLogged === 0 : false;

  const addActiveRow = (
    item: Omit<CoachTriageRow<TAthlete>, "id" | "athlete" | "athleteId" | "athleteName" | "athleteMeta" | "active">
  ) => {
    rows.push({
      ...item,
      id: rowId(`active-${item.bucket}`, item.title),
      athlete: input.activeAthlete,
      athleteId: input.activeAthlete.id,
      athleteName: input.activeAthlete.name,
      athleteMeta: activeMeta,
      active: true,
    });
  };

  if (input.todayFood) {
    const caloriesRemaining = Math.max(0, input.todayFood.caloriesRemaining);
    const proteinRemaining = Math.max(0, input.todayFood.proteinRemaining);

    if (input.todayFood.entriesLogged === 0) {
      addActiveRow({
        bucket: "food",
        priority: 98,
        title: "No food logged today",
        detail: "The coach cannot judge compliance, fullness, digestion, or macro changes until the first food entry exists.",
        actionLabel: "Open food",
        tab: "nutrition",
        tone: "rose",
      });
    } else if (caloriesRemaining > 250 || proteinRemaining > 25) {
      addActiveRow({
        bucket: "food",
        priority: 82,
        title: "Food target still open",
        detail: `${caloriesRemaining} kcal and ${proteinRemaining}g protein remain open before the day is decision-ready.`,
        actionLabel: "Review food",
        tab: "nutrition",
        tone: "amber",
      });
    }
  }

  const activeGateBlocker = input.decisionSignalGate?.missing[0];
  if (
    input.decisionSignalGate?.status === "blocked" &&
    !(foodMissing && activeGateBlocker?.tab === "nutrition")
  ) {
    addActiveRow({
      bucket: inferTriageBucketFromGateItem(activeGateBlocker),
      priority: 94,
      title: activeGateBlocker?.title ?? "Signal gate is blocked",
      detail: activeGateBlocker?.detail ?? input.decisionSignalGate.detail,
      actionLabel: activeGateBlocker?.actionLabel ?? input.decisionSignalGate.primaryActionLabel,
      tab: activeGateBlocker?.tab ?? input.decisionSignalGate.primaryTab,
      tone: "rose",
    });
  }

  if (missedLifts > 0) {
    addActiveRow({
      bucket: "training",
      priority: missedLifts >= 3 ? 94 : 84,
      title: `${missedLifts} lift${missedLifts === 1 ? "" : "s"} still open`,
      detail:
        input.selectedTrackerExecutionScore !== undefined
          ? `${input.selectedTrackerExecutionScore}% execution today. Finish the log before changing the plan.`
          : "Close the actual training log before changing volume, split structure, or recovery support.",
      actionLabel: "Open lifts",
      tab: "tracker",
      tone: missedLifts >= 3 ? "rose" : "amber",
    });
  }

  if (input.recoveryScore !== undefined && input.recoveryScore < 6.5) {
    addActiveRow({
      bucket: "recovery",
      priority: input.recoveryScore < 5.5 ? 90 : 78,
      title: input.recoveryScore < 6 ? "Recovery is tight" : "Recovery is shaping the call",
      detail:
        input.sleepHours !== undefined
          ? `Recovery ${input.recoveryScore.toFixed(1)}/10 with ${input.sleepHours.toFixed(1)}h sleep. Check load support before pushing.`
          : `${input.recoveryScore.toFixed(1)}/10 recovery. Check sleep, stress, steps, and load before pushing harder.`,
      actionLabel: "Review recovery",
      tab: "tracker",
      tone: input.recoveryScore < 5.5 ? "rose" : "amber",
    });
  }

  if (input.checkInReview && input.checkInReview.status !== "on-track") {
    addActiveRow({
      bucket: "check-in",
      priority: input.checkInReview.status === "due" ? 88 : 72,
      title: input.checkInReview.title,
      detail: input.checkInReview.detail,
      actionLabel: "Open review",
      tab: "coach",
      tone: input.checkInReview.tone,
    });
  }

  if (input.latestPublishedDecision && input.latestPublishedDecision.status !== "acknowledged") {
    addActiveRow({
      bucket: "updates",
      priority: 86,
      title: "Published update needs receipt",
      detail: `${input.latestPublishedDecision.title} is athlete-facing but still unacknowledged.`,
      actionLabel: "Review receipt",
      tab: "coach",
      tone: "sky",
    });
  } else if (dashboardQueuedChanges.length > 0) {
    addActiveRow({
      bucket: "updates",
      priority: 74,
      title: `${dashboardQueuedChanges.length} change${dashboardQueuedChanges.length === 1 ? "" : "s"} queued`,
      detail: "Package the next direction into one clear update before sending fragments across the week.",
      actionLabel: "Package update",
      tab: "coach",
      tone: "sky",
    });
  }

  if ((input.athleteReplyCount ?? 0) > 0) {
    addActiveRow({
      bucket: "support",
      priority: 76,
      title: "Athlete note waiting",
      detail: `${input.athleteReplyCount} athlete note${input.athleteReplyCount === 1 ? "" : "s"} in the thread. Reply before publishing more changes.`,
      actionLabel: "Open thread",
      tab: "coach",
      tone: "sky",
    });
  }

  input.pendingInvites?.forEach((membership) => {
    rows.push({
      id: `invite-${membership.id}`,
      athleteName: membership.athleteName,
      athleteMeta: membership.athleteEmail,
      bucket: "invites",
      priority: 80,
      title: "Invite is pending",
      detail: "Confirm the client relationship or cancel the invite so the roster reflects real coaching access.",
      actionLabel: "Manage invite",
      tab: "coach",
      tone: "sky",
      active: false,
    });
  });

  input.athleteRoster.forEach((athlete) => {
    const active = athlete.id === input.activeAthlete.id;
    const statusRow = active && rows.some((row) => row.active) ? null : statusDrivenRow(athlete, active);

    if (statusRow) {
      rows.push(statusRow);
      return;
    }

    if (input.includeRoutineRows && !active) {
      rows.push({
        id: rowId(`athlete-${athlete.id}`, "routine"),
        athlete,
        athleteId: athlete.id,
        athleteName: athlete.name,
        athleteMeta: `${athlete.division}, ${athlete.status}`,
        bucket: "plan",
        priority: 52,
        title: "Routine plan review",
        detail: "No urgent blocker is flagged. Review only after higher-priority clients are clear.",
        actionLabel: "Switch client",
        tab: "coach",
        tone: "emerald",
        active,
      });
    }
  });

  if (input.includeRoutineRows && !rows.some((row) => row.active)) {
    addActiveRow({
      bucket: "plan",
      priority: 58,
      title: "Plan is ready for normal review",
      detail: `${input.trackerWeeklyCompletion ?? 0}% week completion. Keep monitoring unless the next check-in changes the read.`,
      actionLabel: "Open plan",
      tab: "schedule",
      tone: "emerald",
    });
  }

  if (rows.length === 0) {
    addActiveRow({
      bucket: "plan",
      priority: 48,
      title: "No urgent blockers",
      detail: "The roster is quiet. Use the coach desk only if a clear publish package is needed.",
      actionLabel: "Open coach desk",
      tab: "coach",
      tone: "emerald",
    });
  }

  return rows.sort((left, right) => right.priority - left.priority);
};

export const filterCoachTriageRows = <TRow extends CoachTriageRow>(
  rows: readonly TRow[],
  filter: CoachTriageFilter
) => {
  if (filter === "all") return rows;
  if (filter === "critical") return rows.filter((row) => row.priority >= 82);
  return rows.filter((row) => row.bucket === filter);
};

export const buildCoachTriageFilterOptions = (
  rows: readonly CoachTriageRow[],
  buckets: readonly CoachTriageBucket[] = ["food", "training", "recovery", "check-in", "invites", "updates"]
) => {
  const countFor = (bucket: CoachTriageBucket) => rows.filter((row) => row.bucket === bucket).length;
  const criticalCount = rows.filter((row) => row.priority >= 82).length;

  return [
    { value: "all" as const, label: "All", count: rows.length },
    { value: "critical" as const, label: "Critical", count: criticalCount },
    ...buckets.map((bucket) => ({
      value: bucket,
      label: coachTriageBucketLabel(bucket).replace(" gaps", "").replace("Missed lifts", "Lifts").replace("Low recovery", "Recovery"),
      count: countFor(bucket),
    })),
  ];
};
