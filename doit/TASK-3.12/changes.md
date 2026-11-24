# Changes — TASK-3.12

- `src/advice/recommend.ts` — exported `userAdviceOptions(observed?)` (moved from advice-service, D-5).
- `src/table/advice-service.ts` — uses `userAdviceOptions`; local `userOptions` deleted.
- `src/advice/ranges.ts` — `observedBySeat` rejects non-object entries and seats that are not whole 1..10 with RangeError (AC#6).
- `src/table/hand-record.ts` — `HandRecordGrade`, `HandRecordDecision`, `decisionRecord`, `HandRecord.decisions`, and `parseHandRecord` validation of decisions with the cross-check against the user's actions.
- `tests/support/table-scenarios.ts` (outside the spec's file list, needed by A-3) — `userTableAfter` gains an optional `observed` snapshot; `defaultTableAfter` (KINGS_SHOWDOWN, AVA_UNCONTESTED, SPLIT_STRAIGHT) now routes the user's moves through `applyUserAction`, so their records pass the A-3 cross-check (previously these fixtures had user actions with no user decisions).
- `tests/storage/hand-records.acceptance.test.ts` — D-3: destructure `decisions` out of `rest` and assert its length (6).
- `tests/storage/hand-store.test.ts` (outside the spec's file list, test speed) — grades KINGS_SHOWDOWN's decisions once and reuses them for the 1,000 records (without this the test went from about 0.1 s to 11.5 s, which risks CI's 30 s coverage timeout).
- `tests/table/decision-record.acceptance.test.ts` (new) — SPEC-01..06 acceptance tests; SPEC-01/SPEC-05 expected values per the approved correction in fix-brief item 1 (hint-path values; SPEC-05 margin check on entry 2, turn).
- `tests/table/decision-record.test.ts` (new) — SPEC-07 (parseHandRecord decision validation) and SPEC-08 (decisionRecord copies the hint-path advice and shares nothing).
- `docs/storage/hand-records.md` — `decisions` field and entry table, grade shape, `hinted` default, decision-time snapshot rule, and the new validation rules (SPEC-11).
- `doit/TASK-3.12/blocked-1.resolved.json` — the earlier SPEC-01/SPEC-05 block (renamed when resolved).

No new dependencies.
