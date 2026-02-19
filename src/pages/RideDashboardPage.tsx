/**
 * RideDashboardPage — Page 2
 * Dual algorithm comparison: Token Bucket vs Sliding Window
 * Both process the same requests in parallel, displayed side-by-side
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BucketView from "../components/BucketView";
import WindowView from "../components/WindowView";
import RequestChart from "../components/RequestChart";
import StatsPanel from "../components/StatsPanel";
import { useRateLimiter } from "../hooks/useRateLimiter";
import { resetAllStats } from "../services/api";

interface RideState {
    pickup: string;
    dropoff: string;
    rideCount: number;
    farePerRide: number;
    distance: string;
    skipProcessing?: boolean;
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
        const progressTimer = setInterval(() => {
            setProcessingProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressTimer);
                    return 100;
                }
                return prev + 100 / (totalRides * 2);
            });
        }, 50);

        // Fire both algorithms in parallel on the same count
        await Promise.all([
            tokenBucket.sendBurst(totalRides, 200),
            slidingWindow.sendBurst(totalRides, 200),
        ]);

        clearInterval(progressTimer);
        setProcessingProgress(100);

        setTimeout(() => {
            setHasProcessed(true);
        }, 500);
    }, [rideState, tokenBucket.sendBurst, slidingWindow.sendBurst]);

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
                // Token Bucket results
                tb_totalRequests: tokenBucket.requestStats?.total || 0,
                tb_allowedRequests: tokenBucket.requestStats?.allowed || 0,
                tb_blockedRequests: tokenBucket.requestStats?.blocked || 0,
                tb_successRate: tokenBucket.requestStats?.successRate || "0",
                // Sliding Window results
                sw_totalRequests: slidingWindow.requestStats?.total || 0,
                sw_allowedRequests: slidingWindow.requestStats?.allowed || 0,
                sw_blockedRequests: slidingWindow.requestStats?.blocked || 0,
                sw_successRate: slidingWindow.requestStats?.successRate || "0",
            },
        });
    };

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
                        {Math.round(processingProgress)}% complete
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
                </div>

                {/* Sliding Window Panel */}
                <div className="algo-panel">
                    <div className="algo-panel-header">
                        <h2 className="algo-panel-title">Sliding Window</h2>
                        <span className="algo-badge algo-badge-sw">Algorithm 2</span>
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
