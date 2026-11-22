# TASK-7.6: Recommend preflop actions at heads-up and full-ring tables

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-005.4, REQ-032.1, REQ-032.2, REQ-032.4, REQ-032.6, REQ-061.2 · Branch: doit/TASK-7.6

## What was asked
Preflop advice at every table size from 2 to 10. Two new authored charts (heads-up, full ring) in the 13x13 grid format of the 6-max chart. Each size maps to a chart (2 = heads-up, 3-7 = 6-max, 8-10 = full ring), and each seat maps to a chart position by seats before the button. With advice everywhere, the playtest's random-move fallback goes: default playtest seats TAG at every size, and `--lineup` styles play every hand. The 10-player pace e2e runs on the real advice worker. Spec: doit/TASK-7.6/spec.md.

## PLEASE REVIEW: Claude-authored charts
Q-1..Q-3 were auto-accepted. **You should review the charts' content**: `src/advice/charts/heads-up.json` (6 spots) and `src/advice/charts/full-ring.json` (41 spots, 9 positions UTG, UTG+1, MP, LJ, HJ, CO, BTN, SB, BB). Both were written from first principles (no published chart consulted; the judge checks originality from the build log). Measured widths (raise/continue %): full-ring unopened UTG 9.2, UTG+1 10.7, MP 13.3, LJ 15.5, HJ 18.4, CO 24.6, BTN 37.3, SB 25.8/33.3; full-ring BB defence 36.3; heads-up BTN unopened 76.5/88.2, BB limpers raise 26.4, BB defence 19.8/88.2. All are inside the spec bands (tested in `reference-charts.test.ts`). Full-ring layout (9 positions, 10-handed's two earliest seats both play UTG) was auto-accepted as Q-2. Heads-up/full-ring default opponent ranges are deferred (Q-3).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Seat mapping counts dealt-in seats. n=2: button = BTN, other = BB. n>=3: first two after the button are SB, BB; others by k seats before the button, clamped to the chart's earliest position. | yes | Same basis as the old `positionOf`; busted seats don't count. | Name the heads-up button `SB` |
| A-2 | `options.chart` still overrides; a chart whose size differs from the table's throws `RangeError('The <size> chart does not fit <n> dealt-in seats')`. | yes | Keeps TASK-7.2's override; avoids reading wrong positions. | Ignore the override at other sizes |
| A-3 | An earliest seat (UTG at 7 or 10 seats) facing a limp has no `limpers` spot, so it uses the next-later position's limpers spot (6-max HJ, full-ring UTG+1). Only a missing limpers spot is remapped (review R1 fix). | yes | Locked 26-spot 6-max test forbids adding a UTG limpers spot; avoids a `chartCell` throw. | Add UTG limpers spots |
| A-4 | Rock uses its 6-max range at every size (full-ring UTG..LJ use 6-max UTG; heads-up BTN/BB use 6-max BTN/BB), then plays the real chart's move. **Rock is not size-aware** — a known simplification. | yes | `rock.json` is 6-max only. | Author Rock ranges per size |
| A-5 | `ranges.ts` stays 6-max only; its `players.length === 6` guard is unchanged, so non-6 tables still start the range model from every unseen combo (TASK-7.5 A-3). | yes | Q-3 defers new ranges. | Add heads-up/full-ring ranges |
| A-6 | `referenceSizeOf(n)` throws `RangeError('No reference size for <n> dealt-in seats')` outside 2-10. | yes | Engine deals 2-10. | Clamp |

## Clarifications and decisions
- Q-1 (content plan: Claude authors both charts), Q-2 (full-ring 9 positions), Q-3 (defer heads-up/full-ring opponent ranges): auto-accepted as recommended.
- Q-4 (USER approved): edits to locked TASK-6.6 `tests/playtest/lineup.acceptance.test.ts`: Line-up note assertion `toBeDefined()` to `toBeUndefined()`; AC#6 (10,000 hands, 9 seats) becomes opt-in slow (`it.runIf(SLOW)`). A safeguard refused the builder's edit, so the orchestrator applied it.
- Q-5 (USER approved): accept slower `--lineup` runs and changed default output at sizes other than 6; measure the million-hand lineup run.
- Q-6 (USER approved): locked TASK-7.2 `tests/advice/preflop.acceptance.test.ts` AC#6 sandbox file list gains the two chart paths (no assertion changed).
- Q-7 (USER approved): locked TASK-6.10 `tests/playtest/bot-results.acceptance.test.ts:116` default seat label `Random` to `TAG`; `winrate.ts` labels default seats `TAG` and drops its size parameter (`BotResults(game)`); `winrate.test.ts` updated.
- D-5: pace harness uses `src/ui/advice/advice.worker.ts`; `pace-advice.worker.ts` deleted; locked `rapid-pace.spec.ts` untouched.

## What was built
- `src/advice/preflop-chart.ts`: `ReferenceSize` adds `heads-up`/`full-ring`; `Position` adds `UTG+1`, `MP`, `LJ`; `SEATS_BEFORE_BUTTON`; `APPLICABLE_SPOTS` for all three; `parseChart` accepts the three sizes.
- `src/advice/preflop.ts`: `HEADS_UP_CHART`, `FULL_RING_CHART`, `PREFLOP_CHARTS`, `referenceSizeOf`, `chartSpotOf`, generalised `positionOf`; `recommendPreflop` picks the chart from the dealt-in count (legality rules unchanged).
- `src/advice/charts/heads-up.json`, `full-ring.json`: new authored charts with chart-level and per-spot justifications.
- `src/bots/rock.ts` (A-4), `src/advice/ranges.ts` (A-5 retype).
- Playtest: `runner.ts` default policy is TAG at every size; `policy.ts` random fallback removed; `cli.ts` Line-up note removed and help text updated; `winrate.ts` (Q-7).
- `e2e/support/pace-harness.tsx` on the production worker.
- Tests: new `table-sizes.acceptance`, `all-sizes.acceptance`, `reference-charts`; about 11 unlocked tests rewritten where they pinned the old throws/random fallback; locked edits per Q-4/6/7.
- Totals: 15 non-doit files changed in src/e2e/tests per diff stat, about 3,600 lines (about 950 are chart JSON). Gate counted 2,027 changed lines.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | AC#1-8 | `tests/advice/table-sizes.acceptance.test.ts` | pass | build-log, gates |
| SPEC-08, 09 | AC#9, 11 | `tests/playtest/all-sizes.acceptance.test.ts` | pass (SPEC-09 5.8 s vs 5 s target, accepted) | review R1 |
| SPEC-10 | content bands | `tests/advice/reference-charts.test.ts` | pass; originality is judge's manual check | build-log authoring notes |
| SPEC-11, 12 | mapping, Rock | `preflop.test.ts`, `rock.test.ts` | pass | build-log |
| SPEC-13 | AC#10 | Playwright `-g "at 10 players"` | chromium pass (7.9 s); grep for old worker finds nothing | build-log |
| SPEC-14 | checks | format, lint, typecheck, `npm test` | clean; 187 files, 680 tests: 666 passed, 14 skipped, 0 failed | build-log (post-fix) |
| SPEC-15 | DoD#7 | playtests size 2, 9, 10 mixed | 0 violations each | build-log |
- `npm run e2e`: 142 passed, 12 skipped. Slow lineup file with `TLH_SLOW_TESTS=1`: 4/4.
- Throughput (Q-5): `playtest:million -- --lineups` 50.5 s wall, 463 s CPU locally (about 2-4 min on CI), below the 15-min threshold, so no perf follow-up. `--hands 900` hash is now `fee5dbb1…` (old `1b561d21…` retired; deterministic twice). 6-max default 10,000-hand seed-42 SHA unchanged (`442dbf55…`).
- Gates: build-1 PASS, fix-2 recorded. Branch CI #196 green (sweep shard 2 about 4.8 min — watch).
- Judge: see doit/TASK-7.6/judge/.

## Review
Round 1: 0 blocking. Code reviewer MINOR (A-3 fallback applied to any missing spot) was fixed with a guard and a new test that fails without it. Security reviewer: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: SPEC-09 test takes 5.8 s vs the 5 s target (accepted overrun; not asserted).
- NIT: the `computeEquity` memo in `all-sizes.acceptance.test.ts` is sound (pure, seeded); noted for awareness.
- NIT: `defaultPolicyFactory` keeps a now-unused `size` parameter (spec asked for this shape).

## How to try it
- `npm run -s playtest -- --hands 2000 --size 2` (also `--size 8`, `--size 10 --lineup tough`)
- `npm run -s playtest:million -- --hands 900`
- `TLH_SLOW_TESTS=1 npx playwright test e2e/rapid-pace.spec.ts -g "at 10 players"`
- `npm test`

## Run metrics
Questions 7 (3 auto-accepted, 4 user) · assumptions 6 · review rounds 1 · judge rounds 0 so far · gate runs 2 · escalations 0 · changed lines 2,027 (gate count).

## Known limitations and follow-ups
- [trainer] Author heads-up and full-ring default opponent ranges for the range model (ranges.ts); today non-6 tables start from every unseen combo (owner: new story under TASK-7; orchestrator creates).
- [trainer] `npm run chart:print` prints only the 6-max chart; add a size argument so the user can review the new charts in print form. Small, and useful given the charts need user review (owner: TASK-7.6 follow-up or the chart-print task).
- [trainer] Rock uses its 6-max range at other sizes (A-4); per-size Rock ranges if more realism is wanted (low priority; pin the behaviour in a task note).
- The "approximate" label for mapped sizes stays with TASK-7.16.

### Not tracked (infra, below the value bar)
- CI sweep shard 2 at about 4.8 min: no failure caused; watch only.

## Lessons for the factory (proposals — not applied)
- A safeguard refused the builder's locked-test edit even after approval, and three locked tests (6.6, 7.2, 6.10) each needed a separate block-and-approve cycle. Proposal: at spec time, grep for locked tests that pin behaviour this story changes (file lists, labels, notes) and put them all in one approval question.
- The SPEC-09 time budget was set before measuring; propose that specs state time budgets only for tests measured in a prototype.
