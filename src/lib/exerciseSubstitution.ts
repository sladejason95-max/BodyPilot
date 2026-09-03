export type ExerciseMuscleBias = {
  muscle: string;
  contribution?: number;
};

/**
 * The minimum structural shape accepted by the substitution engine.
 *
 * It intentionally covers both `ExerciseLibraryItem` and the live
 * `WorkoutLift`/exercise-catalog shapes without importing either domain or UI.
 * Callers can decorate candidates with personal flags before ranking them, or
 * provide those flags through `signals`.
 */
export type ExerciseSubstitutionCandidate = {
  id?: string;
  exerciseId?: string;
  name: string;
  category?: string;
  muscle?: string;
  muscles?: readonly string[];
  muscleGroup?: string;
  muscleBias?: readonly ExerciseMuscleBias[];
  pattern?: string;
  movementPattern?: string;
  target?: string;
  equipment?: string | readonly string[];
  favourite?: boolean;
  favorite?: boolean;
  previouslyUsed?: boolean;
  painFree?: boolean;
  painful?: boolean;
  custom?: boolean;
  isCustom?: boolean;
  source?: string;
  jointFriendly?: boolean;
  progressionKey?: string;
  progressionHistoryKey?: string;
  lengthBias?: string;
  stimulus?: number;
  fatigue?: number;
  stimulusToFatigue?: number;
  axialLoad?: number;
  systemicFatigue?: number;
  stabilityDemand?: number;
  skillDemand?: number;
  jointFriendliness?: number;
};

export type ExerciseSubstitutionFilters = {
  muscle?: string | readonly string[];
  equipment?: string | readonly string[];
  movementPattern?: string | readonly string[];
  favourite?: boolean;
  previouslyUsed?: boolean;
  painFree?: boolean;
  custom?: boolean;
};

export type ExerciseKeyCollection = readonly string[] | ReadonlySet<string>;

export type ExerciseSubstitutionSignals = {
  favourite?: ExerciseKeyCollection;
  previouslyUsed?: ExerciseKeyCollection;
  painFree?: ExerciseKeyCollection;
  painful?: ExerciseKeyCollection;
  custom?: ExerciseKeyCollection;
};

export type ExerciseSubstitutionOptions = {
  filters?: ExerciseSubstitutionFilters;
  signals?: ExerciseSubstitutionSignals;
  excludeExerciseKeys?: ExerciseKeyCollection;
  /** Cross-muscle replacements are hidden by default because they change intent. */
  allowCrossMuscle?: boolean;
  limit?: number;
};

export type RankedExerciseSubstitution<T extends ExerciseSubstitutionCandidate> = {
  /** The exact object supplied by the caller; the engine does not clone it. */
  exercise: T;
  score: number;
  reasons: string[];
  warnings: string[];
  canTransferProgressionHistory: boolean;
  historyTransferReason: string;
};

type ResolvedFlags = {
  favourite: boolean;
  previouslyUsed: boolean;
  painFree: boolean;
  painful: boolean;
  custom: boolean;
};

type ExerciseMetadata = {
  id: string;
  name: string;
  keys: string[];
  muscles: string[];
  muscleFamilies: string[];
  primaryMuscle: string;
  primaryMuscleFamily: string;
  pattern: string;
  patternFamily: string;
  equipment: string[];
  flags: ResolvedFlags;
};

type Reason = {
  priority: number;
  text: string;
};

const normaliseText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const unique = <T>(values: readonly T[]) => Array.from(new Set(values));

const asArray = (value: string | readonly string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? [...value] : [value as string];

const collectionToSet = (collection: ExerciseKeyCollection | undefined) => {
  const values = collection ? Array.from(collection) : [];
  return new Set(values.map(normaliseText).filter(Boolean));
};

const exerciseKeys = (exercise: ExerciseSubstitutionCandidate) =>
  unique(
    [exercise.id, exercise.exerciseId, exercise.name]
      .map(normaliseText)
      .filter(Boolean)
  );

const setContainsExercise = (set: ReadonlySet<string>, exercise: ExerciseSubstitutionCandidate) =>
  exerciseKeys(exercise).some((key) => set.has(key));

const canonicalMuscle = (value: unknown) => {
  const muscle = normaliseText(value);
  if (!muscle) return "";
  if (/upper (chest|pec)/.test(muscle)) return "upper chest";
  if (/lower (chest|pec)/.test(muscle)) return "lower chest";
  if (/(mid )?(chest|pecs?|pectorals?)/.test(muscle)) return "chest";
  if (/rear delt/.test(muscle)) return "rear delts";
  if (/(side|lateral|medial) delt/.test(muscle)) return "side delts";
  if (/front|anterior delt/.test(muscle)) return "front delts";
  if (/shoulder|deltoid/.test(muscle)) return "shoulders";
  if (/upper back|mid back|rhomboid/.test(muscle)) return "upper back";
  if (/latissimus|\blats?\b/.test(muscle)) return "lats";
  if (/trap/.test(muscle)) return "traps";
  if (/erector|lower back/.test(muscle)) return "erectors";
  if (/back/.test(muscle)) return "back";
  if (/quadricep|\bquads?\b/.test(muscle)) return "quads";
  if (/hamstring/.test(muscle)) return "hamstrings";
  if (/glute/.test(muscle)) return "glutes";
  if (/adductor/.test(muscle)) return "adductors";
  if (/calf|calves|gastrocnemius|soleus/.test(muscle)) return "calves";
  if (/tricep/.test(muscle)) return "triceps";
  if (/bicep/.test(muscle)) return "biceps";
  if (/brachialis/.test(muscle)) return "brachialis";
  if (/forearm|wrist/.test(muscle)) return "forearms";
  if (/\barms?\b/.test(muscle)) return "arms";
  if (/oblique/.test(muscle)) return "obliques";
  if (/abdominal|\babs?\b|core/.test(muscle)) return "abs";
  if (/hip flexor/.test(muscle)) return "hip flexors";
  return muscle;
};

const knownMuscles = new Set([
  "upper chest",
  "lower chest",
  "chest",
  "rear delts",
  "side delts",
  "front delts",
  "shoulders",
  "upper back",
  "lats",
  "traps",
  "erectors",
  "back",
  "quads",
  "hamstrings",
  "glutes",
  "adductors",
  "calves",
  "triceps",
  "biceps",
  "brachialis",
  "forearms",
  "arms",
  "obliques",
  "abs",
  "hip flexors",
]);

const muscleFamily = (muscle: string) => {
  if (["upper chest", "lower chest", "chest"].includes(muscle)) return "chest";
  if (["rear delts", "side delts", "front delts", "shoulders"].includes(muscle)) return "shoulders";
  if (["upper back", "lats", "erectors", "back"].includes(muscle)) return "back";
  if (muscle === "traps") return "shoulders";
  if (["triceps", "biceps", "brachialis", "forearms", "arms"].includes(muscle)) return "arms";
  if (["abs", "obliques", "hip flexors"].includes(muscle)) return "core";
  return muscle;
};

const resolvedMuscles = (exercise: ExerciseSubstitutionCandidate) => {
  const weightedBiases = (exercise.muscleBias ?? [])
    .map((entry, index) => ({
      muscle: canonicalMuscle(entry.muscle),
      contribution: Number.isFinite(entry.contribution) ? Number(entry.contribution) : Math.max(1, 100 - index),
    }))
    .filter((entry) => entry.muscle)
    .sort((left, right) => right.contribution - left.contribution);
  const explicitMuscles = [exercise.muscle, exercise.muscleGroup, ...(exercise.muscles ?? [])]
    .map(canonicalMuscle)
    .filter(Boolean);
  const canonicalTarget = canonicalMuscle(exercise.target);
  // Live targets also contain movement labels such as "hinge" and "quad
  // press". Only treat a target as a muscle when it resolved to a known one.
  const targetMuscle = knownMuscles.has(canonicalTarget) ? canonicalTarget : "";
  const muscles = unique([
    ...weightedBiases.map((entry) => entry.muscle),
    ...explicitMuscles,
    ...(targetMuscle ? [targetMuscle] : []),
  ]);
  const primaryMuscle = targetMuscle || weightedBiases[0]?.muscle || explicitMuscles[0] || "";

  return {
    muscles,
    muscleFamilies: unique(muscles.map(muscleFamily).filter(Boolean)),
    primaryMuscle,
    primaryMuscleFamily: muscleFamily(primaryMuscle),
  };
};

const canonicalEquipment = (value: unknown) => {
  const equipment = normaliseText(value);
  if (!equipment) return "";
  if (/full gym/.test(equipment)) return "full gym";
  if (/home gym/.test(equipment)) return "home gym";
  if (/smith/.test(equipment)) return "smith machine";
  if (/dumbbell|\bdb\b/.test(equipment)) return "dumbbell";
  if (/barbell|ez bar|\bbb\b/.test(equipment)) return "barbell";
  if (/kettlebell|\bkb\b/.test(equipment)) return "kettlebell";
  if (/cable|pulley/.test(equipment)) return "cable";
  if (/resistance band|\bband/.test(equipment)) return "resistance band";
  if (/body ?weight|none/.test(equipment)) return "bodyweight";
  if (/machine|selectorized|plate loaded/.test(equipment)) return "machine";
  if (/free weight/.test(equipment)) return "free weights";
  return equipment;
};

/** Infer equipment for library records that do not carry an equipment field. */
export const inferExerciseEquipment = (exercise: ExerciseSubstitutionCandidate): string[] => {
  const explicit = asArray(exercise.equipment).map(canonicalEquipment).filter(Boolean);
  if (explicit.length > 0) return unique(explicit);

  const name = normaliseText(exercise.name);
  if (/smith/.test(name)) return ["smith machine"];
  if (/dumbbell|\bdb\b|goblet/.test(name)) return ["dumbbell"];
  if (/barbell|ez bar/.test(name)) return ["barbell"];
  if (/kettlebell/.test(name)) return ["kettlebell"];
  if (/cable|pulldown|pressdown|rope|pallof/.test(name)) return ["cable"];
  if (
    /machine|pec deck|hack squat|pendulum squat|v squat|leg press|leg extension|leg curl|reverse hyper|captain s chair/.test(
      name
    )
  ) {
    return ["machine"];
  }
  if (/resistance band|banded/.test(name)) return ["resistance band"];
  if (/push up|pull up|chin up|plank|sit up|nordic|sissy squat/.test(name)) return ["bodyweight"];
  if (/front squat|high bar squat|back squat|good morning|romanian deadlift|stiff leg deadlift/.test(name)) {
    return ["barbell"];
  }
  return [];
};

const patternFromText = (exercise: ExerciseSubstitutionCandidate) => {
  const explicit = normaliseText(exercise.movementPattern ?? exercise.pattern);
  const name = normaliseText(exercise.name);
  const text = `${explicit} ${name}`.trim();
  const family = resolvedMuscles(exercise).primaryMuscleFamily;

  if (/anti lateral/.test(text)) return "anti lateral flexion";
  if (/anti rotation|pallof/.test(text)) return "anti rotation";
  if (/anti extension|ab wheel|plank|dead bug/.test(text)) return "anti extension";
  if (/loaded flexion|cable crunch|machine crunch|decline sit up/.test(text)) return "loaded trunk flexion";
  if (/hanging.*raise|captain.*raise|reverse crunch|hip flexion/.test(text)) return "hip flexion";

  if (family === "chest") {
    if (/incline|low to high/.test(text)) return "incline press";
    if (/decline|dip|high to low/.test(text)) return "decline press";
    if (/fly|adduction|pec deck/.test(text)) return "chest fly";
    if (/press|push up/.test(text)) return "horizontal press";
  }
  if (family === "back") {
    if (/pullover|straight arm/.test(text)) return "pullover";
    if (/pulldown|pull up|chin up|vertical pull/.test(text)) return "vertical pull";
    if (/row|horizontal pull/.test(text)) return "horizontal pull";
  }
  if (family === "quads") {
    if (/leg extension|knee extension|sissy/.test(text)) return "knee extension";
    if (/single leg|split squat|lunge|step up/.test(text)) return "unilateral knee dominant";
    if (/leg press|\bpress\b/.test(text)) return "leg press";
    if (/squat/.test(text)) return "squat";
  }
  if (family === "hamstrings") {
    if (/curl|nordic|glute ham|knee flexion/.test(text)) return "knee flexion";
    if (/hinge|deadlift|good morning|back extension/.test(text)) return "hip hinge";
  }
  if (family === "glutes") {
    if (/abduction/.test(text)) return "hip abduction";
    if (/kickback/.test(text)) return "glute isolation";
    if (/hip thrust|bridge|pull through|hip extension|step up/.test(text)) return "hip extension";
  }
  if (family === "shoulders") {
    if (/rear delt|reverse pec|face pull/.test(text)) return "rear delt fly";
    if (/lateral|side delt|y raise/.test(text)) return "lateral raise";
    if (/front raise/.test(text)) return "front raise";
    if (/press/.test(text)) return "vertical press";
  }
  if (family === "arms") {
    if (/pressdown|extension|skull|triceps|close grip|dip/.test(text)) return "elbow extension";
    if (/wrist|forearm/.test(text)) return "forearm isolation";
    if (/curl|elbow flexion/.test(text)) return "elbow flexion";
  }
  if (family === "calves" && /calf|calves/.test(text)) return "calf raise";

  return explicit;
};

/** Return a stable, user-facing movement family for either supported source. */
export const inferExerciseMovementPattern = (exercise: ExerciseSubstitutionCandidate) =>
  patternFromText(exercise) || "unknown";

const movementPatternFamily = (pattern: string) => {
  if (["horizontal press", "incline press", "decline press"].includes(pattern)) return "chest press";
  if (["squat", "leg press", "unilateral knee dominant"].includes(pattern)) return "knee dominant compound";
  return pattern;
};

const equipmentFilterMatches = (candidateEquipment: readonly string[], requestedValue: string) => {
  const requested = canonicalEquipment(requestedValue);
  if (!requested) return true;
  if (requested === "full gym") return true;
  if (requested === "home gym") {
    return candidateEquipment.some((item) =>
      ["home gym", "bodyweight", "dumbbell", "barbell", "kettlebell", "resistance band"].includes(item)
    );
  }
  if (requested === "free weights") {
    return candidateEquipment.some((item) => ["dumbbell", "barbell", "kettlebell", "free weights"].includes(item));
  }
  if (requested === "machine") {
    return candidateEquipment.some((item) => ["machine", "smith machine"].includes(item));
  }
  return candidateEquipment.includes(requested);
};

const flagFromCandidateOrSet = (
  candidateValue: boolean | undefined,
  signalSet: ReadonlySet<string>,
  exercise: ExerciseSubstitutionCandidate
) => candidateValue ?? setContainsExercise(signalSet, exercise);

const resolveFlags = (
  exercise: ExerciseSubstitutionCandidate,
  signalSets: Record<keyof ExerciseSubstitutionSignals, ReadonlySet<string>>
): ResolvedFlags => {
  const painful = flagFromCandidateOrSet(exercise.painful, signalSets.painful, exercise);
  const explicitPainFree = flagFromCandidateOrSet(exercise.painFree, signalSets.painFree, exercise);
  return {
    favourite: flagFromCandidateOrSet(exercise.favourite ?? exercise.favorite, signalSets.favourite, exercise),
    previouslyUsed: flagFromCandidateOrSet(exercise.previouslyUsed, signalSets.previouslyUsed, exercise),
    painFree: painful ? false : explicitPainFree,
    painful,
    custom: flagFromCandidateOrSet(
      exercise.custom ?? exercise.isCustom ?? (normaliseText(exercise.source) === "custom" ? true : undefined),
      signalSets.custom,
      exercise
    ),
  };
};

const metadataFor = (
  exercise: ExerciseSubstitutionCandidate,
  signalSets: Record<keyof ExerciseSubstitutionSignals, ReadonlySet<string>>
): ExerciseMetadata => {
  const muscles = resolvedMuscles(exercise);
  const pattern = inferExerciseMovementPattern(exercise);
  return {
    id: normaliseText(exercise.id ?? exercise.exerciseId ?? exercise.name),
    name: normaliseText(exercise.name),
    keys: exerciseKeys(exercise),
    ...muscles,
    pattern,
    patternFamily: movementPatternFamily(pattern),
    equipment: inferExerciseEquipment(exercise),
    flags: resolveFlags(exercise, signalSets),
  };
};

const matchesMuscle = (metadata: ExerciseMetadata, requestedValue: string) => {
  const requested = canonicalMuscle(requestedValue);
  if (!requested) return true;
  if (metadata.muscles.includes(requested)) return true;
  return metadata.muscleFamilies.includes(muscleFamily(requested));
};

const matchesPattern = (metadata: ExerciseMetadata, requestedValue: string) => {
  const requested = inferExerciseMovementPattern({ name: requestedValue, pattern: requestedValue });
  return metadata.pattern === requested;
};

const matchesBoolean = (actual: boolean, expected: boolean | undefined) =>
  expected === undefined || actual === expected;

const humanise = (value: string) => value.toLowerCase();

const numericSimilarity = (
  current: ExerciseSubstitutionCandidate,
  candidate: ExerciseSubstitutionCandidate
) => {
  const keys = [
    "stimulus",
    "fatigue",
    "stimulusToFatigue",
    "axialLoad",
    "systemicFatigue",
    "stabilityDemand",
    "skillDemand",
    "jointFriendliness",
  ] as const;
  const distances = keys.flatMap((key) => {
    const left = current[key];
    const right = candidate[key];
    return Number.isFinite(left) && Number.isFinite(right) ? [Math.min(10, Math.abs(Number(left) - Number(right))) / 10] : [];
  });
  if (distances.length === 0) return 0;
  return 6 * (1 - distances.reduce((sum, value) => sum + value, 0) / distances.length);
};

const progressionTransfer = (
  current: ExerciseSubstitutionCandidate,
  candidate: ExerciseSubstitutionCandidate
) => {
  const currentProgressionKey = normaliseText(current.progressionKey ?? current.progressionHistoryKey);
  const candidateProgressionKey = normaliseText(candidate.progressionKey ?? candidate.progressionHistoryKey);
  if (currentProgressionKey && currentProgressionKey === candidateProgressionKey) {
    return {
      canTransfer: true,
      reason: "Uses the same explicit progression key.",
    };
  }

  const currentId = normaliseText(current.id ?? current.exerciseId);
  const candidateId = normaliseText(candidate.id ?? candidate.exerciseId);
  if ((currentId && currentId === candidateId) || normaliseText(current.name) === normaliseText(candidate.name)) {
    return {
      canTransfer: true,
      reason: "This is the same exercise identity.",
    };
  }

  return {
    canTransfer: false,
    reason: "Treat this as a new progression because exercise loads are specific.",
  };
};

/**
 * Rank safe, intent-preserving alternatives while returning the original
 * candidate objects. Hard filters run before scoring; ties are deterministic.
 */
export const rankExerciseSubstitutions = <T extends ExerciseSubstitutionCandidate>(
  current: ExerciseSubstitutionCandidate,
  candidates: readonly T[],
  options: ExerciseSubstitutionOptions = {}
): RankedExerciseSubstitution<T>[] => {
  const filters = options.filters ?? {};
  const signals = options.signals ?? {};
  const signalSets: Record<keyof ExerciseSubstitutionSignals, ReadonlySet<string>> = {
    favourite: collectionToSet(signals.favourite),
    previouslyUsed: collectionToSet(signals.previouslyUsed),
    painFree: collectionToSet(signals.painFree),
    painful: collectionToSet(signals.painful),
    custom: collectionToSet(signals.custom),
  };
  const excluded = collectionToSet(options.excludeExerciseKeys);
  const currentMetadata = metadataFor(current, signalSets);
  const requestedMuscles = asArray(filters.muscle);
  const requestedEquipment = asArray(filters.equipment);
  const requestedPatterns = asArray(filters.movementPattern);
  const seen = new Set<string>();

  const ranked = candidates.flatMap((candidate) => {
    const metadata = metadataFor(candidate, signalSets);
    const sameId = Boolean(currentMetadata.id && metadata.id && currentMetadata.id === metadata.id);
    const sameName = Boolean(currentMetadata.name && currentMetadata.name === metadata.name);
    if (sameId || sameName || metadata.keys.some((key) => excluded.has(key))) return [];

    if (requestedMuscles.length > 0 && !requestedMuscles.some((value) => matchesMuscle(metadata, value))) return [];
    if (
      requestedEquipment.length > 0 &&
      !requestedEquipment.some((value) => equipmentFilterMatches(metadata.equipment, value))
    ) {
      return [];
    }
    if (requestedPatterns.length > 0 && !requestedPatterns.some((value) => matchesPattern(metadata, value))) return [];
    if (!matchesBoolean(metadata.flags.favourite, filters.favourite)) return [];
    if (!matchesBoolean(metadata.flags.previouslyUsed, filters.previouslyUsed)) return [];
    if (!matchesBoolean(metadata.flags.painFree, filters.painFree)) return [];
    if (!matchesBoolean(metadata.flags.custom, filters.custom)) return [];

    const samePrimaryMuscleFamily = Boolean(
      currentMetadata.primaryMuscleFamily &&
        metadata.primaryMuscleFamily &&
        currentMetadata.primaryMuscleFamily === metadata.primaryMuscleFamily
    );
    const samePrimaryMuscle = Boolean(
      currentMetadata.primaryMuscle && currentMetadata.primaryMuscle === metadata.primaryMuscle
    );
    const keepsPrimaryMuscle = Boolean(
      currentMetadata.primaryMuscle && metadata.muscles.includes(currentMetadata.primaryMuscle)
    );
    if (
      !options.allowCrossMuscle &&
      currentMetadata.primaryMuscleFamily &&
      metadata.primaryMuscleFamily &&
      !samePrimaryMuscleFamily
    ) {
      return [];
    }

    // A normalized name is the exercise identity across catalogs. Adding it
    // only after hard eligibility checks keeps the first eligible source in
    // caller order without letting an ineligible duplicate shadow it.
    const dedupeKey = metadata.name || metadata.id;
    if (!dedupeKey || seen.has(dedupeKey)) return [];
    seen.add(dedupeKey);

    let score = 0;
    const reasons: Reason[] = [];
    const warnings: string[] = [];

    if (samePrimaryMuscleFamily) {
      score += 48;
      if (!samePrimaryMuscle && !keepsPrimaryMuscle) {
        reasons.push({
          priority: 100,
          text: `Same ${humanise(currentMetadata.primaryMuscleFamily || metadata.primaryMuscleFamily)} focus.`,
        });
      }
    } else if (metadata.muscleFamilies.length === 0) {
      score -= 14;
      warnings.push("Muscle targeting is not recorded.");
    } else {
      score -= 24;
      warnings.push("Targets a different muscle group.");
    }

    if (samePrimaryMuscle) {
      score += 16;
      reasons.push({ priority: 105, text: `Matches the ${humanise(metadata.primaryMuscle)} emphasis.` });
    } else if (keepsPrimaryMuscle) {
      score += 9;
      reasons.push({ priority: 95, text: `Keeps ${humanise(currentMetadata.primaryMuscle)} involved.` });
    }

    if (currentMetadata.pattern !== "unknown" && currentMetadata.pattern === metadata.pattern) {
      score += 34;
      reasons.push({ priority: 110, text: `Same ${humanise(metadata.pattern)} pattern.` });
    } else if (
      currentMetadata.patternFamily !== "unknown" &&
      currentMetadata.patternFamily === metadata.patternFamily
    ) {
      score += 14;
      reasons.push({ priority: 85, text: `Similar ${humanise(metadata.patternFamily)} pattern.` });
      warnings.push("Movement angle differs from the original.");
    } else if (currentMetadata.pattern !== "unknown" && metadata.pattern !== "unknown") {
      score -= 10;
      warnings.push("Movement pattern differs from the original.");
    }

    const sharedEquipment = currentMetadata.equipment.filter((item) => metadata.equipment.includes(item));
    if (sharedEquipment.length > 0) {
      score += 9;
      reasons.push({ priority: 80, text: `Same ${humanise(sharedEquipment[0])} loading.` });
    } else if (currentMetadata.equipment.length > 0 && metadata.equipment.length > 0) {
      score -= 4;
      warnings.push("Equipment differs, so loads may not compare directly.");
    }

    if (metadata.flags.painful) {
      score -= 40;
      warnings.unshift("Marked as painful; confirm a pain-free setup before use.");
    } else if (metadata.flags.painFree) {
      score += 8;
      reasons.push({ priority: 90, text: "Recorded as pain-free." });
    }
    if (metadata.flags.favourite) {
      score += 6;
      reasons.push({ priority: 75, text: "Saved as a favourite." });
    }
    if (metadata.flags.previouslyUsed) {
      score += 5;
      reasons.push({ priority: 70, text: "Previously used." });
    }
    if (metadata.flags.custom) {
      score += 1;
      reasons.push({ priority: 65, text: "Your custom exercise." });
      if (metadata.muscles.length === 0 || metadata.pattern === "unknown" || metadata.equipment.length === 0) {
        warnings.push("Custom exercise has limited matching data.");
      }
    }

    if (candidate.jointFriendliness !== undefined && Number.isFinite(candidate.jointFriendliness)) {
      score += Math.max(0, Math.min(10, Number(candidate.jointFriendliness))) * 0.3;
    } else if (candidate.jointFriendly) {
      score += 2;
    }
    if (candidate.stimulusToFatigue !== undefined && Number.isFinite(candidate.stimulusToFatigue)) {
      score += Math.max(0, Math.min(10, Number(candidate.stimulusToFatigue))) * 0.25;
    }
    score += numericSimilarity(current, candidate);
    if (current.lengthBias && candidate.lengthBias && normaliseText(current.lengthBias) === normaliseText(candidate.lengthBias)) {
      score += 2;
    }

    const transfer = progressionTransfer(current, candidate);
    if (transfer.canTransfer) {
      reasons.push({ priority: 60, text: "Progression history can transfer." });
    } else {
      warnings.push("Start a separate progression history.");
    }

    const conciseReasons = unique(
      reasons
        .sort((left, right) => right.priority - left.priority || left.text.localeCompare(right.text))
        .map((reason) => reason.text)
    ).slice(0, 4);

    return [
      {
        exercise: candidate,
        score: Math.round(score * 10) / 10,
        reasons: conciseReasons,
        warnings: unique(warnings),
        canTransferProgressionHistory: transfer.canTransfer,
        historyTransferReason: transfer.reason,
      } satisfies RankedExerciseSubstitution<T>,
    ];
  });

  const limit = Number.isFinite(options.limit) ? Math.max(0, Math.min(100, Math.trunc(Number(options.limit)))) : 12;
  return ranked
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.exercise.name.localeCompare(right.exercise.name) ||
        normaliseText(left.exercise.id ?? left.exercise.exerciseId).localeCompare(
          normaliseText(right.exercise.id ?? right.exercise.exerciseId)
        )
    )
    .slice(0, limit);
};
