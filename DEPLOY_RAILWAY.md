# Railway Deployment

## Build command
`npm install --include=dev --no-audit --no-fund && npm run build`

## Start command
`npm run start`

## Required environment variables
- `PORT` (optional locally; Railway provides it automatically)

## Notes
- This is a Vite SPA compiled to `dist/`.
- Production serving uses `serve -s dist` so client-side routes resolve correctly.
- Node 20 is required (see `package.json` `engines`).
- `railway.toml` explicitly configures Railway to avoid `npm ci` lockfile strictness issues and always install build tooling before building.
