# CubeTime — agent rules

Build ONLY the phase the human requested, then stop. Never start the next phase on your own.
The PRD is PRD_CUBETIME.md. Section 3 is the approval workflow, Section 14 defines the 8 phases (phase numbers follow it).
Do not read the whole PRD every time: use the PRD index in docs/CODEMAP.md and read only the lines you need
(Phase 1 is the one exception: read the PRD completely once).

## Dev environment
The human works in WezTerm on Ubuntu (WSL2). Use Linux shell commands and Linux paths, never PowerShell or Windows paths.
The repo lives on the Linux filesystem (not /mnt/c). The app is deployed to Vercel from GitHub, so there is nothing to build on the Windows side.
Playwright in WSL needs its browsers and system libraries installed by the human (`npx playwright install --with-deps chromium`
needs sudo). If they are missing, say so; do not try to install them.

## Context protocol (saves tokens)
docs/CODEMAP.md is loaded automatically. It is the project's memory, so use it before anything else.
1. Do NOT scan the repo. Use the map to find files, then open only what the task needs, with line ranges when possible.
2. Do not re-read a file you already read in this session unless it changed.
3. If the map says "not initialized" and the repo has code, call context-keeper in INIT mode first.
   If the map's `Synced at` hash differs from `git rev-parse --short HEAD`, call context-keeper in SYNC mode first.
4. Before creating a component, hook, util, or lib module, check sections 4 and 7 of the map for an existing one.
5. If the map contradicts the code, trust the code and tell context-keeper to fix the map.

## Subagents (invoke with the task tool; they start with no memory of this conversation,
## so always tell them the phase, the modules, and what to focus on)
1. Start of a phase: project-manager in BRIEF mode. A BLOCKER means stop and ask the human.
2. Before the phase report, run the checks for that phase (table below). Fix Critical findings, then run tester again.
3. Commit the phase's work locally, then call context-keeper in SYNC mode and pass: the files you changed, new patterns,
   decisions, new reusable components, and any scramble verification results. Never push without the human's OK.
4. Then project-manager in AUDIT mode with your draft phase report. Put its verdict and findings, plus the other
   subagents' findings, in the final report as written.
5. When the human reviews the phase, call project-manager in RECORD mode and quote the human's message exactly.
   If the human approved: create the tag `phase-N-approved` first.

| Phase | tester | reviewer | anti-slop | testsprite-runner |
|---|---|---|---|---|
| 1 Validate and plan | only if code was written | yes (plan against the PRD) | no | no |
| 2 Prototype | yes (lint, typecheck, build) | yes | yes | no |
| 3 Frontend | yes | yes | yes | no |
| 4 Timer and scramble engine | yes | yes | yes (timer states) | no |
| 5 Persistence and portability | yes | yes | yes (backup UI) | no |
| 6 Statistics and integration | yes | yes | yes | optional |
| 7 Verification and bug fixing | yes | yes | yes | yes, if the human has enabled it |
| 8 Deploy | yes (production build) | no | no | no |

## Hard product rules (from the PRD, never bend them)
- No backend, API routes, database, authentication, analytics, or cloud sync in the MVP.
- Time with `performance.now()` only. Store raw milliseconds. Never fake or generically randomize a scramble.
  Never claim WCA validity without evidence. If a puzzle has no verified generator, stop and ask the human.
- A completed solve is never silently discarded and is persisted before the UI calls it saved.
- Never say a check passed unless it was actually run and the result observed.

## Always
- Follow docs/DESIGN.md for every UI decision. PRD Section 6 still wins.
- No runtime requests to third parties (CDN, remote fonts, analytics). The timer must work if the network drops.
- Never commit secrets or real credentials. API keys come from environment variables only. Never commit `testsprite_tests/`.
- Phase report format is in PRD Section 3 and must end with: "Stopped. Waiting for your approval."
