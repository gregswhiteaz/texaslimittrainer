# Fix brief — TASK-6.2 (resolving blocked.json; Q-4 in qa.md)

Option (a): in the locked `tests/playtest/games.acceptance.test.ts` (unlocked under TASK-1.16 for this only), pass an
explicit `makePolicy` that reproduces the pre-6.2 default (pure `tagPolicy` at 6 seats, random-move otherwise) to the
AC#6 sit-and-go run, so its scenario is exactly as before. Change nothing else in that file — every assertion stays
byte-identical. Record it as D-5 item 5 in build-log.md and changes.md. Then delete blocked.json and finish the BUILD:
SPEC tests, D-5 edits (exact seeded equality only), unlocked test updates, verify hand-worked Examples 1 and 2,
`npm run e2e`, the 10k playtest twice, `npm run format`, gate. Never push. Leave no background processes.
