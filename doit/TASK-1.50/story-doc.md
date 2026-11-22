# TASK-1.50 — story doc (draft; the documentor completes it)

## CI profile (before)

_Copied verbatim from spec §3.1 (SPEC-01, A-9); recorded before any CI change._

Sources:
- `gh run view 44977960174 --log`: main CI #164, 2026-11-22, the per-test durations of the `npm test` step summed per file.
- Local runs on a 14-core Mac: `npx vitest run --reporter=verbose` with `--coverage`, then with `--coverage.enabled=false`.

**Step times for #164.**
- Job: 19 min 26 s (run created → updated: 1,172 s).
- Test step: 869 s (vitest reports 868.6 s; 161 files passed, 1 skipped).
- E2E: 210 s.
- Setup (checkout, setup-node, `npm ci`): 13 s.
- Lint: 20 s. Typecheck: 9 s. Build: 1 s. Playtest: 3 s.
- Playwright and apt steps: ~39 s.

**Summed per-file test time on CI #164: 805 s.**

| Group | Files | CI s (with coverage) | Share |
|---|---|---|---|
| Bot/engine/playtest sweeps (`tests/{bots,engine,playtest}`) | — | 550 | 68% |
| Process-spawning tooling tests (`tests/{ci,git,toolchain}`) | 30 | 97 | 12% |
| Everything else (advice, ui, table, support, src) | — | 158 | 20% |

**Top files on CI #164 (s, with coverage).**

| File | s |
|---|---|
| `bots/tag-mixing.acceptance` | 131.2 |
| `bots/calling-station.acceptance` | 56.8 |
| `bots/tag.acceptance` | 37.8 |
| `engine/bet-cap.acceptance` | 36.1 |
| `advice/equity.perf` | 36.1 |
| `bots/calling-station` | 34.2 |
| `bots/maniac.acceptance` | 29.9 |
| `engine/side-pots.property` | 29.6 |
| `advice/postflop.perf` | 27.2 |
| `ci/speed-limits.acceptance` | 18.3 |
| `playtest/million.acceptance` | 18.3 |
| `advice/postflop.acceptance` | 17.0 |
| `support/sandbox-timeout.acceptance` | 16.1 |
| `engine/hand-evaluator.perf` | 15.1 |
| `playtest/games.acceptance` | 14.9 |
| `toolchain/boundary` | 14.7 |

**Coverage instrumentation share (local, summed per-file).**
- 353 s with coverage vs 187 s without, so about **47%** of test time is coverage.
- Process CPU: 354 s user vs 182 s.
- Sweeps: 221 → 94 s, a 2.4× slowdown from coverage (`tag-mixing` 4.3×).
- Tooling: 60 → 59 s. Coverage doesn't touch these, because they spawn child processes.

**Projected CI cost after the split (no coverage on sweeps).**
- Sweeps: ≈ 258 s.
- 2 vitest shards: 138 s and 120 s. With 3 shards: 103, 97 and 58 s.
- Unit group with coverage: ≈ 75 s.
- Tooling: ≈ 97 s.
- The critical path becomes e2e at ≈ 4.5 min.

**Coverage on the unit group alone (46 files, measured).**
- Lines: 92.02% global and 97.84% for the headless glob.
- Thresholds: 70% global and 90% headless. Both pass with margin.
- The full suite measures 97.35%.

**Actions usage.**
- `ci.yml`: 164 runs since 2026-11-18, ≈ 2,680 wall-minutes.
- `visual.yml`: 84 runs, ≈ 114 min.
- Billing could not be read: the token lacks the `user` scope.
- See "Scope concerns" in §2.
