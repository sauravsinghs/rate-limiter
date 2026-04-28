import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TokenBucket } from './middleware/tokenBucket.js';
import { SlidingWindowCounter } from './middleware/slidingWindowCounter.js';
import { LeakyBucket } from './middleware/leakyBucket.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import { statsRouter } from './routes/stats.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, 'public');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

// Middleware
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser/healthcheck requests and same-origin deployments.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
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
// Algorithm 3: Leaky Bucket
// ========================================
const globalLeakyBucket = new LeakyBucket({
  capacity: parseInt(process.env.LEAKY_CAPACITY || '10'),
  leakRate: parseFloat(process.env.LEAK_RATE || '1.0')
});

export const leakyStats = {
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
// Leaky Bucket endpoint
// ========================================
app.post('/api/test-leaky', (req, res) => {
  const result = globalLeakyBucket.tryConsume();

  if (!result.allowed) {
    leakyStats.totalRequests++;
    leakyStats.blockedRequests++;

    const timestamp = Date.now();
    leakyStats.history.push({ timestamp, allowed: 0, blocked: 1 });
    if (leakyStats.history.length > 1000) {
      leakyStats.history.shift();
    }

    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded (Leaky Bucket)',
      retryAfter: result.retryAfter || 1,
      timestamp,
      currentLevel: result.currentLevel,
      queueRemaining: result.queueRemaining
    });
  }

  leakyStats.totalRequests++;
  leakyStats.allowedRequests++;

  const timestamp = Date.now();
  leakyStats.history.push({ timestamp, allowed: 1, blocked: 0 });
  if (leakyStats.history.length > 1000) {
    leakyStats.history.shift();
  }

  res.json({
    success: true,
    message: 'Request accepted into leaky queue',
    timestamp,
    currentLevel: result.currentLevel,
    queueRemaining: result.queueRemaining,
    leakRate: globalLeakyBucket.getLeakRate(),
    capacity: globalLeakyBucket.getCapacity()
  });
});

// ========================================
// Stats endpoints
// ========================================
app.use('/api/stats', statsRouter(globalTokenBucket, requestStats));
app.use('/api/stats-sliding', statsRouter(globalSlidingWindow, slidingStats, 'sliding-window'));
app.use('/api/stats-leaky', statsRouter(globalLeakyBucket, leakyStats, 'leaky-bucket'));

function buildHealthPayload() {
  return {
    status: 'healthy',
    tokenBucket: {
      tokens: globalTokenBucket.getTokens(),
      capacity: globalTokenBucket.getCapacity(),
      refillRate: globalTokenBucket.getRefillRate()
    },
    slidingWindow: globalSlidingWindow.getStats(),
    leakyBucket: globalLeakyBucket.getStats()
  };
}

// Health checks
app.get('/health', (req, res) => {
  res.json(buildHealthPayload());
});

app.get('/api/health', (req, res) => {
  res.json(buildHealthPayload());
});

// Serve built frontend when available (production container/runtime).
if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      next();
      return;
    }
    res.sendFile(frontendIndexPath);
  });
}

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
  console.log(`Leaky Bucket: ${globalLeakyBucket.getCapacity()} queue capacity, ${globalLeakyBucket.getLeakRate()}/sec leak`);
  console.log(`Static frontend bundle found: ${fs.existsSync(frontendIndexPath) ? 'yes' : 'no'} (${frontendIndexPath})`);
  console.log('Health endpoints enabled: /health, /api/health');
});
