/**
 * API Configuration – endpoints for the ride-booking + rate-limiter backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const API_ENDPOINTS = {
  // ── ride booking ──
  BOOK: `${API_BASE_URL}/api/book`,
  BOOK_BATCH: `${API_BASE_URL}/api/book/batch`,
  LIMITER_STATE: `${API_BASE_URL}/api/limiter/state`,
  LIMITER_CONFIG: `${API_BASE_URL}/api/limiter/config`,
  METRICS: `${API_BASE_URL}/api/metrics`,

  // ── legacy dashboard ──
  TEST: `${API_BASE_URL}/api/test`,
  STATS_BUCKET: `${API_BASE_URL}/api/stats/bucket`,
  STATS_REQUESTS: `${API_BASE_URL}/api/stats/requests`,
  STATS_RESET: `${API_BASE_URL}/api/stats/reset`,
  STATS_CONFIG: `${API_BASE_URL}/api/stats/config`,
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_ENDPOINTS;
