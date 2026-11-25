# TASK-10.6 — Changes

- `src/stats/leak-categories.json` — modified: 16 preflop entries (`<group>-<action>`) appended after the 15 postflop entries (spec §5 text, D-1/D-2).
- `src/stats/leaks.ts` — modified: preflop/postflop category types, preflop entry validation, `positionGroup`, `preflopAction`, `PreflopSpot`, `decisionCategory` spot argument, `CategoryDecision.preflop`, `CategoryHand` and `handCategoryDecisions`.
- `src/table/session-report.ts` — modified: optional `button` on `ReportHand`; `leakCounts` built through `handCategoryDecisions`.
- `tests/stats/leaks.acceptance.test.ts` — modified (locked, D-3/Q-1): AC#2 runs its assertions, incl. the exact-15-ids check, over the postflop subset and adds the 16-preflop-ids check.
- `tests/stats/leaks.test.ts` — modified: a postflop entry given `street: 'preflop'` now fails at `.facingBet`; added the `street: 'showdown'` case at `.street`.
- `tests/stats/preflop-leaks.acceptance.test.ts` — new: SPEC-01..07 (AC#1–#7).
- `tests/stats/preflop-leaks.test.ts` — new: SPEC-09..12 (validation, pairing, table sizes, stored leakCounts).
- `tests/ui/report-preflop-leaks.acceptance.test.tsx` — new: SPEC-08 (AC#8).
- `docs/stats/leaks.md` — modified: preflop categories, position groups, action mapping, pairing, content table, tests.
- `docs/storage/reports.md` — modified: `leakCounts` holds postflop then preflop ids in data order.

No new dependencies.
