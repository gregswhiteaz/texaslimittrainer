---
id: doc-76
title: 'TASK-6.4: Face a Maniac that bets and raises where TAG would check or call'
type: other
created_date: '2026-11-22T01:15:00Z'
updated_date: '2026-11-22T01:15:00Z'
---
# TASK-6.4: Face a Maniac that bets and raises where TAG would check or call

Status: Done (pending judge) · Completed: 2026-11-21 · Epic: TASK-6 · Milestone: m-1 · Requirements: REQ-026 (026.2, 026.3); band context REQ-027.3, REQ-027.6 · Branch: doit/TASK-6.4

## What was asked
A Maniac (loose-aggressive) bot built on the advice engine, with its deviations in its own style data file. Where the advice is check it bets more than TAG; where it is call it raises more than TAG; on a capped street it calls. Deviation draws use the per-decision seeded generator. Acceptance criteria: (1) file holds parameters and a plain-English description; (2) Maniac bets at more no-bet check points than TAG; (3) raises at more call points; (4) changing the raise probability in the file, with no code change, changes the raise rate; (5) capped street, aggressive draw, so it calls legally. Spec: doit/TASK-6.4/spec.md.

## Assumptions made without asking — please review
All run in autopilot, so Q-1..Q-3 were auto-accepted at the recommended option. `state.json` counts 0 assumptions; A-1..A-8 are in the spec's table.

| ID | Assumption / decision | Reversible? | To reverse |
|---|---|---|---|
| Q-1 (D-1) | Widen the deviation format, keeping `tlh-bot-style` v1 and the entry shape. `advice` is `fold\|raise\|check\|call`, `instead` is `call\|bet\|raise`. Five new triples are added to the existing three: `preflop/fold/raise`, `preflop/check/raise`, `preflop/call/raise`, `postflop/check/bet`, `postflop/call/raise`. A (street, advice) pair appears at most once per file. `tag.json` and `calling-station.json` are unchanged. The unlocked unit case moves `preflop/fold/raise` to `preflop/fold/bet`. | yes | Use a v2 "aggressive" keyword |
| Q-2 (D-2) | Maniac values: preflop fold→raise **0.45**, call→raise **0.6**, check→raise **0.6**, postflop check→bet **0.85**, call→raise **0.85**. Two-Maniac 10k-hand prototype (seed 42, 6-max): **VPIP 56.0%, PFR 53.3%, aggression 84.9%**, 0 violations. | yes | Edit `maniac.json` |
| Q-3 (D-3) | The worker's default bot decision sends `'Maniac'` seats to `decideManiac` (as TASK-6.3 did for the station). The unlocked assertion at `tests/table/advice-service.test.ts` was updated. | yes | Defer to TASK-6.6 |
| A-1 | `decideManiac(view)` with no `random` never deviates. | yes | Make `random` required |
| A-2 | A deviating decision takes exactly one `nextUint32()` draw, even at a capped view where the result is a call. Other decisions draw nothing. | yes | Skip the draw when the move is illegal |
| A-3 | No TAG-style mixing: `mixedSpots` is `[]` and is not read. | yes | Mix when no deviation applies |
| A-4 | In AC#2, "bets" means bet postflop, or raise at the big blind's preflop option in a limped pot. The test counts `bet` or `raise`. | yes | Postflop-only check points |
| A-5 | `decideManiac` takes an optional `style` (default `MANIAC_STYLE`). AC#4 parses a modified JSON copy with `parseStyle` and passes it in. | yes | Temp file plus re-import |
| A-6 | AC#2-4 tests give both bots the same memoized `equity` option, which returns exactly the `computeEquity` result. | yes | Preflop-only points |
| A-7 | AC#4's "raise probability" is `preflop/call→raise`, changed 0.6 to 0.2. | yes | Use the `postflop/call` entry |
| A-8 | The normal-suite seated-Maniac invariant run is 200 hands. The 10,000-hand seated run (0 violations, 125,799 actions, 168 s) is prototype evidence only. | yes | `TLH_SLOW_TESTS`-gated test |

Recorded deviation (SPEC-07): `postflop/call` supports only `instead: raise`, so "same pair repeated with different `instead`" cannot be shown there. The different-instead duplicate is shown with `preflop/fold` (`raise` then `call`). The same-instead `postflop/call` duplicate is also tested. The code review judged this sound.

## Clarifications and decisions
Q-1, Q-2 and Q-3 are in the table above. D-4 (not material): the decision rule below applies to every deviation, so a preflop fold→raise at the cap becomes a call (AC#5). D-5: decision points are collected once from a 200-hand playtest (seed 61); point i uses `views[i mod n]` with code `handReplayCode(6401|6402|6403, i+1)` and a fresh `botRandom(botDecisionSeed(code, view))`.

## What was built
- `src/bots/style.ts`: `DeviationAdvice` widened, new `DeviationInstead`, five new supported triples. Validation rules and messages are unchanged, and `instead` is stored as read.
- `src/bots/styles/maniac.json` (new): description, no mixed spots, five deviations, each with an original justification (enforced by the validator).
- `src/bots/maniac.ts` (new): `MANIAC_STYLE` (validated at import), `ManiacOptions`, `decideManiac(view, {random?, style?, ...RecommendOptions})`.
- `src/table/advice-service.ts`: `'Maniac'` dispatches to `decideManiac`.
- Tests: `tests/bots/maniac.acceptance.test.ts` (locked, 6 tests), `tests/bots/maniac.test.ts`, plus extensions in `tests/bots/style.test.ts` and `tests/table/advice-service.test.ts`. No new dependencies.

### Maniac description (shipped text)
"Maniac (loose-aggressive) plays far too many hands and bets and raises far too often. It starts from the trainer's own advice, like TAG, but often raises hands the advice folds, raises where the advice only calls, and bets most of the time when everyone checks to it. It still calls when the betting is capped and folds after the flop when the price is clearly wrong. Call it down with good hands and re-raise your strong ones."

### Parameters and justifications
| Street / advice → instead | p | Justification (from the file, condensed) |
|---|---|---|
| preflop fold → raise | 0.45 | Raising nearly half of the hands the chart folds more than doubles TAG's range and makes most entries raises, which puts VPIP and PFR inside their bands. |
| preflop call → raise | 0.6 | Most chart calls become raises, so its raises carry little information about hand strength. |
| preflop check → raise | 0.6 | At the big blind with only limpers in, it usually raises its free option, punishing limps. |
| postflop check → bet | 0.85 | Betting almost every time it is checked to is its defining leak: its bets show no strength, so call down lighter. |
| postflop call → raise | 0.85 | Raising most bets it would call grows the pot with drawing and medium hands, so the learner gets value when it raises into strong hands. |

### Decision rule
1. Postflop with nothing owed, the advice is `check` with no equity run (`FREE_CHECK_EQUITY`). Otherwise `recommend(view, options)`.
2. No `random` gives the advice's move.
3. No deviation for (street, advice.action) gives the advice's move, with no draw.
4. One draw `u`. The Maniac deviates iff `u < p × 2^32` (0.45 → 1932735283.2, 0.6 → 2576980377.6, 0.85 → 3650722201.6). If not, it plays the advice's move.
5. When deviating, it plays the legal action of type `instead`. If that action is absent (cap, REQ-016.5 no re-raise, short stack), it plays the legal call. Otherwise it plays the advice's move.

The Maniac never plays an illegal action. Every result comes from `view.legalActions` or is the advice's move.

### Worked examples (all pinned in the locked acceptance test; seat 1; code = `handReplayCode`)
| Ex. | Spot | Code / seed / u | Maniac | TAG |
|---|---|---|---|---|
| A | flop 7h Qh, no bet, check advice | 6401 #1 / 2616838482 / 2049462343 < 3650722201.6 | bet 4 | check |
| B | preflop T8o, owed 4, call advice | 6402 #4 / 4056530141 / 1325301165 < 2576980377.6 | raise 12 | call 4 |
| C | turn 7h Qh, owed 8, call advice | 6402 #2 / 3418715972 / 3612399516 < 3650722201.6 | raise 16 | call 8 |
| D | turn Th 8c, no bet | 6401 #2 / 3001163493 / 4068788660 ≥ 3650722201.6 | check | check |
| E | big blind option JTo, limped | 6401 #8 / 1511878864 / 1323660680 < 2576980377.6 | raise 8 | check |
| F | capped, 82o, owed 14, fold advice | 6403 #2 / 2743905521 / 1644137980 < 1932735283.2 (aggressive) | call 14 (raise illegal) | fold |
| G | capped, 7h Qh, owed 16, call advice | 6403 #181 / 2161863358 / 405360754 (aggressive) and 6403 #1 / 2624173068 / 3679267233 (not) | call 16 both | n/a |

### AC comparison counts (10,000 decision points each; prototype numbers from spec §5)
The tests assert the relations, not exact counts. The build log did not record fresh counts, and they equal the spec's prototype figures only if the acceptance test is unchanged in its inputs.

| AC | Measure | Maniac | TAG / other |
|---|---|---|---|
| #2 | bet or raise at no-bet check points | 8235 | 0 |
| #3 | raises at call points | 6524 | 13 |
| #4 | raises with preflop call→raise 0.2 (no code change) | 5881 | (0.6 → 6524) |
| #5 | capped, 10,000 points | 8902 calls, 1098 folds, 0 raises, all legal | n/a |

### Prototype stats (D-2; seed 42, 6-max, seeded TAG elsewhere)
| Line-up | Hands | VPIP | PFR | Aggression | Violations |
|---|---|---|---|---|---|
| Two Maniacs (seats 2, 4) | 10,000 | 56.0% | 53.3% | 84.9% | 0 |
| One Maniac (seat 2) | 600 | 54.0% | 51.5% | 100% | n/a |
| Six Maniacs | 600 | 55.3% | 42.8% | 65.4% | n/a |

Band (REQ-027.3): VPIP 50-75, PFR 35-60, aggression 65-85. VPIP and PFR are inside it in every line-up. Aggression is inside it for two and six Maniacs but not for a lone Maniac (see follow-up 1). Alternatives measured: without fold→raise VPIP was 22.4%. 0.4 gave VPIP 51.0%. Postflop 0.8 gave aggression 64.2% with six Maniacs. This task asserts none of these bands (that is TASK-6.11 / TASK-6.17).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..06 | AC#1-5, Examples A-G | `tests/bots/maniac.acceptance.test.ts` (locked, 103 asserts) | pass | gates/build-1.json, fix-2.json |
| SPEC-07 | validator | `tests/bots/style.test.ts` | pass | gates |
| SPEC-08 | playtest baseline, seated run | default playtest SHA, plus 200-hand seated-Maniac run | pass | below |
| SPEC-09 | unit | `tests/bots/maniac.test.ts` | pass | gates |
| SPEC-10 | dispatch | `tests/table/advice-service.test.ts` | pass | gates |
| SPEC-11 | checks, boundaries | `npm run lint && npm run typecheck && npm test` | pass | gates |

- `npm test`: 159 files passed / 1 skipped; 557 tests passed / 7 skipped. Coverage 96.98% statements overall, `maniac.ts` 100% statements / 95% branches. Lint and typecheck are clean. `npm run e2e`: 130 passed, 12 skipped (build log).
- Playtest baseline unchanged: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` gives `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (88,920 player actions, 0 violations). It was re-run by the reviewer with the same result.
- Gates: build #1 PASS and fix #2 PASS. Scope budget warn: 762 changed lines vs 750 (+1.6%, mostly the 427-line locked acceptance file); 8 of 8 files.
- Judge: see doit/TASK-6.4/judge/. No judge round exists yet because this doc was written first.

## Review
Round 1: code review 0 blocking, security review 0 findings (clean). Security noted that validation allowlists the triples before the cast and fails closed at import, the dispatch uses strict equality, only the seeded generator is used, and the bot reads only its own view. The reviewer also ran an all-Maniac 6-max run of 150 hands: 0 invariant violations and 0 illegal actions in 2886 decisions. Thirteen no-raise spots (REQ-016.5 or short stack) fell back to the legal call.

### Non-blocking review notes (deliberately not fixed)
- NIT `src/bots/maniac.ts:27`: the `hero === undefined` guard is unreachable (one uncovered branch). It mirrors `calling-station.ts:31`. Left for consistency.

## How to try it
- `npx vitest run tests/bots/maniac.acceptance.test.ts tests/bots/maniac.test.ts`
- `npm run lint && npm run typecheck && npm test`
- Baseline: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` (expect `aacd5e94…e01`).
- Maniacs are not seated in any default line-up. Presets and `--lineup` arrive in TASK-6.6.

## Run metrics
Questions 3 (auto-accepted) · assumptions logged in state.json 0 (A-1..A-8 in spec) · review rounds 1 · judge rounds 0 at doc time · gate runs 2 · escalations 0 · changed lines 762 (8 files).

## Known limitations and follow-ups
1. [trainer] Aggression depends on the line-up until value betting lands (TASK-7.8). A lone Maniac among TAGs never faces a postflop bet, so it measures 100%, above the 65-85% band; two Maniacs give 84.9% and six give 65.4%. Re-measure after TASK-7.8, and make the band proof (REQ-027.3) line-up aware. Owners: TASK-6.11 / TASK-6.17.
2. [trainer] Seated Maniacs make TAG and station seats face postflop bets, so postflop equity runs (~10 ms each) dominate: a 10,000-hand two-Maniac table took ~168 s against ~1 s for all TAG. Plan for this in `--lineup`, the preset line-ups and CI timing. Owner: TASK-6.6.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The spec's measured counts (AC comparison numbers) were not re-recorded by the builder. Ask the builder to log the actual counts from the acceptance run in `build-log.md`, so the documentor does not have to cite prototype numbers.
- A spec requirement ("repeated with different `instead`") was unsatisfiable for one pair. A spec-time check that each stated example is constructible against the validator would have caught it before the build.
