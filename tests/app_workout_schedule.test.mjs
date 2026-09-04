import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createServer } from "vite";
import { startWorkoutSession, updateWorkoutSet, pauseWorkoutSession, finishWorkoutSession } from "../src/app/workout_session.ts";
import { moveWorkoutOccurrence, undoWorkoutOccurrenceMove } from "../src/app/workout_schedule.ts";

let server;
let app;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
  app = await server.ssrLoadModule("/src/app/App.tsx");
});
after(async () => { await server?.close(); });

const fixture = () => ({ ...structuredClone(app.defaultState), mesocycleId: "meso-schedule-app",
  mesoStartedAt: "2026-09-03T12:00:00", currentWeek: 1, activeDayId: null });
const daysFor = state => app.computePlan(state, "2026-09-03").split.days;
const sessionFor = (state, day, week = 1) => startWorkoutSession({
  mesocycleId: state.mesocycleId, weekNumber: week, dayId: day.id, dayLabel: day.day, workoutName: day.focus,
  targetRir: 3, exercises: [{ id: "press", exerciseId: "press", name: "Chest press", muscleGroup: "chest", pattern: "Press",
    sets: [{ id: "press-1", recommendedWeight: 60, recommendedReps: 8, targetRir: 3 }] }],
}, "2026-09-03T12:00:00.000Z");

test("real App dates begin on or after selected start, not earlier weekdays", () => {
  const state = fixture();
  const days = daysFor(state);
  const first = app.workoutOccurrencesForWeek(state, days);
  const second = app.workoutOccurrencesForWeek(state, days, 2);
  assert.ok(first.every(item => item.scheduledDate >= "2026-09-03" && item.scheduledDate < "2026-09-10"));
  for (const occurrence of first) {
    const next = second.find(item => item.dayId === occurrence.dayId);
    assert.equal((Date.parse(next.scheduledDate) - Date.parse(occurrence.scheduledDate)) / 86400000, 7);
  }
  assert.equal(app.nextWorkoutFor(state, days).occurrence.scheduledDate,
    first.map(item => item.scheduledDate).sort()[0]);
});

test("moving the next App workout changes selection and guarded Undo restores it without adding work", () => {
  const state = fixture();
  const days = daysFor(state);
  const initial = app.nextWorkoutFor(state, days);
  const result = moveWorkoutOccurrence({ occurrence: initial.occurrence, dateOverrides: state.workoutDateOverrides, targetDate: "2026-10-01" });
  const moved = { ...state, workoutDateOverrides: result.dateOverrides };
  assert.notEqual(app.nextWorkoutFor(moved, days).occurrence.sessionKey, initial.occurrence.sessionKey);
  assert.deepEqual(moved.workoutSessions, {});
  assert.deepEqual(moved.workoutHistory, []);
  assert.equal(moved.completedMesoCount, 0);
  const undo = undoWorkoutOccurrenceMove({ dateOverrides: moved.workoutDateOverrides, undo: result.undo });
  assert.equal(app.nextWorkoutFor({ ...moved, workoutDateOverrides: undo.dateOverrides }, days).occurrence.sessionKey, initial.occurrence.sessionKey);
});

test("a previous-week paused session wins over the mutable current week and day selection", () => {
  const state = fixture();
  const days = daysFor(state);
  const paused = pauseWorkoutSession(sessionFor(state, days[0]), "2026-09-03T12:05:00.000Z");
  const next = app.nextWorkoutFor({ ...state, currentWeek: 3, activeDayId: days.at(-1).id,
    workoutSessions: { [paused.sessionKey]: paused } }, days, true);
  assert.equal(next.kind, "resume");
  assert.equal(next.session.sessionKey, paused.sessionKey);
  assert.equal(next.session.weekNumber, 1);
  assert.equal(next.session.status, "paused");
});

test("explicit saved-workout review remains available but is never a new next workout", () => {
  const state = fixture();
  const days = daysFor(state);
  let session = sessionFor(state, days[0]);
  session = updateWorkoutSet(session, "press-1", { weight: 60, reps: 8, rir: 3, done: true }, "2026-09-03T12:05:00.000Z");
  session = finishWorkoutSession(session, { now: "2026-09-03T12:10:00.000Z" }).session;
  const saved = { ...state, activeDayId: days[0].id, workoutSessions: { [session.sessionKey]: session } };
  assert.equal(app.nextWorkoutFor(saved, days, true).kind, "review");
  assert.notEqual(app.nextWorkoutFor(saved, days).occurrence.sessionKey, session.sessionKey);
  assert.equal(app.nextWorkoutFor(saved, days, true).session.setLogs["press-1"].weight, 60);
});

test("an entirely skipped App week has no phantom next workout or completion credit", () => {
  const state = fixture();
  const days = daysFor(state);
  const skippedWorkouts = Object.fromEntries(app.workoutOccurrencesForWeek(state, days).map(item => [item.sessionKey, true]));
  assert.equal(app.nextWorkoutFor({ ...state, skippedWorkouts }, days).kind, "complete");
  assert.equal(state.completedMesoCount, 0);
});
