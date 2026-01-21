/**
 * Custom React Hook for Rate Limiter Dashboard
 * Manages state and polling for real-time visualization
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getBucketStats,
    getRequestStats,
    resetStats,
    sendTestRequest,
    updateBucketConfig,
    type BucketStats,
    type RateLimitError,
    type RequestStats,
    type TestResponse
} from '../services/api';

interface UseRateLimiterOptions {
  pollInterval?: number; // milliseconds
  historyLimit?: number;
}

export function useRateLimiter(options: UseRateLimiterOptions = {}) {
  const { pollInterval = 500, historyLimit = 100 } = options;

  const [bucketStats, setBucketStats] = useState<BucketStats | null>(null);
  const [requestStats, setRequestStats] = useState<RequestStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<TestResponse | RateLimitError | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch bucket stats
  const fetchBucketStats = useCallback(async () => {
    try {
      const stats = await getBucketStats();
      setBucketStats(stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket stats');
    }
  }, []);

  // Fetch request stats
  const fetchRequestStats = useCallback(async () => {
    try {
      const stats = await getRequestStats(historyLimit);
      setRequestStats(stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch request stats');
    }
  }, [historyLimit]);

  // Send a test request
  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sendTestRequest();
      setLastResponse(response);
      
      // Immediately refresh stats after request
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send request';
      setError(errorMessage);
      setLastResponse({
        success: false,
        message: errorMessage,
        retryAfter: 0,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchBucketStats, fetchRequestStats]);

  // Send multiple requests (burst simulation)
  const sendBurst = useCallback(async (count: number = 10, delay: number = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const promises = Array.from({ length: count }, (_, i) =>
        new Promise<void>((resolve) => {
          setTimeout(async () => {
            await sendTestRequest();
            resolve();
          }, i * delay);
        })
      );

      await Promise.all(promises);
      
      // Refresh stats after burst
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send burst');
    } finally {
      setIsLoading(false);
    }
  }, [fetchBucketStats, fetchRequestStats]);

  // Reset stats
  const reset = useCallback(async () => {
    try {
      await resetStats();
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
      setLastResponse(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    }
  }, [fetchBucketStats, fetchRequestStats]);

  // Update bucket config
  const updateConfig = useCallback(async (config: { capacity?: number; refillRate?: number }) => {
    try {
      await updateBucketConfig(config);
      await fetchBucketStats();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
    }
  }, [fetchBucketStats]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling

    const poll = async () => {
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
    };

    poll(); // Initial fetch
    pollingRef.current = setInterval(poll, pollInterval);
  }, [pollInterval, fetchBucketStats, fetchRequestStats]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Auto-start polling on mount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return {
    bucketStats,
    requestStats,
    isLoading,
    error,
    lastResponse,
    sendRequest,
    sendBurst,
    reset,
    updateConfig,
    refresh: () => Promise.all([fetchBucketStats(), fetchRequestStats()]),
    startPolling,
    stopPolling
  };
}
