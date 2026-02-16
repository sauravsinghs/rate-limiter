/**
 * DebugPanel – collapsible panel to tweak token-bucket params at runtime
 */
import { useCallback, useEffect, useState } from 'react';
import API_ENDPOINTS from '../config/api';

interface BucketConfig {
  capacity: number;
  refillRate: number;
  tokensPerRequest: number;
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<BucketConfig>({ capacity: 10, refillRate: 1, tokensPerRequest: 1 });
  const [metrics, setMetrics] = useState({ requestsAllowed: 0, requestsBlocked: 0, totalRequests: 0, successRate: '100%' });
  const [saved, setSaved] = useState(false);

  // Fetch current config from health endpoint
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.HEALTH);
      const data = await res.json();
      if (data.bucket) {
        setConfig({
          capacity: data.bucket.capacity ?? 10,
          refillRate: data.bucket.refillRate ?? 1,
          tokensPerRequest: data.bucket.tokensPerRequest ?? 1,
        });
      }
    } catch { /* ignore */ }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.METRICS);
      setMetrics(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open) { fetchConfig(); fetchMetrics(); }
  }, [open, fetchConfig, fetchMetrics]);

  // Poll metrics while open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(fetchMetrics, 2000);
    return () => clearInterval(id);
  }, [open, fetchMetrics]);

  const applyConfig = async () => {
    try {
      await fetch(API_ENDPOINTS.LIMITER_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className={`debug-panel ${open ? 'open' : ''}`}>
      <button className="debug-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '✕ Close' : '🛠 Debug'}
      </button>

      {open && (
        <div className="debug-body">
          <h3>Token Bucket Config</h3>

          <label className="debug-label">
            Capacity
            <input
              type="number" min={1} max={100}
              value={config.capacity}
              onChange={e => setConfig(c => ({ ...c, capacity: Number(e.target.value) }))}
            />
          </label>

          <label className="debug-label">
            Refill Rate (tokens/s)
            <input
              type="number" min={0.1} max={20} step={0.1}
              value={config.refillRate}
              onChange={e => setConfig(c => ({ ...c, refillRate: Number(e.target.value) }))}
            />
          </label>

          <label className="debug-label">
            Tokens per Request
            <input
              type="number" min={1} max={10}
              value={config.tokensPerRequest}
              onChange={e => setConfig(c => ({ ...c, tokensPerRequest: Number(e.target.value) }))}
            />
          </label>

          <button className="debug-apply" onClick={applyConfig}>
            {saved ? '✓ Saved' : 'Apply'}
          </button>

          <hr className="debug-divider" />

          <h3>Live Metrics</h3>
          <div className="debug-metrics">
            <span>Allowed: <strong>{metrics.requestsAllowed}</strong></span>
            <span>Blocked: <strong>{metrics.requestsBlocked}</strong></span>
            <span>Total: <strong>{metrics.totalRequests}</strong></span>
            <span>Rate: <strong>{metrics.successRate}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
