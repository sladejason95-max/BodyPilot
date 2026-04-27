import React from "react";
import { Button } from "@/components/ui/button";

type OutcomePreview = {
  fullnessDelta: number;
  drynessDelta: number;
  trainingDelta: number;
  warnings: string[];
  confidence: "High" | "Medium" | "Low";
};

type ActionPreview = {
  fullness: number;
  dryness: number;
  training: number;
};

type Props = {
  adjustments: string[];
  digestion: number;
  sleepQuality: number;
  intraSodium: number;
  fullnessScore: number;
  spillRisk: number;
  outcomePreview: OutcomePreview;
  actionPreviewMap: {
    addCarbs: ActionPreview;
    addSalt: ActionPreview;
    reduceCarbs: ActionPreview;
    reduceIntensity: ActionPreview;
  };
  onAddCarbs: () => void;
  onAddSalt: () => void;
  onReduceCarbs: () => void;
  onReduceIntensity: () => void;
};

export default function DecisionEngine(props: Props) {
  const {
    adjustments,
    digestion,
    sleepQuality,
    intraSodium,
    fullnessScore,
    spillRisk,
    outcomePreview,
    actionPreviewMap,
    onAddCarbs,
    onAddSalt,
    onReduceCarbs,
    onReduceIntensity,
  } = props;

  let limiter = "Balanced";
  if (digestion <= 4) limiter = "Digestion";
  else if (sleepQuality <= 4) limiter = "Sleep / Cortisol";
  else if (intraSodium < 1200) limiter = "Intra Sodium";
  else if (fullnessScore < 6.5) limiter = "Fullness / Glycogen";
  else if (spillRisk > 6) limiter = "Spill Risk";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 space-y-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Today You Should</div>
        <div className="text-xs text-muted-foreground">high-signal actions</div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/20">
        <div className="text-muted-foreground">Primary Limiter</div>
        <div className="font-semibold">{limiter}</div>
      </div>

      <div className="grid gap-2">
        {adjustments.slice(0, 4).map((rec, i) => {
          const isRisk = rec.toLowerCase().includes("risk") || rec.toLowerCase().includes("high");
          const isReduce = rec.toLowerCase().includes("reduce") || rec.toLowerCase().includes("lower");
          const tone = isRisk
            ? "bg-red-500/15 border-red-500/30"
            : isReduce
              ? "bg-yellow-500/15 border-yellow-500/30"
              : "bg-green-500/15 border-green-500/30";

          return (
            <div key={i} className={`rounded-xl border p-3 text-sm ${tone}`}>
              {rec}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-black/20">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">Expected Outcome</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Confidence {outcomePreview.confidence}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>Fullness <span className="font-semibold">{outcomePreview.fullnessDelta > 0 ? "+" : ""}{outcomePreview.fullnessDelta}</span></div>
            <div>Dryness <span className="font-semibold">{outcomePreview.drynessDelta > 0 ? "+" : ""}{outcomePreview.drynessDelta}</span></div>
            <div>Training <span className="font-semibold">{outcomePreview.trainingDelta > 0 ? "+" : ""}{outcomePreview.trainingDelta}</span></div>
          </div>
          {outcomePreview.warnings.length > 0 && (
            <div className="mt-3 grid gap-2">
              {outcomePreview.warnings.map((warning, idx) => (
                <div key={idx} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px]">
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={onAddCarbs}>
            <span>+10g Intra</span>
            <span className="text-[10px] text-muted-foreground">
              F {actionPreviewMap.addCarbs.fullness > 0 ? "+" : ""}{actionPreviewMap.addCarbs.fullness}
              {" · "}
              D {actionPreviewMap.addCarbs.dryness > 0 ? "+" : ""}{actionPreviewMap.addCarbs.dryness}
              {" · "}
              T {actionPreviewMap.addCarbs.training > 0 ? "+" : ""}{actionPreviewMap.addCarbs.training}
            </span>
          </Button>

          <Button size="sm" variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={onAddSalt}>
            <span>+0.1 tsp Salt</span>
            <span className="text-[10px] text-muted-foreground">
              F {actionPreviewMap.addSalt.fullness > 0 ? "+" : ""}{actionPreviewMap.addSalt.fullness}
              {" · "}
              D {actionPreviewMap.addSalt.dryness > 0 ? "+" : ""}{actionPreviewMap.addSalt.dryness}
              {" · "}
              T {actionPreviewMap.addSalt.training > 0 ? "+" : ""}{actionPreviewMap.addSalt.training}
            </span>
          </Button>

          <Button size="sm" variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={onReduceCarbs}>
            <span>-20g Carbs</span>
            <span className="text-[10px] text-muted-foreground">
              F {actionPreviewMap.reduceCarbs.fullness > 0 ? "+" : ""}{actionPreviewMap.reduceCarbs.fullness}
              {" · "}
              D {actionPreviewMap.reduceCarbs.dryness > 0 ? "+" : ""}{actionPreviewMap.reduceCarbs.dryness}
              {" · "}
              T {actionPreviewMap.reduceCarbs.training > 0 ? "+" : ""}{actionPreviewMap.reduceCarbs.training}
            </span>
          </Button>

          <Button size="sm" variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={onReduceIntensity}>
            <span>↓ Intensity</span>
            <span className="text-[10px] text-muted-foreground">
              F {actionPreviewMap.reduceIntensity.fullness > 0 ? "+" : ""}{actionPreviewMap.reduceIntensity.fullness}
              {" · "}
              D {actionPreviewMap.reduceIntensity.dryness > 0 ? "+" : ""}{actionPreviewMap.reduceIntensity.dryness}
              {" · "}
              T {actionPreviewMap.reduceIntensity.training > 0 ? "+" : ""}{actionPreviewMap.reduceIntensity.training}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
