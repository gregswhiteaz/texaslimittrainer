# TASK-9.3 build log

## BUILD (2026-11-24)

What was done:
- `decisionEntry` split out of `decisionRecord`; `handRecord`/`handWrite` take the graded entries (no grading when given).
- `src/table/decision-grades.ts` tracker; `useTableSession` sends one worker `grade` request (with the decision's
  snapshot) per new decision from the table effect and chains the record write on `gradedDecisions`;
  `onHandGraded` feeds `storedReviewEntries` into the held review (`reviewGraded`).
- `AdviceClient.grade(view, userAction, observed?)`.
- `ReviewPanel` shows chart line / Equity + Required equity / explanation / "Opponent ranges" (`data-opponent`).
- `opponentLines` extracted from `hintCard` (output unchanged, SPEC-10).
- Storyboard fixture plays seat 5 through `applyUserAction`; `storyboardShowdown(observed?)`, `TEN_SEAT_SHOWDOWN`.
- Locked A-8 edit of `tests/ui/review-panel.acceptance.test.tsx` with the qa.md conditions (banned list
  `['TBD','…','undefined','null','[object']`, `/You: .+ · Advice: .+$/` anchored on the `data-part="moves"` text,
  entries split on `<li data-entry`).
- SPEC-07 note: the decision that ends the hand is requested in the same task as the result's commit (a microtask
  after it, per the spec's `Promise.resolve().then(...)`), so the e2e samples the grade count in the next task
  (MessagePort) after `Hand over` appears; it is 4.

Commands and results:
- `npm run typecheck` — 0 errors. `npm run lint` — clean (prettier, eslint, sync-copies).
- `npm test` — 249 files passed, 3 skipped; 1215 tests passed, 43 skipped; coverage thresholds hold.
- `npm run test:unit` (CI coverage job) — 70 files, 336 passed; thresholds hold; no heavy equity work added
  (decision-grades.test.ts ≈ 1.5 s, 6-max only; the 10-seat grading runs only inside the e2e page).
- `npx vitest run tests/golden/` — 5 files, 282 passed.
- `npm run -s playtest -- --hands 10000 --seed 42` — Invariant violations: 0.
- `npx playwright test e2e/review-numbers.spec.ts` — 4/4 passed, 3 consecutive runs.
- `npm run build && npx playwright test` (full) — 235 passed, 16 skipped, 1 failed:
  `[chromium] e2e/hint-observed.spec.ts` (locked) — see blocked.json. Fails 4/4 in Chromium, passes in WebKit.
- Scope: 21 files / ~1340 changed lines vs budget 20 / 1200 (warn band); tests are about 60 % of the lines.
- blocked.json written (SPEC-14): locked `e2e/hint-observed.spec.ts` one-shot `deal.count()` probe races the Deal
  next hand render now that hand end no longer blocks the main thread; recommended one-line locked edit inside.
- `TLH_SLOW_TESTS=1 npx playwright test e2e/rapid-pace.spec.ts e2e/responsive-table.spec.ts` — 15 passed,
  5 skipped (Chromium and WebKit), exit 0.
