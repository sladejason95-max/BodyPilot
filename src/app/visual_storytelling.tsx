import React from "react";

type Tone = "sky" | "emerald" | "amber" | "rose" | "slate" | "cyan";

const toneStroke: Record<Tone, string> = {
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#e11d48",
  slate: "#64748b",
};

const tonePanel: Record<Tone, string> = {
  sky: "border-sky-200/80 bg-sky-50/82 text-sky-900 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100",
  cyan: "border-cyan-200/80 bg-cyan-50/82 text-cyan-900 dark:border-cyan-500/25 dark:bg-cyan-950/25 dark:text-cyan-100",
  emerald: "border-emerald-200/80 bg-emerald-50/82 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100",
  amber: "border-amber-200/80 bg-amber-50/82 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100",
  rose: "border-rose-200/80 bg-rose-50/82 text-rose-900 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-100",
  slate: "border-slate-200 bg-slate-50/86 text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const InfographicPanel = (props: {
  title: string;
  detail?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => {
  const { title, detail, children, right } = props;

  return (
    <div className="premium-chart-surface p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</div>
          {detail ? <div className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{detail}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
};

export const GaugeChart = (props: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  helper?: string;
  tone?: Tone;
}) => {
  const { label, value, max = 100, suffix = "", helper, tone = "sky" } = props;
  const percent = clamp((value / Math.max(max, 1)) * 100, 0, 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <div className={`relative overflow-hidden rounded-[20px] border p-3.5 ${tonePanel[tone]}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-current opacity-20" />
      <div className="flex items-center gap-4">
        <div className="relative h-[98px] w-[98px] shrink-0">
          <svg viewBox="0 0 112 112" className="h-full w-full rotate-[-90deg]">
            <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="10" />
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="none"
              stroke={toneStroke[tone]}
              strokeLinecap="round"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-semibold text-slate-950 dark:text-slate-100">
              {Math.round(value)}
              {suffix}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">of {max}</div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{label}</div>
          {helper ? <div className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-300">{helper}</div> : null}
        </div>
      </div>
    </div>
  );
};

export const BulletChart = (props: {
  label: string;
  value: number;
  target: number;
  max?: number;
  unit?: string;
  tone?: Tone;
}) => {
  const { label, value, target, max = Math.max(value, target, 1), unit = "", tone = "sky" } = props;
  const valuePct = clamp((value / Math.max(max, 1)) * 100, 0, 100);
  const targetPct = clamp((target / Math.max(max, 1)) * 100, 0, 100);

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white/78 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
        <span className="text-slate-600 dark:text-slate-300">
          {Math.round(value).toLocaleString()} / {Math.round(target).toLocaleString()}
          {unit}
        </span>
      </div>
      <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
        <div className="absolute inset-y-0 left-0 w-[70%] bg-slate-300/55 dark:bg-white/10" />
        <div
          className="absolute inset-y-0 left-0 rounded-full shadow-sm"
          style={{ width: `${valuePct}%`, backgroundColor: toneStroke[tone] }}
        />
        <div
          className="absolute inset-y-[-4px] w-[2px] rounded-full bg-slate-950 dark:bg-white"
          style={{ left: `${targetPct}%` }}
        />
      </div>
    </div>
  );
};

export const DonutChart = (props: {
  label: string;
  center: string;
  segments: Array<{ label: string; value: number; color: string }>;
}) => {
  const { label, center, segments } = props;
  const total = segments.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  let cursor = 0;
  const gradientStops =
    total > 0
      ? segments
          .map((item) => {
            const start = cursor;
            const end = cursor + (Math.max(0, item.value) / total) * 100;
            cursor = end;
            return `${item.color} ${start}% ${end}%`;
          })
          .join(", ")
      : "#cbd5e1 0% 100%";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white/78 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid gap-3 sm:grid-cols-[98px_1fr] sm:items-center">
        <div
          className="relative h-[98px] w-[98px] rounded-full"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          <div className="absolute inset-[15px] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm dark:bg-slate-950">
            <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
            <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{center}</div>
          </div>
        </div>
        <div className="grid gap-2">
          {segments.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-medium text-slate-950 dark:text-slate-100">{Math.round(item.value)}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MiniLineChart = (props: {
  label: string;
  values: number[];
  tone?: Tone;
  unit?: string;
}) => {
  const { label, values, tone = "sky", unit = "" } = props;
  const safeValues = values.length > 0 ? values : [0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(1, max - min);
  const points = safeValues
    .map((value, index) => {
      const x = safeValues.length === 1 ? 50 : (index / (safeValues.length - 1)) * 100;
      const y = 82 - ((value - min) / range) * 64;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white/78 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{label}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {Math.round(safeValues[0]).toLocaleString()}
          {unit}{" to "}{Math.round(safeValues[safeValues.length - 1]).toLocaleString()}
          {unit}
        </div>
      </div>
      <svg viewBox="0 0 100 90" preserveAspectRatio="none" className="mt-2.5 h-[76px] w-full">
        <defs>
          <linearGradient id={`mini-line-fill-${tone}-${safeValues.length}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={toneStroke[tone]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={toneStroke[tone]} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2="100" y1="82" y2="82" stroke="currentColor" strokeOpacity="0.16" />
        <polyline points={points} fill="none" stroke={toneStroke[tone]} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

export const StatusLineChart = (props: {
  label: string;
  values: number[];
  unit?: string;
  helper?: string;
  helpTitle?: string;
  helpItems?: string[];
  helpNote?: string;
  goodAt?: number;
  warnAt?: number;
}) => {
  const { label, values, unit = "", helper, helpTitle, helpItems = [], helpNote, goodAt = 80, warnAt = 55 } = props;
  const [showHelp, setShowHelp] = React.useState(false);
  const safeValues = values.length > 0 ? values : [0];
  const min = 0;
  const max = Math.max(100, goodAt, warnAt, ...safeValues, 1);
  const range = Math.max(1, max - min);
  const yForValue = (value: number) => 82 - ((value - min) / range) * 64;
  const goodY = yForValue(goodAt);
  const warnY = yForValue(warnAt);
  const dangerY = yForValue(0);
  const pointRows = safeValues.map((value, index) => ({
    value,
    x: safeValues.length === 1 ? 50 : (index / (safeValues.length - 1)) * 100,
    y: yForValue(value),
  }));
  const statusColor = (value: number) =>
    value >= goodAt ? toneStroke.emerald : value >= warnAt ? toneStroke.amber : toneStroke.rose;

  return (
    <div className="relative rounded-[20px] border border-slate-200 bg-white/78 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{label}</div>
          {helper ? <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</div> : null}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {helpItems.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHelp((value) => !value)}
              className="rounded-full border border-slate-200 bg-white/86 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
            >
              Improve
            </button>
          ) : null}
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            {Math.round(safeValues[safeValues.length - 1]).toLocaleString()}
            {unit}
          </div>
        </div>
      </div>
      {showHelp ? (
        <div className="absolute right-3 top-12 z-20 w-[min(18rem,calc(100vw-3rem))] rounded-[16px] border border-slate-200 bg-white/96 p-3 text-left shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-950/96">
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            {helpTitle ?? `Improve ${label.toLowerCase()}`}
          </div>
          <div className="mt-2 grid gap-2">
            {helpItems.map((item) => (
              <div key={item} className="rounded-[12px] border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200">
                {item}
              </div>
            ))}
          </div>
          {helpNote ? <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{helpNote}</p> : null}
        </div>
      ) : null}
      <svg viewBox="0 0 100 90" preserveAspectRatio="none" className="mt-2.5 h-[78px] w-full">
        <rect x="0" y="18" width="100" height={Math.max(0, goodY - 18)} fill={toneStroke.emerald} opacity="0.13" />
        <rect x="0" y={goodY} width="100" height={Math.max(0, warnY - goodY)} fill={toneStroke.amber} opacity="0.13" />
        <rect x="0" y={warnY} width="100" height={Math.max(0, dangerY - warnY)} fill={toneStroke.rose} opacity="0.13" />
        <line x1="0" x2="100" y1={goodY} y2={goodY} stroke={toneStroke.emerald} strokeOpacity="0.34" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1={warnY} y2={warnY} stroke={toneStroke.amber} strokeOpacity="0.34" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1={dangerY} y2={dangerY} stroke={toneStroke.rose} strokeOpacity="0.28" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1="82" y2="82" stroke="currentColor" strokeOpacity="0.14" />
        {pointRows.slice(1).map((point, index) => {
          const previous = pointRows[index];
          const segmentValue = (previous.value + point.value) / 2;

          return (
            <line
              key={`${point.x}-${point.y}-${index}`}
              x1={previous.x}
              x2={point.x}
              y1={previous.y}
              y2={point.y}
              stroke={statusColor(segmentValue)}
              strokeLinecap="round"
              strokeWidth="4"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {pointRows.map((point, index) => (
          <circle
            key={`${point.value}-${index}`}
            cx={point.x}
            cy={point.y}
            r="2.4"
            fill={statusColor(point.value)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
};

export const ComparisonBars = (props: {
  rows: Array<{ label: string; current: number; next: number; unit?: string; tone?: Tone }>;
}) => {
  const { rows } = props;
  const max = Math.max(1, ...rows.flatMap((row) => [row.current, row.next]));

  return (
    <div className="grid gap-3">
      {rows.map((row) => {
        const currentPct = clamp((row.current / max) * 100, 0, 100);
        const nextPct = clamp((row.next / max) * 100, 0, 100);
        const tone = row.tone ?? "sky";

        return (
          <div key={row.label} className="rounded-[18px] border border-slate-200 bg-white/78 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">{row.label}</span>
              <span className="text-slate-600 dark:text-slate-300">
                {Math.round(row.current).toLocaleString()}{" to "}{Math.round(row.next).toLocaleString()}
                {row.unit ?? ""}
              </span>
            </div>
            <div className="mt-2.5 grid gap-1.5">
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-slate-500" style={{ width: `${currentPct}%` }} />
              </div>
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full" style={{ width: `${nextPct}%`, backgroundColor: toneStroke[tone] }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
