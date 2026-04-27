import type { AccentTone } from "./workspace_ui";

export type PlanChangeDiffItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  tone?: AccentTone;
};

export type CoachDecisionDraft = {
  title: string;
  reason: string;
  instruction: string;
  nextAction: string;
  readinessTone: AccentTone;
  readinessTitle: string;
  readinessDetail: string;
  metrics: {
    label: string;
    value: string;
    detail: string;
  }[];
  summaryLines: string[];
  queuedChanges: string[];
};

export const publishDraftTone = (tone: AccentTone) => {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50/90";
    case "amber":
      return "border-amber-200 bg-amber-50/90";
    case "rose":
      return "border-rose-200 bg-rose-50/90";
    case "sky":
      return "border-sky-200 bg-sky-50/90";
    default:
      return "border-slate-200 bg-slate-50";
  }
};

export const planDiffToneClass = (tone: AccentTone = "sky") => {
  switch (tone) {
    case "emerald":
      return {
        panel: "border-emerald-200 bg-emerald-50/85 dark:border-emerald-500/20 dark:bg-emerald-950/25",
        badge: "border-emerald-200 bg-white/85 text-emerald-700 dark:border-emerald-400/25 dark:bg-white/[0.08] dark:text-emerald-100",
      };
    case "cyan":
      return {
        panel: "border-cyan-200 bg-cyan-50/85 dark:border-cyan-500/20 dark:bg-cyan-950/25",
        badge: "border-cyan-200 bg-white/85 text-cyan-700 dark:border-cyan-400/25 dark:bg-white/[0.08] dark:text-cyan-100",
      };
    case "amber":
      return {
        panel: "border-amber-200 bg-amber-50/85 dark:border-amber-500/20 dark:bg-amber-950/25",
        badge: "border-amber-200 bg-white/85 text-amber-700 dark:border-amber-400/25 dark:bg-white/[0.08] dark:text-amber-100",
      };
    case "rose":
      return {
        panel: "border-rose-200 bg-rose-50/85 dark:border-rose-500/20 dark:bg-rose-950/25",
        badge: "border-rose-200 bg-white/85 text-rose-700 dark:border-rose-400/25 dark:bg-white/[0.08] dark:text-rose-100",
      };
    default:
      return {
        panel: "border-sky-200 bg-sky-50/85 dark:border-sky-500/20 dark:bg-sky-950/25",
        badge: "border-sky-200 bg-white/85 text-sky-700 dark:border-sky-400/25 dark:bg-white/[0.08] dark:text-sky-100",
      };
  }
};
