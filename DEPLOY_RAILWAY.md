# Railway Deployment

This repository is configured to deploy via the included `Dockerfile`.

## Build command
No custom Railway build command is needed (Docker build handles install + build).

## Start command
No custom Railway start command is needed (container `CMD` starts the app).

## Required environment variables
- `PORT` (optional locally; Railway provides it automatically)

## Notes
- App type: Vite single-page app (SPA).
- The Docker build installs dependencies, runs `npm run build`, and serves `dist/` with SPA fallback via `serve -s dist`.
- Node 20 is used in both build and runtime container stages.
- If Railway still has old service settings, clear custom build/start commands so Dockerfile is used directly.
