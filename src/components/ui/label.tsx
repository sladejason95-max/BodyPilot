import React from "react";

export function Label({
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-2 inline-block text-sm font-medium text-slate-200 ${className}`}
      {...props}
    />
  );
}
