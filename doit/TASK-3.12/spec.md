# Spec: TASK-3.12 — Record the advice and grade for each of my decisions with the hand

Status: READY (approved 2026-11-24)
Task: TASK-3.12 · Parent/epic: TASK-3 · Requirements: REQ-052 (REQ-052.2) · Dream: limit-holdem-trainer

## 1. Summary
Each stored hand record gets a `decisions` list: one entry per user decision, in order. Each entry holds the street,
the user's action, the recommendation (action, alternative, rule id, basis), the numbers (equity %, required
equity %, per-opponent basis), the explanation, the grade (grade, rule id, margin) and a `hinted` flag (always false
until E08). The advice comes from the decision's own `PlayerView` and the observed-stats snapshot that was captured
with it (`UserDecision.observed`, TASK-7.15). It uses the same options the hint worker uses, so the stored values
are what a hint showed at that moment. `parseHandRecord` checks the new field. `estimateOpponentRanges` gets
stricter snapshot validation: a null entry or a bad seat now throws RangeError (TASK-7.13 security follow-up).

## 2. Scope
- In scope:
  - `HandRecordDecision` type, `decisionRecord(decision)` builder, and `HandRecord.decisions` filled by `handRecord`.
  - `parseHandRecord` validation of `decisions`, including the cross-check against the user's actions.
  - A shared `userAdviceOptions(observed)` used by the advice worker and the record.
  - Snapshot entry validation in `estimateOpponentRanges` (`observedBySeat`), for AC#6.
  - Test helper: `userTableAfter` gains an optional observed snapshot.
  - `docs/storage/hand-records.md` gets the new fields and validation rules.
- Not doing:
  - Computing the observed-stats snapshot in the live session (TASK-8.1). No caller in `src/ui` passes `observed` yet.
  - Setting `hinted: true` (E08) and any hint UI.
  - Making the review panel read stored decisions instead of regrading (E09). `Table.tsx` keeps `userReviewEntries`.
  - Storing the observed snapshot itself or the full `Recommendation` object (see Q-1).
  - An IndexedDB version bump or migration of older records (REQ-054). No new index or store is needed.
  - Validating the snapshot on preflop views, or with `opponentRanges: 'unseen'`, where it isn't read (A-4).
  - Any UI, screen or bot behaviour change.
- Scope budget: files=9, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Advice is computed when the record is built at hand end, from each decision's stored `view` and `observed`, not inside `applyUserAction`. | yes | `recommend`/`gradeView` are deterministic in (view, options) (TASK-7.15 determinism suite), so the result equals the decision-time hint. This is the same approach `reviewEntries` already takes (`src/table/review.ts:44-50`), and it keeps the action path fast. | Compute in `applyUserAction` and carry the result on `UserDecision` (slower clicks; it changes the session type). |
| A-2 | Preflop entries: `ruleId: null`, `equityPct: null`, `requiredEquityPct: null`, `opponentBasis: []`, `basis: 'chart'`. | yes | `PreflopRecommendation` has no rule id or equity numbers (`src/advice/preflop.ts:34-52`). The chart reason is in `explanation` and `grade.ruleId`. | Synthesize a `'chart'` rule id; store the chart cell. |
| A-3 | `parseHandRecord` cross-checks the decisions against `actions`. The decision count must equal the user's non-blind actions, and entry i's `street`, `action.type` and `action.amount` must equal the i-th such action. `action.seat` must be `userSeat`. | yes | Every user action goes through `applyUserAction` (`src/table/session.ts:621-643`), so the two lists always match. This follows the existing cross-field checks (`src/table/hand-record.ts:252-255`). | Shape-only validation. |
| A-4 | The new snapshot checks run where the snapshot is read (`estimateOpponentRanges`), as AC#6 says. A preflop view or `'unseen'` ranges never read it, so a bad snapshot there still produces advice. | yes | AC#6 names `estimateOpponentRanges`. Nothing supplies snapshots yet (TASK-8.1). | Validate in `recommend` for every street. |
| A-5 | A whole-number seat in range that is not a live opponent stays ignored, as today. | yes | It is valid data for a seat that folded or isn't dealt in. AC#6 only asks about null entries and seats that aren't whole numbers in range. | Reject seats not at the table. |
| A-6 | Parse bounds: `decisions` length 0..MAX_ACTIONS (400), `opponentBasis` 0..9 entries, `explanation` a string of 1..2000 characters, `basis.text` 1..200 characters. | yes | Matches the A-5 bounds style already in `hand-record.ts:157-159`. Explanations are at most 3 sentences (REQ-037). | Other limits. |
| A-7 | `alternative` is stored (`ActionType \| null`). | yes | Graders and the E09 review need to know an alternative was accepted. It costs one short field. | Leave it out (it can be recovered from `grade.ruleId === 'alternative'` only when used). |

## 3. Current system
- `src/table/hand-record.ts:31-58` defines `HandRecord`. `handRecord()` (`:115-152`) builds it from `CompletedHand` and
  copies all data. `parseHandRecord()` (`:259-320`) validates untrusted stored values and throws
  `RangeError('Invalid hand record: <field>')` for the first bad field. Helpers `object`, `array`, `whole`, `oneOf`
  and `seatIn` are at `:161-205`.
- `src/table/session.ts:362-367` defines `UserDecision { view, action, observed? }`. `applyUserAction` (`:621-643`)
  copies the snapshot. `CompletedHand.userDecisions` (`:667`) is passed through by `completedHand` (`:696`).
- `src/table/session-record.ts:118-135` defines `handWrite()`, which calls `handRecord(done, …)`. The UI writes the
  result in `src/ui/table/useTableSession.ts:182-195`. No UI code passes `observed` to `applyUserAction` yet.
- `src/table/advice-service.ts:61-64` defines the private `userOptions(observed)`: `ACTION_RANGE_ADVICE` plus
  `observedOpponents`. This is exactly what the hint (`recommend`) and grade requests use.
- `src/table/review.ts:38-63` defines `reviewEntries`, which regrades each decision with its snapshot (the same idea as A-1).
- `src/advice/grade.ts:51-61` defines `GradeResult { grade, ruleId, userAction, marginPts, recommendation }`. GRADE_RULE_IDS is at `:18-26`.
- `src/advice/postflop.ts:31-66` defines `PostflopRecommendation`: `ruleId`, `equityPct`, `requiredEquityPct`,
  `opponentBasis: OpponentBasis[]` and `explanation`. `src/advice/preflop.ts:34-52` defines `PreflopRecommendation`
  (`basis: 'chart'`, `explanation`, no numbers).
- `src/advice/ranges.ts:300-316` defines `ObservedOpponent` and `OpponentBasis`. `observedBySeat` (`:568-580`)
  destructures each entry, so `null` throws TypeError. It never checks `seat`, so seat `0`, `1.5`, `'2'` or `99`
  is silently unmatched. `OBSERVED_MIN_HANDS = 30` is at `src/advice/explanations.ts:94`.
- The locked acceptance test `tests/storage/hand-records.acceptance.test.ts:69-107` compares every record field
  except `actions` with `toEqual`. A new `decisions` field breaks it unless it is also destructured out (see D-3).
- Tests: Vitest (`npm test` = `vitest run --coverage`). Acceptance files are `*.acceptance.test.ts`. Scripted tables
  come from `tests/support/table-scenarios.ts` (`userTableAfter` at `:193-221`, `REVIEW_FOUR` at `:238` with 4
  user decisions, `PREFLOP_FOLD_ONLY` at `:250`).
- Existing code to reuse:
  - `src/advice/grade.ts::gradeView` → one call gives the recommendation and grade for a decision.
  - `src/table/advice-service.ts::userOptions` → move it to `src/advice/recommend.ts` as exported
    `userAdviceOptions` so the worker and the record share one definition.
  - `src/table/hand-record.ts` helpers `object`, `array`, `whole`, `oneOf`, `seatIn`, `invalid`, `MAX_ACTIONS`.
  - `src/advice/grade.ts::GRADE_RULE_IDS`, `src/advice/postflop.ts::POSTFLOP_RULE_IDS` for enum validation.
  - `tests/support/table-scenarios.ts::REVIEW_FOUR`, `PREFLOP_FOLD_ONLY`, `userTableAfter`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Stored decision shape: the compact `HandRecordDecision` below (grade, rule id and margin plus flat recommendation fields). | Full `GradeResult` including the whole `Recommendation` (chart cell, outs, pot, move, …). | Persisted format; REQ-053 needs 100,000 records; the compact form doesn't tie stored data to internal advice types. | yes | user (Q-1) |
| D-2 | A snapshot entry's seat must be a safe integer 1..10 (MAX_SEAT = 10); AC#6 reworded to match. | 1..6 (original AC text). | Tables have up to 10 seats (`src/table/session.ts:150`); same bound as the hand record (`hand-record.ts:203`). | yes | user (Q-2) |
| D-3 | Edit the locked `tests/storage/hand-records.acceptance.test.ts:72` to also destructure `decisions` out of `rest`, and assert `decisions` has the expected length. | Store decisions in a separate object store. | A one-line edit keeps the TASK-3.9 assertion intact; a second store would split one hand's data. | yes | user (Q-3; unlocked under TASK-3.9) |
| D-4 | Records without `decisions` (written by earlier dev builds) fail `parseHandRecord` with `Invalid hand record: decisions`. Nothing is deleted. | Treat a missing field as `[]`. | `[]` would falsely say the user made no decisions. No UI reads stored records yet; REQ-054 owns migration. | yes | user (Q-4) |
| D-5 | `userAdviceOptions(observed?)` moves to `src/advice/recommend.ts` and is exported. `advice-service.ts` imports it. | Export it from advice-service (would pull the bots module into hand-record's imports). | One definition guarantees hint = record. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/recommend.ts` — export `userAdviceOptions(observed?: readonly ObservedOpponent[]): RecommendOptions`.
- `src/table/advice-service.ts` — use `userAdviceOptions` (delete the local `userOptions`).
- `src/advice/ranges.ts` — `observedBySeat`: entry object check and seat check (AC#6).
- `src/table/hand-record.ts` — `HandRecordDecision`, `decisionRecord`, `HandRecord.decisions`, parse validation.
- `tests/support/table-scenarios.ts` — `userTableAfter(fixed, moves, button?, stacks?, observed?)`.
- `tests/table/decision-record.acceptance.test.ts` (new) — AC#1–#6.
- `tests/table/decision-record.test.ts` (new) — builder and parse unit cases.
- `tests/storage/hand-records.acceptance.test.ts` — D-3 one-line change (approved Q-3; unlocked under TASK-3.9).
- `docs/storage/hand-records.md` — "Record fields" and "Validation on read" sections.

### Components, interfaces and data
```ts
// src/table/hand-record.ts (Q-1)
export interface HandRecordGrade {
  readonly grade: Grade;               // 'correct' | 'minor' | 'major'
  readonly ruleId: GradeRuleId;
  readonly marginPts: number | null;   // as GradeResult.marginPts
}
export interface HandRecordDecision {
  readonly street: 'preflop' | 'flop' | 'turn' | 'river';
  readonly action: Action;             // the user's action, copied ({seat, type, amount?})
  readonly recommended: Action;        // recommendation.move, copied
  readonly alternative: ActionType | null;
  readonly ruleId: PostflopRuleId | null;        // null preflop (A-2)
  readonly basis: 'chart' | 'equity';
  readonly equityPct: number | null;             // null iff basis 'chart'
  readonly requiredEquityPct: number | null;     // null iff basis 'chart'
  readonly opponentBasis: readonly OpponentBasis[]; // [] for 'chart'; copies of {seat, observedHands, text}
  readonly explanation: string;
  readonly grade: HandRecordGrade;
  readonly hinted: boolean;            // false in this story
}
// HandRecord gains: readonly decisions: readonly HandRecordDecision[];  (one per CompletedHand.userDecisions, same order)

/** Advice for one decision: gradeView(view, action.type, userAdviceOptions(observed)). Errors from gradeView /
 *  estimateOpponentRanges propagate (RangeError). Plain JSON data sharing nothing with `decision`. */
export function decisionRecord(decision: UserDecision): HandRecordDecision;
```
- `handRecord` adds `decisions: hand.userDecisions.map(decisionRecord)` (field placed after `actions`).
- `userAdviceOptions(undefined)` returns `ACTION_RANGE_ADVICE`. Otherwise it returns
  `{ ...ACTION_RANGE_ADVICE, observedOpponents: observed }`. This matches the current `userOptions` behaviour exactly.

### Rules and algorithms
- Invariant: for every entry, `recommended`, `alternative`, `ruleId`, `equityPct`, `requiredEquityPct`,
  `opponentBasis`, `explanation` and `grade` equal the corresponding fields of
  `handleAdviceRequest({kind:'grade', view, userAction: action.type, observed})`'s `value`. This is the hint path.
- Worked example (REVIEW_FOUR, `tests/table/review.acceptance.test.ts:40-45`): the 4 entries have streets
  preflop/flop/turn/river, actions raise/bet/check/call, recommended `move` types raise/bet/bet/raise and grades
  correct/correct/minor/major.
- AC#2: decisions made with snapshot `[{seat: 2, hands: 29, vpip, pfr}]` give `opponentBasis` for seat 2 of
  `{observedHands: null, text: 'typical player'}`. The stored values equal advice from the 29-hand snapshot. They
  differ from the advice a 30-hand snapshot gives (`observedHands: 30`).
- `parseHandRecord` checks for `decisions` (after `actions`), in this order:
  1. Array 0..400. Entry i is an object.
  2. `street` is one of STREETS.
  3. `action` is an object with `seat === userSeat`, `type` in fold/check/call/bet/raise, and `amount` a whole ≥ 0
     for call/bet/raise.
  4. `recommended` has the same shape (seat = userSeat). `alternative` is null or a type in the same set.
  5. `basis` is 'chart' or 'equity'. For 'chart': `ruleId`, `equityPct` and `requiredEquityPct` are null and
     `opponentBasis` is `[]`. For 'equity': `ruleId` is in POSTFLOP_RULE_IDS, both percents are finite numbers
     0..100, and `opponentBasis` has 0..9 entries, each `{seat}` in the record's seats, `observedHands` null or
     whole ≥ 0, and `text` a string of 1..200.
  6. `explanation` is a string of 1..2000.
  7. `grade` is an object: `grade` in GRADE_LABELS keys, `ruleId` in GRADE_RULE_IDS, `marginPts` null or finite.
  8. `hinted` is a boolean.
  9. Cross-check (A-3): the user's non-blind entries of `actions` have the same count. Each one's street, type and
     amount equals entry i's `street`, `action.type` and `action.amount` (amount 0 for fold/check in ActionRecord;
     the Action has no amount).
  Error fields are `decisions`, `decisions[i]`, `decisions[i].<path>`, e.g. `decisions[2].grade.ruleId`.
- `observedBySeat` (`src/advice/ranges.ts`), for each entry at index i:
  - If it is not a non-null object (or is an array), it throws `RangeError('Invalid observed stats entry <i>')`.
  - If `seat` is not a safe integer in 1..MAX_SEAT (10, Q-2), it throws
    `RangeError('Invalid observed stats seat <String(seat)>')`.
  - The existing number and duplicate checks follow, unchanged.

### Error handling and configuration
- `handRecord` lets `gradeView`/`estimateOpponentRanges` RangeErrors propagate. `handWrite` is the only production
  caller. The error can't happen today because no snapshot is supplied and the engine only offers legal views.
- Parse errors are `RangeError('Invalid hand record: <field>')`, as today.

## 6. Behaviour specification

### SPEC-01: Four decisions recorded in order with full advice
- Verifies: AC#1
- Behaviour: Given `REVIEW_FOUR` (4 user decisions), When `handRecord(completedHand(t), meta)` is built, saved
  through `openHandStore` (fake-indexeddb) and read back with `get`, Then `decisions` has 4 entries in order. Their
  streets are `['preflop','flop','turn','river']` and their `action.type`s are `['raise','bet','check','call']`.
  The `recommended.type`s are `['raise','bet','bet','raise']` and the grades `['correct','correct','minor','major']`.
  Each entry has all of street, action, recommended, equityPct, requiredEquityPct, basis/opponentBasis, a non-empty
  explanation and a grade. Entry 0 has `basis: 'chart'` with null percents. Entries 1–3 have `basis: 'equity'` with
  finite percents and `opponentBasis` listing seat 2. Each entry deep-equals the advice the worker `grade` request
  returns for that decision's view.
- Verification: acceptance `tests/table/decision-record.acceptance.test.ts::four decisions are stored in order with recommendation, numbers, explanation and grade`

### SPEC-02: Decision-time snapshot, not hand-end stats
- Verifies: AC#2
- Behaviour: Given the REVIEW_FOUR moves played with snapshot `[{seat: 2, hands: 29, vpip: 60, pfr: 5}]` on every
  user decision, When the record is read, Then every postflop entry's `recommended`, `ruleId`, `equityPct`,
  `requiredEquityPct` and `opponentBasis` equal `recommend(view, userAdviceOptions(snapshot29))`. Seat 2's basis is
  `{observedHands: null, text: 'typical player'}`. These values differ from `recommend(view, userAdviceOptions(snapshot30))`,
  whose seat 2 basis has `observedHands: 30`.
- Verification: acceptance `tests/table/decision-record.acceptance.test.ts::advice uses the decision-time snapshot of 29 hands, not 30`

### SPEC-03: Hinted flag defaults to false
- Verifies: AC#3
- Behaviour: Given any recorded hand with decisions (REVIEW_FOUR), When read back, Then every entry has `hinted === false`.
- Verification: acceptance `tests/table/decision-record.acceptance.test.ts::a decision made without a hint has hinted false`

### SPEC-04: Preflop fold gives exactly one entry
- Verifies: AC#4
- Behaviour: Given `PREFLOP_FOLD_ONLY`, When the record is read, Then `decisions` has length 1. That entry has
  street 'preflop', action type 'fold', `basis: 'chart'` and a grade object whose `grade` is one of
  correct/minor/major and equals `gradeView(view, 'fold', userAdviceOptions()).grade`.
- Verification: acceptance `tests/table/decision-record.acceptance.test.ts::a preflop fold at the first decision stores exactly one graded entry`

### SPEC-05: Stored grade data round-trips through JSON
- Verifies: AC#5
- Behaviour: Given the REVIEW_FOUR record, When `JSON.parse(JSON.stringify(record.decisions))` is computed, Then it
  `toStrictEqual`s `record.decisions`, and `parseHandRecord(JSON.parse(JSON.stringify(record)))` succeeds. Each
  `grade` has exactly the keys `grade`, `ruleId`, `marginPts` (D-1). Entry 3's `grade.ruleId` is
  `'call-fold-margin'` or `'aggression-margin'` with numeric `marginPts`, equal to the worker's GradeResult values.
- Verification: acceptance `tests/table/decision-record.acceptance.test.ts::stored grade data is the decided shape and round-trips through JSON`

### SPEC-06: Bad snapshot entries throw RangeError from estimateOpponentRanges
- Verifies: AC#6
- Behaviour: Given a flop view with live opponents, When `estimateOpponentRanges(view, s)` runs with each `s` in
  `[[null]]`, `[[undefined]]`, `[[42]]`, `[[{seat: 0,…valid}]]`, `[[{seat: 1.5,…}]]`, `[[{seat: '2',…}]]`,
  `[[{seat: NaN,…}]]` and `[[{seat: 11,…}]]`, Then each throws an error that is `instanceof RangeError`
  (never TypeError). The message for an entry names its index; the message for a seat names the bad value. The same
  happens through `recommend(view, userAdviceOptions(s))`, through `decisionRecord`, and through the worker
  (`ok: false`, `error.name === 'RangeError'`). A valid entry for seat 2 together with a bad second entry still throws.
- Verification: acceptance `tests/table/decision-record.acceptance.test.ts::a null snapshot entry or bad seat throws RangeError, never TypeError`

### SPEC-07: parseHandRecord validates decisions
- Verifies: AC#5, DoD#1
- Behaviour: Given a valid REVIEW_FOUR record, When one field is changed, Then `parseHandRecord` throws
  `RangeError('Invalid hand record: <field>')` with this field. Cases:
  - `decisions` missing → `decisions` (D-4).
  - `decisions[1].street = 'showdown'`.
  - `decisions[0].action.seat = 2` → `decisions[0].action.seat`.
  - `decisions[1].basis = 'chart'` with numbers left → `decisions[1].ruleId`.
  - `decisions[1].equityPct = 101` and `= NaN`.
  - `decisions[2].grade.ruleId = 'x'`.
  - `decisions[2].grade.marginPts = Infinity`.
  - `decisions[0].hinted = 'no'`.
  - `decisions[1].opponentBasis[0].seat = 9` (not dealt in).
  - `decisions[0].explanation = ''`.
  - An extra 5th entry → `decisions`.
  - `decisions[3].action.type = 'fold'` (mismatch with actions) → `decisions[3].action`.
  - Two entries swapped → the first mismatching index.

  The unmodified record and a 0-decision record (bots-only fold-out where the user never acted) both parse.
- Verification: unit `tests/table/decision-record.test.ts::parseHandRecord rejects bad decision entries`

### SPEC-08: Builder copies, shares nothing, and matches the worker
- Verifies: AC#1, AC#5
- Behaviour: `decisionRecord(d)` returns plain data. Mutating the result does not change `d.view` or `d.observed`.
  `recommended` is a copy (not `===`) of the recommendation's `move`. For a decision without `observed`, the result
  equals the advice with `ACTION_RANGE_ADVICE`. `userAdviceOptions(undefined) === ACTION_RANGE_ADVICE`. The worker's
  `recommend`/`grade` responses are unchanged (the existing `tests/table/decision-snapshot.test.ts` and
  `tests/table/advice-service.test.ts` pass).
- Verification: unit `tests/table/decision-record.test.ts::decisionRecord copies the advice of the hint path`

### SPEC-09: Repo checks, coverage, golden suite, boundaries, no network
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#8
- Behaviour: lint, typecheck and `npm test` pass with zero errors and the coverage thresholds hold. `tests/golden/`
  passes 100%. `src/advice/*` changes import no UI or browser-only code (the existing boundary test passes). No
  network APIs are added.
- Verification: command `npm run lint && npm run typecheck && npm test && npx vitest run tests/golden/`

### SPEC-10: Playtest unchanged
- Verifies: DoD#6
- Behaviour: `npm run -s playtest -- --hands 10000 --seed 42` reports `Invariant violations: 0`, and its output is
  byte-identical to `main`. Bots never pass snapshots, so advice is unchanged.
  `npm run -s playtest -- --hands 10000 --seed 42 --check-advice` reports 0 mismatches.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --check-advice`

### SPEC-11: Documentation
- Verifies: DoD#9, DoD#11
- Behaviour: `docs/storage/hand-records.md` documents the `decisions` fields, the chosen grade shape (AC#5), the
  `hinted` default, the decision-time snapshot rule and the new validation rules. The text is original. The story
  doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/storage/hand-records.md`; `backlog doc list --plain` shows the story doc

### SPEC-12: N/A items and CI
- Verifies: DoD#7, DoD#10, DoD#12
- Behaviour: DoD#7 and DoD#12 are N/A because no screen or dialog changes (`git diff main --stat -- src/ui` shows no
  files). CI is green on `doit/TASK-3.12`.
- Verification: manual `gh run list --branch doit/TASK-3.12 --limit 1` shows success

## 7. Edge cases
- No user decision (bots fold out before the user acts, or a big-blind walk): `decisions: []`, and it parses (SPEC-07).
- Preflop-only hand: chart entries with null numbers (SPEC-04).
- A user all-in, then no further decisions: entries stop at the last user action. The cross-check holds (A-3).
- Snapshot seat not at the table, or folded: ignored (A-5). Null entry or bad seat: RangeError (SPEC-06).
- Advice throws at hand end: the error propagates from `handWrite`, as review errors do today (`review.ts` A-5).
  This can't happen without a snapshot supplier.
- Old stored records without `decisions`: rejected on read (D-4).
- Concurrency, interruption and permissions: unchanged (`store.add` is one transaction, TASK-3.9/3.10).

## 8. Security considerations
- Trust boundary 1: stored IndexedDB values. `parseHandRecord` validates every new field with type, enum, range
  and length bounds (A-6), and cross-checks against `actions` (SPEC-07). Strings are never interpreted as markup
  here.
- Trust boundary 2: snapshots crossing the worker boundary (`AdviceRequest.observed`). `observedBySeat` now rejects
  non-object entries and bad seats with RangeError (SPEC-06). This closes TASK-7.13's MINOR
  `non-object-snapshot-entry-typeerror`.
- Secrets, authn/authz, injection, logging, new dependencies, randomness: N/A. No new dependency, and advice is
  deterministic.

## 9. Non-functional
- Record size: the compact entry is about 0.5–1 KB per decision, mostly the explanation. This supports REQ-053's
  100,000 records.
- Hand-end cost: one `gradeView` per user decision on the main thread. This is the same work `userReviewEntries`
  already does at hand end (`src/ui/table/Table.tsx:261`). No new timing test; per the standing rule, any speed
  check would go in the opt-in slow group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --check-advice`
- New tests:
  - `tests/table/decision-record.acceptance.test.ts` → SPEC-01, 02, 03, 04, 05, 06
  - `tests/table/decision-record.test.ts` → SPEC-07, 08
  - `tests/storage/hand-records.acceptance.test.ts` (D-3 edit) → keeps TASK-3.9 coverage
- End-to-end for the Judge: run `npx vitest run tests/table/decision-record.acceptance.test.ts tests/storage/`.
  Then, in a scratch script, build `handRecord(completedHand(REVIEW_FOUR), meta)` and print `decisions`. Confirm 4
  entries whose grades read correct/correct/minor/major, all with `hinted: false`, and that `JSON.stringify` round-trips.

## 11. Open questions
None. Q-1..Q-4 answered in `doit/TASK-3.12/qa.md` (recommended options): Q-1 → D-1, Q-2 → D-2 (AC#6 now reads
1 to 10), Q-3 → D-3, Q-4 → D-4.

## 12. Clarifications log
See `doit/TASK-3.12/qa.md`.
