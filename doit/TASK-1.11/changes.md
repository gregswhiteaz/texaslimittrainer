# Changes — TASK-1.11

- `src/engine/hand.ts` — `validate` accepts 2..10 seats (`Hand needs 2 to 10 seats, got <n>`); `createHand` makes the button the small blind and the other seat the big blind when `n === 2` (D-1); `HandConfig.seats` doc comment says 2..10.
- `src/playtest/cli.ts` — `--size` range 2..10 in `parseArgs`, `SIZE_ERROR` and both `USAGE` lines.
- `tests/engine/heads-up.acceptance.test.ts` — new: SPEC-01..SPEC-04 (heads-up blinds, preflop order, postflop order, deal positions and showdown).
- `tests/playtest/heads-up.acceptance.test.ts` — new: SPEC-05 (10,000-hand `--size 2` hand walk + subprocess), SPEC-06 (`npm run playtest -- --size 2` and replay of the first code).
- `tests/engine/hand.test.ts` — U1 (seat-count messages now `[1]`/2..10 and a 2-seat hand is accepted, SPEC-07); new SPEC-08 test `heads-up button fold preflop returns the uncalled $2 to the big blind`.
- `tests/playtest/cli.test.ts` — U2 (`--size 1` error cases, `from 2 to 10`, usage `<2-10>`); new SPEC-09 test `parseArgs accepts --size 2 and rejects sizes outside 2 to 10`.

No new dependencies.
