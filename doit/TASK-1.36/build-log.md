## BUILD (2026-11-19)
- `.github/dependabot.yml`: appended the §5 block (exclude-patterns, `typescript` group, `ignore` for `@types/node` and `typescript` semver-major); github-actions entry untouched.
- `tests/ci/dependabot.acceptance.test.ts`: appended one `it` (SPEC-01..03), existing lines unchanged (`git diff` shows only `+` lines), per Q-1.
- `README.md`: one sentence (3 lines) in `### Dependency updates` (SPEC-05).
- `npx vitest run tests/ci/dependabot.acceptance.test.ts`: 3 passed.
- `npm test`: 87 files, 319 passed, 3 skipped. `npm run lint`, `npm run typecheck`: clean. `npm run format` run.
- SPEC-05: `grep -n -A11 "### Dependency updates" README.md` shows the new sentence. SPEC-04 is manual after push (TASK-1.34).
