import { Router } from 'express';

/**
 * Stats router - provides real-time rate limiter statistics
 * Used by frontend dashboard to visualize traffic patterns
 */
export function statsRouter(tokenBucket, requestStats) {
  const router = Router();

  // Get current bucket state
  router.get('/bucket', (req, res) => {
    res.json({
      tokens: tokenBucket.getTokens(),
      capacity: tokenBucket.getCapacity(),
      refillRate: tokenBucket.getRefillRate(),
      utilization: ((tokenBucket.getCapacity() - tokenBucket.getTokens()) / tokenBucket.getCapacity() * 100).toFixed(2)
    });
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

  // Reset stats (for testing/demo purposes)
  router.post('/reset', (req, res) => {
    requestStats.totalRequests = 0;
    requestStats.allowedRequests = 0;
    requestStats.blockedRequests = 0;
    requestStats.history = [];
    tokenBucket.reset();
    
    res.json({ message: 'Stats and bucket reset successfully' });
  });

  // Update bucket configuration dynamically
  router.post('/config', (req, res) => {
    const { capacity, refillRate } = req.body;
    
    if (capacity !== undefined && (isNaN(capacity) || capacity < 1)) {
      return res.status(400).json({ error: 'Invalid capacity (must be >= 1)' });
    }
    
    if (refillRate !== undefined && (isNaN(refillRate) || refillRate <= 0)) {
      return res.status(400).json({ error: 'Invalid refillRate (must be > 0)' });
    }

    tokenBucket.updateConfig({ capacity, refillRate });
    
    res.json({
      message: 'Bucket configuration updated',
      capacity: tokenBucket.getCapacity(),
      refillRate: tokenBucket.getRefillRate()
    });
  });

  return router;
}
