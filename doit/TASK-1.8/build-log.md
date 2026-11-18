# Build log — TASK-1.8

## BUILD
- Added the invariant checker (`src/engine/invariants.ts`), runner seams/hook and per-hand violation, CLI violation block, CI `Playtest` step.
- Tests: new checker unit + perf tests, fault-injection acceptance suite with `tests/support/faulty-engine.ts`; workflow test extended (D-5); runner interim-violation test replaced by SPEC-06 (D-6); CLI tests moved to seams + SPEC-07.
- Commands: `npx vitest run tests/playtest tests/ci/workflow.test.ts` → 33 passed; `npx vitest run tests/engine/invariants.test.ts` → 3 passed; perf test → 0.38 µs/action over 162,629 actions; `npm run lint` ok; `npm run typecheck` ok; `npm run format` (prettier on changed files) ok; `npm run playtest -- --hands 10000 --seed 42` → `Invariant violations: 0`, exit 0; `npm test` → 44 files, 138 passed / 1 skipped; `src/engine/invariants.ts` coverage 100% lines, 97.24% branches.
- Scope: 11 files; ~1,320 changed lines vs budget 1,150 (warn band; tests account for most of the overage).

## FIX round 1
- Item 1 (sub-check clauses unverified): fixed — added corrupted-state rows to `tests/engine/invariants.test.ts`: C1 street > total (seat 6 streetContribution 1), C3 award shares moved between two pot-0 awards, K2 seat 3 with one hole card, P1 seat 7 not dealt in (checker reports, does not throw: P1 returns before P3), P5 non-folded eligible winner with $0 contributed, L5 last record street 'preflop', L5 duplicated extra record. Each asserts the exact spec message. No checker change needed.
- `npx vitest run tests/engine/invariants.test.ts`: 3/3 passed. Scratch mutation run of the 7 listed mutants: all 7 killed; source restored byte-identical.
- Gate fix: K2 one-card row cast to `PlayerState['holeCards']` via `unknown` with a comment (TS2322). typecheck clean, lint clean, invariants.test.ts 3/3.
