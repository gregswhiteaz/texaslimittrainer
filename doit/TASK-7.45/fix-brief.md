# Fix brief — TASK-7.45 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [BLOCKER] backlog/tasks/task-7.48:locked-repin-list-incomplete (code review)
- Where: backlog/tasks/task-7.48 - Scale-observed-open-raise-and-calling-ranges-by-PFR-and-VPIP-relative-to-a-typical-player.md:29
- Problem: SPEC-04 requires the follow-up's description to name every locked re-pin with its owner. TASK-7.48's description and AC#5 (copied word for word from spec section 5, which inherits the gap from section 3's claim that the relational locked tests survive) omit two locked acceptance files that break under option D: tests/advice/small-table-ranges.acceptance.test.ts AC#1 (owner TASK-7.35) and tests/ui/review-numbers.acceptance.test.tsx (owner TASK-9.3, 2 tests). The unlocked unit test tests/advice/observed-ranges.test.ts 'caps the observed hands at 100' also breaks and isn't listed next to 'scales each line by its stat'.
- Evidence: I applied option D to a scratch copy of HEAD (TYPICAL_VPIP 77.5/24/16.5; open-raise o = relativePfrPct(d, pfr, typicalPfr); calling lines o = relativePfrPct(d, vpip, TYPICAL_VPIP)) and ran vitest without tests/ci, git or toolchain. 11 tests failed. Besides the listed ones: small-table-ranges.acceptance.test.ts:153 'expected 100 to be close to 60' (BTN open-raise at a 4-seat table); review-numbers.acceptance.test.tsx:227 'Equity 34.4%' vs 'Equity 34.3%' and :269 '33.7%' vs '34.3%'; observed-ranges.test.ts:230 'expected 23.76 to be close to 35'. Every listed item failed as predicted, and the floor cases, observed-ranges AC#5/AC#6 and observed-range-tidy AC#1 passed. I did not run e2e/observed-resume.spec.ts.
- Expected fix: Through the CLI (backlog task edit TASK-7.48), add to the description's locked re-pin list 'tests/advice/small-table-ranges.acceptance.test.ts AC#1 (owner TASK-7.35; 4-seat BTN open-raise widthPct pinned to raw PFR 60, under the new rule 100 capped)' and 'tests/ui/review-numbers.acceptance.test.tsx basis-lines and review-repeats-flop-hint tests (owner TASK-9.3; pinned equity 34.3% shifts)', and add those owners to AC#5. Add 'caps the observed hands at 100' to the unlocked list. Also correct the spec section 3 'Relational locked tests ... survive' bullet and the section 5 description/AC#5 text so they stay consistent with the task.


## Orchestrator note (recorded deviation; the locked spec's §3/§5 re-pin list was incomplete)
Fix TASK-7.48 only, via the backlog CLI (don't edit the locked spec):
- Add to its description's locked re-pin list: `tests/advice/small-table-ranges.acceptance.test.ts` AC#1 (owner TASK-7.35; line 153 4-seat BTN open 60 -> 100 under D) and `tests/ui/review-numbers.acceptance.test.tsx` two tests (owner TASK-9.3; lines 227/269 equity strings), and to the unlocked list `tests/advice/observed-ranges.test.ts` "caps the observed hands at 100".
- State that golden spot 6max-turn-bb-call-a6s is no longer clear-cut under D (margin 12.7 < 15) and must be re-tuned with the user's sign-off (AC#6).
- Reword AC#5 so it names the locked files and owners directly instead of pointing to "task notes" (keep its AC number; use `--acceptance-criteria` with the full list in order, as TASK-8.7 did, or an equivalent that preserves numbering).
Record what you changed in build-log.md and changes.md. No product code.
