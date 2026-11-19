# TASK-1.26: Pin the playtest summary and policy-lifetime tests

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up of TASK-1.6 / doc-15; AC#5 from TASK-3.1) · Branch: doit/TASK-1.26

## What was asked
A test and lint-config chore with no production-code change. Pin the playtest "Largest pot" value (two mutants from TASK-1.6's doc-15 survived), pin that each seat's policy is created once per hand, and extend the headless-boundary lint to `src/playtest` and `src/table` (which lets TASK-3.1's hand-written import-scan test be removed). Spec: doit/TASK-1.26/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The new folders go in a separate exported list `LINT_ONLY_HEADLESS_DIRS = ['playtest','table']`; `HEADLESS_FILES` covers both lists; `HEADLESS_DIRS` stays the REQ-059.2 set | yes | Adding them to `HEADLESS_DIRS` would break the locked TASK-1.1 coverage test (expects the 90% glob message) | Merge into `HEADLESS_DIRS`, widen the `vite.config.ts` 90% glob, unlock and edit TASK-1.1's coverage test |
| A-2 | AC#2 run is `--hands 20 --seed 42 --size 4` (random-move policy); Largest pot $152 in hand 16, last hand $64 | yes | Fixed M1 policy is steadier than TAG; max is not in the last hand, so the "last hand" mutant fails | Use size 6 (TAG), but that moves whenever TAG is tuned |
| A-3 | Independent recomputation sums `players[].totalContribution`, not the awards | yes | Different data from what `summarize` reads | Sum `actions[].added` |
| A-4 | The policy-lifetime test is a unit test in `tests/playtest/runner.test.ts` | yes | Internal behaviour, not user-visible | Move to a new acceptance file |

## Clarifications and decisions
No questions were asked (qa.md does not exist; state.json shows 0 questions).
- D-1: Extend only lint `files`; no coverage threshold change, so no locked TASK-1.1 test is edited.
- D-2: AC#1 uses hand-built `PlayedHand`s (real completed hand with `awards` replaced), since real runs have no side pots before TASK-1.9. AC#2 uses a real run.

## What was built
- `tools/lint/headless-boundary.js`: new `LINT_ONLY_HEADLESS_DIRS`; `HEADLESS_FILES` = `HEADLESS_DIRS` + that list.
- `tests/playtest/summary.acceptance.test.ts` (new): SPEC-01 (hand-built awards: 140 from 100+40 beats 60 and 20 in either order) and SPEC-02 (CLI report line equals max of summed `totalContribution`; asserts expected > 0 and last hand lower).
- `tests/playtest/runner.test.ts`: new unit test `creates each seat's policy once per hand` (4 factory calls per hand, 12 distinct for 3 hands, some seat decides at least twice).
- `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (new): one sandbox lint run with react / react-dom / `../ui/App` probes in both folders; checks the file header and REQ-059.2 messages, plus the list contents.
- `tests/table/session.test.ts`: removed TASK-3.1 SPEC-10 test `session module imports no UI code` and the unused `readFileSync` import. This removes a test belonging to another story, as AC#5 requires.
- `README.md`: headless bullet mentions the two folders.
- No `src/**` change, no new dependencies. 173 changed lines across 6 files.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance, summary.acceptance.test.ts | PASS | gate build-1, judge round 1 |
| SPEC-02 | AC#2 | acceptance, summary.acceptance.test.ts | PASS | report shows `Largest pot: $152` |
| SPEC-03 | AC#3 | unit, runner.test.ts | PASS | mutant (makePolicy per decision) fails |
| SPEC-04 | AC#4 | acceptance, headless-lint-dirs | PASS | sandbox lint names src/playtest/ui-probe.ts |
| SPEC-05 | AC#5 | acceptance, headless-lint-dirs | PASS | same for src/table |
| SPEC-06 | AC#5 | grep + `npm run lint` | PASS | no matches; lint exit 0 |
| SPEC-07 | AC#1-5 | `npm test && npm run lint && npm run typecheck` | PASS | 83 files, 302 passed, 3 skipped |
- Mutation checks in build (source restored each time): `largestPot = pot`, `sum + award.pot`, and `makePolicy` per decision each fail the new tests.
- Gates: 1 run, PASS. Judge: 1 round, PASS, no unproven ACs.

## Review
Round 1 (code and security): no findings. Judge: no blocking findings.

### Non-blocking review notes (deliberately not fixed)
None.

## How to try it
- `npm test && npm run lint && npm run typecheck`
- `npm run playtest -- --hands 20 --seed 42 --size 4` prints `Largest pot: $152`.

## Run metrics
Questions 0 · assumptions 4 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · sendbacks 0 · changed lines 173.

## Known limitations and follow-ups
- Decide whether `src/playtest` and `src/table` should also get the 90% coverage threshold; this needs unlocking and editing TASK-1.1's coverage test and widening the glob at `vite.config.ts:16` (owner: TASK-1.1's coverage test; no existing task known). Both folders already have about 100% line coverage.
- Record in TASK-1.26's implementation notes that TASK-3.1 SPEC-10 was removed (spec section 10 note).

## Lessons for the factory (proposals — not applied)
None; the run had no send-backs, escalations or failures.
