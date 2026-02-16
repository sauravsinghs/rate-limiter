import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TokenBucket, UserBucketManager, RedisBucketManager } from './middleware/tokenBucket.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import { statsRouter } from './routes/stats.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ── Bucket Manager (per-user) ─────────────────────────────
const bucketDefaults = {
  capacity: parseInt(process.env.BUCKET_CAPACITY || '10'),
  refillRate: parseFloat(process.env.REFILL_RATE || '1.0'),
  tokensPerRequest: parseInt(process.env.TOKENS_PER_REQUEST || '1'),
};

let bucketManager;       // UserBucketManager | RedisBucketManager
let redisClient = null;

async function initBucketManager() {
  if (process.env.REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis');
      redisClient = new Redis(process.env.REDIS_URL);
      await redisClient.ping();
      bucketManager = new RedisBucketManager(redisClient, bucketDefaults);
      console.log('✅ Using Redis-backed token buckets');
      return;
    } catch (err) {
      console.warn('⚠️  Redis unavailable, falling back to in-memory:', err.message);
    }
  }
  bucketManager = new UserBucketManager(bucketDefaults);
  console.log('📦 Using in-memory token buckets');
}

// ── Metrics ───────────────────────────────────────────────
export const requestStats = {
  totalRequests: 0,
  allowedRequests: 0,
  blockedRequests: 0,
  history: [],
};

function recordRequest(allowed) {
  requestStats.totalRequests++;
  if (allowed) requestStats.allowedRequests++;
  else requestStats.blockedRequests++;
  requestStats.history.push({ timestamp: Date.now(), allowed: allowed ? 1 : 0, blocked: allowed ? 0 : 1 });
  if (requestStats.history.length > 1000) requestStats.history.shift();
}

// ── Booking helper ────────────────────────────────────────
function makeBooking({ userId, pickup, drop, fareEstimate, rideId }) {
  const driverNames = ['Rahul S.', 'Priya M.', 'Amit K.', 'Deepa R.', 'Vijay T.'];
  const vehicles    = ['Honda Activa', 'TVS Jupiter', 'Bajaj Pulsar', 'Royal Enfield', 'Ola S1'];
  return {
    bookingId: `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    userId,
    pickup: pickup || 'Unknown',
    drop: drop || 'Unknown',
    fareEstimate: fareEstimate || Math.floor(Math.random() * 200 + 50),
    rideId: rideId || `RIDE-${Math.random().toString(36).slice(2, 7)}`,
    status: 'confirmed',
    driver: {
      name: driverNames[Math.floor(Math.random() * driverNames.length)],
      vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
      rating: (4 + Math.random()).toFixed(1),
      eta: Math.floor(Math.random() * 8 + 2),
    },
    timestamp: Date.now(),
  };
}

// ── A global TokenBucket for the legacy /api/test endpoint ──
const globalTokenBucket = new TokenBucket({ ...bucketDefaults });

// Legacy endpoint (kept for the existing visualization dashboard)
app.post('/api/test', rateLimiterMiddleware(globalTokenBucket), (req, res) => {
  recordRequest(true);
  res.json({
    success: true,
    message: 'Request processed successfully',
    timestamp: Date.now(),
    tokensRemaining: globalTokenBucket.getTokens(),
    bucketCapacity: globalTokenBucket.getCapacity(),
  });
});

// ── POST /api/book (single ride) ──────────────────────────
app.post('/api/book', async (req, res, next) => {
  const { userId, pickup, drop, fareEstimate, rideId } = req.body || {};

  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

  try {
    const result = await bucketManager.tryConsume(userId);

    req.rateLimitResult = {
      allowed: result.allowed,
      tokensLeft: result.tokensRemaining,
      capacity: bucketManager.getDefaults().capacity,
    };

    recordRequest(result.allowed);

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded – too many booking requests',
        retryAfter: result.retryAfter,
        tokensLeft: result.tokensRemaining,
        capacity: bucketManager.getDefaults().capacity,
        timestamp: Date.now(),
      });
    }

    const booking = makeBooking({ userId, pickup, drop, fareEstimate, rideId });

    return res.json({
      success: true,
      message: 'Ride booked successfully!',
      booking,
      tokensLeft: result.tokensRemaining,
      capacity: bucketManager.getDefaults().capacity,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/book/batch – book N rides, show which passed / throttled ──
app.post('/api/book/batch', async (req, res, next) => {
  const { userId, pickup, drop, count = 1 } = req.body || {};

  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

  const n = Math.min(Math.max(parseInt(count) || 1, 1), 50); // clamp 1-50
  const results = [];

  try {
    for (let i = 0; i < n; i++) {
      const result = await bucketManager.tryConsume(userId);
      recordRequest(result.allowed);

      if (result.allowed) {
        const fare = Math.floor(Math.random() * 150 + 50);
        const booking = makeBooking({
          userId,
          pickup: pickup || 'Unknown',
          drop: drop || 'Unknown',
          fareEstimate: fare,
          rideId: `RIDE-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
        });
        results.push({
          index: i + 1,
          allowed: true,
          booking,
          tokensLeft: result.tokensRemaining,
        });
      } else {
        results.push({
          index: i + 1,
          allowed: false,
          booking: null,
          tokensLeft: result.tokensRemaining,
          retryAfter: result.retryAfter,
        });
      }
    }

    const state = await bucketManager.getState(userId);
    const allowed = results.filter(r => r.allowed);
    const blocked = results.filter(r => !r.allowed);

    return res.json({
      success: true,
      totalRequested: n,
      totalAllowed: allowed.length,
      totalBlocked: blocked.length,
      results,
      bucketState: state,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/limiter/state?userId=... ─────────────────────
app.get('/api/limiter/state', async (req, res) => {
  const userId = req.query.userId || 'global';
  try {
    const state = await bucketManager.getState(userId);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Could not retrieve bucket state' });
  }
});

// ── GET /api/metrics ──────────────────────────────────────
app.get('/api/metrics', (_req, res) => {
  res.json({
    requestsAllowed: requestStats.allowedRequests,
    requestsBlocked: requestStats.blockedRequests,
    totalRequests: requestStats.totalRequests,
    successRate: requestStats.totalRequests > 0
      ? ((requestStats.allowedRequests / requestStats.totalRequests) * 100).toFixed(2) + '%'
      : '100%',
  });
});

// ── POST /api/limiter/config (debug: change params at runtime) ──
app.post('/api/limiter/config', (req, res) => {
  const { capacity, refillRate, tokensPerRequest } = req.body;
  const update = {};
  if (capacity !== undefined)        update.capacity = Number(capacity);
  if (refillRate !== undefined)       update.refillRate = Number(refillRate);
  if (tokensPerRequest !== undefined) update.tokensPerRequest = Number(tokensPerRequest);
  bucketManager.updateConfig(update);
  // Also update the global legacy bucket
  globalTokenBucket.updateConfig(update);
  res.json({ message: 'Config updated', ...bucketManager.getDefaults() });
});

// ── Stats routes (legacy dashboard) ───────────────────────
app.use('/api/stats', statsRouter(globalTokenBucket, requestStats));

// ── Health ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    redis: !!redisClient,
    bucket: bucketManager.getDefaults(),
  });
});

// ── Error handler (429) ──────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.status === 429) {
    recordRequest(false);
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      retryAfter: err.retryAfter || 1,
      timestamp: Date.now(),
    });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────
(async () => {
  await initBucketManager();
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Token Bucket defaults:`, bucketManager.getDefaults());
  });
})();
