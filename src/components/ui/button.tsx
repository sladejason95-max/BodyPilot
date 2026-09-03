import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClasses = {
    default:
      "premium-button-primary",
    outline:
      "premium-button-outline",
    ghost:
      "premium-button-ghost bg-transparent",
    secondary:
      "premium-button-secondary",
  };

  const sizeClasses = {
    default: "min-h-11 px-4 py-2 text-sm sm:h-10 sm:min-h-10",
    sm: "min-h-10 px-3 py-2 text-xs sm:h-8 sm:min-h-8",
    lg: "min-h-12 px-5 py-2.5 text-sm sm:h-11 sm:min-h-11",
    icon: "min-h-11 min-w-11 px-0 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
  };

  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center rounded-[16px] font-medium tracking-[0.01em] transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-sky-400/50 dark:focus:ring-offset-slate-950",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:translate-y-[1px]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
