/**
 * LeakyBucketView — Visualizes queue fill and constant leak/drain behavior.
 */

interface LeakyBucketViewProps {
  currentLevel: number;
  capacity: number;
  leakRate: number;
  lastRequestSuccess: boolean | null;
}

export default function LeakyBucketView({
  currentLevel,
  capacity,
  leakRate,
  lastRequestSuccess,
}: LeakyBucketViewProps) {
  const safeCapacity = Math.max(1, capacity);
  const fillPercent = Math.min((currentLevel / safeCapacity) * 100, 100);
  const isHigh = currentLevel >= safeCapacity * 0.8;

  return (
    <div className="leaky-view">
      <div className="leaky-info">
        <div className="leaky-info-item">
          <span className="leaky-info-label">Queue Level</span>
          <span className={`leaky-info-value ${isHigh ? "leaky-high" : ""}`}>
            {currentLevel}/{capacity}
          </span>
        </div>
        <div className="leaky-info-item">
          <span className="leaky-info-label">Leak Rate</span>
          <span className="leaky-info-value">{leakRate}/s</span>
        </div>
        <div className="leaky-info-item">
          <span className="leaky-info-label">Output</span>
          <span className="leaky-info-value leaky-output-constant">Constant</span>
        </div>
      </div>

      <div className="leaky-bucket-shell">
        <div className="leaky-bucket-inner">
          <div className="leaky-water" style={{ height: `${fillPercent}%` }}>
            <div className="leaky-wave" />
          </div>
          <div className="leaky-level-markers">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="leaky-marker" />
            ))}
          </div>
        </div>
        <div className="leaky-spout" />
        <div className="leaky-drip" />
      </div>

      {lastRequestSuccess !== null && (
        <div className={`leaky-last-request ${lastRequestSuccess ? "request-allowed" : "request-blocked"}`}>
          <span className="request-dot" />
          <span>
            {lastRequestSuccess
              ? "Request accepted into queue"
              : "Queue overflow: request dropped"}
          </span>
        </div>
      )}
    </div>
  );
}
