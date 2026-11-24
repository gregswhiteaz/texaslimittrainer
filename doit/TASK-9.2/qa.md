# TASK-9.2 — Questions and answers (autopilot, 2026-11-24)

No ask items. A-1..A-6 accepted.

## Locked edit — tests/ui/bust-dialog.acceptance.test.tsx:63-66 (owner TASK-3.11)
`toContain("Deal next hand")` on a held bust review becomes `toContain(">Continue</button>")` plus `not.toContain("Deal next hand")` (AC#1); the `<dialog` check stays.
**Answer: auto-accepted (recommended)** — cross-story locked edit listed for review.
