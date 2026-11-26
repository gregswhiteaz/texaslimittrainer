# Spec: TASK-7.27 — Print the heads-up and full-ring charts for review

Status: READY (approved 2026-11-26)
Task: TASK-7.27 · Parent/epic: TASK-7 · Requirements: n/a (follow-up of TASK-7.6, doc-87) · Dream: limit-holdem-trainer

## 1. Summary
`npm run chart:print` (TASK-7.19) prints only the 6-max chart, as grids with percentages and without
justifications. The heads-up and full-ring charts that Claude wrote in TASK-7.6 still need the user's review. This
task adds an optional size argument (`heads-up`, `6-max`, `full-ring`). With a size, the command prints that chart's
chart-level justification, then every spot's grid followed by the spot's justification. With no argument, the
output stays byte-for-byte the same (the locked TASK-7.19 test pins it). An unknown size gets a clear error.

## 2. Scope
- In scope:
  - `src/advice/chart-print.ts`: new `formatChartForReview(chart)` and `chartPrintMain(argv, io)` (argument
    handling, error text, exit code).
  - `tools/chart-print/main.ts`: becomes a thin entry that calls `chartPrintMain`, like `tools/playtest/main.ts`.
  - New tests: one acceptance file that spawns the real npm script, one unit file for the in-process functions.
- Not doing:
  - No change to the no-argument output, to `formatChart`, `formatSpot`, `cellToken` or `spotWidths`, or to
    `tests/advice/chart-print.acceptance.test.ts` (locked, owner TASK-7.19).
  - No change to any chart JSON content (grids or justifications), `preflop-chart.ts` or `preflop.ts`.
  - No `--help` flag, spot filter, Markdown/HTML output or text wrapping. Size aliases such as `six-max`, `2` or
    `HU` are not accepted.
  - No new npm script and no `package.json` change. The existing script already forwards arguments.
  - No timing assertions and no slow-group changes. The new spawn tests are correctness checks of about 1 s each.
    They run in the normal `.acceptance.` sweep, like the existing chart-print test.
- Scope budget: files=4, lines=230

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | With no argument, `chart:print` still prints the 6-max chart exactly as today (grids only, no justifications). | yes | Backward compatible. The locked TASK-7.19 test (`chart-print.acceptance.test.ts:46-56,82-83`) needs 26 blocks of exactly 15 lines that equal `formatChart(SIX_MAX_CHART)`, so justifications cannot be added there without editing a locked test. | Default prints the review format (needs a locked-test edit approved by the user); no argument becomes an error. |
| A-2 | With an explicit size (including `6-max`), the output is the review format: a header line, the chart justification, then each spot's grid and a `Why: ` justification line. As a result, `chart:print -- 6-max` prints more than `chart:print` with no argument. | yes | AC#1 asks for "grid per spot with its justification" when a size is given. Keeping the no-argument output unchanged means no locked-test edit. | Print justifications for every call (locked-test edit); a separate `--why` flag. |
| A-3 | An unknown size or more than one argument writes a two-line message to stderr, writes nothing to stdout, and exits with code 2. | yes | Same convention as the playtest CLI: usage errors exit 2 (`src/playtest/cli.ts:356-369`). | Exit 1; ignore extra arguments (TASK-7.19 A-7 ignored all arguments). |
| A-4 | Sizes match exactly and are case-sensitive (`heads-up`, `6-max`, `full-ring`, the `ReferenceSize` names at `preflop-chart.ts:3`). The lookup uses `Object.hasOwn`, so `toString` or `constructor` count as unknown sizes. | yes | One spelling, the one the code and the AC use. The error lists the valid names. | Accept `six-max` (the file name) or case-insensitive input. |
| A-5 | Justifications are printed on one line each, without wrapping. | yes | Every stored justification is a single line (checked: no `\n` in any of the three JSON files). Wrapping would add width rules with no AC behind them. | Wrap at 100 columns. |

## 3. Current system
- `package.json:25`: `"chart:print": "node --import ./tools/playtest/resolve-ts.js tools/chart-print/main.ts"`.
  npm forwards arguments after `--`, and also bare ones (`npm run chart:print heads-up`). npm 10.9.3 passes the
  script's exit code through unchanged (checked: a script that exits 2 makes `npm run` exit 2).
- `tools/chart-print/main.ts:1-6`: writes `formatChart(SIX_MAX_CHART)` to stdout and ignores argv.
- `src/advice/chart-print.ts:41-58`: `formatSpot(spot)` gives a 15-line block (header
  `<POS> <situation>: raise x.x%, continue y.y%`, a column header and 13 rows, each ending in `\n`).
  `formatChart(chart)` joins the spot blocks with one empty line.
- `src/advice/preflop-chart.ts:15-26`: `ChartSpot.justification: string` and `PreflopChart.justification: string`.
  `parseChart` (`:185-231`) returns the spots in `APPLICABLE_SPOTS[size]` order (`:51-74`): heads-up has 6 spots,
  6-max 26 and full-ring 41.
- `src/advice/preflop.ts:21-30`: `PREFLOP_CHARTS: Record<ReferenceSize, PreflopChart>`, validated at import.
- `src/playtest/cli.ts:27-30` `CliIo { out, err }` and `:359-369` `main(argv, io): number`, with usage errors
  returning 2. `tools/playtest/main.ts` sets `process.exitCode = main(process.argv.slice(2), {out, err})`.
- Tests: Vitest; coverage counts `src/**` only (`vite.config.ts:13-16`). Spawned processes add no coverage, so
  `chartPrintMain` needs in-process unit tests. Files named `*.acceptance.test.*` run in `npm test` and
  `test:sweeps`, not in `test:unit` (`package.json:14-15`).
- Locked tests that pin today's output: `tests/advice/chart-print.acceptance.test.ts` (owner TASK-7.19,
  `doit/TASK-7.19/state.json` locked_tests). It pins the no-argument output (26 blocks × 15 lines,
  equal to `formatChart(SIX_MAX_CHART)`) and the exact `formatChart`, `cellToken` and `spotWidths` behaviour. This design
  leaves all of that unchanged, so **no locked-test edit is needed**. `tests/advice/six-max-chart.acceptance.test.ts`
  (TASK-7.19) pins chart content, which this task does not touch. `tests/advice/reference-charts.test.ts:4`
  imports `spotWidths` (unlocked, unaffected).
- Existing code to reuse:
  - `src/advice/chart-print.ts` `formatSpot` → each spot's grid block. Do not reformat the grid.
  - `src/advice/preflop.ts` `PREFLOP_CHARTS` → size → validated chart. Do not re-read the JSON.
  - `src/advice/preflop-chart.ts` `APPLICABLE_SPOTS` → expected spot order in the tests.
  - `src/playtest/cli.ts` `CliIo` shape → copy the `{ out, err }` io pattern. Declare a local interface rather than
    import from playtest, so advice does not depend on playtest.
  - `tests/support/sandbox.ts` `REPO_ROOT`, `sandboxEnv()` and the npm-banner stripping of
    `chart-print.acceptance.test.ts:24-37` → copy the spawn helper into the new acceptance file, passing extra args.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Argument handling lives in `src/advice/chart-print.ts` as `chartPrintMain(argv, io): number`. `tools/chart-print/main.ts` only wires `process.argv.slice(2)` and stdout/stderr. | Parse argv inside `tools/` (no coverage there) | Same pattern as `tools/playtest/main.ts` and `src/playtest/cli.ts`. The logic stays covered. | no | n/a |
| D-2 | The review format is a new function, `formatChartForReview`. `formatChart` is unchanged. | Add an options flag to `formatChart` | Keeps the locked contract of `formatChart` exactly as it is. | no | n/a |
| D-3 | No-argument default and review format per A-1/A-2. | see A-1, A-2 | Backward compatible and needs no locked-test edit. | no (reversible dev-tool output) | n/a |

## 5. Design

### Files to create / modify
- `src/advice/chart-print.ts` — add `formatChartForReview`, `ChartPrintIo`, `CHART_PRINT_USAGE`, `chartPrintMain`
- `tools/chart-print/main.ts` — call `chartPrintMain(process.argv.slice(2), io)` and set `process.exitCode`
- `tests/advice/chart-print-sizes.acceptance.test.ts` — new: spawns `npm run chart:print -- <size>` (SPEC-01..04)
- `tests/advice/chart-print-review.test.ts` — new: in-process unit tests (SPEC-05, SPEC-06)

### Components, interfaces and data
```ts
export interface ChartPrintIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
export const CHART_PRINT_USAGE = 'Usage: npm run chart:print -- [heads-up | 6-max | full-ring]\n';
/** Header, chart justification, then per spot: formatSpot(spot) + 'Why: ' + justification. */
export function formatChartForReview(chart: PreflopChart): string;
/** 0 = printed; 2 = usage error (nothing on stdout). */
export function chartPrintMain(argv: readonly string[], io: ChartPrintIo): number;
```
`chart-print.ts` may import `PREFLOP_CHARTS` from `./preflop`. No cycle: `preflop.ts` does not import
`chart-print.ts`.

### Rules and algorithms
- `chartPrintMain(argv, io)`:
  1. `argv.length === 0` → `io.out(formatChart(PREFLOP_CHARTS['6-max']))`, return 0. This is byte-identical to today.
  2. `argv.length === 1` and `Object.hasOwn(PREFLOP_CHARTS, argv[0])` →
     `io.out(formatChartForReview(PREFLOP_CHARTS[argv[0]]))`, return 0.
  3. `argv.length === 1`, any other value → `io.err('Unknown chart size "<arg>". Use heads-up, 6-max or full-ring.\n' + CHART_PRINT_USAGE)`, return 2.
  4. `argv.length >= 2` → `io.err('Expected one chart size, got <n> arguments.\n' + CHART_PRINT_USAGE)`, return 2.
  Each call writes to exactly one of `out` and `err`, exactly once.
- `formatChartForReview(chart)` returns exactly:
  ```
  <referenceSize> chart: <spots.length> spots\n
  <chart.justification>\n
  \n
  ```
  followed by `chart.spots.map((s) => formatSpot(s) + 'Why: ' + s.justification + '\n').join('\n')`.
  Each spot block is therefore 16 lines (15 grid lines and one `Why:` line). Blocks are separated by one empty
  line, and the output ends with a single `\n`.
- Worked example, heads-up (first lines):
  ```
  heads-up chart: 6 spots
  A tight-aggressive plan for heads-up fixed-limit hold'em, where we face a single opponent. ...
  
  BTN unopened: raise 76.5%, continue 88.2%
       A    K    Q ...
  ...(13 grid rows)
  Why: Heads-up the button acts first before the flop but last on every later street, ...
  
  BB limpers: raise 26.4%, continue ...
  ```
  (The percentages come from doc-87 and are only illustrative. Tests compute them from the JSON.)

### Error handling and configuration
- Unknown size, e.g. `npm run chart:print -- 9max`: stderr
  `Unknown chart size "9max". Use heads-up, 6-max or full-ring.` then
  `Usage: npm run chart:print -- [heads-up | 6-max | full-ring]`. Exit code 2. stdout empty.
- Two or more arguments, e.g. `-- heads-up full-ring`: stderr `Expected one chart size, got 2 arguments.` plus the
  usage line. Exit code 2.
- Empty-string argument (`-- ""`): an unknown size, reported as `Unknown chart size "".` with the same usage line.
- An invalid shipped chart throws at import, as today (TASK-7.19 §5). This behaviour is unchanged.

## 6. Behaviour specification

### SPEC-01: heads-up prints every spot's grid and justification
- Verifies: AC#1
- Behaviour: Given the repo, When `npm run chart:print -- heads-up` runs, Then the exit code is 0 and stderr is empty.
  With npm's `>` banner lines removed, stdout ends with `\n` and line 1 is `heads-up chart: 6 spots`. Line 2 equals
  `heads-up.json`'s top-level `justification`, and line 3 is empty. The rest splits on `\n\n` into 6 blocks in
  `APPLICABLE_SPOTS['heads-up']` order. Each block has 16 lines. Line 0 is `<POS> <situation>: raise x.x%,
  continue y.y%`, computed from the raw JSON grid with the combo weights 6 (pair), 4 (suited) and 12 (offsuit).
  Line 1 holds the ranks `A K Q J T 9 8 7 6 5 4 3 2`. Lines 2–14 are each rank followed by that JSON grid row's
  tokens. Line 15 is `Why: ` + the spot's raw JSON `justification`.
- Verification: acceptance `tests/advice/chart-print-sizes.acceptance.test.ts::chart:print heads-up prints each spot's grid and justification`

### SPEC-02: full-ring prints every spot's grid and justification
- Verifies: AC#1
- Behaviour: Given the repo, When `npm run chart:print -- full-ring` runs, Then it meets the same checks as SPEC-01,
  with header `full-ring chart: 41 spots`, `full-ring.json`'s justifications and 41 blocks in
  `APPLICABLE_SPOTS['full-ring']` order. The first block starts `UTG unopened: `, and one block starts
  `UTG+1 unopened: `.
- Verification: acceptance `tests/advice/chart-print-sizes.acceptance.test.ts::chart:print full-ring prints each spot's grid and justification`

### SPEC-03: 6-max with an argument prints its grids and justifications
- Verifies: AC#1
- Behaviour: Given the repo, When `npm run chart:print -- 6-max` runs, Then it meets the same checks as SPEC-01, with
  header `6-max chart: 26 spots`, `six-max.json`'s justifications and 26 blocks. Line 0 of the first block is
  `UTG unopened: raise 16.0%, continue 16.0%`.
- Verification: acceptance `tests/advice/chart-print-sizes.acceptance.test.ts::chart:print 6-max prints each spot's grid and justification`

### SPEC-04: an unknown size is rejected with the valid names
- Verifies: AC#1
- Behaviour: Given the repo, When `npm run chart:print -- 9max` runs, Then the exit code is 2. stdout, with the banner
  removed, is empty. stderr contains the line `Unknown chart size "9max". Use heads-up, 6-max or full-ring.` and the
  line `Usage: npm run chart:print -- [heads-up | 6-max | full-ring]`.
- Verification: acceptance `tests/advice/chart-print-sizes.acceptance.test.ts::chart:print rejects an unknown size`

### SPEC-05: no argument keeps today's 6-max output
- Verifies: AC#1
- Behaviour: Given the repo, When `npm run chart:print` runs with no argument, Then the output is unchanged: 26
  blocks of 15 lines, no justification lines, equal to `formatChart(SIX_MAX_CHART)`. Also, in process,
  `chartPrintMain([], io)` returns 0, writes nothing to `err`, and writes once to `out`, exactly
  `formatChart(SIX_MAX_CHART)`.
- Verification: unit `tests/advice/chart-print-review.test.ts::no argument prints the 6-max chart exactly as before`
  (the spawn side stays covered by the locked `tests/advice/chart-print.acceptance.test.ts`, which must pass unchanged)

### SPEC-06: argument handling and review layout in process
- Verifies: AC#1
- Behaviour: Given `chartPrintMain` with a recording io:
  - `['heads-up']`, `['6-max']`, `['full-ring']` each return 0 with one `out` write equal to
    `formatChartForReview(PREFLOP_CHARTS[size])`, and no `err` write.
  - `['9max']`, `['']`, `['toString']`, `['HEADS-UP']` and `['six-max']` each return 2. There is no `out` write, and
    exactly one `err` write equal to `Unknown chart size "<arg>". Use heads-up, 6-max or full-ring.\n` + `CHART_PRINT_USAGE`.
  - `['heads-up', 'full-ring']` returns 2 with `err` = `Expected one chart size, got 2 arguments.\n` + `CHART_PRINT_USAGE`.
  - `formatChartForReview(HEADS_UP_CHART)` starts `heads-up chart: 6 spots\n` + `HEADS_UP_CHART.justification` +
    `\n\n` + `formatSpot(spots[0])` + `Why: ` + `spots[0].justification` + `\n\n`, ends with one `\n` (not `\n\n`),
    and has 6 lines that start with `Why: `.
- Verification: unit `tests/advice/chart-print-review.test.ts::chartPrintMain validates the size argument and prints the review layout`

### SPEC-07: all project checks pass
- Verifies: AC#1
- Behaviour: Given the change, When format, lint, typecheck and the full test suite run, Then all of them exit 0, the
  locked TASK-7.19 tests are byte-unchanged, and coverage thresholds still hold.
- Verification: command `npm run format && npm run lint && npm run typecheck && npm test`

## 7. Edge cases
- No argument → SPEC-05. Unknown size, empty string, wrong case, file-name alias → SPEC-04, SPEC-06.
- Prototype keys (`toString`, `constructor`) → SPEC-06 (`Object.hasOwn`).
- Too many arguments → SPEC-06.
- Duplicate or missing spots and invalid charts: N/A. `parseChart` rejects them at import (existing behaviour).
- Concurrency, interruption, permissions: N/A. The command is a one-shot read-only print.

## 8. Security considerations
- Trust boundary: the CLI argument, from a local developer. It is only compared against the three own keys of
  `PREFLOP_CHARTS` (`Object.hasOwn`), never used as a path, and echoed only to the local stderr.
- No authn/authz, secrets, sensitive data, randomness or new dependencies.

## 9. Non-functional
- No timing targets are asserted (standing rule: speed checks only in the opt-in slow group). Each spawn takes
  about 1 s (Node start-up), the same as the existing TASK-7.19 test.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run chart:print -- heads-up` (also `-- full-ring`, `-- 6-max`, no argument, `-- 9max`)
- New tests:
  - `tests/advice/chart-print-sizes.acceptance.test.ts` → SPEC-01, SPEC-02, SPEC-03, SPEC-04
  - `tests/advice/chart-print-review.test.ts` → SPEC-05, SPEC-06
- End-to-end scenario for the Judge: run `npm run chart:print -- heads-up` and check for 6 grids, each followed by a
  `Why:` line, after a header and the chart-level text. Run `-- full-ring` and check for 41 grids including
  UTG+1/MP/LJ spots. Run with no argument and check it matches today (`doit/TASK-7.19/chart-print.txt` is a reference
  for the format). Run `-- 9max` and check the error text and that `echo $?` gives 2.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-7.27/qa.md`.
