# Fix brief — TASK-6.9 (judge R1 J-1-01 MEDIUM, test-only, strengthen-only)
The restart-path `showdowns = []` resets in src/playtest/runner.ts (after a violation/abandoned hand, and at a new
sit-and-go) are not pinned: deleting either leaves every test green, because only the hand right after a restart is
checked and that hand's setup is rebuilt anyway. Add a test in tests/playtest/runner.test.ts (unit group) that checks a
hand TWO OR MORE hands after each kind of restart: its earlier showdowns contain only showdowns from after the restart.
Prove it: deleting each reset (temp edit, then restore) makes the new test fail. Keep it fast (< 1 s).
No source change. `npm run format`; gate; never push.
