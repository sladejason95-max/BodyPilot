import React from "react";
import { Button } from "@/components/ui/button";

type CheckIn = {
  coachComment?: string;
  clientComment?: string;
  id: string;
  label: string;
  date: string;
  bodyWeight: number;
  carbTarget: number;
  proteinTarget: number;
  fatTarget: number;
  drynessScore: number;
  fullnessScore: number;
  trainingScore: number;
  recoveryScore: number;
  waistTrend: number;
};

type Props = {
  entry: CheckIn;
  onDelete: (id: string) => void;
};

export default function CheckInCard({ entry, onDelete }: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{entry.label}</div>
          <div className="text-xs text-muted-foreground">
            {entry.date}, {entry.bodyWeight} lb, {entry.carbTarget}C / {entry.proteinTarget}P / {entry.fatTarget}F
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onDelete(entry.id)}>Delete</Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-5">
        <div>Dryness: {entry.drynessScore}</div>
        <div>Fullness: {entry.fullnessScore}</div>
        <div>Training: {entry.trainingScore}</div>
        <div>Recovery: {entry.recoveryScore}</div>
        <div>Waist trend: {entry.waistTrend}</div>
      </div>

      {(entry.coachComment || entry.clientComment) && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {entry.coachComment && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Coach Comment</div>
              <div className="text-sm text-muted-foreground">{entry.coachComment}</div>
            </div>
          )}
          {entry.clientComment && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Client Update</div>
              <div className="text-sm text-muted-foreground">{entry.clientComment}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
