import React from "react";

type Props = {
  fullness: number;
  dryness: number;
  leanness: number;
  carbs: number;
  saltTsp: number;
  waterLiters: number;
};

export default function StickySummaryBar({
  fullness,
  dryness,
  leanness,
  carbs,
  saltTsp,
  waterLiters,
}: Props) {
  return (
    <div className="sticky top-2 z-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex gap-3 text-xs">
            <div>F: <span className="font-semibold">{fullness}</span></div>
            <div>D: <span className="font-semibold">{dryness}</span></div>
            <div>L: <span className="font-semibold">{leanness}</span></div>
          </div>
          <div className="flex gap-3 text-xs">
            <div>C: <span className="font-semibold">{carbs}</span></div>
            <div>S: <span className="font-semibold">{saltTsp.toFixed(2)}</span></div>
            <div>W: <span className="font-semibold">{waterLiters.toFixed(1)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
