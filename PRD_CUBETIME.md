# Speedcubing Timer --- Product Requirements Document (PRD)

**Document version:** 1.0\
**Status:** Draft for human review\
**Product type:** Client-side web application\
**Deployment target:** Vercel\
**Primary principle:** Fast, keyboard-friendly timing with solve history
stored locally in each browser.

------------------------------------------------------------------------

## 1. Tech Stack (Read First)

Use this stack unless a documented technical blocker is discovered. Do
not introduce a database or user-account system for the MVP.

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Framework               Next.js (App Router)    Application framework
                                                  and Vercel deployment

  Language                TypeScript              Type safety and
                          (`strict: true`)        maintainable code

  UI                      React                   Interactive timer and
                                                  views

  Styling                 Tailwind CSS            Responsive styling and
                                                  design system

  UI primitives           shadcn/ui + Radix UI    Accessible dialogs,
                          where useful            menus, tabs, tooltips

  Icons                   Lucide React            Consistent interface
                                                  icons

  Client state            React state + a small   Active timer, selected
                          store only if needed    puzzle, session UI
                          (e.g. Zustand)          

  Local persistence       IndexedDB via `idb`     Durable local solve
                                                  history, sessions,
                                                  settings, and scramble
                                                  records

  Scramble generation     A maintained,           Correct scrambles and
                          puzzle-specific         puzzle-aware utilities
                          scramble library such   
                          as `cubing.js` /        
                          `cubing` where          
                          supported               

  Time measurement        `performance.now()`     Monotonic
                                                  high-resolution
                                                  elapsed-time
                                                  measurement

  Validation              Zod                     Validate imported data
                                                  and persisted settings

  Unit/component tests    Vitest + React Testing  Timer logic,
                          Library                 statistics, and UI
                                                  behavior

  Browser E2E tests       Playwright              Real-browser timing
                                                  flow, persistence, and
                                                  responsive checks

  Package manager         npm                     Dependency installation
                                                  and scripts

  Source control          Git + GitHub            Version control and
                                                  review

  Hosting                 Vercel                  Build, preview
                                                  deployments, and
                                                  production hosting
  -----------------------------------------------------------------------

### Technical rules

1.  This is a **local-first, client-side application**. All solve
    history belongs to the browser profile and origin that created it.
2.  Do not add authentication, a remote database, analytics, or cloud
    sync to the MVP.
3.  Do not rely on a server request to start or stop the timer. Timing
    must continue to work after the app has loaded, even if the network
    temporarily disconnects.
4.  Use `performance.now()` for elapsed time; do not calculate solve
    duration by subtracting wall-clock timestamps.
5.  Persist completed solves and settings in IndexedDB. Use localStorage
    only for small, non-critical UI preferences if genuinely useful.
6.  The scramble engine must be verified puzzle by puzzle. Do not fake
    scrambles, use a generic random string for every puzzle, or claim
    WCA-valid generation unless the selected library supports it.
7.  If the chosen library does not support a requested puzzle or
    scramble type, document the gap and propose a verified
    implementation before proceeding.
8.  Avoid adding a backend simply because Next.js supports one.
    Server-side functionality is not required for the MVP.

------------------------------------------------------------------------

## 2. Product Overview

### 2.1 Working name

**CubeTime** (working title; easy to rename later).

### 2.2 Product vision

Build an attractive, responsive speedcubing timer that feels quick and
satisfying to use, offers reliable puzzle-specific scrambles, and keeps
a user's solve history available locally without requiring an account.

### 2.3 Problem statement

Speedcubers need a convenient timer that can be opened from a desktop or
mobile browser, select different twisty puzzles, display scrambles,
record solves, calculate useful statistics, and preserve session
history. The app should avoid the friction of registration and cloud
setup.

### 2.4 Target users

-   Beginners learning to time their solves.
-   Casual cubers practicing multiple puzzle types.
-   Experienced cubers who want quick sessions, keyboard controls, and
    statistics.
-   Users switching between desktop and mobile browsers.

### 2.5 Product goals

-   Make starting, stopping, and recording a solve feel immediate.
-   Support the requested puzzle list with puzzle-appropriate scrambles.
-   Save every completed solve locally and restore it on return.
-   Make sessions and statistics understandable without overwhelming
    beginners.
-   Provide a polished, responsive interface with accessible controls.
-   Deploy the app to Vercel with a simple GitHub-based workflow.

### 2.6 Non-goals for MVP

-   Accounts, login, or user profiles.
-   Cloud synchronization between devices or browsers.
-   Shared leaderboards, social features, or competitions.
-   Official WCA competition administration or result submission.
-   Native mobile applications.
-   Online multiplayer.
-   A server-side database.
-   Guaranteed official inspection/penalty rules for every puzzle unless
    explicitly implemented and tested.

------------------------------------------------------------------------

## 3. Human Approval Workflow (Mandatory)

Development must happen in stages. The AI coding agent must complete
**only the current phase**, summarize its work, provide verification
results, and stop for human approval. It must not automatically continue
to the next phase.

1.  Planning and technical validation.
2.  Prototype and visual direction.
3.  Human review and approval.
4.  Frontend implementation.
5.  Human review and approval.
6.  Timer engine, scramble integration, and local persistence.
7.  Human review and approval.
8.  Statistics, history, import/export, and integration.
9.  Human review and approval.
10. Testing, bug fixing, and accessibility/responsive checks.
11. Human acceptance testing.
12. Vercel deployment and documentation.

At each checkpoint, the agent must provide: - What was built and what
was intentionally left out. - Files added or changed. - Commands run and
their results. - Known bugs, limitations, and assumptions. - A short
checklist for human review. - A clear request for approval before
proceeding.

### Approval rule

No phase transition without explicit user approval such as "Prototype
OK, continue frontend." If the user requests changes, revise the current
phase and stop again.

------------------------------------------------------------------------

## 4. Puzzle Support

The puzzle selector must include these puzzles:

  --------------------------------------------------------------------------
  Puzzle                  Required scramble support  Notes
  ----------------------- -------------------------- -----------------------
  2×2×2                   Puzzle-specific            Display readable
                          random-state/random-move   notation
                          scramble, according to     
                          supported library          

  3×3×3                   Puzzle-specific scramble   Main/default puzzle

  4×4×4                   Puzzle-specific scramble   Support wide turns and
                                                     notation as appropriate

  5×5×5                   Puzzle-specific scramble   Support wide turns and
                                                     notation as appropriate

  6×6×6                   Puzzle-specific scramble   Support wide turns and
                                                     notation as appropriate

  7×7×7                   Puzzle-specific scramble   Support wide turns and
                                                     notation as appropriate

  Megaminx                Megaminx-specific scramble Format must remain
                                                     readable on narrow
                                                     screens

  Square-1                Square-1-specific scramble Preserve shape-turn
                                                     notation and ordering

  Pyraminx                Pyraminx-specific scramble Include tips when
                                                     required by generator

  Skewb                   Skewb-specific scramble    Use valid puzzle
                                                     notation
  --------------------------------------------------------------------------

### Scramble behavior

-   Generate a new scramble when a puzzle is selected and after a solve
    is recorded, unless the user has explicitly disabled automatic next
    scrambles.
-   Provide a **New Scramble** button.
-   Provide a **Copy Scramble** control.
-   Show the selected puzzle name clearly.
-   Display scramble text with good contrast, spacing, and wrapping.
-   Do not change the scramble during an active solve.
-   Save the exact scramble used with each completed solve.
-   If generation fails, show a clear recoverable error; never silently
    display a fake scramble.
-   The agent must test at least one generated scramble for each
    supported puzzle type and document the source/library behavior.

### Scramble validity note

The implementation must identify which puzzle types are supported by the
selected library and whether its output is WCA-style or otherwise. Do
not claim official competition compliance without evidence. If support
is incomplete, stop and ask for a product decision rather than silently
substituting an unverified generator.

------------------------------------------------------------------------

## 5. Functional Requirements

### 5.1 Timer

**FR-T01 --- Idle state:** Display `0.00` or a similarly readable zero
state before timing.

**FR-T02 --- Keyboard start/stop:** On desktop, use Space as the primary
timer control. Prevent Space from scrolling the page while the timer is
focused/active, and ignore keyboard shortcuts when the user is typing in
an input, textarea, or editable control.

**FR-T03 --- Hold-to-ready option:** Provide an optional
inspection/ready interaction: holding Space prepares the timer and
releasing it starts the solve. This must be configurable and must not
make the basic start/stop behavior confusing.

**FR-T04 --- Touch controls:** On touch devices, provide a large, clear
start/stop control. The app must not depend on a physical keyboard.

**FR-T05 --- Accurate duration:** Measure duration with
`performance.now()`. Update the display smoothly while running, but
store the measured elapsed duration rather than a rounded display value.

**FR-T06 --- Stop and record:** Stopping creates a pending solve result
with elapsed time, puzzle, scramble, timestamp, and session ID. Persist
it reliably before presenting it as safely saved.

**FR-T07 --- Manual entry:** Let users add a solve manually by entering
a valid time. Clearly distinguish manual entries in the record metadata.

**FR-T08 --- DNF and +2:** Let users mark a solve as `DNF` or apply a
`+2` penalty. Preserve the original measured time and store the
penalty/status separately. The displayed and statistical time must
follow documented rules.

**FR-T09 --- Delete/undo:** Allow a solve to be deleted with
confirmation or provide an undo path. Avoid accidental permanent
deletion.

**FR-T10 --- Active timer protection:** Switching tabs or briefly losing
focus must not corrupt the measured duration. The timer must calculate
elapsed time from timestamps, not count animation frames.

**FR-T11 --- Prevent accidental shortcuts:** Keyboard actions must not
fire twice from key-repeat. Handle keydown/keyup carefully.

### 5.2 Sessions

-   Users can create, rename, switch, and delete sessions.
-   A default session is created automatically on first use.
-   Every solve belongs to one session.
-   A session is scoped to a selected puzzle, or the UI must make
    mixed-puzzle sessions explicit and ensure statistics only compare
    compatible puzzle types.
-   Show solve count and basic summary for the selected session.
-   Deleting a session must require confirmation and explain that its
    solves will also be deleted.

### 5.3 Solve history

-   Show solves in reverse chronological order or a clearly documented
    order.
-   Each row includes solve number, time, penalty/status, and relevant
    actions.
-   Selecting a solve reveals its scramble and details.
-   Allow editing a solve's penalty/status and notes.
-   Allow deletion with protection against accidental action.
-   Persist changes in IndexedDB.
-   Show a clear empty state for new users.
-   Handle database initialization or read/write errors with
    understandable feedback.

### 5.4 Statistics

Provide statistics for the selected puzzle/session, at minimum: - Number
of solves. - Best single. - Current/overall average where mathematically
meaningful. - Mean of all valid solves, clearly labeled. - Ao5 (average
of 5). - Ao12 (average of 12). - Best Ao5 and best Ao12. - Solve-time
trend chart. - Session summary.

Statistical rules: - `+2` adds two seconds to the effective time. -
`DNF` is not treated as zero seconds. - For WCA-style averages of 5 or
12, remove the fastest and slowest result; if a DNF is present, apply
documented DNF handling. Use consistent, tested rules and label these as
WCA-style only if implementation matches those rules. - Do not calculate
averages across different puzzle types. - Show "Not enough solves"
rather than misleading values. - Include tests for edge cases such as
DNF, +2, ties, and insufficient solve counts.

### 5.5 Local data and portability

**Persistence requirements** - Use IndexedDB as the source of truth for
solves, sessions, and settings. - Data must survive refreshes,
closing/reopening the browser, and normal app redeployments at the same
origin, subject to browser storage behavior. - Provide an explicit
**Export Backup** action that downloads a versioned JSON backup
containing sessions, solves, settings, and schema version. - Provide
**Import Backup** with validation, a preview/confirmation step, and
clear duplicate/conflict handling. - Provide CSV export for solve
history so users can analyze results in spreadsheet software. - Before
replacing or merging local data, clearly explain the action and request
confirmation. - Provide a **Delete All Local Data** action with a strong
confirmation step. - Show that data is stored only in the current
browser profile/origin and is not automatically synced.

**Important limitation** Local browser storage is not a guaranteed
backup. Clearing site data, using a different browser/profile/device, or
browser storage eviction can remove or isolate records. The app must
communicate this and encourage periodic backup exports.

### 5.6 Settings

-   Default puzzle.
-   Timer start mode: tap/press or hold-to-ready, where supported.
-   Inspection/ready behavior on/off.
-   Sound feedback on/off.
-   Theme: dark, light, and system.
-   Decimal display preference if supported; internal timing precision
    must not change.
-   Auto-generate next scramble on/off.
-   Confirm before destructive actions.
-   Settings persist locally.

### 5.7 Keyboard shortcuts

  -----------------------------------------------------------------------
  Shortcut                            Action
  ----------------------------------- -----------------------------------
  Space                               Start/stop timer, when not typing

  N                                   Generate a new scramble, only when
                                      timer is idle

  D                                   Toggle DNF for the selected solve,
                                      when safe and unambiguous

  +2 action                           Apply +2 through a visible
                                      button/menu; optional shortcut only
                                      if discoverable

  Esc                                 Close modal/menu or cancel an
                                      unstarted ready state
  -----------------------------------------------------------------------

Shortcuts must be documented in the UI and must not interfere with
normal text entry or accessibility navigation.

------------------------------------------------------------------------

## 6. UI/UX and Visual Direction

### 6.1 Design principles

-   Modern, focused, playful, and polished; inspired by speedcubing
    dashboards without copying a specific product.
-   The timer is the visual centerpiece.
-   High readability: avoid thin fonts, tiny text, low contrast, and
    unnecessary decoration.
-   Strong hierarchy, generous spacing, clear states, and restrained
    animation.
-   Responsive from small phones to wide desktop monitors.
-   Dark theme as the initial default is acceptable, with light and
    system themes available.
-   Use motion for meaningful feedback only; respect reduced-motion
    preferences.

### 6.2 Main layout

**Desktop** - Top bar: product mark/name, puzzle selector, session
selector, theme/settings. - Main area: large timer, scramble panel,
new/copy scramble actions. - Secondary area: session statistics and
solve history. - History and stats can use tabs or a responsive
two-column layout.

**Mobile** - Large timer and touch control near the center. - Puzzle
selector accessible without a cramped navigation bar. - Scramble text
wraps cleanly. - History/statistics available through tabs or stacked
panels. - All interactive targets should be comfortable to tap.

### 6.3 Visual states

Design and implement states for: - Idle. - Ready/armed. - Running. -
Stopped with pending result. - Saving. - Saved. - DNF. - +2 penalty. -
Empty history. - Scramble generation failure. - Local storage failure. -
Import/export validation error. - Loading/initialization.

### 6.4 Accessibility

-   Use semantic HTML and accessible names for icon-only buttons.
-   Ensure keyboard navigation and visible focus indicators.
-   Maintain WCAG AA contrast where practical.
-   Do not rely on color alone to distinguish DNF, +2, running, or saved
    states.
-   Respect `prefers-reduced-motion`.
-   Keep timer text readable when browser zoom is increased.
-   Announce meaningful state changes to assistive technologies without
    announcing every timer tick.

------------------------------------------------------------------------

## 7. Data Model

Use TypeScript types and validate imported data with Zod. Suggested
logical model:

### Solve

-   `id`: unique ID.
-   `sessionId`: parent session.
-   `puzzleId`: canonical puzzle identifier.
-   `rawTimeMs`: measured/manual duration in milliseconds.
-   `penalty`: `none | plus2 | dnf`.
-   `scramble`: exact scramble text used.
-   `createdAt`: ISO timestamp.
-   `source`: `timer | manual | imported`.
-   `notes`: optional user note.
-   `schemaVersion`: record/data version as needed.

### Session

-   `id`: unique ID.
-   `name`: display name.
-   `puzzleId`: puzzle type for the session.
-   `createdAt`, `updatedAt`.
-   Optional session notes.

### Settings

-   `defaultPuzzleId`.
-   `startMode`.
-   `inspectionEnabled`.
-   `soundEnabled`.
-   `theme`.
-   `autoNextScramble`.
-   Other user preferences as needed.

### Data integrity rules

-   Use stable IDs; do not use array indexes as record IDs.
-   Keep raw time separate from penalty-adjusted/statistical time.
-   Store the scramble with each solve so history remains meaningful
    even if the scramble library changes.
-   Version the backup format and implement safe validation/migration
    behavior.
-   Never store sensitive information; no account or personal profile is
    required.

------------------------------------------------------------------------

## 8. Architecture

``` mermaid
flowchart TD
    U[User / Browser] --> UI[Next.js React UI]
    UI --> T[Timer Engine: performance.now]
    UI --> S[Puzzle Scramble Adapter]
    UI --> ST[Statistics Engine]
    UI --> R[Repository Layer]
    R --> IDB[(IndexedDB via idb)]
    R --> IO[JSON Backup / CSV Export]
    S --> LIB[Verified Scramble Library]
    UI --> V[Vercel Static/Next.js Hosting]
```

### Architecture notes

-   The browser UI and timer are client-side.
-   Vercel serves the application; it does not hold solve records.
-   IndexedDB is accessed through a repository abstraction so components
    do not directly manipulate database tables.
-   The scramble adapter isolates the app from library-specific APIs and
    allows support to be tested per puzzle.
-   The statistics engine is a pure module with unit tests.
-   Use client components only where interactivity/browser APIs are
    required. Avoid accessing `window`, IndexedDB, or `performance`
    during server rendering.
-   Avoid introducing API routes unless a future approved feature truly
    requires server-side work.

------------------------------------------------------------------------

## 9. Error Handling and Edge Cases

-   IndexedDB unavailable, blocked, or quota exceeded.
-   Invalid or incompatible backup file.
-   Duplicate IDs or records during import.
-   Empty or malformed scramble output.
-   User changes puzzle while timer is running.
-   Browser tab sleeps or becomes backgrounded.
-   Repeated Space key events.
-   Accidental page scroll from Space.
-   DNF or +2 changes after statistics were calculated.
-   Insufficient solves for averages.
-   Very long sessions and large solve histories.
-   Device rotation and narrow viewports.
-   User refreshes during an active solve.
-   User navigates away while a solve is running.

Required behavior: - Never silently discard a completed solve. - If an
active solve is lost on refresh/navigation, explain the limitation; do
not fabricate a result. - Disable puzzle switching while timing, or
prompt the user to stop/cancel first. - Show actionable error messages
without exposing technical stack traces to ordinary users. - Test
persistence after refresh and backup import/export.

------------------------------------------------------------------------

## 10. Security and Privacy

-   No account credentials or remote user database in MVP.
-   No solve history sent to a server.
-   Do not add third-party analytics or tracking by default.
-   Import files are untrusted input: validate schema, types, limits,
    and version before writing.
-   Avoid rendering imported notes as raw HTML.
-   Vercel deployment must not include secrets because the MVP does not
    require secret environment variables.
-   Clearly state that local-only data is not shared or synced across
    devices.

------------------------------------------------------------------------

## 11. Testing and Acceptance Criteria

The MVP is acceptable only when all critical criteria below pass.

### Timer

-   [ ] Space starts and stops timing on supported desktop browsers.
-   [ ] Space does not scroll the page during timer operation.
-   [ ] Typing in inputs does not trigger timer shortcuts.
-   [ ] Touch controls work on mobile-sized viewports.
-   [ ] Duration is based on `performance.now()` and does not drift by
    counting frames.
-   [ ] Key-repeat does not create duplicate starts/stops.
-   [ ] Puzzle switching is blocked or safely handled while running.

### Scrambles

-   [ ] Every listed puzzle has a verified, puzzle-specific generator.
-   [ ] Each puzzle's scramble is displayed and can be copied.
-   [ ] A solve stores the exact scramble used.
-   [ ] Scramble does not change during an active solve.
-   [ ] Generator failures are visible and recoverable.
-   [ ] Library support and validity limitations are documented.

### Persistence and data portability

-   [ ] A completed solve remains after refresh and browser restart.
-   [ ] Sessions and settings remain after refresh.
-   [ ] JSON backup export and validated import work.
-   [ ] CSV export opens as a useful spreadsheet.
-   [ ] Import conflicts are handled predictably.
-   [ ] Delete-all-data requires explicit confirmation.
-   [ ] UI explains local-only storage and lack of automatic sync.

### Statistics

-   [ ] Best single, mean, Ao5, Ao12, and trend chart are correct.
-   [ ] DNF and +2 behavior is covered by automated tests.
-   [ ] Statistics do not mix puzzle types.
-   [ ] Insufficient data is shown clearly.

### UX and deployment

-   [ ] Responsive layout works at phone, tablet, and desktop sizes.
-   [ ] Dark/light/system theme works.
-   [ ] Keyboard navigation and visible focus work.
-   [ ] Production build passes.
-   [ ] Automated unit and E2E tests pass.
-   [ ] The project deploys successfully to Vercel from GitHub.
-   [ ] README explains local development, tests, deployment,
    browser-local storage, and backups.

### Suggested test commands

The agent should provide scripts with names equivalent to:

``` bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

If a command is not configured, the agent must configure it or explain
why it is not applicable. Do not claim a test passed unless it was
actually run and its result observed.

------------------------------------------------------------------------

## 12. Deployment to Vercel

1.  Keep the source in a GitHub repository.
2.  Configure the project using the standard Next.js Vercel integration.
3.  Ensure the production build succeeds locally before deployment.
4.  Import the repository into Vercel and deploy.
5.  Test the production URL on desktop and mobile.
6.  Verify solve persistence after refresh on the same browser/origin.
7.  Verify that another browser/device starts with separate local data,
    as expected.
8.  Test JSON backup export and import on the production URL.
9.  Document how to redeploy and how to export a backup before clearing
    browser data.

No database provisioning or environment secrets are required for the
MVP. Vercel deployment hosts the app, while each browser stores its own
data.

------------------------------------------------------------------------

## 13. Suggested Project Structure

``` text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    timer/
    scramble/
    puzzle-selector/
    session/
    solve-history/
    statistics/
    settings/
    backup/
    ui/
  lib/
    timer/
      timer-engine.ts
    scrambles/
      scramble-adapter.ts
      supported-puzzles.ts
    statistics/
      calculations.ts
      penalties.ts
    storage/
      db.ts
      repositories.ts
      migrations.ts
    backup/
      json-backup.ts
      csv-export.ts
    validation/
      backup-schema.ts
  types/
    puzzle.ts
    solve.ts
    session.ts
tests/
  unit/
  e2e/
public/
```

The agent may adjust this structure if there is a clear reason, but it
must preserve separation between UI, timing, scramble generation,
statistics, and storage.

------------------------------------------------------------------------

## 14. Implementation Plan and Ready-to-Use Prompts

Use one coding agent under human control. Do not run all phases in one
instruction.

### Phase 1 --- Validate and plan

**Prompt:** \> Read the PRD completely. Do not implement the whole app.
First validate the proposed stack, especially scramble-library support
for 2x2, 3x3, 4x4, 5x5, 6x6, 7x7, Megaminx, Square-1, Pyraminx, and
Skewb. Produce a concise implementation plan, identify any unsupported
puzzle or technical risk, propose the component/data architecture, and
list the acceptance tests. Stop and wait for approval.

### Phase 2 --- Prototype

**Prompt:** \> Based on the approved PRD and plan, build only a visual
prototype with realistic sample data. Prioritize the timer layout,
puzzle selector, scramble panel, session/history layout, statistics
cards, and responsive dark/light themes. Do not claim timer, scramble
generation, or persistence is functional unless it is implemented and
tested. Stop for review.

### Phase 3 --- Frontend

**Prompt:** \> Implement the approved UI in Next.js, TypeScript, and
Tailwind CSS. Use accessible components and responsive layouts. Keep
timer, scramble, statistics, and storage logic behind clear interfaces.
Do not proceed into unapproved features. Run lint and type checks,
summarize results, and stop for review.

### Phase 4 --- Timer and scramble engine

**Prompt:** \> Implement the timer engine using performance.now(),
keyboard/touch controls, penalties, and the verified puzzle-specific
scramble adapter. Test every requested puzzle. Do not fake unsupported
scrambles. Run relevant tests, document library limitations, and stop
for review.

### Phase 5 --- Local persistence and portability

**Prompt:** \> Implement IndexedDB persistence for solves, sessions, and
settings, plus versioned JSON backup import/export and CSV export.
Validate imported files and add migration/error handling. Verify
persistence after refresh and test conflict handling. Do not add a
remote database or authentication. Stop for review.

### Phase 6 --- Statistics and integration

**Prompt:** \> Implement and test best single, mean, Ao5, Ao12,
penalties, and trend chart. Ensure statistics are scoped to one
puzzle/session and use documented DNF rules. Integrate all approved
features, run tests, and stop for review.

### Phase 7 --- Verification and bug fixing

**Prompt:** \> Act as an independent verifier. Run lint, typecheck, unit
tests, E2E tests, and production build. Test keyboard and touch flows,
every puzzle scramble, DNF/+2, refresh persistence, backup
import/export, responsive UI, and accessibility basics. Fix reproducible
bugs within scope, rerun failed checks, and report evidence. Do not
deploy until I approve.

### Phase 8 --- Deploy

**Prompt:** \> After explicit approval, prepare the GitHub repository
and deploy the app to Vercel. Verify the production build and smoke-test
the live URL, local persistence, scrambles, and backup features. Write a
README covering setup, tests, deployment, local-only data behavior, and
backup recommendations. Report the deployment URL only after it has
actually been created and verified.

------------------------------------------------------------------------

## 15. Human Review Scorecard ("Buku Nilai AI")

Score each category from 1 to 5.

  Category                                Score (1--5) Satisfied?   Bug/notes
  ------------------------------------- -------------- ------------ -----------
  Visual design and clarity                                         
  Mobile/responsive behavior                                        
  Timer accuracy and controls                                       
  Scramble correctness by puzzle                                    
  Solve history and sessions                                        
  Local persistence                                                 
  Statistics and penalties                                          
  Backup import/export                                              
  Accessibility and keyboard behavior                               
  Tests and deployment readiness                                    

### Review record

For each phase, record: - Phase and date. - Agent summary. -
Commands/tests and observed results. - Score for each applicable
category. - Satisfied / Not satisfied. - Bug notes and requested
revisions. - Prompt used. - Human decision: **Approve / Revise /
Reject**.

A phase is not approved merely because the agent says it is finished.
Review the working app and test results before authorizing the next
phase.

------------------------------------------------------------------------

## 16. Future Enhancements (Not MVP)

Consider only after the MVP is stable: - Optional cloud sync and user
accounts. - Cross-device session synchronization. - More advanced
session comparisons. - Custom puzzle colors or visual scramble
previews. - Import from other timer applications. - PWA
installation/offline shell. - WCA competition-oriented inspection
options and stricter regulation-aligned statistics. - Sharing a session
via an explicitly exported file.

Any cloud sync feature would require a separate privacy, authentication,
database, and deployment design. It must not be silently added to this
local-first MVP.

------------------------------------------------------------------------

## 17. Definition of Done

The MVP is done when: 1. Every requested puzzle has a verified scramble
implementation or a clearly approved documented limitation. 2. Timer
works on desktop and mobile, including penalties and manual entries. 3.
Solve history, sessions, and settings persist locally. 4. JSON backup
import/export and CSV export work. 5. Statistics are correct and covered
by automated tests. 6. Responsive and accessibility checks pass at a
practical baseline. 7. Lint, typecheck, unit tests, E2E tests, and
production build pass, with results reported honestly. 8. Vercel
deployment is live and smoke-tested. 9. README and backup/privacy
guidance are complete. 10. The user has reviewed and approved the final
result.
