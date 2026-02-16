/**
 * Bill Page – booking confirmation / receipt
 */
import { useLocation, useNavigate } from 'react-router-dom';

export default function Bill() {
  const navigate = useNavigate();
  const { booking, pickup, drop, fareEstimate } = (useLocation().state ?? {}) as {
    booking?: Record<string, unknown>;
    pickup?: string;
    drop?: string;
    fareEstimate?: number;
  };

  const b = booking as Record<string, unknown> | undefined;
  const driver = b?.driver as Record<string, unknown> | undefined;

  return (
    <div className="page bill-page">
      <h1 className="page-title">Ride Confirmed! 🎉</h1>

      <div className="bill-card">
        {/* Route */}
        <div className="bill-route">
          <div className="bill-route-point">
            <span className="dot dot-green" />
            <span>{pickup ?? 'Pickup'}</span>
          </div>
          <div className="bill-route-line" />
          <div className="bill-route-point">
            <span className="dot dot-red" />
            <span>{drop ?? 'Drop'}</span>
          </div>
        </div>

        <hr className="bill-divider" />

        {/* Details */}
        <div className="bill-details">
          <div className="bill-row">
            <span>Booking ID</span>
            <span className="mono">{(b?.bookingId as string) ?? '—'}</span>
          </div>
          <div className="bill-row">
            <span>Driver</span>
            <span>{(driver?.name as string) ?? '—'}</span>
          </div>
          <div className="bill-row">
            <span>Vehicle</span>
            <span>{(driver?.vehicle as string) ?? '—'}</span>
          </div>
          <div className="bill-row">
            <span>Rating</span>
            <span>⭐ {(driver?.rating as string) ?? '—'}</span>
          </div>
          <div className="bill-row">
            <span>ETA</span>
            <span>{(driver?.eta as number) ?? '—'} min</span>
          </div>
        </div>

        <hr className="bill-divider" />

        {/* Fare */}
        <div className="bill-fare">
          <span>Total Fare</span>
          <span className="fare-amount">₹{fareEstimate ?? (b?.fareEstimate as number) ?? 0}</span>
        </div>
      </div>

      <div className="bill-actions">
        <button className="btn-action" onClick={() => navigate('/')}>
          Return Home
        </button>
        <button className="btn-action outline" onClick={() => navigate('/dashboard')}>
          View Dashboard
        </button>
      </div>
    </div>
  );
}
