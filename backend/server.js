import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TokenBucket } from './middleware/tokenBucket.js';
import { SlidingWindowCounter } from './middleware/slidingWindowCounter.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import { statsRouter } from './routes/stats.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ========================================
// Algorithm 1: Token Bucket
// ========================================
const globalTokenBucket = new TokenBucket({
  capacity: parseInt(process.env.BUCKET_CAPACITY || '10'),
  refillRate: parseFloat(process.env.REFILL_RATE || '1.0')
});

export const requestStats = {
  totalRequests: 0,
  allowedRequests: 0,
  blockedRequests: 0,
  history: []
};

// ========================================
// Algorithm 2: Sliding Window Counter
// ========================================
const globalSlidingWindow = new SlidingWindowCounter({
  windowSize: parseInt(process.env.WINDOW_SIZE || '5000'), // 5 seconds
  maxRequests: parseInt(process.env.MAX_REQUESTS || '10')
});

export const slidingStats = {
  totalRequests: 0,
  allowedRequests: 0,
  blockedRequests: 0,
  history: []
};

// ========================================
// Token Bucket endpoint
// ========================================
app.post('/api/test', rateLimiterMiddleware(globalTokenBucket), (req, res) => {
  requestStats.totalRequests++;
  requestStats.allowedRequests++;

  const timestamp = Date.now();
  requestStats.history.push({ timestamp, allowed: 1, blocked: 0 });

  if (requestStats.history.length > 1000) {
    requestStats.history.shift();
  }

  res.json({
    success: true,
    message: 'Request processed successfully',
    timestamp,
    tokensRemaining: globalTokenBucket.getTokens(),
    bucketCapacity: globalTokenBucket.getCapacity()
  });
});

// ========================================
// Sliding Window endpoint
// ========================================
app.post('/api/test-sliding', (req, res, next) => {
  const result = globalSlidingWindow.tryConsume();

  if (!result.allowed) {
    slidingStats.totalRequests++;
    slidingStats.blockedRequests++;

    const timestamp = Date.now();
    slidingStats.history.push({ timestamp, allowed: 0, blocked: 1 });

    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded (Sliding Window)',
      retryAfter: result.retryAfter || 1,
      timestamp,
      currentCount: result.currentCount,
      windowRemaining: result.windowRemaining
    });
  }

  slidingStats.totalRequests++;
  slidingStats.allowedRequests++;

  const timestamp = Date.now();
  slidingStats.history.push({ timestamp, allowed: 1, blocked: 0 });

  if (slidingStats.history.length > 1000) {
    slidingStats.history.shift();
  }

  res.json({
    success: true,
    message: 'Request processed successfully (Sliding Window)',
    timestamp,
    currentCount: result.currentCount,
    windowRemaining: result.windowRemaining,
    maxRequests: globalSlidingWindow.getMaxRequests()
  });
});

// ========================================
// Stats endpoints
// ========================================
app.use('/api/stats', statsRouter(globalTokenBucket, requestStats));
app.use('/api/stats-sliding', statsRouter(globalSlidingWindow, slidingStats, 'sliding-window'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tokenBucket: {
      tokens: globalTokenBucket.getTokens(),
      capacity: globalTokenBucket.getCapacity(),
      refillRate: globalTokenBucket.getRefillRate()
    },
    slidingWindow: globalSlidingWindow.getStats()
  });
});

// Error handler for rate limiting (Token Bucket 429s)
app.use((err, req, res, next) => {
  if (err.status === 429) {
    requestStats.totalRequests++;
    requestStats.blockedRequests++;

    const timestamp = Date.now();
    requestStats.history.push({ timestamp, allowed: 0, blocked: 1 });

    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      retryAfter: err.retryAfter || 1,
      timestamp
    });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Token Bucket: ${globalTokenBucket.getCapacity()} tokens, ${globalTokenBucket.getRefillRate()}/sec refill`);
  console.log(`Sliding Window: ${globalSlidingWindow.getMaxRequests()} requests per ${globalSlidingWindow.getWindowSize()}ms window`);
});
