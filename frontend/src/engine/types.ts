import type { Algorithm } from "../services/api";

export type SimulationAlgorithm = Algorithm;
export type RequestKind = "normal" | "burst";
export type SimulationMode = "random" | "burst";

export interface SimulationParams {
  tokenBucket: {
    capacity: number;
    refillRate: number;
  };
  slidingWindow: {
    maxRequests: number;
    windowSize: number;
  };
  leakyBucket: {
    capacity: number;
    leakRate: number;
  };
}

export interface RequestEvent {
  id: number;
  time: number;
  kind: RequestKind;
}

export interface TokenBucketStepState {
  tokens: number;
  capacity: number;
  refillRate: number;
  accepted: boolean;
  retryAfter: number;
}

export interface SlidingWindowStepState {
  count: number;
  maxRequests: number;
  windowSize: number;
  accepted: boolean;
  retryAfter: number;
}

export interface LeakyBucketStepState {
  queueSize: number;
  capacity: number;
  leakRate: number;
  accepted: boolean;
  retryAfter: number;
}

export interface SimulationStep {
  time: number;
  request: RequestEvent;
  tokenBucket: TokenBucketStepState;
  slidingWindow: SlidingWindowStepState;
  leakyBucket: LeakyBucketStepState;
  isDecisionDifferent: boolean;
}

export interface AlgorithmPrediction {
  accepted: boolean;
  reason: string;
  projectedValue: number;
}

export interface SimulationPrediction {
  request: RequestEvent;
  tokenBucket: AlgorithmPrediction;
  slidingWindow: AlgorithmPrediction;
  leakyBucket: AlgorithmPrediction;
  isDecisionDifferent: boolean;
}
