import React from "react";
import { Plus } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import type { ExerciseLibraryItem } from "../../lib/data/exerciseLibrary";
import type { ExerciseScientificProfile } from "../performance_libraries";
import type { WorkoutDay } from "../types";
import {
  AnalyticsStat,
  EmptyStatePanel,
  SectionCard,
  WorkspaceSummaryRail,
} from "../workspace_ui";

type UserMode = "athlete" | "coach";

type SummaryItem = {
  label: string;
  title: string;
  detail: string;
};

type LibraryPrimaryAction = {
  title: string;
  body: string;
  cta: string;
};

type LibraryTargetDaySummary = {
  title: string;
  body: string;
};

type LibraryTabProps = {
  userMode: UserMode;
  libraryFocusCards: SummaryItem[];
  libraryPrimaryAction: LibraryPrimaryAction;
  libraryTargetDaySummary: LibraryTargetDaySummary;
  goToTab: (tab: string) => void;
  openTrackerSurface: (surface: "dashboard" | "log" | "insights" | "week") => void;
  filteredExerciseLibrary: ExerciseLibraryItem[];
  libraryRecommendedExercises: ExerciseLibraryItem[];
  exerciseProfiles: Record<string, ExerciseScientificProfile>;
  libraryRiskFlags: string[];
  metricsTone: (value: number) => string;
  librarySearch: string;
  setLibrarySearch: (value: string) => void;
  libraryCategory: string;
  setLibraryCategory: (value: string) => void;
  libraryCategoryOptions: string[];
  libraryMuscle: string;
  setLibraryMuscle: (value: string) => void;
  libraryMuscleOptions: string[];
  libraryPosition: string;
  setLibraryPosition: (value: string) => void;
  libraryPositionOptions: string[];
  libraryTargetDayId: string;
  setLibraryTargetDayId: (value: string) => void;
  workoutSplit: WorkoutDay[];
  libraryTargetDay?: WorkoutDay;
  addExerciseFromLibraryToDay: (exerciseId: string) => void;
  getExerciseSubstitutions: (exercise: ExerciseLibraryItem) => ExerciseLibraryItem[];
};

export default function LibraryTab(props: LibraryTabProps) {
  const {
    userMode,
    libraryFocusCards,
    libraryPrimaryAction,
    libraryTargetDaySummary,
    goToTab,
    openTrackerSurface,
    filteredExerciseLibrary,
    libraryRecommendedExercises,
    exerciseProfiles,
    libraryRiskFlags,
    metricsTone,
    librarySearch,
    setLibrarySearch,
    libraryCategory,
    setLibraryCategory,
    libraryCategoryOptions,
    libraryMuscle,
    setLibraryMuscle,
    libraryMuscleOptions,
    libraryPosition,
    setLibraryPosition,
    libraryPositionOptions,
    libraryTargetDayId,
    setLibraryTargetDayId,
    workoutSplit,
    libraryTargetDay,
    addExerciseFromLibraryToDay,
    getExerciseSubstitutions,
  } = props;
  const [libraryActionMessage, setLibraryActionMessage] = React.useState("");
  const primaryExerciseCandidate = libraryRecommendedExercises[0] ?? filteredExerciseLibrary[0] ?? null;
  const libraryActionIsWarning =
    libraryActionMessage.startsWith("Pick") ||
    libraryActionMessage.startsWith("This is") ||
    libraryActionMessage.startsWith("No clean");

  const handleLibraryPrimaryAction = () => {
    if (!libraryTargetDay) {
      setLibraryActionMessage("Pick a target split day before adding an exercise.");
      goToTab("split");
      return;
    }

    if (libraryTargetDay.focus.toLowerCase() === "rest") {
      setLibraryActionMessage("This is a rest day. Pick a training day before adding an exercise.");
      goToTab("split");
      return;
    }

    if (!primaryExerciseCandidate) {
      setLibraryActionMessage("No clean match is available for the current filters.");
      return;
    }

    addExerciseFromLibraryToDay(primaryExerciseCandidate.id);
    setLibraryActionMessage(`Added ${primaryExerciseCandidate.name} to ${libraryTargetDay.day}.`);
  };

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <WorkspaceSummaryRail
        title="Exercise browser"
        description={
          userMode === "coach"
            ? "Use this deeper reference when the Training panel needs a cleaner slot solve."
            : "Use this deeper browser only when Training needs a cleaner substitution."
        }
        items={libraryFocusCards}
      />

      {userMode === "athlete" ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
          <div className="font-semibold">Exercise reference</div>
          <p className="mt-1">
            This browser is for deliberate substitutions after Training has already shown the target slot. Return to Training once the useful add is clear.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="Browser controls" description={userMode === "coach" ? "Pick the day first, then use the browser only to solve a specific slot." : "Pick the session first, then return to Training once the useful add is clear."}>
          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Browser intent" : "Substitution cue"}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{libraryPrimaryAction.title}</div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{libraryPrimaryAction.body}</p>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button onClick={() => goToTab("split")}>Back to Training</Button>
                <Button variant="outline" onClick={() => openTrackerSurface("log")}>Today log</Button>
                <Button variant="outline" onClick={handleLibraryPrimaryAction}>{libraryPrimaryAction.cta}</Button>
              </div>
              {libraryActionMessage ? (
                <div
                  className={
                    libraryActionIsWarning
                      ? "rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100"
                      : "rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100"
                  }
                >
                  {libraryActionMessage}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Target day" : "Current session target"}</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{libraryTargetDaySummary.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{libraryTargetDaySummary.body}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Selection rule</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Stay inside the selected day. Use the recommended adds first, then open the wider reference only if you still need a cleaner match.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AnalyticsStat label="Results" value={filteredExerciseLibrary.length} helper="Current filter set" tone={metricsTone(6)} />
                <AnalyticsStat label="Recommended" value={libraryRecommendedExercises.length} helper="Fast-add candidates" tone={metricsTone(6)} />
                <AnalyticsStat label="Target exercises" value={libraryTargetDay?.exercises.length ?? 0} helper="Current day size" tone={metricsTone(6)} />
                <AnalyticsStat label="Systemic" value={libraryTargetDay?.systemicLoad ?? 0} helper="Target day pressure" tone={metricsTone(Number(libraryTargetDay?.systemicLoad ?? 0))} />
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Selection risks</div>
                <div className="mt-3 space-y-2">
                  {libraryRiskFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">No major selection risks right now.</div>
                  ) : (
                    libraryRiskFlags.map((flag, index) => (
                      <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">{flag}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Filters" description={userMode === "coach" ? "Keep filtering attached to a selected day so browsing does not become a separate workflow." : "Narrow the list only after the target session is clear."}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Search</Label>
              <Input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search exercises" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100" value={libraryCategory} onChange={(event) => setLibraryCategory(event.target.value)}>
                {libraryCategoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Muscle</Label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100" value={libraryMuscle} onChange={(event) => setLibraryMuscle(event.target.value)}>
                {libraryMuscleOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100" value={libraryPosition} onChange={(event) => setLibraryPosition(event.target.value)}>
                {libraryPositionOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Target split day</Label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100" value={libraryTargetDayId} onChange={(event) => setLibraryTargetDayId(event.target.value)}>
                {workoutSplit.map((day) => (
                  <option key={day.id} value={day.id}>{day.day} - {day.focus}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Current target</div>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {libraryTargetDay ? `${libraryTargetDay.day}, ${libraryTargetDay.focus}, ${libraryTargetDay.exercises.length} exercises loaded.` : "Pick a day before adding exercises."}
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Fast matches" description={userMode === "coach" ? "Use these candidates before opening the wider reference set." : "Try these before browsing the whole library."}>
          <div className="grid gap-3">
            {libraryRecommendedExercises.length === 0 ? (
              <EmptyStatePanel
                title="No recommended substitutions yet"
                detail="Nothing useful surfaced for the current target day. Broaden the filters or open the full browser only if the slot still needs a clean solve."
              />
            ) : (
              libraryRecommendedExercises.map((exercise) => (
                <div key={exercise.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  {(() => {
                    const profile = exerciseProfiles[exercise.id];
                    return (
                      <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{exercise.name}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {exercise.category}, {profile?.movementPatternLabel ?? "Movement pattern pending"}
                      </div>
                    </div>
                    <Badge variant="outline">{profile?.recoveryDemand ?? "moderate"} recovery</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile ? <Badge variant="outline">{profile.position}</Badge> : null}
                    {(exercise.muscleBias ?? []).slice(0, 3).map((bias, index) => (
                      <Badge key={`${exercise.id}-${index}`} variant="outline">{bias.muscle} {bias.contribution}%</Badge>
                    ))}
                  </div>
                  {profile ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                      {profile.explanation}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => addExerciseFromLibraryToDay(exercise.id)}><Plus className="mr-2 h-4 w-4" />Add to {libraryTargetDay?.day ?? "day"}</Button>
                    {getExerciseSubstitutions(exercise).slice(0, 2).map((option) => (
                      <Button key={option.id} size="sm" variant="outline" onClick={() => addExerciseFromLibraryToDay(option.id)}>{option.name}</Button>
                    ))}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Full reference" description={userMode === "coach" ? "Fallback browser for edge cases, not the default programming path." : "Browse only if the fast substitution options are not enough."}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{filteredExerciseLibrary.length} results</Badge>
              <div className="text-sm text-slate-500">Target: {libraryTargetDay?.focus ?? "None"}</div>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {filteredExerciseLibrary.map((exercise) => {
                const profile = exerciseProfiles[exercise.id];
                const ratio = Number((Number(exercise.stimulus ?? 0) / Math.max(Number(exercise.fatigue ?? 1), 1)).toFixed(2));
                return (
                  <div key={exercise.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{exercise.category}, {profile?.movementPatternLabel ?? "Movement pattern pending"}</div>
                      </div>
                      <Badge variant="outline">S:F {ratio}</Badge>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Stimulus</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{exercise.stimulus ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fatigue</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{exercise.fatigue ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Recovery</span>
                        <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{profile?.recoveryDemand ?? "moderate"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Position</span>
                        <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{profile?.position ?? "bridge"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 bg-white hover:bg-slate-50" onClick={() => addExerciseFromLibraryToDay(exercise.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to current target
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {(exercise.muscleBias ?? []).slice(0, 3).map((bias, index) => (
                        <div key={`${exercise.id}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                          <span>{bias.muscle}</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{bias.contribution}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Scientific read</div>
                      {profile ? (
                        <div className="mt-2 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                          <div>{profile.explanation}</div>
                          <div className="grid gap-2">
                            {profile.coachingUseCases.slice(0, 2).map((item) => (
                              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">{item}</div>
                            ))}
                          </div>
                          {profile.limitationConsiderations.length > 0 ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">
                              {profile.limitationConsiderations[0]}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Scientific profile still building for this exercise.</span>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Good substitutions</div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {getExerciseSubstitutions(exercise).length > 0 ? (
                          getExerciseSubstitutions(exercise).map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => addExerciseFromLibraryToDay(option.id)}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                            >
                              {option.name}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">No close substitutes surfaced yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>

    </div>
  );
}
