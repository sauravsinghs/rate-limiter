/**
 * RideDashboardPage — Page 2
 * Rate limiter dashboard customized for ride booking
 * Auto-sends rideCount requests and shows live result
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BucketView from "../components/BucketView";
import RequestChart from "../components/RequestChart";
import StatsPanel from "../components/StatsPanel";
import { useRateLimiter } from "../hooks/useRateLimiter";

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

    const {
        bucketStats,
        requestStats,
        error,
        lastResponse,
        sendBurst,
        reset,
    } = useRateLimiter({ pollInterval: 500, historyLimit: 100 });

    const [hasProcessed, setHasProcessed] = useState(rideState?.skipProcessing ?? false);
    const [processingProgress, setProcessingProgress] = useState(rideState?.skipProcessing ? 100 : 0);
    const processedRef = useRef(rideState?.skipProcessing ?? false);

    // Redirect if no ride state
    useEffect(() => {
        if (!rideState) {
            navigate("/", { replace: true });
        }
    }, [rideState, navigate]);

    // Auto-start processing on mount
    const startProcessing = useCallback(async () => {
        if (!rideState || processedRef.current) return;
        processedRef.current = true;

        // Reset stats first
        await reset();

        // Simulate progress
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

        // Send burst of ride requests
        await sendBurst(totalRides, 80);

        clearInterval(progressTimer);
        setProcessingProgress(100);

        // Small delay before marking complete
        setTimeout(() => {
            setHasProcessed(true);
        }, 500);
    }, [rideState, sendBurst, reset]);

    useEffect(() => {
        if (rideState) {
            startProcessing();
        }
    }, [startProcessing, rideState]);

    if (!rideState) return null;

    const lastRequestSuccess = lastResponse ? lastResponse.success : null;
    const retryAfter =
        lastResponse && !lastResponse.success && "retryAfter" in lastResponse
            ? lastResponse.retryAfter
            : undefined;

    const handleGoToBilling = () => {
        navigate("/billing", {
            state: {
                ...rideState,
                totalRequests: requestStats?.total || 0,
                allowedRequests: requestStats?.allowed || 0,
                blockedRequests: requestStats?.blocked || 0,
                successRate: requestStats?.successRate || "0",
            },
        });
    };

    return (
        <div className="page page-dashboard">
            {/* Header */}
            <section className="dash-hero">
                <div className="dash-hero-content">
                    <h1 className="dash-title">
                        {hasProcessed ? "Rides Processed" : "Processing Your Rides"}
                        {!hasProcessed && <span className="processing-dot">...</span>}
                    </h1>
                    <p className="dash-subtitle">
                        {hasProcessed
                            ? "All booking requests have been processed through the rate limiter"
                            : "Sending booking requests through the Token Bucket rate limiter"}
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
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                </div>
            )}

            {/* Main Dashboard Grid */}
            <section className="grid grid-main">
                {/* Token Bucket */}
                <div className="card">
                    <h2>Server Capacity (Token Bucket)</h2>
                    {bucketStats ? (
                        <BucketView
                            current={bucketStats.tokens}
                            capacity={bucketStats.capacity}
                            refillRate={bucketStats.refillRate}
                            algorithm="token-bucket"
                            lastRequestSuccess={lastRequestSuccess}
                        />
                    ) : (
                        <div className="loading-placeholder">
                            <div className="spinner" />
                            <p>Connecting to server...</p>
                        </div>
                    )}
                </div>

                {/* Stats Panel */}
                <div className="card">
                    <h2>Booking Statistics</h2>
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
                            <p>Loading statistics...</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Ride Results Summary */}
            {hasProcessed && requestStats && (
                <section className="ride-results card">
                    <h2>Ride Booking Results</h2>
                    <div className="results-grid">
                        <div className="result-item result-confirmed">
                            <div className="result-value">{requestStats.allowed}</div>
                            <div className="result-label">Rides Confirmed</div>
                        </div>
                        <div className="result-item result-rejected">
                            <div className="result-value">{requestStats.blocked}</div>
                            <div className="result-label">Rides Rejected</div>
                        </div>
                        <div className="result-item result-total">
                            <div className="result-value">
                                ₹{requestStats.allowed * rideState.farePerRide}
                            </div>
                            <div className="result-label">Total Fare</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Chart */}
            <section className="card card-chart">
                <h2>Request History</h2>
                <RequestChart history={requestStats?.history || []} maxPoints={30} />
            </section>

            {/* Actions */}
            <section className="dash-actions">
                {hasProcessed ? (
                    <>
                        <button
                            type="button"
                            className="btn btn-primary btn-large"
                            onClick={handleGoToBilling}
                        >
                            View Billing
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
                            {rideState.rideCount > 1 ? "s" : ""}...
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}
