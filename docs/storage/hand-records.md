# Hand records (REQ-052)

Every completed hand is written once to IndexedDB as a permanent hand record. Later screens (hand review,
session report, statistics) rebuild hands from these records. Records are only ever added: nothing in the app
changes or deletes them.

- `src/table/hand-record.ts` (headless): the `HandRecord` type, `handRecord(…)` builder, `parseHandRecord(…)`
  validator and the `HandStore` interface.
- `src/storage/hand-store.ts` (browser): the IndexedDB `HandStore` (`openHandStore`, app-wide
  `sharedHandStore`).
- `src/ui/table/useTableSession.ts`: writes the record when a hand ends and holds the next deal until the
  write has finished.
- The session record written with each hand (database version 2, store `sessions`) is described in
  [sessions.md](sessions.md).

## Database

| Item         | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `3` (the only version marker; no per-store versions) |
| Object store | `hands` (and `sessions` since version 2, see sessions.md)                   |
| Key          | `keyPath: ['sessionId', 'handNumber']` (compound, no auto-increment)        |
| Indexes      | none besides the primary key                                                |

The store is created in `onupgradeneeded` when `oldVersion < 1`; version 2 adds `sessions` when
`oldVersion < 2` and leaves `hands` and its records untouched. Later stores are added the same way with a
higher version and an `oldVersion` check. An open connection closes itself on `versionchange`.

## Record fields

Values are plain structured-clone data. Cards are engine integers 0..51 (`src/engine/cards.ts`).

| Field           | Type                                             | Meaning                                                                                                                         |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId`     | string, 32 lowercase hex                         | One per table mount (new game), from `crypto.getRandomValues(new Uint8Array(16))`                                               |
| `handNumber`    | integer ≥ 1                                      | `TableState.handNumber`                                                                                                         |
| `completedAt`   | string, ISO-8601 UTC                             | When the hand ended, e.g. `2026-11-17T14:32:05.000Z`                                                                            |
| `replayCode`    | string, 32 lowercase hex                         | The hand's replay code                                                                                                          |
| `gameType`      | `'cash'` \| `'sit-and-go'`                       | Game type                                                                                                                       |
| `stake`         | `{ smallBet, bigBet }`                           | Cash stake, or the sit-and-go level limits                                                                                      |
| `level`         | integer ≥ 1 \| null                              | null for cash; the sit-and-go level (1 until TASK-5.4)                                                                          |
| `stakes`        | `{ smallBlind, bigBlind, smallBet, bigBet }`     | Blinds and bets actually played                                                                                                 |
| `lineUp`        | `'Mixed'` \| `'Tough'` \| `'Soft'` \| `'Custom'` | Line-up name                                                                                                                    |
| `button`        | seat 1..10                                       | Dealer button for this hand                                                                                                     |
| `userSeat`      | seat 1..10                                       | The user's seat                                                                                                                 |
| `seats`         | array of seat entries (below), ascending seat    | Every dealt-in seat                                                                                                             |
| `userHoleCards` | `[Card, Card]`                                   | The user's own hole cards                                                                                                       |
| `actions`       | `{ street, seat, type, amount, added }[]`        | Blinds first, then every action in order (`ActionRecord`)                                                                       |
| `decisions`     | decision entries (below), 0..400                 | One per user decision, in order (since TASK-3.12)                                                                               |
| `board`         | `Card[]`, 0..5                                   | Community cards dealt                                                                                                           |
| `shown`         | `{ shown: { seat, holeCards }[] }` \| null       | Hands shown at showdown; null for a fold-out                                                                                    |
| `result`        | `{ endedBy, showdown, awards, returned? }`       | `HandResult`: shown hands with rank, pot awards (`{ pot, amount, winners: { seat, amount }[] }`), and any uncalled bet returned |

Seat entry: `{ seat, kind: 'user' | 'bot', botId, name, style, startingStack }`. `botId` and `style` are null
for the user. `botId` is a whole number unique within the session: at seating, bots get 1..k in ascending seat
order, and a replacement bot gets the next unused number (`TableState.nextBotId`), so a bot is identified
across sessions by `(sessionId, botId)`.

Records do not list bots' unshown hole cards, but they do store the replay code (required by REQ-052.2),
from which the full deck, including every bot's hole cards, can be rebuilt. Screens that read records must
show only the user's cards and cards shown at showdown, and must never deal cards from a stored replay code
for display. Records never hold the user's decision views (`PlayerView`) or the observed-stats snapshots.
Extra fields from a later version are ignored on read.

### Decision entries

Each entry is graded at the moment of the decision, off the main thread (TASK-9.3). Right after the user acts,
`useTableSession` sends the advice worker one `grade` request with that decision's view, action and observed-stats
snapshot (`requestDecisionGrade`, tracked per hand by `src/table/decision-grades.ts`). The worker answers with
`gradeView(view, action.type, userAdviceOptions(observed))`, where `userAdviceOptions` (`src/advice/recommend.ts`)
is also what the worker uses for `recommend`, the hint's request. `decisionEntry(result, decision)` turns the reply
into the stored entry. At hand end `handWrite(table, meta, decisions)` passes these entries to
`handRecord(hand, meta, decisions)`, which copies them and grades nothing; the Hand Review is built from the same
entries (`docs/ui/review.md`). Stats gathered later in the hand or session never change an entry.

`handRecord(hand, meta)` without `decisions` still grades each decision with `decisionRecord(decision)` (the
same result on the calling thread); only tests use it. A `decisions` list whose length differs from the hand's
decisions throws `RangeError('Invalid hand record: decisions')`.

| Field               | Type                                             | Meaning                                                                |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `street`            | `'preflop'` \| `'flop'` \| `'turn'` \| `'river'` | Street of the decision                                                 |
| `action`            | `{ seat, type, amount? }`                        | The user's action (`amount` for call, bet and raise)                   |
| `recommended`       | `{ seat, type, amount? }`                        | The recommended move                                                   |
| `alternative`       | action type \| null                              | A second action the advice also accepts                                |
| `ruleId`            | postflop rule id \| null                         | The postflop rule; null preflop                                        |
| `basis`             | `'chart'` \| `'equity'`                          | `'chart'` preflop, `'equity'` postflop                                 |
| `equityPct`         | number 0..100 \| null                            | Hand equity; null for `'chart'`                                        |
| `requiredEquityPct` | number 0..100 \| null                            | Equity the price needs; null for `'chart'`                             |
| `opponentBasis`     | `{ seat, observedHands, text }[]`                | How each opponent's range was read; `[]` for `'chart'`                 |
| `explanation`       | string, 1..2000                                  | The advice text                                                        |
| `grade`             | `{ grade, ruleId, marginPts }`                   | Grade (`correct`/`minor`/`major`), grading rule and margin             |
| `hinted`            | boolean                                          | True iff the hint was opened at this decision before acting (TASK-8.2) |

The grade is stored as these three fields only, not the whole `GradeResult`: the recommendation it carries is
already flattened into the entry, and the compact form keeps 100,000 records small (REQ-053). `marginPts` is the
equity margin for the margin rules and null otherwise. A preflop fold that ends the user's hand gives exactly one
entry; a hand where the user never acted (bots fold out, big-blind walk) gives `[]`.

## Write before the next deal

1. When a hand ends, `useTableSession` calls `onHandComplete` (exactly once per hand number, read through a ref
   so a new callback each render does not restart any timer). The write waits for the hand's decision grades
   (normally already back from the worker), calls `onHandGraded` with them, builds the record and the updated
   session record with `handWrite(…)` and runs `store.add(record, session)` (one transaction over `hands` and
   `sessions`). If a grade request failed, the write fails (see Write failure).
2. The auto-deal timer still starts at the result (`NEXT_HAND_DELAY_MS`, 1.5 s). When it fires, it waits for
   the write and only then draws the next replay code and deals. "Deal next hand" waits for the write too.
3. So the next hand is dealt at max(1.5 s after the result, write complete). A normal write takes a few
   milliseconds, so there is no visible lag.

`add` uses a readwrite transaction with `{ durability: 'strict' }` and resolves on the transaction's `complete`
event, so a committed record survives the browser process being killed.

## Immutability

For hand records `HandStore` has only `add`, `get` and `count`; there is no put, update or delete
(`putSession`/`getSession` touch only the `sessions` store). `add` of an existing `(sessionId, handNumber)`
rejects with a `ConstraintError` and leaves the stored record, and the session passed with it, unchanged. The hook
never writes a duplicate: each table mount has a new session id and hand numbers only increase. Nothing
deletes records automatically (no age or count limit).

## Write failure

If `add` rejects (for example `QuotaExceededError`, or IndexedDB cannot be opened), or a decision's grade
request failed (the advice worker failed), the app logs
`console.error('Hand record could not be saved', error)` and deals no further hand: neither the auto-deal nor
"Deal next hand". The result stays on screen and Leave table still works. A visible message and Retry arrive
with TASK-13.3.

## Validation on read

Stored data is untrusted (it can be edited in DevTools). `HandStore.get` always runs `parseHandRecord`, which
checks every field above and throws `RangeError('Invalid hand record: <field>')` naming the first bad field,
for example `Invalid hand record: seats[2].botId`. It returns the stored value typed, without copying.

Since TASK-3.10 it also checks the fields against each other and bounds every list:

- Arrays must be dense: a hole is invalid (`actions[2]`).
- Names are 1–40 characters. `actions` holds at most 400 entries; `shown.shown`, `result.showdown`,
  `result.awards` and each `winners` at most 10.
- `level` is null for cash and a whole number ≥ 1 for a sit-and-go.
- `button` and every seat named in `actions`, `shown.shown`, `result.showdown`, award `winners` and
  `result.returned` must be one of the record's `seats`.
- Each seat shows one pair of two different cards; a seat named again must show the same pair, and the
  user's pair is `userHoleCards`. No card appears twice across `board` and the seats' pairs (`cards`).

Since TASK-3.12 it also checks `decisions` (a missing field is invalid: records from earlier builds fail with
`Invalid hand record: decisions` and are not migrated or deleted):

- At most 400 entries. `street` is a street; `action` and `recommended` are the user's seat with a known type
  and a whole amount ≥ 0 for call, bet and raise; `alternative` is null or a known type.
- For `basis: 'chart'`, `ruleId`, `equityPct` and `requiredEquityPct` are null and `opponentBasis` is empty. For
  `'equity'`, `ruleId` is a postflop rule id, both percents are finite 0..100, and `opponentBasis` has at most
  9 entries, each naming one of the record's seats, with `observedHands` null or whole ≥ 0 and `text` of 1–200
  characters.
- `explanation` is 1–2000 characters; `grade.grade` and `grade.ruleId` are known values; `marginPts` is null
  or finite; `hinted` is a boolean.
- The entries match the user's non-blind `actions` one to one, in order: same count (else `decisions`), and the
  same street (`decisions[i].street`), type and amount (`decisions[i].action`).

Error fields name the path, for example `Invalid hand record: decisions[2].grade.ruleId`.

The observed-stats snapshot is checked where it is read (`estimateOpponentRanges`): an entry that is not an
object throws `RangeError('Invalid observed stats entry <i>')`, and a seat that is not a whole number 1..10
throws `RangeError('Invalid observed stats seat <seat>')`. The worker returns these as `ok: false` with a
`RangeError`.

## Test seam

`useTableSession` and `Table` take a `handStore` option (default `sharedHandStore()`, created lazily inside
the effect, so importing the hook in Node never touches IndexedDB). The e2e records harness
(`e2e/support/records-harness.tsx`, never imported from `src/`) injects a store that waits a set time on a
page timer before the real `add`, or one that always rejects. No delay or failure code ships in the app.

Vitest uses `fake-indexeddb` (`new IDBFactory()` per test, passed to `openHandStore`). Playwright reads the
real browser's `tlh-trainer` stores directly at version 2 (`e2e/support/hand-records.ts`: `storedRecords`,
`storedSessions`).

## Kill-the-browser check (opt-in)

`e2e/hand-records-kill.spec.ts` plays 12 hands in Chromium with a persistent profile, sends SIGKILL to every
browser process using that profile once hand 12's record is committed, relaunches and reads the record back.
It is slow, so it runs only on request:

```sh
npm run e2e:slow
# or just this test
TLH_SLOW_TESTS=1 npx playwright test e2e/hand-records-kill.spec.ts --project=chromium
```
