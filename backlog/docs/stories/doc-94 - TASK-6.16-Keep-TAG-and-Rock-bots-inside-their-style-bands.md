---
id: doc-94
title: 'TASK-6.16: Keep TAG and Rock bots inside their style bands'
type: other
created_date: '2026-11-23T05:57:00Z'
updated_date: '2026-11-23T05:57:00Z'
---
# TASK-6.16: Keep TAG and Rock bots inside their style bands

Status: Done · Completed: 2026-11-22 · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-027 (027.1, 027.4, 027.5, 027.6), REQ-056.1, REQ-061.2 · Branch: doit/TASK-6.16

## What was asked
After TASK-7.8 bots bet and raise for value after the flop. Make TAG and the Rock sit inside their REQ-027 style bands (VPIP, PFR, postflop aggression) over 100,000 Mixed 6-max hands on three seeds, preferably by editing style data, retuning the 6-max chart only if needed. Spec: doit/TASK-6.16/spec.md.

Finding: TAG was already inside all bands. Only the Rock was out: postflop aggression 70.0-70.9% against a 35-55% band.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Style stats count bot seats by their style at each hand (`hand.lineUp`); seat 1 (user stand-in playing TAG) is excluded; a hand counts only if the seat was dealt in. | yes | REQ-027 measures bot styles. Including seat 1 moves TAG by 0.3 points or less. | Include seat 1, or adopt TASK-6.11's definition. |
| A-2 | The Rock description gains ", except that after the flop it bets or raises only with very strong hands and checks or calls with the rest". | yes | Keeps the description true (REQ-061.2). | Revert the description text. |
| A-3 | `postflopValue.thresholdPct` must be a finite number in [50, 100]. Below 50 the knob could never matter, since advice already needs more than 50. | yes | Catches authoring mistakes. | Allow 0-100. |
| A-4 | The 100k-hand test counts VPIP/PFR/aggression with a small counter in the test file (REQ-045 formulas), not TASK-7.12's shared functions. | yes | Keeps this task independent of the enabler. | Import TASK-7.12's functions once they exist. |

## Clarifications and decisions
All three questions were auto-accepted under the user's unattended rule (see qa.md).
- Q-1: `--check-styles` doesn't exist yet (TASK-6.11). Build now and verify bands with the opt-in slow test. The CLI re-check is an added AC on TASK-6.11.
- Q-2 (D-1): Rock-only deterministic `postflopValue.thresholdPct: 75` in `rock.json`. The Rock bets or raises only when the advice does and its equity against the calling range is above 75.0%, else checks (nothing owed) or calls (bet owed). Rejected: random passive deviations (needs new deviation pairs and a generator), a Rock-only threshold inside the advice engine (breaks REQ-035.3), a smaller starting range (hits VPIP/PFR, barely moves aggression).
- Q-3 (D-2): no 6-max chart or TAG retune, so no chart counts, golden spots or default-playtest SHA change. TAG aggression sits near its ceiling (about 63 against 65).
- D-3: threshold 75 rather than 72 or 70, for about 8 points of margin under the ceiling (aggression about 47 against 55).
- D-4: comparison mirrors the advice's rounding: `Math.round(eq*10) > Math.round(threshold*10)`.

## What was built
- `src/bots/styles/rock.json`: new `postflopValue` block (`thresholdPct: 75` plus justification) and the description clause.
- `src/bots/style.ts`: `PostflopValue` type, `BotStyleData.postflopValue` (`null` when absent), and `parseStyle` validation (object; threshold finite in [50, 100]; justification at least 10 words; all problems reported together).
- `src/bots/rock.ts`: after `recommend`, an advised bet/raise stands only above the threshold; otherwise check or call. Preflop path unchanged; the Rock stays deterministic. The user's advice doesn't change.
- `tests/bots/rock-postflop.acceptance.test.ts` (new, every push), `tests/bots/style-bands.acceptance.test.ts` (new, opt-in slow, `TLH_SLOW_TESTS=1`, in `test:slow`), `tests/bots/rock.test.ts` (unit assertions follow the 75% bar).
- `package.json`: slow test added to `test:slow`. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01/02 | AC#1-5 | Slow `style-bands.acceptance.test.ts`, 3 x 100k hands, seeds 42/7/1234 | Pass | TAG VPIP/PFR/AGG 22.2-22.3 / 16.2-16.3 / 63.0-63.3; Rock 9.9-10.1 / 8.4-8.8 / 46.9-47.2. All inside bands |
| SPEC-03 | AC#1-3 | CLI re-check deferred to TASK-6.11 AC (Q-1) | Deferred | AC on TASK-6.11 |
| SPEC-04/05/06 | rule, style file, validation | `rock-postflop.acceptance.test.ts` (boundaries 75.0/75.1, locked 8s8c spot still bets, invalid blocks) | Pass | gates/fix-3.json |
| SPEC-07 | unit | `rock.test.ts` | Pass | gates/fix-3.json |
| SPEC-08/09 | lint, typecheck, tests, coverage, 10k playtest | `npm run lint && npm run typecheck && npm test`; playtest seed 42 | Pass | gates/build-1, fix-2, fix-3 all PASS |
| Default playtest SHA | unchanged | gate | Pass | unchanged (no chart change) |
- Judge: see doit/TASK-6.16/judge/.

## Review
- Round 1: one MAJOR, fixed. The pre-existing 1,000-hand "seated Rocks" unit test risked the 10 s CI unit limit under coverage (6.9 s locally). Cut to 300 hands with the assertions unchanged (f1f055b).
- Round 2: 0 findings (code and security).

### Non-blocking review notes (deliberately not fixed)
- NIT: `rockMove` in `rock.test.ts` re-derives the rule as its oracle. The locked acceptance test covers the boundaries independently.
- NIT (code and security): `view.legalActions.find(...) as Action` in `rock.ts` would return undefined if the "bet only when nothing is owed, raise only when owed" invariant broke. No reachable path today.

## How to try it
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts` (about 8 minutes)
- `npm test`
- `npm run playtest -- --hands 10000 --lineup mixed --size 6 --seed 42`

## Run metrics
Questions 3 (auto-accepted) · assumptions 4 · review rounds 2 · judge rounds: see judge/ · gate runs 3 (all PASS) · escalations 0 · changed lines 384 (7 files).

## Known limitations and follow-ups
- [trainer] Add the CLI re-check of TAG and Rock lines with `--check-styles` for seeds 42, 7, 1234 — already added as an AC on TASK-6.11.
- [trainer] Calling station postflop aggression measures 51-53% against a 10-25% band, so a full `--check-styles` run exits non-zero until TASK-6.17 lands — already recorded as a measurements note on TASK-6.17.
- TAG aggression is 63 against a 65 ceiling, so future advice changes could push it out. The slow test will catch it.

## Lessons for the factory (proposals — not applied)
- The review MAJOR was a pre-existing slow unit test in a file the task touched. A build-stage check that times touched unit files against the 10 s CI limit would catch this before review.
