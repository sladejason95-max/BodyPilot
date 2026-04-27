import type { CheckIn, Preset } from "@/lib/types";

export type ChangeRequest = {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "approved" | "applied";
};

export type ChangeLogEntry = {
  id: string;
  actor: "coach" | "client";
  message: string;
};

export const getActiveAthleteName = (
  athletes: Array<{ id: string; name: string }>,
  activeAthleteId: string
) => athletes.find((a) => a.id === activeAthleteId)?.name || "Athlete";

export const scopeCheckInsByAthlete = (
  checkInHistory: CheckIn[],
  activeAthleteName: string
) =>
  checkInHistory.filter(
    (entry) =>
      entry.label.includes(`• ${activeAthleteName}`) ||
      (!entry.label.includes("• ") && activeAthleteName === "Jason")
  );

export const scopeChangeRequestsByAthlete = (
  changeRequests: ChangeRequest[],
  activeAthleteName: string
) =>
  changeRequests.filter(
    (request) =>
      request.title.includes(`• ${activeAthleteName}`) ||
      (!request.title.includes("• ") && activeAthleteName === "Jason")
  );

export const scopeChangeLogByAthlete = (
  changeLog: ChangeLogEntry[],
  activeAthleteName: string
) =>
  changeLog.filter(
    (entry) =>
      entry.message.includes(activeAthleteName) ||
      (!entry.message.includes("Client") && activeAthleteName === "Jason")
  );

export const scopePresetsByAthlete = (
  savedPresets: Preset[],
  activeAthleteName: string
) =>
  savedPresets.filter(
    (preset) =>
      !preset.data?.athleteName || preset.data.athleteName === activeAthleteName
  );
