# Rate Limiter

Rate limiter demo app with separate frontend and backend projects.

## Project Structure
- `frontend/` - React + Vite client app
- `backend/` - Express API server
- `.github/workflows/` - CI/CD workflows
- `deploy/` - deployment notes
- `Dockerfile` and `docker-compose.yml` - container setup

## Prerequisites
- Node.js 18+
- npm 9+
- Docker Desktop (optional, for containerized run)

## Local Development

1. Install dependencies (run once):
   - `cd frontend && npm install`
   - `cd ../backend && npm install`

2. Start backend:
   - `cd backend && npm run dev`
   - API runs on `http://localhost:3001`

3. Start frontend in a separate terminal:
   - `cd frontend && npm run dev`
   - App runs on `http://localhost:5173` (default Vite port)

## Build
- Frontend production build:
  - `cd frontend && npm run build`
- Backend production start:
  - `cd backend && npm start`

## Docker Run
- Build and run:
  - `docker compose up --build`
- Services:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:3001`

## CI/CD Notes
- Workflow file: `.github/workflows/deploy.yml`
- Frontend install/build is executed from `frontend/`
- Backend install/test is executed from `backend/`
