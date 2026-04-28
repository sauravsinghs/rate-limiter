/**
 * StatsPanel Component
 * Live statistics display for the rate limiter
 */

export interface StatsPanelProps {
  total: number;
  allowed: number;
  blocked: number;
  successRate: string;
  lastRequestSuccess?: boolean | null;
  retryAfter?: number;
}

export function StatsPanel({
  total,
  allowed,
  blocked,
  successRate,
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
        <div className="stat-label">Overall Success Rate</div>
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
    </div>
  );
}

export default StatsPanel;
