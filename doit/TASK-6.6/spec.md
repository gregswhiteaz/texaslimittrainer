# Spec: TASK-6.6 — Seat bots by line-up preset with unique names

Status: READY (approved 2026-11-22)
Task: TASK-6.6 · Parent/epic: TASK-6 · Requirements: REQ-009 (009.1, 009.4, 009.7, 009.8), REQ-062 (062.1, 062.2, 062.4) · Dream: limit-holdem-trainer

## 1. Summary
This task adds a pure line-up module in `src/bots/lineup.ts`. Given a preset (Mixed, Tough or Soft), a table size
(2 to 10) and the user's seat, it gives every bot seat a style and a display name that's unique at the table. The
playtest CLI gets `--lineup mixed|tough|soft`. With it, seat 1 plays the user's part with a scripted policy (seeded
TAG), and seats 2 and up play their preset styles. The bot style dispatch moves from the worker into the bots layer so
that the worker and the playtest share it. Without `--lineup` the playtest is unchanged, and so is its baseline.

## 2. Scope
- In scope:
  - `src/bots/lineup.ts`: `LINE_UP_PRESETS`, `BOT_NAMES`, `seatLineUp(preset, size, userSeat)` (AC#1–AC#5).
  - `src/bots/decide.ts`: `decideStyle(view, style, random)`, moved from `decideBotDefault` in
    `src/table/advice-service.ts:47-52`. The worker then calls it. Behaviour is unchanged.
  - Playtest: `lineUpPolicyFactory` (policy.ts), the `lineUp` option (runner.ts), and `--lineup` with its usage text,
    error, header lines and replay suggestion (cli.ts) (AC#6, AC#7).
  - AC#8: run times measured (§9), an opt-in slow test for 10,000-hand Maniac line-ups, and short line-up runs in the
    normal suite.
- Not doing:
  - Game Config UI, the preset picker, per-seat edits, Randomise or Custom (TASK-2.5, TASK-2.8, TASK-2.9, TASK-6.7).
    `DEFAULT_SEATS`, `DEFAULT_SESSION_CONFIG` and the session's names (`src/table/session.ts:59-66`, `:95-104`) stay as
    they are. The app doesn't use the new module yet.
  - Preflop advice at sizes other than 6 dealt-in seats (TASK-7.6). At those sizes, line-up seats play random moves
    (D-2 / Q-1).
  - Equity caching. It was measured and doesn't help (D-3).
  - Changing the default playtest (no `--lineup`) or `npm run playtest:million` / `src/playtest/shards.ts`.
  - Style bands or BB/100 reporting (TASK-6.11, TASK-6.16, TASK-6.17).
  - Editing any earlier task's locked acceptance test. None needs to change.
- Scope concerns (follow-ups, not done here):
  1. AC#6 asks for a 9-seat line-up, but every bot decides through `recommend`, whose preflop chart throws unless
     exactly 6 seats are dealt in (`src/advice/preflop.ts:48-52`). Until TASK-7.6 lands, a 9-seat (or heads-up, or
     short-handed sit-and-go) line-up can only be checked for seat assignment and invariants, not style play (Q-1).
     TASK-7.6 now carries an AC to remove `lineUpPolicyFactory`'s fallback.
  2. A 10,000-hand 6-max line-up with a Maniac takes about 1 minute (Tough) to 1.5 minutes (Mixed). TAG and Calling
     station seats then face postflop bets, and each one needs an equity run (§9). The CI speed plan should know
     about this if such runs ever move into CI.
- Scope budget: files=12, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Bot `k` (1-based, counted clockwise from the user) gets `BOT_NAMES[k-1]`. Names are fixed by order: no randomness and no seed. | yes | REQ-009.4 only asks for uniqueness. A fixed order makes `seatLineUp` pure and gives byte-identical playtest output (REQ-062.4). Confirmed by Q-2 (auto-accepted). | Seeded shuffle of a longer list (needs a seed in the session) |
| A-2 | In a `--lineup` run, seat 1 (the user's seat) plays `seededTagPolicy(code)` when 6 seats are dealt in. | yes | A trainee following the advice is the natural scripted user. TAG never bets postflop (`src/advice/postflop.ts:6`), so the user seat adds no equity cost of its own. | `randomMovePolicy` (stresses invariants more but makes every bot face random postflop bets, which is slower) |
| A-3 | CLI preset names are exactly `mixed`, `tough`, `soft` (lowercase, case-sensitive), matching `--game cash|sng` (`src/playtest/cli.ts:104-105`). The module uses the display names `Mixed`, `Tough`, `Soft`, matching `LineUpName` (`src/table/session.ts:72`). | yes | Same strictness as the other options. | Case-insensitive matching |
| A-4 | The header format with `--lineup` is defined in §5 "Rules" R-5: the Options line gains ` --lineup <name>`, then a `Line-up:` line, plus a `Line-up note:` line when size ≠ 6 or game is sng. | yes | Developer-facing CLI text. It reproduces the run and shows each seat's style and name. | A per-seat block of lines |
| A-5 | `--lineup` is also accepted with `--replay-code`. The violation block's `Replay:` line then includes ` --lineup <name>`, so a violating line-up hand can be replayed with the same policies (REQ-062.2). | yes | Without this, the suggested replay would use the default policies and diverge. | Reject `--lineup` with `--replay-code` |
| A-6 | `seatLineUp` throws `RangeError` for a bad size, seat or preset (messages in §5). It never returns a partial line-up. | yes | Matches the engine and runner (`src/playtest/runner.ts:174`). | Return a result union |

## 3. Current system
- Styles: `StyleName = 'TAG' | 'Calling station' | 'Maniac' | 'Rock'` (`src/bots/style.ts:11`). The session has the
  same union as `BotStyle` (`src/table/session.ts:51`), and `LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom'`
  (`:72`).
- Bot decisions: `decideTag(view, {random})` (`src/bots/tag.ts:31`), `decideCallingStation(view, {random})`,
  `decideManiac(view, {random})` (`src/bots/maniac.ts:26`), `decideRock(view)`. The worker dispatches by style in
  `decideBotDefault` (`src/table/advice-service.ts:47-52`), with `random = botRandom(seed)` (`:67`) and the seed derived
  on the main thread by `botDecisionSeed`.
- Advice: `positionOf` throws `RangeError('The 6-max chart needs 6 dealt-in seats, got n')` unless
  `view.players.length === 6` (`src/advice/preflop.ts:47-52`). `view.players` holds only the dealt-in seats.
- Playtest: `defaultPolicyFactory(size)` returns all `seededTagPolicy` at 6 dealt-in seats, otherwise
  `randomMovePolicy(seatGenerator(code, seat))` (`src/playtest/runner.ts:156-163`). `playHand` builds the factory from
  the per-hand dealt-in count (`:207-208`) and creates each seat's policy once per hand (`:219`). `runPlaytest`
  (`:288-322`) passes `seams` through. `PlaytestOptions` is at `:47-53`.
- CLI: `parseArgs` (`src/playtest/cli.ts:69-140`) handles strict values with one error per problem. Exit codes are
  0/1/2 (`main`, `:249-285`). `USAGE` is at `:37-40`, and `tests/playtest/cli.test.ts:90` pins it exactly. Header
  Options line: `:268-269`. Replay line: `:207-210`.
- Tests: vitest. `*.acceptance|perf|property.test.*` run in `npm run test:sweeps` (no coverage). Everything else runs
  in `npm run test:unit` with coverage (`package.json` scripts). Coverage of new `src/bots` and `src/playtest` code
  must therefore come from non-acceptance test files. Slow tests use `const SLOW = process.env.TLH_SLOW_TESTS === '1'`
  with `it.runIf(SLOW)` (`tests/bots/maniac.test.ts:13`, `:176`), and the file must be listed in `test:slow`
  (`package.json`). CLI spawning helper pattern: `tests/playtest/playtest.acceptance.test.ts:17-31` (`spawnSync('npm',
  ['run','playtest','--',…])` with `sandboxEnv()`).
- Headless boundary (DoD#5): enforced by lint for `src/bots`, `src/playtest` etc. (`tools/lint/headless-boundary.js`,
  `tests/toolchain/boundary.test.ts`). `Math.random` is banned in bot code (`tests/toolchain/bot-determinism.test.ts`).
- Baseline: `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` =
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (re-run 2026-11-21 on `551c270`).
- Existing code to reuse:
  - `src/table/advice-service.ts:47-52` → move into `decideStyle` rather than writing a second dispatch.
  - `src/playtest/policy.ts:10-12` `seededTagPolicy`, `:16-22` `randomMovePolicy`, `seatGenerator` → the line-up
    factory's TAG user and random fallback.
  - `src/engine/bot-random.ts` `botRandom`, `botDecisionSeed` → per-decision bot generators, the same as the worker.
  - `tests/playtest/playtest.acceptance.test.ts:17-31` → spawn helper pattern for the CLI tests.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Without `--lineup`, the playtest keeps today's policies (all TAG at 6, random elsewhere). The default run stays byte-identical to SHA `aacd5e94…e01`. | Make Mixed the default line-up | REQ-062's fit run and every earlier baseline stay valid. A 10,000-hand default Mixed run would take about 80 s instead of under 1 s. | yes | user (Q-3, auto-accepted) |
| D-2 | Line-up policies play their style only in hands with exactly 6 dealt-in seats. In other hands every seat (user included) plays `randomMovePolicy(seatGenerator(code, seat))`, exactly as `defaultPolicyFactory` does. | Block on TASK-7.6; run AC#6 at size 6 | The advice has only a 6-max chart (§3). This matches existing playtest behaviour, so at size 9 `--lineup` changes the header only. | yes | user (Q-1, auto-accepted) |
| D-3 | AC#8: 10,000-hand 6-max Maniac line-ups go in the opt-in slow group (`TLH_SLOW_TESTS=1`, `npm run test:slow`). The normal suite runs 200-hand line-ups. No equity cache. | Memoise `computeEquity` in the playtest | Measured: 577 equity calls over 500 one-Maniac hands, 577 unique inputs, 0 cache hits (hole cards plus board almost never repeat). This follows the standing slow-tests rule (2026-11-21). | no | n/a |
| D-4 | The style dispatch lives in `src/bots/decide.ts`. `lineup.ts` imports only types, so the future Game Config can import it without pulling in the bot and advice code. | Put the dispatch in lineup.ts; import it from `src/table` into the playtest | Keeps the line-up module pure and light, and leaves one dispatch for the worker and the playtest. | no | n/a |
| D-5 | Names: `BOT_NAMES = ['Ava', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy']` (9 entries, enough for 9 bots at 10 seats), handed out in fixed order clockwise from the user (A-1). | Seeded shuffle of a longer list; another list | User-visible text. Extends today's Ava–Eli (`src/table/session.ts:59`) and avoids "You". | yes | user (Q-2, auto-accepted) |

## 5. Design

### Files to create / modify
- `src/bots/lineup.ts` — new: presets, names, `seatLineUp`.
- `src/bots/decide.ts` — new: `decideStyle`.
- `src/table/advice-service.ts` — `decideBotDefault` becomes `decideStyle`. Drop the four direct bot imports.
- `src/playtest/policy.ts` — `lineUpPolicyFactory`.
- `src/playtest/runner.ts` — `PlaytestOptions.lineUp`, wired in `runPlaytest`.
- `src/playtest/cli.ts` — `--lineup` parsing, USAGE, header lines, replay suffix.
- `package.json` — add `tests/playtest/lineup.acceptance.test.ts` to `test:slow`.
- `tests/bots/lineup.acceptance.test.ts` — new: AC#1–AC#5.
- `tests/bots/lineup.test.ts` — new: unit cases and errors (coverage).
- `tests/playtest/lineup.acceptance.test.ts` — new: AC#6, AC#7, short runs, the slow AC#8 runs.
- `tests/playtest/policy.test.ts` — `lineUpPolicyFactory` units.
- `tests/playtest/cli.test.ts` — USAGE text, `--lineup` parse cases, header and replay line.

### Components, interfaces and data
`src/bots/lineup.ts` (type-only imports):
```ts
export type LineUpPreset = 'Mixed' | 'Tough' | 'Soft';
export const LINE_UP_PRESETS: readonly LineUpPreset[]; // ['Mixed', 'Tough', 'Soft'], frozen
export const BOT_NAMES: readonly string[];             // ['Ava','Ben','Cal','Dee','Eli','Fay','Gus','Hal','Ivy'] (Q-2), frozen
export interface LineUpSeat {
  readonly seat: number;                 // 1..size
  readonly kind: 'user' | 'bot';
  readonly style: StyleName | null;      // null only for the user
  readonly name: string | null;          // null only for the user
}
/** Ascending seat order, length size. Throws RangeError on bad input (§ Errors). */
export function seatLineUp(preset: LineUpPreset, size: number, userSeat: number): readonly LineUpSeat[];
```
`src/bots/decide.ts`:
```ts
/** Rock → decideRock(view) (draws nothing); Maniac → decideManiac(view, {random});
 *  Calling station → decideCallingStation(view, {random}); TAG → decideTag(view, {random}). */
export function decideStyle(view: PlayerView, style: StyleName, random: BotRandom): Action;
```
`src/table/advice-service.ts`: `const decideBotDefault = decideStyle;`. `AdviceDeps.decideBot`'s type is unchanged
(`Xoshiro128` satisfies `BotRandom`).

`src/playtest/policy.ts`:
```ts
/** Seat 1 = user (seededTagPolicy), seats 2..size = seatLineUp(preset, size, 1) styles, each deciding with
 *  botRandom(botDecisionSeed(code, view)) — but in a hand whose view.players.length !== 6 every seat plays
 *  randomMovePolicy(seatGenerator(code, seat)) (D-2). Throws RangeError via seatLineUp for a bad size. */
export function lineUpPolicyFactory(preset: LineUpPreset, size: number): (code: ReplayCode, seat: SeatNumber) => SeatPolicy;
```
The random fallback policy for a seat is created once, when the factory is called for that hand and seat, so its
generator runs across that seat's decisions exactly like `defaultPolicyFactory`'s.

`src/playtest/runner.ts`: `PlaytestOptions` gains `readonly lineUp?: LineUpPreset`. In `runPlaytest`, when `lineUp`
is set and `seams.makePolicy` is undefined, every hand uses `makePolicy = lineUpPolicyFactory(lineUp, size)`. An
explicit seam always wins.

`src/playtest/cli.ts`: `--lineup` joins `VALUE_OPTIONS`. Run options and the replay variant of `ParsedArgs` gain
`lineUp?: LineUpPreset`. `formatReport(header, summary, mode = 'run', lineUp?: string)` passes the CLI name through to
the Replay line.

### Rules and algorithms
- R-1 Bot order: the user's seat is `u` and the size is `n`. Bot `k` (k = 1..n−1) sits at seat `((u − 1 + k) mod n) + 1`.
  Seats are numbered clockwise (REQ-009.8).
- R-2 Mixed: bot `k` gets `['TAG','Calling station','Maniac','Rock'][(k − 1) mod 4]`.
- R-3 Tough: n = 2 → the single bot is TAG (REQ-009.7). n ≥ 3 → bot 1 is Maniac, every other bot is TAG.
- R-4 Soft: odd k → Calling station, even k → Rock.
- Names: bot `k` gets `BOT_NAMES[k − 1]` (A-1). The user's seat has `style: null, name: null`.
- Worked examples:
  - Mixed, n=6, u=4: seats 5, 6, 1, 2, 3 → TAG, Calling station, Maniac, Rock, TAG (AC#1).
  - Tough, n=6, u=4: seat 5 Maniac, seats 6, 1, 2, 3 TAG (AC#2).
  - Soft, n=5, u=5: seats 1, 2, 3, 4 → Calling station, Rock, Calling station, Rock.
  - Tough, n=2, u=2: seat 1 TAG. Tough, n=3, u=3: seat 1 Maniac, seat 2 TAG.
  - Playtest `--size 9 --lineup tough`: u = 1, so seat 2 Maniac and seats 3–9 TAG (AC#6).
- R-5 CLI output with `--lineup <name>`:
  - Options line: `Options: --hands H --seed S --size N[ --game sng] --lineup <name>`. Replay mode:
    `Options: --replay-code C --size N --button B[<game/stacks suffix>] --lineup <name>`.
  - Right after the Table line: `Line-up: <name>, seat 1 plays the user, seat 2 <Name> (<Style>), seat 3 <Name> (<Style>), …`
    through seat N, in seat order.
  - If N ≠ 6 or the game is sng, the next line is
    `Line-up note: styles play only in hands with 6 seats dealt in; other hands use random moves until advice covers other table sizes.`
  - Violation block (run mode): the `Replay:` line ends with ` --lineup <name>`.
  - Without `--lineup`, the output is unchanged byte for byte.
  - USAGE: both usage lines gain ` [--lineup <mixed|tough|soft>]`. A third line follows the Defaults line:
    `--lineup: seat 1 plays the user (TAG) and seats 2 and up play the preset's styles; without it every seat plays TAG at 6 seats and random moves at other sizes\n`.

### Error handling and configuration
- `seatLineUp`: `RangeError('Table size must be a whole number from 2 to 10')` when the size isn't an integer in
  2..10. `RangeError('User seat must be a whole number from 1 to the table size')`. `RangeError('Unknown line-up
  preset: <p>')`.
- CLI: `--lineup` with any value other than `mixed`, `tough`, `soft` → stderr
  `Error: --lineup must be mixed, tough or soft.\n` + USAGE, nothing on stdout, exit 2, no hand played.
  `--lineup` with no value → the existing `Error: --lineup needs a value.`, given twice → the existing
  `Error: --lineup given more than once.`
- No new configuration, environment variables (apart from the existing `TLH_SLOW_TESTS`) or dependencies.

## 6. Behaviour specification

### SPEC-01: Mixed at 6 players, user at seat 4
- Verifies: AC#1, DoD#1
- Behaviour: Given `seatLineUp('Mixed', 6, 4)`, When styles are assigned, Then seat 4 is `{kind: 'user', style: null,
  name: null}` and seats 5, 6, 1, 2, 3 have styles TAG, Calling station, Maniac, Rock, TAG.
- Verification: acceptance `tests/bots/lineup.acceptance.test.ts::AC#1 Mixed at 6 players with the user at seat 4`

### SPEC-02: Tough at 6 players, user at seat 4
- Verifies: AC#2
- Behaviour: Given `seatLineUp('Tough', 6, 4)`, When styles are assigned, Then seat 5 is the only `Maniac` and seats 6,
  1, 2 and 3 are `TAG`.
- Verification: acceptance `tests/bots/lineup.acceptance.test.ts::AC#2 Tough at 6 players with the user at seat 4`

### SPEC-03: Every preset, size and user seat follows the rule
- Verifies: AC#3
- Behaviour: Given each preset, every size n in 2..10 and every user seat u in 1..n (162 line-ups), When styles are
  assigned, Then the result has n entries in ascending seat order, exactly one `user` entry at u with style null, and
  for bot k at seat `((u − 1 + k) mod n) + 1`: Mixed = cycle[(k−1) mod 4]. Tough at n ≥ 3: bot 1 Maniac, all others
  TAG, exactly one Maniac. Soft: Calling station for odd k, Rock for even k. The expected styles are computed in the
  test by walking seats clockwise from u, independently of the implementation's formula.
- Verification: acceptance `tests/bots/lineup.acceptance.test.ts::AC#3 every preset, size and user seat follows the preset rule`

### SPEC-04: Heads-up Tough seats one TAG
- Verifies: AC#4
- Behaviour: Given `seatLineUp('Tough', 2, u)` for u = 1 and 2, When styles are assigned, Then the single bot's style is
  `TAG` and no seat is Maniac.
- Verification: acceptance `tests/bots/lineup.acceptance.test.ts::AC#4 heads-up Tough seats a single TAG`

### SPEC-05: Bot names are unique within the table
- Verifies: AC#5
- Behaviour: Given each preset, every size 2..10 and every user seat, When bots are seated, Then every bot has a
  non-empty name, the n−1 bot names are pairwise distinct, every name is in `BOT_NAMES`, and `BOT_NAMES` has at least 9
  distinct entries.
- Verification: acceptance `tests/bots/lineup.acceptance.test.ts::AC#5 no two bots share a display name`

### SPEC-06: seatLineUp input errors and purity
- Verifies: AC#3, DoD#4
- Behaviour: Given sizes 1, 11, 2.5 and NaN, Then `seatLineUp` throws `RangeError` with the size message. Given user
  seats 0, n+1 and 1.5, Then it throws the user-seat message. Given preset `'Custom'` (cast), Then it throws
  `Unknown line-up preset: Custom`. Two calls with the same arguments return deep-equal results. Soft n=5 u=5 and
  Tough n=3 u=3 match §5's worked examples.
- Verification: unit `tests/bots/lineup.test.ts::seatLineUp rejects bad input and matches the worked examples`

### SPEC-07: Shared style dispatch
- Verifies: DoD#2, DoD#4
- Behaviour: Given a preflop and a flop view and seeds 0, 12345, 4294967295, When `decideStyle(view, style,
  botRandom(seed))` runs for each of the four styles, Then it equals the corresponding bot's decision
  (`decideRock(view)`, `decideManiac(view, {random})`, …). The existing `handleAdviceRequest` dispatch tests in
  `tests/table/advice-service.test.ts` pass unchanged.
- Verification: unit `tests/table/advice-service.test.ts::decideStyle matches each bot's own decision`

### SPEC-08: Line-up policies in the playtest runner
- Verifies: AC#6, DoD#6
- Behaviour: Given the line-up runner, When these runs are compared, Then:
  - Given `runPlaytest({hands: 200, seed: 42, size: 6, lineUp: 'Tough'})`, Then its summary deep-equals a run with
    `makePolicy` set to: seat 2 `decideManiac(view, {random: botRandom(botDecisionSeed(code, view))})`, every other seat
    `seededTagPolicy(code)`. Its `violations` is 0.
  - Given `runPlaytest({hands: 500, seed: 42, size: 9, lineUp: 'Tough'})`, Then its summary deep-equals
    `runPlaytest({hands: 500, seed: 42, size: 9})` (D-2 fallback).
  - Given an explicit `seams.makePolicy`, Then it overrides `lineUp`.
- Verification: unit `tests/playtest/policy.test.ts::lineUpPolicyFactory plays the preset at 6 seats and random moves otherwise`

### SPEC-09: `--lineup tough` at 9 players, 10,000 hands
- Verifies: AC#6, DoD#6
- Behaviour: Given `npm run playtest -- --hands 10000 --seed 42 --size 9 --lineup tough`, When it runs, Then it exits 0.
  Stdout contains `Options: --hands 10000 --seed 42 --size 9 --lineup tough`, `Hands played: 10000` and
  `Invariant violations: 0`. The `Line-up:` line starts `Line-up: tough, seat 1 plays the user, `, and parsing
  `seat (\d+) (.+?) \(([^)]+)\)` gives seat 2 → `Maniac` and seats 3–9 → `TAG` (eight bot entries, distinct names).
  The `Line-up note:` line is present. The same command run twice gives byte-identical stdout.
- Verification: acceptance `tests/playtest/lineup.acceptance.test.ts::AC#6 tough line-up at 9 players seats the Maniac at seat 2 and plays 10,000 clean hands`

### SPEC-10: An unknown line-up name is rejected without playing
- Verifies: AC#7
- Behaviour: Given `npm run playtest -- --lineup` with each of `loose`, `Tough`, `custom`, `""` (empty), When it starts,
  Then it exits 2. Stderr starts with `Error: --lineup must be mixed, tough or soft.` and contains `mixed`, `tough`,
  `soft` and the usage line. Stdout has no `Hands played:` line. `--lineup` with no value exits 2 with
  `Error: --lineup needs a value.`
- Verification: acceptance `tests/playtest/lineup.acceptance.test.ts::AC#7 an unknown line-up name prints the valid names and exits non-zero`

### SPEC-11: Each preset plays a clean short 6-max run
- Verifies: AC#8, DoD#6
- Behaviour: Given `main(['--hands','200','--seed','42','--lineup',p])` for p in mixed, tough, soft, When it runs,
  Then it exits 0 with `Invariant violations: 0`. The Line-up line lists seats 2–6 as: mixed → TAG, Calling station,
  Maniac, Rock, TAG. tough → Maniac, TAG ×4. soft → Calling station, Rock, Calling station, Rock, Calling station.
  There's no `Line-up note:` line. These runs take a few seconds in total, with no timing assertion.
- Verification: acceptance `tests/playtest/lineup.acceptance.test.ts::each preset plays 200 clean 6-max hands`

### SPEC-12: 10,000-hand Maniac line-ups are measured in the opt-in slow group
- Verifies: AC#8, DoD#6
- Behaviour: Given `TLH_SLOW_TESTS=1`, When `npm run playtest -- --hands 10000 --seed 42 --size 6 --lineup tough` and
  `… --lineup mixed` run (spawned), Then each exits 0 with `Invariant violations: 0`. Each run's wall time is printed
  (`console.log`) and is under 300 s (measured about 57 s and 80 s, §9). Without `TLH_SLOW_TESTS=1` the test is
  skipped (`it.runIf(SLOW)`), and `package.json`'s `test:slow` includes the file.
- Verification: acceptance `tests/playtest/lineup.acceptance.test.ts::AC#8 10,000-hand Maniac line-ups stay practical (slow, opt-in)`

### SPEC-13: CLI parsing, header and replay line
- Verifies: AC#7, DoD#4
- Behaviour: Given the CLI with `--lineup`, When it parses and reports, Then:
  - `parseArgs(['--lineup','soft'])` → run options with `lineUp: 'Soft'` and the defaults.
  - `parseArgs(['--replay-code',C,'--lineup','mixed'])` → replay with `lineUp: 'Mixed'`.
  - Each bad value → `{kind:'error', message:'Error: --lineup must be mixed, tough or soft.'}`. Duplicate → `given
    more than once`.
  - `USAGE` equals the R-5 text exactly (the existing exact USAGE assertion is updated to it).
  - A faulty-engine run with `--lineup tough` (seams as in the existing cli tests) prints a `Replay:` line ending
    ` --lineup tough`.
  - `--size 3 --lineup soft` prints the `Line-up note:` line, and `--game sng --lineup soft` prints it too.
- Verification: unit `tests/playtest/cli.test.ts::--lineup parsing, header lines and replay suffix`

### SPEC-14: The default playtest is unchanged
- Verifies: DoD#6
- Behaviour: Given `npm run -s playtest -- --hands 10000 --seed 42 --size 6`, Then stdout's SHA-256 is
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`, with `Invariant violations: 0` (D-1).
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-15: Checks, coverage, boundaries, CI and documentation
- Verifies: DoD#2, DoD#3, DoD#4, DoD#5, DoD#7, DoD#8, DoD#9, DoD#10, DoD#11, DoD#12
- Behaviour: Given the finished change, When the checks run, Then:
  - `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, and coverage holds (≥ 90%
    engine/bots/advice/statistics, ≥ 70% overall). `lineup.ts`, `decide.ts` and the new playtest code are covered by
    the unit tests (SPEC-06, SPEC-07, SPEC-08, SPEC-13).
  - The headless boundary lint and the bot-determinism guard are clean for `src/bots/lineup.ts` and
    `src/bots/decide.ts` (no UI or browser imports, no `Math.random`). `lineup.ts` has type-only imports.
  - CI is green on `doit/TASK-6.6`.
  - A story doc is published with `backlog doc`. It covers the preset rules with worked examples, the name list, the
    `--lineup` option and output, the size-6 fallback (Q-1), and the §9 timings, including the 0% cache-hit
    measurement.
  - Not applicable: DoD#3 (no golden-spot suite yet, E07-S14), DoD#7 and DoD#12 (no screen or dialog), DoD#8 (no
    network code). DoD#9: the bot names are original plain first names (Q-2); no chart, range or golden spot changes.
- Verification: command `npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- Heads-up (n = 2): one bot. Tough → TAG (SPEC-04), Mixed → TAG, Soft → Calling station (SPEC-03).
- User at the last seat (u = n): bot 1 wraps to seat 1 (SPEC-03 covers every u, SPEC-06 Soft n=5 u=5).
- Max table (n = 10): 9 bots need 9 distinct names (SPEC-05).
- Mixed cycle longer than the bot count (n ≤ 4) and wrapping (n ≥ 6): SPEC-03.
- Sit-and-go with `--lineup`: seats bust and drop below 6 dealt in. Those hands use random moves (D-2), and the note
  line is printed (SPEC-13). Invariants are still checked.
- Invalid input: bad preset, size or seat (SPEC-06). Bad, missing or duplicate CLI value (SPEC-10, SPEC-13).
- Replay of a violating line-up hand (A-5, SPEC-13).
- Concurrency, interruption, permissions: N/A. These are pure functions and a single-process CLI.

## 8. Security considerations
- Trust boundary: CLI argv only. `--lineup` is matched against three literals, and anything else is rejected before
  any play (SPEC-10). Nothing is interpolated into shell or file paths.
- Authn/authz, secrets, sensitive data in logs: N/A (no accounts, no personal data; names are fixed literals).
- New dependencies: none.
- Randomness: seat styles and names are deterministic (A-1). Bot decisions keep using the existing seeded
  `botRandom(botDecisionSeed(…))`, so there's no CSPRNG question and no `Math.random` (guarded by
  `tests/toolchain/bot-determinism.test.ts`).

## 9. Non-functional
- Measured on this machine (2026-11-21, prototype via `runPlaytest` seams, seed 42):
  - 6-max, seat 2 Maniac, others seeded TAG (= `--lineup tough`): 500 hands in 2.87 s, so about 57 s per 10,000.
  - 6-max Mixed (TAG, CS, Maniac, Rock, TAG plus a TAG user): 300 hands in 2.41 s, so about 80 s per 10,000.
  - `--size 9` (random moves, = `--size 9 --lineup tough` under D-2): 10,000 hands in 0.8 s.
  - Equity memo keyed on the full input: 577 calls, 577 unique, 0 hits. Caching doesn't help (D-3).
- Normal suite (every push): the new tests add about 6 s to the sweeps shard (SPEC-09 about 1–2 s, SPEC-11 about 4 s,
  SPEC-10 about 1 s) and about 2 s to unit (SPEC-08 200 + 1,000 hands). There are no timing assertions there.
- Slow group: SPEC-12 takes about 2.5 minutes. Its timing bound is 300 s per run.
- Determinism: same options give identical output (REQ-062.4; SPEC-09).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run -s playtest -- --hands 10000 --seed 42 --size 9 --lineup tough`
- New tests:
  - `tests/bots/lineup.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05
  - `tests/bots/lineup.test.ts` → SPEC-06
  - `tests/table/advice-service.test.ts` → SPEC-07
  - `tests/playtest/policy.test.ts` → SPEC-08
  - `tests/playtest/lineup.acceptance.test.ts` → SPEC-09, SPEC-10, SPEC-11, SPEC-12
  - `tests/playtest/cli.test.ts` → SPEC-13
- End-to-end for the Judge: run the Run command and check the `Line-up:` line (seat 2 Maniac, seats 3–9 TAG),
  `Invariant violations: 0` and exit 0. Run `npm run playtest -- --lineup loose` and check the error and exit 2. Run
  `npm run -s playtest -- --hands 10000 --seed 42 --size 6 --lineup mixed` and check that it finishes in a couple of
  minutes with 0 violations. Run the SPEC-14 SHA command.

## 11. Open questions
None. Q-1 (D-2), Q-2 (D-5, A-1) and Q-3 (D-1) were answered by auto-accepting the recommended options (`doit/TASK-6.6/qa.md`, 2026-11-22).

## 12. Clarifications log
See `doit/TASK-6.6/qa.md`.
