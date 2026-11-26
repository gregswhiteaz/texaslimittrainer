# TASK-6.24: Decide TAG aggression headroom against its 65% band ceiling

Status: Done · Completed: 2026-11-26 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-027.1, REQ-027.5, REQ-026.1, REQ-062.1 · Branch: doit/TASK-6.24

## What was asked
Decide what to do about TAG's aggression sitting close to its 45–65% band ceiling (REQ-027.1): widen the band, tune TAG postflop, or document a minimum run length for `--check-styles`. The decision is recorded on the task, and any change is a follow-up story. Spec: doit/TASK-6.24/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Decision recorded via `backlog decision create ... -s accepted`; rationale and measurements live in the task notes and final summary (the CLI has no body option). | yes | Same path as TASK-6.20; decision files must not be hand-edited. | Edit the decision through the CLI later. |
| A-2 | "All-TAG" means a playtest with no `--lineup`. | yes | The only all-TAG mode the CLI offers. | n/a |
| A-3 | Short-run spread measured with seeds 1–20 at 2,000 hands per line-up. | yes | Enough to show the typical range. | Run more seeds or lengths. |
| A-4 | Near-floor readings (Mixed 100k TAG PFR 14.6% vs floor 14%; Rock VPIP 8.7% vs floor 8%) are noted, not opened as a task. | yes | They pass at 100k, where REQ-027 is judged. | Open a spike if a 100k run misses a band. |

## Clarifications and decisions
- Q-1 (user, 2026-11-26): chose option B, keep the band and document the run length.
- D-1: TAG aggression band stays 45–65%; `--check-styles` bands are judged over 100,000 hands. Recorded as decision-2 (accepted). Follow-up: TASK-6.28.
- Measurements were redone on current code, because the task's 67.2% reading came from older code.

## What was built
No project files changed. Backlog records only: implementation notes and final summary on TASK-6.24, decision-2, and follow-up TASK-6.28 (3 ACs, depends on TASK-6.24) to put the 100,000-hand note in the `--check-styles` help text and `docs/stats/style-stats.md`.

Measurements (main a08251c):

| Run | TAG aggression | Notes |
|---|---|---|
| 100k all-TAG, seed 42 | 64.3% | style check passed |
| 100k Mixed, seed 42 | 59.5% | 5.5 points of room; style check passed |
| 2k all-TAG, seeds 1–20 | 63.2–64.9% | 0/20 above 65%; 20/20 failed on "One action only" |
| 2k Mixed, seeds 1–20 | 54.3–63.6% | 0/20 above 65%; 12/20 failed (7 "One action only"; Rock VPIP, TAG PFR and Rock aggression near their limits) |

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC1 | Task notes and final summary checked | PASS | Both tables and the summary are present |
| SPEC-02 | AC1 | `backlog decision list` | PASS | decision-2 accepted, one only |
| SPEC-03 | no requirements change | git diff of requirements.md | PASS | 0 bytes |
| SPEC-04 | follow-up | `backlog task list --parent TASK-6` | PASS | TASK-6.28 once, 3 ACs |
| SPEC-05 | no project change | git diff of src, tests, tools, docs, e2e | PASS | 0 bytes |

`npm test`: 1488 passed, 0 failed. Spot-check runs (all-TAG seed 7, Mixed seed 5) matched the recorded numbers. Judge round 1: PASS (5/5).

## Review
No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- J-1-01 (LOW): the notes' "Raw runs" line is worded as a header with the same facts.
- Backticks dropped and quotes changed in TASK-6.28's description (cosmetic).

## How to try it
`npm run playtest -- --hands 100000 --check-styles` (all-TAG) or add `--lineup mixed`. Use `--hands 2000 --seed N` to see the short-run failures.

## Run metrics
Questions 1 · assumptions 4 · review rounds 0 · judge rounds 1 · gate runs 0 · escalations 0 · changed project lines 0.

## Known limitations and follow-ups
- [trainer] TASK-6.28: document that `--check-styles` bands are judged over 100,000 hands (help text, docs, test assertions).
- Not changed: the 66% all-TAG healthy-range ceiling and the short-run "One action only" failures.
- Near-floor values (TAG PFR 14.6%, Rock VPIP 8.7%) to revisit if a 100k run misses.

## Lessons for the factory (proposals — not applied)
None; the run was smooth. The task's figures were stale, and re-measuring first was what made the decision sound.
