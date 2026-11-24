# Spec: TASK-6.11 — Report each bot style's VPIP, PFR and aggression against its band

Status: READY (approved 2026-11-23)
Task: TASK-6.11 · Parent/epic: TASK-6 · Requirements: REQ-027, REQ-028, REQ-062 (REQ-027.5, REQ-027.6, REQ-028.3, REQ-062.1, REQ-062.3, REQ-045.3) · Dream: limit-holdem-trainer

## 1. Summary
Every playtest run (`npm run playtest -- …`, not replay mode) prints each seated bot style's VPIP, PFR and aggression
to one decimal place. The numbers come from the shared formulas in `src/stats/style-stats.ts` (TASK-7.12). A new
`--check-styles` flag compares each value with its REQ-027 band (inclusive) and counts the recommended and alternative
actions in every spot type a style marks as mixed (REQ-028.3). It prints what failed and exits 1 when any stat is
outside its band or a mixed spot used only one action. A dispatch-only GitHub Actions workflow runs the 100,000-hand
check on seeds 42, 7 and 1234. Nothing in it runs on push or on a schedule.

## 2. Scope
- In scope:
  - New module `src/playtest/style-check.ts`. It holds the band table, a per-style tally (shared stat functions), a
    mixed-spot recorder (an `ActionHook` combined with `checkStep` via `composeChecks`) and the formatting and
    verdict.
  - `src/playtest/cli.ts`: the `--check-styles` flag (parse, usage, header echo), the style block in every `run`
    report, and exit code 1 when the style check fails.
  - The dispatch-only workflow `.github/workflows/style-bands.yml` and its structure test.
  - Tests: unit, fast acceptance, opt-in slow acceptance (100k × 3 seeds) and the `test:slow` registration.
  - Re-pinning the unit test `tests/playtest/cli.test.ts`. It pins the USAGE text and the adjacency of the Line-up
    line to Bot results. It is not locked.
- Not doing:
  - No tuning of any style file (that was TASK-6.16/6.17). If a 100k seed fails, report it as a finding. Don't retune.
  - No band data in `src/bots/styles/*.json`. The style file format is unchanged.
  - No scheduled or push-triggered workflow, and no change to `ci.yml`, `million.yml` or `million-lineups.yml`.
  - No change to replay-mode (`--replay-code`) output. No `--check-styles` in `playtest:million` shards.
  - No WTSD/W$SD in the playtest report, no UI changes and no change to `src/stats/style-stats.ts`.
  - The locked `tests/bots/style-bands.acceptance.test.ts` is not edited or removed.
- Scope budget: files=9, lines=850

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Seat attribution matches `BotResults` (`src/playtest/winrate.ts:70-76`). In a `--lineup` run, only bot seats count, each under the style it had in that hand (`hand.lineUp`), so a replaced bot's hands go to its new style. Without `--lineup`, every seat counts as TAG, because every seat plays TAG and is listed as a TAG bot. The user seat (seat 1) of a line-up run is excluded, as in the locked band test (`tests/bots/style-bands.acceptance.test.ts:55-62`). | yes | Consistent with the existing per-bot report and band test. | Count the user seat as TAG too. |
| A-2 | Hands with any violation, or with `final.result === null`, count for no style (stats and mixed spots), as in `BotResults.add` (`winrate.ts:68`). | yes | `handStyleCounts` needs a `HandResult`. Matches Bot results. | Count partial hands. |
| A-3 | Rounding: `Math.round(value * 10) / 10`, printed with `toFixed(1)`. The band check compares the rounded value with inclusive bounds, so 17.95 → 18.0 passes [18, 26]. This is the same rule as the locked band test (`style-bands.acceptance.test.ts:33-37`). | yes | AC#2 says that "a value exactly on a band edge passes". It must be the printed value. | Compare unrounded. |
| A-4 | A "mixed decision" is a bot preflop decision where `recommend(view)` returns `basis: 'chart'` with `alternative !== null`, and the style's `mixedSpots` has `preflop-<situation>`. This is the exact condition under which `decideTag` draws (`src/bots/tag.ts:43-47`). The decision counts as `recommended` when the action type equals `advice.move.type` and as `alternative` when it equals `advice.alternative`. Any other type (only possible with a test policy) is not counted. | yes | It reproduces the bot's own draw condition. It needs no change to bot code or the `SeatPolicy` type. | Instrument `decideTag` (bot code change). Count raw action types per spot (fold/call/raise appear anyway, so this proves nothing). |
| A-5 | The recorder rebuilds the view as `playerView(before, seat, [])`, with no earlier showdowns. Preflop chart advice doesn't read `earlierShowdowns` (no reference in `src/advice/**`). It passes `{ equity: BOT_EQUITY }`, like `decideTag` (`tag.ts:39-42`). | yes | Avoids changing the hook signature. | Record the live view through a policy wrapper. |
| A-6 | A mixed spot type with 0 mixed decisions in the run is printed as `recommended 0, alternative 0` and does **not** fail. It fails only when exactly one of the two counts is above 0. | yes | AC#4 says "used only one action". A spot that never came up used none. At 100k every TAG mixed spot comes up. | Fail unreached spots too. |
| A-7 | Mixed-spot recording runs only with `--check-styles`. Without the flag, no hook is added and runtime and seams are unchanged. | yes | AC#4 asks for the list only with `--check-styles`. Every-push cost stays near zero. | Always record. |
| A-8 | The band table is a TypeScript constant `STYLE_BANDS` in `src/playtest/style-check.ts`, copied from REQ-027.1-.4. It is not style-file data. | yes | Bands are requirement targets, not bot behaviour. Adding them to the JSON would change the validated style-file format (`src/bots/style.ts:127`). | A `bands` block in each style JSON. |
| A-9 | `main` gains a fourth, test-only parameter `bands: StyleBandTable = STYLE_BANDS`, like the existing `seams` parameter (`cli.ts:337`). The entry never passes it. | yes | It gives deterministic every-push tests of pass/fail and band edges without depending on 100k-hand tuning. | Test only the pure function. |
| A-10 | With `--check-styles`, a style that was seated but has a null stat (zero denominator, e.g. no postflop action in a tiny run) fails that stat, printed as `—`. If no bot hand was counted at all, the check fails. | yes | An unmeasurable stat cannot be "inside its band". | Skip null stats. |

## 3. Current system
- Playtest CLI: `src/playtest/cli.ts`. `parseArgs` (`:99-192`) accepts only `VALUE_OPTIONS` (`:50-60`) plus `--help`
  (`:104-108`). `USAGE` is at `:44-48`. `main` (`:337-392`) builds `header` and appends `formatBotResults` after the
  run (`:376`). `formatReport` (`:198-225`) adds the summary lines and the violation block. Exit codes: 0 clean,
  1 violations, 2 usage (`:335`, `:391`). Entry: `tools/playtest/main.ts` (`npm run playtest`, `package.json`
  scripts).
- Runner: `runPlaytest(options, onHand, seams)` (`src/playtest/runner.ts:343`) calls `onHand` with each
  `PlayedHand`. `PlayedHand.lineUp` holds the seats as of that hand (`:146`, set at `:371`). `PlaytestSeams.onAction`
  replaces `checkStep`. `composeChecks(...hooks)` (`:97-99`) combines hooks, as the TASK-6.9 note asks.
  `ActionStep = { before, action, result }` (`src/engine/invariants.ts:28-35`).
- Shared stats (TASK-7.12): `handStyleCounts`, `addStyleCounts`, `EMPTY_STYLE_COUNTS`, `styleStats`, `NO_STAT`
  (`src/stats/style-stats.ts:34-119`). Aggression counts postflop bets and raises against calls only
  (`:50-56`, `:112`), which is REQ-045.3 / REQ-027.6.
- Style data: `TAG_STYLE` (`src/bots/tag.ts:15`), `CALLING_STATION_STYLE` (`src/bots/calling-station.ts:16`),
  `MANIAC_STYLE` (`src/bots/maniac.ts:10`), `ROCK_STYLE` (`src/bots/rock.ts:12`). Only `tag.json` marks mixed spots:
  `preflop-unopened`, `preflop-limpers`, `preflop-raise`, `preflop-raise-and-calls` and `preflop-blind-defence`
  (`src/bots/styles/tag.json:6-31`). The other three have `"mixedSpots": []`. `SPOT_TYPES` order is in
  `src/bots/style.ts:22-29`. The bands are **not** in the style JSON files (grep finds no "band" in `src/`).
- Mixed draw condition: `src/bots/tag.ts:43-47`. Preflop advice fields `move: Action` and
  `alternative: PreflopAdvice | null` are in `src/advice/preflop.ts:34-49`.
- Bot-seat attribution precedent: `BotResults.add` (`src/playtest/winrate.ts:66-84`). The locked band test
  `tests/bots/style-bands.acceptance.test.ts` measures the same stats at 100k for seeds 42/7/1234, opt-in, about
  150 s per seed.
- Output-order constraints in existing tests, which decide where the new block goes:
  - `tests/playtest/bot-results.acceptance.test.ts:102-104` (locked) needs `Bot results` after `Table:` with
    `Hands played:` 7 lines below it (6 seats).
  - `:270-281` (locked) compares everything before `Hands played:` as the header, so a block inside the header is
    fine.
  - `endsWith('Invariant violations: 0\nBots replaced: N\n')` in `tests/playtest/cli.test.ts:609,618`,
    `replacement.acceptance.test.ts:99` and `bot-results.acceptance.test.ts:285`, and `endsWith(block)` in
    `invariants.acceptance.test.ts:181`, rule out appending at the end.
  - Only `tests/playtest/cli.test.ts:537-546` (unit) pins `Line-up:…\nBot results:` adjacency.
  - `cli.test.ts:528-532` pins `Line-up:…\nHands played: 2` for a run where every hand violates. The block is empty
    there by A-2.
- `tests/playtest/cli.test.ts:109-112` pins the USAGE text (unit).
- Million runner: `formatMillionReport` copies each shard's stdout into its report (`src/playtest/shards.ts:211-213`),
  so the million output hash changes. `checkReport` parses only named lines (`:128-153`), so shards still pass. No
  test pins either hash: they are recorded only in Backlog notes and docs (TASK-7.9/7.12).
- Workflows: `million-lineups.yml` is dispatch-only with one job and one `run:` line. The locked
  `tests/ci/million-lineups-workflow.acceptance.test.ts:15-41` pins exactly one job named `million-lineups`, run
  lines `['npm run playtest:million -- --lineups']`, timeouts `[30]` and no `if:`. Adding a job or input there
  needs a locked re-pin (see Q-2). Its action pins come from `ci.yml`.
- Tests: Vitest. Fast `*.acceptance.test.ts` files run in `test:sweeps`. Slow ones use
  `it.runIf(process.env.TLH_SLOW_TESTS === '1')` and are listed in `test:slow` (`package.json`).
- Existing code to reuse:
  - `src/stats/style-stats.ts` → `handStyleCounts`, `addStyleCounts`, `EMPTY_STYLE_COUNTS`, `styleStats`, `NO_STAT`
    (AC#11). No new counter.
  - `src/playtest/runner.ts` → `composeChecks`, `ActionHook`, `PlayedHand`, `PlaytestSeams`.
  - `src/engine/invariants.ts` → `checkStep` (the default hook to compose with).
  - `src/engine/player-view.ts:62` → `playerView`. `src/advice/recommend.ts:33` → `recommend`. `src/bots/tag.ts:29`
    → `BOT_EQUITY`.
  - `src/bots/style.ts` → `StyleName`, `SPOT_TYPES`, `BotStyleData.mixedSpots`.
  - `src/playtest/policy.ts:44` → `seatStylesPolicyFactory` (tests build the test-style-file policy from it).
  - `tests/ci/million-lineups-workflow.acceptance.test.ts` → the structure-test pattern for the new workflow test.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | The style block goes in the report header, after the `Table:`/`Line-up:` lines and before `Bot results:`. Exact text is in §5. | After Bot results (breaks locked `bot-results.acceptance.test.ts:104`). At the end (breaks 5 `endsWith` pins, 4 of them locked). | No locked test changes. Only the unit `cli.test.ts` is re-pinned. | yes | user (Q-1) |
| D-2 | A style check failure exits **1**, the same code as invariant violations. 2 stays usage. | A new code 3 for style failures. | REQ-027.5 says only "exits with failure". The million shard checker accepts only 0/1 (`shards.ts:132`). One "run found a problem" code is simpler. | yes | user (Q-1) |
| D-3 | AC#10: a new dispatch-only workflow `.github/workflows/style-bands.yml`. One job, three seed steps, no schedule and no push trigger. | (a) Extend `million-lineups.yml` with a job or input: re-pins the locked `tests/ci/million-lineups-workflow.acceptance.test.ts` (one job, one run line, no `if:`), and a combined dispatch would spend million-hand minutes too. (b) A nightly schedule: about 15-25 runner-minutes every night, against the open GitHub Actions budget concern (TASK-1.51). | Zero automatic minutes. Runs only when someone presses "Run workflow". No locked test edits. | yes | user (Q-2) |
| D-4 | The mixed-spot counts come from an `ActionHook` recorder plus `recommend`, not from changes to bot code (A-4, A-5). | Have `decideTag` report its draw through a callback. | Bots stay untouched. Uses the composeChecks route the TASK-6.9 note names. | no | n/a |
| D-5 | AC#8/AC#9 are proven by a new opt-in slow acceptance test that runs the CLI `main` in process with `--check-styles` (100k × 3 seeds, about 7.5 min), plus the workflow. | Reuse the locked `style-bands.acceptance.test.ts` (it doesn't exercise `--check-styles` or the exit code, and it is locked). | The ACs are about the CLI command's output and exit code. | no | n/a |

## 5. Design

### Files to create / modify
- `src/playtest/style-check.ts` — new: `STYLE_BANDS`, `StyleBandTable`, `StyleCheck` (tally + mixed-spot recorder), formatting and verdict.
- `src/playtest/cli.ts` — `--check-styles` flag, USAGE, Options echo, style block in the run header, exit code, `bands` test parameter.
- `tests/playtest/style-check.test.ts` — new unit tests (rounding, edges, null stats, formatting, A-4/A-6 rules).
- `tests/playtest/check-styles.acceptance.test.ts` — new acceptance tests: fast CLI tests (every push) plus `it.runIf(SLOW)` 100k seeds.
- `tests/playtest/cli.test.ts` — re-pin the USAGE text (`:109-112`) and the Line-up → Bot results adjacency (`:537-546`). Add parse tests for the flag.
- `package.json` — add `tests/playtest/check-styles.acceptance.test.ts` to `test:slow`.
- `.github/workflows/style-bands.yml` — new dispatch-only workflow.
- `tests/ci/style-bands-workflow.acceptance.test.ts` — new structure test for that workflow.
- `docs/stats/style-stats.md` — one short paragraph: the playtest CLI style block and `--check-styles` use these functions.

### Components, interfaces and data
`src/playtest/style-check.ts` (imports only from `../bots/*`, `../advice/recommend`, `../engine/*`, `../stats/style-stats`, `./runner` types; no UI):
```ts
export type Band = readonly [low: number, high: number];          // percent, inclusive
export interface StyleBands { readonly vpip: Band; readonly pfr: Band; readonly aggression: Band }
export type StyleBandTable = Readonly<Record<StyleName, StyleBands>>;
export const STYLE_BANDS: StyleBandTable = {
  TAG:               { vpip: [18, 26], pfr: [14, 22], aggression: [45, 65] },
  'Calling station': { vpip: [45, 65], pfr: [3, 10],  aggression: [10, 25] },
  Maniac:            { vpip: [50, 75], pfr: [35, 60], aggression: [65, 85] },
  Rock:              { vpip: [8, 15],  pfr: [6, 12],  aggression: [35, 55] },
};
export const STYLE_ORDER: readonly StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];
export interface MixedCounts { readonly recommended: number; readonly alternative: number }

export class StyleCheck {
  constructor(recordMixed: boolean);
  /** ActionHook: records (before, action) for preflop steps when recordMixed; always returns []. */
  readonly onAction: ActionHook;
  /** Counts one played hand: per A-1/A-2 adds handStyleCounts for each counted seat under its style, then
   *  classifies the hand's recorded preflop steps (A-4/A-5) and clears the buffer (always, even if not counted). */
  add(hand: PlayedHand): void;
  counts(): ReadonlyMap<StyleName, StyleCounts>;            // only styles with handsDealt > 0
  mixed(): ReadonlyMap<StyleName, ReadonlyMap<SpotType, MixedCounts>>; // styles seated with ≥1 mixed spot
}
/** Rounded per A-3; null stays null. */
export function roundStat(value: number | null): number | null;
/** The style block lines (whole lines, '' when no style was counted and !check). */
export function formatStyleReport(
  counts: ReadonlyMap<StyleName, StyleCounts>,
  mixed: ReadonlyMap<StyleName, ReadonlyMap<SpotType, MixedCounts>>,
  check: boolean,
  bands?: StyleBandTable,                                    // default STYLE_BANDS
): { readonly text: string; readonly passed: boolean };     // passed is true when !check
```
The style data map used for `mixedSpots`: `{ TAG: TAG_STYLE, 'Calling station': CALLING_STATION_STYLE, Maniac:
MANIAC_STYLE, Rock: ROCK_STYLE }`. The mixed map lists, for each seated style whose data has at least one mixed spot,
every spot from `SPOT_TYPES` that the style marks as mixed, in `SPOT_TYPES` order, including 0/0 counts.

`src/playtest/cli.ts`:
- `ParsedArgs` `run` variant gains an optional `readonly checkStyles?: true`. It is present only when the flag is
  given, so existing `toEqual` checks of parsed args stay valid.
- `parseArgs`: `--check-styles` is a value-less flag.
  - Given twice → `Error: --check-styles given more than once.`
  - With `--replay-code` → `Error: --check-styles is only valid without --replay-code.`
  - With `--help` → the existing `Error: --help cannot be combined with other options.`
- `USAGE` line 1 ends with ` [--lineup <mixed|tough|soft>] [--check-styles]`. A new 5th line reads:
  `--check-styles: exit 1 unless every seated bot style's VPIP, PFR and aggression is inside its target band and every mixed spot used both actions\n`.
- Options echo: ` --check-styles` is appended after the line-up option, e.g.
  `Options: --hands 100000 --seed 42 --size 6 --lineup mixed --check-styles`.
- `main(argv, io, seams = {}, bands: StyleBandTable = STYLE_BANDS)`. Run mode:
  - Create `new StyleCheck(checkStyles)`. When checking, pass `{ ...seams, onAction: composeChecks(seams.onAction ?? checkStep, check.onAction) }`.
  - Call `check.add(hand)` in the existing `onHand` callback.
  - After the run, do `header += styleReport.text` before `header += formatBotResults(...)`.
  - Return `summary.violations > 0 || !styleReport.passed ? 1 : 0`.
  - Replay mode is unchanged.

### Rules and algorithms
Exact output (one decimal everywhere, ASCII hyphen in bands, `—` = `NO_STAT` for null):

Without `--check-styles`, when at least one style was counted:
```
Style stats: VPIP and PFR per hand dealt, aggression = flop, turn and river bets and raises as a share of bets, raises and calls
Style: TAG, 20000 hands, VPIP 21.3%, PFR 17.0%, aggression 55.2%
Style: Calling station, 20000 hands, VPIP 52.4%, PFR 6.1%, aggression 18.0%
```
- Styles appear in `STYLE_ORDER`, only those with `handsDealt > 0`. `hands` is `handsDealt` (seat-hands).
- When there are none, the block is empty.

With `--check-styles`:
```
Style stats: … (same first line)
Style: TAG, 20000 hands, VPIP 21.3% (band 18.0-26.0%), PFR 17.0% (band 14.0-22.0%), aggression 66.1% (band 45.0-65.0%)
Mixed spot: TAG preflop-unopened, recommended 1520, alternative 498
Mixed spot: TAG preflop-limpers, recommended 37, alternative 0
…
Outside band: TAG aggression 66.1% (band 45.0-65.0%)
One action only: TAG preflop-limpers, recommended 37, alternative 0
Style check: failed
```
1. One `Style:` line per counted style, in `STYLE_ORDER`.
2. Then one `Mixed spot:` line per (style, spot) of the mixed map. Styles go in `STYLE_ORDER` and spots in
   `SPOT_TYPES` order.
3. Then one `Outside band:` line per failing stat. Stats go in the order vpip, pfr, aggression, and styles in
   `STYLE_ORDER`. A null stat prints as `aggression — (band …)`.
4. Then one `One action only:` line per mixed spot with exactly one of the two counts above 0 (A-6).
5. Then the verdict line: `Style check: passed` or `Style check: failed`.
6. If no style was counted, the block is the single line `Style check: failed, no bot hands were counted`
   (A-10).

A stat passes when `low <= roundStat(v) <= high`, with null failing. Worked example (AC#2 edges, TAG VPIP band
[18, 26]):

| Raw VPIP | Rounded | Result |
|---|---|---|
| 17.94 | 17.9 | fails |
| 17.95 | 18.0 | passes |
| 26.0 | 26.0 | passes |
| 26.05 | 26.1 | fails |

Worked example (AC#3): one style's counted actions are 2 preflop raises, 3 postflop bets, 1 postflop raise and
4 postflop calls. `handStyleCounts` gives `postflopAggressive = 4` and `postflopCalls = 4`, so aggression =
4 / (4 + 4) = 50.0%. Counting the preflop raises would give 6 / 10 = 60.0%.

Mixed classification (A-4): for each recorded preflop step of a counted seat whose style marks at least one mixed
spot:
1. `view = playerView(before, action.seat, [])`
2. `advice = recommend(view, { equity: BOT_EQUITY })`
3. If `advice.basis === 'chart' && advice.alternative !== null && mixedSpots.has(`preflop-${advice.situation}`)`:
   increment `recommended` when `action.type === advice.move.type`, else `alternative` when
   `action.type === advice.alternative`.

### Error handling and configuration
- Usage errors exit 2 with `${message}\n${USAGE}` on stderr (existing pattern, `cli.ts:339-342`). The new messages
  are listed under parseArgs above.
- `recommend` errors propagate (same as bots, `tag.ts:37`). They cannot occur for a legal preflop view.
- No configuration or environment variables. `bands` is a test-only parameter.

## 6. Behaviour specification

### SPEC-01: Every playtest run prints each style's VPIP, PFR and aggression to one decimal
- Verifies: AC#1, AC#11
- Behaviour: Given `--hands 500 --seed 42 --lineup mixed --size 6` (no `--check-styles`), When `main` reports, Then
  the output has the `Style stats:` line. It is followed directly by one `Style:` line each for TAG, Calling
  station, Maniac and Rock, in that order, matching
  `^Style: (TAG|Calling station|Maniac|Rock), \d+ hands, VPIP \d+\.\d%, PFR \d+\.\d%, aggression (\d+\.\d%|—)$`. The
  block sits after the `Line-up:` line and directly before `Bot results:`. Each printed value equals
  `roundStat(styleStats(c))`, where `c` sums `handStyleCounts` (from `src/stats/style-stats.ts`) over the same run's
  bot seats by style. The test collects that run independently with `runPlaytest(…, onHand)`. Without `--lineup`
  (`--hands 300 --seed 42`), exactly one `Style: TAG, 1800 hands, …` line is printed (6 seats × 300 hands, A-1). The
  exit code is still 0.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::every playtest run prints each seated style's VPIP, PFR and aggression from the shared style-stat functions`

### SPEC-02: The style tally uses the shared functions and counts only clean hands of bot seats
- Verifies: AC#11, AC#1
- Behaviour: Given the cases below, Then each holds:
  - Given a synthetic `PlayedHand` whose `lineUp` has user seat 1 and bot seats 2 (TAG) and 3 (Rock), When
    `StyleCheck.add` runs, Then `counts()` has TAG and Rock with `handsDealt` 1 each and no entry for seat 1. The
    counts equal `handStyleCounts(statHand, seat)`.
  - Given a hand with `violations > 0` or `final.result === null`, Then nothing is added.
  - Given a hand with no `lineUp`, Then every dealt seat counts as TAG.
  - `src/playtest/style-check.ts` contains no `'raise'`/`'bet'`/`'call'` action counting of its own:
    `grep -nE "type === '(bet|raise|call)'" src/playtest/style-check.ts` matches only the A-4 classification lines,
    which compare against `advice`.
- Verification: unit `tests/playtest/style-check.test.ts::StyleCheck counts bot seats by their hand's style with the shared style-stat functions`

### SPEC-03: Aggression excludes preflop actions (worked example)
- Verifies: AC#3
- Behaviour: Given a style's counted hand whose actions for its seat are 2 preflop raises, 3 postflop bets,
  1 postflop raise and 4 postflop calls, When its style line is formatted, Then it reads `aggression 50.0%`, not
  60.0%. The `ActionRecord`s are built directly, with legality not required by `handStyleCounts`.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::aggression of 2 preflop raises, 3 postflop bets, 1 postflop raise and 4 postflop calls is 50.0%`

### SPEC-04: A stat outside its band is named with its value and band, and the run exits 1
- Verifies: AC#2
- Behaviour: Given the cases below, Then each holds:
  - Given a test style file `{ ...maniac.json, deviations: [] }` (parsed with `parseStyle`) that the Maniac seats
    play through a `makePolicy` seam, while the other seats use `seatStylesPolicyFactory(seatLineUp('Mixed', 6, 1))`,
    When `main(['--hands','1000','--seed','42','--lineup','mixed','--size','6','--check-styles'], io, seams)` runs,
    Then stdout contains a line matching `^Outside band: Maniac VPIP \d+\.\d% \(band 50\.0-75\.0%\)$` and the line
    `Style check: failed`, and the exit code is 1. The Maniac plays the advice, so its VPIP sits far below 50.
  - Given the same test-style seam without `--check-styles`, Then the exit code is 0 and no `Outside band:` line is
    printed.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::a test style file that moves the Maniac's VPIP below its band fails --check-styles with style, stat, value and band`

### SPEC-05: A value exactly on a band edge passes; one tenth beyond fails
- Verifies: AC#2, AC#5
- Behaviour: Given the cases below, Then each holds:
  - Given `--hands 2000 --seed 42 --lineup soft --size 6`, the test reads each style's printed values `v` from a first
    run without the flag.
  - When it runs again with `--check-styles` and the `bands` parameter set to `[v, v]` for every stat of every
    seated style, Then each `Style:` line shows `(band v-v%)`, the output ends the block with
    `Style check: passed`, and the exit code is 0.
  - When one band is `[rockVpip + 0.1, 100]`, Then the output has `Outside band: Rock VPIP <v>% (band <v+0.1>-100.0%)`
    and the exit code is 1.
  - The Soft line-up seats only Calling station and Rock. Neither marks mixed spots, so no `Mixed spot:` line is
    printed.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::band edges are inclusive and every stat prints with its band when all are inside`

### SPEC-06: Band check unit rules (rounding, edges, null, order)
- Verifies: AC#2, AC#5
- Behaviour: Given the cases below, Then each holds:
  - `roundStat` gives 17.94→17.9, 17.95→18.0, 26.05→26.1 and null→null.
  - `formatStyleReport` with TAG counts giving VPIP exactly 18.0 and 26.0 passes. 17.9 and 26.1 fail with the exact
    `Outside band: TAG VPIP 17.9% (band 18.0-26.0%)` line.
  - A null aggression under check fails as `Outside band: TAG aggression — (band 45.0-65.0%)`.
  - An empty counts map under check gives exactly `Style check: failed, no bot hands were counted\n` and
    `passed: false`. Without check, it gives `''` and `passed: true`.
  - Styles print in STYLE_ORDER whatever the map's insertion order.
- Verification: unit `tests/playtest/style-check.test.ts::band check rounds to one decimal and treats both band edges as inside`

### SPEC-07: --check-styles lists mixed-spot action counts and fails a spot that used only one action
- Verifies: AC#4
- Behaviour: Given the cases below, Then each holds:
  - Given `--hands 1000 --seed 42 --lineup mixed --size 6 --check-styles` with real bots, When it reports, Then it
    prints exactly 5 `Mixed spot:` lines, for TAG `preflop-unopened`, `preflop-limpers`, `preflop-raise`,
    `preflop-raise-and-calls` and `preflop-blind-defence` in that order. Each matches
    `^Mixed spot: TAG preflop-[a-z-]+, recommended \d+, alternative \d+$`, and `preflop-unopened` has both counts
    above 0.
  - Given the same run with a `makePolicy` seam where the TAG bot seats play `decideTag(view)` without `random`
    (never mixing), Then at least one `One action only: TAG preflop-unopened, recommended <n>, alternative 0` line
    is printed, `Style check: failed` is printed, and the exit code is 1.
  - Without `--check-styles`, no `Mixed spot:` line is printed.
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::--check-styles lists each mixed spot's action counts and fails a spot that used one action`

### SPEC-08: Mixed-decision classification rules
- Verifies: AC#4
- Behaviour: Given a recorded preflop step, the `StyleCheck` rules apply as follows:
  - A TAG seat in an unopened chart cell with an alternative counts `recommended` when the action equals
    `advice.move.type`, and `alternative` when it equals `advice.alternative`.
  - A step whose cell has `alternative === null` is not counted.
  - A step in a spot that is not marked mixed (`preflop-re-raise`) is not counted.
  - Steps of Rock, Calling station or Maniac seats are never counted, because their `mixedSpots` are empty.
  - Steps from a violating hand are discarded and the buffer is empty after `add`.
  - A spot with counts 0/0 prints but doesn't fail (A-6). Counts 5/0 and 0/5 each fail.
- Verification: unit `tests/playtest/style-check.test.ts::mixed decisions are classified only in chart cells with an alternative in spots the style marks mixed`

### SPEC-09: Flag parsing, usage and echo
- Verifies: AC#2, AC#4
- Behaviour: Given the cases below, Then each holds:
  - `parseArgs(['--check-styles'])` gives `{ kind: 'run', options: {hands 10000, seed 42, size 6, game 'cash'}, checkStyles: true }`.
  - Without the flag, there is no `checkStyles` key.
  - `['--check-styles','--check-styles']` → `Error: --check-styles given more than once.`
  - `['--replay-code', VALID, '--check-styles']` → `Error: --check-styles is only valid without --replay-code.`
  - `['--help','--check-styles']` → `Error: --help cannot be combined with other options.`
  - Each error exits 2 with USAGE on stderr.
  - USAGE line 1 ends with `[--lineup <mixed|tough|soft>] [--check-styles]` and has the 5th `--check-styles:` line
    from §5.
  - The Options line of a checked run ends with ` --check-styles`.
  - `cli.test.ts:109-112` and `:537-546` are re-pinned to the new USAGE and to the style block between `Line-up:`
    and `Bot results:`.
- Verification: unit `tests/playtest/cli.test.ts::--check-styles is a value-less run flag echoed in the Options line`

### SPEC-10: Aggression is measured with postflop value betting in mixed line-ups
- Verifies: AC#6
- Behaviour: Given `--hands 2000 --seed 42 --lineup mixed --size 6`, When it reports, Then the Maniac line's
  aggression is a number strictly between 0.0 and 100.0, not the pre-TASK-7.8 reading of 100%. The TAG, Calling
  station and Rock lines also show numeric aggression (not `—`).
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::with postflop value betting the Maniac's aggression in a mixed line-up is below 100.0%`

### SPEC-11: 100,000 Mixed 6-max hands with --check-styles pass for all four styles on seeds 42, 7 and 1234
- Verifies: AC#7, AC#8, AC#9
- Behaviour: Given `main(['--hands','100000','--lineup','mixed','--size','6','--check-styles','--seed', S])` for each
  S in 42, 7, 1234, When it completes, Then:
  - `Invariant violations: 0` is printed.
  - There are exactly four `Style:` lines (TAG, Calling station, Maniac, Rock). Each value is inside the band shown
    on its line.
  - The Rock line shows `(band 8.0-15.0%)` for VPIP and `(band 6.0-12.0%)` for PFR. The Rock is measured with the
    Maniac seated: the Mixed 6-max line-up seats both (`src/bots/lineup.ts` MIXED_CYCLE).
  - There is no `Outside band:` or `One action only:` line, `Style check: passed` is printed, and the exit code is 0.
  - The per-seed lines are logged with `console.log` for the record.
  - If a seed fails, the builder reports it as a finding and doesn't retune (Not doing).
- Verification: acceptance `tests/playtest/check-styles.acceptance.test.ts::100,000 Mixed 6-max hands pass --check-styles on seeds 42, 7 and 1234` (opt-in slow, `npm run test:slow`)

### SPEC-12: A dispatch-only workflow runs the 100k --check-styles seeds
- Verifies: AC#10
- Behaviour: Given `.github/workflows/style-bands.yml`, Then:
  - It contains `\non:\n  workflow_dispatch:\n\n` and no `schedule`, `push`, `pull_request` or `workflow_run`
    trigger.
  - It has `permissions: contents: read` and exactly one job, `style-bands:`, on `ubuntu-24.04` with
    `timeout-minutes: 60`.
  - Its `run:` lines are exactly:
    - `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`
    - `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 7`
    - `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 1234`
  - There is no `continue-on-error`, `|| true` or `if:`.
  - `actions/checkout` and `actions/setup-node` are pinned to the same SHAs as `ci.yml`, with
    `node-version-file: .nvmrc` and exactly 2 `uses:` lines.
  - `ci.yml`, `million.yml` and `million-lineups.yml` are byte-identical to `main`.
- Verification: acceptance `tests/ci/style-bands-workflow.acceptance.test.ts::the style-band workflow runs the three 100k --check-styles seeds on manual dispatch only`

### SPEC-13: Project checks, coverage, boundaries, network and default playtest
- Verifies: DoD#1, DoD#2, DoD#3, DoD#4, DoD#5, DoD#6, DoD#8, DoD#10
- Behaviour: Given the change, When lint, typecheck and the full suite with coverage run locally and in CI on the
  branch, Then all pass with zero errors. That includes the golden-spot suite, `tests/toolchain/boundary.test.ts`
  (playtest/stats import no UI) and coverage of at least 90% for engine/bots/advice/statistics and at least 70%
  overall. No network code is added.
  `npm run playtest -- --hands 10000 --seed 42` and `npm run playtest -- --hands 10000 --seed 42 --lineup mixed`
  report `Invariant violations: 0` and exit 0. The builder records the new default-output SHA-256 in the build log.
  It changes from `14d746f7…2e48` because of the new style block, and is not pinned by any test. The million-hand
  output hash also changes, because shard stdout is copied into the report. Neither run is repeated here.
- Verification: command `npm run lint && npm run typecheck && npm test && npm run playtest -- --hands 10000 --seed 42 && npm run playtest -- --hands 10000 --seed 42 --lineup mixed`

### SPEC-14: Non-applicable DoD items and story documentation
- Verifies: DoD#7, DoD#9, DoD#11, DoD#12
- Behaviour: No screen or dialog is added or changed, so Playwright, axe and offline checks don't apply (DoD#7,
  DoD#12). No strategy content is added: the bands are copied from REQ-027 (DoD#9). The doit docs stage writes the
  story documentation and publishes it to Backlog.md (DoD#11). `docs/stats/style-stats.md` notes the CLI use.
- Verification: manual Judge confirms that `git diff --stat main` touches no `src/ui/**`, `e2e/**` or `src/bots/styles/**` file, and that the story doc is published (`backlog doc list --plain`).

## 7. Edge cases
- Band edges and rounding: SPEC-05, SPEC-06.
- Zero denominators (style seated but no postflop action; no counted hands at all): SPEC-06 (A-10).
- Styles not seated (Tough/Soft line-ups, size 2): omitted from the block and from the check, SPEC-05 (Soft).
- No `--lineup`: every seat counts as TAG, SPEC-01.
- Replaced bots (cash `--lineup`): hands go to the style in `hand.lineUp` for that hand, SPEC-02.
- Violating or abandoned hands: not counted, and the recorder buffer is cleared, SPEC-02 and SPEC-08. A run where
  every hand violates prints no block without the flag (`cli.test.ts:528-532` still holds). With the flag it prints
  the "no bot hands" failure.
- Mixed spot never reached (0/0): printed, not failing (A-6), SPEC-08.
- A custom `seams.onAction` passed to `main` is kept and composed before the recorder, SPEC-07 (the seam-policy
  run still reports violations normally).
- Flag misuse (duplicate, with replay, with help): SPEC-09.
- SNG games: the same block. The stats are game-independent, and no special case is needed.
- Concurrency, permissions and dependency failure: N/A. This is a single-process synchronous CLI.

## 8. Security considerations
- Trust boundary: CLI argv only. `--check-styles` is an exact-match flag with no value. Unknown or duplicate options
  are rejected by the existing parser pattern.
- Workflow: `permissions: contents: read`, actions pinned by SHA (same as `ci.yml`), no secrets and no third-party
  actions. Dispatch only, so it cannot be triggered by fork pull requests.
- No new dependencies, network requests, logged sensitive data or randomness. Bot randomness is unchanged; the
  recorder only reads states.

## 9. Non-functional
- Every push: the fast acceptance runs total about 8,000 Mixed/Soft hands across SPEC-01/04/05/07/10, a target of
  ≤ 15 s total. Unit tests are under 1 s. The 100k runs are opt-in only (`npm run test:slow` and the dispatch
  workflow).
- Overhead without `--check-styles`: one `handStyleCounts` per counted seat per hand. The 10k default playtest time
  must stay within +10% of the build-log baseline measured on `main` with the same command.
- Overhead with `--check-styles`: one preflop `recommend` (a chart lookup) per bot preflop decision of a
  mixed-marking style. A 100k Mixed 6-max run must stay ≤ 60 minutes on the reference machine (REQ-062.5). Expected
  ≈ 150-200 s.
- Determinism (REQ-062.4): the same argv gives byte-identical stdout. SPEC-01 runs twice and compares.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`
- New and changed tests:
  - `tests/playtest/check-styles.acceptance.test.ts` → SPEC-01, 03, 04, 05, 07, 10 (every push) and SPEC-11
    (opt-in slow, added to `test:slow`).
  - `tests/playtest/style-check.test.ts` → SPEC-02, 06, 08.
  - `tests/playtest/cli.test.ts` → SPEC-09 (unit re-pin of USAGE and adjacency, not locked).
  - `tests/ci/style-bands-workflow.acceptance.test.ts` → SPEC-12.
  - Locked tests changed: none.
- Judge end-to-end:
  1. Run `npm run playtest -- --hands 2000 --lineup mixed --size 6` and read the style block (four styles, one
     decimal, before Bot results).
  2. Run the same with `--check-styles` and read the band and mixed-spot lines and the verdict.
  3. Run `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42` and confirm exit 0
     with `Style check: passed`.
  4. Optionally run `npm run test:slow -- tests/playtest/check-styles.acceptance.test.ts` for all three seeds.

## 11. Open questions
- None. Q-1 (output, flag and exit-code contract as in §5) and Q-2 (new dispatch-only `style-bands.yml`, no schedule or push trigger) were approved; see `doit/TASK-6.11/qa.md`.

## 12. Clarifications log
See `doit/TASK-6.11/qa.md`.
