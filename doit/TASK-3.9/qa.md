# TASK-3.9 — Questions and answers (overnight autopilot, 2026-11-23; user's unattended rule)

## Q-1 — Persisted hand-record format (DB tlh-trainer v1, store `hands`, key [sessionId, handNumber], fields per spec D-1; cards as engine ints, completedAt ISO-8601 UTC)
**Answer: auto-accepted (recommended)**

## Q-2 — Write failure before TASK-13.3: no next hand dealt (auto or button), result stays, Leave table works, console.error logged
**Answer: auto-accepted (recommended)**

## Q-3 — New dev dependency fake-indexeddb 6.2.8 (Apache-2.0, no deps, Vitest only; free)
**Answer: auto-accepted (recommended)** — no cost; dev-only.

## Block 1 — CompletedHand.seats gains botId: locked tests/table/session.acceptance.test.ts (TASK-3.1) and unit tests/stats/style-stats.test.ts literal need the field
Option 1 (recommended): re-pin both mechanically (acceptance expected seats Ava 1, Ben 2, Cal 3, Dee 4, You null, Eli 5; unit literal botId null / 1). Count kept.
**Answer: auto-accepted (recommended)** — acceptance file unlocked under TASK-3.1.
