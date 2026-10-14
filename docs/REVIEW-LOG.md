# CubeTime — Human Review Log ("Buku Nilai AI", PRD Section 15)

The project-manager subagent creates an entry after each phase with what the agent reported.
Only the human supplies scores, satisfaction, bug notes, and the decision. Nobody fills them in for you.

## Scorecard (1 to 5, per phase where applicable)
| Category | Score | Satisfied? | Bug / notes |
|---|---|---|---|
| Visual design and clarity | | | |
| Mobile / responsive behavior | | | |
| Timer accuracy and controls | | | |
| Scramble correctness by puzzle | | | |
| Solve history and sessions | | | |
| Local persistence | | | |
| Statistics and penalties | | | |
| Backup import / export | | | |
| Accessibility and keyboard behavior | | | |
| Tests and deployment readiness | | | |

## Entry template (one per phase)
### Phase N — name — date
- Agent summary:
- Commands / tests and observed results:
- Scores (applicable categories):
- Satisfied / Not satisfied:
- Bug notes and requested revisions:
- Prompt used:
- Human decision: Approve / Revise / Reject

## Entries

### Phase 2 — Prototype — 2026-10-13
- Agent summary: Visual prototype with sample data only — timer, scramble panel, puzzle selector, solve history, statistics, menu; no functional claims for timer/scramble/persistence. Reviews run before fixes; lint/typecheck/build re-run after fixes (all exit 0). `npm run test` missing script is expected (no test runner until later phases).
- Commands / tests and observed results: `npm run lint` exit 0; `npm run typecheck` exit 0; `npm run build` exit 0 (static routes `/` and `/_not-found`); `npm run test` = missing script (expected). Tester run independently. Reviews NOT re-run after anti-slop fixes (mechanical, from reviewers' own recommendations).
- Reviewer: no BLOCKER. SHOULD-FIX (a) footer promised backup export — FIXED (reworded); (b) "Press Space to start" inert command — DEFERRED (DESIGN.md idle copy kept; prototype banner states timer is not active; state gallery deferred to Phase 3/4). NICE-TO-HAVE: menu arrow-key nav deferred (Phase 3 a11y), settings control out of Phase 2 focus, DNF duplication FIXED, PB-on-single-solve FIXED (badge only when >1 solve).
- Anti-slop: NEEDS WORK — all findings fixed: truncated square-1 scramble regenerated; SVG font sizes 10→16; notice/footer text-xs→text-sm (14px floor); menu trigger aria-label removed (label-in-name); Sample badge → info tokens; copy-failure inline hint with next step; menu item radius/padding on 8px/4px scale; DNF duplicate removed.
- Known left-outs: settings dialog, solve-row actions menu, keyboard shortcuts, empty-state gallery, tabs (two-column layout instead), test scripts.
- Open decisions for human (defaults used): UI English, name CubeTime, license undecided (cubing.js GPL-3.0 relevant if repo public).
- Scores (applicable categories): (none given — no per-category scores supplied)
- Satisfied / Not satisfied: (not stated; approval given via "oke sip")
- Bug notes and requested revisions: (none listed). Verbal request to continue: "lanjut bikinfrontend" → next phase is Phase 3 (Frontend).
- Prompt used: PRD Section 14 Phase 2 prompt
- Human decision: Approve — 2026-10-14, quote: "oke sip, lanjut bikinfrontend"; tag phase-2-approved at 22a9cb2
- Addendum (delta db456d8, 2026-10-13): scramble-view 3D visualization added at human's request — `src/components/scramble-view.tsx` (cubing@0.65.1 TwistyPlayer, 3D, no controls/links, dynamic import in useEffect with cleanup, aria-hidden, try/catch falls back to text scramble), wired into scramble-panel; `PuzzleId` union tightened across sample-data/timer-app/top-bar. Delta diff d9da605→db456d8 touches only scramble-view/scramble-panel/timer-app/top-bar/sample-data/package.json + lock + opencode.json (testsprite enable flags swept in, source unknown — flagged to human, not Phase 2 work). Checks re-run after delta: lint/typecheck/build all exit 0 (builder-run, tester-confirmed). Anti-slop scoped review: PASS after fixes (try/catch added; PuzzleId exhaustiveness enforced via `Record<Puzzle["id"], PuzzleID>`), 2 low findings fixed. Not verified: in-browser WebGL render (no Playwright browsers in WSL) — human must eyeball via `npm run dev`.

### Phase 3 — Frontend — 2026-10-14
- Agent summary: Accessible/responsive pass over the approved prototype + PRD-mandated type ports. Menu got APG-style roving tabindex (menuitems `tabIndex=-1`, focus first item on open, ArrowUp/Down/Home/End, focus returns to trigger after select, closes when focus leaves root). Page has a sole `<h1>` (top bar brand). Scramble graphic failure now shows a visible `role="status"` message + "Try again" button (attempt counter retriggers the effect); status placeholder is always mounted so screen readers hear the change. All `text-xs` → `text-sm` (DESIGN 14px floor; 10 occurrences). New type-only ports: `src/lib/timer/types.ts` (TimerPhase incl. holding/ready/saving/saved per DESIGN state table, TimerEngine), `src/lib/scrambles/types.ts` (ScrambleResult, ScrambleProvider), `src/lib/storage/types.ts` (SolveRecord/SessionRecord/SettingsRecord per PRD §7, SolveRepository/SessionRepository). Layout/copy of Phase 2 unchanged.
- Commands / tests and observed results: tester ×2 (pre-fix and post-fix): `npm run lint`, `npm run typecheck`, `npm run build` all PASS (exit 0, 4/4 static pages). Builder also ran all three on final state. `npm run test`/`test:e2e` still missing scripts (no runner until later phases).
- Reviewer: APPROVE WITH FINDINGS — High: Tab cycled through 10 menuitems with menu open → FIXED (roving tabindex + blur-close). Medium: timer/storage ports too thin → FIXED (TimerEngine, SolveRepository/SessionRepository); stale failure message during retry → FIXED (cleared on retry click). Minor: Home/End → ADDED; lint observation → provided by tester.
- Anti-slop: NEEDS WORK → ALL FIXED except one deliberate override: it wanted the three type-port files deleted as dead code (zero importers); kept because PRD Phase 3 explicitly requires "timer, scramble, statistics, and storage logic behind clear interfaces" (consumers arrive Phases 4/5). Also fixed: DESIGN line-106 retry action + always-mounted status + copy ("The scramble graphic didn't load. Use the scramble text above."), deduped querySelectorAll into `menuButtons()`, TimerPhase extended to DESIGN's full state set, all 10 `text-xs` → `text-sm`.
- Interface note: statistics has no new file — its interface is the existing pure helpers in `src/lib/sample-data.ts`; split to `src/lib/statistics` deferred to Phase 6 (reviewer accepted).
- Known left-outs: runtime keyboard/failure behavior unverified (no browser in agent env — human to eyeball via `npm run dev`), no timer/persistence/real-scramble logic (Phases 4-5), no test runner (Phase 6), type ports have zero consumers yet.
- Scores (applicable categories): (none given — no per-category scores supplied)
- Satisfied / Not satisfied: (no explicit statement; approval given via "oke sip")
- Bug notes and requested revisions: (none listed). Verbal request to continue: "lanjut ke fase 4" → next phase is Phase 4 (Timer and scramble engine).
- Prompt used: PRD Section 14 Phase 3 prompt
- Human decision: Approve — 2026-10-14, quote: "oke sip karena ga banyak yang harus di tambah, jadi lanjut ke fase 4"; tag phase-3-approved at d4b5e64

### Phase 4 — Timer and scramble engine — 2026-10-14
- Agent summary: Real timer + real scrambles. `src/lib/timer/engine.ts` (performance.now timestamps, idle/holding/ready/running/stopped; hold-to-ready implemented but default off — ponytail note until Phase 5 setting). Keyboard hook: Space start/stop (preventDefault, typing-guard, repeat-guard, ignored inside open menus), N new scramble when idle/stopped, D toggles DNF on the last stopped solve, Esc cancels ready (dormant). Scramble adapter `src/lib/scrambles/adapter.ts` = cubing@0.65.1 `randomScrambleForEvent` (cubing/scramble subpath, main thread) behind `ScrambleProvider`; panel shows Generating…/error+retry; New Scramble & N & timer start blocked until scramble ready; puzzle switch locked while timer active (menu items disabled + handler guards); puzzle switch clears stale scramble text. Sample data REMOVED — sessions are in-memory real SolveRecords (default session per puzzle, crypto.randomUUID ids); banner + footer + empty state all say memory-only, never "saved". Penalties: +2/DNF toggle buttons + D shortcut on the latest stopped solve only; rawTimeMs preserved, penalty separate. Timer card: rAF live digits, DNF/effective display per DESIGN, ≥56px touch control, sr-only aria-live (phase + penalty), "Waiting for scramble…" when !ready. Shortcuts documented in footer. Vitest + `npm run test` (16 tests: engine, keyboard helpers, 10-puzzle generation + non-duplicate 3x3).
- Commands / tests and observed results: tester ×2: `npm run lint`, `npm run typecheck`, `npm test` (16/16), `npm run build` all PASS on final state. Builder re-ran all four too. Node-side generation evidence in adapter.test.ts logs (333 ~4ms, sq1 ~474ms, etc.). Browser timing/keyboard/visual behavior NOT observed (no Playwright in agent env).
- Reviewer: BLOCK → Critical: puzzle switching mid-solve rewired the active scramble and would record the solve under the new puzzle with the old scramble — FIXED (selectionLocked, disabled menu items, handler guards, scramble cleared on switch). Should-fix: Space vs open-menu a11y — FIXED (isInsideMenu skip); stale copyable scramble on switch — FIXED (clear); hold-path stale digits — FIXED (arm() resets lastElapsed); test title "WCA-style" — softened. Noted clean: T01–T11 mapping, honest not-saved labeling, penalty separation, no scope creep.
- Anti-slop: NEEDS WORK → all fixed: dead Esc shortcut dropped from footer; footer/empty-state persistence contradiction resolved (memory-only wording); "Waiting for scramble…" idle label + disabled toggle; aria-live now includes +2/DNF note; aria-label removed (visible hint is the accessible name); HOLD_TO_READY ponytail note.
- Known left-outs: hold-to-ready unreachable in UI (engine+tests ready; setting in Phase 5); saving/saved states + persistence (Phase 5); manual entry FR-T07, delete/undo FR-T09, editing older rows' penalties (Phase 5/6); statistics module rewrite + trends polish (Phase 6); e2e (Phase 7). `npm run test:e2e` still unconfigured.
- Open decisions for human: defaults unchanged (UI English, name CubeTime, license undecided — cubing.js GPL-3.0-or-later; scramble-display also GPL-3.0-or-later).
- Scores (applicable categories): (none given)
- Satisfied / Not satisfied: (pending)
- Bug notes and requested revisions: Human check 1 (2026-10-14): "scramble generationnya fail". Root cause (systematic-debug, commit 40ef365): cubing.js runs its search in a module worker whose entry loads sibling chunks by relative path; bundling rewrites those paths (cubing#309/#327). Evidence in compiled dev chunks: strategy 1 lost `import.meta.resolve` (TypeError), strategy 3's emitted raw entry 404'd on `./chunk-*.js` inside the worker; adapter had also swallowed the real error message. Fix: postinstall `scripts/copy-cubing.mjs` copies dist → `public/cubing` (gitignored, eslint-ignored), adapter imports `/cubing/scramble/index.js` as native ESM via Function-import with package fallback (Node tests), panel now shows the underlying error text. Verified: new vitest loads the copy by file URL and generates (17/17), lint/typecheck/build pass, dev+prod HTTP serve entry/worker/siblings (200). NOT yet verified in a real browser (no browser in agent env) — human re-check pending. Human review 2 (2026-10-14): 5 revision items requested (1) delete a solve from solve history; (2) PB label moved below the time in the Best Single stat; (3) hold-to-start — timer must not run until Space is released; (4) timer changes color while Space is held; (5) transition when running: hide all elements except the timer and center it fullscreen, then on stop transition back to the original position with elements returning. Phase 4 tag NOT created — remains unapproved pending revisions. No phase advance.
- Prompt used: PRD Section 14 Phase 4 prompt
- Human decision: Revise — 2026-10-14, quote: "tambahin fitur buat hapus time di solve history, perbaikin tulisan PB di stat Best Single jadi dibawah waktunya, tambahin fitur hold dulu sebelum waktu jalan jadi kalau spacebar belum di release waktu belum jalan. buat timernya berubah warna kalo lagi di hold spacebar. Bikin transisi kalau waktunya udh jalan, hide semua elemen kecuali timer terus timer bergerak ke tengah screen, lalu pas timer berhenti ada transisi lagi dia balik ke posisi semulanya dan elemen balik lagi" — superseded by review 2 below
- Human decision (review 2): Approve — 2026-10-14, quote: "oke fungsional sudah oke, lanjut fase 5"; tag phase-4-approved at 40973df (revisions: delete solve w/ inline confirm, PB below value in Best Single, HOLD_TO_READY=true hold-to-start, holding/ready state colors, running focus fade+FLIP transition, Space auto-repeat scroll fix, keyboard-only start/stop)

### Phase 5 — Local persistence and portability — 2026-10-14
- Agent summary: Phase 5 implemented and committed as 6995b86 (local, not pushed; branch ahead of origin by 24 commits; no tag). IndexedDB persistence via idb (DB `cubetime` v1), versioned JSON backup with zod validation, CSV export, import with merge/replace modes, delete-all with typed DELETE, start-mode setting surfaced in UI, 3 Playwright e2e tests (browsers human-installed in ~/.cache/ms-playwright). Save states (Saving…/Saved) live in the timer UI. Subagent reviews run before final fixes; tester re-run after fixes.
- Commands / tests and observed results: tester observed `npm run lint`, `npm run typecheck`, `npm run build` all pass, and `npm run test` = 29 tests, 4 files (engine, keyboard, adapter, backup). Builder re-ran all checks green after fixes. `npm run test:e2e` = 3/3 builder-observed (refresh persistence, settings persist, export→delete-all→merge-import). First e2e run failed on a strict-mode sr-only selector; fixed with `.first()`, then 3/3.
- Reviewer: BLOCK Criticals: C1 raced-session merge resurrected deleted data after delete-all/replace — FIXED; C2 writes silently skipped when storageOk false / openDB could hang — FIXED (writes always attempted, 5s open timeout). SHOULD-FIXs all addressed: atomic replace tx, export available during storage failure, e2e for delete/import added. NICE-TO-HAVEs largely addressed: CSV formula-injection guard, delete-all copy includes settings, dismissible save notice, imported defaultPuzzleId coercion; original exportedAt carried through.
- Anti-slop: verdict initially NEEDS WORK with 4 MUST-FIX — all fixed (accent-primary instead of green radios, storageError as red alert, live Saving…/Saved states replacing "Stopped — not saved yet", specific error copy). SHOULD-FIXes also fixed: h-10 button pattern, destructive token, footer copy dedupe, dismiss, radio tap targets, solve-history empty copy.
- Known left-outs: pushed state (branch local-only, 24 commits ahead — push awaits human OK per workflow); no tag; human must eyeball persistence flows in a real browser.
- Scores (applicable categories): (none given — awaiting human review)
- Satisfied / Not satisfied: (pending)
- Bug notes and requested revisions: (pending — no human review yet)
- Prompt used: PRD Section 14 Phase 5 prompt
- Human decision: (pending)
