import type { Algorithm } from "../../services/api";
import type {
  AlgorithmPrediction,
  LeakyBucketStepState,
  SimulationStep,
  SlidingWindowStepState,
  TokenBucketStepState,
} from "../../engine/types";
import { ALGORITHM_LABELS } from "./algorithmMeta";

interface CodeTemplate {
  idle: string[];
  allow: string[];
  block: string[];
  allowHighlight: number[];
  blockHighlight: number[];
}

interface AlgorithmCodeCardProps {
  algorithm: Algorithm;
  step: SimulationStep | null;
  prediction: AlgorithmPrediction | null;
}

const CODE_TEMPLATES: Record<Algorithm, CodeTemplate> = {
  "token-bucket": {
    idle: [
      "refillByElapsedTime()",
      "if tokens >= 1:",
      "  tokens -= 1",
      "  accept(request)",
      "else:",
      "  reject(429, retryAfter)",
    ],
    allow: [
      "tokens = min(capacity, tokens + elapsed * refillRate)",
      "if tokens >= 1:",
      "  tokens -= 1",
      "  decision = ACCEPT",
      "emit(tokens, decision)",
    ],
    block: [
      "tokens = min(capacity, tokens + elapsed * refillRate)",
      "if tokens < 1:",
      "  retryAfter = (1 - tokens) / refillRate",
      "  decision = REJECT",
      "emit(tokens, decision)",
    ],
    allowHighlight: [1, 2, 3],
    blockHighlight: [1, 2, 3],
  },
  "sliding-window": {
    idle: [
      "pruneRequestsOlderThan(now - windowSize)",
      "if activeCount < maxRequests:",
      "  push(now)",
      "  accept(request)",
      "else:",
      "  reject(429, retryAfter)",
    ],
    allow: [
      "active = filter(ts > now - windowSize)",
      "if active.length < maxRequests:",
      "  active.push(now)",
      "  decision = ACCEPT",
      "emit(active.length, decision)",
    ],
    block: [
      "active = filter(ts > now - windowSize)",
      "if active.length >= maxRequests:",
      "  retryAfter = oldest + windowSize - now",
      "  decision = REJECT",
      "emit(active.length, decision)",
    ],
    allowHighlight: [1, 2, 3],
    blockHighlight: [1, 2, 3],
  },
  "leaky-bucket": {
    idle: [
      "queue = max(0, queue - elapsed * leakRate)",
      "if queue + 1 <= capacity:",
      "  queue += 1",
      "  accept(request)",
      "else:",
      "  reject(429, retryAfter)",
    ],
    allow: [
      "queue = max(0, queue - elapsed * leakRate)",
      "if queue + 1 <= capacity:",
      "  queue += 1",
      "  decision = ACCEPT",
      "emit(queue, decision)",
    ],
    block: [
      "queue = max(0, queue - elapsed * leakRate)",
      "if queue + 1 > capacity:",
      "  retryAfter = (queue + 1 - capacity) / leakRate",
      "  decision = REJECT",
      "emit(queue, decision)",
    ],
    allowHighlight: [1, 2, 3],
    blockHighlight: [1, 2, 3],
  },
};

function getSnapshot(
  algorithm: Algorithm,
  step: SimulationStep,
): TokenBucketStepState | SlidingWindowStepState | LeakyBucketStepState {
  if (algorithm === "token-bucket") {
    return step.tokenBucket;
  }
  if (algorithm === "sliding-window") {
    return step.slidingWindow;
  }
  return step.leakyBucket;
}

function getSnapshotCaption(
  algorithm: Algorithm,
  snapshot: TokenBucketStepState | SlidingWindowStepState | LeakyBucketStepState,
): string {
  if (algorithm === "token-bucket") {
    const tokenSnapshot = snapshot as TokenBucketStepState;
    return `tokens=${tokenSnapshot.tokens.toFixed(2)}, refill=${tokenSnapshot.refillRate}/s`;
  }
  if (algorithm === "sliding-window") {
    const windowSnapshot = snapshot as SlidingWindowStepState;
    return `window=${windowSnapshot.count}/${windowSnapshot.maxRequests} in ${windowSnapshot.windowSize}ms`;
  }
  const leakySnapshot = snapshot as LeakyBucketStepState;
  return `queue=${leakySnapshot.queueSize.toFixed(2)}/${leakySnapshot.capacity}, leak=${leakySnapshot.leakRate}/s`;
}

function getDebugTrace(algorithm: Algorithm, step: SimulationStep) {
  if (algorithm === "token-bucket") {
    const s = step.tokenBucket;
    return (
      <>
        <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> <code>tokens = min({s.capacity}, tokens + elapsed * {s.refillRate})</code></div>
        <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> <code>tokens ({s.tokens.toFixed(2)}) &gt;= 1</code> &rarr; <strong>{s.accepted ? "TRUE" : "FALSE"}</strong></div>
        <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Decision: <span className={s.accepted ? "trace-allow" : "trace-block"}>{s.accepted ? "ACCEPT" : "REJECT"}</span></div>
        {!s.accepted && <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Retry after: <strong>{s.retryAfter.toFixed(2)}s</strong></div>}
      </>
    );
  }
  if (algorithm === "sliding-window") {
    const s = step.slidingWindow;
    return (
      <>
        <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Pruning window... Active count = <strong>{s.count}</strong></div>
        <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> <code>activeCount ({s.count}) &lt; maxRequests ({s.maxRequests})</code> &rarr; <strong>{s.accepted ? "TRUE" : "FALSE"}</strong></div>
        <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Decision: <span className={s.accepted ? "trace-allow" : "trace-block"}>{s.accepted ? "ACCEPT" : "REJECT"}</span></div>
        {!s.accepted && <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Retry after: <strong>{s.retryAfter.toFixed(2)}s</strong></div>}
      </>
    );
  }
  const s = step.leakyBucket;
  return (
    <>
      <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> <code>queue = max(0, queue - elapsed * {s.leakRate})</code></div>
      <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> <code>queue ({s.queueSize.toFixed(2)}) + 1 &lt;= capacity ({s.capacity})</code> &rarr; <strong>{s.accepted ? "TRUE" : "FALSE"}</strong></div>
      <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Decision: <span className={s.accepted ? "trace-allow" : "trace-block"}>{s.accepted ? "ACCEPT" : "REJECT"}</span></div>
      {!s.accepted && <div className="trace-line"><span className="trace-prefix">[DEBUG]</span> Retry after: <strong>{s.retryAfter.toFixed(2)}s</strong></div>}
    </>
  );
}

export default function AlgorithmCodeCard({
  algorithm,
  step,
  prediction,
}: AlgorithmCodeCardProps) {
  const template = CODE_TEMPLATES[algorithm];

  const snapshot = step ? getSnapshot(algorithm, step) : null;
  const accepted = snapshot ? snapshot.accepted : null;

  const lines = accepted === null ? template.idle : accepted ? template.allow : template.block;
  const highlight = accepted === null
    ? []
    : accepted
      ? template.allowHighlight
      : template.blockHighlight;

  const statusLabel = accepted === null ? "Waiting" : accepted ? "Accepted" : "Rejected";

  return (
    <article className={`algo-code-card card ${accepted === null ? "code-idle" : accepted ? "code-allow" : "code-block"}`} data-tutorial="code-card">
      <header className="algo-code-head">
        <h3>{ALGORITHM_LABELS[algorithm]}</h3>
        <span className="algo-code-status">{statusLabel}</span>
      </header>

      <p className="algo-code-caption">
        {snapshot
          ? getSnapshotCaption(algorithm, snapshot)
          : "Next request will animate execution path."}
      </p>

      <div className="algo-code-frame" role="presentation">
        {lines.map((line, index) => (
          <div
            key={`${algorithm}-line-${index}`}
            className={`algo-code-line ${highlight.includes(index) ? "is-hot" : ""}`}
          >
            <span className="algo-code-lineno">{index + 1}</span>
            <span className="algo-code-text">{line}</span>
          </div>
        ))}
      </div>

      {prediction && (
        <p className="algo-code-predict" data-tutorial="code-prediction">
          Next: {prediction.accepted ? "likely accept" : "likely reject"} because {prediction.reason}.
        </p>
      )}

      {step && (
        <div className="algo-code-trace">
          <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Execution Trace</h4>
          <div className="trace-content" style={{ background: "rgba(0, 0, 0, 0.2)", padding: "12px", borderRadius: "4px", fontSize: "0.85rem", borderLeft: `3px solid ${accepted ? "var(--color-success)" : "var(--color-error)"}` }}>
            {getDebugTrace(algorithm, step)}
          </div>
        </div>
      )}
    </article>
  );
}
