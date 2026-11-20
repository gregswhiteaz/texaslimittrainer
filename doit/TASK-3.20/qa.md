# TASK-3.20 — Questions and answers (autopilot run, 2026-11-20)

No `ask` items from the spec writer.

## Q-1 — May this story change TASK-3.5's locked tests (e2e/cards.spec.ts, e2e/cards.visual.spec.ts, tests/ui/playing-card.acceptance.test.tsx)?
Options: (a) yes, as the ACs require — strengthen the checks, remove only the glyph-fit unit test that AC#4 permits removing [Recommended]; (b) put all new checks in new files and leave the weak ones in place.
**Answer: auto-accepted (recommended)** — (a). Recorded with `doit.py unlock TASK-3.5 … --reason "TASK-3.20 AC#1-4 (autopilot) …"`.
