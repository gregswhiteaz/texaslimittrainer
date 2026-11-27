---
id: doc-199
title: >-
  TASK-7.40: Split the 6-max re-raise spots into own-raise-re-raised and
  re-raised-when-I-had-not-raised
type: other
created_date: '2026-11-27T23:56:00Z'
updated_date: '2026-11-27T23:56:00Z'
---
# TASK-7.40: Split the 6-max re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised

Status: Done (pending orchestrator close) · Completed: 2026-11-27 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-032.2 (reworded) · Branch: doit/TASK-7.40

## What was asked
At 6-max, every preflop spot with two or more raises read one `re-raise` spot per seat. The cutoff (CO) continued with 22.5% of hands against an open plus a 3-bet but only 8.4% against a single open. Apply the TASK-7.21 A-2 rule. If the viewer raised and a later raise faces them, they read `re-raise` (now "own raise re-raised"). Every other two-raise spot reads a new `re-raise-not-mine` spot. The chart grows from 26 to 32 spots, with new Rock ranges, golden spots, a label and a context sentence. Heads-up and full ring must not change. The user signs off the 12 new or changed spots, and the slow short-handed playtest stays healthy. Spec: doit/TASK-7.40/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | New situation id is `re-raise-not-mine`. The existing `re-raise` id keeps its name and means "own raise re-raised" at 6-max. | yes | Existing golden spots, Rock pins and 80-90% tests are all own-raise routes, so they stay untouched. The id is internal. | Rename the id (`cold-re-raise`) or use two new ids (re-pins about 20 more locked lines). |
| A-2 | "Viewer made a preflop raise" = a counted preflop `raise` record with `seat === view.seat`. Blinds and voided raises (TASK-10.17) are excluded. | yes | Uses the same filtered list as the raise count. | Count chips invested (rejected in TASK-7.21). |
| A-3 | Rock reads 6-max spots at every table size, so it uses `re-raise-not-mine` only at 3-7 seats. Heads-up and full-ring bot play is unchanged. | yes | Matches AC#6 for the bots. | Pass `'6-max'` into `situationOf` so Rock splits at full ring too. |
| A-4 | TAG does not mix in `re-raise-not-mine` (no `SPOT_TYPES` or `tag.json` entry). | yes | Same as `re-raise`. Two-raise pots are rare. | Add a mixed spot such as `preflop-re-raise-not-mine` at 0.75/0.25. |
| A-5 | Each Rock range is {AA, KK, QQ, AKs, AKo} minus anything TAG folds, and is a strict subset of the TAG spot. Built as AA AKs AKo KK QQ (5 classes) in all six. | yes | Matches existing Rock re-raise ranges and the strict-subset rule. | Copy each seat's Rock `re-raise` range. |
| A-6 | Three golden spots: CO A9o (fold), BB 88 (call), BTN AA (raise). | yes | AC#5 needs at least one per new situation. | One spot only. |
| A-7 | "Before" AC#8 figures come from a worktree of the base commit before any chart edit. | yes | Gives a true before/after. | Record only after-figures. |
| A-8 | Seeded example pins in locked tests (calling-station TASK-6.3, maniac TASK-6.4/6.25, games TASK-1.16) were re-pinned to the same views. Games seed 42 → 43. Added by the Spec Detective after the builder blocked. | yes | The new folds shift TAG's seeded play. No assertion was dropped. Same class as TASK-7.32 and TASK-7.8. | Not practical to avoid. Any change to two-raise advice shifts these runs. |
| A-9 | `src/bots/tag.ts` gets an `as SpotType` cast. This was found in build and is outside spec A-4. | yes | `mixedSpots.get` is keyed by `SpotType` and typecheck failed without it. Same cast as `src/playtest/style-check.ts:119`. No behaviour change. | Add a typed lookup helper instead. |

## Clarifications and decisions
- Q-1 label: "facing a re-raise when you have not raised" (recommended option). The label is kept in `SITUATION_LABELS` but not shown (decision-7).
- Q-2 context sentence: "The pot has been raised more than once and none of the raises is yours, so your hand strength, {def:hand-strength}, must be very high to continue."
- Q-3 authoring rule: each new grid is a subset of that seat's one-raise continue set (raise spot for UTG-BTN, blind defence for SB/BB). Only AA, KK, QQ, JJ, AKs, AKo and AQs may raise, and AA/KK/QQ always raise. Width is 2-8% for UTG-SB and 4-16% for BB.
- Q-4 sign-off: one review before code review. On 2026-11-27 the user signed off the 12 spots and the seeded re-pins as shown, with no tweaks (doit/TASK-7.40/signoff.md).
- D-1 the A-2 rule. D-2 the new spots sit right after the six `re-raise` spots. D-3 `situationOf` falls back to `re-raise` at sizes whose spot list has no `re-raise-not-mine`, which is data-driven and so needs no size check for TASK-7.41. D-4 the existing `re-raise` label and context text stay word for word, because full ring still sends every two-raise route there.
- D-8 CO A9o/A8o (AC#3). In `CO re-raise-not-mine` both fold, which the Q-3 subset rule forces. In the own-raise `CO re-raise`, A9o goes from F to C*/F (CO share now 310/358 = 86.6%, inside the 80-90% rule). A8o stays F.

## What was built
- `src/advice/preflop-chart.ts`: `Situation` gains `re-raise-not-mine`. Six 6-max spots (UTG, HJ, CO, BTN, SB, BB) take the chart from 26 to 32 spots.
- `src/advice/preflop.ts`: `situationOf` returns `re-raise` for two or more raises when one is the viewer's, otherwise `re-raise-not-mine` where the size's spot list has it.
- `src/advice/explanations.ts`: context sentence and label, with the exact Q-1/Q-2 wording.
- `src/advice/charts/six-max.json`: six new grids with justifications. The six `re-raise` justifications are rewritten for own-raise routes only. CO A9o is F → C*/F, and the chart-level text is extended. New widths: UTG 4.2%, HJ 4.5%, CO 5.7%, BTN 7.1%, SB 5.0%, BB 8.4%.
- `src/bots/styles/rock.json`: six Rock ranges (AA AKs AKo KK QQ). `src/bots/tag.ts`: the cast above.
- Tests: new `tests/advice/re-raise-split.acceptance.test.ts` (5 tests), unit bands, three golden spots, and the locked re-pins listed in `changes.md`. Unlocked tests `preflop-chart.test.ts`, `calling-station-draws.acceptance.test.ts` and `cli.test.ts` were also re-pinned.
- Heads-up and full-ring charts are untouched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 10 | AC#1 | New acceptance file and `preflop.test.ts` route cases, including a voided raise | PASS | judge round 1 |
| SPEC-02, 03 | AC#2 | 32 spots, 169 classes each, 80-90% own-raise shares | PASS | judge round 1 |
| SPEC-04, 05 | AC#2, AC#3 | Q-3 widths, subset rule, CO A9o/A8o, justification agrees with grid | PASS | judge round 1 |
| SPEC-06 | AC#4 | Label and context sentence match the approved wording | PASS | judge round 1 |
| SPEC-07, 08 | AC#5 | Rock strict subset and golden spots | PASS | judge round 1 |
| SPEC-09 | AC#6 | Heads-up and full ring byte-identical over 61,125 views | PASS | judge round 1 |
| SPEC-11, 12 | AC#7 | `npm test` exit 0 (build gate: 1557 passed before the A-8 re-pins, all passing after). User sign-off 2026-11-27. | PASS | gates/fix-2.json |
| SPEC-13 | AC#8 | `TLH_SLOW_TESTS=1` slow test, 2/2 passed, all ten figures healthy | PASS | table below |

AC#8 before → after (100,000 hands, seed 42):

| Stat | 3 seats | 4 seats | 6-max healthy range |
|---|---|---|---|
| VPIP | 23.6 → 23.6 | 23.9 → 23.8 | 20-28 |
| PFR | 17.3 → 17.3 | 17.7 → 17.7 | 14-22 |
| Aggression | 65.2 → 65.2 | 64.7 → 64.9 | 50-66 |
| WTSD | 41.7 → 41.7 | 41.7 → 41.5 | 30-42 |
| W$SD | 52.4 → 52.4 | 51.9 → 52.2 | 47-57 |

Judge: PASS in round 1 (13/13 SPEC items, all 8 ACs proven). The builder was blocked once (A-8), then the build and fix gates passed (2 gate runs).

## Review
Round 1: no blocking findings from the code or security reviewers. Security found nothing reachable. The new branch reads only public view fields and a static table.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code): `tests/advice/re-raise-split.acceptance.test.ts:168` has no cap assertion for a not-mine fourth-bet route (spec section 7). It will be added as an AC on TASK-7.41.

## How to try it
- `npm run chart:print 6-max` shows the 32 spots, with `re-raise` and `re-raise-not-mine` side by side.
- `npm test` runs the full suite.
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/tag-short-handed-playtest.acceptance.test.ts` runs the AC#8 slow test.

## Run metrics
Questions asked: 4 (Q-1 to Q-4). state.json counters read 0 because they were not updated. Assumptions logged: 9, of which A-8 came from the Spec Detective and A-9 is new from the build. Review rounds: 1. Judge rounds: 1. Gate runs: 2. Escalations: 0. Builder blocks: 1. Changed lines: 781 (gate count) in 26 changed files per the gate, against a spec budget of 22 files and 700 lines. The raised budget of about 27 files was accepted in A-8. The branch diff is 61 files with 5,196 insertions, which includes the work folder.

## Known limitations and follow-ups
- [trainer] Add a cap assertion for a not-mine fourth-bet route in the not-mine spot. Owner: TASK-7.41.
- [trainer] Full ring still uses today's single `re-raise` grids. Owner: TASK-7.41.
- [trainer] Blind defence is not split by an early or late raiser. Owner: TASK-7.42.
- TAG never mixes `re-raise-not-mine` (A-4). No follow-up needed unless the user wants variety there.

## Lessons for the factory (proposals — not applied)
- The spec's re-pin table missed seeded-play examples in three locked files (calling-station, maniac, games). The builder had to stop. Proposal: when a spec changes any TAG preflop decision, the spec writer should run the full suite on a scratch change and list every failing locked file in the re-pin table up front. TASK-7.32 and TASK-7.8 had the same issue.
- Spec A-4 claimed "no compile need" for `tag.ts` without running typecheck. Proposal: have the spec writer run `npm run typecheck` on a stub of the type change before making claims about compile impact.
- state.json `questions` and `assumptions` counters stayed 0 despite 4 questions and 9 assumptions. Proposal: update these counters whenever the Q&A or assumptions are recorded.
