# Spec: TASK-7.7 — Compute multiway and range-versus-range equity within 1.5 points

Status: READY (approved 2026-11-22)
Task: TASK-7.7 · Parent/epic: TASK-7 · Requirements: REQ-034 (REQ-034.1, REQ-034.2, REQ-034.3) · Dream: limit-holdem-trainer

## 1. Summary
TASK-7.1 built `computeEquity` (exact enumeration or 30,000 seeded samples) and proved it on 120 heads-up preflop
matchups plus one three-way case. This story proves the same calculator on multiway and range-versus-range spots,
on boards of 0, 3, 4 and 5 cards. It adds an offline generator and 120 committed reference cases. Each case records
whether its value is exhaustive or high-sample. An every-push acceptance test checks every player's equity against
its reference within 1.5 points, checks that the two reference sets together hold at least 200 matchups, and checks
that listing the opponents' ranges in a different order gives an identical result. No change to `src/` is expected:
measured accuracy and determinism already come from `src/advice/equity.ts`. This story adds the evidence.

## 2. Scope
- In scope:
  - `tools/equity/generate-multiway-reference.js`: an offline generator (a tool, not a test) with a deterministic,
    seeded case list and an exhaustive or high-sample reference per case. It shares no code with
    `src/advice/equity.ts`.
  - `tests/advice/fixtures/equity-multiway-reference.json`: 120 committed cases, 30 for each board size 0/3/4/5.
  - Every-push acceptance tests for AC#1–AC#3, and a unit test that checks the fixture is consistent and reproducible.
  - Exporting the existing `mulberry32` and `cardText` helpers from `tools/equity/generate-reference.js` so the
    new generator reuses them. Nothing else in that file changes.
- Not doing:
  - No hero-range input. `EquityInput.hero` stays one hand (A-1). No change to the public interface of
    `src/advice/equity.ts`.
  - No change to `SAMPLE_TRIALS`, `EXACT_EVALUATION_LIMIT` or the seeding scheme. `src/advice/equity.ts` changes only if a
    SPEC test below shows a real defect, and the fix must not edit any case or the tolerance.
  - No edits to TASK-7.1's locked tests (`tests/advice/equity.acceptance.test.ts`) or to its fixture
    `tests/advice/fixtures/equity-reference.json`. `tests/advice/equity-reference.test.ts` also stays unchanged.
  - No running of the generator inside `npm test`. No new slow-group test. No UI, bots or engine changes.
  - No dropping, replacing or reseeding of a generated case to make a failing comparison pass.
- Scope budget: files=5, lines=750   (generate-multiway-reference.js ~260, equity-multiway-reference.json ~125,
  equity-multiway.acceptance.test.ts ~220, equity-multiway-reference.test.ts ~120, generate-reference.js +2)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A "range-versus-range" case is hero's known hand against one to four opponents who each hold a range. The test checks every player's equity, so each range-holding opponent's equity is range-versus-range (against the other ranges and hero's hand). No hero-range API is added | yes | REQ-034 says "each hand's equity against one or more ranges" (requirements.md:623). Postflop advice always knows hero's hand (`src/advice/postflop.ts:66`). Adding a hero range would change a public interface outside this story | Add `hero: Range` and average over hero combos (interface change; no caller needs it) |
| A-2 | New, separate generator and fixture files. TASK-7.1's fixture, generator output and tests stay unchanged | yes | `tests/advice/equity-reference.test.ts:48-51` asserts every stored case is `exhaustive` with an empty board, and the locked `equity.acceptance.test.ts` reads that file. Keeping the files apart avoids any cross-story locked-test edit | Append to `equity-reference.json` (breaks 7.1's tests) |
| A-3 | The generator expands range notation with `parseHandRange`, `expandRange` and `unseenCombos` from `src/advice/ranges.ts`, passed in like `evaluate` is. It never imports `src/advice/equity.ts` | yes | TASK-7.1 D-3 requires independence from the *equity* code. Range expansion is not the thing under test, and using one definition keeps the reference and the test on the same combos. Per-opponent live combo counts are stored so they can be reviewed | Write a second range parser in the generator (more code, risk of drifting from the app) |
| A-4 | Reference method rule: exhaustive when (product of live combos) × C(unseen, 5 − board) × players ≤ 100,000,000. Otherwise high-sample with 2,000,000 accepted trials, seeded with mulberry32 per case. Standard error ≤ 0.5/√2,000,000 ≈ 0.035 pp, so reference error is small against 1.5 pp | yes | About 15M evaluations/s (doit/TASK-7.1/spec.md:60), so an exhaustive case takes ≤ ~10 s and a high-sample case ~1–2 s. Generation stays a few minutes | Higher limit (slower generation); 10M trials (5× slower, gain not needed) |
| A-5 | Case mix: for each board size 0, 3, 4, 5, there are 10 seeded-random multiway known-hand cases (3–6 players) and 20 seeded-random range cases (1–4 range opponents from a fixed palette of 6 ranges). Total 120 | yes | 120 ≥ 100 covers every board size evenly. With the 121 heads-up and three-way cases, the total is 241 ≥ 200 | 100 exactly (no margin); hand-picked only (less varied) |
| A-6 | All new reference tests run on every push (in `test:sweeps`, as `*.acceptance.test.ts` and as a unit test). None goes in the slow group | yes | Measured: `computeEquity` takes 0.0–16.4 ms per case (sampled ≤ 16.4 ms with 5 range opponents), so 120 cases plus 120 reordered reruns take ≈ 2–3 s locally. TASK-7.1's 120-case AC#2 took 623 ms. This is correctness, not a speed/scale check | Run a subset every push and the full set opt-in (not needed at this cost) |
| A-7 | Opponents whose ranges become identical after canonicalisation (same live combos, any listing order) can be swapped. Among such opponents, the k-th listed gets the k-th canonical result | yes | Already how `canonicalise` (stable sort, `src/advice/equity.ts:110-111`) and `computeEquity` (`:346-350`) behave. Such opponents cannot be told apart, so the result list is identical | Average equal-range results (changes 7.1 output) |

## 3. Current system
- `src/advice/equity.ts` (TASK-7.1):
  - `computeEquity(input)` (`:340-353`) canonicalises (`:66-117`): it sorts each range's live combos, then sorts the
    opponents by range (`:110-111`), and maps results back to input order (`:346-350`).
  - Exact when `estimateEvaluations` ≤ 200,000 (`:135-140`). Otherwise `sampledEquity` with 30,000 trials. Its seed
    is `fnv1a32(canonicalKey(c))` (`:125-127`), so it depends only on the canonical input, never on the opponents'
    order. **AC#3 therefore already holds on both paths**: this story adds tests, not a redesign.
  - The sampler draws each opponent's combo uniformly and rejects the whole deal on any card clash (`:287-310`).
    That gives every compatible deal equal weight, the same as exact enumeration (`:238-243`), so the two paths
    estimate the same quantity. The reference generator must use the same model.
  - Split pots are counted in integer units of 1/2520 (`SHARE_UNITS`, `:41`).
- Existing tests:
  - `tests/advice/equity.acceptance.test.ts` (locked; 120 HU cases, mw-001, determinism)
  - `tests/advice/equity-reference.test.ts` (fixture consistency, re-enumerates 2 cases)
  - `tests/advice/equity.test.ts:122-195` (exact-path order-independence property, ≤ 3 opponents)
- `tools/equity/generate-reference.js`:
  - `enumerateExact(evaluate, players, board)` (`:28-68`, exported)
  - `cardText` (`:71`) and `mulberry32` (`:79`), not exported
  - `vite` `runnerImport` loads the TS evaluator in `main()` (`:132-143`)
  - Run: `node tools/equity/generate-reference.js`
- `src/advice/ranges.ts`:
  - `parseHandRange(text)` (`:148`) takes whitespace-separated notation such as `TT+ AQs+ AKo`. A comma list throws.
  - `unseenCombos(dead)` (`:266`)
  - `expandRange(classes, dead)` (`:278`)
- Test layout:
  - Vitest (`vite.config.ts:6-20`). `*.acceptance.test.*` runs in `test:sweeps` (CI shards); other tests run in
    `test:unit` (`package.json` scripts). `npm test` runs everything with coverage.
  - The slow group is `TLH_SLOW_TESTS=1` / `test:slow`.
  - `REPO_ROOT` is in `tests/support/sandbox.ts:16`.
- Tooling:
  - `tsconfig.json:18-23` (`allowJs`, `checkJs`, includes `tools`): the generator must typecheck through JSDoc.
  - `.prettierignore` already ignores `tests/advice/fixtures`.
- Existing code to reuse:
  - `tools/equity/generate-reference.js` → `enumerateExact` for runouts of a fixed deal; `mulberry32` and
    `cardText` (add `export`).
  - `src/engine/hand-evaluator.ts` → `evaluate` (generator, through `runnerImport`, as in `generate-reference.js:136`).
  - `src/engine/cards.ts:47` → `parseCards`.
  - `src/advice/ranges.ts` → `parseHandRange`, `expandRange`, `unseenCombos` (A-3).
  - `src/advice/equity.ts` → `computeEquity` (tests only).
  - `tests/advice/equity.acceptance.test.ts:30-37` → the `hole`/`input` helper pattern (copy it; don't import from a
    locked test).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Reference semantics: every compatible opponent deal (one combo per opponent, no shared cards) is equally likely, then every runout. Exhaustive cases enumerate exactly that. High-sample cases use rejection sampling with the same weighting | Weight combos by range frequency; sample runout first | It matches `computeEquity`'s exact and sampled paths (§3), so a difference can only be calculator error | no | n/a |
| D-2 | AC#3 is tested on both paths with distinct ranges: all 6 orders of three distinct ranges (sampled), reversed order for every fixture case with ≥ 2 opponents, and A-7's equal-range swap. No change to seeding | Re-derive the seed per input order (would break AC#3) | The seed and canonical order already ignore input order (§3). Tests make this an enforced contract | no | n/a |

## 5. Design

### Files to create / modify
- `tools/equity/generate-multiway-reference.js` — new offline generator: case list, reference computation, writes fixture.
- `tests/advice/fixtures/equity-multiway-reference.json` — new, generated (120 cases), committed.
- `tests/advice/equity-multiway.acceptance.test.ts` — new; AC#1, AC#2, AC#3 (SPEC-01..04).
- `tests/advice/equity-multiway-reference.test.ts` — new unit test; fixture consistency and reproducibility (SPEC-05).
- `tools/equity/generate-reference.js` — add `export` to `cardText` and `mulberry32`. No behaviour change.

### Components, interfaces and data
Generator exports (JSDoc-typed ES module, no top-level side effects except under the `main` guard as in
`generate-reference.js:182`):
- `export const MULTIWAY_SEED = 20261122;`
- `export const EXHAUSTIVE_LIMIT = 100_000_000;`
- `export const SAMPLE_TRIALS = 2_000_000;`
- `export const RANGE_PALETTE`: exactly these 6 strings, in order:
  1. `'TT+ AQs+ AKo'`
  2. `'any'`
  3. `'77-99 A2s-A5s'`
  4. `'22+ A2s+ K9s+ QTs+ JTs ATo+ KJo+'`
  5. `'KQs QJs JTs T9s 98s 87s'`
  6. `'AA KK AKs'`

  With no dead cards they hold 50 / 1326 / 34 / 226 / 24 / 16 combos.
- `export const MULTIWAY_CASES`: `{ id: string, hero: string, board: string, opponents: string[] }[]`. It is built
  only from `mulberry32(MULTIWAY_SEED)` and card text, with no range expansion (rules 1–3).
- `export function resolveOpponent(text, dead, lib)`: returns `number[][]` (live `[low, high]` combos, ascending).
  `lib` is `{ parseCards, parseHandRange, expandRange, unseenCombos }`.
  - A text matching `/^[2-9TJQKA][cdhs] [2-9TJQKA][cdhs]$/` is one known hand: `[[low, high]]`.
  - `'any'` → `unseenCombos(dead)`.
  - Otherwise → `expandRange(parseHandRange(text), dead)`.
  - `dead` = hero + board cards.
- `export function computeReference(evaluate, hero, board, ranges, options)`. `options` is `{ limit, trials, seed }`.
  It returns `{ method: 'exhaustive' | 'high-sample', trials, win, tie, shareUnits }`. The arrays are indexed
  hero-first, then opponents in listed order. It throws `Error('Opponents cannot all be dealt')` if no compatible
  deal exists.

Fixture `tests/advice/fixtures/equity-multiway-reference.json`, one case per line like the 7.1 fixture:
```
{"generator":"tools/equity/generate-multiway-reference.js","shareUnits":2520,"seed":20261122,
 "exhaustiveLimit":100000000,"sampleTrials":2000000,"cases":[
{"id":"mw-b0-01","hero":"..","board":"","opponents":["..",".."],"combos":[1,1],"method":"exhaustive",
 "seed":null,"trials":N,"win":[..],"tie":[..],"shareUnits":[..],"equity":[..]},
...]}
```
Fixture rules:
- `combos[j]` is opponent j's live combo count.
- `seed` is the per-case sampler seed for `high-sample` and `null` for `exhaustive`.
- `equity[p]` is `round6(shareUnits[p] / (2520 × trials))`.
- Invariant: Σ `shareUnits` = 2520 × `trials`.

### Rules and algorithms
1. **Case order and ids.** Board sizes run in the order 0, 3, 4, 5. For each size there are 10 known-hand cases,
   `mw-b<size>-01`..`10`, then 20 range cases, `rr-b<size>-01`..`20`. One `mulberry32(MULTIWAY_SEED)` stream is
   used for the whole list, in this order.
2. **Known-hand case i (0-based).**
   - players = 3 + (i mod 4), so 3, 4, 5, 6, 3, …
   - Draw 2 × players + size cards by partial Fisher–Yates from a fresh 52-card deck, the same as
     `generate-reference.js:110-114` but with more cards.
   - hero = cards 0–1. Opponent j = the next pair. The board is the last `size` cards.
   - Cards are written with `cardText`, two per hand separated by a space. The board is space-separated (`''` for
     preflop).
3. **Range case i (0-based).**
   - k = 1 + (i mod 4) opponents.
   - Opponent j's text = `RANGE_PALETTE[(i + j) mod 6]`.
   - Draw 2 + size cards as in rule 2: hero = cards 0–1, the board is the rest.
   - Example: `rr-b3-02` (i = 1) has 2 opponents: `'any'` and `'77-99 A2s-A5s'`.
4. **Reference per case (in `main`).**
   - Resolve the ranges (`resolveOpponent`) and set `combos`. If any opponent has 0 live combos, throw
     `Error('<id>: opponent <j+1> has no live combo')`. A generation failure is fixed by the builder; this case is not
     expected with this palette.
   - E = Π combos × C(52 − 2 − size − 2k, 5 − size) × (k + 1).
   - If E ≤ `EXHAUSTIVE_LIMIT`: **exhaustive**. Enumerate every compatible deal in nested order. For each deal, add
     `enumerateExact(evaluate, [hero, ...deal], board)` counts. `trials` is the total number of (deal, runout)
     outcomes.
   - Otherwise: **high-sample**.
     - `rng = mulberry32(seed)` with `seed = (MULTIWAY_SEED + caseIndex + 1) >>> 0`, where caseIndex is 0-based
       across all 120 cases.
     - For each trial, pick each opponent's combo with `floor(rng() × combos)`. If any card clashes, reject the
       whole deal and start again.
     - Then draw 5 − size distinct runout cards uniformly from the cards not yet dealt. Score as in
       `enumerateExact`: one win to a sole best hand, one tie to each of several best hands, and 2520 / (number of
       best hands) share units to each.
     - Stop at `SAMPLE_TRIALS` accepted trials.
     - If 1,000 × `SAMPLE_TRIALS` deals are rejected, throw `Error('<id>: too many rejected deals')`.
   - Known-hand cases always come out exhaustive (Π combos = 1). Preflop range cases come out high-sample.
5. **Output.** Print one progress line per case (`<id> <method> <trials>`), write the fixture, and print
   `wrote 120 cases to tests/advice/fixtures/equity-multiway-reference.json`.
   - Run: `node tools/equity/generate-multiway-reference.js`.
   - Expected: a few minutes. Record the measured time in the build log.
6. **Comparison (tests).**
   - Expected per player = `shareUnits[p] / (2520 × trials)`, unrounded.
   - Computed = `computeEquity({hero, board, opponents: ranges}).hero.equity` for p = 0, and `.opponents[p−1].equity`
     otherwise.
   - Pass when |computed − expected| ≤ 0.015 for every player of every case.
7. **Order independence (A-7).** Given a permutation π of the opponents, `computeEquity` of the permuted input
   returns the same `hero`, `method` and `trials`. Its `opponents[j]` deep-equals the original
   `opponents[π(j)]`, bit for bit (`toStrictEqual`). Opponents with equal canonical ranges follow A-7.

### Error handling and configuration
- The generator fails loudly (non-zero exit) with the messages in rules 3–4 and in `computeReference`. No CLI
  flags; constants live in the module.
- Tests read the fixture with `readFileSync(join(REPO_ROOT, …))`. A missing or ill-formed fixture fails the test.

## 6. Behaviour specification

### SPEC-01: Every multiway and range case is within 1.5 points of its offline reference
- Verifies: AC#1, DoD#1
- Behaviour: Given the stored multiway fixture, When every case runs through `computeEquity`, Then every player is within 1.5 points of the reference. In detail:
  - Given `tests/advice/fixtures/equity-multiway-reference.json`:
    - It has ≥ 100 cases, exactly 30 for each board length 0, 3, 4 and 5.
    - Each board length has ≥ 20 cases whose `opponents` include a non-hand range, and ≥ 1 case with ≥ 2 range
      opponents.
    - Every case has ≥ 2 opponents or ≥ 1 range opponent.
  - When each case's opponents are resolved to combos (with `src/advice/ranges.ts`, as in `resolveOpponent`) and
    passed to `computeEquity` in fixture order,
  - Then each resolved range's length equals `combos[j]`, and for every player (hero and each opponent)
    |computed − reference| ≤ 0.015 (rule 6).
  - The test logs `AC#1: <n> cases, largest error <x> pp (<id>)`.
- Verification: acceptance `tests/advice/equity-multiway.acceptance.test.ts::AC#1 every multiway and range case is within 1.5 points of its reference`

### SPEC-02: The two reference sets hold at least 200 matchups, each with its method recorded
- Verifies: AC#2, DoD#1
- Behaviour: Given both reference sets, When the suite loads them, Then they hold ≥ 200 matchups, each with its method. In detail:
  - Given `equity-reference.json` (TASK-7.1) and `equity-multiway-reference.json`, When both are loaded:
  - The combined case count is ≥ 200 (expected 241).
  - Ids are unique across both files.
  - Every case's `method` is `'exhaustive'` or `'high-sample'`.
  - Every `high-sample` case has `trials` ≥ 2,000,000 and an integer `seed`.
  - The multiway file contains ≥ 1 case of each method.
- Verification: acceptance `tests/advice/equity-multiway.acceptance.test.ts::AC#2 at least 200 matchups and each records exhaustive or high-sample`

### SPEC-03: Listing the ranges in a different order gives an identical result
- Verifies: AC#3, DoD#1
- Behaviour: Given distinct ranges in any order, When equity is computed, Then the result is identical. In detail:
  - (a) Given hero `Ah Kh`, preflop, with opponents `'TT+ AQs+ AKo'`, `'any'`, `'77-99 A2s-A5s'` (expanded with
    `ranges.ts`), When `computeEquity` runs on all 6 orders of those opponents, Then each call has
    `method === 'sampled'`, and the results are identical under rule 7.
  - (b) The same for board `Qh 7h 2c`.
  - (c) Given every fixture case with ≥ 2 opponents, When the opponents are reversed, Then the result is identical
    under rule 7.
- Verification: acceptance `tests/advice/equity-multiway.acceptance.test.ts::AC#3 the same ranges in a different order give an identical result`

### SPEC-04: Opponents with equal ranges can be swapped
- Verifies: AC#3
- Behaviour: Given two opponents with the same range, When they are swapped, Then the result is identical. In detail:
  - Given hero `Ah Kh`, board `Qh 7h 2c`, range X = `'TT+ AQs+ AKo'` expanded, X′ = X reversed with each combo's
    cards swapped, and Y = `'any'`,
  - When `computeEquity` runs on `[X, Y, X′]` and on `[X′, Y, X]`,
  - Then both are sampled, and the two results are `toStrictEqual` position by position (A-7).
- Verification: acceptance `tests/advice/equity-multiway.acceptance.test.ts::AC#3 opponents holding the same range can be swapped`

### SPEC-05: The multiway fixture is consistent and reproducible from the generator
- Verifies: AC#2, DoD#1
- Behaviour: Given the committed fixture, When it is checked against the generator, Then it is consistent and reproducible. In detail:
  - Given the fixture, Then:
    - its header is `generator: 'tools/equity/generate-multiway-reference.js'`, `shareUnits: 2520`,
      `seed: 20261122`, `exhaustiveLimit: 100000000`, `sampleTrials: 2000000`.
    - `{id, hero, board, opponents}` of every case equals `MULTIWAY_CASES` in order.
    - For every case: Σ `shareUnits` = 2520 × `trials`; `win[p] + tie[p]` ≤ `trials`;
      `equity[p] = round6(shareUnits[p]/(2520×trials))`; `seed` is `null` exactly when `method` is `exhaustive`.
    - Every `mw-*` case is `exhaustive`.
  - When `computeReference` is re-run for `mw-b5-01` and for the `exhaustive` `rr-*` case with the smallest
    estimate, Then its `{method, trials, win, tie, shareUnits}` equal the stored values exactly.
  - Also: `resolveOpponent('Jd Jc', …)` returns one combo, `'any'` with 7 dead cards returns 990 combos, and
    `RANGE_PALETTE` has the 6 entries above.
- Verification: unit `tests/advice/equity-multiway-reference.test.ts::multiway reference set is consistent and matches the generator` (timeout 60 s)

### SPEC-06: Checks, coverage, boundaries, offline
- Verifies: DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When the project checks run, Then they all pass. In detail:
  - `npm run lint`, `npm run typecheck` and `npm test` exit 0. Coverage thresholds hold (≥ 90% lines on
    `src/{engine,bots,advice,…}`, ≥ 70% overall; `vite.config.ts:16-19`).
  - `src/advice` and `src/engine` gain no new imports.
  - The generator and tests make no network requests: no `fetch`/`http` imports in the new files.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -nE "fetch|XMLHttpRequest|WebSocket|from 'node:(http|https|net)'" tools/equity/generate-multiway-reference.js tests/advice/equity-multiway*.ts`

### SPEC-07: Playtest, CI and non-applicable items, story documentation
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the story branch, When the process checks run, Then they pass or are N/A. In detail:
  - DoD#6: `npm run playtest -- --hands 10000 --seed 42` reports zero invariant violations. CI runs it on every
    push (`.github/workflows/ci.yml:110`).
  - DoD#10: CI is green on `doit/TASK-7.7`.
  - DoD#11: a TASK-7.7 story doc is published to Backlog.md.
  - N/A items:
    - DoD#3: the golden-spot suites arrive in TASK-7.11/7.14.
    - DoD#7 and DoD#12: no screen or dialog changes.
    - DoD#9: the palette ranges are test data, not strategy content shown to users.
- Verification: manual `npm run playtest -- --hands 10000 --seed 42` exits 0; `gh run list --branch doit/TASK-7.7 --limit 1` shows success; `backlog doc list --plain | grep TASK-7.7` lists the story doc

## 7. Edge cases
- Boards of 0, 3, 4 and 5 cards: SPEC-01 (30 cases each). Other board sizes are rejected by `computeEquity`
  (TASK-7.1 SPEC-10), so N/A here.
- Range clashes with hero or board cards are removed before counting: SPEC-01 checks `combos`, and SPEC-05 checks
  `'any'` = 990.
- Opponent ranges overlapping each other (e.g. `'any'` with `'TT+ …'`): handled by rejection, D-1, SPEC-01/03.
- An empty live range or impossible deal: the generator throws (rule 4). Not expected with this palette.
- Ties and split pots (multiway, board plays on the river): counted in share units, SPEC-05 invariant.
- Equal canonical ranges: SPEC-04.
- Exact versus sampled paths: SPEC-01 covers both (river and small cases exact, preflop ranges sampled), and
  SPEC-03 (c) covers both.
- Concurrency, permissions, interruption: N/A (pure functions and an offline script).

## 8. Security considerations
- No trust boundary: inputs are committed constants and a committed fixture. No user input, secrets or network.
- Randomness is test-reference sampling only (mulberry32, seeded and reproducible). Fairness does not depend on it,
  so no CSPRNG is needed. No new dependencies.

## 9. Non-functional
- Every-push cost:
  - Measured on the reference machine: `computeEquity` takes 0.0–16.4 ms per multiway or range case (A-6).
  - Target: `equity-multiway.acceptance.test.ts` finishes in ≤ 5 s locally and ≤ 15 s on CI with coverage. Each
    test keeps the default 30 s timeout; the AC#3 test sets 60 s.
  - `equity-multiway-reference.test.ts` ≤ 60 s timeout, ≤ 5 s expected.
  - The builder records measured durations in the build log.
- Generation: offline, a few minutes. Not part of any test script.
- Accuracy margin:
  - Calculator standard error is ≤ 0.29 pp at 30,000 trials; reference standard error is ≤ 0.035 pp.
  - The 1.5 pp tolerance is about 5 calculator standard errors. Results are deterministic, so pass/fail is fixed.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/equity/generate-multiway-reference.js` (regenerates the fixture; `git diff --exit-code tests/advice/fixtures/equity-multiway-reference.json` then shows it is reproducible), and `npx vitest run tests/advice/equity-multiway.acceptance.test.ts tests/advice/equity-multiway-reference.test.ts`
- New tests:
  - `tests/advice/equity-multiway.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `tests/advice/equity-multiway-reference.test.ts` → SPEC-05
- End-to-end for the Judge:
  1. Run the generator and confirm the fixture is unchanged (`git diff --exit-code`).
  2. Run the two test files and read the `AC#1` largest-error log line (expected < 1.5 pp).
  3. Run `npm test`.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-7.7/qa.md`.
