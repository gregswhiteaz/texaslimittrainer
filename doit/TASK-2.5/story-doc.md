# TASK-2.5: Choose a line-up preset for the bots

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-2 — Launch and set up a session · Milestone: m-1 · Requirements: REQ-009, REQ-012 · Branch: doit/TASK-2.5

## What was asked
Game Config's Opponents panel offers the presets Mixed, Tough and Soft (Mixed on first use). It lists one row per bot, clockwise from the user, with each bot's name and style, using the E06-S06 line-up module. Names are unique. Rows follow the players count. Start game resolves the line-up through E06-S07, so the table seats exactly the listed bots and the session's line-up name is the preset. Acceptance criteria: fresh Mixed (TAG, Calling station, Maniac, Rock, TAG); Tough at 9 (8 rows, only the first bot a Maniac); Soft 6 to 4 (Calling station, Rock, Calling station); Tough heads-up (one TAG); unique names at 10; Soft at 6 starts with the listed bots and line-up Soft. Spec: doit/TASK-2.5/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Game Config starts on `config.lineUp` if it is Mixed, Tough or Soft, otherwise Mixed. `DEFAULT_SESSION_CONFIG.lineUp` is `'Custom'`, so a fresh screen shows Mixed. | yes | Mixed on first use (REQ-012.2); TASK-2.10 can pre-fill a remembered preset with no change here. | Always start at Mixed |
| A-2 | Rows, and the config Start game passes, are always rebuilt by `configForLineUp(config, players, preset)`. Given `config.seats` are not shown as they are. Replaces TASK-2.2 A-1. | yes | Rows must follow the preset at every size, including 6. | Keep `config` as given while preset and size are unchanged (would show all-TAG under "Mixed") |
| A-3 | Names come from `seatLineUp`: bot k clockwise from the user is `BOT_NAMES[k-1]`. At 6 players the bot at seat 6 is now Ava and seats 1–4 are Ben, Cal, Dee, Eli. | yes | The story says to use E06-S06 (locked by TASK-6.7). | Keep TASK-2.2's ascending-seat naming |
| A-4 | The "You" row stays last, after the bot rows. | yes | Keeps existing markup and locked `You` assertions. | Put the user first |
| A-5 | A TAG row shows the existing label `Tight-aggressive`. AC#1's "TAG" means the style. | yes | Matches the storyboard and TASK-2.2. | Show "TAG" |

## Clarifications and decisions
- Q-1 (auto-accepted, recommended): radio group "Line-up" (Mixed / Tough / Soft) in the Opponents panel, above the bot rows; Mixed on first use.
- Q-2 (auto-approved, routine): name/style-label/row-order edits to locked tests: home.acceptance, game-config-players.acceptance, players-choice, home, table specs, and next-hand names (same seat and amount; later widened to include "Ben wins $8" → "Cal wins $8" at :275).
- Q-3 (user approved): locked e2e tests whose expected results change because the Mixed bots act differently. action-bar re-pinned to new replay words that recreate the Check / Bet $4 flop; next-hand and review keep their pinned code and update expected values (next-hand: "Cal wins $50" and "Cal's cards"; review: winner, entries/grades, badge colours, hand-2 stacks). No assertion removed.
- Q-4 (auto-approved, routine): the new native radios change input counts and a page-wide radio scan in TASK-2.4 game-type, TASK-2.3 stake and TASK-2.1 home tests. Edited to scope selectors and expect the three extra radios; every assertion kept. Raised by builder block 1.
- Q-5 (auto-accepted under the user's unattended-approvals rule, 2026-11-22): the rapid-pace 200-hand helper `foldElseCheck` waited forever for a Fold button when a Calling station limped and the user's big blind was checked to (hand #16; 65-minute timeout). It now clicks Fold only when a Fold button exists and is enabled, else Check. No assertion changed. Raised by builder block 2.
- D-1: only Game Config applies the preset. `DEFAULT_SESSION_CONFIG`, `DEFAULT_SEATS` and `seatSession()` stay all-TAG / `Custom`, so model tests, the table harness and playtests are unaffected. (user-approved)
- D-2: preset control is a radio group outside the field `<dl>` and the seat `<ul>`, so earlier parsers stay valid.
- D-3: routine name edits are auto-approved; edits that change chips, winners, actions or grades need the user.
- D-4: `configForLineUp` lives in `session.ts` (no import cycle).

## What was built
- `src/table/session.ts`: `configForLineUp(config, players, preset)` = `configForPlayers` then `lineUpSessionConfig(sized, preset, seatLineUp(preset, players, userSeat))`. It keeps game type, stake and speed, sets user seat `min(5, n)`, button to the seat after the user, and `lineUp = preset`. `botsClockwise(config)` orders bot seats clockwise from the user.
- `src/ui/config/GameConfigScreen.tsx`: preset state (A-1), "Line-up" radiogroup of `LINE_UP_PRESETS`, rows from `botsClockwise(configForLineUp(...))`, Start game passes the same config. The onChange uses the constant from the list, not the DOM value.
- `src/ui/styles.css`: `.config-lineup` spacing.
- Visible effect: the default table is now the Mixed line-up, and bots really play those styles (so hands at the default table differ from before).
- New tests: `tests/ui/game-config-lineup.acceptance.test.tsx`, `tests/table/lineup-config.acceptance.test.ts`, `tests/table/lineup-config.test.ts`, `e2e/lineup-choice.spec.ts`.
- Locked-test amendments: see Q-2 to Q-5 (files in changes.md). No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 02, 04, 05 | AC#1, 2, 4, 5 | render acceptance tests | pass | gates/*.json |
| SPEC-03, 06, 07, 08 | AC#3, 6; button; kept fields | model acceptance and unit tests | pass | gates/*.json |
| SPEC-09, 10 | browser flows, axe, same-origin | `e2e/lineup-choice.spec.ts`, Chromium + WebKit | pass | build-log.md |
| SPEC-11 | earlier tests with amendments only | `npm test`, `npm run e2e` x2 (150 passed, 12 skipped each), slow rapid-pace group | pass | build-log.md |
| SPEC-12 | lint, typecheck, tests, coverage | `npm test` 190 files / 686 tests passed (14 skipped); lint and typecheck clean | pass | gates/fix-9.json |
| SPEC-13 | playtest | 10,000 hands, seed 42, mixed / tough / soft | 0 invariant violations each | build-log.md |
| SPEC-14 | CI, doc | doc published; CI run on the branch not seen in these artifacts | doc done; CI pending | — |
- Slow group: the 200-hand rapid-pace test passed after the Q-5 fix (6.2 min; 7 passed, 3 skipped). Before the fix, the full `e2e:slow` run (1.1 h) had 14 passed, 5 skipped, 1 failed (rapid-pace :311).
- Gates: 9 runs, all PASS; 582 changed lines.
- Judge: see doit/TASK-2.5/judge/ (not yet run when this doc was written).

## Review
Round 1: no blocking findings (code and security). Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR `e2e/lineup-choice.spec.ts:21`: `useWorkerTimers` / `restorePausedTimers` / `axeWithPausedClock` (about 40 lines) copied verbatim; this is the sixth copy.
- NIT `GameConfigScreen.tsx`: module-level `isPreset` guard is used once, by the `useState` initialiser.

## How to try it
- `npm run dev`, open Game Config, switch Mixed / Tough / Soft and the players count; Start game.
- `npm test`; `npm run e2e`; `TLH_SLOW_TESTS=1 npx playwright test e2e/rapid-pace.spec.ts`
- `npm run playtest -- --hands 10000 --seed 42 --lineup mixed` (or tough / soft)

## Run metrics
Questions asked: 5 (state.json counts 3; qa.md lists Q-1..Q-5) · assumptions logged: 5 (A-1..A-5; state.json shows 0) · review rounds 1 · judge rounds 0 at writing · gate runs 9 · escalations 2 (builder blocks, both resolved) · changed lines 582.

## Known limitations and follow-ups
- Editing a single bot's style and the "Custom" outcome: TASK-2.8 (exists). Randomise line-up: TASK-2.9 (exists). Remembering the last configuration: TASK-2.10 (exists). Random user seat/button: TASK-2.13 (exists per spec). No new follow-ups.
- Every bot's style is the preset's, so the session line-up name is always the chosen preset until TASK-2.8.

### Not tracked (infra, below the value bar)
- [infra] The copied worker-timer/axe helper in e2e specs (6 copies): has not caused a failure.

## Lessons for the factory (proposals — not applied)
- The spec's prototype measurement missed the new-control effects on locked tests (Q-4) and stopped the slow group before it finished (Q-5 surfaced only after a 1.1 h build run, then 6.2 min for the rerun). Proposal: when a spec changes a default that bots play, require the prototype to run the slow group (or grep for scripted-user helpers that assume a Fold button) and to count radios/inputs in locked Game Config tests, so Q-3/Q-4/Q-5 are asked before the build starts.
- state.json `questions` and `assumptions` counters did not match qa.md / the spec table; the counters should be updated when Q-n or A-n entries are added.
