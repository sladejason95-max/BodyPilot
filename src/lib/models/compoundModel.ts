import type { Compound } from "@/lib/types";
import { compoundDoseResponse } from "@/lib/utils/math";

export type CompoundModel = {
  androgen: number;
  estrogen: number;
  cortisol: number;
  insulinSensitivity: number;
  water: number;
  thyroid: number;
  fullness: number;
  dryness: number;
  leanness: number;
  performance: number;
  sleep: number;
  digestion: number;
};

export function buildCompoundModel(enabledCompounds: Compound[]): CompoundModel {
  return enabledCompounds.reduce(
    (acc, compound) => {
      const responseCap = compound.mode === "signal" ? 1.6 : compound.category === "Orals" ? 1.5 : 1.85;
      const softness = compound.category === "Orals" ? 0.7 : compound.mode === "signal" ? 0.9 : 1.15;
      const doseScale = compoundDoseResponse(compound.dose, compound.doseRef, responseCap, softness);

      acc.androgen += compound.hormoneEffects.androgen * doseScale;
      acc.estrogen += compound.hormoneEffects.estrogen * doseScale;
      acc.cortisol += compound.hormoneEffects.cortisol * doseScale;
      acc.insulinSensitivity += compound.hormoneEffects.insulinSensitivity * doseScale;
      acc.water += compound.hormoneEffects.water * doseScale;
      acc.thyroid += compound.hormoneEffects.thyroid * doseScale;
      acc.fullness += compound.effects.fullness * doseScale;
      acc.dryness += compound.effects.dryness * doseScale;
      acc.leanness += compound.effects.leanness * doseScale;
      acc.performance += compound.effects.performance * doseScale;
      acc.sleep += compound.effects.sleep * doseScale;
      acc.digestion += compound.effects.digestion * doseScale;

      return acc;
    },
    {
      androgen: 0,
      estrogen: 0,
      cortisol: 0,
      insulinSensitivity: 0,
      water: 0,
      thyroid: 0,
      fullness: 0,
      dryness: 0,
      leanness: 0,
      performance: 0,
      sleep: 0,
      digestion: 0,
    }
  );
}
