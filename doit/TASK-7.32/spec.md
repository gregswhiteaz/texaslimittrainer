# Spec: TASK-7.32 — Investigate why advised play almost never folds after the flop (WTSD ~94%)

Status: DRAFT
Task: TASK-7.32 · Parent/epic: TASK-7 · Requirements: REQ-033 (033.1, 033.2, 033.7), REQ-035, REQ-029.2, REQ-027, REQ-045 · Dream: limit-holdem-trainer

## 1. Summary
The ~94% WTSD comes from the bots, not from the user's hints. Every bot style asks the advice engine with the
default `'unseen'` range model. That model treats each opponent as holding any two unseen cards, so a hand facing a
bet averages ~64% equity against a requirement of ~11%, and bots call 97–99% of postflop bets. The user's hints
already use action-based ranges. Measured on the same tables, they would fold 19–45% of postflop bets and end at
~44% WTSD.
This story switches the bots to the action-range model, as TASK-7.5 planned
(`doit/TASK-7.5/spec.md:12`). It also adds two advice-rule changes so that all-TAG play lands inside every 6-max
healthy range: a turn call counts the river big bet in its price, and a raise for value needs more than 65% equity
against the calling range. The cost is a re-baseline of bot-driven and advice-pinned tests, and a knock-on effect in
the Mixed line-up (Q-1, Q-2).

## 1a. Investigation (AC#1)
All numbers come from scratch scripts that have since been deleted. They ran on the real `runPlaytest` with
6-max cash, the all-TAG default line-up and `BOT_EQUITY`. Facing-bet decisions are postflop decisions where
`currentBet > streetContribution`, and fold is always legal at those points.

**Baseline: today's code, 2,000 hands, seed 42.** VPIP 22.3, PFR 16.4, Aggression 63.6, WTSD 94.2, W$SD 49.6.
There were 3,398 facing-bet decisions. Rules fired: `value-raise` 1,489, `pot-odds-call` 1,841,
`implied-odds-call` 1, `pot-odds-fold` 67 (2.0%). Fold was legal but not chosen in 3,331 of 3,398 decisions (98.0%).

| Street | Facing-bet decisions | Folds | Avg equity (unseen) | Avg required | Decisions with equity < 30% | Same spots, action ranges: avg equity / fold % |
|---|---|---|---|---|---|---|
| flop | 913 | 0.3% | 63.5% | 11.4% | 4.8% | 31.9% / 19.2% |
| turn | 1,116 | 2.0% | 65.3% | 13.2% | 8.4% | 30.7% / 36.5% |
| river | 1,369 | 3.1% | 67.8% | 9.6% | 11.5% | 32.0% / 44.9% |

Opponents at the decision: 1 in 2,954 cases, 2 in 423, 3 in 21. Required equity sits mostly at 5–20%, which is
normal limit pot odds.

**Root cause 1 (primary): the bots use the wrong range model.** `decideTag`, `decideCallingStation`, `decideManiac`
and `decideRock` call `recommend(view, { ...adviceOptions(options), equity })` (`src/bots/tag.ts:39-42`,
`src/bots/calling-station.ts:41-44`, `src/bots/maniac.ts:27-30`, `src/bots/rock.ts:27`). Bots never set
`opponentRanges`, so `recommendPostflop` falls back to `'unseen'` (`src/advice/postflop.ts:107,135-138`): every
opponent holds any unseen combo. The bettor's preflop line and its bet are ignored, so hero equity against "any two
cards" averages 63–68% against a required 10–13%, and `pot-odds-call` (`src/advice/postflop.ts:185`) fires almost
every time. The bots have no call logic of their own. Every style starts from this advice. The Calling station's
`fold → call` deviation and the Maniac's `call → raise` deviation only add calls and raises on top. That is why
every Mixed style also showed 92–96% WTSD.
The user-facing advice already passes `opponentRanges: 'actions'` (`src/advice/recommend.ts:22-30`,
`src/table/advice-service.ts:76`, `src/advice/golden.ts:484`). Narrowing uses REQ-035.5 KEEP
(`src/advice/ranges.ts:56-61`) on the 6-max default ranges (`src/advice/ranges.ts:598-645`). TASK-7.5 kept bots on
`'unseen'` on purpose and named this switch as a follow-up (`doit/TASK-7.5/spec.md:12,109`). So the hints were
never the 94% source, despite the TASK-10.3 Q-2 note (`doit/TASK-10.3/qa.md:6-7`).

**Root cause 2 (residual): the call price on the turn ignores the river.** Bots switched to `'actions'` with no
other change give 5,000 hands per seed: seed 42 VPIP 22.2, PFR 16.4, Aggression 65.2, WTSD 44.5, W$SD 51.2; seed 7
VPIP 22.6, PFR 16.5, Aggression 65.6, WTSD 43.7, W$SD 51.4. WTSD is still above 42, and Aggression is already near
the 66 ceiling. REQ-033.1 prices a call as `call ÷ (pot + call)` (`src/advice/postflop.ts:151`) and compares it with
equity to the river. That is only right if no more bets come. In fixed limit, a turn call usually has to call one
more big bet on the river.
Every extra fold also removes a call, which raises Aggression = bets+raises ÷ (bets+raises+calls)
(`src/stats/style-stats.ts:112`). So WTSD and Aggression pull against each other. The variants measured (5,000
hands, seed 42, bots on `'actions'`; "price" means the next-street bet counted on that street, "VR" means the
value-raise threshold):

| Variant | Aggression | WTSD | Inside all 6-max ranges? |
|---|---|---|---|
| action ranges only | 65.2 | 44.5 | no (WTSD) |
| + price on flop and turn | 71.8 | 36.0 | no (Aggression) |
| + price on flop only | 69.5 | 40.3 | no (Aggression) |
| + price on flop and turn at ½ big bet | 69.1 | 39.8 | no (Aggression) |
| value-bet threshold 55, no price | 64.8 | 47.6 | no (WTSD) |
| + price on turn only | 67.7 | 38.7 | no (Aggression) |
| + price on turn only, VR 60 | 66.0 | 39.7 | edge (66.0) |
| **+ price on turn only, VR 65** | **65.1** | **39.9** | **yes** (seed 7: 65.3 / 39.3) |
| + price on turn only, VR 70 | 64.3 | 40.5 | yes (seed 7: 64.6 / 39.5) |
| action start ranges without postflop narrowing | 60.3 | 72.0 | no |

**Chosen fix, prototyped in a scratch copy:** bots on `'actions'`, the turn price, and VR 65. Results at 10,000
hands: seed 42 VPIP 22.4, PFR 16.3, Aggression 64.5, WTSD 40.8, W$SD 51.5; seed 7 VPIP 22.4, PFR 16.3, Aggression
64.7, WTSD 40.9, W$SD 51.8. **At 100,000 hands, seed 42: VPIP 22.2, PFR 16.2, Aggression 64.3, WTSD 40.4, W$SD
51.5.** All five are inside the 6-max ranges (20–28, 14–22, 50–66, 30–42, 47–57;
`src/stats/healthy-ranges.json`).

**Knock-on in the Mixed line-up (Q-2).** With bots reading action ranges, every bot treats a Maniac's bet as a
typical player's bet (Strong/Pair/Draw) and folds to it, as REQ-029.2 and REQ-035.3 require. Maniacs then stop
busting while TAG and Rock bots bust, and replacements (REQ-007.5) fill the table with Maniacs. Results at 10,000
hands, seed 42, `--check-styles`:

| | Today | Prototype |
|---|---|---|
| Maniac seat-hands | 1,449 | 36,969 |
| TAG PFR | 16.6 | 12.0 (band 14–22) |
| TAG Aggression | 59.6 | 34.8 (band 45–65) |
| Rock VPIP | 9.7 | 7.6 (band 8–15) |
| Rock Aggression | 45.2 | 31.8 (band 35–55) |

The "bots on actions only" variant shows the same drift (TAG PFR 11.0 and Aggression 38.7; Rock Aggression 34.1).
Keeping the Calling station, Maniac and Rock on `'unseen'` does not help either (seed 7: TAG PFR 11.2 and
Aggression 39.4; Rock VPIP 7.4 and Aggression 32.1). The drift therefore comes from any fix that makes bots fold to
bets. It cannot be avoided inside this story's approach.

## 2. Scope
- In scope:
  - The bots' advice uses `opponentRanges: 'actions'`, with no observed stats (REQ-029.2), for all four styles.
  - Advice rule change 1, the turn price: on the turn, required equity counts one river big bet (§5).
  - Advice rule change 2: the value-raise threshold is 65% when a bet is owed. The value-bet threshold stays 50%.
  - The explanation copy and grading follow both changes.
  - Docs: `docs/advice/postflop-rules.md`, `docs/advice/range-model.md`, a `docs/advice/golden-spots.md` re-pin
    log, and REQ-033.1/033.2 amended in `dreams/limit-holdem-trainer/requirements.md` (after Q-1).
  - Re-baselining every test the change moves (§5 "Locked tests"), including golden spots with a recorded
    justification for each.
  - A new acceptance file: a fast all-TAG folding check in the normal suite, and the 100,000-hand five-stat check in
    the opt-in slow group.
- Not doing:
  - Rebalancing the Mixed, Tough or Soft line-ups or the style JSON files to restore REQ-027 bands (Q-2; follow-up).
  - Changing healthy ranges (`src/stats/healthy-ranges.json`), REQ-027 bands, KEEP narrowing (REQ-035.5), default
    ranges, implied odds (REQ-033.7), preflop advice, or the equity engine and its bot budget.
  - Bots reading observed stats (REQ-029.2 stays).
  - Showing or grading the river price on the flop. The flop keeps the REQ-033.1 price.
  - Re-running the million-hand or style-bands workflows (manual dispatch).
- Scope budget: files=36, lines=1100

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The river big bet counted on the turn is `R = min(bigBet, hero.stack − callAmount)` when at least one live opponent is not all in, else `R = 0`. With `R = 0` the formula reduces to REQ-033.1. | yes | No river bet can come if nobody can bet, or if the hero has no chips left to call it. The same "payers" test as implied odds (`src/advice/postflop.ts:153-157`). | Always count a full big bet |
| A-2 | The implied-odds rule (REQ-033.7) is unchanged and still compares with its own formula, so turn draws can still call on implied odds when they miss the higher turn price. | yes | Draws are paid when they hit, and REQ-033.7 already prices that. The prototype measured with this order. | Add R to the implied price too |
| A-3 | The grading `aggression-margin` measures distance from the threshold that applied (50 or 65), read from a new `valueThresholdPct` field on the recommendation. It defaults to 50 for hand-built inputs without the field. | yes | Otherwise a 65.0% spot, where the advice is call and the user raises, would grade from 50 (15 points = Major) although the advice sits right on its own threshold. | Keep the distance from 50 |
| A-4 | The 100,000-hand AC#2 check uses seed 42 only (as TASK-10.3) and lives in a new slow file added to `npm run test:slow`. The fast check runs 2,000 all-TAG hands. | yes | Standing rule: multi-minute checks are opt-in. 2,000 hands take about 3 s. | Seeds 42 and 7 at 100,000 hands |
| A-5 | `BOT_ADVICE` (`{ opponentRanges: 'actions' }`) is exported from `src/bots/tag.ts` next to `BOT_EQUITY` and spread before `adviceOptions(options)`, so a test can still pass `opponentRanges: 'unseen'` explicitly. | yes | One place for the bots' model, matching the `BOT_EQUITY` pattern (`src/bots/tag.ts:25-31`). | Inline the literal in four files |
| A-6 | The playtest output for a given seed changes (bots act differently). No test pins the hash: `playtest.acceptance` AC#3 only compares two runs with each other (`tests/playtest/playtest.acceptance.test.ts:94`). Hashes noted in earlier specs (TASK-6.15/6.18 manual checks) are historic. | yes | Determinism is kept; only the values change. | — |

## 3. Current system
- Postflop advice: `src/advice/postflop.ts`. The rule ids are at `:19-26`, `VALUE_THRESHOLD_PCT = 50` at `:28`, the
  options at `:68-75` (default `'unseen'` at `:107`), the range attempts at `:132-147`, the required equity at
  `:151`, implied odds at `:152-157`, the value test at `:169-172` and the rule order at `:174-194`.
  `explainPostflop(rec, VALUE_THRESHOLD_PCT)` is at `:216`.
- Explanations: `src/advice/explain.ts:84-108` fills the `POSTFLOP_TEMPLATES` (`src/advice/explanations.ts:112-125`).
  `{threshold}` and `{required}` are already template values.
- Grading: `src/advice/grade.ts:121-141`. The call/fold margin uses `requiredEquityPct`, which picks up the turn
  price automatically. The aggression margin is `|vsCalling − 50|` (`:136`).
- Recommend/options: `src/advice/recommend.ts:22-39`. `adviceOptions` copies `opponentRanges` only if it is set.
- Range model: `src/advice/ranges.ts`. KEEP is at `:56-61`, `callingRange` at `:511-531` and
  `estimateOpponentRanges` at `:598-645`. Six-max only, otherwise unseen combos (TASK-7.5 A-3).
- Bots: `src/bots/tag.ts:25-52` (`BOT_EQUITY_BUDGET` and `decideTag`), `src/bots/calling-station.ts:34-57`,
  `src/bots/maniac.ts:25-41`, `src/bots/rock.ts:24-46`. `decideStyle` is at `src/bots/decide.ts:10-15` and the
  playtest policy at `src/playtest/policy.ts:13-15,44-53`.
- Stats: `src/stats/style-stats.ts:46-113` (WTSD = showdowns ÷ sawFlop; aggression is postflop) and
  `src/stats/healthy-ranges.json` (6-max).
  The existing slow check `tests/stats/healthy-ranges-tag.acceptance.test.ts` (locked, TASK-10.3) covers VPIP, PFR,
  Aggression and W$SD. Its comment at `:16` points WTSD to this story.
- Golden suites: `tests/golden/*.acceptance.test.ts`. The clear-cut rule is at `src/advice/golden.ts:490-514`: every
  other legal action must grade at least 10 points worse. The re-pin log convention is
  `docs/advice/golden-spots.md:181-189` ("Changes from …").
- Commands (`package.json`): `npm test` = `vitest run --coverage`. `npm run test:slow` = `TLH_SLOW_TESTS=1 vitest run
  <list>`. Also `npm run lint`, `npm run typecheck`, `npm run format` and `npm run playtest`.
- Existing code to reuse:
  - `src/advice/recommend.ts` `adviceOptions` → keep the bots' option plumbing and add `BOT_ADVICE` before it.
  - `src/advice/postflop.ts` `payers` → the R=0 condition (A-1).
  - `src/stats/style-stats.ts` `handStyleCounts` / `addStyleCounts` / `styleStats` and `src/playtest/runner.ts`
    `runPlaytest` → the AC#2 test, built like `tests/stats/healthy-ranges-tag.acceptance.test.ts:17-47`.
  - `src/stats/healthy-ranges.ts` `HEALTHY_RANGES` → the bounds (never hard-code 30/42).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Fix approach: bots on `'actions'`, plus the turn price, plus a value-raise threshold of 65. | (b) bots on `'actions'` only; (c) rule changes only, bots stay `'unseen'`; flop or flop+turn price; VR 60/70 | §1a: only this family meets all five ranges. (b) misses WTSD (44); (c) cannot move WTSD because unseen equity is ~64%. VR 65 is the middle of the working band (60 is on the edge, 70 also works). | yes | [NEEDS CLARIFICATION: Q-1] |
| D-2 | Mixed line-up REQ-027 drift is deferred to a follow-up story. | fix here; leave bots on `'unseen'` outside all-TAG | §1a knock-on: inherent to bots folding to bets. | yes | [NEEDS CLARIFICATION: Q-2] |
| D-3 | New explanation wording for the turn price and the value-raise threshold. | no copy change (the shown number would not match the sentence) | User-visible text. | yes | [NEEDS CLARIFICATION: Q-3] |
| D-4 | Golden spots that stop being clear-cut are replaced with new clear-cut spots in the same street, size and action. Each is logged with its old id, new id and reason under "Changes from TASK-7.32 (WTSD fix)". | delete them; loosen the clear-cut rule | AC#3 allows re-pinning only with a recorded justification. Keeps coverage counts (`docs/advice/golden-spots.md:176-178`). | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/tag.ts` — export `BOT_ADVICE`; `decideTag` spreads it before `adviceOptions(options)`
- `src/bots/calling-station.ts` — same spread
- `src/bots/maniac.ts` — same spread
- `src/bots/rock.ts` — same spread
- `src/advice/postflop.ts` — `VALUE_RAISE_THRESHOLD_PCT = 65`; turn price; `valueThresholdPct` and
  `requiredCountsRiverBet` fields
- `src/advice/explain.ts` — pass the applied threshold; turn-price wording
- `src/advice/explanations.ts` — template text for the turn price (Q-3)
- `src/advice/grade.ts` — `aggression-margin` from `valueThresholdPct ?? 50`
- `docs/advice/postflop-rules.md` — the new rules with worked examples; the investigation summary
- `docs/advice/range-model.md` — bots now use action ranges with the typical-player basis
- `docs/advice/golden-spots.md` — the re-pin log for TASK-7.32
- `dreams/limit-holdem-trainer/requirements.md` — amend REQ-033.1/REQ-033.2 and add a changelog row (only after Q-1)
- `package.json` — add `tests/advice/postflop-folding.acceptance.test.ts` to `test:slow`
- `tests/advice/postflop-folding.acceptance.test.ts` — new: SPEC-02, 03, 04, 06, 07, 08
- `tests/advice/postflop.test.ts` — unit updates for the turn price and VR (unlocked)
- `tests/bots/maniac.test.ts`, `tests/bots/rock.test.ts` — re-baseline (unlocked)
- `tests/advice/grade.acceptance.test.ts`, `tests/advice/implied-odds.acceptance.test.ts`,
  `tests/advice/postflop-coverage.acceptance.test.ts`, `tests/advice/postflop.acceptance.test.ts`,
  `tests/advice/value-bet.acceptance.test.ts`, `tests/bots/calling-station.acceptance.test.ts`,
  `tests/bots/maniac.acceptance.test.ts`, `tests/bots/tag-mixing.acceptance.test.ts`, `tests/bots/tag.acceptance.test.ts`,
  `tests/golden/postflop-spots.json`, `tests/golden/graded-examples.json`, `tests/playtest/games.acceptance.test.ts`,
  `tests/playtest/style-bots.acceptance.test.ts`, `tests/table/next-hand.acceptance.test.ts`,
  `tests/table/short-stack.acceptance.test.ts` — locked re-baselines (list below)

### Components, interfaces and data
- `src/bots/tag.ts`: `export const BOT_ADVICE: PostflopOptions = { opponentRanges: 'actions' };`. Every bot builds
  `{ ...BOT_ADVICE, ...adviceOptions(options), equity: options.equity ?? BOT_EQUITY }`. Bots never pass
  `observedOpponents` (`adviceOptions` cannot carry it).
- `PostflopRecommendation` gains two fields:
  - `readonly valueThresholdPct: 50 | 65`: `VALUE_RAISE_THRESHOLD_PCT` when `callAmount > 0`, else
    `VALUE_THRESHOLD_PCT`.
  - `readonly requiredCountsRiverBet: boolean`: true iff street is `'turn'`, `owed > 0` and `R > 0`.

  `EquityGradeInput` gains the optional `valueThresholdPct?: number | null`.
- Exports: `VALUE_RAISE_THRESHOLD_PCT = 65` in `src/advice/postflop.ts`. `VALUE_THRESHOLD_PCT` keeps the value 50.

### Rules and algorithms
- **Turn price (replaces `:151` for the turn).** `R` follows A-1, and `R = 0` off the turn.
  `requiredEquityPct = owed > 0 ? toPct((callAmount + R) ÷ (pot + callAmount + 2R)) : 0`.
  - Worked example: 6 seats, $4/$8, turn, pot $36 before the hero acts (including the $8 bet), call $8, villain not
    all in, hero stack $100. Today the price is 8 ÷ 44 = 18.2%. New: (8 + 8) ÷ (44 + 16) = 26.7%. An equity of 22.0%
    was a `pot-odds-call` and is now `pot-odds-fold` (or `implied-odds-call` if it has outs and reaches its implied
    price).
  - Edge: the same spot with hero stack $12 gives R = 4, so (8 + 4) ÷ (44 + 8) = 23.1%. With every opponent all in,
    R = 0 and the price is 18.2%. The flop and river are unchanged.
- **Value test (replaces `:169-172`).** `threshold = owed > 0 ? 65 : 50`, and
  `value = aggressive legal && round(vsCalling × 10) > threshold × 10`. Examples: facing a bet with vsCalling 65.0
  → not value, so the pot-odds rules decide. With 65.1 → `value-raise`. Nothing owed with 50.1 → `value-bet`, as
  today.
- **Rule order:** unchanged (`value-bet`, `check-free`, `value-raise`, `pot-odds-call`, `implied-odds-call`,
  `pot-odds-fold`).
- **Explanation:** `explainPostflop(rec, rec.valueThresholdPct)`. When `requiredCountsRiverBet`, the pot-odds
  sentence names the river bet (Q-3 wording). It still has at most 3 sentences (REQ-037).
- **Grading:** in `aggression-margin`, use `distance = |tenths(vsCalling) − tenths(valueThresholdPct ?? 50)|`. The
  Major threshold (15 points) and every other grading rule are unchanged.

### Locked tests the build must edit (hook-locked; owner from `doit/*/state.json`)
Prototype run of the normal suite: 25 failures in 18 files. The locked ones:
- `tests/advice/grade.acceptance.test.ts` (TASK-7.4): AC#7, a turn call/fold margin pinned with the old price.
- `tests/advice/implied-odds.acceptance.test.ts` (TASK-7.9): AC#1, AC#3, AC#4 (turn spots; the pinned required %
  changes, e.g. $12 pot: 40.0% → 44.4%).
- `tests/advice/postflop.acceptance.test.ts` (TASK-7.3, TASK-7.9): AC#6.
- `tests/advice/postflop-coverage.acceptance.test.ts` (TASK-7.22): AC#2.
- `tests/advice/value-bet.acceptance.test.ts` (TASK-7.8): AC#6 ("50.1% against callers raises" becomes a 65.1%
  boundary) and AC#8.
- `tests/golden/postflop-spots.json` and `tests/golden/postflop.acceptance.test.ts` (TASK-7.14): 8 turn call spots
  lose clear-cut status (`6max-turn-bb-call-jj`, `6max-turn-co-call-qjo`, `6max-turn-btn-call-84o`,
  `6max-turn-utg-call-t7s`, `6max-turn-bb-call-kqs`, `6max-turn-bb-call-k3s`, `6max-turn-utg-call-q7o`,
  `fr-turn-hj-call-k7o`). They are replaced per D-4. Only the JSON changes; the test file does not.
- `tests/golden/graded-examples.json` and `tests/golden/suite.acceptance.test.ts` (TASK-7.14):
  `graded-postflop-fold-major-6max-turn-second-pair` changes grade or margin. Re-pin the example and log it.
- `tests/bots/tag.acceptance.test.ts` (TASK-6.1): AC#2 and AC#3 compare with `'unseen'` advice. Use `BOT_ADVICE`.
- `tests/bots/tag-mixing.acceptance.test.ts` (TASK-6.2): "outside mixed spots TAG plays the recommended action".
- `tests/bots/calling-station.acceptance.test.ts` (TASK-6.3): the raise-deviation count comparison.
- `tests/bots/maniac.acceptance.test.ts` (TASK-6.4): the worker seat, call→raise and check→bet comparisons.
- `tests/playtest/style-bots.acceptance.test.ts` (TASK-6.9): the earlier-showdowns pinned hand.
- `tests/playtest/games.acceptance.test.ts` (TASK-1.16): AC#6 sit-and-go (pinned run values).
- `tests/table/next-hand.acceptance.test.ts` (TASK-3.4): a pinned 60-hand sequence (hand 5 seat 5 now folds).
- `tests/table/short-stack.acceptance.test.ts` (TASK-3.21): the "e2e seed" pinned seats and pots.
- Possible: `tests/playtest/check-styles.acceptance.test.ts` (TASK-6.11) failed with bots-on-actions alone and
  passed with the full prototype. Re-check it.
- Slow group (TLH_SLOW_TESTS=1): `tests/bots/style-bands.acceptance.test.ts` (TASK-6.16, TASK-6.17) **will fail**
  (Q-2). Results for the other slow files are in the Open questions note.
- E2E with seeded hands may move, e.g. `e2e/short-stack.spec.ts` (TASK-3.21, same seed as the unit test above). The
  build must run `npm run e2e` and re-baseline only seeds whose bot actions changed.
- Unlocked: `tests/advice/postflop.test.ts` (3 rule tests), `tests/bots/maniac.test.ts`, `tests/bots/rock.test.ts`.

Each locked edit keeps the test's stated behaviour. The expected advice becomes
`recommend(view, { ...BOT_ADVICE, equity: BOT_EQUITY })`, or pinned values are re-derived from the new rules. The
build records every locked edit in the build notes with its reason.

### Error handling and configuration
- No new errors. `R` is always ≥ 0. Inputs without `valueThresholdPct` fall back to 50.
- The action-range path's existing RangeError fallbacks (TASK-7.5 A-6) now also run for bots, so a bot never throws
  where it did not before.

## 6. Behaviour specification

### SPEC-01: Root cause and fix approach are written up with evidence
- Verifies: AC#1
- Behaviour: Given this spec's §1a, When the build lands, Then `docs/advice/postflop-rules.md` has a section "Why
  bots almost never folded (TASK-7.32)". It names both causes with the measured numbers: baseline WTSD 94.2 with
  98.0% of facing-bet decisions not folding; average equity 63.5/65.3/67.8 against required 11.4/13.2/9.6;
  action-ranges-only WTSD 44.5; final 100,000-hand stats. It also names the rule ids and thresholds involved
  (`pot-odds-call` at `call ÷ (pot + call)`, value threshold 50) and the chosen fix. The task's implementation
  notes link to it.
- Verification: manual `docs/advice/postflop-rules.md` section present with the numbers above; `backlog task view TASK-7.32 --plain` notes reference it

### SPEC-02: Bots read opponents' action ranges with the typical-player basis
- Verifies: AC#2
- Behaviour: Given a pinned 6-max turn view where the hero (seat 3) faces a bet with an under-pair, `'unseen'`
  advice says `call` and `'actions'` advice says `fold`, When `decideTag(view)`, `decideRock(view)`,
  `decideCallingStation(view)` and `decideManiac(view)` run without a generator, Then each returns
  `recommend(view, { opponentRanges: 'actions', equity: BOT_EQUITY }).move`, which is fold. Also,
  `BOT_ADVICE` deep-equals `{ opponentRanges: 'actions' }` (no `observedOpponents`).
- Verification: acceptance `tests/advice/postflop-folding.acceptance.test.ts::bots use action ranges with the typical-player basis`

### SPEC-03: A turn call counts the river big bet
- Verifies: AC#2
- Behaviour: Given the §5 worked example (6 seats, $4/$8, turn, pot $36, call $8, hero stack $100, villain not all
  in), When `recommendPostflop` runs, Then `requiredEquityPct` is 26.7 and `requiredCountsRiverBet` is true. With a
  stack of $12 it is 23.1. With every opponent all in it is 18.2 and the flag is false. The same price on the flop or
  river follows `call ÷ (pot + call)` with the flag false.
- Verification: acceptance `tests/advice/postflop-folding.acceptance.test.ts::the turn price counts one river big bet`

### SPEC-04: Raising for value needs more than 65% against callers; betting still needs more than 50%
- Verifies: AC#2
- Behaviour: Given a stub equity function, When the hero faces a bet with calling-range equity 65.0, Then the rule is
  not `value-raise` and `valueThresholdPct` is 65. With 65.1 → `value-raise`. With nothing owed and 50.1 →
  `value-bet` with `valueThresholdPct` 50. With nothing owed and 50.0 → `check-free`.
- Verification: acceptance `tests/advice/postflop-folding.acceptance.test.ts::value raise needs more than 65 percent and value bet more than 50`

### SPEC-05: Explanations state the price and threshold that applied
- Verifies: AC#2
- Behaviour: Given the SPEC-03 turn spot with 22.0% equity and no outs, When the explanation is built, Then it is the
  Q-3 pot-odds-fold sentence with `26.7%`, names the river bet, and has at most 3 sentences. Given a `value-raise`
  spot, Then the threshold shown is `65.0%`. Flop and river explanations are unchanged.
- Verification: unit `tests/advice/postflop.test.ts::explanations name the river bet and the 65 percent raise threshold`

### SPEC-06: Grading follows the threshold that applied
- Verifies: AC#3
- Behaviour: Given a recommendation `call` with `valueThresholdPct` 65 and vsCalling 60.0, When the user raises,
  Then the grade is `minor`, `aggression-margin`, margin 5.0. Given a hand-built input without the field and
  vsCalling 60.0, Then the margin is 10.0 (from 50). Given the SPEC-03 spot with equity 22.0, When the user calls,
  Then the grade is `call-fold-margin` with margin 4.7 (26.7 − 22.0), minor.
- Verification: acceptance `tests/advice/postflop-folding.acceptance.test.ts::grading uses the price and threshold that applied`

### SPEC-07: All-TAG bots fold after the flop at a realistic rate (fast check)
- Verifies: AC#2
- Behaviour: Given `runPlaytest({ hands: 2000, seed: 42, size: 6, game: 'cash' })` (all TAG), When the style stats are
  summed over every seat, Then WTSD is between 30.0 and 50.0, and VPIP and PFR are inside the 6-max healthy ranges.
  The test runs in the normal suite in under 10 s.
- Verification: acceptance `tests/advice/postflop-folding.acceptance.test.ts::2,000 all-TAG hands reach showdown far less often than before`

### SPEC-08: 100,000 all-TAG hands sit inside all five 6-max healthy ranges (slow)
- Verifies: AC#2
- Behaviour: Given `TLH_SLOW_TESTS=1`, When `runPlaytest({ hands: 100000, seed: 42, size: 6, game: 'cash' })` runs and
  the stats are summed over every seat, Then VPIP, PFR, Aggression, WTSD and W$SD, each rounded to 0.1, lie inside
  `HEALTHY_RANGES['6-max']` (inclusive), and each is logged as `TAG 6-max <stat>: <v> (healthy <low>–<high>)`.
  Expected values: about 22.2 / 16.2 / 64.3 / 40.4 / 51.5. The test is skipped without the variable and listed in
  `npm run test:slow`.
- Verification: acceptance `tests/advice/postflop-folding.acceptance.test.ts::AC#2 TAG 6-max all five style stats are inside the 6-max healthy ranges (100,000 hands, seed 42)`

### SPEC-09: Golden suites pass, and every re-pin is justified
- Verifies: AC#3
- Behaviour: Given the fix, When `npx vitest run tests/golden` runs, Then every golden test passes. Every spot or
  graded example whose id, action, grade or margin changed is listed under "Changes from TASK-7.32 (WTSD fix)" in
  `docs/advice/golden-spots.md`, with its old and new id and a one-sentence reason. The postflop file still holds 120
  spots with the same street, size and action counts as the Coverage section, and preflop spots are unchanged.
- Verification: command `npx vitest run tests/golden && git diff --stat main -- tests/golden/preflop-spots.json`

### SPEC-10: Every other check stays green
- Verifies: AC#3
- Behaviour: Given the fix and the locked-test re-baselines listed in §5, When the full suite, lint and typecheck run,
  Then all pass. Every locked edit is listed with its reason in the build notes.
- Verification: command `npm test && npm run lint && npm run typecheck`

## 7. Edge cases
- Hero all in after calling, or every opponent all in, on the turn: R = 0, classic price (SPEC-03).
- Hero stack after the call is below a big bet: R = the remaining stack (SPEC-03).
- Non-6-max tables: the action model falls back to unseen starts plus narrowing (TASK-7.5 A-3), now also for bots.
  The turn price and VR apply at every size. Covered by the existing `tests/playtest/all-sizes.acceptance.test.ts`
  (no pinned decisions).
- Multiway sampler failures: the existing fallbacks (TASK-7.5 A-6) are now used by bots. Covered by the playtest
  invariants (zero violations) in SPEC-07 and SPEC-08.
- Value test exactly at the boundary (65.0 / 50.0): SPEC-04.
- Hand-built grade inputs without `valueThresholdPct`: SPEC-06.

## 8. Security considerations
N/A. No new input, storage, network or dependency. Bot randomness is unchanged (REQ-028.1). Bots still never read
observed stats or style labels (REQ-029.2, REQ-035.3; SPEC-02).

## 9. Non-functional
- Bot speed: the action-range path adds `estimateOpponentRanges` plus up to two fallback runs. Measured: 100,000
  all-TAG hands took 109 s user CPU in the prototype (~1.1 ms/hand). The existing slow throughput checks
  (`tests/playtest/throughput.acceptance.test.ts`, `lineup-throughput`) must still pass (`npm run test:slow`).
- Determinism: same seed → same output (`playtest.acceptance` AC#3); the output itself changes (A-6).
- The fast check (SPEC-07) must stay under 10 s so the normal suite is not slowed noticeably.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6`
- New tests: `tests/advice/postflop-folding.acceptance.test.ts` → SPEC-02, 03, 04, 06, 07, 08. Updates to
  `tests/advice/postflop.test.ts` → SPEC-05.
- Also run: `npm run test:slow` (SPEC-08, throughput, and the known style-bands failure per Q-2) and `npm run e2e`.
- End-to-end for the Judge:
  1. `npm run -s playtest -- --hands 10000 --seed 42 --size 6`: the summary shows far fewer "Ended at showdown"
     than today's run.
  2. `TLH_SLOW_TESTS=1 npx vitest run tests/advice/postflop-folding.acceptance.test.ts`: all five stats are logged
     inside range.
  3. In the app, play a 6-max hand, reach a turn facing a bet with a weak pair, and open the hint: it shows the
     raised price and names the river bet.

## 11. Open questions
- [NEEDS CLARIFICATION: Q-1 — Approve the fix approach D-1? It changes advice the user sees. Turn calls cost more:
  required equity on the turn counts one river big bet, amending REQ-033.1. Raising for value needs more than 65%
  against callers, amending REQ-033.2 (betting stays above 50%). Bots switch to action ranges. Recommended: approve.
  It is the only measured variant inside all five ranges (100k: 22.2/16.2/64.3/40.4/51.5), and the hints already
  use action ranges. Alternatives: (b) bots on action ranges only, with no advice-rule change (WTSD ~44, so AC#2
  fails unless the 6-max WTSD range is widened to 30–46); (c) VR 70 instead of 65 (also inside: 64.3/40.5).]
- [NEEDS CLARIFICATION: Q-2 — The Mixed line-up drifts out of the REQ-027 bands, because bots now fold to the
  Maniac's bets and Maniacs take over the replaced seats. Seed 42 at 10k hands: TAG PFR 12.0 and Aggression 34.8,
  Rock VPIP 7.6 and Aggression 31.8. How should this be handled? Recommended: (a) create a follow-up story (high
  priority) "Keep every bot style inside its band in the Mixed line-up now that bots read opponents' actions". This
  story accepts that the slow-only locked `tests/bots/style-bands.acceptance.test.ts` and the manual `style-bands.yml`
  workflow fail until then, recorded in the build notes. Alternatives: (b) rebalance in this story (the approach is
  unknown and scope would roughly double); (c) choose Q-1(b) — it drifts too, so this does not help.]
- [NEEDS CLARIFICATION: Q-3 — Wording for the turn price in the hint and review explanations. Recommended: in the
  pot-odds sentences, replace "Pot odds, {def:pot-odds}, ask for {required}" with "Pot odds, {def:pot-odds},
  counting the big bet you will likely face on the river, ask for {required}" when `requiredCountsRiverBet`. The
  value-raise sentence keeps its template with `{threshold}` = 65.0%. Alternative: a separate fourth sentence
  (exceeds REQ-037's 3-sentence limit in fold-implied cases).]
- Note: a partial slow-group run on the prototype (79 tests done, stopped early) also failed
  `tests/playtest/games.acceptance.test.ts` AC#6 10,000-hand variant (TASK-1.16, already listed) and
  `tests/bots/maniac.test.ts` (unlocked, already listed). The remaining slow files were not observed; the build must
  run `npm run test:slow` in full.

## 12. Clarifications log
See `doit/TASK-7.32/qa.md`.
