---
id: doc-169
title: >-
  TASK-10.16: Pin the Hints used tile wording in e2e and reject hints without
  errors
type: other
created_date: '2026-11-26T18:15:00Z'
updated_date: '2026-11-26T18:15:00Z'
---
# TASK-10.16: Pin the Hints used tile wording in e2e and reject hints without errors

## Assumptions (decided without asking — please review)
| ID | Assumption | Reversible? |
|---|---|---|
| A-1 | The e2e expected text uses the singular `decision` when M = 1 and `decisions` otherwise. This matches the TASK-10.7 wording (`1 of 1 decision (100.0%)`). | yes |
| A-2 | The e2e computes the percentage with its own integer arithmetic (half up to tenths). It does not import `bbPer100` from `src`. | yes |
| A-3 | The hints/errors presence check runs before `parseHints`. A report with `hints` and no `errors` fails with field `hints`, whether or not `hints` is well-formed. | yes |

Decisions: D-1 rejects only `hints` without `errors`. It does not enforce the reverse, because reports stored before TASK-10.7 have `errors` without `hints`. D-2 edits the TASK-10.7-locked e2e under its owner and drops no assertion.

## What and why
Two follow-ups from the TASK-10.7 review.
1. The e2e Hints used check took its expected text from `hintTile`, so a wording regression in `hintTile` would still pass. The e2e now builds `N of M decision(s) (P%)` from the stored `hints` counts. The `hintTile` import is gone.
2. `parseSessionReport` accepted a report with `hints` but no `errors`. That report shows no tile, because the tile sits inside the `errors`-gated list. It now throws `RangeError('Invalid session report: hints')`. The app never writes this combination, since `sessionReport` builds both fields together. Only hand-edited or corrupted data is affected.

## Changes
- `src/table/session-report.ts`: new rejection in `parseSessionReport`, and an updated doc comment.
- `e2e/report-hints.spec.ts`: test-local expected string. All other assertions are kept.
- `tests/table/session-report-hints.test.ts`: new test `parseSessionReport rejects hints without errors`.

## Verification
- Judge round 1: PASS, 2 of 2 spec items, mutation-checked.
- CI run 45873286030: green.
- Review round 1: no findings.
- Note: the pinned e2e session has 1 decision, so e2e exercises only the singular wording. Unit tests cover the plural.

## Non-blocking review notes
None.

## Lessons for the factory
None. The run had no send-backs, questions or escalations.

## Follow-ups
None.
