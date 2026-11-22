# TASK-7.5 changes

## Created
- `src/advice/ranges.ts` — range model: preflop-line taxonomy, default-range file validator (`parseDefaultRanges`, `RangeValidationError`), hand-class notation (`parseHandRange`), combo expansion, the Strong/Pair/Draw/Air classifier, single-step narrowing, `estimateOpponentRanges(view)`; `unseenCombos` moved here from `postflop.ts`.
- `src/advice/ranges/six-max.json` — 36 original 6-max default ranges (position × preflop line) with a file justification and one justification per range.
- `docs/advice/range-model.md` — range-model design document (inputs, lines, file format, notation, narrowing rule, worked fixture, safety rules).
- `tests/advice/range-model.acceptance.test.ts` — acceptance tests AC#1–AC#9 (SPEC-01..SPEC-09).
- `tests/advice/ranges.test.ts` — unit tests: notation, lines, classifier edge cases (SPEC-10), validator problems, expansion/estimation, default-range content sanity (SPEC-11); fix round 1: board-only open-ender case, bet/re-raise aggregation case (optional `deck` on the `stateAfter` helper), `@ts-expect-error` cases for bot-key-only option variables.
- `tests/advice/postflop-ranges.test.ts` — unit tests: actions mode property + fallbacks + heads-up (SPEC-12), blocked start / empty narrowing via a mocked range file, default advice unchanged (SPEC-13 first half).

## Modified
- `src/advice/postflop.ts` — `opponentRanges: 'unseen' | 'actions'` option, action-range path with the A-6 fallback chain, exact-keys generic options guard.
- `src/advice/recommend.ts` — `ExactOptions` (intersects `Allowed`; `O extends object` so bot-key-only variables are rejected), generic `recommend`, `adviceOptions`, `ACTION_RANGE_ADVICE`.
- `src/advice/grade.ts` — exact-keys generic options guard on `gradeView`.
- `src/bots/tag.ts` — passes `adviceOptions(options)` to `recommend`.
- `src/bots/calling-station.ts` — same.
- `src/bots/maniac.ts` — same.
- `src/bots/rock.ts` — same.
- `src/table/advice-service.ts` — `recommend` and `grade` requests use `ACTION_RANGE_ADVICE`.
- `src/table/review.ts` — `userReviewEntries(hand)`.
- `src/ui/table/Table.tsx` — the review uses `userReviewEntries`.
- `docs/advice/postflop-rules.md` — "Opponent hands" input and "Not applied yet" list updated; links `range-model.md`.
- `tests/advice/postflop.perf.test.ts` — actions-mode latency scenarios (SPEC-14); scenario loop shared by both tests.
- `tests/table/advice-service.test.ts` — recommend/grade expectations use `ACTION_RANGE_ADVICE`.
- `tests/table/review.test.ts` — `userReviewEntries` matches `reviewEntries(hand, ACTION_RANGE_ADVICE)` and the service's grades.

No new dependencies.
