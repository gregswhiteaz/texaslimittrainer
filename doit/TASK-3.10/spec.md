# Spec: TASK-3.10 — Save the session after every hand so it can be resumed

Status: READY (approved 2026-11-23)
Task: TASK-3.10 · Parent/epic: TASK-3 · Requirements: REQ-052 (REQ-052.3) · Dream: limit-holdem-trainer

## 1. Summary
The table writes a session record to IndexedDB when it starts. It updates that record after every completed hand,
in the same transaction as that hand's record, so the stored session and the stored hands always agree. A killed
browser therefore loses at most the hand in progress. The record holds what E02 Resume will read: the starting
configuration, seats with bot ids, names, styles and stacks, the next dealer button, hands played, rebuys, the
sit-and-go level and the bot counters. The story also adds the restore-side validation that earlier security reviews
asked for: `assertSessionConfig`, a self-consistent `resolveSessionConfig`, `parseSessionRecord`/`restoreSession`,
safe handling of object, array and sparse values in `createHand`/`shuffledDeck`, and cross-field checks in
`parseHandRecord`. The Resume screen itself belongs to E02.

## 2. Scope
- In scope:
  - `src/table/session-record.ts` (new, headless): the `SessionRecord` type, `sessionRecord(…)`, `handWrite(…)`,
    `parseSessionRecord(…)` and `restoreSession(…)`.
  - `src/table/session.ts`: `assertSessionConfig(value)`; `resolveSessionConfig` made self-consistent and validated.
  - `src/table/hand-record.ts`: the `HandStore` interface gains `add(record, session?)`, `putSession` and
    `getSession`. `parseHandRecord` gains cross-field checks, length bounds and sparse-array safety.
  - `src/storage/hand-store.ts`: database version 2 adds a `sessions` object store (key `sessionId`) and keeps
    `hands`. `add(record, session)` writes both in one strict-durability transaction.
  - `src/ui/table/useTableSession.ts`: puts the start record at mount and writes hand and session together at hand end.
  - `src/engine/hand.ts`, `src/engine/deck.ts`, `src/engine/cards.ts`: an exported `assertChips` (the existing
    stake and stack rules, extracted), sparse-seat rejection, and no native TypeError or array coercion on hostile values.
  - Test-support updates: `e2e/support/hand-records.ts` (v2 and a sessions reader) and
    `e2e/support/records-harness.tsx` (its wrapper passes the session through).
  - Tests: Vitest with `fake-indexeddb`, one every-push Playwright spec, and one opt-in kill spec (`npm run e2e:slow`).
  - `docs/storage/sessions.md` (new) and an update to `docs/storage/hand-records.md`.
- Not doing:
  - No Resume screen, no Home Resume entry, no "find the paused session" query, no hands-played display (E02:
    TASK-2.6, TASK-2.14). No `getAll`/index on `sessions`.
  - No in-progress hand in the session record, and no action replay on restore (D-4). An unfinished hand is never written.
  - No user rebuy (TASK-3.11): `rebuys` is always 0. No level schedule (TASK-5.4): `level` is 1 for a sit-and-go.
  - No discarding of 0-hand sessions (E10, REQ-044.8). No session report. No deletion API.
  - No per-store schema version field and no migration framework (REQ-054, E13). Database version 2 is the only marker.
  - No write-failure message or Retry button (TASK-13.3). A failed write still stops dealing (TASK-3.9 D-2).
  - No screen, layout, text or visual change.
- Scope budget: files=20, lines=1800

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `rebuys` is stored and is always 0 in this story. Bot replacements are not rebuys. TASK-3.11 increments it. | yes | The description lists "rebuy count", but no rebuy exists yet. | Omit the field until TASK-3.11 (that would change the format later). |
| A-2 | `level` is `null` for cash and `1` for a sit-and-go, as in `handRecord` (`src/table/hand-record.ts:111`). | yes | Level 1 is fixed until TASK-5.4. | — |
| A-3 | The start record is written once per `Table` mount from the seated state (`handsPlayed: 0`). It is chained before the first hand's write, and a start-write failure is logged with `console.error` and does not block dealing. The first hand's combined write puts the full session record anyway. | yes | "Creates the session record when the table starts". E10 needs 0-hand sessions to exist so it can discard them. | Write the session only after hand 1. |
| A-4 | A stake is "known" when `stakesFor(stake)` passes the engine's stake rules (`assertChips`). It does not have to be one of `CASH_STAKES`. | yes | Existing tests seat odd but valid stakes. The fairness rules live in the engine. | Require membership of `CASH_STAKES` (would break tests and E12 tuning). |
| A-5 | Names (seat names in configs, session records and hand records) are strings of 1–40 characters. Actions per hand record are at most 400. `shown.shown`, `result.showdown`, `result.awards` and each `winners` hold at most 10 entries. | yes | The longest real name is a replacement name plus a round number (under 12 characters). A capped 10-seat hand has well under 250 actions (4 bets per street). | Tighter bounds (brittle) or none (AC#12 forbids that). |
| A-6 | `parseSessionRecord` ignores unknown extra properties except `hand` and `actions`, which it rejects (D-4). | yes | This is forward compatible like `parseHandRecord` (TASK-3.9 A-7), while an in-progress hand fails closed. | Reject every unknown key. |
| A-7 | AC#2's "killed in the middle of hand 11" is proven in Chromium by the opt-in kill spec (`TLH_SLOW_TESTS=1`, `npm run e2e:slow`), the same way as TASK-3.9 A-5. Every push runs a page-reload variant after hand 2, which takes about 10 s per browser. | yes | Hard kill is Chromium-only. Slow checks are opt-in. The CI budget is about 4 min. | Run the kill on every push. |
| A-8 | Stacks restored from a session must all be at least 1 (the createHand rule). Today every seat is refilled to at least 1 before the next deal (bot replacement plus the TEMPORARY top-up, `src/table/session.ts:371-393`). The story that adds busting out (TASK-3.21/E05) relaxes this together with the deal. | yes | AC#6 asks for the same rules as createHand. | Allow 0 now (no producer of it exists). |

## 3. Current system
- Toolchain: strict TypeScript 6, React 19, Vite 8, Vitest 5 (node env, v8 coverage), Playwright 1.65 (Chromium and
  WebKit on the production build at :4173), ESLint and Prettier (`package.json:12-31`). `fake-indexeddb` 6.2.8 is
  already a dev dependency (TASK-3.9 Q-3). `npm run e2e:slow` lists the opt-in Playwright files (`package.json:22`).
- Headless boundary: `src/table/**` and `src/engine/**` must not import UI or browser code
  (`tools/lint/headless-boundary.js:7`). `session-record.ts` therefore lives in `src/table`, and IndexedDB lives only
  in `src/storage`.
- IndexedDB today: `tlh-trainer` v1, store `hands` keyed `['sessionId','handNumber']`, created in `onupgradeneeded`
  when `oldVersion < 1` (`src/storage/hand-store.ts:3-23`). `add` uses one strict readwrite transaction and resolves
  on `complete` (`:42-53`). `get` validates with `parseHandRecord` (`:54-57`).
- The hook writes the hand record when the hand is `done` and keeps the promise in `write.current`. The auto-deal and
  `dealNext` deal only after it resolves, and never after a failure (`src/ui/table/useTableSession.ts:119-171`). The
  session id comes from 16 CSPRNG bytes per mount (`:43-47`, `:80`).
- `nextHand(table)` is the deterministic "ready for the next deal" state. It carries final stacks, replaces a busted
  cash bot (new id, next name, style drawn from the finished hand's replay code, $160 buy-in at $4/$8), applies the
  TEMPORARY top-up, moves the button one seat and adds 1 to `handNumber` (`src/table/session.ts:363-409`).
  `TableState` (`:255-275`) holds `config`, `stakes`, `seats`, `stacks`, `button`, `handNumber`, `nextBotName`,
  `botIds` and `nextBotId`.
- `resolveSessionConfig` merges without validating (`src/table/session.ts:245-249`). For example `{players: 3}`
  gives players 3 with 6 seats. `assertSessionConfig` does not exist yet.
- `createHand` rejects non-object seats with `rawSeats.every(isObject)` (`src/engine/hand.ts:224-232`). `every` and
  `map` skip holes, so a sparse `seats` array gets through. `validate` then destructures `undefined` and throws a
  TypeError. Invalid seat and button messages call `String(value)` (`:153`, `:159`), which throws a TypeError for
  `{"toString":1}`. The stake and stack rules are `:160-188`.
- `isReplayCode(text)` runs `REPLAY_CODE_PATTERN.test(text)`, which coerces an array `['<valid code>']` to a valid
  string (`src/engine/deck.ts:36-38`). `shuffledDeck` echoes the code with `String(code)` (`:42-44`).
- `parseHandRecord` checks fields one by one (`src/table/hand-record.ts:213-265`) but not across fields. `array()`
  uses `forEach`, which skips holes (`:141-144`, `:155`, `:167`).
- `checkState` (`src/engine/invariants.ts:417`) is not used on any restore path. No HandState is ever persisted.
- E2E support opens `tlh-trainer` at version 1 (`e2e/support/hand-records.ts:9-45`). Once the app is at v2 that fails
  with VersionError, so the support file must move to v2. The records harness wraps `HandStore.add`
  (`e2e/support/records-harness.tsx:43-55`).
- Existing code to reuse:
  - `src/table/hand-record.ts` helpers `invalid/object/array/whole/oneOf/isWhole` → the same style for session-record
    validation. Export the needed ones (`isWhole`) instead of copying them.
  - `nextHand`, `seatSession`, `initialBotIds`, `stakesFor`, `tableStake` (`src/table/session.ts`) → build and restore
    the session state. Do not reimplement replacement or rotation.
  - `handRecord`, `completedHand` → `handWrite` builds the hand record exactly as now.
  - `echoText` (`src/engine/cards.ts:31`) → the new `echoValue` wraps it.
  - `e2e/support/hand-records.ts` (`advanceToHand`, `playToResult`, `header`, `storedRecords`) and the kill helper
    pattern in `e2e/hand-records-kill.spec.ts:14-30` → the new e2e specs.
  - `tests/support/table-scenarios.ts` (`withFinalStacks`, `KINGS_SHOWDOWN`) → AC#4's busted-bot hand.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted session format: store `sessions` in DB `tlh-trainer` version 2, keyPath `sessionId`, one record per session, overwritten (`put`) on each write. Fields are given in §5 "SessionRecord". | Separate database; one record per hand (append-only log) | One store with in-place updates is the simplest thing Resume can read. Hands stay add-only. | yes | user (Q-1) |
| D-2 | The session update and the hand record go in **one** readwrite transaction over `['hands','sessions']`, made before the next deal (the same write-before-deal promise as TASK-3.9). | Two transactions; session written after the deal | Atomic: after any kill, the session's `handsPlayed` equals the highest stored hand number for that session (AC#2). | no | n/a |
| D-3 | The stored state is the state **ready for the next hand** (`nextHand(table)`): stacks after the hand plus replacement and top-up, `button` = the button the next hand uses, `handsPlayed` = the completed hand's number. | Store the finished hand's button and raw stacks, and let Resume recompute | AC#4 already requires the post-replacement seat ($160, new bot). Restoring then needs no game logic: `restoreSession` gives exactly `nextHand(table)`, and Resume deals from it. | yes | user (Q-2) |
| D-4 | AC#10/#11: the session format never holds an in-progress hand or actions. `parseSessionRecord` rejects any record that has a `hand` or `actions` property, with RangeError. `restoreSession` always returns `hand: null` and never calls `applyAction`, so no untrusted HandState or action can reach the engine. | (b) Build a full `parseHandState` + `checkState` + action-shape validator now (about 150 unused lines); (c) move AC#10/#11 to TASK-10.2/E02 | The description says an unfinished hand is never written. Fail-closed rejection meets the security intent with no dead code. If a later story persists a live hand, it must add the validator (recorded in the docs). | yes | user (Q-3) |
| D-5 | Upgrade from v1: `onupgradeneeded` creates `hands` only if `oldVersion < 1` and `sessions` only if `oldVersion < 2`. It never touches existing hand records. A v1-era open tab is closed by its existing `onversionchange` handler. Formal migrations remain E13 (REQ-054). | Per-store version fields now | Minimal. The docs state the rule for future bumps: append `if (oldVersion < N)` steps only. | no | n/a |
| D-6 | `resolveSessionConfig` makes a partial override consistent and then calls `assertSessionConfig` (rules in §5). If the overrides contradict each other explicitly, it throws RangeError. | Always throw on inconsistency | Callers that pass only `players` or only `seats` get a usable config (AC#9). | no | n/a |
| D-7 | The engine exports `assertChips(stakes, seats)`: the stake and stack rules from `validate`, unchanged, and still called from `validate`. Restore calls it before building a table (AC#6). | Copy the rules into session-record | One source of truth for the pot bound. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-record.ts` — new: SessionRecord type, sessionRecord, handWrite, parseSessionRecord, restoreSession
- `src/table/session.ts` — assertSessionConfig, consistent resolveSessionConfig, exported LINE_UPS/SPEEDS constants
- `src/table/hand-record.ts` — HandStore interface (session methods), cross-field and sparse-safe parseHandRecord, export isWhole
- `src/storage/hand-store.ts` — DB v2, SESSIONS_STORE, atomic add(record, session), putSession, getSession
- `src/ui/table/useTableSession.ts` — start record at mount; combined write at hand end
- `src/engine/hand.ts` — export assertChips; sparse-seat rejection; echoValue in messages
- `src/engine/deck.ts` — isReplayCode/shuffledDeck reject non-strings without coercion
- `src/engine/cards.ts` — echoValue(value: unknown)
- `e2e/support/hand-records.ts` — open v2 (create both stores), readStoredSessions/storedSessions
- `e2e/support/records-harness.tsx` — wrapper forwards session, putSession, getSession
- `package.json` — add `e2e/session-kill.spec.ts` to `e2e:slow`
- `tests/storage/session-records.acceptance.test.ts` — new: AC#1, #3, #4 and the atomic write
- `tests/table/session-restore.acceptance.test.ts` — new: AC#5–#11
- `tests/table/hand-record-validation.acceptance.test.ts` — new: AC#12
- `tests/storage/hand-store.test.ts` — DB_VERSION 2, v1→v2 upgrade keeps hands, the VersionError probe at version 3, session get validation
- `e2e/session-records.spec.ts` — new, every push: the start record, after hand 2, and a reload in the middle of hand 3
- `e2e/session-kill.spec.ts` — new, opt-in: a kill in the middle of hand 11
- `docs/storage/sessions.md` — new
- `docs/storage/hand-records.md` — DB v2 note, new parse rules
- `tests/table/hand-record.test.ts` — only if an existing malformed-record case needs its expected field name re-pinned (unit; allowed)

### Components, interfaces and data
`src/table/session-record.ts` (headless):
```ts
export interface SessionRecordSeat {
  readonly seat: SeatNumber; readonly kind: 'user' | 'bot';
  readonly botId: number | null;      // null iff user
  readonly name: string;              // 1..40 chars
  readonly style: BotStyle | null;    // null iff user
  readonly stack: number;             // chips before the next hand, safe integer >= 1
}
export interface SessionRecord {
  readonly sessionId: string;         // 32 lowercase hex
  readonly startedAt: string;         // ISO-8601 UTC, mount time
  readonly updatedAt: string;         // ISO-8601 UTC, last write (hand completion time)
  readonly config: SessionConfig;     // starting configuration as played: game type, players (table size),
                                      // stake (cash), lineUp, seat names/styles, speed, userSeat, starting button
  readonly handsPlayed: number;       // completed hands; 0 in the start record
  readonly seats: readonly SessionRecordSeat[]; // ascending; same seat numbers and kinds as config.seats
  readonly button: SeatNumber;        // dealer button of the next hand to be dealt (D-3)
  readonly rebuys: number;            // 0 (A-1)
  readonly level: number | null;      // null cash, 1 sit-and-go (A-2)
  readonly nextBotName: number;       // TableState.nextBotName
  readonly nextBotId: number;         // TableState.nextBotId
}
export interface SessionMeta { readonly sessionId: string; readonly startedAt: Date; readonly updatedAt: Date }

/** Plain-data record of `table`, which must be ready to deal (hand === null), else RangeError.
 *  handsPlayed = table.handNumber - 1. RangeError('Invalid session record: <field>') on a bad id or Date. */
export function sessionRecord(table: TableState, meta: SessionMeta): SessionRecord;

/** For a done table: { record: handRecord(completedHand(table), …handNumber: table.handNumber, completedAt),
 *  session: sessionRecord(nextHand(table), { sessionId, startedAt, updatedAt: completedAt }) }.
 *  RangeError if the hand is not done. */
export function handWrite(table: TableState, meta: { sessionId: string; startedAt: Date; completedAt: Date }):
  { record: HandRecord; session: SessionRecord };

/** Validates untrusted stored data (rules below); returns it typed, not copied.
 *  RangeError('Invalid session record: <field>') or assertSessionConfig/assertChips's RangeError. */
export function parseSessionRecord(value: unknown): SessionRecord;

/** parseSessionRecord, then the TableState ready for hand handsPlayed + 1. Always hand: null. */
export function restoreSession(value: unknown): TableState;
```
`restoreSession` builds `{ config, stakes: stakesFor(tableStake(config)), seats: seats→{seat, name, kind, style},
stacks: seats→{seat, stack}, hand: null, replayCode: null, userDecisions: [], handNumber: handsPlayed + 1, button,
nextBotName, botIds: {seat: botId} for bots, nextBotId }`. Invariant:
`restoreSession(sessionRecord(nextHand(t), meta))` deep-equals `nextHand(t)` for any done `t`.

`src/table/session.ts`:
```ts
/** RangeError('Invalid session config: <field>') unless value is a valid SessionConfig (rules below). */
export function assertSessionConfig(value: unknown): asserts value is SessionConfig;
```

`src/table/hand-record.ts` — `HandStore` becomes:
```ts
add(record: HandRecord, session?: SessionRecord): Promise<void>; // with session: one transaction over hands+sessions
putSession(session: SessionRecord): Promise<void>;               // create or replace; strict durability
getSession(sessionId: string): Promise<SessionRecord | null>;    // parseSessionRecord on read
get(…), count() — unchanged
```
`src/storage/hand-store.ts`: `DB_VERSION = 2`, `SESSIONS_STORE = 'sessions'`. `add(record)` without a session
keeps today's single-store transaction (`transaction(HANDS_STORE, 'readwrite', {durability:'strict'})`). With a
session it uses `transaction([HANDS_STORE, SESSIONS_STORE], 'readwrite', {durability:'strict'})`, does
`hands.add(record)` and `sessions.put(session)`, and resolves on `complete`. If the hand key already exists
(ConstraintError) the whole transaction aborts and the session is unchanged.

`src/engine/hand.ts`: `export function assertChips(stakes: Stakes, seats: readonly SeatConfig[]): void`. It holds
the moved code from `validate` (stake rules + `isPositiveSafeInteger` per stack + total ≤ MAX_SAFE_INTEGER, same
messages). `validate` calls it.
`src/engine/cards.ts`: `export function echoValue(value: unknown): string` returns `echoText(String(value))` for a
string, number, boolean, bigint, null or undefined; `'[array]'` for arrays; `'[object]'` for any other object;
`'[function]'`/`'[symbol]'` for those. It never throws.

### Rules and algorithms
1. **assertSessionConfig(value)** (AC#5). Each failing rule throws `RangeError('Invalid session config: <field>')`:
   - `value` is a non-array object (`config`).
   - `gameType` ∈ {'cash','sit-and-go'}. Cash: `stake` is an object with whole `smallBet`,`bigBet` and
     `assertChips(stakesFor(stake), [])` passes (stakes rules only). Sit-and-go: no own `stake` property.
   - `players` ∈ TABLE_SIZES and `players === seats.length`.
   - `seats` is an array. For `i` in `0..length-1`, `seats[i]` exists (`i in seats`) and is a non-array object.
     `seat` is whole in 1..10, strictly ascending. `kind` ∈ {user, bot}. `name` is a string of 1–40 characters. A user
     has `style === null`. A bot has `style` ∈ BOT_STYLES.
   - Exactly one seat has kind 'user', and its `seat === userSeat`. `userSeat` is whole.
   - `button` is whole and equals some `seats[i].seat`. `lineUp` ∈ LINE_UPS. `speed` ∈ SPEEDS (`['rapid']`).
   - Whole means `Number.isSafeInteger`, so `{"toString":1}`, `[3]` and `"3"` all fail without coercion.
   Together these rules guarantee that a seat hidden from the user is never treated as the user seat (REQ-025).
2. **resolveSessionConfig(input)** (AC#9, D-6): `m = {...DEFAULT_SESSION_CONFIG, ...input}`.
   - If `input.players` is given, `input.seats` is not, and `m.players !== m.seats.length`: `m = configForPlayers(m, m.players)`,
     then re-apply `input.userSeat`/`input.button` if given.
   - Else if `input.seats` is given: `players` = `input.players ?? seats.length`. If `input.userSeat` is not given,
     `userSeat` = the seat number of the single user seat, when there is exactly one. If `input.button` is not given
     and `m.button` is not a seat, `button` = the seat after `userSeat` in seat order.
   - Then `configForGameType(m, m.gameType, m.stake)`, then `assertSessionConfig`, then return.
   - Examples: `{players: 3}` → equals `configForPlayers(DEFAULT_SESSION_CONFIG, 3)` (seats 1–3, user 3, button 1).
     `{seats: <seats 1..4 with user at 2>}` → players 4, userSeat 2, button 3. `{button: 2}` → as today.
     `{players: 3, seats: DEFAULT_SEATS}` → RangeError. `{}` → `DEFAULT_SESSION_CONFIG`.
3. **parseSessionRecord(value)** (AC#6–#8, #10, #11). In order:
   - Non-array object (`record`). An own property `hand` → RangeError `…: hand`. An own property `actions` →
     `…: actions` (D-4).
   - `sessionId` matches /^[0-9a-f]{32}$/. `startedAt` and `updatedAt` are ISO strings that round-trip through
     `toISOString`, as in `parseHandRecord`.
   - `assertSessionConfig(config)`.
   - `handsPlayed`, `rebuys` and `nextBotName` are whole ≥ 0. `nextBotId` is whole ≥ 1. `level`: cash → `null`;
     sit-and-go → whole ≥ 1.
   - `seats`: dense array (index loop) of non-array objects with `length === config.players`. `seats[i].seat` and
     `.kind` equal `config.seats[i].seat`/`.kind`. A user has `botId === null` and `style === null`. A bot has a whole
     `botId` in `1..nextBotId-1`, unique, and `style` ∈ BOT_STYLES. `name` is 1–40 characters. `stack` is whole.
   - `button` is whole and one of the seat numbers.
   - `assertChips(stakesFor(tableStake(config)), seats.map(({seat, stack}) => ({seat, stack})))`. This is the same
     safe-integer, ≥ 1 and total ≤ MAX_SAFE_INTEGER rule as `createHand` (AC#6).
   - All of this runs before any `TableState`, `createHand` or `shuffledDeck` call.
4. **Write path (hook)**. At mount, `started = store.putSession(sessionRecord(initialTable, {sessionId, startedAt,
   updatedAt: startedAt}))`. A failure is logged as `console.error('Session could not be saved', e)` (A-3). At `done`
   (once per handNumber, as now): `{record, session} = handWrite(table, {sessionId, startedAt, completedAt: new Date()})`,
   then `write.current = started.catch(() => undefined).then(() => store.add(record, session))`. Everything else
   (the deal waits for `write.current`, a failure stops dealing, onHandComplete fires once) is unchanged.
   Worked example: after hand 10 at $4/$8 the stored session has `handsPlayed: 10`, `button` = the seat after hand
   10's button, and the seats and stacks of `nextHand(table)`.
5. **createHand / deck hardening** (AC#7, #8): `createHand` checks `rawSeats` with an index loop, so a hole or a
   non-object entry → `RangeError('Invalid hand config')`. Seat and button messages use `echoValue`.
   `isReplayCode(text: unknown)` returns `typeof text === 'string' && …`. `shuffledDeck` echoes with `echoValue`.
6. **parseHandRecord additions** (AC#12). Each failure throws `RangeError('Invalid hand record: <field>')`:
   - The `array()` helper iterates by index and treats a hole as invalid (`<field>[i]`).
   - Seat names are 1–40 characters. `actions` ≤ 400. `shown.shown`, `result.showdown`, `result.awards` and every
     `winners` ≤ 10.
   - `level`: cash → `null`; sit-and-go → whole ≥ 1 (`level`).
   - `button`, every `actions[i].seat`, `shown.shown[i].seat`, `result.showdown[i].seat`,
     `result.awards[i].winners[j].seat` and `result.returned.seat` are in the seat list (field named at the item).
   - Cards: each seat maps to one pair of hole cards. The user seat maps to `userHoleCards`. A seat that appears in
     `shown.shown` and/or `result.showdown` must show the same two cards every time (as a set), and for the user seat
     they must equal `userHoleCards`. A pair holds two different cards. Over `board` and every distinct seat's pair,
     no card appears twice (`cards`).
   - Valid records written by `handRecord` from real hands still parse. This is covered by the existing tests and a
     round-trip case.

### Error handling and configuration
- Every validation failure is a `RangeError` with a field-named message: `Invalid session config: <field>`,
  `Invalid session record: <field>`, `Invalid hand record: <field>`, `Invalid hand config`, or the existing engine
  messages from `assertChips`. Hostile values never cause a native `TypeError`.
- Storage failures are unchanged from TASK-3.9: a rejected combined write stops dealing, and the result stays shown.
- No new configuration and no new dependency.

## 6. Behaviour specification

### SPEC-01: The session after hand 10 holds that hand's end state
- Verifies: AC#1, DoD#1
- Behaviour: Given a default $4/$8 6-max session played to the end of hand 10 by scripted bots and the user
  checking or calling (fixed replay codes), When `handWrite` runs for hand 10 and `add(record, session)` writes to a
  fake-indexeddb store, Then `getSession(id)` returns `handsPlayed: 10`, and `seats` (seat, kind, botId, name,
  style, stack), `config.lineUp`, `button`, `nextBotName` and `nextBotId` equal `nextHand(table)`'s.
  `restoreSession(stored)` deep-equals `nextHand(table)`, and dealing it with the next code plays a legal hand. The
  same holds after every hand 1–10 (`handsPlayed` = n each time).
- Verification: acceptance `tests/storage/session-records.acceptance.test.ts::after hand 10 the stored session holds hand count 10 and the end-of-hand seats, stacks, styles, line-up and button`

### SPEC-02: The table writes the session at start and after each hand (browser)
- Verifies: AC#1, AC#2
- Behaviour: Given the real app at $4/$8 with stubbed replay words under a paused clock, When the user presses
  Start game, Then the `sessions` store holds one record with `handsPlayed: 0` and `config` equal to the start
  configuration. After hands 1 and 2 complete and hand 3 is dealt and in progress, the record has `handsPlayed: 2`
  and the same `sessionId` as the 2 hand records. When the page is reloaded in the middle of hand 3, Then the
  stored session is deep-equal to the one read before the reload, and no hand record with `handNumber: 3` exists.
- Verification: acceptance `e2e/session-records.spec.ts::the session record is written at start and after each hand and survives a reload mid-hand`

### SPEC-03: Killed in the middle of hand 11 → session equals the end of hand 10
- Verifies: AC#2
- Behaviour: Given Chromium with a persistent profile, When hands 1–10 complete, hand 11 is dealt, the stored
  session S is read, and the browser processes are SIGKILLed during hand 11, Then after relaunch the stored session
  deep-equals S (`handsPlayed: 10`), 10 hand records exist for that session, and none has `handNumber: 11`.
  Opt-in (A-7).
- Verification: acceptance `e2e/session-kill.spec.ts::a browser killed mid hand 11 keeps the session as at the end of hand 10`

### SPEC-04: Hand and session are written atomically
- Verifies: AC#2
- Behaviour: Given a store holding hand 3 of session X and the session with `handsPlayed: 3`, When
  `add(hand3Again, sessionWithHandsPlayed4)` is called, Then it rejects with ConstraintError and `getSession(X)`
  still has `handsPlayed: 3`. When `add(hand4, session4)` succeeds, Then both are readable. The transaction spans
  `['hands','sessions']` with `{durability:'strict'}`.
- Verification: acceptance `tests/storage/session-records.acceptance.test.ts::a hand record and its session update are written in one transaction`

### SPEC-05: Edited line-up is stored as Custom with every seat's style
- Verifies: AC#3
- Behaviour: Given `configWithSeatStyle(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed'), 'Mixed', 2, <a style
  differing from Mixed's seat 2>)`, When the session is seated and its start record is stored and read back, Then
  `config.lineUp === 'Custom'`, and `config.seats` and `seats` list all 6 seats, with each bot's style equal to the
  edited config's and the user's style null.
- Verification: acceptance `tests/storage/session-records.acceptance.test.ts::an edited line-up is stored as Custom with every seat's style`

### SPEC-06: Replaced bot after hand 5
- Verifies: AC#4
- Behaviour: Given a $4/$8 session at hand 5 whose seat-2 bot (id 2) ends hand 5 on $0 (`withFinalStacks`), When
  the hand-5 write is stored and read, Then `handsPlayed: 5` and seat 2 holds `botId: 6`, the first replacement name
  (`nextReplacementName(0, …)`), the style `drawReplacementStyle(lineUp, 6, code, 2)` and `stack: 160`. `nextBotId`
  is 7.
- Verification: acceptance `tests/storage/session-records.acceptance.test.ts::a replaced bot's new id, name, style and $160 stack are stored after hand 5`

### SPEC-07: assertSessionConfig rejects inconsistent or unknown configs
- Verifies: AC#5
- Behaviour: Given `DEFAULT_SESSION_CONFIG` and a sit-and-go and 2/10-player config, When asserted, Then no
  error. Each of these throws `RangeError` (`instanceof RangeError`): two user seats; no user seat; user seat ≠
  `userSeat`; `players` 5 with 6 seats; `button` 9 (not a seat); `gameType: 'poker'`; `lineUp: 'Wild'`;
  `speed: 'slow'`; bot style 'Shark'; user style 'TAG'; empty name; seats out of order; `stake: {smallBet: 0, bigBet: 8}`;
  a sit-and-go with `stake`; `null`; an array.
- Verification: acceptance `tests/table/session-restore.acceptance.test.ts::assertSessionConfig accepts only one user seat at userSeat, players equal to seats, a seated button and known values`

### SPEC-08: Restored stakes and stacks obey createHand's chip rules
- Verifies: AC#6
- Behaviour: Given a valid stored session, When `seats[0].stack` is 0, -1, 1.5, `2**53`, or the stacks total more
  than `Number.MAX_SAFE_INTEGER`, or the config stake's `bigBet` is `2**53`, Then `restoreSession` throws
  RangeError, and the message for each equals what `createHand` reports for the same stakes and stacks. Unchanged
  `assertChips` rules apply inside `createHand`, so the existing engine suites still pass.
- Verification: acceptance `tests/table/session-restore.acceptance.test.ts::restored stakes and stacks pass createHand's safe-integer and pot-bound rules`

### SPEC-09: Object or array seat, button and replay-code values give RangeError
- Verifies: AC#7
- Behaviour: Given stored session JSON where `seats[1].seat`, `button`, `config.button` or `config.seats[1].seat`
  is `{"toString":1}` or `[3]`, When `restoreSession` runs, Then RangeError. Given a hand record whose
  `replayCode` is `[<valid code>]` or `{"toString":1}`, `parseHandRecord` throws RangeError. Given `createHand` with
  a seat or button `{"toString":1}`, RangeError (not TypeError). `isReplayCode([validCode])` is false. `shuffledDeck`
  with `[validCode]` or `{"toString":1}` throws RangeError.
- Verification: acceptance `tests/table/session-restore.acceptance.test.ts::object or array seat, button and replay-code values are rejected with RangeError`

### SPEC-10: Sparse or non-object seats give RangeError
- Verifies: AC#8
- Behaviour: Given seats with a hole (`[ , s2, …]`, or `length` 6 with 5 entries) or a non-object entry (`5`,
  `null`, `[]`), When passed to `restoreSession` (record `seats` or `config.seats`), `assertSessionConfig`,
  `parseHandRecord` (`seats`), or `createHand` (`seats`), Then each throws RangeError. `createHand`'s message is
  `'Invalid hand config'`.
- Verification: acceptance `tests/table/session-restore.acceptance.test.ts::sparse or non-object seats are rejected with RangeError`

### SPEC-11: resolveSessionConfig always yields a valid config
- Verifies: AC#9
- Behaviour: Given the partials `{}`, `{players: 3}`, `{players: 10}`, `{seats: <4 seats, user at 2>}`,
  `{gameType: 'sit-and-go'}`, `{button: 2}` and `{stake: {smallBet: 10, bigBet: 20}}`, When resolved, Then each
  passes `assertSessionConfig`. `{players: 3}` equals `configForPlayers(DEFAULT_SESSION_CONFIG, 3)`, which before
  this story gave players 3 with 6 seats. `{players: 3, seats: DEFAULT_SEATS}` throws RangeError. A fast-check
  property over the partial keys {players 2–10, button 1–10, gameType} gives either a config that passes
  `assertSessionConfig` or a RangeError, and never anything else.
- Verification: acceptance `tests/table/session-restore.acceptance.test.ts::resolveSessionConfig output always passes assertSessionConfig`

### SPEC-12: A stored in-progress hand is rejected; restore never applies actions
- Verifies: AC#10, AC#11
- Behaviour: Given a valid stored session plus a `hand` property (a real mid-hand `HandState` from `dealHand`,
  and also one with `allIn`/`stack`/`streetContribution` corrupted), When `restoreSession` runs, Then RangeError
  `Invalid session record: hand`. Given a valid session plus `actions: [{seat: 1, type: 'call', amount: 4}]` or
  `actions: [{seat: {"toString":1}}]`, Then RangeError `Invalid session record: actions`. Given a valid session,
  `restoreSession(...).hand === null` and `userDecisions` is `[]` (no action applied).
- Verification: acceptance `tests/table/session-restore.acceptance.test.ts::a stored in-progress hand or action list is rejected and restore applies no action`

### SPEC-13: parseHandRecord rejects cross-field inconsistencies
- Verifies: AC#12
- Behaviour: Given a valid record from `handRecord(KINGS_SHOWDOWN)` (it parses), When altered so that one of the
  following is true, Then `parseHandRecord` throws RangeError naming the field: an action seat not in `seats`;
  a `shown.shown` seat, `result.showdown` seat, award winner seat or `returned` seat not in `seats`; `button` not
  in `seats`; a board card equal to a hole card; two seats showing the same card; the user's shown cards ≠
  `userHoleCards`; a hole pair of one card twice; a cash record with `level: 1`; a sit-and-go record with `level:
  null`; a 41-character name; 401 actions; 11 showdown entries; a sparse `actions` array. A fold-out record, a
  sit-and-go record and a 10-player record still parse.
- Verification: acceptance `tests/table/hand-record-validation.acceptance.test.ts::parseHandRecord rejects cross-field inconsistencies and unbounded lengths`

### SPEC-14: Database v2 upgrade keeps v1 hand records; session reads are validated
- Verifies: AC#2, DoD#1
- Behaviour: Given a fake-indexeddb database `tlh-trainer` at v1 with a `hands` store holding 3 records, When
  `openHandStore` opens it, Then `count()` is 3, each `get` equals the original, and `putSession`/`getSession`
  round-trip. `[DB_NAME, DB_VERSION, HANDS_STORE, SESSIONS_STORE]` is `['tlh-trainer', 2, 'hands', 'sessions']`.
  A database already at version 3 makes every call reject with VersionError. A stored session with `handsPlayed:
  -1` makes `getSession` reject with RangeError. `add(record)` without a session still uses
  `transaction('hands', 'readwrite', {durability:'strict'})`.
- Verification: unit `tests/storage/hand-store.test.ts::upgrading a v1 database keeps its hand records and adds sessions`

### SPEC-15: Repo checks, coverage, headless boundary, golden suite, playtest
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#6
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, including every existing
  locked test. The golden-spot suite passes 100%. Coverage is at least 90% for engine/bots/advice/stats/table and
  at least 70% overall. `src/table/session-record.ts` imports nothing from `src/ui` or `src/storage` and uses no
  browser globals. `npm run -s playtest -- --hands 10000 --seed 42` reports `Invariant violations: 0` (the engine
  was touched).
- Verification: command `npm run lint && npm run typecheck && npm test && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-16: Browsers, network, N/A items and CI
- Verifies: DoD#7, DoD#8, DoD#9, DoD#10, DoD#12
- Behaviour: No screen or dialog is added or changed. The full Playwright suite (`npm run e2e`, Chromium and
  WebKit, including existing axe checks and the TASK-3.9 record specs on DB v2) passes. SPEC-02 asserts that every
  request goes to the app's own origin. DoD#9 is N/A (not strategy content). DoD#12 is N/A (no new screen). CI is
  green on `doit/TASK-3.10`.
- Verification: command `npm run e2e && gh run list --branch doit/TASK-3.10 --limit 1`

### SPEC-17: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/sessions.md` describes the `sessions` store, its key and every field with its type and
  meaning. It explains the start and per-hand writes, the single-transaction guarantee (D-2), the next-hand state
  (D-3), why an in-progress hand is never stored and is rejected (D-4, with a note that a future live-hand story must
  add HandState and action validation), the v1→v2 upgrade rule (D-5: append `oldVersion < N` steps only; E13 owns
  migrations), the validation on read and `restoreSession`, and how to run the opt-in kill spec.
  `docs/storage/hand-records.md` notes DB v2 and the new cross-field rules. The story doc is published to Backlog.md
  by the doit docs step.
- Verification: manual read of `docs/storage/sessions.md` and `docs/storage/hand-records.md` against this list; `backlog doc list --plain` shows the story doc

## 7. Edge cases
- 0-hand session (left before the first hand ends): only the start record exists (A-3). Covered by SPEC-02's start check.
- Bot busts (cash): SPEC-06. A seat below the top-up minimum: the stored stack is the topped-up stack, because the
  state comes from `nextHand` (SPEC-01 compares against `nextHand`).
- Sit-and-go: `level: 1` and no stake. Covered by SPEC-07 (valid sit-and-go config) and the SPEC-13 sit-and-go record.
  `sessionRecord` on a sit-and-go table is round-tripped in SPEC-01's test file as an extra case.
- Kill during the combined write: the transaction is atomic, so either both writes land or neither does (SPEC-04).
  Kill during a hand: SPEC-03.
- Duplicate hand key: the whole transaction aborts and the session is unchanged (SPEC-04).
- StrictMode double-mounted effect: the start `put` runs twice with identical data and is idempotent.
- Old tab at v1 while a new tab upgrades: the existing `onversionchange` closes the old connection (D-5). A database
  newer than v2: VersionError (SPEC-14), and dealing stops as in TASK-3.9 D-2.
- Hostile stored data (DevTools edits): SPEC-07 to SPEC-13.
- Concurrency (two tabs, two sessions): each mount has its own session id and key. Nothing is shared.

## 8. Security considerations
- Trust boundary: everything read from IndexedDB is untrusted. `getSession` always runs `parseSessionRecord`, which
  runs `assertSessionConfig` and `assertChips` before any `TableState`, `createHand` or `shuffledDeck` call.
  `get` always runs `parseHandRecord`. Failures are fail-closed RangeErrors.
- Hidden information (REQ-025): exactly one user seat equal to `userSeat`, and the record's seat kinds must match
  the config's, so a corrupted record cannot make a bot seat the user's view (SPEC-07). The session record holds no
  hole cards and no replay code, so nothing hidden is stored.
- No HandState or action list is ever restored (D-4), so `applyAction`/`checkState` are not exposed to stored data.
- Type confusion: `Number.isSafeInteger`/`typeof` checks without coercion, `echoValue` never calls a hostile
  `toString`, and `isReplayCode` rejects non-strings (SPEC-09).
- No network: IndexedDB is origin-local (SPEC-02 asserts same-origin requests). No new dependency. Randomness is
  unchanged (the session id is CSPRNG, TASK-3.9 A-8).

## 9. Non-functional
- Write cost: one extra `put` in the existing per-hand strict transaction (a few ms), well inside the 1.5 s pause.
  The deal timing tests (`e2e/next-hand.spec.ts`, `e2e/hand-records.spec.ts`) keep passing.
- Every-push cost: one new Playwright spec (2 hands plus a reload, about 10 s per browser) and three fast Vitest
  files (each under 2 s). The kill spec is opt-in only.
- Coverage: `src/table/session-record.ts` has at least 90% line coverage, driven by SPEC-07 to SPEC-12.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, start a game, play two hands, and look in DevTools → Application → IndexedDB → `tlh-trainer` → `sessions` for one record with `handsPlayed: 2`
- New tests (path → SPEC ids):
  - `tests/storage/session-records.acceptance.test.ts` → SPEC-01, SPEC-04, SPEC-05, SPEC-06
  - `tests/table/session-restore.acceptance.test.ts` → SPEC-07, SPEC-08, SPEC-09, SPEC-10, SPEC-11, SPEC-12
  - `tests/table/hand-record-validation.acceptance.test.ts` → SPEC-13
  - `tests/storage/hand-store.test.ts` (modified) → SPEC-14
  - `e2e/session-records.spec.ts` → SPEC-02; `e2e/session-kill.spec.ts` (opt-in) → SPEC-03
- Judge end-to-end scenario: `npm run build && npm run e2e -- e2e/session-records.spec.ts`, then
  `npm run e2e:slow -- e2e/session-kill.spec.ts` (Chromium). By hand, run `npm run dev`, play 2 hands, reload in
  the middle of hand 3, and check in DevTools that `sessions` shows `handsPlayed: 2` and `hands` has 2 records.

## 11. Open questions
- None. Q-1, Q-2 and Q-3 were answered with the recommended options (see `doit/TASK-3.10/qa.md`).

## 12. Clarifications log
See `doit/TASK-3.10/qa.md`.
