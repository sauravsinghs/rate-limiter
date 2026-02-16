/**
 * SystemDesignDemo Page – Batch Rate Limiter Visualization
 *
 * Sends N ride-booking requests via POST /api/book/batch,
 * then animates each result one-by-one showing tokens being consumed,
 * with a clear summary of booked vs throttled rides.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../config/api';

interface BucketState {
  tokensLeft: number;
  capacity: number;
  refillRate: number;
  tokensPerRequest: number;
  lastRefillTime: number;
}

interface RideResult {
  index: number;
  allowed: boolean;
  booking: Record<string, unknown> | null;
  tokensLeft: number;
  retryAfter?: number;
}

interface BatchResponse {
  success: boolean;
  totalRequested: number;
  totalAllowed: number;
  totalBlocked: number;
  results: RideResult[];
  bucketState: BucketState;
}

export default function SystemDesignDemo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickup, drop, fareEstimate, userId, rideCount = 1 } = (location.state ?? {}) as {
    pickup: string; drop: string; fareEstimate: number; userId: string; rideCount: number;
  };

  const [bucket, setBucket] = useState<BucketState | null>(null);
  const [batchData, setBatchData] = useState<BatchResponse | null>(null);
  const [visibleResults, setVisibleResults] = useState<RideResult[]>([]);
  const [phase, setPhase] = useState<'idle' | 'sending' | 'animating' | 'done'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [animatingIdx, setAnimatingIdx] = useState(-1);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // ── Poll bucket state ────────────────────────────────
  const fetchBucket = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.LIMITER_STATE}?userId=${userId}`);
      const data: BucketState = await res.json();
      setBucket(data);
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => {
    fetchBucket();
    pollRef.current = setInterval(fetchBucket, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchBucket]);

  // ── Animate results one-by-one ────────────────────────
  const animateResults = useCallback((results: RideResult[]) => {
    setPhase('animating');
    let i = 0;

    const showNext = () => {
      if (i >= results.length) {
        setPhase('done');
        setAnimatingIdx(-1);
        addLog(`── All ${results.length} requests processed ──`);
        return;
      }
      const r = results[i];
      setAnimatingIdx(r.index);
      setVisibleResults(prev => [...prev, r]);

      // Simulate bucket update locally for smooth animation
      setBucket(prev => prev ? { ...prev, tokensLeft: r.tokensLeft } : prev);

      if (r.allowed) {
        addLog(`✅ Ride #${r.index} → ALLOWED (tokens left: ${r.tokensLeft})`);
      } else {
        addLog(`🚫 Ride #${r.index} → THROTTLED (tokens left: ${r.tokensLeft})`);
      }

      i++;
      animTimerRef.current = setTimeout(showNext, 400);
    };

    showNext();
  }, []);

  // ── Send batch request ────────────────────────────────
  const sendBatch = useCallback(async () => {
    setPhase('sending');
    setVisibleResults([]);
    setBatchData(null);
    setLogs([]);
    addLog(`Sending ${rideCount} booking request(s) to backend…`);

    try {
      const res = await fetch(API_ENDPOINTS.BOOK_BATCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pickup, drop, count: rideCount }),
      });
      const data: BatchResponse = await res.json();
      setBatchData(data);
      addLog(`Server responded: ${data.totalAllowed} allowed, ${data.totalBlocked} blocked`);
      await fetchBucket();
      animateResults(data.results);
    } catch (err) {
      addLog(`❌ Network error: ${(err as Error).message}`);
      setPhase('idle');
    }
  }, [userId, pickup, drop, rideCount, fetchBucket, animateResults]);

  // Auto-trigger on mount
  useEffect(() => { sendBatch(); }, [sendBatch]);

  // Cleanup
  useEffect(() => () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
  }, []);

  // ── Helpers ───────────────────────────────────────────
  const tokenSlots = bucket
    ? Array.from({ length: bucket.capacity }, (_, i) => i < bucket.tokensLeft)
    : [];

  const allowed = visibleResults.filter(r => r.allowed);
  const blocked = visibleResults.filter(r => !r.allowed);

  return (
    <div className="page demo-page">
      <h1 className="page-title">System Design Demo</h1>
      <p className="page-subtitle">Token Bucket Rate Limiter — Batch Mode ({rideCount} rides)</p>

      {/* ── Steps bar ──────────────────────────────── */}
      <div className="steps-bar">
        <div className={`step ${phase === 'sending' ? 'active' : phase !== 'idle' ? 'done' : ''}`}>
          <span className="step-num">1</span> Send {rideCount} Requests
        </div>
        <div className="step-line" />
        <div className={`step ${phase === 'animating' ? 'active' : phase === 'done' ? 'done' : ''}`}>
          <span className="step-num">2</span> Rate Check
        </div>
        <div className="step-line" />
        <div className={`step ${phase === 'done' ? 'active done' : ''}`}>
          <span className="step-num">3</span> Results
        </div>
      </div>

      {/* ── Bucket visualization ───────────────────── */}
      <section className="demo-bucket-section">
        <h2>Token Bucket</h2>
        {bucket && (
          <div className="demo-bucket-info">
            <span>Capacity: <strong>{bucket.capacity}</strong></span>
            <span>Refill: <strong>{bucket.refillRate}/s</strong></span>
            <span>Cost: <strong>{bucket.tokensPerRequest} token(s)</strong></span>
          </div>
        )}

        <div className="demo-bucket-container">
          {tokenSlots.map((filled, i) => (
            <div key={i} className={`demo-token ${filled ? 'filled' : 'empty'}`}>
              {filled ? '●' : '○'}
            </div>
          ))}
          {!bucket && <div className="loading-text">Loading bucket…</div>}
        </div>

        {bucket && (
          <>
            <div className="demo-bucket-bar">
              <div
                className="demo-bucket-bar-fill"
                style={{ width: `${(bucket.tokensLeft / bucket.capacity) * 100}%` }}
              />
            </div>
            <p className="demo-bucket-count">
              {bucket.tokensLeft} / {bucket.capacity} tokens available
            </p>
          </>
        )}
      </section>

      {/* ── Sending spinner ────────────────────────── */}
      {phase === 'sending' && (
        <div className="result-banner sending">
          <span className="spinner-sm" />
          <span>Sending {rideCount} requests to the rate limiter…</span>
        </div>
      )}

      {/* ── Summary banner (after all results shown) ── */}
      {phase === 'done' && batchData && (
        <div className="batch-summary">
          <div className="batch-summary-stat booked">
            <span className="summary-num">{batchData.totalAllowed}</span>
            <span className="summary-label">Booked</span>
          </div>
          <div className="batch-summary-divider" />
          <div className="batch-summary-stat throttled">
            <span className="summary-num">{batchData.totalBlocked}</span>
            <span className="summary-label">Throttled</span>
          </div>
          <div className="batch-summary-divider" />
          <div className="batch-summary-stat total">
            <span className="summary-num">{batchData.totalRequested}</span>
            <span className="summary-label">Requested</span>
          </div>
        </div>
      )}

      {/* ── Live ride results table ────────────────── */}
      {visibleResults.length > 0 && (
        <section className="batch-results-section">
          <h3>Ride Results</h3>
          <div className="batch-results-list">
            {visibleResults.map(r => (
              <div
                key={r.index}
                className={`batch-result-row ${r.allowed ? 'allowed' : 'blocked'} ${animatingIdx === r.index ? 'animating' : ''}`}
              >
                <span className="result-idx">#{r.index}</span>
                <span className={`result-badge ${r.allowed ? 'badge-allowed' : 'badge-blocked'}`}>
                  {r.allowed ? '✅ Booked' : '🚫 Throttled'}
                </span>
                <span className="result-tokens">
                  🪣 {r.tokensLeft} left
                </span>
                {r.allowed && r.booking && (
                  <span className="result-id mono">
                    {(r.booking as { bookingId?: string }).bookingId}
                  </span>
                )}
                {!r.allowed && (
                  <span className="result-retry">retry {r.retryAfter ?? '?'}s</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Action buttons (after done) ────────────── */}
      {phase === 'done' && (
        <div className="batch-actions">
          {allowed.length > 0 && (
            <button className="btn-action sm" onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              navigate('/bill', {
                state: {
                  booking: allowed[0].booking,
                  pickup, drop, fareEstimate,
                  totalBooked: allowed.length,
                  totalBlocked: blocked.length,
                },
              });
            }}>
              View Bill for Ride #1 →
            </button>
          )}
          <button className="btn-action sm outline" onClick={sendBatch}>
            Retry {rideCount} Rides Again
          </button>
          <button className="btn-action sm outline" onClick={() => navigate('/dashboard')}>
            View Dashboard
          </button>
        </div>
      )}

      {/* ── Log feed ───────────────────────────────── */}
      <section className="demo-log">
        <h3>Event Log</h3>
        <div className="log-feed">
          {logs.map((l, i) => <div key={i} className="log-entry">{l}</div>)}
          {logs.length === 0 && <div className="log-entry muted">Waiting…</div>}
        </div>
      </section>

      <button className="back-link" onClick={() => navigate('/')}>
        ← Start over
      </button>
    </div>
  );
}
