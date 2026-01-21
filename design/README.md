# Design: Rate Limiter

Owner: Design team

Focus
- Token bucket algorithm details
- API contract for `/api/test` and `/api/stats`
- Frontend data flow (request -> response -> chart)

Key files
- `backend/middleware/tokenBucket.js`
- `backend/middleware/rateLimiter.js`
- `backend/routes/stats.js`
- `src/hooks/useRateLimiter.ts`