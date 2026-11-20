# TASK-1.36 — Questions and answers (user, 2026-11-19)

## Q-1 — How to add AC#3's assertions to TASK-1.24's locked tests/ci/dependabot.acceptance.test.ts?
**Answer: recommended (a)** — append one new `it(...)` block to that file; every existing line stays unchanged. Recorded as an approved cross-story locked-test edit with `doit.py unlock TASK-1.24 … --reason "TASK-1.36 Q-1 …"`.
