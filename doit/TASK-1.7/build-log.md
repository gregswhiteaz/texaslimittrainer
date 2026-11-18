## BUILD (TASK-1.7)
- Created `.github/workflows/ci.yml` with the exact content from spec §5 (`prettier --write` reported it unchanged), `.nvmrc` (`22.18.0`) and `tests/ci/workflow.test.ts` (8 tests, names as in the spec). Updated `README.md` (Setup line plus a "Continuous integration" section).
- `npm run format`: ok. `npm audit --omit=dev --audit-level=high`: exit 0. `npm audit --audit-level=critical`: exit 0.
- `npm run lint`: ok. `npm run typecheck`: ok. `npm run build`: ok. `npm test`: 9 files, 23 tests passed (8 in `tests/ci/workflow.test.ts`). `npm run e2e`: 10 passed.
- Dry-rehearsed the proof cases in detached scratch worktrees on the spec commit. No branches or commits were made, because the builder can't commit. All 8 cases failed first at the expected command (see changes.md). The real `node_modules` is untouched (no lodash or minimist). The `ci-proof/TASK-1.7/*` branches still have to be created after the task commit.
