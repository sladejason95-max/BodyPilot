import React from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type WorkoutNumberFieldProps = {
  label: string;
  displayLabel?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  disabled?: boolean;
};

export function WorkoutNumberField({
  label,
  displayLabel,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  inputMode = "numeric",
  className,
  disabled = false,
}: WorkoutNumberFieldProps) {
  return (
    <label className={cx("grid min-w-0 gap-1", className)}>
      <span className="truncate px-1 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
        {displayLabel ?? label}
      </span>
      <input
        aria-label={label}
        className="premium-input h-11 min-h-11 min-w-0 w-full px-2 text-center text-base font-semibold tabular-nums disabled:cursor-not-allowed disabled:opacity-60 lg:text-sm"
        type="number"
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </label>
  );
}

type RirSelectProps = {
  label: string;
  displayLabel?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
};

const rirOptions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function RirSelect({ label, displayLabel, value, onChange, className, disabled = false }: RirSelectProps) {
  return (
    <label className={cx("grid min-w-0 gap-1", className)}>
      <span className="truncate px-1 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
        {displayLabel ?? label}
      </span>
      <select
        aria-label={label}
        className="premium-input h-11 min-h-11 min-w-0 w-full px-2 text-center text-base font-semibold tabular-nums disabled:cursor-not-allowed disabled:opacity-60 lg:text-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {rirOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
