# Spec: TASK-7.5 — Estimate each opponent's range from their actions in the hand

Status: READY (approved 2026-11-22)
Task: TASK-7.5 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-035.1, REQ-035.3, REQ-035.5, REQ-061.2 (REQ-035.2/035.6 observed-stat scaling is TASK-7.13; REQ-035.4 basis label is the hint/review stories; heads-up and full-ring ranges are TASK-7.6) · Dream: limit-holdem-trainer

## 1. Summary
Postflop advice currently treats every live opponent as holding any unseen two cards (`src/advice/postflop.ts:45-55,85-86`).
This task adds a range model. Each opponent starts from an authored 6-max default range, chosen by their position and
their preflop line. That range is then narrowed street by street by the documented Strong/Pair/Draw/Air rule
(REQ-035.5), and the advice the user sees (hint requests and review grades) computes equity against these ranges. The
model reads only the `PlayerView`, and a type-level guard makes it a compile error to pass a bot's style or parameters
into the advice engine (REQ-035.3). Bots keep the every-unseen-combo path in this story (Q-1, approved). A follow-up task switches bots to action ranges and re-baselines their pinned tests. That keeps every
locked test from earlier stories and the playtest baseline unchanged.

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: the preflop-line taxonomy, the default-range file format and its validator, hand-class
    range notation, combo expansion, the Strong/Pair/Draw/Air classifier, single-step narrowing, and
    `estimateOpponentRanges(view)`.
  - `src/advice/ranges/six-max.json`: 36 authored default ranges (6-max) with original plain-English justifications
    (Q-2).
  - A `opponentRanges: 'unseen' | 'actions'` option on postflop advice. The default stays `'unseen'` (Q-1), and the
    equity fallback chain applies in `'actions'` mode.
  - User-facing advice uses `'actions'`: `handleAdviceRequest` for `recommend` and `grade` requests, and the review
    built in `Table.tsx` through a new `userReviewEntries(hand)`.
  - A type guard on `recommend`, `recommendPostflop` and `gradeView` options that rejects any key outside
    `RecommendOptions`. Bots now pass advice options through an `adviceOptions()` picker.
  - `docs/advice/range-model.md` (the range-model design document, which includes the worked fixture). The
    "Opponent hands" input and the "Not applied yet" list in `docs/advice/postflop-rules.md` are updated.
- Not doing:
  - Switching bots (`src/bots/*`, the playtest, `decideStyle`) to action ranges. Bot decisions must stay
    byte-identical, and the default `npm run playtest -- --hands 10000 --seed 42 --size 6` output SHA stays
    `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc`.
  - Observed-statistics scaling and the 30-hand threshold (TASK-7.13). No stats parameter is added.
  - Heads-up and full-ring default ranges (TASK-7.6), and approximate-size mapping (TASK-7.16).
  - Any new field on `PostflopRecommendation` or on the recommendation shape. The "typical player" basis label
    (REQ-035.4) belongs to the hint and review stories.
  - The value-bet "range that would call" (TASK-7.8) and implied odds (TASK-7.9).
  - Edits to any locked test file (the full list is in doit/*/state.json). No change to `src/engine/`,
    `src/advice/equity.ts`, `src/advice/preflop*.ts`, the chart JSON, e2e specs or the toolchain. No new dependency.
- Scope budget: files=17, lines=2100   (ranges.ts ~330, six-max.json ~260, postflop.ts ~60, recommend.ts ~35, grade.ts ~10, 4 bot files ~25, advice-service.ts ~8, review.ts ~12, Table.tsx ~2, range-model.md ~170, postflop-rules.md ~30, range-model.acceptance.test.ts ~330, ranges.test.ts ~380, postflop-ranges.test.ts ~190, postflop.perf.test.ts ~30, advice-service.test.ts ~40, review.test.ts ~40)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Module `src/advice/ranges.ts`, data `src/advice/ranges/six-max.json` (imported with `with { type: 'json' }` and validated at import, like `SIX_MAX_CHART`, `preflop.ts:3,17`). Design doc `docs/advice/range-model.md`. | yes | Same layout as the chart (`charts/six-max.json` + `preflop-chart.ts`). A separate doc keeps `### Rule` headings out of `postflop-rules.md`, whose locked consistency test (`postflop.acceptance.test.ts` AC#5) would treat new rule headings as engine rules. | Put ranges inside the chart JSON; Backlog doc |
| A-2 | Opponent combos are expanded from hand classes, excluding any combo that contains a hero hole card or a board card, sorted ascending `[low, high]` by `low*52+high`. Cards shown at earlier showdowns are not dead (fresh deck each hand, as in TASK-7.3 A-3). | yes | Matches `unseenCombos` (`postflop.ts:45-55`) and `canonicalise` (`equity.ts:99-107`). | Pass all class combos and let `computeEquity` drop dead ones (same equity, but AC#2's "exactly" is easier to state on the filtered list) |
| A-3 | Tables with a dealt-in count other than 6 have no authored ranges yet (TASK-7.6). Their opponents start from every unseen combo (A-2), and postflop narrowing still applies. | yes | `positionOf` only knows 6-max (`preflop.ts:47-55`). The locked `grade.acceptance.test.ts` AC#7 uses a heads-up flop under the default option and must not throw. The app's tables are 6-max. | Throw for non-6 tables; map sizes to 6-max now (TASK-7.16's job) |
| A-4 | An opponent's preflop line comes from their **last voluntary preflop action** (blinds excluded), keyed by the number of preflop raises before it (§5 table). An opponent with no voluntary action (all-in on posting a blind) is keyed as if they had called: `check` for the BB with 0 raises, `limp` for the SB with 0 raises, `call-raise` with 1 raise, `call-three-bet` with ≥ 2. | yes | Finite, total, and matches common usage: "limp then call a raise" is a call-raise line, and "open then call a 3-bet" is a call-three-bet line. | Key by the full action sequence (combinatorial blow-up) |
| A-5 | Empty-narrowing guard: if one street's narrowing would leave an opponent with no live combo, that street's narrowing is skipped and the previous range is kept. | yes | `computeEquity` throws on an empty range (`equity.ts:108`). Skipping keeps advice total and deterministic. | Reset to the default range; fall back to unseen |
| A-6 | Equity fallback in `'actions'` mode: if the equity function throws a `RangeError` for the estimated ranges (no joint deal, or sampling rejections), the engine retries once with each opponent's un-narrowed starting range, then once with every unseen combo. Errors from that last attempt propagate. | yes | Rare multiway card conflicts must not crash a hint. The order is deterministic, so REQ-036 holds. | Throw; drop the conflicting opponent |
| A-7 | No observed-statistics input is added. Every opponent is on the default ("typical player") basis, which satisfies AC#2's "fewer than 30 observed hands" and AC#7's "identical observed statistics" for every view. | yes | TASK-7.13 owns stats and scaling. A placeholder parameter would be dead code. | Add `observed?: ReadonlyMap<SeatNumber, {hands:number}>` now |
| A-8 | The new latency scenarios follow `postflop.perf.test.ts` (real targets with `ADVICE_PERF_SCALE=1`, 20× slack in `npm test`, not enforced when `CI=true`). | yes | Precedent from TASK-7.1 and TASK-7.3 A-8, and the standing rule that speed checks are not strict in CI. | No perf test |

## 3. Current system
- TypeScript strict ESM, Vitest 5 with v8 coverage (`vite.config.ts:6-24`; lines ≥ 90% for
  `src/{engine,bots,advice,stats,playtest,table}/**`, ≥ 70% overall). `npm run lint` = ESLint + `prettier --check .`,
  so the JSON and Markdown must be Prettier-clean. `tsconfig.json` includes `tests/`, so `// @ts-expect-error` lines in
  tests are checked by `npm run typecheck` (precedent: `tests/advice/grade.acceptance.test.ts:296`).
- `src/engine/player-view.ts:36-58`: `PlayerView` carries `button`, `players` (with `folded`), `board` and `actions`
  (every `ActionRecord {street, seat, type, amount, added}`, blinds first). Action types are
  `'small-blind' | 'big-blind' | 'fold' | 'check' | 'call' | 'bet' | 'raise'` (`src/engine/hand.ts:53-61`). The view
  has no style field, so the range model can be built from public information only.
- `src/advice/postflop.ts:34-37`: `PostflopOptions { equity? }`. `:45-55` builds `unseenCombos`. `:85-91` passes one
  shared range per live opponent to `computeEquity`. Result shape is `:11-32`, pinned by the locked
  `tests/advice/postflop.acceptance.test.ts` AC#1 `toStrictEqual`, including `toHaveLength(1081)` per opponent under
  the default options.
- `src/advice/recommend.ts:7-14`: `RecommendOptions = PreflopOptions & PostflopOptions` and `recommend(view, options)`.
- `src/advice/grade.ts:139-143`: `gradeView(view, userAction, options?: RecommendOptions)`.
- `src/advice/equity.ts:62-120`: `canonicalise` drops dead or duplicate combos and throws `RangeError` "Opponent n
  has no possible hand". `:255,265-269,286` throws `RangeError` "Opponents' hands cannot all be dealt together" or
  "Sampling rejected too many deals". `:342-353`: `computeEquity` is exact when the estimate is ≤ 200,000
  evaluations, otherwise 30,000 seeded samples.
- `src/advice/preflop.ts:44-72`: `SIX_MAX_ORDER`, `positionOf(view)` (reads only `players`, `button`, `seat`) and
  `situationOf`. `src/advice/preflop-chart.ts:1-120`: the chart format, validator, word-count rule (`wordCount`,
  `\p{L}+`, `CHART_WORDS = 50`, `SPOT_WORDS = 15`), `ChartValidationError(problems)` and the error-message style.
- `src/advice/hand-class.ts`: `HandClass`, `HAND_CLASSES` (169), `handClassOf`, `comboCount`.
- `src/engine/hand-evaluator.ts:168,209`: `evaluate(5..7 cards)` and `handCategory(rank)`. `src/engine/cards.ts`:
  card = rank*4+suit, `parseCards`, `formatCard`, `cardRank`, `cardSuit`.
- Bots: `src/bots/tag.ts:30-49`, `calling-station.ts:27-48`, `maniac.ts:~25-44` and `rock.ts:~20-45` call
  `recommend(view, options)` with their own option objects (`random`, and `style` for the Calling station), which
  still compile today. Bots never set `equity` except `FREE_CHECK_EQUITY`.
- User-facing advice: `src/table/advice-service.ts:64-67` (`recommend(request.view)`,
  `gradeView(request.view, request.userAction)`). `src/ui/table/Table.tsx:239` (`reviewEntries(hand)`).
  `src/table/review.ts:38-50` (`reviewEntries(hand, options?)`).
- Locked tests that call default-option advice and must stay green unchanged: `tests/advice/postflop.acceptance.test.ts`
  (7.3), `postflop-coverage.acceptance.test.ts` (7.22), `grade.acceptance.test.ts` (7.4),
  `tests/table/review.acceptance.test.ts` and `tests/ui/review-panel.acceptance.test.tsx` (9.1: they compare
  `reviewEntries(hand)` with default `gradeView`), and `tests/bots/tag-playtest.acceptance.test.ts` (6.1: it mocks
  `recommend` as `(view, options?: RecommendOptions) => actual.recommend(view, options)`, so the new generic signature
  must accept a `RecommendOptions | undefined` argument).
- Existing code to reuse:
  - `src/advice/preflop.ts` `positionOf` → each opponent's position, called as `positionOf({ ...view, seat })`.
    Don't write a second seat-order table.
  - `src/advice/preflop-chart.ts` → the word-count rule, the `echo` truncation style and the error-class pattern
    for the range validator. Copy the small helpers into `ranges.ts` or export them; don't invent a new message
    style.
  - `src/advice/hand-class.ts` `handClassOf`, `HAND_CLASSES`, `comboCount` → class membership and width checks.
  - `src/engine/hand-evaluator.ts` `evaluate` + `handCategory` → the Strong test.
  - `src/advice/postflop.ts` `unseenCombos` → the non-6 start range and the last fallback. Export it or move it
    into `ranges.ts`.
  - `tests/advice/postflop.acceptance.test.ts:19-77` (deck/step helpers) → copy the `deckWith`, `spotDeck`,
    `stateAfter` and `fixedEquity` patterns into the new tests. Locked files can't be imported from if they
    change, so copy, don't import.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Action ranges are opt-in via `opponentRanges: 'actions'`. The default `'unseen'` keeps today's behaviour. User-facing advice (service + review) passes `'actions'`. Bots stay on `'unseen'`. | (B) Default `'actions'` for everyone, bots included; (C) default `'actions'`, bots pass `'unseen'` | Measured on a prototype (narrowing only, in a scratch copy): (B) fails 2 locked tests, `postflop.acceptance` AC#1 (1081 combos) and `calling-station.acceptance` (pinned Example B at `fold[30]` moves to a preflop view). With real preflop ranges more pins are at risk (`review.acceptance` REVIEW_FOUR grades, the maniac and rock examples), and the playtest SHA changes. (C) fails at least `postflop.acceptance` AC#1, and the 9.1 review tests' default grades could change. Option A fails none. | yes | user (Q-1, auto-accepted) |
| D-2 | 36 authored 6-max ranges keyed by (position, line), with the 7 lines in §5, in hand-class notation, plus a file justification (≥ 50 words) and one per range (≥ 15 words). The target is a "typical low-stakes limit player", looser than the TAG chart. | Derive ranges from the TAG chart; key by full action sequence; per-combo weights | REQ-035.1 asks for authored data with justification per (size, position, action sequence). Deriving from the chart would model every opponent as the TAG bot. | yes | user (Q-2, auto-accepted) |
| D-3 | Classification (§5) defines "using at least one hole card" as "the hand's category is strictly above the board's own category" for Strong, and "a hole card pairs the board or is a pocket pair" for Pair. Draw needs ≥ 1 hole card in the 4-flush or the 4-run. Each street narrows once, by the opponent's most aggressive action on it (raise > bet > call > check). | Narrow once per action (a check-raise would keep only Draw); use the last action | The fixture (AC#3-#6) holds under both choices, but sequential narrowing turns a check-raise into "draws only", which reads opponents backwards. | yes | user (Q-3, auto-accepted) |
| D-4 | AC#8 guard: `recommend`, `recommendPostflop` and `gradeView` become generic over `O extends <their options type>`, with `options?: ExactOptions<O, Allowed>` where `ExactOptions<O, A> = O & { readonly [K in Exclude<keyof O, keyof A>]: never }`. `estimateOpponentRanges(view: PlayerView)` takes nothing else. Bots call `recommend(view, adviceOptions(options))`. `adviceOptions` copies only `equity`, `chart` and `opponentRanges`. | Brand types; runtime key check; `style?: never` on `RecommendOptions` (breaks the Calling station's own `style` option) | Structural typing alone lets a bot's options object with `random`/`style` reach `recommend` today (`calling-station.ts:38`). The exact-keys guard rejects it for literals and for variables, and the existing calls `recommend(view, options?: RecommendOptions)` still compile. | no | n/a |
| D-5 | No new field on any recommendation. `opponents`, `equityPct` and `equityMethod` keep their meaning. | Add `rangeBasis` | The locked 7.3 AC#1 `toStrictEqual` pins the exact key set. REQ-035.4 labelling belongs to the hint and review stories. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — new: line taxonomy, range file parser/validator, notation, expansion, classifier, narrowing, `estimateOpponentRanges`
- `src/advice/ranges/six-max.json` — new: 36 authored default ranges with justifications
- `src/advice/postflop.ts` — `opponentRanges` option, action-range path with fallbacks, generic options guard; export or move `unseenCombos`
- `src/advice/recommend.ts` — `ExactOptions`, generic `recommend`, `adviceOptions`, `ACTION_RANGE_ADVICE`
- `src/advice/grade.ts` — generic options guard on `gradeView`
- `src/bots/tag.ts` — pass `adviceOptions(...)` to `recommend`
- `src/bots/calling-station.ts` — same
- `src/bots/maniac.ts` — same
- `src/bots/rock.ts` — same
- `src/table/advice-service.ts` — `recommend` and `grade` requests use `ACTION_RANGE_ADVICE`
- `src/table/review.ts` — `userReviewEntries(hand)` = `reviewEntries(hand, ACTION_RANGE_ADVICE)`
- `src/ui/table/Table.tsx` — call `userReviewEntries(hand)` at line 239
- `docs/advice/range-model.md` — new: range-model design document
- `docs/advice/postflop-rules.md` — "Opponent hands" input and "Not applied yet" updated
- `tests/advice/range-model.acceptance.test.ts` — new (locked): AC#1-#9
- `tests/advice/ranges.test.ts` — new: unit tests for notation, lines, classifier, narrowing, validator, content sanity
- `tests/advice/postflop-ranges.test.ts` — new: unit tests for the postflop actions mode, fallbacks, determinism, bots unchanged
- `tests/advice/postflop.perf.test.ts` — add actions-mode scenarios
- `tests/table/advice-service.test.ts` — expectations for `recommend`/`grade` now use `ACTION_RANGE_ADVICE`
- `tests/table/review.test.ts` — `userReviewEntries` matches the service's grade for the same view

### Components, interfaces and data
```ts
// src/advice/ranges.ts
export type PreflopLine =
  'check' | 'limp' | 'open-raise' | 'call-raise' | 'three-bet' | 'call-three-bet' | 'four-bet';
export const PREFLOP_LINES: readonly PreflopLine[];            // in the order above
/** Lines each 6-max position can take (36 pairs). */
export const APPLICABLE_LINES: Readonly<Record<ReferenceSize, readonly { position: Position; line: PreflopLine }[]>>;
export type StrengthClass = 'strong' | 'pair' | 'draw' | 'air';
export type NarrowingAction = 'bet' | 'check' | 'call' | 'raise';
export const KEEP: Readonly<Record<NarrowingAction, readonly StrengthClass[]>>;
export interface DefaultRange {
  readonly position: Position; readonly line: PreflopLine;
  readonly justification: string;
  readonly classes: ReadonlySet<HandClass>;   // parsed from `hands`
}
export interface DefaultRanges {
  readonly referenceSize: ReferenceSize; readonly justification: string;
  readonly ranges: readonly DefaultRange[];  // APPLICABLE_LINES order
}
export class RangeValidationError extends Error { readonly problems: readonly string[] } // name 'RangeValidationError'
export function parseDefaultRanges(raw: unknown): DefaultRanges;           // throws RangeValidationError listing every problem
export function parseHandRange(text: string): ReadonlySet<HandClass>;      // throws RangeError(`Invalid range token "<echo>"`)
export const SIX_MAX_RANGES: DefaultRanges;                                 // six-max.json, validated at import
export function defaultRange(ranges: DefaultRanges, position: Position, line: PreflopLine): DefaultRange; // RangeError if absent
export function preflopLineOf(view: PlayerView, seat: SeatNumber): PreflopLine;
export function expandRange(classes: ReadonlySet<HandClass>, dead: readonly Card[]): HoleCards[]; // A-2 order
export function classifyCombo(hole: HoleCards, board: readonly Card[]): StrengthClass;           // board 3..5 cards
export function narrowRange(range: readonly HoleCards[], board: readonly Card[], action: NarrowingAction): HoleCards[];
export interface OpponentRange {
  readonly seat: SeatNumber;
  readonly position: Position | null;   // null when not 6 dealt-in seats (A-3)
  readonly line: PreflopLine | null;    // null when not 6 dealt-in seats
  readonly start: readonly HoleCards[]; // expanded default (or every unseen combo, A-3)
  readonly combos: readonly HoleCards[];// after postflop narrowing
}
/** One entry per live opponent (not folded, not the viewer), ascending seat. Reads only `view`. */
export function estimateOpponentRanges(view: PlayerView): readonly OpponentRange[];
```
```ts
// src/advice/postflop.ts
export interface PostflopOptions {
  readonly equity?: (input: EquityInput) => EquityResult;
  /** 'unseen' (default): every unseen combo. 'actions': estimateOpponentRanges (TASK-7.5). */
  readonly opponentRanges?: 'unseen' | 'actions';
}
// src/advice/recommend.ts
export type ExactOptions<O, Allowed> = O & { readonly [K in Exclude<keyof O, keyof Allowed>]: never };
export function recommend<O extends RecommendOptions = RecommendOptions>(view: PlayerView, options?: ExactOptions<O, RecommendOptions>): Recommendation;
export function adviceOptions(options: RecommendOptions): RecommendOptions; // copies equity, chart, opponentRanges only
export const ACTION_RANGE_ADVICE: RecommendOptions = { opponentRanges: 'actions' };
```
`recommendPostflop` and `gradeView` get the same generic guard (`Allowed` = `PostflopOptions` and `RecommendOptions`
respectively). Runtime behaviour of all three functions is unchanged for existing inputs.

Range file format (`six-max.json`, Prettier-formatted):
```json
{ "format": "tlh-default-ranges", "version": 1, "referenceSize": "6-max",
  "justification": "<≥ 50 words>",
  "ranges": [ { "position": "CO", "line": "open-raise", "justification": "<≥ 15 words>", "hands": "22+ A2s+ K9s+ ..." } ] }
```

### Rules and algorithms
**Hand-range notation** (`parseHandRange`), whitespace-separated tokens. The union of all tokens must be non-empty:
- a class: `AA`, `AKs`, `T9o`, with the higher rank first.
- `XX+`: pairs from XX up to AA (`TT+` = TT JJ QQ KK AA).
- `XYs+` / `XYo+`: X fixed, Y rising up to one below X (`A9s+` = A9s ATs AJs AQs AKs; `KTo+` = KTo KJo KQo).
- `XX-YY`: pairs between them, inclusive (`22-66`, in either order).
- `XYs-XZs` / `XYo-XZo`: same top rank and suitedness, kickers between, inclusive (`K5s-K9s`).
Any other token, or a token naming an impossible class (`AAs`, `KAs`, `KK+s`), throws `RangeError` with the message
`Invalid range token "<first 20 chars, then ...>"`. Duplicate classes from overlapping tokens are allowed and are
collapsed.

**Positions and lines (6-max).** Position = `positionOf({ ...view, seat })` (`preflop.ts:47`). Line = last
voluntary preflop action of the seat (types `check`, `call`, `raise`), keyed by r = the number of preflop `raise`
records before it:

| Last action | r = 0 | r = 1 | r ≥ 2 |
|---|---|---|---|
| check (BB only) | `check` | — | — |
| call (SB completing counts) | `limp` | `call-raise` | `call-three-bet` |
| raise | `open-raise` | `three-bet` | `four-bet` |

Applicable pairs (36): `check` BB only. `limp` UTG, HJ, CO, BTN, SB (not BB: a BB with no raise checks or raises).
`open-raise`, `call-raise`, `three-bet`, `call-three-bet` and `four-bet` at all six positions. A-4 covers seats with
no voluntary action.

**Classifier** (`classifyCombo(hole, board)`, board of 3, 4 or 5 cards). Category order, low to high: high-card <
one-pair < two-pair < three-of-a-kind < straight < flush < full-house < four-of-a-kind < straight-flush.
- `handCat` = `handCategory(evaluate([...hole, ...board]))`.
- `boardCat` = for 5 board cards, `handCategory(evaluate(board))`. For 3 or 4 cards, from rank multiplicities only:
  quads → four-of-a-kind, a triple → three-of-a-kind, two pairs → two-pair, one pair → one-pair, else high-card.
1. **Strong** if `handCat` ≥ two-pair and `handCat` > `boardCat`.
2. else **Pair** if the hole cards share a rank, or either hole card's rank appears on the board.
3. else **Draw** if (a) some suit has ≥ 4 cards among hole+board and at least one hole card has that suit, or (b) an
   open-ended run exists: four consecutive rank values v, v+1, v+2, v+3 all present among hole+board ranks (an ace
   also counts as value −1), at least one of them from a hole card, with v−1 ≥ −1 and v+4 ≤ 12. So 2345 counts
   (A or 6 completes it), A234 does not, TJQK counts, and JQKA does not.
4. else **Air**.

Worked fixture (also in the design doc). Range {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c}, flop Ks 8d 7c
(boardCat high-card):
- KhKd: trips, Strong. 8h7h: two pair, Strong.
- AhKh: one pair with a K on the board, Pair. 9h9d: pocket pair, Pair.
- 6h5h: 5-6-7-8 run (v=3), Draw. Th9h: 7-8-9-T run (v=5), Draw.
- QhJh: J-Q-K only, no 4-run and 2 hearts, Air. Ac2c: 3 clubs only (Ac 2c 7c), no run, Air.

On turn 2d (board Ks 8d 7c 2d), Ac2c becomes Pair (2 on the board), QhJh stays Air, 6h5h and Th9h stay Draw, and
AhKh and 9h9d stay Pair. Results: bet → 6 combos (−Air); check → 6 (−Strong); call → {AhKh, 9h9d, 6h5h, Th9h};
raise → {KhKd, 8h7h, 6h5h, Th9h}; flop check then turn call → {AhKh, 9h9d, 6h5h, Th9h, Ac2c}.

**Narrowing** (`narrowRange`): keep combos whose class on `board` is in `KEEP[action]`: bet → strong, pair, draw;
check → pair, draw, air; call → pair, draw; raise → strong, draw. Input order is preserved.

**Estimation** (`estimateOpponentRanges(view)`): for each live opponent in ascending seat order:
1. dead = hero hole cards + board.
2. Start: if exactly 6 seats are dealt in, `expandRange(defaultRange(SIX_MAX_RANGES, position, line).classes, dead)`.
   Otherwise every unseen combo (A-3). If the 6-max start expands to zero live combos, use every unseen combo.
3. For each street s in flop, turn, river that has a board (flop = `board[0..2]`, turn = `[0..3]`, river = `[0..4]`)
   and on which the opponent has ≥ 1 record of type check, call, bet or raise: take the most aggressive (raise > bet >
   call > check) and narrow with the board as of s. If the result would have no combo, keep the previous range (A-5).
An opponent who has not acted on the current street gets no narrowing for it (AC#2).

**Postflop `'actions'` mode** (`recommendPostflop`): opponents = `estimateOpponentRanges(view).map(o => o.combos)`
in ascending seat order, which is the same order as today's `view.players` filter. The engine calls the equity
function once. If that throws a `RangeError`, it calls it once more with the `start` ranges, and if that throws a
`RangeError`, once more with every unseen combo (A-6). Everything after equity (rules, rounding, result) is
unchanged. `'unseen'` mode is byte-identical to today.

### Error handling and configuration
- `parseDefaultRanges` collects every problem, then throws `RangeValidationError` (message
  `'Invalid default ranges:\n- ' + problems.join('\n- ')`). Problem texts, with `<label>` = `6-max ranges`:
  - `Range file: expected format "tlh-default-ranges" version 1` (thrown alone)
  - `Range file: unknown reference size "<echo>"` (thrown alone)
  - `<label>: missing plain-English justification (at least 50 words)`
  - `<label>: missing range <POSITION> <line>`
  - `<label>: <POSITION> <line> is missing its plain-English justification (at least 15 words)`
  - `<label>: <POSITION> <line> has no hands`
  - `<label>: <POSITION> <line> has invalid hands: Invalid range token "<echo>"`
  - `<label>: range <echo key> does not apply at 6-max`
  - `<label>: duplicate range <POSITION> <line>`
- `defaultRange` throws `RangeError('Ranges 6-max have no range <POSITION> <line>')`. It is unreachable for the
  shipped file.
- `estimateOpponentRanges` throws `RangeError` only for an invalid view: board length not in {3, 4, 5}
  (`Range estimation needs a flop, turn or river view, got <street>`).
- Defaults: `opponentRanges` = `'unseen'`. `ACTION_RANGE_ADVICE` = `{ opponentRanges: 'actions' }`.

## 6. Behaviour specification

### SPEC-01: Every applicable (size, position, line) has a range and a justification; gaps fail validation
- Verifies: AC#1, DoD#10
- Behaviour: Given the shipped `six-max.json`, When `parseDefaultRanges` runs, Then it returns 36 ranges in
  `APPLICABLE_LINES['6-max']` order, each with a non-empty class set and a justification of ≥ 15 words, and a file
  justification of ≥ 50 words. Given a copy with the `CO open-raise` entry removed, Then it throws
  `RangeValidationError` whose `problems` equal `['6-max ranges: missing range CO open-raise']`. Given a copy whose
  `BB check` justification is `""`, Then problems equal
  `['6-max ranges: BB check is missing its plain-English justification (at least 15 words)']`. Given a copy whose
  `UTG limp` hands are `""`, Then problems equal `['6-max ranges: UTG limp has no hands']`.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#1 every 6-max position and line has a justified range and gaps fail validation`

### SPEC-02: A CO open-raiser who has not acted on the flop gets exactly the authored range
- Verifies: AC#2
- Behaviour: Given 6 seats at $4/$8 with button 1 (SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1), preflop 4 fold, 5 fold,
  6 raise to 8, 1 fold, 2 fold, 3 call 4, and the flop dealt, When `recommend(view of seat 3, { ...ACTION_RANGE_ADVICE,
  equity: spy })` runs, Then the spy is called once with exactly one opponent range. That range deep-equals the combos
  of `defaultRange(SIX_MAX_RANGES, 'CO', 'open-raise').classes` minus every combo containing a hero or board card,
  sorted ascending. Its length equals Σ `comboCount` over the classes minus the dead-card combos, counted
  independently in the test. `estimateOpponentRanges(view)` returns `[{ seat: 6, position: 'CO', line: 'open-raise',
  … }]` with `combos` equal to `start`.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#2 a CO open-raiser who has not acted on the flop is the authored CO open-raise range`

### SPEC-03: Bet keeps Strong, Pair, Draw (Air removed)
- Verifies: AC#3
- Behaviour: Given range {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} and flop Ks 8d 7c, When
  `narrowRange(range, flop, 'bet')`, Then the result is the 6 combos {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h} (compared
  as sets of formatted combos), and `classifyCombo` gives strong, strong, pair, pair, draw, draw, air, air in fixture
  order.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#3 a flop bet removes Air from the fixture`

### SPEC-04: Check keeps Pair, Draw, Air (Strong removed)
- Verifies: AC#4
- Behaviour: Given the same range and flop, When `narrowRange(range, flop, 'check')`, Then the result is the 6 combos
  {AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c}.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#4 a flop check removes Strong from the fixture`

### SPEC-05: Call keeps Pair, Draw; raise keeps Strong, Draw
- Verifies: AC#5
- Behaviour: Given the same range and flop, When `narrowRange(…, 'call')`, Then {AhKh, 9h9d, 6h5h, Th9h} (4 combos).
  When `narrowRange(…, 'raise')`, Then {KhKd, 8h7h, 6h5h, Th9h} (4 combos).
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#5 a flop call keeps Pair and Draw and a raise keeps Strong and Draw`

### SPEC-06: Narrowing re-classifies on each street
- Verifies: AC#6
- Behaviour: Given the same range, When it is narrowed by `'check'` on Ks 8d 7c and the result by `'call'` on
  Ks 8d 7c 2d, Then the result is the 5 combos {AhKh, 9h9d, 6h5h, Th9h, Ac2c}, `classifyCombo(Ac2c, turn board)` is
  `'pair'` and `classifyCombo(QhJh, turn board)` is `'air'`.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#6 a flop check then a turn call re-classifies on the turn`

### SPEC-07: Opponents with different bot styles but identical actions get identical ranges
- Verifies: AC#7
- Behaviour: Given two 6-max sessions that differ only in seat 4's bot style (`'Maniac'` in one, `'Rock'` in the
  other), dealt from the same replay code, with every seat's actions supplied by one identical scripted policy (so the
  public actions match), When `estimateOpponentRanges` runs on the hero's flop and turn views in each, Then the two
  results are deep-equal, and the `recommend(view, ACTION_RANGE_ADVICE)` results are deep-equal. Also, no file under
  `src/advice/` imports from `src/bots/`, `src/table/` or `src/ui/` (checked by reading the import specifiers).
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#7 identical actions give identical ranges whatever the bot style`

### SPEC-08: Passing a bot style or style parameters into the advice engine is a type error
- Verifies: AC#8
- Behaviour: Given the acceptance test file, When `npm run typecheck` runs, Then each of these lines is marked
  `// @ts-expect-error` and the typecheck passes, so each one is a real error (an unused directive fails tsc):
  `recommend(view, { style: 'Maniac' })`; `recommend(view, stationOptions)` where `stationOptions:
  CallingStationOptions = { style: CALLING_STATION_STYLE }`; `recommendPostflop(view, { styleName: 'Rock' })`;
  `gradeView(view, 'call', { style: TAG_STYLE })`; `estimateOpponentRanges(view, 'Maniac')`. Control lines without the
  directive compile: `recommend(view)`, `recommend(view, ACTION_RANGE_ADVICE)`,
  `recommend(view, adviceOptions(stationOptions))`, `gradeView(view, 'call', { equity: spy })`. At runtime
  `adviceOptions({ ...stationOptions, random, equity: spy })` returns an object whose own keys are a subset of
  `['equity', 'chart', 'opponentRanges']`.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#8 a bot style passed into the advice engine fails the typecheck`

### SPEC-09: User-facing postflop advice uses action ranges; the rules doc says so
- Verifies: AC#9
- Behaviour: Given the TASK-7.3 flop spot (hero seat 3 `Ah 5h`, board `Kh 9h 2c`, limped pot, seat 2 bets 4), When
  `handleAdviceRequest({ id: 1, kind: 'recommend', view })` runs, Then its value deep-equals
  `recommend(view, ACTION_RANGE_ADVICE)`. With a spy equity, the `'actions'` path passes per-opponent ranges equal to
  `estimateOpponentRanges(view)` combos, none of length 1081. The `kind: 'grade'` value deep-equals
  `gradeView(view, 'call', ACTION_RANGE_ADVICE)`. `userReviewEntries(hand)` deep-equals
  `reviewEntries(hand, ACTION_RANGE_ADVICE)` for a recorded hand. `docs/advice/postflop-rules.md` contains no
  "1,081 combinations per opponent" sentence for user advice, links `range-model.md`, and no longer lists TASK-7.5
  under "Not applied yet". `docs/advice/range-model.md` contains the fixture board `Ks 8d 7c` and all seven line names.
- Verification: acceptance `tests/advice/range-model.acceptance.test.ts::AC#9 user advice and review use action ranges and the docs describe them`

### SPEC-10: Notation, lines and classifier edge cases
- Verifies: AC#1, AC#3
- Behaviour: `parseHandRange('TT+')` = {TT, JJ, QQ, KK, AA}; `'A9s+'` = {A9s, ATs, AJs, AQs, AKs}; `'KTo+'` = {KTo, KJo,
  KQo}; `'66-22'` = 5 pairs; `'K5s-K9s'` = 5 classes; `'AAs'`, `'KAs'`, `'XX'` and `''` throw. Lines: each table row
  in §5 has a case, plus a limp then call-raise (→ `call-raise`), an open then call of a 3-bet (→ `call-three-bet`),
  a 4-bet (→ `four-bet`), and a BB all-in on posting facing one raise (→ `call-raise`, A-4). Classifier: 9h 9d on
  Ks Kd 7c → strong (two pair above the board's one pair). Ah Qs on Ks Kd 8c 8h → air (plays the board). Th Jc on
  5s 6d 7c 8h 9s → draw, not strong (straight, same category as the board). As 4d on 2c 3h Kd → air (A234 is not
  open-ended). Jh Qd on Tc 9s 2h → draw (9-T-J-Q). Ah 3c on Kh 9h 2h → draw (4 hearts, one from the hole). Ac Qd on
  2h 5h 9h Kh → air (4 hearts all on the board).
- Verification: unit `tests/advice/ranges.test.ts::notation, lines and classifier edge cases`

### SPEC-11: Default-range content sanity
- Verifies: DoD#1, DoD#10
- Behaviour: For the shipped file: every justification is unique and ≥ 15 words. Width (combos ÷ 1326) lies inside the
  Q-2 band for its line (§11). For each position, width(four-bet) ≤ width(three-bet). Open-raise widths satisfy UTG ≤ HJ ≤
  CO ≤ BTN. Every four-bet class is in that position's three-bet range. The BB `check` range contains no class that
  is in the BB `open-raise` range.
- Verification: unit `tests/advice/ranges.test.ts::default range content sanity`

### SPEC-12: Actions mode is total and deterministic over random hands; fallbacks fire as specified
- Verifies: AC#9, DoD#2
- Behaviour: Over 60 fast-check runs (seed 7505) of random legal 6-max action sequences (folds allowed) stopped at a
  random postflop decision, `recommendPostflop(view, ACTION_RANGE_ADVICE)` never throws and returns a legal move with
  one-decimal percentages, and two calls are deep-equal. A spy equity that throws `RangeError` on its first call gets
  `start` ranges on its second call. One that throws twice gets 1081/1035/990-combo ranges on its third. A
  non-`RangeError` propagates. In a heads-up view (2 seats), the starts are every unseen combo and narrowing still
  applies. An opponent whose flop narrowing would be empty keeps the previous range.
- Verification: unit `tests/advice/postflop-ranges.test.ts::actions mode is total, deterministic and falls back`

### SPEC-13: Bots and default advice are unchanged
- Verifies: DoD#3, DoD#7
- Behaviour: For 200 postflop views from a seeded 6-max playtest, `recommend(view)` deep-equals
  `recommend(view, { opponentRanges: 'unseen' })`. Every locked test listed in doit/*/state.json passes unchanged.
  `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` prints
  `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc` and the output shows `Invariant violations: 0`.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-14: Actions-mode latency within target
- Verifies: DoD#3
- Behaviour: p95 of `recommendPostflop(view, ACTION_RANGE_ADVICE)` on the reference machine (`ADVICE_PERF_SCALE=1`,
  CI unset) is ≤ 25 ms for an HU-like 6-max flop facing a bet with one opponent, and ≤ 50 ms for a 6-max flop with
  3 opponents. `npm test` enforces 20× these. CI prints the numbers only (A-8).
- Verification: unit `tests/advice/postflop.perf.test.ts::actions-mode postflop advice latency within target times slack`

### SPEC-15: Checks, coverage and boundaries
- Verifies: DoD#2, DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` exit 0. Coverage ≥ 90% lines on `src/advice/**`,
  `src/bots/**` and `src/table/**`, and ≥ 70% overall. `src/advice/ranges.ts` imports only from `src/engine/` and
  `src/advice/`. The range JSON is a bundled module import (no fetch). `git grep -nE "fetch\(|XMLHttpRequest|
  WebSocket" src/advice` prints nothing.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-16: Non-applicable and process items
- Verifies: DoD#4, DoD#8, DoD#11, DoD#12, DoD#13
- Behaviour: DoD#4 N/A (the golden-spot suite arrives in TASK-7.14). DoD#8 N/A (no screen or dialog changes: Table.tsx
  only switches which review function it calls, and the existing e2e review flow still runs). DoD#13 N/A (no new
  screen). DoD#11: the CI workflow is green on `doit/TASK-7.5`. DoD#12: the story doc is published to Backlog.md.
- Verification: manual `gh run list --branch doit/TASK-7.5 --limit 1` shows success; `backlog doc list --plain` lists the TASK-7.5 story doc

## 7. Edge cases
- Empty narrowing: A-5, SPEC-12.
- Multiway card conflicts or no joint deal: A-6, SPEC-12.
- Non-6-max tables (heads-up, short-handed sit-and-go with busted seats): A-3, SPEC-12.
- All-in opponents: no more actions, so no more narrowing. All-in on a blind: A-4, SPEC-10.
- Several actions by one opponent on one street (check-raise, bet then call a raise): D-3, SPEC-10 and the unit test
  for aggregation.
- Board straights and flushes on the river, and paired boards: SPEC-10.
- Start range fully blocked by the hero and board cards (possible only for tiny ranges such as four-bet AA when the
  hero holds two aces and an ace is on the board): falls to every unseen combo (§5 step 2), unit-tested in SPEC-12.
- Invalid data file: SPEC-01 and the problem list in §5.
- Concurrency, permissions and interruption: N/A, as these are pure synchronous functions.

## 8. Security considerations
- Trust boundaries: the range JSON is bundled, authored data, validated at import with every problem listed. Views
  arrive over the worker boundary, where `handleAdviceRequest` already checks request shape (`advice-service.ts:56-60`).
  The range model only reads `view` fields that already exist.
- Hidden information: estimation reads only `PlayerView` (no hole cards of others, no style). REQ-035.3 is enforced by
  types (SPEC-08) and import boundaries (SPEC-07, SPEC-15).
- No authn/authz, secrets, logging of sensitive data, injection surfaces or new dependencies. No randomness is added:
  equity sampling stays seeded from the canonical input (`equity.ts:126-128`).

## 9. Non-functional
- Latency (SPEC-14). Measured on a prototype on this machine: `computeEquity` with a 1,081-combo HU flop range took
  6.0 ms, a 324-combo range 4.6 ms, and a 100-combo range 12.8 ms (it switches to exact enumeration: 100 × 990 × 2 ≤
  200,000). 3 opponents at 324 combos took 10.2 ms (12.4 ms unseen), and 5 opponents 18.7 ms (16.8 ms unseen).
  Classification adds ≤ 1,326 `evaluate` calls per opponent per street (well under 1 ms). User advice per decision
  stays at about 5-20 ms, inside the 25/50/100 ms targets of `postflop.perf.test.ts:48-73`. Bots and the playtest are
  untouched, so playtest throughput is unchanged.
- Test time: no single new unit test should take more than about 5 s. The SPEC-12 property uses 60 runs (the
  coverage test's 60 runs take a few seconds). No new slow-group test.
- Determinism: REQ-036.1 holds because estimation is a pure function of the view and the fallback order is fixed
  (SPEC-12).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`, then play a 6-max cash hand to the flop and finish it, and open the review (its postflop grades now use action ranges). Library check: `npx vitest run tests/advice/range-model.acceptance.test.ts tests/advice/ranges.test.ts tests/advice/postflop-ranges.test.ts`
- New tests (path → SPEC ids):
  - `tests/advice/range-model.acceptance.test.ts` → SPEC-01 to SPEC-09 (locked after the first green build)
  - `tests/advice/ranges.test.ts` → SPEC-10, SPEC-11 (plus street-aggregation and expansion units)
  - `tests/advice/postflop-ranges.test.ts` → SPEC-12, the first half of SPEC-13
  - `tests/advice/postflop.perf.test.ts` → SPEC-14
  - `tests/table/advice-service.test.ts`, `tests/table/review.test.ts` → the SPEC-09 wiring at unit level
- End-to-end scenario for the Judge:
  1. Run the full locked-test list unchanged: `npm test`.
  2. Check the playtest SHA (SPEC-13).
  3. In `npx vitest run tests/advice/range-model.acceptance.test.ts`, confirm the fixture outputs.
  4. Read `docs/advice/range-model.md` and five random justifications in `six-max.json` for originality and plain
     English (DoD#1/#10).

## 11. Open questions
None. Resolved in `doit/TASK-7.5/qa.md` (autopilot, 2026-11-22):
- Q-1 → (A): only the user's advice (hint requests, review grades) uses `ACTION_RANGE_ADVICE`. Bots and the default
  `recommend(view)` stay on every-unseen-combo ranges, there are no locked-test edits, and the playtest SHA is
  unchanged (D-1). The follow-up "switch bots to action ranges" is created at the docs step.
- Q-2 → 36 original 6-max ranges with the 7 lines and the width bands in SPEC-11 (D-2). The bands are: open-raise
  UTG 10-18, HJ 12-22, CO 16-28, BTN 22-40, SB 18-35, BB 8-20. Limp UTG/HJ/CO 5-22, BTN 5-30, SB 20-60. Check (BB)
  60-95. Call-raise UTG-BTN 6-25, SB 8-30, BB 25-60. Three-bet 3-12. Call-three-bet 5-25. Four-bet 1.5-6 (all % of
  1,326 combos).
- Q-3 → the classifier and street aggregation exactly as in §5 and D-3 (most aggressive action per street).

## 12. Clarifications log
See `doit/TASK-7.5/qa.md`.
