/**
 * BookRidePage — Page 1
 * Ride booking form: pickup, drop-off, number of people
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LOCATIONS = [
    { id: "koramangala", name: "Koramangala", area: "South Bangalore" },
    { id: "indiranagar", name: "Indiranagar", area: "East Bangalore" },
    { id: "whitefield", name: "Whitefield", area: "East Bangalore" },
    { id: "hsr-layout", name: "HSR Layout", area: "South Bangalore" },
    { id: "mg-road", name: "MG Road", area: "Central Bangalore" },
    { id: "electronic-city", name: "Electronic City", area: "South Bangalore" },
    { id: "jayanagar", name: "Jayanagar", area: "South Bangalore" },
    { id: "marathahalli", name: "Marathahalli", area: "East Bangalore" },
    { id: "hebbal", name: "Hebbal", area: "North Bangalore" },
    { id: "yelahanka", name: "Yelahanka", area: "North Bangalore" },
];

const BASE_FARE = 30;
const PER_KM_RATE = 12;

function estimateDistance(pickup: string, dropoff: string): number {
    const pi = LOCATIONS.findIndex((l) => l.id === pickup);
    const di = LOCATIONS.findIndex((l) => l.id === dropoff);
    return Math.abs(pi - di) * 3.5 + 2;
}

export default function BookRidePage() {
    const navigate = useNavigate();
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [rideCount, setRideCount] = useState(5);

    const isValid = pickup && dropoff && pickup !== dropoff && rideCount >= 1;

    const distance = isValid ? estimateDistance(pickup, dropoff) : 0;
    const farePerRide = isValid
        ? Math.round(BASE_FARE + distance * PER_KM_RATE)
        : 0;
    const totalFare = farePerRide * rideCount;

    const handleBook = () => {
        if (!isValid) return;
        const pickupName = LOCATIONS.find((l) => l.id === pickup)?.name || pickup;
        const dropoffName =
            LOCATIONS.find((l) => l.id === dropoff)?.name || dropoff;

        navigate("/processing", {
            state: {
                pickup: pickupName,
                dropoff: dropoffName,
                rideCount,
                farePerRide,
                distance: distance.toFixed(1),
            },
        });
    };

    return (
        <div className="page page-book">
            {/* Hero */}
            <section className="book-hero">
                <div className="book-hero-content">
                    <h1 className="book-title">
                        Book Your <span className="highlight">Ride</span>
                    </h1>
                    <p className="book-subtitle">
                        Experience how rate limiting handles high-volume ride booking
                        requests in real-time
                    </p>
                </div>
            </section>

            {/* Booking Form */}
            <section className="book-form-section">
                <div className="book-form-card">
                    <h2 className="form-heading">Ride Details</h2>

                    {/* Pickup */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon pickup-icon">●</span>
                            Pickup Location
                        </label>
                        <select
                            id="pickup"
                            className="form-select"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                        >
                            <option value="">Select pickup point</option>
                            {LOCATIONS.map((loc) => (
                                <option
                                    key={loc.id}
                                    value={loc.id}
                                    disabled={loc.id === dropoff}
                                >
                                    {loc.name} — {loc.area}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Drop-off */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon dropoff-icon">◆</span>
                            Drop-off Location
                        </label>
                        <select
                            id="dropoff"
                            className="form-select"
                            value={dropoff}
                            onChange={(e) => setDropoff(e.target.value)}
                        >
                            <option value="">Select drop-off point</option>
                            {LOCATIONS.map((loc) => (
                                <option
                                    key={loc.id}
                                    value={loc.id}
                                    disabled={loc.id === pickup}
                                >
                                    {loc.name} — {loc.area}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ride Count */}
                    <div className="form-group ride-count-group">
                        <label className="form-label">
                            Number of People
                            <span className="label-hint">
                                (Each person = 1 booking request to rate limiter)
                            </span>
                        </label>
                        <div className="ride-count-control">
                            <button
                                type="button"
                                className="count-btn"
                                onClick={() => setRideCount(Math.max(1, rideCount - 1))}
                                disabled={rideCount <= 1}
                            >
                                −
                            </button>
                            <input
                                type="number"
                                className="count-input"
                                min={1}
                                max={100}
                                value={rideCount}
                                onChange={(e) =>
                                    setRideCount(
                                        Math.max(1, Math.min(100, Number(e.target.value))),
                                    )
                                }
                            />
                            <button
                                type="button"
                                className="count-btn"
                                onClick={() => setRideCount(Math.min(100, rideCount + 1))}
                                disabled={rideCount >= 100}
                            >
                                +
                            </button>
                        </div>
                        <input
                            type="range"
                            className="slider ride-slider"
                            min={1}
                            max={100}
                            value={rideCount}
                            onChange={(e) => setRideCount(Number(e.target.value))}
                        />
                        <div className="ride-count-labels">
                            <span>1</span>
                            <span>20</span>
                            <span>40</span>
                            <span>60</span>
                            <span>80</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>

                {/* Fare Estimate Card */}
                <div className="fare-card">
                    <h3 className="fare-heading">Fare Estimate</h3>
                    {isValid ? (
                        <>
                            <div className="fare-route">
                                <span className="fare-loc">{LOCATIONS.find((l) => l.id === pickup)?.name}</span>
                                <span className="fare-arrow">→</span>
                                <span className="fare-loc">{LOCATIONS.find((l) => l.id === dropoff)?.name}</span>
                            </div>
                            <div className="fare-details">
                                <div className="fare-row">
                                    <span>Distance</span>
                                    <span>{distance.toFixed(1)} km</span>
                                </div>
                                <div className="fare-row">
                                    <span>Fare per ride</span>
                                    <span>₹{farePerRide}</span>
                                </div>
                                <div className="fare-row">
                                    <span>Number of people</span>
                                    <span>×{rideCount}</span>
                                </div>
                                <div className="fare-divider" />
                                <div className="fare-row fare-total">
                                    <span>Total Estimated Fare</span>
                                    <span>₹{totalFare}</span>
                                </div>
                            </div>
                            <div className="fare-note">
                                Rides exceeding the rate limit will be rejected. You'll only be
                                charged for confirmed rides.
                            </div>
                        </>
                    ) : (
                        <div className="fare-empty">
                            <p>Select pickup, drop-off &amp; ride count to see fare estimate</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Book Button */}
            <section className="book-action">
                <button
                    type="button"
                    className="btn btn-primary btn-book"
                    disabled={!isValid}
                    onClick={handleBook}
                >
                    Book for {rideCount} {rideCount > 1 ? "People" : "Person"} Now
                </button>
                <p className="book-action-hint">
                    Bookings will be processed through the Token Bucket rate limiter
                </p>
            </section>
        </div>
    );
}
