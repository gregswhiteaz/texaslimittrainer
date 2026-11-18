# Fix brief — TASK-1.19 (user decision Q-1, after review round 1)

1. [MAJOR, user-requested] Add a Linux-CI-only real-sudo retry test — see doit/TASK-1.19/qa.md Q-1 item 1 for exact requirements. Put it in a new file tests/ci/retry.sudo.test.ts (or similar, not a locked file). It must be skipped on macOS/local runs and run in GitHub Actions (CI=true, linux).
2. [MAJOR, user-requested] killGroup in tools/ci/retry.js must not throw on EPERM (or ESRCH); log nothing extra or a short `retry:` note, and continue. Add a unit test that simulates EPERM if feasible without mocking internals heavily (otherwise rely on item 1).
Do not change the locked tests or the spec. Keep all existing tests passing.
