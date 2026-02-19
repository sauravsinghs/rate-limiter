import { Router } from 'express';

/**
 * Generic stats router - works with both Token Bucket and Sliding Window
 * @param {Object} limiter - Rate limiter instance (TokenBucket or SlidingWindowCounter)
 * @param {Object} requestStats - Stats tracking object
 * @param {string} type - 'token-bucket' or 'sliding-window'
 */
export function statsRouter(limiter, requestStats, type = 'token-bucket') {
  const router = Router();

  // Get current limiter state
  router.get('/bucket', (req, res) => {
    if (type === 'sliding-window') {
      const stats = limiter.getStats();
      res.json({
        tokens: stats.windowRemaining,      // available capacity
        capacity: stats.maxRequests,         // max per window
        refillRate: stats.maxRequests / (stats.windowSize / 1000), // effective rate
        utilization: stats.utilization,
        algorithm: 'sliding-window',
        windowSize: stats.windowSize,
        currentCount: stats.currentCount
      });
    } else {
      res.json({
        tokens: limiter.getTokens(),
        capacity: limiter.getCapacity(),
        refillRate: limiter.getRefillRate(),
        utilization: ((limiter.getCapacity() - limiter.getTokens()) / limiter.getCapacity() * 100).toFixed(2),
        algorithm: 'token-bucket'
      });
    }
  });

  // Get request statistics
  router.get('/requests', (req, res) => {
    const { limit = 100 } = req.query;

    res.json({
      total: requestStats.totalRequests,
      allowed: requestStats.allowedRequests,
      blocked: requestStats.blockedRequests,
      successRate: requestStats.totalRequests > 0
        ? ((requestStats.allowedRequests / requestStats.totalRequests) * 100).toFixed(2)
        : 0,
      history: requestStats.history.slice(-parseInt(limit))
    });
  });

  // Reset stats
  router.post('/reset', (req, res) => {
    requestStats.totalRequests = 0;
    requestStats.allowedRequests = 0;
    requestStats.blockedRequests = 0;
    requestStats.history = [];
    limiter.reset();

    res.json({ message: 'Stats and limiter reset successfully' });
  });

  // Update configuration dynamically
  router.post('/config', (req, res) => {
    const { capacity, refillRate } = req.body;

    if (type === 'sliding-window') {
      // For sliding window, capacity = maxRequests
      if (capacity !== undefined) {
        limiter.maxRequests = capacity;
      }
      res.json({
        message: 'Sliding window configuration updated',
        maxRequests: limiter.getMaxRequests(),
        windowSize: limiter.getWindowSize()
      });
    } else {
      if (capacity !== undefined && (isNaN(capacity) || capacity < 1)) {
        return res.status(400).json({ error: 'Invalid capacity (must be >= 1)' });
      }
      if (refillRate !== undefined && (isNaN(refillRate) || refillRate <= 0)) {
        return res.status(400).json({ error: 'Invalid refillRate (must be > 0)' });
      }

      limiter.updateConfig({ capacity, refillRate });

      res.json({
        message: 'Bucket configuration updated',
        capacity: limiter.getCapacity(),
        refillRate: limiter.getRefillRate()
      });
    }
  });

  return router;
}
