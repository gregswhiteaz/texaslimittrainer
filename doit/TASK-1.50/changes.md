# TASK-1.50 changes

## Workflows and scripts
- `.github/workflows/ci.yml` — rewritten into six jobs in this order: `e2e`, `checks`, `coverage`, `sweeps` (2-shard matrix, `fail-fast: false`), `changes`, `tooling` (`needs: changes`, gated on its output); `schedule:` cron `0 6 * * *`; every job `timeout-minutes: 30`; all action pins unchanged; e2e/apt step bodies moved verbatim (D-1..D-5, A-1, A-7, A-8).
- `.github/workflows/visual.yml` — both jobs' `timeout-minutes` 5/15 → 30 (A-1, AC#5).
- `package.json` — new scripts `test:unit` (coverage), `test:sweeps`, `test:tooling` (exact text from spec §5); `test` unchanged (D-1, D-7).
- `tools/ci/tooling-changed.js` — new: no-dependency change detector (`TOOLING_DIRS`, `TOOLING_FILES`, `isToolingPath`, `decide`, CLI writing `tooling=<bool>` to stdout and `$GITHUB_OUTPUT`; fail-safe `true` with `::warning::`) (D-3, A-3, A-5, A-6). Fix round 1: listed paths indented two spaces (no `::` workflow-command lines); `index.html` added to `TOOLING_FILES`.
- `README.md` — "Continuous integration" section: six jobs, three test groups and commands, coverage on the unit group only, tooling trigger list (now with `index.html`) and fail-safe rule, daily schedule, 30-minute limit; "Branch protection" lists the six D-5 contexts.

## New tests
- `tests/ci/ci-jobs.acceptance.test.ts` — SPEC-02, SPEC-07, SPEC-11.
- `tests/ci/tooling-changed.test.ts` — SPEC-08 (temp git repos with `origin/main`), SPEC-09 (every repo file the tooling tests read is a tooling path). Fix round 1: indented listing, `::error::x.perf.test.ts` counts and prints no workflow command, `index.html` is a trigger and SPEC-09 adds Vite's entry for tests that run the build.
- `tests/toolchain/test-groups.acceptance.test.ts` — SPEC-03 (partition via `vitest list --filesOnly`), SPEC-05 (coverage only in `test:unit`; sandbox threshold failure and pass). Sandbox output checks strip ANSI (`stripVTControlCharacters`). Fix round 1: `listFiles` fails on any non-empty `vitest list` line that is not a test path.

## Test support
- `tests/support/sandbox.ts` — `SandboxScript` widened with `'test:unit'`.

## Locked tests, cross-story edits (D-6, unlocked under TASK-1.7, 1.39, 1.24, 1.17)
- `tests/ci/workflow.test.ts` — per-job exact npm command lists; Playtest is the last step of `checks`; exact `if:` list from §5; every job-level `timeout-minutes` is 30.
- `tests/ci/apt-archives-cache.test.ts` — job timeout `'20'` → `'30'`.
- `tests/ci/branch-protection.acceptance.test.ts` — exact six job ids; README contexts are the six D-5 names (shards expanded), derived from `ci.yml`.
- `tests/ci/million-workflow.acceptance.test.ts` — `ci.yml` has ≥ 1 identical checkout/setup-node pin, equal to million.yml's.

No new dependencies.
