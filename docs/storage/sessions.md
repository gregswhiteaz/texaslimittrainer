# Session records (REQ-052.3)

The table saves its session to IndexedDB when it starts and again after every completed hand, so a closed or
killed browser loses at most the hand in progress. The record holds everything Resume (E02: TASK-2.6,
TASK-2.14) needs to deal the next hand. Home's Resume session entry (TASK-2.6) reads it back; see
[Resume](#resume-from-home).

- `src/table/session-record.ts` (headless): the `SessionRecord` type, `sessionRecord(…)`, `handWrite(…)`,
  `parseSessionRecord(…)`, `restoreSession(…)`, `restoreObserved(…)` and `findPausedSession(…)`.
- `src/table/session.ts`: `assertSessionConfig(…)`, the config rules shared by records and
  `resolveSessionConfig`.
- `src/storage/hand-store.ts` (browser): the `sessions` store and `HandStore.add(record, session)`,
  `putSession`, `getSession`, `pausedSession`, and `endPausedSessions` ([reports.md](reports.md)).
- `src/ui/config/EndSessionDialog.tsx`: the confirmation shown by Start game when a session is paused.
- `src/ui/table/useTableSession.ts`: the start write and the per-hand write, and the `resume` option.
- `src/ui/App.tsx` and `src/ui/home/HomeScreen.tsx`: the Resume session entry.

## Database

| Item         | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `5` (the only version marker)                 |
| Object store | `sessions` (next to `hands`, see [hand-records.md](hand-records.md)) |
| Key          | `keyPath: 'sessionId'`; one record per session, replaced (`put`)     |
| Indexes      | none (`pausedSession` reads every record with `getAll`)              |

## Fields

| Field         | Type                                   | Meaning                                                                                                                                                                    |
| ------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId`   | string, 32 lowercase hex               | The table mount's id, the same as its hand records' `sessionId`                                                                                                            |
| `startedAt`   | string, ISO-8601 UTC                   | When the table started                                                                                                                                                     |
| `updatedAt`   | string, ISO-8601 UTC                   | The last write: the start time, then each completed hand's `completedAt`                                                                                                   |
| `config`      | `SessionConfig`                        | The starting configuration as played: game type, players, stake (cash), line-up, seat names and styles, speed, user seat, starting button                                  |
| `handsPlayed` | integer 0..`MAX_SESSION_COUNT`         | Completed hands; 0 in the start record                                                                                                                                     |
| `seats`       | seat entries (below), ascending seat   | The seats ready for the next hand                                                                                                                                          |
| `button`      | seat 1..10                             | Dealer button of the next hand to be dealt                                                                                                                                 |
| `rebuys`      | integer 0..`MAX_SESSION_COUNT`         | The user's rebuys, stored with the next completed hand (TASK-3.11 A-1); bot replacements are not rebuys                                                                    |
| `level`       | integer ≥ 1 \| null                    | null for cash; the sit-and-go level (1 until TASK-5.4)                                                                                                                     |
| `nextBotName` | integer 0..`MAX_SESSION_COUNT`         | Position of the next replacement bot name (`TableState.nextBotName`)                                                                                                       |
| `nextBotId`   | integer 1..`MAX_SESSION_COUNT`         | The id the next replacement bot gets (`TableState.nextBotId`)                                                                                                              |
| `endedAt`     | string, ISO-8601 UTC \| null, optional | When the session was ended. Absent or null = not ended (paused). Written only by `endSession` (Leave table) and `endPausedSessions` (Start game, [reports.md](reports.md)) |
| `observed`    | observed entries (below), optional     | The seated bots' observed counts this session (TASK-8.6). Absent in start records and records saved before TASK-8.6 = nothing observed                                     |

Seat entry: `{ seat, kind: 'user' | 'bot', botId, name, style, stack }`. `botId` and `style` are null for the
user; a bot's `botId` is unique and below `nextBotId`. `name` is 1–40 characters. `stack` is the seat's chips
before the next hand: at least 1, except that the **user** seat of a cash session may hold 0, meaning busted
and waiting at Rebuy / Leave table (TASK-3.11 D-1). The seat numbers and kinds always equal `config.seats`. The record holds no hole cards
and no replay code.

### Observed counts

Observed entry: `{ botId, hands, vpipHands, pfrHands }`, whole numbers. `hands` is the finished hands of this
session the bot was dealt into, `vpipHands` those with a preflop call or raise, and `pfrHands` those with a
preflop raise. There is one entry per bot seat of the record whose bot has at least 1 hand, in ascending seat
order. A bot replaced after busting has no entry: the record is built after the replacement, and the new bot
(new `botId`) starts at 0.

`useTableSession` adds each completed hand to its counts (`countObserved`) before the write and passes them
to `handWrite(table, meta, decisions, counts)`, so the entries are written in the same transaction as the hand
record and always match `handsPlayed`. `sessionRecord`/`handWrite` write `observed` only when counts are
given (the start record has none). On Resume, `restoreObserved(record)` turns the entries back into the hook's
counts (`handsDealt`, `voluntary`, `preflopRaised`; the other style counts are 0, as the snapshot never reads
them), and the Table opens with `resume: { table, sessionId, startedAt, observed }`. A record without
`observed` resumes with empty counts.

## The state stored: ready for the next hand

The record is built from `nextHand(table)`, the state the next deal uses: final stacks carried, a busted cash
bot already replaced (new `botId`, name, style and $160 at $4/$8), every other seat on its own chips (no
top-up) and the button moved one seat. A cash user on $0 is carried at 0, not topped up (the bust state below). `handsPlayed` is the number of the hand just completed. So restoring needs no
game logic: `restoreSession(sessionRecord(nextHand(t), meta))` deep-equals `nextHand(t)`. A stopped sit-and-go's record
keeps its seat on 0 and is rejected on read, so it is not resumable until TASK-5.2.

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
- `endedAt`, if present and not null, as an ISO string that round-trips;
- the counters, and `level` against the game type. `handsPlayed`, `nextBotId`, `nextBotName` and `rebuys` are at most
  `MAX_SESSION_COUNT` (1,000,000,000), so the next hand number, every later bot id and every later
  replacement-name position stay far below `Number.MAX_SAFE_INTEGER`
  (`Invalid session record: handsPlayed` / `nextBotId` / `nextBotName` / `rebuys`). Without the `nextBotName` cap a
  record could restore and then crash `nextHand` at a later bot bust; now it is rejected when read, so Home
  logs it and shows no Resume entry for it (TASK-2.14);
- `seats`: dense, the same seat numbers and kinds as `config.seats`, valid `botId`s, styles and names;
- `button` is one of the seats;
- the engine's `assertChips` on the stakes and stacks: every stack a safe integer of at least 1 and the
  stacks totalling at most `Number.MAX_SAFE_INTEGER`, with `createHand`'s own messages. The one exception is a
  cash user seat with stack exactly `0` (D-1), which is left out of `assertChips`; a bot on 0, or the user on 0
  in a sit-and-go, is still rejected (`Stack at seat <n> must be an integer of at least 1`);
- `observed`, if present (TASK-8.6): an array (`null` or an object is rejected: `Invalid session record:
observed`), with no holes or non-object entries (`observed[<i>]`). Each entry's `botId` is the `botId` of a
  bot seat of this record and not repeated (`observed[<i>].botId`); `hands` is whole in 1..`handsPlayed`,
  `vpipHands` whole in 0..`hands` and `pfrHands` whole in 0..`vpipHands` (`observed[<i>].hands` /
  `vpipHands` / `pfrHands`). Unknown properties of an entry are ignored. A malformed `observed` rejects the
  whole record, so Home logs it and shows no Resume entry for it, as for any other bad field.

Every failure is a `RangeError` naming the field (`Invalid session record: <field>`,
`Invalid session config: <field>`) or the engine's message. Checks use `Number.isSafeInteger` and `typeof`, so
objects and arrays such as `{"toString":1}` or `[3]` are rejected without being coerced.

`restoreSession` then returns the `TableState` ready to deal hand `handsPlayed + 1`.

## Resume from Home

**The paused session.** `HandStore.pausedSession()` reads every value in `sessions` with one readonly `getAll`
and passes them to `findPausedSession(values)`, which parses each one on its own. An invalid value goes into
`rejected` (its RangeError) and is skipped, so one corrupt record cannot hide a valid session or break Home.
Ended records (`endedAt` a string) are dropped. Of the rest, the paused session is the one with the latest
`updatedAt`, then the latest `startedAt`, then the greatest `sessionId`. Older not-ended sessions (left by
Start game before TASK-2.7) are ignored here, and ended by the next confirmed Start game (below).
`pausedSession()` rejects only if the database cannot be read, for example `VersionError`.

**Home.** While Home is shown, `App` runs `pausedSession()`. Each rejected value is logged as
`console.error('Session record could not be read', error)`; a failed read is logged as
`console.error('Paused session could not be read', error)` and treated as no session. The menu `<nav>` has
`data-paused="loading"` until the read settles, then `"none"` or `"shown"`. When shown, a second
`Resume session` entry follows New game, with the subtitle from `resumeSummary(record)`, for example
`Cash · 6 players · $4/$8 · 132 hands · paused` (`1 hand` for one; sit-and-go limits in plain chips).

**Resume.** Choosing the entry runs `restoreSession(record)` (which parses again) before the Table mounts. If
it throws, App logs `console.error('Session could not be resumed', error)`, stays on Home and hides the entry.
Otherwise the Table opens with `resume: { table, sessionId, startedAt }`: it starts from the restored state,
keeps the stored session id and start time, and writes **no** start record (the stored record already is the
state ready for this hand). It deals hand `handsPlayed + 1` from the stored stacks with the stored next-hand
button. The hand in progress when the app closed was never stored, so it is not counted: its number is dealt
again and its record is written, under the same `sessionId`, only when that new hand completes. Hand numbers
then continue as before.

The Table's observed counts start from `restoreObserved(record)` (see [Observed counts](#observed-counts)), so
the hints and stored decisions of the resumed session use the hands seen before the pause.

Leave table ends the session: `endSession` writes `endedAt` and adds its report, or deletes a session with 0
completed hands (see [reports.md](reports.md)). An ended session never shows in Resume.

**Start game with a paused session (TASK-2.7).** Start game on Game Config reads `pausedSession()` again at
click time, after `tableWritesSettled()`. With no paused session the Table opens at once. Otherwise a modal
`End your paused session?` dialog shows the session's summary line and either `Its Session Report will be
saved.` or, with 0 hands, `It has no completed hands, so no report is saved.` `Cancel` (focused) or Escape
closes it and changes nothing; Game Config keeps its values. `End session and start` runs
`endPausedSessions(sessionId, now)` before the Table mounts (so before its start record), then opens the Table:
afterwards the new session is the only one not ended. A read failure is logged
(`Paused session could not be read`) and the game starts; a failure ending the paused session is logged
(`Paused session could not be ended`), the dialog closes and no game starts.

**A stored bust (TASK-3.11).** When a cash hand ends with the user on $0, `handWrite` stores that hand and a
session with the user's stack 0 and the `rebuys` count from before the bust. No hand is dealt: `nextStep` is
`'rebuy'`, `nextHandDelay` is null and `dealHand` throws `The user has no chips: rebuy first`. Resume restores
that state and reopens the Rebuy / Leave table dialog without dealing (Leave table in it ends the session). Rebuy sets the user's stack to the
buy-in, adds 1 to `TableState.rebuys` and deals the next hand at once; nothing is written until that hand
completes, so a close in between leaves the bust stored and the dialog returns on Resume (A-1).

## Pause from the Table

The Table header's `Home` button (TASK-2.14, REQ-004.9) and browser Back on the Table both pause the session
the same way; see [navigation.md](../ui/navigation.md). Leave table ends it instead
([reports.md](reports.md)). It also waits for `tableWritesSettled()` and drops an unfinished hand the same way.

- **No write.** The stored record already is the paused state: the session ready for the next hand after the
  last completed hand. Choosing Home writes nothing, so the record, its `updatedAt` included, stays exactly as
  it was. No `endedAt` is written and no report is created.
- **Home waits for pending writes.** `useTableSession` keeps a module-level chain of every start-record put
  and hand write it issues. `tableWritesSettled()` resolves once all of them have settled and never rejects (a
  failure is already logged). Home's read runs `tableWritesSettled()` and then `pausedSession()`, so choosing
  Home right after a hand ends still shows that hand in the count.
- **An unfinished hand is dropped,** as when the app is closed. Leaving unmounts the Table: its deal and bot
  timers are cleared and late advice-worker replies are ignored. No write is ever issued for a hand in
  progress, so `hands` and the stats keep only completed hands. Resume deals the same hand number again from
  the stored stacks and button, with a new replay code.

## Upgrades

Version 1 created `hands`; version 2 adds `sessions`; version 3 adds `reports` ([reports.md](reports.md));
version 4 adds `settings` ([settings.md](settings.md)); version 5 adds `meta` ([persistent-storage.md](persistent-storage.md)). `onupgradeneeded` runs each missing step
(`if (oldVersion < 1)` … `if (oldVersion < 5)`) and never touches
existing stores or records. The optional `observed` field (TASK-8.6), like `endedAt`, needed no new version:
older records without it still load. A later version
must append another `if (oldVersion < N)` step only. Formal migrations and per-store schema versions belong to
E13 (REQ-054). A tab still open at version 1 closes its connection on `versionchange`; a database newer than
the app makes every call reject with `VersionError` and dealing stops.

## Tests

- `tests/storage/session-records.acceptance.test.ts`, `tests/table/session-restore.acceptance.test.ts`,
  `tests/storage/hand-store.test.ts` (Vitest with `fake-indexeddb`).
- `tests/table/resume.acceptance.test.ts`, `tests/storage/resume.acceptance.test.ts`,
  `tests/ui/home-resume.acceptance.test.tsx`: the summary, the paused-session rule, a session closed in hand 11,
  rejected records and the Home entry.
- `tests/table/session-cap.acceptance.test.ts`: the `nextBotName` cap.
- `tests/table/rebuy.acceptance.test.ts`, `tests/table/rebuy.test.ts`, `tests/ui/bust-dialog.acceptance.test.tsx`:
  the bust state, Rebuy, two rebuys stored as 2, a stored bust restoring to the dialog, the `rebuys` cap and
  the dialog markup.
- `e2e/rebuy.spec.ts` (every push): a seeded bust opens the dialog and deals nothing, Rebuy deals with $160
  and stores `rebuys: 1`, Leave table in the dialog opens the Session Report, and no rebuy control while the
  user has chips.
- `tests/ui/table-home.acceptance.test.tsx`: the header's Home button.
- `e2e/home-control.spec.ts` (every push): Home between hands after hand 10, Resume, Home in the middle of
  hand 11 (no record, same stats, no `endedAt`), and resuming the abandoned hand.
- `e2e/history.spec.ts` (every push): browser Back and Forward, and a stored `nextBotName` above the cap.
- `e2e/resume.spec.ts` (every push): reload in the middle of hand 3 and resume, a seeded 9-player session,
  and invalid stored sessions.
- `tests/storage/end-paused.acceptance.test.ts`, `tests/ui/end-session-dialog.acceptance.test.tsx` and
  `e2e/new-game-confirm.spec.ts` (every push): ending paused sessions from Start game, the dialog markup,
  Cancel and Escape, Confirm, a 0-hand session and no dialog without a paused session.
- `tests/table/observed-record.acceptance.test.ts`, `tests/table/observed-record.test.ts` and
  `tests/table/observed-resume.acceptance.test.ts`: the `observed` write, validation and restore rules, and a
  45-hand session's counts, hint and stored decision after Resume.
- `e2e/observed-resume.spec.ts` (every push): a seeded 45-hand session's hint after Resume, a record with
  malformed `observed` skipped on Home, and the counts carried through Home and Resume.
- `e2e/session-records.spec.ts` (every push): the start record, the record after hand 2 and a reload in the
  middle of hand 3.
- `e2e/session-kill.spec.ts` (opt-in, Chromium): plays 10 hands, deals hand 11, sends SIGKILL to the browser
  and checks after relaunch that the session is still the one from the end of hand 10:

```sh
npm run e2e:slow
# or just this test
TLH_SLOW_TESTS=1 npx playwright test e2e/session-kill.spec.ts --project=chromium
```
