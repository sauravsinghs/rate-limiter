/**
 * StatsPanel Component
 * Live statistics display for the rate limiter
 */

export interface StatsPanelProps {
  total: number;
  allowed: number;
  blocked: number;
  successRate: string;
  lastRequestSuccess: boolean | null;
  retryAfter?: number;
}

export function StatsPanel({
  total,
  allowed,
  blocked,
  successRate,
  lastRequestSuccess,
  retryAfter,
}: StatsPanelProps) {
  // Parse success rate percentage for color coding
  const successRateNum = parseFloat(successRate) || 0;
  const getSuccessRateColor = () => {
    if (successRateNum >= 80) return "success";
    if (successRateNum >= 50) return "warning";
    return "danger";
  };

  return (
    <div className="stats-panel">
      {/* Success Rate - Featured */}
      <div className="stat-card stat-featured">
        <div className="stat-label">Success Rate</div>
        <div className={`stat-value stat-${getSuccessRateColor()}`}>
          {successRate}
        </div>
        <div className="stat-bar">
          <div
            className={`stat-bar-fill stat-bar-${getSuccessRateColor()}`}
            style={{ width: successRate }}
          />
        </div>
      </div>

      {/* Request Counts */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Allowed</div>
          <div className="stat-value stat-success">{allowed}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Blocked</div>
          <div className="stat-value stat-danger">{blocked}</div>
        </div>
      </div>

      {/* Last Request Status */}
      <div className="last-request">
        <div className="stat-label">Last Request</div>
        {lastRequestSuccess === null ? (
          <div className="status-indicator status-idle">
            <span className="status-dot" />
            No requests yet
          </div>
        ) : lastRequestSuccess ? (
          <div className="status-indicator status-success">
            <span className="status-dot" />
            Allowed
          </div>
        ) : (
          <div className="status-indicator status-blocked">
            <span className="status-dot" />
            Blocked
            {retryAfter !== undefined && retryAfter > 0 && (
              <span className="retry-info">
                (retry in {retryAfter.toFixed(1)}s)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPanel;
