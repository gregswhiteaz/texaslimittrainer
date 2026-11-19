# Changes — TASK-1.29

- `tools/ci/apt-lock.js` (created): CLI wrapper that waits up to `--wait-seconds` for the apt/dpkg lock files to be free (holders read from `/proc/locks`, matched by device and inode), then runs the command and passes its exit code through. Gives up with an `::error::` naming the lock and holder (exit 1). Usage errors exit 2. Node built-ins only.
- `tests/ci/apt-lock.test.ts` (created): CLI tests with a fake `/proc/locks` (SPEC-01, 02, 03, 08, 09), unit tests of parsing, device decoding and matching (SPEC-06), the fake-clock wait loop (SPEC-07), and a Linux-CI-only real `flock` test (SPEC-10).
- `.github/workflows/ci.yml` (modified): both Playwright install run lines now run `node tools/ci/apt-lock.js --wait-seconds 150 --` inside each retry attempt.
- `tests/ci/workflow.test.ts` (modified): the expected run string gains the apt-lock prefix (one-line additive edit, Q-1). Added the test "waits for the apt lock inside each Playwright install attempt within the step budget" (SPEC-04, AC#3).
- `README.md` (modified): the CI install-retry paragraph now describes the 150 s lock wait and its error.
- `doit/TASK-1.29/changes.md`, `doit/TASK-1.29/build-log.md` (created): build bookkeeping.

New dependencies: none.
