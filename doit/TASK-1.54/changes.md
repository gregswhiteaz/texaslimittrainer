# Changes — TASK-1.54

- `tools/lint/sync-copies.js` — new: conflict-copy name matcher, directory walker (skips `.git`, `node_modules`) and CLI that fails naming each copy.
- `package.json` — `lint` script runs `node tools/lint/sync-copies.js` first.
- `.gitignore` — four conflict-copy patterns (`* [0-9]`, `* [0-9][0-9]`, `* [0-9].*`, `* [0-9][0-9].*`) with a comment.
- `tests/support/sandbox.ts` — copies `tools/lint/sync-copies.js` into the toolchain sandbox so `npm run lint` works there.
- `tests/toolchain/sync-copies.test.ts` — new: SPEC-01..06 tests plus a walker unit test.
- `README.md` — new "Where to keep the repo" section; `npm run lint` row mentions the conflict-copy check.

No new dependencies.
