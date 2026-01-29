/**
 * AlgorithmInfo Component
 * Educational content explaining the current rate limiting algorithm
 */

import { useState } from "react";

export interface AlgorithmInfoProps {
  algorithm?:
    | "token-bucket"
    | "sliding-window"
    | "fixed-window"
    | "leaky-bucket";
}

interface AlgorithmDetails {
  name: string;
  shortDescription: string;
  howItWorks: string[];
  pros: string[];
  cons: string[];
  useCases: string[];
}

const ALGORITHM_DETAILS: Record<string, AlgorithmDetails> = {
  "token-bucket": {
    name: "Token Bucket Algorithm",
    shortDescription:
      "A bucket holds tokens that refill at a constant rate. Each request consumes a token. If the bucket is empty, the request is rejected.",
    howItWorks: [
      "The bucket has a maximum capacity (e.g., 10 tokens)",
      "Tokens are added at a fixed rate (e.g., 1 token/second)",
      "Each incoming request removes one token from the bucket",
      "If no tokens are available, the request is rate-limited (HTTP 429)",
      "Tokens cannot exceed the bucket capacity (overflow is discarded)",
    ],
    pros: [
      "Allows controlled bursts of traffic",
      "Smooth rate limiting over time",
      "Simple to understand and implement",
      "Memory efficient (only stores token count)",
    ],
    cons: [
      "Burst size limited by bucket capacity",
      "May not be ideal for strict rate enforcement",
      "Requires careful tuning of capacity and refill rate",
    ],
    useCases: [
      "API rate limiting",
      "Network traffic shaping",
      "Preventing resource exhaustion",
      "Fair usage enforcement",
    ],
  },
  "sliding-window": {
    name: "Sliding Window Algorithm",
    shortDescription:
      "Counts requests within a rolling time window. Provides smoother rate limiting than fixed windows.",
    howItWorks: [
      "Maintains a log of request timestamps",
      "For each new request, counts requests in the last N seconds",
      "If count exceeds limit, request is rejected",
      "Old timestamps are continuously removed",
    ],
    pros: [
      "No boundary burst issues",
      "Very accurate rate limiting",
      "Smooth distribution of requests",
    ],
    cons: [
      "Higher memory usage (stores timestamps)",
      "More CPU intensive",
      "Complex to implement at scale",
    ],
    useCases: [
      "Strict rate enforcement",
      "Financial APIs",
      "High-security applications",
    ],
  },
  "fixed-window": {
    name: "Fixed Window Algorithm",
    shortDescription:
      "Divides time into fixed intervals and counts requests per interval. Simple but allows bursts at boundaries.",
    howItWorks: [
      "Time is divided into fixed windows (e.g., 1-minute intervals)",
      "Each window has a counter starting at zero",
      "Requests increment the counter",
      "Counter resets at the start of each new window",
    ],
    pros: [
      "Very simple to implement",
      "Low memory footprint",
      "Fast execution",
    ],
    cons: [
      "Allows double the rate at window boundaries",
      "Can be unfair to users near window end",
      "Less smooth than other algorithms",
    ],
    useCases: [
      "Simple rate limiting needs",
      "Low-traffic applications",
      "When simplicity is priority",
    ],
  },
  "leaky-bucket": {
    name: "Leaky Bucket Algorithm",
    shortDescription:
      "Requests enter a queue (bucket) and are processed at a constant rate. Excess requests overflow.",
    howItWorks: [
      "Incoming requests are added to a queue",
      "Requests leave the queue at a fixed rate",
      "If queue is full, new requests are dropped",
      "Ensures constant output rate regardless of input",
    ],
    pros: [
      "Guarantees constant processing rate",
      "Smooth output even with bursty input",
      "Good for bandwidth limiting",
    ],
    cons: [
      "Adds latency (queuing)",
      "May drop valid requests during bursts",
      "More complex to implement",
    ],
    useCases: [
      "Network traffic shaping",
      "Video streaming",
      "Constant-rate processing requirements",
    ],
  },
};

export function AlgorithmInfo({
  algorithm = "token-bucket",
}: AlgorithmInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = ALGORITHM_DETAILS[algorithm];

  if (!details) return null;

  return (
    <div className="algorithm-info">
      <div
        className="algorithm-info-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="algorithm-info-title">
          <span className="info-icon">ℹ</span>
          <span>{details.name}</span>
        </div>
        <button
          type="button"
          className="expand-btn"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      <p className="algorithm-short-desc">{details.shortDescription}</p>

      {isExpanded && (
        <div className="algorithm-details">
          <div className="detail-section">
            <h4>How It Works</h4>
            <ol className="detail-list">
              {details.howItWorks.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="detail-columns">
            <div className="detail-section">
              <h4>
                <span className="icon-pros">✓</span> Pros
              </h4>
              <ul className="detail-list pros-list">
                {details.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h4>
                <span className="icon-cons">✗</span> Cons
              </h4>
              <ul className="detail-list cons-list">
                {details.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="detail-section">
            <h4>Common Use Cases</h4>
            <div className="use-cases">
              {details.useCases.map((useCase, i) => (
                <span key={i} className="use-case-tag">
                  {useCase}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlgorithmInfo;
