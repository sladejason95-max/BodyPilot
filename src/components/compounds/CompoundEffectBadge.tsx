import React from "react";
import { Badge } from "@/components/ui/badge";

function getCompoundEffectTone(value: number) {
  const abs = Math.abs(value);
  if (abs < 0.15) return "border-white/10 bg-white/5 text-muted-foreground";
  if (value > 0) {
    if (abs >= 6) return "border-emerald-400/40 bg-emerald-500/20 text-emerald-100";
    if (abs >= 3) return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }
  if (abs >= 6) return "border-red-400/40 bg-red-500/20 text-red-100";
  if (abs >= 3) return "border-red-400/30 bg-red-500/15 text-red-100";
  return "border-red-400/20 bg-red-500/10 text-red-100";
}

type Props = {
  label: string;
  value: number;
};

export default function CompoundEffectBadge({ label, value }: Props) {
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.15) return null;

  const labelText = label === "Sleep" && rounded <= -3 ? label.toUpperCase() : label;

  return (
    <Badge className={getCompoundEffectTone(rounded)}>
      {labelText}: {rounded > 0 ? "+" : ""}{rounded}/10
    </Badge>
  );
}
