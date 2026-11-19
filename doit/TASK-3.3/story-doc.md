# TASK-3.3: See every seat, the board, the pot and the button at a glance

Status: Done (judge and final CI run pending) · Completed: 2026-11-18 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: REQ-010.3, REQ-013.4, REQ-021.1, REQ-021.3 to REQ-021.8 · Branch: doit/TASK-3.3

## What was asked
TASK-3.1's plain seat list becomes the real table from the Table storyboard. Bot seats sit round an oval felt, with the user at the bottom centre. Each bot seat shows name, style, stack, chips put in this street, last action and a small card-back marker while it holds cards. The user's seat shows both hole cards, stack and position name. The felt shows the board with placeholders up to five cards, plus the pot total. The button seat carries a dealer marker and the seat to act is highlighted and labelled. A header shows "Cash · 6 players · $4/$8 · Hand #1" and a Leave table control. The replay code must appear nowhere during the hand. Spec: doit/TASK-3.3/spec.md.

Not in scope: hiding style labels (TASK-12.2), separate side pots (TASK-3.8), the winner display and next hand (TASK-3.4).

## Look at these first
- `doit/TASK-3.3/table-scene.png` is a 1280 x 720 scripted flop scene. The user sits at the bottom centre with two face-up hole cards, stack and position name. Bot seats run clockwise round the oval felt (Eli lower left, Ava upper left, Ben top, Cal upper right, Dee lower right). Each bot shows name, style, stack, "This street" amount, last action in past tense and a small card-back marker. The felt shows three board cards with two empty placeholders and the pot total. A white "D" disc marks the button. The seat to act has a red border and a "To act" badge. The header holds the game line and Leave table.
- `doit/TASK-3.3/table-live.png` is the live app mid-hand (flop, user to act). It has the same layout and only the board and the user's cards are face up.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Card-back marker is one `CardBack size="small"`, 30 x 42 px (same 60 x 84 viewBox, so the logo scales). Accessible name stays "Face-down card"; default size unchanged. | yes | AC#9 says "a smaller CardBack marker". One code path keeps TASK-3.5's locked tests valid. | Change the size prop in `PlayingCard.tsx` |
| A-2 | Position names (user seat only) are counted from the dealt seats and the button: Button, Small blind, Big blind, Cutoff, Hijack, then Under the gun, +1, +2 … At 6 seats this gives the task's names. | yes | REQ-021.3 names 6-max positions; the engine allows 3–10 seats so the function must be total. | Edit `positionName` in `table-view.ts` |
| A-3 | `TableState.handNumber` added (1-based). `seatSession` sets 1; nothing increments it, so the app shows "Hand #1". "Hand #133" in AC#7 is a scripted state. | yes | One hand per load until TASK-3.4. | Move the count to `SessionConfig` |
| A-4 | Pot total = sum of `pots[].amount` + every `streetContribution` (storyboard "Pot $30" = $26 + $4). Shows $0 before the deal and after the award. | yes | Matches the engine's own split. | Show the awarded amount after the hand (TASK-3.4) |
| A-5 | `<h1>TLH Trainer</h1>` stays above the header line; the header is a `<header>` with the line and Leave table. | yes | Locked tests in `table.acceptance` and `home.spec` assert the h1 and focus. | Make the header line the h1 and edit those tests |
| A-6 | `data-street` and `data-action-count` stay on the Table section; only `data-to-act` is removed. | yes | No visible text names the street or counts actions, and e2e specs use them. | Show the street as text |
| A-7 | Header says "Cash"; Game Config keeps "Cash game". | yes | Both are approved texts on their own screens. | Use "Cash game" in the header |
| A-8 | After the hand ends no seat shows "Waiting" or "To act". Seats keep their last action; non-folded bots keep the card-back marker. | yes | Nobody waits once the hand is over; showdown cards are TASK-3.4. | Clear every seat's action |

## Clarifications and decisions
- Q-1 (user): BotStyle = 'TAG' | 'Calling station' | 'Maniac' | 'Rock', stored as-is and shown as those words; Game Config keeps 'Tight-aggressive'.
- Q-2 (user): past-tense seat text: "Small blind $2", "Big blind $4", "Folded", "Checked", "Called $4", "Bet $4", "Raised to $8"; "Waiting" when not yet acted this street and not to act; "This street $4" only above $0; same lines on the user's seat.
- Q-3 (user): the seat to act has a 2 px #D7262E border and a visible "To act" badge. The dealer is a white "D" disc with accessible text "Dealer button". Seats run clockwise from the user.
- Q-4 (user): Leave table goes straight Home with the Home h1 focused, discarding the in-memory session. TASK-10.1 and E10-S05 replace the handler.
- D-5 (orchestrator, not asked): 8 edits to earlier stories' locked tests (`e2e/table.spec.ts` 1–5, `e2e/action-bar.spec.ts` 6, `e2e/home.spec.ts` 7, `tests/ui/table.acceptance.test.tsx` 8), approved on precedent (TASK-2.1 Q-3, TASK-3.2 Q-1). AC#10 itself requires replacing the `data-to-act` hook with visible text. No assertion removed or weakened. The code reviewer verified this.

## What was built
- `src/table/table-view.ts` (new): headless view model `tableView`, built only from the user's `PlayerView` (never the replay code), plus `lastActionText`, `positionName`, `seatSlot`, `slotPosition`, `potTotal`, `headerText`.
- `src/table/session.ts`: `BotStyle` union, `SessionSeat.style: BotStyle | null`, `TableState.handNumber`.
- `src/ui/table/Table.tsx`: presentational `TableView` (header, seats in slots, felt with board, placeholders and pot, dealer marker, "To act" badge, action bar, Hand over) and the stateful `Table`. `data-to-act` removed.
- `src/ui/table/TableScreen.tsx` and `src/ui/App.tsx`: optional `onLeave` prop. Leave returns Home with the h1 focused.
- `src/ui/cards/PlayingCard.tsx`: `CardBack` `size` prop. `src/ui/config/GameConfigScreen.tsx`: labels for the wider union. `src/ui/styles.css`: storyboard layout.
- Tests and helpers: `tests/support/table-scenarios.ts` (scripted storyboard hand, shared by Vitest and e2e), `tests/table/table-view.test.ts`, `tests/ui/table-display.acceptance.test.tsx`, `e2e/table-display.spec.ts` (Chromium and WebKit), `e2e/support/table-scenes.tsx`, `table-harness-bundle.ts`, `table-locators.ts`, and the D-5 edits.
- No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| 01, 02, 03, 05, 06, 07, 09, 11, 13 | seat content, board, pot, button, to-act, header, no replay code in markup, card-back marker | `tests/ui/table-display.acceptance.test.tsx` | pass | gate fix-2 |
| 04, 08, 10, 12, 14, 15, 18 | layout, highlight, Leave in the app, DOM and accessibility tree free of replay code, logo, axe, 1280 wide, same origin | `e2e/table-display.spec.ts`, Chromium and WebKit | pass | build-log, screenshots |
| 16 | view-model rules | `tests/table/table-view.test.ts` | pass | table-view.ts 100% covered |
| 17 | earlier flows with D-5 edits | e2e and unit specs of TASK-2.1, 3.1, 3.2 | pass | gate fix-2 |
| 19, 20 | lint, typecheck, coverage, playtest | `npm run typecheck`, `lint`, `npm test`, `npm run playtest -- --hands 10000 --seed 42` | pass | 0 invariant violations |
| 21 | CI green, docs | final CI run | pending | after judge |

- `npm test`: 65 files, 242 passed and 1 skipped; coverage 97.4% lines. `npm run e2e`: 74 passed (build run).
- Gates: build-1 and fix-2 PASS. Judge: pending.

## Review
Round 1 code review found 5 MAJORs, all missing test coverage. No behaviour was wrong. All were fixed with test-only additions, and each matching mutant was applied, seen failing, and reverted. Round 2 had 0 findings.
1. Button rotation in position names (buttons 1–5 at 6-max, button 1 at 3-max); mutant `const order = [...seats]` caught.
2. Raise-to amount vs added (`Raised to $8` with `added: 4`); mutant `record.added` caught.
3. Latest record on a street (seat 1 shows 'Called $2'); mutant `.at(0)` caught.
4. Showdown keeps river actions (seat 2 'Checked', seat 5 'Checked', seat 6 'Folded'); mutant `view.street` caught.
5. No street line at $0 (`tests/ui/table-display.acceptance.test.tsx`, after a recorded unlock that only strengthens); mutant `streetAmount >= 0` caught.

Security review was clean in both rounds. Every scripted state was rendered and only the board and the user's cards were face up. The replay code was absent from every one.

### Non-blocking review notes (deliberately not fixed)
- NIT: the `?? 0` stack fallback in `table-view.ts` is unreachable.

## How to try it
`npm run dev`, then start a session. `npm test`, `npm run e2e`, `npm run lint`, `npm run typecheck`. `npm run playtest -- --hands 10000 --seed 42`.

## Run metrics
Questions 4 (+ D-5 decided by the orchestrator) · assumptions 8 · review rounds 2 (5 findings, then 0) · judge rounds pending · gate runs 2 · escalations 0 · changed lines 1606 in 19 files (soft limit 1400, warning).

## Known limitations and follow-ups
- TASK-3.4: increment `handNumber` when the next hand is dealt, and decide what the pot line shows after the award (A-4).
- TASK-10.1: replace the Leave table handler (`App.tsx` `onLeave`) with ending the session and opening the Session Report.
- E10-S05: add the mid-hand "Leave now? Your hand will be folded." confirm dialog before `onLeave` (REQ-004.7).
- TASK-12.2: hide `data-part="style"` and its separator when "Show opponent styles" is off.
- TASK-2.8 / E06: give each BotStyle a Game Config label and selector, and give Calling station, Maniac and Rock their own policies (today all play `tagPolicy`).
- TASK-2.2: confirm position names at 2–5 and 7–10 seats (A-2).
- TASK-3.16: fit 10 seats at 1280 x 720 using `slotPosition`, and merge the e2e locator helpers and duplicated spec helpers into one module.
- TASK-4.4: replace the CSS "D" disc with the drawn dealer button, keeping `data-part="dealer"` and "Dealer button".
- TASK-4.5: draw chips for the street amount and decide whether the "This street" text stays.
- Remove the unreachable `?? 0` stack fallback in `table-view.ts` (NIT; no owner task).

## Lessons for the factory (proposals — not applied)
- The change is 1606 lines against a limit of 1400. Large display stories should be split at spec time (view model plus markup, then browser scene harness).
- Round 1's five MAJORs were all behaviours the spec described but the first test pass left unpinned. Proposal: the test-writer should run a mutant on each SPEC-16-style rule before handing over.
- A locked test had to be unlocked in the review round to add an assertion. Allowing the reviewer's fix brief to name a strengthening-only edit would save a step.
