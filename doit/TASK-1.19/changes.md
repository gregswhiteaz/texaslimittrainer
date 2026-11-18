# Changes — TASK-1.19

- `tools/ci/retry.js` (created): dependency-free Node CLI that runs a command with a per-attempt timeout, kills the attempt's whole process group (SIGTERM, then SIGKILL after a grace period), retries up to `--attempts`, logs `retry:` / `::warning::` / `::error::` lines, treats EPERM/ESRCH from the group kill as non-fatal (exported `killGroup`), and kills the running attempt when cancelled (exit 130/143). Usage errors exit 2.
- `tests/ci/fixtures/flaky-command.js` (created): stub command that fails or hangs (`fail`, `hang`, `hang-tree`, `hang-ignore-term`) for its first N calls, counting calls in a state file.
- `tests/ci/retry.test.ts` (created): behaviour tests of the helper against the stub (SPEC-03 … SPEC-10).
- `tests/ci/retry.sudo.test.ts` (created, fix round Q-1): unit tests that `killGroup` tolerates EPERM/ESRCH and rethrows other errors; Linux-CI-only test running the helper around a hanging `sudo -n sh -c 'exec sleep …'` (two timeouts, exit 1, < 20 s, no leftover process).
- `.github/workflows/ci.yml` (modified): both Playwright install steps run through `tools/ci/retry.js` (3 attempts, 240 s each, 10 s delay) and get `timeout-minutes: 13`.
- `tests/ci/workflow.test.ts` (modified): install test now asserts the wrapped commands and no bare `npx playwright` run line (SPEC-02); new test for the step timeouts, retry flags and the worst-case invariant (SPEC-01).
- `README.md` (modified): one sentence in "Continuous integration" about the install retry (SPEC-12).

New dependencies: none.
