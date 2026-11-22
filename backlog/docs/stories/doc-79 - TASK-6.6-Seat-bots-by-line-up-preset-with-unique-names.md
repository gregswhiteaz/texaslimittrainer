---
id: doc-79
title: 'TASK-6.6: Seat bots by line-up preset with unique names'
type: other
created_date: '2026-11-22T05:20:00Z'
updated_date: '2026-11-22T05:20:00Z'
---
# TASK-6.6: Seat bots by line-up preset with unique names

Status: Done (judge pending: see doit/TASK-6.6/judge/) · Completed: 2026-11-21 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-009 (009.1, 009.4, 009.7, 009.8), REQ-062 (062.1, 062.2, 062.4) · Branch: doit/TASK-6.6

## What was asked
A pure line-up module: given a preset (Mixed, Tough, Soft), table size (2-10) and the user's seat, give every bot a style and a table-unique display name. The playtest CLI gets `--lineup mixed|tough|soft` so line-ups can be exercised at scale. Spec: doit/TASK-6.6/spec.md.

## Assumptions made without asking — please review
Auto-accepted autopilot answers (doit/TASK-6.6/qa.md) come first, then spec assumptions.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 (D-2) | Line-up seats play their styles only in hands with exactly 6 dealt-in seats. Other hands (e.g. 9 seats, sng) use the existing random-move fallback with a `Line-up note:` header line. AC#6 at 9 players therefore checks seat assignment, 0 violations and exit 0, not style play. | yes | The advice has only a 6-max chart. | Remove the fallback when TASK-7.6 lands (AC already added to TASK-7.6). |
| Q-2 (D-5, A-1) | Names Ava, Ben, Cal, Dee, Eli, Fay, Gus, Hal, Ivy. Bot k clockwise from the user gets `BOT_NAMES[k-1]`. No randomness. | yes | Only uniqueness is required; fixed order keeps `seatLineUp` pure and output byte-identical. | Seeded shuffle of a longer list. |
| Q-3 (D-1) | Playtest without `--lineup` is unchanged. Baseline SHA `aacd5e94dccba90b4b50936ba1bb2b08aff2bda37d427efdfb56a6b07e488e01` (10,000 hands, seed 42, size 6) stays identical. | yes | Earlier baselines and the REQ-062 fit run stay valid. | Make Mixed the default (about 80 s per 10k hands). |
| A-1 | See Q-2. | yes | | |
| A-2 | In a `--lineup` run seat 1 (the user) plays a seeded TAG policy at 6 dealt-in seats. | yes | TAG never bets postflop, so no extra equity cost. | `randomMovePolicy`. |
| A-3 | CLI names are exactly `mixed`, `tough`, `soft` (case-sensitive). Module uses `Mixed`, `Tough`, `Soft`. | yes | Matches `--game`. | Case-insensitive. |
| A-4 | Header format (spec R-5): Options line gains ` --lineup <name>`, a `Line-up:` line, and a `Line-up note:` line when size is not 6 or game is sng. | yes | Developer-facing text. | Per-seat block. |
| A-5 | `--lineup` also works with `--replay-code`; the `Replay:` line includes it. | yes | Otherwise the replay diverges. | Reject the combination. |
| A-6 | `seatLineUp` throws `RangeError` on a bad size, seat or preset. | yes | Matches engine and runner. | Result union. |

D-3 (no equity cache) is not reversible but is evidence-based: 577 equity calls over 500 one-Maniac hands, 577 unique inputs, 0 cache hits.

## What was built
Preset rules (as implemented and tested):
- Mixed cycles TAG, Calling station, Maniac, Rock over the bot seats clockwise from the user.
- Tough is all TAG except one Maniac in the first bot seat clockwise from the user. Heads-up Tough is one TAG.
- Soft alternates Calling station and Rock. Heads-up Soft is one Calling station; heads-up Mixed is one TAG.
- Worked example: Tough, 6 players, user at seat 4. The first bot clockwise (seat 5) is Maniac "Ava"; the others are TAG named Ben, Cal, Dee, Eli. With the user at seat 1 and 9 players (AC#6) the Maniac is at seat 2.

Files:
- `src/bots/lineup.ts` (new) — `LINE_UP_PRESETS`, `BOT_NAMES`, `seatLineUp(preset, size, userSeat)`. Type-only imports.
- `src/bots/decide.ts` (new) — `decideStyle(view, style, random)`, the style dispatch moved out of the worker.
- `src/table/advice-service.ts` — uses `decideStyle`; behaviour unchanged.
- `src/playtest/policy.ts` — `lineUpPolicyFactory(preset, size)`.
- `src/playtest/runner.ts` — `PlaytestOptions.lineUp`.
- `src/playtest/cli.ts` — `--lineup` parsing/error, USAGE, header lines, replay suffix, replay-mode policies.
- `package.json` — `test:slow` includes the playtest line-up acceptance file.
- Tests: `tests/bots/lineup.acceptance.test.ts`, `tests/bots/lineup.test.ts`, `tests/playtest/lineup.acceptance.test.ts` (new); `cli.test.ts`, `policy.test.ts`, `advice-service.test.ts` extended.

Timings (§9, opt-in, `TLH_SLOW_TESTS=1`): 10,000 hands at 6-max took 57.0 s (Tough) and 71.6 s (Mixed). The cost is equity runs when TAG and Calling-station seats face postflop bets. Memoising equity had 0% cache hits, so it was not added.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..05 | AC#1-5 | `tests/bots/lineup.acceptance.test.ts` | pass | gates/fix-3.json |
| SPEC-06, 07, 08, 13 | errors, decideStyle parity, policy, CLI | unit tests | pass | gates/fix-3.json |
| SPEC-09, 10, 11 | AC#6, AC#7, 200-hand runs per preset | `tests/playtest/lineup.acceptance.test.ts` | pass | gates/fix-3.json |
| SPEC-12 | AC#8 | slow, opt-in | pass | 57.0 s / 71.6 s (build-log.md) |
| SPEC-14 | default unchanged | playtest SHA | pass | identical to aacd5e94…e01 |
| SPEC-15 | lint, typecheck, test, CI | `npm run lint && npm run typecheck && npm test` | pass | 167 files passed, 1 skipped; 587 tests passed, 9 skipped; coverage 97.14% statements; branch CI #172 green |

Judge: see doit/TASK-6.6/judge/.

## Review
- Round 1: code reviewer MAJOR — replay-mode line-up policies were untested (SPEC-13 test strength). Fixed in r1: 6-max Mixed hands replayed with `--lineup mixed` must print the run's hand, and at least one must differ without it. Mutant check (`true ||` at cli.ts:325) fails the test. Security: no findings.
- Round 2: 0 blocking findings. Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the policy-seam rule is duplicated in `cli.ts` and `runner.ts`. No behaviour effect.
- NIT: `String` casts.

## How to try it
- `npm run -s playtest -- --hands 200 --seed 42 --size 6 --lineup mixed`
- `npm run -s playtest -- --hands 10000 --seed 42 --size 9 --lineup tough` (seat assignment only; random fallback)
- Slow check: `TLH_SLOW_TESTS=1 npx vitest run tests/playtest/lineup.acceptance.test.ts -t AC#8`

## Run metrics
Questions 3 (auto-accepted) · assumptions logged 6 (A-1..A-6) · review rounds 2 · judge rounds: see judge/ · gate runs 3 · escalations 0 · changed lines about 656 across 13 files (budget 12 files / 700 lines; `tests/table/advice-service.test.ts` was needed by SPEC-07 but missing from the spec's file list).

## Known limitations and follow-ups
- [trainer] Remove `lineUpPolicyFactory`'s random fallback so line-ups play styles at all sizes. Owner: TASK-7.6 (AC already added).
- [trainer] The app's `DEFAULT_SEATS` (`src/table/session.ts:60`: Ava, Ben, Cal, Dee, You, Eli) differs from the clockwise naming until the module is wired in. Owner: TASK-2.5 (Game Config uses the E06-S06 line-up module, AC#5 unique names, AC#6 table bots match the listed names and styles). Covered; no new task needed.
- Not tracked (infra, below the value bar): slow AC#8 runtime (about 1 to 1.2 minutes) is opt-in and caused no failure; the CI speed plan already tracks it.

## Lessons for the factory (proposals — not applied)
- The spec's file budget omitted `tests/table/advice-service.test.ts` although SPEC-07 required it; spec scope lists should be derived from the SPEC items' verification paths.
- The round-1 MAJOR (replay path untested) came from an assumption (A-5) with no matching SPEC item; each spec assumption that adds behaviour should map to a test.
