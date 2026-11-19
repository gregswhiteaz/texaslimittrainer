# TASK-1.31 — Questions and answers (user, 2026-11-19)

## Q-1 — Message when starting stacks total more than Number.MAX_SAFE_INTEGER
**Answer: recommended** — `RangeError('Stacks must total at most 9007199254740991')`.

## Q-2 — May the builder change TASK-1.21's locked assertion (tests/engine/input-hardening.acceptance.test.ts:92-93)?
**Answer: recommended (adjust it)** — seat 3 at `MAX_SAFE_INTEGER - 800` (table total exactly at the limit) is accepted; seat 3 at `MAX_SAFE_INTEGER` now throws the Q-1 error. Nothing else in that file changes. Record the cross-story locked-test edit in TASK-1.31's notes and unlock with a reason.
