# TASK-7.6 — Questions and answers (2026-11-22)

## Q-1 — Content plan (heads-up 6 spots + full ring 41 spots, original, justified, width bands; user reviews afterwards)
**Answer: auto-accepted (recommended)**

## Q-2 — Full-ring structure: 9 positions (UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB); 10-handed's two earliest seats use UTG
**Answer: auto-accepted (recommended)**

## Q-3 — Heads-up/full-ring default opponent ranges: defer to a follow-up; keep the every-unseen-combo fallback meanwhile
**Answer: auto-accepted (recommended)**

## Q-4 — Locked TASK-6.6 test tests/playtest/lineup.acceptance.test.ts
(1) line 72 Line-up note `toBeDefined()` → `toBeUndefined()`; (2) the AC#6 10,000-hand 9-seat Tough test becomes opt-in
slow (`it.runIf(SLOW)`), with a small 9-seat check kept on every push (SPEC-09).
**Answer: user — approve both (recommended).**

## Q-5 — Throughput/output changes accepted; no equity speed work here; measure `playtest:million -- --lineups` in the
build and open a perf follow-up only if CI would exceed 15 min.
**Answer: user — accept, measure (recommended).**
