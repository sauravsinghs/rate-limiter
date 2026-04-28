# Deploy

Owner: Deploy team

Focus
- Dockerfile + docker-compose usage
- Environment variables
- CI/CD workflow (`.github/workflows/deploy.yml`)

Key files
- `Dockerfile`
- `docker-compose.yml`
- `.github/workflows/deploy.yml`

## Render (single-container) quick start

This project is configured to run frontend + backend from one Docker image.

### 1) Create Render service
- Render Dashboard -> New -> Web Service
- Connect this GitHub repo
- Runtime: `Docker`
- Branch: `main` (or your default deploy branch)

### 2) Environment variables
Set these in Render service settings:
- `NODE_ENV=production`
- `FRONTEND_URL=https://<your-render-domain>`
- `BUCKET_CAPACITY=10`
- `REFILL_RATE=1.0`
- Optional:
  - `WINDOW_SIZE`, `MAX_REQUESTS`
  - `LEAKY_CAPACITY`, `LEAK_RATE`

Do not set `PORT`; Render injects it automatically.

### 3) Health endpoint
- Preferred health path: `/api/health`
- Also available: `/health`
- Expected HTTP: `200`

### 4) GitHub Actions secrets for auto deploy
Add repository secrets:
- `RENDER_DEPLOY_HOOK_URL` -> Render deploy hook URL
- `RENDER_HEALTHCHECK_URL` -> `https://<your-render-domain>/api/health` (optional but recommended)
- Optional fallback: `RENDER_SERVICE_URL` -> `https://<your-render-domain>` (workflow appends `/api/health`)

The deploy workflow will:
1. Run tests/build
2. Trigger Render deploy hook on push to `main/master`
3. Poll health URL if `RENDER_HEALTHCHECK_URL` is set

### Troubleshooting: health returns 404
- If app root works but `/health` returns `Not Found`, check `/api/health`.
- Trigger **Manual Deploy -> Clear build cache & deploy** in Render.
- Recheck logs for startup lines showing enabled health endpoints.