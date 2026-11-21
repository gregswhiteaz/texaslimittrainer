# Spec: TASK-2.18 — Pin Home focus, user-seat cards and config-driven stacks in tests

Status: READY (approved 2026-11-20)
Task: TASK-2.18 · Parent/epic: TASK-2 · Requirements: n/a (follow-up from TASK-2.1 review, doc-23) · Dream: limit-holdem-trainer

## 1. Summary
Three behaviours shipped in TASK-2.1 are correct but unpinned: a mutant of each survived the TASK-2.1 code
review (`doit/TASK-2.1/reviews/round-1/code.json`), and the second and third were re-confirmed surviving the
full Vitest suite while this spec was drafted. This chore adds three new test files, one per behaviour. Each
must fail on its named mutant and pass on the current code. No production code changes.

## 2. Scope
- In scope: three new test files (one Playwright, two Vitest). Before handing back, the builder runs each named
  mutant against its test and records the failing output in the build log.
- Not doing:
  - Any change under `src/` (the behaviours are already correct). Mutants are applied temporarily and reverted.
  - Editing existing test files (`e2e/home.spec.ts`, `tests/ui/table-display.acceptance.test.tsx`,
    `tests/table/session-config*.test.ts`, `tests/support/table-scenarios.ts`).
  - The "Your shown cards" showdown path (`src/table/hand-result.ts:84`), the config-consistency MINOR
    (`resolveSessionConfig` partial merge), and the TABLE_SIZE_NAMES NIT from the same review.
  - Adding jsdom or any other dependency.
- Scope budget: files=3, lines=110

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#1 is pinned by a Playwright test, not Vitest. | yes | Vitest runs in `environment: 'node'` (`vite.config.ts:8`) with no DOM library, so `useEffect` (where the focus happens, `src/ui/useHeadingFocus.ts:9-14`) never runs under `renderToString`. | Add jsdom plus a testing library (new dependency: out of scope). |
| A-2 | "Seat 5 hard-coded" now means `playerView(table.hand, 5)` at `src/table/table-view.ts:143`. The `p.seat === 5` line in `Table.tsx` named by the review no longer exists; the user's hole cards now come from `tableView` (`src/table/table-view.ts:143,172`). | yes | That is where the user's cards are now chosen. Confirmed during drafting: this mutant passes all 20 files in `tests/ui` and `tests/table`. | Also mutate `isUser` to `s.seat === 5`. `tests/ui/table-display.acceptance.test.tsx:132-137` already catches that one (it expects the `data-user` seat to be `'1'` for SEAT_1_DEALT). |
| A-3 | The AC#3 config uses five seats numbered 1, 3, 5, 7, 9 (user at 5, button 9, players 5). | yes | Every number except 1 and 5 differs from DEFAULT_SEATS (1–6), and the count differs too, so the `DEFAULT_SEATS.map` mutant gives a different list. `SeatNumber` is a plain `number` (`src/engine/hand.ts:5`). | Seats [1,2,4,5,6]. |
| A-4 | The first-load focus check waits 500 ms after the heading is visible, then reads `document.activeElement` once (no retrying). | yes | `not.toBeFocused()` would pass at once if checked before the effect runs, so the mutant could slip through. The existing suite already uses fixed waits (`e2e/home.spec.ts:191`). | `requestAnimationFrame` plus a `setTimeout(0)` round-trip inside `page.evaluate`. |

## 3. Current system
- Vitest 5, `npm test` = `vitest run --coverage`, includes `tests/**/*.test.{ts,tsx}`, node environment
  (`vite.config.ts:6-9`). Playwright e2e at `e2e/**/*.spec.ts`, Chromium and WebKit, against `vite preview` on
  port 4173 (`playwright.config.ts:6-23`).
- Home focus: `App` starts in `{ name: 'home', returned: false }` (`src/ui/App.tsx:14`) and passes
  `focusHeading={screen.returned}` (`src/ui/App.tsx:19`). `useHeadingFocus` returns early when it is not enabled
  (`src/ui/useHeadingFocus.ts:11`). The Cancel/← Home focus is already asserted at `e2e/home.spec.ts:204`; the
  first-load case is not.
- User seat cards: `tableView` builds the view from `playerView(table.hand, config.userSeat)`
  (`src/table/table-view.ts:143`), and the user seat's `holeCards` come from that view
  (`src/table/table-view.ts:172`). `Seat` puts them in `<div role="group" aria-label="Your cards">` inside the
  `li[data-user]` (`src/ui/table/Table.tsx:51-66`), with `data-card="<code>"` on each card
  (`src/ui/cards/PlayingCard.tsx:60`).
- Stacks: `seatSession` sets `stacks: config.seats.map(({ seat }) => ({ seat, stack }))`
  (`src/table/session.ts:129`, which is line 121 in the review), with `stack = buyIn(stake) = 20 × bigBet`
  (`src/table/session.ts:41-43`).
- Existing code to reuse:
  - `tests/support/table-scenarios.ts` → `SEAT_1_CONFIG` and `SEAT_1_DEALT` (user at seat 1, already dealt;
    lines 119-131) and `SCENARIO_CODE`.
  - `src/engine/cards.ts:55` → `formatCard` (Card to code, e.g. `Ah`, the same code as `data-card`).
  - `src/table/session.ts` → `seatSession`, `DEFAULT_SEATS`, `type SessionSeat`.
  - Render pattern: `renderToString(<TableView table={…} onAct={noop} onLeave={noop} />)`
    (`tests/ui/table-display.acceptance.test.tsx:30-32`).
  - The e2e `openHome` pattern: `page.goto('/')`, then wait for the h1 "TLH Trainer" to be visible
    (`e2e/home.spec.ts:38-43`). Copy it locally; no stubs are needed, because this test never deals.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Add new test files instead of editing locked ones. | Add assertions to `e2e/home.spec.ts` / `tests/table/session-config.test.ts`. | Caller instruction. Avoids unlocking earlier tasks' acceptance files. | no | n/a |

## 5. Design

### Files to create / modify
- `e2e/home-first-load.spec.ts` — SPEC-01.
- `tests/ui/user-seat-cards.acceptance.test.tsx` — SPEC-02.
- `tests/table/session-stacks.acceptance.test.ts` — SPEC-03.

### Components, interfaces and data
- No production interfaces change.
- SPEC-02 expected cards: `SEAT_1_DEALT.hand.players.find(p => p.seat === 1).holeCards.map(formatCard)`. These
  are read straight from the engine `HandState` (`src/engine/hand.ts:70,80`), not through `playerView`, so the
  expected value does not depend on the code under test.
- SPEC-03 config: `seats = [1,3,5,7,9]`, seat 5 `{ name: 'You', kind: 'user', style: null }`, the others
  `{ kind: 'bot', style: 'TAG' }` with any names; `userSeat: 5`, `button: 9`, `players: 5`, default stake
  (big bet 8, so the buy-in is 160).

### Rules and algorithms
- Mutant proof, required for each SPEC item. Apply the mutant, run only the new test and see it fail, revert,
  then see it pass. Record the command and the failing assertion in `doit/TASK-2.18/build-log.md`. Afterwards
  `git diff --stat src` must be empty.
  - M1 (SPEC-01): `src/ui/useHeadingFocus.ts:11` `if (!enabled || element === null) return;` → `if (element === null) return;`
  - M2 (SPEC-02): `src/table/table-view.ts:143` `playerView(table.hand, config.userSeat)` → `playerView(table.hand, 5)`
  - M3 (SPEC-03): `src/table/session.ts:129` `stacks: config.seats.map(` → `stacks: DEFAULT_SEATS.map(`

### Error handling and configuration
- N/A (tests only).

## 6. Behaviour specification

### SPEC-01: First load of Home leaves focus alone
- Verifies: AC#1
- Behaviour: Given a fresh page at `/`, When Home renders (the h1 "TLH Trainer" is visible) and 500 ms have
  passed, Then `document.activeElement === document.body` and the h1 "TLH Trainer" is not focused. Under
  mutant M1 the test fails in Chromium and WebKit.
- Verification: acceptance `e2e/home-first-load.spec.ts::first load of Home does not move focus to its heading`

### SPEC-02: The user's face-up cards appear at the configured user seat
- Verifies: AC#2
- Behaviour: Given `SEAT_1_DEALT` (userSeat 1, dealt), When `TableView` is rendered to a string, Then the
  `li` with `data-user=""` has `data-seat="1"`. Its "Your cards" group holds exactly two cards whose `data-card`
  codes, in order, equal seat 1's engine hole cards formatted with `formatCard`. Those codes are not seat 5's
  hole cards. Under mutant M2 the test fails.
- Verification: acceptance `tests/ui/user-seat-cards.acceptance.test.tsx::the user's face-up cards are the hole cards of the configured user seat`

### SPEC-03: Stacks are keyed by config.seats
- Verifies: AC#3
- Behaviour: Given the five-seat config from §5 (seats 1, 3, 5, 7, 9), When `seatSession(config)` runs, Then
  `stacks` equals `[{seat:1,stack:160},{seat:3,stack:160},{seat:5,stack:160},{seat:7,stack:160},{seat:9,stack:160}]`.
  Under mutant M3 the test fails (it would get seats 1–6).
- Verification: acceptance `tests/table/session-stacks.acceptance.test.ts::stacks follow the configured seat numbers, not DEFAULT_SEATS`

## 7. Edge cases
- Focus effect timing (it runs after paint): handled by the fixed wait and the non-retrying read in SPEC-01 (A-4).
- Mutant equivalence: each fixture differs from the default in exactly the dimension its mutant hard-codes
  (user seat 1 ≠ 5; seat numbers {1,3,5,7,9} ≠ {1..6}).
- Everything else (invalid input, concurrency, permissions): N/A, these are pure tests of fixed fixtures.

## 8. Security considerations
N/A: test-only. No new dependencies, inputs, secrets or randomness. SPEC-02 uses a fixed replay code.

## 9. Non-functional
- Each new Vitest test runs in under 1 s. The e2e test adds about 1 s per browser.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx playwright test e2e/home-first-load.spec.ts` (full e2e: `npm run e2e`)
- New tests: `e2e/home-first-load.spec.ts` → SPEC-01; `tests/ui/user-seat-cards.acceptance.test.tsx` →
  SPEC-02; `tests/table/session-stacks.acceptance.test.ts` → SPEC-03.
- Judge scenario: run `npm test` and the SPEC-01 Playwright file (both green). Then for each of M1–M3: apply it,
  run its test and see it fail, then revert with `git checkout -- src`.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-2.18/qa.md`.
