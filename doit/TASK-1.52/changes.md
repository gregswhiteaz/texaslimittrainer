# TASK-1.52 changes

- `tests/playtest/policy.test.ts` — lineUpPolicyFactory unit version uses 20 / 100 / 20 hands (fix-brief: 6-max cut to 20, the smallest multiple of 20 at which Tough still differs from all-TAG); all expects kept.
- `tests/playtest/policy-lineup.acceptance.test.ts` — new sweep file: the original 200/500/20-hand lineUpPolicyFactory test verbatim, 120 s timeout.
- `tests/bots/calling-station.test.ts` — long draw test moved out; new fast 'drawDeviation draws once and compares against p' keeps the stub block; unused helpers/imports removed.
- `tests/bots/calling-station-draws.acceptance.test.ts` — new sweep file: 'Calling station draws once only at deviating decisions' verbatim with stub, owed, seatOneViews, TEST_TIMEOUT_MS.
- `e2e/support/paused-clock.ts` — new: runUntilMyTurn (bounded paused-clock advance; maxFakeMs default 600,000 per fix-brief deviation from A-3, maxRealMs 10,000) and delayWorkerReplies (init script).
- `e2e/worker-delay.spec.ts` — new: SPEC-04, SPEC-05, SPEC-07.
- `e2e/action-bar-limits.spec.ts` (locked TASK-3.7) — fixed 1,000 ms loop → runUntilMyTurn; import.
- `e2e/action-bar.spec.ts` (locked TASK-3.2) — 5 runFor1000 calls → runUntilMyTurn; runFor1000 removed; import.
- `e2e/table-display.spec.ts` (locked TASK-3.3) — 2 runFor1000 calls → runUntilMyTurn; runFor1000 removed; import.
- `e2e/table.spec.ts` (locked TASK-3.1) — 'ten idle minutes' runFor1000 → runUntilMyTurn; import.
- `e2e/home.spec.ts` (locked TASK-2.1) — fixed 1,000 ms loop → runUntilMyTurn; import.
- `e2e/game-type-choice.spec.ts` (locked TASK-2.4) — 5,000 ms capped loop → runUntilMyTurn; unused toActSeats import dropped.
- `doit/TASK-1.52/blocked-1.resolved.json`, `doit/TASK-1.52/fix-brief.md` — orchestrator's block resolution (not builder-authored).
- `e2e/support/paused-clock.ts` (fix r1) — new runUntil(page, check, { maxFakeMs 600,000, maxRealMs 10,000, label }): 50 ms slices until check returns truthy, returns it, throws `<label> after … ms fake / … ms real`; runUntilMyTurn now reuses it (same message).
- `e2e/action-bar.spec.ts` (locked TASK-3.2, Q-2) — two 400-slice end-of-hand loops → runUntil; import.
- `e2e/table.spec.ts` (locked TASK-3.1, Q-2) — nextTurnPaused's 400-slice loop → runUntil ('timeout' result gone; the helper throws instead); import.
- `e2e/table-display.spec.ts` (locked TASK-3.3, Q-2) — 400-slice end-of-hand loop → runUntil; import.
- `e2e/next-hand.spec.ts` (locked TASK-3.4, Q-2) — slicesUntil without `max` → runUntil (the 4-slice deal-timing check keeps its slice cap); 400-slice play-to-result loop → runUntil; import.
- `e2e/review.spec.ts` (locked TASK-9.1, Q-2) — same slicesUntil change; checkOrCallToResult and the big-blind-walk loop → runUntil (the in-loop expect kept inside the check); import.
- `e2e/worker-delay-hand.spec.ts` (fix r1) — new: 2 s delayed replies, fold and play the hand to its end through runUntil; control showing the old 400-slice loop does not reach the end under the same delay; runUntil fake-bound trip test. Separate file because the existing worker-delay spec is locked for this task.

No new dependencies.
