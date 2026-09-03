export type BuilderEquipmentProfile = "full-gym" | "home-gym" | "dumbbells";

export type BuilderEquipmentExercise = {
  name: string;
  equipment?: readonly BuilderEquipmentProfile[];
};

/**
 * Explicit draft compatibility is authoritative for restricted profiles.
 * Otherwise, retain conservative name inference for catalog and legacy data.
 */
export const equipmentAllowsExercise = (
  profile: BuilderEquipmentProfile,
  exercise: string | BuilderEquipmentExercise
) => {
  if (profile === "full-gym") return true;

  const name = typeof exercise === "string" ? exercise : exercise.name;
  const compatibleProfiles = typeof exercise === "string" ? undefined : exercise.equipment;
  if (compatibleProfiles && compatibleProfiles.length > 0) return compatibleProfiles.includes(profile);

  const text = name.toLowerCase();
  if (profile === "dumbbells") {
    return /dumbbell|bodyweight|push-up|pull-up|plank|lunge|split squat|step-up|dead bug|sit-up/.test(text);
  }
  return !/machine|cable|pulldown|leg press|hack squat|pec deck|smith|reverse hyper/.test(text);
};

/** Add a verified profile without discarding compatibility learned earlier. */
export const withBuilderEquipmentProfile = <T extends BuilderEquipmentExercise>(
  exercise: T,
  profile: BuilderEquipmentProfile
) => ({
  ...exercise,
  equipment: Array.from(new Set([...(exercise.equipment ?? []), profile])),
});
