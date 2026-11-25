# TASK-10.4 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Persisted format: optional `errors: { major, minor }` on the stored Session Report (counts of the user's unhinted Major/Minor decisions), written once at session end in the existing end transaction (TASK-10.3 style pattern)
**Answer: auto-accepted (recommended)** — persisted-format change listed for review.

## Spec Detective notes
- A-1..A-6 accepted. A-2 (rate tiles in their own row after the cash tiles, unlike the storyboard's single row) listed for review. No locked-test edits.

## Build notes
- SPEC-04 (tests/storage/session-end-errors.acceptance.test.ts) takes ~27 s alone / ~44 s in parallel under local coverage, so it has an explicit 120 s timeout. On CI it runs in the uncovered sweep job. Kept in the normal suite per the spec.
- SPEC-09 locates the rate tiles with getByLabel("Volume and errors") because <dl> has no ARIA list role.
**Answer: auto-accepted (recommended)** — recorded deviations.
