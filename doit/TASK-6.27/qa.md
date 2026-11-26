# TASK-6.27 — Questions and answers (user, 2026-11-26)

## Q-1 — May bots keep using the advice code (src/advice)?
Facts: every bot gets its move from advice code; the advice code bots reach takes only a PlayerView and pure helpers, so hidden cards are unreachable today; only advice/golden.ts uses hand state and no bot imports it.
Options: (a) allow + lint guard on advice code bots use; (b) forbid (rewrite all bots); (c) allow with no new check.
**Answer: A — allow, and add the lint guard (recommended)** — user choice.

## Q-2 — Review r1 found the rules only watch engine/ paths (escalation: scope)
Security MAJORs: advice code and bots can import table/session, storage/hand-store, playtest/runner (hand state, past hands' replay codes). Code MAJORs: advice/golden reachable via '.js' extension and via advice re-export.
**Answer: Fix both here (recommended)** — user choice. Both rules become allow-lists; AC#3 added.
