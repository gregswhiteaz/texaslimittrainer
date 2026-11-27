# TASK-6.30: Decide whether the style check's one-action rule needs a minimum sample for rare mixed spots

Status: In Progress (orchestrator sets Done) · Completed: 2026-11-27 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-027.5, REQ-028.3 (fit criterion), REQ-062.1 · Branch: doit/TASK-6.30

## What was asked
A decision spike (follow-up from TASK-7.46 Q-2, doc-185). `--check-styles` exits 1 when a mixed spot used only one action. Over 100,000 all-TAG hands at 3 seats the TAG `preflop-limpers` spot comes up once (recommended 1, alternative 0), so the run fails although every band holds. The task: measure how often each mixed spot comes up, decide whether the rule needs a minimum sample, record the decision and create the follow-up. No product code changes. Spec: doit/TASK-6.30/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create ... -s accepted`; evidence goes in TASK-6.30 notes and the final summary. | yes | The CLI has no body option; decision-1 to 8 did the same; decision files must not be hand-edited. | Edit the decision by hand (forbidden). |
| A-2 | `rtm.md` is not edited. | yes | TASK-7.29, TASK-3.24 and TASK-7.45 reworded REQs without it. | Edit the rtm row. |
| A-3 | The changelog row is 1.19, dated 2026-11-27. | yes | Last row was 1.18. | n/a |
| A-4 | Figures come from `npm run playtest`, seed 42, one run per cell: all-TAG at 100,000 hands for sizes 2, 3, 4, 6, 9; Mixed 100,000 at size 6; Mixed 20,000 at the other sizes. Probe output is not committed. | yes | Keeps 100k runs few; only TAG has mixed spots. | More seeds or 100k everywhere. |
| A-5 | An honest 75/25 bot shows one action at a spot seen n times with chance 0.75^n + 0.25^n. | yes | Binomial, independent draws per decision. | Simulate. |

## Clarifications and decisions
- Q-1 (user): rule for rare mixed spots. Options: B N = 10, B' N = 20, A keep the rule, C rule only at 6 seats, D share-of-decisions threshold. Answer: **B with N = 10** (recommended), including the report line wording.
- Q-2 (rename the TASK-7.46 slow test, only if A): moot; the follow-up restores the exit-0 assertion.
- D-1: a mixed spot is judged only when recommended + alternative >= 10; spots with 1 to 9 decisions go on a `Not judged (fewer than 10 decisions): <style> <spot>` line and do not fail. Recorded as **decision-9**.
- D-2: this task records the decision and the REQ change; code, CLI text, docs and test re-pins go to one follow-up (**TASK-6.31**).
- D-3: only the REQ-028 fit criterion is reworded; REQ-027.5 is unchanged.

## What was built
No product code. Files changed:
- `dreams/limit-holdem-trainer/requirements.md` — REQ-028 fit criterion now reads "...harness shows each mixed spot type that came up at least 10 times in the run uses more than one action", plus **changelog row 1.19** (2 insertions, 1 deletion).
- decision-9 (accepted), TASK-6.30 implementation notes, and follow-up TASK-6.31, all written through the backlog CLI.

Key evidence (seed 42; details in spec §3):
- All-TAG 100,000 hands: the only one-action failure is 3-seat `preflop-limpers` 1/0. Spots are either common (hundreds to thousands) or near absent (0 or 1).
- Honest-bot false-fail chance at n decisions: 62.5% at 2, 23.8% at 5, 10.0% at 8, 5.6% at 10, 1.0% at 16, 0.32% at 20.
- Smallest spot in the REQ-027 fit-criterion run (Mixed 6-max 100k) is `preflop-raise-and-calls` with 13 decisions, so N = 10 keeps it judged. N = 10 excludes only 3-seat `preflop-limpers` at 100k; N = 20 would also drop 9-seat limpers (10) and the fit-criterion raise-and-calls (13). Review r1 also checked seeds 7 and 1234 (smallest fit spot 13 / 12 / 16 at seeds 42 / 7 / 1234).
- Mixed line-ups at sizes other than 6 already fail the bands, so the one-action rule is not what blocks them.

Follow-up **TASK-6.31** (Low, m-1, 6 ACs): implement the rule in `src/playtest/style-check.ts` (formatStyleReport, oneAction list), print the not-judged line, restore exit 0 in the 3-seat test, re-pin the locked never-mixing case (`mixedSpots(300)`, to about 1,000 hands) under owners TASK-6.11 and TASK-6.25, update usage text/cli tests and docs (`docs/stats/style-stats.md`, `docs/advice/range-model.md`), and cite the REQ-028 fit criterion in the test comment and range-model.md:294.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Q-1 answer is a Backlog decision | CLI check of decision-9 | PASS | judge round 1 |
| SPEC-02 | REQ-028 wording + changelog 1.19 | diff of requirements.md against spec §5 text | PASS | judge round 1 |
| SPEC-03 | No product code; evidence in task notes | diff scope, notes read | PASS | judge round 1 |
| SPEC-04 | One follow-up story | TASK-6.31 record, 6 ACs | PASS (after r1 fix) | review r2 |
| SPEC-05 | AC#1 ticked with pointers | orchestrator step at finish | PASS (judged) | judge round 1 |

- Gates: `doit.py gate` PASS on build and three fix runs (4 gate runs); test, lint, typecheck ok; scope 3 diff lines (1 changed + 1 added, as budgeted).
- Judge round 1: PASS, 5/5, no blocking findings; the judge reproduced the spec counts with a 100k 3-seat run.
- No new tests (spec §10: spike with no code).

## Review
- Round 1 code review: one MAJOR. TASK-6.31's re-pin list named only TASK-6.11 as owner of `tests/playtest/check-styles.acceptance.test.ts`, but the file is also locked by TASK-6.25 (its current sha). Re-pinning after unlocking only under TASK-6.11 would leave `test-integrity TASK-6.25` failing. Fixed by editing TASK-6.31's description and AC#4 through the CLI (owners TASK-6.11 and TASK-6.25, unlock under both; AC numbering kept). Reviewer also verified the re-pin list on a scratch N = 10 run.
- Recorded deviation: the locked spec §3 and §5 still name only TASK-6.11; the TASK-6.31 backlog record is authoritative.
- Round 2: clean. Security review: no findings in either round (no code changed; TASK-6.31 needs its own security review).

### Non-blocking review notes (deliberately not fixed)
- r1 MINOR (fit-criterion minimum shown for seed 42 only) and r1 NIT (cite the fit criterion at test comment and range-model.md:294) were both fixed in r2, via TASK-6.30 notes and the TASK-6.31 description. No MINOR/NIT findings remain open.

## How to try it
- Reproduce the failure: `npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles` (exits 1 today with `One action only: TAG preflop-limpers`; exits 0 after TASK-6.31).
- Read the decision: `backlog decision list`, decision-9; and `backlog task TASK-6.31 --plain`.

## Run metrics
Questions asked: 1 (Q-1; Q-2 moot) · assumptions logged: 5 · review rounds: 2 · judge rounds: 1 · gate runs: 4 · escalations: 0 · sendbacks: 0 · changed lines in tracked product files: 3 (requirements.md).

## Known limitations and follow-ups
- [trainer] Implement the N = 10 rule, not-judged line, 3-seat exit-0 test, re-pins (owners TASK-6.11, TASK-6.25, TASK-7.46), usage text and docs — owned by TASK-6.31 (already created).
- [trainer] TASK-6.31 needs its own security review when built (CLI report logic only, fixed threshold).
- Residual risk: an honest bot seen 10 to 13 times still fails the one-action rule with 2.4% to 5.6% chance, the same as today for those spots.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The spec's "what the change touches" step named one lock owner per test file; the reviewer found a second. Proposal: when a spec lists locked tests to re-pin, have the spec-writer run `doit.py test-integrity` or grep all tasks' locks for each file and list every owner.
