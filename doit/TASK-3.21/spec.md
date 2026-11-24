# Spec: TASK-3.21 — Remove the temporary short-stack top-up once all-ins and rebuy exist

Status: READY (approved 2026-11-24)
Task: TASK-3.21 · Parent/epic: TASK-3 · Requirements: REQ-007.4, REQ-007.2, REQ-007.5, REQ-008.4, REQ-008.5 · Dream: limit-holdem-trainer

## 1. Summary
`nextHand` still tops any seat below the engine's old $96 minimum back up to 20 big bets: $160 for a cash user,
800 for a sit-and-go seat (`src/table/session.ts:537-543`, "TEMPORARY (TASK-3.4 Q-4)"). All-ins, side pots,
the button skipping busted seats, cash bot replacement and Rebuy / Leave table now exist, so this task deletes
the top-up. Every seat then plays the chips it has, which follows REQ-007.4 (no chips added above $0). A cash
user on $0 still goes to Rebuy and a cash bot on $0 is still replaced. In a sit-and-go nothing is ever
refilled, and the table stops at the first bust until TASK-5.2 and TASK-5.7 exist (Q-1). The task also caps
`rebuy()` at `MAX_SESSION_COUNT` (AC#7) and adds two review follow-ups: a reflowed `nextHand` docstring and a
comment on BustDialog's Escape handler.

## 2. Scope
- In scope:
  - `src/table/session.ts`:
    - Delete the TEMPORARY branch, the `minimum` local and the `minimumStack` import (`:8`, `:515`,
      `:537-543`). Every seat that is not a cash bot on $0 is carried at its final stack.
    - Add a sit-and-go stop: `sitAndGoStopped(table)`, a `'stopped'` `NextStep`, a `dealHand` guard and a null
      `nextHandDelay` (Q-1 option A).
    - `rebuy()` refuses at the cap (AC#7). `MAX_SESSION_COUNT` moves here and `session-record.ts` re-exports it.
    - Reflow the `nextHand` docstring.
  - `src/table/session-record.ts`: import and re-export `MAX_SESSION_COUNT` from `./session`. No change to what
    a record may hold or how it is validated.
  - `src/ui/table/useTableSession.ts`: `dealAfterDone` deals nothing once a sit-and-go has stopped.
    `rebuyAndDeal` leaves the table unchanged at the cap, so the UI never throws.
  - `src/ui/table/BustDialog.tsx`: a one-line comment on the Escape `onKeyDown`.
  - `src/engine/hand.ts:135-136`: the `minimumStack` docstring stops naming the session top-up. No code change.
  - `docs/storage/sessions.md:52`: drop "the TEMPORARY short-stack top-up applied". Add one sentence saying a
    stopped sit-and-go's record is not resumable until TASK-5.2.
  - Tests:
    - A new headless acceptance file and a new every-push Playwright spec.
    - Re-pins of two locked files under their owners (Q-2): `tests/table/next-hand.acceptance.test.ts`
      (TASK-3.4) and `tests/table/rebuy.acceptance.test.ts` (TASK-3.11).
    - Rewrites of two unlocked unit tests (`tests/table/next-hand.test.ts`, `tests/table/game-type.test.ts`).
    - `tests/support/session-play.ts`: `playSession` rebuys a busted user before dealing.
- Not doing:
  - Empty sit-and-go seats, dealing a hand without the busted seats, and skipping empty seats in positions,
    records and the view. That is TASK-5.2.
  - Ending a sit-and-go, the finishing position and the Session Report (TASK-5.7, TASK-5.8, E10).
  - Any new user-visible text or control. A stopped sit-and-go shows the last result, and Leave table works as
    today.
  - Any change to the engine's rules, the bots, advice, the playtest runner or the session-record format. The
    playtest runner never calls `nextHand`: it imports only `drawReplacementStyle` from the session
    (`src/playtest/runner.ts:30`) and has its own stack rules (`:392-395`). So no playtest output, golden
    output or 10,000-hand SHA changes.
  - The review panel's Continue label (TASK-9.2).
  - Any slow or scale test. Every new check runs in seconds in the normal suite.
- Scope budget: files=13, lines=560

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `rebuy()` at the cap throws `RangeError('No rebuy: the rebuy limit is reached')`. It checks this after the existing "during a hand" and "has chips" checks, so those keep their messages. | yes | AC#7 allows a RangeError. Every other `rebuy` refusal is a RangeError with a `No rebuy:` prefix (`src/table/session.ts:439-444`). | Return the table unchanged. |
| A-2 | At the cap, `rebuyAndDeal` returns `t` unchanged, so clicking Rebuy does nothing and the dialog stays. The UI shows no message. | yes | Reaching the cap takes 10^9 completed bust hands, and `handsPlayed` has the same cap. A throw inside a `setTable` updater would crash the table. | Show a message, which would be new user-visible copy for a state that cannot be reached. |
| A-3 | `MAX_SESSION_COUNT` is defined in `src/table/session.ts` and re-exported unchanged from `src/table/session-record.ts`. | yes | `session-record.ts` already imports `./session` (`src/table/session-record.ts:3-16`), so `session.ts` cannot import it back without a cycle. Existing importers (`e2e/history.spec.ts:3`, the tests) keep working. | Pass the cap into `rebuy` as a parameter. |
| A-4 | The AC#4/#5 e2e seeds a stored cash session like TASK-3.11 A-6. It uses the default 6-max table with all TAG bots, `handsPlayed: 12`, the user on $50 and button 3, and pins the replay words `[40, 1, 2, 3]` with `stubReplayWords`. Hand 13 leaves the user on $18. Hand 14 is dealt by the real `nextHand` and shows all three all-in labels and the Pots list. Its result shows `Main pot $62 · Dee wins $62` and `Side pot $124 · Dee wins $124`. These values come from a headless prototype with the top-up removed. The headless SPEC-03 pins them first. If the browser shows different values, the builder picks another seed from the same search and records it here. | yes | A seeded short stack is the only quick, deterministic way to reach a live all-in. The top-up makes this test fail today, because hand 14 would start at $160, so the test really proves the removal. | An opt-in slow spec that plays until the user is short. |
| A-5 | `tests/support/session-play.ts` `playSession` calls `rebuy` when `nextStep` is `'rebuy'` before it deals. Without the top-up, the user in `tests/table/resume.acceptance.test.ts` (TASK-2.6, locked) busts within 25 hands and the deal throws `The user has no chips: rebuy first`. This fix in the unlocked helper makes that locked test pass unchanged. This was checked on a scratch copy. | yes | The helper exists to play a session through, and a real session rebuys. No locked file changes. | Re-pin the locked TASK-2.6 test to a shorter session. |
| A-6 | `sitAndGoStopped` reads the same stacks as `userBusted`: the final stacks of a finished hand, or `table.stacks` when no hand is dealt. It is always false mid-hand and always false in cash. | yes | This mirrors D-3 of TASK-3.11 (`src/table/session.ts:425-434`), so the result and the next deal agree. | Check only `table.stacks` after `nextHand`. |

## 3. Current system
- Toolchain: strict TypeScript, React 19, Vite, Vitest (node environment, v8 coverage) and Playwright on
  Chromium and WebKit with axe (`package.json:12-31`, `playwright.config.ts:13-16`). Slow checks run only under
  `TLH_SLOW_TESTS=1` (`package.json` `test:slow`, `e2e:slow`).
- The top-up: `nextHand` (`src/table/session.ts:512-555`). A cash bot on $0 is replaced and a cash bot on $1 or
  more keeps its stack (`:522-536`, TASK-6.8). A cash user on $0 is carried at 0 (`:537-538`, TASK-3.11). Every
  other seat, meaning a cash user on $1–$95 or any sit-and-go seat below `minimumStack` (480 at 20/40), gets
  `buyIn(tableStake(config))`: $160 at $4/$8, 800 in a sit-and-go (`:539-543`).
- The engine accepts any stack of $1 or more. A stack below a blind posts it all-in (`src/engine/hand.ts:197-202`,
  `:265-279`). A $0 seat must be left out by the caller (`:197`). `createHand` needs 2 to 10 seats (`:157-159`).
- Why a sit-and-go bust cannot simply be dealt around yet:
  - `dealHand` passes every `table.stacks` entry to `createHand` (`src/table/session.ts:462-471`). A $0 seat
    therefore throws `Stack at seat N must be an integer of at least 1`.
  - `tableView` computes slots against the dealt seats and throws `Seat N is not at the table` for a seat that
    was not dealt in (`src/table/table-view.ts:101-104`, `:194`, `:221-223`).
  - `completedHand` throws `Seat N is not dealt in` (`src/table/session.ts:644-646`).
  - Session records reject a $0 sit-and-go seat (`src/table/session-record.ts:207-210`, pinned by the locked
    `tests/table/rebuy.acceptance.test.ts:196-207`).
  - Fixing all of this is TASK-5.2's job.
- The sit-and-go is reachable live: Game Config offers it (`src/ui/config/GameConfigScreen.tsx:30-33`), and
  `seatSession` deals 1,500 chips at 20/40 (`src/table/session.ts:121-136`).
- The UI deal path: `dealAfterDone` and `rebuyAndDeal` (`src/ui/table/useTableSession.ts:62-70`), the auto-deal
  timer driven by `nextHandDelay` (`:194`), and the deal effect on step `'deal'` (`:143-150`). Invalid stored
  sessions are skipped and logged with `console.error('Session record could not be read', …)`
  (`src/table/session-record.ts:255-270`, `src/ui/App.tsx:42-44`).
- `MAX_SESSION_COUNT = 1_000_000_000` (`src/table/session-record.ts:62`). The record parser caps `rebuys`
  (`:178`). `rebuy()` adds 1 with no cap (`src/table/session.ts:438-453`).
- All-in labels come from `actionLabel` and `isShortAllIn` (`src/table/action-bar.ts:31-75`). The Pots list
  comes from `potLines` (`src/table/table-view.ts:169-180`) and Pot winners from `handResultView`
  (`src/table/hand-result.ts:151-167`).
- Locked tests that fail when the top-up is removed. This was checked by deleting the branch in a scratch copy
  and running the whole Vitest suite: 1001 tests passed, and the 5 failures below plus one scratch-copy
  git-only failure.
  - `tests/table/next-hand.acceptance.test.ts:93-113` (TASK-3.4 SPEC-10): it expects the user on $95 to become
    $160, and it pins the TEMPORARY comment and the `< minimum ? buyIn(` line.
  - `tests/table/rebuy.acceptance.test.ts:97-101` (TASK-3.11): it expects a sit-and-go user on 0 to get 800,
    a 1500 ms delay and `'deal'`.
  - `tests/table/rebuy.acceptance.test.ts:225-226` (TASK-3.11): it expects the user on $95 to become $160.
  - Unlocked: `tests/table/next-hand.test.ts:100-118` and `tests/table/game-type.test.ts:49-76`.
  - `tests/table/resume.acceptance.test.ts:113-152` (TASK-2.6) fails only through `playSession`. A-5 fixes
    it without touching the locked file.
  - TASK-3.4 SPEC-11 (`next-hand.acceptance.test.ts:115-158`) and the first test (`:51-91`) still pass. Their
    top-up expectations are now dead code and are re-pinned to the new rule (AC#3).
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/table/session.ts:427` `userBusted` → the pattern for `sitAndGoStopped` (A-6).
  - `src/table/session.ts:390`, `:455-473` → the `'rebuy'` step and `dealHand` guard pattern, reused for
    `'stopped'`.
  - `tests/support/table-scenarios.ts` `withFinalStacks(stacks, base?)` and `KINGS_SHOWDOWN` → headless fixtures.
  - `e2e/rebuy.spec.ts:33-74` `seededSession`, `openPausedClock`, `seedStoredSessions` and `runUntil` →
    the e2e seeding pattern.
  - `e2e/support/table-harness-bundle.ts:52` `stubReplayWords`, and `e2e/support/paused-clock.ts`
    `runUntilMyTurn` and `axeWithPausedClock`.
  - `tests/support/session-play.ts` `playHand` and `checkOrCall` → the headless play in SPEC-03.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | A sit-and-go seat (bot or user) is never refilled. A short seat plays its chips, and a seat on 0 is carried at 0. Once any sit-and-go seat ends a hand on 0, the sit-and-go stops: `nextStep` is `'stopped'` on the next-hand state, `nextHandDelay` is null, `dealAfterDone` deals nothing and `dealHand` throws. No new text is shown. The stored record of a stopped sit-and-go keeps its $0 seat and is rejected on read as today, so it is never offered for Resume. | See Q-1 (B: keep refilling only a $0 sit-and-go seat; C: pull TASK-5.2's empty seats in now) | AC#6 forbids any refill. Dealing around a $0 seat crashes four places that TASK-5.2 owns. This is the smallest safe change, and it adds no copy and no format change. | yes | user (Q-1, qa.md: auto-accepted, recommended A) |
| D-2 | Re-pin the locked tests under their owners: TASK-3.4 for `tests/table/next-hand.acceptance.test.ts`, TASK-3.11 for `tests/table/rebuy.acceptance.test.ts`. Use `doit.py unlock` with reason "TASK-3.21 Q-2". Each change is listed in §5 and keeps the same number of `expect` calls. | Add only new tests and leave the locked ones failing, which is impossible. Delete the TEMPORARY-pinning test. | AC#3 asks for TASK-3.4's SPEC-10 and SPEC-11 tests to be updated to the new rule. The TASK-3.11 lines pin the old top-up by name ("toppedUp") and the 800 refill. | yes | user (Q-2, qa.md: auto-accepted; unlock reason "TASK-3.21 Q-2") |
| D-3 | The new step value is named `'stopped'`, and the helper is `sitAndGoStopped(table: TableState): boolean`. | `'over'`, which would collide with TASK-5.7's real ending. | It is an interim halt, not the TASK-5.7 finish. TASK-5.2 and TASK-5.7 replace it. | no | n/a |
| D-4 | `rebuy()` refuses at `rebuys >= MAX_SESSION_COUNT` (A-1). The UI path is a no-op at the cap (A-2). | Clamp silently in `rebuy`. | AC#7 offers either. A throw keeps `rebuy` total and honest, like its other refusals. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session.ts` — remove the top-up and its import; add `sitAndGoStopped`, the `'stopped'` step, the guards in `nextStep`, `dealHand` and `nextHandDelay`; cap `rebuy`; define `MAX_SESSION_COUNT`; reflow the `nextHand` docstring
- `src/table/session-record.ts` — import and re-export `MAX_SESSION_COUNT` from `./session`; delete the local definition
- `src/ui/table/useTableSession.ts` — `dealAfterDone` guard for a stopped sit-and-go; `rebuyAndDeal` no-op at the cap
- `src/ui/table/BustDialog.tsx` — one-line comment on the Escape `onKeyDown`
- `src/engine/hand.ts` — `minimumStack` docstring only
- `docs/storage/sessions.md` — line 52 wording; a stopped sit-and-go is not resumable until TASK-5.2
- `tests/table/short-stack.acceptance.test.ts` — new: SPEC-01 to SPEC-06
- `e2e/short-stack.spec.ts` — new, every push: SPEC-07
- `tests/table/next-hand.acceptance.test.ts` — locked (TASK-3.4), re-pin: SPEC-08
- `tests/table/rebuy.acceptance.test.ts` — locked (TASK-3.11), re-pin: SPEC-09
- `tests/table/next-hand.test.ts` — unit, unlocked: user $95 kept, sit-and-go $0 kept (SPEC-10)
- `tests/table/game-type.test.ts` — unit, unlocked: rename and rewrite SPEC-08 to "never refills" (SPEC-10)
- `tests/support/session-play.ts` — `playSession` rebuys a busted user (A-5)

### Components, interfaces and data
- `export type NextStep = 'deal' | 'bot' | 'user' | 'done' | 'rebuy' | 'stopped';`. Docstring: "'stopped': a
  sit-and-go seat is on 0, so nothing more is dealt (TASK-3.21 D-1, until TASK-5.2/5.7)".
- `export function sitAndGoStopped(table: TableState): boolean`. It is true iff `config.gameType ===
  'sit-and-go'` and some seat has 0 chips between hands. With `hand === null` it reads `table.stacks`. With a
  finished hand it reads `hand.players[].stack`. Mid-hand it is false (A-6). Pure.
- `nextStep`: when `hand === null`, return `'rebuy'` if `userBusted`, else `'stopped'` if `sitAndGoStopped`,
  else `'deal'`. The other branches are unchanged.
- `dealHand`: if the step is `'stopped'`, throw `RangeError('The sit-and-go has stopped: a seat has no
  chips')`. This check goes before the existing `'Not a deal step'` check.
- `nextHandDelay(table, hold)`: null also when `sitAndGoStopped(table)`.
- `nextHand`: in the `stacks` map, a cash bot on $0 is replaced as today. Every other seat returns
  `{ seat, stack }`. The comment `// The busted cash user waits at Rebuy / Leave table on $0 (REQ-007.2).`
  becomes one comment over the carry. It covers the cash user on $0 (Rebuy), every short seat (plays its chips,
  REQ-007.4) and a sit-and-go seat on 0 (stops, D-1). The button, hand number and bot ids are unchanged. The
  button still rotates over all seats: in cash every seat has chips at the next deal, and a stopped sit-and-go
  deals nothing.
- Docstring reflow: replace `src/table/session.ts:508-511` with whole sentences wrapped at about 110 columns,
  for example: "The session ready for the next deal: final stacks carried, button one seat on, hand number +
  1. Every seat keeps its chips (REQ-007.4). In cash a user on $0 waits at Rebuy (userBusted) and a bot on $0
  is replaced by a new bot (REQ-007.5): next unused replacement name, style drawn from the line-up with the
  finished hand's replay code, a fresh buy-in and the next bot id. A sit-and-go seat on 0 stops the sit-and-go
  (sitAndGoStopped). Throws RangeError if a replacement draw has no replay code."
- `export const MAX_SESSION_COUNT = 1_000_000_000;` moves to `session.ts` with its docstring. `session-record.ts`
  adds `MAX_SESSION_COUNT` to its `./session` import and has `export { MAX_SESSION_COUNT };`.
- `rebuy(table)`: after the two existing checks, `if (table.rebuys >= MAX_SESSION_COUNT) throw new
  RangeError('No rebuy: the rebuy limit is reached');`. Docstring: "RangeError if a hand is dealt, the user is
  not busted, or rebuys is already MAX_SESSION_COUNT."
- `dealAfterDone(t, code)`: `nextStep(t) === 'done' && !userBusted(t) && !sitAndGoStopped(t) ? dealHand(nextHand(t),
  code) : t`. Docstring: "… and the user is not busted and the sit-and-go has not stopped (TASK-3.21 D-1)".
- `rebuyAndDeal(t, code)`: `userBusted(t) && t.rebuys < MAX_SESSION_COUNT ? … : t`, imported from the session.
- BustDialog line 23: above `onKeyDown`, add
  `// Chromium closes a modal on a second Escape without a cancelable cancel event, so stop the key itself.`
- `src/engine/hand.ts:135-136`: "The most one player can put into a capped hand ($96 at $4/$8). Bounds the A-4
  stakes check. createHand's own floor is $1: a short stack posts an all-in blind."

### Rules and algorithms
- Worked examples at $4/$8, with final stacks in seat order 1..6, seat 5 the user, the rest TAG bots:
  - `[158, 222, 160, 160, 95, 165]` → next stacks `[158, 222, 160, 160, 95, 165]`. The deal posts from these, so
    seat 5's `startingStack` is 95 (AC#2).
  - `[160, 222, 160, 160, 1, 165]` → the user keeps 1. If the user is in the big blind, they post $1 all-in.
  - `[0, 222, 160, 160, 30, 165]` → seat 1 gets a new bot with $160, and the user keeps 30.
  - `[160, 222, 160, 160, 0, 165]` → the user stays on 0 and the step is `'rebuy'` (unchanged).
- Sit-and-go at 20/40 with 1,500 starting chips:
  - `[479, 1500, 1500, 1500, 1500, 2521]` → carried as is. `sitAndGoStopped` is false and the step is
    `'deal'`.
  - A bot on 0: `[0, 1979, 1500, 1500, 1500, 2521]` → carried as is (no 800), with no replacement.
    `sitAndGoStopped` is true, `nextHandDelay` is null, the step is `'stopped'`, and `dealHand` throws.
  - The user on 0 behaves the same way. `userBusted` stays false (cash only), so no Rebuy dialog opens.
- The rebuy cap, starting from a busted cash table between hands:
  - `rebuys: MAX_SESSION_COUNT - 1` → after `rebuy` it is `MAX_SESSION_COUNT`.
  - `rebuys: MAX_SESSION_COUNT` → `rebuy` throws, and `rebuyAndDeal` returns the same object.

### Error handling and configuration
- New messages, all `RangeError`: `The sit-and-go has stopped: a seat has no chips` (from `dealHand`) and
  `No rebuy: the rebuy limit is reached` (from `rebuy`). No configuration.

### Locked-test edits (Q-2; each keeps the same `expect` calls and changes only expected values, titles and dead branches)
| File (owner) | Change |
|---|---|
| `tests/table/next-hand.acceptance.test.ts` (TASK-3.4) | **Test 1** (`:56`): `final.map((s) => (s < 96 ? 160 : s))` → `final`. **Test 2**, retitled "a seat below the old $96 minimum plays its own chips in the next hand": the `short` expectation becomes `[158, 222, 160, 160, 95, 165]`. `expect(() => dealHand(short, …)).not.toThrow()` becomes `expect((dealHand(short, …).hand as HandState).players.map((p) => p.startingStack)).toEqual([158, 222, 160, 160, 95, 165])`. The `edge` block is unchanged. In the source check, `marker` and `topUp` become `toBe(-1)`. `near` becomes the whole file, with `not.toContain('TASK-1.16 / TASK-3.11')` and `not.toMatch(/TEMPORARY \(TASK-3\.4 Q-4\)/)`. **Test 3** (SPEC-11): the `else { expect(stack).toBeLessThan(96) }` branch becomes `else { expect(before?.kind).toBe('bot') }`, which says a changed stack is only ever a replaced bot. |
| `tests/table/rebuy.acceptance.test.ts` (TASK-3.11) | `:99-101`: `nextHandDelay(sitAndGo)` → `toBeNull()`. `stacks[4]` → `{ seat: 5, stack: 0 }`. `nextStep(nextHand(sitAndGo))` → `'stopped'`. `:225-227`: rename `toppedUp` to `short`, expected stack `{ seat: 5, stack: 95 }`, and the same rename at `:230`. |

## 6. Behaviour specification

### SPEC-01: A short cash user keeps their chips into the next hand
- Verifies: AC#1, AC#2
- Behaviour: Given `KINGS_SHOWDOWN` ($4/$8) with final stacks `[158, 222, 160, 160, 95, 165]`, When `nextHand`
  runs and the next hand is dealt with `replayCodeFromWords([1, 1, 2, 3])`, Then:
  - `stacks` is `[158, 222, 160, 160, 95, 165]`.
  - The dealt hand's `players[].startingStack` is `[158, 222, 160, 160, 95, 165]`.
  - `rebuys` is 0 and `nextStep` before the deal is `'deal'`.
  - The same holds for user stacks 1, 4, 8 and 30 (each kept exactly).
  - A user on 0 still gives `'rebuy'`, and a bot on 0 is still replaced with $160 while a bot on 30 keeps 30.
- Verification: acceptance `tests/table/short-stack.acceptance.test.ts::a seat below the old $96 minimum is not topped up and plays its chips`

### SPEC-02: The top-up code and comment are gone from the session
- Verifies: AC#3
- Behaviour: Given the text of `src/table/session.ts`, When it is searched, Then it contains no
  `TEMPORARY (TASK-3.4 Q-4)`, no `TEMPORARY`, no `< minimum ? buyIn(` and no `minimumStack`.
- Verification: acceptance `tests/table/short-stack.acceptance.test.ts::session.ts carries no TEMPORARY top-up`

### SPEC-03: A seeded short user meets every all-in label and live side pots
- Verifies: AC#4, AC#5
- Behaviour: Given the A-4 seed (default 6-max cash, all TAG, hand 13, button 3, user $50) and the replay
  code `replayCodeFromWords([40, 1, 2, 3])` for hands 13 and 14, When hand 13 is played with `checkOrCall` for
  the user and bots by `stepBot`, and `nextHand` then deals hand 14 with the same code, Then:
  - The user ends hand 13 on 18, and hand 14 deals the user `startingStack` 18.
  - During hand 14 `userActionBar` shows these labels in order: `['Fold', 'Call $4', 'Raise all-in to $6']`,
    then `['Check', 'Bet all-in $2']`, then `['Fold', 'Call all-in $2']`.
  - `tableView(...).pots` has 2 or more lines at some point while hand 14 is live.
  - `handResultView(...).pots.map((p) => p.text)` is
    `['Main pot $62 · Dee wins $62', 'Side pot $124 · Dee wins $124']`.
  - These are the prototyped values (A-4).
- Verification: acceptance `tests/table/short-stack.acceptance.test.ts::the e2e seed reaches all-in labels and side pots after a short carry`

### SPEC-04: A sit-and-go seat is never refilled, short or busted
- Verifies: AC#6
- Behaviour: Given a finished sit-and-go table (20/40), When a seat ends the hand on `minimumStack - 1`
  (479), Then `nextHand` carries 479 and the step is `'deal'`. When instead bot seat 1 ends on 0, Then
  `nextHand` carries 0 with the seat's name, style and bot id unchanged. When instead the user ends on 0, Then
  the user is carried at 0 and `userBusted` is false. In none of these cases does any seat's next stack differ
  from its final stack (no 800, no 1,500).
- Verification: acceptance `tests/table/short-stack.acceptance.test.ts::a sit-and-go seat is never refilled`

### SPEC-05: A sit-and-go stops at its first bust instead of crashing
- Verifies: AC#6
- Behaviour: Given a finished sit-and-go table with any seat on 0, Then:
  - `sitAndGoStopped` is true and `nextHandDelay` is `null` (held or not).
  - `dealAfterDone(t, code)` returns `t` (the same object).
  - `nextStep(nextHand(t))` is `'stopped'`.
  - `dealHand(nextHand(t), code)` throws `RangeError('The sit-and-go has stopped: a seat has no chips')`.
  - Mid-hand, and for any cash table, `sitAndGoStopped` is false.
- Verification: acceptance `tests/table/short-stack.acceptance.test.ts::a sit-and-go with a seat on 0 deals nothing more`

### SPEC-06: Rebuy refuses at the stored rebuy cap
- Verifies: AC#7
- Behaviour: Given a busted cash session restored from a record with `rebuys: MAX_SESSION_COUNT`, When
  `rebuy` is called, Then it throws `RangeError('No rebuy: the rebuy limit is reached')`, and
  `rebuyAndDeal(t, code)` returns `t` unchanged. Given `rebuys: MAX_SESSION_COUNT - 1`, `rebuy` gives
  `MAX_SESSION_COUNT`. A further `rebuy`, even after a dealt bust hand and `nextHand`, throws. `sessionRecord`
  of any state reached this way has `rebuys <= MAX_SESSION_COUNT`, and `parseSessionRecord` accepts it.
  `MAX_SESSION_COUNT` imported from `src/table/session-record.ts` and from `src/table/session.ts` is the same
  value, 1,000,000,000.
- Verification: acceptance `tests/table/short-stack.acceptance.test.ts::rebuy never counts past MAX_SESSION_COUNT`

### SPEC-07: In the live app a short user sees all-in labels, the Pots list and Pot winners
- Verifies: AC#4, AC#5
- Behaviour: Given the A-4 seed stored in IndexedDB, the paused clock and `stubReplayWords([40, 1, 2, 3])`,
  When the user chooses Resume, plays hand 13 by clicking Check or Call, and waits for the auto-deal of hand
  14, Then:
  - The header reads `Cash · 6 players · $4/$8 · Hand #14`.
  - The user seat's stack reads `$18`, not `$160`.
  - At the user's turns the "Your actions" buttons read `Fold`, `Call $4`, `Raise all-in to $6`, then `Check`,
    `Bet all-in $2`, then `Fold`, `Call all-in $2`, and the user clicks the Call / Check button each time.
  - While hand 14 is live, the `Pots` list is visible with 2 or more items.
  - At the result, the `Pot winners` list reads `['Main pot $62 · Dee wins $62', 'Side pot $124 · Dee wins
    $124']`.
  - Axe finds no serious violations with the Pots list shown and at the result.
  - No request leaves the origin.
  - It runs in Chromium and WebKit on every push.
- Verification: acceptance `e2e/short-stack.spec.ts::a short user sees all-in labels, side pots and pot winners in the live session`

### SPEC-08: TASK-3.4's SPEC-10 and SPEC-11 tests state the new rule
- Verifies: AC#3
- Behaviour: Given the re-pins in §5 under TASK-3.4, When `tests/table/next-hand.acceptance.test.ts` runs,
  Then all four tests pass with the same number of `expect` calls as before. SPEC-10's test expects $95 kept
  and pins that the TEMPORARY marker is absent. SPEC-11's test allows a changed stack only for a replaced bot.
- Verification: integration `npx vitest run tests/table/next-hand.acceptance.test.ts`

### SPEC-09: TASK-3.11's rebuy acceptance tests follow the no-refill rule
- Verifies: AC#1, AC#6
- Behaviour: Given the re-pins in §5 under TASK-3.11, When `tests/table/rebuy.acceptance.test.ts` runs, Then
  every test passes with the same number of `expect` calls. A sit-and-go user on 0 is carried at 0, with a
  null delay and `'stopped'`. A cash user on $95 is carried at $95 and still cannot rebuy.
- Verification: integration `npx vitest run tests/table/rebuy.acceptance.test.ts`

### SPEC-10: The unit tests name and assert the no-refill rule
- Verifies: AC#1, AC#6
- Behaviour: Given the unlocked unit tests, When they run, Then they assert the no-refill rule:
  - In `tests/table/next-hand.test.ts` "the user and sit-and-go seats are never replaced", the user on 95 is
    expected at 95 and sit-and-go seat 1 on 0 at 0.
  - `tests/table/game-type.test.ts` renames its SPEC-08 test to "sit-and-go resolves without a stake and never
    refills a short or busted seat". It deletes the "Recorded deviation" comment and expects seat 1 on 479 to
    stay 479 (not 800), then a seat on 0 to stay 0.
  - The full `npm test` passes.
- Verification: unit `tests/table/game-type.test.ts::sit-and-go resolves without a stake and never refills a short or busted seat`

### SPEC-11: Review follow-ups in nextHand and BustDialog
- Verifies: AC#3
- Behaviour: Given the TASK-3.11 review follow-ups, When the code is read and checked, Then:
  - The `nextHand` docstring is the reflowed text in §5. No line in it ends a sentence and starts the next on
    the same short line, as in today's "In cash the\n user on $0 … In cash a\n bot".
  - `src/ui/table/BustDialog.tsx` has the one-line Chromium comment directly above `onKeyDown`.
  - `npm run lint` and `npm run typecheck` pass.
- Verification: command `npm run lint && npm run typecheck`

## 7. Edge cases
- Boundary stacks: $1, $4 (the big blind), $95, $96 and 0 (SPEC-01, and the `edge` case in SPEC-08). 479 and 0
  in a sit-and-go (SPEC-04).
- The user and a bot bust in the same hand (cash): the bot is replaced and the user stays on 0 for Rebuy. This
  is the existing TASK-3.11 test, unchanged.
- Two sit-and-go seats bust in one hand: carried at 0 each, and the sit-and-go stops (SPEC-05 covers any
  seat).
- A stopped sit-and-go with the review held: Deal next hand is a no-op through `dealAfterDone` (SPEC-05). The
  button stays visible until TASK-5.7 or TASK-5.8.
- Resume of a stopped sit-and-go: its record has a $0 seat and is rejected on read as today. Home shows no
  Resume for it, and the console logs the existing "Session record could not be read" (D-1, Q-1).
- The rebuy count at the cap (SPEC-06). Concurrency: N/A, because the table state is a single React state with
  pure updaters.
- Heads-up cash with a short user: the engine already handles heads-up all-in blinds (TASK-1.11, TASK-1.14).
  Nothing new.

## 8. Security considerations
- Trust boundary: stored session records (IndexedDB). Validation is unchanged. `rebuys` is already capped on
  read (`src/table/session-record.ts:178`), and `rebuy` now refuses to go past the cap, which closes the
  TASK-3.11 security MINOR (doc-109).
- No new dependencies, secrets, logging of sensitive data, or randomness. Replay codes and the bot draws are
  unchanged.

## 9. Non-functional
- No performance targets change. The new tests run in seconds in the normal suite: one headless file, and one
  Playwright spec that plays 2 hands under the paused clock. Nothing goes in the slow group.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run dev`. Start a cash game and play until the user drops below $96: the next hand starts
  with exactly those chips and the action bar shows `… all-in …` labels when short. Or seed it: in DevTools →
  IndexedDB → `tlh-trainer` → `sessions`, set the paused record's user `stack` to `50` and Resume. For a
  sit-and-go, play until a seat busts: the result stays and no further hand is dealt.
- New tests (path → SPEC ids):
  - `tests/table/short-stack.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06
  - `e2e/short-stack.spec.ts` → SPEC-07
  - Re-pinned or rewritten: `tests/table/next-hand.acceptance.test.ts` (SPEC-08),
    `tests/table/rebuy.acceptance.test.ts` (SPEC-09), `tests/table/next-hand.test.ts` and
    `tests/table/game-type.test.ts` (SPEC-10)
- Judge end-to-end scenario: `npm test && npm run build && npx playwright test e2e/short-stack.spec.ts
  e2e/rebuy.spec.ts e2e/next-hand.spec.ts e2e/resume.spec.ts e2e/side-pots.spec.ts`. Then `npm run preview`,
  follow the seeded Run command steps and see hand 14 start at $18 with the all-in labels and the two pot lines.
  Also run `npm run playtest -- --hands 10000 --seed 42` and confirm its output is byte-identical to `main`,
  because the runner does not use `nextHand`.

## 11. Open questions
None. Q-1 (D-1, option A: stop the sit-and-go at its first bust) and Q-2 (D-2, re-pin both locked tests under
their owners TASK-3.4 and TASK-3.11, unlock reason "TASK-3.21 Q-2") are answered in `doit/TASK-3.21/qa.md`
(recommended options, auto-accepted; listed for review as user-visible interim behaviour and cross-story
locked-test edits). Per the Spec Detective note, the unlocked unit tests `tests/table/next-hand.test.ts` and
`tests/table/game-type.test.ts` are re-pinned with their check counts kept (SPEC-10).

## 12. Clarifications log
See `doit/TASK-3.21/qa.md`.
