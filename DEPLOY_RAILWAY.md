# Railway Deployment

## Build command
`npm run build`

## Start command
`npm run start`

## Required environment variables
- `PORT` (optional locally; Railway provides it automatically)

## Notes
- This is a Vite SPA compiled to `dist/`.
- Production serving uses `serve -s dist` so client-side routes resolve correctly.
- Node 20 is required (see `package.json` `engines` and `nixpacks.toml`).
- In Railway/Nixpacks this repository installs with `npm install --include=dev` to ensure Vite/Tailwind build tooling is available during build.
