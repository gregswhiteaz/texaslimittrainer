## BUILD (2026-11-20)
- Applied spec §5 edits to vite.config.ts, tools/lint/headless-boundary.js, coverage.test.ts, headless-lint-dirs.acceptance.test.ts, README.md.
- `npm run format`: clean. `grep -rn LINT_ONLY_HEADLESS_DIRS tools tests src vite.config.ts`: no output.
- Run command (coverage + lint-dirs + boundary): 3 files, 8 tests passed.
- `npm test`: 101 files passed, 362 passed / 6 skipped; exit 0, no coverage errors.
- `npm run lint`: exit 0. `npm run typecheck`: exit 0.
