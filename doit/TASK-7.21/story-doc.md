# TASK-7.21: Decide whether to split preflop spots by raiser position and re-raise type

Status: Done (decision spike) · Completed: 2026-11-26 · Epic: TASK-7 - Get trustworthy advice · Milestone: m-1 · Requirements: REQ-032.2, REQ-032.6 · Branch: doit/TASK-7.21

## What was asked
Decide whether the preflop chart should stop ignoring who raised (blind defence, facing a raise) and stop lumping "my open was 3-bet" with "cold 3-bet". Record the decision, update the requirements if needed, and make sure CO A9o/A8o are reconsidered when the CO cold-3-bet spot is authored. Spec: doit/TASK-7.21/spec.md.

## Assumptions made without asking - please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Decision recorded via `backlog decision create ... -s accepted` (decision-4); reasons and cost table live in task notes/summary because the CLI has no body option. | yes | Same path as decision-1..3; decision files must not be hand-edited. | n/a |
| A-2 | "Own raise re-raised" = the viewer made a preflop raise and a later raise faces them. All other spots with 2+ raises (cold, called-then-3-bet, limp-then-two-raises) are "re-raise, not my raise". | yes | Keeps REQ-032.6 single-valued and sends the locked TASK-9.1 route (CO cold-calls, BB squeezes) to the cold bucket where folding A9o is natural. | Follow-up spec can refine, e.g. a third "called then 3-bet" bucket. |
| A-3 | Raiser-position cost figures count only cold "facing a raise" spots and the two blind-defence seats; limp-then-raised routes stay one spot. | yes | Task names blind defence and facing a raise; limp-raise routes are rare. | Split every route. |

## Clarifications and decisions
- Q-1: Split "facing a re-raise" into "own raise re-raised" and "re-raise when I had not raised" (+6 spots at 6-max, +9 at full ring).
- Q-2: Split only blind defence into vs early raiser and vs late raiser (+2 spots per chart size); grouping to be confirmed in the follow-up.
- Q-3: Authoring happens in follow-up stories; this task only records the decision and rewords the requirements.
- Decision: decision-4. Chart format version 1 needs no change for any option.

## What was built
Documentation only. `dreams/limit-holdem-trainer/requirements.md`: REQ-032.2 and REQ-032.6 reworded and changelog row 1.13 added. No code, chart, test or range changes. Evidence for the decision: today BB defends the same 46.3% (raises 5.7%) against a UTG open as against a BTN steal, and `situationOf` sends any 2+ raises to `re-raise` regardless of the viewer's action.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | decision record, requirement text, task notes, follow-up stories, AC#2 pointer | Judge round 1 | PASS 5/5 | judge/verdict-1.json |

Gates ran twice (gates/*.json). No code changed, so no new tests.

## Review
No blocking findings. No MINOR/NIT notes were recorded in the artifacts.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
`backlog decision list`, then read decision-4; see REQ-032.2 and REQ-032.6 in `dreams/limit-holdem-trainer/requirements.md`.

## Run metrics
Questions 3 (all answered with the recommended option) · assumptions 3 · review rounds 0 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines about 6 (1 file).

## Known limitations and follow-ups
- TASK-7.40: split the 6-max re-raise spots (own raise re-raised vs not my raise); carries AC#2, reconsidering CO A9o/A8o and updating TASK-9.1's locked review test if advice changes. [trainer]
- TASK-7.41: split the full-ring re-raise spots, after TASK-7.40. [trainer] Overlaps TASK-7.38 (review of heads-up and full-ring charts with the user): full-ring charts will change under 7.41, so review them after it, or fold the review into it, to avoid reviewing grids twice.
- TASK-7.42: split blind defence by early/late raiser at 6-max and full ring; confirm the early/late grouping there. [trainer]
- Possible later extension, not requested: split "raise and calls" and limpers spots by who acted.

## Lessons for the factory (proposals - not applied)
None; the run was clean (no send-backs, no escalations).
