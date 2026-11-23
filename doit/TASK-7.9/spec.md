# Spec: TASK-7.9 — Count implied odds for drawing hands

Status: READY (approved 2026-11-23)
Task: TASK-7.9 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-033 (033.3, 033.4, 033.5, 033.7; 033.1 unchanged), REQ-056.1 · Dream: limit-holdem-trainer

## 1. Summary
Postflop advice today folds a draw whenever its equity is below the pot-odds price (`src/advice/postflop.ts:140-146`).
This task adds the implied-odds rule (REQ-033.3/033.7): when the hero holds a flush draw or an open-ended straight draw
with a card still to come, the price also counts one big bet per opponent still in the hand, and a call that the
plain pot odds reject but the implied price accepts is recommended with rule id `implied-odds-call`. Every postflop
recommendation names the outs it counted (`outs`, empty on the river or without a draw) and the implied price
(`impliedRequiredEquityPct`, `null` where the rule can't apply). Bots go through the same advice, so they call a few
more draws: the default 10,000-hand playtest output changes (new SHA measured below); style bands stay inside.

## 2. Scope
- In scope:
  - `src/advice/ranges.ts`: exported `drawOuts(hole, board)` next to the private `hasFlushDraw`/`hasOpenEnder`
    (`src/advice/ranges.ts:304-327`), sharing their definitions.
  - `src/advice/postflop.ts`: rule id `implied-odds-call` (between `pot-odds-call` and `pot-odds-fold`), fields
    `impliedRequiredEquityPct: number | null` and `outs: readonly Card[]` on `PostflopRecommendation`.
  - `docs/advice/postflop-rules.md`: definitions (draw, outs, implied required equity), the new rule with the AC#1
    worked example and a "Why", the `pot-odds-fold` condition updated, "Not applied yet" no longer listing implied odds.
  - Tests: new locked acceptance file, unit tests, the two locked re-pins in §5 (Q-3) and one unlocked re-pin.
  - Measurements in the build log: new default playtest SHA, one 100,000-hand style-bands seed.
- Not doing:
  - User-visible text naming the outs in hints or review (TASK-7.10 "Explain every recommendation in plain English"
    owns wording); no UI, screen or e2e change.
  - Gutshots, double gutshots, backdoor draws, overcards, or discounting "dirty" outs (task text: not removed in this
    rule) (Q-2).
  - Implied odds for bets/raises (semi-bluffs) or on free checks; reverse implied odds.
  - Changing `requiredEquityPct` (stays the REQ-033.1 pot-odds price) or any grading rule (`src/advice/grade.ts`
    untouched; a fold against implied-odds advice grades by the existing call/fold margin, possibly negative → minor).
  - Bot changes, budgets or time limits; golden spots (TASK-7.14).
- Scope budget: files=10, lines=600

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Pot after calling" = `pot + callAmount` where `pot` already includes the bet faced (the existing `pot` field, `src/advice/postflop.ts:92-94`). AC#1: 28+8 = 36 → 8/36 = 22.2%, implied 8/(36+8) = 18.2%. AC#3: 12+8 = 20 → 40.0%, implied 8/28 = 28.6%. AC#4: 36+8 = 44 → implied 8/(44+16) = 13.3%. All six pot-odds/implied numbers agree with the task text and REQ-033.7 (the AC#1 *equity* does not — see D-6/Q-4). | yes | Same definition as REQ-033.1 and the rules doc "Required equity". | — |
| A-2 | "Opponents still in the hand" for the allowance = live opponents (not folded) who are not all in; an all-in opponent can't put in a later big bet. If none remain, the rule doesn't apply (`impliedRequiredEquityPct` null). | yes | The extra bet stands for chips won later; an all-in player has none to give. Every AC spot has no all-in player, so the numbers are unchanged. | Count every live opponent (the `opponents` field) |
| A-3 | The rule doesn't apply when the hero's call leaves the hero with no chips (`hero.stack - callAmount === 0`). | yes | An all-in hero can't win later bets. | Apply regardless |
| A-4 | The big bet is `view.stakes.bigBet` on every street (flop included). | yes | Limit: turn/river bets are big bets, which is where a hit draw gets paid. | Current street's bet size |
| A-5 | `outs` is listed whenever the hero holds a counted draw on the flop or turn, whatever the action (also on free checks and when another rule fires); `[]` on the river or without a draw. `impliedRequiredEquityPct` is non-null only when the rule can apply: owed > 0, outs non-empty, A-2 payers ≥ 1, A-3 chips behind. | yes | AC#3 lists outs on a fold; one pure definition is simplest for TASK-7.10. | Outs only on implied-odds recs |
| A-6 | The rule compares rounded numbers: `tenths(equityPct) >= tenths(impliedRequiredEquityPct)` (TASK-7.3 Q-2 convention). AC#2: 8/44 → 18.2 ≥ 18.2 call; 8/44 − 0.001 → 18.1 fold. | yes | Same as `pot-odds-call`. | Unrounded |
| A-7 | `outs` holds card ids (`Card`, 0..51) in ascending order; the outs of a combo draw are the union of the flush and straight out cards (no duplicates). | yes | Plain data, clones through the advice worker; ascending is deterministic. | Strings ('2h'); count only |
| A-8 | AC#3's $12 pot (with the $8 bet) can't occur in a legal $4/$8 hand (blinds alone make the pot before the turn ≥ $8), so the acceptance test uses the AC#1 view with `pots[0].amount` set to 4 (a hand-edited `PlayerView`, plain data). | yes | `recommendPostflop` only reads the view. | Change the stakes |
| A-9 | `tests/advice/postflop-coverage.acceptance.test.ts` (TASK-7.22) is not edited: its fixed-seed property passes on the prototype; its `expectedRule` oracle has no implied branch, which only matters if a future seed reaches such a spot. | yes | Locked edits only where something fails. | Re-pin pre-emptively |

## 3. Current system
- `src/advice/postflop.ts:76-171` `recommendPostflop`: `pot` (`:92-94`), `callAmount` from the legal call (`:95-102`),
  whole-range equity → `equityPct`, `requiredEquityPct = toPct(call/(pot+call))` (`:120`), calling-range run, then
  rules `value-bet` → `check-free` → `value-raise` → `pot-odds-call` → `pot-odds-fold` (`:131-149`).
  `POSTFLOP_RULE_IDS` at `:9-15` "in evaluation order; each is documented in docs/advice/postflop-rules.md".
- `src/advice/ranges.ts:304-327`: `hasFlushDraw` (≥4 cards of a hole card's suit) and `hasOpenEnder` (four consecutive
  ranks, one from a hole card, completable at both ends; A only low for 2345, so A234/JQKA excluded) feed
  `classifyCombo`'s Draw class (`:330-344`). Private today.
- `src/engine/cards.ts:1-3`: `Card = rank*4 + suit`, `cardRank`, `cardSuit`, `parseCards`, `formatCard`.
- `src/engine/player-view.ts:24-33`: `PublicPlayer.stack`, `.allIn`, `.folded`; `view.stakes.bigBet`.
- Consumers: `src/bots/style.ts:434-455` reads only `action`/`equityVsCallingRangePct`; `src/table/advice-service.ts:65`
  posts the recommendation through a worker (plain data required); nothing in `src/ui`/`src/table` reads `ruleId`
  (grep). `src/advice/grade.ts:120-129` fold pairs use `equityPct` − `requiredEquityPct`.
- Locked consistency check: `tests/advice/postflop.acceptance.test.ts` AC#5 requires every id in
  `POSTFLOP_RULE_IDS` to have a `### Rule \`<id>\`` doc heading and a `describe('rule <id>'` in
  `tests/advice/postflop.test.ts`.
- Tests: vitest; `npm test` = all with coverage; `*.acceptance.test.ts` locked per owner (`doit/*/state.json`);
  slow opt-in `npm run test:slow` (`TLH_SLOW_TESTS=1`), incl. `tests/bots/style-bands.acceptance.test.ts`.
- Existing code to reuse:
  - `src/advice/ranges.ts` `hasFlushDraw`/`hasOpenEnder` rank-mask logic → `drawOuts` (extend to return the out
    cards; keep `classifyCombo` behaviour identical).
  - `src/advice/postflop.ts` `toPct` and the tenths comparison → implied price and rule.
  - `tests/advice/postflop.acceptance.test.ts` helpers (`deckWith`, `spotDeck`, `stateAfter`, `fixedEquity`) and
    `tests/advice/value-bet.acceptance.test.ts` `limitedToRange` seam pattern → copy into the new acceptance file
    (don't import from locked files).

### Prototype measurements (scratch worktree, rule as specified)
- `npm run -s playtest -- --hands 10000 --seed 42`: `Invariant violations: 0`, 13.8 s wall; stdout SHA-256
  `14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48` (was
  `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98`; no test pins it — only doit logs).
- Style bands, 100,000 Mixed hands, seed 42 (was, TASK-6.17): TAG 22.3/16.4/63.7 (22.2/16.4/63.8), Rock 10.1/8.8/48.7
  (10.2/8.8/47.8), Calling station 58.2/6.4/15.4 (59.6/6.7/15.3), Maniac 56.8/54.3/78.7 (56.1/53.3/79.3) — all inside
  bands; TAG aggression moved away from its 65 ceiling. 140 s.
- `vitest run` (all but tooling): 5 failures, all expected: TASK-7.3 AC#1/AC#2/AC#5, TASK-7.8 AC#9, unlocked
  `grade.test.ts` "recommendations are grader inputs and labels are fixed". AC#5 clears once doc + unit describe exist.
- Slow group (`test:slow` minus style bands, 13 files): all pass on the prototype (no locked slow re-pin).
- AC spots in the prototype: AC#1 with {AsKd} → `implied-odds-call` 20.5/22.2/18.2 and the 9 hearts; AC#3 → `pot-odds-fold` 40.0/28.6/20.5; AC#4 line → pot 36, required 18.2, implied 13.3, 2 opponents; AC#5 river → `pot-odds-fold`, outs [], implied null. With {KsQd}: 27.3% → `pot-odds-call` (D-6).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Rule order: `value-bet` → `check-free` → `value-raise` → `pot-odds-call` → `implied-odds-call` → `pot-odds-fold`; `POSTFLOP_RULE_IDS` lists them in that order. | — | Task text precedence; implied only rescues a pot-odds fold. | no | n/a (task text) |
| D-2 | Public interface: rule id `implied-odds-call`; `PostflopRecommendation` gains `impliedRequiredEquityPct: number \| null` and `outs: readonly Card[]`; `drawOuts` exported from `ranges.ts`. `requiredEquityPct` keeps its pot-odds meaning (AC#6's "required equity %" = 22.2 in AC#1; the implied price is the extra field). | Overwrite `requiredEquityPct` with the implied price; string outs | Grading and the TASK-7.8 D-4 contract read `requiredEquityPct` as the pot-odds price. | yes | user (Q-1, qa.md: auto-accepted, recommended) |
| D-3 | Counted draws: flush draw (exactly 4 visible cards of a suit, at least one from the hole, no made flush) → the unseen cards of that suit (9); open-ended straight draw (`hasOpenEnder`, no made straight) → the unseen cards of the two completing ranks (8); both → the union (15). Gutshots, double gutshots and backdoor draws count no outs. | Add gutshots (4) and double gutshots (8) | Task text names only flush (9) and OESD (8); a smaller documented rule is easier to learn; reversible later. | yes | user (Q-2, qa.md: auto-accepted, recommended) |
| D-4 | Locked-test re-pins in §5 (TASK-7.3 ×2 tests + TASK-7.8 ×1 test), no assertion dropped. | Avoid (impossible: shape and AC#2 spot change) | The new fields and the AC#2 spot (a flush draw) change pinned results. | yes | user (Q-3, qa.md: auto-accepted, recommended) |
| D-6 | AC#1/AC#3 opponent range is {AsKd} instead of the story's {KsQd}. Measured with the real `computeEquity` (exact, prototype): Ah5h vs KsQd on Kh 8h 7c 2d = 27.3% (12/44) — the 3 remaining aces also win (pair of aces beats the pair of kings), so the story's note "only the 9 remaining hearts win" is wrong, 27.3 ≥ 22.2 fires `pot-odds-call`, and AC#1 could never show an implied-odds call. Vs {AsKd}: 20.5% (9/44, aces give the opponent two pair), `implied-odds-call` with 22.2/18.2 — every other AC number unchanged. | (b) keep {KsQd}, change hero to 5h3h (9/44, but loses the nut-flush-draw example); (c) keep {KsQd} and accept 27.3% (AC#1 then shows no implied call) | Smallest change that keeps the story's hero, board, pot and all six printed percentages. Task AC#1/#3 now read {AsKd} (updated via backlog, Q-4). | yes | user (Q-4, qa.md: auto-accepted, recommended) |
| D-5 | Bots unchanged in code; they apply the rule through `recommend` (with `BOT_EQUITY`). | Exempt bots | REQ-035: bots play the advice; bands hold (measured). | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/ranges.ts` — export `drawOuts`; `hasFlushDraw`/`hasOpenEnder` may be refactored to share it, `classifyCombo` results unchanged
- `src/advice/postflop.ts` — rule id, two fields, implied price and rule
- `docs/advice/postflop-rules.md` — definitions, `### Rule \`implied-odds-call\``, `pot-odds-fold` condition, "Not applied yet"
- `tests/advice/implied-odds.acceptance.test.ts` — new, locked after first green build (SPEC-01..SPEC-06)
- `tests/advice/postflop.test.ts` — `describe('rule implied-odds-call')` (SPEC-07)
- `tests/advice/ranges.test.ts` — `describe('drawOuts')` (SPEC-08)
- `tests/advice/grade.test.ts` — re-pin "recommendations are grader inputs and labels are fixed" (unlocked)
- `tests/advice/postflop.acceptance.test.ts` (locked, TASK-7.3) — re-pins per Q-3
- `tests/advice/value-bet.acceptance.test.ts` (locked, TASK-7.8) — re-pin per Q-3

### Components, interfaces and data
```ts
// src/advice/ranges.ts
/** Unseen cards that complete the hero's flush draw or open-ended straight draw, ascending, no duplicates;
 *  [] on a 5-card board, without such a draw, or when the draw is already made. Pure; reads only its arguments. */
export function drawOuts(hole: readonly Card[], board: readonly Card[]): Card[];

// src/advice/postflop.ts
export const POSTFLOP_RULE_IDS = ['value-bet', 'check-free', 'value-raise', 'pot-odds-call',
  'implied-odds-call', 'pot-odds-fold'] as const;
interface PostflopRecommendation { /* existing fields unchanged */
  /** call ÷ (pot + call + bigBet × opponents not all in), percent one decimal; null when the rule can't apply (A-5). */
  readonly impliedRequiredEquityPct: number | null;
  /** drawOuts(holeCards, board): the outs counted; [] on the river or without a flush/open-ended draw. */
  readonly outs: readonly Card[];
}
```

### Rules and algorithms
1. `outs = drawOuts(view.holeCards, view.board)`.
   - Flush: for a suit with exactly 4 cards among hole+board and ≥1 hole card of it → add every card of that suit not in
     hole+board (always 9). 5+ cards of a suit (made flush) → none.
   - Straight: if no straight is already made (any 5 consecutive ranks present, A also low), for each window v..v+3
     (v = 0..8) fully present with a hole rank in it → add every card of rank v−1 (A when v = 0) and v+4 not in
     hole+board (8 for one window).
   - Sort ascending; union.
2. `payers` = live opponents with `!allIn`; `chipsBehind = hero.stack − callAmount`.
3. `impliedRequiredEquityPct = owed > 0 && outs.length > 0 && payers > 0 && chipsBehind > 0
   ? toPct(callAmount / (pot + callAmount + view.stakes.bigBet × payers)) : null`.
4. After `pot-odds-call` fails: `impliedRequiredEquityPct !== null && tenths(equityPct) >= tenths(implied)` →
   `implied-odds-call`, action `call`; else `pot-odds-fold`.
- Worked example (doc + AC#1): $4/$8, turn Kh 8h 7c 2d, hero Ah5h, opponent range {AsKd} (task AC#1/#3 as corrected by Q-4), opponent bets $8, pot $28.
  Outs 2h 3h 4h 6h 7h 9h Th Jh Qh. Equity 9/44 = 20.5%; required 8/36 = 22.2%; implied 8/(36+8) = 18.2% → call
  (`implied-odds-call`). With a $12 pot: required 40.0%, implied 28.6% → fold.

### Engine lines for the acceptance views (harness of `tests/advice/postflop.acceptance.test.ts`: $4/$8, 6 seats,
stacks 160, button 1, hero seat 3 = BB; flop deck positions 13-15, turn 17, river 19)
- AC#1 (one opponent, pot $28): `f(4) f(5) f(6) c(1,4) c(2,2) k(3) | b(2,4) c(3,4) f(1) | b(2,8)` → pot 12+8 = 20,
  turn bet 8 → 28; live opponent SB only.
- AC#4 (two opponents, pot $36): `f(4) f(5) c(6,4) c(1,4) c(2,2) k(3) | b(2,4) c(3,4) f(6) c(1,4) | b(2,8)` → 16+12 = 28,
  +8 = 36; live opponents SB and BTN (BTN still to act); hero Ah5h, board Kh 8h 7c 2d.
- AC#5 (river): AC#1 line, then `c(3,8)`, river `3s`, `b(2,8)`.
- Equity seam for the AC#1 range (Q-4: {AsKd}): `(input) => computeEquity({ ...input, opponents: input.opponents.map(() => [AsKd]) })`
  (exact enumeration, 44 rivers). AC#4 uses a fixed-equity stub (two opponents can't both hold the one combo).

### Locked-test edits (Q-3; each re-pin keeps every assertion)
| File (owner) | What changes | Assertion count |
|---|---|---|
| `tests/advice/postflop.acceptance.test.ts` (TASK-7.3) AC#1 | `toStrictEqual` object gains `impliedRequiredEquityPct: 8.3` (4/(24+3×8)) and `outs: parseCards('2h 3h 4h 6h 7h 8h Th Jh Qh')` (Ah5h on Kh 9h 2c is a flush draw). | unchanged |
| `tests/advice/postflop.acceptance.test.ts` (TASK-7.3) AC#2 | Hero `'Ah 5h'` → `'Ad 5c'` (no counted draw), so equity 0.1 below the price still folds with the same four pinned values. | unchanged |
| `tests/advice/value-bet.acceptance.test.ts` (TASK-7.8) AC#9 | Expected keys add `impliedRequiredEquityPct`, `outs`; `expectedRule` gains `implied-odds-call` before `pot-odds-fold` (rounded equity ≥ rounded non-null implied price). | unchanged |
| `tests/advice/postflop.acceptance.test.ts` AC#5 | No edit: passes once the doc heading and unit describe exist. | n/a |
| `tests/advice/postflop-coverage.acceptance.test.ts` (TASK-7.22) | No edit (A-9). | n/a |
Unlocked: `tests/advice/grade.test.ts` "recommendations are grader inputs and labels are fixed" — FLOP_BET fixture with
`fixedEquity(0.1)` now gets `implied-odds-call`; keep the minor-6.7 assertion by giving the fixture a no-draw hero or
an equity stub below the implied price, re-pinning the margin if needed.

### Error handling and configuration
- No new errors. `drawOuts` never throws for valid cards. No options or constants added beyond the rule id.

## 6. Behaviour specification

### SPEC-01: Worked example recommends an implied-odds call
- Verifies: AC#1
- Behaviour: Given the AC#1 view (turn Kh 8h 7c 2d, hero Ah5h, one opponent, $8 bet, pot $28) and the {AsKd} equity
  seam (Q-4), When `recommendPostflop` runs, Then `equityPct` 20.5, `requiredEquityPct` 22.2, `impliedRequiredEquityPct`
  18.2, `pot` 28, `callAmount` 8, action `call`, `ruleId` `implied-odds-call`, `move` `{seat:3,type:'call',amount:8}`,
  `outs` = `parseCards('2h 3h 4h 6h 7h 9h Th Jh Qh')`.
- Verification: acceptance `tests/advice/implied-odds.acceptance.test.ts::AC#1 Ah5h on Kh 8h 7c 2d calls on implied odds with 9 heart outs`

### SPEC-02: Boundary at the implied price
- Verifies: AC#2
- Behaviour: Given the AC#1 view, When the equity seam returns 8/44 for the hero, Then action `call`, `ruleId`
  `implied-odds-call`, `equityPct` 18.2; When it returns 8/44 − 0.001, Then action `fold`, `ruleId` `pot-odds-fold`,
  `equityPct` 18.1, `impliedRequiredEquityPct` 18.2.
- Verification: acceptance `tests/advice/implied-odds.acceptance.test.ts::AC#2 equity equal to the implied price calls and 0.1 below folds`

### SPEC-03: Small pot still folds, outs listed
- Verifies: AC#3
- Behaviour: Given the AC#1 view with `pots[0].amount` 4 (pot $12 with the bet, A-8) and the {AsKd} seam (Q-4), Then
  `requiredEquityPct` 40.0, `impliedRequiredEquityPct` 28.6, `equityPct` 20.5, action `fold`, `ruleId`
  `pot-odds-fold`, `outs` the 9 hearts of SPEC-01.
- Verification: acceptance `tests/advice/implied-odds.acceptance.test.ts::AC#3 a 12 dollar pot folds the draw and lists its 9 outs`

### SPEC-04: One big bet per opponent
- Verifies: AC#4
- Behaviour: Given the AC#4 view (two live opponents not all in, call $8, pot $36), When advice runs with any equity
  seam, Then `impliedRequiredEquityPct` is 13.3 (8/(44+16)) and `requiredEquityPct` 18.2 (8/44); with seam equity
  0.133 the action is `call` by `implied-odds-call`.
- Verification: acceptance `tests/advice/implied-odds.acceptance.test.ts::AC#4 two opponents add two big bets to the implied price`

### SPEC-05: River — no implied odds, no outs
- Verifies: AC#5
- Behaviour: Given the AC#5 river view (missed flush, facing $8), When advice runs with a seam returning 0.15
  (below required, above any implied price), Then `outs` is `[]`, `impliedRequiredEquityPct` is `null`, action `fold`,
  `ruleId` `pot-odds-fold`.
- Verification: acceptance `tests/advice/implied-odds.acceptance.test.ts::AC#5 a missed draw on the river gets no implied odds and no outs`

### SPEC-06: Implied-odds recommendation carries its numbers
- Verifies: AC#6
- Behaviour: Given the SPEC-01 result, Then it has `equityPct`, `requiredEquityPct` and `impliedRequiredEquityPct`
  as one-decimal numbers in 0..100, `ruleId` `implied-odds-call` (in `POSTFLOP_RULE_IDS`), `outs` a non-empty
  ascending array of distinct card ids not in hole or board; and it survives `structuredClone` deep-equal.
- Verification: acceptance `tests/advice/implied-odds.acceptance.test.ts::AC#6 implied-odds advice returns equity, required equity, rule id and outs`

### SPEC-07: Rule unit tests and precedence
- Verifies: DoD#1, DoD#2
- Behaviour: `describe('rule implied-odds-call')` in `tests/advice/postflop.test.ts`: equity ≥ pot-odds price →
  `pot-odds-call` even with a draw; value raise beats implied; no draw → `pot-odds-fold`; flop draw applies (two cards
  to come); hero call leaves 0 chips → `impliedRequiredEquityPct` null, fold (A-3); every opponent all in → null
  (A-2); an all-in opponent is not counted (A-2); nothing owed → null, outs still listed (A-5).
- Verification: unit `tests/advice/postflop.test.ts::rule implied-odds-call`

### SPEC-08: Outs detection
- Verifies: DoD#2, DoD#10
- Behaviour: `drawOuts`: flush draw (Ah5h, Kh 8h 7c 2d) → 9 hearts; one-card flush draw (Ah 2c, Kh 8h 7h) → 9 hearts;
  OESD (9c 8d, 7h 6s 2c) → the four 5s and four Ts; combo (9h 8h, 7h 6c 2h) → 15; made flush/straight → no outs from
  the made draw; gutshot (9c 7d, 6h 5s 2c) → []; A234 and JQKA one-ended → []; board-only four-flush
  without a hole card of the suit → []; river → []; output ascending, no duplicates; `classifyCombo` results unchanged
  (existing ranges tests pass).
- Verification: unit `tests/advice/ranges.test.ts::drawOuts`

### SPEC-09: Documentation
- Verifies: DoD#1, DoD#10, DoD#12
- Behaviour: `docs/advice/postflop-rules.md` defines "Draw and outs" (D-3, plain English, outs not discounted),
  "Implied required equity" (formula, A-2..A-4), has `### Rule \`implied-odds-call\`` between `pot-odds-call` and
  `pot-odds-fold` with Condition, Outcome, the SPEC-01/SPEC-03 example and a "Why"; `pot-odds-fold` condition says the
  implied-odds rule didn't apply; "Not applied yet" drops the implied-odds line. Text original. The locked TASK-7.3
  AC#5 consistency check passes.
- Verification: acceptance `tests/advice/postflop.acceptance.test.ts::AC#5 every documented rule has a unit test and every engine rule is documented`

### SPEC-10: Playtest and style bands
- Verifies: DoD#7
- Behaviour: When `npm run -s playtest -- --hands 10000 --seed 42` runs, Then `Invariant violations: 0`, wall ≤ 15 s
  locally, SHA-256 recorded in the build log (prototype `14d746f7…72e48`); `TLH_SLOW_TESTS=1 npx vitest run
  tests/bots/style-bands.acceptance.test.ts -t "seed 42"` passes and its four lines are recorded.
- Verification: command `bash -c 'npm run -s playtest -- --hands 10000 --seed 42 | tee /dev/stderr | shasum -a 256'`

### SPEC-11: Repo checks, coverage, boundaries
- Verifies: DoD#3, DoD#5, DoD#6, DoD#9
- Behaviour: lint, typecheck, `npm test` zero errors; coverage thresholds hold; `src/advice` imports no UI/browser
  code (locked boundary test); no network code.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-12: N/A items, CI, story doc
- Verifies: DoD#4, DoD#8, DoD#11, DoD#13
- Behaviour: DoD#4 N/A (golden-spot suite arrives with TASK-7.14); DoD#8/#13 N/A (no screen or dialog); CI green on
  `doit/TASK-7.9`.
- Verification: manual `gh run list --branch doit/TASK-7.9 --limit 1` shows success

## 7. Edge cases
- River / no draw → outs [], implied null (SPEC-05, SPEC-08).
- Combo draw → union 15 (SPEC-08). Made flush or straight → that draw not counted (SPEC-08).
- Hero all in after calling; all opponents all in; an all-in opponent among payers (SPEC-07).
- Nothing owed with a draw → outs listed, implied null, check/bet rules unchanged (SPEC-07).
- Equity ≥ pot-odds price with a draw → `pot-odds-call` wins (SPEC-07); value raise wins (SPEC-07).
- Rounding boundary 18.2 vs 18.1 (SPEC-02).
- Concurrency, permissions, persistence: N/A (pure function, no I/O).

## 8. Security considerations
N/A: pure advice computation on in-memory plain data; no untrusted input boundary added, no dependencies, no
randomness (bot equity sampling unchanged and seeded), no network, nothing logged.

## 9. Non-functional
- 10,000-hand default playtest ≤ 15 s wall locally (prototype 13.8 s; `drawOuts` is O(7) per decision).
- Every-push tests stay small: the new acceptance file uses fixed views and seams (no long playtests); the 100,000-hand
  band check runs only in the opt-in slow group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42`
- New tests: `tests/advice/implied-odds.acceptance.test.ts` → SPEC-01..06; `tests/advice/postflop.test.ts::rule
  implied-odds-call` → SPEC-07; `tests/advice/ranges.test.ts::drawOuts` → SPEC-08.
- Judge scenario: run the acceptance file; run the playtest and compare the SHA with the build log; run
  `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts -t "seed 42"`.

## 11. Open questions
- None (Q-1..Q-4 answered in `doit/TASK-7.9/qa.md`).

## 12. Clarifications log
See `doit/TASK-7.9/qa.md`.
