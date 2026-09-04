import React, { useId, useRef } from "react";
import { Check, Circle, MoreHorizontal, SkipForward, Undo2 } from "lucide-react";
import type { SetRecommendation } from "../../app/hypertrophy_engine";
import { RirSelect, WorkoutNumberField } from "./WorkoutFields";

type SetValues = { weight: number; reps: number; rir: number };

export type WorkoutSetRowProps = {
  exerciseName: string;
  setIndex: number;
  setItem: SetValues & { id: string; done: boolean; skipped?: boolean };
  recommendation: SetRecommendation;
  previous: SetValues | null;
  step: number;
  loadRequired: boolean;
  draftOnly: boolean;
  disabled: boolean;
  onChange: (patch: Partial<SetValues>) => void;
  onToggle: () => void;
  onUseTarget: () => void;
  onSkip: () => void;
  onRemove: () => void;
};

const formatSet = ({ weight, reps, rir }: SetValues) =>
  `${weight > 0 ? `${weight} lb × ` : ""}${reps} reps · ${rir} RIR`;

export function WorkoutSetRow({
  exerciseName,
  setIndex,
  setItem,
  recommendation,
  previous,
  step,
  loadRequired,
  draftOnly,
  disabled,
  onChange,
  onToggle,
  onUseTarget,
  onSkip,
  onRemove,
}: WorkoutSetRowProps) {
  const feedbackId = useId();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const setName = `${exerciseName} set ${setIndex + 1}`;
  const resolved = setItem.done || Boolean(setItem.skipped);
  const invalidLoad = !Number.isFinite(setItem.weight) || setItem.weight > 100_000 ||
    (loadRequired ? setItem.weight <= 0 : setItem.weight < 0);
  const invalidReps = !Number.isInteger(setItem.reps) || setItem.reps <= 0 || setItem.reps > 999;
  const invalidRir = !Number.isFinite(setItem.rir) || setItem.rir < 0 || setItem.rir > 5;
  const invalid = invalidLoad || invalidReps || invalidRir;
  const needsCorrection = !setItem.skipped && invalid;
  const status = setItem.skipped ? "Skipped" : setItem.done ? "Logged" : draftOnly ? "Suggested" : "Entered";
  const inputStep = Number.isFinite(step) && step > 0 ? step : 1;
  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };
  const menuAction = (action: () => void) => {
    closeMenu();
    action();
  };
  const actionClass = "min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10";

  return (
    <div className={`min-w-0 rounded-2xl border p-3 ${
      setItem.skipped
        ? "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]"
        : setItem.done && invalid
          ? "border-rose-300 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-400/10"
          : "border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]"
    }`}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Set {setIndex + 1}</span>
          <span className={`ml-2 text-xs ${setItem.done && !setItem.skipped ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
            {status}
          </span>
        </div>
        <button
          type="button"
          className={`grid h-11 min-h-11 w-11 min-w-11 place-items-center rounded-xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-40 ${
            resolved
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
              : "border-slate-300 bg-white text-slate-600 hover:border-slate-500 dark:border-white/20 dark:bg-white/5 dark:text-slate-200"
          }`}
          aria-label={`${setItem.skipped ? "Skipped" : setItem.done ? "Completed" : "Complete"} ${setName}`}
          aria-pressed={resolved}
          aria-describedby={feedbackId}
          title={resolved ? "Undo this set" : "Log the values shown"}
          disabled={disabled || (!resolved && invalid)}
          onClick={onToggle}
        >
          {setItem.skipped ? <SkipForward className="h-5 w-5" aria-hidden="true" /> : setItem.done ? <Check className="h-5 w-5" aria-hidden="true" /> : <Circle className="h-5 w-5" aria-hidden="true" />}
        </button>
        <details
          ref={menuRef}
          className="relative shrink-0"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeMenu();
              menuRef.current?.querySelector("summary")?.focus();
            }
          }}
        >
          <summary
            className="grid h-11 min-h-11 w-11 min-w-11 cursor-pointer list-none place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:text-slate-400 dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden"
            aria-label={`More actions for ${setName}`}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1 text-slate-700 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200">
            <button type="button" className={actionClass} disabled={disabled || resolved} onClick={() => menuAction(onUseTarget)} aria-label={`Use recommendation for ${setName}`}>
              Reset to target
            </button>
            <button type="button" className={actionClass} disabled={disabled || resolved} onClick={() => menuAction(onSkip)} aria-label={`Skip ${setName}`}>
              Skip set
            </button>
            <button type="button" className={`${actionClass} text-rose-700 dark:text-rose-300`} disabled={disabled} onClick={() => menuAction(onRemove)} aria-label={`Remove ${setName}`}>
              Remove set
            </button>
            <p className="mt-1 border-t border-slate-200 px-3 py-2 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
              {recommendation.reason}
            </p>
          </div>
        </details>
      </div>

      <div className="mt-2 grid min-w-0 grid-cols-3 gap-2">
        <WorkoutNumberField
          label={`${setName} weight`}
          displayLabel={loadRequired ? "Weight · lb" : "Added lb"}
          value={setItem.weight}
          min={0}
          max={100_000}
          step={inputStep}
          inputMode="decimal"
          disabled={disabled || Boolean(setItem.skipped)}
          onChange={(weight) => onChange({ weight: Math.max(0, weight) })}
        />
        <WorkoutNumberField
          label={`${setName} reps`}
          displayLabel="Reps"
          value={setItem.reps}
          min={0}
          max={999}
          disabled={disabled || Boolean(setItem.skipped)}
          onChange={(reps) => onChange({ reps: Math.max(0, Math.min(999, Math.round(reps))) })}
        />
        <RirSelect
          label={`${setName} RIR`}
          displayLabel="RIR"
          value={setItem.rir}
          disabled={disabled || Boolean(setItem.skipped)}
          onChange={(rir) => onChange({ rir })}
        />
      </div>

      <div id={feedbackId} className="mt-2 space-y-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
        <p>Previous: {previous ? formatSet(previous) : "No prior result"}</p>
        <p>Target: {formatSet(recommendation)}</p>
        {needsCorrection ? (
          <p className="text-rose-700 dark:text-rose-300">
            {invalidLoad && loadRequired ? "Enter your load before logging." : "Enter valid reps, load, and RIR before logging."}
          </p>
        ) : draftOnly && !resolved ? (
          <p>Check to log these values, or edit what you did.</p>
        ) : resolved ? (
          <p className="flex items-center gap-1"><Undo2 className="h-3 w-3" aria-hidden="true" /> Check again to undo.</p>
        ) : null}
      </div>
    </div>
  );
}
