# TASK-6.19 changes

- `src/engine/player-view.ts` — new `rememberShowdown` (append a deep-frozen copy, keep the last `limit`) and `forgetSeats` (drop the shown hands of seats that changed player; empty entries dropped, A-1); `EarlierShowdown` doc notes seat = current player.
- `src/playtest/runner.ts` — `runPlaytest` appends with `rememberShowdown` then forgets the `replaced` seats (A-5); `runPlaytest` and `HandSetup.earlierShowdowns` doc comments updated.
- `tests/playtest/earlier-showdowns.acceptance.test.ts` — new: SPEC-01, SPEC-02.
- `tests/engine/player-view.test.ts` — unit tests SPEC-03 (`rememberShowdown`), SPEC-04 (`forgetSeats`).
- `tests/playtest/style-bots.acceptance.test.ts` — SPEC-05 (Q-1, TASK-6.9 test): the expected list forgets the seats in the next hand's `replaced`; no assertion removed or loosened.
- `doit/TASK-6.19/changes.md`, `doit/TASK-6.19/build-log.md` — work records.

No new dependencies.
