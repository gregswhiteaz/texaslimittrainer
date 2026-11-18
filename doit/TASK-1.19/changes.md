# Changes — TASK-1.19

- `tools/ci/retry.js` (created): dependency-free Node CLI that runs a command with a per-attempt timeout, kills the attempt's whole process group (SIGTERM, then SIGKILL after a grace period), retries up to `--attempts`, logs `retry:` / `::warning::` / `::error::` lines, and kills the running attempt when cancelled (exit 130/143). Usage errors exit 2.
- `tests/ci/fixtures/flaky-command.js` (created): stub command that fails or hangs (`fail`, `hang`, `hang-tree`, `hang-ignore-term`) for its first N calls, counting calls in a state file.
- `tests/ci/retry.test.ts` (created): behaviour tests of the helper against the stub (SPEC-03 … SPEC-10).
- `.github/workflows/ci.yml` (modified): both Playwright install steps run through `tools/ci/retry.js` (3 attempts, 240 s each, 10 s delay) and get `timeout-minutes: 13`.
- `tests/ci/workflow.test.ts` (modified): install test now asserts the wrapped commands and no bare `npx playwright` run line (SPEC-02); new test for the step timeouts, retry flags and the worst-case invariant (SPEC-01).
- `README.md` (modified): one sentence in "Continuous integration" about the install retry (SPEC-12).

New dependencies: none.
