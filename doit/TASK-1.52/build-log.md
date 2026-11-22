## BUILD (blocked)
- SPEC-01: unit lineUpPolicyFactory at 40/100/20 hands; `npx vitest run --coverage tests/playtest/policy.test.ts` 5 passed, lineUp test 2,918-2,935 ms (3 runs). Sweep file 11.2 s.
- SPEC-02: draw test moved to sweep (8.1 s); fast unit test 1 ms. 4/4 passed.
- e2e helper + worker-delay.spec.ts written. `npx playwright test e2e/worker-delay.spec.ts`: 2 passed (SPEC-07), 4 failed (SPEC-04/05 both engines): A-3's 60,000 ms fake bound is exhausted after ~3 s real, before two 2 s delayed replies land. With maxFakeMs raised (debug only, reverted) SPEC-04 passes on both engines.
- Stopped: blocked.json (SPEC-04, A-3 bound). Locked e2e files not yet edited.

## BUILD (resumed after fix-brief)
- maxFakeMs default → 600,000 (fixed: recorded deviation from A-3).
- Unit lineUpPolicyFactory trimmed to 20 / 100 / 20 hands (fixed: 1.70 s alone, 1.98 s in full unit run; all expects kept, `not.toEqual` still holds at 20).
- Six locked e2e files: only clock-advance lines, the now-unused runFor1000 helpers / userToAct loop and imports changed; no expect line touched.
- `npx playwright test` on the 6 files + worker-delay.spec.ts: 66 passed (Chromium+WebKit). worker-delay at 4,000 ms delay (temporary, reverted): 6 passed.
- `npm run test:unit`: 47 files, 171 passed / 1 skipped, thresholds met, slowest test 3.4 s. `npm run test:sweeps`: 89 files, 310 passed / 2 skipped.
- `npm run e2e` x2: 136 passed / 12 skipped, both runs. typecheck + eslint clean; `npm run format` run.

## FIX r1
- Item 1 [MAJOR] 400-slice loops: fixed per Q-2 (option b). Added runUntil to e2e/support/paused-clock.ts (runUntilMyTurn reuses it). Every 400-slice condition loop now goes through it: action-bar (2), table (nextTurnPaused), table-display, next-hand (slicesUntil default + play loop) and review (slicesUntil default + 2 loops). No expect added, removed or loosened. The 4-slice deal-timing caps stay slice-bounded because they wait on a fake timer, not a worker. Proof is in the new e2e/worker-delay-hand.spec.ts (the existing worker-delay spec is locked): with 2 s delayed replies the hand plays to its end via runUntil (~6 s real); a control shows the old 400-slice loop ends with no result; plus a fake-bound trip test (NIT).
- Measurement (temporary log in runUntil, reverted): 5 files, 72 runUntil calls on both engines without delay: max 450 ms fake / 310 ms real, so the 10 s real cap gives a >30x margin. Delayed runs: 19,303 slices in 53.8 s real = ~2.8 ms real per 50 ms slice (matches blocked-1's ~2.6 ms). A 400-slice loop is therefore ~1.0-1.1 s real, not "several seconds". The orchestrator must correct the spec §5 audit text in the story notes (the task files are protected from the builder).
- Out of scope, untouched: the rapid-pace.spec.ts 1 ms metering loops (opt-in slow suite; waits via expect.poll on worker posts) and the stake-choice.spec.ts fixed 1,000 ms loop (in neither the Q-1 nor the Q-2 list; locked).
- Runs: targeted 7 files 60 passed; `npm run e2e` x2: 142 passed / 12 skipped both times; lint and typecheck clean; `npm run format` run.
