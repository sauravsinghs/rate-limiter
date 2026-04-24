import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appendBurstEvents,
  createSimulationCursor,
  generateRequestStream,
  predictNextStep,
  runSimulationStep,
  type SimulationCursorState,
} from "../engine/simulation";
import type { SimulationMode, SimulationParams } from "../engine/types";

interface ResetSimulationOptions {
  mode?: SimulationMode;
  requestCount?: number;
  autoPlay?: boolean;
}

interface UseDeterministicSimulationOptions {
  requestCount: number;
  params: SimulationParams;
  seed?: number;
  initialMode?: SimulationMode;
  autoPlay?: boolean;
}

export function useDeterministicSimulation({
  requestCount,
  params,
  seed = 24_04_2026,
  initialMode = "random",
  autoPlay = false,
}: UseDeterministicSimulationOptions) {
  const seedRef = useRef(seed);
  const [mode, setMode] = useState<SimulationMode>(initialMode);
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const buildCursor = useCallback(
    (nextMode: SimulationMode, nextRequestCount: number): SimulationCursorState => {
      const stream = generateRequestStream(nextRequestCount, nextMode, seedRef.current);
      return createSimulationCursor(params, stream);
    },
    [params],
  );

  const [cursor, setCursor] = useState<SimulationCursorState>(() =>
    buildCursor(initialMode, requestCount),
  );

  const reset = useCallback(
    (options: ResetSimulationOptions = {}) => {
      const nextMode = options.mode ?? mode;
      const nextRequestCount = options.requestCount ?? requestCount;
      setMode(nextMode);
      setCursor(buildCursor(nextMode, nextRequestCount));
      setIsPlaying(options.autoPlay ?? false);
    },
    [buildCursor, mode, requestCount],
  );

  const setModeAndReset = useCallback(
    (nextMode: SimulationMode) => {
      setMode(nextMode);
      setCursor(buildCursor(nextMode, requestCount));
      setIsPlaying(false);
    },
    [buildCursor, requestCount],
  );

  const stepForward = useCallback(() => {
    setCursor((previous) => {
      const result = runSimulationStep(previous);
      return result.step ? result.cursor : previous;
    });
  }, []);

  const addBurst = useCallback((count: number = 6) => {
    setCursor((previous) => ({
      ...previous,
      events: appendBurstEvents(
        previous.events,
        count,
        seedRef.current + previous.events.length * 13,
      ),
    }));
  }, []);

  const togglePlay = useCallback(() => {
    if (cursor.index >= cursor.events.length) {
      return;
    }
    setIsPlaying((value) => !value);
  }, [cursor.index, cursor.events.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (cursor.index >= cursor.events.length) {
      return;
    }
    setIsPlaying(true);
  }, [cursor.index, cursor.events.length]);

  useEffect(() => {
    setCursor(buildCursor(mode, requestCount));
    setIsPlaying(false);
  }, [buildCursor, mode, requestCount]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    if (cursor.index >= cursor.events.length) {
      setIsPlaying(false);
      return;
    }

    const delay = Math.max(80, Math.round(420 / speed));
    const timer = window.setTimeout(() => {
      stepForward();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cursor.events.length, cursor.index, isPlaying, speed, stepForward]);

  const currentStep = cursor.steps.at(-1) ?? null;
  const prediction = useMemo(() => predictNextStep(cursor), [cursor]);

  const divergentRequestIds = useMemo(
    () => new Set(cursor.steps.filter((step) => step.isDecisionDifferent).map((step) => step.request.id)),
    [cursor.steps],
  );

  return {
    mode,
    speed,
    isPlaying,
    cursorIndex: cursor.index,
    clockMs: cursor.clock,
    events: cursor.events,
    steps: cursor.steps,
    currentStep,
    prediction,
    divergentRequestIds,
    completed: cursor.index >= cursor.events.length,
    processedCount: cursor.index,
    setSpeed,
    setMode: setModeAndReset,
    togglePlay,
    pause,
    play,
    stepForward,
    reset,
    addBurst,
  };
}
