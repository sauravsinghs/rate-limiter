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
- Health path: `/health`
- Expected HTTP: `200`

### 4) GitHub Actions secrets for auto deploy
Add repository secrets:
- `RENDER_DEPLOY_HOOK_URL` -> Render deploy hook URL
- `RENDER_HEALTHCHECK_URL` -> `https://<your-render-domain>/health` (optional but recommended)

The deploy workflow will:
1. Run tests/build
2. Trigger Render deploy hook on push to `main/master`
3. Poll health URL if `RENDER_HEALTHCHECK_URL` is set