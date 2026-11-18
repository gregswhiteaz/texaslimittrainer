# TASK-3.1: Play a complete hand against TAG bots at a default 6-max table in the browser

Status: Done (Judge and CI pending at time of writing) · Completed: 2026-11-18 · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: REQ-007.1, REQ-019.6, REQ-024.4, REQ-024.5 · Branch: doit/TASK-3.1

## What was asked
The app stops being a placeholder. It opens on a default cash session (6 players, $4/$8, you plus five TAG bots, every stack $160 = 20 big bets) and plays one complete fixed-limit hand in the browser. You see your two cards face up, the board as it is dealt and plain buttons for your legal actions. Bots act with no artificial delay and never during your turn; if you fold, the bots finish the hand. Spec: doit/TASK-3.1/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Fixed seating from the Table storyboard: Ava, Ben, Cal, Dee, You (seat 5), Eli; button seat 6 (Ava SB, Ben BB, you in the cutoff). Bots have no "Bot" prefix. | yes | Storyboard and TASK-3.3 AC#1/#3; user always acts after a bot, which exercises AC#7 every hand. | Change `DEFAULT_SEATS`/`DEFAULT_BUTTON`; random seat is TASK-2.13 |
| A-2 | Table first shows the seated session (all stacks $160, no cards), then deals in the next macrotask. | yes | Only reading of AC#1 that holds for all six seats (blinds make $158/$156 after the deal). | Show $158/$156 from first paint |
| A-3 | Stacks show chips behind, formatted `$<integer>`. | yes | Matches TASK-3.3 storyboard; money formatting is E03-S19. | Show stack plus street contribution |
| A-4 | Buttons only on the user's turn, one per engine legal action, plain verbs (Fold/Check/Call/Bet/Raise). | yes | TASK-3.2 adds exact-amount labels and disabled bar. | Always-visible disabled buttons |
| A-5 | No artificial bot delay: each deal/bot step is one `setTimeout(…, 0)`. | yes | Rapid (the default speed) = no artificial delay. | Realistic pacing is TASK-3.18 |
| A-6 | Bot decisions run on the main thread. | yes | TAG about 13 ms per decision; off-thread is TASK-3.6. | Web Worker |
| A-7 | `CompletedHand` is in-memory, JSON-serialisable, given to an optional `onHandComplete` and returned by `completedHand(table)`. | yes | Persisted format is TASK-3.9. | Persist now |
| A-8 | Engine/bot errors propagate uncaught; no error UI. | yes | Recovery screen is TASK-13.1. | Inline error |
| A-9 | Test hooks are data attributes on the table root (`data-street`, `data-to-act`, `data-action-count`). | yes | Bot checks change no visible text yet. | Visible last-action text (TASK-3.3) |
| A-10 | $10/$20 is driven via a `config` prop and a test-only harness bundle built inside the e2e test. | yes | Game Config (TASK-2.1) will pass the same prop; nothing ships. | URL parameter / dev route |
| A-11 | e2e makes the real app deterministic by stubbing `crypto.getRandomValues` for 4-word `Uint32Array` requests in `addInitScript`. | yes | Same technique as the locked replay-seed spec. | Seed prop in the shipped app |
| A-12 | The AC#7 timing check (≤ 100 ms) stays enforced in CI. | yes | Bot action and enabled buttons land in the same React commit, so the gap is about 0 ms. | Gate with `CI=true` |

## Clarifications and decisions
- **Q-1 (asked, user answered): what happens when the hand ends.** Answer: one hand per page load. When the hand ends the buttons disappear, final stacks and board stay, a "Hand over" status shows, and nothing further is dealt; reload for a new hand (D-3). TASK-3.4 adds the real result display and the 1.5 s auto-deal and must settle stack carry-over and the engine minimum-stack rule.
- **Settled without asking (qa.md):** bot names and seats come from the Table storyboard (A-1); no artificial bot delay because Rapid is the default (A-5); `CompletedHand` is in-memory only, persistence is TASK-3.9 (A-7).
- D-1: game logic is a headless module (`src/table/session.ts`), React only holds state and schedules. D-2: after each state change `nextStep` decides: deal or bot schedules one `setTimeout(0)`; user or done schedules nothing, so no timer runs during your turn.

## What was built
- `src/table/session.ts` — headless pure functions over an immutable `TableState`: `seatSession`, `nextStep`, `dealHand`, `stepBot` (TAG on the bot's own `PlayerView`), `applyUserAction`, `userActions`, `completedHand`, plus `buyIn` (20 × big bet) and `stakesFor`. Imports engine and bots only.
- `src/ui/table/useTableSession.ts` — hook: owns state, one timer per deal/bot step, ref-guarded `onHandComplete`.
- `src/ui/table/Table.tsx` — minimal screen: seat list (names, `$` stacks), your two face-up cards, board, buttons on your turn, "Hand over" status. No bot hole cards or replay code in the DOM.
- `src/ui/App.tsx` — renders the heading and `<Table />`; `src/ui/styles.css` — felt, seats, cards, buttons (explicit button colours so axe contrast passes in WebKit).
- Tests: `tests/table/session.acceptance.test.ts`, `tests/table/session.test.ts`, `tests/ui/table.acceptance.test.tsx`, `tests/unit/app.test.tsx` (updated), `e2e/table.spec.ts`, `e2e/support/table-harness.tsx`, `e2e/support/table-harness-bundle.ts`.
- No new dependencies; no change to engine, bots, advice or playtest.
- Review screenshots (not shipped): `doit/TASK-3.1/table-turn.png` (your flop turn) and `doit/TASK-3.1/table-end.png` (same hand at "Hand over"). Please look at these.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | AC#1-#7 at session level | Vitest acceptance (50 seeded hands for check/call, fold, TAG oracle) | pass | tests/table/session.acceptance.test.ts |
| SPEC-08..10 | wrong-step calls, nextStep, headless | Vitest unit | pass | tests/table/session.test.ts |
| SPEC-11 | seated table, no buy-in control | renderToString acceptance | pass | tests/ui/table.acceptance.test.tsx |
| SPEC-12..17 | browser: seating, $10/$20, showdown, fold, 10 idle minutes, ≤ 100 ms + axe + same-origin | Playwright, Chromium and WebKit | pass (12 table tests; full `npm run e2e` 36 passed) | e2e/table.spec.ts |
| SPEC-18 | lint, typecheck, tests, coverage | gate build-1 | PASS: 57 files, 214 passed, 1 skipped; coverage 97.94% overall, session.ts 97.87% | gates/build-1.json |
| SPEC-19 | playtest | `npm run playtest -- --hands 10000 --seed 42` | 0 invariant violations | build-log.md |
| SPEC-20 | CI and doc | — | CI pending; doc published | — |
| SPEC-21 | N/A DoD items | Judge | Judge pending | — |

- Gate run 1: all nine checks pass (tests, lint, typecheck, spec unchanged, scope budget lines/files, files outside spec, changes listed, tests locked). Changed lines 1084 across 12 files.
- Builder notes: the Playwright fake clock is paused before page load (`install({time: 0})` + `pauseAt`), because a running fake clock lets time flow. "runFor(1000)" is done as 20 × 50 ms steps, since React commits in a real MessageChannel task so each next bot timer exists only after the previous slice returns. WebKit's default button colours failed axe contrast, so buttons have explicit colours.
- Judge rounds: 0 so far (pending).

## Review
Round 1, code and security reviewers: no blocking findings; zero findings recorded in state. The code reviewer's mutation check made 11 mutants: 8 caught, 3 equivalent. The AC#1/2/5/7 tests were shown non-vacuous. Security: only your own cards are rendered; a production build contains one `getRandomValues` call site and no harness or stub code.

### Non-blocking review notes (deliberately not fixed)
- NIT: the seat list shows the user last (spec §5 markup asks for it); TASK-3.3 does the real layout.
- MINOR: `onHandComplete` and its once-per-replay-code guard are untested.
- MINOR: unreachable fallbacks in `completedHand` (uncovered lines 163-165).
- Note: a 400 ms artificial bot delay would pass every test; pacing tests belong to TASK-3.13.

## How to try it
`npm run dev` and open the printed URL, or `npm run build && npm run preview` and open `http://localhost:4173`. Play the hand with the buttons (Check/Call each time to see five board cards). Reload for another hand; reload and Fold at once to see the bots finish without you; leave your turn idle and nothing happens.

## Run metrics
Questions 1 · assumptions 12 · review rounds 1 (0 findings blocking) · judge rounds 0 (pending) · gate runs 1 · escalations 0 · sendbacks 0 · changed lines 1084 (budget 1300) in 12 files.

## Known limitations and follow-ups
- One hand per page load; no result display, winners or bot showdown cards (TASK-3.4).
- TASK-3.4: settle stack carry-over, button movement each hand and the below-minimum-stack rule (or relax the minimum in `createHand`) before auto-dealing a second hand.
- Add `src/table` to `HEADLESS_DIRS` in `tools/lint/headless-boundary.js` (check locked boundary tests first); then drop SPEC-10's import scan. Owner: no existing task known.
- TASK-3.3: replace the A-9 data-attribute hooks with visible last-action and to-act text.
- TASK-2.1: grow `SessionConfig { stake }` into the full session configuration (game type, players, line-up, speed, seat, button).
- Add a test for `onHandComplete` firing once per hand and its guard against a repeat call. Owner: TASK-3.9 (first real consumer), else a new task.
- Remove or cover the unreachable fallbacks in `completedHand` (`src/table/session.ts` lines 163-165). Owner: TASK-3.4.
- Pin that bots act with no artificial delay (a 400 ms delay currently passes every test). Owner: TASK-3.13.

## Lessons for the factory (proposals — not applied)
- Spec §5/§6 for e2e with `page.clock` should say to pause the clock before load and advance in small steps; the builder had to discover that. Add a note to the spec template's browser-test guidance.
- Spec said "runFor(1000)" in SPEC-12/16; the 20 × 50 ms stepping was a deviation in the test, not the spec. Worth wording such steps as "advance until condition".
