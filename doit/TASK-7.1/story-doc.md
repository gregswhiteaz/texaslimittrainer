# TASK-7.1: Compute a hand's equity against opponent hands

Status: Done · Completed: 2026-11-17 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: REQ-034.1, REQ-034.2 (three-way AC only), REQ-034.3 · Branch: doit/TASK-7.1

## What was asked
As a learner, I want equity numbers that match exact poker maths. Given the hero's two cards, a board of 0, 3, 4 or 5 cards and 1 to 9 opponents (a known hand or a list of possible hands each), the calculator returns each player's win chance, tie chance and pot share (split pots count as shares). Heads-up preflop results must be within 1.5 percentage points of exhaustive enumeration (AA vs KK 81.9%, AKs vs QQ 46.2%). The same input must always give the same numbers, and any sampler is seeded from the canonicalised input. Bots (≤ 100 ms) and hints (≤ 1 s) depend on its speed. Spec: doit/TASK-7.1/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Two modules (`src/advice/equity.ts`, `src/engine/seeded-random.ts`); tests in `tests/advice/` and `tests/engine/` | yes | Follows TASK-1.2 layout | Merge into one module |
| A-2 | Results are fractions 0–1, not percentages | yes | No rounding inside the calculator | Return percentages |
| A-3 | Split pots counted in integer 1/2520 units | yes | Exact, order-independent sums | Float sums of 1/k |
| A-4 | Range combos that use a hero/board card are silently dropped; duplicate combos count once; a fixed opponent hand that clashes is an error | yes | Later range code can pass "all combos" unfiltered | Error on any clash; weights |
| A-5 | Opponents are canonicalised (sorted) and results mapped back to input order | yes | Needed for canonical seeding; makes TASK-7.7 AC#3 true early | Canonicalise only cards/combos |
| A-6 | Invalid input throws `RangeError` with fixed messages | yes | Same as the evaluator | Result object with error field |
| A-7 | `tests/advice/fixtures` added to `.prettierignore`; generator writes one case per line | yes | Keep generated data compact | Run prettier on output |
| A-8 | `npm test` timing check uses a slack factor (`EQUITY_PERF_SCALE`, default 20×); real targets run by a separate command | yes | CI with coverage is much slower | No timing in `npm test` |
| A-9 | Fresh-process check spawns `node` with Vite `runnerImport` | yes | No new dependency | Second Vitest run |
| A-10 | Up to 9 opponents (full ring) | yes | Largest table; bounds work | No limit |
| A-11 | Seeded PRNG lives in `src/engine/seeded-random.ts` (orchestrator decision, told to the user) | yes | TASK-1.3 shuffle can reuse it without engine importing advice | Move to `src/advice/` |
| A-12 | SPEC-08 river example arithmetic slip: 45 unseen cards give C(45,2) = 990 combos, so 990×1×2 = 1,980 (still exact), not 2,070 | yes | Spec arithmetic error; test asserts 1,980 | Edit spec/test |
| A-13 | SPEC-05 input (b) has identical opponent ranges, so reordering is a no-op; test asserts equality directly. Mapping back with distinct ranges is covered by the SPEC-09 property test | yes | Swap-back would compare different samples | Change the input |
| A-14 | (Review r1 MAJOR) The pre-sampling feasibility search is capped at 100,000 nodes, plus an early check that the live ranges hold at least 2k distinct cards. On cap, sampling proceeds and its rejection cap throws `RangeError`. Spec §8 ("work per call is bounded") wins over the unbounded wording in §5 step 5; the spec text stays locked | yes | Unbounded search could hang a synchronous call | Remove the cap (not advised) |
| A-15 | (Judge r1) Fix SPEC-15 by speeding up the sampled path with byte-identical results, without editing the locked test. Target ≤ 2.0 s for AC#2 locally | partly | The target was NOT reached (see Q-5). Superseded by Q-5 | n/a |

## Clarifications and decisions
- Q-1 (D-1), public API: recommended option accepted. `computeEquity({ hero, board, opponents })` returns `{ hero, opponents, method: 'exact'|'sampled', trials }`; each player has `{ win, tie, equity }` as fractions; a known hand is a one-combo range.
- Q-2 (D-2), sampler: recommended option accepted. FNV-1a 32-bit seed from the canonical key, SplitMix32 expands to xoshiro128**. Exact when estimated work ≤ 200,000 evaluations, otherwise 30,000 accepted trials with whole-deal rejection.
- Q-3 (D-3), reference set: recommended option accepted. An offline generator (`tools/equity/generate-reference.js`, sharing no code with the equity module) writes a committed fixture of 121 cases as integer counts. Published anchors are asserted and 2 cases are re-enumerated on each test run.
- Q-4 (D-4), latency: accepted. p95 targets on the reference machine: HU preflop ≤ 15 ms, HU flop exact ≤ 2 ms, HU flop vs all combos ≤ 20 ms, HU turn vs all combos ≤ 15 ms, 3-way preflop ≤ 20 ms, 6-max preflop vs 5 ranges ≤ 50 ms, full-ring flop vs 9 ranges ≤ 80 ms.
- Q-5 (escalation, judge round 1): AC#2 timed out on CI (default 5 s per test). The cause is 7.2M `evaluate()` calls; evaluate alone takes about 2.0 s under coverage. Builder speed-ups cut it only from 4.17 s to about 3.9 s. Options were a longer timeout (recommended), a faster evaluator in the TASK-1.2 file, or fewer matchups. The user chose to raise the timeout: Vitest `testTimeout: 30_000` in `vite.config.ts`, an 11th file outside the spec's list. The builder's edit was blocked by the auto-mode permission check, so the orchestrator made it at the user's explicit instruction.
- D-5: fresh-process determinism is tested by spawning `node` with Vite `runnerImport`.

## What was built
- `src/advice/equity.ts` — types, `computeEquity`, validation (fixed `RangeError` messages), canonicalisation (sorted hero, board, combos and opponents; seed from the canonical key), exact backtracking enumeration, seeded whole-deal-rejection sampler with integer 1/2520 share units, and the exact/sampled rule. The sampler's hot loop uses typed arrays and writes cards straight into hands.
- `src/engine/seeded-random.ts` — `fnv1a32`, `splitMix32`, `Xoshiro128`. No `Math.random` and no clock.
- `tools/equity/generate-reference.js` — independent exhaustive enumerator (uses only `evaluate`/`parseCards`). `node tools/equity/generate-reference.js` takes about 27 s and reproduces the fixture byte for byte.
- `tests/advice/fixtures/equity-reference.json` — 120 heads-up preflop matchups plus the three-way case (mw-001), one per line.
- Tests: `tests/advice/equity.acceptance.test.ts` (locked, AC#1–5), `equity-reference.test.ts`, `equity.test.ts`, `equity.perf.test.ts`, `tests/engine/seeded-random.test.ts`.
- `.prettierignore` (fixtures), `vite.config.ts` (`testTimeout: 30_000`, Q-5). No new dependencies.

Example: `computeEquity({ hero: parseCards('As Ah') as [Card,Card], board: [], opponents: [[ [Ks,Kd] ]] })` gives a hero `equity` of about 0.8195.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | AA vs KK and AKs vs QQ match published values | pass | acceptance test |
| SPEC-02 | AC#2 | All stored HU preflop matchups within 1.5 pts | pass | largest error 0.957 pts (hu-064) |
| SPEC-03 | AC#2 | Fixture consistent with generator (2 cases re-enumerated) | pass | unit test |
| SPEC-04 | AC#3 | AA vs KK vs QQ within 1.5 pts | pass | acceptance test |
| SPEC-05 | AC#4 | Same result twice in-process and once in a fresh process | pass | acceptance test |
| SPEC-06 | AC#5 | Seed depends only on the canonical input | pass | acceptance test |
| SPEC-07..10 | DoD#1 | Exact cases, method rule, canonicalisation, error messages | pass | `equity.test.ts` |
| SPEC-11/12 | DoD#1 | Latency with slack in `npm test`; real targets via `EQUITY_PERF_SCALE=1` | pass | p95 5.3 / 0.24 / 4.9 / 6.3 / 7.6 / 20.5 / 70.8 ms vs targets 15 / 2 / 20 / 15 / 20 / 50 / 80 |
| SPEC-13 | DoD#1 | PRNG and hash reference vectors | pass | `seeded-random.test.ts` |
| SPEC-14 | DoD#2,4,5,8 | lint, typecheck, `npm test`, no network or dynamic-import greps | pass | 19 files, 50 tests; 100% line coverage on both new modules |
| SPEC-15 | DoD#10 | CI run on the branch is `success` | pass after fix | first run 44231570428 timed out on AC#2; run 44233294018 succeeded |
| SPEC-16 | DoD#3,6,7,9,11,12 | Story doc published and linked | done by this document | doc published in Backlog |

- Judge round 1 scored 14 of 16. SPEC-15 failed (CI timeout on AC#2, finding J-1-01) and SPEC-16 was pending (this document). Fix: byte-identical speed-ups (checked with `cmp` on all 121 fixture cases and 8 perf scenarios; AC#2 4.17 to about 3.9 s under coverage, 634 ms without), plus `testTimeout: 30_000` (Q-5). CI then passed.
- Gate glitch: one gate run failed because concurrent Vitest runs (the builder's stop-hook gate and the orchestrator's gate) locked the coverage folder. It was not a code failure. A re-run alone passed. Five gate runs in total (build 1–2, fix 3–5).

## Review
- Round 1: security MAJOR `unbounded-feasibility-backtrack`. The sampled path's full-deal check was an unbounded backtracking search. The reviewer reproduced a hang of over 60 s with 8 broadway-only opponents. Fixed with a 100,000-node cap and an early distinct-card-count check (A-14), plus a regression test that throws `RangeError` in under 2 s. Round 2 confirmed it with adversarial inputs (worst case about 200 ms). Round 3 (the judge-fix commit) was clean.
- Rounds 2 and 3: no BLOCKER or MAJOR findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR `full-ring-perf-headroom-thin`: full-ring flop vs 9 ranges runs at about 70 ms against an 80 ms target (about 12% headroom). The reference-machine command could be flaky on a slower machine.
- MINOR `cap-regression-hangs-instead-of-failing`: if the node cap regressed, the test would hang rather than fail, because the search is synchronous.
- NIT `literal-vs-constant-assertion` (`equity.test.ts:125`): asserts on a literal 191,646.
- NIT `unbounded-range-length`: range length is not capped. Deduplication is O(n), and no untrusted caller exists.
- NIT `dos-bound-omits-feasibility-budget`: spec §5 and §8 do not mention `FEASIBILITY_NODE_LIMIT` or the card-union check.
- NIT `budget-exhaustion-error-message`: budget exhaustion reports "Sampling rejected too many deals" instead of the §5 step 5 message.
- NIT `runout-write-loop-duplicated`: the sampler inlines the same runout loop as `Table.setRunout`.
- NIT `global-timeout-masks-slow-tests`: `testTimeout` applies to every test, so unrelated slow tests no longer fail on time.

## How to try it
- `npm test` (includes coverage) · `npm run lint` · `npm run typecheck`
- Real latency targets: `EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts`
- Regenerate the reference set: `node tools/equity/generate-reference.js`

## Run metrics
Questions asked: 5 (4 design plus 1 escalation) · assumptions logged: 15 · review rounds: 3 · judge rounds: 1 (FAIL, then fixed) · gate runs: 5 · escalations: 1 · send-backs: 1 · changed lines: not recorded in the artifacts (no git diff stat was available to me).

## Known limitations and follow-ups
Not created as tasks (need user approval):
- Update spec §5 and §8 for the feasibility budget when the spec is unlocked.
- Consider a no-validation `evaluate` fast path to speed up equity and the CI tests.
- Full-ring performance headroom is only about 12%.
- The global `testTimeout` trade-off (NIT above): consider scoping it to the slow tests.
- Range notation, weights and range narrowing are out of scope (TASK-7.5, TASK-7.13).

## Lessons for the factory (proposals — not applied)
- Judge verdict files should be idempotent per round, so that re-running a round does not leave stale results.
- The orchestrator's gate should not run concurrently with the builder's stop-hook gate. Concurrent Vitest runs lock the coverage folder and cause false failures.
- Orchestration scripts should commit only after a gate PASS.
- Spec authors should check CI-with-coverage cost for tests that make millions of evaluator calls (an AC#2 timeout was foreseeable from the 8× CI slowdown noted in TASK-1.2). A builder edit to a config file outside the file list was blocked, so list such likely files (for example `vite.config.ts`) up front.
