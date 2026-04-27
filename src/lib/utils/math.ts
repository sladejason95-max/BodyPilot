export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const compoundDoseResponse = (
  dose: number,
  refDose: number,
  cap = 1.8,
  softness = 1.1
) => {
  if (dose <= 0 || refDose <= 0) return 0;
  const ratio = dose / refDose;
  if (ratio <= 1) return ratio;
  const extra = ratio - 1;
  return Math.min(cap, 1 + (cap - 1) * (1 - Math.exp(-extra / softness)));
};

export const diminishing = (x: number, scale = 1) =>
  Math.log1p(Math.max(0, x) * scale);

export const softCap = (score: number, max = 9.2) => {
  if (score <= max) return score;
  return max + (score - max) * 0.3;
};
