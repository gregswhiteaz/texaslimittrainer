# Spec: TASK-1.31 — Keep every chip amount a safe integer

Status: READY (approved 2026-11-19)
Task: TASK-1.31 · Parent/epic: TASK-1 · Requirements: n/a (follow-up to TASK-1.21 / doc-29, judge J-1-01) · Dream: limit-holdem-trainer

## 1. Summary
`createHand` accepts configs whose legal play produces chip amounts above `Number.MAX_SAFE_INTEGER`: the A-4
stakes bound (TASK-1.21) assumes a 4-bet cap the engine does not enforce, and any safe-integer stack is
accepted (J-1-01: 10 seats of `MAX_SAFE_INTEGER` gave 11 unsafe numbers). This task bounds the **total of all
starting stacks** in `createHand` so every stack, contribution, pot and award is a safe integer by chip
conservation, adds tests that pin the A-4 factor 10 and read-once config access, and removes the false cap
claims from comments.

## 2. Scope
- In scope:
  - `validate` in `src/engine/hand.ts`: after the per-seat stack check, reject configs whose stacks sum to more
    than `Number.MAX_SAFE_INTEGER` (D-1).
  - Rewrite the `minimumStack` doc comment and the A-4 code comment so neither claims a raise cap.
  - New acceptance file pinning the worst case, the A-4 factor 10 and read-once config access.
  - Update the one TASK-1.21 locked acceptance assertion that AC#1 makes false (Q-2): seat 3 at
    `Number.MAX_SAFE_INTEGER - 800` (others 160, total exactly MAX) is accepted; seat 3 at `Number.MAX_SAFE_INTEGER`
    throws `RangeError('Stacks must total at most 9007199254740991')`. Nothing else in that file changes. Unlock the file with a reason and record the
    cross-story locked-test edit in TASK-1.31's implementation notes.
- Not doing:
  - Enforcing the 4-bet cap in `legalActions`/`applyAction` (TASK-1.12).
  - Changing the A-4 stakes bound, the per-seat stack check, or any existing error message.
  - Session/UI validation of stakes or stacks (session stacks total a few hundred dollars).
  - Editing doc-29 or other Backlog docs.
- Scope budget: files=3, lines=190

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The total-stack check runs after every per-seat stack check, so any config that fails today fails with the same message | yes | Keeps every existing message for every existing invalid config byte-identical | Check the total first |
| A-2 | The worst-case test uses stakes `{s, s, s, s + 1}` with `s = 2 ** 45`, 10 seats, stacks summing to exactly `MAX_SAFE_INTEGER`, and an always-raise policy | yes | Units near stack/26 make the hand end in a few hundred actions while every seat puts in nearly all its chips; smallBet 1 (J-1-01's stakes) would need ~10^15 raises | J-1-01's stakes with a fold-heavy policy (does not reach the bound) |
| A-3 | "Each field" in AC#3 means `stakes`, `seats`, `button`, `deck` on the config, the four stake fields, and `seat`/`stack` on each seat object | yes | These are the fields `createHand` reads (`src/engine/hand.ts:171-177`); array index/`length` reads are iteration, not fields | Also count array index reads |

## 3. Current system
- TypeScript, Vitest (`npm test` = `vitest run --coverage`), ESLint + Prettier, fast-check available
  (`package.json`). Acceptance tests are `tests/**/*.acceptance.test.ts`.
- `src/engine/hand.ts:120-123` `minimumStack` = `8 * smallBet + 8 * bigBet`; doc comment claims the 4-bet cap.
- `src/engine/hand.ts:125-166` `validate`: seats, button, stakes (A-4 at `:145-146`, comment claims the bound
  covers every pot), deck, then per-seat `Number.isSafeInteger(stack) && stack >= min` (`:158-163`).
- `src/engine/hand.ts:170-177` `createHand` snapshots the config (each field read once today), then validates.
- `src/engine/hand.ts:234-256` `legalActions`: no raise cap; a raise is offered while the stack covers it.
- Chips are conserved: `applyAction` moves `added` from stack to contributions (`:393-401`), `gather` moves
  contributions to the pot (`:269-283`), `payOut` returns the pot to winners (`:299-307`).
- `tests/engine/input-hardening.acceptance.test.ts:92-93` (locked by TASK-1.21, hash in
  `doit/TASK-1.21/state.json`) asserts a seat-3 stack of `Number.MAX_SAFE_INTEGER` (others 160) is accepted.
- UI-producible configs: stakes fixed at $4/$8 (`src/table/session.ts:88`), buy-in `20 × bigBet` = 160
  (`:41-43`), at most 10 seats; carried stacks only move chips between seats plus top-ups to 160
  (`:168-173`). Totals stay in the low thousands, so no UI config is rejected by D-1.
- Existing code to reuse:
  - `src/engine/hand.ts` `createHand`, `legalActions`, `applyAction`, `minimumStack` → drive the tests; no new
    helpers in `src/`.
  - `tests/engine/input-hardening.acceptance.test.ts` `config()` pattern → copy the local `config` helper style.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Bound the sum of starting stacks by `Number.MAX_SAFE_INTEGER` in `validate`. Every chip amount (stack, contribution, pot, award, legal call/bet/raise amount) is ≤ that sum by conservation | (a) Enforce the 4-bet cap (TASK-1.12 scope; still leaves a `MAX_SAFE` stack that wins overflowing); (b) per-seat cap `floor(MAX_SAFE / 10)` (needs a changed per-seat message, rejects more) | Smallest change that makes AC#1 true for any legal play; rejects only configs with > 9×10^15 chips | yes | Approved by Q-1, Q-2 |
| D-2 | Error for D-1: `RangeError('Stacks must total at most 9007199254740991')` | `'Invalid stacks'`; reuse the per-seat message | States the rule; no imprecise "got" value | yes | Approved by Q-1 |

## 5. Design

### Files to create / modify
- `src/engine/hand.ts` — total-stack check in `validate`; two comments rewritten
- `tests/engine/chip-safety.acceptance.test.ts` — new: SPEC-01..SPEC-05
- `tests/engine/input-hardening.acceptance.test.ts` — locked file; change only the seat-3 `MAX_SAFE_INTEGER` acceptance at `:92-93` as stated in §2 (Q-2)

### Components, interfaces and data
- No signature or type changes. `createHand(config)` throws one more `RangeError` case (D-2).

### Rules and algorithms
- In `validate`, after the per-seat loop:
  `if (seats.reduce((total, { stack }) => total + stack, 0) > Number.MAX_SAFE_INTEGER) throw new RangeError('Stacks must total at most 9007199254740991')`.
  Float addition is monotonic: while the exact partial sums are ≤ `MAX_SAFE_INTEGER` they are exact; the first
  one above it rounds to ≥ 2^53 and later additions of positive values keep it there, so the check is exact.
- Why it suffices: chips are conserved, so every stack, `streetContribution`, `totalContribution`, pot amount,
  award, `currentBet` and offered action amount is ≤ the starting total. (`legalActions` may compute an
  unoffered `raiseTo` above the bound; it is then compared against a stack and is never stored.)
- Worked example: 10 seats, nine of `900719925474099` and one of `900719925474100` → total
  `9007199254740991` → accepted. Same with seat 3 at `900719925474101` → total `MAX + 1` → rejected.
  J-1-01's config (10 × `MAX_SAFE_INTEGER`) → rejected.
- A-4 is unchanged: largest accepted `bigBet` with `smallBlind = bigBlind = smallBet = 1` is
  `112589990684261` (`10 × (8 + 8b) = 9007199254740960`); `112589990684262` gives `9007199254741040` → `Invalid stakes`.
- Comments (AC#4): `minimumStack` doc becomes
  `/** Least stack createHand accepts: 8 small bets + 8 big bets ($96 at $4/$8). */`; the A-4 comment becomes
  `// A-4: keep 10 x minimumStack a safe integer. The stack total below bounds every chip amount.`
  Neither file comment may contain the word "cap".

### Error handling and configuration
- New `RangeError('Stacks must total at most 9007199254740991')` for D-1 (Q-1). All existing messages and their precedence unchanged (A-1).

## 6. Behaviour specification

### SPEC-01: the worst legal hand at the bound keeps every chip amount a safe integer
- Verifies: AC#1
- Behaviour: Given stakes `{s, s, s, s + 1}` with `s = 2 ** 45`, seats 1..10, button 1, the identity deck,
  stacks `900719925474099` for seats 1..9 and `900719925474100` for seat 10 (total `Number.MAX_SAFE_INTEGER`),
  When `createHand` runs and every turn applies the first legal action in the order raise, bet, call, check
  until `result` is non-null, Then after every step every `startingStack`, `stack`, `streetContribution`,
  `totalContribution`, pot `amount`, `currentBet`, action `amount`/`added`, award `amount` and winner `amount`
  is a safe integer; the sum of stacks + street contributions + pot amounts equals `Number.MAX_SAFE_INTEGER`;
  the hand reaches `street === 'showdown'`; and the summed award amounts exceed `0.9 * Number.MAX_SAFE_INTEGER`.
- Verification: acceptance `tests/engine/chip-safety.acceptance.test.ts::AC#1 the worst legal hand at the stack bound keeps every chip amount a safe integer`

### SPEC-02: random legal play from accepted configs keeps every chip amount a safe integer
- Verifies: AC#1
- Behaviour: Given fast-check (100 runs) choosing n in 3..10 seats, `s` in `2 ** 44 .. 2 ** 45`, stakes
  `{s, s, s, s + 1}`, each stack in `16s + 8 .. floor(MAX_SAFE_INTEGER / n)`, a button among the seats, a deck
  from `shuffledDeck` of a random 32-hex replay code, and a random legal action index each turn, When the hand
  is played to completion, Then the same per-step checks as SPEC-01 hold (safe integers, conservation).
- Verification: acceptance `tests/engine/chip-safety.acceptance.test.ts::AC#1 random legal play from any accepted config keeps chip amounts safe`

### SPEC-03: stacks totalling more than MAX_SAFE_INTEGER are rejected
- Verifies: AC#1
- Behaviour: Given the SPEC-01 config with seat 10's stack `900719925474101` (total `MAX + 1`), When `createHand`
  runs, Then it throws `RangeError('Stacks must total at most 9007199254740991')`; Given stakes `{1, 1, 1, 112589990684261}` and 10 seats of
  `Number.MAX_SAFE_INTEGER` (J-1-01), Then it throws the same error; Given 6 seats with seat 3 at `2 ** 53`,
  Then the existing `Stack at seat 3 must be an integer of at least 96` is still thrown (A-1).
- Verification: acceptance `tests/engine/chip-safety.acceptance.test.ts::AC#1 createHand rejects stacks that total more than MAX_SAFE_INTEGER`

### SPEC-04: the A-4 bound uses exactly the factor 10
- Verifies: AC#2
- Behaviour: Given stakes `{1, 1, 1, 2 ** 49}` and six stacks of `2 ** 52`, When `createHand` runs, Then it
  throws `RangeError('Invalid stakes')`. Given stakes `{1, 1, 1, 112589990684262}` and three seats of
  `900719925474104`, Then it throws `RangeError('Invalid stakes')`; given `{1, 1, 1, 112589990684261}` and
  three seats of `900719925474096`, Then the hand is created (a factor 9 or 11 fails one of the two).
- Verification: acceptance `tests/engine/chip-safety.acceptance.test.ts::AC#2 the A-4 stakes bound pins the factor 10`

### SPEC-05: createHand reads each config field exactly once
- Verifies: AC#3
- Behaviour: Given a valid six-seat config wrapped in a Proxy that counts `get` of `stakes`, `seats`, `button`,
  `deck`, a stakes object whose four fields are one-shot getters (counting, throwing on a second read), and
  seat objects whose `seat`/`stack` are one-shot getters, When `createHand` runs, Then it returns a hand with
  the configured stakes and stacks, and every counted field was read exactly once (A-3).
- Verification: acceptance `tests/engine/chip-safety.acceptance.test.ts::AC#3 createHand reads each config field exactly once`

### SPEC-06: no comment in hand.ts claims a raise cap
- Verifies: AC#4
- Behaviour: Given `src/engine/hand.ts`, When searched case-insensitively for `cap` and for
  `at most 10 seats`, Then there are no matches, and `minimumStack`'s doc comment is the text in §5.
- Verification: command `grep -niE "cap|at most 10 seats" src/engine/hand.ts` (expect no output, exit 1)

### SPEC-07: existing behaviour and checks unchanged
- Verifies: AC#1, AC#2
- Behaviour: Given the full suite, When run, Then every existing test passes (with only the Q-2 change in the
  locked file), `npm run playtest` reports `Invariant violations: 0` and its output is byte-identical to base.
- Verification: command `npm test && npm run lint && npm run typecheck && npm run playtest`

## 7. Edge cases
- Total exactly `MAX_SAFE_INTEGER` accepted, `MAX + 1` rejected (SPEC-01, SPEC-03).
- Sum overflowing to imprecise floats (10 × MAX) still rejected (SPEC-03; monotonic rounding, §5).
- Invalid stacks (unsafe, below minimum) keep their per-seat message (SPEC-03, A-1).
- A-4 boundary both sides (SPEC-04).
- Getter/Proxy configs (SPEC-05). Concurrency, permissions, I/O: N/A (pure function).

## 8. Security considerations
- Trust boundary: `createHand` config from callers (session, playtest, tests); this task tightens it (fail
  closed). No authn, secrets, injection, logging, new dependencies or randomness changes. N/A otherwise.

## 9. Non-functional
- SPEC-01 and SPEC-02 each finish in < 5 s under `npm test`. Engine coverage stays ≥ the threshold in
  `vite.config.ts`.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest` (must exit 0, `Invariant violations: 0`, output identical to base)
- New tests: `tests/engine/chip-safety.acceptance.test.ts` → SPEC-01..SPEC-05; SPEC-06/07 are commands.
- Builder notes: do not use `checkState` in SPEC-01 (its `bet-cap` invariant fails by design under always-raise).
  The always-raise loop must terminate; guard it with a 10,000-action limit that fails the test.
- End-to-end scenario for the Judge: in a scratch Vitest file, replay J-1-01 (stakes `{1,1,1,112589990684261}`,
  10 × `MAX_SAFE_INTEGER`) and confirm rejection; play several always-raise and random hands at the total bound
  and scan every number in every state for `Number.isSafeInteger`; diff `npm run playtest` against base.

## 11. Open questions
- None. Q-1 and Q-2 answered (recommended options) — see `doit/TASK-1.31/qa.md`.

## 12. Clarifications log
See `doit/TASK-1.31/qa.md`.
