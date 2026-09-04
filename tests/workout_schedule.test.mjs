import assert from "node:assert/strict";
import test from "node:test";
import {
  addWorkoutCalendarDays, buildWorkoutOccurrences, creditMesocycleCompletion, isWorkoutDate,
  moveWorkoutOccurrence, normalizeCompletedMesocycleIds, normalizeWorkoutDateOverrides,
  selectNextWorkoutOccurrence, undoWorkoutOccurrenceMove, workoutWeekStartDate,
} from "../src/app/workout_schedule.ts";

const makeWeek = (overrides = {}, week = 1) => buildWorkoutOccurrences({
  mesocycleId: "meso-a", weekNumber: week, weekStartDate: workoutWeekStartDate("2026-08-31", week),
  days: [{ id: "push", day: "Mon" }, { id: "pull", day: "Wednesday" }, { id: "legs", day: "Fri" }],
  dateOverrides: overrides,
});
const select = (patch = {}) => selectNextWorkoutOccurrence({
  mesocycleId: "meso-a", occurrences: makeWeek(), sessions: [], today: "2026-09-03", ...patch,
});
const session = (dayId, status = "active", weekNumber = 1) => ({
  sessionKey: `meso-a:${weekNumber}:${dayId}`, mesocycleId: "meso-a", weekNumber, dayId, status,
  startedAt: "2026-09-02T12:00:00.000Z",
});

test("dates are strict calendar dates, including leap years and century boundaries", () => {
  for (const value of ["2024-02-29", "2000-02-29", "2026-09-03", "0001-01-01"]) assert.equal(isWorkoutDate(value), true, value);
  for (const value of ["2026-02-29", "1900-02-29", "2026-04-31", "0000-01-01", "2026-9-3", "2026-09-03T00:00:00Z", " 2026-09-03", null]) assert.equal(isWorkoutDate(value), false, String(value));
});

test("calendar arithmetic does not shift dates around DST, year rollover, or low years", () => {
  assert.equal(addWorkoutCalendarDays("2026-03-08", 1), "2026-03-09");
  assert.equal(addWorkoutCalendarDays("2026-11-01", -1), "2026-10-31");
  assert.equal(addWorkoutCalendarDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addWorkoutCalendarDays("0099-12-31", 1), "0100-01-01");
  assert.equal(addWorkoutCalendarDays("0001-01-01", -1), null);
  assert.equal(addWorkoutCalendarDays("2026-02-30", 1), null);
  assert.equal(addWorkoutCalendarDays("2026-01-01", 1.5), null);
  assert.equal(workoutWeekStartDate("2026-09-03", 1), "2026-09-03");
  assert.equal(workoutWeekStartDate("2026-09-03", 2), "2026-09-10");
  assert.equal(workoutWeekStartDate("2026-09-03", 0), null);
});

test("a Thursday start schedules every weekday on or after the program begins", () => {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = weekdays.map((day, index) => ({ id: `day-${index}`, day }));
  const first = buildWorkoutOccurrences({ mesocycleId: "meso-thu", weekNumber: 1, days, weekStartDate: workoutWeekStartDate("2026-09-03", 1) });
  const second = buildWorkoutOccurrences({ mesocycleId: "meso-thu", weekNumber: 2, days, weekStartDate: workoutWeekStartDate("2026-09-03", 2) });
  assert.deepEqual(first.map(item => item.plannedDate), ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"]);
  assert.ok(first.every(item => item.plannedDate >= "2026-09-03"));
  first.forEach((item, index) => assert.equal(second[index].plannedDate, addWorkoutCalendarDays(item.plannedDate, 7)));
  assert.equal(new Set([...first, ...second].map(item => item.plannedDate)).size, 14);
  const next = selectNextWorkoutOccurrence({ mesocycleId: "meso-thu", occurrences: first, sessions: [], today: "2026-09-03" });
  assert.equal(next.kind, "planned");
  assert.equal(next.occurrence.dayId, "day-3");
  assert.equal(next.timing, "today");
});

test("Monday starts retain their dates while Sunday starts and year rollover remain rolling weeks", () => {
  assert.deepEqual(makeWeek().map(item => item.plannedDate), ["2026-08-31", "2026-09-02", "2026-09-04"]);
  const days = [{ id: "sun", day: "Sun" }, { id: "mon", day: "Mon" }];
  const first = buildWorkoutOccurrences({ mesocycleId: "meso-year", weekNumber: 1, days, weekStartDate: workoutWeekStartDate("2026-12-27", 1) });
  const second = buildWorkoutOccurrences({ mesocycleId: "meso-year", weekNumber: 2, days, weekStartDate: workoutWeekStartDate("2026-12-27", 2) });
  assert.deepEqual(first.map(item => item.plannedDate), ["2026-12-27", "2026-12-28"]);
  assert.deepEqual(second.map(item => item.plannedDate), ["2027-01-03", "2027-01-04"]);
  assert.equal(workoutWeekStartDate("2026-03-08", 2), "2026-03-15");
  assert.equal(workoutWeekStartDate("2026-11-01", 2), "2026-11-08");
});

test("imported date overrides preserve exact occurrence identity and reject malformed data", () => {
  const raw = JSON.parse('{"meso-a:1:push":"2026-09-04","meso-a:2:push":"2026-09-11","meso-a:01:push":"2026-09-03","meso-a:0:push":"2026-09-03","meso-a:53:push":"2026-09-03","meso-a:1:pull":"2026-02-30","1:legs":"2026-09-03","__proto__":"2026-09-03","meso-a:1:constructor":"2026-09-03"}');
  assert.deepEqual(normalizeWorkoutDateOverrides(raw), { "meso-a:1:push": "2026-09-04", "meso-a:2:push": "2026-09-11" });
  assert.deepEqual(normalizeWorkoutDateOverrides([raw]), {});
  assert.deepEqual(normalizeWorkoutDateOverrides(null), {});
});

test("an override changes one occurrence, never recurring weekdays or the next week's identity", () => {
  const overrides = { "meso-a:1:push": "2026-09-05" };
  const first = makeWeek(overrides);
  const second = makeWeek(overrides, 2);
  assert.equal(first[0].sessionKey, "meso-a:1:push");
  assert.equal(first[0].plannedDate, "2026-08-31");
  assert.equal(first[0].scheduledDate, "2026-09-05");
  assert.equal(first[0].moved, true);
  assert.equal(first[1].scheduledDate, "2026-09-02");
  assert.equal(second[0].scheduledDate, "2026-09-07");
  assert.equal(second[0].moved, false);
});

test("unknown weekday names, invalid anchors, duplicate days, and invalid IDs are not guessed", () => {
  const result = buildWorkoutOccurrences({ mesocycleId: "meso-a", weekNumber: 1, weekStartDate: "2026-09-03",
    days: [{ id: "custom", day: "Day 1" }, { id: "custom", day: "Mon" }, { id: "bad:id", day: "Tue" }] });
  assert.equal(result.length, 1);
  assert.equal(result[0].scheduledDate, null);
  assert.deepEqual(buildWorkoutOccurrences({ mesocycleId: "", weekNumber: 1, weekStartDate: null, days: [] }), []);
});

test("move and Undo are immutable, preserve other moves, and restore a previous override", () => {
  const before = { "meso-a:1:pull": "2026-09-06", "meso-a:1:push": "2026-09-04" };
  const moved = moveWorkoutOccurrence({ occurrence: makeWeek(before)[0], dateOverrides: before, targetDate: "2026-09-05" });
  assert.equal(moved.changed, true);
  assert.equal(before["meso-a:1:push"], "2026-09-04");
  assert.equal(moved.dateOverrides["meso-a:1:pull"], "2026-09-06");
  const undo = undoWorkoutOccurrenceMove({ dateOverrides: moved.dateOverrides, undo: moved.undo });
  assert.equal(undo.changed, true);
  assert.deepEqual(undo.dateOverrides, before);
});

test("moving back to the original date removes only the override and can be undone", () => {
  const before = { "meso-a:1:push": "2026-09-04" };
  const moved = moveWorkoutOccurrence({ occurrence: makeWeek(before)[0], dateOverrides: before, targetDate: "2026-08-31" });
  assert.deepEqual(moved.dateOverrides, {});
  assert.deepEqual(undoWorkoutOccurrenceMove({ dateOverrides: moved.dateOverrides, undo: moved.undo }).dateOverrides, before);
});

test("stale Undo never overwrites a later move, including the same session", () => {
  const first = moveWorkoutOccurrence({ occurrence: makeWeek()[0], dateOverrides: {}, targetDate: "2026-09-04" });
  const second = moveWorkoutOccurrence({ occurrence: makeWeek(first.dateOverrides)[0], dateOverrides: first.dateOverrides, targetDate: "2026-09-05" });
  const undo = undoWorkoutOccurrenceMove({ dateOverrides: second.dateOverrides, undo: first.undo });
  assert.equal(undo.changed, false);
  assert.equal(undo.reason, "conflict");
  assert.equal(undo.dateOverrides, second.dateOverrides);
});

test("move refuses invalid dates, mismatched identity, and resolved sessions", () => {
  const base = { occurrence: makeWeek()[0], dateOverrides: {}, targetDate: "2026-09-04" };
  assert.equal(moveWorkoutOccurrence({ ...base, targetDate: "2026-02-30" }).reason, "invalid-date");
  assert.equal(moveWorkoutOccurrence({ ...base, occurrence: { ...base.occurrence, dayId: "pull" } }).reason, "invalid-occurrence");
  assert.equal(moveWorkoutOccurrence({ ...base, openSessionKeys: new Set(["meso-a:1:push"]) }).reason, "moved");
  assert.equal(moveWorkoutOccurrence({ ...base, completedSessionKeys: new Set(["meso-a:1:push"]) }).reason, "resolved");
  assert.equal(moveWorkoutOccurrence({ ...base, skippedWorkouts: { "meso-a:1:push": true } }).reason, "resolved");
  assert.equal(moveWorkoutOccurrence({ ...base, targetDate: "2026-08-31" }).reason, "unchanged");
});

test("move and Undo can adjust an open occurrence's date without changing its session", () => {
  const paused = Object.freeze(session("push", "paused"));
  const moved = moveWorkoutOccurrence({ occurrence: makeWeek()[0], dateOverrides: {}, targetDate: "2026-09-04" });
  assert.equal(select({ occurrences: makeWeek(moved.dateOverrides), sessions: [paused] }).session, paused);
  assert.equal(undoWorkoutOccurrenceMove({ dateOverrides: moved.dateOverrides, undo: moved.undo, openSessionKeys: new Set(["meso-a:1:push"]) }).changed, true);
  assert.equal(undoWorkoutOccurrenceMove({ dateOverrides: moved.dateOverrides, undo: moved.undo, completedSessionKeys: new Set(["meso-a:1:push"]) }).reason, "resolved");
});

test("open sessions win even when from another week, absent from today's split, or erroneously skipped", () => {
  const paused = session("old-custom-day", "paused", 2);
  const result = select({ sessions: [paused], skippedWorkouts: { [paused.sessionKey]: true } });
  assert.equal(result.kind, "resume");
  assert.equal(result.session, paused);
  assert.equal(result.occurrence, null);
});

test("multiple imported open sessions resolve deterministically, active before paused", () => {
  const active = session("pull");
  const paused = session("push", "paused");
  assert.equal(select({ sessions: [paused, active] }).session, active);
  assert.equal(select({ sessions: [active, paused] }).session, active);
  const foreign = { ...active, mesocycleId: "other", sessionKey: "other:1:pull" };
  assert.equal(select({ sessions: [foreign] }).kind, "planned");
});

test("next workout is earliest unfinished occurrence, not calendar weekday or old active day", () => {
  assert.equal(select().occurrence.dayId, "push");
  assert.equal(select().timing, "overdue");
  const result = select({ completedSessionKeys: new Set(["meso-a:1:push"]), skippedWorkouts: { "meso-a:1:pull": true } });
  assert.equal(result.occurrence.dayId, "legs");
  assert.equal(result.timing, "upcoming");
});

test("moving an occurrence changes ordering without marking it completed or skipping missed work", () => {
  const occurrences = makeWeek({ "meso-a:1:push": "2026-09-05" });
  assert.equal(select({ occurrences }).occurrence.dayId, "pull");
  const result = select({ occurrences, completedSessionKeys: new Set(["meso-a:1:pull", "meso-a:1:legs"]) });
  assert.equal(result.occurrence.sessionKey, "meso-a:1:push");
  assert.equal(result.timing, "upcoming");
});

test("completed sessions count even without legacy history; all resolved returns no fake workout", () => {
  const result = select({ sessions: [session("push", "completed"), session("pull", "completed")], skippedWorkouts: { "meso-a:1:legs": true } });
  assert.deepEqual(result, { kind: "complete", session: null, occurrence: null });
  assert.equal(select({ occurrences: [] }).kind, "complete");
});

test("same-day collisions retain both sessions in plan order and do not merge them", () => {
  const occurrences = makeWeek({ "meso-a:1:push": "2026-09-03", "meso-a:1:pull": "2026-09-03" });
  const first = select({ occurrences });
  assert.equal(first.occurrence.dayId, "push");
  assert.equal(first.timing, "today");
  const next = select({ occurrences, completedSessionKeys: new Set([first.occurrence.sessionKey]) });
  assert.equal(next.occurrence.dayId, "pull");
  assert.equal(next.timing, "today");
});

test("an explicit unresolved day can be selected early but cannot hide open work or resurrect completion", () => {
  assert.equal(select({ preferredDayId: "legs" }).occurrence.dayId, "legs");
  assert.equal(select({ preferredDayId: "legs", completedSessionKeys: new Set(["meso-a:1:legs"]) }).occurrence.dayId, "push");
  const paused = session("pull", "paused");
  assert.equal(select({ preferredDayId: "legs", sessions: [paused] }).session, paused);
});

test("credit is idempotent through final-week skip, unskip, re-skip and repeated finish", () => {
  const base = { mesocycleId: "meso-a", completedMesoIds: [], completedMesoCount: 3, complete: true };
  const first = creditMesocycleCompletion(base);
  assert.equal(first.completedMesoCount, 4);
  assert.equal(first.credited, true);
  const reopened = creditMesocycleCompletion({ ...base, ...first, complete: false });
  const repeated = creditMesocycleCompletion({ ...base, ...reopened, complete: true });
  assert.equal(repeated.completedMesoCount, 4);
  assert.equal(repeated.credited, false);
  assert.deepEqual(repeated.completedMesoIds, ["meso-a"]);
  const next = creditMesocycleCompletion({ ...base, ...repeated, mesocycleId: "meso-b" });
  assert.equal(next.completedMesoCount, 5);
});

test("completion ledger normalization rejects bad identities and respects legacy completion count", () => {
  assert.deepEqual(normalizeCompletedMesocycleIds(["meso-a", "meso-a", "", null, "__proto__", " bad ", "meso-b"]), ["meso-a", "meso-b"]);
  assert.deepEqual(normalizeCompletedMesocycleIds({ "meso-a": true }), []);
  const result = creditMesocycleCompletion({ mesocycleId: "meso-a", completedMesoIds: ["meso-a"], completedMesoCount: NaN, complete: true });
  assert.equal(result.completedMesoCount, 1);
  assert.equal(result.credited, false);
});
