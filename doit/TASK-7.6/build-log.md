## Build (TASK-7.6) — stopped, blocked.json written
- Implemented the source changes (chart types/spots, size and seat mapping, A-2/A-3/A-6, Rock A-4, playtest fallback removal, CLI note/help, pace harness on the production worker) and authored `heads-up.json` (6 spots) and `full-ring.json` (41 spots).
- Authoring notes: both charts written from first principles for this project (no published chart consulted). Full ring starts from a ~9% UTG range (77+, ATs+, KJs+, QJs, JTs, AQo+, edge AJo/66) built to hold at 9 and 10 seats and widens one step per seat; limpers spots isolate with strong pairs/aces and overlimp small pairs and suited hands; facing a raise is mostly re-raise-or-fold; re-raise spots keep most of each opening range. Heads-up raises ~77% on the button (superset of the 6-max BTN opens), completes ~12%, and defends ~88% in the big blind with ~20% re-raises. Measured widths (raise/continue %): every spot inside its §5 band (e.g. FR unopened UTG 9.2, UTG+1 10.7, MP 13.3, LJ 15.5, HJ 18.4, CO 24.6, BTN 37.3, SB 25.8/33.3; FR BB defence 36.3; FR BTN re-raise 27.0; HU BTN unopened 76.5/88.2, HU BB limpers raise 26.4, HU BB defence 19.8/88.2).
- `npx tsc -p tsconfig.json` 0 errors; `npx eslint src` clean.
- `npx vitest run` (non-tooling groups): 13 failed / 532 passed. 12 failures are the unlocked tests the spec says change (grade, preflop-chart, preflop, rock, tag, cli ×2, policy, policy-lineup, runner ×2) and the Q-4 locked lineup AC#6 — not yet updated.
- BLOCKED: the locked TASK-7.2 test `tests/advice/preflop.acceptance.test.ts` "AC#6 passing HandState to the advice API fails typecheck" copies a fixed file list into a sandbox; the two new chart imports in `preflop.ts` are missing there (TS2307), so its control typecheck fails. Not covered by the Q-4 unlock. See `blocked.json`. New tests, the Q-4 edits, playtest timings, e2e and format were not run.

## Build continued (TASK-7.6) — after blocked-1 (Q-6 approved)
- Q-6: added `src/advice/charts/heads-up.json` and `src/advice/charts/full-ring.json` to the AC#6 sandbox file list in locked `tests/advice/preflop.acceptance.test.ts` (2 lines, no assertion changed); AC#6 now passes.
- Q-4 (`tests/playtest/lineup.acceptance.test.ts`): not edited — the orchestrator reported its unlock as still pending, and an attempted edit was refused by the permission system. Its AC#6 (`toBeDefined()` on the Line-up note) is the one failing test.
- Updated the 11 unlocked tests (assertions replaced, none just deleted) and wrote the three new test files (see changes.md).
- Judgment call: SPEC-02 says "the six situations each appear in every size's list", but §5's heads-up list has no `raise-and-calls` (with one opponent nobody can call a raise before the hero acts again). The test asserts all six at full ring and the five reachable ones at heads-up.
- SPEC-09 time: the 27 line-up runs alone (30 hands each, real equity) take ~6.6 s on this machine (Mixed at 10 seats ~2 s). With computeEquity memoized in the test (identical results), the AC#11 test takes ~5.6 s incl. the CLI check, slightly over the §9 ≤ 5 s target; hands per run kept at the spec's 30.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 187 files (184 passed, 1 failed, 2 skipped); 679 tests: 665 passed, 1 failed (locked lineup AC#6, Q-4 pending), 13 skipped. 79 s.
- `time npm run -s playtest:million -- --lineups`: PASS, 1,000,000 hands, 0 violations; 50.5 s wall, 463 s user (14-core Apple Mac). About 7.7 CPU-min, so roughly 2–4 min on a 4-vCPU runner, well under the 15-min D-7 threshold: no perf follow-up.
- `npm run -s playtest:million -- --hands 900`: PASS, 9/9 shards, 0 violations; 0.44 s wall; stdout sha256 `fee5dbb1…` (twice, deterministic; TASK-6.9 baseline `1b561d21…` no longer applies, as expected).
- SPEC-15: `--hands 10000 --size 2` exit 0, 0 violations (1 s); `--size 9` exit 0, 0 violations (1 s); `--size 10 --lineup mixed` exit 0, 0 violations, no Line-up note (7 s).
- `npm run e2e`: 142 passed, 12 skipped (31 s). SPEC-13 `TLH_SLOW_TESTS=1 npx playwright test e2e/rapid-pace.spec.ts -g "at 10 players"`: chromium passed (7.9 s), webkit skipped; `grep -rn "tlh-test-pace-advice\|pace-advice.worker" e2e src` finds nothing.
- BLOCKED (blocked.json): the playtest bot-results report still labels default seats at sizes ≠ 6 as `Random` (`src/playtest/winrate.ts:65`), although they now play TAG. Fixing the label breaks locked `tests/playtest/bot-results.acceptance.test.ts:116` (TASK-6.10), which asserts `Random` at 9 seats.

## Build continued (TASK-7.6) — after blocked-2 (Q-7 approved)
- Locked-test edits (Q-4 in `tests/playtest/lineup.acceptance.test.ts`, Q-7 in `tests/playtest/bot-results.acceptance.test.ts:116`) were applied by the orchestrator; not touched here.
- `src/playtest/winrate.ts`: default seats labelled `TAG` at every size; the `Random` label and the size parameter (only used for it) removed, so `BotResults(game)`; caller in `src/playtest/cli.ts` updated. `tests/playtest/winrate.test.ts`: the 3-seat sit-and-go rows now expect `TAG`.
- Spec, `--help` text and docs: no remaining mention of `Random` default seats (spec §1 already says TAG everywhere).
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 187 files (185 passed, 2 skipped); 679 tests: 665 passed, 14 skipped, 0 failed.
- `TLH_SLOW_TESTS=1 npx vitest run tests/playtest/lineup.acceptance.test.ts`: 4/4 passed.
- Default 6-max run `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` = `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc` (unchanged). A 9-seat run labels `Bot: Seat 1, TAG, …`.

## Fix r1 (TASK-7.6)
- Item 1: fixed — `src/advice/preflop.ts` `chartSpotOf` returns the viewer's own spot unless it is a missing `limpers` spot (`if (hasSpot || situation !== 'limpers')`). New test `tests/advice/preflop.test.ts` "remaps only a missing limpers spot" (heads-up chart at 6 seats: SB unopened and BTN raise-and-calls are not remapped); verified it fails without the guard (position undefined) and passes with it.
- `npm run format`, lint, typecheck: clean. `npm test`: 187 files (185 passed, 2 skipped); 680 tests: 666 passed, 14 skipped, 0 failed.
