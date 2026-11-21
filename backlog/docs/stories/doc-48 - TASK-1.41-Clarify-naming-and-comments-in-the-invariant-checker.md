---
id: doc-48
title: 'TASK-1.41: Clarify naming and comments in the invariant checker'
type: other
created_date: '2026-11-21T01:34:00Z'
updated_date: '2026-11-21T01:34:00Z'
---
# TASK-1.41: Clarify naming and comments in the invariant checker

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (comment cites REQ-016.1) · Branch: doit/TASK-1.41

## What was asked
Readability-only change to `src/engine/invariants.ts`: rename the `rest` and `others` arrays in `checkStep` (TASK-1.27 review MINOR), and comment why the L4 raise clause exists although L3 makes it unreachable (TASK-1.8 review MINOR). Spec: doit/TASK-1.41/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The comment cites REQ-016.1, says the clause re-checks size independently of `legalActions`, notes it cannot fail once L3 passes, and points to TASK-1.14 for short all-in raises. | yes | Matches the TASK-1.8 review ("keep as a guard, add a comment"). | Edit the comment. |
| A-2 | The byte-identical baseline is the playtest output from the HEAD version of `invariants.ts`. | yes | The playtest is deterministic. | Not needed. |

## What was built
- `src/engine/invariants.ts`: `rest` became `stateChecks` and `others` became `afterChips` in `checkStep` (Prettier wrapped one return line). A 4-line comment now sits above the L4 `if` in `legalActionMessage`. No logic, message, export or test changes. 1 file, 12 changed lines.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | grep: old names gone, new names present | pass | spec-items.json |
| SPEC-02 | AC#2 | grep: comment above the L4 clause names REQ-016.1, `legalActions` and TASK-1.14 | pass | spec-items.json |
| SPEC-03 | AC#3 | `npm test` plus a 10000-hand seed-42 playtest compared byte for byte with the pre-change output | pass | gates/build-1.json, gates/fix-2.json |

Gates passed in 2 runs (build, fix). The judge passed in round 1 with no unproven ACs.

## Review
One review round with no findings, so there are no non-blocking review notes.

## Run metrics
Questions 0 · assumptions logged 2 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 12.

## Known limitations and follow-ups
- None. TASK-1.14 still owns relaxing L4 for short all-in raises (REQ-016.5).

## Lessons for the factory (proposals — not applied)
None. Nothing went wrong or slow in this run.
