# Spec: TASK-7.13 — Adjust opponent ranges to their observed play after 30 hands

Status: READY (approved 2026-11-23)
Task: TASK-7.13 · Parent/epic: TASK-7 · Requirements: REQ-035 (035.2, 035.3, 035.4, 035.6), REQ-029.2, REQ-036, REQ-037 · Dream: limit-holdem-trainer

## 1. Summary
The advice engine gets an optional per-decision snapshot of each opponent's observed session stats (hands seen,
VPIP %, PFR %). From 30 observed hands, that opponent's preflop starting range is rebuilt at the width
`d + (o − d) × min(n, 100) ÷ 100`. The range is the strongest width % of starting hands in a new, documented hand
order, never smaller than AA. Postflop recommendations return a basis for each opponent ('typical player' or 'based
on N hands of this opponent'). When any range rests on observed habits, the explanation names and defines the
"opponent type" concept. Bots never receive the snapshot (REQ-029.2), so bot play and the playtest output are
unchanged. Nothing supplies a snapshot yet. Session wiring and showing the basis on screen belong to TASK-8.1
(hint), TASK-9.3 (review) and TASK-3.12 (decision record).

## 2. Scope
- In scope:
  - `ObservedOpponent` snapshot type and the optional `observedOpponents` advice option (D-2).
  - The scaling formula, the default-width measure and the strongest-width % range builder over a new authored hand
    order `src/advice/ranges/hand-order.json`, with its justification (D-1).
  - `estimateOpponentRanges(view, observed?)` applying the scaling, and a `basis` and `widthPct` on each estimate.
  - `opponentBasis` on `PostflopRecommendation` (one entry per live opponent, ascending seat).
  - An authored explanation lead clause naming "opponent type" with its `{def:opponent-type}` definition (D-3).
  - Docs: `docs/advice/range-model.md` (formula, hand order, basis), `docs/advice/explanations.md`,
    `docs/advice/postflop-rules.md` (remove the "later work (TASK-7.13)" notes).
  - Re-pin one locked assertion (D-4).
- Not doing:
  - No session/table plumbing. `src/table/advice-service.ts`, `src/table/review.ts`, `src/table/session.ts` and the UI
    are unchanged, so no hint or review shows a basis yet. TASK-8.1 AC#2–#4, TASK-9.3 AC#3 and TASK-3.12 AC#2 add
    the snapshot and the display.
  - No change to bots, `adviceOptions` (`src/advice/recommend.ts:24-30`) or the bot equity paths. Bots can't pass the
    snapshot (REQ-029.2, REQ-035.3). TASK-7.25 (bots moving to the range model) is untouched.
  - No change to `PreflopRecommendation` or preflop advice. Preflop advice reads no opponent range. Per the task
    notes its planned basis is 'typical player', which TASK-8.1 AC#3 renders (D-2).
  - No scaling for the BB `check` line, for non-six-max tables (no default ranges yet, TASK-7.6) or for the
    `'unseen'` range mode.
  - No postflop adjustment from aggression/WTSD stats, and no change to the narrowing rule (REQ-035.5).
  - No new dependency, no network and no persisted format change.
- Scope budget: files=13, lines=900

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Strongest width %" = the shortest prefix of the hand order whose combo count reaches `width ÷ 100 × 1326` (tolerance 1e-9), with at least one class (AA). Width ≥ 100 gives all 169 classes. | yes | Deterministic. Never narrower than asked. Gives AA at width 0 (AC#6). | Nearest prefix; exact combo trimming (splits a class) |
| A-2 | `d` (the default width) = combos of the default range's classes ÷ 1326 × 100, counted before dead cards are removed. | yes | The width is a property of the authored range, not of this deal. | After dead-card removal (varies by board) |
| A-3 | The BB `check` line is not scaled: it isn't a voluntary range and REQ-035.6 names only raising and calling ranges. Its basis stays 'typical player' even at ≥ 30 hands. The same applies at non-six-max tables (no default range to scale) and in `'unseen'` mode. | yes | The basis states truthfully which range was used. | Scale check by VPIP |
| A-4 | Snapshot entries for the hero, folded seats or seats not in the hand are ignored. A live opponent with no entry, or with `hands < 30`, is a typical player. | yes | The snapshot is per session, not per hand. | Throw on extra seats |
| A-5 | The basis is decided before the dead-card "fully blocked" fallback (`src/advice/ranges.ts:462`) and the equity fallbacks (`src/advice/postflop.ts:122-126`) run, and those fallbacks don't change it. | yes | These fallbacks are rare and never change what the opponent's range model was. | Report 'typical player' on fallback |
| A-6 | Hand-order ties (same one-decimal equity) are broken by `HAND_CLASSES` grid order (`src/advice/hand-class.ts:19-21`). | yes | Deterministic and documented. | Suited before offsuit |
| A-7 | An invalid snapshot throws `RangeError` (§5). PFR > VPIP is not rejected. The values are used as given. | yes | Engine inputs throw RangeError, as elsewhere in `ranges.ts`. AC#2's own pairs are valid. | Clamp silently |
| A-8 | When scaled, the start range is wholly the strongest-width % prefix (not the authored classes resized), even when `o = d`. | yes | This is the task description's literal rule ("the range is then the strongest width% … by the documented hand order"). | Grow or shrink the authored range |

## 3. Current system
- Advice is pure TypeScript under `src/advice`. Tests use Vitest (`npm test` = `vitest run --coverage`). Lint is
  eslint plus prettier, typecheck is `tsc` (`package.json:14-27`). Files named `*.acceptance.test.ts` are locked
  after the first green build.
- The range model is in `src/advice/ranges.ts`. `estimateOpponentRanges(view)` (`:444-476`) expands
  `defaultRange(SIX_MAX_RANGES, position, line)` minus dead cards (`:460`), falls back to every unseen combo (`:462`)
  and narrows by street. `OpponentRange` is at `:425-435`. Default ranges are authored JSON validated at import
  (`:160-220`, `src/advice/ranges/six-max.json`). Lines are listed at `:17-27`: raising lines are `open-raise`,
  `three-bet` and `four-bet`; calling and limping lines are `limp`, `call-raise` and `call-three-bet` (`:235-238`).
- Postflop advice: `recommendPostflop` (`src/advice/postflop.ts:89-196`) has the options `equity` and
  `opponentRanges` (`:58-63`). In `'actions'` mode it calls `estimateOpponentRanges` (`:120-127`). The result shape is
  `PostflopRecommendation` (`:23-56`), with the explanation from `explainPostflop` (`src/advice/explain.ts:65-87`).
  The field name `basis` is already the Recommendation discriminant ('chart'/'equity', `src/advice/recommend.ts:5-6`),
  so the per-opponent basis needs another name (D-2).
- Exact-keys guard (REQ-035.3): `ExactOptions` (`src/advice/recommend.ts:15-17`). Bots pass options through
  `adviceOptions` (`:24-30`), which copies only `equity`, `chart` and `opponentRanges`. The locked test
  `tests/advice/range-model.acceptance.test.ts:338-339` expects `estimateOpponentRanges(view, 'Maniac')` to be a type
  error. A second parameter typed `readonly ObservedOpponent[]` keeps that true (a string is not assignable).
- Explanations: authored text is in `src/advice/explanations.ts`. The `opponent-type` concept is defined at `:79-84`
  and unused (`docs/advice/explanations.md:27`). `fillTemplate` resolves `{def:<id>}` (`src/advice/explain.ts:20-32`).
  REQ-037 allows at most 3 sentences, and `value-bet`, `check-free`, `value-raise` and `implied-odds-call` already
  use 3 (`src/advice/explanations.ts:95-110`). A separate sentence would break the limit, so the concept goes in a
  lead clause joined to the first sentence (D-3). The sentence splitter splits only on `.!?`
  (`tests/advice/explanations.acceptance.test.ts:35`).
- Stats: `src/stats/style-stats.ts` (TASK-7.12) gives `styleCounts` and `styleStats` (VPIP/PFR percentages,
  `:88-116`). Nothing in `src/` outside `src/stats` calls them yet. No session code builds per-opponent stats, so
  nothing supplies a snapshot today. AC#2 uses PFR 15 % at 30 hands (4.5 hands), which counts can't express, so the
  snapshot carries percentages (D-2).
- Callers that stay unchanged: `src/table/advice-service.ts:64-71` and `src/table/review.ts:61-62` call with
  `ACTION_RANGE_ADVICE` and no snapshot, so every basis is 'typical player'.
- Hand order: none exists. `docs/advice/range-model.md` has no hand order. `HAND_CLASSES` is grid order only
  (`src/advice/hand-class.ts:18-21`). This story creates and documents one (D-1).
- Equity: `computeEquity` (`src/advice/equity.ts:394`) accepts a 0-card board (`:75`) and is seeded from the input
  (REQ-034.3), so a preflop class's equity against one random hand can be reproduced exactly in a test.
- Playtest: `npm run -s playtest -- --hands 10000 --seed 42`. The stdout SHA-256 on `main` is
  `1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5`.
- Existing code to reuse:
  - `src/advice/ranges.ts` → `defaultRange`, `expandRange`, `unseenCombos`, `RangeValidationError`, the
    `wordCount`/`isRecord`/`echo` validation helpers, `PreflopLine`.
  - `src/advice/hand-class.ts` → `HAND_CLASSES`, `comboCount`, `handClassOf`.
  - `src/advice/explain.ts` → `fillTemplate` (lead clause and basis text).
  - `src/advice/postflop.ts` → `toPct` (hand-order equities and the generation procedure).
  - `src/advice/equity.ts` → `computeEquity` (generating and spot-checking the hand order).
  - Test view builders: copy the `stateAfter`/`toActView`/`deckWith` pattern from `tests/advice/postflop-ranges.test.ts:25-54`
    (don't import from locked files).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The documented hand order ranks the 169 classes by all-in preflop equity against one random hand, `toPct(computeEquity({hero: c, board: [], opponents: [unseenCombos(c)]}).hero.equity)` with `c` = the class's lowest-id combo. It is stored in `src/advice/ranges/hand-order.json` with a ≥ 50-word justification, descending, ties by grid order (A-6). | Sklansky–Chubukov ranking; a hand-authored expert list; equity against several random hands; order by how many default ranges contain the class | Objective and reproducible with the project's own calculator. Original (REQ-061.2). Starts with AA. Testable by recomputation. | yes | user (Q-1) |
| D-2 | Public interface: `ObservedOpponent {seat, hands, vpip, pfr}` (percent 0–100); option `observedOpponents?: readonly ObservedOpponent[]` on `PostflopOptions` (hence `RecommendOptions` and `gradeView`); `estimateOpponentRanges(view, observed?)`; `OpponentRange` gains `basis: OpponentBasis` and `widthPct: number \| null`; `PostflopRecommendation` gains `opponentBasis: readonly OpponentBasis[]`, with `OpponentBasis {seat, observedHands: number \| null, text}`. `adviceOptions` is not changed, so it drops the snapshot. Preflop is unchanged. | Snapshot as `StyleCounts` (can't express AC#2's 4.5 raises); a Map (not JSON/structured-clone friendly); basis on preflop recs too (re-pins preflop tests, and the chart reads no ranges) | Smallest surface that meets AC#3/#4. Plain data for the later worker/record wiring. Bots excluded by construction. | yes | user (Q-2) |
| D-3 | User-visible text. Basis strings: `'typical player'` and `'based on {hands} hands of this opponent'`. Explanation lead: `'Ranges here follow the opponent type, {def:opponent-type}, of each player you have watched for {minHands} or more hands; '`, followed by the rule template with its first letter lower-cased. | A separate sentence (breaks ≤ 3 sentences on 4 templates); a closing clause; per-opponent names | Keeps the REQ-037 limits. The concept and its definition are in the first sentence (REQ-037 and the TASK-7.10 AC#3 rule). | yes | user (Q-3) |
| D-4 | Re-pin the locked `tests/advice/postflop.acceptance.test.ts` (owners TASK-7.3, TASK-7.9) inside `AC#1 equity equal to required equity recommends call`. Add `opponentBasis: [1, 2, 6].map((seat) => ({ seat, observedHands: null, text: 'typical player' }))` (live opponents of that view, `tests/advice/postflop.acceptance.test.ts:34`) to its `toStrictEqual` literal. Nothing else changes, and the test count is unchanged. | `opponentBasis` outside the recommendation (doesn't meet AC#3 "the recommendation … returns the basis") | One additive key. Meaning unchanged. | yes | user (Q-4) |
| D-5 | The snapshot is applied only in `opponentRanges: 'actions'` mode. In `'unseen'` mode every basis is 'typical player' and the snapshot is ignored, without validation. | Scale in both modes (`'unseen'` has no default range to scale) | `'unseen'` has no width to scale. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges/hand-order.json` — create: `{format: "tlh-hand-order", version: 1, justification, hands: [["AA", 85.x], …]}`, 169 entries (D-1).
- `src/advice/ranges.ts` — modify: hand-order loader and validation, width and scaling functions, `ObservedOpponent`, `OpponentBasis`, scaling in `estimateOpponentRanges`.
- `src/advice/postflop.ts` — modify: `observedOpponents` option, `opponentBasis` field, pass the snapshot in `'actions'` mode.
- `src/advice/explain.ts` — modify: `basisText(hands)` and the lead clause in `explainPostflop`.
- `src/advice/explanations.ts` — modify: authored `TYPICAL_PLAYER_BASIS`, `OBSERVED_BASIS`, `OPPONENT_TYPE_LEAD`.
- `tests/advice/observed-ranges.acceptance.test.ts` — create: AC#1–#7 (SPEC-01..07).
- `tests/advice/observed-ranges.test.ts` — create: unit SPEC-08..10.
- `tests/advice/postflop.acceptance.test.ts` — modify (locked re-pin, D-4).
- `tests/advice/explain.test.ts` — modify: add `opponentBasis: []` to the `postflop()` fixture (`:34-50`) plus lead-clause unit cases.
- `docs/advice/range-model.md` — modify: replace `:16-17`; add a section "Adjusting to observed play" (threshold, formula with worked example, which stat each line uses, the hand order and how it was computed, AA floor, basis text, bots excluded, snapshot supplied by callers).
- `docs/advice/explanations.md` — modify: `:27` and the opponent-type lead.
- `docs/advice/postflop-rules.md` — modify: `:155` note.
- `doit/TASK-7.13/build-log.md` is written by the build step (not counted).

### Components, interfaces and data
In `src/advice/ranges.ts`:
```ts
export const OBSERVED_MIN_HANDS = 30;
export const OBSERVED_FULL_HANDS = 100;
export const ALL_COMBOS = 1326;
/** A per-decision snapshot of one seat's session stats (REQ-036: part of the advice input). */
export interface ObservedOpponent {
  readonly seat: SeatNumber;
  /** Hands observed this session: integer ≥ 0. */
  readonly hands: number;
  /** Percent 0..100. */
  readonly vpip: number;
  readonly pfr: number;
}
export interface OpponentBasis {
  readonly seat: SeatNumber;
  /** null = typical player. */
  readonly observedHands: number | null;
  /** 'typical player' | 'based on N hands of this opponent'. */
  readonly text: string;
}
export const HAND_ORDER: readonly HandClass[];               // 169, strongest first, from hand-order.json
export function parseHandOrder(raw: unknown): readonly HandClass[]; // throws RangeValidationError
export function rangeWidthPct(classes: ReadonlySet<HandClass>): number;   // Σ comboCount ÷ 1326 × 100
export function scaledWidthPct(d: number, o: number, n: number): number;  // d + (o − d) × min(n,100) ÷ 100
export function strongestClasses(widthPct: number): ReadonlySet<HandClass>; // A-1
export function estimateOpponentRanges(
  view: PlayerView, observed?: readonly ObservedOpponent[],
): readonly OpponentRange[];
```
`OpponentRange` gains:
- `basis: OpponentBasis`.
- `widthPct: number | null`: the width of the classes the start was built from (the scaled width when observed,
  `rangeWidthPct(default)` when typical at six-max, `null` when there's no default range).

`estimateOpponentRanges` without `observed` (or with an empty array) returns exactly what it returns today for
`seat, position, line, start, combos`.

In `src/advice/postflop.ts`:
- `PostflopOptions.observedOpponents?: readonly ObservedOpponent[]`.
- `PostflopRecommendation.opponentBasis: readonly OpponentBasis[]` (placed before `explanation`): one per live
  opponent, ascending seat, same order and length as `opponents`.

In `src/advice/explain.ts`: `basisText(observedHands: number | null): string`.

In `src/advice/explanations.ts` (authored, REQ-061.2):
- `TYPICAL_PLAYER_BASIS = 'typical player'`
- `OBSERVED_BASIS = 'based on {hands} hands of this opponent'`
- `OPPONENT_TYPE_LEAD = 'Ranges here follow the opponent type, {def:opponent-type}, of each player you have watched for {minHands} or more hands; '`

`hand-order.json` validation (`parseHandOrder`, at import like `SIX_MAX_RANGES`) reports every problem in one
`RangeValidationError`:
- wrong format or version;
- justification under 50 words;
- an entry that is not `[class, number]`;
- an unknown class;
- a duplicate class;
- a missing class (not exactly the 169);
- order not descending by equity (ties must follow grid order);
- first entry not AA.

### Rules and algorithms
1. Snapshot validation (only in `estimateOpponentRanges` when `observed` is given):
   - Every entry needs `Number.isInteger(hands) && hands >= 0`, and `vpip` and `pfr` finite and within 0..100.
     Otherwise throw `RangeError('Invalid observed stats for seat <seat>')`.
   - A repeated seat throws `RangeError('Observed stats list seat <seat> twice')`.
2. For each live opponent (ascending seat), with `obs` = its entry, if any:
   - Observed when the view is six-max, `line !== 'check'`, `obs !== undefined` and `obs.hands >= 30`.
     - `d = rangeWidthPct(defaultRange(...).classes)`.
     - `o = obs.pfr` for `open-raise`, `three-bet` and `four-bet`; `o = obs.vpip` for `limp`, `call-raise` and
       `call-three-bet`.
     - `widthPct = scaledWidthPct(d, o, obs.hands)`.
     - The start classes are `strongestClasses(widthPct)`.
     - The basis is `{seat, observedHands: obs.hands, text: 'based on <hands> hands of this opponent'}`.
   - Otherwise the start classes are the default ones as today, and the basis is
     `{seat, observedHands: null, text: 'typical player'}`.
   - Then dead-card expansion, the fully-blocked fallback and narrowing run exactly as today (A-5).
3. `scaledWidthPct(d, o, n) = d + (o − d) × Math.min(n, 100) / 100`. It is pure and is called only for n ≥ 30.
   Worked examples (AC#5):
   - d = 20, n = 30: o = 0 → 20 + (−20) × 0.3 = 14.0; o = 20 → 20.0; o = 100 → 20 + 80 × 0.3 = 44.0.
   - d = 20, n = 100, o = 60 → 20 + 40 × 1 = 60.0.
   - d = 20, n = 100, o = 0 → 0.0 (AC#6).
4. `strongestClasses(w)`: walk `HAND_ORDER`, adding classes while the running combo total is
   `< w / 100 × 1326 − 1e-9`. Always take at least AA, and take all 169 when w ≥ 100.
   - Example: w = 0 → {AA} (6 combos).
   - Example: w = 0.5 (6.63 combos) → the first two classes (12 combos).
5. `recommendPostflop`, in `'actions'` mode, passes `options.observedOpponents` to `estimateOpponentRanges`, and
   `opponentBasis = estimated.map(o => o.basis)`. In `'unseen'` mode every live opponent gets the typical basis.
6. `explainPostflop`:
   - If any `rec.opponentBasis[i].observedHands !== null`, the explanation is
     `fillTemplate(OPPONENT_TYPE_LEAD, {minHands: '30'}) + lowerFirst(<the existing explanation>)`.
   - Otherwise it is unchanged, byte for byte.
   - Sentence count is unchanged.
7. Hand-order generation (builder, one-off, the output committed). For each class in `HAND_CLASSES`:
   - `c = expandRange(new Set([hc]), [])[0]`;
   - `pct = toPct(computeEquity({hero: c, board: [], opponents: [unseenCombos(c)]}).hero.equity)`;
   - sort descending by `pct`, ties by grid index.
   - Record the procedure in the JSON justification and in `range-model.md`. Don't commit a generator script (it is
     not needed at run time).

### Error handling and configuration
- `RangeError('Invalid observed stats for seat <n>')` and `RangeError('Observed stats list seat <n> twice')` from
  `estimateOpponentRanges`. They propagate through `recommendPostflop`, `recommend` and `gradeView`, like other advice
  errors. `handleAdviceRequest` (unchanged) would turn them into `ok:false`.
- `RangeValidationError` from `parseHandOrder` at import if the data file is broken.
- Constants: `OBSERVED_MIN_HANDS = 30` and `OBSERVED_FULL_HANDS = 100`. There is no configuration.

## 6. Behaviour specification

### SPEC-01: Below 30 hands the default range and 'typical player' are used
- Verifies: AC#1
- Behaviour: Given a six-max flop view where seat X open-raised preflop, and a snapshot `[{seat: X, hands: 29, vpip:
  60, pfr: 50}]`, When `estimateOpponentRanges(view, snapshot)` runs, Then X's `start` and `combos` equal those from
  `estimateOpponentRanges(view)`, `start` equals `expandRange(defaultRange(SIX_MAX_RANGES, pos, 'open-raise').classes,
  dead)`, and `basis` is `{seat: X, observedHands: null, text: 'typical player'}`.
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#1 an opponent with 29 observed hands keeps the default range and the typical-player basis`

### SPEC-02: Different observed stats give different ranges at the formula's width
- Verifies: AC#2
- Behaviour: Given one six-max flop view, and two 30-hand snapshots for the same opponents with VPIP 20/PFR 15 and
  VPIP 60/PFR 10, where one opponent open-raised (PFR line) and one called a raise (VPIP line), When the ranges are
  estimated under each snapshot, Then for each opponent:
  - the two `start` ranges differ;
  - `widthPct` equals `scaledWidthPct(rangeWidthPct(default classes), o, 30)` within 1e-9 (o = PFR for the raiser,
    VPIP for the caller);
  - `start` equals `expandRange(strongestClasses(widthPct), dead)`.
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#2 identical actions with different observed stats give different ranges at the formula width`

### SPEC-03: Postflop basis with 40 observed hands
- Verifies: AC#3
- Behaviour: Given a heads-up-on-the-flop six-max view (one live opponent), When
  `recommend(view, {opponentRanges: 'actions', observedOpponents: [{seat, hands: 40, vpip: 30, pfr: 20}]})` runs
  (with a fixed-equity stub), Then `opponentBasis` is `[{seat, observedHands: 40, text: 'based on 40 hands of this
  opponent'}]`. A second identical call returns a deep-equal recommendation (REQ-036).
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#3 a postflop recommendation states based on 40 hands of this opponent`

### SPEC-04: Multiway basis per opponent
- Verifies: AC#4
- Behaviour: Given a six-max flop view with two live opponents A < B (seat order), and a snapshot with A at 45 hands
  and B at 12, When the recommendation is computed in `'actions'` mode, Then `opponentBasis.map(b => b.text)` is
  `['based on 45 hands of this opponent', 'typical player']`, with seats `[A, B]`.
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#4 a multiway recommendation returns each opponent's basis`

### SPEC-05: Scaling formula values
- Verifies: AC#5
- Behaviour: `scaledWidthPct(20, 0, 30)`, `(20, 20, 30)` and `(20, 100, 30)` are 14.0, 20.0 and 44.0, and
  `scaledWidthPct(20, 60, 100)` is 60.0 (each `toBeCloseTo(x, 9)`).
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#5 the scaling formula gives 14.0, 20.0, 44.0 and 60.0`

### SPEC-06: Zero width floors at AA
- Verifies: AC#6
- Behaviour: all of the following hold:
  - `scaledWidthPct(20, 0, 100)` is 0.0, and `strongestClasses(0)` is `{AA}` with `comboCount('AA') === 6`.
  - Given a six-max flop view with no ace in the hero's cards or on the board, where seat X open-raised, and
    `[{seat: X, hands: 100, vpip: 0, pfr: 0}]`, Then X's `widthPct` is 0 and `start` is the 6 AA combos (never
    empty).
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#6 a zero scaled width leaves only AA's 6 combos`

### SPEC-07: Explanation names and defines opponent type when observed
- Verifies: AC#7
- Behaviour: Given the SPEC-03 view, When it is recommended with the 40-hand snapshot, Then:
  - the explanation starts with `'Ranges here follow the opponent type, ' + <CONCEPTS opponent-type definition> + ','`;
  - its first sentence contains both "opponent type" and that definition;
  - it has 1–3 sentences, each ending in `.!?`.

  Given the same view without a snapshot, Then the explanation does not contain "opponent type" and equals today's
  text.
- Verification: acceptance `tests/advice/observed-ranges.acceptance.test.ts::AC#7 an explanation resting on observed habits names and defines opponent type`

### SPEC-08: The hand order is authored, valid and reproducible
- Verifies: DoD#1, DoD#9
- Behaviour: all of the following hold:
  - `HAND_ORDER` is a permutation of `HAND_CLASSES` starting with AA, and the stored equities are non-increasing,
    ties in grid order.
  - The justification is ≥ 50 words.
  - For AA, KK, AKs, AKo, T9s, 72o and 32o, the stored equity equals the §5 rule 7 recomputation exactly.
  - `parseHandOrder` rejects, each listed in one `RangeValidationError`: a wrong format, a duplicate, a missing
    class, an unsorted list and a non-AA first entry.
  - `strongestClasses`: w = 0 → {AA}; w = 0.5 → the first two classes; w = 100 → 169 classes; and for w = 12.5 the
    prefix reaches 165.75 combos while dropping its last class falls below it.
- Verification: unit `tests/advice/observed-ranges.test.ts::hand order`

### SPEC-09: Invalid snapshots are rejected
- Verifies: DoD#1
- Behaviour: all of the following hold:
  - `estimateOpponentRanges(view, [...])` throws `RangeError('Invalid observed stats for seat 4')` for
    `hands: 29.5`, `hands: -1`, `vpip: 101`, `pfr: NaN`.
  - It throws `RangeError('Observed stats list seat 4 twice')` for a duplicate seat.
  - Entries for the hero, a folded seat or an absent seat are ignored (the result equals the no-snapshot result).
  - The BB on the `check` line with 50 hands keeps the default range and 'typical player' (A-3).
- Verification: unit `tests/advice/observed-ranges.test.ts::observed snapshot validation`

### SPEC-10: Bots and the unseen mode never use observed stats
- Verifies: DoD#1, DoD#6
- Behaviour: all of the following hold:
  - `adviceOptions({opponentRanges: 'actions', observedOpponents: [...]})` has no `observedOpponents` key.
  - In `opponentRanges: 'unseen'` mode with a 50-hand snapshot, every `opponentBasis` entry is 'typical player' and
    the equity input equals the no-snapshot call.
  - `recommend(view, ACTION_RANGE_ADVICE)` returns all 'typical player' bases.
- Verification: unit `tests/advice/observed-ranges.test.ts::bots and unseen mode ignore observed stats`

### SPEC-11: Playtest unchanged
- Verifies: DoD#6
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then it reports `Invariant violations: 0`
  and the stdout SHA-256 is `1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5`, unchanged because
  bots never receive the snapshot.
- Verification: command `bash -c 'npm run -s playtest -- --hands 10000 --seed 42 | tee /dev/stderr | shasum -a 256'`

### SPEC-12: Repo checks, coverage, boundaries, locked re-pin
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: all of the following hold:
  - lint, typecheck and `npm test` pass with zero errors, including the D-4 re-pin and every other locked file
    unchanged (`range-model`, `explanations`, `grade`, `value-bet`, `implied-odds` acceptance files);
  - coverage thresholds hold;
  - `src/advice` imports no UI or browser code;
  - no network code is added.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: Documentation and justification
- Verifies: DoD#9, DoD#11
- Behaviour: `docs/advice/range-model.md` states:
  - the 30-hand threshold and the formula with the AC#5 worked example;
  - which stat each line uses, and that `check` and non-six-max tables are not scaled;
  - the hand order's method and where it lives, the A-1 prefix rule and the AA floor;
  - the two basis texts;
  - that callers supply the snapshot per decision and that bots never do.

  `explanations.md` describes the opponent-type lead. The `hand-order.json` justification is ≥ 50 words, original
  text. The story doc is published by the doit docs step.
- Verification: manual read `docs/advice/range-model.md` and `docs/advice/explanations.md` against this list; `backlog doc list --plain` shows the story doc

### SPEC-14: N/A items and CI
- Verifies: DoD#3, DoD#7, DoD#10, DoD#12
- Behaviour: all of the following hold:
  - DoD#3 is N/A (the golden-spot story E07-S14/TASK-7.14 isn't done; the existing `tests/golden` suite still passes
    in `npm test`).
  - DoD#7 and DoD#12 are N/A (no screen or dialog changes).
  - CI is green on `doit/TASK-7.13`.
- Verification: manual `gh run list --branch doit/TASK-7.13 --limit 1` shows success

## 7. Edge cases
- 29 vs 30 hands (SPEC-01, SPEC-03). n > 100 is capped at 100 (formula; SPEC-05 n = 100).
- Width 0 → AA. Width ≥ 100 → all classes (SPEC-06, SPEC-08).
- The scaled AA range fully blocked by the hero's or board cards → the existing every-unseen fallback, with the basis
  still observed (A-5; covered by the existing fallback code, no new test).
- The BB `check` line, non-six-max tables and `'unseen'` mode → typical (SPEC-09, SPEC-10).
- Hero, folded or absent seats in the snapshot → ignored. A duplicate seat or invalid numbers → RangeError (SPEC-09).
- A mixed multiway basis (SPEC-04). The lead clause appears if any one opponent is observed (SPEC-07).
- Concurrency, persistence and permissions: N/A (pure function, no stored data).

## 8. Security considerations
- The snapshot is in-process data from future session code. It is validated (§5 rule 1) so that malformed numbers
  can't produce NaN widths. No HTML: the text is rendered by later UI as text.
- The bot boundary (REQ-035.3 / REQ-029.2) is kept by `adviceOptions` dropping the snapshot (SPEC-10) and by the
  unchanged locked type checks.
- No secrets, no dependencies, no randomness beyond the existing input-seeded equity sampler, no network, no logging.

## 9. Non-functional
- No extra cost without a snapshot: the typical path is unchanged.
- With a snapshot, scaling is one pass over ≤ 169 classes per opponent (microseconds).
- The SPEC-08 spot recomputation is 7 preflop equity runs (each ~30,000 trials). The builder records the unit file's
  wall time in the build log; it must stay under 3 s locally. Otherwise reduce to AA, AKo and 32o.
- The playtest SHA is unchanged (SPEC-11).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests:
  - `tests/advice/observed-ranges.acceptance.test.ts` → SPEC-01..07.
  - `tests/advice/observed-ranges.test.ts` → SPEC-08..10.
  - `tests/advice/explain.test.ts` additions: lead clause present/absent, `basisText(40)`.
- Judge scenario:
  1. Run `npx vitest run tests/advice/observed-ranges.acceptance.test.ts tests/advice/observed-ranges.test.ts`.
  2. In a scratch script, build the SPEC-04 view and print `recommend(...)`'s `opponentBasis` and `explanation`
     with and without the snapshot. Read them as a learner would.
  3. Run the playtest and compare its SHA with SPEC-11.

## 11. Open questions
- None. Resolved:
  - Q-1: D-1 hand order accepted.
  - Q-2: D-2 interface accepted.
  - Q-3: D-3 wording accepted.
  - Q-4: D-4 re-pin accepted (the locked file is unlocked for this edit).

## 12. Clarifications log
See `doit/TASK-7.13/qa.md`.
