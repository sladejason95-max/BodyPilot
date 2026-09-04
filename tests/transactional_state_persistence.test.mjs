import assert from "node:assert/strict";
import test from "node:test";
import { readLocalState } from "../src/app/local_state_persistence.ts";
import {
  createQueuedStatePersistence,
  statePersistenceLockName,
  transactionalWriteLocalState,
} from "../src/app/transactional_state_persistence.ts";

const key = "bodypilot-state";
const makeStorage = (raw = "baseline") => {
  const values = new Map(raw === null ? [] : [[key, raw]]);
  const calls = [];
  return {
    values,
    calls,
    getItem(key) {
      calls.push(["read", key]);
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      calls.push(["write", key, value]);
      values.set(key, value);
    },
  };
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
// Deterministic same-origin lock manager: same-name requests wait, distinct
// names may proceed, and callback completion releases even a failed request.
const makeLocks = () => ({
  tails: new Map(),
  held: new Set(),
  calls: [],
  request(name, options, callback) {
    this.calls.push({ name, options });
    const before = this.tails.get(name) ?? Promise.resolve();
    const pending = before
      .catch(() => {})
      .then(async () => {
        if (options.signal?.aborted)
          throw new DOMException("Aborted", "AbortError");
        assert.equal(
          this.held.has(name),
          false,
          "An exclusive lock cannot overlap",
        );
        this.held.add(name);
        try {
          return await callback({ name, mode: options.mode });
        } finally {
          this.held.delete(name);
        }
      });
    this.tails.set(
      name,
      pending.catch(() => {}),
    );
    return pending;
  },
});
const write = (
  storage,
  locks,
  expectedRaw = "baseline",
  nextRaw = "next",
  extras = {},
) =>
  transactionalWriteLocalState({
    storage,
    locks,
    key,
    expectedRaw,
    nextRaw,
    ...extras,
  });

test("comparison and write occur only while holding the same named exclusive lock", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  const events = [];
  const getItem = storage.getItem.bind(storage);
  const setItem = storage.setItem.bind(storage);
  storage.getItem = (key) => {
    events.push(["read", locks.held.has(statePersistenceLockName(key))]);
    return getItem(key);
  };
  storage.setItem = (key, value) => {
    events.push(["write", locks.held.has(statePersistenceLockName(key))]);
    setItem(key, value);
  };
  assert.deepEqual(await write(storage, locks), {
    status: "saved",
    baselineRaw: "next",
  });
  assert.deepEqual(events, [
    ["read", true],
    ["write", true],
  ]);
  assert.deepEqual(locks.calls, [
    {
      name: "bodypilot:local-state:bodypilot-state",
      options: { mode: "exclusive" },
    },
  ]);
  assert.equal(locks.held.size, 0);
});

test("two simultaneous stale tabs cannot both replace one baseline", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  const [first, second] = await Promise.all([
    write(storage, locks, "baseline", "tab-one"),
    write(storage, locks, "baseline", "tab-two"),
  ]);
  assert.deepEqual(first, { status: "saved", baselineRaw: "tab-one" });
  assert.deepEqual(second, {
    status: "conflict",
    baselineRaw: "baseline",
    currentRaw: "tab-one",
  });
  assert.equal(storage.values.get(key), "tab-one");
  assert.equal(storage.calls.filter(([type]) => type === "write").length, 1);
});

test("identical concurrent content is a harmless no-op instead of a false conflict", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  const results = await Promise.all([
    write(storage, locks),
    write(storage, locks),
  ]);
  assert.deepEqual(
    results.map((result) => result.status),
    ["saved", "unchanged"],
  );
  assert.equal(storage.calls.filter(([type]) => type === "write").length, 1);
});

test("waiting work checks the value after lock acquisition, not before it", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  const gate = deferred();
  const acquired = deferred();
  const held = locks.request(
    statePersistenceLockName(key),
    { mode: "exclusive" },
    async () => {
      acquired.resolve();
      await gate.promise;
      storage.setItem(key, "changed-while-waiting");
    },
  );
  await acquired.promise;
  const pending = write(storage, locks);
  assert.equal(storage.calls.length, 0);
  gate.resolve();
  await held;
  assert.deepEqual(await pending, {
    status: "conflict",
    baselineRaw: "baseline",
    currentRaw: "changed-while-waiting",
  });
  assert.equal(storage.values.get(key), "changed-while-waiting");
});

test("unavailable Web Locks never fall back to unlocked storage writes or reads", async () => {
  for (const locks of [null, undefined, {}]) {
    const storage = makeStorage("next");
    assert.deepEqual(await write(storage, locks), {
      status: "unavailable",
      operation: "lock",
      baselineRaw: "baseline",
    });
    assert.deepEqual(storage.calls, []);
  }
});

test("lock denial, synchronous failures and access errors preserve the original value", async () => {
  const error = new DOMException("Locks denied", "SecurityError");
  for (const locks of [
    { request: () => Promise.reject(error) },
    {
      request() {
        throw error;
      },
    },
    {
      get request() {
        throw error;
      },
    },
  ]) {
    const storage = makeStorage();
    assert.deepEqual(await write(storage, locks), {
      status: "error",
      operation: "lock",
      baselineRaw: "baseline",
      error,
    });
    assert.deepEqual(storage.calls, []);
    assert.equal(storage.values.get(key), "baseline");
  }
});

test("a null, wrong-name or shared lock cannot authorize a write", async () => {
  for (const lock of [
    null,
    { name: "other", mode: "exclusive" },
    { name: statePersistenceLockName(key), mode: "shared" },
  ]) {
    const storage = makeStorage();
    const result = await write(storage, {
      request: (_name, _options, callback) => Promise.resolve(callback(lock)),
    });
    assert.equal(result.status, "error");
    assert.equal(result.operation, "lock");
    assert.deepEqual(storage.calls, []);
  }
});

test("storage read and quota errors remain distinguishable and release the lock", async () => {
  const locks = makeLocks();
  for (const operation of ["read", "write"]) {
    const error = new Error(
      operation === "read" ? "Storage unavailable" : "Quota exceeded",
    );
    const storage = makeStorage();
    storage[operation === "read" ? "getItem" : "setItem"] = () => {
      throw error;
    };
    assert.deepEqual(await write(storage, locks), {
      status: "error",
      operation,
      baselineRaw: "baseline",
      error,
    });
    assert.equal(storage.values.get(key), "baseline");
    assert.equal(locks.held.size, 0);
  }
  assert.equal((await write(makeStorage(), locks)).status, "saved");
});

test("abort before requesting or while waiting never writes and preserves baseline", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  assert.deepEqual(
    await write(storage, locks, "baseline", "next", {
      signal: alreadyAborted.signal,
    }),
    { status: "cancelled", baselineRaw: "baseline" },
  );
  assert.equal(locks.calls.length, 0);
  const gate = deferred();
  const acquired = deferred();
  const held = locks.request(
    statePersistenceLockName(key),
    { mode: "exclusive" },
    async () => {
      acquired.resolve();
      await gate.promise;
    },
  );
  await acquired.promise;
  const controller = new AbortController();
  const pending = write(storage, locks, "baseline", "next", {
    signal: controller.signal,
  });
  controller.abort();
  gate.resolve();
  await held;
  assert.deepEqual(await pending, {
    status: "cancelled",
    baselineRaw: "baseline",
  });
  assert.deepEqual(storage.calls, []);
});

test("an abort noticed at callback entry still prevents writes", async () => {
  const controller = new AbortController();
  const storage = makeStorage();
  const locks = {
    request(name, options, callback) {
      controller.abort();
      return Promise.resolve(callback({ name, mode: options.mode }));
    },
  };
  assert.deepEqual(
    await write(storage, locks, "baseline", "next", {
      signal: controller.signal,
    }),
    { status: "cancelled", baselineRaw: "baseline" },
  );
  assert.deepEqual(storage.calls, []);
});

test("reload adopts the saved baseline explicitly; retrying stale state cannot overwrite it", async () => {
  const locks = makeLocks();
  const storage = makeStorage("another-tab");
  assert.equal((await write(storage, locks)).status, "conflict");
  assert.equal((await write(storage, locks)).status, "conflict");
  const reloaded = readLocalState(storage, key);
  assert.equal(reloaded.status, "read");
  assert.deepEqual(
    await write(storage, locks, reloaded.raw, "edited-after-reload"),
    { status: "saved", baselineRaw: "edited-after-reload" },
  );
});

test("deletion and unexpected creation stay conflicts inside the lock", async () => {
  const locks = makeLocks();
  assert.deepEqual(await write(makeStorage(null), locks), {
    status: "conflict",
    baselineRaw: "baseline",
    currentRaw: null,
  });
  assert.deepEqual(await write(makeStorage("created"), locks, null), {
    status: "conflict",
    baselineRaw: null,
    currentRaw: "created",
  });
  assert.deepEqual(await write(makeStorage(null), locks, null), {
    status: "saved",
    baselineRaw: "next",
  });
});

test("same-tab queued callers must advance expectedRaw only after successful completion", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  let baseline = "baseline";
  let queue = Promise.resolve();
  const enqueue = (nextRaw) => {
    const job = queue.then(async () => {
      const result = await write(storage, locks, baseline, nextRaw);
      if (result.status === "saved" || result.status === "unchanged")
        baseline = result.baselineRaw;
      return result;
    });
    queue = job.then(() => {});
    return job;
  };
  assert.deepEqual(
    (
      await Promise.all([
        enqueue("first-edit"),
        enqueue("second-edit"),
        enqueue("restored-data"),
      ])
    ).map((result) => result.status),
    ["saved", "saved", "saved"],
  );
  assert.equal(storage.values.get(key), "restored-data");
  assert.equal(baseline, "restored-data");
});

test("distinct storage keys have distinct lock resources and do not block each other", async () => {
  const locks = makeLocks();
  const storage = makeStorage();
  storage.values.set("other-key", "baseline");
  const gate = deferred();
  const acquired = deferred();
  const held = locks.request(
    statePersistenceLockName(key),
    { mode: "exclusive" },
    async () => {
      acquired.resolve();
      await gate.promise;
    },
  );
  await acquired.promise;
  assert.equal(
    (
      await write(storage, locks, "baseline", "other-next", {
        key: "other-key",
      })
    ).status,
    "saved",
  );
  gate.resolve();
  await held;
  assert.equal(storage.values.get(key), "baseline");
  assert.equal(storage.values.get("other-key"), "other-next");
});

const coordinator = (storage, locks = makeLocks(), baselineRaw = "baseline") =>
  createQueuedStatePersistence({ storage, locks, key, baselineRaw });

test("coordinator resolves each queued save baseline at execution time", async () => {
  const storage = makeStorage();
  const queue = coordinator(storage);
  const results = await Promise.all([
    queue.autosave("edit-one"),
    queue.autosave("edit-two"),
    queue.autosave("edit-three"),
  ]);
  assert.deepEqual(
    results.map((result) => result.status),
    ["saved", "saved", "saved"],
  );
  assert.equal(queue.baselineRaw(), "edit-three");
  assert.equal(storage.values.get(key), "edit-three");
  assert.deepEqual(queue.observe(), { status: "current" });
});

test("restore invalidates old queued autosaves before they request a lock", async () => {
  const storage = makeStorage();
  const locks = makeLocks();
  const queue = coordinator(storage, locks);
  const first = queue.autosave("old-one");
  const second = queue.autosave("old-two");
  const restore = queue.replace("restored");
  assert.deepEqual(
    (await Promise.all([first, second, restore])).map(
      (result) => result.status,
    ),
    ["cancelled", "cancelled", "saved"],
  );
  assert.equal(locks.calls.length, 1);
  assert.equal(storage.values.get(key), "restored");
  assert.equal((await queue.autosave("post-restore-edit")).status, "saved");
});

test("restore cancels an autosave waiting for a lock without replacing its baseline", async () => {
  const storage = makeStorage();
  const locks = makeLocks();
  const gate = deferred();
  const acquired = deferred();
  const held = locks.request(
    statePersistenceLockName(key),
    { mode: "exclusive" },
    async () => {
      acquired.resolve();
      await gate.promise;
    },
  );
  await acquired.promise;
  const queue = coordinator(storage, locks);
  const old = queue.autosave("old-edit");
  await Promise.resolve(); // The old job is queued in the lock manager.
  assert.equal(locks.calls.length, 2);
  const restored = queue.replace("restored");
  gate.resolve();
  await held;
  assert.deepEqual(
    (await Promise.all([old, restored])).map((result) => result.status),
    ["cancelled", "saved"],
  );
  assert.deepEqual(
    storage.calls.filter(([operation]) => operation === "write"),
    [["write", key, "restored"]],
  );
});

test("focus sees own committed write as pending until the lock promise settles", async () => {
  const storage = makeStorage();
  const gate = deferred();
  const committed = deferred();
  const locks = {
    async request(name, options, callback) {
      const result = callback({ name, mode: options.mode });
      committed.resolve();
      await gate.promise;
      return result;
    },
  };
  const queue = coordinator(storage, locks);
  const pending = queue.autosave("own-write");
  await committed.promise;
  assert.equal(queue.baselineRaw(), "baseline");
  assert.equal(storage.values.get(key), "own-write");
  assert.deepEqual(queue.observe(), { status: "own-write-pending" });
  storage.values.set(key, "external-write");
  assert.deepEqual(queue.observe(), {
    status: "conflict",
    currentRaw: "external-write",
  });
  gate.resolve();
  assert.equal((await pending).status, "saved");
  // Settling an own write must not adopt a different external value.
  assert.equal(queue.baselineRaw(), "own-write");
  assert.deepEqual(queue.observe(), {
    status: "conflict",
    currentRaw: "external-write",
  });
});

test("restore follows an already committed autosave using that successful baseline", async () => {
  const storage = makeStorage();
  const gate = deferred();
  const committed = deferred();
  let count = 0;
  const locks = {
    async request(name, options, callback) {
      const result = callback({ name, mode: options.mode });
      if (++count === 1) {
        committed.resolve();
        await gate.promise;
      }
      return result;
    },
  };
  const queue = coordinator(storage, locks);
  const old = queue.autosave("committed-edit");
  await committed.promise;
  const skipped = queue.autosave("obsolete-edit");
  const restored = queue.replace("restored");
  gate.resolve();
  assert.deepEqual(
    (await Promise.all([old, skipped, restored])).map(
      (result) => result.status,
    ),
    ["saved", "cancelled", "saved"],
  );
  assert.equal(storage.values.get(key), "restored");
  assert.equal(queue.baselineRaw(), "restored");
});

test("a conflict halts later queued saves and restore until an explicit reload", async () => {
  const storage = makeStorage("external");
  const queue = coordinator(storage);
  const results = await Promise.all([
    queue.autosave("first"),
    queue.autosave("second"),
  ]);
  assert.deepEqual(
    results.map((result) => result.status),
    ["conflict", "cancelled"],
  );
  assert.equal((await queue.replace("backup")).status, "cancelled");
  assert.equal(queue.baselineRaw(), "baseline");
  assert.equal(storage.values.get(key), "external");
  const reloaded = coordinator(storage, makeLocks(), storage.getItem(key));
  assert.equal((await reloaded.replace("backup")).status, "saved");
});

test("write and lock failures fail closed for every later queued job", async () => {
  for (const failure of ["write", "lock", "unavailable"]) {
    const storage = makeStorage();
    if (failure === "write")
      storage.setItem = () => {
        throw new Error("quota");
      };
    const locks =
      failure === "lock"
        ? { request: () => Promise.reject(new Error("denied")) }
        : failure === "unavailable"
          ? null
          : makeLocks();
    const queue = coordinator(storage, locks);
    const results = await Promise.all([
      queue.autosave("first"),
      queue.autosave("second"),
    ]);
    assert.equal(
      results[0].status,
      failure === "unavailable" ? "unavailable" : "error",
    );
    assert.equal(results[1].status, "cancelled");
    assert.equal((await queue.replace("restored")).status, "cancelled");
    assert.equal(queue.baselineRaw(), "baseline");
    assert.equal(storage.values.get(key), "baseline");
  }
});

test("lifecycle cancellation allows fresh work while an explicit halt does not", async () => {
  const storage = makeStorage();
  const queue = coordinator(storage);
  const obsolete = queue.autosave("obsolete");
  queue.cancelPending();
  const current = queue.autosave("current");
  assert.equal((await obsolete).status, "cancelled");
  assert.equal((await current).status, "saved");
  const queued = queue.autosave("not-saved");
  queue.halt();
  assert.equal((await queued).status, "cancelled");
  queue.cancelPending();
  assert.equal((await queue.autosave("still-blocked")).status, "cancelled");
  assert.equal(storage.values.get(key), "current");
});

test("coordinator reports unreadable storage without inventing a baseline", () => {
  const storage = makeStorage();
  const error = new Error("read denied");
  storage.getItem = () => {
    throw error;
  };
  const queue = coordinator(storage);
  assert.deepEqual(queue.observe(), { status: "error", error });
  assert.equal(queue.baselineRaw(), "baseline");
});
