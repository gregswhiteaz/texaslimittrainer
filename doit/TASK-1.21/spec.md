# Spec: TASK-1.21 — Harden engine input validation found in review

Status: READY (approved 2026-11-18)
Task: TASK-1.21 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of the TASK-1.2, TASK-1.3 and TASK-1.4 security reviews: doc-7, doc-9, doc-10) · Dream: limit-holdem-trainer

## 1. Summary
Three engine entry points accept malformed input that a later caller (playtest CLI, session layer, saved data)
could pass in. This task makes `parseCard` reject non-strings with a `RangeError` and never echo more than 10
characters of its input; makes `createHand` reject unsafe-integer stakes and stacks with its existing
`RangeError` messages and copy its input so later caller mutation cannot change the hand; and makes
`Xoshiro128.nextIntUnbiased(n)` exactly uniform for every integer n in 1..2^32 (throwing `RangeError` outside
that), with a doc comment that states the range. Every existing error message, every replay code's deck and
every earlier test stay unchanged.

## 2. Scope
- In scope:
  - `src/engine/cards.ts`: `parseCard` type guard and truncated echo.
  - `src/engine/hand.ts`: snapshot of `config` before validation; `Number.isSafeInteger` for stakes and stacks;
    total-chip bound on stakes (A-4).
  - `src/engine/seeded-random.ts`: exact 32×32-bit product in `nextIntUnbiased`, argument guard, doc comment.
  - New acceptance test `tests/engine/input-hardening.acceptance.test.ts` (AC#1–AC#4).
  - Unit tests added to `tests/engine/cards.test.ts`, `tests/engine/hand.test.ts`,
    `tests/engine/seeded-random.test.ts`, `tests/engine/deck.test.ts`.
- Not doing:
  - Editing any locked test file. In particular `tests/engine/deck.acceptance.test.ts` (TASK-1.3, holds the
    golden decks), `tests/engine/hand.acceptance.test.ts`, `tests/engine/hand.property.test.ts` (TASK-1.4),
    `tests/engine/player-view.*` (TASK-1.5), `tests/advice/equity.acceptance.test.ts` (TASK-7.1, holds the
    banned-substring check), `tests/playtest/*.acceptance.test.ts` (TASK-1.6), `tests/table/next-hand.acceptance.test.ts`
    (TASK-3.4). None needs to change.
  - Changing any existing error message or error type (see §5 "Error handling").
  - `parseCards` non-string input, `evaluate` non-array input (doc-7 MINOR), `shuffledDeck`'s echoed replay
    code (doc-9 NIT): follow-ups, not in the AC.
  - `Xoshiro128.nextInt` (its doc makes no uniformity claim and its range 1..2^31 is already tested).
  - `minimumStack` itself: signature, formula and doc comment stay as they are (`src/engine/hand.ts:120-123`);
    `src/table/session.ts` is not touched.
  - The untested-branch code MINORs from doc-10 (`fold-eligible-and-total-contribution-untested`,
    `sb-equals-bb-boundary-untested`): follow-ups.
  - Any new dependency, any UI, any user-visible text.
- Scope budget: files=8, lines=340   (cards.ts ~12, hand.ts ~25, seeded-random.ts ~30, acceptance test ~140,
  cards.test.ts ~20, hand.test.ts ~30, seeded-random.test.ts ~50, deck.test.ts ~35)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `nextIntUnbiased` becomes exact for every integer n in 1..2^32 (exact 64-bit product built from 16-bit halves), and throws `RangeError` for any other n. Results are identical to today for every n ≤ 2^21 and every power of two (today's double product is already exact there), so every replay code's deck is byte-identical | yes | The caller asked for the option that keeps replay codes identical. Both options do for n ≤ 52, but "throw above 2^21" would break the unlocked-but-passing test that calls `nextIntUnbiased(2 ** 31)` (`tests/engine/seeded-random.test.ts:57`) and narrow a documented range; "exact" keeps every current use and test valid | Throw `RangeError` for n > 2^21 (smaller code, breaks that test line) |
| A-2 | A non-string passed to `parseCard` throws `RangeError('Invalid card: expected a string, got <typeof>')` (e.g. `got undefined`, `got object` for null). It echoes no part of the input | yes | AC#1 asks for a typed error; every `cards.ts` error is a `RangeError` (`src/engine/cards.ts:17,34,46`); today `parseCard(undefined)` throws a native `TypeError` (doc-7 NIT) | `TypeError`; echo `String(value)` truncated |
| A-3 | A rejected string longer than 10 UTF-16 code units is echoed as its first 10 code units followed by `...` outside the count: `Invalid card: "<first 10>..."`. Strings of 10 or fewer are echoed whole, exactly as today. Quotes and control characters are echoed raw (no escaping), as today | yes | Keeps every existing message byte-identical (all are ≤ 3 characters, `tests/engine/cards.test.ts:30-33`); messages are developer-facing (caller) | Unicode `…`; JSON-escape the echo; no marker |
| A-4 | `createHand` also rejects, with the existing `RangeError('Invalid stakes')`, stakes for which `10 * minimumStack(stakes)` exceeds `Number.MAX_SAFE_INTEGER` | yes | Each seat can put in at most `minimumStack(stakes)` (4-bet cap, `src/engine/hand.ts:120`), so every pot and contribution total is ≤ 10 × that. The bound makes every chip amount a hand can produce a safe integer, which is the point of AC#2; real stakes are many orders of magnitude below it (playtest $4/$8, `src/playtest/runner.ts:27`) | Check only that each stake is a safe integer (pot totals could still exceed 2^53 with stakes near 2^50) |
| A-5 | An unsafe-integer stack reuses the existing message `Stack at seat <n> must be an integer of at least <min>` | yes | AC#2 and the caller require existing messages and types; the message is developer-facing | A new message such as "must be a safe integer" |
| A-6 | `createHand` copies its input into a snapshot first (stakes field by field, each seat as `{ seat, stack }`, the deck array, the button) and validates and builds only from the snapshot. `HandState.stakes` is the snapshot's stakes object | yes | Fixes the `stakes-object-aliased` MINOR (doc-10) and also closes the gap where getters could return different values to `validate` and to the builder | `{ ...config.stakes }` after validation (keeps extra properties, leaves the read-twice gap); `Object.freeze` on the copy |

## 3. Current system
- TypeScript 6 strict, ESM; Vitest 5.1 runs `src/**/*.test.{ts,tsx}` and `tests/**/*.test.{ts,tsx}`
  (`vite.config.ts:7`), `testTimeout` 30 s (`vite.config.ts:10`); coverage thresholds 70% lines overall, 90% for
  `src/{engine,bots,advice,stats}/**` (`vite.config.ts:16`). `npm test` = `vitest run --coverage`
  (`package.json:15`); lint = ESLint (`tseslint.configs.strict`, not type-checked, `eslint.config.js:24`) +
  Prettier (`package.json:17`). fast-check 4.10 is available (`package.json:41`).
- `src/engine/cards.ts:30-37` `parseCard(text: string)`: calls `text.charAt` (so non-strings throw a native
  `TypeError`), checks `text.length !== 2`, and throws `RangeError(\`Invalid card: "${text}"\`)` echoing the whole
  input. `parseCards` (`:39-42`) maps tokens through it. Existing exact messages are asserted at
  `tests/engine/cards.test.ts:30-33` for `'as', '10s', 'Ax', '', 'A', 'Ass', ' As'` and `'Kx'` (all ≤ 3
  characters). Not locked.
- `src/engine/hand.ts:116-118` `isPositiveInteger` uses `Number.isInteger` (accepts 2**60); `:139-147` stakes
  rule → `RangeError('Invalid stakes')`; `:156-161` stacks → `RangeError(\`Stack at seat ${seat} must be an integer
  of at least ${min}\`)`; `:120-123` `minimumStack(stakes) = 8*smallBet + 8*bigBet` (exported, used by
  `src/table/session.ts:168`). `createHand` (`:165-219`) validates `config` then reads `config.seats` again
  (`:168`) and stores `stakes` by reference (`:190`); `deck` is already copied (`:193`), players and the pot
  `eligible` array are new objects (`:169,174,197`). The doc comment (`:164`) says "Throws RangeError on invalid
  config". There is no `'invalid-config'` code anywhere in `src/` or `tests/` (grep): "the existing
  invalid-config error" in AC#2 is this `RangeError` with its fixed messages. Exact messages asserted at
  `tests/engine/hand.test.ts:146-175` (not locked).
- `src/engine/seeded-random.ts:87-100` `nextIntUnbiased(n)`: Lemire multiply-shift; `m = nextUint32() * n` is a
  double, exact only while < 2^53 (n ≤ 2^21, or n a power of two), yet the doc says "exactly uniform … n is
  1..2^31" (doc-9 MINOR). No argument check. Only production caller: `shuffledDeck`, n = 2..52
  (`src/engine/deck.ts:48-49`). Tests: `tests/engine/seeded-random.test.ts:44-67` (vectors for n = 52, a stubbed
  rejection for n = 3, range checks including n = 2^31). Not locked.
- Banned substrings: `tests/advice/equity.acceptance.test.ts:198-209` (locked, TASK-7.1) reads every `.ts` file
  under `src/advice/` **and `src/engine/seeded-random.ts`** and fails if the text contains `Math.random`,
  `Date`, `performance`, `crypto` or `process` (case-sensitive substrings). So the new code and comments in
  `seeded-random.ts` must not contain e.g. "cryptographic", "process", "Date". No such check applies to
  `cards.ts` or `hand.ts`.
- Byte-identical decks are already pinned by the locked golden decks for four replay codes
  (`tests/engine/deck.acceptance.test.ts:19-28`).
- The 10,000-hand playtest: `npm run playtest` (default `--hands 10000`, `src/playtest/cli.ts:32-35`) and the
  locked `tests/playtest/playtest.acceptance.test.ts` / `runner.acceptance.test.ts`.
- Existing code to reuse:
  - `src/engine/hand.ts:120` `minimumStack` → the A-4 bound (do not duplicate the formula).
  - `src/engine/seeded-random.ts:89-99` → keep the Lemire structure and the threshold formula
    `(4294967296 - n) % n`; only the product computation changes.
  - `src/engine/deck.ts` `shuffledDeck`, `replayCodeFromWords`, and `Xoshiro128` → generate sample codes in the
    deck-identity test (pattern of `tests/engine/deck.acceptance.test.ts:65-75`).
  - `tests/engine/hand.test.ts:15-27` `STAKES`, `DECK`, `config()` → the AC#2/AC#3 tests (copy the small helper
    into the new acceptance file; do not import from a test file).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `nextIntUnbiased`: exact for n in 1..2^32, `RangeError` otherwise (A-1) | Throw for n > 2^21 | Satisfies AC#4 either way; keeps every current test and every deck identical | no | n/a (A-1) |
| D-2 | All new rejections reuse `RangeError` and the existing messages; the only new message texts are the parseCard non-string message (A-2), the truncated echo form (A-3) and the `nextIntUnbiased` range message | New error classes or codes | Caller constraint: keep messages stable, reuse existing types | no | n/a |
| D-3 | AC#1–AC#4 behaviour goes in one new locked acceptance file; implementation-level checks (BigInt oracle, legacy-shuffle equality) go in existing unit files | Put everything in the existing unit files | Acceptance files get locked; existing unit files are shared with earlier tasks and stay editable | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/cards.ts` — `parseCard` type guard and truncated echo
- `src/engine/hand.ts` — snapshot, safe-integer checks, A-4 bound, doc comment
- `src/engine/seeded-random.ts` — exact `nextIntUnbiased`, argument guard, doc comment
- `tests/engine/input-hardening.acceptance.test.ts` — new: AC#1–AC#4 (locked after the first green build)
- `tests/engine/cards.test.ts` — unit: exact messages for the new cases
- `tests/engine/hand.test.ts` — unit: exact messages for unsafe stakes/stacks and the A-4 bound
- `tests/engine/seeded-random.test.ts` — unit: BigInt oracle, identity with the legacy formula, range guard
- `tests/engine/deck.test.ts` — unit: decks for 10,000 sample codes equal a legacy re-implementation

### Components, interfaces and data
No exported signature changes.
- `parseCard(text: string): Card` — unchanged signature. New: throws `RangeError` for any non-string runtime
  value; never echoes more than 10 input characters.
- `createHand(config: HandConfig): HandState` — unchanged signature. New: builds from a private snapshot;
  rejects unsafe integers. Doc comment: "Posts blinds and deals hole cards. Copies config first, so later changes
  to the caller's objects do not affect the hand. Throws RangeError on invalid config."
- `Xoshiro128.nextIntUnbiased(n: number): number` — unchanged signature. New: valid n is any integer in
  1..2^32 (4294967296); others throw. Doc comment must state the range, for example:
  `/** Integer in [0, n), exactly uniform for every integer n in 1..2^32 (Lemire multiply-shift with rejection, exact 64-bit product). Throws RangeError for any other n. */`
  (no banned substrings).

### Rules and algorithms
1. `parseCard(text)`:
   - If `typeof text !== 'string'`: throw `RangeError(\`Invalid card: expected a string, got ${typeof text}\`)`.
   - Else if `text.length !== 2` or rank/suit not found: throw `RangeError(\`Invalid card: "${echo}"\`)` where
     `echo = text.length <= 10 ? text : text.slice(0, 10) + '...'`.
   - Example: `parseCard('AsKdQhJcTs9')` (11 chars) → `Invalid card: "AsKdQhJcTs..."`;
     `parseCard('AsKdQhJcTs')` (10) → `Invalid card: "AsKdQhJcTs"`; `parseCard('Ass')` → `Invalid card: "Ass"`
     (unchanged); `parseCard(undefined)` → `Invalid card: expected a string, got undefined`;
     `parseCard(null)` → `… got object`; `parseCard(51)` → `… got number`.
2. `createHand(config)`:
   - Snapshot (A-6): `stakes = { smallBlind, bigBlind, smallBet, bigBet }` read once from `config.stakes`;
     `seats = config.seats.map(({ seat, stack }) => ({ seat, stack }))`; `deck = [...config.deck]`;
     `button = config.button`. `validate` and the builder use only the snapshot; `HandState.stakes` is the
     snapshot stakes object and `HandState.deck` the snapshot deck.
   - Stakes: every amount must satisfy `Number.isSafeInteger(x) && x > 0`, plus the existing order rule, plus
     `10 * minimumStack(stakes) <= Number.MAX_SAFE_INTEGER` (A-4); any failure →
     `RangeError('Invalid stakes')`. Check order is unchanged: seats count, seat numbers, duplicates, button,
     stakes, deck, stacks.
   - Stacks: `Number.isSafeInteger(stack) && stack >= minimumStack(stakes)`, else the existing
     `RangeError(\`Stack at seat ${seat} must be an integer of at least ${min}\`)`.
   - Examples (`STAKES = {2,4,4,8}`, six seats of 160, button 1, `DECK` = 0..51):
     - `bigBet: 2 ** 53` → `Invalid stakes`; `smallBlind: Number.MAX_SAFE_INTEGER + 2` → `Invalid stakes`.
     - `{ smallBlind: 1, bigBlind: 1, smallBet: 1, bigBet: 2 ** 50 }` → `Invalid stakes`
       (10 × (8 + 2^53) > 2^53 − 1).
     - `{ smallBlind: 1, bigBlind: 1, smallBet: 1, bigBet: 2 ** 40 }` with stacks `2 ** 44` → accepted.
     - seat 3 stack `2 ** 60` → `Stack at seat 3 must be an integer of at least 96`;
       stack `2 ** 53` → same message; stack `Number.MAX_SAFE_INTEGER` → accepted.
3. `nextIntUnbiased(n)`:
   - Guard: if `!Number.isInteger(n) || n < 1 || n > 4294967296` throw
     `RangeError(\`nextIntUnbiased needs an integer n from 1 to 2^32, got ${String(n)}\`)`.
   - Exact product of `x = nextUint32()` (0..2^32−1) and n (1..2^32), every intermediate below 2^53:
     ```
     nLo = n % 65536; nHi = (n - nLo) / 65536        // nHi <= 65536
     a = x * nLo                                     // < 2^48
     b = x * nHi                                     // <= 2^48
     bLo = b % 65536; bHi = (b - bLo) / 65536
     s = bLo * 65536 + a                             // < 2^49
     low = s % 4294967296
     high = bHi + (s - low) / 4294967296             // = floor(x*n / 2^32), exact
     ```
   - Rejection unchanged: if `low < n`, `threshold = (4294967296 - n) % n`; while `low < threshold` draw a new x
     and recompute. Return `high`.
   - Because today's double product is exact for n ≤ 2^21 and for powers of two, `high` and `low` equal today's
     `Math.floor(m / 2^32)` and `m % 2^32` there, so the number of draws and every result are identical; decks
     (n = 2..52) do not change. Worked example: stubbed x = 4294967295, n = 2^32 → threshold 0, returns
     4294967295. Stubbed x = 0 then 5, n = 3 → first low 0 < threshold 1, redraws, returns 0 (the existing test
     at `tests/engine/seeded-random.test.ts:52-55` still passes).

### Error handling and configuration
- Unchanged messages (must stay byte-identical): every message in `tests/engine/cards.test.ts:30-40` and
  `tests/engine/hand.test.ts:149-169`, `Invalid card: ${value}` from `formatCard`, `Invalid rank or suit: …`,
  `Invalid replay code…`.
- New messages: `Invalid card: expected a string, got <typeof>`; `Invalid card: "<first 10 chars>..."`;
  `nextIntUnbiased needs an integer n from 1 to 2^32, got <n>`. All `RangeError`. No configuration.

## 6. Behaviour specification

### SPEC-01: parseCard rejects non-strings with a RangeError that echoes no input
- Verifies: AC#1
- Behaviour: Given each of `undefined`, `null`, `51`, `{}`, `['As']` (cast to string), When `parseCard` is
  called, Then it throws a `RangeError` (not a `TypeError`) whose message is exactly
  `Invalid card: expected a string, got <typeof value>` (`undefined`, `object`, `number`, `object`, `object`).
- Verification: acceptance `tests/engine/input-hardening.acceptance.test.ts::AC#1 parseCard rejects non-strings and echoes at most 10 characters`

### SPEC-02: parseCard echoes at most 10 characters of a rejected string
- Verifies: AC#1
- Behaviour: Given strings longer than 3 characters — `'Asss'`, `'AsKdQhJcTs'` (10), `'AsKdQhJcTs9'` (11) and
  `'X'.repeat(100000)` — When `parseCard` is called, Then it throws `RangeError` with messages
  `Invalid card: "Asss"`, `Invalid card: "AsKdQhJcTs"`, `Invalid card: "AsKdQhJcTs..."` and
  `Invalid card: "XXXXXXXXXX..."`; and for every string s in a fast-check sample (`fc.string({ maxLength: 200 })`,
  2,000 runs, filtered to strings that are not one of the 52 card names), the message equals
  `` `Invalid card: "${s.length <= 10 ? s : s.slice(0, 10) + '...'}"` `` and is at most 29 characters long.
- Verification: acceptance `tests/engine/input-hardening.acceptance.test.ts::AC#1 parseCard rejects non-strings and echoes at most 10 characters`

### SPEC-03: existing card messages and parsing are unchanged
- Verifies: AC#1
- Behaviour: Given the existing unit test, When it runs, Then all 52 cards still round-trip and every existing
  message (`'as', '10s', 'Ax', '', 'A', 'Ass', ' As'`, `'Kx'` via `parseCards`) is byte-identical; the new unit
  cases add `parseCard(undefined as unknown as string)` → `Invalid card: expected a string, got undefined` and
  `parseCards('As KdQhJcTs9x')` → `Invalid card: "KdQhJcTs9x"` (10 chars, no marker).
- Verification: unit `tests/engine/cards.test.ts::card encoding and text helpers`

### SPEC-04: createHand rejects unsafe-integer stakes and stacks with the existing errors
- Verifies: AC#2
- Behaviour: Given the six-seat config with `STAKES = {2,4,4,8}` and stacks 160, When any one of the four stakes
  is replaced by `2 ** 53`, `Number.MAX_SAFE_INTEGER + 2` or `2 ** 60`, Then `createHand` throws
  `RangeError('Invalid stakes')`; When the stack of seat 3 is `2 ** 53` or `2 ** 60`, Then it throws
  `RangeError('Stack at seat 3 must be an integer of at least 96')`; When the stack of seat 3 is
  `Number.MAX_SAFE_INTEGER`, Then the hand is created and seat 3's `startingStack` equals
  `Number.MAX_SAFE_INTEGER`.
- Verification: acceptance `tests/engine/input-hardening.acceptance.test.ts::AC#2 createHand rejects stakes and stacks that are not safe integers`

### SPEC-05: stakes whose pot totals could exceed 2^53 are rejected (A-4)
- Verifies: AC#2
- Behaviour: Given stakes `{1, 1, 1, 2 ** 50}` and stacks `2 ** 52`, When `createHand` is called, Then it throws
  `RangeError('Invalid stakes')`; Given stakes `{1, 1, 1, 2 ** 40}` and stacks `2 ** 44`, Then the hand is
  created; and every existing case in the test (including `'Invalid stakes'` for `smallBlind: 0`,
  `bigBet: 8.5`, and the `Stack at seat 3 … 96` case) still throws its exact message.
- Verification: unit `tests/engine/hand.test.ts::createHand rejects invalid configs with fixed messages`

### SPEC-06: mutating the caller's stakes and seats after createHand leaves the hand unchanged
- Verifies: AC#3
- Behaviour: Given mutable `stakes`, `seats` (array of mutable `{seat, stack}` objects) and `deck` objects passed
  to `createHand`, and `before = structuredClone(state)`, When the caller then sets every stake to 1000, sets
  every seat's `stack` to 1 and `seat` to 9, pushes a seat, reverses the deck and sorts the seats array, Then
  `state` deep-equals `before`, `state.stakes` is not the caller's object, `legalActions(state)` equals the
  result computed before the mutation, and applying the first legal action gives the same next state as on an
  untouched twin hand created from identical fresh inputs.
- Verification: acceptance `tests/engine/input-hardening.acceptance.test.ts::AC#3 createHand does not alias the caller's stakes or seats`

### SPEC-07: nextIntUnbiased throws RangeError outside 1..2^32 and its doc comment states the range
- Verifies: AC#4
- Behaviour: Given a fresh `Xoshiro128(1)`, When `nextIntUnbiased` is called with each of `0`, `-1`, `1.5`,
  `NaN`, `Infinity`, `2 ** 32 + 1`, `2 ** 53`, Then it throws
  `RangeError('nextIntUnbiased needs an integer n from 1 to 2^32, got <String(n)>')`; When called with `1`,
  `2 ** 21 + 1`, `3_000_000_019`, `2 ** 32 − 1` and `2 ** 32`, 1,000 times each, Then every value is an integer in
  [0, n). And the source text of `src/engine/seeded-random.ts` contains, in the doc comment immediately above
  `nextIntUnbiased`, the text `1..2^32` and `RangeError`.
- Verification: acceptance `tests/engine/input-hardening.acceptance.test.ts::AC#4 nextIntUnbiased is exact for every n in its documented range and throws outside it`

### SPEC-08: nextIntUnbiased is exactly unbiased for every n in 1..2^32
- Verifies: AC#4
- Behaviour: Given `nextUint32` stubbed (via `vi.spyOn`) to return x then a second value, When
  `nextIntUnbiased(n)` is called for 20,000 fast-check pairs x in [0, 2^32−1], n in [1, 2^32] (biased toward
  n > 2^21 with `fc.oneof`), Then, with `p = BigInt(x) * BigInt(n)`, `low = p & 0xffffffffn`,
  `threshold = (2n ** 32n - BigInt(n)) % BigInt(n)`: if `low >= threshold` the result equals `Number(p >> 32n)`
  and exactly one draw was made; otherwise a second draw was made. Also: stubbed x = 4294967295, n = 2^32 →
  4294967295; stubbed x = 4294967295, n = 3221225473 → equals `Number((4294967295n * 3221225473n) >> 32n)`
  (= 3221225472) with one draw. Equality with this exact oracle on every accepted draw, plus the exact
  rejection rule, is what makes the result exactly uniform.
- Verification: acceptance `tests/engine/input-hardening.acceptance.test.ts::AC#4 nextIntUnbiased is exact for every n in its documented range and throws outside it`

### SPEC-09: results are identical to the previous formula wherever it was exact
- Verifies: AC#4
- Behaviour: Given a test-local copy of the previous algorithm (double product `m = x * n`, `low = m % 2^32`,
  same rejection loop, result `Math.floor(m / 2^32)`) driven by an identically seeded twin `Xoshiro128`, When
  both draw 20 values for 2,000 fast-check pairs (state words, n) with n in [1, 2^21] and for every power of two
  n = 2^0..2^31, Then the sequences are equal and both generators end in the same state (their next
  `nextUint32()` is equal). The existing vectors (`[0, 0, 0, 24, 19]` for n = 52 from state 1,2,3,4) still pass.
- Verification: unit `tests/engine/seeded-random.test.ts::nextIntUnbiased matches the previous formula wherever it was exact`

### SPEC-10: every replay code still deals the same deck
- Verifies: AC#4
- Behaviour: Given 10,000 replay codes from `replayCodeFromWords` over words drawn from `new Xoshiro128(2121)`
  plus the four golden codes, When `shuffledDeck(code)` is compared with a test-local legacy shuffle (the
  previous `nextIntUnbiased` formula above, `Xoshiro128.fromState(...mixState128(words))`, Fisher–Yates from
  i = 51 down to 1), Then all decks are equal element for element; and the locked golden decks in
  `tests/engine/deck.acceptance.test.ts` still pass unchanged.
- Verification: unit `tests/engine/deck.test.ts::shuffledDeck deals the same decks as before the exact nextIntUnbiased`

### SPEC-11: whole suite, lint, typecheck, banned substrings and the 10,000-hand playtest stay green
- Verifies: AC#1, AC#2, AC#3, AC#4
- Behaviour: Given the change, When `npm run lint && npm run typecheck && npm test` runs, Then all pass with the
  engine coverage threshold met, the locked TASK-7.1 banned-substring check still passes for
  `src/engine/seeded-random.ts`, the locked TASK-1.3/1.4/1.5/1.6/3.4 acceptance and property tests pass
  unmodified (`python3 ~/.claude/skills/doit/scripts/doit.py test-integrity TASK-1.21` clean), and
  `npm run playtest` (10,000 hands, seed 42) exits 0 with no invariant violations.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest`

## 7. Edge cases
- Empty / boundary / max: `parseCard('')` keeps `Invalid card: ""` (SPEC-03); exactly 10 vs 11 characters
  (SPEC-02); stack `Number.MAX_SAFE_INTEGER` accepted, `2 ** 53` rejected (SPEC-04); A-4 boundary (SPEC-05);
  n = 1, 2^21, 2^21 + 1, 2^32 − 1, 2^32, 2^32 + 1 (SPEC-07, SPEC-08, SPEC-09).
- Invalid input: non-strings (SPEC-01); non-integer / NaN / Infinity n (SPEC-07); unsafe stakes and stacks
  (SPEC-04). Non-number stakes (e.g. `'4'`) are already rejected because `Number.isSafeInteger('4')` is false;
  covered by the same rule, no separate item.
- Very long input: a 100,000-character string is truncated (SPEC-02).
- Duplicates / concurrency / interruption / permissions / dependency failure: N/A — pure synchronous functions
  with no I/O.
- Surrogate pairs: truncation is by UTF-16 code unit and may split a pair; the message is developer-facing, so
  this is acceptable (A-3).

## 8. Security considerations
- Trust boundaries: these engine functions are reached today only from typed code (playtest CLI validates
  replay codes first, `src/playtest/cli.ts`; the session builds stakes from fixed options,
  `src/table/session.ts:30-34`). Later callers (saved data, URL replay) may pass untrusted values; this task
  makes the engine fail closed for them: type checks (SPEC-01), safe-integer checks and the pot bound
  (SPEC-04, SPEC-05), input snapshot (SPEC-06), argument guard (SPEC-07).
- Sensitive data / log injection: messages echo at most 10 input characters (SPEC-02), limiting log flooding.
  Echoed text is not escaped (A-3); a UI must not render engine messages as HTML (none does).
- Randomness: the shuffle stays seeded xoshiro128** from a crypto-seeded replay code (TASK-1.3). The fix makes
  `nextIntUnbiased` exactly uniform across its whole documented range; decks for existing codes are unchanged
  (SPEC-09, SPEC-10).
- Authn/authz, secrets, injection into queries, new dependencies: N/A — none.

## 9. Non-functional
- No measurable slowdown: `nextIntUnbiased` adds a guard and about six arithmetic operations per call (51 calls
  per deck). The existing hand-evaluator and equity perf tests are untouched; the 10,000-hand playtest's run
  time should stay within normal noise of the current run (measured informally by the builder before/after).
- Engine line coverage stays ≥ 90% (`vite.config.ts:16`); the new branches are all exercised by SPEC-01..SPEC-08.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest` (10,000 hands, default seed 42; must exit 0 with no invariant violations)
- New tests (path → SPEC ids):
  - `tests/engine/input-hardening.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-04, SPEC-06, SPEC-07, SPEC-08
  - `tests/engine/cards.test.ts` → SPEC-03
  - `tests/engine/hand.test.ts` → SPEC-05
  - `tests/engine/seeded-random.test.ts` → SPEC-09
  - `tests/engine/deck.test.ts` → SPEC-10
- Notes for the builder:
  - Do not write `Math.random`, `Date`, `performance`, `crypto` or `process` anywhere in
    `src/engine/seeded-random.ts`, including comments ("cryptographic", "processing" would fail the locked
    TASK-7.1 check). Test files may use them.
  - Non-string calls in tests use a cast (`undefined as unknown as string`); keep `parseCard`'s parameter type
    `string`.
  - The acceptance file must not depend on implementation details beyond the public functions and the source
    text of the `nextIntUnbiased` doc comment (SPEC-07).
- End-to-end scenario for the Judge: run `npm run playtest` and `npm run playtest -- --replay-code
  0123456789abcdeffedcba9876543210 --size 6` on the base commit and on the branch and diff the output (must be
  identical); then in a scratch Vitest file call `parseCard('x'.repeat(50))`, `parseCard(undefined)`,
  `createHand` with a `2 ** 60` stack, and `new Xoshiro128(1).nextIntUnbiased(2 ** 32 + 1)` and confirm the
  messages in §5.

## 11. Open questions
None.

## 12. Clarifications log
See `doit/TASK-1.21/qa.md`.

### Follow-ups (proposed tasks, not in this scope)
- Make `parseCards` throw `RangeError` (not `TypeError`) for non-string input, reusing the `parseCard` message.
- Make `evaluate` reject non-array input with `RangeError` instead of returning a rank for `{}` (doc-7 MINOR).
- Truncate the echoed text in `shuffledDeck`'s `Invalid replay code` error to at most 10 characters without
  breaking the TASK-1.3 locked messages (doc-9 NIT; needs a check of which messages are locked).
- Add a hand test that a fold removes the seat from pot eligibility and that `totalContribution` tracks chips
  (doc-10 MINOR `fold-eligible-and-total-contribution-untested`).
- Add a hand test that accepts `smallBlind === bigBlind` stakes (doc-10 MINOR `sb-equals-bb-boundary-untested`).
- Have the session layer validate saved or restored stakes with the same safe-integer and pot-bound rules
  before building a table (when saved data arrives, TASK-9.x).
