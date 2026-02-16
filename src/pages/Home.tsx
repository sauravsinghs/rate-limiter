/**
 * Home Page – Rapido/Uber style ride-booking landing
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const POPULAR_LOCATIONS = [
  'Koramangala', 'Indiranagar', 'MG Road', 'Whitefield',
  'Electronic City', 'HSR Layout', 'Jayanagar', 'Marathahalli',
];

export default function Home() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  const canProceed = pickup.trim().length > 0 && drop.trim().length > 0;

  const handleBook = () => {
    if (!canProceed) return;
    navigate('/book', { state: { pickup, drop } });
  };

  return (
    <div className="page home-page">
      {/* Hero */}
      <header className="home-hero">
        <div className="brand">
          <span className="brand-icon">🏍️</span>
          <h1>RapidGo</h1>
        </div>
        <p className="tagline">Fast rides, fair prices</p>
      </header>

      {/* Location inputs */}
      <section className="home-card">
        <h2>Where to?</h2>

        <div className="input-group">
          <label className="input-label">
            <span className="dot dot-green" />
            Pickup
          </label>
          <input
            className="ride-input"
            placeholder="Enter pickup location"
            value={pickup}
            onChange={e => setPickup(e.target.value)}
            list="pickup-list"
          />
          <datalist id="pickup-list">
            {POPULAR_LOCATIONS.map(l => <option key={l} value={l} />)}
          </datalist>
        </div>

        <div className="input-group">
          <label className="input-label">
            <span className="dot dot-red" />
            Drop
          </label>
          <input
            className="ride-input"
            placeholder="Enter drop location"
            value={drop}
            onChange={e => setDrop(e.target.value)}
            list="drop-list"
          />
          <datalist id="drop-list">
            {POPULAR_LOCATIONS.filter(l => l !== pickup).map(l => <option key={l} value={l} />)}
          </datalist>
        </div>

        <button
          className="btn-action"
          onClick={handleBook}
          disabled={!canProceed}
        >
          Find Ride →
        </button>
      </section>

      {/* Quick-pick tiles */}
      <section className="home-tiles">
        <h3>Popular routes</h3>
        <div className="tiles-grid">
          {[
            { p: 'Koramangala', d: 'MG Road', fare: '₹65' },
            { p: 'Indiranagar', d: 'Whitefield', fare: '₹120' },
            { p: 'HSR Layout', d: 'Electronic City', fare: '₹95' },
            { p: 'Jayanagar', d: 'Marathahalli', fare: '₹110' },
          ].map(r => (
            <button
              key={r.p + r.d}
              className="tile"
              onClick={() => { setPickup(r.p); setDrop(r.d); }}
            >
              <span className="tile-route">{r.p} → {r.d}</span>
              <span className="tile-fare">{r.fare}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
