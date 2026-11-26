---
id: doc-162
title: 'TASK-3.26: Tidy the side-pot hand result layout and pin split-pot rendering'
type: other
created_date: '2026-11-26T13:03:00Z'
updated_date: '2026-11-26T13:03:00Z'
---
# TASK-3.26: Tidy the side-pot hand result layout and pin split-pot rendering

Status: Done · Completed: 2026-11-26 · Epic: TASK-3 — Play hands at the table · Milestone: m-1 · Requirements: n/a (follow-up from TASK-3.8 judge J-1-01/J-1-02, doc-69, and TASK-2.4 judge J-1-02) · Branch: doit/TASK-3.26

## What was asked
Three UI polish items. (1) With side pots, the "Hand over" block squeezed its title and lists into four columns, so "Hand over" wrapped and the shown-hand line was narrow. It must stay on one line and every line must be readable. (2) A split side pot must read exactly "Side pot $81 · Ben wins $41, Ava wins $40" in a render test and in Chromium and WebKit, rendered from the view model's text instead of a join in JSX. (3) The two game-type options must keep the same height when the selection changes (no 2 px jump). Spec: doit/TASK-3.26/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | With side pots the result block stacks: "Hand over" on its own row, then the Pot winners, Winners and Shown hands rows at full width. Without a Pot winners list the block stays one row as before. | Yes | Smallest change that gives each line the full width. Single-pot blocks and locked layout tests stay as they were. | Remove the `:has(> ul[aria-label='Pot winners'])` rule in `src/ui/styles.css` or widen it to always stack. |
| A-2 | The split-pot scene is crafted: SIDE_POT_SHOWDOWN with main $60 to You and side $81 to Ben $41 / Ava $40. Ava's contribution is +$1 and the Ben/Ava stacks follow the awards, so chips reconcile (contributions $141 = awards $141). | Yes | The AC's $81 odd-chip split cannot come from the scripted $20/$60/$60 deal. The orchestrator asked that chip totals reconcile. | Edit `SPLIT_SIDE_POT_SHOWDOWN` in `tests/support/table-scenarios.ts`. |
| A-3 | The height fix is `box-sizing: border-box` on `.config-choice label`. Every option is exactly 44 px checked or not. The Line-up radios share the rule and also stop jumping. | Yes | Matches the 44 px target in the CSS comment. The locked e2e only needs at least 44 px. | Drop the rule (back to 46/48 px) or give the checked option `min-height: 42px`. |
| A-4 | `PotResultView` gains string fields `potText` ("Side pot $81") and `winnersText` ("Ben wins $41, Ava wins $40"); `text` equals `` `${potText} · ${winnersText}` ``. `Table.tsx` renders the two fields in the existing `data-part` spans. | Yes | A locked test reads the two `data-part` spans separately, so one span of `text` would break it. Two view-model strings leave no wording in JSX. | Remove the fields and restore the JSX join (the original J-1-02 finding returns). |

## Clarifications and decisions
- No questions were asked (autopilot run, qa.md).
- D-1: the stacked layout applies only to blocks that have a Pot winners list (the CSS `:has()` selector), not to every result.

## What was built
- `src/table/hand-result.ts`: `PotResultView` gains `potText` and `winnersText`; `text` is built from them.
- `src/ui/table/Table.tsx`: the Pot winners item renders `p.potText` and `p.winnersText`. No `.join(` is left in `HandResult`.
- `src/ui/styles.css`: `.hand-result-title` gets `white-space: nowrap; flex-shrink: 0`. `.hand-result:has(> ul[aria-label='Pot winners'])` stacks the title and lists in full-width rows. `.config-choice label` gets `box-sizing: border-box`.
- `tests/support/table-scenarios.ts`: new `SPLIT_SIDE_POT_SHOWDOWN`.
- `e2e/support/table-scenes.tsx` and `e2e/support/table-harness-bundle.ts`: register scene `split-side-pot`.
- Tests: `tests/table/side-pots.test.ts` (extended), `tests/ui/split-side-pot.acceptance.test.tsx` (new), `e2e/side-pot-result.spec.ts` (new), `e2e/game-type-height.spec.ts` (new).
- No new dependencies, no engine, bot, advice or storage change.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | e2e `side-pot-result.spec.ts` (one-line title, line boxes, widths, no overflow, axe, screenshots) in Chromium and WebKit | PASS | Judge holdouts at 1280 and 1024 wide; screenshots `side-pot-result.png` and `split-side-pot-result.png` viewed and readable |
| SPEC-02 | AC#1 | e2e: single-pot title and Winners overlap vertically | PASS | Block stays `flex-direction: row` in the shown-hands scene |
| SPEC-03 | AC#2 | render test `split-side-pot.acceptance.test.tsx` | PASS | Exact item texts, equal to the view-model fields |
| SPEC-04 | AC#2 | e2e exact two item texts, no http(s) requests | PASS | Chromium and WebKit |
| SPEC-05 | AC#2 | unit test in `side-pots.test.ts`, and the awk `join(` count | PASS | Count is 0 |
| SPEC-06 | AC#3 | e2e `game-type-height.spec.ts` | PASS | Every label measured 44 px (both groups, both browsers, mouse and arrow keys) |
| SPEC-07 | AC#1-3 | lint, typecheck, `npm test`, `npm run e2e`, locked files identical to main | PASS | 1456 unit tests passed, 52 skipped; e2e 397 passed, 19 skipped, 0 failed |

- Red check: with the old `styles.css`, `side-pot-result` and `game-type-height` fail in Chromium. Both pass with the fix.
- Judge round 1: PASS 7/7, no failures, integrity clean. Gate runs: 1.

## Review
No blocking findings (code and security reviews, round 1).

### Non-blocking review notes (deliberately not fixed)
- NIT (code): the SPEC-05 test `pot result text is built from potText and winnersText` also asserts that the split scene's chips reconcile (`tests/table/side-pots.test.ts` ~184-191). That is a different concern, so a failure would name the wrong cause. Optional fix: move those two assertions into their own `it`. Not tracked; it is a test-organisation nit.
- LOW (judge J-1-01): in the scene harness at 1280x720 the stacked side-pot block is about 169 px tall (top 657, bottom 826), so it runs below the 720 px fold. The single-row block fit before. Not required by this spec; see follow-ups.

## How to try it
- `npm test`, then `npx playwright test e2e/side-pot-result.spec.ts e2e/game-type-height.spec.ts`.
- `npm run build && npm run preview`: New game, toggle game type and line-up and check the heights stay constant.

## Run metrics
Questions 0 · assumptions 4 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · send-backs 0 · changed lines about 315 insertions and 4 deletions in src, tests and e2e (budget 280, warn level; 10 files, budget 10). The overrun comes from the chip-reconciling scene and the geometric e2e checks.

## Known limitations and follow-ups
- [trainer] Fit the stacked side-pot result above the fold at 1280x720 (J-1-01). TASK-3.16 (branded table fitting 1280x720) owns this. Its AC#6 (result shown on the felt) and AC#7 (table, result and Deal next hand fit without vertical scrolling) cover the single-pot case but do not name the taller side-pot block. Proposed AC for TASK-3.16: "Given a side-pot hand result (title plus Pot winners, Winners and Shown hands rows, about 169 px tall today) at 1280x720 in Chromium and WebKit, When it is shown with Deal next hand, Then the whole block and the button are visible without vertical scrolling [follow-up from TASK-3.26 J-1-01]".

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- The orchestrator's chip-reconciliation request arrived after the spec was approved, and the spec's A-2 said totals need not reconcile. This cost extra lines (319 vs 280). Proposal: have the spec template's crafted-scenario guidance state "scene chips must reconcile" up front.
- The judge could not run the new e2e test against the old CSS, and relied on the builder's red check. Proposal: have the judge re-run the red check from the build log when it is cheap.
