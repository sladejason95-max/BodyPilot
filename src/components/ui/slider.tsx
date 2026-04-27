import React from "react";

type Props = {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

export function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
}: Props) {
  const current = value[0] ?? 0;
  const pct = ((current - min) / (max - min || 1)) * 100;

  return (
    <div className="relative flex h-8 items-center">
      <div className="premium-progress-track absolute h-2 w-full rounded-full" />
      <div
        className="premium-progress-fill absolute h-2 rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
      <input
        type="range"
        value={current}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        className="relative z-10 h-8 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/70 [&::-webkit-slider-thumb]:bg-[color:var(--view-accent)]"
      />
    </div>
  );
}
