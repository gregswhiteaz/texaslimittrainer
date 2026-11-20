# TASK-1.39 — Questions and answers (user, 2026-11-20)

## Q-1 — How should AC#3 stop the slow-mirror install from timing out?
Evidence: run #89 attempt 1 needed 126 MB at ~85 KB/s (~25 min > 20-min job limit).
Options: (a) cache the .deb archives between runs [Recommended]; (b) Playwright container image (parked CI-speed plan; locked-test edits); (c) longer timeouts only (would not have fixed #68/#73/#89).
**Answer (user): (a) cache the packages.** Current limits unchanged; no locked-test edits.

## Q-2 — Locked-test edits for (b)/(c)
**Moot** — (a) needs none.
