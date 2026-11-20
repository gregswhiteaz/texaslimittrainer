## BUILD (2026-11-20)
- AC#1: added dpkg journal check + `sudo -n dpkg --configure -a` recovery to `tools/ci/apt-lock.js`; tests with a fake `sudo` on PATH (SPEC-01..04). `npx vitest run tests/ci/apt-lock.dpkg.acceptance.test.ts` → 5 passed.
- AC#2: `tests/support/process-group-cli.ts` + `runInSandbox` through it; `npx vitest run tests/support/sandbox-timeout.acceptance.test.ts` → 2 passed (timeout test ~15.1 s).
- AC#3: apt archive cache steps in `ci.yml`; `npx vitest run tests/ci/apt-archives-cache.test.ts tests/ci/workflow.test.ts tests/ci/apt-lock.test.ts` → 19 passed, 1 skipped (Linux-only).
- `npm run format`, `npm run lint` (clean), `npm run typecheck` (clean), `npm test` → 98 files, 355 passed, 6 skipped.
- Spec run command not run locally: it would invoke the real `sudo` (not allowed locally); the same path is covered by the fake-sudo tests. SPEC-08/09 are manual branch CI runs for the Judge.
- Scope: 8 files; ~412 changed lines vs budget 380 (warn level; mostly test code).
