---
id: doc-204
title: >-
  TASK-7.42: Split blind defence by an early or a late raiser at 6-max and full
  ring
type: other
created_date: '2026-11-28T19:35:00Z'
updated_date: '2026-11-28T19:35:00Z'
---
# TASK-7.42: Split blind defence by an early or a late raiser at 6-max and full ring

Status: In progress (not set Done) · Completed: 2026-11-28 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-032.2 · Branch: doit/TASK-7.42

## What was asked
The small and big blind used to read one `blind-defence` spot for any single raise. So the 6-max big blind defended 46.3% against a UTG open and also against a button open. This story adds a second spot, `blind-defence-early`, for SB and BB at 6-max and full ring (6-max 32 -> 34 spots, full ring 50 -> 52, heads-up unchanged). The new grids are narrower. The old grids become the "against a late raiser" spot. It also adds a label, a context sentence, Rock ranges and golden spots. The user signs off the 8 spots before code review. Spec: doit/TASK-7.42/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | TAG mixes in `blind-defence-early` with the existing `preflop-blind-defence` entry (75/25). One-line mapping in `src/bots/tag.ts`; `SPOT_TYPES` and `tag.json` unchanged. | yes | Keeps the TAG mixed-spot counts in the style checks stable. | Remove the mapping; the early spot is then never mixed. |
| A-2 | 3 golden spots with an early raiser keep their id and fields; only `situation` becomes `blind-defence-early` (`6max-sb-blind-defence-qq`, `fr-sb-blind-defence-ako`, `fr-sb-blind-defence-k9s`). | yes | The golden check needs `situation` = `situationOf`. | Revert the 3 fields (the test then fails). |
| A-3 | 2 golden spots appended: `6max-bb-blind-defence-early-q6s` (UTG raise) and `fr-bb-blind-defence-early-k6s` (MP raise), both fold. | yes | AC#4 needs at least 1 per new situation and size. | Delete the 2 entries. |
| A-4 | TAG before/after figures are informative only (from the opt-in logs), recorded in changes.md. | yes | Same method as TASK-7.41. | n/a |
| A-5 | New test copies the routing helpers; call and raise amounts come from `legalActions`. | yes | Tests do not import each other. | n/a |
| Dev-1 | Spec route B8 `c4 c5 r1` became `c4 c5 f6 r1`, because seat 6 acts before the button at 6 seats. | yes | The spec route was not playable. | n/a |
| Dev-2 | 6 postflop golden spots (`6max-flop-bb-call-j8o`, `6max-turn-bb-check-a3o`, `6max-turn-bb-fold-k3s`, `6max-river-bb-check-53s`, `fr-turn-bb-check-a6o`, `fr-river-bb-fold-43s`) have the hero calling a UTG raise from the BB. The builder made those cells borderline (`F*/C`), so a call grades Minor, not Major. The spots were not edited. | yes | The draft grids made those calls a Major error and failed the locked spots. The user accepted this at sign-off. | Fold those cells firmly and re-pin the 6 spots. |

## Clarifications and decisions
All six questions were answered "Recommended" (qa.md, 2026-11-28).
- Q-1 Seat groups: 6-max early = UTG, HJ; late = CO, BTN, SB, BB. Full ring early = UTG, UTG+1, MP, LJ; late = HJ, CO, BTN, SB, BB. Both UTG seats at 7 and 10 seats are early; no early seat at 3-4 seats; an isolation raise is grouped by the raiser's seat.
- Q-2 Label: "defending the blind against an early raiser". `blind-defence` keeps "defending the blind against a raise".
- Q-3 Context sentence: "Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, but a raiser in an early seat holds a strong range, so you defend with fewer hands than against a late raiser."
- Q-4 Width: late grids keep today's cells (text only). Early grids are a subset of late, never firmer, strictly fewer combos. Bands: 6-max SB 5-9%, BB 28-40%; full ring SB 4-7.5%, BB 20-30%.
- Q-5 Rock ranges: SB early "AA KK QQ JJ TT AKs AQs AKo" (8 classes); BB early the 24-class list in the spec (pairs down to 22, AKs-ATs, KQs KJs QJs JTs, AKo AQo KQo).
- Q-6 One sign-off before code review; the locked re-pins and seeded re-pins were pre-approved (TASK-7.40 A-8 method).
- Chart sign-off (AC#5): the user signed off the 8 spots on 2026-11-28, compromise cells included. TASK-7.38 was noted that its 4 full-ring blind-defence spots were reviewed here.
- D-1 `blind-defence` stays the late spot and heads-up's only blind spot, so the TASK-7.19/7.40/7.41 subset checks and Rock's BB 41-class pin keep their parent. D-2 order puts the early spots before the late ones, so the last spot is still `BB blind-defence`.

## What was built
- Routing: `situationOf` (`src/advice/preflop.ts`) reads the raiser's position with `positionOf({ ...view, seat: raiser }, size)`. When it is in `EARLY_RAISERS[size]` (new export in `src/advice/preflop-chart.ts`) the SB/BB gets `blind-defence-early`; otherwise `blind-defence`. Applies only when exactly one raise is in.
- Spots: `APPLICABLE_SPOTS` gains `SB` and `BB` `blind-defence-early` before the late spots at 6-max and full ring.
- Charts: `src/advice/charts/six-max.json` and `full-ring.json` get 2 new grids each. They continue 6-max SB 6.8% (late 10.7%), 6-max BB 30.3% (46.3%), full ring SB 5.7% (9.2%), full ring BB 24.0% (36.3%). The 4 late justifications are rewritten and each chart-level text gains a clause on the split. Late grids are cell for cell unchanged. `heads-up.json` is unchanged.
- Text: `PREFLOP_CONTEXT` and `SITUATION_LABELS` in `src/advice/explanations.ts`.
- Bots: 2 Rock ranges in `src/bots/styles/rock.json`; the TAG mapping in `src/bots/tag.ts` (A-1).
- Tests: new `tests/advice/blind-defence-split.acceptance.test.ts` (5 tests; 23 routes x 169 classes); unit updates; locked re-pins in 12 files (counts, order lists, situation names, check count kept); seeded re-pins in calling-station, maniac, games (seed 43 -> 45) and calling-station-draws; golden edits per A-2/A-3.
- Size: 31 files outside doit/, +680/-68 lines (spec budget 32 files, 850 lines).
- Unlock history entries were also written to 16 other tasks' `state.json` files by the unlock tool.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance, routes by raiser seat | PASS | 23 routes x 169 classes; judge holdout 108,073 route checks, 0 failures (2-10 seats) |
| SPEC-02 | AC#2 | acceptance, 34/52 spots, order, 169 classes | PASS | chart:print headers; other spots byte-identical to base |
| SPEC-03 | AC#2 | acceptance, width rules plus a mutation | PASS | subset, never firmer, fewer combos, in band |
| SPEC-04 | AC#2 | manual walk of the 8 texts against the grids | PASS | after the r1 text fix |
| SPEC-05 | AC#3 | acceptance, exact label and sentence | PASS | 5,000+ early advices checked by the judge |
| SPEC-06 | AC#4 | acceptance, Rock strict subsets | PASS | lists match D-6 |
| SPEC-07 | AC#4 | golden acceptance test | PASS | 3 re-pinned, 2 appended |
| SPEC-08 | AC#5 | lint, typecheck, `npm test`, diff stat | PASS | 1588 passed, 60 skipped, 0 failed; coverage 92.84% |
| SPEC-09 | AC#5, AC#2 | sign-off package and note | PASS | signoff.md plus the user sign-off |
| SPEC-10 | AC#5 | `npm run test:slow` | PASS | 27 files, 114 tests |

- TAG full-ring 100,000 hands, before -> after: VPIP 14.7 -> 14.2, PFR 11.2 -> 11.2, aggression 65.2 -> 65.0, WTSD 37.6 -> 38.1, W$SD 52.1 -> 52.3. All inside the healthy ranges.
- TAG 6-max 10,000 hands: VPIP 22.0 -> 21.2, PFR 16.3 -> 16.1, aggression 65.2 -> 65.2. All inside the healthy ranges.
- Judge round 1: PASS, 10/10, integrity clean, no findings. No judge failures to fix.
- Gates: 5 runs (build-1, fix-2 to fix-5), all recorded.

## Review
Round 1 (code): 2 MAJOR and 1 MINOR. Security: none.
- MAJOR (six-max and full-ring): the `BB blind-defence-early` text listed AKo among the call hands, but the grid raises AKo. Fixed in r1 by a text-only change (AKo re-raises, the offsuit-ace call group starts at AQ). Grid unchanged.
- MINOR: seat-count wording ("two earliest seats", "four earliest seats") was wrong at 7 and 10 seats. Fixed by naming positions without counts.
Round 2: clean apart from the NIT below. Security clean in both rounds.

### Non-blocking review notes (deliberately not fixed)
- NIT `src/advice/preflop.ts:134`: the raiser's seat is read through `(records[raiseAt] as (typeof records)[number]).seat`. A named local would read better. Left as is (below the value bar).

## How to try it
- `npm run chart:print` and `npm run chart:print full-ring` (headers show 34 and 52 spots; the early blocks show the narrower grids).
- `npx vitest run tests/advice/blind-defence-split.acceptance.test.ts`
- `npm test`; `npm run test:slow` for the opt-in group.

## Run metrics
Questions asked: 6 (in one batch of 4 questions, plus the chart sign-off) · assumptions logged: 5 plus 2 deviations · review rounds: 2 · judge rounds: 1 · gate runs: 5 · escalations: 0 · sendbacks: 0 · changed lines: +680/-68 in 31 files outside doit/.

## Known limitations and follow-ups
- Six early BB cells (K5s-K3s, A6o-A3o, 53s, 43s and similar) are `F*/C` compromises so the locked postflop golden spots stay valid at Minor. If the owner wants those folds to be firm, the 6 postflop spots must be re-authored. [trainer] Decide whether to firm up the borderline early BB cells and re-pin the 6 postflop golden spots (`6max-flop-bb-call-j8o` and 5 others). Owner: TASK-7.38 (full-ring blind-defence dominance work), if the user wants it. Not a real bug today: the user accepted it.
- The test titles in `re-raise-split` and `full-ring-re-raise-split` still say "32 spots" and "50 spots" (the checks are 34 and 52). Cosmetic, not tracked.

### Not tracked (infra, below the value bar)
- The `preflop.ts:134` cast NIT and stale test titles; neither caused a failure.

## Lessons for the factory (proposals — not applied)
- The spec route B8 (`c4 c5 r1`) was not playable at 6 seats. Proposal: the spec author should replay route tables through the engine (a scratch probe) before approval. It cost only a small deviation here.
- The spec probe used draft early grids that folded weaker calls, which hid the 6 postflop golden spots that call a UTG raise from the BB. They failed at the first full build. Proposal: the probe should run the locked postflop golden spots too, and list them in §5 so the sign-off covers the compromise cells up front.
- The builder's first draft text listed AKo as a call hand in two charts (review r1 MAJOR). Proposal: add a script check that every hand named under an action in a chart justification matches the grid.
