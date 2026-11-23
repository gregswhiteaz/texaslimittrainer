# Spec: TASK-7.11 — Check advice against preflop golden spots on every test run

Status: READY (approved 2026-11-23)
Task: TASK-7.11 · Parent/epic: TASK-7 · Requirements: REQ-037, REQ-039, REQ-061, REQ-063 · Dream: limit-holdem-trainer

## 1. Summary
Adds part 1 of the golden-spot suite: a persisted spot format, a validator that turns each spot into a real
`PlayerView` and rejects incomplete or non-clear-cut spots, a runner wired into `npm test` (and so into every CI push),
and at least 100 preflop spots spread over heads-up, 6-max and full ring and every applicable chart situation. Every
spot carries an original written justification. If the advice engine's preflop action ever differs from a spot's
recorded action (or its acceptable alternative), the test run fails and names the spot, the expected action and the
actual action. The postflop half (TASK-7.14) extends the same format later.

## 2. Scope
- In scope:
  - `src/advice/golden.ts`: format constants, `parseGoldenSpots` validator, `checkGoldenSpot` runner check, and the
    sentence and concept helpers it needs.
  - `tests/golden/preflop-spots.json`: at least 100 authored preflop spots (target 110, distribution in A-3).
  - Locked acceptance tests and unit tests for the validator and runner; `docs/advice/golden-spots.md`.
- Not doing:
  - Postflop spots, a board field, postflop clear-cut rules (10/15-point margins) or graded examples: that is TASK-7.14.
  - Opponent-stat-driven advice (TASK-7.12/7.13). Spots may record stats (format allows it) but no preflop spot uses them.
  - Changes to charts, `recommendPreflop`, explanations or any engine/bot code; no UI; no new npm script and no
    new dependency.
  - A spot generator script: spots are literal authored data (D-3).
  - Re-pinning any locked test: none needs to change.
- Scope budget: files=5, lines=1900   (the JSON data file is ~1,250 of these lines after Prettier)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Every v1 spot is played at fixed stakes 2/4 (small bet 4, big bet 8), seats numbered 1..n, button seat 1, every stack 160 (20 big bets). These are format constants, not per-spot fields. | yes | Same table as `tests/advice/table-sizes.acceptance.test.ts:29,58-70`; preflop chart advice does not read stakes or stacks, and fixed values keep each spot short. | Per-spot `stakes`/`stacks` fields (add in v2 if a spot ever needs a short stack). |
| A-2 | Justifications follow the same rules as advice explanations: at least 15 words (the chart's `SPOT_WORDS`, `src/advice/preflop-chart.ts:89`), at most three sentences, and naming at least one listed concept. | yes | Keeps teaching text consistent with REQ-037; costs nothing extra because the validator already has the helpers. | Words-only minimum. |
| A-3 | Distribution of 110 spots: heads-up 20 (4 per situation), 6-max 42 (7 per situation), full ring 48 (8 per situation), spread over the chart positions, with each of fold, check, call and raise recommended at least once. Tests enforce only the AC#4 floor: at least 100 in total and at least one spot per applicable (size, situation) pair. | yes | Covers every chart situation at each size with room above the 100 floor. | Exactly 100; an even per-position split. |
| A-4 | Clear-cut selection beyond the mechanical rule: authors pick hands far from the chart's action boundary, such as premium pairs and big aces that raise, offsuit trash that folds, free checks in a limped big blind, and calls with hands whose neighbouring cells in the chart also call. The validator enforces only "not a borderline cell" (AC#5). | yes | REQ-039.3 asks for no close judgement; the borderline flag is the only machine-checkable signal. | Also rejecting cells adjacent to a borderline cell (more code, and it would exclude valid spots). |
| A-5 | `opponentStats` is optional: an object keyed by seat number (string) whose values are objects of stat name to finite number. Its shape is validated but its contents are unused, and no preflop spot sets it. | yes | The story says "any observed opponent stats"; the stat set arrives with TASK-7.12. | Leave it out of v1 and let TASK-7.14 add it. |
| A-6 | The runner calls `recommend(view)` with no options. Preflop advice reads only the chart (`src/advice/preflop.ts:122-166`). | yes | This is the user-facing preflop path. | Passing `ACTION_RANGE_ADVICE` (it has no effect preflop). |

## 3. Current system
- TypeScript (strict), Vitest 5 + fast-check, ESLint + Prettier, `tsc`; `package.json:9-27`. `npm test` = `vitest run
  --coverage` over `src/**/*.test.*` and `tests/**/*.test.*` (`vite.config.ts:7`). Coverage needs 90% lines in
  `src/{engine,bots,advice,stats,playtest,table}/**` and 70% overall (`vite.config.ts:15-18`).
- CI runs on every push: `npm run test:unit` covers non-acceptance tests and `npm run test:sweeps` (2 shards) covers
  `.acceptance.`/`.property.`/`.perf.` files (`.github/workflows/ci.yml:128,150`; `package.json:15-16`). Any
  `*.acceptance.test.ts` under `tests/` therefore runs on every push, and also in `npm test`.
- `tests/golden/` is already expected by the toolchain: `tests/toolchain/test-command.test.ts:25-45` proves that
  `npm test` runs files under `tests/golden/`.
- Preflop advice: `recommendPreflop`/`recommend` (`src/advice/preflop.ts:122-166`, `src/advice/recommend.ts:33-41`)
  returns `action: 'fold'|'check'|'call'|'raise'`, `explanation`, `referenceSize`, `position`, `situation`,
  `handClass`, `cell` (with `borderline`). `chartSpotOf`, `positionOf`, `situationOf`, `referenceSizeOf` and
  `PREFLOP_CHARTS` are exported from `src/advice/preflop.ts:23-120`. `chartCell` (`src/advice/preflop-chart.ts:236-251`)
  looks up a cell.
- `PlayerView` is documented as plain data "safe to store in hand records and golden-spot files"
  (`src/engine/player-view.ts:35`). Views are built with `createHand` + `applyAction` + `playerView`
  (`src/engine/hand.ts:221,601`, `src/engine/player-view.ts:63`), as in
  `tests/advice/table-sizes.acceptance.test.ts:58-80` (deck layout: seat after the button is dealt first, the button
  last, two passes).
- Chart validator style to mirror: a `ChartValidationError` that collects every problem, the `wordCount` and `echo`
  helpers, and the `format`/`version` header (`src/advice/preflop-chart.ts:76-112,192-231`).
- Explanation concept list: `CONCEPTS` with whole-word `terms` (`src/advice/explanations.ts:30-91`). The sentence and
  concept oracles in `tests/advice/explanations.acceptance.test.ts:34-36` (split on `/(?<=[.!?])\s+/`; whole-word,
  case-insensitive term match) are local to that locked file.
- Existing code to reuse:
  - `src/engine/cards.ts` → `parseCards` (`"As Ah"` → cards), `formatCard`.
  - `src/engine/hand.ts` → `createHand`, `applyAction`, `legalActions` (via `view.legalActions`).
  - `src/engine/player-view.ts` → `playerView`.
  - `src/advice/preflop.ts` → `PREFLOP_CHARTS`, `referenceSizeOf`, `positionOf`, `situationOf`, `chartSpotOf`.
  - `src/advice/preflop-chart.ts` → `chartCell`, `APPLICABLE_SPOTS`, types `Position`, `Situation`, `ReferenceSize`.
  - `src/advice/hand-class.ts` → `handClassOf`.
  - `src/advice/explanations.ts` → `CONCEPTS` (concept terms).
  - `src/advice/recommend.ts` → `recommend`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Persisted format `tlh-golden-spots` version 1. Each spot records the view's independent facts: seat count, hole cards and the preflop actions taken before the decision, plus the position and situation as readable cross-checks. The validator rebuilds the full `PlayerView` (pots, bets, legal actions) with the engine. See §5. Approved by Q-1. | (b) Full `PlayerView` JSON per spot: about 150 lines per full-ring spot after Prettier (about 16k lines in total), hard to review by eye, and every hand-edit could produce an inconsistent view. | Compact spots read like the hand ("6-max, UTG raises, you hold AKs on the button"), are reviewable, and can't describe an impossible view because the engine builds them. The validated spot still carries a real `PlayerView`, which satisfies REQ-039.2/AC#1. | yes | user (Q-1) |
| D-2 | The validator lives in `src/advice/golden.ts` (pure, engine and advice imports only). Data and tests live in `tests/golden/`. The runner is a locked Vitest acceptance file, `tests/golden/preflop.acceptance.test.ts`, so it runs in `npm test` and in the CI `test:sweeps` job on every push. No new npm script. | A dedicated `npm run golden` script; data under `src/advice/golden/`. | REQ-063.1 says `npm test` runs golden-spot tests, and `tests/golden/` is already anticipated (`tests/toolchain/test-command.test.ts:27`). Keeping the module in `src/` puts it under the 90% advice coverage gate and lets TASK-7.14 extend it. It is not imported by the app, so it is not bundled. | no | n/a |
| D-3 | Spots are literal authored JSON with no generator. The builder writes each spot's justification individually for this project (1 to 3 sentences, at least 15 words, naming a concept). Shared phrasing is allowed, but no two justifications are identical, and each one states why this hand in this spot takes this action. Approved by Q-2. | (b) A generator script that picks non-borderline chart cells and fills justification templates per (situation, hand category). | Golden data must be frozen: a generator that reads the chart would re-derive answers from the code under test and silently follow any chart change. Literal text also reads as a real justification (REQ-061.2). Cost is about 110 short paragraphs. | yes | user (Q-2) |
| D-4 | A mismatch passes if the engine's action equals the recorded action or the recorded alternative. The engine's own `alternative` is ignored. | Also requiring the engine's alternative to match. | AC#3 wording; the alternative is a grading allowance, not the advice. | no | n/a |
| D-5 | The validator fails a spot whose chart cell (read via `chartSpotOf` + `handClassOf` + `chartCell`) has `borderline: true`. It does not compare the recorded action with the chart: that comparison is the runner's job (AC#3). | Also validating action against chart. | Keeps "is this spot well-formed and clear-cut" separate from "does the engine agree". | no | n/a |
| D-6 | Every-push cost: one acceptance file. Each spot builds 2 hands and makes 1 `recommend` call, so the whole suite should take well under 1 s. No slow or opt-in split is needed. | Putting it in `test:slow`. | REQ-039.4 needs it in the standard run, and it is cheap. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/golden.ts` — new: format, `parseGoldenSpots`, `GoldenSpotValidationError`, `checkGoldenSpot`,
  `sentencesOf`, `namedConcepts`
- `tests/golden/preflop-spots.json` — new: at least 100 authored preflop spots (original text, REQ-061.2)
- `tests/golden/preflop.acceptance.test.ts` — new, locked after first green build (SPEC-01..SPEC-08)
- `tests/golden/golden-spots.test.ts` — new unit tests (SPEC-09, SPEC-10)
- `docs/advice/golden-spots.md` — new: format, clear-cut rule, how to add a spot, originality statement

### Components, interfaces and data
File format (`tests/golden/preflop-spots.json`):
```json
{
  "format": "tlh-golden-spots",
  "version": 1,
  "spots": [
    {
      "id": "6max-btn-raise-aks",
      "seats": 6,
      "position": "BTN",
      "situation": "raise",
      "holeCards": "As Ks",
      "before": ["raise", "fold", "fold"],
      "action": "raise",
      "alternative": null,
      "justification": "A single raiser from an early seat still holds many hands that ace-king suited dominates. Re-raising here builds the pot while your hand strength, how well two cards hold up against the hands others play, is well ahead."
    }
  ]
}
```
Field rules (v1):
- `id`: non-empty string, at most 60 characters, unique in the file. Convention:
  `<hu|6max|fr>-<position lower-case, + dropped>-<situation>-<hand class lower-case>`.
- `seats`: integer 2..10 (dealt-in count). The table follows A-1.
- `holeCards`: two different cards in `parseCards` notation (`"As Ah"`).
- `before`: array of `"fold" | "check" | "call" | "raise"`, applied in order to whichever seat is to act after the
  blinds. Amounts come from that seat's legal action of that type. It may be empty.
- `position`: a `Position`. `situation`: a `Situation`. Both must equal what the built view gives.
- `action`: `"fold" | "check" | "call" | "raise"`, and it must be a legal action type in the view.
- `alternative`: optional. It may be absent or `null` (no alternative), or one such action string, which must be legal
  and different from `action`. An array counts as more than one alternative.
- `justification`: string that meets A-2.
- `opponentStats`: optional; see A-5.

Exports of `src/advice/golden.ts`:
```ts
export const GOLDEN_FORMAT = 'tlh-golden-spots';
export const GOLDEN_STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 } as const;
export const GOLDEN_STACK = 160;
export type GoldenAction = PreflopAdvice; // 'fold' | 'check' | 'call' | 'raise'
export interface GoldenSpot {
  readonly id: string;
  readonly view: PlayerView;            // built by the engine, hero = view.seat = view.toAct, street 'preflop'
  readonly referenceSize: ReferenceSize; // referenceSizeOf(seats)
  readonly position: Position;
  readonly situation: Situation;
  readonly handClass: HandClass;
  readonly opponentStats: Readonly<Record<string, Readonly<Record<string, number>>>>; // {} when absent
  readonly action: GoldenAction;
  readonly alternative: GoldenAction | null;
  readonly justification: string;
}
export class GoldenSpotValidationError extends Error { readonly problems: readonly string[] }
/** Validates every spot; throws GoldenSpotValidationError listing every problem. Returns spots in file order. */
export function parseGoldenSpots(raw: unknown, charts?: Readonly<Record<ReferenceSize, PreflopChart>>): GoldenSpot[];
/** null when the advice agrees; otherwise the failure message (§5 Error handling). */
export function checkGoldenSpot(spot: GoldenSpot, advise?: (view: PlayerView) => { readonly action: string }): string | null;
/** text.trim() split on /(?<=[.!?])\s+/; [] for empty text. */
export function sentencesOf(text: string): string[];
/** Ids of CONCEPTS with any term matched whole-word, case-insensitive, in CONCEPTS order. */
export function namedConcepts(text: string): ConceptId[];
```
`charts` defaults to `PREFLOP_CHARTS`; `advise` defaults to `(view) => recommend(view)`.

### Rules and algorithms
Building a view (per spot):
1. Build a hand with `createHand({ stakes: GOLDEN_STAKES, seats: 1..n each GOLDEN_STACK, button: 1, deck })`. The deck
   is the 50 cards other than the hole cards in ascending order, with the hole cards spliced in at the hero's two deal
   indexes (as in `tests/advice/table-sizes.acceptance.test.ts:61-66`). Apply `before`: for each step, take the
   to-act seat's legal action of that type and `applyAction` it. If the action is missing or the apply fails, record
   the problem.
2. The hero seat is not known until the steps are applied. First pass: deal any deck (hero cards dealt to seat 1), apply
   the steps, and read `toAct`. Second pass: rebuild with the hole cards at that seat's deal indexes and replay. The
   steps do not depend on cards.
3. After the steps, the hand must still be on `preflop` with a seat to act. The view is `playerView(state, toAct)`.

Checks per spot, in order. All problems are collected, and a spot whose view could not be built skips the checks that
need the view:
format header → id → seats/holeCards/before (view) → position and situation match `positionOf`/`situationOf` →
action → alternative → justification → opponentStats → borderline (`chartCell(charts[size], chartSpotOf(view).position,
chartSpotOf(view).situation, handClassOf(view.holeCards)).borderline`).

Runner check: `actual = advise(spot.view).action`. It passes when `actual === spot.action || actual === spot.alternative`.

Worked example: 6-max (`seats: 6`, button 1, SB 2, BB 3, UTG 4, HJ 5, CO 6), `before: ["raise", "fold", "fold"]`.
UTG raises to 8, HJ folds, CO folds, and the button (seat 1) is to act. `positionOf` = BTN, `situationOf` = `raise`,
the hand class is AKs, and the chart cell is 6-max BTN raise AKs. The validator requires the cell to be not borderline;
the runner requires `recommend(view).action` ∈ {raise}.

### Error handling and configuration
`GoldenSpotValidationError.message` = `'Invalid golden spots:\n- ' + problems.join('\n- ')`. Problems use these exact
forms. `<id>` is the spot id, or `#<n>` (1-based) when the id is missing, and `<x>` is echoed untrusted text (first 20
characters + `...`, as `echo` in `src/advice/preflop-chart.ts:105-107`):
- `Golden spot file: expected format "tlh-golden-spots" version 1` (thrown alone)
- `Golden spot #<n>: missing id` · `Golden spot <id>: duplicate id`
- `Golden spot <id>: missing player view (seats must be 2 to 10)`
- `Golden spot <id>: missing player view (holeCards must be two different cards)`
- `Golden spot <id>: missing player view (step <k> "<x>" is not legal)` (k 1-based)
- `Golden spot <id>: missing player view (the steps do not reach a preflop decision)`
- `Golden spot <id>: position <x> does not match the view (<actual>)`
- `Golden spot <id>: situation <x> does not match the view (<actual>)`
- `Golden spot <id>: missing recommended action`
- `Golden spot <id>: recommended action "<x>" is not legal in the view`
- `Golden spot <id>: more than one acceptable alternative` · `Golden spot <id>: invalid alternative "<x>"` ·
  `Golden spot <id>: alternative repeats the recommended action`
- `Golden spot <id>: missing written justification (at least 15 words)` ·
  `Golden spot <id>: justification has more than three sentences` ·
  `Golden spot <id>: justification names no listed concept`
- `Golden spot <id>: invalid opponent stats`
- `Golden spot <id>: not clear-cut, chart cell <size> <position> <situation> <hc> is borderline`

Runner failure message: `Golden spot <id>: expected <action>, got <actual>`, or with an alternative
`Golden spot <id>: expected <action> or <alternative>, got <actual>`.

## 6. Behaviour specification

### SPEC-01: Shipped file validates and every spot is complete
- Verifies: AC#1
- Behaviour: Given `tests/golden/preflop-spots.json`, When `parseGoldenSpots` runs, Then it returns without throwing,
  and every spot has a `view` with `street === 'preflop'` and `toAct === seat`, an `action` in the four actions, an
  `alternative` that is `null` or one action different from `action`, and a justification of at least 15 words.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#1 every golden spot has a view, an action, at most one alternative and a justification`

### SPEC-02: An incomplete spot fails naming the spot
- Verifies: AC#1
- Behaviour: Given a copy of a valid spot with id `probe`, When the spot is (a) given an unreachable view
  (`before: ["check"]` at `seats: 2`: the button owes chips and cannot check), (b) stripped of
  `action`, (c) given `alternative: ["call","fold"]`, (d) stripped of `justification`, Then `parseGoldenSpots` throws
  `GoldenSpotValidationError` whose problems include, respectively, a line starting `Golden spot probe: missing player
  view`, `Golden spot probe: missing recommended action`, `Golden spot probe: more than one acceptable alternative`,
  `Golden spot probe: missing written justification (at least 15 words)`.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#1 a spot missing a part fails validation naming the spot`

### SPEC-03: npm test runs the golden-spot suite
- Verifies: AC#2
- Behaviour: Given a clean checkout, When `npm test` runs, Then the output lists `tests/golden/preflop.acceptance.test.ts`
  alongside the unit and property test files. The `test` script is `vitest run --coverage` with no exclusion matching
  `tests/golden/`, and the Vitest `include` globs match the golden file path.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#2 npm test includes the golden-spot suite`; command `npm test 2>&1 | grep -E "tests/golden/preflop.acceptance.test.ts"`

### SPEC-04: Every shipped spot agrees with the advice; a disagreement names spot, expected and actual
- Verifies: AC#3, DoD#4
- Behaviour: Given each shipped spot, When `checkGoldenSpot(spot)` runs (one `it` per spot, titled with the spot id),
  Then it returns `null`. Given a shipped spot whose engine action is `raise` and whose recorded action is changed to
  `fold` with alternative `null`, Then it returns exactly `Golden spot <id>: expected fold, got raise`. With
  alternative `call`, it returns `Golden spot <id>: expected fold or call, got raise`. A stub `advise` returning the
  recorded alternative returns `null`.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#3 the advice engine agrees with golden spot <id>` and `::AC#3 a disagreement names the spot, the expected and the actual action`

### SPEC-05: Count and coverage of the preflop spots
- Verifies: AC#4
- Behaviour: Given the parsed spots, When they are counted, Then there are at least 100, and for every entry
  (size, situation) in `APPLICABLE_SPOTS` (heads-up 5 situations, 6-max and full ring 6 each) at least one spot has
  that `referenceSize` and `situation`.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#4 at least 100 spots covering every reference size and chart situation`

### SPEC-06: A borderline chart cell is rejected
- Verifies: AC#5
- Behaviour: Given a spot built on the first borderline cell found in `HEADS_UP_CHART` BTN `unopened` (scan
  `HAND_CLASSES` in order, for example 75o), with `seats: 2`, `before: []`, matching position and situation, and an
  otherwise valid action and justification, When `parseGoldenSpots` runs, Then it throws, and the problems include
  `Golden spot <id>: not clear-cut, chart cell heads-up BTN unopened <hc> is borderline`. The same spot on a
  non-borderline hand class validates.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#5 a spot on a borderline chart cell is rejected as not clear-cut`

### SPEC-07: Every golden spot's explanation is short and names a concept
- Verifies: AC#6
- Behaviour: Given every shipped spot, When `recommend(spot.view).explanation` is checked, Then it splits into 1 to 3
  sentences, each ending in `.`, `!` or `?`, and `namedConcepts` returns at least one concept id. The same holds for
  every spot's `justification`.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::AC#6 every golden spot explanation has at most three sentences and names a listed concept`

### SPEC-08: Justifications are original and spot-specific
- Verifies: DoD#1, DoD#10
- Behaviour: Given the shipped spots, Then the ids are unique, no two justifications are identical, and every
  justification names its hand: it contains the hand class (for example `AKs`) or its `handClassName` wording (for
  example `ace-king suited`). Manual review confirms the text was written for this project, with no passages copied
  from books or tools.
- Verification: acceptance `tests/golden/preflop.acceptance.test.ts::DoD#1 justifications are distinct and name their hand`; manual read of `tests/golden/preflop-spots.json`

### SPEC-09: Validator details
- Verifies: DoD#2
- Behaviour: Unit cases, each asserting the exact §5 problem text:
  - wrong `format`/`version` and a non-object input → the header message only;
  - missing id (→ `#<n>`) and duplicate id;
  - `seats` 1 and 11;
  - `holeCards` `"As As"` and `"Zz"`;
  - an illegal step (`check` facing a raise);
  - steps that end the preflop round (`seats: 3`, `["call","call","check"]`);
  - position mismatch and situation mismatch;
  - an action that is not legal (`check` facing a raise);
  - alternative `"shove"` and alternative equal to the action;
  - a justification of 4 sentences and one naming no concept;
  - `opponentStats` `{"2": {"vpip": "x"}}`, which is invalid, and `{"2": {"vpip": 31}}`, which is valid and carried
    through.

  Several problems in one file are all listed. `sentencesOf('')` = `[]`; `sentencesOf('A b. C d? E!')` has 3
  entries; `namedConcepts('Good position and pot odds.')` = `['pot-odds','position']`; `namedConcepts('Raise.')` = `[]`.
- Verification: unit `tests/golden/golden-spots.test.ts::golden spot validator`

### SPEC-10: View construction matches the engine
- Verifies: DoD#2
- Behaviour: For a 6-max spot with `before: ["raise","fold","fold"]` and `holeCards: "As Ks"`, the view has seat 1,
  `holeCards` equal to `parseCards("As Ks")`, button 1, `currentBet` 8, `betCount` 2, legal action types
  `fold, call, raise`. For a heads-up spot with `before: []`, the hero is seat 1 (BTN). For a full-ring 9-seat spot with
  6 folds, the hero is the button with `positionOf` = BTN.
- Verification: unit `tests/golden/golden-spots.test.ts::golden spot views`

### SPEC-11: Playtest unchanged
- Verifies: DoD#7
- Behaviour: No engine, bot or advice behaviour changes. When `npm run -s playtest -- --hands 10000 --seed 42` runs,
  Then it reports `Invariant violations: 0` and its stdout SHA-256 equals the value on `main` before this branch.
- Verification: command `bash -c 'npm run -s playtest -- --hands 10000 --seed 42 | tee /dev/stderr | shasum -a 256'`

### SPEC-12: Repo checks, coverage, boundaries, no network
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: lint, typecheck and `npm test` pass with zero errors, and coverage thresholds hold (`src/advice/golden.ts`
  ≥ 90% lines). `src/advice/golden.ts` imports only `src/engine/*` and `src/advice/*` modules, with no UI, DOM, `node:`
  or network APIs; the boundary lint (`tests/toolchain/boundary.test.ts`) still passes.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: Documentation
- Verifies: DoD#12, DoD#10
- Behaviour: `docs/advice/golden-spots.md` describes the v1 format and A-1 constants, the field rules, the
  clear-cut rule (no borderline cells, plus the A-4 selection guidance), how to add a spot, how the suite runs in
  `npm test`, the failure message, and that all spots and justifications were written for this project. The story doc
  is published to Backlog.md by the doit docs step.
- Verification: manual read of `docs/advice/golden-spots.md` against this list; `backlog doc list --plain` shows the story doc

### SPEC-14: N/A items and CI
- Verifies: DoD#8, DoD#11, DoD#13
- Behaviour: DoD#8 and DoD#13 are N/A because no screen or dialog changes. CI is green on `doit/TASK-7.11`.
- Verification: manual `gh run list --branch doit/TASK-7.11 --limit 1` shows success

## 7. Edge cases
- Chart raise made legal as call at the cap, or check when nothing is owed: the recorded action is the legal advice
  (`call`/`check`), and the runner compares legal actions (SPEC-04). The authored spots include BB checks in limped pots.
- Limpers spot read from a later position (`chartSpotOf`, `src/advice/preflop.ts:93-105`): the borderline check uses
  the cell actually read (SPEC-06 algorithm). Recorded `position` is `positionOf` (the real seat), not the remapped one.
- Hero acting a second time (re-raise spots where the hero opened): handled by "hero = to-act after steps" (SPEC-10).
- 10-seat full ring: the earliest seat clamps to UTG (`src/advice/preflop.ts:79-80`), which is allowed.
- Empty `spots` array: the file validates, but SPEC-05 fails (count < 100).
- Non-object entries in `spots`: the id is missing, so the problem is reported as `#<n>` (SPEC-09).
- Concurrency, permissions, interruption: N/A (pure, synchronous, in-memory).

## 8. Security considerations
- Trust boundary: the spot file is repo-authored data read only by tests. It is still treated as `unknown` and
  validated field by field, and echoed text is truncated (§5) so a malformed file can't flood output.
- No new dependencies, no network, no secrets, no randomness (decks are deterministic), no injection surface.

## 9. Non-functional
- Every-push cost: `tests/golden/preflop.acceptance.test.ts` under 2 s on a dev machine (Vitest file duration in
  `npm test` output), with 110 spots × (2 hand builds + 1 `recommend`). It joins the existing `test:sweeps` shards and
  needs no slow split.
- Coverage: `src/advice/golden.ts` ≥ 90% lines.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/golden/` (runs the golden-spot suite on its own; it also runs within `npm test`)
- New tests:
  - `tests/golden/preflop.acceptance.test.ts` → SPEC-01..SPEC-08 (locked after first green build)
  - `tests/golden/golden-spots.test.ts` → SPEC-09, SPEC-10
- Locked tests re-pinned: none.
- Judge end-to-end:
  1. Run `npm test` and confirm the golden file is listed with one passing test per spot.
  2. Temporarily change one spot's `action` in `tests/golden/preflop-spots.json` (for example a `raise` to `fold`),
     run `npx vitest run tests/golden/`, and confirm it fails with `Golden spot <id>: expected fold, got raise`.
  3. Mark that spot's chart cell borderline in a scratch copy, and confirm the validator rejects it.
  4. Revert both changes.

## 11. Open questions
- None. Q-1 (compact format) and Q-2 (literal authored spots) were accepted as recommended; see `doit/TASK-7.11/qa.md`.

## 12. Clarifications log
See `doit/TASK-7.11/qa.md`.
