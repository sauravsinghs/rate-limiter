/**
 * WindowView — Sliding Window Counter Visualization
 * Shows a timeline-based view of the rolling window with request density
 */

interface WindowViewProps {
    currentCount: number;
    maxRequests: number;
    windowSize: number;
    lastRequestSuccess: boolean | null;
}

export default function WindowView({
    currentCount,
    maxRequests,
    windowSize,
    lastRequestSuccess,
}: WindowViewProps) {
    const fillPercent = Math.min((currentCount / maxRequests) * 100, 100);
    const isFull = currentCount >= maxRequests;
    const windowSeconds = (windowSize / 1000).toFixed(0);

    return (
        <div className="window-view">
            {/* Window Info */}
            <div className="window-info">
                <div className="window-info-item">
                    <span className="window-info-label">Window</span>
                    <span className="window-info-value">{windowSeconds}s</span>
                </div>
                <div className="window-info-item">
                    <span className="window-info-label">Used</span>
                    <span className={`window-info-value ${isFull ? "window-full" : ""}`}>
                        {currentCount}/{maxRequests}
                    </span>
                </div>
                <div className="window-info-item">
                    <span className="window-info-label">Status</span>
                    <span className={`window-info-value ${isFull ? "window-full" : "window-ok"}`}>
                        {isFull ? "Full" : "Open"}
                    </span>
                </div>
            </div>

            {/* Visual Bar */}
            <div className="window-bar-container">
                <div className="window-bar-bg">
                    <div
                        className={`window-bar-fill ${isFull ? "window-bar-danger" : ""}`}
                        style={{ width: `${fillPercent}%` }}
                    />
                    {/* Slot markers */}
                    <div className="window-slots">
                        {Array.from({ length: maxRequests }, (_, i) => (
                            <div
                                key={i}
                                className={`window-slot ${i < currentCount ? "window-slot-used" : ""} ${i < currentCount && isFull ? "window-slot-full" : ""}`}
                            />
                        ))}
                    </div>
                </div>
                <div className="window-bar-labels">
                    <span>0</span>
                    <span>{Math.floor(maxRequests / 2)}</span>
                    <span>{maxRequests}</span>
                </div>
            </div>

            {/* Last Request Indicator */}
            {lastRequestSuccess !== null && (
                <div
                    className={`window-last-request ${lastRequestSuccess ? "request-allowed" : "request-blocked"}`}
                >
                    <span className="request-dot" />
                    <span>
                        {lastRequestSuccess ? "Request allowed" : "Request rejected (window full)"}
                    </span>
                </div>
            )}
        </div>
    );
}
