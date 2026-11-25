# Session reports (REQ-044, REQ-052.5)

Leave table ends the session (TASK-10.1, REQ-004.5). The app waits for any hand write still running, then one
IndexedDB transaction writes `endedAt` on the [session record](sessions.md) and adds a Session Report record.
The report is written once and never changed. The Session Report screen shows it. A confirmed Start game with a
paused session (TASK-2.7) also ends sessions, through `endPausedSessions`, without opening the screen.

- `src/table/session-report.ts` (headless): the `SessionReport` and `CashResult` types, `sessionReport(…)`,
  `bbPer100(…)`, `parseSessionReport(…)`, `signedDollars(…)`, `signedTenths(…)`, `reportView(…)`, `rateTiles(…)`, `hintTile(…)` and the
  `SessionEnder` interface.
- `src/storage/hand-store.ts` (browser): the `reports` store, `endSession(sessionId, endedAt)`,
  `endPausedSessions(sessionId, endedAt)` and `getReport(sessionId)`.
- `src/ui/report/ReportScreen.tsx`: the Session Report screen. `src/ui/App.tsx`: Leave table (`leave`).

## Database

| Item         | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| Database     | `tlh-trainer`, version `4` (version 3 adds `reports`)               |
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
| `errors`      | object, optional           | `{ major, minor }`: the user's unhinted Major / Minor decisions (TASK-10.4)   |
| `leakCounts`  | array, optional            | Unhinted counts per leak category (postflop TASK-10.5, preflop TASK-10.6)     |
| `hints`       | object, optional           | `{ hinted, decisions }`: the user's decisions and how many were hinted (10.7) |

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

### errors

`errors` holds two whole counts over the decision records (`decisions`) of the session's stored hands:
`major` is the number of the user's decisions graded Major with `hinted` false, and `minor` likewise for
Minor (REQ-044.2, REQ-040.3). Correct and hinted decisions count toward neither; a forced fold (TASK-10.2) has
no decision entry, so it never counts. The counts are read from the stored grades when the session ends; the
advice engine is never re-run. `sessionReport` adds `errors` only when it gets at least one hand and every
hand carries `decisions` (stored hand records always do); a skipped missing or invalid record contributes
nothing.

The screen shows three tiles in their own list "Volume and errors", after the cash tiles and before the
style section: **Hands played** (`handsPlayed`, a plain integer), **Major errors /100** and
**Minor errors /100**. Each rate is `bbPer100(count, 1, handsPlayed)` shown with one decimal, i.e. integer
half-up tenths `floor((2000 × count + hands) / (2 × hands))`: 12 Major in 200 hands → `6.0`, 1 in 3 → `33.3`,
0 → `0.0`. Reports stored before TASK-10.4 have no `errors`; they are not back-filled and the screen shows
none of the three tiles for them.

### leakCounts

`leakCounts` holds, for every [leak category](../stats/leaks.md) with at least one unhinted decision, in
category data order (the 15 postflop categories first, then the 16 preflop ones),
`{ category, decisions, errors, major }`: the category id, the number of the user's unhinted decisions in it,
how many of those were graded Minor or Major, and how many were graded Major. Categories with no unhinted
decision are left out, so it is `[]` when the session had no unhinted decision in any category (a big blind
check is in none). Like `errors`, it is read from the stored decision records (their `street`, `action.type`, `grade`
and `hinted`) when the session ends, and is present exactly when `errors` is. A preflop decision's position group
and whether someone raised before it come from the hand record's `seats`, `button` and `actions`. Whether a category is a leak, its
evidence and its text are worked out from these counts and the current category data when the report is shown;
`major` is kept for ranking leaks (TASK-10.8). Reports stored before TASK-10.5 have no `leakCounts`; they are
not back-filled and the screen shows no leaks section for them. Reports stored before TASK-10.6 hold postflop
counts only; they stay valid (the preflop categories were appended after the postflop ones) and are not
back-filled.

### hints

`hints` holds two whole counts over the same decision records as `errors` (REQ-044.3, REQ-040.4): `decisions`
is the number of the user's decision records in the session's stored hands, whatever their grade or street,
and `hinted` is how many of those have `hinted` true. A forced fold (TASK-10.2) has no decision record, so it
counts in neither. It is read from the stored `hinted` flags when the session ends, is present exactly when
`errors` is, and is the report's last key.

The screen shows it as a fourth tile in the "Volume and errors" list, after Minor errors /100: **Hints used**
with `<hinted> of <decisions> decisions (<pct>%)` (`decision` when `decisions` is 1). `pct` is
`bbPer100(hinted, 1, decisions)` with one decimal, i.e. half-up tenths
`floor((2000 × hinted + decisions) / (2 × decisions))`, and `0.0` when `decisions` is 0. Examples:
`40 of 320 decisions (12.5%)`, `0 of 320 decisions (0.0%)`, `25 of 25 decisions (100.0%)`, 1 of 16 → `6.3%`,
1 of 3 → `33.3%`, 2 of 3 → `66.7%`, `1 of 1 decision (100.0%)`, `0 of 0 decisions (0.0%)`. Hinted decisions
still count here but stay out of the error rates and leak counts. Reports stored before TASK-10.7 have no
`hints`; they are not back-filled and the screen shows no hint tile for them (the other tiles are unchanged).

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
  nothing and resolves null. A session that is already ended when this transaction reads it is rejected
  (`ConstraintError`) and nothing is written, even if its report is missing (TASK-2.21). A session with 0 completed hands is deleted and resolves null: no report is
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
  `showdownsWon ≤ showdowns` (field `style.<name>`). A present `errors` must be an object whose `major` and
  `minor` are whole numbers ≥ 0 (field `errors`, `errors.major`, `errors.minor`). A present `leakCounts` must
  be an array (field `leakCounts`) of objects (`leakCounts[i]`) whose `category` is a known category id later
  in data order than the previous element's (`leakCounts[i].category`), with whole `decisions ≥ 1`,
  `0 ≤ errors ≤ decisions` and `0 ≤ major ≤ errors` (`leakCounts[i].decisions`, `.errors`, `.major`). A
  present `hints` must be an object (field `hints`) with whole `decisions ≥ 0` (`hints.decisions`) and whole
  `0 ≤ hinted ≤ decisions` (`hints.hinted`); it is not cross-checked against `errors` or `leakCounts`.
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
- `tests/table/session-report-errors.test.ts`, `tests/ui/report-errors.acceptance.test.tsx`,
  `tests/storage/session-end-errors.acceptance.test.ts` (a scripted 200-hand session) and
  `e2e/report-errors.spec.ts`: the stored `errors` counts and the hands played and error-rate tiles.
- `tests/table/session-report-leaks.test.ts`, `tests/stats/leaks.acceptance.test.ts`,
  `tests/ui/report-leaks.acceptance.test.tsx` and `e2e/report-leaks.spec.ts`: the stored `leakCounts` and the
  leaks section.
- `tests/stats/preflop-leaks.test.ts` and `tests/ui/report-preflop-leaks.acceptance.test.tsx`: stored preflop
  `leakCounts`, their order check and a preflop leak on the report.
- `tests/table/session-report-hints.test.ts`, `tests/ui/report-hints.acceptance.test.tsx`,
  `tests/storage/session-end-hints.acceptance.test.ts` (a scripted 50-hand session) and
  `e2e/report-hints.spec.ts`: the stored `hints` counts, their validation and the Hints used tile.
- `e2e/session-report.spec.ts` (every push): Leave table between hands, Back to Home, Leave with the Hand
  Review open, seeded long sessions, and a 0-hand session. `e2e/rebuy.spec.ts` and
  `e2e/bust-continue.spec.ts`: Leave table in the bust dialog.
