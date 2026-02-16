# RapidGo – Rate Limiter Ride-Booking Demo

A semester project demonstrating how a **Token-Bucket Rate Limiter** works, wrapped inside a ride-booking UI (Rapido/Uber style).

## What it does

1. **Home** – Enter pickup & drop locations.
2. **Book Ride** – Confirm ride details.
3. **System Design Demo** – The app calls the backend `/api/book` endpoint and **visually animates** the token-bucket algorithm (tokens consumed, refilled, retries).
4. **Bill** – If the request is allowed, a booking confirmation is shown.

A floating **Debug Panel** lets you change token-bucket parameters (capacity, refill rate, tokens-per-request) at runtime and observe the effects live.

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 19 + TypeScript, React Router, CSS (dark theme) |
| Backend   | Node.js + Express (ES modules) |
| Algorithm | Token Bucket – per-user, in-memory or Redis-backed |
| Infra     | Docker + docker-compose (frontend, backend, Redis) |

---

## Quick Start (local dev)

```bash
# 1. Install all dependencies (root + backend)
npm run install:all

# 2. Run frontend (port 5173) + backend (port 3001) concurrently
npm run dev:all
```

Open http://localhost:5173 in your browser.

### Backend only

```bash
cd backend
npm run dev          # watches for changes, port 3001
npm test             # runs Jest unit tests
```

---

## Docker (production-like)

```bash
# Spins up frontend (port 3000), backend (port 4000), Redis
docker-compose up --build
```

Open http://localhost:3000.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/book` | Book a ride. Body: `{ userId, pickup, drop, fareEstimate }` |
| `GET`  | `/api/limiter/state?userId=…` | Current bucket state for a user |
| `POST` | `/api/limiter/config` | Update bucket params at runtime |
| `GET`  | `/api/metrics` | Simple JSON metrics (allowed/blocked counts) |
| `GET`  | `/health` | Health check |
| `POST` | `/api/test` | Legacy: single rate-limited test request |
| `GET`  | `/api/stats/bucket` | Legacy: bucket stats for dashboard |
| `GET`  | `/api/stats/requests` | Legacy: request history |

### Example: Book a ride

```bash
curl -X POST http://localhost:3001/api/book \
  -H "Content-Type: application/json" \
  -d '{"userId":"u123","pickup":"Koramangala","drop":"MG Road","fareEstimate":65}'
```

---

## Project Structure

```
rate-limiter/
  backend/
    server.js                  – Express server with all endpoints
    middleware/
      tokenBucket.js           – TokenBucket, UserBucketManager, RedisBucketManager
      rateLimiter.js           – Express middleware
    routes/stats.js            – Legacy stats router
    __tests__/                 – Jest unit tests
  src/                         – React frontend
    pages/
      Home.tsx                 – Ride booking landing
      BookRide.tsx             – Confirm ride details
      SystemDesignDemo.tsx     – Token bucket visualization
      Bill.tsx                 – Booking receipt
      Dashboard.tsx            – Legacy rate-limiter dashboard
    components/
      DebugPanel.tsx           – Floating config/metrics panel
      BucketView.tsx           – Token bucket animation
      …
    styles/ride-theme.css      – Dark theme (Rapido/Uber style)
  design/                      – Design system (CSS variables, docs)
  deploy/                      – Deployment config
  testing/                     – Test plans
  docker-compose.yml           – Docker orchestration
  Dockerfile                   – Multi-stage build
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend listen port |
| `REDIS_URL` | _(empty)_ | Set to `redis://…` for distributed buckets |
| `BUCKET_CAPACITY` | `10` | Default max tokens |
| `REFILL_RATE` | `1.0` | Tokens added per second |
| `TOKENS_PER_REQUEST` | `1` | Tokens consumed per request |
| `VITE_API_URL` | `http://localhost:3001` | Frontend → backend URL |

---

## Team Divisions

- **Design** rate limiter: `design/`
- **Deploy**: `deploy/`
- **Testing**: `testing/`

See each folder README for scope and tasks.
