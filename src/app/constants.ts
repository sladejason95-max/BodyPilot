import type { QuoteEntry } from "./types";

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const cnScoreTone = (score: number) => {
  if (score >= 8) return "text-emerald-600";
  if (score >= 6) return "text-sky-600";
  if (score >= 4) return "text-amber-600";
  return "text-rose-600";
};

export const surfaceClass =
  "premium-surface";

export const softPanelClass =
  "premium-soft-surface";

export const inputClass =
  "premium-input px-3.5 py-2.5";

export const panelHoverClass =
  "premium-hover-lift";

export const quoteBank: QuoteEntry[] = [
  { text: "Keep showing up. The physique gets built by repeatable days, not dramatic ones.", tone: "steady" },
  { text: "A calm, clean day beats a chaotic hero day every single time.", tone: "calm" },
  { text: "Your edge is consistency with taste, not panic with effort.", tone: "confident" },
  { text: "Stack clean days until the look has no choice but to show up.", tone: "focused" },
  { text: "Pretty, dangerous, and disciplined. That is the assignment.", tone: "chaos" },
];

export const scheduleDayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
