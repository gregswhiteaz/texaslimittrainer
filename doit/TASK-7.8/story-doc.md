# TASK-7.8: Recommend betting or raising for value

Status: Done (pending judge) · Completed: 2026-11-22 · Epic: TASK-7 — Get trustworthy advice · Requirements: REQ-033 (033.1, .2, .4, .5, .6), REQ-038.4/038.6, REQ-056.1 · Branch: doit/TASK-7.8

## What was asked
Postflop advice only checked, called or folded. It now recommends a bet (nothing owed) or a raise (facing a bet, street not capped) when the hero's rounded equity against the range that would call is above 50.0%. The "range that would call" is each opponent's range with Air removed (Strong, Pair, Draw kept). Every postflop recommendation gains `equityVsCallingRangePct`, so grading uses `aggression-margin` for real bet/raise deviations. Bots go through the same engine, so they bet and raise for value too. Spec: doit/TASK-7.8/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | To reverse |
|---|---|---|---|
| A-1 | Several opponents: one equity run with every live opponent's calling range; hero's pot share compared with 50%. | yes | Per-opponent heads-up equity, all must exceed 50% |
| A-2 | An opponent with no Strong/Pair/Draw combo keeps its whole range as its calling range. | yes | Drop that opponent from the run |
| A-3 | `equityVsCallingRangePct` is computed on every postflop decision, even capped streets. | yes | Make it `number \| null` |
| A-4 | Nothing owed but only `raise` is legal (short all-in): `value-bet` recommends that raise. | yes | Separate rule id |
| A-5 | Calling-range run uses the same fallback chain as the whole-range run (estimated, start, unseen). | yes | Separate chains |
| A-6 | `calling-station.test.ts` 10,000-hand unit run cut to 1,000 hands. | yes | Move to `test:slow` |
| A-7 | If the calling-range run still throws `RangeError`, `equityVsCallingRangePct` = `equityPct`. | yes | Drop opponents one by one |
| A-8 | 10k playtest target <= 15 s; BOT trials could drop (not below 200). Held at 500: 14.2 s. | yes | Lower trials |

## Clarifications and decisions
All questions were auto-accepted under the user's unattended-approval rule (qa.md).
- **Q-1** Bot equity budget: bots keep every-unseen-combo ranges (TASK-7.25 switches them to action ranges) and pass `BOT_EQUITY` = `equityWithBudget` with exact limit 2,500 and 500 trials. Default `computeEquity` for bots measured about 275 s per 10k hands.
- **Q-2** Rule ids `value-bet` / `value-raise`; the locked TASK-7.3 fake undocumented id re-pinned to `bluff`.
- **Q-3** 11 locked tests re-pinned (values only, no assertion dropped, no limit relaxed): TASK-7.3, 7.22, 6.1, 6.2, 6.3, 6.4, 7.4, 7.5, 9.1 (two files), 3.4.
- **D-7** (from the block, auto-accepted) Seven heavy locked playtest files: the 10,000-hand run is opt-in under `TLH_SLOW_TESTS=1`; a 1,000-hand version with the same assertions and limits runs every push; files added to `test:slow`. Reason: coverage costs about 4.6x, so four 10k runs exceeded 120 s in `npm test` (three more were at 76-107 s).
- D-1 rule order: `value-bet`, `check-free`, `value-raise`, `pot-odds-call`, `pot-odds-fold`; compares rounded tenths (`> 500`). D-4: `requiredEquityPct` keeps its pot-odds meaning; `VALUE_THRESHOLD_PCT = 50`. D-5: per-board class memo in `callingRange`.
- Accepted deviation: games AC#6 in-process sit-and-go every-push test still plays 10,000 hands (title says 1,000).

## What was built
- `src/advice/ranges.ts`: `CONTINUE_CLASSES`, `callingRange(range, board)` with memo; `hasOpenEnder` on bit masks.
- `src/advice/postflop.ts`: rules `value-bet`, `value-raise`; advice type gains `bet`/`raise`; `equityVsCallingRangePct` on every recommendation; second equity run via the fallback chain.
- `src/advice/equity.ts`: `EquityBudget`, `equityWithBudget`; `computeEquity` delegates with unchanged constants. Output-identical speed-ups (hashing seed, typed-array dedupe, sampler).
- `src/bots/{tag,rock,maniac,calling-station}.ts`: `FREE_CHECK_EQUITY` removed; every call passes `options.equity ?? BOT_EQUITY`.
- `src/advice/grade.ts`: comment only. `package.json`: `test:slow` includes the new files.
- `docs/advice/postflop-rules.md`: both value rules, worked example (Ks 8d 7c) and raise example, "range that would call", threshold, A-7 fallback, updated "Not applied yet".
- Tests: new locked `tests/advice/value-bet.acceptance.test.ts` (AC#1-11); unit tests for the rules, `callingRange`, `equityWithBudget`; unlocked and locked re-pins listed in changes.md.

## How it was verified
| SPEC | Verification | Result |
|---|---|---|
| SPEC-01..11 | `value-bet.acceptance.test.ts` AC#1-AC#11 (56 asserts) | pass |
| SPEC-12 | default 10k playtest, seed 42 | pass |
| SPEC-13/14 | unit `postflop.test.ts`, `ranges.test.ts` | pass |
| SPEC-15 | `npm run lint && typecheck && npm test` (gate fix-2) | pass |
| SPEC-16 | CI + doc | see CI below |

- New baselines: default 10k playtest SHA `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98` (14.2 s; reviewer saw 14.3 s, 0 violations). `playtest:million -- --hands 900` hash `4ff1725659ddc73674e845b3d72c20f70a31c767a196f25267ae795dcc1e2d32` (old `fee5dbb1…` retired).
- Branch CI #210: `test:sweeps` shard 2 476 s, shard 1 156 s, wall 478 s (imbalanced). Nightly million runs project to about 4.3 min per shard.
- Gates: build-1 and fix-2 both PASS (lint, typecheck, test; warnings: 2,436 changed lines vs budget 1,700, 42 files vs 36, `package.json` outside spec).
- Judge: see doit/TASK-7.8/judge/.

## Review
Round 1: 0 blocking (code: 3 MINOR, 2 NIT; security: none). MINOR 1 (calling-station point 0 lost its preflop-raise threshold case) and MINOR 2 (games AC#6 title / duplicate 10k run) were fixed in commit 5f1ae42 (new preflop raise threshold point; AC#6 title).

### Non-blocking review notes (deliberately not fixed)
- MINOR: 9-opponent user-advice latency roughly doubles (about 205 ms p95 vs 100 ms target, inside the 20x slack) because the calling-range run usually exhausts the rejection budget before the A-7 fallback. Tracked as an AC on TASK-7.18.
- NIT: `advice` in `rock.ts` holds options, elsewhere the recommendation.
- NIT: `CONTINUE_CLASSES` is a literal, not derived from `KEEP`; a unit test guards drift.

## How to try it
`npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`; `npm run playtest:million -- --hands 900`; `TLH_SLOW_TESTS=1 npm run test:slow` for the 10k runs; `npm test`.

## Run metrics
Questions 3 · assumptions 8 · review rounds 1 · judge rounds 0 at doc time · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 2,436 (42 files; budget 1,700 / 36).

## Known limitations and follow-ups
- [trainer] 9-opponent advice latency: speed the calling-range run or cut its rejection budget — owner TASK-7.18 (AC added).
- [infra] `test:sweeps` shard imbalance (476 s vs 156 s) — owner TASK-1.53; it is slow wall time rather than a failure.
- Bots still use every-unseen-combo ranges — TASK-7.25.
- Not tracked: the two NITs.

## Lessons for the factory (proposals — not applied)
- Gate runs `npm test` with coverage, which costs about 4.6x on the 10k playtest files; the first build blocked on four timeouts. Proposal: when a spec changes bot cost, have the spec list affected heavy locked files up front (D-7 pre-approved) and measure under coverage during planning.
- Scope budget was exceeded (2,436 vs 1,700) because of cross-story re-pins; the spec could estimate re-pin volume.
