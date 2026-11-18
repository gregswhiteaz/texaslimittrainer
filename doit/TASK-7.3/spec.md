# Spec: TASK-7.3 — Recommend call or fold after the flop from equity and pot odds

Status: READY (approved 2026-11-18 by user via Q-1/Q-2)
Task: TASK-7.3 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-025.2, REQ-033.1, REQ-033.4, REQ-033.5 (REQ-033.2 value bets is TASK-7.8; REQ-033.3/033.7 implied odds is TASK-7.9; REQ-035 ranges is TASK-7.5/7.13) · Dream: limit-holdem-trainer

## 1. Summary
This task adds postflop advice. A new function, `recommendPostflop(view)`, accepts only a `PlayerView` on the flop,
turn or river. It computes the hero's equity (pot share) against every opponent still in the hand, each holding any
unseen two-card combination, and the required equity = call amount ÷ pot after calling. It then applies three
documented rules: check when nothing is owed, call when equity ≥ required equity, otherwise fold. Each result returns
the action, the legal `move`, equity % and required equity % (one decimal) and the id of the rule that fired. The
rules live in one design document, and a consistency test ties the document's rule ids to the engine and to the unit
tests. The result shape is aligned with `recommendPreflop` so the TAG bot (TASK-6.1), hints (E08) and the grader
(TASK-7.4) can consume both.

## 2. Scope
- In scope:
  - `src/advice/postflop.ts`: `recommendPostflop`, the rule ids, pot and call-amount calculation, the opponent
    "every unseen combo" ranges, percentage rounding.
  - `src/advice/recommend.ts`: the `Recommendation` union and a `recommend(view)` dispatcher by street — shipped now (approved, Q-1 in `doit/TASK-7.3/qa.md`).
  - `docs/advice/postflop-rules.md`: the postflop rules design document (REQ-033.4), with each rule's id, condition,
    outcome, worked example and justification.
  - Acceptance, unit and latency tests under `tests/advice/`.
- Not doing:
  - Bet or raise recommendations of any kind, including value bets (TASK-7.8, REQ-033.2) and the "range that would
    call" (REQ-033.6). In this slice `raise` and `bet` are never recommended.
  - Implied odds and outs (TASK-7.9, REQ-033.3/033.7). Required equity is immediate pot odds only.
  - Opponent range estimation or narrowing by actions or observed stats (TASK-7.5, TASK-7.13). Every opponent holds
    any unseen combination, equally likely.
  - Side pots and short all-in calls (TASK-1.9, TASK-1.10, TASK-7.17). The engine has one pot and stacks of at least
    8 small bets + 8 big bets (`src/engine/hand.ts:151`), so a full call is always legal.
  - Explanations (TASK-7.10), grading (TASK-7.4), golden spots (TASK-7.14), "approximate" labels (TASK-7.16), the TAG
    bot (TASK-6.1), running advice off the main thread (REQ-055.6, UI tasks), the playtest `--check-advice` option
    (TASK-7.15).
  - Any change to `src/engine/`, `src/advice/equity.ts`, `src/advice/preflop.ts`, `src/ui/`, `e2e/` or the toolchain.
    No new dependency.
- Scope budget: files=6, lines=900   (postflop.ts ~130, recommend.ts ~30, postflop-rules.md ~90, postflop.acceptance.test.ts ~300, postflop.test.ts ~270, postflop.perf.test.ts ~80)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Module `src/advice/postflop.ts`; tests in `tests/advice/` named `postflop.*.test.ts`. | yes | Same one-module-per-concern layout as `equity.ts` and `preflop.ts`. | Put the rules in `preflop.ts` or a new `advice/index.ts` |
| A-2 | The design document is a repo file `docs/advice/postflop-rules.md` (not a Backlog doc), so the consistency test can read it from disk. Each rule is a heading `### Rule \`<id>\`` and the test extracts ids with `/^### Rule `([a-z][a-z0-9-]*)`$/gm`. | yes | Backlog docs are edited only through the CLI and live outside the test tree. A fixed heading form makes the parse exact. | Backlog doc read by path; a JSON rule table |
| A-3 | "Opponents" = every dealt-in player other than the hero with `folded === false` (all-in players included). Each gets the same range: every two-card combo containing no hero or board card, ascending `[low, high]`, in ascending order (1,081 combos on the flop, 1,035 on the turn, 990 on the river). | yes | The story says "every unseen two-card combination". Cards shown at earlier showdowns belong to earlier hands with a fresh deck, so they are not dead. | Pass all 1,326 combos and let `computeEquity` drop dead ones (same canonical result, `equity.ts:99-107`) |
| A-4 | Percentages round half up to one decimal: `toPct(x) = Math.round(x * 1000 + 1e-9) / 10`. Required equity is computed from the integer amounts as `toPct(call / (pot + call))`. | yes | The `1e-9` nudge makes values such as 0.1665 round to 16.7 despite binary floating point. | `toFixed(1)` strings; banker's rounding |
| A-5 | Pot = sum of `view.pots[].amount` + sum of every player's `streetContribution` (chips from completed streets plus the current street, `hand.ts:35,89`). Call amount = the `amount` of the `call` action in `view.legalActions` (`hand.ts:227-229`). | yes | Matches AC#1 ("pot of $20 including that bet"). With one pot it equals the sum of `totalContribution`. | Sum `totalContribution` |
| A-6 | `recommendPostflop` throws `RangeError` for a view whose street is `preflop` or `showdown` and for a seat that is not to act, and `Error` when the needed legal action is missing — same convention and messages style as `recommendPreflop` (`preflop.ts:79-80,99`). | yes | Consistent API errors across advice functions. | Return an error field |
| A-7 | Equity is computed for every postflop decision, including the free-check case. | yes | AC#3 asks for equity % on any postflop decision; the value-bet rule (TASK-7.8) will need it in exactly that case. | Skip equity when checking (faster) |
| A-8 | The latency test follows `equity.perf.test.ts`: real targets on the reference machine via `ADVICE_PERF_SCALE=1`, a 20× slack in `npm test`, no enforcement when `CI=true` (`tests/support/speed.ts`). | yes | Same precedent as TASK-7.1 A-8 and TASK-1.20. | No timing test |

## 3. Current system
- TypeScript strict, ESM, Vitest 5 with v8 coverage (`package.json` scripts; `vite.config.ts:6-17`, coverage
  ≥ 90% lines for `src/{engine,bots,advice,stats}/**`, `testTimeout: 30_000`). ESLint + Prettier
  (`npm run lint` = `eslint . --max-warnings 0 && prettier --check .`, so the new Markdown doc must be Prettier-clean;
  `.prettierignore` does not exclude `docs/`).
- `src/engine/player-view.ts:36-61` — `PlayerView` (seat, holeCards, stakes, street, board, players with
  `folded`/`streetContribution`, pots, currentBet, betCount, toAct, actions, legalActions).
- `src/engine/hand.ts:26` — `Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'`; `:49-51` — `Action` (call
  amount = chips added); `:217-238` — `legalActions`: facing a bet gives fold, call (amount = owed), raise; nothing
  owed gives check (+ bet or raise). `:338-349` — deck layout: hole cards at `deck[0..2n-1]` (seat `dealOrder[i]`
  gets `deck[i]` and `deck[i+n]`, `:176`), flop burn at `2n` and flop `2n+1..2n+3`, turn burn `2n+4`, turn `2n+5`,
  river burn `2n+6`, river `2n+7`.
- `src/advice/equity.ts:331-345` — `computeEquity({hero, board, opponents})`: exact when the estimate ≤ 200,000
  evaluations, else 30,000 sampled trials seeded only from the canonical input (`:131-133`), so the same view gives the
  same numbers. Dead and duplicate combos are dropped (`:99-107`). `hero.equity` is the pot share 0..1 (`:24`).
- `src/advice/preflop.ts:22-42,75-113` — `PreflopRecommendation` (`basis: 'chart'`, `action`, `alternative`,
  `borderline`, `move`, …) and `recommendPreflop(view, {chart?})` (user-approved TASK-7.2 Q-3, doc-14).
- `tests/advice/preflop.acceptance.test.ts:21-80` — the scripted-deal pattern for building views (button 1, $2/$4
  blinds, $4/$8 bets, `DEAL_ORDER` 2,3,4,5,6,1, step tuples) and the hidden-card permutation property (TASK-7.2
  SPEC-05).
- `tests/advice/equity.perf.test.ts:1-75` — latency test pattern; measured p95 of full-ring flop vs 9 every-combo
  ranges = 70.8 ms, HU flop vs every combo = 4.9 ms (doc-8).
- `tests/toolchain/boundary.*` — enforces that advice imports no UI code (DoD#5).
- Existing code to reuse:
  - `src/advice/equity.ts` → `computeEquity`, `EquityInput`, `EquityResult`, `HoleCards`, `Range` (no new equity code).
  - `src/advice/preflop.ts` → `recommendPreflop`, `PreflopRecommendation`, `PreflopOptions` for the dispatcher.
  - `src/engine/player-view.ts` → `PlayerView`, `playerView` (tests), `PublicPlayer`.
  - `src/engine/hand.ts` → `createHand`, `applyAction`, `Action` (tests build real decision points).
  - `src/engine/cards.ts` → `parseCards`, `formatCard` (tests).
  - `tests/support/speed.ts` → `speedLimitsEnforced`, `SPEED_LIMITS_NOT_ENFORCED`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Postflop result shape and entry points: `recommendPostflop(view, { equity? })` → `PostflopRecommendation` as in §5 "Components", plus `recommend.ts` (union by `basis`, dispatcher by street) shipped now. | (b) `recommendPostflop` only, union/dispatcher deferred to TASK-6.1; (c) one shared `Recommendation` interface with optional fields instead of a discriminated union | Public interface consumed by TASK-6.1, TASK-7.4, TASK-7.10, TASK-7.15 and E08. | yes | user (Q-1, qa.md: Approve + recommend() now) |
| D-2 | Rules, rule ids and the comparison basis: rules in order `check-free`, `pot-odds-call`, `pot-odds-fold`; compare the one-decimal rounded equity % with required %, tie → call (§5 "Rules"). | Compare unrounded values; one `pot-odds` id with two outcomes; different id names | User-visible strategy: what is recommended on a near-tie, and what the grader (REQ-038.3 margins) and hints show. | yes | user (Q-2, qa.md: Rounded, ties call) |
| D-3 | Opponent holdings = every unseen combo for each live opponent (A-3); multiway equity is the hero's pot share against all live opponents at once, one range per opponent. | Heads-up equity against each opponent separately | Settled by the story text and REQ-033 ("against each opponent's estimated range"); `computeEquity` takes one range per opponent (`equity.ts:15-16`). | no | n/a (task text) |
| D-4 | Required equity = immediate pot odds `call ÷ (pot + call)`; 0 when nothing is owed. | Implied odds | Settled by REQ-033.1 and AC#1/AC#4; implied odds is TASK-7.9. | no | n/a (REQ-033.1) |
| D-5 | Determinism needs no extra seeding: the equity input is a pure function of the hero's cards, the board and the number of live opponents, and `computeEquity` seeds from its canonical input. | Seed from a hash of the whole view | Same view → same input → same seed (`equity.ts:131-133`). Hashing the view would make equal spots with different action histories give different samples. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/postflop.ts` — new: types, `POSTFLOP_RULE_IDS`, `recommendPostflop`, `toPct`.
- `src/advice/recommend.ts` — new: `Recommendation` union, `RecommendOptions`, `recommend(view, options?)` (Q-1).
- `docs/advice/postflop-rules.md` — new: the postflop rules design document.
- `tests/advice/postflop.acceptance.test.ts` — new: AC#1–AC#6 (locked).
- `tests/advice/postflop.test.ts` — new: one `describe('rule <id>')` per rule, inputs/edge cases, errors, dispatcher.
- `tests/advice/postflop.perf.test.ts` — new: latency (§9).

### Components, interfaces and data
Approved by the user (Q-1, qa.md):

```ts
// src/advice/postflop.ts
export type PostflopAdvice = 'fold' | 'check' | 'call';
export const POSTFLOP_RULE_IDS = ['check-free', 'pot-odds-call', 'pot-odds-fold'] as const;
export type PostflopRuleId = (typeof POSTFLOP_RULE_IDS)[number];

export interface PostflopRecommendation {
  readonly basis: 'equity';
  readonly street: 'flop' | 'turn' | 'river';
  /** Legal for the view. */
  readonly action: PostflopAdvice;
  /** Always null in this slice (no acceptable alternatives postflop yet). */
  readonly alternative: PostflopAdvice | null;
  /** The element of view.legalActions whose type is `action`. */
  readonly move: Action;
  readonly ruleId: PostflopRuleId;
  /** Hero pot share against all live opponents, percent, one decimal (0..100). */
  readonly equityPct: number;
  /** call ÷ (pot + call) as a percent, one decimal; 0 when nothing is owed. */
  readonly requiredEquityPct: number;
  /** Chips the hero must add to call; 0 when nothing is owed. */
  readonly callAmount: number;
  /** Chips in the middle before the hero acts (all pots + all street contributions). */
  readonly pot: number;
  /** Live opponents the equity was computed against (1..9). */
  readonly opponents: number;
  readonly equityMethod: 'exact' | 'sampled';
}

export interface PostflopOptions {
  /** Default computeEquity. Test seam and future range models; must be deterministic. */
  readonly equity?: (input: EquityInput) => EquityResult;
}

export function recommendPostflop(view: PlayerView, options?: PostflopOptions): PostflopRecommendation;
/** Percent with one decimal, half up: Math.round(fraction * 1000 + 1e-9) / 10. */
export function toPct(fraction: number): number;

// src/advice/recommend.ts
export type Recommendation = PreflopRecommendation | PostflopRecommendation; // discriminated by `basis`
export type RecommendOptions = PreflopOptions & PostflopOptions;
/** Preflop views → recommendPreflop; flop/turn/river → recommendPostflop. Errors propagate. */
export function recommend(view: PlayerView, options?: RecommendOptions): Recommendation;
```

Common core of both shapes: `basis`, `action`, `alternative`, `move`. The grader (TASK-7.4) reads `equityPct` and
`requiredEquityPct`; TASK-7.8 will add `equityVsCallingRangePct` and the `bet`/`raise` advice values.

### Rules and algorithms
`recommendPostflop(view, options)`:
1. Validate: `view.street` ∈ {flop, turn, river} else `RangeError('Postflop advice needs a flop, turn or river view,
   got <street>')`; `view.toAct === view.seat` else `RangeError('Seat <seat> is not to act')`.
2. `hero = players.find(seat)`; `owed = view.currentBet - hero.streetContribution`;
   `pot = Σ pots.amount + Σ players.streetContribution`.
3. `callAmount = owed > 0 ? (legal call action).amount : 0`; if `owed > 0` and no legal call exists, throw
   `Error('No legal call for seat <seat>')`.
4. Opponent range (A-3): every combo `[a, b]`, `a < b`, with neither card in `holeCards ∪ board`, ascending. One copy
   per live opponent. Call `(options.equity ?? computeEquity)({ hero: holeCards, board, opponents })`.
5. `equityPct = toPct(result.hero.equity)`; `requiredEquityPct = owed > 0 ? toPct(callAmount / (pot + callAmount)) : 0`.
6. Rules, first match wins (approved, Q-2 in qa.md; comparison on the rounded one-decimal values):
   - `check-free` — `owed === 0` → `check`. (Fold is never recommended when check is free, REQ-017.1.)
   - `pot-odds-call` — `owed > 0` and `equityPct >= requiredEquityPct` → `call`.
   - `pot-odds-fold` — `owed > 0` and `equityPct < requiredEquityPct` → `fold`.
7. `move` = the element of `view.legalActions` whose type is `action` (else `Error('No legal <action> for seat
   <seat>')`); `alternative = null`.

Worked examples (6-max, button 1, $2/$4 blinds, $4/$8 bets, stacks 160; preflop 4 fold, 5 fold, 6 call 4, 1 call 4,
2 call 2, 3 check → pot 16, live seats 2, 3, 6, 1):
- Flop: seat 2 bets 4; hero seat 3 owes 4, pot 20 → required 4 / 24 = 0.16667 → 16.7%. Equity 0.16667 → 16.7% →
  `pot-odds-call`. Equity 0.16567 (0.1 points below) → 16.6% → `pot-odds-fold`.
- Flop: seat 2 checks; hero seat 3 owes 0 → `check-free`, required 0, pot 16, `move = {seat: 3, type: 'check'}`.

### Error handling and configuration
- Errors: the three messages in step 1/3/7 above; `computeEquity`'s own `RangeError`s propagate (cannot occur for a
  valid engine view: 1–9 opponents, unseen combos always dealable).
- No configuration; `options.equity` defaults to `computeEquity`.

## 6. Behaviour specification

### SPEC-01: Equity equal to required equity recommends call
- Verifies: AC#1, AC#3, DoD#1
- Behaviour: Given the worked-example flop decision (seat 2 bets 4, hero seat 3 owes 4, pot 20) and an injected
  `equity` returning hero equity 4/24, When `recommendPostflop(playerView(state, 3), { equity })` runs, Then `action`
  is `call`, `ruleId` is `pot-odds-call`, `equityPct` is 16.7, `requiredEquityPct` is 16.7, `callAmount` 4, `pot` 20,
  `opponents` 3, `basis` `equity`, `street` `flop`, `alternative` null and `move` deep-equals
  `{seat: 3, type: 'call', amount: 4}`. The injected function was called once with `hero` = hero's cards, `board` =
  the 3 flop cards and 3 opponent ranges of 1,081 combos each, none containing a hero or board card.
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#1 equity equal to required equity recommends call`

### SPEC-02: Equity 0.1 points below required equity recommends fold
- Verifies: AC#2, DoD#1
- Behaviour: Given the same decision and an injected hero equity of 4/24 − 0.001, When advice runs, Then `action` is
  `fold`, `ruleId` `pot-odds-fold`, `equityPct` 16.6, `requiredEquityPct` 16.7 and `move` is `{seat: 3, type: 'fold'}`.
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#2 equity 0.1 points below required recommends fold`

### SPEC-03: Every postflop decision returns action, both percentages and a rule id
- Verifies: AC#3, DoD#1
- Behaviour: Given a fast-check property (`numRuns: 40`, fixed fast-check seed) over random 52-card decks and random
  legal non-fold action choices for a 6-max $4/$8 hand, played with the real engine until the first decision on the
  flop, turn or river (runs whose hand ends first are discarded via `fc.pre`), When `recommendPostflop` runs with the
  real `computeEquity`, Then `action` ∈ {fold, check, call}, `move` is an element of `view.legalActions` with
  `type === action`, `ruleId` ∈ `POSTFLOP_RULE_IDS`, `equityPct` and `requiredEquityPct` are in [0, 100] and each
  equals `Math.round(value * 10) / 10`, and `requiredEquityPct` equals `toPct(callAmount / (pot + callAmount))`
  when `callAmount > 0`.
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#3 any postflop decision returns action, equity %, required equity % and rule id`

### SPEC-04: No bet to face recommends check with 0% required equity
- Verifies: AC#4, DoD#1
- Behaviour: Given the worked-example flop where seat 2 checks to hero seat 3, When advice runs with the real
  `computeEquity`, Then `action` is `check`, `ruleId` `check-free`, `requiredEquityPct` 0, `callAmount` 0, `pot` 16,
  `equityPct` is in (0, 100), and `move` is `{seat: 3, type: 'check'}`. With an injected equity of 0.01 (a hand that
  would fold to any bet), Then `action` is still `check` (never fold when check is free).
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#4 no bet to face recommends check with 0% required equity`

### SPEC-05: The rules document, the engine and the unit tests agree
- Verifies: AC#5, DoD#1
- Behaviour: Given `docs/advice/postflop-rules.md` and `tests/advice/postflop.test.ts`, When the consistency check
  runs, Then the set of ids from `### Rule \`<id>\`` headings equals the set `POSTFLOP_RULE_IDS`, and every id has a
  `describe('rule <id>'` block in the unit test file. The check is a pure helper in the test file,
  `ruleProblems(docText, unitTestText, engineIds): string[]`; the test also asserts it reports
  `Rule <id> has no unit test` for a doc id removed from the test text, `Rule <id> is returned by the engine but not
  documented` for an engine id missing from the doc, and `Rule <id> is documented but not returned by the engine` for
  an extra doc id.
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#5 every documented rule has a unit test and every engine rule is documented`

### SPEC-06: Hidden cards never change the recommendation or the numbers
- Verifies: AC#6, DoD#1
- Behaviour: Given the worked-example decision on the flop (facing a bet) and on the turn (all four live players check the
  flop, seat 2 bets 8 on the turn: hero owes 8, pot 24, required 8 / 32 = 25.0%), and a fast-check property (`numRuns: 20`)
  that permutes every deck position except the hero's two hole-card positions and the board positions (other hole
  cards, burns and undealt cards change), When `recommendPostflop` runs with the real `computeEquity` on the hero's
  view, Then the result `toStrictEqual`s the result for the unpermuted deck. Control: changing the hero's own hole
  cards changes `equityPct`.
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#6 other players' and undealt cards never change advice or numbers`

### SPEC-07: Each rule fires on exactly its condition
- Verifies: AC#1, AC#2, AC#4, AC#5
- Behaviour: Given hand-built views and injected equity, Then: `describe('rule check-free')` — nothing owed gives
  `check` for equity 0, 0.5 and 1; `describe('rule pot-odds-call')` — owed 4 into pot 20 with equity 0.1667, 0.5 and
  1 gives `call`, and owed 8 into pot 24 (25.0%) with equity 0.25 gives `call`; `describe('rule pot-odds-fold')` —
  the same spots with equity 0.1656 and 0.2449 give `fold`, and equity 0 gives `fold`. `toPct` examples: 4/24 → 16.7,
  0.1665 → 16.7, 0.16649 → 16.6, 0 → 0, 1 → 100, 0.5 → 50.
- Verification: unit `tests/advice/postflop.test.ts::rule check-free / rule pot-odds-call / rule pot-odds-fold`

### SPEC-08: Opponent ranges, pot and call amount
- Verifies: AC#3, AC#6
- Behaviour: Given the worked example with an injected spy: on the flop the 3 ranges have 1,081 combos, on the turn
  1,035 and on the river 990, ascending `[low, high]`, excluding hero and board cards; folded players are not
  opponents (after seat 6 folds to a flop bet, the river decision has `opponents` 2); `pot` equals Σ pots + Σ street
  contributions; a heads-up river decision with the real `computeEquity` reports `equityMethod` `exact`. Calling
  advice twice on the same view returns `toStrictEqual` results.
- Verification: unit `tests/advice/postflop.test.ts::builds opponent ranges, pot and call amount from the view`

### SPEC-09: API errors and the unified entry point
- Verifies: AC#3
- Behaviour: Given a preflop view, a view whose `toAct` is another seat, a showdown-street view, and a facing-bet view
  whose `legalActions` lacks `call`, Then `recommendPostflop` throws exactly the §5 messages. `recommend(view)` returns
  a result with `basis: 'chart'` that `toStrictEqual`s `recommendPreflop(view)` for a preflop view, and `basis:
  'equity'` equal to `recommendPostflop(view)` for a flop view (Q-1).
- Verification: unit `tests/advice/postflop.test.ts::rejects bad views and dispatches by street`

### SPEC-10: Advice is fast enough for bots and hints
- Verifies: DoD#1
- Behaviour: Given scenarios HU flop facing a bet, 6-max flop with 3 opponents (worked example), and 10-seat flop with
  9 live opponents facing a bet, When each is advised 20 times, Then p95 ≤ 25 ms, 50 ms and 100 ms respectively on the
  reference machine (`ADVICE_PERF_SCALE=1`), ≤ 20× those in local `npm test`, printed but not enforced when `CI=true`.
- Verification: unit `tests/advice/postflop.perf.test.ts::postflop advice latency within target times slack`

### SPEC-11: All checks pass, coverage holds, advice stays headless and offline
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When the command runs, Then each step exits 0, no `ERROR: Coverage` line
  appears, `src/advice/postflop.ts` and `src/advice/recommend.ts` show ≥ 90% lines, and the grep prints nothing (no
  network or dynamic-import code, only relative imports in `src/advice`).
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -rnE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]" src/advice`

### SPEC-12: A 10,000-hand playtest still reports zero invariant violations
- Verifies: DoD#6
- Behaviour: Given the playtest runner (TASK-1.6/1.8), When it runs, Then it exits 0 and reports zero invariant
  violations. (Advice is not yet wired into playtest seats; this guards that nothing in the engine changed.)
- Verification: command `npm run playtest -- --hands 10000 --seed 42`

### SPEC-13: The rules document is original and justifies each rule
- Verifies: DoD#9, AC#5
- Behaviour: Given `docs/advice/postflop-rules.md`, When a reviewer reads it, Then it states the inputs (live
  opponents, every-unseen-combo ranges, pot and call definitions, rounding), lists each rule with id, condition,
  outcome, the AC#1 worked example and a plain-English justification written for this project, names the later rules
  (value bet TASK-7.8, implied odds TASK-7.9, range model TASK-7.5) as not yet applied, and quotes no book or tool.
- Verification: manual review of `docs/advice/postflop-rules.md`

### SPEC-14: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: Given the user has pushed branch `doit/TASK-7.3`, When the latest CI run for it completes, Then its
  conclusion is `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-7.3 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-15: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#7, DoD#11, DoD#12
- Behaviour: Given this task, Then DoD#3 does not apply (golden-spot suites are TASK-7.11/TASK-7.14, both To Do);
  DoD#7 and DoD#12 do not apply (no screen or dialog: `git diff --stat main` shows no file under `src/ui/`, `e2e/` or
  `index.html`). DoD#11: the TASK-7.3 story document is published with `backlog doc` and shows in
  `backlog doc list --plain`.
- Verification: manual check of `git diff --stat main` and `backlog doc list --plain | grep "TASK-7.3"`

## 7. Edge cases
- Exact tie of the rounded numbers → call (SPEC-01, SPEC-07); 0.1 below → fold (SPEC-02).
- Nothing owed (first to act, or checked to) → check, never fold (SPEC-04, SPEC-07).
- Multiway: 1 to 9 live opponents, folded players excluded (SPEC-08, SPEC-10).
- Flop, turn and river; river heads-up is exact enumeration (SPEC-08). Capped street: irrelevant, call is always
  legal and raise is never recommended.
- Preflop, showdown, not-to-act views and a missing legal action (SPEC-09).
- Short all-in calls and side pots: N/A until TASK-1.9/1.10 (min stack, `hand.ts:151`; one pot, `hand.ts:89`).
- Equity 0 or 1 (SPEC-07); rounding boundaries (SPEC-07 `toPct`).
- Hidden-card changes and repeat calls (SPEC-06, SPEC-08).

## 8. Security considerations
- Trust boundary: the only input is a `PlayerView` built by the engine; the type admits no hidden cards (REQ-025,
  TASK-1.5). No new untrusted input.
- Randomness: sampling uses the existing seeded xoshiro128** from `computeEquity` for reproducibility; fairness does
  not depend on it (advice, not dealing), so no CSPRNG is needed.
- Bounded work: each call does one `computeEquity` call, whose work is capped (exact ≤ 200,000 evaluations, sampled
  30,000 trials with a rejection cap; doc-8 A-14).
- No secrets, logging, network, or new dependencies.

## 9. Non-functional
- Latency (SPEC-10): p95 ≤ 100 ms worst case (10 seats, 9 live opponents, flop) to meet the bot budget REQ-055.3;
  ≤ 50 ms 6-max with 3 opponents; ≤ 25 ms heads-up. Well inside the 1 s hint budget (REQ-055.1). Headroom on the
  worst case is thin (equity alone measured 70.8 ms, doc-8), which TASK-7.18 addresses.
- Determinism: identical views give identical results (SPEC-06, SPEC-08; REQ-036.1).
- Coverage: ≥ 90% lines for the new modules (SPEC-11).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — library only, with no user-facing entry point until the TAG bot (TASK-6.1) and hint card (E08); the Judge exercises it with `npx vitest run tests/advice/postflop.acceptance.test.ts tests/advice/postflop.test.ts`
- New tests (path → SPEC ids):
  - `tests/advice/postflop.acceptance.test.ts` → SPEC-01 to SPEC-06 (locked; scripted-deal helpers and `ruleProblems` live inside this file)
  - `tests/advice/postflop.test.ts` → SPEC-07, SPEC-08, SPEC-09
  - `tests/advice/postflop.perf.test.ts` → SPEC-10
- End-to-end scenario for the Judge (as a developer consuming the advice library):
  1. `npm run lint && npm run typecheck && npm test` exits 0; `npm run playtest -- --hands 10000 --seed 42` exits 0.
  2. In a scratch test, build the worked-example flop (seat 2 bets 4 into 16) with hero `Ah 5h` on `Kh 9h 2c` and
     read `recommendPostflop` — a flush draw against 3 random hands should show equity well above 16.7% and `call`;
     with hero `7c 3d` it should show a low equity and `fold`.
  3. Mutation probes (revert after each): change `>=` to `>` (SPEC-01 must fail); drop the `owed === 0` rule (SPEC-04
     must fail); add a fourth id to `POSTFLOP_RULE_IDS` (SPEC-05 must fail); include folded players as opponents
     (SPEC-08 must fail).
  4. Read `docs/advice/postflop-rules.md` (SPEC-13) and run the SPEC-14/15 checks.

## 11. Open questions
None. Q-1 and Q-2 are answered in `doit/TASK-7.3/qa.md` (recommended options) and folded into D-1 and D-2.

### Follow-ups (become tasks)
- Count short all-in calls and side pots in postflop pot odds once TASK-1.9/TASK-1.10 exist (owner TASK-7.17).
- Wire `recommend(view)` into the TAG bot and playtest seats (TASK-6.1).
- Add `equityVsCallingRangePct` and bet/raise outcomes to `PostflopRecommendation` with the value rule (TASK-7.8).
- Replace every-unseen-combo ranges with the range model via `options.equity`/range input (TASK-7.5).
- Restore headroom on the 9-opponent flop advice latency (track under TASK-7.18).

## 12. Clarifications log
See `doit/TASK-7.3/qa.md`.
