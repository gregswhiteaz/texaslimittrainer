# Spec: TASK-11.6 — Open Statistics or go Home from the Session Report

Status: READY (approved 2026-11-25)
Task: TASK-11.6 · Parent/epic: TASK-11 · Requirements: REQ-044 (044.6) · Dream: limit-holdem-trainer

## 1. Summary
The Session Report gets a second control, "View statistics". It sits in one row at the bottom of the report with
the existing "Back to Home" (TASK-10.1 Q-3). View statistics opens the Statistics screen the same way Home's
Statistics entry does: All / All / Every 500 hands, read fresh from the store, so its totals include the session
that just ended. Back to Home keeps its behaviour: Home opens with no Resume session for the ended session.
Leaving the report writes nothing, because the report was saved before it was shown.

## 2. Scope
- In scope:
  - `src/ui/report/ReportScreen.tsx`: a new optional `onStatistics` prop. The controls move into a
    `<div class="report-actions">` row at the end of `<main>`: View statistics first, then Back to Home.
  - `src/ui/App.tsx`: one `openStatistics()` handler, used by Home's Statistics entry and by the report's View
    statistics. No new screen, and no change to the `type Screen` union.
  - `src/ui/styles.css`: the `.report-actions` row, styled like `.config-actions`.
  - `docs/ui/navigation.md`: the Session report and Statistics rows of the screen table.
  - Tests: a new Vitest acceptance file for the markup and a new Playwright spec through the real App.
- Not doing:
  - No browser-history entry for the report or Statistics. Browser Back behaves as today (TASK-2.14 D-2).
  - No "← Report" or other way back from Statistics to the report. Statistics' `← Home` goes to Home as today.
  - No reopening of stored reports from Home (E02-S16, M3). This task only keeps `ReportScreen` ready for it:
    both handlers are props.
  - No change to what the report shows or stores, and no change to the Statistics screen.
  - No edit to any locked test (D-3, Q-1).
- Scope budget: files=6, lines=230

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | View statistics opens Statistics through the same state reset as Home's entry (`view: undefined`, `ALL_TRENDS`, `DEFAULT_GROUPING`). The existing stats effect then reads `trendData()` after `tableWritesSettled()`. | yes | This is how Statistics opens today (`src/ui/App.tsx:269-277`, `:99-126`). It resets filters and grouping on every opening (TASK-11.4 D-5, TASK-11.5). The session's hands were written before `endSession` resolved (`src/ui/App.tsx:132-147`), so the fresh read includes them. | Pass the report's session into Statistics (not needed) |
| A-2 | Statistics' `← Home` from a report-opened Statistics goes to Home with its heading focused. No Resume shows, because the session has `endedAt`. | yes | This is the existing handler (`src/ui/App.tsx:322`). Home re-reads the paused session on every visit (`src/ui/App.tsx:76-97`). | A Back-to-report control (out of scope) |
| A-3 | Focus on opening the report is unchanged: the `Session report` heading gets focus (`useHeadingFocus(true)`, `src/ui/report/ReportScreen.tsx:81`). Tab order after the content is View statistics, then Back to Home (DOM order). | yes | Matches the storyboard's order and the existing focus rule. | Focus Back to Home on open |

## 3. Current system
- `src/ui/report/ReportScreen.tsx:74-126`: `ReportScreen({ report, onHome? })`. It renders the header, KPI tiles,
  rate tiles, style and leaks sections, then one `<button type="button" className="report-home">Back to Home</button>`
  as the last child of `<main className="screen report-screen">` (`:121-123`).
- `src/ui/App.tsx:311-317`: the `report` case passes `onHome={() => setScreen({ name: 'home', returned: true })}`.
  `src/ui/App.tsx:269-277` is Home's `onStatistics`: `setPaused(undefined)` and then
  `setScreen({ name: 'stats', view: undefined, filter: ALL_TRENDS, grouping: DEFAULT_GROUPING })`.
  `src/ui/App.tsx:99-126` loads the trend data whenever `screen.name` becomes `stats`.
- `src/ui/App.tsx:27-43`: `type Screen` already has `report` and `stats`, and is not touched. Per the caller's
  instruction: no `;` in comments inside that union.
- `src/ui/stats/StatisticsScreen.tsx:154-164`: the heading is focused on mount, `← Home` is a `link-button`, and the
  `.stats-totals` text is `totalsLine(hands, sessions)` (`src/stats/trends.ts:419-421`, e.g. `51 hands over 2 sessions`).
- `src/ui/styles.css:233-242`: `.screen .report-home` is the red primary button with `align-self: flex-start`.
  `src/ui/styles.css:425-439`: `.config-actions` (a right-aligned flex row, gap 12px) and `.button-outline` (the
  outlined secondary button: `#4a515c` border, 15px).
- Storyboard `dreams/limit-holdem-trainer/storyboards/Report.dc.html` (last `div` before `</x-dc>`): a right-aligned
  row (`justify-content: flex-end; gap: 12px`) with "View statistics" (outlined, links to Stats) and then
  "Back to Home" (red primary, links to Home).
- Tests: Vitest runs in the `node` environment (`vite.config.ts:8`) with `renderToString`. It has no DOM, so
  clicks through the real App run in Playwright (Chromium and WebKit projects, `playwright.config.ts:13-15`).
  `npm test` runs Vitest with coverage, and `npm run e2e` runs Playwright.
- Locked tests that pin the report's buttons, focus or navigation (owners from `doit/TASK-*/state.json`
  `locked_tests`):
  - `tests/ui/report-screen.acceptance.test.tsx` (owner TASK-10.1):
    - `:50-52`: the exact button list is `['<button type="button" class="report-home">Back to Home</button>']`.
    - `:53`: the first `<button` comes after `</dl>`.
    - `:81`: the sit-and-go render has exactly 1 button.
  - `tests/ui/report-errors.acceptance.test.tsx:165` (owner TASK-10.4): `<button` count is 1.
  - `tests/ui/report-leaks.acceptance.test.tsx:115-116` (owner TASK-10.5): `<button` count is 1, and it comes after
    the leaks section.
  - `tests/ui/report-style.acceptance.test.tsx:112-132` (owner TASK-10.3): "sits before the only button". The
    `<button` count is 1 (`:116`, `:119`), and it comes after the section (`:121`, `:132`).
  - `e2e/session-report.spec.ts` (owner TASK-10.1):
    - `:92`, `:206`: the report heading is focused.
    - `:134-146`: Back to Home opens Home with no Resume and the stores unchanged. This already proves AC#3.
  - `e2e/session-end-retry.spec.ts:85` and `e2e/session-end-order.spec.ts:110` (not locked): they click Back to Home
    by role and name.
  - `e2e/play-money.spec.ts:159-160` (owners TASK-10.2 and TASK-11.1): the walk ends on the report and checks its
    texts for money words. "View statistics" has none.
  - `tests/ui/screen-list.acceptance.test.ts` (owner TASK-11.1): routes stay
    `['config','ending','home','report','stats','table']`, because no route is added.
  - Each of these renders `ReportScreen` with only `onHome`. All of them pass unchanged under D-3, because View
    statistics renders only when `onStatistics` is given. Under Q-1 option (b), the five assertions above that
    count 1 button, or list only Back to Home, must change. They belong to four owners: TASK-10.1, TASK-10.3,
    TASK-10.4 and TASK-10.5.
- Existing code to reuse:
  - `src/ui/App.tsx:269-277` → hoist into one `openStatistics()` used by both Home and the report. This avoids a
    second copy of the reset.
  - `src/ui/styles.css:432` `.button-outline` → the View statistics style (no new button style).
  - `src/ui/styles.css:425` `.config-actions` → the pattern for `.report-actions`.
  - `e2e/support/hand-records.ts` (`playToResult`, `handOver`, `header`, `seedStoredSessions`, `seedStoredRecords`,
    `storedReports`, `storedSessions`), `e2e/support/paused-clock.ts` (`runUntil`, `axeWithPausedClock`),
    `e2e/support/table-harness-bundle.ts` (`stubReplayWords`) and `tests/support/stat-records.ts` (`statRecords`,
    `mixedGrades`) → the new e2e setup, following `e2e/session-report.spec.ts:41-64`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Label `View statistics`. Order: View statistics first, then Back to Home. Both sit in one right-aligned row at the bottom. View statistics uses `.button-outline` (secondary), and Back to Home keeps the red `.report-home` (primary). | Left-aligned row. Back to Home first. Two primary buttons. | The task text, AC#1 and the storyboard give this label, order and placement. | yes | user (Q-2) |
| D-2 | A single `openStatistics()` in App serves both Home and the report: `setPaused(undefined)`, then the default stats state. | Inline a second copy in the report case | One reset rule for every way into Statistics (TASK-11.4 D-5). | no | n/a |
| D-3 | `ReportScreen` gets `onStatistics?: () => void`. View statistics renders only when it is given, and App always gives it. No locked test is edited. | (b) Always render it and edit five assertions in four locked files: `report-screen:50-52,81`, `report-errors:165`, `report-leaks:115`, `report-style:116,119`. Each owner then needs a `doit.py unlock … --reason "TASK-11.6 Q-1"`. | (a) keeps every locked test valid and unedited, following the same practice as TASK-11.4 A-2 and TASK-11.2 A-4. It matches the existing optional `onHome`. (b) states the screen contract more directly, but it touches four other stories' locks. | yes | user (Q-1) |
| D-4 | No history entry: View statistics uses `setScreen` only. | Push a history entry so browser Back returns to the report | Only the Table adds history entries (`src/ui/App.tsx:24-26`, TASK-2.14 D-2). | no | n/a |

## 5. Design

### Files to create / modify
- `src/ui/report/ReportScreen.tsx` — the `onStatistics?` prop and the `.report-actions` row with both buttons.
- `src/ui/App.tsx` — `openStatistics()`, used by Home's `onStatistics` and the report's `onStatistics`.
- `src/ui/styles.css` — the `.report-actions` row.
- `docs/ui/navigation.md` — the screen table rows for Session report and Statistics, and one sentence on View
  statistics.
- `tests/ui/report-navigation.acceptance.test.tsx` — new: the report's controls markup (SPEC-01, SPEC-02).
- `e2e/report-navigation.spec.ts` — new: navigation through the real App (SPEC-03, SPEC-04, SPEC-05).

### Components, interfaces and data
- `ReportScreen(props: { readonly report: SessionReport; readonly onHome?: () => void; readonly onStatistics?: () => void })`.
- The markup at the end of `<main>`, after every section:
  ```html
  <div class="report-actions"><button type="button" class="button-outline">View statistics</button><button type="button" class="report-home">Back to Home</button></div>
  ```
  Without `onStatistics`, the `div` holds only the Back to Home button, whose markup is byte-for-byte as today.
- App, `report` case:
  `<ReportScreen report={screen.report} onHome={() => setScreen({ name: 'home', returned: true })} onStatistics={openStatistics} />`.
- App:
  ```ts
  const openStatistics = (): void => {
    setPaused(undefined);
    setScreen({ name: 'stats', view: undefined, filter: ALL_TRENDS, grouping: DEFAULT_GROUPING });
  };
  ```
  Home's `onStatistics={openStatistics}`.
- No data or storage change.

### Rules and algorithms
- View statistics → the `stats` screen with the default state. The existing effect reads `trendData()` after
  `tableWritesSettled()`, so the totals line counts every stored hand and session, including the one just ended.
  Example: 1 stored ended session of 50 hands, plus a new session with 1 hand that then ends, gives
  `51 hands over 2 sessions`.
- Back to Home → `{ name: 'home', returned: true }` (unchanged). The Home heading is focused, and the paused-session
  read returns none, because the session has `endedAt`.
- Neither control writes to IndexedDB.

### Error handling and configuration
- If the Statistics read fails, the existing `LOAD_FAILED_MESSAGE` shows (TASK-11.1). Nothing new.
- CSS: `.report-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 12px; }` (Q-2). The
  `align-self: flex-start` on `.screen .report-home` is harmless in the row and may stay.

## 6. Behaviour specification

### SPEC-01: The report lists View statistics and Back to Home
- Verifies: AC#1, DoD#1
- Behaviour: Given a cash `SessionReport` with style and leak counts, and a sit-and-go report with `cash: null`,
  each rendered with `renderToString(<ReportScreen report={r} onHome={…} onStatistics={…} />)`, When the markup is
  read, Then:
  - `html.match(/<button[^>]*>.*?<\/button>/gs)` equals
    `['<button type="button" class="button-outline">View statistics</button>', '<button type="button" class="report-home">Back to Home</button>']`.
  - Both buttons are inside the single `<div class="report-actions">`.
  - That `div` starts after the last `</section>` (or the last `</dl>` when there is no section) and is the last
    child of `<main>`.
- Verification: acceptance `tests/ui/report-navigation.acceptance.test.tsx::AC#1 the report lists View statistics then Back to Home at the bottom`

### SPEC-02: Without a statistics handler only Back to Home renders
- Verifies: AC#1
- Behaviour: Given the same reports rendered with only `onHome` (the form the locked TASK-10.x tests use), When
  read, Then the only button is `<button type="button" class="report-home">Back to Home</button>`, and the markup
  contains no `View statistics`. (Q-1 chose option (a).)
- Verification: unit `tests/ui/report-navigation.acceptance.test.tsx::without onStatistics only Back to Home renders`

### SPEC-03: View statistics opens Statistics with the session just ended in its totals
- Verifies: AC#1, AC#2, DoD#1, DoD#7, DoD#8
- Behaviour: Setup:
  - Paused clock and `stubReplayWords` (as `e2e/session-report.spec.ts:41-45`).
  - Open `/`, wait for `data-paused` ≠ `loading`, then seed one ended session of 50 hands with
    `statRecords([{ sessionId: 'a'.repeat(32), startedAt: new Date(Date.UTC(2026, 10, 1)), hands: 50, ended: true }], mixedGrades)`
    through `seedStoredSessions` and `seedStoredRecords`, and reload.
  - New game → Start game, play hand 1 to its result, Leave table. The Session report heading is visible.

  When the report shows, Then:
  - The buttons in `.report-actions` have the texts `['View statistics', 'Back to Home']`.
  - Pressing Tab from the focused report heading, through the report's content, reaches View statistics and then
    Back to Home: the last two focusable elements, in that order.
  - `axeWithPausedClock` reports no serious or critical violations.

  When View statistics is clicked, Then:
  - The `Statistics` h1 is focused.
  - `.stats-totals` has the text `51 hands over 2 sessions`.
  - The Table size, Game type and Group by selects show All, All and Every 500 hands.
  - The JSON of the stored reports and sessions equals what it was before the click.
  - Every request goes to the app's own origin.

  When `← Home` is clicked, Then the `TLH Trainer` heading is focused, the menu has `data-paused="none"`, and there
  is no Resume session button.

  This runs in Chromium and WebKit.
- Verification: acceptance `e2e/report-navigation.spec.ts::View statistics opens Statistics with the session just ended in its totals`

### SPEC-04: Back to Home from the report opens Home without Resume
- Verifies: AC#3, DoD#1, DoD#7
- Behaviour: Given a fresh store, a game started, hand 1 played and Leave table chosen (the report shows both
  controls), When Back to Home is clicked, Then:
  - The `TLH Trainer` heading is focused.
  - The menu has `data-paused="none"`, and there is no Resume session button.
  - The stored reports and sessions are unchanged.
  - Clicking Statistics on Home shows `1 hand over 1 session`.
- Verification: acceptance `e2e/report-navigation.spec.ts::Back to Home from the report opens Home without Resume for that session`

### SPEC-05: Statistics resets its filters when opened from the report
- Verifies: AC#2
- Behaviour: Given the Statistics screen was opened from Home and its Table size filter changed to 6-max, then
  `← Home`, New game, hand 1 played and Leave table, When View statistics is clicked on the report, Then:
  - Table size shows All.
  - Game type shows All.
  - Group by shows Every 500 hands.
- Verification: acceptance `e2e/report-navigation.spec.ts::View statistics opens Statistics with default filters`

### SPEC-06: Checks, coverage, boundaries and existing tests
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: Given the finished change, When the project checks run, Then:
  - `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors.
  - Coverage holds: `src/{engine,bots,advice,stats,playtest,table}/**` ≥ 90% lines and overall ≥ 70%.
  - No engine, bots, advice or stats file changes.
  - Every locked test listed in §3 passes unedited (D-3).
  - `e2e/session-report.spec.ts`, `e2e/session-end-retry.spec.ts`, `e2e/session-end-order.spec.ts` and
    `e2e/play-money.spec.ts` pass.
  - CI is green on `doit/TASK-11.6`.
- Verification: command `npm run lint && npm run typecheck && npm test && npx playwright test e2e/report-navigation.spec.ts e2e/session-report.spec.ts e2e/session-end-retry.spec.ts e2e/session-end-order.spec.ts e2e/play-money.spec.ts`

### SPEC-07: Documentation
- Verifies: DoD#11
- Behaviour: Given the story is done, When the docs are read, Then:
  - `docs/ui/navigation.md` lists the Session report's ways out as `View statistics → Statistics; Back to Home → Home`.
  - Its Statistics row lists `View statistics on the Session report` as a way in.
  - A sentence says that opening Statistics from the report resets the filters like Home's entry, and that leaving
    the report writes nothing.
  - The story doc is published to Backlog.
- Verification: manual `docs/ui/navigation.md` screen table and the TASK-11.6 entry in `backlog doc list --plain`

### SPEC-08: Not-applicable DoD items
- Verifies: DoD#3, DoD#6, DoD#9, DoD#12
- Behaviour: These DoD items do not apply to this story:
  - There is no engine, bots or advice change, so the golden-spot suite (run by `npm test`) and the 10,000-hand
    playtest are unaffected.
  - There is no strategy content.
  - No service worker exists yet (E13-S07).
- Verification: command `npm test` (golden-spot suite included); `git diff --stat main -- src/engine src/bots src/advice src/stats` is empty

## 7. Edge cases
- Statistics' totals before the session ended: the session ends before the report shows (`src/ui/App.tsx:135-141`),
  and the stats effect also awaits `tableWritesSettled()`. SPEC-03 covers this.
- Filters changed in an earlier Statistics visit: they reset (SPEC-05).
- A double click on View statistics: the report unmounts on the first click, so there is no second handler call.
  N/A.
- A Statistics read failure: the existing TASK-11.1 failure message shows. No new behaviour.
- A 0-hand session: no report is shown (`src/ui/App.tsx:140`), so neither control is reachable. N/A.
- A sit-and-go report: same controls (SPEC-01).
- Browser Back on the report or Statistics: no history entry exists (D-4). Unchanged.

## 8. Security considerations
- No new input, storage, network or dependency. The controls only change in-memory screen state.
- No new request: SPEC-03 asserts that every request goes to the app's own origin.

## 9. Non-functional
- `npm test` speed: one new `renderToString` file of under 10 cases adds < 0.5 s.
- The e2e spec uses the paused clock and one played hand per test, like `e2e/session-report.spec.ts`. It has 3 tests
  per browser and is not added to any slow list.
- Accessibility: both buttons keep the 44px minimum (`.screen button`, `src/ui/styles.css:38-43`), and axe reports
  zero serious or critical violations (SPEC-03).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then New game → Start game → play a hand → Leave table → on the Session report press
  View statistics (totals include this session) → `← Home` (no Resume) → play another session → Leave table →
  Back to Home
- New tests:
  - `tests/ui/report-navigation.acceptance.test.tsx` → SPEC-01, SPEC-02.
  - `e2e/report-navigation.spec.ts` → SPEC-03, SPEC-04, SPEC-05.
- Judge's end-to-end scenario: the Run command, in Chromium and WebKit, checking the button order and the Tab
  order, that the totals rise by the ended session's hands and by 1 session, and that Home shows no Resume.

## 11. Open questions
None. Q-1 → (a) optional `onStatistics` prop (D-3). Q-2 → storyboard label, order and right-aligned row (D-1).

## 12. Clarifications log
See `doit/TASK-11.6/qa.md`.
