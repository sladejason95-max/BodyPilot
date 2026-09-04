import assert from "node:assert/strict";
import test from "node:test";
import { loadAppStateSafely } from "../src/app/app_state_storage.ts";

const saved = { schemaVersion: 4, goal: "recomposition", workoutLog: {}, value: 7 };
const defaults = { value: 0 };
const load = (values, normalize = parsed => parsed) => loadAppStateSafely({
  storage: { getItem: key => values[key] ?? null }, key: "current", legacyKeys: ["legacy"],
  defaultState: defaults, normalize,
});

test("valid primary data wins and keeps its exact optimistic-save baseline", () => {
  const raw = JSON.stringify(saved, null, 2);
  const result = load({ current: raw, legacy: "bad old data" });
  assert.deepEqual(result.state, saved);
  assert.equal(result.baselineRaw, raw);
  assert.equal(result.problem, null);
});
test("malformed, empty, wrong-shaped and future primary data cannot fall back to legacy", () => {
  for (const raw of ["{broken", "", "null", "[]", "{}", JSON.stringify({ ...saved, schemaVersion: 5 })]) {
    let normalizations = 0;
    const result = load({ current: raw, legacy: JSON.stringify(saved) }, () => { normalizations++; return saved; });
    assert.ok(result.problem);
    assert.equal(result.baselineRaw, raw);
    assert.equal(normalizations, 0);
  }
});
test("a storage read failure is not an empty store", () => {
  const result = loadAppStateSafely({ storage: { getItem() { throw new Error("Denied"); } }, key: "current", defaultState: defaults, normalize: p => p });
  assert.equal(result.baselineRaw, undefined);
  assert.equal(result.problem, "Denied");
});
test("normalization failure preserves original data for recovery", () => {
  const raw = JSON.stringify(saved);
  const result = load({ current: raw }, () => { throw new Error("Invalid records"); });
  assert.equal(result.problem, "Invalid records");
  assert.equal(result.baselineRaw, raw);
});
test("first launch is empty but a valid legacy copy still migrates", () => {
  assert.deepEqual(load({}), { state: defaults, baselineRaw: null, problem: null });
  assert.deepEqual(load({ legacy: JSON.stringify(saved) }).state, saved);
});
test("damaged legacy data also blocks autosave rather than silently starting over", () => {
  const result = load({ legacy: "broken" });
  assert.ok(result.problem);
  assert.equal(result.baselineRaw, null);
  assert.equal(JSON.parse(result.recoveryCopy.content).records.legacy, "broken");
});

test("invalid schema types never enter legacy migration", () => {
  for (const schemaVersion of ["4", null, -1, 3.5]) {
    assert.ok(load({ current: JSON.stringify({ ...saved, schemaVersion }) }).problem);
  }
});

test("older primary formats can still import complementary legacy histories", () => {
  const result = load({ current: JSON.stringify({ ...saved, schemaVersion: 3 }), legacy: JSON.stringify(saved) },
    (_primary, payloads) => ({ imported: payloads.length }));
  assert.equal(result.state.imported, 2);
});
