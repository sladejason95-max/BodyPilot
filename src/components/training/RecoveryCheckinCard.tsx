import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, HeartPulse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type RecoveryExpectation = "below" | "steady" | "above";

export type RecoveryCheckinDraft = {
  muscleGroup: string;
  label: string;
  soreness: number;
  readiness: number;
  jointPain: number;
  performanceExpectation: RecoveryExpectation;
};

type Props = {
  items: RecoveryCheckinDraft[];
  onSave: (items: RecoveryCheckinDraft[]) => void;
  onSkip: () => void;
};

const scaleLabels = {
  soreness: ["None", "Mild", "Moderate", "High", "Too sore"],
  readiness: ["Not ready", "Low", "Ready", "Strong", "Excellent"],
  jointPain: ["None", "Minor", "Noticeable", "High", "Stop"],
};

function Scale({
  label,
  value,
  labels,
  onChange,
}: {
  label: string;
  value: number;
  labels: string[];
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</legend>
      <div className="mt-1.5 grid grid-cols-5 gap-1">
        {labels.map((option, index) => (
          <button
            key={option}
            type="button"
            title={option}
            aria-label={`${label}: ${option}`}
            aria-pressed={value === index}
            onClick={() => onChange(index)}
            className={`min-h-10 rounded-[12px] border px-1 text-[10px] font-semibold sm:text-xs ${
              value === index
                ? index >= 3 && label !== "Readiness"
                  ? "border-rose-400 bg-rose-600 text-white dark:border-rose-300"
                  : "border-emerald-400 bg-emerald-600 text-white dark:border-emerald-300"
                : "border-slate-200 bg-white/65 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
            }`}
          >
            <span aria-hidden="true">{index}</span>
            <span className="sr-only">{option}</span>
          </button>
        ))}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels[value]}</div>
    </fieldset>
  );
}

export function RecoveryCheckinCard({ items, onSave, onSkip }: Props) {
  const [drafts, setDrafts] = useState(() => items.map((item) => ({ ...item })));
  const [expanded, setExpanded] = useState(true);
  const hasJointFlag = drafts.some((item) => item.jointPain >= 2);

  const update = (muscleGroup: string, patch: Partial<RecoveryCheckinDraft>) => {
    setDrafts((current) => current.map((item) => (item.muscleGroup === muscleGroup ? { ...item, ...patch } : item)));
  };

  return (
    <section className="rounded-[26px] border border-emerald-200 bg-emerald-50/76 p-4 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100" aria-labelledby="recovery-checkin-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70 dark:bg-slate-950/25">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="recovery-checkin-title" className="font-semibold">Pre-workout readiness</h2>
              <Badge variant="outline" className="border-emerald-300 bg-white/55 text-emerald-800 dark:border-emerald-300/20 dark:text-emerald-100">
                {drafts.length} relevant {drafts.length === 1 ? "muscle" : "muscles"}
              </Badge>
            </div>
            <p className="mt-1 text-sm opacity-80">A fast check before the next exposure; other muscles are not asked about.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} readiness check-in`} onClick={() => setExpanded((value) => !value)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3">
          {drafts.map((item) => (
            <div key={item.muscleGroup} className="grid gap-3 rounded-[20px] border border-emerald-200/80 bg-white/68 p-3 text-slate-950 dark:border-emerald-300/15 dark:bg-slate-950/28 dark:text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{item.label}</div>
                {item.jointPain >= 2 ? (
                  <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Joint flag
                  </Badge>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Scale label="Soreness" value={item.soreness} labels={scaleLabels.soreness} onChange={(soreness) => update(item.muscleGroup, { soreness })} />
                <Scale label="Readiness" value={item.readiness} labels={scaleLabels.readiness} onChange={(readiness) => update(item.muscleGroup, { readiness })} />
                <Scale label="Joint" value={item.jointPain} labels={scaleLabels.jointPain} onChange={(jointPain) => update(item.muscleGroup, { jointPain })} />
              </div>
              <fieldset>
                <legend className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Expected performance</legend>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {([
                    ["below", "Below usual"],
                    ["steady", "Steady"],
                    ["above", "Above usual"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={item.performanceExpectation === value}
                      onClick={() => update(item.muscleGroup, { performanceExpectation: value })}
                      className={`min-h-10 rounded-[12px] border px-2 text-xs font-semibold ${
                        item.performanceExpectation === value
                          ? "border-slate-900 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                          : "border-slate-200 bg-white/65 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ))}
          {hasJointFlag ? (
            <div role="alert" className="flex gap-2 rounded-[16px] border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Noticeable joint discomfort will hold load progression and flag affected exercises for substitution.</span>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
            <Button className="gap-2" onClick={() => onSave(drafts)}><CheckCircle2 className="h-4 w-4" /> Save readiness</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
