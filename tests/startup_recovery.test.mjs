import assert from "node:assert/strict";
import test from "node:test";
import { listRecoveryArchives, recoveryArchivePrefix, recoverFreshAppState } from "../src/app/startup_recovery.ts";
import { statePersistenceLockName } from "../src/app/transactional_state_persistence.ts";

const key = "bodypilot-state";
const legacyKey = "stageprep-state";
const original = "{malformed original data";
const next = JSON.stringify({ schemaVersion: 4, goal: "Maintain", workoutLog: [] });
const makeFixture = (originalRecords = { [key]: original, [legacyKey]: null }) => {
  const records = new Map(Object.entries(originalRecords).filter(([, raw]) => raw !== null));
  const writes = [];
  let locked = false;
  const storage = {
    getItem(name) {
      assert.equal(locked, true, "Every storage access participates in the state lock");
      return records.get(name) ?? null;
    },
    setItem(name, raw) {
      assert.equal(locked, true);
      writes.push([name, raw]);
      records.set(name, raw);
    },
  };
  const locks = {
    async request(name, options, callback) {
      assert.equal(name, statePersistenceLockName(key));
      assert.equal(options.mode, "exclusive");
      locked = true;
      try { return await callback({ name, mode: options.mode }); }
      finally { locked = false; }
    },
  };
  const args = {
    storage, locks, key, expectedRaw: originalRecords[key], originalRecords,
    nextRaw: next, archiveId: "attempt-123", archivedAt: "2026-09-03T12:00:00.000Z",
  };
  return { records, writes, storage, locks, args };
};

test("fresh start preserves the exact malformed primary locally before replacing it", async () => {
  const fixture = makeFixture();
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "saved");
  assert.equal(result.baselineRaw, next);
  assert.equal(fixture.records.get(key), next);
  const archive = JSON.parse(fixture.records.get(result.archiveKey));
  assert.deepEqual(archive.records, { [key]: original, [legacyKey]: null });
  assert.equal(archive.primaryKey, key);
  assert.equal(archive.archivedAt, fixture.args.archivedAt);
  assert.equal(archive.format, "bodypilot-storage-recovery");
  assert.deepEqual(fixture.writes.map(([name]) => name), [result.archiveKey, key]);
});

test("legacy-only recovery leaves the original legacy value available", async () => {
  const fixture = makeFixture({ [key]: null, [legacyKey]: "broken legacy" });
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "saved");
  assert.equal(fixture.records.get(key), next);
  assert.equal(fixture.records.get(legacyKey), "broken legacy");
  assert.deepEqual(JSON.parse(fixture.records.get(result.archiveKey)).records, {
    [key]: null, [legacyKey]: "broken legacy",
  });
});

test("archive quota failure leaves all original records unchanged", async () => {
  const fixture = makeFixture();
  fixture.storage.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "error");
  assert.equal(result.operation, "archive");
  assert.equal(fixture.records.get(key), original);
  assert.deepEqual(fixture.writes, []);
});

test("a stale primary snapshot causes no writes", async () => {
  const fixture = makeFixture();
  fixture.records.set(key, "newer tab data");
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "conflict");
  assert.equal(result.changedKey, key);
  assert.equal(result.currentRaw, "newer tab data");
  assert.deepEqual(fixture.writes, []);
});

test("changed or newly appearing legacy data also causes no writes", async () => {
  for (const raw of [null, "old legacy data"]) {
    const fixture = makeFixture({ [key]: original, [legacyKey]: raw });
    fixture.records.set(legacyKey, "newer legacy data");
    const result = await recoverFreshAppState(fixture.args);
    assert.equal(result.status, "conflict");
    assert.equal(result.changedKey, legacyKey);
    assert.deepEqual(fixture.writes, []);
    assert.equal(fixture.records.get(key), original);
  }
});

test("archive collisions never overwrite the earlier recovery copy", async () => {
  const fixture = makeFixture();
  const archiveKey = `bodypilot:recovery:${key}:${fixture.args.archiveId}`;
  fixture.records.set(archiveKey, "earlier original");
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "error");
  assert.equal(result.operation, "archive");
  assert.equal(fixture.records.get(archiveKey), "earlier original");
  assert.equal(fixture.records.get(key), original);
  assert.deepEqual(fixture.writes, []);
});

test("missing or rejected exclusive locks leave storage untouched", async () => {
  for (const locks of [null, {}, { request: async () => { throw new Error("Denied"); } }, {
    request: async (_name, _options, callback) => callback(null),
  }, {
    request: async (name, _options, callback) => callback({ name, mode: "shared" }),
  }]) {
    const fixture = makeFixture();
    const result = await recoverFreshAppState({ ...fixture.args, locks });
    assert.ok(["unavailable", "error"].includes(result.status));
    assert.equal(result.operation, "lock");
    assert.equal(fixture.records.get(key), original);
    assert.deepEqual(fixture.writes, []);
  }
});

test("failed reads before archive or while verifying it never replace the original", async () => {
  for (const failAt of [1, 2, 3, 4, 5, 6]) {
    const fixture = makeFixture();
    const getItem = fixture.storage.getItem;
    let reads = 0;
    fixture.storage.getItem = name => {
      if (++reads === failAt) throw new Error("Storage blocked");
      return getItem(name);
    };
    const result = await recoverFreshAppState(fixture.args);
    assert.equal(result.status, "error", `read ${failAt}`);
    assert.equal(result.operation, "read");
    assert.equal(fixture.records.get(key), original);
    assert.ok(fixture.writes.every(([name]) => name !== key));
  }
});

test("an unverified archive never permits replacing the original", async () => {
  const fixture = makeFixture();
  fixture.storage.setItem = (name, raw) => {
    fixture.writes.push([name, raw]);
    // Simulate an implementation that silently fails to retain its write.
  };
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "error");
  assert.equal(result.operation, "archive");
  assert.equal(fixture.records.get(key), original);
  assert.equal(fixture.writes.length, 1);
});

test("an old unlocked writer changing the primary during archive creation is detected", async () => {
  const fixture = makeFixture();
  const setItem = fixture.storage.setItem;
  fixture.storage.setItem = (name, raw) => {
    setItem(name, raw);
    if (name !== key) fixture.records.set(key, "unlocked writer data");
  };
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "conflict");
  assert.equal(fixture.records.get(key), "unlocked writer data");
  assert.equal(fixture.writes.length, 1);
  assert.equal(JSON.parse(fixture.writes[0][1]).records[key], original);
});

test("a failed primary write still leaves a verified recovery archive retrievable", async () => {
  const fixture = makeFixture();
  const setItem = fixture.storage.setItem;
  fixture.storage.setItem = (name, raw) => {
    if (name === key) throw new DOMException("Full", "QuotaExceededError");
    setItem(name, raw);
  };
  const result = await recoverFreshAppState(fixture.args);
  assert.equal(result.status, "error");
  assert.equal(result.operation, "write");
  assert.equal(fixture.records.get(key), original);
  assert.equal(JSON.parse(fixture.records.get(result.archiveKey)).records[key], original);
});

test("recovery snapshots cannot omit or disagree with the primary baseline", async () => {
  for (const originalRecords of [{ [legacyKey]: "legacy" }, { [key]: "different" }]) {
    const fixture = makeFixture();
    const result = await recoverFreshAppState({ ...fixture.args, originalRecords });
    assert.equal(result.status, "error");
    assert.equal(result.operation, "validate");
    assert.deepEqual(fixture.writes, []);
  }
});

test("saved archives remain discoverable for download after a reload", async () => {
  const fixture = makeFixture();
  const first = await recoverFreshAppState(fixture.args);
  const firstRaw = fixture.records.get(first.archiveKey);
  const secondKey = `${recoveryArchivePrefix(key)}newer-copy`;
  fixture.records.set(secondKey, JSON.stringify({ ...JSON.parse(firstRaw), archivedAt: "2026-09-04T12:00:00.000Z" }));
  fixture.records.set(`${recoveryArchivePrefix(key)}broken`, "{bad JSON");
  fixture.records.set(`${recoveryArchivePrefix(key)}foreign`, JSON.stringify({ ...JSON.parse(firstRaw), primaryKey: "another-app" }));
  fixture.records.set(`${recoveryArchivePrefix(key)}bad-records`, JSON.stringify({ ...JSON.parse(firstRaw), records: { [key]: { data: "not raw" } } }));
  fixture.records.set("another-app-recovery", firstRaw);
  const storage = {
    length: fixture.records.size,
    key: index => Array.from(fixture.records.keys())[index] ?? null,
    getItem: name => fixture.records.get(name) ?? null,
  };
  const result = listRecoveryArchives({ storage, key });
  assert.equal(result.status, "read");
  assert.deepEqual(result.archives.map(archive => archive.key), [secondKey, first.archiveKey]);
  assert.equal(result.archives[1].content, firstRaw);
  assert.equal(JSON.parse(result.archives[1].content).records[key], original);
});

test("an archive enumeration failure is reported without claiming no copies exist", () => {
  for (const storage of [
    { get length() { throw new Error("Denied"); } },
    { length: 1, key: () => { throw new Error("Denied"); } },
    { length: 1, key: () => `${recoveryArchivePrefix(key)}copy`, getItem: () => { throw new Error("Denied"); } },
  ]) {
    const result = listRecoveryArchives({ storage, key });
    assert.equal(result.status, "error");
    assert.match(result.message, /could not be read/);
  }
});
