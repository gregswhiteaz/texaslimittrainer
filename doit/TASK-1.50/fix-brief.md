# Fix brief — TASK-1.50 (review round 1 MINORs, in-story, strengthen-only)

1. **Security MINOR** `tools/ci/tooling-changed.js`: listed matching paths must never start a log line with `::`
   (GitHub workflow-command injection via a crafted `*.perf.test.ts` file name). Indent each listed path (e.g. two
   spaces) or otherwise neutralise it. Add a test in `tests/ci/tooling-changed.test.ts`: a path like
   `::error::x.perf.test.ts` still counts as tooling, and no stdout line except the `tooling=` result/known
   `::warning::` lines starts with `::`.
2. **Code MINOR** `tools/ci/tooling-changed.js:24`: add `index.html` to the tooling trigger list (read by
   `tests/toolchain/build.test.ts`), update the README list and the SPEC-09 list-in-step test so it would catch the gap.
3. **Code MINOR** `tests/toolchain/test-groups.acceptance.test.ts:37`: `listFiles` must not silently drop lines. Any
   non-empty output line that isn't a recognised test path (and isn't known vitest banner/summary noise) fails the
   test, or compare counts against vitest's own total. Keep every existing assertion.
NIT (extra "... and N more" line) — leave as is.
Keep `NO_COLOR`/ANSI handling working (GitHub forces colour). `npm run format`; gate; never push.
