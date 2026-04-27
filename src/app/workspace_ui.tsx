import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { panelHoverClass } from "./constants";

const frostedPanelClass =
  "premium-surface";

const premiumInsetLine =
  "pointer-events-none absolute inset-x-4 top-0 h-px bg-white/75 dark:bg-white/10";

export const AnalyticsStat = (props: { label: string; value: string | number; helper?: string; tone?: string }) => {
  const { label, value, helper, tone } = props;

  return (
    <div className={`p-4 ${frostedPanelClass}`}>
      <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${tone ?? "premium-badge-secondary"}`}>
        {label}
      </div>
      <div className="relative mt-3 text-[1.7rem] font-semibold tracking-normal text-slate-950 dark:text-slate-100">{value}</div>
      {helper ? <div className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-400">{helper}</div> : null}
    </div>
  );
};

export const SectionCard = (props: { title: string; description?: string; right?: React.ReactNode; children: React.ReactNode }) => {
  const { title, description, right, children } = props;

  return (
    <section className={frostedPanelClass}>
      <div className={premiumInsetLine} />
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</div>
            {description ? <div className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-400">{description}</div> : null}
          </div>
          {right ? <div className="w-full sm:w-auto sm:shrink-0">{right}</div> : null}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
};

export const ChartCard = (props: { title: string; description?: string; right?: React.ReactNode; children: React.ReactNode }) => {
  const { title, description, right, children } = props;

  return (
    <div className={`p-4 sm:p-5 ${frostedPanelClass} ${panelHoverClass}`}>
      <div className={premiumInsetLine} />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="premium-badge-secondary inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase">
            Signal line
          </div>
          <div className="mt-2 text-base font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</div>
          {description ? <div className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
};

export const HeroPill = (props: { Icon: React.ComponentType<any>; label: string; value: string }) => {
  const { Icon, label, value } = props;

  return (
    <div className="premium-context-chip inline-flex min-w-0 items-center gap-2.5 rounded-full px-3 py-2 sm:min-w-[145px]">
      <div className="view-story-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</div>
        <div className="truncate text-sm font-semibold tracking-normal text-slate-950 dark:text-slate-100">{value}</div>
      </div>
    </div>
  );
};

export const scoreChipClass = (value: number) => {
  if (value >= 8) return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  if (value >= 5) return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200";
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200";
};

export const sectionToneClass = (tone: "primary" | "secondary" | "muted" = "secondary") => {
  if (tone === "primary") {
    return "premium-surface";
  }
  if (tone === "muted") {
    return "premium-soft-surface";
  }
  return "premium-surface";
};

export const surfaceToneClass = (tone: "primary" | "secondary" | "muted" = "secondary") => {
  if (tone === "primary") {
    return "premium-surface";
  }
  if (tone === "muted") {
    return "premium-soft-surface";
  }
  return "premium-surface";
};

export const AdvancedEditorCard = (props: {
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  summary?: string;
  children: React.ReactNode;
}) => {
  const { title, description, open, onToggle, summary, children } = props;
  return (
    <SectionCard
      title={title}
      description={open ? description : summary ?? description}
      right={<Button variant="outline" size="sm" onClick={onToggle}>{open ? "Hide editor" : "Show editor"}</Button>}
    >
      {open ? children : (
        <div className="premium-soft-surface border-dashed px-3.5 py-3 text-sm leading-5 text-slate-600 dark:text-slate-400">
          Detailed controls are tucked away.
        </div>
      )}
    </SectionCard>
  );
};

export const WorkspaceSummaryRail = (props: {
  title: string;
  description?: string;
  items: { label: string; title: string; detail: string; onClick?: () => void }[];
}) => {
  const { title, description, items } = props;

  return (
    <div className="premium-surface p-3.5 sm:p-4">
      <div className={premiumInsetLine} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 xl:max-w-[28rem]">
          <div className="premium-badge-default inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase">
            Focus line
          </div>
          <div className="mt-2 text-base font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</div>
          {description ? <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
        <div className="grid flex-1 gap-2.5 md:grid-cols-4">
        {items.map((item, index) => {
          const className = [
            "relative overflow-hidden rounded-[18px] border px-3 py-3 text-left shadow-sm dark:border-white/10",
            index === 0
              ? "md:col-span-2 border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-800 dark:bg-sky-950/25 dark:text-slate-100"
              : "border-slate-200 bg-slate-50/70 text-slate-900 dark:bg-white/[0.03]",
            item.onClick ? "transition hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md" : "",
          ].join(" ");

          const content = (
            <>
              <div className={index === 0 ? "pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-sky-400 dark:bg-sky-500" : "pointer-events-none absolute inset-y-0 left-0 w-1 bg-slate-200 dark:bg-white/10"} />
              <div className={index === 0 ? "pl-3 text-[10px] font-semibold uppercase text-sky-700 dark:text-sky-200" : "pl-3 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400"}>{item.label}</div>
              <div className={index === 0 ? "mt-1.5 pl-3 text-base font-semibold leading-5 tracking-normal text-slate-950 dark:text-slate-100" : "mt-1 pl-3 text-sm font-semibold leading-5 tracking-normal text-slate-900 dark:text-slate-100"}>{item.title}</div>
              <div className={index === 0 ? "mt-1.5 pl-3 text-sm leading-5 text-slate-700 dark:text-slate-300" : "mt-1 pl-3 text-xs leading-5 text-slate-600 dark:text-slate-300"}>{item.detail}</div>
            </>
          );

          return item.onClick ? (
            <button key={item.label} type="button" onClick={item.onClick} className={className}>
              {content}
            </button>
          ) : (
            <div key={item.label} className={className}>
              {content}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export type AccentTone = "sky" | "cyan" | "emerald" | "amber" | "rose" | "slate";

const accentToneStyles = (tone: AccentTone) => {
  if (tone === "sky") {
    return {
      panel: "border-sky-200 bg-sky-50/80 shadow-sm dark:border-sky-800 dark:bg-sky-950/20",
      badge: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200",
      accent: "bg-sky-400 dark:bg-sky-500",
    };
  }
  if (tone === "cyan") {
    return {
      panel: "border-cyan-200 bg-cyan-50/80 shadow-sm dark:border-cyan-800 dark:bg-cyan-950/20",
      badge: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200",
      accent: "bg-cyan-400 dark:bg-cyan-500",
    };
  }
  if (tone === "emerald") {
    return {
      panel: "border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/20",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
      accent: "bg-emerald-400 dark:bg-emerald-500",
    };
  }
  if (tone === "amber") {
    return {
      panel: "border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-800 dark:bg-amber-950/20",
      badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
      accent: "bg-amber-400 dark:bg-amber-500",
    };
  }
  if (tone === "rose") {
    return {
      panel: "border-rose-200 bg-rose-50/80 shadow-sm dark:border-rose-800 dark:bg-rose-950/20",
      badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200",
      accent: "bg-rose-400 dark:bg-rose-500",
    };
  }
  return {
    panel: "border-slate-200 bg-slate-50/80 shadow-sm dark:border-white/10 dark:bg-white/[0.03]",
    badge: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200",
    accent: "bg-slate-300 dark:bg-slate-600",
  };
};

export const DecisionSpotlight = (props: {
  eyebrow: string;
  title: string;
  description: string;
  tone?: AccentTone;
  children?: React.ReactNode;
}) => {
  const { eyebrow, title, description, tone = "slate", children } = props;
  const styles = accentToneStyles(tone);

  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-4 sm:p-5 ${styles.panel}`}>
      <div className={premiumInsetLine} />
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${styles.accent}`} />
      <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${styles.badge}`}>
        {eyebrow}
      </div>
      <div className="mt-3 text-[1.55rem] font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</div>
      <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-700 dark:text-slate-300">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
};

export const SignalTile = (props: {
  label: string;
  title: string;
  detail: string;
  tone?: AccentTone;
  onClick?: () => void;
}) => {
  const { label, title, detail, tone = "slate", onClick } = props;
  const styles = accentToneStyles(tone);

  const className = [
    `relative overflow-hidden rounded-[20px] border p-3.5 sm:p-4 ${styles.panel}`,
    onClick ? "text-left transition hover:-translate-y-[1px] hover:shadow-md" : "",
  ].join(" ");

  const content = (
    <>
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${styles.accent}`} />
      <div className={`ml-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${styles.badge}`}>
        {label}
      </div>
      <div className="mt-2 ml-3 text-[1rem] font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</div>
      <div className="mt-1.5 ml-3 text-sm leading-5 text-slate-600 dark:text-slate-300">{detail}</div>
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>
      {content}
    </div>
  );
};

export const EmptyStatePanel = (props: {
  title: string;
  detail: string;
}) => {
  const { title, detail } = props;

  return (
    <div className="premium-soft-surface border-dashed px-4 py-4 shadow-sm">
      <div className="premium-badge-default inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase">
        Ready
      </div>
      <div className="mt-2 text-sm font-semibold tracking-normal text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{detail}</div>
    </div>
  );
};

export const CoachRosterRail = (props: {
  title: string;
  description: string;
  items: {
    id: string;
    name: string;
    division: string;
    status: string;
    detail: string;
    tone?: AccentTone;
    active?: boolean;
  }[];
  onSelect: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  const { title, description, items, onSelect, onPrevious, onNext } = props;

  return (
    <div className="premium-surface p-3.5 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <div className="col-span-2 inline-flex justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 sm:col-span-1">
            {items.length} athletes live
          </div>
          <Button size="sm" variant="outline" className="h-10 justify-center gap-1.5 text-xs sm:h-9" onClick={onPrevious}>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="sm:hidden">Previous</span>
            <span className="hidden sm:inline">Previous athlete</span>
          </Button>
          <Button size="sm" variant="outline" className="h-10 justify-center gap-1.5 text-xs sm:h-9" onClick={onNext}>
            <span className="sm:hidden">Next</span>
            <span className="hidden sm:inline">Next athlete</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const styles = accentToneStyles(item.tone ?? "slate");
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                "min-w-0 rounded-[18px] border p-3.5 text-left transition duration-200 hover:-translate-y-[1px] hover:shadow-md",
                item.active
                  ? `${styles.panel} ring-2 ring-offset-2 ring-offset-white ring-slate-900/8 dark:ring-offset-slate-950`
                  : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300/90 dark:border-white/10 dark:bg-white/[0.03]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.name}</div>
                  <div className="mt-1 truncate text-xs uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{item.division}</div>
                </div>
                <div className={`max-w-[48%] shrink-0 truncate rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${item.active ? styles.badge : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"}`}>
                  {item.active ? "Active" : item.status}
                </div>
              </div>
              <div className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{item.detail}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
