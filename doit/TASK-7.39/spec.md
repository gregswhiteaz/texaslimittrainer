# Spec: TASK-7.39 — Restore advice speed headroom on the 6-max actions spot and the 9-seat calling-range spot

Status: READY (approved 2026-11-28)
Task: TASK-7.39 · Parent/epic: TASK-7 · Requirements: n/a (follow-up of TASK-7.34, doc-167; REQ-055 context only) · Dream: limit-holdem-trainer

## 1. Summary
Two advice speed spots lack the 25% headroom the opt-in perf test asks for. The 6-max actions spot facing a bet
from one opponent runs at 85% of 25 ms. Profiling shows the time is not in `estimateOpponentRanges` (0.23 ms). It
goes to two identical exact equity runs: the opponent's narrowed range is already its calling range, so the
calling-range run repeats the whole-range run (§9). Reusing that result gives byte-identical advice at about half
the cost (AC#1). The 9-seat vs 8 opponents spot (127–134 ms) spends ~100 ms in the 8-way calling-range rejection
sampler. Results-identical speed-ups are exhausted (TASK-7.34 §9). AC#2 therefore changes seeded advice in a narrow
set of spots: the user's (not the bots') calling-range run uses fewer sampled trials when 7 or more opponents are
live (Q-1 = A). The builder measures the change and puts it in a sign-off package, and the user
approves it before code review.

## 2. Scope
- In scope:
  - `src/advice/postflop.ts`: (1) reuse of equity runs whose inputs are identical, within one call (AC#1);
    (2) a reduced trial budget for the calling-range run with ≥ 7 opponents (AC#2, Q-1 = A). Both apply only when the
    caller passes no `equity` option, i.e. when the default `computeEquity` is used.
  - `tests/advice/postflop.perf.test.ts`: the headroom test gains the actions spot (25 ms target, 18.75 ms
    limit), and the 9-seat target goes back from 200 ms to 100 ms (75 ms limit).
  - New unit test `tests/advice/postflop-calling-run.test.ts` and new acceptance test
    `tests/advice/calling-run-identity.acceptance.test.ts` (locked after the first green build; it does not depend on Q-1).
  - `README.md` Speed targets and `docs/advice/postflop-rules.md` ("Equity against the range that would call")
    updated.
  - Work-folder files (not shipped, not in the scope budget): `doit/TASK-7.39/advice-delta.ts` (measurement
    script) and `doit/TASK-7.39/signoff.md` (sign-off package).
- Not doing:
  - No change to `src/advice/equity.ts`, `src/advice/ranges.ts`, `src/bots/**`, `src/engine/**` or to any
    `equity` seam behaviour. Callers that inject `equity` (every bot, every spy test) see exactly the same calls
    and results as today.
  - No change to whole-range equity (`equityPct`), to `SAMPLE_TRIALS`, to the rejection cap rule (100 × trials),
    or to the A-7 fallback.
  - No change to any locked test or golden JSON. No timing check in plain `npm test` (perf stays opt-in,
    `TLH_SLOW_TESTS=1` / `ADVICE_PERF_SCALE`).
  - No change to other scenario targets, slack or the equity perf file.
  - No importance-weighted or sequential sampler (rejected alternative in D-2).
- Scope budget: files=6, lines=210

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Runs at real targets" = `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom`, `CI` unset, reference Mac (Apple M4 Pro, Node 22.18.0), 3 passes in a row, all green. | yes | Same method as TASK-7.34 A-4 / TASK-7.18 A-1 | grep the p95 lines of a single run |
| A-2 | AC#1's spot is timed inside the existing headroom test, with `ACTION_RANGE_ADVICE` and its 25 ms target, **after** the 9-seat and HU scenarios. | yes | One headroom command covers both ACs. TASK-7.34's recorded deviation (doc-167 "Dev") showed the first scenario timed in a fresh worker is bimodal. | A separate `-t` test |
| A-3 | AC#2's "9-seat vs 8 opponents spot" is the existing `NINE_SEAT_FACING_BET` headroom scenario (`tests/advice/postflop.perf.test.ts:85`). Its headroom target returns to 100 ms (limit 75 ms). | yes | It is the spot TASK-7.34 Q-1 moved to 200 ms | a new scenario |
| A-4 | AC#1's "advice results unchanged (playtest SHA identical)" is checked by: (a) `npm run playtest` stdout SHA-256 equal to the base value `d4d84efb02d49242388de13a4d0e39a1824d0f575badf4f1b2dd81b53cb22992` (measured 2026-11-27 on base `ff79ebdd`); (b) the advice-delta sample: 0 differing recommendations (deep equal, explanation included) among views with fewer than 7 live opponents; (c) the unit identity check SPEC-02. | yes | The default playtest seats only bots, which pass `BOT_EQUITY` and never reach the reuse, so (a) alone proves little about user advice. (b) and (c) cover the user's advice. | (a) only |
| A-5 | Both postflop changes apply only when `options.equity` is undefined. | yes | Many tests count injected-seam calls, several of them locked: `tests/advice/postflop.acceptance.test.ts:150` (TASK-7.9, TASK-7.3), `tests/advice/range-model.acceptance.test.ts:226` (TASK-7.5), `tests/advice/grade.acceptance.test.ts:290` (TASK-7.4), and `tests/bots/tag.test.ts:68,77`, `tests/advice/postflop.test.ts:344`, `tests/advice/postflop-ranges.test.ts:133-146`. Bots always inject `BOT_EQUITY` (`src/bots/tag.ts:76`, `rock.ts:27`, `calling-station.ts:44`, `maniac.ts:30`). | Apply to injected seams too (breaks locked tests; needs unlocks) |
| A-6 | The delta sample (SPEC-06): every seat plays calling-station (`decideCallingStation` with `botRandom(botDecisionSeed(code, view))`), sizes 9 and 10, seed 7390. Collected: every postflop decision view, up to 300 views with ≥ 7 live opponents and 300 with < 7 per size, at most 3,000 hands per size. Each view is advised with `ACTION_RANGE_ADVICE` (the user's advice, no observed stats). | yes | Calling stations reach 7+-way flops often. Postflop golden spots never do (§3). | Mixed line-up (fewer multiway pots) |

## 3. Current system
- `src/advice/postflop.ts:139-176`: `run` = `equity({hero, board, opponents})`. The whole-range run is
  `withFallbacks(run, attempts)` (`:157`). The calling-range run maps every attempt through `callingRange`
  (`:172`) and calls `withFallbacks(run, calling)` (`:173`). A `RangeError` falls back to `equityPct` (A-7,
  `:174-178`). `equity` defaults to `computeEquity` (`:116`). The seam "must be deterministic" (`:79`).
- `src/advice/ranges.ts:579-599` `callingRange`: returns a new filtered array (input order) or `range` itself when
  nothing continues. A result with the same length as the input therefore has the same content.
  `estimateOpponentRanges` (`:666-711`) narrows a bettor/caller with `KEEP.bet`/`KEEP.call` (`:62-67`). Both are
  subsets of `CONTINUE_CLASSES` (`:572`), so the calling range of a bettor or caller is its whole narrowed range.
- `src/advice/equity.ts:451-469`: `computeEquity` = `equityWithBudget(input, {exactLimit: 200_000, trials:
  30_000})`. The seed depends only on the canonical input (`deriveSeed`, `:136`), so equal inputs give equal results.
  `sampledEquity(c, trials, maxRejections = 100 * trials)` (`:346-350`). `equityWithBudget` passes only `trials`, so
  the cap scales with trials (the acceptance-rate rule stays the same).
- Bots: `BOT_EQUITY` = `equityWithBudget(…, {2_500, 500})` (`src/bots/tag.ts:29-33`), always injected. The user's
  advice uses the default: `src/table/advice-service.ts:76` (`userAdviceOptions`, `src/advice/recommend.ts:22-30`),
  `src/advice/golden.ts:494`, `src/playtest/advice-check.ts:21`.
- Golden spots: postflop 9-seat spots have 5–10 folds before the spot (checked `tests/golden/postflop-spots.json`),
  so at most 3 live opponents. No golden spot reaches 7 opponents, and AC#2 cannot change a golden result.
- Perf test: `tests/advice/postflop.perf.test.ts`: `slowScenarios(scenarios, options?, owed)` (`:95-123`),
  `HEADROOM_SCENARIOS` (`:91-94`, 9-seat 200 ms then HU 25 ms), `ACTION_SCENARIOS[0]` = the AC#1 spot (`:133-145`),
  headroom test (`:191-208`). Its 8-way check uses `computeEquity` (`:198`).
- Lock owners (all `doit/*/state.json` `locked_tests`). These must pass unchanged, and none is to be edited:
  advice: `postflop.acceptance` (TASK-7.9, TASK-7.3), `range-model.acceptance` (TASK-7.5), `value-bet.acceptance`
  (TASK-7.8), `explanations.acceptance` (TASK-7.10), `determinism.acceptance` (TASK-7.15), `table-sizes.acceptance`
  (TASK-7.6), `equity-multiway.acceptance` (TASK-7.7). Golden: `tests/golden/postflop.acceptance` (TASK-7.14,
  TASK-7.33), `postflop-lines.acceptance` (TASK-7.31, TASK-7.43), `graded-lines.acceptance` (TASK-7.36),
  `suite.acceptance` (TASK-7.14). Seeded bots and games: `calling-station.acceptance` (TASK-6.3),
  `calling-station-postflop.acceptance` (TASK-6.17), `maniac.acceptance` (TASK-6.4, TASK-6.25),
  `tests/playtest/games.acceptance` (TASK-1.16), `bot-results.acceptance` (TASK-6.10), `all-sizes.acceptance`
  (TASK-7.6), `check-advice.acceptance` (TASK-7.15), `playtest.acceptance` (TASK-1.6). Under this design (A-5) none
  of them can shift. If one fails, the builder stops and escalates. It does not re-pin.
- Existing code to reuse:
  - `src/advice/equity.ts` `equityWithBudget`, `EXACT_EVALUATION_LIMIT`, `type EquityBudget` → the reduced calling
    budget. No equity engine change.
  - `tests/advice/postflop.perf.test.ts` `slowScenarios`, `HEADROOM_SCENARIOS`, `ACTION_SCENARIOS[0]` view,
    `NINE_SEAT_FACING_BET`.
  - `src/playtest/runner.ts:349` `runPlaytest(options, onHand, { makePolicy })` (as used at
    `tests/bots/maniac.acceptance.test.ts:67`), `src/bots/calling-station.ts:34` `decideCallingStation`,
    `src/engine/bot-random` `botRandom`, `botDecisionSeed` → the delta sample.
  - `tools/playtest/resolve-ts.js` → run the delta script with Node type stripping.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | AC#1: within one `recommendPostflop` call with the default equity, a calling-range attempt whose every range has the same length as the matching whole-range attempt's range reuses that attempt's outcome (result, or the same `RangeError`) instead of running again. | Memo inside `computeEquity` (would make `equity.perf.test.ts` time cache hits); return `range` from `callingRange` when unchanged (also fine, but the length test needs no ranges.ts change) | Identical canonical input ⇒ identical result (deterministic seed), so advice is byte-identical. Saves one full equity run whenever every opponent bet, raised or called this street. | no | n/a |
| D-2 | AC#2: with the default equity and ≥ `REDUCED_CALLING_OPPONENTS` (7) opponents, a calling-range attempt not reused under D-1 runs `equityWithBudget(input, CALLING_RANGE_BUDGET)` with `CALLING_RANGE_BUDGET = { exactLimit: EXACT_EVALUATION_LIMIT, trials: 10_000 }`. | 8,000 deals at 7+ opponents (more margin, ±0.55 pts); 10,000 deals for every sampled calling run (heads-up and 3–6-way spots shift without need); importance-weighted sampler (every multiway number shifts, much more code); keep the 200 ms target (AC#2 unmet) | Calling-run cost explodes at 7–8 opponents (43 / 104 ms vs ≤ 24 ms at ≤ 6, §9). 10,000 trials gives 33 ms and still succeeds at the 8-way spot under the 100 × trials cap. | yes | user (Q-1 = A, 2026-11-28) |
| D-3 | User approval: the builder writes `doit/TASK-7.39/signoff.md` (SPEC-07) after the gate is green. The orchestrator shows it to the user in one question before code review (approve / approve with a different trial count or threshold / reject). The sign-off is recorded in the task notes, and AC#2 is checked only after that. | Approve after the judge; summary only | AC#2 requires approval before merge. Same pattern as TASK-7.40 D-7/SPEC-12. | yes | AC#2 text (process mandated by the task) |
| D-4 | Measure "before" and "after" in one process: `advice-delta.ts <baseRoot> <branchRoot>` imports both trees (base = `git worktree add` at `base_commit`). Views are built with the branch tree. The engine is unchanged, so they are valid for both. | Two runs writing JSONL, then a diff | One run, one summary; no file juggling | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/postflop.ts` — D-1 reuse and D-2 reduced calling budget; two exported constants.
- `tests/advice/postflop.perf.test.ts` — headroom: 9-seat target 100 ms, actions spot added, 8-way check uses
  the reduced budget; header comment updated.
- `tests/advice/calling-run-identity.acceptance.test.ts` — new acceptance test (SPEC-02); no timing, runs in `npm test`.
- `tests/advice/postflop-calling-run.test.ts` — new unit tests (SPEC-03, SPEC-04, SPEC-05).
- `README.md` — Speed targets: headroom check now covers the 6-max actions spot; 9-seat target 100 ms.
- `docs/advice/postflop-rules.md` — one sentence: with 7 or more opponents, the equity against the range that would
  call is sampled from 10,000 deals (Q-1 = A).
- `doit/TASK-7.39/advice-delta.ts`, `doit/TASK-7.39/signoff.md` — work-folder only (not counted in the budget).

### Components, interfaces and data
- `src/advice/postflop.ts` new exports:
  - `export const REDUCED_CALLING_OPPONENTS = 7;`
  - `export const CALLING_RANGE_BUDGET: EquityBudget = { exactLimit: EXACT_EVALUATION_LIMIT, trials: 10_000 };`
  (values per Q-1 = A). Doc comments cite TASK-7.39.
- Inside `recommendPostflop`, `const defaultEquity = options?.equity === undefined;`
  - Whole-range run: `withFallbacks(run, attempts)` as today, but when `defaultEquity`, each attempt's outcome
    (an `EquityResult`, or the `RangeError` it threw) is kept in a per-call `Map<readonly Range[], …>` keyed by the
    attempt array.
  - Calling-range run: `calling[j] = attempts[j].map(r => callingRange(r, board))`. When `defaultEquity` and
    `calling[j].every((r, i) => r.length === attempts[j][i].length)`, attempt j uses `attempts[j]` (the same key).
    A kept outcome is reused (a result is returned, a kept `RangeError` is rethrown); otherwise it runs. When
    `defaultEquity`, an attempt that is not reused and has `≥ REDUCED_CALLING_OPPONENTS` ranges runs
    `equityWithBudget({ hero, board, opponents }, CALLING_RANGE_BUDGET)`. Every other case calls `run` as today.
  - Injected `equity`: unchanged code path. Same calls, order and inputs as on base.
- `PostflopRecommendation` shape, `equityMethod` (whole-range run), rounding, rules and explanation are unchanged.

### Rules and algorithms
- Reuse (D-1). Worked example, the AC#1 spot: BTN raised, BB called, BB checks, BTN bets. Hero = BB facing one
  opponent with 74 narrowed combos (`KEEP.bet`). `callingRange` keeps all 74, so the lengths match, and the
  calling-range result is the whole-range result: `equityVsCallingRangePct === equityPct`, one exact run instead
  of two (21.3 → ~11.7 ms).
- Reduced budget (D-2). Worked example, the 9-seat spot, 8 opponents, unseen mode: whole = 8 × 1081 combos (30,000
  trials, unchanged); calling = 8 × 324 combos, not equal in length, so it runs at 10,000 trials with a
  1,000,000-rejection cap. Measured hero equity 0.28% at both 30,000 and 10,000. Calling run 100.5 → 33.5 ms.
- 9-opponent spots (10-seat): the calling run at 10,000 trials and a 1,000,000 cap still throws (measured 1.5 ms,
  was 10.3 ms), so the A-7 fallback is unchanged there.

### Error handling and configuration
- No new errors. A kept `RangeError` is rethrown as is, so `withFallbacks` moves on exactly as before. Non-RangeErrors
  are never kept (they propagate on first throw, as today).

## 6. Behaviour specification

### SPEC-01: The 6-max actions spot has 25% headroom
- Verifies: AC#1
- Behaviour: Given the reference Mac with `CI` unset, When `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom` runs 3 times in a row, Then each pass prints `actions: 6-max flop facing a bet, one opponent: 1 opponents, exact, p95 X ms (target 18.75 ms x 1 = 18.75 ms)` with X ≤ 18.75, and exits 0.
- Verification: command `for i in 1 2 3; do ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom 2>&1 | tee /dev/stderr | grep -E 'Tests +1 passed' || exit 1; done`

### SPEC-02: Default advice equals the two-run advice below 7 opponents
- Verifies: AC#1
- Behaviour: Given each of these views: the AC#1 actions spot, `HU_FACING_BET`, the 6-max vs 3 opponents spot and a turn view where one opponent checked (so its calling range is smaller), When advised with `ACTION_RANGE_ADVICE` and with `{ opponentRanges: 'unseen' }`, Then `recommendPostflop(view, opts)` deep-equals `recommendPostflop(view, { ...opts, equity: computeEquity })` (injected seam = today's two-run path), explanation included.
- Verification: acceptance `tests/advice/calling-run-identity.acceptance.test.ts::default advice equals the two-run advice below 7 opponents`

### SPEC-03: An identical calling-range run is not repeated
- Verifies: AC#1
- Behaviour: Given `vi.mock('../../src/advice/equity')` wrapping `computeEquity` and `equityWithBudget` in counters (actual implementations kept), When the AC#1 actions spot is advised by default, Then `computeEquity` runs once and `equityWithBudget` 0 times; and for `HU_FACING_BET` (unseen; the calling range is smaller) `computeEquity` runs twice.
- Verification: unit `tests/advice/postflop-calling-run.test.ts::an identical calling-range run is not repeated`

### SPEC-04: Injected equity seams are untouched
- Verifies: AC#1, AC#2
- Behaviour: Given a recording stub `equity`, When the AC#1 actions spot and the 9-seat spot are advised with it, Then the stub is called exactly twice per view (whole, then calling), the second input's ranges are the calling ranges, and `equityWithBudget` (mock counter) is called 0 times.
- Verification: unit `tests/advice/postflop-calling-run.test.ts::injected equity seams are untouched`

### SPEC-05: 7+ opponents use the reduced calling budget
- Verifies: AC#2
- Behaviour: Given the 9-seat spot (8 opponents, unseen) by default, When advised, Then `equityWithBudget` is called once with `CALLING_RANGE_BUDGET` (`trials: 10_000`) and 8 calling ranges; `equityVsCallingRangePct` equals `toPct(equityWithBudget({hero, board, opponents: 8 × callingRange(unseen, board)}, CALLING_RANGE_BUDGET).hero.equity)`; `equityPct` equals `toPct(computeEquity(8 × unseen).hero.equity)` (unchanged). Given a 7-opponent view, the reduced budget applies too; given a 6-opponent view, it does not (`equityWithBudget` 0 calls).
- Verification: unit `tests/advice/postflop-calling-run.test.ts::7+ opponents use the reduced calling budget`

### SPEC-06: The 9-seat spot has 25% headroom at a 100 ms target
- Verifies: AC#2
- Behaviour: Given the reference Mac with `CI` unset, When the headroom command runs 3 times in a row, Then each pass prints `9-seat flop vs 8 opponents: 8 opponents, sampled, p95 Y ms (target 75 ms x 1 = 75 ms)` with Y ≤ 75, `HU flop facing a bet … (target 18.75 ms …)` within limit, and exits 0. The test also checks (any scale, CI or not) that `equityWithBudget(8 calling ranges, CALLING_RANGE_BUDGET).method === 'sampled'` without throwing, so the spot is not an A-7 fallback.
- Verification: command `for i in 1 2 3; do ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom 2>&1 | tee /dev/stderr | grep -E 'Tests +1 passed' || exit 1; done`

### SPEC-07: Changes to seeded advice and bot results are measured in a sign-off package
- Verifies: AC#1, AC#2
- Behaviour: Given the gate is green, When the builder finishes, Then `doit/TASK-7.39/signoff.md` exists with these sections, in order:
  1. **Speed**: p95 table, base vs branch, 3 headroom passes each: the actions spot, HU, 9-seat; plus one scale-1 full-file run (all 8 scenarios incl. 10-seat vs 9 and value-bet).
  2. **Bots and seeded runs**: SHA-256 of stdout, base vs branch, for `npm run playtest`, `-- --size 9`, `-- --size 10`, `-- --lineup mixed --size 9`, `-- --lineup soft --size 10`, `-- --game sng`, and `-- --check-advice --hands 2000 --size 9` / `--size 10`. Expected: all identical (bots inject `BOT_EQUITY`). Any difference is listed and explained.
  3. **User advice delta** (A-6 sample, `node --import ./tools/playtest/resolve-ts.js doit/TASK-7.39/advice-delta.ts <baseWorktree> .`): per size and per bucket (< 7 / ≥ 7 opponents): views compared; recommendations differing (deep equal); max and mean |Δ `equityVsCallingRangePct`|; `action` / `ruleId` flips; fallback flips (calling number = `equityPct` on one side only); explanation text changes. The < 7 bucket must show 0 differences (AC#1). Up to 20 changed ≥ 7 views listed: size, hero, board, opponents, before → after numbers and action.
  4. **Tests**: `npm test` and `npm run test:slow` results. `git diff --stat <base_commit> -- tests e2e` lists only `tests/advice/postflop.perf.test.ts` and the two new test files (no locked test or golden JSON changed).
  5. **Decision for the user**: approve / approve with a different trial count or opponent threshold (the builder re-runs and refreshes the package) / reject (AC#2 not met; the orchestrator blocks the task).

  The orchestrator shows the package to the user in one question before code review. It appends a dated sign-off entry to the TASK-7.39 notes, and AC#2 is checked only after that entry exists.
- Verification: manual The orchestrator checks that `doit/TASK-7.39/signoff.md` has the five sections with numbers filled and the < 7 bucket at 0 differences, and that `backlog task view TASK-7.39 --plain` shows the sign-off entry before Done.

### SPEC-08: Bot and default playtest results are byte-identical
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When `npm run playtest` runs (defaults), Then its stdout SHA-256 is `d4d84efb02d49242388de13a4d0e39a1824d0f575badf4f1b2dd81b53cb22992` (base `ff79ebdd`), no file under `src/` other than `src/advice/postflop.ts` differs from the base, and the locked seeded bot and game tests listed in §3 pass unedited.
- Verification: command `test "$(npm run -s playtest | shasum -a 256 | cut -d' ' -f1)" = d4d84efb02d49242388de13a4d0e39a1824d0f575badf4f1b2dd81b53cb22992 && test "$(git diff --name-only ff79ebdd -- src/)" = src/advice/postflop.ts && npx vitest run tests/bots/calling-station.acceptance.test.ts tests/bots/calling-station-postflop.acceptance.test.ts tests/bots/maniac.acceptance.test.ts tests/playtest/bot-results.acceptance.test.ts tests/golden tests/advice/postflop.acceptance.test.ts tests/advice/range-model.acceptance.test.ts tests/advice/value-bet.acceptance.test.ts && TLH_SLOW_TESTS=1 npx vitest run tests/playtest/games.acceptance.test.ts tests/bots/maniac.test.ts`

### SPEC-09: Plain npm test runs no timing check
- Verifies: AC#1, AC#2
- Behaviour: Given `TLH_SLOW_TESTS` and `ADVICE_PERF_SCALE` unset, When `tests/advice/postflop.perf.test.ts` runs, Then all 4 tests are skipped and no `p95` line is printed. The new test files have no timing assertion. `npm test` exits 0.
- Verification: command `env -u TLH_SLOW_TESTS -u ADVICE_PERF_SCALE npx vitest run tests/advice/postflop.perf.test.ts 2>&1 | grep -E 'Tests +4 skipped \(4\)' && ! grep -n -E 'cpuNowMs|performance\.now|Date\.now' tests/advice/postflop-calling-run.test.ts tests/advice/calling-run-identity.acceptance.test.ts && npm test`

## 7. Edge cases
- Whole-range attempt 0 throws a RangeError and its calling attempt 0 is identical: the kept error is rethrown, so the
  next attempt is tried exactly as on base (SPEC-02 covers it via deep equality on a narrowed actions view; the
  builder adds a view where attempt 0 throws, if one can be built cheaply, else N/A as on base).
- `callingRange` returns `range` itself (nothing continues, A-2): same length → reuse. Identical to base.
- 7+ opponents, but every calling range equals its whole range: reuse wins (30,000-trial result, identical to base).
- 9 opponents: the reduced run still throws → A-7 fallback, as on base (§5). The perf value-bet test still asserts
  this.
- Spots near the sampler's rejection cap (≈ 1% acceptance): sampling noise at 10,000 trials can flip success vs
  fallback. Counted as "fallback flips" in SPEC-07.
- Concurrency, persistence, input validation: N/A (pure function; no new input surface).

## 8. Security considerations
- No trust boundary, input, secret, logging or dependency change. Randomness: the seeded deterministic sampler is
  unchanged; only the trial count of one run changes (not a fairness or security use). N/A otherwise.

## 9. Non-functional
Measured 2026-11-27 on base `ff79ebdd` (Apple M4 Pro, Node 22.18.0, `CI` unset), CPU-time p95 of 20 runs after 15
warm-ups:

| Item | p95 (ms) | Note |
|---|---|---|
| actions: 6-max facing a bet, one opponent (Vitest, 2 passes) | 21.28 / 21.17 | 85% of 25. Limit 18.75 |
| ↳ `estimateOpponentRanges` | 0.23 | not the bottleneck (the task text guessed it) |
| ↳ whole-range run (exact, 74 combos) | 9.64 | |
| ↳ calling-range run (same 74 combos) | 9.59 | identical input → D-1 removes it |
| 9-seat vs 8 opponents (Vitest, 2 passes) | 126.46 / 128.11 | node harness 134.0. Limit 75 |
| ↳ whole-range run, 8 × 1081 | 33.5 | unchanged |
| ↳ calling-range run, 8 × 324, 30,000 trials | 100.5 | |
| ↳ same at 8,000 / 10,000 / 12,000 trials (cap 100 × trials) | 26.7 / 33.5 / 40.1 | all succeed; hero equity 0.26 / 0.28 / 0.28% (30k: 0.28%) |
| calling run vs k unseen-calling ranges, k = 1..8 | 14.7, 6.8, 9.5, 12.6, 16.5, 24.2, 43.2, 103.8 | the jump at 7–8 sets the threshold |
| 10-seat 9-way calling run: 30k/3M → 10k/1M | throws in 10.3 → 1.5 | fallback kept |

Expected after: actions spot ≈ 11.7 ms (47%), 9-seat ≈ 60–68 ms (60–68% of 100). Precision: the standard error of
a 10,000-trial equity is at most 0.5 points (vs 0.29 at 30,000).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom && npm run test:slow`
- New tests (path → SPEC ids): `tests/advice/calling-run-identity.acceptance.test.ts` → SPEC-02; `tests/advice/postflop-calling-run.test.ts` → SPEC-03..05; headroom test in
  `tests/advice/postflop.perf.test.ts` → SPEC-01, SPEC-06. Commands → SPEC-08, SPEC-09. Package → SPEC-07.
- Build order: D-1 first, with SPEC-01/02/03 green and the delta script showing 0 differences in both buckets; then
  D-2.
- Judge end-to-end: on the reference Mac with `CI` unset, run SPEC-01/06 (the 3-pass headroom loop), SPEC-08, SPEC-09,
  `npm run test:slow`. Re-run section 3 of `signoff.md` (advice-delta) and confirm its numbers match the package.
  Check the sign-off entry exists.

## 11. Open questions
None. Q-1 resolved (A, 2026-11-28): with 7 or more live opponents the user's calling-range equity uses
10,000 sampled deals; bots and every spot with 6 or fewer opponents stay byte-identical. The user approves the
sign-off package (SPEC-07) before code review, and AC#2 is checked only after the dated sign-off entry.

## 12. Clarifications log
See `doit/TASK-7.39/qa.md`.
