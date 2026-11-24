# TASK-1.56 changes

- `tests/advice/postflop-ranges.test.ts` — modified. Removed the real-equity fast-check property block and the
  `default advice stays on every unseen combo` test (moved verbatim). The scripted-fallback + heads-up part is now
  its own test, `actions mode falls back on scripted lines and heads-up`. Dropped the now-unused imports
  (`fc`, `legalActions`, `recommend`, `handReplayCode`, `playHand`).
- `tests/advice/postflop-ranges.property.test.ts` — new. Holds the moved checks unchanged
  (`actions mode is total and deterministic`, `default advice stays on every unseen combo`) plus copies of
  `STAKES_4_8` and `ALL_CARDS`; runs in the uncovered sweep job.

No new dependencies.
