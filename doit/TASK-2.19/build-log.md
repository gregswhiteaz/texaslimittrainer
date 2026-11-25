## BUILD (2026-11-25)
- `src/ui/styles.css`: `flex-wrap: wrap` on `.config-seats li`, `margin-left: auto` on `.config-style` (D-1, Q-1 right-aligned wrap).
- New `e2e/config-phone-width.spec.ts` (SPEC-01, SPEC-02), 68 lines; at 320 and 375 px with 10 players.
- Confirmed the new spec fails (2 failed, chromium) with the CSS change temporarily removed, passes with it.
- `npm run build && npx playwright test` on the 6 named specs: 30 passed (chromium + webkit).
- `npm test`: 311 files passed / 5 skipped; 1410 tests passed / 46 skipped.
- `npm run lint`: clean (after replacing two non-null assertions). `npm run typecheck`: clean.
- No locked test edited; no markup change.
