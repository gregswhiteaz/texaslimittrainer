# Spec: TASK-7.14 — Check advice against postflop golden spots on every test run

Status: READY (approved 2026-11-24)
Task: TASK-7.14 · Parent/epic: TASK-7 · Requirements: REQ-037, REQ-038, REQ-039, REQ-061 · Dream: limit-holdem-trainer

## 1. Summary
This is part 2 of the golden-spot suite. It adds at least 100 authored postflop spots (flop, turn and river) to the
110 preflop spots from TASK-7.11, which brings the suite to at least 200. The spot format gains a `board`, and the
validator gains a mechanical clear-cut rule: every legal action other than the recorded answer must grade as a Major
error under REQ-038. So call/fold spots sit at least 10 points from the required equity, and bet/check spots sit at
least 15 points from 50% against the calling range. A new graded-examples file pins the exact grade, rule id and
margin for preflop and postflop decisions at Correct, Minor error and Major error. The task also settles three
preflop spot follow-ups from TASK-7.11's review (AC#7–9). Everything runs in `npm test` and on every CI push, and it
stays fast: each spot costs one memoised advice call.

## 2. Scope
- In scope:
  - `src/advice/golden.ts`: postflop view building (board), `parsePostflopGoldenSpots`, the clear-cut check,
    postflop advice for spots (user-facing options plus observed stats, memoised), `checkGoldenSpot` for both kinds,
    and `parseGradedExamples` / `checkGradedExample`.
  - `tests/golden/postflop-spots.json`: at least 100 authored postflop spots (target 120, A-3).
  - `tests/golden/graded-examples.json`: at least 6 graded examples (target 9, A-6).
  - Preflop follow-ups in `tests/golden/preflop-spots.json` (AC#7–9), plus the full-ring chart cell change approved by Q-1
    (BTN `raise` 99 and 88 → raise).
  - Locked acceptance tests, unit tests, and an update to `docs/advice/golden-spots.md`.
- Not doing:
  - Any change to the postflop advice rules, the equity engine, ranges, explanations or the grader. Golden spots
    record the current engine's answers. They never tune it.
  - Implied-odds calls as golden spots. Under REQ-038.3 a fold there is never a Major error (equity is below the
    required equity), so they cannot be clear-cut. The validator rejects them on its own (§5).
  - Splitting preflop chart cells by raiser position (TASK-7.21), heads-up and full-ring default ranges (TASK-7.26),
    and straight-draw outs (TASK-7.28).
  - A spot generator: spots are literal authored data, as in TASK-7.11 D-3.
  - A sampling-noise re-run of every spot with a second equity budget. The 10/15-point margins already cover it
    (D-4).
  - Changes to `tests/golden/preflop.acceptance.test.ts`, `tests/golden/golden-spots.test.ts`, any npm script, CI
    workflow or dependency. No UI.
- Scope budget: files=9, lines=3100   (postflop-spots.json is about 1,700 of these lines after Prettier)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Postflop spots are advised exactly as the app advises the user: `recommendPostflop(view, { opponentRanges: 'actions', observedOpponents })` (`ACTION_RANGE_ADVICE`, `src/table/advice-service.ts:65`). `observedOpponents` comes from the spot's `opponentStats` and is `[]` when that field is absent. | yes | The golden suite must protect the advice the learner actually sees. The default `'unseen'` mode is used only by bots and tests. | `recommend(view)` with no options (bot path). |
| A-2 | A postflop spot's `opponentStats`, when present, maps a seat to `{ hands, vpip, pfr }`: `hands` is an integer ≥ 0 and `vpip`/`pfr` are numbers from 0 to 100 (the `ObservedOpponent` rules, `src/advice/ranges.ts:300-308,560-571`). Other keys are a problem. The preflop `opponentStats` rule (TASK-7.11 A-5) is unchanged. | yes | Postflop advice really reads these stats, so they must be valid input to it. | Accept arbitrary stat names and ignore the unknown ones. |
| A-3 | Target 120 postflop spots: flop 45, turn 40, river 35. At least 70% are 6-max, at least 12 heads-up and at least 12 full ring. Each of bet, check, call, fold and raise is recorded at least 10 times. At least 15 are multiway (2+ live opponents), at most 5 have 6+ live opponents, and at least 3 use `opponentStats` with `hands` ≥ 30. Tests enforce only: ≥ 100 postflop, ≥ 1 per street, ≥ 1 of each of the five actions, ≥ 200 in total. | yes | 6-max is where action-based ranges exist (`src/advice/ranges.ts:604-617`). Heads-up and full ring use every unseen combo until TASK-7.26, so their numbers may shift later. Big multiway spots cost about 200 ms each (§9). | An even split by table size. |
| A-4 | Postflop justifications follow the preflop rules (TASK-7.11 A-2): at least 15 words, at most 3 sentences, naming a listed concept. They are distinct across both files. A postflop justification is not required to name the hand class, because postflop reasoning is about the made hand or draw. | yes | Same teaching standard as REQ-037. | Also require a board or hand mention (hard to check mechanically). |
| A-5 | Postflop spots record no `alternative` (the engine returns none postflop, `src/advice/postflop.ts:36-37`). The format still accepts one, validated as for preflop, and the clear-cut rule skips it. | yes | Keeps the format uniform. | Forbid `alternative` on postflop spots. |
| A-6 | Graded examples live in their own file, `tests/golden/graded-examples.json` (format `tlh-graded-examples` version 1). They do not count toward the 200, and they are exempt from the clear-cut rule. Target 9: preflop match, preflop-borderline (minor), preflop-chart (major); postflop match, call-fold-margin minor and major, aggression-margin minor and major, plus one `alternative` Correct. Every postflop example must use a spot whose advice reports `equityMethod: 'exact'`, so its pinned margin does not depend on the sampler. | yes | Minor examples are close calls by definition, so they cannot be golden spots. Exact enumeration makes the pinned margins stable. | A `graded` array inside each spot file. |
| A-7 | AC#9 replacements: `fr-co-limpers-87s` becomes `fr-co-limpers-44` (call; the neighbouring pairs 55 and 33 both call). `fr-sb-unopened-65s` becomes `fr-sb-unopened-kjs` (raise; KQs, KTs and QJs all raise). No full-ring SB-unopened call cell has every neighbour calling, so the SB replacement is a raise. Both cells are non-borderline (checked against `src/advice/charts/full-ring.json`). | yes | AC#9's first option, as the TASK-7.11 judge recommended (J-1-01). It needs no chart change. | Keep both spots and add chart justifications for the connector "islands". |
| A-8 | Neighbours of a chart cell (used for AC#9): for a pair, the adjacent pairs (88 → 99, 77). For a suited or offsuit hand, the grid-adjacent cells of the same suitedness, excluding pairs (87s → 97s, 86s). | yes | Matches the TASK-7.11 judge's reading (`doit/TASK-7.11/judge/round-1.json:28`). | Include diagonal connectors. |

## 3. Current system
- TypeScript strict, Vitest 5, ESLint and Prettier (JSON included), `tsc` (`package.json:13-25`). `npm test` =
  `vitest run --coverage` over `tests/**/*.test.*` (`vite.config.ts:7`). `testTimeout` is 30 s (`vite.config.ts:10`).
  Coverage requires 90% lines in `src/advice/**` (`vite.config.ts:15-18`).
- CI on every push (`.github/workflows/ci.yml:113-150`): the coverage job runs `npm run test:unit`, which excludes
  `*.acceptance.test.*`, `*.property.test.*` and `*.perf.test.*` (`package.json:14`). The two uncovered `test:sweeps`
  shards run exactly those files (`package.json:15`). So golden acceptance files run on every push without the
  ~5× coverage slowdown. In the coverage job, `src/advice/golden.ts` is covered only by unit tests, which must
  therefore stay cheap: they use stubbed advice except for one heads-up river spot.
- Golden suite part 1: `src/advice/golden.ts:1-301` (format constants, `parseGoldenSpots`, `checkGoldenSpot`,
  `sentencesOf`, `namedConcepts`, `dealtHand`, `replay`, `buildView`, `echo`, `wordCount`). Data:
  `tests/golden/preflop-spots.json` (110 spots). Tests: `tests/golden/preflop.acceptance.test.ts` (uses
  `GoldenSpot.referenceSize/.situation/.handClass` and `checkGoldenSpot(spot, stub)`, so those signatures must stay)
  and `tests/golden/golden-spots.test.ts`. The docs already announce that postflop extends the same format
  (`docs/advice/golden-spots.md:4-5`).
- Postflop advice: `recommendPostflop` (`src/advice/postflop.ts:96-217`) returns `action`, `ruleId`, `equityPct`,
  `requiredEquityPct`, `equityVsCallingRangePct`, `equityMethod` and `explanation`, all one-decimal percents. The
  value threshold is 50 (`postflop.ts:29`). Every explanation template quotes `{equity}` and `{required}` via
  `formatPct` (`src/advice/explanations.ts:111-126`, `src/advice/explain.ts:20-22`).
- Equity is deterministic. The sampled path seeds `Xoshiro128` from a hash of the canonical input
  (`src/advice/equity.ts:136-163,341`), so the same view always gives the same numbers on any machine.
- Grader: `gradeDecision` (`src/advice/grade.ts:93-142`) uses `call-fold-margin` (Major at ≥ 10.0 points) whenever
  either action is fold, and `aggression-margin` (Major at ≥ 15.0 points from 50 against the calling range)
  otherwise. Preflop uses `match`, `alternative`, `preflop-borderline` (minor) and `preflop-chart` (major), with
  margin `null`. `GRADE_LABELS` is at `grade.ts:12-16`.
- Engine dealing (D-5): hole cards at deck indexes `0..2n-1` (seat after the button first, two passes,
  `src/engine/hand.ts:276`), then burn `2n`, flop `2n+1..2n+3`, burn `2n+4`, turn `2n+5`, burn `2n+6`, river `2n+7`
  (`src/engine/hand.ts:501-512`). Legal postflop types are fold/call/raise when owing and check/bet otherwise
  (`src/engine/hand.ts:343-370`). Check and fold are never legal together.
- Measured cost of postflop advice (dev machine, uncovered, `npx vitest run tests/advice/postflop.perf.test.ts`): about
  22 ms p95 heads-up or 6-max flop, 25 ms for actions mode against 3 opponents, and 200 ms against 9 opponents.
- Existing code to reuse:
  - `src/advice/golden.ts` → `replay`, `legalOf`, `parseHoleCards`, `echo`, `wordCount`, `sentencesOf`,
    `namedConcepts`, `isRecord`, `GoldenSpotValidationError`, `GOLDEN_STAKES`, `GOLDEN_STACK`; generalise
    `dealtHand` to place board cards.
  - `src/advice/postflop.ts` → `recommendPostflop`, `PostflopRecommendation`, `PostflopAdvice`.
  - `src/advice/grade.ts` → `gradeDecision`, `GRADE_LABELS`, `GRADE_RULE_IDS`, types `Grade`, `GradeRuleId`,
    `ActionType`, `EquityGradeInput`.
  - `src/advice/ranges.ts` → `ObservedOpponent`.
  - `src/advice/explain.ts` → `formatPct`, `handClassName`.
  - `src/advice/preflop.ts` → `FULL_RING_CHART`, `positionOf`; `src/advice/preflop-chart.ts` → `chartCell`.
  - `src/engine/cards.ts` → `parseCards`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Extend format `tlh-golden-spots` version 1 additively. A postflop spot adds `board` and `street` and omits `situation`. Postflop spots live in their own file and are parsed by `parsePostflopGoldenSpots`. The preflop file, `parseGoldenSpots` and the `GoldenSpot` type are unchanged. | A version 2 format; one mixed file with a discriminated `GoldenSpot` union. | The docs promise "the postflop half extends the same format" (`docs/advice/golden-spots.md:4-5`). A union type would break typechecking of the locked preflop test, which reads `.referenceSize` and `.situation` on `GoldenSpot`. | no | n/a (TASK-7.11 Q-1 settled the compact format) |
| D-2 | Clear-cut rule = "every other legal action is a Major error". For each legal action type in the view other than the recorded `action`/`alternative`, `gradeDecision` (with the recorded action and the engine's numbers) must return `major`. This reproduces the story's rule exactly: ≥ 10 points from required equity for call/fold, ≥ 15 points from 50% against the calling range for bet/check and raise/call. It also covers three-way decisions (fold/call/raise). | Two hand-coded margin checks keyed on the recorded action. | Reuses the grader, so the suite's definition of "clearly wrong" can never drift from REQ-038's. It automatically excludes implied-odds calls and close raise-versus-call spots. | no | n/a |
| D-3 | The validator measures margins with the same advice the runner checks (A-1). The advice is memoised per spot view (a `WeakMap` keyed by the `PlayerView` object that also stores the `observedOpponents` reference it was computed with), so parsing, the runner, the explanation check and the graded examples share one computation per spot. `parsePostflopGoldenSpots` takes an `advise` seam that the unit tests stub. | Computing advice twice; caching the recommendation on the spot object. | One equity run per spot keeps the every-push cost low (§9). A memo is sound because advice is deterministic (§3). | no | n/a |
| D-4 | Sampling robustness comes from determinism plus margin. Seeds come from the input (`equity.ts:136`), so results never vary between runs. The 10- and 15-point margins are at least 6× REQ-034's 1.5-point accuracy bound, so an accurate engine cannot flip a recorded answer. Graded examples, whose margins are pinned exactly, use exact-enumeration spots (A-6). | Re-running each spot with a second sample budget or seed. | That would double the cost and add nothing the margin doesn't already guarantee. | no | n/a |
| D-5 | AC#7: full-ring BTN facing a single raise, 99 and 88 change from call to re-raise in `src/advice/charts/full-ring.json` (77 stays a call); the BTN `raise` chart justification is updated, and `fr-btn-raise-88` is recorded as `raise` with a justification about isolating the opener and charging the blinds in position. Approved by Q-1. | Keep the call and rewrite the justification only. | Fits the chart's stated policy ("Facing a single raise we mostly re-raise or fold"); set-mining odds are small in limit. | yes | user (Q-1, auto-accepted) |
| D-6 | Graded-example check: `gradeDecision(advice, userAction)` must equal the recorded `grade`, `ruleId` and `marginPts` (number or `null`), compared exactly. Preflop advice = `recommend(view)`. Postflop advice = the A-1 advice. | Comparing the grade only. | AC#6 asks for the exact grade, rule id and margin. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/golden.ts` — modify: board-aware `dealtHand`/`buildView`, `parsePostflopGoldenSpots`,
  `PostflopGoldenSpot`, `goldenPostflopAdvice` (memoised), clear-cut check, `checkGoldenSpot` accepting both spot
  kinds, `parseGradedExamples`, `GradedExample`, `checkGradedExample`
- `tests/golden/postflop-spots.json` — new: at least 100 authored postflop spots (original, REQ-061.2)
- `tests/golden/graded-examples.json` — new: at least 6 graded examples (A-6)
- `tests/golden/postflop.acceptance.test.ts` — new, locked after the first green build (SPEC-01..SPEC-05, SPEC-10)
- `tests/golden/suite.acceptance.test.ts` — new, locked after the first green build (SPEC-06..SPEC-09)
- `tests/golden/postflop-golden.test.ts` — new unit tests (SPEC-11..SPEC-13)
- `tests/golden/preflop-spots.json` — modify: AC#7 (`fr-btn-raise-88` → `raise`, Q-1), AC#8 text, AC#9 replacements
- `src/advice/charts/full-ring.json` — modify (Q-1): BTN `raise` grid 99 and 88 `C` → `R`, and the spot
  justification no longer says "call with a few pairs"
- `docs/advice/golden-spots.md` — modify: postflop format, clear-cut rule, graded examples, counts, AC#7–9 notes

### Components, interfaces and data
Postflop spot (in `tests/golden/postflop-spots.json`, header `{"format":"tlh-golden-spots","version":1,"spots":[…]}`):
```json
{
  "id": "6max-flop-btn-bet-top-pair-aq",
  "seats": 6,
  "position": "BTN",
  "street": "flop",
  "holeCards": "As Qd",
  "board": "Ah 8c 3d",
  "before": ["fold", "fold", "fold", "raise", "fold", "call", "check"],
  "action": "bet",
  "alternative": null,
  "justification": "…"
}
```
Field rules (in addition to TASK-7.11's `id`, `seats`, `holeCards`, `justification` rules, A-4):
- `board`: 3, 4 or 5 different cards in `parseCards` notation, none equal to a hole card.
- `street`: `"flop" | "turn" | "river"`, and it must equal the street for the board's length (3/4/5).
- `before`: every action from the first preflop decision up to the hero's decision, each
  `"fold" | "check" | "call" | "bet" | "raise"`, applied to whichever seat is to act (amounts from its legal action).
- `position`: must equal `positionOf(view)`. A `situation` field is a problem on a postflop spot.
- `action`: one of the five types, legal in the view. `alternative`: as for preflop (A-5).
- `opponentStats`: optional; see A-2.

Exports added to `src/advice/golden.ts`:
```ts
export type GoldenStreet = 'flop' | 'turn' | 'river';
export interface PostflopGoldenSpot {
  readonly id: string;
  readonly view: PlayerView;                       // hero = view.seat = view.toAct, view.street = street
  readonly street: GoldenStreet;
  readonly position: Position;
  readonly observed: readonly ObservedOpponent[];  // from opponentStats; [] when absent
  readonly action: PostflopAdvice;
  readonly alternative: PostflopAdvice | null;
  readonly justification: string;
}
/** The numbers the clear-cut rule reads; PostflopRecommendation is assignable. */
export type GoldenNumbers = Pick<PostflopRecommendation,
  'action' | 'equityPct' | 'requiredEquityPct' | 'equityVsCallingRangePct'>;
/** recommendPostflop(view, { opponentRanges: 'actions', observedOpponents: observed }), memoised (D-3). */
export function goldenPostflopAdvice(view: PlayerView, observed: readonly ObservedOpponent[]): PostflopRecommendation;
/** Validates every spot incl. the clear-cut rule; throws GoldenSpotValidationError listing every problem. */
export function parsePostflopGoldenSpots(
  raw: unknown,
  advise?: (view: PlayerView, observed: readonly ObservedOpponent[]) => GoldenNumbers, // default goldenPostflopAdvice
): PostflopGoldenSpot[];
/** Widened: preflop default advice recommend(view); postflop default goldenPostflopAdvice(view, spot.observed). */
export function checkGoldenSpot(
  spot: GoldenSpot | PostflopGoldenSpot,
  advise?: (view: PlayerView) => { readonly action: string },
): string | null;

export const GRADED_FORMAT = 'tlh-graded-examples';
export interface GradedExample {
  readonly id: string;
  readonly view: PlayerView;                      // preflop when no board
  readonly observed: readonly ObservedOpponent[];
  readonly userAction: ActionType;
  readonly grade: Grade;
  readonly ruleId: GradeRuleId;
  readonly marginPts: number | null;
  readonly justification: string;
}
export function parseGradedExamples(raw: unknown): GradedExample[];      // throws GoldenSpotValidationError
/** null when gradeDecision(advice, userAction) matches grade, ruleId and marginPts exactly; else the message. */
export function checkGradedExample(example: GradedExample, advise?: (view: PlayerView) => GradeInput): string | null;
```
Graded example (in `tests/golden/graded-examples.json`, header `{"format":"tlh-graded-examples","version":1,"examples":[…]}`):
fields `id`, `seats`, `holeCards`, optional `board` + `street` (postflop), `before`, optional `opponentStats`,
`userAction` (legal in the view), `grade` (`correct|minor|major`), `ruleId` (one of `GRADE_RULE_IDS`), `marginPts`
(finite number with at most one decimal, or `null`), and `justification` (A-4 rules; it explains why that grade
follows).

### Rules and algorithms
View building (generalises `dealtHand`, `src/advice/golden.ts:105-117`): the 52-slot deck gets the hero's cards at
its two deal indexes (`hero === 1 ? n-1 : hero-2`, plus `n`). The board cards go at `2n+1, 2n+2, 2n+3` (flop),
`2n+5` (turn) and `2n+7` (river). Every other slot takes the remaining cards in ascending order. As before, a first
pass finds the hero (`toAct` after the steps) and a second pass deals the hero its cards and replays. Preflop spots
build exactly the views they built before (no board slots are fixed).

After the steps, the hand must be on the street for the board's length with a seat to act. Otherwise:
`the steps do not reach a <street> decision`.

Clear-cut check (postflop spots only; runs only once the spot has no other problem):
1. `n = advise(view, observed)` (catching any thrown Error as the problem `advice failed (<message>)`).
2. `input: EquityGradeInput = { basis: 'equity', action: spot.action, alternative: spot.alternative,
   equityPct: n.equityPct, requiredEquityPct: n.requiredEquityPct, equityVsCallingRangePct: n.equityVsCallingRangePct }`.
3. For each `type` of `view.legalActions` in order, skipping `spot.action` and `spot.alternative`:
   `g = gradeDecision(input, type)`. If `g.grade !== 'major'`, record the problem
   `not clear-cut, <type> would be a <GRADE_LABELS[g.grade]> (<g.ruleId> <g.marginPts> points; clear-cut needs <10|15>)`
   (10 for `call-fold-margin`, 15 for `aggression-margin`).

Worked examples (tenths compare, `grade.ts:76`):
- Facing a bet, recorded `call`, legal fold/call/raise, E 41.0, R 31.0, V 30.0. Fold → call-fold-margin 10.0 → major.
  Raise → aggression-margin 20.0 → major. Clear-cut.
- The same with E 40.9: fold → 9.9 → minor → problem `not clear-cut, fold would be a Minor error (call-fold-margin
  9.9 points; clear-cut needs 10)`.
- Nothing owed, recorded `bet`, V 64.9: check → aggression-margin 14.9 → problem `… check would be a Minor error
  (aggression-margin 14.9 points; clear-cut needs 15)`. With V 65.0 it is clear-cut.
- Implied-odds call (E 22.0 < R 25.0): fold → margin −3 → minor → rejected.

Runner: `actual = advise(spot.view).action` (postflop default `goldenPostflopAdvice(spot.view, spot.observed)`).
It passes when `actual` equals `spot.action` or `spot.alternative`. The message format is unchanged from TASK-7.11.

### Error handling and configuration
All problems go into one `GoldenSpotValidationError`, prefixed `Golden spot <id>:` (spots) or `Graded example <id>:`
(examples), with `#<n>` when the id is missing and `echo` truncation as in TASK-7.11. New problem texts:
- `missing player view (board must be 3 to 5 different cards not in holeCards)`
- `missing player view (the steps do not reach a <flop|turn|river> decision)`
- `street <x> does not match the board (<expected>)`
- `situation is a preflop field`
- `invalid opponent stats` (A-2 violations)
- `advice failed (<message>)`
- `not clear-cut, …` (above)
- Graded examples: `invalid user action "<x>"` (unknown or not legal) · `invalid grade "<x>"` ·
  `invalid rule id "<x>"` · `invalid margin "<x>"`
- File header: `Golden spot file: expected format "tlh-golden-spots" version 1` /
  `Graded example file: expected format "tlh-graded-examples" version 1` (each thrown alone).

Graded-example runner message:
`Graded example <id>: expected <grade> by <ruleId> at <margin>, got <grade> by <ruleId> at <margin>`, where `<margin>`
is `String(marginPts)` or `no margin` for `null`.

## 6. Behaviour specification

### SPEC-01: Postflop and total counts
- Verifies: AC#1
- Behaviour: Given `tests/golden/postflop-spots.json` and `tests/golden/preflop-spots.json`, When both are parsed and
  counted, Then there are at least 100 postflop spots, at least one each with `street` `flop`, `turn` and `river`, at
  least one each recording `bet`, `check`, `call`, `fold` and `raise`, and at least 200 spots across both files.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::AC#1 at least 100 postflop spots across flop, turn and river and at least 200 in total`

### SPEC-02: Every postflop spot is complete; an incomplete one fails naming the spot
- Verifies: AC#1, AC#5
- Behaviour: Given the shipped postflop file, When `parsePostflopGoldenSpots` runs, Then it does not throw. Every spot's
  view has `street` equal to the spot's `street`, `board.length` 3/4/5 to match, and `toAct === seat`, and every spot
  has a legal `action` and a justification of at least 15 words. Given a copy of the first spot with id `probe` that
  has (a) a board card equal to a hole card, (b) no `action`, (c) no `justification`, Then the problems include a line
  starting with, respectively, `Golden spot probe: missing player view`, `Golden spot probe: missing recommended
  action`, `Golden spot probe: missing written justification (at least 15 words)`.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::AC#1 every postflop spot has a view on its street, an action and a justification`

### SPEC-03: Close spots are rejected as not clear-cut
- Verifies: AC#2
- Behaviour: Given a valid probe spot facing a bet with legal fold/call/raise and recorded `call`, and a stub `advise`,
  When the validator runs with E 40.9, R 31.0, V 30.0, Then it throws with the problem
  `Golden spot probe: not clear-cut, fold would be a Minor error (call-fold-margin 9.9 points; clear-cut needs 10)`.
  With E 41.0 it validates. Given a probe with nothing owed and recorded `bet`, When V is 64.9, Then the problem is
  `Golden spot probe: not clear-cut, check would be a Minor error (aggression-margin 14.9 points; clear-cut needs 15)`,
  and with V 65.0 it validates. Given recorded `check` with V 35.1 it is rejected, and with V 35.0 it validates.
  Validation of the shipped file with the real advice also passes (SPEC-02), so every shipped spot meets the margins.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::AC#2 a spot within 10 points of required equity or 15 points of 50% is rejected as not clear-cut`

### SPEC-04: Every postflop spot agrees with the advice; disagreement names spot, expected and actual
- Verifies: AC#5, DoD#4
- Behaviour: Given each shipped postflop spot, When `checkGoldenSpot(spot)` runs (one `it` per spot titled
  `AC#5 the advice engine agrees with golden spot <id>`), Then it returns `null`. Given a shipped spot whose advice is
  `bet` with its action changed to `check`, Then it returns exactly `Golden spot <id>: expected check, got bet`. The
  preflop half keeps passing through the unchanged `tests/golden/preflop.acceptance.test.ts`.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::AC#5 the advice engine agrees with golden spot <id>` and `::AC#5 a disagreement names the spot, the expected and the actual action`

### SPEC-05: Postflop explanations quote the equity and required equity
- Verifies: AC#4
- Behaviour: Given every shipped postflop spot and `rec = goldenPostflopAdvice(spot.view, spot.observed)`, When
  `rec.explanation` is checked, Then it contains `formatPct(rec.equityPct)` and `formatPct(rec.requiredEquityPct)`
  (e.g. `62.4%` and `0.0%`), has 1 to 3 sentences by `sentencesOf`, each ending in `.`, `!` or `?`, and names at
  least one concept by `namedConcepts`. Each spot's `justification` meets the same sentence and concept rules.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::AC#4 every postflop explanation quotes the equity and required equity it returns`

### SPEC-06: Graded examples are graded exactly as recorded
- Verifies: AC#3, AC#6
- Behaviour: Given `tests/golden/graded-examples.json`, When `parseGradedExamples` and `checkGradedExample` run, Then
  every example returns `null`. The examples include at least one preflop and one postflop example (postflop = has
  `board`) for each of `correct`, `minor` and `major`. Every preflop example has `marginPts` `null`, every postflop
  minor/major example has a numeric `marginPts`, and every postflop example's advice has `equityMethod === 'exact'`
  (A-6). Changing one example's recorded `marginPts` by 0.1 makes `checkGradedExample` return the
  `Graded example <id>: expected … got …` message.
- Verification: acceptance `tests/golden/suite.acceptance.test.ts::AC#3 AC#6 graded examples at each grade, preflop and postflop, match grade, rule id and margin`

### SPEC-07: fr-btn-raise-88 and its chart cell agree
- Verifies: AC#7
- Behaviour: Given `fr-btn-raise-88` (9 seats, HJ opens, CO folds, hero BTN with 88), When the spot and
  `chartCell(FULL_RING_CHART, 'BTN', 'raise', '88')` are compared, Then the cell is not borderline, the cell action
  equals the spot's `action`, which is `raise` (Q-1). The cell for 99 is also `raise` and the cell for 77 stays `call`.
  The spot's justification argues isolation and position and makes no implied-odds claim against a single raiser.
- Verification: acceptance `tests/golden/suite.acceptance.test.ts::AC#7 fr-btn-raise-88 and its full-ring chart cell agree`

### SPEC-08: AJs justification is about the caller
- Verifies: AC#8
- Behaviour: Given spot `fr-hj-raise-and-calls-ajs`, When its justification is read, Then it does not match
  `/dominat[^.]*opener/i`, it does mention the caller (`/caller/i`), and the spot's action is still `call`.
- Verification: acceptance `tests/golden/suite.acceptance.test.ts::AC#8 the AJs justification places the domination claim on the caller`

### SPEC-09: Call islands replaced
- Verifies: AC#9
- Behaviour: Given the preflop file, Then it has no spot with id `fr-co-limpers-87s` or `fr-sb-unopened-65s`. It has
  `fr-co-limpers-44` (action `call`) and `fr-sb-unopened-kjs` (action `raise`), and for each, every A-8 neighbour of
  its full-ring chart cell has the same action as the cell, which equals the spot's action. The preflop count stays at
  least 100 and every (size, situation) pair is still covered (the locked TASK-7.11 test).
- Verification: acceptance `tests/golden/suite.acceptance.test.ts::AC#9 the two call islands are replaced by spots whose chart neighbours share their action`

### SPEC-10: Originality and distinct justifications
- Verifies: DoD#1, DoD#10
- Behaviour: Ids are unique across both spot files and the graded file, and no two justifications in the three files
  are identical. Manual review confirms all postflop spots, graded examples and the revised preflop texts were written
  for this project and are sound poker for the recorded answer.
- Verification: acceptance `tests/golden/postflop.acceptance.test.ts::DoD#1 golden ids and justifications are distinct across files`; manual read of `tests/golden/postflop-spots.json` and `tests/golden/graded-examples.json`

### SPEC-11: Postflop validator details
- Verifies: DoD#2
- Behaviour: Unit cases, all with a stub `advise` (clear numbers) unless stated, each asserting the exact §5 text:
  - `board` with 2 or 6 cards, a duplicate card, or a hole card;
  - steps that stop on the flop when the board is a turn board;
  - `street` mismatch;
  - a `situation` field;
  - an action `"shove"`, and `bet` when facing a bet;
  - `opponentStats` `{"4":{"hands":40,"vpip":120,"pfr":10}}` and `{"4":{"hands":40}}` are invalid; a valid entry
    becomes `observed` `[{seat:4,hands:40,vpip:30,pfr:20}]`;
  - a throwing `advise` gives `advice failed (<message>)`;
  - a recorded `fold` with R − E = 9.9 (both fold-versus-call and fold-versus-raise rejected) and with 10.0 accepted;
  - a recorded `raise` facing a bet with V 64.9 rejected (call → aggression-margin);
  - an implied-odds `call` with E < R rejected.

  Several problems are all listed, and `parseGoldenSpots` behaves exactly as before on the preflop file. One case uses
  the real default advice on a heads-up river spot and checks that the memo returns the same object on a second call
  with the same view and `observed`, and a fresh result for a different `observed` array.
- Verification: unit `tests/golden/postflop-golden.test.ts::postflop golden spot validator`

### SPEC-12: Postflop view construction
- Verifies: DoD#2
- Behaviour: A 6-max spot with `holeCards` `"As Qd"`, `board` `"Ah 8c 3d"` and before `["fold","fold","fold","raise","fold","call","check"]` builds a flop view in which the hero is seat 1 (BTN, after the big blind checks) with
  `board = parseCards("Ah 8c 3d")` and legal types `check, bet`. Adding `"bet"` steps and a 4-card board reaches the
  turn, and a 5-card board reaches the river with `view.board` equal to the given cards in order. A heads-up spot's
  hero is found on the second pass.
- Verification: unit `tests/golden/postflop-golden.test.ts::postflop golden spot views`

### SPEC-13: Graded-example parser and check
- Verifies: DoD#2
- Behaviour: Unit cases with stub advice: wrong header; `userAction` not legal; `grade` `"ok"`; `ruleId` `"x"`;
  `marginPts` `"5"` and `5.55` invalid; a preflop example and a postflop example each passing; a mismatch giving
  `Graded example g1: expected minor by call-fold-margin at 4.5, got major by call-fold-margin at 12` and a `null`
  margin rendered as `no margin`.
- Verification: unit `tests/golden/postflop-golden.test.ts::graded examples`

### SPEC-14: Playtest invariants
- Verifies: DoD#7
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then it reports `Invariant violations: 0`.
  Its output may differ from `main` because of the Q-1 chart change. Re-pin rule (Spec Detective, qa.md): if the
  chart change alters any pinned playtest output or any locked test's expected advice, the builder re-pins it under
  its owner task (`doit.py unlock <OWNER> <file> --reason "TASK-7.14 Q-1"`), replacing values one-for-one, keeping the
  check count, and listing each in the build log. Spec-time check (2026-11-24): no such pin was found. Replay codes in
  `tests/playtest/games.acceptance.test.ts` and `tests/playtest/million*.acceptance.test.ts` depend only on seed and
  hand index. No test pins an 88 or 99 preflop decision at full ring (the `8s 8c` cases in `tests/bots/*-postflop.acceptance.test.ts`
  are heads-up postflop). No owner unlock is expected.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42`

### SPEC-15: Repo checks, coverage, boundaries, no network
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: Lint, typecheck and `npm test` pass with zero errors. `npm run test:unit` holds the coverage thresholds
  with `src/advice/golden.ts` ≥ 90% lines from unit tests alone. `golden.ts` imports only `src/engine/*` and
  `src/advice/*`, with no UI, DOM, `node:` or network APIs (the boundary test still passes).
- Verification: command `npm run lint && npm run typecheck && npm test && npm run test:unit`

### SPEC-16: Every-push cost
- Verifies: AC#5
- Behaviour: When `npx vitest run tests/golden/` runs (uncovered, dev machine), Then it passes in under 15 s of
  wall-clock time for the whole directory, and no single test takes over 5 s. Both golden acceptance files appear in
  the `test:sweeps` file set (they match `.acceptance.test.`, `package.json:15`) and in `npm test`. No golden work is
  added to `test:slow`.
- Verification: command `npx vitest run tests/golden/ --reporter=verbose`

### SPEC-17: Documentation
- Verifies: DoD#12, DoD#10
- Behaviour: `docs/advice/golden-spots.md` describes the postflop fields, the advice options used (A-1), the clear-cut
  rule with the four worked examples, the graded-examples file, the new counts, the AC#7–9 changes, and the
  originality statement. The story doc is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/advice/golden-spots.md`; `backlog doc list --plain` shows the story doc

### SPEC-18: N/A items and CI
- Verifies: DoD#8, DoD#11, DoD#13
- Behaviour: DoD#8 and DoD#13 are N/A because no screen changes. CI is green on `doit/TASK-7.14`.
- Verification: manual `gh run list --branch doit/TASK-7.14 --limit 1` shows success

## 7. Edge cases
- Hero facing a raise after having acted (raise not legal): only fold/call are compared (SPEC-11).
- Capped street (raise not legal): the same as above.
- Hero all in, or the hand ends before the decision: `the steps do not reach a <street> decision` (SPEC-11).
- Action-range estimation for a multiway spot falling back (A-7 in postflop.ts sets V = E): the validator uses the
  numbers returned. The memo prevents the cost from doubling.
- `advise` throwing (e.g. an invalid observed entry slipping past validation): reported as `advice failed` (SPEC-11).
- Opponent stats on a non-6-max spot: valid, but ignored by the engine (`ranges.ts:604`). Authors should not use them
  there (A-3).
- Empty postflop `spots`: validates, but SPEC-01 fails on the count.
- Concurrency, permissions, interruption: N/A (pure, synchronous, in-memory).

## 8. Security considerations
- The spot and example files are repo-authored test data, still parsed from `unknown` field by field, with echoed
  text truncated (TASK-7.11 `echo`).
- No new dependencies, no network, no secrets. Randomness is the existing seeded equity sampler (deterministic by
  input); no fairness or security property depends on it here.

## 9. Non-functional
- Every-push cost (SPEC-16): about 120 spots × one memoised postflop advice call (~25 ms each uncovered, ~200 ms for a
  6+ opponent spot, at most 5 of those) ≈ 4 s, plus ~9 graded examples. The whole `tests/golden/` directory stays under
  15 s uncovered. Under local `npm test` coverage (~5× slower) the per-spot work (~0.15 s each) stays far below the
  30 s `testTimeout`. The heavy parse runs at module load, which has no per-test timeout. The CI coverage job runs only
  the stubbed unit tests (well under 2 s).
- Coverage: `src/advice/golden.ts` ≥ 90% lines from `tests/golden/*.test.ts` unit files alone.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/golden/` (the whole golden suite on its own; it also runs within `npm test`)
- New tests:
  - `tests/golden/postflop.acceptance.test.ts` → SPEC-01..SPEC-05, SPEC-10 (locked after the first green build)
  - `tests/golden/suite.acceptance.test.ts` → SPEC-06..SPEC-09 (locked after the first green build)
  - `tests/golden/postflop-golden.test.ts` → SPEC-11..SPEC-13
- Locked tests re-pinned: none expected (SPEC-14 check); the re-pin rule in SPEC-14 applies if one surfaces. `tests/golden/preflop.acceptance.test.ts` is unchanged and must keep passing after
  the preflop data edits.
- Judge end-to-end:
  1. Run `npx vitest run tests/golden/` and confirm one passing test per postflop spot plus the preflop file.
  2. In a scratch edit, change one postflop spot's `action` (e.g. a `bet` to `check`). Confirm it fails with
     `Golden spot <id>: expected check, got bet`. Revert.
  3. Hand-check two spots of different kinds (one call/fold, one bet/check): rebuild the hand, read the advice
     numbers, and confirm the margins are ≥ 10 / ≥ 15 and the justification is sound poker.
  4. Change one graded example's `marginPts` and confirm the suite fails with the exact message. Revert.

## 11. Open questions
- None. Q-1 (AC#7: re-raise 99/88 on the full-ring button against a single raise) was accepted as recommended; see
  `doit/TASK-7.14/qa.md`. A-1..A-8 accepted.

## 12. Clarifications log
See `doit/TASK-7.14/qa.md`.
