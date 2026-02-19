/**
 * BillingPage — Page 3
 * Comparison billing: Token Bucket vs Sliding Window side by side
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetAllStats } from "../services/api";

interface BillingState {
    pickup: string;
    dropoff: string;
    rideCount: number;
    farePerRide: number;
    distance: string;
    // Token Bucket
    tb_totalRequests: number;
    tb_allowedRequests: number;
    tb_blockedRequests: number;
    tb_successRate: string;
    // Sliding Window
    sw_totalRequests: number;
    sw_allowedRequests: number;
    sw_blockedRequests: number;
    sw_successRate: string;
}

export default function BillingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const billing = location.state as BillingState | null;

    useEffect(() => {
        if (!billing) {
            navigate("/", { replace: true });
        }
    }, [billing, navigate]);

    if (!billing) return null;

    const tbFare = billing.tb_allowedRequests * billing.farePerRide;
    const swFare = billing.sw_allowedRequests * billing.farePerRide;
    const tbSuccessRate = parseFloat(billing.tb_successRate) || 0;
    const swSuccessRate = parseFloat(billing.sw_successRate) || 0;

    const handleBookAgain = async () => {
        try {
            await resetAllStats();
        } catch {
            // Ignore
        }
        navigate("/");
    };

    return (
        <div className="page page-billing">
            {/* Header */}
            <section className="billing-hero">
                <div className="billing-hero-content">
                    <h1 className="billing-title">Billing Comparison</h1>
                    <p className="billing-subtitle">
                        How each algorithm handled {billing.rideCount} booking requests
                    </p>
                </div>
            </section>

            {/* Route Info */}
            <section className="invoice-card">
                <div className="invoice-header">
                    <div className="invoice-brand">
                        <span className="invoice-logo">R</span>
                        <div>
                            <h3>Ride Booking Services</h3>
                            <p>Algorithm Comparison Invoice</p>
                        </div>
                    </div>
                    <div className="invoice-date">
                        <p>
                            {new Date().toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                        <p className="invoice-id">
                            #RL-{Math.random().toString(36).substring(2, 8).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="invoice-route">
                    <div className="invoice-route-point">
                        <span className="route-dot pickup-dot" />
                        <div>
                            <span className="route-type">Pickup</span>
                            <span className="route-name">{billing.pickup}</span>
                        </div>
                    </div>
                    <div className="invoice-route-line" />
                    <div className="invoice-route-point">
                        <span className="route-dot dropoff-dot" />
                        <div>
                            <span className="route-type">Drop-off</span>
                            <span className="route-name">{billing.dropoff}</span>
                        </div>
                    </div>
                    <div className="invoice-distance">
                        <span>{billing.distance} km</span>
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="billing-comparison card">
                <h2>Algorithm Comparison</h2>
                <div className="comparison-table billing-comparison-table">
                    <div className="comparison-header">
                        <span>Metric</span>
                        <span>Token Bucket</span>
                        <span>Sliding Window</span>
                    </div>
                    <div className="comparison-row">
                        <span>Total Requests</span>
                        <span>{billing.tb_totalRequests}</span>
                        <span>{billing.sw_totalRequests}</span>
                    </div>
                    <div className="comparison-row">
                        <span>Bookings Confirmed</span>
                        <span className="stat-success">{billing.tb_allowedRequests}</span>
                        <span className="stat-success">{billing.sw_allowedRequests}</span>
                    </div>
                    <div className="comparison-row">
                        <span>Bookings Rejected</span>
                        <span className="stat-danger">{billing.tb_blockedRequests}</span>
                        <span className="stat-danger">{billing.sw_blockedRequests}</span>
                    </div>
                    <div className="comparison-row">
                        <span>Success Rate</span>
                        <span>{tbSuccessRate.toFixed(1)}%</span>
                        <span>{swSuccessRate.toFixed(1)}%</span>
                    </div>
                    <div className="comparison-row comparison-row-highlight">
                        <span>Fare Charged</span>
                        <span>₹{tbFare}</span>
                        <span>₹{swFare}</span>
                    </div>
                </div>
            </section>

            {/* Algorithm Explanation */}
            <section className="algo-explanation">
                <div className="algo-explain-card">
                    <h3>Token Bucket</h3>
                    <p>
                        Starts with a full bucket of tokens. Each request consumes one token.
                        Tokens refill at a steady rate. Allows <strong>burst traffic</strong> —
                        if the bucket is full, many requests pass instantly until tokens run out.
                    </p>
                    <div className="explain-stat">
                        <span className="explain-allowed">{billing.tb_allowedRequests}</span> confirmed,{" "}
                        <span className="explain-blocked">{billing.tb_blockedRequests}</span> rejected
                    </div>
                </div>
                <div className="algo-explain-card">
                    <h3>Sliding Window Counter</h3>
                    <p>
                        Tracks requests within a rolling time window. If the count exceeds the
                        limit within the window, new requests are rejected.
                        Provides <strong>smoother rate limiting</strong> over time.
                    </p>
                    <div className="explain-stat">
                        <span className="explain-allowed">{billing.sw_allowedRequests}</span> confirmed,{" "}
                        <span className="explain-blocked">{billing.sw_blockedRequests}</span> rejected
                    </div>
                </div>
            </section>

            {/* Actions */}
            <section className="billing-actions">
                <button
                    type="button"
                    className="btn btn-primary btn-large"
                    onClick={handleBookAgain}
                >
                    Book New Rides
                </button>
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate("/processing", { state: { ...location.state, skipProcessing: true } })}
                >
                    Back to Dashboard
                </button>
            </section>
        </div>
    );
}
