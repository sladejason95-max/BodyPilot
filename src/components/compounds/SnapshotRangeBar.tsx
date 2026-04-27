import React from "react";
import { clamp } from "@/lib/utils/math";

function getCompoundSnapshotMeta(key: string) {
  const map: Record<string, { label: string; good: string; caution: string; min: number; max: number; targetLow: number; targetHigh: number; higherIsBetter?: boolean }> = {
    androgen: {
      label: "Androgen / Anabolic Drive",
      good: "Higher is usually better for performance, fullness, and hardness.",
      caution: "Very high values can create tradeoffs the app only partly models.",
      min: 0,
      max: 24,
      targetLow: 8,
      targetHigh: 18,
      higherIsBetter: true,
    },
    estrogen: {
      label: "Estrogen Pressure",
      good: "Moderate is usually best. Too high often blurs the look.",
      caution: "Too low can cost fullness and general feel.",
      min: -4,
      max: 10,
      targetLow: 0,
      targetHigh: 4,
    },
    water: {
      label: "Water Pressure",
      good: "Lower is usually cleaner for stage look.",
      caution: "High values often mean more blur and spill risk.",
      min: -4,
      max: 8,
      targetLow: -1,
      targetHigh: 2,
    },
    cortisol: {
      label: "Stress / Cortisol Pressure",
      good: "Lower is generally better for recovery and look quality.",
      caution: "Higher values usually mean worse recovery and a more deceptive look.",
      min: -4,
      max: 8,
      targetLow: -2,
      targetHigh: 1,
    },
    insulinSensitivity: {
      label: "Insulin Sensitivity Support",
      good: "Higher is generally better for carb handling.",
      caution: "Lower values mean the stack is fighting nutrient partitioning.",
      min: -6,
      max: 6,
      targetLow: 0,
      targetHigh: 3,
      higherIsBetter: true,
    },
    thyroid: {
      label: "Metabolic / Thyroid Support",
      good: "Moderate positive support is usually favorable.",
      caution: "Neutral to low values mean less help on metabolic drive.",
      min: -3,
      max: 6,
      targetLow: 0.5,
      targetHigh: 2.5,
      higherIsBetter: true,
    },
  };
  return map[key];
}

function getSnapshotStatus(value: number, meta: { targetLow: number; targetHigh: number; higherIsBetter?: boolean }) {
  if (value < meta.targetLow) return meta.higherIsBetter ? "Low" : "Low / Cleaner";
  if (value > meta.targetHigh) return meta.higherIsBetter ? "High" : "High / Risk";
  return "Target Zone";
}

type Props = {
  snapshotKey: "androgen" | "estrogen" | "water" | "cortisol" | "insulinSensitivity" | "thyroid";
  value: number;
};

export default function SnapshotRangeBar({ snapshotKey, value }: Props) {
  const meta = getCompoundSnapshotMeta(snapshotKey);
  const normalized = clamp(((value - meta.min) / (meta.max - meta.min)) * 100, 0, 100);
  const targetLeft = ((meta.targetLow - meta.min) / (meta.max - meta.min)) * 100;
  const targetRight = ((meta.targetHigh - meta.min) / (meta.max - meta.min)) * 100;
  const status = getSnapshotStatus(value, meta);
  const statusTone =
    status === "Target Zone"
      ? "text-emerald-300"
      : status.includes("High") && !meta.higherIsBetter
        ? "text-red-300"
        : "text-amber-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{meta.label}</div>
          <div className="text-[11px] text-muted-foreground">{meta.good}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{value > 0 ? "+" : ""}{value.toFixed(1)}</div>
          <div className={`text-[10px] font-medium uppercase tracking-wide ${statusTone}`}>{status}</div>
        </div>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 bg-red-500/25" style={{ width: `${Math.max(0, targetLeft)}%` }} />
        <div className="absolute inset-y-0 bg-emerald-500/25" style={{ left: `${targetLeft}%`, width: `${Math.max(0, targetRight - targetLeft)}%` }} />
        <div className="absolute inset-y-0 right-0 bg-amber-500/20" style={{ width: `${Math.max(0, 100 - targetRight)}%` }} />
        <div
          title={`${value > 0 ? "+" : ""}${value.toFixed(1)}: ${status}`}
          className={`absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border border-white/80 ${status === "Target Zone" ? "bg-emerald-300" : status.includes("High") && !meta.higherIsBetter ? "bg-red-300" : "bg-amber-300"} shadow-sm`}
          style={{ left: `calc(${normalized}% - 8px)` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{meta.min}</span>
        <span>target {meta.targetLow} to {meta.targetHigh}</span>
        <span>{meta.max}</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{meta.caution}</div>
    </div>
  );
}
