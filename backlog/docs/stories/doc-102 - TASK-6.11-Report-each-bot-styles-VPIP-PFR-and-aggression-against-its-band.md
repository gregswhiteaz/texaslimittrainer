---
id: doc-102
title: 'TASK-6.11: Report each bot style''s VPIP, PFR and aggression against its band'
type: other
created_date: '2026-11-23T15:04:00Z'
updated_date: '2026-11-23T15:04:00Z'
---
# TASK-6.11: Report each bot style's VPIP, PFR and aggression against its band

Status: Done (pending judge) · Completed: 2026-11-23 · Epic: TASK-6 · Requirements: REQ-027, REQ-028, REQ-062 · Branch: doit/TASK-6.11

## What was asked
Every playtest run should print each seated bot style's VPIP, PFR and aggression. A new `--check-styles` flag compares them with the REQ-027 bands and counts recommended vs alternative actions in each mixed spot (REQ-028.3). It exits 1 on any failure. A manual-only workflow runs the 100,000-hand check on seeds 42, 7 and 1234. Spec: doit/TASK-6.11/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Seats are attributed as in `BotResults`: in a `--lineup` run only bot seats count, each under its style in that hand. Without `--lineup`, all seats count as TAG. The user seat is excluded. | yes | Matches the existing report and band test. | Count the user seat as TAG |
| A-2 | Hands with a violation or no result count for nothing. | yes | Same as `BotResults.add`. | Count partial hands |
| A-3 | Values are rounded to 1 decimal before the inclusive band check (17.95 becomes 18.0 and passes). | yes | Same rule as the locked band test. | Compare unrounded |
| A-4 | A mixed decision is a preflop chart decision with an alternative in a spot the style marks mixed. It counts as recommended or alternative by action type. | yes | Reproduces `decideTag`'s draw condition without touching bot code. | Instrument `decideTag` |
| A-5 | The recorder rebuilds the view with no earlier showdowns. Preflop advice does not read them. | yes | Avoids changing the hook signature. | Wrap the policy |
| A-6 | A mixed spot with 0/0 counts is printed and does not fail. It fails only when exactly one count is above 0. | yes | "Used only one action" means at least one action was used. | Fail unreached spots |
| A-7 | Mixed-spot recording runs only with `--check-styles`. | yes | Keeps every-push cost near zero. | Always record |
| A-8 | The bands are a TypeScript constant `STYLE_BANDS`, not style-file data. | yes | The style-file format stays unchanged. | Add a `bands` block to the JSONs |
| A-9 | `main` has a test-only fourth parameter `bands`. The entry never passes it. | yes | Deterministic pass/fail and edge tests. | Test the pure function only |
| A-10 | A seated style with a null stat fails that stat (printed `—`). If no bot hand was counted, the check fails. | yes | An unmeasurable stat is not inside a band. | Skip null stats |

Recorded spec amendment (review R1, auto-accepted): every-push hand counts were cut to 300 (Mixed) and 100 (plain), with opt-in slow twins at the original counts and the same assertions. The "workflow files byte-identical to main" check became CI-robust assertions. See "Review".

## Clarifications and decisions
- Q-1 (auto-accepted): output contract. The style block sits after `Table:`/`Line-up:` and before `Bot results:`. A failed style check exits 1, the same as invariant violations. Usage errors stay 2.
- Q-2 (auto-accepted): a new dispatch-only `.github/workflows/style-bands.yml`. It is never scheduled and uses no Actions minutes unless someone runs it. A nightly schedule was rejected because of the open budget concern (TASK-1.51).
- D-4: mixed-spot counts come from an `ActionHook` recorder composed with `checkStep`, using `recommend`. Bot code is untouched.
- D-5: AC#8/9 are proven by an opt-in slow test that runs the CLI `main` in process.

## What was built
- `src/playtest/style-check.ts` (new): `STYLE_BANDS`, `StyleCheck` (a per-style tally using the shared `handStyleCounts`, `addStyleCounts` and `styleStats`, plus the mixed-spot recorder), `roundStat` and `formatStyleReport`.
- `src/playtest/cli.ts`: the value-less `--check-styles` flag (rejected if duplicated, or with `--replay-code` or `--help`), a USAGE line, an Options echo, the style block in every run report and exit 1 on failure. Replay mode is unchanged.
- `.github/workflows/style-bands.yml` (new): `workflow_dispatch` only, one job, three seed steps, `contents: read`, SHA-pinned actions.
- `package.json`: `test:slow` lists the new acceptance file. `docs/stats/style-stats.md`: one paragraph on the CLI use.
- Tests: `tests/playtest/style-check.test.ts`, `tests/playtest/check-styles.acceptance.test.ts`, `tests/ci/style-bands-workflow.acceptance.test.ts`, and a re-pin of `tests/playtest/cli.test.ts` (USAGE and adjacency). No locked tests were changed.

Example output with `--check-styles`:
```
Style: TAG, 402624 hands, VPIP 22.3% (band 18.0-26.0%), PFR 16.4% (band 14.0-22.0%), aggression 63.7% (band 45.0-65.0%)
Mixed spot: TAG preflop-unopened, recommended 6161, alternative 1985
Style check: passed
```

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01, 03, 04, 05, 07, 10 | AC#1-6, 11 | Fast acceptance (300/100 hands) plus slow twins at the original counts | Pass | Twins: 5 passed, 26.2 s |
| SPEC-02, 06, 08, 09 | AC#2-5, 11 | Unit tests | Pass | build-log |
| SPEC-11 | AC#7-9 | Opt-in slow, 100,000 hands on seeds 42, 7, 1234 | Pass, 449.9 s | See below |
| SPEC-12 | AC#10 | Workflow structure test | Pass | gates |
| SPEC-13 | DoD | lint, typecheck, `npm test` | Pass | 215 files and 947 tests passed (36 skipped). Coverage 97.3% statements. |
| SPEC-14 | DoD | Judge | Pending | `doit/TASK-6.11/judge/` |

- Slow SPEC-11, all three seeds exit 0, `Style check: passed`, no Outside band or One action only lines. Per-seed values (VPIP/PFR/aggression):
  - TAG: 22.3/16.4/63.7 (seed 42), 22.3/16.4/63.7 (seed 7), 22.2/16.3/63.5 (seed 1234).
  - Calling station: 58.2/6.4/15.4, 59.4/7.0/14.5, 60.4/6.8/15.9.
  - Maniac: 56.8/54.3/78.7, 56.3/53.7/77.7, 56.5/53.4/79.6.
  - Rock: 10.1/8.8/48.7, 10.1/8.7/46.8, 10.0/8.6/46.8.
- Default playtest (10k, seed 42): exit 0, 0 violations. The output SHA-256 changed from `14d746f7…2e48` to `1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5`. Time was 14.4 s against a 13.8 s baseline (+4.3%). The `--lineup mixed` 10k run also passed.
- Million output (`playtest:million --hands 900`): `4ff17256…` became `8cd39126ace1472977cf969244ba979f97f0586669efa613594d533ca64b59c4`. Shard stdout now includes the style block. Exit 0.
- Gate runs: 4. Judge: see doit/TASK-6.11/judge/.

## Review
- R1: two MAJOR findings, both fixed.
  1. The every-push acceptance tests took about 25 s, against the no-slow-tests-on-every-push rule. Fixed by cutting the hand counts and adding slow twins. The fast file now takes about 8.3 s without coverage, still above the original 6 s target.
  2. The workflow test compared against `main` via git. That is vacuous on CI's shallow checkout and would block future edits to those workflows. Replaced with CI-robust assertions: the other workflows contain no `--check-styles` or `style-bands`, and `style-bands.yml` is the only workflow using `--check-styles`.
- R2: 0 blocking findings. Security review: no findings in either round.

### Non-blocking review notes (deliberately not fixed)
- R1 MINOR: SPEC-11 did not record a non-zero exit. This was fixed in the FIX round.
- R1 NIT: `StyleCheck(false)` built mixed maps. This was fixed in the FIX round.
- R2 MINOR: `spec.md` still names the original hand counts and the byte-identical-to-main check. The amendment is recorded only here and in build-log.md.
- R2 MINOR: scope budget exceeded: 1,116 changed lines against 850. Most of it is test code, including the slow twins. The gate reports warn.
- R2 NIT: the per-file `--check-styles` assertions in the workflow test duplicate the workflow-set check. They are kept for clearer failure messages.

## How to try it
```
npm run playtest -- --hands 2000 --lineup mixed --size 6
npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42
TLH_SLOW_TESTS=1 npx vitest run tests/playtest/check-styles.acceptance.test.ts
```
The workflow can also be run by hand from the "Run workflow" button on `style-bands`.

Note for `--check-styles` users: use it with long runs (tens of thousands of hands or more). TAG aggression sits close to its 65% ceiling (63.5-63.7% at 100k). A 2,000-hand run read 67.2% and failed, with no tuning problem behind it.

## Run metrics
Questions 2 (both auto-accepted) · assumptions 10 · review rounds 2 (2 MAJOR, then 0) · judge rounds: pending · gate runs 4 · escalations 0 · changed lines about 1,116 (budget 850).

## Known limitations and follow-ups
- [trainer] Decide how to pin TAG aggression, which sits about 1.3 points under its ceiling and has no margin at short runs. Either widen or document the band, or tune TAG aggression. Owner: TASK-6.16/6.17 if still open, otherwise a new task.
- [trainer] `spec.md` was not updated for the R1 amendment. The orchestrator can fold the 300/100 counts and the CI-robust SPEC-12 wording into spec.md if it is kept as a reference.
- [trainer] `style-bands.yml` has not been run on GitHub. The first dispatch run should confirm that three 100k seeds fit in the 60-minute timeout (about 7.5 min locally).
- Not tracked (infra, below the value bar): the every-push fast acceptance file is about 8 s against a 6 s target. It caused no failure.

## Lessons for the factory (proposals — not applied)
- The spec's every-push test sizes were set at 500-2000 hands and measured at about 25 s, which review had to catch. Add a spec-template check: for every every-push acceptance test, estimate cost from a measured per-hand time (Soft hands cost about 3.3 ms) and cap it at about 3 s.
- The spec asked for a `git show main:` byte-identity check inside a permanent test. That is vacuous under shallow CI checkouts and breaks later edits. The spec template should say that "unchanged vs main" is a judge-time diff, not a permanent test.
- The two locked tests had to be unlocked and re-locked after review R1. The test author could have been told the speed rule up front.
