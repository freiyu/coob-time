# CubeTime — PRD Excerpt for Testing (TestSprite)

> Excerpt of the CubeTime PRD (PRD_CUBETIME.md) containing what an automated tester needs: technical rules, puzzle and scramble
> requirements, functional requirements, visual states, accessibility, data model, edge cases, and acceptance criteria.
> The full PRD is PRD_CUBETIME.md. Regenerate this excerpt if those sections change.
> CubeTime is a client-side app with no accounts and no backend: test the frontend only, with no login.

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

