import type { LeakyBucketStepState } from "../types";

export interface LeakyBucketState {
  level: number;
  capacity: number;
  leakRate: number;
  lastTime: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function createLeakyBucketState(
  capacity: number,
  leakRate: number,
  startTime: number,
): LeakyBucketState {
  return {
    level: 0,
    capacity,
    leakRate,
    lastTime: startTime,
  };
}

export function stepLeakyBucket(
  state: LeakyBucketState,
  time: number,
): {
  nextState: LeakyBucketState;
  snapshot: LeakyBucketStepState;
} {
  const elapsedSeconds = Math.max(0, (time - state.lastTime) / 1000);
  const leaked = elapsedSeconds * state.leakRate;
  const levelAfterLeak = Math.max(0, state.level - leaked);

  const accepted = levelAfterLeak + 1 <= state.capacity;
  const nextLevel = accepted ? levelAfterLeak + 1 : levelAfterLeak;
  const retryAfter = accepted
    ? 0
    : state.leakRate > 0
      ? Math.max(0, (levelAfterLeak + 1 - state.capacity) / state.leakRate)
      : 0;

  const nextState: LeakyBucketState = {
    ...state,
    level: round(nextLevel),
    lastTime: time,
  };

  return {
    nextState,
    snapshot: {
      queueSize: nextState.level,
      capacity: state.capacity,
      leakRate: state.leakRate,
      accepted,
      retryAfter: round(retryAfter),
    },
  };
}
