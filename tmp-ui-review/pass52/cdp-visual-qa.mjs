import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = resolve(process.env.BODYPILOT_QA_OUTDIR ?? "tmp-ui-review/pass52");
const profileDir = resolve(outDir, "edge-profile");
const port = Number(process.env.BODYPILOT_QA_PORT ?? "9332");
const appUrl = process.env.BODYPILOT_QA_URL ?? "http://127.0.0.1:5177/";

mkdirSync(outDir, { recursive: true });
rmSync(profileDir, { recursive: true, force: true });

const edge = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], {
  stdio: "ignore",
  detached: false,
});

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
};

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(wsUrl);
  }

  async open() {
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", rejectOpen, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveRequest, rejectRequest } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          rejectRequest(new Error(message.error.message));
        } else {
          resolveRequest(message.result);
        }
        return;
      }

      const callbacks = this.listeners.get(message.method);
      if (callbacks) callbacks.forEach((callback) => callback(message.params));
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveRequest, rejectRequest) => {
      this.pending.set(id, { resolveRequest, rejectRequest });
    });
  }

  once(method, timeoutMs = 10000) {
    return new Promise((resolveEvent, rejectEvent) => {
      const callback = (params) => {
        clearTimeout(timeout);
        const callbacks = this.listeners.get(method) ?? [];
        this.listeners.set(method, callbacks.filter((item) => item !== callback));
        resolveEvent(params);
      };
      const timeout = setTimeout(() => {
        const callbacks = this.listeners.get(method) ?? [];
        this.listeners.set(method, callbacks.filter((item) => item !== callback));
        rejectEvent(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), callback]);
    });
  }

  close() {
    this.socket.close();
  }
}

const waitForEdge = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Edge is still booting.
    }
    await sleep(250);
  }
  throw new Error("Edge CDP did not become available.");
};

const measureExpression = `(() => {
  const width = window.innerWidth;
  const body = document.body;
  const doc = document.documentElement;
  const offenders = Array.from(document.querySelectorAll("body *"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        text: (element.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 80),
        className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
        rectRight: Math.round(rect.right),
        rectLeft: Math.round(rect.left),
        rectWidth: Math.round(rect.width),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: style.overflowX,
      };
    })
    .filter((item) => item.rectWidth > 0 && (item.rectRight > width + 1 || item.rectLeft < -1 || item.scrollWidth > item.clientWidth + 2))
    .slice(0, 12);

  return {
    url: location.href,
    title: document.title,
    innerWidth: width,
    innerHeight: window.innerHeight,
    bodyScrollWidth: body.scrollWidth,
    docScrollWidth: doc.scrollWidth,
    bodyClientWidth: body.clientWidth,
    overflow: Math.max(body.scrollWidth, doc.scrollWidth) > width + 1,
    h1: document.querySelector("h1")?.textContent?.trim() ?? "",
    textSample: body.textContent.trim().replace(/\\s+/g, " ").slice(0, 220),
    offenders,
  };
})()`;

const coachFixtureExpression = `(() => {
  const now = new Date().toISOString();
  const dayMs = 24 * 60 * 60 * 1000;
  const isoDaysAgo = (days) => new Date(Date.now() - days * dayMs).toISOString();
  const dateDaysAgo = (days) => isoDaysAgo(days).slice(0, 10);
  const activeDecisionId = "decision-coach-qa-live";
  const accountProfile = {
    id: "user-coach-qa",
    email: "coach.qa@bodypilot.app",
    displayName: "Coach QA",
    role: "coach",
    status: "signed-in",
    emailVerified: true,
    subscriptionTier: "coach",
    createdAt: now,
    lastSyncedAt: now
  };
  const membershipRecords = [
    {
      id: "membership-user-coach-qa-avery-qa",
      coachId: "user-coach-qa",
      coachName: "Coach QA",
      athleteName: "Avery P.",
      athleteEmail: "avery.qa@bodypilot.app",
      status: "invited",
      permissions: ["view-logs", "publish-updates", "message-client", "review-checkins", "manage-schedule"],
      invitedAt: now,
      lastActivityAt: now
    },
    {
      id: "membership-user-coach-qa-sam-qa",
      coachId: "user-coach-qa",
      coachName: "Coach QA",
      athleteId: "client-sam-qa",
      athleteName: "Sam R.",
      athleteEmail: "sam.qa@bodypilot.app",
      status: "active",
      permissions: ["view-logs", "edit-plan", "publish-updates", "message-client", "review-checkins", "manage-schedule"],
      invitedAt: now,
      acceptedAt: now,
      lastActivityAt: now
    }
  ];
  const publishedCoachDecisions = [
    {
      id: activeDecisionId,
      version: 2,
      athleteId: "athlete-1",
      athleteName: "Coach QA",
      createdAt: isoDaysAgo(1),
      publishedAt: isoDaysAgo(1),
      status: "published",
      title: "Hold steady until execution is clean",
      reason: "Food and basics are not complete enough to justify a larger plan change.",
      instruction: "Hold steady today. Log food, bodyweight, steps, and finish the programmed work before changing targets.",
      nextAction: "Log the first meal and close the day before the next adjustment.",
      limiter: "Dryness",
      weeksOut: 10,
      decisionConfidenceScore: 68,
      completionScore: 72,
      complianceScore: 76,
      checkInStatus: "due",
      checkInTitle: "First review is ready",
      queuedChanges: ["Keep macros unchanged until food signal is complete.", "Finish all open lifts before changing split structure."],
      summaryLines: ["Hold steady today.", "Log food and basics first.", "Coach will review once execution is clean."]
    },
    {
      id: "decision-coach-qa-prior",
      version: 1,
      athleteId: "athlete-1",
      athleteName: "Coach QA",
      createdAt: isoDaysAgo(8),
      publishedAt: isoDaysAgo(8),
      status: "acknowledged",
      title: "Protect recovery and keep output stable",
      reason: "Sleep and recovery were soft while completion was improving.",
      instruction: "Keep training load stable and protect sleep before adding intensity.",
      nextAction: "Hit the step target and keep the final set at the planned RIR.",
      limiter: "Recovery",
      weeksOut: 11,
      decisionConfidenceScore: 61,
      completionScore: 67,
      complianceScore: 70,
      checkInStatus: "soon",
      checkInTitle: "Photos due soon",
      queuedChanges: ["No cardio increase this week."],
      summaryLines: ["Keep load stable.", "Protect sleep.", "Review photos next check-in."],
      acknowledgedAt: isoDaysAgo(7),
      acknowledgmentNote: "Athlete confirmed the plan."
    }
  ];
  const coachThreadMessages = [
    {
      id: "thread-coach-qa-live-publish",
      createdAt: isoDaysAgo(1),
      athleteId: "athlete-1",
      athleteName: "Coach QA",
      author: "coach",
      body: "Published v2: Hold steady until execution is clean. Log the first meal and close the day before the next adjustment.",
      relatedDecisionId: activeDecisionId,
      deliveryStatus: "delivered",
      deliveredAt: isoDaysAgo(1)
    },
    {
      id: "thread-coach-qa-athlete-reply",
      createdAt: isoDaysAgo(0.5),
      athleteId: "athlete-1",
      athleteName: "Coach QA",
      author: "athlete",
      body: "Food is behind today. I can still close it before bed.",
      relatedDecisionId: activeDecisionId,
      deliveryStatus: "sent"
    }
  ];
  const weeklySnapshots = [
    {
      id: "snapshot-coach-qa-current",
      weekLabel: "Week 10 review",
      date: dateDaysAgo(1),
      bodyWeight: 189.2,
      condition: 8.5,
      recovery: 5.6,
      completion: 72,
      compliance: 76,
      limiter: "Dryness",
      recommendation: "Hold",
      notes: "Execution is not clean enough for an aggressive change."
    },
    {
      id: "snapshot-coach-qa-prior",
      weekLabel: "Week 11 review",
      date: dateDaysAgo(8),
      bodyWeight: 190.1,
      condition: 8.0,
      recovery: 6.1,
      completion: 67,
      compliance: 70,
      limiter: "Recovery",
      recommendation: "Protect recovery",
      notes: "Training can stay stable while sleep quality comes back up."
    }
  ];
  localStorage.setItem("bodypilot-local-memberships-v1", JSON.stringify(membershipRecords));
  localStorage.setItem("bodypilot-v1", JSON.stringify({
    dataEnvelopeVersion: 2,
    accountProfile,
    membershipRecords,
    publishedCoachDecisions,
    coachThreadMessages,
    weeklySnapshots,
    selectedAthleteId: "athlete-1",
    athleteName: "Coach QA",
    userMode: "coach",
    selfManagedAthlete: false,
    accountSetupPromptDismissed: true,
    setupGuideDismissed: true,
    showBuilderTools: true,
    showAdvancedEditors: { nutrition: false, nutritionControls: true, compounds: false, split: true, tracker: true, schedule: false },
    lastOpenedOn: new Date().toISOString().slice(0, 10),
    lastSavedAt: now
  }));
})()`;

const runScenario = async (client, scenario) => {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: scenario.width,
    height: scenario.height,
    deviceScaleFactor: 1,
    mobile: scenario.mobile,
  });
  const load = client.once("Page.loadEventFired", 15000).catch(() => null);
  await client.send("Page.navigate", { url: scenario.url });
  await load;
  await sleep(scenario.waitMs ?? 1800);
  await waitForAppReady(client);

  if (scenario.setupCoach) {
    await client.send("Runtime.evaluate", { expression: coachFixtureExpression, awaitPromise: true });
    const reload = client.once("Page.loadEventFired", 15000).catch(() => null);
    await client.send("Page.reload", { ignoreCache: true });
    await reload;
    await sleep(1800);
    await waitForAppReady(client);
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.includes("Full roster"));
        if (button) button.click();
      })()`,
      awaitPromise: true,
    });
    await sleep(700);
  }

  if (scenario.actionExpression) {
    await client.send("Runtime.evaluate", {
      expression: scenario.actionExpression,
      awaitPromise: true,
    });
    await sleep(scenario.actionWaitMs ?? 1200);
    await waitForAppReady(client);
  }

  if (scenario.scrollExpression) {
    await client.send("Runtime.evaluate", {
      expression: scenario.scrollExpression,
      awaitPromise: true,
    });
    await sleep(700);
  }

  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  writeFileSync(resolve(outDir, `${scenario.name}.png`), Buffer.from(screenshot.data, "base64"));

  const measurement = await client.send("Runtime.evaluate", {
    expression: measureExpression,
    returnByValue: true,
  });
  return {
    name: scenario.name,
    viewport: `${scenario.width}x${scenario.height}`,
    measurement: measurement.result.value,
  };
};

const waitForAppReady = async (client) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const result = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const text = document.body?.textContent ?? "";
        return {
          loading: text.includes("Loading BodyPilot") || text.includes("Preparing your coaching workspace"),
          settingsReady: text.includes("Settings"),
          coachReady: text.includes("This Athlete") || text.includes("Client access"),
          appReady: text.includes("Dashboard") || text.includes("Command Center") || text.includes("Settings"),
        };
      })()`,
      returnByValue: true,
    });
    const value = result.result.value;
    if (!value.loading && value.appReady) return;
    await sleep(250);
  }
};

try {
  const wsUrl = await waitForEdge();
  const client = new CdpClient(wsUrl);
  await client.open();
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  const scenarios = [
    {
      name: "settings-data-mobile",
      url: `${appUrl}?settings=1&settingsSection=data`,
      width: 390,
      height: 900,
      mobile: true,
      waitMs: 2200,
    },
    {
      name: "settings-data-desktop",
      url: `${appUrl}?settings=1&settingsSection=data`,
      width: 1440,
      height: 1000,
      mobile: false,
      waitMs: 1800,
    },
    {
      name: "settings-privacy-mobile",
      url: `${appUrl}?settings=1&settingsSection=privacy`,
      width: 390,
      height: 900,
      mobile: true,
      waitMs: 2200,
    },
    {
      name: "settings-privacy-desktop",
      url: `${appUrl}?settings=1&settingsSection=privacy`,
      width: 1440,
      height: 1000,
      mobile: false,
      waitMs: 1800,
    },
    {
      name: "coach-roster-mobile",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
    },
    {
      name: "coach-roster-mobile-lower",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
      scrollExpression: `(() => {
        const rosterHeading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Coach roster");
        if (rosterHeading) {
          rosterHeading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -24);
        } else {
          window.scrollTo(0, Math.round(document.body.scrollHeight * 0.45));
        }
      })()`,
    },
    {
      name: "coach-roster-mobile-access-lower",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
      scrollExpression: `(() => {
        const pendingHeading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Pending invites");
        if (pendingHeading) {
          pendingHeading.scrollIntoView({ block: "center" });
          window.scrollBy(0, 18);
        } else {
          window.scrollTo(0, Math.round(document.body.scrollHeight * 0.32));
        }
      })()`,
    },
    {
      name: "coach-roster-desktop",
      url: appUrl,
      width: 1440,
      height: 1000,
      mobile: false,
      setupCoach: true,
    },
    {
      name: "coach-tab-mobile",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
      actionExpression: `(() => {
        const dockButtons = Array.from(document.querySelectorAll(".mobile-dock button"));
        const button = dockButtons[3] ?? Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("PUBLISH") || item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
    },
    {
      name: "coach-tab-desktop",
      url: appUrl,
      width: 1440,
      height: 1000,
      mobile: false,
      setupCoach: true,
      actionExpression: `(() => {
        const button = Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
    },
    {
      name: "coach-workspace-mobile",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
      actionExpression: `(() => {
        const dockButtons = Array.from(document.querySelectorAll(".mobile-dock button"));
        const button = dockButtons[3] ?? Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("PUBLISH") || item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
      scrollExpression: `(() => {
        const heading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Coach workspace");
        if (heading) {
          heading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -18);
        }
      })()`,
    },
    {
      name: "coach-workspace-desktop",
      url: appUrl,
      width: 1440,
      height: 1000,
      mobile: false,
      setupCoach: true,
      actionExpression: `(() => {
        const button = Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
      scrollExpression: `(() => {
        const heading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Coach workspace");
        if (heading) {
          heading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -18);
        }
      })()`,
    },
    {
      name: "coach-package-builder-mobile",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
      actionExpression: `(() => {
        const dockButtons = Array.from(document.querySelectorAll(".mobile-dock button"));
        const button = dockButtons[3] ?? Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("PUBLISH") || item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
      scrollExpression: `(() => {
        const heading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Publish checkout");
        if (heading) {
          heading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -18);
        }
      })()`,
    },
    {
      name: "coach-package-builder-desktop",
      url: appUrl,
      width: 1440,
      height: 1000,
      mobile: false,
      setupCoach: true,
      actionExpression: `(() => {
        const button = Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
      scrollExpression: `(() => {
        const heading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Publish checkout");
        if (heading) {
          heading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -18);
        }
      })()`,
    },
    {
      name: "coach-review-trail-mobile",
      url: appUrl,
      width: 390,
      height: 900,
      mobile: true,
      setupCoach: true,
      actionExpression: `(() => {
        const dockButtons = Array.from(document.querySelectorAll(".mobile-dock button"));
        const button = dockButtons[3] ?? Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("PUBLISH") || item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
      scrollExpression: `(() => {
        const heading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Review trail");
        if (heading) {
          heading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -18);
        }
      })()`,
    },
    {
      name: "coach-review-trail-desktop",
      url: appUrl,
      width: 1440,
      height: 1000,
      mobile: false,
      setupCoach: true,
      actionExpression: `(() => {
        const button = Array.from(document.querySelectorAll("button"))
          .find((item) => item.textContent?.includes("Coach desk"));
        if (button) button.click();
      })()`,
      actionWaitMs: 1800,
      scrollExpression: `(() => {
        const heading = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.trim() === "Review trail");
        if (heading) {
          heading.scrollIntoView({ block: "start" });
          window.scrollBy(0, -18);
        }
      })()`,
    },
  ];

  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(client, scenario));
  }

  writeFileSync(resolve(outDir, "qa-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  client.close();
} finally {
  edge.kill();
}
