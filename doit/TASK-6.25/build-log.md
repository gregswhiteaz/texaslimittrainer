# TASK-6.25 build log

## BUILD (2026-11-24)

What was done
- Replacement keeps the busted bot's style in `nextHand` and in `runPlaytest`; deleted `drawReplacementStyle`,
  `replacementStyles`, `replacementGenerator` and the replay-code throw (A-1, A-3).
- Retuned `maniac.json` (postflop call→raise 0.2, new fold→call 0.8, description) and `rock.json` (value bar 80,
  range additions exactly as spec §5). P1 values used unchanged (A-5 not needed: no seat within 0.3 of an edge).
- REQ-007.5 amended, REQ-007.7/007.8 retired, changelog 1.11; postflop-rules.md sentence replaced.
- Re-pinned the locked tests listed in qa.md one for one; assertion counts kept or raised in every edited file
  (maniac.acceptance 115→119, style.test 72→73, bots/replacement.acceptance 17→18, all others equal).
- New `tests/playtest/mixed-composition.acceptance.test.ts` (SPEC-04).

Commands and results
- `npm run typecheck` — clean. `npm run lint` — clean (eslint + prettier --check).
- `npm test` run 1: 1 failed / 1309 passed / 45 skipped (285 files). The failure was a 30 s timeout of
  `check-styles.acceptance … band edges are inclusive …` (30.5 s). Run 2: 1310 passed / 45 skipped, that test 28.7 s.
  See the timing note below.
- `npm run build && npx playwright test` — 304 passed, 16 skipped (53 s).
- `npm run playtest -- --hands 10000 --seed 42` — exit 0, Invariant violations: 0.
- SPEC-06: all-TAG 2,000-hand seed-42 output SHA-256 = d9800984…b8a3 (unchanged).
- SPEC-02 seed 42 via CLI (100k, --check-styles): Style check: passed.
  TAG 20.4/14.6/59.5, Station 60.5/7.2/18.7, Maniac 56.1/53.2/82.3, Rock 8.7/7.2/50.1.
- `npm test` run 3: 1 failed (same test, 32.8 s timeout) / 1309 passed / 45 skipped.
- `npm run test:slow` — 19 files, 95 passed (1,120 s). Style-bands (3 seeds) and check-styles 100k (seeds 42, 7,
  1234: exit 0) pass. Per-style margins to the nearest band edge (min over seeds):
  TAG VPIP +2.4, PFR +0.6, AGG -5.5; Station VPIP -4.5, PFR -2.8, AGG -6.3; Maniac VPIP +5.8, PFR -6.8, AGG -2.7;
  Rock VPIP +0.7, PFR +1.2, AGG -4.4.
  seed 42: TAG 20.4/14.6/59.5, Station 60.5/7.2/18.7, Maniac 56.1/53.2/82.3, Rock 8.7/7.2/50.1
  seed 7: TAG 20.6/14.8/59.3, Station 60.2/6.8/18.4, Maniac 56.1/53.2/82.2, Rock 8.8/7.3/49.5
  seed 1234: TAG 20.6/14.8/59.3, Station 60.3/7.1/18.2, Maniac 55.8/52.9/82.2, Rock 8.8/7.3/50.6

Blocked (blocked.json): the locked fast test check-styles › "band edges are inclusive…" (owner TASK-6.11,
FAST_TIMEOUT_MS 30 s) now takes 28.7–32.8 s inside the full parallel `npm test` (base 19.7 s; 6.5 s alone vs 4.2 s
base). Its Soft 300-hand runs keep 3 Calling stations under the Q-1 same-style rule, so they do more equity work.
Recommended fix: unlock under TASK-6.11 and raise FAST_TIMEOUT_MS to 60_000.
