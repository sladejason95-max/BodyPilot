import React from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import type {
  CoachThreadMessage,
  DecisionSignalGate,
  MonthDirection,
  PublishedCoachDecision,
  WeeklySnapshot,
} from "./types";
import { SectionCard, surfaceToneClass } from "./workspace_ui";
import {
  planDiffToneClass,
  publishDraftTone,
  type CoachDecisionDraft,
  type PlanChangeDiffItem,
} from "./coach_workflow_ui";

type ReviewAthlete = {
  id: string;
  name: string;
};

type CoachReviewTrailProps = {
  activeAthlete: ReviewAthlete;
  weeklySnapshots: readonly WeeklySnapshot[];
  decisionSignalGate: DecisionSignalGate;
  coachDecisionDraft: CoachDecisionDraft;
  latestPublishedDecision: PublishedCoachDecision | null;
  publishedPlanDiffs: readonly PlanChangeDiffItem[];
  publishedDecisionHistory: readonly PublishedCoachDecision[];
  coachThreadMessages: readonly CoachThreadMessage[];
  publishCoachDecision: () => void;
  saveWeeklySnapshot: () => void;
  restoreCoachDecisionDraft: (decisionId: string) => void;
  acknowledgeLatestCoachDecision: () => void;
  sendCoachThreadMessage: (author: CoachThreadMessage["author"], body: string) => void;
  markCoachThreadMessagesRead: (messageIds?: string[]) => void;
};

type ReviewTrailStatProps = {
  label: string;
  value: React.ReactNode;
  detail: string;
};

type ReviewDrawerProps = {
  eyebrow: string;
  title: string;
  badge: string;
  open?: boolean;
  children: React.ReactNode;
};

type ReviewMetric = {
  label: string;
  value: string;
  delta: string;
};

const monthDirectionTone = (direction?: MonthDirection | string) => {
  switch (direction) {
    case "next":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "prev":
      return "text-rose-600 bg-rose-50 border-rose-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

const inferSnapshotDirection = (snapshot: WeeklySnapshot): MonthDirection => {
  if (
    (snapshot.recommendation ?? "").toLowerCase().includes("increase") ||
    (snapshot.recommendation ?? "").toLowerCase().includes("hold")
  ) {
    return "next";
  }
  return "prev";
};

const formatDecisionDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const decisionVersionLabel = (
  decision: PublishedCoachDecision,
  history: readonly PublishedCoachDecision[]
) => {
  if (decision.version) return `v${decision.version}`;
  const index = history.findIndex((item) => item.id === decision.id);
  return index >= 0 ? `v${history.length - index}` : "Version";
};

const formatScoreDelta = (current: number, previous?: number) => {
  if (previous === undefined) return "Baseline";
  const delta = current - previous;
  if (delta === 0) return "No change";
  return `${delta > 0 ? "+" : ""}${delta}`;
};

const decisionReceiptText = (decision: PublishedCoachDecision) =>
  decision.status === "acknowledged" && decision.acknowledgedAt
    ? `Acknowledged ${formatDecisionDate(decision.acknowledgedAt)}`
    : "Awaiting athlete receipt";

const threadMessageStatusLabel = (message: CoachThreadMessage) => {
  if (message.author === "athlete") {
    return message.readAt ? `Reviewed ${formatDecisionDate(message.readAt)}` : "Unread";
  }

  if (message.readAt || message.deliveryStatus === "read") {
    return message.readAt ? `Read ${formatDecisionDate(message.readAt)}` : "Read";
  }

  if (message.deliveredAt || message.deliveryStatus === "delivered") {
    return "Delivered";
  }

  return "Sent";
};

const threadMessageStatusClass = (message: CoachThreadMessage) => {
  if (message.author === "athlete" && !message.readAt) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100";
  }

  if (message.readAt || message.deliveryStatus === "read") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100";
  }

  if (message.deliveredAt || message.deliveryStatus === "delivered") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/30 dark:text-sky-100";
  }

  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300";
};

const ReviewTrailStat = ({ label, value, detail }: ReviewTrailStatProps) => (
  <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
    <div className="mt-1.5 text-lg font-semibold text-slate-950 dark:text-slate-100">{value}</div>
    <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
  </div>
);

const ReviewDrawer = ({ eyebrow, title, badge, open, children }: ReviewDrawerProps) => (
  <details open={open} className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
    <summary className="cursor-pointer list-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{eyebrow}</div>
          <div className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        </div>
        <Badge variant="outline">{badge}</Badge>
      </div>
    </summary>
    <div className="mt-3 space-y-3">{children}</div>
  </details>
);

const ReviewEmptyPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
    {children}
  </div>
);

const ReviewMetricGrid = ({ metrics, muted = false }: { metrics: readonly ReviewMetric[]; muted?: boolean }) => (
  <div className="mt-3 grid gap-2 sm:grid-cols-3">
    {metrics.map((item) => (
      <div
        key={item.label}
        className={[
          "rounded-2xl border px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200",
          muted ? "border-slate-200 bg-slate-50 dark:bg-white/[0.04]" : "border-slate-200 bg-white dark:bg-slate-950/40",
        ].join(" ")}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{item.label}</div>
        <div className="mt-1.5 font-semibold text-slate-900 dark:text-slate-100">{item.value}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{item.delta} vs previous</div>
      </div>
    ))}
  </div>
);

const ReviewInfoTile = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
    <div className="mt-1.5">{children}</div>
  </div>
);

const getDecisionMetrics = (
  decision: PublishedCoachDecision,
  previousDecision?: PublishedCoachDecision
): ReviewMetric[] => [
  {
    label: "Confidence",
    value: `${decision.decisionConfidenceScore}/100`,
    delta: formatScoreDelta(decision.decisionConfidenceScore, previousDecision?.decisionConfidenceScore),
  },
  {
    label: "Completion",
    value: `${decision.completionScore}%`,
    delta: formatScoreDelta(decision.completionScore, previousDecision?.completionScore),
  },
  {
    label: "Compliance",
    value: `${decision.complianceScore}/100`,
    delta: formatScoreDelta(decision.complianceScore, previousDecision?.complianceScore),
  },
];

export function CoachReviewTrail({
  activeAthlete,
  weeklySnapshots,
  decisionSignalGate,
  coachDecisionDraft,
  latestPublishedDecision,
  publishedPlanDiffs,
  publishedDecisionHistory,
  coachThreadMessages,
  publishCoachDecision,
  saveWeeklySnapshot,
  restoreCoachDecisionDraft,
  acknowledgeLatestCoachDecision,
  sendCoachThreadMessage,
  markCoachThreadMessagesRead,
}: CoachReviewTrailProps) {
  const [threadDraft, setThreadDraft] = React.useState("");
  const activeAthleteThreadMessages = coachThreadMessages.filter((message) => message.athleteId === activeAthlete.id);
  const activeThreadMessages = activeAthleteThreadMessages.slice(0, 6);
  const unreadAthleteThreadMessages = activeAthleteThreadMessages.filter((message) => message.author === "athlete" && !message.readAt);
  const latestDecisionThreadMessages = latestPublishedDecision
    ? activeAthleteThreadMessages.filter((message) => message.relatedDecisionId === latestPublishedDecision.id)
    : [];
  const unreadLatestDecisionReplies = latestDecisionThreadMessages.filter((message) => message.author === "athlete" && !message.readAt);
  const deliveredCoachMessages = activeAthleteThreadMessages.filter(
    (message) =>
      message.author === "coach" &&
      (message.deliveryStatus === "delivered" || message.deliveredAt) &&
      !message.readAt
  );
  const previousPublishedDecision =
    latestPublishedDecision
      ? publishedDecisionHistory.find((decision) => decision.id !== latestPublishedDecision.id)
      : undefined;
  const publishedDecisionCards = publishedDecisionHistory
    .filter((decision) => decision.id !== latestPublishedDecision?.id)
    .slice(0, 4);
  const latestPublishedDecisionMetrics = latestPublishedDecision
    ? getDecisionMetrics(latestPublishedDecision, previousPublishedDecision)
    : [];

  return (
    <SectionCard title="Review trail" description="Current package first. Open history, versions, or replies only when they answer the coaching call.">
      <div className="space-y-3">
        {latestPublishedDecision ? (
          <div className={["rounded-[22px] border p-4", surfaceToneClass("primary")].join(" ")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Live package</div>
                <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{latestPublishedDecision.title}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{decisionVersionLabel(latestPublishedDecision, publishedDecisionHistory)}</Badge>
                <Badge className={latestPublishedDecision.status === "acknowledged" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"}>
                  {latestPublishedDecision.status === "acknowledged" ? "Acknowledged" : "Awaiting athlete"}
                </Badge>
              </div>
            </div>
            <ReviewInfoTile label="Next action">
              {latestPublishedDecision.nextAction}
            </ReviewInfoTile>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => restoreCoachDecisionDraft(latestPublishedDecision.id)}>
                Use as draft
              </Button>
              {latestPublishedDecision.status !== "acknowledged" ? (
                <Button size="sm" onClick={acknowledgeLatestCoachDecision}>
                  Mark received
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={`rounded-[22px] border p-4 ${publishDraftTone(decisionSignalGate.tone)}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">First package</div>
                <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{coachDecisionDraft.title}</div>
              </div>
              <Badge className={publishDraftTone(decisionSignalGate.tone)}>
                {decisionSignalGate.status === "blocked" ? "Blocked" : "Ready to publish"}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{coachDecisionDraft.instruction}</p>
            <div className="mt-3">
              <ReviewInfoTile label="Next receipt to create">
                {coachDecisionDraft.nextAction}
              </ReviewInfoTile>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={publishCoachDecision} disabled={decisionSignalGate.status === "blocked"}>
                {decisionSignalGate.status === "blocked" ? "Publish blocked" : "Publish first package"}
              </Button>
              <Button size="sm" variant="outline" onClick={saveWeeklySnapshot}>
                Save review
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <ReviewTrailStat
            label="Weeks"
            value={weeklySnapshots.length || "Ready"}
            detail={weeklySnapshots.length > 0 ? "Review trail." : "Save the first review."}
          />
          <ReviewTrailStat
            label="Versions"
            value={publishedDecisionHistory.length || "Draft"}
            detail={publishedDecisionHistory.length > 0 ? "Published packages." : "No receipt yet."}
          />
          <ReviewTrailStat
            label="Unread"
            value={unreadAthleteThreadMessages.length || "Clear"}
            detail={unreadAthleteThreadMessages.length > 0 ? "Athlete notes." : "No replies waiting."}
          />
        </div>

        <ReviewDrawer eyebrow="Weekly decisions" title="Recommendations and limiters" badge={`${weeklySnapshots.length} weeks`}>
          {weeklySnapshots.length === 0 ? (
            <ReviewEmptyPanel>
              No weekly review has been saved for this athlete yet. Save the current read before publishing if you want a decision trail to compare against next week.
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={saveWeeklySnapshot}>
                  Save first review
                </Button>
              </div>
            </ReviewEmptyPanel>
          ) : null}
          {weeklySnapshots.slice(0, 4).map((snapshot) => {
            const direction = inferSnapshotDirection(snapshot);
            const directionLabel = direction === "next" ? "Push / hold" : "Pull / correct";

            return (
              <div key={snapshot.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{snapshot.weekLabel}</div>
                    <div className="mt-1 text-xs text-slate-500">{snapshot.date}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={monthDirectionTone(direction)}>{directionLabel}</Badge>
                    <Badge variant="outline">{snapshot.limiter}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  <div>Condition {snapshot.condition}</div>
                  <div>Recovery {snapshot.recovery}</div>
                  <div>Completion {snapshot.completion}%</div>
                  <div>Compliance {snapshot.compliance}</div>
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                  {snapshot.recommendation}: {snapshot.notes}
                </div>
              </div>
            );
          })}
        </ReviewDrawer>

        <ReviewDrawer eyebrow="Version history" title="Packages, receipts, and reuse" badge={`${publishedDecisionCards.length} prior`}>
          {latestPublishedDecision ? (
            <div className={["rounded-[22px] border p-4", surfaceToneClass("primary")].join(" ")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Current published package</div>
                  <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{latestPublishedDecision.title}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{decisionVersionLabel(latestPublishedDecision, publishedDecisionHistory)}</Badge>
                  <Badge variant="outline">{formatDecisionDate(latestPublishedDecision.publishedAt)}</Badge>
                  <Badge className={latestPublishedDecision.status === "acknowledged" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"}>
                    {latestPublishedDecision.status === "acknowledged" ? "Acknowledged" : "Awaiting athlete"}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{latestPublishedDecision.instruction}</p>
              <ReviewMetricGrid metrics={latestPublishedDecisionMetrics} />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ReviewInfoTile label="Next action">
                  {latestPublishedDecision.nextAction}
                </ReviewInfoTile>
                <ReviewInfoTile label="Receipt state">
                  {decisionReceiptText(latestPublishedDecision)}
                </ReviewInfoTile>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => restoreCoachDecisionDraft(latestPublishedDecision.id)}>
                  Use as draft
                </Button>
                {latestPublishedDecision.status !== "acknowledged" ? (
                  <Button size="sm" onClick={acknowledgeLatestCoachDecision}>
                    Mark received
                  </Button>
                ) : null}
              </div>
              {publishedPlanDiffs.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/35">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Athlete sees this change list
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {publishedPlanDiffs.slice(0, 4).map((item) => {
                      const styles = planDiffToneClass(item.tone);

                      return (
                        <div key={item.id} className={`rounded-2xl border px-3 py-3 ${styles.panel}`}>
                          <Badge className={styles.badge}>{item.label}</Badge>
                          <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <ReviewEmptyPanel>
              Version history starts after the first successful publish. Until then, this draft is still private to the coach workspace.
              <div className="mt-3">
                <Button size="sm" onClick={publishCoachDecision} disabled={decisionSignalGate.status === "blocked"}>
                  {decisionSignalGate.status === "blocked" ? "Publish blocked" : "Publish first package"}
                </Button>
              </div>
            </ReviewEmptyPanel>
          )}

          {publishedDecisionHistory
            .filter((decision) => decision.id !== latestPublishedDecision?.id)
            .slice(0, 4)
            .map((decision) => {
              const decisionIndex = publishedDecisionHistory.findIndex((item) => item.id === decision.id);
              const previousVersion = decisionIndex >= 0 ? publishedDecisionHistory[decisionIndex + 1] : undefined;
              const versionMetrics = getDecisionMetrics(decision, previousVersion);

              return (
                <div key={decision.id} className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{decisionVersionLabel(decision, publishedDecisionHistory)}</Badge>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{decision.title}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDecisionDate(decision.publishedAt)} / {decisionReceiptText(decision)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={decision.status === "acknowledged" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200"}>
                        {decision.status === "acknowledged" ? "Acknowledged" : "Published"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => restoreCoachDecisionDraft(decision.id)}>
                        Use as draft
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{decision.instruction}</p>
                  <ReviewMetricGrid metrics={versionMetrics} muted />
                  <div className="mt-3">
                    <ReviewInfoTile label="Next action">
                      {decision.nextAction}
                    </ReviewInfoTile>
                  </div>
                </div>
              );
            })}
        </ReviewDrawer>

        <ReviewDrawer
          eyebrow="Coach thread"
          title={unreadLatestDecisionReplies.length > 0 ? `${unreadLatestDecisionReplies.length} unread on live package` : `${activeThreadMessages.length} recent messages`}
          badge={`${deliveredCoachMessages.length} delivered`}
          open={unreadAthleteThreadMessages.length > 0}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <ReviewTrailStat
              label="Unread athlete notes"
              value={unreadAthleteThreadMessages.length}
              detail="Replies stay open until reviewed."
            />
            <ReviewTrailStat
              label="Current version thread"
              value={latestDecisionThreadMessages.length}
              detail={unreadLatestDecisionReplies.length > 0 ? `${unreadLatestDecisionReplies.length} unread tied to this package.` : "No unread replies on the live package."}
            />
            <ReviewTrailStat
              label="Delivery trail"
              value={deliveredCoachMessages.length}
              detail="Delivered coach notes awaiting read receipt."
            />
          </div>

          {unreadAthleteThreadMessages.length > 0 ? (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-950/25">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Athlete reply waiting
                  </div>
                  <div className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-100/80">
                    Review the note before publishing another plan update.
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => markCoachThreadMessagesRead(unreadAthleteThreadMessages.map((message) => message.id))}
                >
                  Mark reviewed
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Textarea
              value={threadDraft}
              onChange={(event) => setThreadDraft(event.target.value)}
              rows={3}
              placeholder="Send a direct athlete note"
            />
            <Button
              className="self-end"
              onClick={() => {
                sendCoachThreadMessage("coach", threadDraft);
                setThreadDraft("");
              }}
            >
              Send
            </Button>
          </div>

          {activeThreadMessages.length === 0 ? (
            <ReviewEmptyPanel>
              No coach-thread notes for {activeAthlete.name} yet. Send the first note when the athlete needs context outside the published package.
            </ReviewEmptyPanel>
          ) : (
            activeThreadMessages.map((message) => (
              <div key={message.id} className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {message.author === "coach" ? "Coach" : "Athlete"}
                      </div>
                      <Badge className={threadMessageStatusClass(message)}>
                        {threadMessageStatusLabel(message)}
                      </Badge>
                      {message.relatedDecisionId ? (() => {
                        const relatedDecision = publishedDecisionHistory.find((decision) => decision.id === message.relatedDecisionId);

                        return (
                          <Badge variant="outline">
                            {relatedDecision ? decisionVersionLabel(relatedDecision, publishedDecisionHistory) : "Linked update"}
                          </Badge>
                        );
                      })() : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{formatDecisionDate(message.createdAt)}</div>
                  </div>
                  {message.author === "athlete" && !message.readAt ? (
                    <Button size="sm" variant="outline" onClick={() => markCoachThreadMessagesRead([message.id])}>
                      Review
                    </Button>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{message.body}</p>
              </div>
            ))
          )}
        </ReviewDrawer>
      </div>
    </SectionCard>
  );
}
