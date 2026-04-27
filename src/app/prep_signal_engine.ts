import type { PerformanceInsightCard } from "./insight_engine";
import type { InterventionRecommendation } from "./monitoring_engine";
import type { CheckInReviewSnapshot } from "./review_engine";
import type {
  BodyWeightTrendModel,
  DecisionConfidenceModel,
  DietPressureModel,
  RecoveryPressureModel,
  ScienceTone,
} from "./science_model";

export type PrepSignalTab =
  | "dashboard"
  | "nutrition"
  | "compounds"
  | "split"
  | "tracker"
  | "schedule"
  | "library"
  | "coach";

export type PrepSignalItem = {
  label: string;
  title: string;
  detail: string;
  tone: ScienceTone;
  tab: PrepSignalTab;
};

export type PrepSignalSnapshot = {
  posture: PrepSignalItem;
  focusLane: PrepSignalItem;
  cautionLane: PrepSignalItem;
  metrics: PrepSignalItem[];
};

type PrepSignalInput = {
  selectedTrackerExecutionScore: number;
  selectedTrackerMissingFieldsCount: number;
  complianceScore: number;
  decisionConfidenceModel: DecisionConfidenceModel;
  bodyWeightTrendModel: BodyWeightTrendModel;
  dietPressureModel: DietPressureModel;
  recoveryPressureModel: RecoveryPressureModel;
  checkInReviewSnapshot: CheckInReviewSnapshot;
  topInsight: PerformanceInsightCard | null;
  topIntervention: InterventionRecommendation | null;
};

const reviewTone = (status: CheckInReviewSnapshot["status"]): ScienceTone => {
  if (status === "due") return "amber";
  if (status === "soon") return "sky";
  return "emerald";
};

const buildPosture = (input: PrepSignalInput): PrepSignalItem => {
  const {
    selectedTrackerExecutionScore,
    selectedTrackerMissingFieldsCount,
    complianceScore,
    decisionConfidenceModel,
    bodyWeightTrendModel,
    dietPressureModel,
    recoveryPressureModel,
    checkInReviewSnapshot,
    topInsight,
  } = input;

  const lowSignal =
    decisionConfidenceModel.status === "low" ||
    selectedTrackerExecutionScore < 70 ||
    complianceScore < 70 ||
    selectedTrackerMissingFieldsCount > 0;

  if (lowSignal) {
    const signalDetailParts = [
      `${decisionConfidenceModel.score} / 100 decision confidence`,
      `${selectedTrackerExecutionScore}% execution`,
      selectedTrackerMissingFieldsCount > 0
        ? `${selectedTrackerMissingFieldsCount} open tracker fields`
        : `${complianceScore} / 100 compliance`,
    ];

    return {
      label: "Coaching posture",
      title: "Clean the signal before changing the plan",
      detail: `${signalDetailParts.join(", ")}. Tighten logging and follow-through before you treat this like a true physiology problem.`,
      tone:
        selectedTrackerExecutionScore < 50 || selectedTrackerMissingFieldsCount >= 2
          ? "rose"
          : "amber",
      tab: "tracker",
    };
  }

  if (checkInReviewSnapshot.status === "due") {
    return {
      label: "Coaching posture",
      title: "Refresh the review before making the next call",
      detail: `${checkInReviewSnapshot.detail} Update the checkpoint so the next adjustment is anchored to current condition instead of stale context.`,
      tone: "amber",
      tab: "dashboard",
    };
  }

  if (
    dietPressureModel.status === "aggressive-deficit" ||
    recoveryPressureModel.status === "high" ||
    topInsight?.id === "recovery-bottleneck" ||
    topInsight?.id === "phase-balance"
  ) {
    return {
      label: "Coaching posture",
      title: "Protect recovery before pushing harder",
      detail: `${dietPressureModel.title}, ${recoveryPressureModel.title.toLowerCase()}, and the current model read all point toward reducing recovery cost before adding more pressure.`,
      tone:
        dietPressureModel.status === "aggressive-deficit" || recoveryPressureModel.status === "high"
          ? "rose"
          : "amber",
      tab: topInsight?.tab ?? "nutrition",
    };
  }

  if (
    decisionConfidenceModel.status !== "low" &&
    recoveryPressureModel.status === "supported" &&
    (bodyWeightTrendModel.status === "holding" || bodyWeightTrendModel.status === "slow-cut")
  ) {
    return {
      label: "Coaching posture",
      title: "Add only low-cost pressure",
      detail: `${bodyWeightTrendModel.title} with ${recoveryPressureModel.title.toLowerCase()} suggests the next move should stay cheap and reversible rather than harsher food cuts or more fatigue.`,
      tone: "sky",
      tab: "tracker",
    };
  }

  return {
    label: "Coaching posture",
    title: "Hold the current line and keep it boring",
    detail: `${bodyWeightTrendModel.title}, ${recoveryPressureModel.title.toLowerCase()}, and ${decisionConfidenceModel.title.toLowerCase()} all support consistency over invention right now.`,
    tone: "emerald",
    tab: topInsight?.tab ?? "dashboard",
  };
};

const buildFocusLane = (input: PrepSignalInput): PrepSignalItem => {
  const { topIntervention, topInsight, checkInReviewSnapshot, selectedTrackerMissingFieldsCount } = input;

  if (topIntervention) {
    return {
      label: "Best next lane",
      title: topIntervention.title,
      detail: topIntervention.detail,
      tone: topIntervention.tone,
      tab: topIntervention.tab,
    };
  }

  if (topInsight && topInsight.actionability !== "watch") {
    return {
      label: "Best next lane",
      title: topInsight.title,
      detail: topInsight.detail,
      tone: topInsight.tone,
      tab: topInsight.tab,
    };
  }

  if (selectedTrackerMissingFieldsCount > 0) {
    return {
      label: "Best next lane",
      title: "Run the baseline playbook while signal builds",
      detail: "Hit protein, stay near calories, complete training, keep steps moving, and add bodyweight / energy when you can. The next read gets sharper without making today useless.",
      tone: "amber",
      tab: "tracker",
    };
  }

  if (checkInReviewSnapshot.status !== "on-track") {
    return {
      label: "Best next lane",
      title: checkInReviewSnapshot.title,
      detail: checkInReviewSnapshot.detail,
      tone: reviewTone(checkInReviewSnapshot.status),
      tab: "dashboard",
    };
  }

  return {
    label: "Best next lane",
    title: "Let the day stay operational",
    detail: "The highest-value move is simple execution. Keep the day clean instead of creating another layer of adjustment.",
    tone: "slate",
    tab: "tracker",
  };
};

const buildCautionLane = (input: PrepSignalInput): PrepSignalItem => {
  const {
    selectedTrackerMissingFieldsCount,
    decisionConfidenceModel,
    checkInReviewSnapshot,
    recoveryPressureModel,
    topInsight,
  } = input;

  if (topInsight && (topInsight.id === "signal-distortion" || topInsight.id === "compound-context")) {
    return {
      label: "Read caution",
      title: topInsight.title,
      detail: topInsight.detail,
      tone: topInsight.tone,
      tab: topInsight.tab,
    };
  }

  if (selectedTrackerMissingFieldsCount > 0 || decisionConfidenceModel.status === "low") {
    return {
      label: "Read caution",
      title: "Do not overread a noisy day",
      detail: `${decisionConfidenceModel.detail} The fastest way to improve the system is to improve the signal, not to invent more changes.`,
      tone: decisionConfidenceModel.tone,
      tab: "tracker",
    };
  }

  if (checkInReviewSnapshot.status !== "on-track") {
    return {
      label: "Read caution",
      title: "The review rhythm still matters",
      detail: checkInReviewSnapshot.comparisonDetail,
      tone: reviewTone(checkInReviewSnapshot.status),
      tab: "dashboard",
    };
  }

  if (recoveryPressureModel.status === "strained" || recoveryPressureModel.status === "high") {
    return {
      label: "Read caution",
      title: "Do not hide recovery debt behind more work",
      detail: recoveryPressureModel.detail,
      tone: recoveryPressureModel.tone,
      tab: "split",
    };
  }

  return {
    label: "Read caution",
    title: "Avoid unnecessary adjustments",
    detail: "The cleanest edge right now is consistency. Add complexity only when the signal truly earns it.",
    tone: "slate",
    tab: "dashboard",
  };
};

export const buildPrepSignalSnapshot = (input: PrepSignalInput): PrepSignalSnapshot => {
  const {
    selectedTrackerExecutionScore,
    complianceScore,
    decisionConfidenceModel,
    bodyWeightTrendModel,
    dietPressureModel,
    recoveryPressureModel,
    checkInReviewSnapshot,
  } = input;

  const metrics: PrepSignalItem[] = [
      {
        label: "Signal quality",
        title: decisionConfidenceModel.title,
        detail: `${decisionConfidenceModel.score} / 100 confidence, ${selectedTrackerExecutionScore}% execution, ${complianceScore} / 100 compliance.`,
        tone: decisionConfidenceModel.tone,
        tab: "tracker",
      },
      {
        label: "Trend pace",
        title: bodyWeightTrendModel.title,
        detail: bodyWeightTrendModel.detail,
        tone: bodyWeightTrendModel.tone,
        tab: "dashboard",
      },
      {
        label: "Recovery cost",
        title: recoveryPressureModel.title,
        detail: recoveryPressureModel.detail,
        tone: recoveryPressureModel.tone,
        tab: "tracker",
      },
      {
        label: "Review rhythm",
        title: checkInReviewSnapshot.title,
        detail: checkInReviewSnapshot.comparisonDetail || checkInReviewSnapshot.detail,
        tone: reviewTone(checkInReviewSnapshot.status),
        tab: "dashboard",
      },
      {
        label: "Phase pressure",
        title: dietPressureModel.title,
        detail: dietPressureModel.detail,
        tone: dietPressureModel.tone,
        tab: "nutrition",
      },
    ];

  return {
    posture: buildPosture(input),
    focusLane: buildFocusLane(input),
    cautionLane: buildCautionLane(input),
    metrics: metrics.slice(0, 4),
  };
};
