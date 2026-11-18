# Fix brief — TASK-1.20 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/ci/speed-limits.acceptance.test.ts:summary-regex-breaks-with-forced-color (code review)
- Where: tests/ci/speed-limits.acceptance.test.ts:16
- Problem: The nested Vitest inherits FORCE_COLOR (and similar color vars) from the parent environment through sandboxEnv(). When color is forced, Vitest wraps the summary counts in ANSI codes, so /Tests\s+2 passed/ and /Tests\s+2 failed/ no longer match and both acceptance tests fail even though the behaviour is correct. This is a false failure that depends on the environment, in a test meant to remove CI flakiness. GitHub Actions does not set FORCE_COLOR by default, so CI passes today. But any developer shell or tool that exports FORCE_COLOR breaks local `npm test`.
- Evidence: `FORCE_COLOR=1 npx vitest run tests/ci/speed-limits.acceptance.test.ts` -> 2 failed: "AssertionError: expected '\n\u001b[1m\u001b[30m\u001b[46m RUN \u2026' to match /Tests\s+2 passed/" and the same for /Tests\s+2 failed/. Without FORCE_COLOR, both pass (2.7 s each).
- Expected fix: In runPerfSuites, after building env, add `delete env.FORCE_COLOR; env.NO_COLOR = '1';`, or strip ANSI escapes from the output before matching. The file is listed in state.json locked_tests, so the orchestrator must unlock it first.

