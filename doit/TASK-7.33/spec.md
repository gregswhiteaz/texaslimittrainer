# Spec: TASK-7.33 — Harden the TASK-7.32 advice fields and river-bet clause

Status: READY (approved 2026-11-26)
Task: TASK-7.33 · Parent/epic: TASK-7 · Requirements: n/a (follow-up from doc-129, TASK-7.32 review) · Dream: limit-holdem-trainer

## 1. Summary
This task closes five review follow-ups from TASK-7.32 (doc-129). `PostflopRecommendation.requiredCountsRiverBet`
and `valueThresholdPct` become required fields. The Q-3 river-bet clause gets its own template, filled into a
`{riverBet}` slot, instead of being added by `String.replace`, and a test fails if any template a bet against the
hero can use loses the slot. The grader rejects a non-finite `valueThresholdPct` with the same `RangeError` it uses
for the other percent fields. Two names are corrected: the value-bet AC#6 test title (65.1%) and the golden spot id
`6max-flop-co-raise-jj`, which now names a different spot. Every explanation stays byte-identical.

## 2. Scope
- In scope:
  - `src/advice/postflop.ts`: `requiredCountsRiverBet: boolean` and `valueThresholdPct: 50 | 65` become required.
    Doc comments are updated.
  - `src/advice/explanations.ts`: in the 5 templates that contain the pot-odds lead, `Pot odds, {def:pot-odds}, ask`
    becomes `Pot odds, {def:pot-odds}{riverBet}, ask`. New constant `POT_ODDS_RIVER_BET_CLAUSE`. `POT_ODDS_LEAD`
    and `POT_ODDS_RIVER_BET_LEAD` are removed.
  - `src/advice/explain.ts`: `explainPostflop` fills `riverBet` from the clause template and no longer calls
    `.replace`.
  - `src/advice/grade.ts`: `finitePct` also accepts `'valueThresholdPct'`. The aggression-margin path validates a
    present (non-null) threshold.
  - `src/advice/golden.ts`: `GoldenNumbers` keeps `valueThresholdPct` optional (A-1).
  - Hand-built `PostflopRecommendation` inputs in 3 test files gain the two fields (no assertion removed).
  - AC#4 renames, the golden-spots log entry, one sentence in `docs/advice/explanations.md`, and the new acceptance
    test file.
- Not doing:
  - No change to explanation wording, advice rules, thresholds, grading outcomes or any golden spot's cards, line,
    board, action or justification.
  - `EquityGradeInput.valueThresholdPct` and `equityVsCallingRangePct` stay optional/nullable. Absent or null
    still means 50, and hand-built grader inputs keep working.
  - No range check on `valueThresholdPct` (e.g. "must be 50 or 65"). The AC asks only for finiteness.
  - `explainPostflop` keeps its `(rec, valueThresholdPct)` signature, so locked callers in
    `tests/advice/value-copy.acceptance.test.ts` keep compiling.
  - The TASK-7.32 and TASK-7.31 rows of `docs/advice/golden-spots.md` are history and are not rewritten.
  - No change to stored hand records. They map a recommendation into their own `HandRecordDecision` shape
    (`src/table/hand-record.ts:171-200`) and never persist `PostflopRecommendation` itself.
- Scope budget: files=13, lines=280

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `GoldenNumbers` (`src/advice/golden.ts:81-84`) keeps `valueThresholdPct` optional, as `Pick<…4 fields> & Partial<Pick<PostflopRecommendation, 'valueThresholdPct'>>` | yes | AC#1 targets `recommendPostflop` output. `GoldenNumbers` is the clear-cut rule's numbers seam and feeds `EquityGradeInput`, where absent already means 50 (`grade.ts:49-50`). Making it required would force edits to 4 hand-built sites in 3 golden test files, 2 of them locked (TASK-7.31, TASK-7.14), and change no behaviour. | Make it required and add `valueThresholdPct: 50` at `tests/golden/postflop-golden.test.ts:49,150`, `postflop-lines.acceptance.test.ts:113,148` and `postflop.acceptance.test.ts:120` |
| A-2 | The new golden id is `6max-flop-co-raise-jj-3way` | yes | The hand, street, seat and action are unchanged, so the usual `<size>-<street>-<pos>-<action>-<hand>` id cannot differ without a suffix. `-3way` is the code reviewer's suggestion (`doit/TASK-7.32/reviews/round-1/code.json:51`) and fits within ID_CHARS = 60 (`golden.ts:111`). | `6max-flop-co-raise-jj-vs2`, `6max-flop-co-raise-jj-iso` |
| A-3 | The river-bet clause template is `', counting the big bet you will likely face on the river'` (leading comma), and the slot sits right after `{def:pot-odds}` | yes | This gives byte-identical output to today's `POT_ODDS_RIVER_BET_LEAD` (`explanations.ts:144-145`) with no extra or missing spaces. It was prototyped: all advice, golden, table and bot tests pass unchanged. | A slot that holds the whole lead (`{potOddsLead}`). Rejected because the `explain.test.ts` concept-definition check would then no longer see the pot-odds definition inside the template. |
| A-4 | In the aggression-margin rule, `equityVsCallingRangePct` is validated before `valueThresholdPct`, so when both are non-finite the existing `equityVsCallingRangePct` error wins | yes | This keeps every existing error message unchanged (`tests/advice/grade-hardening.acceptance.test.ts:45-60`) | Threshold first |

## 3. Current system
- TypeScript (strict), Vitest, ESLint + Prettier (`package.json` scripts). `tsc -p tsconfig.json` also typechecks
  `tests/` (`tsconfig.json` include), so type-level assertions in tests run under `npm run typecheck`.
- `src/advice/postflop.ts:50-54` and `:73-78` declare `requiredCountsRiverBet?: boolean` and
  `valueThresholdPct?: 50 | 65`, both commented "optional so hand-built inputs stay valid".
  `recommendPostflop` always sets them (`postflop.ts:174`, `:191`, `:229`, `:238`).
- `src/advice/explain.ts:106-110` builds the turn template with
  `POSTFLOP_TEMPLATES[key].replace(POT_ODDS_LEAD, POT_ODDS_RIVER_BET_LEAD)`. If a template's wording drifts from
  `POT_ODDS_LEAD`, the replace silently does nothing.
- `src/advice/explanations.ts:95-105` `fillTemplate` replaces `{key}` and `{def:id}` in a single pass. It throws on
  unknown placeholders but ignores unused values, so a template that lost its slot would also drop the clause
  silently. That is why SPEC-03 guards the slot directly.
- `src/advice/explanations.ts:125-140`: the 5 templates that contain `Pot odds, {def:pot-odds}, ask` are
  `value-raise`, `pot-odds-call`, `implied-odds-call`, `pot-odds-fold` and `pot-odds-fold-implied`. These are
  exactly the keys reachable when something is owed, which is the only case where `requiredCountsRiverBet` can be
  true (`postflop.ts:174`).
- `src/advice/grade.ts:81-89` `finitePct` validates `equityPct`, `requiredEquityPct` and `equityVsCallingRangePct`
  with `RangeError(\`${field} must be a finite number, got ${String(value)}\`)`. `grade.ts:139` reads
  `valueThresholdPct ?? 50` without validation.
- `tests/advice/explain.test.ts:398-431` checks that every template uses only known placeholders. Its `values`
  object must gain `riverBet`.
- Source scan from TASK-7.30: `explain.test.ts::src/advice fills placeholders only through fillTemplate`
  (`doit/TASK-7.30/spec.md` SPEC-04). It is unaffected because this change removes a `.replace` call rather than
  adding one.
- Typechecking with the two fields required (prototype) fails in exactly 3 test files: `tests/advice/explain.test.ts:42`,
  `tests/advice/value-copy.acceptance.test.ts:7` and `tests/table/hint.test.ts:47`. Golden numbers sites stay valid
  under A-1.
- Golden spot `6max-flop-co-raise-jj` is at `tests/golden/postflop-spots.json:226`. No test, source or doc
  references it by id except `docs/advice/golden-spots.md:227,284` (history rows). Golden tests are titled
  `AC#5 the advice engine agrees with golden spot ${spot.id}` (`tests/golden/postflop.acceptance.test.ts:137`).
- The value-bet test title is at `tests/advice/value-bet.acceptance.test.ts:244`
  (`'AC#6 50.1% against callers raises'`, testing 0.651).
- Existing code to reuse:
  - `src/advice/explanations.ts` → `fillTemplate`, `CONCEPTS` (pot-odds definition text), `POSTFLOP_TEMPLATES`
  - `src/advice/explain.ts` → `explainPostflop`, `formatPct`
  - `tests/advice/value-copy.acceptance.test.ts:7-24` → the pattern for a hand-built `PostflopInput` factory
  - `tests/advice/grade-hardening.acceptance.test.ts:4-27` → the pattern for the `equity()` fixture and the
    AGGRESSION / CALL_FOLD pairs

### Locked files this build must edit (owner from `doit/*/state.json` `locked_tests`)
| File | Owner | Edit (no assertion added or removed) |
|---|---|---|
| `tests/golden/postflop-spots.json` | TASK-7.14 | line 226: `"id": "6max-flop-co-raise-jj"` → `"6max-flop-co-raise-jj-3way"`. Nothing else changes. |
| `tests/advice/value-bet.acceptance.test.ts` | TASK-7.8 | line 244: title `'AC#6 50.1% against callers raises'` → `'AC#6 65.1% against callers raises'` |
| `tests/advice/value-copy.acceptance.test.ts` | TASK-8.1 | factory `input` (lines 7-24): add `requiredCountsRiverBet: false,` and `valueThresholdPct: 50,` before `...fields` |

Unlocked test files edited: `tests/advice/explain.test.ts` (factory at :42 gains the two fields; `values` at
:399-411 gains `riverBet: ''`; new SPEC-04 unit test) and `tests/table/hint.test.ts` (factory at :47 gains the two
fields). Locked files named as verification but **not** edited: `tests/golden/postflop.acceptance.test.ts`
(TASK-7.14), `tests/advice/grade-hardening.acceptance.test.ts` (TASK-7.23) and
`tests/advice/postflop-folding.acceptance.test.ts` (TASK-7.32).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The river-bet clause is a `{riverBet}` slot in each owed-bet template, filled with `fillTemplate(POT_ODDS_RIVER_BET_CLAUSE, {})` or `''` | Keep `.replace` and add only a test. Or use a separate turn copy of each template. | AC#2 asks for a clause built from its own template. A slot plus a slot-presence test makes drift fail loudly. Five duplicated templates would make drift more likely. | no | n/a |
| D-2 | The `explainPostflop` signature is unchanged | Drop the `valueThresholdPct` parameter now that the field is required | The change is out of scope, and it would force edits to the locked `value-copy.acceptance.test.ts` call sites | no | n/a |
| D-3 | The id rename is logged as a new "Changes from TASK-7.33" section in `docs/advice/golden-spots.md`, with an old/new/reason table, matching earlier sections | Edit the TASK-7.32 row in place | Earlier sections are history, and every re-pin so far has been logged as a new section | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/postflop.ts` — make the two fields required and update their doc comments
- `src/advice/explanations.ts` — add the `{riverBet}` slot to 5 templates, add `POT_ODDS_RIVER_BET_CLAUSE`, remove
  `POT_ODDS_LEAD` and `POT_ODDS_RIVER_BET_LEAD`
- `src/advice/explain.ts` — fill `riverBet` and drop the `.replace`
- `src/advice/grade.ts` — validate a present `valueThresholdPct` as finite
- `src/advice/golden.ts` — `GoldenNumbers` keeps `valueThresholdPct` optional (A-1)
- `tests/advice/advice-hardening.acceptance.test.ts` — new: SPEC-01, SPEC-02, SPEC-03, SPEC-05, SPEC-06
- `tests/advice/explain.test.ts` — factory fields, `riverBet` placeholder value, SPEC-04 unit test
- `tests/advice/value-copy.acceptance.test.ts` — (locked, TASK-8.1) factory fields only
- `tests/table/hint.test.ts` — factory fields only
- `tests/advice/value-bet.acceptance.test.ts` — (locked, TASK-7.8) AC#6 title only
- `tests/golden/postflop-spots.json` — (locked, TASK-7.14) one id only
- `docs/advice/golden-spots.md` — new "Changes from TASK-7.33" section
- `docs/advice/explanations.md` — one sentence: the clause is its own template filled into `{riverBet}`

### Components, interfaces and data
- `PostflopRecommendation` (`postflop.ts`):
  - `readonly requiredCountsRiverBet: boolean;` — comment: "True iff requiredEquityPct counts a river bet (turn,
    something owed, R > 0)."
  - `readonly valueThresholdPct: 50 | 65;` — comment: "The value threshold that applied:
    VALUE_RAISE_THRESHOLD_PCT when a bet is owed, else VALUE_THRESHOLD_PCT."
  - The "optional so hand-built inputs…" wording is removed.
- `explanations.ts`:
  - `export const POT_ODDS_RIVER_BET_CLAUSE = ', counting the big bet you will likely face on the river';` with a
    doc comment saying it is the Q-3 (TASK-7.32) clause filled into `{riverBet}` when a turn price counts the river
    big bet, and `''` otherwise.
  - In `POSTFLOP_TEMPLATES`, each of the 5 occurrences of `Pot odds, {def:pot-odds}, ask` becomes
    `Pot odds, {def:pot-odds}{riverBet}, ask`. No other character changes.
- `explain.ts` `explainPostflop`: sets `values.riverBet = rec.requiredCountsRiverBet ?
  fillTemplate(POT_ODDS_RIVER_BET_CLAUSE, {}) : ''` and uses `fillTemplate(POSTFLOP_TEMPLATES[key], values)`. It no
  longer imports the two removed constants. It contains no `.replace(` call.
  `values.riverBet` is set for every key. Templates without the slot ignore it, as `fillTemplate` does today.
- `grade.ts`:
  - `finitePct`'s field union gains `'valueThresholdPct'`.
  - Aggression-margin path: `calling = tenths(finitePct('equityVsCallingRangePct', vsCallingRange))` comes first.
    Then `const t = recommendation.valueThresholdPct; threshold = tenths(t === undefined || t === null ?
    VALUE_THRESHOLD_PCT : finitePct('valueThresholdPct', t))`. Then `distance = Math.abs(calling - threshold)`.
  - The `gradeDecision` doc comment already says it throws when a number the deciding rule reads is non-finite, and
    it stays true.
- `golden.ts`: `export type GoldenNumbers = Pick<PostflopRecommendation, 'action' | 'equityPct' |
  'requiredEquityPct' | 'equityVsCallingRangePct'> & Partial<Pick<PostflopRecommendation, 'valueThresholdPct'>>;`,
  with a comment that hand-built numbers may omit the threshold (→ 50).

### Rules and algorithms
- Clause example: `pot-odds-fold` on the turn with `requiredCountsRiverBet: true`, equity 22.0% and required 26.7%
  gives exactly "Your equity, your share of the pot if the hand were played out to the end, is 22.0%. Pot odds, the
  cost of a call as a share of the pot after you call, counting the big bet you will likely face on the river, ask
  for 26.7%, more than you have, so folding saves chips over time." This is the same text as today
  (`tests/advice/postflop.test.ts:457-459`).
- With `requiredCountsRiverBet: false` the text is identical except that the clause is absent.
- Grading example: input `{ action: 'raise', equityVsCallingRangePct: 70, valueThresholdPct: NaN }`, user `call` →
  throws `RangeError('valueThresholdPct must be a finite number, got NaN')`. With `valueThresholdPct: 65` → minor,
  `aggression-margin`, margin 5. With it absent or null → major, margin 20 (threshold 50).

### Error handling and configuration
- The only new error is `RangeError(\`valueThresholdPct must be a finite number, got ${String(value)}\`)`, thrown
  only on the aggression-margin path when the value is a non-finite number. `undefined` and `null` still mean 50.
- No configuration.

## 6. Behaviour specification

### SPEC-01: recommendPostflop output has both fields as required types
- Verifies: AC#1
- Behaviour: Given the `PostflopRecommendation` type, When the test file is typechecked, Then
  `expectTypeOf<PostflopRecommendation['requiredCountsRiverBet']>().toEqualTypeOf<boolean>()` and
  `expectTypeOf<PostflopRecommendation['valueThresholdPct']>().toEqualTypeOf<50 | 65>()` hold. A literal
  `PostflopRecommendation` that omits either field is a type error (`// @ts-expect-error` on each of two literals:
  one omitting `requiredCountsRiverBet`, one omitting `valueThresholdPct`). At runtime, use the user views
  (`playerView(t.hand as HandState, t.config.userSeat)`) of `FLOP_BET` and `RIVER` from
  `tests/support/table-scenarios.ts:148`. `recommendPostflop(view)` returns `requiredCountsRiverBet === false` in
  both, `valueThresholdPct === 65` for `FLOP_BET` (a bet is owed) and `valueThresholdPct === 50` for `RIVER`
  (nothing owed). These values were checked in a prototype run.
- Verification: acceptance `tests/advice/advice-hardening.acceptance.test.ts::AC#1 recommendPostflop output has required requiredCountsRiverBet and valueThresholdPct`

### SPEC-02: Every owed-bet turn explanation carries the clause from its own template
- Verifies: AC#2
- Behaviour: Given a hand-built turn `PostflopInput` (all fields, `street: 'turn'`, `opponentBasis: []`) for each of
  these cases, When `explainPostflop(input, threshold)` runs with `requiredCountsRiverBet: true` (text W) and with
  `false` (text N), Then:
  - (a) W contains `'Pot odds, the cost of a call as a share of the pot after you call, counting the big bet you
    will likely face on the river, ask'` exactly once.
  - (b) N contains no `'counting the big bet'`.
  - (c) `W.replace(', counting the big bet you will likely face on the river', '') === N`.
  - (d) `POT_ODDS_RIVER_BET_CLAUSE === ', counting the big bet you will likely face on the river'`.

  The cases are:
  - `value-raise` (action raise, threshold 65, requiredEquityPct 26.7, callAmount 8)
  - `pot-odds-call` (call)
  - `implied-odds-call` (call, impliedRequiredEquityPct 10, 9 outs)
  - `pot-odds-fold` (fold, impliedRequiredEquityPct null)
  - `pot-odds-fold` with impliedRequiredEquityPct 10 (the `pot-odds-fold-implied` key)

  Also, for `pot-odds-call` with one `opponentBasis` entry whose `observedHands` is 45, W still contains (a), with
  the opponent-type lead in front of it.
- Verification: acceptance `tests/advice/advice-hardening.acceptance.test.ts::AC#2 every turn explanation that counts the river bet carries the river-bet clause`

### SPEC-03: A template that loses its river-bet slot fails a test
- Verifies: AC#2
- Behaviour: Given `POSTFLOP_TEMPLATES`, When the keys `value-raise`, `pot-odds-call`, `implied-odds-call`,
  `pot-odds-fold` and `pot-odds-fold-implied` are read, Then each template contains `'{riverBet}'` exactly once,
  immediately after `'{def:pot-odds}'` (substring `'{def:pot-odds}{riverBet}'`). The keys `value-bet` and
  `check-free` never have something owed, and the test does not constrain them.
- Verification: acceptance `tests/advice/advice-hardening.acceptance.test.ts::AC#2 every template a bet facing the hero can use has one river-bet slot`

### SPEC-04: explainPostflop no longer edits template text
- Verifies: AC#2
- Behaviour: Given the source of `src/advice/explain.ts` (read with `node:fs`), When the body of `explainPostflop`
  is scanned, Then it has no `.replace(` or `.replaceAll(` call. Also, `src/advice/explanations.ts` exports no
  `POT_ODDS_LEAD` or `POT_ODDS_RIVER_BET_LEAD` (checked via `Object.keys` of the module namespace).
- Verification: unit `tests/advice/explain.test.ts::explainPostflop adds the river-bet clause through its own template, not a text replace`

### SPEC-05: A non-finite valueThresholdPct is rejected like the other percent fields
- Verifies: AC#3
- Behaviour: Given an `EquityGradeInput` with `equityVsCallingRangePct: 70` and `valueThresholdPct` ∈
  {`NaN`, `Infinity`, `-Infinity`}, When it is graded for each AGGRESSION pair (`bet`/`check`, `raise`/`call`,
  `check`/`bet`, `call`/`raise`; recommended/user), Then `gradeDecision` throws `new RangeError(\`valueThresholdPct
  must be a finite number, got ${String(value)}\`)`. This is the message format of
  `tests/advice/grade-hardening.acceptance.test.ts:38`. When both `equityVsCallingRangePct` and
  `valueThresholdPct` are `NaN`, the `equityVsCallingRangePct` message is thrown (A-4).
- Verification: acceptance `tests/advice/advice-hardening.acceptance.test.ts::AC#3 a non-finite valueThresholdPct is rejected like other non-finite percent fields`

### SPEC-06: An absent or unused valueThresholdPct still grades as before
- Verifies: AC#3
- Behaviour: Given the AGGRESSION pairs with `equityVsCallingRangePct: 70`:
  - `valueThresholdPct` `undefined` or `null` → `{ grade: 'major', ruleId: 'aggression-margin', marginPts: 20 }`
  - `valueThresholdPct: 65` → `{ grade: 'minor', ruleId: 'aggression-margin', marginPts: 5 }`
  - `valueThresholdPct: NaN` with `equityVsCallingRangePct: null` → `aggression-no-range` (no throw)
  - `valueThresholdPct: NaN` on each CALL_FOLD pair (`call`/`fold`, `fold`/`call`, `fold`/`raise`,
    `raise`/`fold`) with `equityPct: 50, requiredEquityPct: 40` → `call-fold-margin` (no throw)
  - `valueThresholdPct: NaN` when the user action matches → `{ grade: 'correct', ruleId: 'match' }`
- Verification: acceptance `tests/advice/advice-hardening.acceptance.test.ts::AC#3 an absent or unused valueThresholdPct does not throw`

### SPEC-07: The value-bet AC#6 test title names 65.1%
- Verifies: AC#4
- Behaviour: Given `tests/advice/value-bet.acceptance.test.ts`, When read, Then the AC#6 test is titled
  `'AC#6 65.1% against callers raises'`, and no title in the file contains `'AC#6 50.1%'`. The test body,
  including its `byRun(0.1, 0.651)` input and every `expect`, is unchanged.
- Verification: command `grep -c "it('AC#6 65.1% against callers raises'" tests/advice/value-bet.acceptance.test.ts` prints `1` and `grep -c "AC#6 50.1%" tests/advice/value-bet.acceptance.test.ts` prints `0`

### SPEC-08: The golden spot id describes its current spot and the re-pin is logged
- Verifies: AC#4
- Behaviour: Given `tests/golden/postflop-spots.json`, When read, Then the spot with `holeCards "Jc Jh"`, board
  `"3s Js 4d"` and `before ["call","fold","raise","fold","fold","call","call","check","bet"]` has id
  `6max-flop-co-raise-jj-3way`. No spot has id `6max-flop-co-raise-jj`. All its other fields are unchanged, and the
  file still holds 120 spots. The golden test for it passes under its new title.
  `docs/advice/golden-spots.md` has a new section `## Changes from TASK-7.33` with a one-row Old id / New id /
  Reason table: `6max-flop-co-raise-jj` → `6max-flop-co-raise-jj-3way`. The reason says that TASK-7.31 changed the
  line (the cutoff raises the limper, and the big blind and the limper call), that TASK-7.32 kept the id for this
  three-way pot, and that cards, board, action and justification are unchanged.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::AC#5 the advice engine agrees with golden spot 6max-flop-co-raise-jj-3way`

### SPEC-09: Nothing else moves
- Verifies: AC#1, AC#2, AC#4
- Behaviour: Given the change, When the full suite, lint and typecheck run, Then all pass. Every pre-existing test
  keeps its `expect`/`it` counts (`doit.py test-integrity` clean apart from the three listed locked edits). Every
  pre-existing explanation assertion passes unchanged, including `tests/advice/postflop.test.ts:457-459` (exact turn
  text) and the playtest explanation checks in `tests/advice/explanations.acceptance.test.ts`.
- Verification: command `npm run typecheck && npm run lint && npm test`

## 7. Edge cases
- Turn call where nobody can bet the river: `requiredCountsRiverBet` is false and there is no clause. Existing
  coverage: `tests/advice/postflop-folding.acceptance.test.ts` (all-in case). SPEC-02(b) covers the text.
- Flop and river: always false (`postflop.ts:174`), so there is no clause. SPEC-02(b) and existing tests cover it.
- Opponent-type lead lowercases the first character. The clause sits mid-sentence and is unaffected (SPEC-02).
- `valueThresholdPct` absent or null on hand-built grader inputs and golden numbers: still 50 (SPEC-06, A-1).
- Both aggression numbers non-finite: SPEC-05 / A-4.
- Old stored data: N/A. `PostflopRecommendation` is not persisted (§2 Not doing).
- Concurrency, permissions and dependency failure: N/A for pure functions.

## 8. Security considerations
- Trust boundary: grader input can come from hand-built or deserialized data. A non-finite threshold is now
  rejected (SPEC-05), closing the gap the security review raised. No new dependencies, secrets, logging or
  randomness.

## 9. Non-functional
- No performance change: one extra `fillTemplate` call per postflop explanation (an O(template) regex).
- Explanation text is byte-identical for every existing case (SPEC-02(c), SPEC-09).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Take a seat, reach a turn facing a bet with chips behind, and open the hint. The
  explanation reads "Pot odds, …, counting the big bet you will likely face on the river, ask for …", exactly as
  before.
- New tests:
  - `tests/advice/advice-hardening.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-05, SPEC-06
  - `tests/advice/explain.test.ts` → SPEC-04
  - Existing locked tests: `tests/golden/postflop.acceptance.test.ts` → SPEC-08
- Judge end-to-end:
  1. Run `npx vitest run tests/advice tests/golden tests/table`.
  2. Temporarily delete `{riverBet}` from one template in a scratch copy and confirm that SPEC-02/SPEC-03 fail.
  3. Run `npm run typecheck`.
  4. Confirm the golden doc section and the id with `grep -n "6max-flop-co-raise-jj" tests/golden/postflop-spots.json docs/advice/golden-spots.md`.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-7.33/qa.md` (no questions were needed).
