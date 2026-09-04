import React, { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ChevronDown, Download, Settings2, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { WEIGHT_MACRO_SETTING_FIELDS, calculateWeightMacroTracker, isWeightMacroDate, weightMacroDailyTarget, type WeightMacroSettings, type WeightMacroDailyRecord } from "../weight_macro_engine";
import { acceptedTrackerTarget, buildTrackerProposal, createTrackerProgram, decideTrackerProposal, evaluateTrackerProgram, updateTrackerSettings,
  convertTrackerSettingsWeightUnit, trackerCheckinForDate, trackerRevisionForDate,
  type WeightMacroProgram, type TrackerSources, type TrackerContext, type TrackerCheckin } from "../weight_macro_program";

type Props = {
  program: WeightMacroProgram | null; sources: TrackerSources; initialSettings: WeightMacroSettings;
  today: string; context: TrackerContext; compact?: boolean;
  onUpdate: (update: (current: WeightMacroProgram | null, sources: TrackerSources) => WeightMacroProgram | null) => void;
};
const n = (value: number | null | undefined, digits = 1) => value == null || !Number.isFinite(value) ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: digits });
const percent = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : `${n(value * 100)}%`;
/** Changing a measure changes its numbers too; a blank/invalid basis remains invalid, never zero. */
export function trackerSettingChoice(settings: WeightMacroSettings, key: keyof WeightMacroSettings, value: string): WeightMacroSettings {
  if (key === "weightUnit" && (value === "lb" || value === "kg")) return convertTrackerSettingsWeightUnit(settings, value);
  if (key === "manualRateType" && value !== settings.manualRateType) {
    const validBasis = Number.isFinite(settings.startingWeight) && settings.startingWeight > 0;
    return { ...settings, manualRateType: value as WeightMacroSettings["manualRateType"], manualWeeklyRate: validBasis
      ? settings.manualWeeklyRate * (value === "Weight per week" ? settings.startingWeight : 1 / settings.startingWeight) : NaN };
  }
  if (key === "cyclingInputType" && value !== settings.cyclingInputType) {
    const factor = Number.isFinite(settings.startingCalories) && settings.startingCalories > 0
      ? value === "Calories" ? settings.startingCalories : 1 / settings.startingCalories : NaN;
    return { ...settings, cyclingInputType: value as WeightMacroSettings["cyclingInputType"], trainingPremium: settings.trainingPremium * factor, restReduction: settings.restReduction * factor };
  }
  return { ...settings, [key]: value };
}
export function trackerAnalysisExport(program: WeightMacroProgram, sources: TrackerSources, today: string) {
  return { kind: "bodypilot-weight-macro-analysis", version: 1, asOfDate: today,
    note: "Planning estimates, not measured expenditure or a guaranteed outcome. Null means unavailable, not zero. Future daily and weekly rows are forecasts, not accepted targets. This analysis is not an importable app backup.",
    program, sourceRecords: sources, analysis: evaluateTrackerProgram(program, sources, today) };
}
const checkinEditRevision = (program: WeightMacroProgram, sources: TrackerSources, date: string) => JSON.stringify([
  program.id, program.settings.weightUnit, program.checkins.find(c => c.date === date), sources.bodyWeightHistory.filter(w => w.date === date),
]);
const shortKeys = ["startDate", "weightUnit", "startingWeight", "goalWeight", "goalType", "planningMode", "goalDate", "manualRateType", "manualWeeklyRate", "startingCalories", "reviewDay", "adjustmentMode"];
const metricLabels: Array<[keyof WeightMacroDailyRecord, string, number?]> = [
  ["weight", "Morning fasted weight"], ["steps", "Steps"], ["sleepHours", "Sleep hours"], ["waist", "Waist (consistent unit)"],
  ["performance", "Performance (1–5)", 5], ["hunger", "Hunger (1–5)", 5], ["digestion", "Digestion (1–5)", 5],
];
function TrackerChart({ daily }: { daily: ReturnType<typeof evaluateTrackerProgram>["daily"] }) {
  const points = daily.filter(d => !d.isFuture).slice(-42);
  const values = points.flatMap(d => [d.weight, d.trendWeight, d.trajectoryWeight].filter(v => typeof v === "number" && Number.isFinite(v)) as number[]);
  if (!values.length || !points.some(p => p.weight != null)) return <p className="py-3 text-sm text-slate-400">Your weight trend appears after you log weigh-ins. Missing data stays blank.</p>;
  const min = Math.min(...values) - 0.5, span = Math.max(1, Math.max(...values) - min + 0.5);
  const x = (i: number) => 14 + i / Math.max(1, points.length - 1) * 572;
  const y = (v: number) => 130 - (v - min) / span * 114;
  const path = (key: "trendWeight" | "trajectoryWeight") => {
    let connected = false;
    return points.map((p, i) => { const v = p[key]; if (v == null) { connected = false; return ""; } const cmd = connected ? "L" : "M"; connected = true; return `${cmd}${x(i)},${y(v)}`; }).join(" ");
  };
  return <figure><svg viewBox="0 0 600 148" role="img" aria-label="Recent raw weight, smoothed trend, and goal trajectory" className="w-full">
    <path d={path("trajectoryWeight")} fill="none" stroke="#64748b" strokeDasharray="5 5" strokeWidth="2" />
    <path d={path("trendWeight")} fill="none" stroke="#34d399" strokeWidth="2.5" />
    {points.map((p, i) => p.weight == null ? null : <circle key={p.date} cx={x(i)} cy={y(p.weight)} r="2.6" fill={p.includeWeight === false ? "#f59e0b" : "#67e8f9"}><title>{p.date}: {n(p.weight)}; trend {n(p.trendWeight)}</title></circle>)}
  </svg><figcaption className="flex flex-wrap justify-between gap-2 text-xs text-slate-400"><span>{points[0]?.date} → {points[points.length - 1]?.date}</span><span>Dots: weight · green: trend · dashed: goal · amber: excluded</span></figcaption></figure>;
}

export function WeightMacroTrackerPanel({ program, sources, initialSettings, today, context, compact = false, onUpdate }: Props) {
  const [editingSettings, setEditingSettings] = useState(false);
  const [settings, setSettings] = useState(program?.settings ?? initialSettings);
  const [message, setMessage] = useState("");
  const [showCheckin, setShowCheckin] = useState(false);
  const [date, setDate] = useState(today);
  const [check, setCheck] = useState<TrackerCheckin>({ date: today, includeWeight: true, nutritionSource: "diary" });
  const [overrideCalories, setOverrideCalories] = useState("");
  const [historyRange, setHistoryRange] = useState<"recent" | "all">("recent");
  const mounted = useRef(false);
  const mutationAttempt = useRef(0);
  const checkinBaseline = useRef("");
  const settingsBaseline = useRef(JSON.stringify(program?.settings ?? null));
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; mutationAttempt.current++; }; }, []);
  const result = useMemo(() => program ? evaluateTrackerProgram(program, sources, today) : null, [program, sources.foodLog, sources.bodyWeightHistory, today]);
  const proposal = useMemo(() => program ? buildTrackerProposal(program, sources, today, context) : null, [program, sources.foodLog, sources.bodyWeightHistory, today, context.completedWorkouts, context.recoveryFlags]);
  const current = program ? acceptedTrackerTarget(program, today) : null;
  const currentRevision = program ? trackerRevisionForDate(program, today) : null;
  const trainingTarget = currentRevision ? weightMacroDailyTarget(currentRevision.settings, currentRevision.target, "Training") : null;
  const restTarget = currentRevision ? weightMacroDailyTarget(currentRevision.settings, currentRevision.target, "Rest") : null;
  const averageCalories = currentRevision && trainingTarget?.calories != null && restTarget?.calories != null
    ? (trainingTarget.calories * currentRevision.settings.trainingDaysPerWeek + restTarget.calories * (7 - currentRevision.settings.trainingDaysPerWeek)) / 7 : null;
  const mutate = (fn: (current: WeightMacroProgram | null, sources: TrackerSources) => WeightMacroProgram | null, success: string, afterSuccess?: () => void) => {
    const attempt = ++mutationAttempt.current;
    const notify = (text: string, saved: boolean) => queueMicrotask(() => {
      if (!mounted.current || mutationAttempt.current !== attempt) return;
      setMessage(text); if (saved) afterSuccess?.();
    });
    onUpdate((currentProgram, currentSources) => {
      try {
        if (currentProgram?.id !== program?.id) throw new Error("The tracker changed. Reopen this editor before saving.");
        const next = fn(currentProgram, currentSources);
        if (!next || next === currentProgram) throw new Error("No change was saved. Reopen the tracker and try again.");
        notify(success, true); return next;
      } catch (error) { notify(error instanceof Error ? error.message : "The change was not applied.", false); return currentProgram; }
    });
  };
  const openSettings = () => { mutationAttempt.current++; settingsBaseline.current = JSON.stringify(program?.settings ?? null); setSettings(program?.settings ?? initialSettings); setEditingSettings(true); };
  const editCheckin = (selectedDate: string) => {
    mutationAttempt.current++;
    setDate(selectedDate);
    checkinBaseline.current = program ? checkinEditRevision(program, sources, selectedDate) : "";
    setCheck(program && isWeightMacroDate(selectedDate) && selectedDate <= today ? trackerCheckinForDate(program, sources, selectedDate) : { date: selectedDate, includeWeight: true, nutritionSource: "diary" });
    setShowCheckin(true);
  };
  const saveCheckin = () => {
    if (!isWeightMacroDate(date) || date > today) { setMessage("Choose a real date, today or earlier."); return; }
    for (const [key, label, max] of metricLabels) {
      const value = check[key];
      if (value != null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (key === "weight" && value === 0) || (key === "sleepHours" && value > 24) || (max && (value < 1 || value > max)))) { setMessage(`Check ${label.toLowerCase()}.`); return; }
    }
    if (check.nutritionSource === "manual" && check.foodComplete && [check.calories, check.protein, check.carbs, check.fat].some(v => typeof v !== "number" || !Number.isFinite(v) || v < 0)) { setMessage("Enter all four daily nutrition totals before marking a manual day complete."); return; }
    if ([check.calories, check.protein, check.carbs, check.fat].some(v => v != null && (typeof v !== "number" || !Number.isFinite(v) || v < 0))) { setMessage("Nutrition totals must be blank or non-negative numbers. Check any previously entered manual totals."); return; }
    const saved = { ...check, date, id: `checkin:${date}`, recordedAt: new Date().toISOString() };
    const baseline = checkinBaseline.current;
    mutate((currentProgram, currentSources) => {
      if (!currentProgram) return null;
      if (checkinEditRevision(currentProgram, currentSources, date) !== baseline) throw new Error("This day's measurement or its units changed. Reopen the day before saving.");
      const existingWeight = trackerCheckinForDate(currentProgram, currentSources, date).weight;
      return { ...currentProgram, checkins: [...currentProgram.checkins.filter(c => c.date !== date), { ...saved, weight: saved.weight ?? existingWeight ?? null }].sort((a, b) => a.date.localeCompare(b.date)) };
    }, "Check-in saved. Your diary entries were not changed.", () => setShowCheckin(false));
  };
  const saveSettings = () => {
    const preview = calculateWeightMacroTracker(settings, [], [], today);
    const errors = preview.validation.filter(i => i.severity === "error");
    if (errors.length) { setMessage(errors.map(i => i.message).join(" ")); return; }
    const recordedAt = new Date().toISOString();
    const id = `tracker:${crypto.randomUUID()}`;
    const baseline = settingsBaseline.current;
    mutate(currentProgram => {
      if (JSON.stringify(currentProgram?.settings ?? null) !== baseline) throw new Error("Tracker settings changed while you were editing. Reopen setup before saving.");
      return currentProgram ? updateTrackerSettings(currentProgram, settings, today, recordedAt) : createTrackerProgram(settings, today, recordedAt, id);
    }, program ? "Settings saved. New targets start tomorrow or your later start date; today's accepted targets are unchanged." : "Tracker started. Your starting targets are confirmed.", () => setEditingSettings(false));
  };
  const decide = (action: "accept" | "dismiss" | "override") => {
    if (!proposal) return;
    mutate((currentProgram, currentSources) => currentProgram ? decideTrackerProposal(currentProgram, currentSources, proposal, action, today, new Date().toISOString(), context,
      overrideCalories.trim() ? Number(overrideCalories) : undefined) : currentProgram, action === "dismiss" ? "Review dismissed. Targets are unchanged." : `Targets accepted from ${proposal.effectiveDate}. Previous days are unchanged.`);
  };
  const exportAnalysis = () => {
    if (!program) return;
    try {
      const payload = trackerAnalysisExport(program, sources, today);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = `bodypilot-tracker-analysis-${today}.json`;
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
      setMessage("Analysis download requested. It includes all generated daily/weekly cells and personal source records. Store it privately; use Settings for a restorable app backup.");
    } catch { setMessage("The analysis could not be downloaded. Your data has not changed."); }
  };
  const settingField = (field: typeof WEIGHT_MACRO_SETTING_FIELDS[number]) => {
    const value = settings[field.key];
    const fraction = field.fraction || (field.key === "manualWeeklyRate" && settings.manualRateType === "Percentage of body weight per week") || (["trainingPremium", "restReduction"].includes(field.key) && settings.cyclingInputType === "Percentage");
    const label = field.label.replace("lb/kg", settings.weightUnit);
    const weightMeasure = ["startingWeight", "goalWeight", "manualLeanMass", "maintenanceLowerTolerance", "maintenanceUpperTolerance"].includes(field.key);
    return <label key={field.key} className="grid content-start gap-1 text-xs text-slate-300"><span>{label}{fraction ? " (%)" : weightMeasure ? ` (${settings.weightUnit})` : field.key === "manualWeeklyRate" ? ` (${settings.weightUnit}/week)` : ""}</span>
      {field.type === "boolean" ? <select className="premium-input min-h-11 px-3" value={String(value)} onChange={e => { const selected = e.target.value === "true"; setSettings(s => ({ ...s, [field.key]: selected })); }}><option value="true">Yes</option><option value="false">No</option></select>
        : field.type === "select" ? <select className="premium-input min-h-11 min-w-0 px-3" value={String(value)} onChange={e => { const selected = e.target.value; setSettings(s => trackerSettingChoice(s, field.key, selected)); }}>{field.options?.map(o => <option key={o}>{o}</option>)}</select>
        : <Input type={field.type} step="any" value={value == null || (typeof value === "number" && !Number.isFinite(value)) ? "" : typeof value === "number" && fraction ? Number((value * 100).toFixed(8)) : String(value)}
          onChange={e => { const raw = e.target.value; setSettings(s => ({ ...s, [field.key]: field.type === "number" ? raw === "" ? field.nullable ? null : NaN : Number(raw) / (fraction ? 100 : 1) : raw === "" && field.nullable ? null : raw })); }} />}
    </label>;
  };
  return <Card><CardContent className="grid gap-3 p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="core-section-title flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" />Weight & macro engine</h2>
      <Button variant="ghost" size="sm" aria-label="Configure weight and macro tracker" onClick={() => editingSettings ? setEditingSettings(false) : openSettings()}><Settings2 className="h-4 w-4" /></Button></div>
    {!program ? <><p className="text-sm text-slate-400">Connect your weight trend and complete food days to weekly calorie and macro reviews.</p><Button onClick={openSettings}>Set up tracker</Button></> : <>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><span className="block text-xs text-slate-400">Trend · {program.settings.weightUnit}</span><strong className="text-xl">{n(result?.dashboard?.latestTrend)}</strong></div>
        <div><span className="block text-xs text-slate-400">Accepted calories</span><strong className="text-xl">{n(current?.calories, 0)}</strong></div>
        <div><span className="block text-xs text-slate-400">7-day change</span><strong className="text-xl">{n(result?.dashboard?.change7)}</strong></div>
      </div>
      <div className="flex flex-wrap gap-2"><Button className="gap-2" onClick={() => editCheckin(today)}><Activity className="h-4 w-4" />Log weight / check-in</Button>
        {!compact ? <Button variant="outline" onClick={() => showCheckin ? setShowCheckin(false) : editCheckin(today)}>Edit a day</Button> : null}</div>
      {!compact && result ? <TrackerChart daily={result.daily} /> : null}
      {result?.dashboard ? <details className="text-sm"><summary className="min-h-11 cursor-pointer py-3">Progress, current macros & calorie cycling</summary>
        <p className="mb-3 text-xs text-slate-400">Trend estimates depend on recorded weigh-ins; blank means unavailable. Goal dates describe the planned pace, not a promise. Weight values are in {program.settings.weightUnit}.</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3">{[
          ["Latest weigh-in", `${n(result.dashboard.latestWeight)}${result.dashboard.latestWeightDate ? ` · ${result.dashboard.latestWeightDate}` : ""}`],
          ["Latest trend date", result.dashboard.latestTrendDate ?? "—"], ["Starting weight", n(result.dashboard.startingWeight)], ["Goal weight", n(result.dashboard.goalWeight)],
          ["Progress toward goal", percent(result.dashboard.progress)], ["Total trend change", n(result.dashboard.totalChange)], ["Remaining weight change", n(result.dashboard.remaining)],
          ["14-day change", n(result.dashboard.change14)], ["28-day change", n(result.dashboard.change28)], ["Trend direction", result.dashboard.direction ?? "—"],
          ["Planned goal date", result.dashboard.projectedGoalDate ?? "—"], ["Estimated days ahead (+) / behind (−)", n(result.dashboard.daysAheadOfTrajectory, 0)],
          ["Actual weekly rate", percent(result.dashboard.actualWeeklyRatePercent)], ["Planned weekly rate", percent(result.dashboard.targetWeeklyRatePercent)],
          ["Accepted calories today", n(current?.calories, 0)], ["Accepted protein today", `${n(current?.protein, 0)} g`], ["Accepted carbs today", `${n(current?.carbs, 0)} g`], ["Accepted fat today", `${n(current?.fat, 0)} g`],
          ["Accepted training-day calories", n(trainingTarget?.calories, 0)], ["Accepted rest-day calories", n(restTarget?.calories, 0)],
          ["Cycling daily average", n(averageCalories, 0)], ["Cycling", currentRevision ? currentRevision.settings.cycling ? "On · preserves weekly average" : "Off" : "Not started"],
          ["Accepted training-day P / C / F", `${n(trainingTarget?.protein, 0)} / ${n(trainingTarget?.carbs, 0)} / ${n(trainingTarget?.fat, 0)} g`],
          ["Accepted rest-day P / C / F", `${n(restTarget?.protein, 0)} / ${n(restTarget?.carbs, 0)} / ${n(restTarget?.fat, 0)} g`],
          ["Estimated expenditure", n(result.dashboard.smoothedTdee, 0)], ["Nutrition adherence", percent(result.dashboard.nutritionAdherence)],
          ["Valid weigh-ins this week", `${result.dashboard.validWeighIns}/${result.dashboard.expectedDays}`], ["Latest waist", n(result.dashboard.latestWaist)],
          ["Waist change", n(result.dashboard.waistChange)], ["Program week", String(result.dashboard.currentWeek)], ["Review status", result.dashboard.status],
        ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-400">{label}</dt><dd className="break-words tabular-nums">{value}</dd></div>)}</dl>
        <p className="mt-3 text-xs text-slate-400">{result.dashboard.reason} Expenditure is a model estimate, not a measurement. Waist uses the consistent unit you entered.</p>
      </details> : null}
      {proposal ? <div className="grid gap-2 rounded-xl border border-white/10 p-3">
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Weekly review · {proposal.week.endDate}</h3><span className="text-xs text-slate-400">{proposal.blocked ? "Hold / review" : "Ready"}</span></div>
        <p className="text-sm">{proposal.reasons.join(" ")}</p>
        {!proposal.blocked ? <p className="text-sm text-emerald-300">{n(proposal.before.calories, 0)} → {n(proposal.after.calories, 0)} calories from {proposal.effectiveDate}</p> : null}
        <details className="text-sm text-slate-400"><summary className="min-h-11 cursor-pointer py-3">Evidence and calculation</summary>
          <div className="grid grid-cols-2 gap-3 py-2">{[
            ["Valid weigh-ins", `${proposal.week.validWeighIns}/${proposal.week.evidence.expectedDays}`], ["Complete food days", String(proposal.week.calorieDays)],
            ["Nutrition adherence", percent(proposal.week.nutritionAdherence)], ["Estimated expenditure", n(proposal.week.smoothedTdee, 0)],
            ["Actual weekly rate", n(proposal.week.activeRate)], ["Target weekly rate", n(proposal.week.targetRate)], ["Raw calorie change", n(proposal.week.rawAdjustment, 0)], ["Trajectory correction", n(proposal.week.trajectoryCorrection, 0)],
            ["Capped, rounded change", n(proposal.week.cappedAdjustment, 0)], ["Weight variability", percent(proposal.week.variability)],
            ["Recent completed workouts", String(context.completedWorkouts)], ["Recovery flags", String(context.recoveryFlags)],
          ].map(([label, value]) => <div key={label}><span className="block text-xs">{label}</span><span className="text-slate-100">{value}</span></div>)}</div>
          <p className="text-xs">Workbook model estimate, not measured expenditure. {proposal.week.formulaRefs.join(" · ")}</p>
        </details>
        <div className="flex flex-wrap gap-2"><Button disabled={proposal.blocked} onClick={() => decide("accept")}>Accept targets</Button><Button variant="outline" onClick={() => decide("dismiss")}>Keep current</Button></div>
        <details className="text-sm"><summary className="min-h-11 cursor-pointer py-3">Manual override</summary><p className="mb-2 text-xs text-slate-400">Overrides the recommendation, within your limits. Review the hold reasons first.</p><div className="flex gap-2"><Input aria-label="Override calories" type="number" value={overrideCalories} onChange={e => setOverrideCalories(e.target.value)} /><Button variant="outline" onClick={() => decide("override")}>Apply override</Button></div></details>
      </div> : <p className="text-sm text-slate-400">{result?.weekly.some(w => w.endDate < today) ? "No unreviewed completed week. Your accepted targets stay in place." : `First review follows ${result?.settingsDerived?.firstCheckInDate ?? "your check-in day"}. Log weight and mark complete food days in Food.`}</p>}
    </>}
    {showCheckin && program ? <section className="grid gap-3 rounded-xl border border-white/10 p-3" aria-label="Dated tracker check-in">
      <label className="grid gap-1 text-xs">Date<Input type="date" max={today} value={date} aria-invalid={!isWeightMacroDate(date) || date > today} onChange={e => editCheckin(e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2">{metricLabels.map(([key, label, max]) => <label key={key} className="grid gap-1 text-xs text-slate-300">{label}{key === "weight" ? ` (${program.settings.weightUnit})` : ""}<Input type="number" min={max ? 1 : 0} max={key === "sleepHours" ? 24 : max} step={max ? 1 : "any"} value={check[key] == null ? "" : String(check[key])} onChange={e => setCheck(c => ({ ...c, [key]: e.target.value === "" ? null : Number(e.target.value) }))} /></label>)}</div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={check.includeWeight !== false} onChange={e => setCheck(c => ({ ...c, includeWeight: e.target.checked }))} />Include this weigh-in in trends</label>
      <p className="text-xs text-slate-400">Blank weight keeps the existing measurement. To exclude a weigh-in from calculations without deleting it, uncheck inclusion. Other blank fields remain unknown, not zero.</p>
      <details className="text-sm"><summary className="min-h-11 cursor-pointer py-3">Day type, nutrition totals, and notes</summary><div className="grid gap-3">
        <label className="grid gap-1">Day type<select className="premium-input min-h-11 px-3" value={check.dayType ?? ""} onChange={e => setCheck(c => ({ ...c, dayType: e.target.value ? e.target.value as "Training" | "Rest" : undefined }))}><option value="">Use weekly pattern</option><option>Training</option><option>Rest</option></select></label>
        <p className="text-xs text-slate-400">Changing a historical day type updates the workbook analysis, not that day's already accepted food targets.</p>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={check.highSodiumCarb ?? false} onChange={e => setCheck(c => ({ ...c, highSodiumCarb: e.target.checked }))} />High-sodium / high-carb day</label>
        <label className="grid gap-1">Nutrition source<select className="premium-input min-h-11 px-3" value={check.nutritionSource ?? "diary"} onChange={e => setCheck(c => ({ ...c, nutritionSource: e.target.value as "diary" | "manual" }))}><option value="diary">Food diary (only marked-complete days)</option><option value="manual">Manual daily totals (replace diary for this calculation)</option></select></label>
        {check.nutritionSource === "manual" ? <><div className="grid grid-cols-2 gap-3">{(["calories", "protein", "carbs", "fat"] as const).map(key => <label key={key} className="grid gap-1 capitalize">{key}<Input type="number" min="0" step="any" value={check[key] ?? ""} onChange={e => setCheck(c => ({ ...c, [key]: e.target.value === "" ? null : Number(e.target.value) }))} /></label>)}</div><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={check.foodComplete ?? false} onChange={e => setCheck(c => ({ ...c, foodComplete: e.target.checked }))} />These are complete daily totals</label></> : null}
        <label className="grid gap-1">Notes<Input value={check.notes ?? ""} onChange={e => setCheck(c => ({ ...c, notes: e.target.value }))} /></label>
      </div></details><div className="flex gap-2"><Button disabled={!isWeightMacroDate(date) || date > today} onClick={saveCheckin}>Save check-in</Button><Button variant="outline" onClick={() => { mutationAttempt.current++; setShowCheckin(false); }}>Cancel</Button></div>
    </section> : null}
    {editingSettings ? <section className="grid gap-3 border-t border-white/10 pt-3" aria-label="Tracker settings">
      <h3 className="font-semibold">Tracker setup</h3><p className="text-xs text-slate-400">Review the starting estimates and limits. {program ? "Settings changes confirm new targets from tomorrow, or your later start date. Today's and past accepted targets are retained." : "Starting targets apply from today, or your later start date."}</p>
      <p className="text-xs text-slate-400">Changing lb/kg converts body weights, lean mass, tolerances and grams-per-weight factors. Rate and cycling input changes convert their values using starting weight/calories. Review the converted numbers before confirming.</p>
      <div className="grid gap-3 sm:grid-cols-2">{WEIGHT_MACRO_SETTING_FIELDS.filter(f => shortKeys.includes(f.key)).map(settingField)}</div>
      {[{ label: "Adjustment rules & safeguards", refs: ["B"] }, { label: "Protein, carbohydrate & fat calculations", refs: ["E"] }, { label: "Training / rest calorie cycling", refs: ["H"] }].map(group => <details key={group.label} className="rounded-xl border border-white/10 px-3"><summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm">{group.label}<ChevronDown className="h-4 w-4" /></summary><div className="grid gap-3 pb-3 sm:grid-cols-2">{WEIGHT_MACRO_SETTING_FIELDS.filter(f => !shortKeys.includes(f.key) && group.refs.includes(f.ref[0])).map(settingField)}</div></details>)}
      <div className="flex flex-wrap gap-2"><Button className="min-h-11 !h-auto whitespace-normal" onClick={saveSettings}>{program ? "Confirm new settings & targets" : "Start tracker"}</Button><Button variant="outline" onClick={() => { mutationAttempt.current++; setEditingSettings(false); }}>Cancel</Button></div>
    </section> : null}
    {!compact && program && result ? <details className="text-sm"><summary className="min-h-11 cursor-pointer py-3">History, weekly context & model diagnostics</summary>
      <div className="grid gap-3">
      <label className="grid gap-1 text-xs text-slate-300">History range<select className="premium-input min-h-11 px-3" value={historyRange} onChange={e => setHistoryRange(e.target.value === "all" ? "all" : "recent")}><option value="recent">Recent: 8 weeks / 14 days</option><option value="all">All {result.weekly.length} weeks / {result.daily.length} days</option></select></label>
      <p className="text-xs text-slate-400">Future rows are model forecasts, not logged data or accepted changes. Use Edit for any existing day, or choose a date in the day editor.</p>
      <details><summary className="min-h-11 cursor-pointer py-3">Daily records & accepted targets</summary><div className="grid gap-2">
        {(historyRange === "all" ? result.daily : result.daily.filter(d => !d.isFuture).slice(-14)).slice().reverse().map(d => {
          const accepted = acceptedTrackerTarget(program, d.date);
          return <details key={d.date} className="rounded-xl border border-white/10 p-3"><summary className="min-h-11 cursor-pointer text-xs">{d.date} · {d.dayType} · {d.isFuture ? "Future forecast" : `${n(d.weight)} ${program.settings.weightUnit}${d.includeWeight === false && d.weight != null ? " · excluded" : ""}`}</summary>
            <dl className="grid grid-cols-2 gap-2 py-2 text-xs">{[["Weight", n(d.weight)], ["Trend", n(d.trendWeight)], ["Goal trajectory", n(d.trajectoryWeight)], ["Actual calories", n(d.calories, 0)], ["Actual protein / carbs / fat", `${n(d.protein, 0)} / ${n(d.carbs, 0)} / ${n(d.fat, 0)} g`], ["Accepted calories", n(accepted?.calories, 0)], ["Accepted protein / carbs / fat", `${n(accepted?.protein, 0)} / ${n(accepted?.carbs, 0)} / ${n(accepted?.fat, 0)} g`], ["Steps", n(d.steps, 0)], ["Sleep hours", n(d.sleepHours)], ["Waist", n(d.waist)], ["Performance / hunger / digestion", `${n(d.performance)} / ${n(d.hunger)} / ${n(d.digestion)}`]].map(([label, value]) => <div key={label}><dt className="text-slate-400">{label}</dt><dd>{value}</dd></div>)}</dl>
            {d.notes ? <p className="mb-2 break-words text-xs text-slate-400">{d.notes}</p> : null}
            {!d.isFuture ? <Button variant="outline" className="min-h-11" onClick={() => editCheckin(d.date)} aria-label={`Edit tracker day ${d.date}`}>Edit this day</Button> : null}
          </details>;
        })}
      </div></details>
      {(historyRange === "all" ? result.weekly : result.weekly.filter(w => w.startDate <= today).slice(-8)).slice().reverse().map(w => <details key={w.week} className="rounded-xl border border-white/10 p-3"><summary className="min-h-11 cursor-pointer">Week {w.week} · {w.startDate} · {w.startDate > today ? "Future forecast" : w.status}</summary><p className="my-2 text-sm text-slate-400">{w.reason}</p>
        <div className="flex flex-wrap gap-3">{(["deload", "disruption"] as const).map(key => <label key={key} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={program.weeklyOverrides.find(o => o.week === w.week)?.[key] ?? false} onChange={e => { const checked = e.target.checked; mutate(currentProgram => currentProgram ? { ...currentProgram, weeklyOverrides: [...currentProgram.weeklyOverrides.filter(o => o.week !== w.week), { ...currentProgram.weeklyOverrides.find(o => o.week === w.week), week: w.week, [key]: checked }] } : currentProgram, "Weekly context saved."); }} />{key === "deload" ? "Deload week" : "Travel / disruption"}</label>)}</div>
        <label className="grid gap-1 text-xs">Week notes<Input value={program.weeklyOverrides.find(o => o.week === w.week)?.notes ?? ""} onChange={e => { const notes = e.target.value; mutate(p => p ? { ...p, weeklyOverrides: [...p.weeklyOverrides.filter(o => o.week !== w.week), { ...p.weeklyOverrides.find(o => o.week === w.week), week: w.week, notes }] } : p, "Weekly notes saved."); }} /></label>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">{[["Trend", n(w.endingTrend)], ["Waist average", n(w.averages.waist)], ["Performance", n(w.averages.performance)], ["Hunger", n(w.averages.hunger)], ["Digestion", n(w.averages.digestion)], ["Sleep", n(w.averages.sleepHours)], ["Steps", n(w.averages.steps, 0)], ["Macro calories", n(w.next.macroCalories, 0)]].map(([label, value]) => <div key={label}><dt className="text-slate-400">{label}</dt><dd>{value}</dd></div>)}</dl>
      </details>)}
      <div className="grid gap-2 text-xs text-slate-400"><p>{result.settingsDerived?.planningStatus} {result.settingsDerived?.macroSetupStatus}</p>{[...result.validation, ...result.diagnostics].map((issue, i) => <p key={i}>{issue.message} ({issue.refs.join(", ")})</p>)}</div>
      <h3 className="font-semibold">Target decisions</h3>{[...program.decisions].reverse().slice(0, historyRange === "all" ? program.decisions.length : 12).map(d => <div className="border-t border-white/10 py-2 text-xs" key={d.id}><strong>{d.action} · from {d.effectiveDate}</strong><p className="text-slate-400">{d.reasons.join(" ")}</p><p>{d.after ? `${n(d.after.calories, 0)} kcal · ${n(d.after.protein, 0)}P / ${n(d.after.carbs, 0)}C / ${n(d.after.fat, 0)}F` : "Targets unchanged"}</p></div>)}
      <div className="grid gap-2 border-t border-white/10 pt-3"><p className="text-xs text-slate-400">Analysis JSON includes the full daily/weekly calculation cells, inputs, accepted decisions and diagnostics, including private weight and food records. Keep the download private. This is not an app backup.</p><Button variant="outline" className="min-h-11 gap-2" onClick={exportAnalysis}><Download className="h-4 w-4" />Export full analysis JSON</Button></div>
      </div></details> : null}
    {message ? <p role="status" className="rounded-lg border border-white/10 p-3 text-sm">{message}</p> : null}
  </CardContent></Card>;
}
