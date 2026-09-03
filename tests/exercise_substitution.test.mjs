import assert from "node:assert/strict";
import test from "node:test";

import {
  inferExerciseEquipment,
  inferExerciseMovementPattern,
  rankExerciseSubstitutions,
} from "../src/lib/exerciseSubstitution.ts";
import { exerciseLibrary } from "../src/lib/data/exerciseLibrary.ts";

const currentBench = {
  id: "current-bench",
  name: "Barbell Bench Press",
  muscleGroup: "chest",
  pattern: "Horizontal press",
  target: "mid chest",
  sets: 3,
  reps: "8-12",
};

test("the real exercise library structurally ranks useful live-workout substitutes", () => {
  const current = {
    id: "live-incline-press",
    name: "Incline Barbell Press",
    muscleGroup: "chest",
    pattern: "Incline press",
    target: "upper chest",
    sets: 3,
    reps: "8-12",
  };

  const ranked = rankExerciseSubstitutions(current, exerciseLibrary, { limit: 8 });

  assert.ok(ranked.length > 0);
  assert.ok(ranked.every(({ exercise }) => exercise.muscleBias.some(({ muscle }) => /chest/i.test(muscle))));
  assert.equal(inferExerciseMovementPattern(ranked[0].exercise), "incline press");
  assert.ok(ranked[0].reasons.some((reason) => /incline press/i.test(reason)));
});

test("same-muscle and same-pattern candidates outrank favourites with a different pattern", () => {
  const samePattern = {
    id: "machine-press",
    name: "Machine Chest Press",
    muscleGroup: "chest",
    pattern: "Stable press",
    equipment: "machine",
  };
  const favouriteFly = {
    id: "favourite-fly",
    name: "Cable Fly",
    muscleGroup: "chest",
    pattern: "Adduction",
    equipment: "cable",
    favourite: true,
  };

  const ranked = rankExerciseSubstitutions(currentBench, [favouriteFly, samePattern]);

  assert.equal(ranked[0].exercise, samePattern);
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].reasons.some((reason) => /horizontal press/i.test(reason)));
});

test("live movement targets are not mistaken for muscle names", () => {
  const current = {
    id: "live-rdl",
    name: "Romanian Deadlift",
    muscleGroup: "hamstrings",
    pattern: "Hinge",
    target: "hinge",
    sets: 3,
    reps: "6-10",
  };
  const hamstringOption = {
    id: "dumbbell-rdl",
    name: "Dumbbell Romanian Deadlift",
    muscleGroup: "hamstrings",
    pattern: "Hinge",
  };
  const gluteOption = {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "glutes",
    pattern: "Hip extension",
  };

  assert.equal(inferExerciseMovementPattern(current), "hip hinge");
  assert.deepEqual(
    rankExerciseSubstitutions(current, [gluteOption, hamstringOption]).map(({ exercise }) => exercise.id),
    [hamstringOption.id]
  );
});

test("all requested filters can be combined and personal signals can supply their flags", () => {
  const match = {
    id: "custom-db-press",
    name: "Jason's Dumbbell Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    equipment: "dumbbell",
  };
  const notCustom = {
    id: "stock-db-press",
    name: "Stock Dumbbell Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    equipment: "dumbbell",
    favourite: true,
    previouslyUsed: true,
    painFree: true,
  };
  const wrongEquipment = {
    id: "custom-machine-press",
    name: "Custom Machine Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    equipment: "machine",
    favourite: true,
    previouslyUsed: true,
    painFree: true,
    custom: true,
  };
  const notFavourite = {
    id: "not-favourite",
    name: "Not Favourite Dumbbell Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    equipment: "dumbbell",
    previouslyUsed: true,
    painFree: true,
    custom: true,
  };
  const notPreviouslyUsed = {
    id: "not-previously-used",
    name: "New Custom Dumbbell Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    equipment: "dumbbell",
    favourite: true,
    painFree: true,
    custom: true,
  };
  const notPainFree = {
    id: "not-pain-free",
    name: "Unrated Custom Dumbbell Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    equipment: "dumbbell",
    favourite: true,
    previouslyUsed: true,
    custom: true,
  };

  const ranked = rankExerciseSubstitutions(
    currentBench,
    [notCustom, wrongEquipment, notFavourite, notPreviouslyUsed, notPainFree, match],
    {
      filters: {
        muscle: "chest",
        equipment: "dumbbells",
        movementPattern: "horizontal press",
        favourite: true,
        previouslyUsed: true,
        painFree: true,
        custom: true,
      },
      signals: {
        favourite: [match.id],
        previouslyUsed: [match.id],
        painFree: [match.id],
        custom: [match.id],
      },
    }
  );

  assert.deepEqual(ranked.map(({ exercise }) => exercise.id), [match.id]);
  assert.ok(ranked[0].reasons.includes("Recorded as pain-free."));
});

test("pain-free filtering is explicit and never inferred from joint friendliness", () => {
  const recordedPainFree = {
    id: "pain-free",
    name: "Pain-Free Machine Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    painFree: true,
  };
  const onlyJointFriendly = {
    id: "joint-friendly",
    name: "Joint-Friendly Machine Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    jointFriendliness: 10,
  };
  const painful = {
    id: "painful",
    name: "Painful Machine Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    painFree: true,
    painful: true,
  };

  const ranked = rankExerciseSubstitutions(currentBench, [onlyJointFriendly, painful, recordedPainFree], {
    filters: { painFree: true },
  });

  assert.deepEqual(ranked.map(({ exercise }) => exercise.id), [recordedPainFree.id]);
});

test("pain and custom metadata risks are returned as concise warnings", () => {
  const painful = {
    id: "painful-press",
    name: "Painful Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    painful: true,
  };
  const sparseCustom = {
    id: "custom-sparse",
    name: "My Press Variation",
    custom: true,
  };

  const [painfulResult] = rankExerciseSubstitutions(currentBench, [painful]);
  const [customResult] = rankExerciseSubstitutions(currentBench, [sparseCustom], {
    filters: { custom: true },
  });

  assert.match(painfulResult.warnings[0], /marked as painful/i);
  assert.ok(customResult.warnings.some((warning) => /limited matching data/i.test(warning)));
});

test("progression history transfers only for the same identity or an explicit shared key", () => {
  const keyedCurrent = { ...currentBench, progressionKey: "barbell-horizontal-press" };
  const compatible = {
    id: "alternate-bench-record",
    name: "Competition Bench Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    progressionHistoryKey: "barbell-horizontal-press",
  };
  const newProgression = {
    id: "machine-press",
    name: "Machine Chest Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
  };

  const ranked = rankExerciseSubstitutions(keyedCurrent, [newProgression, compatible]);
  const transferable = ranked.find(({ exercise }) => exercise.id === compatible.id);
  const separate = ranked.find(({ exercise }) => exercise.id === newProgression.id);

  assert.equal(transferable.canTransferProgressionHistory, true);
  assert.match(transferable.historyTransferReason, /explicit progression key/i);
  assert.equal(separate.canTransferProgressionHistory, false);
  assert.match(separate.historyTransferReason, /new progression/i);
  assert.ok(separate.warnings.some((warning) => /separate progression history/i.test(warning)));
});

test("equipment profiles and name inference support gym filters", () => {
  assert.deepEqual(inferExerciseEquipment({ name: "Smith Incline Press" }), ["smith machine"]);
  assert.deepEqual(inferExerciseEquipment({ name: "Dumbbell Lateral Raise" }), ["dumbbell"]);
  assert.deepEqual(inferExerciseEquipment({ name: "Push-Up" }), ["bodyweight"]);

  const candidates = [
    { id: "push-up", name: "Push-Up", muscleGroup: "chest", pattern: "Bodyweight press" },
    { id: "db-press", name: "Dumbbell Press", muscleGroup: "chest", pattern: "Horizontal press" },
    { id: "machine-press", name: "Machine Press", muscleGroup: "chest", pattern: "Horizontal press" },
  ];
  const ranked = rankExerciseSubstitutions(currentBench, candidates, {
    filters: { equipment: "home-gym" },
  });

  assert.deepEqual(
    new Set(ranked.map(({ exercise }) => exercise.id)),
    new Set(["push-up", "db-press"])
  );
});

test("the current exercise, duplicates, and explicit exclusions are omitted", () => {
  const original = { ...currentBench };
  const duplicateName = { ...currentBench, id: "different-id" };
  const excluded = {
    id: "excluded",
    name: "Excluded Machine Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
  };
  const retained = {
    id: "retained",
    name: "Retained Machine Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
  };

  const ranked = rankExerciseSubstitutions(currentBench, [original, duplicateName, excluded, retained], {
    excludeExerciseKeys: [excluded.id],
  });

  assert.deepEqual(ranked.map(({ exercise }) => exercise.id), [retained.id]);
  assert.equal(ranked[0].exercise, retained);
});

test("default compatibility uses the primary muscle family, not secondary overlap", () => {
  const current = {
    id: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    muscleGroup: "shoulders",
    target: "side delts",
    pattern: "Lateral raise",
  };
  const shoulderAlternative = {
    id: "machine-lateral-raise",
    name: "Machine Lateral Raise",
    muscleBias: [
      { muscle: "Side Delts", contribution: 80 },
      { muscle: "Upper Traps", contribution: 20 },
    ],
    pattern: "Lateral raise",
  };
  const chestWithSecondaryDelts = {
    id: "cable-fly",
    name: "Cable Fly",
    muscleBias: [
      { muscle: "Chest", contribution: 75 },
      { muscle: "Front Delts", contribution: 25 },
    ],
    pattern: "Adduction",
  };
  const backWithSecondaryDelts = {
    id: "chest-supported-row",
    name: "Chest-Supported Row",
    muscleBias: [
      { muscle: "Upper Back", contribution: 60 },
      { muscle: "Rear Delts", contribution: 20 },
    ],
    pattern: "Horizontal pull",
  };
  const candidates = [shoulderAlternative, chestWithSecondaryDelts, backWithSecondaryDelts];

  assert.deepEqual(
    rankExerciseSubstitutions(current, candidates).map(({ exercise }) => exercise.id),
    [shoulderAlternative.id]
  );

  const crossMuscleIds = new Set(
    rankExerciseSubstitutions(current, candidates, { allowCrossMuscle: true }).map(({ exercise }) => exercise.id)
  );
  assert.equal(crossMuscleIds.has(chestWithSecondaryDelts.id), true);
  assert.equal(crossMuscleIds.has(backWithSecondaryDelts.id), true);
});

test("candidate dedupe uses normalized names and keeps the first eligible source", () => {
  const customCandidate = {
    id: "custom-machine-press",
    name: "Machine Chest Press",
    muscleGroup: "chest",
    pattern: "Horizontal press",
    custom: true,
  };
  const libraryCandidate = {
    id: "library-machine-press",
    name: "  machine CHEST press  ",
    muscleGroup: "chest",
    pattern: "Horizontal press",
  };

  const ranked = rankExerciseSubstitutions(currentBench, [customCandidate, libraryCandidate]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].exercise, customCandidate);

  const ineligibleFirst = { ...customCandidate, favourite: false };
  const eligibleSecond = { ...libraryCandidate, favourite: true };
  const favouriteOnly = rankExerciseSubstitutions(currentBench, [ineligibleFirst, eligibleSecond], {
    filters: { favourite: true },
  });

  assert.equal(favouriteOnly.length, 1);
  assert.equal(favouriteOnly[0].exercise, eligibleSecond);
});

test("ties are deterministic and the result limit is bounded", () => {
  const beta = { id: "beta", name: "Beta Press", muscleGroup: "chest", pattern: "Horizontal press" };
  const alpha = { id: "alpha", name: "Alpha Press", muscleGroup: "chest", pattern: "Horizontal press" };

  const ranked = rankExerciseSubstitutions(currentBench, [beta, alpha], { limit: 1 });

  assert.deepEqual(ranked.map(({ exercise }) => exercise.id), [alpha.id]);
  assert.deepEqual(rankExerciseSubstitutions(currentBench, [beta, alpha], { limit: 0 }), []);
});
