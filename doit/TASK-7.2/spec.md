# Spec: TASK-7.2 — Recommend a preflop action from the 6-max chart

Status: READY (approved 2026-11-18 by user via Q-1..Q-4)
Task: TASK-7.2 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-025.2, REQ-032.2–032.6 (6-max only; REQ-032.1 heads-up and full ring are TASK-7.6), REQ-061.2 · Dream: limit-holdem-trainer

## 1. Summary
This task adds preflop advice. A new function, `recommendPreflop(view)`, accepts only a `PlayerView`. It works out the
acting seat's 6-max position (UTG, HJ, CO, BTN, SB, BB), the preflop situation and the hand class (one of 169). It
then reads that cell from an authored 6-max chart data file and returns the cell's action, borderline flag and
acceptable alternative, adjusted so the action is always legal: a raise on a capped street becomes call, and a call
or fold with nothing to call becomes check. The chart is a JSON data file of 26 (position, situation) spots × 169
cells. It is checked by a validator, and every spot carries a plain-English justification written for this project.
The chart is also the strategy the TAG bot (TASK-6.1) will play, so its content is user-visible strategy.

## 2. Scope
- In scope:
  - `src/advice/hand-class.ts`: the 169 hand classes (`AA`, `AKs`, `AKo`, …), the 13×13 grid order, `handClassOf`.
  - `src/advice/preflop-chart.ts`: chart types, the list of 26 spots that apply at 6-max, and the validator/loader
    `parseChart(raw: unknown)`, which reports every problem, naming the position, situation and hand class.
  - `src/advice/charts/six-max.json`: the authored 6-max chart (26 spots, a chart-level justification and one
    justification per spot), bundled through a static JSON import (no fetch).
  - `src/advice/preflop.ts`: `recommendPreflop`, position and situation classification, and the legality adjustment
    (cap, nothing to call).
  - Acceptance and unit tests under `tests/advice/`, plus content sanity tests for the authored chart.
- Not doing:
  - Heads-up and full-ring charts, table sizes other than 6 dealt-in seats, and the seat-to-position mapping for
    3, 4, 5, 7 and 8 players (TASK-7.6 / E07-S05). At other sizes `recommendPreflop` throws (A-7).
  - The "approximate" label (TASK-7.16), explanations and concept text (TASK-7.10), grading (TASK-7.4), golden spots
    (TASK-7.11), short-stack notes (TASK-7.17), the TAG bot and its mixing rule (TASK-6.1, TASK-6.2), opponent
    default ranges and range notation (TASK-7.5), and any display labels for positions or situations (hint card, E08).
  - Distinguishing the raiser's position inside a spot (for example BB versus a button raise compared with a UTG
    raise). The story fixes 26 spots, and that split would need a REQ-032.2 change (see follow-ups).
  - Any change to `src/engine/` (the engine street cap is TASK-1.12), `src/ui/`, `e2e/` or the toolchain. No new dependency.
  - A chart viewer or editing tool.
- Scope budget: files=9, lines=1900   (hand-class.ts ~60, preflop-chart.ts ~230, preflop.ts ~150, six-max.json ~520, preflop.acceptance.test.ts ~330, preflop-chart.test.ts ~200, preflop.test.ts ~200, hand-class.test.ts ~60, six-max-chart.test.ts ~150)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Three source modules (`hand-class.ts`, `preflop-chart.ts`, `preflop.ts`) and one data folder `src/advice/charts/`. Tests go in `tests/advice/`. | yes | Follows the one-module-per-concern layout of TASK-1.2 to TASK-7.1. `hand-class.ts` is reused later by ranges (TASK-7.5), the Rock bot (TASK-6.5) and leak grouping (TASK-10.6). | One `preflop.ts` module |
| A-2 | Situation rules beyond the story's wording (§5 rule 3): a raise counts as faced "with calls" only when someone called *after* the single raise; limps before the raise do not count. The hero's own earlier limp is ignored, so the hero is classified by the action now facing them. | yes | The story lists UTG under "facing a raise". UTG can only face a raise after limping, so an earlier limp must not change the situation. Callers after the raise are what changes the pot odds. | Count limpers as callers |
| A-3 | "Capped" means `view.betCount >= 4` (REQ-016.3), checked by the advice itself. A raise cell also becomes call when `view.legalActions` holds no raise. | yes | The engine does not enforce the cap yet: `legalActions` offers a raise at any bet count (`src/engine/hand.ts:217-238`; cap is TASK-1.12). The advice must still return call at the fourth bet (AC#7). | Rely on `legalActions` only (fails AC#7 until TASK-1.12) |
| A-4 | When nothing is owed (only the BB facing limpers), both call and fold cells become check. The validator rejects `F` cells in the BB facing-limpers spot, so the chart never says fold where checking is free. | yes | Folding when you can check is never correct. AC#8 covers call → check. | Allow fold cells and turn them into check silently |
| A-5 | The acceptable alternative goes through the same legality adjustment. If it then equals the adjusted action, it becomes `null`. An alternative equal to the cell's own action is a validation error. | yes | A grader (TASK-7.4) and the mixing rule (TASK-6.2) need a legal alternative that differs from the recommendation. | Return the raw alternative only |
| A-6 | The result also carries `move`: the exact `Action` from `view.legalActions` for the recommended action (with its amount). | yes | The TAG bot (TASK-6.1) must return a legal `Action`, and this avoids every caller repeating the lookup. | Leave the lookup to callers |
| A-7 | `recommendPreflop` throws `RangeError` for a view that is not preflop, a seat that is not to act, or a table without exactly 6 dealt-in seats. | yes | Same error convention as the engine and equity code (TASK-7.1 A-6). The mapping for other sizes belongs to TASK-7.6, whose AC#8 defines it. | Return a result with an error field; map sizes now |
| A-8 | The validator collects every problem and throws one `ChartValidationError` (extends `Error`) with a `problems: string[]` list and the exact messages in §5. | yes | Authors fix a whole chart in one pass. AC#1/#2 need the bad spot or cell named. | Stop at the first problem |
| A-9 | "Plain-English justification" is checked mechanically: the chart-level text has at least 50 words and each spot's text at least 15 words. Words are runs of letters. Originality is a manual review (SPEC-15). | yes | It gives an objective validator rule for AC#2, and the quality judgement stays with a person. | Only check non-empty |
| A-10 | The shipped chart is parsed once when `preflop.ts` is imported (`SIX_MAX_CHART`). An invalid shipped chart makes the import throw, and `npm test` fails. | yes | Fails fast. Parsing 4,394 cells takes a few milliseconds. | Parse lazily on the first call |
| A-11 | Hand-class names put the higher rank first and add `s` or `o` for non-pairs (`AKs`, `T9o`, `22`). Grid rows and columns run A, K, Q, J, T, 9 … 2. Suited classes are above the diagonal, offsuit classes below it, pairs on it. | yes | This is the usual way charts are laid out, and it matches REQ-042.6's "A9o". | Other orders |
| A-12 | Combo weights for width checks are pairs 6, suited 4, offsuit 12, out of 1,326 in total. | yes | Exact combinatorics. | Count classes, not combos |

## 3. Current system
- `PlayerView` (`src/engine/player-view.ts:36-57`) is plain data. It holds `seat`, `holeCards`, `button`, `street`,
  `players` (every dealt-in seat, ascending, `:46`), `currentBet`, `betCount`, `toAct`, `actions` (blinds first,
  `:52`) and `legalActions` (exact amounts when `seat === toAct`, `:54`). `playerView(state, seat)` builds it
  (`:62`). Approved as the only input to deciding code (doc-13, Q-1).
- Positions: blinds are the first and second dealt-in seats clockwise after the button, and the first to act preflop
  is the next one (`src/engine/hand.ts:164-168,195`). `clockwiseAfter` is private (`hand.ts:110`), so `preflop.ts`
  reimplements the same 3-line rotation from `view.players` and `view.button`. The engine is not changed.
- Betting: `betCount` counts bets and raises on the street, with the big blind counting as 1 preflop
  (`hand.ts:92-93,194,399`). Raise amounts are "raise to" totals (`hand.ts:48`). Preflop action records have types
  `small-blind`, `big-blind`, `fold`, `check`, `call`, `raise` (`hand.ts:55`). The engine does not cap streets yet
  (`hand.ts:217-238`; TASK-1.12 To Do), hence A-3.
- Hands need 3–10 seats and stacks of at least 8 small bets plus 8 big bets (`hand.ts:122,151`). With $2/$4 blinds
  and $4/$8 bets, stacks of 160 are valid. A raise is therefore always affordable today.
- Cards: `Card` 0–51 = `rank * 4 + suit`, rank 12 = A (`src/engine/cards.ts:1-9`). `cardRank`, `cardSuit`,
  `RANK_CHARS = '23456789TJQKA'`, `parseCards` (`cards.ts:8,22-42`).
- JSON import: `tsconfig.json` uses `moduleResolution: "bundler"` (`tsconfig.json:6`), so `import data from
  './charts/six-max.json'` type-checks with no config change (checked with `tsc` on a probe copy of the config).
  Vite bundles it into the app JS, so the chart works offline with no request (REQ-058.1). Vitest loads it natively.
- Headless rules apply to `src/advice/**` (`tools/lint/headless-boundary.js:6`, `eslint.config.js:27`). Coverage
  must be ≥ 90% lines there and ≥ 70% overall (`vite.config.ts:15`). JSON files are not in the coverage set
  (`vite.config.ts:13`).
- Tests: Vitest runs `tests/**/*.test.ts` (`vite.config.ts:7`). `npm test` = `vitest run --coverage`. Lint =
  ESLint `--max-warnings 0` plus `prettier --check .` (`package.json:12-14`; printWidth 100, `.prettierrc.json`).
  A type-error AC is tested by running `npm run typecheck` in a sandbox copy (`tests/support/sandbox.ts:53`
  `runInSandbox`). The same pattern is used in `tests/engine/player-view.acceptance.test.ts:163-210`.
- Requirements: REQ-027.1 sets TAG's band at VPIP 18–26% and PFR 14–22% in 6-max playtests. A TAG bot plays this
  chart (TASK-6.1), so the chart's widths must make that band reachable (TASK-6.16 measures it).
- Existing code to reuse:
  - `src/engine/player-view.ts` → `PlayerView` (the only API input), `playerView` (tests).
  - `src/engine/hand.ts` → `Action`, `createHand`, `applyAction` (tests build real decision points).
  - `src/engine/cards.ts` → `cardRank`, `cardSuit`, `RANK_CHARS`, `parseCards`, `Card`.
  - `tests/support/sandbox.ts` → `REPO_ROOT`, `runInSandbox`, `TOOLCHAIN_TIMEOUT_MS` (AC#3 file read, AC#6).
  - `fast-check` (devDependency) → AC#5 property test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Chart content: the builder (Claude) authors a tight-aggressive (TAG) 6-max limit baseline from the principles and width bands in §5 "Authoring guide". The work is done from first principles, without consulting or copying any published chart. Each spot gets its own justification paragraph, and the chart gets one overall. Content sanity tests (SPEC-12) hold the bands. | (b) The user writes or dictates the ranges; (c) looser "loose-aggressive" baseline; (d) tighter baseline nearer the Rock band | The chart *is* TAG's strategy and the basis of every preflop hint and grade. REQ-027.1 needs TAG at VPIP 18–26%, PFR 14–22%. REQ-061.2 needs original content. | yes | user (Q-1, qa.md: Approved: Claude writes the TAG chart per the §5 guide; user reviews the finished chart afterwards.) |
| D-2 | Chart file format and loading: one JSON file per reference size, `src/advice/charts/six-max.json`. Each spot has 13 grid rows of 13 space-separated cell tokens (`R`, `C`, `F`; `*` = borderline; `/X` = the one acceptable alternative). It is bundled by a static `import`. Format id `tlh-preflop-chart`, version 1. | (b) Range notation per action, expanded and checked so every class has exactly one action. Compact, but needs a range parser now (TASK-7.1 deferred one) and an explicit fold list for AC#2 "no action". (c) An object keyed by hand class (4,394 entries, about 4,500 lines). (d) A TypeScript data module: weaker "data, not code" story (REQ-032.5). (e) Runtime `fetch`: needs async and service-worker caching, and gains nothing in a bundled PWA. | Persisted, authored format that TASK-7.6 (heads-up, full ring) reuses, so it should not change later. The grid reads like a printed chart, and every cell is explicit, so "no action" and "two alternatives" are detectable as AC#2 requires. | yes | user (Q-2, qa.md: Approved: 13×13 text-grid JSON, static import.) |
| D-3 | Public advice API as in §5 "Components": `recommendPreflop(view: PlayerView, options?: { chart?: PreflopChart }): PreflopRecommendation` with the ids `UTG|HJ|CO|BTN|SB|BB` and `unopened|limpers|raise|raise-and-calls|re-raise|blind-defence`. | (b) A single `advise(view)` for preflop and postflop now (postflop does not exist yet: TASK-7.3); (c) return only the raw cell and let callers apply the legality rules; (d) a positional `chart` argument instead of an options object | An options object lets TASK-7.6 add a chart set without breaking callers. The result can gain fields later (`approximate` TASK-7.16, `explanation` TASK-7.10) without breaking anything. | yes | user (Q-3, qa.md: Approved as specified.) |
| D-4 | AC#3 ("edit a cell, no code change") is tested by reading the real file text, changing one token, parsing it and passing it as `options.chart`. A source scan also proves `src/advice/*.ts` holds no hand-class string literals. | Rewrite the file on disk during the test (racy with parallel tests) | Same proof, no file mutation | no | n/a |
| D-5 | Ship the fixed 26 (position, situation) spots of REQ-032.2 as specified. Splitting spots by the raiser's position, and splitting "facing a re-raise" into open-was-re-raised and cold re-raise, becomes a follow-up spike. | (b) Change REQ-032.2 now; (c) accept the 26 spots permanently | Keeps this story in its scope. The split needs a requirements change and a new chart format version | yes | user (Q-4, qa.md) |

## 5. Design

### Files to create / modify
- `src/advice/hand-class.ts` — new: `HandClass`, `HAND_CLASSES` (169, grid order), `handClassOf`, `handClassAt`, `comboCount`
- `src/advice/preflop-chart.ts` — new: chart types, `APPLICABLE_SPOTS`, `parseChart`, `chartCell`, `ChartValidationError`
- `src/advice/charts/six-max.json` — new: the authored 6-max chart (D-1, D-2)
- `src/advice/preflop.ts` — new: `SIX_MAX_CHART`, `positionOf`, `situationOf`, `recommendPreflop`
- `tests/advice/preflop.acceptance.test.ts` — new: AC#1–AC#8 (locked; chart-content independent)
- `tests/advice/preflop-chart.test.ts` — new: validator unit tests (every message, grid parsing)
- `tests/advice/preflop.test.ts` — new: position, situation, legality adjustment, errors, speed
- `tests/advice/hand-class.test.ts` — new: 169 classes, grid order, `handClassOf`
- `tests/advice/six-max-chart.test.ts` — new: content sanity tests on the authored chart (SPEC-12; not locked, so tuning the content stays possible)

### Components, interfaces and data
`src/advice/hand-class.ts`:
```ts
import type { Card } from '../engine/cards';
/** 'AA', 'AKs', 'AKo', ... higher rank first. */
export type HandClass = string;
/** Grid order: row r, column c (0 = A ... 12 = 2), row-major. 169 entries. */
export const HAND_CLASSES: readonly HandClass[];
/** r === c pair; r < c suited (rank r high); r > c offsuit (rank c high). */
export function handClassAt(row: number, col: number): HandClass;
/** Throws RangeError('Hole cards must be two different cards') when equal. */
export function handClassOf(cards: readonly [Card, Card]): HandClass;
/** 6, 4 or 12. */
export function comboCount(hc: HandClass): number;
```

`src/advice/preflop-chart.ts`:
```ts
export type ReferenceSize = '6-max';            // TASK-7.6 adds 'heads-up' | 'full-ring'
export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';   // TASK-7.6 may add full-ring names
export type Situation = 'unopened' | 'limpers' | 'raise' | 'raise-and-calls' | 're-raise' | 'blind-defence';
export type ChartAction = 'fold' | 'call' | 'raise';
export interface ChartCell {
  readonly action: ChartAction;
  readonly borderline: boolean;
  readonly alternative: ChartAction | null;
}
export interface ChartSpot {
  readonly position: Position;
  readonly situation: Situation;
  readonly justification: string;
  /** Exactly the 169 HAND_CLASSES as keys. */
  readonly cells: Readonly<Record<HandClass, ChartCell>>;
}
export interface PreflopChart {
  readonly referenceSize: ReferenceSize;
  readonly justification: string;
  /** In APPLICABLE_SPOTS order. */
  readonly spots: readonly ChartSpot[];
}
/** The 26 6-max spots, in this order (story context): */
export const APPLICABLE_SPOTS: Readonly<Record<ReferenceSize, readonly { position: Position; situation: Situation }[]>>;
//   unopened: UTG HJ CO BTN SB · limpers: HJ CO BTN SB BB · raise: UTG HJ CO BTN ·
//   raise-and-calls: UTG HJ CO BTN · re-raise: UTG HJ CO BTN SB BB · blind-defence: SB BB
export class ChartValidationError extends Error {
  readonly problems: readonly string[];   // message = 'Invalid preflop chart:\n- ' + problems.join('\n- ')
}
/** Validates and compiles authored JSON. Throws ChartValidationError listing every problem. */
export function parseChart(raw: unknown): PreflopChart;
/** Throws RangeError('Chart <size> has no spot <position> <situation>') if absent. */
export function chartCell(chart: PreflopChart, position: Position, situation: Situation, hc: HandClass): ChartCell;
```

`src/advice/preflop.ts`:
```ts
import sixMax from './charts/six-max.json';
export const SIX_MAX_CHART: PreflopChart;          // parseChart(sixMax), at import (A-10)
export type PreflopAdvice = 'fold' | 'check' | 'call' | 'raise';
export interface PreflopRecommendation {
  readonly basis: 'chart';
  readonly referenceSize: ReferenceSize;
  readonly position: Position;
  readonly situation: Situation;
  readonly handClass: HandClass;
  /** The cell exactly as authored. */
  readonly cell: ChartCell;
  /** Legal for the view (rule 4). */
  readonly action: PreflopAdvice;
  /** = cell.borderline. */
  readonly borderline: boolean;
  /** cell.alternative after rule 4; null if none or if it equals `action` (A-5). */
  readonly alternative: PreflopAdvice | null;
  /** The element of view.legalActions whose type is `action` (A-6). */
  readonly move: Action;
}
export interface PreflopOptions { readonly chart?: PreflopChart }   // default SIX_MAX_CHART
export function positionOf(view: PlayerView): Position;              // rule 2
export function situationOf(view: PlayerView): Situation;            // rule 3
export function recommendPreflop(view: PlayerView, options?: PreflopOptions): PreflopRecommendation;
```
Invariants: `recommendPreflop` is pure and synchronous. It reads only its arguments (no clock, no randomness, no
I/O) and never mutates `view`. `move` is always an element of `view.legalActions` (deep-equal).

Chart file (`src/advice/charts/six-max.json`):
```json
{
  "format": "tlh-preflop-chart",
  "version": 1,
  "referenceSize": "6-max",
  "justification": "Plain-English overview: the style, why position widens ranges, why we raise rather than limp ...",
  "spots": [
    {
      "position": "UTG",
      "situation": "unopened",
      "justification": "Five players act after us, so we open only hands that ...",
      "grid": [
        "R R R R R* F F F F F F F F",
        "... 12 more rows: row A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2 ..."
      ]
    }
  ]
}
```
Cell token grammar: `<action>[*][/<alternative>]`, where action and alternative are each one of `F` (fold), `C` (call),
`R` (raise), and `*` marks the cell borderline. Examples: `R`, `F*`, `R*/C`, `C/F`. The token `-` means "no action".
It is only for unfinished authoring, and the validator always rejects it.

### Rules and algorithms
1. Hand class (A-11): ranks r1 ≥ r2 from `cardRank`. If r1 = r2 the class is `RANK_CHARS[r1]` twice (for example
   `QQ`). Otherwise it is `RANK_CHARS[r1] + RANK_CHARS[r2]` plus `s` when the suits match and `o` when they differ.
   The grid index of a rank is `12 − rank` (A = 0 … 2 = 12). A suited class sits at (row = high, col = low), an
   offsuit class at (row = low, col = high). Examples: `As 9h` and `9h As` → `A9o` at (5, 0); `9s As` → `A9s` at
   (0, 5); `Td Tc` → `TT` at (4, 4).
2. Position (6 dealt-in seats only): the dealt-in seats are `view.players.map(p => p.seat)` (ascending). Rotate them
   clockwise starting after `view.button`, as in `hand.ts:110-114`. Seats 1st to 5th after the button are SB, BB,
   UTG, HJ, CO, and the button is BTN. Example: seats 1–6, button 1 → SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Seats
   {2, 4, 5, 7, 9, 10}, button 9 → SB 10, BB 2, UTG 4, HJ 5, CO 7, BTN 9.
3. Situation, from the preflop records of `view.actions` other than `small-blind`/`big-blind` (A-2). Let `R` = the
   number of `raise` records.
   - R = 0: if no seat other than the hero has a `call` record → `unopened`; otherwise → `limpers`.
   - R = 1: if the position is SB or BB → `blind-defence`. Otherwise, if any `call` record comes after the raise →
     `raise-and-calls`, else → `raise`.
   - R ≥ 2 → `re-raise`, for every position. This includes facing a fourth bet (R = 3, AC#7).
   Every reachable 6-max decision maps to one of the 26 spots: UTG cannot face limpers, and BB is never first in.
   Worked examples (button 1, seats 1–6; UTG 4, HJ 5, CO 6, BTN 1, SB 2, BB 3):
   - `[]`, hero 4 → UTG unopened. `4 call, 5 fold`, hero 6 → CO limpers.
   - `4 call, 5 fold, 6 fold, 1 fold, 2 call`, hero 3 → BB limpers.
   - `4 call, 5 raise 8, 6 fold, 1 fold, 2 fold, 3 fold`, hero 4 → UTG raise.
   - `4 call, 5 raise 8, 6 call, 1 call, 2 fold, 3 fold`, hero 4 → UTG raise-and-calls.
   - `4 raise 8, 5 call, 6 fold`, hero 1 → BTN raise-and-calls. `4 raise 8, 5 call, 6 fold, 1 fold, 2 fold`, hero 3 → BB blind-defence.
   - `4 raise 8, 5 fold, 6 raise 12, 1 fold, 2 fold, 3 raise 16`, hero 4 → UTG re-raise, `betCount` 4 (capped).
4. Legality adjustment, applied to the cell action and then to the alternative. `owed = view.currentBet − hero's
   streetContribution`. `capped = view.betCount >= 4` (A-3).
   - `raise` → `call` if `capped` or no `raise` is in `view.legalActions`.
   - Then `call` → `check` if `owed === 0`; `fold` → `check` if `owed === 0` (A-4).
   - Alternative: adjusted the same way; `null` if it then equals the adjusted action (A-5).
   - `move` = the `view.legalActions` element whose `type` equals the adjusted action. If none exists, throw `Error`
     (`No legal <action> for seat <n>`). This cannot happen with today's engine.
   Examples: UTG re-raise cell `R/C` at `betCount` 4 → action `call`, alternative `null`. BB limpers cell `C*/R` →
   action `check`, alternative `raise`. CO unopened cell `R` → action `raise`, `move` `{seat: 6, type: 'raise',
   amount: 8}`.
5. Validator (`parseChart`). It collects every problem below, in file order, using the exact messages in "Error
   handling", and throws once at the end if there are any:
   - top level is an object with `format` `"tlh-preflop-chart"` and `version` 1, otherwise stop with that one problem;
   - `referenceSize` is `"6-max"` (the only size this task knows), otherwise stop;
   - chart `justification` is a string with ≥ 50 words (A-9);
   - `spots` is an array, and each entry has a known `position` and `situation`. Spots not in `APPLICABLE_SPOTS`
     and duplicate spots are reported. Every applicable spot that is absent is reported as missing;
   - each spot `justification` has ≥ 15 words;
   - each `grid` is an array of exactly 13 strings. Each row splits on whitespace into exactly 13 tokens. A row with
     fewer tokens reports each missing trailing cell as "no action"; a row with more is reported once;
   - each token parses by the grammar above. `-`, an empty token or a missing token → no action. The first letter is
     not `F`/`C`/`R` → invalid action. More than one `/` → more than one alternative. Alternative letter not
     `F`/`C`/`R` → invalid alternative. Alternative = action → repeated action (A-5);
   - in the BB `limpers` spot, an `F` action is reported (A-4). An `F` alternative is allowed (it adjusts to check).
   The compiled `PreflopChart` lists spots in `APPLICABLE_SPOTS` order, whatever order the file uses.

### Authoring guide for the 6-max chart (approved Q-1)
These are the builder's rules for writing `six-max.json`. The ranges are original, built from these stated
principles (fixed-limit 6-max, $4/$8, one opponent model: "typical player"). No published chart is consulted or
copied (REQ-061.2).
- Style: tight-aggressive. Raise or fold when first in; no open-limping as the main action except SB completes,
  at most 10% of combos (SB `C` cells allowed). Value hands raise in every spot; AA, KK and QQ are `R` in every spot.
- Position widens ranges in order: every class that is `R` in UTG unopened is `R` in HJ, every HJ `R` is `R` in CO,
  and every CO `R` is `R` in BTN.
- Width bands (combos as % of 1,326; "continue" = R or C cells):

  | Spot | Continue | Notes |
  |---|---|---|
  | unopened UTG / HJ / CO / BTN / SB | 13–18 / 16–22 / 22–30 / 33–45 / 28–42 | `C` only in SB |
  | limpers HJ / CO / BTN / SB | 12–28 each | raise to isolate with strong hands; over-limp (`C`) with small pairs and suited connectors in later seats |
  | limpers BB | raise 8–25 | every other cell `C` (= check) |
  | raise HJ / CO / BTN, UTG (after own limp) | 5–14 | mostly re-raise or fold; `C` ≤ 4 |
  | raise-and-calls UTG / HJ / CO / BTN | 6–18 | more calls with pairs and suited hands (better pot odds) |
  | re-raise (all six) | 6–30 | the chart cannot tell whether the hero opened, so cover both cases: re-raise (cap) with about QQ+ and AK, call with hands that can continue for one more bet |
  | blind-defence SB | 10–25 | mostly re-raise or fold |
  | blind-defence BB | 35–60 | defend wide: 3-to-1 or better pot odds; re-raise 5–15 |
- Borderline (`*`): the classes at the edge of each range, where a sound player could choose either way, usually
  1–3 classes per range boundary. An alternative (`/X`) is given only on borderline cells or where two actions are
  close in value. Every spot keeps at least one non-borderline `R` cell and (except BB limpers) one non-borderline
  `F` cell, so golden spots (TASK-7.11) can be drawn from every spot.
- Justifications: the chart-level text (≥ 50 words) states the style, the position principle, why raising beats
  limping in limit, and the TAG band it aims at (REQ-027.1). Each spot (≥ 15 words) says who is left to act, what
  the pot odds or initiative mean there, and what the range is built from (premium pairs, broadways, suited aces,
  connectors). Plain English, at most about 80 words per spot, written fresh for this project.

### Error handling and configuration
API errors are `RangeError` with exact messages:
- not preflop: `Preflop advice needs a preflop view, got <street>`
- hero not to act: `Seat <seat> is not to act`
- table size: `The 6-max chart needs 6 dealt-in seats, got <n>`
- spot absent from an injected chart: `Chart 6-max has no spot <position> <situation>`
- equal hole cards: `Hole cards must be two different cards`

Validator problems. `<P> <S> <hc>` are position, situation and hand class, for example `CO unopened A9o`:
- `Chart file: expected format "tlh-preflop-chart" version 1`
- `Chart file: unknown reference size "<value>"`
- `6-max chart: missing plain-English justification (at least 50 words)`
- `6-max chart: missing spot <P> <S>`
- `6-max chart: spot <P> <S> does not apply at 6-max` (also used for an unknown position or situation, with the raw values)
- `6-max chart: duplicate spot <P> <S>`
- `6-max chart: spot <P> <S> is missing its plain-English justification (at least 15 words)`
- `6-max chart: spot <P> <S> needs 13 grid rows, got <n>`
- `6-max chart: spot <P> <S> row <rank char> has <n> cells, expected 13`
- `6-max chart: <P> <S> <hc> has no action`
- `6-max chart: <P> <S> <hc> has invalid action "<token>" (use F, C or R)`
- `6-max chart: <P> <S> <hc> has more than one acceptable alternative`
- `6-max chart: <P> <S> <hc> has invalid alternative "<token>"`
- `6-max chart: <P> <S> <hc> repeats its action as the alternative`
- `6-max chart: BB limpers <hc> folds where checking is free`

Configuration: none at runtime. The chart is bundled.

## 6. Behaviour specification

### SPEC-01: All 26 spots cover all 169 classes; a missing spot is named
- Verifies: AC#1
- Behaviour: Given `src/advice/charts/six-max.json`, When `parseChart` runs on it, Then it returns without throwing; `APPLICABLE_SPOTS['6-max']` equals exactly the 26 (position, situation) pairs of the story, in §5 order; the chart has 26 spots in that order; and each spot's `cells` has exactly the 169 `HAND_CLASSES` as keys, each with an action in {fold, call, raise}. When each of the 26 spots is removed in turn from a copy of the file data, Then `parseChart` throws `ChartValidationError` whose `problems` contain `6-max chart: missing spot <P> <S>` for that spot (for example `6-max chart: missing spot SB blind-defence`).
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#1 every 6-max spot assigns all 169 hand classes and a missing spot is named`

### SPEC-02: Bad cells and a missing justification are rejected and named
- Verifies: AC#2
- Behaviour: Given a copy of the shipped file data, When one change is made and `parseChart` runs, Then it throws `ChartValidationError` with the listed problem: CO unopened row A, sixth token (`A9s`) set to `-` → `6-max chart: CO unopened A9s has no action`; set to `X` → `6-max chart: CO unopened A9s has invalid action "X" (use F, C or R)`; set to `R/C/F` → `6-max chart: CO unopened A9s has more than one acceptable alternative`; BTN raise row 12's last token removed → `6-max chart: BTN raise 22 has no action`; the chart `justification` deleted, and separately set to `""` → `6-max chart: missing plain-English justification (at least 50 words)`. In every case the error message contains the problem text.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#2 invalid cells and a missing justification fail naming the spot and hand class`

### SPEC-03: Editing one cell in the data changes the advice with no code change
- Verifies: AC#3
- Behaviour: Given the text of `src/advice/charts/six-max.json` read from disk and a CO unopened decision (button 1, seats 1–6, `4 fold, 5 fold`, hero 6 holding `As 9d` = `A9o`), When the `A9o` token is replaced by `F` if its action is `R` or `C`, else by `R`, and the edited data is passed through `parseChart` and given as `options.chart`, Then `recommendPreflop` returns the edited action (`fold`, or `raise`), while the same view with the default chart returns the original cell's action. Also, When every `.ts` file in `src/advice/` is read as text, Then none contains a quoted hand-class literal such as 'AKs' (a quote, two rank characters, an optional s or o, a quote), so no per-hand decision is coded.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#3 advice follows an edited chart cell without code changes`

### SPEC-04: A preflop view returns the cell, flag, alternative, position and situation
- Verifies: AC#4, AC#8
- Behaviour: Given the 26 scripted 6-max decision points of §5 rule 3 (one per spot, button 1, $2/$4 blinds, $4/$8 bets, stacks 160, none capped), and for each every one of the 169 hand classes dealt to the hero (deck built so the hero gets one representative combo), When `recommendPreflop(playerView(state, hero))` runs, Then `position` and `situation` equal that spot, `handClass` equals the class, `cell` deep-equals `chartCell(SIX_MAX_CHART, position, situation, handClass)`, `borderline` equals `cell.borderline`, `referenceSize` is `6-max`, `basis` is `chart`, `action` equals `cell.action` (except BB limpers, where `call` is `check`), `alternative` is the adjusted `cell.alternative` or `null`, and `move` is an element of `view.legalActions` whose `type` is `action`.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#4 returns the chart cell, borderline flag, alternative, position and situation`

### SPEC-05: Hidden cards do not change the recommendation
- Verifies: AC#5
- Behaviour: Given a fast-check property (`numRuns: 200`) over the 26 scripted spots and a fixed hero hand, When the other 50 cards are permuted at random (other hole cards and the undealt deck change) and `recommendPreflop` runs on the hero's view, Then the result `toStrictEqual`s the result for the unpermuted deck. Control: changing the hero's own cards from `As Ad` to `7c 2d` changes `handClass`.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#5 other players' and undealt cards never change the recommendation`

### SPEC-06: Passing the full game state is a type error
- Verifies: AC#6
- Behaviour: Given a sandbox copy (via `runInSandbox`) holding `src/engine/{cards,hand,hand-evaluator,player-view}.ts`, `src/advice/{hand-class,preflop-chart,preflop}.ts`, `src/advice/charts/six-max.json` and a probe `src/advice/probe.ts` that declares `state: HandState` and calls `recommendPreflop(state)`, When `npm run typecheck` runs, Then it exits non-zero with `error TS2345` on the probe's call line and output mentioning `PlayerView`. With a control probe calling `recommendPreflop(playerView(state, 4))`, Then it exits 0.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#6 passing HandState to the advice API fails typecheck` (timeout `TOOLCHAIN_TIMEOUT_MS`)

### SPEC-07: Facing a fourth bet uses the re-raise cell and a raise becomes call
- Verifies: AC#7
- Behaviour: Given the capped script `4 raise 8, 5 fold, 6 raise 12, 1 fold, 2 fold, 3 raise 16` (hero UTG seat 4, `betCount` 4), When `recommendPreflop` runs with a hand class chosen from the shipped chart whose UTG re-raise cell action is `raise` (the test asserts at least one exists), Then `situation` is `re-raise`, `cell.action` is `raise`, `action` is `call` and `move` is `{seat: 4, type: 'call', amount: 8}`. With a class whose cell is `fold`, Then `action` is `fold`. Control: on the uncapped script `4 raise 8, 5 raise 12, 6 fold, 1 fold, 2 fold, 3 fold` (`betCount` 3), the raise class gives `raise`.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#7 a fourth bet uses the re-raise cell and caps raise to call`

### SPEC-08: BB facing limpers checks instead of calling
- Verifies: AC#8
- Behaviour: Given the script `4 call, 5 fold, 6 fold, 1 fold, 2 call` (hero BB seat 3, nothing owed), When `recommendPreflop` runs with a hand class whose shipped BB limpers cell action is `call` (asserted to exist), Then `situation` is `limpers`, `cell.action` is `call`, `action` is `check` and `move` is `{seat: 3, type: 'check'}`. With a class whose cell is `raise`, Then `action` is `raise` and `move.amount` is 8.
- Verification: acceptance `tests/advice/preflop.acceptance.test.ts::AC#8 the big blind facing limpers checks where the chart says call`

### SPEC-09: Position and situation rules
- Verifies: AC#4
- Behaviour: Given the worked examples in §5 rules 2 and 3 (including seats {2, 4, 5, 7, 9, 10} with button 9 and the UTG limp-then-raised cases), When `positionOf` / `situationOf` run, Then they return the listed values. Given an SB that completes and a BB that raises, Then the SB is `blind-defence`. Given an SB or BB facing two raises, Then `re-raise`. Given limps before a single raise and no call after it, Then `raise` (A-2).
- Verification: unit `tests/advice/preflop.test.ts::classifies position and situation`

### SPEC-10: Legality adjustment and API errors
- Verifies: AC#7, AC#8
- Behaviour: Given hand-built `PlayerView` objects and injected one-spot test charts, Then: cell `R/C` at `betCount` 4 gives `call` / `null`; cell `R` when `legalActions` holds no raise gives `call`; cell `C*/R` for BB limpers gives `check` / `raise`; cell `C/F` for BB limpers gives `check` / `null` (the fold alternative also becomes check); and `move` is always an element of `legalActions`. Errors (exact messages, §5): a flop view; a view whose `toAct` is another seat; 5 and 7 dealt-in seats; an injected chart lacking the spot. 10,000 calls of `recommendPreflop` complete in under 1 s with coverage.
- Verification: unit `tests/advice/preflop.test.ts::adjusts to legal actions and rejects bad views`

### SPEC-11: Validator messages and grid parsing
- Verifies: AC#1, AC#2
- Behaviour: Given minimal valid charts built in the test (all cells `F` except BB limpers `C`, justifications of enough words), When each problem in §5 "Error handling" is introduced, Then `problems` contains exactly that message. Several problems in one file are all reported in file order. Tokens `R`, `F*`, `R*/C`, `C/F` parse to the expected cells. Spots given out of order compile to `APPLICABLE_SPOTS` order. Non-object input, a wrong `format` or `version`, and `referenceSize` `"full-ring"` each give the single top-level problem.
- Verification: unit `tests/advice/preflop-chart.test.ts::validates charts with exact problems`

### SPEC-12: The authored 6-max chart follows the authoring guide
- Verifies: DoD#1, DoD#10
- Behaviour: Given `SIX_MAX_CHART`, Then: AA, KK and QQ are `raise` in all 26 spots; `72o` is `fold` in every spot except BB limpers (where it is `call`); the unopened `R` sets are nested UTG ⊆ HJ ⊆ CO ⊆ BTN; `C` cells appear in no unopened spot except SB, and SB completes ≤ 10% of combos; each spot's continue width (combo-weighted, A-12) is inside its §5 band; every spot has at least one non-borderline `R` cell and (except BB limpers) at least one non-borderline `F` cell; and the chart justification and each spot justification meet the word minimums. The test prints each spot's raise % and continue % for review.
- Verification: unit `tests/advice/six-max-chart.test.ts::authored chart follows the TAG authoring guide`

### SPEC-13: Hand classes
- Verifies: AC#4
- Behaviour: Given `HAND_CLASSES`, Then it has 169 distinct entries, 13 pairs, 78 suited and 78 offsuit, with `HAND_CLASSES[0]` = `AA`, `[1]` = `AKs`, `[13]` = `AKo`, `[168]` = `22`. `comboCount` sums to 1,326 over all classes. `handClassOf` gives `A9o` for `As 9h` and for `9h As`, `A9s` for `9s As`, `TT` for `Td Tc`, and throws for two equal cards. `handClassAt(0, 5)` = `A9s`, `handClassAt(5, 0)` = `A9o`.
- Verification: unit `tests/advice/hand-class.test.ts::names and orders the 169 hand classes`

### SPEC-14: All checks pass, coverage holds, advice stays headless and offline
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` runs, Then each exits 0, no `ERROR: Coverage` line appears, and `src/advice/hand-class.ts`, `preflop-chart.ts` and `preflop.ts` each show ≥ 90% lines. Every AC has a passing test in `tests/advice/preflop.acceptance.test.ts`. The search below prints nothing: `src/advice` imports only relative modules and has no network or dynamic-import code.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -rnE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]" src/advice`

### SPEC-15: Chart content is original and justified
- Verifies: DoD#1, DoD#10
- Behaviour: Given `src/advice/charts/six-max.json`, When a reviewer reads it, Then the chart justification and all 26 spot justifications are plain English written for this project, explain the ranges by the §5 principles and quote no book or commercial tool. The build log records that the ranges were authored from the §5 guide without consulting a published chart.
- Verification: manual review of `src/advice/charts/six-max.json` justifications and `doit/TASK-7.2/build-log.md`

### SPEC-16: CI is green on the story branch
- Verifies: DoD#11
- Behaviour: Given the user has pushed branch `doit/TASK-7.2`, When the latest CI run for it completes, Then its conclusion is `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-7.2 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-17: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#4, DoD#7, DoD#8, DoD#12, DoD#13
- Behaviour: Given this task, Then: DoD#4 does not apply (the golden-spot suite arrives in E07-S14, TASK-7.11); DoD#7 does not apply (no playtest runner yet, E01-S07 / TASK-1.6 is To Do); DoD#8 and DoD#13 do not apply (no screen or dialog: `git diff --stat main` shows no file under `src/ui/`, `e2e/` or `index.html`). DoD#12: the TASK-7.2 story document is published with `backlog doc` and shows in `backlog doc list --plain`.
- Verification: manual check of `git diff --stat main` and `backlog doc list --plain | grep "TASK-7.2"`

## 7. Edge cases
- Every spot reachable at 6-max, including the rare ones (UTG facing a raise after limping, HJ facing a raise and
  calls after limping, SB completing and BB raising): SPEC-04, SPEC-09.
- Fourth bet / capped street: SPEC-07, SPEC-10. Raise not in `legalActions`: SPEC-10.
- Nothing to call (BB facing limpers), including fold cells and alternatives: SPEC-08, SPEC-10, validator SPEC-11.
- Alternative collapsing into the action after adjustment: SPEC-10.
- Table sizes other than 6, postflop views, a seat that is not to act: SPEC-10 (errors).
- Chart data: missing, extra, duplicate or out-of-order spots, short or long rows, wrong row count, bad tokens,
  missing or empty justifications, wrong format, version or size: SPEC-01, SPEC-02, SPEC-11.
- Card order and suits within hole cards: SPEC-13.
- Short stacks or all-in preflop: N/A. Stacks are at least 8 small bets plus 8 big bets (`hand.ts:151`) and all-ins
  arrive with TASK-1.9. The `move` lookup throws rather than invent an action (§5 rule 4).
- Concurrency, interruption, permissions, dependency failure: N/A. Pure synchronous function, bundled data, no I/O.

## 8. Security considerations
- Trust boundaries: the chart is bundled app data, not user input. It is still fully validated at import (A-10).
  `parseChart` accepts `unknown` and never evaluates content. The `PlayerView` comes from the engine.
- Hidden information (REQ-025.2): the API's only game input is `PlayerView` (SPEC-06), and the results are independent
  of hidden cards (SPEC-05).
- Authn/authz, secrets, sensitive data, logging, injection: N/A (no I/O, storage or logging).
- New dependencies: none. Network: none (SPEC-14; static import, no fetch; REQ-058.1).
- Randomness: none. The advice is deterministic (REQ-036). Mixing randomness belongs to TASK-6.2/6.18.

## 9. Non-functional
- Latency: `recommendPreflop` ≤ 0.1 ms on average (10,000 calls < 1 s under coverage on CI, SPEC-10). That leaves
  nearly all of the 100 ms bot budget (REQ-055.3) and the 1 s hint budget (REQ-055.1).
- Import cost: `parseChart` of the shipped chart ≤ 20 ms. Bundle growth ≤ 30 KB (minified JS) from the inlined chart.
- Determinism: identical views give identical results (SPEC-05; REQ-036.1).
- Coverage: ≥ 90% lines for the three new modules (SPEC-14).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — library only, with no user-facing entry point until the TAG bot (TASK-6.1) and hint card (TASK-8.1); the Judge exercises it with `npx vitest run tests/advice/preflop.acceptance.test.ts tests/advice/six-max-chart.test.ts`
- New tests (path → SPEC ids):
  - `tests/advice/preflop.acceptance.test.ts` → SPEC-01 to SPEC-08 (locked; the helpers that build decks and play scripts live inside this file)
  - `tests/advice/preflop.test.ts` → SPEC-09, SPEC-10
  - `tests/advice/preflop-chart.test.ts` → SPEC-11
  - `tests/advice/six-max-chart.test.ts` → SPEC-12
  - `tests/advice/hand-class.test.ts` → SPEC-13
- End-to-end scenario for the Judge (as a developer consuming the advice library):
  1. `npm run lint && npm run typecheck && npm test` exits 0. Read the SPEC-12 output of raise % and continue % per spot.
  2. In a scratch test, deal hero `As 9d` in the CO with UTG and HJ folded, call `recommendPreflop` and read the
     result. Then flip the `A9o` token in a copy of the JSON and confirm the advice follows (SPEC-03).
  3. Mutation probes (revert after each): drop the `betCount >= 4` check (SPEC-07 must fail); drop call → check
     (SPEC-08 must fail); treat limps before a raise as callers (SPEC-09 must fail); change a spot's `situation` in
     the JSON to `limpers` for UTG (SPEC-01 must fail).
  4. Read the chart and spot justifications (SPEC-15) and run the SPEC-16/17 checks.

## 11. Open questions
None. Q-1 to Q-4 are answered in `doit/TASK-7.2/qa.md` and folded into D-1, D-2, D-3 and D-5.

### Follow-ups (become tasks)
- Spike: decide whether to split chart spots by the raiser's position and split "facing a re-raise" into open-was-re-raised and cold re-raise (REQ-032.2 change; Q-4).
- Retune the 6-max chart if TAG's measured VPIP/PFR fall outside REQ-027.1 in TASK-6.16.
- Add display labels for positions and situations (e.g. "the cutoff", "facing a raise") for the REQ-042.6 hint text.
- Add a script that prints each chart spot as a 13×13 grid with raise and continue percentages for user review.
- Once TASK-1.12 caps streets in the engine, confirm `legalActions` and the advice's `betCount >= 4` rule agree.
- Handle preflop advice when the hero cannot afford a full call or raise, once short all-ins exist (TASK-1.9, TASK-7.17).

## 12. Clarifications log
See `doit/TASK-7.2/qa.md`.
