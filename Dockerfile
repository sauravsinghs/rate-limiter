# ============================================================
# Multi-stage Dockerfile for rate-limiter ride-booking demo
# ============================================================

# ── Stage 1: Build frontend ─────────────────────────────────
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Point API calls at the backend container (port 4000)
ENV VITE_API_URL=http://localhost:4000
RUN npm run build

# ── Stage 2: Install backend deps ───────────────────────────
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --production

# ── Stage 3: Backend runner ─────────────────────────────────
FROM node:18-alpine AS backend-runner
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ .
EXPOSE 4000
CMD ["node", "server.js"]

# ── Stage 4: Frontend runner (serve static files) ───────────
FROM node:18-alpine AS frontend-runner
RUN npm install -g serve
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
