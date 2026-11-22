## Build (TASK-7.5)
- Implemented `src/advice/ranges.ts` + `src/advice/ranges/six-max.json` (36 original ranges, widths inside the Q-2 bands), the `opponentRanges` option with the A-6 fallbacks, the exact-keys options guard (`ExactOptions`) on `recommend`/`recommendPostflop`/`gradeView`, `adviceOptions` in the four bots, `ACTION_RANGE_ADVICE` in the advice service and `userReviewEntries` in the review/Table. Docs: new `docs/advice/range-model.md`, updated `postflop-rules.md`.
- Judgment call: `ACTION_RANGE_ADVICE` is typed `PostflopOptions` (a subset of `RecommendOptions`, still assignable to it) instead of `RecommendOptions`. Typed as `RecommendOptions` it carries an optional `chart` key, so `recommendPostflop(view, ACTION_RANGE_ADVICE)` (SPEC-12, SPEC-14) would fail `recommendPostflop`'s exact-keys guard (`Allowed = PostflopOptions`, D-4).
- `ExactOptions` is written `O & Readonly<Record<Exclude<keyof O, keyof Allowed>, never>>` (same type as the spec's mapped form; the lint rule `consistent-indexed-object-style` rejects the mapped form).
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc`, `Invariant violations: 0`.
- `npm run lint` pass; `npm run typecheck` pass; `npm test` → 182 files passed / 2 skipped, 653 tests passed / 13 skipped; coverage all files 97.79% lines, `ranges.ts` 100% lines.
- New tests in isolation each < 1 s (range-model.acceptance 9 tests, ranges.test 4, postflop-ranges 3, review.test 2).
- `npm run e2e` → 142 passed, 12 skipped.
- No locked test was edited.
