// prettier-ignore
// @ts-ignore TS5097: native Node tests import this dependency without a build step.
import { optimisticWriteLocalState, readLocalState } from "./local_state_persistence.ts";
import type {
  LocalStateStorage,
  LocalStateWriteResult,
} from "./local_state_persistence";

export type GrantedStateLock = {
  readonly name: string;
  readonly mode: "exclusive" | "shared";
};

/** Structural subset of navigator.locks; injected so persistence has no browser-global dependency. */
export type StateLockManager = {
  request<T>(
    name: string,
    options: { mode: "exclusive"; signal?: AbortSignal },
    callback: (lock: GrantedStateLock | null) => T | PromiseLike<T>,
  ): Promise<T>;
};

export type TransactionalStateWriteResult =
  | LocalStateWriteResult
  | { status: "unavailable"; operation: "lock"; baselineRaw: string | null }
  | { status: "cancelled"; baselineRaw: string | null }
  | {
      status: "error";
      operation: "lock";
      baselineRaw: string | null;
      error: unknown;
    };

/** Keep this name stable across app releases so their saves coordinate with one another. */
export const statePersistenceLockName = (key: string): string =>
  `bodypilot:local-state:${key}`;

/**
 * Serialize the comparison AND replacement across cooperating tabs/workers.
 * Never fall back to an unlocked write when Web Locks are unavailable or denied.
 *
 * All current-version autosave, restore, reset, and migration writes must use
 * this boundary. Older tabs or other code that writes without the same lock do
 * not participate in its protection. This is not a database transaction, cloud
 * synchronization, a merge, or permission to overwrite after a stale conflict.
 *
 * The caller must queue jobs within its own tab and obtain each job's expectedRaw
 * from the last successful job at execution time, not when that job is enqueued.
 * Otherwise its own pending writes correctly appear stale and are rejected.
 */
export const transactionalWriteLocalState = async ({
  storage,
  key,
  expectedRaw,
  nextRaw,
  locks,
  signal,
}: {
  storage: LocalStateStorage;
  key: string;
  expectedRaw: string | null;
  nextRaw: string;
  locks: StateLockManager | null | undefined;
  signal?: AbortSignal;
}): Promise<TransactionalStateWriteResult> => {
  if (signal?.aborted) return { status: "cancelled", baselineRaw: expectedRaw };
  if (!locks) {
    return {
      status: "unavailable",
      operation: "lock",
      baselineRaw: expectedRaw,
    };
  }
  const name = statePersistenceLockName(key);
  try {
    if (typeof locks.request !== "function")
      return {
        status: "unavailable",
        operation: "lock",
        baselineRaw: expectedRaw,
      };
    return await locks.request(
      name,
      signal ? { mode: "exclusive", signal } : { mode: "exclusive" },
      (lock) => {
        if (!lock || lock.name !== name || lock.mode !== "exclusive") {
          return {
            status: "error",
            operation: "lock",
            baselineRaw: expectedRaw,
            error: new Error("An exclusive state-save lock was not granted."),
          };
        }
        if (signal?.aborted)
          return { status: "cancelled", baselineRaw: expectedRaw };
        // Deliberately synchronous while locked: no UI, network, or user prompt.
        return optimisticWriteLocalState({
          storage,
          key,
          expectedRaw,
          nextRaw,
        });
      },
    );
  } catch (error) {
    return signal?.aborted
      ? { status: "cancelled", baselineRaw: expectedRaw }
      : { status: "error", operation: "lock", baselineRaw: expectedRaw, error };
  }
};

export type PersistenceObservation =
  | { status: "current" | "own-write-pending" }
  | { status: "conflict"; currentRaw: string | null }
  | { status: "error"; error: unknown };

/** One coordinator per mounted tab. Restore invalidates older queued autosaves. */
export const createQueuedStatePersistence = ({
  storage,
  key,
  locks,
  baselineRaw,
}: {
  storage: LocalStateStorage;
  key: string;
  locks: StateLockManager | null | undefined;
  baselineRaw: string | null;
}) => {
  let baseline = baselineRaw;
  let generation = 0;
  let halted = false;
  let tail: Promise<void> = Promise.resolve();
  let inFlight: { raw: string; controller: AbortController } | null = null;
  const cancelPending = () => {
    generation += 1;
    inFlight?.controller.abort();
  };
  const halt = () => {
    halted = true;
    cancelPending();
  };
  const enqueue = (
    nextRaw: string,
    replace: boolean,
  ): Promise<TransactionalStateWriteResult> => {
    if (replace) cancelPending();
    const jobGeneration = generation;
    const job = tail.then(async (): Promise<TransactionalStateWriteResult> => {
      if (halted || jobGeneration !== generation)
        return { status: "cancelled", baselineRaw: baseline };
      const controller = new AbortController();
      inFlight = { raw: nextRaw, controller };
      const result = await transactionalWriteLocalState({
        storage,
        key,
        locks,
        expectedRaw: baseline,
        nextRaw,
        signal: controller.signal,
      });
      if (result.status === "saved" || result.status === "unchanged")
        baseline = result.baselineRaw;
      else if (result.status !== "cancelled") halt();
      inFlight = null;
      return result;
    });
    tail = job.then(
      () => {},
      () => {},
    );
    return job;
  };
  return {
    autosave: (nextRaw: string) => enqueue(nextRaw, false),
    replace: (nextRaw: string) => enqueue(nextRaw, true),
    baselineRaw: () => baseline,
    halt,
    cancelPending,
    observe: (): PersistenceObservation => {
      const read = readLocalState(storage, key);
      if (read.status === "error")
        return { status: "error", error: read.error };
      if (read.raw === baseline) return { status: "current" };
      // A lock callback may have written before its request promise settles.
      if (inFlight && read.raw === inFlight.raw)
        return { status: "own-write-pending" };
      return { status: "conflict", currentRaw: read.raw };
    },
  };
};
