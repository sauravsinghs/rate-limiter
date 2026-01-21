import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TokenBucket } from './middleware/tokenBucket.js';
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

// Global token bucket instance (shared across all requests)
const globalTokenBucket = new TokenBucket({
  capacity: parseInt(process.env.BUCKET_CAPACITY || '10'),
  refillRate: parseFloat(process.env.REFILL_RATE || '1.0') // tokens per second
});

// Stats tracking (in-memory for demo, use Redis in production)
export const requestStats = {
  totalRequests: 0,
  allowedRequests: 0,
  blockedRequests: 0,
  history: [] // { timestamp, allowed, blocked }
};

// Protected API endpoint
app.post('/api/test', rateLimiterMiddleware(globalTokenBucket), (req, res) => {
  requestStats.totalRequests++;
  requestStats.allowedRequests++;
  
  const timestamp = Date.now();
  requestStats.history.push({ timestamp, allowed: 1, blocked: 0 });
  
  // Keep only last 1000 entries
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

// Stats endpoint
app.use('/api/stats', statsRouter(globalTokenBucket, requestStats));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bucket: {
      tokens: globalTokenBucket.getTokens(),
      capacity: globalTokenBucket.getCapacity(),
      refillRate: globalTokenBucket.getRefillRate()
    }
  });
});

// Error handler for rate limiting
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
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Token Bucket: ${globalTokenBucket.getCapacity()} tokens, ${globalTokenBucket.getRefillRate()}/sec refill`);
});
