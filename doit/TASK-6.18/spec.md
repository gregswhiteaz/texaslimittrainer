# Spec: TASK-6.18 — Draw bot randomness only from the replay code and seat

Status: READY (approved 2026-11-21)
Task: TASK-6.18 · Parent/epic: TASK-6 · Requirements: REQ-028, REQ-029 (REQ-025 respected) · Dream: limit-holdem-trainer

## 1. Summary
Every bot decision gets a random generator whose seed is derived on the main thread from the hand's replay code,
the bot's seat and the bot's decision number in the hand. The seed travels to the advice worker as a plain
number on the `bot` request. The replay code never crosses (TASK-3.6 D-6). TAG is still pure, so in this slice
"randomness" means the plumbing for TASK-6.2's mixing (and later style deviations), tests that prove the
generator is reproducible and isolated, and a lint guard that bans other sources of randomness in bot decision
code. Bot requests carry no statistics, so a bot decision can't depend on how the user plays (REQ-029.2).

## 2. Scope
- In scope:
  - New `src/bots/random.ts`: the per-seat generator, the per-decision seed and the bot generator factory.
  - A `seed` field on the `bot` advice request. The seed is computed in `botTurn` and sent by `AdviceClient`. The
    worker validates it and builds the generator.
  - `decideTag` accepts the generator (`random` option) and ignores it. TAG has no mixed strategy yet.
  - A lint guard on `src/bots/**` and `src/advice/**` that bans `Math.random`, `Date`, `crypto` and
    `performance` (Q-2).
  - Tests for AC#1–AC#4, plus unit tests.
- Not doing:
  - Any mixing, style data file or style deviation (TASK-6.2 to TASK-6.5). TAG's actions do not change.
  - Any change to playtest policies or output. `defaultPolicyFactory(6)` still returns `tagPolicy`
    (`tests/playtest/runner.test.ts:205`), and the random-move policy keeps its generator byte-for-byte.
  - Observed opponent statistics (REQ-035.2) and range-basis selection. Neither exists yet.
  - Any change to the deck shuffle, replay code format, UI or user-visible text.
  - Editing, deleting or loosening any locked test.
- Scope budget: files=15, lines=650

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#3 ("observed statistics") is proven with what exists today. The bot request's key set is exactly `id, kind, seed, style, view`, so there's no statistics or basis field. Two tables that differ only in the user's recorded decisions (`TableState.userDecisions`) produce identical bot requests and actions. The worker ignores an extra stats-shaped field. TAG's move equals `recommend(view).move`, which is the default (typical-player) basis. | yes | REQ-035.2 statistics and any basis option don't exist in `src/` (grep finds no "statistic", "observed" or "typical"). This is the strongest proof possible before they exist. | Add a `basis: 'typical'` field now (speculative API) |
| A-2 | TAG stays pure. The `random` option reaches `decideTag` and is not read. The playtest TAG path is unchanged. | yes | TASK-6.2 owns mixing. If the playtest stays unchanged, the 6-max baseline stays byte-identical. | Plumb seeds into the playtest TAG policy now (breaks the `toBe(tagPolicy)` identity unit test with no behaviour gain) |
| A-3 | `AdviceClient.decideBot(view, style, seed = 0)`: the seed parameter is optional on the client with default 0. The wire field is always present. Production (`requestBotDecision`) always passes `turn.seed`. | yes | The locked `tests/ui/advice-worker.acceptance.test.ts:107,123,147,150,154` calls `decideBot(view, 'TAG')` with 2 args. A required parameter would fail typecheck on a locked test. | Make it required and change the locked test (needs the TASK-3.6 owner) |
| A-4 | A `bot` request whose `seed` isn't an integer in 0..4294967295 is answered `ok:false` with `TypeError` `Malformed bot request seed`. Other kinds don't need `seed`. | yes | Matches the existing "shape is checked rather than trusted" style (`src/table/advice-service.ts:47-50`). | Default a missing seed to 0 in the worker |
| A-5 | The "decision point" index k is the number of the seat's earlier non-blind actions in `view.actions`, so it can be derived from the bot's own `PlayerView`. | yes | The derivation is stateless and needs no generator state in React state. The playtest and the table can both compute it the same way. | Keep a stateful per-seat generator in `TableState` |

## 3. Current system
- Seeded generators: `src/engine/seeded-random.ts:4` `fnv1a32`, `:14` `splitMix32`, `:31` `mixState128`, `:44`
  `Xoshiro128` (`constructor(seed)` seeds from splitMix32; `nextUint32`, `nextInt`, `nextIntUnbiased`).
- The deck stream is `src/engine/deck.ts:44-53`: `Xoshiro128.fromState(...mixState128(code words))` followed by
  Fisher–Yates. It's separate from any seat generator.
- A per-seat generator already exists. `src/playtest/policy.ts:6-9` `seatGenerator(code, seat) = new
  Xoshiro128(fnv1a32(`${code}/${seat}`))` is used by the playtest random-move seats (`src/playtest/runner.ts:133`)
  and by many tests imported from `src/playtest/policy` (e.g. `tests/playtest/policy.test.ts:112`,
  `tests/bots/tag.acceptance.test.ts:17`).
- TAG: `src/bots/tag.ts:14` `decideTag(view, options: RecommendOptions = {})` is pure, with no randomness (TASK-3.6
  §3 / D-6, `doit/TASK-3.6/spec.md:111`). `tagPolicy` is at `:24`.
- Worker protocol: `src/table/advice-service.ts:9-22` defines `AdviceRequest`, where `bot` = `{id, kind, view, style}`.
  `:33-35` `AdviceDeps.decideBot(view, style)`. `:37` the default `decideTag(view)`. `:40-71` `handleAdviceRequest`
  validates the shape and never throws.
- Client: `src/ui/advice/advice-client.ts:13-16` Payload, `:62-64` `decideBot(view, style)`, `:91-99` `#request`
  posts `{ id, ...payload }`.
- Main thread: `src/table/session.ts:150` `TableState.replayCode` is set by `dealHand` (`:181-191`). `:236-252`
  `BotTurn {hand, view, style}` and `botTurn`. `:263-266` `stepBot`. `src/ui/table/useTableSession.ts:49-51`
  `requestBotDecision(create, turn)` → `decideBot(turn.view, turn.style)`.
- Lint: `eslint.config.js:9-32` (flat config). `tools/lint/headless-boundary.js:45-73` `headlessBoundaryConfig`
  sets `no-restricted-imports/-globals/-properties/-syntax` for `src/{engine,bots,advice,stats,playtest,table}/**`.
  In flat config a later block that sets the same rule replaces its options for matching files, so a new block must
  re-include the headless entries. The locked `tests/toolchain/boundary.property.test.ts:8-18,69-73` (TASK-1.1,
  TASK-1.40) asserts that `crypto` and `performance` raise no `no-restricted-globals` message in any headless folder.
  The guard therefore must not use `no-restricted-globals`.
- Grep confirms `src/bots` and `src/advice` currently use none of `Math.random`, `Date`, `crypto` or `performance`.
- Tests: Vitest (`vite.config.ts:7`, node environment, coverage thresholds). ESLint-API lint tests use
  `new ESLint({ cwd: REPO_ROOT }).lintText(...)` (`tests/toolchain/boundary.property.test.ts:20-29`). This is fast and
  doesn't use the npm sandbox.
- Existing code to reuse:
  - `src/playtest/policy.ts` `seatGenerator` → move it to `src/bots/random.ts` unchanged and re-export it from
    `src/playtest/policy.ts`, so every existing import still works and the random-move stream stays byte-identical.
  - `src/engine/seeded-random.ts` `Xoshiro128`, `fnv1a32` → the generator and hash. No new PRNG.
  - `tests/support/table-scenarios.ts` (`SCENARIO_CODE`, table builders) and `tests/table/bot-turn.test.ts:21` (`CODE`)
    → fixtures for dealt tables.
  - `src/playtest/runner.ts:142` `handReplayCode` → codes for the AC#2 noise test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Seed derivation (documented hash). Per-seat generator G(code, seat) = `new Xoshiro128(fnv1a32(code + "/" + seat))` (the existing `seatGenerator`). The seed for the seat's decision number k (0-based) is the (k+1)-th `nextUint32()` of a fresh G(code, seat). k = count of `view.actions` with `seat === view.seat` and type not `small-blind`/`big-blind`. The worker builds the bot generator as `new Xoshiro128(seed)`. | (b) seed = `fnv1a32(`${code}/${seat}/${k}`)`; (c) `mixState128` over the code words with a seat salt | It reuses an already documented, tested generator. It's independent of the deck stream (FNV string hash plus splitMix vs `mixState128` state; separate objects). It's a function of (code, seat, k) only, and stateless. (c) is unsafe because playtest codes differ only in word 3 (`runner.ts:152`), so a salted word 3 could equal another hand's deck state. | yes | user (Q-1, auto-accepted) |
| D-2 | Lint guard. A new `botDeterminismConfig` (in `tools/lint/headless-boundary.js`, registered in `eslint.config.js` after `headlessBoundaryConfig`) applies to `src/bots/**` and `src/advice/**`. It bans `Math.random`, any member of `Date`, `crypto` and `performance` (also via `globalThis.`), and `new Date(...)` / `Date(...)`. It uses `no-restricted-properties` and `no-restricted-syntax` (with the headless entries re-included) and not `no-restricted-globals`. | src/bots only; no guard; `no-restricted-globals` (breaks a locked test) | It's cheap (about 40 lines), it statically backs REQ-028.1's "only source", and advice is on every bot decision path (`decideTag` → `recommend`). | yes | user (Q-2, auto-accepted) |
| D-3 | `seed` is a required field on the `bot` wire request. `BotTurn` gains `seed: number`. The client parameter is optional (A-3). | Optional wire field | AC#4 asks for "a numeric field on the bot request". | no | n/a |
| D-4 | `decideBot` dependency signature becomes `(view, style, random: Xoshiro128) => Action`. The default calls `decideTag(view, { random })`. | Pass the raw seed to bots | Bots receive a generator and never a seed or code. Existing 2-arg test doubles still type-check. | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/random.ts` — new: `seatGenerator`, `botDecisionIndex`, `botDecisionSeed`, `botRandom`.
- `src/playtest/policy.ts` — remove the local `seatGenerator` body and `export { seatGenerator } from '../bots/random'`.
- `src/bots/tag.ts` — `TagOptions = RecommendOptions & { readonly random?: Xoshiro128 }`. `decideTag(view, options:
  TagOptions = {})`, with a doc comment saying `random` is reserved for TASK-6.2 mixing and TAG is pure.
- `src/table/advice-service.ts` — `seed` on the bot request, validation, `decideBot(view, style, botRandom(seed))`.
- `src/table/session.ts` — `BotTurn.seed`, computed in `botTurn`.
- `src/ui/advice/advice-client.ts` — `decideBot(view, style, seed = 0)`, with `seed` in the bot payload.
- `src/ui/table/useTableSession.ts` — `requestBotDecision` passes `turn.seed`.
- `tools/lint/headless-boundary.js` — export `BOT_DETERMINISM_FILES` and `botDeterminismConfig`.
- `eslint.config.js` — register `botDeterminismConfig` after `headlessBoundaryConfig`.
- `tests/bots/bot-random.acceptance.test.ts` — new (AC#1, AC#2, AC#3).
- `tests/table/bot-seed.acceptance.test.ts` — new (AC#4, AC#3 request side).
- `tests/bots/random.test.ts` — new unit (index, worked example, validation).
- `tests/toolchain/bot-determinism.test.ts` — new unit (lint guard via the ESLint API).
- `tests/table/bot-turn.test.ts` — modify (not locked): `:97` passes `turn.seed`. `:98-99` expects keys
  `['id','kind','seed','style','view']` and `seed: turn.seed` (tightened, not loosened). Also adds a case where a bot
  step with `replayCode: null` throws `RangeError('Not a bot turn')`.
- `tests/table/advice-service.test.ts` — modify (not locked): add `seed: 0` to its `bot` requests (`:30,67,79`) and
  add malformed-seed cases.

### Components, interfaces and data
`src/bots/random.ts` (headless; imports only `../engine/*`):
```ts
export function seatGenerator(code: ReplayCode, seat: SeatNumber): Xoshiro128; // unchanged body
/** Seat's earlier non-blind actions in view.actions (0 for its first decision). */
export function botDecisionIndex(view: PlayerView): number;
/** The (botDecisionIndex(view)+1)-th nextUint32 of seatGenerator(code, view.seat). Unsigned 32-bit. Pure. */
export function botDecisionSeed(code: ReplayCode, view: PlayerView): number;
/** new Xoshiro128(seed). RangeError `Bot seed must be an integer from 0 to 4294967295, got <seed>` otherwise. */
export function botRandom(seed: number): Xoshiro128;
```
- `AdviceRequest` bot member: `{ id: number; kind: 'bot'; view: PlayerView; style: BotStyle; seed: number }`. The
  replay code and the hand's deck are never fields.
- `BotTurn`: `{ hand; view; style; seed }`. The doc comment changes to "Only `view`, `style` and `seed` go to the
  advice worker". `botTurn` sets `seed = botDecisionSeed(table.replayCode, view)`. If `table.replayCode === null` on
  a bot step it throws `RangeError('Not a bot turn')` (cannot happen through `dealHand`).
- `AdviceDeps.decideBot?: (view: PlayerView, style: BotStyle, random: Xoshiro128) => Action`. The default is
  `(view, _style, random) => decideTag(view, { random })`. The `_style` parameter sits before the used `random`, so
  `no-unused-vars` (`args: after-used`) accepts it.

### Rules and algorithms
- Seed (D-1), worked example. Code `9e3779b9000000010000000200000003` (`replayCodeFromWords([0x9e3779b9,1,2,3])`):
  - seat 3, k=0 → `1927253632`; seat 3, k=1 → `3219888363`; seat 1, k=0 → `1024787557`; seat 2, k=0 → `2122845982`.
  - These are the first outputs of `seatGenerator(code, seat)` (values computed from the current code).
- Index: preflop, the first decision of a seat that posted the big blind has k=0 (blinds don't count). After that
  seat has called once preflop, its flop decision has k=1.
- Worker: for `kind === 'bot'`, if `typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed >
  4294967295`, then throw `TypeError('Malformed bot request seed')`, which becomes `ok:false` with `id` set.
- Lint guard (D-2) for files `src/bots/**`, `src/advice/**`:
  - `no-restricted-properties`: the headless `globalThis.<browser global>` entries, plus `{object:'Math',
    property:'random'}`, `{object:'Date'}`, `{object:'crypto'}`, `{object:'performance'}`, and `{object:'globalThis',
    property:'Date'|'crypto'|'performance'}`.
  - `no-restricted-syntax`: the headless entries, plus `NewExpression[callee.name='Date']` and
    `CallExpression[callee.name='Date']`.
  - Every added message contains `Non-deterministic source in bot decision code; use the seeded bot generator
    (REQ-028.1).`

### Error handling and configuration
- `botRandom` throws `RangeError` (message above). The worker maps a bad seed to `TypeError('Malformed bot request
  seed')` inside the existing try/catch. No new configuration.

## 6. Behaviour specification

### SPEC-01: Same replay code, seat and decision point give the same TAG action
- Verifies: AC#1, DoD#1
- Behaviour: Given 200 bot decision points from `playHand(handReplayCode(18, n), 6, 6)` hands, at each point both
  `botDecisionSeed(code, view)` and `decideTag(view, { random: botRandom(seed) })` are computed twice with fresh
  generators. Then the seeds are equal and the actions are equal. Also, through the worker path,
  `handleAdviceRequest({id, kind:'bot', view, style:'TAG', seed})` called twice returns the same `ok:true` action.
- Verification: acceptance `tests/bots/bot-random.acceptance.test.ts::same code seat and decision point give the same TAG action`

### SPEC-02: A different seat gives a different random sequence
- Verifies: AC#1
- Behaviour: Given replay code `9e3779b9000000010000000200000003` and seats 1..10, When `seatGenerator(code, seat)` is
  created for each and 8 `nextUint32()` values are drawn, Then the 10 sequences are pairwise different. Seat 1's first
  value is `1024787557` and seat 2's is `2122845982`. A fast-check property (200 runs, fixed seed) over valid codes and
  two distinct seats from 1..10 holds the same: the first 4 outputs differ.
- Verification: acceptance `tests/bots/bot-random.acceptance.test.ts::a different seat gives a different random sequence`

### SPEC-03: Wall-clock time and other random draws do not change the seed or action
- Verifies: AC#2
- Behaviour: Given a fixed TAG decision point (code, view), When run A computes the seed and action at fake system time
  2026-01-01T00:00:00Z with `Math.random` stubbed to 0.1, And run B does so at 2031-06-15T12:34:56Z with `Math.random`
  stubbed to 0.9, `performance.now` stubbed to a different value, after `shuffledDeck` for 3 other codes and 37
  `nextUint32()` draws from each other seat's `seatGenerator`, Then both runs give the same seed and the same
  action. The `Math.random` stub is never called during either computation (call count 0).
- Verification: acceptance `tests/bots/bot-random.acceptance.test.ts::time and other draws do not change the bot decision`

### SPEC-04: Bot decisions ignore the user's observed play
- Verifies: AC#3
- Behaviour: Given a dealt table at a bot turn, and the same table with a non-empty `userDecisions` list (A-1), When
  `botTurn` runs on each, Then `{view, style, seed}` are deep-equal. `decideTag(view, {random})` equals
  `recommend(view).move` (the typical-player basis) for both. A worker `bot` request with an extra field
  `opponentStats: { 1: { vpip: 99, pfr: 99, hands: 500 } }` returns the same action as the request without it.
- Verification: acceptance `tests/bots/bot-random.acceptance.test.ts::observed statistics never reach a bot decision`

### SPEC-05: The seed is derived on the main thread and only the number crosses to the worker
- Verifies: AC#4, AC#3
- Behaviour: Given `dealHand(seatSession(), code)` at a bot turn, When `botTurn` runs and `requestBotDecision(create,
  turn)` posts through a fake worker, Then:
  - `turn.seed === botDecisionSeed(code, turn.view)` and is an integer in 0..4294967295.
  - The single posted message has keys exactly `['id','kind','seed','style','view']`, with `kind:'bot'` and
    `seed === turn.seed`.
  - `JSON.stringify(posted)` contains neither the replay code nor any of its four 8-hex-digit words.
  - After the user and bots act, a later decision by the same seat in the same hand posts the seed for k+1.
- Verification: acceptance `tests/table/bot-seed.acceptance.test.ts::the bot seed is derived on the main thread and the replay code never crosses`

### SPEC-06: Decision index and seed worked example
- Verifies: AC#1, AC#4
- Behaviour: Given code `9e3779b9000000010000000200000003`, Then `botDecisionSeed` is `1927253632` for seat 3 at k=0
  and `3219888363` at k=1. `botDecisionIndex` ignores blinds and other seats' actions.
- Verification: unit `tests/bots/random.test.ts::decision index and seed worked example`

### SPEC-07: Malformed seeds are rejected
- Verifies: AC#4
- Behaviour: Given `botRandom(x)` for x in `-1, 1.5, 4294967296, NaN`, Then it throws `RangeError`. Given a worker
  `bot` request with `seed` missing, `'7'`, `-1`, `1.5` or `2**32`, Then the response is `{id, ok:false, error:{name:
  'TypeError', message:'Malformed bot request seed'}}`. Seeds `0` and `4294967295` are accepted.
- Verification: unit `tests/table/advice-service.test.ts::bot requests need a 32-bit integer seed`

### SPEC-08: Lint bans non-seeded randomness and time in bot decision code
- Verifies: AC#2, DoD#2, DoD#5
- Behaviour: Given probe files `src/bots/probe.ts` and `src/advice/probe.ts` linted with the repo ESLint config, each
  containing one of `Math.random()`, `Date.now()`, `new Date()`, `crypto.getRandomValues(a)`, `performance.now()`, or
  `globalThis.crypto`, Then each gives an error whose message contains `Non-deterministic source in bot decision
  code` and `REQ-028.1`. The same probes in `src/engine/probe.ts` give no such message. A browser global such as
  `globalThis.document` in `src/bots/probe.ts` is still reported (the headless entries are kept).
- Verification: unit `tests/toolchain/bot-determinism.test.ts::bot decision code may not use unseeded randomness or time`

### SPEC-09: Existing behaviour unchanged (worker equals headless, playtest byte-identical)
- Verifies: DoD#6, DoD#3, DoD#2
- Behaviour: Given the change, When the suites run, Then the locked `tests/ui/advice-worker.acceptance.test.ts`
  (worker == headless, 50 hands) and `tests/bots/tag-playtest.acceptance.test.ts` pass unchanged. `npm run playtest
  -- --hands 10000 --seed 42 --size 6` reports `Invariant violations: 0`, `Player actions: 88746`, `Ended by fold:
  5461`, and its full stdout SHA-256 is `a15b837584e3b0630a6f29fd532df0f78327b3b4507d8c79ed988c60fb8c4dc7` (equal to
  base `c2a0f3b`). DoD#3 is not applicable: the golden-spot suite (E07-S14) doesn't exist yet.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-10: Checks, coverage, boundaries and documentation
- Verifies: DoD#2, DoD#4, DoD#5, DoD#7, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` (coverage thresholds ≥90% for
  engine/bots/advice, ≥70% overall) pass with zero errors. `src/bots/random.ts` imports only `../engine/*`. CI is
  green on `doit/TASK-6.18`. A story doc records D-1 (the seed formula and worked example), D-2 (the lint guard) and
  the TASK-6.2 hook, and is published with `backlog doc`. Not applicable: DoD#7 and DoD#12 (no screen), DoD#8 (no
  network code), DoD#9 (no strategy content).
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- First decision of a seat that posted a blind: k=0 (SPEC-06).
- Several decisions by the same seat in one hand: k increments, so the seeds differ (SPEC-05, SPEC-06).
- Seeds at the 0 and 2^32−1 boundaries are accepted. Out-of-range or non-integer seeds are rejected (SPEC-07).
- Seed field missing on the wire (old client or a test double): rejected (SPEC-07). The client defaults to 0 (A-3).
- Bot turn with `replayCode === null`: `RangeError('Not a bot turn')`. This can't happen via `dealHand` and is
  covered in `tests/table/bot-turn.test.ts`.
- Stale replies and concurrency: unchanged. The staleness token is still `turn.hand`.
- Duplicate seeds across seats or hands: possible (32-bit), harmless, and not a correctness property.
- Interruption, permissions, dependency failure: N/A. The change is pure computation.

## 8. Security considerations
- Trust boundary: worker messages are already shape-checked. The new `seed` is validated (SPEC-07).
- Hidden information (REQ-025.1): the replay code determines the whole deck. It stays on the main thread, and only a
  32-bit derived number crosses (SPEC-05). The seed alone can't recover the deck in practice (FNV plus splitMix is
  not invertible to a 128-bit code), and the worker already sees nothing but the bot's own view.
- Randomness: the seeded PRNG is deliberately non-cryptographic. Fairness here means reproducibility and
  independence from the user, not unpredictability. Replay codes still come from `crypto.getRandomValues`
  (`src/engine/deck.ts:15-21`). The lint guard stops accidental unseeded sources (D-2).
- New dependencies: none. Secrets, authn, injection, logs: N/A.

## 9. Non-functional
- Per-decision seed cost: at most about 20 `nextUint32` calls (k ≤ the seat's actions in a hand). That's negligible
  next to the advice computation. There's no timing assertion (speed checks stay opt-in).
- Determinism: the 10,000-hand playtest is byte-identical to base (SPEC-09).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --size 6` (headless). For the app: `npm run dev`, start a
  game, and watch the bots act (behaviour unchanged).
- New tests:
  - `tests/bots/bot-random.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `tests/table/bot-seed.acceptance.test.ts` → SPEC-05
  - `tests/bots/random.test.ts` → SPEC-06
  - `tests/table/advice-service.test.ts` (added case) → SPEC-07
  - `tests/toolchain/bot-determinism.test.ts` → SPEC-08
- Judge end-to-end:
  1. Run the playtest SHA command (SPEC-09) and compare it with the hash above.
  2. Run the acceptance tests.
  3. Add `Math.random()` to `src/bots/tag.ts` locally, confirm `npm run lint` fails with the REQ-028.1 message, then
     revert.

## 11. Open questions
- None. Q-1 (D-1 seed derivation) and Q-2 (D-2 lint guard over src/bots and src/advice) were
  auto-accepted with the recommended options; see `doit/TASK-6.18/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.18/qa.md`.
