# Fix brief — TASK-7.8 (code review R1 MINORs, in-story, strengthen-only)
1. tests/bots/calling-station.acceptance.test.ts:265 (unlocked under TASK-6.3): the D-5 point 0 re-pin lost the preflop raise
   threshold case (u ≥ 0.6 keeps the raise). Add (or swap in) a preflop raise point where the station's draw is ≥ the
   threshold and it keeps the raise, with its measured values. Keep every existing assertion.
2. tests/playtest/games.acceptance.test.ts:79 (unlocked under TASK-1.16): the every-push AC#6 title says 1,000 hands but the
   in-process sng run is 10,000; fix the title to say what it does, and share one 10k in-process run between the two copies
   in slow mode if simple. No assertion change.
`npm run format`; run the two files; full `npm test`; gate. Never push.
