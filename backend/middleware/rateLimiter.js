/**
 * Express middleware factory for Token Bucket rate limiting.
 *
 * Supports both per-user managers (UserBucketManager / RedisBucketManager)
 * and a plain global TokenBucket.
 *
 * When using a per-user manager the userId is read from:
 *   req.body.userId  ||  req.query.userId  ||  req.ip
 *
 * The middleware attaches  req.rateLimitResult = { allowed, tokensLeft, capacity }
 */
export function rateLimiterMiddleware(bucketManager) {
  const isPerUser = typeof bucketManager.tryConsume === 'function'
    && bucketManager.tryConsume.length >= 1          // userId param
    && typeof bucketManager.getState === 'function';

  return async (req, res, next) => {
    try {
      const userId = req.body?.userId || req.query?.userId || req.ip || 'global';

      let result;
      if (isPerUser) {
        // UserBucketManager or RedisBucketManager (may be async)
        result = await bucketManager.tryConsume(userId);
      } else {
        // plain TokenBucket
        result = bucketManager.tryConsume();
      }

      // Attach for downstream handlers
      req.rateLimitResult = {
        allowed: result.allowed,
        tokensLeft: result.tokensRemaining,
        capacity: bucketManager.getDefaults
          ? bucketManager.getDefaults().capacity
          : bucketManager.getCapacity(),
      };

      res.setHeader('X-RateLimit-Remaining', result.tokensRemaining);

      if (!result.allowed) {
        const err = new Error('Rate limit exceeded');
        err.status = 429;
        err.retryAfter = result.retryAfter;
        return next(err);
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}
