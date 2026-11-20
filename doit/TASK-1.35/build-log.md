# TASK-1.35 build log

## BUILD (2026-11-19)
- Probed git 2.54.0 (Apple Git-157) in a throwaway mkdtemp repo with a bare origin (deleted afterwards): a stale-lease delete exits 1 and prints on stdout
  `!<TAB>(delete):refs/heads/doit/a<TAB>[rejected] (stale info)` (the source field is `(delete)`, not empty as in the spec example), with `-<TAB>:refs/heads/doit/c<TAB>[deleted]` for the accepted delete. `refusedBranches` takes the text after the last `:`, so both forms parse; the unit test covers both.
- `tools/git/prune-merged-branches.js`: SHA-carrying remote listing, `remoteDeleteArgs` + `refusedBranches`, refused-branch reporting, `lines` → `outputLines`, `fail` → `reportError`.
- Tests: `tests/git/prune-merged-branches-hardening.acceptance.test.ts` (SPEC-01, SPEC-02), `tests/git/prune-merged-branches-lease.test.ts` (SPEC-03).
- Mutation check: with the `--force-with-lease` args removed, SPEC-01 fails; restored.
- `npx vitest run tests/git`: 4 files, 11 tests passed.
- SPEC-04 greps: `\b(lines|fail)\(` prints nothing; `const (outputLines|reportError) = ` count is 2.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 95 files, 347 passed, 6 skipped. An earlier run under load had flaky perf failures (`hand-evaluator.perf`, `invariants.perf`; different ones each run); they pass in isolation (2/2) and in the final full run.
- Scope: about 271 changed lines vs budget 230 (warn band). The acceptance test needs its own copy of the fixture/env helpers because the locked TASK-1.24 test can't be imported from.
