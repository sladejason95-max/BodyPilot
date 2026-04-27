import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/app/App";
import AppErrorBoundary from "@/app/AppErrorBoundary";
import "./index.css";

const BODY_PILOT_CACHE_PREFIX = "bodypilot-";
const DEV_SERVICE_WORKER_RELOAD_KEY = "bodypilot-dev-service-worker-cleared";

const clearBodyPilotCaches = () => {
  if (!("caches" in window)) return Promise.resolve();

  return window.caches
    .keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(BODY_PILOT_CACHE_PREFIX))
          .map((key) => window.caches.delete(key))
      )
    )
    .then(() => undefined);
};

const unregisterServiceWorkersInDev = () => {
  if (import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const wasControlledByServiceWorker = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(clearBodyPilotCaches)
      .then(() => {
        if (
          wasControlledByServiceWorker &&
          window.sessionStorage.getItem(DEV_SERVICE_WORKER_RELOAD_KEY) !== "true"
        ) {
          window.sessionStorage.setItem(DEV_SERVICE_WORKER_RELOAD_KEY, "true");
          window.location.reload();
        }
      })
      .catch(() => undefined);
  });
};

const registerServiceWorker = () => {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update())
      .catch(() => undefined);
  });
};

function BootReadyApp() {
  React.useEffect(() => {
    document.body.setAttribute("data-app-ready", "true");

    const bootShell = document.getElementById("boot-shell");
    if (!bootShell) return;

    const cleanupTimer = window.setTimeout(() => {
      bootShell.remove();
    }, 260);

    return () => {
      window.clearTimeout(cleanupTimer);
    };
  }, []);

  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BootReadyApp />
  </React.StrictMode>
);

unregisterServiceWorkersInDev();
registerServiceWorker();
