# Spec: TASK-2.6 — Resume a paused session from Home

Status: READY (approved 2026-11-24)
Task: TASK-2.6 · Parent/epic: TASK-2 · Requirements: REQ-002 (REQ-002.4, REQ-002.5), REQ-004 (REQ-004.2, REQ-004.3, REQ-004.6) · Dream: limit-holdem-trainer

## 1. Summary
Home gains a Resume session entry that appears only while a paused session is stored. It shows that session's
game type, table size, stake and hands played. Choosing it opens the Table on the stored session (TASK-3.10's
`restoreSession`), under the same session id, and deals the next hand with the stacks as they were at the end of
the last completed hand. The hand that was in progress when the app closed is never counted. Stored data stays
untrusted: invalid or out-of-range records are rejected with a RangeError and Home keeps working.

## 2. Scope
- In scope:
  - `src/table/session-record.ts` (headless): an optional `endedAt` field in `SessionRecord` that this story reads
    but never writes (D-1). A cap on `handsPlayed` and `nextBotId` (AC#8). `findPausedSession(values)`, which picks
    the paused session from the raw stored values.
  - `src/table/table-view.ts`: `resumeSummary(record)`, the entry's subtitle text.
  - `src/table/hand-record.ts` and `src/storage/hand-store.ts`: `HandStore.pausedSession()`, which reads the
    `sessions` store with `getAll` and validates every value.
  - `src/ui/home/HomeScreen.tsx` and `src/ui/styles.css`: the Resume session entry, styled as the storyboard's
    secondary menu item.
  - `src/ui/App.tsx`: loads the paused session for Home and opens the Table with a resumed session on Resume.
  - `src/ui/table/TableScreen.tsx` and `src/ui/table/useTableSession.ts`: a `resume` option. The table starts
    from the restored state and keeps the stored session id and start time. No start record is written.
  - Tests: headless Vitest acceptance tests (some using `fake-indexeddb`), one Home render test, and one every-push
    Playwright spec that runs in Chromium and WebKit with axe.
  - Support: `tests/support/session-play.ts` (new, headless helpers to play hands), `e2e/support/hand-records.ts`
    (seeds session records), and `e2e/support/records-harness.tsx` (its store wrapper forwards `pausedSession`).
  - `docs/storage/sessions.md`: `endedAt`, the counter cap, the paused-session rule and the Resume flow.
- Not doing:
  - Ending a session. No code writes `endedAt` (E10, TASK-10.1). Leave table keeps its interim behaviour: it goes
    Home and the session stays paused (D-1).
  - No Table-header Home control (TASK-2.14). No confirm dialog before New game while a session is paused
    (TASK-2.7). No Session Report, and no discarding of 0-hand sessions (E10).
  - No sit-and-go level on the entry (TASK-5.6) and no level restore (E05-S03). The level is 1 everywhere today.
  - No index on `sessions`, no database version bump, no migration.
  - No change to the engine, bots, advice or stats code.
  - No user-facing error message when a stored session is rejected. It is logged with `console.error` and the
    entry is not shown (TASK-13.x owns error UX).
  - No Statistics or Settings entries on Home.
- Scope budget: files=17, lines=1300

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The paused session is the valid, not-ended stored session with the latest `updatedAt`. Ties go to the latest `startedAt`, then the greatest `sessionId`. Older not-ended sessions are ignored. Today nothing ends a session, so every Start game leaves one behind; TASK-2.7 enforces REQ-004.1 (at most one). | yes | It is the session the user played last, which is what "resume" means. It needs no index and no new write. | Mark older sessions ended now (that would be writing E10's ended state without a report). |
| A-2 | Each stored value is parsed on its own. An invalid one is skipped and logged with `console.error('Session record could not be read', error)`, so one corrupt record cannot hide a valid paused session or break Home. | yes | AC#7 says "Home stays usable". `getAll` returns every session, including corrupt ones. | Reject the whole read on the first invalid record. |
| A-3 | The counter cap is `MAX_SESSION_COUNT = 1_000_000_000`. `handsPlayed` and `nextBotId` above it give `RangeError('Invalid session record: handsPlayed')` or `('…: nextBotId')`. `nextBotName` and `rebuys` keep their current bounds. | yes | At one hand per second, 10^9 hands is about 31 years. `handsPlayed + 1` and every later bot id stay far below `MAX_SAFE_INTEGER`. The AC names only these two fields. | `2**31 - 1`; `MAX_SAFE_INTEGER - 1` (the bare minimum). |
| A-4 | Home first renders without the entry and adds it once the read settles. The menu `<nav>` has `data-paused="loading" \| "none" \| "shown"`, so tests can wait before asserting absence. If the read itself fails (for example VersionError), Home logs `console.error('Paused session could not be read', error)` and shows `none`. | yes | IndexedDB is async. The existing SSR tests render Home with no store. | Block Home until the read settles. |
| A-5 | Resume calls `restoreSession(record)` in App's click handler. If it throws, App logs `console.error('Session could not be resumed', error)`, stays on Home and hides the entry. | yes | The Table never mounts with an invalid state (AC#7). | Validate only at Home load. |
| A-6 | A resumed table writes no start record. The stored record is already the state ready for the next hand, and rewriting it would move `updatedAt` back to `startedAt`. Each later hand is written by the existing `handWrite` + `add(record, session)` path under the stored `sessionId` and `startedAt`. | yes | TASK-3.10 D-2/D-3. | Re-put the record at mount with `updatedAt` = now. |
| A-7 | AC#3's "10 hands, closed in hand 11" runs exactly in the headless acceptance test (fake-indexeddb, a new store over the same factory as the "relaunch"). The every-push browser spec plays 2 hands, reloads in the middle of hand 3 and resumes, the same way as TASK-3.10 A-7. The 25-hand and 132-hand Home cases are seeded records. | yes | 10 real browser hands per browser would add about 40 s to every push (CI budget is about 4 min). The rule is the same at any hand count. | An opt-in 10-hand browser spec. |
| A-8 | AC#4's "hand count 25" shows on the resumed table as the header `Cash · 9 players · $10/$20 · Hand #26` (hand 26 is next after 25 completed, `headerText`, `src/table/table-view.ts:63-67`) and as `restoreSession(...).handNumber - 1 === 25`. Line-up name and speed are not shown on the Table today, so they are checked on the restored state (`config.lineUp === 'Custom'`, `config.speed`). | yes | The Table has no hands-played or line-up display. | Add a hands-played or line-up display (out of scope). |
| A-9 | A 0-hand paused session (closed during hand 1) is shown as "0 hands" and resumes at hand 1 under the same id. | yes | TASK-10.1 AC#7 treats such a session as paused until it is ended. | Hide 0-hand sessions. |

## 3. Current system
- Toolchain: strict TypeScript 6, React 19, Vite 8, Vitest 5 (node environment, v8 coverage; table code must stay
  at or above 90% lines, `vite.config.ts:11-19`), Playwright 1.65 with Chromium and WebKit, and axe
  (`package.json:12-31`). `fake-indexeddb` is already a dev dependency.
- Headless boundary: `src/table/**` imports no UI or browser code (`tools/lint/headless-boundary.js`). IndexedDB
  lives only in `src/storage`.
- Session records (TASK-3.10, `docs/storage/sessions.md`): the `sessions` store has key `sessionId` and holds one
  record per session (`src/storage/hand-store.ts:18-20`). The `SessionRecord` type is at
  `src/table/session-record.ts:33-54`. `parseSessionRecord` ignores unknown properties except `hand`/`actions`
  (`:148-195`), bounds `handsPlayed` only at ≥ 0 and `nextBotId` only at ≥ 1 (`:159-162`), and checks seat
  kinds, styles and names (`:171-191`) after `assertSessionConfig` (`src/table/session.ts:270-328`), so unknown
  kinds, styles and missing names already throw RangeError. `restoreSession` returns the `TableState` ready for
  hand `handsPlayed + 1`, with `button` = the stored next-hand button (`:199-219`). The stored button is already
  the seat after the last hand's button (`nextHand`, `src/table/session.ts:513-514`).
- Nothing marks a session ended yet: no field exists, and Leave table calls `onLeave` → Home
  (`src/ui/App.tsx:31-36`, `src/ui/table/Table.tsx:162-164`). No store method lists sessions (`HandStore`,
  `src/table/hand-record.ts:69-83`).
- `useTableSession` seats from `config` (`src/ui/table/useTableSession.ts:80`), draws a new `sessionId` and
  `startedAt` per mount (`:82-83`), puts the start record once (`:84-94`), and writes each hand with `handWrite` +
  `store.add(record, session)` (`:133-150`). `Table` passes every `TableSessionOptions` field through
  (`src/ui/table/Table.tsx:216-237`).
- Home: `HomeScreen` renders one New game button inside `<nav aria-label="Main menu" className="home-menu">`
  with `.menu-title`/`.menu-subtitle` spans (`src/ui/home/HomeScreen.tsx:21-26`, `src/ui/styles.css:55-82`). The
  storyboard puts Resume session second, with the subtitle `Cash · 6 players · $4/$8 · 132 hands · paused`, a
  `#1A1D22` background, `#F2F3F5` text, a `1px solid #343A43` border, an 18px title and a `#A7AEB8` 14px subtitle
  (`dreams/limit-holdem-trainer/storyboards/Home.dc.html:34-37`).
- Locked tests that must keep passing: `tests/ui/home.acceptance.test.tsx:12-30` renders
  `<HomeScreen onNewGame/>` and expects exactly one button and no "Resume session", so the new props must be
  optional and absent by default. `tests/unit/app.test.tsx` renders `App` with `renderToString`, where effects do
  not run, so the read must happen in an effect. `e2e/session-records.spec.ts:59-63` expects the stored session to be
  unchanged after a reload, so Home must only read. Several e2e specs go Leave table → Home → New game
  (`e2e/players-choice.spec.ts:142-144`, `e2e/home.spec.ts:49` uses `/^New game/`). A Resume button next to New
  game does not change those locators.
- Header format: `headerText` gives `Cash · 6 players · $4/$8 · Hand #11`, with sit-and-go limits as plain chips
  (`src/table/table-view.ts:60-67`).
- Existing code to reuse:
  - `parseSessionRecord`, `restoreSession`, `handWrite`, `sessionRecord` (`src/table/session-record.ts`) → all
    validation and restore. Do not re-validate by hand.
  - `isWhole` (`src/table/hand-record.ts:102`) → the counter cap.
  - `GAME_LABEL`, `tableStake` and the limits formatting in `headerText` (`src/table/table-view.ts:60-67`) →
    `resumeSummary`. Extract a shared `limitsText(config)` instead of copying it.
  - `requested` (`src/storage/hand-store.ts:31-36`) → `getAll` in `pausedSession`.
  - `styleCounts`, `styleStats` (`src/stats/style-stats.ts:89,108`) → AC#5, as in
    `tests/storage/hand-records.acceptance.test.ts:138`.
  - `checkOrCall` / `playHand` (`tests/storage/session-records.acceptance.test.ts:37-57`) → re-create in
    `tests/support/session-play.ts` without vitest imports (throw on failure), so the new tests and e2e seeding
    share them. The TASK-3.10 file is locked and stays unchanged.
  - `readStore`, `storedSessions`, `advanceToHand`, `playToResult`, `header` (`e2e/support/hand-records.ts`) and
    `stubReplayWords`, `expectNoSeriousAxeViolations` → the e2e spec.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | An ended session is a stored record whose `endedAt` is an ISO-8601 string. A missing `endedAt` or `null` means not ended. `parseSessionRecord` accepts `endedAt` only if it is absent, `null`, or an ISO string that round-trips. `sessionRecord` does not write it, so TASK-3.10's records are unchanged. This story writes it nowhere, and Leave table keeps its interim go-Home behaviour until TASK-10.1 ends the session and saves its report. | (b) `status: 'active' \| 'paused' \| 'ended'`; (c) delete the session record on end; (d) set `endedAt` on Leave table now | (b) the stored state of a closed tab is always "active", so a status field adds nothing but a migration. (c) TASK-2.7 AC#4 and REQ-003 need ended sessions kept. (d) would create ended sessions with no report, which REQ-003's snapshot and REQ-044.7 cannot handle. | yes | Approved by Q-1 |
| D-2 | Resume entry: a `<button type="button" class="menu-secondary">` placed after New game, with a `.menu-title` "Resume session" and a `.menu-subtitle` `resumeSummary(record)`. Cash: `Cash · <players> players · $<sb>/$<bb> · <n> hands · paused`. Sit-and-go (until TASK-5.6): `Sit-and-go · <players> players · <sb>/<bb> · <n> hands · paused`. 1 → `1 hand`. | Story text without "· paused" | The storyboard (`Home.dc.html:36`) is the approved design. The story's "e.g." matches it except for the suffix. | yes | Approved by Q-2 |
| D-3 | `HandStore.pausedSession(): Promise<PausedSession>`, where `PausedSession = { session: SessionRecord \| null; rejected: readonly Error[] }`. The IndexedDB store does one readonly `getAll` on `sessions`, then `findPausedSession(values)`. | A cursor; an `updatedAt` index (would need DB v3) | Few sessions exist (one per sitting). `getAll` needs no schema change. | no | n/a |
| D-4 | The resumed table runs through `TableSessionOptions.resume?: ResumedSession` (`{ table: TableState; sessionId: string; startedAt: Date }`). App's screen union gains `{ name: 'table'; resume: ResumedSession }`. | Pass the raw record into the hook | App validates and restores before mounting (A-5). The hook stays free of parsing. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-record.ts` — `endedAt?` in the type and parse; `MAX_SESSION_COUNT` cap; `findPausedSession`
- `src/table/table-view.ts` — `limitsText(config)` (extracted from `headerText`), `resumeSummary(record)`
- `src/table/hand-record.ts` — `HandStore.pausedSession()` in the interface
- `src/storage/hand-store.ts` — `pausedSession()` with `getAll` + `findPausedSession`
- `src/ui/home/HomeScreen.tsx` — optional `paused`/`onResume` props, the Resume entry, `data-paused`
- `src/ui/styles.css` — `.menu-secondary` (storyboard colours), shared button layout with `.menu-primary`
- `src/ui/App.tsx` — reads the paused session on Home, Resume handler, the resumed table screen
- `src/ui/table/TableScreen.tsx` — `config?` or `resume?` props passed to `Table`
- `src/ui/table/useTableSession.ts` — `resume` option: initial table, sessionId and startedAt from it; no start write
- `tests/support/session-play.ts` — new: `checkOrCall`, `playHand`, `playSession` (headless, no vitest)
- `tests/table/resume.acceptance.test.ts` — new: SPEC-01, SPEC-04, SPEC-07, SPEC-08, SPEC-09
- `tests/storage/resume.acceptance.test.ts` — new: SPEC-02, SPEC-03, SPEC-05, SPEC-06
- `tests/ui/home-resume.acceptance.test.tsx` — new: SPEC-10
- `e2e/resume.spec.ts` — new, every push: SPEC-11, SPEC-12, SPEC-13
- `e2e/support/hand-records.ts` — `seedStoredSessions(records)`
- `e2e/support/records-harness.tsx` — the wrapper forwards `pausedSession`
- `docs/storage/sessions.md` — `endedAt`, the cap, the paused-session rule and the Resume flow

### Components, interfaces and data
`src/table/session-record.ts`:
```ts
export interface SessionRecord { /* …unchanged… */ readonly endedAt?: string | null } // D-1
/** handsPlayed and nextBotId are at most this (A-3). */
export const MAX_SESSION_COUNT = 1_000_000_000;
export interface PausedSession {
  readonly session: SessionRecord | null;   // the paused session, already parsed
  readonly rejected: readonly Error[];      // one per stored value that failed parseSessionRecord
}
/** Parses each value. Drops invalid values (collected in `rejected`) and ended ones (endedAt is a string).
 *  Returns the latest by updatedAt, then startedAt, then sessionId (A-1). Pure; never throws. */
export function findPausedSession(values: readonly unknown[]): PausedSession;
```
`parseSessionRecord` additions, in place: `whole(record.handsPlayed, 'handsPlayed', 0, MAX_SESSION_COUNT)`,
`whole(record.nextBotId, 'nextBotId', 1, MAX_SESSION_COUNT)`. After the ISO checks, if `Object.hasOwn(record,
'endedAt')` and `record.endedAt !== null`, it runs `isoString(record.endedAt, 'endedAt')`.

`src/table/table-view.ts`:
```ts
/** "$4/$8" for cash, "20/40" for a sit-and-go (headerText's existing rule). */
export function limitsText(config: SessionConfig): string;
/** "Cash · 6 players · $4/$8 · 132 hands · paused"; "1 hand" when handsPlayed is 1 (D-2). */
export function resumeSummary(record: SessionRecord): string;
```
`headerText` is rewritten to use `limitsText`, and its output does not change.

`src/table/hand-record.ts` `HandStore` gains:
```ts
/** The paused session (findPausedSession over every stored session value). Rejects only if the database
 *  cannot be read. */
pausedSession(): Promise<PausedSession>;
```

`src/ui/home/HomeScreen.tsx`:
```ts
export interface HomeScreenProps {
  readonly onNewGame: () => void;
  readonly focusHeading?: boolean;
  /** undefined: still loading or not provided; null: no paused session; else the entry's subtitle. */
  readonly paused?: { readonly summary: string } | null;
  readonly onResume?: () => void;
}
```
The `<nav>` gets `data-paused` set to `"loading"` (paused undefined), `"none"` or `"shown"`. The Resume button is
rendered only when `paused` is an object.

`src/ui/table/useTableSession.ts`:
```ts
export interface ResumedSession { readonly table: TableState; readonly sessionId: string; readonly startedAt: Date }
// TableSessionOptions gains: readonly resume?: ResumedSession;
```
With `resume`, the initial `table` is `resume.table`, `sessionId` is `resume.sessionId` and `startedAt` is
`resume.startedAt`, and `started.current` is a resolved promise (no `putSession`). Without it, everything works
as it does today.

`src/ui/App.tsx` screens: `home` (as now), `config` (as now), `{ name: 'table'; config: SessionConfig }` (as now)
or `{ name: 'table'; resume: ResumedSession }`. While `screen.name === 'home'`, an effect runs
`sharedHandStore().pausedSession()`. It logs each `rejected` error with `console.error('Session record could not
be read', error)`, then sets the `paused` state to `{ record, summary: resumeSummary(record) }` or `null`. A read
failure gives `null` and a log (A-4). The effect ignores a result that arrives after the screen has changed.
`onResume` runs `restoreSession(record)`; on success it opens the resumed table with
`{ sessionId: record.sessionId, startedAt: new Date(record.startedAt) }`; on throw it follows A-5.

### Rules and algorithms
1. **Paused-session choice (A-1).** Example: stored A (`updatedAt` 10:05, not ended), B (`updatedAt` 10:30,
   `endedAt` 10:31), C (`updatedAt` 10:20, not ended), D (`{seats: 'x'}`, invalid). Result: `session` = C,
   `rejected` = [D's RangeError].
2. **Resume state.** `restoreSession(record)` gives `handNumber = handsPlayed + 1`, the stored stacks, seats, bot
   ids, line-up and speed, and `button` = the stored next-hand button. The first `deal` step deals that hand
   from these stacks. Example: 9 seats, hand 25 dealt with the button on seat 7. The stored `button` is then 8, so
   hand 26 is dealt with the button on seat 8. With seats 1, 2, 3, 5, 7 and the button on 7, the next button is 1
   (wrap-around).
3. **Abandoned hand.** No record of it exists. Records 1..n are stored, and record n+1 is written only when the new
   hand n+1 completes after the resume, under the same `sessionId` (key `[sessionId, n+1]` is free, so no
   ConstraintError).
4. **Counter cap.** `handsPlayed` in `0..1e9`, `nextBotId` in `1..1e9`. `handsPlayed: 1e9` parses. `1e9 + 1`,
   `MAX_SAFE_INTEGER - 1` and `MAX_SAFE_INTEGER` throw `RangeError('Invalid session record: handsPlayed')`; the
   same applies to `nextBotId`.

### Error handling and configuration
- Validation failures are TASK-3.10's field-named RangeErrors (`Invalid session record: <field>`, `Invalid session
  config: <field>`), plus `…: endedAt`. None of them reach the UI as text. They are logged and the entry is hidden
  (A-2, A-5).
- Log lines: `Session record could not be read`, `Paused session could not be read`, `Session could not be
  resumed`.
- No new configuration, setting or dependency.

## 6. Behaviour specification

### SPEC-01: The Resume subtitle states game type, table size, stake and hands played
- Verifies: AC#1, DoD#1
- Behaviour: Given a valid session record for a 6-player $4/$8 cash session with `handsPlayed: 132`, When
  `resumeSummary` runs, Then it returns `Cash · 6 players · $4/$8 · 132 hands · paused`. With `handsPlayed: 1`
  it returns `… · 1 hand · paused`, with 0 it returns `… · 0 hands · paused`. A 9-player $10/$20 record gives
  `Cash · 9 players · $10/$20 · 25 hands · paused`. A sit-and-go record gives
  `Sit-and-go · 6 players · 20/40 · 3 hands · paused`. `headerText` output is unchanged for the existing cases.
- Verification: acceptance `tests/table/resume.acceptance.test.ts::the resume summary shows game type, players, stake and hands played`

### SPEC-02: Only a stored, valid, not-ended session is the paused session
- Verifies: AC#1, AC#2
- Behaviour: Given a fake-indexeddb store, When `pausedSession()` runs on an empty store, Then
  `{ session: null, rejected: [] }`. Given only sessions with `endedAt` set to an ISO string, Then `session` is
  null. Given A, B (ended), C and D (invalid) as in rule 1, Then `session` deep-equals C and `rejected` holds one
  RangeError. Given one not-ended record with `handsPlayed: 132`, Then `session.handsPlayed === 132`. A record
  with `endedAt: null` or no `endedAt` is not ended. `endedAt: 'yesterday'` or `endedAt: 5` is rejected with
  RangeError `Invalid session record: endedAt`. `findPausedSession` gives the same results on the raw values.
- Verification: acceptance `tests/storage/resume.acceptance.test.ts::the paused session is the latest valid stored session that has not ended`

### SPEC-03: Closed in the middle of hand 11 → Resume deals hand 11 from the end-of-hand-10 stacks
- Verifies: AC#3, AC#6
- Behaviour: Given a default $4/$8 6-max session (`SESSION` id, fixed replay codes) played for hands 1–10 with
  `playSession` and each hand written by `handWrite` + `add(record, session)` into a fake-indexeddb factory, and
  hand 11 dealt with some actions applied but never written, When a new `openHandStore(sameFactory)` reads
  `pausedSession()` (the relaunch) and `restoreSession(session)` runs, Then `handsPlayed === 10`,
  `table.handNumber === 11`, `table.hand === null`, and `table.stacks`, `seats`, `botIds`, `button`,
  `nextBotName` and `nextBotId` deep-equal `nextHand(t10)` (the state at the end of hand 10). When hand 11 is then
  dealt and played to the end and written with the same `sessionId`, Then the write succeeds, `get(SESSION, 11)`
  has `sessionId === SESSION` and `handNumber === 11`, and `getSession(SESSION).handsPlayed === 11`. A further
  hand 12 is stored as hand 12.
- Verification: acceptance `tests/storage/resume.acceptance.test.ts::a session closed in hand 11 resumes at hand 11 with the end-of-hand-10 stacks and keeps its session id`

### SPEC-04: A 9-player $10/$20 Custom session resumes with everything restored and the button moved on
- Verifies: AC#4
- Behaviour: Given a 9-player cash config at $10/$20 with `lineUp: 'Custom'` (`configWithSeatStyle` on a preset),
  starting button seat 1, played for 25 hands with `playSession` (so hand 25's button is seat 7), When the hand-25
  `handWrite` session is restored, Then `config.gameType === 'cash'`, `config.players === 9`, `config.stake`
  equals `{ smallBet: 10, bigBet: 20 }`, `config.lineUp === 'Custom'`, `config.speed` equals the original, every
  seat's name, kind, style and bot id equal the played table's (`nextHand(t25)`), the stacks equal it,
  `handNumber - 1 === 25`, and `button === 8`. When the next hand is dealt, Then its `hand.button === 8`. A
  second case with seats where the next seat wraps around (button on the highest seat → the lowest seat) holds the
  same way.
- Verification: acceptance `tests/table/resume.acceptance.test.ts::a 9-player custom session resumes with its seats, styles, stacks and count and the next button`

### SPEC-05: The abandoned hand leaves no record and no trace in the stats
- Verifies: AC#5
- Behaviour: Given SPEC-03's store after the "relaunch" in the middle of hand 11, When records 1–11 are read with
  `get(SESSION, n)` and `count()` is read, Then records 1–10 exist, `get(SESSION, 11)` is null and `count() === 10`.
  For every seat, `styleStats(styleCounts(storedRecords, seat))` equals
  `styleStats(styleCounts(liveCompletedHands1to10, seat))`. After resuming, the restored table's `userDecisions`
  is `[]` and `handNumber` is 11.
- Verification: acceptance `tests/storage/resume.acceptance.test.ts::the abandoned hand 11 has no record and the stats equal those of hands 1 to 10`

### SPEC-06: The store reads every session through validation
- Verifies: AC#7, DoD#1
- Behaviour: Given a fake-indexeddb `sessions` store seeded raw (via the IDB API) with a valid record and a
  record whose `seats[1].kind` is `'robot'`, When `pausedSession()` runs, Then it resolves (does not reject), the
  valid record is returned if it is the latest, and `rejected` holds a RangeError naming `seats[1].kind`. With only
  the invalid record stored, `session` is null. A database at a newer version makes `pausedSession()` reject with
  VersionError. That rejection is what App turns into `data-paused="none"` (A-4).
- Verification: acceptance `tests/storage/resume.acceptance.test.ts::pausedSession validates each stored session and skips invalid ones`

### SPEC-07: Unknown seat kind, unknown bot style or a missing bot name is rejected before any line-up or table code
- Verifies: AC#7
- Behaviour: Given a valid stored session from `sessionRecord`, When one of these is changed — the record's
  `seats[1].kind = 'robot'`; `config.seats[1].kind = 'robot'`; the record's `seats[1].style = 'Shark'`;
  `config.seats[1].style = 'Shark'`; the record's `seats[1].name` deleted or `''`; `config.seats[1].name`
  deleted — Then `restoreSession` and `parseSessionRecord` throw `RangeError` whose message names the field
  (`Invalid session record: seats[1].kind`, `Invalid session config: seats[1].style`, …), and
  `findPausedSession([bad])` gives `session: null` with that RangeError in `rejected`. The bot's line-up helpers
  are never reached: with `vi.mock` of `src/bots/lineup` wrapping `resolveLineUpName` and `lineUpSessionConfig`
  in spies (the real functions still run), neither spy is called during these restores.
- Verification: acceptance `tests/table/resume.acceptance.test.ts::a stored session with an unknown kind, unknown style or missing name is rejected before line-up or table code`

### SPEC-08: handsPlayed or nextBotId at or near MAX_SAFE_INTEGER is rejected
- Verifies: AC#8
- Behaviour: Given a valid stored session, When `handsPlayed` is `Number.MAX_SAFE_INTEGER`,
  `Number.MAX_SAFE_INTEGER - 1` or `MAX_SESSION_COUNT + 1`, Then `restoreSession` throws `RangeError` with message
  `Invalid session record: handsPlayed`. The same holds for `nextBotId` (`…: nextBotId`); bot ids stay below it.
  `handsPlayed: MAX_SESSION_COUNT` restores to `handNumber === MAX_SESSION_COUNT + 1`, a safe integer.
  `MAX_SESSION_COUNT < Number.MAX_SAFE_INTEGER`, and `findPausedSession` moves such records to `rejected`.
- Verification: acceptance `tests/table/resume.acceptance.test.ts::handsPlayed or nextBotId near MAX_SAFE_INTEGER is rejected with RangeError`

### SPEC-09: Paused-session ordering and endedAt parsing (internals)
- Verifies: AC#2
- Behaviour: Given `findPausedSession`, When two not-ended records have equal `updatedAt`, Then the later
  `startedAt` wins; when those are equal too, the greater `sessionId` wins. Input order does not change the
  result. A non-object value (`'x'`, `null`, `[]`) is rejected, not thrown. `parseSessionRecord` returns its input
  unchanged (same reference) for records with and without `endedAt`.
- Verification: unit `tests/table/resume.acceptance.test.ts::findPausedSession orders by updatedAt, startedAt and sessionId`

### SPEC-10: Home shows the Resume entry only when it is given a paused session
- Verifies: AC#1, AC#2, DoD#1
- Behaviour: Given `renderToString(<HomeScreen onNewGame paused={{ summary: 'Cash · 6 players · $4/$8 · 132 hands · paused' }} onResume/>)`,
  Then the Main menu `<nav>` has `data-paused="shown"` and two buttons in order: New game, then
  `<button type="button" class="menu-secondary">` with title text `Resume session` and subtitle text
  `Cash · 6 players · $4/$8 · 132 hands · paused`. With `paused={null}` the nav has `data-paused="none"` and only
  New game; with `paused` omitted the nav has `data-paused="loading"` and only New game.
- Verification: acceptance `tests/ui/home-resume.acceptance.test.tsx::home shows Resume session with its summary only for a paused session`

### SPEC-11: Browser — reload in the middle of a hand, Resume, and the hand count continues under the same id
- Verifies: AC#1, AC#3, AC#6, DoD#7, DoD#8
- Behaviour: Given the real app (Chromium and WebKit) with stubbed replay words and a paused clock, When the user
  starts the default game, completes hands 1 and 2, reaches hand 3 in progress and the page is reloaded, Then Home
  shows the button named `/^Resume session/` with the subtitle `Cash · 6 players · $4/$8 · 2 hands · paused`
  after New game, and the nav has `data-paused="shown"`. axe reports no serious or critical violations on Home.
  When the user chooses Resume session, Then the Table opens with the header
  `Cash · 6 players · $4/$8 · Hand #3`. Before the deal, every seat's name and stack text equal the stored
  session's seats and stacks, as read before the reload. When hand 3 completes, Then the stored hand records are
  numbered `[1, 2, 3]`, all with the original `sessionId`, the `sessions` store still holds exactly one record with
  that id, and its `handsPlayed` is 3. Every request goes to the app's own origin. Leave table then goes Home and
  Resume session shows `3 hands` (the interim behaviour, D-1).
- Verification: acceptance `e2e/resume.spec.ts::a session reloaded mid-hand resumes from Home at the same hand number under the same session id`

### SPEC-12: Browser — a seeded 9-player Custom session and the no-session states
- Verifies: AC#2, AC#4, DoD#7
- Behaviour: Given an empty profile, When Home loads, Then the nav reaches `data-paused="none"` and no Resume
  button exists. Given storage seeded with only an ended session (`endedAt` set), Then the same holds. Given
  storage seeded (via `seedStoredSessions`) with a valid 9-player $10/$20 Custom record after hand 25 (stored
  `button: 8`, distinct styles per seat) plus an older ended record, When Home loads, Then the Resume subtitle is
  `Cash · 9 players · $10/$20 · 25 hands · paused`. When the user chooses it, Then the header reads
  `Cash · 9 players · $10/$20 · Hand #26`, the seats show the stored names, styles and stacks in the same seats,
  and once the hand is dealt the dealer marker is on seat 8. axe on the 9-seat table reports no serious or critical
  violations.
- Verification: acceptance `e2e/resume.spec.ts::Resume shows only for a stored unended session and restores a 9-player custom table`

### SPEC-13: Browser — an invalid or out-of-range stored session leaves Home usable
- Verifies: AC#7, AC#8
- Behaviour: Given storage seeded with only a session whose `seats[1].kind` is `'robot'`, then (in a fresh
  context) only one with `handsPlayed: Number.MAX_SAFE_INTEGER`, When Home loads, Then the nav reaches
  `data-paused="none"`, no Resume button exists, the console has a `Session record could not be read` error, there
  is no uncaught page error, and New game opens Game Config, where Start game deals hand 1 of a new session. Given
  a valid record and an invalid newer one, Then Resume shows the valid one.
- Verification: acceptance `e2e/resume.spec.ts::an invalid stored session is skipped and Home stays usable`

### SPEC-14: Repo checks, coverage, boundary, golden suite
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#6
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, including every locked test
  (`tests/ui/home.acceptance.test.tsx`, `tests/unit/app.test.tsx`, TASK-3.10's session tests). The golden-spot
  suite (part of `npm test`) passes 100%. Coverage holds: at least 90% for engine/bots/advice/stats/playtest/table
  and at least 70% overall. `src/table/session-record.ts` and `src/table/table-view.ts` import nothing from
  `src/ui` or `src/storage` (the headless-boundary lint). DoD#6 is N/A: no engine, bot or advice code changes, so
  no playtest run is required (`git diff --stat main -- src/engine src/bots src/advice` is empty).
- Verification: command `npm run lint && npm run typecheck && npm test && git diff --stat main -- src/engine src/bots src/advice`

### SPEC-15: Browsers, network, N/A items, CI
- Verifies: DoD#7, DoD#8, DoD#9, DoD#10, DoD#12
- Behaviour: The full Playwright suite (`npm run e2e`, Chromium and WebKit) passes, including the existing Home,
  Leave table and session-record specs. SPEC-11 asserts same-origin requests only. DoD#9 is N/A (no strategy
  content). DoD#12 is N/A (no service worker exists yet; E13-S07). CI is green on `doit/TASK-2.6`.
- Verification: command `npm run build && npm run e2e && gh run list --branch doit/TASK-2.6 --limit 1`

### SPEC-16: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/sessions.md` documents the `endedAt` field (absent/null = not ended, written by E10), the
  `handsPlayed`/`nextBotId` cap (`MAX_SESSION_COUNT`), the paused-session rule (A-1, invalid records skipped and
  logged), and the Resume flow (Home reads `pausedSession`, App restores, the table keeps the session id, there
  is no start write, and hand numbers continue). It replaces "there is no Resume screen yet" and "no find the
  paused session query until E02". The story doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/storage/sessions.md` against this list; `backlog doc list --plain` shows the story doc

## 7. Edge cases
- No sessions, or only ended ones: SPEC-02, SPEC-12.
- Several not-ended sessions (every Start game leaves one today): the latest wins (A-1, SPEC-02, SPEC-09).
- 0-hand paused session (closed during hand 1): shown as `0 hands` and resumes at hand 1 (A-9, SPEC-01). The start
  record already holds it.
- Busted-and-replaced bot before the pause: the stored seat already holds the replacement (TASK-3.10 D-3), and
  SPEC-03/SPEC-04 compare against `nextHand`, which includes it.
- Button wrap-around: SPEC-04.
- Corrupt, hostile or out-of-range records: SPEC-06, SPEC-07, SPEC-08, SPEC-13.
- Database unreadable (newer version): SPEC-06 → Home shows `none` (A-4).
- Leave table, or a reload, during the in-flight write of the last hand: the write is one atomic transaction
  (TASK-3.10 D-2), so Home reads either the old session or the new one, never a mix. Either one is a consistent
  paused state.
- Two tabs resuming the same session: both write the same `[sessionId, n]` key, and the second `add` fails with
  ConstraintError, which stops dealing in that tab (the existing TASK-3.9 behaviour). No data is corrupted. No new
  handling is needed (single-user app).
- React StrictMode double effects: the Home read runs twice and is harmless (a cancelled flag drops the stale
  result). The resumed table writes no start record (A-6), so a double effect writes nothing.

## 8. Security considerations
- Trust boundary: every value read from `sessions` is untrusted. `pausedSession` runs `parseSessionRecord` on each
  value (assertSessionConfig, seat kinds and styles against the config, names, assertChips, the counter cap)
  before anything uses it. App runs `restoreSession` (which parses again) before the Table mounts. No
  unvalidated value reaches `resolveLineUpName`, `lineUpSessionConfig`, `createHand` or the UI (SPEC-07).
- Hidden information (REQ-025): restore keeps TASK-3.10's rule that exactly one user seat equals `userSeat` and
  that the record's seat kinds match the config's. The session record holds no hole cards and no replay code.
- Integer safety: the cap keeps `handNumber` and new bot ids far below `MAX_SAFE_INTEGER` (SPEC-08).
- Logs: rejected records are logged with the RangeError (field names only, no record contents).
- No new dependency, no network (SPEC-11 asserts same-origin), no randomness change (the stored session id is
  reused, and new sessions still use the CSPRNG id).

## 9. Non-functional
- Home read: one `getAll` over the `sessions` store, at most a few hundred records over the app's life. Each one
  parses in well under 1 ms, so the entry appears within one frame or two after Home mounts. No perf test (the
  standing rule keeps speed checks opt-in, and nothing here is scale-sensitive).
- Every-push cost: one new Playwright spec (2 played hands plus seeded cases, about 15 s per browser) and three
  fast Vitest files. The 25-hand headless play in SPEC-04 takes under 5 s. If it is slower, the builder uses fewer
  bot-heavy hands (fold-to-raise user policy) but keeps 25 hands.
- Coverage: the new table functions have at least 90% line coverage through SPEC-01 to SPEC-09.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a game, play two hands, reload in the middle of hand 3, check that Home shows
  "Resume session · Cash · 6 players · $4/$8 · 2 hands · paused", choose it and see "Hand #3" with the stacks from
  the end of hand 2
- New tests (path → SPEC ids):
  - `tests/table/resume.acceptance.test.ts` → SPEC-01, SPEC-04, SPEC-07, SPEC-08, SPEC-09
  - `tests/storage/resume.acceptance.test.ts` → SPEC-02, SPEC-03, SPEC-05, SPEC-06
  - `tests/ui/home-resume.acceptance.test.tsx` → SPEC-10
  - `e2e/resume.spec.ts` → SPEC-11, SPEC-12, SPEC-13
- Judge end-to-end scenario: `npm run build && npx playwright test e2e/resume.spec.ts`. Then by hand with
  `npm run preview`: start a 9-player game, play 3 hands, close the tab in the middle of hand 4, reopen it and
  check the Resume entry (`3 hands`). Resume and check that the header says Hand #4, the stacks equal the end of
  hand 3 and the dealer moved one seat. In DevTools check that `hands` has no record 4 until hand 4 completes,
  then has it under the same session id.

## 11. Open questions
None. Q-1 (D-1) and Q-2 (D-2) answered in `doit/TASK-2.6/qa.md`: recommended options accepted.

## 12. Clarifications log
See `doit/TASK-2.6/qa.md`.
