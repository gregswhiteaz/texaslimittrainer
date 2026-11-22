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

## Q-6 — Locked TASK-7.2 test tests/advice/preflop.acceptance.test.ts (AC#6 sandbox file list)
Add src/advice/charts/heads-up.json and src/advice/charts/full-ring.json to the sandbox file list (2 lines, no assertion change).
**Answer: user — approve (recommended).**

## Q-7 — Locked TASK-6.10 test tests/playtest/bot-results.acceptance.test.ts:116 (default seat label at 9 seats)
'Random' → 'TAG' (default seats play TAG at every size now); winrate.ts default style TAG at every size; update the
unlocked tests/playtest/winrate.test.ts:125-127.
**Answer: user — approve (recommended).**

Note: the Q-4 edits to tests/playtest/lineup.acceptance.test.ts were applied by the orchestrator (the builder's edit was refused by a safeguard): `it(` → `it.runIf(SLOW)(` for AC#6 and `toBeDefined()` → `toBeUndefined()` for the Line-up note.
