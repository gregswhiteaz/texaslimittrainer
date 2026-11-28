# TASK-7.41 changes

## Files
- `src/advice/preflop-chart.ts` — `APPLICABLE_SPOTS['full-ring']` gains the 9 `re-raise-not-mine` spots (UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB) right after the 9 `re-raise` spots (D-2), 41 → 50.
- `src/advice/charts/full-ring.json`:
  - 9 new `re-raise-not-mine` grids and justifications (§5 rule 2: each continue set is a strict subset of the one-raise parent, AA/KK/QQ/AK raise, widths 3.0–5.4% UTG..SB and 6.6% BB).
  - the 9 `re-raise` justifications rewritten for own-raise routes only, each ending with the capped-fourth-bet sentence.
  - `re-raise` grids trimmed or widened to the Q-1 share (C/O 0.825–0.873; outside-open continues removed at LJ, HJ, CO and SB; BTN widened from 0.725 to 0.846). UTG and BB grids unchanged.
  - the chart-level "Once our own raise is re-raised…" sentence extended for the not-mine case.
- `tests/advice/full-ring-re-raise-split.acceptance.test.ts` (new) — SPEC-01 to SPEC-06.
- `tests/advice/reference-charts.test.ts` — bands for the 9 new keys (UTG..SB 2–8%, BB 4–16%); `BTN re-raise` band 5–28% → 25–35% because the Q-1 share puts it at 31.5%.
- `tests/advice/preflop.test.ts` — one 9-seat `situationOf` case (cold open and re-raise before the hijack → `re-raise-not-mine`).
- Locked re-pins from spec §5 (Q-3 approved; each unlocked with `doit.py unlock <owner> <file>`; expected values only, check count kept):
  - `tests/advice/chart-print-sizes.acceptance.test.ts` (TASK-7.27): `checkReview('full-ring', 41)` → 50.
  - `tests/advice/table-sizes.acceptance.test.ts` (TASK-7.6): full-ring length 41 → 50; `SITUATIONS` gains `re-raise-not-mine`; the heads-up reachable set also excludes it.
  - `tests/advice/re-raise-split.acceptance.test.ts` (TASK-7.40): AC#6 re-pinned as listed in the spec (routes read `re-raise-not-mine` with its context sentence, 9-seat sweep sees it, 2-seat sweep does not, full ring 50 and has the situation; title renamed).
  - `tests/golden/preflop-spots.json` (TASK-7.11): 3 spots appended (`fr-co-re-raise-not-mine-ajs` fold, `fr-bb-re-raise-not-mine-99` call, `fr-btn-re-raise-not-mine-aa` raise); existing entries byte-identical.
- `doit/TASK-7.6/state.json`, `doit/TASK-7.11/state.json`, `doit/TASK-7.27/state.json`, `doit/TASK-7.40/state.json` — unlock history entries written by `doit.py unlock` for the four re-pins above.
- `doit/TASK-7.41/changes.md`, `doit/TASK-7.41/build-log.md` — work-folder files. `signoff.md` was written to the scratchpad for the orchestrator to copy into the work folder.

No new dependencies.

## 9-max all-TAG before/after (A-4, SPEC-10)
From `TLH_SLOW_TESTS=1 npx vitest run tests/advice/size-ranges-playtest.acceptance.test.ts`, run on the base commit (separate worktree) and on the final chart.

| stat | before (base) | after (final) | healthy (`HEALTHY_RANGES['full-ring']`) |
|---|---|---|---|
| VPIP | 15.1 | 14.7 | 13–20 |
| PFR | 11.3 | 11.2 | 9–16 |
| aggression | 63.8 | 65.2 | 50–66 |
| WTSD | 38.3 | 37.6 | 28–40 |
| W$SD | 50.9 | 52.1 | 47–57 |

All five stay inside the healthy ranges; the test only logs them and passed on both commits.
