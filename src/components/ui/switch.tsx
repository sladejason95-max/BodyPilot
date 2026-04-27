import React from "react";

type Props = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ checked = false, onCheckedChange }: Props) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange?.(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors duration-200 ${
        checked
          ? "premium-switch-on"
          : "border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.08]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white transition-all duration-200 ${
          checked
            ? "translate-x-6 shadow-sm"
            : "translate-x-1 shadow-sm"
        }`}
      />
    </button>
  );
}
