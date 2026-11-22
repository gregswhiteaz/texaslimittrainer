## Build (TASK-7.5)
- Implemented `src/advice/ranges.ts` + `src/advice/ranges/six-max.json` (36 original ranges, widths inside the Q-2 bands), the `opponentRanges` option with the A-6 fallbacks, the exact-keys options guard (`ExactOptions`) on `recommend`/`recommendPostflop`/`gradeView`, `adviceOptions` in the four bots, `ACTION_RANGE_ADVICE` in the advice service and `userReviewEntries` in the review/Table. Docs: new `docs/advice/range-model.md`, updated `postflop-rules.md`.
- Judgment call: `ACTION_RANGE_ADVICE` is typed `PostflopOptions` (a subset of `RecommendOptions`, still assignable to it) instead of `RecommendOptions`. Typed as `RecommendOptions` it carries an optional `chart` key, so `recommendPostflop(view, ACTION_RANGE_ADVICE)` (SPEC-12, SPEC-14) would fail `recommendPostflop`'s exact-keys guard (`Allowed = PostflopOptions`, D-4).
- `ExactOptions` is written `O & Readonly<Record<Exclude<keyof O, keyof Allowed>, never>>` (same type as the spec's mapped form; the lint rule `consistent-indexed-object-style` rejects the mapped form).
- `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` → `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc`, `Invariant violations: 0`.
- `npm run lint` pass; `npm run typecheck` pass; `npm test` → 182 files passed / 2 skipped, 653 tests passed / 13 skipped; coverage all files 97.79% lines, `ranges.ts` 100% lines.
- New tests in isolation each < 1 s (range-model.acceptance 9 tests, ranges.test 4, postflop-ranges 3, review.test 2).
- `npm run e2e` → 142 passed, 12 skipped.
- No locked test was edited.

## FIX round 1
- MAJOR exact-options-bypassed-by-style-only-variable: fixed. `ExactOptions<O, Allowed> = O & Allowed & Readonly<Record<Exclude<keyof O, keyof Allowed>, never>>`; `O extends object` on `recommend`, `gradeView` (default RecommendOptions) and `recommendPostflop` (default PostflopOptions). Doc comment notes explicit type arguments and variables already widened to `Allowed` are not caught. Locked AC#8 `@ts-expect-error` lines and the tag-playtest mock (`options?: RecommendOptions`) still typecheck.
- MINOR open-ender hole-card requirement: fixed, `classify('Ah Kd', '5c 6d 7h 8s')` → 'air'. Removing the `fromHole` check now fails ranges.test.ts.
- MINOR raise > bet aggregation: fixed. Seat 3 bets then re-raises the flop on a `(i * 7) % 52` deal (flop Js Kh 2d, which leaves Pair combos so raise and bet narrowing differ); combos equal 'raise' narrowing. Swapping AGGRESSION to bet-first now fails. (The check-raise line from the brief can't catch it: that opponent never bets, and on the default deal's trips board raise and bet narrowing are identical.)
- Type-ban cases: `@ts-expect-error` for `{ style: TAG_STYLE }` and `{ random: botRandom(1) }` variables on recommend, recommendPostflop and gradeView, plus `{ equity: 5 }`, in tests/advice/ranges.test.ts (inside an uncalled function, so no equity runs). Under the old constraint all six bot-key lines report unused `@ts-expect-error`.
- `npm run typecheck` 0 errors; `npm run format`, `npm run lint` clean; `npm test` 182 files passed / 2 skipped, 654 tests passed / 13 skipped.
- Playtest `--hands 10000 --seed 42 --size 6` SHA-256 442dbf55…408fbc, 0 invariant violations (bots unchanged).
