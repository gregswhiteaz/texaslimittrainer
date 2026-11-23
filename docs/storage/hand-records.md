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

## Database

| Item         | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `1` (the only version marker; no per-store versions) |
| Object store | `hands` (the only store so far)                                             |
| Key          | `keyPath: ['sessionId', 'handNumber']` (compound, no auto-increment)        |
| Indexes      | none besides the primary key                                                |

The store is created in `onupgradeneeded` when `oldVersion < 1`. Later stores are added the same way with a
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
for display. Records never hold the user's decision views or advice and grades
(`CompletedHand.userDecisions` is not stored). Extra fields from a later version are ignored on read.

## Write before the next deal

1. When a hand ends, `useTableSession` builds the record with `handRecord(…)` and starts `store.add(record)`,
   then calls `onHandComplete` (exactly once per hand number, read through a ref so a new callback each render
   does not restart any timer).
2. The auto-deal timer still starts at the result (`NEXT_HAND_DELAY_MS`, 1.5 s). When it fires, it waits for
   the write and only then draws the next replay code and deals. "Deal next hand" waits for the write too.
3. So the next hand is dealt at max(1.5 s after the result, write complete). A normal write takes a few
   milliseconds, so there is no visible lag.

`add` uses a readwrite transaction with `{ durability: 'strict' }` and resolves on the transaction's `complete`
event, so a committed record survives the browser process being killed.

## Immutability

`HandStore` has only `add`, `get` and `count`; there is no put, update or delete. `add` of an existing
`(sessionId, handNumber)` rejects with a `ConstraintError` and leaves the stored record unchanged. The hook
never writes a duplicate: each table mount has a new session id and hand numbers only increase. Nothing
deletes records automatically (no age or count limit).

## Write failure

If `add` rejects (for example `QuotaExceededError`, or IndexedDB cannot be opened), the app logs
`console.error('Hand record could not be saved', error)` and deals no further hand: neither the auto-deal nor
"Deal next hand". The result stays on screen and Leave table still works. A visible message and Retry arrive
with TASK-13.3.

## Validation on read

Stored data is untrusted (it can be edited in DevTools). `HandStore.get` always runs `parseHandRecord`, which
checks every field above and throws `RangeError('Invalid hand record: <field>')` naming the first bad field,
for example `Invalid hand record: seats[2].botId`. It returns the stored value typed, without copying.

## Test seam

`useTableSession` and `Table` take a `handStore` option (default `sharedHandStore()`, created lazily inside
the effect, so importing the hook in Node never touches IndexedDB). The e2e records harness
(`e2e/support/records-harness.tsx`, never imported from `src/`) injects a store that waits a set time on a
page timer before the real `add`, or one that always rejects. No delay or failure code ships in the app.

Vitest uses `fake-indexeddb` (`new IDBFactory()` per test, passed to `openHandStore`). Playwright reads the
real browser's `tlh-trainer/hands` directly (`e2e/support/hand-records.ts`).

## Kill-the-browser check (opt-in)

`e2e/hand-records-kill.spec.ts` plays 12 hands in Chromium with a persistent profile, sends SIGKILL to every
browser process using that profile once hand 12's record is committed, relaunches and reads the record back.
It is slow, so it runs only on request:

```sh
npm run e2e:slow
# or just this test
TLH_SLOW_TESTS=1 npx playwright test e2e/hand-records-kill.spec.ts --project=chromium
```
