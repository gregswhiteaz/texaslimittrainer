# TASK-1.26 changes

- `tools/lint/headless-boundary.js` — modified; new `LINT_ONLY_HEADLESS_DIRS = ['playtest', 'table']`, `HEADLESS_FILES` covers `HEADLESS_DIRS` plus that list, header comment updated (SPEC-04, SPEC-05; AC#4, AC#5).
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` — new; sandbox lint run with UI/React probes in `src/playtest` and `src/table`, plus the folder-list check (SPEC-04, SPEC-05).
- `tests/playtest/summary.acceptance.test.ts` — new; `summarize` Largest pot on hand-built awards and a real 20-hand run checked against `totalContribution` sums (SPEC-01, SPEC-02).
- `tests/playtest/runner.test.ts` — modified; new unit test `creates each seat's policy once per hand` (SPEC-03).
- `tests/table/session.test.ts` — modified; removed TASK-3.1 SPEC-10 test `session module imports no UI code` and the unused `readFileSync` import (SPEC-06; AC#5).
- `README.md` — modified; headless bullet says lint applies the same rules to `src/playtest` and `src/table`.
- `doit/TASK-1.26/changes.md`, `doit/TASK-1.26/build-log.md` — build records.

No new dependencies.
