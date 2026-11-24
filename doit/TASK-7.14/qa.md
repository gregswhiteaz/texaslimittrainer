# TASK-7.14 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Full-ring BTN facing a single raise with 88 (AC#7): re-raise. Change BTN "raise" cells 99 and 88 from C to R in src/advice/charts/full-ring.json (77 stays a call), update that chart spot's justification, record fr-btn-raise-88 as raise (isolate the opener, charge the blinds, in position). Fits the chart's stated policy; set-mining odds are small in limit
**Answer: auto-accepted (recommended)** — changes advice users see at full-ring tables; listed for review.

## Spec Detective notes
- A-1..A-8 accepted.
- If the chart change alters a pinned playtest output hash or any locked test's expected advice, re-pin it under its owner (doit.py unlock <OWNER> <file> --reason "TASK-7.14 Q-1"), replacing values one-for-one and keeping the check count; list each in the build log.
