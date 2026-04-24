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
import { useRateLimiter } from "../hooks/useRateLimiter";
import { useDeterministicSimulation } from "../hooks/useDeterministicSimulation";
import {
  resetAllStats,
  sendTestRequest,
  type Algorithm,
} from "../services/api";
import type { SimulationParams } from "../engine/types";

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
          onStep={simulation.stepForward}
          onReset={() =>
            simulation.reset({
              mode: simulation.mode,
              requestCount: rideState.rideCount,
              autoPlay: false,
            })
          }
          onBurst={() => simulation.addBurst(6)}
          onSpeedChange={simulation.setSpeed}
          onTogglePrediction={() =>
            setPredictionVisible((previous) => !previous)
          }
        />
      </section>

      <section className="workbench-layout">
        <aside className="code-rail code-rail-left">
          <AlgorithmCodeCard
            algorithm="token-bucket"
            step={simulation.currentStep}
            prediction={
              predictionVisible ? simulation.prediction?.tokenBucket ?? null : null
            }
          />
          <AlgorithmCodeCard
            algorithm="sliding-window"
            step={simulation.currentStep}
            prediction={
              predictionVisible
                ? simulation.prediction?.slidingWindow ?? null
                : null
            }
          />
        </aside>

        <section className="algo-comparison">
          <AlgorithmPanel
            algorithm="token-bucket"
            requestStats={tokenBucket.requestStats}
            bucketStats={tokenBucket.bucketStats}
            lastRequestSuccess={tbLastSuccess}
            retryAfter={tbRetryAfter}
            simulationStep={simulation.currentStep}
          />

          <AlgorithmPanel
            algorithm="sliding-window"
            requestStats={slidingWindow.requestStats}
            bucketStats={slidingWindow.bucketStats}
            lastRequestSuccess={swLastSuccess}
            retryAfter={swRetryAfter}
            simulationStep={simulation.currentStep}
          />

          <AlgorithmPanel
            algorithm="leaky-bucket"
            requestStats={leakyBucket.requestStats}
            bucketStats={leakyBucket.bucketStats}
            lastRequestSuccess={lbLastSuccess}
            retryAfter={lbRetryAfter}
            simulationStep={simulation.currentStep}
          />
        </section>

        <aside className="code-rail code-rail-right">
          <AlgorithmCodeCard
            algorithm="leaky-bucket"
            step={simulation.currentStep}
            prediction={
              predictionVisible ? simulation.prediction?.leakyBucket ?? null : null
            }
          />

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
        onSelectAlgo={setSelectedAlgo}
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
      />
    </div>
  );
}
