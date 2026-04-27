import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "premium-badge-default",
    secondary: "premium-badge-secondary",
    outline: "premium-badge-outline",
  };

  return (
    <div
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.06em]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
