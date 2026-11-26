# Spec: TASK-8.6 — Keep observed opponent stats across Resume

Status: READY (approved 2026-11-26)
Task: TASK-8.6 · Parent/epic: TASK-8 · Requirements: REQ-052.3, REQ-022 (via doc-114 Q-3 follow-up) · Dream: limit-holdem-trainer

## 1. Summary
TASK-8.1 keeps per-bot observed style counts in a ref inside `useTableSession`. They start empty at every mount
(`src/ui/table/useTableSession.ts:178`), so after Resume a bot watched for 45 hands reads "typical player" again
(doc-114 Q-3). This story saves each seated bot's observed counts in the session record, in the same
transaction as each hand record. On Resume they are read back, validated and handed to the hook. Hints and
stored decisions then go on using them. Malformed stored counts make the record invalid, so Home logs it and
skips it, as for any other bad field.

## 2. Scope
- In scope:
  - An optional `observed` field on `SessionRecord` (format per D-1, approved by Q-1). `sessionRecord` and
    `handWrite` get an optional trailing `observed` argument, and `parseSessionRecord` validates the field.
    A new `restoreObserved(record)` turns it back into `ObservedCounts`.
  - `useTableSession`: counts the finished hand before the write and passes the counts to `handWrite`.
    `ResumedSession.observed` seeds the ref.
  - `App.resume`: passes `restoreObserved(record)` in `resume`.
  - Docs: `docs/storage/sessions.md` (field, validation, and the stale "version `4`" corrected to 5) and
    `docs/ui/hint.md` (the Q-3 paragraph).
  - Tests: two acceptance files, one e2e spec, one unit file. One stale unit test comment and title are
    updated (not locked).
- Not doing:
  - DB version bump, a new object store or a migration. The field is optional, like `endedAt` and the hand
    record's `forcedFold` (TASK-10.2 D-2).
  - Rebuilding counts from stored hand records, either as the method (Q-1 option d) or as a fallback for
    records without `observed`. Records saved before this story resume with empty counts (A-1).
  - Persisting `earlierShowdowns`. The app keeps none; only the playtest runner does (`src/playtest/runner.ts:406-408`).
  - Changing `TableState`, `restoreSession` or `nextHand`. Locked restore tests deep-equal them (TASK-8.1 Block 1).
  - Changing how counts are computed (`countObserved`, `userObservedSnapshot`), the 30-hand threshold or any
    hint or basis copy.
  - Showing observed stats anywhere new (Seats list, report).
  - Leniency for malformed `observed`, such as dropping only the counts. AC#2 asks for the whole record to be rejected.
- Scope budget: files=11, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A record with no `observed` field resumes with empty counts, as today. This covers start records and every session saved before this story. | yes | Absent = nothing observed. Same backwards-compatible pattern as `endedAt` (`src/table/session-record.ts:58`) | Rebuild from hand records when absent (Not doing) |
| A-2 | Only bots seated in the record and observed for at least 1 hand get an entry, in ascending seat order. A busted bot's counts are dropped when it is replaced. | yes | Bot ids are never reused (`nextBotId`), and the snapshot reads only current seats' ids (`src/table/session.ts:607-623`). A replacement starts at 0 (TASK-8.1 A-2). TASK-6.25 keeps the style but still issues a new id and name (`src/table/session.ts:556-566`) | Keep every bot id ever seen |
| A-3 | `observed` must be absent or an array. `null` is rejected. Unknown extra properties on an entry are ignored, and entry order is not validated. | yes | Matches parseSessionRecord's "unknown extra properties are ignored" rule (`src/table/session-record.ts:158-161`). Order carries no meaning | Accept null; reject extra props |
| A-4 | Each entry also requires `hands ≤ handsPlayed` and `pfrHands ≤ vpipHands`. | yes | Both always hold for real data: a bot is dealt at most every completed hand, and a preflop raise counts as voluntary too (`src/stats/style-stats.ts:63-64`). They catch corrupt values AC#2 does not list | Only the AC#2 checks |
| A-5 | `restoreObserved` fills the other five `StyleCounts` fields with 0. Only `handsDealt`, `voluntary` and `preflopRaised` are ever read from `ObservedCounts` (by `userObservedSnapshot`). | yes | Same shape as the test helper `observedStyle` (`tests/support/table-scenarios.ts:163-169`). `ObservedCounts` stays `Record<number, StyleCounts>` because locked TASK-8.1/8.2 tests type it that way | Persist all 8 counts (Q-1 option c) |
| A-6 | The hook computes `countObserved(observed.current, done)` synchronously when the hand completes. It stores the result in the ref and passes the same object to `handWrite`, so the stored record and the next hint use the same counts. | yes | Today the ref is updated after the write is queued (`useTableSession.ts:254-266`). The next deal waits for the write anyway | Recompute inside the write's `.then` |
| A-7 | The 45-hand AC#1 browser check seeds 45 headless-played hands and their session record (the `home-control.spec.ts:42-53` pattern) instead of playing 45 live hands. The live write path is proven separately with 3 live hands across a real Home → Resume. | yes | 45 live hands would add minutes per browser | 45 live hands in the opt-in slow group |

## 3. Current system
- Session record: `SessionRecord` type `src/table/session-record.ts:35-59`. `sessionRecord(table, meta)` `:89-114`;
  `handWrite(table, meta, decisions?)` builds `sessionRecord(nextHand(table), …)` `:119-136`.
  `parseSessionRecord` `:162-214` validates untrusted data with `RangeError('Invalid session record: <field>')`
  (`invalid` `:77`, `whole` `:143`, `isWhole` from `src/table/hand-record.ts:162`). `restoreSession` `:218-241`.
  `findPausedSession` `:255-269` collects each failing value in `rejected`.
- Storage: `DB_VERSION = 5` (`src/storage/hand-store.ts:30`; stores hands, sessions, reports, settings, meta).
  `add(record, session)` writes both in one strict transaction (docs/storage/sessions.md, "When it is
  written"). `pausedSession()` → `findPausedSession`. `ended(...)` re-parses the session record
  (`src/storage/hand-store.ts:96-104`).
- Earlier optional persisted fields added without a version bump: `SessionRecord.endedAt?` (validated only
  when present, `session-record.ts:58`, `:168-170`), `HandRecord.forcedFold?: true` (TASK-10.2 D-2, approved by
  Q-1, `src/table/hand-record.ts:101`) and `UserDecision.hinted`/`observed` written only when set (TASK-8.2 A-2,
  `src/table/session.ts:690-693`).
- Observed counts: `ObservedCounts = Readonly<Record<number, StyleCounts>>` keyed by per-session bot id
  (`src/table/session.ts:590-592`). Also `countObserved` `:596-603` and `userObservedSnapshot` `:607-623`, which
  builds `{seat, hands, vpip, pfr}` (unrounded %) for current bot seats with ≥1 hand. The range model uses an
  entry only from `OBSERVED_MIN_HANDS = 30` (`src/advice/explanations.ts:94`, `src/advice/ranges.ts:652-655`).
  Basis copy: `'based on {hands} hands of this opponent'` (`src/advice/explanations.ts:97`).
- Hook: `observed = useRef<ObservedCounts>({})` `src/ui/table/useTableSession.ts:178`. Counting happens at
  `:265`, after `handWrite` is queued `:254-264`. `act` snapshots at `:312-317` and `observedCounts()` at `:319`. The
  hint reads `observedCounts()` (`src/ui/table/Table.tsx:443`). `ResumedSession` `:70-74`.
- Resume: `App.resume` `src/ui/App.tsx:227-241` builds `{ table, sessionId, startedAt }`. A rejected stored record
  is logged as `Session record could not be read` and gets no Resume entry (`src/ui/App.tsx:118`).
- Seat replacement: TASK-6.19's `rememberShowdown`/`forgetSeats` (`src/engine/player-view.ts:150-176`) exist
  because earlier showdowns are keyed **by seat**. They are used only in the playtest runner. Observed counts are keyed **by
  bot id**, so a replacement (new id, `src/table/session.ts:556-566`, same style since TASK-6.25) starts at 0 with
  no forget step. The persisted record is built from `nextHand(table)`, which is after replacement, so the
  replaced bot never gets an entry.
- Tests: Vitest (`npm test`, jsdom + fake-indexeddb), Playwright e2e (`npm run e2e`, Chromium + WebKit, needs
  `npm run build`). Headless helpers `playSession` (`tests/support/session-play.ts:46-60`). E2E seeding helpers
  `seedStoredRecords`/`seedStoredSessions`/`storedSessions`/`storedRecords` (`e2e/support/hand-records.ts:45-125`).
  Invalid-record Home pattern: `e2e/resume.spec.ts:261-313`.
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/table/session-record.ts` `invalid`, `object`, `whole` → field validation and messages.
  - `src/table/session.ts` `countObserved`, `userObservedSnapshot`, `ObservedCounts` → unchanged counting and snapshot.
  - `src/stats/style-stats.ts` `EMPTY_STYLE_COUNTS`, `handStyleCounts` → restore shape, and the expected counts in tests.
  - `tests/support/session-play.ts` `playSession`; `tests/support/table-scenarios.ts` `observedStyle`.
  - `e2e/support/hand-records.ts` seeding/reading helpers; `e2e/support/paused-clock.ts` `runUntilMyTurn`;
    the hint locators of `e2e/hint-observed.spec.ts`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format: an optional `observed: { botId, hands, vpipHands, pfrHands }[]` on the session record, with whole-number counts. It is written with every hand write, in the same transaction as the hand record. No DB version bump. | (b) `{botId, hands, vpip, pfr}` as percentages. (c) all 8 `StyleCounts` fields. (d) no format change: rebuild from stored hand records on Resume | See Q-1: integer counts continue exactly; additive optional field keeps older records loading (A-1) | yes | Q-1 |
| D-2 | `restoreObserved(record): ObservedCounts` is a separate function. `ResumedSession` gains optional `observed`. `restoreSession` and `TableState` are unchanged. | Put counts on `TableState` | Locked restore tests (TASK-3.10, TASK-2.6, TASK-3.11) deep-equal `restoreSession(...)` with `nextHand(...)`. TASK-8.1 Block 1 moved counts off `TableState` for this reason | no | n/a |
| D-3 | `sessionRecord(table, meta, observed?)` and `handWrite(table, meta, decisions?, observed?)` write `observed` only when the argument is given, even when it yields `[]`. The hook always passes it on hand writes, and the start record passes none. | Always write the field | About 40 test and seed call sites (several locked e2e seeds) keep producing byte-identical records | no | n/a |
| D-4 | A malformed `observed` rejects the whole record via `parseSessionRecord`. It then flows through the existing `findPausedSession` → `rejected` → `console.error('Session record could not be read', …)` path. | Drop only the counts | AC#2 says "rejected with a RangeError naming the field". One validation path for every field | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-record.ts` — `SessionRecordObserved` type, `SessionRecord.observed?`, `sessionRecord`/`handWrite` optional argument, validation in `parseSessionRecord`, new `restoreObserved`.
- `src/ui/table/useTableSession.ts` — `ResumedSession.observed?`, ref seeded from it, counts computed before the write and passed to `handWrite` (A-6), doc comment updated.
- `src/ui/App.tsx` — `resume` includes `observed: restoreObserved(record)`.
- `src/table/session.ts` — `ObservedCounts` doc comment: now persisted in the session record (no code change).
- `docs/storage/sessions.md` — `observed` row and entry shape, validation bullet, DB version 5 (stale "4"), Upgrades note (no bump).
- `docs/ui/hint.md` — replace the Q-3 sentence: counts are saved with each hand and restored on Resume.
- `tests/table/observed-resume.acceptance.test.ts` (new) — SPEC-01, SPEC-02.
- `tests/table/observed-record.acceptance.test.ts` (new) — SPEC-04, SPEC-05.
- `tests/table/observed-record.test.ts` (new) — SPEC-06, SPEC-07.
- `e2e/observed-resume.spec.ts` (new) — SPEC-03, SPEC-08, SPEC-09.
- `tests/table/observed-snapshot.test.ts` — rename "restored session starts with an empty snapshot" to "a record written without counts restores an empty snapshot" and fix its Q-3 comment. Assertions unchanged.

### Components, interfaces and data
```ts
// src/table/session-record.ts
export interface SessionRecordObserved {
  /** A bot id held by a bot seat of this record. */
  readonly botId: number;
  /** Finished hands this session the bot was dealt into: whole 1..handsPlayed. */
  readonly hands: number;
  /** Of those, hands with a preflop call or raise (VPIP numerator): whole 0..hands. */
  readonly vpipHands: number;
  /** Of those, hands with a preflop raise (PFR numerator): whole 0..vpipHands. */
  readonly pfrHands: number;
}
export interface SessionRecord { /* … */ readonly observed?: readonly SessionRecordObserved[]; }

export function sessionRecord(table: TableState, meta: SessionMeta, observed?: ObservedCounts): SessionRecord;
export function handWrite(table, meta, decisions?, observed?: ObservedCounts): { record; session };
/** parseSessionRecord(value), then its counts by bot id; {} when `observed` is absent. */
export function restoreObserved(value: unknown): ObservedCounts;

// src/ui/table/useTableSession.ts
export interface ResumedSession { readonly table; readonly sessionId; readonly startedAt;
  /** Restored observed counts; {} when absent. */ readonly observed?: ObservedCounts; }
```
Invariants: entries are in ascending seat order with unique `botId`s. Every `botId` is the botId of a `kind: 'bot'`
seat in `seats`, and every entry has `hands ≥ 1`.

### Rules and algorithms
- **Write** (`sessionRecord(t, meta, counts)`): for each seat of `t.seats` in ascending order with
  `id = t.botIds[seat]` defined and `c = counts[id]` with `c.handsDealt ≥ 1`, write
  `{ botId: id, hands: c.handsDealt, vpipHands: c.voluntary, pfrHands: c.preflopRaised }`. `handWrite` passes
  `counts` through to `sessionRecord(nextHand(table), …, counts)`, so a bot replaced in `nextHand` has no entry.
  - Example: hand 45 done, Ben (bot id 2, seat 2) counted `{handsDealt: 45, voluntary: 27, preflopRaised: 9}`
    → `{ botId: 2, hands: 45, vpipHands: 27, pfrHands: 9 }`. Restored snapshot entry
    `{ seat: 2, hands: 45, vpip: 60, pfr: 20 }`, the same as before the pause.
- **Hook** (A-6): at `step === 'done'`, compute `const counts = countObserved(observed.current, done)` and set
  `observed.current = counts` before building the write. Call
  `handWrite(table, { sessionId, startedAt, completedAt }, decisions, counts)`. Initial ref:
  `resume?.observed ?? {}`.
- **Validate** (inside `parseSessionRecord`, after `seats`, so bot ids are known). If `observed` is present:
  1. Not an array → `Invalid session record: observed`.
  2. For each index `i` (sparse slot or non-object → `observed[i]`):
     - `botId` not a botId of a bot seat in this record, or repeated → `observed[i].botId`;
     - `hands` not whole in 1..handsPlayed → `observed[i].hands`;
     - `vpipHands` not whole in 0..hands → `observed[i].vpipHands`;
     - `pfrHands` not whole in 0..vpipHands → `observed[i].pfrHands`.
  "Whole" means `isWhole` (`Number.isSafeInteger`, no coercion of `"3"`, `[3]` or `{toString}`).
- **Restore**: `restoreObserved(record)` = `{ [botId]: { ...EMPTY_STYLE_COUNTS, handsDealt: hands, voluntary: vpipHands, preflopRaised: pfrHands } }`.

### Error handling and configuration
- Messages: `RangeError('Invalid session record: observed')`, `…: observed[<i>]`, `…: observed[<i>].botId`,
  `….hands`, `….vpipHands`, `….pfrHands`.
- Home: the rejected record is logged by the existing `console.error('Session record could not be read', error)`. It
  shows no Resume entry and New game works (existing path, D-4). `restoreObserved` is only called on a record that
  `findPausedSession` has already parsed, and `App.resume`'s existing try/catch covers it (`src/ui/App.tsx:228-234`).
- No configuration.

## 6. Behaviour specification

### SPEC-01: Counts survive the stored record round trip after 45 hands
- Verifies: AC#1
- Behaviour: Given a default 6-max session played headless for 45 hands, with counts folded by `countObserved`
  and each hand written with `handWrite(…, counts)`, When the last session record is JSON round-tripped,
  picked by `findPausedSession` and restored with `restoreSession` + `restoreObserved`, Then
  `userObservedSnapshot(restored, restoredCounts)` deep-equals `userObservedSnapshot(nextHand(last), counts)`.
  Every bot that played all 45 hands has `hands: 45`.
- Verification: acceptance `tests/table/observed-resume.acceptance.test.ts::restored counts equal the counts before the pause`

### SPEC-02: A resumed postflop hint and stored decision read "based on 45 hands of this opponent"
- Verifies: AC#1
- Behaviour: Given the restored table and counts of SPEC-01, When it is dealt and played (bots by `stepBot`, the
  user by check/call) to the user's first postflop decision with a live 45-hand opponent (within 10 hands; the
  test fails, never skips, if none is reached), Then `requestHint(advisor, table, restoredCounts)` with an in-process advisor
  (`recommend(view, userAdviceOptions(observed))`, as `tests/table/hinted.acceptance.test.ts:148` does) gives that
  opponent `opponentBasis` `text: 'based on 45 hands of this opponent'`. The decision stored by
  `applyUserAction(t, a, userObservedSnapshot(t, restoredCounts))` carries the same snapshot, and its graded entry
  carries the same basis.
- Verification: acceptance `tests/table/observed-resume.acceptance.test.ts::resumed hint and stored decision use the restored counts`

### SPEC-03: In the app, Resume then Hint shows the 45-hand basis
- Verifies: AC#1
- Behaviour: Given IndexedDB seeded with 45 headless hand records and the session record after hand 45 with its
  `observed` (A-7), When the user opens the app, selects Resume session, plays check/call to a postflop decision
  with a live 45-hand opponent and selects Hint, Then the card's opponent-range list shows
  `<name>: based on 45 hands of this opponent` for that opponent. Each other live opponent reads per its stored
  hands (≥30 → "based on N hands of this opponent", else "typical player"). After acting and the hand completing, the
  stored hand record's decision for that street has the same `opponentBasis` text, and the new stored session record's
  entry for that bot has `hands: 46`.
- Verification: acceptance `e2e/observed-resume.spec.ts::a resumed session's hint uses the 45 hands observed before the pause`

### SPEC-04: Malformed observed counts are rejected naming the field
- Verifies: AC#2
- Behaviour: Given a valid session record after hand 45, When `observed` is replaced by each case below and
  `parseSessionRecord` reads it, Then it throws `RangeError` with exactly the message shown:
  `null` or `{}` → `Invalid session record: observed`; `[5]` → `…: observed[0]`;
  `hands: 4.5`, `0`, `"45"` or `46` (> handsPlayed) → `…: observed[0].hands`;
  `vpipHands: 46` (> hands), `-1` or `2.5` → `…: observed[0].vpipHands`;
  `pfrHands: 28` (> vpipHands 27), `-1` → `…: observed[0].pfrHands`;
  `botId: 99` (no such seat), the user's `null`, a duplicate of entry 0 at entry 1, or a replaced bot's old id
  → `…: observed[<i>].botId`.
  Without `observed` and with `observed: []` the record parses. Each failing case placed in
  `findPausedSession([bad, validOlder])` yields `rejected.length === 1` and `session === validOlder`.
- Verification: acceptance `tests/table/observed-record.acceptance.test.ts::malformed observed counts are rejected naming the field`

### SPEC-05: Home stays usable with a malformed stored record
- Verifies: AC#2
- Behaviour: Given IndexedDB holding only a session record whose `observed[0].hands` is `4.5`, When Home loads,
  Then the menu has `data-paused="none"` with no Resume session entry. A console error containing
  `Session record could not be read` is logged, with no page error. New game → Start game deals Hand #1.
- Verification: acceptance `e2e/observed-resume.spec.ts::a stored record with malformed observed counts is skipped and Home stays usable`

### SPEC-06: Write rules
- Verifies: AC#1
- Behaviour: Given a done table where seat 4's bot busted and is replaced in `nextHand`, When
  `handWrite(t, meta, undefined, counts)` runs, Then `session.observed` lists the seated bots with ≥1 hand in
  ascending seat order as `{botId, hands, vpipHands, pfrHands}`. It has no entry for the busted bot's id or for the
  replacement. `handWrite(t, meta)` and `sessionRecord(t, meta)` without counts have no `observed` key
  (`JSON.stringify` unchanged from before this story). `sessionRecord(t, meta, {})` has `observed: []`.
- Verification: unit `tests/table/observed-record.test.ts::write rules`

### SPEC-07: Restore rules
- Verifies: AC#1
- Behaviour: Given a parsed record with `observed: [{botId: 2, hands: 45, vpipHands: 27, pfrHands: 9}]`, When
  `restoreObserved` runs, Then it returns `{ 2: { ...EMPTY_STYLE_COUNTS, handsDealt: 45, voluntary: 27, preflopRaised: 9 } }`.
  Without `observed` it returns `{}`, and on an invalid record it throws parseSessionRecord's RangeError.
- Verification: unit `tests/table/observed-record.test.ts::restore rules`

### SPEC-08: Live write path continues across a real Home → Resume
- Verifies: AC#1
- Behaviour: Given a new default game in the app (pinned replay words), When 2 hands are played and completed, Then
  the stored session record's `observed` equals the counts computed from the 2 stored hand records
  (`handStyleCounts` summed per seated bot id). When the user then selects Home, Resume session and plays hand 3 to
  completion, Then the stored `observed` equals the counts from stored records 1–3. Each bot still seated holds
  `hands: 3`, which proves the hook started from the restored counts and not from 0.
- Verification: acceptance `e2e/observed-resume.spec.ts::observed counts are saved with each hand and carried through Home and Resume`

### SPEC-09: Gates and docs
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the full suite, lint, typecheck and the new e2e spec run, Then all pass with no
  locked test edited. `docs/storage/sessions.md` documents `observed`, its validation and DB version 5, and
  `docs/ui/hint.md` no longer says counts restart at 0 after Resume.
- Verification: command `npm test && npm run lint && npm run typecheck && npm run build && npx playwright test e2e/observed-resume.spec.ts e2e/resume.spec.ts e2e/session-records.spec.ts e2e/hint-observed.spec.ts`

## 7. Edge cases
- Empty: start record or pre-story record (no `observed`) → empty counts (A-1, SPEC-06/07). `observed: []` parses (SPEC-04).
- Boundary: `hands = handsPlayed` accepted and `handsPlayed + 1` rejected; `vpipHands = hands`, `pfrHands = vpipHands` accepted (SPEC-04).
- Bot replaced on the hand being written: no entry for the old or new id (SPEC-06). The replacement starts at 0 after Resume as before.
- User busted and stored at Rebuy (TASK-3.11): the record still carries `observed`. Resume → Rebuy continues counting (same code path as SPEC-08).
- Invalid input: types, ranges, unknown or duplicate ids (SPEC-04). Coercible values (`"45"`) are rejected.
- Duplicates / concurrency: one write per hand, in the same transaction as the hand record, so counts can never
  get ahead of or behind `handsPlayed` after a crash.
- Interruption: a hand in progress at pause is never counted or stored (existing behaviour). Its replay is
  counted once when it completes.
- Dependency failure: a failed hand write stops dealing as today. The ref may then hold the unwritten hand's
  counts, but no further write or hint can happen at that table except a hint in a dead table, which is acceptable.
- Ended sessions: `ended(...)` re-parses the record. A malformed `observed` makes ending fail exactly as any other
  malformed field does today (no change).
- Permissions: N/A (local IndexedDB only).

## 8. Security considerations
- Trust boundary: stored IndexedDB values are untrusted. `observed` is validated field by field before use, with no
  coercion (SPEC-04). Bad data can't reach the advice worker.
- Data: only aggregate counts of bot behaviour. Nothing about the user, no hole cards, nothing sent over the network.
- No new dependencies, no randomness, no authn/authz, no secrets, no logging of record contents beyond the existing error.

## 9. Non-functional
- Resume adds O(seats) work (≤ 9 entries). The record grows by ≤ 9 small objects. No measurable effect, so no
  timing test. No speed or scale check is added, so nothing goes to the opt-in slow group.
- The new Vitest files play ≤ 55 headless TAG hands and should run in a few seconds within the normal suite.
- Coverage: new code in `src/table/session-record.ts` is fully covered by SPEC-04/06/07.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev` → New game → Start game, play a few hands, Home, Resume session, Hint on a postflop turn
- New tests:
  - `tests/table/observed-resume.acceptance.test.ts` → SPEC-01, SPEC-02
  - `tests/table/observed-record.acceptance.test.ts` → SPEC-04
  - `tests/table/observed-record.test.ts` → SPEC-06, SPEC-07
  - `e2e/observed-resume.spec.ts` (every push, Chromium + WebKit) → SPEC-03, SPEC-05, SPEC-08
- Locked tests: none of the 70+ locked files asserts the absence of `observed` or an exact session key set.
  Session seeds built with `sessionRecord`/`handWrite` stay byte-identical (D-3), so no locked test's values change.
  The one test that pins Q-3 (`tests/table/observed-snapshot.test.ts`, TASK-8.1 unit, not locked) still passes and
  only its title and comment are updated.
- End-to-end scenario for the Judge: in the built app, start a default game, play 3 hands, choose Home, then Resume
  session. Read IndexedDB `sessions[0].observed` and see `hands: 3` for the original bots. Then seed the 45-hand
  session (as in SPEC-03), Resume, reach a postflop turn and select Hint. The 45-hand opponent reads "based on 45
  hands of this opponent". Finally, corrupt `observed[0].hands` to 4.5 and reload: no Resume entry, New game works.

## 11. Open questions
None. Q-1 answered (option a, recommended): see D-1 and `doit/TASK-8.6/qa.md`.

## 12. Clarifications log
See `doit/TASK-8.6/qa.md`.
