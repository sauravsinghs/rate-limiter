/**
 * API Service Layer
 * Handles all HTTP requests to the backend rate limiter API
 */

import API_ENDPOINTS from '../config/api';

export interface BucketStats {
  tokens: number;
  capacity: number;
  refillRate: number;
  utilization: string;
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
  tokensRemaining: number;
  bucketCapacity: number;
}

export interface RateLimitError {
  success: false;
  message: string;
  retryAfter: number;
  timestamp: number;
}

/**
 * Send a test request to the rate-limited endpoint
 */
export async function sendTestRequest(): Promise<TestResponse | RateLimitError> {
  const response = await fetch(API_ENDPOINTS.TEST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    return data as RateLimitError;
  }
  
  return data as TestResponse;
}

/**
 * Get current bucket state
 */
export async function getBucketStats(): Promise<BucketStats> {
  const response = await fetch(API_ENDPOINTS.STATS_BUCKET);
  if (!response.ok) {
    throw new Error('Failed to fetch bucket stats');
  }
  return response.json();
}

/**
 * Get request statistics and history
 */
export async function getRequestStats(limit: number = 100): Promise<RequestStats> {
  const response = await fetch(`${API_ENDPOINTS.STATS_REQUESTS}?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch request stats');
  }
  return response.json();
}

/**
 * Reset all statistics and bucket
 */
export async function resetStats(): Promise<void> {
  const response = await fetch(API_ENDPOINTS.STATS_RESET, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to reset stats');
  }
}

/**
 * Update bucket configuration
 */
export async function updateBucketConfig(config: {
  capacity?: number;
  refillRate?: number;
}): Promise<{ message: string; capacity: number; refillRate: number }> {
  const response = await fetch(API_ENDPOINTS.STATS_CONFIG, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
  bucket: {
    tokens: number;
    capacity: number;
    refillRate: number;
  };
}> {
  const response = await fetch(API_ENDPOINTS.HEALTH);
  if (!response.ok) {
    throw new Error('Backend is not healthy');
  }
  return response.json();
}
