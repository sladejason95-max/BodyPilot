import { create } from "zustand";
import type {
  Athlete,
  ChangeLogEntry,
  ChangeRequest,
  CheckIn,
  Compound,
  HormoneDeltas,
  Meal,
  Preset,
  WorkoutDay,
} from "@/lib/types";
import { defaultCompounds } from "@/lib/config/constants";

type PeakGoal = "dry" | "full" | "balanced";
type WorkspaceRole = "coach" | "client";
type CompoundCategoryFilter = "All" | "Base" | "Orals" | "Ancillary" | "Performance";

type AppState = {
  bodyWeight: number;
  weeksOut: number;
  trainingDay: boolean;
  steps: number;
  waterLiters: number;
  saltTsp: number;
  quenchScoops: number;
  intraCarbs: number;
  sleepQuality: number;
  digestion: number;
  pump: number;
  dryness: number;
  fullness: number;
  waistTrend: number;
  weightTrend: number;
  notes: string;
  timersEnabled: boolean;

  compounds: Compound[];
  compoundCategoryFilter: CompoundCategoryFilter;
  compoundSearch: string;

  hormoneDeltas: HormoneDeltas;

  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  estimatedTdee: number;

  presetName: string;
  savedPresets: Preset[];
  checkInHistory: CheckIn[];
  checkInLabel: string;

  peakWeekEnabled: boolean;
  daysOut: number;
  peakGoal: PeakGoal;

  meals: Meal[];
  workoutSplit: WorkoutDay[];

  workspaceRole: WorkspaceRole;
  coachNote: string;
  clientUpdate: string;
  clearCommentsAfterCheckIn: boolean;

  changeRequests: ChangeRequest[];
  changeLog: ChangeLogEntry[];

  athletes: Athlete[];
  activeAthleteId: string;

  setBodyWeight: (value: number) => void;
  setWeeksOut: (value: number) => void;
  setTrainingDay: (value: boolean) => void;
  setSteps: (value: number) => void;
  setWaterLiters: (value: number) => void;
  setSaltTsp: (value: number) => void;
  setQuenchScoops: (value: number) => void;
  setIntraCarbs: (value: number) => void;
  setSleepQuality: (value: number) => void;
  setDigestion: (value: number) => void;
  setPump: (value: number) => void;
  setDryness: (value: number) => void;
  setFullness: (value: number) => void;
  setWaistTrend: (value: number) => void;
  setWeightTrend: (value: number) => void;
  setNotes: (value: string) => void;
  setTimersEnabled: (value: boolean) => void;

  setCompounds: (value: Compound[] | ((prev: Compound[]) => Compound[])) => void;
  setCompoundCategoryFilter: (value: CompoundCategoryFilter) => void;
  setCompoundSearch: (value: string) => void;

  setHormoneDeltas: (
    value: HormoneDeltas | ((prev: HormoneDeltas) => HormoneDeltas)
  ) => void;

  setProteinTarget: (value: number) => void;
  setCarbTarget: (value: number) => void;
  setFatTarget: (value: number) => void;
  setEstimatedTdee: (value: number) => void;

  setPresetName: (value: string) => void;
  setSavedPresets: (value: Preset[] | ((prev: Preset[]) => Preset[])) => void;
  setCheckInHistory: (value: CheckIn[] | ((prev: CheckIn[]) => CheckIn[])) => void;
  setCheckInLabel: (value: string) => void;

  setPeakWeekEnabled: (value: boolean) => void;
  setDaysOut: (value: number) => void;
  setPeakGoal: (value: PeakGoal) => void;

  setMeals: (value: Meal[] | ((prev: Meal[]) => Meal[])) => void;
  setWorkoutSplit: (value: WorkoutDay[] | ((prev: WorkoutDay[]) => WorkoutDay[])) => void;

  setWorkspaceRole: (value: WorkspaceRole) => void;
  setCoachNote: (value: string) => void;
  setClientUpdate: (value: string) => void;
  setClearCommentsAfterCheckIn: (value: boolean) => void;

  setChangeRequests: (
    value: ChangeRequest[] | ((prev: ChangeRequest[]) => ChangeRequest[])
  ) => void;
  setChangeLog: (
    value: ChangeLogEntry[] | ((prev: ChangeLogEntry[]) => ChangeLogEntry[])
  ) => void;

  setAthletes: (value: Athlete[] | ((prev: Athlete[]) => Athlete[])) => void;
  setActiveAthleteId: (value: string) => void;

  resetCoreState: () => void;
};

const initialState = {
  bodyWeight: 193,
  weeksOut: 10,
  trainingDay: true,
  steps: 9000,
  waterLiters: 4,
  saltTsp: 1.75,
  quenchScoops: 3,
  intraCarbs: 95,
  sleepQuality: 5,
  digestion: 6,
  pump: 7,
  dryness: 6,
  fullness: 7,
  waistTrend: -0.1,
  weightTrend: -0.9,
  notes: "",
  timersEnabled: true,

  compounds: defaultCompounds,
  compoundCategoryFilter: "All" as CompoundCategoryFilter,
  compoundSearch: "",

  hormoneDeltas: {
    testosterone: 0,
    estrogen: 0,
    cortisolShift: 0,
    thyroidShift: 0,
    insulinSensitivity: 0,
    waterRetentionBias: 0,
  },

  proteinTarget: 230,
  carbTarget: 220,
  fatTarget: 50,
  estimatedTdee: 2900,

  presetName: "",
  savedPresets: [] as Preset[],
  checkInHistory: [] as CheckIn[],
  checkInLabel: "",

  peakWeekEnabled: false,
  daysOut: 7,
  peakGoal: "balanced" as PeakGoal,

  meals: [
    { id: "1", name: "Meal 1", protein: 50, carbs: 30, fats: 15 },
    { id: "2", name: "Meal 2", protein: 50, carbs: 30, fats: 15 },
  ] as Meal[],

  workoutSplit: [
    { id: "1", day: "Day 1", focus: "Push", intensity: 7 },
    { id: "2", day: "Day 2", focus: "Pull", intensity: 7 },
  ] as WorkoutDay[],

  workspaceRole: "coach" as WorkspaceRole,
  coachNote: "Hold carbs steady, protect digestion, and keep training quality high.",
  clientUpdate: "Morning look was tighter, pump was good, digestion was slightly heavy post workout.",
  clearCommentsAfterCheckIn: true,

  changeRequests: [
    { id: "1", title: "Adjust intra carbs", detail: "+10g intra for the next 2 sessions", status: "pending" },
    { id: "2", title: "Lower split intensity", detail: "Reduce all training-day intensity by 1 for recovery", status: "pending" },
  ] as ChangeRequest[],

  changeLog: [
    { id: "1", actor: "coach", message: "Initial setup loaded. Track readiness before making aggressive changes." },
  ] as ChangeLogEntry[],

  athletes: [
    { id: "a1", name: "Jason", division: "Men's Physique", status: "Active Prep", weeksOut: 10 },
    { id: "a2", name: "Client 2", division: "Classic Physique", status: "Offseason", weeksOut: 18 },
  ] as Athlete[],

  activeAthleteId: "a1",
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setBodyWeight: (value) => set({ bodyWeight: value }),
  setWeeksOut: (value) => set({ weeksOut: value }),
  setTrainingDay: (value) => set({ trainingDay: value }),
  setSteps: (value) => set({ steps: value }),
  setWaterLiters: (value) => set({ waterLiters: value }),
  setSaltTsp: (value) => set({ saltTsp: value }),
  setQuenchScoops: (value) => set({ quenchScoops: value }),
  setIntraCarbs: (value) => set({ intraCarbs: value }),
  setSleepQuality: (value) => set({ sleepQuality: value }),
  setDigestion: (value) => set({ digestion: value }),
  setPump: (value) => set({ pump: value }),
  setDryness: (value) => set({ dryness: value }),
  setFullness: (value) => set({ fullness: value }),
  setWaistTrend: (value) => set({ waistTrend: value }),
  setWeightTrend: (value) => set({ weightTrend: value }),
  setNotes: (value) => set({ notes: value }),
  setTimersEnabled: (value) => set({ timersEnabled: value }),

  setCompounds: (value) =>
    set((state) => ({
      compounds: typeof value === "function" ? value(state.compounds) : value,
    })),
  setCompoundCategoryFilter: (value) => set({ compoundCategoryFilter: value }),
  setCompoundSearch: (value) => set({ compoundSearch: value }),

  setHormoneDeltas: (value) =>
    set((state) => ({
      hormoneDeltas:
        typeof value === "function" ? value(state.hormoneDeltas) : value,
    })),

  setProteinTarget: (value) => set({ proteinTarget: value }),
  setCarbTarget: (value) => set({ carbTarget: value }),
  setFatTarget: (value) => set({ fatTarget: value }),
  setEstimatedTdee: (value) => set({ estimatedTdee: value }),

  setPresetName: (value) => set({ presetName: value }),
  setSavedPresets: (value) =>
    set((state) => ({
      savedPresets:
        typeof value === "function" ? value(state.savedPresets) : value,
    })),
  setCheckInHistory: (value) =>
    set((state) => ({
      checkInHistory:
        typeof value === "function" ? value(state.checkInHistory) : value,
    })),
  setCheckInLabel: (value) => set({ checkInLabel: value }),

  setPeakWeekEnabled: (value) => set({ peakWeekEnabled: value }),
  setDaysOut: (value) => set({ daysOut: value }),
  setPeakGoal: (value) => set({ peakGoal: value }),

  setMeals: (value) =>
    set((state) => ({
      meals: typeof value === "function" ? value(state.meals) : value,
    })),
  setWorkoutSplit: (value) =>
    set((state) => ({
      workoutSplit:
        typeof value === "function" ? value(state.workoutSplit) : value,
    })),

  setWorkspaceRole: (value) => set({ workspaceRole: value }),
  setCoachNote: (value) => set({ coachNote: value }),
  setClientUpdate: (value) => set({ clientUpdate: value }),
  setClearCommentsAfterCheckIn: (value) =>
    set({ clearCommentsAfterCheckIn: value }),

  setChangeRequests: (value) =>
    set((state) => ({
      changeRequests:
        typeof value === "function" ? value(state.changeRequests) : value,
    })),
  setChangeLog: (value) =>
    set((state) => ({
      changeLog: typeof value === "function" ? value(state.changeLog) : value,
    })),

  setAthletes: (value) =>
    set((state) => ({
      athletes: typeof value === "function" ? value(state.athletes) : value,
    })),
  setActiveAthleteId: (value) => set({ activeAthleteId: value }),

  resetCoreState: () => set({ ...initialState }),
}));