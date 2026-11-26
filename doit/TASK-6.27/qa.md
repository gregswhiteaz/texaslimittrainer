# TASK-6.27 — Questions and answers (user, 2026-11-26)

## Q-1 — May bots keep using the advice code (src/advice)?
Facts: every bot gets its move from advice code; the advice code bots reach takes only a PlayerView and pure helpers, so hidden cards are unreachable today; only advice/golden.ts uses hand state and no bot imports it.
Options: (a) allow + lint guard on advice code bots use; (b) forbid (rewrite all bots); (c) allow with no new check.
**Answer: A — allow, and add the lint guard (recommended)** — user choice.
