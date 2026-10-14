# CubeTime — Code Map
<!-- Maintained by @context-keeper. Hard cap 200 lines. Facts only. Paths, not line numbers. -->
Synced at: 5712654 | Phase: 4 committed @ 8c5a460 (docs @ 5712654), awaiting human check

## 1. Quick facts
- Stack: Next.js 16.4 App Router + Turbopack (cacheComponents, partialPrefetching), React 19.3, TypeScript strict, Tailwind CSS v4 via @tailwindcss/turbopack loader (tokens in src/app/globals.css, dark via `.dark` class), lucide-react icons, Geist fonts, cubing@0.65.1 + scramble-display@0.59.1, vitest@^5.0.4 + @types/node@^22 (dev).
- Run: dev `npm run dev` | lint `npm run lint` | typecheck `npm run typecheck` | build `npm run build` | unit `npm run test` (`vitest run`; config vitest.config.mts — node env, `@`→src alias, includes `src/**/*.test.ts`) | e2e `npm run test:e2e` (script does not exist yet)
- Env: none expected (the MVP needs no secrets)
- No Zustand / idb / zod / playwright in package.json yet (later phases).
- Tags: `phase-2-approved` @22a9cb2, `phase-3-approved` @d4b5e64 (verified via git log --decorate).

## 2. Layout
| Path | Responsibility |
|---|---|
| src/app | App Router shell: layout.tsx (fonts, metadata, pre-paint theme script), page.tsx (renders TimerApp), globals.css (Tailwind v4 tokens, `.dark` overrides), favicon |
| src/components | Client UI: timer-app (client root, main = TimerCard+ScramblePanel grid then SolveHistory+Statistics grid: theme + real in-memory sessions/solves, scramble generation via `cubingScrambleProvider` with `generate`/`generateFresh`/`applyScrambleResult` + seq-guard, `selectionLocked` while timer active; HOLD_TO_READY=false const), top-bar (brand = page `<h1>`; `selectionLocked` disables non-active puzzle/session menu items), timer-card (client: rAF digit loop from engine, tap-to-start button, +2/DNF penalty toggles on last solve, `scrambleReady` gates start, sr-only aria-live label), scramble-panel (`status` ready/generating/error + retry copy, no sample badge), scramble-view (2D scramble-display, h-44/sm:h-52, visible load-failure fallback, uses shared EVENT_IDS), solve-history (SolveRecord, `number` derived from index), statistics (SolveRecord), menu (full keyboard nav + per-item `disabled`) |
| src/lib | puzzles.ts (PuzzleId/PUZZLES/puzzleLabel — sample-data.ts DELETED), statistics.ts (SolveLike-based helpers), timer/ (types.ts, engine.ts + engine.test.ts, keyboard.ts + keyboard.test.ts, use-timer.ts), scrambles/ (types.ts, events.ts EVENT_IDS, adapter.ts cubingScrambleProvider + adapter.test.ts), storage/types.ts (type-only ports, Phase 5) |
| docs | PRD_CUBETIME.md, DESIGN.md, PROGRESS.md, CODEMAP.md, REVIEW-LOG.md, PROMPTS.md, TESTING-PRD.md |
| .opencode/agents | Subagent definitions (context-keeper, project-manager, reviewer, tester, …) |
| Root configs | package.json, tsconfig (strict, `@/*` → src/*), next.config.ts, eslint.config.mjs, README.md |

## 3. Modules and state (state: none / prototype / real)
| Module | Location | Phase | State |
|---|---|---|---|
| Timer engine (performance.now) | src/lib/timer | 4 | REAL — `createTimerEngine` in src/lib/timer/engine.ts measures with `performance.now()` (HOLD_MS=300), 10 unit tests in engine.test.ts; `useTimer` hook wires Space/N/D/Escape via keyboard.ts (4 tests); UI wired in timer-card. Hold-to-ready phases are engine-tested but unreachable: `HOLD_TO_READY=false` in timer-app.tsx until the Phase 5 settings toggle |
| Scramble adapter | src/lib/scrambles | 4 | REAL — `cubingScrambleProvider` (src/lib/scrambles/adapter.ts) calls `randomScrambleForEvent(EVENT_IDS[id])` on the main thread; adapter.test.ts generates a scramble for all 10 puzzles + checks successive 3x3 differ (Node evidence, see §5); browser-side generation runs in the live app but is not yet human-verified |
| Scramble view (2D) | src/components/scramble-view.tsx | 2 | prototype — scramble-display renders live scramble text; shared `EVENT_IDS` from src/lib/scrambles/events.ts (local map deleted); on load failure: visible `role="status"` message + "Try again" (attempt counter retriggers effect); sr-only status placeholder always mounted |
| Statistics and penalties | src/lib/statistics | 6 | prototype — helpers moved to src/lib/statistics.ts (SolveLike = Pick<SolveRecord,"rawTimeMs"\|"penalty">; semantics unchanged); P6 still owns stats integration |
| Storage (IndexedDB, repositories, migrations) | src/lib/storage | 5 | type-only ports in src/lib/storage/types.ts (Penalty/SolveRecord/SessionRecord/SettingsRecord/SolveRepository/SessionRepository); SolveRecord+Penalty are consumed as data shapes by timer-app/statistics/solve-history, but repositories have zero consumers; no IndexedDB — implementation Phase 5 |
| Backup (JSON, CSV) and import validation | src/lib/backup, src/lib/validation | 5 | none |
| UI: timer, scramble, puzzle selector | src/components | 2-4 | real for timer + scramble generation (solves in memory only) |
| UI: sessions, history, statistics | src/components | 2-6 | prototype (empty session by default, honest copy) |
| UI: settings, theme, backup | src/components | 2-5 | theme works (localStorage); backup UI none |

## 4. Public interfaces (what other code may call; names and one-line purpose only)
Runtime helpers come from `src/lib/puzzles.ts`, `src/lib/statistics.ts`, `src/lib/timer/` and `src/lib/scrambles/`; UI components are default-exported internals. Type ports (no implementations yet): `SolveRecord`/`SessionRecord`/`SettingsRecord`/`SolveRepository`/`SessionRepository` (src/lib/storage/types.ts).
- Types: `Penalty` ("none" | "plus2" | "dnf"), `PuzzleId` (10-id string union), `Puzzle`, `SolveRecord`, `SolveLike`
- `PUZZLES` — the 10 supported puzzle ids/labels
- `puzzleLabel(puzzleId)` — id → display label
- `effectiveMs(solve)` — time in ms after +2/DNF penalty, null if DNF
- `formatMs(ms)` — "12.34" or "1:05.12" rendering
- `bestSingle(solves)` — fastest non-DNF ms, null if none
- `mean(solves)` — arithmetic mean of non-DNF ms
- `aoN(solves, n)` — WCA-style average of the last n (drop floor(n/5) each end; DNF in window → null)
- `bestAoN(solves, n)` — best aoN over all windows of size n
- `createTimerEngine(options)` — `performance.now()` engine (start/stop/arm/release/cancel/elapsedMs/subscribe; holdToReady opt-in, HOLD_MS=300)
- `useTimer(options)` — React hook: engine + phase state + Space/N/D/Escape handling (skips typing targets and open menus)
- `isTypingTarget(target)` / `isInsideMenu(target)` — keyboard guard predicates
- `cubingScrambleProvider(puzzleId)` — async ScrambleProvider; cubing.js `randomScrambleForEvent` main-thread, returns ScrambleResult
- `EVENT_IDS` — PuzzleId → WCA event id (shared by adapter and scramble-view)

## 5. Puzzle × scramble verification matrix (PRD Section 4)
Status is "verified" only when a test or a phase report proves it. Otherwise "unverified" or "unsupported".
All rows: Node-side vitest `src/lib/scrambles/adapter.test.ts` (2026-10-14) generated a scramble for every puzzle via cubing@0.65.1 `randomScrambleForEvent`, plus a successive-3x3-differ check; browser-side generation runs in the app but is **unverified** (human check pending).
The view renders with scramble-display@0.59.1 (cubing.org, GPL-3.0-or-later, wraps cubing/twisty; 2D default — 2D covers all 10 events while 3D lacks pyram/sq1); rendering is not evidence of generation.
| Puzzle | Library function | Output style (WCA-style?) | Status | Notes |
|---|---|---|---|---|
| 2×2×2 | cubing@0.65.1 randomScrambleForEvent("222") | WCA-style | unverified | Node vitest passed; browser pending |
| 3×3×3 | …("333") | WCA-style | unverified | Node vitest passed (+differ check); browser pending |
| 4×4×4 | …("444") | WCA-style | unverified | Node vitest passed; browser pending |
| 5×5×5 | …("555") | WCA-style | unverified | Node vitest passed; browser pending |
| 6×6×6 | …("666") | WCA-style | unverified | Node vitest passed; browser pending |
| 7×7×7 | …("777") | WCA-style | unverified | Node vitest passed; browser pending |
| Megaminx | …("minx") | WCA-style (R-- D++ lines) | unverified | Node vitest passed; browser pending |
| Square-1 | …("sq1") | WCA-style ((a, b) / …) | unverified | Node vitest passed; browser pending |
| Pyraminx | …("pyram") | WCA-style (tips l/r/u included) | unverified | Node vitest passed; browser pending |
| Skewb | …("skewb") | WCA-style | unverified | Node vitest passed; browser pending |

## 6. Storage
- Database name and schema version: none — no IndexedDB code at all; sessions and solves live in React state in timer-app.tsx (in-memory only, lost on reload)
- Object stores and key fields (Solve, Session, Settings): none; record shapes exist only as type ports in src/lib/storage/types.ts (mirror PRD Section 7; Phase 5 implements)
- Migrations location and latest migration: none yet
- Backup format version: none yet
- Only persistence today: localStorage key `cubetime-theme` (dark/light/system)

## 7. Reusable building blocks (check here BEFORE creating anything new)
| Name | Path | Purpose |
|---|---|---|
| Menu | src/components/menu.tsx | Dropdown primitive: aria menu roles, Escape/outside-click close, active check, align left/right; roving tabindex (menuitems `tabIndex={-1}`), ArrowUp/Down/Home/End via `menuButtons()` helper, focus first item on open, focus back to trigger on select, closes when focus leaves root (`onBlur`) |
| ScrambleView | src/components/scramble-view.tsx | scramble-display (`new ScrambleDisplay()`, `.event` from WCA id map + `.scramble`) for a puzzle+scramble; dynamic-import-in-useEffect with cancelled flag, aria-hidden container, try/catch — text scramble stays authoritative on failure |
| Theme handling | src/components/timer-app.tsx + src/app/layout.tsx | localStorage `cubetime-theme` + useSyncExternalStore; inline pre-paint script avoids flash |
| Design tokens | src/app/globals.css (spec: docs/DESIGN.md) | CSS vars for color roles + chart series; Tailwind `@theme inline` mapping; `.dark` overrides |
| Stats helpers | src/lib/statistics.ts | effectiveMs, formatMs, bestSingle, mean, aoN, bestAoN — reuse instead of re-implementing |
| Timer engine | src/lib/timer/engine.ts | `createTimerEngine` — performance.now() stopwatch (start/stop/arm/release/cancel/subscribe; holdToReady opt-in, HOLD_MS=300) |
| Timer hook | src/lib/timer/use-timer.ts | `useTimer` — engine + phase state + Space/N/D/Escape handling |
| Keyboard guards | src/lib/timer/keyboard.ts | `isTypingTarget` / `isInsideMenu` — skip shortcuts in inputs and open menus |
| Scramble provider | src/lib/scrambles/adapter.ts | `cubingScrambleProvider(puzzleId)` — async, cubing.js main thread, returns ScrambleResult |
| Event id map | src/lib/scrambles/events.ts | `EVENT_IDS` — PuzzleId → WCA event id (shared by adapter + scramble-view) |
| Icons | lucide-react | Used everywhere; aria-hidden on decorative icons |

## 8. Conventions and recipes
- Add a component: one file in src/components, default export, `"use client"` if it uses state/hooks; import via `@/components/...`; Tailwind classes only, colors from tokens (no raw hex); body/helper text never below `text-sm` (14px floor, DESIGN.md — `text-xs` removed from solve-history/statistics/scramble-panel in Phase 3).
- Add a puzzle or scramble type (and how it is verified): extend `PUZZLES` in src/lib/puzzles.ts + `EVENT_IDS` in src/lib/scrambles/events.ts + a case in adapter.test.ts; real generation is cubing.js in src/lib/scrambles/adapter.ts and must be marked verified in Section 5 by a test or phase report.
- Add a statistic (and its test): helper in src/lib/statistics.ts + render in src/components/statistics.tsx; colocated unit test as `*.test.ts` next to the module, run via `npm run test` (vitest, config vitest.config.mts).
- Add a timer keyboard shortcut: add a case in src/lib/timer/use-timer.ts guarded by `isTypingTarget`/`isInsideMenu`, plus a test in keyboard.test.ts or use-timer coverage.
- Add a storage migration: n/a until Phase 5 (src/lib/storage).
- Client vs server components: layout.tsx/page.tsx are server components; all interactive UI hangs off the `"use client"` root src/components/timer-app.tsx. Browser-only APIs (localStorage, matchMedia) stay behind that root.
- Heavy client lib (SSR-safe): `await import(...)` inside useEffect with a cancelled flag + cleanup — the pattern in src/components/scramble-view.tsx.
- Async result into state (satisfies react-hooks/set-state-in-effect): resolve the promise with `.then(...)`, guard staleness with a seq counter, and apply via `useCallback` — pattern in timer-app.tsx `generate`/`applyScrambleResult`.
- Derived stats under the timer: compute in timer-app from src/lib/statistics.ts helpers (e.g. `ao5 = aoN(solves, 5)`) and pass as a prop to a presentational card (pattern in timer-card.tsx).

## 9. Decisions and gotchas that affect code
- Scramble generation library = cubing.js (runtime dependency since db456d8); scramble-display@0.59.1 (added at 46832f2) is only the 2D render wrapper. Phase 4 decision: generation runs **on the main thread** via `cubingScrambleProvider` (no worker); src/lib/sample-data.ts and its sample scrambles are deleted — every scramble shown is freshly generated.
- Phase 2 code committed at 1eea7f5 (src/, package.json, configs added; speedcubing-timer-prd.md deleted).
- AGENTS.md is rewritten by `next dev` (nextjs-agent-rules block re-emitted); it once lost the CubeTime rules entirely — commit the file with your work, and restore both blocks if clobbered.
- Dev env: Linux Node 22 via nvm; node/npm/npx shims in ~/.local/bin (outside repo) so bare npm resolves to Linux Node, not Windows npm from /mnt/c.
- Test runner: vitest@^5.0.4 + @types/node@^22 added in Phase 4 (`npm run test` → `vitest run`, config vitest.config.mts); `npm run test:e2e` script still does not exist (playwright not installed).
- Timer shortcuts (PRD Section 5.7) land in use-timer.ts with guard predicates `isTypingTarget`/`isInsideMenu`; Space/N/D/Escape are ignored while typing or a menu is open. Puzzle/session selection is locked while a solve is running (`selectionLocked` in timer-app.tsx) so the scramble/puzzle can't change mid-solve.
- Hold-to-ready: engine supports it but `HOLD_TO_READY=false` const in timer-app.tsx — unreachable until the Phase 5 settings toggle.
- Theme state in timer-app.tsx uses useSyncExternalStore over localStorage with a custom `cubetime-theme-change` event (no setState-in-effect; satisfies react-hooks/set-state-in-effect).
- opencode.json testsprite flags are enabled (flipped in db456d8, origin unknown, committed as-is) — relevant only to later testsprite-runner phases.

## 10. Tech debt / TODO
- Hold-to-ready is engine-tested but off: needs a Phase 5 settings toggle to flip `HOLD_TO_READY` in timer-app.tsx.
- Timer save/saved UI states (PRD Section 5.x) land with persistence in Phase 5 — solves currently only live in memory.
- Penalty edits only work on the last solve; editing older rows is Phase 5/6 work.
- `npm run test:e2e` script does not exist yet (playwright not installed).
- README.md, eslint.config.mjs and next.config.ts are scaffold defaults (unverified against PRD Section 13).

## 11. PRD index (section → start line in PRD_CUBETIME.md; read with offset/limit)
- 1 Tech Stack — 12 · 2 Product Overview — 105 · 3 Human Approval Workflow — 157 · 4 Puzzle Support — 191 · 5 Functional Requirements — 257 · 6 UI/UX and Visual Direction — 407 · 7 Data Model — 458 · 8 Architecture — 507 · 9 Error Handling — 539 · 10 Security and Privacy — 565 · 11 Testing and Acceptance — 580 · 12 Deployment — 651 · 13 Suggested Project Structure — 671 · 14 Implementation Plan — 723 · 15 Review Scorecard — 797 · 16 Future Enhancements — 828 · 17 Definition of Done — 844
- Phase 1 — 728 · Phase 2 — 737 · Phase 3 — 746 · Phase 4 — 754 · Phase 5 — 762 · Phase 6 — 770 · Phase 7 — 777 · Phase 8 — 786
