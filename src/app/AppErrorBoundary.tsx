import React from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BodyPilotLogo } from "./brand";

type AppErrorBoundaryState = {
  hasError: boolean;
  errorId: string;
};

const createErrorId = () => `BP-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
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

  componentDidCatch(_error: Error, _info: React.ErrorInfo) {
    // A production adapter can send this event to telemetry without changing the recovery UI.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-8 text-slate-950 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_84%_20%,rgba(132,204,22,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.84),rgba(239,246,255,0.74))] dark:bg-[radial-gradient(circle_at_18%_16%,rgba(14,165,233,0.2),transparent_32%),radial-gradient(circle_at_84%_20%,rgba(34,197,94,0.16),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.92))]" />
        <section className="relative w-full max-w-xl rounded-[30px] border border-white/80 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86 sm:p-8">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent dark:via-sky-400/40" />
          <div className="flex items-start justify-between gap-4">
            <BodyPilotLogo size="md" />
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-100">
              Protected
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-sky-100 bg-sky-50/80 p-5 dark:border-sky-400/20 dark:bg-sky-500/10">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-white text-sky-600 shadow-sm dark:bg-slate-950/70 dark:text-sky-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-black tracking-normal">BodyPilot recovered the workspace.</div>
                <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Your saved data stays intact. Reload the app to restore the active view.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 sm:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Recovery ID</div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{this.state.errorId}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Data status</div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">Saved locally</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="min-h-11 flex-1" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload BodyPilot
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1"
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
