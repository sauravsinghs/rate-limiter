import {
  createLeakyBucketState,
  stepLeakyBucket,
  type LeakyBucketState,
} from "./algorithms/leakyBucket";
import {
  createSlidingWindowState,
  stepSlidingWindow,
  type SlidingWindowState,
} from "./algorithms/slidingWindow";
import {
  createTokenBucketState,
  stepTokenBucket,
  type TokenBucketState,
} from "./algorithms/tokenBucket";
import type {
  AlgorithmPrediction,
  RequestEvent,
  SimulationMode,
  SimulationParams,
  SimulationPrediction,
  SimulationStep,
} from "./types";

interface InternalSimulationState {
  tokenBucket: TokenBucketState;
  slidingWindow: SlidingWindowState;
  leakyBucket: LeakyBucketState;
}

export interface SimulationCursorState {
  index: number;
  clock: number;
  events: RequestEvent[];
  steps: SimulationStep[];
  internal: InternalSimulationState;
}

function mulberry32(seed: number): () => number {
  let current = seed;
  return () => {
    current |= 0;
    current = (current + 0x6d2b79f5) | 0;
    let t = Math.imul(current ^ (current >>> 15), 1 | current);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createPrediction(
  accepted: boolean,
  reason: string,
  projectedValue: number,
): AlgorithmPrediction {
  return {
    accepted,
    reason,
    projectedValue,
  };
}

function buildInternalState(
  params: SimulationParams,
  startTime: number,
): InternalSimulationState {
  return {
    tokenBucket: createTokenBucketState(
      params.tokenBucket.capacity,
      params.tokenBucket.refillRate,
      startTime,
    ),
    slidingWindow: createSlidingWindowState(
      params.slidingWindow.maxRequests,
      params.slidingWindow.windowSize,
    ),
    leakyBucket: createLeakyBucketState(
      params.leakyBucket.capacity,
      params.leakyBucket.leakRate,
      startTime,
    ),
  };
}

export function generateRequestStream(
  totalRequests: number,
  mode: SimulationMode,
  seed: number,
): RequestEvent[] {
  const safeTotal = Math.max(0, Math.floor(totalRequests));
  const random = mulberry32(seed);
  const events: RequestEvent[] = [];

  let timeline = 0;

  for (let index = 0; index < safeTotal; index += 1) {
    const inBurstCluster = mode === "burst" && index % 7 >= 4;
    const spacing = inBurstCluster
      ? 30 + Math.floor(random() * 40)
      : mode === "burst"
        ? 210 + Math.floor(random() * 120)
        : 140 + Math.floor(random() * 260);

    timeline += spacing;

    events.push({
      id: index + 1,
      time: timeline,
      kind: inBurstCluster ? "burst" : "normal",
    });
  }

  return events;
}

export function appendBurstEvents(
  existingEvents: RequestEvent[],
  count: number,
  seed: number,
): RequestEvent[] {
  const random = mulberry32(seed);
  const safeCount = Math.max(0, Math.floor(count));
  const nextEvents = [...existingEvents];

  const lastId = existingEvents.at(-1)?.id ?? 0;
  let timeline = existingEvents.at(-1)?.time ?? 0;

  for (let index = 0; index < safeCount; index += 1) {
    timeline += 20 + Math.floor(random() * 35);
    nextEvents.push({
      id: lastId + index + 1,
      time: timeline,
      kind: "burst",
    });
  }

  return nextEvents;
}

export function createSimulationCursor(
  params: SimulationParams,
  events: RequestEvent[],
): SimulationCursorState {
  const startTime = events[0]?.time ?? 0;
  return {
    index: 0,
    clock: startTime,
    events,
    steps: [],
    internal: buildInternalState(params, startTime),
  };
}

export function runSimulationStep(cursor: SimulationCursorState): {
  cursor: SimulationCursorState;
  step: SimulationStep | null;
} {
  if (cursor.index >= cursor.events.length) {
    return { cursor, step: null };
  }

  const request = cursor.events[cursor.index];
  const time = request.time;

  const tokenResult = stepTokenBucket(cursor.internal.tokenBucket, time);
  const windowResult = stepSlidingWindow(cursor.internal.slidingWindow, time);
  const leakyResult = stepLeakyBucket(cursor.internal.leakyBucket, time);

  const isDecisionDifferent =
    tokenResult.snapshot.accepted !== windowResult.snapshot.accepted ||
    tokenResult.snapshot.accepted !== leakyResult.snapshot.accepted;

  const step: SimulationStep = {
    time,
    request,
    tokenBucket: tokenResult.snapshot,
    slidingWindow: windowResult.snapshot,
    leakyBucket: leakyResult.snapshot,
    isDecisionDifferent,
  };

  return {
    step,
    cursor: {
      index: cursor.index + 1,
      clock: time,
      events: cursor.events,
      steps: [...cursor.steps, step],
      internal: {
        tokenBucket: tokenResult.nextState,
        slidingWindow: windowResult.nextState,
        leakyBucket: leakyResult.nextState,
      },
    },
  };
}

export function predictNextStep(
  cursor: SimulationCursorState,
): SimulationPrediction | null {
  if (cursor.index >= cursor.events.length) {
    return null;
  }

  const request = cursor.events[cursor.index];

  const tokenResult = stepTokenBucket(cursor.internal.tokenBucket, request.time);
  const windowResult = stepSlidingWindow(cursor.internal.slidingWindow, request.time);
  const leakyResult = stepLeakyBucket(cursor.internal.leakyBucket, request.time);

  const tokenPrediction = createPrediction(
    tokenResult.snapshot.accepted,
    tokenResult.snapshot.accepted
      ? "enough tokens in bucket"
      : "token balance is below one",
    tokenResult.snapshot.tokens,
  );

  const windowPrediction = createPrediction(
    windowResult.snapshot.accepted,
    windowResult.snapshot.accepted
      ? "window still has request slots"
      : "window reached request limit",
    windowResult.snapshot.count,
  );

  const leakyPrediction = createPrediction(
    leakyResult.snapshot.accepted,
    leakyResult.snapshot.accepted
      ? "queue has remaining capacity"
      : "queue would overflow",
    leakyResult.snapshot.queueSize,
  );

  const isDecisionDifferent =
    tokenPrediction.accepted !== windowPrediction.accepted ||
    tokenPrediction.accepted !== leakyPrediction.accepted;

  return {
    request,
    tokenBucket: tokenPrediction,
    slidingWindow: windowPrediction,
    leakyBucket: leakyPrediction,
    isDecisionDifferent,
  };
}
