import React from "react";
import { CheckCircle2, Copy, Send } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import type { DecisionSignalGate, DecisionSignalGateItem } from "./types";
import { publishDraftTone, type CoachDecisionDraft } from "./coach_workflow_ui";

type CoachPackageBuilderProps = {
  coachDecisionDraft: CoachDecisionDraft;
  decisionSignalGate: DecisionSignalGate;
  coachInstruction: string;
  setCoachInstruction: React.Dispatch<React.SetStateAction<string>>;
  athleteIssue: string;
  setAthleteIssue: React.Dispatch<React.SetStateAction<string>>;
  movementLimitation: string;
  setMovementLimitation: React.Dispatch<React.SetStateAction<string>>;
  visualQualityComplete: boolean;
  visualQualityDetail: string;
  openDecisionGateItem: (item?: DecisionSignalGateItem) => void;
  publishCoachDecision: () => void;
  exportAthleteHandoff: () => void;
};

const buildDecisionQualityItems = (
  coachDecisionDraft: CoachDecisionDraft,
  decisionSignalGate: DecisionSignalGate,
  visualQualityComplete: boolean,
  visualQualityDetail: string
) => [
  {
    label: "One call",
    complete: coachDecisionDraft.title.trim().length > 0 && coachDecisionDraft.queuedChanges.length <= 3,
    detail:
      coachDecisionDraft.queuedChanges.length <= 3
        ? "Package stays focused."
        : "Too many queued changes will feel noisy.",
  },
  {
    label: "Reason",
    complete: coachDecisionDraft.reason.trim().length >= 24,
    detail: coachDecisionDraft.reason.trim().length >= 24 ? "Reason is specific enough." : "Add the actual reason before publishing.",
  },
  {
    label: "Next action",
    complete: coachDecisionDraft.nextAction.trim().length >= 12,
    detail: coachDecisionDraft.nextAction.trim().length >= 12 ? coachDecisionDraft.nextAction : "Tell the athlete exactly what to do next.",
  },
  {
    label: "Signal",
    complete: decisionSignalGate.status === "ready",
    detail: `${decisionSignalGate.score}/100 signal. ${decisionSignalGate.title}.`,
  },
  {
    label: "Visuals",
    complete: visualQualityComplete,
    detail: visualQualityDetail,
  },
];

export function CoachPackageBuilder({
  coachDecisionDraft,
  decisionSignalGate,
  coachInstruction,
  setCoachInstruction,
  athleteIssue,
  setAthleteIssue,
  movementLimitation,
  setMovementLimitation,
  visualQualityComplete,
  visualQualityDetail,
  openDecisionGateItem,
  publishCoachDecision,
  exportAthleteHandoff,
}: CoachPackageBuilderProps) {
  const decisionQualityItems = buildDecisionQualityItems(
    coachDecisionDraft,
    decisionSignalGate,
    visualQualityComplete,
    visualQualityDetail
  );
  const decisionQualityCompleteCount = decisionQualityItems.filter((item) => item.complete).length;
  const missingQualityItems = decisionQualityItems.filter((item) => !item.complete);
  const firstBlocker = decisionSignalGate.missing[0] ?? null;
  const secondaryBlockers = decisionSignalGate.missing.slice(1, 4);
  const changeLines =
    coachDecisionDraft.queuedChanges.length > 0
      ? coachDecisionDraft.queuedChanges.slice(0, 3)
      : [coachDecisionDraft.nextAction];
  const isSignalBlocked = decisionSignalGate.status === "blocked";
  const packageReady = !isSignalBlocked && missingQualityItems.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Publish checkout</div>
            <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{coachDecisionDraft.title}</div>
          </div>
          <Badge
            className={
              packageReady
                ? "w-fit self-start border-emerald-200 bg-emerald-50 text-emerald-700"
                : `${publishDraftTone(isSignalBlocked ? decisionSignalGate.tone : coachDecisionDraft.readinessTone)} w-fit self-start`
            }
          >
            {packageReady ? "Ready to send" : isSignalBlocked ? "Blocked" : "Needs review"}
          </Badge>
        </div>

        <div className="mt-3 space-y-3">
          <div className={`rounded-2xl border p-3 ${publishDraftTone(isSignalBlocked ? decisionSignalGate.tone : coachDecisionDraft.readinessTone)}`}>
            {isSignalBlocked ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Fix this first</div>
                    <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{decisionSignalGate.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{decisionSignalGate.detail}</p>
                  </div>
                  <Badge className={`${publishDraftTone(decisionSignalGate.tone)} w-fit self-start`}>
                    {decisionSignalGate.score} / 100
                  </Badge>
                </div>
                {firstBlocker ? (
                  <Button className="w-full justify-center" onClick={() => openDecisionGateItem(firstBlocker)}>
                    {firstBlocker.actionLabel}
                  </Button>
                ) : (
                  <Button className="w-full justify-center" onClick={() => openDecisionGateItem()}>
                    Clear signal gate
                  </Button>
                )}
                {secondaryBlockers.length > 0 ? (
                  <details className="rounded-2xl border border-rose-200 bg-white/70 p-3 dark:border-rose-500/25 dark:bg-white/[0.04]">
                    <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.06em] text-rose-700 dark:text-rose-100">
                      {secondaryBlockers.length} more blockers
                    </summary>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {secondaryBlockers.map((item) => (
                        <Button key={item.id} size="sm" variant="outline" onClick={() => openDecisionGateItem(item)}>
                          {item.actionLabel}
                        </Button>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Ready check</div>
                  <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">{coachDecisionDraft.readinessTitle}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{coachDecisionDraft.readinessDetail}</p>
                </div>
                <Badge className={`${publishDraftTone(coachDecisionDraft.readinessTone)} w-fit self-start`}>
                  {decisionQualityCompleteCount}/{decisionQualityItems.length}
                </Badge>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                1
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Coach call</div>
                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{coachDecisionDraft.instruction}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3 dark:border-indigo-500/20 dark:bg-indigo-950/20">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-semibold text-white dark:bg-indigo-200 dark:text-indigo-950">
                2
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-indigo-700 dark:text-indigo-200">
                    Athlete will see
                  </div>
                  <Badge className="border-indigo-200 bg-white/85 text-indigo-700 dark:border-indigo-400/25 dark:bg-white/[0.08] dark:text-indigo-100">
                    What changed
                  </Badge>
                </div>
                <div className="mt-2 space-y-2">
                  {changeLines.map((line, index) => (
                    <div key={`${line}-${index}`} className="rounded-2xl border border-white/80 bg-white/82 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                3
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Label>Coach note</Label>
                <Textarea value={coachInstruction} onChange={(event) => setCoachInstruction(event.target.value)} rows={4} />
              </div>
            </div>
          </div>

          <details className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Review details</div>
                  <div className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {decisionQualityCompleteCount}/{decisionQualityItems.length} checks ready
                  </div>
                </div>
                <Badge
                  className={
                    packageReady
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {packageReady ? "Clean" : "Review"}
                </Badge>
              </div>
            </summary>
            <div className="mt-3 space-y-3">
              {missingQualityItems.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
                  <div className="font-semibold">Needs attention</div>
                  <div className="mt-2 space-y-2">
                    {missingQualityItems.map((item) => (
                      <div key={item.label}>
                        {item.label}: {item.detail}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>The update is focused, explainable, and ready for the athlete.</div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {coachDecisionDraft.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{metric.label}</div>
                    <div className="mt-1.5 font-semibold text-slate-900 dark:text-slate-100">{metric.value}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{metric.detail}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Athlete next action</div>
                <div className="mt-1.5">{coachDecisionDraft.nextAction}</div>
              </div>
            </div>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Advanced notes</div>
                  <div className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">Issue, limitations, handoff detail</div>
                </div>
                <Badge variant="outline">Optional</Badge>
              </div>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Athlete issue</Label>
                  <Textarea value={athleteIssue} onChange={(event) => setAthleteIssue(event.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Movement limitation</Label>
                  <Input value={movementLimitation} onChange={(event) => setMovementLimitation(event.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Handoff preview</div>
                  <div className="mt-2 space-y-2">
                    {coachDecisionDraft.summaryLines.map((line, index) => (
                      <div key={`${line}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
                {coachDecisionDraft.queuedChanges.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Queued changes in package</div>
                    <div className="mt-2 space-y-2">
                      {coachDecisionDraft.queuedChanges.map((line, index) => (
                        <div key={`${line}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      </div>

      <div
        className={[
          "rounded-[24px] border p-3",
          isSignalBlocked
            ? "border-rose-200 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-950/25"
            : "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-950/25",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={["text-sm font-semibold", isSignalBlocked ? "text-rose-900 dark:text-rose-100" : "text-emerald-900 dark:text-emerald-100"].join(" ")}>
              {isSignalBlocked ? "Publishing waits on the blocker above" : "Ready for athlete delivery"}
            </div>
            <div className={["mt-1 text-xs leading-5", isSignalBlocked ? "text-rose-800/80 dark:text-rose-100/75" : "text-emerald-800/80 dark:text-emerald-100/75"].join(" ")}>
              {isSignalBlocked ? "Fix the first signal issue, then send one clean update." : "Send the package, then watch the Review trail for receipt and replies."}
            </div>
          </div>
          <div className="grid gap-2 sm:min-w-48">
            <Button className="gap-2" onClick={publishCoachDecision} disabled={isSignalBlocked}>
              <Send className="h-4 w-4" />
              {isSignalBlocked ? "Publish blocked" : "Send update"}
            </Button>
            <Button className="gap-2" variant="outline" onClick={exportAthleteHandoff}>
              <Copy className="h-4 w-4" />
              Copy handoff
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
