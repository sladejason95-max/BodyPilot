import React from "react";
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardCheck, FileDown } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import PrepSignalPanel from "../../components/shared/PrepSignalPanel";
import type { PrepSignalSnapshot } from "../prep_signal_engine";
import type { CoachThreadMessage, DecisionBrief, DecisionBriefItem, DecisionSignalGate, DecisionSignalGateItem, PublishedCoachDecision, WeeklySnapshot } from "../types";
import type { CheckInVisualReview } from "../checkin_visuals";
import { CoachReviewTrail } from "../coach_review_trail";
import { CoachPackageBuilder } from "../coach_package_builder";
import { planDiffToneClass, type CoachDecisionDraft, type PlanChangeDiffItem } from "../coach_workflow_ui";
import {
  AnalyticsStat,
  SectionCard,
  SignalTile,
  WorkspaceSummaryRail,
  surfaceToneClass,
  type AccentTone,
} from "../workspace_ui";
import {
  buildCoachTriageFilterOptions,
  coachTriageBucketLabel,
  coachTriagePriorityLabel,
  filterCoachTriageRows,
  type CoachTriageFilter,
  type CoachTriageRow,
} from "../coach_triage";

type UserMode = "athlete" | "coach";

type SummaryItem = {
  label: string;
  title: string;
  detail: string;
};

type Athlete = {
  id: string;
  name: string;
  division: string;
  status: string;
};

type CoachRecommendation = {
  action: string;
  reason: string;
};

type WorkflowPriorityItem = {
  label: string;
  title: string;
  detail: string;
  tab: string;
  tone?: AccentTone;
  queueType?: "food" | "training" | "recovery" | "check-in" | "publish" | "data" | "support" | "plan";
};

type ChangeDigestItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  detail: string;
  impact?: string;
};

type ComplianceConfidence = {
  label: string;
  score: number;
};

type ScienceCard = {
  label: string;
  title: string;
  detail: string;
  tone?: AccentTone;
};

type CoachTabProps = {
  userMode: UserMode;
  coachFocusCards: SummaryItem[];
  goToTab: (tab: string) => void;
  openTrackerSurface: (surface: "dashboard" | "log" | "insights" | "week") => void;
  openNutritionSurface: (surface: "log" | "add" | "insights", entryMode?: "search" | "scan" | "custom") => void;
  coachRecommendation: CoachRecommendation;
  primaryLimiter: string;
  selectedTrackerExecutionScore: number;
  selectedTrackerMissedLifts: number;
  lookStateLabel: string;
  conditionScore: number;
  drynessScore: number;
  coachInstruction: string;
  setCoachInstruction: React.Dispatch<React.SetStateAction<string>>;
  athleteIssue: string;
  setAthleteIssue: React.Dispatch<React.SetStateAction<string>>;
  athleteChangeSummary: string[];
  activeAthlete: Athlete;
  athleteRoster: Athlete[];
  selectedAthleteId: string;
  setSelectedAthleteId: (value: string) => void;
  weeksOut: number;
  trackerWeeklyReview: {
    averageCompletion: number;
    loggedDays: number;
  };
  complianceConfidence: ComplianceConfidence;
  decisionConfidence: {
    title: string;
    detail: string;
    score: number;
  };
  metricsTone: (value: number) => string;
  weeklyDensityScore: number;
  dashboardQueuedChanges: string[];
  publishCoachDecision: () => void;
  exportAthleteHandoff: () => void;
  saveWeeklySnapshot: () => void;
  exportCoachReport: () => void;
  restoreCoachDecisionDraft: (decisionId: string) => void;
  movementLimitation: string;
  setMovementLimitation: React.Dispatch<React.SetStateAction<string>>;
  weeklySnapshots: WeeklySnapshot[];
  recoveryScore: number;
  sleepHours: number;
  sleepQuality: number;
  coachWorkflowQueue: readonly WorkflowPriorityItem[];
  coachTriageRows: readonly CoachTriageRow<Athlete>[];
  workflowChangeDigest: readonly ChangeDigestItem[];
  latestCoachUpdate: ChangeDigestItem;
  scienceCards: readonly ScienceCard[];
  prepSignalSnapshot: PrepSignalSnapshot;
  decisionSignalGate: DecisionSignalGate;
  decisionBrief: DecisionBrief;
  coachDecisionDraft: CoachDecisionDraft;
  latestPublishedDecision: PublishedCoachDecision | null;
  publishedPlanDiffs: readonly PlanChangeDiffItem[];
  acknowledgeLatestCoachDecision: () => void;
  publishedDecisionHistory: readonly PublishedCoachDecision[];
  checkInVisualReview: CheckInVisualReview;
  addCheckIn: () => void;
  coachThreadMessages: readonly CoachThreadMessage[];
  sendCoachThreadMessage: (author: CoachThreadMessage["author"], body: string) => void;
  markCoachThreadMessagesRead: (messageIds?: string[]) => void;
};

export default function CoachTab(props: CoachTabProps) {
  const {
    userMode,
    coachFocusCards,
    goToTab,
    openTrackerSurface,
    openNutritionSurface,
    coachRecommendation,
    primaryLimiter,
    selectedTrackerExecutionScore,
    selectedTrackerMissedLifts,
    lookStateLabel,
    conditionScore,
    drynessScore,
    coachInstruction,
    setCoachInstruction,
    athleteIssue,
    setAthleteIssue,
    athleteChangeSummary,
    activeAthlete,
    athleteRoster,
    selectedAthleteId,
    setSelectedAthleteId,
    weeksOut,
    trackerWeeklyReview,
    complianceConfidence,
    decisionConfidence,
    metricsTone,
    weeklyDensityScore,
    dashboardQueuedChanges,
    publishCoachDecision,
    exportAthleteHandoff,
    saveWeeklySnapshot,
    exportCoachReport,
    restoreCoachDecisionDraft,
    movementLimitation,
    setMovementLimitation,
    weeklySnapshots,
    recoveryScore,
    sleepHours,
    sleepQuality,
    coachWorkflowQueue,
    coachTriageRows,
    workflowChangeDigest,
    latestCoachUpdate,
    scienceCards,
    prepSignalSnapshot,
    decisionSignalGate,
    decisionBrief,
    coachDecisionDraft,
    latestPublishedDecision,
    publishedPlanDiffs,
    acknowledgeLatestCoachDecision,
    publishedDecisionHistory,
    checkInVisualReview,
    addCheckIn,
    coachThreadMessages,
    sendCoachThreadMessage,
    markCoachThreadMessagesRead,
  } = props;
  const [queueFilter, setQueueFilter] = React.useState<WorkflowPriorityItem["queueType"] | "all">("all");
  const [triageFilter, setTriageFilter] = React.useState<CoachTriageFilter>("all");
  const visibleCoachWorkflowQueue =
    queueFilter === "all"
      ? coachWorkflowQueue
      : coachWorkflowQueue.filter((item) => item.queueType === queueFilter);
  const visibleCoachTriageRows = filterCoachTriageRows(coachTriageRows, triageFilter);
  const criticalTriageCount = coachTriageRows.filter((row) => row.priority >= 82).length;
  const triageFilterOptions = buildCoachTriageFilterOptions(coachTriageRows, [
    "food",
    "training",
    "recovery",
    "check-in",
    "invites",
    "updates",
    "support",
    "plan",
  ]);
  const topTriageRow = coachTriageRows[0] ?? null;
  const visualReviewStyles = planDiffToneClass(checkInVisualReview.tone);
  const openCoachQueueItem = (item: WorkflowPriorityItem) => {
    if (item.tab === "tracker") {
      openTrackerSurface(item.queueType === "plan" ? "week" : "log");
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.queueType === "food" ? "add" : "insights", "search");
      return;
    }

    goToTab(item.tab);
  };
  const openCoachTriageRow = (row: CoachTriageRow<Athlete>) => {
    if (row.athleteId) {
      setSelectedAthleteId(row.athleteId);
    }

    if (row.tab === "tracker") {
      openTrackerSurface(row.bucket === "plan" ? "week" : "log");
      return;
    }

    if (row.tab === "nutrition") {
      openNutritionSurface(row.bucket === "food" ? "add" : "insights", "search");
      return;
    }

    goToTab(row.tab);
  };
  const openDecisionGateItem = (item?: DecisionSignalGateItem) => {
    if (!item) {
      goToTab(decisionSignalGate.primaryTab);
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.id === "food-start" ? "add" : "insights", "search");
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    goToTab(item.tab);
  };
  const openDecisionBriefItem = (item: DecisionBriefItem) => {
    if (item.id === "signal" && decisionSignalGate.missing[0]) {
      openDecisionGateItem(decisionSignalGate.missing[0]);
      return;
    }

    if (item.tab === "nutrition") {
      openNutritionSurface(item.actionLabel === "Add Food" ? "add" : "insights", "search");
      return;
    }

    if (item.tab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    goToTab(item.tab);
  };
  const openDecisionBriefPrimary = () => {
    if (decisionSignalGate.status !== "ready" && decisionSignalGate.missing[0]) {
      openDecisionGateItem(decisionSignalGate.missing[0]);
      return;
    }

    if (decisionBrief.primaryTab === "nutrition") {
      openNutritionSurface("insights", "search");
      return;
    }

    if (decisionBrief.primaryTab === "tracker") {
      openTrackerSurface("log");
      return;
    }

    goToTab(decisionBrief.primaryTab);
  };

  const goToPreviousAthlete = () => {
    const currentIndex = athleteRoster.findIndex((athlete) => athlete.id === selectedAthleteId);
    const nextIndex = (currentIndex - 1 + athleteRoster.length) % athleteRoster.length;
    setSelectedAthleteId(athleteRoster[nextIndex]?.id ?? athleteRoster[0]?.id ?? selectedAthleteId);
  };

  const goToNextAthlete = () => {
    const currentIndex = athleteRoster.findIndex((athlete) => athlete.id === selectedAthleteId);
    const nextIndex = (currentIndex + 1) % athleteRoster.length;
    setSelectedAthleteId(athleteRoster[nextIndex]?.id ?? athleteRoster[0]?.id ?? selectedAthleteId);
  };

  const athleteDirectionNote = (() => {
    const normalizedReason = coachRecommendation.reason.trim().toLowerCase();
    const normalizedInstruction = `${coachRecommendation.action}. ${coachRecommendation.reason}`.trim().toLowerCase();
    const issue = athleteIssue.trim();
    const instruction = coachInstruction.trim();

    if (issue && issue.toLowerCase() !== normalizedReason) return issue;
    if (instruction && instruction.toLowerCase() !== normalizedInstruction) return instruction;
    return "";
  })();

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <WorkspaceSummaryRail
        title={userMode === "coach" ? "Coaching command" : "Current direction"}
        items={coachFocusCards}
      />

      <SectionCard
        title={userMode === "coach" ? "Prep signal board" : "Current call"}
      >
        <PrepSignalPanel snapshot={prepSignalSnapshot} onOpen={goToTab} />
      </SectionCard>

      {userMode === "athlete" ? (
        <>
          <SectionCard title="Current direction">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{decisionBrief.eyebrow}</div>
                    <Badge variant="outline">{decisionBrief.scoreLabel}</Badge>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{decisionBrief.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{decisionBrief.detail}</p>
                  <Button className="mt-4" onClick={openDecisionBriefPrimary}>
                    {decisionBrief.primaryActionLabel}
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Execution</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTrackerExecutionScore}%</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedTrackerMissedLifts} lifts still missed today.</div>
                  </div>
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Main limiter</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{primaryLimiter}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{latestCoachUpdate.title}</div>
                  </div>
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Look state</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{lookStateLabel}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Condition {conditionScore.toFixed(1)}, dryness {drynessScore.toFixed(1)}.</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Latest coach update</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{latestCoachUpdate.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{latestCoachUpdate.detail}</p>
                  {athleteDirectionNote ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                      {athleteDirectionNote}
                    </div>
                  ) : null}
                </div>

                {latestPublishedDecision ? (
                  <div className="rounded-[24px] border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-500/20 dark:bg-indigo-950/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-indigo-700 dark:text-indigo-200">
                          What changed
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                          {latestPublishedDecision.title}
                        </div>
                      </div>
                      <Badge className={latestPublishedDecision.status === "acknowledged" ? "border-emerald-200 bg-white/85 text-emerald-700" : "border-sky-200 bg-white/85 text-sky-700"}>
                        {latestPublishedDecision.status === "acknowledged" ? "Acknowledged" : "Needs receipt"}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {publishedPlanDiffs.slice(0, 3).map((item) => {
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
                    {latestPublishedDecision.status !== "acknowledged" ? (
                      <Button className="mt-4 w-full" onClick={acknowledgeLatestCoachDecision}>
                        Acknowledge direction
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                    <Button onClick={() => goToTab("tracker")}>Today</Button>
                    <Button variant="outline" onClick={() => goToTab("nutrition")}>Meals</Button>
                    <Button variant="outline" onClick={() => openTrackerSurface("week")}>Week</Button>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      ) : (
        <>
        <SectionCard
          title="Coach triage"
          description="Roster-wide blockers sorted by urgency, not by who happened to be opened last."
          right={topTriageRow ? (
            <Button size="sm" onClick={() => openCoachTriageRow(topTriageRow)}>
              Open top blocker
            </Button>
          ) : undefined}
        >
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Queue health</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                    {criticalTriageCount} critical
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {athleteRoster.length} athlete{athleteRoster.length === 1 ? "" : "s"} in the local roster
                  </div>
                </div>
                <Badge
                  className={
                    criticalTriageCount > 0
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100"
                  }
                >
                  {topTriageRow ? coachTriagePriorityLabel(topTriageRow.priority) : "Clear"}
                </Badge>
              </div>

              {topTriageRow ? (
                <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={planDiffToneClass(topTriageRow.tone).badge}>
                      {coachTriageBucketLabel(topTriageRow.bucket)}
                    </Badge>
                    <Badge variant="outline">{topTriageRow.athlete?.status ?? topTriageRow.athleteMeta}</Badge>
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-100">
                    {topTriageRow.athleteName}: {topTriageRow.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {topTriageRow.detail}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {triageFilterOptions.map((option) => (
                  <Button
                    key={`triage-filter-${option.value}`}
                    size="sm"
                    variant={triageFilter === option.value ? "default" : "outline"}
                    onClick={() => setTriageFilter(option.value)}
                  >
                    {option.label} {option.count}
                  </Button>
                ))}
              </div>

              <div className="mt-3 grid gap-2">
                {visibleCoachTriageRows.length === 0 ? (
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
                    No clients match this blocker bucket.
                  </div>
                ) : (
                  visibleCoachTriageRows.map((row) => {
                    const styles = planDiffToneClass(row.tone);

                    return (
                      <button
                        key={`triage-row-${row.id}`}
                        type="button"
                        onClick={() => openCoachTriageRow(row)}
                        className={[
                          "rounded-[20px] border px-3 py-3 text-left transition hover:-translate-y-[1px] hover:shadow-sm",
                          row.active ? styles.panel : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/40",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={row.active ? styles.badge : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"}>
                                {coachTriageBucketLabel(row.bucket)}
                              </Badge>
                              <Badge variant="outline">{coachTriagePriorityLabel(row.priority)}</Badge>
                              {row.active ? <Badge variant="outline">Active</Badge> : null}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
                              {row.athleteName} - {row.title}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                              {row.athleteMeta}
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {row.detail}
                            </p>
                          </div>
                          <div className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {row.actionLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.36fr)]">
          <SectionCard
            title="Coach workspace"
            description="Review the athlete, write the update, and keep the publish package in one place."
            right={(
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <Button aria-label="Previous athlete" size="sm" variant="outline" className="gap-2 rounded-xl" onClick={goToPreviousAthlete}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button aria-label="Next athlete" size="sm" variant="outline" className="gap-2 rounded-xl" onClick={goToNextAthlete}>
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          >
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <AnalyticsStat label="Athlete" value={activeAthlete.name} helper={`${activeAthlete.division} / ${weeksOut} weeks out`} tone={metricsTone(conditionScore)} />
              <AnalyticsStat label="Week completion" value={`${trackerWeeklyReview.averageCompletion}%`} helper={`${trackerWeeklyReview.loggedDays} logged days`} tone={metricsTone(trackerWeeklyReview.averageCompletion / 10)} />
              <AnalyticsStat label="Current call" value={decisionBrief.sourceLabel} helper={decisionBrief.title} tone={metricsTone(6)} />
              <AnalyticsStat label="Signal gate" value={`${decisionSignalGate.score} / 100`} helper={decisionSignalGate.title} tone={metricsTone(decisionSignalGate.score / 10)} />
            </div>

            <div className="mt-4 grid gap-2 rounded-[20px] border border-slate-200 bg-white/86 p-3 dark:border-white/10 dark:bg-slate-950/40 sm:grid-cols-3">
              <Button variant="outline" className="justify-center gap-2 rounded-xl" onClick={saveWeeklySnapshot}>
                <ClipboardCheck className="h-4 w-4" />
                Save review
              </Button>
              <Button variant="outline" className="justify-center gap-2 rounded-xl" onClick={exportCoachReport}>
                <FileDown className="h-4 w-4" />
                Export report
              </Button>
              <Button variant="outline" className="justify-center gap-2 rounded-xl" onClick={() => openTrackerSurface("week")}>
                <CalendarDays className="h-4 w-4" />
                Open week
              </Button>
            </div>

            <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
              <div className="min-w-0 space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Current read</div>
                  <div className="mt-3 space-y-3">
                    <div className={["rounded-2xl border p-4", surfaceToneClass("primary")].join(" ")}>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Execution truth</div>
                      <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{selectedTrackerExecutionScore}% today, {selectedTrackerMissedLifts} lifts missed</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Do not change the week aggressively until today is clean enough to trust.</div>
                    </div>
                    <div className={["rounded-2xl border p-4", surfaceToneClass("secondary")].join(" ")}>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Recovery context</div>
                      <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">Sleep {sleepHours.toFixed(1)}h, quality {sleepQuality}/10, recovery {recoveryScore.toFixed(1)}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Check whether the load is actually being supported before you blame training structure or food flow.</div>
                    </div>
                    <div className={["rounded-2xl border p-4", surfaceToneClass("secondary")].join(" ")}>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Look read</div>
                      <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{lookStateLabel}, condition {conditionScore.toFixed(1)}, dryness {drynessScore.toFixed(1)}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Only after execution and recovery make sense should the visual read drive the coaching call.</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Visual evidence</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{checkInVisualReview.title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{checkInVisualReview.detail}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={visualReviewStyles.badge}>{checkInVisualReview.statusLabel}</Badge>
                      <Badge variant="outline">{checkInVisualReview.photoCoverageLabel}</Badge>
                    </div>
                  </div>

                  <div className={`mt-3 rounded-2xl border px-3 py-3 ${visualReviewStyles.panel}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Coach decision cue</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-100">{checkInVisualReview.decisionCueTitle}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{checkInVisualReview.decisionCueDetail}</p>
                  </div>

                  {checkInVisualReview.metrics.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {checkInVisualReview.metrics.map((item) => (
                        <SignalTile
                          key={`visual-metric-${item.label}`}
                          label={item.label}
                          title={item.title}
                          detail={item.detail}
                          tone={item.tone}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {checkInVisualReview.photoSlots.map((slot) => (
                      <div key={`visual-slot-${slot.slot}`} className="rounded-[18px] border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950/40">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{slot.label}</div>
                          <Badge variant="outline">
                            {Number(slot.latestHasPhoto) + Number(slot.previousHasPhoto)}/2
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Latest", checkInLabel: slot.latestLabel, photo: slot.latestPhoto },
                            { label: "Prior", checkInLabel: slot.previousLabel, photo: slot.previousPhoto },
                          ].map((image) => (
                            <div key={`${slot.slot}-${image.label}`} className="overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                              {image.photo ? (
                                <img src={image.photo} alt={`${image.checkInLabel} ${slot.label} progress`} className="aspect-[3/4] w-full object-cover" />
                              ) : (
                                <div className="flex aspect-[3/4] items-center justify-center px-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  No photo
                                </div>
                              )}
                              <div className="border-t border-slate-200 px-2 py-1 text-center text-[10px] font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
                                {image.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {checkInVisualReview.timeline.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {checkInVisualReview.timeline.slice(0, 3).map((entry) => (
                        <div key={`visual-timeline-${entry.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950/40">
                          <div>
                            <div className="font-semibold text-slate-950 dark:text-slate-100">{entry.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {entry.date}, {entry.photoCount}/3 photos
                            </div>
                          </div>
                          <Badge variant="outline">{entry.conditionDeltaLabel}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={addCheckIn}>Add check-in</Button>
                    <Button size="sm" variant="outline" onClick={() => goToTab("dashboard")}>Open photo review</Button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Decision brief</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{decisionBrief.title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{decisionBrief.detail}</p>
                    </div>
                    <Button size="sm" onClick={openDecisionBriefPrimary}>
                      {decisionBrief.primaryActionLabel}
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {decisionBrief.items.map((item) => {
                      const styles = planDiffToneClass(item.tone);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openDecisionBriefItem(item)}
                          className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-[1px] hover:shadow-sm ${styles.panel}`}
                        >
                          <Badge className={styles.badge}>{item.label}</Badge>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                    Compliance {complianceConfidence.label}, {complianceConfidence.score} / 100, density {weeklyDensityScore}. Queued changes stay in the publish package, not as a second recommendation list.
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Evidence summary</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {scienceCards.map((item) => (
                      <SignalTile
                        key={`${item.label}-${item.title}`}
                        label={item.label}
                        title={item.title}
                        detail={item.detail}
                        tone={item.tone}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <CoachPackageBuilder
                coachDecisionDraft={coachDecisionDraft}
                decisionSignalGate={decisionSignalGate}
                coachInstruction={coachInstruction}
                setCoachInstruction={setCoachInstruction}
                athleteIssue={athleteIssue}
                setAthleteIssue={setAthleteIssue}
                movementLimitation={movementLimitation}
                setMovementLimitation={setMovementLimitation}
                visualQualityComplete={checkInVisualReview.latestPhotoCount > 0}
                visualQualityDetail={
                  checkInVisualReview.latestPhotoCount > 0
                    ? `${checkInVisualReview.photoCoverageLabel}. ${checkInVisualReview.decisionCueTitle}.`
                    : checkInVisualReview.decisionCueDetail
                }
                openDecisionGateItem={openDecisionGateItem}
                publishCoachDecision={publishCoachDecision}
                exportAthleteHandoff={exportAthleteHandoff}
              />
            </div>
          </SectionCard>

          <div className="grid min-w-0 gap-5">
            <SectionCard title="Needs attention first" description="Use this queue to reduce misses, close data gaps, and publish faster.">
              <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    ["all", "All"],
                    ["food", "Food"],
                    ["training", "Lifts"],
                    ["recovery", "Recovery"],
                    ["check-in", "Check-in"],
                    ["publish", "Publish"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={queueFilter === value ? "default" : "outline"}
                      onClick={() => setQueueFilter(value as typeof queueFilter)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {visibleCoachWorkflowQueue.length === 0 ? (
                  <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
                    Nothing in this queue filter needs action.
                  </div>
                ) : null}

                {visibleCoachWorkflowQueue.map((item, index) => (
                  <div
                    key={`${item.label}-${item.title}`}
                    className={[
                      "rounded-[22px] border p-4",
                      index === 0 ? surfaceToneClass("primary") : surfaceToneClass("secondary"),
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{item.label}</div>
                        <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openCoachQueueItem(item)}>
                        Open
                      </Button>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                ))}

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Last athlete-facing update</div>
                      <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{latestCoachUpdate.title}</div>
                    </div>
                    <Badge variant="outline">{latestCoachUpdate.date}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{latestCoachUpdate.detail}</p>
                </div>

                {workflowChangeDigest
                  .filter((item) => item.id !== latestCoachUpdate.id)
                  .slice(0, 2)
                  .map((item) => (
                    <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                        </div>
                        <div className="text-xs text-slate-500">{item.date}</div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                  ))}
              </div>
            </SectionCard>

            <CoachReviewTrail
              activeAthlete={activeAthlete}
              weeklySnapshots={weeklySnapshots}
              decisionSignalGate={decisionSignalGate}
              coachDecisionDraft={coachDecisionDraft}
              latestPublishedDecision={latestPublishedDecision}
              publishedPlanDiffs={publishedPlanDiffs}
              publishedDecisionHistory={publishedDecisionHistory}
              coachThreadMessages={coachThreadMessages}
              publishCoachDecision={publishCoachDecision}
              saveWeeklySnapshot={saveWeeklySnapshot}
              restoreCoachDecisionDraft={restoreCoachDecisionDraft}
              acknowledgeLatestCoachDecision={acknowledgeLatestCoachDecision}
              sendCoachThreadMessage={sendCoachThreadMessage}
              markCoachThreadMessagesRead={markCoachThreadMessagesRead}
            />
          </div>
        </div>
        </>
      )}
    </div>
  );
}

