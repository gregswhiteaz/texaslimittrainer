# Fix brief — TASK-2.4 (resolving blocked.json; recorded deviation from A-3 / SPEC-08)

Decision (orchestrator, autopilot): **Option 2.** Do not touch the locked TASK-3.4 test (widening its regex would
loosen a locked assertion). The TEMPORARY top-up stays in its locked text form:
`stack < minimum ? buyIn(tableStake(table.config)) : stack` — i.e. the same "20 big bets" refill rule for every game
type. For a sit-and-go at 20/40 that refills a short stack to 800 (not 1,500). The starting stacks are unchanged
(1,500 via `startingStack`). This is temporary: TASK-3.21 removes the top-up (a sit-and-go must never refill — the
orchestrator adds that AC there).
Update A-3 / SPEC-08 expectations in your new tests accordingly (sng top-up target 800), record the deviation in
build-log.md and changes.md, delete blocked.json, then finish the BUILD: the four new test files, e2e specs (Chromium +
WebKit), full `npm run e2e`, `npm run format`, gate. Never push. Leave no background processes.
