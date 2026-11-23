# Spec: TASK-7.12 — Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD

Status: READY (approved 2026-11-23)
Task: TASK-7.12 · Parent/epic: TASK-7 · Requirements: REQ-045 (REQ-045.1–.6; also serves REQ-027.6) · Dream: limit-holdem-trainer

## 1. Summary
Add one pure statistics module, `src/stats/style-stats.ts`, that computes the five REQ-045 style stats (VPIP, PFR,
Aggression, WTSD, W$SD) for one seat over completed hand records. The module counts what happened in each hand,
sums those counts, turns them into percentages (`null` when the denominator is 0), and formats a percentage for
display (`—` for `null`). The Session Report (E10), the opponent stats panel (REQ-031), range scaling (REQ-035.2)
and the bot style checks (E06, REQ-027.6) will all use this one definition.

## 2. Scope
- In scope:
  - `src/stats/style-stats.ts`: input type `StatHand`, `StyleCounts`, per-hand counting, summing, percentages and
    display formatting.
  - Locked acceptance tests (one per AC) built from hand-written records, plus unit tests for edge cases and a
    cross-check against real engine hands from `runPlaytest`.
  - Per Q-1 (accepted): switch the private counters in the locked
    `tests/bots/style-bands.acceptance.test.ts` to the shared functions, with the same bands and the same rounding.
  - `docs/stats/style-stats.md`: the definitions, the counting rules for edge cases, and the API.
- Not doing:
  - No UI: no Session Report, no stats panel, no "over N hands" text, no "not enough data" label (REQ-044.10)
    and no 10-hand minimum (REQ-031.2). Those belong to the screen stories that use this module.
  - No hand-record persistence and no new record type. TASK-3.9 owns the permanent record; this module takes a
    structural type that today's `CompletedHand` already satisfies.
  - No healthy ranges (REQ-046), no leak detection (REQ-047), no range scaling (REQ-035.2).
  - No changes to the engine, bots, advice or the playtest runner.
  - No filtering by session, seat change or bot replacement (REQ-031.3). Callers choose which hands to pass in.
- Scope budget: files=5, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Percentages are returned as unrounded numbers from 0 to 100 (for example `50`, `33.333…`). `null` means the denominator is 0. Callers round as they need. | yes | REQ-044.11 compares against inclusive limits, so rounding is the caller's choice. The style-bands test already rounds to 0.1 itself (`tests/bots/style-bands.acceptance.test.ts:32`). | Fractions 0..1; values pre-rounded to 0.1. |
| A-2 | `formatStat(value)` returns `—` (U+2014) for `null`, otherwise the whole-number percent with a `%` sign (`Math.round`, for example `50%`, `33%`). | yes | The task requires `—` for a zero denominator (REQ-045.6). Whole percents fit a compact panel. Screen stories can add a decimals option if a storyboard needs one. | One decimal place (`50.0%`); return only the number. |
| A-3 | "Saw the flop" means the hand's board has at least 3 cards and the seat has no preflop `fold` record. A seat that is all-in preflop and gets a runout therefore saw the flop. | yes | The engine deals the flop only when the hand goes past preflop (`src/engine/hand.ts:522-535`, `:550-551`). A preflop fold-out leaves the board empty (`src/engine/hand.ts:466-489`). | Count only seats that acted on the flop (this would leave out all-in players). |
| A-4 | "Reached showdown" means `result.endedBy === 'showdown'` and the seat never folded. This includes seats that mucked, which are missing from `result.showdown` (`src/engine/hand.ts:69-70`). | yes | It is the standard WTSD meaning. `result.showdown` leaves out mucked hands, so using it would undercount. | Count only seats listed in `result.showdown`. |
| A-5 | "Won chips at showdown" means the seat is a winner with `amount > 0` in any `result.awards` entry (main pot, side pot or a split share). An uncalled bet returned to the seat (`result.returned`) is not winnings. | yes | AC#4 says a split pot counts. Awards leave out `returned` (`src/engine/hand.ts:76-79`). | Net chips won > 0 for the hand. |
| A-6 | Aggression counts each postflop action, not each hand: every `bet` or `raise` record on the flop, turn or river adds 1 aggressive, and every `call` adds 1 passive. A short all-in raise (`type: 'raise'`) counts as a raise. A short all-in call counts as a call. Checks and folds don't count. | yes | AC#2 counts actions (3 bets + 1 raise / 8). This matches the existing counter (`tests/bots/style-bands.acceptance.test.ts:57-61`). | Count hands with any postflop aggression. |
| A-7 | A seat counts as dealt in when it appears in `hand.seats`. Asking for a seat that wasn't dealt in adds nothing (all counts are 0). | yes | `CompletedHand.seats` lists only dealt-in seats (`src/table/session.ts:463-475`). So does `HandRecord.seats` (`src/playtest/runner.ts:125-126`). | Throw a `RangeError` for a seat that wasn't dealt in. |
| A-8 | The module lives at `src/stats/style-stats.ts`. | yes | `stats` is already in the headless lint folders and has the 90% coverage gate (`vite.config.ts:18`; `tests/toolchain/headless-lint-dirs.acceptance.test.ts:54`). | `src/advice/style-stats.ts`. |

## 3. Current system
- TypeScript (strict), Vitest 5 with v8 coverage, ESLint + Prettier (`package.json:12-24`). Vitest picks up
  `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`). `*.acceptance.test.ts` files run in `npm test` and in the CI
  `test:sweeps` job (`package.json:15-16`).
- Headless boundary: `src/stats/**` is already in `HEADLESS_DIRS`, so lint rejects UI, React and browser imports
  there (`tests/toolchain/headless-lint-dirs.acceptance.test.ts:53-56`, `tools/lint/headless-boundary.js`).
  Coverage for `src/{engine,bots,advice,stats,playtest,table}/**` must be at least 90% lines (`vite.config.ts:16-19`).
- Hand data (`src/engine/hand.ts`):
  - `ActionRecord` (`:53-61`) has `street` (preflop|flop|turn|river), `seat` and `type` (small-blind|big-blind|fold|check|call|bet|raise),
    plus `amount` and `added`. `HandState.actions` holds the blinds first, then every action (`:101-102`).
  - `HandResult` (`:67-80`) has `endedBy` (`fold`|`showdown`), `showdown` (shown hands only), `awards` (per pot, winners
    with amounts, excluding `returned`) and an optional `returned`.
  - The board is dealt only as streets are reached (`dealNextStreet`, `:522-535`). At showdown, any missing streets
    are dealt first (`:550-551`). A fold-out keeps the board it had (`foldOut`, `:466-489`).
  - Splits: `splitPot` (`:427`) gives each tied winner a share. A side pot with one eligible seat goes to that seat
    (`:563-566`).
  - A small-blind completion is recorded as a preflop `call`. A big-blind option check is recorded as a preflop
    `check`. Legal actions are fold/check/call/bet/raise only (`:331-426`).
- Record types this module must accept:
  - `CompletedHand` (`src/table/session.ts:443-458`) has `seats` (each with `.seat`), `actions`, `board` and `result`.
    It is assignable to `StatHand` without changes.
  - `PlayedHand` (`src/playtest/runner.ts:134-149`) has `record.seats` and `final: HandState`, which has `actions`,
    `board` and a `result` that may be null. Callers adapt it as
    `{ seats: h.record.seats, actions: h.final.actions, board: h.final.board, result: h.final.result }` after checking
    for null.
- Existing private counter: `tests/bots/style-bands.acceptance.test.ts:24-80` (TASK-6.16/6.17, locked). It counts
  dealt, VPIP, PFR and postflop aggressive/passive per bot style. The definitions are the same as REQ-045. It is
  slow and opt-in (`TLH_SLOW_TESTS=1`, in `test:slow`, `package.json:17`), and takes about 2–3 minutes per seed.
- Existing code to reuse:
  - `src/engine/hand.ts` → the `ActionRecord`, `HandResult` and `SeatNumber` types (type-only imports).
  - `src/engine/cards.ts` → the `Card` type for `board`.
  - `src/playtest/runner.ts` → `runPlaytest(options, onHand)` (`:343-347`) for the real-hand cross-check test.
  - `tests/bots/style-bands.acceptance.test.ts` → the counting logic, which moves into the shared module.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The input is a structural `StatHand` with `seats`, `actions`, `board` and `result`, and no new record type. | Take `HandState`; take `CompletedHand`; define a new persisted record. | `CompletedHand` satisfies it as is, and playtest hands need a one-line adapter. TASK-3.9 can keep or extend it without breaking this module. | no | n/a |
| D-2 | Three layers: count one hand (`handStyleCounts`), sum counts (`addStyleCounts`, `styleCounts`), then convert to percentages (`styleStats`). | A single function from a list of hands to stats. | Playtests stream 100,000 hands through `onHand` and group them by style, and the opponent panel adds one hand at a time. Both need counts they can add up. | no | n/a |
| D-3 | Switch `tests/bots/style-bands.acceptance.test.ts` (locked) to the shared functions, keeping its bands, seeds, rounding and test names. | Leave the private counter alone. | REQ-027.6 asks that bot bands use the same Aggression definition. One implementation can't drift from another. | yes (locked-test edit) | user (Q-1, auto-accepted under the unattended rule; unlocked under TASK-6.16) |

## 5. Design

### Files to create / modify
- `src/stats/style-stats.ts` — new. The pure module (type-only imports from `src/engine`).
- `tests/stats/style-stats.acceptance.test.ts` — new. Locked after the first green build (SPEC-01..SPEC-06).
- `tests/stats/style-stats.test.ts` — new. Unit tests (SPEC-07..SPEC-10).
- `tests/bots/style-bands.acceptance.test.ts` — modify (locked; Q-1). Replace the private `Counts`/counting with the
  shared functions (SPEC-11).
- `docs/stats/style-stats.md` — new. The definitions, edge-case rules, API and an example (SPEC-13).

### Components, interfaces and data
```ts
import type { Card } from '../engine/cards';
import type { ActionRecord, HandResult, SeatNumber } from '../engine/hand';

/** A completed hand, as much as the stats need. CompletedHand satisfies it. */
export interface StatHand {
  /** Seats dealt into the hand. */
  readonly seats: readonly { readonly seat: SeatNumber }[];
  /** Blinds first, then every action in order. */
  readonly actions: readonly ActionRecord[];
  /** Community cards dealt (0, 3, 4 or 5). */
  readonly board: readonly Card[];
  readonly result: HandResult;
}

export interface StyleCounts {
  readonly handsDealt: number;        // VPIP/PFR denominator
  readonly voluntary: number;         // VPIP numerator (hands)
  readonly preflopRaised: number;     // PFR numerator (hands)
  readonly postflopAggressive: number; // postflop bet + raise actions
  readonly postflopCalls: number;     // postflop call actions
  readonly sawFlop: number;           // WTSD denominator (hands)
  readonly showdowns: number;         // WTSD numerator, W$SD denominator (hands)
  readonly showdownsWon: number;      // W$SD numerator (hands)
}
export const EMPTY_STYLE_COUNTS: StyleCounts;            // all zeros, frozen

export function handStyleCounts(hand: StatHand, seat: SeatNumber): StyleCounts;
export function addStyleCounts(a: StyleCounts, b: StyleCounts): StyleCounts;
/** Sum of handStyleCounts over hands (EMPTY_STYLE_COUNTS for none). */
export function styleCounts(hands: Iterable<StatHand>, seat: SeatNumber): StyleCounts;

export interface StyleStats {
  readonly vpip: number | null;       // percent 0..100, unrounded; null = zero denominator
  readonly pfr: number | null;
  readonly aggression: number | null;
  readonly wtsd: number | null;
  readonly wsd: number | null;        // W$SD
}
export function styleStats(counts: StyleCounts): StyleStats;

export const NO_STAT = '—';           // U+2014
/** NO_STAT for null, else `${Math.round(value)}%`. */
export function formatStat(value: number | null): string;
```
- Invariants for any sum of real hands: `preflopRaised ≤ voluntary ≤ handsDealt`,
  `showdownsWon ≤ showdowns ≤ sawFlop ≤ handsDealt`. All counts are non-negative integers.
- Functions are pure. They never mutate their inputs and never throw for well-typed input.

### Rules and algorithms
`handStyleCounts(hand, seat)`:
1. If no entry in `hand.seats` has `.seat === seat`, return `EMPTY_STYLE_COUNTS` (A-7).
2. `mine` = the `hand.actions` records whose `seat === seat`. `handsDealt = 1`.
3. `voluntary = 1` if any preflop record in `mine` has type `call` or `raise`. Blinds (`small-blind`, `big-blind`)
   and `check` never count. So a big blind that checks its option is not voluntary, and a small-blind completion
   (a preflop `call`) is.
4. `preflopRaised = 1` if any preflop record in `mine` has type `raise`.
5. For records in `mine` on `flop`, `turn` or `river`: each `bet`/`raise` adds 1 to `postflopAggressive`, and each
   `call` adds 1 to `postflopCalls` (A-6).
6. `folded` = any record in `mine` has type `fold`. `foldedPreflop` = a preflop `fold` is in `mine`.
7. `sawFlop = 1` if `hand.board.length >= 3` and not `foldedPreflop` (A-3).
8. `showdowns = 1` if `hand.result.endedBy === 'showdown'` and not `folded` (A-4).
9. `showdownsWon = 1` if `showdowns === 1` and some `award.winners` entry has `seat === seat` and `amount > 0` (A-5).

`styleStats(c)`, with `pct(n, d) = d === 0 ? null : (n / d) * 100`:
- `vpip = pct(voluntary, handsDealt)`, `pfr = pct(preflopRaised, handsDealt)`,
  `aggression = pct(postflopAggressive, postflopAggressive + postflopCalls)`, `wtsd = pct(showdowns, sawFlop)`,
  `wsd = pct(showdownsWon, showdowns)`.

Worked examples (the AC fixtures):
- AC#1: 10 hands. Called in 3 (one an SB completion), raised in 2, BB check in 1, folded in 4 (the folds include one
  where the seat only posted a blind). Counts: `handsDealt 10, voluntary 5, preflopRaised 2` → VPIP 50, PFR 20.
- AC#2: postflop 3 bets, 1 raise and 4 calls, plus 2 preflop raises → `4 / 8` → 50.
- AC#3: saw the flop in 8 hands, reached showdown in 2 → 25.
- AC#4: 2 showdowns. In one the seat lost. The other was split with another seat (both winners with amount > 0)
  → 50.
- AC#5: no hands → every stat is `null` → `formatStat` gives `—`.

### Error handling and configuration
- No errors are thrown and there is no configuration. A seat that wasn't dealt in counts as nothing.
- Callers must pass only completed hands: `StatHand.result` is non-null by type. A playtest caller skips
  `final.result === null`.

## 6. Behaviour specification

### SPEC-01: VPIP and PFR count voluntary preflop calls and raises
- Verifies: AC#1, DoD#1
- Behaviour: Given 10 hand records for seat 5, in which seat 5 called preflop in 3 hands (one a small-blind
  completion: `small-blind` then preflop `call`), raised preflop in 2, checked the big blind in 1 (`big-blind` then
  preflop `check`, hand continues to the flop) and folded preflop in 4, When `styleStats(styleCounts(hands, 5))` is
  computed, Then `vpip` is 50 and `pfr` is 20, and `formatStat` gives `50%` and `20%`.
- Verification: acceptance `tests/stats/style-stats.acceptance.test.ts::AC#1 VPIP is 50% and PFR is 20% over 10 hands`

### SPEC-02: Aggression is postflop only
- Verifies: AC#2, DoD#1
- Behaviour: Given hand records where seat 5 made 3 postflop bets, 1 postflop raise, 4 postflop calls (spread over
  flop, turn and river), 2 preflop raises and some postflop checks and folds, When Aggression is computed, Then
  `aggression` is 50 (`formatStat` → `50%`).
- Verification: acceptance `tests/stats/style-stats.acceptance.test.ts::AC#2 Aggression is 50% using flop, turn and river actions only`

### SPEC-03: WTSD
- Verifies: AC#3, DoD#1
- Behaviour: Given hand records where seat 5 saw the flop in 8 hands (board of 3+ cards, no preflop fold) and reached
  showdown in 2 of them (`endedBy: 'showdown'`, no fold), plus 2 hands where it folded preflop, When WTSD is computed,
  Then `wtsd` is 25.
- Verification: acceptance `tests/stats/style-stats.acceptance.test.ts::AC#3 WTSD is 25% when 2 of 8 flops reach showdown`

### SPEC-04: W$SD counts a split pot as won
- Verifies: AC#4, DoD#1
- Behaviour: Given 2 showdown hands for seat 5, one where another seat takes the only pot, and one split pot where
  seat 5 and another seat are both winners with a positive amount, When W$SD is computed, Then `wsd` is 50.
- Verification: acceptance `tests/stats/style-stats.acceptance.test.ts::AC#4 W$SD is 50% when one of two showdowns is a split pot`

### SPEC-05: Zero denominators show "—"
- Verifies: AC#5, DoD#1
- Behaviour: Given (a) no hands, (b) hands where seat 5 never saw a flop, (c) hands that saw flops but never reached
  showdown, and (d) hands with no postflop bet, raise or call by seat 5 (only checks), When each affected stat is
  computed, Then it is `null` and `formatStat` returns `—` (U+2014): (a) all five, (b) `wtsd` and `wsd`, (c) `wsd`,
  (d) `aggression`. The other stats in (b)–(d) are numbers.
- Verification: acceptance `tests/stats/style-stats.acceptance.test.ts::AC#5 a stat with a zero denominator shows —`

### SPEC-06: A posted blind is not voluntary
- Verifies: AC#6, DoD#1
- Behaviour: Given one hand where seat 5 posted the big blind and then folded to a raise, and one hand where seat 5
  posted the small blind and folded, When VPIP is computed, Then `vpip` is 0 over 2 hands dealt (`0%`, not `—`).
- Verification: acceptance `tests/stats/style-stats.acceptance.test.ts::AC#6 posting a blind and folding is not VPIP`

### SPEC-07: All-in, runout, mucked and uncalled-bet hands
- Verifies: AC#3, AC#4, DoD#1
- Behaviour: Given the hand records below for seat 5, When counts are computed, Then:
  (a) a seat all-in preflop (call or raise) with a runout to showdown (no flop actions, board of 5) counts for
  `sawFlop`, `showdowns` and `voluntary`;
  (b) a seat that posted an all-in blind and never acted is not voluntary but still counts for `sawFlop` and
  `showdowns`;
  (c) a losing seat that is missing from `result.showdown` (mucked) still counts for `showdowns`, and not as won;
  (d) a seat whose only money back is `result.returned` (uncalled bet) and that is not an award winner is not
  counted as won;
  (e) a seat that wins only a side pot is counted as won;
  (f) a seat that bets the river and everyone folds has `endedBy: 'fold'`, so no showdown, but the bet adds 1 to
  `postflopAggressive`.
- Verification: unit `tests/stats/style-stats.test.ts::edge hands: all-in, runout, muck, returned bet, side pot, fold-out`

### SPEC-08: Seats not dealt in, sums and immutability
- Verifies: AC#5, DoD#1
- Behaviour: `handStyleCounts(hand, 9)` for a seat missing from `hand.seats` equals `EMPTY_STYLE_COUNTS`.
  `addStyleCounts` adds field by field. `styleCounts(hands, seat)` equals the fold of `addStyleCounts` over
  `handStyleCounts`, and `styleCounts([], 5)` equals `EMPTY_STYLE_COUNTS`. Inputs are unchanged, compared by deep
  equality with a `structuredClone` taken before the call. `formatStat(100/3)` is `33%`, `formatStat(0)` is `0%` and
  `formatStat(100)` is `100%`.
- Verification: unit `tests/stats/style-stats.test.ts::undealt seats, sums, purity and formatting`

### SPEC-09: Real engine hands satisfy the count invariants
- Verifies: DoD#1, DoD#4
- Behaviour: Given `runPlaytest({ hands: 300, seed: 42, size: 6 }, onHand)`, where each `PlayedHand` is adapted to
  `StatHand` as in §3 (hands with `final.result === null` skipped), When counts are summed per seat 1..6, Then for
  every seat `preflopRaised ≤ voluntary ≤ handsDealt ≤ 300` and `showdownsWon ≤ showdowns ≤ sawFlop ≤ handsDealt`.
  The sum of `handsDealt` over seats equals the sum of `record.seats.length` over hands. In every
  `endedBy: 'showdown'` hand, at least 2 seats have `showdowns = 1` and at least 1 has `showdownsWon = 1`. In every
  fold-out hand, no seat has `showdowns = 1`.
- Verification: unit `tests/stats/style-stats.test.ts::real playtest hands satisfy the count invariants`

### SPEC-10: CompletedHand is a StatHand
- Verifies: DoD#1, DoD#2
- Behaviour: A `CompletedHand` value from `src/table/session.ts` can be passed to `handStyleCounts` with no adapter,
  checked at compile time by `npm run typecheck`. The test passes a typed `CompletedHand` fixture and checks the
  counts.
- Verification: unit `tests/stats/style-stats.test.ts::a CompletedHand is accepted as a StatHand`

### SPEC-11: Bot style bands use the shared functions (Q-1)
- Verifies: DoD#1, DoD#2
- Behaviour: `tests/bots/style-bands.acceptance.test.ts` no longer defines its own `Counts` or counting loop. For
  each bot seat it calls `handStyleCounts` on the adapted `PlayedHand` and adds the result to that style's total with
  `addStyleCounts`. It turns the totals into percentages with `styleStats`. It keeps the same `BANDS`, seeds
  (42, 7, 1234), hand count, test names, opt-in gate and 0.1 rounding. The rounding is applied to the `styleStats`
  values, and a `null` value fails the test. With `TLH_SLOW_TESTS=1`, seed 42 still passes.
- Verification: command `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts -t "seed 42"`

### SPEC-12: Repo checks, coverage, headless boundary, golden suite, playtest, no network
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors. The golden-spot suite (in
  `npm test`) passes 100%. `src/stats/style-stats.ts` has at least 90% line coverage. It imports only types from
  `src/engine`, with no UI, React, DOM, `node:` or network APIs, and the headless lint passes. Engine, bots and advice
  are unchanged, so `npm run -s playtest -- --hands 10000 --seed 42` reports `Invariant violations: 0`.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-13: Documentation
- Verifies: DoD#11
- Behaviour: `docs/stats/style-stats.md` gives the five formulas, the counting rules A-3..A-7 (blinds, BB check, SB
  completion, all-in/runout, mucked, split/side pot, returned bet, postflop-only aggression), the API with a usage
  example for `CompletedHand` and for playtest `PlayedHand`, and the `—` display rule. The story doc is published to
  Backlog.md by the doit docs step.
- Verification: manual read of `docs/stats/style-stats.md` against this list; `backlog doc list --plain` shows the story doc

### SPEC-14: N/A items and CI
- Verifies: DoD#7, DoD#9, DoD#10, DoD#12
- Behaviour: DoD#7 and DoD#12 are N/A because no screen or dialog changes. DoD#9 is N/A because this is not
  strategy content. CI is green on `doit/TASK-7.12`.
- Verification: manual `gh run list --branch doit/TASK-7.12 --limit 1` shows success

## 7. Edge cases
- No hands, or a seat never dealt in: all counts 0, all stats `null` → `—` (SPEC-05, SPEC-08).
- Big blind checks its option: not VPIP (SPEC-01). Small-blind completion: VPIP (SPEC-01). Blind then fold: not VPIP
  (SPEC-06).
- All-in preflop with runout, and all-in blind with no action: SPEC-07.
- Mucked loser at showdown, split pot, side-pot-only win, uncalled bet returned: SPEC-04, SPEC-07.
- Player folds on the flop: saw the flop, no showdown (SPEC-03 fixtures).
- Multiple postflop actions in one hand (bet, then call a raise): each action counts (SPEC-02).
- Incomplete or abandoned hands: excluded by type (`result` is non-null). Playtest callers skip `final.result === null`
  (§5).
- Concurrency, permissions, interruption, dependency failure: N/A (pure, synchronous, in-memory).

## 8. Security considerations
- Trust boundary: none new. Input is in-memory hand data from the engine or session. When TASK-3.9 loads stored
  records, validating them belongs to that loader.
- No new dependencies, no network, no secrets, no randomness, no injection surface. The display string is either a
  constant or a number with `%`.

## 9. Non-functional
- Cost per hand is linear in the hand's action count. The new unit test file (300 playtest hands) runs in under 2 s
  in `npm test` (Vitest file duration). The acceptance file runs in under 0.5 s.
- The style-bands slow test should take about as long as before (about 2–3 min per seed). It stays opt-in, under
  `test:slow` only.
- Coverage: `src/stats/style-stats.ts` at least 90% lines (the gate in `vite.config.ts:18`).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/stats/` (a library module with no app entry point; this runs its suite)
- New tests:
  - `tests/stats/style-stats.acceptance.test.ts` → SPEC-01..SPEC-06 (locked after the first green build)
  - `tests/stats/style-stats.test.ts` → SPEC-07..SPEC-10
- Locked tests re-pinned: `tests/bots/style-bands.acceptance.test.ts` (Q-1). Only the counting is replaced; bands,
  seeds and names stay the same.
- Judge end-to-end:
  1. Run `npx vitest run tests/stats/` and confirm every AC test passes.
  2. Read the AC#1 fixture: the SB completion is a `call` after `small-blind`, the BB check is a `check` after
     `big-blind`, and VPIP 50 / PFR 20 come from 5/10 and 2/10.
  3. Run `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts -t "seed 42"` and confirm it passes
     with printed values in the bands.
  4. Run `npm run lint && npm run typecheck && npm test`.

## 11. Open questions
- None. Q-1 (switch style-bands to the shared functions) was accepted as recommended; see `doit/TASK-7.12/qa.md`.

## 12. Clarifications log
See `doit/TASK-7.12/qa.md`.
