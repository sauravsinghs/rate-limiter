/**
 * Custom React Hook for Rate Limiter Dashboard
 * Manages state and polling for real-time visualization
 * Supports both Token Bucket and Sliding Window algorithms
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBucketStats,
  getRequestStats,
  resetStats,
  sendTestRequest,
  updateBucketConfig,
  type Algorithm,
  type BucketStats,
  type RateLimitError,
  type RequestStats,
  type TestResponse,
} from "../services/api";

interface UseRateLimiterOptions {
  pollInterval?: number;
  historyLimit?: number;
  algorithm?: Algorithm;
}

export function useRateLimiter(options: UseRateLimiterOptions = {}) {
  const { pollInterval = 500, historyLimit = 100, algorithm = 'token-bucket' } = options;

  const [bucketStats, setBucketStats] = useState<BucketStats | null>(null);
  const [requestStats, setRequestStats] = useState<RequestStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<
    TestResponse | RateLimitError | null
  >(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBucketStats = useCallback(async () => {
    try {
      const stats = await getBucketStats(algorithm);
      setBucketStats(stats);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch bucket stats",
      );
    }
  }, [algorithm]);

  const fetchRequestStats = useCallback(async () => {
    try {
      const stats = await getRequestStats(historyLimit, algorithm);
      setRequestStats(stats);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch request stats",
      );
    }
  }, [historyLimit, algorithm]);

  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendTestRequest(algorithm);
      setLastResponse(response);
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send request";
      setError(errorMessage);
      setLastResponse({
        success: false,
        message: errorMessage,
        retryAfter: 0,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, fetchBucketStats, fetchRequestStats]);

  const sendBurst = useCallback(
    async (count: number = 10, delay: number = 50) => {
      setIsLoading(true);
      setError(null);

      try {
        for (let i = 0; i < count; i++) {
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          const response = await sendTestRequest(algorithm);
          setLastResponse(response);
        }

        await Promise.all([fetchBucketStats(), fetchRequestStats()]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send burst";
        setError(errorMessage);
        setLastResponse({
          success: false,
          message: errorMessage,
          retryAfter: 0,
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [algorithm, fetchBucketStats, fetchRequestStats],
  );

  const reset = useCallback(async () => {
    try {
      await resetStats(algorithm);
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
      setLastResponse(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset");
    }
  }, [algorithm, fetchBucketStats, fetchRequestStats]);

  const updateConfig = useCallback(
    async (config: { capacity?: number; refillRate?: number }) => {
      try {
        await updateBucketConfig(config, algorithm);
        await fetchBucketStats();
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update config",
        );
      }
    },
    [algorithm, fetchBucketStats],
  );

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    const poll = async () => {
      await Promise.all([fetchBucketStats(), fetchRequestStats()]);
    };

    poll();
    pollingRef.current = setInterval(poll, pollInterval);
  }, [pollInterval, fetchBucketStats, fetchRequestStats]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

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
    stopPolling,
  };
}
