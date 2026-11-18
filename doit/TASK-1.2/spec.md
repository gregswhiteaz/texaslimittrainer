# Spec: TASK-1.2 — Rank showdown hands by real poker hand rankings

Status: READY (approved 2026-11-17)
Task: TASK-1.2 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-019.1, REQ-019.2 (feeds REQ-034, REQ-055.1, REQ-055.3) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the first engine code: a card representation (`src/engine/cards.ts`) and a fast hand evaluator
(`src/engine/hand-evaluator.ts`). The evaluator turns 5, 6 or 7 cards into a dense hand rank from 1 to 7,462, where a
higher number is a stronger hand. Equal numbers mean a tie. The showdown (TASK-1.4/1.15), the equity calculator (E07)
and the bots (E06) will all call it, so its public interface and speed are fixed here. Tests prove it agrees with an
independent reference ranking of all 7,462 five-card classes, checked against every one of the 2,598,960 five-card
hands, and that a 7-card result equals the best of its 21 five-card subsets.

## 2. Scope
- In scope:
  - `src/engine/cards.ts`: the `Card` encoding, rank/suit accessors, and text parse/format helpers (`"As"`, `"Td"`).
  - `src/engine/hand-evaluator.ts`: `evaluate`, `compareHands`, `handCategory`, `HAND_RANK_COUNT`, `HAND_CATEGORIES`,
    and the lookup tables built when the module loads.
  - An independent reference ranking used only by tests (`tests/engine/reference-ranking.ts`).
  - Acceptance, property, unit and performance tests under `tests/engine/`.
- Not doing:
  - Hand names such as "Pair of kings" (REQ-019.7), and returning which five cards make the hand. These come with the
    showdown/UI stories.
  - Showdown order, pot award, split pots and odd chips (REQ-019.3–.9; TASK-1.4, TASK-1.10, TASK-1.15).
  - Deck, shuffle and replay code (TASK-1.3). This task only defines the `Card` integer that the deck will hold.
  - Equity calculation, Monte Carlo sampling and web workers (E07, REQ-055.6).
  - Evaluating fewer than 5 or more than 7 cards. Other poker variants.
  - A committed fixture file or generated binary table, a build-time code generator, and any new dependency.
  - A barrel `src/engine/index.ts`. Callers import from the two modules directly.
- Scope budget: files=8, lines=1000   (cards.ts ~60, hand-evaluator.ts ~250, reference-ranking.ts ~110, acceptance test ~230, property test ~110, cards unit test ~70, evaluator unit test ~110, perf test ~60)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Two source modules, `src/engine/cards.ts` and `src/engine/hand-evaluator.ts`. Tests go in a new `tests/engine/` folder | yes | Follows TASK-1.1 A-8 (tests in `tests/**`). The card type is used by the deck (TASK-1.3) without the evaluator | One `src/engine/poker.ts`; colocated `src/engine/*.test.ts` |
| A-2 | Card text notation: rank characters `23456789TJQKA` (upper case, `T` = ten) followed by a suit character `cdhs` (lower case), e.g. `As`, `Td`, `2c`. `parseCard` is strict: any other text throws | yes | The standard notation in poker software, and it keeps tests readable. Not shown to users in this task | Accept `10s` and any letter case; Unicode suit symbols |
| A-3 | Invalid input throws `RangeError` with the exact messages in §5 "Error handling". It is checked on every `evaluate` call, and that cost counts against the speed target | yes | Fail loudly on engine bugs (wrong card count, duplicates). The checks are a few integer comparisons plus a bit test the evaluator does anyway | An unchecked fast path plus a checked wrapper |
| A-4 | The lookup tables are built once, eagerly, when `hand-evaluator.ts` is first imported. `buildEvaluatorTables()` is also exported (documented as internal) so the perf test can time it | yes | Simplest. Start-up cost is measured (§9) and is far below the 3 s launch budget (REQ-055.4) | Lazy build on the first `evaluate` call (adds a branch to the hot path) |
| A-5 | Property tests use fast-check's default random seed (fast-check prints the seed on failure) with fixed `numRuns` (§10) | yes | Explores new cases on every run. Any failure is a real bug and can be reproduced from the printed seed | A fixed seed for each property |
| A-6 | `npm test` includes a throughput check with a slack floor (≥ 1,000,000 seven-card evaluations per second, table build ≤ 500 ms). The real target in §9 is checked by a command on the reference machine (SPEC-12) | yes | GitHub runners are slower and coverage instrumentation adds overhead. A strict timing test in CI would be flaky. The floor still catches order-of-magnitude regressions | No timing check in `npm test`; a Vitest `bench` file |
| A-7 | The exhaustive five-card test (AC#1) runs inside `npm test`, with a 60 s per-test timeout. The expected runtime is ≤ 10 s on CI | yes | AC#1 says "every distinct five-card hand". 2,598,960 evaluations with a fast evaluator take well under a second, and the oracle check uses a numeric `Map` lookup | Check only the 7,462 class representatives (not "every hand") |

## 3. Current system
- No engine code exists yet. `src/` holds only `src/main.tsx` and `src/ui/`. TASK-1.1 and TASK-1.7 are merged on
  `main` (`58738dd`).
- Tests: Vitest discovers `src/**/*.test.{ts,tsx}` and `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`) in the `node`
  environment (`vite.config.ts:8`). `npm test` = `vitest run --coverage` (`package.json:12`).
- Coverage: `src/{engine,bots,advice,stats}/**` must reach ≥ 90% lines, and the whole project ≥ 70%
  (`vite.config.ts:15`). The new `src/engine/*.ts` files are measured, and `src/main.tsx` is excluded (`vite.config.ts:13`).
- Headless boundary: `src/engine/**` is linted against React, DOM, IndexedDB and browser-only globals
  (`tools/lint/headless-boundary.js:6-8`, applied in `eslint.config.js:27`). The evaluator needs nothing from those.
- TypeScript is strict with `noUncheckedIndexedAccess` (`tsconfig.json:9-10`). Indexing a `Uint16Array` or an array
  gives `number | undefined`. typescript-eslint `strict` (`eslint.config.js:24`) forbids the `!` non-null assertion, so
  table reads need `?? 0` or a checked local.
- Imports have no file extension (`moduleResolution: bundler`, `tsconfig.json:6`; e.g. `tests/toolchain/coverage.test.ts:3`).
- Prettier: single quotes, width 100 (TASK-1.1 A-9, `.prettierrc.json`). `npm run lint` runs ESLint with
  `--max-warnings 0` and then `prettier --check .` (`package.json:14`).
- fast-check `4.10.2` is already a devDependency (`package.json:41`). Node is pinned to `22.18.0` (`.nvmrc:1`).
- CI runs lint, typecheck, build, test and e2e on every push (`.github/workflows/ci.yml`). Nothing changes there.
- Existing code to reuse:
  - `fast-check` (devDependency) → AC#3 and AC#5 property tests. No new generator library is needed.
  - Vitest `describe/it/expect` and the per-test timeout argument, as in `tests/toolchain/*.test.ts`.
  - Nothing in `src/` can be reused. This is the first engine module.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Public interface (§5 "Components"): `Card` = integer 0–51 (`rank * 4 + suit`), `HandRank` = integer 1–7,462 (higher is stronger), `evaluate(cards)` for 5–7 cards, `compareHands(a, b)` returning -1/0/1, `handCategory(rank)`. | See Q-1 alternatives | Every later engine, advice and bot story builds on it | yes | user (Q-1) |
| D-2 | AC#1 reference table: an independent brute-force oracle in test code that ranks the 7,462 classes from first principles. It is anchored to published poker combinatorics (class counts and five-card hand counts per category), and every one of the 2,598,960 five-card hands is checked against it. No committed fixture, no third-party table. | Committed 7,462-row fixture; third-party evaluator package as oracle | No dependency, no generated file to review, and the result stays inside the CI time budget | yes | user (Q-2) |
| D-3 | Evaluator approach and speed target: table-driven 7-card evaluation (13-bit flush table + collision-free rank-count index), with tables built at module load. Target ≥ 10,000,000 seven-card evaluations/s on the reference machine, table build ≤ 50 ms, tables ≤ 512 KiB. | Cactus Kev 5-card + 21 subsets; Two-Plus-Two 7-card table; committed precomputed tables | Fast enough for REQ-034 exhaustive heads-up equity inside REQ-055.1, small, and nothing generated is committed | yes | user (Q-3) |
| D-4 | Validation happens inside `evaluate` (A-3) and duplicates are detected with the suit bit masks | Unchecked hot path | Catches engine bugs. Almost free | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/cards.ts` — new: card encoding and text helpers
- `src/engine/hand-evaluator.ts` — new: lookup tables, `evaluate`, `compareHands`, `handCategory`
- `tests/engine/reference-ranking.ts` — new: independent test oracle (no import from `hand-evaluator`)
- `tests/engine/hand-evaluator.acceptance.test.ts` — new: AC#1–AC#5 example and exhaustive tests (locked)
- `tests/engine/hand-evaluator.property.test.ts` — new: AC#3 and AC#5 fast-check properties (locked)
- `tests/engine/cards.test.ts` — new: unit tests for the card helpers
- `tests/engine/hand-evaluator.test.ts` — new: unit tests for errors, `handCategory` and table internals
- `tests/engine/hand-evaluator.perf.test.ts` — new: throughput and table-build timing

### Components, interfaces and data
`src/engine/cards.ts` (approved Q-1):
```ts
/** 0..51. card = rank * 4 + suit. 0 = 2c, 1 = 2d, 2 = 2h, 3 = 2s, ..., 48 = Ac, 51 = As. */
export type Card = number;
/** 0..12 for 2,3,...,9,T,J,Q,K,A. */
export type Rank = number;
/** 0..3 for clubs, diamonds, hearts, spades. */
export type Suit = number;
export const RANK_CHARS = '23456789TJQKA';
export const SUIT_CHARS = 'cdhs';
export function makeCard(rank: Rank, suit: Suit): Card;    // RangeError if rank/suit out of range or not an integer
export function cardRank(card: Card): Rank;                 // card >> 2
export function cardSuit(card: Card): Suit;                 // card & 3
export function parseCard(text: string): Card;              // 'As' -> 51; RangeError on anything else
export function parseCards(text: string): Card[];           // 'As Kd 7h' -> [51, 45, 22]; split on runs of whitespace, trimmed; '' -> []
export function formatCard(card: Card): string;             // 51 -> 'As'; RangeError if not a valid card
```
`cardRank` and `cardSuit` do not validate (hot-path helpers).

`src/engine/hand-evaluator.ts` (approved Q-1):
```ts
import type { Card } from './cards';
/** 1..7462. Higher is stronger. Equal values tie. */
export type HandRank = number;
export type HandCategory =
  | 'straight-flush' | 'four-of-a-kind' | 'full-house' | 'flush' | 'straight'
  | 'three-of-a-kind' | 'two-pair' | 'one-pair' | 'high-card';
/** Ordered strongest first. */
export const HAND_CATEGORIES: readonly HandCategory[];
export const HAND_RANK_COUNT = 7462;
/** Best five-card rank among 5, 6 or 7 distinct cards. Throws RangeError on invalid input. */
export function evaluate(cards: readonly Card[]): HandRank;
/** -1 if a < b, 0 if equal, 1 if a > b. No validation. */
export function compareHands(a: HandRank, b: HandRank): -1 | 0 | 1;
/** Category of a rank. RangeError if rank is not an integer in 1..7462. */
export function handCategory(rank: HandRank): HandCategory;
/** @internal Builds the lookup tables. Called once at module load; exported for the perf test only. */
export function buildEvaluatorTables(): EvaluatorTables;
```
`EvaluatorTables` is an exported interface of typed arrays (`flush: Uint16Array` of length 8,192, plus the non-flush
table and the index helper arrays). Together they must take ≤ 512 KiB.

Invariants:
- `evaluate` allocates nothing on the heap per call and does no `Map`/object-key lookup on the hot path.
- `evaluate` does not depend on the order of the cards.
- `evaluate` is a pure function. The module holds no mutable state after load.

### Rules and algorithms
Hand-rank order (REQ-019.1, REQ-019.2). Categories, weakest to strongest, with their dense rank ranges:

| Category | Classes | Ranks | Tie-break within category (compare in order, higher wins) |
|---|---|---|---|
| high-card | 1,277 | 1–1,277 | the 5 ranks, highest first |
| one-pair | 2,860 | 1,278–4,137 | pair rank, then 3 kickers highest first |
| two-pair | 858 | 4,138–4,995 | high pair, low pair, kicker |
| three-of-a-kind | 858 | 4,996–5,853 | trips rank, then 2 kickers highest first |
| straight | 10 | 5,854–5,863 | top card of the straight; A-2-3-4-5 has top card 5 |
| flush | 1,277 | 5,864–7,140 | the 5 ranks, highest first |
| full-house | 156 | 7,141–7,296 | trips rank, then pair rank |
| four-of-a-kind | 156 | 7,297–7,452 | quads rank, then kicker |
| straight-flush | 10 | 7,453–7,462 | top card; A-2-3-4-5 has top card 5 |

- Straights: the 10 rank windows A-K-Q-J-T down to 5-4-3-2-A. An ace counts low only in A-2-3-4-5. There is no
  wrap-around (Q-K-A-2-3 is not a straight). High-card and flush classes exclude the 10 straight patterns.
- Suits never affect the rank except to decide whether a hand is a flush.
- Worked examples (5 cards): `7c 5d 4h 3s 2c` = 1 (weakest). `Ac Kd Qh Js 9c` = 1,277. `2c 2d 3h 4s 5c` = 1,278.
  `Ac Ad Kh Qs Jc` = 4,137. `Ac Ad Ah Ks Qc` = 5,853. `Ac 2d 3h 4s 5c` = 5,854. `2c 3d 4h 5s 6c` = 5,855.
  `Tc Jd Qh Ks Ac` = 5,863. `7h 5h 4h 3h 2h` = 5,864. `Ah Kh Qh Jh 9h` = 7,140. `2c 2d 2h 3s 3c` = 7,141.
  `Ac Ad Ah Ks Kc` = 7,296. `2c 2d 2h 2s 3c` = 7,297. `Ac Ad Ah As Kc` = 7,452. `Ah 2h 3h 4h 5h` = 7,453.
  `Ts Js Qs Ks As` = 7,462.
- 6 and 7 cards: the result equals the highest rank over all 5-card subsets (6 or 21 of them).

Evaluator algorithm (approved in Q-3; the builder may use another collision-free index if it meets every target):
1. Per call: for each card, `r = card >> 2`, `s = card & 3`. If bit `r` of `suitMask[s]` is already set, the card is
   a duplicate. Otherwise set it and increment `rankCount[r]`. Use fixed-size locals or module-level scratch typed
   arrays that are reset on each call (no allocation).
2. If some suit has ≥ 5 cards, return `flush[suitMask[s]]`. With 5–7 cards, a hand with a flush cannot also hold
   quads or a full house, so the flush or straight flush is the best hand.
3. Otherwise return `noFlush[index(rankCount)]`. `index` is a collision-free combinatorial index of the 13
   rank counts (each 0–4, sum 5–7), computed with ≤ 13 table reads and additions. An example is the "quinary"
   index from Henry Lee's PokerHandEvaluator, re-implemented from the idea, with no code copied.
4. `buildEvaluatorTables()` fills `flush` for every 13-bit mask with 5–7 bits set (5 bits: straight-flush or flush
   rank; 6–7 bits: the best 5-bit subset). It fills `noFlush` for every rank-count vector with sum 5, 6 or 7 with
   the best non-flush rank (the best category from the counts plus tie-break ranks), mapped to its dense rank.
   Dense ranks come from enumerating each category's classes in tie-break order.

### Error handling and configuration
All errors are `RangeError`. Messages are exact (`<card>` is the value passed in, formatted with `String(value)`):
- `evaluate` with `cards.length` not in 5–7: `Hand must have 5 to 7 cards, got <n>`
- `evaluate` with an element that is not an integer in 0–51: `Invalid card: <value>`
- `evaluate` with the same card twice: `Duplicate card: <formatCard(card)>` (e.g. `Duplicate card: As`)
- `parseCard` with anything other than one rank character plus one suit character: `Invalid card: "<text>"`
- `formatCard` and `makeCard` with out-of-range input: `Invalid card: <value>` and `Invalid rank or suit: <rank>, <suit>`
- `handCategory` with a rank that is not an integer in 1–7,462: `Invalid hand rank: <value>`
No configuration.

## 6. Behaviour specification

### SPEC-01: Exactly 7,462 classes, in the reference order, with categories in standard order
- Verifies: AC#1, DoD#1
- Behaviour: Given the oracle in `tests/engine/reference-ranking.ts`, which enumerates the 6,175 rank multisets of five cards (each rank at most 4 times) plus a flush variant for each of the 1,287 sets of five distinct ranks, ranks each class from first principles (counting and sorting, no lookup tables) and sorts them, When the test checks it, Then the oracle has exactly 7,462 classes with per-category class counts straight-flush 10, four-of-a-kind 156, full-house 156, flush 1,277, straight 10, three-of-a-kind 858, two-pair 858, one-pair 2,860, high-card 1,277, in that order strongest first. When all 2,598,960 five-card hands are enumerated and evaluated, Then each `evaluate` result equals the oracle rank of that hand's class, exactly 7,462 distinct values occur (1 through 7,462), the number of hands per category is 40 / 624 / 3,744 / 5,108 / 10,200 / 54,912 / 123,552 / 1,098,240 / 1,302,540 (straight-flush to high-card), and `handCategory(evaluate(hand))` equals the oracle category for every hand.
- Verification: acceptance `tests/engine/hand-evaluator.acceptance.test.ts::AC#1 every five-card hand matches the 7,462-class reference ranking` with oracle `tests/engine/reference-ranking.ts` (locked together; timeout 60 s)

### SPEC-02: Worked-example ranks and category boundaries
- Verifies: AC#1
- Behaviour: Given the 16 worked examples in §5 "Rules and algorithms", When each is evaluated, Then it returns the listed rank exactly. `handCategory` returns `'high-card'` for 1 and 1,277, `'one-pair'` for 1,278 and 4,137, `'two-pair'` for 4,138 and 4,995, `'three-of-a-kind'` for 4,996 and 5,853, `'straight'` for 5,854 and 5,863, `'flush'` for 5,864 and 7,140, `'full-house'` for 7,141 and 7,296, `'four-of-a-kind'` for 7,297 and 7,452, and `'straight-flush'` for 7,453 and 7,462. `HAND_RANK_COUNT` is 7,462 and `HAND_CATEGORIES` lists the nine categories strongest first.
- Verification: acceptance `tests/engine/hand-evaluator.acceptance.test.ts::AC#1 worked examples and category boundaries`

### SPEC-03: The wheel is the lowest straight
- Verifies: AC#2, DoD#1
- Behaviour: Given `Ac 2d 3h 4s 5c` (A-2-3-4-5), `2c 3d 4h 5s 6c` (2-3-4-5-6) and `Ac Ad Ah Ks Qc` (the best three of a kind), When evaluated and compared, Then `compareHands(wheel, sixHigh)` is -1, `compareHands(wheel, bestTrips)` is 1, `handCategory(wheel)` is `'straight'`, and the wheel's rank is the minimum of the straight range (5,854). Also `Ah 2h 3h 4h 5h` is the lowest straight flush (7,453) and beats `Ac Ad Ah As Kc`. `Qc Kd Ah 2s 3c` (no wrap-around) is `'high-card'`. In 7 cards, `Ac 2d 3h 4s 5c 6d 9h` evaluates to the 6-high straight (5,855), not the wheel.
- Verification: acceptance `tests/engine/hand-evaluator.acceptance.test.ts::AC#2 A-2-3-4-5 is the lowest straight`

### SPEC-04: Seven cards rank as the best of their 21 five-card subsets (examples)
- Verifies: AC#3, DoD#1
- Behaviour: Given two hole cards plus five board cards, When evaluated, Then the result equals the highest `evaluate` value over the 21 five-card subsets, and these cases give the listed best hand: (a) hole `2c 3d`, board `Ts Js Qs Ks As` → 7,462 (board plays); (b) hole `9s 9h`, board `9d 4c 4s 4h Kc` → full house nines full of fours (higher trips over lower trips, rank of `9s 9h 9d 4c 4s`); (c) hole `Kc Qd`, board `Ks Qh 2c 2d 7s` → two pair kings and queens with a 7 kicker (rank of `Kc Ks Qd Qh 7s`); (d) hole `Ah 2h`, board `9h 7h 5h 3h Kd` → the flush `Ah 9h 7h 5h 3h` (best five of six hearts); (e) hole `Ah 2h`, board `3h 4h 5h Kh 9c` → the A-2-3-4-5 straight flush (7,453), not the ace-high flush; (f) hole `8h 9h`, board `5h 6h 7h 9s 9c` → straight flush 9-high (7,457) over three nines; (g) hole `Ac Kd`, board `Qc Qd Qh Qs 2c` → four queens with ace kicker (rank of `Qc Qd Qh Qs Ac`).
- Verification: acceptance `tests/engine/hand-evaluator.acceptance.test.ts::AC#3 seven-card examples equal the best five-card subset`

### SPEC-05: Seven and six cards equal the best subset (property)
- Verifies: AC#3
- Behaviour: Given 20,000 random sets of 7 distinct cards (fast-check, `numRuns: 20000`), When evaluated, Then `evaluate(seven)` equals the maximum oracle rank over its 21 five-card subsets, and also equals the maximum `evaluate` over those subsets. Given 5,000 random sets of 6 distinct cards, Then `evaluate(six)` equals the maximum oracle rank over its 6 subsets. For any shuffled order of the same cards, the result is the same.
- Verification: acceptance `tests/engine/hand-evaluator.property.test.ts::AC#3 seven and six cards equal the best five-card subset`

### SPEC-06: The higher kicker wins
- Verifies: AC#4, DoD#1
- Behaviour: Given `Kc Kd As 9h 4c` (K-K-A-9-4) and `Ks Kh Qd 9c 4d` (K-K-Q-9-4), When evaluated and compared, Then `compareHands(first, second)` is 1 and `compareHands(second, first)` is -1, and both are `'one-pair'`. Given the same pair played through 7 cards, hole `As 3d` vs hole `Qd 3h` on board `Kc Kd 9h 4c 2s`, Then the `As` hand wins (1). Given the second kicker decides, `Kc Kd As Jh 4c` vs `Ks Kh Ad 9c 4d`, Then the first wins.
- Verification: acceptance `tests/engine/hand-evaluator.acceptance.test.ts::AC#4 a higher kicker breaks the tie`

### SPEC-07: Suits never break ties
- Verifies: AC#5, DoD#1
- Behaviour: Given hands that differ only in suits, When compared, Then `compareHands` is 0: `Kc Kd As 9h 4c` vs `Ks Kh Ad 9c 4d`; flush `Ah Kh 9h 7h 3h` vs `As Ks 9s 7s 3s`; 7-card split pot hole `Ac Kd` vs hole `Ad Kc` on board `Qh Js 2c 7d 9s`. Also, given any 5- or 7-card set of distinct cards and any of the 24 permutations of the four suits (fast-check, `numRuns: 5000` per size), When every card's suit is relabelled by the permutation, Then `evaluate` returns the same rank.
- Verification: acceptance `tests/engine/hand-evaluator.acceptance.test.ts::AC#5 hands that differ only in suits tie` and acceptance `tests/engine/hand-evaluator.property.test.ts::AC#5 relabelling suits never changes the rank`

### SPEC-08: Invalid hands are rejected with exact errors
- Verifies: DoD#1
- Behaviour: Given `evaluate` with 4 cards, Then it throws `RangeError` `Hand must have 5 to 7 cards, got 4`; with 8 cards, `... got 8`. Given an element `52`, `-1`, `1.5` or `NaN`, Then `Invalid card: 52` / `Invalid card: -1` / `Invalid card: 1.5` / `Invalid card: NaN`. Given `parseCards('As Kd 7h 2c As')`, Then `Duplicate card: As`. Given `handCategory(0)`, `handCategory(7463)` or `handCategory(2.5)`, Then `Invalid hand rank: 0` / `Invalid hand rank: 7463` / `Invalid hand rank: 2.5`. `compareHands(5, 5)` is 0, `compareHands(4, 5)` is -1, `compareHands(5, 4)` is 1.
- Verification: unit `tests/engine/hand-evaluator.test.ts::rejects invalid hands and ranks`

### SPEC-09: Card encoding and text helpers
- Verifies: DoD#1
- Behaviour: Given the encoding `rank * 4 + suit`, Then `parseCard('2c')` is 0, `parseCard('2d')` is 1, `parseCard('As')` is 51, `parseCard('Td')` is 33; `formatCard` inverts `parseCard` for all 52 cards; `cardRank(51)` is 12 and `cardSuit(51)` is 3; `makeCard(12, 3)` is 51; `parseCards('  As Kd\t7h ')` is `[51, 45, 22]` and `parseCards('')` is `[]`. Given `parseCard('as')`, `parseCard('10s')`, `parseCard('Ax')` or `parseCard('')`, Then `RangeError` `Invalid card: "as"` (etc.). Given `formatCard(52)`, Then `Invalid card: 52`. Given `makeCard(13, 0)`, Then `Invalid rank or suit: 13, 0`.
- Verification: unit `tests/engine/cards.test.ts::card encoding and text helpers`

### SPEC-10: Table build is correct and small
- Verifies: DoD#4
- Behaviour: Given `buildEvaluatorTables()`, When called, Then the `flush` table has 8,192 entries, every 13-bit mask with fewer than 5 bits set maps to 0, the 10 straight masks map to 7,453–7,462, and the total `byteLength` of all typed arrays in the result is ≤ 524,288 (512 KiB). Calling it twice gives equal tables.
- Verification: unit `tests/engine/hand-evaluator.test.ts::builds the lookup tables within 512 KiB`

### SPEC-11: Speed floor holds in the normal test run
- Verifies: DoD#1
- Behaviour: Given 1,000,000 pre-generated random 7-card hands (generated before timing starts) and a warm-up pass, When `evaluate` runs over all of them, Then the measured rate is ≥ the floor `EVALUATOR_MIN_EVALS_PER_SEC` (default 1,000,000 per second), and `buildEvaluatorTables()` takes ≤ `EVALUATOR_MAX_BUILD_MS` (default 500 ms). The test prints the measured rate and build time. The results are summed into a checksum so the work cannot be optimised away.
- Verification: unit `tests/engine/hand-evaluator.perf.test.ts::meets the evaluation throughput floor`

### SPEC-12: Reference-machine speed target
- Verifies: DoD#1
- Behaviour: Given the reference machine (Apple-silicon Mac, Node 22.18.0), When the perf test runs without coverage with the target thresholds, Then it passes: ≥ 10,000,000 seven-card evaluations per second and a table build ≤ 50 ms.
- Verification: command `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts` exits 0

### SPEC-13: All checks pass and coverage holds
- Verifies: DoD#1, DoD#2, DoD#4
- Behaviour: Given the finished change, When the project checks run, Then `npm run lint`, `npm run typecheck` and `npm test` each exit 0, the coverage report shows no `ERROR: Coverage` line, and `src/engine/cards.ts` and `src/engine/hand-evaluator.ts` each show ≥ 90% line coverage in the text report.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-14: Engine stays headless and offline
- Verifies: DoD#5, DoD#8
- Behaviour: Given `src/engine/`, When linted, Then the headless boundary reports nothing (part of SPEC-13), and the engine contains no network or dynamic-import code: the search below prints nothing. The module imports only `./cards` (from `hand-evaluator.ts`) and nothing else.
- Verification: command `! grep -rnE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]" src/engine`

### SPEC-15: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: Given the user has pushed branch `doit/TASK-1.2`, When the latest CI run for it completes, Then its conclusion is `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-1.2 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-16: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: Given this task, Then: DoD#3 does not apply (the golden-spot suite arrives in E07-S14); DoD#6 does not apply (the playtest runner arrives in TASK-1.6/1.8); DoD#7 and DoD#12 do not apply (no screen or dialog is added: `git diff --stat main` shows no file under `src/ui/`, `e2e/` or `index.html`); DoD#9 does not apply (no strategy content). DoD#11: the story document for TASK-1.2 is published with `backlog doc` and appears in `backlog doc list --plain`.
- Verification: manual check of `git diff --stat main` and `backlog doc list --plain | grep "TASK-1.2"`

## 7. Edge cases
- Boundary card counts (4 and 8 cards): SPEC-08. Exactly 5, 6 and 7 cards: SPEC-01, SPEC-05.
- Boundary ranks (weakest 1, strongest 7,462, every category edge): SPEC-02.
- Invalid card values (out of range, negative, fractional, NaN): SPEC-08. Malformed card text: SPEC-09.
- Duplicate cards: SPEC-08.
- Ace low only in the wheel, no wrap-around, wheel versus 6-high in 7 cards: SPEC-03.
- 7 cards holding both a straight flush and three of a kind, a six-card flush, a six-card flush hiding a straight
  flush, two sets of trips, three pairs, quads on board: SPEC-04.
- Card order independence: SPEC-05.
- Suit relabelling: SPEC-07.
- Concurrency, interruption, permissions, dependency failure: N/A. The evaluator is a pure synchronous function with no I/O.

## 8. Security considerations
- Trust boundaries: none. Inputs come from the engine's own deck, and tests. Bad input is still rejected (SPEC-08).
- Authn/authz, secrets, sensitive data, logging: N/A. No I/O, no storage, no logging.
- Injection: N/A. `parseCard` reads two fixed characters through index lookups. No `eval`, no regex built from input.
- New dependencies: none (D-2 rules out a third-party oracle). Network: none (SPEC-14, REQ-058.1).
- Randomness: the evaluator uses none. Tests use fast-check's generator and a test-local generator to pick sample
  hands; fairness does not depend on them.
- Denial of service: `evaluate` rejects arrays longer than 7 before looping, so its work per call is bounded.

## 9. Non-functional
- Throughput: ≥ 10,000,000 seven-card `evaluate` calls per second (≤ 100 ns each) on the reference machine
  (Apple-silicon Mac, Node 22.18.0, no coverage), measured by SPEC-12. CI floor ≥ 1,000,000 per second with coverage
  on (SPEC-11). Why this number: exhaustive heads-up preflop equity (REQ-034.1) needs 1,712,304 boards × 2
  evaluations ≈ 3.4 million calls, about 0.34 s at target, inside the 1.0 s hint budget (REQ-055.1). A bot decision
  (REQ-055.3, ≤ 100 ms) can afford about 1 million calls.
- Start-up: table build ≤ 50 ms on the reference machine (SPEC-12), ≤ 500 ms floor in CI (SPEC-11). This counts
  against the 3 s launch budget (REQ-055.4) and runs again in each worker that imports the module.
- Memory: lookup tables ≤ 512 KiB (SPEC-10).
- Bundle: no data files. The tables are computed from source, so the evaluator adds only its code (a few kB) to
  `dist/`.
- Test time: the whole `tests/engine/` folder ≤ 30 s on CI. The exhaustive AC#1 test has a 60 s timeout (A-7).
- Coverage: ≥ 90% lines for `src/engine/**` (SPEC-13).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/engine` (library only; there is no user-facing entry point yet)
- New tests (path → SPEC ids):
  - `tests/engine/hand-evaluator.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-06, SPEC-07 (locked)
  - `tests/engine/hand-evaluator.property.test.ts` → SPEC-05 (`numRuns` 20,000 for 7 cards, 5,000 for 6 cards), SPEC-07
    (`numRuns` 5,000 per size) (locked)
  - `tests/engine/reference-ranking.ts` → oracle for SPEC-01, SPEC-04, SPEC-05 (locked with the acceptance tests).
    It imports only `cardRank`/`cardSuit` from `src/engine/cards.ts` and never imports `hand-evaluator.ts`.
  - `tests/engine/hand-evaluator.test.ts` → SPEC-08, SPEC-10
  - `tests/engine/cards.test.ts` → SPEC-09
  - `tests/engine/hand-evaluator.perf.test.ts` → SPEC-11, SPEC-12
- End-to-end scenario for the Judge (as a developer consuming the engine):
  1. `npm run lint && npm run typecheck && npm test` exits 0. Note the AC#1 test duration and the printed throughput.
  2. Run the SPEC-12 command on the Apple-silicon machine and record the rate and build time.
  3. Mutation probes (revert after each): make `evaluate` treat A-2-3-4-5 as ace-high (SPEC-01/03 must fail); swap
     the flush and straight category ranges (SPEC-01/02 must fail); ignore the lowest kicker (SPEC-01/06 must fail);
     drop the duplicate check (SPEC-08 must fail).
  4. Run the SPEC-14 search and the SPEC-16 checks.

## 11. Open questions
- None. Q-1, Q-2 and Q-3 were answered with the recommended option (see `doit/TASK-1.2/qa.md`) and are recorded as D-1, D-2 and D-3.

## 12. Clarifications log
See `doit/TASK-1.2/qa.md`.
