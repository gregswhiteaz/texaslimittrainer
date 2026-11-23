---
id: doc-95
title: 'TASK-6.17: Keep Calling station and Maniac bots inside their style bands'
type: other
created_date: '2026-11-23T07:09:00Z'
updated_date: '2026-11-23T07:09:00Z'
---
# TASK-6.17: Keep Calling station and Maniac bots inside their style bands

Status: Done · Completed: 2026-11-23 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-027 (027.1–027.6), REQ-056.1, REQ-061.2 · Branch: doit/TASK-6.17

## What was asked
At 100,000 Mixed 6-max hands the Calling station's postflop aggression was 51–53% (band 10–25%) and the Maniac's was 84.1–84.9% (ceiling 85%). Bring both inside their REQ-027 bands on seeds 42, 7 and 1234, with TAG and the Rock still inside theirs. The advice engine and the user's advice stay unchanged. Spec: doit/TASK-6.17/spec.md.

## Assumptions made without asking — please review
Q-1 to Q-4 were auto-accepted (recommended option) under the unattended-approvals rule. That includes the Q-3 locked-test re-pins.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| Q-1 | Verify the bands now with the opt-in slow `style-bands` test. The CLI re-check for all four styles goes to TASK-6.11. | yes | `--check-styles` doesn't exist yet. | Wait for TASK-6.11. |
| Q-2 | DoD#1 (100k check-styles run in nightly/on-demand CI) is deferred to a TASK-6.11 follow-up AC. | yes | Same. | Build the CI job here. |
| Q-3 | Tune the Calling station to `postflopValue.thresholdPct: 88` and the Maniac's two postflop deviations to 0.6. Re-pin four locked tests: style-bands and rock-postflop (TASK-6.16), maniac.acceptance (TASK-6.4), replacement.acceptance (TASK-6.8). Assertion counts are kept. | yes | Any change to these styles moves pinned play. | Revert the commit and pick other values. |
| Q-4 | Keep the Mixed line-up for the band test. | yes | It is what REQ-027 specifies. Margins are about 6 SE or more. | Add a style-heavy line-up. |
| A-1 | Style stats are counted as in TASK-6.16 (bot seats by their style at each hand, seat 1 excluded). | yes | Same method as the existing test. | Use TASK-7.12's shared functions later. |
| A-2 | The Calling station description is unchanged. | yes | It still says "hardly ever bets on its own". | Add a clause. |
| A-3 | The Maniac `postflop/check/bet` justification is rewritten ("more often than not"). The other two texts stay. | yes | "Almost every time" is false at 0.6 (REQ-061.2). | Rewrite all three. |
| A-4 | The Calling station's bar applies with or without a `random` generator. | yes | The bar is style data, not a draw. | Apply it only with a generator. |
| A-5 | The shared helper lives in `style.ts`, and the Rock is refactored onto it. | yes | One rule in one place. | Duplicate it in `calling-station.ts`. |
| A-6 | The `rock-postflop` test title ("…and the other styles none") is kept, with a comment. | yes | Earlier docs cite it. | Rename the title. |

## Clarifications and decisions
- D-1: the Calling station uses a deterministic `postflopValue` bar, not new deviation draws. This keeps its random stream unchanged.
- D-2: both Maniac postflop probabilities go from 0.85 to 0.6. At 0.65 the Maniac would be 79.7–81.5%. At 0.75 it would be under 3 points from the ceiling.
- D-3: threshold 88 rather than 90 (11.9–14.0%, near the floor) or 85 (measured only at 20k).
- D-4 / D-5 / D-6: keep the Mixed line-up, extend the existing slow band test rather than adding one, and re-pin the locked files.
- D-7: the bar is applied before any draw, so a demoted move consumes none.

## What was built
- `src/bots/style.ts`: new `postflopValueMove(style, view, rec)`. It returns a check (or call if a bet is owed) when an advised postflop bet or raise has rounded equity at or below the threshold. It returns undefined otherwise.
- `src/bots/calling-station.ts`: applies the bar after `recommend` and before any draw. Doc comment updated.
- `src/bots/rock.ts`: uses the shared helper. Behaviour is identical.
- `src/bots/styles/calling-station.json`: `postflopValue` of 88 plus a justification.
- `src/bots/styles/maniac.json`: `postflop/check/bet` and `postflop/call/raise` set to 0.6, and the check/bet justification rewritten.
- Tests: new `tests/bots/calling-station-postflop.acceptance.test.ts` (every push). Re-pinned `style-bands` (Calling station and Maniac bands added, "every bot style" titles), `rock-postflop`, `maniac.acceptance` (0.6; Example C now calls 8) and `replacement.acceptance` (first replaced hand is the first whose seat styles differ). Unlocked pin in `tests/playtest/cli.test.ts` (seed-42 first replacement at hand 18).
- No new dependencies and no UI changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01/02 | All four styles in band, seeds 42, 7, 1234 | `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` (3 x 100k hands) | Pass | build-log table below |
| SPEC-03 | CLI check and CI job | Deferred to TASK-6.11 | Follow-up ACs recorded | task TASK-6.11 |
| SPEC-04/05/06 | 88 bar boundary, style data, validation | New acceptance file, 3 tests | Pass | build-log |
| SPEC-07 | Rock unchanged | Locked rock-postflop and rock tests | Pass | gates |
| SPEC-08 | Replacement and CLI pins | replacement.acceptance, cli.test | Pass | gates |
| SPEC-09 | Lint, typecheck, suite, coverage | `npm run lint && npm run typecheck && npm test` | 201 files passed (3 skipped), 737 tests passed (30 skipped), coverage held | gates build-1, fix-2, fix-3, fix-4: all PASS |
| SPEC-10 | Mixed 10k, default output | Playtest runs | 0 violations (44 bots replaced). Default SHA `2cbbafa7…bb98` unchanged. | build-log |
| SPEC-11 | No UI | Judge | See doit/TASK-6.17/judge/ | |

Measured at 100,000 hands, VPIP / PFR / aggression:

| seed | TAG | Rock | Calling station | Maniac |
|---|---|---|---|---|
| 42 | 22.2 / 16.4 / 63.8 | 10.2 / 8.8 / 47.8 | 59.6 / 6.7 / 15.3 | 56.1 / 53.3 / 79.3 |
| 7 | 22.3 / 16.4 / 63.8 | 10.1 / 8.7 / 47.0 | 58.7 / 6.5 / 14.8 | 56.4 / 53.6 / 77.4 |
| 1234 | 22.2 / 16.2 / 63.4 | 10.0 / 8.5 / 45.4 | 59.9 / 6.7 / 15.8 | 57.3 / 54.3 / 78.9 |

Bands: TAG 18–26 / 14–22 / 45–65. Rock 8–15 / 6–12 / 35–55. Calling station 45–65 / 3–10 / 10–25. Maniac 50–75 / 35–60 / 65–85. TAG's aggression margin is thin (63.4–63.8 against 65). That is not caused by this story, and it is already noted on TASK-6.11.

Judge: see doit/TASK-6.17/judge/ (the judge runs after this doc was written).

## Review
Round 1: 0 blocking findings. Security: no findings. The 2 MINORs were fixed in the story, with no assertion removed or loosened: the stale "0.85" comment in Example A, and new Example H, a postflop call raised to 16 at a draw below 0.6.

### Non-blocking review notes (deliberately not fixed)
- NIT: `postflopValueMove` recomputes "owed" (hero lookup with a never-taken fallback that shows as an uncovered branch at `style.ts:452`). The caller already computes it. The spec's signature requires this, and it copies the Rock's original pattern. It could later be derived from `rec.action`.

## How to try it
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` (about 2.5 min per seed)
- `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42`
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256`

## Run metrics
Questions 4 (all auto-accepted) · assumptions 6 · review rounds 1 · judge rounds: see judge/ · gate runs 4 (all PASS) · escalations 0 · changed lines 345.

## Known limitations and follow-ups
- Already recorded as ACs on TASK-6.11: [infra] the `--check-styles` CLI re-check for all four styles on seeds 42, 7 and 1234; a nightly/on-demand run of it (deferred DoD#1). Tracked.
- [trainer] TAG's aggression margin is thin (63.4–63.8 against 65). Already noted on TASK-6.11, so the CLI check should watch it.
- Pre-existing: the integrity WARN on `calling-station.test.ts` came from TASK-7.8, not this story.

## Lessons for the factory (proposals — not applied)
- Nothing went wrong or slow in this run. The only friction was the four locked re-pins that tuning style data necessarily causes, and the spec predicted and listed them up front.
