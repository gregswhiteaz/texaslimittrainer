# Spec: TASK-6.10 — Report each bot's BB/100 with a 95% confidence interval

Status: READY (approved 2026-11-22)
Task: TASK-6.10 · Parent/epic: TASK-6 · Requirements: REQ-062.3, REQ-030.4 · Dream: limit-holdem-trainer

## 1. Summary
Every `npm run playtest` run (cash or sit-and-go, with or without `--lineup`) prints one row per bot with its name,
style, seat, hands played, BB/100 and the lower and upper bounds of its 95% confidence interval. BB/100 is the
bot's mean per-hand chip result divided by the big bet, times 100. The interval is mean ± 1.96 × sample SD / √n on the
same scale. A bot that busted and its replacement are separate rows. The rows go in a new block between the
header (Options/Table/Line-up lines) and `Hands played:`, so every existing line keeps its text and order, and every
pinned report ending is unchanged. TASK-6.12 reads these rows to prove TAG beats the weaker styles.

## 2. Scope
- In scope:
  - `src/playtest/winrate.ts` (new):
    - a per-bot accumulator (Welford);
    - `winRate` (BB/100 and the 95% interval from a list of per-hand results);
    - a bot-results tracker fed by `PlayedHand`s;
    - row formatting.
  - `src/playtest/cli.ts`: run mode feeds every hand to the tracker through the existing `onHand` callback of
    `runPlaytest`, then prints the block just before the summary lines.
  - Tests for AC#1–#4 and the edge cases below.
- Not doing:
  - Per-style VPIP, PFR and aggression (REQ-062.3 second half, TASK-6.11).
  - Per-seat `--lineup` lists and the TAG-beats-weaker-styles runs (TASK-6.12).
  - Rows in replay mode (`--replay-code`). It replays one hand, so no interval is possible (A-4).
  - Any change to `formatReport`, the summary lines, the violation block, `Bots replaced:`, or the million tool's
    combined report. Shard sections carry the rows automatically because they are shard stdout; there is no
    cross-shard pooling of win rates.
  - BB/100 in the app UI (REQ-003, session snapshot).
  - Any change to bots, the engine, policies or the runner's hand loop.
  - Editing any locked test (none needs to change; see §3).
- Scope budget: files=4, lines=520

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | A bot's per-hand result is `stack − startingStack` of its `final.players` entry, in chips. It is counted only for hands that completed (`final.result !== null`). Abandoned hands (a violation stopped the hand, or a deal violation) count toward no bot's hands or results. | yes | A completed hand's result is exact and zero-sum. An abandoned hand has chips stranded in the pot. A run with any violation already exits 1. | Count abandoned hands as 0 |
| A-2 | A bot is identified by (seat, name, style). Rows are ordered by seat ascending, then by the hand number of the bot's first counted hand. After a table restart (violation), the preset bots return with their original names and merge into their earlier rows. | yes | Replacement names are never reused within a table run (TASK-6.8, `nextReplacementName`, `src/bots/lineup.ts:157`). Restarts only happen in failing runs. | A new row per stint after every restart |
| A-3 | The big bet is `GAMES[game].stakes.bigBet`: $8 in cash, 40 chips in sit-and-go. The playtest sit-and-go stays at L1 for the whole run (`SNG_STAKES`, `src/playtest/runner.ts:47`). | yes | The playtest has no blind levels, so one big bet applies to every hand | Omit rows for sng |
| A-4 | Replay mode prints no bot rows. | yes | It is a single-hand replay, not a run, and n = 1 gives no interval | Print one row per seat with `n/a` bounds |
| A-5 | The tracker keeps an O(1) accumulator per bot (count, mean, M2: Welford's online algorithm), never a per-hand list, so memory grows with the number of bots, not hands. At about 0.3% replacements per hand (measured: 34 in 10,000 Mixed hands at seed 42), a 1,000,000-hand line-up run prints about 3,400 rows. | yes | Keeps the runner's O(1)-in-hands memory (`runPlaytest` doc, `src/playtest/runner.ts:332`). The values stay accurate at 10⁹ hands, where a running sum of squares in sng chips would pass 2⁵³. | Sum and sum of squares |
| A-6 | Displayed values are rounded with `toFixed(2)`. `-0.00` is shown as `0.00`. | yes | Deterministic. The AC asks for 0.01 precision, which tests check as `|printed − exact| ≤ 0.005`. | Banker's rounding |

## 3. Current system
- CLI (`src/playtest/cli.ts`):
  - `main` (`:350-402`) builds `header` = `TLH Trainer playtest`, the `Options:` line, the `Table:` line, and (with a
    line-up) the `Line-up:` line plus the optional `Line-up note:`. It then writes
    `formatReport(header, summary, …)` once (`:400`).
  - `formatReport` (`:197-223`) prints the summary lines `Hands played:` … `Invariant violations:`, then
    `Bots replaced:` for line-up cash runs, then the violation block.
  - Run mode calls `runPlaytest(options, onHand?, seams)`. Line-up cash runs already pass an `onHand` that counts
    replacements (`:380-384`).
  - `lineUpLines` (`:332-347`) labels bots as `seat N Name (Style)`.
- Runner (`src/playtest/runner.ts`):
  - `PlayedHand` has `final` (with `players[].seat/stack/startingStack`), `record.seats` (seats dealt in),
    `lineUp` (seats 1..size with name/style, line-up runs only) and `replaced` (`:132-147`).
  - `runPlaytest` resets seats to the preset after a violation or abandoned hand (`:364-370`). It replaces busted
    line-up bots in cash (`:373-383`); sng busted seats sit out (not dealt in).
  - Default policies: TAG at 6 dealt-in seats, random moves otherwise (`defaultPolicyFactory`, `:171-173`). USAGE
    states this (`cli.ts:47`).
  - `GAMES` stakes: cash bigBet 8, sng bigBet 40 (`:45-63`).
- Line-ups: seat 1 is `{kind: 'user', name: null, style: null}`. Bots have names from `BOT_NAMES`, and replacements
  from `REPLACEMENT_NAMES` with a round suffix (`src/bots/lineup.ts:7-35`, `:144-164`).
- Million tool: shard stdout is copied into each shard section (`src/playtest/shards.ts:213`). `checkReport`
  (`:130-152`) needs exactly one `Options: …` line, a `Hands played: <n>` line, an `Invariant violations:` line, and
  an optional `Violations by invariant:` line. Rows starting with `Bot: ` touch none of these.
- Locked tests that read playtest stdout (all keep passing with rows inserted before `Hands played:`):
  - TASK-1.6 `tests/playtest/playtest.acceptance.test.ts`: `lines[0]` is the title. It checks the order of the
    `REPORT_LABELS` lines (Options, Table, Hands played …), which are found by `startsWith('<label>: ')`. It also
    checks byte-identical reruns.
  - TASK-1.8 `tests/playtest/invariants.acceptance.test.ts`: the output `endsWith('Invariant violations: N\n' + block)`
    (`:172`). `endsWith(formatHand(second))` (`:238`). In replay mode, `Hand 1:` comes before `Hands played:`
    (`:191`).
  - TASK-6.8 `tests/playtest/replacement.acceptance.test.ts`: the output
    `endsWith('Invariant violations: 0\nBots replaced: N\n')` (`:99`). It also finds the `Hand n:`/`Result:` lines and
    checks byte-identical reruns.
  - TASK-6.1 `tests/bots/tag-playtest.acceptance.test.ts:63`: default npm stdout equals `main` stdout with a
    `makePolicy` seam. The rows don't depend on the policy, so they stay equal.
  - TASK-1.17 and TASK-6.9 `million*.acceptance.test.ts`: they pin `planShards`, the combined report from
    `Combined report` on, and shard section = direct stdout. All are unaffected.
  - `heads-up`, `games`, `runner`, `summary`, `lineup`, `throughput`, `lineup-throughput`, `style-bots` and
    `type-stripping` only use `toContain` or `find` on specific lines.
  - `tests/playtest/cli.test.ts` (unit, not locked) pins `formatReport` output, which does not change.
- Baseline output that changes (required by AC#1; no test pins it):
  - `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | shasum -a 256` =
    `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (cited in TASK-6.2–6.9 specs, all done).
  - After this task, every line except the new block is byte-identical: deleting the `Bot results` and `Bot:` lines
    gives back the old SHA (SPEC-07).
- Tests: Vitest (`npm test` = `vitest run --coverage`). The `src/playtest/**` coverage threshold is 90% lines
  (`vite.config.ts:18`). `*.acceptance.test.*` files are excluded from `test:unit`. The sandboxed npm spawn helpers
  are in `tests/support/sandbox`.
- Existing code to reuse:
  - `src/playtest/runner.ts` → `GAMES`, the `PlayedHand` fields, and the `onHand` callback of `runPlaytest` (no runner
    change).
  - `src/playtest/cli.ts` → the existing `main` structure. Wrap the existing replacement-count callback rather than
    adding a second pass.
  - `src/bots/style.ts` → `StyleName` for row styles.
  - `tests/playtest/replacement.acceptance.test.ts` → its `run`/`replacements` helpers as patterns (copy, don't
    import from a locked file).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The bot block goes between the header and `Hands played:` in run mode. `formatReport` and every existing line are unchanged. | Append after `Invariant violations:` / `Bots replaced:` / the violation block | Appending would break locked `endsWith` pins (`invariants.acceptance.test.ts:172,238`, `replacement.acceptance.test.ts:99`). Inserting before `Hands played:` breaks no locked test. | yes | user (Q-1, auto-accepted) |
| D-2 | Rows print in every run mode, including the default all-TAG / random run. This changes the default output and its baseline SHA `aacd5e94…e01`. | Only with `--lineup` | AC#1 says "Given any playtest run". No locked test pins the SHA, so only the spec-cited baseline moves. | yes | user (Q-1, auto-accepted) |
| D-3 | Row text format, `n/a` for fewer than 2 hands, and the header line text are given in §5. | See Q-1 | User-visible text | yes | user (Q-1, auto-accepted) |
| D-4 | Names and styles for seats without a bot name: in default runs every seat is `Seat N`, with style `TAG` at table size 6 and `Random` at other sizes. In line-up runs, seat 1 is `User` with style `TAG`. | See Q-2 | AC#1 needs a name and style for every row. TASK-6.12 reads the seat-1 TAG row. | yes | user (Q-2, auto-accepted) |
| D-5 | The statistic is the sample SD (n − 1) of per-hand chip results. The 95% bounds are (mean ± 1.96 × SD / √n) / bigBet × 100. | Population SD | AC#3 says "sample standard deviation" | no | AC#3 |

## 5. Design

### Files to create / modify
- `src/playtest/winrate.ts` — create: `Tally`, `addResult`, `winRate`, `winRateOfTally`, `BotResults` tracker, `formatBotResults`.
- `src/playtest/cli.ts` — modify: run mode feeds `onHand` to a `BotResults`, and prints `formatBotResults` after the header.
- `tests/playtest/bot-results.acceptance.test.ts` — create: SPEC-01, 02, 03, 04, 05, 06.
- `tests/playtest/winrate.test.ts` — create: SPEC-08, 09, 10, 11 units.

### Components, interfaces and data
- `winrate.ts` (pure, imports only `./runner` types/`GAMES` and `../bots/style` types; no UI):
  - `export interface Tally { hands: number; mean: number; m2: number }` (mutable, Welford).
    - `export function newTally(): Tally` returns `{hands: 0, mean: 0, m2: 0}`.
  - `export function addResult(tally: Tally, result: number): void`:
    - `hands += 1`;
    - `d = result − mean`;
    - `mean += d / hands`;
    - `m2 += d × (result − mean)`.
  - `export interface WinRate { readonly hands: number; readonly bbPer100: number; readonly lower: number | null; readonly upper: number | null }`.
  - `export function winRateOfTally(tally: Tally, bigBet: number): WinRate`:
    - `bbPer100 = mean / bigBet × 100`.
    - If `hands ≥ 2`: `sd = √(m2 / (hands − 1))`, `half = 1.96 × sd / √hands`, `lower = (mean − half) / bigBet × 100`,
      `upper = (mean + half) / bigBet × 100`. Otherwise `lower = upper = null`.
    - Throws `RangeError('No hands to rate')` when `hands === 0`.
  - `export function winRate(results: readonly number[], bigBet: number): WinRate` folds `addResult` over `results`.
    It throws the same `RangeError` for `[]`.
  - `export interface BotRow { readonly seat: number; readonly name: string; readonly style: string; readonly rate: WinRate }`.
  - `export class BotResults` (or a factory with the same methods), built with `(size: number, game: GameType)`:
    - `add(hand: PlayedHand): void`. Ignores the hand if `hand.final.result === null`. Otherwise, for each
      `p of hand.final.players`, it builds the identity:
      - if `hand.lineUp` is defined, seat = `hand.lineUp[p.seat − 1]`: a `bot` gives `(seat, name, style)`, and the
        `user` gives `(1, 'User', 'TAG')`;
      - otherwise `(p.seat, 'Seat ' + p.seat, size === 6 ? 'TAG' : 'Random')`.

      It then calls `addResult(tally[identity], p.stack − p.startingStack)` and remembers the first hand number
      for that identity.
    - `rows(): BotRow[]`: one row per identity with `hands ≥ 1`, sorted by seat, then first hand number.
  - `export function formatBotResults(rows: readonly BotRow[], game: GameType): string`: the block in "Output format"
    below. Returns `''` when `rows` is empty, which only happens if every hand was abandoned.
- `cli.ts` run mode:
  - `const bots = new BotResults(size, game)`.
  - `onHand = (hand) => { bots.add(hand); count += hand.replaced?.length ?? 0 }`. The count is used only for line-up
    cash runs, as today.
  - After `runPlaytest`, header += `formatBotResults(bots.rows(), game)`.
  - Replay mode is unchanged.

### Output format (approved by Q-1)
Inserted right after the `Table:` line (or after `Line-up:`/`Line-up note:` when present), before `Hands played:`:
```
Bot results: BB/100 = big bets won per 100 hands (big bet $8), with 95% confidence interval
Bot: Seat 1, TAG, seat 1, 10000 hands, 1.23 BB/100, 95% CI -0.45 to 2.91
Bot: Ava, Calling station, seat 2, 812 hands, -3.21 BB/100, 95% CI -9.80 to 3.38
Bot: Jay, Maniac, seat 2, 1 hands, -12.50 BB/100, 95% CI n/a
```
- In sit-and-go runs, the header says `(big bet 40 chips)` instead of `(big bet $8)`.
- Each value is formatted with `toFixed(2)`, and `-0.00` becomes `0.00`. With fewer than 2 hands the interval reads
  `95% CI n/a`.
- `hands` is always written `<n> hands`, even when n = 1, so the line is easy to parse.

### Rules and algorithms
- Worked example AC#2: results `[80, 0 × 99]`, bigBet 8 → mean 0.8 → BB/100 `10.00`; bounds `-9.60` and `29.60`.
- Worked example AC#3: results `[8, -4, 0, 16, -8]`, bigBet 8 → mean 2.4, sample SD 9.6333 (variance 371.2/4 = 92.8)
  → BB/100 `30.00`, bounds `-75.55` and `135.55`.
- Cash and line-up runs are zero-sum per completed hand (no rake), so Σ over rows of `hands × mean` = 0 exactly in
  chips.

### Error handling and configuration
- No new options or flags. `RangeError` from `winRate`/`winRateOfTally` on 0 hands. `rows()` never returns a
  0-hand row, so the CLI never throws it.

## 6. Behaviour specification

### SPEC-01: Every playtest run prints a row per bot
- Verifies: AC#1, DoD#1
- Behaviour: Given `main(['--hands','2000','--seed','42'])` (6-max cash, default policies), When it reports, Then:
  - the output has the line `Bot results: BB/100 = big bets won per 100 hands (big bet $8), with 95% confidence interval`;
  - exactly six `Bot: ` lines follow it, for `Seat 1` … `Seat 6`, all `TAG`, seats 1–6, `2000 hands`, each matching
    `/^Bot: Seat (\d+), TAG, seat \1, 2000 hands, -?\d+\.\d\d BB\/100, 95% CI -?\d+\.\d\d to -?\d+\.\d\d$/`, with
    lower ≤ BB/100 ≤ upper;
  - the block sits after the `Table:` line and before `Hands played: 2000`;
  - the sum of the six BB/100 values is within 0.03 of 0 (zero-sum).

  Given `--hands 500 --seed 9 --size 9`, the rows are `Seat 1`–`Seat 9` with style `Random`. Given
  `--hands 1000 --seed 42 --lineup tough --size 6`, the rows are `User, TAG, seat 1`, then each preset bot's name and
  style from the `Line-up:` line, plus any replacements. Given `--game sng --hands 1000`, the header says
  `(big bet 40 chips)`. Each run's exit code is the same as before the change (0).
- Verification: acceptance `tests/playtest/bot-results.acceptance.test.ts::every playtest run prints each bot's name, style, hands, BB/100 and 95% interval`

### SPEC-02: BB/100 is big bets won per 100 hands
- Verifies: AC#2
- Behaviour: Given `winRate([80, ...Array(99).fill(0)], 8)`, When computed, Then `hands` = 100,
  `bbPer100` = 10 (±1e-9), and it formats as `10.00 BB/100`.
- Verification: acceptance `tests/playtest/bot-results.acceptance.test.ts::a bot that won $80 over 100 hands at $4/$8 wins 10.00 BB/100`

### SPEC-03: The 95% interval uses the sample SD
- Verifies: AC#3
- Behaviour: Given `winRate([8, -4, 0, 16, -8], 8)`, When computed, Then `bbPer100` = 30.00, `lower` = -75.55,
  `upper` = 135.55 to 0.01, i.e. mean ± 1.96 × sample SD / √n, scaled by 100/8.

  For a fast-check property over integer lists of length 2–200 with values in [-864, 864], the bounds equal
  `(m ∓ 1.96·s/√n)/bb·100`, computed directly with a two-pass mean and `Σ(x−m)²/(n−1)`, within 0.005.
- Verification: acceptance `tests/playtest/bot-results.acceptance.test.ts::the 95% interval is mean ± 1.96 × sample SD / √n in BB/100`

### SPEC-04: A busted bot and its replacement are separate rows
- Verifies: AC#4
- Behaviour: Given `main(['--hands','2000','--seed','42','--lineup','mixed'])`, which prints `Bots replaced: 10`
  (> 0 asserted, not pinned), When the report is printed, Then:
  - for every replaced seat, the departed bot's row and its replacement's row are both present, each with its own
    name and style from `hand.lineUp`;
  - the `Bot:` rows equal, line for line, rows rebuilt independently in the test from a `runPlaytest` with the same
    options: each completed hand's `final.players` result assigned to `hand.lineUp[seat−1]`, then `winRate` and the
    format rules;
  - for each seat, the rows' hands sum to 2000.
- Verification: acceptance `tests/playtest/bot-results.acceptance.test.ts::a busted bot and its replacement appear as separate rows with their own hands`

### SPEC-05: The existing report lines and endings are unchanged
- Verifies: AC#1
- Behaviour: Given the SPEC-01 and SPEC-04 runs, When the `Bot results` and `Bot:` lines are removed, Then the
  remaining text equals the output of `formatReport(header-without-block, summary, …)`. In practice:
  - the line-up cash run still ends with `Invariant violations: 0\nBots replaced: <n>\n`;
  - two runs with the same options are byte-identical.
- Verification: acceptance `tests/playtest/bot-results.acceptance.test.ts::the bot block leaves every other report line unchanged and output deterministic`

### SPEC-06: Abandoned hands count for no bot
- Verifies: AC#1
- Behaviour: Given `main(['--hands','3','--seed','42'], io, seams)` where `onAction` returns a violation at the first
  action of hand 2, When it reports, Then:
  - every `Bot:` row shows `2 hands`;
  - the exit code is 1;
  - the output still ends with the violation block.
- Verification: acceptance `tests/playtest/bot-results.acceptance.test.ts::a hand stopped by a violation counts toward no bot`

### SPEC-07: Default output is the old output plus the block
- Verifies: AC#1, DoD#6
- Behaviour: Given `npm run -s playtest -- --hands 10000 --seed 42 --size 6`, When the `Bot results` and `Bot:` lines
  are deleted, Then the SHA-256 is `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01`, and the output
  shows `Invariant violations: 0`.
  New default-run baseline: the full output, `Bot` lines included, gets a new SHA-256. The builder records it in the
  build notes and the docs stage records it in the story doc. Later specs cite the new SHA. The old SHA
  `aacd5e94…e01` stays recoverable with `grep -v '^Bot'`.
- Verification: command `npm run -s playtest -- --hands 10000 --seed 42 --size 6 | grep -v '^Bot' | shasum -a 256`

### SPEC-08: Fewer than two hands gives no interval
- Verifies: AC#3
- Behaviour: Given `winRate([-16], 8)`, Then `{hands: 1, bbPer100: -200, lower: null, upper: null}`, and a row formats
  as `…, 1 hands, -200.00 BB/100, 95% CI n/a`. Given `main(['--hands','1'])`, every row shows `1 hands` and
  `95% CI n/a`. `winRate([], 8)` throws `RangeError('No hands to rate')`. Given all-equal results `[4, 4, 4]`, the
  bounds equal BB/100 (50.00).
- Verification: unit `tests/playtest/winrate.test.ts::fewer than two hands, empty and zero-variance inputs`

### SPEC-09: Rounding and negative zero
- Verifies: AC#3
- Behaviour: `formatBotResults` shows -0.001 as `0.00` (not `-0.00`), 1.234 as `1.23` and -1.236 as `-1.24`.
- Verification: unit `tests/playtest/winrate.test.ts::values are shown to 0.01 without negative zero`

### SPEC-10: Tracker identity, order and sit-and-go seats
- Verifies: AC#1, AC#4
- Behaviour: Given hand-built `PlayedHand`s, Then:
  - rows are ordered by seat, then by first hand;
  - in a line-up hand seat 1 is `User`/`TAG`;
  - without a line-up, at size 6 the style is `TAG`, and at size 3 it is `Random`;
  - a seat missing from `final.players` (busted in sng, not dealt in) gets no result for that hand;
  - the same (seat, name, style) seen again after other bots merges into one row;
  - the Welford mean and variance match the two-pass formula on 10,000 random integer results within 1e-9 relative.
- Verification: unit `tests/playtest/winrate.test.ts::bot identity, ordering and per-hand results`

### SPEC-11: Replay mode prints no bot block
- Verifies: AC#1
- Behaviour: Given `main(['--replay-code', <code>, '--size', '6'])`, Then the output has no line starting with `Bot`
  (A-4).
- Verification: unit `tests/playtest/winrate.test.ts::replay mode prints no bot block`

### SPEC-12: Quality gates
- Verifies: DoD#1, DoD#2, DoD#4, DoD#5, DoD#10
- Behaviour: All quality gates pass:
  - Every AC has a passing automated test (SPEC-01–06).
  - `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors, and every locked test passes
    unedited.
  - Coverage holds: `src/playtest/**` ≥ 90% lines, overall ≥ 70%.
  - `winrate.ts` imports only `./runner` and `../bots/style`.
  - CI is green on the branch.
- Verification: command `npm run lint && npm run typecheck && npm test`

### SPEC-13: Not-applicable DoD items and docs
- Verifies: DoD#3, DoD#7, DoD#8, DoD#9, DoD#11, DoD#12
- Behaviour: These items are not applicable or are handled by a later stage:
  - Golden-spot suite (DoD#3): not created yet (E07-S14).
  - Screens (DoD#7, DoD#12): no screen or dialog changes.
  - Network (DoD#8): no network code.
  - Strategy content (DoD#9): none.
  - Docs (DoD#11): the docs stage publishes the story doc.
- Verification: manual `grep -rn "fetch(\|XMLHttpRequest\|WebSocket" src/playtest` finds nothing; the docs stage publishes the story doc

## 7. Edge cases
- Bot with 1 hand (replacement seated for the final hand, or `--hands 1`): SPEC-08.
- Bot seated but never dealt in (a replacement drawn after the last hand): it has no counted hands, so no row
  (SPEC-10).
- Zero variance: SPEC-08.
- Abandoned or violating hands: SPEC-06.
- sng busted seats sit out and are not dealt in: SPEC-10. The sng big bet is 40 chips: SPEC-01.
- Table restart after a violation brings back the preset names: they merge (A-2, SPEC-10).
- Very large runs (10⁹ hands): the Welford accumulator keeps precision (A-5, SPEC-10). The number of rows grows with
  replacements (about 0.3% of hands in line-up cash).
- Determinism: integer chip inputs in a fixed order, with no randomness: SPEC-05.
- Invalid input: no new options, so N/A.
- Concurrency, permissions: N/A (single-threaded CLI).

## 8. Security considerations
- No new trust boundary, input, dependency, network, secret or randomness. Output is computed from engine
  state only. N/A.

## 9. Non-functional
- Overhead: per hand, one Map lookup and Welford update per dealt-in seat. A 10,000-hand default run stays within
  +10% of its current wall time (~0.8 s on the reference machine). This is not asserted in tests (the standing rule
  keeps speed checks in the opt-in slow group, and the existing slow throughput tests still cover REQ-062.5).
- Memory: O(number of bots), independent of hands (A-5).
- Determinism (REQ-062.4): same seed and options give byte-identical output (SPEC-05, existing locked tests).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`
- New tests (path → SPEC ids):
  - `tests/playtest/bot-results.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-06. Uses
    in-process `main`/`runPlaytest` plus one npm spawn (`--hands 500 --seed 9 --size 9`). Each test stays under the
    120 s timeout, with no slow gating needed (≤ 2,000 hands each).
  - `tests/playtest/winrate.test.ts` → SPEC-08, SPEC-09, SPEC-10, SPEC-11.
- End-to-end scenario for the Judge:
  1. `npm run playtest -- --hands 10000 --seed 42`: exits 0. Six `Bot: Seat N, TAG, seat N, 10000 hands, …` rows
     appear between `Table:` and `Hands played: 10000`. The BB/100 values sum to about 0.
  2. `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`: a `User, TAG, seat 1` row, a row per preset bot,
     and separate rows for each of the 34 replacements and the bots they replaced. Each seat's rows sum to 10000
     hands. The output still ends with `Bots replaced: 34`.
  3. SPEC-07's command gives the old SHA `aacd5e94…e01`.
  4. `npm run playtest -- --game sng --hands 2000`: header shows `(big bet 40 chips)`.
  5. `npm run playtest:million -- --hands 900`: `Result: PASS`, each shard section shows its rows, and the combined
     report is unchanged.

## 11. Open questions
- None. Q-1 (output format and placement) and Q-2 (names and styles for unnamed seats) were auto-accepted with their
  recommended answers (`doit/TASK-6.10/qa.md`), as recorded in D-1 to D-4.

## 12. Clarifications log
See `doit/TASK-6.10/qa.md`.
