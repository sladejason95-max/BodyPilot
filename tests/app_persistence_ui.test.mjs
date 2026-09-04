import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let server;
let App;
let AppErrorBoundary;
let defaultState;
const key = "bodypilot-ai-v4";
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(
  globalThis,
  "navigator",
);

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    appType: "custom",
    logLevel: "error",
  });
  ({ default: App, defaultState } =
    await server.ssrLoadModule("/src/app/App.tsx"));
  ({ default: AppErrorBoundary } = await server.ssrLoadModule(
    "/src/app/AppErrorBoundary.tsx",
  ));
});

after(async () => {
  if (originalWindow)
    Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
  if (originalNavigator)
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  else delete globalThis.navigator;
  await server?.close();
});

const renderApp = ({
  raw = JSON.stringify(defaultState),
  locks = null,
  readError = false,
} = {}) => {
  const writes = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { hash: "#more" },
      localStorage: {
        getItem(name) {
          if (readError) throw new Error("Storage access denied");
          return name === key ? raw : null;
        },
        setItem(...args) {
          writes.push(args);
        },
      },
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { locks },
  });
  // This exercises the real render and initial guards, not effects or events.
  return { html: renderToStaticMarkup(React.createElement(App)), writes };
};

test("real App renders export-only recovery when Web Locks are unavailable", () => {
  const { html, writes } = renderApp();
  assert.match(html, /Saving is paused/);
  assert.match(html, /Safe saving is unavailable in this browser/);
  assert.match(html, /Download this tab&#x27;s copy/);
  assert.doesNotMatch(html, /Choose backup to restore/);
  assert.deepEqual(writes, []);
});

test("a partial or denied lock API also renders read-only on the first render", () => {
  for (const locks of [
    {},
    {
      get request() {
        throw new Error("Denied");
      },
    },
  ]) {
    const { html, writes } = renderApp({ locks });
    assert.match(html, /Safe saving is unavailable in this browser/);
    assert.deepEqual(writes, []);
  }
});

test("real App keeps corrupt original recovery export and blocks unsafe restore", () => {
  const { html, writes } = renderApp({ raw: "{broken saved record" });
  assert.match(html, /Your saved data needs attention/);
  assert.match(html, /Export original recovery copy/);
  assert.match(html, /Export keeps its original contents/);
  assert.match(html, /disabled=""[^>]*>.*?Choose backup to restore/s);
  assert.doesNotMatch(html, />Export backup</);
  assert.deepEqual(writes, []);
});

test("a damaged record offers fresh start without requiring a backup file", () => {
  const { html, writes } = renderApp({
    raw: "{broken saved record",
    locks: { request() { throw new Error("Rendering must not replace stored data"); } },
  });
  assert.match(html, /Start fresh on this device/);
  assert.match(html, /no backup file is required/);
  assert.match(html, /Export original recovery copy/);
  assert.deepEqual(writes, []);
});

test("a first visit with empty storage opens the workspace without recovery", () => {
  const { html, writes } = renderApp({
    raw: null,
    locks: { request() { throw new Error("Rendering must not write storage"); } },
  });
  assert.match(html, /Weight|Schedule/);
  assert.doesNotMatch(html, /Your saved data needs attention|Saving is paused|Start fresh on this device/);
  assert.deepEqual(writes, []);
});

test("real App does not offer a default-state backup when storage cannot be read", () => {
  const { html, writes } = renderApp({ readError: true });
  assert.match(html, /Your saved data needs attention/);
  assert.doesNotMatch(
    html,
    /Export backup|Download this tab|Choose backup to restore/,
  );
  assert.deepEqual(writes, []);
});

test("supported lock manager leaves normal backup workflow available", () => {
  const { html, writes } = renderApp({
    locks: {
      request() {
        throw new Error("SSR must not save");
      },
    },
  });
  assert.match(html, /Backup &amp; restore/);
  assert.match(html, /Choose backup to restore/);
  assert.doesNotMatch(html, /Safe saving is unavailable|Saving is paused/);
  assert.deepEqual(writes, []);
});

test("error boundary explains an unverified save without claiming recovery", () => {
  const boundary = new AppErrorBoundary({ children: null });
  boundary.state = { hasError: true, errorId: "BP-test" };
  const html = renderToStaticMarkup(boundary.render());
  assert.match(html, /This view could not load/);
  assert.match(html, /Latest save not verified/);
  assert.match(html, /recent unsaved edits may not be available/);
  assert.doesNotMatch(
    html,
    /Protected|recovered the workspace|Plan saved locally|bg-white\/88|radial-gradient/,
  );
  assert.match(html, /bg-\[#111315\]/);
});
