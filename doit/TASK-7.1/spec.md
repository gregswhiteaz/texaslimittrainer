# Spec: TASK-7.1 — Compute a hand's equity against opponent hands

Status: READY (approved 2026-11-17)
Task: TASK-7.1 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-034.1, REQ-034.2 (three-way AC only), REQ-034.3 (feeds REQ-033, REQ-036, REQ-055.1, REQ-055.3) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the equity calculator, the first code in `src/advice/`. Given the hero's two cards, a board of 0, 3,
4 or 5 cards, and 1 to 9 opponents (each a known hand or a list of possible hands), it returns each player's chance
of winning, chance of tying and pot share (equity, with split pots counted as shares). It enumerates every outcome
exactly when that is cheap. Otherwise it uses a sampler whose seed comes only from the canonicalised input, so the
same input always gives the same numbers. Tests check the results against a committed reference set of at least 100
heads-up preflop matchups computed by exhaustive enumeration, plus the three-way AA vs KK vs QQ case.

## 2. Scope
- In scope:
  - `src/advice/equity.ts`: public types and `computeEquity`, input validation, canonicalisation, exact enumeration,
    seeded sampling, and the rule that picks between them.
  - `src/engine/seeded-random.ts` (A-11): an FNV-1a string hash, SplitMix32 and xoshiro128**. No `Math.random`, no clock.
  - `tools/equity/generate-reference.js`: an offline generator that computes the reference set by exhaustive
    enumeration. It uses only `evaluate` from `src/engine/hand-evaluator.ts` and none of the equity module.
  - `tests/advice/fixtures/equity-reference.json`: the committed reference set (≥ 100 heads-up preflop matchups plus
    one three-way case).
  - Acceptance, unit and performance tests under `tests/advice/`.
- Not doing:
  - Range notation (`"QQ+, AKs"`), weighted combos, default ranges, range narrowing and observed-stat scaling
    (E07-S07 TASK-7.5, E07-S09 TASK-7.13). In this task a range is just a list of specific two-card combos (D-1).
  - The multiway and range-versus-range reference set and the 200-matchup total (E07-S06, TASK-7.7). This task adds
    only the one three-way case that AC#3 needs. Its fixture schema is designed so TASK-7.7 can add to it.
  - Running equity in a Web Worker (REQ-055.6), caching or memoising results, and any advice rule, pot odds or
    display rounding (E07-S03, TASK-7.3).
  - Dead cards other than the hero's cards and the board (for example folded or burned cards).
  - Speed-ups such as suit isomorphism or precomputed preflop tables.
  - An npm script for the generator, a new dependency, and any change to `src/engine/` or `src/ui/`.
- Scope budget: files=10, lines=1400   (equity.ts ~320, seeded-random.ts ~60, generate-reference.js ~170, equity-reference.json ~125, .prettierignore +1, equity.acceptance.test.ts ~220, equity.test.ts ~230, seeded-random.test.ts ~60, equity.perf.test.ts ~90, equity-reference.test.ts ~70)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Two source modules, `src/advice/equity.ts` and `src/engine/seeded-random.ts` (A-11). Equity tests go in a new `tests/advice/` folder, PRNG tests in `tests/engine/` | yes | Follows TASK-1.2 A-1 (tests in `tests/**`) | One module; colocated tests |
| A-2 | Results are fractions from 0 to 1, not percentages. Callers round for display | yes | Avoids rounding inside the calculator. TASK-7.3 shows one decimal place | Percentages 0–100 |
| A-3 | Split pots are counted in integer units of 1/2520 of a trial (2520 = LCM of 1..10, the largest possible split). Equity = units ÷ (2520 × trials) | yes | Integer sums are exact and independent of summation order, so results match to the last digit on every engine | Float sums of 1/k |
| A-4 | A combo that uses a hero or board card is silently dropped from a range, and a combo listed twice counts once | yes | Standard range behaviour, and later range code can pass "all combos" without filtering first. A fixed opponent hand that clashes with the hero or board is an error because its range then becomes empty | Error on any clash; keep duplicates as weights |
| A-5 | Opponents are canonicalised too (sorted by their combo lists), and results are mapped back to input order | yes | The task asks for canonical input before seeding. It also makes TASK-7.7 AC#3 (order of ranges does not matter) true from the start at almost no cost | Canonicalise only cards and combos |
| A-6 | Invalid input throws `RangeError` with the exact messages in §5 | yes | Same convention as the evaluator (TASK-1.2 A-3) | Result object with an error field |
| A-7 | The fixture folder `tests/advice/fixtures/` is added to `.prettierignore` and the generator writes one case per line | yes | Generated data should not be reformatted. Prettier would expand about 125 lines into about 1,100 | Run prettier on the output |
| A-8 | `npm test` includes a timing check with a slack factor (default 20× the targets in §9). The real targets are checked by a command on the reference machine (SPEC-12) | yes | Same approach as TASK-1.2 A-6. CI with coverage ran the evaluator about 8× slower than the reference machine (doit/TASK-1.2/story-doc.md SPEC-11 row) | No timing in `npm test` |
| A-9 | The fresh-process check (AC#4) starts `node` with Vite's `runnerImport` to load `src/advice/equity.ts` directly | yes | No new dependency. It loads the TS sources with extensionless imports in about 0.2 s (tried locally on `src/engine/hand-evaluator.ts`) | Spawn a second Vitest run |
| A-10 | Up to 9 opponents (10 players, the full-ring maximum) | yes | Largest table in the requirements is full ring. Also bounds the work per call | No upper limit |
| A-11 | (Orchestrator decision, told to the user in qa.md Q-2) The seeded PRNG lives in `src/engine/seeded-random.ts`, not `src/advice/`. `equity.ts` imports it from `../engine/seeded-random`. Same headless lint and ≥ 90% coverage rules apply to `src/engine/**` | yes | TASK-1.3 (shuffle) can reuse it without the engine importing from advice | Keep it in `src/advice/` |

## 3. Current system
- `src/advice/` does not exist yet. It is already listed as a headless folder: `HEADLESS_DIRS = ['engine', 'bots',
  'advice', 'stats']` (`tools/lint/headless-boundary.js:6`), applied in `eslint.config.js:27`. Coverage needs
  ≥ 90% lines for `src/{engine,bots,advice,stats}/**` and ≥ 70% overall (`vite.config.ts:15`).
- Cards: `Card` = integer 0–51, `rank * 4 + suit` (`src/engine/cards.ts:1-2`). `parseCards('Ah As')` gives an array
  (`src/engine/cards.ts:39-42`). `formatCard` gives `'As'` and throws on invalid input (`src/engine/cards.ts:44-49`).
- Evaluator: `evaluate(cards: readonly Card[]): HandRank` for 5–7 distinct cards. Higher is stronger, equal ties
  (`src/engine/hand-evaluator.ts:168`). It validates every call and allocates nothing per call, using module scratch
  arrays (`src/engine/hand-evaluator.ts:162-197`). So the equity loops can reuse one 7-element array per player.
- Measured speed (doit/TASK-1.2/story-doc.md, SPEC-11/12 rows): about 15–16M evaluations/s on the reference machine
  without coverage, and 1.87M/s on CI with coverage. A local trial of exhaustive heads-up preflop enumeration
  (1,712,304 boards, 2 evaluations each) took 205–300 ms on the reference machine. That is too slow for a 100 ms bot
  decision, so preflop needs sampling (D-2).
- Tests: Vitest discovers `tests/**/*.test.{ts,tsx}` in the `node` environment (`vite.config.ts:7-8`). `npm test` =
  `vitest run --coverage` (`package.json:12`). Lint = ESLint `--max-warnings 0` then `prettier --check .`
  (`package.json:14`). TypeScript is strict with `noUncheckedIndexedAccess` (`tsconfig.json:9-10`), and
  typescript-eslint `strict` forbids `!` (`eslint.config.js:24`). `tools/**` is type-checked as JS
  (`tsconfig.json:16,23`). Tests already import JS from `tools/` (`tests/toolchain/boundary.test.ts:2`).
- `tests/support/sandbox.ts:15` exports `REPO_ROOT`. Use it to build absolute paths in the fresh-process test.
- Existing code to reuse:
  - `src/engine/hand-evaluator.ts` → `evaluate` for every showdown. Do not write a second evaluator.
  - `src/engine/cards.ts` → `Card`, `formatCard` (error messages), `parseCards` (tests and fixture parsing).
  - `tests/support/sandbox.ts` → `REPO_ROOT`.
  - `fast-check` (devDependency, `package.json:41`) → property tests for canonicalisation.
  - Vite's `runnerImport` (already installed with `vite` 8.3.8) → fresh-process test (A-9) and generator CLI.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Public interface of `src/advice/equity.ts` as in §5 "Components": `computeEquity({ hero, board, opponents })`. Every opponent is a `Range` (a list of specific combos), and a known hand is a one-combo range. Returns `{ hero, opponents, method, trials }` with `win`/`tie`/`equity` fractions per player. | (b) a tagged union `{ hand } \| { range }`; (c) weighted combos `{ combo, weight }`; (d) percentages instead of fractions | Every advice rule, the bots and the hint card call this. A one-combo range covers "hand" with one code path. Nothing in REQ-035 needs weights | yes | user (Q-1) |
| D-2 | Seeded sampler and method rule (§5 "Rules"): exact enumeration when the estimated work is ≤ 200,000 evaluations; otherwise 30,000 sampled trials. The seed is the FNV-1a 32-bit hash of the canonical input key; SplitMix32 expands it into xoshiro128** state. | (b) mulberry32 (already in a test, `tests/engine/hand-evaluator.perf.test.ts:9`) with a 32-bit state; (c) more trials (100,000: σ ≈ 0.16 pp, about 3× slower); (d) always exact (fails the 100 ms bot budget preflop) | 30,000 trials gives a standard error ≤ 0.29 pp, so 1.5 pp is more than 5 standard errors. HU preflop costs about 5 ms on the reference machine | yes | user (Q-2) |
| D-3 | Reference set: 121 cases (20 hand-picked + 100 seeded-random heads-up preflop matchups, plus AA vs KK vs QQ), computed offline by exhaustive enumeration in `tools/equity/generate-reference.js`, which uses only `evaluate`. The integer counts are committed in `tests/advice/fixtures/equity-reference.json`. `npm test` re-enumerates 2 cases to prove the file matches the generator. External anchors: AsAh vs KsKd = 81.946% (the published 81.95%), AsKs vs QhQd = 46.214% (the story's 46.2%). | (b) enumerate all cases inside `npm test` (about 3–4 min on CI with coverage); (c) values typed in from published tables (no exact source for 100 specific-suit matchups); (d) generate on the fly without committing | Fast CI, reviewable data, and regeneration is one command. The circularity (our evaluator makes the reference) is limited because the evaluator was checked against an independent oracle on all 2,598,960 five-card hands (TASK-1.2 SPEC-01), and the generator shares no code with the equity module | yes | user (Q-3) |
| D-4 | Latency targets in §9 (worst case 80 ms at 10 players, HU preflop ≤ 15 ms p95 on the reference machine), checked by a perf test with a CI slack factor and a reference-machine command. | (b) one bound for all calls (≤ 100 ms); (c) no automated timing, manual only | Keeps every call inside the 100 ms bot budget (REQ-055.3) with room for the rest of the decision, without a flaky CI timing test | yes | user (Q-4) |
| D-5 | Fresh-process determinism is tested by spawning `node` with Vite `runnerImport` (A-9) | Spawn Vitest again | Fast and uses what is installed | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/equity.ts` — new: types, `computeEquity`, validation, canonicalisation, exact and sampled engines
- `src/engine/seeded-random.ts` — new (A-11): `fnv1a32`, `splitMix32`, `Xoshiro128` (seeded PRNG)
- `tools/equity/generate-reference.js` — new: offline exhaustive generator (exports `enumerateExact`, `REFERENCE_MATCHUPS`; CLI writes the fixture)
- `tests/advice/fixtures/equity-reference.json` — new: generated reference set (committed)
- `.prettierignore` — modify: add `tests/advice/fixtures` (A-7)
- `tests/advice/equity.acceptance.test.ts` — new: AC#1–AC#5 (locked)
- `tests/advice/equity-reference.test.ts` — new: fixture integrity and 2-case exact re-enumeration
- `tests/advice/equity.test.ts` — new: unit tests (validation, canonicalisation, method rule, exact engine, sampler)
- `tests/engine/seeded-random.test.ts` — new: PRNG and hash test vectors
- `tests/advice/equity.perf.test.ts` — new: latency suite with env-configurable slack

### Components, interfaces and data
`src/advice/equity.ts` (approved Q-1):
```ts
import type { Card } from '../engine/cards';
/** Two distinct cards. Order does not matter. */
export type HoleCards = readonly [Card, Card];
/** The hands an opponent might hold, all equally likely. A known hand is a one-combo range. */
export type Range = readonly HoleCards[];
export interface EquityInput {
  readonly hero: HoleCards;
  /** 0, 3, 4 or 5 cards. Order does not matter. */
  readonly board: readonly Card[];
  /** 1 to 9 opponents. */
  readonly opponents: readonly Range[];
}
export interface PlayerEquity {
  /** Fraction of trials this player wins alone. */
  readonly win: number;
  /** Fraction of trials this player ties for the best hand with one or more others. */
  readonly tie: number;
  /** Pot share: win + sum over ties of 1 / (number of tied players). 0..1. */
  readonly equity: number;
}
export interface EquityResult {
  readonly hero: PlayerEquity;
  /** Same order as input.opponents. */
  readonly opponents: readonly PlayerEquity[];
  readonly method: 'exact' | 'sampled';
  /** Exact: number of (opponent deal, runout) outcomes enumerated. Sampled: accepted trials (30,000). */
  readonly trials: number;
}
export function computeEquity(input: EquityInput): EquityResult;

// Internal (exported for tests only, marked @internal):
export const SAMPLE_TRIALS = 30_000;
export const EXACT_EVALUATION_LIMIT = 200_000;
export const MAX_OPPONENTS = 9;
export const SHARE_UNITS = 2520;
export interface CanonicalInput { hero: HoleCards; board: Card[]; opponents: HoleCards[][]; order: number[] }
export function canonicalise(input: EquityInput): CanonicalInput;   // validates; throws RangeError
export function canonicalKey(c: CanonicalInput): string;
export function deriveSeed(c: CanonicalInput): number;               // fnv1a32(canonicalKey(c))
export function estimateEvaluations(c: CanonicalInput): number;
export function exactEquity(c: CanonicalInput): EquityResult;        // results in canonical opponent order
export function sampledEquity(c: CanonicalInput, trials: number, maxRejections = 100 * trials): EquityResult;
```
`order[i]` is the input index of canonical opponent `i`. `computeEquity` = canonicalise, then pick a method (rule 3),
then map the results back to input order.

`src/engine/seeded-random.ts` (approved Q-2; location per A-11):
```ts
export function fnv1a32(text: string): number;          // over UTF-16 code units (keys are ASCII); unsigned 32-bit
export function splitMix32(seed: number): () => number; // unsigned 32-bit outputs
export class Xoshiro128 {
  constructor(seed: number);                             // state = 4 outputs of splitMix32(seed)
  static fromState(s0: number, s1: number, s2: number, s3: number): Xoshiro128; // for test vectors
  nextUint32(): number;
  /** Integer in [0, n): Math.floor(nextUint32() * n / 2^32). n is 1..2^31. */
  nextInt(n: number): number;
}
```

`tools/equity/generate-reference.js` (ESM, JSDoc-typed, checked by `tsc` through `checkJs`):
- `export function enumerateExact(evaluate, players, board)`: `players` is an array of `Card[2]`, `board` is `Card[]`.
  Enumerates every runout in nested index order and returns `{ trials, win: number[], tie: number[], shareUnits:
  number[] }` (integers; one unit = 1/2520 of a trial). It shares no code with `src/advice/`.
- `export const REFERENCE_MATCHUPS`: the case list (D-3, rule 6).
- When run as `node tools/equity/generate-reference.js`, it loads `evaluate` and `parseCards` through Vite
  `runnerImport`, enumerates every case and writes the fixture. Expected run time is about 40 s on the reference
  machine.

Fixture `tests/advice/fixtures/equity-reference.json`, one case per line:
```json
{"generator":"tools/equity/generate-reference.js","shareUnits":2520,"cases":[
{"id":"hu-001","players":["Ah As","Kd Kc"],"board":"","method":"exhaustive","trials":1712304,"win":[1388072,317694],"tie":[6538,6538],"shareUnits":[...],"equity":[0.812554,0.187446]},
...
]}
```
`equity` is `shareUnits / (2520 × trials)` rounded to 6 decimals, for human readers. Tests use the integers.
`method` is always `"exhaustive"` in this task. TASK-7.7 adds `"high-sample"` cases.

Invariants:
- `computeEquity` is pure. It reads no clock, no `Math.random`, no `crypto` and no global mutable state (scratch
  arrays are reset per call).
- Each player's `shareUnits` sum to `2520 × trials`, so the equities add up to 1 (within 1e-12 in floating point).
- `win + tie ≤ 1` for each player. `hero.equity ≥ hero.win`.

### Rules and algorithms
1. Validation, in this order (messages in "Error handling"):
   hero has exactly 2 entries; board length is 0, 3, 4 or 5; opponents length is 1..9; every hero and board card is
   an integer 0–51; no card repeats among hero and board; every combo has 2 integer cards 0–51 that differ.
2. Canonicalisation:
   - Hero: the two cards sorted ascending. Board: sorted ascending.
   - For each opponent range: sort each combo's two cards ascending; drop combos that use a hero or board card (A-4);
     drop duplicates; sort combos by (low card, high card). An empty result is an error.
   - Opponents are stable-sorted by their combo lists compared element by element (shorter list first when one is a
     prefix). `order` records the input positions.
   - Key: `equity-v1|h:<h1>,<h2>|b:<b1>,...|o:<l>,<h>;<l>,<h>/<l>,<h>;...` with cards as decimal integers, `;`
     between combos and `/` between opponents. Example: hero `As Ks` (51, 47), board empty, one opponent `Qh Qd`
     (42, 41) gives `equity-v1|h:47,51|b:|o:41,42`.
3. Method choice: let k = number of opponents, n_i = combos left in opponent i's range, unseen = 52 − 2 − board − 2k,
   need = 5 − board. `estimateEvaluations` = (n_1 × … × n_k) × C(unseen, need) × (k + 1). If it is ≤ 200,000 the method
   is `exact`, otherwise `sampled` with 30,000 trials. Examples:
   - HU preflop hand vs hand: 1 × C(48,5) × 2 = 3,424,608 → sampled.
   - HU flop hand vs hand: 1 × C(45,2) × 2 = 1,980 → exact.
   - HU flop vs every unseen combo (1,081): 1,081 × 990 × 2 = 2,140,380 → sampled.
   - HU turn vs every unseen combo (1,035): 1,035 × 44 × 2 = 91,080 → exact.
   - HU river vs every unseen combo: 1,035 × 1 × 2 = 2,070 → exact.
   - Three-way preflop AA vs KK vs QQ: 1 × 1 × C(46,5) × 3 = 4,112,262 → sampled.
4. Exact engine: backtrack over canonical opponents in order, choosing each live combo whose cards are not yet
   dealt. For each complete deal, enumerate every `need`-card subset of the remaining deck. For each outcome,
   evaluate every player's 7 cards (reusing one scratch array per player), find the best rank, and count it: if one
   player has it, `win += 1`; otherwise each of the t tied players gets `tie += 1`; each best player gets
   `2520 / t` share units. `trials` is the number of outcomes. If no complete deal exists, throw the
   "cannot all be dealt" error.
5. Sampled engine: `rng = new Xoshiro128(deriveSeed(c))`. Before sampling, check with the same backtracking that at
   least one complete deal exists (else the same error). Then, until 30,000 trials are accepted:
   a. Mark hero and board cards as dealt.
   b. For each canonical opponent in order: `combo = range[rng.nextInt(range.length)]`. If either card is dealt,
      reject the whole trial (unmark the opponent cards and start again at b). Otherwise mark it.
   c. Draw `need` board cards: repeat `card = rng.nextInt(52)` until it is not dealt, then mark it.
   d. Score as in rule 4.
   If rejected trials exceed `maxRejections` (default 100 × trials), throw the "too many rejected deals" error. Rejecting the whole deal (not
   redrawing only the clashing opponent) keeps every valid deal equally likely, which matches the exact engine.
   Worked example: AsKs vs QhQd preflop is sampled; its result is within 1.5 pp of the stored exact 46.214%.
6. Reference set (D-3):
   - 20 hand-picked heads-up preflop cases, ids `hu-001`..`hu-020`, in this order: `Ah As`/`Kd Kc`;
     `As Ah`/`Ks Kd`; `Ah Ad`/`Kh Kd`; `As Ks`/`Qh Qd`; `As Ks`/`Qs Qh`; `Ah Kd`/`Qs Qc`; `Ah Kd`/`2s 2c`;
     `Ah Kd`/`As Qc`; `Ks Kh`/`Ad Kc`; `Ah As`/`7d 2c`; `Ah Kh`/`7s 2d`; `Jh Th`/`As Kd`; `8s 7s`/`Ah Ad`;
     `5d 4d`/`Ks Kc`; `2h 2d`/`3s 3c`; `Qs Js`/`Jh Td`; `Ah Qh`/`Ks Kd`; `Td 9d`/`9s 8s`; `Ts Th`/`Ad Kc`;
     `6c 6d`/`As Ks`.
   - 100 random heads-up preflop cases, ids `hu-021`..`hu-120`: 4 distinct cards per case from mulberry32 seeded with
     `20261117` (partial Fisher–Yates over the 52 cards), skipping any matchup already in the list.
   - One three-way case, id `mw-001`: `Ah As`/`Kd Kc`/`Qh Qc`, board empty.
   - Values already computed with this design on the reference machine (the fixture must reproduce them):
     `hu-001` trials 1,712,304, win 1,388,072 / 317,694, tie 6,538 → 81.255% / 18.745%; `hu-002` 81.946%;
     `hu-003` 82.637%; `hu-004` win 787,966 / 917,606, tie 6,732 → 46.214%; `hu-005` 45.883%; `hu-011` 69.303%;
     `mw-001` trials 1,370,754, win 914,778 / 251,982 / 198,545 → 66.868% / 18.515% / 14.617%.

### Error handling and configuration
All errors are `RangeError`. `<i>` is the 1-based input position of the opponent. Messages are exact:
- Hero not 2 cards: `Hero must have 2 cards, got <n>`
- Board size: `Board must have 0, 3, 4 or 5 cards, got <n>`
- Opponent count: `Expected 1 to 9 opponents, got <n>`
- Hero or board card not an integer 0–51: `Invalid card: <String(value)>`
- Repeated card among hero and board: `Duplicate card: <formatCard(card)>` (e.g. `Duplicate card: As`)
- Bad combo: `Opponent <i> has an invalid combo: <String(a)>,<String(b)>` (wrong length, invalid card, or the same card twice)
- Range empty after removing combos that use hero or board cards: `Opponent <i> has no possible hand`
- No way to deal all opponents at once: `Opponents' hands cannot all be dealt together`
- Sampler rejection cap: `Sampling rejected too many deals`

Configuration: none at runtime. The constants in "Components" are fixed. Test-only environment variables:
`EQUITY_PERF_SCALE` (default 20, see SPEC-11/12) and none for the other tests.

## 6. Behaviour specification

### SPEC-01: Published heads-up anchors
- Verifies: AC#1, DoD#1
- Behaviour: Given hero `Ah As` vs opponent `[[Kd, Kc]]` on an empty board, When `computeEquity` runs, Then `method` is `'sampled'`, `trials` is 30,000 and `hero.equity` is within 0.015 of 0.819 and `opponents[0].equity` within 0.015 of 0.181. Given hero `As Ks` vs `[[Qh, Qd]]` preflop, Then `hero.equity` is within 0.015 of 0.462. Given hero `As Ah` vs `[[Ks, Kd]]`, Then `hero.equity` is within 0.015 of 0.8195. In every case `hero.equity + opponents[0].equity` is within 1e-12 of 1.
- Verification: acceptance `tests/advice/equity.acceptance.test.ts::AC#1 AA vs KK and AKs vs QQ match published values`

### SPEC-02: Every stored heads-up matchup is within 1.5 points
- Verifies: AC#2, DoD#1
- Behaviour: Given `tests/advice/fixtures/equity-reference.json`, When the suite loads it, Then it holds ≥ 100 cases with 2 players, an empty board and `method` `"exhaustive"`, all with distinct unordered player pairs. When `computeEquity` runs on each (hero = first player, one opponent = second player as a one-combo range), Then for both players |computed equity − shareUnits ÷ (2520 × trials)| ≤ 0.015. The test reports the largest error seen.
- Verification: acceptance `tests/advice/equity.acceptance.test.ts::AC#2 every stored heads-up preflop matchup is within 1.5 points`

### SPEC-03: Reference set is internally consistent and reproducible
- Verifies: AC#2
- Behaviour: Given the fixture, Then every heads-up case has `trials` = 1,712,304 and every 3-player preflop case 1,370,754; each player's `win + tie ≤ trials`; the players' `shareUnits` sum to `2520 × trials`; `equity[j]` equals `shareUnits[j] / (2520 × trials)` rounded to 6 decimals; the case ids and player lists equal `REFERENCE_MATCHUPS`; `hu-001`, `hu-004` and `mw-001` hold the values in §5 rule 6. When `enumerateExact(evaluate, …)` re-runs `hu-002` and `hu-004`, Then its integer counts equal the stored ones exactly.
- Verification: unit `tests/advice/equity-reference.test.ts::reference set is consistent and matches the generator` (timeout 60 s)

### SPEC-04: Three-way preflop AA vs KK vs QQ
- Verifies: AC#3, DoD#1
- Behaviour: Given hero `Ah As` and opponents `[[Kd, Kc]]`, `[[Qh, Qc]]` on an empty board, When `computeEquity` runs, Then `method` is `'sampled'` and each of the three equities is within 0.015 of the `mw-001` fixture value (0.66868, 0.18515, 0.14617), and the three equities sum to 1 within 1e-12.
- Verification: acceptance `tests/advice/equity.acceptance.test.ts::AC#3 AA vs KK vs QQ is within 1.5 points of exhaustive enumeration`

### SPEC-05: Same input, same result, in one process and in a fresh one
- Verifies: AC#4, DoD#1
- Behaviour: Given two inputs, (a) hero `As Ks` vs `[[Qh, Qd]]` preflop (sampled) and (b) hero `Ah Kh` on board `Qh 7h 2c` vs two opponents, each the list of every combo of unseen cards (sampled), When `computeEquity` runs twice in the test process and once in a new `node` process that loads `src/advice/equity.ts` through Vite `runnerImport`, Then `JSON.stringify` of all three results is identical for each input. Also, given input (b) with the board cards listed in another order, the hero cards swapped, each range's combo list reversed with the cards inside each combo swapped, and the two opponents swapped, Then the result is identical (with the opponent results swapped back to input order).
- Verification: acceptance `tests/advice/equity.acceptance.test.ts::AC#4 identical results twice in one process and once in a fresh process` (timeout 60 s)

### SPEC-06: The seed comes only from the input
- Verifies: AC#5, DoD#1
- Behaviour: Given input (a) from SPEC-05, When `Math.random` is replaced by a stub that returns 0.999 and Vitest fake timers set the system time to 2001-01-01, Then `computeEquity` returns a result equal to the one computed without the stub and at 2030-06-01. `deriveSeed(canonicalise(x))` is equal for the equivalent inputs of SPEC-05 and different for `As Ks` vs `Qh Qd` and `As Ks` vs `Qh Qc`. When every `.ts` file under `src/advice/` and `src/engine/seeded-random.ts` are read as text, Then none contains `Math.random`, `Date`, `performance`, `crypto` or `process`.
- Verification: acceptance `tests/advice/equity.acceptance.test.ts::AC#5 sampler seed depends only on the input`

### SPEC-07: Exact enumeration on known postflop cases
- Verifies: DoD#1
- Behaviour: Given hero `Ah As` vs `[[Kd, Kc]]` on board `Kh 7c 2d`, When `computeEquity` runs, Then `method` is `'exact'`, `trials` is 990, hero `win` = 85/990, `tie` = 0, `equity` = 85/990 and opponent `equity` = 905/990. Given the river board `Ah Kd 7c 7s 2h` with hero `Qs Qh` vs `[[Qd, Qc]]`, Then `trials` is 1 and both players have `tie` = 1, `win` = 0, `equity` = 0.5. Given hero `As Ks` vs `[[Qh, Qd]]` on the flop `Js Ts 2c` and the same case through `enumerateExact` from the generator, Then the counts agree (win/tie fractions equal exactly). Given a three-way river where all three tie (board `Ts Js Qs Ks As`), Then each `equity` is exactly 1/3 and each `tie` is 1.
- Verification: unit `tests/advice/equity.test.ts::exact enumeration matches hand-checked cases`

### SPEC-08: Method choice follows the evaluation estimate
- Verifies: DoD#1
- Behaviour: Given the six examples in §5 rule 3, When `estimateEvaluations` runs, Then it returns the listed numbers and `computeEquity` reports the listed method. Given a three-way turn input (unseen = 42, so estimate = 126 × n_1 × n_2) with two ranges of 39 live combos each, Then the estimate is 191,646 and the method is `'exact'`; with 40 live combos each, Then the estimate is 201,600 and the method is `'sampled'`.
- Verification: unit `tests/advice/equity.test.ts::chooses exact or sampled from the estimated work`

### SPEC-09: Ranges and canonicalisation
- Verifies: DoD#1
- Behaviour: Given an opponent range that includes combos using a hero or board card and a combo listed twice, When computed, Then the result equals the one for the range with those combos removed. Given a property test (fast-check, `numRuns: 50`) that permutes board order, hero card order, combo order, cards within combos and opponent order on random valid inputs with a river board (exact, cheap), Then results are equal after mapping opponents back. Given hero `As Ks`, empty board and one opponent `Qh Qd`, Then `canonicalKey` is `equity-v1|h:47,51|b:|o:41,42`. Given a hand vs range where the range holds one combo, Then the result equals the hand-vs-hand result.
- Verification: unit `tests/advice/equity.test.ts::canonicalises cards, combos and opponents`

### SPEC-10: Invalid input is rejected with exact errors
- Verifies: DoD#1
- Behaviour: Given each case below, Then `computeEquity` throws `RangeError` with exactly this message: hero of 1 card → `Hero must have 2 cards, got 1`; board of 2 cards → `Board must have 0, 3, 4 or 5 cards, got 2`; 0 opponents → `Expected 1 to 9 opponents, got 0`; 10 opponents → `... got 10`; hero card 52 → `Invalid card: 52`; hero `As` and board containing `As` → `Duplicate card: As`; opponent 2 combo `[51, 51]` → `Opponent 2 has an invalid combo: 51,51`; opponent 1 `[[Kd, Kc]]` with `Kd` on the board → `Opponent 1 has no possible hand`; two opponents both `[[Kd, Kc]]` → `Opponents' hands cannot all be dealt together` (both for an exact river case and a sampled preflop case). Given preflop hero `As Ah`, opponent 1 `[[Kd, Kc], [Qh, Qc]]` and opponent 2 `[[Kd, Kc]]`, When `sampledEquity(canonicalise(input), 30000, 0)` runs, Then it throws `Sampling rejected too many deals`; with the default cap it succeeds and opponent 1's results come only from `Qh Qc` deals.
- Verification: unit `tests/advice/equity.test.ts::rejects invalid input with exact messages`

### SPEC-11: Latency within the slack bound in npm test
- Verifies: DoD#1
- Behaviour: Given the seven scenarios in §9 with fixed inputs, each run once to warm up and then 20 times, When timed with `performance.now()` in the test, Then each scenario's p95 (19th of 20 sorted times) is ≤ its target × `EQUITY_PERF_SCALE` (default 20). The test prints each p95 and the method used.
- Verification: unit `tests/advice/equity.perf.test.ts::equity latency within target times slack` (timeout 120 s)

### SPEC-12: Latency targets on the reference machine
- Verifies: DoD#1
- Behaviour: Given the reference machine (Apple-silicon Mac, Node 22.18.0) and no coverage, When the perf test runs with `EQUITY_PERF_SCALE=1`, Then every scenario meets its §9 target.
- Verification: command `EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts` exits 0

### SPEC-13: PRNG and hash test vectors
- Verifies: DoD#1
- Behaviour: Given `fnv1a32`, Then `fnv1a32('')` = 2166136261, `fnv1a32('a')` = 0xe40c292c, `fnv1a32('foobar')` = 0xbf9cf968. Given `splitMix32(0)`, Then its first four outputs are 2462723854, 1020716019, 454327756, 1275600319. Given `Xoshiro128.fromState(1, 2, 3, 4)`, Then the first five `nextUint32()` values are 11520, 0, 5927040, 70819200, 2031721883. Given `new Xoshiro128(0)`, Then the first three are 3809008728, 1133695204, 53579671. `nextInt(n)` stays in [0, n) for n in {1, 2, 52, 1326} over 10,000 draws, and every value 0..51 appears for n = 52.
- Verification: unit `tests/engine/seeded-random.test.ts::hash and generators match reference vectors`

### SPEC-14: All checks pass, coverage holds, advice stays headless and offline
- Verifies: DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` runs, Then each exits 0, the coverage report shows no `ERROR: Coverage` line, and `src/advice/equity.ts` and `src/engine/seeded-random.ts` each show ≥ 90% lines. The search below prints nothing: `src/advice` and `src/engine/seeded-random.ts` import only relative project modules (no package imports, nothing from `src/advice` inside `src/engine`), and have no network or dynamic-import code.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -rnE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]" src/advice src/engine/seeded-random.ts && ! grep -n "from '.*advice" src/engine/seeded-random.ts`

### SPEC-15: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: Given the user has pushed branch `doit/TASK-7.1`, When the latest CI run for it completes, Then its conclusion is `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-7.1 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-16: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: Given this task, Then: DoD#3 does not apply (the golden-spot suite arrives in E07-S14); DoD#6 does not apply (no playtest runner exists yet, E01-S07); DoD#7 and DoD#12 do not apply (no screen or dialog: `git diff --stat main` shows no file under `src/ui/`, `e2e/` or `index.html`); DoD#9 does not apply (no strategy text, chart, range or golden spot; the fixture is computed maths). DoD#11: the story document for TASK-7.1 is published with `backlog doc` and appears in `backlog doc list --plain`.
- Verification: manual check of `git diff --stat main` and `backlog doc list --plain | grep "TASK-7.1"`

## 7. Edge cases
- Board of 0, 3, 4 and 5 cards: SPEC-01/04 (0), SPEC-07 (3 and 5), SPEC-08 (4). Board of 1, 2 or 6+ cards: SPEC-10.
- Ties and split pots (two-way and three-way, board plays): SPEC-07. Integer share units: SPEC-03, SPEC-07.
- Opponent count 0 and 10: SPEC-10. 9 opponents: SPEC-11 scenario 7.
- Ranges with dead combos, duplicate combos, one-combo ranges: SPEC-09. Range emptied by dead cards and ranges that
  cannot be dealt together: SPEC-10. Heavily overlapping ranges (high rejection rate): SPEC-10.
- Input order (board, hero, combos, opponents): SPEC-05, SPEC-09.
- Method boundary at exactly 200,000 evaluations: SPEC-08.
- Invalid and duplicate cards: SPEC-10.
- Concurrency, interruption, permissions, dependency failure: N/A. `computeEquity` is a synchronous pure function
  with no I/O. Worker offloading is REQ-055.6, a later story.

## 8. Security considerations
- Trust boundaries: none new. Inputs come from the engine and advice code, not from users or the network. They are
  still validated (SPEC-10).
- Authn/authz, secrets, sensitive data, logging: N/A. No I/O, storage or logging in `src/advice/`.
- Injection: N/A. The canonical key is built from integers and is only hashed.
- New dependencies: none. Network: none (SPEC-14, REQ-058.1). The generator reads and writes local files only.
- Randomness: the sampler uses xoshiro128**, which is not a CSPRNG. That is correct here: equity estimates must be
  reproducible (REQ-034.3), and nothing about fairness or security depends on them. Card dealing (TASK-1.3) is a
  separate concern and does not use this module.
- Denial of service: work per call is bounded by the 9-opponent limit, the 200,000-evaluation exact limit, the fixed
  30,000 trials and the rejection cap.

## 9. Non-functional
- Latency targets, p95 on the reference machine (Apple-silicon Mac, Node 22.18.0, no coverage), approved Q-4:

  | # | Scenario | Method | Target p95 |
  |---|---|---|---|
  | 1 | HU preflop hand vs hand (`As Ks` vs `Qh Qd`) | sampled | ≤ 15 ms |
  | 2 | HU flop hand vs hand (`Ah As` vs `Kd Kc`, `Kh 7c 2d`) | exact | ≤ 2 ms |
  | 3 | HU flop vs every unseen combo (`Ah Kh`, `Qh 7h 2c`) | sampled | ≤ 20 ms |
  | 4 | HU turn vs every unseen combo (`Ah Kh`, `Qh 7h 2c 9s`) | exact | ≤ 15 ms |
  | 5 | Three-way preflop AA vs KK vs QQ | sampled | ≤ 20 ms |
  | 6 | 6-max preflop, hero `Ah Kh` vs 5 opponents with every unseen combo | sampled | ≤ 50 ms |
  | 7 | Full ring flop, hero `Ah Kh` on `Qh 7h 2c` vs 9 opponents with every unseen combo | sampled | ≤ 80 ms |

  Every scenario fits the 100 ms bot decision budget (REQ-055.3) and the 1 s hint budget (REQ-055.1). Measured by
  SPEC-12. CI runs the same suite with a 20× slack (SPEC-11) so it catches large regressions without flaky failures.
- Accuracy: sampled results have a standard error ≤ 0.29 pp (√(0.25 / 30,000)), so the 1.5 pp tolerance is ≥ 5.2
  standard errors. Results are deterministic, so a passing case always passes.
- Test time: all of `tests/advice/` ≤ 45 s on CI with coverage (about 7 M sampled evaluations for SPEC-02 plus 2
  exhaustive re-enumerations of about 3.4 M evaluations each for SPEC-03).
- Coverage: ≥ 90% lines for `src/advice/**` and `src/engine/seeded-random.ts` (SPEC-14).
- Bundle: the fixture and generator are test/tool files and are not shipped in `dist/`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `node tools/equity/generate-reference.js` (regenerates the fixture; library otherwise has no user-facing entry point yet)
- New tests (path → SPEC ids):
  - `tests/advice/equity.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-04, SPEC-05, SPEC-06 (locked)
  - `tests/advice/equity-reference.test.ts` → SPEC-03
  - `tests/advice/equity.test.ts` → SPEC-07, SPEC-08, SPEC-09, SPEC-10
  - `tests/engine/seeded-random.test.ts` → SPEC-13
  - `tests/advice/equity.perf.test.ts` → SPEC-11, SPEC-12
- End-to-end scenario for the Judge (as a developer consuming the advice library):
  1. `npm run lint && npm run typecheck && npm test` exits 0. Note the largest AC#2 error printed and the test time.
  2. `node tools/equity/generate-reference.js` and then `git diff --exit-code tests/advice/fixtures` shows no change.
  3. Run the SPEC-12 command on the Apple-silicon machine and record each p95.
  4. Mutation probes (revert after each): count a tie as a full win (SPEC-02/07 must fail); seed from `Date.now()`
     (SPEC-05/06 must fail); drop the board-order sort from the key (SPEC-05 must fail); lower the exact limit to
     190,000 (SPEC-08 must fail).
  5. Run the SPEC-14 search and the SPEC-16 checks.

## 11. Open questions
- })` with `Range = readonly HoleCards[]` (unweighted specific combos; a known hand is a one-combo range) returning `{ hero, opponents, method, trials }` with `win`/`tie`/`equity` fractions per player?]
-
-
-

## 12. Clarifications log
See `doit/TASK-7.1/qa.md`.
