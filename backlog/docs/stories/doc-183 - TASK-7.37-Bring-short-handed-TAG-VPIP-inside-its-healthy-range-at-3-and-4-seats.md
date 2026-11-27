---
id: doc-183
title: >-
  TASK-7.37: Bring short-handed TAG VPIP inside its healthy range at 3 and 4
  seats
type: other
created_date: '2026-11-27T08:42:00Z'
updated_date: '2026-11-27T08:42:00Z'
---
# TASK-7.37: Bring short-handed TAG VPIP inside its healthy range at 3 and 4 seats

Status: Judge PASS r1 (not set Done) · Completed: 2026-11-27 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up from TASK-7.35, doc-158) · Branch: doit/TASK-7.37

## What was asked
Over 100,000 all-TAG cash hands, TAG's VPIP was 31.1 at 3 seats and 28.1 at 4 seats, above the 6-max healthy range of 20-28. AC#1: at 3 and 4 seats, 100,000 hands (opt-in slow group) put VPIP inside 20-28 and keep PFR, aggression, WTSD and W$SD inside their healthy ranges, with before/after figures recorded. AC#2: output at 2, 6 and 9 seats is byte-identical to before. Spec: doit/TASK-7.37/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | At 3 and 4 dealt-in seats, TAG reads the 6-max chart's CO unopened cells in place of BTN unopened and SB unopened. All other spots are unchanged. | yes | Smallest change that puts all five stats inside. BTN only gave 3-seat aggression 66.0 (on the ceiling). SB only gave 3-seat VPIP 28.7 (outside). | Remove `TAG_SHORT_HANDED_SEATS` entries, or change the swapped spots |
| A-2 | "3 and 4 seats" means dealt-in seats (`view.players.length`), as `referenceSizeOf` does. A 6- or 9-seat sit-and-go that shrinks to 3-4 players also uses the short-handed TAG ranges. | yes | The view carries only dealt-in players. TASK-7.35 used the same reading. | Key on table capacity (needs an engine change) |
| A-3 | `tag.json` `description` gains one sentence naming the short-handed exception. It is not shown in the UI. | yes | Keeps the style file honest. | Delete the sentence |
| A-4 | The derived chart keeps the BTN and SB spots' own `justification` text and swaps only `cells`. TAG never shows chart text. | yes | `decideTag` discards the advice explanation. | Author new text |

## Clarifications and decisions
- Q-1 (builder blocked on SPEC-08, auto-accepted, recommended option a): the locked `tests/playtest/summary.acceptance.test.ts` (owner TASK-1.26) has a `withAwards` fixture that copied a hand-1 result. The 4-seat TAG hand-1 play changed, so the old fixture broke. The fixture now drops the copied result's optional `returned`, so the test checks largestPot = award sum independent of TAG play. No assertion was changed or removed. **Flag for user review: this is an edit to a locked test.** Alternatives were re-pinning 140 to 142, or changing the fixture seat count.
- D-1: TAG-only change through the existing `chart` option of `recommend`. The shared 6-max chart and the user's advice are untouched (TASK-7.40 reshapes it).
- D-2: the chart is derived in code from `SIX_MAX_CHART`, so it cannot drift when TASK-7.40 edits the shared chart.
- D-3: the 100k check asserts "inside" and lives in a new opt-in slow file (the TASK-7.35 slow file is locked).
- D-4: byte-identity is proved by a judge-run `cmp` against the base commit, not a pinned hash.

## What was built
- `src/bots/tag.ts`: `TAG_SHORT_HANDED_SEATS` ([3, 4]), `TAG_SHORT_HANDED_CHART` (SIX_MAX_CHART with BTN and SB unopened cells replaced by CO unopened cells) and `tagChartFor(dealtIn)`. `decideTag` passes that chart to `recommend` on preflop views at 3 or 4 dealt-in seats. An explicit `options.chart` still wins. Postflop is unchanged.
- `src/playtest/style-check.ts`: the mixed-spot tally uses `tagChartFor`, so `--check-styles` at 3-4 seats counts TAG's real choices.
- `src/bots/styles/tag.json`: description sentence (A-3).
- Tests: `tests/bots/tag-short-handed.acceptance.test.ts` (fast), `tests/bots/tag-short-handed-playtest.acceptance.test.ts` (slow, added to `test:slow` in `package.json`), `tests/playtest/style-check-short-handed.test.ts` (unit).
- `docs/advice/range-model.md`: new "TAG at 3 and 4 seats (TASK-7.37)" section; the TASK-7.35 VPIP lines note the fix.
- `tests/playtest/summary.acceptance.test.ts`: fixture edit (see Q-1).
- Changed lines: 368 (scope budget 380, 8 files; 9 files changed including the Q-1 test edit).

### Before/after (all-TAG cash, seed 42, every seat)
| Run | VPIP | PFR | Aggression | WTSD | W$SD |
|---|---|---|---|---|---|
| 6-max healthy | 20-28 | 14-22 | 50-66 | 30-42 | 47-57 |
| 3 seats 10,000, before | 31.0 | 21.9 | 65.8 | 40.9 | 52.8 |
| 3 seats 10,000, after | 23.7 | 17.3 | 65.1 | 40.2 | 52.0 |
| 3 seats 100,000, before | 31.1 | 22.0 | 65.9 | 41.7 | 52.7 |
| 3 seats 100,000, after | 23.6 | 17.3 | 65.2 | 41.7 | 52.4 |
| 4 seats 10,000, before | 27.9 | 20.1 | 65.0 | 42.5 | 51.7 |
| 4 seats 10,000, after | 23.6 | 17.5 | 64.5 | 43.6 | 51.3 |
| 4 seats 100,000, before | 28.1 | 20.4 | 65.2 | 41.5 | 52.2 |
| 4 seats 100,000, after | 23.9 | 17.7 | 64.7 | 41.7 | 51.9 |

The 4-seat 10,000-hand WTSD (43.6, above 42) is sampling noise; it is 41.7 at 100,000, which is what AC#1 measures.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | chart differs only in BTN/SB unopened | acceptance (fast) | PASS | judge verdict-1 |
| SPEC-02 | TAG folds cutoff-range folds at 3-4 seats; advice unchanged; 5-6 seats unchanged | acceptance (fast) | PASS | judge verdict-1 |
| SPEC-03 | explicit chart wins; postflop unchanged | acceptance (fast) | PASS (see non-blocking note) | judge verdict-1 |
| SPEC-04 | 100k hands inside healthy ranges | slow acceptance | PASS | 3 seats 23.6/17.3/65.2/41.7/52.4; 4 seats 23.9/17.7/64.7/41.7/51.9 |
| SPEC-05 | style check tally uses the real chart | unit | PASS | judge verdict-1 |
| SPEC-06 | before/after recorded | grep of docs | PASS | table above |
| SPEC-07 | 2, 5, 6, 7, 9 seat output byte-identical; `src/advice` diff empty | `cmp` against base worktree | PASS | judge verdict-1 |
| SPEC-08 | full gates green | `npm test`, lint, typecheck, e2e | PASS after Q-1 | gates build-1, fix-2 |

- Judge: 1 round, PASS; no failed items, no unproven ACs.
- Gates: 2 runs, both PASS.

## Review
Review round 1 was clean: no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `src/playtest/style-check.ts:113` the preflop check is always true there (coverage shows the line uncovered branch).
- MINOR: the postflop half of the SPEC-03 test (tag-short-handed test) cannot fail, because no chart is applied postflop either way (judge J-1-01 agrees).
- NIT: duplicated chart-choice line in `tag.ts` / `style-check.ts`.
- Judge J-1-02 (pre-existing): `--check-styles` at 3 seats fails on TAG aggression 65.5% (2,000 hands) against the style band ceiling of 65.0. The base was already 65.8-65.9. At 100,000 hands it is 65.2, still above the 65.0 style band, although the healthy-range ceiling is 66.

## How to try it
- `npm run -s playtest -- --hands 2000 --seed 42 --size 3 --check-styles`
- Slow 100k check: `TLH_SLOW_TESTS=1 npx vitest run tests/bots/tag-short-handed-playtest.acceptance.test.ts` (or `npm run test:slow`).
- Fast tests: `npx vitest run tests/bots/tag-short-handed.acceptance.test.ts tests/playtest/style-check-short-handed.test.ts`.

## Run metrics
Questions asked: 1 (auto-accepted) · assumptions logged: 4 (state.json counts 0) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 368.

## Known limitations and follow-ups
- [trainer] Re-measure 3- and 4-seat TAG stats (the slow test) after TASK-7.40 reshapes the 6-max chart; owner TASK-7.40 (add as an AC).
- [trainer] TAG aggression at 3 seats (65.2 at 100k, 65.5 at 2k) exceeds the `--check-styles` style band ceiling of 65.0, though it is inside the healthy ceiling of 66. Decide whether to widen the TAG style band at 3 seats or tune TAG; pre-existing, so `--check-styles --size 3` still exits non-zero.
- [trainer] Pin the postflop half of the SPEC-03 test so it can fail (for example assert a postflop view where a different chart would change the decision, or drop the claim); owner TASK-7.37 follow-up.
- Sit-and-go tables that shrink to 3-4 players use the short-handed TAG ranges (A-2); not separately measured.
- Not tracked (infra, below the value bar): the always-true preflop check at `style-check.ts:113` and the duplicated chart-choice line are cosmetic and caused no failure.

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-08 listed `summary.acceptance.test.ts` as expected to pass unchanged, but it depended on 4-seat TAG hand-1 play, so the builder blocked. At spec time, grep locked tests that run the affected size with fixed seeds and list them as likely edits.
- A SPEC item whose test half cannot fail (SPEC-03 postflop) passed spec and judge. The spec template could ask each behaviour for a named input where the old and new behaviour differ.
- state.json counted `assumptions: 0` although spec.md logs four; the counter is not updated from the spec table.
