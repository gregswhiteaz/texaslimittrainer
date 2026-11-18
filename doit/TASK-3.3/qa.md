# Q&A — TASK-3.3

## Q-1 — Bot style ids and table labels (D-2; stored session format)
Asked 2026-11-18. Options: BotStyle = 'TAG' | 'Calling station' | 'Maniac' | 'Rock', stored as-is, table shows those words, Game Config keeps 'Tight-aggressive' (Recommended) / 'Tight-aggressive' everywhere / kebab-case ids with label map.
**Answer (user):** TAG, Calling station, Maniac, Rock (Recommended).

## Q-2 — Seat texts (D-3)
Asked 2026-11-18. Options: past tense (Recommended) / button wording / bots only.
**Answer (user):** Past tense (Recommended): last action "Small blind $2", "Big blind $4", "Folded", "Checked", "Called $4", "Bet $4", "Raised to $8"; "Waiting" when the seat hasn't acted this street and isn't to act; "This street $4" only when above $0; same lines on the user's seat.

## Q-3 — Markers and seat order (D-4)
Asked 2026-11-18. Options: red border + "To act" badge, white "D" disc ("Dealer button"), clockwise from the user (Recommended) / storyboard order / "(dealer)" text.
**Answer (user):** Red border + 'To act', 'D' disc, clockwise (Recommended): seat to act has a 2 px #D7262E border and a visible "To act" badge; dealer is a white "D" disc with accessible text "Dealer button"; seats run clockwise from the user (Eli lower left, Ava upper left, Ben top, Cal upper right, Dee lower right).

## Q-4 — What Leave table does in this slice (D-6)
Asked 2026-11-18. Options: return Home at once (Recommended) / confirm first / disabled.
**Answer (user):** Go straight Home (Recommended): returns to Home with the Home h1 focused, discarding the in-memory session; TASK-10.1 / E10-S05 replace the handler.

## D-5 — Edits to earlier stories' locked tests (decided by the orchestrator, not asked)
AC#10 itself requires replacing TASK-3.1's data-to-act hook with visible text, and the user approved the same kind of edit twice (TASK-2.1 Q-3, TASK-3.2 Q-1). The 8 edits listed in spec §5 D-5 are approved on that basis: no assertion is removed or weakened, and each edit either follows the markup this AC requires or reads the new visible "To act" text.
