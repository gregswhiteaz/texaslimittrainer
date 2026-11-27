---
id: doc-193
title: 'TASK-3.24: Decide whether the user gets a Show/Muck choice at showdown'
type: other
created_date: '2026-11-27T18:03:00Z'
updated_date: '2026-11-27T18:03:00Z'
---
# TASK-3.24: Decide whether the user gets a Show/Muck choice at showdown

Status: Done (pending orchestrator close) · Completed: 2026-11-27 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: REQ-019.5, REQ-019.8 (also checked: REQ-019.6, REQ-029.3, REQ-043.6, REQ-024) · Branch: doit/TASK-3.24

## What was asked
A decision spike left over from TASK-1.15, where Q-1 was auto-accepted in autopilot: the user's hand follows the same automatic show/muck rule as the bots. The task asked the user to confirm or change that, with evidence. Spec: doit/TASK-3.24/spec.md (evidence in section 3).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create ... -s accepted`. The evidence goes in the task notes and final summary, because the CLI has no body option. | yes | Same path as decision-1 to decision-5. Decision files must not be hand-edited. | Edit the decision through the CLI if a body option is added. |
| A-2 | `rtm.md` is not edited. Its REQ-019.5 row keeps the old text until the matrix is refreshed. | yes | TASK-7.29 did the same for REQ-035.6. | Regenerate or edit the rtm row. |
| A-3 | The changelog row is 1.17, dated the build day (2026-11-27). | yes | The last row was 1.16. | n/a |

## Clarifications and decisions
- **Q-1: should the user get a Show/Muck choice?** The user chose **A**: keep automatic show/muck for the user's hand, with no Show/Muck control. **There is no follow-up story (Q-1 A).** Options B (offer "Show" for a losing hand) and C (B plus "Show" after an uncalled win) were declined.
- **D-1:** The user's hand shows if it ties or beats the best face-up hand, otherwise it mucks. A hand that wins uncalled is never shown. Recorded as **decision-6** (accepted).
- **D-2:** No product code changes, whatever the answer.
- Evidence behind the recommendation (spec section 3):
  - Bots ignore earlier shown cards (REQ-029.3, decision-1).
  - The user always sees their own cards (REQ-019.6, REQ-043.3).
  - Mucking a hand that can win forfeits the pot.
  - The only visible difference is the "You show" line in the hand-over text.
  - A voluntary show after an uncalled win would need a persisted-format change.
  - A prompt would slow the pace target (REQ-024.6).

## What was built
Documentation only.
- `dreams/limit-holdem-trainer/requirements.md`:
  - REQ-019.5 now says "Each later hand, the user's included". It adds that the user has no Show/Muck control and an uncalled winner is never shown.
  - REQ-019.8 now says "a hand shows" instead of "a bot shows".
  - Changelog row **1.17** added.
- Backlog decision **decision-6**, created through the CLI.
- TASK-3.24 implementation notes, appended through the CLI.
- Nothing changed under src, tests, e2e, tools or docs.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | decision recorded | `backlog decision list --plain` | PASS | decision-6, accepted (build-log.md) |
| SPEC-02 | REQ-019 wording + row 1.17 | `git diff main -- requirements.md` | PASS | 2 lines changed, 1 added; row 1.17 is the last changelog row |
| SPEC-03 | no code change, notes on task | `git diff --stat main -- src tests e2e tools docs` | PASS | empty diff; notes appended |
| SPEC-04 | AC#1 ticked, summary cites ids | `backlog task view TASK-3.24 --plain` | Orchestrator step at finish | n/a |

- Gates: build run 1 and fix run 2 both PASS (test, lint, typecheck; 5 changed lines, 1 file). No new tests, as the spec planned.
- Judge round 1: PASS, no failed items, no unproven AC.

## Review
Round 1 code and security reviews found nothing: all rubric items passed and there were no blocking findings.

### Non-blocking review notes (deliberately not fixed)
None. No MINOR or NIT findings were raised.

## How to try it
- `git diff main -- dreams/limit-holdem-trainer/requirements.md`
- `backlog decision list --plain`

## Run metrics
Questions 1 · assumptions 3 (spec table) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 5 (1 file).

## Known limitations and follow-ups
- No follow-up story (Q-1 A).
- `rtm.md` still has the old REQ-019.5 text (A-2). It is refreshed with the next matrix regeneration.
- Not tracked: nothing else.

## Lessons for the factory (proposals — not applied)
None. The run was clean. The one thing to note is that gate run 2 ("fix") ran although state.json shows no send-backs. It looks like a re-run after the spec edit, and it caused no problem.
