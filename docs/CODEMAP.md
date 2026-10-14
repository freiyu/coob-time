# CubeTime — Code Map
<!-- Maintained by @context-keeper. Hard cap 200 lines. Facts only. Paths, not line numbers. -->
Synced at: 6995b86 | Phase: 4 approved (`phase-4-approved` @40973df, 2026-10-14), Phase 5 implemented (uncommitted report pending / human check not yet done)

## 1. Quick facts
- Stack: Next.js 16.4 App Router + Turbopack (cacheComponents, partialPrefetching), React 19.3, TypeScript strict, Tailwind CSS v4 via @tailwindcss/turbopack loader (tokens in src/app/globals.css, dark via `.dark` class), lucide-react icons, Geist fonts, cubing@0.65.1 + scramble-display@0.59.1, idb@^8 + zod@^4 (runtime), vitest@^5.0.4 + @types/node@^22 + @playwright/test@^1.64 (dev).
- Run: dev `npm run dev` | lint `npm run lint` | typecheck `npm run typecheck` | build `npm run build` | unit `npm run test` (`vitest run` — 29 tests, 4 files: engine 10 / keyboard 4 / adapter 4 / backup 11; config vitest.config.mts — node env, `@`→src alias, includes `src/**/*.test.ts`) | e2e `npm run test:e2e` (`playwright test`; config playwright.config.ts — baseURL :3000, webServer reuses the dev server; tests in e2e/)
- postinstall `scripts/copy-cubing.mjs`: copies cubing.js dist → `public/cubing/` (gitignored, eslint-ignored) + vendors `random-uint-below` → `public/cubing/vendor/`, rewriting 19 bare import specifiers (three/* untouched — only reached from 3D/Bluetooth chunks CubeTime never loads)
- Env: none expected (the MVP needs no secrets)
- No Zustand. Playwright browsers ARE installed in ~/.cache/ms-playwright (human ran `npx playwright install --with-deps chromium` with sudo, 2026-10-14); 3/3 e2e passed (refresh persistence, settings persist, export→delete-all→merge-import).
- Tags: `phase-2-approved` @22a9cb2, `phase-3-approved` @d4b5e64, `phase-4-approved` @40973df (verified via git log --decorate).

## 2. Layout
| Path | Responsibility |
|---|---|
| src/app | App Router shell: layout.tsx (fonts, metadata, pre-paint theme script), page.tsx (renders TimerApp), globals.css (Tailwind v4 tokens, `.dark` overrides), favicon |
| src/components | Client UI: timer-app (client root, main = TimerCard+ScramblePanel grid then SolveHistory+Statistics+DataPanel grid: theme + sessions/solves/settings hydrated from IndexedDB on mount via `reloadStorage` useCallback — raced-merge ONLY on first hydration so delete-all/replace mirror the DB exactly; always attempts persist putSession+putSolve regardless of storageOk; saveState saving/saved/failed → TimerCard; saveNotice banner bg-danger + Dismiss (cleared on next successful write); storageError banner bg-danger + role=alert; `holdToReady = settings.startMode !== "press"`; scramble generation via `cubingScrambleProvider` with `generate`/`generateFresh`/`applyScrambleResult` + seq-guard, `selectionLocked` while timer active; `handleDeleteSolve`; running focus mode — TopBar/banner/ScramblePanel/history/stats/footer/DataPanel wrappers get opacity-0 + pointer-events-none + aria-hidden + inert while phase==="running" (300ms fade), footer shortcut copy start-mode aware; phantom session timestamps use `INITIAL_STAMP` epoch placeholder — `new Date()` is unstable at Next prerender, GOTCHA), top-bar (brand = page `<h1>`; `selectionLocked` disables non-active puzzle/session menu items), timer-card (client: rAF digit loop from engine, plain div — mouse/tap does nothing, start/stop Space only (human override of FR-T04), `holdMode` prop → idle copy Hold/Press Space to start, `saveState`-driven stopped label (Saving…/Saved/Failed → Stopped; STATE_LABEL narrowed to idle|stopped), hold state colors digits+label (holding=text-destructive, ready=text-brand-strong) + thin ring, running focus mode FLIP-translates card to viewport center (300ms, motion-reduce off) with label+Ao5 hidden, +2/DNF penalty toggles on last solve, `scrambleReady` gates start, sr-only aria-live label), scramble-panel (root `section` now h-full; `status` ready/generating/error + retry copy), scramble-view (2D scramble-display, h-44/sm:h-52, visible load-failure fallback, uses shared EVENT_IDS), solve-history (SolveRecord, `number` from index; Actions column: trash icon → inline two-step Delete/Confirm + Cancel, no modal/undo, `onDelete` prop, confirm state local, confirm button bg-destructive token; empty-state copy trimmed), statistics (SolveRecord; StatCard PB badge on its own line below the time), data-panel ("Data and settings" card: start-mode radios, default-puzzle select, export JSON/CSV, import file→preview→Merge/Replace radio→apply (Replace = destructive button + loss counts), delete-all with typed DELETE; settings UI gated on storageOk), menu (full keyboard nav + per-item `disabled`) |
| src/lib | puzzles.ts (PuzzleId/PUZZLES/puzzleLabel — sample-data.ts DELETED), statistics.ts (SolveLike-based helpers), timer/ (types.ts, engine.ts + engine.test.ts, keyboard.ts + keyboard.test.ts, use-timer.ts), scrambles/ (types.ts, events.ts EVENT_IDS, adapter.ts cubingScrambleProvider + adapter.test.ts), storage/ (types.ts type ports + idb.ts implementation), backup/ (validate.ts zod schema, format.ts build/CSV/download, import.ts planImport, backup.test.ts 11 tests) |
| e2e | e2e/refresh-persistence.spec.ts (3 tests: reload keeps solves/sessions, settings persist, export JSON → delete-all → merge-import round-trip); config playwright.config.ts |
| docs | PRD_CUBETIME.md, DESIGN.md (timer table updated: idle copy "Hold Space to start" — mouse/tap does nothing, holding/ready digits use state colors, running focus-mode rule added incl. explicit FR-T04 override), PROGRESS.md, CODEMAP.md, REVIEW-LOG.md, PROMPTS.md, TESTING-PRD.md |
| .opencode/agents | Subagent definitions (context-keeper, project-manager, reviewer, tester, …) |
| Root configs | package.json, tsconfig (strict, `@/*` → src/*), next.config.ts, eslint.config.mjs, playwright.config.ts, README.md |

## 3. Modules and state (state: none / prototype / real)
| Module | Location | Phase | State |
|---|---|---|---|
| Timer engine (performance.now) | src/lib/timer | 4 | REAL — `createTimerEngine` in src/lib/timer/engine.ts measures with `performance.now()` (HOLD_MS=300), 10 unit tests in engine.test.ts; `useTimer` hook wires Space/N/D/Escape via keyboard.ts (4 tests); UI wired in timer-card. Hold-to-ready driven by `settings.startMode !== "press"` (FR-T03; engine holdToReady opt-in) |
| Scramble adapter | src/lib/scrambles | 4 | REAL — `cubingScrambleProvider` (src/lib/scrambles/adapter.ts) calls `randomScrambleForEvent(EVENT_IDS[id])` on the main thread; adapter.test.ts generates a scramble for all 10 puzzles + checks successive 3x3 differ (Node evidence, see §5); browser-side generation human-verified in review 2 for the timer flows exercised (2026-10-14) |
| Scramble view (2D) | src/components/scramble-view.tsx | 2 | prototype — scramble-display renders live scramble text; shared `EVENT_IDS` from src/lib/scrambles/events.ts (local map deleted); on load failure: visible `role="status"` message + "Try again" (attempt counter retriggers effect); sr-only status placeholder always mounted |
| Statistics and penalties | src/lib/statistics | 6 | prototype — helpers moved to src/lib/statistics.ts (SolveLike = Pick<SolveRecord,"rawTimeMs"\|"penalty">; semantics unchanged); P6 still owns stats integration |
| Storage (IndexedDB, repositories, migrations) | src/lib/storage | 5 | REAL (human check pending) — src/lib/storage/idb.ts implements cubetimeDb + CRUD over idb@^8; type ports in types.ts (Penalty/SolveRecord/SessionRecord/SettingsRecord/SolveRepository/SessionRepository); timer-app hydrates on mount and persists every solve; no migrations beyond v1 yet |
| Backup (JSON, CSV) and import validation | src/lib/backup | 5 | REAL (human check pending) — validate.ts (zod), format.ts (build/CSV/download), import.ts (planImport), 11 tests in backup.test.ts; UI in data-panel.tsx |
| UI: timer, scramble, puzzle selector | src/components | 2-4 | real for timer + scramble generation; solves persisted to IndexedDB |
| UI: sessions, history, statistics | src/components | 2-6 | sessions/solves real (default session created on first hydration); session create/rename/delete UI deferred to Phase 6 |
| UI: settings, theme, backup | src/components | 5 | theme works (localStorage); DataPanel: start-mode + default-puzzle settings, export/import/delete-all live; inspection/sound/autoNextScramble fields persisted but not surfaced |

## 4. Public interfaces (what other code may call; names and one-line purpose only)
Runtime helpers come from `src/lib/puzzles.ts`, `src/lib/statistics.ts`, `src/lib/timer/`, `src/lib/scrambles/`, `src/lib/storage/idb.ts` and `src/lib/backup/`; UI components are default-exported internals.
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
- `useTimer(options)` — React hook: engine + phase state + Space/N/D/Escape handling (skips typing targets and open menus); Space keydown calls `preventDefault()` BEFORE the `event.repeat` guard (held Space no longer scrolls); other-key guards unchanged
- `isTypingTarget(target)` / `isInsideMenu(target)` — keyboard guard predicates
- `cubingScrambleProvider(puzzleId)` — async ScrambleProvider; cubing.js `randomScrambleForEvent` main-thread, returns ScrambleResult
- `EVENT_IDS` — PuzzleId → WCA event id (shared by adapter and scramble-view)
- Storage (src/lib/storage/idb.ts): `cubetimeDb`, `listSessions`/`listSolves`/`putSession`/`putSolve`/`deleteSolve`/`getSettings`/`putSettings`, `putImported(sessions, solves, settings, mode)` (replace clears in the same tx), `clearAll`, `DEFAULT_SETTINGS`, `StorageError`, `DB_NAME`/`DB_VERSION`
- Backup (src/lib/backup/): `parseBackup` (zod), `buildBackup`, `backupToCsv`, `downloadText`, `planImport`, types `ImportMode`/`ImportPlan`
- UI props: TimerCard takes `holdMode` + `saveState`; DataPanel takes `sessions, solves, settings, storageOk, storageError, onSettingsSaved, onLocalDataChanged`; SolveHistory takes `onDelete: (id: string) => void`. TimerCard no longer takes `onToggle` (start/stop is Space-only, Phase 4).

## 5. Puzzle × scramble verification matrix (PRD Section 4)
Status is "verified" only when a test or a phase report proves it. Otherwise "unverified" or "unsupported".
All rows: Node-side vitest `src/lib/scrambles/adapter.test.ts` (2026-10-14) generated a scramble for every puzzle via cubing@0.65.1 `randomScrambleForEvent`, plus a successive-3x3-differ check; browser-side generation is human-verified for the timer flows exercised in human review 2 (2026-10-14) — generation for every puzzle in the browser is still unverified.
The view renders with scramble-display@0.59.1 (cubing.org, GPL-3.0-or-later, wraps cubing/twisty; 2D default — 2D covers all 10 events while 3D lacks pyram/sq1); rendering is not evidence of generation.
| Puzzle | Library function | Output style (WCA-style?) | Status | Notes |
|---|---|---|---|---|
| 2×2×2 | cubing@0.65.1 randomScrambleForEvent("222") | WCA-style | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| 3×3×3 | …("333") | WCA-style | verified (flows) | Node vitest passed (+differ check); browser: human-verified for exercised timer flows (review 2) |
| 4×4×4 | …("444") | WCA-style | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| 5×5×5 | …("555") | WCA-style | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| 6×6×6 | …("666") | WCA-style | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| 7×7×7 | …("777") | WCA-style | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| Megaminx | …("minx") | WCA-style (R-- D++ lines) | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| Square-1 | …("sq1") | WCA-style ((a, b) / …) | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| Pyraminx | …("pyram") | WCA-style (tips l/r/u included) | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |
| Skewb | …("skewb") | WCA-style | verified (flows) | Node vitest passed; browser: human-verified for exercised timer flows (review 2) |

## 6. Storage
- Database name and schema version: IndexedDB `cubetime`, version 1 (src/lib/storage/idb.ts)
- Object stores: `solves` (keyPath `id`, index `sessionId`), `sessions` (keyPath `id`), `settings` (out-of-line key `"app"`); open failure/timeout (5s) surfaces as `StorageError` → storageError banner
- Migrations: none beyond v1 yet — the idb.ts openDB upgrade block marks where they go
- Backup format version: 1 — envelope `app: "cubetime"`, `schemaVersion: 1`, `exportedAt` ISO, `sessions`/`solves`/`settings` arrays (validate.ts: MAX_RECORDS 100k, string caps, newer-version rejection)
- Theme: still localStorage key `cubetime-theme` (source of truth); `settings.theme` field exists (default "system") but is unused

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
| Storage repo fns | src/lib/storage/idb.ts | `cubetimeDb` + listSessions/listSolves/putSession/putSolve/deleteSolve/getSettings/putSettings/putImported/clearAll over idb@^8; throws `StorageError` (incl. open timeout) — reuse instead of raw IDB calls |
| Backup helpers | src/lib/backup/ | `parseBackup` (zod v1 envelope), `buildBackup`, `backupToCsv` (quote-escaping + formula-injection prefix guard), `downloadText`, `planImport` (merge/replace) |
| DataPanel | src/components/data-panel.tsx | "Data and settings" card: start-mode + default-puzzle settings, export JSON/CSV, import preview→Merge/Replace, delete-all with typed DELETE |
| Button classes | src/components/data-panel.tsx | `BUTTON_BASE`/`BUTTON_SECONDARY`/`BUTTON_PRIMARY`/`BUTTON_DESTRUCTIVE` (h-10 pattern) — reuse for new action buttons |
| INITIAL_STAMP | src/components/timer-app.tsx | `"1970-01-01T00:00:00.000Z"` placeholder for phantom session timestamps — GOTCHA: `new Date()` is unstable at Next prerender; stamp real values on first persist |
| Focus-mode fade | src/components/timer-app.tsx (`fadeCls`) | while phase==="running": `transition-opacity duration-300` + opacity-0/pointer-events-none toggle + aria-hidden + inert on every non-timer wrapper |
| FLIP-to-center | src/components/timer-card.tsx | useLayoutEffect measure → getBoundingClientRect dx/dy → setFlip state → style transform (transition-transform 300ms, motion-reduce:transition-none) centers the timer card while running |
| Danger vs destructive tokens | src/app/globals.css | GOTCHA: `--danger`/`--danger-foreground` is a BACKGROUND pair (light pale pink #fde3e1, dark maroon #3e1c1a) — never text-danger/ring-danger as foreground; use `text-destructive`/`ring-destructive` for red text (light #b42318, dark #f4a9a2). Badges correctly use bg-danger text-danger-foreground |
| Icons | lucide-react | Used everywhere; aria-hidden on decorative icons |

## 8. Conventions and recipes
- Add a component: one file in src/components, default export, `"use client"` if it uses state/hooks; import via `@/components/...`; Tailwind classes only, colors from tokens (no raw hex); body/helper text never below `text-sm` (14px floor, DESIGN.md — `text-xs` removed from solve-history/statistics/scramble-panel in Phase 3).
- Add a puzzle or scramble type (and how it is verified): extend `PUZZLES` in src/lib/puzzles.ts + `EVENT_IDS` in src/lib/scrambles/events.ts + a case in adapter.test.ts; real generation is cubing.js in src/lib/scrambles/adapter.ts and must be marked verified in Section 5 by a test or phase report.
- Add a statistic (and its test): helper in src/lib/statistics.ts + render in src/components/statistics.tsx; colocated unit test as `*.test.ts` next to the module, run via `npm run test` (vitest, config vitest.config.mts).
- Add a timer keyboard shortcut: add a case in src/lib/timer/use-timer.ts guarded by `isTypingTarget`/`isInsideMenu`, plus a test in keyboard.test.ts or use-timer coverage.
- Add a storage migration: bump `DB_VERSION` in src/lib/storage/idb.ts and add a case in the openDB upgrade block (only v1 exists so far).
- Client vs server components: layout.tsx/page.tsx are server components; all interactive UI hangs off the `"use client"` root src/components/timer-app.tsx. Browser-only APIs (localStorage, matchMedia) stay behind that root.
- Heavy client lib (SSR-safe): `await import(...)` inside useEffect with a cancelled flag + cleanup — the pattern in src/components/scramble-view.tsx.
- Async result into state (satisfies react-hooks/set-state-in-effect): resolve the promise with `.then(...)`, guard staleness with a seq counter, and apply via `useCallback` — pattern in timer-app.tsx `generate`/`applyScrambleResult`.
- Derived stats under the timer: compute in timer-app from src/lib/statistics.ts helpers (e.g. `ao5 = aoN(solves, 5)`) and pass as a prop to a presentational card (pattern in timer-card.tsx).

## 9. Decisions and gotchas that affect code
- Scramble generation library = cubing.js (runtime dependency since db456d8); scramble-display@0.59.1 (added at 46832f2) is only the 2D render wrapper. Phase 4 decision: generation runs **on the main thread** via `cubingScrambleProvider` (no worker); src/lib/sample-data.ts and its sample scrambles are deleted — every scramble shown is freshly generated.
- Phase 2 code committed at 1eea7f5 (src/, package.json, configs added; speedcubing-timer-prd.md deleted).
- AGENTS.md is rewritten by `next dev` (nextjs-agent-rules block re-emitted); it once lost the CubeTime rules entirely — commit the file with your work, and restore both blocks if clobbered.
- Dev env: Linux Node 22 via nvm; node/npm/npx shims in ~/.local/bin (outside repo) so bare npm resolves to Linux Node, not Windows npm from /mnt/c.
- Test runner: vitest@^5.0.4 + @types/node@^22 added in Phase 4 (`npm run test` → `vitest run`, config vitest.config.mts); @playwright/test + `npm run test:e2e` added in Phase 5 (config playwright.config.ts, webServer reuses dev server; browsers pre-installed in ~/.cache/ms-playwright).
- Timer shortcuts (PRD Section 5.7) land in use-timer.ts with guard predicates `isTypingTarget`/`isInsideMenu`; Space/N/D/Escape are ignored while typing or a menu is open. Puzzle/session selection is locked while a solve is running (`selectionLocked` in timer-app.tsx) so the scramble/puzzle can't change mid-solve.
- Hold-to-ready is LIVE in the UI: driven by `settings.startMode !== "press"` (FR-T03, hold Space ≥300ms to arm) — default `"hold"` via DEFAULT_SETTINGS, toggled in DataPanel.
- Phase 5 scope decisions (human-approved): full SettingsRecord persisted but only startMode + defaultPuzzle surfaced in the UI; theme stays localStorage (settings.theme unused); import = preview then Merge (skip dup ids, drop orphan solves, settings untouched) or Replace (clear+write in one tx, apply backup settings); penalty edits still last-solve-only; session create/rename/delete UI deferred to Phase 6; Saving/Saved labels live (derived saveState; engine saving/saved phases still unused).
- Persistence is never silent: writes ALWAYS attempted regardless of `storageOk` (storageOk only gates the settings UI), and a rejected write shows the bg-danger `saveNotice` banner ("kept in memory only — export a backup soon") — satisfies "never silently discarded". Playwright e2e uses fresh contexts, so the human's browser profile is unaffected.
- Keyboard-only start/stop: human explicitly disabled click/tap start (timer-card is a plain div) — overrides PRD FR-T04 touch controls; flagged for Phase 7 PRD-verification.
- Scramble generation browser bug FIXED (commits 40ef365..9b1ad93): root causes were (1) bundling broke cubing's search-worker sibling chunk paths, (2) bare specifier "random-uint-below" unresolvable in native browser ESM; fix = native ESM from public/cubing/ + vendored rewritten specifiers (scripts/copy-cubing.mjs); adapter logs "[cubetime] static cubing copy failed to load:" on fallback, panel shows real error text. Human later confirmed overall app functionality while exercising timer flows that require ready scrambles — browser-side generation working as of human review 2 (2026-10-14).
- Penalty edits still last-solve-only (+2/DNF toggles on the last solve only); delete solve is new (inline two-step confirm in solve-history, no modal/undo).
- Theme state in timer-app.tsx uses useSyncExternalStore over localStorage with a custom `cubetime-theme-change` event (no setState-in-effect; satisfies react-hooks/set-state-in-effect).
- opencode.json testsprite flags are enabled (flipped in db456d8, origin unknown, committed as-is) — relevant only to later testsprite-runner phases.

## 10. Tech debt / TODO
- Penalty edits only work on the last solve; editing older rows is Phase 5/6 work.
- Session create/rename/delete UI deferred to Phase 6 (sessions work, but only the default one exists in the UI).
- Settings fields inspectionEnabled/soundEnabled/autoNextScramble are persisted but have no toggles yet (surface or drop later).
- CSV export is all-solves (no per-session export).
- e2e runs require installed Playwright browsers (present in ~/.cache/ms-playwright here; a fresh machine needs `npx playwright install --with-deps chromium`).
- README.md, eslint.config.mjs and next.config.ts are scaffold defaults (unverified against PRD Section 13).

## 11. PRD index (section → start line in PRD_CUBETIME.md; read with offset/limit)
- 1 Tech Stack — 12 · 2 Product Overview — 105 · 3 Human Approval Workflow — 157 · 4 Puzzle Support — 191 · 5 Functional Requirements — 257 · 6 UI/UX and Visual Direction — 407 · 7 Data Model — 458 · 8 Architecture — 507 · 9 Error Handling — 539 · 10 Security and Privacy — 565 · 11 Testing and Acceptance — 580 · 12 Deployment — 651 · 13 Suggested Project Structure — 671 · 14 Implementation Plan — 723 · 15 Review Scorecard — 797 · 16 Future Enhancements — 828 · 17 Definition of Done — 844
- Phase 1 — 728 · Phase 2 — 737 · Phase 3 — 746 · Phase 4 — 754 · Phase 5 — 762 · Phase 6 — 770 · Phase 7 — 777 · Phase 8 — 786
