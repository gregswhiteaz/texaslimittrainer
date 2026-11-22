# Spec: TASK-6.8 — Replace a busted bot with a new bot from the line-up preset

Status: READY (approved 2026-11-22)
Task: TASK-6.8 · Parent/epic: TASK-6 · Requirements: REQ-007.5, REQ-007.7, REQ-007.8, REQ-009.4, REQ-062.4 · Dream: limit-holdem-trainer

## 1. Summary
In a cash game, a bot that ends a hand on $0 leaves, and before the next hand a new bot takes its seat with a fresh
buy-in of 20 big bets. The new bot's style is drawn at random from the styles the session's line-up assigns at the
table size (all four for Custom), and it gets a display name that no bot at the table has. The draw is seeded from the
finished hand's replay code, so sessions and playtests reproduce exactly. The same rule replaces the playtest's
in-runner stack restore for `--lineup` cash runs. A bot with $1 or more keeps its seat and its stack.

## 2. Scope
- In scope:
  - Pure replacement rules in `src/bots/lineup.ts`: which styles a replacement may have, the seeded style draw, and
    the replacement-name sequence.
  - A replacement generator in `src/engine/bot-random.ts`, derived from the replay code and seat (TASK-6.18 rule).
  - `nextHand` (cash): a bot on $0 is replaced (new name, drawn style, $160 at $4/$8). A bot with $1–$95 keeps its
    stack (AC#2). The user seat keeps the TEMPORARY top-up. Sit-and-go is unchanged.
  - Playtest runner, `--lineup` cash runs: busted bots are replaced by the same rule. Seat-by-seat styles drive the
    policies. Each played hand reports the seats in effect and which seats are new.
  - Playtest CLI, `--lineup` cash runs: a `Bots replaced: <n>` summary line. A violation's Replay line carries the
    replaced styles, and replay mode takes a new `--styles` option (Q-3).
  - Tests for AC#1–#9. Opt-in slow test for the 10,000-hand `--lineup mixed` run (AC#6).
- Not doing:
  - Sit-and-go seats: no refill and no change to sit-and-go behaviour (E05, TASK-5.2).
  - The user's bust: no Rebuy / Leave table dialog (TASK-3.11). The user seat keeps the TEMPORARY top-up in the app and
    rebuys for $160 in the playtest.
  - Removing the TEMPORARY top-up line or its comment (TASK-3.21). It stays for the user seat and for sit-and-go.
  - Observed stats, bot instance ids beyond the unique name, initials/avatars (REQ-031.3 and REQ-070.3 stories).
  - Any UI change: no "left / joined" message and no animation. The table shows the new name and stack through the
    existing views.
  - Default playtest runs (no `--lineup`): output stays byte-identical (D-4).
  - Persisting the session (TASK-3.10).
- Scope budget: files=15, lines=700

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The session keeps the preset chosen at the start (`config.lineUp`) for every replacement draw, even after replacements change seat styles. `config.seats` stays as seated. Only `TableState.seats` changes. | yes | REQ-007.5 draws from "the session's line-up preset". `TableState.seats` is already separate from `config.seats` (`src/table/session.ts:147`). | Re-resolve the line-up name after each replacement. That would turn most sessions into Custom and widen the draws. |
| A-2 | The "current table size" is `config.players` (cash seats never empty). | yes | In cash every seat is always dealt in (`src/table/session.ts:219`). | Count the dealt-in seats. |
| A-3 | Several bots busting in one hand are replaced in ascending seat order, and each takes the next name in the sequence. | yes | Deterministic and simple. | Random order. |
| A-4 | In a playtest, a table restarted after a violation (runner A-2/A-3) returns to the preset line-up, and the name sequence restarts at its first name. | yes | A restarted table is a new table. Violations are expected to be zero. | Keep the replaced seats across the restart. |
| A-5 | The playtest's Table line keeps its text ("a busted seat rebuys for $160") in `--lineup` runs. The new `Bots replaced:` line reports the replacements. | yes | Three locked tests pin the text of the default runs' Table line (`tests/playtest/heads-up.acceptance.test.ts:27`, `games.acceptance.test.ts:169`, `playtest.acceptance.test.ts:72`). Each chip amount stays the same. | Use a different Table line in `--lineup` runs. |
| A-6 | `nextHand` throws `RangeError('No replay code to draw a new bot from')` when a bot must be replaced but `table.replayCode` is null. | yes | This only happens with hand-built states. The app always deals with a code. | Fall back to a fixed code. |

## 3. Current system
- Stack carry-over: `nextHand` (`src/table/session.ts:215-236`) tops up every seat below `minimumStack` ($96 at
  $4/$8, `src/engine/hand.ts:137`) to the buy-in. The line is marked `TEMPORARY (TASK-3.4 Q-4)`
  (`src/table/session.ts:221-223`). The engine has handled all-ins since TASK-1.9, and `createHand` accepts any stack
  of $1 or more (`src/engine/hand.ts:179-183`). So a $1 stack can be dealt in (AC#2).
- `buyIn(stake) = 20 × bigBet` (`src/table/session.ts:41`). `startingStack`, `tableStake` (`:114-121`).
- `TableState` (`src/table/session.ts:144-158`) carries `seats` separately from `config.seats`. `completedHand`
  (`:313`) records `table.seats`, so a replacement's name and style appear in the hand record.
- `botTurn` reads the seat's style from `table.seats` (`src/table/session.ts:257`), so a replaced bot plays its drawn
  style in the app.
- The UI deals through `dealHand(nextHand(t), code)` with `code = newReplayCode()` (`src/ui/table/useTableSession.ts:57,109,123`).
  `e2e/next-hand.spec.ts:20-30` counts `crypto.getRandomValues` draws per hand. The replacement draw must not add
  any.
- Line-ups: `seatLineUp`, `BOT_NAMES` (9 names), `presetStyle`, `MIXED_CYCLE` (`src/bots/lineup.ts:7-65`).
  `LineUpName` includes `'Custom'` (`src/table/session.ts:73`).
- Seeded randomness: `seatGenerator(code, seat) = new Xoshiro128(fnv1a32(`${code}/${seat}`))`
  (`src/engine/bot-random.ts:16`). `Xoshiro128.nextIntUnbiased(n)` draws exactly uniformly
  (`src/engine/seeded-random.ts:91`).
- Playtest: `runPlaytest` (`src/playtest/runner.ts:306-343`). On a clean hand it maps a $0 seat to `startingStack`
  when `rules.rebuy` (`:330`), which is the in-runner stack restore. `handReplayCode(seed, k, game)` (`:147`).
  `lineUpPolicyFactory(preset, size)` fixes styles per seat for the whole run (`src/playtest/policy.ts:31-45`).
  `checkDeal(state, previous, rebuy)` already accepts a $0 → startingStack seat across hands (`src/engine/invariants.ts:483`).
- CLI: `main`, `formatReport`, `violationBlock`, `lineUpLines`, `parseArgs`, `USAGE` (`src/playtest/cli.ts`).
- Tests: Vitest. `npm test` runs everything with coverage. Slow checks are gated by `TLH_SLOW_TESTS=1` and listed in
  `test:slow` (`package.json` scripts; pattern at `tests/playtest/lineup.acceptance.test.ts:6,120`). A 10,000-hand
  `--lineup mixed` run takes about 72 s (TASK-6.6), so it belongs in the slow group.
- Baseline: default run `npm run -s playtest -- --hands 10000 --seed 42 --size 6` has stdout SHA-256
  `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (`doit/TASK-6.5/spec.md:388`).
- Existing code to reuse:
  - `src/bots/lineup.ts` `seatLineUp` → the styles a preset assigns at a size (replacement style set) and the
    starting playtest seats.
  - `src/engine/seeded-random.ts` `fnv1a32`, `Xoshiro128.nextIntUnbiased` → the seeded uniform draw.
  - `src/table/session.ts` `buyIn`, `tableStake` → the fresh buy-in.
  - `src/playtest/policy.ts` `seededTagPolicy`, `randomMovePolicy`, `decideStyle` wiring → the per-seat styles
    policy factory, which `lineUpPolicyFactory` then delegates to.
  - `tests/support/table-scenarios.ts` `KINGS_SHOWDOWN` and the `withFinalStacks` pattern
    (`tests/table/next-hand.acceptance.test.ts:41`) → the $0 / $1 table states.
  - `tests/support/sandbox.ts` `REPO_ROOT`, `sandboxEnv` → spawning `npm run playtest` in the slow test.

### Locked tests affected (cross-story; edits approved by the user, Q-4)
| Locked test (owner) | Assertion | Why it must change |
|---|---|---|
| `tests/table/next-hand.acceptance.test.ts` (TASK-3.4), lines 93-96 | After seat 1 (bot Ava, TAG) ends on $0, `edge.seats` equals the old seats and seat 1 is still Ava/TAG | AC#1/AC#9 require a new bot with a new name at that seat. No design satisfies both. |
| same file, lines 115-141 | Over 60 seeded hands at least one stack is topped up (`topUps > 0`) | The only top-up in those hands is bot seat 2 at $94 after hand 43 (measured). Under AC#2 that bot keeps $94, so `topUps` becomes 0. |
| `tests/playtest/policy-lineup.acceptance.test.ts` (TASK-1.52), lines 18-27 | `runPlaytest({hands:200, seed:42, size:6, lineUp:'Tough'})` equals the same run with a fixed Maniac-at-seat-2 policy | Under seed 42, seat 2 busts after hand 45 and seat 6 after hand 115 (measured). AC#5/#6 require these seats to be refilled with drawn styles. Under the recommended draw seat 6 becomes a Maniac, so the runs diverge. A different salt that happened to keep them equal would only be a coincidence. |
No other locked test pins behaviour that changes. The default playtest output is unchanged, and the Table lines, USAGE
line 1 and `lineUpPolicyFactory`'s signature are kept.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Seed: `replacementGenerator(code, seat) = new Xoshiro128(fnv1a32(`${code}/${seat}/replace`))`, where `code` is the finished hand's replay code. Style = `styles[gen.nextIntUnbiased(styles.length)]`, uniform over the distinct allowed styles. | Weight by preset seat counts (Mixed at 6: TAG 2/5). A session-level generator seeded at the start (needs persisted state). `crypto` (not reproducible). | Follows TASK-6.18 (bot randomness only from the replay code and seat). Adds no crypto draw (`e2e/next-hand.spec.ts:30`). Replays from session memory (TASK-6.20) need nothing extra. Uniform matches "drawn at random from the styles". | yes | user (Q-1) |
| D-2 | Names: the replacement sequence is `REPLACEMENT_NAMES` = Jay, Kit, Lou, Max, Ned, Oli, Pip, Quin, Ray, Sam, Tom, Uma, Val, Wes, Xia, Yul, Zed (17 names, initials J–Z, none shared with `BOT_NAMES`), then the same 17 with " 2", then " 3", and so on. The session keeps its position in the sequence, so no name is reused within a session. A name already at the table is skipped. | Reuse the departed bot's name. Random names from a pool. "Ava 2" style suffixes from the start. | Unique at the table (REQ-009.4) and never reused, so the name works as the bot-instance key E03 asks for. Distinct initials help REQ-070.3. Deterministic, so it reproduces. | yes | user (Q-2) |
| D-3 | Allowed styles: `Custom` → TAG, Calling station, Maniac, Rock. A preset → the distinct styles of `seatLineUp(preset, size, 1)`'s bots, in the order TAG, Calling station, Maniac, Rock. | A hard-coded table per size. | One source of truth with seating. Gives exactly the REQ-007.8 sets: Mixed 6 → 4 styles, Mixed 3 → TAG + Calling station, Tough ≥3 → TAG + Maniac, Tough 2 → TAG, Soft → Calling station + Rock (Soft 2 → Calling station). | no | n/a |
| D-4 | The default playtest (no `--lineup`) keeps its stack restore and its output byte for byte (SHA `aacd5e94…e01` unchanged). The replacement rule applies to `--lineup` cash runs. | Treat default runs as Custom and draw styles. That would change nothing at the table (all seats play TAG or random moves) but would need new output lines and a new baseline. | A default run has no preset to draw from, and a refilled seat gets the same $160 and the same policy. The locked default-run tests and the baseline stay valid. | yes | user (Q-3) |
| D-5 | Playtest CLI for `--lineup` cash runs: a summary line `Bots replaced: <n>` after `Invariant violations:`. When a violating hand's bot styles differ from the preset, its Replay line appends ` --styles <s2>,…,<sN>` (slugs `tag`, `calling-station`, `maniac`, `rock`). Replay mode accepts `--styles` only together with `--replay-code` and `--lineup`. | No CLI change, so the Replay line could replay the wrong styles after a replacement. A follow-up task for `--styles`. | REQ-062: a violation's Replay line must reproduce the hand. Small addition on top of the per-seat policy factory this task needs anyway. | yes | user (Q-3) |
| D-6 | In cash `nextHand`, a bot keeps any stack ≥ $1 and is replaced at $0. The TEMPORARY top-up line stays and applies only to the user seat in cash and to every seat in a sit-and-go. | Remove the top-up entirely (TASK-3.21's job, and locked by `tests/table/next-hand.acceptance.test.ts:102-112`). | AC#2 and AC#9. Keeps the locked source-marker check (lines 102-112) green. | no | n/a |
| D-7 | No separate bot-instance id field on `SessionSeat`. The never-reused name identifies a bot instance until a stats story needs more. | Add `id` to `SessionSeat`. | Adding a field breaks locked `toEqual` checks on seats (e.g. `tests/table/session.acceptance.test.ts:200-205`). Stats don't exist yet. | no | n/a |

## 5. Design

### Files to create / modify
- `src/engine/bot-random.ts` — add `replacementGenerator`.
- `src/bots/lineup.ts` — add `REPLACEMENT_NAMES`, `replacementStyles`, `drawReplacementStyle`, `replacementName`,
  `nextReplacementName`.
- `src/table/session.ts` — `TableState.nextBotName`, `seatSession` sets it to 0, and `nextHand` applies the replacement rule (cash).
- `src/playtest/policy.ts` — add `seatStylesPolicyFactory(seats)`. `lineUpPolicyFactory` delegates to it (same
  signature and behaviour).
- `src/playtest/runner.ts` — the per-hand line-up in `--lineup` cash runs, replacement after clean hands, and
  `PlayedHand.lineUp` / `PlayedHand.replaced`.
- `src/playtest/cli.ts` — `Bots replaced:` line, `--styles` in Replay line and replay mode, USAGE line 2, and Line-up line from seats.
- `package.json` — add `tests/playtest/replacement.acceptance.test.ts` to `test:slow`.
- `tests/bots/replacement.acceptance.test.ts` — new: AC#3, AC#7, AC#8 tallies and the name sequence.
- `tests/table/replace-bot.acceptance.test.ts` — new: AC#1, AC#2, AC#4, AC#9 through `nextHand`.
- `tests/playtest/replacement.acceptance.test.ts` — new: AC#5, the fast AC#6 rule check, the opt-in slow AC#6 run,
  and the `--styles` replay check.
- `tests/bots/lineup.test.ts` — unit: errors and edges of the new lineup functions.
- `tests/playtest/cli.test.ts` — unit: `--styles` parsing errors, `Bots replaced:` absent in default/sng runs.
- `tests/table/next-hand.test.ts` — update unlocked expectations that assumed bot top-ups (e.g. line 89 `[0, 160, 160]`).
- `tests/table/next-hand.acceptance.test.ts` — locked (TASK-3.4). Edit approved by the user (Q-4).
- `tests/playtest/policy-lineup.acceptance.test.ts` — locked (TASK-1.52). Edit approved by the user (Q-4).

### Components, interfaces and data
`src/engine/bot-random.ts`
```ts
/** The generator for the new bot at `seat` after the hand dealt from `code` (REQ-007.5):
 *  new Xoshiro128(fnv1a32(`${code}/${seat}/replace`)). A separate stream from seatGenerator. */
export function replacementGenerator(code: ReplayCode, seat: SeatNumber): Xoshiro128;
```
`src/bots/lineup.ts`
```ts
/** Names for replacement bots, in order; initials J–Z, none shared with BOT_NAMES. */
export const REPLACEMENT_NAMES: readonly string[]; // ['Jay','Kit','Lou','Max','Ned','Oli','Pip','Quin','Ray','Sam','Tom','Uma','Val','Wes','Xia','Yul','Zed'], frozen
/** REQ-007.7/007.8: distinct styles a replacement may have, in order TAG, Calling station, Maniac, Rock.
 *  'Custom' → all four. RangeError: size not an integer 2..10, or unknown line-up name. */
export function replacementStyles(lineUp: LineUpName, size: number): readonly StyleName[];
/** styles[replacementGenerator(code, seat).nextIntUnbiased(styles.length)], styles = replacementStyles(lineUp, size).
 *  Pure. RangeError as replacementStyles, or on an invalid replay code. */
export function drawReplacementStyle(lineUp: LineUpName, size: number, code: ReplayCode, seat: SeatNumber): StyleName;
/** Name at `position` (integer ≥ 0) in the sequence: REPLACEMENT_NAMES[p mod 17], plus ` ${floor(p/17)+1}` when p ≥ 17.
 *  RangeError if position is not a non-negative safe integer. */
export function replacementName(position: number): string;
/** The first name at position ≥ `position` not in `seated`, and the position after it. */
export function nextReplacementName(position: number, seated: readonly string[]): { readonly name: string; readonly next: number };
```
`src/table/session.ts`
```ts
export interface TableState { …existing…;
  /** Position of the next replacement bot's name in the replacement-name sequence (0 at seating). */
  readonly nextBotName: number; }
```
`src/playtest/policy.ts`
```ts
/** Seat s plays seats[s-1]: user (style null) → seededTagPolicy; a bot → decideStyle with its style; in a hand whose
 *  view.players.length !== 6 every seat plays randomMovePolicy(seatGenerator(code, seat)) (D-2 of TASK-6.6). */
export function seatStylesPolicyFactory(seats: readonly LineUpSeat[]): (code: ReplayCode, seat: SeatNumber) => SeatPolicy;
// lineUpPolicyFactory(preset, size) === seatStylesPolicyFactory(seatLineUp(preset, size, 1)) in behaviour.
```
`src/playtest/runner.ts`
```ts
export interface PlayedHand { …existing…;
  /** --lineup runs only: seats 1..size at this hand's deal (seat 1 the user). */
  readonly lineUp?: readonly LineUpSeat[];
  /** --lineup runs only: bot seats whose bot is new at this hand (replaced after the previous hand), ascending. */
  readonly replaced?: readonly SeatNumber[]; }
```
`PlaytestSummary` and `PlaytestOptions` are unchanged. Keeping the summary shape keeps the locked summary
`toEqual` comparisons valid.

`src/playtest/cli.ts`
- `ParsedArgs` replay variant gains `styles?: readonly StyleName[]` (seats 2..size).
- `formatReport(header, summary, mode, lineUp, replaced?: number)`: when `replaced` is a number, it appends
  `Bots replaced: <n>` after `Invariant violations: <n>` and before the violation block.
- `USAGE` line 2 gains `[--styles <style of each seat from 2 up, comma-separated: tag|calling-station|maniac|rock>]`.
  Line 1 is unchanged.

### Rules and algorithms
**Session `nextHand` (replaces the stack mapping at `src/table/session.ts:219-224`):** for each `p` of `hand.players`
in ascending seat order, with `s = table.seats` entry of `p.seat`:
1. Sit-and-go, or `s.kind === 'user'` → unchanged TEMPORARY line: `stack < minimum ? buyIn(tableStake(config)) : stack`.
   The TEMPORARY comment and the `stack < minimum ? buyIn(` text stay within 3 lines of each other.
2. Cash bot with `p.stack === 0` → new seat `{ seat, kind: 'bot', name, style }` where
   `style = drawReplacementStyle(config.lineUp, config.players, table.replayCode, seat)` and
   `{name, next} = nextReplacementName(position, namesOfAllSeatsAfterEarlierReplacements)`. Stack `buyIn(config.stake)`.
3. Cash bot with `p.stack ≥ 1` → keeps `p.stack`.
Result: `seats` updated (same order and seat numbers), `nextBotName` = final position, and everything else as today
(button, hand number, nulls).

Worked example: default $4/$8 session (`lineUp: 'Custom'`, seats Ava, Ben, Cal, Dee, You, Eli, `nextBotName 0`).
Final stacks [0, 222, 160, 160, 95, 0] lead to the following:
- Seat 1 becomes **Jay**, its style is `drawReplacementStyle('Custom', 6, code, 1)`, and it has $160.
- Seat 5 (the user) is topped up to $160 by the TEMPORARY line.
- Seat 6 becomes **Kit** with its own draw and $160.
- `nextBotName` = 2. Ben, Cal and Dee are unchanged.
With final stacks [1, …] instead, Ava stays at seat 1 with $1.

**Name sequence:** position p → `REPLACEMENT_NAMES[p % 17]` for p < 17, otherwise `${REPLACEMENT_NAMES[p % 17]} ${Math.floor(p / 17) + 1}`.
Examples: 0 → "Jay", 16 → "Zed", 17 → "Jay 2", 34 → "Jay 3". `nextReplacementName(0, ['Jay', …])` → `{name: 'Kit', next: 2}`.

**Playtest `runPlaytest` with `lineUp` and `game: 'cash'`:**
- `seats = seatLineUp(lineUp, size, 1)`, `position = 0`. Each hand k uses
  `makePolicy = seams.makePolicy ?? seatStylesPolicyFactory(seats)`, and its `PlayedHand` carries `lineUp: seats`
  and `replaced` (the seats replaced after hand k−1).
- After a clean hand k, for each seat 2..size ascending that ends on 0, apply the session rule with
  `code = handReplayCode(seed, k, 'cash')` and the preset as `lineUp`. The seat gets $160.
- Seat 1 (the user) on 0 rebuys for $160, as today.
- After a violation or abandoned hand, the table restarts with the preset seats and `position = 0` (A-4).
- `--lineup` with `--game sng`: no replacement. `lineUp` is the preset seats throughout, and `replaced` is always `[]`.
- Without `lineUp`: no change. There are no new fields and the `:330` restore is untouched.

**CLI:** `main` counts `replaced.length` over the hands through `runPlaytest`'s `onHand`, and passes that count to
`formatReport` only for `--lineup` cash runs. In `violationBlock`, when `hand.lineUp` has a bot seat whose style
differs from `seatLineUp(preset, size, 1)`, the Replay line ends with
` --lineup <name> --styles <slug of seat 2>,…,<slug of seat size>`.
In replay mode, `--styles` sets the policies via `seatStylesPolicyFactory`, with the preset names and the given
styles. The Line-up line and the Options echo (` --styles …`) show those styles.

### Error handling and configuration
- `replacementStyles` / `drawReplacementStyle`:
  - `RangeError('Table size must be a whole number from 2 to 10')` (same text as `seatLineUp`).
  - `RangeError('Unknown line-up: <name>')`.
- `replacementName`: `RangeError('Name position must be a whole number of at least 0')`.
- `nextHand`: `RangeError('No replay code to draw a new bot from')` (A-6). The existing
  `RangeError('Not a next-hand step')` is unchanged.
- CLI (exit 2 with USAGE):
  - `Error: --styles is only valid with --replay-code and --lineup.`
  - `Error: --styles must list tag, calling-station, maniac or rock for each seat from 2 to the table size.`
  - `--styles` given twice gives the existing `given more than once` error.

## 6. Behaviour specification

### SPEC-01: A bot on $0 is replaced by a new bot with $160 before the next hand
- Verifies: AC#1, AC#9, DoD#1
- Behaviour: Given a $4/$8 cash session (KINGS_SHOWDOWN with final stacks [0, 222, 160, 160, 96, 165]; seat 1 is bot
  Ava), When `nextHand` runs and the next hand is dealt with any code, Then the following hold:
  - `next.seats[0]` is `{seat: 1, kind: 'bot'}` with name `'Jay'` (≠ 'Ava') and a style in the four styles.
  - Seat 1's stack is 160, and the dealt hand's `startingStack` for seat 1 is 160.
  - Seats 2–6 keep their name, style and stack, and `next.nextBotName === 1`.
  - `completedHand` of the next hand lists seat 1 as Jay.
  - The style equals `drawReplacementStyle('Custom', 6, KINGS_SHOWDOWN.replayCode, 1)`.
- Verification: acceptance `tests/table/replace-bot.acceptance.test.ts::a bot on $0 is replaced by a new bot with $160 when nextHand runs`

### SPEC-02: A bot with $1 keeps its seat and its $1
- Verifies: AC#2
- Behaviour: Given final stacks [1, 222, 160, 160, 96, 165], When `nextHand` runs and the next hand is dealt, Then
  `next.seats` equals the old seats (Ava, TAG at seat 1), seat 1's stack is 1, and `next.nextBotName === 0`.
  The dealt hand has seat 1 with `startingStack` 1 and dealing does not throw. The same holds for a bot at $95.
- Verification: acceptance `tests/table/replace-bot.acceptance.test.ts::a bot with $1 keeps its seat and its stack`

### SPEC-03: Two bots busting in one hand both get new bots with unique names
- Verifies: AC#4
- Behaviour: Given final stacks [0, 222, 160, 160, 96, 0] (seats 1 and 6 are bots), When `nextHand` runs, Then the
  following hold:
  - Seat 1 is Jay and seat 6 is Kit, both with stack 160.
  - The six display names at the table are pairwise distinct, and `nextBotName === 2`.
  - When seat 1 (Jay) busts again on a later hand, its new bot is named Lou.
  - Given a hand-built session where a bot is already named 'Jay', a replacement skips to 'Kit'.
- Verification: acceptance `tests/table/replace-bot.acceptance.test.ts::two bots bust in one hand and the new bots have unique names`

### SPEC-04: The user is not replaced and a sit-and-go never refills by this rule
- Verifies: AC#9
- Behaviour: Only cash bots are replaced; the user and sit-and-go seats keep today's rule.
  - Given a cash session where the user seat (5) ends on $0 or $95, When `nextHand` runs, Then the user seat is still
    `{name: 'You', kind: 'user'}` with stack 160 (TEMPORARY top-up), and `nextBotName` is unchanged.
  - Given a sit-and-go session where a bot ends on 0, When `nextHand` runs, Then its seat entry is unchanged and its
    stack follows the existing sit-and-go rule (`buyIn(SIT_AND_GO_LEVEL_1)` = 800).
- Verification: unit `tests/table/next-hand.test.ts::the user and sit-and-go seats are never replaced`

### SPEC-05: Replacement styles per preset at 6 players over 10,000 seeded draws
- Verifies: AC#3
- Behaviour: Given codes `replayCodeFromWords([i, 6, 8, 3])` for i = 1..10,000 at seat 2, When
  `drawReplacementStyle(preset, 6, code, 2)` is tallied, Then the following hold:
  - Mixed gives exactly {TAG, Calling station, Maniac, Rock}, each at least once.
  - Tough gives exactly {TAG, Maniac}, each at least once.
  - Soft gives exactly {Calling station, Rock}, each at least once.
  - `replacementStyles` returns those lists in that order.
  - The test finishes in well under 1 s, so it stays in the normal suite.
- Verification: acceptance `tests/bots/replacement.acceptance.test.ts::10,000 replacements at 6 players draw only each preset's styles`

### SPEC-06: Custom draws from all four styles
- Verifies: AC#7
- Behaviour: Given 10,000 seeded draws as in SPEC-05 with line-up 'Custom' at sizes 6 and 2, When tallied, Then each
  tally is exactly {TAG, Calling station, Maniac, Rock}, each at least once.
- Verification: acceptance `tests/bots/replacement.acceptance.test.ts::a session recorded as Custom draws all four styles`

### SPEC-07: Mixed at 3 players and Tough at heads-up
- Verifies: AC#8
- Behaviour: Given 10,000 seeded draws, When `drawReplacementStyle('Mixed', 3, code, 2)` and
  `drawReplacementStyle('Tough', 2, code, 2)` are tallied, Then the following hold:
  - Mixed at 3 gives exactly {TAG, Calling station}, both at least once.
  - Tough at 2 gives exactly {TAG}.
- Verification: acceptance `tests/bots/replacement.acceptance.test.ts::Mixed at 3 players draws TAG or Calling station and heads-up Tough draws TAG`

### SPEC-08: Replacement draw and name sequence are deterministic and validated
- Verifies: AC#5, AC#4
- Behaviour: Given the new lineup functions, When called, Then:
  - Same inputs always give the same style.
  - `replacementName` gives the following: 0 → 'Jay', 16 → 'Zed', 17 → 'Jay 2', 34 → 'Jay 3'.
  - No `REPLACEMENT_NAMES` entry is in `BOT_NAMES`, and the 17 initials are distinct.
  - `replacementStyles('Mixed', 11)` and `replacementName(-1)` throw the §5 RangeErrors.
  - An unknown line-up throws `RangeError('Unknown line-up: …')`.
- Verification: unit `tests/bots/lineup.test.ts::replacement draws and names are deterministic and validated`

### SPEC-09: A cash `--lineup` playtest replaces busted bots reproducibly
- Verifies: AC#5, AC#6
- Behaviour: Given `runPlaytest({hands: 300, seed: 42, size: 6, lineUp: 'Mixed'})` with an `onHand` collector, When
  it is run twice, Then the following hold:
  - Both runs give the same list of `{hand, seat, name, style}` for every replaced seat, and the list is non-empty.
  - Every replaced seat ended the previous hand on 0 and starts this hand with 160.
  - Its style is in `replacementStyles('Mixed', 6)`, and it equals `drawReplacementStyle('Mixed', 6, handReplayCode(42, k−1), seat)`.
  - Its name is not held by another seat in `lineUp`.
  - No seat changes without a bust.
  - Seat 1 is never replaced, and the summaries are equal with `violations === 0`.
  - The same run with `lineUp: 'Soft'` gives only Calling station and Rock replacements.
- Verification: acceptance `tests/playtest/replacement.acceptance.test.ts::a cash line-up playtest replaces busted bots the same way every run`

### SPEC-10: The 10,000-hand Mixed playtest replaces bots with zero violations (opt-in slow)
- Verifies: AC#6, DoD#6
- Behaviour: Given `TLH_SLOW_TESTS=1`, When `npm run playtest -- --hands 10000 --seed 42 --lineup mixed` runs, Then
  it exits 0 and stdout contains `Invariant violations: 0` and a `Bots replaced: <n>` line with n ≥ 1. A second run
  prints identical stdout. Skipped in the normal suite (about 72 s per run).
- Verification: acceptance `tests/playtest/replacement.acceptance.test.ts::10,000 Mixed hands replace busted bots with zero violations (slow, opt-in)`

### SPEC-11: CLI reports replacements only in `--lineup` cash runs and the default baseline is unchanged
- Verifies: AC#6, DoD#6
- Behaviour: Given the CLI, When run with and without `--lineup`, Then:
  - `main(['--hands','300','--seed','42','--lineup','mixed'])` prints the `Bots replaced: <n>` line, where n equals
    the SPEC-09 count. It comes after `Invariant violations: 0` and is followed by nothing else.
  - `main(['--hands','300','--seed','42'])` and `--game sng --lineup mixed` print no `Bots replaced:` line.
  - `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` still gives
    `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256`

### SPEC-12: A violation after a replacement replays with the replaced styles
- Verifies: AC#5
- Behaviour: A violation's Replay line reproduces the hand even after replacements.
  - Given a `--lineup mixed` cash run with a test `onAction` seam that reports a violation on the first action of
    the first hand after a replacement, When `main` prints the violation block, Then the Replay line ends with
    `--lineup mixed --styles <slugs for seats 2..6 as seated in that hand>`.
  - Running that Replay command through `main` reproduces the same hand: same actions in the printed hand lines.
  - `--styles` without `--replay-code` or without `--lineup`, or with a wrong count or unknown slug, exits 2 with the
    §5 messages.
- Verification: acceptance `tests/playtest/replacement.acceptance.test.ts::a violation after a replacement prints a Replay line that reproduces the hand`

### SPEC-13: Quality gates
- Verifies: DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors. Coverage thresholds hold.
  `src/bots/lineup.ts`, `src/engine/bot-random.ts` and `src/table/session.ts` import no UI or browser-only module.
  CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-14: Not-applicable DoD items
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: These DoD items are not applicable or are handled by a later stage.
  - Not applicable:
    - Golden-spot suite (DoD#3): not created yet; no `tests/advice/*golden*`.
    - Screens (DoD#7, DoD#12): no screen or dialog changes.
    - Network (DoD#8): no network code.
    - Strategy content (DoD#9): no strategy content.
  - The story documentation is published to Backlog.md by the docs stage (DoD#11).
- Verification: manual `grep -rn "fetch(\|XMLHttpRequest\|WebSocket" src/bots src/table src/playtest src/engine` finds nothing new; the docs stage publishes the story doc

## 7. Edge cases
- Empty / boundary / max:
  - $0 vs $1 (SPEC-01, SPEC-02).
  - Bot at $95 below the old top-up floor (SPEC-02).
  - Heads-up Tough and Soft single-style draws (SPEC-07, SPEC-08).
  - The name sequence wraps past 17 (SPEC-08).
- Duplicates:
  - Two busts in one hand (SPEC-03).
  - A custom name already at the table (SPEC-03).
- Invalid input:
  - Bad size, line-up or position (SPEC-08).
  - Bad `--styles` (SPEC-12).
  - Null replay code (A-6, unit in SPEC-04's file).
- Interruption: a violation restarts the playtest table (A-4). This is covered by the SPEC-09 determinism check.
  Non-violating runs are the norm.
- The user busting: SPEC-04.
- Sit-and-go: SPEC-04, SPEC-11.
- Concurrency, permissions, dependency failure: N/A. These are pure, synchronous functions with no I/O.

## 8. Security considerations
- Trust boundaries: CLI arguments (`--styles`) are validated strictly against four slugs and the seat count, and are
  rejected with exit 2 (SPEC-12). Session state is internal.
- Randomness: a seeded, non-cryptographic generator, on purpose. Replacement style is a training-variety choice, not
  a security or money-fairness decision. Reproducibility from the replay code is required (REQ-062.4). Seeds come from
  the hand's replay code, which comes from `crypto.getRandomValues` in the app (`src/engine/deck.ts:15`).
- No new dependencies, no secrets, no logging of user data, no network.

## 9. Non-functional
- Replacement cost: one FNV hash and at most a few generator steps per bust. Normal-suite tests:
  - The tallies (3 × 10,000 + 2 × 10,000 + 2 × 10,000 draws) take under 1 s.
  - SPEC-09/11/12 take under about 10 s (300-hand Mixed runs; about 7 ms/hand measured by TASK-6.6).
- Slow group: the 10,000-hand Mixed run (about 72 s, limit 300 s) is only in `npm run test:slow`.
- The default playtest is byte-identical (SPEC-11), so its throughput tests are unaffected.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`
- New tests (path → SPEC ids):
  - `tests/table/replace-bot.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03
  - `tests/table/next-hand.test.ts` → SPEC-04
  - `tests/bots/replacement.acceptance.test.ts` → SPEC-05, SPEC-06, SPEC-07
  - `tests/bots/lineup.test.ts` → SPEC-08
  - `tests/playtest/replacement.acceptance.test.ts` → SPEC-09, SPEC-10 (slow, `test:slow`), SPEC-12
  - `tests/playtest/cli.test.ts` → SPEC-11 (in-process parts), SPEC-12 (parse errors)
- Slow group: `npm run test:slow` now also runs `tests/playtest/replacement.acceptance.test.ts`.
- End-to-end scenario for the Judge:
  1. Run `npm run playtest -- --hands 2000 --seed 42 --lineup mixed` twice and check that both runs print the same
     `Bots replaced: <n>` with n ≥ 1, `Invariant violations: 0`, and exit 0.
  2. Run `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` and check that it matches the
     baseline.
  3. As a one-off gate (about 72 s), run `npm run playtest -- --hands 10000 --seed 42 --lineup mixed` and check that it
     exits 0 with zero violations.

## 11. Open questions
- None. Resolved in `doit/TASK-6.8/qa.md`:
  - Q-1 (D-1): the draw is seeded from the replay code and seat, uniform over the distinct allowed styles. Approved.
  - Q-2 (D-2): new bots are named Jay…Zed, then "Jay 2"…, never reused in a session. Approved.
  - Q-3 (D-4, D-5): default runs are byte-identical, `Bots replaced: <n>` is printed, and `--styles` is added. Approved.
  - Q-4: the user approved all three locked-test edits. The unlocks are recorded under TASK-3.4
    (`tests/table/next-hand.acceptance.test.ts`) and TASK-1.52 (`tests/playtest/policy-lineup.acceptance.test.ts`).
    The builder makes exactly these edits:
    - next-hand lines 93-96: expect seat 1 to be a new bot (`kind 'bot'`, name 'Jay', $160) and seats 2-6 unchanged.
    - next-hand lines 115-141: allow a changed stack only for a bot on 0 (→160, name changes) or the user below 96
      (→160). Replace `topUps > 0` with an assertion that the bot ending hand 43 on $94 carries $94.
    - policy-lineup lines 18-27: shorten the Tough run from 200 to 45 hands, the last hand before the first replacement
      takes effect at seed 42. Keep both the `toEqual` with the Maniac-at-seat-2 run and the `not.toEqual` with the
      all-TAG run. The builder confirms both still hold at 45, otherwise uses the largest count ≤ 45 for which they do.


## 12. Clarifications log
See `doit/TASK-6.8/qa.md`.
