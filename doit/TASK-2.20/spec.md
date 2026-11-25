# Spec: TASK-2.20 — Prove the pause write-race guard and harden Table history entries

Status: READY (approved 2026-11-25)
Task: TASK-2.20 · Parent/epic: TASK-2 · Requirements: REQ-004.9 (via TASK-2.14) · Dream: limit-holdem-trainer

## 1. Summary
TASK-2.14 made Home wait for running table writes (`tableWritesSettled()`) before reading the paused session,
but no test proves it: removing the wait leaves every test green (doc-108 MINOR). This task adds e2e tests that
hold the session's start-record write open from an init script, so Home (and browser Back) must wait for it.
It also makes the Table's history key random (not `performance.timeOrigin`, which Playwright's clock fakes), so
every TASK-2.14 Back/Forward case runs under the paused clock and the J-1-01 "Back after reload + Resume stays
on the Table" quirk cannot recur, and it steps off a stale Table entry reached by Forward, so one Back on Home
leaves the app.

## 2. Scope
- In scope:
  - A test-only init script that holds the first armed `sessions`-only readwrite transaction open until the
    test releases it.
  - Acceptance tests for AC#1 (Home control and browser Back), AC#3, AC#4, and the key-format check.
  - `src/ui/App.tsx`: the Table history key comes from `crypto.getRandomValues`, and a popstate onto this
    load's own Table entry while no Table is shown steps back off it.
  - `e2e/history.spec.ts` case (5) runs under the paused clock (locked test, edit required by AC#2; see D-4).
  - `docs/ui/navigation.md` Back/Forward section updated to match.
- Not doing:
  - No change to `tableWritesSettled`, `track`, `useTableSession.ts` or `src/storage/hand-store.ts`; the guard
    is proven, not redesigned.
  - No step-off for Table entries from an earlier load of the page (after a reload). Stepping back from them
    crosses into the previous document and reloads the page (see D-3); Back from them keeps today's behaviour.
  - No change to `AppRoot.tsx`'s Return Home (TASK-13.1), and no new test for Forward after the error screen.
  - No change to user-visible text, screens, focus, or the stored data.
  - No change to `tests/ui/*` (jsdom) tests; no new slow/opt-in suite.
- Scope budget: files=5, lines=320

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The key is 16 CSPRNG bytes as 32 lowercase hex characters, written as a small local helper in `App.tsx` (same body as `newSessionId`, `src/ui/table/useTableSession.ts:76`). | yes | The AC names `crypto.getRandomValues like newSessionId`; uniqueness, not secrecy, is what matters. Keeping it local avoids exporting a session-id function under a different meaning. | Export and reuse `newSessionId`; `crypto.randomUUID()` (equivalent; the AC names getRandomValues). |
| A-2 | The race is reproduced by holding the **start-record** put (`putSession`, the only readwrite transaction whose scope is exactly `['sessions']`) of a new game, then completing hand 1 and choosing Home/Back. | yes | Holding the hand write's own transaction cannot fail without the guard: IndexedDB runs a later readonly `sessions` transaction only after an earlier overlapping readwrite one commits (see §3, "Why the start record"). The hand write is chained after the start record (`useTableSession.ts:258`), so holding the start record keeps the hand write unissued, which is the real race. | Delay the advice worker's grading reply (does not hold a sessions write, so does not match AC#1's wording). |
| A-3 | The hold keeps the transaction alive with a chain of `count()` requests on its `sessions` store until released, so the data is truly uncommitted while held. | yes | Holds the real write open (AC#1 "held open"), touches no app code, and needs no timers, so the paused clock cannot interfere. | Defer `IDBTransaction.oncomplete` handlers (data already committed; weaker reproduction). |
| A-4 | The new tests live in a new file `e2e/pause-history.spec.ts` that runs on every push (no `TLH_SLOW_TESTS` gate). | yes | Each case plays at most one hand under the paused clock (seconds); the normal suite stays fast. | Add them to locked `e2e/history.spec.ts` / `e2e/home-control.spec.ts` (needs more locked-test edits). |
| A-5 | "This load's own Table entry" is tracked by a module-level `lastTableKey` (the key of the most recent `pushState`), next to today's module-level counter, so it survives the `App` remount done by AppRoot's Return Home. | yes | Within one page load at most one entry this load pushed can exist (every push is made from the app entry or a foreign entry and drops forward entries), so the last pushed key identifies it. | A `useRef` (lost on the error-screen remount); a `Set` of every pushed key (unneeded). |

## 3. Current system
- `src/ui/App.tsx:60-66` — `newTableKey()` is `${performance.timeOrigin}:${++tableEntries}`; `entryKey(state)`
  reads `state.tlhTable`.
- `src/ui/App.tsx:103-123` — Home's effect: `tableWritesSettled().then(() => sharedHandStore().pausedSession())`,
  sets `paused` (`undefined` → menu `data-paused="loading"`).
- `src/ui/App.tsx:180-185` — popstate: ignored while no Table is shown (`tableKey.current === null`) or when the
  state's key equals the shown Table's; otherwise pauses to Home. This is why Forward onto the old Table entry
  leaves Home on that stale entry, so the next Back lands on the app's entry and shows nothing (doc-108 NIT
  `forward-then-back-stays-on-home`).
- `src/ui/App.tsx:187-198` — `openTable` pushes `{ tlhTable: key }`; `closeTable` calls `history.back()` only
  when the current entry is the shown Table's.
- `src/ui/AppRoot.tsx:62-77` — TASK-13.1 Return Home steps back off any `tlhTable` entry, then remounts `App`
  (new `key`), so App refs reset there.
- `src/ui/table/useTableSession.ts:98-109` — `track()` / `tableWritesSettled()`: one promise chain of the
  start-record put and every hand write.
- `src/ui/table/useTableSession.ts:186-194` — new sessions put the start record on mount and `track` it.
- `src/ui/table/useTableSession.ts:249-264` — the hand write waits for grading, then for `started.current`, then
  calls `store.add(record, session)`; it is tracked at hand completion.
- `src/storage/hand-store.ts:221-226` — `putSession` is a `readwrite` transaction on `SESSIONS_STORE` only,
  resolved on `oncomplete` (`completed`, `:79-87`); `add` (`:210-220`) uses `[hands, sessions]`;
  `pausedSession` (`:231`) is a readonly `sessions` transaction created after `await database()`.
- Why the start record (A-2): IndexedDB orders a readonly transaction after an earlier-created overlapping
  readwrite transaction, so holding the hand write's own `add` would delay an unguarded Home read until it
  commits and the count would still be right. Holding the start record keeps the `add` unissued
  (`useTableSession.ts:258`); an unguarded Home read is created before the `add`, runs first after release,
  and shows `0 hands` while the stored `handsPlayed` becomes 1.
- J-1-01 root cause: Playwright's `page.clock` fakes `performance.timeOrigin` (comment at
  `e2e/history.spec.ts:125-126`, doc-108 lesson), and the counter restarts each load, so the key pushed after a
  reload equals the earlier load's key (`<t>:1`). Back onto the earlier entry then matches the shown key and is
  ignored (`App.tsx:181`), so the Table stays. Under the real clock the keys differ (existing case (5) passes).
- `resumeSummary` (`src/table/table-view.ts:75-79`): 1 hand → `Cash · 6 players · $4/$8 · 1 hand · paused`.
- Tests: `npm test` (Vitest, jsdom), `npm run e2e` (Playwright, Chromium and WebKit projects,
  `playwright.config.ts:13-16`, against `npm run build && npm run preview` on port 4173).
- Existing code to reuse:
  - `e2e/history.spec.ts:22-60` → the `inContext` / `openHome` / `startGame` / `expectPausedHome` /
    `expectLeftApp` pattern (copy the small helpers; the file is locked and exports nothing).
  - `e2e/support/hand-records.ts` → `header`, `handOver`, `playToResult`, `storedSessions`.
  - `e2e/support/paused-clock.ts` → `runUntilMyTurn`, `runUntil`.
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords` (pinned deals).
  - `e2e/support/fault-injection.ts` → the init-script pattern (window-flag armed, test-only, nothing imported
    from `src/`).
  - `src/ui/table/useTableSession.ts:76-79` → `newSessionId`'s byte-to-hex body for A-1.

Locked tests touching pause/resume/history (from `doit/TASK-2.6`, `2.14`, `2.18`, `13.1`, `3.11` `state.json`):

| Locked test | Owner | Must change? |
|---|---|---|
| `e2e/history.spec.ts` | TASK-2.14 | **Yes** — case (5) drops `{ pausedClock: false }` and its timeOrigin comment (AC#2). Case (1) still passes: after Forward, Home stays. |
| `e2e/home-control.spec.ts`, `tests/ui/table-home.acceptance.test.tsx`, `tests/table/session-cap.acceptance.test.ts` | TASK-2.14 | No (no history-key or Forward assertions). |
| `e2e/resume.spec.ts`, `tests/ui/home-resume.acceptance.test.tsx`, `tests/storage/resume.acceptance.test.ts`, `tests/table/resume.acceptance.test.ts` | TASK-2.6 | No. |
| `e2e/home-first-load.spec.ts`, other TASK-2.18 tests | TASK-2.18 | No. |
| `e2e/error-recovery.spec.ts`, `tests/ui/error-screen.acceptance.test.tsx` | TASK-13.1 | No (Return Home still steps off a `tlhTable` entry; it does not read the key's format). |
| `e2e/rebuy.spec.ts` | TASK-3.11 | No. |

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Prove the guard with Playwright (real IndexedDB, paused clock), not fake-indexeddb. | Vitest + fake-indexeddb with a controlled transaction. | AC#1 names an init script and the user-visible Home; the race spans React effects, the advice worker and IndexedDB ordering, which only the browser reproduces faithfully. | no | n/a |
| D-2 | Table history key = 32 hex characters from `crypto.getRandomValues(new Uint8Array(16))`. | timeOrigin + counter (today); `crypto.randomUUID`. | AC#2. History state stays `{ tlhTable: <key> }` (same shape; AppRoot only tests `'tlhTable' in state`). | no | n/a (AC#2) |
| D-3 | On popstate, when no Table is shown and `entryKey(event.state) === lastTableKey` (this load's most recent Table entry), call `history.back()` once to step off it. Foreign keys (earlier loads) are not stepped off. | Step off every `tlhTable` entry; `replaceState(null)` on the stale entry. | `replaceState` leaves two same-looking entries, so Back would still be a no-op step. Stepping off foreign entries can cascade into the previous document (a full page reload) after a reload. One `back()` on our own entry always lands on the app entry it was pushed from, in the same document. | yes (browser history behaviour) | AC#3 |
| D-4 | Edit locked `e2e/history.spec.ts` case (5) to run under the paused clock. | Leave it and add a duplicate paused-clock case elsewhere. | AC#2 says "every SPEC-07 Back/Forward case of TASK-2.14 runs under the paused Playwright clock"; only the locked file holds those cases. The real-clock variant moves to the new file (AC#4). | yes (locked test) | user via qa.md (AC#2; unlocked under TASK-2.14) |

## 5. Design

### Files to create / modify
- `src/ui/App.tsx` — random key (D-2); `lastTableKey` module variable set in `openTable`; popstate step-off
  (D-3); update the comments at `:60` and the `Screen` docblock if they cite timeOrigin.
- `e2e/support/hold-writes.ts` — new init script `holdSessionsWrite` plus page helpers `armSessionsHold`,
  `sessionsHoldState`, `releaseSessionsHold`.
- `e2e/pause-history.spec.ts` — new acceptance tests (SPEC-01..05).
- `e2e/history.spec.ts` — locked; case (5) under the paused clock (SPEC-06).
- `docs/ui/navigation.md` — Back/Forward section: random key, Forward steps off, revised example, test list.

### Components, interfaces and data
- `App.tsx` (module scope):
  - `newTableKey(): string` — 32 lowercase hex chars from 16 CSPRNG bytes; no clock input.
  - `let lastTableKey: string | null = null` — set to the new key in `openTable` before `pushState`.
  - popstate handler becomes:
    1. If `tableKey.current === null`: if `entryKey(event.state) === lastTableKey` (and not null) →
       `history.back()`; return.
    2. Else if `entryKey(event.state) === tableKey.current` → return.
    3. Else pause to Home as today (`tableKey.current = null; setPaused(undefined); setScreen(home, returned)`).
  - `tableEntries` counter is removed.
- `e2e/support/hold-writes.ts`:
  - `holdSessionsWrite(): void` — init script. Wraps `IDBDatabase.prototype.transaction`. When
    `window.__tlhSessionsHold === 'armed'` and the call is `readwrite` with scope exactly `sessions` (string or
    one-element array), sets the flag to `'held'` and starts a keep-alive chain on that transaction's
    `sessions` store: each `count()` request's `onsuccess` issues the next while the flag is `'held'`. Any
    other call passes through unchanged. Setting the flag to `'released'` ends the chain, and the transaction
    commits normally. Nothing is imported from `src/`.
  - `armSessionsHold(page)`, `sessionsHoldState(page): Promise<string | undefined>`,
    `releaseSessionsHold(page)` — `page.evaluate` wrappers of the flag.

### Rules and algorithms
History, starting from the page before the app (`*` = current entry):

```text
load the app            […, app*]
Start game              […, app, T1*]      push T1, lastTableKey = T1
Back                    […, app*, T1]      popstate (null) on the Table → pause to Home
Forward                 […, app, T1*]      popstate (T1) on Home, T1 = lastTableKey → history.back()
                        […, app*, T1]      popstate (null) on Home → ignored
Back                    […*]               leaves the app (one Back)
```

After a reload on the Table (`[app, T1*]`, new load, `lastTableKey = null`), Resume pushes T2:
`[app, T1, T2*]`. Back → popstate (T1 ≠ T2) on the Table → pause to Home; T1 is not stepped off (D-3).

AC#1 race (with the hold armed before Start game):
1. Start game → start-record put held (`'held'`).
2. Hand 1 completes → its write waits for grading then `started.current` (held), so no `add` is issued.
3. Home (or Back) → Home effect waits on `tableWritesSettled()`; menu stays `data-paused="loading"`.
4. Release → start record commits → `add` commits (`handsPlayed: 1`) → `pausedSession()` reads it → Resume
   subtitle `Cash · 6 players · $4/$8 · 1 hand · paused`.
Without the wait in step 3: the read is created at once, runs right after the start record commits and before
the `add`, and shows `0 hands` while the stored `handsPlayed` is 1 — the test fails.

### Error handling and configuration
- No new errors. `crypto.getRandomValues` is already required by `newSessionId`.
- The hold helper only acts when armed; un-armed pages behave normally.

## 6. Behaviour specification

### SPEC-01: Home waits for a held sessions write before showing the paused hand count
- Verifies: AC#1
- Behaviour: Given a fresh context under the paused clock with `holdSessionsWrite` installed and armed before
  Start game, and the start-record write held (`sessionsHoldState` is `'held'`), When hand 1 has its result and
  the user chooses the Table's `Home` control, Then the `TLH Trainer` heading is focused, no Table region is
  shown, and the Main menu stays `data-paused="loading"` with no Resume session button after
  `page.clock.runFor(2000)` while still held; When the test releases the hold, Then the menu becomes
  `data-paused="shown"`, the Resume subtitle is `Cash · 6 players · $4/$8 · 1 hand · paused`, and the stored
  session's `handsPlayed` is 1 (equal to the shown count).
- Verification: acceptance `e2e/pause-history.spec.ts::Home waits for a held sessions write before showing the paused hand count`

### SPEC-02: browser Back waits for a held sessions write before showing the paused hand count
- Verifies: AC#1
- Behaviour: As SPEC-01, but the user presses browser Back (`page.goBack()`) instead of the Home control; same
  outcomes while held and after release.
- Verification: acceptance `e2e/pause-history.spec.ts::browser Back waits for a held sessions write before showing the paused hand count`

### SPEC-03: removing the guard makes the race tests fail
- Verifies: AC#1
- Behaviour: Given `App.tsx`'s Home effect changed from `tableWritesSettled().then(() => sharedHandStore().pausedSession())`
  to `sharedHandStore().pausedSession()`, When SPEC-01 and SPEC-02 run in Chromium, Then both fail (the subtitle
  shows `0 hands`); restoring the line makes them pass.
- Verification: manual apply that one-line change locally, run `npx playwright test e2e/pause-history.spec.ts --project=chromium -g "held sessions write"`, expect 2 failures, then `git checkout src/ui/App.tsx` and rerun to expect 2 passes; the Builder records both runs in its notes.

### SPEC-04: the Table history key is random, not clock-derived
- Verifies: AC#2
- Behaviour: Given the paused clock, When the user starts a game, reloads, and resumes, Then
  `history.state.tlhTable` after each opening matches `/^[0-9a-f]{32}$/` and the two keys differ.
- Verification: acceptance `e2e/pause-history.spec.ts::the Table history key is 32 random hex characters that differ across loads under the paused clock`

### SPEC-05: every TASK-2.14 Back/Forward case runs under the paused clock
- Verifies: AC#2
- Behaviour: Given `e2e/history.spec.ts`'s first test, When it runs, Then all five cases use `inContext` with the
  default paused clock (no `{ pausedClock: false }`), and case (5) (reload on the Table, Resume, Back → Home
  focused, no Table, `data-paused="shown"`) passes in Chromium and WebKit.
- Verification: acceptance `e2e/history.spec.ts::browser Back on the Table pauses to Home, Forward never reopens it, and Back on Home or Game Config leaves the app`

### SPEC-06: Back then Forward on the Table, then one Back on Home leaves the app
- Verifies: AC#3
- Behaviour: Given the paused clock and a started game at the user's turn, When the user presses Back (Home
  shows `Cash · 6 players · $4/$8 · 0 hands · paused`), then Forward, Then Home stays (heading visible, no
  Table region, `data-paused="shown"`) and `history.state` becomes `null`; When the user presses Back once,
  Then the page URL is `about:blank`. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/pause-history.spec.ts::after Back then Forward on the Table one Back on Home leaves the app`

### SPEC-07: Back after a reload on the Table and Resume opens Home (real clock)
- Verifies: AC#4
- Behaviour: Given the real clock, a started game whose start record is stored, When the user reloads, chooses
  Resume session (Table region shown) and presses browser Back, Then the `TLH Trainer` heading is focused, no
  Table region is shown and the menu is `data-paused="shown"`. Runs in Chromium and WebKit.
- Verification: acceptance `e2e/pause-history.spec.ts::after a reload on the Table and Resume browser Back opens Home on the real clock`

### SPEC-08: repo checks and docs
- Verifies: AC#1, AC#2, AC#3, AC#4
- Behaviour: Lint, typecheck, `npm test` and the full Playwright suite pass; `docs/ui/navigation.md` describes
  the random key, the Forward step-off (with the example in §5) and lists `e2e/pause-history.spec.ts`.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run e2e`

## 7. Edge cases
- Concurrency (write running while leaving the Table): SPEC-01, SPEC-02.
- Reload on the Table (foreign entry): SPEC-05, SPEC-07; foreign entries are never stepped off (D-3).
- Forward onto this load's entry from Home: SPEC-06. From Game Config/Statistics/Settings/Report: same rule
  (no Table shown) — not separately tested.
- Forward after the error screen's Return Home: handled by the same rule because `lastTableKey` is module-level
  (A-5); not separately tested (Not doing).
- Duplicate keys: 128 random bits; collision N/A.
- Empty / invalid input, permissions: N/A (no input; history state is same-origin).
- Dependency failure (start-record put fails): unchanged; `track` swallows it (`useTableSession.ts:101-104`).

## 8. Security considerations
- Trust boundaries: `history.state` is same-origin and only compared by equality; unchanged.
- Randomness: CSPRNG used for uniqueness only (not a secret).
- No new dependencies; the hold helper is test-only and never imported by `src/`.
- Authn/authz, secrets, injection, logging: N/A.

## 9. Non-functional
- Normal suite stays fast: the new spec file adds 5 tests per browser, each at most one hand under the paused
  clock; target under 15 s per test (measured from the Playwright report). No change to `npm test` duration.
- Flake: SPEC-01..07 pass 3 consecutive runs (`--repeat-each=3`) in both browsers.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npx playwright test e2e/pause-history.spec.ts e2e/history.spec.ts` (by hand:
  `npm run dev`, start a game, Back, Forward, then one Back leaves the app)
- New tests: `e2e/pause-history.spec.ts` → SPEC-01, 02, 04, 06, 07; `e2e/history.spec.ts` (edited) → SPEC-05.
- Judge scenario: in Chromium and WebKit, start a game, press Back, then Forward, then Back once — the browser
  leaves the app. Start a game, reload, Resume, Back — Home opens. Run SPEC-03's guard-removal check.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-2.20/qa.md`.
