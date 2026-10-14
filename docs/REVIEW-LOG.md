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
- Scores (applicable categories): (none given)
- Satisfied / Not satisfied: (pending)
- Bug notes and requested revisions: (pending)
- Prompt used: PRD Section 14 Phase 3 prompt
- Human decision: (pending)
