import type { SlidingWindowStepState } from "../types";

export interface SlidingWindowState {
  maxRequests: number;
  windowSize: number;
  timestamps: number[];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function createSlidingWindowState(
  maxRequests: number,
  windowSize: number,
): SlidingWindowState {
  return {
    maxRequests,
    windowSize,
    timestamps: [],
  };
}

export function stepSlidingWindow(
  state: SlidingWindowState,
  time: number,
): {
  nextState: SlidingWindowState;
  snapshot: SlidingWindowStepState;
} {
  const threshold = time - state.windowSize;
  const activeTimestamps = state.timestamps.filter((value) => value > threshold);

  const accepted = activeTimestamps.length < state.maxRequests;
  const nextTimestamps = accepted ? [...activeTimestamps, time] : activeTimestamps;

  const retryAfter = !accepted && activeTimestamps.length > 0
    ? Math.max(0, (activeTimestamps[0] + state.windowSize - time) / 1000)
    : 0;

  const nextState: SlidingWindowState = {
    ...state,
    timestamps: nextTimestamps,
  };

  return {
    nextState,
    snapshot: {
      count: nextTimestamps.length,
      maxRequests: state.maxRequests,
      windowSize: state.windowSize,
      accepted,
      retryAfter: round(retryAfter),
    },
  };
}
