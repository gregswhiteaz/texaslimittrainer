# TASK-6.24 — Questions and answers (user, 2026-11-26)

## Q-1 — TAG aggression band
Measured on today's code: Mixed 100k TAG aggression 59.5% (5.5 points under 65%); all-TAG 100k 64.3%; short 2k runs never exceed 65% for TAG but fail on other small-sample effects.
Options: (A) no change; (B) document that --check-styles needs 100,000 hands; (C) widen the band; (D) tune TAG postflop.
**Answer: B — document that --check-styles needs 100,000 hands (recommended)** — user choice. Follow-up story: help text, docs/stats/style-stats.md and cli test assertions; its own spec decides whether to warn on runs under 100,000 hands.
