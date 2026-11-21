# Spec: TASK-1.40 — Hold src/playtest and src/table to the 90% coverage threshold

Status: READY (approved 2026-11-20)
Task: TASK-1.40 · Parent/epic: TASK-1 · Requirements: REQ-059.2 (via the headless set) · Dream: limit-holdem-trainer

## 1. Summary
TASK-1.26 put `src/playtest` and `src/table` under the headless lint rule through a separate
`LINT_ONLY_HEADLESS_DIRS` list. They were kept out of the 90% coverage threshold so that TASK-1.1's locked
coverage test would not have to change (doc-32 A-1). This task removes that split: both folders join
`HEADLESS_DIRS`, the 90% glob in `vite.config.ts` widens to include them, and the two locked toolchain tests
that depend on the old split are updated with a recorded unlock. No production code changes. Both folders
already have 100% line coverage, so `npm test` stays green.

## 2. Scope
- In scope: the `vite.config.ts` threshold glob, the `tools/lint/headless-boundary.js` lists, the TASK-1.1
  coverage test, the TASK-1.26 lint-dirs test, and the README conventions bullet.
- Not doing: no change to the 70% global threshold or the 90% value. No new coverage metrics (branches,
  functions). No change to the lint rules themselves. No edits to `boundary.test.ts` or
  `boundary.property.test.ts`: they loop over `HEADLESS_DIRS` and pick up the two folders without any edit.
  No new tests for `src/playtest` or `src/table` code, because they are already at 100% lines.
- Scope budget: files=5, lines=40

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | `HEADLESS_DIRS` order is `['engine', 'bots', 'advice', 'stats', 'playtest', 'table']`, and the glob is the literal `'src/{engine,bots,advice,stats,playtest,table}/**'` | yes | Appends to the existing order (`tools/lint/headless-boundary.js:7`), and the threshold message vitest prints is the literal key | Build the glob from `HEADLESS_DIRS` inside `vite.config.ts`. That adds an import of the lint module into the build config, for no gain |
| A-2 | The `LINT_ONLY_HEADLESS_DIRS` export is deleted, not kept as an empty array | yes | AC#2 says "folded into". The only importer is the TASK-1.26 test, which this task edits | Keep `export const LINT_ONLY_HEADLESS_DIRS = []` |

## 3. Current system
- `vite.config.ts:16`: `thresholds: { lines: 70, 'src/{engine,bots,advice,stats}/**': { lines: 90 } }`.
- `tools/lint/headless-boundary.js:7`: `HEADLESS_DIRS = ['engine', 'bots', 'advice', 'stats']`. Line 9:
  `LINT_ONLY_HEADLESS_DIRS = ['playtest', 'table']`. Lines 11-13: `HEADLESS_FILES` covers both lists.
  Lines 1-2 and 6-8 are comments describing the split.
- `tests/toolchain/coverage.test.ts:48-69` is locked by TASK-1.1 (`doit/TASK-1.1/state.json`). For every
  `HEADLESS_DIRS` entry it runs a sandbox `npm test` with a half-covered probe and expects the output
  `does not meet "src/{engine,bots,advice,stats}/**" threshold (90%)` (line 64).
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` is locked by TASK-1.26. It imports
  `LINT_ONLY_HEADLESS_DIRS` (line 5) and asserts that it equals `['playtest','table']` (lines 57-66).
- `tests/toolchain/boundary.test.ts:28` and `tests/toolchain/boundary.property.test.ts:59,69` loop over
  `HEADLESS_DIRS`, so they will cover the two new folders automatically. These are fast: the whole
  boundary file takes about 2.5 s for 4 folders.
- `tests/support/sandbox.ts:18-27` copies `vite.config.ts` and `tools/lint/headless-boundary.js` into
  each sandbox, so sandbox runs use the edited config.
- Current coverage, measured with `npx vitest run --coverage` on 2026-11-20: `playtest` is at 100% lines
  and `table` is at 100% lines. All 101 test files pass.
- README `README.md:170-173` describes the headless set and its coverage.
- Existing code to reuse:
  - `tests/support/sandbox.ts` → `runInSandbox`, `TOOLCHAIN_TIMEOUT_MS` (already used by both tests).
  - The existing probe and filler fixtures in `coverage.test.ts` → reuse them unchanged.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Edit two locked tests owned by other stories: `tests/toolchain/coverage.test.ts` (owner TASK-1.1) and `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (owner TASK-1.26). Before the builder edits them, the orchestrator runs `doit.py unlock TASK-1.1 tests/toolchain/coverage.test.ts --reason "TASK-1.40 AC#2: widen 90% glob to playtest,table"` and `doit.py unlock TASK-1.26 tests/toolchain/headless-lint-dirs.acceptance.test.ts --reason "TASK-1.40 AC#2: LINT_ONLY_HEADLESS_DIRS folded into HEADLESS_DIRS"`, and records both unlocks in this task's notes | Keep the lists split and leave the locked tests alone, as TASK-1.26 D-1 did | AC#2 requires this edit explicitly. The edits only make the tests stricter: two more folders are checked, and the expected message is longer. No existing check is removed | yes | user (TASK-1.40 AC#2, story text; autopilot) |
| D-2 | Fold the lists: `HEADLESS_DIRS` gets 6 entries and `HEADLESS_FILES = HEADLESS_DIRS.map(...)` | Keep two lists and widen only the coverage glob | AC#2 | no | n/a |

## 5. Design

### Files to create / modify
- `vite.config.ts` — threshold key becomes `'src/{engine,bots,advice,stats,playtest,table}/**': { lines: 90 }`.
- `tools/lint/headless-boundary.js` — set `HEADLESS_DIRS` to the 6 folders, delete `LINT_ONLY_HEADLESS_DIRS`,
  derive `HEADLESS_FILES` from `HEADLESS_DIRS` only, and update the header and JSDoc comments.
- `tests/toolchain/coverage.test.ts` — (unlocked, D-1) expected message becomes
  `does not meet "src/{engine,bots,advice,stats,playtest,table}/**" threshold (90%)`. Before the loop, add
  `expect(HEADLESS_DIRS).toEqual(expect.arrayContaining(['playtest', 'table']))`.
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` — (unlocked, D-1) drop the `LINT_ONLY_HEADLESS_DIRS`
  import. The list test becomes "the headless folders include playtest and table". It asserts
  `HEADLESS_DIRS` equals `['engine','bots','advice','stats','playtest','table']` and `HEADLESS_FILES` equals
  `HEADLESS_DIRS.map((d) => \`src/${d}/**\`)`.
- `README.md` — lines 170-173: list all six folders as headless, which also puts them under the 90% coverage
  rule. Remove the separate "Lint applies the same…" sentence.

### Components, interfaces and data
- `tools/lint/headless-boundary.js` exports after the change: `HEADLESS_DIRS` (6 strings), `HEADLESS_FILES`,
  `BROWSER_ONLY_GLOBALS`, `FORBIDDEN_IMPORT_PATTERNS`, `headlessBoundaryConfig`. `LINT_ONLY_HEADLESS_DIRS` is
  removed (A-2).
- Invariant: every `HEADLESS_DIRS` entry `d` is covered by both the lint `files` (`src/d/**`) and the 90%
  coverage glob.

### Rules and algorithms
- Example: a sandbox with `src/table/probe.ts` at 3 of 7 lines covered (about 43%), plus a fully covered
  40-line `src/ui/filler.ts`, gives global coverage above 70%. `npm test` exits non-zero and prints
  `does not meet "src/{engine,bots,advice,stats,playtest,table}/**" threshold (90%)`, and does not print
  `global threshold`.

### Error handling and configuration
- N/A. This is configuration only. The error messages come from vitest.

## 6. Behaviour specification

### SPEC-01: Under-covered playtest or table code fails `npm test` at the 90% headless threshold
- Verifies: AC#1, AC#2
- Behaviour: Given the edited config, When a sandbox `npm test` runs with a half-covered probe in
  `src/<dir>/` for each of engine, bots, advice, stats, playtest and table (global coverage still ≥70%),
  Then each run exits non-zero, prints
  `does not meet "src/{engine,bots,advice,stats,playtest,table}/**" threshold (90%)`, and does not print
  `global threshold`. `HEADLESS_DIRS` includes `playtest` and `table`, so both are exercised.
- Verification: acceptance `tests/toolchain/coverage.test.ts::npm test fails and names the 90% headless threshold when a headless folder is under-covered`

### SPEC-02: The lint-only list is folded into HEADLESS_DIRS
- Verifies: AC#2
- Behaviour: Given `tools/lint/headless-boundary.js`, When it is imported, Then `HEADLESS_DIRS` equals
  `['engine','bots','advice','stats','playtest','table']`, `HEADLESS_FILES` equals
  `HEADLESS_DIRS.map((d) => \`src/${d}/**\`)`, and `LINT_ONLY_HEADLESS_DIRS` is no longer exported
  (`grep -rn LINT_ONLY_HEADLESS_DIRS tools tests src vite.config.ts` prints nothing).
- Verification: acceptance `tests/toolchain/headless-lint-dirs.acceptance.test.ts::the headless folders include playtest and table`

### SPEC-03: The real project still passes coverage with the widened glob
- Verifies: AC#1
- Behaviour: Given the repository after the change, When `npm test` runs, Then it exits 0 with no
  `ERROR: Coverage` line. `playtest` and `table` are at 100% lines today.
- Verification: command `npm test`

### SPEC-04: The lint boundary still applies to every headless folder
- Verifies: AC#2
- Behaviour: Given the folded list, When the unchanged boundary tests run, Then the lint errors for
  forbidden React, DOM, IndexedDB and UI uses are reported for all six folders, including playtest and table.
  The lint-dirs sandbox test still names `src/playtest/ui-probe.ts` and `src/table/ui-probe.ts`.
- Verification: acceptance `tests/toolchain/boundary.test.ts::lint reports each forbidden React, DOM, IndexedDB and UI use in every headless folder`

## 7. Edge cases
- Under-covered file in a new folder: SPEC-01.
- The real code drops below 90% in the future: `npm test` fails by design, which is the purpose of this task.
- Stale import of the removed export: SPEC-02 grep, and typecheck/lint would also fail.
- Concurrency, input, permissions: N/A. This is configuration only.

## 8. Security considerations
N/A. There is no untrusted input, no new dependency, and no secrets. The change is to the test configuration
and lint lists only.

## 9. Non-functional
- Toolchain tests stay within `TOOLCHAIN_TIMEOUT_MS` (120 s). The coverage loop goes from 4 to 6 sandbox
  runs. Today the 4-folder loop takes about 1.8 s, so the 6-folder loop is expected to take about 3 s.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/toolchain/coverage.test.ts tests/toolchain/headless-lint-dirs.acceptance.test.ts tests/toolchain/boundary.test.ts`
- New tests: none. Two locked tests are edited (D-1): coverage.test.ts → SPEC-01 and
  headless-lint-dirs.acceptance.test.ts → SPEC-02. SPEC-04 is covered by the unchanged boundary.test.ts.
- Judge end-to-end: run `npm test` and confirm it is green. Then, in a scratch copy, add
  `src/table/probe.ts` with an uncovered function and a test that covers only part of it. Run `npm test`
  and confirm it fails with the `src/{engine,bots,advice,stats,playtest,table}/**` 90% message.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.40/qa.md`. No questions were asked. D-1 (the cross-story locked-test edit) is required by
AC#2 and recorded under autopilot.
