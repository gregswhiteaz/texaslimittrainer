# Spec: TASK-1.44 — Pin what a fold-out leaves in currentBet and betCount

Status: READY (approved 2026-11-20)
Task: TASK-1.44 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up from TASK-1.4 code-review NIT fold-out-resets-bet-counters, doc-39 / TASK-1.22) · Dream: limit-holdem-trainer

## 1. Summary
When a hand ends because all but one player folded, `foldOut` in `src/engine/hand.ts` sets `currentBet` and
`betCount` to 0. This task keeps that behaviour (the "reset" rule), documents it in a comment on `foldOut`, and
pins it with a new acceptance test that covers a preflop fold-out and a flop fold-out. Runtime behaviour does not
change, so playtest output and existing locked tests are not affected.

## 2. Scope
- In scope:
  - A comment of 3–6 `//` or JSDoc lines directly above `function foldOut` (`src/engine/hand.ts:328`) that
    states the rule and why (content in §5).
  - New test file `tests/engine/fold-out.acceptance.test.ts` that pins the rule (SPEC-01, SPEC-02).
- Not doing:
  - Any change to the logic of `foldOut`, `endRound`, `applyAction`, or to `HandState` / `PlayerView` fields or
    their doc comments.
  - Changing the rule to "kept". See D-1.
  - Edits to existing test files (several are acceptance files and locked), the playtest tool, invariants, the
    table view, or docs.
- Scope budget: files=2, lines=70

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The pin goes in a new acceptance file rather than in `tests/engine/hand.test.ts`. | yes | The AC describes observable final state. A dedicated file means the lock covers only this rule, not the whole of `hand.test.ts`. This follows the `review-gaps.acceptance.test.ts` pattern from TASK-1.22. | Add an `it` to `hand.test.ts` (unit, not locked). |
| A-2 | The test copies the small `config`/`play` helper shape from `tests/engine/review-gaps.acceptance.test.ts:14-37` rather than extracting a shared helper. | yes | Every engine test file already keeps its own copy. Extracting one would touch locked files. | Shared helper in `tests/support/`. |

## 3. Current system
- `src/engine/hand.ts:328-345` `foldOut`: gathers street contributions into the pot (`gather`, `:288-300`, which
  sets every `streetContribution` to 0), pays the winner, and returns `currentBet: 0, betCount: 0, toAct: null`
  with `result.endedBy: 'fold'`. `street` is left unchanged (doc comment `:86`: "stays put on a fold-out").
- `src/engine/hand.ts:352` `endRound`: every round end, including the river → `'showdown'` end of a hand, builds
  from `base = { ...state, currentBet: 0, betCount: 0 }`. So the showdown end of a hand already resets both.
- Field docs: `currentBet` is "Highest streetContribution" (`:90-91`). `betCount` is "Bets + raises this street"
  (`:92-93`). After `gather`, every `streetContribution` is 0, so `currentBet = 0` is the only value that agrees
  with its own field doc.
- Consumers of the final state's `currentBet` / `betCount`:
  - `src/engine/player-view.ts:93-94` copies them into the view. At hand end, `legalActions` is empty and no
    decision is made from them.
  - `src/engine/invariants.ts:157-177` `betCapMessage` starts from `state.betCount` and also counts bets per
    street from `state.actions`. A reset value (0) can never cause or hide a bet-cap violation, because the
    action count still covers the street.
  - `src/bots/tag.ts:16`, `src/advice/*.ts`, and `src/playtest/policy.ts:16` read them only while a decision is
    pending (`toAct !== null`), never on a finished hand.
  - `src/table/table-view.ts` and `src/table/hand-result.ts` do not read either field (checked with grep).
- Verified on 2026-11-20 with the default deck (cards 0..51), 6 seats of 160, button 1, 2/4 stakes:
  - Limp to the flop (4, 5, 6 and 1 call 4; 2 calls 2; 3 checks). Then 2 bets 4 and 3 raises to 8; the state
    has `currentBet 8, betCount 2`. Then 4, 5, 6, 1 and 2 fold. The final state is `street 'flop'`,
    `currentBet 0`, `betCount 0`, `toAct null`, every `streetContribution 0`, `result.endedBy 'fold'`, and the
    award is 36 to seat 3 (stack 184).
- Tests: Vitest (`npm test` = `vitest run --coverage`, `package.json`). Existing fold-out tests
  (`tests/engine/hand.acceptance.test.ts:215`, `tests/engine/hand.test.ts:137`) do not assert `currentBet` or
  `betCount`.
- Existing code to reuse:
  - `tests/engine/review-gaps.acceptance.test.ts:14-37` → the `STAKES`/`DECK`/`config`/`apply`/`play` helper
    shape.
  - `createHand`, `applyAction` from `src/engine/hand.ts`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Keep the reset rule: a fold-out leaves `currentBet = 0` and `betCount = 0`. | Keep the street's last values (e.g. 8 and 2). | It matches the other end-of-hand path (`endRound` resets at showdown, `hand.ts:352`). It keeps `currentBet` consistent with its documented meaning, because all contributions are gathered to 0. No consumer reads these fields on a finished hand. The street's bets stay visible in `actions` for review and invariants. There is zero runtime change, so playtest output and locked tests are unaffected. "Kept" would change the `PlayerView` of a finished hand and break the `currentBet` field doc. | no (pins existing behaviour, internal state) | n/a |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — add the rule comment above `foldOut` (no code change).
- `tests/engine/fold-out.acceptance.test.ts` — new; pins the rule.

### Components, interfaces and data
- No interface or data changes.

### Rules and algorithms
- Rule: when `applyAction` ends a hand by fold-out, the returned state has `currentBet === 0` and
  `betCount === 0`, whatever they were before the last fold. `street` is unchanged.
- The comment above `foldOut` must say, in any wording:
  1. The rule: it resets `currentBet` and `betCount` to 0, the same as `endRound` does at every round end,
     including showdown.
  2. Why: `gather` moves every `streetContribution` into the pot, so 0 is the "highest streetContribution". A
     finished hand has no betting round. The street's bets remain in `actions` (used by review and the
     bet-cap invariant).
  3. A pointer that `tests/engine/fold-out.acceptance.test.ts` pins it.
- The comment must contain the literal tokens `currentBet`, `betCount` and `endRound` so the SPEC-03 grep works.

### Error handling and configuration
- None.

## 6. Behaviour specification

### SPEC-01: Preflop fold-out resets currentBet and betCount
- Verifies: AC#1
- Behaviour: Given a 6-seat 2/4 hand (button 1, stacks 160, deck 0..51), When seat 4 raises to 8 (the state now
  has `currentBet 8, betCount 2`) and seats 5, 6, 1, 2 and 3 fold, Then the final state has `result.endedBy
  'fold'`, `street 'preflop'`, `toAct null`, `currentBet 0`, `betCount 0`, and every player's
  `streetContribution 0`. The test also asserts the pre-fold values 8 and 2, so it proves a reset rather than an
  unchanged 0.
- Verification: acceptance `tests/engine/fold-out.acceptance.test.ts::a preflop fold-out leaves currentBet and betCount at 0`

### SPEC-02: Postflop fold-out after a raise resets currentBet and betCount
- Verifies: AC#1
- Behaviour: Given the same setup, When the hand is limped to the flop (4, 5, 6, 1 call 4; 2 calls 2; 3 checks),
  then 2 bets 4 and 3 raises to 8 (state `currentBet 8, betCount 2`), then 4, 5, 6, 1 and 2 fold, Then the final
  state has `street 'flop'`, `result.endedBy 'fold'`, `toAct null`, `currentBet 0`, `betCount 0`, every
  `streetContribution 0`, and `result.awards` equal to `[{ pot: 0, amount: 36, winners: [{ seat: 3, amount: 36 }] }]`.
- Verification: acceptance `tests/engine/fold-out.acceptance.test.ts::a flop fold-out after a raise leaves currentBet and betCount at 0`

### SPEC-03: foldOut comment states the rule and why
- Verifies: AC#2
- Behaviour: Given `src/engine/hand.ts`, When the lines directly above `function foldOut` are read, Then a comment
  states the reset rule, names `endRound` as the matching behaviour, and gives the reason in §5.
- Verification: command `grep -n -B8 '^function foldOut' src/engine/hand.ts | grep -cE 'currentBet|betCount|endRound'`
  (prints ≥ 2 and exits 0). The Judge then reads the comment against the three points in §5.

### SPEC-04: No runtime change
- Verifies: AC#1
- Behaviour: Given the edited `hand.ts`, When `git diff -U0 src/engine/hand.ts` is inspected, Then every added or
  removed line is a comment line. When `npm test` runs, Then every test passes.
- Verification: command `git diff -U0 src/engine/hand.ts | grep -E '^[+-][^+-]' | grep -vE '^[+-]\s*(//|/\*\*?|\*)' ; test $? -eq 1 && npm test`

## 7. Edge cases
- Fold-out on the street where `betCount` was already 0 (for example, a checked flop where everyone folds to a
  bet): SPEC-02 covers the non-zero case, and the rule is unconditional. N/A as a separate item.
- Fold-out on the river: the same code path (`foldOut`) as the flop. N/A as a separate item.
- Invalid input, concurrency, permissions: N/A, because there is no runtime change.

## 8. Security considerations
N/A. There is no new input, no dependency, and no runtime change.

## 9. Non-functional
- None. The new test runs in under 50 ms.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42` (output must be unchanged, ending `Invariant violations: 0`)
- New tests: `tests/engine/fold-out.acceptance.test.ts` → SPEC-01, SPEC-02. End to end for the Judge: run
  `npx vitest run tests/engine/fold-out.acceptance.test.ts`, then the SPEC-03 and SPEC-04 commands, and read the
  `foldOut` comment.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.44/qa.md`.
