import type { BodyPilotAccount, BodyPilotRole } from "./product_infrastructure";

const LOCAL_MEMBERSHIP_STORAGE_KEY = "bodypilot-local-memberships-v1";

export type BodyPilotMembershipStatus = "invited" | "active" | "revoked" | "expired";
export type BodyPilotMembershipPermission =
  | "view-logs"
  | "edit-plan"
  | "publish-updates"
  | "message-client"
  | "review-checkins"
  | "manage-schedule";

export type BodyPilotMembershipRecord = {
  id: string;
  coachId: string;
  coachName: string;
  athleteId?: string;
  athleteName: string;
  athleteEmail: string;
  status: BodyPilotMembershipStatus;
  permissions: readonly BodyPilotMembershipPermission[];
  invitedAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  lastActivityAt?: string;
};

export type BodyPilotMembershipInviteInput = {
  coachId: string;
  coachName: string;
  athleteName: string;
  athleteEmail: string;
  permissions?: readonly BodyPilotMembershipPermission[];
};

export type BodyPilotMembershipResult = {
  ok: boolean;
  message: string;
  membership?: BodyPilotMembershipRecord;
  memberships?: BodyPilotMembershipRecord[];
};

export type BodyPilotMembershipAdapter = {
  id: string;
  mode: "local" | "production";
  responsibilities: readonly string[];
  inviteClient: (input: BodyPilotMembershipInviteInput) => BodyPilotMembershipResult;
  acceptInvite: (membershipId: string, athleteAccount: Pick<BodyPilotAccount, "id" | "displayName" | "email">) => BodyPilotMembershipResult;
  revokeMembership: (membershipId: string, revokedBy: string) => BodyPilotMembershipResult;
  updatePermissions: (
    membershipId: string,
    permissions: readonly BodyPilotMembershipPermission[]
  ) => BodyPilotMembershipResult;
  listMemberships: (account: Pick<BodyPilotAccount, "id" | "role">) => readonly BodyPilotMembershipRecord[];
};

export const defaultCoachMembershipPermissions: readonly BodyPilotMembershipPermission[] = [
  "view-logs",
  "publish-updates",
  "message-client",
  "review-checkins",
  "manage-schedule",
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createMembershipId = (coachId: string, athleteEmail: string) => {
  const cleanCoach = coachId.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "coach";
  const cleanAthlete = normalizeEmail(athleteEmail).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "athlete";
  return `membership-${cleanCoach}-${cleanAthlete}-${Date.now().toString(36)}`;
};

const normalizePermissions = (
  permissions: readonly BodyPilotMembershipPermission[] | undefined
): readonly BodyPilotMembershipPermission[] => {
  const uniquePermissions = new Set(permissions?.length ? permissions : defaultCoachMembershipPermissions);
  return Array.from(uniquePermissions);
};

const membershipStatuses: readonly BodyPilotMembershipStatus[] = ["invited", "active", "revoked", "expired"];
const membershipPermissions: readonly BodyPilotMembershipPermission[] = [
  "view-logs",
  "edit-plan",
  "publish-updates",
  "message-client",
  "review-checkins",
  "manage-schedule",
];

const isMembershipStatus = (value: unknown): value is BodyPilotMembershipStatus =>
  typeof value === "string" && membershipStatuses.includes(value as BodyPilotMembershipStatus);

const isMembershipPermission = (value: unknown): value is BodyPilotMembershipPermission =>
  typeof value === "string" && membershipPermissions.includes(value as BodyPilotMembershipPermission);

export const normalizeLocalBodyPilotMembershipRecords = (value: unknown): BodyPilotMembershipRecord[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): BodyPilotMembershipRecord[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.coachId !== "string" ||
      typeof record.coachName !== "string" ||
      typeof record.athleteName !== "string" ||
      typeof record.athleteEmail !== "string" ||
      typeof record.invitedAt !== "string" ||
      !isMembershipStatus(record.status)
    ) {
      return [];
    }

    const permissions = Array.isArray(record.permissions)
      ? record.permissions.filter(isMembershipPermission)
      : defaultCoachMembershipPermissions;

    return [
      {
        id: record.id,
        coachId: record.coachId,
        coachName: record.coachName,
        athleteId: typeof record.athleteId === "string" ? record.athleteId : undefined,
        athleteName: record.athleteName,
        athleteEmail: normalizeEmail(record.athleteEmail),
        status: record.status,
        permissions: normalizePermissions(permissions),
        invitedAt: record.invitedAt,
        acceptedAt: typeof record.acceptedAt === "string" ? record.acceptedAt : undefined,
        revokedAt: typeof record.revokedAt === "string" ? record.revokedAt : undefined,
        revokedBy: typeof record.revokedBy === "string" ? record.revokedBy : undefined,
        lastActivityAt: typeof record.lastActivityAt === "string" ? record.lastActivityAt : undefined,
      },
    ];
  });
};

export const readLocalBodyPilotMembershipRecords = (): BodyPilotMembershipRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_MEMBERSHIP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeLocalBodyPilotMembershipRecords(parsed);
  } catch {
    return [];
  }
};

export const writeLocalBodyPilotMembershipRecords = (records: readonly BodyPilotMembershipRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_MEMBERSHIP_STORAGE_KEY, JSON.stringify(normalizeLocalBodyPilotMembershipRecords(records)));
};

export const clearLocalBodyPilotMembershipRecords = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_MEMBERSHIP_STORAGE_KEY);
};

export const inviteLocalBodyPilotClient = (input: BodyPilotMembershipInviteInput): BodyPilotMembershipResult => {
  const athleteEmail = normalizeEmail(input.athleteEmail);
  if (!input.coachId) return { ok: false, message: "Sign in as a coach before inviting clients." };
  if (!input.coachName.trim()) return { ok: false, message: "Add a coach name before sending an invite." };
  if (!athleteEmail || !isValidEmail(athleteEmail)) return { ok: false, message: "Enter a valid client email." };

  const records = readLocalBodyPilotMembershipRecords();
  const existing = records.find(
    (record) =>
      record.coachId === input.coachId &&
      normalizeEmail(record.athleteEmail) === athleteEmail &&
      (record.status === "invited" || record.status === "active")
  );
  if (existing) {
    return {
      ok: false,
      membership: existing,
      message: existing.status === "active" ? "That client is already connected." : "That invite is already pending.",
    };
  }

  const now = new Date().toISOString();
  const membership: BodyPilotMembershipRecord = {
    id: createMembershipId(input.coachId, athleteEmail),
    coachId: input.coachId,
    coachName: input.coachName.trim(),
    athleteName: input.athleteName.trim() || athleteEmail,
    athleteEmail,
    status: "invited",
    permissions: normalizePermissions(input.permissions),
    invitedAt: now,
    lastActivityAt: now,
  };

  writeLocalBodyPilotMembershipRecords([...records, membership]);
  return { ok: true, membership, message: "Client invite staged on this device." };
};

export const acceptLocalBodyPilotMembership = (
  membershipId: string,
  athleteAccount: Pick<BodyPilotAccount, "id" | "displayName" | "email">
): BodyPilotMembershipResult => {
  const records = readLocalBodyPilotMembershipRecords();
  const target = records.find((record) => record.id === membershipId);
  if (!target) return { ok: false, message: "Membership invite was not found." };
  if (target.status === "revoked") return { ok: false, membership: target, message: "That membership was revoked." };
  if (target.status === "expired") return { ok: false, membership: target, message: "That membership invite expired." };

  const now = new Date().toISOString();
  const membership: BodyPilotMembershipRecord = {
    ...target,
    athleteId: athleteAccount.id,
    athleteName: athleteAccount.displayName.trim() || target.athleteName,
    athleteEmail: normalizeEmail(athleteAccount.email || target.athleteEmail),
    status: "active",
    acceptedAt: target.acceptedAt ?? now,
    lastActivityAt: now,
  };

  writeLocalBodyPilotMembershipRecords(records.map((record) => (record.id === membershipId ? membership : record)));
  return { ok: true, membership, message: "Coach-client membership accepted." };
};

export const revokeLocalBodyPilotMembership = (membershipId: string, revokedBy: string): BodyPilotMembershipResult => {
  const records = readLocalBodyPilotMembershipRecords();
  const target = records.find((record) => record.id === membershipId);
  if (!target) return { ok: false, message: "Membership was not found." };

  const now = new Date().toISOString();
  const membership: BodyPilotMembershipRecord = {
    ...target,
    status: "revoked",
    revokedAt: now,
    revokedBy: revokedBy.trim() || "account-owner",
    lastActivityAt: now,
  };

  writeLocalBodyPilotMembershipRecords(records.map((record) => (record.id === membershipId ? membership : record)));
  return { ok: true, membership, message: "Membership access revoked." };
};

export const updateLocalBodyPilotMembershipPermissions = (
  membershipId: string,
  permissions: readonly BodyPilotMembershipPermission[]
): BodyPilotMembershipResult => {
  const records = readLocalBodyPilotMembershipRecords();
  const target = records.find((record) => record.id === membershipId);
  if (!target) return { ok: false, message: "Membership was not found." };
  if (target.status !== "active" && target.status !== "invited") {
    return { ok: false, membership: target, message: "Only active or pending memberships can be updated." };
  }

  const membership: BodyPilotMembershipRecord = {
    ...target,
    permissions: normalizePermissions(permissions),
    lastActivityAt: new Date().toISOString(),
  };

  writeLocalBodyPilotMembershipRecords(records.map((record) => (record.id === membershipId ? membership : record)));
  return { ok: true, membership, message: "Membership permissions updated." };
};

export const listLocalBodyPilotMemberships = (
  account: Pick<BodyPilotAccount, "id" | "role">
): readonly BodyPilotMembershipRecord[] => {
  const records = readLocalBodyPilotMembershipRecords();
  const roleFilters: Partial<Record<BodyPilotRole, (record: BodyPilotMembershipRecord) => boolean>> = {
    coach: (record) => record.coachId === account.id,
    "coached-athlete": (record) => record.athleteId === account.id,
  };
  const filter = roleFilters[account.role];
  return filter ? records.filter(filter) : [];
};

export const localBodyPilotMembershipAdapter: BodyPilotMembershipAdapter = {
  id: "bodypilot-local-membership",
  mode: "local",
  responsibilities: [
    "client invite state",
    "coach-athlete relationship acceptance",
    "membership revocation",
    "permission scope updates",
    "account-scoped roster visibility",
  ],
  inviteClient: inviteLocalBodyPilotClient,
  acceptInvite: acceptLocalBodyPilotMembership,
  revokeMembership: revokeLocalBodyPilotMembership,
  updatePermissions: updateLocalBodyPilotMembershipPermissions,
  listMemberships: listLocalBodyPilotMemberships,
};
