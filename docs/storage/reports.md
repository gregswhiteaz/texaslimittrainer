# Session reports (REQ-044, REQ-052.5)

Leave table ends the session (TASK-10.1, REQ-004.5). The app waits for any hand write still running, then one
IndexedDB transaction writes `endedAt` on the [session record](sessions.md) and adds a Session Report record.
The report is written once and never changed. The Session Report screen shows it. A confirmed Start game with a
paused session (TASK-2.7) also ends sessions, through `endPausedSessions`, without opening the screen.

- `src/table/session-report.ts` (headless): the `SessionReport` and `CashResult` types, `sessionReport(…)`,
  `bbPer100(…)`, `parseSessionReport(…)`, `signedDollars(…)`, `signedTenths(…)`, `reportView(…)` and the
  `SessionEnder` interface.
- `src/storage/hand-store.ts` (browser): the `reports` store, `endSession(sessionId, endedAt)`,
  `endPausedSessions(sessionId, endedAt)` and `getReport(sessionId)`.
- `src/ui/report/ReportScreen.tsx`: the Session Report screen. `src/ui/App.tsx`: Leave table (`leave`).

## Database

| Item         | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `3` (version 3 adds `reports`)               |
| Object store | `reports` (next to `hands` and `sessions`)                          |
| Key          | `keyPath: 'sessionId'`; one record per ended session, added (`add`) |
| Indexes      | none                                                                |

## Fields

| Field         | Type                       | Meaning                                                                       |
| ------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `sessionId`   | string, 32 lowercase hex   | The session's id; the key                                                     |
| `startedAt`   | string, ISO-8601 UTC       | The session's `startedAt`                                                     |
| `endedAt`     | string, ISO-8601 UTC       | When the session was ended; equal to the session record's `endedAt`           |
| `gameType`    | `'cash'` \| `'sit-and-go'` | The game played                                                               |
| `players`     | integer 2–10               | `config.players`                                                              |
| `stake`       | `{ smallBet, bigBet }`     | The limits played (`tableStake(config)`); `bigBet = 2 × smallBet`             |
| `handsPlayed` | integer ≥ 1                | Completed hands                                                               |
| `cash`        | object \| null             | The cash result below; null for a sit-and-go (finishing position: TASK-10.12) |
| `style`       | object, optional           | The user's style counts over the session's stored hands (TASK-10.3)           |

`cash`:

| Field        | Meaning                                         |
| ------------ | ----------------------------------------------- |
| `buyIn`      | 20 × the big bet                                |
| `rebuys`     | The session record's `rebuys`                   |
| `finalStack` | The user seat's stored stack (0 after a bust)   |
| `result`     | `finalStack − buyIn × (1 + rebuys)`, in dollars |
| `bbPer100`   | Big bets per 100 hands, one decimal, never `-0` |

`style` holds the eight [style-stat](../stats/style-stats.md) counts of the user's seat (`handsDealt`,
`voluntary`, `preflopRaised`, `postflopAggressive`, `postflopCalls`, `sawFlop`, `showdowns`, `showdownsWon`).
The screen derives the five stats, the [healthy ranges](../stats/healthy-ranges.md) and the labels from these
counts and `players` when it shows the report. Reports stored before TASK-10.3 have no `style`; they are not
back-filled and the screen shows no style section for them.

The cash values come from the stored session record only: it is written in the same transaction as each hand
record, so its `handsPlayed`, stacks and `rebuys` always match the stored hands. A rebuy bought during an
unfinished hand is not stored yet, so neither the rebuy nor its chips count.

## Rules

- **BB/100** uses integers only and rounds half away from zero: with `d = bigBet × hands`,
  `tenths = sign(result) × floor((2000 × |result| + d) / (2 × d))` and the value is `tenths / 10`. Example: 214
  hands at $4/$8 and a result of $46 give `+2.7`.
- **Display.** Result `+$46`, `-$40` or `$0`. BB/100 `+2.7`, `-5.0` or `0.0`. Rebuys a plain integer. The
  header line is `Cash · 6 players · $4/$8 · 214 hands` (`1 hand` for one). A sit-and-go shows its limits in
  plain chips and no tiles.
- **Ending (`endSession`).** One strict transaction over `sessions`, `reports` and `hands`. An absent session writes
  nothing and resolves null. A session with 0 completed hands is deleted and resolves null: no report is
  stored and Home opens. Otherwise the stored session is validated (`parseSessionRecord`), its hand records
  1…`handsPlayed` are read (one `get` each) and those that pass `parseHandRecord` give `style`; a missing or
  invalid record is skipped, so `style.handsDealt` can be below `handsPlayed`. Then the session is put again
  with `endedAt`, and the report is added. If validation fails, or a report for the id already exists
  (`ConstraintError`), the transaction aborts and nothing changes. App logs
  `console.error('Session could not be ended', error)` and opens Home; the session stays paused.
- **Ending from Start game (`endPausedSessions`, TASK-2.7).** First ends the confirmed paused session at
  `endedAt` (now) exactly as `endSession`; if that rejects, the call rejects and nothing changed. Then it reads
  every value in `sessions` and ends each other valid record that is not ended, one `endSession`-style
  transaction each, at that record's own `updatedAt` (the time it was last played): a report is saved, or a
  0-hand record is deleted. Invalid records are skipped and never touched. A failure on one of these older
  sessions leaves it unchanged, is returned in `rejected` (App logs `Session could not be ended`) and does not
  stop the others or the new game. It resolves `{ report, rejected }`, where `report` is the confirmed
  session's report (null for 0 hands or an absent id).
- **Write-once.** A report is only ever added. A second `endSession` for the same id is rejected, and the
  stored report and session stay as they were.
- **Reading (`getReport`).** Stored values are untrusted: `parseSessionReport` checks every field, including
  that `result` and `bbPer100` match the formulas, and throws `RangeError('Invalid session report: <field>')`.
  A present `style` must be an object of whole counts with `1 ≤ handsDealt ≤ handsPlayed`,
  `voluntary ≤ handsDealt`, `preflopRaised ≤ voluntary`, `sawFlop ≤ handsDealt`, `showdowns ≤ sawFlop` and
  `showdownsWon ≤ showdowns` (field `style.<name>`).
- **An ended session never shows in Resume.** `findPausedSession` drops records with `endedAt`.

## Tests

- `tests/table/session-report.acceptance.test.ts`: the cash result, BB/100 and rebuys, the rounding and sign
  edges, sit-and-go, 0 hands and `parseSessionReport`.
- `tests/storage/session-end.acceptance.test.ts` (`fake-indexeddb`): ending and reading after a relaunch,
  0 hands, write-once, a corrupt session and the v2 → v3 upgrade.
- `tests/storage/end-paused.acceptance.test.ts` (`fake-indexeddb`): `endPausedSessions` with older, 0-hand,
  ended and invalid sessions, and its failures.
- `tests/ui/report-screen.acceptance.test.tsx`: the Session Report markup.
- `tests/table/session-report-style.acceptance.test.ts`, `tests/storage/session-end-style.test.ts`,
  `tests/ui/report-style.acceptance.test.tsx` and `e2e/report-style.spec.ts`: the stored `style` counts and
  the style section.
- `e2e/session-report.spec.ts` (every push): Leave table between hands, Back to Home, Leave with the Hand
  Review open, seeded long sessions, and a 0-hand session. `e2e/rebuy.spec.ts` and
  `e2e/bust-continue.spec.ts`: Leave table in the bust dialog.
