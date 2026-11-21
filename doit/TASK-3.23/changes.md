# TASK-3.23 changes

- `e2e/cards.spec.ts` — `partsOutsideCard` reports a part with no `<path>` (`paths.length === 0 || leaves`); new test `containment check reports a part with no path` (SPEC-01). The inline decode deletion in `card back shows the decoded TLH logo` (SPEC-02) is NOT done: the auto-mode permission classifier denied it (see blocked.json).
- `README.md` — paragraph in `### Card visual baselines` on regenerating baselines after a Dependabot `@playwright/test` bump (SPEC-03).
- `tests/ci/visual-workflow.test.ts` — `README explains regenerating baselines after a Playwright bump` (SPEC-03).

No new dependencies.
