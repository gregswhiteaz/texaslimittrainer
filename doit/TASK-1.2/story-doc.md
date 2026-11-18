# TASK-1.2: Rank showdown hands by real poker hand rankings

Status: Done · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-019.1, REQ-019.2 (feeds REQ-034, REQ-055.1, REQ-055.3) · Branch: doit/TASK-1.2

## What was asked
Add the first engine code: a card representation and a fast hand evaluator that turns 5, 6 or 7 cards into a dense rank from 1 to 7,462 (higher is stronger, equal means tie). Acceptance criteria:
1. Every five-card hand falls into exactly 7,462 classes, in the reference order, with categories straight flush > quads > full house > flush > straight > trips > two pair > pair > high card.
2. A-2-3-4-5 is the lowest straight (below 2-3-4-5-6, above any three of a kind).
3. A 7-card hand ranks as the best of its 21 five-card subsets.
4. Same pair, higher kicker wins (K-K-A-9-4 beats K-K-Q-9-4).
5. Hands differing only in suits tie.

Spec: doit/TASK-1.2/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Two modules, `src/engine/cards.ts` and `src/engine/hand-evaluator.ts`; tests in new `tests/engine/` | yes | Follows TASK-1.1 (tests in `tests/**`); the deck (TASK-1.3) needs the card type without the evaluator | Merge into one `poker.ts` or colocate tests |
| A-2 | Card text notation: `23456789TJQKA` plus `cdhs` (e.g. `As`, `Td`); `parseCard` is strict and throws on anything else | yes | Standard poker notation; readable tests; not user-visible yet | Relax the parser (`10s`, any case, Unicode suits) |
| A-3 | Invalid input throws `RangeError` with exact messages, checked on every `evaluate` call | yes | Fail loudly on engine bugs; cost is a few integer comparisons and counts against the speed target | Add an unchecked fast path plus a checked wrapper |
| A-4 | Tables are built eagerly at first import; `buildEvaluatorTables()` is exported (internal) for the perf test | yes | Simplest; start-up measured far below the 3 s launch budget | Build lazily on first `evaluate` (adds a hot-path branch) |
| A-5 | Property tests use fast-check's default random seed with fixed `numRuns` | yes | Explores new cases each run; failures print a reproducible seed | Fix a seed per property |
| A-6 | `npm test` includes a throughput check with a slack floor (>= 1M 7-card evals/s, build <= 500 ms); the real target is checked by a separate command (SPEC-12) | yes | CI runners and coverage instrumentation are slow; a strict timing test would be flaky | Move the perf test out of `npm test`, or tighten thresholds |
| A-7 | The exhaustive 2,598,960-hand test runs inside `npm test` with a 60 s timeout | yes | AC#1 says "every distinct five-card hand"; it takes about 2 s | Check only the 7,462 class representatives |

## Clarifications and decisions
- Q-1 (public interface, D-1): user chose the recommended option. `Card` is an integer 0–51 (`rank*4+suit`, ranks 2..A = 0–12, suits c,d,h,s = 0–3). `HandRank` is an integer 1–7462. `evaluate(5–7 cards)` throws `RangeError` on bad input; `compareHands` returns -1/0/1; `handCategory(rank)`; `HAND_CATEGORIES`, `HAND_RANK_COUNT`; card helpers `makeCard/cardRank/cardSuit/parseCard/parseCards/formatCard`.
- Q-2 (reference for AC#1, D-2): user chose the recommended option. An independent brute-force oracle in test code (`tests/engine/reference-ranking.ts`), cross-checked against published class and hand counts, with all 2,598,960 hands verified. No fixture and no dependency.
- Q-3 (approach and speed, D-3): user chose the recommended option. A table-driven 7-card evaluator (flush table plus a collision-free rank-count index), tables built at module load (<= 512 KiB, <= 50 ms), target >= 10M evals/s on the reference machine; CI floor >= 1M/s and build <= 500 ms.
- D-4: validation lives inside `evaluate`; duplicates are found with suit bit masks.

## What was built
- `evaluate` computes per-suit bit masks (which also detect duplicates) and per-rank counts in reusable module-level scratch arrays, so it allocates nothing per call. If a suit has 5 or more cards it returns `flush[suitMask]` (a 13-bit table, 8,192 entries). Otherwise it computes a collision-free quinary index of the 13 rank counts and reads the non-flush table. Dense ranks are produced at build time by sorting the distinct computed scores (category plus base-13 tie-break digits), so no expected rank is hard-coded.
- Tables: flush 16 KiB, non-flush about 144 KiB, index helpers about 2 KiB; about 162 KiB in total.

| Path | Purpose |
|---|---|
| `src/engine/cards.ts` | Card encoding and text helpers |
| `src/engine/hand-evaluator.ts` | Tables, `evaluate`, `compareHands`, `handCategory`, `HAND_CATEGORIES`, `HAND_RANK_COUNT`, `buildEvaluatorTables` |
| `tests/engine/reference-ranking.ts` | Independent oracle (imports only `cardRank`/`cardSuit`) |
| `tests/engine/hand-evaluator.acceptance.test.ts` | AC#1–AC#5, including the exhaustive check (locked) |
| `tests/engine/hand-evaluator.property.test.ts` | fast-check properties for 6/7-card best-subset and suit relabelling (locked) |
| `tests/engine/cards.test.ts`, `hand-evaluator.test.ts` | Unit tests: helpers, exact errors, table shape and size |
| `tests/engine/hand-evaluator.perf.test.ts` | Throughput and build timing, env-configurable thresholds |

```ts
import { parseCards } from './cards';
import { evaluate, handCategory } from './hand-evaluator';
const r = evaluate(parseCards('Ac 2d 3h 4s 5c')); // 5854, lowest straight
handCategory(r); // 'straight'
```
No new dependencies. 797 new lines across 8 files (budget 1000 / 8).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Exhaustive acceptance test against oracle; judge's own brute-force scorer | PASS | 7,462 classes; per-category class and hand counts match; zero mismatches over 2,598,960 hands |
| SPEC-02 | AC#1 | 16 worked examples, 18 category boundaries | PASS | All ranks exact |
| SPEC-03 | AC#2 | Wheel tests | PASS | Wheel 5,854; steel wheel 7,453; Q-K-A-2-3 is high card |
| SPEC-04 | AC#3 | Seven-card examples | PASS | Each equals max over 21 subsets; 12 extra judge hands match |
| SPEC-05 | AC#3 | Property tests | PASS | 20,000 seven-card and 5,000 six-card runs; judge ran 300,000 random hands, 0 mismatches |
| SPEC-06 | AC#4 | Kicker examples | PASS | Higher kicker wins |
| SPEC-07 | AC#5 | Example plus suit-relabelling property | PASS | 5,000 runs each for 5 and 7 cards |
| SPEC-08 | DoD#1 | Unit tests, exact messages | PASS | Judge probed many bad inputs |
| SPEC-09 | DoD#1 | Card helper unit tests | PASS | Strict parse and exact errors |
| SPEC-10 | DoD#4 | Table build tests | PASS | 8,192 flush entries; <= 512 KiB; deterministic |
| SPEC-11 | DoD#1 | Perf floor in `npm test` | PASS | Local 2.86M/s, 85 ms; CI 1.87M/s, 120 ms (floors 1M/s, 500 ms) |
| SPEC-12 | DoD#1 | Reference-machine command (10M/s, 50 ms) | PASS | About 15.4–16M evals/s, build about 24–27 ms, cold import about 30 ms (5 of 5 runs) |
| SPEC-13 | DoD#1, 2, 4 | `npm run lint`, `typecheck`, `npm test`, `build` | PASS | 14 files, 36 tests; engine line coverage 100% (hand-evaluator branches 79.8%) |
| SPEC-14 | DoD#5, 8 | Grep for forbidden imports; headless boundary lint | PASS | Clean; only import is `./cards` |
| SPEC-15 | DoD#10 | CI run 44227089180 on b0a9818 | PASS | success |
| SPEC-16 | DoD#3, 6, 7, 9, 11, 12 | Not-applicable checks plus this document | Pending in judge round 1, satisfied by this document | No UI, e2e, strategy or golden-spot changes; judge could not verify the doc before it existed |

- Judge round 1: 15 of 16 PASS and SPEC-16 pending only for this document. No test integrity problems (locked hashes match). The judge also ran mutation probes (wheel as ace-high, swapped flush/straight order, ignored lowest kicker, dropped duplicate check); each made tests fail.
- Judge findings (LOW, not fixed): J-1-01 the AC#4 examples do not catch an "ignore lowest kicker" bug (only the exhaustive and property tests do); J-1-02 CI throughput headroom is about 1.9x over the floor.

## Review
Round 1: 0 blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): the build-time test times a warm rebuild after 2M evaluate calls, not the cold build at import. Cold import plus build measured about 30–41 ms, still under 50 ms.
- NIT (code): module-level scratch arrays versus the spec wording "no mutable state after load". Spec step 1 allows them and they are reset on every call; no state is observable across calls.
- NIT (code): the "two sets of trips" unit case duplicates acceptance case (b).
- MINOR (security): the length guard `n < 5 || n > 7` does not throw for non-array input (`evaluate({})` returned 7452). Typed callers cannot reach it; only untyped JS or a cast could.
- NIT (security): `parseCard` echoes the whole input in its error message, and `parseCard(undefined)` throws `TypeError`, not `RangeError`.

## How to try it
- `npx vitest run tests/engine` for the engine tests (about 1 s).
- `npm run lint && npm run typecheck && npm test` for the full gate.
- Run the SPEC-12 throughput command from spec.md section 9 (perf test with thresholds 10M evals/s and 50 ms set through its environment variables).

## Run metrics
Questions asked: 3 · assumptions logged: 7 · review rounds: 1 · judge rounds: 1 · gate runs: 1 · escalations: 0 · changed lines: 797 (8 files). state.json records `assumptions: 0`, but the spec lists A-1..A-7.

## Known limitations and follow-ups
Not created; they need user approval.
- Hand names ("Pair of kings") and best-five-cards for showdown display (REQ-019.7) are for a later story.
- Harden the length guard (`Number.isInteger(n)` or `Array.isArray`) and truncate the echoed text in `parseCard`.
- Widen the CI perf floor headroom if the 1.9x margin proves flaky.
- Add a unit example where only the third kicker differs (J-1-01).

## Lessons for the factory (proposals — not applied)
- state.json `assumptions` stayed at 0 although the spec carries seven. The counter should be set from the spec Assumptions table.
- Spec mutation probes were expected to fail named tests (SPEC-06). One did not, because the examples sat in the wrong position. Spec writers should check that each probe maps to a test that can catch it.
- The spec invariant "no mutable state" conflicted with its own scratch-array allowance. Use "no observable mutable state" wording in the template.
- SPEC-16 (the story doc) is always pending at judge time. The judge should mark it as deferred to the Documentor by design.
