# Spec: TASK-3.22 — Pin the hand-result edge cases

Status: READY (approved 2026-11-20)
Task: TASK-3.22 · Parent/epic: TASK-3 · Requirements: n/a (follow-up from the TASK-3.4 review, doc-25, and TASK-2.18, doc-50) · Dream: limit-holdem-trainer

## 1. Summary
Three behaviours of `src/table/hand-result.ts` are correct but not pinned by any test: high-card naming picks
the highest rank (not the first card), the `Seat <n> is not at the table` invariant throw, and "Your shown
cards" showing the user's own hole cards. This test-only chore adds one test per behaviour, each shown to fail
on a named mutant and pass on the current code. No production code changes.

## 2. Scope
- In scope: two new test files (Vitest). Before handing back, the builder applies each named mutant to
  `src/table/hand-result.ts` one at a time, runs the matching test, records the failing output in the build
  log, and reverts (`git diff --stat src` empty afterwards).
- Not doing:
  - Any change under `src/`. The AC#2 throw is kept and covered, not removed (D-2).
  - Editing existing test files, including the locked `tests/ui/hand-result.acceptance.test.tsx`, the
    unlocked `tests/table/hand-result.test.ts`, and `tests/support/table-scenarios.ts` (D-1).
  - Validating session configs (TASK-3.10), the redundant `endedBy === 'showdown'` NIT, and any other doc-25
    or doc-50 follow-up.
  - New dependencies.
- Scope budget: files=2, lines=90

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#2 is met by covering the throw with a test, not by removing it. | yes | TASK-3.4 A-5 deliberately chose explicit `RangeError` throws over non-null casts for the same kind of invariant (doc-25). Removing it would need `as`/`!` to stay type-sound. The message is a programmer error, never shown in the UI. | Remove the throw and use a non-null assertion. |
| A-2 | AC#3 uses a crafted session with the user at seat 3 and four seats shown at showdown (1, 2, 3, 5), all checking down, so the user's cards differ from the first-shown seat's (seat 1) and from seat 5's. | yes | The engine lists shown seats in ascending order (probed: `[1,2,3,5]`). The only existing user-wins showdown (`SHOWDOWN`, user at seat 5, shown `[2,5]`) is already caught by "first shown"/"other seat" mutants, but not by a "seat 5 hard-coded" or "last shown" mutant. Seat 3 catches all four. | User at seat 1 (`SEAT_1_CONFIG`): misses the `showdown[0]` mutant. |
| A-3 | AC#1 is pinned with the reviewer's example `9c 2d` + `Ks Jd 6c 4h 3s` → "King high" (hole cards first, as `handResultView` passes them). | yes | Suggested in doc-25; no straight (no 5) and no flush (max two per suit). | Any high-card hand whose top rank is on the board. |

## 3. Current system
- `src/table/hand-result.ts:31-68` `handName(cards)`: high card is `SINGULAR[withAtLeast(1)[0]]` at line 45,
  where `withAtLeast` sorts ranks highest first (lines 36-40).
- `src/table/hand-result.ts:71-98` `handResultView(table)`: line 82-83 looks up the winning seat in
  `table.seats` and throws `RangeError('Seat <n> is not at the table')` if missing; line 85-86 picks the shown
  entry with `result.showdown.find((s) => s.seat === seat)`; line 94 copies its hole cards.
- `src/ui/table/Table.tsx:98-105`: a winner with `holeCards` renders a `role="group"` with
  `aria-label="Your shown cards"` when `winner.isUser`, else `"<name>'s cards"`, then two `PlayingCard`s
  carrying `data-card="<code>"`.
- Tests: Vitest, `environment: 'node'`; UI tests render with `renderToString` (`tests/ui/hand-result.acceptance.test.tsx:15-17`).
  `npm test` = `vitest run --coverage` (`package.json`).
- Locked: `tests/ui/hand-result.acceptance.test.tsx` (TASK-3.4 `state.json` `locked_tests`).
- Existing code to reuse:
  - `tests/support/table-scenarios.ts:61` `play(hand, moves)` → apply engine moves.
  - `tests/support/table-scenarios.ts:134` `fixedDeck(fixed)` → place cards by deck index (seat k of 6 with
    button 6 gets indexes k-1 and k+5; flop 13-15, turn 17, river 19).
  - `tests/support/table-scenarios.ts:156` `KINGS_SHOWDOWN` → a completed showdown won by seat 2.
  - `src/table/session.ts:122` `seatSession(input)`, `src/engine/hand.ts` `createHand`, `src/engine/cards.ts`
    `parseCards` / `formatCard`, `src/ui/table/Table.tsx` `TableView`.
  - The regex helpers in `tests/ui/hand-result.acceptance.test.tsx:19-54` (`status`, `winnerLines`,
    `cardsGroup`, `cardCodes`) → copy the minimum needed (they aren't exported, and that file is locked).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | New test files only; existing tests untouched. | Add the King-high example to `tests/table/hand-result.test.ts:22-41`. | Caller's direction; no locked-file risk; same pattern as TASK-2.18. | no | n/a |
| D-2 | Keep the throw and cover it (A-1). | Remove it. | Smallest change; keeps types sound without casts. | no | n/a |

## 5. Design

### Files to create / modify
- `tests/table/hand-result-edges.acceptance.test.ts` — SPEC-01 (King high) and SPEC-02 (seat not at table). ~30 lines.
- `tests/ui/user-shown-cards.acceptance.test.tsx` — SPEC-03 ("Your shown cards" at a seat-3 user showdown). ~55 lines.

### Components, interfaces and data
- No production interfaces change.
- SPEC-03 fixture (built inside the test file):
  - Seats: `['Ava','Ben','You','Dee','Cal','Eli']` at seats 1-6; seat 3 `{ kind: 'user', style: null }`, others
    `{ kind: 'bot', style: 'TAG' }`. `start = seatSession({ seats, userSeat: 3, button: 6 })`.
  - Deck: `fixedDeck({ 0: '7c', 6: '2d', 2: 'Ac', 8: 'Ad', 4: 'Kh', 10: 'Kd', 13: 'Qs', 14: '9h', 15: '4c', 17: '3h', 19: '8s' })`
    (seat 1 7c 2d, seat 3 Ac Ad, seat 5 Kh Kd; seat 2 gets 2c 3c from the rest).
  - `hand = createHand({ stakes: start.stakes, seats: start.stacks, button: 6, deck })`, then
    `play(hand, '3:call 4:fold 5:call 6:fold 1:call 2:check' + three streets of ' 1:check 2:check 3:check 5:check')`.
  - `table = { ...start, hand: played }`. Probed result: showdown seats `[1,2,3,5]`, seat 3 wins $16 with
    "Pair of aces".

### Rules and algorithms
- Named mutants (applied one at a time to `src/table/hand-result.ts`, then reverted):
  - M1a (line 45): `SINGULAR[cardRank(cards[0] as Card)]` — names the first card ("Nine high").
  - M1b (line 45): `withAtLeast(1).at(-1)` — names the lowest rank ("Two high").
  - M2 (line 83): delete the `if (sessionSeat === undefined) throw …` line (runtime TypeError instead).
  - M3a (line 86): `result.showdown.find((s) => s.seat !== seat)` — another seat (seat 1: 7c 2d).
  - M3b (line 86): `result.showdown[0]` — first shown seat (seat 1: 7c 2d).
  - M3c (line 86): `result.showdown.find((s) => s.seat === (isUser ? 5 : seat))` — default user seat hard-coded (Kh Kd).
  - M3d (line 86): `result.showdown.at(-1)` — last shown seat (seat 5: Kh Kd).

### Error handling and configuration
- `RangeError('Seat <n> is not at the table')` stays as is (`src/table/hand-result.ts:83`).

## 6. Behaviour specification

### SPEC-01: High card names the highest rank, even when it is on the board
- Verifies: AC#1
- Behaviour: Given hole cards `9c 2d` and board `Ks Jd 6c 4h 3s` (the King is on the board, the first card is
  the Nine), When `handName(parseCards('9c 2d Ks Jd 6c 4h 3s'))` is called, Then it returns exactly
  `'King high'`. Fails on M1a (`'Nine high'`) and M1b (`'Two high'`).
- Verification: acceptance `tests/table/hand-result-edges.acceptance.test.ts::a high card on the board is named, not the first card`

### SPEC-02: A winner missing from the table's seats throws
- Verifies: AC#2
- Behaviour: Given `KINGS_SHOWDOWN` (seat 2 wins) with `seats` filtered to drop seat 2, When `handResultView` is
  called, Then it throws a `RangeError` with message exactly `'Seat 2 is not at the table'`. Fails on M2 (a
  `TypeError` reading `name` of undefined).
- Verification: unit `tests/table/hand-result-edges.acceptance.test.ts::a winner who is not seated throws a RangeError`

### SPEC-03: "Your shown cards" lists the user's own hole cards
- Verifies: AC#3
- Behaviour: Given the §5 seat-3 user showdown (shown seats 1, 2, 3, 5; seat 3 wins), When `TableView` renders it
  with `renderToString`, Then the result block has exactly one winner line, `data-seat="3"`, reading
  "You win $16 · Pair of aces", and its `role="group"` with `aria-label="Your shown cards"` holds exactly the
  `data-card` codes `['Ac', 'Ad']`, equal to seat 3's engine hole cards (`played.players.find(p => p.seat === 3).holeCards`
  mapped through `formatCard`). Fails on M3a and M3b (`['7c','2d']`) and on M3c and M3d (`['Kh','Kd']`).
- Verification: acceptance `tests/ui/user-shown-cards.acceptance.test.tsx::a user at seat 3 sees their own cards as Your shown cards`

## 7. Edge cases
- Highest card on the board, first card lower: SPEC-01. Ace-high via the first card is already covered (`tests/table/hand-result.test.ts:27`).
- Winner not seated: SPEC-02 (unreachable in the app today; pinned as an invariant).
- User not at the default seat, other seats shown before and after: SPEC-03.
- User shown but losing: N/A — losers' cards are never shown (TASK-3.4 Q-3).

## 8. Security considerations
N/A — tests only, no input, no dependency, no randomness (fixed deck). Fairness: SPEC-03 also confirms the
result shows only the winner's cards (the group holds exactly two codes).

## 9. Non-functional
Both new files run in under 1 s each under `npx vitest run <file>`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/table/hand-result-edges.acceptance.test.ts tests/ui/user-shown-cards.acceptance.test.tsx`
- New tests: `tests/table/hand-result-edges.acceptance.test.ts` → SPEC-01, SPEC-02;
  `tests/ui/user-shown-cards.acceptance.test.tsx` → SPEC-03.
- Judge scenario: run the Run command (passes); apply each mutant M1a–M3d from §5 in turn, rerun, confirm the
  named test fails with the stated value, revert; `git diff --stat src` is empty at the end.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-3.22/qa.md`.
