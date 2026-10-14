# CubeTime — Progress Log

Maintained by the project-manager subagent. Only the human approves phases.
Phase numbers follow PRD Section 14. Where PRD Section 3 and Section 14 differ (for example, where import/export belongs),
Section 14 wins.

| Phase | Status | Approved tag | Last commit | Notes |
|---|---|---|---|---|
| 1 Validate and plan | Approved | — (verbal only, no tag created) | e4bc97c | Human said "oke sip lanjut prototype" |
| 2 Prototype | Approved | phase-2-approved (22a9cb2) | 22a9cb2 | Human approved 2026-10-14: "oke sip, lanjut bikinfrontend". Tag covers commits through 22a9cb2 incl. scramble-display swap (46832f2) + layout tweak (b6aa1fc, 22a9cb2) landed after audit. Branch ahead 8, not pushed |
| 3 Frontend | Approved | phase-3-approved (d4b5e64) | d4b5e64 | Human approved 2026-10-14: "oke sip karena ga banyak yang harus di tambah, jadi lanjut ke fase 4" (no scores given). Work: menu keyboard/roving focus, sole h1, scramble-failure retry, 14px text floor, type ports. Tag covers commits through d4b5e64. Branch ahead 11, not pushed |
| 4 Timer and scramble engine | Approved | phase-4-approved (40973df) | 40973df | Approved 2026-10-14 after review 2 revisions (delete solve w/ inline confirm, PB below value, hold-to-start HOLD_TO_READY=true, timer state colors, running focus fade+FLIP transition, Space scroll fix, keyboard-only start/stop): "oke fungsional sudah oke, lanjut fase 5". Earlier: commits 2456603..8c5a460 (timer engine, keyboard controls, live cubing.js scrambles, in-memory solves, +2/DNF, vitest); review 1 Revise → revision commit 40973df. Not pushed |
| 5 Local persistence and portability | Approved | phase-5-approved (6995b86) | 6995b86 | Approved 2026-10-14: "fungsional udah oke". Tag phase-5-approved @ 6995b86 (implementation commit; docs commit 3ab828b on top). Covers IndexedDB persistence (idb, DB cubetime v1), versioned JSON backup + zod validation, CSV export, import merge/replace, delete-all, start-mode setting, 3 Playwright e2e; lint/typecheck/29 unit tests/build all pass, e2e 3/3 builder-observed. Not pushed. Same message requested follow-up features (tracked as in-progress work, NOT part of the approval): new session creation in the session dropdown; solve-detail popup from history rows with time stats + scramble + scramble visual; +2/DNF buttons in the Status column and in the popup; history columns reworked to time/ao5/ao12/status/delete; clicking an ao5/ao12 cell opens a horizontal list of the window's times |
| 6 Statistics and integration | Not started | — | — | |
| 7 Verification and bug fixing | Not started | — | — | |
| 8 Deploy | Not started | — | — | |

Status values: Not started · In progress · Awaiting human check · Approved · Revise · Rejected

## Decisions
- Scramble library = cubing.js. Node-side spike with `randomScrambleForEvent` produced output for all 10 puzzles in PRD Section 4; browser/worker verification still due in Phase 4 (CODEMAP Section 5 matrix stays "unverified" until then).
- UI language default = English (PRD does not specify; confirm or change).
- Product name "CubeTime" is a working title (confirm or change).

## Open questions
- Repository license (cubing.js is GPL-3.0 — relevant if the repo is public).
- Confirm defaults: UI language English, product name CubeTime.
- Phase 2 was approved verbally for Phase 1 only; Phase 1 has no `phase-1-approved` tag — create one retroactively, or leave verbal-only?

## Known issues carried forward
- (none yet)
