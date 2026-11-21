# Spec: TASK-6.3 — Face a Calling station that calls where TAG would fold or raise

Status: READY (approved 2026-11-21)
Task: TASK-6.3 · Parent/epic: TASK-6 · Requirements: REQ-026 (026.2, 026.3); band context REQ-027.2 · Dream: limit-holdem-trainer

## 1. Summary
This task adds the Calling station (loose-passive) bot. It starts from the same advice evaluation as TAG, then
applies deviations stored in its own style data file. Where the advice is fold against a bet, or raise, it calls
instead with the file's probability. Each deviating decision takes exactly one draw from the per-decision seeded
generator that TASK-6.18 and TASK-6.2 already provide. The task extends the TASK-6.2 style file format with an
optional `deviations` list, ships `calling-station.json`, and adds `decideCallingStation`. If Q-3 is accepted, it
also routes the worker's `'Calling station'` seats to that decision.

## 2. Scope
- In scope:
  - `src/bots/style.ts`: the `Deviation` type, `BotStyleData.deviations`, validation of the optional `deviations` list,
    `findDeviation` and `drawDeviation`.
  - `src/bots/styles/calling-station.json` (new): description, no mixed spots, three deviations with justifications.
  - `src/bots/calling-station.ts` (new): `CALLING_STATION_STYLE` (validated at import) and `decideCallingStation`.
  - `src/table/advice-service.ts`: the worker's default bot decision dispatches `'Calling station'` to
    `decideCallingStation` (D-3, approved Q-3).
  - Tests for AC#1–AC#5 plus the validator, draw and dispatch units.
- Not doing:
  - Changing TAG's decision, `tag.json`, the preflop chart, the advice engine, seed derivation or the worker protocol.
  - Seating Calling stations in any line-up: the app's default line-up stays all TAG (`src/table/session.ts:60-67`),
    and the playtest default stays all seeded TAG (`src/playtest/runner.ts:137-140`). Line-up presets and the
    playtest `--lineup` flag belong to TASK-6.6. So the 6-max playtest baseline stays byte-identical (SPEC-08).
  - A playtest policy export for the Calling station (tests build it inline; TASK-6.6 adds the real one).
  - Measuring or asserting the VPIP/PFR/aggression band (TASK-6.11 / TASK-6.17). Measured values are recorded here only
    as rationale (D-2).
  - Postflop bets or raises by the Calling station, and any other style (Maniac TASK-6.4, Rock TASK-6.5).
  - `stepBot`'s default policy (`src/table/session.ts`, TASK-6.22).
  - UI or user-visible app text. The description isn't displayed anywhere yet.
  - Editing, deleting or loosening any locked test. None needs to change (§5 "Locked tests").
- Scope concern (routed to a follow-up, not done here): REQ-027.6 measures aggression on flop, turn and river only,
  and postflop advice never bets or raises, so every bot (TAG included) shows 0% postflop aggression today. The
  Calling station's 10–25% aggression band (REQ-027.2) can't be met until the advice engine bets postflop. This
  affects TASK-6.17 (and TASK-6.16 for TAG). Also, the postflop fold→call deviation never fires in bot-only tables.
- Scope budget: files=8, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `decideCallingStation(view)` with no `random` returns the advice's move and never deviates. Every production path passes a generator. | yes | Mirrors TAG's A-1 (TASK-6.2, `src/bots/tag.ts:39`), so the two decision functions behave the same way. | Make `random` required |
| A-2 | A deviating decision is one where the style has a deviation for (street class, advice action) and a generator was passed. It takes exactly one `nextUint32()` draw `u` from the decision's fresh generator, and deviates iff `u < probability × 2^32`, even when the probability is 0 or 1. Every other decision draws nothing. | yes | Same draw rule as `drawMixed` (`src/bots/style.ts:149-154`). Each decision has its own generator (TASK-6.18 D-1), so draw counts can't leak between decisions. | `nextInt(100)` with percents |
| A-3 | The Calling station takes no TAG-style mixing: its file has `"mixedSpots": []`, and `decideCallingStation` doesn't read `mixedSpots`. | yes | REQ-026.2 defines the station only by its call deviations. Mixing on top would blur AC#2/AC#3 and the band rationale. | Apply mixing when no deviation applies |
| A-4 | "Call instead of raise" with nothing owed (big blind's option in a limped pot) means **check**, the passive equivalent, because no call is legal there. The AC#3 decision points are only views with a bet to face, where a call is legal. | yes | AC#5 forbids folding when no bet is faced, and the engine offers no call at 0 owed (`src/advice/preflop.ts:93-96`). | Keep the raise when nothing is owed |
| A-5 | `deviations` is optional in the format. Absent means `[]`. TAG's file stays unchanged, and `parseStyle(tag.json)` gives `deviations: []`. Format `version` stays 1. | yes | Keeps `tag.json` and the locked TASK-6.2 tests untouched (`tests/bots/tag-mixing.acceptance.test.ts:88` compares `parseStyle(raw)` with `TAG_STYLE`, and both gain the same `[]`). | Make it required and edit `tag.json` |
| A-6 | `decideCallingStation` accepts an optional `style: BotStyleData` (default `CALLING_STATION_STYLE`). AC#4's test changes the probability in a copy of the file's JSON, parses it with `parseStyle`, and passes it in. No code changes. | yes | AC#4 asks for a data-only change. A test can't rewrite the bundled JSON import, and the seam keeps the change to data. | Write a temp file and re-import the module |
| A-7 | AC#2/AC#4 decision points pass both bots the same deterministic `equity` option: a test-only memo of `computeEquity` that returns exactly its result. | yes | Without it, postflop points cost about 10 ms each (measured), and the 10,000-point comparison would take minutes. Both `TagOptions` and the station's options already accept `RecommendOptions` (`src/bots/tag.ts:18`). | Preflop-only points |

## 3. Current system
- Style format: `src/bots/style.ts:3-9` `StyleName` (already includes `'Calling station'`), `:28-32` `BotStyleData`,
  `:63-147` `parseStyle` (collects every problem, echo ≤ 20 chars, word-count helpers), `:149-154` `drawMixed`
  (`u < p × 2^32`). Unknown top-level keys are currently ignored. TAG's file is `src/bots/styles/tag.json`.
- TAG: `src/bots/tag.ts:7` JSON import (last import, per the bots import-boundary regex in `tests/bots/tag.test.ts:64`),
  `:10` `TAG_STYLE`, `:13-15` `BotRandom`, `:18` `TagOptions`, `:21-24` `FREE_CHECK_EQUITY`, `:31-48` `decideTag`.
- Advice: `src/advice/recommend.ts:10-14`. Preflop actions are `fold|check|call|raise`. `legal()` at
  `src/advice/preflop.ts:93-96` turns raise into call at the cap, and anything but raise into check when nothing is
  owed, so preflop **fold is only advised with a bet to face**. Postflop advice is only `fold|check|call`
  (`src/advice/postflop.ts:6`, check-free first), so postflop fold also implies a bet to face, and **postflop raise is
  never advised**.
- Worker: `src/table/advice-service.ts:43-45` `decideBotDefault` sends every style to `decideTag` ("until E06").
  `BotStyle` reaches the worker from `botTurn` (`src/table/session.ts:249-258`, style defaults to `'TAG'`).
  `'Calling station'` seats exist only in test fixtures (`tests/support/table-scenarios.ts:29`). No test asserts what
  a `'Calling station'` request returns (grep).
- Seeds: `src/engine/bot-random.ts:28-32` `botDecisionSeed(code, view)`, `:35-40` `botRandom(seed)`.
- Playtest: `src/playtest/runner.ts:302` `runPlaytest(options, onHand, {makePolicy})`, `:143` `handReplayCode`.
  `src/playtest/policy.ts:10-23` `seededTagPolicy`, `randomMovePolicy`, `seatGenerator`.
- Tests: Vitest (`npm test` = `vitest run --coverage`). The TASK-6.2 view-collection pattern is TAG at seat 1 against
  `randomMovePolicy` seats in `runPlaytest({hands:200, seed:61, size:6})` (TASK-6.2 SPEC-04).
- Existing code to reuse:
  - `src/bots/style.ts` `parseStyle`, `isProbability`, `wordCount`, `echo`, `StyleValidationError` → extend for
    deviations rather than writing a second validator.
  - `src/bots/tag.ts` `FREE_CHECK_EQUITY`, `BotRandom`, `TagOptions` pattern → the station's free-check shortcut and options.
  - `src/engine/bot-random.ts` `botDecisionSeed`, `botRandom` → the seed path (no new derivation).
  - `src/playtest/policy.ts` `seededTagPolicy`, `randomMovePolicy`, `seatGenerator` → view collection in tests.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Format extension: an optional top-level `deviations` list in the `tlh-bot-style` v1 file. Each entry is `{street: "preflop"\|"postflop", advice: "fold"\|"raise", instead: "call", probability: 0..1, justification}`. Supported (street, advice) pairs: preflop/fold, preflop/raise, postflop/fold. Each pair appears at most once. Schema and messages are in §5. | Per-situation keys; one global probability; a `version: 2` bump | It's minimal, keeps `tag.json` valid unchanged (A-5), and names the advised action and its replacement, so Maniac can add `check→bet` pairs later. Street-level keys are enough to land the band (D-2 measurements). | yes | user (Q-1, auto-accepted) |
| D-2 | Calling station parameters: preflop fold→call **0.5**, preflop raise→call **0.6**, postflop fold→call **0.5**. Description and justifications are in §5. | 0.4/0.6/0.5; 0.55/0.6/0.5; 0.5/0.65/0.5 | A prototype of D-4 over 10,000 hands at seed 42, 6-max: one station at seat 2 among seeded TAGs gave VPIP 59.0%, PFR 6.8%. Stations at seats 2 and 4 gave VPIP 57.1%, PFR 6.1%. All six seats stations gave VPIP 52.4%, PFR 4.9%. Every result is inside REQ-027.2 (VPIP 45–65, PFR 3–10), with 0 invariant violations. The same rule with all three at 0 gave VPIP 22.4% / PFR 16.9% (pure advice). Postflop aggression is 0% for every bot today because postflop advice never bets (scope concern). | yes | user (Q-2, auto-accepted) |
| D-3 | Worker wiring: `decideBotDefault` returns `decideCallingStation(view, { random })` for style `'Calling station'` and `decideTag(view, { random })` for every other style. | Defer to TASK-6.6 | REQ-026 asks that each bot choose "modified by its style's documented parameters", and `style` already reaches the worker. No locked test asserts a `'Calling station'` result (grep). The 6-max playtest doesn't use the worker. | yes | user (Q-3, auto-accepted) |
| D-4 | Decision rule `decideCallingStation` (§5 "Rules"): free postflop check shortcut, then the advice, then at most one deviation draw. The passive move is call when owed > 0, else check. | Build on `decideTag` (TAG mixing) | AC#2/AC#3 compare with TAG, and REQ-026.2 defines the station by its call deviations alone (A-3). | no | n/a |
| D-5 | AC#2/AC#3/AC#4 decision points: views collected once (§5 "Decision points"), point i (0..9999) = `views[i mod n]` with code `handReplayCode(6003, i+1)` (fold) or `handReplayCode(6004, i+1)` (raise). Each bot gets a fresh `botRandom(botDecisionSeed(code, view))`. | 10,000 distinct hands | Same pattern as TASK-6.2 SPEC-04 (a view × many codes). It covers preflop and postflop fold points and runs in about 2 s (measured: collection 1.8 s, 40,000 decisions 80 ms). | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/style.ts` — `Deviation`, `DeviationStreet`, `DeviationAdvice`, `BotStyleData.deviations`, deviation
  validation, `findDeviation`, `drawDeviation`.
- `src/bots/styles/calling-station.json` — new: the Calling station's style file.
- `src/bots/calling-station.ts` — new: `CALLING_STATION_STYLE`, `CallingStationOptions`, `decideCallingStation`.
- `src/table/advice-service.ts` — D-3 dispatch. Update the "until E06" comment.
- `tests/bots/calling-station.acceptance.test.ts` — new (SPEC-01..SPEC-06).
- `tests/bots/calling-station.test.ts` — new unit (SPEC-09).
- `tests/bots/style.test.ts` — extend (SPEC-07).
- `tests/table/advice-service.test.ts` — extend (SPEC-10).

### Components, interfaces and data
`src/bots/style.ts` additions:
```ts
export type DeviationStreet = 'preflop' | 'postflop';
export type DeviationAdvice = 'fold' | 'raise';
/** Where the advice is `advice` on `street`, play `instead` with `probability` (one draw). */
export interface Deviation {
  readonly street: DeviationStreet;
  readonly advice: DeviationAdvice;
  readonly instead: 'call';
  readonly probability: number;
  readonly justification: string;
}
export interface BotStyleData { /* existing fields */ readonly deviations: readonly Deviation[] } // file order; [] if absent
export function findDeviation(style: BotStyleData, street: DeviationStreet, advice: string): Deviation | undefined;
/** One nextUint32 draw u: true iff u < probability * 2**32. */
export function drawDeviation(probability: number, random: { nextUint32(): number }): boolean;
```
`src/bots/calling-station.ts` (imports: engine types only, `recommend`, `./style`, `./tag` for `FREE_CHECK_EQUITY` and
`BotRandom`. The JSON import goes **last**):
```ts
export const CALLING_STATION_STYLE: BotStyleData; // parseStyle(callingStation, 'calling-station.json') at import
export type CallingStationOptions = RecommendOptions & {
  readonly random?: BotRandom;
  readonly style?: BotStyleData; // default CALLING_STATION_STYLE (A-6)
};
export function decideCallingStation(view: PlayerView, options?: CallingStationOptions): Action;
```
`src/bots/styles/calling-station.json` (original text; approved Q-2):
```json
{
  "format": "tlh-bot-style",
  "version": 1,
  "style": "Calling station",
  "description": "Calling station (loose-passive) plays far too many hands and rarely raises. It starts from the trainer's own advice, like TAG, but where the advice is to fold against a bet it often calls instead, and where the advice is to raise it usually just calls. It hardly ever bets on its own, so bet your good hands for value against it and don't try to bluff it off a hand.",
  "mixedSpots": [],
  "deviations": [
    {
      "street": "preflop",
      "advice": "fold",
      "instead": "call",
      "probability": 0.5,
      "justification": "Calling half of the hands the chart folds against a bet roughly doubles TAG's starting range, which puts the station's VPIP near the middle of its 45 to 65 percent band."
    },
    {
      "street": "preflop",
      "advice": "raise",
      "instead": "call",
      "probability": 0.6,
      "justification": "Just calling with most hands the chart raises leaves only a few raises, which keeps the station's PFR inside its 3 to 10 percent band and makes its raises mean a strong hand."
    },
    {
      "street": "postflop",
      "advice": "fold",
      "instead": "call",
      "probability": 0.5,
      "justification": "Calling half the time when the pot odds say fold is the station's defining leak: it pays off value bets with weak pairs and missed draws, which the learner should exploit."
    }
  ]
}
```

### Rules and algorithms
- Validation (in `parseStyle`, with problems collected alongside the existing ones; `S` = style name or `?`):
  - `deviations` present but not an array → `<file>: deviations must be a list`.
  - Entry whose (`street`, `advice`, `instead`) isn't one of `preflop/fold/call`, `preflop/raise/call`,
    `postflop/fold/call` → `<file>: style S has unsupported deviation "<echo street>" "<echo advice>" to "<echo instead>"`.
  - Repeated (street, advice) → `<file>: style S lists deviation <street> <advice> twice`.
  - Probability missing, not a finite number, or outside [0, 1] → `<file>: style S deviation <street> <advice> has an invalid probability`.
  - Justification under 10 words → `<file>: style S deviation <street> <advice> has no justification (at least 10 words)`.
  - Only fully valid entries are kept. `deviations` absent → `[]` (A-5).
- Decision `decideCallingStation(view, options = {})`, with `style = options.style ?? CALLING_STATION_STYLE`,
  `owed = view.currentBet − hero.streetContribution`, and `street = 'preflop'` if `view.street === 'preflop'`, else `'postflop'`:
  1. Postflop and `owed === 0` → `recommend(view, {...options, equity: FREE_CHECK_EQUITY}).move` (a check). No draw.
  2. `advice = recommend(view, options)`.
  3. `options.random` undefined → `advice.move` (A-1).
  4. `dev = findDeviation(style, street, advice.action)`. Undefined → `advice.move`, no draw.
  5. One draw: `drawDeviation(dev.probability, random)` true → the legal `call` if `owed > 0`, else the legal
     `check` (A-4). False → `advice.move`. If the passive move isn't in `view.legalActions` (unreachable), throw
     `Error('No legal <type> for seat <n>')`.
  - Consequence (AC#5): with `owed === 0`, preflop advice is `check` or `raise` (`legal()` never returns fold at 0
    owed), so the station plays check or raise. Postflop it checks. It never folds.
  - Thresholds: 0.5 → `u < 2147483648`. 0.6 → `u < 2576980377.6`, so `u ≤ 2576980377` deviates. 0.2 → `u < 858993459.2`.
- Decision points (D-5), collected once per test file: `runPlaytest({hands: 200, seed: 61, size: 6}, undefined,
  {makePolicy})`. Seat 1 plays `seededTagPolicy(code)` and records each view before acting. Every other seat plays
  `randomMovePolicy(seatGenerator(code, seat))`. A recorded view `v` with `a = recommend(v, {equity})` goes into:
  `fold` if `a.action === 'fold'`, `raise` if `a.action === 'raise'` and owed > 0, `free` if `a.action === 'raise'`
  and owed === 0. Prototype counts: fold 154 (149 preflop + 5 postflop), raise 31, free 1.
- Hand-worked deviating decisions (prototype of this exact rule against HEAD `a6245b5`, recommended values):
  - **Example A (raise → call).** `raise[0]`: seat 1, SB, preflop, holds Ac Qd (AQo), situation `limpers`, cell
    `raise` (no alternative), currentBet 4, k = `botDecisionIndex` = 0. Decided under code `handReplayCode(6004, 2)` =
    `00000000000017740000000000000002` (a standalone check: D-5 pairs this code with `raise[1]`). Seed `botDecisionSeed(code, view)` = `3757549955`.
    `botRandom(3757549955).nextUint32()` = u = `1339328068` < 2576980377.6, so the station deviates. Owed = 4 − 2 =
    2 > 0, so it plays `{seat: 1, type: 'call', amount: 2}`. TAG at the same point plays
    `{seat: 1, type: 'raise', amount: 8}`. At D-5 point 0 (`raise[0]` with code `…17740000000000000001`, seed
    `3761756536`, u `3312332681` ≥ threshold) both raise to 8.
  - **Example B (postflop fold → call).** `fold[30]`: seat 1, flop, holds 5c 3c, advice `fold` (pot odds), currentBet
    4, k = 1. Code `handReplayCode(6003, 31)` = `0000000000001773000000000000001f`, seed `2826725471`, u `523750097` <
    2147483648, so the station plays `{seat: 1, type: 'call', amount: 4}`. TAG folds.
  - **Example C (no deviation).** `fold[0]`: seat 1, CO, preflop, 7s 9d (97o), situation `raise`, cell `fold`.
    Code `handReplayCode(6003, 1)` = `00000000000017730000000000000001`, seed `4053618777`, u `2247995765` ≥
    2147483648, so the station folds, like TAG.
- Measured rates over the D-5 points (prototype): AC#2 station calls 5040 / TAG 84. AC#3 station 6047 / TAG 76.
  AC#4 with preflop fold→call set to 0.2: station calls 2137. If Q-2 changes the values, the builder records the new
  numbers and examples in `build-log.md`. The tests assert the relations below, not these exact counts.

### Locked tests
None change. The default line-ups and the TAG path are untouched. `tests/bots/tag-mixing.acceptance.test.ts:88`
(TASK-6.2) still holds because both sides gain `deviations: []`. `tests/bots/bot-random.acceptance.test.ts` (TASK-6.18)
compares `handleAdviceRequest` with itself and calls `decideTag` directly, so it's unaffected by D-3.

### Error handling and configuration
- A bad shipped `calling-station.json` throws `StyleValidationError` at import of `src/bots/calling-station.ts`
  (and, after D-3, of the worker module), so every test that loads it fails.
- `recommend` errors propagate. Seed errors are unchanged (`RangeError` from `botRandom`, worker `TypeError`).

## 6. Behaviour specification

### SPEC-01: The Calling station's style file holds its deviations and a description
- Verifies: AC#1, DoD#9
- Behaviour: Given `src/bots/styles/calling-station.json`, When `src/bots/calling-station.ts` is imported, Then
  `CALLING_STATION_STYLE.style === 'Calling station'`, its description has at least 15 words, `mixedSpots.size === 0`,
  and `deviations` equals (ignoring justifications) `[{street:'preflop', advice:'fold', instead:'call',
  probability:0.5}, {street:'preflop', advice:'raise', instead:'call', probability:0.6}, {street:'postflop',
  advice:'fold', instead:'call', probability:0.5}]`, each with a justification of at least 10 words. Parsing the raw
  JSON with `parseStyle(raw, 'calling-station.json')` gives a value equal to `CALLING_STATION_STYLE`. With
  `description` removed, it throws `StyleValidationError` containing `calling-station.json: style has no plain-English
  description (at least 15 words)`. With the first deviation's probability set to `1.5`, it throws with the problem
  `calling-station.json: style Calling station deviation preflop fold has an invalid probability`.
- Verification: acceptance `tests/bots/calling-station.acceptance.test.ts::the Calling station style file holds its deviation parameters and a description`

### SPEC-02: Facing a bet where the advice is fold, the Calling station calls more often than TAG
- Verifies: AC#2, DoD#1
- Behaviour: Given the 10,000 fold points of D-5 (code `handReplayCode(6003, i+1)`), When the station acts with
  `decideCallingStation(view, {random: botRandom(seed), equity})` and TAG with `decideTag(view, {random:
  botRandom(seed), equity})`, where `seed = botDecisionSeed(code, view)` and `equity` is the shared memo (A-7), Then
  every point's view has `recommend(view).action === 'fold'` and owed > 0. The points include at least one
  postflop view. The station's count of `call` actions is greater than TAG's. Every station action is either
  `recommend(view).move` or the legal call. Example C gives a fold and Example B a call of 4.
- Verification: acceptance `tests/bots/calling-station.acceptance.test.ts::facing a bet where the advice is fold the Calling station calls at more points than TAG`

### SPEC-03: Where the advice is raise, the Calling station calls more often than TAG
- Verifies: AC#3, DoD#1
- Behaviour: Given the 10,000 raise points of D-5 (owed > 0, `recommend(view).action === 'raise'`, code
  `handReplayCode(6004, i+1)`), When both bots act as in SPEC-02, Then the station's `call` count is greater than TAG's,
  and every station action is either the advice's raise or the legal call. Example A (`raise[0]` under `handReplayCode(6004, 2)`) gives seed
  `3757549955`, and the station plays `{seat:1, type:'call', amount:2}` while TAG plays `{seat:1, type:'raise',
  amount:8}`. D-5 point 0 gives a raise to 8 for both.
- Verification: acceptance `tests/bots/calling-station.acceptance.test.ts::where the advice is raise the Calling station calls at more points than TAG`

### SPEC-04: Changing the file's call probability changes the call rate with no code change
- Verifies: AC#4
- Behaviour: Given a deep copy of the station's raw JSON with the `preflop`/`fold` deviation's probability changed
  from 0.5 to 0.2, parsed with `parseStyle(copy, 'calling-station.json')`, When the same 10,000 fold points of SPEC-02
  are replayed with `decideCallingStation(view, {random, equity, style: modified})`, Then the call count differs from
  the unmodified run's, and it's lower. A copy with that probability set to 0 gives the same call count as a copy with
  the preflop/fold deviation removed (only postflop points can still call). A copy with probability 1 makes every
  preflop fold point a call.
- Verification: acceptance `tests/bots/calling-station.acceptance.test.ts::changing the file's call probability changes the call rate with no code change`

### SPEC-05: With no bet to face, the Calling station checks or bets and never folds
- Verifies: AC#5
- Behaviour: Given `runPlaytest({hands: 200, seed: 62, size: 6})` with seat 1 playing
  `decideCallingStation(view, {random: botRandom(botDecisionSeed(code, view))})` and every other seat
  `randomMovePolicy(seatGenerator(code, seat))`, When every seat-1 decision with owed === 0 is examined, Then each
  action's type is `check`, `bet` or `raise` (never `fold`). At least 100 such decisions are seen, including at least
  one preflop and one postflop (prototype: 5 preflop, 186 postflop, all checks). The run reports 0 violations. Also,
  given the `free` view of D-5 (big blind, limped pot, advice raise), When the station decides it under codes
  `handReplayCode(6005, i)`, i = 1..1000, Then every action is the legal check or the legal raise, and both occur.
- Verification: acceptance `tests/bots/calling-station.acceptance.test.ts::with no bet to face the Calling station checks or bets and never folds`

### SPEC-06: A Calling station seat in the app's worker plays the Calling station decision
- Verifies: AC#2, AC#3
- Behaviour: Given Example A's view and seed `3757549955`, When `handleAdviceRequest({id: 1, kind: 'bot', view, style:
  'Calling station', seed: 3757549955})` runs, Then it returns `{id: 1, ok: true, value: {seat: 1, type: 'call',
  amount: 2}}`. With `style: 'TAG'` it returns the raise to 8. Over the D-5 raise points, the worker's `'Calling
  station'` answer equals `decideCallingStation(view, {random: botRandom(seed)})` at every point. (D-3, approved Q-3.)
- Verification: acceptance `tests/bots/calling-station.acceptance.test.ts::a Calling station seat in the worker plays the Calling station decision`

### SPEC-07: The validator rejects every malformed deviation with a listed problem
- Verifies: AC#1
- Behaviour: Each deviation rule in §5 has one case giving exactly its message: `deviations: {}`; street `river`;
  advice `check`; instead `raise`; `postflop`/`raise`; a repeated preflop/fold; probability `-0.1`, `1.5`, `"0.5"`,
  `NaN` and missing; a 3-word justification. Several problems in one file are all listed. Echoed values are cut to 20
  characters plus `...`. A file with no `deviations` key parses with `deviations: []`. Probabilities 0 and 1 are valid.
  `findDeviation` returns the matching entry or `undefined`.
- Verification: unit `tests/bots/style.test.ts::parseStyle validates deviations`

### SPEC-08: The default playtest baseline is unchanged, and seated stations break no invariant
- Verifies: DoD#6
- Behaviour: `npm run -s playtest -- --hands 10000 --seed 42 --size 6` still prints `Player actions: 88920` and
  `Invariant violations: 0`, and its stdout SHA-256 is
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (the current baseline, measured at HEAD). Also, a
  10,000-hand `runPlaytest({hands: 10000, seed: 42, size: 6})` with seats 2 and 4 playing the seeded Calling station and
  the rest `seededTagPolicy` reports `violations === 0` (prototype: 124902 actions, about 1 s).
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-09: Draw counts and the no-generator path
- Verifies: AC#2, AC#3, AC#5
- Behaviour: With a counting stub generator: exactly one `nextUint32` call at Example A's, B's and C's views. Zero calls
  at a postflop view with owed 0, at a preflop view whose advice is `call` or `check`, and at any view when the style
  has no deviations. `drawDeviation(0.5, r)` is true for u = `2147483647` and false for `2147483648`.
  `drawDeviation(0.6, r)` is true for `2576980377` and false for `2576980378`. `drawDeviation(0, r)` is false for u = 0.
  `drawDeviation(1, r)` is true for `4294967295`. `decideCallingStation(view)` with no `random` at Example A returns the
  raise (A-1). A stub returning 0 at the `free` view gives the legal check (A-4). The 10,000-hand seated-station run of
  SPEC-08 is in this file.
- Verification: unit `tests/bots/calling-station.test.ts::Calling station draws once only at deviating decisions`

### SPEC-10: Worker default dispatch by style
- Verifies: AC#5
- Behaviour: `handleAdviceRequest` with no `deps` and `style` `'Calling station'` calls `decideCallingStation`. With
  `'TAG'`, `'Maniac'` or `'Rock'` it still returns `decideTag(view, {random: botRandom(seed)})` (the existing
  assertion at `tests/table/advice-service.test.ts:33-36` stays). At a postflop view with owed 0, the `'Calling
  station'` answer is the check.
- Verification: unit `tests/table/advice-service.test.ts::default bot decision dispatches the Calling station`

### SPEC-11: Checks, coverage, boundaries, CI and documentation
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#7, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, and the coverage thresholds
  hold (≥ 90% engine/bots/advice/statistics, ≥ 70% overall). `tests/bots/tag.test.ts`'s bots import boundary passes
  for the new `src/bots/calling-station.ts` (engine imports type-only, no UI import, JSON import last). The
  REQ-028.1 lint guard (`src/bots/**`) is clean. CI is green on `doit/TASK-6.3`. A story doc is published with
  `backlog doc`. It covers the `deviations` format, the Calling station's parameters with justifications, the decision
  rule with Examples A and B, and the measured VPIP/PFR from D-2. Not applicable: DoD#3 (no golden-spot suite yet,
  E07-S14), DoD#7 and DoD#12 (no screen or dialog), DoD#8 (no network code touched; pure computation over bundled
  JSON). DoD#9: the description and every deviation carry original justification text, enforced by the validator.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Preflop raise advice with nothing owed (big blind's option in a limped pot): the deviation plays check (A-4, SPEC-05, SPEC-09).
- Preflop raise advice at the 4-bet cap can't happen: `legal()` already turns it into call, which isn't a deviation point.
- Short-stacked all-in call: the legal `call` from `view.legalActions` is used as is (its amount may be below owed).
- Postflop raise advice: never produced by the advice engine, and rejected as a deviation by the validator (SPEC-07).
- Probability 0 or 1: valid. It still takes one draw (A-2). 0 never deviates and 1 always does (SPEC-04, SPEC-09).
- A style without `deviations` (TAG): parses to `[]` (SPEC-07). TAG's behaviour is unchanged (SPEC-08 hash).
- No generator: no deviation (A-1, SPEC-09).
- Concurrency, interruption, permissions, dependency failure: N/A. This is pure computation over bundled data.

## 8. Security considerations
- Trust boundary: style files are bundled, authored data. They're still validated at import (fail closed), with echoes cut
  to 20 characters. Worker requests are validated as before, and the `style` value only selects between two
  functions. Any unknown value falls through to TAG.
- Hidden information: the decision reads only the bot's `PlayerView` and its seeded generator.
- Randomness: the non-cryptographic seeded PRNG is deliberate (reproducibility, REQ-028). No `Math.random`/`Date`
  (the lint guard covers `src/bots/**`).
- New dependencies, secrets, authn, injection, logs: none / N/A.

## 9. Non-functional
- Speed: at most one extra `nextUint32` per decision. Measured: D-5 collection 1.8 s; 40,000 decisions with memoized
  equity 80 ms; seated-station 10,000-hand run about 1.1 s. All in the normal suite. No timing assertions.
- Determinism: same code and view give the same action (seeded). The default playtest output stays byte-identical (SPEC-08).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --size 6`
- New tests:
  - `tests/bots/calling-station.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
  - `tests/bots/calling-station.test.ts` → SPEC-08 (seated run), SPEC-09
  - `tests/bots/style.test.ts` → SPEC-07
  - `tests/table/advice-service.test.ts` → SPEC-10
- End-to-end for the Judge: run the playtest command above twice and compare the SHA-256 with SPEC-08. Run
  `npx vitest run tests/bots/calling-station.acceptance.test.ts` and confirm Examples A–C. Change `0.5` to `0.2` in a
  scratch copy of the JSON and re-run SPEC-04's comparison by hand if desired.

## 11. Open questions
- None. Q-1..Q-3 were answered (auto-accepted, recommended options); see `doit/TASK-6.3/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.3/qa.md`.
