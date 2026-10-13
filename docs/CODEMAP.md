# CubeTime — Code Map
<!-- Maintained by @context-keeper. Hard cap 200 lines. Facts only. Paths, not line numbers. -->
Synced at: 46832f2 | Phase: 2 (Prototype, in progress)

## 1. Quick facts
- Stack: Next.js 16.4 App Router + Turbopack (cacheComponents, partialPrefetching), React 19.3, TypeScript strict, Tailwind CSS v4 via @tailwindcss/turbopack loader (tokens in src/app/globals.css, dark via `.dark` class), lucide-react icons, Geist fonts.
- Run: dev `npm run dev` | lint `npm run lint` | typecheck `npm run typecheck` | build `npm run build` | unit `npm run test` (not configured yet) | e2e `npm run test:e2e` (not configured yet)
- Env: none expected (the MVP needs no secrets)
- No Zustand / idb / zod / vitest / playwright in package.json yet (later phases).

## 2. Layout
| Path | Responsibility |
|---|---|
| src/app | App Router shell: layout.tsx (fonts, metadata, pre-paint theme script), page.tsx (renders TimerApp), globals.css (Tailwind v4 tokens, `.dark` overrides), favicon |
| src/components | Prototype UI: timer-app (client root: theme + puzzle/session/scramble state), top-bar, timer-card, scramble-panel, scramble-view (2D scramble-display), solve-history, statistics, menu |
| src/lib | Only sample-data.ts today: static prototype data + stats helpers. timer / scrambles / statistics / storage / backup folders not created yet |
| docs | PRD_CUBETIME.md, DESIGN.md, PROGRESS.md, CODEMAP.md, REVIEW-LOG.md, PROMPTS.md, TESTING-PRD.md |
| .opencode/agents | Subagent definitions (context-keeper, project-manager, reviewer, tester, …) |
| Root configs | package.json, tsconfig (strict, `@/*` → src/*), next.config.ts, eslint.config.mjs, README.md |

## 3. Modules and state (state: none / prototype / real)
| Module | Location | Phase | State |
|---|---|---|---|
| Timer engine (performance.now) | src/lib/timer | 4 | none — timer-card.tsx is a static "0.00" placeholder |
| Scramble adapter | src/lib/scrambles | 4 | none — static SAMPLE_SCRAMBLES cycled by index |
| Scramble view (2D) | src/components/scramble-view.tsx | 2 | prototype — scramble-display renders existing scramble text |
| Statistics and penalties | src/lib/statistics | 6 | prototype — helpers in src/lib/sample-data.ts |
| Storage (IndexedDB, repositories, migrations) | src/lib/storage | 5 | none |
| Backup (JSON, CSV) and import validation | src/lib/backup, src/lib/validation | 5 | none |
| UI: timer, scramble, puzzle selector | src/components | 2-4 | prototype (sample data only) |
| UI: sessions, history, statistics | src/components | 2-6 | prototype |
| UI: settings, theme, backup | src/components | 2-5 | theme works (localStorage); backup UI none |

## 4. Public interfaces (what other code may call; names and one-line purpose only)
Only `src/lib/sample-data.ts` exports public helpers (UI components are default-exported internals, not interfaces yet).
- Types: `Penalty` ("none" | "plus2" | "dnf"), `PuzzleId` (10-id string union), `Puzzle`, `Solve`, `SessionSample`
- `PUZZLES` — the 10 supported puzzle ids/labels
- `SAMPLE_SCRAMBLES` — static scramble strings, exhaustive `Record<PuzzleId, string[]>` (3 each), cubing@0.65.1 offline output
- `SAMPLE_SESSIONS` — two sample 3x3 sessions with solves
- `sessionsForPuzzle(puzzleId: PuzzleId)` — sessions for a puzzle, or an empty default session
- `puzzleLabel(puzzleId)` — id → display label
- `effectiveMs(solve)` — time in ms after +2/DNF penalty, null if DNF
- `formatMs(ms)` — "12.34" or "1:05.12" rendering
- `bestSingle(solves)` — fastest non-DNF ms, null if none
- `mean(solves)` — arithmetic mean of non-DNF ms
- `aoN(solves, n)` — WCA-style average of the last n (drop floor(n/5) each end; DNF in window → null)
- `bestAoN(solves, n)` — best aoN over all windows of size n

## 5. Puzzle × scramble verification matrix (PRD Section 4)
Status is "verified" only when a test or a phase report proves it. Otherwise "unverified" or "unsupported".
All rows: Node-side spike with cubing@0.65.1 `randomScrambleForEvent` produced valid output during Phase 2 (used as the sample-data source); browser/worker verification still due in Phase 4.
The prototype view renders these scrambles with scramble-display@0.59.1 (cubing.org, GPL-3.0-or-later, wraps cubing/twisty; 2D default — 2D covers all 10 events while 3D lacks pyram/sq1); visual only, not yet evidence of browser-side scramble GENERATION.
| Puzzle | Library function | Output style (WCA-style?) | Status | Notes |
|---|---|---|---|---|
| 2×2×2 | cubing@0.65.1 randomScrambleForEvent("222") | WCA-style | unverified | spike passed Node-side only |
| 3×3×3 | …("333") | WCA-style | unverified | spike passed Node-side only |
| 4×4×4 | …("444") | WCA-style | unverified | spike passed Node-side only |
| 5×5×5 | …("555") | WCA-style | unverified | spike passed Node-side only |
| 6×6×6 | …("666") | WCA-style | unverified | spike passed Node-side only |
| 7×7×7 | …("777") | WCA-style | unverified | spike passed Node-side only |
| Megaminx | …("minx") | WCA-style (R-- D++ lines) | unverified | spike passed Node-side only |
| Square-1 | …("sq1") | WCA-style ((a, b) / …) | unverified | spike passed Node-side only |
| Pyraminx | …("pyram") | WCA-style (tips l/r/u included) | unverified | spike passed Node-side only |
| Skewb | …("skewb") | WCA-style | unverified | spike passed Node-side only |

## 6. Storage
- Database name and schema version: none yet (no IndexedDB code)
- Object stores and key fields (Solve, Session, Settings): none yet; prototype types mirror PRD Section 7 (Solve, SessionSample)
- Migrations location and latest migration: none yet
- Backup format version: none yet
- Only persistence today: localStorage key `cubetime-theme` (dark/light/system)

## 7. Reusable building blocks (check here BEFORE creating anything new)
| Name | Path | Purpose |
|---|---|---|
| Menu | src/components/menu.tsx | Dropdown primitive: aria menu roles, Escape/outside-click close, active check, align left/right |
| ScrambleView | src/components/scramble-view.tsx | scramble-display (`new ScrambleDisplay()`, `.event` from WCA id map + `.scramble`) for a puzzle+scramble; dynamic-import-in-useEffect with cancelled flag, aria-hidden container, try/catch — text scramble stays authoritative on failure |
| Theme handling | src/components/timer-app.tsx + src/app/layout.tsx | localStorage `cubetime-theme` + useSyncExternalStore; inline pre-paint script avoids flash |
| Design tokens | src/app/globals.css (spec: docs/DESIGN.md) | CSS vars for color roles + chart series; Tailwind `@theme inline` mapping; `.dark` overrides |
| Stats helpers | src/lib/sample-data.ts | effectiveMs, formatMs, bestSingle, mean, aoN, bestAoN — reuse instead of re-implementing |
| Icons | lucide-react | Used everywhere; aria-hidden on decorative icons |

## 8. Conventions and recipes
- Add a component: one file in src/components, default export, `"use client"` if it uses state/hooks; import via `@/components/...`; Tailwind classes only, colors from tokens (no raw hex).
- Add a puzzle or scramble type (and how it is verified): extend `PUZZLES` + `SAMPLE_SCRAMBLES` in src/lib/sample-data.ts (prototype); real generation goes in src/lib/scrambles at Phase 4 and must be marked verified in Section 5 by a test or phase report.
- Add a statistic (and its test): helper in the stats module + render in src/components/statistics.tsx; unit test once vitest lands (not configured yet).
- Add a storage migration: n/a until Phase 5 (src/lib/storage).
- Client vs server components: layout.tsx/page.tsx are server components; all interactive UI hangs off the `"use client"` root src/components/timer-app.tsx. Browser-only APIs (localStorage, matchMedia) stay behind that root.
- Heavy client lib (SSR-safe): `await import(...)` inside useEffect with a cancelled flag + cleanup — the pattern in src/components/scramble-view.tsx.

## 9. Decisions and gotchas that affect code
- Scramble generation library = cubing.js (runtime dependency since db456d8; spike passed Node-side in Phase 2; browser/worker verification is Phase 4 work); scramble-display@0.59.1 (added at 46832f2) is only the 2D render wrapper. Sample scrambles in src/lib/sample-data.ts came from the cubing spike (square-1 #2 was regenerated once after review found it truncated).
- Phase 2 code committed at 1eea7f5 (src/, package.json, configs added; speedcubing-timer-prd.md deleted).
- AGENTS.md is rewritten by `next dev` (nextjs-agent-rules block re-emitted); it once lost the CubeTime rules entirely — commit the file with your work, and restore both blocks if clobbered.
- Dev env: Linux Node 22 via nvm; node/npm/npx shims in ~/.local/bin (outside repo) so bare npm resolves to Linux Node, not Windows npm from /mnt/c.
- No test runner configured: `npm run test` / `test:e2e` scripts do not exist yet.
- Timer is display-only; no keyboard handling yet (PRD Section 5.7 comes in Phase 4).
- Theme state in timer-app.tsx uses useSyncExternalStore over localStorage with a custom `cubetime-theme-change` event (no setState-in-effect; satisfies react-hooks/set-state-in-effect).
- opencode.json testsprite flags are enabled (flipped in db456d8, origin unknown, committed as-is) — relevant only to later testsprite-runner phases.

## 10. Tech debt / TODO
- stats helpers and sample data share one file (src/lib/sample-data.ts); split when src/lib/statistics and src/lib/storage arrive.
- Scramble copy button / new-scramble button only cycle static arrays.
- README.md, eslint.config.mjs and next.config.ts are scaffold defaults (unverified against PRD Section 13).

## 11. PRD index (section → start line in PRD_CUBETIME.md; read with offset/limit)
- 1 Tech Stack — 12 · 2 Product Overview — 105 · 3 Human Approval Workflow — 157 · 4 Puzzle Support — 191 · 5 Functional Requirements — 257 · 6 UI/UX and Visual Direction — 407 · 7 Data Model — 458 · 8 Architecture — 507 · 9 Error Handling — 539 · 10 Security and Privacy — 565 · 11 Testing and Acceptance — 580 · 12 Deployment — 651 · 13 Suggested Project Structure — 671 · 14 Implementation Plan — 723 · 15 Review Scorecard — 797 · 16 Future Enhancements — 828 · 17 Definition of Done — 844
- Phase 1 — 728 · Phase 2 — 737 · Phase 3 — 746 · Phase 4 — 754 · Phase 5 — 762 · Phase 6 — 770 · Phase 7 — 777 · Phase 8 — 786
