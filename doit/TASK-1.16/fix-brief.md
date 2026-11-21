# Fix brief — TASK-1.16 (resolving blocked.json; recorded deviations Q-5, Q-6 in qa.md)

1. **E7 (new, approved Q-5)** `tests/engine/bet-cap.acceptance.test.ts` (unlocked under TASK-1.12):
   - `betsPerStreet` counts only bets that count under REQ-016.5 (a bet/raise counts if 2*(amount − last full level) ≥ unit;
     preflop level starts at the big blind) — compute it in the test, don't import engine helpers. Keep the `≤ 4`
     assertion and every other assertion.
   - Line 233: `summary.firstViolation?.violation?.violations[0]` — same assertion otherwise.
2. **SPEC-10 (Q-6):** assert ≥ 1 completed sit-and-go at seed 42 AND that the hand after the first completion starts a
   fresh sit-and-go with every seat at 1,500 chips. Keep the other SPEC-10 counts (heads-up hands, busted-seat skips).
3. `tests/table/next-hand.test.ts:89` (unlocked): apply the same floor change as hand.test.ts.
4. Finish the remaining BUILD work: the new test files (button-blinds.acceptance, all-in-blinds, check-deal,
   games.acceptance), cli.test.ts and runner.test.ts updates, record the full new cash and sng 10,000-hand outputs in
   build-log.md, `npm run format`, then the gate. Delete blocked.json once resolved.
Never weaken any other test or change the seed. Stop and report again if anything else in §11 fires.
