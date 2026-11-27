# Spec: TASK-12.12 — Show an error instead of loading forever when a second tab opens during a blocked upgrade

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-12.12 · Parent/epic: TASK-12 · Requirements: n/a (follow-up from TASK-12.10 doc-188 J-2-01 and TASK-12.11 A-3) · Dream: limit-holdem-trainer

## 1. Summary
When an old-build connection blocks the v5 upgrade, the first app tab already rejects with `UpgradeBlockedError`,
but a second tab's open request queues behind the first tab's blocked request, never gets a `blocked` event and
leaves Home loading forever. This task gives every database open a bounded wait for its first answer: if the
request gets no `blocked`, `upgradeneeded`, `success` or `error` event within `OPEN_TIMEOUT_MS` (10 s), the open
rejects with `UpgradeBlockedError` exactly like a blocked open, so the tab shows its existing failure state. It
also does the TASK-12.10 tidy-ups (docs version table, redundant reset, dead guard, long docblock line) and adds
the held-write e2e that pins TASK-12.11 A-3 (the save-failed message clears before the next save settles).

## 2. Scope
- In scope:
  - `src/storage/hand-store.ts`: an open timeout (`OPEN_TIMEOUT_MS = 10_000`, overridable per store for tests)
    that funnels into the existing blocked-open path; the three tidy-ups.
  - `tests/storage/upgrade-blocked.test.ts`: tests for the queued second-tab open and for a normal open never
    timing out.
  - `docs/storage/hand-records.md`: version table to 5 (with `meta` since 5); one sentence on the open timeout.
  - `e2e/support/hold-writes.ts`: allow holding a readwrite transaction whose scope does not include `sessions`
    (needed to hold a `settings` write).
  - `e2e/settings-save-held.spec.ts` (new): the held-write e2e for AC#3.
- Not doing:
  - No new on-screen text, banner or retry button for the blocked/timeout case (TASK-12.10 Q-1: reject, existing
    failure states only).
  - No browser e2e for the two-tab case: it needs a 10 s wait (slow tests are opt-in only) and the store-level
    behaviour is fully reproducible with fake-indexeddb (verified: a second `openHandStore` on the same factory
    hangs today).
  - No change to `BLOCKED_GRACE_MS` (100 ms) or to the retry-on-next-call rule.
  - No edit of `e2e/settings-save-failed.spec.ts` (TASK-12.11's acceptance file); the new test goes in a new file.
  - No renaming of the `holdSessionsWrite` / `armSessionsHold` helpers.
- Scope budget: files=5, lines=190

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `OPEN_TIMEOUT_MS = 10_000` (10 s), measured to the request's *first* event; the timer is cleared on `blocked`, `upgradeneeded`, `success` or `error`, so the length of an upgrade never counts. | yes | Measured in Playwright Chromium (this repo, `page.evaluate` over 5 fresh DBs): first event 0–1 ms, whole first-run v5 upgrade with 5 stores 0–1 ms, re-open 0–1 ms. 10 s is ~10^4 times that, enough for cold-start/low-end-device IndexedDB backing-store opens (hundreds of ms to a few s). A false timeout is costly (Home hides Resume, settings fall back to defaults), so err long; the only cost of long is a 10 s wait in the rare two-tab-blocked case instead of forever. | 5 s (snappier error, smaller margin); 30 s. |
| A-2 | A timed-out open is handled exactly like a blocked one: it rejects with `UpgradeBlockedError`, the request is tracked as the pending `blockedOpen`, a late success closes its connection at once, and the next store call retries (after the existing ≤100 ms grace wait). | yes | Reuses the TASK-12.10 path (D-1) so there is one recovery rule; a timed-out request may still succeed later and must not hold the DB. | A separate `OpenTimeoutError` (callers do not distinguish errors; AC says `UpgradeBlockedError`). |
| A-3 | `openHandStore` gets a third optional parameter `openTimeoutMs = OPEN_TIMEOUT_MS`; `OPEN_TIMEOUT_MS` is exported. App code keeps calling `openHandStore()` / `sharedHandStore()` unchanged. | yes | Lets unit tests use ~200 ms instead of waiting 10 s; matches the existing injectable `factory`/`name` parameters (`src/storage/hand-store.ts:243`). | Fake timers (fragile with fake-indexeddb's own scheduling). |
| A-4 | "Redundant reset" is removed as the TASK-12.10 r2 review suggested: the `onBlocked` callback just sets `blockedOpen = settled`; nothing sets it back to null. After the pending request settles, a later call's race resolves at once (one extra microtask and a cleared timer per call). | yes | Reviewer's proposed fix (`doit/TASK-12.10/reviews/round-2/code.json`, MINOR at `:262`); mutation showed no behaviour change. | Keep the reset and drop the finding. |
| A-5 | `hold-writes.ts`: the keep-alive `count()` chain runs on the `sessions` store when the held scope includes it (unchanged for existing callers) and otherwise on the first store of the sorted scope; the "scope must include `sessions`" wording is dropped. | yes | Smallest change that lets `armSessionsHold(page, ['settings'])` hold a settings write; existing users (`e2e/pause-history.spec.ts`, `e2e/end-session-hardening.spec.ts`) only use scopes with `sessions`. | A private hold script inside the new spec (duplicates ~30 lines). |
| A-6 | The new e2e makes the first save fail with its own copy of the TASK-12.11 init script (puts on `settings` throw while a window flag is set). | yes | The original `failSettingsPuts` is a non-exported function inside TASK-12.11's acceptance file, which this task must not edit. ~15 duplicated lines. | Move it to `e2e/support/` (requires editing the locked file). |

## 3. Current system
- `src/storage/hand-store.ts:50-51` `BLOCKED_GRACE_MS = 100`; `:53-99` `opened()` — `onblocked` calls
  `onBlocked(settled)` and rejects `UpgradeBlockedError` (`:63-66`); a late `onsuccess` after that closes the
  connection and resolves `settled` (`:84-91`); `onerror` resolves `settled` (`:95-98`).
- `src/storage/hand-store.ts:236-272` `openHandStore`: `blockedOpen` (`:246`); a call while it is pending races it
  against `BLOCKED_GRACE_MS` and throws `UpgradeBlockedError` on timeout (`:247-258`); the redundant reset
  (`:261-264`); the always-true `db === opening` guard (`:268`, reviewed NIT: `db` is only assigned when null and
  only this handler nulls it); the 179-char docblock line (`:240`, the only line >120 chars in the file).
- `src/storage/hand-store.ts:375-377` `sharedHandStore()` = `openHandStore()` with defaults — what the App uses.
- Existing failure states (no change needed): `src/ui/App.tsx:101-120` settings read failure → defaults;
  `:126-144` paused-session read failure → `setPaused(null)`, so Home leaves its `data-paused="loading"` state.
- The hang reproduces in fake-indexeddb: a second `openHandStore(factory)` on the same factory, while the first
  one's open is blocked by a v4 connection, neither resolves nor rejects within 1.5 s (checked by a scratch test,
  deleted).
- `docs/storage/hand-records.md:20-21` says version `4` and lists stores up to `settings`; `DB_VERSION` is 5
  (`src/storage/hand-store.ts:31`), v5 adds `meta` (`docs/storage/persistent-storage.md:18`). Paragraph
  `:25-33` describes the blocked handling.
- Settings save path: `src/ui/App.tsx:331-346` `changeSettings` sets the value, clears `settingsSaveFailed`
  synchronously, then saves; `writeSettings` opens a `readwrite` transaction on `settings` only
  (`src/storage/hand-store.ts:344-352`).
- `e2e/support/hold-writes.ts`: `holdSessionsWrite` init script holds the next armed readwrite transaction by a
  `count()` chain on its `sessions` store; `armSessionsHold(page, scope)`, `sessionsHoldState`,
  `releaseSessionsHold`. While held, any other transaction on the same store waits, so the stored record cannot
  be read until release.
- `e2e/settings-save-failed.spec.ts` (TASK-12.11 acceptance): `MESSAGE`, `DEFAULTS`, `failOneChange`,
  `storedSettings` via `readStore` from `e2e/support/hand-records.ts`.
- Tests: Vitest + fake-indexeddb for storage (`tests/storage/upgrade-blocked.test.ts`), Playwright for e2e.
- Existing code to reuse:
  - `opened()` blocked path (`onBlocked` + `settle`) → the timeout calls the same give-up path.
  - `tests/storage/upgrade-blocked.test.ts` `openRaw`, `openV4Blocker` → the new unit tests.
  - `e2e/support/hold-writes.ts` → hold the `settings` write.
  - `e2e/support/hand-records.ts` `readStore` → read the stored settings after release.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Bound the wait for an open request's first event; on timeout use the blocked-open path (A-1, A-2). | Detect another tab via BroadcastChannel/`navigator.locks`; reject only when a second store instance sees `blockedOpen`. | Store instances in different tabs share no state; a timer is the only signal a queued request has. Reusing the blocked path keeps one recovery rule. | yes | TASK-12.12 AC#1 (`UpgradeBlockedError`); value per A-1 |
| D-2 | The timer measures time to the first event, not to `success`. | Time to `success`. | A slow first-run upgrade then can never be cut off (it fires `upgradeneeded` first). | no | n/a |
| D-3 | AC#3 test lives in a new file `e2e/settings-save-held.spec.ts`. | Add to `e2e/settings-save-failed.spec.ts`. | That file is TASK-12.11's acceptance test. | no | n/a |

## 5. Design

### Files to create / modify
- `src/storage/hand-store.ts` — `OPEN_TIMEOUT_MS`, timeout in `opened()`, `openTimeoutMs` parameter, tidy-ups.
- `tests/storage/upgrade-blocked.test.ts` — two new tests (SPEC-01, SPEC-02).
- `docs/storage/hand-records.md` — version table and the open-timeout sentence.
- `e2e/support/hold-writes.ts` — hold a scope without `sessions` (A-5).
- `e2e/settings-save-held.spec.ts` — new, AC#3 (SPEC-04).

### Components, interfaces and data
- `export const OPEN_TIMEOUT_MS = 10_000;` with a docblock: how long an open waits for its first answer; a request
  queued behind another tab's blocked upgrade gets none (A-1 rationale in one line).
- `opened(factory, name, onBlocked, timeoutMs: number)`:
  - Starts `const timer = setTimeout(giveUp, timeoutMs)` right after `factory.open`.
  - `giveUp()`: if already given up (`settle !== null`), return; else `onBlocked(new Promise(done => settle = done))`
    and `reject(new UpgradeBlockedError())`. `request.onblocked = () => { clearTimeout(timer); giveUp(); }`.
  - `onupgradeneeded`, `onsuccess`, `onerror` each `clearTimeout(timer)` first; the rest is unchanged (a late
    success after `giveUp` closes the connection and calls `settle()`; error calls `settle?.()`).
- `openHandStore(factory = indexedDB, name = DB_NAME, openTimeoutMs = OPEN_TIMEOUT_MS): AppStore` — passes
  `openTimeoutMs` to `opened`. `sharedHandStore()` unchanged.
- Tidy-ups in `openHandStore`: `opened(factory, name, (settled) => { blockedOpen = settled; }, openTimeoutMs)` (no
  `.then` reset, A-4); catch handler `if (error instanceof UpgradeBlockedError) db = null;`; the docblock rewrapped
  to ≤120 columns and extended with "or gets no answer within `openTimeoutMs`".
- `hold-writes.ts`: `const held = scope.split(',').includes('sessions') ? 'sessions' : scope.split(',')[0];`
  `const store = opened.objectStore(held);` — doc comments updated to say "the held store" (A-5).

### Rules and algorithms
- Worked example (second tab): v4 blocker open. Tab 1 `count()` → `blocked` → rejects `UpgradeBlockedError` at once.
  Tab 2 `count()` → request queued, no event → at `openTimeoutMs` rejects `UpgradeBlockedError`; App's
  `pausedSession` handler sets `paused = null`, Home leaves loading. Blocker closes → tab 1's request upgrades and
  closes itself; tab 2's queued request succeeds and closes itself (`settle()`); tab 2's next call retries and
  opens v5.
- Worked example (normal first run): request → `upgradeneeded` at ~1 ms → timer cleared → upgrade → `success`.
  Never times out however long the upgrade runs.

### Error handling and configuration
- Only error type: existing `UpgradeBlockedError` (message unchanged). No new user-visible text. Default timeout
  10 000 ms; tests pass smaller values via the third parameter.

## 6. Behaviour specification

### SPEC-01: A second tab's open queued behind a blocked upgrade rejects after the timeout, then recovers
- Verifies: AC#1
- Behaviour: Given a fake-indexeddb factory with a v4 connection that never closes and a first
  `openHandStore(factory)` whose `count()` has rejected with `UpgradeBlockedError`, When a second
  `openHandStore(factory, DB_NAME, 200)` calls `count()`, Then it rejects with `UpgradeBlockedError` (name
  `'UpgradeBlockedError'`) after at least ~200 ms and in under 2 000 ms; and after the blocker closes, a later
  call on the second store resolves `0` (retry within a bounded poll of ≤2 s), and a raw open at
  `DB_VERSION + 1` then upgrades from `oldVersion` 5 without being blocked (no stray connection is left open).
- Verification: acceptance `tests/storage/upgrade-blocked.test.ts::a second store whose open is queued behind a blocked upgrade rejects after the open timeout`

### SPEC-02: A normal open never hits the timeout
- Verifies: AC#1
- Behaviour: Given a fresh factory and `openHandStore(factory, DB_NAME, 50)`, When `count()` runs (first-run
  upgrade to v5), Then it resolves `0`; and after waiting 150 ms more, `count()` and `readSettings()` still resolve
  (`0` and the default settings) — the cleared timer never rejects or resets the open. And `OPEN_TIMEOUT_MS` is
  `10_000`.
- Verification: unit `tests/storage/upgrade-blocked.test.ts::an open that is answered in time never times out`

### SPEC-03: Docs and hand-store tidy-ups, storage tests still pass
- Verifies: AC#2
- Behaviour: Given the changes, Then `docs/storage/hand-records.md` names version `5` and lists `meta` (since 5) in
  its table; `src/storage/hand-store.ts` has no `db === opening`, no `blockedOpen = null` reset, and no line longer
  than 120 characters; and every storage test passes.
- Verification: command `npx vitest run tests/storage && grep -q "version \`5\`" docs/storage/hand-records.md && ! grep -q "db === opening" src/storage/hand-store.ts && ! grep -q "blockedOpen = null" src/storage/hand-store.ts && awk 'length > 120 {bad=1} END {exit bad}' src/storage/hand-store.ts`

### SPEC-04: The save-failed message is gone while the next save is still held
- Verifies: AC#3
- Behaviour: Given Settings is open, a settings save has failed and the alert shows "Your change could not be
  saved, so the setting is unchanged." (toggle "Show opponent styles at the table" back to checked), and puts work
  again with the hold armed for scope `['settings']`, When the user presses Space on the toggle, Then the hold
  state is `'held'` and, while it is still `'held'`, there is no `alert` role on the page and the toggle is
  unchecked; after `releaseSessionsHold`, the stored settings poll to `{ ...DEFAULTS, showOpponentStyles: false }`
  and still no alert shows.
- Verification: acceptance `e2e/settings-save-held.spec.ts::the message clears at the next change before that save settles`

### SPEC-05: Existing holds on `sessions` scopes are unchanged
- Verifies: AC#3
- Behaviour: Given the generalised `hold-writes.ts`, When the existing hold-based e2e files run, Then they pass
  unchanged.
- Verification: command `npx playwright test e2e/pause-history.spec.ts e2e/end-session-hardening.spec.ts e2e/settings-save-failed.spec.ts e2e/settings-save-held.spec.ts`

## 7. Edge cases
- Queued request that never gets an event (second tab): SPEC-01.
- Slow first-run upgrade: timer cleared at `upgradeneeded`, SPEC-02 / D-2.
- `blocked` fires after the timeout already gave up: `giveUp` is idempotent (`settle !== null` guard); covered by
  design, not separately testable in fake-indexeddb (same-version queued requests never get `blocked`).
- Timed-out request later succeeds: connection closed at once — SPEC-01's `DB_VERSION + 1` open.
- Timed-out request later errors: `settle?.()` releases `blockedOpen` (existing path).
- Calls while the timed-out request is pending: existing ≤100 ms grace then `UpgradeBlockedError` (TASK-12.10
  tests still pass).
- Held write and a read of the same store: the e2e does not read `settings` while held (it would wait).
- Concurrency of two store instances in one test process: SPEC-01.

## 8. Security considerations
No new trust boundary, input, dependency, secret or randomness. Test hooks stay in e2e init scripts; nothing is
imported from `src/` into the bundle.

## 9. Non-functional
- A normal open adds one `setTimeout`/`clearTimeout` pair; no measurable cost.
- Worst case for the second-tab case: Home shows its failure state 10 s after opening (from forever).
- New unit tests add < 1 s to `npm test`; the new e2e runs in normal time (no 10 s wait).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/settings-save-held.spec.ts e2e/settings-save-failed.spec.ts` (AC#3);
  the two-tab case needs an old build holding a v4 connection, so it is run through SPEC-01
  (`npx vitest run tests/storage/upgrade-blocked.test.ts`), which reproduces today's hang with fake-indexeddb.
- New tests:
  - `tests/storage/upgrade-blocked.test.ts` → SPEC-01, SPEC-02
  - `e2e/settings-save-held.spec.ts` → SPEC-04
- End-to-end scenario for the Judge: run the e2e above; run `npx vitest run tests/storage/upgrade-blocked.test.ts`
  and read SPEC-01's timings; run SPEC-03's command.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-12.12/qa.md`.
