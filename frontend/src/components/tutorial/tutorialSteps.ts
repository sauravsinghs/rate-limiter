import type { Algorithm } from "../../services/api";
import type { SimulationMode } from "../../engine/types";

export interface TutorialContext {
  mode: SimulationMode;
  cursorIndex: number;
  selectedAlgo: Algorithm;
  eventsLength: number;
  baseRequestCount: number;
  tokenTokens: number;
  slidingCount: number;
  leakyQueue: number;
  hasDivergence: boolean;
  predictionVisible: boolean;
  hasPrediction: boolean;
  burstInjectedInTutorial: boolean;
  predictionToggledInTutorial: boolean;
  modeChangedInTutorial: boolean;
  tabVisitedInTutorial: {
    "token-bucket": boolean;
    "sliding-window": boolean;
    "leaky-bucket": boolean;
  };
}

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  targetSelector: string;
  requirement?: string;
  allowManualAdvance?: boolean;
  autoAdvanceOnRevisit?: boolean;
  isComplete?: (ctx: TutorialContext) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Tutorial Mode",
    body: "You will learn how Token Bucket, Sliding Window, and Leaky Bucket respond to the same request timeline.",
    targetSelector: '[data-tutorial="timeline"]',
    allowManualAdvance: true,
  },
  {
    id: "timeline",
    title: "Understand the Shared Timeline",
    body: "Every dot is one request sent to all three algorithms. Green means processed; the highlighted dot is current.",
    targetSelector: '[data-tutorial="timeline-track"]',
    allowManualAdvance: true,
  },
  {
    id: "mode-burst",
    title: "Switch Traffic Mode to Burst",
    body: "Burst mode creates clustered requests so you can observe pressure behavior faster.",
    targetSelector: '[data-tutorial="control-mode"]',
    requirement: "Set Traffic Mode to Burst.",
    isComplete: (ctx) => ctx.mode === "burst" && ctx.modeChangedInTutorial,
  },
  {
    id: "step-once",
    title: "Process at Least One Step",
    body: "Use Step (or Play) to process requests and update algorithm state.",
    targetSelector: '[data-tutorial="control-step"]',
    requirement: "Advance the simulation at least once.",
    isComplete: (ctx) => ctx.cursorIndex > 0,
  },
  {
    id: "token-bucket",
    title: "Token Bucket Behavior",
    body: "Select Token Bucket and watch token count drop when traffic spikes, then refill over time.",
    targetSelector: '[data-tutorial="tab-token-bucket"]',
    requirement: "Open Token Bucket tab.",
    isComplete: (ctx) =>
      ctx.selectedAlgo === "token-bucket" &&
      ctx.tabVisitedInTutorial["token-bucket"] &&
      (ctx.cursorIndex > 1 || ctx.tokenTokens >= 0),
  },
  {
    id: "sliding-window",
    title: "Sliding Window Behavior",
    body: "Sliding Window accepts only while the rolling count is below max requests.",
    targetSelector: '[data-tutorial="tab-sliding-window"]',
    requirement: "Open Sliding Window tab.",
    isComplete: (ctx) =>
      ctx.selectedAlgo === "sliding-window" &&
      ctx.tabVisitedInTutorial["sliding-window"] &&
      (ctx.cursorIndex > 1 || ctx.slidingCount >= 0),
  },
  {
    id: "leaky-bucket",
    title: "Leaky Bucket Behavior",
    body: "Leaky Bucket queues incoming requests and drains at a constant leak rate.",
    targetSelector: '[data-tutorial="tab-leaky-bucket"]',
    requirement: "Open Leaky Bucket tab.",
    isComplete: (ctx) =>
      ctx.selectedAlgo === "leaky-bucket" &&
      ctx.tabVisitedInTutorial["leaky-bucket"] &&
      (ctx.cursorIndex > 1 || ctx.leakyQueue >= 0),
  },
  {
    id: "inject-burst",
    title: "Inject a Manual Burst",
    body: "Use Burst +6 to append tightly packed requests and stress all algorithms.",
    targetSelector: '[data-tutorial="control-burst"]',
    requirement: "Click Burst +6 once.",
    autoAdvanceOnRevisit: false,
    isComplete: (ctx) =>
      ctx.burstInjectedInTutorial && ctx.eventsLength > ctx.baseRequestCount,
  },
  {
    id: "divergence",
    title: "Observe Divergence",
    body: "Look for moments where algorithms make different accept/reject decisions on the same request.",
    targetSelector: '[data-tutorial="timeline-track"]',
    requirement: "Reach a point where algorithms diverge.",
    autoAdvanceOnRevisit: false,
    isComplete: (ctx) => ctx.hasDivergence,
  },
  {
    id: "prediction",
    title: "Prediction Mode",
    body: "Enable prediction to inspect expected outcomes for the next request before stepping.",
    targetSelector: '[data-tutorial="control-prediction"]',
    requirement: "Show Prediction and keep the prediction card visible.",
    autoAdvanceOnRevisit: false,
    isComplete: (ctx) =>
      ctx.predictionVisible &&
      ctx.hasPrediction &&
      ctx.predictionToggledInTutorial,
  },
  {
    id: "recap",
    title: "Tutorial Complete",
    body: "You have explored all three algorithms under shared traffic. Try scenarios and race mode next.",
    targetSelector: '[data-tutorial="algo-panel"]',
    allowManualAdvance: true,
  },
];

