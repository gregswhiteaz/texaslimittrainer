# TASK-10.8 — Changes

- `src/stats/leaks.ts` — modified: `MAX_SHOWN_LEAKS = 3`, non-exported `compareLeaks` (Major desc, exact error rate desc, errors desc, data order), `sessionLeaks` ranks and caps (D-1, D-2, A-1).
- `src/ui/report/ReportScreen.tsx` — modified: `LeaksSection` doc comment only.
- `tests/ui/report-leak-ranking.acceptance.test.tsx` — new: SPEC-01..03 (AC#1–#3) on the rendered report.
- `tests/stats/leaks.test.ts` — modified: new unit test for SPEC-04 (tie-breaks, preflop/postflop, cap, input order and immutability, ignored categories).
- `docs/stats/leaks.md` — modified: ranking rule with example, cap of 3, display-time ranking of stored counts, `MAX_SHOWN_LEAKS` in the API list, new test file in the Tests list.

No new dependencies.
