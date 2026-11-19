## BUILD (2026-11-19)
- Added the total-stack check to `validate` and rewrote the two comments in `src/engine/hand.ts`.
- Wrote `tests/engine/chip-safety.acceptance.test.ts` (5 tests, SPEC-01..05); edited the Q-2 assertion in `tests/engine/input-hardening.acceptance.test.ts` only.
- `npx vitest run` on the two acceptance files: 9 passed.
- `npm test`: 87 files, 318 passed, 3 skipped (before test compaction; re-run by gate). `npm run lint`, `npm run typecheck`: clean. `npm run format` run.
- SPEC-06: `grep -niE "cap|at most 10 seats" src/engine/hand.ts` → no output, exit 1.
- SPEC-07: `npm run playtest` exit 0, `Invariant violations: 0`, output identical to the base engine (diffed by restoring HEAD's hand.ts temporarily).
- Scope: ~211 changed lines vs budget 190 (warn band); the extra is the acceptance test file.
