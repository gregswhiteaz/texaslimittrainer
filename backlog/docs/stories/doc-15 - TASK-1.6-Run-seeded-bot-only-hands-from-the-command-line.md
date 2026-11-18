---
id: doc-15
title: 'TASK-1.6: Run seeded bot-only hands from the command line'
type: other
created_date: '2026-11-18T17:14:00Z'
updated_date: '2026-11-18T17:14:00Z'
---
# TASK-1.6: Run seeded bot-only hands from the command line

Status: Done (judge and CI pending at time of writing) · Completed: 2026-11-18 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-062.1, REQ-062.4, REQ-013.3, REQ-056.1 (cap part only) · Branch: doit/TASK-1.6

## What was asked
A headless playtest runner: `npm run playtest -- --hands <n> --seed <s> --size <players>` plays bot-only fixed-limit hands at a $4/$8 cash table with the production engine. Each seat decides through a `SeatPolicy` that sees only its own `PlayerView`. The output is a fixed-format report that is byte-identical for the same seed and options. Different seeds give different replay codes, a recorded hand can be replayed through the engine, and the M1 random-move policy never makes a fifth bet on a street. A bad `--replay-code` exits 2 with a fixed usage message. Spec: doit/TASK-1.6/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | New code in `src/playtest/` (policy, runner, cli). Process entry and resolve hook in `tools/playtest/`. Tests in `tests/playtest/`. `src/playtest` is NOT added to the headless-boundary lint list | yes | Engine stays untouched; `tools/` already holds scripts; the entry file is outside coverage so `main` is tested in process | Move the policy to `src/bots/`; add `playtest` to `HEADLESS_DIRS` |
| A-2 | Seats are 1..n. Hand k's button is seat `((k-1) mod n)+1` | yes | Every seat holds $160 in M1, so a plain clockwise move is right; TASK-1.16 replaces it | Random first button from the seed |
| A-3 | Every seat starts every hand with $160 (20 x $8) | yes (TASK-1.16 removes it) | Stated in the task description | — |
| A-4 | Violations counted now: (a) `actWith` rejects the policy's action (hand abandoned, still counted as played); (b) `betCount > 4` after any action. Exit 1 when count > 0 | yes | AC#1 needs a count, AC#6 needs the cap observed; TASK-1.8 replaces this with the full checker | Report always 0 until TASK-1.8 |
| A-5 | The random policy picks uniformly among `view.legalActions`, after removing bet/raise when `betCount >= 4` | yes | Simplest policy that reaches every street and the cap | Weighted choice (fewer folds) |
| A-6 | Policy ignores `earlierShowdowns`; the runner passes the default `[]` | yes | A session-long list would grow over 1,000,000 hands; the random policy never reads it | Keep a per-run list |
| A-7 | `engines.node` raised from `>=22.12.0` to `>=22.18.0` | yes | `module.registerHooks` needs 22.15 and unflagged type stripping 22.18; `.nvmrc` and CI already use 22.18.0 | Add `--experimental-strip-types` (still fails below 22.15) |
| A-8 | `replayHand` throws `Error('Replay diverged at action <i>')` if a recorded action is rejected; never returns a partial state | yes | A divergent replay is a bug, like `createHand`'s `RangeError` | Return a typed result |

## Clarifications and decisions
- Q-1 (CLI options and report): user approved the design as proposed. Options are `--hands`, `--seed`, `--size`, `--replay-code` with `--button`, and `--help`. Exit codes are 0/1/2. Error and usage text are fixed. The report is `Label: value` lines in a fixed order, and replay mode prints the hand.
- Q-2 (replay codes from `--seed`): user chose seed + hand number. Hand k's code is `replayCodeFromWords([floor(seed/2^32), seed mod 2^32, 0, k])`. Each seat's generator is `Xoshiro128(fnv1a32(code + '/' + seat))`. So `--replay-code <hand k code> --size n --button b` reproduces hand k of a run exactly.
- Q-3 (running TypeScript): user chose Node built-in type stripping plus a small resolve hook, with no new dependency. The script is `node --import ./tools/playtest/resolve-ts.js tools/playtest/main.ts`.

## What was built
- `src/playtest/policy.ts`: the M1 seeded random-move `SeatPolicy`. It makes exactly one generator draw per decision and never bets or raises at 4 bets.
- `src/playtest/runner.ts`: `handReplayCode`, `playHand`, `runPlaytest` (streams hands to a callback, so memory is O(1) in hands), `summarize` and `replayHand(record)`.
- `src/playtest/cli.ts`: `parseArgs` (strict `/^[0-9]+$/` plus range checks; hands 1..1e9, seed 0..2^53-1, size 3..10, button 1..size), `formatReport`, `formatHand`, `main(argv, io)`.
- `tools/playtest/main.ts` (entry only) and `tools/playtest/resolve-ts.js` (maps relative extensionless imports to `.ts`).
- `package.json`: `playtest` script and the `engines.node` bump.
- No change to `src/engine/**` or existing tests.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..15 (per spec §10) | AC#1-#7 | Acceptance tests `tests/playtest/playtest.acceptance.test.ts` (spawns `npm run playtest`) and `runner.acceptance.test.ts` (in process), both locked; unit tests `policy`, `runner`, `cli` | Pass | build gate run 1 |

- `npm test`: 41 files passed, 128 tests passed, 1 skipped; coverage 100% lines overall. `npm run lint` and `npm run typecheck` are clean.
- Build gate: 1 run, PASS, 1148 changed lines in 11 files.
- Judge rounds: none yet (pending). CI: pending.
- Manual run: `--hands 10000 --seed 42` exits 0 with 0 violations and 7724 capped streets.

## Review
Round 1: no blocking findings. Security reviewer: no findings. Hostile argv (`1e3`, `0x10`, `-5`, 2^53, 1000000001, an ANSI escape, `../../etc/passwd` as the replay code) all exit 2 with fixed text that never echoes the input. The resolve hook only rewrites relative specifiers, and argv never reaches module resolution. Code reviewer: all rubric items pass, and determinism was verified byte-identical.

### Non-blocking review notes (deliberately not fixed)
- MINOR: `largestPot` has no test that checks a computed non-zero value (`src/playtest/runner.ts:133`). Two mutants would survive: `largestPot = pot` (last hand instead of max) and `sum + award.pot` (always 0).
- NIT: `summarize` is exported though it is not in the spec §5 interface. Judged acceptable: it has two real callers (`runPlaytest` and replay mode in `cli.ts`) and avoids duplicating the summary rules.
- NIT: in the "exit code 1 when the run has violations" test, the variable `rejected` names the check-policy used only for the replay case, while the run case uses an inline raise-999 policy.
- NIT: no test would fail if seat policies were rebuilt for every decision instead of once per hand (spec §5 Rule 2).

## How to try it
```
npm run playtest -- --hands 10000 --seed 42            # defaults: size 6
npm run playtest -- --hands 20 --seed 42 --size 6
npm run playtest -- --replay-code 000000000000002a0000000000000004 --size 6 --button 4
npm run playtest -- --help
```
Sample report (`--hands 20 --seed 42 --size 6`):
```
TLH Trainer playtest
Options: --hands 20 --seed 42 --size 6
Table: 6 players, cash $4/$8, every stack reset to $160 before each hand
Hands played: 20
Ended by fold: 16
Ended at showdown: 4
Player actions: 311
Streets capped at 4 bets: 14
Largest pot: $152
First replay code: 000000000000002a0000000000000001
Last replay code: 000000000000002a0000000000000014
Invariant violations: 0
```
Replay mode prints the same header, then the hand (hole cards per seat, board, one line per street, result), then a one-hand report. Exit codes: 0 clean, 1 violations, 2 usage error.

## Run metrics
Questions asked: 3 · assumptions logged: 8 · review rounds: 1 · judge rounds: 0 so far (pending) · gate runs: 1 · escalations: 0 · changed lines: 1148 (11 files).

## Known limitations and follow-ups
- M1 only: stacks reset to $160 every hand, the button rotates plainly, and only two violation kinds are counted.
- `--size 2` is rejected (the engine needs at least 3 seats).
- TASK-1.8: add an `onAction` hook to the runner and print `formatHand` (replay code and action history) when a violation occurs.
- TASK-1.16: use replay-code word 2 (currently 0, reserved) for `--game sng`.
- TASK-1.11 / TASK-1.17: support `--size 2` once heads-up exists in the engine.
- TASK-6.9: pass `earlierShowdowns` to E06 bots through the runner.
- Add `src/playtest` to the headless-boundary lint list (`HEADLESS_DIRS`). No owner task known; suggest TASK-1.8.
- Add a test of a computed non-zero `largestPot` in `tests/playtest/runner.test.ts` to kill the two surviving mutants (owner: this story's follow-up; suggest TASK-1.8).
- Add a test that each seat's policy is created once per hand, e.g. by counting `makePolicy` calls (suggest TASK-1.8).
- Rename the `rejected` variable in `tests/playtest/cli.test.ts` to say it is the replay-case policy (NIT, can ride with any follow-up).

## Lessons for the factory (proposals — not applied)
None. The run had no send-backs, no escalations and a single clean review round.
