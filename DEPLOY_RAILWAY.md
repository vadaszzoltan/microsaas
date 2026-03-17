# Railway Deployment

## Build command
`npm run build`

## Start command
`npm run start`

## Required environment variables
- `PORT` (optional locally; Railway provides it automatically)

## Notes
- This is a Vite SPA compiled to `dist/`.
- The app is served in production with `serve -s dist` for SPA route fallback.
- Node 20 is required (see `package.json` `engines` and `nixpacks.toml`).
