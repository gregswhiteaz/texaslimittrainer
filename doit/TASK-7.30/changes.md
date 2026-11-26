# TASK-7.30 changes

- `src/advice/ranges.ts` — `scaledWidthPct` returns `o` exactly from `OBSERVED_FULL_HANDS` (100) hands; below 100 the arithmetic is unchanged; doc comment updated.
- `src/advice/explanations.ts` — receives `fillTemplate` (moved unchanged from `explain.ts`); `basisText` fills `OBSERVED_BASIS` through it.
- `src/advice/explain.ts` — drops its own `fillTemplate` and the unused `CONCEPTS` import; imports `fillTemplate` from `./explanations` and re-exports it with `basisText`.
- `tests/advice/observed-range-tidy.acceptance.test.ts` — new acceptance tests for AC#1, AC#2 (SPEC-01, SPEC-02).
- `tests/advice/observed-ranges.test.ts` — unit `scaledWidthPct is exactly the observed stat from 100 hands` (SPEC-03).
- `tests/advice/explain.test.ts` — unit `src/advice fills placeholders only through fillTemplate` (SPEC-04).
- `doit/TASK-7.30/build-log.md` — build log with playtest SHAs (pipeline file).
- `doit/TASK-7.30/changes.md` — this list (pipeline file).

No new dependencies.
- `tests/advice/observed-ranges.test.ts` — review r1 MINOR: pin the three sizes and 102 default ranges in the SPEC-03 sweep (orchestrator)
