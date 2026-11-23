# TASK-7.12: Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD

Status: Done (pending judge) · Completed: 2026-11-23 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-045.1-.6 (also REQ-027.6) · Branch: doit/TASK-7.12

## What was asked
One pure module that computes the five REQ-045 style stats (VPIP, PFR, Aggression, WTSD, W$SD) for one seat over completed hands, so every screen and bot check uses the same formulas. A stat with a zero denominator is `null` and displays as `—`. Six ACs: VPIP 50% / PFR 20% example; Aggression 50%; WTSD 25%; W$SD 50% (split pot); `—` for zero denominators; blind-then-fold is not VPIP. Spec: doit/TASK-7.12/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Percentages are unrounded numbers 0-100; `null` = denominator 0. Callers round. | yes | Limits are inclusive (REQ-044.11); style-bands already rounds to 0.1 | Change return scale in `styleStats` |
| A-2 | `formatStat` gives `—` for null, else whole percent with `%` (`50%`, `33%`) | yes | Compact panel; screens can add decimals | Add a decimals option |
| A-3 | Saw the flop = board has >= 3 cards and no preflop fold; all-in preflop with runout counts | yes | Engine deals flop only past preflop | Count only seats that acted on the flop |
| A-4 | Reached showdown = `endedBy === 'showdown'` and seat never folded; mucked seats count | yes | `result.showdown` omits mucked hands | Use `result.showdown` |
| A-5 | Won at showdown = winner with `amount > 0` in any award (main, side, split); returned uncalled bet is not a win | yes | AC#4 split pot; awards exclude `returned` | Use net chips > 0 |
| A-6 | Aggression counts postflop actions: bet/raise = aggressive, call = passive; checks/folds ignored; short all-ins count by their record type | yes | AC#2 counts actions; matches old counter | Count hands |
| A-7 | Seat counts as dealt in if in `hand.seats`; an undealt seat adds 0 everywhere | yes | `seats` lists only dealt-in seats | Throw RangeError |
| A-8 | Module at `src/stats/style-stats.ts` | yes | Already a headless-lint and 90% coverage folder | Move to `src/advice/` |

## Clarifications and decisions
- **Q-1 (auto-accepted, recommended): the locked slow test `tests/bots/style-bands.acceptance.test.ts` was switched from its private counters to the shared functions** (unlocked under TASK-6.16). Bands, seeds, hand count, test names, opt-in gate and 0.1 rounding are kept; a null stat now fails. This gives REQ-027.6 one definition.
- **AC#5(b) correction:** the AC implies the other stats are numbers when a seat never saw a flop, but with no flop there are no postflop actions, so Aggression is necessarily `null` there too. The test asserts Aggression null with VPIP/PFR numbers and WTSD/W$SD null.

## What was built
- `src/stats/style-stats.ts` (new, three layers): `handStyleCounts(hand, seat)` per-hand counts, `addStyleCounts` / `styleCounts` sums, `styleStats` percentages, `formatStat`, plus `StatHand`, `StyleCounts`, `NO_STAT`, `EMPTY_STYLE_COUNTS`. Takes a structural type that today's `CompletedHand` and playtest `PlayedHand` already satisfy; reads no hole cards.
- `docs/stats/style-stats.md` (new): five formulas, counting rules (blinds, BB check, SB completion, all-in/runout, mucked, split/side pot, returned bet, postflop-only aggression), API examples for both record types, display rule (SPEC-13).
- `tests/stats/style-stats.acceptance.test.ts` (new, locked, SPEC-01..06), `tests/stats/style-stats.test.ts` (new, SPEC-07..10), `tests/bots/style-bands.acceptance.test.ts` (modified, SPEC-11).
- No UI, no persistence, no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..06 | AC#1-#6 | Acceptance tests on hand-written records | Pass | tests/stats/style-stats.acceptance.test.ts |
| SPEC-07..10 | Edge hands, undealt seats, purity, formatting, real `runPlaytest` invariants, `CompletedHand` as `StatHand` | Unit tests | Pass | `npx vitest run tests/stats/`: 2 files, 10 tests passed |
| SPEC-11 | Bot bands via shared functions | `TLH_SLOW_TESTS=1` style-bands, seed 42 | Pass; numbers identical to main (TAG 22.3/16.4/63.7, Rock 10.1/8.8/48.7, Calling station 58.2/6.4/15.4, Maniac 56.8/54.3/78.7) | build-log.md |
| SPEC-12 | Playtest unaffected | `playtest --hands 10000 --seed 42` | 0 violations; SHA 14d746f7...2e48 unchanged | build-log.md |
| SPEC-13 | Docs | Manual read | Present | docs/stats/style-stats.md |
| all | lint, typecheck, `npm test` | Gate | PASS (build-1, fix-2); 208 files / 919 tests passed | doit/TASK-7.12/gates/ |
- Scope warning: 983 changed lines vs 560 budget, mostly Prettier-expanded fixtures (production code 124 lines).
- Judge: see doit/TASK-7.12/judge/.

## Review
Round 1: 0 blocking findings; security reviewer found nothing (pure function, no hole cards, malformed records fail closed with TypeError; validation belongs to the TASK-3.9 loader).

### Non-blocking review notes (deliberately not fixed)
- MINOR: no hand-written fixture where the seat folds while others reach showdown, so the `!folded` half of A-4 is not pinned by the acceptance tests. It is caught by the real-hand invariant `showdowns <= sawFlop` (mutation probe confirmed).
- NIT: `w.amount > 0` (A-5) is never exercised; removing it passes all tests.
- MINOR: line budget exceeded (983 vs 560), see above.
- NIT: SPEC-05 wording on aggression in AC#5(b), resolved as described under Clarifications.

## How to try it
`npx vitest run tests/stats/` · `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts -t "seed 42"` · `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`

## Run metrics
Questions 1 (auto-accepted) · assumptions 8 · review rounds 1 · judge rounds: see judge/ · gate runs 2 · escalations 0 · changed lines 983 (5 files).

## Known limitations and follow-ups
- Consumers still to build on this module: TASK-10.3 (Session Report stats vs healthy ranges), TASK-11.8 (stats over last 1,000 hands), TASK-3.14 (opponent observed stats on hover/tap), TASK-7.13 (E07-S09 range scaling from observed play), TASK-6.11 (`--check-styles` bot band report). TASK-3.9 owns the permanent hand record and its validation.
- [trainer] Pin the fold-then-others-showdown case and a zero-amount award winner with explicit fixtures (owner: TASK-7.12 itself is closing; optional hardening, below the value bar unless a consumer disagrees).
- [trainer] TASK-6.11: use `styleStats` from this module for `--check-styles` rather than a new counter.

## Lessons for the factory (proposals — not applied)
- Spec ACs that imply "other stats are numbers" should be checked for logical impossibility (AC#5(b)) during spec review.
- Scope-budget line counts should exclude Prettier-expanded fixtures or be set from the test plan, as the 560 estimate was missed by 75%.
