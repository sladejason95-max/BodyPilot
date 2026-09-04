export type SplitMusclePriority = "specialize" | "emphasize" | "grow" | "maintain" | "minimum" | "exclude";

export type SplitConstraintLift = { id: string; muscleGroup: string; sets: number };
export type SplitConstraintDay = { id: string; lifts: readonly SplitConstraintLift[] };
const MAX_PRIORITY_MUSCLES = 8;

export type SplitConstraintConflict = {
  code: "invalid-budget" | "invalid-estimate" | "over-budget" | "empty-day" | "optimization-limit";
  dayId?: string;
  liftId?: string;
  reason: string;
};

/** The same planning estimate as the workout builder; this is not measured elapsed time. */
export const estimatedSplitSessionMinutes = (effectiveSets: readonly number[]): number =>
  effectiveSets.length === 0
    ? 0
    : Math.max(15, Math.round(8 + effectiveSets.length * 3 + effectiveSets.reduce((sum, sets) => sum + Math.max(1, sets), 0) * 1.5));

/**
 * Choose from already eligible exercises only. Reserve at least one direct
 * exercise for each requested specialize/emphasize muscle across the week,
 * then use remaining time in original list order. This is a coverage safeguard,
 * not a claim that one exercise meets a muscle's full weekly volume target.
 *
 * Effective set counts affect estimates only: returned lifts retain their
 * original identities and set counts so downstream adjustments run once.
 */
export const constrainSplitDuration = <TDay extends SplitConstraintDay>({
  days,
  sessionMinutes,
  musclePriorities,
  effectiveSetCount = (lift) => lift.sets,
}: {
  days: readonly TDay[];
  sessionMinutes: number;
  musclePriorities: Readonly<Record<string, SplitMusclePriority | undefined>>;
  effectiveSetCount?: (lift: TDay["lifts"][number], day: TDay) => number;
}) => {
  type Lift = TDay["lifts"][number];
  type Candidate = { lift: Lift; index: number; sets: number; bit: number };
  type Reservation = { mask: number; indices: number[]; minutes: number };
  const conflicts: SplitConstraintConflict[] = [];
  const validBudget = Number.isFinite(sessionMinutes) && sessionMinutes > 0;
  if (!validBudget) conflicts.push({ code: "invalid-budget", reason: "Choose a finite, positive session time before using this split." });
  const requested = Object.entries(musclePriorities)
    .filter((entry): entry is [string, "specialize" | "emphasize"] => entry[1] === "specialize" || entry[1] === "emphasize")
    .sort(([left, leftPriority], [right, rightPriority]) =>
      (leftPriority === rightPriority ? 0 : leftPriority === "specialize" ? -1 : 1) || (left < right ? -1 : left > right ? 1 : 0));
  // The app currently has eight muscle groups. Bound exact optimization for
  // unexpected/imported inputs rather than silently claiming an optimal plan.
  const boundedGroups = requested.length <= MAX_PRIORITY_MUSCLES;
  if (!boundedGroups) conflicts.push({ code: "optimization-limit", reason: "This draft has too many priority muscles to verify its time constraints. Reduce the priorities and preview again." });
  const priorityBits = new Map(requested.slice(0, MAX_PRIORITY_MUSCLES).map(([muscle], index) => [muscle, 1 << index]));
  const omissions: Array<{ dayId: string; lift: Lift; reason: "excluded" | "invalid-estimate" | "duration"; detail: string }> = [];
  const candidates = days.map((day) => day.lifts.flatMap((lift: Lift, index): Candidate[] => {
    if (musclePriorities[lift.muscleGroup] === "exclude") {
      omissions.push({ dayId: day.id, lift, reason: "excluded", detail: "Excluded by your muscle priorities." });
      return [];
    }
    const sets = effectiveSetCount(lift, day);
    if (!Number.isFinite(sets) || sets <= 0) {
      omissions.push({ dayId: day.id, lift, reason: "invalid-estimate", detail: "The effective set count is invalid; its duration cannot be verified." });
      conflicts.push({ code: "invalid-estimate", dayId: day.id, liftId: lift.id, reason: "An exercise has an invalid effective set count." });
      return [];
    }
    return [{ lift, index, sets, bit: priorityBits.get(lift.muscleGroup) ?? 0 }];
  }));
  const minutesFor = (dayIndex: number, indices: readonly number[]) =>
    estimatedSplitSessionMinutes(candidates[dayIndex].filter((candidate) => indices.includes(candidate.index)).map((candidate) => candidate.sets));
  const compareIndices = (left: readonly number[], right: readonly number[]) => {
    for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return left.length - right.length;
  };
  const choices = candidates.map((eligible, dayIndex) => {
    const priorityCandidates = eligible.filter((candidate) => candidate.bit);
    const bestByMask = new Map<number, Reservation>([[0, { mask: 0, indices: [], minutes: 0 }]]);
    if (!validBudget || !boundedGroups) return [...bestByMask.values()];
    if (priorityCandidates.length > 16) {
      conflicts.push({ code: "optimization-limit", dayId: days[dayIndex].id, reason: "This session has too many priority exercises to verify its duration. Simplify the session and preview again." });
      return [...bestByMask.values()];
    }
    const visit = (position: number, mask: number, indices: number[]) => {
      const minutes = minutesFor(dayIndex, indices);
      if (minutes > sessionMinutes) return;
      const existing = bestByMask.get(mask);
      if (!existing || minutes < existing.minutes || (minutes === existing.minutes && compareIndices(indices, existing.indices) < 0)) {
        bestByMask.set(mask, { mask, indices, minutes });
      }
      for (let index = position; index < priorityCandidates.length; index += 1) {
        const candidate = priorityCandidates[index];
        // A second same-muscle exercise is an extra, not additional coverage.
        if (!(mask & candidate.bit)) visit(index + 1, mask | candidate.bit, [...indices, candidate.index]);
      }
    };
    visit(0, 0, []);
    return [...bestByMask.values()];
  });
  type WeeklyReservation = { mask: number; days: number[][]; minutes: number };
  let weekly = new Map<number, WeeklyReservation>([[0, { mask: 0, days: [], minutes: 0 }]]);
  const compareReservations = (left: WeeklyReservation, right: WeeklyReservation) => {
    if (left.minutes !== right.minutes) return left.minutes - right.minutes;
    for (let index = 0; index < left.days.length; index += 1) {
      const comparison = compareIndices(left.days[index], right.days[index]);
      if (comparison) return comparison;
    }
    return 0;
  };
  for (const dayChoices of choices) {
    const next = new Map<number, WeeklyReservation>();
    for (const previous of weekly.values()) for (const choice of dayChoices) {
      const candidate = { mask: previous.mask | choice.mask, days: [...previous.days, choice.indices], minutes: previous.minutes + choice.minutes };
      const current = next.get(candidate.mask);
      if (!current || compareReservations(candidate, current) < 0) next.set(candidate.mask, candidate);
    }
    weekly = next;
  }
  const coverageScore = (mask: number) => requested.reduce((score, [, priority], index) =>
    index < MAX_PRIORITY_MUSCLES && (mask & (1 << index)) ? score + (priority === "specialize" ? MAX_PRIORITY_MUSCLES + 1 : 1) : score, 0);
  const reservation = [...weekly.values()].sort((left, right) =>
    coverageScore(right.mask) - coverageScore(left.mask) || compareReservations(left, right))[0];
  const estimatedMinutesByDay: Array<{ dayId: string; minutes: number }> = [];
  const selectedDays = days.map((day, dayIndex) => {
    const retained = new Set(reservation?.days[dayIndex] ?? []);
    if (validBudget) for (const candidate of candidates[dayIndex]) {
      if (retained.has(candidate.index)) continue;
      if (minutesFor(dayIndex, [...retained, candidate.index]) <= sessionMinutes) retained.add(candidate.index);
    }
    const lifts = candidates[dayIndex].filter((candidate) => retained.has(candidate.index)).map((candidate) => candidate.lift);
    const minutes = minutesFor(dayIndex, [...retained]);
    estimatedMinutesByDay.push({ dayId: day.id, minutes });
    for (const candidate of candidates[dayIndex]) if (!retained.has(candidate.index)) {
      omissions.push({ dayId: day.id, lift: candidate.lift, reason: "duration", detail: "Does not fit after reserving time for weekly priority-muscle coverage." });
      if (validBudget && estimatedSplitSessionMinutes([candidate.sets]) > sessionMinutes) {
        conflicts.push({ code: "over-budget", dayId: day.id, liftId: candidate.lift.id, reason: "This exercise alone exceeds the session time estimate; increase the time or revise its sets." });
      }
    }
    if (!lifts.length) conflicts.push({ code: "empty-day", dayId: day.id, reason: "No eligible exercise fits this session. Revise the constraints before applying the split." });
    return { ...day, lifts } as Omit<TDay, "lifts"> & { lifts: Lift[] };
  });
  const retainedMuscles = new Set(selectedDays.flatMap((day) => day.lifts.map((lift) => lift.muscleGroup)));
  const eligibleMuscles = new Set(candidates.flatMap((day) => day.map((candidate) => candidate.lift.muscleGroup)));
  const unmetPriorities = requested.filter(([muscle]) => !retainedMuscles.has(muscle)).map(([muscleGroup, priority]) => ({
    muscleGroup,
    priority,
    reason: eligibleMuscles.has(muscleGroup) ? "duration" as const : "no-eligible-exercise" as const,
    detail: eligibleMuscles.has(muscleGroup)
      ? "No direct exercise for this priority fits the selected plan. Increase time, change priorities, or choose another split."
      : "The eligible draft has no direct exercise for this priority. Choose another split or revise equipment/exercise restrictions.",
  }));
  return { days: selectedDays, omissions, estimatedMinutesByDay, unmetPriorities, conflicts };
};
