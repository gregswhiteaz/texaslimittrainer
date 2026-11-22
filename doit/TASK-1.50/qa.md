# TASK-1.50 — Questions and answers (2026-11-22)

## Q-1 — Coverage scope (D-2)
**Answer: user — unit group only (recommended).** Thresholds unchanged (70% overall / 90% headless); measured drops 97% → 92%.

## Q-2 — Grouping and shards (D-1)
**Answer: user — 3 groups (unit with coverage; sweeps in 2 shards, no coverage; tooling), new scripts test:unit,
test:sweeps, test:tooling; npm test unchanged (recommended).**

## Q-3 — Tooling gating (D-3)
**Answer: user — own git-diff script tools/ci/tooling-changed.js, no new third-party action; runs when unsure (recommended).**

## Q-4 — Schedule cadence (D-4)
**Answer: user — daily 06:00 UTC, change detector + tooling tests only (~90 min/month) (recommended).**
Note raised to the user: ci.yml used ~2,680 wall-minutes since 2026-11-18 (above the 2,000 free min/month); billing not readable with the current token.

## Q-5 — Check names (D-5)
**Answer: user — README lists the six job names; no aggregate job (recommended).**

## Q-6 — Cross-story edits to four locked tests (D-6)
TASK-1.7 tests/ci/workflow.test.ts (per-job lists, new if: list, timeout 30); TASK-1.39 tests/ci/apt-archives-cache.test.ts
(:90 '20'→'30'); TASK-1.24 tests/ci/branch-protection.acceptance.test.ts (job list, README names); TASK-1.17
tests/ci/million-workflow.acceptance.test.ts (one or more identical checkout pins).
**Answer: user — approve.** Unlocks recorded under each owning task.
