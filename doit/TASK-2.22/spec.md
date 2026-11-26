# Spec: TASK-2.22 — Leave the app with one Back after reloading on the Table

Status: READY (approved 2026-11-26, autopilot — no ask items)
Task: TASK-2.22 · Parent/epic: TASK-2 · Requirements: REQ-004.9 (via TASK-2.14, TASK-2.20) · Dream: limit-holdem-trainer

## 1. Summary
After a reload while the Table is shown, the current history entry is the earlier load's Table entry
(`{ tlhTable: K1 }`). Resume (or Start game) then pushes a second Table entry on top of it, and the Home control steps back
onto K1, so from Home the first Back is a silent step onto the app's entry and only the second Back leaves the
app. This task makes opening the Table **replace** a Table entry that is already current instead of pushing
above it, so no stale Table entry remains and one Back from Home leaves the app, with no page reload anywhere
on the way (the AC's "replaced" alternative, which also achieves its "one Back leaves the app" outcome).

## 2. Scope
- In scope:
  - `openTable` in `src/ui/App.tsx`: when `history.state` already carries a `tlhTable` key, call
    `history.replaceState({ tlhTable: key }, '')` instead of `history.pushState(...)` (D-1).
  - A new e2e spec, `e2e/reload-history.spec.ts`, run on every push in Chromium and WebKit.
  - `docs/ui/navigation.md` "Browser Back and Forward": correct the reload paragraphs (the claim that stepping
    back from an earlier load's entry reloads the page is wrong; see §3 Evidence), the example and the test list.
  - The comment on the popstate handler / `openTable` in `App.tsx` naming TASK-2.22 D-1.
- Not doing:
  - Reload on the Table, then Back from Home **without** opening the Table again: still two Backs (the first is a
    silent step from the stale entry onto the app's entry, no reload). Not in AC#1; see scope concerns.
  - No change to the popstate handler's rules (D-3 of TASK-2.20 stays: only this load's last pushed key is
    stepped off on Forward), `closeTable`, AppRoot's Return Home, the key format or the history state shape.
  - No Navigation API, no `beforeunload`/`pagehide` handling, no `history.back()` at page start (D-1 alternatives).
  - No edit to any locked test file (`e2e/history.spec.ts`, `e2e/pause-history.spec.ts`, `e2e/home.spec.ts`,
    `e2e/home-control.spec.ts`, `e2e/error-recovery.spec.ts`).
  - No Backlog doc edits (doc-146 is historical).
- Scope budget: files=3, lines=170

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "A Table entry is current" means `entryKey(history.state)` is a `string` (any key, this load's or an earlier load's). | yes | The only writer of `tlhTable` is `openTable` (`src/ui/App.tsx:201`), always with a 32-hex string; AppRoot tests `'tlhTable' in state` (`src/ui/AppRoot.tsx:65`). A string test is the narrowest check that covers both stale cases. | Test `'tlhTable' in state` (accepts malformed states too); test only foreign keys (`!== lastTableKey`), leaving this load's own stale entry to be pushed over. |
| A-2 | The new tests go in a new file `e2e/reload-history.spec.ts` (every push, not the slow group), with its own copies of the small locator helpers, like `e2e/pause-history.spec.ts` did. | yes | Each case plays no hand past the deal under the paused clock (a few seconds); it is a behaviour test, not a speed/scale check, so it does not belong in the opt-in slow group. A new file needs no locked-test edit. | Add cases to locked `e2e/history.spec.ts` or `e2e/pause-history.spec.ts` (needs an unlock). |
| A-3 | "No page reload on the way" is asserted by a `window` marker set after the Home control (or Back on the Table) that is still present while the app shows Home, plus `history.state === null` and `history.length` equal to its value before the reload, then one `goBack()` reaching `about:blank`. | yes | With one Back leaving the app there is no intermediate app page; the marker and the unchanged length prove no extra entry and no reload while still in the app. | Count Playwright `load` events (also fires for `about:blank`, ambiguous). |

## 3. Current system
- `src/ui/App.tsx:59-63` `newTableKey()` (32 hex CSPRNG); `:66-68` module-level `lastTableKey`; `:69-72`
  `entryKey(state)`.
- `src/ui/App.tsx:182-196` popstate handler: with no Table shown, steps back only when the state's key equals
  `lastTableKey` (TASK-2.20 D-3); with a Table shown, any other state pauses to Home.
- `src/ui/App.tsx:198-204` `openTable`: always `history.pushState({ tlhTable: key }, '')`, sets `lastTableKey` and
  `tableKey.current`. Called from Resume (`:239`), Start game with no paused session (`:259`, `:273`) and
  `End session and start` (`:290`).
- `src/ui/App.tsx:206-211` `closeTable`: `history.back()` only if the current state's key is the shown Table's.
- `src/ui/AppRoot.tsx:63-65` Return Home: `history.back()` if the current state has `tlhTable`.
- `docs/ui/navigation.md:114-147` describes the history model; `:129-131` and `:146-147` describe the reload case.
- E2E: Playwright, `playwright.config.ts` (Chromium + WebKit projects, `npm run build && npm run preview` on port
  4173); `npm run e2e`. Slow e2e files gate on `TLH_SLOW_TESTS` and are listed in `package.json` `e2e:slow`.
- Existing code to reuse:
  - `e2e/pause-history.spec.ts:28-65` → the `inContext` (paused clock + `stubReplayWords`), `openHome`,
    `startGame`, locator helpers (copy, as that file did; they are not exported).
  - `e2e/support/hand-records.ts:125,134` → `storedSessions`, `header`.
  - `e2e/support/paused-clock.ts` → `runUntilMyTurn`.
  - `e2e/support/table-harness-bundle.ts` → `stubReplayWords`.

### Evidence: what browsers do here (experiments run 2026-11-26, Playwright 1.65.1 Chromium and WebKit)
1. **The reported reload does not happen.** On the real built app (`vite preview`): New game → Start game →
   reload → Resume → Home. `history.state` on Home is the old `{ tlhTable: K1 }`. One Back: URL stays the app,
   a `window` marker set before the Back survives, `history.state` becomes `null`, popstate fires with `null`,
   Home stays; a second Back reaches `about:blank`. Same in both engines. So the defect is "the first Back from
   Home does nothing visible", not a reload. Reason: `pushState` entries share the document state of the entry
   they were pushed from, and a reload replaces that shared document, so the earlier load's app entry and Table
   entry are same-document with the reloaded page (HTML spec, session history "document state").
2. **History entries cannot be deleted.** `pushState`/`replaceState` only add or rewrite the current entry; there
   is no API to remove an entry behind the current one. Replacing the stale entry's state at page start
   (`replaceState(null)`) leaves `[app, app*]`: still two Backs (verified: same result as today, both engines).
3. **Replace on open works.** Minimal page mirroring `openTable`/`closeTable`/popstate: push T1, reload, then
   "open" with `replaceState` when the current state has `tlhTable`. `history.length` stays 3
   (`about:blank`, app, T2). Home control → `history.back()` → app (`null`); one Back → `about:blank`. Back on the
   Table instead → popstate `null` → pauses (marker kept, no reload); one more Back → `about:blank`. Identical in
   Chromium and WebKit.
4. **Bounce at start also works but is rejected (D-1).** `history.back()` at page start when loaded on a Table
   entry is a same-document step (no reload) in both engines and leaves one Back from Home, but it is async and
   can race a quick Resume, and leaves a forward entry.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `openTable` replaces the current entry (`replaceState`) when it already carries a `tlhTable` string key; otherwise it pushes, as today. `lastTableKey` and `tableKey.current` are set the same way in both branches. | (a) `history.back()` at page start when loaded on a Table entry; (b) popstate steps off any `tlhTable` entry, not only `lastTableKey`; (c) `replaceState(null)` at page start; (d) Navigation API. | Synchronous, one line of logic, no extra navigation, no race. Leaves exactly one app entry below the Table, so Back on the Table still pauses to Home (same-document popstate, §3 Evidence 3) and one Back from Home leaves the app. (a) is async and races Resume; (b) fixes the Home-control path only via a second traversal; (c) changes nothing observable (Evidence 2); (d) cannot delete entries either and is not needed. Matches the AC's "the extra entry is replaced so no stale Table entry remains". | yes (browser history behaviour) | AC#1 wording ("or the extra entry is replaced") |
| D-2 | Correct `docs/ui/navigation.md`: stepping back from an earlier load's Table entry does **not** reload the page (it is same-document after a reload); describe the replace rule and the remaining two-Back case without Resume. | Leave TASK-2.20's wording. | The current text is factually wrong (Evidence 1) and would mislead later tasks. | no | n/a |

## 5. Design

### Files to create / modify
- `src/ui/App.tsx` — `openTable`: replace instead of push when a Table entry is current (D-1); comment.
- `e2e/reload-history.spec.ts` — new acceptance spec (SPEC-01..03), every push, Chromium and WebKit.
- `docs/ui/navigation.md` — reload paragraphs, example and test list (D-2).

### Components, interfaces and data
- No signature changes. History state shape unchanged: `{ tlhTable: <32 hex> }`.
- `openTable(table)`:
  ```ts
  const key = newTableKey();
  lastTableKey = key;
  if (typeof entryKey(history.state) === 'string') history.replaceState({ tlhTable: key }, '');
  else history.pushState({ tlhTable: key }, '');
  tableKey.current = key;
  setScreen(table);
  ```
- Invariant after this task: at most one entry with a `tlhTable` key sits directly above the app's entry in the
  current page's history, and when the Table is shown it is the current entry.

### Rules and algorithms
Worked examples (`*` = current entry; `blank` = page before the app):
```text
load, Start game          [blank, app, T1*]
reload (Home shows)       [blank, app, T1*]          new load, lastTableKey = null, state {tlhTable: T1}
Resume                    [blank, app, T2*]          T1 is a string key → replaceState (was: push → [app, T1, T2*])
Home control              [blank, app*, T2]          closeTable: state key = T2 → history.back()
Back                      [blank*]                   leaves the app (one Back)

reload, Resume, Back      [blank, app*, T2]          popstate(null) on the Table → pause to Home (unchanged rule)
Back                      [blank*]                   one Back leaves the app

reload, New game, Start game, End session and start
                          [blank, app, T2*]          openTable at App.tsx:290 replaces T1 the same way
Home, Back                [blank*]
```
- No reload case is unchanged: from Home on the app entry (`state null`) `openTable` pushes, as today.
- Forward after Home: `[blank, app*, T2]` → Forward → popstate(T2) = `lastTableKey` → `history.back()` (TASK-2.20
  D-3, unchanged) → Home stays; one Back leaves the app.

### Error handling and configuration
- None new. `replaceState` and `pushState` throw only on unserialisable state or a cross-origin URL; neither
  applies (same state object and no URL argument as today).

## 6. Behaviour specification

### SPEC-01: After a reload on the Table, Resume, then Home, one Back leaves the app with no reload
- Verifies: AC#1
- Behaviour: Given the paused clock, a game started from Home whose start record is stored (`storedSessions`
  length 1), and `history.length` recorded as `L` while the Table is shown, When the user reloads, chooses Resume
  session (the Table region shows), chooses the header's `Home` (Home's `TLH Trainer` heading focused, no Table
  region, menu `data-paused="shown"`), Then `history.length` is still `L`, `history.state` is `null`, a `window`
  marker set right after Home is still set, and one `page.goBack()` makes `page.url()` `about:blank`. Passes in
  Chromium and WebKit.
- Verification: acceptance `e2e/reload-history.spec.ts::after a reload on the Table, Resume and Home, one Back leaves the app`

### SPEC-02: After a reload on the Table and Resume, Back on the Table pauses to Home and one more Back leaves the app
- Verifies: AC#1
- Behaviour: Given the same start and reload as SPEC-01, When the user chooses Resume session and then presses
  browser Back on the Table, Then Home shows with its heading focused, no Table region and `data-paused="shown"`,
  the `window` marker set before that Back is still set (same document, no reload), `history.state` is `null`,
  and one more `page.goBack()` makes `page.url()` `about:blank`. Passes in Chromium and WebKit.
- Verification: acceptance `e2e/reload-history.spec.ts::after a reload on the Table and Resume, Back pauses to Home and one more Back leaves the app`

### SPEC-03: After a reload on the Table, a new game started over the paused session also leaves with one Back
- Verifies: AC#1
- Behaviour: Given the same start and reload as SPEC-01, When the user chooses New game, Start game, then
  `End session and start` in the `End your paused session?` dialog (the Table region shows), then the header's
  `Home`, Then `history.length` is still `L`, `history.state` is `null`, and one `page.goBack()` makes
  `page.url()` `about:blank`. Passes in Chromium and WebKit.
- Verification: acceptance `e2e/reload-history.spec.ts::after a reload on the Table a new game then Home leaves the app with one Back`

### SPEC-04: Existing history behaviour is unchanged
- Verifies: AC#1
- Behaviour: Given the locked TASK-2.14 / TASK-2.20 history specs, When the full Playwright suite runs, Then
  `e2e/history.spec.ts`, `e2e/pause-history.spec.ts`, `e2e/home.spec.ts`, `e2e/home-control.spec.ts` and
  `e2e/error-recovery.spec.ts` pass unchanged in Chromium and WebKit (no reload: push as before; Back on a
  resumed Table after a reload still pauses to Home; keys still 32 hex and differ across loads).
- Verification: command `npm run build && npx playwright test e2e/history.spec.ts e2e/pause-history.spec.ts e2e/home.spec.ts e2e/home-control.spec.ts e2e/error-recovery.spec.ts`

### SPEC-05: Docs describe the replace rule and the corrected reload behaviour
- Verifies: AC#1
- Behaviour: Given `docs/ui/navigation.md` "Browser Back and Forward", Then it states that opening the Table
  while a Table entry is current replaces that entry (TASK-2.22), that after a reload Resume or Start game then
  Home leaves the app with one Back, that stepping back from an earlier load's entry does not reload the page,
  that a reload followed by Back from Home without reopening the Table still takes two Backs (the first does
  nothing visible), the updated reload example, and `e2e/reload-history.spec.ts` in the Tests list; the sentence
  "stepping back from them would reload the page" is gone.
- Verification: manual Read `docs/ui/navigation.md` §"Browser Back and Forward" and §Tests against this list.

## 7. Edge cases
- Reload on the Table, then Resume: SPEC-01, SPEC-02.
- Reload on the Table, then a new game through the end-session dialog: SPEC-03. Start game with no paused session
  after a reload on the Table cannot occur (the reload leaves the session paused; Start game then asks).
- No reload (state `null` on open): unchanged push path, SPEC-04.
- Forward onto the replaced entry after Home: handled by TASK-2.20 D-3 (`lastTableKey` = the replaced key);
  covered by the same rule as `e2e/pause-history.spec.ts` Back/Forward case; no new test.
- Two reloads on the Table before Resume: the current entry is still one Table entry; same as SPEC-01.
- Reload, then Back from Home without reopening the Table: out of scope (Not doing), unchanged.
- Error screen Return Home after a resumed Table: AppRoot steps back off the (replaced) Table entry onto the app
  entry as before; covered by locked `e2e/error-recovery.spec.ts` (SPEC-04).
- Concurrency/interruption/permissions/invalid input: N/A (no I/O or input added).

## 8. Security considerations
- Trust boundary: `history.state` is same-origin; only its `tlhTable` type is inspected (string), never evaluated.
- No new dependencies, no randomness change (key still CSPRNG, TASK-2.20 D-2), nothing logged or stored.
- Authn/authz, secrets, injection: N/A.

## 9. Non-functional
- The new spec file adds 3 tests per browser, each one reload and no hand played past the deal under the paused
  clock; target under 15 s per test (Playwright report). It runs on every push: it is a behaviour test, not a
  speed/scale check, so it is not in the opt-in slow group (`e2e:slow`). No change to `npm test`.
- Flake: SPEC-01..03 pass `--repeat-each=3` in both browsers.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run build && npx playwright test e2e/reload-history.spec.ts e2e/history.spec.ts e2e/pause-history.spec.ts` (by hand: `npm run dev`, New game, Start game, reload, Resume session, Home, then one Back leaves the app)
- New tests: `e2e/reload-history.spec.ts` → SPEC-01, SPEC-02, SPEC-03. Regression: SPEC-04 (locked files, unchanged).
- Judge scenario: in Chromium and WebKit on the production preview, start a game, reload, Resume, choose Home,
  press Back once — the browser leaves the app with no flash of Home. Repeat with Back on the Table instead of
  Home (Home opens, then one Back leaves). Without a reload, start a game, Home, Back once leaves (unchanged).

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-2.22/qa.md`.
