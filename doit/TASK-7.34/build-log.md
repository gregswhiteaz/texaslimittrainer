## BUILD (2026-11-26)
- Base playtest (`npm run playtest | shasum -a 256`, before editing, `src/` = main): 6268ce32eca2c4e61b15567822a56e8a8463a1006c378ed19d0e74a36db28fbb. After: identical; `git diff --quiet main -- src/` passes (SPEC-06).
- `equity.perf.test.ts` / `postflop.perf.test.ts`: `OPT_IN` gate (A-1) on all 5 timed tests; `limpedPreflop(seats)`; `HEADROOM_SCENARIOS` + headroom test (SPEC-05 structure checks: 8 × calling range `sampled`, opponents 1 / 8, callAmount > 0 via `slowScenarios`). The timeout (still 120 s) moved to the options argument (equity) and to the describe options (postflop). Without that, prettier re-indents every `it.runIf(...)(...)` body, which would put the scope budget past 2x.
- Deviation, ordering only: `HEADROOM_SCENARIOS` lists the 9-seat spot **before** HU (spec §5 lists HU first). When HU was timed first in a fresh worker (`-t headroom`), its p95 was bimodal: ~9.3 ms normally but 19.6–26.9 ms in 6 of 17 runs (over 18.75), from background JIT/GC work after the short warm-up. Timing the structure checks after the timed run made it worse (4/8 failed). Timing the 9-seat spot first fixed it: 10/10 + 3/3 runs at 9.2–9.5 ms. Same targets and limits, no change to `slowScenarios` or warm-ups.
- SPEC-01: `env -u … npx vitest run <both perf files>` → `Tests 5 skipped (5)`, 0 `p95` lines.
- SPEC-02: test:slow list check OK; `TLH_SLOW_TESTS=1 npx vitest run <both>` → `Tests 5 passed (5)`, 15 p95 lines.
- SPEC-03: `EQUITY_PERF_SCALE=1` equity → 1 passed; `ADVICE_PERF_SCALE=1` postflop → 4 passed; locked `speed-limits.acceptance.test.ts` unchanged vs main and passes (2/2, inside `npm run test:tooling`).
- SPEC-04 (`ADVICE_PERF_SCALE=1 … -t headroom`, CI unset, nothing else running, 3 passes):
  | Pass | 9-seat vs 8 opp p95 (limit 150 ms) | HU facing a bet p95 (limit 18.75 ms) |
  |---|---|---|
  | 1 | 131.50 ms (66% of 200) | 9.28 ms (37% of 25) |
  | 2 | 131.49 ms (66%) | 9.29 ms (37%) |
  | 3 | 132.80 ms (66%) | 9.33 ms (37%) |
  Full-file `ADVICE_PERF_SCALE=1` run: HU 13.97, 6-max 19.88, 10-seat 54.36, value-bet 54.46, actions HU 19.71, actions 3-opp 23.32, 9-seat 131.81, HU (headroom) 9.36 ms. Equity at scale 1: all 7 within target (full ring 53.32 / 80 ms).
- `npm test`: 328 files passed / 9 skipped; 1469 tests passed / 56 skipped; exit 0.
- `npm run test:tooling`: 37 files passed; 120 tests passed / 6 skipped (speed-limits 2/2 pass, unchanged).
- `npm run test:slow` (once): 24 files, 106 tests passed, exit 0, 1286 s real. Perf lines at 20x slack (in parallel with 22 other files): 9-seat 187.45 / 3000 ms, HU headroom 13.22 / 375 ms, full-ring equity 78.57 / 1600 ms.
- `npm run lint`: pass. `npm run typecheck`: pass. `npm run format`: clean.
- Scope: 4 files, 150 changed lines vs budget 90. Over budget, but within the 2x warn band. Most of it is the value-bet test body losing one indent level once its `it.runIf` wrapper fits on one line.
