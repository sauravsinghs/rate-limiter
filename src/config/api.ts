/**
 * API Configuration
 * Centralized API endpoint configuration for connecting to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Token Bucket endpoints
  TEST: `${API_BASE_URL}/api/test`,
  STATS_BUCKET: `${API_BASE_URL}/api/stats/bucket`,
  STATS_REQUESTS: `${API_BASE_URL}/api/stats/requests`,
  STATS_RESET: `${API_BASE_URL}/api/stats/reset`,
  STATS_CONFIG: `${API_BASE_URL}/api/stats/config`,

  // Sliding Window endpoints
  TEST_SLIDING: `${API_BASE_URL}/api/test-sliding`,
  STATS_SLIDING_BUCKET: `${API_BASE_URL}/api/stats-sliding/bucket`,
  STATS_SLIDING_REQUESTS: `${API_BASE_URL}/api/stats-sliding/requests`,
  STATS_SLIDING_RESET: `${API_BASE_URL}/api/stats-sliding/reset`,
  STATS_SLIDING_CONFIG: `${API_BASE_URL}/api/stats-sliding/config`,

  HEALTH: `${API_BASE_URL}/health`
};

export default API_ENDPOINTS;
