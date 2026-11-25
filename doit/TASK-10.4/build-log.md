## BUILD (2026-11-24)

- Implemented `errors` (unhinted Major / Minor counts) in `sessionReport`, `parseErrors` validation, `rateTiles`, the "Volume and errors" `<dl>` (`.report-rate`) in `ReportScreen`, shared tile CSS, docs (`docs/storage/reports.md`).
- New tests: `tests/ui/report-errors.acceptance.test.tsx` (4), `tests/table/session-report-errors.test.ts` (3), `tests/storage/session-end-errors.acceptance.test.ts` (1), `e2e/report-errors.spec.ts` (1 × Chromium + WebKit). No locked or existing test edited.
- Deviation note: SPEC-04 test takes ~6 s alone without coverage (spec §9), but ~27 s alone under `vitest --coverage` and ~44 s in the full parallel `npm test`, which exceeded the 30 s default `testTimeout`. Gave that one test an explicit `120_000` timeout (same pattern as existing `60_000` heavy tests); it stays in the normal suite as the spec decides.
- e2e: `<dl>` has no ARIA `list` role, so the spec flow locates the tiles with `getByLabel('Volume and errors')`.
- Commands: `npm run lint` pass; `npm run typecheck` pass; `npm test` 275 files passed / 4 skipped, 1291 tests passed / 44 skipped; `npm run build && npx playwright test` 302 passed, 16 skipped.
