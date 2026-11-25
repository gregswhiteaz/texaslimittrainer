# TASK-11.1 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Filter row (storyboard shows Table size / Game type / Group by; filters are later stories)
Options: leave the row out; each later story adds its own select [Recommended]; disabled row; Group by with one option.
**Answer: auto-accepted (recommended)** — no filter row in this story.

## Q-2 — Chart text and accessible alternative (user-visible)
Options: heading "Major errors per 100 hands", note "Each point is 500 hands. Lower is better.", point hover text "Hands 501–1,000: 1.8", screen-reader label listing all values [Recommended]; visible value list; axis labels; storyboard's "Lower is better." only.
**Answer: auto-accepted (recommended)**.

## Q-3 — Message when stored hands can't be read
Options: "Your statistics could not be loaded." in place of the chart, no totals line [Recommended]; empty state + log only.
**Answer: auto-accepted (recommended)**.

## Q-4 — Locked tests from earlier stories (needed for AC#1, AC#9)
Unlocked: e2e/home.spec.ts (TASK-2.1); tests/ui/screen-list.acceptance.test.ts (TASK-2.15, TASK-10.2); e2e/play-money.spec.ts (TASK-2.15, TASK-10.2). Update expected values; keep every check.
**Answer: auto-accepted (recommended)**.

## Orchestrator note — test cost
The AC#2 3,000-hand check must not slow the normal suite/CI coverage job (TASK-1.56 history; user rule: scale checks opt-in). Prove AC#2's grouping/values in the normal suite through the pure trends module on 3,000 TrendHand summaries (fast), plus a store-level trendData() test on a small set. A store-level 3,000-record read goes in the opt-in slow group with the speed check, unless it runs in under ~5 s under coverage.
