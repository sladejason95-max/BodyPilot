import type { CheckIn } from "@/lib/types";

const CHECKIN_KEY = "bodypilot-checkins-v1";
const LEGACY_CHECKIN_KEY = "stage-prep-checkins-v1";

export function loadCheckIns(): CheckIn[] {
  try {
    const raw = window.localStorage.getItem(CHECKIN_KEY) ?? window.localStorage.getItem(LEGACY_CHECKIN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to load check-ins", e);
    return [];
  }
}

export function saveCheckIns(checkIns: CheckIn[]) {
  try {
    window.localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkIns));
  } catch (e) {
    console.warn("Failed to save check-ins", e);
  }
}

export function appendCheckIn(checkIns: CheckIn[], entry: CheckIn, limit = 24): CheckIn[] {
  return [...checkIns, entry].slice(-limit);
}

export function removeCheckIn(checkIns: CheckIn[], id: string): CheckIn[] {
  return checkIns.filter((c) => c.id !== id);
}
