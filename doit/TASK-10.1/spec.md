# Spec: TASK-10.1 — End the session with Leave table and see its saved report with my cash result

Status: READY (approved 2026-11-24)
Task: TASK-10.1 · Parent/epic: TASK-10 · Requirements: REQ-004 (004.5), REQ-007 (007.3), REQ-044 (044.1, 044.7, 044.8), REQ-052 (052.1, 052.5) · Dream: limit-holdem-trainer

## 1. Summary
Leave table (the Table header and the bust dialog) stops pausing to Home. It now ends the session: the app
waits for any hand write still running, then one IndexedDB transaction writes `endedAt` on the session record
and adds a new, never-modified Session Report record. Then the Session Report screen opens with the header line
(game type, players, stake, hands), the cash KPI tiles Result, BB/100 and Rebuys, and a `Back to Home` button (Q-3). A session with 0 completed
hands is deleted instead: no report is shown or stored, and Home opens. The pure report builder
(`sessionReport`) and the store operation (`endSession`) are exported for TASK-2.7, E05 and E11.

## 2. Scope
- In scope:
  - `src/table/session-report.ts` (new, headless): the `SessionReport` type, `sessionReport(session, endedAt)`,
    `parseSessionReport(value)`, the BB/100 rounding, `reportView(report)` (header line and tiles) and the
    `SessionEnder` interface.
  - `src/storage/hand-store.ts`: DB version 3 adds the `reports` object store. New store methods
    `endSession(sessionId, endedAt)` and `getReport(sessionId)`.
  - `src/ui/report/ReportScreen.tsx` (new) and its styles. `App` gets `ending` and `report` screens and a
    `leave(sessionId)` handler. `Table`/`TableScreen` hand the session id to `onLeave`, and `useTableSession`
    returns `sessionId`.
  - Unit, acceptance and Playwright tests. The locked-test edits listed in D-4. Docs.
- Not doing:
  - The mid-hand Leave-now dialog, the auto-fold and recording the forced-fold hand (TASK-10.2). Mid-hand, this
    story drops the unfinished hand (D-2, approved by Q-2).
  - Error rates, hint usage, style stats, leaks, playing time and a hands-played KPI tile (TASK-10.3..10.11).
    No empty or placeholder style or leaks sections.
  - The sit-and-go finishing position (TASK-10.12, TASK-5.11). A sit-and-go report has `cash: null` and shows
    only its header line (A-3).
  - View statistics (TASK-11.6; `Back to Home` is added here per Q-3). Reopening a stored report from Home (TASK-2.16). The New game confirm that
    ends a paused session (TASK-2.7; it will call `endSession`).
  - Any change to the Home control, to browser Back on the Table, or to hand-record or session-record fields
    other than writing `endedAt`.
  - Per-store schema versions or migrations framework (REQ-054 / TASK-13.6).
- Scope budget: files=23, lines=1300

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The report's values come from the stored session record only: `handsPlayed`, the user seat's `stack` (final stack), `rebuys`, `config` and `startedAt`. Hand records are not read in this slice. Later slices (TASK-10.4 onward) add a `hands` argument for error rates and the rest. | yes | The session record is written in the same transaction as each hand record (`src/storage/hand-store.ts:59-69`), so its `handsPlayed` and stacks always match the stored hands. | Count hand records with a cursor and take the stack from the last record's result (more code, same numbers) |
| A-2 | Formatting. Result: `+$46`, `-$40`, `$0` (ASCII `+`/`-`, no thousands separator, as the table's `$${n}`). BB/100: `+2.7`, `-5.0`, `0.0` (no sign when it rounds to 0). Rebuys: the plain integer `1`. Tile labels: `Result`, `BB/100` (storyboard `Report.dc.html` KPI labels), `Rebuys`. | yes | Matches AC#3/AC#4 and the storyboard. No signed amounts exist elsewhere in the app to copy. | `+$0`/`+0.0` for zero; `$1,234` grouping |
| A-3 | Sit-and-go: Leave table also ends the session (REQ-004.5 applies to every game). Its report has `cash: null` and the screen shows only the heading and header line (e.g. `Sit-and-go · 6 players · 20/40 · 12 hands`). The finishing position is TASK-10.12 / TASK-5.11. | yes | REQ-044.1 gives sit-and-go no cash result. Pausing a sit-and-go on Leave would contradict REQ-004.5. | Keep pause-to-Home for sit-and-go until TASK-5.11 |
| A-4 | `App` is busy while ending. It shows an `ending` screen (`<main className="screen" aria-busy="true"></main>`, no heading and no controls) from the click until `endSession` settles. The Table unmounts at once, so no timer can deal another hand. A second `leave` call is ignored: `leave` returns at once when `tableKey.current === null`. | yes | The end waits for `tableWritesSettled()` (`src/ui/table/useTableSession.ts:100-104`). A 0-hand end must not flash a report heading (AC#7). | Keep the Table mounted with `holdNextHand` until done (more wiring) |
| A-5 | If `endSession` rejects (IndexedDB error), `App` logs `console.error('Session could not be ended', error)` and opens Home (`returned: true`). The transaction rolled back, so the session is still paused and Resume shows it. If the session record is absent (its start write failed), `endSession` resolves `null` and Home opens. | yes | Same failure style as Home's reads (`src/ui/App.tsx:47-51`). Nothing is lost. | An error message on the Report screen |
| A-6 | History. `leave` steps back off the Table's history entry exactly as `goHome` does (`src/ui/App.tsx:77-82`). The `ending` and `report` screens add no entry, like Home and Game Config. Browser Back on the Report leaves the app. | yes | TASK-2.14 D-2: only opening the Table pushes an entry (`docs/ui/navigation.md`). | Push a Report entry so Back returns Home |
| A-7 | Report screen heading: `<h1>Session report</h1>`, focused on mount by `useHeadingFocus(true)` (`src/ui/useHeadingFocus.ts:7-16`). The header line is `<p class="report-header-line">`. Tiles are `<dl class="report-kpis">`, one `<div class="report-kpi" data-kpi="result|bb100|rebuys"><dt>label</dt><dd>value</dd></div>` each, in the order Result, BB/100, Rebuys. Colours follow the storyboard's dark panels. Values never rely on colour. | yes | Storyboard title "Session report" (`dreams/limit-holdem-trainer/storyboards/Report.dc.html`). Game Config's h1 is its own screen name (`src/ui/config/GameConfigScreen.tsx:180`). | h1 `TLH Trainer` plus an h2 (would avoid editing `e2e/next-hand.spec.ts`) |
| A-8 | The hands-played text in the header line is `1 hand` / `N hands`, as `resumeSummary` (`src/table/table-view.ts:75-79`). The header line reuses `GAME_LABEL` and the limits text rule of `limitsText` (`src/table/table-view.ts:62-68`) from the report's own `gameType` and `stake`. | yes | AC#8 "hands played 12" is read from this line until TASK-10.4 adds a tile. | A separate Hands tile now |
| A-9 | `endedAt` (session record and report) is the time `endSession` is called: `new Date()` after `tableWritesSettled()`. | yes | `updatedAt` already records the last hand's time. | The last hand's `completedAt` |

## 3. Current system
- React 19 + Vite + strict TS. `npm test` = `vitest run --coverage` with `environment: 'node'` (`vite.config.ts:7-8`).
  There is no jsdom, so UI acceptance tests use `renderToString` (`tests/ui/home-resume.acceptance.test.tsx:1-30`)
  and stateful flows are Playwright tests in Chromium and WebKit (`playwright.config.ts:13-15`). IndexedDB unit
  tests use `fake-indexeddb` (`tests/storage/hand-store.test.ts:1`). Coverage: `src/table/**` ≥ 90 % lines
  (`vite.config.ts:16-18`). `src/table` is headless (`tools/lint/headless-boundary.js:6-9`).
- Database: `tlh-trainer` v2. `hands` has keyPath `['sessionId','handNumber']` and `sessions` has keyPath
  `sessionId`. Upgrades append `if (event.oldVersion < N)` steps (`src/storage/hand-store.ts:4-21`). Transactions
  use `durability: 'strict'` and resolve on `oncomplete` (`hand-store.ts:38-46, 59-75`).
- Session record: `endedAt?: string | null` already exists. It is validated when present
  (`src/table/session-record.ts:57-58, 171-173`), and `findPausedSession` drops ended sessions
  (`session-record.ts:241-242, 266`). Nothing writes it yet (TASK-2.6 Q-1). `rebuys` is stored with the next
  completed hand (`session-record.ts:50`). A busted cash user is stored with `stack: 0`
  (`session-record.ts:28-30, 206-208`).
- Buy-in: `buyIn(stake) = 20 * stake.bigBet` (`src/table/session.ts:59-61`). `tableStake(config)`
  (`session.ts:136-138`).
- Leave table: `TableView` always renders it in the header, mid-hand too (`src/ui/table/Table.tsx:248-250`). The bust
  dialog's Leave table calls the same `onLeave` (`Table.tsx:334-336`, `BustDialog.tsx:34`). `App` passes
  `goHome` for both `onLeave` and `onHome` (`src/ui/App.tsx:76-82, 123-127`). `goHome` steps back off the Table
  history entry, clears `tableKey` and opens Home with `returned: true`.
- The session id lives only in `useTableSession` state (`src/ui/table/useTableSession.ts:164`). Every start put
  and hand write is chained into `tableWritesSettled()` (`useTableSession.ts:92-104, 178, 242`). A hand write
  waits for its grades and is not cancelled by unmount (`useTableSession.ts:230-242`).
- `HandStore` interface (`src/table/hand-record.ts:114-130`) is also implemented by the unlocked e2e records
  harness (`e2e/support/records-harness.tsx:48-62`). New methods therefore go on a separate `SessionEnder`
  interface. The harness needs no edit.
- e2e raw-DB helpers open `tlh-trainer` at version 2 (`e2e/support/hand-records.ts:10, 33, 58`). These calls
  throw `VersionError` once the app is at v3, so they move to v3 (not locked).
- Existing code to reuse:
  - `src/table/session.ts` → `buyIn`, `tableStake`, `MAX_SESSION_COUNT`, `GameType`, `Stake`.
  - `src/table/session-record.ts` → `parseSessionRecord` (validate the stored session before building).
  - `src/table/hand-record.ts` → `isWhole` for report validation.
  - `src/table/table-view.ts` → `GAME_LABEL` (export it) and the `limitsText` format rule.
  - `src/storage/hand-store.ts` → `opened`, `requested`, the strict-durability transaction pattern.
  - `src/ui/useHeadingFocus.ts` → focus the report heading.
  - `src/ui/table/useTableSession.ts` → `tableWritesSettled()`.
  - `e2e/support/hand-records.ts` → `readStore`, `seedStoredSessions`, `playToResult`; `e2e/support/paused-clock.ts`
    → `runUntil`, `axeWithPausedClock`; `e2e/support/table-harness-bundle.ts` → `stubReplayWords`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format. DB version 3 adds object store `reports` (keyPath `sessionId`, add-only, no indexes). The record shape is in §5. `endSession` writes the session's `endedAt` and adds the report in one strict transaction. For a 0-hand session it deletes the session record instead. | (a) Embed the report in the session record (the session record is replaced with `put`, so the report would not be write-once; REQ-052.5). (b) Store only the raw inputs and recompute at display (a formula change would change old reports). | Write-once by key (`add` → `ConstraintError`) gives AC#6 directly. One transaction means there is never an ended session without a report. | yes | user (Q-1) |
| D-2 | Mid-hand Leave table, until TASK-10.2 adds its dialog, ends the session at the last completed hand. The unfinished hand is dropped exactly as with the Home control (REQ-004.9). With 0 completed hands this deletes the session and opens Home. | Keep pause-to-Home mid-hand. AC#9 asks `onLeave` to end the session with no between-hands condition, and the pause path would need a "between hands" flag passed up. | One code path. TASK-10.2 inserts its dialog in front of it. Keeps the locked `e2e/table-display.spec.ts:195` and `e2e/players-choice.spec.ts:142` (Leave at Hand #1 → Home) passing unchanged. | yes | user (Q-2) |
| D-3 | The Report screen has one control in this slice: `<button type="button" class="report-home">Back to Home</button>` after the tiles. It calls `App`'s `onHome` for the report: `setScreen({ name: 'home', returned: true })` (Home re-reads the paused session and focuses its h1). The report is already stored, so leaving changes nothing. TASK-11.6 adds View statistics next to it. | No controls until TASK-11.6 | Without a control the user can only reload or press browser Back, which leaves the app. | yes | user (Q-3) |
| D-4 | Locked tests the build must edit (owner in brackets). Each edit replaces only the pause-to-Home expectation that AC#1/AC#2/AC#9 replace: (1) `e2e/rebuy.spec.ts` [TASK-3.11] test `Leave table in the bust dialog deals nothing more and Resume reopens the dialog` becomes SPEC-08's test. (2) `e2e/bust-continue.spec.ts` [TASK-9.2] test `Leave table from the dialog opened by Continue deals nothing more` becomes SPEC-08's second test. (3) `e2e/resume.spec.ts:199` [TASK-2.6]: click the `Home` button instead of `Leave table` (the test checks the paused subtitle). (4) `e2e/next-hand.spec.ts` [TASK-3.4] `leaving during the result deals no further hand`: expect the `Session report` h1 focused instead of `TLH Trainer`. The draw-count and no-table checks stay. (5) `e2e/home-control.spec.ts:113` [TASK-2.14]: store names become `['hands', 'reports', 'sessions']`. | Avoid (4) with an h1 `TLH Trainer` on the report (A-7 alternative) | Each of these tests asserts the old interim behaviour this story replaces, or the v2 store list. Checked and unchanged: `e2e/table-display.spec.ts:195` and `e2e/players-choice.spec.ts:142` (Leave at Hand #1 = 0 hands → Home, focused h1 `TLH Trainer`), `e2e/hand-records.spec.ts:144,236` (only hand counts), `e2e/table.spec.ts:19` (button-name list unchanged), `e2e/history.spec.ts` (no Leave), `tests/ui/table-home.acceptance.test.tsx` (header markup unchanged), and the `tests/storage/*.acceptance.test.ts` (use `DB_VERSION + 1`, not a literal). Unlocked edits: `tests/storage/hand-store.test.ts:44-49` (`DB_VERSION` 3, `REPORTS_STORE`) and `e2e/support/hand-records.ts` (open v3 and create `reports`). | yes (locked edits) | user (qa.md, locked edits) |

## 5. Design

### Files to create / modify
- `src/table/session-report.ts` — new. `SessionReport`, `CashResult`, `SessionEnder`, `sessionReport`,
  `bbPer100`, `parseSessionReport`, `signedDollars`, `signedTenths`, `reportView`.
- `src/table/table-view.ts` — export `GAME_LABEL` (no behaviour change).
- `src/storage/hand-store.ts` — `DB_VERSION = 3`, `REPORTS_STORE = 'reports'`, upgrade step `oldVersion < 3`.
  `openHandStore` returns `HandStore & SessionEnder` with `endSession` and `getReport`. Same for `sharedHandStore`.
- `src/ui/report/ReportScreen.tsx` — new. Renders `reportView(report)` and the `Back to Home` button (`onHome` prop).
- `src/ui/App.tsx` — `ending` and `report` screens, the `leave(sessionId)` handler and `onLeave={leave}`.
- `src/ui/table/TableScreen.tsx` — `onLeave?: (sessionId: string) => void`.
- `src/ui/table/Table.tsx` — `TableProps.onLeave?: (sessionId: string) => void`. `TableView` gets
  `onLeave={() => onLeave(sessionId)}`. `TableView`'s own prop type and markup are unchanged.
- `src/ui/table/useTableSession.ts` — also return `sessionId`.
- `src/ui/styles.css` — `.report-screen`, `.report-header-line`, `.report-kpis`, `.report-kpi`, `.report-home`.
- `tests/table/session-report.acceptance.test.ts` — new (SPEC-01, SPEC-02, SPEC-06).
- `tests/storage/session-end.acceptance.test.ts` — new (SPEC-03, SPEC-04, SPEC-12).
- `tests/ui/report-screen.acceptance.test.tsx` — new (SPEC-05).
- `e2e/session-report.spec.ts` — new (SPEC-07, SPEC-09, SPEC-10, SPEC-11, SPEC-14).
- `e2e/rebuy.spec.ts`, `e2e/bust-continue.spec.ts` — locked, edited (SPEC-08; D-4 (1), (2)).
- `e2e/resume.spec.ts`, `e2e/next-hand.spec.ts`, `e2e/home-control.spec.ts` — locked, edited (D-4 (3)–(5)).
- `e2e/support/hand-records.ts` — open at v3, create `reports` in the upgrade, add `storedReports(page)`.
- `tests/storage/hand-store.test.ts` — `DB_VERSION` 3 and `REPORTS_STORE`.
- `docs/storage/reports.md` — new: store, fields, rules, tests.
- `docs/storage/sessions.md` — DB v3, `endedAt` now written by `endSession`. Replace "Leave table still just
  goes Home" (line 137) and the Leave text at line 148.
- `docs/ui/navigation.md` — the Report screen row. Leave table ends the session (no longer "does the same for
  now"). The bust-dialog paragraph.

### Components, interfaces and data
```ts
// src/table/session-report.ts (headless)
export interface CashResult {
  readonly buyIn: number;      // 20 × big bet of the stake
  readonly rebuys: number;     // session.rebuys
  readonly finalStack: number; // the user seat's stored stack (0 after a bust)
  readonly result: number;     // finalStack − buyIn × (1 + rebuys), dollars
  readonly bbPer100: number;   // tenths / 10 (one decimal), never -0
}
/** One ended session's report as stored in `reports` (REQ-044.7). Written once, never modified (REQ-052.5). */
export interface SessionReport {
  readonly sessionId: string;   // 32 lowercase hex; the key
  readonly startedAt: string;   // ISO-8601 UTC, the session's startedAt
  readonly endedAt: string;     // ISO-8601 UTC, equal to the session record's endedAt
  readonly gameType: GameType;
  readonly players: number;     // config.players
  readonly stake: Stake;        // tableStake(config): { smallBet, bigBet }
  readonly handsPlayed: number; // ≥ 1
  readonly cash: CashResult | null; // null iff sit-and-go (A-3)
}
export interface SessionEnder {
  /** Ends the stored session in one strict transaction over `sessions` and `reports`. Absent → resolves null,
   *  writes nothing. handsPlayed 0 → deletes the session record, resolves null. Otherwise puts the stored
   *  value with `endedAt`, adds sessionReport(...) and resolves that report once complete. Rejects (nothing
   *  changed) if the stored session fails parseSessionRecord (RangeError) or a report for the id exists
   *  (DOMException 'ConstraintError'). */
  endSession(sessionId: string, endedAt: Date): Promise<SessionReport | null>;
  /** parseSessionReport of the stored value, or null if absent. */
  getReport(sessionId: string): Promise<SessionReport | null>;
}
export function sessionReport(session: SessionRecord, endedAt: Date): SessionReport; // RangeError if handsPlayed === 0 or bad Date
export function bbPer100(result: number, bigBet: number, hands: number): number;
export function parseSessionReport(value: unknown): SessionReport; // RangeError('Invalid session report: <field>')
export function signedDollars(amount: number): string; // '+$46' | '-$40' | '$0'
export function signedTenths(value: number): string;   // '+2.7' | '-5.0' | '0.0'
export interface ReportView { readonly header: string; readonly tiles: readonly { key: 'result' | 'bb100' | 'rebuys'; label: string; value: string }[] }
export function reportView(report: SessionReport): ReportView;
```
- `endSession` implementation: one `transaction([SESSIONS_STORE, REPORTS_STORE], 'readwrite', { durability:
  'strict' })`. `get(sessionId)`. In its `onsuccess`: if undefined → nothing. Else `parseSessionRecord` (on throw:
  remember the error and `transaction.abort()`). If `handsPlayed === 0` → `sessions.delete(sessionId)`. Else
  `sessions.put({ ...storedValue, endedAt: endedAt.toISOString() })` and `reports.add(report)`. Resolve on
  `oncomplete`. On `onerror`/`onabort`, reject with the parse error, else the failing request's error (e.g.
  `ConstraintError`), else the transaction's error. Everything stays in request callbacks, with no `await`
  inside the transaction.
- `parseSessionReport` checks: object; `sessionId` hex-32; `startedAt`/`endedAt` round-trip ISO; `gameType` in
  `cash|sit-and-go`; `players` whole 2..10; `stake.smallBet`/`bigBet` whole ≥ 1 with `bigBet = 2 × smallBet`;
  `handsPlayed` whole 1..`MAX_SESSION_COUNT`. `cash` is null iff sit-and-go. Otherwise `buyIn`, `rebuys` (0..MAX),
  `finalStack` are whole ≥ 0, `result === finalStack − buyIn × (1 + rebuys)`, and `bbPer100 === bbPer100(result,
  stake.bigBet, handsPlayed)`. Returns the value typed, not copied (as `parseSessionRecord`).
- `App`: `Screen` gains `{ name: 'ending' }` and `{ name: 'report'; report: SessionReport }`.
  `leave(sessionId)`: if `tableKey.current === null` return. Step back off the Table entry as `goHome` does, then
  `tableKey.current = null`, `setPaused(undefined)` and `setScreen({ name: 'ending' })`. Then
  `tableWritesSettled().then(() => sharedHandStore().endSession(sessionId, new Date()))`. Resolved with a report
  → `setScreen({ name: 'report', report })`. With null → `setScreen({ name: 'home', returned: true })`. Rejected
  → A-5. The Home control (`onHome={goHome}`) is unchanged. No effect sets state, so
  `react-hooks/set-state-in-effect` is not involved.
- `ReportScreen({ report })` (A-7):
  ```html
  <main class="screen report-screen">
    <header class="report-header"><h1>Session report</h1><p class="report-header-line">Cash · 6 players · $4/$8 · 214 hands</p></header>
    <dl class="report-kpis" aria-label="Result">  <!-- only when tiles is non-empty -->
      <div class="report-kpi" data-kpi="result"><dt>Result</dt><dd>+$46</dd></div>
      <div class="report-kpi" data-kpi="bb100"><dt>BB/100</dt><dd>+2.7</dd></div>
      <div class="report-kpi" data-kpi="rebuys"><dt>Rebuys</dt><dd>1</dd></div>
    </dl>
    <button type="button" class="report-home">Back to Home</button>
  </main>
  ```

### Rules and algorithms
- `buyIn = 20 × stake.bigBet`. `result = finalStack − buyIn × (1 + rebuys)`. Rebuys bought during an unfinished
  hand are not stored yet (`session-record.ts:50`), so neither the rebuy nor its chips count. The result stays
  consistent.
- `bbPer100` uses integers only, rounding half away from zero:
  `d = bigBet × hands`, `tenths = sign(result) × floor((2000 × |result| + d) / (2 × d))`, value `tenths / 10`,
  and `0` (not `-0`) when `tenths === 0`. Display: `signedTenths(v)` = `'+'`/`'-'` + `Math.abs(v).toFixed(1)`,
  or `'0.0'` for 0.
- Worked examples (all at $4/$8 unless stated; buy-in $160):

  | hands | rebuys | final stack | result | tenths calc | Result | BB/100 | Rebuys |
  |---|---|---|---|---|---|---|---|
  | 214 | 1 | 366 | 366 − 320 = 46 | floor(93712 / 3424) = 27 | `+$46` | `+2.7` | `1` |
  | 100 | 0 | 120 | 120 − 160 = −40 | floor(80800 / 1600) = 50 | `-$40` | `-5.0` | `0` |
  | 13 | 0 | 0 | −160 | floor(320104 / 208) = 1538 | `-$160` | `-153.8` | `0` |
  | 1 | 0 | 160 | 0 | 0 | `$0` | `0.0` | `0` |
  | 100 at $2/$4 (buy-in 80) | 0 | 81 | 1 | floor(2400 / 800) = 3 (0.25 → 0.3) | `+$1` | `+0.3` | `0` |
  | 100 at $2/$4 | 0 | 79 | −1 | −3 | `-$1` | `-0.3` | `0` |
  | 10000 at $10/$20 (buy-in 400) | 0 | 401 | 1 | floor(202000 / 400000) = 0 | `+$1` | `0.0` | `0` |
- Header line: `${GAME_LABEL[gameType]} · ${players} players · ${limits} · ${hands}`. `limits` is
  `$s/$b` for cash and `s/b` for sit-and-go. `hands` is `1 hand` / `N hands`.
- Tiles: cash → `[Result, BB/100, Rebuys]`; sit-and-go → `[]`.

### Error handling and configuration
- `sessionReport`: `RangeError('Invalid session report: handsPlayed')` for 0 hands and
  `RangeError('Invalid session report: endedAt')` for an invalid Date.
- `endSession` rejections are listed in the interface. `App` logs `Session could not be ended` (A-5).
- Upgrade: an existing v2 database gets `reports` added. `hands` and `sessions` and their records are untouched
  (the same append-only rule, `hand-store.ts:17`).

## 6. Behaviour specification

### SPEC-01: Cash result, BB/100 and rebuys from the stored session
- Verifies: AC#3, AC#4, DoD#1
- Behaviour: Given $4/$8 session records built with `sessionRecord` and adjusted to (handsPlayed 214, rebuys 1,
  user stack 366) and (100, 0, 120), When `sessionReport(session, endedAt)` and `reportView(...)` run, Then `cash`
  is `{ buyIn: 160, rebuys: 1, finalStack: 366, result: 46, bbPer100: 2.7 }` and `{ buyIn: 160, rebuys: 0,
  finalStack: 120, result: -40, bbPer100: -5 }`. The tiles read `Result +$46 · BB/100 +2.7 · Rebuys 1` and
  `Result -$40 · BB/100 -5.0 · Rebuys 0`. The header reads `Cash · 6 players · $4/$8 · 214 hands` /
  `… · 100 hands`. Every row of the worked-example table gives exactly its listed values.
- Verification: acceptance `tests/table/session-report.acceptance.test.ts::AC#3/AC#4 cash result, BB/100 and rebuys from the stored session`

### SPEC-02: Rounding, zero and sign edges; sit-and-go has no cash result
- Verifies: AC#3, AC#4, DoD#1, DoD#4
- Behaviour: Given the last four worked-example rows, Then `bbPer100` returns 0.3, -0.3 and 0 (`Object.is(v, 0)`
  is true, never -0), and `signedDollars(0)` is `$0`. Given a 1-hand sit-and-go session, When `sessionReport`
  runs, Then `cash` is null, the header reads `Sit-and-go · 6 players · 20/40 · 1 hand` and the tiles are `[]`.
  Given handsPlayed 0, Then `sessionReport` throws `RangeError('Invalid session report: handsPlayed')`.
- Verification: unit `tests/table/session-report.acceptance.test.ts::rounding, zero, sit-and-go and 0-hand edges`

### SPEC-03: Ending saves the report and endedAt; a relaunch reads the same values and no paused session
- Verifies: AC#5, AC#7, DoD#1
- Behaviour: Given a fake-indexeddb store holding the session after 3 hands written by `handWrite` + `add`, When
  `endSession(id, T)` runs, Then it resolves the report, and a fresh `openHandStore(sameFactory)` (relaunch)
  returns `getReport(id)` deep-equal to it. `getSession(id).endedAt === T.toISOString()` and
  `pausedSession().session` is null. The hands store still holds 3 records. Given a stored start record
  (handsPlayed 0), When `endSession` runs, Then it resolves null, `getSession` is null, `getReport` is null and
  the reports store is empty.
- Verification: acceptance `tests/storage/session-end.acceptance.test.ts::AC#5/AC#7 ending saves the report, relaunch reads it, 0 hands stores nothing`

### SPEC-04: A stored report is write-once
- Verifies: AC#6, DoD#1
- Behaviour: Given session A ended (report RA, its JSON captured), When session B is played (records + session
  writes) and ended, and then `endSession(A, later)` is called again, Then the second call rejects with `name
  'ConstraintError'`. `JSON.stringify(getReport(A))` equals the captured JSON, A's stored session (including
  `endedAt`) is unchanged, and B's report exists.
- Verification: acceptance `tests/storage/session-end.acceptance.test.ts::AC#6 a stored report is never rewritten and a second write is rejected`

### SPEC-05: Report screen markup
- Verifies: AC#3, AC#4, AC#8, DoD#7
- Behaviour: Given the AC#3 and AC#4 reports, When `ReportScreen` is rendered with `renderToString`, Then it has
  exactly one `<h1>Session report</h1>`, the header line `Cash · 6 players · $4/$8 · 214 hands`, and the
  `data-kpi` tiles in order `result`, `bb100`, `rebuys` with `<dt>`/`<dd>` text `Result`/`+$46`,
  `BB/100`/`+2.7`, `Rebuys`/`1` (and `-$40`, `-5.0`, `0`). A 12-hand report's line ends `· 12 hands`. A
  sit-and-go report renders no `<dl>`. The only `<button>` is `Back to Home` (Q-3), after the tiles.
- Verification: acceptance `tests/ui/report-screen.acceptance.test.tsx::Session report screen shows the header line and cash tiles`

### SPEC-06: Stored reports are validated when read
- Verifies: AC#5, DoD#4
- Behaviour: Given a valid report, `parseSessionReport` returns it unchanged. Given copies with a bad
  `sessionId`, `endedAt: 'yesterday'`, `handsPlayed: 0`, `cash: null` on cash, a `result` that does not equal
  `finalStack − buyIn × (1 + rebuys)`, or a `bbPer100` off by 0.1, Then it throws
  `RangeError('Invalid session report: <field>')` naming that field.
- Verification: unit `tests/table/session-report.acceptance.test.ts::parseSessionReport rejects invalid stored reports`

### SPEC-07: Leave table between hands ends the session and opens its report (live app)
- Verifies: AC#1, AC#5, AC#9, DoD#7, DoD#8
- Behaviour: Given a paused clock, pinned replay words and Start game with the defaults ($4/$8, 6 players), When
  the user plays hand 1 to its result (`playToResult`) and chooses `Leave table` in the header while `Hand over`
  shows, Then the h1 `Session report` is visible and focused and the table section is gone. The header line is
  `Cash · 6 players · $4/$8 · 1 hand`. The Result tile equals `signedDollars(stack − 160)`, where `stack` is the
  user's stored stack. BB/100 is the matching `signedTenths` and Rebuys is `0`. After `page.clock.runFor(5000)`
  the hands store holds only hand 1 and no `Hand #2` header ever shows. The single stored session has
  `handsPlayed 1` and an ISO `endedAt`. The reports store holds one report deep-equal to
  `sessionReport(storedSession, endedAt)`. After `page.reload()`, the stored report's JSON is unchanged, the
  session still has `endedAt`, and Home shows no `Resume session` (`data-paused` is not `shown`). axe reports no
  serious or critical violations on the report. Every request is same-origin.
- Verification: acceptance `e2e/session-report.spec.ts::Leave table between hands ends the session and opens its saved report`

### SPEC-08: Leave table in the bust dialog opens the report
- Verifies: AC#2, DoD#7
- Behaviour: Given `e2e/rebuy.spec.ts`'s A-6 seed (12 hands, user on $4) resumed and busted at hand 13, When
  the user chooses `Leave table` in the `Out of chips` dialog, Then the dialog closes and the `Session report`
  h1 is focused. The line reads `Cash · 6 players · $4/$8 · 13 hands` and the tiles read Result `-$160`, BB/100
  `-153.8` and Rebuys `0`. After `runFor(5000)` the hands store is `[13]`, the session has `endedAt` and
  `handsPlayed 13`, and one report is stored. In `e2e/bust-continue.spec.ts` (A-5 seed, Continue first, then
  Leave table in the dialog), the same holds with the same values.
- Verification: acceptance `e2e/rebuy.spec.ts::Leave table in the bust dialog ends the session and opens its Session Report` and `e2e/bust-continue.spec.ts::Leave table from the dialog opened by Continue opens the Session Report`

### SPEC-09: Leave table with the Hand Review open after hand 12
- Verifies: AC#8, DoD#7
- Behaviour: Given a stored session with 11 hands played (built like `e2e/bust-continue.spec.ts`'s A-5 seed with
  `handNumber: 12`) resumed with its pinned words, When hand 12 is played with check/call to its result and the
  Hand Review panel (`complementary`) is open, and the user chooses `Leave table` in the header, Then no dialog
  is shown (`getByRole('dialog')` has count 0 after the report heading is visible). The report line reads
  `Cash · 6 players · $4/$8 · 12 hands`. After `runFor(5000)` no `Hand #13` header has appeared, the stored
  session has `handsPlayed 12` and `endedAt`, and the hands store is `[12]`.
- Verification: acceptance `e2e/session-report.spec.ts::Leave table with the Hand Review open after hand 12 shows 12 hands`

### SPEC-10: A seeded long session shows the AC#3 and AC#4 values end to end
- Verifies: AC#3, AC#4, DoD#7
- Behaviour: Given a seeded stored session (`sessionRecord` from `seatSession(DEFAULT_SESSION_CONFIG)` with
  handsPlayed 214, rebuys 1, user stack 366), When it is resumed and the user chooses `Leave table` during hand
  215 (D-2), Then the report reads `Cash · 6 players · $4/$8 · 214 hands`, `+$46`, `+2.7`, `1`. The same holds
  for (100, 0, $120) → `-$40`, `-5.0`, `0`. Hand 215/101 is not stored.
- Verification: acceptance `e2e/session-report.spec.ts::a seeded session shows Result, BB/100 and rebuys from its stored values`

### SPEC-11: A 0-hand session ends without a report and is not stored (live app)
- Verifies: AC#7, DoD#7
- Behaviour: Given Start game, then `page.reload()` during hand 1 (the app closed), and Home showing `Resume
  session` with `Cash · 6 players · $4/$8 · 0 hands · paused`, When the user resumes and chooses `Leave table`
  during hand 1, Then Home opens with its h1 `TLH Trainer` focused. No `Session report` heading appears, and
  Home has no `Resume session`. The sessions, reports and hands stores are all empty.
- Verification: acceptance `e2e/session-report.spec.ts::a session with 0 completed hands ends without a report and is not stored`

### SPEC-12: Upgrading a v2 database keeps every record
- Verifies: AC#5, DoD#1
- Behaviour: Given a fake-indexeddb database created at v2 (`hands` and `sessions` with one record each), When
  `openHandStore(factory)` opens it, Then `DB_VERSION` is 3, the store names are `hands`, `reports` and
  `sessions`, and both old records read back byte-identical. `endSession` works on the old session.
- Verification: unit `tests/storage/session-end.acceptance.test.ts::a v2 database upgrades to v3 with its records intact`

### SPEC-13: Checks, boundaries and documentation
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Lint, typecheck and the full unit suite pass. The golden suite passes 100 %. Coverage holds
  (`src/table/session-report.ts` is covered by SPEC-01/02/06). `src/table/session-report.ts` imports nothing
  from `src/ui` or browser APIs. No engine, bot or advice source changes; the 10,000-hand playtest reports 0
  violations. No strategy content (DoD#9 N/A). No service worker exists yet (DoD#12 N/A). CI is green on the
  branch. `docs/storage/reports.md`, `docs/storage/sessions.md` and `docs/ui/navigation.md` describe the
  behaviour and are published to Backlog.md.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/ && npm run -s playtest -- --hands 10000 --seed 42 && npx playwright test`

### SPEC-14: Back to Home from the report
- Verifies: AC#5, DoD#7
- Behaviour: Given the report shown after SPEC-07's Leave table, When the user chooses `Back to Home`, Then Home
  opens with its h1 `TLH Trainer` focused, there is no `Resume session` for the ended session, and the stored
  report and session JSON are unchanged.
- Verification: acceptance `e2e/session-report.spec.ts::Back to Home from the report opens Home without Resume`

## 7. Edge cases
- 0 completed hands (new session left in hand 1, or a resumed 0-hand session): SPEC-03, SPEC-11.
- Hand write still running when Leave is chosen (result showing, grades pending): `leave` awaits
  `tableWritesSettled()` (SPEC-07, SPEC-09).
- Bust ($0 stack): SPEC-08. Rebuy then Leave mid-hand: the rebuy is not stored, so it is not counted (§5 rules).
- Mid-hand Leave (before TASK-10.2): D-2 (Q-2) / SPEC-10, SPEC-11.
- Double click on Leave table / browser Back while ending: A-4, A-6 (no second `endSession`; popstate ignored as
  `tableKey` is null).
- Second end of the same session id: SPEC-04. Corrupt stored session: `endSession` rejects, nothing changes,
  and Home opens (A-5). Absent session: null → Home (A-5).
- Rounding half / tiny / zero: SPEC-02. Existing v2 database: SPEC-12.
- Sit-and-go: SPEC-02 (A-3).
- Concurrency across tabs: N/A. The app is single-tab, and `onversionchange` closes old connections
  (`hand-store.ts:24`).

## 8. Security considerations
- Trust boundary: stored IndexedDB values are untrusted. `endSession` runs `parseSessionRecord` before
  building. `getReport` runs `parseSessionReport`.
- No authn/authz, no secrets, no injection surface (React escapes text). No new dependencies. No randomness. No
  network: everything stays on the device (DoD#8, SPEC-07 request check).

## 9. Non-functional
- The report opens within one IndexedDB transaction after the last hand write settles. There is no extra
  timing target in this slice (the REQ-062 screen-time stories carry those). No new slow tests: every new test
  runs in seconds in the normal suite.
- Accessibility: the focused h1 on open, the `<dl>` term/value pairs, and axe clean in Chromium and WebKit
  (SPEC-07).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Start game, play a hand, choose Leave table, and read the Session report.
- New tests (path → SPEC ids):
  - `tests/table/session-report.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-06
  - `tests/storage/session-end.acceptance.test.ts` → SPEC-03, SPEC-04, SPEC-12
  - `tests/ui/report-screen.acceptance.test.tsx` → SPEC-05
  - `e2e/session-report.spec.ts` → SPEC-07, SPEC-09, SPEC-10, SPEC-11, SPEC-14
  - `e2e/rebuy.spec.ts`, `e2e/bust-continue.spec.ts` (edited locked tests) → SPEC-08
- Locked tests the build must edit: D-4 (1)–(5), owners TASK-3.11, TASK-9.2, TASK-2.6, TASK-3.4, TASK-2.14.
- End-to-end for the Judge: `npx playwright test e2e/session-report.spec.ts e2e/rebuy.spec.ts e2e/bust-continue.spec.ts e2e/next-hand.spec.ts e2e/resume.spec.ts e2e/home-control.spec.ts e2e/table-display.spec.ts e2e/players-choice.spec.ts e2e/hand-records.spec.ts`.
  Then manually: `npm run dev`, play 3 hands, choose Leave table, and check the report line and tiles. Reload:
  Home has no Resume. Start a game and choose Leave table during hand 1: Home, no Resume.

## 11. Open questions
- None. Q-1..Q-3 answered in `doit/TASK-10.1/qa.md` (recommended options).

## 12. Clarifications log
See `doit/TASK-10.1/qa.md`.
