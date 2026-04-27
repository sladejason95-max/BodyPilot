import React from "react";
import { clamp } from "@/lib/utils/math";

type Props = {
  label: string;
  value: number;
  note: string;
};

export default function LookOutcomeBar({ label, value, note }: Props) {
  const safeValue = clamp(value, 0, 10);
  const normalized = safeValue * 10;
  const status =
    safeValue >= 8 ? "Strong" :
    safeValue >= 6 ? "Usable" :
    safeValue >= 4 ? "Needs work" :
    "Poor";

  const tone =
    safeValue >= 8 ? "text-emerald-300" :
    safeValue >= 6 ? "text-blue-300" :
    safeValue >= 4 ? "text-amber-300" :
    "text-red-300";

  const markerTone =
    safeValue >= 8 ? "bg-emerald-300" :
    safeValue >= 6 ? "bg-blue-300" :
    safeValue >= 4 ? "bg-amber-300" :
    "bg-red-300";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <div>
          <span>{label}</span>
          <span className="ml-2 text-[10px] text-muted-foreground">{note}</span>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="text-muted-foreground">{safeValue.toFixed(1)}/10</span>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${tone}`}>{status}</span>
        </div>
      </div>

      <div className="relative h-2 overflow-visible rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 bg-red-500/20" style={{ width: "40%" }} />
        <div className="absolute inset-y-0 bg-amber-500/20" style={{ left: "40%", width: "20%" }} />
        <div className="absolute inset-y-0 bg-blue-500/20" style={{ left: "60%", width: "20%" }} />
        <div className="absolute inset-y-0 right-0 bg-emerald-500/25" style={{ width: "20%" }} />

        <div
          title={`${safeValue.toFixed(1)} / 10: ${status}`}
          className={`absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border border-white/80 ${markerTone} shadow-sm`}
          style={{ left: `calc(${normalized}% - 8px)` }}
        />

        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/80"
          style={{ width: `${normalized}%`, opacity: 0.12 }}
        />
      </div>
    </div>
  );
}
