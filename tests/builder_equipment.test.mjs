import assert from "node:assert/strict";
import test from "node:test";

import {
  equipmentAllowsExercise,
  withBuilderEquipmentProfile,
} from "../src/app/builder_equipment.ts";

test("a draft custom exercise stays compatible with the equipment profile in which it was added", () => {
  const customExercise = {
    name: "Zottman curl",
    equipment: ["dumbbells"],
  };

  assert.equal(equipmentAllowsExercise("dumbbells", customExercise), true);
});

test("explicit draft compatibility supports custom names that resemble unavailable equipment", () => {
  const customExercise = {
    name: "Home cable fly variation",
    equipment: ["home-gym"],
  };

  assert.equal(equipmentAllowsExercise("home-gym", customExercise), true);
});

test("explicit profiles prevent name inference from leaking a custom exercise into another profile", () => {
  const fullGymCustom = {
    name: "Dumbbell machine hybrid",
    equipment: ["full-gym"],
  };

  assert.equal(equipmentAllowsExercise("dumbbells", fullGymCustom), false);
  assert.equal(equipmentAllowsExercise("home-gym", fullGymCustom), false);
  assert.equal(equipmentAllowsExercise("full-gym", fullGymCustom), true);
});

test("exercises without explicit compatibility retain conservative name inference", () => {
  assert.equal(equipmentAllowsExercise("dumbbells", "Zottman curl"), false);
  assert.equal(equipmentAllowsExercise("dumbbells", "Dumbbell Zottman curl"), true);
  assert.equal(equipmentAllowsExercise("home-gym", "Cable curl"), false);
  assert.equal(equipmentAllowsExercise("full-gym", "Unknown machine variation"), true);
});

test("re-adding legacy and existing customs merges the active equipment profile", () => {
  const legacy = withBuilderEquipmentProfile({ name: "Zottman curl" }, "dumbbells");
  assert.deepEqual(legacy.equipment, ["dumbbells"]);

  const expanded = withBuilderEquipmentProfile(
    { name: "Landmine press", equipment: ["full-gym"] },
    "home-gym"
  );
  assert.deepEqual(expanded.equipment, ["full-gym", "home-gym"]);
  assert.deepEqual(withBuilderEquipmentProfile(expanded, "home-gym").equipment, ["full-gym", "home-gym"]);
});
