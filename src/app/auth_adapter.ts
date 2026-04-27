import type { BodyPilotAccount, BodyPilotRole } from "./product_infrastructure";

const LOCAL_AUTH_STORAGE_KEY = "bodypilot-local-auth-v1";

export type BodyPilotCredentials = {
  email: string;
  password: string;
};

export type BodyPilotCreateAccountInput = BodyPilotCredentials & {
  displayName: string;
  role: BodyPilotRole;
};

export type BodyPilotAuthResult = {
  ok: boolean;
  message: string;
  account?: BodyPilotAccount;
};

export type BodyPilotAuthAdapter = {
  id: string;
  mode: "local" | "production";
  responsibilities: readonly string[];
  createAccount: typeof createLocalBodyPilotAccount;
  signIn: typeof signInLocalBodyPilotAccount;
  requestPasswordReset: typeof requestLocalBodyPilotPasswordReset;
  verifyEmail: typeof verifyLocalBodyPilotEmail;
  updateAccount: typeof updateLocalBodyPilotAccount;
  deleteAccount: typeof deleteLocalBodyPilotAccount;
};

type LocalAuthRecord = {
  account: BodyPilotAccount;
  passwordDigest: string;
  resetRequestedAt?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createAccountId = (email: string) => `user-${email.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

const createPasswordDigest = (email: string, password: string) => {
  const input = `${normalizeEmail(email)}:${password}:bodypilot-local-auth`;
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

const readRecords = (): LocalAuthRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.account?.email && item?.passwordDigest) : [];
  } catch {
    return [];
  }
};

const writeRecords = (records: LocalAuthRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(records));
};

const validateCredentials = (email: string, password: string) => {
  if (!email) return "Enter an email address.";
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (!password) return "Enter a password.";
  if (password.length < 8) return "Use at least 8 characters for the password.";
  return "";
};

export const createLocalBodyPilotAccount = (
  input: BodyPilotCreateAccountInput,
  fallbackName: string
): BodyPilotAuthResult => {
  const email = normalizeEmail(input.email);
  const credentialError = validateCredentials(email, input.password);
  if (credentialError) return { ok: false, message: credentialError };

  const records = readRecords();
  if (records.some((record) => normalizeEmail(record.account.email) === email)) {
    return { ok: false, message: "That BodyPilot account already exists. Sign in instead." };
  }

  const now = new Date().toISOString();
  const displayName = input.displayName.trim() || fallbackName;
  const account: BodyPilotAccount = {
    id: createAccountId(email),
    email,
    displayName,
    role: input.role,
    status: "email-unverified",
    emailVerified: false,
    subscriptionTier: input.role === "coach" ? "coach" : "pro",
    createdAt: now,
    lastSyncedAt: now,
  };

  writeRecords([
    ...records,
    {
      account,
      passwordDigest: createPasswordDigest(email, input.password),
    },
  ]);

  return { ok: true, account, message: "Account created. Verify email to finish setup." };
};

export const signInLocalBodyPilotAccount = (credentials: BodyPilotCredentials): BodyPilotAuthResult => {
  const email = normalizeEmail(credentials.email);
  const credentialError = validateCredentials(email, credentials.password);
  if (credentialError) return { ok: false, message: credentialError };

  const records = readRecords();
  const match = records.find((record) => normalizeEmail(record.account.email) === email);
  if (!match) return { ok: false, message: "No BodyPilot account found for that email. Create one first." };

  if (match.passwordDigest !== createPasswordDigest(email, credentials.password)) {
    return { ok: false, message: "Password does not match this BodyPilot account." };
  }

  const account: BodyPilotAccount = {
    ...match.account,
    status: match.account.emailVerified ? "signed-in" : "email-unverified",
    lastSyncedAt: new Date().toISOString(),
  };
  writeRecords(records.map((record) => (record.account.id === account.id ? { ...record, account } : record)));

  return {
    ok: true,
    account,
    message: account.emailVerified
      ? "Signed in on this device."
      : "Password accepted. Verify email to finish account setup.",
  };
};

export const requestLocalBodyPilotPasswordReset = (emailInput: string): BodyPilotAuthResult => {
  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false, message: "Enter the account email first." };
  if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address." };

  const records = readRecords();
  const requestedAt = new Date().toISOString();
  writeRecords(
    records.map((record) =>
      normalizeEmail(record.account.email) === email ? { ...record, resetRequestedAt: requestedAt } : record
    )
  );

  return {
    ok: true,
    message: `If ${email} has a BodyPilot account, a reset email will be sent.`,
  };
};

export const verifyLocalBodyPilotEmail = (currentAccount: BodyPilotAccount): BodyPilotAuthResult => {
  const email = normalizeEmail(currentAccount.email);
  if (!email || currentAccount.status === "signed-out") {
    return { ok: false, message: "Create or sign in to an account before verifying email." };
  }

  const account: BodyPilotAccount = {
    ...currentAccount,
    status: "signed-in",
    emailVerified: true,
    lastSyncedAt: new Date().toISOString(),
  };
  const records = readRecords();
  const hasRecord = records.some((record) => record.account.id === account.id);
  writeRecords(
    hasRecord
      ? records.map((record) => (record.account.id === account.id ? { ...record, account } : record))
      : records
  );

  return { ok: true, account, message: "Email verified. BodyPilot account setup is complete on this device." };
};

export const updateLocalBodyPilotAccount = (
  currentAccount: BodyPilotAccount,
  patch: Partial<BodyPilotAccount>
): BodyPilotAuthResult => {
  const nextEmail = patch.email ? normalizeEmail(patch.email) : currentAccount.email;
  if (nextEmail && !isValidEmail(nextEmail)) return { ok: false, message: "Enter a valid email address." };

  const account: BodyPilotAccount = {
    ...currentAccount,
    ...patch,
    email: nextEmail,
    displayName: patch.displayName?.trim() || currentAccount.displayName,
    lastSyncedAt: new Date().toISOString(),
  };
  const records = readRecords();
  const currentIndex = records.findIndex((record) => record.account.id === currentAccount.id);

  if (currentIndex >= 0) {
    const nextRecords = [...records];
    nextRecords[currentIndex] = { ...nextRecords[currentIndex], account };
    writeRecords(nextRecords);
  }

  return { ok: true, account, message: "Profile saved." };
};

export const deleteLocalBodyPilotAccount = (
  currentAccount: BodyPilotAccount,
  emailInput = currentAccount.email
): BodyPilotAuthResult => {
  const email = normalizeEmail(emailInput);
  const hasSignedInIdentity = currentAccount.status !== "signed-out" && Boolean(currentAccount.id);

  if (!email && !hasSignedInIdentity) {
    return { ok: false, message: "Create or sign in to an account before deleting it." };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, message: "Enter a valid account email before deleting." };
  }

  const records = readRecords();
  const nextRecords = records.filter((record) => {
    const sameEmail = email ? normalizeEmail(record.account.email) === email : false;
    const sameId = hasSignedInIdentity ? record.account.id === currentAccount.id : false;
    return !sameEmail && !sameId;
  });

  writeRecords(nextRecords);

  return {
    ok: true,
    account: { ...defaultDeletedAccount(), displayName: "BodyPilot athlete" },
    message: email
      ? `Account deletion started for ${email}. Local account records and associated workspace data will be removed from this device.`
      : "Account deletion started. Local account records and associated workspace data will be removed from this device.",
  };
};

const defaultDeletedAccount = (): BodyPilotAccount => ({
  id: "local-athlete",
  email: "",
  displayName: "BodyPilot athlete",
  role: "self-managed-athlete",
  status: "signed-out",
  emailVerified: false,
  subscriptionTier: "pro",
  createdAt: new Date().toISOString(),
});

export const localBodyPilotAuthAdapter: BodyPilotAuthAdapter = {
  id: "bodypilot-local-auth",
  mode: "local",
  responsibilities: [
    "email/password validation",
    "local account storage",
    "email verification simulation",
    "password reset simulation",
    "profile metadata updates",
    "local account deletion",
  ],
  createAccount: createLocalBodyPilotAccount,
  signIn: signInLocalBodyPilotAccount,
  requestPasswordReset: requestLocalBodyPilotPasswordReset,
  verifyEmail: verifyLocalBodyPilotEmail,
  updateAccount: updateLocalBodyPilotAccount,
  deleteAccount: deleteLocalBodyPilotAccount,
};
