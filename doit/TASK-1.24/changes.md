# TASK-1.24 changes

- `.github/dependabot.yml` — new; weekly Dependabot version updates for `github-actions` (one group) and `npm` (minor/patch group, majors separate) (SPEC-01).
- `tools/git/prune-merged-branches.js` — new; dry-run-by-default script that lists and, with `--apply`, deletes `doit/*` branches merged into `main` locally and into `origin/main` on `origin` (SPEC-04..SPEC-08).
- `tests/ci/dependabot.acceptance.test.ts` — new; static checks of `dependabot.yml` and the README "Dependency updates" subsection (SPEC-01, SPEC-02).
- `tests/ci/branch-protection.acceptance.test.ts` — new; pins the README "Branch protection" command to the single CI job name in `ci.yml` (SPEC-03).
- `tests/git/prune-merged-branches.acceptance.test.ts` — new; runs the script in mkdtemp clones with a temporary bare `origin`, isolated from user git config (SPEC-04..SPEC-09).
- `tests/git/prune-merged-branches.test.ts` — new; unit tests of `parseOptions` and `formatPlan` (SPEC-08).
- `README.md` — modified; "Dependency updates", "Branch protection" and "Branch cleanup" subsections under "Continuous integration" (SPEC-02, SPEC-03, SPEC-09).

No new dependencies.
