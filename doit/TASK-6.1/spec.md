# Spec: TASK-6.1 — Face TAG bots that act from the advice engine

Status: READY (approved 2026-11-18 by user via Q-1/Q-2)
Task: TASK-6.1 · Parent/epic: TASK-6 (Face distinct opponents) · Requirements: REQ-025.1, REQ-026.1, REQ-056.1 (mixing REQ-028 is TASK-6.2/6.18; style bands REQ-027 are TASK-6.16; latency REQ-055.3 is TASK-6.13) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the first bot: a TAG decision function in `src/bots/tag.ts` that takes only a `PlayerView`, asks the
advice engine `recommend(view)` (6-max preflop chart, postflop equity vs pot odds) and returns the recommendation's
`move`, which is always a legal action. The headless playtest then seats a TAG bot in every seat of a 6-player
table by default, so `npm run playtest -- --hands 10000 --seed 42` is a TAG-vs-TAG run with zero invariant
violations. In this slice TAG always plays the main recommendation (no mixing, no style file).

## 2. Scope
- In scope:
  - `src/bots/tag.ts`: `decideTag(view, options?)` and `tagPolicy: SeatPolicy`.
  - `src/playtest/runner.ts`: a size-aware default seat-policy factory; TAG in every seat at 6 players.
  - Two one-line-scale fixes so `npm run playtest` (Node type stripping, `tools/playtest/resolve-ts.js:1-3`) can
    load the advice engine at all: `src/advice/equity.ts:166` uses a TypeScript parameter property (rejected by
    Node strip-only mode with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`, reproduced), and `src/advice/preflop.ts:3`
    imports JSON without an import attribute (Node ESM requires `with { type: 'json' }`).
  - Acceptance and unit tests under `tests/bots/`, plus one unit case in `tests/playtest/runner.test.ts`.
- Not doing:
  - Mixing between recommendation and alternative, style data files, `StyleParams` (TASK-6.2, REQ-028.3).
  - A per-seat random generator for bots or any bot randomness (TASK-6.18, REQ-028.1). TAG is deterministic here,
    so replay trivially reproduces its actions; full replay proof is TASK-6.15.
  - Other styles (TASK-6.3–6.5), line-up presets or a `--lineup`/`--bots` CLI option (TASK-6.6, TASK-6.9).
  - Preflop advice for table sizes other than 6 (TASK-7.6). The playtest keeps random-move seats there (D-3, Q-1).
  - Any change to the advice rules, the chart, or the postflop rules document; bet/raise postflop (TASK-7.8).
  - Measuring VPIP/PFR/aggression (TASK-6.11, TASK-6.16) and the 100 ms timing test (TASK-6.13).
  - Seating TAG bots on the Table screen (TASK-3.1 owns the browser table; no UI change here).
  - The lint rule for the `src/bots` → engine boundary (TASK-6.21); this task only follows it.
  - Any change to the playtest report text, options or usage message.
- Scope budget: files=8, lines=600   (incl. tests)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The bot lives in `src/bots/tag.ts` as `decideTag(view: PlayerView, options?: RecommendOptions): Action` plus `tagPolicy: SeatPolicy = (view) => decideTag(view)`. Tests in `tests/bots/`. | yes | Task note suggests `src/bots`; `SeatPolicy` (`src/engine/player-view.ts:59`) is the existing decision-function type the runner consumes. `options` is the same test seam `recommend` already has. | `decide(view, style, rng)` now with unused params |
| A-2 | No `style` or `rng` parameter in this slice. | yes | Story: "In this slice TAG always plays the main recommendation"; TASK-6.2 adds style files, TASK-6.18 the generator. Unused params would fail `noUnusedParameters` (`tsconfig.json:13`). | Add them now as `_style`, `_rng` |
| A-3 | The runner exports `defaultPolicyFactory(size: number): PolicyFactory`; `playHand` uses it when `seams.makePolicy` is absent. `seams.makePolicy` still overrides at every size. | yes | Keeps the existing seam (`src/playtest/runner.ts:43-50`) and makes the default testable. | Decide inside each policy call from `view.players.length` |
| A-4 | The two Node strip-only blockers are fixed in the source (explicit `readonly c` field assigned in the constructor; `with { type: 'json' }` on the chart import), not by extending the resolve hook. | yes | Smallest, standard change; verified in a scratch copy that `tsc -p tsconfig.json` and the advice tests still pass, and that the CLI then runs. | Add a `load`/`importAttributes` hook to `tools/playtest/resolve-ts.js` |
| A-5 | `tagPolicy` is stateless and shared by all seats and hands; it ignores `earlierShowdowns`. | yes | Advice reads no history beyond the view's actions. | One policy object per seat |
| A-6 | "Every seat is a TAG bot" (AC#5) is proven by tests, not by new report text: every applied action of the default run equals `decideTag` of the acting seat's view, and the CLI output is byte-identical to an in-process run with an explicit TAG seam. | yes | The report format is pinned by locked tests (see §3). | Add a "Bots:" report line (needs unlocking TASK-1.6/1.8 tests) |
| A-7 | The runner's doc comments that say the default is `randomMovePolicy` (`src/playtest/runner.ts:34,44`) are updated to describe the size-aware default. | yes | Comments must match behaviour. | — |

## 3. Current system
- Language/tooling: TypeScript 6 strict, Vitest 5 with v8 coverage (`package.json` `test`: `vitest run --coverage`),
  ESLint + Prettier (`npm run lint`), `tsc` (`npm run typecheck`). Coverage thresholds: 70% overall, 90% for
  `src/{engine,bots,advice,stats}/**` (`vite.config.ts:16`).
- Headless boundary: `bots` is already in `HEADLESS_DIRS` (`tools/lint/headless-boundary.js:6`), so React/DOM/IndexedDB/`src/ui`
  imports and dynamic `import()` are lint errors in `src/bots`.
- Advice entry point: `recommend(view, options)` dispatches by street (`src/advice/recommend.ts:10-14`). Both
  branches return a legal `move` taken from `view.legalActions` (`src/advice/preflop.ts:100-112`,
  `src/advice/postflop.ts:104-111`) and throw `RangeError` when the seat is not to act (`preflop.ts:83`,
  `postflop.ts:65`) and preflop when not exactly 6 seats are dealt in (`preflop.ts:49-53`).
- Postflop advice never recommends bet or raise (`postflop.ts:6`). Consequence, measured: in an all-TAG table nobody
  bets after the flop, so every postflop TAG decision is a free check (`check-free`, `postflop.ts:93-95`), yet
  `recommendPostflop` still runs `computeEquity` first (`postflop.ts:83-87`, locked by
  `tests/advice/postflop.acceptance.test.ts:208-219`, which asserts equity on a free check).
- Measured on this machine (scratch copy, CLI through Node): all-TAG 1,000 hands at 6 players = 9.4 s, so 10,000
  hands ≈ 94 s (postflop equity is ~4 ms per decision, nearly all the time). With equity skipped on free checks
  (D-2), 10,000 hands = 0.55 s, zero violations.
- Playtest: `playHand` builds one policy per seat from `makePolicy` (`src/playtest/runner.ts:122,130`), default
  `randomMovePolicy(seatGenerator(code, seat))` (`runner.ts:95`); every applied action is checked by `checkStep`,
  including legal-action (`runner.ts:138`). The CLI passes no seams (`tools/playtest/main.ts:5`).
- Locked tests that run the default policy and constrain this task:
  - `tests/playtest/playtest.acceptance.test.ts:66` — spawned 10,000-hand run with a 60 s timeout; `:85-97` —
    two spawned 10,000-hand runs plus two 2,000-hand `--size 9` runs in one 120 s test. Without D-2 these fail.
  - `tests/playtest/runner.acceptance.test.ts:102-115` and `tests/playtest/invariants.acceptance.test.ts:99` —
    in-process 10,000-hand default runs (120 s, under coverage).
  - `tests/playtest/runner.acceptance.test.ts:42-72`, `invariants.acceptance.test.ts:63-94`,
    `playtest.acceptance.test.ts:88,99` — default runs at sizes 3–10, where the preflop chart throws.
  - Report format: `playtest.acceptance.test.ts:70-79` (exact Table line, label order) and
    `invariants.acceptance.test.ts:42-54,151-156` (every line between the header and "Invariant violations" must
    start with a known label). No report line can be added without unlocking these.
  - Verified in a scratch copy: with the D-2 shortcut and D-3 default, all 23 tests in `tests/playtest` pass in 3.6 s.
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/advice/recommend.ts` → `recommend`, `RecommendOptions`, `Recommendation` (the only strategy source).
  - `src/advice/equity.ts` → `EquityInput`, `EquityResult`, `PlayerEquity` types for the free-check stand-in.
  - `src/engine/player-view.ts` → `PlayerView`, `SeatPolicy`, `playerView` (tests), `actWith` (tests).
  - `src/playtest/runner.ts` → `runPlaytest`, `playHand`, `PlaytestSeams.makePolicy`/`onAction`, `checkStep` composition.
  - `src/playtest/policy.ts` → `randomMovePolicy`, `seatGenerator` (non-6 default; test opponents that bet and raise).
  - `src/advice/preflop.ts` → `recommendPreflop`, `positionOf`, `situationOf`, `SIX_MAX_CHART`; `src/advice/preflop-chart.ts` → `chartCell`; `src/advice/hand-class.ts` → `handClassOf` (AC#1 oracle).
  - `src/engine/cards.ts` → `parseCard`/`parseCards` for scripted decks; `src/engine/hand.ts` → `createHand`, `applyAction` (tests only).
  - `tests/support/sandbox.ts` → `REPO_ROOT`, `sandboxEnv` for spawning `npm run playtest`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | TAG returns `recommend(view, …).move` unchanged on every street; no mixing, no randomness. | Mix with `alternative` now | Story text and REQ-026.1; mixing is TASK-6.2. | no | n/a (story) |
| D-2 | On a postflop decision with nothing owed, TAG calls `recommend(view, { ...options, equity: FREE_CHECK_EQUITY })`, where `FREE_CHECK_EQUITY` returns zero equity without dealing; the `check-free` rule fires before equity is read, so the move is identical and the ~4 ms equity run is skipped. Approved in `doit/TASK-6.1/qa.md` Q-2. | Keep full equity and raise the locked TASK-1.6/1.8 timeouts (~94 s per 10,000-hand run); change the advice API (conflicts with locked TASK-7.3 test); wait for TASK-7.18 | Measured 94 s → 0.55 s per 10,000 hands; locked tests stay untouched. | yes | user (Q-2) |
| D-3 | Playtest default seats: TAG in every seat when the table has 6 players; the existing seeded random-move policy at every other size until TASK-7.6 gives TAG a chart for that size. Nothing in the report changes. Approved in `doit/TASK-6.1/qa.md` Q-1: sizes 3–5 and 7–10 keep today's random-move seats with unchanged output. | Reject other sizes; interim mapping | Rejecting breaks locked tests at sizes 3–10; a mapping is TASK-7.6's work. | yes | user (Q-1) |
| D-4 | No new CLI option. AC#5 makes TAG the default at 6 players; choosing bots per seat is TASK-6.6/6.9 (`--lineup`). | `--bots tag|random` flag | Smallest change; avoids pre-empting TASK-6.9's interface. | no | n/a (AC#5) |
| D-5 | `src/bots/tag.ts` imports from `src/engine` only with `import type`, and only `PlayerView`, `SeatPolicy`, `PublicPlayer` (player-view) and `Action` (hand). Its runtime import is `src/advice/recommend`. | Import engine helpers | Matches TASK-6.21's planned lint rule (only types from engine). | no | n/a |

## 5. Design

### Files to create / modify
- `src/bots/tag.ts` — new: `FREE_CHECK_EQUITY`, `decideTag`, `tagPolicy`.
- `src/playtest/runner.ts` — modify: import `tagPolicy`; add exported `defaultPolicyFactory(size)`; `playHand` defaults `makePolicy` to `defaultPolicyFactory(size)`; update doc comments.
- `src/advice/equity.ts` — modify: replace the parameter property at line 166 with a declared `readonly c: CanonicalInput` field assigned in the constructor (no behaviour change).
- `src/advice/preflop.ts` — modify: line 3 becomes `import sixMax from './charts/six-max.json' with { type: 'json' };`.
- `tests/bots/tag.acceptance.test.ts` — new: SPEC-01 to SPEC-04 (locked).
- `tests/bots/tag-playtest.acceptance.test.ts` — new: SPEC-05, SPEC-06 (locked; uses `vi.mock` on the recommend module).
- `tests/bots/tag.test.ts` — new: SPEC-07, SPEC-08, SPEC-09.
- `tests/playtest/runner.test.ts` — modify: SPEC-10 (default factory by size).

### Components, interfaces and data
```ts
// src/bots/tag.ts
import type { Action } from '../engine/hand';
import type { PlayerView, PublicPlayer, SeatPolicy } from '../engine/player-view';
import type { EquityInput, EquityResult } from '../advice/equity';
import { recommend, type RecommendOptions } from '../advice/recommend';

/** Equity stand-in for postflop decisions with nothing owed (D-2): rule check-free fires before equity is read. */
export function FREE_CHECK_EQUITY(input: EquityInput): EquityResult;
// → { hero: {win:0,tie:0,equity:0}, opponents: input.opponents.map(() => same), method: 'exact', trials: 0 }

/** The TAG decision: the advice engine's recommended move for `view`. Errors from recommend propagate. */
export function decideTag(view: PlayerView, options: RecommendOptions = {}): Action;

/** decideTag as a seat policy (no options). */
export const tagPolicy: SeatPolicy;

// src/playtest/runner.ts
/** TAG in every seat at 6 players; randomMovePolicy(seatGenerator(code, seat)) at other sizes (D-3). */
export function defaultPolicyFactory(size: number): PolicyFactory;
```
- Invariant: `decideTag(view, o)` deep-equals `recommend(view, o).move` for every view the advice accepts, with the
  sole exception that the equity used on a postflop free check is the stand-in (the move is still identical).
- `decideTag` never reads anything but its `view` and `options`; no module state, no clock, no randomness.

### Rules and algorithms
1. `hero = view.players.find((p) => p.seat === view.seat)`.
2. If `view.street` is `flop`, `turn` or `river`, `hero !== undefined` and `view.currentBet - hero.streetContribution === 0`
   (the same formula as `postflop.ts:67-68`), return `recommend(view, { ...options, equity: FREE_CHECK_EQUITY }).move`.
3. Otherwise return `recommend(view, options).move`.
- Examples (6 seats, button 1, $4/$8):
  - Seat 4 (UTG) first to act preflop with A♠A♥ → chart cell UTG/unopened/AA = `R` → `{ seat: 4, type: 'raise', amount: 8 }`.
  - Seat 4 (UTG) first to act with 7♣2♦ → cell `F` → `{ seat: 4, type: 'fold' }`.
  - Seat 3 (BB) after limps with 7♣2♦ → cell BB/limpers/72o = `C`, nothing owed → `{ seat: 3, type: 'check' }`.
  - Flop, seat 2 bets $4 into $16, hero owes $4 → required 16.7%; equity ≥ 16.7% → `call` $4, else `fold`.
  - Flop, nobody has bet → `{ type: 'check' }` without an equity run.
- Playtest default: `playHand(code, size, button, n, seams)` uses `seams.makePolicy ?? defaultPolicyFactory(size)`.
  `defaultPolicyFactory(6)` returns `() => tagPolicy`; any other size returns
  `(code, seat) => randomMovePolicy(seatGenerator(code, seat))` (the current default, unchanged output at those sizes).

### Error handling and configuration
- `decideTag` adds no errors of its own. It propagates `recommend`'s: `RangeError('Seat <n> is not to act')` when
  `view.toAct !== view.seat`; `RangeError('The 6-max chart needs 6 dealt-in seats, got <k>')` preflop at other sizes;
  `Error('No legal <action> for seat <n>')` if the needed legal action is missing.
- In the playtest a thrown error would abort the run; D-3 guarantees TAG only sits at 6-player tables there.
- No configuration, no environment variables.

## 6. Behaviour specification

### SPEC-01: Preflop TAG plays the 6-max chart move
- Verifies: AC#1
- Behaviour: Given a 6-player preflop view where the TAG seat is to act, When `decideTag(view)` runs, Then it returns the element of `view.legalActions` whose type is the chart cell for `(positionOf(view), situationOf(view), handClassOf(view.holeCards))` after the legality rule (capped raise → call; nothing owed → check), deep-equal to `recommendPreflop(view).move`. Concrete: UTG unopened AA → raise to $8; UTG unopened 72o → fold; BB facing limpers 72o → check; a capped fourth bet with AA in the re-raise spot → call. Property: every preflop decision reached in 200 hands (seed 61) where the other seats play `randomMovePolicy` (so unopened, limpers, raise, raise-and-calls, re-raise and blind-defence all occur) satisfies the equality, and the test asserts each of the six situations was seen.
- Verification: acceptance `tests/bots/tag.acceptance.test.ts::AC#1 preflop TAG plays the 6-max chart move`

### SPEC-02: Postflop facing a bet, TAG calls or folds as advised
- Verifies: AC#2
- Behaviour: Given a flop/turn/river view where the TAG seat owes chips, When `decideTag(view)` runs, Then it returns `recommend(view).move` (computed with real equity): `call` with the exact call amount when the advice is call, `fold` when it is fold. Concrete scripted spots: flop, seat 2 bets $4 into $16 and the hero holds top set → `{ type: 'call', amount: 4 }`; a river bet into three live opponents where the hero holds 7-high with no pair → `{ type: 'fold' }` (the builder confirms with real `recommend` that each scripted spot yields that advice before locking it). Property: across facing-bet postflop decisions reached in 60 hands (seed 62) with random-move opponents, the equality holds and at least one call and one fold occur.
- Verification: acceptance `tests/bots/tag.acceptance.test.ts::AC#2 postflop facing a bet TAG calls or folds as advised`

### SPEC-03: Postflop with nothing owed, TAG checks
- Verifies: AC#3
- Behaviour: Given a flop/turn/river view where the TAG seat owes nothing, When `decideTag(view)` runs, Then it returns `{ seat, type: 'check' }` and that equals `recommend(view).move` computed with real equity (so the D-2 stand-in never changes the move). Checked on a scripted flop, turn and river spot and on every free postflop decision in 60 hands (seed 63) with random-move opponents.
- Verification: acceptance `tests/bots/tag.acceptance.test.ts::AC#3 postflop with no bet to face TAG checks`

### SPEC-04: Hidden cards never change TAG's action
- Verifies: AC#4
- Behaviour: Given a fixed decision point (scripted actions from a fixed deck) at preflop, on a free flop and facing a flop bet, When the decks are re-built so that every other seat's hole cards and every undealt card are permuted (fast-check, 30 permutations per spot) while the TAG seat's cards and the board up to that street stay fixed, Then `decideTag` returns a deep-equal action each time. Also: `decideTag` accepts only `PlayerView` — a `@ts-expect-error` line passing a `HandState` is part of the file, so typecheck fails if the parameter type ever widens.
- Verification: acceptance `tests/bots/tag.acceptance.test.ts::AC#4 other players' and undealt cards never change TAG's action`

### SPEC-05: The default 10,000-hand playtest is all TAG, legal and clean
- Verifies: AC#5, DoD#6
- Behaviour: Given `npm run playtest -- --hands 10000 --seed 42` (spawned, 60 s timeout), When it runs, Then it exits 0, prints `Hands played: 10000` and `Invariant violations: 0`, and its stdout (minus npm's header) is byte-identical to `main(['--hands','10000','--seed','42'], io, { makePolicy: () => tagPolicy })` run in process — proving the CLI's seats are TAG. In process, a default `runPlaytest({ hands: 10000, seed: 42, size: 6 })` with `onAction` composed with `checkStep` asserts for every step that the applied action is an element of `playerView(before, before.toAct).legalActions` and deep-equals `decideTag(playerView(before, before.toAct))`; zero mismatches, zero violations.
- Verification: acceptance `tests/bots/tag-playtest.acceptance.test.ts::AC#5 the default 10,000-hand playtest is all TAG, legal and clean`

### SPEC-06: Every playtest TAG decision goes through recommend on every street
- Verifies: AC#6
- Behaviour: Given the recommend module wrapped by `vi.mock` (calls the real `recommend`, records each `(view, result)`), When a default 6-player `runPlaytest({ hands: 300, seed: 6 })` runs, Then `recommend` is called exactly once per player action, every applied action deep-equals the `move` of the call made for it, and the recorded views include `preflop`, `flop`, `turn` and `river` streets.
- Verification: acceptance `tests/bots/tag-playtest.acceptance.test.ts::AC#6 TAG acts through recommend on every street and plays its move`

### SPEC-07: Free-check stand-in and option pass-through
- Verifies: AC#3, AC#6
- Behaviour: `FREE_CHECK_EQUITY({ hero, board, opponents: [r1, r2] })` returns zero equity for hero and 2 opponents, method `exact`, trials 0. `decideTag(view, { equity })` with a stub equity of 1.0 facing a bet returns call and with 0.0 returns fold (options reach recommend). On a free postflop view a supplied `equity` stub is not called (the stand-in replaces it); on a preflop view no equity is used at all.
- Verification: unit `tests/bots/tag.test.ts::free-check stand-in and option pass-through`

### SPEC-08: Errors propagate unchanged
- Verifies: DoD#1
- Behaviour: `decideTag` on a view whose seat is not to act throws `RangeError('Seat <n> is not to act')` on preflop and on a flop view; on a 5-player preflop view it throws `RangeError('The 6-max chart needs 6 dealt-in seats, got 5')`.
- Verification: unit `tests/bots/tag.test.ts::propagates advice errors`

### SPEC-09: Bot code sees only the PlayerView boundary
- Verifies: DoD#5
- Behaviour: Every `import` in `src/bots/*.ts` that resolves into `src/engine/` is `import type` and names only `PlayerView`, `PublicPlayer`, `SeatPolicy`, `ShownHand`, `EarlierShowdown` (player-view) or `Action`, `SeatNumber`, `Street` (hand) — the test reads the source files and fails naming the file and import otherwise. No import of `src/ui`, React or browser APIs (also enforced by the headless lint rule).
- Verification: unit `tests/bots/tag.test.ts::bots import only PlayerView-boundary types from the engine`

### SPEC-10: Default playtest seats depend on table size
- Verifies: AC#5
- Behaviour: `defaultPolicyFactory(6)(code, seat)` is `tagPolicy` for seats 1–6; for size 3, 5, 7 and 10 it returns a policy whose choices equal `randomMovePolicy(seatGenerator(code, seat))` on the same views (same actions for one full hand); `playHand` with `seams.makePolicy` given still uses it at size 6.
- Verification: unit `tests/playtest/runner.test.ts::default seat policy is TAG at 6 players and random-move elsewhere`

### SPEC-11: All checks pass, coverage holds, bots stay headless and offline
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` exit 0; coverage thresholds in `vite.config.ts` hold (src/bots ≥ 90% lines); `src/bots` contains no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, dynamic `import(` or bare-package import.
- Verification: command `npm run lint && npm run typecheck && npm test && ! grep -rnE "fetch|XMLHttpRequest|WebSocket|EventSource|import\(|from '[^.]" src/bots`

### SPEC-12: CI is green on the story branch
- Verifies: DoD#10
- Behaviour: The latest GitHub Actions run on `doit/TASK-6.1` concludes `success`.
- Verification: command `gh run list -R gregswhiteaz/texaslimittrainer --branch doit/TASK-6.1 --limit 1 --json conclusion -q '.[0].conclusion'` prints `success`

### SPEC-13: Conditional DoD items that do not apply, and story documentation
- Verifies: DoD#3, DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: DoD#3 N/A — the golden-spot suite (E07-S14) does not exist yet. DoD#7 and DoD#12 N/A — no screen or dialog is added or changed (`git diff --stat` touches no `src/ui`, `e2e`). DoD#9 N/A — no strategy text, chart or range is authored; TAG plays the existing chart and rules. DoD#11 — a story document "TASK-6.1: Face TAG bots that act from the advice engine" is published with `backlog doc create`.
- Verification: manual check of `git diff --stat main -- src/ui e2e src/advice/charts docs` (empty) and `backlog doc list --plain | grep "TASK-6.1"`

## 7. Edge cases
- Seat not to act / wrong street: SPEC-08 (errors propagate).
- Table size ≠ 6: TAG throws preflop (SPEC-08); the playtest never seats TAG there (SPEC-10, D-3).
- Capped preflop street: raise becomes call (SPEC-01 concrete case).
- Free check postflop with the stand-in: move proven identical to real-equity advice (SPEC-03, SPEC-07).
- Hero missing from `view.players`: cannot occur for views built by `playerView` (`player-view.ts:67-68` throws first); `decideTag` then just calls `recommend`, whose behaviour is unchanged.
- All-in / short stacks: N/A — stacks reset to $160 each hand and the maximum a hand can cost is $96 at $4/$8 (4 bets × $4 × 2 streets + 4 bets × $8 × 2 streets), so no all-in occurs in the playtest.
- Concurrency, persistence, permissions, network: N/A — pure synchronous function.

## 8. Security considerations
- Trust boundary: bot code receives only `PlayerView` (REQ-025.1); type-level (SPEC-04 `@ts-expect-error`), import-level (SPEC-09) and behavioural (SPEC-04 permutation property) checks.
- The D-2 stand-in ignores its input cards, so it cannot leak anything; real equity is seeded from the canonical input only (doc-17 D-5).
- No new inputs, dependencies, secrets, logging or network. Randomness: none in TAG (TASK-6.18 adds the seeded generator).

## 9. Non-functional
- Playtest throughput: 10,000 all-TAG 6-max hands complete well inside the locked 60 s spawn timeout (measured 0.55 s with D-2 on this machine; 94 s without). Measured by SPEC-05's spawned run.
- REQ-055.3 (≤ 100 ms p95 per bot decision) is TASK-6.13's test; for reference, 6-max facing-bet decisions are p95 13 ms (doc-17), free checks skip equity, preflop is a table lookup.
- Coverage ≥ 90% lines for `src/bots/**` (SPEC-11).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests (path → SPEC ids):
  - `tests/bots/tag.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04 (locked)
  - `tests/bots/tag-playtest.acceptance.test.ts` → SPEC-05, SPEC-06 (locked)
  - `tests/bots/tag.test.ts` → SPEC-07, SPEC-08, SPEC-09
  - `tests/playtest/runner.test.ts` → SPEC-10
- End-to-end scenario for the Judge: run `npm run playtest -- --hands 10000 --seed 42` and confirm exit 0,
  `Hands played: 10000`, `Invariant violations: 0`, and that it finishes in seconds; run it twice and `diff` the
  outputs (identical); run `npm run playtest -- --hands 500 --seed 9 --size 7` and confirm it still works (random
  seats at 7 per D-3); then `npx vitest run tests/bots tests/playtest`.

## 11. Open questions
None. Q-1 and Q-2 answered by the user on 2026-11-18 (`doit/TASK-6.1/qa.md`), folded into D-3 and D-2.

Follow-ups (one line each; for the orchestrator to turn into tasks):
- Add an invariant playtest that uses betting policies (random-move or a mixed line-up) at 6 players, so postflop betting and the postflop cap stay covered while TAG is check-only after the flop (owner: TASK-6.9 or TASK-1.17).
- Remove the TAG free-check equity stand-in once TASK-7.18 restores equity headroom or TASK-7.8 makes free-check decisions depend on equity (owner: TASK-7.8/7.18).
- Seat TAG at all table sizes in the playtest once TASK-7.6 maps sizes 2–10 to charts, replacing the random-move fallback (owner: TASK-7.6).
- Add a test that every module reachable from `tools/playtest/main.ts` loads under Node type stripping, so a new parameter property or JSON import without an attribute is caught early (owner: small toolchain chore).
- Replace SPEC-09's source-reading import test with TASK-6.21's lint rule when it lands (owner: TASK-6.21).

## 12. Clarifications log
See `doit/TASK-6.1/qa.md`.
