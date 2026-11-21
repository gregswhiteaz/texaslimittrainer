# TASK-1.40 changes

- `vite.config.ts` — 90% line threshold glob widened to `src/{engine,bots,advice,stats,playtest,table}/**`.
- `tools/lint/headless-boundary.js` — `HEADLESS_DIRS` now has six folders; `LINT_ONLY_HEADLESS_DIRS` removed; `HEADLESS_FILES` derived from `HEADLESS_DIRS` only.
- `tests/toolchain/coverage.test.ts` — (unlocked, D-1) expects the widened threshold message and asserts `HEADLESS_DIRS` includes playtest and table.
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` — (unlocked, D-1) drops the removed import; list test renamed "the headless folders include playtest and table" and asserts the exact six-folder list and `HEADLESS_FILES`.
- `README.md` — conventions bullet lists all six headless folders; removed the separate lint-only sentence.

No new dependencies.
