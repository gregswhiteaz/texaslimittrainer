## BUILD (round 1) — blocked
- Implemented the spec §5 source changes: `configForLineUp` and `botsClockwise` in session.ts, the preset radiogroup in GameConfigScreen.tsx, and `.config-lineup` CSS. `npm run typecheck`: clean.
- `npm run e2e:slow` (run first, as ordered): stopped by me before the 200-hand test finished. So far 14 passed, 0 failed (rapid-pace and responsive-table, Chromium and WebKit).
- `npx vitest run` on the game-type, stake and home tests: 5 failed, 3 passed. The new native radios break locked tests outside Q-2/Q-3: game-type (TASK-2.4, 3 tests) and stake (TASK-2.3, 1 test). Home's exact input list also fails, and fixing it is not a name/label/order edit. Wrote blocked.json (SPEC-11). No locked test was edited.
- No tests were written yet. No background processes are left running.

## BUILD (round 2, after block 1 resolved with option A) — blocked again
- Q-4 edits: game-type test (group by `aria-labelledby="config-game-type"`, `checkedValues` scoped to `name="game-type"`, 5 radio inputs), stake test (5 radio inputs), home test (3 extra `<input ` after the selects). Q-2 edits: home/players unit rows, home.spec, table.spec (new `MIXED_NAMES` for the Game Config test only), players-choice.spec, next-hand.spec name edits (:250, :265, plus :275 "Ben wins $8" → "Cal wins $8", same seat 2 and amount). Q-3 edits: next-hand :236/:238 "Cal wins $50" / "Cal's cards"; action-bar WORDS re-pinned to `9e3779b9 00000001 00000002 000000b8`, found with a temporary vitest search script (deleted) that reproduced the browser's base result first; review.spec winner, entries/grades, badge colours and hand-2 stacks from the browser's output. No assertion was removed.
- New tests: game-config-lineup acceptance (4), lineup-config acceptance (3), lineup-config unit (3), lineup-choice e2e (2 × 2 browsers).
- Playwright on the amended specs: 52 passed (Chromium + WebKit). lineup-choice e2e: 4 passed.
- `npm run e2e:slow` (full run, 1.1 h): 14 passed, 5 skipped, 1 failed. The failure is rapid-pace.spec.ts:311 (200 hands, Chromium), which hit the 65-minute timeout because `foldElseCheck` waits for a Fold button that does not exist when the user's big blind is checked to (hand #16, after a Calling station limped). Escalated per the spec section 11 → blocked.json (SPEC-11).
- `npm test`: 190 files passed / 2 skipped; 686 tests passed / 14 skipped. `npm run lint`: clean after `npm run format`. `npm run typecheck`: clean.
- Not run because of the block: `npm run e2e` ×2 (full) and the gate. No background processes are left.

## BUILD (round 3, after block 2 resolved with Q-5 option A)
- `e2e/rapid-pace.spec.ts`: `foldElseCheck` now clicks Fold only when a Fold button exists (`count() > 0`) and is enabled, else Check. No assertion changed.
- `TLH_SLOW_TESTS=1 npx playwright test e2e/rapid-pace.spec.ts` (same env as `npm run e2e:slow`): 7 passed, 3 skipped (6.2 min). The 200-hand Chromium test passed.
- `npm run e2e` ×2: 150 passed, 12 skipped each time.
- SPEC-13 playtests (`--hands 10000 --seed 42`, lineup mixed/tough/soft): 0 invariant violations each.
- `npm run format`: done. `npm test`: 190 files passed / 2 skipped; 686 tests passed / 14 skipped. `npm run lint`: clean. `npm run typecheck`: clean.
- No temporary files and no background processes are left.
