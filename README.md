# CubeTime

A local-first speedcubing timer that runs entirely in your browser. Time solves, track sessions, view statistics, and back up your data — no account, no server, no analytics.

## Features

- Keyboard-only timer (hold Space to start, N for +2, D for DNF) with optional WCA inspection
- WCA-style scrambles for 10 puzzles (2×2 through 7×7, Megaminx, Square-1, Pyraminx, Skewb) via cubing.js, with 2D scramble views
- Solve history with per-solve penalties, notes, manual entry, and rolling Ao5/Ao12
- Session management (create, rename, delete)
- Statistics: best single, mean, Ao5/Ao12, best Ao5/Ao12, solve trend chart — each best stat opens a popup with the solve or averaging window behind the value
- Optional blind mode ("hide timer while solving"), sound feedback, and auto-next-scramble
- Light/dark theme
- JSON backup export/import (merge or replace) and CSV export

## Data & privacy

All data stays on your device in the browser's IndexedDB (`cubetime` database). There is no backend, no sync, and no third-party requests at runtime — the app works offline once loaded.

**Back up regularly.** Clearing site data, using a different browser, or switching devices means starting with a separate (empty) data store. Export a JSON backup from **Data and settings → Export JSON** before clearing browser data, and re-import it afterwards (merge to keep existing data, replace to overwrite).

## Setup

Requires Node.js 22+.

```bash
npm install   # also copies cubing.js assets into public/ (postinstall)
npm run dev   # http://localhost:3000
```

No environment variables are needed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (no emit) |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

E2E tests need a one-time browser install:

```bash
npx playwright install --with-deps chromium
```

## Deployment

The app deploys to [Vercel](https://vercel.com) from GitHub with the standard Next.js integration — import the repository, no configuration or environment secrets required, and every push to `main` redeploys.

Before deploying changes, verify the production build locally:

```bash
npm run build
```

After deploying, worth checking on the live URL: solves persist across a refresh, a second browser starts with its own empty data, scrambles generate, and a JSON backup exports and re-imports.
