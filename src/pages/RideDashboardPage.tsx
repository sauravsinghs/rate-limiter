/**
 * RideDashboardPage — Page 2
 * Dual algorithm comparison: Token Bucket vs Sliding Window
 * Both process the same requests in parallel, displayed side-by-side
 * Includes full request log showing every request result
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BucketView from "../components/BucketView";
import WindowView from "../components/WindowView";
import RequestChart from "../components/RequestChart";
import StatsPanel from "../components/StatsPanel";
import { useRateLimiter } from "../hooks/useRateLimiter";
import { resetAllStats, sendTestRequest } from "../services/api";

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
    tbResult: boolean | null;  // null = pending
    swResult: boolean | null;
    timestamp: number;
}

export default function RideDashboardPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const rideState = location.state as RideState | null;

    // Two independent hooks — one for each algorithm
    const tokenBucket = useRateLimiter({ pollInterval: 500, historyLimit: 100, algorithm: 'token-bucket' });
    const slidingWindow = useRateLimiter({ pollInterval: 500, historyLimit: 100, algorithm: 'sliding-window' });

    const [hasProcessed, setHasProcessed] = useState(rideState?.skipProcessing ?? false);
    const [processingProgress, setProcessingProgress] = useState(rideState?.skipProcessing ? 100 : 0);
    const [requestLog, setRequestLog] = useState<RequestLogEntry[]>([]);
    const [showLog, setShowLog] = useState(false);
    const processedRef = useRef(rideState?.skipProcessing ?? false);

    // Redirect if no ride state
    useEffect(() => {
        if (!rideState) {
            navigate("/", { replace: true });
        }
    }, [rideState, navigate]);

    // Auto-start processing on mount — both algorithms in parallel
    const startProcessing = useCallback(async () => {
        if (!rideState || processedRef.current) return;
        processedRef.current = true;

        // Reset both algorithms
        await resetAllStats();

        const totalRides = rideState.rideCount;

        // Initialize log entries
        const initialLog: RequestLogEntry[] = Array.from({ length: totalRides }, (_, i) => ({
            id: i + 1,
            tbResult: null,
            swResult: null,
            timestamp: 0,
        }));
        setRequestLog(initialLog);

        // Send requests one by one, updating both algorithms in parallel per request
        for (let i = 0; i < totalRides; i++) {
            if (i > 0) {
                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            // Send to both algorithms simultaneously
            const [tbResponse, swResponse] = await Promise.all([
                sendTestRequest('token-bucket'),
                sendTestRequest('sliding-window'),
            ]);

            // Update log entry
            setRequestLog((prev) => {
                const updated = [...prev];
                updated[i] = {
                    ...updated[i],
                    tbResult: tbResponse.success,
                    swResult: swResponse.success,
                    timestamp: Date.now(),
                };
                return updated;
            });

            setProcessingProgress(((i + 1) / totalRides) * 100);
        }

        // Refresh stats for both
        await Promise.all([tokenBucket.refresh(), slidingWindow.refresh()]);

        setProcessingProgress(100);
        setTimeout(() => {
            setHasProcessed(true);
            setShowLog(true);
        }, 500);
    }, [rideState, tokenBucket.refresh, slidingWindow.refresh]);

    useEffect(() => {
        if (rideState) {
            startProcessing();
        }
    }, [startProcessing, rideState]);

    if (!rideState) return null;

    const tbLastSuccess = tokenBucket.lastResponse ? tokenBucket.lastResponse.success : null;
    const swLastSuccess = slidingWindow.lastResponse ? slidingWindow.lastResponse.success : null;

    const tbRetryAfter =
        tokenBucket.lastResponse && !tokenBucket.lastResponse.success && "retryAfter" in tokenBucket.lastResponse
            ? tokenBucket.lastResponse.retryAfter
            : undefined;
    const swRetryAfter =
        slidingWindow.lastResponse && !slidingWindow.lastResponse.success && "retryAfter" in slidingWindow.lastResponse
            ? slidingWindow.lastResponse.retryAfter
            : undefined;

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
                requestLog,
            },
        });
    };

    // Count processed entries
    const processedCount = requestLog.filter(e => e.tbResult !== null).length;

    return (
        <div className="page page-dashboard">
            {/* Header */}
            <section className="dash-hero">
                <div className="dash-hero-content">
                    <h1 className="dash-title">
                        {hasProcessed ? "Processing Complete" : "Processing Requests"}
                        {!hasProcessed && <span className="processing-dot">...</span>}
                    </h1>
                    <p className="dash-subtitle">
                        {hasProcessed
                            ? "Both algorithms have processed all booking requests"
                            : "Running Token Bucket and Sliding Window in parallel"}
                    </p>
                </div>

                {/* Ride info badge */}
                <div className="ride-info-badge">
                    <div className="ride-info-route">
                        <span className="info-pickup">{rideState.pickup}</span>
                        <span className="info-arrow">→</span>
                        <span className="info-dropoff">{rideState.dropoff}</span>
                    </div>
                    <div className="ride-info-meta">
                        <span>{rideState.rideCount} people</span>
                        <span className="meta-sep">•</span>
                        <span>{rideState.distance} km</span>
                        <span className="meta-sep">•</span>
                        <span>₹{rideState.farePerRide}/ride</span>
                    </div>
                </div>
            </section>

            {/* Processing Progress Bar */}
            {!hasProcessed && (
                <section className="processing-bar-section">
                    <div className="processing-bar">
                        <div
                            className="processing-fill"
                            style={{ width: `${Math.min(processingProgress, 100)}%` }}
                        />
                    </div>
                    <span className="processing-label">
                        {processedCount}/{rideState.rideCount} requests sent ({Math.round(processingProgress)}%)
                    </span>
                </section>
            )}

            {/* Error Banner */}
            {(tokenBucket.error || slidingWindow.error) && (
                <div className="error-banner">
                    <span>{tokenBucket.error || slidingWindow.error}</span>
                </div>
            )}

            {/* ========== SIDE-BY-SIDE ALGORITHM PANELS ========== */}
            <section className="algo-comparison">
                {/* Token Bucket Panel */}
                <div className="algo-panel">
                    <div className="algo-panel-header">
                        <h2 className="algo-panel-title">Token Bucket</h2>
                        <span className="algo-badge algo-badge-tb">Algorithm 1</span>
                    </div>

                    <div className="card">
                        <h3>Statistics</h3>
                        {tokenBucket.requestStats ? (
                            <StatsPanel
                                total={tokenBucket.requestStats.total}
                                allowed={tokenBucket.requestStats.allowed}
                                blocked={tokenBucket.requestStats.blocked}
                                successRate={tokenBucket.requestStats.successRate}
                                lastRequestSuccess={tbLastSuccess}
                                retryAfter={tbRetryAfter}
                            />
                        ) : (
                            <div className="loading-placeholder">
                                <div className="spinner" />
                                <p>Loading...</p>
                            </div>
                        )}
                    </div>

                    <div className="card card-chart">
                        <h3>Request History</h3>
                        <RequestChart history={tokenBucket.requestStats?.history || []} maxPoints={30} />
                    </div>

                    <div className="card">
                        <h3>Capacity</h3>
                        {tokenBucket.bucketStats ? (
                            <BucketView
                                current={tokenBucket.bucketStats.tokens}
                                capacity={tokenBucket.bucketStats.capacity}
                                refillRate={tokenBucket.bucketStats.refillRate}
                                algorithm="token-bucket"
                                lastRequestSuccess={tbLastSuccess}
                            />
                        ) : (
                            <div className="loading-placeholder">
                                <div className="spinner" />
                                <p>Connecting...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sliding Window Panel */}
                <div className="algo-panel">
                    <div className="algo-panel-header">
                        <h2 className="algo-panel-title">Sliding Window</h2>
                        <span className="algo-badge algo-badge-sw">Algorithm 2</span>
                    </div>

                    <div className="card">
                        <h3>Statistics</h3>
                        {slidingWindow.requestStats ? (
                            <StatsPanel
                                total={slidingWindow.requestStats.total}
                                allowed={slidingWindow.requestStats.allowed}
                                blocked={slidingWindow.requestStats.blocked}
                                successRate={slidingWindow.requestStats.successRate}
                                lastRequestSuccess={swLastSuccess}
                                retryAfter={swRetryAfter}
                            />
                        ) : (
                            <div className="loading-placeholder">
                                <div className="spinner" />
                                <p>Loading...</p>
                            </div>
                        )}
                    </div>

                    <div className="card card-chart">
                        <h3>Request History</h3>
                        <RequestChart history={slidingWindow.requestStats?.history || []} maxPoints={30} />
                    </div>

                    <div className="card">
                        <h3>Window Status</h3>
                        {slidingWindow.bucketStats ? (
                            <WindowView
                                currentCount={slidingWindow.bucketStats.currentCount ?? 0}
                                maxRequests={slidingWindow.bucketStats.capacity}
                                windowSize={slidingWindow.bucketStats.windowSize ?? 10000}
                                lastRequestSuccess={swLastSuccess}
                            />
                        ) : (
                            <div className="loading-placeholder">
                                <div className="spinner" />
                                <p>Connecting...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Combined Results */}
            {hasProcessed && tokenBucket.requestStats && slidingWindow.requestStats && (
                <section className="comparison-results card">
                    <h2>Comparison Results</h2>
                    <div className="comparison-table">
                        <div className="comparison-header">
                            <span>Metric</span>
                            <span>Token Bucket</span>
                            <span>Sliding Window</span>
                        </div>
                        <div className="comparison-row">
                            <span>Bookings Confirmed</span>
                            <span className="stat-success">{tokenBucket.requestStats.allowed}</span>
                            <span className="stat-success">{slidingWindow.requestStats.allowed}</span>
                        </div>
                        <div className="comparison-row">
                            <span>Bookings Rejected</span>
                            <span className="stat-danger">{tokenBucket.requestStats.blocked}</span>
                            <span className="stat-danger">{slidingWindow.requestStats.blocked}</span>
                        </div>
                        <div className="comparison-row">
                            <span>Success Rate</span>
                            <span>{tokenBucket.requestStats.successRate}%</span>
                            <span>{slidingWindow.requestStats.successRate}%</span>
                        </div>
                        <div className="comparison-row">
                            <span>Fare Charged</span>
                            <span>₹{tokenBucket.requestStats.allowed * rideState.farePerRide}</span>
                            <span>₹{slidingWindow.requestStats.allowed * rideState.farePerRide}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* ========== FULL REQUEST LOG ========== */}
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
                                    <span className="log-col-match">Match</span>
                                </div>
                                <div className="request-log-body">
                                    {requestLog.map((entry) => {
                                        const isPending = entry.tbResult === null;
                                        const isMatch = entry.tbResult === entry.swResult;
                                        return (
                                            <div
                                                key={entry.id}
                                                className={`request-log-row ${isPending ? "log-row-pending" : ""}`}
                                            >
                                                <span className="log-col-id log-id">
                                                    {entry.id}
                                                </span>
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
                                                <span className="log-col-match">
                                                    {isPending ? "" : isMatch ? (
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

            {/* Actions */}
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
                            ← Book More Rides
                        </button>
                    </>
                ) : (
                    <div className="processing-status">
                        <div className="spinner" />
                        <span>
                            Processing {rideState.rideCount} booking request
                            {rideState.rideCount > 1 ? "s" : ""} through both algorithms...
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}
