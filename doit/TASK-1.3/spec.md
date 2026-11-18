# Spec: TASK-1.3 — Deal every hand from a seeded shuffle with a replay code

Status: READY (approved 2026-11-17)
Task: TASK-1.3 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-013.1, REQ-013.2, REQ-013.3 (deck part only) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the deck module `src/engine/deck.ts`. It draws a fresh 128-bit seed per hand from the platform's
cryptographically secure source (`crypto.getRandomValues`, which in Node is the Node crypto module's Web Crypto
object), writes that seed as a text replay code, and turns a replay code into a 52-card deck order with a Fisher–Yates
shuffle driven by the existing xoshiro128** generator, whose state is the code's four words after a fixed
SplitMix32-finaliser mixing step. The same replay code always gives the same deck, in Node and in
every browser. The next consumers are the hand engine (TASK-1.4, which deals from `shuffledDeck(code)`), the playtest
CLI (TASK-1.6, which makes reproducible codes from `--seed` with `replayCodeFromWords` and replays recorded hands), and
later the bot generator (TASK-6.18), hand records (TASK-3.9) and Hand Review (TASK-9.4), which store and show the code.

## 2. Scope
- In scope:
  - `src/engine/deck.ts`: the `ReplayCode` type and four functions: `newReplayCode`, `replayCodeFromWords`,
    `isReplayCode`, `shuffledDeck` (§5).
  - `src/engine/seeded-random.ts`: two additions: `mixState128(words)` (the seed-mixing step, §5 rule 4) and the method
    `Xoshiro128.nextIntUnbiased(n)` (exactly uniform integer in `[0, n)`). Existing functions and their outputs do not
    change.
  - Vitest acceptance and unit tests under `tests/engine/`, and one Playwright test `e2e/replay-seed.spec.ts` that runs
    the real module in Chromium and WebKit (AC#3 browser path).
- Not doing:
  - Dealing hole cards or board cards, burn cards, hand state, seats, button (TASK-1.4).
  - Full-hand replay (same code + seats + stacks + button + actions → same cards), REQ-013.3 as a whole: TASK-1.6 AC#5.
  - Deriving per-seat bot generators from the replay code (TASK-6.18), and any `replayCodeWords(code)` accessor for it.
  - Storing the code in hand records (TASK-3.9), hiding it before the hand ends (E03, REQ-013.4), showing it in Hand
    Review (TASK-9.4, REQ-013.5). No UI change in this task.
  - Any CLI option or `npm` script (TASK-1.6).
  - Changes to the outputs of `fnv1a32`, `splitMix32`, `Xoshiro128` constructor, `fromState`, `nextUint32` or `nextInt`.
  - New dependencies, a barrel `src/engine/index.ts`, a test-only switch or environment flag in production code.
  - Importing `node:crypto` (or any Node built-in) from `src/engine/**`.
- Scope budget: files=6, lines=450   (deck.ts ~75, seeded-random.ts +30, deck.acceptance.test.ts ~130, deck.test.ts ~100, seeded-random.test.ts +30, e2e/replay-seed.spec.ts ~80)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | One new source module `src/engine/deck.ts`; tests in `tests/engine/deck*.test.ts`; browser check in `e2e/replay-seed.spec.ts` | yes | Follows TASK-1.2 A-1 and TASK-7.1 A-1 layout (`tests/engine/`, `e2e/`) | Put replay-code helpers in a separate `replay-code.ts` |
| A-2 | AC#3 "Node crypto module" is met by `globalThis.crypto.getRandomValues`: in Node 22 `globalThis.crypto` is the same object as `require('node:crypto').webcrypto` (checked: `node -e` prints `true` on 22.18.0). One code path serves both environments; the Node test asserts that identity | yes | Importing `node:crypto` from `src/engine` would break the browser bundle (Vite stubs Node built-ins) and need environment sniffing. `crypto` is allowed by the headless lint rule because it is a Node global too (`tools/lint/headless-boundary.js:17-21`; `BROWSER_ONLY_GLOBALS.includes('crypto')` is `false`) | `import { randomFillSync } from 'node:crypto'` behind an environment check (breaks the browser build) |
| A-3 | The browser path of AC#3 is verified by a Playwright test that bundles `src/engine/deck.ts` in memory with Vite's `build()` API (`write: false`, IIFE, `configFile: false`), injects it into the preview page with `page.addScriptTag`, and wraps `crypto.getRandomValues` with a recorder via `page.addInitScript`. No production code, app entry or build output changes. Prototype: bundling `src/engine/seeded-random.ts` this way produced a 1,748-byte IIFE with no files written | yes | Runs the real module in real Chromium and WebKit (the CI e2e step already runs both, `.github/workflows/ci.yml`), with no new dependency and no test switch | Vitest browser mode (new dependency `@vitest/browser`); importing the deck into `src/main.tsx` (ships unused code); a spy-only Node test (does not touch a browser) |
| A-4 | `newReplayCode()` reads `globalThis.crypto` on every call (not cached at module load), so test spies installed after import take effect | yes | Natural code; required by SPEC-03/SPEC-04 | Cache the function at load (breaks spying) |
| A-5 | Deck order convention: `shuffledDeck(code)[0]` is the first card dealt. The unshuffled deck is `[0, 1, …, 51]` (the `Card` order in `src/engine/cards.ts:1`) | yes | Matches TASK-1.4 AC#2 wording ("deck cards 1 and 7" in deal order) | Deal from the end of the array |
| A-6 | Invalid input throws `RangeError` with the exact messages in §5 "Error handling" | yes | Same style as `cards.ts:17` and TASK-7.1 A-6 | Return `null` |
| A-7 | AC#2 uses a fixed, documented set of 100,000 codes (from `new Xoshiro128(2026)`), so the test is deterministic. The chi-square statistic is checked against the df = 51, p = 0.01 critical value 77.386 (computed with a regularised incomplete gamma; Wilson–Hilferty gives 77.4). Both "where card 0 lands" and "which card is on top" are tabulated | yes | A random seed set would fail 1 run in 100 by design. The prototype of the approved design (§5) gives 55.097 and 33.790 for this set (p ≈ 0.32 and 0.97) | Random seed set with retries; only one tabulation |
| A-8 | AC#1 uses fast-check (already a devDependency, `package.json:35`) with `numRuns: 10_000` over arbitrary 4-word seeds, plus fixed edge codes | yes | Same practice as TASK-1.2 A-5 | A fixed list of 10,000 codes |

## 3. Current system
- `src/engine/cards.ts:1` — `Card` is an integer 0..51, `card = rank * 4 + suit`; `formatCard`/`parseCards` give the
  `As`/`Td` notation (`cards.ts:30-49`). The deck holds these integers.
- `src/engine/seeded-random.ts` — `splitMix32` (`:14`), `Xoshiro128` with `constructor(seed)` expanding a 32-bit seed
  (`:33`), `fromState(s0..s3)` (`:41`), `nextUint32()` (`:50`) and `nextInt(n)` (`:64-66`, multiply-shift, bias up to
  n/2^32). Placed in `src/engine` by TASK-7.1 A-11 so this task can reuse it. Used by `src/advice/equity.ts:3,291`.
- Locked test constraint: `tests/advice/equity.acceptance.test.ts:198-209` reads `src/engine/seeded-random.ts` as text
  and fails if it contains `Math.random`, `Date`, `performance`, `crypto` or `process`. The new method and its comments
  must not contain these strings. `deck.ts` is not scanned (it legitimately uses `crypto`).
- Existing unit vectors: `tests/engine/seeded-random.test.ts:9-30` (e.g. `fromState(1, 2, 3, 4)` first outputs
  `11520, 0, 5927040, 70819200, 2031721883`).
- Headless boundary: `tools/lint/headless-boundary.js:17-25` forbids browser-only globals, i.e. globals in
  `globals.browser` but not in `globals.node`/`builtin`. `crypto` is in both, so `globalThis.crypto` is allowed. Dynamic
  `import()` is forbidden in headless folders (`:61-65`).
- TypeScript: `lib` includes `DOM` and `types` includes `node` (`tsconfig.json:4,8`), so `Crypto` and
  `globalThis.crypto` type-check. `noUncheckedIndexedAccess` is on (`tsconfig.json:10`).
- Tests: Vitest, `node` environment, `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7-8`), `testTimeout: 30_000`
  (`vite.config.ts:10`). Coverage ≥ 90% lines for `src/engine/**` (`vite.config.ts:15`). `npm test` =
  `vitest run --coverage` (`package.json:13`).
- E2E: Playwright, Chromium and WebKit projects, against `vite preview` of a fresh build on port 4173
  (`playwright.config.ts:3-25`). Existing pattern: `e2e/smoke.spec.ts`. CI runs `npm run e2e` (`.github/workflows/ci.yml`).
- Node 22.18.0 (`.nvmrc`): `globalThis.crypto === require('node:crypto').webcrypto` is `true`.
- Existing code to reuse:
  - `src/engine/seeded-random.ts` → `Xoshiro128.fromState` as the shuffle generator; `nextUint32` inside the new
    `nextIntUnbiased`; the SplitMix32 finaliser already inlined in `splitMix32` (`:19-21`) as `mix32` inside the new
    `mixState128` (`splitMix32` may call the extracted helper; its outputs must not change); `new Xoshiro128(2026)` to
    make the AC#2 test codes.
  - `src/engine/cards.ts` → `Card` type; `formatCard` in tests for readable golden vectors.
  - `e2e/smoke.spec.ts` → page/request patterns for the Playwright test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Replay code format and public API. Seed = 128 bits = four unsigned 32-bit words drawn with one `crypto.getRandomValues(new Uint32Array(4))`. Code = the four words as zero-padded lowercase hex, word 0 first, 32 characters, no separators, no checksum, e.g. `0123456789abcdeffedcba9876543210`. Parsing is strict: exactly `/^[0-9a-f]{32}$/`; the all-zero code is invalid. API: `newReplayCode()`, `replayCodeFromWords(words)`, `isReplayCode(text)`, `shuffledDeck(code)` and `type ReplayCode = string`. | (b) 32-bit seed, 8 hex chars (short to quote, but only 4.3 billion possible decks and xoshiro would be seeded through SplitMix32); (c) Crockford base32, 26 chars (shorter, case-insensitive, more code); (d) base64url, 22 chars (case-sensitive, has `-`/`_`, awkward to read aloud); (e) add a 1–2 char checksum (catches typos when a code is typed back in, +2 chars); (f) accept upper case on parse | Persisted in hand records (TASK-3.9) and shown in Hand Review (TASK-9.4): changing it later needs a migration. 128 bits makes collisions and guessing irrelevant and fills xoshiro128**'s full 128-bit state (after mixing, D-2). Hex is trivial to encode/parse identically everywhere, and it is "small text" in review. No user typing path exists in v1, so no checksum | yes | user (Q-1) |
| D-2 | Seed → generator and shuffle algorithm (user chose mixing, Q-2). Generator = `Xoshiro128.fromState(...mixState128(w))`, where `w` are the code's four words and `mixState128` (§5 rule 4) runs two passes of `b ^= mix32(a); c ^= mix32(b); d ^= mix32(c); a ^= mix32(d)` with `mix32` the SplitMix32 finaliser. Every step is invertible and `mix32(0) = 0`, so the mix is a bijection on 128 bits that maps only the all-zero code (already invalid, D-1) to the all-zero state: every valid code gives a non-zero xoshiro state, and two passes make every state word depend on all four code words. Shuffle = Durstenfeld Fisher–Yates on `[0..51]`: for `i` from 51 down to 1, `j = rng.nextIntUnbiased(i + 1)`, swap `deck[i]` and `deck[j]`. `nextIntUnbiased(n)` is Lemire's multiply-shift with rejection: exactly uniform; rejects with probability < n/2^32 (< 1.3e-8 for n ≤ 52). All arithmetic is exact (32-bit `Math.imul`/xor, and products < 2^38 in doubles), so Node and every browser give the same deck | (b) direct state (code words = xoshiro state; low-entropy codes such as `…0001` give poorly scrambled first outputs); (c) a 32-bit SplitMix32 stream seeded from a hash of the words (loses 96 bits of seed); (d) reuse `nextInt` (bias up to 1.2e-8 per index); (e) sfc32; (f) shuffle with a CSPRNG directly (not replayable) | TASK-1.6 derives codes from small `--seed` values; mixing scrambles low-entropy codes (the prototype's chi-square over codes `[0, 0, 0, k]`, k = 1..100,000, is 58.743, p > 0.01) while keeping all 2^128 codes distinct. Every index draw is exactly uniform. Reuses TASK-7.1's tested generator. Note: 2^128 seeds cannot reach all 52! ≈ 2^225.6 orders; unobservable in play | yes | user (Q-2) |
| D-3 | AC#3 seed source: one code path, `globalThis.crypto.getRandomValues`, in both environments (A-2) | `node:crypto` import with environment detection | Works in both; keeps the engine bundle browser-safe; allowed by the lint rule | no | n/a |
| D-4 | Browser verification by an in-memory Vite bundle injected into the preview page (A-3) | Vitest browser mode (new dependency); shipping deck code in the app | No new dependency, no production change | no | n/a |
| D-5 | `newReplayCode` redraws if the crypto source returns four zero words (probability 2^-128), so it never returns an invalid code | Throw | Never fails in practice; keeps the "always valid" contract testable (SPEC-05) | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/deck.ts` — new: `ReplayCode`, `newReplayCode`, `replayCodeFromWords`, `isReplayCode`, `shuffledDeck`
- `src/engine/seeded-random.ts` — modify: add `mixState128` (with a private `mix32` helper) and `Xoshiro128.nextIntUnbiased(n)` (no output change to existing functions; no banned strings, §3)
- `tests/engine/deck.acceptance.test.ts` — new, locked: AC#1, AC#2, AC#3 (Node), AC#4
- `tests/engine/deck.test.ts` — new: format, validation errors, redraw, golden vectors
- `tests/engine/seeded-random.test.ts` — modify: add one `it` for `nextIntUnbiased` and one for `mixState128`
- `e2e/replay-seed.spec.ts` — new, locked: AC#3 (browser) and cross-browser deck stability

### Components, interfaces and data
`src/engine/deck.ts` (imports only `./cards` type and `./seeded-random`):
```ts
/** 32 lowercase hex characters: the hand's 128-bit seed, word 0 first. Never all zeros. */
export type ReplayCode = string;

/** A new code from globalThis.crypto.getRandomValues(new Uint32Array(4)); redraws on all-zero words. */
export function newReplayCode(): ReplayCode;

/** Encodes four unsigned 32-bit words. For seeded runs (TASK-1.6). Throws RangeError on bad input. */
export function replayCodeFromWords(words: readonly number[]): ReplayCode;

/** True iff text is exactly /^[0-9a-f]{32}$/ and not all zeros. */
export function isReplayCode(text: string): boolean;

/** A new array of the 52 cards in deal order (index 0 is dealt first). Throws RangeError on an invalid code. */
export function shuffledDeck(code: ReplayCode): Card[];
```
`src/engine/seeded-random.ts`:
```ts
/** Mixes four unsigned 32-bit seed words into a xoshiro128** state (§5 rule 4). Bijective; only all-zero maps to all-zero. */
export function mixState128(words: readonly [number, number, number, number]): [number, number, number, number];

/** Integer in [0, n), exactly uniform (Lemire multiply-shift with rejection). n is 1..2^31. */
nextIntUnbiased(n: number): number;
```
Invariants: `shuffledDeck` is pure (same code → equal arrays, fresh array each call); its result is a permutation of
0..51; `newReplayCode()` always satisfies `isReplayCode`; `replayCodeFromWords(w)` round-trips: the code's 8-char
groups parsed as hex equal `w`.

### Rules and algorithms
1. Encode: `words.map(w => w.toString(16).padStart(8, '0')).join('')`.
2. Decode: four `parseInt(code.slice(8k, 8k + 8), 16)` values.
3. `nextIntUnbiased(n)`: `m = nextUint32() * n; l = m % 2^32; if (l < n) { t = (2^32 - n) % n; while (l < t) { m = nextUint32() * n; l = m % 2^32 } } return Math.floor(m / 2^32)`.
4. Mixing (`mixState128`). `mix32(x)`: `x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); return (x ^ (x >>> 16)) >>> 0`
   (the SplitMix32 finaliser; `mix32(0) = 0`, `mix32(1) = 1364076727`, `mix32(0x9e3779b9) = 2462723854` = first
   `splitMix32(0)` output). With `[a, b, c, d] = words`, repeat exactly twice, in this order, all as unsigned 32-bit:
   `b = (b ^ mix32(a)) >>> 0; c = (c ^ mix32(b)) >>> 0; d = (d ^ mix32(c)) >>> 0; a = (a ^ mix32(d)) >>> 0`. Return
   `[a, b, c, d]`. State vectors:
   - `[0, 0, 0, 1]` → `[2113565907, 804215951, 1461123477, 215606639]`
   - `[1, 2, 3, 4]` → `[2596147925, 1707097829, 2530956364, 2107774845]`
   - `[0x01234567, 0x89abcdef, 0xfedcba98, 0x76543210]` → `[3040342894, 2181108681, 1539535247, 3909763452]`
   - `[0xffffffff × 4]` → `[753140462, 1665157609, 1069552014, 3131831619]`
   - `[0, 0, 0, 0]` → `[0, 0, 0, 0]` (never used: the all-zero code is invalid)
5. Shuffle: `deck = [0..51]`; `rng = Xoshiro128.fromState(...mixState128(decode(code)))`; for `i = 51` down to `1`:
   `j = rng.nextIntUnbiased(i + 1)`, swap `deck[i]`, `deck[j]`. Golden vectors (prototype of rules 1–5), shown with
   `formatCard`:
   - `00000000000000000000000000000001` → `6h 7s Qs 4h 4c Qd 6d Jd 7c Tc 5c Ks 8h 2h 5s 3d 8d Ts 2c 6s Kc 3s 3h 4s 8c Kd 4d Jh 6c As Ac 5d 9d Qc 5h Kh 9h 7h 9c 7d Ah Jc 2s Js Td 9s Th 2d Ad 3c Qh 8s`
   - `00000001000000020000000300000004` → `5h 4s 6d Ah 5c Ts 4d 7s As 9h Td Ac Qc 9d 6c 6h 9c 5s 3d Tc 2s 7h 2c 6s 8h Kh 8s Ad 3s 8c 8d 2d 5d 7d Ks Qh Js Kc Th Jh 3h Qd Jd Qs 9s 4c 4h Jc Kd 3c 2h 7c`
   - `0123456789abcdeffedcba9876543210` → `6d Qs 8h Ts Ad Qd 4h Jh Tc 6s 2s 7h Js 2h Ks 4c 2d 6c Ah Qh 8d Jd 8c 4d 7d 9s 8s 2c 7s 7c Kc Ac 5c Qc Kh 3s 6h As 9c 3d 9h Td 4s 5s 3h 5d Kd Th Jc 5h 9d 3c`
   - `ffffffffffffffffffffffffffffffff` → `5d 5h 9c Jd 6h Ac Th 2s 8s 4h 7c 7h 8c Tc 9d 8h 5s 3c Td Kc Qc 2d 2c 4d Ah Kh 8d 6c 2h 9h 7s Qh Kd 3h 4s Jh Js As Qs Ks 3d Ts 9s 4c Ad 6s 5c Jc 7d 6d Qd 3s`
6. AC#2 test code set: `g = new Xoshiro128(2026)`; code k (k = 0..99,999) =
   `replayCodeFromWords([g.nextUint32(), g.nextUint32(), g.nextUint32(), g.nextUint32()])`. Tabulate
   `deck.indexOf(0)` and `deck[0]` into 52 bins each; expected 100,000/52 per bin;
   `χ² = Σ (observed − expected)² / expected`; pass iff `χ² < 77.386` (p > 0.01, df = 51). Prototype values (approved design):
   55.097 and 33.790.

### Error handling and configuration
- `replayCodeFromWords`: if `words.length !== 4`, any word is not an integer in `0..4294967295`, or all four are 0 →
  `RangeError('Invalid replay code words')`.
- `shuffledDeck`: if `!isReplayCode(code)` → `` RangeError(`Invalid replay code: "${code}"`) ``.
- `newReplayCode`: no error path of its own; if `globalThis.crypto` is missing, the platform's `TypeError` propagates
  (every supported browser and Node ≥ 22 provide it).
- No configuration.

## 6. Behaviour specification

### SPEC-01: Every shuffled deck is a permutation of the 52 cards
- Verifies: AC#1
- Behaviour: Given 10,000 arbitrary valid seeds (fast-check: four `fc.integer({ min: 0, max: 0xffffffff })` words, not all zero, encoded with `replayCodeFromWords`) plus the fixed codes `00000000000000000000000000000001`, `ffffffffffffffffffffffffffffffff` and `0123456789abcdeffedcba9876543210`, When `shuffledDeck(code)` runs, Then the result has length 52, every element is an integer, and sorting a copy ascending gives exactly `[0, 1, …, 51]`.
- Verification: acceptance `tests/engine/deck.acceptance.test.ts::AC#1 every seeded deck holds each of the 52 cards exactly once`

### SPEC-02: First-card position is uniform over 100,000 shuffles
- Verifies: AC#2
- Behaviour: Given the 100,000 codes of §5 rule 6, When each deck is shuffled and (a) the position of card 0 (`2c`, the first card of the unshuffled deck) and (b) the card at position 0 are tabulated into 52 bins, Then both chi-square statistics are below 77.386 (p > 0.01 at 51 degrees of freedom), and the bin counts each sum to 100,000. The test prints both statistics.
- Verification: acceptance `tests/engine/deck.acceptance.test.ts::AC#2 first-card position passes a chi-square uniformity test`

### SPEC-03: In Node the seed comes from the Node crypto module
- Verifies: AC#3
- Behaviour: Given Node, When the test imports `webcrypto` from `node:crypto`, Then `globalThis.crypto === webcrypto`. Given `vi.spyOn(webcrypto, 'getRandomValues')` (calling through) and `Math.random` replaced by a function that throws, When `newReplayCode()` is called, Then `getRandomValues` was called exactly once with a `Uint32Array` of length 4, and the returned code equals the zero-padded lowercase hex of that array's four words after the call. Given the spy instead fills the array with `[1, 2, 3, 4]`, Then `newReplayCode()` returns `00000001000000020000000300000004`. Two real calls return different codes that both pass `isReplayCode`.
- Verification: acceptance `tests/engine/deck.acceptance.test.ts::AC#3 in Node the seed comes from the node crypto module`

### SPEC-04: In the browser the seed comes from crypto.getRandomValues
- Verifies: AC#3, DoD#1
- Behaviour: Given the built app open at `/` in Chromium and in WebKit, an init script that wraps `crypto.getRandomValues` to record each call's array type, length and contents after filling, and `src/engine/deck.ts` bundled in memory by Vite `build()` (`configFile: false`, `write: false`, `lib` IIFE, global name `TlhDeck`) and injected with `page.addScriptTag`, When the page evaluates `TlhDeck.newReplayCode()`, Then exactly one call was recorded, it was a `Uint32Array` of length 4, the returned code equals the hex of the recorded words, and `typeof process === 'undefined'` in the page (a real browser, not Node). When the page evaluates `TlhDeck.shuffledDeck('0123456789abcdeffedcba9876543210')`, Then it equals the §5 rule 5 golden vector for that code. All requests the page made are same-origin (`http://localhost:4173`).
- Verification: acceptance `e2e/replay-seed.spec.ts::browser seed comes from crypto.getRandomValues and decks match Node` (run by `npm run e2e`, both projects)

### SPEC-05: newReplayCode never returns the all-zero code
- Verifies: AC#3
- Behaviour: Given `getRandomValues` mocked to fill zeros on the first call and `[1, 2, 3, 4]` on the second, When `newReplayCode()` runs, Then it returns `00000001000000020000000300000004` and the mock was called twice.
- Verification: unit `tests/engine/deck.test.ts::newReplayCode redraws an all-zero seed`

### SPEC-06: The same replay code always gives the same deck
- Verifies: AC#4
- Behaviour: Given any valid code (fast-check, 1,000 runs) and the three fixed codes of SPEC-01, When `shuffledDeck(code)` is called twice, Then the two arrays are equal element by element and are different array objects (mutating one does not change the next call's result). Given the four golden codes, Then `shuffledDeck(code).map(formatCard).join(' ')` equals the §5 rule 5 strings exactly (pins the order across releases and platforms). Given two codes that differ in one hex digit (`…0001` vs `…0002`), Then the decks differ.
- Verification: acceptance `tests/engine/deck.acceptance.test.ts::AC#4 the same replay code gives the same deck order`

### SPEC-07: Replay code format and round trip
- Verifies: AC#4, DoD#1
- Behaviour: `replayCodeFromWords([0x01234567, 0x89abcdef, 0xfedcba98, 0x76543210])` = `0123456789abcdeffedcba9876543210`; `replayCodeFromWords([0, 0, 0, 1])` = `00000000000000000000000000000001`; `replayCodeFromWords([0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff])` = 32 × `f`. For 1,000 fast-check word tuples, every code has length 32, passes `isReplayCode`, and its 8-char groups parse back to the words. `isReplayCode` is false for `''`, the all-zero code, 31 and 33 hex chars, upper-case `0123456789ABCDEFFEDCBA9876543210`, a code with a space, and `g` in any position; true for the three golden codes.
- Verification: unit `tests/engine/deck.test.ts::replay codes encode four words as 32 lowercase hex characters`

### SPEC-08: Invalid input is rejected
- Verifies: DoD#1
- Behaviour: `replayCodeFromWords` throws `RangeError('Invalid replay code words')` for `[]`, `[1, 2, 3]`, `[1, 2, 3, 4, 5]`, `[0, 0, 0, 0]`, `[-1, 0, 0, 1]`, `[2 ** 32, 0, 0, 1]`, `[1.5, 0, 0, 1]`, `[NaN, 0, 0, 1]`. `shuffledDeck('ABC')` throws `RangeError('Invalid replay code: "ABC"')`; `shuffledDeck` of the all-zero code and of the upper-case code from SPEC-07 also throw `RangeError` with that message pattern.
- Verification: unit `tests/engine/deck.test.ts::invalid words and codes throw RangeError`

### SPEC-09: nextIntUnbiased is in range, exactly uniform by construction, and leaves old outputs unchanged
- Verifies: AC#2, DoD#1
- Behaviour: Given `Xoshiro128.fromState(1, 2, 3, 4)` (raw outputs `11520, 0, 5927040, 70819200, 2031721883, 1637235492`), When `nextIntUnbiased(52)` is called 5 times, Then it returns `0, 0, 0, 24, 19`: the raw output `0` gives l = 0 < t = (2^32 − 52) mod 52 = 48 and is rejected, every other output is accepted as `Math.floor(u * 52 / 2^32)`. Given a generator stubbed (via `fromState` and a subclass or a spy on `nextUint32`) to return `0` then `5`, When `nextIntUnbiased(3)` is called, Then it rejects the first draw (l = 0 < t = 1) and returns `Math.floor(15 / 2^32)` = 0 after exactly two `nextUint32` calls. For n in {1, 2, 52, 1326, 2^31}, 10,000 draws stay in `[0, n)`; for n = 52 all 52 values appear. The existing vectors in the same file still pass unchanged.
- Verification: unit `tests/engine/seeded-random.test.ts::nextIntUnbiased is in range and rejects only the biased zone`

### SPEC-13: mixState128 matches its reference vectors and never yields a zero state
- Verifies: AC#1, AC#4, DoD#1
- Behaviour: Given `mixState128`, Then it returns exactly the five state vectors of §5 rule 4. For 1,000 fast-check tuples of four words not all zero, the result is four integers in `0..4294967295`, not all zero; and for 1,000 pairs of distinct tuples the results differ (bijection spot check). `splitMix32(0)`'s first four outputs are still `2462723854, 1020716019, 454327756, 1275600319`.
- Verification: unit `tests/engine/seeded-random.test.ts::mixState128 matches reference vectors and keeps the state non-zero`

### SPEC-10: Checks, coverage, headless boundary and no network
- Verifies: DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When `npm run lint && npm run typecheck && npm test` runs, Then each exits 0, the coverage output has no `ERROR: Coverage` line, and `src/engine/deck.ts` and `src/engine/seeded-random.ts` each show ≥ 90% lines. The grep below prints nothing: `src/engine/deck.ts` and `src/engine/seeded-random.ts` contain no network API, no dynamic `import(`, no package or Node built-in import (only relative imports), and `seeded-random.ts` contains none of `Math.random`, `Date`, `performance`, `crypto`, `process`.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -nE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]|node:" src/engine/deck.ts src/engine/seeded-random.ts && ! grep -nE "Math\.random|Date|performance|crypto|process" src/engine/seeded-random.ts`

### SPEC-11: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: Given branch `doit/TASK-1.3` is pushed, When its latest CI run completes, Then its conclusion is `success` (this run includes `npm run e2e`, so SPEC-04 passes in Chromium and WebKit on Linux).
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-1.3 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-12: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#6, DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: Given this task, Then: DoD#3 does not apply (golden-spot suite arrives in E07-S14); DoD#6 does not apply (no playtest runner yet, E01-S07); DoD#7 and DoD#12 do not apply (no screen or dialog: `git diff --stat main` shows no change under `src/ui/`, `index.html` or `src/main.tsx`; the new e2e file tests an engine module, not a screen); DoD#9 does not apply (no strategy content). DoD#11: the TASK-1.3 story document is published with `backlog doc` and appears in `backlog doc list --plain`.
- Verification: manual check of `git diff --stat main` and `backlog doc list --plain | grep "TASK-1.3"`

## 7. Edge cases
- Empty / boundary / max: smallest code `…0001` and largest `fff…f` (SPEC-01, SPEC-06, SPEC-07); `nextIntUnbiased(1)` and `n = 2^31` (SPEC-09); i = 1 last swap is covered by every shuffle.
- Invalid input: wrong length, upper case, non-hex, all zeros, bad words (SPEC-07, SPEC-08).
- Duplicates: duplicate cards impossible by construction; checked by SPEC-01.
- Crypto returns all zeros: SPEC-05.
- Rejection path in the unbiased index draw: SPEC-09.
- Low-entropy codes (e.g. `…0001`): scrambled by `mixState128` (SPEC-13; golden vector in SPEC-06).
- Caller mutates the returned deck: fresh array each call (SPEC-06).
- Concurrency / interruption / permissions: N/A — synchronous pure functions plus one synchronous platform call.
- Dependency failure: `globalThis.crypto` absent — N/A on supported platforms (Node ≥ 22.12 per `package.json:7`, all
  target browsers); the platform `TypeError` propagates (§5).

## 8. Security considerations
- Randomness: the seed comes from the platform CSPRNG (`crypto.getRandomValues`), as REQ-013 requires; the shuffle
  generator (xoshiro128**) is not a CSPRNG and does not need to be: a 128-bit unpredictable seed means a hand's deck
  cannot be predicted from earlier hands. Index selection is exactly uniform (D-2). `Math.random` is never used
  (SPEC-03).
- The replay code determines every card. It must not be shown before the hand ends (REQ-013.4, owned by E03); this
  task returns it only to the caller and never logs it.
- Trust boundary: replay codes passed back in (CLI replay, stored records) are validated by `isReplayCode` before use
  (SPEC-08).
- Secrets, authn/authz, injection, sensitive logs: N/A. New dependencies: none.

## 9. Non-functional
- Determinism across platforms: identical decks in Node, Chromium and WebKit (SPEC-04, SPEC-06 golden vectors).
- Speed: one `shuffledDeck` ≈ 51 generator calls; AC#2's 100,000 shuffles plus tabulation should finish in < 3 s
  under coverage on CI (well under `testTimeout` 30 s). Not separately timed.
- Coverage ≥ 90% lines on both engine files (SPEC-10).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e` (runs SPEC-04 in Chromium and WebKit; the module has no user-facing entry point until TASK-1.4/1.6)
- New tests (path → SPEC ids):
  - `tests/engine/deck.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-06 (locked)
  - `e2e/replay-seed.spec.ts` → SPEC-04 (locked)
  - `tests/engine/deck.test.ts` → SPEC-05, SPEC-07, SPEC-08
  - `tests/engine/seeded-random.test.ts` → SPEC-09, SPEC-13
- End-to-end scenario for the Judge (as a developer consuming the engine):
  1. `npm run lint && npm run typecheck && npm test` exits 0; note the two AC#2 chi-square values printed.
  2. `npm run e2e` passes in both projects.
  3. Confirm from the SPEC-06 test output that `shuffledDeck('0123456789abcdeffedcba9876543210')` matches §5 rule 5.
  4. Mutation probes (revert after each): replace `getRandomValues` with `Math.random` (SPEC-03/04 must fail);
     shuffle with `j = nextIntUnbiased(52)` for every i (naive shuffle — SPEC-02 or SPEC-06 golden vectors must fail);
     loop `i` from 51 down to 2 (SPEC-06 must fail); skip `mixState128` (SPEC-06/13 must fail); cache `globalThis.crypto` at module load (SPEC-03 must fail).
  5. Run the SPEC-10 greps and the SPEC-12 checks.

## 11. Open questions
- None. Q-1 and Q-2 answered (see `qa.md`).

## 12. Clarifications log
See `doit/TASK-1.3/qa.md`.
