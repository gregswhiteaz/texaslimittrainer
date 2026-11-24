# TASK-10.1 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Report storage (persisted format): new write-once `reports` store (DB v2 → v3, keyed by session id, add-only); report + session `endedAt` written in one transaction; a 0-hand session's record is removed (AC#7 / REQ-044.8)
**Answer: auto-accepted (recommended)** — persisted-format change listed for review. The v3 upgrade only adds a store; no existing data is changed. Removing a 0-hand session is required by AC#7.

## Q-2 — Leave table mid-hand (until TASK-10.2's dialog): end the session at the last completed hand, dropping the unfinished hand like Home does
**Answer: auto-accepted (recommended)** — user-visible behaviour listed for review.

## Q-3 — Report screen exit: add a `Back to Home` button now (TASK-11.6 then only adds View statistics)
**Answer: auto-accepted (recommended)** — small scope addition to this task; noted on TASK-11.6.

## Locked edits (D-4) — expectations replaced by the new required behaviour, nothing loosened
- e2e/rebuy.spec.ts (TASK-3.11), e2e/bust-continue.spec.ts (TASK-9.2): bust-dialog Leave → Session report opens (-$160, -153.8, 0, 13 hands)
- e2e/resume.spec.ts:199 (TASK-2.6): pause via the Home button instead of Leave table (pause/resume intent unchanged)
- e2e/next-hand.spec.ts (TASK-3.4): focused heading after leaving during the result is `Session report`
- e2e/home-control.spec.ts:113 (TASK-2.14): store names ['hands','reports','sessions']
**Answer: auto-accepted (recommended)** — cross-story locked edits listed for review.

## Spec Detective notes
- A-1..A-9 accepted.
