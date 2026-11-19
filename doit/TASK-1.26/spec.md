# Spec: TASK-1.26 — Pin the playtest summary and policy-lifetime tests

Status: READY (approved 2026-11-19)
Task: TASK-1.26 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-1.6, doc-15; AC#5 from TASK-3.1, doc-21) · Dream: limit-holdem-trainer

## 1. Summary
This is a test and lint-config chore with no change to product code. New tests pin the playtest "Largest
pot" value. One checks `summarize` on hand-built hands (AC#1) and one checks a real run's report against an
independent recomputation (AC#2). Between them they kill the two mutants named in doc-15. A unit test pins
that each seat's policy is created once per hand (AC#3). The headless-boundary lint is extended to
`src/playtest` and `src/table` (AC#4, AC#5). Once lint enforces `src/table`, TASK-3.1's hand-written
import-scan test (its SPEC-10) is redundant and is removed (AC#5).

## 2. Scope
- In scope:
  - `tools/lint/headless-boundary.js`: lint `src/playtest/**` and `src/table/**` with the same headless rules.
  - New acceptance tests: `tests/playtest/summary.acceptance.test.ts` (AC#1, AC#2) and
    `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (AC#4, AC#5).
  - New unit test in `tests/playtest/runner.test.ts` (AC#3).
  - Remove `it('session module imports no UI code')` from `tests/table/session.test.ts` (AC#5).
  - README "headless" bullet names the two new linted folders.
- Not doing:
  - Any change to `src/**` production code (`summarize`, `playHand` and the CLI already behave correctly; this
    task only pins them).
  - Changing `HEADLESS_DIRS` or the coverage threshold glob in `vite.config.ts:16`. The locked TASK-1.1
    tests iterate `HEADLESS_DIRS`, and the coverage one expects the exact text
    `"src/{engine,bots,advice,stats}/**" threshold (90%)`. See D-1.
  - Editing any locked test: `tests/toolchain/boundary.test.ts`, `boundary.property.test.ts`,
    `coverage.test.ts` (TASK-1.1), `tests/playtest/runner.acceptance.test.ts`,
    `playtest.acceptance.test.ts` (TASK-1.6).
  - Linting browser globals separately for the new folders: they get the whole rule block, but the new
    tests only check imports, as the ACs ask.
  - Linting `tools/playtest/**` (TASK-1.1 A-11 stays).
- Scope budget: files=6, lines=230

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The two new folders go into a separate exported list, `LINT_ONLY_HEADLESS_DIRS = ['playtest', 'table']`. `HEADLESS_FILES` covers `HEADLESS_DIRS` plus this list, and `HEADLESS_DIRS` stays the REQ-059.2 set | yes | Adding them to `HEADLESS_DIRS` would break the locked `tests/toolchain/coverage.test.ts:50-66`. That test loops over `HEADLESS_DIRS` and expects the 90% glob message, which does not cover these folders | Add them to `HEADLESS_DIRS`, widen the `vite.config.ts` 90% glob and unlock and edit the TASK-1.1 coverage test (D-1) |
| A-2 | The AC#2 run is `--hands 20 --seed 42 --size 4` (seeded random-move policy). Today it gives Largest pot $152 in hand 16; the last hand's pot is $64 | yes | Random-move at size 4 is the fixed M1 policy, so it stays steadier than TAG at 6. Its largest pot is not in the last hand, so the "last hand" mutant fails | Size 6 (TAG: $40 in hand 8, which moves whenever TAG is tuned) |
| A-3 | The AC#2 recomputation uses each completed hand's sum of `players[].totalContribution` (`src/engine/hand.ts:38`), not the awards | yes | It comes from different data than `summarize` reads (`awards`), so it is a truly independent check | Sum of `actions[].added` |
| A-4 | The AC#3 test is a `unit` test in the existing `tests/playtest/runner.test.ts` | yes | Policy lifetime is internal and nothing a user can see | A new acceptance file |

## 3. Current system
- `summarize` computes the pot per hand as `awards.reduce(sum + award.amount)` and keeps the max
  (`src/playtest/runner.ts:210-211`). No test checks a non-zero value. The only assertion is
  `largestPot` = 0 for abandoned hands (`tests/playtest/runner.test.ts:87`). The CLI tests pass
  hand-built summaries (`tests/playtest/cli.test.ts:113,211`).
- `playHand` builds `policies` once per hand from `makePolicy(code, seat)` (`src/playtest/runner.ts:142`).
  `PolicyFactory` is the test seam (`runner.ts:36,44-51`).
- `PotAward { pot, amount, winners }` (`src/engine/hand.ts:61-65`). `PlayerState.totalContribution` (`hand.ts:38`).
- CLI `main(argv, io, seams)` returns the exit code and writes the report through `io.out`
  (`src/playtest/cli.ts:17,202-225`). The report line is ``Largest pot: $${summary.largestPot}``
  (`cli.ts:122`).
- Headless lint: `HEADLESS_DIRS = ['engine','bots','advice','stats']` and
  `HEADLESS_FILES = HEADLESS_DIRS.map(dir => 'src/<dir>/**')` (`tools/lint/headless-boundary.js:6-8`).
  `headlessBoundaryConfig.files = HEADLESS_FILES` (`:46`). The forbidden import patterns cover `react*`, IndexedDB libraries
  and `**/ui` (`:28-41`). Wired into `eslint.config.js:27`.
- Locked consumers of `HEADLESS_DIRS`: `tests/toolchain/boundary.test.ts:26-40` and
  `boundary.property.test.ts:58-75`, which still pass with more dirs, and `tests/toolchain/coverage.test.ts:50-66`,
  which would fail (see A-1). All three are locked in `doit/TASK-1.1/state.json`.
- I ran the current `src/playtest/**` and `src/table/**` under `headlessBoundaryConfig` through the ESLint API
  (read-only probe). It reported 0 messages, so extending the rule needs no production-code change.
- TASK-3.1 SPEC-10 (`doit/TASK-3.1/spec.md:306-310`) is the test
  `tests/table/session.test.ts:89-100` `it('session module imports no UI code')`. `readFileSync`
  (`session.test.ts:1`) is used only there. `nextStep` and `seatSession` are used elsewhere in the file and stay.
  The file is not locked (TASK-3.1 locks only `session.acceptance.test.ts`, `table.acceptance.test.tsx` and
  `e2e/table.spec.ts`). TASK-3.1 §11 (`spec.md:449`) planned this replacement.
- Tests run with Vitest (`npm test` = `vitest run --coverage`, node environment, `vite.config.ts:7-16`). The
  toolchain tests lint probe files in a temporary copy of the project config with
  `runInSandbox(files, 'lint')` (`tests/support/sandbox.ts:52-77`), which copies
  `tools/lint/headless-boundary.js`. One sandbox lint run takes about 0.5–2 s.
- Existing code to reuse:
  - `tests/support/sandbox.ts` → `runInSandbox`, `TOOLCHAIN_TIMEOUT_MS`.
  - `tests/toolchain/boundary.test.ts:5-14` → the shape of the probe files (copy the pattern; the locked file is not imported).
  - `tests/playtest/runner.test.ts:34-39` → the `raiseToCap` factory (every street reaches 4 bets, so each seat
    makes several decisions).
  - `src/playtest/runner.ts` → `playHand`, `runPlaytest`, `summarize`, `handReplayCode`.
  - `src/playtest/cli.ts` → `main` with a capturing `CliIo`, as in `tests/playtest/cli.test.ts`.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Extend only the lint `files`, through `LINT_ONLY_HEADLESS_DIRS` (A-1). No coverage threshold change | Merge into `HEADLESS_DIRS` and unlock and edit the locked TASK-1.1 coverage test | Meets AC#4 and AC#5 without editing a locked test from another story. Both folders already have about 100% line coverage | no | n/a |
| D-2 | AC#1 uses hand-built `PlayedHand`s (a real completed hand with `final.result.awards` replaced). AC#2 uses a real run | Only real runs | Real runs never produce side pots before TASK-1.9, so only hand-built awards with `pot: 1` can kill the "sum the pot index" and "largest single award" mutants | no | n/a |

## 5. Design

### Files to create / modify
- `tools/lint/headless-boundary.js` — modify: add `LINT_ONLY_HEADLESS_DIRS`; `HEADLESS_FILES` covers both lists;
  update the header comment.
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` — new: SPEC-04, SPEC-05.
- `tests/playtest/summary.acceptance.test.ts` — new: SPEC-01, SPEC-02.
- `tests/playtest/runner.test.ts` — modify: add the SPEC-03 test.
- `tests/table/session.test.ts` — modify: delete the SPEC-10 test (lines 89-100) and the now-unused
  `readFileSync` import (line 1) (SPEC-06).
- `README.md` — modify: the bullet at `README.md:135-136` also says that lint applies the same import and
  global rules to `src/playtest` and `src/table`. The 90% coverage line (`:137`) stays about the four folders.

### Components, interfaces and data
- `tools/lint/headless-boundary.js`:
  ```js
  /** Folders under src/ that must stay headless (REQ-059.2; 90% coverage threshold). */
  export const HEADLESS_DIRS = ['engine', 'bots', 'advice', 'stats'];
  /** Also linted as headless, but outside REQ-059.2's coverage set. */
  export const LINT_ONLY_HEADLESS_DIRS = ['playtest', 'table'];
  export const HEADLESS_FILES = [...HEADLESS_DIRS, ...LINT_ONLY_HEADLESS_DIRS].map((dir) => `src/${dir}/**`);
  ```
  Nothing else in the file changes. `checkJs` typechecks it (`tsconfig.json`).

### Rules and algorithms
- AC#1 fixture: `base = playHand(handReplayCode(42, 1), 4, 1)` (a completed hand, `final.result !== null`).
  `withAwards(n, awards)` returns `{ ...base, number: n, final: { ...base.final, result: { ...base.final.result, awards } } }`.
  - Hand A: awards `[{ pot: 0, amount: 100, winners: [{ seat: 1, amount: 100 }] }, { pot: 1, amount: 40, winners: [{ seat: 2, amount: 40 }] }]`, which totals 140.
  - Hand B: `[{ pot: 0, amount: 60, winners: [{ seat: 3, amount: 60 }] }]`, which totals 60.
  - Hand C: `[{ pot: 0, amount: 20, winners: [{ seat: 1, amount: 20 }] }]`, which totals 20.
  - `summarize([A, B]).largestPot === 140` and `summarize([B, A, C]).largestPot === 140`.
    Mutants caught: last hand only (60 / 20), sum of `award.pot` (1), largest single award (100), first hand only
    (60 in the second call).
- AC#2: `collect` = `runPlaytest({ hands: 20, seed: 42, size: 4 }, h => played.push(h))`. For each hand,
  `pot = final.result === null ? 0 : sum(final.players[].totalContribution)`, and `expected = max(pot)`. The report
  comes from `main(['--hands','20','--seed','42','--size','4'], io)` → exit 0, and stdout contains the line
  `Largest pot: $<expected>\n`. Preconditions asserted in the test so it can't pass vacuously: `expected > 0`,
  and the last hand's pot `< expected`. Today's values: expected 152 (hand 16), last 64.
- AC#3: `counting: PolicyFactory = (code, seat) => { created.push(\`${code}/${seat}\`); const p = raiseToCap(code, seat); return (view) => { decisions.set(seat, (decisions.get(seat) ?? 0) + 1); return p(view); }; }`.
  - `playHand(handReplayCode(5, 1), 4, 2, 1, { makePolicy: counting })` gives `created` sorted equal to
    `['<code>/1', … '<code>/4']` (length 4), and at least one seat has `decisions ≥ 2`. Every street reaches 4
    bets, so all seats decide several times.
  - `runPlaytest({ hands: 3, seed: 5, size: 4 }, undefined, { makePolicy: counting })` (fresh arrays) gives
    `created.length === 12` and `new Set(created).size === 12`.
- AC#4/#5 probe (one sandbox lint run):
  - `src/playtest/ui-probe.ts` and `src/table/ui-probe.ts` each contain
    `import { useState } from 'react';`, `import { createRoot } from 'react-dom/client';` and
    `import App from '../ui/App';`, and export all three.
  - `src/ui/App.ts` holds a stub default export, as in boundary.test.ts.
  - Assertions: exit code ≠ 0. For each probe, the output has a line ending with `src/<dir>/ui-probe.ts` (the
    ESLint stylish file header). The block from that header to the next blank line contains
    `'react' import is restricted`, `'react-dom/client' import is restricted` and `'../ui/App' import is restricted`,
    each on a line that also contains `REQ-059.2`.
  - A second check in the same file asserts `LINT_ONLY_HEADLESS_DIRS` equals `['playtest', 'table']`, and that
    `HEADLESS_FILES` contains `src/playtest/**` and `src/table/**` and still contains the four
    `HEADLESS_DIRS` globs.

### Error handling and configuration
- N/A: no runtime code changes. The toolchain test uses `TOOLCHAIN_TIMEOUT_MS`.

## 6. Behaviour specification

### SPEC-01: Largest pot is the largest per-hand sum of award amounts
- Verifies: AC#1
- Behaviour: Given hand-built hands A (awards 100 in pot 0 + 40 in pot 1) and B (60), When `summarize([A, B])`
  runs, Then `largestPot` is 140. And When `summarize([B, A, C])` runs (C = 20), Then `largestPot` is 140.
- Verification: acceptance `tests/playtest/summary.acceptance.test.ts::Largest pot is the largest per-hand sum of award amounts`

### SPEC-02: A real run's Largest pot line matches an independent recomputation
- Verifies: AC#2
- Behaviour: Given `--hands 20 --seed 42 --size 4`, When `main` builds the report, Then it exits 0 and prints
  `Largest pot: $N`. N equals the max over the same run's hands of the sum of `totalContribution` (0 for
  hands with no result). N > 0, and the last hand's pot is below N.
- Verification: acceptance `tests/playtest/summary.acceptance.test.ts::the report's Largest pot matches the played hands`

### SPEC-03: Each seat's policy is created once per hand
- Verifies: AC#3
- Behaviour: Given a counting `makePolicy` wrapped around `raiseToCap`, When `playHand` plays one 4-seat hand,
  Then the factory was called exactly once per seat (4 calls, seats 1..4) and some seat made at least 2
  decisions. When `runPlaytest` plays 3 such hands, Then there are 12 calls, all distinct `(code, seat)` pairs.
- Verification: unit `tests/playtest/runner.test.ts::creates each seat's policy once per hand`

### SPEC-04: Lint rejects UI and browser-module imports in src/playtest, naming the file
- Verifies: AC#4
- Behaviour: Given `src/playtest/ui-probe.ts` imports `react`, `react-dom/client` and `../ui/App`, When
  `npm run lint` runs in the sandbox, Then it exits non-zero. Under the `src/playtest/ui-probe.ts` file
  header the output shows each import's "import is restricted" error with `REQ-059.2`.
- Verification: acceptance `tests/toolchain/headless-lint-dirs.acceptance.test.ts::lint rejects UI and browser imports in src/playtest and src/table, naming each file`

### SPEC-05: Lint rejects UI and browser-module imports in src/table, naming the file
- Verifies: AC#5
- Behaviour: The same as SPEC-04, for `src/table/ui-probe.ts` in the same sandbox run. In addition,
  `LINT_ONLY_HEADLESS_DIRS` is `['playtest', 'table']`, and `HEADLESS_FILES` holds those globs plus the four
  `HEADLESS_DIRS` globs.
- Verification: acceptance `tests/toolchain/headless-lint-dirs.acceptance.test.ts::lint rejects UI and browser imports in src/playtest and src/table, naming each file` (the list checks are in the same file, in `it('the lint-only headless folders are playtest and table')`)

### SPEC-06: TASK-3.1's import-scan test is removed and the real tree stays lint-clean
- Verifies: AC#5
- Behaviour: Given the change, When the repository is searched, Then `tests/table/session.test.ts` has no
  test named `session module imports no UI code` and no `readFileSync` import. When `npm run lint` runs on the
  real repository, Then it exits 0, so the current `src/playtest` and `src/table` code obeys the rule.
- Verification: command `! grep -n "session module imports no UI code\|readFileSync" tests/table/session.test.ts && npm run lint` → exit 0

### SPEC-07: Full checks stay green
- Verifies: AC#1, AC#2, AC#3, AC#4, AC#5
- Behaviour: Given the change, When the full test suite, lint and typecheck run, Then all exit 0, coverage
  thresholds are still met, and the locked TASK-1.1 and TASK-1.6 tests are unchanged.
- Verification: command `npm test && npm run lint && npm run typecheck` → exit 0

## 7. Edge cases
- Side pots: real runs have none before TASK-1.9, so hand-built awards cover them (SPEC-01).
- Abandoned hands (`result === null`): already covered (`runner.test.ts:87`). SPEC-02 counts them as 0.
- Max in the first or last hand: SPEC-01 (max first, then max in the middle) and the SPEC-02 precondition.
- Type-only and dynamic imports in the new folders: the rule block is unchanged, so they are covered just as
  for the existing folders (locked boundary.test.ts:69-89 checks them for `src/engine`). No new SPEC is needed.
- Concurrency, permissions, interruption: N/A (pure tests and a lint config).

## 8. Security considerations
N/A. No runtime code, no new dependencies and no untrusted input. The sandbox writes fixed probe files to
a temporary directory, as the existing toolchain tests already do.

## 9. Non-functional
- The new sandbox test does one lint run (about 0.5–2 s, measured at 0.46–2.1 s for the existing boundary
  tests) under `TOOLCHAIN_TIMEOUT_MS` (120 s). The AC#2 run plays 20 hands twice (well under 1 s).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run playtest -- --hands 20 --seed 42 --size 4`
- New tests:
  - `tests/playtest/summary.acceptance.test.ts` → SPEC-01, SPEC-02
  - `tests/playtest/runner.test.ts` (new `it`) → SPEC-03
  - `tests/toolchain/headless-lint-dirs.acceptance.test.ts` → SPEC-04, SPEC-05
  - Commands → SPEC-06, SPEC-07
- End-to-end scenario for the Judge:
  1. Run `npm run playtest -- --hands 20 --seed 42 --size 4` and note `Largest pot: $152`. Confirm by hand from
     the hand-16 replay that this is the largest pot.
  2. Put `import { useState } from 'react';` into a scratch file `src/table/x.ts` and run `npm run lint`. It
     fails and names `src/table/x.ts`. Do the same in `src/playtest/x.ts`, then delete both files.
  3. Mutate `runner.ts:211` to `largestPot = pot`, then `sum + award.pot`. `npm test` fails each time. Move the
     `makePolicy` call into the decision loop and `npm test` fails.
- Notes for the orchestrator: this task removes a test from another story (TASK-3.1 SPEC-10,
  `tests/table/session.test.ts:89-100`), as AC#5 says. Record this in TASK-1.26's implementation notes, as was
  done for TASK-2.1 Q-3 and TASK-3.2 Q-1.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-1.26/qa.md`.
