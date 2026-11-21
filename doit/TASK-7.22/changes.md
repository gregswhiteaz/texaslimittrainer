# Changes — TASK-7.22

- `tests/advice/postflop-coverage.acceptance.test.ts` — new acceptance test file: AC#1 pins `toPct`'s `+ 1e-9` nudge at the twelve half-way points 0.5005..0.5115 (SPEC-01); AC#2 is the every-street property (folds allowed, stopAt 0..23, 60 runs, seed 7322) asserting legal advice plus flop/turn/river coverage, folded non-acting seats and discards (SPEC-02, SPEC-03).

No production code changed. No new dependencies.
