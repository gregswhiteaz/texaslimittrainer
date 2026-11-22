# Fix brief — TASK-6.10 (code review R1 MINOR #1, in-story)
`src/playtest/winrate.ts:72` completed-violating-hand-counted: a hand whose violation is flagged on its final action keeps
`final.result` non-null and is counted, contradicting A-1. Skip a hand when `hand.violations > 0 || hand.final.result === null`
(the runner's own restart condition). Add a unit case in tests/playtest/winrate.test.ts (not locked) that fails without the fix.
Optional NIT: drop the redundant `first` sort key only if it changes no output.
MINOR #2 (replacement-name reuse after a restart can merge rows) is documented, not changed.
`npm run format`; gate; never push.
