# TASK-10.5 changes

- `src/stats/leak-categories.json` (new): the 15 postflop leak categories (id, street, facingBet, action, title, evidenceName, fix, justification) with the approved §5 text.
- `src/stats/leaks.ts` (new): `parseLeakCategories` validation, `LEAK_CATEGORIES`, `decisionCategory`, `categoryCounts`, `isLeak`, `leakEvidence`, `sessionLeaks`.
- `src/table/session-report.ts`: optional `street` / `action` on `ReportDecision`, optional `leakCounts` on `SessionReport` computed in `sessionReport` (present iff `errors`), `parseLeakCounts` validation in `parseSessionReport`.
- `src/ui/report/ReportScreen.tsx`: `LeaksSection` ("Biggest leaks this session") after the style section, only when `report.leakCounts` is present.
- `src/ui/styles.css`: `.report-leaks` shares the `.report-style` card rules; leak list, evidence and no-leaks styles.
- `tests/stats/leaks.acceptance.test.ts` (new): SPEC-01..06.
- `tests/stats/leaks.test.ts` (new): SPEC-09, SPEC-10.
- `tests/table/session-report-leaks.test.ts` (new): SPEC-11, SPEC-12.
- `tests/ui/report-leaks.acceptance.test.tsx` (new): SPEC-07, SPEC-08.
- `e2e/report-leaks.spec.ts` (new): SPEC-13.
- `docs/stats/leaks.md` (new): categories, classification and leak rules, evidence format, validation, content table with justifications.
- `docs/storage/reports.md`: `leakCounts` field row and section, validation, tests list.
- `tests/table/session-report-errors.test.ts`: the key-order assertion now expects the trailing keys `style`, `errors`, `leakCounts` (unlocked test pinning the report shape).

No new dependencies.
