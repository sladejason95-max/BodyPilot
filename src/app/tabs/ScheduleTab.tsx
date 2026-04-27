import React from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { scheduleDayOrder } from "../constants";
import { conditioningModalityLibrary } from "../performance_libraries";
import type { PeakWeekDayPlan, PeakWeekGoal, ScheduleEvent, TrackerDay, WorkoutDay } from "../types";
import {
  AdvancedEditorCard,
  EmptyStatePanel,
  SectionCard,
  WorkspaceSummaryRail,
} from "../workspace_ui";
import {
  BulletChart,
  ComparisonBars,
  InfographicPanel,
  MiniLineChart,
} from "../visual_storytelling";

type UserMode = "athlete" | "coach";
type ScheduleEventLocal = ScheduleEvent & { day: string };

type SummaryItem = {
  label: string;
  title: string;
  detail: string;
};

type WeekDecisionBridge = {
  title: string;
  body: string;
  support: string;
};

type SchedulePrimaryAction = {
  title: string;
  body: string;
  cta: string;
};

type ScheduleDensitySummary = {
  total: number;
  busiestDay: string;
  busiestCount: number;
  categories: number;
};

type ScheduleExecutionLane = {
  day: string;
  headline: string;
  events: ScheduleEventLocal[];
};

type SessionOption = {
  id: string;
  label: string;
};

type ScheduledExerciseDetail = {
  id: string;
  name: string;
  category: string;
  sets: number;
  repRange: string;
  rir: number;
  note?: string;
};

type DayMacroPlan = {
  protein: number;
  carbs: number;
  fats: number;
  meals: number;
  intraCarbs: number;
};

type MacroProgressionWeek = {
  id: string;
  label: string;
  focus: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  deltaCalories: number;
  deltaCarbs: number;
  steps: number;
  cardioMinutes: number;
  intakeBufferPct: number;
  adjustmentLabel: string;
  adjustmentDetail: string;
  trainingAdjustment: string;
  projectedCondition: number;
  projectedRecovery: number;
};

type UpdateScheduleEvent = <K extends keyof ScheduleEventLocal>(
  eventId: string,
  key: K,
  value: ScheduleEventLocal[K]
) => void;

type ScheduleTabProps = {
  userMode: UserMode;
  canEditPlan: boolean;
  scheduleViewMode: "week" | "month";
  setScheduleViewMode: (value: "week" | "month") => void;
  scheduleFocusCards: SummaryItem[];
  weekDecisionBridge: WeekDecisionBridge;
  schedulePrimaryAction: SchedulePrimaryAction;
  goToTab: (tab: string) => void;
  openTrackerSurface: (surface: "dashboard" | "log" | "insights" | "week") => void;
  publishCoachDecision: () => void;
  populateScheduleFromPlan: () => void;
  scheduleRiskFlags: string[];
  addScheduleEvent: () => void;
  scheduleDensitySummary: ScheduleDensitySummary;
  scheduleExecutionLanes: ScheduleExecutionLane[];
  showAdvancedSchedule: boolean;
  toggleAdvancedSchedule: () => void;
  schedule: ScheduleEventLocal[];
  updateScheduleEvent: UpdateScheduleEvent;
  removeScheduleEvent: (eventId: string) => void;
  selectedCalendarDate: string;
  setSelectedCalendarDate: (value: string) => void;
  contestDate: string;
  setContestDate: (value: string) => void;
  openDateReference: (date: string) => void;
  workoutSplit: WorkoutDay[];
  trackerDays: TrackerDay[];
  selectedCalendarSessionLabel: string;
  selectedScheduledWorkoutDay: WorkoutDay | null;
  selectedScheduledExercises: ScheduledExerciseDetail[];
  scheduledSessionOptions: SessionOption[];
  getScheduledSessionLabelForDate: (value: string) => string;
  getScheduledSessionIdForDate: (value: string) => string;
  setScheduledSessionForDate: (value: string, dayId: string) => void;
  swapScheduledSession: (value: string, direction: -1 | 1) => void;
  todayIso: string;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
  loadedMealPlan: DayMacroPlan;
  macroProgressionWeeks: MacroProgressionWeek[];
  applyAdaptiveWeekPlan: () => void;
  peakWeekGoal: PeakWeekGoal;
  peakWeekPlan: PeakWeekDayPlan[];
  applyPeakDayPlan: (planId: string) => void;
};

const calendarWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const toIso = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getScheduleDay = (iso: string) => {
  const dayIndex = toDate(iso).getDay();
  return scheduleDayOrder[(dayIndex + 6) % 7] ?? "Mon";
};

const formatMonth = (iso: string) =>
  toDate(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const formatSelectedDate = (iso: string) =>
  toDate(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const moveMonth = (iso: string, direction: -1 | 1) => {
  const current = toDate(iso);
  return toIso(new Date(current.getFullYear(), current.getMonth() + direction, 1));
};

const startOfWeek = (iso: string) => {
  const current = toDate(iso);
  const offset = (current.getDay() + 6) % 7;
  return addDays(current, -offset);
};

const formatWeekRange = (iso: string) => {
  const start = startOfWeek(iso);
  const end = addDays(start, 6);

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
};

const moveScheduleWindow = (iso: string, direction: -1 | 1, mode: "week" | "month") =>
  mode === "month" ? moveMonth(iso, direction) : toIso(addDays(startOfWeek(iso), direction * 7));

const detailPlaceholder = (category: ScheduleEvent["category"]) => {
  if (category === "Meal") return "50P / 40C / 10F or short meal note";
  if (category === "Training") return "7 exercises, 22 sets, or quick session note";
  if (category === "Recovery") return "Sleep, cardio, posing, or recovery focus";
  if (category === "Check-in") return "Photos, measurements, notes, and review";
  return "Dose, timing, or support note";
};

const peakToneClass = (tone: PeakWeekDayPlan["tone"], active = false) => {
  if (active) return "border-slate-900 bg-slate-950 text-white dark:border-white/20 dark:bg-white dark:text-slate-950";

  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:text-emerald-100";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-500/25 dark:bg-sky-950/25 dark:text-sky-100";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-100";
    default:
      return "border-slate-200 bg-white/86 text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100";
  }
};

export default function ScheduleTab(props: ScheduleTabProps) {
  const {
    userMode,
    canEditPlan,
    scheduleViewMode,
    setScheduleViewMode,
    scheduleFocusCards,
    weekDecisionBridge,
    schedulePrimaryAction,
    goToTab,
    openTrackerSurface,
    publishCoachDecision,
    populateScheduleFromPlan,
    scheduleRiskFlags,
    addScheduleEvent,
    scheduleDensitySummary,
    scheduleExecutionLanes,
    showAdvancedSchedule,
    toggleAdvancedSchedule,
    schedule,
    updateScheduleEvent,
    removeScheduleEvent,
    selectedCalendarDate,
    setSelectedCalendarDate,
    contestDate,
    setContestDate,
    openDateReference,
    trackerDays,
    selectedCalendarSessionLabel,
    selectedScheduledWorkoutDay,
    selectedScheduledExercises,
    scheduledSessionOptions,
    getScheduledSessionLabelForDate,
    getScheduledSessionIdForDate,
    setScheduledSessionForDate,
    swapScheduledSession,
    todayIso,
    macroTargets,
    loadedMealPlan,
    macroProgressionWeeks,
    applyAdaptiveWeekPlan,
    peakWeekGoal,
    peakWeekPlan,
    applyPeakDayPlan,
  } = props;

  const showPlanningActions = userMode === "coach" || canEditPlan;
  const [pendingScheduleDeleteId, setPendingScheduleDeleteId] = React.useState<string | null>(null);
  const requestRemoveScheduleEvent = (eventId: string) => {
    if (pendingScheduleDeleteId !== eventId) {
      setPendingScheduleDeleteId(eventId);
      return;
    }

    removeScheduleEvent(eventId);
    setPendingScheduleDeleteId(null);
  };
  const selectedDayRule = getScheduleDay(selectedCalendarDate);
  const selectedTrackerDay = trackerDays.find((day) => day.date === selectedCalendarDate) ?? null;
  const selectedConditioningLabel = React.useMemo(
    () =>
      conditioningModalityLibrary.find((item) => item.id === selectedTrackerDay?.conditioningModalityId)?.label
      ?? "No conditioning logged",
    [selectedTrackerDay]
  );
  const selectedDateEvents = React.useMemo(
    () =>
      schedule
        .filter((event) => event.day === selectedDayRule)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedule, selectedDayRule]
  );

  const calendarDays = React.useMemo(() => {
    const selectedDate = toDate(selectedCalendarDate);
    const gridStart =
      scheduleViewMode === "month"
        ? addDays(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), -((new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() + 6) % 7))
        : startOfWeek(selectedCalendarDate);
    const dayCount = scheduleViewMode === "month" ? 42 : 7;

    return Array.from({ length: dayCount }, (_, index) => {
      const date = addDays(gridStart, index);
      const iso = toIso(date);
      const dayRule = getScheduleDay(iso);
      const trackerDay = trackerDays.find((day) => day.date === iso);
      const events = schedule.filter((event) => event.day === dayRule);
      const focusLabel = getScheduledSessionLabelForDate(iso);
      const completion = Number(trackerDay?.completion ?? 0);
      const hasEvents = events.length > 0 || completion > 0;
      const isFuture = iso > todayIso;
      const isTraining = focusLabel.toLowerCase() !== "rest" && focusLabel.toLowerCase() !== "rest / recovery";

      return {
        iso,
        number: date.getDate(),
        inMonth: date.getMonth() === selectedDate.getMonth(),
        isSelected: iso === selectedCalendarDate,
        focusLabel,
        eventCount: events.length,
        completion,
        isFuture,
        hasEvents,
        isTraining,
      };
    });
  }, [getScheduledSessionLabelForDate, schedule, scheduleViewMode, selectedCalendarDate, todayIso, trackerDays]);

  const selectedSessionId = getScheduledSessionIdForDate(selectedCalendarDate);
  const maxProgressionCalories = Math.max(
    ...macroProgressionWeeks.map((week) => week.calories),
    macroTargets.protein * 4 + macroTargets.carbs * 4 + macroTargets.fats * 9,
    1
  );
  const currentMacroWeek = macroProgressionWeeks[0] ?? null;
  const nextMacroWeek = macroProgressionWeeks[1] ?? null;
  const macroComparisonRows = currentMacroWeek && nextMacroWeek
    ? [
        { label: "Calories", current: currentMacroWeek.calories, next: nextMacroWeek.calories, unit: " kcal", tone: nextMacroWeek.calories < currentMacroWeek.calories ? "amber" as const : "sky" as const },
        { label: "Carbs", current: currentMacroWeek.carbs, next: nextMacroWeek.carbs, unit: "g", tone: nextMacroWeek.carbs < currentMacroWeek.carbs ? "amber" as const : "sky" as const },
        { label: "Steps", current: currentMacroWeek.steps, next: nextMacroWeek.steps, unit: "", tone: nextMacroWeek.steps > currentMacroWeek.steps ? "emerald" as const : "slate" as const },
      ]
    : [];
  const progressionCalories = macroProgressionWeeks.map((week) => week.calories);
  const progressionCarbs = macroProgressionWeeks.map((week) => week.carbs);
  const [showAdvancedProgression, setShowAdvancedProgression] = React.useState(false);
  const selectedPeakPlan = peakWeekPlan.find((day) => day.date === selectedCalendarDate) ?? null;
  const todayPeakPlan = peakWeekPlan.find((day) => day.date === todayIso) ?? null;
  const formatDelta = (value: number, suffix = "") => {
    if (value === 0) return "No change";
    return `${value > 0 ? "+" : ""}${value}${suffix}`;
  };
  const describeMacroMove = (current: MacroProgressionWeek | null, next: MacroProgressionWeek | null) => {
    if (!current || !next) return "Current targets stay active until a new week is generated.";

    if (next.deltaCalories === 0 && next.deltaCarbs === 0) {
      return "Hold calories and carbs next week.";
    }

    const calorieMove =
      next.deltaCalories === 0
        ? "hold calories"
        : `${next.deltaCalories > 0 ? "increase" : "reduce"} calories by ${Math.abs(next.deltaCalories)}`;
    const carbMove =
      next.deltaCarbs === 0
        ? "hold carbs"
        : `${next.deltaCarbs > 0 ? "increase" : "reduce"} carbs by ${Math.abs(next.deltaCarbs)}g`;

    return `${calorieMove}, ${carbMove}.`;
  };
  const currentWeekDateByDay = React.useMemo(
    () =>
      Object.fromEntries(
        calendarWeekdays.map((weekday, index) => [
          weekday,
          toIso(addDays(startOfWeek(selectedCalendarDate), index)),
        ])
      ) as Record<string, string>,
    [selectedCalendarDate]
  );

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <WorkspaceSummaryRail
        title="Full calendar"
        description={
          userMode === "coach"
            ? "Use this deeper planner when dates, sessions, or event rows need a real edit. Everyday execution stays in Today."
            : "Broader calendar, weekly nutrition moves, and session anchors stay here."
        }
        items={scheduleFocusCards}
      />

      {userMode === "athlete" ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
          <div className="font-semibold">Calendar depth</div>
          <p className="mt-1">
            Use this for date and session edits. Use Week when you only need to execute.
          </p>
        </div>
      ) : null}

      <SectionCard
        title="Nutrition progression"
        description="Weekly calorie and macro changes stay visible here so the planning engine is easy to compare."
        right={(
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAdvancedProgression((value) => !value)}>
              {showAdvancedProgression ? "Hide advanced" : "Show advanced"}
            </Button>
            {canEditPlan ? (
              <Button size="sm" onClick={applyAdaptiveWeekPlan}>
                Apply this week
              </Button>
            ) : null}
          </div>
        )}
      >
        <div className="mb-4 rounded-[24px] border border-slate-200 bg-white/86 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Next nutrition move
              </div>
              <div className="mt-2 text-lg font-semibold tracking-normal text-slate-950 dark:text-slate-100">
                {describeMacroMove(currentMacroWeek, nextMacroWeek)}
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {nextMacroWeek
                  ? `${currentMacroWeek?.label ?? "Current"} to ${nextMacroWeek.label}: ${currentMacroWeek?.calories ?? 0} -> ${nextMacroWeek.calories} kcal, ${currentMacroWeek?.carbs ?? 0} -> ${nextMacroWeek.carbs}g carbs.`
                  : "The active week is the visible target until another progression week is available."}
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                This week
              </div>
              <div className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
                {currentMacroWeek ? `${currentMacroWeek.calories} kcal` : `${macroTargets.protein * 4 + macroTargets.carbs * 4 + macroTargets.fats * 9} kcal`}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {currentMacroWeek ? `${currentMacroWeek.protein}P / ${currentMacroWeek.carbs}C / ${currentMacroWeek.fats}F` : `${macroTargets.protein}P / ${macroTargets.carbs}C / ${macroTargets.fats}F`}
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                Next week
              </div>
              <div className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
                {nextMacroWeek ? `${nextMacroWeek.calories} kcal` : "Not generated"}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {nextMacroWeek ? `${nextMacroWeek.protein}P / ${nextMacroWeek.carbs}C / ${nextMacroWeek.fats}F` : "Hold active target"}
              </div>
            </div>
          </div>
        </div>
        <InfographicPanel
          title="Week-by-week nutrition picture"
          detail="Tighter weekly targets with the tracking reserve already built in."
        >
          <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniLineChart label="Calories" values={progressionCalories} unit=" kcal" tone="sky" />
              <MiniLineChart label="Carbs" values={progressionCarbs} unit="g" tone="amber" />
            </div>
            <div className="grid gap-3">
              {macroComparisonRows.length > 0 ? (
                <ComparisonBars rows={macroComparisonRows} />
              ) : (
                <BulletChart
                  label="Calories"
                  value={macroTargets.protein * 4 + macroTargets.carbs * 4 + macroTargets.fats * 9}
                  target={macroTargets.protein * 4 + macroTargets.carbs * 4 + macroTargets.fats * 9}
                  unit=" kcal"
                  tone="slate"
                />
              )}
              {currentMacroWeek ? (
                <BulletChart
                  label="This week output"
                  value={currentMacroWeek.steps}
                  target={currentMacroWeek.steps}
                  max={Math.max(currentMacroWeek.steps, nextMacroWeek?.steps ?? 0, 1)}
                  tone="emerald"
                />
              ) : null}
            </div>
          </div>
        </InfographicPanel>
        <div className="grid gap-3 lg:grid-cols-4">
          {macroProgressionWeeks.map((week, index) => {
            const width = Math.max(18, Math.min(100, (week.calories / maxProgressionCalories) * 100));
            const deltaTone =
              week.deltaCalories > 0
                ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/35 dark:text-sky-100"
                : week.deltaCalories < 0
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100"
                  : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200";

            return (
              <div
                key={week.id}
                className={[
                  "rounded-[22px] border p-4 shadow-sm",
                  index === 0
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white/86 dark:border-white/10 dark:bg-white/[0.05]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={index === 0 ? "text-xs font-semibold uppercase text-white/65" : "text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"}>
                      {week.label}
                    </div>
                    <div className={index === 0 ? "mt-2 text-2xl font-semibold text-white" : "mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100"}>
                      {week.calories}
                    </div>
                    <div className={index === 0 ? "mt-1 text-sm text-white/68" : "mt-1 text-sm text-slate-500 dark:text-slate-400"}>
                      kcal target
                    </div>
                  </div>
                  <Badge className={index === 0 ? "border-white/20 bg-white/10 text-white" : deltaTone}>
                    {formatDelta(week.deltaCalories)}
                  </Badge>
                </div>

                <div className={index === 0 ? "mt-4 h-2 rounded-full bg-white/15" : "mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800"}>
                  <div
                    className={index === 0 ? "h-full rounded-full bg-white" : "h-full rounded-full bg-sky-500"}
                    style={{ width: `${width}%` }}
                  />
                </div>

                <div className={index === 0 ? "mt-4 text-sm text-white/82" : "mt-4 text-sm text-slate-700 dark:text-slate-300"}>
                {week.protein}P / {week.carbs}C / {week.fats}F
                </div>
                <div className={index === 0 ? "mt-2 text-xs leading-5 text-white/62" : "mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400"}>
                  Carbs {formatDelta(week.deltaCarbs, "g")}. Condition {week.projectedCondition}/10, recovery {week.projectedRecovery}/10.
                </div>
                <div className={index === 0 ? "mt-2 text-xs leading-5 text-white/62" : "mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400"}>
                  {week.adjustmentLabel}. {week.trainingAdjustment}
                </div>
                <div className={index === 0 ? "mt-3 text-sm leading-6 text-white/74" : "mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"}>
                  {week.focus}
                </div>
              </div>
            );
          })}
        </div>
        {showAdvancedProgression ? (
          <div className="mt-4 overflow-x-auto rounded-[24px] border border-slate-200 bg-white/86 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
            <div className="grid min-w-[760px] grid-cols-[1fr_0.8fr_1.1fr_0.9fr_1.4fr] gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:border-white/10 dark:text-slate-400">
              <span>Week</span>
              <span>Calories</span>
              <span>Protein / Carbs / Fat</span>
              <span>Cardio</span>
              <span>Adjustment</span>
            </div>
            {macroProgressionWeeks.map((week) => (
              <div key={`advanced-${week.id}`} className="grid min-w-[760px] grid-cols-[1fr_0.8fr_1.1fr_0.9fr_1.4fr] gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-700 last:border-b-0 dark:border-white/10 dark:text-slate-300">
                <span className="font-semibold text-slate-950 dark:text-slate-100">{week.label}</span>
                <span>{week.calories} kcal</span>
                <span>{week.protein}P / {week.carbs}C / {week.fats}F</span>
                <span>{week.cardioMinutes} min, {week.steps.toLocaleString()} steps</span>
                <span>{week.adjustmentDetail}</span>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Peak week execution"
        description="The final seven days stay visible as concrete targets, not hidden inside the model."
        right={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Goal: {peakWeekGoal}</Badge>
            {selectedPeakPlan ? (
              <Button size="sm" onClick={() => applyPeakDayPlan(selectedPeakPlan.id)}>
                Apply selected day
              </Button>
            ) : todayPeakPlan ? (
              <Button size="sm" variant="outline" onClick={() => applyPeakDayPlan(todayPeakPlan.id)}>
                Apply today
              </Button>
            ) : null}
          </div>
        )}
      >
        <div className="grid gap-3 lg:grid-cols-7">
          {peakWeekPlan.map((day) => {
            const isSelected = day.date === selectedCalendarDate;
            const isToday = day.date === todayIso;
            const mutedText = isSelected ? "text-white/70 dark:text-slate-600" : "text-slate-500 dark:text-slate-400";
            const bodyText = isSelected ? "text-white/82 dark:text-slate-700" : "text-slate-700 dark:text-slate-300";

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedCalendarDate(day.date)}
                className={[
                  "min-h-[210px] rounded-[22px] border p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
                  peakToneClass(day.tone, isSelected),
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}>
                      {day.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{day.emphasis}</div>
                  </div>
                  {isToday ? <Badge variant="outline" className={isSelected ? "border-white/20 bg-white/10 text-white dark:border-slate-200 dark:text-slate-900" : ""}>Today</Badge> : null}
                </div>
                <div className="mt-3 grid gap-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={mutedText}>Carbs</span>
                    <span className="font-semibold">{day.carbs}g</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={mutedText}>Water</span>
                    <span className="font-semibold">{day.waterLiters.toFixed(2)}L</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={mutedText}>Salt</span>
                    <span className="font-semibold">{day.saltTsp.toFixed(2)} tsp</span>
                  </div>
                </div>
                <div className={`mt-3 text-xs leading-5 ${bodyText}`}>
                  {day.training}. {day.checkIn}.
                </div>
                <div className={`mt-3 rounded-[14px] border px-2.5 py-2 text-xs leading-5 ${isSelected ? "border-white/15 bg-white/10 dark:border-slate-200 dark:bg-slate-50" : "border-slate-200 bg-white/72 dark:border-white/10 dark:bg-slate-950/40"}`}>
                  {day.action}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Week lanes"
        description="Training, food, recovery, and check-in rows stay comparable before opening the calendar editor."
      >
        <div className="grid gap-3 lg:grid-cols-7">
          {scheduleExecutionLanes.map((lane) => {
            const laneDate = currentWeekDateByDay[lane.day] ?? selectedCalendarDate;
            const isSelectedLane = laneDate === selectedCalendarDate;

            return (
              <button
                key={lane.day}
                type="button"
                onClick={() => setSelectedCalendarDate(laneDate)}
                className={[
                  "min-h-[142px] rounded-[20px] border p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
                  isSelectedLane
                    ? "border-slate-900 bg-slate-950 text-white dark:border-white/15 dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white/86 dark:border-white/10 dark:bg-white/[0.05]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={isSelectedLane ? "text-xs font-semibold uppercase text-white/65 dark:text-slate-500" : "text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"}>
                      {lane.day}
                    </div>
                    <div className={isSelectedLane ? "mt-1 text-sm font-semibold text-white dark:text-slate-950" : "mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100"}>
                      {lane.headline}
                    </div>
                  </div>
                  <Badge className={isSelectedLane ? "border-white/20 bg-white/10 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200"}>
                    {lane.events.length}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {lane.events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={isSelectedLane ? "rounded-[14px] border border-white/15 bg-white/10 px-2.5 py-2 text-xs leading-5 text-white/78 dark:border-slate-200 dark:bg-slate-50 dark:text-slate-600" : "rounded-[14px] border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300"}
                    >
                      <span className="font-semibold">{event.time}</span> {event.title}
                    </div>
                  ))}
                  {lane.events.length === 0 ? (
                    <div className={isSelectedLane ? "rounded-[14px] border border-white/15 bg-white/10 px-2.5 py-2 text-xs text-white/70 dark:border-slate-200 dark:bg-slate-50 dark:text-slate-500" : "rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-2.5 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.03]"}>
                      No rows
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {scheduleRiskFlags.length > 0 ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {scheduleRiskFlags.map((flag, index) => (
              <div key={`${flag}-${index}`} className="rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                {flag}
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard
          title={scheduleViewMode === "week" ? "Week calendar editor" : "Month calendar editor"}
          description={scheduleViewMode === "week" ? "Move through the current week when dates or session anchors need adjustment." : "Scan the broader plan and jump into a date only when something needs editing."}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Selected day</div>
                <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{formatSelectedDate(selectedCalendarDate)}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedCalendarSessionLabel}</div>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button onClick={() => openDateReference(selectedCalendarDate)}>Open source</Button>
                <Button variant="outline" onClick={() => openTrackerSurface("week")}>
                  Week
                </Button>
                <Button variant="outline" onClick={() => openTrackerSurface("log")}>
                  Today log
                </Button>
                <Button variant="outline" onClick={() => goToTab("split")}>
                  Training
                </Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">Calendar window</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
                    {scheduleViewMode === "week" ? formatWeekRange(selectedCalendarDate) : formatMonth(selectedCalendarDate)}
                  </div>
                </div>
                <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={scheduleViewMode === "week" ? "default" : "outline"} onClick={() => setScheduleViewMode("week")}>
                      Week
                    </Button>
                    <Button size="sm" variant={scheduleViewMode === "month" ? "default" : "outline"} onClick={() => setScheduleViewMode("month")}>
                      Month
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedCalendarDate(moveScheduleWindow(selectedCalendarDate, -1, scheduleViewMode))}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Prev
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedCalendarDate(moveScheduleWindow(selectedCalendarDate, 1, scheduleViewMode))}>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2">
                {calendarWeekdays.map((weekday) => (
                  <div key={weekday} className="px-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    {weekday}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const progressClass = day.isFuture
                    ? day.isTraining
                      ? "bg-sky-400/70"
                      : "bg-slate-300"
                    : day.completion >= 85
                      ? "bg-emerald-500"
                      : day.completion >= 50
                        ? "bg-amber-500"
                        : day.hasEvents
                          ? "bg-rose-500"
                          : "bg-slate-300";
                  const progressWidth = day.isFuture
                    ? day.isTraining
                      ? 58
                      : 18
                    : Math.max(day.completion, day.hasEvents ? 28 : 8);

                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedCalendarDate(day.iso)}
                      className={[
                        `${scheduleViewMode === "week" ? "min-h-[132px]" : "min-h-[118px]"} rounded-[18px] border p-3 text-left transition hover:-translate-y-[1px] hover:shadow-md`,
                        day.isSelected
                          ? "border-slate-900/15 bg-sky-50 shadow-sm dark:border-sky-500/30 dark:bg-sky-950/25"
                          : day.hasEvents || day.isTraining
                            ? "border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/[0.05]"
                            : "border-slate-200/70 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]",
                        !day.inMonth && scheduleViewMode === "month" ? "opacity-45" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{day.number}</div>
                        {day.eventCount > 0 ? (
                          <Badge
                            variant="outline"
                            className={
                              day.completion >= 85 && !day.isFuture
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100"
                                : day.isFuture
                                  ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-950/35 dark:text-sky-100"
                                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100"
                            }
                          >
                            {day.eventCount}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">{day.focusLabel}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {day.isFuture ? "Planned" : day.completion > 0 ? `${day.completion}% complete` : "Not logged"}
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${progressClass}`} style={{ width: `${Math.min(100, progressWidth)}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Selected date detail">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Target macros</div>
                <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {macroTargets.protein}P / {macroTargets.carbs}C / {macroTargets.fats}F
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Needed for the day</div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Loaded plan</div>
                <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {loadedMealPlan.protein}P / {loadedMealPlan.carbs}C / {loadedMealPlan.fats}F
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {loadedMealPlan.meals} meals, intra {loadedMealPlan.intraCarbs}g
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Day status</div>
                <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {selectedTrackerDay ? `${selectedTrackerDay.completion}% complete` : "Not logged yet"}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {selectedTrackerDay ? `${selectedTrackerDay.steps} steps, energy ${selectedTrackerDay.energy}` : "Open the tracker to mark the day done"}
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white/82 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Output lane</div>
                <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {selectedTrackerDay?.conditioningMinutes ? `${selectedTrackerDay.conditioningMinutes} min` : "No minutes logged"}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {selectedTrackerDay
                    ? `${selectedConditioningLabel}${selectedTrackerDay.posingRounds ? `, ${selectedTrackerDay.posingRounds} posing` : ""}`
                    : "Open Today to log conditioning and posing"}
                </div>
              </div>
            </div>

            {showPlanningActions ? (
              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Split controls for this date</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[auto_auto_1fr]">
                  <Button variant="outline" onClick={() => swapScheduledSession(selectedCalendarDate, -1)}>
                    Move earlier
                  </Button>
                  <Button variant="outline" onClick={() => swapScheduledSession(selectedCalendarDate, 1)}>
                    Move later
                  </Button>
                  <select
                    className="h-10 rounded-[14px] border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950/40"
                    value={selectedSessionId}
                    onChange={(event) => setScheduledSessionForDate(selectedCalendarDate, event.target.value)}
                  >
                    {scheduledSessionOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Planned session</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{selectedCalendarSessionLabel}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {selectedScheduledWorkoutDay
                      ? `${selectedScheduledExercises.length} exercises, ${selectedScheduledExercises.reduce((sum, exercise) => sum + exercise.sets, 0)} total sets`
                      : "Recovery / no training anchor for this date"}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {selectedScheduledExercises.length === 0 ? (
                  <EmptyStatePanel title="Rest / recovery day" detail="No training session is planned for this date. Use the controls above if you need to move a session here." />
                ) : (
                  selectedScheduledExercises.map((exercise, index) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => openDateReference(selectedCalendarDate)}
                      className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {index + 1}. {exercise.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {exercise.sets} sets, {exercise.repRange}, RIR {exercise.rir}
                          </div>
                        </div>
                        <Badge variant="outline">{exercise.category}</Badge>
                      </div>
                      {exercise.note ? <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{exercise.note}</div> : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {showPlanningActions ? (
        <AdvancedEditorCard
          title="Calendar event builder"
          description="Edit one selected date at a time so the calendar stays readable."
          open={showAdvancedSchedule}
          onToggle={toggleAdvancedSchedule}
          summary={`${scheduleDensitySummary.total} scheduled items loaded`}
        >
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Contest timeline</div>
                <div className="mt-3 space-y-2">
                  <label className="space-y-2">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Contest date</div>
                    <Input type="date" value={contestDate} onChange={(event) => setContestDate(event.target.value)} />
                  </label>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Editing rule</div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {schedulePrimaryAction.body}
                </p>
                <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  {weekDecisionBridge.support}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={addScheduleEvent}>Add event to selected day</Button>
              <Button variant="outline" onClick={populateScheduleFromPlan}>
                {schedulePrimaryAction.cta}
              </Button>
              {userMode === "coach" ? (
                <Button variant="outline" onClick={publishCoachDecision}>
                  Republish direction
                </Button>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white/82 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatSelectedDate(selectedCalendarDate)}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedCalendarSessionLabel}</div>
                </div>
                <Badge variant="outline">{selectedDateEvents.length} rows for this day</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="grid gap-3 xl:grid-cols-[0.7fr_0.8fr_1fr_1.2fr_auto]">
                      <label className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Time</div>
                        <Input value={event.time} onChange={(e) => updateScheduleEvent(event.id, "time", e.target.value)} />
                      </label>
                      <label className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Type</div>
                        <select
                          className="h-10 rounded-[14px] border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950/40"
                          value={event.category}
                          onChange={(e) => updateScheduleEvent(event.id, "category", e.target.value as ScheduleEventLocal["category"])}
                        >
                          {["Meal", "Training", "Recovery", "Check-in", "PEDs"].map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Title</div>
                        <Input value={event.title} onChange={(e) => updateScheduleEvent(event.id, "title", e.target.value)} />
                      </label>
                      <label className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Details</div>
                        <Input
                          value={event.detail}
                          placeholder={detailPlaceholder(event.category)}
                          onChange={(e) => updateScheduleEvent(event.id, "detail", e.target.value)}
                        />
                      </label>
                      <div className="flex items-end justify-end">
                        <Button
                          size="sm"
                          variant={pendingScheduleDeleteId === event.id ? "outline" : "ghost"}
                          onClick={() => requestRemoveScheduleEvent(event.id)}
                        >
                          {pendingScheduleDeleteId === event.id ? "Confirm" : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedDateEvents.length === 0 ? (
                  <EmptyStatePanel
                    title="No rows for this selected day"
                    detail="Add only the pieces this day really needs. If the calendar is already clean, do not manufacture more tasks."
                  />
                ) : null}
              </div>
            </div>
          </div>
        </AdvancedEditorCard>
      ) : null}
    </div>
  );
}
