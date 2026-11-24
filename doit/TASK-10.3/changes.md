# TASK-10.3 changes

- `src/stats/healthy-ranges.json` (new): the 15 authored healthy ranges (5 stats × heads-up, 6-max, full ring), each with an original one-sentence justification (spec §5 table).
- `src/stats/healthy-ranges.ts` (new): `parseHealthyRanges` (validated at import into `HEALTHY_RANGES`), `statTenths` (half-up integer tenths), `rangeLabel` (inclusive limits), `styleSection` (reference size via `referenceSizeOf`, approximate marker, five rows).
- `src/table/session-report.ts`: optional `style: StyleCounts` on `SessionReport`; `ReportHand` type; `sessionReport(session, endedAt, hands?)` sums the user's `handStyleCounts` (key absent for no hands); `parseSessionReport` validates a present `style`.
- `src/storage/hand-store.ts`: `ended` runs over `sessions`, `reports` and `hands`; reads hand records 1…handsPlayed with one `get` each, skips missing/invalid records (A-7), passes the rest to `sessionReport`.
- `src/ui/report/ReportScreen.tsx`: the "Your style vs healthy range (…)" section after the KPI tiles, before the button, only when `report.style` is present.
- `src/ui/styles.css`: `.report-style*` section styles (dark panel, label colours by `data-label`).
- `package.json`: `tests/stats/healthy-ranges-tag.acceptance.test.ts` added to `test:slow`.
- `tests/storage/session-end.acceptance.test.ts`: locked edit D-3 (1) (owner TASK-10.1): `sessionReport` gets the 3 stored hand records.
- `e2e/session-report.spec.ts`: locked edit D-3 (2) (owner TASK-10.1): `sessionReport` gets `storedRecords(page)`.
- `tests/stats/healthy-ranges.acceptance.test.ts` (new): SPEC-01, 04, 05, 06, 07.
- `tests/stats/healthy-ranges.test.ts` (new): SPEC-08, SPEC-09, `rangeLabel`.
- `tests/stats/healthy-ranges-tag.acceptance.test.ts` (new, opt-in slow): SPEC-02.
- `tests/table/session-report-style.acceptance.test.ts` (new): SPEC-03, 10, 11.
- `tests/ui/report-style.acceptance.test.tsx` (new): SPEC-03, 06, 07, 12.
- `tests/storage/session-end-style.test.ts` (new): SPEC-13.
- `e2e/report-style.spec.ts` (new): SPEC-14.
- `docs/stats/healthy-ranges.md` (new): ranges with justifications, validation, reference size mapping, label rule.
- `docs/storage/reports.md`: `style` field, ending reads hand records, validation, legacy reports, tests.

No new dependencies.
