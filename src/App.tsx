/**
 * Rate Limiter Visualization App
 * Main application component wiring all UI components together
 */

import { useState } from "react";
import AlgorithmInfo from "./components/AlgorithmInfo";
import BucketView from "./components/BucketView";
import Controls from "./components/Controls";
import RequestChart from "./components/RequestChart";
import SettingsPanel from "./components/SettingsPanel";
import StatsPanel from "./components/StatsPanel";
import { useRateLimiter } from "./hooks/useRateLimiter";

const App = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    bucketStats,
    requestStats,
    isLoading,
    error,
    lastResponse,
    sendRequest,
    sendBurst,
    reset,
    updateConfig,
  } = useRateLimiter({ pollInterval: 500, historyLimit: 100 });

  // Determine if last request was successful
  const lastRequestSuccess = lastResponse ? lastResponse.success : null;

  // Get retry after from last response if it was blocked
  const retryAfter =
    lastResponse && !lastResponse.success && "retryAfter" in lastResponse
      ? lastResponse.retryAfter
      : undefined;

  return (
    <div className="app">
      {/* Header */}
      <header className="hero">
        <h1>Rate Limiter Visualization</h1>
        <p className="hero-subtitle">
          Interactive demonstration of the Token Bucket algorithm for API rate
          limiting
        </p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Algorithm Info */}
      <section className="section-info">
        <AlgorithmInfo algorithm="token-bucket" />
      </section>

      {/* Controls */}
      <section className="card">
        <Controls
          onSendRequest={sendRequest}
          onSendBurst={sendBurst}
          onReset={reset}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isLoading={isLoading}
        />
      </section>

      {/* Main Visualization Grid */}
      <section className="grid grid-main">
        {/* Token Bucket Visualization */}
        <div className="card">
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
            <div className="loading-placeholder">
              <div className="spinner" />
              <p>Connecting to server...</p>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="card">
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
            <div className="loading-placeholder">
              <div className="spinner" />
              <p>Loading statistics...</p>
            </div>
          )}
        </div>
      </section>

      {/* Request History Chart */}
      <section className="card card-chart">
        <h2>Request History</h2>
        <RequestChart history={requestStats?.history || []} maxPoints={30} />
      </section>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApply={updateConfig}
        currentCapacity={bucketStats?.capacity || 10}
        currentRefillRate={bucketStats?.refillRate || 1}
      />
    </div>
  );
};

export default App;
