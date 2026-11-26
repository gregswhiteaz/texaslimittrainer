## BUILD (2026-11-26)
- SPEC-05/03: `PotResultView.potText` / `.winnersText`; `text` = `${potText} · ${winnersText}`; `Table.tsx` renders the two fields (HandResult `join(` count: 0).
- SPEC-01/02: CSS `.hand-result-title { white-space: nowrap; flex-shrink: 0 }` and `.hand-result:has(> ul[aria-label='Pot winners'])` column layout; single-pot blocks unchanged.
- SPEC-06: `.config-choice label { box-sizing: border-box }` (44 px checked and unchecked, game type and line-up).
- A-2 / orchestrator note on chip totals: the AC line and the spec's exact `Main pot $60 · You win $60` (SPEC-03/04) are both kept, so the main-pot award was not changed. Instead `SPLIT_SIDE_POT_SHOWDOWN` gives Ava's `totalContribution` +$1 (61) and moves the stacks to follow the crafted awards (Ava +39, Ben -39 vs the dealt result). Contributions $20+$60+$61 = awards $60+$81 = $141, and the stacks total equals the dealt scene's; the new unit case asserts both.
- Red check: with the old `styles.css`, `side-pot-result` (Hand over lines 2) and `game-type-height` (Game type heights differ) failed in Chromium; both pass with the fix.
- `npm run format` ok. `npm run lint` ok. `npm run typecheck` ok. `npm test`: 326 files passed / 7 skipped; 1456 tests passed / 52 skipped.
- `npm run build` ok. New + locked e2e (side-pot-result, game-type-height, side-pots, short-stack, showdown-shown, game-type-choice, config-phone-width): 22 passed (chromium + webkit).
- `npm run e2e`: 397 passed, 19 skipped, 0 failed. Locked files from SPEC-07 byte-identical to `main` (`git diff --quiet` ok).
- Scope: 10 files (budget 10); about 319 changed lines vs budget 280 (warn level, not fail). The extra is the chip-reconciling scene and its assertions plus the geometric e2e checks.
