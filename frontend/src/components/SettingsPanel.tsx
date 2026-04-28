/**
 * SettingsPanel Component
 * Modal for configuring rate limiter settings
 */

import { useEffect, useState } from "react";

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: { capacity?: number; refillRate?: number }) => void;
  currentCapacity: number;
  currentRefillRate: number;
}

type AlgorithmType =
  | "token-bucket"
  | "sliding-window"
  | "fixed-window"
  | "leaky-bucket";

interface AlgorithmOption {
  id: AlgorithmType;
  name: string;
  description: string;
  available: boolean;
}

const ALGORITHMS: AlgorithmOption[] = [
  {
    id: "token-bucket",
    name: "Token Bucket",
    description:
      "Tokens refill at a constant rate. Best for allowing bursts while maintaining average rate.",
    available: true,
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    description:
      "Counts requests in a rolling time window. Smooth rate limiting without burst allowance.",
    available: false,
  },
  {
    id: "fixed-window",
    name: "Fixed Window",
    description:
      "Resets count at fixed intervals. Simple but can allow bursts at window boundaries.",
    available: false,
  },
  {
    id: "leaky-bucket",
    name: "Leaky Bucket",
    description:
      "Processes requests at a constant rate. Queues excess requests instead of rejecting.",
    available: false,
  },
];

export function SettingsPanel({
  isOpen,
  onClose,
  onApply,
  currentCapacity,
  currentRefillRate,
}: SettingsPanelProps) {
  const [capacity, setCapacity] = useState(currentCapacity);
  const [refillRate, setRefillRate] = useState(currentRefillRate);
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<AlgorithmType>("token-bucket");

  // Sync with current values when opened
  useEffect(() => {
    if (isOpen) {
      setCapacity(currentCapacity);
      setRefillRate(currentRefillRate);
    }
  }, [isOpen, currentCapacity, currentRefillRate]);

  const handleApply = () => {
    onApply({ capacity, refillRate });
    onClose();
  };

  const handleReset = () => {
    setCapacity(currentCapacity);
    setRefillRate(currentRefillRate);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Algorithm Selection */}
          <div className="settings-section">
            <h3>Algorithm</h3>
            <div className="algorithm-grid">
              {ALGORITHMS.map((algo) => (
                <button
                  key={algo.id}
                  type="button"
                  className={`algorithm-card ${selectedAlgorithm === algo.id ? "selected" : ""} ${!algo.available ? "disabled" : ""}`}
                  onClick={() =>
                    algo.available && setSelectedAlgorithm(algo.id)
                  }
                  disabled={!algo.available}
                >
                  <div className="algorithm-name">
                    {algo.name}
                    {!algo.available && (
                      <span className="coming-soon">Coming Soon</span>
                    )}
                  </div>
                  <div className="algorithm-desc">{algo.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Capacity Setting */}
          <div className="settings-section">
            <h3>Bucket Capacity</h3>
            <p className="settings-desc">
              Maximum number of tokens the bucket can hold
            </p>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="100"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="slider"
              />
              <div className="slider-value">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(
                      Math.max(1, Math.min(100, Number(e.target.value))),
                    )
                  }
                  className="input-number"
                />
                <span>tokens</span>
              </div>
            </div>
          </div>

          {/* Refill Rate Setting */}
          <div className="settings-section">
            <h3>Refill Rate</h3>
            <p className="settings-desc">
              How many tokens are added per second
            </p>
            <div className="slider-container">
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={refillRate}
                onChange={(e) => setRefillRate(Number(e.target.value))}
                className="slider"
              />
              <div className="slider-value">
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={refillRate}
                  onChange={(e) =>
                    setRefillRate(
                      Math.max(0.1, Math.min(10, Number(e.target.value))),
                    )
                  }
                  className="input-number"
                />
                <span>tokens/sec</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
          >
            Reset
          </button>
          <div className="modal-footer-right">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
