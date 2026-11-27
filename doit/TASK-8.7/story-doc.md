# TASK-8.7: Decide whether hints and reviews show the situation label

Status: Awaiting Done (orchestrator ticks AC#1) · Completed: 2026-11-27 · Epic: TASK-8 — Ask for a hint · Milestone: m-1 · Requirements: REQ-042.6, REQ-043.9, REQ-042.2, REQ-032.2, REQ-061.2 (no change) · Branch: doit/TASK-8.7

## What was asked
A decision spike. TASK-8.5 added `situationLabel()` with approved plain-English labels, but no screen shows them. The task: decide whether the hint card and preflop review entries should show the label, and create a build task if yes. Spec: doit/TASK-8.7/spec.md.

Outcome: **no**. Hints and reviews keep today's text. No requirements change and no follow-up story (Q-1 A).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The decision is recorded with `backlog decision create ... -s accepted --plain`; evidence goes in TASK-8.7's implementation notes and summary, not the decision body. | yes | Same path as decision-1 to decision-6; the CLI has no body option; hand-editing decision files is forbidden. | Add a body through a CLI that supports it, or supersede decision-7. |

## Clarifications and decisions
- **Q-1** Show the situation label on the hint chart line and preflop review entries? Options: A no (keep "From the 6-max chart: raise A9o from the cutoff"); B append as a clause; C separate "Situation:" line. **Answer: A.**
- **Q-2** Blind-defence label wording (only for B/C). **Answer: keep approved label**; moot under Q-1 A.
- **D-1** Keep the chart line unchanged. The explanation's first sentence already states the situation (`PREFLOP_CONTEXT`), and showing the label would repeat it. It would also force re-pinning locked tests (TASK-8.1, TASK-9.3, TASK-7.43) just before the re-raise split changes the situations again. Worst-case B length is 93 characters (about two lines on the 640 px card).
- **D-2** No product code in this task, whatever the answer.
- Recorded as **decision-7**: "Hints and reviews do not show the situation label; the explanation states the situation; no follow-up story (TASK-8.7 Q-1)".

## What was built
Backlog records only, all written through the backlog CLI. Nothing under `src`, `tests`, `e2e`, `tools` or `docs` changed, and `dreams/limit-holdem-trainer/requirements.md` has no diff (REQ-042.6 and REQ-043.9 already match the decision, so no changelog row).
- decision-7 — new, status accepted.
- TASK-7.40 AC#4 and TASK-7.42 AC#3 — reworded, numbers kept, other ACs unchanged. New text: "Given each new situation, When the chart is authored, Then it has a label in SITUATION_LABELS and a context sentence shown in the preflop explanation, both with wording the user approved in this story's Q&A". The label is now defined, not shown. TASK-7.41 untouched.
- TASK-8.7 implementation notes — Q-1 answer and the spec §3 evidence.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | decision recorded | `backlog decision list --plain` | pass | decision-7 accepted |
| SPEC-02 | requirements unchanged | `git diff --exit-code main -- dreams/.../requirements.md` | pass | no diff |
| SPEC-03 | no code change, evidence on task | `git diff --stat main -- src tests e2e tools docs` | pass | empty diff; notes appended |
| SPEC-04 | split ACs reworded | `backlog task view TASK-7.40 / TASK-7.42 --plain` | pass | exact text, other ACs intact |
| SPEC-05 | AC#1 pointers | final summary | pass | cites decision-7, no requirements change, no follow-up story, AC rewording |

Gates: build-1, fix-2, fix-3 all PASS (`npm test`, 0 changed lines). Judge round 1: PASS, no unproven AC or DoD. Build detail: `--remove-ac` plus `--ac` would have appended and renumbered, so the full AC list was resubmitted with only the one text replaced (all ACs were unchecked).

## Review
Round 1: code reviewer all rubric items pass; security reviewer no findings (Backlog records only). No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- NIT `backlog/decisions/decision-7`: empty body sections (Context, Decision, Consequences). Accepted: the CLI has no body option (A-1); the evidence is on TASK-8.7's notes.

## How to try it
`backlog decision list --plain`, `backlog task view TASK-7.40 --plain`, `backlog task view TASK-7.42 --plain`.

## Run metrics
Questions 1 (plus 1 moot) · assumptions 1 · review rounds 1 · judge rounds 1 · gate runs 3 · escalations 0 · changed product lines 0.

## Known limitations and follow-ups
- No follow-up story (Q-1 A). If the label is wanted later, spec §3 lists the pinned tests to re-pin (hint.acceptance, review-numbers.acceptance, labels.acceptance) and notes `chartSpotOf` already returns the situation.
- TASK-7.40 and TASK-7.42 must still ask the user for label and context wording when authoring new situations (owned by those tasks).

## Lessons for the factory (proposals — not applied)
- When TASK-8.5's Q-2 was auto-accepted as "no display change", nothing recorded that no screen shows the labels, so ACs in TASK-7.40/7.42 kept promising a shown label. Proposal: autopilot auto-accepts that leave an approved-but-unused artifact should add a one-line follow-up AC or note.
- The backlog CLI has no decision body option, so decisions land with empty sections. Proposal: record in the doit skill that evidence goes on the task notes, to pre-empt the NIT.
