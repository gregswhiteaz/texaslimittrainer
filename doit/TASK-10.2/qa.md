# TASK-10.2 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Stored marker for the forced fold (persisted format): optional top-level `forcedFold: true`, written only on the left hand; no DB version bump; existing records stay valid and byte-identical
**Answer: auto-accepted (recommended)** — persisted-format change listed for review.

## Spec Detective notes
- A-1..A-7 accepted. User-visible copy listed for review (A-3): heading "Leave now? Your hand will be folded.", buttons Cancel (focused) and Confirm, Escape = Cancel.
- Locked edits (D-5), new requirement behaviour — nothing loosened:
  - tests/ui/screen-list.acceptance.test.ts (TASK-2.15): dialog list gains LeaveDialog
  - e2e/play-money.spec.ts (TASK-2.15): the walk also opens and checks leave-dialog during hand 14, then Cancel (strengthening)
  - e2e/table-display.spec.ts:195 (TASK-3.3): leaving with the user to act now confirms the dialog and expects a 1-hand report
**Answer: auto-accepted (recommended)** — cross-story locked edits listed for review.

## Build note
- tests/ui/play-money.test.ts (unlocked unit test, owner TASK-2.15) pins fixtures against the real SCREEN_LIST; added a LeaveDialog fixture and "LeaveDialog" to its expected lists; no assertion removed.
- Engine: applyAction's settling tail moved into a shared settle helper used by forceFold; applyAction must behave identically (playtest output must be byte-identical to main).
**Answer: auto-accepted (recommended)** — recorded deviations.
