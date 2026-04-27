import React from "react";
import type { PrepSignalSnapshot } from "@/app/prep_signal_engine";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { SignalTile, type AccentTone } from "@/app/workspace_ui";

type PrepSignalPanelProps = {
  snapshot: PrepSignalSnapshot;
  onOpen?: (tab: PrepSignalSnapshot["posture"]["tab"]) => void;
};

const tonePanelStyles = (tone: AccentTone) => {
  if (tone === "sky") {
    return {
      panel: "border-sky-200 bg-sky-50/80 shadow-sm",
      badge: "border-sky-200 bg-sky-100/95 text-sky-800",
    };
  }
  if (tone === "emerald") {
    return {
      panel: "border-emerald-200 bg-emerald-50/80 shadow-sm",
      badge: "border-emerald-200 bg-emerald-100/95 text-emerald-800",
    };
  }
  if (tone === "amber") {
    return {
      panel: "border-amber-200 bg-amber-50/80 shadow-sm",
      badge: "border-amber-200 bg-amber-100/95 text-amber-800",
    };
  }
  if (tone === "rose") {
    return {
      panel: "border-rose-200 bg-rose-50/80 shadow-sm",
      badge: "border-rose-200 bg-rose-100/95 text-rose-800",
    };
  }
  return {
    panel: "premium-soft-surface",
    badge: "premium-badge-secondary",
  };
};

const tabLabelMap: Record<PrepSignalSnapshot["posture"]["tab"], string> = {
  dashboard: "Open dashboard",
  nutrition: "Open food",
  compounds: "Open compounds",
  split: "Open split",
  tracker: "Open today",
  schedule: "Open full calendar",
  library: "Open exercise browser",
  coach: "Open coach desk",
};

const SignalCard = (props: {
  item: PrepSignalSnapshot["posture"];
  emphasis?: boolean;
  onOpen?: (tab: PrepSignalSnapshot["posture"]["tab"]) => void;
}) => {
  const { item, emphasis = false, onOpen } = props;
  const styles = tonePanelStyles(item.tone);
  const interactive = typeof onOpen === "function";
  const Wrapper = interactive ? "button" : "div";

  return React.createElement(
    Wrapper,
    interactive
      ? {
          type: "button",
          onClick: () => onOpen(item.tab),
          className: [
            "w-full rounded-[24px] border p-4 text-left",
            styles.panel,
            "transition hover:-translate-y-[1px] hover:shadow-md",
            emphasis ? "sm:p-6" : "",
          ].join(" "),
        }
      : {
          className: ["rounded-[24px] border p-4", styles.panel, emphasis ? "sm:p-6" : ""].join(" "),
        },
    <>
      <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles.badge}`}>
        {item.label}
      </div>
      <div className={emphasis ? "mt-4 text-[2rem] font-bold tracking-normal text-slate-950" : "mt-3 text-base font-semibold tracking-normal text-slate-950"}>
        {item.title}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{item.detail}</p>
      {interactive ? (
        <div className="mt-4">
          <Badge variant="outline">{tabLabelMap[item.tab]}</Badge>
        </div>
      ) : null}
    </>
  );
};

export default function PrepSignalPanel(props: PrepSignalPanelProps) {
  const { snapshot, onOpen } = props;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <SignalCard item={snapshot.posture} emphasis onOpen={onOpen} />

        <div className="grid gap-4">
          <SignalCard item={snapshot.focusLane} onOpen={onOpen} />
          <SignalCard item={snapshot.cautionLane} onOpen={onOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((item) => (
          <div key={`${item.label}-${item.title}`} className="space-y-2">
            <SignalTile
              label={item.label}
              title={item.title}
              detail={item.detail}
              tone={item.tone}
            />
            {onOpen ? (
              <Button variant="ghost" size="sm" className="px-0 text-slate-500 hover:text-slate-900" onClick={() => onOpen(item.tab)}>
                {tabLabelMap[item.tab]}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
