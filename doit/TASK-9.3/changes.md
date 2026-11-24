# TASK-9.3 changes

- `src/table/hand-record.ts` — new `decisionEntry(result, decision)` (pure conversion of a grade reply); `decisionRecord` delegates to it; `handRecord(hand, meta, decisions?)` copies given entries without grading, RangeError on a count mismatch.
- `src/table/session-record.ts` — `handWrite(table, meta, decisions?)` passes the graded entries to `handRecord`.
- `src/table/decision-grades.ts` — new: per-hand grade tracker (`NO_GRADES`, `requestNewGrades`, `gradedDecisions`).
- `src/table/review.ts` — new `StoredReviewEntry` and `storedReviewEntries(hand, decisions)` (chart line per A-4, numbers, explanation, opponent lines); old `reviewEntries`/`userReviewEntries` kept (A-6).
- `src/table/hint.ts` — `opponentLines(view, basis, names)` extracted from `hintCard` (output unchanged) and shared with the review.
- `src/ui/advice/advice-client.ts` — `grade(view, userAction, observed?)` posts `observed` only when given.
- `src/ui/table/useTableSession.ts` — `requestDecisionGrade`; one worker grade request per new decision in the table effect; `onHandGraded` option; the record write waits for the grades and uses them.
- `src/ui/table/Table.tsx` — `ReviewState.entries` nullable, `HeldReview`, `reviewGraded`; review built from stored entries via `onHandGraded`; panel shown once entries exist.
- `src/ui/table/ReviewPanel.tsx` — chart line, Equity / Required equity, explanation and "Opponent ranges" list (`data-opponent`), text nodes only.
- `src/ui/styles.css` — styles for the new review entry parts (wrapping, no horizontal overflow).
- `tests/support/table-scenarios.ts` — storyboard plays seat 5 through `applyUserAction`; new `storyboardShowdown(observed?)` and `TEN_SEAT_SHOWDOWN`.
- `tests/ui/review-numbers.acceptance.test.tsx` — new: SPEC-01, 02, 03, 04, 08, 09.
- `tests/table/decision-grades.test.ts` — new: SPEC-06, 10, 11.
- `tests/ui/review-panel.acceptance.test.tsx` — locked TASK-9.1 test, A-8 edit (stored entries, re-pinned advice/grades, new banned list, anchored moves line, entry split on `<li data-entry`).
- `e2e/review-numbers.spec.ts` — new: SPEC-05, SPEC-07 (Chromium and WebKit).
- `e2e/support/table-scenes.tsx` — `ten-seat-review` scene (grades `TEN_SEAT_SHOWDOWN` in the page only).
- `e2e/support/table-harness-bundle.ts` — `'ten-seat-review'` added to `TableScene`.
- `docs/ui/review.md` — new: what a review entry shows and where it comes from.
- `docs/storage/hand-records.md` — decisions graded at decision time in the worker; write waits for grades; failed grade fails the write.
- `docs/advice/determinism.md` — snapshot section now describes stored entries, not `reviewEntries`.

No new dependencies.
- `e2e/hint-observed.spec.ts` — wait for the Deal next hand control instead of a one-shot probe (block 1; orchestrator edit; stricter)
