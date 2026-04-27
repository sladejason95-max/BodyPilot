import React from "react";

export function Progress({
  value = 0,
  className = "",
}: {
  value?: number;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={`premium-progress-track relative h-2.5 w-full overflow-hidden rounded-full ${className}`}>
      <div
        className="premium-progress-fill absolute inset-y-0 left-0 rounded-full transition-all duration-300"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
