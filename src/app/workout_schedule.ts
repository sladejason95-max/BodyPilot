/** Calendar dates deliberately stay YYYY-MM-DD: moving a workout never changes its identity. */
export type WorkoutDateOverrides = Record<string, string>;
export type WorkoutOccurrence = Readonly<{
  sessionKey: string;
  mesocycleId: string;
  weekNumber: number;
  dayId: string;
  plannedDate: string | null;
  scheduledDate: string | null;
  moved: boolean;
  position: number;
}>;

export type ScheduleSession = Readonly<{
  sessionKey: string;
  mesocycleId: string;
  weekNumber: number;
  dayId: string;
  status: "active" | "paused" | "completed";
  startedAt?: string;
}>;

const reservedKeys = new Set(["__proto__", "prototype", "constructor"]);
const validIdentity = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim() &&
  !/[:\s]/.test(value) && !reservedKeys.has(value);

export const isWorkoutDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 &&
    day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
};

const validWeek = (value: number) => Number.isInteger(value) && value >= 1 && value <= 52;
const validOccurrenceKey = (value: string) => {
  const parts = value.split(":");
  return parts.length === 3 && validIdentity(parts[0]) && validIdentity(parts[2]) &&
    /^[1-9]\d*$/.test(parts[1]) && validWeek(Number(parts[1]));
};

/** Reject malformed imported dates rather than silently rolling Feb 30 into March. */
export const normalizeWorkoutDateOverrides = (value: unknown): WorkoutDateOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, date]) =>
    validOccurrenceKey(key) && isWorkoutDate(date)
  )) as WorkoutDateOverrides;
};

export const addWorkoutCalendarDays = (date: string, days: number): string | null => {
  if (!isWorkoutDate(date) || !Number.isInteger(days)) return null;
  const result = new Date(`${date}T12:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  if (!Number.isFinite(result.getTime())) return null;
  const key = result.toISOString().slice(0, 10);
  return isWorkoutDate(key) ? key : null;
};

/** Training weeks are seven-day windows beginning on the selected local start date. */
export const workoutWeekStartDate = (mesocycleStartDate: string, weekNumber: number): string | null => {
  if (!isWorkoutDate(mesocycleStartDate) || !validWeek(weekNumber)) return null;
  return addWorkoutCalendarDays(mesocycleStartDate, (weekNumber - 1) * 7);
};

const weekdayIndex = (value: string) => {
  const name = value.trim().toLowerCase();
  return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    .findIndex(day => name === day || name === day.slice(0, 3));
};

/** Unknown weekday labels remain undated; they are never assigned a guessed date. */
export const buildWorkoutOccurrences = (input: {
  mesocycleId: string;
  weekNumber: number;
  days: readonly { id: string; day: string }[];
  weekStartDate: string | null;
  dateOverrides?: Readonly<WorkoutDateOverrides>;
}): WorkoutOccurrence[] => {
  if (!validIdentity(input.mesocycleId) || !validWeek(input.weekNumber)) return [];
  const weekStart = input.weekStartDate && isWorkoutDate(input.weekStartDate) ? input.weekStartDate : null;
  const startWeekday = weekStart ? (new Date(`${weekStart}T12:00:00.000Z`).getUTCDay() + 6) % 7 : 0;
  const seen = new Set<string>();
  return input.days.flatMap((day, position) => {
    if (!validIdentity(day.id) || seen.has(day.id)) return [];
    seen.add(day.id);
    const sessionKey = `${input.mesocycleId}:${input.weekNumber}:${day.id}`;
    const weekday = weekdayIndex(day.day);
    // The first matching weekday is on/after the anchor, never before the program began.
    const offset = weekday >= 0 ? (weekday - startWeekday + 7) % 7 : -1;
    const plannedDate = weekStart && offset >= 0 ? addWorkoutCalendarDays(weekStart, offset) : null;
    const override = input.dateOverrides?.[sessionKey];
    const scheduledDate = isWorkoutDate(override) ? override : plannedDate;
    return [{ sessionKey, mesocycleId: input.mesocycleId, weekNumber: input.weekNumber, dayId: day.id,
      plannedDate, scheduledDate, moved: scheduledDate !== plannedDate, position }];
  });
};

type ResolutionState = {
  completedSessionKeys?: ReadonlySet<string>;
  skippedWorkouts?: Readonly<Record<string, boolean>>;
  openSessionKeys?: ReadonlySet<string>;
};

export type WorkoutMoveUndo = Readonly<{
  sessionKey: string;
  previousOverride: string | null;
  appliedOverride: string | null;
}>;

export type WorkoutMoveResult = {
  dateOverrides: Readonly<WorkoutDateOverrides>;
  undo: WorkoutMoveUndo | null;
  changed: boolean;
  reason: "moved" | "unchanged" | "invalid-date" | "invalid-occurrence" | "resolved" | "open" | "conflict";
};

const blockedReason = (sessionKey: string, state: ResolutionState): "resolved" | null =>
  state.completedSessionKeys?.has(sessionKey) || state.skippedWorkouts?.[sessionKey] ? "resolved" : null;

/** Only this occurrence moves, even while paused. Its open session and frozen targets stay intact. */
export const moveWorkoutOccurrence = (input: ResolutionState & {
  occurrence: WorkoutOccurrence;
  dateOverrides: Readonly<WorkoutDateOverrides>;
  targetDate: string;
}): WorkoutMoveResult => {
  const { occurrence, dateOverrides, targetDate } = input;
  const result = (reason: WorkoutMoveResult["reason"]): WorkoutMoveResult =>
    ({ dateOverrides, undo: null, changed: false, reason });
  if (!isWorkoutDate(targetDate)) return result("invalid-date");
  if (!validOccurrenceKey(occurrence.sessionKey) ||
    occurrence.sessionKey !== `${occurrence.mesocycleId}:${occurrence.weekNumber}:${occurrence.dayId}`) return result("invalid-occurrence");
  const blocked = blockedReason(occurrence.sessionKey, input);
  if (blocked) return result(blocked);
  const previousOverride = dateOverrides[occurrence.sessionKey] ?? null;
  const appliedOverride = targetDate === occurrence.plannedDate ? null : targetDate;
  if (previousOverride === appliedOverride) return result("unchanged");
  const next = { ...dateOverrides };
  if (appliedOverride === null) delete next[occurrence.sessionKey];
  else next[occurrence.sessionKey] = appliedOverride;
  return { dateOverrides: next, changed: true, reason: "moved",
    undo: { sessionKey: occurrence.sessionKey, previousOverride, appliedOverride } };
};

/** Compare-and-restore: Undo cannot overwrite a later move or alter a resolved workout. */
export const undoWorkoutOccurrenceMove = (input: ResolutionState & {
  dateOverrides: Readonly<WorkoutDateOverrides>;
  undo: WorkoutMoveUndo;
}): WorkoutMoveResult => {
  const { dateOverrides, undo } = input;
  const unchanged = (reason: WorkoutMoveResult["reason"]): WorkoutMoveResult =>
    ({ dateOverrides, undo: null, changed: false, reason });
  if (!validOccurrenceKey(undo.sessionKey)) return unchanged("invalid-occurrence");
  if ((undo.previousOverride !== null && !isWorkoutDate(undo.previousOverride)) ||
    (undo.appliedOverride !== null && !isWorkoutDate(undo.appliedOverride))) return unchanged("invalid-date");
  const blocked = blockedReason(undo.sessionKey, input);
  if (blocked) return unchanged(blocked);
  if ((dateOverrides[undo.sessionKey] ?? null) !== undo.appliedOverride) return unchanged("conflict");
  if (undo.previousOverride === undo.appliedOverride) return unchanged("unchanged");
  const next = { ...dateOverrides };
  if (undo.previousOverride === null) delete next[undo.sessionKey];
  else next[undo.sessionKey] = undo.previousOverride;
  return { dateOverrides: next, undo: null, changed: true, reason: "moved" };
};

export type NextWorkoutSelection<Session extends ScheduleSession = ScheduleSession> =
  | { kind: "resume"; session: Session; occurrence: WorkoutOccurrence | null }
  | { kind: "planned"; session: null; occurrence: WorkoutOccurrence; timing: "overdue" | "today" | "upcoming" | "unscheduled" }
  | { kind: "complete"; session: null; occurrence: null };

/** Active work wins over navigation, dates, and skip flags. Otherwise offer the earliest unfinished date. */
export const selectNextWorkoutOccurrence = <Session extends ScheduleSession>(input: {
  mesocycleId: string;
  occurrences: readonly WorkoutOccurrence[];
  sessions: readonly Session[];
  completedSessionKeys?: ReadonlySet<string>;
  skippedWorkouts?: Readonly<Record<string, boolean>>;
  today: string;
  /** An explicit selection, not a stale automatic last-workout pointer. Open sessions still win. */
  preferredDayId?: string | null;
}): NextWorkoutSelection<Session> => {
  const sessions = input.sessions.filter(session => session.mesocycleId === input.mesocycleId);
  const open = sessions.filter(session => session.status === "active" || session.status === "paused")
    .sort((a, b) => Number(a.status === "paused") - Number(b.status === "paused") ||
      (a.startedAt ?? "").localeCompare(b.startedAt ?? "") || a.sessionKey.localeCompare(b.sessionKey))[0];
  if (open) return { kind: "resume", session: open,
    occurrence: input.occurrences.find(item => item.sessionKey === open.sessionKey) ?? null };
  const completed = new Set([...(input.completedSessionKeys ?? []),
    ...sessions.filter(session => session.status === "completed").map(session => session.sessionKey)]);
  const unfinished = input.occurrences.filter(item => item.mesocycleId === input.mesocycleId &&
    !completed.has(item.sessionKey) && !input.skippedWorkouts?.[item.sessionKey])
    .sort((a, b) => (a.scheduledDate ?? "9999-99-99").localeCompare(b.scheduledDate ?? "9999-99-99") ||
      a.weekNumber - b.weekNumber || a.position - b.position || a.sessionKey.localeCompare(b.sessionKey));
  const occurrence = unfinished.find(item => item.dayId === input.preferredDayId) ?? unfinished[0];
  if (!occurrence) return { kind: "complete", session: null, occurrence: null };
  const timing = !occurrence.scheduledDate || !isWorkoutDate(input.today) ? "unscheduled" :
    occurrence.scheduledDate < input.today ? "overdue" : occurrence.scheduledDate === input.today ? "today" : "upcoming";
  return { kind: "planned", session: null, occurrence, timing };
};

export const normalizeCompletedMesocycleIds = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter(validIdentity))] : [];

/** A completion credit is permanent per mesocycle, even if the final skipped day is reopened. */
export const creditMesocycleCompletion = (input: {
  mesocycleId: string;
  completedMesoIds: readonly string[];
  completedMesoCount: number;
  complete: boolean;
}): { completedMesoIds: string[]; completedMesoCount: number; credited: boolean } => {
  const completedMesoIds = normalizeCompletedMesocycleIds(input.completedMesoIds);
  const completedMesoCount = Math.max(completedMesoIds.length,
    Number.isFinite(input.completedMesoCount) ? Math.max(0, Math.floor(input.completedMesoCount)) : 0);
  if (!input.complete || !validIdentity(input.mesocycleId) || completedMesoIds.includes(input.mesocycleId)) {
    return { completedMesoIds, completedMesoCount, credited: false };
  }
  return { completedMesoIds: [...completedMesoIds, input.mesocycleId], completedMesoCount: completedMesoCount + 1, credited: true };
};
