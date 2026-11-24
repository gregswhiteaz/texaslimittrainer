# Fix brief — TASK-3.12 (branch CI red after review r1)

Fix exactly these items.

## 1. [BLOCKER] e2e/hand-records.spec.ts oldRecord() lacks the now-required decisions field
- CI run 45359725866, E2E job, both browsers: `RangeError: Invalid hand record: decisions` at e2e/hand-records.spec.ts:210 (parseHandRecord on the 1,000 seeded "2 years ago" records).
- The file is unlocked under TASK-3.9 and TASK-1.55 (reason "TASK-3.12 Q-4"). Give oldRecord() a `decisions` field consistent with its actions (if the user seat has no non-blind action, `[]`; otherwise one valid entry per user decision). Change fixture data only; no assertion changes.
- Then run the FULL Playwright suite locally (`npm run build && npx playwright test`), not just vitest, and fix any other e2e fixture that seeds hand records without decisions the same way (list each in the build log; if another one is hook-locked, write blocked.json naming file and owner instead).

## 2. Orchestrator additions (strengthen only; code review MINORs)
- tests/table/decision-record.test.ts: add parse cases that change only `action.amount`, an explanation over 2000 characters, opponentBasis text out of bounds, a bad `alternative`, and a bad `recommended.seat` — each must be rejected with the specified field path.
- Replace the vacuous `expect(entry.recommended).not.toBe(advice.move)` with a real no-sharing check (e.g. mutate the input advice after building and assert the entry is unchanged).

Never drop or loosen an assertion. npm run format, lint, typecheck, npm test, the full e2e suite, then the gate.
