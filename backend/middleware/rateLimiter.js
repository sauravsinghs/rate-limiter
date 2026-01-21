import { TokenBucket } from './tokenBucket.js';

/**
 * Express middleware factory for Token Bucket rate limiting
 * 
 * Usage:
 *   app.post('/api/test', rateLimiterMiddleware(tokenBucket), handler);
 */
export function rateLimiterMiddleware(tokenBucket) {
  return (req, res, next) => {
    const result = tokenBucket.tryConsume();

    if (!result.allowed) {
      const err = new Error('Rate limit exceeded');
      err.status = 429;
      err.retryAfter = result.retryAfter;
      return next(err);
    }

    // Add bucket info to response headers (optional, for client awareness)
    res.setHeader('X-RateLimit-Remaining', result.tokensRemaining);
    res.setHeader('X-RateLimit-Capacity', tokenBucket.getCapacity());
    
    next();
  };
}
