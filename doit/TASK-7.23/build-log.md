## BUILD — 2026-11-20

- Added private `finitePct` guard in `src/advice/grade.ts`, called in the call-fold rule and the aggression-margin rule (after the undefined/null `aggression-no-range` return); doc comment updated.
- New `tests/advice/grade-hardening.acceptance.test.ts` with the four spec-named tests (SPEC-01..04).
- `tests/advice/grade.test.ts`: renamed the float test per SPEC-05 and added `expect(26.7 - 16.7).toBe(10)`; no assertion removed.
- Mutant check: wrapped the call-fold margin in `Math.abs(...)` → `a -15 wrong-way margin is Minor` failed (got major/15); restored. TypeError-for-RangeError mutant → both throw tests failed; restored.
- `npm run format` ok; `npm run lint` ok; `npm run typecheck` ok.
- `npx vitest run tests/advice tests/table` → 33 files, 129 passed.
- `npm test` → 109 files, 382 passed, 6 skipped.
- Locked `tests/advice/grade.acceptance.test.ts` diff vs main: empty.
