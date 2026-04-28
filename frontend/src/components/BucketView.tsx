/**
 * BucketView Component
 * Visual representation of the token bucket with animated tokens
 */

import { useEffect, useMemo, useRef, useState } from "react";

export interface BucketViewProps {
  current: number;
  capacity: number;
  refillRate: number;
  algorithm?:
    | "token-bucket"
    | "sliding-window"
    | "fixed-window"
    | "leaky-bucket";
  lastRequestSuccess?: boolean | null;
}

const MAX_VISUAL_TOKENS = 15;

export function BucketView({
  current,
  capacity,
  refillRate,
  algorithm = "token-bucket",
  lastRequestSuccess = null,
}: BucketViewProps) {
  const [bucketFlash, setBucketFlash] = useState<"success" | "blocked" | null>(
    null,
  );
  const [animatingOut, setAnimatingOut] = useState(false);
  const prevCurrentRef = useRef(current);

  // Calculate visual tokens (cap at MAX_VISUAL_TOKENS for display)
  const visualCapacity = Math.min(capacity, MAX_VISUAL_TOKENS);
  const visualCurrent = Math.min(current, visualCapacity);
  const showNumericOnly = capacity > MAX_VISUAL_TOKENS;

  // Generate token elements based on current count - directly synced, no complex state
  const tokens = useMemo(() => {
    return Array.from({ length: visualCurrent }, (_, i) => ({
      id: i,
      delay: i * 0.05,
    }));
  }, [visualCurrent]);

  // Detect consumption for animation
  useEffect(() => {
    if (current < prevCurrentRef.current) {
      setAnimatingOut(true);
      const timer = setTimeout(() => setAnimatingOut(false), 200);
      return () => clearTimeout(timer);
    }
    prevCurrentRef.current = current;
  }, [current]);

  // Flash effect on request
  useEffect(() => {
    if (lastRequestSuccess === null) return;

    setBucketFlash(lastRequestSuccess ? "success" : "blocked");
    const timeout = setTimeout(() => setBucketFlash(null), 300);
    return () => clearTimeout(timeout);
  }, [lastRequestSuccess]);

  // Calculate fill percentage for the water level
  const fillPercentage = capacity > 0 ? (current / capacity) * 100 : 0;

  // Determine status color
  const getStatusClass = () => {
    if (current === 0) return "empty";
    if (current <= capacity * 0.3) return "low";
    if (current <= capacity * 0.6) return "medium";
    return "full";
  };

  return (
    <div className="bucket-view">
      {/* Header with algorithm and refill info */}
      <div className="bucket-header">
        <span className="algorithm-badge">
          <span className="badge-icon">&#9679;</span>
          {algorithm.replace("-", " ")}
        </span>
        <span className="refill-indicator">
          <svg
            className="refill-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path
              fill="currentColor"
              d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
          <span>{refillRate}/s</span>
        </span>
      </div>

      {/* Main bucket container */}
      <div className={`bucket-wrapper ${getStatusClass()}`}>
        <div
          className={`bucket-container ${bucketFlash ? `flash-${bucketFlash}` : ""} ${animatingOut ? "consuming" : ""}`}
        >
          {/* Glass effect layers */}
          <div className="bucket-glass" />

          {/* Water fill with wave animation */}
          <div
            className="bucket-water"
            style={{ height: `${fillPercentage}%` }}
          >
            <div className="water-wave" />
            <div className="water-wave water-wave-2" />
          </div>

          {/* Token grid */}
          <div className="bucket-tokens">
            {!showNumericOnly ? (
              tokens.length > 0 ? (
                tokens.map((token) => (
                  <div
                    key={token.id}
                    className="token"
                    style={{ animationDelay: `${token.delay}s` }}
                  >
                    <div className="token-inner" />
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">0</span>
                </div>
              )
            ) : (
              <div className="token-numeric">
                <span className="token-count-large">{current}</span>
              </div>
            )}
          </div>

          {/* Bucket rim */}
          <div className="bucket-rim" />
        </div>

        {/* Decorative base */}
        <div className="bucket-base" />
      </div>

      {/* Stats display */}
      <div className="bucket-stats">
        <div className="token-count">
          <span className={`count-current ${getStatusClass()}`}>{current}</span>
          <span className="count-separator">/</span>
          <span className="count-capacity">{capacity}</span>
        </div>
        <div className="token-label">tokens available</div>
      </div>

      {/* Progress bar */}
      <div className="capacity-bar">
        <div
          className={`capacity-fill ${getStatusClass()}`}
          style={{ width: `${fillPercentage}%` }}
        />
        <div className="capacity-markers">
          {[25, 50, 75].map((mark) => (
            <div key={mark} className="marker" style={{ left: `${mark}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default BucketView;
