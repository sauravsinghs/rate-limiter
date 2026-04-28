import type { TokenBucketStepState } from "../types";

export interface TokenBucketState {
  tokens: number;
  capacity: number;
  refillRate: number;
  lastTime: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function createTokenBucketState(
  capacity: number,
  refillRate: number,
  startTime: number,
): TokenBucketState {
  return {
    tokens: capacity,
    capacity,
    refillRate,
    lastTime: startTime,
  };
}

export function stepTokenBucket(
  state: TokenBucketState,
  time: number,
): {
  nextState: TokenBucketState;
  snapshot: TokenBucketStepState;
} {
  const elapsedSeconds = Math.max(0, (time - state.lastTime) / 1000);
  const refilledTokens = state.tokens + elapsedSeconds * state.refillRate;
  const availableTokens = Math.min(state.capacity, refilledTokens);

  const accepted = availableTokens >= 1;
  const tokensAfterRequest = accepted ? availableTokens - 1 : availableTokens;
  const retryAfter = accepted
    ? 0
    : state.refillRate > 0
      ? Math.max(0, (1 - availableTokens) / state.refillRate)
      : 0;

  const nextState: TokenBucketState = {
    ...state,
    tokens: round(tokensAfterRequest),
    lastTime: time,
  };

  return {
    nextState,
    snapshot: {
      tokens: nextState.tokens,
      capacity: state.capacity,
      refillRate: state.refillRate,
      accepted,
      retryAfter: round(retryAfter),
    },
  };
}
