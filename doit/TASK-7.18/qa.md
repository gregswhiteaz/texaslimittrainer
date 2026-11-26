# TASK-7.18 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Early abort in sampledEquity (z = 8, checked every 8,192 rejections; same RangeError sooner; no successful result changes)
Options: yes [Recommended]; smaller rejection cap for the calling-range run (changes advice); skip calling-range run at 7+ opponents (changes advice).
**Answer: auto-accepted (recommended)**.

## Q-2 — 15 untimed warm-up calls per scenario in both perf tests
Options: yes [Recommended]; keep 1 warm-up (AC#1 fails); wall-clock timing.
**Answer: auto-accepted (recommended)**.

## Q-3 — How slow test files set their own timeout once the global 30 s testTimeout is removed
Options: one line per file `vi.setConfig({ testTimeout: 30_000 })`, timeout-only locked edit [Recommended]; per-test timeout args; a second Vitest project; 4,000 ms threshold.
**Answer: auto-accepted (recommended method), with a safer threshold.** CI runners are slower than the M4 Pro reference Mac and this project has had CI timeouts before (TASK-1.56), so a file at 2.0 s locally can exceed the 5 s default on CI. Use a 1,000 ms threshold under coverage (≥5× headroom) to pick the files. Every affected locked file is unlocked under its owner for a timeout-only edit (adds `vi.setConfig`, no assertion touched).

Unlocked (Q-3): 32 owner entries across 30 locked files listed in spec §10.
