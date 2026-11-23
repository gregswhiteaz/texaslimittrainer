# Changes — TASK-7.8

## Source
- `src/advice/postflop.ts` — rules `value-bet` and `value-raise` (D-1 order), `PostflopAdvice` gains `bet`/`raise`, `VALUE_THRESHOLD_PCT`, `equityVsCallingRangePct` on every recommendation; second equity run against the calling ranges through the same fallback chain (A-5), whole-range number when that chain still throws `RangeError` (A-7).
- `src/advice/ranges.ts` — `CONTINUE_CLASSES` and `callingRange` with a per-board class memo (D-5); `hasOpenEnder` rewritten with rank bit masks (same result, faster).
- `src/advice/equity.ts` — `EquityBudget` and `equityWithBudget`; `computeEquity` delegates with today's constants. Output-identical speed-ups for the bot budget: `deriveSeed` hashes the canonical key as it goes (same value as `fnv1a32(canonicalKey(c))`), `canonicalise` uses a typed-array dedupe and skips the sort when the range is already ascending, the sampler's distinct-card check and flat ranges use typed arrays, river exact enumeration skips building an unused deck.
- `src/advice/grade.ts` — comment on `equityVsCallingRangePct` only.
- `src/bots/tag.ts` — `FREE_CHECK_EQUITY` removed; `BOT_EQUITY_BUDGET` (`{ exactLimit: 2_500, trials: 500 }`) and `BOT_EQUITY`; `decideTag` always passes `equity: options.equity ?? BOT_EQUITY`.
- `src/bots/rock.ts`, `src/bots/maniac.ts`, `src/bots/calling-station.ts` — free-check branches removed; every advice call passes `options.equity ?? BOT_EQUITY`.

## Docs
- `docs/advice/postflop-rules.md` — rules `value-bet` and `value-raise` with the Ks 8d 7c worked example and a raise example, "range that would call", calling-range equity and the 50% threshold defined, updated "Not applied yet" (bots' smaller equity budget).

## Tests (new)
- `tests/advice/value-bet.acceptance.test.ts` — acceptance AC#1–AC#11 (SPEC-01..SPEC-11).

## Tests (unlocked, updated)
- `tests/advice/postflop.test.ts` — `describe('rule value-bet')`, `describe('rule value-raise')` (boundaries, A-1, A-4, A-5, A-7); check-free / pot-odds-call cases use a per-run stub.
- `tests/advice/ranges.test.ts` — `callingRange` units (order, A-2, memo across boards).
- `tests/advice/equity.test.ts` — `equityWithBudget`, `BOT_EQUITY`, `deriveSeed` = `fnv1a32(canonicalKey)` units.
- `tests/advice/grade.test.ts` — real postflop view case rewritten (now bet advice graded by `aggression-margin`); stub call counts 1 → 2.
- `tests/advice/postflop-ranges.test.ts` — fallback call lists/counts include the calling-range run; default-mode inputs check whole and calling ranges.
- `tests/bots/tag.test.ts`, `tests/bots/maniac.test.ts`, `tests/bots/calling-station-draws.acceptance.test.ts` — `FREE_CHECK_EQUITY` replaced by `BOT_EQUITY`; re-pinned to value advice.
- `tests/bots/rock.test.ts` — free-check case now expects the advice at `BOT_EQUITY` (check with 0 equity, bet with 1).
- `tests/bots/calling-station.test.ts` — 10,000 → 1,000 hands (A-6).
- `tests/playtest/cli.test.ts` — default-equality check on 300 hands instead of 10,000; first Mixed replacement now at hand 16.
- `tests/playtest/policy-lineup.acceptance.test.ts` — Tough run 45 → 30 hands (seed 42's first Tough replacement is now hand 34).
- `tests/engine/invariants.perf.test.ts` — timed runs use random-move seats so bot equity cost does not swamp the checker measurement.

## Tests (locked, re-pinned under Q-3)
- `tests/advice/postflop.acceptance.test.ts` (TASK-7.3) — AC#1 gains `equityVsCallingRangePct: 16.7` and 2 equity calls; AC#3 allows bet/raise; AC#5 fake id `value-bet` → `bluff`.
- `tests/advice/postflop-coverage.acceptance.test.ts` (TASK-7.22) — allowed actions and expected-rule derivation include the value rules.
- `tests/bots/tag.acceptance.test.ts` (TASK-6.1) — top set raises; facing-bet moves may raise; free decisions check or bet; random-run comparisons use `BOT_EQUITY`.
- `tests/bots/tag-mixing.acceptance.test.ts` (TASK-6.2) — advice compared at `BOT_EQUITY`.
- `tests/bots/calling-station.acceptance.test.ts` (TASK-6.3) — Example A / worker view is `raise[1]` (same AQo view and pinned values); point 0 re-pinned (river value raise, both raise to 16).
- `tests/bots/maniac.acceptance.test.ts` (TASK-6.4) — Example E is `check[2]` (JTo BB option) with its new code/seed/draw.
- `tests/advice/grade.acceptance.test.ts` (TASK-7.4) — equity stub calls 1 → 2.
- `tests/advice/range-model.acceptance.test.ts` (TASK-7.5) — spy calls 1 → 2.
- `tests/table/review.acceptance.test.ts`, `tests/ui/review-panel.acceptance.test.tsx` (TASK-9.1) — advice labels and grades re-pinned.
- `tests/table/next-hand.acceptance.test.ts` (TASK-3.4) — hand-43 short stack 94 → 30.

## Tests (unlocked under D-7, Block 1) and config
Each heavy run now has an opt-in version (`it.runIf(SLOW)`, `TLH_SLOW_TESTS=1`, original title, assertions and limits) and an every-push version at 1,000 hands with the same assertions (only hand-count-dependent values re-pinned).
- `tests/bots/tag-playtest.acceptance.test.ts` (TASK-6.1) — AC#5 10,000 (slow) / 1,000 (every push).
- `tests/playtest/games.acceptance.test.ts` (TASK-1.16) — AC#6/AC#7/AC#8 10,000 (slow) / 1,000; AC#8's CLI "Last replay code" is `…000003e8` at 1,000. AC#6's in-process mostly-random sit-and-go run stays at 10,000 hands in both versions (seed 42's first sit-and-go ends at hand 4,740; that run takes about 0.8 s); only its TAG CLI run scales.
- `tests/playtest/heads-up.acceptance.test.ts` (TASK-1.11) — AC#4 and AC#5 (default 10,000-hand CLI run) 10,000 (slow) / 1,000 (AC#5 passes `--hands 1000`).
- `tests/playtest/invariants.acceptance.test.ts` (TASK-1.8) — AC#1 clean run 10,000 (slow) / 1,000.
- `tests/playtest/runner.acceptance.test.ts` — AC#6 10,000 (slow) / 1,000.
- `tests/playtest/bot-results.acceptance.test.ts` (TASK-6.10) — the three 2,000-hand tests 2,000 (slow) / 1,000.
- `tests/playtest/playtest.acceptance.test.ts` — AC#1 and AC#3's 10,000-hand runs 10,000 (slow) / 1,000.
- `package.json` — the seven files added to `test:slow`.

No new dependencies.
