import crypto from "node:crypto";
import http from "node:http";
import { URLSearchParams } from "node:url";

const port = Number.parseInt(process.env.BODYPILOT_API_PORT || process.env.PORT || "8787", 10);
const appBaseUrl = process.env.BODYPILOT_APP_BASE_URL || "http://127.0.0.1:4177";
const environmentName = process.env.BODYPILOT_ENV || process.env.NODE_ENV || "local";
const isProduction = /^(prod|production)$/i.test(environmentName);
const emailProvider = (process.env.BODYPILOT_EMAIL_PROVIDER || "console").toLowerCase();
const emailFrom = process.env.BODYPILOT_EMAIL_FROM || "support@bodypilot.app";

const auditEvents = [];
const jobQueue = [];

const hasValue = (value) => Boolean(value && String(value).trim());

const createId = (prefix) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

const nowIso = () => new Date().toISOString();

const configStatus = (keys) => {
  const missing = keys.filter((key) => !hasValue(process.env[key]));
  return {
    ready: missing.length === 0,
    missing,
  };
};

const connectorHealth = () => {
  const auth = configStatus(["AUTH_JWT_SECRET"]);
  const database = configStatus(["DATABASE_URL"]);
  const storage = configStatus(["BODYPILOT_STORAGE_BUCKET"]);
  const email =
    emailProvider === "resend"
      ? configStatus(["RESEND_API_KEY"])
      : emailProvider === "postmark"
        ? configStatus(["POSTMARK_SERVER_TOKEN"])
        : { ready: !isProduction, missing: isProduction ? ["RESEND_API_KEY or POSTMARK_SERVER_TOKEN"] : [] };
  const stripe = configStatus(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  const jobs = configStatus(["BODYPILOT_JOB_SIGNING_SECRET"]);
  const observability = configStatus(["VITE_BODYPILOT_SENTRY_DSN"]);

  return [
    {
      system: "API gateway",
      status: "ready",
      detail: `HTTP server online in ${environmentName} mode.`,
    },
    {
      system: "Auth signing",
      status: auth.ready ? "ready" : "blocked",
      detail: auth.ready ? "AUTH_JWT_SECRET configured." : `Missing ${auth.missing.join(", ")}.`,
    },
    {
      system: "Cloud database",
      status: database.ready ? "ready" : "blocked",
      detail: database.ready ? "DATABASE_URL configured." : `Missing ${database.missing.join(", ")}.`,
    },
    {
      system: "Object storage",
      status: storage.ready ? "ready" : "blocked",
      detail: storage.ready ? "Storage bucket configured." : `Missing ${storage.missing.join(", ")}.`,
    },
    {
      system: "Transactional email",
      status: email.ready ? "ready" : "blocked",
      detail: email.ready ? `${emailProvider} delivery available.` : `Missing ${email.missing.join(", ")}.`,
    },
    {
      system: "Stripe payments",
      status: stripe.ready ? "ready" : isProduction ? "blocked" : "local",
      detail: stripe.ready
        ? "Checkout and webhook verification configured."
        : isProduction
          ? `Missing ${stripe.missing.join(", ")}.`
          : "Demo checkout mode active until Stripe keys are configured.",
    },
    {
      system: "Background jobs",
      status: jobs.ready ? "ready" : isProduction ? "blocked" : "local",
      detail: jobs.ready
        ? "Job signing secret configured."
        : isProduction
          ? `Missing ${jobs.missing.join(", ")}.`
          : "In-memory local queue active.",
    },
    {
      system: "Observability",
      status: observability.ready ? "ready" : "blocked",
      detail: observability.ready ? "Observability DSN configured." : `Missing ${observability.missing.join(", ")}.`,
    },
  ];
};

const healthPayload = () => {
  const connectors = connectorHealth();
  return {
    service: "bodypilot-live-api",
    environment: environmentName,
    time: nowIso(),
    status: connectors.some((item) => item.status === "blocked") ? "attention" : "ready",
    connectors,
    queue: {
      total: jobQueue.length,
      queued: jobQueue.filter((job) => job.status === "queued").length,
      leased: jobQueue.filter((job) => job.status === "leased").length,
      completed: jobQueue.filter((job) => job.status === "completed").length,
      failed: jobQueue.filter((job) => job.status === "failed").length,
    },
  };
};

if (process.argv.includes("--check")) {
  process.stdout.write(`${JSON.stringify(healthPayload(), null, 2)}\n`);
  process.exit(0);
}

const sendJson = (res, statusCode, payload, headers = {}) => {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": process.env.BODYPILOT_CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "content-type, authorization, stripe-signature",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const parseJson = (rawBody) => {
  if (!rawBody.length) return {};
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON body.");
    error.statusCode = 400;
    throw error;
  }
};

const addAuditEvent = (source, type, detail) => {
  const event = {
    id: createId("audit"),
    source,
    type,
    detail,
    occurredAt: nowIso(),
  };
  auditEvents.unshift(event);
  auditEvents.splice(100);
  return event;
};

const enqueueJob = (type, payload, source = "api") => {
  const job = {
    id: createId("job"),
    type,
    payload,
    source,
    status: "queued",
    attempts: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  jobQueue.unshift(job);
  addAuditEvent("jobs", "job.queued", { jobId: job.id, type, source });
  return job;
};

const requireProductionConfig = (res, keys, label) => {
  const missing = keys.filter((key) => !hasValue(process.env[key]));
  if (missing.length === 0) return false;
  if (!isProduction) return false;

  sendJson(res, 503, {
    error: `${label} is not configured for production.`,
    missing,
  });
  return true;
};

const postJson = async (url, headers, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `Request failed with ${response.status}.`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

const postForm = async (url, token, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(payload.error?.message || `Stripe request failed with ${response.status}.`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

const handleEmailSend = async (body) => {
  const to = String(body.to || body.email || "").trim();
  const subject = String(body.subject || "").trim();
  const text = String(body.text || body.body || "").trim();
  const html = body.html ? String(body.html) : undefined;

  if (!to || !subject || (!text && !html)) {
    const error = new Error("Email requires to, subject, and text or html.");
    error.statusCode = 400;
    throw error;
  }

  if (emailProvider === "resend" && hasValue(process.env.RESEND_API_KEY)) {
    const payload = await postJson(
      "https://api.resend.com/emails",
      { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      { from: emailFrom, to, subject, text: text || undefined, html }
    );
    addAuditEvent("email", "email.sent", { provider: "resend", to, subject });
    return { mode: "resend", providerId: payload.id, status: "sent" };
  }

  if (emailProvider === "postmark" && hasValue(process.env.POSTMARK_SERVER_TOKEN)) {
    const payload = await postJson(
      "https://api.postmarkapp.com/email",
      {
        "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN,
      },
      {
        From: emailFrom,
        To: to,
        Subject: subject,
        TextBody: text || undefined,
        HtmlBody: html,
      }
    );
    addAuditEvent("email", "email.sent", { provider: "postmark", to, subject });
    return { mode: "postmark", providerId: payload.MessageID, status: "sent" };
  }

  if (isProduction) {
    const error = new Error("Production email requires RESEND_API_KEY or POSTMARK_SERVER_TOKEN.");
    error.statusCode = 503;
    throw error;
  }

  const messageId = createId("email");
  addAuditEvent("email", "email.console", { messageId, to, subject });
  console.log(`[bodypilot-email:${messageId}] to=${to} subject=${subject}`);
  return { mode: "console", providerId: messageId, status: "queued" };
};

const handleCheckout = async (body) => {
  const tier = body.tier === "coach" ? "coach" : "pro";
  const priceId = tier === "coach" ? process.env.BODYPILOT_PRICE_COACH : process.env.BODYPILOT_PRICE_PRO;
  const customerEmail = String(body.email || "").trim();

  if (hasValue(process.env.STRIPE_SECRET_KEY) && hasValue(priceId)) {
    const payload = await postForm("https://api.stripe.com/v1/checkout/sessions", process.env.STRIPE_SECRET_KEY, {
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${appBaseUrl}/?billing=success&tier=${tier}`,
      cancel_url: `${appBaseUrl}/?billing=cancelled&tier=${tier}`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      "metadata[product]": "bodypilot",
      "metadata[tier]": tier,
    });
    addAuditEvent("payments", "checkout.created", { tier, sessionId: payload.id });
    return { mode: "stripe", checkoutUrl: payload.url, sessionId: payload.id };
  }

  if (isProduction) {
    const error = new Error("Production checkout requires STRIPE_SECRET_KEY and a tier price id.");
    error.statusCode = 503;
    throw error;
  }

  const sessionId = createId("demo_checkout");
  addAuditEvent("payments", "checkout.demo", { tier, sessionId });
  return {
    mode: "demo",
    checkoutUrl: `${appBaseUrl}/?billing=demo&tier=${tier}&session=${sessionId}`,
    sessionId,
  };
};

const timingSafeEqualHex = (expectedHex, actualHex) => {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
};

const verifyStripeSignature = (rawBody, signatureHeader) => {
  if (!hasValue(process.env.STRIPE_WEBHOOK_SECRET)) {
    return { verified: false, reason: "STRIPE_WEBHOOK_SECRET missing" };
  }

  const parts = String(signatureHeader || "")
    .split(",")
    .map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return { verified: false, reason: "Stripe signature header missing t or v1" };

  const driftSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(driftSeconds) || driftSeconds > 300) {
    return { verified: false, reason: "Stripe signature timestamp outside tolerance" };
  }

  const expected = crypto
    .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");

  return signatures.some((signature) => timingSafeEqualHex(expected, signature))
    ? { verified: true }
    : { verified: false, reason: "Stripe signature mismatch" };
};

const handleStripeWebhook = (rawBody, headers) => {
  const verification = verifyStripeSignature(rawBody, headers["stripe-signature"]);
  if (!verification.verified && isProduction) {
    const error = new Error(verification.reason || "Stripe webhook signature verification failed.");
    error.statusCode = hasValue(process.env.STRIPE_WEBHOOK_SECRET) ? 400 : 503;
    throw error;
  }

  const event = parseJson(rawBody);
  const auditEvent = addAuditEvent("stripe", event.type || "stripe.event", {
    verified: verification.verified,
    stripeEventId: event.id || null,
    livemode: Boolean(event.livemode),
  });

  if (event.type?.startsWith("checkout.") || event.type?.startsWith("customer.subscription.")) {
    enqueueJob("payments.refresh-entitlement", { stripeEventId: event.id, type: event.type }, "stripe");
  }

  return {
    received: true,
    verified: verification.verified,
    auditEventId: auditEvent.id,
  };
};

const handleRequest = async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  if (req.method === "GET" && url.pathname === "/") {
    sendJson(res, 200, {
      service: "bodypilot-live-api",
      endpoints: [
        "GET /api/health",
        "POST /api/email/send",
        "POST /api/payments/checkout",
        "POST /api/webhooks/stripe",
        "POST /api/jobs/enqueue",
        "POST /api/jobs/next",
        "POST /api/jobs/complete",
        "GET /api/jobs",
        "POST /api/privacy/delete",
      ],
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, healthPayload());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/jobs") {
    sendJson(res, 200, { jobs: jobQueue.slice(0, 100), auditEvents });
    return;
  }

  const rawBody = await readBody(req);
  const body = url.pathname === "/api/webhooks/stripe" ? null : parseJson(rawBody);

  if (req.method === "POST" && url.pathname === "/api/email/send") {
    if (requireProductionConfig(res, ["BODYPILOT_EMAIL_FROM"], "Email sender")) return;
    sendJson(res, 202, await handleEmailSend(body));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/payments/checkout") {
    if (isProduction && requireProductionConfig(res, ["STRIPE_SECRET_KEY"], "Payment checkout")) return;
    sendJson(res, 200, await handleCheckout(body));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/stripe") {
    sendJson(res, 200, handleStripeWebhook(rawBody, req.headers));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs/enqueue") {
    const type = String(body.type || "").trim();
    if (!type) {
      sendJson(res, 400, { error: "Job type is required." });
      return;
    }
    sendJson(res, 202, { job: enqueueJob(type, body.payload ?? {}, body.source || "api") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs/next") {
    const job = jobQueue.find((item) => item.status === "queued");
    if (!job) {
      sendJson(res, 200, { job: null });
      return;
    }
    job.status = "leased";
    job.attempts += 1;
    job.updatedAt = nowIso();
    job.leasedAt = job.updatedAt;
    addAuditEvent("jobs", "job.leased", { jobId: job.id, type: job.type });
    sendJson(res, 200, { job });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs/complete") {
    const id = String(body.id || "").trim();
    const job = jobQueue.find((item) => item.id === id);
    if (!job) {
      sendJson(res, 404, { error: "Job not found." });
      return;
    }
    job.status = body.status === "failed" ? "failed" : "completed";
    job.result = body.result ?? null;
    job.updatedAt = nowIso();
    addAuditEvent("jobs", job.status === "failed" ? "job.failed" : "job.completed", { jobId: job.id, type: job.type });
    sendJson(res, 200, { job });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/privacy/delete") {
    const email = String(body.email || "").trim();
    const accountId = String(body.accountId || "").trim();
    if (!email && !accountId) {
      sendJson(res, 400, { error: "Deletion requires email or accountId." });
      return;
    }
    const receiptId = createId("privacy");
    const job = enqueueJob(
      "privacy.delete-account",
      {
        receiptId,
        email: email || null,
        accountId: accountId || null,
        requestedAt: nowIso(),
        scope: ["auth", "database", "storage", "billing-entitlements", "email-lists"],
      },
      "privacy"
    );
    addAuditEvent("privacy", "deletion.requested", { receiptId, jobId: job.id, email: email || null, accountId: accountId || null });
    sendJson(res, 202, {
      receiptId,
      jobId: job.id,
      status: "queued",
      detail: "Deletion was queued. A production worker must verify identity, revoke access, delete scoped records, and send a receipt.",
    });
    return;
  }

  sendJson(res, 404, { error: "Endpoint not found." });
};

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
      error: error.message || "Unexpected server error.",
      detail: error.payload ?? undefined,
    });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`BodyPilot live API listening on http://127.0.0.1:${port}`);
});
