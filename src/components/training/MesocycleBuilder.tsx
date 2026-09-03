import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Plus, ShieldAlert, Sparkles, Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { withBuilderEquipmentProfile } from "@/app/builder_equipment";

export type BuilderMuscleGroup =
  | "chest"
  | "back"
  | "quads"
  | "hamstrings"
  | "shoulders"
  | "arms"
  | "glutes"
  | "core";
export type BuilderMusclePriority = "specialize" | "emphasize" | "grow" | "maintain" | "minimum" | "exclude";
export type BuilderEquipment = "full-gym" | "home-gym" | "dumbbells";
export type BuilderWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type BuilderExercise = {
  name: string;
  muscleGroup: BuilderMuscleGroup;
  pattern: string;
  target?: string;
  custom?: boolean;
  equipment?: BuilderEquipment[];
};

export type MesocycleBuilderDraft = {
  sessionsPerWeek: number;
  availableTrainingDays: BuilderWeekday[];
  sessionMinutes: number;
  equipment: BuilderEquipment;
  musclePriorities: Record<BuilderMuscleGroup, BuilderMusclePriority>;
  favoriteExercises: string[];
  restrictedExercises: string[];
  customExercises: BuilderExercise[];
  exerciseReplacements: Record<string, string>;
  mesoLengthWeeks: number;
  startDate: string;
  weightIncrement: number;
};

export type MesocyclePreviewDay = {
  id: string;
  focus: string;
  exerciseCount: number;
  exercises: Array<{
    slotId: string;
    name: string;
    muscleGroup: BuilderMuscleGroup;
    replacementOptions: string[];
    unavailableSelection?: string;
  }>;
  estimatedMinutes: number;
  muscles: string;
};

export type MesocyclePreview = {
  name: string;
  days: MesocyclePreviewDay[];
  weeklySets: Array<{ muscle: string; sets: number }>;
  muscleFrequency: Array<{ muscle: string; sessions: number }>;
  loadingWeeks: Array<{ week: number; targetRir: number; deload: boolean }>;
  issues: string[];
};

type Props = {
  initialDraft: MesocycleBuilderDraft;
  exercises: BuilderExercise[];
  muscleLabels: Record<BuilderMuscleGroup, string>;
  previewFor: (draft: MesocycleBuilderDraft) => MesocyclePreview;
  onApply: (draft: MesocycleBuilderDraft) => void;
  onCancel: () => void;
};

const steps = ["Schedule", "Equipment", "Muscles", "Exercises", "Structure", "Review"] as const;
const weekdays: Array<{ value: BuilderWeekday; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];
const priorities: Array<{ value: BuilderMusclePriority; label: string; detail: string }> = [
  { value: "specialize", label: "Specialize", detail: "Highest recoverable focus" },
  { value: "emphasize", label: "Emphasize", detail: "Extra growth work" },
  { value: "grow", label: "Grow", detail: "Standard progression" },
  { value: "maintain", label: "Maintain", detail: "Hold current tissue" },
  { value: "minimum", label: "Minimum", detail: "Lowest useful dose" },
  { value: "exclude", label: "Exclude", detail: "Temporarily omit" },
];

const unique = (values: string[]) => Array.from(new Set(values));

export function MesocycleBuilder({ initialDraft, exercises, muscleLabels, previewFor, onApply, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<MesocycleBuilderDraft>(() => ({
    ...initialDraft,
    availableTrainingDays: [...initialDraft.availableTrainingDays],
    musclePriorities: { ...initialDraft.musclePriorities },
    favoriteExercises: [...initialDraft.favoriteExercises],
    restrictedExercises: [...initialDraft.restrictedExercises],
    customExercises: initialDraft.customExercises.map((item) => ({ ...item })),
    exerciseReplacements: { ...initialDraft.exerciseReplacements },
  }));
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseMuscle, setExerciseMuscle] = useState<BuilderMuscleGroup>("chest");
  const [customName, setCustomName] = useState("");
  const [customPattern, setCustomPattern] = useState("");
  const preview = useMemo(() => previewFor(draft), [draft, previewFor]);
  const hasDayMismatch = draft.availableTrainingDays.length !== draft.sessionsPerWeek;
  const hasBlockingIssues = hasDayMismatch || preview.issues.length > 0;
  const visibleExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    return [...draft.customExercises, ...exercises]
      .filter((exercise) => exercise.muscleGroup === exerciseMuscle)
      .filter((exercise) => !query || `${exercise.name} ${exercise.pattern}`.toLowerCase().includes(query))
      .filter((exercise, index, list) => list.findIndex((candidate) => candidate.name.toLowerCase() === exercise.name.toLowerCase()) === index)
      .slice(0, 24);
  }, [draft.customExercises, exerciseMuscle, exerciseSearch, exercises]);

  const toggleDay = (day: BuilderWeekday) => {
    setDraft((current) => ({
      ...current,
      availableTrainingDays: current.availableTrainingDays.includes(day)
        ? current.availableTrainingDays.filter((item) => item !== day)
        : weekdays.map((item) => item.value).filter((item) => [...current.availableTrainingDays, day].includes(item)),
    }));
  };

  const setPreference = (name: string, preference: "favorite" | "restricted") => {
    setDraft((current) => {
      const targetKey = preference === "favorite" ? "favoriteExercises" : "restrictedExercises";
      const otherKey = preference === "favorite" ? "restrictedExercises" : "favoriteExercises";
      const exists = current[targetKey].includes(name);
      return {
        ...current,
        [targetKey]: exists ? current[targetKey].filter((item) => item !== name) : unique([...current[targetKey], name]),
        [otherKey]: current[otherKey].filter((item) => item !== name),
      };
    });
  };

  const addCustomExercise = () => {
    const name = customName.trim();
    if (!name) return;
    const normalizedName = name.toLowerCase();
    setDraft((current) => {
      const existing = current.customExercises.find((item) => item.name.toLowerCase() === normalizedName);
      const savedName = existing?.name ?? name;
      return {
        ...current,
        customExercises: existing
          ? current.customExercises.map((item) =>
              item.name.toLowerCase() === normalizedName
                ? withBuilderEquipmentProfile(item, current.equipment)
                : item
            )
          : [
              ...current.customExercises,
              {
                name,
                muscleGroup: exerciseMuscle,
                pattern: customPattern.trim() || "Custom movement",
                custom: true,
                equipment: [current.equipment],
              },
            ],
        favoriteExercises: unique([...current.favoriteExercises, savedName]),
        restrictedExercises: current.restrictedExercises.filter(
          (item) => item.toLowerCase() !== normalizedName
        ),
      };
    });
    setCustomName("");
    setCustomPattern("");
  };

  return (
    <section className="rounded-[28px] border border-rose-200 bg-white/90 p-4 shadow-xl dark:border-rose-400/20 dark:bg-slate-950/94 sm:p-5" aria-labelledby="meso-builder-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="secondary">New mesocycle</Badge>
          <h2 id="meso-builder-title" className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            Build the next training block
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Changes stay in this draft until the final review.
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close mesocycle builder" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-1" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`min-h-11 rounded-xl px-1 text-[10px] font-semibold sm:text-xs ${
              index === step
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                : index < step
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400"
            }`}
          >
            <span className="block">{index < step ? "✓" : index + 1}</span>
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>
      <Progress className="mt-2 h-1.5" value={((step + 1) / steps.length) * 100} />

      <div className="mt-5 min-h-[360px]">
        {step === 0 ? (
          <div className="grid gap-5">
            <div>
              <label htmlFor="builder-frequency" className="text-sm font-semibold text-slate-950 dark:text-white">
                Training frequency · {draft.sessionsPerWeek} days/week
              </label>
              <input
                id="builder-frequency"
                className="mt-3 w-full accent-rose-500"
                type="range"
                min={3}
                max={6}
                step={1}
                value={draft.sessionsPerWeek}
                onChange={(event) => setDraft((current) => ({ ...current, sessionsPerWeek: Number(event.target.value) }))}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-950 dark:text-white">Available training days</div>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {weekdays.map((day) => {
                  const selected = draft.availableTrainingDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleDay(day.value)}
                      className={`min-h-11 rounded-[14px] border text-sm font-semibold ${
                        selected
                          ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100"
                          : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {hasDayMismatch ? (
                <p role="alert" className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  Choose exactly {draft.sessionsPerWeek} training days so the schedule is unambiguous.
                </p>
              ) : null}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              Session duration
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={20}
                  max={150}
                  value={draft.sessionMinutes}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, sessionMinutes: Math.min(150, Math.max(20, Number(event.target.value) || 20)) }))
                  }
                />
                <span className="text-sm font-normal text-slate-500">minutes</span>
              </div>
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950 dark:text-white">Available equipment</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Used to prioritize workable exercise choices.</p>
            </div>
            {([
              ["full-gym", "Full gym", "Barbells, machines, cables, and dumbbells"],
              ["home-gym", "Home gym", "Bodyweight and common home equipment"],
              ["dumbbells", "Dumbbells", "Dumbbell-first exercise selection"],
            ] as const).map(([value, label, detail]) => (
              <button
                key={value}
                type="button"
                aria-pressed={draft.equipment === value}
                onClick={() => setDraft((current) => ({ ...current, equipment: value }))}
                className={`min-h-[72px] rounded-[18px] border p-3 text-left ${
                  draft.equipment === value
                    ? "border-rose-300 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-400/10"
                    : "border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <div className="font-semibold text-slate-950 dark:text-white">{label}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</div>
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950 dark:text-white">Muscle priorities</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Maintenance and temporary exclusions are explicit, not hidden in generation.</p>
            </div>
            {(Object.keys(muscleLabels) as BuilderMuscleGroup[]).map((muscle) => (
              <label key={muscle} className="grid gap-2 rounded-[18px] border border-slate-200 p-3 dark:border-white/10 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                <span className="font-semibold text-slate-950 dark:text-white">{muscleLabels[muscle]}</span>
                <select
                  className="min-h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900"
                  value={draft.musclePriorities[muscle]}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      musclePriorities: { ...current.musclePriorities, [muscle]: event.target.value as BuilderMusclePriority },
                    }))
                  }
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label} — {priority.detail}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
              <select
                aria-label="Exercise muscle filter"
                className="min-h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900"
                value={exerciseMuscle}
                onChange={(event) => setExerciseMuscle(event.target.value as BuilderMuscleGroup)}
              >
                {(Object.keys(muscleLabels) as BuilderMuscleGroup[]).map((muscle) => (
                  <option key={muscle} value={muscle}>{muscleLabels[muscle]}</option>
                ))}
              </select>
              <Input
                aria-label="Search exercise preferences"
                placeholder="Search exercises"
                value={exerciseSearch}
                onChange={(event) => setExerciseSearch(event.target.value)}
              />
            </div>
            <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1">
              {visibleExercises.map((exercise) => {
                const favorite = draft.favoriteExercises.includes(exercise.name);
                const restricted = draft.restrictedExercises.includes(exercise.name);
                return (
                  <div key={exercise.name} className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{exercise.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{exercise.pattern}{exercise.custom ? " · Custom" : ""}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant={favorite ? "secondary" : "ghost"} size="icon" aria-label={`${favorite ? "Remove" : "Add"} ${exercise.name} as favorite`} onClick={() => setPreference(exercise.name, "favorite")}>
                        <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant={restricted ? "secondary" : "ghost"} size="icon" aria-label={`${restricted ? "Allow" : "Restrict"} ${exercise.name}`} onClick={() => setPreference(exercise.name, "restricted")}>
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-2 rounded-[18px] border border-dashed border-slate-300 p-3 dark:border-white/15 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input placeholder="Custom exercise name" value={customName} onChange={(event) => setCustomName(event.target.value)} />
              <Input placeholder="Movement pattern" value={customPattern} onChange={(event) => setCustomPattern(event.target.value)} />
              <Button variant="outline" className="gap-2" disabled={!customName.trim()} onClick={addCustomExercise}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              Mesocycle length · {draft.mesoLengthWeeks} weeks
              <input
                className="w-full accent-rose-500"
                type="range"
                min={3}
                max={8}
                value={draft.mesoLengthWeeks}
                onChange={(event) => setDraft((current) => ({ ...current, mesoLengthWeeks: Number(event.target.value) }))}
              />
              <span className="text-xs font-normal text-slate-500">Final week is presented as the deload.</span>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              Starting date
              <Input type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              Smallest load increase
              <div className="flex items-center gap-3">
                <Input type="number" min={1} max={25} value={draft.weightIncrement} onChange={(event) => setDraft((current) => ({ ...current, weightIncrement: Math.min(25, Math.max(1, Number(event.target.value) || 1)) }))} />
                <span className="text-sm font-normal text-slate-500">lb</span>
              </div>
            </label>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4">
            <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100">
                <Sparkles className="h-4 w-4" /> {preview.name}
              </div>
              <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-100/75">
                {draft.sessionsPerWeek} sessions · {draft.sessionMinutes} min target · {draft.mesoLengthWeeks} weeks · starts {draft.startDate}
              </p>
            </div>
            <div className="grid gap-2">
              {preview.days.map((day, index) => (
                <div key={day.id} className="grid gap-2 rounded-[18px] border border-slate-200 p-3 dark:border-white/10 sm:grid-cols-[70px_minmax(0,1fr)_auto] sm:items-center">
                  <Badge variant="outline">{weekdays.find((item) => item.value === draft.availableTrainingDays[index])?.label ?? `Day ${index + 1}`}</Badge>
                  <div>
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">{day.focus}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{day.muscles}</div>
                    {day.exercises.length > 0 ? (
                      <div className="mt-2 grid gap-1.5">
                        {day.exercises.map((exercise) => (
                          <label key={exercise.slotId} className="grid gap-1 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                            {muscleLabels[exercise.muscleGroup]} exercise
                            <select
                              aria-label={`Replace ${exercise.name}`}
                              className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-2 text-xs font-semibold normal-case text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                              value={exercise.unavailableSelection ?? exercise.name}
                              onChange={(event) => {
                                const replacementKey = `${day.id}:${exercise.slotId}`;
                                setDraft((current) => ({
                                  ...current,
                                  exerciseReplacements: {
                                    ...current.exerciseReplacements,
                                    [replacementKey]: event.target.value,
                                  },
                                }));
                              }}
                            >
                              {exercise.unavailableSelection ? (
                                <option value={exercise.unavailableSelection} disabled>
                                  {exercise.unavailableSelection} (unavailable)
                                </option>
                              ) : null}
                              {exercise.replacementOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">No exercises selected</div>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">{day.exerciseCount} lifts · ~{day.estimatedMinutes} min</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Week 1 adjusted working sets</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.weeklySets.map((item) => <Badge key={item.muscle} variant="outline">{item.muscle} · {item.sets}</Badge>)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Muscle frequency</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.muscleFrequency.map((item) => (
                  <Badge key={item.muscle} variant="outline">
                    {item.muscle} · {item.sessions}x/week
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Loading weeks</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.loadingWeeks.map((week) => (
                  <Badge key={week.week} variant="outline">
                    Week {week.week} · {week.deload ? "Deload" : `${week.targetRir} RIR`}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                The final week is a deload at {preview.loadingWeeks[preview.loadingWeeks.length - 1]?.targetRir ?? 4} RIR.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <div>{draft.favoriteExercises.length} preferred exercises</div>
              <div>{draft.restrictedExercises.length} restricted exercises</div>
              <div>{Object.values(draft.musclePriorities).filter((value) => value === "maintain" || value === "minimum").length} maintenance priorities</div>
              <div>{Object.values(draft.musclePriorities).filter((value) => value === "exclude").length} temporarily excluded muscles</div>
            </div>
            {preview.issues.length > 0 ? (
              <div role="alert" className="rounded-[18px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                <div className="font-semibold">Resolve before saving</div>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {preview.issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
        <Button variant="outline" className="gap-2" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button className="gap-2" disabled={step === 0 && hasDayMismatch} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2" disabled={hasBlockingIssues} onClick={() => onApply(draft)}>
            <CheckCircle2 className="h-4 w-4" /> Start mesocycle
          </Button>
        )}
      </div>
    </section>
  );
}
