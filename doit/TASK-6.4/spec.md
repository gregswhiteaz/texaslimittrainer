# Spec: TASK-6.4 — Face a Maniac that bets and raises where TAG would check or call

Status: READY (approved 2026-11-21)
Task: TASK-6.4 · Parent/epic: TASK-6 · Requirements: REQ-026 (026.2, 026.3); band context REQ-027.3, REQ-027.6 · Dream: limit-holdem-trainer

## 1. Summary
This task adds the Maniac (loose-aggressive) bot. Like the Calling station (TASK-6.3), it starts from the advice
engine's evaluation and applies deviations stored in its own style data file. Where the advice is check, it bets
(or raises at the big blind's preflop option) with the file's probability. Where the advice is call, it raises
with the file's probability. When the aggressive move isn't legal (capped street), it calls. Each deviating
decision takes exactly one draw from the per-decision seeded generator (TASK-6.18). The task widens the
`deviations` format so it can express aggressive replacements, ships `maniac.json`, adds `decideManiac`, and (Q-3)
routes the worker's `'Maniac'` seats to it.

## 2. Scope
- In scope:
  - `src/bots/style.ts`: widen `DeviationAdvice`, add `DeviationInstead`, accept the five new (street, advice,
    instead) triples of D-1. Existing validation rules and messages stay as they are.
  - `src/bots/styles/maniac.json` (new): description, no mixed spots, the deviations of D-2 with justifications.
  - `src/bots/maniac.ts` (new): `MANIAC_STYLE` (validated at import), `ManiacOptions`, `decideManiac`.
  - `src/table/advice-service.ts`: `decideBotDefault` sends `'Maniac'` to `decideManiac` (D-3).
  - Tests for AC#1–AC#5, plus the validator, draw and dispatch units.
- Not doing:
  - Changing TAG's or the Calling station's decision, `tag.json`, `calling-station.json`, the preflop chart, the
    advice engine, seed derivation or the worker protocol.
  - Seating Maniacs in any line-up. The app's default line-up stays all TAG (`src/table/session.ts:60-67`), and the
    playtest default stays all seeded TAG (`src/playtest/runner.ts:137-140`). Presets and `--lineup` are TASK-6.6.
    So the 6-max playtest baseline stays byte-identical (SPEC-08).
  - A playtest policy export for the Maniac. Tests build it inline, and TASK-6.6 adds the real one.
  - Measuring or asserting the VPIP/PFR/aggression band (TASK-6.11 / TASK-6.17). Measured values appear here only as
    rationale for D-2.
  - Postflop deviations where the advice is fold. The Maniac folds postflop when the pot odds say fold.
  - Rock (TASK-6.5), `stepBot`'s default policy (TASK-6.22), UI or user-visible app text. The description isn't
    shown anywhere yet.
  - Editing, deleting or loosening any locked test. None needs to change (§5 "Locked tests").
- Scope concerns (for follow-ups, not done here):
  - Postflop advice is only fold/check/call (`src/advice/postflop.ts:6`). Value betting arrives with TASK-7.8. So
    every postflop bet or raise at the table today comes from Maniac deviations. A lone Maniac among TAGs never faces
    a postflop bet, so it never calls postflop and its measured aggression is 100%, above the 65–85% band
    (REQ-027.3). With two Maniacs it's 84.9%, and with six it's 65.4% (D-2). Whether the band holds depends on the
    line-up and on TASK-7.8. This affects TASK-6.11/TASK-6.17 (band proof) and should be re-measured once TASK-7.8
    lands.
  - Seated Maniacs make TAG and Calling station seats face postflop bets for the first time. Postflop equity runs
    (about 10 ms each) then dominate run time. A 10,000-hand table with two Maniacs took 168 s in the prototype,
    against about 1 s for all TAG. TASK-6.6 (`--lineup`) and the CI speed plan should plan for this.
- Scope budget: files=8, lines=750

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `decideManiac(view)` with no `random` returns the advice's move and never deviates. Every production path passes a generator. | yes | Mirrors `decideTag` (`src/bots/tag.ts:39`) and `decideCallingStation` (`src/bots/calling-station.ts:39`). | Make `random` required |
| A-2 | A deviating decision is one where the style has a deviation for (street class, advice action) and a generator was passed. It takes exactly one `nextUint32()` draw `u` and deviates iff `u < probability × 2^32`, using the existing `drawDeviation` (`src/bots/style.ts:234-236`), even at probability 0 or 1. Every other decision draws nothing. This includes a draw at capped views, where a "deviation" still ends in a call (AC#5). | yes | Same rule as TASK-6.3 A-2. Each decision has its own fresh generator, so draw counts can't leak between decisions. | Skip the draw when the aggressive move is illegal |
| A-3 | The Maniac takes no TAG-style mixing: `"mixedSpots": []`, and `decideManiac` doesn't read `mixedSpots`. | yes | REQ-026.2 defines the Maniac by its deviations alone (same as TASK-6.3 A-3). | Mix when no deviation applies |
| A-4 | In AC#2, "bets" means takes the aggressive move with no bet to face: `bet` postflop, and `raise` at the big blind's preflop option in a limped pot (the only preflop no-bet-to-face spot, where the engine offers check or raise: `src/engine/hand.ts:345-347`). The test counts actions of type `bet` or `raise`. | yes | Preflop, a "bet" isn't a legal action type once the blinds are in. The raise is the same aggressive choice. | Postflop-only check points |
| A-5 | `decideManiac` accepts an optional `style: BotStyleData` (default `MANIAC_STYLE`). AC#4's test changes the probability in a copy of the file's JSON, parses it with `parseStyle`, and passes it in. No code changes. | yes | Same seam as TASK-6.3 A-6. A test can't rewrite the bundled JSON import. | Temp file plus re-import |
| A-6 | The AC#2/AC#3/AC#4 tests pass both bots the same deterministic `equity` option, a test-only memo of `computeEquity` that returns exactly its result. | yes | Same as TASK-6.3 A-7. Without it, the 107 postflop call views cost about 10 ms per decision. | Preflop-only points |
| A-7 | AC#4's "raise probability" is the `preflop`/`call` → `raise` entry. The test changes it from 0.6 to 0.2. | yes | It's the raise deviation AC#3 measures that is purely preflop, so its effect is cheap to replay. Any raise entry would satisfy the AC. | The `postflop`/`call` entry |
| A-8 | The invariant run with seated Maniacs in the normal suite is 200 hands (about 3 s). The 10,000-hand seated run (0 violations, 125,799 actions, 168 s) is recorded here as prototype evidence and isn't repeated in CI. DoD#6's 10,000-hand playtest is the default CLI run (SPEC-08). | yes | 10,000 seated hands take about 3 minutes because of postflop equity runs (scope concern 2). | `TLH_SLOW_TESTS`-gated 10,000-hand test |

## 3. Current system
- Style format: `src/bots/style.ts:28-34` `DeviationStreet`, `DeviationAdvice` (`'fold' | 'raise'`) and
  `DEVIATION_PAIRS` (three triples). `:37-43` `Deviation` (`instead: 'call'`). `:162-205` deviation validation,
  where only the triple check (`:169-178`) and the stored `instead: 'call'` (`:200`) depend on the supported set.
  `:225-236` `findDeviation`, `drawDeviation`.
- Calling station: `src/bots/calling-station.ts:27-48`. The pattern to mirror is a free postflop check shortcut, then
  `recommend`, then at most one draw. The JSON import goes last (`:6-7`).
- TAG: `src/bots/tag.ts:13-15` `BotRandom`, `:21-24` `FREE_CHECK_EQUITY`, `:31-48` `decideTag`.
- Advice: preflop actions are `fold|check|call|raise`, with `legal()` at `src/advice/preflop.ts:93-96`. It turns a
  chart raise into call when the street is capped or raise isn't legal, and anything but raise into check when nothing
  is owed. So a preflop `check` only occurs with owed 0 (big blind's option), and a preflop `call` at the cap is
  common. Postflop advice is only `fold|check|call` (`src/advice/postflop.ts:6`). `check-free` comes first, so
  postflop owed 0 always gives `check`.
- Engine legal actions (`src/engine/hand.ts:331-352`): with owed > 0 it's fold, call, plus raise if `canAggress`.
  With owed 0 and `currentBet > 0`, it's check plus raise. With `currentBet === 0`, it's check plus bet.
  `canAggress` is false at `betCount === 4` (cap), after the seat has acted since the last full raise (REQ-016.5),
  or when the stack can't go above the current bet.
- Worker: `src/table/advice-service.ts:44-48` `decideBotDefault` (`'Calling station'` → station, else TAG).
  `tests/table/advice-service.test.ts:103` (unit, not locked) asserts `'Maniac'` → `decideTag` today. It changes
  under D-3.
- `tests/bots/style.test.ts:223-225` (unit, not locked) asserts `preflop/fold/raise` is unsupported. Under D-1 that
  triple becomes supported, so the case changes to another unsupported triple (`preflop`/`fold` to `bet`). The test
  stays as strict.
- `'Maniac'` seats exist only in `tests/support/table-scenarios.ts:29` (storyboard line-up). No test that uses it
  runs bot decisions through the worker's default dispatch (grep: the tests use `stepBot`/`tagPolicy` or injected
  `decideBot`). The e2e workers either inject `decideBot` (`e2e/support/pace-advice.worker.ts:21`) or play the
  default all-TAG line-up.
- Seeds: `src/engine/bot-random.ts:21-40` `botDecisionIndex`, `botDecisionSeed`, `botRandom`.
- Playtest: `src/playtest/runner.ts:302` `runPlaytest`, `:143` `handReplayCode`. `src/playtest/policy.ts:10-22`
  `seededTagPolicy`, `randomMovePolicy`, `seatGenerator`.
- Tests: Vitest (`npm test` = `vitest run --coverage`). The bots import-boundary test discovers every
  `src/bots/*.ts` (`tests/bots/tag.test.ts:148-154`).
- Existing code to reuse:
  - `src/bots/style.ts` `parseStyle`, `findDeviation`, `drawDeviation`, `StyleValidationError` → extend the
    supported triples rather than writing a second validator or draw.
  - `src/bots/tag.ts` `FREE_CHECK_EQUITY`, `BotRandom` → the free-check shortcut and options type.
  - `src/bots/calling-station.ts` → the structure of `decideManiac` and its options seam.
  - `tests/bots/calling-station.acceptance.test.ts` → the view-collection, `at()`, equity memo and `problemsOf`
    patterns (copied into the new test file, which can't import from a locked test).
  - `src/engine/bot-random.ts`, `src/playtest/policy.ts`, `src/playtest/runner.ts` → seeds, policies and runs.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Format extension: keep `tlh-bot-style` version 1 and the `deviations` entry shape. `DeviationAdvice` becomes `'fold' \| 'raise' \| 'check' \| 'call'`, and `instead` becomes `'call' \| 'bet' \| 'raise'`. Supported triples are the existing `preflop/fold/call`, `preflop/raise/call`, `postflop/fold/call`, plus new `preflop/fold/raise`, `preflop/check/raise`, `preflop/call/raise`, `postflop/check/bet` and `postflop/call/raise`. Each (street, advice) still appears at most once per file. Messages are unchanged. | A `version: 2` with an `"aggressive"` keyword; multiple `instead` options per (street, advice) with split probabilities; separate Maniac-only keys | It's the minimal change, it's additive, and it names the actual replacement action. The only lost rejection, `preflop/fold/raise`, is a unit case that moves to another unsupported triple. | yes | user (Q-1, auto-accepted) |
| D-2 | Maniac parameters: preflop fold→raise **0.45**, preflop call→raise **0.6**, preflop check→raise **0.6**, postflop check→bet **0.85**, postflop call→raise **0.85**. Description and justifications are in §5. | Without preflop fold→raise (measured VPIP 22.4%, far below 50–75); 0.4/0.5/0.5/0.8/0.8; 0.5/0.6/0.6/0.85/0.85 | Prototype of D-4, seed 42, 6-max, seeded TAG in the other seats. Two Maniacs (seats 2, 4), 10,000 hands: VPIP 56.0%, PFR 53.3%, aggression 84.9%, 0 violations. One Maniac (seat 2), 600 hands: VPIP 54.0%, PFR 51.5%, aggression 100% (scope concern 1). Six Maniacs, 600 hands: VPIP 55.3%, PFR 42.8%, aggression 65.4%. VPIP and PFR sit inside REQ-027.3 (50–75 / 35–60) in every line-up. 0.45 balances the margins: higher pushes PFR toward 60, lower pulls VPIP toward 50 (0.4 gave 51.0%). Postflop 0.85 keeps aggression inside 65–85 for both multi-Maniac line-ups, while 0.8 gave 64.2% with six. | yes | user (Q-2, auto-accepted) |
| D-3 | Worker wiring: `decideBotDefault` returns `decideManiac(view, { random })` for `'Maniac'`, `decideCallingStation` for `'Calling station'`, and `decideTag` otherwise. | Defer to TASK-6.6 | REQ-026 asks each bot to act "modified by its style's documented parameters", and `style` already reaches the worker. No locked test asserts a `'Maniac'` result. The one unit assertion (`tests/table/advice-service.test.ts:103`) is updated to the new expectation. The default line-up has no Maniac. | yes | user (Q-3, auto-accepted) |
| D-4 | Decision rule `decideManiac` (§5 "Rules"): free postflop check shortcut for the advice, then at most one deviation draw, then the file's `instead` if legal, else the legal call when a bet is owed (AC#5), else the advice's move. This applies to every deviation, so a preflop fold→raise at the cap becomes a call. | Keep the advice (fold) when the raise is illegal | AC#5: "When it chooses to be aggressive, Then it calls". One uniform rule covers the cap, the REQ-016.5 no-re-raise rule and short stacks. | no | n/a |
| D-5 | Decision points: views collected once (§5), point i (0..9999) = `views[i mod n]` with code `handReplayCode(6401, i+1)` (check), `6402` (call) or `6403` (capped). Each bot gets a fresh `botRandom(botDecisionSeed(code, view))`. | 10,000 distinct hands | Same pattern as TASK-6.3 D-5, already proven fast. Measured: collection 1.9 s, 30,000 Maniac plus 20,000 TAG decisions 1.4 s with memoized equity. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/style.ts` — widen `DeviationAdvice`, add `DeviationInstead`, the five new triples, store `instead` as read.
- `src/bots/styles/maniac.json` — new: the Maniac's style file.
- `src/bots/maniac.ts` — new: `MANIAC_STYLE`, `ManiacOptions`, `decideManiac`.
- `src/table/advice-service.ts` — D-3 dispatch and its comment.
- `tests/bots/maniac.acceptance.test.ts` — new (SPEC-01..SPEC-06).
- `tests/bots/maniac.test.ts` — new unit (SPEC-08 seated run, SPEC-09).
- `tests/bots/style.test.ts` — extend (SPEC-07). Change the `preflop/fold/raise` case to `preflop/fold/bet`.
- `tests/table/advice-service.test.ts` — extend (SPEC-10). `'Maniac'` leaves the TAG list at `:103`.

### Components, interfaces and data
`src/bots/style.ts` changes:
```ts
export type DeviationAdvice = 'fold' | 'raise' | 'check' | 'call';
export type DeviationInstead = 'call' | 'bet' | 'raise';
const DEVIATION_PAIRS = [ 'preflop/fold/call', 'preflop/raise/call', 'postflop/fold/call',
  'preflop/fold/raise', 'preflop/check/raise', 'preflop/call/raise', 'postflop/check/bet', 'postflop/call/raise' ];
export interface Deviation { /* street, advice: DeviationAdvice, */ readonly instead: DeviationInstead; /* probability, justification */ }
```
The stored entry keeps `instead` as read from the file (it's already validated by the triple check).

`src/bots/maniac.ts` (imports: engine types only, `recommend`, `./style`, `./tag` for `FREE_CHECK_EQUITY` and
`BotRandom`. The JSON import goes **last**):
```ts
export const MANIAC_STYLE: BotStyleData; // parseStyle(maniac, 'maniac.json') at import
export type ManiacOptions = RecommendOptions & {
  readonly random?: BotRandom;
  readonly style?: BotStyleData; // default MANIAC_STYLE (A-5)
};
export function decideManiac(view: PlayerView, options?: ManiacOptions): Action;
```
`src/bots/styles/maniac.json` (original text; approved Q-2):
```json
{
  "format": "tlh-bot-style",
  "version": 1,
  "style": "Maniac",
  "description": "Maniac (loose-aggressive) plays far too many hands and bets and raises far too often. It starts from the trainer's own advice, like TAG, but often raises hands the advice folds, raises where the advice only calls, and bets most of the time when everyone checks to it. It still calls when the betting is capped and folds after the flop when the price is clearly wrong. Call it down with good hands and re-raise your strong ones.",
  "mixedSpots": [],
  "deviations": [
    {
      "street": "preflop",
      "advice": "fold",
      "instead": "raise",
      "probability": 0.45,
      "justification": "Raising nearly half of the hands the chart folds against a bet more than doubles TAG's starting range and makes most of those entries raises, which puts the Maniac's VPIP and PFR inside their bands."
    },
    {
      "street": "preflop",
      "advice": "call",
      "instead": "raise",
      "probability": 0.6,
      "justification": "Turning most of the chart's calls into raises means the Maniac rarely just calls before the flop, so its raises carry little information about its hand strength."
    },
    {
      "street": "preflop",
      "advice": "check",
      "instead": "raise",
      "probability": 0.6,
      "justification": "In the big blind with only limpers in, the Maniac usually raises its free option, punishing limps and building pots it cannot win on hand strength alone."
    },
    {
      "street": "postflop",
      "advice": "check",
      "instead": "bet",
      "probability": 0.85,
      "justification": "Betting almost every time it is checked to, whatever it holds, is the Maniac's defining leak: its bets show no strength, so the learner should call down lighter."
    },
    {
      "street": "postflop",
      "advice": "call",
      "instead": "raise",
      "probability": 0.85,
      "justification": "Raising most bets it would call keeps the pot growing with drawing and medium hands, so the learner gets value by letting the Maniac raise into strong hands."
    }
  ]
}
```

### Rules and algorithms
- Validation: unchanged rules and messages (TASK-6.3 §5), with the eight supported triples of D-1. Example: `{street:
  "postflop", advice: "fold", instead: "raise"}` is still rejected as `<file>: style S has unsupported deviation
  "postflop" "fold" to "raise"`.
- Decision `decideManiac(view, options = {})`, with `style = options.style ?? MANIAC_STYLE`, `owed =
  view.currentBet − hero.streetContribution`, and `street = 'preflop'` if `view.street === 'preflop'`, else
  `'postflop'`:
  1. `advice = recommend(view, {...options, equity: FREE_CHECK_EQUITY})` if postflop and `owed === 0` (always
     `check`, no equity run), else `recommend(view, options)`.
  2. `options.random` undefined → `advice.move` (A-1).
  3. `dev = findDeviation(style, street, advice.action)`. Undefined → `advice.move`, no draw.
  4. One draw: `drawDeviation(dev.probability, random)` false → `advice.move`.
  5. True → the element of `view.legalActions` whose type is `dev.instead`. If it's absent → the legal `call` if
     present (cap, REQ-016.5, short stack; AC#5). Otherwise → `advice.move`.
  - Consequences: the Maniac never plays an illegal action (every result comes from `view.legalActions` or is
    `advice.move`). It never folds with owed 0, since the advice never does. At a capped street it can't raise, and
    an aggressive draw gives the call.
  - Thresholds (`u < p × 2^32`): 0.45 → `u < 1932735283.2`. 0.6 → `u < 2576980377.6`. 0.85 → `u < 3650722201.6`.
    0.2 → `u < 858993459.2`.
- Decision points (D-5), collected once per test file: `runPlaytest({hands: 200, seed: 61, size: 6}, undefined,
  {makePolicy})`. Seat 1 plays `seededTagPolicy(code)` and records each view before acting. Every other seat plays
  `randomMovePolicy(seatGenerator(code, seat))`. A recorded view `v` with `a = recommend(v, {equity})` goes into:
  `check` if owed === 0 and `a.action === 'check'`; `call` if owed > 0 and `a.action === 'call'`; `capped` if
  owed > 0 and `v.betCount === 4`. Prototype counts: check 85 (6 preflop, 79 postflop), call 152 (45 preflop, 107
  postflop), capped 36 (29 preflop: 22 call and 7 fold advice; 7 postflop, all call advice). The run reports 0
  violations.
- Hand-worked deviating decisions (prototype of this exact rule with the D-2 values, against HEAD `e6efdf3`):
  - **Example A (postflop check → bet).** `check[0]`: seat 1, flop, 7h Qh, currentBet 0, betCount 0, k = 1. Code
    `handReplayCode(6401, 1)` = `00000000000019010000000000000001`, seed `2616838482`, u `2049462343` <
    3650722201.6. The Maniac plays `{seat: 1, type: 'bet', amount: 4}` and TAG plays `{seat: 1, type: 'check'}`.
  - **Example B (preflop call → raise).** `call[3]`: seat 1, preflop, Th 8c (T8o), currentBet 8, betCount 2, owed 4,
    k = 0. Code `handReplayCode(6402, 4)` = `00000000000019020000000000000004`, seed `4056530141`, u `1325301165` <
    2576980377.6. The Maniac plays `{seat: 1, type: 'raise', amount: 12}` and TAG plays `{seat: 1, type: 'call',
    amount: 4}`.
  - **Example C (postflop call → raise).** `call[1]`: seat 1, turn, 7h Qh, currentBet 8, betCount 1, owed 8, k = 2.
    Code `handReplayCode(6402, 2)` = `00000000000019020000000000000002`, seed `3418715972`, u `3612399516` <
    3650722201.6. The Maniac plays `{seat: 1, type: 'raise', amount: 16}` and TAG plays `{seat: 1, type: 'call',
    amount: 8}`.
  - **Example D (no deviation).** `check[1]`: seat 1, turn, Th 8c, code `handReplayCode(6401, 2)`, seed
    `3001163493`, u `4068788660` ≥ 3650722201.6, so both check.
  - **Example E (big blind's option, check → raise).** `check[7]`: seat 1, preflop, Js Td (JTo), currentBet 4,
    betCount 1, owed 0, k = 0. Code `handReplayCode(6401, 8)` = `00000000000019010000000000000008`, seed
    `1511878864`, u `1323660680` < 2576980377.6. The Maniac plays `{seat: 1, type: 'raise', amount: 8}` and TAG checks.
  - **Example F (capped, advice fold).** `capped[1]`: seat 1, preflop, 8s 2h (82o), currentBet 16, betCount 4, owed
    14, k = 0, legal fold and call 14 only. Code `handReplayCode(6403, 2)` = `00000000000019030000000000000002`, seed
    `2743905521`, u `1644137980` < 1932735283.2, so the draw is aggressive. The raise isn't legal, so the Maniac plays
    `{seat: 1, type: 'call', amount: 14}`. TAG folds.
  - **Example G (capped, advice call).** `capped[0]`: preflop, 7h Qh, currentBet 16, betCount 4, owed 16. Under
    `handReplayCode(6403, 181)` (`…190300000000000000b5`, seed `2161863358`, u `405360754`, aggressive), it plays
    `{seat: 1, type: 'call', amount: 16}`. Under `handReplayCode(6403, 1)` (seed `2624173068`, u `3679267233`, not
    aggressive), it also calls 16.
- Measured over the D-5 points (prototype): AC#2 Maniac bets/raises 8235 vs TAG 0. AC#3 Maniac raises 6524 vs TAG
  13. AC#4 with preflop call→raise at 0.2: 5881 raises. Capped 10,000 points: 8902 calls, 1098 folds, 0 raises, all
  legal. If Q-2 changes the values, the builder records the new numbers and examples in `build-log.md`. The tests
  assert the relations below, not these exact counts, except where an example's values are pinned.

### Locked tests
None change. `tests/bots/calling-station.acceptance.test.ts` (TASK-6.3) asserts the station's own deviations and its
own rejection messages (`invalid probability`, `description`), and both still hold. It doesn't assert
`preflop/fold/raise` is unsupported. `tests/bots/tag-mixing.acceptance.test.ts:88` is unaffected (TAG has no
deviations). `tests/bots/bot-random.acceptance.test.ts` calls `decideTag` directly. The two unit tests that change
(`tests/bots/style.test.ts:223-225`, `tests/table/advice-service.test.ts:103`) are not locked, and each change
swaps one assertion for an equally strict one (§3).

### Error handling and configuration
- A bad shipped `maniac.json` throws `StyleValidationError` at import of `src/bots/maniac.ts` (and, after D-3, of the
  worker module), so every test that loads it fails.
- `recommend` errors propagate. Seed errors are unchanged (`RangeError` from `botRandom`, worker `TypeError`).

## 6. Behaviour specification

### SPEC-01: The Maniac's style file holds its deviations and a description
- Verifies: AC#1, DoD#9
- Behaviour: Given `src/bots/styles/maniac.json`, When `src/bots/maniac.ts` is imported, Then `MANIAC_STYLE.style
  === 'Maniac'`, its description has at least 15 words, `mixedSpots.size === 0`, and `deviations` equals (ignoring
  justifications) `[{preflop, fold, raise, 0.45}, {preflop, call, raise, 0.6}, {preflop, check, raise, 0.6},
  {postflop, check, bet, 0.85}, {postflop, call, raise, 0.85}]` (as `{street, advice, instead, probability}`), each
  with a justification of at least 10 words. `parseStyle(raw, 'maniac.json')` equals `MANIAC_STYLE`. With
  `description` removed, the problems contain `maniac.json: style has no plain-English description (at least 15
  words)`. With the `postflop`/`call` entry's probability set to `1.5`, the problems are exactly `['maniac.json: style
  Maniac deviation postflop call has an invalid probability']`.
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::the Maniac style file holds its deviation parameters and a description`

### SPEC-02: With no bet to face where the advice is check, the Maniac bets more often than TAG
- Verifies: AC#2, DoD#1
- Behaviour: Given the 10,000 check points of D-5 (code `handReplayCode(6401, i+1)`), When the Maniac acts with
  `decideManiac(view, {random: botRandom(seed), equity})` and TAG with `decideTag(view, {random: botRandom(seed),
  equity})`, where `seed = botDecisionSeed(code, view)`, Then every point has owed 0 and `recommend(view).action ===
  'check'`. The points include at least one preflop and one postflop view. The Maniac's count of `bet` or `raise`
  actions (A-4) is greater than TAG's. Every Maniac action is either the legal check or the legal bet/raise. Example
  A gives the bet of 4 (TAG checks), Example D a check, and Example E the raise to 8.
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::with no bet to face where the advice is check the Maniac bets at more points than TAG`

### SPEC-03: Where the advice is call, the Maniac raises more often than TAG
- Verifies: AC#3, DoD#1
- Behaviour: Given the 10,000 call points of D-5 (owed > 0, `recommend(view).action === 'call'`, code
  `handReplayCode(6402, i+1)`), When both bots act as in SPEC-02, Then the points include preflop and postflop views,
  the Maniac's `raise` count is greater than TAG's, and every Maniac action is either the legal call or the legal
  raise. Example B gives the Maniac `{seat:1, type:'raise', amount:12}` vs TAG's call of 4. Example C gives
  `{seat:1, type:'raise', amount:16}` vs TAG's call of 8.
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::where the advice is call the Maniac raises at more points than TAG`

### SPEC-04: Changing the file's raise probability changes the raise rate with no code change
- Verifies: AC#4
- Behaviour: Given a deep copy of the Maniac's raw JSON with the `preflop`/`call` deviation's probability changed from
  0.6 to 0.2 (A-7), parsed with `parseStyle(copy, 'maniac.json')`, When the same 10,000 call points of SPEC-03 are
  replayed with `decideManiac(view, {random, equity, style: modified})`, Then the raise count differs from the
  unmodified run's, and it's lower. A copy with that probability set to 0 gives the same raise count as a copy with the
  entry removed. A copy with probability 1 makes every preflop call point whose `legalActions` include a raise play
  that raise.
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::changing the file's raise probability changes the raise rate with no code change`

### SPEC-05: On a capped street an aggressive Maniac calls, and the action is legal
- Verifies: AC#5
- Behaviour: Given the capped views of D-5 (owed > 0, `betCount === 4`, no legal raise), each with advice `call` or
  preflop `fold`, When the Maniac decides each with a generator whose `nextUint32` always returns 0 (it always
  chooses to be aggressive), Then every action is exactly the view's legal call. When the Maniac decides the 10,000
  capped points under `handReplayCode(6403, i+1)` with seeded generators, Then every action is an element of
  `view.legalActions`, none is a raise, and every action that differs from the advice's move is the legal call.
  Example F gives `{seat:1, type:'call', amount:14}` (TAG folds). Example G gives the call of 16 under both codes.
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::on a capped street an aggressive Maniac calls and the action is legal`

### SPEC-06: A Maniac seat in the app's worker plays the Maniac decision
- Verifies: AC#2, AC#3
- Behaviour: Given Example B's view and seed `4056530141`, When `handleAdviceRequest({id: 1, kind: 'bot', view, style:
  'Maniac', seed: 4056530141})` runs, Then it returns `{id: 1, ok: true, value: {seat: 1, type: 'raise', amount:
  12}}`. With `style: 'TAG'` it returns the call of 4. Over the D-5 check points, the worker's `'Maniac'` answer
  equals `decideManiac(view, {random: botRandom(seed)})` at every point. (D-3, approved Q-3.)
- Verification: acceptance `tests/bots/maniac.acceptance.test.ts::a Maniac seat in the worker plays the Maniac decision`

### SPEC-07: The validator accepts the new triples and still rejects everything else
- Verifies: AC#1
- Behaviour: A file with each of the five new triples (and probability 0.5, a 10-word justification) parses, and the
  entry keeps its `instead`. These are rejected with exactly the unsupported-deviation message: `preflop`/`fold` to
  `bet`, `postflop`/`fold` to `raise`, `postflop`/`check` to `raise`, `preflop`/`check` to `bet`, `postflop`/`raise`
  to `call`, `preflop`/`call` to `call`. A repeated `postflop`/`call` gives `lists deviation postflop call twice`,
  even with different `instead` values. The existing TASK-6.3 cases still pass, with the `preflop/fold/raise` case
  replaced by `preflop/fold/bet`. `tag.json` and `calling-station.json` parse unchanged. `findDeviation(MANIAC_STYLE,
  'postflop', 'check')` returns the bet entry, and `findDeviation(MANIAC_STYLE, 'postflop', 'fold')` returns
  `undefined`.
- Verification: unit `tests/bots/style.test.ts::parseStyle validates deviations`

### SPEC-08: The default playtest baseline is unchanged, and seated Maniacs break no invariant
- Verifies: DoD#6
- Behaviour: `npm run -s playtest -- --hands 10000 --seed 42 --size 6` still prints `Player actions: 88920` and
  `Invariant violations: 0`, and its stdout SHA-256 is
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`. Also, a `runPlaytest({hands: 200, seed: 42,
  size: 6})` with seats 2 and 4 playing the seeded Maniac (`decideManiac(view, {random:
  botRandom(botDecisionSeed(code, view))})`) and the rest `seededTagPolicy` reports `violations === 0`, and the
  Maniac seats played at least one `bet` (A-8; prototype 10,000 hands: 0 violations).
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-09: Draw counts, the fallback and the no-generator path
- Verifies: AC#2, AC#3, AC#5
- Behaviour: With a counting stub generator, exactly one `nextUint32` call happens at Examples A–G's views. Zero calls
  happen at a postflop view facing a bet whose advice is `fold`, at a preflop view whose advice is `raise`, and at any
  view when the style has no deviations. `decideManiac(view)` with no `random` at Example B returns the call of 4
  (A-1). With a stub returning 0: Example F's view gives the call of 14, and a view where `bet` isn't legal but owed
  is 0 would give the advice's move (tested with a hand-built `legalActions` of only `check`). The seated 200-hand run
  of SPEC-08 is in this file.
- Verification: unit `tests/bots/maniac.test.ts::Maniac draws once only at deviating decisions`

### SPEC-10: Worker default dispatch by style
- Verifies: AC#5
- Behaviour: `handleAdviceRequest` with no `deps` and `style: 'Maniac'` returns `decideManiac(view, {random:
  botRandom(seed)})` at the preflop and flop views of the test and seeds 0, 12345 and 4294967295. `'Calling station'`
  still returns `decideCallingStation`, and `'TAG'` and `'Rock'` still return `decideTag`.
- Verification: unit `tests/table/advice-service.test.ts::default bot decision dispatches the Maniac`

### SPEC-11: Checks, coverage, boundaries, CI and documentation
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#7, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, and the coverage thresholds
  hold (≥ 90% engine/bots/advice/statistics, ≥ 70% overall). The bots import-boundary test passes for
  `src/bots/maniac.ts`: engine imports are type-only, there's no UI import, and the JSON import comes last. The
  REQ-028.1 lint guard (`src/bots/**`) is clean. CI is green on `doit/TASK-6.4`. A story doc is published with
  `backlog doc`. It covers the widened triples, the Maniac's parameters with justifications, the decision rule with
  Examples A, B and F, the measured VPIP/PFR/aggression from D-2, and both scope concerns. Not applicable: DoD#3 (no
  golden-spot suite yet, E07-S14), DoD#7 and DoD#12 (no screen or dialog), DoD#8 (no network code; pure computation
  over bundled JSON). DoD#9: the description and every deviation carry original justification text, enforced by the
  validator.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Capped street (betCount 4): raise is illegal, so an aggressive draw gives the call (SPEC-05, Examples F and G).
- Not capped, but raise illegal (seat already acted since the last full raise, REQ-016.5, or a stack too short to
  raise): same fallback to the legal call (D-4). Short all-in call: the legal `call` from `legalActions` is used as is.
- Owed 0 with `bet` illegal (stack can't bet): there's no call to fall back to, so it plays the advice's check (SPEC-09).
- Preflop check advice only arises at the big blind's option. It deviates to raise (Example E).
- Postflop fold advice: no deviation, so it folds. Preflop raise advice: no deviation, so it raises (SPEC-09: no draw).
- Probability 0 or 1: valid, and still one draw (A-2). SPEC-04 covers both.
- No generator: no deviation (A-1).
- Concurrency, interruption, permissions, dependency failure: N/A. This is pure computation over bundled data.

## 8. Security considerations
- Trust boundary: style files are bundled, authored data. They're still validated at import (fail closed), with echoes
  cut to 20 characters. Worker requests are validated as before, and `style` only selects among three functions.
  Unknown values fall through to TAG.
- Hidden information: the decision reads only the bot's `PlayerView` and its seeded generator.
- Randomness: the non-cryptographic seeded PRNG is deliberate (reproducibility, REQ-028). No `Math.random`/`Date`
  (the lint guard covers `src/bots/**`).
- New dependencies, secrets, authn, injection, logs: none / N/A.

## 9. Non-functional
- Speed: at most one extra `nextUint32` per decision. Measured: D-5 collection 1.9 s. Comparison decisions with
  memoized equity 1.4 s. Seated 200-hand run about 3 s. All in the normal suite, with no timing assertions.
  Per-test timeout 120 s, as in the TASK-6.3 tests.
- Determinism: the same code and view give the same action. The default playtest output stays byte-identical (SPEC-08).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --size 6`
- New tests:
  - `tests/bots/maniac.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
  - `tests/bots/maniac.test.ts` → SPEC-08 (seated run), SPEC-09
  - `tests/bots/style.test.ts` → SPEC-07
  - `tests/table/advice-service.test.ts` → SPEC-10
- End-to-end for the Judge: run the playtest command above twice and compare the SHA-256 with SPEC-08. Run
  `npx vitest run tests/bots/maniac.acceptance.test.ts` and confirm Examples A–G.

## 11. Open questions
- None. Q-1..Q-3 were answered (auto-accepted, recommended options); see `doit/TASK-6.4/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.4/qa.md`.
