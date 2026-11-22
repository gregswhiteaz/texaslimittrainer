# TASK-1.52: Remove timing-fragile tests that turn CI red on slow runners

Status: Done · Completed: 2026-11-22 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a · Branch: doit/TASK-1.52

## What was asked
Main CI #174 (run 44990101974, attempt 1) failed twice on timing races that passed on re-run: unit test `lineUpPolicyFactory` took 31,483 ms under coverage against the 30 s timeout, and e2e `action-bar-limits` advanced a paused clock by a fixed 1,000 ms before seat 4's bot reply came back from the advice worker (`expectToAct(page,'5')` saw seat 4). Acceptance: no unit test over 10 s (AC#1), no fixed paused-clock budget that waits on a worker reply, proven with delayed replies (AC#2), an audit table of timing use (AC#3, below), CI green on the branch (AC#4). No assertion removed or loosened. Spec: doit/TASK-1.52/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The "story doc" in AC#3 is the audit table (this doc and the task notes) | yes | No other doc existed | Move the table elsewhere |
| A-2 | Unit lineUpPolicyFactory uses fewer hands, same assertions. Final: 6-max 20, 9-max 100, Soft 20 (spec said 40/100/20; trimmed to 20 at the fix-brief because 40 hands took 2.9 s, at the 3 s limit; `not.toEqual` still holds at 20) | yes | Keeps every expect, about 1.7 s | Raise counts in `tests/playtest/policy.test.ts` |
| A-3 | `runUntilMyTurn` bounds: 50 ms slices, 10,000 ms real, **maxFakeMs 600,000 (RECORDED DEVIATION from spec 60,000)**. The 60 s fake bound ran out after ~3 s real, before two 2 s delayed replies could land (SPEC-04 failed on both engines) | yes | Fake time is cheap (~2.6-2.8 ms real per 50 ms slice); the real bound is the true guard | Change default in `e2e/support/paused-clock.ts` |
| A-4 | Extra fake time while a reply is in flight is harmless (no app timer pending, the user's turn starts none) | yes | Keeps the helper simple | — |
| A-5 | "CI on the branch" = a push by the orchestrator | yes | `doit.py commit` never pushes | — |

## Clarifications and decisions
- Q-1: edit the six locked e2e files (action-bar-limits TASK-3.7, action-bar 3.2, table-display 3.3, table 3.1, home 2.1, game-type-choice 2.4), swapping only the clock-advance call. User: approved.
- Q-2 (from review R1 MAJOR): also give the five "play to the end" 400-slice loops (action-bar, table, table-display, next-hand TASK-3.4, review TASK-9.1) the same real-time bound. User: yes, in this story. Owners unlocked.
- D-1: slow unit tests move to `*.acceptance.test.ts` (sweep group, every push, no coverage, 120 s timeout). D-2: one shared helper. D-4: proof by delaying every worker reply 2 s real time via init script, plus a negative control.

## What was built
- `tests/playtest/policy.test.ts`: lineUpPolicyFactory at 20/100/20 hands, all 6 expects kept (1.7 s alone, 1.98 s in the full unit run). `tests/playtest/policy-lineup.acceptance.test.ts`: original 200/500/20 test verbatim (11.2 s locally).
- `tests/bots/calling-station.test.ts`: long test removed; new fast `drawDeviation draws once and compares against p` (1 ms). `tests/bots/calling-station-draws.acceptance.test.ts`: the original draw test verbatim (8.1 s locally).
- `e2e/support/paused-clock.ts`:
  - `runUntil(page, check, {maxFakeMs=600000, maxRealMs=10000, label})` runs 50 ms fake slices, checks before every slice, returns the truthy result, throws `<label> after X ms fake / Y ms real` past either bound.
  - `runUntilMyTurn(page)` = runUntil on "an enabled button in Your actions" (same message as spec).
  - `delayWorkerReplies(ms)`: init script holding back every Worker `message` event and redispatching it after `ms` real ms via a blob timer worker (FIFO).
- Locked e2e files, only clock-advance lines and imports changed: action-bar-limits, action-bar (5 fixed budgets + 2 loops), table-display (2 + 1 loop), table (idle-minutes + `nextTurnPaused` loop, which now throws instead of returning 'timeout'), home, game-type-choice, next-hand and review (`slicesUntil` default and play loops; 4-slice deal-timing checks keep their slice cap).
- Proof specs: `e2e/worker-delay.spec.ts` (SPEC-04 helper reaches turn under 2 s delay; SPEC-05 old 20x50 ms loop fails under the same delay; SPEC-07 throws when turn never comes) and `e2e/worker-delay-hand.spec.ts` (fold and play to the end under 2 s delay via runUntil; control that the old 400-slice loop does not reach the end; fake-bound trip). The second is a separate file because the first was locked.
- No change under `src/`, config, scripts or CI workflow; no new dependencies.

## AC#3 audit (green run = 44990101974 attempt 2; use = duration / effective timeout)
| Group | Test | CI ms | Timeout | Use | Action |
|---|---|---|---|---|---|
| unit | policy.test.ts › lineUpPolicyFactory plays the preset… | 20,045 (31,483 on attempt 1) | 30,000 | 67% | fixed: SPEC-01, full version moved to sweep |
| unit | calling-station.test.ts › draws once only at deviating decisions | 14,377 (22,378) | 120,000 | 12%, > 10 s | fixed: SPEC-02, moved to sweep |
| unit | calling-station.test.ts › seated Calling stations… | 6,983 | 120,000 | 6% | justified (< 10 s) |
| unit | cli.test.ts › rejects every invalid argument | 5,491 | 30,000 | 18% | justified |
| sweep | sandbox-timeout.acceptance › kills a grandchild… | 15,104 | 120,000 | 13% | justified: waits on an intended 15 s sandbox timeout |
| sweep | million.acceptance › byte-identical | 8,674 | 30,000 | 29% | justified |
| sweep | all other sweep tests | ≤ 8,083 | ≥ 30,000 | < 27% | justified |
| e2e | rapid-pace.spec.ts:249 catches a 400 ms wait | 10,700 | 30,000 | 36% | justified (< 50%, bounded by `meterBotAction`) |
| e2e | all other e2e | ≤ 6,200 | 30,000 | < 21% | see clock table |

Paused-clock fixed budgets:

| Site | Owner (lock) | Waits for a worker reply? | Action |
|---|---|---|---|
| action-bar-limits.spec.ts:41 | TASK-3.7 | yes (failed in CI) | fixed: runUntilMyTurn |
| action-bar.spec.ts:156, 178, 217, 226, 238 | TASK-3.2 | yes | fixed: runUntilMyTurn |
| table-display.spec.ts:269, 291 | TASK-3.3 | yes | fixed |
| table.spec.ts:263 | TASK-3.1 | yes (late reply changes count during 600 s idle) | fixed |
| home.spec.ts:234 | TASK-2.1 | yes | fixed |
| game-type-choice.spec.ts:95-98 (5,000 ms cap) | TASK-2.4 | yes | fixed |
| table.spec.ts:167, 182; stake-choice.spec.ts:76 | TASK-3.1, 2.3 | no: only blinds, stacks, bar visible (0 ms deal timer, no worker) | justified |
| table.spec.ts:231; next-hand/review `slices(n)` | 3.1, 3.4, 9.1 | no: subject is the app's own result/auto-deal timer | justified |
| 400-slice conditional loops (table.spec:124, table-display:302, action-bar:177/243, next-hand/review `slicesUntil` and play loops) | 3.1, 3.2, 3.3, 3.4, 9.1 | yes | **CORRECTED, fixed under Q-2 via runUntil.** The original "400 slices take several real seconds" was wrong: measured ~2.6-2.8 ms real per 50 ms slice, so 400 slices are ~1.0-1.1 s real, too little to absorb a hand of delayed replies. Measured normal runs (5 files, 72 runUntil calls, both engines): slowest wait 450 ms fake / 310 ms real, so the 10 s real cap has a margin over 30x |

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | lineUp unit fast + sweep full | vitest | pass | unit 1.7-1.98 s; sweep 11.2 s |
| SPEC-02 | draw test moved; thresholds | vitest, coverage | pass | sweep 8.1 s; unit thresholds met |
| SPEC-03 | no unit test ≥ 10 s | local: slowest unit test 3.4 s | pass | gates/fix-3.json |
| SPEC-04/05/07 | delayed replies, control, throw | playwright, both engines | pass | worker-delay.spec.ts; also green at 4,000 ms delay (temporary) |
| SPEC-06 | locked files assert the same | playwright; no expect line changed (review R2 diff check) | pass | 142 passed / 12 skipped, `npm run e2e` run twice |
| SPEC-08 | CI green first attempt | branch CI #176 (6c4fb32) | pass | green |
- Unit: 171 passed / 1 skipped; sweeps 310 passed / 2 skipped; lint and typecheck clean. Gates: build-1, fix-2, fix-3 passed.
- Judge: see doit/TASK-1.52/judge/.

## Review
- R1: 1 MAJOR (400-slice loop justification contradicted by measurement). Fixed under Q-2. R2: 0 blocking; security clean in both rounds.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `worker-delay-hand.spec.ts` delayed-hand tests take ~10.5 s each, 2 tests x 2 engines, so ~42 s added to every e2e run (see follow-ups).
- NIT: `slicesUntil` without `max` now returns true or throws, so `expect(...).toBe(true)` can only fail by throwing (next-hand :161/:163, review :310/:314).
- NIT: in play-to-end callbacks a click is followed by one extra 50 ms slice when the hand is not over; harmless.
- Left alone on purpose: rapid-pace.spec.ts 1 ms metering loops (opt-in slow suite) and stake-choice.spec.ts:76 (no worker involved).

## How to try it
- `npx playwright test e2e/worker-delay.spec.ts e2e/worker-delay-hand.spec.ts e2e/action-bar-limits.spec.ts`
- `npm run test:unit && npm run test:sweeps && npm run e2e`

## Run metrics
Questions 2 (Q-1, Q-2) · assumptions logged 5 (in spec) · review rounds 2 · judge rounds: see judge/ · gate runs 3 · escalations 0 · one blocked build (A-3 fake bound) resolved by orchestrator.

## Known limitations and follow-ups
- [infra] Delayed-hand proofs add ~42 s of worker time to every e2e run, and e2e is CI's critical path (~230 s). Shorten `REPLY_DELAY_MS` in `e2e/worker-delay-hand.spec.ts` (e.g. 1,500 ms), run the control only on Chromium, or move them to an opt-in group. Owner: TASK-1.52 follow-up / parked CI-speed plan. Caused no failure; adds CI time only, so the orchestrator decides.

### Not tracked (infra, below the value bar)
- NITs above.

## Lessons for the factory (proposals — not applied)
- Spec A-3 set a 60,000 ms fake bound without measuring real cost per slice; the build blocked on it. Proposal: for fake-clock helpers, require the spec to state a measured real-ms-per-slice before choosing bounds.
- The spec audit called 400-slice loops "several real seconds" without measuring; the reviewer caught it as a MAJOR. Proposal: audit rows marked "justified" must cite a measurement.
- A-2's 40 hands sat at the 3 s limit; require a margin (e.g. ≤ 50% of the limit) for local timing targets.
