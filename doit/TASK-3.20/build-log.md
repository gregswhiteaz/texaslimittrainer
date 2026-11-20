## BUILD (2026-11-19)
- Implemented SPEC-01..04: path-level colour, logo visibility and glyph containment checks with mutation tests in `e2e/cards.spec.ts`; Linux opt-in skip predicate in `e2e/cards.visual.spec.ts`; new `.github/workflows/visual.yml` and `tests/ci/visual-workflow.test.ts`; removed the glyph-fit unit test; README subsection.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm run e2e -- e2e/cards.spec.ts e2e/cards.visual.spec.ts`: 20 passed (chromium + webkit, darwin baselines unchanged).
- `npm test`: 89 files, 329 passed, 5 skipped, 1 failed — the only failure is `tests/ci/visual-workflow.test.ts > visual workflow > has committed Linux baselines for every card snapshot` (the 6 `*-linux.png` baselines must come from a branch `Visual` CI run; no Docker locally, A-8). Wrote `blocked.json` (needs-linux-baselines).
