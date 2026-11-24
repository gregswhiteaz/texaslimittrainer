# TASK-3.12 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Stored decision entry shape (persisted format): compact entry — street, user action, recommended action, alternative, rule id, basis, equity %, required equity %, per-opponent basis, explanation, grade {grade, ruleId, marginPts}, hinted
**Answer: auto-accepted (recommended)** — persisted-format choice listed for review.

## Q-2 — AC#6 seat bound: accept seats 1–10 (the hand record's seat bound), not 1–6
**Answer: auto-accepted (recommended)** — AC#6 reworded in Backlog ("from 1 to 10 (the table seat bound)"); listed for review.

## Q-3 — Locked tests/storage/hand-records.acceptance.test.ts:72-75 (owner TASK-3.9): one-line change taking `decisions` out of `rest` and checking its length
**Answer: auto-accepted (recommended)** — unlocked under TASK-3.9 with reason "TASK-3.12 Q-3"; cross-story locked edit listed for review.

## Q-4 — Older stored records without `decisions`: reject on read (`Invalid hand record: decisions`); no UI reads stored records yet; migration is REQ-054's job; nothing is deleted
**Answer: auto-accepted (recommended)** — listed for review.

## Spec Detective notes
- A-1..A-7 accepted. Snapshot supply in the app stays with TASK-8.1; review panel reading stored decisions stays with E09.
