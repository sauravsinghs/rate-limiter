/**
 * API Service Layer
 * Handles all HTTP requests to the backend rate limiter API
 * Supports both Token Bucket and Sliding Window algorithms
 */

import API_ENDPOINTS from '../config/api';

export type Algorithm = 'token-bucket' | 'sliding-window' | 'leaky-bucket';

export interface BucketStats {
  tokens: number;
  capacity: number;
  refillRate: number;
  utilization: string;
  algorithm?: string;
  windowSize?: number;
  currentCount?: number;
  leakRate?: number;
  currentLevel?: number;
  queueRemaining?: number;
}

export interface RequestStats {
  total: number;
  allowed: number;
  blocked: number;
  successRate: string;
  history: Array<{
    timestamp: number;
    allowed: number;
    blocked: number;
  }>;
}

export interface TestResponse {
  success: boolean;
  message: string;
  timestamp: number;
  tokensRemaining?: number;
  bucketCapacity?: number;
  currentCount?: number;
  windowRemaining?: number;
  maxRequests?: number;
  currentLevel?: number;
  queueRemaining?: number;
  leakRate?: number;
  capacity?: number;
}

export interface RateLimitError {
  success: false;
  message: string;
  retryAfter: number;
  timestamp: number;
}

/**
 * Get endpoints for a given algorithm
 */
function getEndpoints(algorithm: Algorithm) {
  if (algorithm === 'sliding-window') {
    return {
      test: API_ENDPOINTS.TEST_SLIDING,
      bucket: API_ENDPOINTS.STATS_SLIDING_BUCKET,
      requests: API_ENDPOINTS.STATS_SLIDING_REQUESTS,
      reset: API_ENDPOINTS.STATS_SLIDING_RESET,
      config: API_ENDPOINTS.STATS_SLIDING_CONFIG
    };
  }
  if (algorithm === 'leaky-bucket') {
    return {
      test: API_ENDPOINTS.TEST_LEAKY,
      bucket: API_ENDPOINTS.STATS_LEAKY_BUCKET,
      requests: API_ENDPOINTS.STATS_LEAKY_REQUESTS,
      reset: API_ENDPOINTS.STATS_LEAKY_RESET,
      config: API_ENDPOINTS.STATS_LEAKY_CONFIG,
    };
  }
  return {
    test: API_ENDPOINTS.TEST,
    bucket: API_ENDPOINTS.STATS_BUCKET,
    requests: API_ENDPOINTS.STATS_REQUESTS,
    reset: API_ENDPOINTS.STATS_RESET,
    config: API_ENDPOINTS.STATS_CONFIG
  };
}

/**
 * Send a test request to the rate-limited endpoint
 */
export async function sendTestRequest(algorithm: Algorithm = 'token-bucket'): Promise<TestResponse | RateLimitError> {
  const endpoints = getEndpoints(algorithm);
  const response = await fetch(endpoints.test, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();

  if (!response.ok) {
    return data as RateLimitError;
  }

  return data as TestResponse;
}

/**
 * Get current bucket/window state
 */
export async function getBucketStats(algorithm: Algorithm = 'token-bucket'): Promise<BucketStats> {
  const endpoints = getEndpoints(algorithm);
  const response = await fetch(endpoints.bucket);
  if (!response.ok) {
    throw new Error('Failed to fetch bucket stats');
  }
  return response.json();
}

/**
 * Get request statistics and history
 */
export async function getRequestStats(limit: number = 100, algorithm: Algorithm = 'token-bucket'): Promise<RequestStats> {
  const endpoints = getEndpoints(algorithm);
  const response = await fetch(`${endpoints.requests}?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch request stats');
  }
  return response.json();
}

/**
 * Reset all statistics and limiter
 */
export async function resetStats(algorithm: Algorithm = 'token-bucket'): Promise<void> {
  const endpoints = getEndpoints(algorithm);
  const response = await fetch(endpoints.reset, { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to reset stats');
  }
}

/**
 * Reset both algorithms at once
 */
export async function resetAllStats(): Promise<void> {
  await Promise.all([
    resetStats('token-bucket'),
    resetStats('sliding-window'),
    resetStats('leaky-bucket'),
  ]);
}

/**
 * Update bucket/window configuration
 */
export async function updateBucketConfig(config: {
  capacity?: number;
  refillRate?: number;
  maxRequests?: number;
  windowSize?: number;
  leakRate?: number;
}, algorithm: Algorithm = 'token-bucket'): Promise<{
  message: string;
  capacity?: number;
  refillRate?: number;
  maxRequests?: number;
  windowSize?: number;
  leakRate?: number;
}> {
  const endpoints = getEndpoints(algorithm);
  const response = await fetch(endpoints.config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update config');
  }

  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{
  status: string;
  tokenBucket: { tokens: number; capacity: number; refillRate: number };
  slidingWindow: { currentCount: number; maxRequests: number; windowSize: number };
}> {
  const response = await fetch(API_ENDPOINTS.HEALTH);
  if (!response.ok) {
    throw new Error('Backend is not healthy');
  }
  return response.json();
}
