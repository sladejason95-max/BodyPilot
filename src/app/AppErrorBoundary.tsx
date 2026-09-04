import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BodyPilotLogo } from "./brand";

type AppErrorBoundaryState = {
  hasError: boolean;
  errorId: string;
};

const createErrorId = () =>
  `BP-${new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14)}`;

export default class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorId: "",
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      errorId: createErrorId(),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const payload = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      occurredAt: new Date().toISOString(),
    };

    console.error("BodyPilot encountered a render error", payload);

    try {
      window.localStorage.setItem(
        "bodypilot:last-render-error",
        JSON.stringify(payload),
      );
    } catch {
      // Recovery UI should still render if storage is unavailable.
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-dvh place-items-center bg-[#111315] px-4 py-6 text-slate-100">
        <section className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1a1d20] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <BodyPilotLogo size="md" />
            <div className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-200">
              View error
            </div>
          </div>

          <div
            className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-4"
            role="alert"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400/10 text-amber-200">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  This view could not load.
                </h1>
                <div className="mt-1 text-sm leading-6 text-slate-300">
                  We have not verified the latest save. Reload to reopen saved
                  data; recent unsaved edits may not be available.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-white/10 p-4 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Error ID
              </div>
              <div className="mt-1 font-semibold text-slate-100">
                {this.state.errorId}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Data status
              </div>
              <div className="mt-1 font-semibold text-slate-100">
                Latest save not verified
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              className="min-h-11 flex-1"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload BodyPilot
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1 border-white/15 bg-transparent text-slate-100 hover:bg-white/10 hover:text-white"
              onClick={() => {
                window.location.href = `mailto:support@bodypilot.app?subject=BodyPilot%20recovery%20${encodeURIComponent(this.state.errorId)}`;
              }}
            >
              Contact support
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
