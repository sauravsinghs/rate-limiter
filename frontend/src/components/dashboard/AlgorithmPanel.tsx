import type { SimulationStep } from "../../engine/types";
import type { Algorithm, BucketStats, RequestStats } from "../../services/api";
import BucketView from "../BucketView";
import LeakyBucketView from "../LeakyBucketView";
import RequestChart from "../RequestChart";
import StatsPanel from "../StatsPanel";
import WindowView from "../WindowView";
import { ALGORITHM_BADGE_CLASSES, ALGORITHM_LABELS } from "./algorithmMeta";

interface AlgorithmPanelProps {
  algorithm: Algorithm;
  requestStats: RequestStats | null;
  bucketStats: BucketStats | null;
  lastRequestSuccess: boolean | null;
  retryAfter?: number;
  simulationStep: SimulationStep | null;
  showRequestHistory?: boolean;
  /** When false (e.g. Advanced View), Statistics are shown elsewhere so the panel omits this card. */
  showStatistics?: boolean;
}

function getSimulationSummary(
  algorithm: Algorithm,
  step: SimulationStep | null,
): string {
  if (!step) {
    return "Simulation waiting for first request";
  }

  if (algorithm === "token-bucket") {
    return `${step.tokenBucket.accepted ? "Accepted" : "Rejected"} at t=${(step.time / 1000).toFixed(2)}s with ${step.tokenBucket.tokens.toFixed(2)} tokens`;
  }

  if (algorithm === "sliding-window") {
    return `${step.slidingWindow.accepted ? "Accepted" : "Rejected"} at t=${(step.time / 1000).toFixed(2)}s with ${step.slidingWindow.count}/${step.slidingWindow.maxRequests} in window`;
  }

  return `${step.leakyBucket.accepted ? "Accepted" : "Rejected"} at t=${(step.time / 1000).toFixed(2)}s with queue ${step.leakyBucket.queueSize.toFixed(2)}/${step.leakyBucket.capacity}`;
}

function renderCapacityCard(
  algorithm: Algorithm,
  bucketStats: BucketStats | null,
  lastRequestSuccess: boolean | null,
) {
  if (!bucketStats) {
    return (
      <div className="loading-placeholder">
        <div className="spinner" />
        <p>Connecting...</p>
      </div>
    );
  }

  if (algorithm === "token-bucket") {
    return (
      <BucketView
        current={bucketStats.tokens}
        capacity={bucketStats.capacity}
        refillRate={bucketStats.refillRate}
        algorithm="token-bucket"
        lastRequestSuccess={lastRequestSuccess}
      />
    );
  }

  if (algorithm === "sliding-window") {
    return (
      <WindowView
        currentCount={bucketStats.currentCount ?? 0}
        maxRequests={bucketStats.capacity}
        windowSize={bucketStats.windowSize ?? 1000}
        lastRequestSuccess={lastRequestSuccess}
      />
    );
  }

  return (
    <LeakyBucketView
      currentLevel={
        bucketStats.currentLevel ?? bucketStats.capacity - bucketStats.tokens
      }
      capacity={bucketStats.capacity}
      leakRate={bucketStats.leakRate ?? bucketStats.refillRate}
      lastRequestSuccess={lastRequestSuccess}
    />
  );
}

function getCapacityTitle(algorithm: Algorithm): string {
  if (algorithm === "token-bucket") {
    return "Capacity";
  }
  if (algorithm === "sliding-window") {
    return "Window Status";
  }
  return "Queue Status";
}

export default function AlgorithmPanel({
  algorithm,
  requestStats,
  bucketStats,
  lastRequestSuccess,
  retryAfter,
  simulationStep,
  showRequestHistory = true,
  showStatistics = true,
}: AlgorithmPanelProps) {
  return (
    <div
      className={
        showStatistics ? "algo-panel" : "algo-panel algo-panel--no-stats"
      }
      data-tutorial="algo-panel"
    >
      <div className="algo-panel-header">
        <h2 className="algo-panel-title">{ALGORITHM_LABELS[algorithm]}</h2>
        <span className={`algo-badge ${ALGORITHM_BADGE_CLASSES[algorithm]}`}>
          {ALGORITHM_LABELS[algorithm]}
        </span>
      </div>

      <p className="algo-live-state">
        {getSimulationSummary(algorithm, simulationStep)}
      </p>

      {showStatistics && (
        <div className="card card-stats">
          <h3>Statistics</h3>
          {requestStats ? (
            <StatsPanel
              total={requestStats.total}
              allowed={requestStats.allowed}
              blocked={requestStats.blocked}
              successRate={requestStats.successRate}
              lastRequestSuccess={lastRequestSuccess}
              retryAfter={retryAfter}
            />
          ) : (
            <div className="loading-placeholder">
              <div className="spinner" />
              <p>Loading...</p>
            </div>
          )}
        </div>
      )}

      <div className="card card-capacity" data-tutorial="panel-capacity">
        <h3>{getCapacityTitle(algorithm)}</h3>
        {renderCapacityCard(algorithm, bucketStats, lastRequestSuccess)}
      </div>

      {showRequestHistory && (
        <div className="card card-chart" data-tutorial="panel-history">
          <h3>Request History</h3>
          <RequestChart history={requestStats?.history ?? []} maxPoints={30} />
        </div>
      )}
    </div>
  );
}
