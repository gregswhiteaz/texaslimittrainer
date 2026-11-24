# TASK-10.2: Leave the table in the middle of a hand

Status: Done · Completed: 2026-11-24 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-004 (004.5, 004.7, 004.8) · Branch: doit/TASK-10.2

## What was asked
Leave table pressed during a hand used to drop the unfinished hand (TASK-10.1 interim). Now it opens a modal "Leave now? Your hand will be folded." with Cancel and Confirm. Play, bots included, is frozen while it is open. Cancel resumes unchanged. Confirm folds the user at once, even out of turn. The bots finish the hand, it is graded and stored like any hand, and the Session Report opens. The forced fold is not a decision: no grade, no decision entry. Spec: doit/TASK-10.2/spec.md.

## Assumptions made without asking — please review
Q-1, A-3, the D-5 locked edits and the play-money unit fixture change were auto-accepted under the unattended rule (qa.md).

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Persisted-format change: optional top-level `forcedFold: true` on the hand record, written only on a left hand. No DB bump. Existing records are unchanged. | yes (before real data relies on it) | The record validator requires decisions to match the user's actions one to one, so a forced fold needs a marker. | Drop the field and relax `parseHandRecord`. |
| A-1 | "In progress" = dealt with no result (`nextStep` user or bot). Before the deal and while the result shows, Leave goes straight out. | yes | Matches the story text. Keeps existing leave tests. | Treat pre-deal as in progress. |
| A-2 | The dialog freezes the table. No bot step is scheduled and an in-flight reply is dropped. After Cancel the same turn is asked again. | yes | AC#2 and AC#7 only hold if bots wait. | Let bots act behind the dialog. |
| A-3 | Dialog copy and behaviour: one `<h2>` "Leave now? Your hand will be folded.", buttons Cancel (focused first) and Confirm, Escape = Cancel, focus returns to Leave table. | yes | Follows EndSessionDialog. | Change the markup in LeaveDialog.tsx. |
| A-4 | After Confirm the header Home and Leave table are disabled. No bust dialog, review panel, badge, Deal next or Rebuy. | yes | No hand 26 may be dealt. No double leave. | Keep the dialog open until the report. |
| A-5 | If the user already folded, Leave still opens the dialog. Confirm folds nothing more. | yes | Literal story. | No dialog when no cards are held. |
| A-6 | If the leaving hand's write fails, the session still ends once the write settles. | yes | The user asked to leave. | Stay on the table. |
| A-7 | `handInProgress` is read from the table as last rendered at click time. | yes | Same as other click handlers. | Read in an updater. |
| D-5 | Locked edits (user-reviewed): (1) `tests/ui/screen-list.acceptance.test.ts` and (2) `e2e/play-money.spec.ts` (both TASK-2.15): LeaveDialog listed and visited in hand 14, then Cancel. (3) `e2e/table-display.spec.ts` (TASK-3.3): Leave then Confirm, expect a focused 1-hand report. No assertion loosened. | yes | Required by the screen-list rule and the new flow. | Revert the edits. |
| Fixture | Unlocked `tests/ui/play-money.test.ts` (owner TASK-2.15): added a LeaveDialog fixture file and "LeaveDialog" to two expected lists. Nothing removed. | yes | It compares fixtures to the real SCREEN_LIST. | Revert. |

## Clarifications and decisions
- Q-1: record marker (above), auto-accepted.
- D-1: the forced fold is an engine operation (`forceFold`), recorded as an ordinary fold action and kept out of `userDecisions`, so it is never graded.
- D-3: all the flow lives in `Table` and `useTableSession`. `App` is untouched and reuses the TASK-10.1 `ending` path.
- D-4: the dialog is rendered only while prompted.

## What was built
- `src/engine/hand.ts`: `forceFold(state, seat)`, in turn or out of turn. The settling tail of `applyAction` moved into a shared private `settle`. `applyAction` behaviour is unchanged.
- `src/table/session.ts`: `handInProgress(table)` and `foldUserToLeave(table)` (pure; leaves `userDecisions` alone; no-op if all-in or already folded).
- `src/table/hand-record.ts`: `forcedFold?: true`, written only when the user's non-blind actions exceed decisions by one and the last is a fold. `parseHandRecord` validates it (exactly `true` or absent).
- `src/ui/table/LeaveDialog.tsx` (new), `Table.tsx`, `useTableSession.ts` (`paused`, `onLeft`, `leaving`, `leave()`), `src/ui/styles.css`.
- `e2e/support/screen-list.ts`: `leave-dialog` entry.
- Docs: `docs/ui/navigation.md`, `docs/storage/hand-records.md`, `docs/ui/play-money.md`.
- No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | forceFold turn, settle, rejects | tests/engine/force-fold.acceptance.test.ts (500-hand sweep) | PASS | judge round 1 |
| SPEC-04..07 | handInProgress, record, parse, all-in | tests/table/leave-mid-hand.acceptance.test.ts | PASS | judge round 1 |
| SPEC-08 | dialog markup, leaving table | tests/ui/leave-dialog.acceptance.test.tsx | PASS | judge round 1 |
| SPEC-09..12 | live dialog, freeze, Cancel, Confirm | e2e/leave-mid-hand.spec.ts | PASS | Chromium + WebKit |
| SPEC-13, 14 | screen list, walk, hand-1 leave | play-money, table-display specs, screen-list test | PASS | judge round 1 |
| SPEC-15 | checks and boundaries | lint, typecheck, unit, golden, playtest, Playwright, CI | PASS | judge round 1 |

- Unit suite: 1267 passed, 43 skipped (pre-existing). Golden 282/282. Playwright 298 passed, 16 skipped (pre-existing), 0 failed. Playtest 10,000 hands seed 42 is byte-identical to main with 0 invariant violations. CI green on both branch runs.
- Judge round 1 PASS 15/15, integrity PASS. Holdout runs (thousands of seeded hands, live app in both browsers) found nothing blocking.
- Gates: build-1 and fix-2 both PASS.

## Review
Round 1: no blocking findings (security: none). Judge: no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- Code MINOR: `e2e/leave-mid-hand.spec.ts:135`, the bot-freeze check is one `runFor(1000)` and one immediate read, so it is timing-sensitive. A mutation without the freeze failed it on Chromium only.
- Code MINOR: nothing pins a forced fold of the seat holding the top bet (see J-1-01).
- NIT: `holdNextHand || leaving` in `useTableSession.ts:281` can never change the outcome (the early return already covers it).
- NIT: the `userMade` helper in `hand-record.ts:137` splits a block of constants.
- NIT: the Tests list in `docs/ui/navigation.md` omits the two new test files.
- Judge LOW J-1-01 and J-1-02: see below.

## How to try it
`npm run dev`, start a game, press Leave table mid-hand. Cancel (play continues), press it again while a bot is to act and Confirm. Your seat reads Folded, the hand finishes, the report counts it, and reload shows no Resume. Tests: `npx playwright test e2e/leave-mid-hand.spec.ts`.

## Run metrics
Questions 1 · assumptions 7 · review rounds 1 (0 blocking) · judge rounds 1 (PASS) · gate runs 2 · escalations 0 · changed lines 937 · files 19.

## Known limitations and follow-ups
- [trainer] Poker-rules decision (J-1-01 / code MINOR): force-folding the seat that holds the top bet leaves `currentBet` unchanged, so the next seat still faces the folded seat's bet. If one seat is left, the folded seat's uncalled part is refunded to it. Real poker forfeits it as dead money. Decide the rule and pin it in a test. The orchestrator is creating a decision task for this.
- [trainer] J-1-02: several forced folds in one hand can break the pot-eligibility invariant (`checkState` "main pot paid seat N, which is not eligible"). Unreachable today (one forced fold per hand). Handle it before `forceFold` is used for more than one seat.
- [trainer] Make the bot-freeze e2e check robust: wait for a real worker reply window instead of one `runFor(1000)` and an immediate read (`e2e/leave-mid-hand.spec.ts:135`). Owner: this task's spec file.
- [trainer] NITs: drop the redundant `|| leaving`, move `userMade` below the constants, list the new tests in `docs/ui/navigation.md`.
- Out of scope by design: error-rate, hint-usage and leak figures (TASK-10.3..10.11), sit-and-go finishing position (TASK-5.11).

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-02 sweep only used checkOrCall and never raised, so the top-bettor case was missed until review. Ask spec writers to enumerate "state reachable only through the new API" cases for new engine entry points.
- The screen-list addition broke an unlocked fixture test (`tests/ui/play-money.test.ts`) that the spec did not list. Add a spec-time grep of tests that read the screen list.
