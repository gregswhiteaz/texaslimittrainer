---
id: doc-180
title: >-
  TASK-7.44: Scale observed three-bet and four-bet ranges by PFR relative to a
  typical player
type: other
created_date: '2026-11-27T06:46:00Z'
updated_date: '2026-11-27T06:46:00Z'
---
# TASK-7.44: Scale observed three-bet and four-bet ranges by PFR relative to a typical player

Status: Ready for Done (not set by Documentor) · Completed: 2026-11-26 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-035 (035.6, 035.2), REQ-046.1 · Branch: doit/TASK-7.44

## What was asked
Until now, every observed three-bet and four-bet line scaled toward raw PFR. A 22/18 player's 6-max UTG four-bet range went from 2.56% to 18% at 100 hands. This story applies the user's TASK-7.29 decision (Q-3 C, decision-5): for those two lines the target is `o = min(100, d × observed PFR ÷ typical PFR)`. Typical PFR is the midpoint of the healthy PFR band (heads-up 57.5, 6-max 18, full ring 12.5). Open-raise keeps raw PFR, calling lines keep raw VPIP, and the blend formula and 30-hand threshold are unchanged. It also closes two TASK-7.43 follow-ups (AC#8): an untested `resizeRange` branch and a tautological locked check. Spec: doit/TASK-7.44/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `src/advice/ranges.ts` exports a `TYPICAL_PFR` constant (57.5 / 18 / 12.5), `typicalPfr(size)` and `relativePfrPct(d, pfr, typical)`. `src/advice` does not import `src/stats`. A drift test asserts each constant equals the midpoint of the matching `HEALTHY_RANGES` PFR band. | yes | The lint boundary (`tools/lint/headless-boundary.js`, TASK-6.27) forbids advice importing `../stats/healthy-ranges`. The constant plus drift test avoids touching that decision. | Widen the lint allow-list and read `HEALTHY_RANGES` directly. |
| A-2 | AC#7's "2.42%" is checked within 0.01. The exact value is 2.4133, asserted to 9 digits plus `\|w − 2.42\| ≤ 0.01`. | yes | 2.42 is the rounded default doubled. | Assert 2.41 or restate the AC. |
| A-3 | The 100% cap is tested on `relativePfrPct` with a synthetic default (d = 30, PFR 90, typical 18 gives 100). An acceptance loop over all shipped re-raise ranges at 3 sizes also checks `min(100, d × PFR ÷ T)`. | yes | No shipped default can reach 100 through `estimateOpponentRanges` (widest: 6-max BTN three-bet 8.90%, heads-up BB three-bet 10.86%). | Add a test-only default range file. |
| A-4 | AC#8 branch: keep the `classes.size === 0` branch of `resizeRange` and cover it with unit tests (empty set at width 0 gives `{AA}`; at width 5 gives `strongestClasses(5)`). | yes | Removing it would change behaviour for an exported function. | Remove the branch. |
| A-5 | The line-143 replacement asserts the CO call-raise default holds 22 and `strongestClasses(60)` does not. | yes | It can fail and drops no assertion. The kept-default property is already asserted at `:148`. | Use a different non-tautological check. |

## Clarifications and decisions
- Q&A: no questions asked (autopilot). The Spec Detective found the advice-to-stats lint conflict and resolved it as A-1.
- D-1: re-raise lines use `min(100, d × PFR ÷ typical PFR)` (user decision, TASK-7.29 Q-3 C). REQ-035.6 already states the rule, so `requirements.md` is untouched.
- D-2: typical PFR follows the view's reference size, so 3, 4, 5 and 7 seats use 6-max (18) and 8–10 seats use full ring (12.5).

## What was built
- `src/advice/ranges.ts`: new `TYPICAL_PFR`, `typicalPfr`, `relativePfrPct`. `OBSERVED_LINE_STAT` maps `three-bet` and `four-bet` to `'relative-pfr'`. `estimateOpponentRanges` computes `o` that way, then blends with the unchanged `scaledWidthPct` and `resizeRange`. Doc comment updated. No new import.
- `tests/advice/observed-reraise.acceptance.test.ts` (new, fast, not in `test:slow`): AC#1–#7 (SPEC-01..04, 06, 11).
- `tests/advice/observed-ranges.test.ts`: line-table case updated for the two re-raise lines (SPEC-07). New tests: SPEC-05, the drift test SPEC-08, empty-default `resizeRange` SPEC-09.
- `tests/advice/observed-resize.acceptance.test.ts`: locked edit under owner TASK-7.43 (SPEC-10). It adds the `strongestClasses` import and replaces the line-143 tautology.
- `docs/advice/range-model.md`: line-to-stat table, a typical-PFR paragraph, and "Known limits" (AC#6).
- Examples at 100 hands: 6-max UTG four-bet PFR 18 / 45 / 9 gives 2.56 / 6.41 / 1.28%. Full-ring UTG four-bet PFR 12.5 / 25 gives 1.21 / 2.41%. Heads-up BB three-bet PFR 75 gives 14.16%.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | AC#1–#3, #7 | New acceptance test (widths, sizes, cap) | PASS | judge round 1 |
| SPEC-04 | AC#4 | Open-raise and call lines unchanged | PASS | judge round 1 |
| SPEC-05, 07 | AC#1–#2 | Unit tests, including the PFR 0 floor | PASS | gates/fix-2.json |
| SPEC-06 | AC#5 | The 4 golden postflop spots parse as clear-cut; golden suites agree | PASS | judge round 1 |
| SPEC-08 | AC#3 | Drift test vs `HEALTHY_RANGES` | PASS | gates/fix-2.json |
| SPEC-09, 10 | AC#8 | Empty-default unit tests; line-143 replacement | PASS | gates/fix-2.json |
| SPEC-11 | AC#6 | Docs updated | PASS | judge round 1 |

- Gate (fix-2): `npm test` exit 0 (338 files passed / 9 skipped; 1516 tests passed / 57 skipped per build log); `ranges.ts` coverage 100% lines, 98.41% branches. `npm run lint` and `npm run typecheck` pass. Spec unchanged, files outside spec none, tests locked.
- Scope budget: lines warn (388 vs 260, fail above 520). Files 5 of 5.
- Judge: round 1 PASS, no failed or unproven AC. One LOW finding (J-1-01).

## Review
Code review round 1: no blocking findings. Security review: none.

### Non-blocking review notes (deliberately not fixed)
- NIT, `tests/advice/observed-reraise.acceptance.test.ts:222`: the comment says parsing throws unless each golden spot "agrees and is clear-cut". The parser only checks clear-cut. Agreement is checked by the golden suites, which pass. Same as judge J-1-01 (LOW).
- NIT: the new acceptance file is 260 lines against about 150 estimated, which pushed the change to 388 lines against a budget of 260. Every block maps to a SPEC item.

## How to try it
- `npx vitest run tests/advice/observed-reraise.acceptance.test.ts tests/advice/observed-ranges.test.ts tests/advice/observed-resize.acceptance.test.ts`
- `npm test && npm run lint && npm run typecheck`

## Run metrics
Questions 0 · assumptions logged 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines 388 (budget 260) across 5 files.

## Known limitations and follow-ups
- [trainer] Position-aware scaling of observed open-raise and calling ranges. Owner: TASK-7.45, an existing task.
- [trainer] Reword the comment at `tests/advice/observed-reraise.acceptance.test.ts:222` to say the parser checks clear-cut only (NIT, J-1-01). No owner task found; the orchestrator can attach it as an AC to TASK-7.45 or a nearby advice task.
- The 100% cap is reachable only with a synthetic default. No shipped default can hit it, so the cap is covered at the helper level.

## Lessons for the factory (proposals — not applied)
- The Spec Detective found the advice-to-stats lint boundary only after the design assumed an import. Proposal: the spec template's "Existing code to reuse" step should check `tools/lint/headless-boundary.js` for each cross-folder import. (Resolved without delay here via A-1.)
- Spec line estimates for new acceptance test files undershot (150 estimated, 260 actual) and tripped the budget warning. Proposal: estimate acceptance test size from the number of AC groups times about 35 lines.

Not tracked (infra, below the value bar): none.
