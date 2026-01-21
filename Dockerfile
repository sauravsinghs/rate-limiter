# Multi-stage build for production deployment

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --production
COPY backend .

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend ./backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Install serve for frontend
RUN npm install -g serve

# Expose ports
EXPOSE 3001

# Start both services
WORKDIR /app/backend
CMD ["sh", "-c", "node server.js & serve -s ../public -l 3000 & wait"]
