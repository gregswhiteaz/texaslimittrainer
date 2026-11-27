---
id: doc-184
title: >-
  TASK-10.17: Ignore a forced-fold-voided raise when classifying the preflop
  situation, and tidy the forced-fold code
type: other
created_date: '2026-11-27T09:11:00Z'
updated_date: '2026-11-27T09:11:00Z'
---
# TASK-10.17: Ignore a forced-fold-voided raise when classifying the preflop situation, and tidy the forced-fold code

Status: Done (pending orchestrator) · Completed: 2026-11-27 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: n/a (follow-up of TASK-10.13, doc-178, its A-2) · Branch: doit/TASK-10.17

## What was asked
After a forced fold (the user leaves mid-hand) voids the leaver's raise as dead money, the engine's amount to match drops. `situationOf` in `src/advice/preflop.ts` still counted the voided raise. Bots and advice therefore looked up the facing-a-raise chart cell for a pot that is effectively unraised. The task also bundles two tidy-ups from the TASK-10.13 review: a redundant `toAct` ternary in `forceFold` and `sole` being recomputed per winner in `src/engine/invariants.ts`. Spec: doit/TASK-10.17/spec.md.

Acceptance criteria:
1. A voided raise is classified as if never made (for example unopened or limpers), with a test pinning a case.
2. Hands with no voided raise classify unchanged (seeded playtest output byte-identical).
3. The two tidy-ups, with engine behaviour unchanged.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | A record is voided exactly when the engine's rule voids it. At a same-street fold of a seat whose street chips exceed the live top, every earlier same-street bet/raise with amount above the live top is voided. This includes a normally-folded seat's raise voided by a later forced fold. | yes | Mirrors `liveLevels`, so advice agrees with the engine's `currentBet`/`betCount`. | Ignore only the leaver's own raises (would disagree with the engine in multi-raise cases). |
| A-2 | The helper `voidedBets` lives in the engine (`src/engine/hand.ts`) and is exported. Advice imports it. | yes | The voiding rule is engine semantics, and this avoids a second copy in advice. | Re-implement the walk inside `situationOf`. |
| A-3 | Calls are not filtered. A call made after a later-voided raise stays a call, so it reads as a limper. This can only be a short all-in call. | yes | Rare, and "limpers" is the closest unraised spot. No dedicated test. | Treat it as a raise, or drop it. |
| A-4 | Seeded playtests never call `forceFold` (only `src/table/session.ts` does), so playtest and golden output is unchanged. | yes | `grep forceFold src` finds only `hand.ts` and `table/session.ts`. | n/a |
| A-5 (flag for review) | `voidedBets` is added to the advice allow-list for `engine/hand` imports in `tools/lint/headless-boundary.js` (previously only `Action`, `SeatNumber`, `Street`, `STREET_BET_CAP`). It is a pure function over the public action history and stakes, returns indices only, and reveals no hidden state. `preflop.ts` passes an inline object literal, so no type import is needed. | yes | Added by the Spec Detective. It was the only way for advice to reuse the engine rule without duplicating it. REQ-025.1's boundary still holds. | Re-implement the walk in `src/advice`, or pass the result through `PlayerView`. |

## Clarifications and decisions
No questions asked (autopilot, no ask items). Decision: resolve the advice import-boundary conflict by widening the lint allow-list by exactly one name (A-5), with a lint probe test proving other engine values are still rejected.

## What was built
- `src/engine/hand.ts`: new exported `voidedBets(state: BetContext)` returns the indices of bet/raise records a fold voided, using the same rule as `liveLevels`. `forceFold` ring start tidied to `clockwiseAfter(open, toAct - 1)` with a comment, which removes the redundant ternary.
- `src/advice/preflop.ts`: `situationOf` skips raise records reported by `voidedBets`. It passes `{ street: 'preflop', stakes: view.stakes, actions: view.actions }`. Doc comment updated.
- `src/engine/invariants.ts`: `sole` is computed once before the awards loop.
- `tools/lint/headless-boundary.js`: `'voidedBets'` added to the advice `engine/hand` `allowImportNames`, and the comment updated.
- New tests: `tests/advice/preflop-voided-raise.acceptance.test.ts` (SPEC-01..03), `tests/engine/voided-bets.test.ts` (SPEC-04 plus a street-scoping test), `tests/toolchain/advice-voided-bets-import.acceptance.test.ts` (SPEC-06).
- No new dependencies and no configuration.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 voided raise reads as unraised | AC#1 | acceptance test (E2 gives `limpers`, chart spot SB/limpers; U gives `unopened`) | PASS | judge round 1 |
| SPEC-02 only voided part ignored | AC#1 | acceptance test (surviving and later raises still count) | PASS | judge round 1 |
| SPEC-03 unchanged without a void | AC#2 | existing advice/bots/golden suites, acceptance test, 10,000-hand playtest diff | PASS | build-log: byte-identical with base 5ed0184, 0 invariant violations |
| SPEC-04 voidedBets matches engine rule | AC#1, AC#2 | unit test | PASS | judge round 1 |
| SPEC-05 tidy-ups keep engine results | AC#3 | engine/table/playtest suites plus playtest diff | PASS | build-log |
| SPEC-06 advice may import voidedBets only | AC#1 | lint probe acceptance test plus `npm run lint` | PASS | judge round 1 |

- `npm test`: 345 files passed (10 skipped), 1533 tests passed (59 skipped). 3 new files, 6 new tests. `format`, `lint` (0 errors) and `typecheck` pass.
- Gates: build run 1 PASS, fix run 2 PASS.
- Judge round 1: PASS (6/6), no failed items, no unproven AC. Locked acceptance tests unchanged.

## Review
Round 1 (code and security): no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `voidedBets` duplicates `liveLevels`' voiding walk (`src/engine/hand.ts` around line 361), and nothing keeps the two in step. A fuzz of 20,000 hands found 0 mismatches.
- NIT: the deal/play test helpers are copied into the new tests (by spec).

## How to try it
- `npx vitest run tests/advice/preflop-voided-raise.acceptance.test.ts tests/engine/voided-bets.test.ts tests/toolchain/advice-voided-bets-import.acceptance.test.ts`
- `npm run -s playtest -- --hands 10000 --seed 42` (compare with the base commit)
- `npm run lint`

## Run metrics
Questions 0 · assumptions logged 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 234 (7 files).

## Known limitations and follow-ups
- [trainer] Make `liveLevels` and `voidedBets` share one voiding walk, or add a test that asserts they agree on randomly generated forced-fold hands (the one-off fuzz is not kept). Owner: no existing task known.
- A-3: a short all-in call after a later-voided raise still reads as a limper. Rare, not pinned by a test.

## Lessons for the factory (proposals — not applied)
- The Spec Detective found the advice import-boundary conflict only at spec time. Spec guidance could say to check lint allow-lists whenever a spec adds a cross-module import. Nothing else went wrong or slow in this run.
