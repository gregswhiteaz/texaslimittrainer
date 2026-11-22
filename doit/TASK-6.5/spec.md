# Spec: TASK-6.5 — Face a Rock that folds every hand outside a narrow starting range

Status: READY (approved 2026-11-21)
Task: TASK-6.5 · Parent/epic: TASK-6 · Requirements: REQ-026 (026.2, 026.3), REQ-061 (061.2); band context REQ-027.4, REQ-027.6 · Dream: limit-holdem-trainer

## 1. Summary
This task adds the Rock (very tight) bot. Its style data file stores a narrower preflop starting range for each of the
26 positions and situations of the 6-max chart, each with a justification, plus a plain-English description. Preflop,
the Rock folds every hand class outside its range, or checks when nothing is owed (the big blind after limps). Inside
its range, and on every postflop street, it plays the advice engine's move. The style validator checks that every
Rock range is a subset of the TAG chart's non-fold cells for the same spot, with fewer hand classes. The worker routes
`'Rock'` seats to the new `decideRock`.

## 2. Scope
- In scope:
  - `src/bots/style.ts`: an optional `startingRange` section in the style format, required for `Rock` (D-1). It's
    validated against the TAG 6-max chart, which `parseStyle` takes as an optional third argument defaulting to
    `SIX_MAX_CHART` (D-1, D-5). `BotStyleData` gains `startingRange`.
  - `src/bots/styles/rock.json` (new): description, no mixed spots, no deviations, and the 26 ranges of D-2 with
    justifications.
  - `src/bots/rock.ts` (new): `ROCK_STYLE` (validated at import), `RockOptions`, `decideRock`.
  - `src/table/advice-service.ts`: `decideBotDefault` sends `'Rock'` to `decideRock` (D-4).
  - Tests for AC#1–AC#5, plus validator, decision and dispatch units.
- Not doing:
  - Changing TAG's, the Calling station's or the Maniac's decisions, `tag.json`, `calling-station.json`,
    `maniac.json`, the preflop chart, the advice engine, seed derivation or the worker protocol.
  - Heads-up or full-ring Rock ranges. Only the 6-max chart exists (`src/advice/preflop-chart.ts:3`,
    `APPLICABLE_SPOTS` at `:40-49`). The task note defers those ranges to the E07-S05 charts.
  - Rock postflop deviations or Rock mixing (D-3). `rock.json` has `"mixedSpots": []` and `"deviations": []`.
  - Seating Rocks in any line-up. The app default stays all TAG (`src/table/session.ts:60-67`), and so does the
    playtest default (`src/playtest/runner.ts:137-140`). Presets and `--lineup` are TASK-6.6. So the playtest
    baseline stays byte-identical (SPEC-08).
  - A playtest policy export for the Rock. Tests build it inline.
  - Measuring or asserting the VPIP/PFR/aggression band (TASK-6.11 / TASK-6.17). Measured values appear only as the
    rationale for D-2.
  - UI or user-visible app text. The description isn't shown anywhere yet.
  - Editing, deleting or loosening any locked test. None needs to change (§5 "Locked tests").
- Scope concerns (for follow-ups, not done here):
  - Rock aggression can't reach its band yet. REQ-027.4 asks for 35–55% and REQ-027.6 counts flop, turn and river only.
    Postflop advice is only fold/check/call (`src/advice/postflop.ts:6`), and the Rock follows it, so it never bets or
    raises postflop. Measured in a mixed prototype line-up (Rock, Maniac, Calling station, three TAG; 1,500 hands): 0
    bets or raises against 107 calls, so aggression is 0%. Among TAG only, nothing bets postflop, so aggression is "—".
    This waits on value betting (TASK-7.8) and affects TASK-6.11/TASK-6.17. TAG's 45–65% band has the same gap.
  - The Rock's VPIP and PFR depend on how often it faces raises. Against a Maniac the measured values drop (D-2), with
    a margin of about 2 points above the 8% / 6% floors. Re-measure with the 100,000-hand Mixed line-up in TASK-6.11.
- Scope budget: files=8, lines=950

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Facing a bet preflop" (AC#3) means owed > 0, where owed = `view.currentBet − hero.streetContribution`. This includes the blinds as the opening bet: an unopened UTG seat faces the big blind. | yes | The engine then offers fold (`src/engine/hand.ts:331-352`). Folding is legal and the chart treats these spots the same way. | Only spots with a voluntary raise |
| A-2 | "A non-fold cell of the TAG chart" means `cell.action !== 'fold'`, whatever the cell's alternative. A `F/c` cell counts as fold, and an `R/f` cell counts as non-fold. | yes | The cell's main action is what the advice recommends (`src/advice/preflop.ts:98`). | Count any cell with a non-fold alternative |
| A-3 | `decideRock` takes no generator and draws nothing. The worker calls `decideRock(view)` and ignores the seed for Rock seats. | yes | The Rock has no mixing and no deviations (D-3), so its decision is a pure function of the view. That's also why AC#3 holds "under any replay code". | Accept and ignore `random` |
| A-4 | `decideRock` accepts an optional `style: BotStyleData` (default `ROCK_STYLE`). AC#5's test removes a class from a copy of the file's JSON, parses it with `parseStyle` and passes it in. No code changes. A style with `startingRange === null` makes `decideRock` throw `RangeError('Style <name> has no starting range')`. | yes | Same seam as TASK-6.3 A-6 and TASK-6.4 A-5. | Temp file plus re-import |
| A-5 | `startingRange` may appear in any style's file and is validated the same way. Only `Rock` must have it, and only `decideRock` reads it. | yes | It's additive. A future style or heads-up range can use it without a format change. | Reject it outside Rock |
| A-6 | The test views come from one fast collection: `runPlaytest({hands: 1000, seed: 65, size: 6})` with random-move seats. Seat 1 records each preflop view before acting (1,464 views covering all 26 spots, about 0.1 s). Out-of-range coverage substitutes each hand class's cards into a recorded view of each spot. | yes | Preflop folds and checks need no equity run, so they cost microseconds each. Every spot and every class is covered in well under a second. | Natural deals only (covers few classes per spot) |
| A-7 | The seated invariant run in the normal suite is 1,000 hands, with Rocks at seats 2 and 4 among seeded TAG. It takes about 0.1 s, because nobody bets postflop, so no equity runs happen. | yes | It's cheap enough for CI, and the 10,000-hand prototype ran in 0.5 s with 0 violations. | `TLH_SLOW_TESTS`-gated longer run |

## 3. Current system
- Style format: `src/bots/style.ts:51-57` `BotStyleData`. `:94-220` `parseStyle`, which collects every problem and then
  throws `StyleValidationError` (`:59-67`). The helpers are `wordCount` (`:80-82`), `echo` (`:85-88`, 20 characters),
  `JUSTIFICATION_WORDS = 10` and `DESCRIPTION_WORDS = 15` (`:70-71`). `STYLE_NAMES` already includes `'Rock'`
  (`:3-9`). `deviations` is optional (`:169`).
- Chart: `src/advice/preflop-chart.ts:4-6` `Position` and `Situation`. `:40-49` `APPLICABLE_SPOTS['6-max']` has 26
  spots, and BB-limpers cells can never be fold (`:148-151`). `:213-226` `chartCell`. `src/advice/preflop.ts:17`
  `SIX_MAX_CHART`. `:48-56` `positionOf` throws `RangeError` unless 6 seats are dealt in. `:59-72` `situationOf`.
  `:93-96` makes the advice legal: a capped raise becomes call, and with nothing owed, anything but raise becomes check.
  So a non-fold cell never gives fold advice.
- Hand classes: `src/advice/hand-class.ts:19-21` `HAND_CLASSES` (169, grid order), `:24-33` `handClassOf`.
- TAG chart non-fold counts per spot (computed from `six-max.json`): UTG/HJ/CO/BTN/SB unopened 36/42/57/82/79.
  HJ/CO/BTN/SB/BB limpers 37/42/45/42/169. UTG/HJ/CO/BTN raise 14/14/18/24. Raise-and-calls 24/35/32/39.
  UTG/HJ/CO/BTN/SB/BB re-raise 34/39/52/75/59/22. SB/BB blind-defence 23/91. Per position (union over situations):
  UTG 39, HJ 46, CO 57, BTN 82, SB 79, BB 169.
- Bots: `src/bots/maniac.ts:1-44` is the structure to mirror: engine type-only imports, then `recommend`, `./style` and
  `./tag`, with the JSON import **last** (`:6-7`). `src/bots/tag.ts:21-24` `FREE_CHECK_EQUITY`.
- Worker: `src/table/advice-service.ts:45-50` `decideBotDefault` (Maniac, Calling station, else TAG).
  `tests/table/advice-service.test.ts:104` (unit, not locked) asserts that `'Rock'` gives `decideTag` today. That
  changes under D-4.
- Import boundary: `tests/bots/tag.test.ts:65-173` scans every `src/bots/*.ts`. Engine imports must be type-only names
  from the allow-list (`:55-63`). `Card` from `engine/cards` isn't allowed, so `rock.ts` gets cards only through
  `view.holeCards` and `handClassOf`.
- Locked tests (from `doit/*/state.json`): `tests/bots/{tag,tag-playtest,bot-random,tag-mixing,tag-seed-parity,
  calling-station,maniac}.acceptance.test.ts`. None mentions `Rock` or `startingRange`. None builds a `BotStyleData`
  literal (grep). `tests/bots/calling-station.test.ts:96` spreads a style, which stays valid.
- Playtest: `src/playtest/runner.ts:302` `runPlaytest`, `:143` `handReplayCode`, `:65` `PolicyFactory` (one policy per
  dealt-in seat per hand, `:195`). `src/playtest/policy.ts:10-22` `seededTagPolicy`, `randomMovePolicy`,
  `seatGenerator`.
- Tests: Vitest (`npm test` = `vitest run --coverage`). Slow runs are opt-in with `TLH_SLOW_TESTS=1`
  (`tests/bots/maniac.test.ts:13`).
- Existing code to reuse:
  - `src/bots/style.ts` `parseStyle`, `wordCount`, `echo`, `StyleValidationError` → extend them. Don't write a second
    validator.
  - `src/advice/preflop-chart.ts` `APPLICABLE_SPOTS`, `chartCell`, and `src/advice/hand-class.ts` `HAND_CLASSES`,
    `handClassOf` → spot list, cell lookup and class names.
  - `src/advice/preflop.ts` `SIX_MAX_CHART`, `positionOf`, `situationOf` → the Rock's spot for a view.
  - `src/bots/tag.ts` `FREE_CHECK_EQUITY` → the postflop free-check shortcut.
  - `src/engine/cards.ts` `parseCard` (tests only) → cards for the substituted hand classes.
  - `tests/bots/maniac.acceptance.test.ts` → the view collection and `problemsOf` patterns, copied into the new test,
    which can't import from a locked test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Format extension. Keep `tlh-bot-style` version 1 and add an optional top-level `"startingRange"`: a list of `{ "position", "situation", "hands", "justification" }`. `hands` is one string of whitespace-separated hand-class names in `HAND_CLASSES` spelling (`"AA AKs AKo"`). Rules (§5): the list must cover exactly the 26 `APPLICABLE_SPOTS['6-max']` spots, once each. Classes must be known and not repeated. The justification needs at least 10 words. Every class must be a non-fold cell of the TAG chart for that spot (A-2). Each spot must have fewer classes than the TAG chart's non-fold cells, and each position's union over its spots must have fewer classes than TAG's union. A `Rock` file must have it. `tag.json`, `calling-station.json` and `maniac.json` stay valid unchanged. | `version: 2`; a 13×13 grid per spot like the chart; a JSON array of classes per spot (prettier puts one class per line, so about 600 lines); "fewer" per position only | It's additive and compact, and it reads like a range. Requiring all 26 spots makes AC#1 ("for each position and situation") a validator rule. The per-spot "fewer" rule is stronger than the AC, and the per-position rule states AC#2 literally. | yes | user (Q-1, auto-accepted) |
| D-2 | Rock ranges, description and justifications as in §5 `rock.json`. They're original, and every class is a TAG non-fold cell. Counts (Rock/TAG): UTG/HJ/CO/BTN/SB unopened 15/36, 20/42, 29/57, 45/82, 25/79. Limpers HJ 13/37, CO 18/42, BTN 23/45, SB 14/42, BB 12/169. Raise UTG 7/14, HJ 8/14, CO 10/18, BTN 12/24. Raise-and-calls 7/24, 8/35, 11/32, 14/39. Re-raise UTG 5/34, HJ 5/39, CO 6/52, BTN 7/75, SB 5/59, BB 6/22. Blind-defence SB 12/23, BB 41/91. Per position UTG 15/39, HJ 20/46, CO 29/57, BTN 45/82, SB 25/79, BB 41/169. | Tighter first draft (VPIP 9.0%, PFR 8.6%, too close to the 8% floor); a middle draft (VPIP 9.9%, PFR 8.9%) | Prototype of D-3's rule, seed 42, 6-max, seeded TAG elsewhere, 10,000 hands. One Rock (seat 2): VPIP 10.5%, PFR 9.2%. Two Rocks (seats 2, 4): 10.4% / 9.0%. Six Rocks: 10.9% / 9.9%. Mixed (Rock 2, Maniac 4, Calling station 5, TAG elsewhere, 1,500 hands): 9.9% / 8.3%. 0 invariant violations in every run. All inside REQ-027.4 (VPIP 8–15, PFR 6–12), with margin on both sides. The ranges are premium-heavy and mostly raise cells, so PFR stays close to VPIP. Small-pair and suited-ace calls in multiway and blind-defence spots add the VPIP that isn't PFR. | yes | user (Q-2, auto-accepted) |
| D-3 | Decision rule `decideRock` (§5 "Rules"). Preflop, a hand class outside the Rock's range for (`positionOf`, `situationOf`) gives the legal fold when owed > 0 and the legal check when owed is 0. Inside the range, preflop, it plays `recommend(view).move`: the plain advice, with no TAG mixing. Postflop it plays the plain advice, with the free-check shortcut. There are no deviations and no draws (A-3). | TAG mixing inside the range (`decideTag`); Rock postflop deviations, such as betting more when checked to | REQ-026.2 defines the Rock by its range alone. Mixing would add draws and could take a range class's `F` alternative, which would blur "folds only outside its range". Postflop deviations are style content the story doesn't ask for (scope concern 1). | yes | user (Q-3, auto-accepted) |
| D-4 | Worker wiring: `decideBotDefault` returns `decideRock(view)` for `'Rock'`, then Maniac, Calling station, else TAG. The unit assertion at `tests/table/advice-service.test.ts:104` (Rock → TAG) moves to the new expectation. | Defer to TASK-6.6 | REQ-026 asks each bot to play by its style's documented parameters, and `style` already reaches the worker. No locked test asserts a Rock result. The default line-up has no Rock. | yes | user (Q-4, auto-accepted) |
| D-5 | `parseStyle(raw, fileName, chart = SIX_MAX_CHART)`. `style.ts` imports `SIX_MAX_CHART` from `../advice/preflop`. Tests pass a modified chart to show the check reads the TAG chart's data. | A separate `checkRangeAgainstChart` | One validator, as AC#2 says ("the style validator"). `advice/preflop` doesn't import bots, so there's no cycle. | no | n/a |
| D-6 | The stored range is `readonly RangeSpot[]` in `APPLICABLE_SPOTS` order, or `null` when the file has none. Each `RangeSpot` is `{position, situation, hands: ReadonlySet<HandClass>, justification}`. | Map keyed by `"P S"` | It's ordered like the chart, so it prints and diffs predictably. Lookup is by `find` over 26 entries. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/style.ts` — `RangeSpot`, `BotStyleData.startingRange`, `parseStyle`'s third parameter and range
  validation, and `startingRangeFor`.
- `src/bots/styles/rock.json` — new: the Rock's style file.
- `src/bots/rock.ts` — new: `ROCK_STYLE`, `RockOptions`, `decideRock`.
- `src/table/advice-service.ts` — D-4 dispatch and its comment.
- `tests/bots/rock.acceptance.test.ts` — new (SPEC-01..SPEC-06).
- `tests/bots/rock.test.ts` — new unit (SPEC-08 seated run, SPEC-09).
- `tests/bots/style.test.ts` — extend (SPEC-07).
- `tests/table/advice-service.test.ts` — extend (SPEC-10). `'Rock'` leaves the TAG list at `:104`.

### Components, interfaces and data
`src/bots/style.ts` additions:
```ts
import { SIX_MAX_CHART } from '../advice/preflop';
import { APPLICABLE_SPOTS, chartCell, type Position, type PreflopChart, type Situation } from '../advice/preflop-chart';
import { HAND_CLASSES, type HandClass } from '../advice/hand-class';

export interface RangeSpot {
  readonly position: Position;
  readonly situation: Situation;
  readonly hands: ReadonlySet<HandClass>;
  readonly justification: string;
}
export interface BotStyleData { /* existing fields */ readonly startingRange: readonly RangeSpot[] | null; }
export function parseStyle(raw: unknown, fileName: string, chart: PreflopChart = SIX_MAX_CHART): BotStyleData;
/** The style's range for the spot; undefined when the style has no range or no such spot. */
export function startingRangeFor(style: BotStyleData, position: Position, situation: Situation): RangeSpot | undefined;
```

`src/bots/rock.ts` (imports: engine types only, `recommend`, `positionOf`/`situationOf` from `../advice/preflop`,
`handClassOf`, `./style`, `FREE_CHECK_EQUITY` from `./tag`. The JSON import goes **last**):
```ts
export const ROCK_STYLE: BotStyleData; // parseStyle(rock, 'rock.json') at import
export type RockOptions = RecommendOptions & { readonly style?: BotStyleData }; // default ROCK_STYLE (A-4)
export function decideRock(view: PlayerView, options?: RockOptions): Action;
```

`src/bots/styles/rock.json` (original text; approved Q-2). The builder writes `hands` exactly as listed. Prettier
formats the file.
```json
{
  "format": "tlh-bot-style",
  "version": 1,
  "style": "Rock",
  "description": "Rock (very tight) plays only a small set of strong starting hands and folds everything else before the flop, even many hands TAG would play. When it does play, it follows the trainer's own advice, so its raises usually mean a big pair or a strong ace. It checks its big blind when that is free rather than folding. Steal its blinds often, and give its bets and raises real respect.",
  "mixedSpots": [],
  "deviations": [],
  "startingRange": [
    { "position": "UTG", "situation": "unopened", "hands": "AA AKs AQs AJs ATs AKo KK KQs AQo QQ JJ TT 99 88 77",
      "justification": "First to act with five players behind, the Rock opens only pairs down to sevens and its best aces plus king-queen suited." },
    { "position": "HJ", "situation": "unopened", "hands": "AA AKs AQs AJs ATs A9s AKo KK KQs KJs AQo KQo QQ AJo JJ TT 99 88 77 66",
      "justification": "With one fewer player behind, the Rock adds sixes, a few suited aces and the strongest offsuit broadway hands to its opens." },
    { "position": "CO", "situation": "unopened", "hands": "AA AKs AQs AJs ATs A9s A8s A5s AKo KK KQs KJs KTs AQo KQo QQ QJs AJo KJo JJ JTs ATo TT T9s 99 88 77 66 55",
      "justification": "In the cutoff only three players remain, so the Rock opens some suited connectors and fives, still far fewer hands than TAG." },
    { "position": "BTN", "situation": "unopened", "hands": "AA AKs AQs AJs ATs A9s A8s A7s A6s A5s A4s A3s A2s AKo KK KQs KJs KTs K9s AQo KQo QQ QJs QTs Q9s AJo KJo QJo JJ JTs J9s ATo KTo TT T9s A9o 99 98s 88 77 66 55 44 33 22",
      "justification": "On the button the Rock acts last after the flop, so it opens every pair and suited ace but skips TAG's weaker offsuit steals." },
    { "position": "SB", "situation": "unopened", "hands": "AA AKs AQs AJs ATs A9s AKo KK KQs KJs KTs AQo KQo QQ QJs AJo KJo JJ JTs ATo TT 99 88 77 66",
      "justification": "From the small blind the Rock plays out of position against the big blind, so it raises only a cutoff-strength range and folds the rest." },
    { "position": "HJ", "situation": "limpers", "hands": "AA AKs AQs AJs AKo KK KQs AQo QQ JJ TT 99 88",
      "justification": "After limpers the Rock raises only hands that dominate typical limping ranges and does not join the pot with speculative hands." },
    { "position": "CO", "situation": "limpers", "hands": "AA AKs AQs AJs ATs AKo KK KQs KJs AQo QQ AJo JJ TT 99 88 77 66",
      "justification": "In the cutoff behind limpers the Rock isolates with strong aces and pairs and overlimps only small pairs that can flop a set." },
    { "position": "BTN", "situation": "limpers", "hands": "AA AKs AQs AJs ATs AKo KK KQs KJs KTs AQo KQo QQ QJs AJo JJ TT 99 88 77 66 55 44",
      "justification": "With position on every limper, the Rock raises its broadway hands and big pairs and limps behind with small pairs for set value." },
    { "position": "SB", "situation": "limpers", "hands": "AA AKs AQs AJs AKo KK KQs AQo QQ JJ TT 99 88 77",
      "justification": "The small blind will be out of position all hand, so the Rock completes or raises only with pairs and its strongest broadway hands." },
    { "position": "BB", "situation": "limpers", "hands": "AA AKs AQs AJs AKo KK KQs AQo QQ JJ TT 99",
      "justification": "In the big blind after limps the Rock checks for free with everything and raises only its premium pairs and best broadway hands." },
    { "position": "UTG", "situation": "raise", "hands": "AA AKs AQs AKo KK QQ JJ",
      "justification": "Facing a raise after limping first, the Rock continues only with big pairs and ace-king or ace-queen suited and folds the rest." },
    { "position": "HJ", "situation": "raise", "hands": "AA AKs AQs AKo KK QQ JJ TT",
      "justification": "Against a single early raise the Rock re-raises only premium pairs and big aces, folding the hands TAG would call with." },
    { "position": "CO", "situation": "raise", "hands": "AA AKs AQs AJs AKo KK AQo QQ JJ TT",
      "justification": "From the cutoff against one raise the Rock adds ace-jack suited and ace-queen offsuit and still folds every other hand." },
    { "position": "BTN", "situation": "raise", "hands": "AA AKs AQs AJs AKo KK KQs AQo QQ JJ TT 99",
      "justification": "On the button against one raise the Rock plays a slightly wider premium range because it keeps position for every later street." },
    { "position": "UTG", "situation": "raise-and-calls", "hands": "AA AKs AQs AKo KK QQ JJ",
      "justification": "With a raise and callers behind the first limp the Rock needs a premium hand, because several opponents already show interest." },
    { "position": "HJ", "situation": "raise-and-calls", "hands": "AA AKs AQs AKo KK QQ JJ TT",
      "justification": "Against a raise and callers the Rock continues with big pairs and its best aces and passes on the drawing hands TAG calls." },
    { "position": "CO", "situation": "raise-and-calls", "hands": "AA AKs AQs AJs AKo KK QQ JJ TT 99 88",
      "justification": "In the cutoff with a raise and callers, the pot is big enough for the Rock to call with medium pairs hoping to flop a set." },
    { "position": "BTN", "situation": "raise-and-calls", "hands": "AA AKs AQs AJs AKo KK KQs AQo QQ JJ TT 99 88 77",
      "justification": "On the button in a multiway raised pot, the Rock adds a few pairs and king-queen suited because position makes them easier to play." },
    { "position": "UTG", "situation": "re-raise", "hands": "AA AKs AKo KK QQ",
      "justification": "Facing a re-raise the Rock continues only with aces, kings, queens and ace-king, which keeps its range nearly impossible to bluff." },
    { "position": "HJ", "situation": "re-raise", "hands": "AA AKs AKo KK QQ",
      "justification": "From the hijack against a re-raise the Rock keeps the same five premium hands and folds everything else, even jacks." },
    { "position": "CO", "situation": "re-raise", "hands": "AA AKs AKo KK QQ JJ",
      "justification": "In the cutoff against a re-raise the Rock adds pocket jacks as a call, since later positions re-raise with wider ranges." },
    { "position": "BTN", "situation": "re-raise", "hands": "AA AKs AQs AKo KK QQ JJ",
      "justification": "On the button against a re-raise the Rock plays its premium pairs and two best suited aces, folding the hands TAG continues with." },
    { "position": "SB", "situation": "re-raise", "hands": "AA AKs AKo KK QQ",
      "justification": "In the small blind against a re-raise the Rock will be out of position, so it continues only with the five strongest hands." },
    { "position": "BB", "situation": "re-raise", "hands": "AA AKs AKo KK QQ JJ",
      "justification": "In the big blind against a re-raise the Rock has some chips invested already, so it adds jacks and otherwise folds." },
    { "position": "SB", "situation": "blind-defence", "hands": "AA AKs AQs AJs AKo KK KQs AQo QQ JJ TT 99",
      "justification": "Defending the small blind against a steal, the Rock re-raises its strong hands and folds the rest instead of calling out of position." },
    { "position": "BB", "situation": "blind-defence", "hands": "AA AKs AQs AJs ATs A9s A8s A7s A6s A5s A4s A3s A2s AKo KK KQs KJs KTs K9s AQo KQo QQ QJs QTs AJo KJo JJ JTs J9s ATo TT T9s 99 98s 88 77 66 55 44 33 22",
      "justification": "The big blind gets a good price against a single raise, so the Rock defends every pair, suited aces and connected broadway hands." }
  ]
}
```

### Rules and algorithms
- Validation, added to `parseStyle` after the deviations block. Here `name` is the style or `?`, `key` is
  `"<position> <situation>"`, and `where` is `<file>: style <name> starting range <position> <situation>`:
  1. `startingRange` absent: if style is `Rock`, `<file>: style Rock has no starting range`. Otherwise `startingRange =
     null`.
  2. Not a list: `<file>: startingRange must be a list`.
  3. For each entry, in file order:
     - If (`position`, `situation`) isn't one of the 26 `APPLICABLE_SPOTS['6-max']`: `<file>: style <name> starting
       range has unknown spot "<echo position>" "<echo situation>"`, and skip the entry.
     - Repeated spot: `<file>: style <name> lists starting range spot <key> twice`, and skip.
     - `hands` not a string: `<where> hands must be a string of hand classes`.
     - Otherwise, split on whitespace, dropping empty tokens. For each token not in `HAND_CLASSES`: `<where> has unknown
       hand class "<echo token>"`. For each repeat: `<where> lists <hc> twice`.
     - `wordCount(justification) < 10`: `<where> has no justification (at least 10 words)`.
     - If the hands are clean, check them against the chart. For each class, in token order, whose `chartCell(chart,
       position, situation, hc).action === 'fold'`: `<where> has <hc>, which the TAG chart folds`. If the class count
       n ≥ the chart's non-fold count m for the spot: `<where> has <n> hand classes, not fewer than the TAG chart's <m>`.
  4. For each `APPLICABLE_SPOTS` spot that's missing: `<file>: style <name> starting range is missing spot <key>`.
  5. Per position, in order UTG, HJ, CO, BTN, SB, BB. Only when every spot of that position is present with clean
     hands: if the union of the Rock's classes over the position's spots has n ≥ m, where m is the union of the chart's
     non-fold classes over the same spots: `<file>: style <name> starting range for <position> has <n> hand classes,
     not fewer than the TAG chart's <m>`.
  - Hand sets are stored in token order. `startingRange` is returned in `APPLICABLE_SPOTS` order. Problems fail the
    whole file, as before. An empty `hands` string ("") is valid: the Rock folds every class there.
  - Example: adding `72o` to UTG unopened gives exactly `['rock.json: style Rock starting range UTG unopened has 72o,
    which the TAG chart folds']`. The UTG union stays 16 < 39, so there's no per-position problem.
- Decision `decideRock(view, options = {})`, with `style = options.style ?? ROCK_STYLE` and `owed = view.currentBet −
  hero.streetContribution`:
  1. Preflop: `spot = startingRangeFor(style, positionOf(view), situationOf(view))`. If `style.startingRange === null`,
     throw `RangeError('Style <name> has no starting range')`. If the spot is missing, throw `RangeError('Style <name>
     has no starting range for <position> <situation>')` (it can't happen with a validated range). If
     `handClassOf(view.holeCards)` isn't in `spot.hands`: return the element of `view.legalActions` of type `'fold'` if
     owed > 0, else of type `'check'`. Otherwise return `recommend(view, options).move`.
  2. Postflop: with owed 0, `recommend(view, {...options, equity: FREE_CHECK_EQUITY}).move`. Otherwise
     `recommend(view, options).move`.
  - Consequences: inside the range the advice is never fold, because the range is a subset of non-fold cells and
    `legal()` maps non-fold to call, raise or check. So the Rock folds preflop exactly when the class is outside its
    range and owed > 0. It never folds with owed 0. It draws nothing. On a 5-seat view it throws `positionOf`'s
    RangeError, as TAG does.
- Decision points (A-6), collected once per test file. `runPlaytest({hands: 1000, seed: 65, size: 6}, undefined,
  {makePolicy})`, where every seat plays `randomMovePolicy(seatGenerator(code, seat))` and seat 1 first pushes each
  preflop view it's asked about. Prototype: 1,464 views, all 26 spots, 0 violations, about 0.1 s. The substituted view
  for class `hc` is `{...view, holeCards: cardsOf(hc)}`, where `cardsOf` gives pair → `<r>c <r>d`, suited → `<h>s
  <l>s` and offsuit → `<h>s <l>h` (via `parseCard`).
- Hand-worked decisions (prototype of this rule with the D-2 ranges, against HEAD `10a5f3e`; `views[i]` is the i-th
  recorded view):
  - **Example A (outside range, facing a bet: fold).** `views[1]`: BTN re-raise, Th Qs (QTo), button 1, currentBet
    16, betCount 4, owed 4, legal fold / call 4. The TAG chart's BTN re-raise QTo cell is `C`, so it's non-fold.
    QTo isn't in the Rock's 7 BTN re-raise classes. The Rock plays `{seat: 1, type: 'fold'}`, and `decideTag(view)`
    plays `{seat: 1, type: 'call', amount: 4}`.
  - **Example B (BB after limps, outside range: check).** `views[141]`: BB limpers, Jd Qd (QJs), button 5, currentBet
    4, betCount 1, owed 0, legal check / raise 8. TAG's cell is `R/c`, so TAG plays `{seat: 1, type: 'raise', amount:
    8}`. QJs isn't in the Rock's BB limpers range, so the Rock plays `{seat: 1, type: 'check'}`.
  - **Example C (inside range: plays the advice).** `views[79]`: UTG unopened, Qh Ac (AQo), button 4, currentBet 4,
    betCount 1, owed 4, legal fold / call 4 / raise 8. AQo is in range, so the Rock plays the advice `{seat: 1, type:
    'raise', amount: 8}`, the same as TAG.
  - **Example D (inside range, call cell).** `views[70]`: BB blind-defence, 2h Ah (A2s), currentBet 8, betCount 2,
    owed 4. The chart cell is `C`, so the Rock plays `{seat: 1, type: 'call', amount: 4}`.
  - **Example E (AC#5).** A copy of `rock.json` with `AQo` removed from UTG unopened parses cleanly (14 < 36). With
    that style, `views[79]` gives `{seat: 1, type: 'fold'}`.
  - Prototype tallies over the 1,464 natural views (out = outside the Rock range): owed > 0, out, TAG folds: 1,190, all
    Rock folds. Owed > 0, out, TAG plays: 189, all Rock folds. Owed > 0, in range: 51 raises and 16 calls. Owed 0, out:
    17 checks (TAG raises some). Owed 0, in range: 1 raise.
  - The tests assert the relations and the pinned example actions above, not the tallies.

### Locked tests
None change. No locked test mentions `Rock` or `startingRange`, or asserts the exact key set of `BotStyleData`. The
Maniac and Calling-station acceptance tests' exact-problem assertions mutate `maniac.json` and `calling-station.json`.
Those files have no `startingRange` and aren't `Rock`, so no new problem appears. The one changed assertion,
`tests/table/advice-service.test.ts:104` ('Rock' → `decideTag`), is a unit test, not locked. It's replaced by an
equally strict 'Rock' → `decideRock` assertion (SPEC-10).

### Error handling and configuration
- A bad shipped `rock.json`, or a chart change that breaks the subset or fewer rule, throws `StyleValidationError` at
  import of `src/bots/rock.ts`, and after D-4 at import of the worker module. So every test that loads it fails, and a
  future chart edit can't silently leave the Rock playing cells TAG folds.
- `positionOf`, `recommend` and `parseCard` errors propagate. The worker turns any throw into `ok: false` as before.

## 6. Behaviour specification

### SPEC-01: The Rock's style file holds its range for every spot and a description
- Verifies: AC#1, DoD#1, DoD#10
- Behaviour: Given `src/bots/styles/rock.json`, When `src/bots/rock.ts` is imported, Then `ROCK_STYLE.style ===
  'Rock'`, its description has at least 15 words, `mixedSpots.size === 0` and `deviations` is `[]`. `startingRange`
  has 26 entries, whose (position, situation) pairs equal `APPLICABLE_SPOTS['6-max']` in order. Each has a
  justification of at least 10 words, and each spot's class count equals D-2's (for example UTG unopened 15, BB limpers
  12, UTG re-raise 5, BB blind-defence 41). `parseStyle(raw, 'rock.json')` equals `ROCK_STYLE`. With `description`
  removed, the problems contain `rock.json: style has no plain-English description (at least 15 words)`. With
  `startingRange` removed, the problems are exactly `['rock.json: style Rock has no starting range']`. With the BB
  re-raise entry removed, they're exactly `['rock.json: style Rock starting range is missing spot BB re-raise']`.
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::the Rock style file holds a starting range for every position and situation and a description`

### SPEC-02: The validator holds the Rock range to a narrower subset of the TAG chart
- Verifies: AC#2
- Behaviour: Given the Rock file and `SIX_MAX_CHART`, When `parseStyle` runs, Then it succeeds. Independently of the
  validator, the test checks every class of every Rock spot with `chartCell(SIX_MAX_CHART, …).action !== 'fold'`. Each
  spot has fewer classes than the chart's non-fold count, and each position's union has fewer than TAG's union (UTG
  15 < 39, …, BB 41 < 169). Mutations (each on a deep copy), with the problems exactly:
  - `72o` appended to UTG unopened → `['rock.json: style Rock starting range UTG unopened has 72o, which the TAG chart
    folds']`.
  - BB re-raise hands set to all 22 TAG non-fold classes → `['rock.json: style Rock starting range BB re-raise has 22
    hand classes, not fewer than the TAG chart's 22']`.
  - Every UTG spot set to its TAG non-fold list minus `AA`, except UTG unopened, which is set to its TAG list minus
    `55`. Every spot then has fewer classes, but the union equals TAG's → `['rock.json: style Rock starting range for
    UTG has 39 hand classes, not fewer than the TAG chart's 39']`.
  - With the real `rock.json` and a chart parsed from a copy of `six-max.json` whose UTG raise `AA` cell is `F` →
    `['rock.json: style Rock starting range UTG raise has AA, which the TAG chart folds']`. This shows the rule reads the
    TAG chart passed to `parseStyle` (D-5).
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::every Rock range class is a TAG non-fold cell and each range is narrower`

### SPEC-03: Facing a bet preflop outside its range, the Rock folds under any replay code
- Verifies: AC#3
- Behaviour: Given every recorded view with owed > 0 (25 spots, all but BB limpers), and for each of them every hand
  class outside the Rock range for that spot substituted into the view, When the Rock decides, Then `decideRock(view)`
  is exactly the view's legal `fold`. The worker gives the same fold, `handleAdviceRequest({id: 1, kind: 'bot', view,
  style: 'Rock', seed})` → `{id: 1, ok: true, value: {seat: 1, type: 'fold'}}`, for seeds 0, 4294967295 and
  `botDecisionSeed(handReplayCode(6501, k), view)` for k = 1..3. The checked set includes at least one class per spot
  that the TAG chart plays, where `decideTag(view)` doesn't fold. Example A: the Rock folds, while TAG calls 4.
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::facing a bet preflop the Rock folds every hand class outside its range under any replay code`

### SPEC-04: In the big blind with no raise to face, the Rock checks hands outside its range
- Verifies: AC#4
- Behaviour: Given the recorded BB-limpers views (owed 0, at least one), and each of the 157 classes outside the Rock's
  BB limpers range substituted in, When the Rock decides, Then the action is exactly the view's legal `check`, never a
  fold. In Example B the Rock checks, while TAG raises to 8. The worker's `'Rock'` answer is also the check for seeds 0
  and 4294967295.
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::in the big blind with no raise to face the Rock checks hands outside its range`

### SPEC-05: Removing a class from the file makes the Rock fold it, with no code change
- Verifies: AC#5
- Behaviour: Given a deep copy of `rock.json`'s JSON with `AQo` removed from UTG unopened, parsed with `parseStyle(copy,
  'rock.json')` (it parses), When the Rock decides `views[79]` with `{style: modified}`, Then it plays `{seat: 1, type:
  'fold'}`, and with the shipped style it plays `{seat: 1, type: 'raise', amount: 8}` (Example E). Also, for every
  recorded owed > 0 spot and every class in its Rock range: with the shipped style, the substituted view's action isn't
  fold and equals `recommend(view).move`. With a copy that removes just that class from just that spot, the action is
  the legal fold.
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::removing a hand class from the Rock file makes the Rock fold it`

### SPEC-06: A Rock seat in the worker plays the Rock decision
- Verifies: AC#3, AC#4
- Behaviour: Given Example A's and Example B's views, When the worker gets `style: 'Rock'` with seed 0, Then it returns
  the fold and the check, and with `style: 'TAG'` and the same views it returns `decideTag(view, {random:
  botRandom(0)})`. Over all 1,464 recorded views, the worker's `'Rock'` answer equals `decideRock(view)` (D-4).
- Verification: acceptance `tests/bots/rock.acceptance.test.ts::a Rock seat in the worker plays the Rock decision`

### SPEC-07: Starting-range validation rules
- Verifies: AC#1, AC#2
- Behaviour: For a TAG-styled base file with a minimal valid `startingRange` (all 26 spots, `hands: "AA"`, except
  `"AA KK"` in BB limpers, and a 10-word justification), `parseStyle` succeeds. The range comes back in
  `APPLICABLE_SPOTS` order even when the file lists the spots in reverse. These each give exactly the listed problem:
  - `startingRange: {}` → `x.json: startingRange must be a list`.
  - A spot `UTG blind-defence` → `x.json: style TAG starting range has unknown spot "UTG" "blind-defence"`, plus the
    missing-spot problem when it replaces one.
  - A repeated `HJ raise` → `x.json: style TAG lists starting range spot HJ raise twice`.
  - `hands: 5` → `… starting range UTG unopened hands must be a string of hand classes`.
  - `"AA AKx"` → `… has unknown hand class "AKx"`.
  - `"AA AA"` → `… lists AA twice`.
  - A 9-word justification → `… has no justification (at least 10 words)`.
  - `hands: ""` is valid and gives an empty set.
  - Multiple problems are all listed.
  - The `echo` cut applies to a 30-character position.
  - `tag.json`, `calling-station.json` and `maniac.json` parse with `startingRange === null`.
  - `startingRangeFor(ROCK_STYLE, 'BB', 'limpers')?.hands.has('AA')` is `true`, and `startingRangeFor(TAG_STYLE,
    'UTG', 'unopened')` is `undefined`.
- Verification: unit `tests/bots/style.test.ts::parseStyle validates starting ranges`

### SPEC-08: The default playtest baseline is unchanged, and seated Rocks break no invariant
- Verifies: DoD#7
- Behaviour: `npm run -s playtest -- --hands 10000 --seed 42 --size 6` still prints `Player actions: 88920` and
  `Invariant violations: 0`, and its stdout SHA-256 is
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`. Also, a `runPlaytest({hands: 1000, seed: 42,
  size: 6})` with seats 2 and 4 playing `decideRock` and the rest `seededTagPolicy` reports `violations === 0`. The Rock
  seats folded preflop at least once and raised preflop at least once (A-7).
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-09: Rock decision units
- Verifies: AC#3, AC#4, AC#5
- Behaviour: Given the Rock decision, When it runs on these views, Then:
  - A style with `startingRange: null` (for example `TAG_STYLE`) throws `RangeError('Style TAG has no starting
    range')` on a preflop view.
  - A 5-seat preflop view throws `RangeError('The 6-max chart needs 6 dealt-in seats, got 5')`.
  - On the first three recorded-hand postflop views with owed > 0 (from the seed 65 collection, extended to record
    postflop views), `decideRock(view, {equity})` equals `recommend(view, {equity}).move`, with a test-local memo of
    `computeEquity`.
  - On a postflop view with owed 0 it's the legal check.
  - The seated 1,000-hand run of SPEC-08 is in this file.
- Verification: unit `tests/bots/rock.test.ts::Rock folds or checks outside its range and plays the advice inside it`

### SPEC-10: Worker default dispatch by style
- Verifies: AC#3
- Behaviour: `handleAdviceRequest` with no `deps` and `style: 'Rock'` returns `decideRock(view)` at the test's
  preflop and flop views for seeds 0, 12345 and 4294967295. `'Calling station'` and `'Maniac'` still return their bots,
  and `'TAG'` still returns `decideTag`.
- Verification: unit `tests/table/advice-service.test.ts::default bot decision dispatches the Rock`

### SPEC-11: Checks, coverage, boundaries, CI and documentation
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8, DoD#9, DoD#11, DoD#12, DoD#13
- Behaviour: Given the finished change, When the checks run, Then:
  - `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, and the coverage thresholds hold (≥ 90%
    engine/bots/advice/statistics, ≥ 70% overall).
  - The bots import-boundary test passes for `src/bots/rock.ts` and `src/bots/style.ts`: engine imports are type-only,
    there's no UI import, and the JSON import comes last. The REQ-028.1 lint guard (`src/bots/**`) is clean.
  - CI is green on `doit/TASK-6.5`.
  - A story doc is published with `backlog doc`. It covers the `startingRange` format and rules, the Rock ranges with
    their counts and justifications, the decision rule with Examples A, B and E, the measured VPIP/PFR from D-2, and
    both scope concerns.
  - Not applicable: DoD#4 (no golden-spot suite yet, E07-S14), DoD#8 and DoD#13 (no screen or dialog), DoD#9 (no
    network code; pure computation over bundled JSON). The new normal-suite tests take a few seconds at most, with no
    timing assertions.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- BB limpers with a class outside the range: owed is 0, so it checks (SPEC-04). That's the only preflop owed-0 spot.
  The BB after a lone SB complete is also `limpers` (`src/advice/preflop.ts:65`).
- SB unopened owes half a bet (owed > 0), so a class outside the range folds (SPEC-03 covers SB unopened).
- In-range class whose advice raise is illegal (capped, or REQ-016.5): `legal()` makes it call, so the Rock calls
  (SPEC-05: the action equals the advice's move).
- In-range class whose chart cell is `R/f` or `C/f`: the Rock plays the main action, with no mixing (D-3).
- Empty range for a spot: valid, and the Rock folds or checks everything there (SPEC-07).
- A chart edit that folds a Rock class: validation fails at import (SPEC-02's modified chart).
- Spot order in the file, duplicates, unknown spots, bad tokens, missing spots: SPEC-07.
- Non-6-max view: `positionOf` throws, as for TAG (SPEC-09).
- Concurrency, interruption, permissions, dependency failure: N/A. This is pure computation over bundled data.

## 8. Security considerations
- Trust boundary: style files are bundled, authored data. They're still validated at import (fail closed), with echoes
  cut to 20 characters. Hand tokens are matched against the fixed `HAND_CLASSES` list. The worker's `style` only
  selects among four functions, and unknown values fall through to TAG.
- Hidden information: the decision reads only the bot's `PlayerView` (its own hole cards).
- Randomness: none in the Rock (A-3). No `Math.random`/`Date` (the lint guard covers `src/bots/**`).
- New dependencies, secrets, authn, injection, logs: none / N/A.

## 9. Non-functional
- Speed: the Rock's preflop out-of-range decision does no `recommend` call. Measured: the 1,000-hand view collection
  takes about 0.1 s, and the seated 1,000-hand run about 0.1 s. The substitution sweeps (about 4,000 decisions, each
  through the worker as well) take under 1 s. The only equity runs are three postflop views in SPEC-09 (about 10 ms
  each, memoized). All of this is in the normal suite, with no timing assertions. The per-test timeout is 120 s, as in
  earlier bot tests.
- Determinism: the same view gives the same action. The default playtest output stays byte-identical (SPEC-08).
- Validation cost: 26 spots × at most 169 lookups at import. That's negligible.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --size 6`
- New tests:
  - `tests/bots/rock.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
  - `tests/bots/rock.test.ts` → SPEC-08 (seated run), SPEC-09
  - `tests/bots/style.test.ts` → SPEC-07
  - `tests/table/advice-service.test.ts` → SPEC-10
- End-to-end for the Judge: run the playtest command above and compare the SHA-256 with SPEC-08. Run `npx vitest run
  tests/bots/rock.acceptance.test.ts` and confirm Examples A–E.

## 11. Open questions
- None. Q-1..Q-4 were answered (auto-accepted, recommended options); see `doit/TASK-6.5/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.5/qa.md`.
