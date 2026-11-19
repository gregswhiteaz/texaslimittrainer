# TASK-1.21: Harden engine input validation found in review

Status: Done (judge pending) · Completed: 2026-11-18 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up of the TASK-1.2, 1.3 and 1.4 security reviews, doc-7, doc-9, doc-10) · Branch: doit/TASK-1.21

## What was asked
Close four non-blocking gaps the earlier security reviews found in engine entry points that later callers (playtest CLI, session layer, saved data) could reach with malformed input:
1. `parseCard` must reject a non-string or an over-long string with a typed error that echoes at most 10 characters.
2. `createHand` must reject stakes and stacks that are not safe integers, using the existing error.
3. `createHand` must not alias the caller's stakes or seats objects.
4. `nextIntUnbiased(n)` must be exactly unbiased for n, or throw `RangeError`, and its doc comment must state the range.

Spec: doit/TASK-1.21/spec.md. No exported signature or existing error message changed.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `nextIntUnbiased` is exact for every integer n in 1..2^32 (exact 64-bit product from 16-bit halves) and throws `RangeError` for any other n. Results equal the old ones for n ≤ 2^21 and for powers of two, so every deck is unchanged | yes | Keeps replay codes identical and keeps the existing `nextIntUnbiased(2 ** 31)` test valid | Throw `RangeError` for n > 2^21 (smaller code, breaks that test line) |
| A-2 | A non-string given to `parseCard` throws `RangeError('Invalid card: expected a string, got <typeof>')`, echoing none of the input | yes | Every `cards.ts` error is a `RangeError`; today it is a native `TypeError` | Use `TypeError`, or echo a truncated `String(value)` |
| A-3 | A rejected string over 10 UTF-16 code units is echoed as its first 10 plus `...`. Strings of 10 or fewer are echoed whole, as before. No escaping | yes | Existing messages (all ≤ 3 characters) stay byte-identical | Unicode `…`, JSON-escape the echo, or no marker |
| A-4 | `createHand` also rejects with `RangeError('Invalid stakes')` any stakes where `10 * minimumStack(stakes)` exceeds `Number.MAX_SAFE_INTEGER` | yes | Each seat puts in at most `minimumStack`, so every pot and contribution total is ≤ 10× that and stays a safe integer. Real stakes are far below it | Check only that each stake is a safe integer |
| A-5 | An unsafe-integer stack reuses the message `Stack at seat <n> must be an integer of at least <min>` | yes | Existing messages and types had to stay | A new "must be a safe integer" message |
| A-6 | `createHand` copies its input into a snapshot first (stakes field by field, seats as `{ seat, stack }`, deck array, button) and validates and builds only from it. `HandState.stakes` is the snapshot's object | yes | Fixes the aliasing MINOR (doc-10) and closes the gap where getters could give `validate` and the builder different values | `{ ...config.stakes }` after validation; `Object.freeze` on the copy |

## Clarifications and decisions
No questions were asked of the user (state.json: questions 0; no qa.md was written). Decisions D-1 to D-3 in the spec follow from A-1 to A-6 (exact range for `nextIntUnbiased`; reuse of existing error types; AC behaviour in one new locked acceptance file, implementation checks in existing unit files).

## What was built
- `src/engine/cards.ts`: `parseCard` throws `RangeError('Invalid card: expected a string, got <typeof>')` for non-strings. Rejected strings over 10 characters are echoed as the first 10 plus `...`.
- `src/engine/hand.ts`: `createHand` builds a private snapshot and validates and builds only from it. Stakes and stacks must be safe integers. The A-4 bound is checked through the existing `minimumStack`. The doc comment says config is copied. The check order and every existing message are unchanged.
- `src/engine/seeded-random.ts`: `nextIntUnbiased` guards n (integer in 1..2^32, else `RangeError`). It computes the exact product with a private `multiply32` built from 16-bit halves. The Lemire rejection rule is unchanged. The doc comment states the range and uses none of the banned substrings that the locked TASK-7.1 check scans for.
- Tests: new `tests/engine/input-hardening.acceptance.test.ts` (AC#1–AC#4, locked); unit additions in `cards.test.ts`, `hand.test.ts`, `seeded-random.test.ts` (legacy-formula equality) and `deck.test.ts` (legacy shuffle equality over 10,000 codes plus the golden codes).
- No new dependencies. No locked test file was edited.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02 | AC#1 | acceptance: non-strings and 10-character echo (fast-check, 2,000 runs) | pass | input-hardening.acceptance.test.ts |
| SPEC-03 | AC#1 | unit: old messages byte-identical, new cases | pass | cards.test.ts |
| SPEC-04 | AC#2 | acceptance: unsafe stakes and stacks, MAX_SAFE_INTEGER stack accepted | pass | input-hardening.acceptance.test.ts |
| SPEC-05 | AC#2 | unit: A-4 bound rejected at bigBet 2^50, accepted at 2^40 | pass | hand.test.ts |
| SPEC-06 | AC#3 | acceptance: mutate stakes, seats and deck after `createHand`, state deep-equals before | pass | input-hardening.acceptance.test.ts |
| SPEC-07, 08 | AC#4 | acceptance: range guard, doc comment text, BigInt oracle with stubbed draws | pass | input-hardening.acceptance.test.ts |
| SPEC-09 | AC#4 | unit: equal to the old formula for n ≤ 2^21 and all powers of two, same end state | pass | seeded-random.test.ts |
| SPEC-10 | AC#4 | unit: 10,004 decks equal a legacy shuffle | pass | deck.test.ts |
| SPEC-11 | AC#1–4 | `npm test`, lint, typecheck, playtest | pass | gates/build-1.json, gates/fix-2.json |

- Local gate: 76 test files passed; 282 tests passed, 2 skipped; coverage 96.44% statements, 96.94% lines, engine lines 100%. Lint and typecheck clean. Gate runs: 2 (build, fix), both PASS.
- Deals unchanged: the 10,000-hand playtest output (`--hands 10000 --seed 42`) and the `--replay-code 0123456789abcdeffedcba9876543210 --size 6` output are byte-identical to the baseline captured before the change (empty diff, 0 invariant violations). The 10,004 decks (10,000 sample codes plus 4 golden) are identical to the legacy shuffle. Run time was 0.65 s before and 0.67 s after.
- CI: run 44456492713 on head 5139015 was green on the first push.
- Judge rounds: pending (the judge runs after this document).

## Review
Round 1 found no BLOCKER or MAJOR in either review (state.json: 0 blocking findings), so no fix round was needed.
- Code review: the split multiply was proven exact. Mutation testing in a scratch copy killed these mutants: dropped carry, dropped bLo, zero threshold, threshold ±1, each guard clause, stakes aliasing, deck aliasing, removing A-4, unsafe stacks, truncating at 9 or 11, and removing the type guard. Two survivors are equivalent mutants (`low < n-1`; `isInteger` instead of `isSafeInteger` on stakes, subsumed by the order rule and A-4).
- Security review: `multiply32` was compared with a BigInt Lemire reference over 50,000 draws for each of 11 values of n, with 0 mismatches. No banned substrings in `seeded-random.ts`.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the factor 10 in A-4 is not pinned by a test. Mutant `1 * minimumStack` passes (`hand.test.ts:167`).
- MINOR: no test for "read once" (a getter or Proxy). Mutants `validate(config)` and aliasing seats survive.
- MINOR: a stack of `MAX_SAFE_INTEGER` is accepted, and a winner's stack can pass 2^53 after payout (`hand.ts:305`). A-4 bounds only pots.
- MINOR (security): the existing `Invalid seat` and `Button must be a dealt-in seat` messages echo input of any length. No caller reaches them today, and the spec forbade changing existing messages.
- NIT: a null config or non-array seats throws `TypeError`, not the `RangeError` the doc comment promises. It still fails closed.

## How to try it
- `npm run lint && npm run typecheck && npm test`
- `npm run playtest` (10,000 hands, seed 42; expect exit 0 and 0 invariant violations)
- `npm run playtest -- --replay-code 0123456789abcdeffedcba9876543210 --size 6`
- Targeted: `npx vitest run tests/engine/input-hardening.acceptance.test.ts`

## Run metrics
Questions 0 · assumptions 6 · review rounds 1 · judge rounds 0 so far (pending) · gate runs 2 · escalations 0 · changed lines 354 vs budget 340 (scope gate warn, fail only above 680) · files 8 of 8.

## Known limitations and follow-ups
Each line is one actionable change. The orchestrator turns them into tasks or ACs.
- `parseCards` should throw `RangeError` (not `TypeError`) for non-string input, reusing the `parseCard` message.
- `evaluate` should reject non-array input with `RangeError` instead of returning a rank for `{}` (doc-7 MINOR).
- Truncate the `Invalid replay code` echo in `shuffledDeck` to at most 10 characters without changing messages locked by TASK-1.3 (doc-9 NIT).
- Add a hand test that a fold removes the seat from pot eligibility and that `totalContribution` tracks chips (owner TASK-1.22).
- Add a hand test that accepts `smallBlind === bigBlind` stakes (owner TASK-1.22).
- Have the session layer validate restored or saved stakes with the same safe-integer and pot-bound rules before building a table (owner TASK-3.10).
- Add a test that pins the factor 10 in A-4, for example bigBet `2 ** 49` with stacks `2 ** 52` → `Invalid stakes` (hand.test.ts).
- Add a test that `createHand` reads each config field once (counting getter or Proxy on stakes and a seat stack).
- Bound each stack (or the table total) so that stack + 10 × `minimumStack` ≤ `MAX_SAFE_INTEGER`, or reject it in the session layer, so payout cannot push a stack past 2^53.
- Truncate or type-only the echo in the `Invalid seat` and `Button must be a dealt-in seat` messages, before any saved-data or URL caller lands.
- Make `createHand` throw `RangeError('Invalid hand config')` for a null config, missing stakes or non-array seats, instead of a native `TypeError`.

## Lessons for the factory (proposals — not applied)
- The build went over its line budget (354 vs 340) because the spec's per-file estimates for tests were low. Proposal: have the spec author estimate test files from the SPEC count (about 15–20 lines per SPEC item) so the budget does not warn on a clean run.
- Nothing else went wrong or slow: no sendbacks, no escalations, CI green on the first push.
