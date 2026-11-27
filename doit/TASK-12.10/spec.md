# Spec: TASK-12.10 — Harden the settings upgrade and back-control focus order

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-12.10 · Parent/epic: TASK-12 · Requirements: n/a (follow-up from doc-141) · Dream: limit-holdem-trainer

## 1. Summary
Three follow-ups from the TASK-12.1 review and judge (doc-141). (1) The v3 upgrade unit test asserts the raw
`settings` record, not just `readSettings()` (which returns defaults even when no record exists). (2) A
blocked IndexedDB upgrade (another connection that does not close on `versionchange`) no longer leaves every
store call pending forever. (3) On Settings and Statistics, one Tab from the focused h1 reaches `← Home`,
because `← Home` moves after the h1 in the DOM while CSS keeps it visually first.

## 2. Scope
- In scope:
  - `tests/storage/settings-store.test.ts`: the v3 upgrade test reads the raw `settings` record.
  - `src/storage/hand-store.ts`: an `onblocked` handler in `opened()`; an exported `UpgradeBlockedError`;
    the store retries the open on the next call after a blocked open; a late success of a blocked open closes
    its connection.
  - A unit test file for the blocked and the `versionchange` paths.
  - `SettingsScreen.tsx` and `StatisticsScreen.tsx`: `← Home` after the h1 in the DOM; CSS `order: -1` keeps it
    visually first.
  - `e2e/settings.spec.ts` (locked): the Tab-order expectation follows the new DOM order (Q-2).
  - New e2e test for one-Tab reach on both screens; docs updates.
- Not doing:
  - No new user-visible text or banner for a blocked upgrade (Q-1).
  - No `DB_VERSION` change, no store or record change, no change to the `versionchange` close (it exists).
  - No change to other screens' headers (Game Config, Report, Table).
  - No change to `useHeadingFocus` or to which element gets focus on open.
  - The doc-141 NITs (dialog regex, `play-money.md` wrap, `.settings-section` comment, stale session-end test
    name) stay out.
- Scope budget: files=10, lines=230

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `← Home` moves after the h1 in the DOM of both headers; `.settings-header .link-button` and `.stats-header .link-button` get `order: -1`, so the layout is unchanged. Sequential focus order is then `← Home` → content, matching the visual order, because the h1 is `tabIndex=-1` and not a tab stop. | yes | doc-141 follow-up suggests "Put `← Home` after the h1". Headers are already flex rows (`src/ui/styles.css:1236-1241`, `:1326-1331`). | Keydown handler on the h1 that moves focus; focus `← Home` instead of the h1 on open (breaks the A-3 convention of TASK-12.1). |
| A-2 | In Statistics the DOM order becomes h1, `← Home`, totals `<p>`. | yes | Keeps the button directly after the h1. | Button after the totals (still one Tab: `<p>` is not focusable). |
| A-3 | `UpgradeBlockedError` message is `The database upgrade is blocked by another open connection`; `name` is `'UpgradeBlockedError'`. It reaches only `console.error` through the existing failure handlers, not the screen. | yes | Matches the store's `Error` style; not user-visible. | DOMException. |
| A-4 | Only a blocked open resets the cached open promise (retry on the next call). Other open errors keep today's "every call rejects with that error" rule (`src/storage/hand-store.ts:207`). | yes | A blocked open is transient; other errors (e.g. `VersionError`) are not. | Retry on every error. |
| A-5 | The upgrade test now opens through `store.count()` before reading the raw record, so the record cannot come from `readSettings()`. The current `DB_VERSION` is 5, so "upgraded to v4" means "upgraded through the v4 step to the current version". | yes | `src/storage/hand-store.ts:30,56-57`. | Open a v4-only DB by hand (would not test the app's upgrade). |

## 3. Current system
- Storage: `src/storage/hand-store.ts`. `opened()` (`:42-69`) opens `tlh-trainer` at `DB_VERSION = 5` (`:30`);
  the v4 step creates `settings` and puts `{ ...DEFAULT_SETTINGS }` under `SETTINGS_KEY` (`:56-57`).
  `onsuccess` already sets `db.onversionchange = () => db.close()` (`:64`, since TASK-3.9). There is no
  `request.onblocked`, so if another connection does not close, the promise never settles.
  `openHandStore` caches the open promise (`:212-213`: `db ??= opened(factory, name)`), so every later call
  awaits the same pending promise. `readSettings()` returns `DEFAULT_SETTINGS` for a missing record (`:281-284`).
- Callers already handle store rejections: settings fall back to defaults (`src/ui/App.tsx:102-106`), the paused
  session becomes none (`:126-130`), Statistics shows its read-failure state (`:153-156`). So rejecting instead
  of hanging needs no new UI.
- Tests: Vitest with `fake-indexeddb` (`tests/storage/settings-store.test.ts:1`). fake-indexeddb fires
  `blocked` when another connection is neither closed nor close-pending
  (`node_modules/fake-indexeddb/build/esm/FDBFactory.js:132-146`), so both paths are testable. The v3 upgrade
  test (`tests/storage/settings-store.test.ts:87-140`) checks defaults only via `readSettings()` (`:116`).
- UI: `SettingsScreen.tsx:34-39` and `StatisticsScreen.tsx:160-166` render `← Home` before the h1. The h1 is
  focused on open by `useHeadingFocus` (`src/ui/useHeadingFocus.ts`) with `tabIndex = -1`. In Chromium the
  next Tab goes to the first focusable after the h1 (the checkbox on Settings, the filters or page exit on
  Statistics), not `← Home`.
- Locked tests touched: `e2e/settings.spec.ts:78-83` asserts the current order (`[...expected.slice(1),
  expected[0]]`) and the `tabOrder` doc comment (`:26-27`) describes the wrap. Order-insensitive locked tests
  that keep passing: `tests/ui/settings.acceptance.test.tsx:28-29`, `tests/ui/statistics.acceptance.test.tsx:73-74`
  (`toContain` only).
- WebKit tabs to buttons only with `Alt+Tab` (TASK-12.1 A-8; `e2e/settings.spec.ts:78-79`).
- Existing code to reuse:
  - `tests/storage/settings-store.test.ts` → `withDb`, `request`, `DEFAULTS` helpers (copy the small helpers
    into the new test file or import nothing; they are not exported).
  - `e2e/settings.spec.ts` → `openSettings` pattern (goto `/`, wait for menu not `data-paused="loading"`,
    click, expect h1 focused).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Blocked upgrade: `request.onblocked` rejects the open with `UpgradeBlockedError`; the next store call retries the open; a late `onsuccess` of the rejected request closes the connection. No new screen text. | B: show a banner while blocked and keep waiting. | AC#2 accepts either branch; the close-on-`versionchange` branch already exists for every app build since TASK-3.9; rejection reuses the existing failure handling with ~20 lines. | yes | user (Q-1, autopilot) |
| D-2 | Tab order fixed by DOM move + CSS `order: -1` (A-1). | Key handler; focus `← Home` on open. | Smallest change; no visual change. | no | n/a |
| D-3 | Edit locked `e2e/settings.spec.ts` order expectation to the DOM order. | Leave it (it would fail). | Direct consequence of AC#3. | yes | user (Q-2, autopilot) |

## 5. Design

### Files to create / modify
- `src/storage/hand-store.ts` — `UpgradeBlockedError`; `onblocked` in `opened()`; retry after a blocked open.
- `tests/storage/settings-store.test.ts` — raw `settings` record asserted in the v3 upgrade test.
- `tests/storage/upgrade-blocked.test.ts` — new: blocked and `versionchange` paths.
- `src/ui/settings/SettingsScreen.tsx` — `← Home` after the h1.
- `src/ui/stats/StatisticsScreen.tsx` — `← Home` after the h1, before the totals.
- `src/ui/styles.css` — `order: -1` for the two header back buttons.
- `e2e/settings.spec.ts` — (locked, Q-2) Tab-order expectation and comments.
- `e2e/back-focus.spec.ts` — new acceptance: one Tab from the h1 reaches `← Home` on both screens.
- `docs/storage/hand-records.md` — blocked-upgrade behaviour next to the `versionchange` sentence (`:28`).
- `docs/ui/navigation.md` — one sentence: Tab from the Settings/Statistics heading reaches `← Home`.

### Components, interfaces and data
- `export class UpgradeBlockedError extends Error` — `name = 'UpgradeBlockedError'`, message per A-3.
- `opened(factory, name)` — unchanged signature. Adds:
  - `let rejected = false;`
  - `request.onblocked = () => { rejected = true; reject(new UpgradeBlockedError(...)); }`
  - `onsuccess`: if `rejected`, call `request.result.close()` and return; else today's behaviour.
- `openHandStore` — `database()` becomes: if no cached promise, create `opened(...)` and attach a rejection
  handler that sets the cache back to `null` when the error is an `UpgradeBlockedError` (A-4). The returned
  promise still rejects for the caller.
- No data format change.

### Rules and algorithms
- Example: tab A holds a connection at v4 with no `versionchange` handler. Tab B calls `store.count()` → open at
  v5 → `blocked` → `count()` rejects with `UpgradeBlockedError`. Tab A closes. Tab B calls `store.count()` again
  → new open → upgrade runs → resolves `0`.
- Example: tab A is the app (`openHandStore`, open at v5). Something opens v6 → A's `versionchange` closes A →
  no `blocked`; the v6 open succeeds.

### Error handling and configuration
- `UpgradeBlockedError` flows into existing handlers (`src/ui/App.tsx:102-106, 126-130, 153-156`), which log
  it and show their existing fallback states. No configuration.

## 6. Behaviour specification

### SPEC-01: v3 upgrade writes the raw default settings record
- Verifies: AC#1
- Behaviour: Given a fake-indexeddb database at version 3 with one hand, session and report, When
  `openHandStore(factory).count()` opens it and the raw `settings` store is read with `get(SETTINGS_KEY)` in a
  separate connection, Then the raw value `toEqual` `{ defaultSpeed: 'rapid', autoOpenReview: true,
  showOpponentStyles: true, fourColourDeck: false, botBanter: true }`, the version is 5, and the old records
  are unchanged.
- Verification: unit `tests/storage/settings-store.test.ts::upgrading a v3 database keeps its records and adds default settings`

### SPEC-02: A blocked upgrade rejects instead of hanging
- Verifies: AC#2
- Behaviour: Given a database at version 4 held open by a connection with no `versionchange` handler, When
  `openHandStore(factory).count()` is called, Then it rejects with an `UpgradeBlockedError` (name
  `'UpgradeBlockedError'`) within the test timeout, and the blocking connection's version is still 4.
- Verification: unit `tests/storage/upgrade-blocked.test.ts::a blocked upgrade rejects with UpgradeBlockedError`

### SPEC-03: The store retries after the blocker closes
- Verifies: AC#2
- Behaviour: Given SPEC-02 has happened, When the blocking connection closes and the same store's `count()` is
  called again, Then it resolves `0` and the database is at version 5 with the `settings` store present.
- Verification: unit `tests/storage/upgrade-blocked.test.ts::the next call after a blocked upgrade retries and upgrades`

### SPEC-04: The app's own connection closes on versionchange
- Verifies: AC#2
- Behaviour: Given a store from `openHandStore(factory)` that has opened (one `count()` resolved), When another
  connection opens the same database at `DB_VERSION + 1`, Then that open succeeds (no `blocked` event fires on
  it) and its `oldVersion` is 5.
- Verification: unit `tests/storage/upgrade-blocked.test.ts::an open app connection closes on versionchange so a newer version opens`

### SPEC-05: One Tab from the Settings heading reaches ← Home
- Verifies: AC#3
- Behaviour: Given Settings opened from Home with the `Settings` h1 focused, When the user presses Tab once
  (`Alt+Tab` in WebKit), Then the focused element is the `← Home` button and focus has not left the page.
- Verification: acceptance `e2e/back-focus.spec.ts::one Tab from the Settings heading reaches ← Home`

### SPEC-06: One Tab from the Statistics heading reaches ← Home
- Verifies: AC#3
- Behaviour: Given Statistics opened from Home on an empty profile, after the chart is no longer
  `aria-busy="true"`, with the `Statistics` h1 focused, When the user presses Tab once (`Alt+Tab` in WebKit),
  Then the focused element is the `← Home` button.
- Verification: acceptance `e2e/back-focus.spec.ts::one Tab from the Statistics heading reaches ← Home`

### SPEC-07: Settings tab walk follows DOM order with no page exit
- Verifies: AC#3
- Behaviour: Given the existing Settings keyboard test, When Tab is walked from the h1, Then the order equals
  the DOM order of controls `['← Home', 'Show opponent styles at the table']`, every control appears once, and
  the 44x44 and Enter/Space checks still pass.
- Verification: acceptance `e2e/settings.spec.ts::every Settings control is reachable by Tab, native, keyboard-operable and at least 44x44`

### SPEC-08: Layout unchanged
- Verifies: AC#3
- Behaviour: Given Settings and Statistics at 1280x800, When rendered, Then `← Home`'s bounding box is left of
  the h1's (`x` smaller) on the same row, as before the change.
- Verification: acceptance `e2e/back-focus.spec.ts::← Home stays visually before the heading`

## 7. Edge cases
- Blocked then never unblocked: every call rejects (SPEC-02); each retry also gets `blocked` and rejects. No hang.
- Late success of a rejected open: connection closed immediately (design; covered indirectly by SPEC-03, which
  succeeds only if no stray connection blocks the retry).
- Two calls in flight when blocked: both await the same cached promise and both reject (same mechanism).
- Statistics still loading: SPEC-06 waits for `aria-busy` to clear; DOM order is the same in all states.
- Concurrency between tabs on writes: N/A — unchanged.

## 8. Security considerations
- No new trust boundary, input, dependency or randomness. No sensitive data logged (error message is static).
- Availability: a foreign connection can no longer wedge the app indefinitely (SPEC-02).

## 9. Non-functional
- No performance targets apply. The new unit tests run in under 1 s each in the default `npm test`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then Home → Settings (Tab once → `← Home`), Home → Statistics (Tab once → `← Home`)
- New tests: `tests/storage/settings-store.test.ts` → SPEC-01; `tests/storage/upgrade-blocked.test.ts` →
  SPEC-02, SPEC-03, SPEC-04; `e2e/back-focus.spec.ts` → SPEC-05, SPEC-06, SPEC-08; `e2e/settings.spec.ts` →
  SPEC-07. E2E run: `npm run e2e -- e2e/back-focus.spec.ts e2e/settings.spec.ts e2e/statistics.spec.ts`.
- Judge scenario: `npm run dev`; open Settings, press Tab once, confirm `← Home` has focus and the layout looks
  as before; repeat on Statistics. AC#2 cannot be reproduced with two app tabs (both close on `versionchange`);
  the unit tests SPEC-02..04 are its evidence.

## 11. Open questions
None. Resolved (see qa.md):
- Q-1 → A: reject a blocked open with `UpgradeBlockedError`, retry on the next store call, no new UI text (D-1).
- Q-2 → yes: `e2e/settings.spec.ts` may be edited only to change `expect(order).toEqual([...expected.slice(1),
  expected[0]])` to `expect(order).toEqual(expected)` and the two wrap comments (`:26-27`, `:80-81`) (D-3).

## 12. Clarifications log
See `doit/TASK-12.10/qa.md`.
