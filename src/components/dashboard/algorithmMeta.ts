import type { Algorithm } from "../../services/api";

export const ALGORITHM_LABELS: Record<Algorithm, string> = {
  "token-bucket": "Token Bucket",
  "sliding-window": "Sliding Window",
  "leaky-bucket": "Leaky Bucket",
};

export const ALGORITHM_BADGE_CLASSES: Record<Algorithm, string> = {
  "token-bucket": "algo-badge-tb",
  "sliding-window": "algo-badge-sw",
  "leaky-bucket": "algo-badge-lb",
};

export const ALGORITHM_ORDER: Algorithm[] = [
  "token-bucket",
  "sliding-window",
  "leaky-bucket",
];
