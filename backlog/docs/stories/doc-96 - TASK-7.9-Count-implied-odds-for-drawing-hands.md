---
id: doc-96
title: 'TASK-7.9: Count implied odds for drawing hands'
type: other
created_date: '2026-11-23T08:23:00Z'
updated_date: '2026-11-23T08:23:00Z'
---
# TASK-7.9: Count implied odds for drawing hands

Status: Done · Completed: 2026-11-23 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-033 (033.3, 033.4, 033.5, 033.7), REQ-056.1 · Branch: doit/TASK-7.9

## What was asked
Postflop advice folded any draw whose equity was under the plain pot-odds price. The story adds implied odds: with a flush draw or open-ended straight draw and a card still to come, the price also counts one big bet per opponent still able to pay. A call that pot odds reject but implied odds accept becomes `implied-odds-call`. Every postflop recommendation now names the outs it counted and the implied price. Spec: doit/TASK-7.9/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Pot after calling" = pot (incl. the bet faced) + call. AC#1: 8/36 = 22.2%, implied 8/44 = 18.2% | yes | Same as REQ-033.1 | — |
| A-2 | Opponents counted for the extra bet = live, not all in; none left means the rule doesn't apply | yes | An all-in player can't pay later bets | Count every live opponent |
| A-3 | Rule doesn't apply if the call leaves the hero with no chips | yes | All-in hero can't win later bets | Apply regardless |
| A-4 | Big bet = `stakes.bigBet` on every street, flop included | yes | Hit draws get paid on turn/river big bets | Current street's bet size |
| A-5 | `outs` listed on flop/turn with a counted draw whatever the action; `[]` on river/no draw. `impliedRequiredEquityPct` non-null only when owed > 0, outs exist, payers >= 1, chips behind | yes | One pure definition for TASK-7.10 | Outs only on implied recs |
| A-6 | Compare rounded (tenths) numbers, like `pot-odds-call` | yes | TASK-7.3 Q-2 convention | Unrounded |
| A-7 | `outs` = ascending card ids, union for combo draws, no duplicates | yes | Plain data for the worker | Strings; count only |
| A-8 | AC#3's $12 pot can't occur in a legal $4/$8 hand, so the test hand-edits `pots[0].amount` to 4 | yes | `recommendPostflop` only reads the view | Change stakes |
| A-9 | `postflop-coverage.acceptance.test.ts` (TASK-7.22) not edited; it passes | yes | Locked edits only where something fails | Re-pin pre-emptively |

## Clarifications and decisions
All four questions were auto-accepted at their recommended option (unattended rule).
- Q-1 / D-2: public interface. New rule id, new fields `impliedRequiredEquityPct` and `outs`; `requiredEquityPct` keeps its pot-odds meaning so grading is unaffected.
- Q-2 / D-3: counted draws are flush (9 outs), open-ended straight (8), combo (union, 15). No gutshots, double gutshots, backdoors; outs not discounted.
- Q-3 / D-4: locked re-pins of TASK-7.3 `postflop.acceptance` (AC#1 new keys; AC#2 hero Ah5h to Ad5c so it stays a pot-odds fold) and TASK-7.8 `value-bet.acceptance` AC#9 (new keys plus an `implied-odds-call` branch in its oracle). No assertion dropped.
- Q-4 / D-6: **story correction.** AC#1/AC#3 said the opponent holds {KsQd} and "only the 9 hearts win". Measured with the real equity code, Ah5h vs KsQd on Kh 8h 7c 2d is 27.3% (12/44), because the 3 remaining aces also win. That is above the 22.2% price, so it would be a plain `pot-odds-call` and AC#1 could never show an implied-odds call. The opponent is now {AsKd} (20.5% = 9/44, aces give two pair); every other printed number is unchanged. AC#1/#3 text was updated through the backlog CLI.
- D-1: rule order `value-bet`, `check-free`, `value-raise`, `pot-odds-call`, `implied-odds-call`, `pot-odds-fold`. D-5: bots unchanged; they get the rule through `recommend`.

## What was built
- `src/advice/ranges.ts`: exported `drawOuts(hole, board)`. Flush draw = exactly 4 of a suit including a hole card (9 unseen). Open-ended draw via the shared `openEnderStart` (8 unseen), skipped when a straight is made. `classifyCombo` results unchanged.
- `src/advice/postflop.ts`: rule `implied-odds-call`; fields `impliedRequiredEquityPct: number | null` = call / (pot + call + bigBet x payers), and `outs: readonly Card[]`.
- `docs/advice/postflop-rules.md` (the spec's documentation item): "Draw and outs" and "Implied required equity" definitions, a rounding note, a new `implied-odds-call` rule section with the AC#1 and AC#3 worked examples and a "Why", updated `pot-odds-fold` condition, and "Not applied yet" no longer lists implied odds.
- Tests: new `tests/advice/implied-odds.acceptance.test.ts` (SPEC-01..06, locked); `describe('rule implied-odds-call')` in `postflop.test.ts`; `describe('drawOuts')` in `ranges.test.ts`; unlocked re-pin in `grade.test.ts` (stub equity 0.1 to 0.08, margin 6.7 to 8.7, still minor); the two locked re-pins above.
- Example (AC#1): $4/$8, turn Kh 8h 7c 2d, hero Ah5h, facing $8 into $28: equity 20.5, required 22.2, implied 18.2, call, outs 2h 3h 4h 6h 7h 9h Th Jh Qh. With a $12 pot: required 40.0, implied 28.6, fold.
- No UI wording of outs (TASK-7.10 owns it); no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..06 | AC#1..AC#6 | New acceptance file | pass (6/6) | implied-odds.acceptance.test.ts |
| SPEC-07 | rule precedence/guards | unit `rule implied-odds-call` (6 tests) | pass | postflop.test.ts |
| SPEC-08 | outs detection | unit `drawOuts` (6 tests) | pass | ranges.test.ts |
| SPEC-09 | docs | locked TASK-7.3 AC#5 doc/test consistency | pass | postflop.acceptance.test.ts |
| SPEC-10 | playtest, bands | 10k playtest; style bands | see below | build-log.md |
| SPEC-11 | repo checks | format, lint, typecheck, `npm test` | pass: 202 files, 755 tests passed, 30 skipped, thresholds held | build-log.md |

- Default playtest `--hands 10000 --seed 42`: 0 invariant violations, 14.4 s; SHA-256 `14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48` (was `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98`; the output changes because bots call a few more draws). Million 900-hand run unchanged: `4ff17256…`, 9/9 shards PASS.
- Style bands (VPIP/PFR/AGG), 3 seeds, slow test 3/3 pass (446 s), all inside bands. Seed 42: TAG 22.3/16.4/63.7, Rock 10.1/8.8/48.7, Calling station 58.2/6.4/15.4, Maniac 56.8/54.3/78.7.
- `npm run e2e`: 164 passed, 12 skipped.
- Gates: build #1 failed (changes.md backtick parsing), build #2 passed (540 lines, 9 files); two fix gates after review.
- Judge: see doit/TASK-7.9/judge/ (not yet run when this doc was written).

## Review
Round 1: code and security reviewers, 0 blocking findings. Security: none; the advice reads only the hero's own view and public flags, and the new fields are structured-clone safe.

### Non-blocking review notes (deliberately not fixed)
- MINOR (fixed in-story): misleading comment in `ranges.test.ts` on a made-straight case labelled as "out already seen".
- NIT (fixed in-story): docs value-raise example said "pot-odds rules below"; now "call and fold rules below".
- MINOR (follow-up): `openEnderStart` counts a hole card whose rank only duplicates a board rank, so a straight draw fully on the board (hero 7c 2d on 5h 6s 7h 8d) gets 8 outs. This follows the spec's wording and the existing `hasOpenEnder`; the flush half already excludes board-only draws.

## How to try it
- `npx vitest run tests/advice/implied-odds.acceptance.test.ts`
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`

## Run metrics
Questions 4 · assumptions 9 · review rounds 1 · judge rounds 0 at doc time · gate runs 4 · escalations 0 · changed lines about 540 on the build gate (9 files).

## Known limitations and follow-ups
- [trainer] Board-only straight draws get outs: require a hole rank not also on the board in `drawOuts` only (classifyCombo unchanged) and pin it with a unit case. Owner: TASK-7.28 (already created).
- Not in scope: gutshots and double gutshots, backdoor draws, implied odds for bets/raises, reverse implied odds, naming outs in hints (TASK-7.10), golden spots (TASK-7.14).
- `postflop-coverage.acceptance.test.ts` oracle has no implied-odds branch; fine today, would matter if a future seed reached such a spot (A-9).

## Lessons for the factory (proposals — not applied)
- The story's AC#1 equity (opponent {KsQd}) was wrong and was only caught during prototyping. Proposal: have the spec stage compute worked-example equities with the real code before drafting ACs.
- The first build gate failed on backtick parsing in changes.md. Proposal: the changes.md template should say to avoid backticks, or the gate should tolerate them.
