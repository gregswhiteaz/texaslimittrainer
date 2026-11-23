# Session records (REQ-052.3)

The table saves its session to IndexedDB when it starts and again after every completed hand, so a closed or
killed browser loses at most the hand in progress. The record holds everything Resume (E02: TASK-2.6,
TASK-2.14) needs to deal the next hand. This story only writes and validates it; there is no Resume screen
yet.

- `src/table/session-record.ts` (headless): the `SessionRecord` type, `sessionRecord(…)`, `handWrite(…)`,
  `parseSessionRecord(…)` and `restoreSession(…)`.
- `src/table/session.ts`: `assertSessionConfig(…)`, the config rules shared by records and
  `resolveSessionConfig`.
- `src/storage/hand-store.ts` (browser): the `sessions` store and `HandStore.add(record, session)`,
  `putSession`, `getSession`.
- `src/ui/table/useTableSession.ts`: the start write and the per-hand write.

## Database

| Item         | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `2` (the only version marker)                 |
| Object store | `sessions` (next to `hands`, see [hand-records.md](hand-records.md)) |
| Key          | `keyPath: 'sessionId'`; one record per session, replaced (`put`)     |
| Indexes      | none (no "find the paused session" query until E02)                  |

## Fields

| Field         | Type                                 | Meaning                                                                                                                                   |
| ------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId`   | string, 32 lowercase hex             | The table mount's id, the same as its hand records' `sessionId`                                                                           |
| `startedAt`   | string, ISO-8601 UTC                 | When the table started                                                                                                                    |
| `updatedAt`   | string, ISO-8601 UTC                 | The last write: the start time, then each completed hand's `completedAt`                                                                  |
| `config`      | `SessionConfig`                      | The starting configuration as played: game type, players, stake (cash), line-up, seat names and styles, speed, user seat, starting button |
| `handsPlayed` | integer ≥ 0                          | Completed hands; 0 in the start record                                                                                                    |
| `seats`       | seat entries (below), ascending seat | The seats ready for the next hand                                                                                                         |
| `button`      | seat 1..10                           | Dealer button of the next hand to be dealt                                                                                                |
| `rebuys`      | integer ≥ 0                          | Always 0 until TASK-3.11 adds the user's rebuy (bot replacements are not rebuys)                                                          |
| `level`       | integer ≥ 1 \| null                  | null for cash; the sit-and-go level (1 until TASK-5.4)                                                                                    |
| `nextBotName` | integer ≥ 0                          | Position of the next replacement bot name (`TableState.nextBotName`)                                                                      |
| `nextBotId`   | integer ≥ 1                          | The id the next replacement bot gets (`TableState.nextBotId`)                                                                             |

Seat entry: `{ seat, kind: 'user' | 'bot', botId, name, style, stack }`. `botId` and `style` are null for the
user; a bot's `botId` is unique and below `nextBotId`. `name` is 1–40 characters. `stack` is the seat's chips
before the next hand. The seat numbers and kinds always equal `config.seats`. The record holds no hole cards
and no replay code.

## The state stored: ready for the next hand

The record is built from `nextHand(table)`, the state the next deal uses: final stacks carried, a busted cash
bot already replaced (new `botId`, name, style and $160 at $4/$8), the TEMPORARY short-stack top-up applied
and the button moved one seat. `handsPlayed` is the number of the hand just completed. So restoring needs no
game logic: `restoreSession(sessionRecord(nextHand(t), meta))` deep-equals `nextHand(t)`.

## When it is written

1. **Start.** When the table mounts, `useTableSession` puts the start record (`handsPlayed: 0`) built from
   the seated table. A failure is logged as `console.error('Session could not be saved', error)` and does not
   stop dealing, since every hand's write puts the full record anyway. A session left before its first hand
   ends keeps only this record (E10 will discard such sessions).
2. **After each hand.** When a hand ends, `handWrite(table, …)` returns the hand record and the session
   record, and `store.add(record, session)` writes both in **one** readwrite transaction over
   `['hands', 'sessions']` with `{ durability: 'strict' }`, after the start write has settled. The next hand
   is dealt only once it completes (as for hand records), and a failed write deals nothing more.

Because the hand and its session update are one transaction, either both are stored or neither is: after any
crash the session's `handsPlayed` equals the highest stored hand number of that session. If the hand key
already exists, the whole transaction aborts with `ConstraintError` and the stored session is unchanged.

## No hand in progress is ever stored

The session format never holds a hand in progress or its actions; an unfinished hand is simply lost.
`parseSessionRecord` rejects any record with a `hand` or `actions` property
(`Invalid session record: hand` / `actions`), and `restoreSession` always returns `hand: null` with no user
decisions and never applies an action. So no stored `HandState` or action can reach the engine. A future story
that saves a live hand must first add full `HandState` validation (with `checkState`) and action validation.

## Validation on read and restore

Stored data is untrusted. `getSession` always runs `parseSessionRecord`, and `restoreSession` runs it before
building anything. In order it checks:

- a non-array object without `hand` or `actions` (other unknown properties are ignored);
- `sessionId`, and `startedAt`/`updatedAt` as ISO strings that round-trip through `toISOString`;
- `assertSessionConfig(config)`: a known game type (a cash stake that passes the engine's stake rules, no
  stake in a sit-and-go), `players` equal to the number of seats, dense ascending seats 1..10, names of 1–40
  characters, exactly one user seat equal to `userSeat` with no style, a known style on every bot, a seated
  `button`, and a known line-up and speed;
- the counters, and `level` against the game type;
- `seats`: dense, the same seat numbers and kinds as `config.seats`, valid `botId`s, styles and names;
- `button` is one of the seats;
- the engine's `assertChips` on the stakes and stacks: every stack a safe integer of at least 1 and the
  stacks totalling at most `Number.MAX_SAFE_INTEGER`, with `createHand`'s own messages.

Every failure is a `RangeError` naming the field (`Invalid session record: <field>`,
`Invalid session config: <field>`) or the engine's message. Checks use `Number.isSafeInteger` and `typeof`, so
objects and arrays such as `{"toString":1}` or `[3]` are rejected without being coerced.

`restoreSession` then returns the `TableState` ready to deal hand `handsPlayed + 1`.

## Upgrades

Version 1 created `hands`; version 2 adds `sessions`. `onupgradeneeded` runs each missing step
(`if (oldVersion < 1)`, `if (oldVersion < 2)`) and never touches existing stores or records. A later version
must append another `if (oldVersion < N)` step only. Formal migrations and per-store schema versions belong to
E13 (REQ-054). A tab still open at version 1 closes its connection on `versionchange`; a database newer than
the app makes every call reject with `VersionError` and dealing stops.

## Tests

- `tests/storage/session-records.acceptance.test.ts`, `tests/table/session-restore.acceptance.test.ts`,
  `tests/storage/hand-store.test.ts` (Vitest with `fake-indexeddb`).
- `e2e/session-records.spec.ts` (every push): the start record, the record after hand 2 and a reload in the
  middle of hand 3.
- `e2e/session-kill.spec.ts` (opt-in, Chromium): plays 10 hands, deals hand 11, sends SIGKILL to the browser
  and checks after relaunch that the session is still the one from the end of hand 10:

```sh
npm run e2e:slow
# or just this test
TLH_SLOW_TESTS=1 npx playwright test e2e/session-kill.spec.ts --project=chromium
```
