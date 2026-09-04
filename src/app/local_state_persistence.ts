export type LocalStateStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type LocalStateReadResult =
  | { status: "read"; raw: string | null }
  | { status: "error"; operation: "read"; error: unknown };

export type LocalStateWriteResult =
  | { status: "saved" | "unchanged"; baselineRaw: string }
  | {
      status: "conflict";
      baselineRaw: string | null;
      currentRaw: string | null;
    }
  | {
      status: "error";
      baselineRaw: string | null;
      operation: "read" | "write";
      error: unknown;
    };

/** A failed read is not equivalent to an empty store. */
export const readLocalState = (
  storage: Pick<LocalStateStorage, "getItem">,
  key: string,
): LocalStateReadResult => {
  try {
    return { status: "read", raw: storage.getItem(key) };
  } catch (error) {
    return { status: "error", operation: "read", error };
  }
};

/**
 * Only replace the exact serialized state the caller last read or saved.
 * Do not advance the caller's baseline after a conflict or error: doing so would
 * let a retry silently overwrite the newer state without reloading or merging it.
 *
 * This guards stale-tab writes, not simultaneous cross-tab transactions:
 * localStorage has no atomic compare-and-swap between this read and write.
 */
export const optimisticWriteLocalState = ({
  storage,
  key,
  expectedRaw,
  nextRaw,
}: {
  storage: LocalStateStorage;
  key: string;
  expectedRaw: string | null;
  nextRaw: string;
}): LocalStateWriteResult => {
  const read = readLocalState(storage, key);
  if (read.status === "error") {
    return {
      status: "error",
      baselineRaw: expectedRaw,
      operation: "read",
      error: read.error,
    };
  }
  if (read.raw === nextRaw) {
    return { status: "unchanged", baselineRaw: nextRaw };
  }
  if (read.raw !== expectedRaw) {
    return {
      status: "conflict",
      baselineRaw: expectedRaw,
      currentRaw: read.raw,
    };
  }
  try {
    storage.setItem(key, nextRaw);
    return { status: "saved", baselineRaw: nextRaw };
  } catch (error) {
    return {
      status: "error",
      baselineRaw: expectedRaw,
      operation: "write",
      error,
    };
  }
};
