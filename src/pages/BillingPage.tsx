/**
 * BillingPage — Page 3
 * Billing summary with invoice-style breakdown
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetStats } from "../services/api";

interface BillingState {
    pickup: string;
    dropoff: string;
    rideCount: number;
    farePerRide: number;
    distance: string;
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    successRate: string;
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

    const confirmedFare = billing.allowedRequests * billing.farePerRide;
    const rejectedFare = billing.blockedRequests * billing.farePerRide;
    const successRateNum = parseFloat(billing.successRate) || 0;

    const handleBookAgain = async () => {
        try {
            await resetStats();
        } catch {
            // Ignore — stats will reset eventually
        }
        navigate("/");
    };

    return (
        <div className="page page-billing">
            {/* Header */}
            <section className="billing-hero">
                <div className="billing-hero-content">
                    <h1 className="billing-title">Billing Summary</h1>
                    <p className="billing-subtitle">
                        Your ride booking invoice with rate limiter breakdown
                    </p>
                </div>
            </section>

            {/* Invoice */}
            <section className="invoice-card">
                {/* Invoice Header */}
                <div className="invoice-header">
                    <div className="invoice-brand">
                        <span className="invoice-logo">R</span>
                        <div>
                            <h3>Ride Booking Services</h3>
                            <p>Booking Invoice</p>
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

                {/* Route */}
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

                {/* Line Items */}
                <div className="invoice-items">
                    <div className="invoice-row invoice-row-header">
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Rate</span>
                        <span>Amount</span>
                    </div>

                    <div className="invoice-row">
                        <span>Bookings Requested</span>
                        <span>{billing.rideCount}</span>
                        <span>₹{billing.farePerRide}</span>
                        <span>₹{billing.rideCount * billing.farePerRide}</span>
                    </div>

                    <div className="invoice-row row-confirmed">
                        <span>
                            Rides Confirmed
                        </span>
                        <span>{billing.allowedRequests}</span>
                        <span>₹{billing.farePerRide}</span>
                        <span className="amount-success">₹{confirmedFare}</span>
                    </div>

                    <div className="invoice-row row-rejected">
                        <span>
                            Rides Rejected (Rate Limited)
                        </span>
                        <span>{billing.blockedRequests}</span>
                        <span>₹{billing.farePerRide}</span>
                        <span className="amount-danger">
                            -₹{rejectedFare}
                        </span>
                    </div>

                    <div className="invoice-divider" />

                    <div className="invoice-row invoice-total">
                        <span>Amount Charged</span>
                        <span />
                        <span />
                        <span>₹{confirmedFare}</span>
                    </div>

                    {rejectedFare > 0 && (
                        <div className="invoice-row invoice-savings">
                            <span>Rejected rides</span>
                            <span />
                            <span />
                            <span>₹{rejectedFare}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Rate Limiter Info */}
            <section className="billing-info-card">
                <div className="info-card-content">
                    <h3>Why were some rides rejected?</h3>
                    <p>
                        The Token Bucket rate limiter has a finite capacity of tokens. Each
                        booking request consumes one token. When the bucket runs empty,
                        subsequent requests are rejected with HTTP 429 (Too Many Requests)
                        until tokens refill.
                    </p>
                    <div className="info-stats">
                        <div className="info-stat">
                            <span className="info-stat-value">{billing.totalRequests}</span>
                            <span className="info-stat-label">Total Requests</span>
                        </div>
                        <div className="info-stat">
                            <span className="info-stat-value stat-success">
                                {billing.allowedRequests}
                            </span>
                            <span className="info-stat-label">Allowed</span>
                        </div>
                        <div className="info-stat">
                            <span className="info-stat-value stat-danger">
                                {billing.blockedRequests}
                            </span>
                            <span className="info-stat-label">Blocked</span>
                        </div>
                        <div className="info-stat">
                            <span className="info-stat-value">
                                {successRateNum.toFixed(1)}%
                            </span>
                            <span className="info-stat-label">Success Rate</span>
                        </div>
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
