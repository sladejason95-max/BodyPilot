import assert from "node:assert/strict";
import test from "node:test";
import {
  optimisticWriteLocalState,
  readLocalState,
} from "../src/app/local_state_persistence.ts";

const key = "bodypilot-state";
const makeStorage = (initial = null) => {
  const values = new Map(initial === null ? [] : [[key, initial]]);
  const calls = [];
  return {
    values,
    calls,
    getItem(storageKey) {
      calls.push(["get", storageKey]);
      return values.get(storageKey) ?? null;
    },
    setItem(storageKey, raw) {
      calls.push(["set", storageKey, raw]);
      values.set(storageKey, raw);
    },
  };
};
const write = (storage, expectedRaw, nextRaw) =>
  optimisticWriteLocalState({ storage, key, expectedRaw, nextRaw });

test("first save requires the store to still be empty", () => {
  const storage = makeStorage();
  assert.deepEqual(write(storage, null, '{"food":[]}'), {
    status: "saved",
    baselineRaw: '{"food":[]}',
  });
  assert.equal(storage.values.get(key), '{"food":[]}');
  assert.deepEqual(storage.calls, [
    ["get", key],
    ["set", key, '{"food":[]}'],
  ]);
});

test("a save replaces only the exact baseline and advances it on success", () => {
  const storage = makeStorage("old");
  const first = write(storage, "old", "new");
  assert.deepEqual(first, { status: "saved", baselineRaw: "new" });
  assert.deepEqual(write(storage, first.baselineRaw, "newer"), {
    status: "saved",
    baselineRaw: "newer",
  });
  assert.equal(storage.values.get(key), "newer");
});

test("the same serialized content is a no-op even when another tab saved it", () => {
  for (const expected of [null, "old", "same"]) {
    const storage = makeStorage("same");
    assert.deepEqual(write(storage, expected, "same"), {
      status: "unchanged",
      baselineRaw: "same",
    });
    assert.deepEqual(storage.calls, [["get", key]]);
  }
});

test("a stale tab cannot overwrite a newer tab's food or workout state", () => {
  const old = '{"food":["old-food"],"workouts":[]}';
  const newer = '{"food":["old-food"],"workouts":["completed-workout"]}';
  const staleNext = '{"food":["new-food","old-food"],"workouts":[]}';
  const storage = makeStorage(old);
  assert.equal(write(storage, old, newer).status, "saved");
  const conflict = write(storage, old, staleNext);
  assert.deepEqual(conflict, {
    status: "conflict",
    baselineRaw: old,
    currentRaw: newer,
  });
  assert.equal(storage.values.get(key), newer);
  assert.equal(
    storage.calls.filter(([operation]) => operation === "set").length,
    1,
  );
  assert.equal(
    write(storage, conflict.baselineRaw, staleNext).status,
    "conflict",
  );
  assert.equal(storage.values.get(key), newer);
});

test("an HMR or mount replay of unchanged stale state still detects a conflict", () => {
  const storage = makeStorage("newer-in-another-tab");
  assert.deepEqual(write(storage, "stale", "stale"), {
    status: "conflict",
    baselineRaw: "stale",
    currentRaw: "newer-in-another-tab",
  });
  assert.deepEqual(storage.calls, [["get", key]]);
});

test("store deletion or unexpected creation is a conflict, not permission to overwrite", () => {
  const deleted = makeStorage();
  assert.deepEqual(write(deleted, "old", "next"), {
    status: "conflict",
    baselineRaw: "old",
    currentRaw: null,
  });
  const created = makeStorage("another-tab-created-this");
  assert.deepEqual(write(created, null, "next"), {
    status: "conflict",
    baselineRaw: null,
    currentRaw: "another-tab-created-this",
  });
  assert.equal(deleted.calls.length, 1);
  assert.equal(created.calls.length, 1);
});

test("comparison is raw-string exact, including empty strings and JSON whitespace", () => {
  const empty = makeStorage("");
  assert.equal(write(empty, null, "next").status, "conflict");
  assert.equal(write(empty, "", "next").status, "saved");
  const storage = makeStorage('{ "a": 1 }');
  assert.equal(write(storage, '{"a":1}', '{"a":2}').status, "conflict");
  assert.equal(storage.values.get(key), '{ "a": 1 }');
});

test("read failures do not write or claim the store is empty", () => {
  const failure = new Error("Storage access denied");
  let writes = 0;
  const storage = {
    getItem() {
      throw failure;
    },
    setItem() {
      writes++;
    },
  };
  assert.deepEqual(readLocalState(storage, key), {
    status: "error",
    operation: "read",
    error: failure,
  });
  assert.deepEqual(write(storage, "baseline", "next"), {
    status: "error",
    baselineRaw: "baseline",
    operation: "read",
    error: failure,
  });
  assert.equal(writes, 0);
});

test("write failures preserve baseline and never claim a save", () => {
  const failure = new Error("Quota exceeded");
  const storage = makeStorage("baseline");
  storage.setItem = () => {
    throw failure;
  };
  const result = write(storage, "baseline", "next");
  assert.deepEqual(result, {
    status: "error",
    baselineRaw: "baseline",
    operation: "write",
    error: failure,
  });
  assert.equal(storage.values.get(key), "baseline");
});

test("a no-op does not attempt a denied write", () => {
  const storage = makeStorage("same");
  storage.setItem = () => {
    throw new Error("Must not write");
  };
  assert.deepEqual(write(storage, "old", "same"), {
    status: "unchanged",
    baselineRaw: "same",
  });
});

test("the injected storage receiver and requested key are preserved", () => {
  const storage = makeStorage("keep-this");
  storage.values.set("other-key", "old-other");
  const result = optimisticWriteLocalState({
    storage,
    key: "other-key",
    expectedRaw: "old-other",
    nextRaw: "new-other",
  });
  assert.equal(result.status, "saved");
  assert.equal(storage.values.get(key), "keep-this");
  assert.equal(storage.values.get("other-key"), "new-other");
  assert.deepEqual(readLocalState(storage, "missing-key"), {
    status: "read",
    raw: null,
  });
});
