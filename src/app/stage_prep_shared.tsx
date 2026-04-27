import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cnScoreTone, panelHoverClass, softPanelClass, surfaceClass } from "./constants";

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
};

export function MetricCard({ label, value, helper, icon }: MetricCardProps) {
  return (
    <Card className={surfaceClass}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">{helper}</div>
          </div>
          <div className="view-story-icon flex h-11 w-11 items-center justify-center text-white">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

type HeroPillProps = {
  label: string;
  value: string;
};

export function HeroPill({ label, value }: HeroPillProps) {
  return (
    <div className="premium-context-chip rounded-full px-4 py-2 backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

type AnalyticsStatProps = {
  label: string;
  value: string;
  helper?: string;
};

export function AnalyticsStat({ label, value, helper }: AnalyticsStatProps) {
  return (
    <div className={`${softPanelClass} p-4`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
      {helper ? <div className="mt-1 text-sm text-slate-500">{helper}</div> : null}
    </div>
  );
}

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
};

export function SectionCard({ title, description, children, right }: SectionCardProps) {
  return (
    <Card className={`${surfaceClass} ${panelHoverClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-slate-950">{title}</CardTitle>
            {description ? <CardDescription className="mt-1 text-sm text-slate-500">{description}</CardDescription> : null}
          </div>
          {right}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type MiniActionProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "outline" | "ghost";
};

export function MiniAction({ children, onClick, variant = "outline" }: MiniActionProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className={
        variant === "outline"
          ? "rounded-lg"
          : "rounded-lg"
      }
    >
      {children}
    </Button>
  );
}

export const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 10,
  tick: { fill: "#64748b", fontSize: 12, fontWeight: 500 },
} as const;

export const chartGridProps = {
  stroke: "rgba(148, 163, 184, 0.24)",
  strokeDasharray: "3 6",
  vertical: false,
} as const;

export const chartPalette = {
  dashboard: {
    condition: "#0ea5e9",
    recovery: "#10b981",
    training: "#f59e0b",
  },
  tracker: {
    stroke: "#06b6d4",
    fillStart: "#67e8f9",
    fillEnd: "#dbeafe",
  },
  split: {
    barStart: "#fbbf24",
    barEnd: "#fb923c",
  },
  library: {
    barStart: "#f472b6",
    barEnd: "#d946ef",
  },
  compounds: {
    base: "#8b5cf6",
    performance: "#06b6d4",
    orals: "#fb923c",
    ancillary: "#34d399",
  },
} as const;

export function scoreChip(score: number, label: string) {
  return (
    <div className="premium-soft-surface px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${cnScoreTone(score)}`}>{score.toFixed(1)}/10</div>
    </div>
  );
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ dataKey?: string; name?: string; value?: number | string; color?: string }>;
  label?: string;
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="premium-surface px-4 py-3.5 shadow-lg">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
      <div className="mt-2 grid gap-1.5">
        {payload.map((item) => (
          <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white/80 shadow-sm"
                style={{ backgroundColor: item.color ?? "#94a3b8" }}
              />
              {item.name ?? item.dataKey}
            </span>
            <span className="font-semibold text-slate-950">
              {typeof item.value === "number" ? item.value.toFixed(1) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type ChartCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
};

export function ChartCard({ title, description, children, right }: ChartCardProps) {
  return (
    <div className={`premium-chart-surface p-4 ${panelHoverClass}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          {description ? <div className="mt-1 text-sm text-slate-500">{description}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
