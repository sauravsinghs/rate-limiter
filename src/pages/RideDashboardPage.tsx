/**
 * RideDashboardPage — Page 2
 * Three-algorithm comparison: Token Bucket vs Sliding Window vs Leaky Bucket
 * Includes a modular toolbox, deterministic timeline simulation, and live code rails.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AlgorithmCodeCard from "../components/dashboard/AlgorithmCodeCard";
import AlgorithmPanel from "../components/dashboard/AlgorithmPanel";
import AlgorithmToolbox, {
  DEFAULT_DASHBOARD_CONFIG_DRAFT,
  type DashboardConfigDraft,
} from "../components/dashboard/AlgorithmToolbox";
import RequestTimeline from "../components/dashboard/RequestTimeline";
import SimulationControls from "../components/dashboard/SimulationControls";
import BucketView from "../components/BucketView";
import WindowView from "../components/WindowView";
import LeakyBucketView from "../components/LeakyBucketView";
import { useRateLimiter } from "../hooks/useRateLimiter";
import { useDeterministicSimulation } from "../hooks/useDeterministicSimulation";
import {
  resetAllStats,
  sendTestRequest,
  updateBucketConfig,
  type Algorithm,
  type BucketStats,
  type RequestStats,
} from "../services/api";
import type { SimulationParams, SimulationStep } from "../engine/types";

function getSimulatedBucketStats(
  algorithm: Algorithm,
  steps: SimulationStep[],
  cursorIndex: number,
  params: SimulationParams
): BucketStats {
  if (cursorIndex === 0 || steps.length === 0) {
    if (algorithm === "token-bucket") {
      return {
        tokens: params.tokenBucket.capacity,
        capacity: params.tokenBucket.capacity,
        refillRate: params.tokenBucket.refillRate,
        utilization: "0.00",
      };
    }
    if (algorithm === "sliding-window") {
      return {
        tokens: 0,
        capacity: params.slidingWindow.maxRequests,
        refillRate: 0,
        utilization: "0",
        windowSize: params.slidingWindow.windowSize,
        currentCount: 0,
      };
    }
    return {
      tokens: 0,
      capacity: params.leakyBucket.capacity,
      refillRate: params.leakyBucket.leakRate,
      utilization: "0.00",
      currentLevel: 0,
      leakRate: params.leakyBucket.leakRate,
      queueRemaining: params.leakyBucket.capacity,
    };
  }

  const step = steps[Math.min(cursorIndex - 1, steps.length - 1)];
  if (algorithm === "token-bucket") {
    return {
      tokens: step.tokenBucket.tokens,
      capacity: params.tokenBucket.capacity,
      refillRate: params.tokenBucket.refillRate,
      utilization: (((params.tokenBucket.capacity - step.tokenBucket.tokens) / params.tokenBucket.capacity) * 100).toFixed(2),
    };
  }
  if (algorithm === "sliding-window") {
    return {
      tokens: 0,
      capacity: params.slidingWindow.maxRequests,
      refillRate: 0,
      utilization: "0",
      windowSize: params.slidingWindow.windowSize,
      currentCount: step.slidingWindow.count,
    };
  }
  return {
    tokens: 0,
    capacity: params.leakyBucket.capacity,
    refillRate: params.leakyBucket.leakRate,
    utilization: ((step.leakyBucket.queueSize / params.leakyBucket.capacity) * 100).toFixed(2),
    currentLevel: step.leakyBucket.queueSize,
    leakRate: params.leakyBucket.leakRate,
    queueRemaining: Math.max(0, params.leakyBucket.capacity - step.leakyBucket.queueSize),
  };
}

function getSimulatedRequestStats(
  algorithm: Algorithm,
  steps: SimulationStep[]
): RequestStats {
  if (steps.length === 0) {
    return {
      total: 0,
      allowed: 0,
      blocked: 0,
      successRate: "0.0",
      history: [],
    };
  }
  let allowed = 0;
  let blocked = 0;
  const history = steps.map((s) => {
    const acc =
      algorithm === "token-bucket"
        ? s.tokenBucket.accepted
        : algorithm === "sliding-window"
        ? s.slidingWindow.accepted
        : s.leakyBucket.accepted;
    if (acc) allowed++;
    else blocked++;
    return {
      timestamp: Date.now() - (steps.length * 1000) + s.time,
      allowed: acc ? 1 : 0,
      blocked: acc ? 0 : 1,
    };
  });
  return {
    total: steps.length,
    allowed,
    blocked,
    successRate: ((allowed / steps.length) * 100).toFixed(1),
    history,
  };
}

interface RideState {
  pickup: string;
  dropoff: string;
  rideCount: number;
  farePerRide: number;
  distance: string;
  skipProcessing?: boolean;
}

interface RequestLogEntry {
  id: number;
  tbResult: boolean | null;
  swResult: boolean | null;
  lbResult: boolean | null;
  timestamp: number;
}

function toSimulationParams(draft: DashboardConfigDraft): SimulationParams {
  return {
    tokenBucket: {
      capacity: draft.tb_capacity,
      refillRate: draft.tb_refillRate,
    },
    slidingWindow: {
      maxRequests: draft.sw_maxRequests,
      windowSize: draft.sw_windowSize,
    },
    leakyBucket: {
      capacity: draft.lb_capacity,
      leakRate: draft.lb_leakRate,
    },
  };
}

export default function RideDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const rideState = location.state as RideState | null;

  const tokenBucket = useRateLimiter({
    pollInterval: 500,
    historyLimit: 100,
    algorithm: "token-bucket",
  });
  const slidingWindow = useRateLimiter({
    pollInterval: 500,
    historyLimit: 100,
    algorithm: "sliding-window",
  });
  const leakyBucket = useRateLimiter({
    pollInterval: 500,
    historyLimit: 100,
    algorithm: "leaky-bucket",
  });

  const [hasProcessed, setHasProcessed] = useState(
    rideState?.skipProcessing ?? false,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(
    rideState?.skipProcessing ? 100 : 0,
  );
  const [requestLog, setRequestLog] = useState<RequestLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [isRaceMode, setIsRaceMode] = useState(false);

  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [isApplyingConfig, setIsApplyingConfig] = useState(false);
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>("token-bucket");
  const [configDraft, setConfigDraft] = useState<DashboardConfigDraft>(
    DEFAULT_DASHBOARD_CONFIG_DRAFT,
  );
  const [activeSimulationParams, setActiveSimulationParams] =
    useState<SimulationParams>(
      toSimulationParams(DEFAULT_DASHBOARD_CONFIG_DRAFT),
    );
  const [predictionVisible, setPredictionVisible] = useState(true);

  const processedRef = useRef(rideState?.skipProcessing ?? false);
  const processingRef = useRef(false);
  const draftInitializedRef = useRef(false);
  const firstRunRef = useRef(!rideState?.skipProcessing);

  const simulation = useDeterministicSimulation({
    requestCount: rideState?.rideCount ?? 0,
    params: activeSimulationParams,
    initialMode: "random",
    autoPlay: false,
  });

  const buildDraftFromLiveStats = useCallback(
    (fallback: DashboardConfigDraft): DashboardConfigDraft => ({
      ...fallback,
      tb_capacity: tokenBucket.bucketStats?.capacity ?? fallback.tb_capacity,
      tb_refillRate:
        tokenBucket.bucketStats?.refillRate ?? fallback.tb_refillRate,
      sw_maxRequests:
        slidingWindow.bucketStats?.capacity ?? fallback.sw_maxRequests,
      sw_windowSize:
        slidingWindow.bucketStats?.windowSize ?? fallback.sw_windowSize,
      lb_capacity: leakyBucket.bucketStats?.capacity ?? fallback.lb_capacity,
      lb_leakRate:
        leakyBucket.bucketStats?.leakRate ??
        leakyBucket.bucketStats?.refillRate ??
        fallback.lb_leakRate,
    }),
    [
      tokenBucket.bucketStats,
      slidingWindow.bucketStats,
      leakyBucket.bucketStats,
    ],
  );

  const syncDraftFromLive = useCallback(() => {
    setConfigDraft((previous) => buildDraftFromLiveStats(previous));
  }, [buildDraftFromLiveStats]);

  const handleToggleToolbox = useCallback(() => {
    setToolboxOpen((previous) => {
      const next = !previous;
      if (next) {
        setConfigDraft((draftPrevious) => buildDraftFromLiveStats(draftPrevious));
      }
      return next;
    });
  }, [buildDraftFromLiveStats]);

  useEffect(() => {
    if (draftInitializedRef.current) {
      return;
    }
    if (
      !tokenBucket.bucketStats ||
      !slidingWindow.bucketStats ||
      !leakyBucket.bucketStats
    ) {
      return;
    }

    const nextDraft = buildDraftFromLiveStats(DEFAULT_DASHBOARD_CONFIG_DRAFT);
    setConfigDraft(nextDraft);
    setActiveSimulationParams(toSimulationParams(nextDraft));
    draftInitializedRef.current = true;
  }, [
    buildDraftFromLiveStats,
    tokenBucket.bucketStats,
    slidingWindow.bucketStats,
    leakyBucket.bucketStats,
  ]);

  useEffect(() => {
    if (!rideState) {
      navigate("/", { replace: true });
    }
  }, [rideState, navigate]);

  const startProcessing = useCallback(async () => {
    if (!rideState || processedRef.current || processingRef.current) {
      return;
    }

    processedRef.current = true;
    processingRef.current = true;
    setIsProcessing(true);
    setHasProcessed(false);
    setShowLog(false);
    setProcessingProgress(0);

    simulation.reset({
      mode: simulation.mode,
      requestCount: rideState.rideCount,
      autoPlay: true,
    });

    try {
      if (firstRunRef.current) {
        await Promise.all([
          updateBucketConfig(
            {
              capacity: DEFAULT_DASHBOARD_CONFIG_DRAFT.tb_capacity,
              refillRate: DEFAULT_DASHBOARD_CONFIG_DRAFT.tb_refillRate,
            },
            "token-bucket"
          ),
          updateBucketConfig(
            {
              maxRequests: DEFAULT_DASHBOARD_CONFIG_DRAFT.sw_maxRequests,
              windowSize: DEFAULT_DASHBOARD_CONFIG_DRAFT.sw_windowSize,
            },
            "sliding-window"
          ),
          updateBucketConfig(
            {
              capacity: DEFAULT_DASHBOARD_CONFIG_DRAFT.lb_capacity,
              leakRate: DEFAULT_DASHBOARD_CONFIG_DRAFT.lb_leakRate,
            },
            "leaky-bucket"
          ),
        ]);
        firstRunRef.current = false;
      }

      await resetAllStats();

      const totalRides = rideState.rideCount;
      const initialLog: RequestLogEntry[] = Array.from(
        { length: totalRides },
        (_, index) => ({
          id: index + 1,
          tbResult: null,
          swResult: null,
          lbResult: null,
          timestamp: 0,
        }),
      );
      setRequestLog(initialLog);

      for (let index = 0; index < totalRides; index += 1) {
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const [tbResponse, swResponse, lbResponse] = await Promise.all([
          sendTestRequest("token-bucket"),
          sendTestRequest("sliding-window"),
          sendTestRequest("leaky-bucket"),
        ]);

        setRequestLog((previous) => {
          const updated = [...previous];
          updated[index] = {
            ...updated[index],
            tbResult: tbResponse.success,
            swResult: swResponse.success,
            lbResult: lbResponse.success,
            timestamp: Date.now(),
          };
          return updated;
        });

        setProcessingProgress(((index + 1) / totalRides) * 100);
      }

      await Promise.all([
        tokenBucket.refresh(),
        slidingWindow.refresh(),
        leakyBucket.refresh(),
      ]);

      setProcessingProgress(100);
      setHasProcessed(true);
      setShowLog(true);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [
    rideState,
    tokenBucket,
    slidingWindow,
    leakyBucket,
    simulation,
  ]);

  useEffect(() => {
    if (rideState) {
      void startProcessing();
    }
  }, [startProcessing, rideState]);

  if (!rideState) {
    return null;
  }

  const tbLastSuccess = tokenBucket.lastResponse
    ? tokenBucket.lastResponse.success
    : null;
  const swLastSuccess = slidingWindow.lastResponse
    ? slidingWindow.lastResponse.success
    : null;
  const lbLastSuccess = leakyBucket.lastResponse
    ? leakyBucket.lastResponse.success
    : null;

  const tbRetryAfter =
    tokenBucket.lastResponse &&
    !tokenBucket.lastResponse.success &&
    "retryAfter" in tokenBucket.lastResponse
      ? tokenBucket.lastResponse.retryAfter
      : undefined;
  const swRetryAfter =
    slidingWindow.lastResponse &&
    !slidingWindow.lastResponse.success &&
    "retryAfter" in slidingWindow.lastResponse
      ? slidingWindow.lastResponse.retryAfter
      : undefined;
  const lbRetryAfter =
    leakyBucket.lastResponse &&
    !leakyBucket.lastResponse.success &&
    "retryAfter" in leakyBucket.lastResponse
      ? leakyBucket.lastResponse.retryAfter
      : undefined;

  const applyToolboxConfig = useCallback(async () => {
    setIsApplyingConfig(true);
    try {
      if (selectedAlgo === "token-bucket") {
        await tokenBucket.updateConfig({
          capacity: configDraft.tb_capacity,
          refillRate: configDraft.tb_refillRate,
        });
      } else if (selectedAlgo === "sliding-window") {
        await slidingWindow.updateConfig({
          maxRequests: configDraft.sw_maxRequests,
          windowSize: configDraft.sw_windowSize,
        });
      } else {
        await leakyBucket.updateConfig({
          capacity: configDraft.lb_capacity,
          leakRate: configDraft.lb_leakRate,
        });
      }

      await Promise.all([
        tokenBucket.refresh(),
        slidingWindow.refresh(),
        leakyBucket.refresh(),
      ]);
      setActiveSimulationParams(toSimulationParams(configDraft));
    } finally {
      setIsApplyingConfig(false);
    }
  }, [
    selectedAlgo,
    configDraft,
    tokenBucket,
    slidingWindow,
    leakyBucket,
  ]);

  const rerunDemo = useCallback(() => {
    processedRef.current = false;
    processingRef.current = false;
    setHasProcessed(false);
    setProcessingProgress(0);
    setShowLog(false);
    setRequestLog([]);
    void startProcessing();
  }, [startProcessing]);

  const handleScenarioSelect = useCallback((scenario: "flash-sale" | "ddos" | "steady") => {
    let newDraft = { ...configDraft };
    let nextMode: SimulationMode = "random";

    if (scenario === "flash-sale") {
      // Flash Sale: Token Bucket absorbs it entirely (high capacity). Leaky Bucket drops it immediately (Queue 1).
      newDraft = { ...newDraft, tb_capacity: 50, tb_refillRate: 1, sw_maxRequests: 20, sw_windowSize: 5000, lb_capacity: 1, lb_leakRate: 5 };
      nextMode = "burst";
    } else if (scenario === "ddos") {
      // DDoS Attack: Extremely tight constraints. Everything drops aggressively.
      newDraft = { ...newDraft, tb_capacity: 2, tb_refillRate: 0.5, sw_maxRequests: 2, sw_windowSize: 10000, lb_capacity: 1, lb_leakRate: 0.5 };
      nextMode = "burst";
    } else {
      // Steady Traffic: High refill/leak rates handle the random steady traffic easily.
      newDraft = { ...newDraft, tb_capacity: 10, tb_refillRate: 5, sw_maxRequests: 20, sw_windowSize: 2000, lb_capacity: 5, lb_leakRate: 5 };
      nextMode = "random";
    }
    
    setConfigDraft(newDraft);
    simulation.setMode(nextMode);
    setIsApplyingConfig(true);
    Promise.all([
      tokenBucket.updateConfig({ capacity: newDraft.tb_capacity, refillRate: newDraft.tb_refillRate }),
      slidingWindow.updateConfig({ maxRequests: newDraft.sw_maxRequests, windowSize: newDraft.sw_windowSize }),
      leakyBucket.updateConfig({ capacity: newDraft.lb_capacity, leakRate: newDraft.lb_leakRate }),
    ]).then(() => {
      return Promise.all([tokenBucket.refresh(), slidingWindow.refresh(), leakyBucket.refresh()]);
    }).then(() => {
      setActiveSimulationParams(toSimulationParams(newDraft));
      setIsApplyingConfig(false);
      rerunDemo();
    });
  }, [configDraft, simulation, tokenBucket, slidingWindow, leakyBucket, rerunDemo]);

  const applyAndRerun = useCallback(() => {
    void (async () => {
      await applyToolboxConfig();
      rerunDemo();
    })();
  }, [applyToolboxConfig, rerunDemo]);

  const handleGoToBilling = () => {
    navigate("/billing", {
      state: {
        ...rideState,
        tb_totalRequests: tokenBucket.requestStats?.total || 0,
        tb_allowedRequests: tokenBucket.requestStats?.allowed || 0,
        tb_blockedRequests: tokenBucket.requestStats?.blocked || 0,
        tb_successRate: tokenBucket.requestStats?.successRate || "0",
        sw_totalRequests: slidingWindow.requestStats?.total || 0,
        sw_allowedRequests: slidingWindow.requestStats?.allowed || 0,
        sw_blockedRequests: slidingWindow.requestStats?.blocked || 0,
        sw_successRate: slidingWindow.requestStats?.successRate || "0",
        lb_totalRequests: leakyBucket.requestStats?.total || 0,
        lb_allowedRequests: leakyBucket.requestStats?.allowed || 0,
        lb_blockedRequests: leakyBucket.requestStats?.blocked || 0,
        lb_successRate: leakyBucket.requestStats?.successRate || "0",
        requestLog,
      },
    });
  };

  const processedCount = requestLog.filter(
    (entry) => entry.tbResult !== null,
  ).length;

  return (
    <div className="page page-dashboard">
      <section className="dash-hero">
        <div className="dash-hero-content">
          <h1 className="dash-title">
            {hasProcessed ? "Processing Complete" : "Processing Requests"}
            {!hasProcessed && <span className="processing-dot">...</span>}
          </h1>
          <p className="dash-subtitle">
            {hasProcessed
              ? "All three algorithms have processed all booking requests"
              : "Running Token Bucket, Sliding Window, and Leaky Bucket in parallel"}
          </p>
        </div>

        <div className="ride-info-badge">
          <div className="ride-info-route">
            <span className="info-pickup">{rideState.pickup}</span>
            <span className="info-arrow">-&gt;</span>
            <span className="info-dropoff">{rideState.dropoff}</span>
          </div>
          <div className="ride-info-meta">
            <span>{rideState.rideCount} people</span>
            <span className="meta-sep">|</span>
            <span>{rideState.distance} km</span>
            <span className="meta-sep">|</span>
            <span>INR {rideState.farePerRide}/ride</span>
          </div>
        </div>
      </section>

      {!hasProcessed && (
        <section className="processing-bar-section">
          <div className="processing-bar">
            <div
              className="processing-fill"
              style={{ width: `${Math.min(processingProgress, 100)}%` }}
            />
          </div>
          <span className="processing-label">
            {processedCount}/{rideState.rideCount} requests sent (
            {Math.round(processingProgress)}%)
          </span>
        </section>
      )}

      {(tokenBucket.error || slidingWindow.error || leakyBucket.error) && (
        <div className="error-banner">
          <span>{tokenBucket.error || slidingWindow.error || leakyBucket.error}</span>
        </div>
      )}

      <section className="simulation-shell card">
        <RequestTimeline
          events={simulation.events}
          activeIndex={simulation.cursorIndex}
          clockMs={simulation.clockMs}
          mode={simulation.mode}
          divergentRequestIds={simulation.divergentRequestIds}
        />

        <SimulationControls
          mode={simulation.mode}
          isPlaying={simulation.isPlaying}
          canStep={!simulation.completed}
          speed={simulation.speed}
          predictionEnabled={predictionVisible}
          onModeChange={simulation.setMode}
          onTogglePlay={simulation.togglePlay}
          onRewind={() => {
            simulation.reset({
              mode: simulation.mode,
              requestCount: rideState.rideCount,
              autoPlay: false,
            });
          }}
          onStep={simulation.stepForward}
          onReset={rerunDemo}
          onBurst={() => simulation.addBurst(6)}
          onSpeedChange={simulation.setSpeed}
          onTogglePrediction={() =>
            setPredictionVisible((previous) => !previous)
          }
        />
      </section>

      <section className="algo-tabs-container">
        <button
          type="button"
          className={`tab-btn ${!isRaceMode && selectedAlgo === "token-bucket" ? "active" : ""}`}
          onClick={() => { setIsRaceMode(false); setSelectedAlgo("token-bucket"); }}
        >
          Token Bucket
        </button>
        <button
          type="button"
          className={`tab-btn ${!isRaceMode && selectedAlgo === "sliding-window" ? "active" : ""}`}
          onClick={() => { setIsRaceMode(false); setSelectedAlgo("sliding-window"); }}
        >
          Sliding Window
        </button>
        <button
          type="button"
          className={`tab-btn ${!isRaceMode && selectedAlgo === "leaky-bucket" ? "active" : ""}`}
          onClick={() => { setIsRaceMode(false); setSelectedAlgo("leaky-bucket"); }}
        >
          Leaky Bucket
        </button>
        <div style={{ width: '2px', background: 'var(--color-border)', margin: '0 8px', borderRadius: '2px' }} />
        <button
          type="button"
          className={`tab-btn ${isRaceMode ? "active" : ""}`}
          onClick={() => setIsRaceMode(true)}
          title="Watch all three algorithms react simultaneously"
        >
          🏁 Race Mode
        </button>
      </section>

      {isRaceMode ? (
        <section className="race-mode-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', margin: '0 auto', maxWidth: '1200px' }}>
          <div className="card">
            <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Token Bucket</h3>
            <BucketView current={hasProcessed && simulation.currentStep ? simulation.currentStep.tokenBucket.tokens : (tokenBucket.bucketStats?.tokens ?? 0)} capacity={activeSimulationParams.tokenBucket.capacity} refillRate={activeSimulationParams.tokenBucket.refillRate} algorithm="token-bucket" lastRequestSuccess={hasProcessed ? simulation.currentStep?.tokenBucket.accepted ?? null : tbLastSuccess} />
          </div>
          <div className="card">
            <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Sliding Window</h3>
            <WindowView currentCount={hasProcessed && simulation.currentStep ? simulation.currentStep.slidingWindow.count : (slidingWindow.bucketStats?.currentCount ?? 0)} maxRequests={activeSimulationParams.slidingWindow.maxRequests} windowSize={activeSimulationParams.slidingWindow.windowSize} lastRequestSuccess={hasProcessed ? simulation.currentStep?.slidingWindow.accepted ?? null : swLastSuccess} />
          </div>
          <div className="card">
            <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Leaky Bucket</h3>
            <LeakyBucketView currentLevel={hasProcessed && simulation.currentStep ? simulation.currentStep.leakyBucket.queueSize : (leakyBucket.bucketStats?.currentLevel ?? 0)} capacity={activeSimulationParams.leakyBucket.capacity} leakRate={activeSimulationParams.leakyBucket.leakRate} lastRequestSuccess={hasProcessed ? simulation.currentStep?.leakyBucket.accepted ?? null : lbLastSuccess} />
          </div>
        </section>
      ) : (
        <section className="workbench-layout single-algo-layout">
        <aside className="code-rail">
          <AlgorithmCodeCard
            algorithm={selectedAlgo}
            step={simulation.currentStep}
            prediction={
              predictionVisible
                ? selectedAlgo === "token-bucket"
                  ? simulation.prediction?.tokenBucket ?? null
                  : selectedAlgo === "sliding-window"
                    ? simulation.prediction?.slidingWindow ?? null
                    : simulation.prediction?.leakyBucket ?? null
                : null
            }
          />
        </aside>

        <section className="algo-comparison single-panel">
          <AlgorithmPanel
            algorithm={selectedAlgo}
            requestStats={
              hasProcessed
                ? getSimulatedRequestStats(selectedAlgo, simulation.steps.slice(0, simulation.cursorIndex))
                : selectedAlgo === "token-bucket"
                ? tokenBucket.requestStats
                : selectedAlgo === "sliding-window"
                ? slidingWindow.requestStats
                : leakyBucket.requestStats
            }
            bucketStats={
              hasProcessed
                ? getSimulatedBucketStats(selectedAlgo, simulation.steps, simulation.cursorIndex, activeSimulationParams)
                : selectedAlgo === "token-bucket"
                ? tokenBucket.bucketStats
                : selectedAlgo === "sliding-window"
                ? slidingWindow.bucketStats
                : leakyBucket.bucketStats
            }
            lastRequestSuccess={
              hasProcessed
                ? (selectedAlgo === "token-bucket"
                  ? simulation.currentStep?.tokenBucket.accepted
                  : selectedAlgo === "sliding-window"
                  ? simulation.currentStep?.slidingWindow.accepted
                  : simulation.currentStep?.leakyBucket.accepted) ?? null
                : selectedAlgo === "token-bucket"
                ? tbLastSuccess
                : selectedAlgo === "sliding-window"
                ? swLastSuccess
                : lbLastSuccess
            }
            retryAfter={
              hasProcessed
                ? undefined
                : selectedAlgo === "token-bucket"
                ? tbRetryAfter
                : selectedAlgo === "sliding-window"
                ? swRetryAfter
                : lbRetryAfter
            }
            simulationStep={simulation.currentStep}
          />
        </section>

        <aside className="code-rail code-rail-right">
          {predictionVisible && simulation.prediction && (
            <section className="prediction-card card">
              <h3>Prediction Mode</h3>
              <p className="prediction-subtitle">
                Next request #{simulation.prediction.request.id} at t=
                {(simulation.prediction.request.time / 1000).toFixed(2)}s
              </p>

              <div className="prediction-grid">
                <span>Token Bucket</span>
                <span
                  className={
                    simulation.prediction.tokenBucket.accepted
                      ? "prediction-accept"
                      : "prediction-reject"
                  }
                >
                  {simulation.prediction.tokenBucket.accepted
                    ? "Accept"
                    : "Reject"}
                </span>

                <span>Sliding Window</span>
                <span
                  className={
                    simulation.prediction.slidingWindow.accepted
                      ? "prediction-accept"
                      : "prediction-reject"
                  }
                >
                  {simulation.prediction.slidingWindow.accepted
                    ? "Accept"
                    : "Reject"}
                </span>

                <span>Leaky Bucket</span>
                <span
                  className={
                    simulation.prediction.leakyBucket.accepted
                      ? "prediction-accept"
                      : "prediction-reject"
                  }
                >
                  {simulation.prediction.leakyBucket.accepted
                    ? "Accept"
                    : "Reject"}
                </span>
              </div>

              {simulation.prediction.isDecisionDifferent && (
                <p className="prediction-alert">
                  Algorithms are expected to diverge on the next request.
                </p>
              )}
            </section>
          )}
        </aside>
      </section>
      )}

      {hasProcessed &&
        tokenBucket.requestStats &&
        slidingWindow.requestStats &&
        leakyBucket.requestStats && (
          <section className="comparison-results card">
            <h2>Comparison Results</h2>
            <div className="comparison-table">
              <div className="comparison-header">
                <span>Metric</span>
                <span>Token Bucket</span>
                <span>Sliding Window</span>
                <span>Leaky Bucket</span>
              </div>
              <div className="comparison-row">
                <span>Bookings Confirmed</span>
                <span className="stat-success">{tokenBucket.requestStats.allowed}</span>
                <span className="stat-success">{slidingWindow.requestStats.allowed}</span>
                <span className="stat-success">{leakyBucket.requestStats.allowed}</span>
              </div>
              <div className="comparison-row">
                <span>Bookings Rejected</span>
                <span className="stat-danger">{tokenBucket.requestStats.blocked}</span>
                <span className="stat-danger">{slidingWindow.requestStats.blocked}</span>
                <span className="stat-danger">{leakyBucket.requestStats.blocked}</span>
              </div>
              <div className="comparison-row">
                <span>Success Rate</span>
                <span>{tokenBucket.requestStats.successRate}%</span>
                <span>{slidingWindow.requestStats.successRate}%</span>
                <span>{leakyBucket.requestStats.successRate}%</span>
              </div>
              <div className="comparison-row">
                <span>Fare Charged</span>
                <span>INR {tokenBucket.requestStats.allowed * rideState.farePerRide}</span>
                <span>
                  INR {slidingWindow.requestStats.allowed * rideState.farePerRide}
                </span>
                <span>INR {leakyBucket.requestStats.allowed * rideState.farePerRide}</span>
              </div>
            </div>
          </section>
        )}

      {requestLog.length > 0 && (
        <section className="request-log-section">
          <div className="request-log-header">
            <h2>Request Log</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowLog(!showLog)}
            >
              {showLog ? "Hide Log" : "Show All Requests"}
            </button>
          </div>

          {showLog && (
            <div className="request-log card">
              <div className="request-log-table">
                <div className="request-log-thead">
                  <span className="log-col-id">#</span>
                  <span className="log-col-tb">Token Bucket</span>
                  <span className="log-col-sw">Sliding Window</span>
                  <span className="log-col-lb">Leaky Bucket</span>
                  <span className="log-col-match">Match</span>
                </div>
                <div className="request-log-body">
                  {requestLog.map((entry) => {
                    const isPending = entry.tbResult === null;
                    const isMatch =
                      entry.tbResult === entry.swResult &&
                      entry.swResult === entry.lbResult;

                    return (
                      <div
                        key={entry.id}
                        className={`request-log-row ${isPending ? "log-row-pending" : ""}`}
                      >
                        <span className="log-col-id log-id">{entry.id}</span>
                        <span className="log-col-tb">
                          {isPending ? (
                            <span className="log-pending">...</span>
                          ) : entry.tbResult ? (
                            <span className="log-accepted">Accepted</span>
                          ) : (
                            <span className="log-rejected">Rejected</span>
                          )}
                        </span>
                        <span className="log-col-sw">
                          {isPending ? (
                            <span className="log-pending">...</span>
                          ) : entry.swResult ? (
                            <span className="log-accepted">Accepted</span>
                          ) : (
                            <span className="log-rejected">Rejected</span>
                          )}
                        </span>
                        <span className="log-col-lb">
                          {isPending ? (
                            <span className="log-pending">...</span>
                          ) : entry.lbResult ? (
                            <span className="log-accepted">Accepted</span>
                          ) : (
                            <span className="log-rejected">Rejected</span>
                          )}
                        </span>
                        <span className="log-col-match">
                          {isPending ? (
                            ""
                          ) : isMatch ? (
                            <span className="log-match-same">Same</span>
                          ) : (
                            <span className="log-match-diff">Different</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="dash-actions">
        {hasProcessed ? (
          <>
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={handleGoToBilling}
            >
              View Billing Comparison
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/")}
            >
              Back to Booking
            </button>
          </>
        ) : (
          <div className="processing-status">
            <div className="spinner" />
            <span>
              {isProcessing
                ? `Processing ${rideState.rideCount} booking request${rideState.rideCount > 1 ? "s" : ""} through three algorithms...`
                : "Preparing processing run..."}
            </span>
          </div>
        )}
      </section>

      <AlgorithmToolbox
        isOpen={toolboxOpen}
        selectedAlgo={selectedAlgo}
        draft={configDraft}
        isApplying={isApplyingConfig}
        onToggleOpen={handleToggleToolbox}
        onClose={() => setToolboxOpen(false)}
        onDraftChange={(key, value) => {
          setConfigDraft((previous) => ({
            ...previous,
            [key]: value,
          }));
        }}
        onApply={() => {
          void applyToolboxConfig();
        }}
        onApplyAndRerun={applyAndRerun}
        onRerun={rerunDemo}
        onSyncFromLive={syncDraftFromLive}
        onScenarioSelect={handleScenarioSelect}
      />
    </div>
  );
}
