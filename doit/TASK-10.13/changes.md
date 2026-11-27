# Changes: TASK-10.13

- `src/engine/hand.ts` — modified: private `liveLevels` (void-aware street bet levels, R2) behind `fullBetLevel`; `gather` keeps a folded top seat's uncalled chips in the pot (R4); `forceFold` voids a strict top bet down to the live top (preflop at least the big blind), lowering `currentBet`/`betCount` and recomputing `hasActed` and `toAct` (R1, R3); doc comments for `currentBet` and `forceFold`.
- `src/engine/invariants.ts` — modified: void-aware `countedBets`; new `uncalled` (uncalled part on the last record's street, only for a live top seat) used by C5 `returnedMessage` and `potStructureMessage` (no dead-money cap); P5 allows a $0 sole survivor of a fold-out (J-1-02, R6).
- `tests/engine/force-fold-top-bet.acceptance.test.ts` — created: SPEC-02..SPEC-06 (worked examples E1-E7, 500 seeded normal hands).
- `tests/engine/force-fold.property.test.ts` — created: SPEC-07 (2,000 hands, several forced folds per hand).
- `e2e/leave-mid-hand.spec.ts` — modified (locked, owner TASK-10.2, Q-4): worker-traffic init script in `openPausedClock`; the bot-freeze check waits for every worker reply and advances the clock again before asserting (SPEC-08). No assertion removed or loosened.
- `docs/ui/navigation.md` — modified: forced-fold dead-money bullet (TASK-10.13 Q-1) and the force-fold / leave-mid-hand test files in `## Tests` (SPEC-01).
- `dreams/limit-holdem-trainer/requirements.md` — modified: REQ-004.8 forfeit sentence, REQ-018.4 Leave-table exception, changelog row 1.15 (Q-3, SPEC-01).

No new dependencies.
