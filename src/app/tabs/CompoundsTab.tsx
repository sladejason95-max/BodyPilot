import React from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { compoundLibraryCatalog } from "../compound_library_catalog";
import { clamp, inputClass, panelHoverClass, scheduleDayOrder, softPanelClass } from "../constants";
import { chartAxisProps, chartGridProps, ChartTooltip } from "../stage_prep_shared";
import {
  AdvancedEditorCard,
  AnalyticsStat,
  ChartCard,
  EmptyStatePanel,
  SectionCard,
  SignalTile,
  WorkspaceSummaryRail,
} from "../workspace_ui";

type UserMode = "athlete" | "coach";

type SummaryItem = {
  label: string;
  title: string;
  detail: string;
};

type CompoundsPrimaryAction = {
  title: string;
  body: string;
  cta: string;
};

type CompoundSignal = {
  label: string;
  value: number;
  helper: string;
};

type CompoundWeekBurdenSummary = {
  busiestDay: string;
};

type CompoundTotals = {
  fullness: number;
  recovery: number;
  dryness: number;
  performance: number;
  stress: number;
  digestion: number;
};

type CompoundDayBurden = {
  day: string;
  base: number;
  performance: number;
  orals: number;
  ancillary: number;
};

type CompoundScheduleRow = {
  id: string;
  day: string;
  amount: number;
};

type CompoundRecord = {
  id: string;
  name?: string;
  category: string;
  enabled: boolean;
  dose: number;
  unit?: string;
  halfLifeDays?: number;
  anabolicRating?: number;
  androgenicRating?: number;
  fullness: number;
  dryness: number;
  performance: number;
  recovery: number;
  stress: number;
  digestion: number;
  schedule?: CompoundScheduleRow[];
};

type CompoundEffectKey = keyof Pick<CompoundRecord, "fullness" | "dryness" | "performance" | "recovery" | "stress" | "digestion">;

type ExposurePoint = Record<string, string | number>;

type ExposureLine = {
  key: string;
  label: string;
  color: string;
};

type CompoundsTabProps = {
  userMode: UserMode;
  canEditPlan: boolean;
  stackFocusCards: SummaryItem[];
  compoundsPrimaryAction: CompoundsPrimaryAction;
  goToTab: (tab: string) => void;
  openTrackerSurface: (surface: "dashboard" | "log" | "insights" | "week") => void;
  openAdvancedCompounds: () => void;
  enabledCompounds: CompoundRecord[];
  totalWeeklyCompoundDose: number;
  compoundWeekBurdenSummary: CompoundWeekBurdenSummary;
  primaryLimiter: string;
  coachRecommendation: { action: string };
  recoveryScore: number;
  compoundSignalSummary: CompoundSignal[];
  metricsTone: (value: number) => string;
  compoundRiskFlags: string[];
  compoundMonitoringCards: SummaryItem[];
  compoundMonitoringFlags: string[];
  compoundLibrarySelection: string;
  setCompoundLibrarySelection: (value: string) => void;
  addCompoundFromLibrary: () => void;
  customCompoundName: string;
  setCustomCompoundName: (value: string) => void;
  customCompoundHalfLife: number;
  setCustomCompoundHalfLife: (value: number) => void;
  customCompoundAnabolic: number;
  setCustomCompoundAnabolic: (value: number) => void;
  customCompoundAndrogenic: number;
  setCustomCompoundAndrogenic: (value: number) => void;
  addCustomCompound: () => void;
  stackAnabolicRating: number;
  stackAndrogenicRating: number;
  compoundDailyBurden: CompoundDayBurden[];
  compoundTotals: CompoundTotals;
  showAdvancedCompounds: boolean;
  toggleAdvancedCompounds: () => void;
  compounds: CompoundRecord[];
  getCompoundMismatchFlags: (compound: CompoundRecord, context: Record<string, unknown>) => string[];
  hasCompoundMatch: (compounds: CompoundRecord[], pattern: RegExp) => boolean;
  hasScienceFlag: (compounds: CompoundRecord[], predicate: (science: any) => boolean) => boolean;
  fullnessScore: number;
  drynessScore: number;
  drynessLimiterReason: string;
  waterLiters: number;
  saltTsp: number;
  intraCarbs: number;
  displayCompoundName: (compound: CompoundRecord) => string;
  getCompoundWeeklyTotalValue: (compound: CompoundRecord) => number;
  getCompoundSignalImpactValue: (compound: CompoundRecord, key: CompoundEffectKey) => number;
  updateCompound: (compoundId: string, key: string, value: string | number | boolean) => void;
  removeCompound: (compoundId: string) => void;
  addCompoundScheduleRow: (compoundId: string) => void;
  updateCompoundScheduleRow: (compoundId: string, rowId: string, patch: Partial<CompoundScheduleRow>) => void;
  deleteCompoundScheduleRow: (compoundId: string, rowId: string) => void;
  compoundExposureChart: {
    weekly: ExposurePoint[];
    progression: ExposurePoint[];
    lines: ExposureLine[];
    totalColor: string;
  };
};

type StackDriverCard = {
  label: string;
  value: number;
  accent: string;
  helping: string[];
  limiting: string[];
};

const summarizeCompoundDrivers = (
  compounds: CompoundRecord[],
  displayCompoundName: (compound: CompoundRecord) => string,
  getCompoundSignalImpactValue: (compound: CompoundRecord, key: CompoundEffectKey) => number,
  key: CompoundEffectKey,
  direction: "positive" | "negative"
) => {
  return compounds
    .map((compound) => ({ compound, impact: getCompoundSignalImpactValue(compound, key) }))
    .filter((item) => direction === "positive" ? item.impact > 0.05 : item.impact < -0.05)
    .sort((left, right) => direction === "positive" ? right.impact - left.impact : left.impact - right.impact)
    .map(({ compound, impact }) => `${displayCompoundName(compound)} (${impact > 0 ? "+" : ""}${Number(impact.toFixed(1))})`);
};

const formatHalfLife = (value?: number) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
};

export default function CompoundsTab(props: CompoundsTabProps) {
  const {
    userMode,
    canEditPlan,
    stackFocusCards,
    compoundsPrimaryAction,
    goToTab,
    openTrackerSurface,
    openAdvancedCompounds,
    enabledCompounds,
    totalWeeklyCompoundDose,
    compoundWeekBurdenSummary,
    primaryLimiter,
    coachRecommendation,
    recoveryScore,
    compoundSignalSummary,
    metricsTone,
    compoundRiskFlags,
    compoundMonitoringCards,
    compoundMonitoringFlags,
    compoundLibrarySelection,
    setCompoundLibrarySelection,
    addCompoundFromLibrary,
    customCompoundName,
    setCustomCompoundName,
    customCompoundHalfLife,
    setCustomCompoundHalfLife,
    customCompoundAnabolic,
    setCustomCompoundAnabolic,
    customCompoundAndrogenic,
    setCustomCompoundAndrogenic,
    addCustomCompound,
    stackAnabolicRating,
    stackAndrogenicRating,
    compoundTotals,
    showAdvancedCompounds,
    toggleAdvancedCompounds,
    compounds,
    drynessLimiterReason,
    waterLiters,
    saltTsp,
    intraCarbs,
    fullnessScore,
    drynessScore,
    displayCompoundName,
    getCompoundWeeklyTotalValue,
    getCompoundSignalImpactValue,
    updateCompound,
    removeCompound,
    addCompoundScheduleRow,
    updateCompoundScheduleRow,
    deleteCompoundScheduleRow,
    compoundExposureChart,
  } = props;

  const [exposureView, setExposureView] = React.useState<"weekly" | "progression">("weekly");
  const [pendingCompoundDeleteId, setPendingCompoundDeleteId] = React.useState<string | null>(null);
  const [pendingDoseDeleteKey, setPendingDoseDeleteKey] = React.useState<string | null>(null);
  const advancedEditorRef = React.useRef<HTMLDivElement | null>(null);

  const requestRemoveCompound = (compoundId: string) => {
    if (pendingCompoundDeleteId !== compoundId) {
      setPendingCompoundDeleteId(compoundId);
      return;
    }

    removeCompound(compoundId);
    setPendingCompoundDeleteId(null);
  };

  const requestDeleteCompoundScheduleRow = (compoundId: string, rowId: string) => {
    const deleteKey = `${compoundId}:${rowId}`;
    if (pendingDoseDeleteKey !== deleteKey) {
      setPendingDoseDeleteKey(deleteKey);
      return;
    }

    deleteCompoundScheduleRow(compoundId, rowId);
    setPendingDoseDeleteKey(null);
  };

  const revealAdvancedCompounds = React.useCallback(() => {
    openAdvancedCompounds();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        advancedEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [openAdvancedCompounds]);

  const primaryActionLabel = canEditPlan
    ? compoundsPrimaryAction.cta
    : primaryLimiter === "Digestion"
      ? "Review meals"
      : "Review this week";

  const handlePrimaryAction = React.useCallback(() => {
    if (canEditPlan) {
      revealAdvancedCompounds();
      return;
    }

    if (primaryLimiter === "Digestion") {
      goToTab("nutrition");
      return;
    }

    openTrackerSurface("week");
  }, [canEditPlan, goToTab, openTrackerSurface, primaryLimiter, revealAdvancedCompounds]);

  const stackDriverCards = React.useMemo<StackDriverCard[]>(() => {
    const fullnessHelp = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "fullness", "positive");
    const fullnessDrag = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "fullness", "negative");
    const drynessHelp = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "dryness", "positive");
    const drynessDrag = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "dryness", "negative");
    const performanceHelp = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "performance", "positive");
    const performanceDrag = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "performance", "negative");
    const recoveryHelp = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "recovery", "positive");
    const recoveryDrag = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "recovery", "negative");
    const stressDrag = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "stress", "positive");
    const digestionDrag = summarizeCompoundDrivers(enabledCompounds, displayCompoundName, getCompoundSignalImpactValue, "digestion", "negative");

    return [
      {
        label: "Fullness",
        value: clamp(5 + compoundTotals.fullness * 0.22, 0, 10),
        accent: "bg-emerald-500",
        helping: [...fullnessHelp, ...(intraCarbs >= 40 ? [`Intra carbs are loaded at ${intraCarbs}g`] : [])].slice(0, 3),
        limiting: fullnessDrag.slice(0, 2),
      },
      {
        label: "Dryness",
        value: clamp(5 + compoundTotals.dryness * 0.22, 0, 10),
        accent: "bg-amber-500",
        helping: drynessHelp.slice(0, 3),
        limiting: [drynessLimiterReason, ...drynessDrag].filter(Boolean).slice(0, 2),
      },
      {
        label: "Performance",
        value: clamp(5 + compoundTotals.performance * 0.2, 0, 10),
        accent: "bg-emerald-500",
        helping: performanceHelp.slice(0, 3),
        limiting: performanceDrag.slice(0, 2),
      },
      {
        label: "Recovery",
        value: clamp(5 + compoundTotals.recovery * 0.2, 0, 10),
        accent: "bg-emerald-500",
        helping: [...recoveryHelp, ...(recoveryScore >= 7 ? [`Recovery score is ${recoveryScore.toFixed(1)}`] : [])].slice(0, 3),
        limiting: recoveryDrag.slice(0, 2),
      },
      {
        label: "Stress",
        value: clamp(4 + compoundTotals.stress * 0.35, 0, 10),
        accent: "bg-rose-500",
        helping: [],
        limiting: [...stressDrag, ...(primaryLimiter === "Training stress" ? ["Training stress is already the active limiter."] : [])].slice(0, 3),
      },
      {
        label: "Digestion",
        value: clamp(7 + compoundTotals.digestion * 0.35, 0, 10),
        accent: "bg-rose-500",
        helping: [],
        limiting: [
          ...digestionDrag,
          ...(waterLiters > 4.5 ? [`Water is high at ${waterLiters.toFixed(1)} L`] : []),
          ...(saltTsp > 2 ? [`Salt is high at ${saltTsp.toFixed(2)} tsp`] : []),
        ].slice(0, 3),
      },
    ];
  }, [
    compoundTotals,
    displayCompoundName,
    drynessLimiterReason,
    enabledCompounds,
    getCompoundSignalImpactValue,
    intraCarbs,
    primaryLimiter,
    recoveryScore,
    saltTsp,
    waterLiters,
  ]);

  const exposureData = exposureView === "weekly" ? compoundExposureChart.weekly : compoundExposureChart.progression;

  return (
    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
      <WorkspaceSummaryRail
        title={userMode === "coach" ? "Stack review" : "Stack overview"}
        description={
          userMode === "coach"
            ? "Read exposure, support, and burden first. Change the stack only when the week actually calls for it."
            : "See what is active, what it is doing, and what is pushing the look in the wrong direction."
        }
        items={stackFocusCards}
      />

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          title={userMode === "coach" ? "Stack decision workflow" : "This week's stack workflow"}
          description={userMode === "coach" ? "Read the stack and make the call." : "See the stack and keep it readable."}
        >
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Primary action" : "Primary stack cue"}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{compoundsPrimaryAction.title}</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{compoundsPrimaryAction.body}</p>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <Button onClick={handlePrimaryAction}>{primaryActionLabel}</Button>
                {canEditPlan || primaryLimiter === "Digestion" ? (
                  <Button variant="outline" onClick={() => openTrackerSurface("week")}>Week</Button>
                ) : (
                  <Button variant="outline" onClick={() => openTrackerSurface("log")}>Today log</Button>
                )}
                <Button variant="outline" onClick={() => goToTab("nutrition")}>{userMode === "coach" ? "Food" : "Meals"}</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "What is active" : "Active stack"}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {enabledCompounds.length} enabled compounds, {totalWeeklyCompoundDose} total scheduled units, busiest day {compoundWeekBurdenSummary.busiestDay}.
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{userMode === "coach" ? "Current fit" : "Current effect"}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    Main limiter {primaryLimiter}, recommendation {coachRecommendation.action.toLowerCase()}, recovery {recoveryScore.toFixed(1)}.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {compoundSignalSummary.map((item) => (
                  <AnalyticsStat key={item.label} label={item.label} value={item.value.toFixed(1)} helper={item.helper} tone={metricsTone(item.value)} />
                ))}
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Stack risks</div>
                <div className="mt-3 space-y-2">
                  {compoundRiskFlags.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">No major stack risks right now.</div>
                  ) : (
                    compoundRiskFlags.map((flag, index) => (
                      <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">{flag}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={userMode === "coach" ? "Stack controls" : "Stack controls"}
          description={userMode === "coach" ? "Add compounds first. Then keep the schedule readable." : "Keep this simple until something really needs to change."}
        >
          {canEditPlan ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Library compound</Label>
                  <select className={inputClass} value={compoundLibrarySelection} onChange={(event) => setCompoundLibrarySelection(event.target.value)}>
                    {compoundLibraryCatalog.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={addCompoundFromLibrary}>Add from library</Button>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2 xl:col-span-2">
                    <Label>Custom name</Label>
                    <Input value={customCompoundName} onChange={(event) => setCustomCompoundName(event.target.value)} placeholder="Custom compound" />
                  </div>
                  <div className="space-y-2">
                    <Label>Half-life</Label>
                    <Input type="number" value={customCompoundHalfLife} onChange={(event) => setCustomCompoundHalfLife(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Anabolic</Label>
                    <Input type="number" value={customCompoundAnabolic} onChange={(event) => setCustomCompoundAnabolic(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Androgenic</Label>
                    <Input type="number" value={customCompoundAndrogenic} onChange={(event) => setCustomCompoundAndrogenic(Number(event.target.value))} />
                  </div>
                  <div className="flex items-end xl:col-span-4">
                    <Button variant="outline" className="w-full" onClick={addCustomCompound}>Add custom compound</Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsStat label="Enabled" value={enabledCompounds.length} helper="Active items" tone={metricsTone(6)} />
                <AnalyticsStat label="Weekly dose" value={totalWeeklyCompoundDose} helper="Scheduled total" tone={metricsTone(6)} />
                <AnalyticsStat label="Anabolic" value={stackAnabolicRating} helper="Weighted sum" tone={metricsTone(7)} />
                <AnalyticsStat label="Androgenic" value={stackAndrogenicRating} helper="Weighted sum" tone={metricsTone(7)} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsStat label="Active" value={enabledCompounds.length} helper="Current compounds" tone={metricsTone(6)} />
                <AnalyticsStat label="Weekly total" value={totalWeeklyCompoundDose} helper="Scheduled units" tone={metricsTone(6)} />
                <AnalyticsStat label="Fullness" value={fullnessScore.toFixed(1)} helper="Current support" tone={metricsTone(fullnessScore)} />
                <AnalyticsStat label="Dryness" value={drynessScore.toFixed(1)} helper="Current signal" tone={metricsTone(drynessScore)} />
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Athlete rule</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Use this view to understand what is active and what it is doing. Only open deeper editing when the stack actually needs a change.
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Monitoring boundaries"
        description="Use category context and health-monitoring prompts as guardrails. This is for tracking and review, not automated dosing."
      >
        <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {compoundMonitoringCards.length > 0 ? (
              compoundMonitoringCards.map((item) => (
                <SignalTile
                  key={`${item.label}-${item.title}`}
                  label={item.label}
                  title={item.title}
                  detail={item.detail}
                  tone={
                    item.label === "Orals"
                      ? "rose"
                      : item.label === "Performance"
                        ? "amber"
                        : item.label === "Base"
                          ? "sky"
                          : "slate"
                  }
                />
              ))
            ) : (
              <EmptyStatePanel
                title="No active compound categories"
                detail="Enable at least one compound before the monitoring lanes become meaningful."
              />
            )}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Monitoring prompts</div>
            <div className="mt-3 space-y-2">
              {compoundMonitoringFlags.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  No extra category-level monitoring prompts are lighting up right now.
                </div>
              ) : (
                compoundMonitoringFlags.map((flag, index) => (
                  <div key={`${flag}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                    {flag}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="grid gap-5">
          <ChartCard
            title="Compound exposure"
            description={exposureView === "weekly" ? "Mon-Sun steady-state view based on half-life and the current dose schedule." : "Week-by-week accumulation based on the current weekly schedule."}
            right={(
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-slate-200 bg-white/88 p-1 dark:border-white/10 dark:bg-white/[0.05]">
                  <Button size="sm" variant={exposureView === "weekly" ? "default" : "ghost"} onClick={() => setExposureView("weekly")}>Mon-Sun</Button>
                  <Button size="sm" variant={exposureView === "progression" ? "default" : "ghost"} onClick={() => setExposureView("progression")}>Week by week</Button>
                </div>
                <Badge variant="outline" className="border-emerald-200/90 bg-emerald-50/90 text-emerald-700">Support in range</Badge>
                <Badge variant="outline" className="border-amber-200/90 bg-amber-50/90 text-amber-700">Watch drift</Badge>
                <Badge variant="outline" className="border-rose-200/90 bg-rose-50/90 text-rose-700">Burden rising</Badge>
              </div>
            )}
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exposureData} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="label" {...chartAxisProps} />
                  <YAxis width={56} {...chartAxisProps} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(148,163,184,0.32)", strokeWidth: 1, strokeDasharray: "4 6" }} />
                  {compoundExposureChart.lines.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      name={line.label}
                      stroke={line.color}
                      strokeWidth={2.2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#ffffff", stroke: line.color, strokeWidth: 2 }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke={compoundExposureChart.totalColor}
                    strokeWidth={2.8}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ffffff", stroke: compoundExposureChart.totalColor, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <SectionCard
            title={userMode === "coach" ? "Stack balance" : "What the stack is doing"}
            description={userMode === "coach" ? "Show the positive and negative drivers behind each read, not just a score." : "Hover or read the cards to see what is helping and what is limiting fullness, dryness, recovery, and stress."}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {stackDriverCards.map((item) => (
                <div
                  key={item.label}
                  title={[...item.helping, ...item.limiting].join(" | ") || undefined}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.label}</div>
                    <Badge className={metricsTone(item.value)}>{item.value.toFixed(1)}</Badge>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`${item.accent} h-full rounded-full transition-all`} style={{ width: `${item.value * 10}%` }} />
                  </div>
                  {item.helping.length > 0 || item.limiting.length > 0 ? (
                    <div className="mt-3 space-y-2 text-sm leading-5">
                      {item.helping.length > 0 ? (
                        <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                          {item.helping.join(", ")}
                        </div>
                      ) : null}
                      {item.limiting.length > 0 ? (
                        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                          {item.limiting.join(", ")}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {canEditPlan ? (
          <div ref={advancedEditorRef}>
            <AdvancedEditorCard
              title={userMode === "coach" ? "Stack builder" : "Detailed stack builder"}
              description={userMode === "coach" ? "Each compound should clearly show what it does, how much is being used, and how it is spread across the week." : "Only open this when you actually need to inspect or change the detailed weekly setup."}
              open={showAdvancedCompounds}
              onToggle={toggleAdvancedCompounds}
              summary={`${compounds.length} compounds loaded`}
            >
              <div className="max-h-[980px] space-y-4 overflow-auto pr-1">
                {compounds.map((compound) => {
                  const weeklyTotal = getCompoundWeeklyTotalValue(compound);
                  return (
                    <div key={compound.id} className={[softPanelClass, panelHoverClass, "space-y-4 rounded-[24px] p-4"].join(" ")}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-lg font-semibold text-slate-950 dark:text-slate-100">{displayCompoundName(compound)}</div>
                          <Badge variant="outline">{compound.category}</Badge>
                          <Badge className={compound.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                            {compound.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Model half-life {formatHalfLife(compound.halfLifeDays)} days
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start">
                        <Switch checked={compound.enabled} onCheckedChange={(checked) => updateCompound(compound.id, "enabled", checked)} />
                        <Button
                          size="sm"
                          variant={pendingCompoundDeleteId === compound.id ? "outline" : "ghost"}
                          onClick={() => requestRemoveCompound(compound.id)}
                        >
                          {pendingCompoundDeleteId === compound.id ? "Confirm" : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Weekly total</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{weeklyTotal} {compound.unit}</div>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Unit mode</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{compound.unit}</div>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Dose rows</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">{(compound.schedule ?? []).length || 0} entries</div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Weekly total</Label>
                        <Input type="number" value={weeklyTotal} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <select className={inputClass} value={compound.unit ?? "mg/week"} onChange={(event) => updateCompound(compound.id, "unit", event.target.value)}>
                          <option value="mg/week">mg/week</option>
                          <option value="mg/day">mg/day</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Anabolic</Label>
                        <Input type="number" value={compound.anabolicRating ?? 0} onChange={(event) => updateCompound(compound.id, "anabolicRating", Number(event.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Androgenic</Label>
                        <Input type="number" value={compound.androgenicRating ?? 0} onChange={(event) => updateCompound(compound.id, "androgenicRating", Number(event.target.value))} />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                      {[
                        ["Fullness", compound.fullness, "fullness"],
                        ["Dryness", compound.dryness, "dryness"],
                        ["Performance", compound.performance, "performance"],
                        ["Recovery", compound.recovery, "recovery"],
                        ["Stress", compound.stress, "stress"],
                        ["Digestion", compound.digestion, "digestion"],
                      ].map(([label, value, key]) => (
                        <div key={String(label)} className="space-y-2">
                          <Label>{label}</Label>
                          <Input type="number" value={Number(value)} onChange={(event) => updateCompound(compound.id, String(key), Number(event.target.value))} />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Dose schedule</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">The weekly total is derived from these rows. Keep the schedule readable before adding more complexity.</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addCompoundScheduleRow(compound.id)}>Add dose</Button>
                      </div>
                      <div className="space-y-2">
                        {(compound.schedule ?? []).map((row) => (
                          <div key={row.id} className="grid gap-3 sm:grid-cols-[minmax(8rem,1fr)_minmax(10rem,1.4fr)_auto] sm:items-end">
                            <label className="space-y-2">
                              <Label>When</Label>
                              <select className={inputClass} value={row.day} onChange={(event) => updateCompoundScheduleRow(compound.id, row.id, { day: event.target.value })}>
                                {["Daily", "Training", ...scheduleDayOrder].map((day) => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-2">
                              <Label>Units</Label>
                              <Input type="number" value={row.amount} onChange={(event) => updateCompoundScheduleRow(compound.id, row.id, { amount: Number(event.target.value) })} />
                            </label>
                            <div className="flex items-end">
                              <Button
                                size="sm"
                                variant={pendingDoseDeleteKey === `${compound.id}:${row.id}` ? "outline" : "ghost"}
                                onClick={() => requestDeleteCompoundScheduleRow(compound.id, row.id)}
                              >
                                {pendingDoseDeleteKey === `${compound.id}:${row.id}` ? "Confirm" : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {(!compound.schedule || compound.schedule.length === 0) && (
                          <EmptyStatePanel
                            title="No dosing schedule yet"
                            detail="Add a clean weekly schedule so the total is derived from the actual entries, not from guesswork."
                          />
                        )}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            </AdvancedEditorCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
