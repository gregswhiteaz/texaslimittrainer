# Fix brief — TASK-3.3 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/table/table-view.test.ts:position-button-rotation-untested (code review)
- Where: tests/table/table-view.test.ts:65
- Problem: Every positionName case (3, 4, 6, 9 seats) and every scenario (FLOP_BET, SEAT_1_DEALT, default) puts the button on the highest seat, so the rotation from the button is never exercised.
- Evidence: Mutant in table-view.ts:86 `const order = [...seats]` (button ignored) passes all 15 tests in table-view.test.ts, table-display.acceptance.test.tsx and table.acceptance.test.tsx. The real code is correct: a probe gives the right names for buttons 1-6 at 6-max (e.g. button 3 -> 1 Hijack, 2 Cutoff, 3 Button, 4 Small blind, 5 Big blind, 6 Under the gun) and sensible names at 3-10.
- Expected fix: Add at least one case with the button not on the last seat, ideally all six buttons at 6-max, e.g. expect(names([1,2,3,4,5,6], 3)).toEqual(['Hijack','Cutoff','Button','Small blind','Big blind','Under the gun']).

## 2. [MAJOR] tests/table/table-view.test.ts:raise-text-amount-indistinguishable-from-added (code review)
- Where: tests/table/table-view.test.ts:33
- Problem: The record() helper sets added = amount, and the only raise in the scripted hand is the user's open raise from 0 (amount 8, added 8). No test can tell 'Raised to $<amount>' (the raise-to total, spec section 5) from 'Raised to $<added>'.
- Evidence: Mutant table-view.ts:67 `Raised to $${record.added}` passes all Vitest tests.
- Expected fix: Give the raise record a different added value (e.g. {type:'raise', amount: 8, added: 4} -> 'Raised to $8'), or assert the text of a big blind that raised preflop.

## 3. [MAJOR] tests/table/table-view.test.ts:latest-record-rule-untested (code review)
- Where: tests/table/table-view.test.ts:135
- Problem: Rule 2 says the action line shows the latest record on the current street. No asserted state has a seat with two records on the same street, so taking the first record instead of the last is never caught.
- Evidence: Mutant table-view.ts:134 `.at(0)` instead of `.at(-1)` passes all Vitest tests. In the existing big-blind test, seat 1 (small blind, then call) would show 'Small blind $2' instead of 'Called $2', but seat 1 is not asserted.
- Expected fix: In 'the big blind to act with no raise...' also assert seatOf({...table, hand}, 1).action === 'Called $2'.

## 4. [MAJOR] tests/table/table-view.test.ts:showdown-keeps-river-action-untested (code review)
- Where: tests/table/table-view.test.ts:107
- Problem: A-8 and the rule `line = 'river' when street === 'showdown'` say that after the hand the seats keep their last river action. The tests only check that 'Waiting' and 'To act' are absent at SHOWDOWN, so dropping the showdown->river mapping (every non-folded seat goes blank) is not caught.
- Evidence: Mutant table-view.ts:133 `const line = view.street` passes all Vitest tests. No e2e test asserts the seat texts after Hand over.
- Expected fix: Assert seatOf(SHOWDOWN, 2).action === 'Checked' and seatOf(SHOWDOWN, 5).action === 'Checked' (and seat 6 'Folded').

## 5. [MAJOR] tests/ui/table-display.acceptance.test.tsx:street-line-hidden-at-zero-untested (code review)
- Where: tests/ui/table-display.acceptance.test.tsx:94
- Problem: D-3/Q-2 says 'This street $X' is shown only when it is above $0. Nothing checks that the line is absent at $0.
- Evidence: Mutant Table.tsx:18 `seat.streetAmount >= 0` (renders 'This street $0' on every seat, including before the deal) passes all 31 tests in tests/table/table-view.test.ts and tests/ui/.
- Expected fix: In the folded-bot or SPEC-01 test, assert part(seatItem(flop, 6).body, 'street') is null (Eli, $0 this street) and part(seatItem(flop, 1).body, 'street') is null; optionally also that render(seatSession()) contains no data-part="street".

