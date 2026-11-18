# Changes: TASK-1.7

## Files on `doit/TASK-1.7`
- `.github/workflows/ci.yml` (created): the CI workflow. It runs on every push and pull request: `npm ci`, the two audit gates, lint, typecheck, build, test, Playwright browser install (cached) and e2e in Chromium and WebKit, and it uploads the Playwright report when e2e fails. Prettier left the spec's exact content unchanged.
- `.nvmrc` (created): pins Node `22.18.0`.
- `tests/ci/workflow.test.ts` (created): 8 static tests of the workflow text and the Node pin (SPEC-01 to SPEC-07, SPEC-21).
- `README.md` (modified): the Setup line names the pinned Node version, plus a new "Continuous integration" section.

No new dependencies.

## Proof branches (D-1, not merged)
Local rehearsal results (spec §5 step 3). These come from a dry rehearsal in detached scratch worktrees: the same
changes applied on top of the spec commit, with no branch and no commit. For each case, every earlier command
exited 0 and only the listed files changed.

| Case | Files changed | First failing command | Evidence |
|---|---|---|---|
| lint | `src/ui/ci-proof-lint.ts` | `npm run lint` | `no-debugger` |
| typecheck | `src/ui/ci-proof-typecheck.ts` | `npm run typecheck` | `TS2322` (lint passed with the `const` variant) |
| build | `vite.config.ts` | `npm run build` | `Error: ci-proof: deliberate build failure` |
| test | `tests/unit/ci-proof.test.ts` | `npm test` | `ci proof: a deliberately failing unit test` |
| e2e-chromium | `e2e/ci-proof.spec.ts` | `npm run e2e` | `2 failed`, `2 skipped`, both `[chromium] › e2e/ci-proof.spec.ts`, `image-alt (critical)` |
| e2e-webkit | `e2e/ci-proof.spec.ts` | `npm run e2e` | `2 failed`, `2 skipped`, both `[webkit] › e2e/ci-proof.spec.ts`, `image-alt (critical)` |
| audit-shipped | `package.json`, `package-lock.json` | `npm audit --omit=dev --audit-level=high` | `lodash`, `Severity: high` |
| audit-all | `package.json`, `package-lock.json` | `npm audit --audit-level=critical` | `minimist`, `Severity: critical` (shipped audit exit 0) |

The audit cases used `npm install --package-lock-only` in a worktree without the `node_modules` symlink, so the
project's real `node_modules` was not modified.

The `ci-proof/TASK-1.7/*` branches are created after the task commit exists (BASE = `git rev-parse doit/TASK-1.7`),
with the rehearsal repeated on the real branches.

## User push command (§5 step 4)
```sh
git push origin doit/TASK-1.7 ci-proof/TASK-1.7/lint ci-proof/TASK-1.7/typecheck ci-proof/TASK-1.7/build ci-proof/TASK-1.7/test ci-proof/TASK-1.7/e2e-chromium ci-proof/TASK-1.7/e2e-webkit ci-proof/TASK-1.7/audit-shipped ci-proof/TASK-1.7/audit-all
```

## Cleanup (§5 step 5, after the Judge records the run URLs)
```sh
git push origin --delete ci-proof/TASK-1.7/lint ci-proof/TASK-1.7/typecheck ci-proof/TASK-1.7/build ci-proof/TASK-1.7/test ci-proof/TASK-1.7/e2e-chromium ci-proof/TASK-1.7/e2e-webkit ci-proof/TASK-1.7/audit-shipped ci-proof/TASK-1.7/audit-all
git branch -D ci-proof/TASK-1.7/lint ci-proof/TASK-1.7/typecheck ci-proof/TASK-1.7/build ci-proof/TASK-1.7/test ci-proof/TASK-1.7/e2e-chromium ci-proof/TASK-1.7/e2e-webkit ci-proof/TASK-1.7/audit-shipped ci-proof/TASK-1.7/audit-all
```
