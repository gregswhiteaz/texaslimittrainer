# Spec: TASK-1.32 — Tighten the remaining engine input guards

Status: READY (approved 2026-11-19)
Task: TASK-1.32 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-1.21 / doc-29 and the TASK-1.31 security review, doc-35) · Dream: limit-holdem-trainer

## 1. Summary
Three engine entry points still throw a native `TypeError` on malformed input (`parseCards`, `evaluate`,
`createHand`), and three error messages echo input of any length (`Invalid seat`, `Button must be a
dealt-in seat`, `Invalid replay code`). This task makes those calls throw `RangeError` and makes those
messages echo at most 10 characters plus `...`, reusing the echo rule and message pattern that TASK-1.21
already approved. Short-input messages and all valid-input behaviour stay byte-identical. Restored sessions
(TASK-3.10) are the future source of these inputs; nothing untrusted reaches them today.

## 2. Scope
- In scope:
  - `src/engine/cards.ts`: export the TASK-1.21 echo rule as `echoText`; make `parseCards` reject non-strings.
  - `src/engine/hand-evaluator.ts`: make `evaluate` reject non-arrays.
  - `src/engine/hand.ts`: shape guard `RangeError('Invalid hand config')` in `createHand`; truncated echo in
    the `Invalid seat` and `Button must be a dealt-in seat` messages.
  - `src/engine/deck.ts`: truncated echo in `shuffledDeck`'s `Invalid replay code` message.
  - New acceptance file `tests/engine/input-guards.acceptance.test.ts`.
  - `tests/engine/deck.test.ts:130-133`: the one unit assertion that AC#3 makes false (see §3).
- Not doing:
  - Editing any locked test (`tests/engine/input-hardening.acceptance.test.ts`, `deck.acceptance.test.ts`,
    `hand.acceptance.test.ts`, `chip-safety.acceptance.test.ts`, `e2e/replay-seed.spec.ts`, etc.).
  - Changing any other error message, or any message for inputs of 10 or fewer characters.
  - A non-string guard in `shuffledDeck`/`isReplayCode` (a non-string code still gets the existing message,
    now with a truncated echo).
  - Validating `evaluate` array elements differently (the existing `Invalid card: <value>` stays).
  - Session-layer validation of restored data (TASK-3.10).
- Scope budget: files=6, lines=180

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `Invalid hand config` covers every shape failure that today throws `TypeError` in `createHand`: config not a non-null object, `stakes` not a non-null object, `seats` not an array, a seat entry not a non-null object, `deck` not an array | yes | Restored sessions can produce any of these; one guard, same message, ~5 lines. Only change to an existing message: a non-array iterable `deck` (e.g. a string) now gets `Invalid hand config` instead of `Deck must hold each of the 52 cards exactly once`; no test or caller passes one | Guard only null config and non-array seats (AC#2 literally) |
| A-2 | `evaluate` non-array message is `Invalid hand: expected an array, got <typeof>`, mirroring TASK-1.21's approved `Invalid card: expected a string, got <typeof>` (so `null` reports `object`, as `parseCard` does) | yes | Same developer-facing pattern; echoes only the type name, never input | `Hand must have 5 to 7 cards, got <typeof>` |
| A-3 | `evaluate` accepts only real arrays (`Array.isArray`); typed arrays and array-likes are rejected | yes | Every caller passes `Card[]` (`src/advice/equity.ts:154,217`, `src/engine/hand.ts:341`, `src/table/hand-result.ts:32`, `tools/equity/generate-reference.js:49`) | Accept any array-like with a numeric `length` |
| A-4 | Seat and button echoes use `String(value)` then the TASK-1.21 rule (first 10 UTF-16 code units + `...` when longer than 10). For numbers this equals today's template output, so `0`, `11`, `2.5`, `1` stay byte-identical | yes | TASK-1.21 A-3 rule; `String()` also avoids a `TypeError` on a symbol | Truncate only strings |

## 3. Current system
- TypeScript, Vitest (`npm test` = `vitest run --coverage`), ESLint + Prettier (`package.json`). Acceptance
  tests are `tests/**/*.acceptance.test.ts`; locked files are listed in each task's `doit/<id>/state.json`.
- `src/engine/cards.ts:30-41` `parseCard`: non-string → `RangeError('Invalid card: expected a string, got
  <typeof>')`; long echo inline at `:37` (`text.length <= 10 ? text : text.slice(0, 10) + '...'`).
  `parseCards` (`:43-46`) calls `text.trim()` first → `TypeError` on non-strings.
- `src/engine/hand-evaluator.ts:168-170` `evaluate` reads `cards.length` with no type check: `null` →
  `TypeError`; `{}` → `Hand must have 5 to 7 cards, got undefined`; a 5–7 char string → `Invalid card: A`
  (echoes input).
- `src/engine/hand.ts:174-181` `createHand` reads `config.stakes`, `.seats`, `.button`, `.deck` once each and
  destructures stakes and seat entries → `TypeError` for null config / null stakes / non-array seats / null
  seat entry / null deck. TASK-1.31's locked test `tests/engine/chip-safety.acceptance.test.ts:148-193` requires
  each of those fields (and each stake/seat field) to be read **exactly once** — the guard must read them
  into locals once.
- `src/engine/hand.ts:133` `Invalid seat: ${seat}` and `:138` `Button must be a dealt-in seat: ${button}` echo
  whole values. `src/engine/deck.ts:43` `Invalid replay code: "${code}"` echoes the whole code.
- Message assertions today: `tests/engine/hand.test.ts:151-155` (`Invalid seat: 0`/`11`/`2.5`, `Button must
  be a dealt-in seat: 1`) — all ≤ 10 chars, unchanged. `tests/engine/deck.test.ts:129` (`"ABC"`) unchanged.
  `tests/engine/deck.test.ts:130-133` asserts the **full 32-char** echo for `'0'.repeat(32)` and
  `'0123456789ABCDEFFEDCBA9876543210'` — directly contradicted by AC#3, so it must change. That file is a
  TASK-1.3 unit test and is **not locked** (`doit/TASK-1.3/state.json` locks only
  `tests/engine/deck.acceptance.test.ts` and `e2e/replay-seed.spec.ts`, neither of which asserts a message).
- Existing code to reuse:
  - `src/engine/cards.ts:37` → the echo rule; extract to exported `echoText` and call it from `parseCard`,
    `hand.ts` and `deck.ts` (no new module).
  - `src/engine/cards.ts:32` → the non-string message, reused verbatim by `parseCards` (TASK-1.21 follow-up
    wording, `doit/TASK-1.21/spec.md:350`).
  - `tests/engine/input-hardening.acceptance.test.ts:7-22` → copy the `STAKES`/`DECK`/`config()` fixture
    pattern into the new test file (do not import from the locked file).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Update `tests/engine/deck.test.ts:130-133` to assert the truncated message (`Invalid replay code: "0000000000..."` and `"0123456789..."`) | Leave it and fail; keep full echo for 32-char codes | AC#3 requires truncation for any code longer than 10; the file is unlocked unit coverage | no | n/a |
| D-2 | All new rejections are `RangeError`; new message texts are only `Invalid hand config` (fixed by AC#2), A-2's evaluate message, and the truncated echo forms | New error classes | TASK-1.21 D-2 convention | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/cards.ts` — export `echoText`; `parseCard` uses it; `parseCards` non-string guard.
- `src/engine/hand-evaluator.ts` — `evaluate` non-array guard.
- `src/engine/hand.ts` — `createHand` shape guard; `echoText` in seat and button messages.
- `src/engine/deck.ts` — `echoText` in the replay-code message.
- `tests/engine/input-guards.acceptance.test.ts` — new acceptance tests (SPEC-01..05).
- `tests/engine/deck.test.ts` — D-1 assertion update only.

### Components, interfaces and data
- `export function echoText(text: string): string` in `cards.ts`: returns `text` if `text.length <= 10`, else
  `text.slice(0, 10) + '...'`. No escaping (TASK-1.21 A-3).
- `parseCards(text: string): Card[]` — if `typeof text !== 'string'` throw
  `RangeError(\`Invalid card: expected a string, got ${typeof text}\`)`; else unchanged.
- `evaluate(cards: readonly Card[])` — first statement: if `!Array.isArray(cards)` throw
  `RangeError(\`Invalid hand: expected an array, got ${typeof cards}\`)`; else unchanged.
- `createHand(config)` — before anything else:
  1. if `config === null || typeof config !== 'object'` → `RangeError('Invalid hand config')`;
  2. `const { stakes, seats, button, deck } = config` (one read each);
  3. if `stakes` is null/non-object, `!Array.isArray(seats)`, `!Array.isArray(deck)`, or any seat entry is
     null/non-object → `RangeError('Invalid hand config')`;
  4. build the snapshot from these locals (stake fields and `seat`/`stack` each read once, as today), then
     `validate(snapshot)` as today.
- `validate`: `Invalid seat: ${echoText(String(seat))}`, `Button must be a dealt-in seat:
  ${echoText(String(button))}`.
- `shuffledDeck`: `Invalid replay code: "${echoText(String(code))}"`.

### Rules and algorithms
- Worked examples (exact messages):
  - `parseCards(undefined)` → `Invalid card: expected a string, got undefined`; `parseCards(42)` → `… got number`.
  - `evaluate(null)` → `Invalid hand: expected an array, got object`; `evaluate('AsKdQhJ')` → `… got string`;
    `evaluate({})` → `… got object`.
  - seat `'12345678901'` → `Invalid seat: 1234567890...`; seat `1.2345678901` → `Invalid seat: 1.23456789...`;
    seat `0` → `Invalid seat: 0` (unchanged).
  - button `0.12345678901` → `Button must be a dealt-in seat: 0.12345678...`; button `7` (not dealt) →
    `Button must be a dealt-in seat: 7`.
  - code `'0'.repeat(32)` → `Invalid replay code: "0000000000..."`; `'ABCDEFGHIJ'` → `Invalid replay code:
    "ABCDEFGHIJ"`; `'ABCDEFGHIJK'` → `Invalid replay code: "ABCDEFGHIJ..."`; `'ABC'` → unchanged.

### Error handling and configuration
- All errors are `RangeError`. No configuration.

## 6. Behaviour specification

### SPEC-01: parseCards rejects non-strings with a RangeError that echoes no input
- Verifies: AC#1
- Behaviour: Given each of `undefined`, `null`, `42`, `{}`, `['As Kd']`, When `parseCards` is called, Then it
  throws `RangeError` with message exactly `Invalid card: expected a string, got <typeof input>` (`undefined`,
  `object`, `number`, `object`, `object`); and `parseCards('  As Kd\t7h ')` still returns `[51, 45, 22]`.
- Verification: acceptance `tests/engine/input-guards.acceptance.test.ts::AC#1 parseCards rejects non-strings with a RangeError that echoes no input`

### SPEC-02: evaluate rejects non-arrays with a RangeError that echoes no input
- Verifies: AC#1
- Behaviour: Given each of `undefined`, `null`, `{}`, `{ length: 5 }`, `'AsKdQhJ'`, `51`, When `evaluate` is
  called, Then it throws `RangeError` with message exactly `Invalid hand: expected an array, got <typeof input>`
  and the message contains none of the input's text (e.g. no `AsKd`); and `evaluate([51, 47, 43, 39, 35])` still
  returns `7462`.
- Verification: acceptance `tests/engine/input-guards.acceptance.test.ts::AC#1 evaluate rejects non-arrays with a RangeError that echoes no input`

### SPEC-03: createHand rejects malformed config shapes with RangeError('Invalid hand config')
- Verifies: AC#2
- Behaviour: Given a valid 6-seat config, When `createHand` is called with `null`, `undefined`, `42`, a config
  whose `seats` is `null`, `{}`, or `'1,2,3'`, a config whose `stakes` is `null`, a config with a `null` seat
  entry, or a config whose `deck` is `null`, Then each throws `RangeError` with message exactly
  `Invalid hand config` (never `TypeError`); and the valid config still returns a hand.
- Verification: acceptance `tests/engine/input-guards.acceptance.test.ts::AC#2 createHand rejects malformed config shapes with Invalid hand config`

### SPEC-04: long seat, button and replay-code inputs echo at most 10 characters plus '...'
- Verifies: AC#3
- Behaviour: Given the inputs in §5 "Worked examples", When `createHand` / `shuffledDeck` throw, Then the
  messages are exactly `Invalid seat: 1234567890...`, `Invalid seat: 1.23456789...`,
  `Button must be a dealt-in seat: 0.12345678...`, `Invalid replay code: "0000000000..."`,
  `Invalid replay code: "ABCDEFGHIJ..."`; a 100,000-char seat string and replay code give messages no longer
  than the prefix + 13 characters.
- Verification: acceptance `tests/engine/input-guards.acceptance.test.ts::AC#3 long seat, button and replay code echo at most 10 characters`

### SPEC-05: short-input messages stay byte-identical
- Verifies: AC#3
- Behaviour: Given seats `[0,1,2]`, `[1,2,11]`, `[1,2,2.5]`, seats `[2,3,4]` with button 1, and replay codes
  `'ABC'` and `'ABCDEFGHIJ'`, When called, Then the messages are exactly `Invalid seat: 0`, `Invalid seat: 11`,
  `Invalid seat: 2.5`, `Button must be a dealt-in seat: 1`, `Invalid replay code: "ABC"`,
  `Invalid replay code: "ABCDEFGHIJ"`; the existing assertions at `tests/engine/hand.test.ts:151-155` and
  `tests/engine/deck.test.ts:129` pass unchanged.
- Verification: acceptance `tests/engine/input-guards.acceptance.test.ts::AC#3 short seat, button and replay code messages are unchanged`

### SPEC-06: replay-code unit coverage matches the truncated message
- Verifies: AC#3
- Behaviour: Given `'0'.repeat(32)` and `'0123456789ABCDEFFEDCBA9876543210'`, When `shuffledDeck` is called,
  Then it throws `RangeError('Invalid replay code: "0000000000..."')` and
  `RangeError('Invalid replay code: "0123456789..."')` respectively (D-1).
- Verification: unit `tests/engine/deck.test.ts::invalid words and codes throw RangeError`

## 7. Edge cases
- Exactly 10 characters: echoed whole (SPEC-04/05, `'ABCDEFGHIJ'`).
- Very long input (100,000 chars): bounded message (SPEC-04).
- `null` vs object for `typeof`: `null` reports `object`, same as `parseCard` (A-2).
- Read-once access: the guard reads each config field once; TASK-1.31's locked test stays green (SPEC-03 plus
  the existing suite).
- Objects without `toString` (`Object.create(null)`) as seat/button: `String()` would throw `TypeError`; N/A —
  restored sessions are JSON, which cannot produce them.
- Concurrency, permissions, dependency failure: N/A — pure synchronous functions.

## 8. Security considerations
- Trust boundary: future restored sessions and replay-code text entry (TASK-3.10, TASK-1.6 UI) reach
  `createHand`/`shuffledDeck`; this task makes shape failures a predictable `RangeError` and bounds the echo to
  10 characters (log flooding / leaking pasted text). Echo is unescaped (TASK-1.21 A-3); no UI renders engine
  messages as HTML.
- No new dependencies, secrets, auth or randomness changes; deck order for every valid code is unchanged.

## 9. Non-functional
- `evaluate` hot path gains one `Array.isArray` check; `tests/engine/hand-evaluator.perf.test.ts` must still
  pass unchanged.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest` (must exit 0 with `Invariant violations: 0` and output identical to the base commit)
- New tests: `tests/engine/input-guards.acceptance.test.ts` → SPEC-01..05; `tests/engine/deck.test.ts` (edited)
  → SPEC-06.
- End-to-end scenario for the Judge: run `npm run playtest` and `npm run playtest -- --replay-code
  0123456789abcdeffedcba9876543210 --size 6` on base and branch and diff (identical); then in a scratch Vitest
  file call `parseCards(null)`, `evaluate('AsKdQhJ')`, `createHand(null)`, `createHand({ ...valid, seats: {} })`,
  `shuffledDeck('x'.repeat(50))` and a seat of `'12345678901'`, and confirm the messages in §5.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-1.32/qa.md`.
