import assert from "node:assert/strict";
import test from "node:test";

import {
  bodyweightLocalDateKey,
  mergeBodyweightHistory,
  migrateLegacyTrackerBodyweights,
  normalizeBodyweightHistory,
  summarizeBodyweightHistory,
  upsertBodyweightForLocalDay,
} from "../src/app/bodyweight_history.ts";

test("normalization accepts real persisted values and rejects invalid dates and weights", () => {
  const normalized = normalizeBodyweightHistory([
    { id: "first", date: "2026-02-28", weightLb: "201.4" },
    { id: "invalid-date", date: "2026-02-30", weightLb: 200 },
    { id: "invalid-weight", date: "2026-03-01", weightLb: "200 lb" },
    { id: "zero", date: "2026-03-01", weightLb: 0 },
    null,
  ]);

  assert.deepEqual(normalized, [
    { id: "first", date: "2026-02-28", weightLb: 201.4, recordedAt: null },
  ]);
});

test("a supplied timestamp is retained and converted to its actual local calendar day", () => {
  const measuredAt = new Date(2026, 2, 1, 7, 30, 0);
  const normalized = normalizeBodyweightHistory([
    { bodyWeightLb: "200.2", recordedAt: measuredAt },
  ]);

  assert.equal(normalized[0].date, "2026-03-01");
  assert.equal(normalized[0].recordedAt, measuredAt.toISOString());
  assert.equal(bodyweightLocalDateKey(measuredAt), "2026-03-01");
});

test("legacy tracker migration uses only actual bodyWeight and date values", () => {
  const migrated = migrateLegacyTrackerBodyweights({
    trackerDays: [
      {
        id: "tracker-a",
        date: "2026-08-01",
        bodyWeight: "198.5",
        closedAt: "2026-08-02T03:00:00.000Z",
      },
      { id: "blank", date: "2026-08-02", bodyWeight: "" },
      { id: "missing-date", bodyWeight: "197" },
      { id: "not-numeric", date: "2026-08-03", bodyWeight: "about 197" },
    ],
  });

  assert.deepEqual(migrated, [
    {
      id: "legacy-tracker:tracker-a",
      date: "2026-08-01",
      weightLb: 198.5,
      recordedAt: null,
    },
  ]);
});

test("merge deduplicates local days and prefers a precise measurement timestamp", () => {
  const morning = new Date(2026, 7, 1, 7, 0, 0).toISOString();
  const evening = new Date(2026, 7, 1, 18, 0, 0).toISOString();
  const merged = mergeBodyweightHistory(
    [
      { id: "morning", date: "2026-08-01", weightLb: 199, recordedAt: morning },
      { id: "next-day", date: "2026-08-02", weightLb: 198.6 },
    ],
    [{ id: "legacy", date: "2026-08-01", bodyWeight: "201" }],
    [{ id: "evening", date: "2026-08-01", weightLb: 198.8, recordedAt: evening }]
  );

  assert.deepEqual(merged.map(({ id, date, weightLb }) => ({ id, date, weightLb })), [
    { id: "evening", date: "2026-08-01", weightLb: 198.8 },
    { id: "next-day", date: "2026-08-02", weightLb: 198.6 },
  ]);
});

test("upsert replaces the same local day and never manufactures now", () => {
  const existing = [
    {
      id: "stable-id",
      date: "2026-08-01",
      weightLb: 199,
      recordedAt: "2026-08-01T14:00:00.000Z",
    },
  ];
  const replaced = upsertBodyweightForLocalDay(existing, {
    date: "2026-08-01",
    weightLb: "198.4",
  });

  assert.deepEqual(replaced, [
    { id: "stable-id", date: "2026-08-01", weightLb: 198.4, recordedAt: null },
  ]);

  const nextMeasurement = new Date(2026, 7, 2, 6, 45, 0);
  const appended = upsertBodyweightForLocalDay(replaced, {
    weightLb: 198.1,
    recordedAt: nextMeasurement,
  });
  assert.equal(appended.length, 2);
  assert.equal(appended[1].date, "2026-08-02");
  assert.equal(appended[1].recordedAt, nextMeasurement.toISOString());
});

test("summary with fewer than three samples exposes facts but no weekly trend", () => {
  const summary = summarizeBodyweightHistory([
    { date: "2026-08-01", weightLb: 200 },
    { date: "2026-08-08", weightLb: 198 },
  ]);

  assert.equal(summary.sampleCount, 2);
  assert.equal(summary.first.weightLb, 200);
  assert.equal(summary.latest.weightLb, 198);
  assert.equal(summary.changeLb, -2);
  assert.equal(summary.changePercent, -1);
  assert.equal(summary.daySpan, 7);
  assert.equal(summary.weeklyTrend, null);
});

test("summary calculates a transparent weekly least-squares trend when data is sufficient", () => {
  const summary = summarizeBodyweightHistory([
    { date: "2026-08-15", weightLb: 196 },
    { date: "2026-08-01", weightLb: 200 },
    { date: "2026-08-08", weightLb: 198 },
  ]);

  assert.equal(summary.sampleCount, 3);
  assert.equal(summary.changeLb, -4);
  assert.deepEqual(summary.weeklyTrend, {
    weeklyChangeLb: -2,
    weeklyChangePercent: -1.02,
    sampleCount: 3,
    daySpan: 14,
    firstDate: "2026-08-01",
    latestDate: "2026-08-15",
    method: "least-squares",
  });
});

test("same-day date-only duplicates use the later supplied record deterministically", () => {
  const normalized = normalizeBodyweightHistory([
    { id: "old", date: "2026-08-01", weightLb: 200 },
    { id: "edited", date: "2026-08-01", weightLb: 199.5 },
  ]);

  assert.deepEqual(normalized, [
    { id: "edited", date: "2026-08-01", weightLb: 199.5, recordedAt: null },
  ]);
});
