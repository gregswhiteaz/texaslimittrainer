## BUILD (2026-11-26)
- Changed the all-deps audit in `.github/workflows/ci.yml` from `--audit-level=critical` to `--audit-level=high`. Updated only the expected audit string in `tests/ci/workflow.test.ts` (lines 64, 229) and `tests/ci/ci-jobs.acceptance.test.ts` (line 151). Updated README table row and Local equivalent command; `npm run format` re-padded the table.
- `npm audit --omit=dev --audit-level=high && npm audit --audit-level=high`: exit 0, both `found 0 vulnerabilities` (SPEC-03 locally).
- `npm run lint`: pass. `npm run typecheck`: pass.
- `npm run test:tooling`: 37 files passed; 120 tests passed, 6 skipped.
- `npm test`: 325 files passed, 7 skipped; 1454 tests passed, 52 skipped.
- SPEC-05 command: no `--audit-level=critical` in README/ci.yml/tests/ci; README has 2 `npm audit --audit-level=high` lines; lint passes.
- SPEC-04 (GitHub CI run) is not done yet: it needs the branch pushed, and the orchestrator handles git. The run ID goes here after the push.
- Note: GHSA-fc5q-39xc-vjpf was withdrawn (2026-11-18), not patched; picomatch 4.0.7 is still a dev dependency.
