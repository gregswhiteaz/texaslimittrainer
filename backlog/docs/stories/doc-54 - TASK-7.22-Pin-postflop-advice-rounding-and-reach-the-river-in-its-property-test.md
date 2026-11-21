---
id: doc-54
title: >-
  TASK-7.22: Pin postflop advice rounding and reach the river in its property
  test
type: other
created_date: '2026-11-21T03:19:00Z'
updated_date: '2026-11-21T03:19:00Z'
---
# TASK-7.22: Pin postflop advice rounding and reach the river in its property test

Status: Done · Completed: 2026-11-20 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: n/a (follow-up from TASK-7.3, doc-17) · Branch: doit/TASK-7.22

## What was asked
Two test gaps left by the TASK-7.3 review and judge (J-1-01, J-1-02): (1) no test needed the `+ 1e-9` nudge in `toPct`; (2) the AC#3 hidden-card property never folded, stopped on the flop or turn only, and never ran its `fc.pre` discard. Spec: doit/TASK-7.22/spec.md.

## Assumptions made without asking — please review
All are test-only and reversible by editing the new test file. The run logged 0 assumptions in state.json, but the spec's table has five.
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Hero" is the seat to act at the stop point; "non-hero folding" means a folded seat other than `view.seat` | yes | The locked property advises whoever is to act | Fix hero to seat 3 |
| A-2 | Discard path is shown by counting runs where `toAct === null` before `fc.pre` | yes | `fc.pre` exposes no skip count | Use `fc.check(...).numSkips` |
| A-3 | Folds chosen like any legal action (index `choices[step] % options.length`) | yes | Simplest change; measured to reach all streets | Lower fold probability |
| A-4 | `numRuns: 60, seed: 7322`, 80 choices, stopAt 0..23 | yes | Under 1 s; covers the longest capped hand | 40 runs |
| A-5 | Nudge pinned at all twelve points 0.5005..0.5115 (50.1..51.2), plus a guard that `Math.round(0.5005*1000)/10` is 50 | yes | These are the only (n+0.5)/1000 points where the nudge matters | Pin only 0.5005 |

## Clarifications and decisions
No questions asked.
- D-1: keep the nudge and pin it. Removing it would change shown percentages (0.5005 would show 50.0, not 50.1) and could flip a tie-call.
- D-2: new file rather than editing the TASK-7.3 locked test, so the original 6-live-player property keeps running.
- D-3: new file tagged `acceptance`, so it is locked after the first green build.

## What was built
No production code changed; no new dependencies.
- `tests/advice/postflop-coverage.acceptance.test.ts` (new, 110 lines): AC#1 pins `toPct` at the twelve half-way points; AC#2 is the every-street property (folds allowed, stop point 0..23, 60 runs, seed 7322). It asserts legal advice and the rule/rounding consistency of the TASK-7.3 property, plus that runs reached flop, turn and river, folded non-acting seats, and hit the discard path.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Twelve-point nudge pin plus guard | Pass | Judge round 1 PASS |
| SPEC-02 | AC#2 | Property over all streets with legal-advice assertions | Pass | Judge round 1 PASS |
| SPEC-03 | AC#2 | Coverage assertions (streets, folded seats, discards) | Pass | Judge round 1 PASS |
- Build gate run 1: PASS. `npm test` 108 files, 378 passed / 6 skipped; lint and typecheck clean; 110 changed lines vs budget 130; 1 file vs budget 1.
- Judge: 1 round, PASS, no unproven ACs.

## Review
Round 1 (code and security): no findings.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`npx vitest run tests/advice/postflop-coverage.acceptance.test.ts`

## Run metrics
Questions 0 · assumptions logged in state 0 (5 in spec) · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 110.

## Known limitations and follow-ups
- Spec scope concern, recorded not fixed: doc-17 and the TASK-7.3 spec (A-4) justify the nudge with 0.1665, but 0.1665 rounds to 16.7 without the nudge too. The correct examples are 0.5005..0.5115, which this task pins. The nudge's rationale text in doc-17 is stale. [trainer] Correct that A-4 rationale in doc-17 (owner: none; docs-only, one line).
- Nothing else.

## Lessons for the factory (proposals — not applied)
- Spec rationale for a numeric workaround should cite a measured case that fails without it; the TASK-7.3 rationale was never checked, and it took a follow-up to find out.
