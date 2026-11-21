# TASK-3.22 changes

- `tests/table/hand-result-edges.acceptance.test.ts` — new: SPEC-01 (King high names the highest rank, on the board) and SPEC-02 (a winner missing from `table.seats` throws `RangeError('Seat 2 is not at the table')`).
- `tests/ui/user-shown-cards.acceptance.test.tsx` — new: SPEC-03 (seat-3 user showdown, shown seats 1, 2, 3, 5; "Your shown cards" holds the user's own Ac Ad).

No production code changed. No new dependencies.
