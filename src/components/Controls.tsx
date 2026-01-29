/**
 * Controls Component
 * Action buttons for sending requests and managing the rate limiter
 */

import { useState } from "react";

export interface ControlsProps {
  onSendRequest: () => void;
  onSendBurst: (count: number, delay?: number) => void;
  onReset: () => void;
  onOpenSettings: () => void;
  isLoading: boolean;
}

const BURST_OPTIONS = [5, 10, 20, 50];

export function Controls({
  onSendRequest,
  onSendBurst,
  onReset,
  onOpenSettings,
  isLoading,
}: ControlsProps) {
  const [burstCount, setBurstCount] = useState(10);
  const [showBurstDropdown, setShowBurstDropdown] = useState(false);

  const handleBurstClick = () => {
    onSendBurst(burstCount, 50);
  };

  return (
    <div className="controls-panel">
      <div className="controls-main">
        {/* Send Request Button */}
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={onSendRequest}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Sending...
            </span>
          ) : (
            <>
              <span className="btn-icon">→</span>
              Send Request
            </>
          )}
        </button>

        {/* Burst Button with Dropdown */}
        <div className="burst-control">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBurstClick}
            disabled={isLoading}
          >
            <span className="btn-icon">⚡</span>
            Burst ({burstCount})
          </button>
          <button
            type="button"
            className="btn btn-dropdown"
            onClick={() => setShowBurstDropdown(!showBurstDropdown)}
            disabled={isLoading}
            aria-label="Select burst count"
          >
            ▼
          </button>
          {showBurstDropdown && (
            <div className="dropdown-menu">
              {BURST_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`dropdown-item ${count === burstCount ? "active" : ""}`}
                  onClick={() => {
                    setBurstCount(count);
                    setShowBurstDropdown(false);
                  }}
                >
                  {count} requests
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Button */}
        <button
          type="button"
          className="btn btn-outline"
          onClick={onReset}
          disabled={isLoading}
        >
          <span className="btn-icon">↺</span>
          Reset
        </button>
      </div>

      {/* Settings Button */}
      <button
        type="button"
        className="btn btn-icon-only"
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}

export default Controls;
