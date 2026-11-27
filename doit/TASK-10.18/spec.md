# Spec: TASK-10.18 — Keep the engine's bet-voiding rule in one place (liveLevels and voidedBets)

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-10.18 · Parent/epic: TASK-10 · Requirements: n/a (follow-up of TASK-10.17, doc-184, review r1 MINOR) · Dream: limit-holdem-trainer

## 1. Summary
`liveLevels` and `voidedBets` in `src/engine/hand.ts` each carry their own copy of the forced-fold voiding walk
(TASK-10.13 R2). Nothing keeps the copies in step, so a later rule change could make bots and advice disagree
with the engine's amount to match. This task moves the walk into one private function that returns both the
surviving bet levels and the voided bet/raise indices. Both existing functions become thin wrappers over it. A
property test pins the agreement on random forced-fold hands. Engine behaviour does not change.

## 2. Scope
- In scope:
  - One private walk in `src/engine/hand.ts` that computes the surviving counted levels and the voided indices
    in a single pass. `liveLevels` and `voidedBets` delegate to it.
  - One new property test case in the existing forced-fold property test file.
- Not doing:
  - Any change to the voiding rule itself, to `forceFold`, `applyAction`, `fullBetTarget`, `currentBet` or
    `betCount` semantics.
  - Any change to `src/advice/preflop.ts`, the lint allow-list (`tools/lint/headless-boundary.js`) or the public
    export surface (`voidedBets` keeps its name and signature, and `liveLevels` stays private).
  - A-3 of TASK-10.17 (a short all-in call after a voided raise still reads as a limper).
  - Performance work on the walk.
- Scope budget: files=2, lines=90

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Share by one walk returning `{ levels, voided }`, with both voiding effects (popping levels and marking indices) applied at the same fold branch. Do not use "liveLevels skips voidedBets indices". | yes | A single pass gives identical results by construction: it is today's `liveLevels` loop with `voidedBets`' marking step added inside the same branch. The skip-indices variant needs a second pass and only matches by fuzz evidence (doit/TASK-10.17/reviews/round-1/code.json:22). | liveLevels walks levels while skipping `voidedBets(state)` indices (reviewer's suggestion), or keep both walks and add cross-reference comments plus the property test. |
| A-2 | Keep `liveLevels` and `voidedBets` as named wrappers. Do not inline the walk at the call sites. | yes | Call sites (`src/engine/hand.ts:391`, `:799`, `src/advice/preflop.ts:107`) and doc comments stay as they are, which keeps the diff small. | Replace `liveLevels` calls with `walk(state).levels`. |
| A-3 | Also add a property test, although the AC's "or" makes it optional once the walk is shared. | yes | It costs about 25 lines in an existing file and guards the public contract (advice's view against the engine's `currentBet`) against a future edit that splits the walk again. | Rely on the refactor and existing tests only. |

## 3. Current system
- `src/engine/hand.ts:313` `BetContext = Pick<HandState, 'street' | 'stakes' | 'actions'>`; `:316` `betUnit`.
- `src/engine/hand.ts:329-354` `liveLevels(state)` (private): walks `state.actions`, tracks `folded` and street
  chips `put`, and pushes `{ level, at }` for the big blind and for full bets/raises (`2 * (amount - level) >= unit`).
  At a same-street fold it computes `live` (the highest street chips of an unfolded seat, at least the big blind
  preflop) and, if the folder's chips exceed `live`, pops every level above `live`.
- `src/engine/hand.ts:361-387` `voidedBets(state)` (exported): the same `folded`/`put`/`live` walk. At a voiding
  fold it adds every earlier same-street bet/raise index with `amount > live`.
- Callers: `fullBetLevel` at `src/engine/hand.ts:390-392` (feeds `fullBetTarget`, used by `applyAction` and bots);
  `forceFold` at `src/engine/hand.ts:799-821` (uses `levels.at(-1).at` and `levels.length` for `betCount`, and sets
  `currentBet: live`); `situationOf` at `src/advice/preflop.ts:107`.
- Tests: `tests/engine/voided-bets.test.ts` (TASK-10.17 unit cases), `tests/engine/force-fold.property.test.ts`
  (seeded random hands with forced folds, `Xoshiro128`, helpers `dealHand`/`playOut` at lines 22 and 41),
  `tests/engine/force-fold*.acceptance.test.ts`, `tests/advice/preflop-voided-raise.acceptance.test.ts`.
- Test running: `npm test` = `vitest run --coverage` (package.json scripts); property tests run in `npm test` and
  `test:sweeps`.
- Existing code to reuse:
  - `tests/engine/force-fold.property.test.ts` → its `dealHand`/`playOut` random forced-fold generator and seeded
    `Xoshiro128`, instead of a new generator.
  - `src/engine/hand.ts` `betUnit`, `BetContext` → unchanged inputs for the shared walk.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | One private single-pass walk owns the voiding rule (A-1). | Skip-indices composition; comments only. | Equal to today's behaviour by construction, and one place to change. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — add the private walk; reduce `liveLevels` and `voidedBets` to wrappers; update doc
  comments so the rule is described once (on the walk).
- `tests/engine/force-fold.property.test.ts` — add one property case: `voidedBets` agrees with the engine after
  every forced fold.

### Components, interfaces and data
- New private function (name suggestion `voidingWalk`):
  `function voidingWalk(state: BetContext): { levels: { level: number; at: number }[]; voided: Set<number> }`.
  Pure; no errors thrown.
- `liveLevels(state)` returns `voidingWalk(state).levels`; signature unchanged, still private.
- `voidedBets(state): ReadonlySet<number>` returns `voidingWalk(state).voided`; exported signature unchanged.

### Rules and algorithms
- The walk is today's `liveLevels` loop (`src/engine/hand.ts:334-352`) unchanged, except that in the voiding
  branch (fold where the folder's street chips exceed `live`) it also adds to `voided` every index `j < i` whose
  record is on `state.street`, has type `bet` or `raise`, and has `amount > live` (today's
  `src/engine/hand.ts:375-383`). Popping levels and marking indices happen in the same branch, at the same `live`.
- Off-street records: a fold adds the seat to `folded`; nothing else (as both copies do today).
- Worked example (from `tests/engine/voided-bets.test.ts:44`, blinds 2/4, button 6): `3:call:4 4:raise:8 5:fold
  6:fold`, then `forceFold(seat 4)`. At the forced fold, live = 4, seat 4 has 8 > 4, so level 8 (index 3) is
  popped and index 3 is voided: levels = [{4, at 1}], voided = {3}, and `currentBet` = 4, `betCount` = 1.

### Error handling and configuration
- N/A: pure function over in-memory history; no new errors, configuration or dependencies.

## 6. Behaviour specification

### SPEC-01: one walk owns the voiding rule
- Verifies: AC#1
- Behaviour: Given `src/engine/hand.ts`, When it is read after the change, Then the fold-voiding computation (the
  `live` top and the "folder's chips exceed live" test) appears in exactly one function, and both `liveLevels` and
  `voidedBets` obtain their results from that function without their own `state.actions` walk.
- Verification: command `grep -c "c > live) live = c" src/engine/hand.ts` prints `1`, and code review confirms
  `liveLevels` and `voidedBets` delegate to the shared walk.

### SPEC-02: voidedBets agrees with the engine after every forced fold
- Verifies: AC#1
- Behaviour: Given seeded random hands with forced folds (the generator in
  `tests/engine/force-fold.property.test.ts`), When each forced fold is applied, Then every record before the
  fold that is on the current street, is a `bet` or `raise`, and has `amount` above the resulting
  `state.currentBet` is in `voidedBets(state)`, and every index in `voidedBets(state)` is a same-street `bet` or
  `raise` record.
- Verification: unit `tests/engine/force-fold.property.test.ts::voidedBets agrees with the engine's amount to match after every forced fold`

### SPEC-03: engine, advice and playtest output unchanged
- Verifies: AC#1
- Behaviour: Given the refactor, When the full suite and the 10,000-hand seeded playtest run, Then all tests pass
  (including `tests/engine/voided-bets.test.ts`, the force-fold suites and
  `tests/advice/preflop-voided-raise.acceptance.test.ts`, which stay unedited), and the playtest output is
  byte-identical to the base commit's.
- Verification: command `npm test` passes, and `npm run -s playtest -- --hands 10000 --seed 42 > /tmp/after.txt`
  is byte-identical (`cmp`) with the same command's output at the base commit (`git stash`/worktree of
  `46e6e83`).

## 7. Edge cases
- No fold / no voiding fold: walk returns today's levels and an empty set (covered by existing
  `tests/engine/voided-bets.test.ts:51-52` and SPEC-03).
- Several forced folds in one hand, and voids of a normally-folded seat's raise: covered by the random generator
  in SPEC-02 and by `tests/engine/voided-bets.test.ts:45-50`.
- Street scoping (`street` differs from the record's street): covered by `tests/engine/voided-bets.test.ts:62`.
- Short all-in raises (not counted as levels) above `live`: voided but never a level; preserved because the
  marking rule is unchanged (SPEC-02, SPEC-03).
- Invalid input, concurrency, permissions, dependency failure: N/A, pure in-memory function.

## 8. Security considerations
N/A: no new trust boundary, input, dependency, secret or randomness. The advice import boundary is unchanged
(`voidedBets` already allow-listed in `tools/lint/headless-boundary.js` by TASK-10.17).

## 9. Non-functional
- The shared walk does no more work than today's `liveLevels` except on a voiding fold (only reachable via
  `forceFold`, never in playtests). `voidedBets` callers do the same single pass as before. No measured target.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests: `tests/engine/force-fold.property.test.ts::voidedBets agrees with the engine's amount to match after every forced fold` → SPEC-02.
- End-to-end for the Judge: run the playtest command above on this branch and on base `46e6e83`, `cmp` the
  outputs (must be identical); run `npx vitest run tests/engine tests/advice`; run the SPEC-01 grep.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-10.18/qa.md`.
