## BUILD — 2026-11-18
- Implemented `src/advice/grade.ts` per spec §5 (rules 1–6, A-3 tenths, A-5 impossible pairings, D-2 aggression-no-range).
- Wrote `tests/advice/grade.acceptance.test.ts` (9 tests) and `tests/advice/grade.test.ts` (24 tests). Real-chart cells used: UTG unopened AA (raise, firm), K9s (raise, borderline), 72o (fold, firm).
- `npx vitest run tests/advice/grade*.test.ts`: 33 passed. `npm run typecheck`: exit 0. `npm run lint`: exit 0.
- Confirmed grade.ts loads under Node type stripping (resolve-ts loader).
- `npm run playtest -- --hands 10000 --seed 42`: Invariant violations: 0.
- Full `npm test` left to the stop-hook gate.
- Gate #1 fix: removed the banned substring "Date" from a doc comment in `src/advice/grade.ts` (locked TASK-7.1 equity AC#5 scan). `npx vitest run tests/advice`: 14 files, 72 tests passed; typecheck and lint exit 0.
