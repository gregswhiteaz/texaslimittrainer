# Spec: TASK-1.6 — Run seeded bot-only hands from the command line

Status: READY (approved 2026-11-18 by user via Q-1..Q-3)
Task: TASK-1.6 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: REQ-062.1, REQ-062.4, REQ-013.3, REQ-056.1 (cap part only; full invariant checks are TASK-1.8) · Dream: limit-holdem-trainer

## 1. Summary
This task adds the headless playtest runner: `npm run playtest -- --hands <n> --seed <s> --size <players>` plays
bot-only fixed-limit hands at a $4/$8 cash table with the production engine (`createHand` + `actWith`), each seat
deciding through a `SeatPolicy` that sees only its `PlayerView`. It also adds the production M1 seeded random-move
policy (never a fifth bet on a street), deterministic per-hand replay codes derived from `--seed`, a replay mode
(`--replay-code`) that re-deals one hand, and a library `replayHand(record)` that reproduces a recorded hand through
the engine. The output is a fixed-format report that is byte-identical for the same seed and options, so later
stories (TASK-1.8 invariants and CI, TASK-1.16 `--game sng`, TASK-1.17 1,000,000-hand shards, E06 `--lineup`) can
extend it by adding options and report lines.

## 2. Scope
- In scope:
  - `src/playtest/policy.ts`: the M1 seeded random-move `SeatPolicy` and its per-seat generator.
  - `src/playtest/runner.ts`: per-hand replay-code derivation, the hand loop (stack reset, button rotation), hand
    records, the run summary, the M1 violation counter (rejected action, more than 4 bets on a street) and
    `replayHand`.
  - `src/playtest/cli.ts`: argument parsing and validation (fixed messages, exit 2), report and hand formatting,
    `main(argv, io)`.
  - `tools/playtest/main.ts` (process entry) and `tools/playtest/resolve-ts.js` (Node resolve hook so Node's
    built-in type stripping can load the extensionless `src` imports); `package.json` `playtest` script.
  - Tests: CLI acceptance (spawned `npm run playtest`), runner acceptance (in process), unit tests.
- Not doing:
  - The full invariant checker (chip conservation, pot eligibility, no card dealt twice, legal-action set check),
    printing replay code and action history on a violation, and CI's 10,000-hand job — TASK-1.8. This task counts
    only the two M1 violations in §5 "Rules" and prints the count.
  - Real stacks between hands, busted-seat refill, button skipping busted seats, `--game sng` — TASK-1.16. Here every
    seat is reset to $160 before every hand (task description, M1 interim behaviour).
  - Heads-up (`--size 2`) — TASK-1.11/TASK-1.17; the engine rejects fewer than 3 seats (`src/engine/hand.ts:122`).
  - Line-up presets, style bots, style checks, advice determinism, BB/100 and VPIP/PFR reporting (REQ-062.1/062.3) —
    E06/E07.
  - Throughput target (REQ-062.5) and sharding — TASK-1.17.
  - Any change to `src/engine/**` or existing tests; passing `earlierShowdowns` to policies (the random policy
    ignores them; E06 bots add it).
  - Writing hand records or reports to files.
- Scope budget: files=11, lines=1150   (policy.ts ~40, runner.ts ~160, cli.ts ~200, tools/playtest/main.ts ~10, tools/playtest/resolve-ts.js ~30, package.json 2, playtest.acceptance.test.ts ~170, runner.acceptance.test.ts ~170, policy.test.ts ~80, runner.test.ts ~110, cli.test.ts ~180)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | New folder `src/playtest/` (policy, runner, cli); process entry and resolve hook in `tools/playtest/`; tests in `tests/playtest/`. `src/playtest` is not added to the headless-boundary list | yes | The engine stays untouched; `tools/` holds the other project scripts (`tools/ci/retry.js`); the entry file is outside coverage (`vite.config.ts:14` covers only `src/**`) so `main` is tested in process | Put the policy in `src/bots/`; add `playtest` to `HEADLESS_DIRS` |
| A-2 | Seats are numbered 1..n (contiguous). Hand k's button is seat `((k - 1) mod n) + 1`: seat 1 on hand 1, moving one seat clockwise per hand | yes | All seats always hold $160 in M1, so the plain clockwise move is correct; TASK-1.16 replaces it with busted-seat logic | Random first button from the seed |
| A-3 | Every seat starts every hand with $160 (20 × $8, REQ-007.1) | yes (TASK-1.16 removes it) | Stated in the task description ("The runner resets every seat to the $160 buy-in before each hand in M1") | — |
| A-4 | M1 violations counted by this task: (a) `actWith` returns `ok: false` for the policy's action (the hand is abandoned and still counts as played); (b) `betCount > 4` after any action. Exit code 1 when the count is above 0 | yes | AC#1 needs a count to report and AC#6 needs the cap observed; TASK-1.8 replaces this with the full checker | Count nothing until TASK-1.8 (report always 0) |
| A-5 | The random-move policy picks uniformly (`Xoshiro128.nextInt`) among `view.legalActions`, after removing `bet`/`raise` when `view.betCount >= 4` | yes | Simplest policy that reaches every street and the cap; the same rule as TASK-1.4 A-11 and TASK-1.5 A-7 | Weighted choice (fewer folds) |
| A-6 | The policy ignores `earlierShowdowns`; the runner passes the default `[]` | yes | A session-long list would grow for 1,000,000 hands and the random policy does not read it | Keep the list per run |
| A-7 | `package.json` `engines.node` is raised from `>=22.12.0` to `>=22.18.0` | yes | `module.registerHooks` needs 22.15 and unflagged type stripping 22.18; `.nvmrc` and CI already use 22.18.0 (`.nvmrc`, `.github/workflows` `node-version-file: .nvmrc`) | Add `--experimental-strip-types` and keep 22.12 (still fails below 22.15) |
| A-8 | `replayHand` throws `Error('Replay diverged at action <i>')` if a recorded action is rejected; it never returns a partial state | yes | A divergent replay is a bug, as with `createHand`'s `RangeError` (TASK-1.4 A-5) | Return a typed result |

## 3. Current system
- TypeScript 6 strict, `moduleResolution: "bundler"`, `noEmit`, `verbatimModuleSyntax`, `allowJs`+`checkJs`
  (`tsconfig.json`); `include` covers `src`, `tests`, `tools` (`tsconfig.json:21`). Imports are extensionless
  (`src/engine/hand.ts:1-2`, `src/engine/deck.ts:1-2`), so plain `node` cannot load `src/**/*.ts` even with type
  stripping.
- Scripts: `test` = `vitest run --coverage`, `lint` = eslint + prettier check, `typecheck` = `tsc -p tsconfig.json`,
  `format` = `prettier --write .` (`package.json:10-18`). Coverage: 70% lines overall, 90% in
  `src/{engine,bots,advice,stats}` (`vite.config.ts:13-17`). No `tsx`, `ts-node` or `vite-node` in `node_modules`
  (checked: `node_modules/.bin` has only `tsc`, `vite`, `vitest`, `rolldown`, …). Node is 22.18.0 (`.nvmrc`); CI uses
  `node-version-file: .nvmrc` (`.github/workflows/*.yml:25`).
- Verified in a scratch run: `node --import <hook>.mjs run.ts`, where the hook uses `module.registerHooks` to retry
  extensionless relative specifiers with `.ts`, loads `src/engine/hand.ts`, `deck.ts`, `player-view.ts` and plays
  10,000 six-handed hands in about 0.13 s with no warnings. `registerHooks` is typed in `@types/node`
  (`node_modules/@types/node/module.d.ts:247`).
- `npm run <script> -- args` propagates the script's exit code (checked: a script exiting 2 makes `npm run` exit 2)
  and prints its `> name@version script` header to stdout before the script's output.
- Engine API: `createHand(config)` (`src/engine/hand.ts:160`) throws `RangeError` on bad config, needs stacks ≥
  `8 × smallBet + 8 × bigBet` = $96 at $4/$8 (`:151`), seats 3..10 (`:122`); `HandState.betCount` counts bets and
  raises, the big blind counting as 1 preflop (`:92-93`, `:194`); `legalActions` order fold, check, call, bet, raise
  and never offers fold when nothing is owed (`:216-240`); `applyAction` returns a typed result (`:355`).
  `HandState.actions` holds blinds and every applied action (`:96-97`); `result.awards` the payouts (`:74`).
  Card positions: hole cards at deal index j and j+n, board after burns (`:166-176`, `:338-349`).
- `actWith(state, policy)` (`src/engine/player-view.ts:109`) builds the view for `toAct`, calls the policy once and
  applies the action; `SeatPolicy` (`:59`); `view.betCount` and `view.legalActions` (`:49`, `:54`).
- Replay codes: `replayCodeFromWords(words)` (`src/engine/deck.ts:24`, "For seeded runs (TASK-1.6)"), `isReplayCode`
  (`:36`, exactly `/^[0-9a-f]{32}$/` and not all zeros), `shuffledDeck(code)` (`:41`) which mixes the code with
  `mixState128` so low-entropy codes still shuffle well (doc-9 Q-2: chosen for TASK-1.6's small seeds). doc-9
  follow-up: TASK-1.6 must validate with `isReplayCode` and print a fixed message, never the raw input (AC#7).
- Generators: `Xoshiro128` (`src/engine/seeded-random.ts:44`), `nextInt(n)` (`:83`), `fnv1a32` (`:4`).
- Test helpers: `REPO_ROOT` (`tests/support/sandbox.ts:16`) and `sandboxEnv()` (`:41`, strips `VITEST*`,
  `NODE_V8_COVERAGE`, `TEST*` so a nested npm run is not treated as a Vitest worker).
- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/engine/hand.ts` → `createHand`, `Stakes`, `SeatConfig`, `HandState`, `Action`, `ActionRecord`; never
    re-implement rules.
  - `src/engine/player-view.ts:109` → `actWith` drives every decision (the policy sees only `PlayerView`).
  - `src/engine/deck.ts:24,36,41` → `replayCodeFromWords`, `isReplayCode`, `shuffledDeck`.
  - `src/engine/seeded-random.ts:4,44` → `fnv1a32`, `Xoshiro128` for the policy generator.
  - `src/engine/cards.ts:44` → `formatCard` for hand output.
  - `tests/support/sandbox.ts:16,41` → `REPO_ROOT`, `sandboxEnv` for spawning `npm run playtest`.
  - `tools/ci/retry.js:5-9` → style for a Node tool file (`import process from 'node:process'`, JSDoc types).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | CLI options, defaults, validation, exit codes and the exact report / hand text in §5 (approved as designed, incl. replay mode; qa.md Q-1) | Required `--hands`/`--seed`; JSON report; per-hand log option; no replay mode | Text later stories and CI depend on; machine-greppable `Label: value` lines that grow by adding lines; defaults make bare `npm run playtest` the DoD#6 run | yes | user (Q-1) |
| D-2 | Hand k's replay code = `replayCodeFromWords([floor(seed / 2^32), seed mod 2^32, 0, k])`; seat s's policy generator in a hand = `new Xoshiro128(fnv1a32(replayCode + '/' + s))` (approved: seed + hand number; qa.md Q-2) | One `Xoshiro128(seed)` stream drawing 4 words per hand; hash of seed and hand number; include table size in the code | Any hand of a run is reproducible from seed and number alone (no need to replay earlier hands), which suits TASK-1.17 shards; `shuffledDeck` mixes low-entropy codes (doc-9 Q-2); seeds 42 and 43 can never share a code; the policy rule is the task note's "RNG from replay code + seat", so `--replay-code` + `--size` + `--button` reproduces a hand's actions too | yes | user (Q-2) |
| D-3 | `npm run playtest` = `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts` (Node's built-in type stripping plus a 20-line resolve hook; no new dependency) (approved: Node built-in, no new dependency; engines.node >=22.18.0 per A-7; qa.md Q-3) | Add `tsx` (new dependency, always ask); `vite build --ssr` then `node dist/…` (slower, prints build output, needs a quiet flag); add `.ts` extensions to every import with `allowImportingTsExtensions` (touches every engine file) | Verified working on the project's Node 22.18 (§3); no install, no build step, same `src` code the tests import | yes | user (Q-3) |
| D-4 | Stack reset to $160 every hand; button rotation per A-2 | Carry stacks (needs all-in support, TASK-1.9+) | Task description; engine needs ≥ $96 (`hand.ts:151`) and the max one seat can put in a capped hand is $96 | no | n/a (task text) |
| D-5 | Stakes {smallBlind 2, bigBlind 4, smallBet 4, bigBet 8} | — | $4/$8 limit with $2/$4 blinds, the table the AC names | no | n/a (AC#1) |

## 5. Design

### Files to create / modify
- `src/playtest/policy.ts` — new: `seatGenerator`, `randomMovePolicy`
- `src/playtest/runner.ts` — new: constants, `handReplayCode`, `playHand`, `runPlaytest`, `replayHand`, types
- `src/playtest/cli.ts` — new: `USAGE`, `parseArgs`, `formatReport`, `formatHand`, `main`
- `tools/playtest/main.ts` — new: process entry (calls `main`, sets `process.exitCode`)
- `tools/playtest/resolve-ts.js` — new: `module.registerHooks` resolve hook (extensionless relative → `.ts`)
- `package.json` — modify: add `"playtest"` script; `engines.node` to `>=22.18.0` (A-7)
- `tests/playtest/playtest.acceptance.test.ts` — new, locked: AC#1, AC#3, AC#4, AC#7 through `npm run playtest`
- `tests/playtest/runner.acceptance.test.ts` — new, locked: AC#2, AC#5, AC#6 in process
- `tests/playtest/policy.test.ts` — new: policy unit tests
- `tests/playtest/runner.test.ts` — new: code derivation, button rotation, violation counting, `replayHand` errors
- `tests/playtest/cli.test.ts` — new: parsing, every usage error, help, report and hand text

### Components, interfaces and data
`src/playtest/policy.ts` (imports `../engine/*` only):
```ts
/** The policy generator for `seat` in the hand dealt from `code`: new Xoshiro128(fnv1a32(`${code}/${seat}`)). */
export function seatGenerator(code: ReplayCode, seat: SeatNumber): Xoshiro128;
/** M1 seeded random-move policy: uniform over view.legalActions, minus bet/raise when view.betCount >= 4.
 *  Throws RangeError if no action is available (only possible when called for a seat not to act). */
export function randomMovePolicy(rng: Xoshiro128): SeatPolicy;
```
`src/playtest/runner.ts`:
```ts
export const PLAYTEST_STAKES: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
export const CASH_BUY_IN = 160; // 20 × bigBet (REQ-007.1)
export const MAX_BETS_PER_STREET = 4;
export interface PlaytestOptions { readonly hands: number; readonly seed: number; readonly size: number }
/** Makes the policy for one seat of one hand. Default: randomMovePolicy(seatGenerator(code, seat)). */
export type PolicyFactory = (code: ReplayCode, seat: SeatNumber) => SeatPolicy;
/** Everything needed to replay a hand (REQ-013.3). Plain data. */
export interface HandRecord {
  readonly replayCode: ReplayCode;
  readonly stakes: Stakes;
  readonly seats: readonly SeatConfig[];  // seats 1..n, starting stacks, ascending
  readonly button: SeatNumber;
  readonly actions: readonly Action[];    // every applied player action in order; blinds excluded
}
export interface PlayedHand {
  readonly number: number;                // 1-based in the run
  readonly record: HandRecord;
  readonly final: HandState;              // last state (complete unless abandoned)
  readonly violations: number;
}
export interface PlaytestSummary {
  readonly handsPlayed: number; readonly foldOuts: number; readonly showdowns: number;
  readonly playerActions: number; readonly cappedStreets: number; readonly largestPot: number;
  readonly firstReplayCode: ReplayCode; readonly lastReplayCode: ReplayCode; readonly violations: number;
}
export function handReplayCode(seed: number, handNumber: number): ReplayCode;
/** Deals and plays one hand from `code` with every seat at CASH_BUY_IN. */
export function playHand(code: ReplayCode, size: number, button: SeatNumber, number?: number,
  makePolicy?: PolicyFactory): PlayedHand;
/** Plays options.hands hands; calls onHand after each (not retained, so memory is O(1) in hands). */
export function runPlaytest(options: PlaytestOptions, onHand?: (hand: PlayedHand) => void,
  makePolicy?: PolicyFactory): PlaytestSummary;
/** Re-deals record.replayCode and applies record.actions through applyAction. Throws per A-8. */
export function replayHand(record: HandRecord): HandState;
```
`src/playtest/cli.ts`:
```ts
export interface CliIo { readonly out: (text: string) => void; readonly err: (text: string) => void }
export type ParsedArgs =
  | { readonly kind: 'run'; readonly options: PlaytestOptions }
  | { readonly kind: 'replay'; readonly replayCode: ReplayCode; readonly size: number; readonly button: SeatNumber }
  | { readonly kind: 'help' }
  | { readonly kind: 'error'; readonly message: string }; // one of the fixed messages below
export const USAGE: string;
export function parseArgs(argv: readonly string[]): ParsedArgs;
export function formatReport(header: string, summary: PlaytestSummary): string;
export function formatHand(hand: PlayedHand): string;
/** Returns the exit code: 0 no violations, 1 violations, 2 usage error. Writes everything through io.
 *  makePolicy is a test seam (SPEC-12); the entry never passes it. */
export function main(argv: readonly string[], io: CliIo, makePolicy?: PolicyFactory): number;
```
`tools/playtest/main.ts`: `process.exitCode = main(process.argv.slice(2), { out: (t) => process.stdout.write(t), err: (t) => process.stderr.write(t) });`
(import `process` from `node:process`). No other logic.

`tools/playtest/resolve-ts.js`: `registerHooks({ resolve })` where a specifier starting `./` or `../` with no
extension is first resolved as `specifier + '.ts'`, falling back to the original specifier if that fails. Applies
only to relative specifiers; package imports are untouched.

### Rules and algorithms
1. Replay code (D-2): `handReplayCode(seed, k) = replayCodeFromWords([Math.floor(seed / 2**32), seed >>> 0, 0, k])`.
   Word 2 is 0 (reserved; a later mode such as `--game sng` may set it). Worked examples:
   `handReplayCode(42, 1)` = `000000000000002a0000000000000001`; `handReplayCode(43, 1)` =
   `000000000000002b0000000000000001`; `handReplayCode(2**32, 3)` = `00000001000000000000000000000003`.
   Never all zero because k ≥ 1.
2. Hand k of a run: `code = handReplayCode(seed, k)`, seats `1..size` each with `CASH_BUY_IN`, button
   `((k - 1) mod size) + 1`, `deck = shuffledDeck(code)`, `state = createHand(...)`; then, while `state.toAct !== null`:
   `actWith(state, policyFor[toAct])` where `policyFor[s] = makePolicy(code, s)` is created once per seat at hand
   start. Each accepted action is appended to `record.actions`.
3. Violations (A-4), checked after every `actWith`: `ok: false` → +1 and stop the hand (abandoned; `final` is the
   last good state); `state.betCount > MAX_BETS_PER_STREET` → +1 (hand continues).
4. Summary: `handsPlayed` = hands started; `foldOuts`/`showdowns` from `final.result.endedBy` (abandoned hands count
   in neither); `playerActions` = total accepted actions (blinds excluded); `cappedStreets` = number of (hand, street)
   pairs whose bet count reached 4 (preflop: BB + bets/raises; other streets: bets/raises, from `final.actions`);
   `largestPot` = max over hands of the sum of `result.awards[*].amount`; first/last replay codes = hand 1 / hand
   `hands` codes.
5. Policy (A-5): `allowed = view.betCount >= 4 ? legal.filter(a => a.type !== 'bet' && a.type !== 'raise') : legal`;
   return `allowed[rng.nextInt(allowed.length)]`. Exactly one generator draw per decision.
6. Replay mode: `playHand(replayCode, size, button, 1)`; output = header, `formatHand`, then the report for that one
   hand. Because D-2 seeds the policies from (code, seat), `--replay-code <hand k's code> --size n --button b`
   reproduces hand k of a run exactly.
7. `replayHand(record)`: `createHand({stakes, seats, button, deck: shuffledDeck(replayCode)})`, then
   `applyAction` for each of `record.actions` in order.

### Output format (stdout; every line ends with `\n`; no timings, dates or paths) — Q-1
Run mode, e.g. `npm run playtest -- --hands 10000 --seed 42`:
```
TLH Trainer playtest
Options: --hands 10000 --seed 42 --size 6
Table: 6 players, cash $4/$8, every stack reset to $160 before each hand
Hands played: 10000
Ended by fold: <n>
Ended at showdown: <n>
Player actions: <n>
Streets capped at 4 bets: <n>
Largest pot: $<n>
First replay code: 000000000000002a0000000000000001
Last replay code: 000000000000002a0000000000002710
Invariant violations: <n>
```
The `Options:` line prints the parsed (normalised) values, never raw input. Replay mode, e.g.
`--replay-code <code> --size 6 --button 3`: line 1 `TLH Trainer playtest`, line 2
`Options: --replay-code <code> --size 6 --button 3`, line 3 the `Table:` line, then `formatHand`, then the lines from
`Hands played: 1` to `Invariant violations: <n>`. `formatHand(hand)`:
```
Hand 1: replay code <code>, button seat 3
Seat 1 ($160): Ah Kd
… one line per seat, ascending …
Board: 6d Qs 8h Ts Ad            ("Board: none" when no board card was dealt)
Preflop: seat 4 posts small blind $2, seat 5 posts big blind $4, seat 6 folds, seat 1 calls $4, seat 2 raises to $8, …
Flop: seat 4 checks, seat 5 bets $4, …      (one line per street that has actions, in street order)
Result: seat 2 wins $36            (splits: "Result: seat 2 wins $13, seat 5 wins $13", award order;
                                    abandoned hand: "Result: abandoned (invariant violation)")
```
Action words: `posts small blind $a`, `posts big blind $a`, `folds`, `checks`, `calls $a`, `bets $a`,
`raises to $a` (`a` = `ActionRecord.amount`).

### Error handling and configuration
- Arguments: `--name value` pairs only. Options: `--hands` (whole number 1..1000000000, default 10000), `--seed`
  (decimal digits only, 0..9007199254740991, default 42), `--size` (3..10, default 6), `--replay-code`, `--button`
  (1..size, default 1, only with `--replay-code`), `--help` (alone; prints `USAGE` to stdout, exit 0). Digits are
  matched with `/^[0-9]+$/` before conversion (no signs, decimals, exponents or whitespace).
- On any argument error: write `<fixed error line>\n` then `USAGE` to stderr, write nothing to stdout, play no
  hands, return 2. Error lines never contain user input:
  - `Error: unknown option.`
  - `Error: <option> needs a value.` (option is one of the fixed names above)
  - `Error: <option> given more than once.`
  - `Error: --hands must be a whole number from 1 to 1000000000.`
  - `Error: --seed must be a whole number from 0 to 9007199254740991.`
  - `Error: --size must be a whole number from 3 to 10.`
  - `Error: --button must be a seat number from 1 to the table size.`
  - `Error: --replay-code must be 32 lowercase hex characters (0-9, a-f), not all zeros.` (checked with
    `isReplayCode`, `deck.ts:36`)
  - `Error: --replay-code cannot be combined with --hands or --seed.`
  - `Error: --button is only valid with --replay-code.`
  - `Error: --help cannot be combined with other options.`
- `USAGE` (exact):
```
Usage: npm run playtest -- [--hands <1-1000000000>] [--seed <0-9007199254740991>] [--size <3-10>]
       npm run playtest -- --replay-code <32 lowercase hex characters> [--size <3-10>] [--button <seat>]
Defaults: --hands 10000 --seed 42 --size 6 --button 1
```
- Exit codes: 0 = run finished with 0 violations; 1 = run finished with ≥ 1 violation; 2 = usage error. An
  unexpected engine exception propagates (Node prints the stack and exits 1).

## 6. Behaviour specification

### SPEC-01: 10,000-hand default-table run through npm
- Verifies: AC#1, DoD#6
- Behaviour: Given the repository, When `npm run playtest -- --hands 10000 --seed 42` runs (spawned with
  `sandboxEnv()` in `REPO_ROOT`), Then it exits 0 within 60 s, stdout contains the lines
  `Options: --hands 10000 --seed 42 --size 6`, `Table: 6 players, cash $4/$8, every stack reset to $160 before each hand`,
  `Hands played: 10000` and `Invariant violations: 0`, and the report lines appear in the §5 order.
- Verification: acceptance `tests/playtest/playtest.acceptance.test.ts::AC#1 plays 10,000 hands at 6-max $4/$8 and reports zero violations`

### SPEC-02: The run uses the production engine at $4/$8 with six $160 seats
- Verifies: AC#1
- Behaviour: Given `runPlaytest({hands: 600, seed: 42, size: 6}, onHand)`, When it completes, Then every
  `PlayedHand.record` has stakes `{2, 4, 4, 8}`, seats `1..6` each with stack 160, `final.result` non-null,
  `replayHand(record)` (engine `createHand`/`applyAction`) ends with the same `result` as `final`, and the summary's
  `handsPlayed` is 600 and `violations` 0.
- Verification: acceptance `tests/playtest/runner.acceptance.test.ts::AC#1 hands are real engine hands at $4/$8 with $160 stacks`

### SPEC-03: Every hand is dealt to exactly n players
- Verifies: AC#2
- Behaviour: Given `size` n for each n in 3..10, When `runPlaytest({hands: 200, seed: 7, size: n}, onHand)` runs,
  Then every hand's `final.players` has exactly n entries with seats `1..n`, each holding 2 hole cards, and the 2n
  hole cards of a hand are distinct; and `npm run playtest -- --hands 50 --seed 7 --size 10` prints
  `Table: 10 players, …` and `Hands played: 50`.
- Verification: acceptance `tests/playtest/runner.acceptance.test.ts::AC#2 every hand is dealt to exactly n players for n = 3..10`

### SPEC-04: Same seed and options give byte-identical output
- Verifies: AC#3
- Behaviour: Given `npm run playtest -- --hands 2000 --seed 42 --size 9` run twice and
  `npm run playtest -- --hands 10000 --seed 42` run twice, When both pairs finish, Then each pair's stdout strings
  are identical (`===`) and both exit codes are 0; and in process, `main` with the same argv twice writes identical
  text.
- Verification: acceptance `tests/playtest/playtest.acceptance.test.ts::AC#3 same seed and options give byte-identical output`

### SPEC-05: Seeds 42 and 43 deal different replay codes
- Verifies: AC#4
- Behaviour: Given `--hands 100` with `--seed 42` and `--seed 43`, When both runs complete, Then their
  `First replay code:` values differ and their `Last replay code:` values differ (42 → `000000000000002a0000000000000001`
  and `000000000000002a0000000000000064`; 43 → `000000000000002b…0001` and `…0064`); and in process the sets of all
  100 codes from each seed (collected via `onHand`) are disjoint.
- Verification: acceptance `tests/playtest/playtest.acceptance.test.ts::AC#4 seeds 42 and 43 deal different replay codes`

### SPEC-06: A recorded hand replays to the same cards
- Verifies: AC#5
- Behaviour: Given 400 hands recorded by `runPlaytest` (100 each at sizes 3, 6, 9, 10, seed 5), When each
  `record` (replay code, seats with stacks, button, actions) is passed to `replayHand`, Then for every seat the
  replayed `holeCards` equal the recorded hand's, the replayed `board` equals `final.board` element by element (same
  order), `burned` is equal, and `result` is deep-equal. And: given hand 4 of `--hands 4 --seed 42` (code
  `000000000000002a0000000000000004`, button 4), `main(['--replay-code', code, '--size', '6', '--button', '4'])`
  prints a `formatHand` block equal to `formatHand` of that hand from the run (except the `Hand <k>:` number).
- Verification: acceptance `tests/playtest/runner.acceptance.test.ts::AC#5 a recorded hand replays with the same hole cards and board`

### SPEC-07: The policy never bets or raises at 4 bets
- Verifies: AC#6
- Behaviour: Given views at `betCount` 4 — preflop after three raises over the big blind (seat to act owes and
  is offered fold/call/raise), and a turn street after bet + 3 raises — When `randomMovePolicy` decides with 1,000
  different `Xoshiro128` seeds each, Then every choice is `fold` or `call`; and at `betCount` 3 in the same spots it
  chooses `raise` at least once (control).
- Verification: unit `tests/playtest/policy.test.ts::never bets or raises once the street has 4 bets`

### SPEC-08: A 10,000-hand run records no street with more than 4 bets
- Verifies: AC#6, DoD#6
- Behaviour: Given `runPlaytest({hands: 10000, seed: 42, size: 6}, onHand)`, When every hand's `final.actions` is
  grouped by street (preflop counting the big blind as 1, then each `bet`/`raise`), Then no street exceeds 4, at
  least one street reaches exactly 4 (the cap path is exercised), and `summary.violations` is 0.
- Verification: acceptance `tests/playtest/runner.acceptance.test.ts::AC#6 10,000 hands record no street with more than 4 bets`

### SPEC-09: Invalid --replay-code prints a fixed usage message and exits 2
- Verifies: AC#7
- Behaviour: Given `--replay-code` with each of `ABCDEF0123456789abcdef0123456789` (uppercase), a 31-character and
  a 33-character hex string, `00000000000000000000000000000000`, `zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz` and
  `--replay-code` with no value, When `npm run playtest -- <args>` runs (one spawned case: the uppercase value; all
  cases through `main`), Then the exit code is 2; stderr (from `main`) is exactly
  `Error: --replay-code must be 32 lowercase hex characters (0-9, a-f), not all zeros.\n` + `USAGE` (or
  `Error: --replay-code needs a value.\n` + `USAGE` for the missing value); stderr never contains the bad value;
  stdout has no `Hands played:` line (from `main`: nothing at all written to `out`).
- Verification: acceptance `tests/playtest/playtest.acceptance.test.ts::AC#7 invalid replay code prints the fixed usage message and exits 2`

### SPEC-10: Other argument errors, help and defaults
- Verifies: AC#7
- Behaviour: Given each argv in a table — `['--hands','0']`, `['--hands','1e3']`, `['--hands','1000000001']`,
  `['--seed','-1']`, `['--seed','9007199254740992']`, `['--size','2']`, `['--size','11']`, `['--bogus']`,
  `['--hands=5']`, `['--hands','5','--hands','6']`, `['--button','2']`, `['--replay-code', <valid>, '--seed','1']`,
  `['--replay-code', <valid>, '--size','4','--button','5']`, `['--help','--hands','5']`, `['--hands']` — When `main`
  runs, Then it returns 2, writes the matching §5 error line + `USAGE` to `err` and nothing to `out`. `['--help']`
  returns 0 and writes `USAGE` to `out`. `[]` produces the same output as
  `['--hands','10000','--seed','42','--size','6']`. `['--hands','1','--seed','9007199254740991']` returns 0 and
  prints `First replay code: 001fffffffffffff0000000000000001`.
- Verification: unit `tests/playtest/cli.test.ts::rejects every invalid argument with its fixed message`

### SPEC-11: Replay codes, button rotation and the policy generator follow D-2 and A-2
- Verifies: AC#3, AC#4
- Behaviour: Given `handReplayCode`, Then it returns the three §5 worked examples and throws `RangeError` for hand
  number 0; given `runPlaytest({hands: 7, seed: 1, size: 3})`, Then buttons are 1,2,3,1,2,3,1; given the same
  `(code, seat)`, `seatGenerator` yields the same first 10 `nextUint32` values, and different seats yield different
  sequences.
- Verification: unit `tests/playtest/runner.test.ts::derives codes, buttons and seat generators deterministically`

### SPEC-12: Violations are counted and set exit code 1
- Verifies: AC#1, AC#6
- Behaviour: Given a `PolicyFactory` whose policy always returns `{seat, type: 'raise', amount: 999}`, When
  `runPlaytest({hands: 3, seed: 1, size: 3}, onHand, factory)` runs, Then `violations` is 3, `handsPlayed` 3,
  `foldOuts + showdowns` 0, and each `PlayedHand.final` is the post-blind state. Given a factory that always picks
  `raise` whenever offered (ignoring the cap), Then `violations` ≥ 1 (bet count above 4). `formatHand` of an
  abandoned hand ends `Result: abandoned (invariant violation)`; `main` returns 1 when the summary has violations
  (through `main`'s optional `makePolicy` test seam, §5).
- Verification: unit `tests/playtest/runner.test.ts::counts rejected actions and over-cap streets as violations`

### SPEC-13: Report and hand text
- Verifies: AC#1, AC#5
- Behaviour: Given a fixed `PlaytestSummary` and a scripted `PlayedHand` (6 seats, button 3, ends at showdown with
  a split), When formatted, Then `formatReport` and `formatHand` return exactly the §5 text (full-string
  comparison), including `Board: none` for a preflop fold-out and the split `Result:` line; `replayHand` throws
  `Error('Replay diverged at action 0')` when the first recorded action is illegal.
- Verification: unit `tests/playtest/cli.test.ts::formats the report and a hand exactly`

### SPEC-14: Checks pass, coverage holds, boundaries and network
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#8
- Behaviour: Given the finished change, When `npm run lint`, `npm run typecheck`, `npm test` run, Then all exit 0
  with zero errors and coverage thresholds hold (`src/playtest/**` included in the 70% overall figure; engine
  unchanged at ≥ 90%); `git diff --stat <base> -- src/engine` is empty; `grep -rnE "from '(react|.*ui)" src/playtest`
  finds nothing; `grep -rnE "fetch\(|http|node:net|node:https?" src/playtest tools/playtest` finds nothing.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-15: CI green and documentation; non-applicable DoD items
- Verifies: DoD#3, DoD#7, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the branch is pushed, When CI runs, Then the workflow is green (DoD#10); the story document is
  published with `backlog doc create` (DoD#11). DoD#3 (golden spots, from E07-S14), DoD#7 and DoD#12 (no screen),
  DoD#9 (no strategy content) are N/A.
- Verification: manual `gh run list --branch doit/TASK-1.6 --limit 1` shows success; `backlog doc list --plain` lists the TASK-1.6 document

## 7. Edge cases
- Boundary sizes 3 and 10: SPEC-03. Size 2 / 11: usage error (SPEC-10).
- `--hands 1`: first and last replay code equal; covered by SPEC-06's replay case (`--hands 4`) and SPEC-10 defaults;
  no special handling.
- Largest seed 9007199254740991 → words `[0x1fffff, 0xffffffff, 0, k]`: SPEC-10 accepts it (in the valid-input row
  of the table) and SPEC-11's `2**32` example covers the high word.
- Preflop fold-out (no board): SPEC-13 `Board: none`.
- Split pot text: SPEC-13.
- Duplicate options, `--opt=value`, missing values, unknown options: SPEC-10.
- Invalid replay code variants (case, length, all zeros, non-hex, missing): SPEC-09.
- Engine rejection / over-cap bet count: SPEC-12.
- Concurrency, permissions, interruption: N/A — single synchronous process, writes only to stdout/stderr; Ctrl-C
  ends the process with Node's default behaviour.
- Dependency failure: N/A — no network, files or external services.

## 8. Security considerations
- Trust boundary: command-line arguments. Each value is matched against a fixed pattern/range before use; numbers
  only from `/^[0-9]+$/` within safe-integer ranges; the replay code only via `isReplayCode`. Error output is fixed
  text and never echoes input (doc-9 NIT), so no terminal-escape injection through messages; the `Options:` line
  prints normalised values only.
- No authn/authz, secrets, files, network or shell execution in the runner. The resolve hook only rewrites relative
  specifiers to `.ts` siblings inside the project's own import graph.
- New dependencies: none (D-3 / Q-3).
- Randomness: deliberately deterministic, non-cryptographic (`Xoshiro128`, `fnv1a32`) because REQ-062.4 needs
  reproducible runs; the app's real hands keep using `newReplayCode()` (CSPRNG, REQ-013.2), untouched here.
- Resource use: `--hands` capped at 1,000,000,000; memory is O(1) in hands (records are passed to `onHand` and
  dropped).

## 9. Non-functional
- `npm run playtest -- --hands 10000 --seed 42` finishes in < 60 s on CI (scratch measurement: engine loop ≈ 0.13 s
  for 10,000 hands; Node start-up and npm add ≈ 1 s). Measured by the SPEC-01 test timeout (60,000 ms).
- Determinism: output depends only on argv (no `Date`, `Math.random`, timings, env or paths) — SPEC-04.
- REQ-062.5 throughput (100,000 hands ≤ 60 min) is TASK-1.17's to verify; current speed is far inside it.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42`
- New tests (path → SPEC ids):
  - `tests/playtest/playtest.acceptance.test.ts` → SPEC-01, SPEC-04, SPEC-05, SPEC-09 (spawns `npm run playtest`
    with `spawnSync('npm', ['run', 'playtest', '--', ...args], { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8' })`;
    per-test timeout 120,000 ms; compares stdout after the npm `>` header lines, which are identical for identical
    args anyway).
  - `tests/playtest/runner.acceptance.test.ts` → SPEC-02, SPEC-03, SPEC-06, SPEC-08.
  - `tests/playtest/policy.test.ts` → SPEC-07. `tests/playtest/runner.test.ts` → SPEC-11, SPEC-12.
    `tests/playtest/cli.test.ts` → SPEC-10, SPEC-12 (`main` exit 1), SPEC-13.
- End-to-end scenario for the Judge: run `npm run playtest -- --hands 10000 --seed 42` twice and `diff` the outputs
  (identical, exit 0, `Invariant violations: 0`); run with `--seed 43` and compare the replay-code lines (differ);
  run `--size 3` and `--size 10`; run `npm run playtest -- --replay-code 000000000000002a0000000000000004 --size 6 --button 4`
  and read a full hand; run `npm run playtest -- --replay-code XYZ; echo $?` (fixed message, `2`, no report).

## 11. Open questions
None. Q-1 (CLI and report text, D-1), Q-2 (replay-code and seat-generator derivation, D-2) and Q-3 (Node type
stripping + resolve hook, D-3) were answered with the recommended options on 2026-11-18 (`doit/TASK-1.6/qa.md`).

### Follow-ups (not in scope; candidate tasks)
- TASK-1.8: add an `onAction` hook to `runPlaytest` for the full invariant checker and reuse `formatHand` to print the replay code and action history on a violation.
- TASK-1.16: use replay-code word 2 (reserved 0 for cash) for `--game sng` so sng decks differ from cash decks at the same seed.
- TASK-1.11/TASK-1.17: allow `--size 2` once the engine supports heads-up.
- TASK-6.9/E06: pass the earlier-showdowns list through the runner to bots that need it.
- Consider adding `src/playtest` to `HEADLESS_DIRS` in `tools/lint/headless-boundary.js`.

## 12. Clarifications log
See `doit/TASK-1.6/qa.md`.
