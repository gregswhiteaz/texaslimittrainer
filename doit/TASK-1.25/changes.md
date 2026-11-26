# TASK-1.25 changes

- `.github/workflows/ci.yml` — "Audit all dependencies" step now runs `npm audit --audit-level=high` (was `critical`). SPEC-01/02.
- `tests/ci/workflow.test.ts` — expected all-deps audit string changed to `npm audit --audit-level=high` (step-order array and named-step test); nothing else changed. SPEC-02.
- `tests/ci/ci-jobs.acceptance.test.ts` — expected all-deps audit string changed to `npm audit --audit-level=high`; nothing else changed. SPEC-01.
- `README.md` — CI job table row ("all dependencies: no high or critical advisory, `npm audit --audit-level=high`") and the "Local equivalent" command; Prettier re-padded the table. SPEC-05.

No new dependencies.
