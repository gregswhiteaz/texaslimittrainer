# TASK-6.3 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — Style file format extension (D-1; public data format)
Options: (a) optional top-level `deviations` list in tlh-bot-style v1: {street preflop|postflop, advice fold|raise,
instead call, probability 0..1, justification}; pairs preflop/fold, preflop/raise, postflop/fold, each at most once;
absent = [] so tag.json and locked TASK-6.2 tests are untouched; version stays 1 [Recommended]; (b) per-situation keys;
(c) one global call probability; (d) bump to v2.
**Answer: auto-accepted (recommended)** — (a).

## Q-2 — Calling station values and texts (D-2; strategy content)
Options: (a) preflop fold→call 0.5, preflop raise→call 0.6, postflop fold→call 0.5, description/justifications per §5
(prototype at seed 42: VPIP 52–59%, PFR 4.9–6.8% across three line-ups, 0 violations) [Recommended]; (b) fold→call
0.45 or 0.55; (c) raise→call 0.7.
**Answer: auto-accepted (recommended)** — (a).

## Q-3 — Wire the Calling station into the app's worker (D-3)
Options: (a) decideBotDefault routes 'Calling station' to decideCallingStation, others to decideTag (~2 lines; no user
can seat a station yet) [Recommended]; (b) defer to TASK-6.6.
**Answer: auto-accepted (recommended)** — (a).
