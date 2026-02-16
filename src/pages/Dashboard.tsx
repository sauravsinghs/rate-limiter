/**
 * Dashboard Page – the original rate-limiter visualization dashboard
 * Preserved as a separate route at /dashboard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlgorithmInfo from '../components/AlgorithmInfo';
import BucketView from '../components/BucketView';
import Controls from '../components/Controls';
import RequestChart from '../components/RequestChart';
import SettingsPanel from '../components/SettingsPanel';
import StatsPanel from '../components/StatsPanel';
import { useRateLimiter } from '../hooks/useRateLimiter';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    bucketStats, requestStats, isLoading, error, lastResponse,
    sendRequest, sendBurst, reset, updateConfig,
  } = useRateLimiter({ pollInterval: 500, historyLimit: 100 });

  const lastRequestSuccess = lastResponse ? lastResponse.success : null;
  const retryAfter =
    lastResponse && !lastResponse.success && 'retryAfter' in lastResponse
      ? (lastResponse as { retryAfter: number }).retryAfter
      : undefined;

  return (
    <div className="page dashboard-page">
      <button className="back-link" onClick={() => navigate('/')}>← Home</button>

      <header className="dash-hero">
        <h1>Rate Limiter Dashboard</h1>
        <p className="hero-subtitle">
          Interactive demonstration of the Token Bucket algorithm
        </p>
      </header>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <section className="dash-section">
        <AlgorithmInfo algorithm="token-bucket" />
      </section>

      <section className="dash-card">
        <Controls
          onSendRequest={sendRequest}
          onSendBurst={sendBurst}
          onReset={reset}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isLoading={isLoading}
        />
      </section>

      <section className="dash-grid">
        <div className="dash-card">
          <h2>Token Bucket</h2>
          {bucketStats ? (
            <BucketView
              current={bucketStats.tokens}
              capacity={bucketStats.capacity}
              refillRate={bucketStats.refillRate}
              algorithm="token-bucket"
              lastRequestSuccess={lastRequestSuccess}
            />
          ) : (
            <div className="loading-placeholder"><div className="spinner" /><p>Connecting…</p></div>
          )}
        </div>

        <div className="dash-card">
          <h2>Statistics</h2>
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
            <div className="loading-placeholder"><div className="spinner" /><p>Loading…</p></div>
          )}
        </div>
      </section>

      <section className="dash-card chart-card">
        <h2>Request History</h2>
        <RequestChart history={requestStats?.history || []} maxPoints={30} />
      </section>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApply={updateConfig}
        currentCapacity={bucketStats?.capacity || 10}
        currentRefillRate={bucketStats?.refillRate || 1}
      />
    </div>
  );
}
