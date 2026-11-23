# Spec: TASK-3.9 — Keep a permanent record of every completed hand

Status: READY (approved 2026-11-23)
Task: TASK-3.9 · Parent/epic: TASK-3 · Requirements: REQ-052 (REQ-052.1, .2, .5, .6, .7) · Dream: limit-holdem-trainer

## 1. Summary
This is the first story that uses IndexedDB. When a hand ends, the table writes one permanent hand record to IndexedDB.
The next hand is dealt only after that write has finished: at the usual 1.5 s pause, or later if the write is slower.
A record holds everything that later screens (review, report, statistics) need to rebuild the hand: session and
hand number, completion time, replay code, game/stake/line-up, every seat with a bot id, every action, board, shown
cards, the user's hole cards and pot awards. Records can be added but never changed. Nothing deletes them
automatically. The `onHandComplete` callback fires exactly once per hand, and a new callback on every render does not
restart the 1.5 s next-hand timer.

## 2. Scope
- In scope:
  - `src/table/hand-record.ts` (headless): the `HandRecord` type, `handRecord(…)` builder, `parseHandRecord(…)`
    validator and the `HandStore` interface.
  - `src/storage/hand-store.ts` (browser): an IndexedDB `HandStore` (`openHandStore`, app-wide `sharedHandStore`) that
    is add-only, rejects a duplicate key and validates records when it reads them.
  - `src/table/session.ts`: per-session bot ids (`TableState.botIds`, `TableState.nextBotId`; a replacement bot gets
    a new id) and `botId` on `CompletedHand.seats`.
  - `src/ui/table/useTableSession.ts`: a session id per table mount. The record is written when the hand ends. The
    auto-deal and `dealNext` wait for that write. `onHandComplete` is read through a ref. A `handStore` option lets
    tests inject a store.
  - A test-only e2e harness with an injectable delayed/failing store and a parent that re-renders with a new callback.
  - Vitest tests that use `fake-indexeddb` (new dev dependency, Q-3) and Playwright tests in the real browser. One
    real kill-the-browser test is opt-in (`npm run e2e:slow`).
  - `docs/storage/hand-records.md`.
- Not doing:
  - No user-decision advice, grade or hinted fields in the record (E03-S10 / TASK-3.12). `CompletedHand.userDecisions`
    is not stored.
  - No sessions store, no session save or resume (TASK-3.10). No settings, last-configuration or reports stores. Only
    the `hands` object store is created.
  - No schema-version field per store and no migrations (REQ-054, E13). The IndexedDB database version (1) is the
    only version marker.
  - No write-failure message, Retry button or Leave action (REQ-053.2, TASK-13.3). This story only stops dealing (Q-2).
  - No `navigator.storage.persist` request (REQ-052.4, TASK-13.2). No Reset all data (E12). No deletion API.
  - No screen, layout, text or visual change. No reading of records by any screen yet.
  - No index other than the primary key. No 100,000-hand capacity or performance work (REQ-053.1, TASK-13.10).
  - No changes to the engine, bots, advice or stats modules.
- Scope budget: files=16, lines=1600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Bot ids are whole numbers that are unique within a session. At seating, bots get 1..k in ascending seat order. Each replacement bot gets the next unused number (`TableState.nextBotId`). The user seat has `botId: null`. A bot is identified across all sessions by (sessionId, botId). | yes | AC#6 needs a replacement to have a different id. Names are user-visible text and are a poor key. A counter in `TableState` is deterministic and replayable. | Use the name as the id; random UUID per bot. |
| A-2 | The two new `TableState` fields are required. The one test-support literal that builds a `TableState` without spreading (`tests/support/table-scenarios.ts:76-88`) gets `botIds: initialBotIds(STORYBOARD_CONFIG.seats)` and `nextBotId: 6`. | yes | Every other literal spreads an existing state (grep of `TableState = {` in tests). | Make the fields optional (weaker typing). |
| A-3 | The readwrite transaction uses `{ durability: 'strict' }`, and the write counts as done at the transaction's `complete` event. | yes | Chromium's default durability is relaxed, which can lose a committed write when the process is killed (AC#1). Strict adds a disk flush of a few ms, well inside the 1.5 s pause. | Default durability. |
| A-4 | The 2 s delay seam (AC#2) is dependency injection: `useTableSession`/`Table` take a `handStore` option. The delaying and failing wrappers exist only in `e2e/support/records-harness.tsx`, which no file under `src/` imports. The shipped bundle therefore has no delay code and no switch that could turn one on. | yes | This follows the existing `createAdviceWorker` seam (`src/ui/table/useTableSession.ts:32-36`) and the test-only harness pattern (`e2e/support/table-harness.tsx:7`). | A build-time `import.meta.env` flag (it could ship enabled by mistake). |
| A-5 | AC#1's "browser process killed right after hand 12 ends" is proven in Chromium only. The test waits until hand 12's record is committed (hand 13 not yet dealt), sends SIGKILL to the browser processes started with the test's `--user-data-dir`, relaunches with the same profile and reads the record. The test is opt-in (`TLH_SLOW_TESTS=1`, `npm run e2e:slow`). Every push instead runs a page-reload check (SPEC-01). | yes | Playwright cannot hard-kill WebKit with a persistent profile portably. The kill test takes about 10–20 s, and slow checks are opt-in. | Run it on every push; use `context.close()` (graceful, not a kill). |
| A-6 | AC#8 is proven by seeding 1,000 valid records with `completedAt` from 730 to 731 days before the test's real time, straight into the `hands` store. The test then reloads the app, plays a hand to the next deal, leaves the table, and checks that all 1,000 records are still present and unchanged. | yes | The app has no time-based logic at all. Seeding is the practical "2 years ago". | Fake the clock 2 years ahead (Playwright clock); this changes nothing in the app either. |
| A-7 | `parseHandRecord` ignores extra properties, so a later story (TASK-3.12) can add advice fields without breaking older readers. It returns the input value typed, without copying. | yes | It is forward compatible, and a read cannot change the stored bytes. | Reject unknown fields. |
| A-8 | The session id is created once per `Table` mount from `crypto.getRandomValues(new Uint8Array(16))` as 32 lowercase hex characters. A new game (a new mount) is a new session. | yes | `getRandomValues` works without a secure context. A `Uint8Array(16)` is not a 4-word `Uint32Array`, so the e2e replay-code stubs and draw counters (`e2e/support/table-harness-bundle.ts:51-61`, `e2e/next-hand.spec.ts:25-33`) are unaffected. TASK-3.10 will move session creation to the session store. | `crypto.randomUUID()` (needs a secure context). |
| A-9 | Every-push e2e cost stays small. The new `e2e/hand-records.spec.ts` runs about 7 short tests per browser under a paused clock (estimated under 40 s in total across Chromium and WebKit, not measured). | yes | The CI budget is about 4 min (TASK-1.50). | Move more of it to `e2e:slow`. |
| A-10 | Existing timing e2e tests (`e2e/next-hand.spec.ts` "28 slices then deal within 4") still pass. The write starts at hand end and finishes in real milliseconds during the 28 Playwright round-trips. If WebKit ever shows the write finishing after the fake 1.5 s timer, the fix goes in the test helper (a real-time wait before the deal check), not in the app. Under the unattended-approval rule this is a routine locked-test re-pin. | yes | The deal must wait for the write (AC#2). Fake clocks do not speed up IndexedDB. | — |

## 3. Current system
- Toolchain: strict TypeScript 6, Vite 8, React 19, Vitest 5 (`environment: 'node'`, v8 coverage), Playwright 1.65
  (Chromium + WebKit, production build served on :4173), ESLint + Prettier (`package.json:9-31`,
  `vite.config.ts:6-21`, `playwright.config.ts:5-25`). There is no jsdom, so React component tests in Vitest only
  use `renderToString` (`tests/ui/table.acceptance.test.tsx:1`), and effects/timers are tested in Playwright harnesses.
- Coverage: at least 90% lines for `src/{engine,bots,advice,stats,playtest,table}/**` and at least 70% overall
  (`vite.config.ts:16-19`).
- Headless lint: `src/table/**` may not use browser globals such as `indexedDB` or import IndexedDB libraries
  (`tools/lint/headless-boundary.js:6-41`). The folder list is pinned by
  `tests/toolchain/headless-lint-dirs.acceptance.test.ts:53-56`. `src/storage/` is a new non-headless folder, so the
  list does not change.
- Hand completion today: `useTableSession` reports each hand once per `handNumber` through the `reported` ref
  (`src/ui/table/useTableSession.ts:67,100-104`). The next deal is a `setTimeout(NEXT_HAND_DELAY_MS)` in the same
  effect (`:105-112`; `src/table/session.ts:315-321`). `onHandComplete` is in the effect's dependency list (`:114`),
  so a caller that passes a new callback each render restarts the timer. `Table` already wraps its prop in a ref
  (`src/ui/table/Table.tsx:229-238`), but the hook itself does not. `dealNext` deals right away (`:121-124`).
- `CompletedHand` (`src/table/session.ts:445-484`) has replayCode, stakes, button, seats (with startingStack), userSeat,
  userHoleCards, actions (`ActionRecord` street/seat/type/amount/added, `src/engine/hand.ts:53-61`), board, shown,
  result (`HandResult`, `src/engine/hand.ts:67-80`) and userDecisions. It has no hand number, session id or bot id.
  Cards are integers (`src/engine/cards.ts:2`). Replacement bots are created in `nextHand`
  (`src/table/session.ts:341-381`).
- `StatHand` (`src/stats/style-stats.ts:5-13`) needs seats[].seat, actions, board and result. `HandRecord` satisfies it.
- E2E patterns: harness bundles built with Vite and served at the app origin (`e2e/support/table-harness-bundle.ts:64-120`).
  Replay words are pinned with `stubReplayWords` (`:51-61`). Paused-clock helpers are `runUntil`/`runUntilMyTurn`
  (`e2e/support/paused-clock.ts`). A preflop fold alone does not open the review, so the next hand deals
  automatically (`src/table/review.ts:31-35`). Slow e2e tests are gated by `TLH_SLOW_TESTS === '1'` and listed in the
  `e2e:slow` script (`e2e/responsive-table.spec.ts:19`, `package.json:20`).
- Existing code to reuse:
  - `src/table/session.ts` → `completedHand`, `tableStake`, `SIT_AND_GO_LEVEL_1`, `BOT_STYLES`, `nextHand`'s replacement branch.
  - `src/engine/deck.ts` → `isReplayCode` for validation.
  - `src/stats/style-stats.ts` → `styleCounts`, `styleStats` for the AC#5 equivalence check.
  - `tests/support/table-scenarios.ts` → `KINGS_SHOWDOWN`, `withFinalStacks`, `SHOWN_HANDS`, `SIDE_POT_SHOWDOWN`, `AVA_UNCONTESTED`.
  - `e2e/support/table-harness-bundle.ts` → `buildIife`, `openHarnessPage`, `stubReplayWords`; `e2e/support/paused-clock.ts` → `runUntil`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format: database `tlh-trainer`, version 1, one object store `hands` with `keyPath: ['sessionId', 'handNumber']`, holding plain structured-clone objects with the fields in §5 (cards as engine integers 0..51, `completedAt` as an ISO-8601 UTC string, `botId` as an integer). Approved as recommended (Q-1). | Epoch-ms `completedAt`; card text such as `"Ah"`; all REQ-052 stores created now; auto-increment key | It is readable and sortable. The compound key makes duplicates impossible. Later stores are added with an `oldVersion` check. | yes | user (Q-1) |
| D-2 | If the write fails, no next hand is dealt (auto or "Deal next hand"). The result stays on screen, Leave table still works, and `console.error('Hand record could not be saved', error)` is logged. No message yet. Approved as recommended (Q-2). | Deal anyway (breaks REQ-052.1); throw into React (blank screen) | This keeps REQ-052.1 ("written before the next hand is dealt") and matches REQ-053.2's "no new hand is dealt", which TASK-13.3 then completes with UI. | yes | user (Q-2) |
| D-3 | Add dev dependency `fake-indexeddb` 6.2.8 (Apache-2.0, no runtime dependencies, free). It is used only in Vitest as `new IDBFactory()` per test. Approved as recommended (Q-3). | Prove storage only in Playwright (slower and heavier on every push) | Fast unit tests in Node for the store, the duplicate rejection, validation and 1,000-record retention. The headless lint already forbids it in headless code (`tools/lint/headless-boundary.js:35-37`). | yes | user (Q-3) |
| D-4 | `useTableSession` starts the write first, then calls `onHandComplete`. Both the auto-deal timer and `dealNext` chain on the write's promise. The deal time is max(1.5 s after the result, write done). | Delay the timer start until the write is done (adds the write time to every hand) | There is no visible lag when the write is faster than 1.5 s, which is the normal case. | no | n/a |
| D-5 | `onHandComplete` is read through a ref inside `useTableSession` and removed from the effect dependencies. | Keep relying on `Table`'s ref | AC#11 states this, and it protects every caller of the hook. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/hand-record.ts` — new, headless: `HandRecord`, `HandRecordSeat`, `HandStore`, `handRecord`, `parseHandRecord`.
- `src/storage/hand-store.ts` — new, browser: `DB_NAME`, `DB_VERSION`, `HANDS_STORE`, `openHandStore`, `sharedHandStore`.
- `src/table/session.ts` — `botIds`/`nextBotId` on `TableState`, `initialBotIds`, a replacement gets a new id, `botId` on `CompletedHand.seats`.
- `src/ui/table/useTableSession.ts` — session id, write on completion, deal gated on the write, `onHandComplete` ref, `handStore` option.
- `tests/support/table-scenarios.ts` — add the two new fields to the `tableAt` literal (A-2).
- `package.json` (+ `package-lock.json`) — `fake-indexeddb` 6.2.8 dev dependency; append `e2e/hand-records-kill.spec.ts` to `e2e:slow`.
- `tests/storage/hand-records.acceptance.test.ts` — new: AC#3–#7 record content and immutability (fake-indexeddb).
- `tests/storage/hand-store.test.ts` — new: store behaviour, validation on read, 1,000 old records.
- `tests/table/hand-record.test.ts` — new: `parseHandRecord` rejections, `handRecord` argument errors, bot ids.
- `e2e/support/records-harness.tsx` — new, test-only harness: Table with an injectable delayed or failing store and a churning parent.
- `e2e/support/table-harness-bundle.ts` — `buildRecordsHarness`, `openRecordsHarness`.
- `e2e/support/hand-records.ts` — new: raw IndexedDB read/seed helpers run in the page, and a fold-until-result helper.
- `e2e/hand-records.spec.ts` — new, acceptance (every push, Chromium + WebKit).
- `e2e/hand-records-kill.spec.ts` — new, acceptance, opt-in slow, Chromium only.
- `docs/storage/hand-records.md` — new: format, write/deal ordering, immutability, test seam.

### Components, interfaces and data
`src/table/hand-record.ts` (imports types from `../engine/*`, `./session`, and `isReplayCode`):
```ts
export interface HandRecordSeat {
  readonly seat: SeatNumber;
  readonly kind: 'user' | 'bot';
  readonly botId: number | null;      // null iff kind === 'user'
  readonly name: string;
  readonly style: BotStyle | null;    // null iff kind === 'user'
  readonly startingStack: number;
}
export interface HandRecord {           // satisfies StatHand
  readonly sessionId: string;          // 32 lowercase hex chars
  readonly handNumber: number;         // 1-based, as TableState.handNumber
  readonly completedAt: string;        // new Date(...).toISOString(), e.g. '2026-11-17T14:32:05.000Z'
  readonly replayCode: ReplayCode;
  readonly gameType: GameType;
  readonly stake: Stake;               // tableStake(config): cash stake or sit-and-go level limits
  readonly level: number | null;       // null for cash; 1 for sit-and-go (until TASK-5.4)
  readonly stakes: Stakes;             // blinds and bets actually played
  readonly lineUp: LineUpName;
  readonly button: SeatNumber;
  readonly userSeat: SeatNumber;
  readonly seats: readonly HandRecordSeat[];   // dealt-in seats, ascending seat order
  readonly userHoleCards: readonly [Card, Card];
  readonly actions: readonly ActionRecord[];   // blinds first, then every action in order
  readonly board: readonly Card[];
  readonly shown: EarlierShowdown | null;      // null for a fold-out
  readonly result: HandResult;                 // includes awards (pot awards) and showdown
}
export interface HandRecordMeta {
  readonly sessionId: string; readonly handNumber: number;
  readonly config: SessionConfig; readonly completedAt: Date;
}
/** Plain-data record; copies arrays/objects so the record shares nothing with live state.
 *  RangeError('Invalid hand record: <field>') on a bad sessionId, handNumber or invalid Date. */
export function handRecord(hand: CompletedHand, meta: HandRecordMeta): HandRecord;
/** Validates an untrusted stored value; returns it typed. RangeError('Invalid hand record: <field>'). */
export function parseHandRecord(value: unknown): HandRecord;
export interface HandStore {
  /** Adds a new record; resolves when the transaction is complete (durable). Rejects with the IndexedDB
   *  error (name 'ConstraintError') if (sessionId, handNumber) already exists; the stored record is unchanged. */
  add(record: HandRecord): Promise<void>;
  /** The validated record, or null if absent. Rejects with parseHandRecord's RangeError if the stored value is invalid. */
  get(sessionId: string, handNumber: number): Promise<HandRecord | null>;
  count(): Promise<number>;
}
```
`HandStore` has no update, put or delete method (REQ-052.5/.6).

`src/storage/hand-store.ts`:
- `DB_NAME = 'tlh-trainer'`, `DB_VERSION = 1`, `HANDS_STORE = 'hands'`.
- `openHandStore(factory: IDBFactory = indexedDB, name = DB_NAME): HandStore`. The database opens lazily on the first
  call and the open promise is cached. `onupgradeneeded`: `if (event.oldVersion < 1) db.createObjectStore('hands',
  { keyPath: ['sessionId', 'handNumber'] })`. `db.onversionchange = () => db.close()`. `add` uses
  `db.transaction('hands', 'readwrite', { durability: 'strict' })` → `store.add(record)` and resolves on
  `oncomplete`. It rejects with `request.error ?? transaction.error` on `onerror`/`onabort`. If opening fails, every
  call rejects with that error.
- `sharedHandStore(): HandStore`: one app-wide `openHandStore()` that is created on first call. It is never called
  at module load, so Node imports of the hook stay safe.

`src/table/session.ts`:
- `TableState` gains `readonly botIds: Readonly<Record<number, number>>` (seat → id, bots only) and `readonly nextBotId: number`.
- `export function initialBotIds(seats: readonly SessionSeat[]): Readonly<Record<number, number>>`: bots in ascending
  seat order get ids 1..k. `seatSession` sets `botIds = initialBotIds(config.seats)` and `nextBotId = k + 1`.
- `nextHand`: a replaced seat gets `botIds[seat] = nextBotId`, then `nextBotId + 1`. Other seats keep their ids.
- `CompletedHand.seats` entries gain `readonly botId: number | null` (`table.botIds[seat] ?? null`).

`src/ui/table/useTableSession.ts`:
- `TableSessionOptions` gains `readonly handStore?: HandStore` (default `sharedHandStore()`, resolved lazily inside
  the effect). `Table` passes it through unchanged via `...options`.
- `const [sessionId] = useState(newSessionId)` (A-8). `const callback = useRef(onHandComplete)`, updated in an
  effect with no dependency list. `const write = useRef<Promise<void>>(Promise.resolve())`.
- The effect's dependency list drops `onHandComplete`.

### Rules and algorithms
1. On the `done` step, if `table.handNumber !== reported.current`: set `reported.current`, then
   `done = completedHand(table)`. If it is non-null:
   `write.current = store.add(handRecord(done, { sessionId, handNumber: table.handNumber, config: table.config,
   completedAt: new Date() }))`. Attach `.catch(e => console.error('Hand record could not be saved', e))` to a
   branch, so a rejection is never unhandled. Then call `callback.current?.(done)`.
2. Auto-deal: when `nextHandDelay(table, holdNextHand)` is non-null, `setTimeout(delay)`. When it fires,
   `write.current.then(onWritten, () => undefined)`. `onWritten` returns if the effect was cleaned up. Otherwise it
   draws `newCode()` and runs `setTable(t => nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t)`. Cleanup
   clears the timer and sets `cancelled`.
3. `dealNext()`: `write.current.then(() => { const code = newCode(); setTable(same updater) }, () => undefined)`.
4. Worked example (AC#2): the result appears at t=0 and the write resolves at t=2000. The timer fires at 1500 and
   waits. At 2000 the code is drawn and hand 2 is dealt. With a normal write (resolves at about 10 ms), hand 2 is
   dealt at 1500.
5. `handRecord` field mapping: `gameType = config.gameType`, `stake = tableStake(config)`,
   `level = gameType === 'sit-and-go' ? 1 : null`, `lineUp = config.lineUp`. Everything else is copied from
   `CompletedHand` (seats mapped to `HandRecordSeat`, in ascending seat order).
6. `parseHandRecord` checks: object non-null. sessionId `/^[0-9a-f]{32}$/`. handNumber is a safe integer ≥ 1.
   completedAt is a string with `new Date(s).toISOString() === s`. `isReplayCode(replayCode)`. gameType is in
   cash|sit-and-go. stake.smallBet/bigBet are integers > 0. level is null or an integer ≥ 1. stakes has 4 integers ≥ 0.
   lineUp is in Mixed|Tough|Soft|Custom. button and userSeat are integers 1..10. seats is an array of 2..10 entries:
   seat is an integer 1..10, unique; kind is user|bot; botId is null iff user, otherwise an integer ≥ 1; name is a
   non-empty string; style is null iff user, otherwise in `BOT_STYLES`; startingStack is an integer ≥ 0. Exactly one
   user seat, equal to userSeat. userHoleCards is 2 cards. A card is an integer 0..51. actions is an array of
   {street in preflop|flop|turn|river, seat integer, type in the 7 `ActionRecord` types, amount and added integers ≥ 0}.
   board is 0..5 cards. shown is null or `{shown: [{seat, holeCards: 2 cards}]}`. result has endedBy fold|showdown,
   showdown `[{seat, holeCards, rank integer}]`, awards `[{pot, amount, winners: [{seat, amount}]}]` with integers
   ≥ 0, and returned absent or `{seat, amount}`. The first failing field is named in the message, for example
   `Invalid hand record: seats[2].botId`.

### Error handling and configuration
- Write failure: D-2 (no deal, console error). Duplicate key: the store rejects with `ConstraintError`. The hook
  never writes a duplicate (a new session id per mount, hand numbers increase).
- Invalid stored record on read: `RangeError('Invalid hand record: <field>')`.
- No configuration. The database name and version are constants.

## 6. Behaviour specification

### SPEC-01: Record readable when the next hand is dealt, and after a reload
- Verifies: AC#1, DoD#1, DoD#7
- Behaviour: Given the app at `/` with replay words pinned to `[0x9e3779b9, 1, 2, 3]` and a paused clock, When the
  user starts the default game and folds to the result of hand 1, Then at the first moment the header reads
  `… Hand #2`, the `hands` store holds exactly 1 record, with `handNumber` 1, `replayCode` equal to the pinned code and
  `sessionId` matching `/^[0-9a-f]{32}$/`. After `page.reload()` the same record is still stored, and its JSON is
  identical.
- Verification: acceptance `e2e/hand-records.spec.ts::a hand's record is readable when the next hand is dealt and after a reload`

### SPEC-02: Hand 12 survives a killed browser
- Verifies: AC#1, DoD#1
- Behaviour: Given Chromium launched with a persistent profile in a temp dir and the app at `/` (pinned words,
  paused clock), When the user folds through 12 hands, hand 12's result is shown, its record is committed (raw
  read count = 12, header still `Hand #12`), and every browser process started with that `--user-data-dir` is sent
  SIGKILL, Then after relaunching with the same profile and opening `/`, the store holds 12 records and the record
  with `handNumber` 12 is present with that session's id. The test skips unless `TLH_SLOW_TESTS=1` and the project is chromium.
- Verification: acceptance `e2e/hand-records-kill.spec.ts::hand 12's record survives a killed browser process`

### SPEC-03: The next hand waits for a delayed write
- Verifies: AC#2, DoD#1
- Behaviour: Given the records harness with a store that waits 2000 ms (page timer, so it is under the paused clock)
  before calling the real `add`, When hand 1's result appears at fake time T, Then at T+1900 the header still reads
  `Hand #1` and the store holds 0 records. Hand 2 is dealt only after the record is stored: the harness event log has
  `saved:1` before `header:2`, and the deal's fake time is ≥ T+2000. The production `src/` tree contains no delay code
  (A-4).
- Verification: acceptance `e2e/hand-records.spec.ts::the next hand is not dealt until a 2 s delayed write completes`

### SPEC-04: "Deal next hand" also waits for the write
- Verifies: AC#2
- Behaviour: Given the records harness with the 2000 ms delayed store, When the user calls preflop (the review
  opens and holds the hand) and clicks "Deal next hand" at once after the result, Then the header stays `Hand #1`
  until the delayed write completes, and only then shows `Hand #2`.
- Verification: integration `e2e/hand-records.spec.ts::Deal next hand waits for the write`

### SPEC-05: Completion date and time
- Verifies: AC#3, DoD#1
- Behaviour: Given the page clock fixed at `2026-11-17T14:32:05Z` (`page.clock.setFixedTime`), When hand 1
  completes, Then its stored `completedAt` is `'2026-11-17T14:32:05.000Z'`. Given `handRecord(…, { completedAt: new
  Date('2026-11-17T14:32:05Z') })`, Then the record read back from the store has the same `completedAt`.
- Verification: acceptance `e2e/hand-records.spec.ts::the record stores the time the hand completed` and acceptance `tests/storage/hand-records.acceptance.test.ts::completedAt is the time the hand completed`

### SPEC-06: Scripted $4/$8 showdown record holds the scripted values
- Verifies: AC#4, DoD#1
- Behaviour: Given `KINGS_SHOWDOWN` (default $4/$8 cash, Custom line-up, reaches showdown) written with session id
  `'0123456789abcdef0123456789abcdef'` and hand number 7 to a fake-indexeddb store, When it is read back with `get`,
  Then it equals literal expected values written out in the test: sessionId, handNumber 7, the scripted replay code,
  gameType `'cash'`, stake `{ smallBet: 4, bigBet: 8 }`, level null, lineUp `'Custom'`, seats 1..6 with names
  Ava, Ben, Cal, Dee, You, Eli, botIds 1, 2, 3, 4, null, 5, styles TAG ×4/null/TAG and the scripted starting stacks,
  the scripted button, board, `shown`, the user's hole cards and `result.awards`.
- Verification: acceptance `tests/storage/hand-records.acceptance.test.ts::a scripted $4/$8 showdown record holds the scripted values`

### SPEC-07: Every action in order, and style stats from records equal live stats
- Verifies: AC#5, DoD#1
- Behaviour: Given a scripted hand (`SHOWN_HANDS`), When its record is read, Then `record.actions` equals the hand's
  `ActionRecord` list in order (blinds first; each with street, seat, type and amount). Given at least 30 consecutive
  hands played with `seatSession`/`dealHand`/`stepBot`, the user acting by `tagPolicy` on its own view via
  `applyUserAction`, and replay codes `replayCodeFromWords([i, 1, 2, 3])`, each written and read back through a
  fake-indexeddb store, Then for every seat `styleStats(styleCounts(records, seat))` equals the same from the live
  `CompletedHand`s, with at least one showdown and one fold-out among the hands.
- Verification: acceptance `tests/storage/hand-records.acceptance.test.ts::every action is stored in order and style stats from records equal live stats`

### SPEC-08: A replacement bot has a different id, name and starting stack
- Verifies: AC#6, DoD#1
- Behaviour: Given hand 7, where seat 1 starts with a stack other than $160 and finishes on $0, and `nextHand` then
  deals hand 8, When records for hands 7 and 8 are built and read back, Then seat 1's `botId`, `name` and
  `startingStack` all differ between hand 7 and hand 8 (hand 8: a new id equal to the previous `nextBotId`, the
  replacement name, $160). Every other seat keeps its `botId`.
- Verification: acceptance `tests/storage/hand-records.acceptance.test.ts::a replaced bot has a different id, name and starting stack`

### SPEC-09: A stored record never changes
- Verifies: AC#7, DoD#1
- Behaviour: Given the app at `/` (pinned words, paused clock), When hand 1's record is read as JSON, two more hands
  complete, and the user clicks Leave table, Then hand 1's record read again is JSON-identical, and the store holds
  exactly 3 records.
- Verification: acceptance `e2e/hand-records.spec.ts::a stored record is unchanged by later hands and leaving the table`

### SPEC-10: A second write to the same session and hand is rejected
- Verifies: AC#7, DoD#1
- Behaviour: Given a fake-indexeddb store holding record R for (s, 1), When `add` is called with a different record
  for (s, 1), Then it rejects with an error whose `name` is `'ConstraintError'`, `get(s, 1)` still deep-equals R, and
  `count()` is 1. The `HandStore` object has no `put`, `update` or `delete` property.
- Verification: acceptance `tests/storage/hand-records.acceptance.test.ts::a write to an existing session and hand number is rejected`

### SPEC-11: 1,000 two-year-old records are kept
- Verifies: AC#8, DoD#1, DoD#8
- Behaviour: Given 1,000 valid records (session `'f'×32`, hands 1..1000, `completedAt` 730–731 days before now)
  seeded into `tlh-trainer`/`hands` at the app origin, When the app is reloaded, a game is started, hand 1 is
  folded to its result and hand 2 is dealt, and the user leaves the table, Then the store holds 1,001 records, and
  each seeded record is JSON-identical to what was seeded. Every request the page made during the test was to the
  app's own origin (DoD#8).
- Verification: acceptance `e2e/hand-records.spec.ts::1,000 records from 2 years ago are kept after launch and play`

### SPEC-12: Store retention and reads (unit)
- Verifies: AC#8, AC#1
- Behaviour: Given a fake-indexeddb factory holding 1,000 records written through one store, When a new
  `openHandStore` on the same factory adds one record, Then `count()` is 1,001 and a sample of the old records (first,
  500th, last) `get` deep-equals what was written. `get` of a missing key resolves null. When opening the database
  fails, `add` rejects.
- Verification: unit `tests/storage/hand-store.test.ts::a new store keeps 1,000 old records`

### SPEC-13: onHandComplete fires once per hand, also with the same replay code
- Verifies: AC#9, AC#10, DoD#1
- Behaviour: Given the records harness with every replay code pinned to the same words and a parent that
  re-renders with a new `onHandComplete` every 100 ms, When 3 hands complete (the user folds at each turn), Then the
  harness counted exactly 3 calls: 1 call after hand 1's result, still 1 at the end of hand 1's 1.5 s pause despite
  about 15 re-renders, and 2 and 3 after hands 2 and 3. Each call's argument has the pinned `replayCode`, and the
  store holds records for hands 1, 2 and 3, all with that replay code.
- Verification: acceptance `e2e/hand-records.spec.ts::onHandComplete fires exactly once per hand even with the same replay code`

### SPEC-14: A new callback each render does not restart the next-hand timer
- Verifies: AC#11, DoD#1
- Behaviour: Given the records harness whose parent re-renders with a new `onHandComplete` every 100 ms (fake
  clock), When hand 1's result appears at fake T, Then the header still reads `Hand #1` at T+1400 and reads
  `Hand #2` by T+1600. If the timer were restarted, hand 2 would never be dealt.
- Verification: acceptance `e2e/hand-records.spec.ts::a new onHandComplete on each render does not restart the 1.5 s timer`

### SPEC-15: A failed write stops dealing
- Verifies: AC#2
- Behaviour: Given the records harness with a store whose `add` rejects with `new DOMException('full',
  'QuotaExceededError')`, When hand 1's result appears and 5,000 fake ms pass, Then the header still reads
  `Hand #1`, the result is still shown, the console logged `Hand record could not be saved`, there was no unhandled
  rejection, and the Leave table button is enabled (D-2).
- Verification: integration `e2e/hand-records.spec.ts::a failed write stops dealing`

### SPEC-16: Validation of stored records
- Verifies: DoD#1
- Behaviour: Given `parseHandRecord`, When given a valid record, Then it returns it unchanged (`toBe`). When given
  non-objects or a record with each of these faults: bad sessionId, handNumber 0, a non-ISO `completedAt`, an invalid
  replay code, an unknown gameType, lineUp, style, street or action type, card 52, a user seat with a botId, a
  missing `result.awards`, or a negative amount, Then it throws `RangeError` naming the field. A store `get` over a
  raw-corrupted stored value rejects with that RangeError. `handRecord` throws RangeError for an invalid Date,
  handNumber 0 or a bad sessionId.
- Verification: unit `tests/table/hand-record.test.ts::parseHandRecord rejects malformed records`

### SPEC-17: Bot ids at seating and replacement
- Verifies: AC#6
- Behaviour: `seatSession()` gives `botIds` `{1:1, 2:2, 3:3, 4:4, 6:5}` and `nextBotId` 6. `seatSession` for 10
  players gives ids 1..9 by ascending bot seat. After two successive replacements of seats 1 and 6, the ids are 6
  and 7 and `nextBotId` is 8. A sit-and-go `nextHand` never changes ids. `completedHand(...).seats` carries the
  matching `botId` (null for the user).
- Verification: unit `tests/table/hand-record.test.ts::bot ids are assigned at seating and on replacement`

### SPEC-18: Repo checks, coverage, headless boundary, golden suite, playtest
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors. The golden-spot suite passes
  100%. Coverage stays at least 90% for `src/table/**` and at least 70% overall. `src/table/hand-record.ts` uses no
  browser globals and no IndexedDB imports (headless lint). `npm run -s playtest -- --hands 10000 --seed 42` reports
  `Invariant violations: 0`.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-19: Documentation
- Verifies: DoD#11
- Behaviour: `docs/storage/hand-records.md` describes the database, store, key and every record field with its type.
  It explains the write-before-deal ordering and timing (D-4), immutability (add-only, ConstraintError), the
  failure behaviour (D-2), validation on read, the `handStore` test seam and how the delay is injected, and how to
  run the opt-in kill test. The story doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/storage/hand-records.md` against this list; `backlog doc list --plain` shows the story doc

### SPEC-20: Browsers, N/A items and CI
- Verifies: DoD#7, DoD#9, DoD#10, DoD#12
- Behaviour: No screen or dialog is added or changed. The changed table flow is covered by the full Playwright
  suite in Chromium and WebKit (`npm run e2e`, including existing axe checks), which passes. DoD#9 is N/A (not
  strategy content). DoD#12 is N/A (no new screen; the service worker does not exist yet). CI is green on `doit/TASK-3.9`.
- Verification: command `npm run e2e && gh run list --branch doit/TASK-3.9 --limit 1`

## 7. Edge cases
- Same replay code on consecutive hands: SPEC-13 (dedupe keys on handNumber, not replay code).
- Re-renders while the hand is done (repeat completion): SPEC-13, SPEC-14.
- Write slower than the 1.5 s pause: SPEC-03, SPEC-04. Write failure, including quota: SPEC-15.
- Duplicate key: SPEC-10. Corrupt or tampered stored value: SPEC-16.
- Hold toggled (review) while the write is pending: the cleanup cancels the pending deal, and the next effect run
  chains on the same `write.current` (rules 2–3).
- Unmount (Leave table) while the write is pending: the write still completes. The deal callback is cancelled.
  SPEC-09 covers leaving.
- Fold-out (no showdown): `shown` null and `result.showdown` empty. Covered in SPEC-07's mix and SPEC-16's valid cases.
- Sit-and-go: `stake` = level-1 limits, `level` 1. A unit case in `tests/table/hand-record.test.ts` (under SPEC-16's test file).
- 10-player table: ids 1..9 (SPEC-17).
- Browser killed mid-write: the transaction is atomic, so the record is either fully present or absent. AC#1 is about
  a kill after the write is committed (SPEC-02).
- IndexedDB unavailable (opening fails): SPEC-12 (rejects) and D-2 (no deal).
- Node / `renderToString` callers: effects do not run, and `sharedHandStore` is never called at import.

## 8. Security considerations
- Trust boundary: data read back from IndexedDB is untrusted, because a user or extension can edit it in DevTools.
  `HandStore.get` always runs `parseHandRecord` (§5 rule 6), as the TASK-7.12 security review recommended. Invalid
  data fails closed with a RangeError. Records are never `eval`'d or rendered as HTML.
- Hidden information: the record stores the user's own hole cards and cards shown at showdown, from `showdownOf`
  and `result.showdown`. It never stores bots' unshown hole cards, so a future review or stats screen built on
  records cannot leak mucked hands.
- No network: IndexedDB is local to the origin, and SPEC-11 asserts only same-origin requests (REQ-058.1). No
  personal data: the session id is random and holds no user information.
- Randomness: the session id uses `crypto.getRandomValues` (CSPRNG). Replay-code and bot randomness are untouched (A-8).
- New dependency: `fake-indexeddb` is dev-only, Apache-2.0, with no transitive dependencies. It is not in the
  shipped bundle, and the headless lint forbids it in headless code. `npm audit` still runs in CI.
- Test seam: delay and failure wrappers live only under `e2e/support/` (A-4). Nothing in `src/` reads a flag that
  enables them.

## 9. Non-functional
- No visible lag: with a normal write, hand N+1 is dealt 1400–1600 fake ms after hand N's result (SPEC-14, and the
  existing `e2e/next-hand.spec.ts` "28 slices then within 4"). The deal time is max(1.5 s, write done) (D-4).
- Write cost: one small `add` per hand with strict durability, expected to take well under 100 ms (A-3, not measured).
- Every-push cost: about 7 new e2e tests per browser plus about 3 fast Vitest files (A-9). The kill test is opt-in
  (`npm run e2e:slow`).
- Coverage: `src/table/hand-record.ts` needs at least 90% lines (SPEC-16 drives the parser branches).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then start a game, play two hands, and look in DevTools → Application → IndexedDB → `tlh-trainer` → `hands` for one record per completed hand
- New tests:
  - `tests/storage/hand-records.acceptance.test.ts` → SPEC-05 (unit half), SPEC-06, SPEC-07, SPEC-08, SPEC-10 (locked after first green build)
  - `tests/storage/hand-store.test.ts` → SPEC-12
  - `tests/table/hand-record.test.ts` → SPEC-16, SPEC-17 (+ sit-and-go mapping)
  - `e2e/hand-records.spec.ts` → SPEC-01, SPEC-03, SPEC-04, SPEC-05, SPEC-09, SPEC-11, SPEC-13, SPEC-14, SPEC-15 (locked after first green build)
  - `e2e/hand-records-kill.spec.ts` → SPEC-02 (locked; opt-in `TLH_SLOW_TESTS=1`, Chromium)
- Judge end-to-end:
  1. `npm run lint && npm run typecheck && npm test` pass.
  2. `npx playwright test e2e/hand-records.spec.ts` passes in Chromium and WebKit.
  3. `TLH_SLOW_TESTS=1 npx playwright test e2e/hand-records-kill.spec.ts --project=chromium` passes.
  4. `npm run e2e` passes (existing timing tests unchanged).
  5. `grep -rn "records-harness\|setTimeout" src/storage src/table/hand-record.ts` finds nothing (no delay code ships).
  6. As a user: `npm run dev`, play two hands, then check DevTools IndexedDB `tlh-trainer/hands`: two records with
     handNumber 1 and 2, the same sessionId, and completedAt times that match the clock.

## 11. Open questions
- Approved as recommended (Q-1)., integer cards, ISO UTC `completedAt`, integer per-session `botId`, 32-hex `sessionId`)? Recommended: yes.]
- Approved as recommended (Q-2).
- Approved as recommended (Q-3).

## 12. Clarifications log
See `doit/TASK-3.9/qa.md`.
