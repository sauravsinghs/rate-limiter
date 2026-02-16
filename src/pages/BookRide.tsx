/**
 * BookRide Page – confirm ride details + choose how many rides to send
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

export default function BookRide() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickup, drop } = (location.state as { pickup: string; drop: string }) || {
    pickup: 'Unknown',
    drop: 'Unknown',
  };

  const fareEstimate = useMemo(() => Math.floor(Math.random() * 150 + 50), []);
  const userId = useMemo(() => `user-${Math.random().toString(36).slice(2, 8)}`, []);
  const eta = useMemo(() => Math.floor(Math.random() * 8 + 2), []);
  const [rideCount, setRideCount] = useState(5);

  const handleConfirm = () => {
    navigate('/demo', {
      state: { pickup, drop, fareEstimate, userId, rideCount },
    });
  };

  return (
    <div className="page book-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <h1 className="page-title">Confirm your ride</h1>

      <div className="ride-summary-card">
        <div className="route-visual">
          <div className="route-line" />
          <div className="route-point">
            <span className="dot dot-green" />
            <div>
              <span className="route-label">Pickup</span>
              <span className="route-value">{pickup}</span>
            </div>
          </div>
          <div className="route-point">
            <span className="dot dot-red" />
            <div>
              <span className="route-label">Drop</span>
              <span className="route-value">{drop}</span>
            </div>
          </div>
        </div>

        <div className="ride-details-grid">
          <div className="detail-cell">
            <span className="detail-label">Fare estimate</span>
            <span className="detail-value accent">₹{fareEstimate}</span>
          </div>
          <div className="detail-cell">
            <span className="detail-label">ETA</span>
            <span className="detail-value">{eta} min</span>
          </div>
          <div className="detail-cell">
            <span className="detail-label">Ride type</span>
            <span className="detail-value">Bike</span>
          </div>
          <div className="detail-cell">
            <span className="detail-label">User ID</span>
            <span className="detail-value mono">{userId}</span>
          </div>
        </div>
      </div>

      {/* ── Ride count selector ────────────────────────── */}
      <div className="ride-count-card">
        <h3 className="ride-count-title">How many rides to request?</h3>
        <p className="ride-count-desc">
          Send multiple booking requests at once to see the token-bucket rate limiter allow some and
          <strong> throttle</strong> the rest.
        </p>

        <div className="ride-count-control">
          <button
            className="count-btn"
            onClick={() => setRideCount(c => Math.max(1, c - 1))}
            disabled={rideCount <= 1}
          >−</button>
          <input
            type="number"
            className="count-input"
            value={rideCount}
            min={1}
            max={30}
            onChange={e => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) setRideCount(Math.min(30, Math.max(1, v)));
            }}
          />
          <button
            className="count-btn"
            onClick={() => setRideCount(c => Math.min(30, c + 1))}
            disabled={rideCount >= 30}
          >+</button>
        </div>

        <div className="count-presets">
          {[1, 5, 10, 15, 20].map(n => (
            <button
              key={n}
              className={`preset-chip ${rideCount === n ? 'active' : ''}`}
              onClick={() => setRideCount(n)}
            >{n}</button>
          ))}
        </div>
      </div>

      <p className="info-text">
        You're about to send <strong>{rideCount}</strong> booking request{rideCount > 1 ? 's' : ''} to the backend.
        The token bucket starts with <strong>10 tokens</strong> (default).
        Rides that fit within available tokens will be <span style={{ color: 'var(--ride-accent)' }}>booked</span>;
        the rest will be <span style={{ color: 'var(--ride-danger)' }}>throttled / discarded</span>.
      </p>

      <button className="btn-action" onClick={handleConfirm}>
        Send {rideCount} Request{rideCount > 1 ? 's' : ''} & See Rate Limiter →
      </button>
    </div>
  );
}
