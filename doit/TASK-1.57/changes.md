# TASK-1.57 changes

- `e2e/players-choice.spec.ts` — import `storedSessions`; in the table-size test, poll until exactly one session record is stored before the n = 2 / n = 10 table axe scans, so the Table's first-deal timer is on the paused clock before real timers are swapped in (unlocked under TASK-2.2; no assertion removed or loosened).

No new dependencies.
