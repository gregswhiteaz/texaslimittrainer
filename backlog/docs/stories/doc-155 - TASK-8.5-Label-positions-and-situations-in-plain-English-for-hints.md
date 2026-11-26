---
id: doc-155
title: 'TASK-8.5: Label positions and situations in plain English for hints'
type: other
created_date: '2026-11-26T07:04:00Z'
updated_date: '2026-11-26T07:04:00Z'
---
# TASK-8.5: Label positions and situations in plain English for hints

Status: Done · Completed: 2026-11-26 · Epic: TASK-8 — Ask for a hint · Milestone: m-1 · Requirements: REQ-042.6, REQ-032.2, REQ-061.2 · Branch: doit/TASK-8.5

## What was asked
AC#1: given each position id (UTG, HJ, CO, BTN, SB, BB) and each situation id, a label request returns the approved English label (for example "the cutoff", "facing a raise and calls"). This was follow-up 3 of doc-14 (from TASK-7.2). Spec: doit/TASK-8.5/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `positionLabel` returns the existing `CHART_POSITIONS` entry (approved in TASK-8.1 Q-1); no second table | yes | Keeps hint and labels in step | Add a separate position table |
| A-2 | Labels cover all 9 `Position` ids and all 6 `Situation` ids, not just the six 6-max ids | yes | `Position` is one union; a partial Record would not typecheck | Restrict to 6-max ids |
| A-3 | Labels are lower-case phrases with no final punctuation | yes | Matches `CHART_POSITIONS`; joins after a position without recasing | Sentence-case labels |
| A-4 | No runtime guard for unknown ids | yes | Typed closed unions | Throw `RangeError` |
| A-5 | Functions in `explain.ts`, copy in `explanations.ts` | yes | Follows TASK-8.1 D-6 (REQ-061.2) | New `labels.ts` |

## Clarifications and decisions
Both questions were auto-accepted in autopilot (recommended option); please review them.
- Q-1 (auto-accepted): situation wording. unopened "in an unopened pot"; limpers "facing one or more limpers"; raise "facing a raise"; raise-and-calls "facing a raise and calls"; re-raise "facing a re-raise"; blind-defence "defending the blind against a raise".
- Q-2 (auto-accepted): no display change. The hint card, chart basis line and review panel are untouched; the labels are available only through the two functions. The explanation's first sentence already describes the situation.
- D-1: wording per Q-1. D-2: no display change per Q-2. D-3: `chartBasisText` uses `positionLabel` internally, with unchanged output.

## What was built
- `src/advice/explanations.ts`: new `SITUATION_LABELS: Readonly<Record<Situation, string>>`.
- `src/advice/explain.ts`: new `positionLabel(position)` (returns `CHART_POSITIONS`) and `situationLabel(situation)`; `chartBasisText` now reads its position text through `positionLabel`.
- `tests/advice/labels.acceptance.test.ts` (new): pins all labels.
- `docs/advice/explanations.md`: "Position and situation labels" paragraph.
- Example: `positionLabel('CO')` = "the cutoff"; `situationLabel('raise-and-calls')` = "facing a raise and calls". No new dependencies, no configuration.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance: labels each 6-max position | PASS | tests/advice/labels.acceptance.test.ts |
| SPEC-02 | AC#1 | acceptance: labels each situation (also the key set) | PASS | same file |
| SPEC-03 | AC#1 | acceptance: LJ/MP/UTG+1 labels; chart basis equals `positionLabel` for all 9 positions | PASS | same file |

- Build gate: `npm test` 319 files passed / 6 skipped, 1442 tests passed / 48 skipped; lint, typecheck and format clean.
- Judge round 1: PASS (test suite PASS, end-to-end PASS, no unproven AC). No item failed.

## Review
Code and security reviews, round 1: no BLOCKER or MAJOR findings. Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- NIT (code): the chart-basis loop compares `chartBasisText` against `positionLabel`, so it would not catch a revert to reading `CHART_POSITIONS` directly (output stays identical). Label values are pinned absolutely in SPEC-01 and SPEC-03, and `explain.test.ts` pins the chart basis output. No action.

## How to try it
`npx vitest run tests/advice/labels.acceptance.test.ts tests/advice/explain.test.ts`, or `npm test`.

## Run metrics
Questions 2 (auto-accepted) · assumptions logged 5 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · sendbacks 0 · changed lines about 83 added across 4 files (budget 4 files / 90 lines).

## Known limitations and follow-ups
- `situationLabel` has no app consumer yet, because Q-2 kept the display unchanged. The labels are tested but not shown to the player.
- [trainer] Show `situationLabel` (for example "from the cutoff, facing a raise") on the hint card and review entries, if the product owner wants it. No existing task owns this: TASK-8.4 and TASK-9.9 cover approximate and short-stack labels only. It needs a new task, or an AC on TASK-8.4 for the hint card and on TASK-9.9 for the review.
- Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
None. The run was smooth: one review round, one judge round, no sendbacks.
