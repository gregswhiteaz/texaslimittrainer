---
id: doc-206
title: >-
  TASK-7.48: Scale observed open-raise and calling ranges by PFR and VPIP
  relative to a typical player
type: other
created_date: '2026-11-28T21:36:00Z'
updated_date: '2026-11-28T21:36:00Z'
---
# TASK-7.48: Scale observed open-raise and calling ranges by PFR and VPIP relative to a typical player

Status: Done (pending orchestrator) · Completed: 2026-11-28 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-035.6 (as reworded by TASK-7.45) · Branch: doit/TASK-7.48

## What was asked
Follow-up from TASK-7.45 (decision 8, option D). Before this story, an observed opponent's open-raise range scaled toward raw PFR and limp / call-raise / call-three-bet toward raw VPIP. A typical 6-max 24/18 player's BTN open therefore shrank from 34.54% to 18%, and a typical heads-up caller's BTN call-raise grew from 11.76% to 77.5%. Every scaled line now uses `o = min(100, d × stat ÷ typical)`: PFR for open-raise and re-raises, VPIP for limp and the calling lines. `d` is the authored default width and "typical" is the table-size midpoint of the healthy range.

The seven acceptance criteria:
1. 6-max BTN open-raise widths of 34.54 / 86.35 / 17.27 at PFR 18 / 45 / 9.
2. 6-max BB call-raise widths of 41.48 / 69.13 / 20.74 / 100 (capped) at VPIP 24 / 40 / 12 / 60.
3. Typical PFR is 57.5 / 18 / 12.5 and typical VPIP is 77.5 / 24 / 16.5 (heads-up / 6-max / full ring). Heads-up BTN call-raise at VPIP 77.5 stays at 11.76, and full-ring BB call-raise at VPIP 33 gives 55.20.
4. `TYPICAL_VPIP` equals the midpoint of each healthy VPIP range in `src/stats/healthy-ranges.json`.
5. Locked tests that pinned the old raw behaviour are re-pinned (owner unlocks).
6. The four observed golden postflop spots still agree and are clear-cut, or the changed ones are re-tuned with the user's sign-off.
7. `docs/advice/range-model.md` states the relative rule.

Spec: doit/TASK-7.48/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `relativePfrPct` is renamed `relativeStatPct` and used for all five scaled lines. `relativePfrPct` stays as an exported alias. | yes | The task said to reuse it. A locked TASK-7.44 test imports the old name. | Drop the alias once that test is re-pinned. |
| A-2 | `OBSERVED_LINE_STAT` maps limp, call-raise and call-three-bet to `relative-vpip`, and open-raise, three-bet and four-bet to `relative-pfr`. The raw `vpip` / `pfr` values are removed from its type. | yes | Every scaled line is now relative, and dead branches would fail coverage. | Keep the raw values in the type. |
| A-3 | The open-raise doc-row assertion in locked `observed-reraise.acceptance` AC#6 is also re-pinned (owner TASK-7.44). | yes | AC#7 forces that doc row to change. | Not applicable. |
| A-4 | AC#5's "VPIP 100 gives 69.75" is really 69.7587 (truncated in the task text). Tests pin 69.76 at 2 decimals. | yes | It is within 0.01 of both values. | Pin 69.75 instead. |
| A-5 | The sign-off package was written outside the repo, because the builder hook blocks other writes in the work folder. The orchestrator copied it to `signoff.md`. | yes | Tooling constraint. | Not applicable. |
| A-6 | The new acceptance tests carry local copies of the view-building helpers. | yes | Locked files may not import each other's private helpers. | Move the helpers into a shared support module. |
| D-1 | The doc's cap sentence also names the BTN open-raise. Under the new rule it reaches the 100 cap earlier than the spec's sentence implied: at PFR 52.1 for 6-max and 45.8 for full ring. | yes | The spec's wording ("only the widest blind lines") was inaccurate. The reviewer and the judge re-measured these thresholds. | Edit the doc sentence. |

## Clarifications and decisions
- **Q-1 (golden spot 6max-turn-bb-call-a6s, AC#6).** The user chose the Recommended option: re-tune the button to stats 100 hands / VPIP 12 / PFR 9, described as "a tight raiser". The user agreed this counts as the AC#6 sign-off provided the built numbers match. The builder's `signoff.md` shows `Result: MATCH`:

  | Value | Expected | Measured |
  |---|---|---|
  | BTN open-raise width | 17.27 | 17.27 |
  | Hero equity | 45.3 | 45.3 |
  | Raise margin | 19.7 (Major) | 19.7 (Major) |
  | Fold margin | 21.1 (Major) | 21.1 (Major) |
  | Recommended action | call | call |

  The board, hand and line are unchanged.
- **Owner unlocks.** Eight owner/file approvals were made through `doit.py unlock` for re-pinning locked tests:
  - TASK-7.13 and TASK-7.43: `observed-ranges.acceptance`.
  - TASK-7.43: `observed-resize`.
  - TASK-7.44: `observed-reraise`.
  - TASK-7.35: `small-table-ranges`.
  - TASK-9.3 and TASK-7.43: `review-numbers`.
  - TASK-7.14: `postflop-spots.json`.

## What was built
- `src/advice/ranges.ts`:
  - Adds `TYPICAL_VPIP` (77.5 / 24 / 16.5) and `typicalVpip(size)`.
  - Renames `relativePfrPct` to `relativeStatPct`, keeping the old name as an alias.
  - Maps every scaled line to a relative stat in `OBSERVED_LINE_STAT`.
  - Computes `o` as `min(100, d × stat ÷ typical)` for every scaled line.
  - Updates the doc comments.
- `tests/advice/observed-relative.acceptance.test.ts` (new, 4 tests) covers AC#1, 2, 3 and 7.
- `tests/advice/observed-ranges.test.ts` gets a `TYPICAL_VPIP` drift test and two re-pins.
- Locked re-pins, limited to the approved list:
  - `tests/advice/observed-ranges.acceptance.test.ts`
  - `tests/advice/observed-resize.acceptance.test.ts`
  - `tests/advice/observed-reraise.acceptance.test.ts`
  - `tests/advice/small-table-ranges.acceptance.test.ts` (width 60 → 100)
  - `tests/ui/review-numbers.acceptance.test.tsx` (two equity strings)
- `tests/golden/postflop-spots.json`: a6s button stats are now 100/12/9, with a reworded justification.
- `docs/advice/range-model.md` has an updated line-to-stat table, a typical-VPIP paragraph with examples, and Known limits (the per-seat assumption and the cap thresholds).
- The `doit/*/state.json` files for the six owner tasks were written by `doit.py unlock`.
- Bots are unaffected. They drop `observedOpponents`, so the rule never runs for them (REQ-029.2).
- No new dependencies. 356 changed lines.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 to 03 | AC#1 to 3 (widths and typical values) | New acceptance test `observed-relative` | PASS | Judge round 1 |
| SPEC-04 | AC#4 (`TYPICAL_VPIP` drift) | Unit drift test against `healthy-ranges.json` | PASS | Judge round 1 |
| SPEC-05 | AC#5 (locked re-pins) | Re-pinned suites, plus the test-integrity check | PASS | Integrity exit 0; the diff is the generic rule only |
| SPEC-06 | Untouched files unchanged | Diff of those files against main | PASS | Diff is empty |
| SPEC-07 | AC#7 (doc) | Acceptance test, plus the reviewer's and judge's re-measurement of the cap thresholds | PASS | Judge round 1 |
| SPEC-08 | AC#6 (golden spots agree and are clear-cut) | `postflop-lines.acceptance` | PASS | All four spots agree |
| SPEC-09 | Sign-off numbers match Q-1 | `signoff.md` | PASS | `Result: MATCH` |

- `npm test`: 359 files passed (11 skipped), 1595 tests passed, 60 skipped (opt-in slow). Typecheck and lint are clean.
- End to end: the Playwright specs `observed-resume` and `hint-observed` passed 4/4 on chromium. The opt-in slow `observed-resize` file passed 5/5.
- Judge: 110 holdout checks, PASS in round 1 with 9/9 items.
- Gates: 2 runs (build and fix), both PASS.
- Nothing failed at judge, so no fixes were needed there.

## Review
One review round with a code reviewer and a security reviewer. There were no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- Judge J-1-01 (LOW, NIT): the hard wrap in the Known limits section of `docs/advice/range-model.md` is ragged. It is below the value bar.

## How to try it
- `npm test`
- `npx vitest run tests/advice/observed-relative.acceptance.test.ts`
- `TLH_SLOW_TESTS=1 npx vitest run tests/advice/observed-resize.acceptance.test.ts`
- `npx playwright test e2e/observed-resume.spec.ts e2e/hint-observed.spec.ts --project=chromium`

## Run metrics
- Questions: 1 (Q-1).
- Assumptions logged: 6, plus deviation D-1. The state counter shows 0 because the assumptions table lives in the spec.
- Review rounds: 1.
- Judge rounds: 1.
- Gate runs: 2.
- Escalations: 0.
- Sendbacks: 0.
- Changed lines: 356.

## Known limitations and follow-ups
- Per-seat assumption: the default width `d` has one range per position and line. It does not depend on which seat opened (documented in Known limits).
- No follow-ups recommended.
- Not tracked (infra, below the value bar): the builder hook blocks writes in the work folder, so the sign-off had to be written outside it and copied in (A-5). No failure was caused.

## Lessons for the factory (proposals — not applied)
- The spec's cap sentence was inaccurate (it omitted the BTN open-raise). Spec authors should measure any numeric claim they write into docs, as the builder had to here.
- Let the builder write `signoff.md` inside the work folder, or give the spec an official out-of-repo path, to avoid the copy step.
