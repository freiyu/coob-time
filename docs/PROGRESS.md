# CubeTime — Progress Log

Maintained by the project-manager subagent. Only the human approves phases.
Phase numbers follow PRD Section 14. Where PRD Section 3 and Section 14 differ (for example, where import/export belongs),
Section 14 wins.

| Phase | Status | Approved tag | Last commit | Notes |
|---|---|---|---|---|
| 1 Validate and plan | Approved | phase-1-approved (b777daa, retroactive 2026-10-15) | b777daa | Originally approved verbally ("oke sip lanjut prototype"); retroactively confirmed 2026-10-15: "sisanya approve dari phase 1 sampe 5" |
| 2 Prototype | Approved | phase-2-approved (22a9cb2) | 22a9cb2 | Human approved 2026-10-14: "oke sip, lanjut bikinfrontend". Tag covers commits through 22a9cb2 incl. scramble-display swap (46832f2) + layout tweak (b6aa1fc, 22a9cb2) landed after audit. Branch ahead 8, not pushed |
| 3 Frontend | Approved | phase-3-approved (d4b5e64) | d4b5e64 | Human approved 2026-10-14: "oke sip karena ga banyak yang harus di tambah, jadi lanjut ke fase 4" (no scores given). Work: menu keyboard/roving focus, sole h1, scramble-failure retry, 14px text floor, type ports. Tag covers commits through d4b5e64. Branch ahead 11, not pushed |
| 4 Timer and scramble engine | Approved | phase-4-approved (40973df) | 40973df | Approved 2026-10-14 after review 2 revisions (delete solve w/ inline confirm, PB below value, hold-to-start HOLD_TO_READY=true, timer state colors, running focus fade+FLIP transition, Space scroll fix, keyboard-only start/stop): "oke fungsional sudah oke, lanjut fase 5". Earlier: commits 2456603..8c5a460 (timer engine, keyboard controls, live cubing.js scrambles, in-memory solves, +2/DNF, vitest); review 1 Revise → revision commit 40973df. Not pushed |
| 5 Local persistence and portability | Approved | phase-5-approved (6995b86) | 6995b86 | Approved 2026-10-14: "fungsional udah oke". Tag phase-5-approved @ 6995b86 (implementation commit; docs commit 3ab828b on top). Covers IndexedDB persistence (idb, DB cubetime v1), versioned JSON backup + zod validation, CSV export, import merge/replace, delete-all, start-mode setting, 3 Playwright e2e; lint/typecheck/29 unit tests/build all pass, e2e 3/3 builder-observed. Not pushed. Same message requested follow-up features (tracked as in-progress work, NOT part of the approval): new session creation in the session dropdown; solve-detail popup from history rows with time stats + scramble + scramble visual; +2/DNF buttons in the Status column and in the popup; history columns reworked to time/ao5/ao12/status/delete; clicking an ao5/ao12 cell opens a horizontal list of the window's times |
| 6 Statistics and integration | Approved | phase-6-approved (0e42fd7, 2026-10-16) | 0e42fd7 | Core (5fb1905..77e26ca + stretch 97ed16c + 4 review rounds 094b0f8/5a33b9a/951e857) verified 2026-10-15: lint/typecheck/vitest 61/61/build/e2e 3/3 + browser one-offs. Scores 2026-10-15: 5/4/4/3/5/5/5/4 (backup satisfied; tests+mobile deferred). Revise requested 2026-10-15, resolved by responsive revision 13d75cb..0e42fd7 (locked/unlocked shell at ≥1024x640, scrollable below, fullscreen history-scroll fix). Approved 2026-10-16: "untuk sejauh ini sudah oke, sekarang kita lanjut aja ke fase 7, inget, testsprite aku itu free jadi punya 150 credit doang." Note for Phase 7: TestSprite = free tier, 150-credit budget — use testsprite-runner sparingly |
| 7 Verification and bug fixing | Awaiting human check | — | 4b886f2 | Verification complete, awaiting human approval. Evidence: lint ✓, typecheck ✓, vitest 61/61, e2e 4/4 (incl. permanent 73-assert matrix e2e/verification.spec.ts), production build ✓ (Compiled successfully, exit 0); browser matrix covered all PRD §11 pre-deploy rows; no app-code bugs found (bugfix-free). TestSprite unused (PRD-gen MCP timeouts x3, 150 credits untouched). Reviewers: reviewer APPROVE; anti-slop's final MUST (generator-failure assert) fixed, e2e re-run green |
| 8 Deploy | Not started | — | — | |

Status values: Not started · In progress · Awaiting human check · Approved · Revise · Rejected

## Decisions
- Scramble library = cubing.js. Node-side spike with `randomScrambleForEvent` produced output for all 10 puzzles in PRD Section 4; browser/worker verification still due in Phase 4 (CODEMAP Section 5 matrix stays "unverified" until then).
- UI language default = English (PRD does not specify; confirm or change).
- Product name "CubeTime" is a working title (confirm or change).

## Open questions
- Repository license (cubing.js is GPL-3.0 — relevant if the repo is public).
- Confirm defaults: UI language English, product name CubeTime.
- Resolved: Phase 1 tag `phase-1-approved` created retroactively at b777daa (2026-10-15); Phases 1–5 all confirmed approved.
- Resolved: Phase 6 revise request (2026-10-15) satisfied by responsive revision; approved 2026-10-16, tag `phase-6-approved` @0e42fd7.
- Phase 7: TestSprite free tier = 150 credits total — human constraint (2026-10-16); run testsprite only if it fits the budget, optional per PRD Section 14.

## Known issues carried forward
- (none yet)
