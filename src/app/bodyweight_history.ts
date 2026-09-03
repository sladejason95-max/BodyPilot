export type BodyweightNumericLike = number | string | null | undefined;

/**
 * Canonical persisted bodyweight record. `date` is the athlete's local
 * calendar day. A date-only source never receives a fabricated timestamp.
 */
export type BodyweightHistoryEntry = Readonly<{
  id: string;
  date: string;
  weightLb: number;
  recordedAt: string | null;
}>;

/** Structural input accepted from persisted JSON and older app versions. */
export type BodyweightHistoryLike = {
  id?: unknown;
  date?: unknown;
  localDate?: unknown;
  weightLb?: unknown;
  bodyWeightLb?: unknown;
  bodyWeight?: unknown;
  recordedAt?: unknown;
  measuredAt?: unknown;
  timestamp?: unknown;
};

/** The subset of legacy TrackerDay used by this migration. */
export type LegacyTrackerDayBodyweightLike = {
  id?: unknown;
  date?: unknown;
  bodyWeight?: unknown;
};

export type BodyweightWeighInInput = {
  id?: string;
  date?: string;
  localDate?: string;
  weightLb: BodyweightNumericLike;
  recordedAt?: string | Date | null;
};

export type BodyweightWeeklyTrend = {
  weeklyChangeLb: number;
  weeklyChangePercent: number;
  sampleCount: number;
  daySpan: number;
  firstDate: string;
  latestDate: string;
  method: "least-squares";
};

export type BodyweightHistorySummary = {
  sampleCount: number;
  first: BodyweightHistoryEntry | null;
  latest: BodyweightHistoryEntry | null;
  changeLb: number | null;
  changePercent: number | null;
  daySpan: number;
  weeklyTrend: BodyweightWeeklyTrend | null;
};

export const BODYWEIGHT_TREND_MIN_SAMPLES = 3;
export const BODYWEIGHT_TREND_MIN_DAY_SPAN = 4;
export const BODYWEIGHT_TREND_MAX_SAMPLES = 14;

const DAY_MS = 86_400_000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const numericValue = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !NUMERIC_PATTERN.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const weightFrom = (raw: Record<string, unknown>) => {
  for (const candidate of [raw.weightLb, raw.bodyWeightLb, raw.bodyWeight]) {
    const parsed = numericValue(candidate);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
};

const validDateKey = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = DATE_KEY_PATTERN.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth ? trimmed : null;
};

const validTimestamp = (value: unknown): string | null => {
  if (typeof value === "string" && DATE_KEY_PATTERN.test(value.trim())) return null;
  if (!(typeof value === "string" || value instanceof Date)) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
};

const dateKeyFromTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Returns a local YYYY-MM-DD key without treating a date-only value as UTC. */
export const bodyweightLocalDateKey = (value: string | Date): string | null => {
  const explicitDate = validDateKey(value);
  if (explicitDate) return explicitDate;
  const timestamp = validTimestamp(value);
  return timestamp ? dateKeyFromTimestamp(timestamp) : null;
};

const normalizeEntry = (value: unknown): BodyweightHistoryEntry | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const weightLb = weightFrom(raw);
  if (weightLb === null) return null;

  const explicitDate = validDateKey(raw.localDate) ?? validDateKey(raw.date);
  const dateTimestamp = validTimestamp(raw.date);
  const recordedAt =
    validTimestamp(raw.recordedAt) ??
    validTimestamp(raw.measuredAt) ??
    validTimestamp(raw.timestamp) ??
    dateTimestamp;
  const date = explicitDate ?? (recordedAt ? dateKeyFromTimestamp(recordedAt) : null);
  if (!date) return null;

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `bodyweight:${date}`;
  return Object.freeze({ id, date, weightLb, recordedAt });
};

const timestampNumber = (entry: BodyweightHistoryEntry) =>
  entry.recordedAt ? new Date(entry.recordedAt).getTime() : null;

const preferredDuplicate = (
  current: BodyweightHistoryEntry,
  candidate: BodyweightHistoryEntry
) => {
  const currentTime = timestampNumber(current);
  const candidateTime = timestampNumber(candidate);
  if (currentTime !== null && candidateTime !== null) {
    return candidateTime >= currentTime ? candidate : current;
  }
  if (candidateTime !== null) return candidate;
  if (currentTime !== null) return current;
  return candidate;
};

const dedupeAndSort = (entries: readonly BodyweightHistoryEntry[]) => {
  const byDate = new Map<string, BodyweightHistoryEntry>();
  entries.forEach((entry) => {
    const existing = byDate.get(entry.date);
    byDate.set(entry.date, existing ? preferredDuplicate(existing, entry) : entry);
  });
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
};

/** Safely restores persisted JSON, removing invalid and duplicate day records. */
export const normalizeBodyweightHistory = (value: unknown): BodyweightHistoryEntry[] => {
  if (!Array.isArray(value)) return [];
  const entries = value
    .map(normalizeEntry)
    .filter((entry): entry is BodyweightHistoryEntry => entry !== null);
  return dedupeAndSort(entries);
};

/**
 * Migrates only bodyweights actually present on legacy tracker days. The
 * tracker's `date` remains a date; fields such as `closedAt` are intentionally
 * not repurposed as weigh-in timestamps.
 */
export const migrateLegacyTrackerBodyweights = (value: unknown): BodyweightHistoryEntry[] => {
  const root = asRecord(value);
  const trackerDays = Array.isArray(value)
    ? value
    : root && Array.isArray(root.trackerDays)
      ? root.trackerDays
      : [];

  return normalizeBodyweightHistory(
    trackerDays.map((item) => {
      const day = asRecord(item);
      if (!day) return null;
      const trackerId = typeof day.id === "string" && day.id.trim() ? day.id.trim() : null;
      return {
        id: trackerId ? `legacy-tracker:${trackerId}` : undefined,
        date: day.date,
        bodyWeight: day.bodyWeight,
      };
    })
  );
};

/**
 * Combines normalized, legacy, or partially persisted collections. A precise
 * timestamp wins over a date-only duplicate; otherwise the later collection
 * wins. There is at most one record per local calendar day.
 */
export const mergeBodyweightHistory = (...collections: readonly unknown[]): BodyweightHistoryEntry[] =>
  dedupeAndSort(collections.flatMap((collection) => normalizeBodyweightHistory(collection)));

/**
 * Adds a weigh-in or replaces the existing record for its local calendar day.
 * The caller must supply either `date`/`localDate` or `recordedAt`; this pure
 * function never manufactures "now".
 */
export const upsertBodyweightForLocalDay = (
  history: unknown,
  input: BodyweightWeighInInput
): BodyweightHistoryEntry[] => {
  const current = normalizeBodyweightHistory(history);
  const candidate = normalizeEntry(input);
  if (!candidate) return current;

  const existing = current.find((entry) => entry.date === candidate.date);
  const explicitId = typeof input.id === "string" && input.id.trim();
  const replacement = Object.freeze({
    ...candidate,
    id: explicitId ? input.id!.trim() : existing?.id ?? candidate.id,
  });
  return [...current.filter((entry) => entry.date !== candidate.date), replacement].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
};

const dayNumber = (dateKey: string) => {
  const match = DATE_KEY_PATTERN.exec(dateKey)!;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
};

const buildWeeklyTrend = (
  entries: readonly BodyweightHistoryEntry[]
): BodyweightWeeklyTrend | null => {
  const points = entries.slice(-BODYWEIGHT_TREND_MAX_SAMPLES);
  if (points.length < BODYWEIGHT_TREND_MIN_SAMPLES) return null;
  const firstDay = dayNumber(points[0].date);
  const latestDay = dayNumber(points[points.length - 1].date);
  const daySpan = latestDay - firstDay;
  if (daySpan < BODYWEIGHT_TREND_MIN_DAY_SPAN) return null;

  const normalized = points.map((entry) => ({
    x: dayNumber(entry.date) - firstDay,
    y: entry.weightLb,
  }));
  const meanX = normalized.reduce((sum, point) => sum + point.x, 0) / normalized.length;
  const meanY = normalized.reduce((sum, point) => sum + point.y, 0) / normalized.length;
  const denominator = normalized.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (denominator === 0) return null;
  const numerator = normalized.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0
  );
  const weeklyChangeLb = (numerator / denominator) * 7;
  const latestWeight = points[points.length - 1].weightLb;

  return {
    weeklyChangeLb: round(weeklyChangeLb),
    weeklyChangePercent: round((weeklyChangeLb / latestWeight) * 100),
    sampleCount: points.length,
    daySpan,
    firstDate: points[0].date,
    latestDate: points[points.length - 1].date,
    method: "least-squares",
  };
};

/** Summarizes only valid, deduplicated measurements. */
export const summarizeBodyweightHistory = (history: unknown): BodyweightHistorySummary => {
  const entries = normalizeBodyweightHistory(history);
  const first = entries[0] ?? null;
  const latest = entries[entries.length - 1] ?? null;
  const hasChange = Boolean(first && latest && entries.length >= 2);
  const changeLb = hasChange ? round(latest!.weightLb - first!.weightLb) : null;
  const changePercent = hasChange ? round((changeLb! / first!.weightLb) * 100) : null;

  return {
    sampleCount: entries.length,
    first,
    latest,
    changeLb,
    changePercent,
    daySpan: first && latest ? dayNumber(latest.date) - dayNumber(first.date) : 0,
    weeklyTrend: buildWeeklyTrend(entries),
  };
};
