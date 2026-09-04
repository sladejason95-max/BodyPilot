import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import {
  addWorkoutSet, pauseWorkoutSession, removeWorkoutSet, resumeWorkoutSession,
  sessionSetLogsForExercise, startWorkoutSession, workoutSetDraft,
} from "../src/app/workout_session.ts";

// Exercise the actual UI callback bodies without a DOM, retaining the real session engine.
const source = ts.createSourceFile("App.tsx", readFileSync(new URL("../src/app/App.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const todayView = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "TodayView");
const declarations = new Map();
const visit = node => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node);
  ts.forEachChild(node, visit);
};
visit(todayView);
const callback = (name, context) => {
  const declaration = declarations.get(name);
  assert.ok(declaration?.initializer, `Missing ${name} callback`);
  const compiled = ts.transpileModule(`const action = ${declaration.initializer.getText(source)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return new Function(...Object.keys(context), `${compiled}\nreturn action;`)(...Object.values(context));
};

const fixture = () => {
  const session = startWorkoutSession({ mesocycleId: "meso-callback", weekNumber: 1, dayId: "push",
    dayLabel: "Monday", workoutName: "Push", targetRir: 3,
    exercises: [{ id: "press", name: "Press", muscleGroup: "chest", pattern: "Press",
      sets: [{ id: "press-1", recommendedWeight: 60, recommendedReps: 8, targetRir: 3 },
        { id: "press-2", recommendedWeight: 60, recommendedReps: 8, targetRir: 3 }] }],
  }, "2026-09-03T12:00:00.000Z");
  const futureKey = "meso-callback:4:push:press";
  let state = { mesocycleId: "meso-callback", currentWeek: 4, workoutPaused: false, restTimer: null,
    workoutSessions: { [session.sessionKey]: session }, workoutLog: { [futureKey]: [{ untouched: true }] } };
  return { session, futureKey, getState: () => state, context: {
    activeSession: session, setState: update => { state = update(state); },
    workoutTargetRir: 3, today: { id: "push" },
    pauseWorkoutSession, resumeWorkoutSession,
    clamp: (value, low, high) => Math.max(low, Math.min(high, value)),
    workoutLiftLogKey: (meso, week, day, lift) => `${meso}:${week}:${day}:${lift}`,
    workoutSessionKey: () => { throw new Error("An existing session must not be re-keyed from currentWeek"); },
    sessionSetLogsForExercise, setsForLift: (_lift, logs) => logs,
    visibleSessionSetDraft: (_state, current, _lift, id) => workoutSetDraft(current, id),
    addSessionWorkoutSet: addWorkoutSet, removeSessionWorkoutSet: removeWorkoutSet,
    defaultSetLogsForLift: () => { throw new Error("Canonical session logs should be available"); },
    setWorkoutMessage: () => {},
  } };
};
const lift = { id: "press", name: "Press", muscleGroup: "chest", pattern: "Press", sets: 2, reps: "8-12" };

test("pause and resume act on the existing session while another week is selected", () => {
  const setup = fixture();
  const toggle = callback("toggleWorkoutPause", setup.context);
  toggle();
  assert.equal(setup.getState().workoutSessions[setup.session.sessionKey].status, "paused");
  toggle();
  assert.equal(setup.getState().workoutSessions[setup.session.sessionKey].status, "active");
  assert.equal(setup.getState().currentWeek, 4);
  assert.equal(Object.keys(setup.getState().workoutSessions).length, 1);
});

test("add and remove set callbacks write the original session's legacy log key only", () => {
  const added = fixture();
  callback("addSet", added.context)(lift);
  assert.equal(added.getState().workoutLog["meso-callback:1:push:press"].length, 3);
  assert.deepEqual(added.getState().workoutLog[added.futureKey], [{ untouched: true }]);
  const removed = fixture();
  callback("removeSet", removed.context)(lift, "press-2");
  assert.equal(removed.getState().workoutLog["meso-callback:1:push:press"].length, 1);
  assert.deepEqual(removed.getState().workoutLog[removed.futureKey], [{ untouched: true }]);
});

test("all existing-session UI actions retain canonical keys instead of deriving a new mutable week", () => {
  for (const name of ["replaceLift", "updateSet", "toggleWorkoutPause", "moveLift", "toggleSet", "skipSet", "addSet", "addExerciseToToday", "removeSet", "finishWorkout"]) {
    const text = declarations.get(name)?.initializer?.getText(source) ?? "";
    assert.ok(text.includes("activeSession"), `${name} must reference the rendered session`);
    assert.doesNotMatch(text, /workoutSessionKey\(prev\.mesocycleId,\s*prev\.currentWeek/, name);
    assert.doesNotMatch(text, /workoutLiftLogKey\(prev\.mesocycleId,\s*prev\.currentWeek/, name);
  }
});
